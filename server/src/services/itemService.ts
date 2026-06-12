// ============================================================
// Item Service (Phase 0 — E1)
// The heart of the universal item system: dice, units, cards,
// relics, blueprints all live in item_instances. Every mutation
// is transaction-safe and writes an item_events audit row.
//
// Composition rule: every mutating method accepts an optional
// PoolClient. When supplied, the work runs inside the caller's
// transaction (so e.g. "burn card + mint unit" is atomic). When
// omitted, the method opens its own transaction().
// ============================================================

import { PoolClient } from 'pg';
import { transaction } from '../config/database';
import {
  ItemInstance,
  ItemInstanceWithDefinition,
  ItemAcquiredVia,
  ItemCategory,
  ItemStatus,
} from '../utils/types';

/** Domain error carrying a stable machine-readable `code`. */
export class ItemError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ItemError';
    this.code = code;
  }
}

/**
 * Run `fn` inside the supplied client, or open a fresh transaction if no
 * client was given. Keeps every mutation composable with outer transactions.
 */
async function withClient<T>(
  client: PoolClient | undefined,
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  if (client) return fn(client);
  return transaction(fn);
}

class ItemService {
  // ---- Mint ----------------------------------------------------------

  /**
   * Create a new item instance from a definition and assign it to an owner.
   *
   * For `category='card'` definitions that belong to a season, a race-safe
   * mint number is allocated: a transaction-level advisory lock keyed on the
   * definition id serialises concurrent mints of the same card, so the
   * COUNT-based numbering can never collide.
   *
   * Always writes a 'minted' item_events row.
   */
  async mintItem(
    definitionId: string,
    ownerId: string,
    acquiredVia: ItemAcquiredVia,
    context: Record<string, any> = {},
    client?: PoolClient,
  ): Promise<ItemInstance> {
    return withClient(client, async (c) => {
      const def = await c.query<{ category: ItemCategory; season: string | null }>(
        `SELECT category, season FROM item_definitions WHERE id = $1`,
        [definitionId],
      );
      if (def.rowCount === 0) {
        throw new ItemError('DEFINITION_NOT_FOUND', `Item definition '${definitionId}' does not exist`);
      }
      const { category, season } = def.rows[0];

      let mintNumber: number | null = null;
      if (category === 'card' && season) {
        // Serialise concurrent mints of THIS definition via a transaction-scoped
        // advisory lock. hashtext() maps the definition id to the bigint lock key.
        // Lock is released automatically at COMMIT/ROLLBACK.
        await c.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [definitionId]);

        const countRes = await c.query<{ cnt: string }>(
          `SELECT COUNT(*)::bigint AS cnt FROM item_instances WHERE definition_id = $1`,
          [definitionId],
        );
        mintNumber = parseInt(countRes.rows[0].cnt, 10) + 1;
      }

      const inserted = await c.query<ItemInstance>(
        `INSERT INTO item_instances
           (definition_id, owner_id, status, mint_number, acquired_via, state, created_at, updated_at)
         VALUES ($1, $2, 'inventory', $3, $4, '{}'::jsonb, NOW(), NOW())
         RETURNING *`,
        [definitionId, ownerId, mintNumber, acquiredVia],
      );
      const instance = inserted.rows[0];

      await c.query(
        `INSERT INTO item_events (instance_id, event, from_user, to_user, context)
         VALUES ($1, 'minted', NULL, $2, $3)`,
        [instance.id, ownerId, JSON.stringify(context)],
      );

      return instance;
    });
  }

  // ---- Transfer ------------------------------------------------------

  /**
   * Transfer ownership of an instance from one user to another.
   *
   * Decision 2026-06-12: there is NO transfer-by-wager. transferItem exists
   * only for future market trades, and is therefore gated on the definition
   * being tradeable. An instance must be in 'inventory' status and owned by
   * `fromUserId`. Writes a 'transferred' item_events row.
   */
  async transferItem(
    instanceId: string,
    fromUserId: string,
    toUserId: string,
    context: Record<string, any> = {},
    client?: PoolClient,
  ): Promise<ItemInstance> {
    return withClient(client, async (c) => {
      const cur = await c.query<{ status: ItemStatus; owner_id: string | null; tradeable: boolean }>(
        `SELECT i.status, i.owner_id, d.tradeable
           FROM item_instances i
           JOIN item_definitions d ON d.id = i.definition_id
          WHERE i.id = $1
          FOR UPDATE OF i`,
        [instanceId],
      );
      if (cur.rowCount === 0) {
        throw new ItemError('INSTANCE_NOT_FOUND', `Item instance '${instanceId}' does not exist`);
      }
      const row = cur.rows[0];

      if (!row.tradeable) {
        throw new ItemError('NOT_TRADEABLE', 'This item type cannot be transferred');
      }
      if (row.status !== 'inventory') {
        throw new ItemError('NOT_TRANSFERABLE', `Item must be in inventory to transfer (is '${row.status}')`);
      }
      if (row.owner_id !== fromUserId) {
        throw new ItemError('NOT_OWNER', 'Item is not owned by the sender');
      }

      const updated = await c.query<ItemInstance>(
        `UPDATE item_instances
            SET owner_id = $2, updated_at = NOW()
          WHERE id = $1
          RETURNING *`,
        [instanceId, toUserId],
      );

      await c.query(
        `INSERT INTO item_events (instance_id, event, from_user, to_user, context)
         VALUES ($1, 'transferred', $2, $3, $4)`,
        [instanceId, fromUserId, toUserId, JSON.stringify(context)],
      );

      return updated.rows[0];
    });
  }

  // ---- Burn ----------------------------------------------------------

  /**
   * Permanently burn an instance. Only 'inventory' or 'deployed' items may be
   * burned. Burn is final: a re-burn throws. Writes a 'burned' item_events row.
   */
  async burnItem(
    instanceId: string,
    ownerId: string,
    context: Record<string, any> = {},
    client?: PoolClient,
  ): Promise<ItemInstance> {
    return withClient(client, async (c) => {
      const cur = await c.query<{ status: ItemStatus; owner_id: string | null }>(
        `SELECT status, owner_id FROM item_instances WHERE id = $1 FOR UPDATE`,
        [instanceId],
      );
      if (cur.rowCount === 0) {
        throw new ItemError('INSTANCE_NOT_FOUND', `Item instance '${instanceId}' does not exist`);
      }
      const row = cur.rows[0];

      if (row.owner_id !== ownerId) {
        throw new ItemError('NOT_OWNER', 'Item is not owned by this user');
      }
      if (row.status === 'burned') {
        throw new ItemError('ALREADY_BURNED', 'Item is already burned');
      }
      if (row.status !== 'inventory' && row.status !== 'deployed') {
        throw new ItemError('NOT_BURNABLE', `Item cannot be burned from status '${row.status}'`);
      }

      const updated = await c.query<ItemInstance>(
        `UPDATE item_instances
            SET status = 'burned', updated_at = NOW()
          WHERE id = $1
          RETURNING *`,
        [instanceId],
      );

      await c.query(
        `INSERT INTO item_events (instance_id, event, from_user, to_user, context)
         VALUES ($1, 'burned', $2, NULL, $3)`,
        [instanceId, ownerId, JSON.stringify(context)],
      );

      return updated.rows[0];
    });
  }

  // ---- Deploy / Recall ----------------------------------------------

  /**
   * Deploy an instance onto a territory (inventory -> deployed). Records the
   * territory id in state.deployed_territory_id. Writes a 'deployed' event.
   */
  async deployItem(
    instanceId: string,
    ownerId: string,
    deployContext: { territoryId: string; [key: string]: any },
    client?: PoolClient,
  ): Promise<ItemInstance> {
    return withClient(client, async (c) => {
      const cur = await c.query<{ status: ItemStatus; owner_id: string | null }>(
        `SELECT status, owner_id FROM item_instances WHERE id = $1 FOR UPDATE`,
        [instanceId],
      );
      if (cur.rowCount === 0) {
        throw new ItemError('INSTANCE_NOT_FOUND', `Item instance '${instanceId}' does not exist`);
      }
      const row = cur.rows[0];

      if (row.owner_id !== ownerId) {
        throw new ItemError('NOT_OWNER', 'Item is not owned by this user');
      }
      if (row.status !== 'inventory') {
        throw new ItemError('NOT_DEPLOYABLE', `Item must be in inventory to deploy (is '${row.status}')`);
      }

      const updated = await c.query<ItemInstance>(
        `UPDATE item_instances
            SET status = 'deployed',
                state = state || jsonb_build_object('deployed_territory_id', $2::text),
                updated_at = NOW()
          WHERE id = $1
          RETURNING *`,
        [instanceId, deployContext.territoryId],
      );

      await c.query(
        `INSERT INTO item_events (instance_id, event, from_user, to_user, context)
         VALUES ($1, 'deployed', $2, NULL, $3)`,
        [instanceId, ownerId, JSON.stringify(deployContext)],
      );

      return updated.rows[0];
    });
  }

  /**
   * Recall a deployed instance back to inventory (deployed -> inventory).
   * Clears state.deployed_territory_id. Writes a 'recalled' event.
   */
  async recallItem(
    instanceId: string,
    ownerId: string,
    context: Record<string, any> = {},
    client?: PoolClient,
  ): Promise<ItemInstance> {
    return withClient(client, async (c) => {
      const cur = await c.query<{ status: ItemStatus; owner_id: string | null }>(
        `SELECT status, owner_id FROM item_instances WHERE id = $1 FOR UPDATE`,
        [instanceId],
      );
      if (cur.rowCount === 0) {
        throw new ItemError('INSTANCE_NOT_FOUND', `Item instance '${instanceId}' does not exist`);
      }
      const row = cur.rows[0];

      if (row.owner_id !== ownerId) {
        throw new ItemError('NOT_OWNER', 'Item is not owned by this user');
      }
      if (row.status !== 'deployed') {
        throw new ItemError('NOT_RECALLABLE', `Item must be deployed to recall (is '${row.status}')`);
      }

      const updated = await c.query<ItemInstance>(
        `UPDATE item_instances
            SET status = 'inventory',
                state = state - 'deployed_territory_id',
                updated_at = NOW()
          WHERE id = $1
          RETURNING *`,
        [instanceId],
      );

      await c.query(
        `INSERT INTO item_events (instance_id, event, from_user, to_user, context)
         VALUES ($1, 'recalled', $2, NULL, $3)`,
        [instanceId, ownerId, JSON.stringify(context)],
      );

      return updated.rows[0];
    });
  }

  // ---- Inventory read ------------------------------------------------

  /**
   * List a user's item instances joined with their definition fields.
   * Optional filters narrow by definition category and/or instance status.
   */
  async getInventory(
    userId: string,
    filters: { category?: ItemCategory; status?: ItemStatus } = {},
    client?: PoolClient,
  ): Promise<ItemInstanceWithDefinition[]> {
    const params: any[] = [userId];
    const conditions: string[] = ['i.owner_id = $1'];

    if (filters.category) {
      params.push(filters.category);
      conditions.push(`d.category = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`i.status = $${params.length}`);
    }

    const sql = `
      SELECT i.id, i.definition_id, i.owner_id, i.status, i.mint_number,
             i.acquired_via, i.state, i.created_at, i.updated_at,
             d.category, d.rarity, d.tradeable,
             d.stats AS def_stats, d.lore
        FROM item_instances i
        JOIN item_definitions d ON d.id = i.definition_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY i.created_at DESC`;

    if (client) {
      const res = await client.query<ItemInstanceWithDefinition>(sql, params);
      return res.rows;
    }
    const res = await transaction((c) => c.query<ItemInstanceWithDefinition>(sql, params));
    return res.rows;
  }

  /**
   * Fetch a single instance (joined with definition) — only if owned by
   * `userId`. Returns null if not found or not owned.
   */
  async getInstanceForOwner(
    instanceId: string,
    userId: string,
    client?: PoolClient,
  ): Promise<ItemInstanceWithDefinition | null> {
    const sql = `
      SELECT i.id, i.definition_id, i.owner_id, i.status, i.mint_number,
             i.acquired_via, i.state, i.created_at, i.updated_at,
             d.category, d.rarity, d.tradeable,
             d.stats AS def_stats, d.lore
        FROM item_instances i
        JOIN item_definitions d ON d.id = i.definition_id
       WHERE i.id = $1 AND i.owner_id = $2`;

    if (client) {
      const res = await client.query<ItemInstanceWithDefinition>(sql, [instanceId, userId]);
      return res.rows[0] ?? null;
    }
    const res = await transaction((c) =>
      c.query<ItemInstanceWithDefinition>(sql, [instanceId, userId]),
    );
    return res.rows[0] ?? null;
  }
}

export const itemService = new ItemService();
export default itemService;

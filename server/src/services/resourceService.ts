// ============================================================
// Resource Service (Phase 0 — E2)
// Resources (energy / tech / intel) are NOT integer columns on
// users — they are a balance (player_resources) plus an
// append-only ledger (resource_transactions). Every credit/debit
// writes a transaction row so economy flows stay auditable.
//
// Composition rule: every mutating method accepts an optional
// PoolClient. When supplied, the work runs inside the caller's
// transaction; when omitted, it opens its own transaction().
// ============================================================

import { PoolClient } from 'pg';
import { transaction } from '../config/database';
import { ResourceType, ResourceTransaction } from '../utils/types';

/** Domain error carrying a stable machine-readable `code`. */
export class ResourceError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ResourceError';
    this.code = code;
  }
}

const RESOURCES: ResourceType[] = ['energy', 'tech', 'intel'];

/**
 * Run `fn` inside the supplied client, or open a fresh transaction if no
 * client was given.
 */
async function withClient<T>(
  client: PoolClient | undefined,
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  if (client) return fn(client);
  return transaction(fn);
}

class ResourceService {
  // ---- Balances ------------------------------------------------------

  /**
   * Return the balance of all three resources for a user. Resources without
   * a row default to 0.
   */
  async getBalances(userId: string): Promise<Record<ResourceType, number>> {
    const res = await transaction((c) =>
      c.query<{ resource: ResourceType; balance: string }>(
        `SELECT resource, balance FROM player_resources WHERE user_id = $1`,
        [userId],
      ),
    );

    const balances: Record<ResourceType, number> = { energy: 0, tech: 0, intel: 0 };
    for (const row of res.rows) {
      if (RESOURCES.includes(row.resource)) {
        balances[row.resource] = parseInt(row.balance, 10);
      }
    }
    return balances;
  }

  // ---- Credit --------------------------------------------------------

  /**
   * Add `amount` (> 0) of a resource to a user's balance and record the
   * ledger entry (+amount). Creates the balance row on first credit.
   */
  async credit(
    userId: string,
    resource: ResourceType,
    amount: number,
    reason: string,
    context: Record<string, any> = {},
    client?: PoolClient,
  ): Promise<number> {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ResourceError('INVALID_AMOUNT', 'Credit amount must be a positive number');
    }

    return withClient(client, async (c) => {
      const upsert = await c.query<{ balance: string }>(
        `INSERT INTO player_resources (user_id, resource, balance)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, resource)
         DO UPDATE SET balance = player_resources.balance + EXCLUDED.balance
         RETURNING balance`,
        [userId, resource, amount],
      );

      await c.query(
        `INSERT INTO resource_transactions (user_id, resource, amount, reason, context)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, resource, amount, reason, JSON.stringify(context)],
      );

      return parseInt(upsert.rows[0].balance, 10);
    });
  }

  // ---- Debit ---------------------------------------------------------

  /**
   * Subtract `amount` (> 0) of a resource from a user's balance, atomically
   * guarding against overdraft: the UPDATE only matches when balance is
   * sufficient. If no row is updated, throws ResourceError('INSUFFICIENT_RESOURCES').
   * Records the ledger entry (-amount).
   */
  async debit(
    userId: string,
    resource: ResourceType,
    amount: number,
    reason: string,
    context: Record<string, any> = {},
    client?: PoolClient,
  ): Promise<number> {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ResourceError('INVALID_AMOUNT', 'Debit amount must be a positive number');
    }

    return withClient(client, async (c) => {
      const updated = await c.query<{ balance: string }>(
        `UPDATE player_resources
            SET balance = balance - $3
          WHERE user_id = $1 AND resource = $2 AND balance >= $3
          RETURNING balance`,
        [userId, resource, amount],
      );

      if (updated.rowCount === 0) {
        throw new ResourceError(
          'INSUFFICIENT_RESOURCES',
          `Insufficient ${resource}: cannot debit ${amount}`,
        );
      }

      await c.query(
        `INSERT INTO resource_transactions (user_id, resource, amount, reason, context)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, resource, -amount, reason, JSON.stringify(context)],
      );

      return parseInt(updated.rows[0].balance, 10);
    });
  }

  // ---- Ledger read ---------------------------------------------------

  /**
   * Return the most recent ledger entries for a user (newest first).
   */
  async getRecentTransactions(
    userId: string,
    limit = 50,
  ): Promise<ResourceTransaction[]> {
    const res = await transaction((c) =>
      c.query<ResourceTransaction>(
        `SELECT id, user_id, resource, amount, reason, context, created_at
           FROM resource_transactions
          WHERE user_id = $1
          ORDER BY created_at DESC, id DESC
          LIMIT $2`,
        [userId, limit],
      ),
    );
    // amount is BIGINT -> string from pg; normalise to number for the API.
    return res.rows.map((r) => ({ ...r, amount: parseInt(r.amount as any, 10) }));
  }
}

export const resourceService = new ResourceService();
export default resourceService;

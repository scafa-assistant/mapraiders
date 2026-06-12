// ============================================================
// Troop Engine (Phase C.1 — Scouts)
// Generic unit-movement plumbing; C.1 ships SCOUTS ONLY.
//
// A scout is a single 'unit' item_instance dispatched from one of the
// player's owned territories to a target cell. It marches cell-by-cell
// (SCOUT_MIN_PER_CELL minutes/cell), reveals a vision disk on arrival
// (24h TTL), may covertly drop a radar on a foreign territory it reaches,
// then auto-returns home where the unit re-enters inventory.
//
// Resolution is BOTH lazy (GET /api/commander/map resolves the caller's due
// movements first) AND cron-driven (troop_arrival_tick every 5 min). Each
// due row is resolved in its OWN transaction with FOR UPDATE SKIP LOCKED so
// concurrent resolvers never collide and one bad row never blocks the rest.
//
// Transaction discipline: silent-zone checks query the pool, so they run
// OUTSIDE any holding tx (dispatchScout checks the target before opening its
// tx; arrival resolution pre-computes the filtered vision cells BEFORE its
// tx, then flips status + writes vision/radar/auto-return ATOMICALLY in one
// transaction — a failure rolls everything back and the next tick retries,
// so a scout unit can never be lost to a transient error).
// ============================================================

import { PoolClient } from 'pg';
import * as h3 from 'h3-js';
import { transaction, query } from '../config/database';
import { COMMANDER, COMBAT, TELEPORT, AI } from '../config/constants';
import { RES_SPAWN, cellForPoint, pathBetween } from './h3Service';
import { resourceService } from './resourceService';
import { visionService } from './visionService';
import { buildingEngine } from './buildingEngine';
import { isInSilentZone } from './silentZoneService';
import { wsService } from './wsService';
import { getContext } from './osmContextService';
import { featureService } from './featureService';
import { battleEngine } from './battleEngine';
import redis from '../config/redis';

/** Domain error carrying a stable machine-readable `code`. */
export class TroopError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'TroopError';
    this.code = code;
  }
}

export interface TroopMovement {
  id: string;
  owner_id: string;
  instance_ids: string[];
  from_cell: string;
  to_cell: string;
  path: string[];
  purpose: string;
  config: Record<string, any>;
  departs_at: Date;
  arrives_at: Date;
  status: string;
  resolved: boolean;
  created_at: Date;
}

export interface DispatchScoutOpts {
  instanceId: string;
  fromTerritoryId: string;
  targetCell?: string;
  target?: { latitude: number; longitude: number };
  buildRadar?: boolean;
}

const MOVEMENT_COLS = `id, owner_id, instance_ids, from_cell, to_cell, path,
  purpose, config, departs_at, arrives_at, status, resolved, created_at`;

class TroopEngine {
  // ---- Dispatch -----------------------------------------------------

  /**
   * Dispatch a scout unit from an owned territory to a target cell.
   *
   * The silent-zone check on the target runs BEFORE the transaction (it
   * queries the pool — never call it while holding a tx client). Everything
   * else runs in one atomic tx: lock the unit, validate ownership/category/
   * status, validate the origin territory, enforce the active-scout cap,
   * build the path, debit energy, mark the unit deployed, insert the movement.
   */
  async dispatchScout(userId: string, opts: DispatchScoutOpts): Promise<TroopMovement> {
    // ---- 1. Resolve + validate target cell (BEFORE any transaction) ----
    let targetCell: string;
    if (opts.targetCell) {
      if (!h3.isValidCell(opts.targetCell)) {
        throw new TroopError('INVALID_TARGET', 'targetCell is not a valid H3 cell');
      }
      targetCell = opts.targetCell;
    } else if (
      opts.target &&
      typeof opts.target.latitude === 'number' &&
      typeof opts.target.longitude === 'number'
    ) {
      targetCell = cellForPoint(opts.target.latitude, opts.target.longitude, RES_SPAWN);
    } else {
      throw new TroopError('INVALID_TARGET', 'A targetCell or target {latitude,longitude} is required');
    }

    // Reject targets inside a silent zone (privacy). Pool query — must be
    // OUTSIDE the transaction below.
    {
      const center = h3.cellToLatLng(targetCell) as [number, number];
      const protectedZone = await isInSilentZone(center[0], center[1]);
      if (protectedZone) {
        throw new TroopError('TARGET_PROTECTED', 'Target is inside a protected silent zone');
      }
    }

    return transaction(async (c) => {
      // ---- 2a. Lock the unit instance + its definition category ----
      const inst = await c.query<{
        id: string;
        owner_id: string | null;
        status: string;
        category: string | null;
      }>(
        `SELECT i.id, i.owner_id, i.status, d.category
           FROM item_instances i
           LEFT JOIN item_definitions d ON d.id = i.definition_id
          WHERE i.id = $1
          FOR UPDATE OF i`,
        [opts.instanceId],
      );
      if (inst.rowCount === 0) {
        throw new TroopError('INSTANCE_NOT_FOUND', 'Unit instance does not exist');
      }
      const unit = inst.rows[0];
      if (unit.owner_id !== userId) {
        throw new TroopError('NOT_OWNER', 'You do not own this unit');
      }
      if (unit.category !== 'unit') {
        throw new TroopError('NOT_A_UNIT', 'This item is not a deployable unit');
      }
      if (unit.status !== 'inventory') {
        throw new TroopError('UNIT_BUSY', `Unit is not in inventory (status '${unit.status}')`);
      }

      // ---- 2b. Load the origin territory (owned + has h3 cells) ----
      const terr = await c.query<{ id: string; h3_cells: string[] | null }>(
        `SELECT id, h3_cells
           FROM territories
          WHERE id = $1 AND owner_id = $2`,
        [opts.fromTerritoryId, userId],
      );
      if (terr.rowCount === 0) {
        throw new TroopError('NO_BASE', 'Origin territory not found or not owned');
      }
      const fromCells = terr.rows[0].h3_cells;
      if (!fromCells || fromCells.length === 0) {
        throw new TroopError('NO_BASE', 'Origin territory has no H3 cells (not backfilled)');
      }
      // Origin = first h3 cell of the territory (deterministic; any owned cell
      // is a valid launch point for C.1 — refine to nearest-to-target later).
      const originCell = fromCells[0];

      // ---- 2c. Active-scout cap (scouts in flight, incl. returning) ----
      const active = await c.query<{ cnt: string }>(
        `SELECT COUNT(*)::bigint AS cnt
           FROM troop_movements
          WHERE owner_id = $1
            AND purpose IN ('scout', 'return')
            AND status = 'marching'`,
        [userId],
      );
      if (parseInt(active.rows[0].cnt, 10) >= COMMANDER.MAX_ACTIVE_SCOUTS) {
        throw new TroopError('TOO_MANY_SCOUTS', 'Too many scouts already in flight');
      }

      // ---- 2d. Build the path ----
      let path: string[];
      try {
        path = pathBetween(originCell, targetCell);
      } catch {
        // pathBetween rethrows Error('PATH_FAILED') on pentagon/distant cells.
        throw new TroopError('TARGET_TOO_FAR', 'No valid path to the target');
      }
      if (path.length === 0 || path.length > COMMANDER.MAX_PATH_CELLS) {
        throw new TroopError('TARGET_TOO_FAR', 'Target is too far to scout');
      }

      // ---- 2e. Debit energy (INSUFFICIENT_RESOURCES bubbles to the route) ----
      await resourceService.debit(
        userId,
        'energy',
        path.length * COMMANDER.SCOUT_ENERGY_PER_CELL,
        'scout_dispatch',
        { targetCell },
        c,
      );

      // ---- 2f. Mark the unit deployed ----
      await c.query(
        `UPDATE item_instances SET status = 'deployed', updated_at = NOW() WHERE id = $1`,
        [unit.id],
      );

      // ---- 2g. Insert the movement ----
      const travelMin = path.length * COMMANDER.SCOUT_MIN_PER_CELL;
      const inserted = await c.query<TroopMovement>(
        `INSERT INTO troop_movements
           (owner_id, instance_ids, from_cell, to_cell, path, purpose, config,
            departs_at, arrives_at, status)
         VALUES ($1, $2, $3, $4, $5, 'scout', $6,
                 NOW(), NOW() + ($7 || ' minutes')::interval, 'marching')
         RETURNING ${MOVEMENT_COLS}`,
        [
          userId,
          [unit.id],
          originCell,
          targetCell,
          path,
          JSON.stringify({ build_radar: !!opts.buildRadar }),
          String(travelMin),
        ],
      );
      return inserted.rows[0];
    });
  }

  // ---- Deployment (garrison) ----------------------------------------

  /**
   * Deploy a unit instance into a territory's garrison (inventory -> deployed).
   * One atomic tx: lock the instance (owned, category 'unit', status
   * 'inventory'), verify the territory is owned by the user, enforce the
   * garrison cap, flip the instance to 'deployed', insert the garrison row.
   */
  async deployUnit(
    userId: string,
    opts: { instanceId: string; territoryId: string },
  ): Promise<{
    id: string;
    instance_id: string;
    territory_id: string;
    owner_id: string;
    role: string;
    created_at: Date;
  }> {
    return transaction(async (c) => {
      const inst = await c.query<{
        id: string;
        owner_id: string | null;
        status: string;
        category: string | null;
      }>(
        `SELECT i.id, i.owner_id, i.status, d.category
           FROM item_instances i
           LEFT JOIN item_definitions d ON d.id = i.definition_id
          WHERE i.id = $1
          FOR UPDATE OF i`,
        [opts.instanceId],
      );
      if (inst.rowCount === 0) {
        throw new TroopError('INSTANCE_NOT_FOUND', 'Unit instance does not exist');
      }
      const unit = inst.rows[0];
      if (unit.owner_id !== userId) {
        throw new TroopError('NOT_OWNER', 'You do not own this unit');
      }
      if (unit.category !== 'unit') {
        throw new TroopError('NOT_A_UNIT', 'This item is not a deployable unit');
      }
      if (unit.status !== 'inventory') {
        throw new TroopError('UNIT_BUSY', `Unit is not in inventory (status '${unit.status}')`);
      }

      const terr = await c.query<{ id: string }>(
        `SELECT id FROM territories WHERE id = $1 AND owner_id = $2 FOR UPDATE`,
        [opts.territoryId, userId],
      );
      if (terr.rowCount === 0) {
        throw new TroopError('NOT_TERRITORY_OWNER', 'Territory not found or not owned');
      }

      // C.3: an active garrison building raises the cap by its tier's bonus
      // slots. Effects are read INSIDE this tx (client passed) so we never
      // open a second pool connection while holding the territory lock.
      const effects = await buildingEngine.getTerritoryEffects(opts.territoryId, c);
      const cap = COMBAT.MAX_GARRISON + effects.garrisonBonusSlots;

      const cnt = await c.query<{ cnt: string }>(
        `SELECT COUNT(*)::bigint AS cnt FROM troop_deployments WHERE territory_id = $1`,
        [opts.territoryId],
      );
      if (parseInt(cnt.rows[0].cnt, 10) >= cap) {
        throw new TroopError('GARRISON_FULL', 'Territory garrison is full');
      }

      await c.query(
        `UPDATE item_instances SET status = 'deployed', updated_at = NOW() WHERE id = $1`,
        [unit.id],
      );

      const inserted = await c.query(
        `INSERT INTO troop_deployments (instance_id, territory_id, owner_id, role)
         VALUES ($1, $2, $3, 'garrison')
         RETURNING id, instance_id, territory_id, owner_id, role, created_at`,
        [unit.id, opts.territoryId, userId],
      );
      return inserted.rows[0];
    });
  }

  /**
   * Remove a unit from a garrison (deployed -> inventory). One atomic tx:
   * lock the deployment by instance id, verify ownership, delete it, flip the
   * instance back to inventory.
   */
  async undeployUnit(userId: string, opts: { instanceId: string }): Promise<void> {
    return transaction(async (c) => {
      const dep = await c.query<{ id: string; owner_id: string }>(
        `SELECT id, owner_id FROM troop_deployments WHERE instance_id = $1 FOR UPDATE`,
        [opts.instanceId],
      );
      if (dep.rowCount === 0) {
        throw new TroopError('DEPLOYMENT_NOT_FOUND', 'No garrison deployment for this unit');
      }
      if (dep.rows[0].owner_id !== userId) {
        throw new TroopError('NOT_OWNER', 'You do not own this deployment');
      }

      await c.query(`DELETE FROM troop_deployments WHERE id = $1`, [dep.rows[0].id]);
      await c.query(
        `UPDATE item_instances SET status = 'inventory', updated_at = NOW() WHERE id = $1`,
        [opts.instanceId],
      );
    });
  }

  // ---- Equip dice ---------------------------------------------------

  /**
   * Equip a die: clears `equipped` on all of the user's other dice (only one
   * die is active at a time), sets `equipped=true` on the chosen one. The
   * instance must be owned, category 'dice', status 'inventory'.
   */
  async equipDie(userId: string, instanceId: string): Promise<void> {
    return transaction(async (c) => {
      const inst = await c.query<{
        id: string;
        owner_id: string | null;
        status: string;
        category: string | null;
      }>(
        `SELECT i.id, i.owner_id, i.status, d.category
           FROM item_instances i
           LEFT JOIN item_definitions d ON d.id = i.definition_id
          WHERE i.id = $1
          FOR UPDATE OF i`,
        [instanceId],
      );
      if (inst.rowCount === 0) {
        throw new TroopError('INSTANCE_NOT_FOUND', 'Die instance does not exist');
      }
      const die = inst.rows[0];
      if (die.owner_id !== userId) {
        throw new TroopError('NOT_OWNER', 'You do not own this die');
      }
      if (die.category !== 'dice') {
        throw new TroopError('NOT_A_DIE', 'This item is not a die');
      }
      if (die.status !== 'inventory') {
        throw new TroopError('DIE_BUSY', `Die is not in inventory (status '${die.status}')`);
      }

      // Clear 'equipped' on every other die of this user (JSONB minus operator).
      await c.query(
        `UPDATE item_instances i
            SET state = i.state - 'equipped', updated_at = NOW()
           FROM item_definitions d
          WHERE i.definition_id = d.id
            AND i.owner_id = $1
            AND d.category = 'dice'
            AND i.id <> $2`,
        [userId, instanceId],
      );
      // Set 'equipped' on the chosen die.
      await c.query(
        `UPDATE item_instances
            SET state = jsonb_set(state, '{equipped}', 'true'::jsonb), updated_at = NOW()
          WHERE id = $1`,
        [instanceId],
      );
    });
  }

  // ---- March (attack / reinforce) -----------------------------------

  /**
   * March 1..MAX_MARCH_UNITS units from an owned territory to a target.
   *
   * PRE-TX (pool ok): resolve + validate the target territory and the naval
   * water rule (getContext queries the pool — never while holding a tx). attack
   * requires an enemy-owned target; reinforce requires a self-owned target.
   * TX: lock instances, debit energy, flip to 'deployed', insert the movement.
   * Post-tx: on attack dispatch, notify the DEFENDER (`under_attack`).
   */
  async marchUnits(
    userId: string,
    opts: {
      instanceIds: string[];
      fromTerritoryId: string;
      targetTerritoryId: string;
      purpose: 'attack' | 'reinforce';
    },
  ): Promise<TroopMovement> {
    const { instanceIds, fromTerritoryId, targetTerritoryId, purpose } = opts;

    if (purpose !== 'attack' && purpose !== 'reinforce') {
      throw new TroopError('INVALID_PURPOSE', "purpose must be 'attack' or 'reinforce'");
    }
    if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
      throw new TroopError('INVALID_UNITS', 'At least one unit is required');
    }
    if (instanceIds.length > COMBAT.MAX_MARCH_UNITS) {
      throw new TroopError('TOO_MANY_UNITS', `At most ${COMBAT.MAX_MARCH_UNITS} units may march`);
    }

    // ---- PRE-TX: target territory (pool ok) ----
    const targetRes = await query<{
      id: string;
      owner_id: string | null;
      h3_cells: string[] | null;
    }>(
      `SELECT id, owner_id, h3_cells FROM territories WHERE id = $1`,
      [targetTerritoryId],
    );
    if (targetRes.rowCount === 0) {
      throw new TroopError('TARGET_NOT_FOUND', 'Target territory does not exist');
    }
    const target = targetRes.rows[0];
    const targetCells = target.h3_cells;
    if (!targetCells || targetCells.length === 0) {
      throw new TroopError('TARGET_NOT_FOUND', 'Target territory has no H3 cells (not backfilled)');
    }
    const targetCell0 = targetCells[0];
    const defenderId = target.owner_id;

    if (purpose === 'attack') {
      if (!defenderId) {
        // Unowned land cannot be assaulted (nothing to take from a battle).
        throw new TroopError('TARGET_NOT_FOUND', 'Target territory is unowned');
      }
      if (defenderId === userId) {
        throw new TroopError('CANNOT_ATTACK_SELF', 'You cannot attack your own territory');
      }
    } else {
      if (defenderId !== userId) {
        throw new TroopError('NOT_TERRITORY_OWNER', 'You can only reinforce your own territory');
      }
    }

    // ---- PRE-TX: origin territory (own, has cells) ----
    const originRes = await query<{ id: string; h3_cells: string[] | null }>(
      `SELECT id, h3_cells FROM territories WHERE id = $1 AND owner_id = $2`,
      [fromTerritoryId, userId],
    );
    if (originRes.rowCount === 0) {
      throw new TroopError('NO_BASE', 'Origin territory not found or not owned');
    }
    const originCells = originRes.rows[0].h3_cells;
    if (!originCells || originCells.length === 0) {
      throw new TroopError('NO_BASE', 'Origin territory has no H3 cells (not backfilled)');
    }
    const originCell = originCells[0];

    // ---- PRE-TX: naval rule (getContext queries the pool) ----
    // Load the units' domains to decide if any unit is naval. This is a plain
    // pool read; the authoritative lock happens later in the tx.
    const domainRes = await query<{ domain: string | null }>(
      `SELECT d.stats->>'domain' AS domain
         FROM item_instances i
         JOIN item_definitions d ON d.id = i.definition_id
        WHERE i.id = ANY($1) AND i.owner_id = $2`,
      [instanceIds, userId],
    );
    const hasNaval = domainRes.rows.some((r) => r.domain === 'naval');
    if (hasNaval) {
      const ctx = await getContext(targetCell0);
      if (ctx.biome !== 'water') {
        throw new TroopError('NAVAL_REQUIRES_WATER', 'Naval units can only target water cells');
      }
    }

    // ---- PRE-TX: path ----
    let path: string[];
    try {
      path = pathBetween(originCell, targetCell0);
    } catch {
      throw new TroopError('TARGET_TOO_FAR', 'No valid path to the target');
    }
    if (path.length === 0 || path.length > COMMANDER.MAX_PATH_CELLS) {
      throw new TroopError('TARGET_TOO_FAR', 'Target is too far to march to');
    }

    // ---- PRE-TX: teleporter fast-path eligibility (pool read) ----
    // A reinforce between two of the user's OWN territories that BOTH have an
    // active teleporter travels in a flat TELEPORT.TRAVEL_MIN minutes for a
    // flat per-unit energy cost. Attacks never teleport. This is only a hint:
    // the authoritative re-check happens inside the tx (TOCTOU guard).
    let teleportCandidate = false;
    if (purpose === 'reinforce' && defenderId === userId) {
      const tp = await query<{ cnt: string }>(
        `SELECT COUNT(*)::bigint AS cnt
           FROM buildings
          WHERE territory_id = ANY($1)
            AND owner_id = $2
            AND type = 'teleporter'
            AND status = 'active'
            AND COALESCE((config->>'covert')::boolean, FALSE) IS NOT TRUE`,
        [[fromTerritoryId, targetTerritoryId], userId],
      );
      // Need one active teleporter on EACH of the two distinct territories.
      teleportCandidate =
        fromTerritoryId !== targetTerritoryId && parseInt(tp.rows[0].cnt, 10) >= 2;
    }

    const result = await transaction(async (c) => {
      // ---- Lock all instances (owned, category 'unit', status 'inventory') ----
      const locked = await c.query<{
        id: string;
        owner_id: string | null;
        status: string;
        category: string | null;
      }>(
        `SELECT i.id, i.owner_id, i.status, d.category
           FROM item_instances i
           LEFT JOIN item_definitions d ON d.id = i.definition_id
          WHERE i.id = ANY($1)
          FOR UPDATE OF i`,
        [instanceIds],
      );
      if (locked.rowCount !== instanceIds.length) {
        throw new TroopError('INVALID_UNITS', 'One or more units do not exist');
      }
      for (const u of locked.rows) {
        if (u.owner_id !== userId) {
          throw new TroopError('NOT_OWNER', 'You do not own one of these units');
        }
        if (u.category !== 'unit') {
          throw new TroopError('INVALID_UNITS', 'One of these items is not a unit');
        }
        if (u.status !== 'inventory') {
          throw new TroopError('UNIT_BUSY', 'One of these units is not in inventory');
        }
      }

      // ---- Re-verify teleporter eligibility under lock (TOCTOU guard) ----
      // Ownership or a teleporter could have changed between the pre-tx read
      // and now; re-check with the tx client before granting the fast-path.
      let teleport = false;
      if (teleportCandidate) {
        const tpRes = await c.query<{ cnt: string }>(
          `SELECT COUNT(DISTINCT b.territory_id)::bigint AS cnt
             FROM buildings b
             JOIN territories t ON t.id = b.territory_id
            WHERE b.territory_id = ANY($1)
              AND b.owner_id = $2
              AND b.type = 'teleporter'
              AND b.status = 'active'
              AND COALESCE((b.config->>'covert')::boolean, FALSE) IS NOT TRUE
              AND t.owner_id = $2`,
          [[fromTerritoryId, targetTerritoryId], userId],
        );
        teleport = parseInt(tpRes.rows[0].cnt, 10) >= 2;
      }

      // ---- Debit energy ----
      // Teleport: flat per-unit cost. March: path length × unit count × rate.
      const energyCost = teleport
        ? instanceIds.length * TELEPORT.ENERGY_PER_UNIT
        : path.length * instanceIds.length * COMBAT.MARCH_ENERGY_PER_CELL_PER_UNIT;
      await resourceService.debit(
        userId,
        'energy',
        energyCost,
        'troop_march',
        { targetTerritoryId, purpose, teleport },
        c,
      );

      // ---- Flip instances to deployed (in flight) ----
      await c.query(
        `UPDATE item_instances SET status = 'deployed', updated_at = NOW()
          WHERE id = ANY($1)`,
        [instanceIds],
      );

      // ---- Insert the movement ----
      // Teleport collapses the path to [origin, target] and the travel time to
      // a flat TELEPORT.TRAVEL_MIN minutes.
      const movePath = teleport ? [originCell, targetCell0] : path;
      const travelMin = teleport
        ? TELEPORT.TRAVEL_MIN
        : path.length * COMBAT.MARCH_MIN_PER_CELL;
      const moveConfig: Record<string, any> = { target_territory_id: targetTerritoryId };
      if (teleport) moveConfig.teleport = true;
      const inserted = await c.query<TroopMovement>(
        `INSERT INTO troop_movements
           (owner_id, instance_ids, from_cell, to_cell, path, purpose, config,
            departs_at, arrives_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7,
                 NOW(), NOW() + ($8 || ' minutes')::interval, 'marching')
         RETURNING ${MOVEMENT_COLS}`,
        [
          userId,
          instanceIds,
          originCell,
          targetCell0,
          movePath,
          purpose,
          JSON.stringify(moveConfig),
          String(travelMin),
        ],
      );
      return inserted.rows[0];
    });

    // ---- Post-tx WS: warn the defender of an inbound assault ----
    if (purpose === 'attack' && defenderId) {
      try {
        wsService.sendToUser(defenderId, 'under_attack', {
          territory_id: targetTerritoryId,
          eta: result.arrives_at,
          units: instanceIds.length,
        });
      } catch {
        /* non-critical */
      }
    }

    return result;
  }

  // ---- Reads (garrison) ---------------------------------------------

  /**
   * Garrison units defending a territory. Accepts an optional client so callers
   * holding a tx can read consistently.
   */
  async getGarrison(
    territoryId: string,
    client?: PoolClient,
  ): Promise<{ instance_id: string; definition_id: string }[]> {
    const sql = `
      SELECT td.instance_id, i.definition_id
        FROM troop_deployments td
        JOIN item_instances i ON i.id = td.instance_id
       WHERE td.territory_id = $1
       ORDER BY td.created_at ASC`;
    if (client) {
      const res = await client.query<{ instance_id: string; definition_id: string }>(sql, [
        territoryId,
      ]);
      return res.rows;
    }
    const res = await transaction((c) =>
      c.query<{ instance_id: string; definition_id: string }>(sql, [territoryId]),
    );
    return res.rows;
  }

  // ---- Recall -------------------------------------------------------

  /**
   * Recall a marching scout. Computes its current cell from elapsed time,
   * cancels the outbound movement, and creates a 'return' movement from the
   * current cell back to the origin along the reversed partial path.
   * Returns the new return movement.
   */
  async recallScout(userId: string, movementId: string): Promise<TroopMovement> {
    return transaction(async (c) => {
      const cur = await c.query<TroopMovement>(
        `SELECT ${MOVEMENT_COLS} FROM troop_movements WHERE id = $1 FOR UPDATE`,
        [movementId],
      );
      if (cur.rowCount === 0) {
        throw new TroopError('MOVEMENT_NOT_FOUND', 'Movement does not exist');
      }
      const mv = cur.rows[0];
      if (mv.owner_id !== userId) {
        throw new TroopError('NOT_OWNER', 'You do not own this movement');
      }
      if (mv.purpose !== 'scout' || mv.status !== 'marching' || mv.resolved) {
        throw new TroopError('NOT_RECALLABLE', 'This scout cannot be recalled');
      }

      // ---- Progress by time -> current cell index ----
      const departs = new Date(mv.departs_at).getTime();
      const arrives = new Date(mv.arrives_at).getTime();
      const span = Math.max(1, arrives - departs);
      const progress = Math.min(1, Math.max(0, (Date.now() - departs) / span));
      const len = mv.path.length;
      const idx = len <= 1 ? 0 : Math.floor(progress * (len - 1));
      const currentCell = mv.path[idx];

      // ---- Mark the outbound movement cancelled + resolved ----
      await c.query(
        `UPDATE troop_movements
            SET status = 'cancelled', resolved = TRUE
          WHERE id = $1`,
        [mv.id],
      );

      // ---- Build the return path: reversed slice from current -> origin ----
      // path[0..idx] is current->origin once reversed.
      const returnPath = mv.path.slice(0, idx + 1).reverse();
      const safePath = returnPath.length > 0 ? returnPath : [currentCell];
      const travelMin = safePath.length * COMMANDER.SCOUT_MIN_PER_CELL;

      const inserted = await c.query<TroopMovement>(
        `INSERT INTO troop_movements
           (owner_id, instance_ids, from_cell, to_cell, path, purpose, config,
            departs_at, arrives_at, status)
         VALUES ($1, $2, $3, $4, $5, 'return', $6,
                 NOW(), NOW() + ($7 || ' minutes')::interval, 'marching')
         RETURNING ${MOVEMENT_COLS}`,
        [
          userId,
          mv.instance_ids,
          currentCell,
          mv.from_cell,
          safePath,
          JSON.stringify({ recalled_from: mv.id }),
          String(travelMin),
        ],
      );
      return inserted.rows[0];
    });
  }

  // ---- Resolve due movements (lazy + cron) --------------------------

  /**
   * Resolve every due movement (arrived). Each row is locked and processed in
   * its own transaction (FOR UPDATE SKIP LOCKED) with a per-row try/catch so a
   * single failure never blocks the batch. When `ownerId` is given, only that
   * owner's movements are resolved (lazy path from GET /map). Returns the count
   * of movements successfully resolved.
   */
  async resolveDueMovements(opts?: { ownerId?: string }): Promise<number> {
    const ownerId = opts?.ownerId;

    // Snapshot the ids of currently-due rows (no lock held across the loop).
    const due = await transaction((c) =>
      c.query<{ id: string }>(
        `SELECT id FROM troop_movements
          WHERE status = 'marching' AND resolved = FALSE AND arrives_at <= NOW()
            ${ownerId ? 'AND owner_id = $1' : ''}
          ORDER BY arrives_at ASC
          LIMIT 500`,
        ownerId ? [ownerId] : [],
      ),
    );

    let resolved = 0;
    for (const row of due.rows) {
      try {
        const did = await this.resolveOne(row.id);
        if (did) resolved++;
      } catch (err: any) {
        console.error(`[Troop] resolve movement ${row.id} failed:`, err?.message ?? err);
      }
    }
    return resolved;
  }

  /**
   * Resolve a single movement by id. Returns true if this call resolved it.
   * Re-checks due-ness under the row lock (SKIP LOCKED) so concurrent
   * resolvers and the snapshot race are both safe.
   */
  private async resolveOne(movementId: string): Promise<boolean> {
    // Pre-read (NO lock): we need purpose/to_cell to pre-compute the
    // silent-zone-filtered vision disk BEFORE the transaction — the filter
    // queries the pool and must never run while a tx client is held.
    const peek = await query<TroopMovement>(
      `SELECT ${MOVEMENT_COLS}
         FROM troop_movements
        WHERE id = $1
          AND status = 'marching' AND resolved = FALSE AND arrives_at <= NOW()`,
      [movementId],
    );
    if (peek.rowCount === 0) return false;
    const peekPurpose = peek.rows[0].purpose;
    const visionCells =
      peekPurpose === 'scout'
        ? await visionService.filterScoutVisionCells(peek.rows[0].to_cell)
        : [];

    // PRE-TX pool read: for an attack arrival, the live winner dice-drop
    // probability comes from the `commander` flag's config (battleEngine stays
    // pool-free, so we read it here and pass it in).
    let diceDropP: number = COMBAT.DICE_DROP_P;
    if (peekPurpose === 'attack') {
      try {
        const flags = await featureService.getAllFlags();
        const commander = flags.find((f) => f.key === 'commander');
        const cfg = (commander?.config ?? {}) as Record<string, unknown>;
        if (typeof cfg.dice_drop_p === 'number') diceDropP = cfg.dice_drop_p;
      } catch {
        /* keep default */
      }

      // Phase D: when the AI system user is the attacker, never roll a dice
      // drop. The AI has no use for minted dice and a win would otherwise
      // wastefully mint an item_instance to the system account. Surgical,
      // pool-free (we already have the peeked owner_id) — keeps the assault
      // path identical for human attackers.
      if (peek.rows[0].owner_id === AI.USER_ID) {
        diceDropP = 0;
      }

      // Anti-farm: cap dice-drop chances per (attacker, target territory) per
      // day. Beyond the cap battles still resolve, but with drop chance 0 —
      // grinding a parked second-account garrison stops yielding dice.
      try {
        const targetTerritoryId = String(
          (peek.rows[0].config ?? {}).target_territory_id ?? '',
        );
        if (targetTerritoryId) {
          const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const capKey = `battle:dropcap:${peek.rows[0].owner_id}:${targetTerritoryId}:${day}`;
          const wins = parseInt((await redis.get(capKey)) ?? '0', 10);
          if (wins >= COMBAT.DROP_CAP_PER_TARGET_PER_DAY) diceDropP = 0;
        }
      } catch {
        /* Redis hiccup: keep the configured probability (fail open) */
      }
    }

    // SINGLE atomic tx: lock + re-check, flip status, and ALL side effects
    // (inventory flip / vision upsert / covert radar / battle / auto-return).
    // A failure rolls everything back together — the movement stays unresolved
    // and the next tick retries; no unit can be lost or duplicated.
    type ResolveCtx =
      | {
          kind: 'scout';
          ownerId: string;
          toCell: string;
          instanceIds: string[];
          buildResult: 'placed' | 'no_target' | 'skipped';
        }
      | {
          kind: 'return';
          ownerId: string;
          toCell: string;
          instanceIds: string[];
        }
      | {
          kind: 'battle';
          ownerId: string;
          defenderId: string;
          territoryId: string;
          battleId: string;
          winnerSide: 'attacker' | 'defender';
        }
      | {
          kind: 'reinforce';
          ownerId: string;
          toCell: string;
          instanceIds: string[];
        }
      | null;

    const ctx: ResolveCtx = await transaction(async (c) => {
      const locked = await c.query<TroopMovement>(
        `SELECT ${MOVEMENT_COLS}
           FROM troop_movements
          WHERE id = $1
            AND status = 'marching' AND resolved = FALSE AND arrives_at <= NOW()
          FOR UPDATE SKIP LOCKED`,
        [movementId],
      );
      if (locked.rowCount === 0) return null; // already taken / not due
      const mv = locked.rows[0];

      const knownPurpose =
        mv.purpose === 'scout' ||
        mv.purpose === 'return' ||
        mv.purpose === 'attack' ||
        mv.purpose === 'reinforce';
      if (!knownPurpose) {
        // Unknown future purpose — forward-compat no-op so it does not pile up.
        console.warn(
          `[Troop] purpose '${mv.purpose}' not implemented — marking arrived (no-op). id=${mv.id}`,
        );
        await c.query(
          `UPDATE troop_movements SET status = 'arrived', resolved = TRUE WHERE id = $1`,
          [mv.id],
        );
        return null;
      }

      await c.query(
        `UPDATE troop_movements SET status = 'arrived', resolved = TRUE WHERE id = $1`,
        [mv.id],
      );

      if (mv.purpose === 'return') {
        // Units re-enter inventory in the same tx.
        await c.query(
          `UPDATE item_instances
              SET status = 'inventory', updated_at = NOW()
            WHERE id = ANY($1) AND status = 'deployed'`,
          [mv.instance_ids],
        );
        return {
          kind: 'return' as const,
          ownerId: mv.owner_id,
          toCell: mv.to_cell,
          instanceIds: mv.instance_ids,
        };
      }

      // ---- 'attack' arrival ----
      if (mv.purpose === 'attack') {
        const targetTerritoryId =
          mv.config && typeof mv.config.target_territory_id === 'string'
            ? mv.config.target_territory_id
            : null;

        // Re-load the target FOR UPDATE: ownership may have changed in transit.
        const terr = targetTerritoryId
          ? await c.query<{ id: string; owner_id: string | null }>(
              `SELECT id, owner_id FROM territories WHERE id = $1 FOR UPDATE`,
              [targetTerritoryId],
            )
          : { rowCount: 0, rows: [] as { id: string; owner_id: string | null }[] };

        const defenderId =
          terr.rowCount && terr.rowCount > 0 ? terr.rows[0].owner_id : null;

        // Walkover-no-battle: target gone, now unowned, or now owned by the
        // attacker (e.g. taken by decay/another assault). No battle row — just
        // send everyone home.
        if (!defenderId || defenderId === mv.owner_id) {
          await this.insertAutoReturnMarch(c, mv, mv.instance_ids);
          return null;
        }

        const result = await battleEngine.resolveAssault(c, {
          attackerId: mv.owner_id,
          defenderId,
          territoryId: terr.rows[0].id,
          attackerInstanceIds: mv.instance_ids,
          diceDropP,
        });

        // Surviving attacker units march home; destroyed ones are already
        // status='destroyed' and excluded.
        await this.insertAutoReturnMarch(c, mv, result.survivorsAttacker);

        return {
          kind: 'battle' as const,
          ownerId: mv.owner_id,
          defenderId,
          territoryId: terr.rows[0].id,
          battleId: result.battleId,
          winnerSide: result.winnerSide,
        };
      }

      // ---- 'reinforce' arrival ----
      if (mv.purpose === 'reinforce') {
        const targetTerritoryId =
          mv.config && typeof mv.config.target_territory_id === 'string'
            ? mv.config.target_territory_id
            : null;

        const terr = targetTerritoryId
          ? await c.query<{ id: string; owner_id: string | null }>(
              `SELECT id, owner_id FROM territories WHERE id = $1 FOR UPDATE`,
              [targetTerritoryId],
            )
          : { rowCount: 0, rows: [] as { id: string; owner_id: string | null }[] };

        const stillOwn =
          terr.rowCount && terr.rowCount > 0 && terr.rows[0].owner_id === mv.owner_id;

        if (!stillOwn) {
          // Territory lost in transit — all units march home.
          await this.insertAutoReturnMarch(c, mv, mv.instance_ids);
          return {
            kind: 'reinforce' as const,
            ownerId: mv.owner_id,
            toCell: mv.to_cell,
            instanceIds: [],
          };
        }

        // Respect the garrison cap: fill remaining slots, overflow marches
        // home. C.3: the cap includes a garrison building's tier bonus slots —
        // effects read via the held client (no second pool connection).
        const reinforceEffects = await buildingEngine.getTerritoryEffects(
          terr.rows[0].id,
          c,
        );
        const reinforceCap = COMBAT.MAX_GARRISON + reinforceEffects.garrisonBonusSlots;
        const cntRes = await c.query<{ cnt: string }>(
          `SELECT COUNT(*)::bigint AS cnt FROM troop_deployments WHERE territory_id = $1`,
          [terr.rows[0].id],
        );
        const used = parseInt(cntRes.rows[0].cnt, 10);
        const freeSlots = Math.max(0, reinforceCap - used);
        const toGarrison = mv.instance_ids.slice(0, freeSlots);
        const overflow = mv.instance_ids.slice(freeSlots);

        for (const instId of toGarrison) {
          // Garrisoned instances stay 'deployed'; just add the deployment row.
          await c.query(
            `INSERT INTO troop_deployments (instance_id, territory_id, owner_id, role)
             VALUES ($1, $2, $3, 'garrison')
             ON CONFLICT (instance_id) DO NOTHING`,
            [instId, terr.rows[0].id, mv.owner_id],
          );
        }

        if (overflow.length > 0) {
          await this.insertAutoReturnMarch(c, mv, overflow);
        }

        return {
          kind: 'reinforce' as const,
          ownerId: mv.owner_id,
          toCell: mv.to_cell,
          instanceIds: toGarrison,
        };
      }

      // ---- 'scout' arrival ----
      // Vision disk (24h TTL; cells pre-filtered against silent zones above).
      await visionService.upsertScoutVision(mv.owner_id, visionCells, c);

      // Optional covert radar drop on a FOREIGN active territory at to_cell.
      let buildResult: 'placed' | 'no_target' | 'skipped' = 'skipped';
      const buildRadar = !!(mv.config && mv.config.build_radar);
      if (buildRadar) {
        const foreign = await c.query<{ id: string }>(
          `SELECT id FROM territories
            WHERE owner_id IS NOT NULL
              AND owner_id <> $1
              AND h3_cells && ARRAY[$2]::text[]
            LIMIT 1`,
          [mv.owner_id, mv.to_cell],
        );
        if (foreign.rowCount && foreign.rowCount > 0) {
          // Max 1 covert radar per (owner, territory): repeat drops are
          // idempotent instead of piling up rows.
          const existing = await c.query(
            `SELECT 1 FROM buildings
              WHERE territory_id = $1 AND owner_id = $2 AND type = 'radar'
                AND status = 'active' AND (config->>'covert')::boolean IS TRUE
              LIMIT 1`,
            [foreign.rows[0].id, mv.owner_id],
          );
          if ((existing.rowCount ?? 0) === 0) {
            // buildings: hp/tier have defaults; set explicitly for clarity.
            await c.query(
              `INSERT INTO buildings (territory_id, owner_id, type, tier, status, hp, config)
               VALUES ($1, $2, 'radar', 1, 'active', 100, $3)`,
              [foreign.rows[0].id, mv.owner_id, JSON.stringify({ covert: true })],
            );
          }
          buildResult = 'placed';
        } else {
          buildResult = 'no_target';
        }
      }

      // Auto-return: reverse the outbound path, depart at arrival time.
      const returnPath = [...mv.path].reverse();
      const safePath = returnPath.length > 0 ? returnPath : [mv.to_cell];
      const travelMin = safePath.length * COMMANDER.SCOUT_MIN_PER_CELL;
      await c.query(
        `INSERT INTO troop_movements
           (owner_id, instance_ids, from_cell, to_cell, path, purpose, config,
            departs_at, arrives_at, status)
         VALUES ($1, $2, $3, $4, $5, 'return', $6,
                 $7::timestamptz, $7::timestamptz + ($8 || ' minutes')::interval, 'marching')`,
        [
          mv.owner_id,
          mv.instance_ids,
          mv.to_cell,
          mv.from_cell,
          safePath,
          JSON.stringify({ auto_return: true }),
          new Date(mv.arrives_at).toISOString(),
          String(travelMin),
        ],
      );

      return {
        kind: 'scout' as const,
        ownerId: mv.owner_id,
        toCell: mv.to_cell,
        instanceIds: mv.instance_ids,
        buildResult,
      };
    });

    if (!ctx) return false;

    // Post-commit notifications only — never inside the tx.
    try {
      if (ctx.kind === 'return') {
        wsService.sendToUser(ctx.ownerId, 'troops_arrived', {
          to_cell: ctx.toCell,
          instance_ids: ctx.instanceIds,
        });
      } else if (ctx.kind === 'reinforce') {
        wsService.sendToUser(ctx.ownerId, 'troops_arrived', {
          to_cell: ctx.toCell,
          instance_ids: ctx.instanceIds,
        });
      } else if (ctx.kind === 'battle') {
        // Anti-farm counter: attacker wins vs this territory today (drives
        // the pre-tx DROP_CAP_PER_TARGET_PER_DAY check on future attacks).
        if (ctx.winnerSide === 'attacker') {
          try {
            const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const capKey = `battle:dropcap:${ctx.ownerId}:${ctx.territoryId}:${day}`;
            const n = await redis.incr(capKey);
            if (n === 1) await redis.expire(capKey, 86_400);
          } catch {
            /* non-critical */
          }
        }
        // Notify BOTH sides of the outcome.
        for (const uid of [ctx.ownerId, ctx.defenderId]) {
          wsService.sendToUser(uid, 'battle_resolved', {
            battle_id: ctx.battleId,
            winner_side: ctx.winnerSide,
            territory_id: ctx.territoryId,
          });
        }
      } else {
        wsService.sendToUser(ctx.ownerId, 'scout_report', {
          movement_id: movementId,
          target_cell: ctx.toCell,
          build_radar_result: ctx.buildResult,
        });
      }
    } catch {
      /* non-critical */
    }

    return true;
  }

  /**
   * Insert an auto-return movement for the given instances along the reversed
   * outbound path (same march speed). Departs at the outbound arrival time.
   * Client-bound: runs inside the caller's tx. Pass an empty `instanceIds` to
   * skip (no row inserted).
   */
  private async insertAutoReturnMarch(
    c: PoolClient,
    mv: TroopMovement,
    instanceIds: string[],
  ): Promise<void> {
    if (!instanceIds || instanceIds.length === 0) return;
    const returnPath = [...mv.path].reverse();
    const safePath = returnPath.length > 0 ? returnPath : [mv.to_cell];
    const travelMin = safePath.length * COMBAT.MARCH_MIN_PER_CELL;
    await c.query(
      `INSERT INTO troop_movements
         (owner_id, instance_ids, from_cell, to_cell, path, purpose, config,
          departs_at, arrives_at, status)
       VALUES ($1, $2, $3, $4, $5, 'return', $6,
               $7::timestamptz, $7::timestamptz + ($8 || ' minutes')::interval, 'marching')`,
      [
        mv.owner_id,
        instanceIds,
        mv.to_cell,
        mv.from_cell,
        safePath,
        JSON.stringify({ auto_return: true, from_movement: mv.id }),
        new Date(mv.arrives_at).toISOString(),
        String(travelMin),
      ],
    );
  }

  // ---- Reads --------------------------------------------------------

  /**
   * Return the user's relevant movements for the UI: in-flight plus those
   * resolved within the last 24h. Each carries a time-derived `progress`
   * (0..1, clamped) so the client can animate marching units.
   */
  async getMovements(userId: string): Promise<(TroopMovement & { progress: number })[]> {
    const res = await transaction((c) =>
      c.query<TroopMovement>(
        `SELECT ${MOVEMENT_COLS}
           FROM troop_movements
          WHERE owner_id = $1
            AND (status = 'marching'
                 OR (resolved = TRUE AND created_at > NOW() - INTERVAL '24 hours'))
          ORDER BY created_at DESC`,
        [userId],
      ),
    );

    const now = Date.now();
    return res.rows.map((mv) => {
      const departs = new Date(mv.departs_at).getTime();
      const arrives = new Date(mv.arrives_at).getTime();
      const span = Math.max(1, arrives - departs);
      let progress = mv.status === 'marching' ? (now - departs) / span : 1;
      progress = Math.min(1, Math.max(0, progress));
      return { ...mv, progress };
    });
  }
}

export const troopEngine = new TroopEngine();
export default troopEngine;

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
import { COMMANDER } from '../config/constants';
import { RES_SPAWN, cellForPoint, pathBetween } from './h3Service';
import { resourceService } from './resourceService';
import { visionService } from './visionService';
import { isInSilentZone } from './silentZoneService';
import { wsService } from './wsService';

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
    const visionCells =
      peek.rows[0].purpose === 'scout'
        ? await visionService.filterScoutVisionCells(peek.rows[0].to_cell)
        : [];

    // SINGLE atomic tx: lock + re-check, flip status, and ALL side effects
    // (inventory flip / vision upsert / covert radar / auto-return). A
    // failure rolls everything back together — the movement stays
    // unresolved and the next tick retries; no scout unit can be lost.
    type ResolveCtx = {
      ownerId: string;
      toCell: string;
      instanceIds: string[];
      purpose: string;
      buildResult: 'placed' | 'no_target' | 'skipped';
    } | null;

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

      if (mv.purpose !== 'scout' && mv.purpose !== 'return') {
        // 'attack' / 'reinforce' are NOT implemented in C.1. Forward-compat
        // no-op: mark resolved so they don't pile up, and warn.
        console.warn(
          `[Troop] purpose '${mv.purpose}' not implemented in C.1 — marking arrived (no-op). id=${mv.id}`,
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
          ownerId: mv.owner_id,
          toCell: mv.to_cell,
          instanceIds: mv.instance_ids,
          purpose: mv.purpose,
          buildResult: 'skipped' as const,
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
        ownerId: mv.owner_id,
        toCell: mv.to_cell,
        instanceIds: mv.instance_ids,
        purpose: mv.purpose,
        buildResult,
      };
    });

    if (!ctx) return false;

    // Post-commit notifications only — never inside the tx.
    try {
      if (ctx.purpose === 'return') {
        wsService.sendToUser(ctx.ownerId, 'troops_arrived', {
          to_cell: ctx.toCell,
          instance_ids: ctx.instanceIds,
        });
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

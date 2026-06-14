// ============================================================
// Vision Service (Phase C.1 → Fog v2, 2026-06-14)
// Computes the H3 cells a commander can see, now in THREE tiers
// ("Anno-style" fog of war):
//
//   1. UNEXPLORED — full fog. Nothing here except always-visible coarse
//      OBJECTIVE markers (getObjectives) that hint WHERE to scout.
//   2. EXPLORED  (getExploredCells) — PERMANENT terrain memory. Own land +
//      base vision, plus every corridor a scout has ever walked
//      (player_visibility source='explored', expires_at NULL). Rendered "dim":
//      terrain known forever, NO live detail.
//   3. ACTIVE    (getActiveCells) — LIVE detail, recomputed fresh each call:
//      fixed radar buildings (permanent live) + the disk currently around
//      each in-flight scout (moves with the scout). Rendered "bright".
//
// player_visibility.source semantics in Fog v2:
//   'explored' → PERMANENT (expires_at NULL). Written on scout arrival for the
//                whole walked corridor (writeExploredCorridor). Never expires.
//   'scout'    → legacy TTL rows. ACTIVE cells are now computed dynamically, so
//                we stop WRITING 'scout' rows, but the column + TTL cleanup keep
//                working (cleanupExpired only ever touches expires_at IS NOT NULL).
//   'radar'    → legacy TTL rows (unused going forward; same cleanup applies).
//
// Composition: every read accepts an optional caller client and runs through
// withClient, so a held transaction stays a SINGLE connection — we never open a
// second pool connection while a tx client is held (deadlock class). The only
// pool-touching helper is filterScoutVisionCells (silent-zone checks); callers
// run it BEFORE opening / while NOT holding a tx, exactly as before.
// ============================================================

import { PoolClient } from 'pg';
import { transaction } from '../config/database';
import { COMMANDER, BUILDINGS, scoutTier } from '../config/constants';
import { disk, centerOf } from './h3Service';
import { isInSilentZone } from './silentZoneService';

/** Run `fn` inside the supplied client, or open a fresh transaction. */
async function withClient<T>(
  client: PoolClient | undefined,
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  if (client) return fn(client);
  return transaction(fn);
}

/** Movement row shape needed to project an in-flight scout's current cell. */
interface ScoutMovementRow {
  id: string;
  instance_ids: string[];
  path: string[];
  departs_at: Date;
  arrives_at: Date;
}

class VisionService {
  /**
   * TIER 2 — EXPLORED (permanent terrain memory). Union of:
   *   - own-territory cells + disk(TERRITORY_VISION_K) (you always know your
   *     own land, even with no scout there)
   *   - every player_visibility row with source='explored' (corridors a scout
   *     walked, written permanently on arrival)
   * Capped at COMMANDER.MAX_VISIBLE_CELLS in a deterministic order (own land
   * first, then explored corridors) so truncation is stable.
   */
  async getExploredCells(userId: string, client?: PoolClient): Promise<Set<string>> {
    return withClient(client, async (c) => {
      const cap = COMMANDER.MAX_VISIBLE_CELLS;
      const ordered: string[] = [];
      const seen = new Set<string>();
      const push = (cell: string): void => {
        if (!seen.has(cell)) {
          seen.add(cell);
          ordered.push(cell);
        }
      };

      // ---- Own territories: cells + base vision disk ----
      const terr = await c.query<{ id: string; h3_cells: string[] | null }>(
        `SELECT id, h3_cells FROM territories WHERE owner_id = $1`,
        [userId],
      );
      for (const row of terr.rows) {
        const cells = row.h3_cells;
        if (!cells || cells.length === 0) continue;
        for (const cell of cells) {
          push(cell);
          for (const d of disk(cell, COMMANDER.TERRITORY_VISION_K)) push(d);
        }
      }

      // ---- Permanent explored corridors ----
      const explored = await c.query<{ h3_cell: string }>(
        `SELECT h3_cell FROM player_visibility
          WHERE user_id = $1 AND source = 'explored'`,
        [userId],
      );
      for (const row of explored.rows) push(row.h3_cell);

      const result = new Set<string>();
      for (const cell of ordered) {
        if (result.size >= cap) break;
        result.add(cell);
      }
      return result;
    });
  }

  /**
   * TIER 3 — ACTIVE (live detail), computed fresh each call:
   *   a. Radar buildings the user owns (incl. covert on foreign land), active:
   *      each territory cell + disk(TIER_EFFECTS.radar_vision_k[tier-1]).
   *      Permanent-live (fixed watchtower).
   *   b. In-flight scouts ('scout'|'return', marching, unresolved): each scout's
   *      CURRENT cell (projected from elapsed time over its path) + disk(k),
   *      where k = scoutTier(unitLevel).k. ONE join to item_instances reads all
   *      scout levels at once. These "follow the scout".
   * Capped at COMMANDER.MAX_VISIBLE_CELLS (radar first, then scouts).
   */
  async getActiveCells(userId: string, client?: PoolClient): Promise<Set<string>> {
    return withClient(client, async (c) => {
      const cap = COMMANDER.MAX_VISIBLE_CELLS;
      const ordered: string[] = [];
      const seen = new Set<string>();
      const push = (cell: string): void => {
        if (!seen.has(cell)) {
          seen.add(cell);
          ordered.push(cell);
        }
      };

      // ---- a. Radar buildings (own active, incl. covert on foreign land) ----
      const radars = await c.query<{ id: string; tier: number; h3_cells: string[] | null }>(
        `SELECT b.id, b.tier, t.h3_cells
           FROM buildings b
           JOIN territories t ON t.id = b.territory_id
          WHERE b.owner_id = $1 AND b.type = 'radar' AND b.status = 'active'`,
        [userId],
      );
      const radarKTable = BUILDINGS.TIER_EFFECTS.radar_vision_k;
      for (const row of radars.rows) {
        const cells = row.h3_cells;
        if (!cells || cells.length === 0) continue;
        const idx = Math.max(0, Math.min(radarKTable.length - 1, (row.tier || 1) - 1));
        const k = radarKTable[idx];
        for (const cell of cells) {
          for (const d of disk(cell, k)) push(d);
        }
      }

      // ---- b. In-flight scouts: live disk around the projected current cell.
      // ONE join reads each movement's scout unit level (state->>'level').
      // A movement carries instance_ids[]; a scout is a single unit, so the
      // first instance's level drives the tier (default 1).
      const scouts = await c.query<ScoutMovementRow & { scout_level: number | null }>(
        // Guard the level cast: a non-numeric state->>'level' would otherwise
        // throw and abort the whole /map. Non-numeric / missing → default 1.
        `SELECT m.id, m.instance_ids, m.path, m.departs_at, m.arrives_at,
                MAX(CASE WHEN i.state->>'level' ~ '^[0-9]+$'
                         THEN (i.state->>'level')::int ELSE 1 END) AS scout_level
           FROM troop_movements m
           LEFT JOIN item_instances i ON i.id = ANY(m.instance_ids)
          WHERE m.owner_id = $1
            AND m.purpose IN ('scout', 'return')
            AND m.status = 'marching'
            AND m.resolved = FALSE
          GROUP BY m.id, m.instance_ids, m.path, m.departs_at, m.arrives_at`,
        [userId],
      );
      const now = Date.now();
      for (const mv of scouts.rows) {
        const path = mv.path ?? [];
        if (path.length === 0) continue;
        const departs = new Date(mv.departs_at).getTime();
        const arrives = new Date(mv.arrives_at).getTime();
        const span = Math.max(1, arrives - departs);
        const progress = Math.min(1, Math.max(0, (now - departs) / span));
        const len = path.length;
        const idx = len <= 1 ? 0 : Math.floor(progress * (len - 1));
        const currentCell = path[idx];
        const { k } = scoutTier(mv.scout_level ?? 1);
        for (const d of disk(currentCell, k)) push(d);
      }

      const result = new Set<string>();
      for (const cell of ordered) {
        if (result.size >= cap) break;
        result.add(cell);
      }
      return result;
    });
  }

  /**
   * ALWAYS-visible coarse OBJECTIVE markers (regardless of fog). The point is
   * to hint WHERE to scout — NOT to reveal the world — so the set is bounded:
   *
   *   - enemy_territory: ONE representative cell (first h3_cell) per FOREIGN
   *     owned territory. Bounding: we only ever look at territories whose cells
   *     fall inside the gridDisk-2 ring of any explored/own cell (a "frontier"
   *     ring around what the player already knows), and hard-cap to ~100.
   *   - pve_spawn: active spawn cells, restricted to the same frontier ring,
   *     hard-cap ~100.
   *   - ai_zone: ai_region_state held cells inside the frontier ring.
   *
   * Total deduped output is capped at 150. `known` is the caller's
   * explored∪active set; passing a larger "anything" set widens the frontier.
   * Bounding choice: a gridDisk-2 frontier keeps the marker query proportional
   * to what the player has discovered (no whole-world dump) while still
   * surfacing the next targets just past the fog edge.
   */
  async getObjectives(
    userId: string,
    known: Set<string>,
    client?: PoolClient,
  ): Promise<Array<{ h3_cell: string; kind: 'enemy_territory' | 'pve_spawn' | 'ai_zone' }>> {
    return withClient(client, async (c) => {
      const TOTAL_CAP = 150;
      const PER_KIND_CAP = 100;

      // Build the frontier: every known cell plus its gridDisk-2 ring. This is
      // the "reasonable bound" — markers only surface near what you know.
      const frontier = new Set<string>();
      for (const cell of known) {
        for (const d of disk(cell, 2)) frontier.add(d);
      }

      const out: Array<{ h3_cell: string; kind: 'enemy_territory' | 'pve_spawn' | 'ai_zone' }> = [];
      const seen = new Set<string>();
      const add = (h3_cell: string, kind: 'enemy_territory' | 'pve_spawn' | 'ai_zone'): boolean => {
        if (out.length >= TOTAL_CAP) return false;
        if (seen.has(h3_cell)) return true;
        seen.add(h3_cell);
        out.push({ h3_cell, kind });
        return true;
      };

      if (frontier.size === 0) return out;
      // Bound the array param: a well-travelled player's known-set (capped at
      // MAX_VISIBLE_CELLS) × gridDisk-2 could be tens of thousands of cells.
      // Cap the frontier passed to the marker queries so they stay cheap.
      const FRONTIER_CAP = 5000;
      const frontierArr = Array.from(frontier).slice(0, FRONTIER_CAP);

      // ---- enemy_territory: foreign owned territories overlapping the frontier ----
      try {
        const terr = await c.query<{ h3_cells: string[] | null }>(
          `SELECT h3_cells FROM territories
            WHERE owner_id IS NOT NULL AND owner_id <> $1
              AND h3_cells && $2::text[]
            LIMIT $3`,
          [userId, frontierArr, PER_KIND_CAP],
        );
        for (const row of terr.rows) {
          const cells = row.h3_cells;
          if (!cells || cells.length === 0) continue;
          if (!add(cells[0], 'enemy_territory')) break;
        }
      } catch {
        /* territories always exists; tolerate to never break the map */
      }

      // ---- pve_spawn: active spawns whose cell is on the frontier ----
      try {
        const spawns = await c.query<{ h3_cell: string }>(
          `SELECT DISTINCT h3_cell FROM pve_spawns
            WHERE status = 'active' AND h3_cell = ANY($1::text[])
            LIMIT $2`,
          [frontierArr, PER_KIND_CAP],
        );
        for (const row of spawns.rows) {
          if (!add(row.h3_cell, 'pve_spawn')) break;
        }
      } catch {
        /* pve_spawns may be absent in older DBs */
      }

      // ---- ai_zone: ai_region_state held cells on the frontier ----
      try {
        const zones = await c.query<{ held_cells: string[] | null }>(
          `SELECT held_cells FROM ai_region_state
            WHERE held_cells && $1::text[]`,
          [frontierArr],
        );
        for (const z of zones.rows) {
          for (const cell of z.held_cells ?? []) {
            if (frontier.has(cell)) {
              if (!add(cell, 'ai_zone')) break;
            }
          }
          if (out.length >= TOTAL_CAP) break;
        }
      } catch {
        /* ai_region_state may not exist if Phase D migration hasn't run */
      }

      return out;
    });
  }

  /**
   * Compute the silent-zone-filtered vision disk around a single cell at
   * radius k. isInSilentZone queries the POOL — call this BEFORE opening (or
   * while NOT holding) any transaction client, never interleaved with one
   * (deadlock class: pool query while a tx client is held). Defaults to
   * SCOUT_VISION_K for backward compatibility.
   */
  async filterScoutVisionCells(
    targetCell: string,
    k: number = COMMANDER.SCOUT_VISION_K,
  ): Promise<string[]> {
    const candidates = disk(targetCell, k);
    const visible: string[] = [];
    for (const cell of candidates) {
      const { latitude, longitude } = centerOf(cell);
      const blocked = await isInSilentZone(latitude, longitude);
      if (!blocked) visible.push(cell);
    }
    return visible;
  }

  /**
   * Filter a full corridor (every cell the scout walked, already disk-expanded)
   * against silent zones. Pool queries — run BEFORE the tx, like
   * filterScoutVisionCells. Dedupes input first to bound the isInSilentZone
   * calls. Returns the silent-zone-cleared subset.
   */
  async filterCorridorCells(cells: Iterable<string>): Promise<string[]> {
    const uniq = Array.from(new Set(cells));
    const visible: string[] = [];
    for (const cell of uniq) {
      const { latitude, longitude } = centerOf(cell);
      const blocked = await isInSilentZone(latitude, longitude);
      if (!blocked) visible.push(cell);
    }
    return visible;
  }

  /**
   * PERMANENT explored memory: bulk-insert source='explored', expires_at NULL.
   * Pure client write — safe inside the caller's tx. Idempotent (ON CONFLICT DO
   * NOTHING). Cells MUST already be silent-zone filtered (filterCorridorCells).
   * Returns the number of cells offered for insertion.
   */
  async writeExploredCorridor(
    userId: string,
    cells: string[],
    client: PoolClient,
  ): Promise<number> {
    if (cells.length === 0) return 0;
    await client.query(
      `INSERT INTO player_visibility (user_id, h3_cell, source, expires_at)
       SELECT $1, cell, 'explored', NULL
         FROM unnest($2::text[]) AS cell
       ON CONFLICT (user_id, h3_cell, source) DO NOTHING`,
      [userId, cells],
    );
    return cells.length;
  }

  /**
   * Delete every EXPIRED visibility row (legacy 'scout'/'radar' TTL rows).
   * Always safe (no flag gate). Only removes rows whose TTL has passed, so
   * permanent 'explored' rows (expires_at NULL) are NEVER touched.
   * Returns the number of rows deleted.
   */
  async cleanupExpired(): Promise<number> {
    const res = await transaction((c) =>
      c.query(
        `DELETE FROM player_visibility
          WHERE expires_at IS NOT NULL AND expires_at <= NOW()`,
      ),
    );
    return res.rowCount ?? 0;
  }
}

export const visionService = new VisionService();
export default visionService;

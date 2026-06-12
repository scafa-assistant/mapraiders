// ============================================================
// Vision Service (Phase C.1 — Fog of War)
// Computes the set of H3 cells a commander can currently see. Visibility
// comes from three layered sources, unioned then capped:
//   1. Own territories     — each owned cell + disk(cell, TERRITORY_VISION_K)
//   2. Radars              — disk(territory cell, RADAR_VISION_K) for every
//                            active 'radar' building the user owns (covert
//                            radars on FOREIGN territory work the same, since
//                            the query keys off building.owner_id)
//   3. Scouts              — rows in player_visibility (source 'scout'),
//                            granted on scout arrival, TTL'd to 24h
//
// The union is capped at MAX_VISIBLE_CELLS in a DETERMINISTIC order
// (own-territory cells first, then radar, then scout) so truncation is
// stable across requests.
//
// Limitation: territories whose h3_cells is NULL/empty (old rows not yet
// backfilled) are skipped — this stays a pure index lookup and never
// re-derives cells from the polygon. The h3_backfill cron fills them in.
//
// Composition: getVisibleCells accepts an optional caller client.
// Scout vision is split in two: filterScoutVisionCells (POOL queries —
// silent-zone checks — call it BEFORE holding any tx client) and
// upsertScoutVision (pure client write — safe inside the caller's tx).
// This keeps arrival resolution atomic without interleaving pool queries
// with a held transaction client.
// ============================================================

import { PoolClient } from 'pg';
import { transaction } from '../config/database';
import { COMMANDER, BUILDINGS } from '../config/constants';
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

class VisionService {
  /**
   * Compute the set of cells the user can currently see. Layered union of
   * own-territory, radar and scout vision, capped at MAX_VISIBLE_CELLS in a
   * deterministic order (territory -> radar -> scout).
   */
  async getVisibleCells(userId: string, client?: PoolClient): Promise<Set<string>> {
    return withClient(client, async (c) => {
      const cap = COMMANDER.MAX_VISIBLE_CELLS;

      // Insertion order matters: we add territory cells first, then radar,
      // then scout, and truncate by insertion order. A Set preserves
      // insertion order, so we drain it into the final capped Set below.
      const ordered: string[] = [];
      const seen = new Set<string>();
      const push = (cell: string): void => {
        if (!seen.has(cell)) {
          seen.add(cell);
          ordered.push(cell);
        }
      };

      // ---- 1 + 2. Own territories: cells + base vision disk ----
      // Active territory = owner_id IS NOT NULL (no `status` column exists).
      const terr = await c.query<{ id: string; h3_cells: string[] | null }>(
        `SELECT id, h3_cells
           FROM territories
          WHERE owner_id = $1`,
        [userId],
      );
      for (const row of terr.rows) {
        const cells = row.h3_cells;
        // Skip rows with no backfilled cells — we do NOT derive from polygon.
        if (!cells || cells.length === 0) continue;
        for (const cell of cells) {
          push(cell);
          for (const d of disk(cell, COMMANDER.TERRITORY_VISION_K)) push(d);
        }
      }

      // ---- 3. Radar vision (own active radars, incl. covert on foreign land) ----
      // C.3: the radar disk radius is tier-aware — TIER_EFFECTS.radar_vision_k
      // indexed by tier-1 (clamped). Covert scout radars are tier 1, so they
      // keep the original k=2 disk (radar_vision_k[0]).
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

      // ---- 4. Scout vision (player_visibility, non-expired) ----
      const scout = await c.query<{ h3_cell: string }>(
        `SELECT h3_cell
           FROM player_visibility
          WHERE user_id = $1
            AND (expires_at IS NULL OR expires_at > NOW())`,
        [userId],
      );
      for (const row of scout.rows) push(row.h3_cell);

      // ---- Cap, preserving deterministic order ----
      const result = new Set<string>();
      for (const cell of ordered) {
        if (result.size >= cap) break;
        result.add(cell);
      }
      return result;
    });
  }

  /**
   * Compute the silent-zone-filtered vision disk around a scout target.
   * isInSilentZone queries the POOL — call this BEFORE opening (or while not
   * holding) any transaction client, never interleaved with one (deadlock
   * class: pool query while a tx client is held).
   */
  async filterScoutVisionCells(targetCell: string): Promise<string[]> {
    const candidates = disk(targetCell, COMMANDER.SCOUT_VISION_K);

    // <= 7 cells for k=1 — fine to await each.
    const visible: string[] = [];
    for (const cell of candidates) {
      const { latitude, longitude } = centerOf(cell);
      const blocked = await isInSilentZone(latitude, longitude);
      if (!blocked) visible.push(cell);
    }
    return visible;
  }

  /**
   * Upsert pre-filtered scout vision cells for SCOUT_VISION_TTL_HOURS.
   * Pure client write — safe inside the caller's transaction. Cells MUST
   * already be silent-zone filtered via filterScoutVisionCells().
   */
  async upsertScoutVision(
    userId: string,
    cells: string[],
    client: PoolClient,
  ): Promise<number> {
    if (cells.length === 0) return 0;

    const expiresAt = new Date(
      Date.now() + COMMANDER.SCOUT_VISION_TTL_HOURS * 3600 * 1000,
    ).toISOString();

    await client.query(
      `INSERT INTO player_visibility (user_id, h3_cell, source, expires_at)
       SELECT $1, cell, 'scout', $3::timestamptz
         FROM unnest($2::text[]) AS cell
       ON CONFLICT (user_id, h3_cell, source)
       DO UPDATE SET expires_at = EXCLUDED.expires_at`,
      [userId, cells, expiresAt],
    );

    return cells.length;
  }

  /**
   * Delete every expired scout/radar visibility row. Always safe to run
   * (no flag gate) — only removes rows whose TTL has already passed.
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

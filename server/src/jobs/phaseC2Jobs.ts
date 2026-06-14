// ============================================================
// Phase C.2 Cron Jobs
//
//   runScoutVisionTick -> every 15 min, scan in-flight attack/reinforce
//                         movements. For each, compute the current path cell
//                         (by elapsed-time progress) and find OTHER users who
//                         currently see that cell (non-expired player_visibility
//                         row). Notify each such watcher with a `scout_report`
//                         {kind:'movement_spotted', ...}. A Redis dedup key per
//                         (watcher, movement) with 2h TTL prevents spamming the
//                         same sighting every tick.
//
// Gated on the global `commander` feature flag: while the feature is off, the
// tick does nothing. Registered in decayCron.ts (*/15 * * * *).
// ============================================================

import { query } from '../config/database';
import redis from '../config/redis';
import { featureService } from '../services/featureService';
import { wsService } from '../services/wsService';
import { sendPushToUser } from '../services/pushService';
import { BUILDINGS, ESPIONAGE } from '../config/constants';
import { disk } from '../services/h3Service';

async function commanderFlagEnabled(): Promise<boolean> {
  const flags = await featureService.getAllFlags();
  return flags.some((f) => f.key === 'commander' && f.enabled);
}

/** Dedup TTL: 2 hours, so a given watcher is pinged about a given movement
 *  at most once per 2h window even though the tick runs every 15 min. */
const DEDUP_TTL_SECONDS = 2 * 60 * 60;

/**
 * Scan in-flight attack/reinforce movements and report any that a non-owner
 * currently sees on the map. Returns the number of `scout_report` messages sent.
 */
export async function runScoutVisionTick(): Promise<number> {
  if (!(await commanderFlagEnabled())) {
    console.log('[PhaseC2] scout_vision_tick skipped (commander flag disabled)');
    return 0;
  }

  const movements = await query<{
    id: string;
    owner_id: string;
    purpose: string;
    path: string[];
    departs_at: Date;
    arrives_at: Date;
  }>(
    `SELECT id, owner_id, purpose, path, departs_at, arrives_at
       FROM troop_movements
      WHERE status = 'marching' AND resolved = FALSE
        AND purpose IN ('attack', 'reinforce')`,
  );

  const now = Date.now();
  let sent = 0;

  for (const mv of movements.rows) {
    // Current cell by elapsed-time progress.
    const departs = new Date(mv.departs_at).getTime();
    const arrives = new Date(mv.arrives_at).getTime();
    const span = Math.max(1, arrives - departs);
    const progress = Math.min(1, Math.max(0, (now - departs) / span));
    const len = mv.path.length;
    const idx = len <= 1 ? 0 : Math.floor(progress * (len - 1));
    const currentCell = mv.path[idx];

    // Users (≠ owner) who currently see this cell.
    const watchers = await query<{ user_id: string }>(
      `SELECT DISTINCT user_id
         FROM player_visibility
        WHERE h3_cell = $1
          AND user_id <> $2
          AND (expires_at IS NULL OR expires_at > NOW())`,
      [currentCell, mv.owner_id],
    );

    for (const w of watchers.rows) {
      const dedupKey = `c2:spot:${w.user_id}:${mv.id}`;
      // SET NX EX: only the first sighting in the 2h window proceeds.
      let acquired: string | null = null;
      try {
        acquired = await redis.set(dedupKey, '1', 'EX', DEDUP_TTL_SECONDS, 'NX');
      } catch {
        // Redis down — fall through and notify (better a dup than silence).
        acquired = 'OK';
      }
      if (acquired === null) continue;

      try {
        wsService.sendToUser(w.user_id, 'scout_report', {
          kind: 'movement_spotted',
          current_cell: currentCell,
          eta: mv.arrives_at,
          purpose: mv.purpose,
        });
        sent++;
      } catch {
        /* non-critical */
      }
    }
  }

  if (sent > 0) {
    console.log(`[PhaseC2] scout_vision_tick: ${sent} movement sightings reported`);
  }
  return sent;
}

// ============================================================
// Phase F.3 — Spy-radar passive detection pass
//
// For each ACTIVE covert spy-radar (buildings type='radar', config.covert=true,
// status='active'), compute its coverage cells (its territory's h3_cells +
// disk(radar tier vision k)). For each FOREIGN in-flight movement whose CURRENT
// projected cell falls in that coverage, notify the RADAR OWNER ("reads the
// enemy's task") with WS 'spy_detected' + a push. Per-(radar, movement) Redis
// dedup over SCAN_NOTIFY_DEDUP_HOURS. Bounded: caps on radars + movements
// processed, per-row try/catch so one bad row never sinks the batch.
//
// Folded into the same */15 commander tick as runScoutVisionTick (no new cron).
// ============================================================

/** Hard caps so the pass stays bounded under load. */
const MAX_RADARS = 500;
const MAX_MOVEMENTS = 1000;

/** Project a movement's CURRENT cell from elapsed time over its path. */
function projectCurrentCell(
  path: string[],
  departsAt: Date,
  arrivesAt: Date,
  now: number,
): string | null {
  if (!path || path.length === 0) return null;
  const departs = new Date(departsAt).getTime();
  const arrives = new Date(arrivesAt).getTime();
  const span = Math.max(1, arrives - departs);
  const progress = Math.min(1, Math.max(0, (now - departs) / span));
  const len = path.length;
  const idx = len <= 1 ? 0 : Math.floor(progress * (len - 1));
  return path[idx];
}

/**
 * Passive spy-radar detection tick. Returns the number of `spy_detected`
 * notifications sent. No-op while the `commander` flag is off (caller-gated by
 * the cron, but re-checked here so it is safe to call standalone).
 */
export async function runSpyRadarDetectionTick(): Promise<number> {
  if (!(await commanderFlagEnabled())) {
    return 0;
  }

  // ---- Active covert radars (with their territory's cells + tier) ----
  const radars = await query<{
    id: string;
    owner_id: string;
    territory_id: string;
    tier: number;
    h3_cells: string[] | null;
  }>(
    `SELECT b.id, b.owner_id, b.territory_id, b.tier, t.h3_cells
       FROM buildings b
       JOIN territories t ON t.id = b.territory_id
      WHERE b.type = 'radar' AND b.status = 'active'
        AND COALESCE((b.config->>'covert')::boolean, FALSE) IS TRUE
      LIMIT $1`,
    [MAX_RADARS],
  );
  if (radars.rows.length === 0) return 0;

  // ---- In-flight enemy-capable movements (single read, then matched per radar) ----
  const movements = await query<{
    id: string;
    owner_id: string;
    purpose: string;
    config: Record<string, any> | null;
    path: string[];
    departs_at: Date;
    arrives_at: Date;
  }>(
    `SELECT id, owner_id, purpose, config, path, departs_at, arrives_at
       FROM troop_movements
      WHERE status = 'marching' AND resolved = FALSE
        AND purpose IN ('haul', 'attack', 'reinforce', 'scout', 'return')
      ORDER BY arrives_at ASC
      LIMIT $1`,
    [MAX_MOVEMENTS],
  );
  if (movements.rows.length === 0) return 0;

  const now = Date.now();
  const radarKTable = BUILDINGS.TIER_EFFECTS.radar_vision_k;
  const dedupTtl = ESPIONAGE.SCAN_NOTIFY_DEDUP_HOURS * 60 * 60;
  let sent = 0;

  for (const radar of radars.rows) {
    try {
      const cells = radar.h3_cells;
      if (!cells || cells.length === 0) continue;

      // Coverage = each territory cell expanded by the radar tier's vision k.
      const idx = Math.max(0, Math.min(radarKTable.length - 1, (radar.tier || 1) - 1));
      const k = radarKTable[idx];
      const coverage = new Set<string>();
      for (const cell of cells) {
        for (const d of disk(cell, k)) coverage.add(d);
      }

      for (const mv of movements.rows) {
        // Only FOREIGN columns (a player's own troops never trip their radar).
        if (mv.owner_id === radar.owner_id) continue;

        const currentCell = projectCurrentCell(mv.path, mv.departs_at, mv.arrives_at, now);
        if (!currentCell || !coverage.has(currentCell)) continue;

        // Dedup per (radar, movement) over the notify window.
        const dedupKey = `f3:spy:${radar.id}:${mv.id}`;
        let acquired: string | null = null;
        try {
          acquired = await redis.set(dedupKey, '1', 'EX', dedupTtl, 'NX');
        } catch {
          // Redis down — better a possible dup than silence on a real sighting.
          acquired = 'OK';
        }
        if (acquired === null) continue;

        // carrying = an interceptable load: a haul (en route to load / loaded)
        // or a 'return' that materialised a config.load.
        const cfg = mv.config ?? {};
        const carrying =
          mv.purpose === 'haul' ||
          (mv.purpose === 'return' && !!cfg.load && typeof cfg.load === 'object');

        try {
          wsService.sendToUser(radar.owner_id, 'spy_detected', {
            radar_building_id: radar.id,
            territory_id: radar.territory_id,
            current_cell: currentCell,
            purpose: mv.purpose,
            carrying,
            eta: mv.arrives_at,
          });
          // Fire-and-forget push (no token / FCM off → silently false).
          void sendPushToUser(
            radar.owner_id,
            'MapRaiders',
            '📡 Spy radar: enemy column detected',
          );
          sent++;
        } catch {
          /* non-critical */
        }
      }
    } catch (err) {
      console.error('[PhaseF3] spy radar row failed:', (err as any)?.message ?? err);
    }
  }

  if (sent > 0) {
    console.log(`[PhaseF3] spy_radar_detection: ${sent} enemy columns reported`);
  }
  return sent;
}

export const phaseC2Jobs = { runScoutVisionTick, runSpyRadarDetectionTick };

export default phaseC2Jobs;

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

export const phaseC2Jobs = { runScoutVisionTick };

export default phaseC2Jobs;

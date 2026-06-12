// ============================================================
// Phase C.1 Cron Jobs
// Thin wrappers around the troop engine + vision service cron functions,
// registered in decayCron.ts.
//
//   runTroopArrivalTick  -> resolve due movements (scouts) every 5 min.
//                           Gated on the global 'commander' feature flag:
//                           while the feature is off, zero side effects.
//   runVisibilityCleanup -> delete expired visibility rows (03:45 UTC).
//                           NOT flag-gated — deleting expired rows is always
//                           safe and keeps the table from growing unbounded.
// ============================================================

import { troopEngine } from '../services/troopEngine';
import { visionService } from '../services/visionService';
import { featureService } from '../services/featureService';

async function commanderFlagEnabled(): Promise<boolean> {
  const flags = await featureService.getAllFlags();
  return flags.some((f) => f.key === 'commander' && f.enabled);
}

/**
 * Resolve all due troop movements (scouts arriving / returning).
 * Returns the number of movements resolved.
 */
export async function runTroopArrivalTick(): Promise<number> {
  if (!(await commanderFlagEnabled())) {
    console.log('[PhaseC1] troop_arrival_tick skipped (commander flag disabled)');
    return 0;
  }
  const resolved = await troopEngine.resolveDueMovements();
  if (resolved > 0) {
    console.log(`[PhaseC1] troop_arrival_tick: ${resolved} movements resolved`);
  }
  return resolved;
}

/**
 * Delete expired player_visibility rows. Always safe (no flag gate).
 * Returns the number of rows deleted.
 */
export async function runVisibilityCleanup(): Promise<number> {
  const deleted = await visionService.cleanupExpired();
  if (deleted > 0) {
    console.log(`[PhaseC1] visibility_cleanup: ${deleted} expired rows deleted`);
  }
  return deleted;
}

export const phaseC1Jobs = { runTroopArrivalTick, runVisibilityCleanup };

export default phaseC1Jobs;

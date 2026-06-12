// ============================================================
// Phase A Cron Jobs
// Thin wrappers around the PvE spawn engine cron functions,
// registered in decayCron.ts. Both are gated on the global
// 'pve_spawns' feature flag: while the feature is off, the jobs
// must cause zero side effects (no spawn writes, no Overpass calls).
//
//   runPveSpawnTick    -> expire + refill (06:00 UTC)
//   runAetherLeechTick -> leech owner notifications (04:10 UTC)
// ============================================================

import { expireAndRefill, applyLeechTick } from '../services/pveSpawnEngine';
import { featureService } from '../services/featureService';

async function pveFlagEnabled(): Promise<boolean> {
  const flags = await featureService.getAllFlags();
  return flags.some((f) => f.key === 'pve_spawns' && f.enabled);
}

/**
 * Expire stale spawns and refill cells with recent player activity.
 * Returns the number of spawns that were expired.
 */
export async function runPveSpawnTick(): Promise<number> {
  if (!(await pveFlagEnabled())) {
    console.log('[PhaseA] pve_spawn_tick skipped (pve_spawns flag disabled)');
    return 0;
  }
  const expired = await expireAndRefill();
  console.log(`[PhaseA] pve_spawn_tick: ${expired} spawns expired + refilled active cells`);
  return expired;
}

/**
 * Notify owners of territories under an Aether-Leech (once per day).
 * Returns the number of active leeches processed.
 */
export async function runAetherLeechTick(): Promise<number> {
  if (!(await pveFlagEnabled())) {
    console.log('[PhaseA] aether_leech_tick skipped (pve_spawns flag disabled)');
    return 0;
  }
  const processed = await applyLeechTick();
  console.log(`[PhaseA] aether_leech_tick: ${processed} active leeches processed`);
  return processed;
}

export const phaseAJobs = { runPveSpawnTick, runAetherLeechTick };

export default phaseAJobs;

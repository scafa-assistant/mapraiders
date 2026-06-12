// ============================================================
// Phase A Cron Jobs
// Thin wrappers around the PvE spawn engine cron functions. These
// are NOT registered in decayCron.ts yet — wiring happens when the
// pve_spawns flag is rolled out. Both return a count for logging.
//
//   runPveSpawnTick   -> expire + refill (06:00 UTC)
//   runAetherLeechTick -> leech owner notifications (04:10 UTC)
// ============================================================

import { expireAndRefill, applyLeechTick } from '../services/pveSpawnEngine';

/**
 * Expire stale spawns and refill cells with recent player activity.
 * Returns the number of spawns that were expired.
 */
export async function runPveSpawnTick(): Promise<number> {
  const expired = await expireAndRefill();
  console.log(`[PhaseA] pve_spawn_tick: ${expired} spawns expired + refilled active cells`);
  return expired;
}

/**
 * Notify owners of territories under an Aether-Leech (once per day).
 * Returns the number of active leeches processed.
 */
export async function runAetherLeechTick(): Promise<number> {
  const processed = await applyLeechTick();
  console.log(`[PhaseA] aether_leech_tick: ${processed} active leeches processed`);
  return processed;
}

export const phaseAJobs = { runPveSpawnTick, runAetherLeechTick };

export default phaseAJobs;

// ============================================================
// Phase B Cron Jobs
// Thin wrappers around the building engine and energy service
// cron functions, registered in decayCron.ts. Both are gated on
// the global 'resources' feature flag: while the feature is off,
// the jobs must cause zero side effects.
//
//   runEnergyTick          -> accrue passive energy for all users (03:30 UTC)
//   runBuildingCompletion  -> mark due buildings as completed (*/10 * * * *)
// ============================================================

import { energyService } from '../services/energyService';
import { buildingEngine } from '../services/buildingEngine';
import { featureService } from '../services/featureService';

async function resourcesFlagEnabled(): Promise<boolean> {
  const flags = await featureService.getAllFlags();
  return flags.some((f) => f.key === 'resources' && f.enabled);
}

/**
 * Run the batch energy accrual tick for all eligible users.
 * Returns the number of users whose energy balance was updated.
 */
export async function runEnergyTick(): Promise<number> {
  if (!(await resourcesFlagEnabled())) {
    console.log('[PhaseB] energy_tick skipped (resources flag disabled)');
    return 0;
  }
  const updated = await energyService.runEnergyTickBatch();
  console.log(`[PhaseB] energy_tick: ${updated} users updated`);
  return updated;
}

/**
 * Scan buildings whose completes_at has passed and mark them as complete.
 * Returns the number of buildings that were completed.
 */
export async function runBuildingCompletion(): Promise<number> {
  if (!(await resourcesFlagEnabled())) {
    console.log('[PhaseB] building_completion skipped (resources flag disabled)');
    return 0;
  }
  const completed = await buildingEngine.completeDueBuildings();
  console.log(`[PhaseB] building_completion: ${completed} buildings completed`);
  return completed;
}

export const phaseBJobs = { runEnergyTick, runBuildingCompletion };

export default phaseBJobs;

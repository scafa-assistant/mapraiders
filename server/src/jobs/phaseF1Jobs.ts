// ============================================================
// Phase F.1 Cron Jobs — Biome-based Resource Extraction
//
//   extraction_tick  (hourly) — accrue raw resources into the per-territory
//                               stockpile for every territory with >= 1 active
//                               extraction building.
//
// Gated on the `economy` feature flag: while it is off the job no-ops (but the
// caller in decayCron.ts still recordCronRun, matching the Phase B/C/D pattern,
// so /api/health/crons always sees a fresh "last success"). The lazy read path
// (GET /api/buildings/territory/:id with economy on) materialises stockpiles
// between ticks, so an hourly cadence is plenty. Registered in decayCron.ts.
// ============================================================

import { extractionService } from '../services/extractionService';
import { featureService } from '../services/featureService';

async function economyFlagEnabled(): Promise<boolean> {
  try {
    const flags = await featureService.getAllFlags();
    return flags.some((f) => f.key === 'economy' && f.enabled);
  } catch {
    return false;
  }
}

/**
 * Accrue every territory with at least one active extraction building.
 * Returns the number of territories whose stockpile was credited.
 */
export async function runExtractionTick(): Promise<number> {
  if (!(await economyFlagEnabled())) {
    console.log('[PhaseF1] extraction_tick skipped (economy flag disabled)');
    return 0;
  }
  const credited = await extractionService.runExtractionTickBatch();
  console.log(`[PhaseF1] extraction_tick: ${credited} territories credited`);
  return credited;
}

export const phaseF1Jobs = { runExtractionTick };

export default phaseF1Jobs;

// ============================================================
// Energy Service (Phase B)
// Passive energy accrual from owned territories. Each owned
// territory yields energy proportional to its (decay-adjusted)
// claim_value, boosted by active refineries:
//
//   per-day = claim_value × (1 − decay_level) × (1 + refineryBonus)
//   accrued = Σ per-day / 24 × hours
//
// energy_ticks.last_tick_at is the watermark. A FOR UPDATE lock on
// that row serialises lazy (on-request) and cron accrual so the
// same hours can never be credited twice.
// ============================================================

import { PoolClient } from 'pg';
import { transaction } from '../config/database';
import { BUILDINGS } from '../config/constants';
import { resourceService } from './resourceService';
import { buildingEngine } from './buildingEngine';
import { featureService } from './featureService';

/** Read the global energy-rate multiplier from the `resources` flag config. */
async function getEnergyRateMultiplier(): Promise<number> {
  try {
    const flags = await featureService.getAllFlags();
    const resources = flags.find((f) => f.key === 'resources');
    const cfg = (resources?.config as Record<string, any>) ?? {};
    const v = Number(cfg.energy_rate_multiplier);
    return Number.isFinite(v) && v > 0 ? v : 1;
  } catch {
    return 1;
  }
}

class EnergyService {
  /**
   * Accrue passive energy for one user since their last tick.
   *
   * - Locks (or lazily creates) the energy_ticks row FOR UPDATE.
   * - Caps elapsed time at MAX_ACCRUAL_HOURS (anti-windfall).
   * - Sums decay-adjusted, refinery-boosted yield over owned territories.
   * - Credits floored integer energy via resourceService (if > 0).
   * - Always advances last_tick_at to NOW() (even on 0) so rounding
   *   remainders don't re-accumulate.
   *
   * A brand-new energy_ticks row starts at NOW(): no retroactive credit.
   *
   * @returns the amount of energy credited (>= 0)
   */
  async accrueEnergy(userId: string): Promise<number> {
    const rateMultiplier = await getEnergyRateMultiplier();

    return transaction(async (c) => {
      // Lazily create the watermark row (no-op if it exists).
      const inserted = await c.query(
        `INSERT INTO energy_ticks (user_id, last_tick_at)
         VALUES ($1, NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      );

      // Lock the row and read the watermark.
      const tick = await c.query<{ last_tick_at: Date }>(
        `SELECT last_tick_at FROM energy_ticks WHERE user_id = $1 FOR UPDATE`,
        [userId],
      );
      if (tick.rowCount === 0) {
        // Should not happen after the upsert, but stay defensive.
        return 0;
      }

      // Fresh row → no retroactive accrual on first call.
      if ((inserted.rowCount ?? 0) > 0) {
        return 0;
      }

      const lastTick = new Date(tick.rows[0].last_tick_at).getTime();
      const elapsedHoursRaw = (Date.now() - lastTick) / (1000 * 60 * 60);
      const hours = Math.min(
        Math.max(elapsedHoursRaw, 0),
        BUILDINGS.ENERGY.MAX_ACCRUAL_HOURS,
      );

      // Too soon to bother — leave the watermark untouched so the
      // sub-threshold time is not lost.
      if (hours < 0.1) {
        return 0;
      }

      // Owned territories with their decay-adjusted base yield.
      const terrs = await c.query<{ id: string; claim_value: string; decay_level: string }>(
        `SELECT id, claim_value, decay_level
           FROM territories
          WHERE owner_id = $1`,
        [userId],
      );

      let amount = 0;
      if (terrs.rowCount && terrs.rowCount > 0) {
        const ids = terrs.rows.map((t) => t.id);
        // Pass the outer client: a nested transaction() here would request a
        // second pool connection while holding the energy_ticks row lock —
        // under concurrent requests that deadlocks the whole pool.
        const effects = await buildingEngine.getEffectsForTerritories(ids, c);

        let perDay = 0;
        for (const t of terrs.rows) {
          const claimValue = parseFloat(t.claim_value) || 0;
          const decay = parseFloat(t.decay_level) || 0;
          const refineryBonus = effects.get(t.id)?.refineryBonus ?? 0;
          perDay += claimValue * (1 - decay) * (1 + refineryBonus);
        }

        amount = Math.floor((perDay / 24) * hours * rateMultiplier);
        if (amount < 0) amount = 0;
      }

      if (amount > 0) {
        await resourceService.credit(userId, 'energy', amount, 'energy_tick', { hours }, c);
      }

      // Always advance the watermark.
      await c.query(
        `UPDATE energy_ticks SET last_tick_at = NOW() WHERE user_id = $1`,
        [userId],
      );

      return amount;
    });
  }

  /**
   * Accrue energy for every user that currently owns at least one
   * territory. Runs sequentially with per-user error isolation so one
   * bad user can't abort the batch.
   *
   * @returns number of users that received a positive credit
   */
  async runEnergyTickBatch(): Promise<number> {
    let credited = 0;

    let ownerIds: string[] = [];
    try {
      const res = await transaction((c) =>
        c.query<{ owner_id: string }>(
          `SELECT DISTINCT owner_id FROM territories WHERE owner_id IS NOT NULL`,
        ),
      );
      ownerIds = res.rows.map((r) => r.owner_id);
    } catch (err) {
      console.error('[Energy] Failed to load territory owners:', err);
      return 0;
    }

    for (const userId of ownerIds) {
      try {
        // Respect the per-user rollout bucket — the lazy path only accrues
        // for users inside the rollout, the cron must not credit the rest.
        const enabled = await featureService.isEnabledFor(userId, 'resources');
        if (!enabled) continue;

        const amount = await this.accrueEnergy(userId);
        if (amount > 0) credited++;
      } catch (err) {
        console.error(`[Energy] accrueEnergy failed for ${userId}:`, err);
      }
    }

    console.log(`[Energy] Tick batch: ${credited}/${ownerIds.length} users credited`);
    return credited;
  }
}

export const energyService = new EnergyService();
export default energyService;

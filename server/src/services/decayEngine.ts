// ============================================================
// Decay Engine
// Territory decay/verfall, echo expiry, quest/challenge cleanup,
// and legendary status promotion
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { DECAY, BUILDINGS } from '../config/constants';
import { buildingEngine } from './buildingEngine';

/**
 * Decay engine responsible for all time-based degradation
 * and promotion mechanics in MapRaiders.
 *
 * Runs as daily scheduled jobs to:
 * - Decay unclaimed/undefended territories
 * - Expire old echos
 * - Archive inactive quests and challenges
 * - Promote high-quality content to legendary status
 */
export class DecayEngine {
  /**
   * Run daily territory decay on all owned territories.
   *
   * Decay formula:
   * - days <= 1 (grace period): 0.0
   * - days 1-7 (phase 1): linear from 0 to 0.7
   * - days > 7 (phase 2): linear from 0.7 to 1.0
   * - decay >= 1.0: territory becomes unclaimed (removed from owner)
   *
   * @returns Count of updated and removed territories
   */
  async runTerritoryDecay(): Promise<{ updated: number; removed: number }> {
    let updated = 0;
    let removed = 0;

    try {
      // Fetch all owned territories with their age
      const territories = await queryMany<{
        id: string;
        owner_id: string;
        last_defended: Date;
        decay_level: number;
      }>(
        `SELECT id, owner_id, last_defended, decay_level
         FROM territories
         WHERE owner_id IS NOT NULL
           AND is_protected = FALSE`
      );

      // Phase B: batch-load building effects once (no N+1). Shielded
      // territories decay slower through Phase 1 while the shield stands.
      let effects: Map<string, { refineryBonus: number; shieldActive: boolean }> = new Map();
      try {
        effects = await buildingEngine.getEffectsForTerritories(territories.map((t) => t.id));
      } catch (err) {
        console.error('[Decay] Building effects batch error:', err);
      }

      for (const territory of territories) {
        const daysSince = this.getDaysSince(territory.last_defended);
        const shieldActive = effects.get(territory.id)?.shieldActive ?? false;
        const newDecay = DecayEngine.calculateDecay(
          daysSince,
          shieldActive ? { phase1Slowdown: BUILDINGS.SHIELD_DECAY_SLOWDOWN } : undefined
        );

        if (newDecay >= DECAY.TERRITORY.MAX) {
          // Territory becomes unclaimed
          await query(
            'UPDATE territories SET owner_id = NULL, decay_level = $1 WHERE id = $2',
            [DECAY.TERRITORY.MAX, territory.id]
          );
          removed++;
        } else if (Math.abs(newDecay - territory.decay_level) > 0.001) {
          // Update decay level if changed meaningfully
          await query(
            'UPDATE territories SET decay_level = $1 WHERE id = $2',
            [Math.round(newDecay * 10000) / 10000, territory.id]
          );
          updated++;
        }
      }

      console.log(`[Decay] Territories: ${updated} updated, ${removed} removed`);
    } catch (err) {
      console.error('[Decay] Territory decay error:', err);
    }

    return { updated, removed };
  }

  /**
   * Calculate decay level for a given number of days since last defense.
   *
   * Optional `phase1Slowdown` (0..1) flattens the Phase-1 ramp — a shielded
   * territory decays slower while the shield stands. The Phase-1 slope is
   * multiplied by (1 - slowdown); Phase 2 keeps its original slope and only
   * begins once the (now slower) Phase 1 has actually reached PHASE1_MAX, so
   * the transition point shifts later in time accordingly.
   *
   * With phase1Slowdown undefined/0 the behaviour is byte-for-byte identical
   * to the original formula (backward compatible for all legacy callers).
   *
   * @param daysSince - Days since the territory was last defended
   * @param opts.phase1Slowdown - Fractional slowdown of the Phase-1 ramp
   * @returns Decay level between 0.0 and 1.0
   */
  static calculateDecay(
    daysSince: number,
    opts?: { phase1Slowdown?: number }
  ): number {
    const slowdown = Math.max(0, Math.min(1, opts?.phase1Slowdown ?? 0));

    // Grace period: no decay in the first day
    if (daysSince <= DECAY.TERRITORY.GRACE_DAYS) {
      return 0.0;
    }

    const phase1Duration = DECAY.TERRITORY.PHASE1_END - DECAY.TERRITORY.GRACE_DAYS;
    // Original per-day Phase-1 slope, scaled down by the slowdown factor.
    const phase1Slope = (DECAY.TERRITORY.PHASE1_MAX / phase1Duration) * (1 - slowdown);

    // Days into the ramp.
    const elapsed = daysSince - DECAY.TERRITORY.GRACE_DAYS;

    // How long Phase 1 now takes to reach PHASE1_MAX (longer when slowed).
    // When slowdown == 0 this is exactly the original phase1Duration, so the
    // Phase-2 transition lands at PHASE1_END as before.
    const phase1RealDuration =
      phase1Slope > 0 ? DECAY.TERRITORY.PHASE1_MAX / phase1Slope : Infinity;

    // Phase 1: linear ramp from 0 toward PHASE1_MAX at the (slowed) slope.
    if (elapsed <= phase1RealDuration) {
      return elapsed * phase1Slope;
    }

    // Phase 2: original slope from PHASE1_START to MAX, starting at the
    // (possibly shifted) end of Phase 1.
    const phase2Elapsed = elapsed - phase1RealDuration;
    const phase2Slope =
      (DECAY.TERRITORY.MAX - DECAY.TERRITORY.PHASE2_START) / DECAY.TERRITORY.PHASE2_DAYS;
    const decay = DECAY.TERRITORY.PHASE2_START + phase2Elapsed * phase2Slope;

    return Math.min(DECAY.TERRITORY.MAX, decay);
  }

  /**
   * Run echo decay: expire active echos past their expiration date.
   * Echos with expires_at < now AND status = 'active' are set to 'decayed'.
   *
   * @returns Count of expired echos
   */
  async runEchoDecay(): Promise<{ removed: number }> {
    let removed = 0;

    try {
      const result = await query(
        `UPDATE echos SET status = 'expired'
         WHERE status = 'active'
         AND expires_at < NOW()
         RETURNING id`
      );

      removed = result.rowCount ?? 0;

      if (removed > 0) {
        console.log(`[Decay] ${removed} echos expired`);
      }
    } catch (err) {
      console.error('[Decay] Echo decay error:', err);
    }

    return { removed };
  }

  /**
   * Run quest decay: archive quests with no completions in 30 days
   * AND an average rating below 4.0.
   *
   * Quests with rating >= 4.0 are protected from decay.
   *
   * @returns Count of archived quests
   */
  async runQuestDecay(): Promise<{ removed: number }> {
    let removed = 0;

    try {
      const result = await query(
        `UPDATE quests SET status = 'archived'
         WHERE status = 'active'
         AND avg_rating < $1
         AND id NOT IN (
           SELECT DISTINCT quest_id FROM quest_progress
           WHERE started_at > NOW() - INTERVAL '${DECAY.QUEST.INACTIVE_DAYS} days'
         )
         AND created_at < NOW() - INTERVAL '${DECAY.QUEST.INACTIVE_DAYS} days'
         RETURNING id`,
        [DECAY.QUEST.RATING_PROTECTION]
      );

      removed = result.rowCount ?? 0;

      if (removed > 0) {
        console.log(`[Decay] ${removed} quests archived`);
      }
    } catch (err) {
      console.error('[Decay] Quest decay error:', err);
    }

    return { removed };
  }

  /**
   * Run challenge decay: archive challenges with no completions in 30 days.
   *
   * @returns Count of archived challenges
   */
  async runChallengeDecay(): Promise<{ removed: number }> {
    let removed = 0;

    try {
      const result = await query(
        `UPDATE challenges SET status = 'archived'
         WHERE status = 'active'
         AND id NOT IN (
           SELECT DISTINCT challenge_id FROM challenge_submissions
           WHERE submitted_at > NOW() - INTERVAL '${DECAY.CHALLENGE.INACTIVE_DAYS} days'
         )
         AND created_at < NOW() - INTERVAL '${DECAY.CHALLENGE.INACTIVE_DAYS} days'
         RETURNING id`
      );

      removed = result.rowCount ?? 0;

      if (removed > 0) {
        console.log(`[Decay] ${removed} challenges archived`);
      }
    } catch (err) {
      console.error('[Decay] Challenge decay error:', err);
    }

    return { removed };
  }

  /**
   * Check and promote content to legendary status.
   *
   * Promotion criteria:
   * - Quests with avg_rating >= 4.8 AND total_completions >= 50 become legendary
   * - Echos with likes >= 200 become legendary
   *
   * Legendary content is immune to decay.
   *
   * @returns Count of promoted items
   */
  async checkLegendaryPromotion(): Promise<{ promoted: number }> {
    let promoted = 0;

    try {
      // Promote quests to legendary
      const questResult = await query(
        `UPDATE quests
         SET status = 'legendary'
         WHERE status = 'active'
         AND avg_rating >= 4.8
         AND total_completions >= 50
         RETURNING id`
      );

      const questPromoted = questResult.rowCount ?? 0;
      promoted += questPromoted;

      if (questPromoted > 0) {
        console.log(`[Decay] ${questPromoted} quests promoted to legendary`);
      }

      // Promote echos to legendary
      const echoResult = await query(
        `UPDATE echos
         SET status = 'legendary'
         WHERE status = 'active'
         AND likes >= 200
         RETURNING id`
      );

      const echoPromoted = echoResult.rowCount ?? 0;
      promoted += echoPromoted;

      if (echoPromoted > 0) {
        console.log(`[Decay] ${echoPromoted} echos promoted to legendary`);
      }
    } catch (err) {
      console.error('[Decay] Legendary promotion error:', err);
    }

    return { promoted };
  }

  /**
   * Run all decay processes in sequence.
   * Intended to be called by a daily cron job (e.g., at 04:00).
   */
  async runAll(): Promise<void> {
    console.log('[Decay] Starting full decay cycle...');

    const territoryResult = await this.runTerritoryDecay();
    const echoResult = await this.runEchoDecay();
    const questResult = await this.runQuestDecay();
    const challengeResult = await this.runChallengeDecay();
    const legendaryResult = await this.checkLegendaryPromotion();

    console.log('[Decay] Cycle complete:', {
      territories: territoryResult,
      echos: echoResult,
      quests: questResult,
      challenges: challengeResult,
      legendary: legendaryResult,
    });
  }

  // ---- Helpers ----

  /**
   * Calculate fractional days since a date.
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return diff / (1000 * 60 * 60 * 24);
  }
}

// ---- Legacy functional exports for backward compatibility ----

const decayEngineInstance = new DecayEngine();

export async function processAllTerritoryDecay() {
  const result = await decayEngineInstance.runTerritoryDecay();
  return { updated: result.updated, unclaimed: result.removed };
}

export function calculateDecay(daysSince: number): number {
  return DecayEngine.calculateDecay(daysSince);
}

export async function processEchoDecay() {
  const result = await decayEngineInstance.runEchoDecay();
  return { expired: result.removed };
}

export async function processQuestDecay() {
  const result = await decayEngineInstance.runQuestDecay();
  return { archived: result.removed };
}

export async function processChallengeDecay() {
  const result = await decayEngineInstance.runChallengeDecay();
  return { archived: result.removed };
}

export async function runAllDecay(): Promise<void> {
  return decayEngineInstance.runAll();
}

export const decayEngine = decayEngineInstance;

/**
 * Reset territory decay at a specific GPS point.
 * Called when content activity (echo, like, quest step) occurs within a territory,
 * keeping the territory alive by resetting its last_defended timestamp.
 *
 * @param lat - Latitude of the activity
 * @param lng - Longitude of the activity
 */
export async function resetDecayAtPoint(lat: number, lng: number): Promise<void> {
  await query(
    `UPDATE territories SET last_defended = NOW()
     WHERE ST_Contains(polygon, ST_SetSRID(ST_MakePoint($1, $2), 4326))
     AND decay_level < 1.0`,
    [lng, lat]
  );
}

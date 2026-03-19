// ============================================================
// Claim Engine
// The heart of Gridwalker: processes GPS routes into territory
// claims with full bonus stacking, overlap handling, and takeovers
// ============================================================

import { GpsPoint, MovementClass, Territory, ClaimResult } from '../utils/types';
import { query, queryOne, queryMany, transaction } from '../config/database';
import {
  CLASS_MULTIPLIERS,
  STREAK_MULTIPLIERS,
  NOVELTY_MULTIPLIERS,
  TIME_MULTIPLIERS,
  CLAIM_BASE_AREA_DIVISOR,
  CLAIM_LOG_BASE,
  CLAIM_MULTIPLIER,
  TAKEOVER_DECAY_FACTOR,
  TERRITORY,
  ANTI_GRIND_RETURNS,
} from '../config/constants';
import { routeToPolygon } from '../utils/polygon';
import { polygonAreaM2, pathDistance, pathDuration } from '../utils/geo';
import { toWktPolygon } from '../utils/polygon';
import { getWeatherAtLocation } from './weatherService';
import { detectMovementClass } from './classDetection';
import { assessRoute, getAntiGrindMultiplier } from './antiCheat';
import { awardXp, calculateClaimXp, updateStreak } from './progressionEngine';
import { notifyTerritoryAttack, notifyTerritoryLost } from './notificationService';

/** Input data for processing a claim */
export interface ClaimInput {
  userId: string;
  points: GpsPoint[];
  overrideClass?: MovementClass;
}

/** Detailed breakdown of claim value calculation */
export interface ClaimCalculation {
  rawArea: number;
  logValue: number;
  classMultiplier: number;
  weatherMultiplier: number;
  streakMultiplier: number;
  noveltyMultiplier: number;
  timeMultiplier: number;
  antiGrindMultiplier: number;
  trustScore: number;
  finalValue: number;
}

/**
 * The Claim Engine processes GPS routes into territory claims.
 *
 * Pipeline:
 * 1. Detect/validate movement class
 * 2. Run anti-cheat assessment
 * 3. Convert route to polygon (smooth -> simplify -> close -> validate -> WKT)
 * 4. Validate area bounds
 * 5. Gather all bonus multipliers (weather, streak, novelty, time, class, anti-grind)
 * 6. Calculate claim value: log2(area/100) * 100 * all_multipliers
 * 7. Save route to database
 * 8. Handle overlaps and takeovers
 * 9. Award XP
 * 10. Log to feed
 */
export class ClaimEngine {
  /**
   * Process a completed GPS route into a territory claim.
   *
   * @param userId - The claiming player's ID
   * @param points - Array of GPS points forming the route
   * @param movementClass - Override class, or auto-detected if not provided
   * @returns Territory (if created), XP earned, and full calculation breakdown
   */
  async processRoute(
    userId: string,
    points: GpsPoint[],
    movementClass?: MovementClass
  ): Promise<{ territory?: Territory; xp: number; calculation: ClaimCalculation }> {
    // 1. Detect movement class
    const detectedClass = movementClass || detectMovementClass(points);

    // 2. Anti-cheat assessment
    const trustAssessment = await assessRoute(userId, points, detectedClass);

    if (trustAssessment.auto_reject) {
      throw new Error('Route rejected by anti-cheat system: ' + trustAssessment.flags.join('; '));
    }

    // 3. Convert route to polygon
    const polygonWkt = this.convertToPolygon(points);

    // 4. Validate area using PostGIS for accurate measurement
    const areaResult = await queryOne<{ area: number }>(
      `SELECT ST_Area(
        ST_SetSRID(ST_GeomFromEWKT($1), 4326)::geography
      ) as area`,
      [polygonWkt]
    );

    const fallbackPolygon = routeToPolygon(points);
    let areaM2 = areaResult?.area ?? (fallbackPolygon ? polygonAreaM2(fallbackPolygon) : 0);

    if (areaM2 < TERRITORY.MIN_AREA_M2) {
      throw new Error(
        `Territory too small: ${Math.round(areaM2)}m2 (minimum ${TERRITORY.MIN_AREA_M2}m2)`
      );
    }

    if (areaM2 > TERRITORY.MAX_AREA_M2) {
      throw new Error(
        `Territory too large: ${Math.round(areaM2)}m2 (maximum ${TERRITORY.MAX_AREA_M2}m2)`
      );
    }

    // 5. Gather all bonus multipliers

    // Weather bonus
    const centerLat = points.reduce((s, p) => s + (p.lat ?? p.latitude), 0) / points.length;
    const centerLng = points.reduce((s, p) => s + (p.lng ?? p.longitude), 0) / points.length;
    const weatherData = await getWeatherAtLocation(centerLat, centerLng);
    const weatherMultiplier = weatherData.bonus;

    // Streak bonus
    const streakDays = await updateStreak(userId);
    const streakMultiplier = this.getStreakBonus(streakDays);

    // Novelty bonus
    const noveltyMultiplier = await this.getNoveltyBonus(userId, polygonWkt);

    // Time bonus
    const timeMultiplier = this.getTimeBonus(new Date().getHours());

    // Class multiplier
    const classMultiplier = CLASS_MULTIPLIERS[detectedClass];

    // Anti-grind multiplier
    const antiGrindMultiplier = await this.checkDiminishingReturns(userId, polygonWkt);

    // 6. Calculate claim value
    const calculation = this.calculateClaimValue(
      areaM2,
      classMultiplier,
      weatherMultiplier,
      streakMultiplier,
      noveltyMultiplier,
      timeMultiplier,
      antiGrindMultiplier,
      trustAssessment.trust_score
    );

    // 7. Save route
    const distance = pathDistance(points);
    const duration = pathDuration(points);

    await query(
      `INSERT INTO routes (user_id, points, polygon, class, distance_m, duration_s, weather_bonus, trust_score)
       VALUES ($1, $2, ST_SetSRID(ST_MakeValid(ST_GeomFromEWKT($3)), 4326), $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        JSON.stringify(points),
        polygonWkt,
        detectedClass,
        distance,
        duration,
        weatherMultiplier,
        trustAssessment.trust_score,
      ]
    );

    // 8. Handle overlaps and takeovers
    const territoryResult = await this.handleTerritoryCreation(
      userId,
      polygonWkt,
      detectedClass,
      calculation.finalValue
    );

    // 9. Award XP
    const xpAmount = calculateClaimXp(calculation.finalValue);
    await awardXp(userId, xpAmount, 'territory_claim');

    // 10. Log to activity feed
    await query(
      `INSERT INTO feed_events (type, user_id, data)
       VALUES ('claim', $1, $2)`,
      [
        userId,
        JSON.stringify({
          territory_id: territoryResult.territory_id,
          claim_value: calculation.finalValue,
          class: detectedClass,
          area_m2: Math.round(areaM2),
          is_takeover: territoryResult.is_takeover,
        }),
      ]
    );

    // Fetch the created territory
    const territory = await queryOne<Territory>(
      'SELECT * FROM territories WHERE id = $1',
      [territoryResult.territory_id]
    );

    return {
      territory: territory ?? undefined,
      xp: xpAmount,
      calculation,
    };
  }

  // ---- Internal Methods ----

  /**
   * Convert raw GPS points into a validated PostGIS WKT polygon.
   * Pipeline: Smooth -> Simplify -> Close -> Validate -> WKT
   *
   * @param points - Raw GPS track
   * @returns EWKT polygon string (SRID=4326)
   */
  private convertToPolygon(points: GpsPoint[]): string {
    const polygonPoints = routeToPolygon(points);
    if (!polygonPoints || polygonPoints.length < 3) {
      throw new Error('Could not form a valid polygon from route');
    }

    // Ensure polygon is closed
    const first = polygonPoints[0];
    const last = polygonPoints[polygonPoints.length - 1];
    if (first.latitude !== last.latitude || first.longitude !== last.longitude) {
      polygonPoints.push({ ...first });
    }

    return toWktPolygon(polygonPoints);
  }

  /**
   * Calculate the claim value from area and all multipliers.
   *
   * Formula: log2(area/100) * 100 * class * weather * streak * novelty * time * antigrind * trust
   *
   * @returns Full calculation breakdown
   */
  private calculateClaimValue(
    areaM2: number,
    classMultiplier: number,
    weatherMultiplier: number,
    streakMultiplier: number,
    noveltyMultiplier: number,
    timeMultiplier: number,
    antiGrindMultiplier: number,
    trustScore: number
  ): ClaimCalculation {
    const logValue = Math.log2(areaM2 / CLAIM_BASE_AREA_DIVISOR);
    const rawValue = logValue * CLAIM_MULTIPLIER;

    const finalValue = Math.max(
      1,
      Math.round(
        rawValue *
          classMultiplier *
          weatherMultiplier *
          streakMultiplier *
          noveltyMultiplier *
          timeMultiplier *
          antiGrindMultiplier *
          trustScore
      )
    );

    return {
      rawArea: areaM2,
      logValue,
      classMultiplier,
      weatherMultiplier,
      streakMultiplier,
      noveltyMultiplier,
      timeMultiplier,
      antiGrindMultiplier,
      trustScore,
      finalValue,
    };
  }

  /**
   * Find all existing territories that overlap with the new polygon.
   * Uses PostGIS ST_Intersects for spatial queries.
   *
   * @param polygonWkt - The new polygon in WKT
   * @param userId - Claiming user (excluded from overlap check)
   * @returns Overlapping territories
   */
  private async checkOverlaps(
    polygonWkt: string,
    userId: string
  ): Promise<
    { id: string; owner_id: string; claim_value: number; decay_level: number }[]
  > {
    const result = await queryMany<{
      id: string;
      owner_id: string;
      claim_value: number;
      decay_level: number;
    }>(
      `SELECT id, owner_id, claim_value, decay_level
       FROM territories
       WHERE ST_Intersects(polygon, ST_SetSRID(ST_GeomFromEWKT($1), 4326))
       AND owner_id IS NOT NULL
       AND owner_id != $2
       ORDER BY claim_value DESC`,
      [polygonWkt, userId]
    );

    return result;
  }

  /**
   * Handle territory creation, including takeover logic.
   *
   * Takeover condition: new_value > existing_value * (1 - decay * 0.7)
   *
   * When a takeover succeeds:
   * 1. Notify the previous owner of the attack
   * 2. Notify them of the loss
   * 3. Set the old territory owner to NULL
   * 4. Create the new territory
   */
  private async handleTerritoryCreation(
    userId: string,
    polygonWkt: string,
    cls: MovementClass,
    claimValue: number
  ): Promise<{ territory_id: string; is_takeover: boolean; previous_owner?: string }> {
    return transaction(async (client) => {
      // Find overlapping territories (lock for update)
      const overlaps = await client.query(
        `SELECT id, owner_id, claim_value, decay_level
         FROM territories
         WHERE ST_Intersects(polygon, ST_SetSRID(ST_MakeValid(ST_GeomFromEWKT($1)), 4326))
         AND owner_id IS NOT NULL
         AND owner_id != $2
         ORDER BY claim_value DESC
         FOR UPDATE`,
        [polygonWkt, userId]
      );

      let is_takeover = false;
      let previous_owner: string | undefined;

      for (const existing of overlaps.rows) {
        const shouldTakeover = this.handleTakeover(claimValue, existing);

        if (shouldTakeover) {
          is_takeover = true;
          previous_owner = existing.owner_id;

          // Notify previous owner
          if (existing.owner_id) {
            try {
              await notifyTerritoryAttack(existing.owner_id, existing.id, userId);
              await notifyTerritoryLost(existing.owner_id, existing.id, userId);
            } catch (err) {
              console.error('[ClaimEngine] Failed to send takeover notification:', err);
            }
          }

          // Unclaim the existing territory
          await client.query(
            'UPDATE territories SET owner_id = NULL WHERE id = $1',
            [existing.id]
          );
        }
      }

      // Create the new territory using PostGIS for valid geometry
      const result = await client.query(
        `INSERT INTO territories (owner_id, polygon, class, claim_value)
         VALUES ($1, ST_SetSRID(ST_MakeValid(ST_GeomFromEWKT($2)), 4326), $3, $4)
         RETURNING id`,
        [userId, polygonWkt, cls, claimValue]
      );

      return {
        territory_id: result.rows[0].id,
        is_takeover,
        previous_owner,
      };
    });
  }

  /**
   * Compare a new claim against an existing territory to determine takeover.
   *
   * Takeover succeeds if: new_value > existing_value * (1 - decay * 0.7)
   *
   * The decay factor makes territories easier to take over as they age
   * without being defended.
   *
   * @param newClaimValue - Value of the new claim
   * @param existing - The existing territory data
   * @returns Whether the takeover should proceed
   */
  private handleTakeover(
    newClaimValue: number,
    existing: { claim_value: number; decay_level: number }
  ): boolean {
    const effectiveValue = existing.claim_value * (1 - existing.decay_level * TAKEOVER_DECAY_FACTOR);
    return newClaimValue > effectiveValue;
  }

  /**
   * Check diminishing returns for repeated routes over the same area
   * within a 24-hour window.
   *
   * Returns: 1.0 (first), 0.5 (second), 0.25 (third), 0.1 (fourth+)
   *
   * @param userId - Player ID
   * @param polygonWkt - WKT polygon of the new route
   * @returns Diminishing returns multiplier
   */
  private async checkDiminishingReturns(
    userId: string,
    polygonWkt: string
  ): Promise<number> {
    try {
      const result = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM routes
         WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '24 hours'
         AND polygon IS NOT NULL
         AND ST_Intersects(polygon, ST_SetSRID(ST_GeomFromEWKT($2), 4326))`,
        [userId, polygonWkt]
      );

      const count = parseInt(result?.count || '0', 10);
      return ANTI_GRIND_RETURNS[Math.min(count, ANTI_GRIND_RETURNS.length - 1)];
    } catch {
      return 1.0;
    }
  }

  /**
   * Look up streak bonus multiplier from the STREAK_MULTIPLIERS table.
   * The table is sorted by days descending, so we return the first match.
   *
   * @param streakDays - Current streak length
   * @returns Streak multiplier (1.0 if no tier matched)
   */
  private getStreakBonus(streakDays: number): number {
    for (const tier of STREAK_MULTIPLIERS) {
      if (streakDays >= tier.days) {
        return tier.multiplier;
      }
    }
    return 1.0;
  }

  /**
   * Get the time-of-day bonus multiplier.
   *
   * Time slots from TIME_MULTIPLIERS:
   * - 05:00-07:00: 1.3 (early morning)
   * - 07:00-22:00: 1.0 (normal hours)
   * - 22:00-05:00: 1.5 (night)
   *
   * @param hour - Current hour (0-23)
   * @returns Time multiplier
   */
  private getTimeBonus(hour: number): number {
    for (const slot of TIME_MULTIPLIERS) {
      if (slot.start < slot.end) {
        if (hour >= slot.start && hour < slot.end) {
          return slot.multiplier;
        }
      } else {
        // Wrapping range (e.g., 22-5)
        if (hour >= slot.start || hour < slot.end) {
          return slot.multiplier;
        }
      }
    }
    return 1.0;
  }

  /**
   * Determine the novelty bonus for a claim.
   *
   * - FIRST_EVER_CLAIM (2.0): Player has never claimed any territory
   * - NEW_STREET (1.3): This area doesn't overlap any of the player's previous routes
   * - REPEAT (1.0): Player has been here before
   *
   * @param userId - Player ID
   * @param polygonWkt - WKT polygon of the new claim
   * @returns Novelty multiplier
   */
  private async getNoveltyBonus(userId: string, polygonWkt: string): Promise<number> {
    // Check if user has any territories at all (first ever claim)
    const anyTerritory = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM territories WHERE owner_id = $1',
      [userId]
    );

    if (parseInt(anyTerritory?.count || '0', 10) === 0) {
      return NOVELTY_MULTIPLIERS.FIRST_EVER_CLAIM;
    }

    // Check if this area overlaps with any of user's previous routes
    const overlap = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM routes
       WHERE user_id = $1
       AND polygon IS NOT NULL
       AND ST_Intersects(polygon, ST_SetSRID(ST_GeomFromEWKT($2), 4326))`,
      [userId, polygonWkt]
    );

    if (parseInt(overlap?.count || '0', 10) === 0) {
      return NOVELTY_MULTIPLIERS.NEW_STREET;
    }

    return NOVELTY_MULTIPLIERS.REPEAT;
  }
}

// ---- Legacy functional export for backward compatibility ----

const claimEngineInstance = new ClaimEngine();

/**
 * @deprecated Use claimEngine.processRoute() instead
 */
export async function processRouteClaim(input: ClaimInput): Promise<ClaimResult> {
  const result = await claimEngineInstance.processRoute(
    input.userId,
    input.points,
    input.overrideClass
  );

  return {
    territory_id: result.territory?.id ?? '',
    claim_value: result.calculation.finalValue,
    xp_earned: result.xp,
    is_takeover: false,
    bonuses: {
      weather: result.calculation.weatherMultiplier,
      streak: result.calculation.streakMultiplier,
      novelty: result.calculation.noveltyMultiplier,
      time: result.calculation.timeMultiplier,
      class: result.calculation.classMultiplier,
    },
  };
}

export const claimEngine = claimEngineInstance;

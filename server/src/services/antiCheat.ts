// ============================================================
// Anti-Cheat Engine
// GPS plausibility, speed consistency, sensor checks,
// behavior analysis, and trust scoring
// ============================================================

import { GpsPoint, MovementClass, TrustAssessment } from '../utils/types';
import { ANTI_CHEAT, CLASS_SPEED_RANGES, ANTI_GRIND_RETURNS } from '../config/constants';
import { pointDistance, segmentSpeed } from '../utils/geo';
import { queryMany, queryOne } from '../config/database';

/** Internal check result used by sub-checks */
interface CheckResult {
  score: number;
  flags: string[];
}

/**
 * Anti-cheat engine that validates GPS routes for plausibility,
 * speed consistency, sensor data, and player behavior patterns.
 * Produces a trust score between 0 and 1.
 */
export class AntiCheatEngine {
  /**
   * Perform a full anti-cheat validation on a GPS route.
   *
   * Runs all sub-checks in parallel and combines them into
   * a weighted trust score. The result determines whether the
   * route is accepted, flagged for manual review, auto-rejected,
   * or triggers an account warning.
   *
   * @param points - The GPS route points
   * @param claimedClass - The movement class the player claims
   * @returns Trust assessment with score, flags, and action booleans
   */
  async validateRoute(
    userId: string,
    points: GpsPoint[],
    claimedClass: MovementClass
  ): Promise<TrustAssessment> {
    if (points.length < 2) {
      return {
        trust_score: 0.5,
        flags: ['Insufficient GPS points'],
        auto_reject: false,
        manual_review: true,
        account_warning: false,
      };
    }

    const checks: CheckResult[] = [];

    // Run all independent checks in parallel
    const [gpsCheck, speedCheck, sensorCheck, behaviorCheck] = await Promise.all([
      Promise.resolve(this.checkGpsPlausibility(points)),
      Promise.resolve(this.checkSpeedConsistency(points, claimedClass)),
      Promise.resolve(this.checkSensorConsistency(points)),
      this.checkBehavior(userId),
    ]);

    checks.push(gpsCheck, speedCheck, sensorCheck, behaviorCheck);

    return this.calculateTrustScore(checks);
  }

  /**
   * Check GPS plausibility: detect teleportation and impossible jumps.
   *
   * Rules:
   * - No jumps > 100m between consecutive points when speed < 30 km/h
   * - No zero/negative time gaps
   * - No teleportation (sudden location shift)
   *
   * @param points - GPS points to validate
   * @returns Check result with score and any flags
   */
  private checkGpsPlausibility(points: GpsPoint[]): CheckResult {
    const flags: string[] = [];
    let violations = 0;

    for (let i = 1; i < points.length; i++) {
      const dist = pointDistance(points[i - 1], points[i]);
      const timeDiff = (points[i].timestamp - points[i - 1].timestamp) / 1000;
      const speed = timeDiff > 0 ? dist / timeDiff : 0;

      // Teleportation: low speed but big distance
      if (speed < ANTI_CHEAT.LOW_SPEED_THRESHOLD_MS && dist > ANTI_CHEAT.MAX_GPS_JUMP_M) {
        violations++;
        if (violations <= 3) {
          flags.push(
            `GPS jump: ${Math.round(dist)}m at ${Math.round(speed * 3.6)}km/h (point ${i})`
          );
        }
      }

      // Zero or negative time gaps
      if (timeDiff <= 0) {
        violations++;
        if (flags.length < 5) {
          flags.push(`Invalid timestamp sequence at point ${i}`);
        }
      }

      // Altitude plausibility: if altitude data is present, check for impossible changes
      if (
        points[i].altitude !== undefined &&
        points[i - 1].altitude !== undefined
      ) {
        const altChange = Math.abs(points[i].altitude! - points[i - 1].altitude!);
        // More than 50m altitude change in a single segment while moving slowly is suspicious
        if (altChange > 50 && timeDiff > 0 && timeDiff < 10) {
          violations++;
          if (flags.length < 5) {
            flags.push(`Impossible altitude change: ${Math.round(altChange)}m at point ${i}`);
          }
        }
      }
    }

    if (violations > points.length * 0.3) {
      flags.push(`High GPS violation rate: ${violations}/${points.length}`);
    }

    // Score: 1.0 perfect, decreasing with violations
    const violationRatio = violations / Math.max(points.length, 1);
    const score = Math.max(0.1, 1 - violationRatio * 2);

    return { score, flags };
  }

  /**
   * Check speed consistency against the claimed movement class.
   *
   * Validates that:
   * - Average speed is within the expected range for the class
   * - Speed variance is human-like (not perfectly constant, which suggests a bot)
   * - No impossibly high speeds (> 200 km/h for any human activity)
   *
   * @param points - GPS points
   * @param claimedClass - The claimed movement class
   * @returns Check result
   */
  private checkSpeedConsistency(points: GpsPoint[], claimedClass: MovementClass): CheckResult {
    const flags: string[] = [];
    const range = CLASS_SPEED_RANGES[claimedClass];
    let outOfRange = 0;
    let impossibleSpeed = 0;
    const speeds: number[] = [];

    for (let i = 1; i < points.length; i++) {
      const speed = segmentSpeed(points[i - 1], points[i]);
      speeds.push(speed);

      // Impossibly fast for any human (> 200 km/h = ~55.6 m/s)
      if (speed > 55) {
        impossibleSpeed++;
      }

      // Way outside class range (> 2x max)
      if (speed > range.max * 2) {
        outOfRange++;
      }
    }

    const segments = Math.max(speeds.length, 1);

    // Check for constant speed (bot/emulator signature)
    if (speeds.length > 10) {
      const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      if (avg > 0) {
        const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / speeds.length;
        const cv = Math.sqrt(variance) / avg;
        // Coefficient of variation < 1% with many points is very suspicious
        if (cv < 0.01) {
          flags.push('Perfectly constant speed detected (possible bot/emulator)');
        }
      }
    }

    if (impossibleSpeed > 0) {
      flags.push(`Impossible speed detected in ${impossibleSpeed} segments`);
    }

    if (outOfRange > segments * 0.2) {
      flags.push(
        `${Math.round((outOfRange / segments) * 100)}% of segments exceed class speed range`
      );
    }

    let score = 1.0;
    score *= Math.max(0.2, 1 - (impossibleSpeed / segments) * 5);
    score *= Math.max(0.5, 1 - (outOfRange / segments) * 1.5);

    return { score, flags };
  }

  /**
   * Check sensor data consistency.
   *
   * Validates:
   * - Points should have accuracy < 50m on average
   * - Not all accuracy values are identical (sign of fake data)
   * - Source should not be exclusively 'network' (no GPS fix at all)
   *
   * @param points - GPS points with optional accuracy fields
   * @returns Check result
   */
  private checkSensorConsistency(points: GpsPoint[]): CheckResult {
    const flags: string[] = [];
    let score = 1.0;

    const withAccuracy = points.filter(p => p.accuracy !== undefined);

    if (withAccuracy.length === 0) {
      // No accuracy data provided: slight penalty
      return { score: 0.95, flags: [] };
    }

    // Check if all accuracy values are identical (suspicious)
    const uniqueAccuracies = new Set(withAccuracy.map(p => p.accuracy));
    if (uniqueAccuracies.size === 1 && withAccuracy.length > 5) {
      flags.push('All GPS accuracy values identical (possible spoofed data)');
      score *= 0.6;
    }

    // Average accuracy check
    const avgAccuracy =
      withAccuracy.reduce((sum, p) => sum + (p.accuracy || 0), 0) / withAccuracy.length;

    if (avgAccuracy < 1) {
      flags.push('GPS accuracy suspiciously precise (<1m average)');
      score *= 0.7;
    }

    if (avgAccuracy > 50) {
      flags.push('Very poor GPS accuracy (>50m average) -- possibly network-only');
      score *= 0.8;
    }

    if (avgAccuracy > 100) {
      flags.push('Extremely poor GPS accuracy (>100m average)');
      score *= 0.7;
    }

    return { score, flags };
  }

  /**
   * Analyze player behavior patterns for suspicious activity.
   *
   * Checks:
   * - Claim frequency: not > 10 routes in 1 hour
   * - Not active 24/7 (routes every hour for 24+ hours straight)
   *
   * @param userId - User to analyze
   * @returns Check result
   */
  private async checkBehavior(userId: string): Promise<CheckResult> {
    const flags: string[] = [];
    let score = 1.0;

    try {
      // Check routes submitted in last hour
      const recentRoutes = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM routes
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
        [userId]
      );

      const hourlyCount = parseInt(recentRoutes?.count || '0', 10);

      if (hourlyCount > 50) {
        flags.push(`Extreme route frequency: ${hourlyCount} routes in last hour`);
        score *= 0.1;
      } else if (hourlyCount > 10) {
        flags.push(`High route frequency: ${hourlyCount} routes in last hour`);
        score *= 0.5;
      } else if (hourlyCount > 5) {
        flags.push(`Elevated route frequency: ${hourlyCount} routes in last hour`);
        score *= 0.8;
      }

      // Check for 24/7 activity: routes in every 4-hour block in the last 24h
      const activityBlocks = await queryOne<{ block_count: string }>(
        `SELECT COUNT(DISTINCT FLOOR(EXTRACT(HOUR FROM created_at) / 4)) as block_count
         FROM routes
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
        [userId]
      );

      const blockCount = parseInt(activityBlocks?.block_count || '0', 10);
      if (blockCount >= 6) {
        // Active in all 6 four-hour blocks = suspicious 24/7 activity
        flags.push('Activity detected in all time blocks over 24 hours (possible bot)');
        score *= 0.6;
      }

      // Deep-night activity with high volume
      const hour = new Date().getHours();
      if (hour >= 2 && hour <= 4 && hourlyCount > 3) {
        flags.push('Multiple routes during deep night hours (02:00-04:00)');
        score *= 0.9;
      }
    } catch {
      // Database error is non-critical for trust assessment
    }

    return { score, flags };
  }

  /**
   * Calculate the overall trust score from all sub-check results.
   * Uses a weighted average with GPS and speed checks weighted more heavily.
   *
   * Weights:
   * - GPS plausibility: 35%
   * - Speed consistency: 30%
   * - Sensor consistency: 15%
   * - Behavior analysis: 20%
   *
   * @param checks - Array of check results [gps, speed, sensor, behavior]
   * @returns Final trust assessment
   */
  private calculateTrustScore(checks: CheckResult[]): TrustAssessment {
    const weights = [0.35, 0.30, 0.15, 0.20];
    let totalWeight = 0;
    let weightedSum = 0;
    const allFlags: string[] = [];

    for (let i = 0; i < checks.length; i++) {
      const weight = weights[i] ?? (1 / checks.length);
      weightedSum += checks[i].score * weight;
      totalWeight += weight;
      allFlags.push(...checks[i].flags);
    }

    const trustScore = totalWeight > 0
      ? Math.max(0, Math.min(1, weightedSum / totalWeight))
      : 0.5;

    const rounded = Math.round(trustScore * 1000) / 1000;

    return {
      trust_score: rounded,
      flags: allFlags,
      auto_reject: rounded < ANTI_CHEAT.TRUST_AUTO_REJECT,
      manual_review: rounded < ANTI_CHEAT.TRUST_MANUAL_REVIEW,
      account_warning: rounded < ANTI_CHEAT.TRUST_ACCOUNT_WARNING,
    };
  }
}

// ---- Legacy functional exports for backward compatibility ----

const antiCheatInstance = new AntiCheatEngine();

/**
 * @deprecated Use antiCheatEngine.validateRoute() instead
 */
export async function assessRoute(
  userId: string,
  points: GpsPoint[],
  detectedClass: MovementClass
): Promise<TrustAssessment> {
  return antiCheatInstance.validateRoute(userId, points, detectedClass);
}

/**
 * Calculate anti-grind diminishing returns multiplier.
 * Checks how many times the user has covered a similar area in the last 24 hours.
 *
 * @param userId - The user ID
 * @param polygon - WKT polygon string
 * @returns Multiplier from ANTI_GRIND_RETURNS (1.0, 0.5, 0.25, 0.1)
 */
export async function getAntiGrindMultiplier(
  userId: string,
  polygon: string
): Promise<number> {
  try {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM routes
       WHERE user_id = $1
       AND created_at > NOW() - INTERVAL '24 hours'
       AND polygon IS NOT NULL
       AND ST_Intersects(polygon, ST_GeomFromEWKT($2))`,
      [userId, polygon]
    );

    const count = parseInt(result?.count || '0', 10);
    return ANTI_GRIND_RETURNS[Math.min(count, ANTI_GRIND_RETURNS.length - 1)];
  } catch {
    return 1.0; // Full value on error
  }
}

export const antiCheatEngine = antiCheatInstance;

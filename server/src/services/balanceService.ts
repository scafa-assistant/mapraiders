// ============================================================
// Balance Service
// Anti-frustration and fairness mechanics from the Kreuzanalyse:
// newcomer protection, return bonus, home zones, route delay,
// consolation XP, first-walk bonus, daily loss cap, monuments.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { awardXp } from './progressionEngine';

// ---- Constants ----

/** Newcomer protection lasts 7 days after account creation. */
const NEWCOMER_DAYS = 7;

/** Newcomer claims are 50% harder to take over (1.5x effective value). */
const NEWCOMER_MULTIPLIER = 1.5;

/** Days of inactivity before return bonus activates. */
const RETURN_INACTIVE_DAYS = 7;

/** Duration of return bonus in hours. */
const RETURN_BONUS_HOURS = 48;

/** Return bonus claim value multiplier. */
const RETURN_BONUS_MULTIPLIER = 2.0;

/** Home zone radius in meters. */
const HOME_ZONE_RADIUS_M = 200;

/** Route visibility delay in milliseconds (15 minutes). */
const ROUTE_VISIBILITY_DELAY_MS = 15 * 60 * 1000;

/** Consolation XP percentage on failed claims. */
const CONSOLATION_XP_PERCENT = 0.10;

/** First-walk bonus multiplier for streets never claimed by anyone. */
const FIRST_WALK_MULTIPLIER = 2.0;

/** Max percentage of total territory a player can lose per day. */
const MAX_DAILY_LOSS_PERCENT = 0.30;

/** Days of inactivity before a monument is created. */
const MONUMENT_INACTIVE_DAYS = 30;

// ============================================================
// Balance Service
// ============================================================

class BalanceService {
  // ------------------------------------------------------------------
  // Newcomer Protection
  // First 7 days, claims 50% harder to take (defender's effective
  // value multiplied by 1.5).
  // ------------------------------------------------------------------

  /**
   * Get the newcomer protection multiplier for a user.
   * Returns 1.5 if account is < 7 days old, 1.0 otherwise.
   */
  async getNewcomerProtection(userId: string): Promise<number> {
    const user = await queryOne<{ created_at: Date }>(
      'SELECT created_at FROM users WHERE id = $1',
      [userId],
    );

    if (!user) return 1.0;

    const daysSinceCreation =
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceCreation <= NEWCOMER_DAYS ? NEWCOMER_MULTIPLIER : 1.0;
  }

  // ------------------------------------------------------------------
  // Return Bonus
  // After 7+ days inactive, 48h double claim value.
  // ------------------------------------------------------------------

  /**
   * Check and activate the return bonus for a user.
   * If the user has been inactive for 7+ days and return bonus
   * is not already active, activate a 48h bonus window.
   */
  async getReturnBonus(userId: string): Promise<{
    active: boolean;
    multiplier: number;
    expiresAt: Date | null;
  }> {
    const user = await queryOne<{
      last_active: Date;
      return_bonus_until: Date | null;
    }>(
      'SELECT last_active, return_bonus_until FROM users WHERE id = $1',
      [userId],
    );

    if (!user) {
      return { active: false, multiplier: 1.0, expiresAt: null };
    }

    // Check if return bonus is already active
    if (user.return_bonus_until && new Date(user.return_bonus_until) > new Date()) {
      return {
        active: true,
        multiplier: RETURN_BONUS_MULTIPLIER,
        expiresAt: new Date(user.return_bonus_until),
      };
    }

    // Check if user was inactive long enough to qualify
    const daysSinceActive =
      (Date.now() - new Date(user.last_active).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive >= RETURN_INACTIVE_DAYS) {
      const expiresAt = new Date(Date.now() + RETURN_BONUS_HOURS * 60 * 60 * 1000);

      await query(
        'UPDATE users SET return_bonus_until = $1 WHERE id = $2',
        [expiresAt, userId],
      );

      return {
        active: true,
        multiplier: RETURN_BONUS_MULTIPLIER,
        expiresAt,
      };
    }

    return { active: false, multiplier: 1.0, expiresAt: null };
  }

  // ------------------------------------------------------------------
  // Home Zone
  // 200m radius around chosen address; claims not shown publicly.
  // ------------------------------------------------------------------

  /**
   * Set the user's home zone center. Claims within this zone
   * are hidden from public territory views.
   */
  async setHomeZone(userId: string, lat: number, lng: number): Promise<void> {
    await query(
      'UPDATE users SET home_zone_lat = $1, home_zone_lng = $2 WHERE id = $3',
      [lat, lng, userId],
    );
  }

  /**
   * Check if a location is within the user's home zone.
   */
  async isInHomeZone(userId: string, lat: number, lng: number): Promise<boolean> {
    const user = await queryOne<{ home_zone_lat: number | null; home_zone_lng: number | null }>(
      'SELECT home_zone_lat, home_zone_lng FROM users WHERE id = $1',
      [userId],
    );

    if (!user || user.home_zone_lat == null || user.home_zone_lng == null) {
      return false;
    }

    // PostGIS distance check
    const result = await queryOne<{ within: boolean }>(
      `SELECT ST_DWithin(
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
        $5
      ) AS within`,
      [lng, lat, user.home_zone_lng, user.home_zone_lat, HOME_ZONE_RADIUS_M],
    );

    return result?.within ?? false;
  }

  // ------------------------------------------------------------------
  // Route Delay (Anti-Stalking)
  // Routes visible 15 min after completion.
  // ------------------------------------------------------------------

  /**
   * Get the route visibility delay in milliseconds.
   */
  getRouteVisibilityDelay(): number {
    return ROUTE_VISIBILITY_DELAY_MS;
  }

  // ------------------------------------------------------------------
  // Consolation XP
  // Always get some XP even on failed claims.
  // ------------------------------------------------------------------

  /**
   * Calculate consolation XP for a failed claim attempt.
   * Returns 10% of what normal XP would have been.
   */
  getConsolationXp(attemptedArea: number): number {
    const normalXp = Math.round(Math.log2(Math.max(1, attemptedArea / 100)) * 100);
    return Math.max(1, Math.round(normalXp * CONSOLATION_XP_PERCENT));
  }

  // ------------------------------------------------------------------
  // First-Walk Bonus
  // 2x multiplier for streets never claimed by anyone.
  // ------------------------------------------------------------------

  /**
   * Check if a location has never been claimed before (by anyone).
   * Returns 2.0 multiplier if virgin territory, 1.0 otherwise.
   */
  async getFirstWalkBonus(lat: number, lng: number): Promise<number> {
    const existing = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM territories
       WHERE ST_DWithin(
         polygon::geography,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         50
       )`,
      [lng, lat],
    );

    const count = parseInt(existing?.count || '0', 10);
    return count === 0 ? FIRST_WALK_MULTIPLIER : 1.0;
  }

  // ------------------------------------------------------------------
  // Daily Loss Limit
  // Max 30% territory loss per day.
  // ------------------------------------------------------------------

  /**
   * Check if a defender can still lose territory today.
   * Returns true if the defender has not hit the 30% daily loss cap.
   */
  async checkDailyLossLimit(userId: string): Promise<boolean> {
    const user = await queryOne<{
      daily_territory_lost: number;
      daily_loss_reset_at: Date;
    }>(
      'SELECT daily_territory_lost, daily_loss_reset_at FROM users WHERE id = $1',
      [userId],
    );

    if (!user) return true;

    // Reset the counter if it has been more than 24h
    const hoursSinceReset =
      (Date.now() - new Date(user.daily_loss_reset_at).getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      await query(
        'UPDATE users SET daily_territory_lost = 0, daily_loss_reset_at = NOW() WHERE id = $1',
        [userId],
      );
      return true;
    }

    // Get total territory count
    const total = await queryOne<{ count: string }>(
      'SELECT COUNT(*) AS count FROM territories WHERE owner_id = $1',
      [userId],
    );

    const totalCount = parseInt(total?.count || '0', 10);
    if (totalCount === 0) return true;

    const maxLoss = Math.ceil(totalCount * MAX_DAILY_LOSS_PERCENT);
    return user.daily_territory_lost < maxLoss;
  }

  /**
   * Record a territory loss for daily loss tracking.
   */
  async recordTerritoryLoss(userId: string): Promise<void> {
    await query(
      `UPDATE users SET daily_territory_lost = daily_territory_lost + 1 WHERE id = $1`,
      [userId],
    );
  }

  // ------------------------------------------------------------------
  // Monument
  // After 30 days inactive, leave a permanent marker.
  // ------------------------------------------------------------------

  /**
   * Check if a user qualifies for a monument (30+ days inactive).
   * If so, creates a monument at their most-claimed location.
   */
  async checkMonument(userId: string): Promise<void> {
    const user = await queryOne<{
      last_active: Date;
      username: string;
      xp: number;
    }>(
      'SELECT last_active, username, xp FROM users WHERE id = $1',
      [userId],
    );

    if (!user) return;

    const daysSinceActive =
      (Date.now() - new Date(user.last_active).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive < MONUMENT_INACTIVE_DAYS) return;

    // Check if monument already exists
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM monuments WHERE user_id = $1',
      [userId],
    );

    if (existing) return;

    // Find the user's most-claimed location (centroid of their most recent territory)
    const location = await queryOne<{ lat: number; lng: number; claim_count: number }>(
      `SELECT
         ST_Y(ST_Centroid(polygon)) AS lat,
         ST_X(ST_Centroid(polygon)) AS lng,
         COUNT(*) AS claim_count
       FROM territories
       WHERE owner_id = $1
       GROUP BY polygon
       ORDER BY claim_count DESC
       LIMIT 1`,
      [userId],
    );

    if (!location) return;

    const totalClaims = await queryOne<{ count: string }>(
      'SELECT COUNT(*) AS count FROM territories WHERE owner_id = $1',
      [userId],
    );

    await query(
      `INSERT INTO monuments (user_id, username, location, total_claims, total_xp)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6)`,
      [
        userId,
        user.username,
        location.lng,
        location.lat,
        parseInt(totalClaims?.count || '0', 10),
        user.xp,
      ],
    );

    console.log(`[BalanceService] Monument created for inactive player ${user.username}`);
  }

  // ------------------------------------------------------------------
  // Batch monument check (called by cron)
  // ------------------------------------------------------------------

  /**
   * Check all users who have been inactive for 30+ days
   * and create monuments for those who qualify.
   */
  async checkAllMonuments(): Promise<number> {
    const inactiveUsers = await queryMany<{ id: string }>(
      `SELECT id FROM users
       WHERE last_active < NOW() - INTERVAL '${MONUMENT_INACTIVE_DAYS} days'
         AND banned = FALSE
         AND id NOT IN (SELECT user_id FROM monuments)
       LIMIT 100`,
    );

    let created = 0;
    for (const user of inactiveUsers) {
      try {
        await this.checkMonument(user.id);
        created++;
      } catch (err) {
        console.error(`[BalanceService] Monument check failed for ${user.id}:`, err);
      }
    }

    return created;
  }
}

// ---- Singleton export ----
export const balanceService = new BalanceService();

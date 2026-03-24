// ============================================================
// Resonance Service
// Cross-content synergy bonus system. When multiple content
// types (quest, echo, artifact, challenge) overlap within 30m,
// a "resonance" is created, awarding bonus XP.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { toWktPoint as pointToWkt } from '../utils/polygon';
import { XP } from '../config/constants';

/** Bonus multiplier based on how many content types overlap */
const RESONANCE_BONUSES: Record<number, number> = {
  2: 1.25,
  3: 1.50,
  4: 2.00,
};

/** Base XP awarded for discovering a resonance spot */
const RESONANCE_BASE_XP = 100;

/** Content types that can form resonance */
type ContentType = 'quest' | 'echo' | 'artifact' | 'challenge';

/**
 * Compute a grid cell identifier from lat/lng coordinates.
 * Uses ~100m grid cells for resonance grouping.
 */
function computeGridCell(lat: number, lng: number): string {
  const latCell = Math.floor(lat * 1000);
  const lngCell = Math.floor(lng * 1000);
  return `${latCell}:${lngCell}`;
}

/**
 * Resonance service handling cross-content synergy detection,
 * bonus XP awards, and resonance spot management.
 */
export class ResonanceService {
  /**
   * Check if placing new content at a location creates a resonance.
   * Called after creating a quest, echo, artifact, or challenge.
   *
   * Logic:
   * - Query all content within 30m of the location
   * - Count distinct content types (quest, echo, artifact, challenge)
   * - If >= 2 different types overlap: RESONANCE!
   * - Resonance level = number of overlapping types
   * - Bonus: 2 types = 1.25x, 3 types = 1.5x, 4 types = 2.0x
   */
  async checkResonance(
    lat: number,
    lng: number,
    newContentType: ContentType,
    userId: string
  ): Promise<{
    resonance: boolean;
    level: number;
    bonus: number;
    types: string[];
  }> {
    try {
      const locationWkt = pointToWkt(lat, lng);
      const contentTypes = new Set<string>([newContentType]);

      // Check for quests within 30m (via their steps)
      if (newContentType !== 'quest') {
        const nearbyQuest = await queryOne(
          `SELECT 1 FROM quest_steps qs
           JOIN quests q ON qs.quest_id = q.id
           WHERE q.status = 'active'
           AND ST_DWithin(qs.location::geography, ST_GeomFromEWKT($1)::geography, 30)
           LIMIT 1`,
          [locationWkt]
        );
        if (nearbyQuest) contentTypes.add('quest');
      }

      // Check for echos within 30m
      if (newContentType !== 'echo') {
        const nearbyEcho = await queryOne(
          `SELECT 1 FROM echos
           WHERE status = 'active'
           AND expires_at > NOW()
           AND ST_DWithin(location::geography, ST_GeomFromEWKT($1)::geography, 30)
           LIMIT 1`,
          [locationWkt]
        );
        if (nearbyEcho) contentTypes.add('echo');
      }

      // Check for artifacts within 30m
      if (newContentType !== 'artifact') {
        const nearbyArtifact = await queryOne(
          `SELECT 1 FROM artifacts
           WHERE (is_permanent = TRUE OR expires_at > NOW())
           AND ST_DWithin(location::geography, ST_GeomFromEWKT($1)::geography, 30)
           LIMIT 1`,
          [locationWkt]
        );
        if (nearbyArtifact) contentTypes.add('artifact');
      }

      // Check for challenges within 30m
      if (newContentType !== 'challenge') {
        const nearbyChallenge = await queryOne(
          `SELECT 1 FROM challenges
           WHERE status = 'active'
           AND ST_DWithin(location::geography, ST_GeomFromEWKT($1)::geography, 30)
           LIMIT 1`,
          [locationWkt]
        );
        if (nearbyChallenge) contentTypes.add('challenge');
      }

      const typesArray = Array.from(contentTypes);
      const level = typesArray.length;

      if (level < 2) {
        return { resonance: false, level: 1, bonus: 1.0, types: typesArray };
      }

      const bonus = RESONANCE_BONUSES[Math.min(level, 4)] || 2.0;

      // Create or update resonance spot
      await this.upsertResonanceSpot(lat, lng, typesArray, level, bonus, userId);

      // Award resonance bonus XP
      await this.awardResonanceBonus(userId, level);

      // Log to feed
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('resonance_discovered', $1, $2)`,
        [userId, JSON.stringify({
          lat,
          lng,
          types: typesArray,
          level,
          bonus,
        })]
      );

      return { resonance: true, level, bonus, types: typesArray };
    } catch (err) {
      console.error('[Resonance] Error checking resonance:', err);
      return { resonance: false, level: 1, bonus: 1.0, types: [newContentType] };
    }
  }

  /**
   * Get nearby resonance spots for map display.
   */
  async getNearby(lat: number, lng: number, radiusM: number): Promise<any[]> {
    const locationWkt = pointToWkt(lat, lng);
    const cappedRadius = Math.min(radiusM, 50000);

    const spots = await queryMany(
      `SELECT id, content_types, resonance_level, bonus_multiplier,
              discovered_at, expires_at,
              ST_Y(location) as lat, ST_X(location) as lng,
              ST_Distance(location::geography, ST_GeomFromEWKT($1)::geography) as distance_m
       FROM resonance_spots
       WHERE (expires_at IS NULL OR expires_at > NOW())
       AND ST_DWithin(location::geography, ST_GeomFromEWKT($1)::geography, $2)
       ORDER BY resonance_level DESC, distance_m ASC
       LIMIT 100`,
      [locationWkt, cappedRadius]
    );

    return spots.map((s: any) => ({
      ...s,
      distance_m: parseFloat(s.distance_m || '0'),
    }));
  }

  /**
   * Get resonance spots within a bounding box (for global map view).
   */
  async getInBounds(north: number, south: number, east: number, west: number): Promise<any[]> {
    const spots = await queryMany(
      `SELECT id, content_types, resonance_level, bonus_multiplier,
              discovered_at, expires_at,
              ST_Y(location) as lat, ST_X(location) as lng
       FROM resonance_spots
       WHERE (expires_at IS NULL OR expires_at > NOW())
       AND ST_Intersects(location, ST_MakeEnvelope($1, $2, $3, $4, 4326))
       ORDER BY resonance_level DESC
       LIMIT 200`,
      [west, south, east, north]
    );

    return spots;
  }

  /**
   * Award resonance bonus XP to the user who triggered it.
   */
  async awardResonanceBonus(userId: string, resonanceLevel: number): Promise<number> {
    const xpAmount = RESONANCE_BASE_XP * resonanceLevel;

    await query(
      'UPDATE users SET xp = xp + $1 WHERE id = $2',
      [xpAmount, userId]
    );

    return xpAmount;
  }

  /**
   * Create or update a resonance spot at the given location.
   */
  private async upsertResonanceSpot(
    lat: number,
    lng: number,
    types: string[],
    level: number,
    bonus: number,
    userId: string
  ): Promise<void> {
    const locationWkt = pointToWkt(lat, lng);
    const gridCell = computeGridCell(lat, lng);

    // Check if there's already a resonance spot within 30m
    const existing = await queryOne<{ id: string; content_types: string[]; resonance_level: number }>(
      `SELECT id, content_types, resonance_level FROM resonance_spots
       WHERE ST_DWithin(location::geography, ST_GeomFromEWKT($1)::geography, 30)
       AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [locationWkt]
    );

    if (existing) {
      // Merge content types and upgrade level if needed
      const mergedTypes = Array.from(new Set([...existing.content_types, ...types]));
      const newLevel = mergedTypes.length;
      const newBonus = RESONANCE_BONUSES[Math.min(newLevel, 4)] || 2.0;

      if (newLevel > existing.resonance_level) {
        await query(
          `UPDATE resonance_spots
           SET content_types = $1, resonance_level = $2, bonus_multiplier = $3
           WHERE id = $4`,
          [mergedTypes, newLevel, newBonus, existing.id]
        );
      }
    } else {
      // Create new resonance spot
      await query(
        `INSERT INTO resonance_spots (location, grid_cell, content_types, resonance_level, bonus_multiplier, discovered_by)
         VALUES (ST_GeomFromEWKT($1), $2, $3, $4, $5, $6)`,
        [locationWkt, gridCell, types, level, bonus, userId]
      );
    }
  }
}

// ---- Singleton instance and exports ----

const resonanceServiceInstance = new ResonanceService();

export const resonanceService = resonanceServiceInstance;

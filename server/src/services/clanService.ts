// ============================================================
// Clan Service
// Organic clan formation: transit clans, district clans,
// dog park clans, district-vs-district scoring
// ============================================================

import { query, queryOne, queryMany, transaction } from '../config/database';
import { CLAN } from '../config/constants';
import { Clan, ClanType, UserProfile } from '../utils/types';
import { notifyClanFormed } from './notificationService';

/**
 * Clan service responsible for automatic, organic clan formation
 * based on player activity patterns, and district-vs-district scoring.
 */
export class ClanService {
  /**
   * Run the daily clan formation algorithm.
   * Creates three types of clans:
   * - District clans: top 10 active players per geographic area
   * - Commute/transit clans: players on the same route at similar times
   * - Dog park clans: dog walkers visiting the same area
   *
   * @returns Count of created and updated clans by type
   */
  async formClans(): Promise<{ created: number; updated: number }> {
    console.log('[Clan] Starting clan formation...');

    const districtCount = await this.formDistrictClans();
    const transitCount = await this.formCommuteClans();
    const dogParkCount = await this.formDogParkClans();

    const created = districtCount + transitCount + dogParkCount;

    console.log('[Clan] Formation complete:', {
      district: districtCount,
      transit: transitCount,
      dog_park: dogParkCount,
    });

    return { created, updated: 0 };
  }

  /**
   * Form district clans from the top 10 most active players
   * per geographic district (approximated by a ~1km grid cell).
   *
   * A minimum of 3 members is required to form a clan.
   *
   * @returns Number of clans created
   */
  private async formDistrictClans(): Promise<number> {
    let formed = 0;

    try {
      // Group territories by approximate district using a ~1km grid
      const districts = await queryMany<{
        district_key: string;
        user_id: string;
        activity_score: number;
      }>(
        `WITH district_activity AS (
          SELECT
            CONCAT(
              FLOOR(ST_Y(ST_Centroid(polygon)) * 100)::TEXT, ':',
              FLOOR(ST_X(ST_Centroid(polygon)) * 100)::TEXT
            ) as district_key,
            owner_id as user_id,
            COUNT(*) as claim_count
          FROM territories
          WHERE owner_id IS NOT NULL
          AND claimed_at > NOW() - INTERVAL '30 days'
          GROUP BY district_key, owner_id
        )
        SELECT district_key, user_id,
               claim_count as activity_score
        FROM district_activity
        ORDER BY district_key, activity_score DESC`
      );

      // Group by district, taking top N players per district
      const districtMap = new Map<string, string[]>();
      for (const row of districts) {
        const members = districtMap.get(row.district_key) || [];
        if (members.length < CLAN.DISTRICT.TOP_PLAYERS) {
          members.push(row.user_id);
        }
        districtMap.set(row.district_key, members);
      }

      for (const [districtKey, members] of districtMap) {
        if (members.length < 3) continue;

        // Check if a similar clan already exists
        const existingClan = await this.findExistingClan('district', members);
        if (existingClan) continue;

        const clanName = `District ${districtKey.replace(':', '-')}`;
        const clanId = await this.createClan('district', clanName, members, {
          district_key: districtKey,
        });

        if (clanId) {
          formed++;
          for (const userId of members) {
            try {
              await notifyClanFormed(userId, clanId, clanName);
            } catch {
              // Non-critical
            }
          }
        }
      }
    } catch (err) {
      console.error('[Clan] District formation error:', err);
    }

    return formed;
  }

  /**
   * Form commute/transit clans from players who share similar
   * route patterns at similar times (within 15 minutes), at least
   * 3 times in the past 7 days.
   *
   * @returns Number of clans created
   */
  private async formCommuteClans(): Promise<number> {
    let formed = 0;

    try {
      // Find pairs of users with overlapping routes at similar times
      const candidates = await queryMany<{
        user_a: string;
        user_b: string;
        overlap_count: number;
      }>(
        `WITH route_overlaps AS (
          SELECT
            r1.user_id as user_a,
            r2.user_id as user_b,
            r1.created_at as time_a,
            r2.created_at as time_b
          FROM routes r1
          JOIN routes r2 ON r1.user_id < r2.user_id
            AND r1.polygon IS NOT NULL
            AND r2.polygon IS NOT NULL
            AND ST_Intersects(r1.polygon, r2.polygon)
            AND ABS(EXTRACT(EPOCH FROM (r1.created_at - r2.created_at))) < $1
            AND r1.created_at > NOW() - INTERVAL '${CLAN.TRANSIT.LOOKBACK_DAYS} days'
            AND r2.created_at > NOW() - INTERVAL '${CLAN.TRANSIT.LOOKBACK_DAYS} days'
        )
        SELECT user_a, user_b, COUNT(*) as overlap_count
        FROM route_overlaps
        GROUP BY user_a, user_b
        HAVING COUNT(*) >= $2`,
        [CLAN.TRANSIT.TIME_WINDOW_MINUTES * 60, CLAN.TRANSIT.MIN_OVERLAPS]
      );

      // Group into connected clusters
      const clanGroups = this.groupIntoClusters(
        candidates.map(c => ({ a: c.user_a, b: c.user_b }))
      );

      for (const group of clanGroups) {
        if (group.length < 2) continue;

        const existingClan = await this.findExistingClan('commute', group);
        if (existingClan) continue;

        const clanName = `Transit Crew #${Date.now().toString(36).slice(-4).toUpperCase()}`;
        const clanId = await this.createClan('commute', clanName, group);

        if (clanId) {
          formed++;
          for (const userId of group) {
            try {
              await notifyClanFormed(userId, clanId, clanName);
            } catch {
              // Non-critical
            }
          }
        }
      }
    } catch (err) {
      console.error('[Clan] Transit formation error:', err);
    }

    return formed;
  }

  /**
   * Form dog park clans from dog walkers who visit the same area
   * at least 3 times in the last 30 days.
   *
   * @returns Number of clans created
   */
  private async formDogParkClans(): Promise<number> {
    let formed = 0;

    try {
      // Find dog walkers who frequent the same areas
      // Uses a finer grid (~100m) than district clans
      const candidates = await queryMany<{
        park_key: string;
        user_id: string;
        visit_count: number;
      }>(
        `WITH park_visits AS (
          SELECT
            CONCAT(
              FLOOR(ST_Y(ST_Centroid(polygon)) * 1000)::TEXT, ':',
              FLOOR(ST_X(ST_Centroid(polygon)) * 1000)::TEXT
            ) as park_key,
            user_id,
            COUNT(*) as visit_count
          FROM routes
          WHERE class = 'dog_walker'
          AND polygon IS NOT NULL
          AND created_at > NOW() - INTERVAL '30 days'
          GROUP BY park_key, user_id
          HAVING COUNT(*) >= $1
        )
        SELECT park_key, user_id, visit_count
        FROM park_visits
        ORDER BY park_key, visit_count DESC`,
        [CLAN.DOG_PARK.MIN_VISITS]
      );

      // Group by park area
      const parkMap = new Map<string, string[]>();
      for (const row of candidates) {
        const members = parkMap.get(row.park_key) || [];
        members.push(row.user_id);
        parkMap.set(row.park_key, members);
      }

      for (const [parkKey, members] of parkMap) {
        if (members.length < 2) continue;

        const existingClan = await this.findExistingClan('dog_park', members);
        if (existingClan) continue;

        const clanName = `Dog Pack ${parkKey.replace(':', '-')}`;
        const clanId = await this.createClan('dog_park', clanName, members, {
          park_key: parkKey,
        });

        if (clanId) {
          formed++;
          for (const userId of members) {
            try {
              await notifyClanFormed(userId, clanId, clanName);
            } catch {
              // Non-critical
            }
          }
        }
      }
    } catch (err) {
      console.error('[Clan] Dog park formation error:', err);
    }

    return formed;
  }

  /**
   * Get all clans a user belongs to.
   *
   * @param userId - Player ID
   * @returns Array of clans with member counts
   */
  async getUserClans(userId: string): Promise<Clan[]> {
    return queryMany<Clan>(
      `SELECT c.*, cm.joined_at,
              (SELECT COUNT(*) FROM clan_members WHERE clan_id = c.id) as member_count
       FROM clans c
       JOIN clan_members cm ON c.id = cm.clan_id
       WHERE cm.user_id = $1
       ORDER BY cm.joined_at DESC`,
      [userId]
    );
  }

  /**
   * Get clan details including member profiles.
   *
   * @param clanId - Clan ID
   * @returns Clan with members array
   */
  async getClanDetails(clanId: string): Promise<Clan & { members: UserProfile[] }> {
    const clan = await queryOne<Clan>(
      'SELECT * FROM clans WHERE id = $1',
      [clanId]
    );

    if (!clan) {
      throw new Error('Clan not found');
    }

    const members = await queryMany<UserProfile>(
      `SELECT u.id, u.username, u.level, u.xp, u.streak_days, u.reputation,
              u.created_at, cm.joined_at
       FROM clan_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.clan_id = $1
       ORDER BY cm.joined_at`,
      [clanId]
    );

    return { ...clan, members };
  }

  /**
   * Calculate district-vs-district scores for all district clans.
   *
   * Score formula:
   * claims * 0.3 + quest_completions * 0.3 + echo_likes * 0.2 + active_players * 0.2
   *
   * @returns Array of district names with scores, sorted descending
   */
  async calculateDistrictScores(): Promise<{ district: string; score: number }[]> {
    try {
      // Get all district clans
      const clans = await queryMany<{ id: string; name: string; metadata: any }>(
        "SELECT id, name, metadata FROM clans WHERE type = 'district'"
      );

      const results: { district: string; score: number }[] = [];

      for (const clan of clans) {
        const members = await queryMany<{ user_id: string }>(
          'SELECT user_id FROM clan_members WHERE clan_id = $1',
          [clan.id]
        );

        if (members.length === 0) continue;

        const userIds = members.map(m => m.user_id);

        const [claims, questCompletions, echoLikes] = await Promise.all([
          queryOne<{ count: string }>(
            'SELECT COUNT(*) as count FROM territories WHERE owner_id = ANY($1)',
            [userIds]
          ),
          queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM quest_progress
             WHERE user_id = ANY($1) AND status = 'completed'`,
            [userIds]
          ),
          queryOne<{ total: string }>(
            'SELECT COALESCE(SUM(likes), 0) as total FROM echos WHERE creator_id = ANY($1)',
            [userIds]
          ),
        ]);

        const claimScore =
          parseInt(claims?.count || '0', 10) * CLAN.DISTRICT_SCORING.CLAIMS;
        const questScore =
          parseInt(questCompletions?.count || '0', 10) *
          CLAN.DISTRICT_SCORING.QUEST_COMPLETIONS;
        const echoScore =
          parseInt(echoLikes?.total || '0', 10) * CLAN.DISTRICT_SCORING.ECHO_LIKES;
        const playerScore =
          userIds.length * CLAN.DISTRICT_SCORING.ACTIVE_PLAYERS;

        results.push({
          district: clan.name,
          score: claimScore + questScore + echoScore + playerScore,
        });
      }

      // Sort by score descending
      results.sort((a, b) => b.score - a.score);

      return results;
    } catch (err) {
      console.error('[Clan] District scoring error:', err);
      return [];
    }
  }

  // ---- Private Helpers ----

  /**
   * Create a clan with members inside a transaction.
   */
  private async createClan(
    type: ClanType,
    name: string,
    memberIds: string[],
    metadata: Record<string, any> = {}
  ): Promise<string | null> {
    return transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO clans (type, name, auto_generated, metadata)
         VALUES ($1, $2, TRUE, $3)
         RETURNING id`,
        [type, name, JSON.stringify(metadata)]
      );

      const clanId = result.rows[0].id;

      for (const userId of memberIds) {
        await client.query(
          `INSERT INTO clan_members (clan_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (clan_id, user_id) DO NOTHING`,
          [clanId, userId]
        );
      }

      return clanId;
    });
  }

  /**
   * Check if a clan already exists with at least 70% of the same members.
   */
  private async findExistingClan(
    type: ClanType,
    memberIds: string[]
  ): Promise<boolean> {
    if (memberIds.length === 0) return false;

    try {
      const result = await queryOne<{ id: string }>(
        `SELECT c.id
         FROM clans c
         JOIN clan_members cm ON c.id = cm.clan_id
         WHERE c.type = $1
         AND cm.user_id = ANY($2)
         GROUP BY c.id
         HAVING COUNT(DISTINCT cm.user_id) >= $3`,
        [type, memberIds, Math.ceil(memberIds.length * 0.7)]
      );

      return !!result;
    } catch {
      return false;
    }
  }

  /**
   * Group pairs of connected users into clusters using a BFS/DFS approach.
   * Each cluster becomes a potential clan.
   */
  private groupIntoClusters(
    pairs: { a: string; b: string }[]
  ): string[][] {
    const adjacency = new Map<string, Set<string>>();

    for (const { a, b } of pairs) {
      if (!adjacency.has(a)) adjacency.set(a, new Set());
      if (!adjacency.has(b)) adjacency.set(b, new Set());
      adjacency.get(a)!.add(b);
      adjacency.get(b)!.add(a);
    }

    const visited = new Set<string>();
    const clusters: string[][] = [];

    for (const node of adjacency.keys()) {
      if (visited.has(node)) continue;

      const cluster: string[] = [];
      const stack = [node];

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);
        cluster.push(current);

        const neighbors = adjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              stack.push(neighbor);
            }
          }
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }
}

// ---- Legacy functional exports for backward compatibility ----

const clanServiceInstance = new ClanService();

export async function runClanFormation() {
  const districtCount = await clanServiceInstance.formClans();
  return {
    transit: 0,
    district: districtCount.created,
    dog_park: 0,
  };
}

export async function getUserClans(userId: string) {
  return clanServiceInstance.getUserClans(userId);
}

export async function getClanDetails(clanId: string) {
  return clanServiceInstance.getClanDetails(clanId);
}

export async function getDistrictScore(clanId: string): Promise<number> {
  const members = await queryMany<{ user_id: string }>(
    'SELECT user_id FROM clan_members WHERE clan_id = $1',
    [clanId]
  );

  if (members.length === 0) return 0;
  const userIds = members.map(m => m.user_id);

  const [claims, questCompletions, echoLikes] = await Promise.all([
    queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM territories WHERE owner_id = ANY($1)',
      [userIds]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM quest_progress
       WHERE user_id = ANY($1) AND status = 'completed'`,
      [userIds]
    ),
    queryOne<{ total: string }>(
      'SELECT COALESCE(SUM(likes), 0) as total FROM echos WHERE creator_id = ANY($1)',
      [userIds]
    ),
  ]);

  return (
    parseInt(claims?.count || '0', 10) * CLAN.DISTRICT_SCORING.CLAIMS +
    parseInt(questCompletions?.count || '0', 10) * CLAN.DISTRICT_SCORING.QUEST_COMPLETIONS +
    parseInt(echoLikes?.total || '0', 10) * CLAN.DISTRICT_SCORING.ECHO_LIKES +
    userIds.length * CLAN.DISTRICT_SCORING.ACTIVE_PLAYERS
  );
}

export const clanService = clanServiceInstance;

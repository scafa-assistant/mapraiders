// ============================================================
// Leaderboard Service
// Redis sorted sets for real-time leaderboards with
// class filtering, period support, and DB refresh
// ============================================================

import { queryMany, queryOne } from '../config/database';
import {
  zAdd,
  zRevRangeWithScores,
  zRank,
  zScore,
  zIncrBy,
  getRedis,
} from '../config/redis';
import { LeaderboardType, LeaderboardEntry, MovementClass } from '../utils/types';
import {
  LEADERBOARD_TYPES,
  LEADERBOARD_PERIODS,
  LeaderboardPeriod,
} from '../config/constants';

/**
 * Redis-based leaderboard service providing real-time rankings
 * with class filtering, monthly/alltime periods, and pagination.
 */
export class LeaderboardService {
  /**
   * Update a player's score on a leaderboard.
   * Sets the score (overwrites previous value) in both alltime and monthly boards.
   *
   * @param type - Leaderboard type (territory, streak, etc.)
   * @param userId - Player ID
   * @param score - The new score value
   * @param cls - Optional movement class filter
   */
  async updateScore(
    type: LeaderboardType,
    userId: string,
    score: number,
    cls?: MovementClass
  ): Promise<void> {
    try {
      // All-time leaderboard
      const allTimeKey = this.getKey(type, cls, 'alltime');
      await zAdd(allTimeKey, score, userId);

      // Monthly leaderboard
      const monthlyKey = this.getKey(type, cls, 'monthly');
      await zAdd(monthlyKey, score, userId);
    } catch (err) {
      console.error(`[Leaderboard] Error updating ${type} for ${userId}:`, err);
    }
  }

  /**
   * Get a paginated leaderboard.
   *
   * @param type - Leaderboard type
   * @param options - Pagination and filter options
   * @returns Leaderboard entries with rank, username, and score
   */
  async getLeaderboard(
    type: LeaderboardType,
    options: {
      class?: MovementClass;
      page?: number;
      limit?: number;
      period?: 'monthly' | 'alltime';
    } = {}
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const period = options.period || 'alltime';
    const key = this.getKey(type, options.class, period);
    const start = (page - 1) * limit;
    const stop = start + limit - 1;

    try {
      const results = await zRevRangeWithScores(key, start, stop);

      if (results.length === 0) {
        return { entries: [], total: 0 };
      }

      // Get total count from Redis
      let total = 0;
      try {
        const redis = getRedis();
        total = await redis.zCard(key);
      } catch {
        total = results.length;
      }

      // Batch-fetch usernames for all entries
      const userIds = results.map(r => r.value);
      const users = await queryMany<{ id: string; username: string }>(
        'SELECT id, username FROM users WHERE id = ANY($1)',
        [userIds]
      );

      const usernameMap = new Map(users.map(u => [u.id, u.username]));

      const entries: LeaderboardEntry[] = results.map((result, idx) => ({
        rank: start + idx + 1,
        user_id: result.value,
        username: usernameMap.get(result.value) || 'Unknown',
        score: result.score,
      }));

      return { entries, total };
    } catch (err) {
      console.error(`[Leaderboard] Error fetching ${type}:`, err);
      return { entries: [], total: 0 };
    }
  }

  /**
   * Get a player's rank on a specific leaderboard.
   *
   * @param type - Leaderboard type
   * @param userId - Player ID
   * @param cls - Optional movement class filter
   * @returns 1-based rank (or -1 if not ranked)
   */
  async getPlayerRank(
    type: LeaderboardType,
    userId: string,
    cls?: MovementClass
  ): Promise<number> {
    try {
      const key = this.getKey(type, cls, 'alltime');
      const rank = await zRank(key, userId);
      return rank !== null ? rank + 1 : -1;
    } catch {
      return -1;
    }
  }

  /**
   * Refresh the territory leaderboard by recalculating from the database.
   * Sums territory areas per user using PostGIS geography for accurate m2.
   */
  async refreshTerritoryLeaderboard(): Promise<void> {
    try {
      // Aggregate total area per user, overall and per class
      const results = await queryMany<{
        owner_id: string;
        total_area: number;
        class: string;
      }>(
        `SELECT owner_id,
                SUM(ST_Area(polygon::geography)) as total_area,
                class
         FROM territories
         WHERE owner_id IS NOT NULL
         GROUP BY owner_id, class`
      );

      // Aggregate overall territory area per user
      const userTotals = new Map<string, number>();
      for (const row of results) {
        const current = userTotals.get(row.owner_id) || 0;
        userTotals.set(row.owner_id, current + (row.total_area || 0));
      }

      // Update overall territory leaderboard
      for (const [userId, totalArea] of userTotals) {
        await this.updateScore('territory', userId, totalArea);
      }

      // Update per-class territory leaderboards
      for (const row of results) {
        if (row.class) {
          await this.updateScore(
            'territory',
            row.owner_id,
            row.total_area,
            row.class as MovementClass
          );
        }
      }
    } catch (err) {
      console.error('[Leaderboard] Territory refresh error:', err);
    }
  }

  /**
   * Refresh all leaderboards from the database.
   * Called hourly by a cron job.
   */
  async refreshAll(): Promise<void> {
    console.log('[Leaderboard] Refreshing all leaderboards...');

    await Promise.all([
      this.refreshTerritoryLeaderboard(),
      this.refreshQuestmakerLeaderboard(),
      this.refreshEchoMasterLeaderboard(),
      this.refreshExplorerLeaderboard(),
      this.refreshStreakLeaderboard(),
      this.refreshPetLeaderboard(),
    ]);

    console.log('[Leaderboard] All leaderboards refreshed');
  }

  // ---- Private refresh helpers ----

  /**
   * Refresh questmaker leaderboard: rated quests * completions.
   */
  private async refreshQuestmakerLeaderboard(): Promise<void> {
    try {
      const results = await queryMany<{ creator_id: string; score: number }>(
        `SELECT creator_id, SUM(avg_rating * total_completions) as score
         FROM quests
         WHERE creator_id IS NOT NULL AND status = 'active' AND avg_rating > 0
         GROUP BY creator_id`
      );

      for (const row of results) {
        await this.updateScore('questmaker', row.creator_id, row.score);
      }
    } catch (err) {
      console.error('[Leaderboard] Questmaker refresh error:', err);
    }
  }

  /**
   * Refresh echo master leaderboard: total echo likes.
   */
  private async refreshEchoMasterLeaderboard(): Promise<void> {
    try {
      const results = await queryMany<{ creator_id: string; total_likes: number }>(
        `SELECT creator_id, SUM(likes) as total_likes
         FROM echos
         WHERE creator_id IS NOT NULL
         GROUP BY creator_id`
      );

      for (const row of results) {
        await this.updateScore('echo_master', row.creator_id, row.total_likes);
      }
    } catch (err) {
      console.error('[Leaderboard] Echo master refresh error:', err);
    }
  }

  /**
   * Refresh explorer leaderboard: total distance in km, per class.
   */
  private async refreshExplorerLeaderboard(): Promise<void> {
    try {
      const results = await queryMany<{
        user_id: string;
        total_km: number;
        class: string;
      }>(
        `SELECT user_id, SUM(distance_m) / 1000.0 as total_km, class
         FROM routes
         WHERE user_id IS NOT NULL
         GROUP BY user_id, class`
      );

      // Aggregate totals per user
      const userTotals = new Map<string, number>();
      for (const row of results) {
        const current = userTotals.get(row.user_id) || 0;
        userTotals.set(row.user_id, current + (row.total_km || 0));
      }

      for (const [userId, totalKm] of userTotals) {
        await this.updateScore('explorer', userId, totalKm);
      }

      // Per-class
      for (const row of results) {
        if (row.class) {
          await this.updateScore(
            'explorer',
            row.user_id,
            row.total_km,
            row.class as MovementClass
          );
        }
      }
    } catch (err) {
      console.error('[Leaderboard] Explorer refresh error:', err);
    }
  }

  /**
   * Refresh streak leaderboard: current streak days.
   */
  private async refreshStreakLeaderboard(): Promise<void> {
    try {
      const results = await queryMany<{ id: string; streak_days: number }>(
        'SELECT id, streak_days FROM users WHERE streak_days > 0 ORDER BY streak_days DESC'
      );

      for (const row of results) {
        await this.updateScore('streak', row.id, row.streak_days);
      }
    } catch (err) {
      console.error('[Leaderboard] Streak refresh error:', err);
    }
  }

  /**
   * Refresh pet leaderboard: total pet distance in km.
   */
  private async refreshPetLeaderboard(): Promise<void> {
    try {
      const results = await queryMany<{ owner_id: string; total_km: number }>(
        `SELECT owner_id, SUM(total_distance_km) as total_km
         FROM pets
         GROUP BY owner_id`
      );

      for (const row of results) {
        await this.updateScore('pet', row.owner_id, row.total_km);
      }
    } catch (err) {
      console.error('[Leaderboard] Pet refresh error:', err);
    }
  }

  // ---- Key Generation ----

  /**
   * Generate a Redis key for a leaderboard.
   *
   * Format: lb:{type}[:{class}][:{YYYY-MM}]
   *
   * @param type - Leaderboard type
   * @param cls - Optional movement class
   * @param period - Time period (alltime or monthly)
   * @returns Redis sorted set key
   */
  private getKey(
    type: LeaderboardType,
    cls?: MovementClass,
    period?: string
  ): string {
    const classSuffix = cls ? `:${cls}` : '';
    const periodSuffix =
      period === 'monthly'
        ? `:${new Date().toISOString().slice(0, 7)}`
        : '';
    return `lb:${type}${classSuffix}${periodSuffix}`;
  }
}

// ---- Legacy functional exports for backward compatibility ----

const leaderboardInstance = new LeaderboardService();

export async function getLeaderboard(
  type: LeaderboardType,
  period: LeaderboardPeriod = 'alltime',
  classFilter?: MovementClass,
  page: number = 1,
  limit: number = 20
): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  return leaderboardInstance.getLeaderboard(type, {
    class: classFilter,
    page,
    limit,
    period,
  });
}

export async function updateLeaderboardScore(
  type: LeaderboardType,
  userId: string,
  score: number,
  classFilter?: MovementClass
): Promise<void> {
  return leaderboardInstance.updateScore(type, userId, score, classFilter);
}

export async function incrementLeaderboardScore(
  type: LeaderboardType,
  userId: string,
  increment: number,
  classFilter?: MovementClass
): Promise<void> {
  try {
    const allTimeKey = `lb:${type}${classFilter ? ':' + classFilter : ''}`;
    await zIncrBy(allTimeKey, increment, userId);

    const monthlyKey = `lb:${type}${classFilter ? ':' + classFilter : ''}:${new Date().toISOString().slice(0, 7)}`;
    await zIncrBy(monthlyKey, increment, userId);
  } catch (err) {
    console.error(`[Leaderboard] Error incrementing ${type} for ${userId}:`, err);
  }
}

export async function getUserRank(
  type: LeaderboardType,
  userId: string,
  period: LeaderboardPeriod = 'alltime',
  classFilter?: MovementClass
): Promise<{ rank: number | null; score: number | null }> {
  try {
    const classSuffix = classFilter ? `:${classFilter}` : '';
    const periodSuffix = period === 'monthly' ? `:${new Date().toISOString().slice(0, 7)}` : '';
    const key = `lb:${type}${classSuffix}${periodSuffix}`;
    const [rank, score] = await Promise.all([
      zRank(key, userId),
      zScore(key, userId),
    ]);

    return {
      rank: rank !== null ? rank + 1 : null,
      score,
    };
  } catch {
    return { rank: null, score: null };
  }
}

export async function refreshAllLeaderboards(): Promise<void> {
  return leaderboardInstance.refreshAll();
}

export const leaderboardService = leaderboardInstance;

// ============================================================
// Leaderboard Cron
// Dedicated leaderboard refresh logic.
// Queries the database and updates Redis sorted sets.
// ============================================================

import { query, queryMany } from '../config/database';
import redis, { zAdd } from '../config/redis';

// Redis key prefix for leaderboards
const LB_PREFIX = 'lb';

/**
 * Refresh all leaderboards from the database.
 * Called hourly by the main cron scheduler.
 */
export async function refreshAllLeaderboards(): Promise<void> {
  const start = Date.now();

  await refreshTerritoryLeaderboard();
  await refreshExplorerLeaderboard();
  await refreshQuestmakerLeaderboard();
  await refreshEchoMasterLeaderboard();
  await refreshStreakLeaderboard();
  await refreshPetLeaderboard();

  const elapsed = Date.now() - start;
  console.log(`[Leaderboard] All leaderboards refreshed in ${elapsed}ms`);
}

// ---- Territory Leaderboard --------------------------------------------
// Score = SUM of claim_value per user, grouped by class

async function refreshTerritoryLeaderboard(): Promise<void> {
  try {
    const key = `${LB_PREFIX}:territory`;
    await redis.del(key);

    const rows = await queryMany<{
      owner_id: string;
      total_value: string;
    }>(
      `SELECT owner_id, SUM(claim_value) AS total_value
       FROM territories
       WHERE owner_id IS NOT NULL
       GROUP BY owner_id
       ORDER BY total_value DESC
       LIMIT 1000`,
    );

    const pipeline = redis.pipeline();
    for (const row of rows) {
      pipeline.zadd(key, parseFloat(row.total_value), row.owner_id);
    }
    await pipeline.exec();

    // Also build per-class leaderboards
    const classRows = await queryMany<{
      owner_id: string;
      class: string;
      total_value: string;
    }>(
      `SELECT owner_id, class, SUM(claim_value) AS total_value
       FROM territories
       WHERE owner_id IS NOT NULL
       GROUP BY owner_id, class
       ORDER BY total_value DESC`,
    );

    const classBuckets: Record<string, { userId: string; score: number }[]> = {};
    for (const row of classRows) {
      if (!classBuckets[row.class]) classBuckets[row.class] = [];
      classBuckets[row.class].push({
        userId: row.owner_id,
        score: parseFloat(row.total_value),
      });
    }

    for (const [cls, entries] of Object.entries(classBuckets)) {
      const classKey = `${LB_PREFIX}:territory:${cls}`;
      await redis.del(classKey);
      const p = redis.pipeline();
      for (const entry of entries.slice(0, 1000)) {
        p.zadd(classKey, entry.score, entry.userId);
      }
      await p.exec();
    }

    console.log(`[Leaderboard] Territory: ${rows.length} entries`);
  } catch (err) {
    console.error('[Leaderboard] Territory refresh failed:', err);
  }
}

// ---- Explorer Leaderboard ---------------------------------------------
// Score = COUNT of distinct territories per user

async function refreshExplorerLeaderboard(): Promise<void> {
  try {
    const key = `${LB_PREFIX}:explorer`;
    await redis.del(key);

    const rows = await queryMany<{
      owner_id: string;
      territory_count: string;
    }>(
      `SELECT owner_id, COUNT(DISTINCT id) AS territory_count
       FROM territories
       WHERE owner_id IS NOT NULL
       GROUP BY owner_id
       ORDER BY territory_count DESC
       LIMIT 1000`,
    );

    const pipeline = redis.pipeline();
    for (const row of rows) {
      pipeline.zadd(key, parseInt(row.territory_count, 10), row.owner_id);
    }
    await pipeline.exec();

    console.log(`[Leaderboard] Explorer: ${rows.length} entries`);
  } catch (err) {
    console.error('[Leaderboard] Explorer refresh failed:', err);
  }
}

// ---- Questmaker Leaderboard -------------------------------------------
// Score = AVG(rating) * COUNT of quests where avg_rating >= 4.0

async function refreshQuestmakerLeaderboard(): Promise<void> {
  try {
    const key = `${LB_PREFIX}:questmaker`;
    await redis.del(key);

    const rows = await queryMany<{
      creator_id: string;
      score: string;
    }>(
      `SELECT
         creator_id,
         AVG(avg_rating) * COUNT(*) AS score
       FROM quests
       WHERE avg_rating >= 4.0
         AND status IN ('active', 'legendary')
       GROUP BY creator_id
       HAVING COUNT(*) > 0
       ORDER BY score DESC
       LIMIT 1000`,
    );

    const pipeline = redis.pipeline();
    for (const row of rows) {
      pipeline.zadd(key, parseFloat(row.score), row.creator_id);
    }
    await pipeline.exec();

    console.log(`[Leaderboard] Questmaker: ${rows.length} entries`);
  } catch (err) {
    console.error('[Leaderboard] Questmaker refresh failed:', err);
  }
}

// ---- Echo Master Leaderboard ------------------------------------------
// Score = COUNT of echos with status = 'legendary' OR likes > 100

async function refreshEchoMasterLeaderboard(): Promise<void> {
  try {
    const key = `${LB_PREFIX}:echo_master`;
    await redis.del(key);

    const rows = await queryMany<{
      creator_id: string;
      echo_count: string;
    }>(
      `SELECT creator_id, COUNT(*) AS echo_count
       FROM echos
       WHERE status = 'legendary' OR likes > 100
       GROUP BY creator_id
       ORDER BY echo_count DESC
       LIMIT 1000`,
    );

    const pipeline = redis.pipeline();
    for (const row of rows) {
      pipeline.zadd(key, parseInt(row.echo_count, 10), row.creator_id);
    }
    await pipeline.exec();

    console.log(`[Leaderboard] Echo Master: ${rows.length} entries`);
  } catch (err) {
    console.error('[Leaderboard] Echo Master refresh failed:', err);
  }
}

// ---- Streak Leaderboard -----------------------------------------------
// Score = current streak_days

async function refreshStreakLeaderboard(): Promise<void> {
  try {
    const key = `${LB_PREFIX}:streak`;
    await redis.del(key);

    const rows = await queryMany<{
      id: string;
      streak_days: number;
    }>(
      `SELECT id, streak_days
       FROM users
       WHERE streak_days > 0 AND banned = false
       ORDER BY streak_days DESC
       LIMIT 1000`,
    );

    const pipeline = redis.pipeline();
    for (const row of rows) {
      pipeline.zadd(key, row.streak_days, row.id);
    }
    await pipeline.exec();

    console.log(`[Leaderboard] Streak: ${rows.length} entries`);
  } catch (err) {
    console.error('[Leaderboard] Streak refresh failed:', err);
  }
}

// ---- Pet Leaderboard --------------------------------------------------
// Score = max pet level per user

async function refreshPetLeaderboard(): Promise<void> {
  try {
    const key = `${LB_PREFIX}:pet`;
    await redis.del(key);

    const rows = await queryMany<{
      owner_id: string;
      max_level: string;
    }>(
      `SELECT owner_id, MAX(level) AS max_level
       FROM pets
       GROUP BY owner_id
       ORDER BY max_level DESC
       LIMIT 1000`,
    );

    const pipeline = redis.pipeline();
    for (const row of rows) {
      pipeline.zadd(key, parseInt(row.max_level, 10), row.owner_id);
    }
    await pipeline.exec();

    console.log(`[Leaderboard] Pet: ${rows.length} entries`);
  } catch (err) {
    console.error('[Leaderboard] Pet refresh failed:', err);
  }
}

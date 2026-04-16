// ============================================================
// Cron Monitor — tracks execution health and prevents duplicates
// ============================================================

import { cacheGet, cacheSet } from '../config/redis';

export interface CronRunResult {
  job: string;
  status: 'success' | 'failure';
  startedAt: string;
  durationMs: number;
  recordsProcessed: number;
  error?: string;
}

const CRON_HISTORY_KEY = 'cron:history';
const CRON_LOCK_PREFIX = 'cron:lock:';

/**
 * Record a cron job execution result in Redis.
 * Stores last 50 runs per job for health monitoring.
 */
export async function recordCronRun(result: CronRunResult): Promise<void> {
  try {
    const key = `${CRON_HISTORY_KEY}:${result.job}`;
    const existing = await cacheGet<CronRunResult[]>(key) || [];
    existing.unshift(result);
    // Keep last 50 runs
    const trimmed = existing.slice(0, 50);
    await cacheSet(key, trimmed, 86400 * 7); // 7 days TTL

    // Log failures prominently
    if (result.status === 'failure') {
      console.error(`[CronMonitor] ALERT: ${result.job} FAILED after ${result.durationMs}ms: ${result.error}`);
    }
  } catch (err) {
    console.error('[CronMonitor] Failed to record cron run:', err);
  }
}

/**
 * Acquire a distributed lock for a cron job.
 * Prevents duplicate execution if cron fires twice.
 * Returns true if lock acquired, false if already running.
 */
export async function acquireCronLock(jobName: string, ttlSeconds: number = 3600): Promise<boolean> {
  try {
    const lockKey = `${CRON_LOCK_PREFIX}${jobName}`;
    const existing = await cacheGet<string>(lockKey);
    if (existing) {
      console.warn(`[CronMonitor] ${jobName} is already locked (running or stale). Skipping.`);
      return false;
    }
    await cacheSet(lockKey, new Date().toISOString(), ttlSeconds);
    return true;
  } catch (err) {
    console.error('[CronMonitor] Failed to acquire lock:', err);
    return true; // Allow execution on Redis failure
  }
}

/**
 * Release a cron lock after execution.
 */
export async function releaseCronLock(jobName: string): Promise<void> {
  try {
    const lockKey = `${CRON_LOCK_PREFIX}${jobName}`;
    await cacheSet(lockKey, '', 1); // Expire immediately
  } catch (err) {
    console.error('[CronMonitor] Failed to release lock:', err);
  }
}

/**
 * Get health status for all cron jobs.
 */
export async function getCronHealth(): Promise<Record<string, { lastRun: CronRunResult | null; recentFailures: number }>> {
  const jobs = ['territory_decay', 'echo_decay', 'quest_decay', 'challenge_decay', 'legendary_promotion', 'clan_formation', 'leaderboard_refresh', 'streak_warning'];
  const health: Record<string, { lastRun: CronRunResult | null; recentFailures: number }> = {};

  for (const job of jobs) {
    try {
      const key = `${CRON_HISTORY_KEY}:${job}`;
      const runs = await cacheGet<CronRunResult[]>(key) || [];
      const last24h = runs.filter(r => Date.now() - new Date(r.startedAt).getTime() < 86400000);
      health[job] = {
        lastRun: runs[0] || null,
        recentFailures: last24h.filter(r => r.status === 'failure').length,
      };
    } catch {
      health[job] = { lastRun: null, recentFailures: -1 };
    }
  }

  return health;
}

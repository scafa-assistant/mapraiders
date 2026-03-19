// ============================================================
// Redis Client (ioredis)
// ============================================================

import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // allow unlimited retries for blocking commands
  retryStrategy(times: number): number | null {
    if (times > 20) {
      console.error('[Redis] Too many reconnect attempts, giving up');
      return null; // stop retrying
    }
    const delay = Math.min(times * 200, 5000);
    console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('ready', () => {
  console.log('[Redis] Ready');
});

redis.on('error', (err: Error) => {
  console.error('[Redis] Client error:', err.message);
});

redis.on('close', () => {
  console.log('[Redis] Connection closed');
});

redis.on('reconnecting', () => {
  console.log('[Redis] Reconnecting...');
});

// ---- Cache helpers ---------------------------------------------------

/**
 * Get a cached JSON value, or null if the key does not exist.
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

/**
 * Set a cached JSON value with an optional TTL in seconds.
 */
export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds?: number,
): Promise<void> {
  const serialised = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds && ttlSeconds > 0) {
    await redis.set(key, serialised, 'EX', ttlSeconds);
  } else {
    await redis.set(key, serialised);
  }
}

/**
 * Delete one or more cache keys.
 */
export async function cacheDelete(...keys: string[]): Promise<void> {
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// ---- Sorted-set helpers (leaderboards) --------------------------------

export async function zAdd(
  key: string,
  score: number,
  member: string,
): Promise<void> {
  await redis.zadd(key, score, member);
}

export async function zIncrBy(
  key: string,
  increment: number,
  member: string,
): Promise<number> {
  const result = await redis.zincrby(key, increment, member);
  return parseFloat(result);
}

export async function zRevRange(
  key: string,
  start: number,
  stop: number,
): Promise<string[]> {
  return redis.zrevrange(key, start, stop);
}

export async function zRevRangeWithScores(
  key: string,
  start: number,
  stop: number,
): Promise<{ member: string; score: number }[]> {
  const raw = await redis.zrevrange(key, start, stop, 'WITHSCORES');
  const entries: { member: string; score: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({ member: raw[i], score: parseFloat(raw[i + 1]) });
  }
  return entries;
}

export async function zRevRank(
  key: string,
  member: string,
): Promise<number | null> {
  return redis.zrevrank(key, member);
}

// Alias: some callers import as zRank (always reverse-rank for leaderboards)
export const zRank = zRevRank;

export async function zScore(
  key: string,
  member: string,
): Promise<number | null> {
  const raw = await redis.zscore(key, member);
  return raw === null ? null : parseFloat(raw);
}

// ---- Counter helpers (rate limiting) ---------------------------------

/**
 * Increment a counter key and set its TTL. Returns the new count.
 */
export async function incrementCounter(
  key: string,
  ttlSeconds: number,
): Promise<number> {
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, ttlSeconds);
  const results = await pipeline.exec();
  if (!results || !results[0]) return 1;
  return results[0][1] as number;
}

export default redis;

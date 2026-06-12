// ============================================================
// Feature Flag Service (E4 — Phase 0)
// Reads feature_flags table, caches in Redis (60 s).
// isEnabledFor: deterministic bucket rollout via djb2 hash.
// NEVER throws — feature flags must never crash the server.
// ============================================================

import { queryMany } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

// ---- Types -------------------------------------------------------------------

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout_percent: number;
  config: Record<string, unknown>;
  updated_at: Date;
}

export interface Capabilities {
  pve: boolean;
  resources: boolean;
  terminals: boolean;
  commander: boolean;
  tcg: boolean;
}

export interface ClientFeatureFlag {
  key: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

// ---- Constants ---------------------------------------------------------------

const CACHE_KEY = 'features:all';
const CACHE_TTL_SECONDS = 60;

// ---- djb2 hash ---------------------------------------------------------------

/**
 * Simple djb2 hash — deterministic, fast, no dependencies.
 * Used for rollout bucketing: hash(userId + ':' + key) % 100 < rollout_percent
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep as unsigned 32-bit int
  }
  return hash;
}

// ---- Core service ------------------------------------------------------------

/**
 * Load all feature flags from DB (or Redis cache).
 * Returns empty array if the table does not exist yet or any query fails.
 */
export async function getAllFlags(): Promise<FeatureFlag[]> {
  try {
    const cached = await cacheGet<FeatureFlag[]>(CACHE_KEY);
    if (cached !== null) {
      return cached;
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  try {
    const rows = await queryMany<{
      key: string;
      enabled: boolean;
      rollout_percent: number;
      config: Record<string, unknown>;
      updated_at: Date;
    }>('SELECT key, enabled, rollout_percent, config, updated_at FROM feature_flags');

    const flags: FeatureFlag[] = rows.map((r) => ({
      key: r.key,
      enabled: r.enabled,
      rollout_percent: r.rollout_percent,
      config: r.config ?? {},
      updated_at: r.updated_at,
    }));

    try {
      await cacheSet(CACHE_KEY, flags, CACHE_TTL_SECONDS);
    } catch {
      // Cache write failed — non-fatal
    }

    return flags;
  } catch (err: any) {
    // Table may not exist yet during Phase 0 bootstrap
    console.warn('[FeatureService] getAllFlags failed (table missing?):', err?.message);
    return [];
  }
}

/**
 * Returns true if the given feature flag is enabled for a specific user.
 *
 * Rules:
 * 1. Flag does not exist or enabled = false  → false
 * 2. rollout_percent = 100                   → true
 * 3. rollout_percent = 0                     → false
 * 4. Otherwise: deterministic bucket via djb2(userId + ':' + key) % 100
 */
export async function isEnabledFor(userId: string, key: string): Promise<boolean> {
  try {
    const flags = await getAllFlags();
    const flag = flags.find((f) => f.key === key);

    if (!flag || !flag.enabled) {
      return false;
    }

    const pct = flag.rollout_percent;

    if (pct >= 100) return true;
    if (pct <= 0) return false;

    const bucket = djb2Hash(`${userId}:${key}`) % 100;
    return bucket < pct;
  } catch (err: any) {
    console.warn(`[FeatureService] isEnabledFor(${userId}, ${key}) failed:`, err?.message);
    return false;
  }
}

/**
 * Returns the capabilities object for a given user.
 * Maps well-known flag keys to typed boolean fields.
 */
export async function getCapabilities(userId: string): Promise<Capabilities> {
  try {
    const [pve, resources, terminals, commander, tcg] = await Promise.all([
      isEnabledFor(userId, 'pve_spawns'),
      isEnabledFor(userId, 'resources'),
      isEnabledFor(userId, 'terminals'),
      isEnabledFor(userId, 'commander'),
      isEnabledFor(userId, 'tcg'),
    ]);

    return { pve, resources, terminals, commander, tcg };
  } catch (err: any) {
    console.warn('[FeatureService] getCapabilities failed:', err?.message);
    return { pve: false, resources: false, terminals: false, commander: false, tcg: false };
  }
}

/**
 * Returns the public client config: only enabled flags, without rollout_percent.
 * Safe to expose in the unauthenticated GET /api/features endpoint.
 */
export async function getClientConfig(): Promise<ClientFeatureFlag[]> {
  try {
    const flags = await getAllFlags();
    return flags
      .filter((f) => f.enabled)
      .map((f) => ({ key: f.key, enabled: f.enabled, config: f.config }));
  } catch (err: any) {
    console.warn('[FeatureService] getClientConfig failed:', err?.message);
    return [];
  }
}

export const featureService = {
  getAllFlags,
  isEnabledFor,
  getCapabilities,
  getClientConfig,
};

export default featureService;

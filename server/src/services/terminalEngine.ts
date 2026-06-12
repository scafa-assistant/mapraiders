// ============================================================
// Terminal Engine (Phase A.2 — Jump&Run)
// A 'terminal' pve_spawn hosts a deterministic HTML5 runner game.
// The SERVER is the single source of truth:
//   - The level is generated deterministically from the spawn id
//     (sha256 -> mulberry32 PRNG), so every player sees the IDENTICAL
//     level and the per-spawn leaderboard is fair.
//   - A run is bracketed by an HMAC-signed, single-use run token
//     (startRun -> submitRun) to block replay + offline farming.
//   - Submitted scores are plausibility-checked against the regenerated
//     level before they are accepted.
// Finished runs post to a per-spawn Redis sorted-set leaderboard and
// (capped per day) grant intel through resourceService.
// ============================================================

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { transaction, queryMany } from '../config/database';
import redis from '../config/redis';
import { TERMINALS } from '../config/constants';
import { featureService } from './featureService';
import { resourceService } from './resourceService';

// ---- Domain error -------------------------------------------

/** Domain error carrying a stable machine-readable `code`. */
export class TerminalError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'TerminalError';
    this.code = code;
  }
}

// ---- Level contract -----------------------------------------

/**
 * The level JSON shape. This is the CONTRACT with the HTML5 runner game
 * built by another agent — do not change field names/types without
 * coordinating the client.
 */
export interface RunnerLevel {
  version: 1;
  seed: string;                 // hex
  worldLength: number;          // tiles, 180 + level*30
  tileSize: 32;
  playerSpeed: number;          // tiles/sec, 6
  gravity: number;              // tiles/sec^2, 30
  jumpVelocity: number;         // tiles/sec, 13
  platforms: Array<{ x: number; w: number; h: number }>; // ground segments, h = 0..4 tiles above baseline; gaps between segments are deadly pits
  obstacles: Array<{ x: number }>;                       // spikes sitting ON the platform at x
  orbs: Array<{ x: number; y: number }>;                 // y = 1..4 tiles above platform surface
  exitX: number;                                         // worldLength - 4
  par: { orbCount: number; maxScore: number; minDurationMs: number };
}

// ---- Run token shapes ---------------------------------------

interface RunTokenPayload {
  spawnId: string;
  userId: string;
  nonce: string;
  iat: number;
}

export interface SubmitBody {
  run_token?: unknown;
  score?: unknown;
  duration_ms?: unknown;
  orbs_collected?: unknown;
  finished?: unknown;
  trace?: unknown;
}

export interface StartResult {
  run_token: string;
  level: RunnerLevel;
  expires_at: number;
}

export interface SubmitResult {
  accepted: true;
  score: number;
  best_score: number;
  rank: number | null;
  reward: { intel: number } | null;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  me: { rank: number; score: number } | null;
}

// ---- Helpers ------------------------------------------------

const HMAC_SECRET =
  process.env.GAME_HMAC_SECRET || process.env.JWT_SECRET || 'mapraiders-dev-secret';

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, ''); // yyyymmdd
}

/** Deterministic mulberry32 PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed integer from the first 8 hex chars of sha256(spawnId). */
function seedFromSpawn(spawnId: string): { seedHex: string; seedInt: number } {
  const seedHex = createHash('sha256').update(spawnId).digest('hex');
  const seedInt = parseInt(seedHex.slice(0, 8), 16) >>> 0;
  return { seedHex, seedInt };
}

// ---- Level generation ---------------------------------------

/**
 * Generate the deterministic runner level for a spawn. Same spawn id
 * always yields the identical level. Difficulty scales with `level` (1..3):
 * a longer world, wider gaps and more obstacles.
 */
export function generateLevel(spawnId: string, level: number): RunnerLevel {
  const lvl = clamp(Math.floor(level) || 1, 1, 3);
  const { seedHex, seedInt } = seedFromSpawn(spawnId);
  const rnd = mulberry32(seedInt);

  const worldLength = 180 + lvl * 30;
  const playerSpeed = 6;

  // Difficulty knobs.
  const maxGap = 2 + lvl;                // 3..5 ceiling, but never above 4 (jumpable)
  const gapCeil = Math.min(4, maxGap);   // hard cap: gaps stay jumpable
  const minGap = 2;
  const obstacleChance = 0.3 + lvl * 0.15; // chance to place a spike on a wide platform

  const platforms: Array<{ x: number; w: number; h: number }> = [];
  const obstacles: Array<{ x: number }> = [];
  const orbs: Array<{ x: number; y: number }> = [];

  // First platform: safe start, no obstacles.
  let x = 0;
  let prevH = 0;
  platforms.push({ x: 0, w: 14, h: 0 });
  // Orbs over the safe start platform.
  for (let ox = 4; ox < 14; ox += 8) {
    orbs.push({ x: ox, y: 1 + Math.floor(rnd() * 3) }); // y 1..3
  }
  x = 14;

  while (x < worldLength) {
    // ---- Gap (deadly pit) before the next platform ----
    const gap = minGap + Math.floor(rnd() * (gapCeil - minGap + 1)); // minGap..gapCeil
    const gapStart = x;
    x += gap;

    // ---- Next platform ----
    let w = 6 + Math.floor(rnd() * 11); // 6..16
    // Clamp the platform so it does not overshoot the world end.
    if (x + w > worldLength) {
      w = worldLength - x;
    }
    if (w < 1) break; // no room left

    // Height within +-2 of previous, clamped 0..4.
    const dh = Math.floor(rnd() * 5) - 2; // -2..2
    const h = clamp(prevH + dh, 0, 4);

    platforms.push({ x, w, h });

    // ---- Orb floating over the gap (rewards the risky jump) ----
    // y = 2 above the higher neighbour's surface (use platform-local y of 2).
    orbs.push({ x: gapStart + Math.floor(gap / 2), y: 2 });

    // ---- Obstacles on platforms >= 8 wide ----
    if (w >= 8) {
      // Never within 2 tiles of platform edges; max 1 per 6 tiles.
      const innerStart = x + 2;
      const innerEnd = x + w - 2;
      const maxObstacles = Math.floor(w / 6);
      let placed = 0;
      let cursor = innerStart;
      while (placed < maxObstacles && cursor < innerEnd) {
        if (rnd() < obstacleChance) {
          obstacles.push({ x: cursor });
          placed++;
          cursor += 6; // enforce spacing
        } else {
          cursor += 2;
        }
      }
    }

    // ---- Orbs along the platform (~1 per 8 tiles) ----
    for (let ox = x + 2; ox < x + w - 1; ox += 8) {
      orbs.push({ x: ox, y: 1 + Math.floor(rnd() * 3) }); // y 1..3
    }

    prevH = h;
    x += w;
  }

  // ---- Final platform: extend to worldLength so there is no trailing gap ----
  const last = platforms[platforms.length - 1];
  const lastEnd = last.x + last.w;
  if (lastEnd < worldLength) {
    // Bridge the trailing gap with a final platform at the previous height.
    platforms.push({ x: lastEnd, w: worldLength - lastEnd, h: prevH });
  } else if (lastEnd > worldLength) {
    last.w = worldLength - last.x;
  }

  // Remove any obstacles that fall on the final platform's last 6 tiles.
  const exitClearStart = worldLength - 6;
  const cleanedObstacles = obstacles.filter((o) => o.x < exitClearStart);

  // Keep only orbs inside the world bounds.
  const cleanedOrbs = orbs.filter((o) => o.x >= 0 && o.x < worldLength);

  const orbCount = cleanedOrbs.length;
  const maxScore = orbCount * TERMINALS.ORB_POINTS + TERMINALS.FINISH_BONUS + TERMINALS.TIME_BONUS_MAX;
  const minDurationMs = Math.floor((worldLength / playerSpeed) * 1000 * 0.8);

  return {
    version: 1,
    seed: seedHex,
    worldLength,
    tileSize: 32,
    playerSpeed,
    gravity: 30,
    jumpVelocity: 13,
    platforms,
    obstacles: cleanedObstacles,
    orbs: cleanedOrbs,
    exitX: worldLength - 4,
    par: { orbCount, maxScore, minDurationMs },
  };
}

// ---- Token sign / verify ------------------------------------

function signToken(payload: RunTokenPayload): string {
  const body = base64url(Buffer.from(JSON.stringify(payload)));
  const sig = createHmac('sha256', HMAC_SECRET).update(body).digest('hex');
  return `${body}.${sig}`;
}

function verifyToken(token: string): RunTokenPayload {
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new TerminalError('INVALID_TOKEN', 'Malformed run token');
  }
  const dot = token.indexOf('.');
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', HMAC_SECRET).update(body).digest('hex');

  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new TerminalError('INVALID_TOKEN', 'Bad run token signature');
  }

  let payload: RunTokenPayload;
  try {
    const json = Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    payload = JSON.parse(json) as RunTokenPayload;
  } catch {
    throw new TerminalError('INVALID_TOKEN', 'Unparseable run token');
  }
  return payload;
}

// ---- Flag config helpers ------------------------------------

async function getTerminalConfig(): Promise<Record<string, any>> {
  try {
    const flags = await featureService.getAllFlags();
    const flag = flags.find((f) => f.key === 'terminals');
    return (flag?.config as Record<string, any>) ?? {};
  } catch {
    return {};
  }
}

// ---- Spawn load ---------------------------------------------

interface TerminalSpawnRow {
  id: string;
  npc_type: string;
  level: number;
  status: string;
  lat: number;
  lng: number;
  expires_at: Date;
  expired: boolean;
}

async function loadTerminalSpawn(spawnId: string): Promise<TerminalSpawnRow> {
  const rows = await queryMany<TerminalSpawnRow>(
    `SELECT id, npc_type, level, status,
            ST_Y(location) AS lat, ST_X(location) AS lng,
            expires_at,
            (expires_at <= NOW()) AS expired
       FROM pve_spawns
      WHERE id = $1`,
    [spawnId],
  );
  if (rows.length === 0) {
    throw new TerminalError('TERMINAL_NOT_FOUND', 'Terminal spawn does not exist');
  }
  const spawn = rows[0];
  if (spawn.npc_type !== 'terminal') {
    throw new TerminalError('NOT_A_TERMINAL', 'Spawn is not a terminal');
  }
  if (spawn.status !== 'active' || spawn.expired) {
    throw new TerminalError('TERMINAL_EXPIRED', 'Terminal is no longer available');
  }
  return spawn;
}

// ---- Leaderboard keys ---------------------------------------

function lbKey(spawnId: string): string {
  return `terminal:lb:${spawnId}`;
}

/**
 * Ensure the per-spawn leaderboard sorted set exists. If empty/expired,
 * rebuild it from terminal_runs (best score per user) and re-set expiry.
 */
async function ensureLeaderboard(spawnId: string, expiresAt: Date): Promise<void> {
  const key = lbKey(spawnId);
  let card = 0;
  try {
    card = await redis.zcard(key);
  } catch {
    card = 0;
  }
  if (card > 0) return;

  const rows = await queryMany<{ user_id: string; best: string }>(
    `SELECT user_id, MAX(score) AS best
       FROM terminal_runs
      WHERE spawn_id = $1
      GROUP BY user_id`,
    [spawnId],
  );
  if (rows.length === 0) return;

  for (const row of rows) {
    try {
      await redis.zadd(key, parseInt(row.best, 10), row.user_id);
    } catch {
      /* non-fatal */
    }
  }
  await setLeaderboardExpiry(key, expiresAt);
}

async function setLeaderboardExpiry(key: string, expiresAt: Date): Promise<void> {
  const expireAtSec =
    Math.floor(new Date(expiresAt).getTime() / 1000) + TERMINALS.LEADERBOARD_TTL_BUFFER_SEC;
  try {
    await redis.expireat(key, expireAtSec);
  } catch {
    /* non-fatal */
  }
}

// ---- startRun -----------------------------------------------

export async function startRun(
  userId: string,
  spawnId: string,
  pos?: { latitude: number; longitude: number },
): Promise<StartResult> {
  const spawn = await loadTerminalSpawn(spawnId);

  const cfg = await getTerminalConfig();

  // ---- Proximity (default REQUIRED) ----
  const requireProximity = cfg.require_proximity !== false;
  if (requireProximity) {
    if (
      !pos ||
      typeof pos.latitude !== 'number' ||
      typeof pos.longitude !== 'number'
    ) {
      throw new TerminalError('TOO_FAR', 'Location required to start this terminal');
    }
    const near = await queryMany<{ ok: boolean }>(
      `SELECT ST_DWithin(
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
                $5
              ) AS ok`,
      [spawn.lng, spawn.lat, pos.longitude, pos.latitude, TERMINALS.PLAY_RADIUS_M],
    );
    if (!near[0]?.ok) {
      throw new TerminalError('TOO_FAR', 'You are too far from the terminal');
    }
  }

  // ---- Daily start cap ----
  const runsPerDay =
    typeof cfg.runs_per_day === 'number' ? cfg.runs_per_day : TERMINALS.RUNS_PER_DAY;
  const capKey = `terminal:cap:${userId}:${todayStamp()}`;
  const count = await redis.incr(capKey);
  if (count === 1) {
    await redis.expire(capKey, 86_400);
  }
  if (count > runsPerDay) {
    throw new TerminalError('DAILY_CAP', 'Daily terminal run limit reached');
  }

  // ---- Nonce (single-use, TTL-bound) ----
  const nonce = randomBytes(16).toString('hex');
  await redis.set(`terminal:nonce:${nonce}`, '1', 'EX', TERMINALS.RUN_TOKEN_TTL_SEC);

  const iat = Date.now();
  const token = signToken({ spawnId, userId, nonce, iat });
  const level = generateLevel(spawnId, spawn.level);

  return {
    run_token: token,
    level,
    expires_at: iat + TERMINALS.RUN_TOKEN_TTL_SEC * 1000,
  };
}

// ---- submitRun ----------------------------------------------

export async function submitRun(
  userId: string,
  spawnId: string,
  body: SubmitBody,
): Promise<SubmitResult> {
  // ---- 1. Verify token ----
  const token = typeof body.run_token === 'string' ? body.run_token : '';
  const payload = verifyToken(token);

  if (payload.spawnId !== spawnId || payload.userId !== userId) {
    throw new TerminalError('INVALID_TOKEN', 'Token does not match this run');
  }
  if (
    typeof payload.iat !== 'number' ||
    Date.now() - payload.iat > TERMINALS.RUN_TOKEN_TTL_SEC * 1000
  ) {
    throw new TerminalError('INVALID_TOKEN', 'Run token expired');
  }

  // ---- 2. Single-use nonce (GETDEL) ----
  let nonceVal: string | null;
  try {
    nonceVal = await redis.getdel(`terminal:nonce:${payload.nonce}`);
  } catch {
    // Fallback for older redis without GETDEL: GET then DEL.
    const k = `terminal:nonce:${payload.nonce}`;
    nonceVal = await redis.get(k);
    await redis.del(k);
  }
  if (nonceVal === null) {
    throw new TerminalError('TOKEN_USED', 'Run token already submitted');
  }

  // ---- 3. Plausibility against the regenerated level ----
  const spawn = await loadTerminalSpawn(spawnId);
  const level = generateLevel(spawnId, spawn.level);
  const { par } = level;

  const score = Number(body.score);
  const durationMs = Number(body.duration_ms);
  const orbsCollected = Number(body.orbs_collected);
  const finished = body.finished === true;

  const integersOk =
    Number.isInteger(score) &&
    Number.isInteger(durationMs) &&
    Number.isInteger(orbsCollected);

  const maxScoreForRun =
    orbsCollected * TERMINALS.ORB_POINTS +
    (finished ? TERMINALS.FINISH_BONUS + TERMINALS.TIME_BONUS_MAX : 0);

  const minDuration = finished ? par.minDurationMs : 1000;
  const maxDuration = Date.now() - payload.iat + 5000;

  const plausible =
    integersOk &&
    score >= 0 &&
    score <= par.maxScore &&
    orbsCollected >= 0 &&
    orbsCollected <= par.orbCount &&
    score <= maxScoreForRun &&
    durationMs >= minDuration &&
    durationMs <= maxDuration;

  if (!plausible) {
    console.warn(
      `[Terminal] IMPLAUSIBLE_RUN user=${userId} spawn=${spawnId} score=${score} orbs=${orbsCollected} dur=${durationMs} finished=${finished}`,
    );
    throw new TerminalError('IMPLAUSIBLE_RUN', 'Run failed plausibility check');
  }

  // ---- 4. Persist the run ----
  const replayHash = createHash('sha256')
    .update(JSON.stringify(body.trace ?? {}))
    .digest('hex')
    .slice(0, 64);

  await transaction(async (c) => {
    await c.query(
      `INSERT INTO terminal_runs
         (spawn_id, user_id, score, duration_ms, finished, replay_hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [spawnId, userId, score, durationMs, finished, replayHash],
    );
  });

  // ---- 5. Leaderboard (GT semantics) ----
  const key = lbKey(spawnId);
  let bestScore = score;
  try {
    // Atomic GT update (Redis >= 6.2): only writes when the new score is
    // higher, so two concurrent submits of the same user can never downgrade.
    await redis.zadd(key, 'GT', score, userId);
    const current = await redis.zscore(key, userId);
    if (current !== null) {
      bestScore = Math.max(score, parseFloat(current));
    }
  } catch {
    // Fallback for Redis < 6.2 (non-atomic, best effort).
    try {
      const current = await redis.zscore(key, userId);
      const currentScore = current === null ? null : parseFloat(current);
      if (currentScore === null || score > currentScore) {
        await redis.zadd(key, score, userId);
      } else {
        bestScore = currentScore;
      }
    } catch {
      bestScore = score;
    }
  }
  await setLeaderboardExpiry(key, spawn.expires_at);

  let rank: number | null = null;
  try {
    const r = await redis.zrevrank(key, userId);
    rank = r === null ? null : r + 1;
  } catch {
    rank = null;
  }

  // ---- 6. Reward (finished + daily reward cap) ----
  let reward: { intel: number } | null = null;
  if (finished) {
    const rewardKey = `terminal:reward:${userId}:${todayStamp()}`;
    const rewardCount = await redis.incr(rewardKey);
    if (rewardCount === 1) {
      await redis.expire(rewardKey, 86_400);
    }
    if (rewardCount <= TERMINALS.REWARD_RUNS_PER_DAY) {
      const intel = clamp(
        TERMINALS.REWARD_INTEL_MIN + Math.floor(score / 100),
        TERMINALS.REWARD_INTEL_MIN,
        TERMINALS.REWARD_INTEL_MAX,
      );
      try {
        await resourceService.credit(userId, 'intel', intel, 'terminal_run', { spawnId, score });
        reward = { intel };
      } catch (err: any) {
        console.warn(`[Terminal] intel credit failed for ${userId}: ${err?.message}`);
        reward = null;
      }
    }
  }

  return {
    accepted: true,
    score,
    best_score: bestScore,
    rank,
    reward,
  };
}

// ---- getLeaderboard -----------------------------------------

export async function getLeaderboard(
  spawnId: string,
  userId: string,
): Promise<LeaderboardResult> {
  // Load the spawn to learn its expiry (used to set the leaderboard TTL on
  // rebuild). If the terminal is gone we still serve whatever Redis holds.
  let expiresAt: Date | null = null;
  try {
    const spawn = await loadTerminalSpawn(spawnId);
    expiresAt = spawn.expires_at;
  } catch {
    expiresAt = null;
  }

  const key = lbKey(spawnId);

  // Rebuild from DB if the sorted set is empty/expired.
  if (expiresAt) {
    try {
      await ensureLeaderboard(spawnId, expiresAt);
    } catch {
      /* non-fatal */
    }
  }

  let raw: string[] = [];
  try {
    raw = await redis.zrevrange(key, 0, 9, 'WITHSCORES');
  } catch {
    raw = [];
  }

  const ids: string[] = [];
  const scored: Array<{ user_id: string; score: number }> = [];
  for (let i = 0; i < raw.length; i += 2) {
    ids.push(raw[i]);
    scored.push({ user_id: raw[i], score: parseFloat(raw[i + 1]) });
  }

  const usernameMap = new Map<string, string>();
  if (ids.length > 0) {
    const users = await queryMany<{ id: string; username: string }>(
      'SELECT id, username FROM users WHERE id = ANY($1)',
      [ids],
    );
    for (const u of users) usernameMap.set(u.id, u.username);
  }

  const entries: LeaderboardEntry[] = scored.map((s, idx) => ({
    rank: idx + 1,
    user_id: s.user_id,
    username: usernameMap.get(s.user_id) ?? 'Unknown',
    score: s.score,
  }));

  // ---- me ----
  let me: { rank: number; score: number } | null = null;
  try {
    const [r, sc] = await Promise.all([redis.zrevrank(key, userId), redis.zscore(key, userId)]);
    if (r !== null && sc !== null) {
      me = { rank: r + 1, score: parseFloat(sc) };
    }
  } catch {
    me = null;
  }

  return { entries, me };
}

export const terminalEngine = {
  generateLevel,
  startRun,
  submitRun,
  getLeaderboard,
};

export default terminalEngine;

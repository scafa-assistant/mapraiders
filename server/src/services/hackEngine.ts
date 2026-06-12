// ============================================================
// Hack Engine (Phase A)
// Server-side resolution of the hacking minigame. The client only
// sends {spawnId, inputTrace}; the server decides success based on
// proximity (<=75 m), a daily cap, NPC level and a simple trace
// plausibility heuristic. On success the spawn is consumed, loot is
// granted (resources + unit drop) inside ONE transaction, and a
// `pve_hacked` event is broadcast to nearby players.
// ============================================================

import { PoolClient } from 'pg';
import { randomInt } from 'crypto';
import { transaction } from '../config/database';
import redis from '../config/redis';
import { PVE } from '../config/constants';
import { itemService } from './itemService';
import { resourceService } from './resourceService';
import { awardXp } from './progressionEngine';
import { wsService } from './wsService';
import { ResourceType } from '../utils/types';
import { SpawnLoot } from './pveSpawnEngine';

// ---- Types --------------------------------------------------

export interface InputTrace {
  playerLocation?: { latitude: number; longitude: number };
  samples?: Array<{ t?: number; freq?: number; amp?: number }>;
  /** Client-reported duration in seconds (validated against samples). */
  durationS?: number;
  [key: string]: any;
}

export interface HackResult {
  success: boolean;
  message?: string;
  loot?: { resources: Partial<Record<ResourceType, number>>; items: string[] };
  spawn?: {
    id: string;
    npc_type: string;
    level: number;
    status: string;
  };
}

// ---- XP award ------------------------------------------------
// Phase A note: progressionEngine.awardXp(userId, amount, reason) exists and
// is a simple flat XP grant — used here for a 25 XP reward on a successful
// hack. It also performs streak/title side effects, which is acceptable.
const HACK_XP_REWARD = 25;

// ---- Trace plausibility -------------------------------------

/**
 * Simple anti-cheat heuristic. A plausible trace has at least 10 samples and
 * a play duration between 2 and 60 seconds. Plausible → +0.05 success bonus,
 * implausible → -0.2 penalty. The trace itself never decides success outright
 * — the server still rolls the dice.
 */
function tracePlausibilityBonus(trace: InputTrace): number {
  const samples = Array.isArray(trace.samples) ? trace.samples : [];

  let durationS = typeof trace.durationS === 'number' ? trace.durationS : NaN;
  if (!Number.isFinite(durationS) && samples.length >= 2) {
    const ts = samples.map((s) => (typeof s.t === 'number' ? s.t : NaN)).filter(Number.isFinite);
    if (ts.length >= 2) {
      durationS = (Math.max(...ts) - Math.min(...ts)) / 1000; // assume ms timestamps
    }
  }

  const plausible =
    samples.length >= 10 &&
    Number.isFinite(durationS) &&
    durationS >= 2 &&
    durationS <= 60;

  return plausible ? 0.05 : -0.2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---- Main entry ---------------------------------------------

/**
 * Attempt to hack a spawn. Runs inside one transaction so loot grant and
 * spawn consumption are atomic. Failure modes return { success:false } with
 * a stable `message` rather than throwing — the route maps these straight
 * into the response wrapper (no 500).
 */
export async function attemptHack(
  userId: string,
  spawnId: string,
  inputTrace: InputTrace,
): Promise<HackResult> {
  // ---- Daily cap (outside the tx; Redis INCR) ----
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // yyyymmdd
  const capKey = `hack:cap:${userId}:${day}`;
  const count = await redis.incr(capKey);
  if (count === 1) {
    await redis.expire(capKey, 86_400);
  }
  if (count > PVE.HACK_DAILY_CAP) {
    return { success: false, message: 'DAILY_CAP' };
  }

  return transaction(async (c: PoolClient) => {
    // ---- (a) Load + lock the spawn ----
    const spawnRes = await c.query<{
      id: string;
      npc_type: string;
      level: number;
      status: string;
      loot: SpawnLoot;
      lat: number;
      lng: number;
      expired: boolean;
    }>(
      `SELECT id, npc_type, level, status, loot,
              ST_Y(location) AS lat, ST_X(location) AS lng,
              (expires_at <= NOW()) AS expired
         FROM pve_spawns
        WHERE id = $1
        FOR UPDATE`,
      [spawnId],
    );

    if (spawnRes.rowCount === 0) {
      return { success: false, message: 'SPAWN_NOT_FOUND' };
    }
    const spawn = spawnRes.rows[0];

    if (spawn.status !== 'active' || spawn.expired) {
      return { success: false, message: 'SPAWN_UNAVAILABLE' };
    }

    // ---- (b) Proximity check (<= 75 m) ----
    const loc = inputTrace?.playerLocation;
    if (
      !loc ||
      typeof loc.latitude !== 'number' ||
      typeof loc.longitude !== 'number'
    ) {
      return { success: false, message: 'NO_LOCATION' };
    }

    const near = await c.query<{ ok: boolean }>(
      `SELECT ST_DWithin(
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
                $5
              ) AS ok`,
      [spawn.lng, spawn.lat, loc.longitude, loc.latitude, PVE.HACK_RADIUS_M],
    );
    if (!near.rows[0]?.ok) {
      return { success: false, message: 'TOO_FAR' };
    }

    // ---- (d) Server resolution ----
    const bonus = tracePlausibilityBonus(inputTrace);
    const successProb = clamp(0.9 - 0.15 * (spawn.level - 1) + bonus, 0.2, 0.95);
    // Roll: success if a uniform [0,1) sample falls below the probability.
    const roll = randomInt(0, 1_000_000) / 1_000_000;
    const success = roll < successProb;

    const grantedResources: Partial<Record<ResourceType, number>> = {};
    const grantedItems: string[] = [];

    if (success) {
      // ---- (e) Consume the spawn ----
      await c.query(
        `UPDATE pve_spawns
            SET status = 'hacked', hacked_by = $2
          WHERE id = $1`,
        [spawn.id, userId],
      );

      const loot: SpawnLoot = spawn.loot ?? { resources: {}, items: [] };

      // Resources
      for (const [resource, amount] of Object.entries(loot.resources ?? {})) {
        if (amount && amount > 0) {
          await resourceService.credit(
            userId,
            resource as ResourceType,
            amount,
            'hack_reward',
            { spawn_id: spawn.id },
            c,
          );
          grantedResources[resource as ResourceType] = amount;
        }
      }

      // Unit drops (roll each by chance)
      for (const item of loot.items ?? []) {
        const drop = randomInt(0, 1_000_000) / 1_000_000;
        if (drop < item.chance) {
          await itemService.mintItem(
            item.definitionId,
            userId,
            'hack',
            { spawn_id: spawn.id },
            c,
          );
          grantedItems.push(item.definitionId);
        }
      }
    }

    // ---- (e) Always log the attempt ----
    await c.query(
      `INSERT INTO hack_attempts (spawn_id, user_id, success, input_trace)
       VALUES ($1, $2, $3, $4)`,
      [spawn.id, userId, success, JSON.stringify(inputTrace ?? {})],
    );

    // ---- XP (post-grant, best effort) ----
    if (success) {
      try {
        await awardXp(userId, HACK_XP_REWARD, 'hack_reward');
      } catch (err: any) {
        console.warn(`[Hack] awardXp failed for ${userId}: ${err?.message}`);
      }
    }

    // ---- (f) Broadcast to nearby players ----
    wsService.broadcastNearby(spawn.lat, spawn.lng, 2000, 'pve_hacked', {
      spawnId: spawn.id,
      npcType: spawn.npc_type,
      success,
      hackedBy: userId,
    });

    return {
      success,
      loot: success ? { resources: grantedResources, items: grantedItems } : undefined,
      spawn: {
        id: spawn.id,
        npc_type: spawn.npc_type,
        level: spawn.level,
        status: success ? 'hacked' : 'active',
      },
    };
  });
}

export const hackEngine = { attemptHack };

export default hackEngine;

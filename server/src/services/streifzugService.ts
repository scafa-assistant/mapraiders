// ============================================================
// Streifzug Service (Patrol Mode) — Stage 1: foreground encounter loop.
//
// A player toggles a Streifzug session on. While active, the client
// sends GPS pings; each ping looks for nearby PvE spawns (existing
// pveSpawnEngine content) and surfaces the nearest FRESH one as an
// "encounter" plus a push notification. The player then engages it
// through the normal hack flow (POST /api/pve/spawns/:id/hack), which
// keeps its own server-side proximity + daily-cap checks.
//
// This is deliberately an orchestration layer, NOT a new content engine:
//   - Spawns come from pveSpawnEngine (biome-driven NPCs + loot).
//   - Loot/resolution comes from hackEngine.
//   - Delivery comes from pushService.
// All session/pacing state lives in Redis (no schema change needed).
//
// Stage 2 (true background tracking, ACCESS_BACKGROUND_LOCATION) is
// parked — see Streifzug_Modus_Spec.md.
// ============================================================

import redis from '../config/redis';
import { STREIFZUG } from '../config/constants';
import { getSpawnsInBbox, BboxInput, PveSpawnRow } from './pveSpawnEngine';
import { haversineDistance, calculateBearing } from '../utils/geo';
import { sendPushToUser } from './pushService';

// ---- Types --------------------------------------------------

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type EncounterKind = 'loot' | 'recruit' | 'threat';

export interface StreifzugEncounter {
  spawnId: string;
  npcType: string;
  kind: EncounterKind;
  distanceM: number;
  bearingDeg: number;
  latitude: number;
  longitude: number;
  level: number;
  biome: string;
  /** ISO timestamp — passed straight into the mobile HackingScreen spawn param. */
  expiresAt: string;
  title: string;
  body: string;
}

export interface PingResult {
  active: boolean;
  encounter: StreifzugEncounter | null;
  /** Optional diagnostic for the client/log: why no encounter this ping. */
  reason?: 'inactive' | 'implausible' | 'cooldown' | 'daily_cap' | 'none_nearby';
}

export interface SessionStatus {
  active: boolean;
  startedAt?: number;
}

// ---- Redis keys ---------------------------------------------

const sessionKey = (userId: string) => `streifzug:session:${userId}`;
const lastPingKey = (userId: string) => `streifzug:last:${userId}`;
const cooldownKey = (userId: string) => `streifzug:cooldown:${userId}`;
const dedupKey = (userId: string, spawnId: string) => `streifzug:enc:${userId}:${spawnId}`;
const countKey = (userId: string, day: string) => `streifzug:count:${userId}:${day}`;

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---- Encounter flavour --------------------------------------

interface Flavour {
  kind: EncounterKind;
  title: string;
  body: (distM: number) => string;
}

/** Map a raw npc_type to player-facing German flavour. */
function flavourFor(npcType: string): Flavour {
  switch (npcType) {
    case 'aether_leech':
      return {
        kind: 'threat',
        title: '⚔️ Feindliche Truppe in der Nähe',
        body: (d) => `Eine Patrouille lauert ${d}m entfernt. Stell dich oder zieh weiter.`,
      };
    case 'tech_drone':
      return {
        kind: 'loot',
        title: '🛰️ Tech-Fund gesichtet',
        body: (d) => `Eine Drohne ${d}m vor dir , kapere sie für Tech.`,
      };
    case 'scout_disc':
    default:
      return {
        kind: 'loot',
        title: '✨ Etwas glänzt in der Nähe',
        body: (d) => `${d}m vor dir liegt etwas. Geh hin und sichere es dir.`,
      };
  }
}

// ---- Geometry helper ----------------------------------------

/** Build a small lat/lng bounding box around a point for the spawn query. */
function bboxAround(lat: number, lng: number, radiusM: number): BboxInput {
  const dLat = radiusM / 111_320;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLng = radiusM / (111_320 * (Math.abs(cos) < 1e-6 ? 1e-6 : cos));
  return {
    minLng: lng - Math.abs(dLng),
    minLat: lat - dLat,
    maxLng: lng + Math.abs(dLng),
    maxLat: lat + dLat,
  };
}

// ---- Session lifecycle --------------------------------------

export async function startSession(userId: string): Promise<SessionStatus> {
  const startedAt = Date.now();
  await redis.set(
    sessionKey(userId),
    JSON.stringify({ startedAt }),
    'EX',
    STREIFZUG.SESSION_TTL_SEC,
  );
  return { active: true, startedAt };
}

export async function stopSession(userId: string): Promise<SessionStatus> {
  await redis.del(sessionKey(userId), lastPingKey(userId), cooldownKey(userId));
  return { active: false };
}

export async function getStatus(userId: string): Promise<SessionStatus> {
  const raw = await redis.get(sessionKey(userId));
  if (raw === null) return { active: false };
  try {
    const parsed = JSON.parse(raw) as { startedAt?: number };
    return { active: true, startedAt: parsed.startedAt };
  } catch {
    return { active: true };
  }
}

// ---- The ping (encounter loop heartbeat) --------------------

/**
 * Heartbeat call from an active Streifzug session. Resolves at most one
 * fresh encounter per ping, paced by a per-user cooldown and bounded by a
 * daily cap. Returns the encounter (and fires a push) or a typed reason
 * for why nothing surfaced this tick.
 */
export async function ping(userId: string, point: LatLng): Promise<PingResult> {
  const { latitude: lat, longitude: lng } = point;

  // 1. Session must be active. Refresh its sliding TTL.
  const sessionRaw = await redis.get(sessionKey(userId));
  if (sessionRaw === null) return { active: false, encounter: null, reason: 'inactive' };
  await redis.expire(sessionKey(userId), STREIFZUG.SESSION_TTL_SEC);

  // 2. Light GPS plausibility: reject impossible jumps (likely spoof).
  const now = Date.now();
  const lastRaw = await redis.get(lastPingKey(userId));
  await redis.set(
    lastPingKey(userId),
    JSON.stringify({ lat, lng, t: now }),
    'EX',
    3600,
  );
  if (lastRaw) {
    try {
      const last = JSON.parse(lastRaw) as { lat: number; lng: number; t: number };
      const dtSec = Math.max(1, (now - last.t) / 1000);
      const distM = haversineDistance(last.lat, last.lng, lat, lng);
      const speedKmh = (distM / dtSec) * 3.6;
      if (speedKmh > STREIFZUG.MAX_PLAUSIBLE_SPEED_KMH) {
        return { active: true, encounter: null, reason: 'implausible' };
      }
    } catch {
      /* ignore malformed last ping */
    }
  }

  // 3. Pace pushes: at most one encounter attempt per cooldown window.
  const cool = await redis.set(
    cooldownKey(userId),
    '1',
    'EX',
    STREIFZUG.PING_COOLDOWN_SEC,
    'NX',
  );
  if (cool === null) return { active: true, encounter: null, reason: 'cooldown' };

  // 4. Daily cap (read-only check; increment only on a real encounter).
  const day = utcDay();
  const countRaw = await redis.get(countKey(userId, day));
  if (countRaw !== null && parseInt(countRaw, 10) >= STREIFZUG.DAILY_ENCOUNTER_CAP) {
    return { active: true, encounter: null, reason: 'daily_cap' };
  }

  // 5. Find nearby spawns and pick the nearest FRESH one.
  const bbox = bboxAround(lat, lng, STREIFZUG.ENCOUNTER_RADIUS_M);
  let spawns: PveSpawnRow[];
  try {
    spawns = await getSpawnsInBbox(bbox, userId);
  } catch (err: any) {
    console.warn(`[Streifzug] getSpawnsInBbox failed: ${err?.message}`);
    return { active: true, encounter: null, reason: 'none_nearby' };
  }

  const candidates = spawns
    .filter((s) => s.npc_type !== 'terminal')
    .map((s) => ({ s, dist: haversineDistance(lat, lng, s.lat, s.lng) }))
    .filter((c) => c.dist <= STREIFZUG.ENCOUNTER_RADIUS_M)
    .sort((a, b) => a.dist - b.dist);

  let chosen: { s: PveSpawnRow; dist: number } | null = null;
  for (const cand of candidates) {
    const fresh = await redis.set(
      dedupKey(userId, cand.s.id),
      '1',
      'EX',
      STREIFZUG.ENCOUNTER_DEDUP_SEC,
      'NX',
    );
    if (fresh !== null) {
      chosen = cand;
      break;
    }
  }

  if (!chosen) return { active: true, encounter: null, reason: 'none_nearby' };

  // 6. Count it against the daily cap (set TTL on first hit of the day).
  const newCount = await redis.incr(countKey(userId, day));
  if (newCount === 1) await redis.expire(countKey(userId, day), 90_000); // ~25 h

  // 7. Build the encounter, fire the push.
  const flavour = flavourFor(chosen.s.npc_type);
  const distM = Math.round(chosen.dist);
  const bearingDeg = Math.round(calculateBearing(lat, lng, chosen.s.lat, chosen.s.lng));
  const title = flavour.title;
  const body = flavour.body(distM);

  await sendPushToUser(userId, title, body, {
    type: 'streifzug_encounter',
    spawnId: chosen.s.id,
    kind: flavour.kind,
    npcType: chosen.s.npc_type,
    distance: String(distM),
    latitude: String(chosen.s.lat),
    longitude: String(chosen.s.lng),
  });

  return {
    active: true,
    encounter: {
      spawnId: chosen.s.id,
      npcType: chosen.s.npc_type,
      kind: flavour.kind,
      distanceM: distM,
      bearingDeg,
      latitude: chosen.s.lat,
      longitude: chosen.s.lng,
      level: chosen.s.level,
      biome: chosen.s.biome,
      expiresAt: new Date(chosen.s.expires_at).toISOString(),
      title,
      body,
    },
  };
}

export const streifzugService = {
  startSession,
  stopSession,
  getStatus,
  ping,
};

export default streifzugService;

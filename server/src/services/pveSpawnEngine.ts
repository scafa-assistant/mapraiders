// ============================================================
// PvE Spawn Engine (Phase A)
// Context-driven NPC spawns on the existing map: Erdriss portals
// spit out Vril scouts, tech drones and Aether-Leeches based on
// the biome of each H3 res-8 cell. Spawning is lazy (triggered on
// map fetch, throttled by a Redis cooldown) plus a nightly cron
// refill. Aether-Leeches only anchor onto foreign territories and
// notify their owner via WebSocket.
// ============================================================

import { PoolClient } from 'pg';
import { randomInt } from 'crypto';
import { transaction, query, queryMany } from '../config/database';
import redis from '../config/redis';
import { PVE, Biome, PveLootTable } from '../config/constants';
import { cellForPoint, boundary, disk, RES_SPAWN } from './h3Service';
import { getContext } from './osmContextService';
import { wsService } from './wsService';

// ---- Types --------------------------------------------------

export interface PveSpawnRow {
  id: string;
  h3_cell: string;
  npc_type: string;
  level: number;
  biome: string;
  status: string;
  anchored_territory_id: string | null;
  loot: SpawnLoot;
  lat: number;
  lng: number;
  spawned_at: Date;
  expires_at: Date;
}

/** Materialised loot stored on a spawn row and rolled at hack time. */
export interface SpawnLoot {
  resources: Partial<Record<'energy' | 'tech' | 'intel', number>>;
  items: Array<{ definitionId: string; chance: number }>;
}

export interface BboxInput {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

// ---- Helpers ------------------------------------------------

/**
 * Pick a uniformly-random point inside an H3 cell. We sample within the
 * cell's bounding box and rely on the small res-8 footprint (~0.7 km²) so
 * the point is always close enough to the real cell for gameplay purposes.
 */
function randomPointInCell(h3Cell: string): { lat: number; lng: number } {
  const verts = boundary(h3Cell);
  const lats = verts.map((v) => v.latitude);
  const lngs = verts.map((v) => v.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // randomInt is integer-only — scale by 1e6 for ~1m resolution.
  const lat = minLat + (randomInt(0, 1_000_001) / 1_000_000) * (maxLat - minLat);
  const lng = minLng + (randomInt(0, 1_000_001) / 1_000_000) * (maxLng - minLng);
  return { lat, lng };
}

/** Normalise the biome string to one of our known biomes (fallback urban). */
function normaliseBiome(biome: string): Biome {
  const known: Biome[] = ['water', 'forest', 'industrial', 'rural', 'urban', 'landmark'];
  return (known.includes(biome as Biome) ? biome : 'urban') as Biome;
}

/**
 * Resolve a candidate token from the BIOME_SPAWN_MATRIX into a concrete
 * npc_type. Source tokens (e.g. 'water_strider_source') map to scout-style
 * discs that carry the biome-specific bonus drop; the unit itself is layered
 * on via BIOME_UNIT_DROP at spawn time.
 */
function tokenToNpcType(token: string): string {
  switch (token) {
    case 'water_strider_source':
    case 'forest_construct_source':
      return 'scout_disc';
    default:
      return token;
  }
}

/**
 * Build the materialised loot table for a spawn: the base loot of the npc
 * type plus any biome-specific bonus unit drop.
 */
function buildLoot(npcType: string, biome: Biome): SpawnLoot {
  const base: PveLootTable | undefined = PVE.LOOT[npcType];
  const loot: SpawnLoot = {
    resources: base ? { ...base.resources } : {},
    items: [],
  };
  if (base?.unit) {
    loot.items.push({ definitionId: base.unit.definitionId, chance: base.unit.chance });
  }
  const bonus = PVE.BIOME_UNIT_DROP[biome];
  if (bonus) {
    loot.items.push({ definitionId: bonus.definitionId, chance: bonus.chance });
  }
  return loot;
}

// ---- Spawn creation -----------------------------------------

/**
 * Ensure a cell has its spawns topped up. Lazy + throttled:
 *   1. Acquire a 10-min Redis cooldown (SET NX EX). If held → return.
 *   2. Count active, non-expired spawns. If already at MAX → return.
 *   3. Resolve the biome, then create 0..(MAX - active) new spawns.
 *
 * Aether-Leeches are special: they only spawn when a FOREIGN active
 * territory intersects the cell. When created they anchor to that
 * territory and the owner is notified via WS (`territory_leeched`).
 */
export async function ensureCellSpawns(h3Cell: string): Promise<void> {
  // 1. Cooldown lock
  const lockKey = `pve:cell:${h3Cell}`;
  const acquired = await redis.set(lockKey, '1', 'EX', PVE.CELL_COOLDOWN_SEC, 'NX');
  if (acquired === null) return; // another tick handled this cell recently

  // 2. How many are already active?
  const activeRes = await query<{ cnt: string }>(
    `SELECT COUNT(*)::bigint AS cnt
       FROM pve_spawns
      WHERE h3_cell = $1 AND status = 'active' AND expires_at > NOW()`,
    [h3Cell],
  );
  const active = parseInt(activeRes.rows[0].cnt, 10);
  const free = PVE.MAX_SPAWNS_PER_CELL - active;
  if (free <= 0) return;

  // 3. Biome -> candidate matrix
  const ctx = await getContext(h3Cell);
  const biome = normaliseBiome(ctx.biome);
  const candidates = PVE.BIOME_SPAWN_MATRIX[biome] ?? PVE.BIOME_SPAWN_MATRIX.urban;
  if (candidates.length === 0) return;

  // Random count of new spawns: 0..free
  const toSpawn = randomInt(0, free + 1);
  if (toSpawn === 0) return;

  for (let i = 0; i < toSpawn; i++) {
    const token = candidates[randomInt(0, candidates.length)];
    const npcType = tokenToNpcType(token);
    await createSpawn(h3Cell, npcType, biome);
  }
}

/**
 * Create one spawn of the given type in the cell. aether_leech requires a
 * foreign anchoring territory — if none is found the spawn is skipped.
 */
async function createSpawn(h3Cell: string, npcType: string, biome: Biome): Promise<void> {
  const { lat, lng } = randomPointInCell(h3Cell);
  const level = randomInt(1, 4); // 1..3
  const ttlHours = randomInt(PVE.SPAWN_TTL_HOURS_MIN, PVE.SPAWN_TTL_HOURS_MAX + 1);
  const loot = buildLoot(npcType, biome);

  await transaction(async (c: PoolClient) => {
    let anchoredTerritoryId: string | null = null;
    let ownerId: string | null = null;

    if (npcType === 'aether_leech') {
      // Anchor only onto a FOREIGN active territory intersecting this cell.
      // Prefer the indexed h3_cells array; fall back to a spatial point test
      // for territories whose h3_cells were never backfilled.
      const terr = await c.query<{ id: string; owner_id: string | null }>(
        `SELECT id, owner_id
           FROM territories
          WHERE owner_id IS NOT NULL
            AND (
              ($1 = ANY(h3_cells))
              OR (
                h3_cells IS NULL
                AND ST_Intersects(
                  polygon,
                  ST_SetSRID(ST_MakePoint($2, $3), 4326)
                )
              )
            )
          ORDER BY claim_value DESC
          LIMIT 1`,
        [h3Cell, lng, lat],
      );
      if (terr.rowCount === 0) {
        // No territory to leech — abort this spawn quietly.
        return;
      }
      anchoredTerritoryId = terr.rows[0].id;
      ownerId = terr.rows[0].owner_id;
    }

    const inserted = await c.query<{ id: string }>(
      `INSERT INTO pve_spawns
         (h3_cell, location, npc_type, level, biome, status, anchored_territory_id, loot, expires_at)
       VALUES
         ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, 'active', $7, $8,
          NOW() + ($9 || ' hours')::interval)
       RETURNING id`,
      [h3Cell, lng, lat, npcType, level, biome, anchoredTerritoryId, JSON.stringify(loot), ttlHours],
    );

    // Notify the territory owner that their land is being leeched.
    if (npcType === 'aether_leech' && ownerId) {
      wsService.sendToUser(ownerId, 'territory_leeched', {
        spawnId: inserted.rows[0].id,
        territoryId: anchoredTerritoryId,
        h3Cell,
        penalty: PVE.LEECH_YIELD_PENALTY,
      });
    }
  });
}

// ---- Read: spawns in bbox -----------------------------------

/**
 * Return active, non-expired spawns inside the bbox. Before querying, this
 * lazily tops up the res-8 cells around the bbox centre (centre + ring-1,
 * max 7 cells). Spawn errors are swallowed per-cell so a single bad cell
 * never blocks the map read (E7 lazy spawning).
 */
export async function getSpawnsInBbox(
  bbox: BboxInput,
  _userId: string,
): Promise<PveSpawnRow[]> {
  // Lazy spawn around the viewport centre.
  const centreLat = (bbox.minLat + bbox.maxLat) / 2;
  const centreLng = (bbox.minLng + bbox.maxLng) / 2;
  const centreCell = cellForPoint(centreLat, centreLng, RES_SPAWN);
  const cells = disk(centreCell, 1).slice(0, 7);

  await Promise.all(
    cells.map(async (cell) => {
      try {
        await ensureCellSpawns(cell);
      } catch (err: any) {
        console.warn(`[PvE] ensureCellSpawns failed for ${cell}: ${err?.message}`);
      }
    }),
  );

  const rows = await queryMany<PveSpawnRow>(
    `SELECT id, h3_cell, npc_type, level, biome, status, anchored_territory_id, loot,
            ST_Y(location) AS lat, ST_X(location) AS lng, spawned_at, expires_at
       FROM pve_spawns
      WHERE status = 'active'
        AND expires_at > NOW()
        AND ST_Intersects(
              location,
              ST_MakeEnvelope($1, $2, $3, $4, 4326)
            )
      ORDER BY spawned_at DESC
      LIMIT 200`,
    [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
  );
  return rows;
}

// ---- Cron: expire + refill ----------------------------------

/**
 * Cron entry point: mark expired spawns, then refill cells that saw player
 * activity in the last 48 h (place_history). Returns the number of spawns
 * that were expired. Cells are derived from place_history point locations so
 * we are independent of the legacy grid_cell format.
 */
export async function expireAndRefill(): Promise<number> {
  const expired = await query(
    `UPDATE pve_spawns
        SET status = 'expired'
      WHERE status = 'active' AND expires_at <= NOW()`,
  );
  const expiredCount = expired.rowCount ?? 0;

  // Collect recently-active locations and map them to res-8 cells in JS.
  const active = await queryMany<{ lat: number; lng: number }>(
    `SELECT ST_Y(location) AS lat, ST_X(location) AS lng
       FROM place_history
      WHERE created_at > NOW() - INTERVAL '48 hours'
      ORDER BY created_at DESC
      LIMIT 2000`,
  );

  const cellSet = new Set<string>();
  for (const row of active) {
    if (cellSet.size >= 30) break;
    try {
      cellSet.add(cellForPoint(row.lat, row.lng, RES_SPAWN));
    } catch {
      // skip malformed coordinates
    }
  }

  for (const cell of cellSet) {
    try {
      await ensureCellSpawns(cell);
    } catch (err: any) {
      console.warn(`[PvE] refill ensureCellSpawns failed for ${cell}: ${err?.message}`);
    }
  }

  return expiredCount;
}

// ---- Cron: aether-leech tick --------------------------------

/**
 * Cron entry point: for every active aether_leech anchored to a territory,
 * notify the owner once per day (Redis dedup, 20 h TTL). Phase A does NOT
 * apply a real claim_value deduction — the energy economy arrives in Phase B
 * — this only surfaces the leech status. Returns the number of active
 * leeches processed.
 */
export async function applyLeechTick(): Promise<number> {
  const leeches = await queryMany<{
    id: string;
    anchored_territory_id: string;
    owner_id: string | null;
    h3_cell: string;
  }>(
    `SELECT s.id, s.anchored_territory_id, s.h3_cell, t.owner_id
       FROM pve_spawns s
       JOIN territories t ON t.id = s.anchored_territory_id
      WHERE s.npc_type = 'aether_leech'
        AND s.status = 'active'
        AND s.expires_at > NOW()
        AND s.anchored_territory_id IS NOT NULL`,
  );

  let processed = 0;
  for (const leech of leeches) {
    processed++;
    if (!leech.owner_id) continue;

    // Dedup: at most one notification per leech per ~day.
    const dedupKey = `pve:leech:notified:${leech.id}`;
    const fresh = await redis.set(dedupKey, '1', 'EX', 72_000, 'NX'); // 20 h
    if (fresh === null) continue;

    wsService.sendToUser(leech.owner_id, 'territory_leeched', {
      spawnId: leech.id,
      territoryId: leech.anchored_territory_id,
      h3Cell: leech.h3_cell,
      penalty: PVE.LEECH_YIELD_PENALTY,
    });
  }

  return processed;
}

export const pveSpawnEngine = {
  ensureCellSpawns,
  getSpawnsInBbox,
  expireAndRefill,
  applyLeechTick,
};

export default pveSpawnEngine;

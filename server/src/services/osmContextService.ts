// ============================================================
// OSM Context Service
// Fetches and caches OpenStreetMap context (biome, landmarks)
// per H3 res-8 cell via the Overpass API.
//
// Cache TTL: 90 days (normal), 7-day retry on fetch failure.
// Rate-limit: global Redis lock — max 1 Overpass request in
// flight at a time.
// ============================================================

import axios from 'axios';
import { query, queryOne } from '../config/database';
import redis from '../config/redis';
import { boundary } from './h3Service';

// ---- Constants ----------------------------------------------

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_TIMEOUT_MS = 15_000;

/** Cache TTL: 90 days in seconds. */
const CACHE_TTL_DAYS = 90;

/** On fetch failure we back-date fetched_at by 83 days so a
 *  retry occurs in ~7 days without a separate flag column. */
const ERROR_BACKDATE_DAYS = 83;

/** Redis key for the global Overpass fetch lock. */
const OSM_FETCH_LOCK_KEY = 'osm:fetch:lock';

/** Lock TTL in seconds: 5 seconds should cover one HTTP call. */
const LOCK_TTL_SECONDS = 5;

// ---- Types --------------------------------------------------

export interface OsmContextResult {
  biome: string;
  tags: Record<string, any>;
  landmarks: Array<{ name: string; lat: number; lng: number; osm_tags: Record<string, any> }>;
}

// ---- Biome classification -----------------------------------

/**
 * Derive biome from a flat array of OSM element tags.
 * Returns both the biome string and a landmark list.
 */
function classifyBiome(elements: any[]): {
  biome: string;
  tagSummary: Record<string, number>;
  landmarks: OsmContextResult['landmarks'];
} {
  const counts: Record<string, number> = {
    water: 0,
    forest: 0,
    industrial: 0,
    landmark: 0,
    rural: 0,
  };

  const landmarks: OsmContextResult['landmarks'] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};

    // Water
    if (
      tags.natural === 'water' ||
      tags.natural === 'bay' ||
      tags.natural === 'wetland' ||
      (tags.waterway && tags.waterway !== 'no')
    ) {
      counts.water++;
    }

    // Forest
    if (tags.natural === 'wood' || tags.landuse === 'forest') {
      counts.forest++;
    }

    // Industrial
    if (tags.landuse === 'industrial' || tags.landuse === 'retail') {
      counts.industrial++;
    }

    // Rural
    if (tags.landuse === 'farmland' || tags.landuse === 'meadow' || tags.landuse === 'farmyard') {
      counts.rural++;
    }

    // Landmarks
    const isLandmark =
      tags.historic != null ||
      tags.tourism === 'attraction' ||
      tags.tourism === 'viewpoint' ||
      tags.amenity === 'townhall' ||
      tags.amenity === 'marketplace';

    if (isLandmark) {
      counts.landmark++;
      // Resolve coordinates: node has lat/lon, way/relation uses 'center'
      const lat: number | undefined =
        el.lat ?? el.center?.lat;
      const lng: number | undefined =
        el.lon ?? el.center?.lon;
      if (lat != null && lng != null) {
        landmarks.push({
          name: tags.name ?? tags['name:en'] ?? '',
          lat,
          lng,
          osm_tags: tags,
        });
      }
    }
  }

  // Pick biome by highest count; landmark beats everything if present
  let biome = 'urban';
  if (counts.landmark > 0) {
    biome = 'landmark';
  } else {
    const order: Array<keyof typeof counts> = ['water', 'forest', 'industrial', 'rural'];
    let max = 0;
    for (const key of order) {
      if (counts[key] > max) {
        max = counts[key];
        biome = key;
      }
    }
  }

  return { biome, tagSummary: counts, landmarks };
}

// ---- Overpass query builder ---------------------------------

/**
 * Build an Overpass QL query that fetches relevant nodes/ways
 * within the bounding box of the H3 cell.
 */
function buildOverpassQuery(
  vertices: ReturnType<typeof boundary>,
): string {
  const lats = vertices.map((v) => v.latitude);
  const lngs = vertices.map((v) => v.longitude);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west  = Math.min(...lngs);
  const east  = Math.max(...lngs);

  // bbox order for Overpass: south,west,north,east
  const bbox = `${south},${west},${north},${east}`;

  return `[out:json][timeout:10];
(
  node["natural"~"water|wood|bay|wetland"](${bbox});
  way["natural"~"water|wood|bay|wetland"](${bbox});
  node["landuse"~"forest|industrial|retail|farmland|meadow|farmyard"](${bbox});
  way["landuse"~"forest|industrial|retail|farmland|meadow|farmyard"](${bbox});
  node["waterway"](${bbox});
  way["waterway"](${bbox});
  node["leisure"](${bbox});
  node["historic"](${bbox});
  way["historic"](${bbox});
  node["tourism"~"attraction|viewpoint"](${bbox});
  node["amenity"~"townhall|marketplace"](${bbox});
);
out tags center;`;
}

// ---- Main export --------------------------------------------

/**
 * Return OSM biome context for an H3 res-8 cell.
 *
 * Steps:
 *   1. Check osm_context table — return if fresh (< 90 days old).
 *   2. Acquire global Redis fetch lock (SET NX EX 5).
 *      If locked → return fallback 'urban' WITHOUT caching.
 *   3. Fetch from Overpass API (POST, 15 s timeout).
 *   4. Classify biome + extract landmarks.
 *   5. UPSERT into osm_context.
 *   6. On fetch error → cache with back-dated fetched_at
 *      (retry in ~7 days) and return 'urban'.
 */
export async function getContext(h3Cell: string): Promise<OsmContextResult> {
  // --- 1. Cache lookup ----------------------------------------
  const cached = await queryOne<{
    biome: string;
    tags: Record<string, any>;
    landmarks: Array<{ name: string; lat: number; lng: number; osm_tags: Record<string, any> }>;
    fetched_at: Date;
  }>(
    `SELECT biome, tags, landmarks, fetched_at
     FROM osm_context
     WHERE h3_cell = $1`,
    [h3Cell],
  );

  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < CACHE_TTL_DAYS) {
      return {
        biome: cached.biome,
        tags: cached.tags,
        landmarks: cached.landmarks,
      };
    }
  }

  // --- 2. Global fetch lock (max 1 Overpass request at a time) -
  const lockAcquired = await redis.set(
    OSM_FETCH_LOCK_KEY,
    '1',
    'EX',
    LOCK_TTL_SECONDS,
    'NX',
  );

  if (lockAcquired === null) {
    // Another request is in flight — return urban without caching
    console.log(`[OSM] Fetch lock held, returning fallback for ${h3Cell}`);
    return { biome: 'urban', tags: {}, landmarks: [] };
  }

  // --- 3. Fetch from Overpass ---------------------------------
  try {
    const vertices = boundary(h3Cell);
    const overpassQuery = buildOverpassQuery(vertices);

    const response = await axios.post(OVERPASS_URL, overpassQuery, {
      headers: { 'Content-Type': 'text/plain' },
      timeout: OVERPASS_TIMEOUT_MS,
    });

    const elements: any[] = response.data?.elements ?? [];

    // --- 4. Classify -------------------------------------------
    const { biome, tagSummary, landmarks } = classifyBiome(elements);

    const tagsPayload = { counts: tagSummary };

    // --- 5. Upsert into osm_context ----------------------------
    await query(
      `INSERT INTO osm_context (h3_cell, biome, tags, landmarks, fetched_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (h3_cell) DO UPDATE
         SET biome      = EXCLUDED.biome,
             tags       = EXCLUDED.tags,
             landmarks  = EXCLUDED.landmarks,
             fetched_at = EXCLUDED.fetched_at`,
      [h3Cell, biome, JSON.stringify(tagsPayload), JSON.stringify(landmarks)],
    );

    return { biome, tags: tagsPayload, landmarks };
  } catch (err: any) {
    console.warn(`[OSM] Overpass fetch failed for ${h3Cell}: ${err.message}`);

    // --- 6. Cache error with shortened pseudo-TTL --------------
    // Back-date by ERROR_BACKDATE_DAYS so a retry happens in ~7 days.
    try {
      await query(
        `INSERT INTO osm_context (h3_cell, biome, tags, landmarks, fetched_at)
         VALUES ($1, 'urban', '{}', '[]', NOW() - INTERVAL '${ERROR_BACKDATE_DAYS} days')
         ON CONFLICT (h3_cell) DO UPDATE
           SET biome      = 'urban',
               tags       = '{}',
               landmarks  = '[]',
               fetched_at = NOW() - INTERVAL '${ERROR_BACKDATE_DAYS} days'`,
        [h3Cell],
      );
    } catch (dbErr: any) {
      console.error(`[OSM] Failed to cache error state for ${h3Cell}: ${dbErr.message}`);
    }

    return { biome: 'urban', tags: {}, landmarks: [] };
  }
}

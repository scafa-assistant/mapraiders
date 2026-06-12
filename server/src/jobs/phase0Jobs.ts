// ============================================================
// Phase 0 Jobs
// Two cron-callable async functions for H3 backfill and OSM
// pre-fetch. These functions are NOT registered here —
// registration happens in decayCron.ts by the main agent.
// ============================================================

import { queryMany, query } from '../config/database';
import { cellsForPolygon, cellForPoint } from '../services/h3Service';
import { getContext } from '../services/osmContextService';

// ---- Types --------------------------------------------------

interface TerritoryRow {
  id: string;
  geojson: string;
}

interface PlaceHistoryRow {
  lat: number;
  lng: number;
}

// ---- Constants ----------------------------------------------

const H3_BACKFILL_BATCH_SIZE = 200;
const OSM_PREFETCH_MAX_CELLS = 50;
const OSM_PREFETCH_DELAY_MS = 600;

// ---- Helpers ------------------------------------------------

/**
 * Parse a GeoJSON Polygon or MultiPolygon string and extract
 * the first ring as {latitude, longitude}[] for h3Service.
 */
function geoJsonToPoints(
  geojson: string,
): { latitude: number; longitude: number }[] {
  try {
    const parsed = JSON.parse(geojson) as { type: string; coordinates: any };
    let ring: number[][];

    if (parsed.type === 'Polygon') {
      ring = parsed.coordinates[0] as number[][];
    } else if (parsed.type === 'MultiPolygon') {
      // Use the first polygon's outer ring
      ring = parsed.coordinates[0][0] as number[][];
    } else {
      return [];
    }

    // GeoJSON coordinate order is [lng, lat]
    return ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  } catch {
    return [];
  }
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Job: H3 Backfill ---------------------------------------

/**
 * Fill h3_cells for all territories that currently have NULL.
 *
 * Runs in batches of H3_BACKFILL_BATCH_SIZE.
 * On per-territory error: sets h3_cells = '{}' (empty array)
 * and logs a warning — does NOT abort the rest of the batch.
 */
export async function runH3Backfill(): Promise<number> {
  console.log('[Phase0] H3 backfill started');

  let totalFilled = 0;
  let totalErrors = 0;

  // No OFFSET: processed rows drop out of the WHERE filter, so we always
  // take the next batch from the start until nothing is left.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await queryMany<TerritoryRow>(
      `SELECT id, ST_AsGeoJSON(polygon) AS geojson
       FROM territories
       WHERE h3_cells IS NULL
       ORDER BY id
       LIMIT $1`,
      [H3_BACKFILL_BATCH_SIZE],
    );

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      let cells: string[] = [];

      try {
        const points = geoJsonToPoints(row.geojson);
        if (points.length > 0) {
          cells = cellsForPolygon(points);
        } else {
          console.warn(`[Phase0] H3 backfill: territory ${row.id} has no parseable polygon`);
        }
      } catch (err: any) {
        console.warn(`[Phase0] H3 backfill: error for territory ${row.id}: ${err.message}`);
        totalErrors++;
        // Fall through: cells stays [] so we still write h3_cells = '{}'
      }

      await query(
        `UPDATE territories SET h3_cells = $1 WHERE id = $2`,
        [cells, row.id],
      );
      totalFilled++;
    }

    // If the batch was smaller than the page size, we're done
    if (rows.length < H3_BACKFILL_BATCH_SIZE) {
      break;
    }
  }

  console.log(
    `[Phase0] H3 backfill complete: ${totalFilled} territories processed, ${totalErrors} errors`,
  );
  return totalFilled;
}

// ---- Job: OSM Prefetch --------------------------------------

/**
 * Pre-fetch OSM context for H3 cells that had player activity
 * in the last 7 days (from place_history).
 *
 * Processes at most OSM_PREFETCH_MAX_CELLS cells per run,
 * with a OSM_PREFETCH_DELAY_MS pause between requests to stay
 * rate-limit-friendly.
 */
export async function runOsmPrefetch(): Promise<number> {
  console.log('[Phase0] OSM prefetch started');

  // Derive distinct H3 cells from recent player locations.
  // ST_Y = latitude, ST_X = longitude (PostGIS convention).
  const rows = await queryMany<PlaceHistoryRow>(
    `SELECT DISTINCT
       ST_Y(location) AS lat,
       ST_X(location) AS lng
     FROM place_history
     WHERE created_at >= NOW() - INTERVAL '7 days'
       AND location IS NOT NULL
     LIMIT $1`,
    // Over-fetch slightly so deduplication of H3 cells is effective
    [OSM_PREFETCH_MAX_CELLS * 4],
  );

  if (rows.length === 0) {
    console.log('[Phase0] OSM prefetch: no recent activity found');
    return 0;
  }

  // Deduplicate H3 cells (multiple place_history rows may map to same cell)
  const { cellForPoint } = await import('../services/h3Service');
  const seen = new Set<string>();
  const cells: string[] = [];

  for (const row of rows) {
    const cell = cellForPoint(row.lat, row.lng);
    if (!seen.has(cell)) {
      seen.add(cell);
      cells.push(cell);
      if (cells.length >= OSM_PREFETCH_MAX_CELLS) {
        break;
      }
    }
  }

  console.log(`[Phase0] OSM prefetch: fetching context for ${cells.length} cells`);

  let fetched = 0;
  let errors = 0;

  for (const cell of cells) {
    try {
      await getContext(cell);
      fetched++;
    } catch (err: any) {
      console.warn(`[Phase0] OSM prefetch error for cell ${cell}: ${err.message}`);
      errors++;
    }
    // Respectful rate-limiting: 600 ms between requests
    await sleep(OSM_PREFETCH_DELAY_MS);
  }

  console.log(
    `[Phase0] OSM prefetch complete: ${fetched} fetched, ${errors} errors`,
  );
  return fetched;
}

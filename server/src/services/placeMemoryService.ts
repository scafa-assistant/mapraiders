// ============================================================
// Place Memory Service (Stadtgedächtnis)
// Records geo-anchored events and provides place history /
// aggregate stats for the City Memory feature.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';

// ---- Types ---------------------------------------------------------------

export type PlaceEventType =
  | 'claim'
  | 'quest_complete'
  | 'echo_created'
  | 'echo_expired'
  | 'challenge_complete'
  | 'artifact_placed'
  | 'takeover';

export interface PlaceEvent {
  id: string;
  grid_cell: string;
  event_type: PlaceEventType;
  user_id: string | null;
  username: string | null;
  data: Record<string, unknown>;
  created_at: Date;
}

export interface PlaceStats {
  total_events: number;
  unique_visitors: number;
  total_claims: number;
  total_quests: number;
  total_echos: number;
  total_artifacts: number;
  most_active_user: string | null;
  busiest_hour: number | null;
}

// ---- Helpers -------------------------------------------------------------

/**
 * Convert lat/lng to a simple grid cell ID.
 * Rounds to 4 decimal places (~11m resolution).
 */
export function toGridCell(lat: number, lng: number): string {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}`;
}

/** Inline WKT point helper */
function pointToWkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

// ---- Service -------------------------------------------------------------

/**
 * Record a place event in the place_history table.
 *
 * @param lat       - Event latitude
 * @param lng       - Event longitude
 * @param eventType - Type of event
 * @param userId    - Acting user (nullable for system events)
 * @param username  - Display name snapshot
 * @param data      - Arbitrary JSON metadata
 */
export async function recordEvent(
  lat: number,
  lng: number,
  eventType: PlaceEventType,
  userId: string | null,
  username: string | null,
  data: Record<string, unknown> = {},
): Promise<void> {
  try {
    const gridCell = toGridCell(lat, lng);
    const locationWkt = pointToWkt(lat, lng);

    await query(
      `INSERT INTO place_history (location, grid_cell, event_type, user_id, username, data)
       VALUES (ST_GeomFromEWKT($1), $2, $3, $4, $5, $6)`,
      [locationWkt, gridCell, eventType, userId, username, JSON.stringify(data)],
    );
  } catch (err) {
    // Non-critical — never let place history recording break the caller
    console.error('[PlaceMemory] Failed to record event:', err);
  }
}

/**
 * Get recent place history within a radius.
 *
 * @param lat     - Center latitude
 * @param lng     - Center longitude
 * @param radiusM - Search radius in meters (default 50)
 * @param days    - Look-back window in days (default 30)
 * @param limit   - Max results (default 50)
 * @param offset  - Pagination offset (default 0)
 * @returns Array of place events, newest first
 */
export async function getPlaceHistory(
  lat: number,
  lng: number,
  radiusM: number = 50,
  days: number = 30,
  limit: number = 50,
  offset: number = 0,
): Promise<PlaceEvent[]> {
  const locationWkt = pointToWkt(lat, lng);

  const rows = await queryMany<PlaceEvent>(
    `SELECT id, grid_cell, event_type, user_id, username, data, created_at
     FROM place_history
     WHERE ST_DWithin(location::geography, ST_GeomFromEWKT($1)::geography, $2)
       AND created_at > NOW() - INTERVAL '1 day' * $3
     ORDER BY created_at DESC
     LIMIT $4 OFFSET $5`,
    [locationWkt, radiusM, days, limit, offset],
  );

  return rows;
}

/**
 * Get aggregate stats for a location.
 *
 * @param lat     - Center latitude
 * @param lng     - Center longitude
 * @param radiusM - Search radius in meters (default 100)
 * @returns Aggregate stats object
 */
export async function getPlaceStats(
  lat: number,
  lng: number,
  radiusM: number = 100,
): Promise<PlaceStats> {
  const locationWkt = pointToWkt(lat, lng);

  const base = await queryOne<{
    total_events: string;
    unique_visitors: string;
    total_claims: string;
    total_quests: string;
    total_echos: string;
    total_artifacts: string;
  }>(
    `SELECT
       COUNT(*)                                                    AS total_events,
       COUNT(DISTINCT user_id)                                     AS unique_visitors,
       COUNT(*) FILTER (WHERE event_type = 'claim')                AS total_claims,
       COUNT(*) FILTER (WHERE event_type = 'quest_complete')       AS total_quests,
       COUNT(*) FILTER (WHERE event_type = 'echo_created')         AS total_echos,
       COUNT(*) FILTER (WHERE event_type = 'artifact_placed')      AS total_artifacts
     FROM place_history
     WHERE ST_DWithin(location::geography, ST_GeomFromEWKT($1)::geography, $2)`,
    [locationWkt, radiusM],
  );

  // Most active user
  const topUser = await queryOne<{ username: string }>(
    `SELECT username
     FROM place_history
     WHERE ST_DWithin(location::geography, ST_GeomFromEWKT($1)::geography, $2)
       AND username IS NOT NULL
     GROUP BY username
     ORDER BY COUNT(*) DESC
     LIMIT 1`,
    [locationWkt, radiusM],
  );

  // Busiest hour
  const topHour = await queryOne<{ h: string }>(
    `SELECT EXTRACT(HOUR FROM created_at)::int AS h
     FROM place_history
     WHERE ST_DWithin(location::geography, ST_GeomFromEWKT($1)::geography, $2)
     GROUP BY h
     ORDER BY COUNT(*) DESC
     LIMIT 1`,
    [locationWkt, radiusM],
  );

  return {
    total_events: parseInt(base?.total_events || '0', 10),
    unique_visitors: parseInt(base?.unique_visitors || '0', 10),
    total_claims: parseInt(base?.total_claims || '0', 10),
    total_quests: parseInt(base?.total_quests || '0', 10),
    total_echos: parseInt(base?.total_echos || '0', 10),
    total_artifacts: parseInt(base?.total_artifacts || '0', 10),
    most_active_user: topUser?.username ?? null,
    busiest_hour: topHour ? parseInt(topHour.h, 10) : null,
  };
}

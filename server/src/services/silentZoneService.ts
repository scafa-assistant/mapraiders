// ============================================================
// Silent Zone Service
// Community-proposed quiet areas where echos are forbidden
// but special contemplative artifacts yield bonus XP (1.5x).
// ============================================================

import { query, queryOne, queryMany } from '../config/database';

/** Silent zone record from the database */
export interface SilentZone {
  id: string;
  name: string;
  description: string | null;
  polygon: any;
  created_by: string | null;
  approved: boolean;
  approval_votes: number;
  created_at: Date;
}

/** Votes required for auto-approval */
const APPROVAL_THRESHOLD = 20;

/**
 * Silent zone service handling the full lifecycle:
 * proposing, voting, approval, and spatial queries for
 * echo blocking and artifact bonus logic.
 */
export class SilentZoneService {
  /**
   * Check if a GPS point falls inside any approved silent zone.
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns True if the point is inside an approved silent zone
   */
  async isInSilentZone(lat: number, lng: number): Promise<boolean> {
    const locationWkt = `SRID=4326;POINT(${lng} ${lat})`;

    const result = await queryOne<{ inside: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM silent_zones
         WHERE approved = TRUE
         AND ST_Contains(polygon, ST_GeomFromEWKT($1))
       ) AS inside`,
      [locationWkt]
    );

    return result?.inside ?? false;
  }

  /**
   * Get silent zones near a GPS location.
   *
   * @param lat - Latitude of the search center
   * @param lng - Longitude of the search center
   * @param radiusM - Search radius in meters
   * @returns Array of nearby silent zones with polygon data
   */
  async getNearby(
    lat: number,
    lng: number,
    radiusM: number
  ): Promise<(SilentZone & { distance_m: number })[]> {
    const locationWkt = `SRID=4326;POINT(${lng} ${lat})`;
    const cappedRadius = Math.min(radiusM, 50000);

    const zones = await queryMany<SilentZone & { distance_m: string; polygon_geojson: string }>(
      `SELECT sz.id, sz.name, sz.description, sz.created_by,
              sz.approved, sz.approval_votes, sz.created_at,
              ST_AsGeoJSON(sz.polygon)::text AS polygon_geojson,
              ST_Distance(
                ST_Centroid(sz.polygon)::geography,
                ST_GeomFromEWKT($1)::geography
              ) AS distance_m
       FROM silent_zones sz
       WHERE sz.approved = TRUE
       AND ST_DWithin(
         sz.polygon::geography,
         ST_GeomFromEWKT($1)::geography,
         $2
       )
       ORDER BY distance_m ASC
       LIMIT 50`,
      [locationWkt, cappedRadius]
    );

    return zones.map((z) => ({
      ...z,
      polygon: JSON.parse(z.polygon_geojson),
      distance_m: parseFloat(z.distance_m || '0'),
    }));
  }

  /**
   * Get silent zones within a bounding box (for global map view).
   */
  async getInBounds(
    north: number,
    south: number,
    east: number,
    west: number
  ): Promise<SilentZone[]> {
    const zones = await queryMany<SilentZone & { polygon_geojson: string }>(
      `SELECT sz.id, sz.name, sz.description, sz.created_by,
              sz.approved, sz.approval_votes, sz.created_at,
              ST_AsGeoJSON(sz.polygon)::text AS polygon_geojson
       FROM silent_zones sz
       WHERE sz.approved = TRUE
       AND ST_Intersects(sz.polygon, ST_MakeEnvelope($1, $2, $3, $4, 4326))
       ORDER BY sz.created_at DESC
       LIMIT 200`,
      [west, south, east, north]
    );

    return zones.map((z) => ({
      ...z,
      polygon: JSON.parse(z.polygon_geojson),
    }));
  }

  /**
   * Propose a new silent zone. Requires level >= 20.
   *
   * @param userId - Proposer's user ID
   * @param name - Zone name (e.g., "Stadtpark")
   * @param description - Why this should be a silent zone
   * @param polygon - GeoJSON polygon coordinates [[lng, lat], ...]
   * @returns The created silent zone (not yet approved)
   */
  async propose(
    userId: string,
    name: string,
    description: string | undefined,
    polygon: number[][]
  ): Promise<SilentZone> {
    // Validate polygon: must have at least 4 points (closed ring)
    if (!polygon || polygon.length < 4) {
      throw new Error('Polygon must have at least 4 coordinate pairs (closed ring)');
    }

    // Build WKT polygon string
    const coordStr = polygon.map((p) => `${p[0]} ${p[1]}`).join(', ');
    const polygonWkt = `SRID=4326;POLYGON((${coordStr}))`;

    // Check for overlap with existing approved zones
    const overlap = await queryOne<{ id: string }>(
      `SELECT id FROM silent_zones
       WHERE approved = TRUE
       AND ST_Intersects(polygon, ST_GeomFromEWKT($1))
       LIMIT 1`,
      [polygonWkt]
    );

    if (overlap) {
      throw new Error('This area overlaps with an existing silent zone');
    }

    const zone = await queryOne<SilentZone>(
      `INSERT INTO silent_zones (name, description, polygon, created_by, approval_votes)
       VALUES ($1, $2, ST_GeomFromEWKT($3), $4, 1)
       RETURNING id, name, description, created_by, approved, approval_votes, created_at`,
      [name, description || null, polygonWkt, userId]
    );

    if (!zone) {
      throw new Error('Failed to create silent zone proposal');
    }

    // Log to feed
    try {
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('silent_zone_proposed', $1, $2)`,
        [userId, JSON.stringify({ zone_id: zone.id, name })]
      );
    } catch {
      // Non-critical
    }

    return zone;
  }

  /**
   * Vote to approve a silent zone. Each user can only vote once.
   * At APPROVAL_THRESHOLD votes (20), the zone is auto-approved.
   *
   * @param userId - Voter's user ID
   * @param zoneId - Zone to vote for
   * @returns Updated vote count and approval status
   */
  async vote(
    userId: string,
    zoneId: string
  ): Promise<{ approval_votes: number; approved: boolean }> {
    const zone = await queryOne<SilentZone>(
      'SELECT id, created_by, approved, approval_votes FROM silent_zones WHERE id = $1',
      [zoneId]
    );

    if (!zone) {
      throw new Error('Silent zone not found');
    }

    if (zone.approved) {
      return { approval_votes: zone.approval_votes, approved: true };
    }

    // Cannot vote for own zone proposal
    if (zone.created_by === userId) {
      throw new Error('Cannot vote for your own silent zone proposal');
    }

    // Check for duplicate vote (use feed_events as a vote log)
    const alreadyVoted = await queryOne(
      `SELECT id FROM feed_events
       WHERE type = 'silent_zone_vote' AND user_id = $1
       AND data->>'zone_id' = $2`,
      [userId, zoneId]
    );

    if (alreadyVoted) {
      throw new Error('Already voted for this silent zone');
    }

    const newVotes = zone.approval_votes + 1;
    const becomesApproved = newVotes >= APPROVAL_THRESHOLD;

    await query(
      `UPDATE silent_zones
       SET approval_votes = $1, approved = $2
       WHERE id = $3`,
      [newVotes, becomesApproved, zoneId]
    );

    // Log vote
    await query(
      `INSERT INTO feed_events (type, user_id, data)
       VALUES ('silent_zone_vote', $1, $2)`,
      [userId, JSON.stringify({ zone_id: zoneId })]
    );

    return {
      approval_votes: newVotes,
      approved: becomesApproved,
    };
  }

  /**
   * Get a single silent zone by ID with full polygon data.
   *
   * @param id - Zone UUID
   * @returns Silent zone details or null
   */
  async getById(id: string): Promise<(SilentZone & { creator_username?: string }) | null> {
    const zone = await queryOne<SilentZone & { polygon_geojson: string; creator_username: string }>(
      `SELECT sz.id, sz.name, sz.description, sz.created_by,
              sz.approved, sz.approval_votes, sz.created_at,
              ST_AsGeoJSON(sz.polygon)::text AS polygon_geojson,
              u.username AS creator_username
       FROM silent_zones sz
       LEFT JOIN users u ON sz.created_by = u.id
       WHERE sz.id = $1`,
      [id]
    );

    if (!zone) return null;

    return {
      ...zone,
      polygon: JSON.parse(zone.polygon_geojson),
    };
  }
}

// ---- Singleton instance and functional exports ----

const silentZoneServiceInstance = new SilentZoneService();

export async function isInSilentZone(lat: number, lng: number): Promise<boolean> {
  return silentZoneServiceInstance.isInSilentZone(lat, lng);
}

export async function getNearbySilentZones(
  lat: number,
  lng: number,
  radiusM: number
): Promise<(SilentZone & { distance_m: number })[]> {
  return silentZoneServiceInstance.getNearby(lat, lng, radiusM);
}

export async function getSilentZonesInBounds(
  north: number,
  south: number,
  east: number,
  west: number
): Promise<SilentZone[]> {
  return silentZoneServiceInstance.getInBounds(north, south, east, west);
}

export async function proposeSilentZone(
  userId: string,
  name: string,
  description: string | undefined,
  polygon: number[][]
): Promise<SilentZone> {
  return silentZoneServiceInstance.propose(userId, name, description, polygon);
}

export async function voteSilentZone(
  userId: string,
  zoneId: string
): Promise<{ approval_votes: number; approved: boolean }> {
  return silentZoneServiceInstance.vote(userId, zoneId);
}

export async function getSilentZoneById(
  id: string
): Promise<(SilentZone & { creator_username?: string }) | null> {
  return silentZoneServiceInstance.getById(id);
}

export const silentZoneService = silentZoneServiceInstance;

// ============================================================
// Artifact Service
// Creative content layer: create, discover, and vote on
// geo-anchored artifacts within owned territories.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';

/** Artifact data for creation */
export interface CreateArtifactData {
  name: string;
  description?: string;
  type?: string;
  rarity?: string;
  lat: number;
  lng: number;
  territory_id?: string;
  photo_url?: string;
}

/** Artifact record from the database */
export interface Artifact {
  id: string;
  creator_id: string;
  territory_id: string | null;
  name: string;
  description: string | null;
  type: string;
  rarity: string;
  lat: number;
  lng: number;
  photo_url: string | null;
  permanence_votes: number;
  is_permanent: boolean;
  created_at: Date;
  expires_at: Date;
}

/** Inline WKT point helper */
function pointToWkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/**
 * Artifact service handling the full artifact lifecycle:
 * creation, discovery, voting for permanence, and territory queries.
 */
export class ArtifactService {
  /**
   * Create an artifact at a location. The user must own the territory
   * at that point.
   *
   * @param userId - Creator's user ID
   * @param data - Artifact creation data
   * @returns The created artifact
   */
  async createArtifact(userId: string, data: CreateArtifactData): Promise<Artifact> {
    const locationWkt = pointToWkt(data.lat, data.lng);

    // Verify user owns territory at this location
    const territory = await queryOne<{ id: string }>(
      `SELECT id FROM territories
       WHERE owner_id = $1
       AND ST_Contains(polygon, ST_GeomFromEWKT($2))
       LIMIT 1`,
      [userId, locationWkt]
    );

    if (!territory) {
      throw new Error('You must own the territory at this location to place an artifact');
    }

    const artifact = await queryOne<Artifact>(
      `INSERT INTO artifacts (creator_id, territory_id, name, description, type, rarity, location, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromEWKT($7), $8)
       RETURNING id, creator_id, territory_id, name, description, type, rarity,
                ST_Y(location) as lat, ST_X(location) as lng,
                photo_url, permanence_votes, is_permanent, created_at, expires_at`,
      [
        userId,
        data.territory_id || territory.id,
        data.name,
        data.description || null,
        data.type || 'trophy',
        data.rarity || 'common',
        locationWkt,
        data.photo_url || null,
      ]
    );

    if (!artifact) {
      throw new Error('Failed to create artifact');
    }

    // Log to feed
    try {
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('artifact_created', $1, $2)`,
        [userId, JSON.stringify({
          artifact_id: artifact.id,
          name: artifact.name,
          type: artifact.type,
          rarity: artifact.rarity,
          lat: data.lat,
          lng: data.lng,
        })]
      );
    } catch (err) {
      console.error('[ArtifactService] Failed to log artifact creation:', err);
    }

    return artifact;
  }

  /**
   * Get artifacts near a GPS location using PostGIS proximity search.
   *
   * @param lat - Latitude of the search center
   * @param lng - Longitude of the search center
   * @param radiusM - Search radius in meters
   * @returns Array of nearby artifacts sorted by distance
   */
  async getNearby(lat: number, lng: number, radiusM: number): Promise<Artifact[]> {
    const locationWkt = pointToWkt(lat, lng);

    const artifacts = await queryMany<Artifact & { distance_m: number }>(
      `SELECT a.id, a.creator_id, a.territory_id, a.name, a.description,
              a.type, a.rarity, a.photo_url, a.permanence_votes, a.is_permanent,
              a.created_at, a.expires_at,
              u.username as creator_username,
              ST_Y(a.location) as lat, ST_X(a.location) as lng,
              ST_Distance(a.location::geography, ST_GeomFromEWKT($1)::geography) as distance_m
       FROM artifacts a
       LEFT JOIN users u ON a.creator_id = u.id
       WHERE (a.is_permanent = TRUE OR a.expires_at > NOW())
       AND ST_DWithin(a.location::geography, ST_GeomFromEWKT($1)::geography, $2)
       ORDER BY distance_m ASC
       LIMIT 100`,
      [locationWkt, radiusM]
    );

    return artifacts;
  }

  /**
   * Get a single artifact by ID.
   *
   * @param id - Artifact ID
   * @returns Artifact details or null
   */
  async getById(id: string): Promise<Artifact | null> {
    const artifact = await queryOne<Artifact>(
      `SELECT a.id, a.creator_id, a.territory_id, a.name, a.description,
              a.type, a.rarity, a.photo_url, a.permanence_votes, a.is_permanent,
              a.created_at, a.expires_at,
              u.username as creator_username,
              ST_Y(a.location) as lat, ST_X(a.location) as lng
       FROM artifacts a
       LEFT JOIN users u ON a.creator_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    return artifact;
  }

  /**
   * Vote to make an artifact permanent.
   * At 50 votes, the artifact becomes permanent (never expires).
   *
   * @param userId - Voter's user ID
   * @param artifactId - Artifact to vote for
   * @returns Updated vote count and permanence status
   */
  async votePermanence(
    userId: string,
    artifactId: string
  ): Promise<{ permanence_votes: number; is_permanent: boolean }> {
    // Check artifact exists and hasn't expired
    const artifact = await queryOne<Artifact>(
      `SELECT id, creator_id, permanence_votes, is_permanent, expires_at
       FROM artifacts WHERE id = $1`,
      [artifactId]
    );

    if (!artifact) {
      throw new Error('Artifact not found');
    }

    if (!artifact.is_permanent && new Date(artifact.expires_at) < new Date()) {
      throw new Error('Artifact has expired');
    }

    // Cannot vote for own artifact
    if (artifact.creator_id === userId) {
      throw new Error('Cannot vote for your own artifact');
    }

    // Check for duplicate vote (use feed_events as a simple vote log)
    const alreadyVoted = await queryOne(
      `SELECT id FROM feed_events
       WHERE type = 'artifact_vote' AND user_id = $1
       AND data->>'artifact_id' = $2`,
      [userId, artifactId]
    );

    if (alreadyVoted) {
      throw new Error('Already voted for this artifact');
    }

    // Increment votes
    const newVotes = artifact.permanence_votes + 1;
    const becomesPermanent = newVotes >= 50;

    await query(
      `UPDATE artifacts
       SET permanence_votes = $1,
           is_permanent = $2
       WHERE id = $3`,
      [newVotes, becomesPermanent, artifactId]
    );

    // Log vote to feed (also serves as duplicate prevention)
    await query(
      `INSERT INTO feed_events (type, user_id, data)
       VALUES ('artifact_vote', $1, $2)`,
      [userId, JSON.stringify({ artifact_id: artifactId })]
    );

    // If artifact just became permanent, log that too
    if (becomesPermanent && !artifact.is_permanent) {
      try {
        await query(
          `INSERT INTO feed_events (type, user_id, data)
           VALUES ('artifact_permanent', $1, $2)`,
          [artifact.creator_id, JSON.stringify({ artifact_id: artifactId, votes: newVotes })]
        );
      } catch (err) {
        console.error('[ArtifactService] Failed to log permanence event:', err);
      }
    }

    return {
      permanence_votes: newVotes,
      is_permanent: becomesPermanent || artifact.is_permanent,
    };
  }

  /**
   * Get all artifacts in a territory.
   *
   * @param territoryId - Territory ID
   * @returns Array of artifacts in the territory
   */
  async getByTerritory(territoryId: string): Promise<Artifact[]> {
    const artifacts = await queryMany<Artifact>(
      `SELECT a.id, a.creator_id, a.territory_id, a.name, a.description,
              a.type, a.rarity, a.photo_url, a.permanence_votes, a.is_permanent,
              a.created_at, a.expires_at,
              u.username as creator_username,
              ST_Y(a.location) as lat, ST_X(a.location) as lng
       FROM artifacts a
       LEFT JOIN users u ON a.creator_id = u.id
       WHERE a.territory_id = $1
       AND (a.is_permanent = TRUE OR a.expires_at > NOW())
       ORDER BY a.created_at DESC`,
      [territoryId]
    );

    return artifacts;
  }
}

// ---- Singleton instance and functional exports ----

const artifactServiceInstance = new ArtifactService();

export async function createArtifact(userId: string, data: CreateArtifactData): Promise<Artifact> {
  return artifactServiceInstance.createArtifact(userId, data);
}

export async function getNearbyArtifacts(lat: number, lng: number, radiusM: number): Promise<Artifact[]> {
  return artifactServiceInstance.getNearby(lat, lng, radiusM);
}

export async function getArtifactById(id: string): Promise<Artifact | null> {
  return artifactServiceInstance.getById(id);
}

export async function votePermanence(
  userId: string,
  artifactId: string
): Promise<{ permanence_votes: number; is_permanent: boolean }> {
  return artifactServiceInstance.votePermanence(userId, artifactId);
}

export async function getArtifactsByTerritory(territoryId: string): Promise<Artifact[]> {
  return artifactServiceInstance.getByTerritory(territoryId);
}

export const artifactService = artifactServiceInstance;

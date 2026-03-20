// ============================================================
// Race Engine
// Player-created GPS race tracks with leaderboards.
// Create tracks, start/complete attempts, verify route
// proximity, manage per-track records and leaderboards.
// ============================================================

import { query, queryOne, queryMany, transaction } from '../config/database';
import { XP } from '../config/constants';
import { MovementClass } from '../utils/types';
import { haversineDistance } from '../utils/geo';
import { ProgressionEngine } from './progressionEngine';
import { wsService } from './wsService';

// ---- Types ------------------------------------------------------------------

export interface RaceTrack {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
  distance_m: number;
  class: MovementClass;
  best_time_seconds: number | null;
  best_time_user_id: string | null;
  total_attempts: number;
  created_at: Date;
}

export interface RaceAttempt {
  id: string;
  track_id: string;
  user_id: string;
  time_seconds: number;
  is_record: boolean;
  created_at: Date;
}

/** GPS point from client for track creation and attempt verification. */
interface GpsInput {
  lat: number;
  lng: number;
}

// XP for race completion
const RACE_COMPLETE_XP = 100;
const RACE_RECORD_XP = 300;
const RACE_CREATE_XP = 150;

// Route proximity tolerance in meters
const ROUTE_PROXIMITY_TOLERANCE_M = 50;

// ---- Active attempts in-memory tracker ------------------------------------

/** Tracks users who have started a race (before completing). */
const activeAttempts: Map<string, { trackId: string; startedAt: number }> = new Map();

// ---- Race Engine ------------------------------------------------------------

class RaceEngine {
  private progression: ProgressionEngine;

  constructor() {
    this.progression = new ProgressionEngine();
  }

  // ---- Create Track -------------------------------------------------------

  /**
   * Create a new race track from a set of GPS points.
   *
   * @param userId      - Creator's user ID
   * @param name        - Track name
   * @param description - Optional description
   * @param points      - Array of GPS points defining the route
   * @param raceClass   - Movement class for the track (default: 'runner')
   * @returns The created race track
   */
  async createTrack(
    userId: string,
    name: string,
    description: string | undefined,
    points: GpsInput[],
    raceClass: MovementClass = 'runner'
  ): Promise<RaceTrack> {
    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error('Track name is required');
    }

    if (name.length > 100) {
      throw new Error('Track name must be 100 characters or fewer');
    }

    if (!points || points.length < 2) {
      throw new Error('At least 2 GPS points are required to create a track');
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += haversineDistance(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng
      );
    }

    if (totalDistance < 100) {
      throw new Error('Track must be at least 100 meters long');
    }

    // Build WKT for start, end, and route line
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const startWkt = `SRID=4326;POINT(${startPoint.lng} ${startPoint.lat})`;
    const endWkt = `SRID=4326;POINT(${endPoint.lng} ${endPoint.lat})`;

    const lineCoords = points.map((p) => `${p.lng} ${p.lat}`).join(', ');
    const lineWkt = `SRID=4326;LINESTRING(${lineCoords})`;

    const track = await queryOne<RaceTrack & {
      start_lat: number; start_lng: number;
      end_lat: number; end_lng: number;
    }>(
      `INSERT INTO race_tracks (creator_id, name, description, start_location, end_location, route_line, distance_m, class)
       VALUES ($1, $2, $3, ST_GeomFromEWKT($4), ST_GeomFromEWKT($5), ST_GeomFromEWKT($6), $7, $8)
       RETURNING id, creator_id, name, description, distance_m, class,
                 best_time_seconds, best_time_user_id, total_attempts, created_at,
                 ST_Y(start_location) AS start_lat, ST_X(start_location) AS start_lng,
                 ST_Y(end_location) AS end_lat, ST_X(end_location) AS end_lng`,
      [userId, name.trim(), description || null, startWkt, endWkt, lineWkt, totalDistance, raceClass]
    );

    if (!track) {
      throw new Error('Failed to create race track');
    }

    // Award XP for track creation
    try {
      await this.progression.awardChallengeXP(userId, 1);
    } catch (err) {
      console.error('[RaceEngine] Failed to award create XP:', err);
    }

    // Log feed event
    await query(
      `INSERT INTO feed_events (type, user_id, data)
       VALUES ('race_created', $1, $2)`,
      [userId, JSON.stringify({ track_id: track.id, name: track.name, distance_m: totalDistance })]
    );

    return {
      ...track,
      start_location: { lat: track.start_lat, lng: track.start_lng },
      end_location: { lat: track.end_lat, lng: track.end_lng },
    };
  }

  // ---- Start Attempt ------------------------------------------------------

  /**
   * Start a race attempt. Records the start time in memory.
   *
   * @param userId  - Runner's user ID
   * @param trackId - Track UUID
   * @returns Start timestamp
   */
  async startAttempt(
    userId: string,
    trackId: string
  ): Promise<{ started_at: number }> {
    // Verify the track exists
    const track = await queryOne<{ id: string }>(
      'SELECT id FROM race_tracks WHERE id = $1',
      [trackId]
    );

    if (!track) {
      throw new Error('Race track not found');
    }

    // Check if already running a race
    const existing = activeAttempts.get(userId);
    if (existing) {
      throw new Error('You already have an active race. Complete or abandon it first.');
    }

    const startedAt = Date.now();
    activeAttempts.set(userId, { trackId, startedAt });

    return { started_at: startedAt };
  }

  // ---- Complete Attempt ---------------------------------------------------

  /**
   * Complete a race attempt. Verifies route proximity to the track,
   * records the time, and checks for a new record.
   *
   * @param userId      - Runner's user ID
   * @param trackId     - Track UUID
   * @param points      - GPS points recorded during the race
   * @param timeSeconds - Time taken in seconds
   * @returns The attempt record with XP earned
   */
  async completeAttempt(
    userId: string,
    trackId: string,
    points: GpsInput[],
    timeSeconds: number
  ): Promise<RaceAttempt & { xp_earned: number; is_new_record: boolean }> {
    // Verify active attempt
    const active = activeAttempts.get(userId);
    if (!active || active.trackId !== trackId) {
      throw new Error('No active race for this track. Start a race first.');
    }

    // Remove from active attempts
    activeAttempts.delete(userId);

    // Validate inputs
    if (!points || points.length < 2) {
      throw new Error('GPS points are required to verify the race');
    }

    if (timeSeconds <= 0) {
      throw new Error('Time must be a positive number');
    }

    // Verify route proximity to the track
    const proximityOk = await this.verifyRouteProximity(trackId, points);
    if (!proximityOk) {
      throw new Error('Your route deviates too far from the track. Race attempt rejected.');
    }

    return transaction(async (client) => {
      // Check current best time
      const trackRow = await client.query(
        'SELECT best_time_seconds, total_attempts FROM race_tracks WHERE id = $1 FOR UPDATE',
        [trackId]
      );

      if (trackRow.rows.length === 0) {
        throw new Error('Race track not found');
      }

      const currentBest = trackRow.rows[0].best_time_seconds
        ? parseFloat(trackRow.rows[0].best_time_seconds)
        : null;
      const isNewRecord = currentBest === null || timeSeconds < currentBest;

      // Build route line from attempt points
      let routeLineWkt: string | null = null;
      if (points.length >= 2) {
        const lineCoords = points.map((p) => `${p.lng} ${p.lat}`).join(', ');
        routeLineWkt = `SRID=4326;LINESTRING(${lineCoords})`;
      }

      // Insert attempt
      const attemptResult = await client.query(
        `INSERT INTO race_attempts (track_id, user_id, time_seconds, route_line, is_record)
         VALUES ($1, $2, $3, ${routeLineWkt ? 'ST_GeomFromEWKT($4)' : 'NULL'}, $${routeLineWkt ? 5 : 4})
         RETURNING id, track_id, user_id, time_seconds, is_record, created_at`,
        routeLineWkt
          ? [trackId, userId, timeSeconds, routeLineWkt, isNewRecord]
          : [trackId, userId, timeSeconds, isNewRecord]
      );

      const attempt = attemptResult.rows[0];

      // Update track stats
      if (isNewRecord) {
        // Clear previous record flags
        await client.query(
          'UPDATE race_attempts SET is_record = FALSE WHERE track_id = $1 AND id != $2',
          [trackId, attempt.id]
        );

        // Update best time on the track
        await client.query(
          'UPDATE race_tracks SET best_time_seconds = $1, best_time_user_id = $2, total_attempts = total_attempts + 1 WHERE id = $3',
          [timeSeconds, userId, trackId]
        );
      } else {
        await client.query(
          'UPDATE race_tracks SET total_attempts = total_attempts + 1 WHERE id = $1',
          [trackId]
        );
      }

      // Award XP
      const xpEarned = isNewRecord ? RACE_RECORD_XP : RACE_COMPLETE_XP;
      await client.query(
        'UPDATE users SET xp = xp + $1, last_active = NOW() WHERE id = $2',
        [xpEarned, userId]
      );

      // Log feed event for new records
      if (isNewRecord) {
        await client.query(
          `INSERT INTO feed_events (type, user_id, data)
           VALUES ('race_record', $1, $2)`,
          [userId, JSON.stringify({ track_id: trackId, time_seconds: timeSeconds })]
        );

        // Get track name and username for WS broadcast
        const trackInfo = await client.query(
          'SELECT name FROM race_tracks WHERE id = $1',
          [trackId]
        );
        const userInfo = await client.query(
          'SELECT username FROM users WHERE id = $1',
          [userId]
        );

        const trackName = trackInfo.rows[0]?.name || 'Unknown Track';
        const username = userInfo.rows[0]?.username || 'Unknown';

        // Notify via WS (broadcast to nearby players)
        wsService.broadcastAll('race_record', {
          track_id: trackId,
          track_name: trackName,
          user_id: userId,
          username,
          time_seconds: timeSeconds,
        });
      }

      return {
        id: attempt.id,
        track_id: attempt.track_id,
        user_id: attempt.user_id,
        time_seconds: parseFloat(attempt.time_seconds),
        is_record: isNewRecord,
        created_at: attempt.created_at,
        xp_earned: xpEarned,
        is_new_record: isNewRecord,
      };
    });
  }

  // ---- Leaderboard --------------------------------------------------------

  /**
   * Get the per-track leaderboard (best times).
   *
   * @param trackId - Track UUID
   * @param limit   - Max results (default 20)
   * @returns Array of leaderboard entries
   */
  async getLeaderboard(
    trackId: string,
    limit: number = 20
  ): Promise<{ rank: number; user_id: string; username: string; time_seconds: number; created_at: Date }[]> {
    const entries = await queryMany<{
      user_id: string;
      username: string;
      time_seconds: string;
      created_at: Date;
    }>(
      `SELECT ra.user_id, u.username,
              MIN(ra.time_seconds) AS time_seconds,
              MIN(ra.created_at) AS created_at
       FROM race_attempts ra
       JOIN users u ON ra.user_id = u.id
       WHERE ra.track_id = $1
       GROUP BY ra.user_id, u.username
       ORDER BY time_seconds ASC
       LIMIT $2`,
      [trackId, limit]
    );

    return entries.map((e, i) => ({
      rank: i + 1,
      user_id: e.user_id,
      username: e.username,
      time_seconds: parseFloat(e.time_seconds),
      created_at: e.created_at,
    }));
  }

  // ---- Get Nearby Tracks --------------------------------------------------

  /**
   * Find race tracks near a location.
   *
   * @param lat     - Center latitude
   * @param lng     - Center longitude
   * @param radiusM - Search radius in meters (default 5000, max 50000)
   * @returns Array of nearby tracks with distance
   */
  async getNearbyTracks(
    lat: number,
    lng: number,
    radiusM: number = 5000
  ): Promise<(RaceTrack & { distance_from_m: number; creator_username: string })[]> {
    const cappedRadius = Math.min(radiusM, 50000);
    const locationWkt = `SRID=4326;POINT(${lng} ${lat})`;

    const tracks = await queryMany<
      RaceTrack & {
        creator_username: string;
        start_lat: number;
        start_lng: number;
        end_lat: number;
        end_lng: number;
        distance_from_m: string;
      }
    >(
      `SELECT rt.id, rt.creator_id, rt.name, rt.description,
              rt.distance_m, rt.class, rt.best_time_seconds, rt.best_time_user_id,
              rt.total_attempts, rt.created_at,
              u.username AS creator_username,
              ST_Y(rt.start_location) AS start_lat, ST_X(rt.start_location) AS start_lng,
              ST_Y(rt.end_location) AS end_lat, ST_X(rt.end_location) AS end_lng,
              ST_Distance(rt.start_location::geography, ST_GeomFromEWKT($1)::geography) AS distance_from_m
       FROM race_tracks rt
       LEFT JOIN users u ON rt.creator_id = u.id
       WHERE ST_DWithin(rt.start_location::geography, ST_GeomFromEWKT($1)::geography, $2)
       ORDER BY distance_from_m ASC
       LIMIT 50`,
      [locationWkt, cappedRadius]
    );

    return tracks.map((t) => ({
      ...t,
      start_location: { lat: t.start_lat, lng: t.start_lng },
      end_location: { lat: t.end_lat, lng: t.end_lng },
      distance_from_m: parseFloat(t.distance_from_m || '0'),
      best_time_seconds: t.best_time_seconds ? parseFloat(t.best_time_seconds as unknown as string) : null,
    }));
  }

  // ---- Get Track by ID ----------------------------------------------------

  /**
   * Get a single race track by ID with creator info.
   *
   * @param trackId - Track UUID
   * @returns Track details or null
   */
  async getTrack(trackId: string): Promise<(RaceTrack & { creator_username: string }) | null> {
    const track = await queryOne<
      RaceTrack & {
        creator_username: string;
        start_lat: number;
        start_lng: number;
        end_lat: number;
        end_lng: number;
      }
    >(
      `SELECT rt.id, rt.creator_id, rt.name, rt.description,
              rt.distance_m, rt.class, rt.best_time_seconds, rt.best_time_user_id,
              rt.total_attempts, rt.created_at,
              u.username AS creator_username,
              ST_Y(rt.start_location) AS start_lat, ST_X(rt.start_location) AS start_lng,
              ST_Y(rt.end_location) AS end_lat, ST_X(rt.end_location) AS end_lng
       FROM race_tracks rt
       LEFT JOIN users u ON rt.creator_id = u.id
       WHERE rt.id = $1`,
      [trackId]
    );

    if (!track) return null;

    return {
      ...track,
      start_location: { lat: track.start_lat, lng: track.start_lng },
      end_location: { lat: track.end_lat, lng: track.end_lng },
      best_time_seconds: track.best_time_seconds ? parseFloat(track.best_time_seconds as unknown as string) : null,
    };
  }

  // ---- Private Helpers ----------------------------------------------------

  /**
   * Verify that a set of GPS points stays reasonably close to a track.
   * Samples every Nth attempt point and checks its distance to the
   * nearest point on the track LineString using PostGIS.
   */
  private async verifyRouteProximity(
    trackId: string,
    points: GpsInput[]
  ): Promise<boolean> {
    // Sample up to 20 evenly-spaced points from the attempt
    const step = Math.max(1, Math.floor(points.length / 20));
    const samples: GpsInput[] = [];
    for (let i = 0; i < points.length; i += step) {
      samples.push(points[i]);
    }
    // Always include the last point
    if (samples[samples.length - 1] !== points[points.length - 1]) {
      samples.push(points[points.length - 1]);
    }

    // Check each sample point against the track route
    for (const pt of samples) {
      const ptWkt = `SRID=4326;POINT(${pt.lng} ${pt.lat})`;
      const result = await queryOne<{ dist: string }>(
        `SELECT ST_Distance(
           route_line::geography,
           ST_GeomFromEWKT($1)::geography
         ) AS dist
         FROM race_tracks
         WHERE id = $2`,
        [ptWkt, trackId]
      );

      if (!result) {
        return false;
      }

      const distMeters = parseFloat(result.dist);
      if (distMeters > ROUTE_PROXIMITY_TOLERANCE_M) {
        return false;
      }
    }

    return true;
  }
}

// ---- Singleton export -------------------------------------------------------

export const raceEngine = new RaceEngine();

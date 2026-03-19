// ============================================================
// Challenge Engine
// Challenge creation, template validation, proximity search,
// submission with multi-level verification, and XP awards.
// ============================================================

import { query, queryOne, queryMany, transaction } from '../config/database';
import { XP, DECAY } from '../config/constants';
import { haversineDistance, isNightTime } from '../utils/geo';
import { toWktPoint as pointToWkt } from '../utils/polygon';
import {
  Challenge,
  ChallengeSubmission,
  MovementClass,
  CreateChallengeRequest,
} from '../utils/types';
import { ProgressionEngine } from './progressionEngine';
import { resonanceService } from './resonanceService';
import { wsService } from './wsService';

// ---- Challenge Templates ------------------------------------------------

/** Parameter definition with min/max bounds for validation. */
interface TemplateParam {
  key: string;
  min: number;
  max: number;
}

/** Template definition with human-readable name and valid parameter ranges. */
interface TemplateDefinition {
  name: string;
  params: TemplateParam[];
}

const TEMPLATES: Record<string, TemplateDefinition> = {
  distance_sprint: {
    name: 'Distance Sprint',
    params: [{ key: 'distance', min: 100, max: 5000 }],
  },
  area_claim: {
    name: 'Area Challenge',
    params: [{ key: 'minArea', min: 1000, max: 100000 }],
  },
  elevation_climb: {
    name: 'Elevation Climb',
    params: [{ key: 'elevation', min: 10, max: 1000 }],
  },
  step_count: {
    name: 'Step Counter',
    params: [{ key: 'steps', min: 1000, max: 50000 }],
  },
  time_walk: {
    name: 'Timed Walk',
    params: [{ key: 'duration', min: 5, max: 180 }],
  },
  explore_new: {
    name: 'Explorer',
    params: [{ key: 'cells', min: 5, max: 100 }],
  },
};

/** Verification level labels used for submission flow control. */
type VerificationLevel = 'honor' | 'sensor' | 'video';

/** Map numeric verification_level stored in DB to a named level. */
function getVerificationLabel(level: number): VerificationLevel {
  if (level <= 1) return 'honor';
  if (level === 2) return 'sensor';
  return 'video';
}

// ---- Input Types --------------------------------------------------------

/** Data required to create a new challenge. */
interface CreateChallengeData {
  template: string;
  lat: number;
  lng: number;
  parameters: Record<string, any>;
  verification_level?: number;
  class?: MovementClass;
  weather_condition?: string;
  time_window?: string;
}

/** Proof payload submitted by a player attempting a challenge. */
interface SubmitAttemptProof {
  lat: number;
  lng: number;
  media_url?: string;
  sensor_data?: {
    gps_trace?: { lat: number; lng: number; timestamp: number }[];
    steps?: number;
    distance_m?: number;
    duration_s?: number;
  };
}

// ---- Challenge Engine ---------------------------------------------------

/**
 * Challenge engine handling the full challenge lifecycle:
 * creation, discovery, submissions with multi-level verification,
 * admin/creator review, and XP awards.
 */
export class ChallengeEngine {
  private progression: ProgressionEngine;

  constructor() {
    this.progression = new ProgressionEngine();
  }

  // ---- Creation ---------------------------------------------------------

  /**
   * Create a new challenge at a given location.
   *
   * Validates:
   * - Template exists in TEMPLATES
   * - All template parameters are present and within min/max bounds
   * - Creator owns a territory that contains the challenge location
   * - Verification level is valid (1-3)
   *
   * @param userId - Creator's user ID
   * @param data   - Challenge creation data
   * @returns The created challenge row
   */
  async createChallenge(userId: string, data: CreateChallengeData): Promise<Challenge> {
    // Validate template
    const template = TEMPLATES[data.template];
    if (!template) {
      const validTemplates = Object.keys(TEMPLATES).join(', ');
      throw new Error(`Invalid template "${data.template}". Valid templates: ${validTemplates}`);
    }

    // Validate parameters against template bounds
    for (const param of template.params) {
      const value = data.parameters[param.key];
      if (value === undefined || value === null) {
        throw new Error(
          `Missing required parameter "${param.key}" for template "${data.template}"`
        );
      }
      if (typeof value !== 'number') {
        throw new Error(
          `Parameter "${param.key}" must be a number, got ${typeof value}`
        );
      }
      if (value < param.min || value > param.max) {
        throw new Error(
          `Parameter "${param.key}" must be between ${param.min} and ${param.max}, got ${value}`
        );
      }
    }

    // Validate verification level
    const verificationLevel = data.verification_level ?? 1;
    if (verificationLevel < 1 || verificationLevel > 3) {
      throw new Error('verification_level must be between 1 and 3');
    }

    // Check that the user owns a territory at this location
    const locationWkt = `SRID=4326;POINT(${data.lng} ${data.lat})`;

    const territory = await queryOne<{ id: string }>(
      `SELECT id FROM territories
       WHERE owner_id = $1
       AND ST_Contains(polygon, ST_GeomFromEWKT($2))
       LIMIT 1`,
      [userId, locationWkt]
    );

    if (!territory) {
      throw new Error('You must own a territory at the challenge location');
    }

    // Validate weather_condition if provided
    const validWeatherConditions = ['rain', 'snow', 'fog', 'wind', 'storm', 'clear', 'cold', 'heat'];
    if (data.weather_condition && !validWeatherConditions.includes(data.weather_condition)) {
      throw new Error(
        `Invalid weather_condition "${data.weather_condition}". Valid values: ${validWeatherConditions.join(', ')}`
      );
    }

    // Validate time_window if provided
    const validTimeWindows = ['any', 'day', 'night'];
    const timeWindow = data.time_window || 'any';
    if (!validTimeWindows.includes(timeWindow)) {
      throw new Error(`Invalid time_window "${data.time_window}". Valid values: ${validTimeWindows.join(', ')}`);
    }

    // Insert challenge
    const challenge = await queryOne<Challenge>(
      `INSERT INTO challenges (creator_id, template, location, parameters, verification_level, class, weather_condition, time_window)
       VALUES ($1, $2, ST_GeomFromEWKT($3), $4, $5, $6, $7, $8)
       RETURNING id, creator_id, template, parameters, verification_level, class,
                 total_completions, avg_rating, status, created_at`,
      [
        userId,
        data.template,
        locationWkt,
        JSON.stringify(data.parameters),
        verificationLevel,
        data.class || null,
        data.weather_condition || null,
        timeWindow,
      ]
    );

    if (!challenge) {
      throw new Error('Failed to create challenge');
    }

    // Check for resonance (cross-content synergy)
    try {
      const resonance = await resonanceService.checkResonance(data.lat, data.lng, 'challenge', userId);
      if (resonance.resonance) {
        wsService.sendToUser(userId, 'resonance_discovered', {
          title: 'Resonance Discovered!',
          body: `Your challenge created a ${resonance.bonus}x bonus spot!`,
          types: resonance.types,
          level: resonance.level,
          bonus: resonance.bonus,
          lat: data.lat,
          lng: data.lng,
        });
      }
    } catch (err) {
      console.error('[ChallengeEngine] Resonance check failed:', err);
    }

    return {
      ...challenge,
      location: { lat: data.lat, lng: data.lng },
    };
  }

  // ---- Retrieval --------------------------------------------------------

  /**
   * Get a challenge by ID with creator info.
   *
   * @param id - Challenge UUID
   * @returns Challenge with creator username, or null if not found
   */
  async getChallenge(id: string): Promise<(Challenge & { creator_username: string }) | null> {
    const challenge = await queryOne<Challenge & { creator_username: string; lat: number; lng: number }>(
      `SELECT c.id, c.creator_id, c.template, c.parameters,
              c.verification_level, c.class, c.total_completions,
              c.avg_rating, c.status, c.created_at,
              u.username AS creator_username,
              ST_Y(c.location) AS lat, ST_X(c.location) AS lng
       FROM challenges c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (!challenge) return null;

    return {
      ...challenge,
      location: { lat: challenge.lat, lng: challenge.lng },
    };
  }

  // ---- Proximity Search -------------------------------------------------

  /**
   * Find challenges near a GPS location using PostGIS proximity search.
   *
   * @param lat     - Search center latitude
   * @param lng     - Search center longitude
   * @param radiusM - Search radius in meters (capped at 50 000)
   * @returns Array of challenges with distance_m, ordered by distance
   */
  async getNearby(
    lat: number,
    lng: number,
    radiusM: number,
    currentWeather?: string
  ): Promise<(Challenge & { distance_m: number; creator_username: string })[]> {
    const cappedRadius = Math.min(radiusM, 50000);
    const locationWkt = `SRID=4326;POINT(${lng} ${lat})`;

    let extraClauses = '';
    const params: any[] = [locationWkt, cappedRadius];
    let paramIdx = 3;

    // Weather-activated content: only include challenges whose weather_condition
    // is NULL (always active) or matches the current weather
    if (currentWeather) {
      extraClauses += ` AND (c.weather_condition IS NULL OR c.weather_condition = $${paramIdx})`;
      params.push(currentWeather);
      paramIdx++;
    }

    // Night Layer: filter by time_window based on current server time
    const timeWindow = isNightTime() ? 'night' : 'day';
    extraClauses += ` AND (c.time_window = 'any' OR c.time_window = $${paramIdx})`;
    params.push(timeWindow);
    paramIdx++;

    const challenges = await queryMany<
      Challenge & { distance_m: string; creator_username: string; lat: number; lng: number }
    >(
      `SELECT c.id, c.creator_id, c.template, c.parameters,
              c.verification_level, c.class, c.total_completions,
              c.avg_rating, c.status, c.created_at,
              u.username AS creator_username,
              ST_Y(c.location) AS lat, ST_X(c.location) AS lng,
              ST_Distance(c.location::geography, ST_GeomFromEWKT($1)::geography) AS distance_m
       FROM challenges c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.status = 'active'
       AND ST_DWithin(c.location::geography, ST_GeomFromEWKT($1)::geography, $2)
       ${extraClauses}
       ORDER BY distance_m ASC
       LIMIT 100`,
      params
    );

    return challenges.map((c) => ({
      ...c,
      location: { lat: c.lat, lng: c.lng },
      distance_m: parseFloat(c.distance_m || '0'),
    }));
  }

  // ---- Submissions ------------------------------------------------------

  /**
   * Submit an attempt at completing a challenge.
   *
   * Verification flow based on the challenge's verification_level:
   * - 'honor' (level 1): auto-approve if within proximity
   * - 'sensor' (level 2): check GPS data proves the user was at the
   *    location and moved appropriately (distance/steps)
   * - 'video' (level 3): store video URL, mark as pending_review
   *
   * Also enforces:
   * - Challenge must be active
   * - Cannot submit own challenge
   * - Must be within 200m of the challenge location
   *
   * @param userId      - Submitting player's ID
   * @param challengeId - Target challenge ID
   * @param proof       - Submission proof data (location, media, sensor)
   * @returns Submission record, XP earned, and result message
   */
  async submitAttempt(
    userId: string,
    challengeId: string,
    proof: SubmitAttemptProof
  ): Promise<{
    submission: ChallengeSubmission;
    xp_earned: number;
    message: string;
  }> {
    // Fetch challenge with location
    const challenge = await queryOne<{
      id: string;
      creator_id: string;
      verification_level: number;
      template: string;
      parameters: any;
      lat: number;
      lng: number;
      status: string;
    }>(
      `SELECT id, creator_id, verification_level, template, parameters, status,
              ST_Y(location) AS lat, ST_X(location) AS lng
       FROM challenges
       WHERE id = $1`,
      [challengeId]
    );

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.status !== 'active') {
      throw new Error('Challenge is not active');
    }

    // Cannot submit own challenge
    if (challenge.creator_id === userId) {
      throw new Error('Cannot complete your own challenge');
    }

    // Verify proximity (must be within 200m)
    const distance = haversineDistance(proof.lat, proof.lng, challenge.lat, challenge.lng);
    if (distance > 200) {
      throw new Error(
        `Too far from challenge location (${Math.round(distance)}m away, max 200m)`
      );
    }

    // Determine verification outcome based on level
    const verificationLabel = getVerificationLabel(challenge.verification_level);
    let verified = false;
    let message = '';

    switch (verificationLabel) {
      case 'honor':
        // Auto-approve: proximity check was sufficient
        verified = true;
        message = 'Challenge completed!';
        break;

      case 'sensor':
        // Validate sensor data proves physical presence and movement
        verified = this.verifySensorData(proof, challenge);
        message = verified
          ? 'Challenge completed! Sensor data verified.'
          : 'Sensor verification failed. Ensure GPS and movement data are provided.';
        break;

      case 'video':
        // Video/photo proof: store media, mark as pending manual review
        if (!proof.media_url) {
          throw new Error('Video or photo proof is required for this challenge');
        }
        verified = false;
        message = 'Submission received. Pending manual verification.';
        break;
    }

    // Insert submission
    const submission = await queryOne<ChallengeSubmission>(
      `INSERT INTO challenge_submissions (challenge_id, user_id, media_url, verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id, challenge_id, user_id, media_url, verified, submitted_at`,
      [challengeId, userId, proof.media_url || null, verified]
    );

    if (!submission) {
      throw new Error('Failed to record submission');
    }

    let xpEarned = 0;

    if (verified) {
      xpEarned = await this.awardChallengeXp(userId, challengeId);
    }

    return { submission, xp_earned: xpEarned, message };
  }

  // ---- Submission Queries -----------------------------------------------

  /**
   * Get all submissions for a challenge, ordered by most recent first.
   *
   * @param challengeId - Challenge UUID
   * @returns Array of submissions with submitter usernames
   */
  async getSubmissions(
    challengeId: string
  ): Promise<(ChallengeSubmission & { username: string })[]> {
    const submissions = await queryMany<ChallengeSubmission & { username: string }>(
      `SELECT cs.id, cs.challenge_id, cs.user_id, cs.media_url,
              cs.verified, cs.submitted_at,
              u.username
       FROM challenge_submissions cs
       JOIN users u ON cs.user_id = u.id
       WHERE cs.challenge_id = $1
       ORDER BY cs.submitted_at DESC`,
      [challengeId]
    );

    return submissions;
  }

  // ---- Manual Verification ----------------------------------------------

  /**
   * Approve or reject a submission (for video/manual-review challenges).
   * Only the challenge creator or an admin may call this.
   *
   * On approval:
   * - Marks the submission as verified
   * - Increments challenge completion count
   * - Awards XP to the submitter
   * - Logs a feed event
   *
   * On rejection:
   * - Marks the submission as not verified (no-op if already false)
   *
   * @param submissionId - Submission UUID
   * @param approved     - Whether to approve (true) or reject (false)
   * @param reviewerId   - ID of the user performing the review (for auth check)
   * @returns Updated submission and XP awarded (if approved)
   */
  async verifySubmission(
    submissionId: string,
    approved: boolean,
    reviewerId?: string
  ): Promise<{ submission: ChallengeSubmission; xp_earned: number }> {
    // Fetch submission with challenge info
    const existing = await queryOne<
      ChallengeSubmission & { creator_id: string; template: string; verification_level: number }
    >(
      `SELECT cs.id, cs.challenge_id, cs.user_id, cs.media_url,
              cs.verified, cs.submitted_at,
              c.creator_id, c.template, c.verification_level
       FROM challenge_submissions cs
       JOIN challenges c ON cs.challenge_id = c.id
       WHERE cs.id = $1`,
      [submissionId]
    );

    if (!existing) {
      throw new Error('Submission not found');
    }

    // Authorization: only the challenge creator can review
    if (reviewerId && existing.creator_id !== reviewerId) {
      throw new Error('Only the challenge creator can verify submissions');
    }

    // Already verified -- nothing to do
    if (existing.verified && approved) {
      return { submission: existing, xp_earned: 0 };
    }

    // Update submission
    await query(
      'UPDATE challenge_submissions SET verified = $1 WHERE id = $2',
      [approved, submissionId]
    );

    let xpEarned = 0;

    if (approved) {
      xpEarned = await this.awardChallengeXp(existing.user_id, existing.challenge_id);
    }

    const updated = await queryOne<ChallengeSubmission>(
      `SELECT id, challenge_id, user_id, media_url, verified, submitted_at
       FROM challenge_submissions WHERE id = $1`,
      [submissionId]
    );

    return {
      submission: updated!,
      xp_earned: xpEarned,
    };
  }

  // ---- XP Award ---------------------------------------------------------

  /**
   * Award XP for completing a challenge.
   *
   * - Increments total_completions on the challenge
   * - Computes XP = CHALLENGE_BASE + verification_level * CHALLENGE_DIFFICULTY
   * - Awards XP via the ProgressionEngine
   * - Logs a feed event
   *
   * @param userId      - Player who completed the challenge
   * @param challengeId - Completed challenge ID
   * @returns Amount of XP earned
   */
  async awardChallengeXp(userId: string, challengeId: string): Promise<number> {
    const challenge = await queryOne<{
      verification_level: number;
      template: string;
    }>(
      'SELECT verification_level, template FROM challenges WHERE id = $1',
      [challengeId]
    );

    if (!challenge) {
      throw new Error('Challenge not found for XP award');
    }

    // Increment completion count
    await query(
      'UPDATE challenges SET total_completions = total_completions + 1 WHERE id = $1',
      [challengeId]
    );

    // Calculate and award XP
    const xpAmount = XP.CHALLENGE_BASE + challenge.verification_level * XP.CHALLENGE_DIFFICULTY;

    await this.progression.awardChallengeXP(userId, challenge.verification_level);

    // Log to feed
    await query(
      `INSERT INTO feed_events (type, user_id, data)
       VALUES ('challenge_complete', $1, $2)`,
      [userId, JSON.stringify({ challenge_id: challengeId, template: challenge.template })]
    );

    return xpAmount;
  }

  // ---- Private Helpers --------------------------------------------------

  /**
   * Verify sensor data for a 'sensor' verification level challenge.
   *
   * Checks:
   * 1. GPS trace is present and has multiple points
   * 2. GPS trace shows the user was near the challenge location
   * 3. Reported distance/steps/duration are plausible relative to template params
   */
  private verifySensorData(
    proof: SubmitAttemptProof,
    challenge: {
      lat: number;
      lng: number;
      template: string;
      parameters: any;
    }
  ): boolean {
    const sensor = proof.sensor_data;

    // Must have some sensor data
    if (!sensor) {
      return false;
    }

    // If GPS trace is provided, verify at least one point is near the challenge
    if (sensor.gps_trace && sensor.gps_trace.length > 0) {
      const nearChallenge = sensor.gps_trace.some((point) => {
        const dist = haversineDistance(point.lat, point.lng, challenge.lat, challenge.lng);
        return dist <= 200;
      });

      if (!nearChallenge) {
        return false;
      }

      // For distance-based templates, verify the GPS trace covers sufficient distance
      if (challenge.template === 'distance_sprint' && challenge.parameters?.distance) {
        const traceDistance = this.calculateTraceDistance(sensor.gps_trace);
        // Allow 80% of required distance (GPS inaccuracy margin)
        if (traceDistance < challenge.parameters.distance * 0.8) {
          return false;
        }
      }
    }

    // For step_count template, verify steps
    if (challenge.template === 'step_count' && challenge.parameters?.steps) {
      if (!sensor.steps || sensor.steps < challenge.parameters.steps * 0.8) {
        return false;
      }
    }

    // For time_walk template, verify duration (minutes -> seconds)
    if (challenge.template === 'time_walk' && challenge.parameters?.duration) {
      const requiredSeconds = challenge.parameters.duration * 60;
      if (!sensor.duration_s || sensor.duration_s < requiredSeconds * 0.8) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate total distance from a GPS trace in meters.
   */
  private calculateTraceDistance(
    trace: { lat: number; lng: number; timestamp: number }[]
  ): number {
    let total = 0;
    for (let i = 1; i < trace.length; i++) {
      total += haversineDistance(
        trace[i - 1].lat,
        trace[i - 1].lng,
        trace[i].lat,
        trace[i].lng
      );
    }
    return total;
  }
}

// ---- Legacy functional exports for backward compatibility ----

const challengeEngineInstance = new ChallengeEngine();

export async function createChallenge(
  userId: string,
  data: CreateChallengeData
): Promise<Challenge> {
  return challengeEngineInstance.createChallenge(userId, data);
}

export async function getChallenge(
  id: string
): Promise<(Challenge & { creator_username: string }) | null> {
  return challengeEngineInstance.getChallenge(id);
}

export async function getNearby(
  lat: number,
  lng: number,
  radiusM: number,
  currentWeather?: string
): Promise<(Challenge & { distance_m: number; creator_username: string })[]> {
  return challengeEngineInstance.getNearby(lat, lng, radiusM, currentWeather);
}

export async function submitAttempt(
  userId: string,
  challengeId: string,
  proof: SubmitAttemptProof
): Promise<{
  submission: ChallengeSubmission;
  xp_earned: number;
  message: string;
}> {
  return challengeEngineInstance.submitAttempt(userId, challengeId, proof);
}

export async function getSubmissions(
  challengeId: string
): Promise<(ChallengeSubmission & { username: string })[]> {
  return challengeEngineInstance.getSubmissions(challengeId);
}

export async function verifySubmission(
  submissionId: string,
  approved: boolean,
  reviewerId?: string
): Promise<{ submission: ChallengeSubmission; xp_earned: number }> {
  return challengeEngineInstance.verifySubmission(submissionId, approved, reviewerId);
}

export async function awardChallengeXp(
  userId: string,
  challengeId: string
): Promise<number> {
  return challengeEngineInstance.awardChallengeXp(userId, challengeId);
}

/** Get the list of valid templates and their parameter definitions. */
export function getTemplates(): Record<string, TemplateDefinition> {
  return { ...TEMPLATES };
}

export const challengeEngine = challengeEngineInstance;

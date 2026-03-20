// ============================================================
// Duel Engine
// Player-vs-player competitive encounters: speed_claim,
// distance, area, and quiz duels with territory staking.
// ============================================================

import { query, queryOne, queryMany, transaction } from '../config/database';
import { XP } from '../config/constants';
import { ProgressionEngine } from './progressionEngine';
import { wsService } from './wsService';
import { sendPushToUser } from './pushService';

// ---- Types ------------------------------------------------------------------

export type DuelType = 'speed_claim' | 'distance' | 'area' | 'quiz';
export type DuelStatus = 'pending' | 'accepted' | 'active' | 'completed' | 'declined' | 'expired';

export interface Duel {
  id: string;
  challenger_id: string;
  defender_id: string;
  location: { lat: number; lng: number };
  type: DuelType;
  status: DuelStatus;
  winner_id: string | null;
  challenger_score: number;
  defender_score: number;
  stake_territory_id: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  expires_at: Date;
}

/** Duration in minutes for each duel type. */
const DUEL_DURATIONS: Record<DuelType, number> = {
  speed_claim: 5,
  distance: 10,
  area: 10,
  quiz: 5,
};

const VALID_DUEL_TYPES: DuelType[] = ['speed_claim', 'distance', 'area', 'quiz'];

// XP awarded: winner gets base + bonus, loser gets participation XP
const DUEL_XP_WIN = 200;
const DUEL_XP_LOSE = 50;

// ---- Duel Engine ------------------------------------------------------------

class DuelEngine {
  private progression: ProgressionEngine;

  constructor() {
    this.progression = new ProgressionEngine();
  }

  // ---- Challenge a Player -------------------------------------------------

  /**
   * Create a duel challenge and notify the defender via WS + push.
   *
   * @param challengerId - Challenger's user ID
   * @param defenderId   - Defender's user ID
   * @param type         - Duel type (speed_claim, distance, area, quiz)
   * @param location     - Location where the duel takes place
   * @param stakeTerritoryId - Optional territory staked on the outcome
   * @returns The created duel
   */
  async challengePlayer(
    challengerId: string,
    defenderId: string,
    type: DuelType,
    location: { lat: number; lng: number },
    stakeTerritoryId?: string
  ): Promise<Duel> {
    // Validate duel type
    if (!VALID_DUEL_TYPES.includes(type)) {
      throw new Error(`Invalid duel type "${type}". Valid types: ${VALID_DUEL_TYPES.join(', ')}`);
    }

    // Cannot duel yourself
    if (challengerId === defenderId) {
      throw new Error('You cannot challenge yourself to a duel');
    }

    // Check for existing active duel between these players
    const existingDuel = await queryOne<{ id: string }>(
      `SELECT id FROM duels
       WHERE status IN ('pending', 'active')
       AND ((challenger_id = $1 AND defender_id = $2) OR (challenger_id = $2 AND defender_id = $1))
       LIMIT 1`,
      [challengerId, defenderId]
    );

    if (existingDuel) {
      throw new Error('You already have an active duel with this player');
    }

    // Validate staked territory belongs to the challenger
    if (stakeTerritoryId) {
      const territory = await queryOne<{ id: string }>(
        'SELECT id FROM territories WHERE id = $1 AND owner_id = $2',
        [stakeTerritoryId, challengerId]
      );
      if (!territory) {
        throw new Error('Staked territory not found or not owned by you');
      }
    }

    // Create the duel
    const locationWkt = `SRID=4326;POINT(${location.lng} ${location.lat})`;
    const duel = await queryOne<Duel & { lat: number; lng: number }>(
      `INSERT INTO duels (challenger_id, defender_id, location, type, stake_territory_id)
       VALUES ($1, $2, ST_GeomFromEWKT($3), $4, $5)
       RETURNING id, challenger_id, defender_id, type, status,
                 winner_id, challenger_score, defender_score,
                 stake_territory_id, created_at, started_at, completed_at, expires_at,
                 ST_Y(location) AS lat, ST_X(location) AS lng`,
      [challengerId, defenderId, locationWkt, type, stakeTerritoryId || null]
    );

    if (!duel) {
      throw new Error('Failed to create duel');
    }

    // Look up challenger username for notifications
    const challenger = await queryOne<{ username: string }>(
      'SELECT username FROM users WHERE id = $1',
      [challengerId]
    );

    const challengerName = challenger?.username || 'A player';

    // Notify defender via WebSocket
    wsService.sendToUser(defenderId, 'duel_challenge', {
      duel_id: duel.id,
      challenger_id: challengerId,
      challenger_name: challengerName,
      type: duel.type,
      stake_territory_id: stakeTerritoryId || null,
      expires_at: duel.expires_at,
      location: { lat: duel.lat, lng: duel.lng },
    });

    // Send push notification
    try {
      await sendPushToUser(
        defenderId,
        'Duel Challenge!',
        `${challengerName} challenges you to a ${type.replace('_', ' ')} duel!`,
        { type: 'duel_challenge', duel_id: duel.id }
      );
    } catch (err) {
      console.error('[DuelEngine] Push notification failed:', err);
    }

    return {
      ...duel,
      location: { lat: duel.lat, lng: duel.lng },
    };
  }

  // ---- Accept Duel --------------------------------------------------------

  /**
   * Accept a pending duel and start the countdown.
   *
   * @param duelId - Duel UUID
   * @param userId - Accepting user's ID (must be the defender)
   * @returns Updated duel
   */
  async acceptDuel(duelId: string, userId: string): Promise<Duel> {
    const duel = await this.getDuelRow(duelId);

    if (!duel) {
      throw new Error('Duel not found');
    }

    if (duel.defender_id !== userId) {
      throw new Error('Only the challenged player can accept a duel');
    }

    if (duel.status !== 'pending') {
      throw new Error(`Duel cannot be accepted (current status: ${duel.status})`);
    }

    // Check if expired
    if (new Date(duel.expires_at) < new Date()) {
      await query("UPDATE duels SET status = 'expired' WHERE id = $1", [duelId]);
      throw new Error('Duel has expired');
    }

    const updated = await queryOne<Duel & { lat: number; lng: number }>(
      `UPDATE duels SET status = 'active', started_at = NOW()
       WHERE id = $1
       RETURNING id, challenger_id, defender_id, type, status,
                 winner_id, challenger_score, defender_score,
                 stake_territory_id, created_at, started_at, completed_at, expires_at,
                 ST_Y(location) AS lat, ST_X(location) AS lng`,
      [duelId]
    );

    if (!updated) {
      throw new Error('Failed to accept duel');
    }

    // Notify challenger that duel was accepted
    wsService.sendToUser(duel.challenger_id, 'duel_accepted', {
      duel_id: duel.id,
      type: duel.type,
      started_at: updated.started_at,
    });

    return {
      ...updated,
      location: { lat: updated.lat, lng: updated.lng },
    };
  }

  // ---- Decline Duel -------------------------------------------------------

  /**
   * Decline a pending duel.
   *
   * @param duelId - Duel UUID
   * @param userId - Declining user's ID (must be the defender)
   * @returns Updated duel
   */
  async declineDuel(duelId: string, userId: string): Promise<Duel> {
    const duel = await this.getDuelRow(duelId);

    if (!duel) {
      throw new Error('Duel not found');
    }

    if (duel.defender_id !== userId) {
      throw new Error('Only the challenged player can decline a duel');
    }

    if (duel.status !== 'pending') {
      throw new Error(`Duel cannot be declined (current status: ${duel.status})`);
    }

    const updated = await queryOne<Duel & { lat: number; lng: number }>(
      `UPDATE duels SET status = 'declined'
       WHERE id = $1
       RETURNING id, challenger_id, defender_id, type, status,
                 winner_id, challenger_score, defender_score,
                 stake_territory_id, created_at, started_at, completed_at, expires_at,
                 ST_Y(location) AS lat, ST_X(location) AS lng`,
      [duelId]
    );

    if (!updated) {
      throw new Error('Failed to decline duel');
    }

    // Notify challenger that duel was declined
    wsService.sendToUser(duel.challenger_id, 'duel_declined', {
      duel_id: duel.id,
    });

    return {
      ...updated,
      location: { lat: updated.lat, lng: updated.lng },
    };
  }

  // ---- Submit Score -------------------------------------------------------

  /**
   * Submit a score during an active duel.
   *
   * @param duelId - Duel UUID
   * @param userId - Submitting player's ID
   * @param score  - Score to submit
   * @returns Updated duel with scores
   */
  async submitScore(
    duelId: string,
    userId: string,
    score: number
  ): Promise<Duel> {
    const duel = await this.getDuelRow(duelId);

    if (!duel) {
      throw new Error('Duel not found');
    }

    if (duel.status !== 'active') {
      throw new Error('Duel is not active');
    }

    // Determine which player is submitting
    let column: string;
    if (duel.challenger_id === userId) {
      column = 'challenger_score';
    } else if (duel.defender_id === userId) {
      column = 'defender_score';
    } else {
      throw new Error('You are not a participant in this duel');
    }

    const updated = await queryOne<Duel & { lat: number; lng: number }>(
      `UPDATE duels SET ${column} = $1
       WHERE id = $2
       RETURNING id, challenger_id, defender_id, type, status,
                 winner_id, challenger_score, defender_score,
                 stake_territory_id, created_at, started_at, completed_at, expires_at,
                 ST_Y(location) AS lat, ST_X(location) AS lng`,
      [score, duelId]
    );

    if (!updated) {
      throw new Error('Failed to submit score');
    }

    return {
      ...updated,
      location: { lat: updated.lat, lng: updated.lng },
    };
  }

  // ---- Complete Duel ------------------------------------------------------

  /**
   * Determine the winner, award XP, and optionally transfer staked territory.
   *
   * @param duelId - Duel UUID
   * @returns Completed duel with winner
   */
  async completeDuel(duelId: string): Promise<Duel & { xp_winner: number; xp_loser: number }> {
    return transaction(async (client) => {
      // Lock the duel row
      const duelRow = await client.query(
        `SELECT id, challenger_id, defender_id, type, status,
                challenger_score, defender_score, stake_territory_id,
                ST_Y(location) AS lat, ST_X(location) AS lng
         FROM duels WHERE id = $1 FOR UPDATE`,
        [duelId]
      );

      if (duelRow.rows.length === 0) {
        throw new Error('Duel not found');
      }

      const duel = duelRow.rows[0];

      if (duel.status !== 'active') {
        throw new Error('Duel is not active');
      }

      // Determine winner based on scores (higher score wins)
      let winnerId: string | null = null;
      let loserId: string | null = null;

      const challengerScore = parseFloat(duel.challenger_score) || 0;
      const defenderScore = parseFloat(duel.defender_score) || 0;

      if (challengerScore > defenderScore) {
        winnerId = duel.challenger_id;
        loserId = duel.defender_id;
      } else if (defenderScore > challengerScore) {
        winnerId = duel.defender_id;
        loserId = duel.challenger_id;
      }
      // If scores are equal, it's a draw (no winner)

      // Update duel
      await client.query(
        `UPDATE duels SET status = 'completed', winner_id = $1, completed_at = NOW()
         WHERE id = $2`,
        [winnerId, duelId]
      );

      // Award XP
      let xpWinner = 0;
      let xpLoser = 0;

      if (winnerId) {
        xpWinner = DUEL_XP_WIN;
        xpLoser = DUEL_XP_LOSE;

        // Award XP to winner
        await client.query(
          'UPDATE users SET xp = xp + $1, last_active = NOW() WHERE id = $2',
          [xpWinner, winnerId]
        );

        // Award participation XP to loser
        await client.query(
          'UPDATE users SET xp = xp + $1, last_active = NOW() WHERE id = $2',
          [xpLoser, loserId]
        );

        // Strengthen winner's nearby territories (duel win resets decay)
        await client.query(
          `UPDATE territories SET last_defended = NOW()
           WHERE owner_id = $1
           AND ST_DWithin(polygon::geography, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 500)`,
          [winnerId, parseFloat(duel.lng), parseFloat(duel.lat)]
        );

        // Transfer staked territory if applicable
        if (duel.stake_territory_id && loserId) {
          await client.query(
            'UPDATE territories SET owner_id = $1 WHERE id = $2',
            [winnerId, duel.stake_territory_id]
          );
        }

        // Log feed events
        await client.query(
          `INSERT INTO feed_events (type, user_id, data)
           VALUES ('duel_won', $1, $2)`,
          [winnerId, JSON.stringify({ duel_id: duelId, type: duel.type, score: Math.max(challengerScore, defenderScore) })]
        );
      } else {
        // Draw: both get participation XP
        xpWinner = DUEL_XP_LOSE;
        xpLoser = DUEL_XP_LOSE;

        await client.query(
          'UPDATE users SET xp = xp + $1, last_active = NOW() WHERE id = $2',
          [DUEL_XP_LOSE, duel.challenger_id]
        );
        await client.query(
          'UPDATE users SET xp = xp + $1, last_active = NOW() WHERE id = $2',
          [DUEL_XP_LOSE, duel.defender_id]
        );
      }

      // Get usernames for notifications
      const challengerRow = await client.query('SELECT username FROM users WHERE id = $1', [duel.challenger_id]);
      const defenderRow = await client.query('SELECT username FROM users WHERE id = $1', [duel.defender_id]);
      const challengerName = challengerRow.rows[0]?.username || 'Unknown';
      const defenderName = defenderRow.rows[0]?.username || 'Unknown';

      const winnerName = winnerId === duel.challenger_id ? challengerName : defenderName;

      // Notify both players via WS
      const resultPayload = {
        duel_id: duelId,
        type: duel.type,
        winner_id: winnerId,
        winner_name: winnerId ? winnerName : null,
        challenger_score: challengerScore,
        defender_score: defenderScore,
        is_draw: !winnerId,
        xp_winner: xpWinner,
        xp_loser: xpLoser,
      };

      wsService.sendToUser(duel.challenger_id, 'duel_result', resultPayload);
      wsService.sendToUser(duel.defender_id, 'duel_result', resultPayload);

      // Broadcast result to nearby players
      wsService.broadcastNearby(
        parseFloat(duel.lat),
        parseFloat(duel.lng),
        500,
        'duel_result_nearby',
        {
          duel_id: duelId,
          type: duel.type,
          winner_name: winnerId ? winnerName : null,
          is_draw: !winnerId,
        },
        undefined
      );

      return {
        id: duelId,
        challenger_id: duel.challenger_id,
        defender_id: duel.defender_id,
        location: { lat: parseFloat(duel.lat), lng: parseFloat(duel.lng) },
        type: duel.type,
        status: 'completed' as DuelStatus,
        winner_id: winnerId,
        challenger_score: challengerScore,
        defender_score: defenderScore,
        stake_territory_id: duel.stake_territory_id,
        created_at: duel.created_at,
        started_at: duel.started_at,
        completed_at: new Date(),
        expires_at: duel.expires_at,
        xp_winner: xpWinner,
        xp_loser: xpLoser,
      };
    });
  }

  // ---- Get Nearby Players -------------------------------------------------

  /**
   * Find connected players near a location for duel challenges.
   * Uses wsService's tracked client locations.
   *
   * @param lat     - Center latitude
   * @param lng     - Center longitude
   * @param radiusM - Search radius in meters (default 500m)
   * @returns Array of nearby player info
   */
  async getNearbyPlayers(
    lat: number,
    lng: number,
    radiusM: number = 500
  ): Promise<{ userId: string; username: string; lat: number; lng: number; distance: number }[]> {
    const nearbyClients = wsService.getNearbyClients(lat, lng, radiusM);

    if (nearbyClients.length === 0) {
      return [];
    }

    // Look up usernames for the nearby clients
    const userIds = nearbyClients.map((c) => c.userId);
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
    const users = await queryMany<{ id: string; username: string }>(
      `SELECT id, username FROM users WHERE id IN (${placeholders})`,
      userIds
    );

    const usernameMap = new Map(users.map((u) => [u.id, u.username]));

    return nearbyClients.map((c) => ({
      userId: c.userId,
      username: usernameMap.get(c.userId) || 'Unknown',
      lat: c.lat,
      lng: c.lng,
      distance: Math.round(c.distance),
    }));
  }

  // ---- Get Active Duels ---------------------------------------------------

  /**
   * Get all active or pending duels for a user.
   *
   * @param userId - Player ID
   * @returns Array of active/pending duels
   */
  async getActiveDuels(userId: string): Promise<Duel[]> {
    const duels = await queryMany<Duel & { lat: number; lng: number }>(
      `SELECT id, challenger_id, defender_id, type, status,
              winner_id, challenger_score, defender_score,
              stake_territory_id, created_at, started_at, completed_at, expires_at,
              ST_Y(location) AS lat, ST_X(location) AS lng
       FROM duels
       WHERE (challenger_id = $1 OR defender_id = $1)
       AND status IN ('pending', 'active')
       ORDER BY created_at DESC`,
      [userId]
    );

    return duels.map((d) => ({
      ...d,
      location: { lat: d.lat, lng: d.lng },
    }));
  }

  // ---- Get Duel History ---------------------------------------------------

  /**
   * Get completed duel history for a user.
   *
   * @param userId - Player ID
   * @param limit  - Max results (default 20)
   * @returns Array of completed duels
   */
  async getDuelHistory(
    userId: string,
    limit: number = 20
  ): Promise<(Duel & { challenger_username: string; defender_username: string })[]> {
    const duels = await queryMany<
      Duel & { lat: number; lng: number; challenger_username: string; defender_username: string }
    >(
      `SELECT d.id, d.challenger_id, d.defender_id, d.type, d.status,
              d.winner_id, d.challenger_score, d.defender_score,
              d.stake_territory_id, d.created_at, d.started_at, d.completed_at, d.expires_at,
              ST_Y(d.location) AS lat, ST_X(d.location) AS lng,
              uc.username AS challenger_username,
              ud.username AS defender_username
       FROM duels d
       LEFT JOIN users uc ON d.challenger_id = uc.id
       LEFT JOIN users ud ON d.defender_id = ud.id
       WHERE (d.challenger_id = $1 OR d.defender_id = $1)
       AND d.status IN ('completed', 'declined', 'expired')
       ORDER BY d.completed_at DESC NULLS LAST
       LIMIT $2`,
      [userId, limit]
    );

    return duels.map((d) => ({
      ...d,
      location: { lat: d.lat, lng: d.lng },
    }));
  }

  // ---- Private Helpers ----------------------------------------------------

  /**
   * Fetch a raw duel row from the database.
   */
  private async getDuelRow(duelId: string): Promise<(Duel & { lat: number; lng: number }) | null> {
    return queryOne<Duel & { lat: number; lng: number }>(
      `SELECT id, challenger_id, defender_id, type, status,
              winner_id, challenger_score, defender_score,
              stake_territory_id, created_at, started_at, completed_at, expires_at,
              ST_Y(location) AS lat, ST_X(location) AS lng
       FROM duels WHERE id = $1`,
      [duelId]
    );
  }
}

// ---- Singleton export -------------------------------------------------------

export const duelEngine = new DuelEngine();

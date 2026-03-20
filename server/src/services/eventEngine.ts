// ============================================================
// Event Engine
// Eclipse, King of the Hill, Blitz Claims, Loot Drops,
// Mystery Zones, Wave Attacks — engagement drivers from
// the Kreuzanalyse.
// ============================================================

import { query, queryOne, queryMany, transaction } from '../config/database';
import { wsService } from './wsService';
import { awardXp } from './progressionEngine';

// ---- Types ------------------------------------------------------------------

export interface GameEvent {
  id: string;
  type: string;
  name: string;
  description: string | null;
  location: any;
  radius_m: number | null;
  status: string;
  config: Record<string, any>;
  participants: string[];
  winner_id: string | null;
  winner_clan_id: string | null;
  starts_at: Date;
  ends_at: Date;
  created_at: Date;
}

export interface LootDrop {
  id: string;
  location: any;
  type: string;
  value: Record<string, any>;
  collected_by: string | null;
  spawned_at: Date;
  expires_at: Date;
}

// ============================================================
// Event Engine
// ============================================================

class EventEngine {
  // ------------------------------------------------------------------
  // ECLIPSE (monthly, 6 hours)
  // All territory decay_level set to 0.5, traps deactivated, 2x XP
  // ------------------------------------------------------------------

  /**
   * Start a global Eclipse event.
   * - Weakens all territory decay to 0.5 (50%)
   * - Deactivates all traps
   * - Bonus 2x XP stored in event config for claim engine to read
   */
  async startEclipse(): Promise<GameEvent> {
    const now = new Date();
    const endsAt = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours

    return transaction(async (client) => {
      // Create the event
      const result = await client.query(
        `INSERT INTO game_events (type, name, description, status, config, starts_at, ends_at)
         VALUES ('eclipse', 'Eclipse', 'All territories weakened. Traps deactivated. Double XP for 6 hours!',
                 'active', $1, $2, $3)
         RETURNING *`,
        [JSON.stringify({ xp_multiplier: 2.0 }), now, endsAt],
      );
      const event = result.rows[0];

      // Weaken all owned territories
      await client.query(
        `UPDATE territories SET decay_level = GREATEST(decay_level, 0.5)
         WHERE owner_id IS NOT NULL`,
      );

      // Deactivate all traps
      await client.query(
        `UPDATE traps SET is_active = FALSE WHERE is_active = TRUE`,
      );

      // Broadcast to everyone
      wsService.broadcastAll('event_started', {
        id: event.id,
        type: 'eclipse',
        name: 'Eclipse',
        description: event.description,
        ends_at: endsAt.toISOString(),
        config: { xp_multiplier: 2.0 },
      });

      console.log(`[EventEngine] Eclipse started, ends at ${endsAt.toISOString()}`);
      return event;
    });
  }

  /**
   * End an active Eclipse event and restore normal state.
   */
  async endEclipse(eventId: string): Promise<void> {
    await query(
      `UPDATE game_events SET status = 'completed' WHERE id = $1`,
      [eventId],
    );

    // Traps remain deactivated (they expired naturally or were re-set)
    // Territory decay returns to normal via the daily decay cron

    wsService.broadcastAll('event_ended', {
      id: eventId,
      type: 'eclipse',
      name: 'Eclipse',
      message: 'The Eclipse has ended. Territories are recovering.',
    });

    console.log(`[EventEngine] Eclipse ${eventId} ended`);
  }

  // ------------------------------------------------------------------
  // KING OF THE HILL (daily, 1 hour)
  // Random location; players claim around it; most area at end wins
  // ------------------------------------------------------------------

  /**
   * Start a King of the Hill event at the given location.
   * Players compete for the most territory within the radius.
   */
  async startKingOfHill(lat: number, lng: number): Promise<GameEvent> {
    const now = new Date();
    const endsAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    const radiusM = 500;

    const result = await query(
      `INSERT INTO game_events (type, name, description, location, radius_m, status, config, starts_at, ends_at)
       VALUES ('king_of_hill', 'King of the Hill', 'Claim the most territory in the zone to win!',
               ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, 'active',
               $4, $5, $6)
       RETURNING *`,
      [lng, lat, radiusM, JSON.stringify({ bonus_xp: 1000 }), now, endsAt],
    );
    const event = result.rows[0];

    // Notify nearby players (5km radius)
    wsService.broadcastNearby(lat, lng, 5000, 'event_started', {
      id: event.id,
      type: 'king_of_hill',
      name: 'King of the Hill',
      description: event.description,
      lat,
      lng,
      radius_m: radiusM,
      ends_at: endsAt.toISOString(),
    });

    console.log(`[EventEngine] King of the Hill started at ${lat},${lng}`);
    return event;
  }

  /**
   * End a King of the Hill event and determine the winner.
   * Winner = player with the most territory area within the event radius.
   */
  async endKingOfHill(eventId: string): Promise<void> {
    const event = await queryOne<GameEvent>(
      'SELECT * FROM game_events WHERE id = $1',
      [eventId],
    );

    if (!event) return;

    // Find the player with the most territory area inside the event radius
    const winner = await queryOne<{ owner_id: string; total_area: number }>(
      `SELECT t.owner_id, SUM(ST_Area(ST_Intersection(t.polygon::geography,
          ST_Buffer(e.location::geography, e.radius_m)))) AS total_area
       FROM territories t, game_events e
       WHERE e.id = $1
         AND t.owner_id IS NOT NULL
         AND t.claimed_at >= e.starts_at
         AND ST_DWithin(t.polygon::geography, e.location::geography, e.radius_m)
       GROUP BY t.owner_id
       ORDER BY total_area DESC
       LIMIT 1`,
      [eventId],
    );

    await query(
      `UPDATE game_events SET status = 'completed', winner_id = $2 WHERE id = $1`,
      [eventId, winner?.owner_id ?? null],
    );

    // Award bonus XP to winner
    if (winner?.owner_id) {
      const bonusXp = event.config?.bonus_xp ?? 1000;
      await awardXp(winner.owner_id, bonusXp, 'event_king_of_hill');
    }

    wsService.broadcastAll('event_ended', {
      id: eventId,
      type: 'king_of_hill',
      name: 'King of the Hill',
      winner_id: winner?.owner_id ?? null,
      total_area: winner?.total_area ?? 0,
    });

    console.log(`[EventEngine] King of the Hill ${eventId} ended, winner: ${winner?.owner_id ?? 'none'}`);
  }

  // ------------------------------------------------------------------
  // BLITZ CLAIMS (random, 10 min)
  // 10x XP for claims in a small area for 10 minutes
  // ------------------------------------------------------------------

  /**
   * Start a Blitz Claims event — 10x XP inside a small radius for 10 minutes.
   */
  async startBlitz(lat: number, lng: number, radiusM: number = 300): Promise<GameEvent> {
    const now = new Date();
    const endsAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const result = await query(
      `INSERT INTO game_events (type, name, description, location, radius_m, status, config, starts_at, ends_at)
       VALUES ('blitz', 'Blitz Claims', '10x XP for claims in this area!',
               ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, 'active',
               $4, $5, $6)
       RETURNING *`,
      [lng, lat, radiusM, JSON.stringify({ xp_multiplier: 10.0 }), now, endsAt],
    );
    const event = result.rows[0];

    wsService.broadcastNearby(lat, lng, 5000, 'event_started', {
      id: event.id,
      type: 'blitz',
      name: 'Blitz Claims',
      description: '10x XP for claims in this area!',
      lat,
      lng,
      radius_m: radiusM,
      ends_at: endsAt.toISOString(),
      config: { xp_multiplier: 10.0 },
    });

    console.log(`[EventEngine] Blitz started at ${lat},${lng} r=${radiusM}m`);
    return event;
  }

  // ------------------------------------------------------------------
  // LOOT DROPS
  // ------------------------------------------------------------------

  /**
   * Spawn a loot drop at a specific location.
   */
  async spawnLootDrop(
    lat: number,
    lng: number,
    type: string = 'xp',
    value: Record<string, any> = { xp: 500 },
  ): Promise<LootDrop> {
    const result = await queryOne<LootDrop>(
      `INSERT INTO loot_drops (location, type, value)
       VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, $4)
       RETURNING *`,
      [lng, lat, type, JSON.stringify(value)],
    );

    if (result) {
      wsService.broadcastNearby(lat, lng, 1000, 'loot_spawned', {
        id: result.id,
        lat,
        lng,
        type,
      });
    }

    return result!;
  }

  /**
   * Collect a loot drop. Awards value to the collecting user.
   * Returns the loot value or null if already collected / expired.
   */
  async collectLoot(lootId: string, userId: string): Promise<Record<string, any> | null> {
    return transaction(async (client) => {
      // Lock and verify the loot is available
      const loot = await client.query(
        `SELECT id, type, value FROM loot_drops
         WHERE id = $1 AND collected_by IS NULL AND expires_at > NOW()
         FOR UPDATE`,
        [lootId],
      );

      if (loot.rows.length === 0) return null;

      const drop = loot.rows[0];

      // Mark as collected
      await client.query(
        'UPDATE loot_drops SET collected_by = $1 WHERE id = $2',
        [userId, lootId],
      );

      // Award the value
      const value = typeof drop.value === 'string' ? JSON.parse(drop.value) : drop.value;

      if (value.xp) {
        await awardXp(userId, value.xp, 'loot_drop');
      }

      // TODO: handle 'title', 'artifact', 'streak_freeze' types

      return value;
    });
  }

  /**
   * Get uncollected, non-expired loot drops within a radius of a point.
   */
  async getNearbyLoot(lat: number, lng: number, radiusM: number = 500): Promise<any[]> {
    const drops = await queryMany(
      `SELECT id, type, value,
              ST_Y(location::geometry) AS lat,
              ST_X(location::geometry) AS lng,
              spawned_at, expires_at
       FROM loot_drops
       WHERE collected_by IS NULL
         AND expires_at > NOW()
         AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
       ORDER BY spawned_at DESC
       LIMIT 50`,
      [lng, lat, radiusM],
    );

    return drops.map((d) => ({
      id: d.id,
      type: d.type,
      value: d.value,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lng),
      spawned_at: d.spawned_at,
      expires_at: d.expires_at,
    }));
  }

  // ------------------------------------------------------------------
  // MYSTERY ZONES
  // Area with hidden content, only visible when you enter
  // ------------------------------------------------------------------

  /**
   * Create a Mystery Zone event — hidden rewards revealed on entry.
   */
  async createMysteryZone(lat: number, lng: number, radiusM: number = 200): Promise<GameEvent> {
    const now = new Date();
    const endsAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours

    const result = await query(
      `INSERT INTO game_events (type, name, description, location, radius_m, status, config, starts_at, ends_at)
       VALUES ('mystery_zone', 'Mystery Zone', 'Enter the zone to discover hidden rewards!',
               ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, 'active',
               $4, $5, $6)
       RETURNING *`,
      [
        lng, lat, radiusM,
        JSON.stringify({
          xp_multiplier: 3.0,
          hidden_loot: ['xp', 'title', 'streak_freeze'],
        }),
        now, endsAt,
      ],
    );

    // Mystery zones are NOT broadcast — players discover them by entering
    console.log(`[EventEngine] Mystery Zone created at ${lat},${lng}`);
    return result.rows[0];
  }

  // ------------------------------------------------------------------
  // WAVE ATTACK (clan event)
  // Clan-coordinated territory attack on a target district
  // ------------------------------------------------------------------

  /**
   * Start a Wave Attack — a clan-coordinated assault on a district.
   * All clan members get 1.5x XP for claims in the target area.
   */
  async startWaveAttack(clanId: string, targetDistrict: string): Promise<GameEvent> {
    const now = new Date();
    const endsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const result = await query(
      `INSERT INTO game_events (type, name, description, status, config, starts_at, ends_at)
       VALUES ('wave_attack', 'Wave Attack', $1,
               'active', $2, $3, $4)
       RETURNING *`,
      [
        `Clan assault on ${targetDistrict}!`,
        JSON.stringify({
          clan_id: clanId,
          target_district: targetDistrict,
          xp_multiplier: 1.5,
        }),
        now, endsAt,
      ],
    );
    const event = result.rows[0];

    // Notify clan members
    wsService.broadcastToClan(clanId, 'event_started', {
      id: event.id,
      type: 'wave_attack',
      name: 'Wave Attack',
      description: event.description,
      target_district: targetDistrict,
      ends_at: endsAt.toISOString(),
    });

    console.log(`[EventEngine] Wave Attack by clan ${clanId} on ${targetDistrict}`);
    return event;
  }

  // ------------------------------------------------------------------
  // General queries
  // ------------------------------------------------------------------

  /**
   * Get all active events, optionally filtered by proximity.
   * Global events (no location) are always returned.
   */
  async getActiveEvents(lat?: number, lng?: number): Promise<any[]> {
    let sql: string;
    let params: any[];

    if (lat != null && lng != null) {
      sql = `SELECT id, type, name, description, radius_m, status, config, participants,
                    winner_id, winner_clan_id, starts_at, ends_at, created_at,
                    ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
             FROM game_events
             WHERE status = 'active'
               AND (location IS NULL
                    OR ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 10000))
             ORDER BY starts_at DESC`;
      params = [lng, lat];
    } else {
      sql = `SELECT id, type, name, description, radius_m, status, config, participants,
                    winner_id, winner_clan_id, starts_at, ends_at, created_at,
                    ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
             FROM game_events
             WHERE status = 'active'
             ORDER BY starts_at DESC`;
      params = [];
    }

    const events = await queryMany(sql, params);
    return events.map((e) => ({
      ...e,
      lat: e.lat ? parseFloat(e.lat) : null,
      lng: e.lng ? parseFloat(e.lng) : null,
    }));
  }

  /**
   * Get a single event by ID.
   */
  async getEventById(id: string): Promise<any | null> {
    const event = await queryOne(
      `SELECT id, type, name, description, radius_m, status, config, participants,
              winner_id, winner_clan_id, starts_at, ends_at, created_at,
              ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
       FROM game_events WHERE id = $1`,
      [id],
    );

    if (!event) return null;

    return {
      ...event,
      lat: event.lat ? parseFloat(event.lat) : null,
      lng: event.lng ? parseFloat(event.lng) : null,
    };
  }

  /**
   * Join an event — add the user to the participants array.
   */
  async joinEvent(eventId: string, userId: string): Promise<void> {
    await query(
      `UPDATE game_events
       SET participants = array_append(participants, $2::uuid)
       WHERE id = $1
         AND status = 'active'
         AND NOT ($2::uuid = ANY(participants))`,
      [eventId, userId],
    );
  }

  // ------------------------------------------------------------------
  // Event Lifecycle Helpers
  // ------------------------------------------------------------------

  /**
   * Activate scheduled events whose start time has passed.
   */
  async activateScheduledEvents(): Promise<number> {
    const result = await query(
      `UPDATE game_events SET status = 'active'
       WHERE status = 'scheduled' AND starts_at <= NOW()
       RETURNING id, type, name`,
    );

    for (const event of result.rows) {
      wsService.broadcastAll('event_started', {
        id: event.id,
        type: event.type,
        name: event.name,
      });
    }

    return result.rowCount ?? 0;
  }

  /**
   * Complete events whose end time has passed.
   * Handles end-of-event logic for each type.
   */
  async completeExpiredEvents(): Promise<number> {
    const expired = await queryMany<{ id: string; type: string }>(
      `SELECT id, type FROM game_events
       WHERE status = 'active' AND ends_at <= NOW()`,
    );

    for (const event of expired) {
      try {
        switch (event.type) {
          case 'eclipse':
            await this.endEclipse(event.id);
            break;
          case 'king_of_hill':
            await this.endKingOfHill(event.id);
            break;
          default:
            // Generic completion for blitz, mystery_zone, wave_attack
            await query(
              `UPDATE game_events SET status = 'completed' WHERE id = $1`,
              [event.id],
            );
            wsService.broadcastAll('event_ended', {
              id: event.id,
              type: event.type,
            });
            break;
        }
      } catch (err) {
        console.error(`[EventEngine] Failed to complete event ${event.id}:`, err);
      }
    }

    return expired.length;
  }

  /**
   * Clean up expired loot drops.
   */
  async cleanupExpiredLoot(): Promise<number> {
    const result = await query(
      `DELETE FROM loot_drops WHERE expires_at < NOW() AND collected_by IS NULL RETURNING id`,
    );
    return result.rowCount ?? 0;
  }

  /**
   * Check if there is currently an active Eclipse event.
   * Used by the claim engine to apply 2x XP.
   */
  async getActiveEclipse(): Promise<GameEvent | null> {
    return queryOne<GameEvent>(
      `SELECT * FROM game_events
       WHERE type = 'eclipse' AND status = 'active'
       LIMIT 1`,
    );
  }

  /**
   * Check if a location falls within an active Blitz zone.
   * Returns the XP multiplier or 1.0 if not in a blitz zone.
   */
  async getBlitzMultiplier(lat: number, lng: number): Promise<number> {
    const blitz = await queryOne<{ config: any }>(
      `SELECT config FROM game_events
       WHERE type = 'blitz' AND status = 'active'
         AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, radius_m)
       LIMIT 1`,
      [lng, lat],
    );

    if (!blitz) return 1.0;
    const config = typeof blitz.config === 'string' ? JSON.parse(blitz.config) : blitz.config;
    return config.xp_multiplier ?? 1.0;
  }
}

// ---- Singleton export ----
export const eventEngine = new EventEngine();

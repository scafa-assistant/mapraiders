// ============================================================
// Trap Service
// Defensive mechanisms placed within owned territories.
// Types: slow (reduce claim value), alert (notify owner),
//        decoy (fake territory boundary).
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { sendNotification } from './notificationService';
import { wsService } from './wsService';
import { UNLOCK_LEVELS } from '../config/constants';

/** Trap record from the database */
export interface Trap {
  id: string;
  owner_id: string;
  territory_id: string;
  type: 'slow' | 'alert' | 'decoy';
  lat: number;
  lng: number;
  radius_m: number;
  is_active: boolean;
  triggered_by: string | null;
  triggered_at: Date | null;
  created_at: Date;
  expires_at: Date;
}

/** Result of trap checks during a claim attempt */
export interface TrapCheckResult {
  triggered: Trap[];
  slowMultiplier: number;
  alertsSent: number;
}

/** Valid trap types */
const VALID_TRAP_TYPES = ['slow', 'alert', 'decoy'] as const;

/** Maximum traps per territory */
const MAX_TRAPS_PER_TERRITORY = 3;

/** Inline WKT point helper */
function pointToWkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/**
 * Trap service handling defensive territory mechanics:
 * placement, triggering on enemy entry, and effect execution.
 */
export class TrapService {
  /**
   * Place a trap in a territory the user owns.
   * Maximum 3 traps per territory.
   *
   * @param userId - Player placing the trap
   * @param territoryId - Territory to trap
   * @param type - Trap type: 'slow', 'alert', or 'decoy'
   * @param lat - Trap latitude
   * @param lng - Trap longitude
   * @returns The created trap
   */
  async placeTrap(
    userId: string,
    territoryId: string,
    type: string,
    lat: number,
    lng: number
  ): Promise<Trap> {
    // Validate trap type
    if (!VALID_TRAP_TYPES.includes(type as any)) {
      throw new Error(`Invalid trap type. Must be one of: ${VALID_TRAP_TYPES.join(', ')}`);
    }

    // Level gate: trap placement requires Architect level (31+)
    const user = await queryOne<{ level: number }>('SELECT level FROM users WHERE id = $1', [userId]);
    if (!user || user.level < UNLOCK_LEVELS.architect) {
      throw new Error(`Trap placement requires Architect level (${UNLOCK_LEVELS.architect}+)`);
    }

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates');
    }

    // Verify user owns the territory
    const territory = await queryOne<{ id: string; owner_id: string }>(
      'SELECT id, owner_id FROM territories WHERE id = $1',
      [territoryId]
    );

    if (!territory) {
      throw new Error('Territory not found');
    }

    if (territory.owner_id !== userId) {
      throw new Error('You can only place traps in your own territories');
    }

    // Verify the trap location is within the territory
    const locationWkt = pointToWkt(lat, lng);
    const withinTerritory = await queryOne<{ inside: boolean }>(
      `SELECT ST_Contains(polygon, ST_GeomFromEWKT($1)) as inside
       FROM territories WHERE id = $2`,
      [locationWkt, territoryId]
    );

    if (!withinTerritory?.inside) {
      throw new Error('Trap location must be within the territory boundaries');
    }

    // Check trap limit per territory
    const trapCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM traps
       WHERE territory_id = $1 AND is_active = TRUE AND expires_at > NOW()`,
      [territoryId]
    );

    if (parseInt(trapCount?.count || '0', 10) >= MAX_TRAPS_PER_TERRITORY) {
      throw new Error(`Maximum ${MAX_TRAPS_PER_TERRITORY} active traps per territory`);
    }

    // Create the trap
    const trap = await queryOne<Trap>(
      `INSERT INTO traps (owner_id, territory_id, type, location)
       VALUES ($1, $2, $3, ST_GeomFromEWKT($4))
       RETURNING id, owner_id, territory_id, type,
                 ST_Y(location) as lat, ST_X(location) as lng,
                 radius_m, is_active, triggered_by, triggered_at,
                 created_at, expires_at`,
      [userId, territoryId, type, locationWkt]
    );

    if (!trap) {
      throw new Error('Failed to create trap');
    }

    return trap;
  }

  /**
   * Check for traps at a location. Called when someone enters a territory
   * to claim it. Returns all triggered traps and their combined effects.
   *
   * @param lat - Claim attempt latitude
   * @param lng - Claim attempt longitude
   * @param userId - Player attempting the claim (traps don't trigger for owner)
   * @returns Triggered traps and their combined effects
   */
  async checkTraps(lat: number, lng: number, userId: string): Promise<TrapCheckResult> {
    const locationWkt = pointToWkt(lat, lng);

    // Find active traps within range of this location
    // Exclude traps owned by the claiming user
    const traps = await queryMany<Trap>(
      `SELECT id, owner_id, territory_id, type,
              ST_Y(location) as lat, ST_X(location) as lng,
              radius_m, is_active, triggered_by, triggered_at,
              created_at, expires_at
       FROM traps
       WHERE is_active = TRUE
       AND expires_at > NOW()
       AND owner_id != $1
       AND ST_DWithin(
         location::geography,
         ST_GeomFromEWKT($2)::geography,
         radius_m
       )
       ORDER BY created_at ASC`,
      [userId, locationWkt]
    );

    if (traps.length === 0) {
      return { triggered: [], slowMultiplier: 1.0, alertsSent: 0 };
    }

    let slowMultiplier = 1.0;
    let alertsSent = 0;
    const triggered: Trap[] = [];

    for (const trap of traps) {
      try {
        const effect = await this.triggerTrap(trap.id, userId);
        triggered.push({ ...trap, triggered_by: userId, triggered_at: new Date() });

        if (trap.type === 'slow') {
          slowMultiplier *= 0.5; // Each slow trap halves claim value
        }

        if (trap.type === 'alert') {
          alertsSent++;
        }
      } catch (err) {
        console.error(`[TrapService] Failed to trigger trap ${trap.id}:`, err);
      }
    }

    return { triggered, slowMultiplier, alertsSent };
  }

  /**
   * Execute a trap's effect when triggered.
   *
   * - slow: Claim value reduced by 50% (applied in claim engine)
   * - alert: Notify territory owner immediately via WS + push
   * - decoy: Cosmetic effect (no gameplay impact, logged for client rendering)
   *
   * @param trapId - Trap to trigger
   * @param triggeredBy - Player who triggered the trap
   */
  async triggerTrap(trapId: string, triggeredBy: string): Promise<void> {
    const trap = await queryOne<Trap & { owner_username: string }>(
      `SELECT t.*, u.username as owner_username
       FROM traps t
       LEFT JOIN users u ON t.owner_id = u.id
       WHERE t.id = $1 AND t.is_active = TRUE`,
      [trapId]
    );

    if (!trap) {
      throw new Error('Trap not found or already triggered');
    }

    // Mark trap as triggered (deactivates it)
    await query(
      `UPDATE traps SET is_active = FALSE, triggered_by = $1, triggered_at = NOW() WHERE id = $2`,
      [triggeredBy, trapId]
    );

    // Execute type-specific effects
    switch (trap.type) {
      case 'alert':
        // Notify territory owner immediately
        try {
          // Real-time WebSocket notification
          wsService.sendToUser(trap.owner_id, 'trap_triggered', {
            title: 'Trap Alert!',
            body: 'Someone triggered your alert trap! Your territory is being contested.',
            trap_id: trapId,
            territory_id: trap.territory_id,
            triggered_by: triggeredBy,
          });

          // Push notification
          await sendNotification({
            userId: trap.owner_id,
            type: 'territory_attack' as any,
            title: 'Alert Trap Triggered!',
            body: 'An intruder triggered your alert trap. Your territory is under threat!',
            data: {
              trap_id: trapId,
              territory_id: trap.territory_id,
              triggered_by: triggeredBy,
            },
            priority: 'HIGH',
          });
        } catch (err) {
          console.error('[TrapService] Failed to send alert notification:', err);
        }
        break;

      case 'slow':
        // Slow effect is applied by the claim engine via the slowMultiplier
        // Log the event for the triggered player
        try {
          wsService.sendToUser(triggeredBy, 'trap_triggered', {
            title: 'Trap Sprung!',
            body: 'You triggered a slow trap. Your claim value is reduced!',
            trap_type: 'slow',
            effect: 'claim_value_halved',
          });
        } catch (err) {
          // Non-critical
        }
        break;

      case 'decoy':
        // Decoy has no gameplay effect, just visual confusion
        try {
          wsService.sendToUser(triggeredBy, 'trap_triggered', {
            title: 'Decoy Detected!',
            body: 'You found a decoy trap. This territory boundary may not be what it seems.',
            trap_type: 'decoy',
          });
        } catch (err) {
          // Non-critical
        }
        break;
    }

    // Log to feed
    try {
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('trap_triggered', $1, $2)`,
        [triggeredBy, JSON.stringify({
          trap_id: trapId,
          trap_type: trap.type,
          territory_id: trap.territory_id,
          owner_id: trap.owner_id,
        })]
      );
    } catch (err) {
      console.error('[TrapService] Failed to log trap trigger:', err);
    }
  }

  /**
   * Get all active traps in a territory (owner only).
   *
   * @param territoryId - Territory ID
   * @param userId - Requesting user (must be owner)
   * @returns Array of active traps
   */
  async getTrapsInTerritory(territoryId: string, userId: string): Promise<Trap[]> {
    // Verify ownership
    const territory = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM territories WHERE id = $1',
      [territoryId]
    );

    if (!territory || territory.owner_id !== userId) {
      throw new Error('You can only view traps in your own territories');
    }

    const traps = await queryMany<Trap>(
      `SELECT id, owner_id, territory_id, type,
              ST_Y(location) as lat, ST_X(location) as lng,
              radius_m, is_active, triggered_by, triggered_at,
              created_at, expires_at
       FROM traps
       WHERE territory_id = $1 AND is_active = TRUE AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [territoryId]
    );

    return traps;
  }

  /**
   * Get all active traps owned by a user across all territories.
   *
   * @param userId - Owner's user ID
   * @returns Array of active traps
   */
  async getMyTraps(userId: string): Promise<Trap[]> {
    const traps = await queryMany<Trap>(
      `SELECT id, owner_id, territory_id, type,
              ST_Y(location) as lat, ST_X(location) as lng,
              radius_m, is_active, triggered_by, triggered_at,
              created_at, expires_at
       FROM traps
       WHERE owner_id = $1 AND is_active = TRUE AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    return traps;
  }

  /**
   * Disarm (remove) a trap. Only the owner can disarm their own traps.
   *
   * @param trapId - Trap to disarm
   * @param userId - User requesting disarm (must be owner)
   */
  async disarmTrap(trapId: string, userId: string): Promise<void> {
    const trap = await queryOne<{ owner_id: string; is_active: boolean }>(
      'SELECT owner_id, is_active FROM traps WHERE id = $1',
      [trapId]
    );

    if (!trap) {
      throw new Error('Trap not found');
    }

    if (trap.owner_id !== userId) {
      throw new Error('You can only disarm your own traps');
    }

    if (!trap.is_active) {
      throw new Error('This trap is already inactive');
    }

    await query(
      'UPDATE traps SET is_active = FALSE WHERE id = $1',
      [trapId]
    );
  }
}

// ---- Singleton instance and functional exports ----

const trapServiceInstance = new TrapService();

export async function placeTrap(
  userId: string,
  territoryId: string,
  type: string,
  lat: number,
  lng: number
): Promise<Trap> {
  return trapServiceInstance.placeTrap(userId, territoryId, type, lat, lng);
}

export async function checkTraps(
  lat: number,
  lng: number,
  userId: string
): Promise<TrapCheckResult> {
  return trapServiceInstance.checkTraps(lat, lng, userId);
}

export async function triggerTrap(trapId: string, triggeredBy: string): Promise<void> {
  return trapServiceInstance.triggerTrap(trapId, triggeredBy);
}

export async function getTrapsInTerritory(territoryId: string, userId: string): Promise<Trap[]> {
  return trapServiceInstance.getTrapsInTerritory(territoryId, userId);
}

export async function getMyTraps(userId: string): Promise<Trap[]> {
  return trapServiceInstance.getMyTraps(userId);
}

export async function disarmTrap(trapId: string, userId: string): Promise<void> {
  return trapServiceInstance.disarmTrap(trapId, userId);
}

export const trapService = trapServiceInstance;

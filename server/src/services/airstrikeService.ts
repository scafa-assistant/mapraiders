// ============================================================
// Airstrike Service (Phase C.3 — Silo strikes)
// A 'silo' building lets its owner launch a ranged strike at a FOREIGN
// territory within AIRSTRIKE.RANGE_CELLS h3 cells. The strike resolves in a
// strict priority order:
//   1. An active shield defense on the target → broken.
//   2. Else the highest-HP non-destroyed building → damaged/destroyed.
//   3. Else nothing on the target → no_effect (recon-by-fire: the attacker
//      still pays energy + cooldown).
// Damage scales with the silo's tier (BUILDINGS.TIER_EFFECTS.silo_damage).
//
// Transaction discipline mirrors troopEngine: the target/origin validation +
// range check run on the POOL before the tx; the tx locks the silo, the
// shield/building it hits, debits energy, writes the battle row, and stamps the
// silo cooldown — all atomically. WS notifications fire only post-commit.
// All randomness would use crypto.randomInt (none needed here: damage is
// deterministic, target priority is deterministic). Gated behind `commander`.
// ============================================================

import * as h3 from 'h3-js';
import { transaction, query } from '../config/database';
import { AIRSTRIKE, BUILDINGS } from '../config/constants';
import { resourceService } from './resourceService';
import { wsService } from './wsService';

/** Domain error carrying a stable machine-readable `code`. */
export class AirstrikeError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AirstrikeError';
    this.code = code;
  }
}

export type AirstrikeResult =
  | { shield_broken: true }
  | { building_hit: { id: string; type: string; hp_after: number; destroyed: boolean } }
  | { no_effect: true };

export interface StrikeOutcome {
  battle_id: string;
  result: AirstrikeResult;
}

class AirstrikeService {
  /**
   * Launch an airstrike from one of the user's silos at a foreign territory.
   */
  async strike(
    userId: string,
    opts: { fromTerritoryId: string; targetTerritoryId: string },
  ): Promise<StrikeOutcome> {
    const { fromTerritoryId, targetTerritoryId } = opts;

    // ---- PRE-TX (pool): origin + target validation + range ----
    const fromRes = await query<{ id: string; owner_id: string | null; h3_cells: string[] | null }>(
      `SELECT id, owner_id, h3_cells FROM territories WHERE id = $1 AND owner_id = $2`,
      [fromTerritoryId, userId],
    );
    if (fromRes.rowCount === 0) {
      throw new AirstrikeError('NO_BASE', 'Origin territory not found or not owned');
    }
    const fromCells = fromRes.rows[0].h3_cells;
    if (!fromCells || fromCells.length === 0) {
      throw new AirstrikeError('NO_BASE', 'Origin territory has no H3 cells (not backfilled)');
    }
    const fromCell0 = fromCells[0];

    const targetRes = await query<{
      id: string;
      owner_id: string | null;
      h3_cells: string[] | null;
    }>(
      `SELECT id, owner_id, h3_cells FROM territories WHERE id = $1`,
      [targetTerritoryId],
    );
    if (targetRes.rowCount === 0) {
      throw new AirstrikeError('TARGET_NOT_FOUND', 'Target territory does not exist');
    }
    const target = targetRes.rows[0];
    if (!target.owner_id) {
      throw new AirstrikeError('TARGET_NOT_FOUND', 'Target territory is unowned');
    }
    if (target.owner_id === userId) {
      throw new AirstrikeError('CANNOT_STRIKE_SELF', 'You cannot strike your own territory');
    }
    const targetCells = target.h3_cells;
    if (!targetCells || targetCells.length === 0) {
      throw new AirstrikeError('TARGET_NOT_FOUND', 'Target territory has no H3 cells (not backfilled)');
    }
    const targetCell0 = targetCells[0];
    const defenderId = target.owner_id;

    // Range check via h3 gridDistance (throws on pentagon/cross-resolution).
    let dist: number;
    try {
      dist = h3.gridDistance(fromCell0, targetCell0);
    } catch {
      throw new AirstrikeError('TARGET_TOO_FAR', 'Target is out of strike range');
    }
    if (dist < 0 || dist > AIRSTRIKE.RANGE_CELLS) {
      throw new AirstrikeError('TARGET_TOO_FAR', 'Target is out of strike range');
    }

    // ---- TX: lock silo, resolve hit, debit, record ----
    const outcome = await transaction(async (c) => {
      // Lock the active silo on the origin (owned by the user).
      const siloRes = await c.query<{ id: string; tier: number; config: Record<string, any> }>(
        `SELECT id, tier, config
           FROM buildings
          WHERE territory_id = $1 AND owner_id = $2 AND type = 'silo' AND status = 'active'
          ORDER BY tier DESC
          LIMIT 1
          FOR UPDATE`,
        [fromTerritoryId, userId],
      );
      if (siloRes.rowCount === 0) {
        throw new AirstrikeError('NO_SILO', 'No active silo on the origin territory');
      }
      const silo = siloRes.rows[0];
      const siloTier = silo.tier || 1;

      // Cooldown: last_strike_at within COOLDOWN_HOURS blocks a new strike.
      const lastStrikeAt = silo.config?.last_strike_at
        ? new Date(silo.config.last_strike_at).getTime()
        : null;
      const cooldownMs = AIRSTRIKE.COOLDOWN_HOURS * 60 * 60 * 1000;
      if (lastStrikeAt !== null && Date.now() - lastStrikeAt < cooldownMs) {
        throw new AirstrikeError('SILO_COOLDOWN', 'Silo is still on cooldown');
      }

      // Energy cost (INSUFFICIENT_RESOURCES bubbles up).
      await resourceService.debit(
        userId,
        'energy',
        AIRSTRIKE.ENERGY_COST,
        'airstrike',
        { fromTerritoryId, targetTerritoryId },
        c,
      );

      const damageTable = BUILDINGS.TIER_EFFECTS.silo_damage;
      const dmgIdx = Math.max(0, Math.min(damageTable.length - 1, siloTier - 1));
      const damage = damageTable[dmgIdx];

      // ---- Priority 1: an active shield defense on the target ----
      let result: AirstrikeResult;
      const shieldRes = await c.query<{ id: string }>(
        `SELECT id FROM territory_defenses
          WHERE territory_id = $1 AND game_type = 'shield' AND status = 'active'
          ORDER BY slot_index ASC
          LIMIT 1
          FOR UPDATE`,
        [targetTerritoryId],
      );
      if (shieldRes.rowCount && shieldRes.rowCount > 0) {
        await c.query(
          `UPDATE territory_defenses SET status = 'broken' WHERE id = $1`,
          [shieldRes.rows[0].id],
        );
        result = { shield_broken: true };
      } else {
        // ---- Priority 2: highest-HP non-destroyed building on the target ----
        // Covert spy radars (possibly the ATTACKER's own intel asset) are not
        // valid strike targets — only the defender's real structures are.
        const bldRes = await c.query<{ id: string; type: string; hp: number; status: string }>(
          `SELECT id, type, hp, status
             FROM buildings
            WHERE territory_id = $1 AND status <> 'destroyed'
              AND COALESCE((config->>'covert')::boolean, FALSE) IS NOT TRUE
            ORDER BY hp DESC, created_at ASC
            LIMIT 1
            FOR UPDATE`,
          [targetTerritoryId],
        );
        if (bldRes.rowCount && bldRes.rowCount > 0) {
          const bld = bldRes.rows[0];
          const hpAfter = bld.hp - damage;
          const destroyed = hpAfter <= 0;
          const newStatus = destroyed ? 'destroyed' : (bld.status === 'active' ? 'damaged' : bld.status);
          await c.query(
            `UPDATE buildings SET hp = $2, status = $3 WHERE id = $1`,
            [bld.id, Math.max(0, hpAfter), newStatus],
          );
          result = {
            building_hit: {
              id: bld.id,
              type: bld.type,
              hp_after: Math.max(0, hpAfter),
              destroyed,
            },
          };
        } else {
          // ---- Priority 3: nothing to hit (recon-by-fire) ----
          result = { no_effect: true };
        }
      }

      // Stamp the silo cooldown.
      await c.query(
        `UPDATE buildings
            SET config = jsonb_set(COALESCE(config, '{}'::jsonb),
                                   '{last_strike_at}', to_jsonb(NOW()::text), true)
          WHERE id = $1`,
        [silo.id],
      );

      // Record the battle row (reuses the assault insert style).
      const hitSomething = !('no_effect' in result);
      const battleRes = await c.query<{ id: string }>(
        `INSERT INTO battles
           (attacker_id, defender_id, territory_id, type, log, winner, loot)
         VALUES ($1, $2, $3, 'airstrike', $4, $5, '{}'::jsonb)
         RETURNING id`,
        [
          userId,
          defenderId,
          targetTerritoryId,
          JSON.stringify({ type: 'airstrike', silo_tier: siloTier, damage, result }),
          hitSomething ? userId : null,
        ],
      );

      return { battleId: battleRes.rows[0].id, result, defenderId };
    });

    // ---- POST-COMMIT WS ----
    try {
      wsService.sendToUser(outcome.defenderId, 'airstrike', {
        territory_id: targetTerritoryId,
        result: outcome.result,
      });
      wsService.sendToUser(userId, 'battle_resolved', {
        battle_id: outcome.battleId,
        type: 'airstrike',
        territory_id: targetTerritoryId,
        result: outcome.result,
      });
    } catch {
      /* non-critical */
    }

    return { battle_id: outcome.battleId, result: outcome.result };
  }
}

export const airstrikeService = new AirstrikeService();
export default airstrikeService;

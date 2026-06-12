// ============================================================
// Building Engine (Phase B)
// Tier-1 structures placed on owned territories:
//   shield_generator → on completion spawns a passive 'shield'
//                      territory_defense that blocks one takeover
//                      attempt per cooldown window.
//   refinery         → boosts passive energy accrual on the territory.
//
// Costs are spent through resourceService (energy + tech) inside the
// same transaction as the building INSERT, so a failed debit rolls the
// whole build back. Composition follows the withClient pattern used by
// resourceService / itemService.
// ============================================================

import { PoolClient } from 'pg';
import { transaction } from '../config/database';
import { BUILDINGS } from '../config/constants';
import { resourceService } from './resourceService';
import { featureService } from './featureService';
import { wsService } from './wsService';

/** Domain error carrying a stable machine-readable `code`. */
export class BuildingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'BuildingError';
    this.code = code;
  }
}

/** Building types buildable in Phase B. */
export const BUILDING_TYPES = ['shield_generator', 'refinery'] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

export interface Building {
  id: string;
  territory_id: string;
  owner_id: string | null;
  type: string;
  tier: number;
  status: string;
  hp: number;
  completes_at: Date | null;
  config: Record<string, any>;
  created_at: Date;
}

export interface TerritoryEffects {
  /** Sum of REFINERY_ENERGY_BONUS over active refineries on the territory. */
  refineryBonus: number;
  /** True if the territory has at least one active shield_generator. */
  shieldActive: boolean;
}

/** Run `fn` inside the supplied client, or open a fresh transaction. */
async function withClient<T>(
  client: PoolClient | undefined,
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  if (client) return fn(client);
  return transaction(fn);
}

class BuildingEngine {
  // ---- Flag-overridable config -------------------------------------

  /**
   * Read the `resources` flag config block (Redis-cached, never throws).
   * Building tunables live under config.buildings.*; everything falls back
   * to the BUILDINGS constants when unset.
   */
  private async getConfig(): Promise<Record<string, any>> {
    try {
      const flags = await featureService.getAllFlags();
      const resources = flags.find((f) => f.key === 'resources');
      const cfg = (resources?.config as Record<string, any>) ?? {};
      return (cfg.buildings as Record<string, any>) ?? {};
    } catch {
      return {};
    }
  }

  /** Resolve build cost for a type from flag config, falling back to constants. */
  private resolveCost(
    type: BuildingType,
    cfg: Record<string, any>,
  ): { energy: number; tech: number } {
    const base = BUILDINGS.COSTS[type];
    const override = (cfg.costs as Record<string, any> | undefined)?.[type];
    return {
      energy: Number(override?.energy ?? base.energy),
      tech: Number(override?.tech ?? base.tech),
    };
  }

  /** Resolve build time (hours) from flag config, falling back to constants. */
  private resolveBuildHours(cfg: Record<string, any>): number {
    const v = Number(cfg.build_time_hours);
    return Number.isFinite(v) && v > 0 ? v : BUILDINGS.BUILD_TIME_HOURS;
  }

  /** Resolve refinery per-building bonus from flag config. */
  private resolveRefineryBonus(cfg: Record<string, any>): number {
    const v = Number(cfg.refinery_energy_bonus);
    return Number.isFinite(v) && v >= 0 ? v : BUILDINGS.REFINERY_ENERGY_BONUS;
  }

  /** Max building slots for a territory by area (mirrors defense slots). */
  private maxSlotsForArea(areaSqM: number): number {
    return BUILDINGS.SLOTS.maxByArea(areaSqM);
  }

  // ---- Reads --------------------------------------------------------

  /**
   * Return all non-destroyed buildings on a territory (building/active/damaged).
   * COVERT buildings (scout-planted radars, Phase C.1) are only visible to
   * their own owner — without the filter the territory owner could trivially
   * unmask every spy radar by polling this listing.
   */
  async getBuildings(
    territoryId: string,
    viewerId?: string,
    client?: PoolClient,
  ): Promise<Building[]> {
    return withClient(client, async (c) => {
      const res = await c.query<Building>(
        `SELECT id, territory_id, owner_id, type, tier, status, hp,
                completes_at, config, created_at
           FROM buildings
          WHERE territory_id = $1 AND status <> 'destroyed'
            AND (
              COALESCE((config->>'covert')::boolean, FALSE) IS NOT TRUE
              OR owner_id = $2
            )
          ORDER BY created_at ASC`,
        [territoryId, viewerId ?? null],
      );
      return res.rows;
    });
  }

  /**
   * Aggregate the gameplay effects of a territory's ACTIVE buildings.
   */
  async getTerritoryEffects(
    territoryId: string,
    client?: PoolClient,
  ): Promise<TerritoryEffects> {
    const cfg = await this.getConfig();
    const refineryBonusPer = this.resolveRefineryBonus(cfg);

    return withClient(client, async (c) => {
      const res = await c.query<{ type: string; cnt: string }>(
        `SELECT type, COUNT(*)::bigint AS cnt
           FROM buildings
          WHERE territory_id = $1 AND status = 'active'
          GROUP BY type`,
        [territoryId],
      );

      let refineryCount = 0;
      let shieldActive = false;
      for (const row of res.rows) {
        if (row.type === 'refinery') refineryCount = parseInt(row.cnt, 10);
        if (row.type === 'shield_generator') shieldActive = true;
      }
      return { refineryBonus: refineryCount * refineryBonusPer, shieldActive };
    });
  }

  /**
   * Batch variant of getTerritoryEffects — ONE query over many territories.
   * Used by decay + energy-tick loops to avoid N+1. Territories with no
   * active buildings are still present in the map with zeroed effects.
   */
  async getEffectsForTerritories(
    territoryIds: string[],
    client?: PoolClient,
  ): Promise<Map<string, TerritoryEffects>> {
    const map = new Map<string, TerritoryEffects>();
    for (const id of territoryIds) {
      map.set(id, { refineryBonus: 0, shieldActive: false });
    }
    if (territoryIds.length === 0) return map;

    const cfg = await this.getConfig();
    const refineryBonusPer = this.resolveRefineryBonus(cfg);

    // Accept the caller's client: opening a second pool connection while the
    // caller holds a FOR UPDATE lock can starve the pool under load.
    return withClient(client, async (c) => {
      const res = await c.query<{ territory_id: string; type: string; cnt: string }>(
        `SELECT territory_id, type, COUNT(*)::bigint AS cnt
           FROM buildings
          WHERE territory_id = ANY($1) AND status = 'active'
          GROUP BY territory_id, type`,
        [territoryIds],
      );

      for (const row of res.rows) {
        const eff = map.get(row.territory_id) ?? { refineryBonus: 0, shieldActive: false };
        if (row.type === 'refinery') {
          eff.refineryBonus += parseInt(row.cnt, 10) * refineryBonusPer;
        }
        if (row.type === 'shield_generator') {
          eff.shieldActive = true;
        }
        map.set(row.territory_id, eff);
      }
      return map;
    });
  }

  // ---- Build --------------------------------------------------------

  /**
   * Start construction of a building on a territory the user owns.
   *
   * One atomic transaction:
   *   1. Lock the territory FOR UPDATE; check ownership.
   *   2. Validate type.
   *   3. Enforce area-based slot limit (active + building count).
   *   4. Enforce max 1 building per type per territory.
   *   5. Debit energy + tech (ResourceError bubbles up untouched).
   *   6. INSERT status='building', completes_at = NOW() + build time.
   */
  async build(
    userId: string,
    territoryId: string,
    type: string,
  ): Promise<Building> {
    if (!BUILDING_TYPES.includes(type as BuildingType)) {
      throw new BuildingError('INVALID_TYPE', `Unknown building type '${type}'`);
    }
    const buildType = type as BuildingType;

    const cfg = await this.getConfig();
    const cost = this.resolveCost(buildType, cfg);
    const buildHours = this.resolveBuildHours(cfg);

    return transaction(async (c) => {
      // 1. Lock territory + measure its area
      const terr = await c.query<{ owner_id: string | null; area_m2: number }>(
        `SELECT owner_id, ST_Area(polygon::geography) AS area_m2
           FROM territories
          WHERE id = $1
          FOR UPDATE`,
        [territoryId],
      );
      if (terr.rowCount === 0) {
        throw new BuildingError('TERRITORY_NOT_FOUND', 'Territory does not exist');
      }
      const territory = terr.rows[0];
      if (territory.owner_id !== userId) {
        throw new BuildingError('NOT_OWNER', 'You do not own this territory');
      }

      // 3. Slot limit: count active + building structures
      const counts = await c.query<{ type: string; cnt: string }>(
        `SELECT type, COUNT(*)::bigint AS cnt
           FROM buildings
          WHERE territory_id = $1 AND status IN ('building', 'active', 'damaged')
          GROUP BY type`,
        [territoryId],
      );
      const totalUsed = counts.rows.reduce((s, r) => s + parseInt(r.cnt, 10), 0);
      const maxSlots = this.maxSlotsForArea(territory.area_m2 || 0);
      if (totalUsed >= maxSlots) {
        throw new BuildingError(
          'NO_SLOTS',
          `Territory has no free building slot (${totalUsed}/${maxSlots})`,
        );
      }

      // 4. Max 1 per type
      if (counts.rows.some((r) => r.type === buildType && parseInt(r.cnt, 10) > 0)) {
        throw new BuildingError('DUPLICATE_TYPE', `A ${buildType} already exists here`);
      }

      // 5. Pay costs (energy AND tech) — ResourceError bubbles up.
      const ctx = { territoryId, buildingType: buildType };
      await resourceService.debit(userId, 'energy', cost.energy, 'building_build', ctx, c);
      await resourceService.debit(userId, 'tech', cost.tech, 'building_build', ctx, c);

      // 6. Create the building
      const inserted = await c.query<Building>(
        `INSERT INTO buildings (territory_id, owner_id, type, status, completes_at, config)
         VALUES ($1, $2, $3, 'building', NOW() + ($4 || ' hours')::interval, $5)
         RETURNING id, territory_id, owner_id, type, tier, status, hp,
                   completes_at, config, created_at`,
        [territoryId, userId, buildType, String(buildHours), JSON.stringify({ cost })],
      );

      return inserted.rows[0];
    });
  }

  // ---- Demolish -----------------------------------------------------

  /**
   * Demolish a building the user owns. Refunds DEMOLISH_REFUND of the
   * original cost (energy + tech) and marks it destroyed. Demolishing a
   * shield_generator also breaks its linked passive shield defense.
   *
   * Returns the destroyed building augmented with the `refunded` amounts so
   * the route can surface them to the client.
   */
  async demolish(
    userId: string,
    buildingId: string,
  ): Promise<Building & { refunded: { energy: number; tech: number } }> {
    return transaction(async (c) => {
      const cur = await c.query<Building>(
        `SELECT id, territory_id, owner_id, type, tier, status, hp,
                completes_at, config, created_at
           FROM buildings
          WHERE id = $1
          FOR UPDATE`,
        [buildingId],
      );
      if (cur.rowCount === 0) {
        throw new BuildingError('BUILDING_NOT_FOUND', 'Building does not exist');
      }
      const building = cur.rows[0];

      if (building.owner_id !== userId) {
        throw new BuildingError('NOT_OWNER', 'You do not own this building');
      }
      if (building.status !== 'building' && building.status !== 'active') {
        throw new BuildingError(
          'NOT_DEMOLISHABLE',
          `Building cannot be demolished from status '${building.status}'`,
        );
      }

      // Refund 50% of the original cost. Read cost from config, falling back
      // to live/constant cost for the type if the stored cost is missing.
      const cfg = await this.getConfig();
      const storedCost = (building.config?.cost as { energy?: number; tech?: number }) ?? {};
      const baseCost = this.resolveCost(building.type as BuildingType, cfg);
      const refundEnergy = Math.floor(
        (Number(storedCost.energy ?? baseCost.energy)) * BUILDINGS.DEMOLISH_REFUND,
      );
      const refundTech = Math.floor(
        (Number(storedCost.tech ?? baseCost.tech)) * BUILDINGS.DEMOLISH_REFUND,
      );

      const ctx = { territoryId: building.territory_id, buildingId };
      if (refundEnergy > 0) {
        await resourceService.credit(userId, 'energy', refundEnergy, 'building_demolish_refund', ctx, c);
      }
      if (refundTech > 0) {
        await resourceService.credit(userId, 'tech', refundTech, 'building_demolish_refund', ctx, c);
      }

      // Break the linked shield defense, if any.
      if (building.type === 'shield_generator') {
        await c.query(
          `UPDATE territory_defenses
              SET status = 'broken'
            WHERE territory_id = $1
              AND game_type = 'shield'
              AND status = 'active'
              AND config->>'building_id' = $2`,
          [building.territory_id, buildingId],
        );
      }

      const updated = await c.query<Building>(
        `UPDATE buildings
            SET status = 'destroyed'
          WHERE id = $1
          RETURNING id, territory_id, owner_id, type, tier, status, hp,
                    completes_at, config, created_at`,
        [buildingId],
      );

      return { ...updated.rows[0], refunded: { energy: refundEnergy, tech: refundTech } };
    });
  }

  // ---- Cron: completion ---------------------------------------------

  /**
   * Flip every due 'building' to 'active'. For each completed
   * shield_generator, spawn a passive 'shield' territory_defense (unless
   * the owner was deleted — territory_defenses.owner_id is NOT NULL).
   * Best-effort WS notify per building. Returns count completed.
   */
  async completeDueBuildings(): Promise<number> {
    const completed = await transaction(async (c) => {
      const res = await c.query<Building>(
        `UPDATE buildings
            SET status = 'active'
          WHERE status = 'building' AND completes_at <= NOW()
          RETURNING id, territory_id, owner_id, type, tier, status, hp,
                    completes_at, config, created_at`,
      );
      const rows = res.rows;

      for (const b of rows) {
        if (b.type !== 'shield_generator') continue;
        // owner_id is NOT NULL on territory_defenses — skip if owner gone.
        if (!b.owner_id) continue;

        // Skip if a shield defense for this building already exists (idempotent).
        const existing = await c.query(
          `SELECT 1 FROM territory_defenses
            WHERE territory_id = $1 AND game_type = 'shield'
              AND status = 'active' AND config->>'building_id' = $2`,
          [b.territory_id, b.id],
        );
        if ((existing.rowCount ?? 0) > 0) continue;

        // Pick the next free slot_index, mirroring the defense engine.
        const used = await c.query<{ slot_index: number }>(
          `SELECT slot_index FROM territory_defenses
            WHERE territory_id = $1 AND status = 'active'`,
          [b.territory_id],
        );
        const usedSet = new Set(used.rows.map((r) => r.slot_index));
        let slotIndex = 0;
        while (usedSet.has(slotIndex)) slotIndex++;

        await c.query(
          `INSERT INTO territory_defenses
             (territory_id, owner_id, game_type, config, slot_index, status)
           VALUES ($1, $2, 'shield', $3, $4, 'active')`,
          [
            b.territory_id,
            b.owner_id,
            JSON.stringify({ building_id: b.id, last_blocked_at: null }),
            slotIndex,
          ],
        );
      }

      return rows;
    });

    // Best-effort notifications outside the transaction.
    for (const b of completed) {
      if (!b.owner_id) continue;
      try {
        wsService.sendToUser(b.owner_id, 'building_completed', {
          buildingId: b.id,
          territoryId: b.territory_id,
          type: b.type,
        });
      } catch {
        /* non-critical */
      }
    }

    return completed.length;
  }
}

export const buildingEngine = new BuildingEngine();
export default buildingEngine;

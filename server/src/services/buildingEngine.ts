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
import { BUILDINGS, EXTRACTION, TRAINING, isExtractionType, ExtractionType } from '../config/constants';
import { resourceService } from './resourceService';
import { featureService } from './featureService';
import { wsService } from './wsService';
import { getContext } from './osmContextService';

/** Domain error carrying a stable machine-readable `code`. */
export class BuildingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'BuildingError';
    this.code = code;
  }
}

/**
 * Buildable building types. Phase B shipped shield_generator + refinery;
 * Phase C.3 adds radar / garrison / silo / teleporter. All share the generic
 * build / upgrade / demolish plumbing.
 */
export const BUILDING_TYPES = [
  'shield_generator',
  'refinery',
  'radar',
  'garrison',
  'silo',
  'teleporter',
  // Phase F.1 — biome-gated extraction buildings (gated behind the `economy` flag).
  'sawmill',
  'quarry',
  'farm',
  'fishery',
  // 2026-07-02 — tier-2 catalog: military + industry (level-gated).
  'military_base',
  'airport',
  'datacenter',
] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

/** How many of a territory's H3 cells we probe for biome eligibility. */
const BIOME_PROBE_CELLS = 5;

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
  /** Base-grid position (2026-07-02); NULL on legacy rows until auto-placed. */
  grid_x: number | null;
  grid_y: number | null;
}

export interface TerritoryEffects {
  /** Sum of the tier-scaled refinery bonus over active refineries on the territory. */
  refineryBonus: number;
  /** True if the territory has at least one active shield_generator. */
  shieldActive: boolean;
  /** Bonus garrison slots from an active garrison building (by tier), 0 if none. */
  garrisonBonusSlots: number;
  /** True if the territory has an active teleporter. */
  hasTeleporter: boolean;
  /** Highest active silo tier on the territory (0 if none). */
  siloTier: number;
  /** Highest active (non-covert) radar tier on the territory (0 if none). */
  radarTier: number;
}

/** Zeroed effects object — the baseline before active buildings are folded in. */
function emptyEffects(): TerritoryEffects {
  return {
    refineryBonus: 0,
    shieldActive: false,
    garrisonBonusSlots: 0,
    hasTeleporter: false,
    siloTier: 0,
    radarTier: 0,
  };
}

/** Run `fn` inside the supplied client, or open a fresh transaction. */
async function withClient<T>(
  client: PoolClient | undefined,
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  if (client) return fn(client);
  return transaction(fn);
}

// ---- Base-grid placement helpers (2026-07-02) -----------------------

/** Footprint (grid cells) for a type; unknown types get a safe 2×2. */
function footprintOf(type: string): { w: number; h: number } {
  return BUILDINGS.FOOTPRINT[type] ?? { w: 2, h: 2 };
}

interface PlacedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rectsOverlap(a: PlacedRect, b: PlacedRect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** First free row-major spot for a w×h footprint on a side×side grid. */
function findFreeSpot(
  side: number,
  placed: PlacedRect[],
  w: number,
  h: number,
): { x: number; y: number } | null {
  for (let y = 0; y <= side - h; y++) {
    for (let x = 0; x <= side - w; x++) {
      const cand = { x, y, w, h };
      if (!placed.some((p) => rectsOverlap(cand, p))) return { x, y };
    }
  }
  return null;
}

class BuildingEngine {
  // ---- Flag-overridable config -------------------------------------

  /**
   * Read the `resources` flag config block (Redis-cached, never throws).
   * Building tunables live under config.buildings.*; everything falls back
   * to the BUILDINGS constants when unset.
   */
  private async getConfig(client?: PoolClient): Promise<Record<string, any>> {
    try {
      if (client) {
        // A caller holding a tx client must NEVER trigger a second pool
        // connection (featureService falls back to the pool on a Redis
        // cache miss — the classic starvation deadlock). One cheap PK read
        // through the SAME client instead.
        const res = await client.query<{ config: any }>(
          `SELECT config FROM feature_flags WHERE key = 'resources'`,
        );
        const cfg = (res.rows[0]?.config as Record<string, any>) ?? {};
        return (cfg.buildings as Record<string, any>) ?? {};
      }
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

  /**
   * Refinery per-building bonus for a given tier (1..MAX_TIER).
   *
   * Backward compat: the `resources` flag may carry a flat
   * config.buildings.refinery_energy_bonus (the Phase-B override). When set it
   * REPLACES the tier-1 base; higher tiers scale proportionally so the flag
   * keeps controlling the curve. With no flag override the per-tier constants
   * BUILDINGS.TIER_EFFECTS.refinery_bonus apply directly. A tier-1 refinery
   * with no override therefore yields exactly the legacy value (0.25).
   */
  private resolveRefineryBonus(cfg: Record<string, any>, tier: number): number {
    const table = BUILDINGS.TIER_EFFECTS.refinery_bonus;
    const idx = Math.max(0, Math.min(table.length - 1, (tier || 1) - 1));
    const baseTier1 = table[0];
    const override = Number(cfg.refinery_energy_bonus);
    if (Number.isFinite(override) && override >= 0) {
      // Scale the per-tier value by (override / tier-1 base) so the flag stays
      // a single knob over the whole curve. At tier 1 this is exactly override.
      const scale = baseTier1 > 0 ? override / baseTier1 : 1;
      return table[idx] * scale;
    }
    return table[idx];
  }

  /** Max building slots for a territory by area (mirrors defense slots). */
  private maxSlotsForArea(areaSqM: number): number {
    return BUILDINGS.SLOTS.maxByArea(areaSqM);
  }

  // ---- Biome gate (Phase F.1) ---------------------------------------

  /**
   * Throw BuildingError('BIOME_MISMATCH') unless the territory's real-world
   * biome matches the extraction type's required biome.
   *
   * Resolves the territory's h3_cells (POOL read) and probes the first few via
   * osmContextService.getContext() (Overpass/cache, also a POOL read). If ANY
   * probed cell reports the required biome, the build is allowed.
   *
   * IMPORTANT: this is called from build() BEFORE the transaction opens, so all
   * reads here go through the pool — never inside a tx client holding row locks.
   * A territory with no h3_cells yet (pre-backfill) cannot satisfy the gate and
   * is rejected with BIOME_MISMATCH.
   */
  private async assertBiomeEligible(
    territoryId: string,
    type: ExtractionType,
  ): Promise<void> {
    const required = EXTRACTION[type].biome;

    // Pool read: the territory's H3 res-8 cells.
    const terr = await transaction((c) =>
      c.query<{ h3_cells: string[] | null }>(
        `SELECT h3_cells FROM territories WHERE id = $1`,
        [territoryId],
      ),
    );
    if (terr.rowCount === 0) {
      throw new BuildingError('TERRITORY_NOT_FOUND', 'Territory does not exist');
    }
    const cells = (terr.rows[0].h3_cells ?? []).slice(0, BIOME_PROBE_CELLS);

    let matched = false;
    for (const cell of cells) {
      try {
        const ctx = await getContext(cell);
        if (ctx.biome === required) {
          matched = true;
          break;
        }
      } catch {
        // A single cell's context failure must not allow nor force the build —
        // keep probing the remaining cells.
      }
    }

    if (!matched) {
      throw new BuildingError(
        'BIOME_MISMATCH',
        `A ${type} needs ${required} terrain on this territory.`,
      );
    }
  }

  // ---- Reads --------------------------------------------------------

  /**
   * Return all non-destroyed buildings on a territory (building/active/damaged).
   * COVERT buildings (scout-planted radars, Phase C.1) are only visible to
   * their own owner — without the filter the territory owner could trivially
   * unmask every spy radar by polling this listing.
   *
   * Phase F.3: once a covert radar has been DETECTED (config.detected=true) via
   * a territory scan, it becomes visible to non-owners too (so the territory
   * owner can see the spy device they uncovered and destroy it). Undetected
   * covert buildings stay hidden from everyone but their owner.
   */
  async getBuildings(
    territoryId: string,
    viewerId?: string,
    client?: PoolClient,
  ): Promise<Building[]> {
    return withClient(client, async (c) => {
      const res = await c.query<Building>(
        `SELECT id, territory_id, owner_id, type, tier, status, hp,
                completes_at, config, created_at, grid_x, grid_y
           FROM buildings
          WHERE territory_id = $1 AND status <> 'destroyed'
            AND (
              COALESCE((config->>'covert')::boolean, FALSE) IS NOT TRUE
              OR owner_id = $2
              OR COALESCE((config->>'detected')::boolean, FALSE) IS TRUE
            )
          ORDER BY created_at ASC`,
        [territoryId, viewerId ?? null],
      );

      // 2026-07-02 base grid: legacy rows carry no position. Auto-place them
      // once (row-major) and persist, so the base view renders consistently.
      // Covert spy radars stay unplaced — they are hidden devices, not part
      // of the owner's visible base.
      const unplaced = res.rows.filter(
        (r) => r.grid_x === null && !(r.config as any)?.covert,
      );
      if (unplaced.length > 0) {
        const terr = await c.query<{ area_m2: number }>(
          `SELECT ST_Area(polygon::geography) AS area_m2 FROM territories WHERE id = $1`,
          [territoryId],
        );
        const side = BUILDINGS.GRID.sideForArea(terr.rows[0]?.area_m2 || 0);
        const placed: PlacedRect[] = res.rows
          .filter((r) => r.grid_x !== null && r.grid_y !== null)
          .map((r) => ({ x: r.grid_x as number, y: r.grid_y as number, ...footprintOf(r.type) }));
        for (const b of unplaced) {
          const fp = footprintOf(b.type);
          const spot = findFreeSpot(side, placed, fp.w, fp.h);
          if (!spot) continue; // grid full — leave NULL, client falls back
          b.grid_x = spot.x;
          b.grid_y = spot.y;
          placed.push({ ...spot, ...fp });
          await c.query(
            `UPDATE buildings SET grid_x = $2, grid_y = $3 WHERE id = $1 AND grid_x IS NULL`,
            [b.id, spot.x, spot.y],
          );
        }
      }

      return res.rows;
    });
  }

  /**
   * Base-grid metadata for a territory (2026-07-02): the square grid side
   * derived from the territory's area. The client renders side×side cells of
   * BUILDINGS.GRID.CELL_M2 each.
   */
  async getGridInfo(territoryId: string): Promise<{ side: number; cell_m2: number }> {
    const res = await transaction((c) =>
      c.query<{ area_m2: number }>(
        `SELECT ST_Area(polygon::geography) AS area_m2 FROM territories WHERE id = $1`,
        [territoryId],
      ),
    );
    if (res.rowCount === 0) {
      throw new BuildingError('TERRITORY_NOT_FOUND', 'Territory does not exist');
    }
    return {
      side: BUILDINGS.GRID.sideForArea(res.rows[0].area_m2 || 0),
      cell_m2: BUILDINGS.GRID.CELL_M2,
    };
  }

  /**
   * Aggregate the gameplay effects of a territory's ACTIVE buildings.
   */
  async getTerritoryEffects(
    territoryId: string,
    client?: PoolClient,
  ): Promise<TerritoryEffects> {
    return withClient(client, async (c) => {
      // Config through the same client — never a second pool connection
      // while the caller may be holding row locks.
      const cfg = await this.getConfig(c);

      // Per-row (type, tier, covert) — tier-aware effects need individual
      // tiers, so we cannot collapse to a per-type COUNT here.
      const res = await c.query<{ type: string; tier: number; covert: boolean }>(
        `SELECT type, tier,
                COALESCE((config->>'covert')::boolean, FALSE) AS covert
           FROM buildings
          WHERE territory_id = $1 AND status = 'active'`,
        [territoryId],
      );

      const eff = emptyEffects();
      for (const row of res.rows) {
        this.foldEffect(eff, row.type, row.tier, row.covert, cfg);
      }
      return eff;
    });
  }

  /**
   * Fold one active building row into an accumulating effects object.
   * Tier-aware; refinery bonuses sum, the rest take the max tier seen.
   * Covert radars (foreign spy radars) do NOT count toward the territory
   * owner's radarTier — they are not the owner's structure.
   */
  private foldEffect(
    eff: TerritoryEffects,
    type: string,
    tierRaw: number,
    covert: boolean,
    cfg: Record<string, any>,
  ): void {
    const tier = tierRaw || 1;
    const clampIdx = (len: number): number => Math.max(0, Math.min(len - 1, tier - 1));
    if (type === 'refinery') {
      eff.refineryBonus += this.resolveRefineryBonus(cfg, tier);
    } else if (type === 'shield_generator') {
      eff.shieldActive = true;
    } else if (type === 'garrison') {
      const slots = BUILDINGS.TIER_EFFECTS.garrison_bonus_slots[clampIdx(
        BUILDINGS.TIER_EFFECTS.garrison_bonus_slots.length,
      )];
      if (slots > eff.garrisonBonusSlots) eff.garrisonBonusSlots = slots;
    } else if (type === 'teleporter') {
      eff.hasTeleporter = true;
    } else if (type === 'silo') {
      if (tier > eff.siloTier) eff.siloTier = tier;
    } else if (type === 'radar' && !covert) {
      if (tier > eff.radarTier) eff.radarTier = tier;
    }
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
      map.set(id, emptyEffects());
    }
    if (territoryIds.length === 0) return map;

    // Accept the caller's client: opening a second pool connection while the
    // caller holds a FOR UPDATE lock can starve the pool under load. The
    // config read goes through the same client for the same reason.
    return withClient(client, async (c) => {
      const cfg = await this.getConfig(c);
      const res = await c.query<{
        territory_id: string;
        type: string;
        tier: number;
        covert: boolean;
      }>(
        `SELECT territory_id, type, tier,
                COALESCE((config->>'covert')::boolean, FALSE) AS covert
           FROM buildings
          WHERE territory_id = ANY($1) AND status = 'active'`,
        [territoryIds],
      );

      for (const row of res.rows) {
        const eff = map.get(row.territory_id) ?? emptyEffects();
        this.foldEffect(eff, row.type, row.tier, row.covert, cfg);
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
   *   2. Validate type + user-level gate (LEVEL_GATES).
   *   3. Placement (2026-07-02 base grid): every structure occupies an
   *      individual m² FOOTPRINT on the territory's build grid. A request
   *      with a grid position validates bounds + overlap (SPOT_TAKEN /
   *      OUT_OF_BOUNDS); without one the engine auto-places row-major
   *      (NO_SPACE when the grid is full). The legacy slot cap only still
   *      applies to requests WITHOUT a position (old clients).
   *   4. Enforce max 1 building per type per territory.
   *   5. Debit energy + tech (ResourceError bubbles up untouched).
   *   6. INSERT status='building', completes_at = NOW() + build time
   *      (an active datacenter on the territory shaves the build time).
   */
  async build(
    userId: string,
    territoryId: string,
    type: string,
    pos?: { x: number; y: number },
  ): Promise<Building> {
    if (!BUILDING_TYPES.includes(type as BuildingType)) {
      throw new BuildingError('INVALID_TYPE', `Unknown building type '${type}'`);
    }
    const buildType = type as BuildingType;

    const cfg = await this.getConfig();
    const cost = this.resolveCost(buildType, cfg);
    const buildHours = this.resolveBuildHours(cfg);

    // Phase F.1 — biome gate for extraction buildings. This is an Overpass /
    // osm_context POOL read (potentially slow, possibly a network round-trip),
    // so it MUST run BEFORE the build transaction opens — never while holding
    // the territory FOR UPDATE lock. Non-extraction types skip this entirely.
    if (isExtractionType(buildType)) {
      await this.assertBiomeEligible(territoryId, buildType);
    }

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

      // 2b. User-level gate (military/industry catalog).
      const gate = BUILDINGS.LEVEL_GATES[buildType];
      if (gate) {
        const u = await c.query<{ level: number }>(
          `SELECT level FROM users WHERE id = $1`,
          [userId],
        );
        if ((u.rows[0]?.level ?? 1) < gate) {
          throw new BuildingError('LEVEL_TOO_LOW', `Requires player level ${gate}`);
        }
      }

      // 3. Load the owner's NON-COVERT structures: foreign covert spy radars
      // (Phase C.1) live on this territory but belong to another player — they
      // must neither consume space nor block the owner (and letting them block
      // grid cells would betray their position).
      const existing = await c.query<{
        type: string;
        tier: number;
        status: string;
        grid_x: number | null;
        grid_y: number | null;
      }>(
        `SELECT type, tier, status, grid_x, grid_y
           FROM buildings
          WHERE territory_id = $1
            AND status IN ('building', 'active', 'damaged')
            AND owner_id = $2
            AND COALESCE((config->>'covert')::boolean, FALSE) IS NOT TRUE`,
        [territoryId, userId],
      );

      // 4. Max 1 per type.
      if (existing.rows.some((r) => r.type === buildType)) {
        throw new BuildingError('DUPLICATE_TYPE', `A ${buildType} already exists here`);
      }

      // 3b. Placement on the base grid.
      const side = BUILDINGS.GRID.sideForArea(territory.area_m2 || 0);
      const fp = footprintOf(buildType);
      const placed: PlacedRect[] = existing.rows
        .filter((r) => r.grid_x !== null && r.grid_y !== null)
        .map((r) => ({
          x: r.grid_x as number,
          y: r.grid_y as number,
          ...footprintOf(r.type),
        }));

      let spot: { x: number; y: number } | null;
      if (pos) {
        // Footprint must fit the grid and not overlap any placed structure.
        if (
          !Number.isInteger(pos.x) || !Number.isInteger(pos.y) ||
          pos.x < 0 || pos.y < 0 || pos.x + fp.w > side || pos.y + fp.h > side
        ) {
          throw new BuildingError('OUT_OF_BOUNDS', `Footprint ${fp.w}x${fp.h} does not fit at (${pos.x},${pos.y}) on a ${side}x${side} grid`);
        }
        if (placed.some((p) => rectsOverlap({ ...pos, ...fp }, p))) {
          throw new BuildingError('SPOT_TAKEN', 'Another structure occupies this spot');
        }
        spot = pos;
      } else {
        // Legacy request without a position: keep the old slot cap, then
        // auto-place so the base view stays consistent.
        const maxSlots = this.maxSlotsForArea(territory.area_m2 || 0);
        if (existing.rows.length >= maxSlots) {
          throw new BuildingError(
            'NO_SLOTS',
            `Territory has no free building slot (${existing.rows.length}/${maxSlots})`,
          );
        }
        spot = findFreeSpot(side, placed, fp.w, fp.h);
      }
      if (!spot) {
        throw new BuildingError('NO_SPACE', `No free ${fp.w}x${fp.h} spot on the ${side}x${side} grid`);
      }

      // 5. Pay costs (energy AND tech) — ResourceError bubbles up.
      const ctx = { territoryId, buildingType: buildType };
      await resourceService.debit(userId, 'energy', cost.energy, 'building_build', ctx, c);
      await resourceService.debit(userId, 'tech', cost.tech, 'building_build', ctx, c);

      // 6. Create the building. An ACTIVE datacenter (AI core) on the same
      // territory shaves a tier-scaled fraction off the build time.
      let effectiveHours = buildHours;
      const dc = existing.rows.find((r) => r.type === 'datacenter' && r.status === 'active');
      if (dc) {
        const table = BUILDINGS.TIER_EFFECTS_DATACENTER.build_speedup;
        const idx = Math.max(0, Math.min(table.length - 1, (dc.tier || 1) - 1));
        effectiveHours = buildHours * (1 - table[idx]);
      }

      const inserted = await c.query<Building>(
        `INSERT INTO buildings (territory_id, owner_id, type, status, completes_at, config, grid_x, grid_y)
         VALUES ($1, $2, $3, 'building', NOW() + ($4 || ' hours')::interval, $5, $6, $7)
         RETURNING id, territory_id, owner_id, type, tier, status, hp,
                   completes_at, config, created_at, grid_x, grid_y`,
        [territoryId, userId, buildType, String(effectiveHours), JSON.stringify({ cost }), spot.x, spot.y],
      );

      return inserted.rows[0];
    });
  }

  // ---- Upgrade (Phase C.3) ------------------------------------------

  /**
   * Upgrade a building to its next tier (up to BUILDINGS.TIERS.MAX_TIER).
   *
   * One atomic transaction:
   *   1. Lock the building FOR UPDATE; verify ownership + 'active' status.
   *   2. Reject if already at MAX_TIER.
   *   3. Cost = base COSTS[type] × UPGRADE_COST_MULT^(currentTier) (both
   *      resources). Debit via resourceService (INSUFFICIENT_RESOURCES bubbles).
   *   4. Flip to status='building', completes_at = NOW() + UPGRADE_TIME_HOURS
   *      [currentTier] hours, stash upgrading_to in config. The building_completion
   *      cron flips it back to 'active' at the new tier (completeDueBuildings).
   *
   * The tier itself is NOT bumped here — it advances only on completion, so an
   * in-progress upgrade keeps the live (lower) tier's effects until it finishes.
   */
  async upgrade(userId: string, buildingId: string): Promise<Building> {
    return transaction(async (c) => {
      const cur = await c.query<Building>(
        `SELECT id, territory_id, owner_id, type, tier, status, hp,
                completes_at, config, created_at, grid_x, grid_y
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
      if (building.status !== 'active') {
        throw new BuildingError(
          'NOT_UPGRADABLE',
          `Building cannot be upgraded from status '${building.status}'`,
        );
      }
      const currentTier = building.tier || 1;
      if (currentTier >= BUILDINGS.TIERS.MAX_TIER) {
        throw new BuildingError('MAX_TIER', 'Building is already at the maximum tier');
      }

      // Cost scales with the current tier: base × MULT^tier.
      // (Config via the held client — we hold a FOR UPDATE lock here.)
      const cfg = await this.getConfig(c);
      const baseCost = this.resolveCost(building.type as BuildingType, cfg);
      const mult = Math.pow(BUILDINGS.TIERS.UPGRADE_COST_MULT, currentTier);
      const costEnergy = Math.floor(baseCost.energy * mult);
      const costTech = Math.floor(baseCost.tech * mult);

      const ctx = { territoryId: building.territory_id, buildingId, upgradeTo: currentTier + 1 };
      await resourceService.debit(userId, 'energy', costEnergy, 'building_upgrade', ctx, c);
      await resourceService.debit(userId, 'tech', costTech, 'building_upgrade', ctx, c);

      const upgradeHours = BUILDINGS.TIERS.UPGRADE_TIME_HOURS[currentTier];

      const updated = await c.query<Building>(
        `UPDATE buildings
            SET status = 'building',
                completes_at = NOW() + ($2 || ' hours')::interval,
                config = COALESCE(config, '{}'::jsonb)
                         || jsonb_build_object('upgrading_to', ($3)::int)
          WHERE id = $1
          RETURNING id, territory_id, owner_id, type, tier, status, hp,
                    completes_at, config, created_at, grid_x, grid_y`,
        [buildingId, String(upgradeHours), currentTier + 1],
      );
      return updated.rows[0];
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
                completes_at, config, created_at, grid_x, grid_y
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

      // Refund 50% of the original BASE cost. Read cost from config, falling
      // back to live/constant cost for the type if the stored cost is missing.
      // Note (C.3): upgrade costs are NOT refunded — only the frozen base
      // config.cost (energy/tech of the initial build) is considered, so
      // demolishing a tier-3 building still refunds only 50% of the tier-1 base.
      // This applies uniformly to the new types (radar/garrison/silo/teleporter).
      // (Config via the held client — we hold a FOR UPDATE lock here.)
      const cfg = await this.getConfig(c);
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
                    completes_at, config, created_at, grid_x, grid_y`,
        [buildingId],
      );

      return { ...updated.rows[0], refunded: { energy: refundEnergy, tech: refundTech } };
    });
  }

  // ---- Training (2026-07-02) ----------------------------------------

  /**
   * Train `count` units of `unitDefId` at a military building the user owns.
   *
   * One atomic transaction:
   *   1. Validate the recipe (TRAINING.RECIPES) + batch size.
   *   2. Lock the building FOR UPDATE; verify owner + 'active' status + that
   *      the building type matches the recipe (ground at military_base, air
   *      at airport).
   *   3. User-level gate per recipe (no elite squads at level 1).
   *   4. Debit energy + tech × count (ResourceError bubbles up).
   *   5. Mint `count` non-tradeable 'unit' item_instances (status inventory)
   *      + item_events, so troopEngine / battleEngine / hauling work as-is.
   */
  async train(
    userId: string,
    buildingId: string,
    unitDefId: string,
    count: number,
  ): Promise<{ unit: string; count: number; instance_ids: string[] }> {
    const recipe = TRAINING.RECIPES[unitDefId];
    if (!recipe) {
      throw new BuildingError('INVALID_UNIT', `Unknown trainable unit '${unitDefId}'`);
    }
    const batch = Math.floor(count);
    if (!Number.isFinite(batch) || batch < 1 || batch > TRAINING.MAX_BATCH) {
      throw new BuildingError('INVALID_COUNT', `count must be 1..${TRAINING.MAX_BATCH}`);
    }

    return transaction(async (c) => {
      const cur = await c.query<Building>(
        `SELECT id, territory_id, owner_id, type, tier, status, hp,
                completes_at, config, created_at, grid_x, grid_y
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
      if (building.status !== 'active') {
        throw new BuildingError('NOT_ACTIVE', 'Building is not operational');
      }
      if (building.type !== recipe.building) {
        throw new BuildingError('WRONG_BUILDING', `${unitDefId} trains at a ${recipe.building}`);
      }

      const u = await c.query<{ level: number }>(
        `SELECT level FROM users WHERE id = $1`,
        [userId],
      );
      if ((u.rows[0]?.level ?? 1) < recipe.minLevel) {
        throw new BuildingError('LEVEL_TOO_LOW', `Requires player level ${recipe.minLevel}`);
      }

      const ctx = { buildingId, unit: unitDefId, count: batch };
      await resourceService.debit(userId, 'energy', recipe.cost.energy * batch, 'unit_training', ctx, c);
      await resourceService.debit(userId, 'tech', recipe.cost.tech * batch, 'unit_training', ctx, c);

      const ids: string[] = [];
      for (let i = 0; i < batch; i++) {
        const inserted = await c.query<{ id: string }>(
          `INSERT INTO item_instances
             (definition_id, owner_id, status, acquired_via, state, created_at, updated_at)
           VALUES ($1, $2, 'inventory', 'training', '{}'::jsonb, NOW(), NOW())
           RETURNING id`,
          [unitDefId, userId],
        );
        ids.push(inserted.rows[0].id);
        await c.query(
          `INSERT INTO item_events (instance_id, event, from_user, to_user, context)
           VALUES ($1, 'minted', NULL, $2, $3)`,
          [inserted.rows[0].id, userId, JSON.stringify(ctx)],
        );
      }

      return { unit: unitDefId, count: batch, instance_ids: ids };
    });
  }

  // ---- Cron: completion ---------------------------------------------

  /**
   * Flip every due 'building' to 'active'. This handles BOTH new builds and
   * tier upgrades (C.3): if config.upgrading_to is set, the tier advances to
   * that value and the upgrading_to key is stripped; new builds keep their
   * existing tier. For each completed shield_generator, spawn a passive
   * 'shield' territory_defense (unless the owner was deleted —
   * territory_defenses.owner_id is NOT NULL). A shield UPGRADE re-completes
   * through here too, but the idempotent existence check below means it does
   * not spawn a second shield row. Best-effort WS notify per building.
   * Returns count completed.
   */
  async completeDueBuildings(): Promise<number> {
    const completed = await transaction(async (c) => {
      const res = await c.query<Building>(
        `UPDATE buildings
            SET status = 'active',
                -- Upgrade completion: advance tier to upgrading_to, then drop the key.
                tier = CASE
                         WHEN (config ? 'upgrading_to')
                         THEN GREATEST(tier, (config->>'upgrading_to')::int)
                         ELSE tier
                       END,
                config = config - 'upgrading_to'
          WHERE status = 'building' AND completes_at <= NOW()
          RETURNING id, territory_id, owner_id, type, tier, status, hp,
                    completes_at, config, created_at, grid_x, grid_y`,
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

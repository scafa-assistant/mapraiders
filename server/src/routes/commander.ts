// ============================================================
// Commander Routes (Phase C.1 — Fog of War + Scouts)
// GET  /api/commander/map                  - fog-of-war map snapshot
// POST /api/commander/scouts/send          - dispatch a scout
// POST /api/commander/scouts/:movementId/recall - recall a marching scout
//
// The ENTIRE layer is gated behind the `commander` feature flag: when the
// flag is off for the user, every route (including GET) returns 403
// FEATURE_DISABLED. Response format: { success, data } / { success, message }.
// Registered in index.ts under /api/commander.
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { featureService } from '../services/featureService';
import { transaction, query } from '../config/database';
import { troopEngine } from '../services/troopEngine';
import { visionService } from '../services/visionService';
import { airstrikeService } from '../services/airstrikeService';
import { AIRSTRIKE, scoutCapacityForLevel } from '../config/constants';

const router = Router();

const COMMANDER_FLAG = 'commander';
const ECONOMY_FLAG = 'economy';

/** Map a TroopError code onto an HTTP status. */
function statusForCode(code: unknown): number {
  if (String(code).endsWith('NOT_FOUND')) return 404;
  // INSUFFICIENT_RESOURCES (ResourceError) and all validation codes -> 400.
  return 400;
}

// ---- GET /map ----------------------------------------------------------------

router.get('/map', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    // Lazily resolve this user's due movements first (errors logged, not thrown).
    try {
      await troopEngine.resolveDueMovements({ ownerId: userId });
    } catch (err) {
      console.error('[Commander] lazy resolveDueMovements failed:', err);
    }

    // ---- Fog v2: three tiers ----
    //   explored = permanent terrain memory (dim)
    //   active   = live detail right now (bright)
    //   revealed = explored ∪ active — what's drawn at all (vs unexplored fog)
    const exploredSet = await visionService.getExploredCells(userId);
    const activeSet = await visionService.getActiveCells(userId);
    const revealedSet = new Set<string>(exploredSet);
    for (const cell of activeSet) revealedSet.add(cell);

    const exploredCells = Array.from(exploredSet);
    const activeCells = Array.from(activeSet);
    const revealedCells = Array.from(revealedSet);

    // ALWAYS-visible coarse objective markers (hint where to scout).
    const objectives = await visionService.getObjectives(userId, revealedSet);

    // Player scout capacity (level-scaled) + how many are in flight now.
    const playerRow = await query<{ level: number | null }>(
      `SELECT level FROM users WHERE id = $1`,
      [userId],
    );
    const scoutCapMax = scoutCapacityForLevel(playerRow.rows[0]?.level ?? 1);
    const activeScoutRow = await query<{ cnt: string }>(
      `SELECT COUNT(*)::bigint AS cnt FROM troop_movements
        WHERE owner_id = $1 AND purpose IN ('scout','return')
          AND status = 'marching' AND resolved = FALSE`,
      [userId],
    );
    const scoutCapActive = parseInt(activeScoutRow.rows[0]?.cnt ?? '0', 10);

    // Territories whose cells intersect revealed. h3_cells = the revealed
    // subset; live = the territory has any cell in the ACTIVE tier.
    let territories: Array<{
      id: string;
      owner_id: string | null;
      owner_username: string | null;
      claim_value: number;
      h3_cells: string[];
      is_own: boolean;
      live: boolean;
    }> = [];

    if (revealedCells.length > 0) {
      const terrRows = await transaction((c) =>
        c.query<{
          id: string;
          owner_id: string | null;
          owner_username: string | null;
          claim_value: number;
          h3_cells: string[] | null;
        }>(
          `SELECT t.id, t.owner_id, u.username AS owner_username,
                  t.claim_value, t.h3_cells
             FROM territories t
             LEFT JOIN users u ON u.id = t.owner_id
            WHERE t.h3_cells && $1::text[]`,
          [revealedCells],
        ),
      );

      territories = terrRows.rows.map((t) => {
        const cells = t.h3_cells ?? [];
        const revealedSubset = cells.filter((cell) => revealedSet.has(cell));
        const live = cells.some((cell) => activeSet.has(cell));
        const own = t.owner_id === userId;
        // Fog tier discipline: owner identity + claim_value are LIVE intel.
        // For a non-live, explored-only foreign territory we only "remember
        // the terrain" — we must NOT reveal current owner/value (could have
        // changed since you scouted). Own territories always show full detail.
        const showLiveMeta = live || own;
        return {
          id: t.id,
          owner_id: showLiveMeta ? t.owner_id : null,
          owner_username: showLiveMeta ? t.owner_username : null,
          claim_value: showLiveMeta ? t.claim_value : 0,
          h3_cells: revealedSubset,
          is_own: own,
          live,
        };
      });
    }

    const ownMovements = await troopEngine.getMovements(userId);
    const movements = ownMovements.map((mv) => ({ ...mv, is_own: true }));

    // ---- Garrisons: ONLY for LIVE territories (a cell in the ACTIVE tier) ----
    // Explored-but-not-live territories leak no garrison (you saw the terrain,
    // not the current troops). `units` detail only for own garrisons.
    const liveTerritoryIds = new Set(
      territories.filter((t) => t.live).map((t) => t.id),
    );
    let garrisons: Array<{
      territory_id: string;
      count: number;
      is_own: boolean;
      units: { instance_id: string; definition_id: string }[] | null;
    }> = [];

    if (liveTerritoryIds.size > 0) {
      const garrisonRows = await query<{
        territory_id: string;
        owner_id: string | null;
        instance_id: string;
        definition_id: string;
      }>(
        `SELECT td.territory_id, t.owner_id, td.instance_id, i.definition_id
           FROM troop_deployments td
           JOIN territories t ON t.id = td.territory_id
           JOIN item_instances i ON i.id = td.instance_id
          WHERE td.territory_id = ANY($1::uuid[])
          ORDER BY td.created_at ASC`,
        [Array.from(liveTerritoryIds)],
      );

      const byTerritory = new Map<
        string,
        { owner_id: string | null; units: { instance_id: string; definition_id: string }[] }
      >();
      for (const row of garrisonRows.rows) {
        let entry = byTerritory.get(row.territory_id);
        if (!entry) {
          entry = { owner_id: row.owner_id, units: [] };
          byTerritory.set(row.territory_id, entry);
        }
        entry.units.push({ instance_id: row.instance_id, definition_id: row.definition_id });
      }

      garrisons = Array.from(byTerritory.entries()).map(([territoryId, entry]) => {
        const isOwn = entry.owner_id === userId;
        return {
          territory_id: territoryId,
          count: entry.units.length,
          is_own: isOwn,
          units: isOwn ? entry.units : null,
        };
      });
    }

    // ---- Foreign movements whose CURRENT path cell is ACTIVE ----
    // Live tier only: you only see enemy troops where you have live detail
    // right now. Stripped to {id, purpose, current_cell, eta, is_own:false}.
    const foreignMovements: Array<{
      id: string;
      purpose: string;
      current_cell: string;
      eta: Date;
      is_own: false;
      carrying: boolean;
    }> = [];

    if (activeCells.length > 0) {
      const fmRows = await query<{
        id: string;
        purpose: string;
        config: Record<string, any> | null;
        path: string[];
        departs_at: Date;
        arrives_at: Date;
      }>(
        // Phase F.2: include 'haul' so loaded enemy hauls surface (and a loaded
        // 'return' too). The `carrying` flag below marks interceptable columns.
        `SELECT id, purpose, config, path, departs_at, arrives_at
           FROM troop_movements
          WHERE owner_id <> $1
            AND status = 'marching' AND resolved = FALSE
            AND purpose IN ('attack', 'reinforce', 'scout', 'return', 'haul')`,
        [userId],
      );

      const now = Date.now();
      for (const mv of fmRows.rows) {
        const departs = new Date(mv.departs_at).getTime();
        const arrives = new Date(mv.arrives_at).getTime();
        const span = Math.max(1, arrives - departs);
        const progress = Math.min(1, Math.max(0, (now - departs) / span));
        const len = mv.path.length;
        const idx = len <= 1 ? 0 : Math.floor(progress * (len - 1));
        const currentCell = mv.path[idx];
        if (activeSet.has(currentCell)) {
          // carrying = this column holds an interceptable load: a 'haul' (en
          // route to load, intercept destroys its escort + denies the load) or
          // a 'return' that carries a materialised config.load.
          const cfg = mv.config ?? {};
          const carrying =
            mv.purpose === 'haul' ||
            (mv.purpose === 'return' && !!cfg.load && typeof cfg.load === 'object');
          foreignMovements.push({
            id: mv.id,
            purpose: mv.purpose,
            current_cell: currentCell,
            eta: mv.arrives_at,
            is_own: false,
            carrying,
          });
        }
      }
    }

    // Own active radars (incl. covert), with their territory's cells.
    const radarRows = await transaction((c) =>
      c.query<{
        building_id: string;
        territory_id: string;
        config: Record<string, any>;
        h3_cells: string[] | null;
      }>(
        `SELECT b.id AS building_id, b.territory_id, b.config, t.h3_cells
           FROM buildings b
           JOIN territories t ON t.id = b.territory_id
          WHERE b.owner_id = $1 AND b.type = 'radar' AND b.status = 'active'`,
        [userId],
      ),
    );
    const radars = radarRows.rows.map((r) => ({
      building_id: r.building_id,
      territory_id: r.territory_id,
      covert: !!(r.config && r.config.covert),
      cells: r.h3_cells ?? [],
    }));

    // Own active silos with strike-readiness (C.3). ready_at = last_strike_at +
    // cooldown, or null if the silo has never fired (immediately ready).
    const siloRows = await query<{
      territory_id: string;
      tier: number;
      config: Record<string, any>;
    }>(
      `SELECT territory_id, tier, config
         FROM buildings
        WHERE owner_id = $1 AND type = 'silo' AND status = 'active'`,
      [userId],
    );
    const silos = siloRows.rows.map((s) => {
      const last = s.config && s.config.last_strike_at ? new Date(s.config.last_strike_at) : null;
      const readyAt = last
        ? new Date(last.getTime() + AIRSTRIKE.COOLDOWN_HOURS * 60 * 60 * 1000).toISOString()
        : null;
      return { territory_id: s.territory_id, tier: s.tier, ready_at: readyAt };
    });

    // ---- Phase D: AI zones (held cells of all AI sectors), FILTERED to the
    // caller's visible cells (fog of war). Each entry carries the owning
    // sector's phase so the client can colour dormant/triggered/invasion.
    // AI troop MOVEMENTS already surface via the existing foreign-movement fog
    // path above (owner_id <> caller → is_own:false), so nothing extra here.
    const aiZones: Array<{ h3_cell: string; phase: string }> = [];
    if (revealedCells.length > 0) {
      try {
        const zoneRows = await query<{ held_cells: string[] | null; phase: string }>(
          `SELECT held_cells, phase
             FROM ai_region_state
            WHERE held_cells && $1::text[]`,
          [revealedCells],
        );
        for (const z of zoneRows.rows) {
          for (const cell of z.held_cells ?? []) {
            if (revealedSet.has(cell)) aiZones.push({ h3_cell: cell, phase: z.phase });
          }
        }
      } catch (err) {
        // ai_region_state may not exist if the Phase D migration hasn't run —
        // never let that break the map; just omit ai_zones.
        console.warn('[Commander] ai_zones query skipped:', (err as any)?.message);
      }
    }

    return res.json({
      success: true,
      data: {
        explored_cells: exploredCells,
        active_cells: activeCells,
        objectives,
        territories,
        garrisons,
        movements: [...movements, ...foreignMovements],
        radars,
        silos,
        ai_zones: aiZones,
        scout_capacity: { max: scoutCapMax, active: scoutCapActive },
      },
    });
  } catch (err: any) {
    console.error('[Commander] GET /map error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load commander map' });
  }
});

// ---- POST /scouts/send -------------------------------------------------------

router.post('/scouts/send', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const instanceId = body.instance_id;
    const fromTerritoryId = body.from_territory_id;

    if (typeof instanceId !== 'string' || typeof fromTerritoryId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'instance_id and from_territory_id are required',
      });
    }

    const target =
      body.target &&
      typeof body.target.latitude === 'number' &&
      typeof body.target.longitude === 'number'
        ? { latitude: body.target.latitude, longitude: body.target.longitude }
        : undefined;

    const movement = await troopEngine.dispatchScout(userId, {
      instanceId,
      fromTerritoryId,
      targetCell: typeof body.target_cell === 'string' ? body.target_cell : undefined,
      target,
      buildRadar: !!body.build_radar,
    });

    return res.json({ success: true, data: { movement } });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /scouts/send error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispatch scout' });
  }
});

// ---- POST /scouts/:movementId/recall -----------------------------------------

router.post('/scouts/:movementId/recall', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const movementId = req.params.movementId as string;
    const movement = await troopEngine.recallScout(userId, movementId);

    return res.json({ success: true, data: { movement } });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /scouts/:movementId/recall error:', err);
    return res.status(500).json({ success: false, message: 'Failed to recall scout' });
  }
});

// ---- POST /troops/deploy -----------------------------------------------------

router.post('/troops/deploy', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const instanceId = body.instance_id;
    const territoryId = body.territory_id;
    if (typeof instanceId !== 'string' || typeof territoryId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'instance_id and territory_id are required',
      });
    }

    const deployment = await troopEngine.deployUnit(userId, { instanceId, territoryId });
    return res.json({ success: true, data: { deployment } });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /troops/deploy error:', err);
    return res.status(500).json({ success: false, message: 'Failed to deploy unit' });
  }
});

// ---- POST /troops/undeploy ---------------------------------------------------

router.post('/troops/undeploy', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const instanceId = body.instance_id;
    if (typeof instanceId !== 'string') {
      return res.status(400).json({ success: false, message: 'instance_id is required' });
    }

    await troopEngine.undeployUnit(userId, { instanceId });
    return res.json({ success: true, data: {} });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /troops/undeploy error:', err);
    return res.status(500).json({ success: false, message: 'Failed to undeploy unit' });
  }
});

// ---- POST /troops/march ------------------------------------------------------

router.post('/troops/march', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const instanceIds = body.instance_ids;
    const fromTerritoryId = body.from_territory_id;
    const targetTerritoryId = body.target_territory_id;
    const purpose = body.purpose;

    if (
      !Array.isArray(instanceIds) ||
      !instanceIds.every((x) => typeof x === 'string') ||
      typeof fromTerritoryId !== 'string' ||
      typeof targetTerritoryId !== 'string' ||
      (purpose !== 'attack' && purpose !== 'reinforce')
    ) {
      return res.status(400).json({
        success: false,
        message:
          'instance_ids[], from_territory_id, target_territory_id and purpose (attack|reinforce) are required',
      });
    }

    const movement = await troopEngine.marchUnits(userId, {
      instanceIds,
      fromTerritoryId,
      targetTerritoryId,
      purpose,
    });
    return res.json({ success: true, data: { movement } });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /troops/march error:', err);
    return res.status(500).json({ success: false, message: 'Failed to march units' });
  }
});

// ---- POST /dice/equip --------------------------------------------------------

router.post('/dice/equip', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const instanceId = body.instance_id;
    if (typeof instanceId !== 'string') {
      return res.status(400).json({ success: false, message: 'instance_id is required' });
    }

    await troopEngine.equipDie(userId, instanceId);
    return res.json({ success: true, data: {} });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /dice/equip error:', err);
    return res.status(500).json({ success: false, message: 'Failed to equip die' });
  }
});

// ---- GET /battles ------------------------------------------------------------
// Last 20 battles where the user is attacker or defender, WITHOUT the full log
// (only the winner_side is lifted out of it).

router.get('/battles', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const rows = await query<{
      id: string;
      type: string;
      winner: string | null;
      attacker_id: string | null;
      defender_id: string | null;
      territory_id: string | null;
      created_at: Date;
      winner_side: string | null;
    }>(
      `SELECT id, type, winner, attacker_id, defender_id, territory_id, created_at,
              log->>'winner_side' AS winner_side
         FROM battles
        WHERE attacker_id = $1 OR defender_id = $1
        ORDER BY created_at DESC
        LIMIT 20`,
      [userId],
    );

    return res.json({ success: true, data: { battles: rows.rows } });
  } catch (err: any) {
    console.error('[Commander] GET /battles error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load battles' });
  }
});

// ---- GET /battles/:id --------------------------------------------------------
// Full battle row incl. log. Only the attacker or defender may read it; anyone
// else (or a missing row) gets 404.

router.get('/battles/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const battleId = req.params.id as string;
    const rows = await query<{
      id: string;
      attacker_id: string | null;
      defender_id: string | null;
      territory_id: string | null;
      type: string;
      log: any;
      winner: string | null;
      loot: any;
      created_at: Date;
    }>(
      `SELECT id, attacker_id, defender_id, territory_id, type, log, winner, loot, created_at
         FROM battles
        WHERE id = $1`,
      [battleId],
    );

    const battle = rows.rows[0];
    if (!battle || (battle.attacker_id !== userId && battle.defender_id !== userId)) {
      return res.status(404).json({ success: false, message: 'BATTLE_NOT_FOUND' });
    }

    return res.json({ success: true, data: { battle } });
  } catch (err: any) {
    console.error('[Commander] GET /battles/:id error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load battle' });
  }
});

// ---- POST /strike ------------------------------------------------------------
// Launch a silo airstrike at a foreign territory.
// Body: { from_territory_id, target_territory_id }
// Returns { battle_id, result }. Error mapping: *_NOT_FOUND → 404,
// SILO_COOLDOWN → 429, everything else → 400.

router.post('/strike', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const fromTerritoryId = body.from_territory_id;
    const targetTerritoryId = body.target_territory_id;
    if (typeof fromTerritoryId !== 'string' || typeof targetTerritoryId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'from_territory_id and target_territory_id are required',
      });
    }

    const outcome = await airstrikeService.strike(userId, {
      fromTerritoryId,
      targetTerritoryId,
    });
    return res.json({
      success: true,
      data: { battle_id: outcome.battle_id, result: outcome.result },
    });
  } catch (err: any) {
    if (err?.code) {
      const code = String(err.code);
      const status = code.endsWith('NOT_FOUND') ? 404 : code === 'SILO_COOLDOWN' ? 429 : 400;
      return res.status(status).json({ success: false, message: code });
    }
    console.error('[Commander] POST /strike error:', err);
    return res.status(500).json({ success: false, message: 'Failed to launch airstrike' });
  }
});

// ---- POST /haul --------------------------------------------------------------
// Dispatch a haul mission: hauler units ferry a target territory's stockpile
// home into the player's balance. Body: { instance_ids[], from_territory_id,
// target_territory_id }. Returns { movement }. Gated behind the `economy` flag.
// Error mapping: *_NOT_FOUND → 404, everything else (NOTHING_TO_HAUL,
// TARGET_NOT_OWNED, TARGET_TOO_FAR, INVALID_UNITS, UNIT_BUSY, ...) → 400.

router.post('/haul', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, ECONOMY_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const instanceIds = body.instance_ids;
    const fromTerritoryId = body.from_territory_id;
    const targetTerritoryId = body.target_territory_id;

    if (
      !Array.isArray(instanceIds) ||
      !instanceIds.every((x) => typeof x === 'string') ||
      typeof fromTerritoryId !== 'string' ||
      typeof targetTerritoryId !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'instance_ids[], from_territory_id and target_territory_id are required',
      });
    }

    const movement = await troopEngine.dispatchHaul(userId, {
      instanceIds,
      fromTerritoryId,
      targetTerritoryId,
    });
    return res.json({ success: true, data: { movement } });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /haul error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispatch haul' });
  }
});

// ---- POST /intercept ---------------------------------------------------------
// Attack a foreign loaded haul (or loaded return) in your active vision. Body:
// { movement_id, instance_ids[], from_territory_id }. Returns { battle_id,
// result }. Gated behind the `commander` flag. Error mapping: *_NOT_FOUND →
// 404, NOT_VISIBLE → 400, everything else → 400.

router.post('/intercept', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const movementId = body.movement_id;
    const instanceIds = body.instance_ids;
    const fromTerritoryId = body.from_territory_id;

    if (
      typeof movementId !== 'string' ||
      !Array.isArray(instanceIds) ||
      !instanceIds.every((x) => typeof x === 'string') ||
      typeof fromTerritoryId !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'movement_id, instance_ids[] and from_territory_id are required',
      });
    }

    const outcome = await troopEngine.interceptHaul(userId, {
      movementId,
      instanceIds,
      fromTerritoryId,
    });
    return res.json({
      success: true,
      data: {
        battle_id: outcome.battleId,
        result: { winner_side: outcome.winnerSide, load_lost: outcome.loadLost },
      },
    });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /intercept error:', err);
    return res.status(500).json({ success: false, message: 'Failed to intercept haul' });
  }
});

// ---- POST /scan --------------------------------------------------------------
// Run a paid territory SCAN to reveal old enemy covert spy-radars (Phase F.3).
// Body: { territory_id }. Charges ESPIONAGE.SCAN_COST (intel) regardless of
// whether anything is found (recon attempt has a price). Returns
// { found: [{building_id, owner_id, detected}], scanned_territory }. Gated
// behind the `commander` flag. Error mapping: *_NOT_FOUND → 404, everything
// else (INSUFFICIENT_RESOURCES, ...) → 400.

router.post('/scan', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const territoryId = body.territory_id;
    if (typeof territoryId !== 'string') {
      return res.status(400).json({ success: false, message: 'territory_id is required' });
    }

    const result = await troopEngine.scanTerritory(userId, territoryId);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /scan error:', err);
    return res.status(500).json({ success: false, message: 'Failed to scan territory' });
  }
});

// ---- POST /destroy-radar -----------------------------------------------------
// Destroy a DETECTED covert spy-radar that sits on a territory you own (Phase
// F.3). Body: { building_id }. The radar must be a covert radar with
// config.detected=true and sit on a territory you own. Returns { destroyed }.
// Gated behind the `commander` flag. Error mapping: *_NOT_FOUND → 404,
// NOT_DETECTED / NOT_TERRITORY_OWNER → 400.

router.post('/destroy-radar', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, COMMANDER_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const body = req.body ?? {};
    const buildingId = body.building_id;
    if (typeof buildingId !== 'string') {
      return res.status(400).json({ success: false, message: 'building_id is required' });
    }

    const result = await troopEngine.destroyCovertRadar(userId, buildingId);
    return res.json({ success: true, data: { destroyed: result.destroyed } });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Commander] POST /destroy-radar error:', err);
    return res.status(500).json({ success: false, message: 'Failed to destroy radar' });
  }
});

export const commanderRouter = router;
export default router;

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

const router = Router();

const COMMANDER_FLAG = 'commander';

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

    const visibleSet = await visionService.getVisibleCells(userId);
    const visibleCells = Array.from(visibleSet);

    // Territories overlapping the visible cells (array-overlap via GIN index).
    // Only the visible subset of each territory's cells is returned.
    let territories: Array<{
      id: string;
      owner_id: string | null;
      owner_username: string | null;
      claim_value: number;
      h3_cells: string[];
      is_own: boolean;
    }> = [];

    if (visibleCells.length > 0) {
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
          [visibleCells],
        ),
      );

      territories = terrRows.rows.map((t) => {
        const cells = t.h3_cells ?? [];
        const visibleSubset = cells.filter((cell) => visibleSet.has(cell));
        return {
          id: t.id,
          owner_id: t.owner_id,
          owner_username: t.owner_username,
          claim_value: t.claim_value,
          h3_cells: visibleSubset,
          is_own: t.owner_id === userId,
        };
      });
    }

    const ownMovements = await troopEngine.getMovements(userId);
    const movements = ownMovements.map((mv) => ({ ...mv, is_own: true }));

    // ---- Garrisons of all territories with a visible cell ----
    // `units` detail ONLY for own garrisons; foreign garrisons leak count
    // only (fog of war).
    let garrisons: Array<{
      territory_id: string;
      count: number;
      is_own: boolean;
      units: { instance_id: string; definition_id: string }[] | null;
    }> = [];

    if (visibleCells.length > 0) {
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
          WHERE t.h3_cells && $1::text[]
          ORDER BY td.created_at ASC`,
        [visibleCells],
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

    // ---- Foreign movements whose CURRENT path cell is visible ----
    // Stripped to {id, purpose, current_cell, eta, is_own:false} — no path or
    // origin leak. Current cell derived from elapsed-time progress.
    const foreignMovements: Array<{
      id: string;
      purpose: string;
      current_cell: string;
      eta: Date;
      is_own: false;
    }> = [];

    if (visibleCells.length > 0) {
      const fmRows = await query<{
        id: string;
        purpose: string;
        path: string[];
        departs_at: Date;
        arrives_at: Date;
      }>(
        `SELECT id, purpose, path, departs_at, arrives_at
           FROM troop_movements
          WHERE owner_id <> $1
            AND status = 'marching' AND resolved = FALSE
            AND purpose IN ('attack', 'reinforce', 'scout', 'return')`,
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
        if (visibleSet.has(currentCell)) {
          foreignMovements.push({
            id: mv.id,
            purpose: mv.purpose,
            current_cell: currentCell,
            eta: mv.arrives_at,
            is_own: false,
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

    return res.json({
      success: true,
      data: {
        visible_cells: visibleCells,
        territories,
        movements: [...movements, ...foreignMovements],
        garrisons,
        radars,
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

export const commanderRouter = router;
export default router;

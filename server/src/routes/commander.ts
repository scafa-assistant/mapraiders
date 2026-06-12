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
import { transaction } from '../config/database';
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

    const movements = await troopEngine.getMovements(userId);

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
        movements,
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

export const commanderRouter = router;
export default router;

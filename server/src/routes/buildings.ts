// ============================================================
// Building Routes (Phase B)
// GET    /api/buildings/territory/:territoryId  - list buildings on a territory
// POST   /api/buildings/territory/:territoryId  - construct a building
// DELETE /api/buildings/:id                     - demolish a building
//
// All routes are feature-gated behind the `resources` flag. When the flag is
// off, GET returns an empty list and mutating routes return 403. Response
// format: { success, data } / { success: false, message }.
// Registered in index.ts under /api/buildings.
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { featureService } from '../services/featureService';
import { buildingEngine } from '../services/buildingEngine';

const router = Router();

const RESOURCES_FLAG = 'resources';

/** Valid building types the client may request. */
const VALID_TYPES = ['shield_generator', 'refinery'] as const;
type BuildingType = (typeof VALID_TYPES)[number];

/**
 * Return true when the string looks like a non-empty UUID v4.
 * We do not import a full UUID validator here to keep the dependency footprint
 * light — the DB will reject anything truly malformed anyway.
 */
function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ---- GET /territory/:territoryId -----------------------------------------------

/**
 * GET /api/buildings/territory/:territoryId
 * Returns all buildings on the given territory. Feature-gated: if the flag is
 * off for this user, an empty list is returned (200, not 403, so the client
 * can poll harmlessly without knowing whether the feature exists).
 * Any authenticated user may read buildings on any territory.
 */
router.get('/territory/:territoryId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, RESOURCES_FLAG);
    if (!enabled) {
      return res.json({ success: true, data: { buildings: [] } });
    }

    const territoryId = req.params.territoryId as string;
    if (!looksLikeUuid(territoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid territory ID' });
    }

    const buildings = await buildingEngine.getBuildings(territoryId);
    return res.json({ success: true, data: { buildings } });
  } catch (err: any) {
    console.error('[Buildings] GET /territory/:territoryId error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load buildings' });
  }
});

// ---- POST /territory/:territoryId -----------------------------------------------

/**
 * POST /api/buildings/territory/:territoryId
 * Body: { type: 'shield_generator' | 'refinery' }
 * Constructs a new building on the territory the caller owns.
 * Feature-gated: flag off → 403.
 * Domain failures (NOT_OWNER, NO_SLOTS, etc.) → 400 with message = error code.
 */
router.post('/territory/:territoryId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, RESOURCES_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'Feature not available' });
    }

    const territoryId = req.params.territoryId as string;
    if (!looksLikeUuid(territoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid territory ID' });
    }

    const type = req.body?.type as string | undefined;
    if (!type || !VALID_TYPES.includes(type as BuildingType)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    const building = await buildingEngine.build(userId, territoryId, type);
    return res.status(201).json({ success: true, data: { building } });
  } catch (err: any) {
    // BuildingError (NOT_OWNER, INVALID_TYPE, NO_SLOTS, DUPLICATE_TYPE)
    // ResourceError (INSUFFICIENT_RESOURCES) both carry a .code property.
    if (err?.code) {
      return res.status(400).json({ success: false, message: err.code });
    }
    console.error('[Buildings] POST /territory/:territoryId error:', err);
    return res.status(500).json({ success: false, message: 'Failed to construct building' });
  }
});

// ---- DELETE /:id ---------------------------------------------------------------

/**
 * DELETE /api/buildings/:id
 * Demolishes the building. Caller must own it. Feature-gated: flag off → 403.
 * Returns the partially refunded resources on success.
 * Domain failures (NOT_OWNER, NOT_FOUND, NOT_DEMOLISHABLE) → 400.
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, RESOURCES_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'Feature not available' });
    }

    const buildingId = req.params.id as string;
    if (!looksLikeUuid(buildingId)) {
      return res.status(400).json({ success: false, message: 'Invalid building ID' });
    }

    const result = await buildingEngine.demolish(userId, buildingId);
    return res.json({ success: true, data: { refunded: result.refunded } });
  } catch (err: any) {
    if (err?.code) {
      // *_NOT_FOUND maps to 404 for clarity; the rest stay 400
      const status = String(err.code).endsWith('NOT_FOUND') ? 404 : 400;
      return res.status(status).json({ success: false, message: err.code });
    }
    console.error('[Buildings] DELETE /:id error:', err);
    return res.status(500).json({ success: false, message: 'Failed to demolish building' });
  }
});

export const buildingsRouter = router;
export default router;

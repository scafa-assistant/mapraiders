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
import { extractionService } from '../services/extractionService';
import { isExtractionType } from '../config/constants';
import { queryMany, queryOne } from '../config/database';

const router = Router();

// ─── One-Layer World Map: claim real OSM buildings ───────────────────────────
// Separate namespace (/osm/*) so it never collides with the grid-building routes
// below. Not feature-gated: this is the core one-layer map, not the economy.
const OSM_CLAIM_TYPES = ['workshop', 'refinery', 'garrison', 'armory', 'storage', 'radar'];

/**
 * GET /api/buildings/osm/claimed?north&south&east&west
 * Claimed real-buildings inside the viewport, with each owner's color + type.
 */
router.get('/osm/claimed', authenticate, async (req: Request, res: Response) => {
  const north = parseFloat(req.query.north as string);
  const south = parseFloat(req.query.south as string);
  const east = parseFloat(req.query.east as string);
  const west = parseFloat(req.query.west as string);
  if ([north, south, east, west].some((n) => isNaN(n))) {
    return res.status(400).json({ success: false, message: 'Bounding box required: north, south, east, west' });
  }
  try {
    const rows = await queryMany<any>(
      `SELECT cb.osm_id, cb.owner_id, cb.building_type, cb.lat, cb.lng,
              u.territory_color AS owner_color, u.username AS owner_username
         FROM claimed_buildings cb
         JOIN users u ON u.id = cb.owner_id
        WHERE cb.lat BETWEEN $1 AND $2 AND cb.lng BETWEEN $3 AND $4`,
      [south, north, west, east],
    );
    return res.json({
      success: true,
      data: {
        buildings: rows.map((r) => ({
          osmId: r.osm_id,
          ownerId: r.owner_id,
          type: r.building_type,
          lat: r.lat,
          lng: r.lng,
          color: r.owner_color || '#1558F0',
          ownerName: r.owner_username,
          isMine: r.owner_id === req.userId,
        })),
      },
    });
  } catch (err) {
    console.error('[Buildings] GET /osm/claimed error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load claimed buildings' });
  }
});

/**
 * POST /api/buildings/osm/claim  { osmId, lat, lng, type? }
 * Claim a real building. Fails if already owned by someone else.
 */
router.post('/osm/claim', authenticate, async (req: Request, res: Response) => {
  const { osmId, lat, lng, type } = req.body ?? {};
  if (!osmId || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ success: false, message: 'osmId, lat, lng required' });
  }
  const buildingType = OSM_CLAIM_TYPES.includes(type) ? type : 'workshop';
  try {
    const existing = await queryOne<{ owner_id: string }>(
      `SELECT owner_id FROM claimed_buildings WHERE osm_id = $1`,
      [String(osmId)],
    );
    if (existing && existing.owner_id !== req.userId) {
      return res.status(409).json({ success: false, message: 'BUILDING_TAKEN' });
    }
    await queryOne(
      `INSERT INTO claimed_buildings (osm_id, owner_id, building_type, lat, lng)
         VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (osm_id) DO UPDATE SET building_type = EXCLUDED.building_type
       RETURNING osm_id`,
      [String(osmId), req.userId, buildingType, lat, lng],
    );
    return res.json({ success: true, data: { osmId: String(osmId), type: buildingType } });
  } catch (err) {
    console.error('[Buildings] POST /osm/claim error:', err);
    return res.status(500).json({ success: false, message: 'Failed to claim building' });
  }
});

/**
 * POST /api/buildings/osm/release  { osmId }
 * Release a building the caller owns.
 */
router.post('/osm/release', authenticate, async (req: Request, res: Response) => {
  const { osmId } = req.body ?? {};
  if (!osmId) return res.status(400).json({ success: false, message: 'osmId required' });
  try {
    await queryMany(
      `DELETE FROM claimed_buildings WHERE osm_id = $1 AND owner_id = $2`,
      [String(osmId), req.userId],
    );
    return res.json({ success: true, data: { osmId: String(osmId) } });
  } catch (err) {
    console.error('[Buildings] POST /osm/release error:', err);
    return res.status(500).json({ success: false, message: 'Failed to release building' });
  }
});

const RESOURCES_FLAG = 'resources';
const ECONOMY_FLAG = 'economy';

/** Valid building types the client may request. */
const VALID_TYPES = [
  'shield_generator',
  'refinery',
  'radar',
  'garrison',
  'silo',
  'teleporter',
  // Phase F.1 — extraction buildings (additionally gated behind `economy`).
  'sawmill',
  'quarry',
  'farm',
  'fishery',
  // 2026-07-02 — tier-2 catalog: military + industry (level-gated server-side).
  'military_base',
  'airport',
  'datacenter',
] as const;
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

    const buildings = await buildingEngine.getBuildings(territoryId, userId);

    // 2026-07-02 base grid — square build grid derived from the territory
    // area; the client renders side×side cells of cell_m2 each.
    let grid: { side: number; cell_m2: number } | null = null;
    try {
      grid = await buildingEngine.getGridInfo(territoryId);
    } catch {
      /* territory gone between reads — grid stays null */
    }

    // Phase F.1 — territory stockpile (raw extraction resources). Only surfaced
    // when the `economy` flag is on for this user; otherwise an empty list so
    // the client can render uniformly without learning the feature exists.
    let stockpile: { resource: string; amount: number; cap: number; rate_per_hour: number }[] = [];
    const economyEnabled = await featureService.isEnabledFor(userId, ECONOMY_FLAG);
    if (economyEnabled) {
      const sp = await extractionService.getStockpile(territoryId);
      stockpile = sp.map((e) => ({
        resource: e.resource,
        amount: e.amount,
        cap: e.cap,
        rate_per_hour: e.ratePerHour,
      }));
    }

    return res.json({ success: true, data: { buildings, stockpile, grid } });
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

    // Phase F.1 — extraction buildings need the `economy` flag ON in addition
    // to `resources`. Off → 403 FEATURE_DISABLED. Existing (non-extraction)
    // builds are unaffected and never read the economy flag.
    if (isExtractionType(type)) {
      const economyEnabled = await featureService.isEnabledFor(userId, ECONOMY_FLAG);
      if (!economyEnabled) {
        return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
      }
    }

    // 2026-07-02 base grid — optional placement. Both coords must come
    // together; the engine validates bounds/overlap (OUT_OF_BOUNDS/SPOT_TAKEN).
    let pos: { x: number; y: number } | undefined;
    const gx = req.body?.grid_x;
    const gy = req.body?.grid_y;
    if (gx !== undefined || gy !== undefined) {
      if (!Number.isInteger(gx) || !Number.isInteger(gy) || gx < 0 || gy < 0) {
        return res.status(400).json({
          success: false,
          message: 'grid_x and grid_y must be non-negative integers (both or neither)',
        });
      }
      pos = { x: gx, y: gy };
    }

    const building = await buildingEngine.build(userId, territoryId, type, pos);
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

// ---- POST /:id/upgrade ----------------------------------------------------------

/**
 * POST /api/buildings/:id/upgrade
 * Upgrades the building to its next tier (caller must own it). Feature-gated:
 * flag off → 403. Domain failures map: *_NOT_FOUND → 404, the rest → 400
 * (NOT_OWNER, NOT_UPGRADABLE, MAX_TIER, INSUFFICIENT_RESOURCES).
 */
router.post('/:id/upgrade', authenticate, async (req: Request, res: Response) => {
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

    const building = await buildingEngine.upgrade(userId, buildingId);
    return res.json({ success: true, data: { building } });
  } catch (err: any) {
    if (err?.code) {
      const status = String(err.code).endsWith('NOT_FOUND') ? 404 : 400;
      return res.status(status).json({ success: false, message: err.code });
    }
    console.error('[Buildings] POST /:id/upgrade error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upgrade building' });
  }
});

// ---- POST /:id/train (2026-07-02) ------------------------------------------------

/**
 * POST /api/buildings/:id/train
 * Body: { unit: string, count: number }
 * Trains units at a military building (military_base → ground, airport → air).
 * Recipes + user-level gates live in TRAINING.RECIPES (constants.ts).
 * Feature-gated behind `resources` like all building routes.
 */
router.post('/:id/train', authenticate, async (req: Request, res: Response) => {
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

    const unit = req.body?.unit as string | undefined;
    const count = Number(req.body?.count ?? 1);
    if (!unit || typeof unit !== 'string') {
      return res.status(400).json({ success: false, message: 'unit is required' });
    }

    const result = await buildingEngine.train(userId, buildingId, unit, count);
    return res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.code) {
      const status = String(err.code).endsWith('NOT_FOUND') ? 404 : 400;
      return res.status(status).json({ success: false, message: err.code });
    }
    console.error('[Buildings] POST /:id/train error:', err);
    return res.status(500).json({ success: false, message: 'Failed to train units' });
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

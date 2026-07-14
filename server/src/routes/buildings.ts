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
import axios from 'axios';
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

// ─── OSM footprint tile cache ────────────────────────────────────────────────
// Phones used to hit overpass-api.de directly; at the wider ~5 km building
// gate that gets rate-limited/times out. The server fetches each 0.02°-tile
// from Overpass ONCE, stores it in Postgres, and serves everyone from cache.

const TILE_DEG = 0.02;
const TILE_TTL_DAYS = 30;
const MAX_TILES_PER_REQ = 20;

interface OsmFootprint { id: string; ring: [number, number][]; centroid: [number, number]; height: number; }

function footprintHeight(tags?: Record<string, string>): number {
  if (!tags) return 6;
  if (tags.height) { const h = parseFloat(tags.height); if (!isNaN(h)) return h; }
  if (tags['building:levels']) { const l = parseFloat(tags['building:levels']); if (!isNaN(l)) return Math.max(3, l * 3); }
  return 6;
}

async function fetchTileFromOverpass(ix: number, iy: number): Promise<OsmFootprint[]> {
  const west = ix * TILE_DEG, south = iy * TILE_DEG;
  const q = `[out:json][timeout:25];way["building"](${south},${west},${south + TILE_DEG},${west + TILE_DEG});out geom;`;
  const { data } = await axios.post('https://overpass-api.de/api/interpreter', 'data=' + encodeURIComponent(q), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MapRaiders/1.0 (contact info@scafa-investments.com)',
      'Accept': 'application/json',
    },
    timeout: 30_000,
    maxContentLength: 50 * 1024 * 1024,
  });
  const out: OsmFootprint[] = [];
  for (const el of data.elements || []) {
    if (el.type !== 'way' || !el.geometry || el.geometry.length < 4) continue;
    const ring: [number, number][] = el.geometry.map((p: any) => [p.lon, p.lat]);
    const f = ring[0], l = ring[ring.length - 1];
    if (f[0] !== l[0] || f[1] !== l[1]) ring.push(f);
    let cx = 0, cy = 0; const n = ring.length - 1;
    for (let i = 0; i < n; i++) { cx += ring[i][0]; cy += ring[i][1]; }
    out.push({ id: String(el.id), ring, centroid: [cx / n, cy / n], height: footprintHeight(el.tags) });
  }
  return out;
}

/**
 * GET /api/buildings/osm/footprints?north&south&east&west
 * Real-building footprints for the viewport, tile-cached server-side.
 * Tiles that fail to fetch are skipped so one bad tile never blanks the map.
 */
router.get('/osm/footprints', authenticate, async (req: Request, res: Response) => {
  const north = parseFloat(req.query.north as string);
  const south = parseFloat(req.query.south as string);
  const east = parseFloat(req.query.east as string);
  const west = parseFloat(req.query.west as string);
  if ([north, south, east, west].some((n) => isNaN(n)) || north <= south || east <= west) {
    return res.status(400).json({ success: false, message: 'Bounding box required: north, south, east, west' });
  }
  const ix0 = Math.floor(west / TILE_DEG), ix1 = Math.floor(east / TILE_DEG);
  const iy0 = Math.floor(south / TILE_DEG), iy1 = Math.floor(north / TILE_DEG);
  const tiles: Array<{ ix: number; iy: number; key: string }> = [];
  for (let ix = ix0; ix <= ix1; ix++) for (let iy = iy0; iy <= iy1; iy++) tiles.push({ ix, iy, key: `${ix}_${iy}` });
  if (tiles.length > MAX_TILES_PER_REQ) {
    return res.status(400).json({ success: false, message: 'Viewport too large' });
  }
  try {
    const cached = await queryMany<{ tile_key: string; buildings: OsmFootprint[] }>(
      `SELECT tile_key, buildings FROM osm_footprint_tiles
        WHERE tile_key = ANY($1) AND fetched_at > NOW() - INTERVAL '${TILE_TTL_DAYS} days'`,
      [tiles.map((t) => t.key)],
    );
    const byKey = new Map(cached.map((c) => [c.tile_key, c.buildings]));
    const missing = tiles.filter((t) => !byKey.has(t.key));

    // Fetch missing tiles from Overpass in small batches (be a polite client).
    for (let i = 0; i < missing.length; i += 2) {
      const batch = missing.slice(i, i + 2);
      await Promise.all(batch.map(async (t) => {
        try {
          const buildings = await fetchTileFromOverpass(t.ix, t.iy);
          byKey.set(t.key, buildings);
          await queryOne(
            `INSERT INTO osm_footprint_tiles (tile_key, buildings, fetched_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (tile_key) DO UPDATE SET buildings = $2, fetched_at = NOW()
             RETURNING tile_key`,
            [t.key, JSON.stringify(buildings)],
          );
        } catch (err: any) {
          console.error(`[Buildings] Overpass tile ${t.key} failed:`, err?.message ?? err);
        }
      }));
    }

    const seen = new Set<string>();
    const buildings: OsmFootprint[] = [];
    for (const t of tiles) {
      for (const b of byKey.get(t.key) ?? []) {
        if (seen.has(b.id)) continue;
        seen.add(b.id);
        buildings.push(b);
      }
    }
    return res.json({ success: true, data: { buildings } });
  } catch (err) {
    console.error('[Buildings] GET /osm/footprints error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load footprints' });
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

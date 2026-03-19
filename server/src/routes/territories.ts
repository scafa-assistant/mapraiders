// ============================================================
// Territory Routes
// GET  /api/territories       - Get territories in bounding box
// GET  /api/territories/me    - Get current user's territories
// GET  /api/territories/:id   - Get single territory details
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { queryMany, queryOne } from '../config/database';

// ---- Inline WKT helpers (geo utilities) ----

function bboxToPolygonWkt(bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number }): string {
  return `SRID=4326;POLYGON((${bbox.minLng} ${bbox.minLat}, ${bbox.maxLng} ${bbox.minLat}, ${bbox.maxLng} ${bbox.maxLat}, ${bbox.minLng} ${bbox.maxLat}, ${bbox.minLng} ${bbox.minLat}))`;
}

const router = Router();

/**
 * GET /api/territories
 * Get territories within a bounding box.
 * Uses PostGIS ST_Intersects for spatial query.
 * Query params: north, south, east, west (or minLat, maxLat, minLng, maxLng)
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    // Support both naming conventions
    const minLat = parseFloat((req.query.south ?? req.query.minLat) as string);
    const maxLat = parseFloat((req.query.north ?? req.query.maxLat) as string);
    const minLng = parseFloat((req.query.west ?? req.query.minLng) as string);
    const maxLng = parseFloat((req.query.east ?? req.query.maxLng) as string);

    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
      return res.status(400).json({
        success: false,
        error: 'Bounding box required: north, south, east, west (or minLat, maxLat, minLng, maxLng)',
      });
    }

    // Validate ranges
    if (minLat > maxLat) {
      return res.status(400).json({
        success: false,
        error: 'south (minLat) must be less than north (maxLat)',
      });
    }

    const bbox = { minLat, maxLat, minLng, maxLng };
    const bboxWkt = bboxToPolygonWkt(bbox);

    const territories = await queryMany(
      `SELECT t.id, t.owner_id, t.class, t.claim_value, t.claimed_at,
              t.last_defended, t.decay_level,
              u.username as owner_username,
              u.level as owner_level,
              ST_AsGeoJSON(t.polygon) as polygon_geojson,
              ST_Area(t.polygon::geography) as area_m2
       FROM territories t
       LEFT JOIN users u ON t.owner_id = u.id
       WHERE ST_Intersects(t.polygon, ST_GeomFromEWKT($1))
       AND t.owner_id IS NOT NULL
       ORDER BY t.claimed_at DESC
       LIMIT 500`,
      [bboxWkt]
    );

    return res.json({
      success: true,
      data: {
        territories: territories.map(t => ({
          id: t.id,
          owner_id: t.owner_id,
          owner_username: t.owner_username,
          owner_level: t.owner_level,
          class: t.class,
          claim_value: t.claim_value,
          claimed_at: t.claimed_at,
          last_defended: t.last_defended,
          decay_level: parseFloat(t.decay_level || '0'),
          polygon: t.polygon_geojson ? JSON.parse(t.polygon_geojson) : null,
          area_m2: parseFloat(t.area_m2 || '0'),
        })),
      },
    });
  } catch (err: any) {
    console.error('[Territories] Get territories error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get territories' });
  }
});

/**
 * GET /api/territories/me
 * Get current user's own territories with pagination.
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = (page - 1) * limit;

    const [territories, countResult] = await Promise.all([
      queryMany(
        `SELECT id, class, claim_value, claimed_at, last_defended, decay_level,
                ST_AsGeoJSON(polygon) as polygon_geojson,
                ST_Area(polygon::geography) as area_m2
         FROM territories
         WHERE owner_id = $1
         ORDER BY claimed_at DESC
         LIMIT $2 OFFSET $3`,
        [req.userId, limit, offset]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM territories WHERE owner_id = $1',
        [req.userId]
      ),
    ]);

    const total = parseInt(countResult?.count || '0', 10);

    return res.json({
      success: true,
      data: {
        territories: territories.map(t => ({
          id: t.id,
          class: t.class,
          claim_value: t.claim_value,
          claimed_at: t.claimed_at,
          last_defended: t.last_defended,
          decay_level: parseFloat(t.decay_level || '0'),
          polygon: t.polygon_geojson ? JSON.parse(t.polygon_geojson) : null,
          area_m2: parseFloat(t.area_m2 || '0'),
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error('[Territories] Get my territories error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get territories' });
  }
});

/**
 * GET /api/territories/:id
 * Get single territory details including owner info and recent claim history.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const territory = await queryOne(
      `SELECT t.id, t.owner_id, t.class, t.claim_value, t.claimed_at,
              t.last_defended, t.decay_level,
              u.username as owner_username,
              u.level as owner_level,
              ST_AsGeoJSON(t.polygon) as polygon_geojson,
              ST_Area(t.polygon::geography) as area_m2
       FROM territories t
       LEFT JOIN users u ON t.owner_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (!territory) {
      return res.status(404).json({ success: false, message: 'Territory not found' });
    }

    // Get recent claim history for this territory's area
    const recentClaims = await queryMany(
      `SELECT r.user_id, u.username, r.class, r.created_at, r.trust_score
       FROM routes r
       JOIN users u ON r.user_id = u.id
       WHERE r.polygon IS NOT NULL
       AND ST_Intersects(r.polygon, (SELECT polygon FROM territories WHERE id = $1))
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        id: territory.id,
        owner_id: territory.owner_id,
        owner_username: territory.owner_username,
        owner_level: territory.owner_level,
        class: territory.class,
        claim_value: territory.claim_value,
        claimed_at: territory.claimed_at,
        last_defended: territory.last_defended,
        decay_level: parseFloat(territory.decay_level || '0'),
        polygon: territory.polygon_geojson ? JSON.parse(territory.polygon_geojson) : null,
        area_m2: parseFloat(territory.area_m2 || '0'),
        recent_claims: recentClaims,
      },
    });
  } catch (err: any) {
    console.error('[Territories] Get territory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get territory' });
  }
});

export const territoriesRouter = router;
export default router;

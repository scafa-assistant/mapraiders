// ============================================================
// Travel Routes
// POST /api/travel/routes              - Start a new travel route
// PUT  /api/travel/routes/:id          - Add spots / update route
// POST /api/travel/routes/:id/complete - Complete and publish
// GET  /api/travel/routes              - Search/browse travel routes
// GET  /api/travel/routes/:id          - Get route details with spots
// POST /api/travel/routes/:id/rate     - Rate a travel route
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import {
  createTravelRouteSchema,
  updateTravelRouteSchema,
  ratingSchema,
} from '../middleware/validation';
import { queryMany, queryOne, query, transaction } from '../config/database';
import { haversineDistance } from '../utils/geo';

// ---- Inline WKT helpers ----

function pointToWkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

function pointsToLinestringWkt(points: { lat: number; lng: number }[]): string {
  const coords = points.map(p => `${p.lng} ${p.lat}`).join(', ');
  return `SRID=4326;LINESTRING(${coords})`;
}

function pathDistance(points: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return total;
}
import { QUEST } from '../config/constants';

const router = Router();

/**
 * GET /api/travel/routes
 * Search and browse published travel routes.
 * Query params: lat, lng, radius (m), page, limit
 */
router.get('/routes', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusM = Math.min(parseFloat(req.query.radius as string) || 10000, 100000);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = (page - 1) * limit;

    let whereClause = "WHERE tr.status = 'published'";
    const params: any[] = [];
    let paramIdx = 1;

    // Location filter
    if (!isNaN(lat) && !isNaN(lng)) {
      const locationWkt = pointToWkt(lat, lng);
      whereClause += ` AND ST_DWithin(tr.path::geography, ST_GeomFromEWKT($${paramIdx})::geography, $${paramIdx + 1})`;
      params.push(locationWkt, radiusM);
      paramIdx += 2;
    }

    params.push(limit, offset);

    const routes = await queryMany(
      `SELECT tr.id, tr.founder_id, tr.title, tr.total_distance_km,
              tr.avg_rating, tr.total_ratings, tr.status, tr.created_at,
              u.username as founder_username,
              ST_AsGeoJSON(tr.path) as path_geojson,
              (SELECT COUNT(*) FROM travel_spots WHERE route_id = tr.id) as spot_count
       FROM travel_routes tr
       LEFT JOIN users u ON tr.founder_id = u.id
       ${whereClause}
       ORDER BY tr.avg_rating DESC NULLS LAST, tr.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    return res.json({
      success: true,
      data: {
        routes: routes.map(r => ({
          ...r,
          path: r.path_geojson ? JSON.parse(r.path_geojson) : null,
          spot_count: parseInt(r.spot_count || '0', 10),
        })),
        pagination: {
          page,
          limit,
        },
      },
    });
  } catch (err: any) {
    console.error('[Travel] Get routes error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get travel routes' });
  }
});

/**
 * POST /api/travel/routes
 * Start a new travel route (draft). Provide path points and optional spots.
 */
router.post(
  '/routes',
  authenticate,
  validateBody(createTravelRouteSchema),
  async (req: Request, res: Response) => {
    try {
      const { title, points, spots } = req.body;

      const result = await transaction(async (client) => {
        // Create the path linestring from points
        const pathWkt = pointsToLinestringWkt(points);
        const distanceKm = pathDistance(
          points.map((p: any) => ({ lat: p.lat, lng: p.lng, timestamp: 0 }))
        ) / 1000;

        // Insert travel route as draft
        const routeResult = await client.query(
          `INSERT INTO travel_routes (founder_id, title, path, total_distance_km, status)
           VALUES ($1, $2, ST_GeomFromEWKT($3), $4, 'draft')
           RETURNING id, title, total_distance_km, status, created_at`,
          [req.userId, title, pathWkt, distanceKm]
        );

        const route = routeResult.rows[0];

        // Create spots if provided
        if (spots && spots.length > 0) {
          for (let i = 0; i < spots.length; i++) {
            const spot = spots[i];
            const spotWkt = pointToWkt(spot.lat, spot.lng);

            await client.query(
              `INSERT INTO travel_spots (route_id, location, title, description, media_url, spot_order, created_by)
               VALUES ($1, ST_GeomFromEWKT($2), $3, $4, $5, $6, $7)`,
              [route.id, spotWkt, spot.title || null, spot.description || null, spot.media_url || null, i + 1, req.userId]
            );
          }
        }

        return route;
      });

      return res.status(201).json({
        success: true,
        data: { route: result },
      });
    } catch (err: any) {
      console.error('[Travel] Create route error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create travel route' });
    }
  }
);

/**
 * PUT /api/travel/routes/:id
 * Update a travel route: change title, add/replace spots, update status.
 * Only the founder can update.
 */
router.put(
  '/routes/:id',
  authenticate,
  validateBody(updateTravelRouteSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, status, spots } = req.body;

      // Verify ownership
      const existing = await queryOne<{ id: string; founder_id: string; status: string }>(
        'SELECT id, founder_id, status FROM travel_routes WHERE id = $1',
        [id]
      );

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Travel route not found' });
      }

      if (existing.founder_id !== req.userId) {
        return res.status(403).json({ success: false, message: 'Not your travel route' });
      }

      const result = await transaction(async (client) => {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (title !== undefined) {
          updates.push(`title = $${paramIdx}`);
          values.push(title);
          paramIdx++;
        }

        if (status !== undefined) {
          updates.push(`status = $${paramIdx}`);
          values.push(status);
          paramIdx++;
        }

        if (updates.length > 0) {
          values.push(id);
          await client.query(
            `UPDATE travel_routes SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
            values
          );
        }

        // Replace all spots if provided
        if (spots !== undefined) {
          await client.query('DELETE FROM travel_spots WHERE route_id = $1', [id]);

          for (let i = 0; i < spots.length; i++) {
            const spot = spots[i];
            const spotWkt = pointToWkt(spot.lat, spot.lng);

            await client.query(
              `INSERT INTO travel_spots (route_id, location, title, description, media_url, spot_order, created_by)
               VALUES ($1, ST_GeomFromEWKT($2), $3, $4, $5, $6, $7)`,
              [id, spotWkt, spot.title || null, spot.description || null, spot.media_url || null, i + 1, req.userId]
            );
          }
        }

        // Return updated route
        const updated = await client.query(
          `SELECT id, title, total_distance_km, avg_rating, total_ratings, status, created_at
           FROM travel_routes WHERE id = $1`,
          [id]
        );

        return updated.rows[0];
      });

      return res.json({
        success: true,
        data: { route: result },
      });
    } catch (err: any) {
      console.error('[Travel] Update route error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update travel route' });
    }
  }
);

/**
 * POST /api/travel/routes/:id/complete
 * Complete and publish a travel route. Changes status from draft to published.
 * Founder only.
 */
router.post('/routes/:id/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const route = await queryOne<{ id: string; founder_id: string; status: string }>(
      'SELECT id, founder_id, status FROM travel_routes WHERE id = $1',
      [id]
    );

    if (!route) {
      return res.status(404).json({ success: false, message: 'Travel route not found' });
    }

    if (route.founder_id !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not your travel route' });
    }

    if (route.status === 'published') {
      return res.status(400).json({ success: false, message: 'Route is already published' });
    }

    if (route.status === 'archived') {
      return res.status(400).json({ success: false, message: 'Cannot publish an archived route' });
    }

    // Verify route has at least one spot
    const spotCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM travel_spots WHERE route_id = $1',
      [id]
    );

    if (parseInt(spotCount?.count || '0', 10) === 0) {
      return res.status(400).json({
        success: false,
        error: 'Add at least one spot before publishing',
      });
    }

    await query(
      "UPDATE travel_routes SET status = 'published' WHERE id = $1",
      [id]
    );

    return res.json({
      success: true,
      data: { status: 'published' },
    });
  } catch (err: any) {
    console.error('[Travel] Complete route error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete travel route' });
  }
});

/**
 * GET /api/travel/routes/:id
 * Get route details including all spots and founder info.
 */
router.get('/routes/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const route = await queryOne(
      `SELECT tr.id, tr.founder_id, tr.title, tr.total_distance_km,
              tr.avg_rating, tr.total_ratings, tr.status, tr.created_at,
              u.username as founder_username,
              ST_AsGeoJSON(tr.path) as path_geojson
       FROM travel_routes tr
       LEFT JOIN users u ON tr.founder_id = u.id
       WHERE tr.id = $1`,
      [id]
    );

    if (!route) {
      return res.status(404).json({ success: false, message: 'Travel route not found' });
    }

    // Only allow viewing drafts if you're the founder
    if (route.status === 'draft' && route.founder_id !== req.userId) {
      return res.status(404).json({ success: false, message: 'Travel route not found' });
    }

    // Get spots
    const spots = await queryMany(
      `SELECT id, title, description, media_url, spot_order,
              ST_Y(location) as lat, ST_X(location) as lng
       FROM travel_spots
       WHERE route_id = $1
       ORDER BY spot_order ASC`,
      [id]
    );

    // Get ratings summary
    const ratings = await queryMany(
      `SELECT creativity, difficulty, worth_it, comment, u.username, r.created_at
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.target_type = 'travel_route' AND r.target_id = $1
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...route,
        path: route.path_geojson ? JSON.parse(route.path_geojson) : null,
        spots,
        ratings,
      },
    });
  } catch (err: any) {
    console.error('[Travel] Get route error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get travel route' });
  }
});

/**
 * POST /api/travel/routes/:id/rate
 * Rate a published travel route. Must not be the founder.
 */
router.post(
  '/routes/:id/rate',
  authenticate,
  validateBody(ratingSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { creativity, difficulty, worth_it, comment } = req.body;

      // Verify route exists and is published
      const route = await queryOne<{ id: string; founder_id: string; status: string }>(
        "SELECT id, founder_id, status FROM travel_routes WHERE id = $1 AND status = 'published'",
        [id]
      );

      if (!route) {
        return res.status(404).json({
          success: false,
          error: 'Travel route not found or not published',
        });
      }

      // Cannot rate own route
      if (route.founder_id === req.userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot rate your own travel route',
        });
      }

      // Check not already rated
      const existingRating = await queryOne(
        "SELECT id FROM ratings WHERE user_id = $1 AND target_type = 'travel_route' AND target_id = $2",
        [req.userId, id]
      );

      if (existingRating) {
        return res.status(409).json({
          success: false,
          error: 'Already rated this travel route',
        });
      }

      // Save rating
      await query(
        `INSERT INTO ratings (user_id, target_type, target_id, creativity, difficulty, worth_it, comment)
         VALUES ($1, 'travel_route', $2, $3, $4, $5, $6)`,
        [req.userId, id, creativity || null, difficulty || null, worth_it, comment || null]
      );

      // Recalculate average rating using weighted formula
      const allRatings = await queryMany<{
        creativity: number | null;
        difficulty: number | null;
        worth_it: number;
      }>(
        "SELECT creativity, difficulty, worth_it FROM ratings WHERE target_type = 'travel_route' AND target_id = $1",
        [id]
      );

      let totalWeight = 0;
      let totalScore = 0;
      for (const r of allRatings) {
        if (r.creativity !== null) {
          totalScore += r.creativity * QUEST.RATING_WEIGHT_CREATIVITY;
          totalWeight += QUEST.RATING_WEIGHT_CREATIVITY;
        }
        if (r.difficulty !== null) {
          totalScore += r.difficulty * QUEST.RATING_WEIGHT_DIFFICULTY;
          totalWeight += QUEST.RATING_WEIGHT_DIFFICULTY;
        }
        totalScore += r.worth_it * QUEST.RATING_WEIGHT_WORTH_IT;
        totalWeight += QUEST.RATING_WEIGHT_WORTH_IT;
      }

      const avgRating = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;

      await query(
        'UPDATE travel_routes SET avg_rating = $1, total_ratings = $2 WHERE id = $3',
        [avgRating, allRatings.length, id]
      );

      return res.json({
        success: true,
        data: {
          avg_rating: avgRating,
          total_ratings: allRatings.length,
        },
      });
    } catch (err: any) {
      console.error('[Travel] Rate route error:', err);
      return res.status(500).json({ success: false, message: 'Failed to rate travel route' });
    }
  }
);

export const travelRouter = router;
export default router;

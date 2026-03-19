// ============================================================
// Route Routes (GPS Routes)
// POST /api/routes     - Upload a recorded GPS route
// GET  /api/routes/me  - Get user's route history (paginated)
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createRouteSchema, uploadRouteSchema } from '../middleware/validation';
import { claimLimiter } from '../middleware/rateLimit';
import { processRouteClaim } from '../services/claimEngine';
import { queryMany, queryOne } from '../config/database';
import { incrementLeaderboardScore } from '../services/leaderboardService';
import { MovementClass, GpsPoint } from '../utils/types';

const router = Router();

/**
 * POST /api/routes
 * Upload a recorded GPS route and claim territory.
 *
 * Flow:
 * 1. Validate with AntiCheat (inside claimEngine)
 * 2. Detect or validate movement class (inside claimEngine)
 * 3. Get weather bonus (inside claimEngine)
 * 4. Process with ClaimEngine (polygon creation, overlap detection, takeover)
 * 5. Award XP via ProgressionEngine (inside claimEngine)
 * 6. Update leaderboards
 * 7. Notify affected territory owners (inside claimEngine)
 * 8. Return new territory + XP earned
 */
router.post(
  '/',
  authenticate,
  claimLimiter,
  validateBody(createRouteSchema),
  async (req: Request, res: Response) => {
    try {
      const { points, class: movementClass } = req.body;

      // Normalize points to GpsPoint format if needed
      const normalizedPoints: GpsPoint[] = points.map((p: any) => ({
        lat: p.lat ?? p.latitude,
        lng: p.lng ?? p.longitude,
        timestamp: p.timestamp,
        accuracy: p.accuracy,
        altitude: p.altitude,
        speed: p.speed,
      }));

      // processRouteClaim handles the full pipeline:
      // anti-cheat -> class detection -> weather -> polygon -> territory -> XP -> notifications
      const result = await processRouteClaim({
        userId: req.userId!,
        points: normalizedPoints,
        overrideClass: movementClass as MovementClass | undefined,
      });

      // Update leaderboards (territory area and explorer distance)
      await Promise.all([
        incrementLeaderboardScore('territory', req.userId!, result.claim_value, movementClass as MovementClass),
        incrementLeaderboardScore('explorer', req.userId!, 1, movementClass as MovementClass),
      ]);

      return res.status(201).json({
        success: true,
        data: {
          territory_id: result.territory_id,
          claim_value: result.claim_value,
          xp_earned: result.xp_earned,
          is_takeover: result.is_takeover,
          previous_owner: result.previous_owner || null,
          bonuses: result.bonuses,
        },
      });
    } catch (err: any) {
      console.error('[Routes] Create route error:', err);

      // Distinguish between user errors and server errors
      const isUserError = err.message?.includes('rejected') ||
                          err.message?.includes('too small') ||
                          err.message?.includes('too large') ||
                          err.message?.includes('Need at least');

      return res.status(isUserError ? 400 : 500).json({
        success: false,
        error: err.message || 'Failed to process route',
      });
    }
  }
);

/**
 * GET /api/routes/me
 * Get user's route history with pagination.
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = (page - 1) * limit;

    const [routes, countResult] = await Promise.all([
      queryMany(
        `SELECT id, class, distance_m, duration_s, weather_bonus, trust_score, created_at
         FROM routes
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.userId, limit, offset]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM routes WHERE user_id = $1',
        [req.userId]
      ),
    ]);

    const total = parseInt(countResult?.count || '0', 10);

    return res.json({
      success: true,
      data: {
        routes,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error('[Routes] Get routes error:', err);
    return res.status(500).json({ success: false, error: 'Failed to get routes' });
  }
});

export const routesRouter = router;
export default router;

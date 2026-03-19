// ============================================================
// User Routes
// GET  /api/users/me          - Current user profile with titles, stats
// GET  /api/users/:id/profile - Public profile
// PUT  /api/users/me/settings - Update settings
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { updateSettingsSchema } from '../middleware/validation';
import { queryOne, queryMany, query } from '../config/database';

const router = Router();

// GET /api/users/me - Get current user's full profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await queryOne(
      `SELECT id, username, email, level, xp, streak_days, last_active,
              reputation, settings, created_at
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get titles
    const titles = await queryMany<{ title_key: string; earned_at: Date }>(
      'SELECT title_key, earned_at FROM user_titles WHERE user_id = $1 ORDER BY earned_at DESC',
      [req.userId]
    );

    // Get aggregate stats in parallel
    const [territoryCount, territoryArea, questCount, routeCount, echoCount, totalDistanceKm] =
      await Promise.all([
        queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM territories WHERE owner_id = $1',
          [req.userId]
        ),
        queryOne<{ total: string }>(
          'SELECT COALESCE(SUM(ST_Area(polygon::geography)), 0) as total FROM territories WHERE owner_id = $1',
          [req.userId]
        ),
        queryOne<{ count: string }>(
          "SELECT COUNT(*) as count FROM quest_progress WHERE user_id = $1 AND status = 'completed'",
          [req.userId]
        ),
        queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM routes WHERE user_id = $1',
          [req.userId]
        ),
        queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM echos WHERE creator_id = $1',
          [req.userId]
        ),
        queryOne<{ total: string }>(
          'SELECT COALESCE(SUM(distance_m), 0) / 1000.0 as total FROM routes WHERE user_id = $1',
          [req.userId]
        ),
      ]);

    return res.json({
      success: true,
      data: {
        ...user,
        titles: titles.map(t => t.title_key),
        stats: {
          territories: parseInt(territoryCount?.count || '0', 10),
          total_territory_m2: parseFloat(territoryArea?.total || '0'),
          quests_completed: parseInt(questCount?.count || '0', 10),
          total_routes: parseInt(routeCount?.count || '0', 10),
          total_echos: parseInt(echoCount?.count || '0', 10),
          total_distance_km: parseFloat(parseFloat(totalDistanceKm?.total || '0').toFixed(2)),
        },
      },
    });
  } catch (err: any) {
    console.error('[Users] Get me error:', err);
    return res.status(500).json({ success: false, error: 'Failed to get user data' });
  }
});

// GET /api/users/:id/profile - Get public profile
router.get('/:id/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await queryOne(
      `SELECT id, username, level, xp, streak_days, reputation, created_at
       FROM users WHERE id = $1 AND banned = FALSE`,
      [id]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get titles
    const titles = await queryMany<{ title_key: string }>(
      'SELECT title_key FROM user_titles WHERE user_id = $1',
      [id]
    );

    // Get clans
    const clans = await queryMany<{ name: string; type: string }>(
      `SELECT c.name, c.type FROM clans c
       JOIN clan_members cm ON c.id = cm.clan_id
       WHERE cm.user_id = $1`,
      [id]
    );

    // Get public stats
    const [territoryArea, questCount, routeCount] = await Promise.all([
      queryOne<{ total: string }>(
        'SELECT COALESCE(SUM(ST_Area(polygon::geography)), 0) as total FROM territories WHERE owner_id = $1',
        [id]
      ),
      queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM quest_progress WHERE user_id = $1 AND status = 'completed'",
        [id]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM routes WHERE user_id = $1',
        [id]
      ),
    ]);

    return res.json({
      success: true,
      data: {
        ...user,
        titles: titles.map(t => t.title_key),
        clans: clans.map(c => ({ name: c.name, type: c.type })),
        stats: {
          total_territory_m2: parseFloat(territoryArea?.total || '0'),
          quests_completed: parseInt(questCount?.count || '0', 10),
          total_routes: parseInt(routeCount?.count || '0', 10),
        },
      },
    });
  } catch (err: any) {
    console.error('[Users] Get profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// PUT /api/users/me/settings - Update user settings
router.put(
  '/me/settings',
  authenticate,
  validateBody(updateSettingsSchema),
  async (req: Request, res: Response) => {
    try {
      const newSettings = req.body;

      // Merge with existing settings (JSONB merge)
      const user = await queryOne<{ settings: any }>(
        'SELECT settings FROM users WHERE id = $1',
        [req.userId]
      );

      const mergedSettings = { ...(user?.settings || {}), ...newSettings };

      await query(
        'UPDATE users SET settings = $1 WHERE id = $2',
        [JSON.stringify(mergedSettings), req.userId]
      );

      return res.json({
        success: true,
        data: { settings: mergedSettings },
      });
    } catch (err: any) {
      console.error('[Users] Update settings error:', err);
      return res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
  }
);

export const usersRouter = router;
export default router;

// ============================================================
// User Routes
// GET    /api/users/me            - Current user profile with titles, stats
// GET    /api/users/me/export     - GDPR data export (Article 20)
// DELETE /api/users/me            - GDPR account deletion (Article 17)
// GET    /api/users/:id/profile   - Public profile
// PUT    /api/users/me/push-token - Store FCM push token
// PUT    /api/users/me/settings   - Update settings
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { updateSettingsSchema } from '../middleware/validation';
import { queryOne, queryMany, query, transaction } from '../config/database';
import { balanceService } from '../services/balanceService';

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
      return res.status(404).json({ success: false, message: 'User not found' });
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
    return res.status(500).json({ success: false, message: 'Failed to get user data' });
  }
});

// GET /api/users/me/export - GDPR Article 20: Right to data portability
router.get('/me/export', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const [
      user,
      territories,
      quests,
      questProgress,
      echos,
      challenges,
      challengeSubmissions,
      pets,
      routes,
      titles,
      notifications,
    ] = await Promise.all([
      queryOne(
        `SELECT id, username, email, level, xp, streak_days, last_active,
                reputation, settings, created_at
         FROM users WHERE id = $1`,
        [userId],
      ),
      queryMany(
        'SELECT * FROM territories WHERE owner_id = $1',
        [userId],
      ),
      queryMany(
        'SELECT * FROM quests WHERE creator_id = $1',
        [userId],
      ),
      queryMany(
        'SELECT * FROM quest_progress WHERE user_id = $1',
        [userId],
      ),
      queryMany(
        'SELECT * FROM echos WHERE creator_id = $1',
        [userId],
      ),
      queryMany(
        'SELECT * FROM challenges WHERE creator_id = $1',
        [userId],
      ),
      queryMany(
        'SELECT * FROM challenge_submissions WHERE user_id = $1',
        [userId],
      ),
      queryMany(
        'SELECT * FROM pets WHERE owner_id = $1',
        [userId],
      ),
      queryMany(
        'SELECT * FROM routes WHERE user_id = $1',
        [userId],
      ),
      queryMany(
        'SELECT * FROM user_titles WHERE user_id = $1',
        [userId],
      ),
      queryMany(
        'SELECT * FROM notifications WHERE user_id = $1',
        [userId],
      ),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        user,
        territories,
        quests,
        quest_progress: questProgress,
        echos,
        challenges,
        challenge_submissions: challengeSubmissions,
        pets,
        routes,
        titles,
        notifications,
      },
    });
  } catch (err: any) {
    console.error('[Users] Data export error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export user data' });
  }
});

// DELETE /api/users/me - GDPR Article 17: Right to erasure
router.delete('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    await transaction(async (client) => {
      // Delete all user-related data in dependency order
      await client.query('DELETE FROM territories WHERE owner_id = $1', [userId]);
      await client.query('DELETE FROM quest_progress WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM quests WHERE creator_id = $1', [userId]);
      await client.query('DELETE FROM echo_likes WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM echos WHERE creator_id = $1', [userId]);
      await client.query('DELETE FROM challenge_submissions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM challenges WHERE creator_id = $1', [userId]);
      await client.query('DELETE FROM pets WHERE owner_id = $1', [userId]);
      await client.query('DELETE FROM route_visits WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM routes WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_titles WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM feed_events WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM reports WHERE reporter_id = $1', [userId]);
      await client.query('DELETE FROM clan_members WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

      // Finally delete the user row itself
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    return res.json({ success: true, message: 'Account and all data deleted' });
  } catch (err: any) {
    console.error('[Users] Account deletion error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete account' });
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
      return res.status(404).json({ success: false, message: 'User not found' });
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
    return res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

// PUT /api/users/me/push-token - Store FCM push token for notifications
router.put('/me/push-token', authenticate, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    await query('UPDATE users SET push_token = $1 WHERE id = $2', [token, req.userId]);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Users] Update push token error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update push token' });
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
      return res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  }
);

// PUT /api/users/me/home-zone - Set home zone location
router.put('/me/home-zone', authenticate, async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'lat and lng are required as numbers',
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
      });
    }

    await balanceService.setHomeZone(req.userId!, lat, lng);

    return res.json({
      success: true,
      message: 'Home zone set',
      data: { lat, lng, radius_m: 200 },
    });
  } catch (err: any) {
    console.error('[Users] Set home zone error:', err);
    return res.status(500).json({ success: false, message: 'Failed to set home zone' });
  }
});

// DELETE /api/users/me/home-zone - Remove home zone
router.delete('/me/home-zone', authenticate, async (req: Request, res: Response) => {
  try {
    await query(
      'UPDATE users SET home_zone_lat = NULL, home_zone_lng = NULL WHERE id = $1',
      [req.userId]
    );

    return res.json({
      success: true,
      data: { home_zone_lat: null, home_zone_lng: null },
    });
  } catch (err: any) {
    console.error('[Users] Remove home zone error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove home zone' });
  }
});

export const usersRouter = router;
export default router;

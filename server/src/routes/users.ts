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
import { xpForLevel } from '../config/constants';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ---- Multer for avatar uploads ----
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar-${Date.now()}-${Math.floor(Math.random() * 1e9)}${ext}`);
  },
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/users/me - Get current user's full profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await queryOne(
      `SELECT id, username, email, level, xp, streak_days, last_active,
              reputation, settings, created_at, avatar_url, territory_color
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

    // Compute XP progress within current level
    const userLevel = user.level || 1;
    const totalXp = parseInt(user.xp) || 0;
    let xpAccumulated = 0;
    for (let i = 1; i < userLevel; i++) {
      xpAccumulated += xpForLevel(i);
    }
    const xpInLevel = Math.max(0, totalXp - xpAccumulated);
    const xpNeededForLevel = xpForLevel(userLevel);

    return res.json({
      success: true,
      data: {
        ...user,
        xp_in_level: xpInLevel,
        xp_to_next_level: xpNeededForLevel,
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

// PUT /api/users/me/color - Change territory color
router.put('/me/color', authenticate, async (req: Request, res: Response) => {
  try {
    const { color } = req.body;
    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return res.status(400).json({ success: false, message: 'Ungültige Farbe. Format: #RRGGBB' });
    }
    await query('UPDATE users SET territory_color = $1 WHERE id = $2', [color, req.userId]);
    return res.json({ success: true, data: { territory_color: color } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Farbe konnte nicht geändert werden' });
  }
});

// PUT /api/users/me/username - Change username
router.put('/me/username', authenticate, async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'Username ist erforderlich' });
    }
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      return res.status(400).json({ success: false, message: 'Username muss 3-30 Zeichen lang sein' });
    }
    if (!/^[a-zA-Z0-9_.\-äöüÄÖÜß]+$/.test(trimmed)) {
      return res.status(400).json({ success: false, message: 'Username darf nur Buchstaben, Zahlen, _, . und - enthalten' });
    }
    // Check uniqueness
    const existing = await queryOne('SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2', [trimmed, req.userId]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Dieser Username ist bereits vergeben' });
    }
    await query('UPDATE users SET username = $1 WHERE id = $2', [trimmed, req.userId]);
    return res.json({ success: true, data: { username: trimmed } });
  } catch (err: any) {
    console.error('[Users] Username change error:', err);
    return res.status(500).json({ success: false, message: 'Username konnte nicht geändert werden' });
  }
});

// PUT /api/users/me/avatar - Upload profile picture
router.put('/me/avatar', authenticate, avatarUpload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.userId]);
    return res.json({ success: true, data: { avatar_url: avatarUrl } });
  } catch (err: any) {
    console.error('[Users] Avatar upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload avatar' });
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
      friendships,
      clanMessages,
      ratings,
      travelRoutes,
      duels,
      raceAttempts,
      bounties,
      aliases,
      meetupMessages,
      feedEvents,
    ] = await Promise.all([
      queryOne(
        `SELECT id, username, email, level, xp, streak_days, last_active,
                reputation, settings, created_at
         FROM users WHERE id = $1`,
        [userId],
      ),
      queryMany('SELECT * FROM territories WHERE owner_id = $1', [userId]),
      queryMany('SELECT * FROM quests WHERE creator_id = $1', [userId]),
      queryMany('SELECT * FROM quest_progress WHERE user_id = $1', [userId]),
      queryMany('SELECT * FROM echos WHERE creator_id = $1', [userId]),
      queryMany('SELECT * FROM challenges WHERE creator_id = $1', [userId]),
      queryMany('SELECT * FROM challenge_submissions WHERE user_id = $1', [userId]),
      queryMany('SELECT * FROM pets WHERE owner_id = $1', [userId]),
      queryMany('SELECT * FROM routes WHERE user_id = $1', [userId]),
      queryMany('SELECT * FROM user_titles WHERE user_id = $1', [userId]),
      queryMany('SELECT * FROM notifications WHERE user_id = $1', [userId]),
      queryMany('SELECT * FROM friendships WHERE user_a = $1 OR user_b = $1', [userId]),
      queryMany('SELECT id, clan_id, message, created_at FROM clan_messages WHERE sender_id = $1', [userId]),
      queryMany('SELECT * FROM ratings WHERE user_id = $1', [userId]),
      queryMany('SELECT * FROM travel_routes WHERE founder_id = $1', [userId]),
      queryMany('SELECT * FROM duels WHERE challenger_id = $1 OR defender_id = $1', [userId]),
      queryMany('SELECT * FROM race_attempts WHERE user_id = $1', [userId]),
      queryMany('SELECT * FROM bounties WHERE issuer_id = $1 OR target_id = $1', [userId]),
      queryMany('SELECT * FROM aliases WHERE user_id = $1', [userId]),
      queryMany('SELECT id, meetup_id, message, created_at FROM meetup_messages WHERE sender_id = $1', [userId]),
      queryMany('SELECT * FROM feed_events WHERE user_id = $1', [userId]),
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
        friendships,
        clan_messages: clanMessages,
        ratings,
        travel_routes: travelRoutes,
        duels,
        race_attempts: raceAttempts,
        bounties,
        aliases,
        meetup_messages: meetupMessages,
        feed_events: feedEvents,
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
      // Tables WITHOUT ON DELETE CASCADE must be explicitly cleaned

      // -- Social / friends / clans --
      await client.query('DELETE FROM friend_requests WHERE sender_id = $1 OR receiver_id = $1', [userId]);
      await client.query('DELETE FROM friendships WHERE user_a = $1 OR user_b = $1', [userId]);
      await client.query('DELETE FROM blocked_users WHERE blocker_id = $1 OR blocked_id = $1', [userId]);
      await client.query('DELETE FROM clan_invitations WHERE inviter_id = $1 OR invitee_id = $1', [userId]);
      await client.query('DELETE FROM clan_join_requests WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM clan_invite_codes WHERE created_by = $1', [userId]);
      await client.query('DELETE FROM clan_messages WHERE sender_id = $1', [userId]);
      await client.query('DELETE FROM clan_members WHERE user_id = $1', [userId]);
      await client.query("UPDATE clans SET leader_id = NULL WHERE leader_id = $1", [userId]);

      // -- Meetups --
      await client.query('DELETE FROM meetup_messages WHERE sender_id = $1', [userId]);
      await client.query('DELETE FROM meetup_attendees WHERE user_id = $1', [userId]);
      await client.query("UPDATE meetup_events SET creator_id = NULL WHERE creator_id = $1", [userId]);

      // -- Games / duels / races / bounties --
      await client.query('DELETE FROM game_moves WHERE player_id = $1', [userId]);
      await client.query("UPDATE territory_games SET defender_id = NULL WHERE defender_id = $1", [userId]);
      await client.query("UPDATE territory_games SET challenger_id = NULL WHERE challenger_id = $1", [userId]);
      await client.query("UPDATE territory_games SET current_turn = NULL WHERE current_turn = $1", [userId]);
      await client.query("UPDATE territory_games SET winner_id = NULL WHERE winner_id = $1", [userId]);
      await client.query('DELETE FROM defense_attempts WHERE challenger_id = $1', [userId]);
      await client.query("UPDATE territory_defenses SET owner_id = NULL WHERE owner_id = $1", [userId]);
      await client.query("UPDATE duels SET challenger_id = NULL WHERE challenger_id = $1", [userId]);
      await client.query("UPDATE duels SET defender_id = NULL WHERE defender_id = $1", [userId]);
      await client.query("UPDATE duels SET winner_id = NULL WHERE winner_id = $1", [userId]);
      await client.query('DELETE FROM race_attempts WHERE user_id = $1', [userId]);
      await client.query("UPDATE race_tracks SET creator_id = NULL WHERE creator_id = $1", [userId]);
      await client.query("UPDATE race_tracks SET best_time_user_id = NULL WHERE best_time_user_id = $1", [userId]);
      await client.query("UPDATE bounties SET issuer_id = NULL WHERE issuer_id = $1", [userId]);
      await client.query("UPDATE bounties SET target_id = NULL WHERE target_id = $1", [userId]);
      await client.query("UPDATE bounties SET claimed_by = NULL WHERE claimed_by = $1", [userId]);
      await client.query("UPDATE game_events SET winner_id = NULL WHERE winner_id = $1", [userId]);

      // -- Traps / aliases / loot --
      await client.query('DELETE FROM traps WHERE owner_id = $1', [userId]);
      await client.query("UPDATE traps SET triggered_by = NULL WHERE triggered_by = $1", [userId]);
      await client.query('DELETE FROM aliases WHERE user_id = $1', [userId]);
      await client.query("UPDATE aliases SET revealed_by = NULL WHERE revealed_by = $1", [userId]);
      await client.query("UPDATE loot_drops SET collected_by = NULL WHERE collected_by = $1", [userId]);

      // -- Travel / places / artifacts / zones --
      await client.query('DELETE FROM ratings WHERE user_id = $1', [userId]);
      await client.query("UPDATE travel_routes SET founder_id = NULL WHERE founder_id = $1", [userId]);
      await client.query("UPDATE travel_spots SET created_by = NULL WHERE created_by = $1", [userId]);
      await client.query("UPDATE artifacts SET creator_id = NULL WHERE creator_id = $1", [userId]);
      await client.query('DELETE FROM place_history WHERE user_id = $1', [userId]);
      await client.query("UPDATE silent_zones SET created_by = NULL WHERE created_by = $1", [userId]);
      await client.query("UPDATE resonance_spots SET discovered_by = NULL WHERE discovered_by = $1", [userId]);
      await client.query("UPDATE monuments SET user_id = NULL WHERE user_id = $1", [userId]);
      await client.query("UPDATE invites SET inviter_id = NULL WHERE inviter_id = $1", [userId]);
      await client.query("UPDATE invites SET invitee_id = NULL WHERE invitee_id = $1", [userId]);

      // -- Core game data --
      // Soft-delete territories: preserve history for future analysis
      await client.query('UPDATE territories SET owner_id = NULL, decay_level = 1.0 WHERE owner_id = $1', [userId]);
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

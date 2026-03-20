// ============================================================
// Echo Routes
// GET    /api/echos         - Get nearby echos
// POST   /api/echos         - Create echo (multipart for audio)
// POST   /api/echos/:id/like - Like an echo (extends expiry)
// DELETE /api/echos/:id      - Delete own echo
// ============================================================

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createEchoSchema } from '../middleware/validation';
import { echoLimiter } from '../middleware/rateLimit';
import { queryMany, queryOne, query } from '../config/database';

// ---- Inline WKT helper ----
function pointToWkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}
import { awardXp } from '../services/progressionEngine';
import { incrementLeaderboardScore } from '../services/leaderboardService';
import { DECAY, XP, UNLOCK_LEVELS } from '../config/constants';
import { recordEvent } from '../services/placeMemoryService';
import { isNightTime } from '../utils/geo';
import { isInSilentZone } from '../services/silentZoneService';
import { resonanceService } from '../services/resonanceService';
import { wsService } from '../services/wsService';
import { resetDecayAtPoint } from '../services/decayEngine';

const router = Router();

// ---- Multer setup for echo media uploads (audio, photo, video) ----
const echoUploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/echos'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `echo-${uniqueSuffix}${ext}`);
  },
});

const echoUpload = multer({
  storage: echoUploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max (video can be larger)
  fileFilter: (_req, file, cb) => {
    const allowed = /^(audio|image|video)\//;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio, image, and video files are allowed'));
    }
  },
});

/**
 * GET /api/echos
 * Get nearby echos that are active and not expired.
 * Query params: lat, lng, radius (meters, default 5000)
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusM = Math.min(parseFloat(req.query.radius as string) || 5000, 50000);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng query parameters required',
      });
    }

    const locationWkt = pointToWkt(lat, lng);

    // Night Layer: filter by time_window
    const timeWindow = isNightTime() ? 'night' : 'day';

    const echos = await queryMany(
      `SELECT e.id, e.creator_id, e.radius_m, e.audio_url, e.likes,
              e.expires_at, e.created_at, e.time_window,
              e.media_type, e.media_url, e.caption,
              u.username as creator_username,
              ST_Y(e.location) as lat, ST_X(e.location) as lng,
              ST_Distance(e.location::geography, ST_GeomFromEWKT($1)::geography) as distance_m
       FROM echos e
       LEFT JOIN users u ON e.creator_id = u.id
       WHERE e.status = 'active'
       AND e.expires_at > NOW()
       AND ST_DWithin(e.location::geography, ST_GeomFromEWKT($1)::geography, $2)
       AND (e.time_window = 'any' OR e.time_window = $3)
       ORDER BY distance_m ASC
       LIMIT 100`,
      [locationWkt, radiusM, timeWindow]
    );

    return res.json({
      success: true,
      data: {
        echos: echos.map(e => ({
          ...e,
          distance_m: parseFloat(e.distance_m || '0'),
        })),
      },
    });
  } catch (err: any) {
    console.error('[Echos] Get echos error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get echos' });
  }
});

/**
 * POST /api/echos
 * Create an echo. Supports multipart upload for audio file, or audio_url in body.
 */
router.post(
  '/',
  authenticate,
  echoLimiter,
  echoUpload.single('media'),
  async (req: Request, res: Response) => {
    try {
      // Extract location from body (support both nested and flat)
      const lat = parseFloat(req.body.lat ?? req.body.location?.lat);
      const lng = parseFloat(req.body.lng ?? req.body.location?.lng);
      const radius_m = parseFloat(req.body.radius_m) || 40;

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: 'Location (lat, lng) is required',
        });
      }

      // Check: user must own territory at location OR be Creator level (16+)
      const userLevel = await queryOne<{ level: number }>('SELECT level FROM users WHERE id = $1', [req.userId]);
      const ownsTerritory = await queryOne<{ id: string }>(
        `SELECT id FROM territories WHERE owner_id = $1
         AND ST_Contains(polygon, ST_SetSRID(ST_MakePoint($2, $3), 4326))`,
        [req.userId, lng, lat]
      );
      if (!ownsTerritory && (!userLevel || userLevel.level < UNLOCK_LEVELS.creator)) {
        return res.status(403).json({
          success: false,
          message: `You must own territory at this location or be Creator level (${UNLOCK_LEVELS.creator}+)`,
        });
      }

      // Check if location is in a Silent Zone
      const inSilentZone = await isInSilentZone(lat, lng);
      if (inSilentZone) {
        return res.status(403).json({
          success: false,
          error: 'This location is in a Silent Zone. Echos are not allowed here, but you can place artifacts instead.',
        });
      }

      // Determine media type: audio (default), photo, or video
      const media_type = req.body.media_type || 'audio';
      const caption = req.body.caption || null;

      // Determine URLs based on media type and uploaded file
      let audio_url: string | null = null;
      let media_url: string | null = null;

      if (req.file) {
        const uploadPath = `/uploads/echos/${req.file.filename}`;
        if (media_type === 'audio') {
          audio_url = uploadPath;
        } else {
          media_url = uploadPath;
        }
      } else {
        // Accept URL from body
        if (media_type === 'audio') {
          audio_url = req.body.audio_url || null;
        } else {
          media_url = req.body.media_url || null;
        }
      }

      // Validate that at least one media source is provided
      if (media_type === 'audio' && !audio_url) {
        return res.status(400).json({
          success: false,
          error: 'Audio file or audio_url is required for audio echos',
        });
      }

      if ((media_type === 'photo' || media_type === 'video') && !media_url) {
        return res.status(400).json({
          success: false,
          error: `${media_type === 'photo' ? 'Photo' : 'Video'} file or media_url is required`,
        });
      }

      const locationWkt = pointToWkt(lat, lng);

      // Optional time_window for Night Layer
      const time_window = req.body.time_window || 'any';

      // Calculate expiry: 48h from now (base)
      const expiresAt = new Date(Date.now() + DECAY.ECHO.BASE_HOURS * 3600 * 1000);

      const echo = await queryOne(
        `INSERT INTO echos (creator_id, location, radius_m, audio_url, media_type, media_url, caption, expires_at, time_window)
         VALUES ($1, ST_GeomFromEWKT($2), $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, radius_m, audio_url, media_type, media_url, caption, likes, expires_at, status, created_at, time_window`,
        [req.userId, locationWkt, radius_m, audio_url, media_type, media_url, caption, expiresAt, time_window]
      );

      if (!echo) {
        return res.status(500).json({ success: false, message: 'Failed to create echo' });
      }

      // Reset territory decay at this location (content activity keeps territories alive)
      try {
        await resetDecayAtPoint(lat, lng);
      } catch (_err) {
        // Decay reset is non-critical
      }

      // Award instant XP for echo drop
      const xpResult = await awardXp(req.userId!, XP.ECHO_DROP_INSTANT, 'echo_drop');

      // Log to feed
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('echo_drop', $1, $2)`,
        [req.userId, JSON.stringify({ echo_id: echo.id, lat, lng })]
      );

      // Record place memory event
      const echoCreator = await queryOne<{ username: string }>('SELECT username FROM users WHERE id = $1', [req.userId]);
      recordEvent(lat, lng, 'echo_created', req.userId!, echoCreator?.username ?? null, { echo_id: echo.id });

      // Check for resonance (cross-content synergy)
      let resonanceResult = null;
      try {
        const resonance = await resonanceService.checkResonance(lat, lng, 'echo', req.userId!);
        if (resonance.resonance) {
          resonanceResult = resonance;
          wsService.sendToUser(req.userId!, 'resonance_discovered', {
            title: 'Resonance Discovered!',
            body: `Your echo created a ${resonance.bonus}x bonus spot!`,
            types: resonance.types,
            level: resonance.level,
            bonus: resonance.bonus,
            lat,
            lng,
          });
        }
      } catch (_err) {
        // Resonance check is non-critical
      }

      return res.status(201).json({
        success: true,
        data: {
          echo: { ...echo, lat, lng },
          xp_earned: XP.ECHO_DROP_INSTANT,
          new_level: xpResult.leveledUp ? xpResult.level : undefined,
          resonance: resonanceResult,
        },
      });
    } catch (err: any) {
      console.error('[Echos] Create echo error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create echo' });
    }
  }
);

/**
 * POST /api/echos/:id/like
 * Like an echo. Extends its expiry by LIKE_BONUS_HOURS.
 * Cannot like your own echo. Each like adds time, capped at MAX_DAYS.
 */
router.post('/:id/like', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get echo (include location for decay reset)
    const echo = await queryOne<{
      id: string;
      creator_id: string;
      likes: number;
      expires_at: Date;
      status: string;
      lat: number;
      lng: number;
    }>(
      `SELECT id, creator_id, likes, expires_at, status,
              ST_Y(location) as lat, ST_X(location) as lng
       FROM echos WHERE id = $1 AND status = 'active'`,
      [id]
    );

    if (!echo) {
      return res.status(404).json({ success: false, message: 'Echo not found or expired' });
    }

    // Check expired
    if (new Date(echo.expires_at) < new Date()) {
      return res.status(410).json({ success: false, message: 'Echo has expired' });
    }

    // Cannot like own echo
    if (echo.creator_id === req.userId) {
      return res.status(400).json({ success: false, message: 'Cannot like your own echo' });
    }

    // Check if user already liked this echo
    const alreadyLiked = await queryOne(
      'SELECT echo_id FROM echo_likes WHERE echo_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (alreadyLiked) {
      return res.status(409).json({ success: false, message: 'Already liked this echo' });
    }

    // Record the like
    await query(
      'INSERT INTO echo_likes (echo_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, req.userId]
    );

    // Calculate new expiry: extend by LIKE_BONUS_HOURS, capped at MAX_DAYS from now
    const maxExpiry = new Date(Date.now() + DECAY.ECHO.MAX_DAYS * 24 * 3600 * 1000);
    const extendedExpiry = new Date(
      new Date(echo.expires_at).getTime() + DECAY.ECHO.LIKE_BONUS_HOURS * 3600 * 1000
    );
    const newExpiry = new Date(Math.min(extendedExpiry.getTime(), maxExpiry.getTime()));

    // Increment likes and update expiry
    const updated = await queryOne<{ likes: number; expires_at: Date }>(
      `UPDATE echos
       SET likes = likes + 1, expires_at = $1
       WHERE id = $2
       RETURNING likes, expires_at`,
      [newExpiry, id]
    );

    // Reset territory decay at the echo's location (engagement keeps territories alive)
    try {
      await resetDecayAtPoint(echo.lat, echo.lng);
    } catch (_err) {
      // Decay reset is non-critical
    }

    // Check if echo creator should get bonus XP (crossed popular threshold)
    const newLikes = updated?.likes || echo.likes + 1;
    if (newLikes === XP.ECHO_POPULAR_THRESHOLD && echo.creator_id) {
      await awardXp(echo.creator_id, XP.ECHO_DROP_POPULAR, 'echo_popular');
      await incrementLeaderboardScore('echo_master', echo.creator_id, 1);
    }

    return res.json({
      success: true,
      data: {
        likes: newLikes,
        expires_at: updated?.expires_at || newExpiry,
      },
    });
  } catch (err: any) {
    console.error('[Echos] Like echo error:', err);
    return res.status(500).json({ success: false, message: 'Failed to like echo' });
  }
});

/**
 * DELETE /api/echos/:id
 * Delete own echo. Sets status to 'deleted'.
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      "UPDATE echos SET status = 'deleted' WHERE id = $1 AND creator_id = $2 RETURNING id",
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Echo not found or not yours' });
    }

    return res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (err: any) {
    console.error('[Echos] Delete echo error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete echo' });
  }
});

export const echosRouter = router;
export default router;

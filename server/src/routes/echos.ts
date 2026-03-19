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
import { DECAY, XP } from '../config/constants';

const router = Router();

// ---- Multer setup for audio file uploads ----
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max for audio
  fileFilter: (_req, file, cb) => {
    const allowed = /^audio\//;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
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

    const echos = await queryMany(
      `SELECT e.id, e.creator_id, e.radius_m, e.audio_url, e.likes,
              e.expires_at, e.created_at,
              u.username as creator_username,
              ST_Y(e.location) as lat, ST_X(e.location) as lng,
              ST_Distance(e.location::geography, ST_GeomFromEWKT($1)::geography) as distance_m
       FROM echos e
       LEFT JOIN users u ON e.creator_id = u.id
       WHERE e.status = 'active'
       AND e.expires_at > NOW()
       AND ST_DWithin(e.location::geography, ST_GeomFromEWKT($1)::geography, $2)
       ORDER BY distance_m ASC
       LIMIT 100`,
      [locationWkt, radiusM]
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
  echoUpload.single('audio'),
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

      // Determine audio URL: uploaded file or from body
      let audio_url = req.body.audio_url;
      if (req.file) {
        audio_url = `/uploads/echos/${req.file.filename}`;
      }

      if (!audio_url) {
        return res.status(400).json({
          success: false,
          error: 'Audio file or audio_url is required',
        });
      }

      const locationWkt = pointToWkt(lat, lng);

      // Calculate expiry: 48h from now (base)
      const expiresAt = new Date(Date.now() + DECAY.ECHO.BASE_HOURS * 3600 * 1000);

      const echo = await queryOne(
        `INSERT INTO echos (creator_id, location, radius_m, audio_url, expires_at)
         VALUES ($1, ST_GeomFromEWKT($2), $3, $4, $5)
         RETURNING id, radius_m, audio_url, likes, expires_at, status, created_at`,
        [req.userId, locationWkt, radius_m, audio_url, expiresAt]
      );

      if (!echo) {
        return res.status(500).json({ success: false, message: 'Failed to create echo' });
      }

      // Award instant XP for echo drop
      const xpResult = await awardXp(req.userId!, XP.ECHO_DROP_INSTANT, 'echo_drop');

      // Log to feed
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('echo_drop', $1, $2)`,
        [req.userId, JSON.stringify({ echo_id: echo.id, lat, lng })]
      );

      return res.status(201).json({
        success: true,
        data: {
          echo: { ...echo, lat, lng },
          xp_earned: XP.ECHO_DROP_INSTANT,
          new_level: xpResult.leveledUp ? xpResult.level : undefined,
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

    // Get echo
    const echo = await queryOne<{
      id: string;
      creator_id: string;
      likes: number;
      expires_at: Date;
      status: string;
    }>(
      "SELECT id, creator_id, likes, expires_at, status FROM echos WHERE id = $1 AND status = 'active'",
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

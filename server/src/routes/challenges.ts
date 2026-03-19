// ============================================================
// Challenge Routes
// GET  /api/challenges             - Get nearby challenges
// POST /api/challenges             - Create challenge
// GET  /api/challenges/:id         - Get challenge details
// POST /api/challenges/:id/submit  - Submit challenge proof
// ============================================================

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createChallengeSchema, submitChallengeSchema } from '../middleware/validation';
import { queryMany, queryOne, query } from '../config/database';
import { haversineDistance } from '../utils/geo';

// ---- Inline WKT helper ----
function pointToWkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}
import { awardXp, calculateChallengeXp } from '../services/progressionEngine';

const router = Router();

// ---- Multer setup for video/photo proof ----
const challengeUploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/challenges'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `challenge-${uniqueSuffix}${ext}`);
  },
});

const challengeUpload = multer({
  storage: challengeUploadStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB for videos
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image|video)\//;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

/**
 * GET /api/challenges
 * Get nearby challenges with optional filters.
 * Query params: lat, lng, radius (m), class, template, page, limit
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusM = Math.min(parseFloat(req.query.radius as string) || 5000, 50000);
    const template = req.query.template as string;
    const classFilter = req.query.class as string;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng query parameters required',
      });
    }

    const locationWkt = pointToWkt(lat, lng);
    const params: any[] = [locationWkt, radiusM];
    let paramIdx = 3;
    const filters: string[] = [];

    if (template) {
      filters.push(`c.template = $${paramIdx}`);
      params.push(template);
      paramIdx++;
    }

    if (classFilter) {
      filters.push(`(c.class = $${paramIdx} OR c.class IS NULL)`);
      params.push(classFilter);
      paramIdx++;
    }

    const extraWhere = filters.length > 0 ? 'AND ' + filters.join(' AND ') : '';

    const challenges = await queryMany(
      `SELECT c.id, c.creator_id, c.template, c.parameters,
              c.verification_level, c.class, c.total_completions,
              c.avg_rating, c.status, c.created_at,
              u.username as creator_username,
              ST_Y(c.location) as lat, ST_X(c.location) as lng,
              ST_Distance(c.location::geography, ST_GeomFromEWKT($1)::geography) as distance_m
       FROM challenges c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.status = 'active'
       AND ST_DWithin(c.location::geography, ST_GeomFromEWKT($1)::geography, $2)
       ${extraWhere}
       ORDER BY distance_m ASC
       LIMIT 100`,
      params
    );

    return res.json({
      success: true,
      data: {
        challenges: challenges.map(c => ({
          ...c,
          distance_m: parseFloat(c.distance_m || '0'),
        })),
      },
    });
  } catch (err: any) {
    console.error('[Challenges] Get challenges error:', err);
    return res.status(500).json({ success: false, error: 'Failed to get challenges' });
  }
});

/**
 * POST /api/challenges
 * Create a new challenge at a location.
 */
router.post(
  '/',
  authenticate,
  validateBody(createChallengeSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        template,
        parameters,
        verification_level,
        class: cls,
      } = req.body;

      // Extract location from nested or flat format
      const lat = req.body.lat ?? req.body.location?.lat;
      const lng = req.body.lng ?? req.body.location?.lng;

      if (lat === undefined || lng === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Location (lat, lng) is required',
        });
      }

      const locationWkt = pointToWkt(lat, lng);

      const challenge = await queryOne(
        `INSERT INTO challenges (creator_id, template, location, parameters, verification_level, class)
         VALUES ($1, $2, ST_GeomFromEWKT($3), $4, $5, $6)
         RETURNING id, template, parameters, verification_level, class,
                   total_completions, avg_rating, status, created_at`,
        [req.userId, template, locationWkt, JSON.stringify(parameters), verification_level, cls || null]
      );

      if (!challenge) {
        return res.status(500).json({ success: false, error: 'Failed to create challenge' });
      }

      return res.status(201).json({
        success: true,
        data: {
          challenge: { ...challenge, lat, lng },
        },
      });
    } catch (err: any) {
      console.error('[Challenges] Create challenge error:', err);
      return res.status(500).json({ success: false, error: 'Failed to create challenge' });
    }
  }
);

/**
 * GET /api/challenges/:id
 * Get challenge details with submission stats.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const challenge = await queryOne(
      `SELECT c.id, c.creator_id, c.template, c.parameters,
              c.verification_level, c.class, c.total_completions,
              c.avg_rating, c.status, c.created_at,
              u.username as creator_username,
              ST_Y(c.location) as lat, ST_X(c.location) as lng
       FROM challenges c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    // Check if current user has submitted
    const userSubmission = await queryOne(
      'SELECT id, verified, submitted_at FROM challenge_submissions WHERE challenge_id = $1 AND user_id = $2 ORDER BY submitted_at DESC LIMIT 1',
      [id, req.userId]
    );

    // Get recent submissions
    const recentSubmissions = await queryMany(
      `SELECT cs.id, cs.user_id, cs.verified, cs.submitted_at,
              u.username
       FROM challenge_submissions cs
       JOIN users u ON cs.user_id = u.id
       WHERE cs.challenge_id = $1 AND cs.verified = TRUE
       ORDER BY cs.submitted_at DESC
       LIMIT 10`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...challenge,
        my_submission: userSubmission || null,
        recent_completions: recentSubmissions,
      },
    });
  } catch (err: any) {
    console.error('[Challenges] Get challenge error:', err);
    return res.status(500).json({ success: false, error: 'Failed to get challenge' });
  }
});

/**
 * POST /api/challenges/:id/submit
 * Submit proof of challenge completion. Supports multipart upload for video/photo.
 */
router.post(
  '/:id/submit',
  authenticate,
  challengeUpload.single('media'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Parse body fields (may be strings from multipart)
      const lat = parseFloat(req.body.lat);
      const lng = parseFloat(req.body.lng);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: 'lat and lng are required',
        });
      }

      // Determine media URL
      let media_url = req.body.media_url || null;
      if (req.file) {
        media_url = `/uploads/challenges/${req.file.filename}`;
      }

      // Get challenge
      const challenge = await queryOne<{
        id: string;
        creator_id: string;
        verification_level: number;
        template: string;
        parameters: any;
        lat: number;
        lng: number;
      }>(
        `SELECT id, creator_id, verification_level, template, parameters,
                ST_Y(location) as lat, ST_X(location) as lng
         FROM challenges
         WHERE id = $1 AND status = 'active'`,
        [id]
      );

      if (!challenge) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found or not active',
        });
      }

      // Cannot submit own challenge
      if (challenge.creator_id === req.userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot complete your own challenge',
        });
      }

      // Verify proximity (must be within 200m)
      const distance = haversineDistance(lat, lng, challenge.lat, challenge.lng);
      if (distance > 200) {
        return res.status(400).json({
          success: false,
          error: `Too far from challenge location (${Math.round(distance)}m away, max 200m)`,
        });
      }

      // Auto-verify based on verification level (1-2 = auto, 3 = manual review)
      const verified = challenge.verification_level <= 2;

      // Create submission record
      const submission = await queryOne(
        `INSERT INTO challenge_submissions (challenge_id, user_id, media_url, verified)
         VALUES ($1, $2, $3, $4)
         RETURNING id, verified, submitted_at`,
        [id, req.userId, media_url, verified]
      );

      let xpEarned = 0;

      if (verified) {
        // Update challenge completion count
        await query(
          'UPDATE challenges SET total_completions = total_completions + 1 WHERE id = $1',
          [id]
        );

        // Award XP
        xpEarned = calculateChallengeXp(challenge.verification_level);
        await awardXp(req.userId!, xpEarned, 'challenge_complete');

        // Log to feed
        await query(
          `INSERT INTO feed_events (type, user_id, data)
           VALUES ('challenge_complete', $1, $2)`,
          [req.userId, JSON.stringify({ challenge_id: id, template: challenge.template })]
        );
      }

      return res.json({
        success: true,
        data: {
          submission,
          xp_earned: xpEarned,
          message: verified
            ? 'Challenge completed!'
            : 'Submission received. Pending manual verification.',
        },
      });
    } catch (err: any) {
      console.error('[Challenges] Submit challenge error:', err);
      return res.status(500).json({ success: false, error: 'Failed to submit challenge' });
    }
  }
);

export const challengesRouter = router;
export default router;

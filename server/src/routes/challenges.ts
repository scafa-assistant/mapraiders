// ============================================================
// Challenge Routes
// GET  /api/challenges                  - Get nearby challenges
// POST /api/challenges                  - Create challenge
// GET  /api/challenges/:id              - Get challenge details
// POST /api/challenges/:id/submit       - Submit challenge proof
// GET  /api/challenges/:id/submissions  - Get challenge submissions
// POST /api/challenges/:id/submissions/:sid/verify - Verify submission
// ============================================================

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createChallengeSchema, submitChallengeSchema } from '../middleware/validation';
import { queryOne, queryMany } from '../config/database';
import {
  challengeEngine,
  getSubmissions,
  verifySubmission,
} from '../services/challengeEngine';

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
 * Get challenges with optional filters.
 * Supports two modes:
 *   - BBox: north, south, east, west (show all challenges in viewport)
 *   - Proximity: lat, lng, radius (m)
 * Additional filters: class, template, weather
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { north, south, east, west } = req.query;
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusM = Math.min(parseFloat(req.query.radius as string) || 5000, 50000);
    const currentWeather = req.query.weather as string | undefined;

    let challenges: any[];

    if (north && south && east && west) {
      // BBox mode — show all challenges in viewport
      challenges = await challengeEngine.getInBounds(
        parseFloat(north as string),
        parseFloat(south as string),
        parseFloat(east as string),
        parseFloat(west as string),
        currentWeather
      );
    } else if (!isNaN(lat) && !isNaN(lng)) {
      // Proximity mode — nearby challenges
      challenges = await challengeEngine.getNearby(lat, lng, radiusM, currentWeather);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provide either bbox (north/south/east/west) or lat/lng params',
      });
    }

    // Apply optional client-side filters (template, class)
    const template = req.query.template as string;
    const classFilter = req.query.class as string;

    let filtered = challenges;
    if (template) {
      filtered = filtered.filter((c: any) => c.template === template);
    }
    if (classFilter) {
      filtered = filtered.filter((c: any) => c.class === classFilter || !c.class);
    }

    return res.json({
      success: true,
      data: {
        challenges: filtered,
      },
    });
  } catch (err: any) {
    console.error('[Challenges] Get challenges error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get challenges' });
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
        weather_condition,
        time_window,
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

      const challenge = await challengeEngine.createChallenge(req.userId!, {
        template,
        lat,
        lng,
        parameters,
        verification_level,
        class: cls,
        weather_condition,
        time_window,
      });

      return res.status(201).json({
        success: true,
        data: { challenge },
      });
    } catch (err: any) {
      console.error('[Challenges] Create challenge error:', err);

      // Surface validation errors as 400
      if (
        err.message?.includes('Invalid template') ||
        err.message?.includes('Missing required parameter') ||
        err.message?.includes('must be between') ||
        err.message?.includes('must be a number') ||
        err.message?.includes('must own a territory')
      ) {
        return res.status(400).json({ success: false, error: err.message });
      }

      return res.status(500).json({ success: false, message: 'Failed to create challenge' });
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

    const challenge = await challengeEngine.getChallenge(id as string);

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // Check if current user has submitted
    const userSubmission = await queryOne(
      'SELECT id, verified, submitted_at FROM challenge_submissions WHERE challenge_id = $1 AND user_id = $2 ORDER BY submitted_at DESC LIMIT 1',
      [id as string, req.userId]
    );

    // Get recent verified submissions
    const recentSubmissions = await queryMany(
      `SELECT cs.id, cs.user_id, cs.verified, cs.submitted_at,
              u.username
       FROM challenge_submissions cs
       JOIN users u ON cs.user_id = u.id
       WHERE cs.challenge_id = $1 AND cs.verified = TRUE
       ORDER BY cs.submitted_at DESC
       LIMIT 10`,
      [id as string]
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
    return res.status(500).json({ success: false, message: 'Failed to get challenge' });
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
      let media_url = req.body.media_url || undefined;
      if (req.file) {
        media_url = `/uploads/challenges/${req.file.filename}`;
      }

      // Parse optional sensor data
      let sensor_data: any;
      if (req.body.sensor_data) {
        try {
          sensor_data = typeof req.body.sensor_data === 'string'
            ? JSON.parse(req.body.sensor_data)
            : req.body.sensor_data;
        } catch {
          // Ignore invalid sensor data
        }
      }

      const result = await challengeEngine.submitAttempt(req.userId!, id as string, {
        lat,
        lng,
        media_url,
        sensor_data,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('[Challenges] Submit challenge error:', err);

      // Surface domain errors as 400/404
      if (err.message?.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      if (
        err.message?.includes('not active') ||
        err.message?.includes('Cannot complete your own') ||
        err.message?.includes('Too far') ||
        err.message?.includes('proof is required')
      ) {
        return res.status(400).json({ success: false, error: err.message });
      }

      return res.status(500).json({ success: false, message: 'Failed to submit challenge' });
    }
  }
);

/**
 * GET /api/challenges/:id/submissions
 * Get all submissions for a challenge.
 */
router.get('/:id/submissions', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const submissions = await getSubmissions(id as string);

    return res.json({
      success: true,
      data: { submissions },
    });
  } catch (err: any) {
    console.error('[Challenges] Get submissions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get submissions' });
  }
});

/**
 * POST /api/challenges/:id/submissions/:sid/verify
 * Admin/creator can approve or reject a video submission.
 */
router.post(
  '/:id/submissions/:sid/verify',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sid } = req.params;
      const { approved } = req.body;

      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: '"approved" (boolean) is required in the request body',
        });
      }

      const result = await verifySubmission(sid as string, approved, req.userId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('[Challenges] Verify submission error:', err);

      if (err.message?.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      if (err.message?.includes('Only the challenge creator')) {
        return res.status(403).json({ success: false, error: err.message });
      }

      return res.status(500).json({ success: false, message: 'Failed to verify submission' });
    }
  }
);

export const challengesRouter = router;
export default router;

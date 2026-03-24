// ============================================================
// Quest Routes
// GET  /api/quests                           - Get nearby quests
// POST /api/quests                           - Create quest
// GET  /api/quests/:id                       - Get quest with steps
// POST /api/quests/:id/start                 - Start a quest
// POST /api/quests/:id/steps/:stepId/verify  - Verify a step
// POST /api/quests/:id/rate                  - Rate a completed quest
// ============================================================

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createQuestSchema, rateQuestSchema, verifyStepSchema } from '../middleware/validation';
import {
  createQuest,
  startQuest,
  verifyStep,
  rateQuest,
  getQuestWithSteps,
} from '../services/questEngine';
import { seedQuestEngine } from '../services/seedQuestEngine';
import { queryMany, queryOne } from '../config/database';

// ---- Inline WKT helper ----
function pointToWkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

const router = Router();

// ---- Multer setup for photo/video uploads ----
const questUploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/quests'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `quest-${uniqueSuffix}${ext}`);
  },
});

const questUpload = multer({
  storage: questUploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
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
 * GET /api/quests
 * Get nearby quests with optional filters.
 * Query params: lat, lng, radius (meters), difficulty, type, status, page, limit
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusM = parseFloat(req.query.radius as string) || 5000;
    const difficulty = parseInt(req.query.difficulty as string);
    const stepType = req.query.type as string;
    const status = (req.query.status as string) || 'active';

    // BBox params
    const north = parseFloat(req.query.north as string);
    const south = parseFloat(req.query.south as string);
    const east = parseFloat(req.query.east as string);
    const west = parseFloat(req.query.west as string);
    const hasBbox = !isNaN(north) && !isNaN(south) && !isNaN(east) && !isNaN(west);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    // Allow higher limit for bbox mode to show more content on the map
    const maxLimit = hasBbox ? 200 : 100;
    const defaultLimit = hasBbox ? 200 : 20;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || defaultLimit), maxLimit);
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE q.status = $1';
    const params: any[] = [status];
    let paramIdx = 2;

    // Location filter: find quests that have at least one step in the area
    if (hasBbox) {
      // BBox mode — show all quests with steps in viewport
      whereClause += ` AND EXISTS (
        SELECT 1 FROM quest_steps qs
        WHERE qs.quest_id = q.id
        AND ST_Intersects(qs.location, ST_MakeEnvelope($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, 4326))
      )`;
      params.push(west, south, east, north);
      paramIdx += 4;
    } else if (!isNaN(lat) && !isNaN(lng)) {
      // Proximity mode — nearby quests
      whereClause += ` AND EXISTS (
        SELECT 1 FROM quest_steps qs
        WHERE qs.quest_id = q.id
        AND ST_DWithin(qs.location::geography, ST_GeomFromEWKT($${paramIdx})::geography, $${paramIdx + 1})
      )`;
      params.push(pointToWkt(lat, lng), radiusM);
      paramIdx += 2;
    }

    // Difficulty filter
    if (!isNaN(difficulty) && difficulty >= 1 && difficulty <= 10) {
      whereClause += ` AND q.difficulty = $${paramIdx}`;
      params.push(difficulty);
      paramIdx++;
    }

    // Step type filter
    if (stepType) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM quest_steps qs
        WHERE qs.quest_id = q.id AND qs.type = $${paramIdx}
      )`;
      params.push(stepType.toUpperCase());
      paramIdx++;
    }

    // Weather filter: only show quests matching current weather (or any-weather quests)
    const currentWeather = req.query.weather as string;
    if (currentWeather) {
      whereClause += ` AND (q.weather_condition IS NULL OR q.weather_condition = $${paramIdx})`;
      params.push(currentWeather);
      paramIdx++;
    }

    params.push(limit, offset);

    const quests = await queryMany(
      `SELECT q.id, q.creator_id, q.title, q.description, q.territory_id,
              q.difficulty, q.avg_rating, q.total_completions, q.status, q.created_at,
              q.weather_condition, q.is_seed, q.growth_level,
              u.username as creator_username,
              (SELECT COUNT(*) FROM quest_steps WHERE quest_id = q.id) as step_count
       FROM quests q
       LEFT JOIN users u ON q.creator_id = u.id
       ${whereClause}
       ORDER BY q.avg_rating DESC NULLS LAST, q.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    return res.json({
      success: true,
      data: { quests },
    });
  } catch (err: any) {
    console.error('[Quests] Get quests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get quests' });
  }
});

/**
 * POST /api/quests
 * Create a new quest. Creator must own the territory if territory_id is specified,
 * and must be at a sufficient level.
 */
router.post(
  '/',
  authenticate,
  validateBody(createQuestSchema),
  async (req: Request, res: Response) => {
    try {
      // Normalize steps: support both { location: {lat, lng} } and flat { lat, lng }
      const body = { ...req.body };
      if (body.steps) {
        body.steps = body.steps.map((step: any, idx: number) => ({
          ...step,
          lat: step.lat ?? step.location?.lat,
          lng: step.lng ?? step.location?.lng,
          step_order: step.step_order ?? idx + 1,
          // Map 'photo' to 'photo_gps' for internal consistency
          verification_type:
            step.verification_type === 'photo' ? 'photo_gps' : step.verification_type,
        }));
      }

      const quest = await createQuest(req.userId!, body);

      return res.status(201).json({
        success: true,
        data: { quest },
      });
    } catch (err: any) {
      console.error('[Quests] Create quest error:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to create quest',
      });
    }
  }
);

/**
 * GET /api/quests/:id
 * Get quest details with steps. Hides expected answers.
 * Includes the requesting user's progress if any.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const questId = req.params.id as string;
    const quest = await getQuestWithSteps(questId);

    // Check if user has progress on this quest
    const progress = await queryOne(
      `SELECT id, current_step, status, started_at, completed_at
       FROM quest_progress
       WHERE user_id = $1 AND quest_id = $2
       ORDER BY started_at DESC LIMIT 1`,
      [req.userId, questId]
    );

    // Sanitize steps: never reveal expected answers to the client
    const sanitizedSteps = quest.steps.map((step: any) => ({
      id: step.id,
      quest_id: step.quest_id,
      step_order: step.step_order,
      type: step.type,
      lat: step.lat,
      lng: step.lng,
      radius_m: step.radius_m,
      instruction: step.instruction,
      verification_type: step.verification_type,
      hint: step.hint,
      // expected_answer intentionally omitted
    }));

    // Include seed quest growth info if applicable
    let growthInfo = null;
    if ((quest as any).is_seed) {
      try {
        growthInfo = await seedQuestEngine.getGrowthInfo(questId);
      } catch (_err) {
        // Non-critical: growth info fetch failure should not block response
      }
    }

    return res.json({
      success: true,
      data: {
        id: quest.id,
        creator_id: quest.creator_id,
        title: quest.title,
        description: quest.description,
        territory_id: quest.territory_id,
        difficulty: quest.difficulty,
        avg_rating: quest.avg_rating,
        total_completions: quest.total_completions,
        status: quest.status,
        created_at: quest.created_at,
        is_seed: (quest as any).is_seed || false,
        growth_level: (quest as any).growth_level || 0,
        linked_quests: (quest as any).linked_quests || [],
        steps: sanitizedSteps,
        progress: progress || null,
        growth_info: growthInfo,
      },
    });
  } catch (err: any) {
    console.error('[Quests] Get quest error:', err);
    return res.status(404).json({
      success: false,
      error: err.message || 'Quest not found',
    });
  }
});

/**
 * POST /api/quests/:id/start
 * Start a quest. Creates a progress entry or returns existing one.
 */
router.post('/:id/start', authenticate, async (req: Request, res: Response) => {
  try {
    const progress = await startQuest(req.userId!, req.params.id as string);

    return res.json({
      success: true,
      data: { progress },
    });
  } catch (err: any) {
    console.error('[Quests] Start quest error:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to start quest',
    });
  }
});

/**
 * POST /api/quests/:id/steps/:stepId/verify
 * Verify a quest step. Supports multipart upload for photo/video proof.
 */
router.post(
  '/:id/steps/:stepId/verify',
  authenticate,
  questUpload.single('media'),
  async (req: Request, res: Response) => {
    try {
      // Build verification data
      const verificationData: any = {};

      // Parse body fields (may come as strings from multipart form)
      if (req.body.lat !== undefined) verificationData.lat = parseFloat(req.body.lat);
      if (req.body.lng !== undefined) verificationData.lng = parseFloat(req.body.lng);
      if (req.body.answer !== undefined) verificationData.answer = req.body.answer;
      if (req.body.media_url !== undefined) verificationData.media_url = req.body.media_url;

      // If a file was uploaded, set the media_url
      if (req.file) {
        verificationData.media_url = `/uploads/quests/${req.file.filename}`;
      }

      // Validate required lat/lng
      if (isNaN(verificationData.lat) || isNaN(verificationData.lng)) {
        return res.status(400).json({
          success: false,
          error: 'lat and lng are required for step verification',
        });
      }

      const result = await verifyStep(
        req.userId!,
        req.params.id as string,
        req.params.stepId as string,
        verificationData
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('[Quests] Verify step error:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Verification failed',
      });
    }
  }
);

/**
 * POST /api/quests/:id/rate
 * Rate a completed quest. User must have completed the quest first.
 */
router.post(
  '/:id/rate',
  authenticate,
  validateBody(rateQuestSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await rateQuest(req.userId!, req.params.id as string, req.body);

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('[Quests] Rate quest error:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to rate quest',
      });
    }
  }
);

export const questsRouter = router;
export default router;

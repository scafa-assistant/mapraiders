// ============================================================
// Race Routes
// POST /api/races              - Create a race track
// GET  /api/races              - Get nearby tracks
// GET  /api/races/:id          - Get track details + leaderboard
// POST /api/races/:id/start    - Start a race attempt
// POST /api/races/:id/complete - Complete a race attempt
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { raceEngine } from '../services/raceEngine';
import { MovementClass } from '../utils/types';

const router = Router();

/**
 * POST /api/races
 * Create a new race track from GPS points.
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, description, points, class: raceClass } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    if (!points || !Array.isArray(points) || points.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 GPS points are required' });
    }

    const track = await raceEngine.createTrack(
      req.userId!,
      name,
      description,
      points,
      (raceClass || 'runner') as MovementClass
    );

    return res.status(201).json({
      success: true,
      data: { track },
    });
  } catch (err: any) {
    console.error('[Races] Create track error:', err);

    if (
      err.message?.includes('required') ||
      err.message?.includes('must be') ||
      err.message?.includes('At least')
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to create race track' });
  }
});

/**
 * GET /api/races
 * Get nearby race tracks.
 * Query params: lat, lng, radius (m)
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = Math.min(parseFloat(req.query.radius as string) || 5000, 50000);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng query parameters required',
      });
    }

    const tracks = await raceEngine.getNearbyTracks(lat, lng, radius);

    return res.json({
      success: true,
      data: { tracks },
    });
  } catch (err: any) {
    console.error('[Races] Get nearby error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get nearby tracks' });
  }
});

/**
 * GET /api/races/:id
 * Get track details with leaderboard.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const track = await raceEngine.getTrack(req.params.id as string);

    if (!track) {
      return res.status(404).json({ success: false, message: 'Race track not found' });
    }

    const leaderboard = await raceEngine.getLeaderboard(req.params.id as string);

    return res.json({
      success: true,
      data: {
        ...track,
        leaderboard,
      },
    });
  } catch (err: any) {
    console.error('[Races] Get track error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get race track' });
  }
});

/**
 * POST /api/races/:id/start
 * Start a race attempt on a track.
 */
router.post('/:id/start', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await raceEngine.startAttempt(req.userId!, req.params.id as string);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[Races] Start attempt error:', err);

    if (err.message?.includes('not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message?.includes('already have an active')) {
      return res.status(400).json({ success: false, message: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to start race' });
  }
});

/**
 * POST /api/races/:id/complete
 * Complete a race attempt with GPS data and time.
 */
router.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { points, time_seconds } = req.body;

    if (!points || !Array.isArray(points) || points.length < 2) {
      return res.status(400).json({ success: false, message: 'GPS points are required' });
    }

    if (!time_seconds || typeof time_seconds !== 'number' || time_seconds <= 0) {
      return res.status(400).json({ success: false, message: 'time_seconds (positive number) is required' });
    }

    const result = await raceEngine.completeAttempt(
      req.userId!,
      req.params.id as string,
      points,
      time_seconds
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[Races] Complete attempt error:', err);

    if (err.message?.includes('not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (
      err.message?.includes('No active race') ||
      err.message?.includes('deviates too far') ||
      err.message?.includes('required') ||
      err.message?.includes('must be')
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to complete race' });
  }
});

export const racesRouter = router;
export default router;

// ============================================================
// Place Memory Routes (Stadtgedächtnis)
// GET /api/places/history  - Get place event timeline
// GET /api/places/stats    - Get aggregate place stats
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getPlaceHistory, getPlaceStats } from '../services/placeMemoryService';

const router = Router();

/**
 * GET /api/places/history
 * Get recent events near a location.
 * Query params: lat, lng, radius (default 50m), days (default 30), limit (default 50), offset (default 0)
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng query parameters are required',
      });
    }

    const radiusM = Math.min(parseFloat(req.query.radius as string) || 50, 5000);
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const events = await getPlaceHistory(lat, lng, radiusM, days, limit, offset);

    return res.json({
      success: true,
      data: { events },
    });
  } catch (err: any) {
    console.error('[Places] Get history error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get place history' });
  }
});

/**
 * GET /api/places/stats
 * Get aggregate stats for a location.
 * Query params: lat, lng, radius (default 100m)
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng query parameters are required',
      });
    }

    const radiusM = Math.min(parseFloat(req.query.radius as string) || 100, 5000);

    const stats = await getPlaceStats(lat, lng, radiusM);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    console.error('[Places] Get stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get place stats' });
  }
});

export const placesRouter = router;
export default router;

// ============================================================
// Resonance Routes
// GET /api/resonance - Get nearby resonance spots
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { resonanceService } from '../services/resonanceService';

const router = Router();

/**
 * GET /api/resonance
 * Get nearby resonance spots for map display.
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

    const spots = await resonanceService.getNearby(lat, lng, radiusM);

    return res.json({
      success: true,
      data: { resonance_spots: spots },
    });
  } catch (err: any) {
    console.error('[Resonance] Get nearby error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get resonance spots' });
  }
});

export const resonanceRouter = router;
export default router;

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
 * Get resonance spots for map display. Supports two modes:
 *   - BBox: north, south, east, west (show all spots in viewport)
 *   - Proximity: lat, lng, radius (meters, default 5000)
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { north, south, east, west } = req.query;
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusM = Math.min(parseFloat(req.query.radius as string) || 5000, 50000);

    let spots: any[];

    if (north && south && east && west) {
      spots = await resonanceService.getInBounds(
        parseFloat(north as string),
        parseFloat(south as string),
        parseFloat(east as string),
        parseFloat(west as string)
      );
    } else if (!isNaN(lat) && !isNaN(lng)) {
      spots = await resonanceService.getNearby(lat, lng, radiusM);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provide either bbox (north/south/east/west) or lat/lng params',
      });
    }

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

// ============================================================
// Silent Zone Routes
// GET  /api/silent-zones         - Get nearby silent zones
// GET  /api/silent-zones/:id     - Get zone details
// POST /api/silent-zones         - Propose new zone (level >= 20)
// POST /api/silent-zones/:id/vote - Vote to approve
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { queryOne } from '../config/database';
import {
  getNearbySilentZones,
  getSilentZonesInBounds,
  getSilentZoneById,
  proposeSilentZone,
  voteSilentZone,
} from '../services/silentZoneService';

const router = Router();

/**
 * GET /api/silent-zones
 * Get silent zones. Supports two modes:
 *   - BBox: north, south, east, west (show all zones in viewport)
 *   - Proximity: lat, lng, radius (meters, default 5000)
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { north, south, east, west } = req.query;
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusM = Math.min(parseFloat(req.query.radius as string) || 5000, 50000);

    let zones: any[];

    if (north && south && east && west) {
      zones = await getSilentZonesInBounds(
        parseFloat(north as string),
        parseFloat(south as string),
        parseFloat(east as string),
        parseFloat(west as string)
      );
    } else if (!isNaN(lat) && !isNaN(lng)) {
      zones = await getNearbySilentZones(lat, lng, radiusM);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provide either bbox (north/south/east/west) or lat/lng params',
      });
    }

    return res.json({
      success: true,
      data: { zones },
    });
  } catch (err: any) {
    console.error('[SilentZones] Get nearby error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get silent zones' });
  }
});

/**
 * GET /api/silent-zones/:id
 * Get silent zone details.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const zone = await getSilentZoneById(id as string);

    if (!zone) {
      return res.status(404).json({ success: false, message: 'Silent zone not found' });
    }

    return res.json({
      success: true,
      data: { zone },
    });
  } catch (err: any) {
    console.error('[SilentZones] Get zone error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get silent zone' });
  }
});

/**
 * POST /api/silent-zones
 * Propose a new silent zone. Requires level >= 20.
 * Body: { name, description?, polygon: [[lng, lat], ...] }
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    // Check level requirement
    const user = await queryOne<{ level: number }>(
      'SELECT level FROM users WHERE id = $1',
      [req.userId]
    );

    if (!user || user.level < 20) {
      return res.status(403).json({
        success: false,
        error: 'Proposing silent zones requires level 20 or higher',
      });
    }

    const { name, description, polygon } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ success: false, error: 'Name must be 100 characters or less' });
    }

    if (!polygon || !Array.isArray(polygon)) {
      return res.status(400).json({
        success: false,
        error: 'Polygon coordinates array is required',
      });
    }

    const zone = await proposeSilentZone(
      req.userId!,
      name.trim(),
      description?.trim(),
      polygon
    );

    return res.status(201).json({
      success: true,
      data: { zone },
    });
  } catch (err: any) {
    console.error('[SilentZones] Propose zone error:', err);

    const isUserError =
      err.message?.includes('overlaps') ||
      err.message?.includes('must have at least');

    return res.status(isUserError ? 400 : 500).json({
      success: false,
      error: err.message || 'Failed to propose silent zone',
    });
  }
});

/**
 * POST /api/silent-zones/:id/vote
 * Vote to approve a silent zone. At 20 votes, auto-approves.
 */
router.post('/:id/vote', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await voteSilentZone(req.userId!, id as string);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[SilentZones] Vote error:', err);

    const isUserError =
      err.message?.includes('not found') ||
      err.message?.includes('Cannot vote') ||
      err.message?.includes('Already voted');

    return res.status(isUserError ? 400 : 500).json({
      success: false,
      error: err.message || 'Failed to vote',
    });
  }
});

export const silentZonesRouter = router;
export default router;

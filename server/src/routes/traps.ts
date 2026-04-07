// ============================================================
// Trap Routes
// POST   /api/traps     - Place a trap in a territory
// GET    /api/traps/my  - Get all my active traps
// DELETE /api/traps/:id - Disarm a trap
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  placeTrap,
  getMyTraps,
  disarmTrap,
} from '../services/trapService';

const router = Router();

/**
 * POST /api/traps
 * Place a trap in one of your territories.
 * Max 3 traps per territory.
 *
 * Body: { territory_id, type, lat, lng }
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { territory_id, type, lat, lng } = req.body;

    if (!territory_id || typeof territory_id !== 'string') {
      return res.status(400).json({ success: false, message: 'territory_id is required' });
    }

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ success: false, message: 'type is required (slow, alert, decoy)' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng are required' });
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({ success: false, message: 'lat/lng out of range' });
    }

    const trap = await placeTrap(req.userId!, territory_id, type, parsedLat, parsedLng);

    return res.status(201).json({
      success: true,
      data: { trap },
    });
  } catch (err: any) {
    console.error('[Traps] Place trap error:', err);

    const isUserError = err.message?.includes('Invalid') ||
                        err.message?.includes('not found') ||
                        err.message?.includes('own territories') ||
                        err.message?.includes('within the territory') ||
                        err.message?.includes('Maximum');

    return res.status(isUserError ? 400 : 500).json({
      success: false,
      error: err.message || 'Failed to place trap',
    });
  }
});

/**
 * GET /api/traps/my
 * Get all active traps owned by the current user.
 */
router.get('/my', authenticate, async (req: Request, res: Response) => {
  try {
    const traps = await getMyTraps(req.userId!);

    return res.json({
      success: true,
      data: { traps },
    });
  } catch (err: any) {
    console.error('[Traps] Get my traps error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get traps' });
  }
});

/**
 * DELETE /api/traps/:id
 * Disarm (remove) one of your traps.
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await disarmTrap(id as string, req.userId!);

    return res.json({
      success: true,
      data: { message: 'Trap disarmed successfully' },
    });
  } catch (err: any) {
    console.error('[Traps] Disarm trap error:', err);

    const isUserError = err.message?.includes('not found') ||
                        err.message?.includes('own traps') ||
                        err.message?.includes('already inactive');

    return res.status(isUserError ? 400 : 500).json({
      success: false,
      error: err.message || 'Failed to disarm trap',
    });
  }
});

export const trapsRouter = router;
export default router;

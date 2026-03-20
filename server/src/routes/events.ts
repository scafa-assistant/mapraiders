// ============================================================
// Event Routes
// GET  /api/events              - Active events (optional location filter)
// GET  /api/events/:id          - Event details
// POST /api/events/:id/join     - Join an event
// GET  /api/events/loot         - Nearby loot drops
// POST /api/events/loot/:id/collect - Collect a loot drop
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { eventEngine } from '../services/eventEngine';

const router = Router();

/**
 * GET /api/events
 * Get all currently active events.
 * Optional query params: lat, lng (to filter by proximity).
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    const events = await eventEngine.getActiveEvents(lat, lng);

    return res.json({
      success: true,
      data: { events },
    });
  } catch (err: any) {
    console.error('[Events] Get active events error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get events' });
  }
});

/**
 * GET /api/events/loot
 * Get nearby uncollected loot drops.
 * Query params: lat, lng, radius (optional, default 500m).
 */
router.get('/loot', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseInt(req.query.radius as string) || 500;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng query parameters are required',
      });
    }

    const loot = await eventEngine.getNearbyLoot(lat, lng, Math.min(radius, 2000));

    return res.json({
      success: true,
      data: { loot },
    });
  } catch (err: any) {
    console.error('[Events] Get nearby loot error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get loot drops' });
  }
});

/**
 * GET /api/events/:id
 * Get details for a specific event.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const event = await eventEngine.getEventById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.json({
      success: true,
      data: event,
    });
  } catch (err: any) {
    console.error('[Events] Get event error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get event' });
  }
});

/**
 * POST /api/events/:id/join
 * Join an active event.
 */
router.post('/:id/join', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const event = await eventEngine.getEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Event is not active' });
    }

    await eventEngine.joinEvent(id, req.userId!);

    return res.json({
      success: true,
      message: 'Joined event successfully',
    });
  } catch (err: any) {
    console.error('[Events] Join event error:', err);
    return res.status(500).json({ success: false, message: 'Failed to join event' });
  }
});

/**
 * POST /api/events/loot/:id/collect
 * Collect a loot drop.
 */
router.post('/loot/:id/collect', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const value = await eventEngine.collectLoot(id, req.userId!);

    if (!value) {
      return res.status(410).json({
        success: false,
        message: 'Loot drop already collected or expired',
      });
    }

    return res.json({
      success: true,
      data: { value },
    });
  } catch (err: any) {
    console.error('[Events] Collect loot error:', err);
    return res.status(500).json({ success: false, message: 'Failed to collect loot' });
  }
});

export const eventsRouter = router;
export default router;

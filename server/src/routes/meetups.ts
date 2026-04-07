// ============================================================
// Meetup Routes
// POST   /api/meetups                 - Create a meetup event
// GET    /api/meetups                 - Get meetups (bbox or nearby)
// GET    /api/meetups/:id             - Get meetup details + attendees
// POST   /api/meetups/:id/join        - Join a meetup
// POST   /api/meetups/:id/leave       - Leave a meetup
// GET    /api/meetups/:id/messages    - Get paginated chat messages
// POST   /api/meetups/:id/messages    - Send a chat message
// POST   /api/meetups/:id/present     - Mark presence (GPS check)
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { meetupService } from '../services/meetupService';
import { moderationService } from '../services/moderationService';
import { sanitizeText } from '../utils/sanitize';

const router = Router();

/**
 * POST /api/meetups
 * Create a new meetup event.
 * Body: { name, description?, latitude, longitude, event_date, category?, max_attendees? }
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const meetup = await meetupService.createMeetup(req.userId!, req.body);

    return res.status(201).json({
      success: true,
      data: meetup,
    });
  } catch (err: any) {
    console.error('[Meetups] Create error:', err);
    const status = err.message?.includes('required') || err.message?.includes('Invalid') || err.message?.includes('Must be') || err.message?.includes('must be') ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to create meetup',
    });
  }
});

/**
 * GET /api/meetups
 * Get meetup events. Supports two modes:
 *   - Bounding box: ?north=&south=&east=&west=
 *   - Nearby: ?lat=&lng=&radius= (radius in meters, default 5000)
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { north, south, east, west, lat, lng, radius } = req.query;

    let meetups;

    if (north && south && east && west) {
      // Bounding box mode
      meetups = await meetupService.getInBounds(
        parseFloat(north as string),
        parseFloat(south as string),
        parseFloat(east as string),
        parseFloat(west as string),
      );
    } else if (lat && lng) {
      // Nearby mode
      const radiusM = parseInt(radius as string, 10) || 5000;
      meetups = await meetupService.getNearby(
        parseFloat(lat as string),
        parseFloat(lng as string),
        Math.min(radiusM, 50000),
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provide bounding box (north, south, east, west) or location (lat, lng) query params',
      });
    }

    return res.json({
      success: true,
      data: { meetups },
    });
  } catch (err: any) {
    console.error('[Meetups] Get meetups error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get meetups' });
  }
});

/**
 * GET /api/meetups/:id
 * Get meetup details including attendees.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const meetup = await meetupService.getMeetup(id);

    if (!meetup) {
      return res.status(404).json({ success: false, message: 'Meetup not found' });
    }

    const attendees = await meetupService.getAttendees(id);

    return res.json({
      success: true,
      data: { ...meetup, attendees },
    });
  } catch (err: any) {
    console.error('[Meetups] Get meetup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get meetup' });
  }
});

/**
 * POST /api/meetups/:id/join
 * Join a meetup event.
 */
router.post('/:id/join', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await meetupService.joinMeetup(req.userId!, id);

    return res.json({
      success: true,
      message: 'Joined meetup successfully',
    });
  } catch (err: any) {
    console.error('[Meetups] Join error:', err);
    const status = err.message?.includes('not found') ? 404
      : err.message?.includes('not active') || err.message?.includes('full') ? 400
      : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to join meetup',
    });
  }
});

/**
 * POST /api/meetups/:id/leave
 * Leave a meetup event.
 */
router.post('/:id/leave', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await meetupService.leaveMeetup(req.userId!, id);

    return res.json({
      success: true,
      message: 'Left meetup successfully',
    });
  } catch (err: any) {
    console.error('[Meetups] Leave error:', err);
    return res.status(500).json({ success: false, message: 'Failed to leave meetup' });
  }
});

/**
 * GET /api/meetups/:id/messages
 * Get paginated chat messages (newest first).
 * Query params: before (cursor UUID), limit (default 50, max 100)
 */
router.get('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const before = req.query.before as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

    const messages = await meetupService.getMessages(id, before, limit);

    return res.json({
      success: true,
      data: { messages },
    });
  } catch (err: any) {
    console.error('[Meetups] Get messages error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
});

/**
 * POST /api/meetups/:id/messages
 * Send a chat message to the meetup.
 * Body: { message: string } (max 500 chars)
 * Only attendees can send messages.
 */
router.post('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message must be 500 characters or less' });
    }

    // Content moderation check
    const modResult = await moderationService.checkText(message.trim());
    if (!modResult.safe) {
      return res.status(400).json({ success: false, message: 'Message contains inappropriate content' });
    }

    const sanitizedMessage = sanitizeText(message);
    const result = await meetupService.sendMessage(req.userId!, id, sanitizedMessage);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[Meetups] Send message error:', err);
    const status = err.message?.includes('Only attendees') ? 403 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to send message',
    });
  }
});

/**
 * POST /api/meetups/:id/present
 * Mark physical presence at the meetup event.
 * Body: { latitude, longitude }
 * Checks GPS proximity (within 100m of event location).
 */
router.post('/:id/present', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'latitude and longitude are required',
      });
    }

    const isPresent = await meetupService.markPresent(
      req.userId!,
      id,
      parseFloat(latitude),
      parseFloat(longitude),
    );

    if (!isPresent) {
      return res.json({
        success: true,
        data: { present: false, message: 'You are not within 100m of the event location' },
      });
    }

    return res.json({
      success: true,
      data: { present: true, message: 'Presence confirmed!' },
    });
  } catch (err: any) {
    console.error('[Meetups] Mark present error:', err);
    const status = err.message?.includes('not an attendee') ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to mark presence',
    });
  }
});

/**
 * DELETE /api/meetups/:id
 * Delete/cancel a meetup event.
 * - No attendees: delete completely
 * - Has attendees: cancel with notification (event stays visible as cancelled)
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const userId = req.userId!;

    // Import query functions
    const { queryOne, query: dbQuery, queryMany } = await import('../config/database');

    // Get event
    const event = await queryOne<{ id: string; creator_id: string; status: string; name: string }>(
      'SELECT id, creator_id, status, name FROM meetup_events WHERE id = $1',
      [eventId]
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event nicht gefunden' });
    if (event.creator_id !== userId) return res.status(403).json({ success: false, message: 'Nur der Ersteller kann das Event absagen' });
    if (event.status === 'cancelled') return res.status(400).json({ success: false, message: 'Event ist bereits abgesagt' });

    // Check attendees
    const attendees = await queryMany<{ user_id: string }>(
      'SELECT user_id FROM meetup_attendees WHERE event_id = $1',
      [eventId]
    );

    if (attendees.length === 0) {
      // No attendees — delete completely
      await dbQuery('DELETE FROM meetup_messages WHERE event_id = $1', [eventId]);
      await dbQuery('DELETE FROM meetup_events WHERE id = $1', [eventId]);
      return res.json({ success: true, data: { deleted: true, message: 'Event gelöscht' } });
    } else {
      // Has attendees — cancel, don't delete (they can see it was cancelled)
      await dbQuery("UPDATE meetup_events SET status = 'cancelled' WHERE id = $1", [eventId]);

      // Notify all attendees
      try {
        const { wsService } = await import('../services/wsService');
        for (const a of attendees) {
          wsService.sendToUser(a.user_id, 'event_cancelled', {
            event_id: eventId,
            event_name: event.name,
            message: `"${event.name}" wurde vom Ersteller abgesagt.`,
          });
        }
      } catch {}

      return res.json({
        success: true,
        data: {
          cancelled: true,
          attendees_notified: attendees.length,
          message: `Event abgesagt. ${attendees.length} Teilnehmer wurden benachrichtigt.`,
        },
      });
    }
  } catch (err: any) {
    console.error('[Meetups] Delete error:', err);
    return res.status(500).json({ success: false, message: 'Fehler beim Absagen' });
  }
});

export const meetupsRouter = router;
export default router;

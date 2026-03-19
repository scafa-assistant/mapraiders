// ============================================================
// Notification Routes
// GET  /api/notifications          - Get notifications (paginated)
// PUT  /api/notifications/read     - Mark notifications as read
// PUT  /api/notifications/settings - Update notification settings
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { markReadSchema, updateSettingsSchema } from '../middleware/validation';
import { getUserNotifications, markNotificationsRead } from '../services/notificationService';
import { queryOne, query } from '../config/database';

const router = Router();

/**
 * GET /api/notifications
 * Get notifications for the current user with pagination.
 * Query params: unread_only (boolean), page, limit
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const unreadOnly = req.query.unread_only === 'true';

    let result;

    if (unreadOnly) {
      // Custom query for unread only
      const offset = (page - 1) * limit;

      const [notifications, countResult] = await Promise.all([
        query(
          `SELECT * FROM notifications
           WHERE user_id = $1 AND read = FALSE
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [req.userId, limit, offset]
        ),
        queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE',
          [req.userId]
        ),
      ]);

      result = {
        notifications: notifications.rows,
        total: parseInt(countResult?.count || '0', 10),
      };
    } else {
      result = await getUserNotifications(req.userId!, page, limit);
    }

    // Get unread count
    const unreadCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE',
      [req.userId]
    );

    return res.json({
      success: true,
      data: {
        notifications: result.notifications,
        unread_count: parseInt(unreadCount?.count || '0', 10),
        pagination: {
          page,
          limit,
          total: result.total,
          total_pages: Math.ceil(result.total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error('[Notifications] Get notifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
});

/**
 * PUT /api/notifications/read
 * Mark specific notifications as read by IDs.
 * Body: { ids: string[] }
 */
router.put(
  '/read',
  authenticate,
  validateBody(markReadSchema),
  async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      // Mark the specified notifications as read (only if they belong to the user)
      const result = await query(
        `UPDATE notifications
         SET read = TRUE
         WHERE id = ANY($1) AND user_id = $2 AND read = FALSE
         RETURNING id`,
        [ids, req.userId]
      );

      return res.json({
        success: true,
        data: {
          marked_read: result.rowCount || 0,
        },
      });
    } catch (err: any) {
      console.error('[Notifications] Mark read error:', err);
      return res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
    }
  }
);

/**
 * PUT /api/notifications/settings
 * Update notification-specific settings (quiet hours, push limits, etc.).
 */
router.put(
  '/settings',
  authenticate,
  validateBody(updateSettingsSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        notifications_enabled,
        quiet_hours_start,
        quiet_hours_end,
        max_push_per_day,
      } = req.body;

      // Get current settings
      const user = await queryOne<{ settings: any }>(
        'SELECT settings FROM users WHERE id = $1',
        [req.userId]
      );

      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        ...(notifications_enabled !== undefined && { notifications_enabled }),
        ...(quiet_hours_start !== undefined && { quiet_hours_start }),
        ...(quiet_hours_end !== undefined && { quiet_hours_end }),
        ...(max_push_per_day !== undefined && { max_push_per_day }),
      };

      await query(
        'UPDATE users SET settings = $1 WHERE id = $2',
        [JSON.stringify(updatedSettings), req.userId]
      );

      return res.json({
        success: true,
        data: { settings: updatedSettings },
      });
    } catch (err: any) {
      console.error('[Notifications] Update settings error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update notification settings' });
    }
  }
);

export const notificationsRouter = router;
export default router;

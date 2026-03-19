// ============================================================
// Social Routes
// POST /api/social/reports - Report content
// GET  /api/social/feed    - Personal feed (nearby activity)
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createReportSchema } from '../middleware/validation';
import { createReport } from '../services/moderationService';
import { queryMany, queryOne } from '../config/database';

const router = Router();

/**
 * POST /api/social/reports
 * Report content (quest, echo, challenge, user, travel_route).
 * Body: { target_type, target_id, reason }
 */
router.post(
  '/reports',
  authenticate,
  validateBody(createReportSchema),
  async (req: Request, res: Response) => {
    try {
      const { target_type, target_id, reason } = req.body;

      const reportId = await createReport(req.userId!, target_type, target_id, reason);

      return res.status(201).json({
        success: true,
        data: {
          report_id: reportId,
          message: 'Report submitted. Thank you for helping keep Gridwalker safe.',
        },
      });
    } catch (err: any) {
      console.error('[Social] Create report error:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to create report',
      });
    }
  }
);

/**
 * GET /api/social/feed
 * Personal activity feed showing nearby activity, new quests, territory changes, etc.
 * Query params: scope (global|clan|nearby), page, limit
 */
router.get('/feed', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 30), 100);
    const offset = (page - 1) * limit;
    const scope = (req.query.scope as string) || 'global';

    let whereClause = '';
    const params: any[] = [limit, offset];

    if (scope === 'clan') {
      // Show feed from users in the same clans as the requesting user
      whereClause = `WHERE fe.user_id IN (
        SELECT cm2.user_id FROM clan_members cm1
        JOIN clan_members cm2 ON cm1.clan_id = cm2.clan_id
        WHERE cm1.user_id = $3
      )`;
      params.push(req.userId);
    } else if (scope === 'mine') {
      // Show only the user's own activity
      whereClause = 'WHERE fe.user_id = $3';
      params.push(req.userId);
    }
    // 'global' scope: no filter (show everything recent)

    const [feed, countResult] = await Promise.all([
      queryMany(
        `SELECT fe.id, fe.type, fe.user_id, fe.data, fe.created_at,
                u.username, u.level
         FROM feed_events fe
         JOIN users u ON fe.user_id = u.id
         ${whereClause}
         ORDER BY fe.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM feed_events fe
         ${whereClause}`,
        scope === 'global' ? [] : [req.userId]
      ),
    ]);

    return res.json({
      success: true,
      data: {
        feed: feed.map(item => ({
          id: item.id,
          type: item.type,
          user: {
            id: item.user_id,
            username: item.username,
            level: item.level,
          },
          data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data,
          created_at: item.created_at,
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult?.count || '0', 10),
        },
      },
    });
  } catch (err: any) {
    console.error('[Social] Get feed error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get feed' });
  }
});

export const socialRouter = router;
export default router;

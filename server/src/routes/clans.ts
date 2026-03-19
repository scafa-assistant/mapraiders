// ============================================================
// Clan Routes
// GET  /api/clans/me               - Get user's clans
// GET  /api/clans/districts/scores  - Get district vs district scores
// GET  /api/clans/:id               - Get clan details with members
// GET  /api/clans/:id/messages      - Get paginated clan chat messages
// POST /api/clans/:id/messages      - Send a clan chat message
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getUserClans, getClanDetails, getDistrictScore } from '../services/clanService';
import { queryMany, queryOne } from '../config/database';
import { CLAN } from '../config/constants';
import { wsService } from '../services/wsService';

const router = Router();

/**
 * GET /api/clans/me
 * Get all clans the current user belongs to, with member counts.
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const clans = await getUserClans(req.userId!);

    return res.json({
      success: true,
      data: { clans },
    });
  } catch (err: any) {
    console.error('[Clans] Get my clans error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get clans' });
  }
});

/**
 * GET /api/clans/districts/scores
 * Get district vs district scores for all district clans.
 * Returns a ranked list of districts with their composite scores.
 */
router.get('/districts/scores', authenticate, async (req: Request, res: Response) => {
  try {
    // Get all district clans
    const districtClans = await queryMany<{ id: string; name: string; metadata: any }>(
      "SELECT id, name, metadata FROM clans WHERE type = 'district' ORDER BY name",
    );

    // Calculate scores for each district
    const scoredDistricts = await Promise.all(
      districtClans.map(async (clan) => {
        const score = await getDistrictScore(clan.id);

        // Get member count
        const members = await queryMany<{ user_id: string }>(
          'SELECT user_id FROM clan_members WHERE clan_id = $1',
          [clan.id]
        );

        return {
          clan_id: clan.id,
          name: clan.name,
          metadata: clan.metadata,
          score: Math.round(score * 100) / 100,
          member_count: members.length,
        };
      })
    );

    // Sort by score descending and add rank
    scoredDistricts.sort((a, b) => b.score - a.score);
    const ranked = scoredDistricts.map((d, i) => ({
      rank: i + 1,
      ...d,
    }));

    return res.json({
      success: true,
      data: {
        districts: ranked,
        scoring_weights: CLAN.DISTRICT_SCORING,
      },
    });
  } catch (err: any) {
    console.error('[Clans] Get district scores error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get district scores' });
  }
});

/**
 * GET /api/clans/:id
 * Get clan details including members and, for district clans, the district score.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const clan = await getClanDetails(req.params.id as string);

    // Calculate district score if applicable
    let districtScore: number | null = null;
    if (clan.type === 'district') {
      districtScore = await getDistrictScore(clan.id);
      districtScore = Math.round(districtScore * 100) / 100;
    }

    return res.json({
      success: true,
      data: {
        ...clan,
        district_score: districtScore,
      },
    });
  } catch (err: any) {
    console.error('[Clans] Get clan error:', err);
    return res.status(404).json({
      success: false,
      error: err.message || 'Clan not found',
    });
  }
});

/**
 * GET /api/clans/:id/messages
 * Get paginated clan chat messages (newest first).
 * Query params:
 *   - before: cursor UUID for pagination (return messages older than this ID)
 *   - limit: number of messages to return (default 50, max 100)
 * Only clan members can read messages.
 */
router.get('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const clanId = req.params.id as string;
    const before = req.query.before as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

    // Verify user is a clan member
    const membership = await queryOne<{ clan_id: string }>(
      'SELECT clan_id FROM clan_members WHERE clan_id = $1 AND user_id = $2',
      [clanId, req.userId]
    );

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not a member of this clan' });
    }

    let messages;
    if (before) {
      messages = await queryMany<{
        id: string;
        clan_id: string;
        sender_id: string;
        sender_username: string;
        message: string;
        created_at: Date;
      }>(
        `SELECT cm.id, cm.clan_id, cm.sender_id, u.username as sender_username,
                cm.message, cm.created_at
         FROM clan_messages cm
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.clan_id = $1 AND cm.created_at < (
           SELECT created_at FROM clan_messages WHERE id = $2
         )
         ORDER BY cm.created_at DESC
         LIMIT $3`,
        [clanId, before, limit]
      );
    } else {
      messages = await queryMany<{
        id: string;
        clan_id: string;
        sender_id: string;
        sender_username: string;
        message: string;
        created_at: Date;
      }>(
        `SELECT cm.id, cm.clan_id, cm.sender_id, u.username as sender_username,
                cm.message, cm.created_at
         FROM clan_messages cm
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.clan_id = $1
         ORDER BY cm.created_at DESC
         LIMIT $2`,
        [clanId, limit]
      );
    }

    return res.json({
      success: true,
      data: { messages },
    });
  } catch (err: any) {
    console.error('[Clans] Get messages error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
});

/**
 * POST /api/clans/:id/messages
 * Send a chat message to the clan.
 * Body: { message: string } (max 500 chars)
 * Only clan members can send messages.
 * Broadcasts via WebSocket to all online clan members.
 */
router.post('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const clanId = req.params.id as string;
    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message must be 500 characters or less' });
    }

    // Verify user is a clan member
    const membership = await queryOne<{ clan_id: string }>(
      'SELECT clan_id FROM clan_members WHERE clan_id = $1 AND user_id = $2',
      [clanId, req.userId]
    );

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not a member of this clan' });
    }

    // Get sender username
    const sender = await queryOne<{ username: string }>(
      'SELECT username FROM users WHERE id = $1',
      [req.userId]
    );

    if (!sender) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Insert message
    const result = await queryOne<{ id: string; created_at: Date }>(
      `INSERT INTO clan_messages (clan_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [clanId, req.userId, message.trim()]
    );

    const messageData = {
      id: result!.id,
      clanId,
      senderId: req.userId,
      senderUsername: sender.username,
      message: message.trim(),
      createdAt: result!.created_at,
    };

    // Broadcast to all online clan members via WebSocket
    wsService.broadcastToClan(clanId, 'clan_message', messageData);

    return res.status(201).json({
      success: true,
      data: messageData,
    });
  } catch (err: any) {
    console.error('[Clans] Send message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

export const clansRouter = router;
export default router;

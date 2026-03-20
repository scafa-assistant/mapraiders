// ============================================================
// Invite Routes
// POST /api/invites        - Create invite code
// GET  /api/invites/me     - Get my invites
// POST /api/invites/redeem - Redeem invite code during registration
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { inviteService } from '../services/inviteService';

const router = Router();

/**
 * POST /api/invites
 * Create a new invite code. Requires authentication.
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const invite = await inviteService.createInvite(req.userId!);
    return res.status(201).json({
      success: true,
      data: invite,
    });
  } catch (err: any) {
    console.error('[Invites] Create invite error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create invite' });
  }
});

/**
 * GET /api/invites/me
 * Get all invites sent by the authenticated user.
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const invites = await inviteService.getMyInvites(req.userId!);
    return res.json({
      success: true,
      data: { invites },
    });
  } catch (err: any) {
    console.error('[Invites] Get my invites error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get invites' });
  }
});

/**
 * POST /api/invites/redeem
 * Redeem an invite code. Called during or after registration.
 * Body: { code: string }
 */
router.post('/redeem', authenticate, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const result = await inviteService.useInvite(code, req.userId!);

    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'Invalid, expired, or already used invite code',
      });
    }

    return res.json({
      success: true,
      data: { redeemed: true },
    });
  } catch (err: any) {
    console.error('[Invites] Redeem invite error:', err);
    return res.status(500).json({ success: false, message: 'Failed to redeem invite' });
  }
});

export const invitesRouter = router;
export default router;

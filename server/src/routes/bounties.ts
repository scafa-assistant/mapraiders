// ============================================================
// Bounty Routes
// POST /api/bounties       - Place a bounty on a player
// GET  /api/bounties       - Get active bounties (optional location filter)
// GET  /api/bounties/on-me - Get bounties targeting current user
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  placeBounty,
  getActiveBounties,
  getUserBounties,
} from '../services/bountyService';

const router = Router();

/**
 * POST /api/bounties
 * Place a bounty on another player. Costs XP from the issuer.
 *
 * Body: { target_id, reason?, xp_reward? }
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { target_id, reason, xp_reward } = req.body;

    if (!target_id || typeof target_id !== 'string') {
      return res.status(400).json({ success: false, message: 'target_id is required' });
    }

    const parsedReward = xp_reward ? parseInt(xp_reward, 10) : undefined;
    if (parsedReward !== undefined && (isNaN(parsedReward) || parsedReward < 100 || parsedReward > 5000)) {
      return res.status(400).json({
        success: false,
        error: 'xp_reward must be between 100 and 5000',
      });
    }

    const bounty = await placeBounty(
      req.userId!,
      target_id,
      reason,
      parsedReward
    );

    return res.status(201).json({
      success: true,
      data: { bounty },
    });
  } catch (err: any) {
    console.error('[Bounties] Place bounty error:', err);

    const isUserError = err.message?.includes('Cannot place') ||
                        err.message?.includes('Insufficient') ||
                        err.message?.includes('not found') ||
                        err.message?.includes('already have');

    return res.status(isUserError ? 400 : 500).json({
      success: false,
      error: err.message || 'Failed to place bounty',
    });
  }
});

/**
 * GET /api/bounties
 * Get active bounties. Optional query params: lat, lng, radius (meters).
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radius = req.query.radius ? Math.min(parseFloat(req.query.radius as string), 50000) : undefined;

    if ((lat !== undefined && isNaN(lat)) || (lng !== undefined && isNaN(lng))) {
      return res.status(400).json({ success: false, message: 'Invalid lat/lng' });
    }

    const bounties = await getActiveBounties(lat, lng, radius);

    return res.json({
      success: true,
      data: { bounties },
    });
  } catch (err: any) {
    console.error('[Bounties] Get bounties error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get bounties' });
  }
});

/**
 * GET /api/bounties/on-me
 * Get all active bounties targeting the current user.
 */
router.get('/on-me', authenticate, async (req: Request, res: Response) => {
  try {
    const bounties = await getUserBounties(req.userId!);

    return res.json({
      success: true,
      data: { bounties },
    });
  } catch (err: any) {
    console.error('[Bounties] Get user bounties error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get bounties' });
  }
});

export const bountiesRouter = router;
export default router;

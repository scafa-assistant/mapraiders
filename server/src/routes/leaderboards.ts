// ============================================================
// Leaderboard Routes
// GET /api/leaderboards/:type     - Get leaderboard entries
// GET /api/leaderboards/:type/me  - Get current user's rank
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getLeaderboard, getUserRank } from '../services/leaderboardService';
import { LEADERBOARD_TYPES, LEADERBOARD_PERIODS, LeaderboardPeriod } from '../config/constants';
import { LeaderboardType, MovementClass } from '../utils/types';

const router = Router();

const VALID_CLASSES: MovementClass[] = ['walker', 'dog_walker', 'runner', 'cyclist', 'skater', 'driver'];

/**
 * GET /api/leaderboards/:type/me
 * Get current user's rank on a specific leaderboard.
 * Must be defined BEFORE /:type to avoid route collision.
 */
router.get('/:type/me', authenticate, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const period = (req.query.period as LeaderboardPeriod) || 'alltime';
    const classFilter = req.query.class as MovementClass | undefined;

    // Validate type
    if (!LEADERBOARD_TYPES.includes(type as LeaderboardType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid leaderboard type. Valid types: ${LEADERBOARD_TYPES.join(', ')}`,
      });
    }

    // Validate period
    if (!LEADERBOARD_PERIODS.includes(period)) {
      return res.status(400).json({
        success: false,
        error: `Invalid period. Valid periods: ${LEADERBOARD_PERIODS.join(', ')}`,
      });
    }

    // Validate class filter if provided
    if (classFilter && !VALID_CLASSES.includes(classFilter)) {
      return res.status(400).json({
        success: false,
        error: `Invalid class. Valid classes: ${VALID_CLASSES.join(', ')}`,
      });
    }

    const myRank = await getUserRank(
      type as LeaderboardType,
      req.userId!,
      period,
      classFilter
    );

    return res.json({
      success: true,
      data: {
        type,
        period,
        class: classFilter || null,
        rank: myRank.rank,
        score: myRank.score,
      },
    });
  } catch (err: any) {
    console.error('[Leaderboard] Get my rank error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get rank' });
  }
});

/**
 * GET /api/leaderboards/:type
 * Get leaderboard entries with pagination.
 * Query params: class, page, limit, period (monthly|alltime)
 */
router.get('/:type', authenticate, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const period = (req.query.period as LeaderboardPeriod) || 'alltime';
    const classFilter = req.query.class as MovementClass | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);

    // Validate type
    if (!LEADERBOARD_TYPES.includes(type as LeaderboardType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid leaderboard type. Valid types: ${LEADERBOARD_TYPES.join(', ')}`,
      });
    }

    // Validate period
    if (!LEADERBOARD_PERIODS.includes(period)) {
      return res.status(400).json({
        success: false,
        error: `Invalid period. Valid periods: ${LEADERBOARD_PERIODS.join(', ')}`,
      });
    }

    // Validate class filter if provided
    if (classFilter && !VALID_CLASSES.includes(classFilter)) {
      return res.status(400).json({
        success: false,
        error: `Invalid class. Valid classes: ${VALID_CLASSES.join(', ')}`,
      });
    }

    const { entries, total } = await getLeaderboard(
      type as LeaderboardType,
      period,
      classFilter,
      page,
      limit
    );

    // Also get requesting user's rank
    const myRank = await getUserRank(
      type as LeaderboardType,
      req.userId!,
      period,
      classFilter
    );

    return res.json({
      success: true,
      data: {
        type,
        period,
        class: classFilter || null,
        entries,
        my_rank: myRank.rank,
        my_score: myRank.score,
        pagination: {
          page,
          limit,
          total,
        },
      },
    });
  } catch (err: any) {
    console.error('[Leaderboard] Get leaderboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get leaderboard' });
  }
});

export const leaderboardsRouter = router;
export default router;

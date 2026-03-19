// ============================================================
// Clan Routes
// GET /api/clans/me               - Get user's clans
// GET /api/clans/districts/scores - Get district vs district scores
// GET /api/clans/:id              - Get clan details with members
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getUserClans, getClanDetails, getDistrictScore } from '../services/clanService';
import { queryMany } from '../config/database';
import { CLAN } from '../config/constants';

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
    return res.status(500).json({ success: false, error: 'Failed to get clans' });
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
    return res.status(500).json({ success: false, error: 'Failed to get district scores' });
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

export const clansRouter = router;
export default router;

// ============================================================
// Duel Routes
// POST /api/duels                - Challenge a player
// PUT  /api/duels/:id/accept     - Accept a duel
// PUT  /api/duels/:id/decline    - Decline a duel
// POST /api/duels/:id/score      - Submit score
// POST /api/duels/:id/complete   - Complete duel (determine winner)
// GET  /api/duels/active         - Get active duels
// GET  /api/duels/history        - Get duel history
// GET  /api/duels/nearby-players - Get nearby players for challenging
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { duelEngine, DuelType } from '../services/duelEngine';

const router = Router();

/**
 * POST /api/duels
 * Challenge another player to a duel.
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { defender_id, type, lat, lng, stake_territory_id } = req.body;

    if (!defender_id) {
      return res.status(400).json({ success: false, error: 'defender_id is required' });
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'lat and lng are required' });
    }

    const duel = await duelEngine.challengePlayer(
      req.userId!,
      defender_id,
      (type || 'speed_claim') as DuelType,
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      stake_territory_id
    );

    return res.status(201).json({
      success: true,
      data: { duel },
    });
  } catch (err: any) {
    console.error('[Duels] Challenge error:', err);

    if (
      err.message?.includes('Invalid duel type') ||
      err.message?.includes('cannot challenge yourself') ||
      err.message?.includes('already have an active duel') ||
      err.message?.includes('not found or not owned')
    ) {
      return res.status(400).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to create duel' });
  }
});

/**
 * PUT /api/duels/:id/accept
 * Accept a pending duel.
 */
router.put('/:id/accept', authenticate, async (req: Request, res: Response) => {
  try {
    const duel = await duelEngine.acceptDuel(req.params.id as string, req.userId!);

    return res.json({
      success: true,
      data: { duel },
    });
  } catch (err: any) {
    console.error('[Duels] Accept error:', err);

    if (err.message?.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    if (
      err.message?.includes('Only the challenged') ||
      err.message?.includes('cannot be accepted') ||
      err.message?.includes('expired')
    ) {
      return res.status(400).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to accept duel' });
  }
});

/**
 * PUT /api/duels/:id/decline
 * Decline a pending duel.
 */
router.put('/:id/decline', authenticate, async (req: Request, res: Response) => {
  try {
    const duel = await duelEngine.declineDuel(req.params.id as string, req.userId!);

    return res.json({
      success: true,
      data: { duel },
    });
  } catch (err: any) {
    console.error('[Duels] Decline error:', err);

    if (err.message?.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    if (
      err.message?.includes('Only the challenged') ||
      err.message?.includes('cannot be declined')
    ) {
      return res.status(400).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to decline duel' });
  }
});

/**
 * POST /api/duels/:id/score
 * Submit a score during an active duel.
 */
router.post('/:id/score', authenticate, async (req: Request, res: Response) => {
  try {
    const { score } = req.body;

    if (score === undefined || typeof score !== 'number') {
      return res.status(400).json({ success: false, error: 'score (number) is required' });
    }

    const duel = await duelEngine.submitScore(req.params.id as string, req.userId!, score);

    return res.json({
      success: true,
      data: { duel },
    });
  } catch (err: any) {
    console.error('[Duels] Submit score error:', err);

    if (err.message?.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    if (
      err.message?.includes('not active') ||
      err.message?.includes('not a participant')
    ) {
      return res.status(400).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to submit score' });
  }
});

/**
 * POST /api/duels/:id/complete
 * Complete a duel and determine the winner.
 */
router.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await duelEngine.completeDuel(req.params.id as string);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[Duels] Complete error:', err);

    if (err.message?.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    if (err.message?.includes('not active')) {
      return res.status(400).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to complete duel' });
  }
});

/**
 * GET /api/duels/active
 * Get all active or pending duels for the current user.
 */
router.get('/active', authenticate, async (req: Request, res: Response) => {
  try {
    const duels = await duelEngine.getActiveDuels(req.userId!);

    return res.json({
      success: true,
      data: { duels },
    });
  } catch (err: any) {
    console.error('[Duels] Get active error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get active duels' });
  }
});

/**
 * GET /api/duels/history
 * Get completed duel history for the current user.
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const duels = await duelEngine.getDuelHistory(req.userId!, limit);

    return res.json({
      success: true,
      data: { duels },
    });
  } catch (err: any) {
    console.error('[Duels] Get history error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get duel history' });
  }
});

/**
 * GET /api/duels/nearby-players
 * Find connected players near a location for challenging.
 */
router.get('/nearby-players', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = Math.min(parseFloat(req.query.radius as string) || 500, 5000);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng query parameters required' });
    }

    const players = await duelEngine.getNearbyPlayers(lat, lng, radius);

    // Exclude the requesting user
    const filtered = players.filter((p) => p.userId !== req.userId);

    return res.json({
      success: true,
      data: { players: filtered },
    });
  } catch (err: any) {
    console.error('[Duels] Nearby players error:', err);
    return res.status(500).json({ success: false, message: 'Failed to find nearby players' });
  }
});

export const duelsRouter = router;
export default router;

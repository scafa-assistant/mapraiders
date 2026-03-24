// ============================================================
// Territory Defense Routes
// POST   /api/defenses                     - Set/update a defense
// GET    /api/defenses/:territoryId        - Get defense for territory
// POST   /api/defenses/:defenseId/challenge - Challenge a defense
// DELETE /api/defenses/:defenseId          - Remove a defense
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { defenseGameEngine } from '../services/defenseGameEngine';

const router = Router();

/**
 * POST /api/defenses
 * Set or update a defense mini-game on an owned territory.
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { territoryId, gameType, config, secret, benchmark } = req.body;

    if (!territoryId) {
      return res.status(400).json({ success: false, message: 'territoryId is required' });
    }
    if (!gameType) {
      return res.status(400).json({ success: false, message: 'gameType is required' });
    }

    const result = await defenseGameEngine.setDefense(
      req.userId!,
      territoryId as string,
      gameType as string,
      config || {},
      secret,
      benchmark
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[Defenses] Set defense error:', err);

    if (
      err.message?.includes('Invalid game type') ||
      err.message?.includes('not found') ||
      err.message?.includes('do not own')
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to set defense' });
  }
});

/**
 * GET /api/defenses/:territoryId
 * Get the active defense for a territory (public info only).
 */
router.get('/:territoryId', authenticate, async (req: Request, res: Response) => {
  try {
    const territoryId = req.params.territoryId as string;

    const defense = await defenseGameEngine.getDefense(territoryId);

    if (!defense) {
      return res.status(404).json({ success: false, message: 'No active defense on this territory' });
    }

    return res.json({
      success: true,
      data: { defense },
    });
  } catch (err: any) {
    console.error('[Defenses] Get defense error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get defense' });
  }
});

/**
 * POST /api/defenses/:defenseId/challenge
 * Submit a challenge attempt against a territory defense.
 */
router.post('/:defenseId/challenge', authenticate, async (req: Request, res: Response) => {
  try {
    const defenseId = req.params.defenseId as string;
    const { challengerData } = req.body;

    if (!challengerData) {
      return res.status(400).json({ success: false, message: 'challengerData is required' });
    }

    const result = await defenseGameEngine.submitChallenge(
      req.userId!,
      defenseId,
      challengerData
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[Defenses] Challenge error:', err);

    if (
      err.message?.includes('not found') ||
      err.message?.includes('expired')
    ) {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (
      err.message?.includes('Cannot challenge your own') ||
      err.message?.includes('Cooldown active')
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to submit challenge' });
  }
});

/**
 * DELETE /api/defenses/:defenseId
 * Remove (expire) a defense. Only the owner can do this.
 */
router.delete('/:defenseId', authenticate, async (req: Request, res: Response) => {
  try {
    const defenseId = req.params.defenseId as string;

    await defenseGameEngine.removeDefense(req.userId!, defenseId);

    return res.json({
      success: true,
      data: { removed: true },
    });
  } catch (err: any) {
    console.error('[Defenses] Remove defense error:', err);

    if (err.message?.includes('not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message?.includes('Not your defense')) {
      return res.status(403).json({ success: false, message: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to remove defense' });
  }
});

export const defensesRouter = router;
export default router;

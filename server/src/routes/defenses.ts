// ============================================================
// Territory Defense Routes — Multi-Layer Defense System
// POST   /api/defenses                        - Add a defense layer
// GET    /api/defenses/:territoryId            - Get all defenses + slot info
// POST   /api/defenses/:defenseId/challenge    - Challenge a specific defense
// DELETE /api/defenses/:defenseId              - Remove a defense layer
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { defenseGameEngine } from '../services/defenseGameEngine';

const router = Router();

/**
 * POST /api/defenses
 * Add a defense layer to an owned territory.
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
      err.message?.includes('do not own') ||
      err.message?.includes('Max ')
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to set defense' });
  }
});

/**
 * GET /api/defenses/:territoryId
 * Get all active defenses + slot info for a territory.
 */
router.get('/:territoryId', authenticate, async (req: Request, res: Response) => {
  try {
    const territoryId = req.params.territoryId as string;

    const slotInfo = await defenseGameEngine.getSlotInfo(territoryId);

    // Backwards compatible: also include single "defense" for old clients
    const firstDefense = slotInfo.defenses.length > 0 ? slotInfo.defenses[0] : null;

    return res.json({
      success: true,
      data: {
        defense: firstDefense,
        defenses: slotInfo.defenses,
        max_slots: slotInfo.max_slots,
        used_slots: slotInfo.used_slots,
      },
    });
  } catch (err: any) {
    console.error('[Defenses] Get defense error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get defense' });
  }
});

/**
 * POST /api/defenses/:defenseId/challenge
 * Submit a challenge attempt against a specific defense layer.
 */
router.post('/:defenseId/challenge', authenticate, async (req: Request, res: Response) => {
  try {
    const defenseId = req.params.defenseId as string;
    const { challengerData } = req.body;

    const result = await defenseGameEngine.submitChallenge(
      req.userId!,
      defenseId,
      challengerData || {}
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
 * Remove (expire) a defense layer. Only the owner can do this.
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

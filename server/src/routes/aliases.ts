// ============================================================
// Alias Routes
// POST /api/aliases        - Create an alias (level >= 31 Architect)
// GET  /api/aliases/me     - Get my alias
// PUT  /api/aliases/switch - Toggle alias mode on/off
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAlias,
  getAlias,
  switchToAlias,
  switchToMain,
  isAliasActive,
} from '../services/aliasService';

const router = Router();

/**
 * POST /api/aliases
 * Create an anonymous alias. Requires level >= 31 (Architect).
 * One alias per user.
 *
 * Body: { alias_name }
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { alias_name } = req.body;

    if (!alias_name || typeof alias_name !== 'string' || alias_name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'alias_name is required' });
    }

    const alias = await createAlias(req.userId!, alias_name);

    return res.status(201).json({
      success: true,
      data: { alias },
    });
  } catch (err: any) {
    console.error('[Aliases] Create alias error:', err);

    const isUserError = err.message?.includes('requires level') ||
                        err.message?.includes('already have') ||
                        err.message?.includes('already taken') ||
                        err.message?.includes('cooldown') ||
                        err.message?.includes('between 3 and 50') ||
                        err.message?.includes('cannot be the same');

    return res.status(isUserError ? 400 : 500).json({
      success: false,
      error: err.message || 'Failed to create alias',
    });
  }
});

/**
 * GET /api/aliases/me
 * Get the current user's alias and active status.
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const alias = await getAlias(req.userId!);
    const active = await isAliasActive(req.userId!);

    if (!alias) {
      return res.json({
        success: true,
        data: { alias: null, is_active: false },
      });
    }

    return res.json({
      success: true,
      data: {
        alias,
        is_active: active,
      },
    });
  } catch (err: any) {
    console.error('[Aliases] Get alias error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get alias' });
  }
});

/**
 * PUT /api/aliases/switch
 * Toggle alias mode on or off.
 *
 * Body: { active: boolean }
 */
router.put('/switch', authenticate, async (req: Request, res: Response) => {
  try {
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'active (boolean) is required' });
    }

    if (active) {
      const alias = await switchToAlias(req.userId!);
      return res.json({
        success: true,
        data: { alias, is_active: true },
      });
    } else {
      await switchToMain(req.userId!);
      return res.json({
        success: true,
        data: { is_active: false },
      });
    }
  } catch (err: any) {
    console.error('[Aliases] Switch alias error:', err);

    const isUserError = err.message?.includes('No alias') ||
                        err.message?.includes('revealed');

    return res.status(isUserError ? 400 : 500).json({
      success: false,
      error: err.message || 'Failed to switch alias mode',
    });
  }
});

export const aliasesRouter = router;
export default router;

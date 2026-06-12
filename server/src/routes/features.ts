// ============================================================
// Feature Routes (E4 — Phase 0)
// GET /api/features  — public, no auth required
// Returns only enabled flags + their config (no rollout_percent).
// ============================================================

import { Router, Request, Response } from 'express';
import { featureService } from '../services/featureService';

const router = Router();

// GET /api/features
// Public endpoint — mobile can call this at startup, no token needed.
router.get('/', async (_req: Request, res: Response) => {
  try {
    const features = await featureService.getClientConfig();
    return res.json({
      success: true,
      data: { features },
    });
  } catch (err: any) {
    console.error('[Features] GET / error:', err);
    // Even on unexpected error: return empty list, never 500 to the client
    return res.json({
      success: true,
      data: { features: [] },
    });
  }
});

export const featuresRouter = router;
export default router;

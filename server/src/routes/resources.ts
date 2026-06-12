// ============================================================
// Resource Routes (Phase 0 — E2)
// GET  /api/resources   - Current user's balances + last 50 ledger entries
//
// NOTE: not registered in index.ts yet (Phase 0 staging).
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { resourceService } from '../services/resourceService';

const router = Router();

/**
 * GET /api/resources
 * Returns the authenticated user's resource balances (energy/tech/intel)
 * plus their most recent ledger transactions.
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const [balances, transactions] = await Promise.all([
      resourceService.getBalances(userId),
      resourceService.getRecentTransactions(userId, 50),
    ]);

    return res.json({ success: true, data: { balances, transactions } });
  } catch (err: any) {
    console.error('[Resources] Get resources error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load resources' });
  }
});

export const resourcesRouter = router;
export default router;

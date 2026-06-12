// ============================================================
// Resource Routes (Phase 0 — E2 / Phase B lazy-energy extension)
// GET  /api/resources   - Current user's balances + last 50 ledger entries
//
// Phase B addition: before reading balances, attempt a lazy energy accrual
// so that the client always sees an up-to-date energy value without a
// separate polling call. The accrual is best-effort — any failure is swallowed
// so it never breaks the balance read.
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { resourceService } from '../services/resourceService';
import { featureService } from '../services/featureService';
import { energyService } from '../services/energyService';

const router = Router();

const RESOURCES_FLAG = 'resources';

/**
 * GET /api/resources
 * Returns the authenticated user's resource balances (energy/tech/intel)
 * plus their most recent ledger transactions.
 *
 * Phase B: if the `resources` feature flag is enabled for this user, a lazy
 * energy accrual is triggered before the balance read. Accrual errors are
 * swallowed — the balance read always proceeds.
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    // Lazy energy accrual (Phase B) — best-effort, never blocks the response.
    try {
      const enabled = await featureService.isEnabledFor(userId, RESOURCES_FLAG);
      if (enabled) {
        await energyService.accrueEnergy(userId);
      }
    } catch (accrualErr) {
      console.warn('[Resources] Lazy energy accrual failed (non-fatal):', accrualErr);
    }

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

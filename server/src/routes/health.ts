// ============================================================
// Health Route - System health monitoring endpoints
// ============================================================

import { Router, Request, Response } from 'express';
import { getCronHealth } from '../services/cronMonitor';

const router = Router();

/**
 * GET /api/health/crons - Cron job health status
 * Returns health information for all scheduled cron jobs.
 */
router.get('/crons', async (_req: Request, res: Response) => {
  try {
    const health = await getCronHealth();
    return res.json({ success: true, data: health });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export const healthRouter = router;

// ============================================================
// Terminal Routes (Phase A.2 — Jump&Run)
// POST /api/terminals/:spawnId/start        - start a run (returns level + run_token)
// POST /api/terminals/:spawnId/submit       - submit a finished/abandoned run
// GET  /api/terminals/:spawnId/leaderboard  - top 10 + me
//
// All routes are feature-gated behind the `terminals` flag. When the flag is
// off, the mutating routes return 403 and the leaderboard GET degrades to an
// empty result (read-only, harmless to poll). Response format:
// { success, data } / { success: false, message }.
// Registered in index.ts under /api/terminals.
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { featureService } from '../services/featureService';
import { terminalEngine } from '../services/terminalEngine';

const router = Router();

const TERMINALS_FLAG = 'terminals';

/** Return true when the string looks like a UUID. */
function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Map a TerminalError code onto an HTTP status. */
function statusForCode(code: unknown): number {
  if (String(code).endsWith('NOT_FOUND')) return 404;
  if (code === 'DAILY_CAP') return 429;
  return 400;
}

// ---- POST /:spawnId/start ----------------------------------------------------

router.post('/:spawnId/start', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, TERMINALS_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const spawnId = req.params.spawnId as string;
    if (!looksLikeUuid(spawnId)) {
      return res.status(400).json({ success: false, message: 'Invalid spawn ID' });
    }

    const latitude = req.body?.latitude;
    const longitude = req.body?.longitude;
    const pos =
      typeof latitude === 'number' && typeof longitude === 'number'
        ? { latitude, longitude }
        : undefined;

    const result = await terminalEngine.startRun(userId, spawnId, pos);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Terminals] POST /:spawnId/start error:', err);
    return res.status(500).json({ success: false, message: 'Failed to start terminal run' });
  }
});

// ---- POST /:spawnId/submit ---------------------------------------------------

router.post('/:spawnId/submit', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, TERMINALS_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'FEATURE_DISABLED' });
    }

    const spawnId = req.params.spawnId as string;
    if (!looksLikeUuid(spawnId)) {
      return res.status(400).json({ success: false, message: 'Invalid spawn ID' });
    }

    const result = await terminalEngine.submitRun(userId, spawnId, req.body ?? {});
    return res.json({ success: true, data: result });
  } catch (err: any) {
    if (err?.code) {
      return res.status(statusForCode(err.code)).json({ success: false, message: err.code });
    }
    console.error('[Terminals] POST /:spawnId/submit error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit terminal run' });
  }
});

// ---- GET /:spawnId/leaderboard -----------------------------------------------

router.get('/:spawnId/leaderboard', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, TERMINALS_FLAG);
    if (!enabled) {
      return res.json({ success: true, data: { entries: [], me: null } });
    }

    const spawnId = req.params.spawnId as string;
    if (!looksLikeUuid(spawnId)) {
      return res.status(400).json({ success: false, message: 'Invalid spawn ID' });
    }

    const result = await terminalEngine.getLeaderboard(spawnId, userId);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Terminals] GET /:spawnId/leaderboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load leaderboard' });
  }
});

export const terminalsRouter = router;
export default router;

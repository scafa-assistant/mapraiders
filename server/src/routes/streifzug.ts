// ============================================================
// Streifzug Routes (Patrol Mode) — Stage 1 foreground encounter loop.
// POST /start          - begin a Streifzug session
// POST /stop           - end the session
// GET  /status         - is a session active?
// POST /ping           - heartbeat: { latitude, longitude } -> encounter|null
//
// /ping is feature-gated behind `pve_spawns` (encounters ARE PvE spawns):
// flag off -> no encounters surfaced. start/stop/status are ungated so the
// client UI can toggle harmlessly. Response format: { success, data } /
// { success: false, message }. Registered in index.ts under /api/streifzug.
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { featureService } from '../services/featureService';
import { streifzugService, LatLng } from '../services/streifzugService';

const router = Router();

const PVE_FLAG = 'pve_spawns';

/** Parse + validate a {latitude, longitude} body into a typed LatLng. */
function parsePoint(body: any): LatLng | null {
  const lat = Number(body?.latitude);
  const lng = Number(body?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

/** POST /start — begin a Streifzug session. */
router.post('/start', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const status = await streifzugService.startSession(userId);
    return res.json({ success: true, data: status });
  } catch (err: any) {
    console.error('[Streifzug] POST /start error:', err);
    return res.status(500).json({ success: false, message: 'Failed to start Streifzug' });
  }
});

/** POST /stop — end the session. */
router.post('/stop', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const status = await streifzugService.stopSession(userId);
    return res.json({ success: true, data: status });
  } catch (err: any) {
    console.error('[Streifzug] POST /stop error:', err);
    return res.status(500).json({ success: false, message: 'Failed to stop Streifzug' });
  }
});

/** GET /status — is a session active for this user? */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const status = await streifzugService.getStatus(userId);
    return res.json({ success: true, data: status });
  } catch (err: any) {
    console.error('[Streifzug] GET /status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to read Streifzug status' });
  }
});

/**
 * POST /ping — heartbeat from an active session.
 * Body: { latitude, longitude }. Returns the surfaced encounter (or null).
 * Feature-gated: if pve_spawns is off, returns active=true with no encounter
 * so the client can keep pinging without errors.
 */
router.post('/ping', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const point = parsePoint(req.body);
    if (!point) {
      return res.status(400).json({
        success: false,
        message: 'latitude and longitude required',
      });
    }

    const enabled = await featureService.isEnabledFor(userId, PVE_FLAG);
    if (!enabled) {
      const status = await streifzugService.getStatus(userId);
      return res.json({
        success: true,
        data: { active: status.active, encounter: null, reason: 'feature_off' },
      });
    }

    const result = await streifzugService.ping(userId, point);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Streifzug] POST /ping error:', err);
    return res.status(500).json({ success: false, message: 'Ping failed' });
  }
});

export default router;

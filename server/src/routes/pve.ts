// ============================================================
// PvE Routes (Phase A)
// GET  /spawns?bbox=minLng,minLat,maxLng,maxLat  - spawns in viewport
// POST /spawns/:id/hack                          - attempt a hack
//
// Both routes are feature-gated behind the `pve_spawns` flag. When the
// flag is off for the user, GET returns an empty list and POST returns
// 403. Response format: { success, data } / { success: false, message }.
// Registered in index.ts under /api/pve.
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { featureService } from './../services/featureService';
import { pveSpawnEngine, BboxInput } from '../services/pveSpawnEngine';
import { hackEngine, InputTrace } from '../services/hackEngine';

const router = Router();

const PVE_FLAG = 'pve_spawns';

/**
 * Parse a "minLng,minLat,maxLng,maxLat" bbox string into a typed object.
 * Returns null when malformed or when min/max are inverted.
 */
function parseBbox(raw: unknown): BboxInput | null {
  if (typeof raw !== 'string') return null;
  const parts = raw.split(',').map((p) => parseFloat(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [minLng, minLat, maxLng, maxLat] = parts;
  if (minLng > maxLng || minLat > maxLat) return null;
  return { minLng, minLat, maxLng, maxLat };
}

/**
 * GET /spawns?bbox=minLng,minLat,maxLng,maxLat
 * Returns active PvE spawns inside the bounding box. Feature-gated: if the
 * flag is off for this user, an empty list is returned (200, not 403, so the
 * client can poll harmlessly).
 */
router.get('/spawns', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, PVE_FLAG);
    if (!enabled) {
      return res.json({ success: true, data: { spawns: [] } });
    }

    const bbox = parseBbox(req.query.bbox);
    if (!bbox) {
      return res.status(400).json({
        success: false,
        message: 'bbox required as "minLng,minLat,maxLng,maxLat"',
      });
    }

    const spawns = await pveSpawnEngine.getSpawnsInBbox(bbox, userId);

    return res.json({
      success: true,
      data: {
        spawns: spawns.map((s) => ({
          id: s.id,
          npc_type: s.npc_type,
          level: s.level,
          biome: s.biome,
          status: s.status,
          latitude: s.lat,
          longitude: s.lng,
          anchored_territory_id: s.anchored_territory_id,
          spawned_at: s.spawned_at,
          expires_at: s.expires_at,
        })),
      },
    });
  } catch (err: any) {
    console.error('[PvE] GET /spawns error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load spawns' });
  }
});

/**
 * POST /spawns/:id/hack
 * Body: { inputTrace }. Server resolves the hack and grants loot. Feature-
 * gated: flag off → 403. Domain failures (TOO_FAR, DAILY_CAP, ...) come back
 * as { success: false, message } with HTTP 200.
 */
router.post('/spawns/:id/hack', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const enabled = await featureService.isEnabledFor(userId, PVE_FLAG);
    if (!enabled) {
      return res.status(403).json({ success: false, message: 'Feature not available' });
    }

    const spawnId = req.params.id as string;
    const inputTrace = (req.body?.inputTrace ?? {}) as InputTrace;

    const result = await hackEngine.attemptHack(userId, spawnId, inputTrace);

    if (!result.success) {
      // Domain failure (TOO_FAR / DAILY_CAP / SPAWN_UNAVAILABLE / failed roll).
      // A failed roll still consumed an attempt; surface the spawn snapshot.
      return res.json({
        success: false,
        message: result.message ?? 'HACK_FAILED',
        data: { spawn: result.spawn ?? null },
      });
    }

    return res.json({
      success: true,
      data: { loot: result.loot, spawn: result.spawn },
    });
  } catch (err: any) {
    console.error('[PvE] POST /spawns/:id/hack error:', err);
    return res.status(500).json({ success: false, message: 'Hack failed' });
  }
});

export default router;

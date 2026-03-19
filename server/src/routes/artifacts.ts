// ============================================================
// Artifact Routes
// POST /api/artifacts         - Create artifact (level >= 16)
// GET  /api/artifacts         - Get nearby artifacts
// GET  /api/artifacts/:id     - Get artifact by ID
// POST /api/artifacts/:id/vote - Vote for permanence
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { queryOne } from '../config/database';
import {
  createArtifact,
  getNearbyArtifacts,
  getArtifactById,
  votePermanence,
} from '../services/artifactService';
import { UNLOCK_LEVELS } from '../config/constants';

const router = Router();

/**
 * POST /api/artifacts
 * Create an artifact at a location. Requires level >= 16 (Creator unlock).
 * The user must own the territory at the artifact's location.
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    // Check creator level requirement
    const user = await queryOne<{ level: number }>(
      'SELECT level FROM users WHERE id = $1',
      [req.userId]
    );

    if (!user || user.level < UNLOCK_LEVELS.creator) {
      return res.status(403).json({
        success: false,
        error: `Artifact creation requires level ${UNLOCK_LEVELS.creator} or higher`,
      });
    }

    const { name, description, type, rarity, lat, lng, territory_id, photo_url } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ success: false, error: 'Name must be 100 characters or less' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ success: false, error: 'Valid lat and lng are required' });
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({ success: false, error: 'lat/lng out of range' });
    }

    // Validate type if provided
    const validTypes = ['trophy', 'monument', 'mural', 'totem', 'beacon', 'relic'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Validate rarity if provided
    const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    if (rarity && !validRarities.includes(rarity)) {
      return res.status(400).json({
        success: false,
        error: `Invalid rarity. Must be one of: ${validRarities.join(', ')}`,
      });
    }

    const artifact = await createArtifact(req.userId!, {
      name: name.trim(),
      description: description?.trim() || undefined,
      type: type || 'trophy',
      rarity: rarity || 'common',
      lat: parsedLat,
      lng: parsedLng,
      territory_id: territory_id || undefined,
      photo_url: photo_url || undefined,
    });

    return res.status(201).json({
      success: true,
      data: { artifact },
    });
  } catch (err: any) {
    console.error('[Artifacts] Create artifact error:', err);

    const isUserError = err.message?.includes('must own') ||
                        err.message?.includes('not found');

    return res.status(isUserError ? 400 : 500).json({
      success: false,
      error: err.message || 'Failed to create artifact',
    });
  }
});

/**
 * GET /api/artifacts
 * Get nearby artifacts. Query params: lat, lng, radius (meters, default 5000).
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusM = Math.min(parseFloat(req.query.radius as string) || 5000, 50000);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng query parameters required',
      });
    }

    const artifacts = await getNearbyArtifacts(lat, lng, radiusM);

    return res.json({
      success: true,
      data: {
        artifacts: artifacts.map((a: any) => ({
          ...a,
          distance_m: a.distance_m ? parseFloat(a.distance_m) : undefined,
        })),
      },
    });
  } catch (err: any) {
    console.error('[Artifacts] Get nearby error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get artifacts' });
  }
});

/**
 * GET /api/artifacts/:id
 * Get artifact by ID.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const artifact = await getArtifactById(id as string);

    if (!artifact) {
      return res.status(404).json({ success: false, message: 'Artifact not found' });
    }

    return res.json({
      success: true,
      data: { artifact },
    });
  } catch (err: any) {
    console.error('[Artifacts] Get artifact error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get artifact' });
  }
});

/**
 * POST /api/artifacts/:id/vote
 * Vote to make an artifact permanent. At 50 votes, becomes permanent.
 */
router.post('/:id/vote', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await votePermanence(req.userId!, id as string);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[Artifacts] Vote error:', err);

    const isUserError = err.message?.includes('not found') ||
                        err.message?.includes('expired') ||
                        err.message?.includes('Cannot vote') ||
                        err.message?.includes('Already voted');

    return res.status(isUserError ? 400 : 500).json({
      success: false,
      error: err.message || 'Failed to vote',
    });
  }
});

export const artifactsRouter = router;
export default router;

// ============================================================
// Pet Routes
// GET  /api/pets/me       - Get user's pets
// POST /api/pets          - Register a new pet
// PUT  /api/pets/:id      - Update pet (name, breed)
// GET  /api/pets/:id/stats - Get pet stats and progress
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createPetSchema, updatePetSchema } from '../middleware/validation';
import { queryMany, queryOne, query } from '../config/database';
import { xpForLevel, levelFromXp } from '../config/constants';

const router = Router();

/**
 * GET /api/pets/me
 * Get all of the current user's registered pets.
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const pets = await queryMany(
      `SELECT id, name, species, breed, level, xp, specialization,
              total_distance_km, total_walks, rare_finds, created_at
       FROM pets
       WHERE owner_id = $1
       ORDER BY created_at ASC`,
      [req.userId]
    );

    return res.json({
      success: true,
      data: { pets },
    });
  } catch (err: any) {
    console.error('[Pets] Get pets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get pets' });
  }
});

/**
 * POST /api/pets
 * Register a new pet. Maximum 5 pets per user.
 */
router.post(
  '/',
  authenticate,
  validateBody(createPetSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, species, breed } = req.body;

      // Enforce pet limit
      const petCount = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM pets WHERE owner_id = $1',
        [req.userId]
      );

      if (parseInt(petCount?.count || '0', 10) >= 5) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 5 pets allowed per account',
        });
      }

      const pet = await queryOne(
        `INSERT INTO pets (owner_id, name, species, breed)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, species, breed, level, xp, specialization,
                  total_distance_km, total_walks, rare_finds, created_at`,
        [req.userId, name, species, breed || null]
      );

      if (!pet) {
        return res.status(500).json({ success: false, message: 'Failed to create pet' });
      }

      return res.status(201).json({
        success: true,
        data: { pet },
      });
    } catch (err: any) {
      console.error('[Pets] Create pet error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create pet' });
    }
  }
);

/**
 * PUT /api/pets/:id
 * Update a pet's name, breed, or specialization.
 * Only the pet owner can update.
 */
router.put(
  '/:id',
  authenticate,
  validateBody(updatePetSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, breed, specialization } = req.body;

      // Verify ownership
      const existing = await queryOne(
        'SELECT id FROM pets WHERE id = $1 AND owner_id = $2',
        [id, req.userId]
      );

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Pet not found or not yours' });
      }

      // Build dynamic update
      const updates: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIdx}`);
        values.push(name);
        paramIdx++;
      }

      if (breed !== undefined) {
        updates.push(`breed = $${paramIdx}`);
        values.push(breed);
        paramIdx++;
      }

      if (specialization !== undefined) {
        updates.push(`specialization = $${paramIdx}`);
        values.push(specialization);
        paramIdx++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No updates provided' });
      }

      values.push(id);

      const pet = await queryOne(
        `UPDATE pets SET ${updates.join(', ')} WHERE id = $${paramIdx}
         RETURNING id, name, species, breed, level, xp, specialization,
                  total_distance_km, total_walks, rare_finds, created_at`,
        values
      );

      return res.json({
        success: true,
        data: { pet },
      });
    } catch (err: any) {
      console.error('[Pets] Update pet error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update pet' });
    }
  }
);

/**
 * GET /api/pets/:id/stats
 * Get detailed pet stats and progression info.
 */
router.get('/:id/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get pet with owner verification
    const pet = await queryOne<{
      id: string;
      owner_id: string;
      name: string;
      species: string;
      breed: string | null;
      level: number;
      xp: number;
      specialization: string | null;
      total_distance_km: number;
      total_walks: number;
      rare_finds: number;
      created_at: Date;
    }>(
      `SELECT id, owner_id, name, species, breed, level, xp, specialization,
              total_distance_km, total_walks, rare_finds, created_at
       FROM pets WHERE id = $1`,
      [id]
    );

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Only owner can see detailed stats
    if (pet.owner_id !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not your pet' });
    }

    // Calculate progression details
    const currentLevelXp = xpForLevel(pet.level);
    const nextLevelXp = xpForLevel(pet.level + 1);
    const xpInCurrentLevel = pet.xp - currentLevelXp;
    const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
    const progressPercent = xpNeededForNextLevel > 0
      ? Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100))
      : 100;

    // Get recent walks with this pet (routes with dog_walker class around the time)
    const recentWalks = await queryMany(
      `SELECT id, distance_m, duration_s, created_at
       FROM routes
       WHERE user_id = $1 AND class = 'dog_walker'
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.userId]
    );

    return res.json({
      success: true,
      data: {
        pet: {
          id: pet.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          specialization: pet.specialization,
          created_at: pet.created_at,
        },
        stats: {
          level: pet.level,
          xp: pet.xp,
          xp_for_next_level: nextLevelXp,
          progress_percent: progressPercent,
          total_distance_km: parseFloat(pet.total_distance_km?.toString() || '0'),
          total_walks: pet.total_walks,
          rare_finds: pet.rare_finds,
          avg_walk_distance_km: pet.total_walks > 0
            ? parseFloat((pet.total_distance_km / pet.total_walks).toFixed(2))
            : 0,
        },
        recent_walks: recentWalks,
      },
    });
  } catch (err: any) {
    console.error('[Pets] Get pet stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get pet stats' });
  }
});

export const petsRouter = router;
export default router;

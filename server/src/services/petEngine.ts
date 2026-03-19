// ============================================================
// Pet Engine
// XP integration for pets: walk XP, rare finds, specializations
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { xpForLevel, levelFromXp, PET_SPECS } from '../config/constants';
import { Pet } from '../utils/types';

/** Result of awarding walk XP to a pet */
export interface PetWalkXpResult {
  xpAwarded: number;
  leveledUp: boolean;
  newLevel: number;
}

/** Result of a rare find check */
export interface RareFindResult {
  found: boolean;
  bonusXp: number;
}

/** Specialization bonus multipliers */
interface SpecializationBonuses {
  territory_bonus?: number;
  rare_find_chance?: number;
  decay_reduction?: number;
}

/**
 * Pet engine handling XP from walks, rare finds, and specialization bonuses.
 */
export class PetEngine {
  /**
   * Award XP to a user's active pet after a successful dog_walker route claim.
   *
   * - Base XP: distanceKm * 50
   * - New area bonus: +25% if isNewArea
   * - Updates pet's total_distance_km, total_walks (increment), xp
   * - Checks for level up (same curve as player: level^1.5 * 100)
   * - If leveled up, check if level 5 reached (specialization unlock notification)
   *
   * @param userId - Owner of the pet
   * @param distanceKm - Distance walked in kilometers
   * @param isNewArea - Whether this walk was in a new area
   * @returns XP awarded, level-up status, and new level
   */
  async awardWalkXp(
    userId: string,
    distanceKm: number,
    isNewArea: boolean
  ): Promise<PetWalkXpResult> {
    // Get the user's most recently created pet (primary pet)
    const pet = await queryOne<Pet>(
      `SELECT id, level, xp, specialization, total_distance_km, total_walks, rare_finds
       FROM pets
       WHERE owner_id = $1
       ORDER BY created_at ASC
       LIMIT 1`,
      [userId]
    );

    if (!pet) {
      return { xpAwarded: 0, leveledUp: false, newLevel: 0 };
    }

    // Calculate XP
    let xpAmount = Math.round(distanceKm * 50);
    if (isNewArea) {
      xpAmount = Math.round(xpAmount * 1.25);
    }

    const newXp = pet.xp + xpAmount;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > pet.level;

    // Update pet stats
    await query(
      `UPDATE pets
       SET xp = $1,
           level = $2,
           total_distance_km = total_distance_km + $3,
           total_walks = total_walks + 1
       WHERE id = $4`,
      [newXp, newLevel, distanceKm, pet.id]
    );

    // If leveled up to level 5, create specialization unlock notification
    if (leveledUp && newLevel >= 5 && pet.level < 5) {
      try {
        await query(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1, 'pet_specialization', 'Pet Specialization Unlocked!',
                   'Your pet has reached level 5! You can now choose a specialization: Explorer, Tracker, or Guardian.',
                   $2)`,
          [userId, JSON.stringify({ pet_id: pet.id, level: newLevel })]
        );
      } catch (err) {
        console.error('[PetEngine] Failed to send specialization notification:', err);
      }
    }

    // Log level-up to feed
    if (leveledUp) {
      try {
        await query(
          `INSERT INTO feed_events (type, user_id, data)
           VALUES ('pet_level_up', $1, $2)`,
          [userId, JSON.stringify({ pet_id: pet.id, new_level: newLevel })]
        );
      } catch (err) {
        console.error('[PetEngine] Failed to log pet level-up:', err);
      }
    }

    return { xpAwarded: xpAmount, leveledUp, newLevel };
  }

  /**
   * Check for a rare find during a walk.
   * 5% base chance per walk, doubled for Tracker specialization.
   *
   * If found: increment pet's rare_finds, award bonus XP (100), create feed event.
   *
   * @param userId - Owner of the pet
   * @param lat - Latitude of the walk location
   * @param lng - Longitude of the walk location
   * @returns Whether a rare item was found and any bonus XP
   */
  async checkRareFind(
    userId: string,
    lat: number,
    lng: number
  ): Promise<RareFindResult> {
    // Get the user's primary pet
    const pet = await queryOne<Pet>(
      `SELECT id, specialization, rare_finds
       FROM pets
       WHERE owner_id = $1
       ORDER BY created_at ASC
       LIMIT 1`,
      [userId]
    );

    if (!pet) {
      return { found: false, bonusXp: 0 };
    }

    // Determine chance based on specialization
    let chance = 0.05; // 5% base
    if (pet.specialization === 'tracker') {
      chance = 0.10; // 10% for tracker
    }

    // Roll random
    const roll = Math.random();
    if (roll >= chance) {
      return { found: false, bonusXp: 0 };
    }

    // Rare find! Update pet and award bonus XP
    const bonusXp = 100;

    await query(
      `UPDATE pets
       SET rare_finds = rare_finds + 1,
           xp = xp + $1
       WHERE id = $2`,
      [bonusXp, pet.id]
    );

    // Recalculate level after bonus XP
    const updatedPet = await queryOne<{ xp: number; level: number }>(
      'SELECT xp, level FROM pets WHERE id = $1',
      [pet.id]
    );

    if (updatedPet) {
      const newLevel = this.calculateLevel(updatedPet.xp);
      if (newLevel > updatedPet.level) {
        await query('UPDATE pets SET level = $1 WHERE id = $2', [newLevel, pet.id]);
      }
    }

    // Create feed event
    try {
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('pet_rare_find', $1, $2)`,
        [userId, JSON.stringify({ pet_id: pet.id, lat, lng, rare_finds: pet.rare_finds + 1 })]
      );
    } catch (err) {
      console.error('[PetEngine] Failed to log rare find:', err);
    }

    return { found: true, bonusXp };
  }

  /**
   * Get the specialization bonus multiplier for a pet.
   *
   * - Explorer: { territory_bonus: 1.1 } (10% more territory area)
   * - Tracker: { rare_find_chance: 2.0 } (double rare find chance)
   * - Guardian: { decay_reduction: 0.5 } (50% slower territory decay)
   *
   * @param petId - Pet ID
   * @param bonusType - The type of bonus to look up
   * @returns Multiplier value (defaults to 1.0 if no specialization or wrong type)
   */
  async getSpecializationBonus(
    petId: string,
    bonusType: keyof SpecializationBonuses
  ): Promise<number> {
    const pet = await queryOne<{ specialization: string | null }>(
      'SELECT specialization FROM pets WHERE id = $1',
      [petId]
    );

    if (!pet || !pet.specialization) {
      return 1.0;
    }

    const bonuses: Record<string, SpecializationBonuses> = {
      explorer: { territory_bonus: 1.1 },
      tracker: { rare_find_chance: 2.0 },
      guardian: { decay_reduction: 0.5 },
    };

    const specBonuses = bonuses[pet.specialization];
    if (!specBonuses) {
      return 1.0;
    }

    return specBonuses[bonusType] ?? 1.0;
  }

  /**
   * Set a pet's specialization. Requires the pet to be level >= 5.
   *
   * @param petId - Pet ID
   * @param spec - Specialization to set ('explorer' | 'tracker' | 'guardian')
   * @returns The updated pet
   */
  async setSpecialization(
    petId: string,
    spec: 'explorer' | 'tracker' | 'guardian'
  ): Promise<Pet> {
    const pet = await queryOne<Pet>(
      'SELECT * FROM pets WHERE id = $1',
      [petId]
    );

    if (!pet) {
      throw new Error('Pet not found');
    }

    if (pet.level < 5) {
      throw new Error('Pet must be at least level 5 to specialize');
    }

    const validSpecs = ['explorer', 'tracker', 'guardian'];
    if (!validSpecs.includes(spec)) {
      throw new Error('Invalid specialization. Must be: explorer, tracker, or guardian');
    }

    const updated = await queryOne<Pet>(
      `UPDATE pets SET specialization = $1 WHERE id = $2
       RETURNING id, owner_id, name, species, breed, level, xp, specialization,
                total_distance_km, total_walks, rare_finds, created_at`,
      [spec, petId]
    );

    if (!updated) {
      throw new Error('Failed to update specialization');
    }

    return updated;
  }

  // ---- Private Methods ----

  /**
   * Calculate pet level from XP using the same curve as players.
   * XP required for level N = level^1.5 * 100
   */
  private calculateLevel(totalXp: number): number {
    let level = 1;
    let accumulated = 0;
    while (level < 999) {
      const needed = Math.round(Math.pow(level, 1.5) * 100);
      accumulated += needed;
      if (totalXp < accumulated) return level;
      level++;
    }
    return 999;
  }
}

// ---- Singleton instance and functional exports ----

const petEngineInstance = new PetEngine();

export async function awardWalkXp(
  userId: string,
  distanceKm: number,
  isNewArea: boolean
): Promise<PetWalkXpResult> {
  return petEngineInstance.awardWalkXp(userId, distanceKm, isNewArea);
}

export async function checkRareFind(
  userId: string,
  lat: number,
  lng: number
): Promise<RareFindResult> {
  return petEngineInstance.checkRareFind(userId, lat, lng);
}

export async function getSpecializationBonus(
  petId: string,
  bonusType: keyof SpecializationBonuses
): Promise<number> {
  return petEngineInstance.getSpecializationBonus(petId, bonusType);
}

export async function setSpecialization(
  petId: string,
  spec: 'explorer' | 'tracker' | 'guardian'
): Promise<Pet> {
  return petEngineInstance.setSpecialization(petId, spec);
}

export const petEngine = petEngineInstance;

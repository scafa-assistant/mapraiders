// ============================================================
// Seed Quest Engine
// Self-growing quests that evolve based on community engagement.
// When enough players complete and rate a seed quest positively,
// it grows: gaining new steps and linking with nearby quests.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { toWktPoint as pointToWkt } from '../utils/polygon';

/** Growth level names for display */
const GROWTH_NAMES: Record<number, string> = {
  0: 'Seed',
  1: 'Sprout',
  2: 'Growing',
  3: 'Mature',
  4: 'Legendary',
};

/**
 * Growth conditions per level transition.
 * Each entry defines the minimum completions and average rating
 * required to advance from the current level to the next.
 */
const GROWTH_CONDITIONS: {
  fromLevel: number;
  minCompletions: number;
  minRating: number;
}[] = [
  { fromLevel: 0, minCompletions: 5, minRating: 3.5 },   // Seed -> Sprout
  { fromLevel: 1, minCompletions: 15, minRating: 4.0 },   // Sprout -> Growing
  { fromLevel: 2, minCompletions: 50, minRating: 4.2 },   // Growing -> Mature
  { fromLevel: 3, minCompletions: 200, minRating: 4.5 },  // Mature -> Legendary
];

/**
 * Step templates for auto-generated growth steps.
 * Each growth level triggers a different type of bonus step.
 */
const GROWTH_STEP_TEMPLATES: Record<number, {
  type: string;
  verification_type: string;
  instructionTemplate: string;
}> = {
  1: {
    type: 'FIND',
    verification_type: 'proximity',
    instructionTemplate: 'Explore the area! Find the hidden spot nearby.',
  },
  2: {
    type: 'SOLVE',
    verification_type: 'text_input',
    instructionTemplate: 'Bonus trivia: What makes this area special? (Hint: look around!)',
  },
  3: {
    type: 'CHALLENGE',
    verification_type: 'proximity',
    instructionTemplate: 'Bonus challenge: Do 10 jumping jacks at this spot to celebrate!',
  },
};

/**
 * Seed Quest Engine handling the growth lifecycle of seed quests:
 * growth checks, auto-generated bonus steps, and nearby quest linking.
 */
export class SeedQuestEngine {
  /**
   * Check if a quest should grow after a new completion + rating.
   * Growth conditions per level:
   * - Seed -> Sprout: 5 completions, avg rating >= 3.5
   * - Sprout -> Growing: 15 completions, avg rating >= 4.0
   * - Growing -> Mature: 50 completions, avg rating >= 4.2
   * - Mature -> Legendary: 200 completions, avg rating >= 4.5 (also gets permanent status)
   */
  async checkGrowth(questId: string): Promise<void> {
    try {
      const quest = await queryOne<{
        id: string;
        is_seed: boolean;
        growth_level: number;
        total_completions: number;
        avg_rating: number;
        status: string;
      }>(
        `SELECT id, is_seed, growth_level, total_completions, avg_rating, status
         FROM quests WHERE id = $1`,
        [questId]
      );

      if (!quest || !quest.is_seed) return;
      if (quest.growth_level >= 4) return; // Already legendary

      const condition = GROWTH_CONDITIONS.find(c => c.fromLevel === quest.growth_level);
      if (!condition) return;

      if (
        quest.total_completions >= condition.minCompletions &&
        quest.avg_rating >= condition.minRating
      ) {
        const newLevel = quest.growth_level + 1;

        // Update growth level
        await query(
          'UPDATE quests SET growth_level = $1 WHERE id = $2',
          [newLevel, questId]
        );

        // If reaching legendary, give permanent status
        if (newLevel === 4) {
          await query(
            "UPDATE quests SET status = 'legendary' WHERE id = $1",
            [questId]
          );
        }

        // Add a growth step
        await this.addGrowthStep(questId, newLevel);

        // Check for nearby quest links
        await this.checkNearbyLinks(questId);

        // Log to feed
        await query(
          `INSERT INTO feed_events (type, user_id, data)
           VALUES ('quest_growth', (SELECT creator_id FROM quests WHERE id = $1), $2)`,
          [questId, JSON.stringify({
            quest_id: questId,
            growth_level: newLevel,
            growth_name: GROWTH_NAMES[newLevel],
          })]
        );

        console.log(`[SeedQuest] Quest ${questId} grew to level ${newLevel} (${GROWTH_NAMES[newLevel]})`);
      }
    } catch (err) {
      console.error('[SeedQuest] Error checking growth:', err);
    }
  }

  /**
   * When a quest grows, auto-generate a new bonus step.
   * Uses the quest's existing steps as context to create a complementary step.
   * Templates based on growth level:
   * - Sprout: adds a FIND step near the quest area
   * - Growing: adds a SOLVE step (trivia about the area)
   * - Mature: adds a CHALLENGE step (fitness challenge)
   */
  async addGrowthStep(questId: string, growthLevel: number): Promise<void> {
    try {
      const template = GROWTH_STEP_TEMPLATES[growthLevel];
      if (!template) return;

      // Get the last step's location to place the new step nearby
      const lastStep = await queryOne<{
        lat: number;
        lng: number;
        step_order: number;
      }>(
        `SELECT ST_Y(location) as lat, ST_X(location) as lng, step_order
         FROM quest_steps
         WHERE quest_id = $1
         ORDER BY step_order DESC
         LIMIT 1`,
        [questId]
      );

      if (!lastStep) return;

      // Offset the new step slightly from the last step (roughly 30-50m)
      const offsetLat = lastStep.lat + (Math.random() - 0.5) * 0.0006;
      const offsetLng = lastStep.lng + (Math.random() - 0.5) * 0.0006;
      const locationWkt = pointToWkt(offsetLat, offsetLng);
      const newStepOrder = lastStep.step_order + 1;

      await query(
        `INSERT INTO quest_steps
         (quest_id, step_order, type, location, radius_m, instruction, verification_type, hint)
         VALUES ($1, $2, $3, ST_GeomFromEWKT($4), $5, $6, $7, $8)`,
        [
          questId,
          newStepOrder,
          template.type,
          locationWkt,
          40, // 40m radius for growth steps
          `[Growth Bonus] ${template.instructionTemplate}`,
          template.verification_type,
          `This step was added as the quest grew to ${GROWTH_NAMES[growthLevel]}!`,
        ]
      );

      console.log(`[SeedQuest] Added growth step ${newStepOrder} to quest ${questId}`);
    } catch (err) {
      console.error('[SeedQuest] Error adding growth step:', err);
    }
  }

  /**
   * Link nearby quests into chains.
   * When two seed quests within 500m both reach "Growing" level (2+),
   * they automatically link -- completing one unlocks a bonus on the other.
   */
  async checkNearbyLinks(questId: string): Promise<void> {
    try {
      // Get the quest's location (centroid of its steps)
      const questLocation = await queryOne<{ lat: number; lng: number; growth_level: number }>(
        `SELECT AVG(ST_Y(qs.location)) as lat, AVG(ST_X(qs.location)) as lng, q.growth_level
         FROM quests q
         JOIN quest_steps qs ON q.id = qs.quest_id
         WHERE q.id = $1
         GROUP BY q.growth_level`,
        [questId]
      );

      if (!questLocation || questLocation.growth_level < 2) return;

      const locationWkt = pointToWkt(questLocation.lat, questLocation.lng);

      // Find other seed quests within 500m that are also Growing+
      const nearbySeeds = await queryMany<{ id: string; linked_quests: string[] }>(
        `SELECT DISTINCT q.id, q.linked_quests
         FROM quests q
         JOIN quest_steps qs ON q.id = qs.quest_id
         WHERE q.is_seed = TRUE
         AND q.growth_level >= 2
         AND q.id != $1
         AND q.status = 'active'
         AND ST_DWithin(
           qs.location::geography,
           ST_GeomFromEWKT($2)::geography,
           500
         )`,
        [questId, locationWkt]
      );

      if (nearbySeeds.length === 0) return;

      // Get current quest's linked list
      const currentQuest = await queryOne<{ linked_quests: string[] }>(
        'SELECT linked_quests FROM quests WHERE id = $1',
        [questId]
      );

      const currentLinks = new Set(currentQuest?.linked_quests || []);

      for (const nearbyQuest of nearbySeeds) {
        // Skip if already linked
        if (currentLinks.has(nearbyQuest.id)) continue;

        // Add bidirectional link
        await query(
          'UPDATE quests SET linked_quests = array_append(linked_quests, $1) WHERE id = $2 AND NOT ($1 = ANY(linked_quests))',
          [nearbyQuest.id, questId]
        );
        await query(
          'UPDATE quests SET linked_quests = array_append(linked_quests, $1) WHERE id = $2 AND NOT ($1 = ANY(linked_quests))',
          [questId, nearbyQuest.id]
        );

        console.log(`[SeedQuest] Linked quests ${questId} <-> ${nearbyQuest.id}`);
      }
    } catch (err) {
      console.error('[SeedQuest] Error checking nearby links:', err);
    }
  }

  /**
   * Get growth info for display.
   */
  async getGrowthInfo(questId: string): Promise<{
    growthLevel: number;
    growthName: string;
    completionsToNext: number;
    ratingToNext: number;
    linkedQuests: string[];
  }> {
    const quest = await queryOne<{
      growth_level: number;
      total_completions: number;
      avg_rating: number;
      linked_quests: string[];
    }>(
      'SELECT growth_level, total_completions, avg_rating, linked_quests FROM quests WHERE id = $1',
      [questId]
    );

    if (!quest) {
      throw new Error('Quest not found');
    }

    const condition = GROWTH_CONDITIONS.find(c => c.fromLevel === quest.growth_level);

    return {
      growthLevel: quest.growth_level,
      growthName: GROWTH_NAMES[quest.growth_level] || 'Unknown',
      completionsToNext: condition
        ? Math.max(0, condition.minCompletions - quest.total_completions)
        : 0,
      ratingToNext: condition
        ? Math.max(0, Math.round((condition.minRating - quest.avg_rating) * 100) / 100)
        : 0,
      linkedQuests: quest.linked_quests || [],
    };
  }
}

// ---- Singleton instance and exports ----

const seedQuestEngineInstance = new SeedQuestEngine();

export const seedQuestEngine = seedQuestEngineInstance;

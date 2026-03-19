// ============================================================
// Quest Engine
// Quest creation, step verification, hint timing, rating,
// and nearby quest discovery
// ============================================================

import { query, queryOne, queryMany, transaction } from '../config/database';
import { QUEST, XP } from '../config/constants';
import { haversineDistance } from '../utils/geo';
import { toWktPoint as pointToWkt } from '../utils/polygon';
import { Quest, QuestStep, QuestProgress, VerificationType } from '../utils/types';

/** Input data for creating a new quest */
interface CreateQuestRequest {
  title: string;
  description?: string;
  territory_id?: string;
  difficulty: number;
  steps: {
    type: string;
    lat: number;
    lng: number;
    radius_m?: number;
    instruction: string;
    verification_type: string;
    expected_answer?: string;
    hint?: string;
  }[];
}

/** Input for rating a quest */
interface QuestRating {
  creativity: number;
  difficulty: number;
  worth_it: number;
  comment?: string;
}

/** Hint timing result */
interface HintTiming {
  offer: boolean;
  autoShow: boolean;
  skipOffer: boolean;
}

/**
 * Quest engine handling the full quest lifecycle:
 * creation, progression, step verification, hints, and ratings.
 */
export class QuestEngine {
  /**
   * Create a new quest with steps.
   *
   * Validates:
   * - Creator owns the territory (if territory_id specified)
   * - Creator has required level (creators unlock at level 16)
   * - Step count is within bounds (1-20)
   * - Each step has valid data
   *
   * @param creatorId - ID of the quest creator
   * @param data - Quest creation request data
   * @returns The created quest
   */
  async createQuest(creatorId: string, data: CreateQuestRequest): Promise<Quest> {
    return transaction(async (client) => {
      // Validate creator level
      const creator = await client.query(
        'SELECT level FROM users WHERE id = $1',
        [creatorId]
      );

      if (creator.rows.length === 0) {
        throw new Error('User not found');
      }

      // Quest creation requires "creator" unlock level (level 16+)
      if (creator.rows[0].level < 16) {
        throw new Error('Quest creation requires level 16 or higher');
      }

      // Validate territory ownership if specified
      if (data.territory_id) {
        const territory = await client.query(
          'SELECT owner_id FROM territories WHERE id = $1',
          [data.territory_id]
        );

        if (territory.rows.length === 0) {
          throw new Error('Territory not found');
        }

        if (territory.rows[0].owner_id !== creatorId) {
          throw new Error('You do not own this territory');
        }
      }

      // Validate step count
      if (!data.steps || data.steps.length < QUEST.MIN_STEPS || data.steps.length > QUEST.MAX_STEPS) {
        throw new Error(
          `Quests must have between ${QUEST.MIN_STEPS} and ${QUEST.MAX_STEPS} steps`
        );
      }

      // Validate difficulty
      if (data.difficulty < 1 || data.difficulty > 5) {
        throw new Error('Difficulty must be between 1 and 5');
      }

      // Validate each step
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        if (!step.instruction || step.instruction.trim().length === 0) {
          throw new Error(`Step ${i + 1} must have an instruction`);
        }
        if (typeof step.lat !== 'number' || typeof step.lng !== 'number') {
          throw new Error(`Step ${i + 1} must have valid lat/lng coordinates`);
        }
        if (step.verification_type === 'text_input' && !step.expected_answer) {
          throw new Error(`Step ${i + 1} uses text_input verification but has no expected answer`);
        }
      }

      // Create quest
      const questResult = await client.query(
        `INSERT INTO quests (creator_id, title, description, territory_id, difficulty)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          creatorId,
          data.title,
          data.description || null,
          data.territory_id || null,
          data.difficulty,
        ]
      );

      const quest = questResult.rows[0] as Quest;

      // Create steps
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        const locationWkt = pointToWkt(step.lat, step.lng);

        await client.query(
          `INSERT INTO quest_steps
           (quest_id, step_order, type, location, radius_m, instruction, verification_type, expected_answer, hint)
           VALUES ($1, $2, $3, ST_GeomFromEWKT($4), $5, $6, $7, $8, $9)`,
          [
            quest.id,
            i + 1,
            step.type,
            locationWkt,
            step.radius_m || QUEST.DEFAULT_STEP_RADIUS_M,
            step.instruction,
            step.verification_type,
            step.expected_answer || null,
            step.hint || null,
          ]
        );
      }

      return quest;
    });
  }

  /**
   * Start a quest: create a progress entry for the player.
   * If the player already has this quest in progress, returns the existing progress.
   *
   * @param userId - Player ID
   * @param questId - Quest to start
   * @returns Quest progress record
   */
  async startQuest(userId: string, questId: string): Promise<QuestProgress> {
    // Check quest exists and is active
    const quest = await queryOne<Quest>(
      "SELECT * FROM quests WHERE id = $1 AND status = 'active'",
      [questId]
    );

    if (!quest) {
      throw new Error('Quest not found or not active');
    }

    // Check for existing in-progress attempt
    const existing = await queryOne<QuestProgress>(
      `SELECT * FROM quest_progress
       WHERE user_id = $1 AND quest_id = $2 AND status = 'in_progress'`,
      [userId, questId]
    );

    if (existing) {
      return existing;
    }

    // Create new progress entry
    const result = await queryOne<QuestProgress>(
      `INSERT INTO quest_progress (user_id, quest_id, current_step, status)
       VALUES ($1, $2, 0, 'in_progress')
       RETURNING *`,
      [userId, questId]
    );

    if (!result) {
      throw new Error('Failed to start quest');
    }

    return result;
  }

  /**
   * Verify a quest step.
   *
   * Verification flow:
   * 1. Check GPS proximity to step location
   * 2. Run type-specific verification (photo, text input, etc.)
   * 3. Advance progress or complete the quest
   *
   * @param userId - Player ID
   * @param questId - Quest ID
   * @param stepId - Step to verify
   * @param proof - Verification proof (GPS location, answer, media URL)
   * @returns Verification result with next step or completion info
   */
  async verifyStep(
    userId: string,
    questId: string,
    stepId: string,
    proof: { type: string; data: any }
  ): Promise<{ verified: boolean; next_step?: QuestStep }> {
    // Get quest progress
    const progress = await queryOne<QuestProgress>(
      `SELECT * FROM quest_progress
       WHERE user_id = $1 AND quest_id = $2 AND status = 'in_progress'`,
      [userId, questId]
    );

    if (!progress) {
      throw new Error('Quest not started or already completed');
    }

    // Get the step with location data
    const step = await queryOne<QuestStep & { lat: number; lng: number }>(
      `SELECT qs.*,
              ST_Y(qs.location) as lat,
              ST_X(qs.location) as lng
       FROM quest_steps qs
       WHERE qs.id = $1 AND qs.quest_id = $2`,
      [stepId, questId]
    );

    if (!step) {
      throw new Error('Step not found');
    }

    // Perform verification
    const verified = this.performVerification(step, proof);

    if (!verified) {
      return { verified: false };
    }

    // Advance progress
    const nextStepOrder = progress.current_step + 1;

    // Get total step count
    const stepCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM quest_steps WHERE quest_id = $1',
      [questId]
    );
    const totalSteps = parseInt(stepCount?.count || '0', 10);
    const questCompleted = nextStepOrder >= totalSteps;

    if (questCompleted) {
      // Mark quest as completed
      await query(
        `UPDATE quest_progress
         SET current_step = $1, status = 'completed', completed_at = NOW()
         WHERE user_id = $2 AND quest_id = $3 AND status = 'in_progress'`,
        [nextStepOrder, userId, questId]
      );

      // Increment quest completions
      await query(
        'UPDATE quests SET total_completions = total_completions + 1 WHERE id = $1',
        [questId]
      );

      // Log to feed
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('quest_complete', $1, $2)`,
        [userId, JSON.stringify({ quest_id: questId })]
      );

      return { verified: true };
    } else {
      // Advance to next step
      await query(
        `UPDATE quest_progress SET current_step = $1
         WHERE user_id = $2 AND quest_id = $3 AND status = 'in_progress'`,
        [nextStepOrder, userId, questId]
      );

      // Fetch next step
      const nextStep = await queryOne<QuestStep & { lat: number; lng: number }>(
        `SELECT qs.*,
                ST_Y(qs.location) as lat,
                ST_X(qs.location) as lng
         FROM quest_steps qs
         WHERE qs.quest_id = $1 AND qs.step_order = $2`,
        [questId, nextStepOrder + 1]
      );

      return { verified: true, next_step: nextStep ?? undefined };
    }
  }

  /**
   * Rate a completed quest.
   *
   * Weighted average calculation:
   * - creativity: weight 1
   * - difficulty: weight 1
   * - worth_it: weight 2 (counts double)
   *
   * @param userId - Player who completed the quest
   * @param questId - Quest to rate
   * @param rating - Rating values
   */
  async rateQuest(
    userId: string,
    questId: string,
    rating: QuestRating
  ): Promise<void> {
    // Check quest exists
    const quest = await queryOne<Quest>(
      'SELECT * FROM quests WHERE id = $1',
      [questId]
    );

    if (!quest) {
      throw new Error('Quest not found');
    }

    // Must have completed the quest
    const completed = await queryOne(
      `SELECT id FROM quest_progress
       WHERE user_id = $1 AND quest_id = $2 AND status = 'completed'`,
      [userId, questId]
    );

    if (!completed) {
      throw new Error('Must complete quest before rating');
    }

    // Check for duplicate rating
    const existingRating = await queryOne(
      `SELECT id FROM ratings
       WHERE user_id = $1 AND target_type = 'quest' AND target_id = $2`,
      [userId, questId]
    );

    if (existingRating) {
      throw new Error('Already rated this quest');
    }

    // Validate rating values (1-5)
    for (const [key, value] of Object.entries({
      creativity: rating.creativity,
      difficulty: rating.difficulty,
      worth_it: rating.worth_it,
    })) {
      if (value < 1 || value > 5) {
        throw new Error(`${key} rating must be between 1 and 5`);
      }
    }

    // Save rating
    await query(
      `INSERT INTO ratings (user_id, target_type, target_id, creativity, difficulty, worth_it, comment)
       VALUES ($1, 'quest', $2, $3, $4, $5, $6)`,
      [
        userId,
        questId,
        rating.creativity,
        rating.difficulty,
        rating.worth_it,
        rating.comment || null,
      ]
    );

    // Recalculate weighted average rating for the quest
    const allRatings = await queryMany<{
      creativity: number | null;
      difficulty: number | null;
      worth_it: number;
    }>(
      "SELECT creativity, difficulty, worth_it FROM ratings WHERE target_type = 'quest' AND target_id = $1",
      [questId]
    );

    let totalWeight = 0;
    let totalScore = 0;

    for (const r of allRatings) {
      if (r.creativity !== null) {
        totalScore += r.creativity * QUEST.RATING_WEIGHT_CREATIVITY;
        totalWeight += QUEST.RATING_WEIGHT_CREATIVITY;
      }
      if (r.difficulty !== null) {
        totalScore += r.difficulty * QUEST.RATING_WEIGHT_DIFFICULTY;
        totalWeight += QUEST.RATING_WEIGHT_DIFFICULTY;
      }
      totalScore += r.worth_it * QUEST.RATING_WEIGHT_WORTH_IT;
      totalWeight += QUEST.RATING_WEIGHT_WORTH_IT;
    }

    const avgRating = totalWeight > 0
      ? Math.round((totalScore / totalWeight) * 100) / 100
      : 0;

    await query('UPDATE quests SET avg_rating = $1 WHERE id = $2', [avgRating, questId]);

    // Award quest creator XP on first positive rating
    if (allRatings.length === 1 && avgRating >= 3.0 && quest.creator_id) {
      // Defer to avoid circular dependency issues -- use raw query
      await query(
        'UPDATE users SET xp = xp + $1 WHERE id = $2',
        [XP.QUEST_CREATE, quest.creator_id]
      );
    }
  }

  /**
   * Get quests near a GPS location.
   *
   * @param lat - Latitude of the search center
   * @param lng - Longitude of the search center
   * @param radiusM - Search radius in meters
   * @param filters - Optional filters (difficulty, status, etc.)
   * @returns Array of nearby quests
   */
  async getNearbyQuests(
    lat: number,
    lng: number,
    radiusM: number,
    filters?: { difficulty?: number; status?: string; limit?: number }
  ): Promise<Quest[]> {
    const searchPoint = pointToWkt(lat, lng);
    const limit = filters?.limit || 20;

    let filterClauses = "AND q.status = 'active'";
    const params: any[] = [searchPoint, radiusM, limit];
    let paramIdx = 4;

    if (filters?.difficulty) {
      filterClauses += ` AND q.difficulty = $${paramIdx}`;
      params.push(filters.difficulty);
      paramIdx++;
    }

    if (filters?.status) {
      // Override default status filter
      filterClauses = filterClauses.replace("AND q.status = 'active'", `AND q.status = $${paramIdx}`);
      params.push(filters.status);
      paramIdx++;
    }

    const quests = await queryMany<Quest>(
      `SELECT DISTINCT q.*
       FROM quests q
       JOIN quest_steps qs ON q.id = qs.quest_id
       WHERE ST_DWithin(
         qs.location::geography,
         ST_GeomFromEWKT($1)::geography,
         $2
       )
       ${filterClauses}
       ORDER BY q.avg_rating DESC, q.total_completions DESC
       LIMIT $3`,
      params
    );

    return quests;
  }

  /**
   * Get a quest with all its steps, including location coordinates.
   *
   * @param questId - Quest ID
   * @returns Quest with steps array
   */
  async getQuestWithSteps(questId: string): Promise<Quest> {
    const quest = await queryOne<Quest>(
      'SELECT * FROM quests WHERE id = $1',
      [questId]
    );

    if (!quest) {
      throw new Error('Quest not found');
    }

    const steps = await queryMany<QuestStep & { lat: number; lng: number }>(
      `SELECT id, quest_id, step_order, type, radius_m, instruction,
              verification_type, hint,
              ST_Y(location) as lat, ST_X(location) as lng
       FROM quest_steps
       WHERE quest_id = $1
       ORDER BY step_order`,
      [questId]
    );

    return { ...quest, steps };
  }

  /**
   * Get hint timing for a quest step based on how long the player
   * has been working on it.
   *
   * - 5 minutes: offer hint
   * - 10 minutes: auto-show hint
   * - 20 minutes: offer skip
   *
   * @param startedAt - When the player started the quest
   * @returns Hint timing state
   */
  getHintTiming(startedAt: Date): HintTiming {
    const minutesElapsed =
      (Date.now() - new Date(startedAt).getTime()) / (1000 * 60);

    return {
      offer: minutesElapsed >= QUEST.HINT_OFFER_MINUTES,
      autoShow: minutesElapsed >= QUEST.HINT_AUTO_SHOW_MINUTES,
      skipOffer: minutesElapsed >= QUEST.HINT_SKIP_MINUTES,
    };
  }

  // ---- Private Methods ----

  /**
   * Perform type-specific verification for a quest step.
   */
  private performVerification(
    step: QuestStep & { lat: number; lng: number },
    proof: { type: string; data: any }
  ): boolean {
    const vType = step.verification_type as VerificationType;

    // Always check GPS proximity first
    if (proof.data?.lat !== undefined && proof.data?.lng !== undefined) {
      const inRange = this.checkProximity(
        proof.data.lat,
        proof.data.lng,
        step.lat,
        step.lng,
        step.radius_m
      );

      if (!inRange && vType !== 'text_input') {
        return false; // Must be at location for all non-text verifications
      }
    }

    switch (vType) {
      case 'proximity':
        return true; // Proximity already checked above

      case 'photo':
        return !!proof.data?.media_url;

      case 'video':
        return !!proof.data?.media_url;

      case 'text_input':
        if (!proof.data?.answer || !step.expected_answer) return false;
        return (
          proof.data.answer.toLowerCase().trim() ===
          step.expected_answer.toLowerCase().trim()
        );

      case 'sensor':
        return true; // Sensor verification done client-side; proximity check suffices

      case 'dog_only':
        return true; // Dog presence verified client-side

      default:
        return false;
    }
  }

  /**
   * Check if a point is within a given radius of a target.
   */
  private checkProximity(
    userLat: number,
    userLng: number,
    targetLat: number,
    targetLng: number,
    radiusM: number
  ): boolean {
    const distance = haversineDistance(userLat, userLng, targetLat, targetLng);
    return distance <= radiusM;
  }
}

// ---- Legacy functional exports for backward compatibility ----

const questEngineInstance = new QuestEngine();

export async function createQuest(
  creatorId: string,
  data: any
): Promise<Quest> {
  return questEngineInstance.createQuest(creatorId, data);
}

export async function startQuest(
  userId: string,
  questId: string
): Promise<QuestProgress> {
  return questEngineInstance.startQuest(userId, questId);
}

export async function verifyStep(
  userId: string,
  questId: string,
  stepId: string,
  data: { lat: number; lng: number; answer?: string; media_url?: string }
): Promise<{
  verified: boolean;
  quest_completed: boolean;
  xp_earned: number;
  message: string;
}> {
  const result = await questEngineInstance.verifyStep(userId, questId, stepId, {
    type: 'legacy',
    data,
  });

  return {
    verified: result.verified,
    quest_completed: !result.next_step && result.verified,
    xp_earned: 0,
    message: result.verified
      ? result.next_step
        ? `Step verified. Proceed to step ${result.next_step.step_order}.`
        : 'Quest completed!'
      : 'Verification failed. Check your location and try again.',
  };
}

export async function rateQuest(
  userId: string,
  questId: string,
  data: {
    creativity?: number;
    difficulty?: number;
    worth_it: number;
    comment?: string;
  }
): Promise<{ avg_rating: number }> {
  await questEngineInstance.rateQuest(userId, questId, {
    creativity: data.creativity ?? 3,
    difficulty: data.difficulty ?? 3,
    worth_it: data.worth_it,
    comment: data.comment,
  });

  const quest = await queryOne<{ avg_rating: number }>(
    'SELECT avg_rating FROM quests WHERE id = $1',
    [questId]
  );

  return { avg_rating: quest?.avg_rating ?? 0 };
}

export async function getQuestWithSteps(
  questId: string
): Promise<Quest & { steps: QuestStep[] }> {
  const result = await questEngineInstance.getQuestWithSteps(questId);
  return result as Quest & { steps: QuestStep[] };
}

export async function getHint(
  userId: string,
  questId: string,
  stepOrder: number
): Promise<{ hint: string | null; auto_show: boolean; can_skip: boolean }> {
  const progress = await queryOne<QuestProgress>(
    `SELECT * FROM quest_progress
     WHERE user_id = $1 AND quest_id = $2 AND status = 'in_progress'`,
    [userId, questId]
  );

  if (!progress) {
    throw new Error('Quest not in progress');
  }

  const step = await queryOne<{ hint: string | null }>(
    'SELECT hint FROM quest_steps WHERE quest_id = $1 AND step_order = $2',
    [questId, stepOrder]
  );

  if (!step) {
    throw new Error('Step not found');
  }

  const timing = questEngineInstance.getHintTiming(progress.started_at);

  return {
    hint: timing.offer ? step.hint : null,
    auto_show: timing.autoShow,
    can_skip: timing.skipOffer,
  };
}

export const questEngine = questEngineInstance;

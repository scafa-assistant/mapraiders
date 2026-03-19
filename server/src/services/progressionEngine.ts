// ============================================================
// Progression Engine
// XP calculations, leveling, streak management, title/prestige
// checking, unlock levels, anti-grind diminishing returns
// ============================================================

import { query, queryOne, queryMany, transaction } from '../config/database';
import {
  XP,
  LEVEL_CURVE_BASE,
  LEVEL_CURVE_EXPONENT,
  xpForLevel,
  levelFromXp,
  TITLE_DEFINITIONS,
  ANTI_GRIND_RETURNS,
} from '../config/constants';
import { TitleKey } from '../utils/types';

/** Result of an XP award operation */
interface XPResult {
  xp: number;
  levelUp?: number;
}

/**
 * Progression engine handling XP, levels, titles, streaks,
 * and anti-grind mechanics.
 */
export class ProgressionEngine {
  // ---- Public XP Award Methods ----

  /**
   * Award XP for a territory claim.
   * XP = claimValue * CLAIM_MULTIPLIER
   *
   * @param userId - Player ID
   * @param claimValue - Computed claim value
   * @returns XP earned and optional level-up
   */
  async awardClaimXP(userId: string, claimValue: number): Promise<XPResult> {
    const amount = Math.round(claimValue * XP.CLAIM_MULTIPLIER);
    return this.addXP(userId, amount);
  }

  /**
   * Award XP for creating a quest (given on first positive rating).
   *
   * @param userId - Quest creator ID
   * @returns XP earned and optional level-up
   */
  async awardQuestCreateXP(userId: string): Promise<XPResult> {
    return this.addXP(userId, XP.QUEST_CREATE);
  }

  /**
   * Award XP for solving/completing a quest.
   * XP = QUEST_SOLVE_BASE + difficulty * QUEST_SOLVE_DIFFICULTY
   *
   * @param userId - Player ID
   * @param difficulty - Quest difficulty (1-5)
   * @returns XP earned and optional level-up
   */
  async awardQuestSolveXP(userId: string, difficulty: number): Promise<XPResult> {
    const amount = XP.QUEST_SOLVE_BASE + difficulty * XP.QUEST_SOLVE_DIFFICULTY;
    return this.addXP(userId, amount);
  }

  /**
   * Award XP for dropping an echo.
   * Base XP instantly, bonus XP if the echo reaches a popularity milestone.
   *
   * @param userId - Player ID
   * @param milestone - Whether the echo hit the popular threshold (>=10 likes)
   * @returns XP earned and optional level-up
   */
  async awardEchoXP(userId: string, milestone: boolean): Promise<XPResult> {
    let amount = XP.ECHO_DROP_INSTANT;
    if (milestone) {
      amount += XP.ECHO_DROP_POPULAR;
    }
    return this.addXP(userId, amount);
  }

  /**
   * Award XP for completing a challenge.
   * XP = CHALLENGE_BASE + difficulty * CHALLENGE_DIFFICULTY
   *
   * @param userId - Player ID
   * @param difficulty - Challenge difficulty level
   * @returns XP earned and optional level-up
   */
  async awardChallengeXP(userId: string, difficulty: number): Promise<XPResult> {
    const amount = XP.CHALLENGE_BASE + difficulty * XP.CHALLENGE_DIFFICULTY;
    return this.addXP(userId, amount);
  }

  /**
   * Award daily streak bonus XP.
   * XP = streakDays * STREAK_BONUS_PER_DAY
   *
   * @param userId - Player ID
   * @param streakDays - Current streak length in days
   * @returns XP earned and optional level-up
   */
  async awardStreakXP(userId: string, streakDays: number): Promise<XPResult> {
    const amount = streakDays * XP.STREAK_BONUS_PER_DAY;
    return this.addXP(userId, amount);
  }

  // ---- Core XP and Level Logic ----

  /**
   * Add XP to a user, handle level-ups, check level-based titles,
   * and log feed events.
   *
   * @param userId - Player ID
   * @param amount - Raw XP amount to add
   * @returns The XP amount added and optional new level
   */
  private async addXP(userId: string, amount: number): Promise<XPResult> {
    const roundedAmount = Math.max(0, Math.round(amount));
    if (roundedAmount === 0) return { xp: 0 };

    return transaction(async (client) => {
      // Lock user row for update
      const user = await client.query(
        'SELECT xp, level FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (user.rows.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      const currentXp = user.rows[0].xp;
      const currentLevel = user.rows[0].level;
      const newXp = currentXp + roundedAmount;
      const newLevel = levelFromXp(newXp);
      const leveledUp = newLevel > currentLevel;

      // Update user XP and level
      await client.query(
        'UPDATE users SET xp = $1, level = $2, last_active = NOW() WHERE id = $3',
        [newXp, newLevel, userId]
      );

      // Level-up: log to feed and check level-based titles
      if (leveledUp) {
        await client.query(
          `INSERT INTO feed_events (type, user_id, data)
           VALUES ('level_up', $1, $2)`,
          [userId, JSON.stringify({ level: newLevel, xp: newXp })]
        );

        // Check and award level milestone titles
        const levelTitles: { level: number; key: TitleKey }[] = [
          { level: 10, key: 'level_10' },
          { level: 25, key: 'level_25' },
          { level: 50, key: 'level_50' },
          { level: 100, key: 'level_100' },
        ];

        for (const lt of levelTitles) {
          if (newLevel >= lt.level && currentLevel < lt.level) {
            await this.awardTitleInTx(client, userId, lt.key);
          }
        }
      }

      return {
        xp: roundedAmount,
        levelUp: leveledUp ? newLevel : undefined,
      };
    });
  }

  // ---- Level Calculations (Static) ----

  /**
   * Calculate the XP required for a single level.
   * Formula: round(1000 * N^1.5)
   *
   * @param level - The level number
   * @returns XP needed for that level
   */
  static xpForLevel(level: number): number {
    return xpForLevel(level);
  }

  /**
   * Calculate the level for a given total XP amount.
   * Iterates through levels until the cumulative XP exceeds the total.
   *
   * @param totalXP - Total accumulated XP
   * @returns Current level
   */
  static levelForXP(totalXP: number): number {
    return levelFromXp(totalXP);
  }

  // ---- Streak Management ----

  /**
   * Update the user's daily activity streak.
   *
   * Logic:
   * - If last_active was yesterday (different calendar day): streak++
   * - If last_active was today: no change
   * - If last_active was >1 calendar day ago: reset to 1
   *
   * Also checks and awards streak-based titles.
   *
   * @param userId - Player ID
   * @returns New streak day count
   */
  async updateStreak(userId: string): Promise<number> {
    const user = await queryOne<{ last_active: Date; streak_days: number }>(
      'SELECT last_active, streak_days FROM users WHERE id = $1',
      [userId]
    );

    if (!user) return 0;

    const now = new Date();
    const lastActive = new Date(user.last_active);

    // Compare calendar dates
    const todayStr = now.toISOString().split('T')[0];
    const lastStr = lastActive.toISOString().split('T')[0];

    let newStreak: number;

    if (todayStr === lastStr) {
      // Same day: no change
      newStreak = user.streak_days;
    } else {
      // Check if yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastStr === yesterdayStr) {
        // Last active was yesterday: increment
        newStreak = user.streak_days + 1;
      } else {
        // Streak broken: reset to 1
        newStreak = 1;
      }
    }

    await query(
      'UPDATE users SET streak_days = $1, last_active = NOW() WHERE id = $2',
      [newStreak, userId]
    );

    // Check and award streak titles
    const streakTitles: { days: number; key: TitleKey }[] = [
      { days: 7, key: 'streak_7' },
      { days: 30, key: 'streak_30' },
      { days: 90, key: 'streak_90' },
      { days: 365, key: 'streak_365' },
    ];

    for (const st of streakTitles) {
      if (newStreak >= st.days) {
        await this.awardTitle(userId, st.key);
      }
    }

    return newStreak;
  }

  // ---- Title System ----

  /**
   * Check all title qualifications for a user and award any newly earned titles.
   *
   * Checks:
   * - Claim count milestones (1, 10, 100)
   * - Quest completions (50)
   * - Echo count (10) and echo likes (100)
   * - Distance milestones (100km, 1000km)
   * - Dog walker count (100)
   * - Clan membership (5)
   * - Night owl / early bird (20 claims in time range)
   * - Storm chaser (10 claims in storm weather)
   *
   * @param userId - Player ID
   * @returns Array of newly earned title keys
   */
  async checkTitles(userId: string): Promise<string[]> {
    const earned: string[] = [];

    try {
      // Claim count titles
      const claimCount = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM territories WHERE owner_id = $1',
        [userId]
      );
      const claims = parseInt(claimCount?.count || '0', 10);

      if (claims >= 1) earned.push(...(await this.tryAwardTitle(userId, 'first_claim')));
      if (claims >= 10) earned.push(...(await this.tryAwardTitle(userId, 'claim_10')));
      if (claims >= 100) earned.push(...(await this.tryAwardTitle(userId, 'claim_100')));

      // Quest completions
      const questCount = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM quest_progress
         WHERE user_id = $1 AND status = 'completed'`,
        [userId]
      );
      if (parseInt(questCount?.count || '0', 10) >= 50) {
        earned.push(...(await this.tryAwardTitle(userId, 'quest_master')));
      }

      // Quest creator (check if they have a quest with positive rating)
      const questCreator = await queryOne<{ id: string }>(
        `SELECT id FROM quests
         WHERE creator_id = $1 AND avg_rating >= 3.0
         LIMIT 1`,
        [userId]
      );
      if (questCreator) {
        earned.push(...(await this.tryAwardTitle(userId, 'quest_creator')));
      }

      // Echo count
      const echoCount = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM echos WHERE creator_id = $1',
        [userId]
      );
      if (parseInt(echoCount?.count || '0', 10) >= 10) {
        earned.push(...(await this.tryAwardTitle(userId, 'echo_dropper')));
      }

      // Echo likes
      const echoLikes = await queryOne<{ total: string }>(
        'SELECT COALESCE(SUM(likes), 0) as total FROM echos WHERE creator_id = $1',
        [userId]
      );
      if (parseInt(echoLikes?.total || '0', 10) >= 100) {
        earned.push(...(await this.tryAwardTitle(userId, 'echo_legend')));
      }

      // Total distance
      const totalDist = await queryOne<{ total: string }>(
        'SELECT COALESCE(SUM(distance_m), 0) as total FROM routes WHERE user_id = $1',
        [userId]
      );
      const distKm = parseFloat(totalDist?.total || '0') / 1000;
      if (distKm >= 100) earned.push(...(await this.tryAwardTitle(userId, 'explorer_100km')));
      if (distKm >= 1000) earned.push(...(await this.tryAwardTitle(userId, 'explorer_1000km')));

      // Dog walker
      const dogWalks = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM routes
         WHERE user_id = $1 AND class = 'dog_walker'`,
        [userId]
      );
      if (parseInt(dogWalks?.count || '0', 10) >= 100) {
        earned.push(...(await this.tryAwardTitle(userId, 'dog_whisperer')));
      }

      // Clan membership
      const clanCount = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM clan_members WHERE user_id = $1',
        [userId]
      );
      if (parseInt(clanCount?.count || '0', 10) >= 5) {
        earned.push(...(await this.tryAwardTitle(userId, 'clan_founder')));
      }

      // Night owl: 20 claims between 22:00 and 05:00
      const nightClaims = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM territories
         WHERE owner_id = $1
         AND (EXTRACT(HOUR FROM claimed_at) >= 22 OR EXTRACT(HOUR FROM claimed_at) < 5)`,
        [userId]
      );
      if (parseInt(nightClaims?.count || '0', 10) >= 20) {
        earned.push(...(await this.tryAwardTitle(userId, 'night_owl')));
      }

      // Early bird: 20 claims between 05:00 and 07:00
      const earlyClaims = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM territories
         WHERE owner_id = $1
         AND EXTRACT(HOUR FROM claimed_at) >= 5
         AND EXTRACT(HOUR FROM claimed_at) < 7`,
        [userId]
      );
      if (parseInt(earlyClaims?.count || '0', 10) >= 20) {
        earned.push(...(await this.tryAwardTitle(userId, 'early_bird')));
      }

      // Storm chaser: 10 claims in storm weather
      const stormClaims = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM routes
         WHERE user_id = $1 AND weather_bonus >= 2.0`,
        [userId]
      );
      if (parseInt(stormClaims?.count || '0', 10) >= 10) {
        earned.push(...(await this.tryAwardTitle(userId, 'storm_chaser')));
      }
    } catch (err) {
      console.error('[Progression] Error checking titles:', err);
    }

    return earned;
  }

  // ---- Unlock Levels ----

  /**
   * Get the unlock level name for a given player level.
   *
   * Level brackets:
   * - 1-5: newcomer
   * - 6-15: claimer
   * - 16-30: creator
   * - 31-50: architect
   * - 51+: legend
   *
   * @param level - Player level
   * @returns Unlock level name
   */
  static getUnlockLevel(level: number): string {
    if (level <= 5) return 'newcomer';
    if (level <= 15) return 'claimer';
    if (level <= 30) return 'creator';
    if (level <= 50) return 'architect';
    return 'legend';
  }

  // ---- Anti-Grind: Diminishing Returns ----

  /**
   * Get the diminishing returns multiplier for repeated routes
   * over the same area within 24 hours.
   *
   * Returns: 1.0 (first), 0.5 (second), 0.25 (third), 0.1 (fourth+)
   *
   * @param userId - Player ID
   * @param polygonWkt - WKT polygon of the new route
   * @returns Multiplier between 0.1 and 1.0
   */
  async getDiminishingFactor(userId: string, polygonWkt: string): Promise<number> {
    try {
      const result = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM routes
         WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '24 hours'
         AND polygon IS NOT NULL
         AND ST_Intersects(polygon, ST_GeomFromEWKT($2))`,
        [userId, polygonWkt]
      );

      const count = parseInt(result?.count || '0', 10);
      return ANTI_GRIND_RETURNS[Math.min(count, ANTI_GRIND_RETURNS.length - 1)];
    } catch {
      return 1.0;
    }
  }

  // ---- Private Helpers ----

  /**
   * Award a title (idempotent -- does nothing if already earned).
   */
  private async awardTitle(userId: string, titleKey: TitleKey): Promise<boolean> {
    try {
      const result = await query(
        `INSERT INTO user_titles (user_id, title_key)
         VALUES ($1, $2)
         ON CONFLICT (user_id, title_key) DO NOTHING
         RETURNING id`,
        [userId, titleKey]
      );

      if (result.rowCount && result.rowCount > 0) {
        const def = TITLE_DEFINITIONS.find(t => t.key === titleKey);
        await query(
          `INSERT INTO feed_events (type, user_id, data)
           VALUES ('title_earned', $1, $2)`,
          [userId, JSON.stringify({ title_key: titleKey, title_name: def?.name })]
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Award a title within an existing transaction.
   */
  private async awardTitleInTx(client: any, userId: string, titleKey: TitleKey): Promise<boolean> {
    try {
      const result = await client.query(
        `INSERT INTO user_titles (user_id, title_key)
         VALUES ($1, $2)
         ON CONFLICT (user_id, title_key) DO NOTHING
         RETURNING id`,
        [userId, titleKey]
      );
      return (result.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Attempt to award a title and return the key if newly awarded.
   */
  private async tryAwardTitle(userId: string, key: TitleKey): Promise<string[]> {
    const awarded = await this.awardTitle(userId, key);
    return awarded ? [key] : [];
  }
}

// ---- Legacy functional exports for backward compatibility ----

const progressionInstance = new ProgressionEngine();

export async function awardXp(
  userId: string,
  amount: number,
  _reason: string
): Promise<{ totalXp: number; level: number; leveledUp: boolean; titlesEarned: string[] }> {
  const result = await progressionInstance.awardClaimXP(userId, amount / XP.CLAIM_MULTIPLIER);
  // Re-fetch for full details
  const user = await queryOne<{ xp: number; level: number }>('SELECT xp, level FROM users WHERE id = $1', [userId]);
  return {
    totalXp: user?.xp ?? 0,
    level: user?.level ?? 1,
    leveledUp: result.levelUp !== undefined,
    titlesEarned: [],
  };
}

export function calculateClaimXp(claimValue: number): number {
  return Math.round(claimValue * XP.CLAIM_MULTIPLIER);
}

export function calculateQuestSolveXp(difficulty: number): number {
  return XP.QUEST_SOLVE_BASE + difficulty * XP.QUEST_SOLVE_DIFFICULTY;
}

export function calculateChallengeXp(difficulty: number): number {
  return XP.CHALLENGE_BASE + difficulty * XP.CHALLENGE_DIFFICULTY;
}

export function calculateEchoXp(likes: number = 0): number {
  let xp = XP.ECHO_DROP_INSTANT;
  if (likes >= XP.ECHO_POPULAR_THRESHOLD) {
    xp += XP.ECHO_DROP_POPULAR;
  }
  return xp;
}

export function calculateStreakXp(streakDays: number): number {
  return streakDays * XP.STREAK_BONUS_PER_DAY;
}

export async function updateStreak(userId: string): Promise<number> {
  return progressionInstance.updateStreak(userId);
}

export async function checkTitles(userId: string): Promise<string[]> {
  return progressionInstance.checkTitles(userId);
}

export async function awardTitle(userId: string, titleKey: TitleKey): Promise<boolean> {
  try {
    const result = await query(
      `INSERT INTO user_titles (user_id, title_key)
       VALUES ($1, $2)
       ON CONFLICT (user_id, title_key) DO NOTHING
       RETURNING id`,
      [userId, titleKey]
    );
    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export const progressionEngine = progressionInstance;

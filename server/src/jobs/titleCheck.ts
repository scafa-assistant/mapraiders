// ============================================================
// Title Check Job
// Checks recently active users for new title qualifications
// and awards titles + sends notifications.
// ============================================================

import { query, queryMany } from '../config/database';
import { TITLES } from '../config/constants';
import { notifyNewTitle } from '../services/notificationService';

/**
 * Check recently active users for new title qualifications.
 *
 * @param sinceHours - look at users active within this many hours (default 2)
 * @returns number of titles awarded
 */
export async function checkTitles(
  sinceHours: number = 2,
): Promise<{ awarded: number }> {
  let awarded = 0;

  try {
    // Get users active in the last N hours
    const users = await queryMany<{ id: string }>(
      `SELECT id FROM users
       WHERE last_active > NOW() - INTERVAL '1 hour' * $1
         AND banned = false
       LIMIT 1000`,
      [sinceHours],
    );

    for (const user of users) {
      try {
        const newTitles = await checkUserTitles(user.id);
        awarded += newTitles.length;
      } catch (userErr) {
        console.error(
          `[TitleCheck] Failed to check titles for user ${user.id}:`,
          userErr,
        );
      }
    }
  } catch (err) {
    console.error('[TitleCheck] Failed to fetch active users:', err);
  }

  return { awarded };
}

/**
 * Check a single user against all title requirements.
 * Returns the keys of newly awarded titles.
 */
async function checkUserTitles(userId: string): Promise<string[]> {
  const earned: string[] = [];

  // Get the set of titles the user already has
  const existing = await queryMany<{ title_key: string }>(
    `SELECT title_key FROM user_titles WHERE user_id = $1`,
    [userId],
  );
  const existingKeys = new Set(existing.map((r) => r.title_key));

  // ---- street_beast: 100 verified challenge submissions ----
  if (!existingKeys.has('street_beast')) {
    const r = await query(
      `SELECT COUNT(*) AS c
       FROM challenge_submissions
       WHERE user_id = $1 AND verified = true`,
      [userId],
    );
    if (parseInt(r.rows[0].c, 10) >= 100) {
      await awardTitle(userId, 'street_beast');
      earned.push('street_beast');
    }
  }

  // ---- iron_grip: 50 pullup challenge completions ----
  if (!existingKeys.has('iron_grip')) {
    const r = await query(
      `SELECT COUNT(*) AS c
       FROM challenge_submissions cs
       JOIN challenges ch ON ch.id = cs.challenge_id
       WHERE cs.user_id = $1
         AND cs.verified = true
         AND ch.template = 'pullups'`,
      [userId],
    );
    if (parseInt(r.rows[0].c, 10) >= 50) {
      await awardTitle(userId, 'iron_grip');
      earned.push('iron_grip');
    }
  }

  // ---- trail_dog: 500 km total distance with dog_walker class ----
  if (!existingKeys.has('trail_dog')) {
    const r = await query(
      `SELECT COALESCE(SUM(distance_m), 0) AS total_m
       FROM routes
       WHERE user_id = $1 AND class = 'dog_walker'`,
      [userId],
    );
    const totalKm = parseFloat(r.rows[0].total_m) / 1000;
    if (totalKm >= 500) {
      await awardTitle(userId, 'trail_dog');
      earned.push('trail_dog');
    }
  }

  // ---- urban_explorer: 100 different territories claimed ----
  if (!existingKeys.has('urban_explorer')) {
    const r = await query(
      `SELECT COUNT(DISTINCT id) AS c
       FROM territories
       WHERE owner_id = $1`,
      [userId],
    );
    if (parseInt(r.rows[0].c, 10) >= 100) {
      await awardTitle(userId, 'urban_explorer');
      earned.push('urban_explorer');
    }
  }

  // ---- echo_master: 10 legendary echos ----
  if (!existingKeys.has('echo_master')) {
    const r = await query(
      `SELECT COUNT(*) AS c
       FROM echos
       WHERE creator_id = $1 AND status = 'legendary'`,
      [userId],
    );
    if (parseInt(r.rows[0].c, 10) >= 10) {
      await awardTitle(userId, 'echo_master');
      earned.push('echo_master');
    }
  }

  // ---- questmaker: 20 quests with avg_rating >= 4.5 ----
  if (!existingKeys.has('questmaker')) {
    const r = await query(
      `SELECT COUNT(*) AS c
       FROM quests
       WHERE creator_id = $1 AND avg_rating >= 4.5`,
      [userId],
    );
    if (parseInt(r.rows[0].c, 10) >= 20) {
      await awardTitle(userId, 'questmaker');
      earned.push('questmaker');
    }
  }

  // ---- night_runner: 50 territory claims between 22:00 and 05:00 ----
  if (!existingKeys.has('night_runner')) {
    const r = await query(
      `SELECT COUNT(*) AS c
       FROM territories
       WHERE owner_id = $1
         AND (EXTRACT(HOUR FROM claimed_at) >= 22 OR EXTRACT(HOUR FROM claimed_at) < 5)`,
      [userId],
    );
    if (parseInt(r.rows[0].c, 10) >= 50) {
      await awardTitle(userId, 'night_runner');
      earned.push('night_runner');
    }
  }

  // ---- storm_rider: 20 claims with weather_bonus >= 2.0 ----
  if (!existingKeys.has('storm_rider')) {
    const r = await query(
      `SELECT COUNT(*) AS c
       FROM routes
       WHERE user_id = $1 AND weather_bonus >= 2.0`,
      [userId],
    );
    if (parseInt(r.rows[0].c, 10) >= 20) {
      await awardTitle(userId, 'storm_rider');
      earned.push('storm_rider');
    }
  }

  return earned;
}

/**
 * Award a title to a user and send a notification.
 */
async function awardTitle(userId: string, titleKey: string): Promise<void> {
  await query(
    `INSERT INTO user_titles (user_id, title_key, earned_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT DO NOTHING`,
    [userId, titleKey],
  );

  // Look up the human-readable title name from constants
  const titleDef = TITLES[titleKey];
  const titleName = titleDef ? titleDef.name : titleKey;

  try {
    await notifyNewTitle(userId, titleKey, titleName);
  } catch (err) {
    console.error(
      `[TitleCheck] Failed to send title notification to user ${userId}:`,
      err,
    );
  }
}

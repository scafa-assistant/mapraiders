// ============================================================
// Decay Cron - Main Cron Job Scheduler
// Sets up ALL scheduled jobs for the Gridwalker server.
// ============================================================

import cron from 'node-cron';
import {
  processAllTerritoryDecay,
  processEchoDecay,
  processQuestDecay,
  processChallengeDecay,
} from '../services/decayEngine';
import { refreshAllLeaderboards } from '../services/leaderboardService';
import { runClanFormation } from '../services/clanService';
import { checkTitles } from '../services/progressionEngine';
import {
  notifyStreakAtRisk,
  notifyNewTitle,
  sendNotification,
} from '../services/notificationService';
import { query, queryMany } from '../config/database';
import { TITLES, LEGENDARY } from '../config/constants';
import { refreshAllLeaderboards as refreshLeaderboardsFull } from './leaderboardCron';
import { runClanFormation as runClanFormationJob } from './clanFormation';
import { checkTitles as checkTitlesJob } from './titleCheck';
import { weatherService } from '../services/weatherService';
import { cacheGet, cacheSet } from '../config/redis';

/**
 * Setup all cron jobs. Call once at server start.
 */
export function setupCronJobs(): void {
  console.log('[CRON] Setting up scheduled jobs...');

  // ------------------------------------------------------------------
  // Daily at 04:00 UTC - Territory decay
  // ------------------------------------------------------------------
  cron.schedule('0 4 * * *', async () => {
    console.log('[CRON] Running territory decay...');
    try {
      const result = await processAllTerritoryDecay();
      console.log(
        `[CRON] Territory decay: ${result.updated} updated, ${result.unclaimed} removed`,
      );
    } catch (err) {
      console.error('[CRON] Territory decay failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 04:15 UTC - Echo decay
  // ------------------------------------------------------------------
  cron.schedule('15 4 * * *', async () => {
    console.log('[CRON] Running echo decay...');
    try {
      const result = await processEchoDecay();
      console.log(`[CRON] Echo decay: ${result.expired} expired`);
    } catch (err) {
      console.error('[CRON] Echo decay failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 04:30 UTC - Quest decay
  // ------------------------------------------------------------------
  cron.schedule('30 4 * * *', async () => {
    console.log('[CRON] Running quest decay...');
    try {
      const result = await processQuestDecay();
      console.log(`[CRON] Quest decay: ${result.archived} archived`);
    } catch (err) {
      console.error('[CRON] Quest decay failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 04:45 UTC - Challenge decay
  // ------------------------------------------------------------------
  cron.schedule('45 4 * * *', async () => {
    console.log('[CRON] Running challenge decay...');
    try {
      const result = await processChallengeDecay();
      console.log(`[CRON] Challenge decay: ${result.archived} archived`);
    } catch (err) {
      console.error('[CRON] Challenge decay failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 05:00 UTC - Legendary promotion check
  // ------------------------------------------------------------------
  cron.schedule('0 5 * * *', async () => {
    console.log('[CRON] Running legendary promotion check...');
    try {
      let promoted = 0;

      // Quests: rating >= LEGENDARY threshold AND completions >= threshold
      const legendaryQuests = await query(
        `UPDATE quests SET status = 'legendary'
         WHERE status = 'active'
           AND avg_rating >= $1
           AND total_completions >= $2
         RETURNING id`,
        [LEGENDARY.quest_rating, LEGENDARY.quest_completions],
      );
      promoted += legendaryQuests.rowCount ?? 0;

      // Echos: likes >= LEGENDARY threshold
      const legendaryEchos = await query(
        `UPDATE echos SET status = 'legendary'
         WHERE status = 'active'
           AND likes >= $1
         RETURNING id`,
        [LEGENDARY.echo_likes],
      );
      promoted += legendaryEchos.rowCount ?? 0;

      // Travel routes: rating >= threshold AND total ratings >= threshold
      const legendaryRoutes = await query(
        `UPDATE travel_routes SET status = 'legendary'
         WHERE status = 'published'
           AND avg_rating >= $1
           AND total_ratings >= $2
         RETURNING id`,
        [LEGENDARY.route_rating, LEGENDARY.route_ratings],
      );
      promoted += legendaryRoutes.rowCount ?? 0;

      console.log(`[CRON] Legendary promotion: ${promoted} items promoted`);
    } catch (err) {
      console.error('[CRON] Legendary promotion check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Hourly at :00 - Refresh leaderboards
  // ------------------------------------------------------------------
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Refreshing leaderboards...');
    try {
      await refreshLeaderboardsFull();
      console.log('[CRON] Leaderboards refreshed');
    } catch (err) {
      console.error('[CRON] Leaderboard refresh failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Hourly at :30 - Check title qualifications for recently active users
  // ------------------------------------------------------------------
  cron.schedule('30 * * * *', async () => {
    console.log('[CRON] Checking title qualifications...');
    try {
      const result = await checkTitlesJob(2);
      console.log(`[CRON] Title check: ${result.awarded} titles awarded`);
    } catch (err) {
      console.error('[CRON] Title check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 03:00 UTC - Clan formation
  // ------------------------------------------------------------------
  cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Running clan formation...');
    try {
      const result = await runClanFormationJob();
      console.log(`[CRON] Clan formation: ${result.created} clans created/updated`);
    } catch (err) {
      console.error('[CRON] Clan formation failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 01:00 UTC - Streak warnings
  // ------------------------------------------------------------------
  cron.schedule('0 1 * * *', async () => {
    console.log('[CRON] Checking streak warnings...');
    try {
      // Find users whose streak is at risk:
      //   streak > 0, last_active between 23 and 24 hours ago
      const atRiskUsers = await queryMany<{
        id: string;
        streak_days: number;
      }>(
        `SELECT id, streak_days FROM users
         WHERE streak_days > 0
           AND last_active < NOW() - INTERVAL '23 hours'
           AND last_active > NOW() - INTERVAL '24 hours'
           AND banned = false
         LIMIT 500`,
      );

      let notified = 0;
      for (const user of atRiskUsers) {
        try {
          await notifyStreakAtRisk(user.id, user.streak_days);
          notified++;
        } catch (userErr) {
          console.error(
            `[CRON] Failed to notify user ${user.id} about streak:`,
            userErr,
          );
        }
      }

      console.log(
        `[CRON] Streak warnings: ${notified} notifications sent (${atRiskUsers.length} at risk)`,
      );
    } catch (err) {
      console.error('[CRON] Streak warning check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Weekly Sunday 06:00 UTC - Cleanup old notifications
  // ------------------------------------------------------------------
  cron.schedule('0 6 * * 0', async () => {
    console.log('[CRON] Cleaning up old notifications...');
    try {
      const result = await query(
        `DELETE FROM notifications
         WHERE created_at < NOW() - INTERVAL '30 days'`,
      );
      const deleted = result.rowCount ?? 0;
      console.log(`[CRON] Notification cleanup: ${deleted} old notifications deleted`);
    } catch (err) {
      console.error('[CRON] Notification cleanup failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 02:00 UTC - GDPR: GPS route data TTL (data minimization)
  // Deletes raw GPS route points older than 90 days.
  // Territory polygons are kept; only raw route data is removed.
  // ------------------------------------------------------------------
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Running GPS route data TTL cleanup...');
    try {
      const result = await query(
        `DELETE FROM routes
         WHERE created_at < NOW() - INTERVAL '90 days'`,
      );
      const deleted = result.rowCount ?? 0;
      console.log(`[CRON] GPS route TTL: ${deleted} old route records deleted`);
    } catch (err) {
      console.error('[CRON] GPS route TTL cleanup failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Every 15 minutes - Weather-activated content notifications
  // Checks active areas for weather changes and notifies nearby users
  // about weather-specific quests/challenges that became active.
  // ------------------------------------------------------------------
  cron.schedule('*/15 * * * *', async () => {
    console.log('[CRON] Checking weather-activated content...');
    try {
      // Find active areas: distinct grid cells with claims in the last 24h
      const activeAreas = await queryMany<{ lat: number; lng: number }>(
        `SELECT DISTINCT
           ROUND(ST_Y(ST_Centroid(polygon))::numeric, 1)::double precision AS lat,
           ROUND(ST_X(ST_Centroid(polygon))::numeric, 1)::double precision AS lng
         FROM territories
         WHERE claimed_at > NOW() - INTERVAL '24 hours'
         LIMIT 50`,
      );

      let notified = 0;

      for (const area of activeAreas) {
        try {
          const weather = await weatherService.getWeather(area.lat, area.lng);
          const condition = weather.condition || 'clear';
          const areaKey = `weather_cron:${area.lat}:${area.lng}`;

          // Check if weather changed since last check
          const lastCondition = await cacheGet<string>(areaKey);
          if (lastCondition === condition) continue; // No change

          // Store current weather for next comparison (30 min TTL)
          await cacheSet(areaKey, condition, 1800);

          // Count weather-specific quests/challenges now active in this area
          const weatherContent = await queryMany<{ count: string; type: string }>(
            `SELECT 'quest' AS type, COUNT(*)::text AS count
             FROM quests q
             JOIN quest_steps qs ON q.id = qs.quest_id
             WHERE q.status = 'active'
               AND q.weather_condition = $1
               AND ST_DWithin(qs.location::geography, ST_MakePoint($3, $2)::geography, 5000)
             UNION ALL
             SELECT 'challenge' AS type, COUNT(*)::text AS count
             FROM challenges c
             WHERE c.status = 'active'
               AND c.weather_condition = $1
               AND ST_DWithin(c.location::geography, ST_MakePoint($3, $2)::geography, 5000)`,
            [condition, area.lat, area.lng],
          );

          const totalCount = weatherContent.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

          if (totalCount > 0) {
            // Find users with recent activity in this area
            const nearbyUsers = await queryMany<{ id: string }>(
              `SELECT DISTINCT t.owner_id AS id
               FROM territories t
               WHERE t.owner_id IS NOT NULL
                 AND t.claimed_at > NOW() - INTERVAL '24 hours'
                 AND ST_DWithin(ST_Centroid(t.polygon)::geography, ST_MakePoint($2, $1)::geography, 5000)
               LIMIT 100`,
              [area.lat, area.lng],
            );

            const conditionLabel = condition.charAt(0).toUpperCase() + condition.slice(1);

            for (const user of nearbyUsers) {
              try {
                await sendNotification({
                  userId: user.id,
                  type: 'new_quest_nearby',
                  title: `Weather Alert: ${conditionLabel}!`,
                  body: `${totalCount} ${condition} quest${totalCount > 1 ? 's' : ''} appeared nearby!`,
                  data: { weather: condition, count: totalCount },
                  priority: 'MEDIUM',
                });
                notified++;
              } catch {
                // Skip individual user notification failures
              }
            }
          }
        } catch (areaErr) {
          console.error(`[CRON] Weather check failed for area ${area.lat},${area.lng}:`, areaErr);
        }
      }

      console.log(`[CRON] Weather content: ${notified} notifications sent for ${activeAreas.length} areas`);
    } catch (err) {
      console.error('[CRON] Weather-activated content check failed:', err);
    }
  }, { timezone: 'UTC' });

  console.log('[CRON] All jobs scheduled.');
}

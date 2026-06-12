// ============================================================
// Decay Cron - Main Cron Job Scheduler
// Sets up ALL scheduled jobs for the MapRaiders server.
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
import { TITLES, LEGENDARY, DECAY } from '../config/constants';
import { refreshAllLeaderboards as refreshLeaderboardsFull } from './leaderboardCron';
import { runClanFormation as runClanFormationJob } from './clanFormation';
import { checkTitles as checkTitlesJob } from './titleCheck';
import { weatherService } from '../services/weatherService';
import { cacheGet, cacheSet } from '../config/redis';
import { eventEngine } from '../services/eventEngine';
import { balanceService } from '../services/balanceService';
import { checkAutoBounty } from '../services/bountyService';
import { meetupService } from '../services/meetupService';
import { recordCronRun, acquireCronLock, releaseCronLock } from '../services/cronMonitor';
import { runH3Backfill, runOsmPrefetch } from './phase0Jobs';
import { runPveSpawnTick, runAetherLeechTick } from './phaseAJobs';
import { runEnergyTick, runBuildingCompletion } from './phaseBJobs';
import { runTroopArrivalTick, runVisibilityCleanup } from './phaseC1Jobs';

/**
 * Setup all cron jobs. Call once at server start.
 */
export function setupCronJobs(): void {
  console.log('[CRON] Setting up scheduled jobs...');

  // ------------------------------------------------------------------
  // Daily at 04:00 UTC - Territory decay
  // ------------------------------------------------------------------
  cron.schedule('0 4 * * *', async () => {
    const startTime = Date.now();
    const locked = await acquireCronLock('territory_decay', 3600);
    if (!locked) return;

    console.log('[CRON] Running territory decay...');
    try {
      const result = await processAllTerritoryDecay();
      console.log(
        `[CRON] Territory decay: ${result.updated} updated, ${result.unclaimed} removed`,
      );
      await recordCronRun({
        job: 'territory_decay',
        status: 'success',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: result.updated + result.unclaimed,
      });
    } catch (err) {
      console.error('[CRON] Territory decay failed:', err);
      await recordCronRun({
        job: 'territory_decay',
        status: 'failure',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        error: String(err),
      });
    } finally {
      await releaseCronLock('territory_decay');
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

  // ------------------------------------------------------------------
  // Every 5 minutes - Activate scheduled events + complete expired events
  // ------------------------------------------------------------------
  cron.schedule('*/5 * * * *', async () => {
    try {
      const activated = await eventEngine.activateScheduledEvents();
      const completed = await eventEngine.completeExpiredEvents();
      const cleaned = await eventEngine.cleanupExpiredLoot();
      if (activated > 0 || completed > 0 || cleaned > 0) {
        console.log(
          `[CRON] Events: ${activated} activated, ${completed} completed, ${cleaned} loot cleaned`,
        );
      }
    } catch (err) {
      console.error('[CRON] Event lifecycle check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 12:00 UTC - King of the Hill in a random active area
  // ------------------------------------------------------------------
  cron.schedule('0 12 * * *', async () => {
    console.log('[CRON] Spawning King of the Hill event...');
    try {
      // Pick a random active area from recent territory claims
      const area = await queryMany<{ lat: number; lng: number }>(
        `SELECT
           ST_Y(ST_Centroid(polygon))::double precision AS lat,
           ST_X(ST_Centroid(polygon))::double precision AS lng
         FROM territories
         WHERE claimed_at > NOW() - INTERVAL '48 hours'
           AND owner_id IS NOT NULL
         ORDER BY RANDOM()
         LIMIT 1`,
      );

      if (area.length > 0) {
        await eventEngine.startKingOfHill(area[0].lat, area[0].lng);
        console.log(`[CRON] King of the Hill at ${area[0].lat}, ${area[0].lng}`);
      } else {
        console.log('[CRON] No active areas for King of the Hill');
      }
    } catch (err) {
      console.error('[CRON] King of the Hill spawn failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Monthly (1st of month, 18:00 UTC) - Eclipse event
  // ------------------------------------------------------------------
  cron.schedule('0 18 1 * *', async () => {
    console.log('[CRON] Starting monthly Eclipse event...');
    try {
      await eventEngine.startEclipse();
      console.log('[CRON] Eclipse event started');
    } catch (err) {
      console.error('[CRON] Eclipse start failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Every 2 hours (at :15) - Random Blitz Claims in active areas
  // ------------------------------------------------------------------
  cron.schedule('15 */2 * * *', async () => {
    console.log('[CRON] Spawning Blitz Claims...');
    try {
      const areas = await queryMany<{ lat: number; lng: number }>(
        `SELECT
           ST_Y(ST_Centroid(polygon))::double precision AS lat,
           ST_X(ST_Centroid(polygon))::double precision AS lng
         FROM territories
         WHERE claimed_at > NOW() - INTERVAL '24 hours'
           AND owner_id IS NOT NULL
         ORDER BY RANDOM()
         LIMIT 1`,
      );

      if (areas.length > 0) {
        await eventEngine.startBlitz(areas[0].lat, areas[0].lng, 300);
        console.log(`[CRON] Blitz Claims at ${areas[0].lat}, ${areas[0].lng}`);
      }
    } catch (err) {
      console.error('[CRON] Blitz Claims spawn failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Every 30 minutes - Spawn loot drops in active areas
  // ------------------------------------------------------------------
  cron.schedule('*/30 * * * *', async () => {
    try {
      const areas = await queryMany<{ lat: number; lng: number }>(
        `SELECT DISTINCT
           ROUND(ST_Y(ST_Centroid(polygon))::numeric, 3)::double precision AS lat,
           ROUND(ST_X(ST_Centroid(polygon))::numeric, 3)::double precision AS lng
         FROM territories
         WHERE claimed_at > NOW() - INTERVAL '24 hours'
           AND owner_id IS NOT NULL
         ORDER BY RANDOM()
         LIMIT 5`,
      );

      let spawned = 0;
      const lootTypes = ['xp', 'xp', 'xp', 'streak_freeze', 'title'];
      const lootValues: Record<string, any> = {
        xp: { xp: 500 },
        streak_freeze: { streak_freeze: true },
        title: { title: 'Lucky Finder' },
      };

      for (const area of areas) {
        // Offset randomly within ~100m
        const offsetLat = area.lat + (Math.random() - 0.5) * 0.002;
        const offsetLng = area.lng + (Math.random() - 0.5) * 0.002;
        const type = lootTypes[Math.floor(Math.random() * lootTypes.length)];

        await eventEngine.spawnLootDrop(offsetLat, offsetLng, type, lootValues[type]);
        spawned++;
      }

      if (spawned > 0) {
        console.log(`[CRON] Loot drops: ${spawned} spawned`);
      }
    } catch (err) {
      console.error('[CRON] Loot drop spawn failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 05:30 UTC - Monument check for inactive players
  // ------------------------------------------------------------------
  cron.schedule('30 5 * * *', async () => {
    console.log('[CRON] Checking monuments for inactive players...');
    try {
      const created = await balanceService.checkAllMonuments();
      if (created > 0) {
        console.log(`[CRON] Monuments: ${created} created`);
      }
    } catch (err) {
      console.error('[CRON] Monument check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 03:30 UTC - Auto-bounty check for 14+ day territory dominators
  // ------------------------------------------------------------------
  cron.schedule('30 3 * * *', async () => {
    console.log('[CRON] Checking auto-bounties...');
    try {
      const result = await checkAutoBounty();
      if (result.created > 0) {
        console.log(`[CRON] Auto-bounties: ${result.created} created`);
      }
    } catch (err) {
      console.error('[CRON] Auto-bounty check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 00:00 UTC - Reset daily territory loss counters
  // ------------------------------------------------------------------
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await query(
        `UPDATE users SET daily_territory_lost = 0, daily_loss_reset_at = NOW()
         WHERE daily_territory_lost > 0`,
      );
      const reset = result.rowCount ?? 0;
      if (reset > 0) {
        console.log(`[CRON] Daily loss reset: ${reset} users`);
      }
    } catch (err) {
      console.error('[CRON] Daily loss reset failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 06:30 UTC - Content desert notification
  // Find territories with no quests, echos, or artifacts and notify owners.
  // ------------------------------------------------------------------
  cron.schedule('30 6 * * *', async () => {
    console.log('[CRON] Checking content deserts...');
    try {
      // Find territories that have no content (quests, echos, artifacts) nearby
      const deserts = await queryMany<{ territory_id: string; owner_id: string }>(
        `SELECT t.id AS territory_id, t.owner_id
         FROM territories t
         WHERE t.owner_id IS NOT NULL
           AND t.decay_level < 0.5
           AND t.claimed_at < NOW() - INTERVAL '3 days'
           AND NOT EXISTS (
             SELECT 1 FROM quests q
             WHERE q.territory_id = t.id AND q.status = 'active'
           )
           AND NOT EXISTS (
             SELECT 1 FROM echos e
             WHERE e.status = 'active'
               AND e.expires_at > NOW()
               AND ST_DWithin(e.location::geography, ST_Centroid(t.polygon)::geography, 200)
           )
           AND NOT EXISTS (
             SELECT 1 FROM artifacts a
             WHERE a.territory_id = t.id
               AND (a.expires_at IS NULL OR a.expires_at > NOW())
           )
         LIMIT 200`,
      );

      let notified = 0;
      // De-duplicate by owner to avoid spamming
      const notifiedOwners = new Set<string>();

      for (const desert of deserts) {
        if (notifiedOwners.has(desert.owner_id)) continue;
        notifiedOwners.add(desert.owner_id);

        try {
          await sendNotification({
            userId: desert.owner_id,
            type: 'content_desert',
            title: 'Empty Territory',
            body: 'One of your territories has no content. Create a quest, echo, or artifact to bring it to life!',
            data: { territory_id: desert.territory_id },
            priority: 'LOW',
          });
          notified++;
        } catch {
          // Skip individual failures
        }
      }

      if (notified > 0) {
        console.log(`[CRON] Content desert: ${notified} notifications sent`);
      }
    } catch (err) {
      console.error('[CRON] Content desert check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 07:00 UTC - Expire old pending invites
  // ------------------------------------------------------------------
  cron.schedule('0 7 * * *', async () => {
    try {
      const result = await query(
        `UPDATE invites SET status = 'expired'
         WHERE status = 'pending' AND expires_at < NOW()`,
      );
      const expired = result.rowCount ?? 0;
      if (expired > 0) {
        console.log(`[CRON] Invites: ${expired} expired`);
      }
    } catch (err) {
      console.error('[CRON] Invite expiry check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Monthly (1st of month, 00:00 UTC) - Reset monthly leaderboards
  // ------------------------------------------------------------------
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON] Resetting monthly leaderboards...');
    try {
      const { default: redis } = await import('../config/redis');
      const keys = await redis.keys('lb:*:monthly:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[CRON] Reset ${keys.length} monthly leaderboard keys`);
      } else {
        console.log('[CRON] No monthly leaderboard keys to reset');
      }
    } catch (err) {
      console.error('[CRON] Monthly leaderboard reset failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 06:00 UTC - Cleanup expired meetup events (24h after event_date)
  // ------------------------------------------------------------------
  cron.schedule('0 6 * * *', async () => {
    try {
      const count = await meetupService.cleanupExpired();
      if (count > 0) {
        console.log(`[CRON] Cleaned up ${count} expired meetup events`);
      }
    } catch (err) {
      console.error('[CRON] Meetup cleanup failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Every 5 minutes - Turn-based game timeout checks
  // Forfeits games where the current player has exceeded their turn time.
  // ------------------------------------------------------------------
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { turnGameEngine } = await import('../services/turnGameEngine');
      const count = await turnGameEngine.checkTimeouts();
      if (count > 0) {
        console.log(`[CRON] Forfeited ${count} timed-out turn games`);
      }
    } catch (err) {
      console.error('[CRON] Turn game timeout check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 04:50 UTC - Archival warning for at-risk quests & challenges
  // Notifies creators 7 days before their content gets auto-archived.
  // ------------------------------------------------------------------
  cron.schedule('50 4 * * *', async () => {
    console.log('[CRON] Checking archival warnings...');
    try {
      let warned = 0;

      // Quests at risk: active, low rating, no activity in 23-30 days
      const atRiskQuests = await queryMany<{ id: string; creator_id: string; title: string }>(
        `SELECT q.id, q.creator_id, q.title
         FROM quests q
         WHERE q.status = 'active'
           AND q.avg_rating < $1
           AND q.id NOT IN (
             SELECT DISTINCT quest_id FROM quest_progress
             WHERE started_at > NOW() - INTERVAL '30 days'
           )
           AND q.created_at < NOW() - INTERVAL '23 days'
           AND q.created_at > NOW() - INTERVAL '30 days'
         LIMIT 200`,
        [DECAY.QUEST.RATING_PROTECTION],
      );

      for (const quest of atRiskQuests) {
        try {
          await sendNotification({
            userId: quest.creator_id,
            type: 'quest_archival_warning',
            title: 'Quest wird bald archiviert',
            body: `Deine Quest "${quest.title}" wird in ~7 Tagen archiviert (niedrige Bewertung + Inaktivität). Aktualisiere sie, um die Archivierung zu verhindern!`,
            data: { quest_id: quest.id },
            priority: 'HIGH',
          });
          warned++;
        } catch {
          // Skip individual failures
        }
      }

      // Challenges at risk: active, no submissions in 23-30 days
      const atRiskChallenges = await queryMany<{ id: string; creator_id: string; template: string }>(
        `SELECT c.id, c.creator_id, c.template
         FROM challenges c
         WHERE c.status = 'active'
           AND c.id NOT IN (
             SELECT DISTINCT challenge_id FROM challenge_submissions
             WHERE submitted_at > NOW() - INTERVAL '30 days'
           )
           AND c.created_at < NOW() - INTERVAL '23 days'
           AND c.created_at > NOW() - INTERVAL '30 days'
         LIMIT 200`,
      );

      for (const challenge of atRiskChallenges) {
        try {
          await sendNotification({
            userId: challenge.creator_id,
            type: 'challenge_archival_warning',
            title: 'Challenge wird bald archiviert',
            body: `Deine Challenge "${challenge.template}" wird in ~7 Tagen archiviert (keine Teilnahmen). Teile sie, um die Archivierung zu verhindern!`,
            data: { challenge_id: challenge.id },
            priority: 'HIGH',
          });
          warned++;
        } catch {
          // Skip individual failures
        }
      }

      if (warned > 0) {
        console.log(`[CRON] Archival warnings: ${warned} notifications sent`);
      }
    } catch (err) {
      console.error('[CRON] Archival warning check failed:', err);
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 01:30 UTC - H3 cell backfill for territories (Phase 0)
  // ------------------------------------------------------------------
  cron.schedule('30 1 * * *', async () => {
    const startTime = Date.now();
    const locked = await acquireCronLock('h3_backfill', 1800);
    if (!locked) return;

    console.log('[CRON] Running H3 backfill...');
    try {
      const processed = await runH3Backfill();
      await recordCronRun({
        job: 'h3_backfill',
        status: 'success',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: processed,
      });
    } catch (err) {
      console.error('[CRON] H3 backfill failed:', err);
      await recordCronRun({
        job: 'h3_backfill',
        status: 'failure',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        error: String(err),
      });
    } finally {
      await releaseCronLock('h3_backfill');
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 02:30 UTC - OSM context prefetch for active cells (Phase 0)
  // ------------------------------------------------------------------
  cron.schedule('30 2 * * *', async () => {
    const startTime = Date.now();
    const locked = await acquireCronLock('osm_prefetch', 1800);
    if (!locked) return;

    console.log('[CRON] Running OSM context prefetch...');
    try {
      const processed = await runOsmPrefetch();
      await recordCronRun({
        job: 'osm_prefetch',
        status: 'success',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: processed,
      });
    } catch (err) {
      console.error('[CRON] OSM prefetch failed:', err);
      await recordCronRun({
        job: 'osm_prefetch',
        status: 'failure',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        error: String(err),
      });
    } finally {
      await releaseCronLock('osm_prefetch');
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 06:00 UTC - PvE spawn expire + refill (Phase A)
  // ------------------------------------------------------------------
  cron.schedule('0 6 * * *', async () => {
    const startTime = Date.now();
    const locked = await acquireCronLock('pve_spawn_tick', 1800);
    if (!locked) return;

    console.log('[CRON] Running PvE spawn tick...');
    try {
      const processed = await runPveSpawnTick();
      await recordCronRun({
        job: 'pve_spawn_tick',
        status: 'success',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: processed,
      });
    } catch (err) {
      console.error('[CRON] PvE spawn tick failed:', err);
      await recordCronRun({
        job: 'pve_spawn_tick',
        status: 'failure',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        error: String(err),
      });
    } finally {
      await releaseCronLock('pve_spawn_tick');
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 04:10 UTC - Aether leech tick (Phase A, right after decay)
  // ------------------------------------------------------------------
  cron.schedule('10 4 * * *', async () => {
    const startTime = Date.now();
    const locked = await acquireCronLock('aether_leech_tick', 900);
    if (!locked) return;

    console.log('[CRON] Running aether leech tick...');
    try {
      const processed = await runAetherLeechTick();
      await recordCronRun({
        job: 'aether_leech_tick',
        status: 'success',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: processed,
      });
    } catch (err) {
      console.error('[CRON] Aether leech tick failed:', err);
      await recordCronRun({
        job: 'aether_leech_tick',
        status: 'failure',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        error: String(err),
      });
    } finally {
      await releaseCronLock('aether_leech_tick');
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 03:30 UTC - Energy tick: accrue passive energy for all users (Phase B)
  // Runs after clan formation (03:00) and before territory decay (04:00).
  // ------------------------------------------------------------------
  cron.schedule('30 3 * * *', async () => {
    const startTime = Date.now();
    const locked = await acquireCronLock('energy_tick', 1800);
    if (!locked) return;

    console.log('[CRON] Running energy tick...');
    try {
      const processed = await runEnergyTick();
      await recordCronRun({
        job: 'energy_tick',
        status: 'success',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: processed,
      });
    } catch (err) {
      console.error('[CRON] Energy tick failed:', err);
      await recordCronRun({
        job: 'energy_tick',
        status: 'failure',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        error: String(err),
      });
    } finally {
      await releaseCronLock('energy_tick');
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Every 10 minutes - Building completion: mark due buildings active (Phase B)
  // Short interval ensures players see their buildings come online promptly.
  // ------------------------------------------------------------------
  cron.schedule('*/10 * * * *', async () => {
    const startTime = Date.now();
    const locked = await acquireCronLock('building_completion', 300);
    if (!locked) return;

    try {
      const processed = await runBuildingCompletion();
      // Record every run (even no-ops) so /api/health/crons always sees a
      // fresh "last success" — consistent with the other jobs.
      await recordCronRun({
        job: 'building_completion',
        status: 'success',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: processed,
      });
    } catch (err) {
      console.error('[CRON] Building completion failed:', err);
      await recordCronRun({
        job: 'building_completion',
        status: 'failure',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        error: String(err),
      });
    } finally {
      await releaseCronLock('building_completion');
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Every 5 minutes - Troop arrival tick: resolve due scout movements (Phase C.1)
  // Short interval keeps scout reports + auto-returns prompt. Gated on the
  // `commander` flag (runTroopArrivalTick no-ops while the flag is off).
  // ------------------------------------------------------------------
  cron.schedule('*/5 * * * *', async () => {
    const startTime = Date.now();
    const locked = await acquireCronLock('troop_arrival_tick', 240);
    if (!locked) return;

    try {
      const processed = await runTroopArrivalTick();
      await recordCronRun({
        job: 'troop_arrival_tick',
        status: 'success',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: processed,
      });
    } catch (err) {
      console.error('[CRON] Troop arrival tick failed:', err);
      await recordCronRun({
        job: 'troop_arrival_tick',
        status: 'failure',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        error: String(err),
      });
    } finally {
      await releaseCronLock('troop_arrival_tick');
    }
  }, { timezone: 'UTC' });

  // ------------------------------------------------------------------
  // Daily at 03:45 UTC - Visibility cleanup: delete expired fog-of-war rows (Phase C.1)
  // No flag gate — removing expired rows is always safe.
  // ------------------------------------------------------------------
  cron.schedule('45 3 * * *', async () => {
    const startTime = Date.now();
    const locked = await acquireCronLock('visibility_cleanup', 600);
    if (!locked) return;

    try {
      const processed = await runVisibilityCleanup();
      await recordCronRun({
        job: 'visibility_cleanup',
        status: 'success',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: processed,
      });
    } catch (err) {
      console.error('[CRON] Visibility cleanup failed:', err);
      await recordCronRun({
        job: 'visibility_cleanup',
        status: 'failure',
        startedAt: new Date(startTime).toISOString(),
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        error: String(err),
      });
    } finally {
      await releaseCronLock('visibility_cleanup');
    }
  }, { timezone: 'UTC' });

  console.log('[CRON] All jobs scheduled.');
}

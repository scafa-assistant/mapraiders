// ============================================================
// Notification Service
// Push notifications with priority, daily limits, quiet hours,
// batching, and per-type helpers
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { NOTIFICATIONS, TITLE_DEFINITIONS } from '../config/constants';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  UserSettings,
} from '../utils/types';
import { cacheGet, cacheSet, incrementCounter } from '../config/redis';

/** Input for creating a notification */
interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
}

/**
 * Default priority mapping for each notification type.
 */
const TYPE_PRIORITY: Record<NotificationType, NotificationPriority> = {
  territory_attack: 'HIGH',
  territory_lost: 'HIGH',
  streak_at_risk: 'HIGH',
  new_title: 'HIGH',
  level_up: 'MEDIUM',
  new_quest_nearby: 'MEDIUM',
  clan_formed: 'MEDIUM',
  quest_rated: 'MEDIUM',
};

/**
 * Notification service that handles push notification delivery
 * with respect for daily limits, quiet hours, and priority levels.
 */
export class NotificationService {
  /**
   * Send a notification to a user.
   *
   * Rules:
   * - Check daily limit (max 5, except territory attacks which bypass)
   * - Check quiet hours (23:00-07:00, except streak warning)
   * - Store in DB always
   * - HIGH: immediate push (if within limits)
   * - MEDIUM: stored for batch delivery
   * - LOW: stored only
   *
   * @param userId - Recipient user ID
   * @param notification - Notification content and priority
   */
  async send(
    userId: string,
    notification: {
      type: NotificationType;
      title: string;
      body?: string;
      data?: Record<string, any>;
      priority: NotificationPriority;
    }
  ): Promise<void> {
    try {
      // Get user settings
      const user = await queryOne<{ settings: UserSettings }>(
        'SELECT settings FROM users WHERE id = $1',
        [userId]
      );

      if (!user) return;

      const settings = user.settings || {};

      // Always store in DB
      await this.storeNotification({
        userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        priority: notification.priority,
      });

      // Check if notifications are disabled
      if (settings.notifications_enabled === false) {
        return; // Stored but not pushed
      }

      const isTerritoryAttack = notification.type === 'territory_attack';
      const isStreakWarning = notification.type === 'streak_at_risk';

      // Check quiet hours (territory attacks and streak warnings bypass)
      if (!isTerritoryAttack && !isStreakWarning && this.isQuietHours(settings)) {
        return; // Stored for later delivery
      }

      // Check daily push limit (territory attacks bypass)
      if (!isTerritoryAttack) {
        const dailyCount = await this.getDailyCount(userId);
        const maxPush = settings.max_push_per_day ?? NOTIFICATIONS.MAX_PUSH_PER_DAY;
        if (dailyCount >= maxPush) {
          return; // Stored but not pushed
        }
      }

      // MEDIUM priority: batch for daily delivery
      if (notification.priority === 'MEDIUM') {
        return; // Stored; batched delivery handled by separate job
      }

      // LOW priority: store only
      if (notification.priority === 'LOW') {
        return;
      }

      // HIGH priority: immediate delivery
      await this.incrementDailyCount(userId);

      // TODO: Integrate with Firebase Cloud Messaging (FCM) for actual push delivery
      // For now, log the notification
      console.log(
        `[Notify] PUSH ${notification.type} to ${userId}: ${notification.title}`
      );
    } catch (err) {
      console.error('[Notify] Error sending notification:', err);
    }
  }

  // ---- Type-Specific Notification Methods ----

  /**
   * Notify a territory owner that their territory is under attack.
   */
  async notifyTerritoryAttack(
    ownerId: string,
    attackerId: string,
    territoryId: string
  ): Promise<void> {
    await this.send(ownerId, {
      type: 'territory_attack',
      title: 'Territory Under Attack!',
      body: 'Another player is challenging your territory.',
      data: { territory_id: territoryId, attacker_id: attackerId },
      priority: 'HIGH',
    });
  }

  /**
   * Notify a territory owner that their territory was lost.
   */
  async notifyTerritoryLost(
    ownerId: string,
    territoryId: string,
    streetName?: string
  ): Promise<void> {
    const body = streetName
      ? `Your territory on ${streetName} has been taken over.`
      : 'Your territory has been taken over.';

    await this.send(ownerId, {
      type: 'territory_lost',
      title: 'Territory Lost',
      body,
      data: { territory_id: territoryId, street_name: streetName },
      priority: 'HIGH',
    });
  }

  /**
   * Warn a player that their streak is about to expire
   * (sent at 23 hours of inactivity).
   * Bypasses quiet hours.
   */
  async notifyStreakWarning(userId: string, streakDays: number): Promise<void> {
    await this.send(userId, {
      type: 'streak_at_risk',
      title: 'Streak at Risk!',
      body: `Your ${streakDays}-day streak expires soon. Get moving!`,
      data: { streak_days: streakDays },
      priority: 'HIGH',
    });
  }

  /**
   * Notify a player they leveled up.
   */
  async notifyLevelUp(userId: string, newLevel: number): Promise<void> {
    await this.send(userId, {
      type: 'level_up',
      title: `Level Up! You're now level ${newLevel}`,
      body: 'Keep exploring to reach the next level.',
      data: { level: newLevel },
      priority: 'MEDIUM',
    });
  }

  /**
   * Notify a player they earned a new title.
   */
  async notifyNewTitle(userId: string, titleKey: string): Promise<void> {
    const def = TITLE_DEFINITIONS.find(t => t.key === titleKey);
    const titleName = def?.name ?? titleKey;

    await this.send(userId, {
      type: 'new_title',
      title: `New Title: ${titleName}`,
      body: `You earned the "${titleName}" title!`,
      data: { title_key: titleKey, title_name: titleName },
      priority: 'HIGH',
    });
  }

  /**
   * Get all unread notifications for a user.
   *
   * @param userId - User ID
   * @returns Array of unread notifications, newest first
   */
  async getUnread(userId: string): Promise<Notification[]> {
    const rows = await queryMany<Notification>(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND read = FALSE
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  /**
   * Mark specific notifications as read.
   *
   * @param userId - User ID (for authorization)
   * @param notificationIds - Array of notification IDs to mark read
   */
  async markRead(userId: string, notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;

    await query(
      `UPDATE notifications SET read = TRUE
       WHERE user_id = $1 AND id = ANY($2)`,
      [userId, notificationIds]
    );
  }

  // ---- Private Helpers ----

  /**
   * Store a notification in the database.
   */
  private async storeNotification(input: NotificationInput): Promise<void> {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        input.userId,
        input.type,
        input.title,
        input.body || null,
        JSON.stringify(input.data || {}),
      ]
    );
  }

  /**
   * Get the number of push notifications sent to a user today.
   */
  private async getDailyCount(userId: string): Promise<number> {
    try {
      const key = `push_count:${userId}:${new Date().toISOString().split('T')[0]}`;
      const count = await cacheGet(key);
      return parseInt(count || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Increment the daily push count for a user (expires after 24h).
   */
  private async incrementDailyCount(userId: string): Promise<void> {
    try {
      const key = `push_count:${userId}:${new Date().toISOString().split('T')[0]}`;
      await incrementCounter(key, 86400);
    } catch {
      // Non-critical
    }
  }

  /**
   * Check if the current time falls within quiet hours.
   *
   * Default: 23:00 - 07:00
   * Can be overridden per user in settings.
   *
   * @param settings - User settings (may contain custom quiet hours)
   * @returns True if currently in quiet hours
   */
  private isQuietHours(settings?: UserSettings): boolean {
    const now = new Date();
    const hour = now.getHours();
    const start = settings?.quiet_hours_start ?? NOTIFICATIONS.QUIET_HOURS_START;
    const end = settings?.quiet_hours_end ?? NOTIFICATIONS.QUIET_HOURS_END;

    if (start < end) {
      return hour >= start && hour < end;
    } else {
      // Wrapping range (e.g., 23-7)
      return hour >= start || hour < end;
    }
  }
}

// ---- Legacy functional exports for backward compatibility ----

const notificationInstance = new NotificationService();

export async function sendNotification(input: NotificationInput): Promise<boolean> {
  try {
    await notificationInstance.send(input.userId, {
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
      priority: input.priority,
    });
    return true;
  } catch {
    return false;
  }
}

export async function notifyTerritoryAttack(
  ownerId: string,
  territoryId: string,
  attackerId: string
): Promise<void> {
  await notificationInstance.notifyTerritoryAttack(ownerId, attackerId, territoryId);
}

export async function notifyTerritoryLost(
  ownerId: string,
  territoryId: string,
  newOwnerId: string
): Promise<void> {
  await notificationInstance.notifyTerritoryLost(ownerId, territoryId);
}

export async function notifyNewQuestNearby(
  userId: string,
  questId: string,
  questTitle: string
): Promise<void> {
  await notificationInstance.send(userId, {
    type: 'new_quest_nearby',
    title: 'New Quest Nearby',
    body: questTitle,
    data: { quest_id: questId },
    priority: 'MEDIUM',
  });
}

export async function notifyStreakAtRisk(
  userId: string,
  streakDays: number
): Promise<void> {
  await notificationInstance.notifyStreakWarning(userId, streakDays);
}

export async function notifyLevelUp(
  userId: string,
  newLevel: number
): Promise<void> {
  await notificationInstance.notifyLevelUp(userId, newLevel);
}

export async function notifyNewTitle(
  userId: string,
  titleKey: string,
  titleName: string
): Promise<void> {
  await notificationInstance.notifyNewTitle(userId, titleKey);
}

export async function notifyClanFormed(
  userId: string,
  clanId: string,
  clanName: string
): Promise<void> {
  await notificationInstance.send(userId, {
    type: 'clan_formed',
    title: `Welcome to ${clanName}`,
    body: 'You have been added to a new clan.',
    data: { clan_id: clanId, clan_name: clanName },
    priority: 'MEDIUM',
  });
}

export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ notifications: any[]; total: number }> {
  const offset = (page - 1) * limit;

  const [notifications, countResult] = await Promise.all([
    queryMany(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
      [userId]
    ),
  ]);

  return {
    notifications,
    total: parseInt(countResult?.count || '0', 10),
  };
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await query(
    'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
    [userId]
  );
}

export const notificationService = notificationInstance;

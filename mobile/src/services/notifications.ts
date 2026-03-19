import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// ─── Configure Default Notification Behavior ────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Push Token Registration ────────────────────────────────────────────────

/**
 * Register for push notifications. Returns the Expo push token string,
 * or null if registration fails (e.g., not a real device, permissions denied).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.warn('[Notifications] Push notifications require a physical device.');
      return null;
    }

    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted.');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Uses the project ID from app.json
    });
    const pushToken = tokenData.data;

    // Send the push token to the server
    try {
      await api.post('/users/me/push-token', { token: pushToken, platform: Platform.OS });
    } catch (error) {
      console.error('[Notifications] Failed to register token with server:', error);
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Gridwalker',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00D4FF',
      });

      await Notifications.setNotificationChannelAsync('territory', {
        name: 'Territory Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Alerts when your territory is contested',
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FF4757',
      });

      await Notifications.setNotificationChannelAsync('quests', {
        name: 'Quest Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Quest completion and nearby quest alerts',
        lightColor: '#7B61FF',
      });

      await Notifications.setNotificationChannelAsync('social', {
        name: 'Social',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Likes, clan activity, and social updates',
        lightColor: '#00FF88',
      });
    }

    return pushToken;
  } catch (error) {
    console.error('[Notifications] Registration failed:', error);
    return null;
  }
}

// ─── Navigation Callback Type ───────────────────────────────────────────────

type NavigationCallback = (screen: string, params?: Record<string, unknown>) => void;

let navigationCallback: NavigationCallback | null = null;

/**
 * Set the navigation callback that will be called when a notification is tapped.
 * Should be called once from the root navigator.
 */
export function setNotificationNavigationCallback(callback: NavigationCallback): void {
  navigationCallback = callback;
}

// ─── Notification Handlers ──────────────────────────────────────────────────

/**
 * Set up handlers for received and tapped notifications.
 * Call this once during app initialization.
 */
export function setupNotificationHandler(): () => void {
  // Handle notifications received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const data = notification.request.content.data;
      console.log('[Notifications] Received in foreground:', data);

      // Could update local state (e.g., badge count, in-app notification banner)
    }
  );

  // Handle notification tapped (user interacted with notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      console.log('[Notifications] Tapped:', data);

      if (!navigationCallback) return;

      // Route to the relevant screen based on notification type
      switch (data.type) {
        case 'territory_contested':
          navigationCallback('TerritoryDetail', {
            territory: { id: data.territoryId },
          });
          break;

        case 'quest_completed':
          navigationCallback('QuestDetail', {
            questId: data.questId,
          });
          break;

        case 'challenge_nearby':
          navigationCallback('MapMain', {
            focusChallenge: data.challengeId,
          });
          break;

        case 'echo_liked':
          navigationCallback('MapMain', {
            focusEcho: data.echoId,
          });
          break;

        case 'level_up':
          navigationCallback('ProfileMain');
          break;

        case 'clan_update':
          navigationCallback('ProfileMain');
          break;

        default:
          // Default: go to map
          navigationCallback('MapMain');
          break;
      }
    }
  );

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// ─── Local Notifications ────────────────────────────────────────────────────

/**
 * Schedule a local notification (e.g., for route recording reminders).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
  delaySeconds?: number
): Promise<string> {
  const trigger = delaySeconds
    ? { seconds: delaySeconds, channelId: 'default' }
    : null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: true,
    },
    trigger,
  });

  return id;
}

/**
 * Cancel a scheduled notification by ID.
 */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Cancel all pending notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get the current badge count.
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set the app badge count.
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// ============================================================
// Push Notification Service
// Firebase Cloud Messaging (FCM) integration for delivering
// actual push notifications to mobile devices.
// ============================================================

import admin from 'firebase-admin';
import { queryOne } from '../config/database';

// ─── Firebase Initialization ───────────────────────────────────────────────

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK.
 * Uses GOOGLE_APPLICATION_CREDENTIALS env var or application default credentials.
 */
function initFirebase(): void {
  if (firebaseInitialized) return;
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    firebaseInitialized = true;
    console.log('[Push] Firebase Admin initialized');
  } catch (err) {
    console.warn('[Push] Firebase not configured - push notifications disabled');
  }
}

// ─── Push Delivery ─────────────────────────────────────────────────────────

/**
 * Send a push notification to a specific device token.
 *
 * @param pushToken - FCM device registration token
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional data payload for the client app
 * @returns true if sent successfully, false otherwise
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  // The mobile app registers Expo push tokens (getExpoPushTokenAsync), which
  // FCM cannot deliver to — those go through the Expo Push API instead.
  // Raw FCM tokens (if a future build registers them) still take the FCM path.
  if (pushToken.startsWith('ExponentPushToken')) {
    return sendExpoPush(pushToken, title, body, data);
  }

  if (!firebaseInitialized) {
    initFirebase();
    if (!firebaseInitialized) return false;
  }

  try {
    await admin.messaging().send({
      token: pushToken,
      notification: { title, body },
      data: data || {},
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
    return true;
  } catch (err: any) {
    if (err.code === 'messaging/registration-token-not-registered') {
      // Token expired - should be cleaned up
      console.warn('[Push] Token expired:', pushToken.substring(0, 20));
    }
    return false;
  }
}

/**
 * Deliver to an Expo push token via the Expo Push API (no credentials needed).
 * Combat-class types land on the 'territory' Android channel the app creates
 * (MAX importance); everything else on 'default'.
 */
async function sendExpoPush(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const type = data?.type ?? '';
  const channelId = /territory|attack|battle|invasion/.test(type) ? 'territory' : 'default';
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: 'high',
        channelId,
      }),
    });
    if (!res.ok) {
      console.warn('[Push] Expo API HTTP', res.status);
      return false;
    }
    const json: any = await res.json().catch(() => null);
    const status = json?.data?.status;
    if (status !== 'ok') {
      console.warn('[Push] Expo ticket not ok:', JSON.stringify(json?.data ?? json).slice(0, 200));
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Push] Expo send failed:', err?.message ?? err);
    return false;
  }
}

/**
 * Send a push notification to a user by looking up their stored push token.
 *
 * @param userId - Target user's ID
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional data payload for the client app
 * @returns true if sent successfully, false if user has no token or send failed
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const user = await queryOne<{ push_token: string }>(
    `SELECT push_token FROM users WHERE id = $1 AND push_token IS NOT NULL`,
    [userId]
  );

  if (!user?.push_token) return false;
  return sendPushNotification(user.push_token, title, body, data);
}

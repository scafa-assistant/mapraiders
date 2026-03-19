// ============================================================
// Gridwalker WebSocket Client
// Real-time connection to the server for live events such as
// territory claims, nearby players, echoes, and challenges.
// Auto-reconnects with exponential backoff.
// ============================================================

import { getToken } from './api';

const WS_URL = __DEV__
  ? 'ws://192.168.3.60:3000'
  : 'wss://api.gridwalker.app';

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

class GridwalkerWs {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private intentionalClose = false;

  /**
   * Open a WebSocket connection to the server, authenticating
   * via the JWT token from the API service.
   */
  async connect(): Promise<void> {
    // Prevent duplicate connections
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    const token = await getToken();
    if (!token) {
      console.warn('[WS] No auth token available, skipping connect');
      return;
    }

    this.intentionalClose = false;
    this.ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event: WebSocketMessageEvent) => {
      this.handleMessage(typeof event.data === 'string' ? event.data : '');
    };

    this.ws.onerror = (event: Event) => {
      console.error('[WS] Error:', event);
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.ws = null;
      if (!this.intentionalClose) {
        this.reconnect();
      }
    };
  }

  /**
   * Cleanly close the WebSocket connection without triggering
   * auto-reconnect.
   */
  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to a specific event. Returns an unsubscribe function.
   *
   * Supported events:
   * - territory_claimed
   * - territory_attacked
   * - echo_nearby
   * - challenge_nearby
   * - player_nearby
   * - level_up
   *
   * @param event - Event name to listen for
   * @param callback - Handler invoked with the event data payload
   * @returns Unsubscribe function
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Send the user's current GPS location to the server so that
   * proximity-based broadcasts can be targeted.
   */
  sendLocationUpdate(lat: number, lng: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          event: 'location_update',
          data: { lat, lng },
        })
      );
    }
  }

  // ---- Private Methods ----

  /**
   * Parse incoming messages and dispatch to registered listeners.
   */
  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw) as { event: string; data: any };
      const callbacks = this.listeners.get(msg.event);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb(msg.data);
          } catch (err) {
            console.error(`[WS] Listener error for event "${msg.event}":`, err);
          }
        });
      }
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff,
   * capped at RECONNECT_MAX_MS.
   */
  private reconnect(): void {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_MS
    );
    this.reconnectAttempts++;

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

export const gridwalkerWs = new GridwalkerWs();

// ============================================================
// MapRaiders WebSocket client — singleton with auto-reconnect.
//
// Derives the wss:// URL from API_BASE_URL (strips /api suffix,
// then replaces http(s) with ws(s)):
//   https://api.mapraiders.com/api → wss://api.mapraiders.com
//   http://localhost:3000/api      → ws://localhost:3000
//
// Usage:
//   mapRaidersWs.connect(token)
//   const off = mapRaidersWs.on('spy_detected', (data) => { ... })
//   mapRaidersWs.disconnect()
//
// A WS failure is always non-fatal — the rest of the app keeps running.
// ============================================================

import { API_BASE_URL } from './client';

// ---- Derive WebSocket origin from API_BASE_URL ----------------------------

/**
 * Strip /api (and optional trailing slash) then replace http→ws / https→wss.
 * e.g. "https://api.mapraiders.com/api" → "wss://api.mapraiders.com"
 *      "http://localhost:3000/api"       → "ws://localhost:3000"
 */
function deriveWsUrl(token: string): string {
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  const wsOrigin = origin.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
  return `${wsOrigin}/?token=${encodeURIComponent(token)}`;
}

// ---- Types ----------------------------------------------------------------

type WsEventName = string;
type WsEventCallback = (data: unknown) => void;

interface WsFrame {
  event: string;
  data: unknown;
}

// ---- Singleton implementation ---------------------------------------------

class MapRaidersWsClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private listeners: Map<WsEventName, Set<WsEventCallback>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000; // ms, grows with backoff
  private readonly maxDelay = 30_000;
  private stopped = false;

  /** Connect with the given JWT. Safe to call multiple times — re-uses existing if token matches. */
  connect(token: string): void {
    if (!token) return;
    // If already connected with the same token, no-op.
    if (this.socket && this.token === token && this.socket.readyState <= WebSocket.OPEN) return;
    this.stopped = false;
    this.token = token;
    this._clearReconnectTimer();
    this._open();
  }

  /** Disconnect and stop all reconnection attempts. */
  disconnect(): void {
    this.stopped = true;
    this.token = null;
    this._clearReconnectTimer();
    if (this.socket) {
      this.socket.onclose = null; // prevent reconnect loop
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Subscribe to a named event. Returns an unsubscribe function.
   * Multiple listeners on the same event are all called.
   */
  on(event: WsEventName, cb: WsEventCallback): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => {
      this.listeners.get(event)?.delete(cb);
    };
  }

  // ---- Private --------------------------------------------------------------

  private _open(): void {
    if (!this.token) return;
    try {
      const url = deriveWsUrl(this.token);
      const ws = new WebSocket(url);
      this.socket = ws;

      ws.onopen = () => {
        // Reset backoff on successful connection.
        this.reconnectDelay = 2000;
      };

      ws.onmessage = (evt: MessageEvent) => {
        try {
          const frame = JSON.parse(evt.data as string) as WsFrame;
          if (frame && typeof frame.event === 'string') {
            const cbs = this.listeners.get(frame.event);
            if (cbs) {
              cbs.forEach((cb) => {
                try { cb(frame.data); } catch { /* listener errors must not crash the client */ }
              });
            }
          }
        } catch { /* malformed frame — ignore */ }
      };

      ws.onerror = () => {
        // onerror is always followed by onclose; let onclose handle reconnect.
      };

      ws.onclose = () => {
        this.socket = null;
        if (!this.stopped) this._scheduleReconnect();
      };
    } catch {
      // WebSocket constructor can throw in some environments (e.g. SSR).
      // Schedule a reconnect anyway so the user eventually gets a connection.
      if (!this.stopped) this._scheduleReconnect();
    }
  }

  private _scheduleReconnect(): void {
    if (this.stopped || !this.token) return;
    this._clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.stopped && this.token) this._open();
    }, this.reconnectDelay);
    // Exponential backoff capped at maxDelay.
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const mapRaidersWs = new MapRaidersWsClient();

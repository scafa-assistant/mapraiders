// ============================================================
// WebSocket Service
// Manages real-time connections for Gridwalker clients.
// Tracks connected users, their locations, and provides
// targeted + proximity-based broadcasting.
// ============================================================

import { WebSocket } from 'ws';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  lat?: number;
  lng?: number;
  clanId?: string;
}

/**
 * Calculate the distance in meters between two geographic points
 * using the Haversine formula.
 */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

class WsService {
  private clients: Map<string, ConnectedClient> = new Map();

  /**
   * Register a new WebSocket connection for a user.
   * If the user already has a connection, the old one is closed.
   */
  addClient(userId: string, ws: WebSocket): void {
    // Close any existing connection for this user
    const existing = this.clients.get(userId);
    if (existing && existing.ws.readyState === WebSocket.OPEN) {
      existing.ws.close(4000, 'Replaced by new connection');
    }

    this.clients.set(userId, { ws, userId });
    console.log(`[WS] Client connected: ${userId} (${this.clients.size} total)`);
  }

  /**
   * Remove a user's WebSocket connection.
   */
  removeClient(userId: string): void {
    this.clients.delete(userId);
    console.log(`[WS] Client disconnected: ${userId} (${this.clients.size} total)`);
  }

  /**
   * Update the last-known location for a connected user.
   */
  updateLocation(userId: string, lat: number, lng: number): void {
    const client = this.clients.get(userId);
    if (client) {
      client.lat = lat;
      client.lng = lng;
    }
  }

  /**
   * Send a message to a specific user by their user ID.
   */
  sendToUser(userId: string, event: string, data: any): void {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify({ event, data }));
      } catch (err) {
        console.error(`[WS] Failed to send to user ${userId}:`, err);
      }
    }
  }

  /**
   * Broadcast a message to all connected users within a given radius
   * (in meters) of a geographic point.
   *
   * @param lat - Center latitude
   * @param lng - Center longitude
   * @param radiusM - Radius in meters
   * @param event - Event name
   * @param data - Event payload
   * @param excludeUserId - Optional user ID to exclude from broadcast
   */
  broadcastNearby(
    lat: number,
    lng: number,
    radiusM: number,
    event: string,
    data: any,
    excludeUserId?: string
  ): void {
    const message = JSON.stringify({ event, data });

    for (const [userId, client] of this.clients) {
      if (excludeUserId && userId === excludeUserId) continue;
      if (client.lat == null || client.lng == null) continue;
      if (client.ws.readyState !== WebSocket.OPEN) continue;

      const distance = haversineMeters(lat, lng, client.lat, client.lng);
      if (distance <= radiusM) {
        try {
          client.ws.send(message);
        } catch (err) {
          console.error(`[WS] Failed to broadcast to nearby user ${userId}:`, err);
        }
      }
    }
  }

  /**
   * Set the clan ID for a connected user.
   * Called when a user connects and their clan membership is resolved.
   */
  setClanId(userId: string, clanId: string): void {
    const client = this.clients.get(userId);
    if (client) {
      client.clanId = clanId;
    }
  }

  /**
   * Broadcast a message to all connected users who belong to a specific clan.
   *
   * @param clanId - Clan ID to target
   * @param event - Event name
   * @param data - Event payload
   */
  broadcastToClan(clanId: string, event: string, data: any): void {
    const message = JSON.stringify({ event, data });

    for (const [userId, client] of this.clients) {
      if (client.clanId !== clanId) continue;
      if (client.ws.readyState !== WebSocket.OPEN) continue;

      try {
        client.ws.send(message);
      } catch (err) {
        console.error(`[WS] Failed to broadcast to clan member ${userId}:`, err);
      }
    }
  }

  /**
   * Get user IDs of connected clients within a given radius of a point.
   * Useful for finding nearby players for duels/races.
   *
   * @param lat - Center latitude
   * @param lng - Center longitude
   * @param radiusM - Radius in meters
   * @param excludeUserId - Optional user ID to exclude from results
   * @returns Array of { userId, lat, lng, distance } for nearby clients
   */
  getNearbyClients(
    lat: number,
    lng: number,
    radiusM: number,
    excludeUserId?: string
  ): { userId: string; lat: number; lng: number; distance: number }[] {
    const nearby: { userId: string; lat: number; lng: number; distance: number }[] = [];

    for (const [userId, client] of this.clients) {
      if (excludeUserId && userId === excludeUserId) continue;
      if (client.lat == null || client.lng == null) continue;
      if (client.ws.readyState !== WebSocket.OPEN) continue;

      const distance = haversineMeters(lat, lng, client.lat, client.lng);
      if (distance <= radiusM) {
        nearby.push({ userId, lat: client.lat, lng: client.lng, distance });
      }
    }

    return nearby.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Broadcast a message to every connected client.
   */
  broadcastAll(event: string, data: any): void {
    const message = JSON.stringify({ event, data });

    for (const [userId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message);
        } catch (err) {
          console.error(`[WS] Failed to broadcast to user ${userId}:`, err);
        }
      }
    }
  }
}

export const wsService = new WsService();

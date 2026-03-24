// ============================================================
// Meetup Service
// Business logic for player-organized real-world meetup events.
// Handles creation, attendance, presence checking, messaging,
// and cleanup of expired events.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { wsService } from './wsService';

// ---- Types ------------------------------------------------------------------

export interface MeetupEvent {
  id: string;
  creator_id: string;
  creator_username: string;
  latitude: number;
  longitude: number;
  name: string;
  description: string | null;
  event_date: Date;
  category: string;
  max_attendees: number | null;
  status: string;
  attendee_count: number;
  created_at: Date;
}

export interface MeetupAttendee {
  user_id: string;
  username: string;
  joined_at: Date;
  is_present: boolean;
}

export interface MeetupMessage {
  id: string;
  event_id: string;
  sender_id: string;
  sender_username: string;
  message: string;
  created_at: Date;
}

interface CreateMeetupData {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  event_date: string;
  category?: string;
  max_attendees?: number;
}

// ============================================================
// Meetup Service
// ============================================================

class MeetupService {
  /**
   * Create a new meetup event.
   * Validates: name required, date must be in future, max 3 active events per user.
   */
  async createMeetup(userId: string, data: CreateMeetupData): Promise<MeetupEvent> {
    const { name, description, latitude, longitude, event_date, category, max_attendees } = data;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new Error('Event name is required');
    }
    if (name.length > 100) {
      throw new Error('Event name must be 100 characters or less');
    }

    // Validate date is in the future
    const eventDate = new Date(event_date);
    if (isNaN(eventDate.getTime())) {
      throw new Error('Invalid event date');
    }
    if (eventDate <= new Date()) {
      throw new Error('Event date must be in the future');
    }

    // Validate category
    const validCategories = ['party', 'sport', 'gaming', 'meetup', 'other'];
    const cat = category || 'meetup';
    if (!validCategories.includes(cat)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Check max 3 active events per user
    const activeCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM meetup_events
       WHERE creator_id = $1 AND status IN ('active', 'live')`,
      [userId],
    );
    if (activeCount && parseInt(activeCount.count, 10) >= 3) {
      throw new Error('Maximum 3 active meetup events per user');
    }

    // Insert the meetup event
    const row = await queryOne<{
      id: string;
      creator_id: string;
      name: string;
      description: string | null;
      event_date: Date;
      category: string;
      max_attendees: number | null;
      status: string;
      created_at: Date;
      lat: number;
      lng: number;
    }>(
      `INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees)
       VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6, $7, $8)
       RETURNING id, creator_id, name, description, event_date, category, max_attendees, status, created_at,
                 ST_Y(location) AS lat, ST_X(location) AS lng`,
      [userId, latitude, longitude, name.trim(), description || null, eventDate, cat, max_attendees || null],
    );

    if (!row) {
      throw new Error('Failed to create meetup event');
    }

    // Get creator username
    const creator = await queryOne<{ username: string }>(
      'SELECT username FROM users WHERE id = $1',
      [userId],
    );

    // Auto-join the creator as an attendee
    await query(
      `INSERT INTO meetup_attendees (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [row.id, userId],
    );

    return {
      id: row.id,
      creator_id: row.creator_id,
      creator_username: creator?.username || 'Unknown',
      latitude: row.lat,
      longitude: row.lng,
      name: row.name,
      description: row.description,
      event_date: row.event_date,
      category: row.category,
      max_attendees: row.max_attendees,
      status: row.status,
      attendee_count: 1, // creator is auto-joined
      created_at: row.created_at,
    };
  }

  /**
   * Get meetup details by ID, including creator info and attendee count.
   */
  async getMeetup(id: string): Promise<MeetupEvent | null> {
    const row = await queryOne<{
      id: string;
      creator_id: string;
      creator_username: string;
      lat: number;
      lng: number;
      name: string;
      description: string | null;
      event_date: Date;
      category: string;
      max_attendees: number | null;
      status: string;
      attendee_count: string;
      created_at: Date;
    }>(
      `SELECT me.id, me.creator_id, u.username AS creator_username,
              ST_Y(me.location) AS lat, ST_X(me.location) AS lng,
              me.name, me.description, me.event_date, me.category,
              me.max_attendees, me.status, me.created_at,
              (SELECT COUNT(*)::text FROM meetup_attendees WHERE event_id = me.id) AS attendee_count
       FROM meetup_events me
       JOIN users u ON me.creator_id = u.id
       WHERE me.id = $1`,
      [id],
    );

    if (!row) return null;

    return {
      id: row.id,
      creator_id: row.creator_id,
      creator_username: row.creator_username,
      latitude: row.lat,
      longitude: row.lng,
      name: row.name,
      description: row.description,
      event_date: row.event_date,
      category: row.category,
      max_attendees: row.max_attendees,
      status: row.status,
      attendee_count: parseInt(row.attendee_count, 10),
      created_at: row.created_at,
    };
  }

  /**
   * Get meetup events within a bounding box.
   * Only active/live events where event_date > NOW() - 24 hours.
   */
  async getInBounds(
    north: number,
    south: number,
    east: number,
    west: number,
  ): Promise<MeetupEvent[]> {
    const rows = await queryMany<{
      id: string;
      creator_id: string;
      creator_username: string;
      lat: number;
      lng: number;
      name: string;
      description: string | null;
      event_date: Date;
      category: string;
      max_attendees: number | null;
      status: string;
      attendee_count: string;
      created_at: Date;
    }>(
      `SELECT me.id, me.creator_id, u.username AS creator_username,
              ST_Y(me.location) AS lat, ST_X(me.location) AS lng,
              me.name, me.description, me.event_date, me.category,
              me.max_attendees, me.status, me.created_at,
              (SELECT COUNT(*)::text FROM meetup_attendees WHERE event_id = me.id) AS attendee_count
       FROM meetup_events me
       JOIN users u ON me.creator_id = u.id
       WHERE me.status IN ('active', 'live')
         AND me.event_date > NOW() - INTERVAL '24 hours'
         AND ST_Intersects(me.location, ST_MakeEnvelope($1, $2, $3, $4, 4326))
       ORDER BY me.event_date ASC
       LIMIT 200`,
      [west, south, east, north],
    );

    return rows.map((row) => ({
      id: row.id,
      creator_id: row.creator_id,
      creator_username: row.creator_username,
      latitude: row.lat,
      longitude: row.lng,
      name: row.name,
      description: row.description,
      event_date: row.event_date,
      category: row.category,
      max_attendees: row.max_attendees,
      status: row.status,
      attendee_count: parseInt(row.attendee_count, 10),
      created_at: row.created_at,
    }));
  }

  /**
   * Get nearby meetup events within a radius (meters).
   */
  async getNearby(lat: number, lng: number, radiusM: number): Promise<MeetupEvent[]> {
    const rows = await queryMany<{
      id: string;
      creator_id: string;
      creator_username: string;
      lat: number;
      lng: number;
      name: string;
      description: string | null;
      event_date: Date;
      category: string;
      max_attendees: number | null;
      status: string;
      attendee_count: string;
      created_at: Date;
    }>(
      `SELECT me.id, me.creator_id, u.username AS creator_username,
              ST_Y(me.location) AS lat, ST_X(me.location) AS lng,
              me.name, me.description, me.event_date, me.category,
              me.max_attendees, me.status, me.created_at,
              (SELECT COUNT(*)::text FROM meetup_attendees WHERE event_id = me.id) AS attendee_count
       FROM meetup_events me
       JOIN users u ON me.creator_id = u.id
       WHERE me.status IN ('active', 'live')
         AND me.event_date > NOW() - INTERVAL '24 hours'
         AND ST_DWithin(me.location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
       ORDER BY me.event_date ASC
       LIMIT 50`,
      [lat, lng, radiusM],
    );

    return rows.map((row) => ({
      id: row.id,
      creator_id: row.creator_id,
      creator_username: row.creator_username,
      latitude: row.lat,
      longitude: row.lng,
      name: row.name,
      description: row.description,
      event_date: row.event_date,
      category: row.category,
      max_attendees: row.max_attendees,
      status: row.status,
      attendee_count: parseInt(row.attendee_count, 10),
      created_at: row.created_at,
    }));
  }

  /**
   * Join a meetup event.
   * Checks event exists, is active, and max_attendees not reached.
   * Notifies the creator via WebSocket.
   */
  async joinMeetup(userId: string, eventId: string): Promise<void> {
    // Get event details
    const event = await queryOne<{
      id: string;
      creator_id: string;
      name: string;
      status: string;
      max_attendees: number | null;
    }>(
      `SELECT id, creator_id, name, status, max_attendees FROM meetup_events WHERE id = $1`,
      [eventId],
    );

    if (!event) {
      throw new Error('Meetup event not found');
    }

    if (event.status !== 'active' && event.status !== 'live') {
      throw new Error('Meetup event is not active');
    }

    // Check max_attendees
    if (event.max_attendees) {
      const countRow = await queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM meetup_attendees WHERE event_id = $1`,
        [eventId],
      );
      if (countRow && parseInt(countRow.count, 10) >= event.max_attendees) {
        throw new Error('Meetup event is full');
      }
    }

    // Insert attendee (ON CONFLICT DO NOTHING for idempotency)
    await query(
      `INSERT INTO meetup_attendees (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [eventId, userId],
    );

    // Get joiner username for notification
    const joiner = await queryOne<{ username: string }>(
      'SELECT username FROM users WHERE id = $1',
      [userId],
    );

    // Notify creator via WebSocket
    if (event.creator_id !== userId) {
      wsService.sendToUser(event.creator_id, 'meetup_joined', {
        event_id: eventId,
        event_name: event.name,
        user_id: userId,
        username: joiner?.username || 'Unknown',
      });
    }
  }

  /**
   * Leave a meetup event.
   */
  async leaveMeetup(userId: string, eventId: string): Promise<void> {
    await query(
      `DELETE FROM meetup_attendees WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId],
    );
  }

  /**
   * Get attendees for a meetup event.
   */
  async getAttendees(eventId: string): Promise<MeetupAttendee[]> {
    return queryMany<MeetupAttendee>(
      `SELECT ma.user_id, u.username, ma.joined_at, ma.is_present
       FROM meetup_attendees ma
       JOIN users u ON ma.user_id = u.id
       WHERE ma.event_id = $1
       ORDER BY ma.joined_at ASC`,
      [eventId],
    );
  }

  /**
   * Mark a user as physically present at a meetup event.
   * Checks GPS proximity (within 100 meters of event location).
   * Returns true if within range, false otherwise.
   */
  async markPresent(userId: string, eventId: string, lat: number, lng: number): Promise<boolean> {
    // Check user is an attendee
    const attendee = await queryOne<{ event_id: string }>(
      `SELECT event_id FROM meetup_attendees WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId],
    );

    if (!attendee) {
      throw new Error('You are not an attendee of this event');
    }

    // Check proximity: within 100 meters of event location
    const withinRange = await queryOne<{ within: boolean }>(
      `SELECT ST_DWithin(
         me.location::geography,
         ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
         100
       ) AS within
       FROM meetup_events me
       WHERE me.id = $1`,
      [eventId, lat, lng],
    );

    if (!withinRange || !withinRange.within) {
      return false;
    }

    // Update presence
    await query(
      `UPDATE meetup_attendees SET is_present = TRUE WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId],
    );

    // Get username for broadcast
    const user = await queryOne<{ username: string }>(
      'SELECT username FROM users WHERE id = $1',
      [userId],
    );

    // Broadcast to all attendees via WebSocket
    const attendees = await queryMany<{ user_id: string }>(
      `SELECT user_id FROM meetup_attendees WHERE event_id = $1`,
      [eventId],
    );

    for (const att of attendees) {
      wsService.sendToUser(att.user_id, 'meetup_present', {
        event_id: eventId,
        user_id: userId,
        username: user?.username || 'Unknown',
      });
    }

    return true;
  }

  /**
   * Send a chat message in a meetup event.
   * Only attendees can send messages.
   * Broadcasts via WebSocket to all attendees.
   */
  async sendMessage(userId: string, eventId: string, message: string): Promise<MeetupMessage> {
    // Check user is an attendee
    const attendee = await queryOne<{ event_id: string }>(
      `SELECT event_id FROM meetup_attendees WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId],
    );

    if (!attendee) {
      throw new Error('Only attendees can send messages');
    }

    // Get sender username
    const sender = await queryOne<{ username: string }>(
      'SELECT username FROM users WHERE id = $1',
      [userId],
    );

    if (!sender) {
      throw new Error('User not found');
    }

    // Insert message
    const row = await queryOne<{ id: string; created_at: Date }>(
      `INSERT INTO meetup_messages (event_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [eventId, userId, message.trim()],
    );

    if (!row) {
      throw new Error('Failed to send message');
    }

    const messageData: MeetupMessage = {
      id: row.id,
      event_id: eventId,
      sender_id: userId,
      sender_username: sender.username,
      message: message.trim(),
      created_at: row.created_at,
    };

    // Broadcast to all attendees via WebSocket
    const attendees = await queryMany<{ user_id: string }>(
      `SELECT user_id FROM meetup_attendees WHERE event_id = $1`,
      [eventId],
    );

    for (const att of attendees) {
      wsService.sendToUser(att.user_id, 'meetup_message', messageData);
    }

    return messageData;
  }

  /**
   * Get paginated messages for a meetup event.
   * Newest first. Default limit 50.
   */
  async getMessages(eventId: string, before?: string, limit: number = 50): Promise<MeetupMessage[]> {
    const safeLimit = Math.min(limit, 100);

    if (before) {
      return queryMany<MeetupMessage>(
        `SELECT mm.id, mm.event_id, mm.sender_id, u.username AS sender_username,
                mm.message, mm.created_at
         FROM meetup_messages mm
         JOIN users u ON mm.sender_id = u.id
         WHERE mm.event_id = $1 AND mm.created_at < (
           SELECT created_at FROM meetup_messages WHERE id = $2
         )
         ORDER BY mm.created_at DESC
         LIMIT $3`,
        [eventId, before, safeLimit],
      );
    }

    return queryMany<MeetupMessage>(
      `SELECT mm.id, mm.event_id, mm.sender_id, u.username AS sender_username,
              mm.message, mm.created_at
       FROM meetup_messages mm
       JOIN users u ON mm.sender_id = u.id
       WHERE mm.event_id = $1
       ORDER BY mm.created_at DESC
       LIMIT $2`,
      [eventId, safeLimit],
    );
  }

  /**
   * Cleanup expired meetup events.
   * Deletes messages for expired events, then marks events as completed
   * if event_date is more than 24 hours ago.
   * Returns the count of cleaned events.
   */
  async cleanupExpired(): Promise<number> {
    // Delete messages for expired events first
    await query(
      `DELETE FROM meetup_messages WHERE event_id IN (
         SELECT id FROM meetup_events
         WHERE event_date < NOW() - INTERVAL '24 hours'
           AND status IN ('active', 'live')
       )`,
    );

    // Mark events as completed
    const result = await query(
      `UPDATE meetup_events SET status = 'completed'
       WHERE event_date < NOW() - INTERVAL '24 hours'
         AND status IN ('active', 'live')`,
    );

    return result.rowCount ?? 0;
  }
}

export const meetupService = new MeetupService();

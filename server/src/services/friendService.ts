// ============================================================
// Friend Service
// Handles friendships, friend requests, and user blocking
// for MapRaiders social features.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { wsService } from './wsService';

class FriendService {
  async getFriends(userId: string): Promise<any[]> {
    const friends = await queryMany(
      `SELECT u.id, u.username, u.level, u.avatar_url, u.last_active
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END
       WHERE (f.user_a = $1 OR f.user_b = $1)
       ORDER BY u.username ASC`,
      [userId]
    );
    // Add online status from WebSocket
    return friends.map((f: any) => ({
      ...f,
      is_online: wsService.isUserOnline ? wsService.isUserOnline(f.id) : false,
    }));
  }

  async sendRequest(senderId: string, receiverId: string): Promise<any> {
    if (senderId === receiverId) throw new Error('Cannot send request to yourself');

    // Check block
    const blocked = await queryOne(
      'SELECT 1 FROM blocked_users WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [senderId, receiverId]
    );
    if (blocked) throw new Error('Cannot send request to this user');

    // Check already friends
    const [a, b] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];
    const existing = await queryOne('SELECT 1 FROM friendships WHERE user_a = $1 AND user_b = $2', [a, b]);
    if (existing) throw new Error('Already friends');

    // Check existing pending request
    const pendingReverse = await queryOne(
      "SELECT id FROM friend_requests WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'",
      [receiverId, senderId]
    );
    if (pendingReverse) {
      // They already sent us a request — auto-accept!
      return this.acceptRequest(pendingReverse.id, senderId);
    }

    // Upsert request (might have been declined before)
    const req = await queryOne(
      `INSERT INTO friend_requests (sender_id, receiver_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (sender_id, receiver_id)
       DO UPDATE SET status = 'pending', created_at = NOW(), responded_at = NULL
       RETURNING id`,
      [senderId, receiverId]
    );

    // Get sender info for notification
    const sender = await queryOne('SELECT username, level, avatar_url FROM users WHERE id = $1', [senderId]);

    // WebSocket notification
    try {
      wsService.sendToUser(receiverId, 'friend_request', {
        request_id: req!.id,
        sender_id: senderId,
        sender_username: sender?.username,
        sender_level: sender?.level,
        sender_avatar_url: sender?.avatar_url,
      });
    } catch {}

    return { request_id: req!.id, status: 'pending' };
  }

  async getPendingRequests(userId: string): Promise<any[]> {
    return queryMany(
      `SELECT fr.id, fr.sender_id, fr.created_at,
              u.username as sender_username, u.level as sender_level, u.avatar_url as sender_avatar_url
       FROM friend_requests fr
       JOIN users u ON u.id = fr.sender_id
       WHERE fr.receiver_id = $1 AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [userId]
    );
  }

  async getSentRequests(userId: string): Promise<any[]> {
    return queryMany(
      `SELECT fr.id, fr.receiver_id, fr.created_at,
              u.username as receiver_username, u.level as receiver_level, u.avatar_url as receiver_avatar_url
       FROM friend_requests fr
       JOIN users u ON u.id = fr.receiver_id
       WHERE fr.sender_id = $1 AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [userId]
    );
  }

  async acceptRequest(requestId: string, userId: string): Promise<any> {
    const req = await queryOne(
      "SELECT * FROM friend_requests WHERE id = $1 AND status = 'pending'",
      [requestId]
    );
    if (!req) throw new Error('Request not found');
    if (req.receiver_id !== userId && req.sender_id !== userId) throw new Error('Not your request');

    const accepterId = req.receiver_id === userId ? userId : req.sender_id;
    const otherUserId = req.receiver_id === userId ? req.sender_id : req.receiver_id;

    // Create friendship (canonical ordering)
    const [a, b] = accepterId < otherUserId ? [accepterId, otherUserId] : [otherUserId, accepterId];
    await query(
      'INSERT INTO friendships (user_a, user_b) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [a, b]
    );

    // Update request
    await query(
      "UPDATE friend_requests SET status = 'accepted', responded_at = NOW() WHERE id = $1",
      [requestId]
    );

    // Notify sender
    const accepter = await queryOne('SELECT username FROM users WHERE id = $1', [accepterId]);
    try {
      wsService.sendToUser(otherUserId, 'friend_accepted', {
        user_id: accepterId,
        username: accepter?.username,
      });
    } catch {}

    return { status: 'accepted' };
  }

  async declineRequest(requestId: string, userId: string): Promise<void> {
    const req = await queryOne(
      "SELECT * FROM friend_requests WHERE id = $1 AND receiver_id = $2 AND status = 'pending'",
      [requestId, userId]
    );
    if (!req) throw new Error('Request not found');
    await query("UPDATE friend_requests SET status = 'declined', responded_at = NOW() WHERE id = $1", [requestId]);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const [a, b] = userId < friendId ? [userId, friendId] : [friendId, userId];
    await query('DELETE FROM friendships WHERE user_a = $1 AND user_b = $2', [a, b]);
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) throw new Error('Cannot block yourself');
    await query(
      'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [blockerId, blockedId]
    );
    // Remove friendship if exists
    const [a, b] = blockerId < blockedId ? [blockerId, blockedId] : [blockedId, blockerId];
    await query('DELETE FROM friendships WHERE user_a = $1 AND user_b = $2', [a, b]);
    // Cancel pending requests
    await query(
      "UPDATE friend_requests SET status = 'declined' WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)) AND status = 'pending'",
      [blockerId, blockedId]
    );
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await query('DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2', [blockerId, blockedId]);
  }

  async getBlockedUsers(userId: string): Promise<any[]> {
    return queryMany(
      `SELECT u.id, u.username, u.avatar_url
       FROM blocked_users b JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id = $1`,
      [userId]
    );
  }
}

export const friendService = new FriendService();

import { queryOne, queryMany } from '../config/database';

class PlayerService {
  async searchPlayers(query: string, requesterId: string, limit: number = 20): Promise<any[]> {
    if (!query || query.length < 2) return [];
    return queryMany(
      `SELECT u.id, u.username, u.level, u.avatar_url, u.visibility
       FROM users u
       WHERE u.username ILIKE $1
         AND u.id != $2
         AND u.banned = FALSE
         AND u.id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = $2)
         AND u.id NOT IN (SELECT blocker_id FROM blocked_users WHERE blocked_id = $2)
       ORDER BY similarity(u.username, $3) DESC, u.level DESC
       LIMIT $4`,
      [`%${query}%`, requesterId, query, limit]
    );
  }

  async getPublicProfile(targetId: string, requesterId: string): Promise<any> {
    // Check block
    const blocked = await queryOne(
      `SELECT 1 FROM blocked_users
       WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [requesterId, targetId]
    );
    if (blocked) throw new Error('User not found');

    const user = await queryOne(
      `SELECT u.id, u.username, u.level, u.avatar_url, u.visibility, u.created_at,
              (SELECT COUNT(*) FROM territories WHERE owner_id = u.id) as territory_count,
              (SELECT COALESCE(SUM(ST_Area(polygon::geography)), 0) FROM territories WHERE owner_id = u.id) as total_area
       FROM users u WHERE u.id = $1 AND u.banned = FALSE`,
      [targetId]
    );
    if (!user) throw new Error('User not found');

    // Check friendship for visibility
    const areFriends = await this.areFriends(requesterId, targetId);

    if (user.visibility === 'private' && !areFriends && requesterId !== targetId) {
      return { id: user.id, username: user.username, level: user.level, avatar_url: user.avatar_url, limited: true };
    }

    return {
      ...user,
      is_friend: areFriends,
      limited: false,
    };
  }

  async areFriends(userA: string, userB: string): Promise<boolean> {
    const [a, b] = userA < userB ? [userA, userB] : [userB, userA];
    const row = await queryOne('SELECT 1 FROM friendships WHERE user_a = $1 AND user_b = $2', [a, b]);
    return !!row;
  }

  async isBlocked(userA: string, userB: string): Promise<boolean> {
    const row = await queryOne(
      'SELECT 1 FROM blocked_users WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [userA, userB]
    );
    return !!row;
  }
}

export const playerService = new PlayerService();

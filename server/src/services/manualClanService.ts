// ============================================================
// Manual Clan Service
// Player-created clans with full management: roles, kicking,
// leadership transfer, search, disband.
// ============================================================

import { query, queryOne, queryMany, transaction } from '../config/database';
import { wsService } from './wsService';

// Role hierarchy: leader > officer > member
const ROLE_HIERARCHY: Record<string, number> = {
  leader: 3,
  officer: 2,
  member: 1,
};

export class ManualClanService {
  // ------------------------------------------------------------------
  // 1. Create Clan
  // ------------------------------------------------------------------
  async createClan(
    leaderId: string,
    name: string,
    description: string,
    tag: string,
    color: string,
    privacy: string,
  ): Promise<any> {
    // Validate name
    if (!name || name.trim().length < 3 || name.trim().length > 30) {
      throw new Error('Clan name must be between 3 and 30 characters');
    }

    // Validate tag: 2-6 uppercase alphanumeric
    const tagUpper = (tag || '').toUpperCase().trim();
    if (!/^[A-Z0-9]{2,6}$/.test(tagUpper)) {
      throw new Error('Clan tag must be 2-6 uppercase alphanumeric characters');
    }

    // Validate description
    if (description && description.length > 500) {
      throw new Error('Description must be 500 characters or less');
    }

    // Check tag uniqueness
    const existingTag = await queryOne<{ id: string }>(
      `SELECT id FROM clans WHERE tag = $1 AND disbanded = FALSE`,
      [tagUpper],
    );
    if (existingTag) {
      throw new Error('Clan tag is already taken');
    }

    // Check user is not already in a manual clan
    const existingMembership = await queryOne<{ clan_id: string }>(
      `SELECT cm.clan_id FROM clan_members cm
       JOIN clans c ON c.id = cm.clan_id
       WHERE cm.user_id = $1 AND c.type = 'manual' AND c.disbanded = FALSE`,
      [leaderId],
    );
    if (existingMembership) {
      throw new Error('You are already a member of a manual clan');
    }

    // Create clan + add leader in transaction
    const clan = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO clans (type, name, description, tag, color, privacy, leader_id, auto_generated, disbanded)
         VALUES ('manual', $1, $2, $3, $4, $5, $6, FALSE, FALSE)
         RETURNING *`,
        [name.trim(), description || '', tagUpper, color || '#4A90D9', privacy || 'open', leaderId],
      );

      const newClan = result.rows[0];

      await client.query(
        `INSERT INTO clan_members (clan_id, user_id, role)
         VALUES ($1, $2, 'leader')`,
        [newClan.id, leaderId],
      );

      return newClan;
    });

    return clan;
  }

  // ------------------------------------------------------------------
  // 2. Update Clan
  // ------------------------------------------------------------------
  async updateClan(
    clanId: string,
    userId: string,
    updates: { name?: string; description?: string; color?: string; privacy?: string },
  ): Promise<any> {
    // Verify user is leader or officer
    const role = await this.getMemberRole(clanId, userId);
    if (!role || (role !== 'leader' && role !== 'officer')) {
      throw new Error('Only the leader or officers can update the clan');
    }

    // Build dynamic update
    const allowedFields = ['name', 'description', 'color', 'privacy'];
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      const value = (updates as any)[field];
      if (value !== undefined) {
        // Validate name if provided
        if (field === 'name') {
          if (!value || value.trim().length < 3 || value.trim().length > 30) {
            throw new Error('Clan name must be between 3 and 30 characters');
          }
        }
        // Validate description if provided
        if (field === 'description' && value && value.length > 500) {
          throw new Error('Description must be 500 characters or less');
        }
        setClauses.push(`${field} = $${paramIndex}`);
        params.push(field === 'name' ? value.trim() : value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(clanId);
    const updated = await queryOne<any>(
      `UPDATE clans SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND disbanded = FALSE RETURNING *`,
      params,
    );

    if (!updated) {
      throw new Error('Clan not found or already disbanded');
    }

    return updated;
  }

  // ------------------------------------------------------------------
  // 3. Disband Clan
  // ------------------------------------------------------------------
  async disbandClan(clanId: string, userId: string): Promise<void> {
    const role = await this.getMemberRole(clanId, userId);
    if (role !== 'leader') {
      throw new Error('Only the leader can disband the clan');
    }

    await transaction(async (client) => {
      // Mark disbanded
      await client.query(
        `UPDATE clans SET disbanded = TRUE WHERE id = $1`,
        [clanId],
      );

      // Get all members for notification before deleting
      const membersResult = await client.query(
        `SELECT user_id FROM clan_members WHERE clan_id = $1`,
        [clanId],
      );

      // Remove all members
      await client.query(
        `DELETE FROM clan_members WHERE clan_id = $1`,
        [clanId],
      );

      // Notify members
      for (const row of membersResult.rows) {
        if (row.user_id !== userId) {
          wsService.sendToUser(row.user_id, 'clan_disbanded', { clanId });
        }
      }
    });
  }

  // ------------------------------------------------------------------
  // 4. Leave Clan
  // ------------------------------------------------------------------
  async leaveClan(clanId: string, userId: string): Promise<void> {
    const role = await this.getMemberRole(clanId, userId);
    if (!role) {
      throw new Error('You are not a member of this clan');
    }

    if (role === 'leader') {
      // Find a successor: next officer, or oldest member
      const successor = await queryOne<{ user_id: string; role: string }>(
        `SELECT user_id, role FROM clan_members
         WHERE clan_id = $1 AND user_id != $2
         ORDER BY
           CASE role WHEN 'officer' THEN 1 WHEN 'member' THEN 2 ELSE 3 END,
           joined_at ASC
         LIMIT 1`,
        [clanId, userId],
      );

      if (!successor) {
        // Last member — disband
        await transaction(async (client) => {
          await client.query(`UPDATE clans SET disbanded = TRUE WHERE id = $1`, [clanId]);
          await client.query(`DELETE FROM clan_members WHERE clan_id = $1`, [clanId]);
        });
        return;
      }

      // Transfer leadership to successor
      await transaction(async (client) => {
        await client.query(
          `UPDATE clan_members SET role = 'leader' WHERE clan_id = $1 AND user_id = $2`,
          [clanId, successor.user_id],
        );
        await client.query(
          `UPDATE clans SET leader_id = $1 WHERE id = $2`,
          [successor.user_id, clanId],
        );
        await client.query(
          `DELETE FROM clan_members WHERE clan_id = $1 AND user_id = $2`,
          [clanId, userId],
        );
      });

      wsService.sendToUser(successor.user_id, 'clan_leader_promoted', { clanId });
    } else {
      // Non-leader just leaves
      await query(
        `DELETE FROM clan_members WHERE clan_id = $1 AND user_id = $2`,
        [clanId, userId],
      );
    }
  }

  // ------------------------------------------------------------------
  // 5. Set Member Role
  // ------------------------------------------------------------------
  async setMemberRole(
    clanId: string,
    actorId: string,
    targetId: string,
    newRole: string,
  ): Promise<void> {
    if (actorId === targetId) {
      throw new Error('You cannot change your own role');
    }

    const actorRole = await this.getMemberRole(clanId, actorId);
    if (actorRole !== 'leader') {
      throw new Error('Only the leader can change member roles');
    }

    if (!['officer', 'member'].includes(newRole)) {
      throw new Error('Invalid role. Must be "officer" or "member"');
    }

    const targetRole = await this.getMemberRole(clanId, targetId);
    if (!targetRole) {
      throw new Error('Target user is not a member of this clan');
    }

    await query(
      `UPDATE clan_members SET role = $1 WHERE clan_id = $2 AND user_id = $3`,
      [newRole, clanId, targetId],
    );

    wsService.sendToUser(targetId, 'clan_role_changed', { clanId, newRole });
  }

  // ------------------------------------------------------------------
  // 6. Kick Member
  // ------------------------------------------------------------------
  async kickMember(clanId: string, actorId: string, targetId: string): Promise<void> {
    if (actorId === targetId) {
      throw new Error('You cannot kick yourself. Use leave instead.');
    }

    const actorRole = await this.getMemberRole(clanId, actorId);
    const targetRole = await this.getMemberRole(clanId, targetId);

    if (!actorRole) {
      throw new Error('You are not a member of this clan');
    }
    if (!targetRole) {
      throw new Error('Target user is not a member of this clan');
    }

    const actorLevel = ROLE_HIERARCHY[actorRole] || 0;
    const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

    if (actorLevel <= targetLevel) {
      throw new Error('You can only kick members with a lower role than yours');
    }

    await query(
      `DELETE FROM clan_members WHERE clan_id = $1 AND user_id = $2`,
      [clanId, targetId],
    );

    wsService.sendToUser(targetId, 'clan_kicked', { clanId });
  }

  // ------------------------------------------------------------------
  // 7. Transfer Leadership
  // ------------------------------------------------------------------
  async transferLeadership(
    clanId: string,
    currentLeaderId: string,
    newLeaderId: string,
  ): Promise<void> {
    const currentRole = await this.getMemberRole(clanId, currentLeaderId);
    if (currentRole !== 'leader') {
      throw new Error('Only the current leader can transfer leadership');
    }

    const newLeaderRole = await this.getMemberRole(clanId, newLeaderId);
    if (!newLeaderRole) {
      throw new Error('Target user is not a member of this clan');
    }

    await transaction(async (client) => {
      // Demote current leader to officer
      await client.query(
        `UPDATE clan_members SET role = 'officer' WHERE clan_id = $1 AND user_id = $2`,
        [clanId, currentLeaderId],
      );
      // Promote new leader
      await client.query(
        `UPDATE clan_members SET role = 'leader' WHERE clan_id = $1 AND user_id = $2`,
        [clanId, newLeaderId],
      );
      // Update clans table
      await client.query(
        `UPDATE clans SET leader_id = $1 WHERE id = $2`,
        [newLeaderId, clanId],
      );
    });

    wsService.sendToUser(newLeaderId, 'clan_leader_promoted', { clanId });
    wsService.sendToUser(currentLeaderId, 'clan_role_changed', { clanId, newRole: 'officer' });
  }

  // ------------------------------------------------------------------
  // 8. Search Clans
  // ------------------------------------------------------------------
  async searchClans(queryStr: string, limit: number = 20): Promise<any[]> {
    const safeLim = Math.min(Math.max(limit, 1), 50);

    return queryMany<any>(
      `SELECT c.*,
              (SELECT COUNT(*) FROM clan_members WHERE clan_id = c.id) as member_count
       FROM clans c
       WHERE c.type = 'manual'
         AND c.disbanded = FALSE
         AND (c.name ILIKE $1 OR c.tag ILIKE $1)
       ORDER BY member_count DESC, c.created_at DESC
       LIMIT $2`,
      [`%${queryStr}%`, safeLim],
    );
  }

  // ------------------------------------------------------------------
  // 9. Get Clan Members
  // ------------------------------------------------------------------
  async getClanMembers(clanId: string): Promise<any[]> {
    return queryMany<any>(
      `SELECT cm.user_id, cm.role, cm.joined_at,
              u.username, u.level, u.xp, u.reputation
       FROM clan_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.clan_id = $1
       ORDER BY
         CASE cm.role WHEN 'leader' THEN 1 WHEN 'officer' THEN 2 WHEN 'member' THEN 3 ELSE 4 END,
         cm.joined_at ASC`,
      [clanId],
    );
  }

  // ------------------------------------------------------------------
  // 10. Get Member Role
  // ------------------------------------------------------------------
  async getMemberRole(clanId: string, userId: string): Promise<string | null> {
    const row = await queryOne<{ role: string }>(
      `SELECT role FROM clan_members WHERE clan_id = $1 AND user_id = $2`,
      [clanId, userId],
    );
    return row ? row.role : null;
  }
}

// Singleton export
export const manualClanService = new ManualClanService();

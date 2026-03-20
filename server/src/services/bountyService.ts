// ============================================================
// Bounty Service
// Place, claim, and auto-generate bounties on dominant players.
// Bounties reward taking territory from targeted players.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { awardXp } from './progressionEngine';
import { sendNotification } from './notificationService';
import { wsService } from './wsService';

/** Bounty record from the database */
export interface Bounty {
  id: string;
  issuer_id: string;
  target_id: string;
  reason: string | null;
  xp_reward: number;
  is_auto: boolean;
  status: string;
  claimed_by: string | null;
  created_at: Date;
  expires_at: Date;
}

/** Auto-bounty escalation tiers (days dominated -> XP reward) */
const AUTO_BOUNTY_TIERS = [
  { days: 28, reward: 2000 },
  { days: 21, reward: 1000 },
  { days: 14, reward: 500 },
];

/**
 * Bounty service handling the full bounty lifecycle:
 * placement, claiming on takeover, auto-generation for dominators.
 */
export class BountyService {
  /**
   * Place a bounty on a target player. Costs XP from the issuer.
   *
   * @param issuerId - Player placing the bounty
   * @param targetId - Player being targeted
   * @param reason - Optional reason for the bounty
   * @param xpReward - XP reward for claiming (deducted from issuer)
   * @returns The created bounty
   */
  async placeBounty(
    issuerId: string,
    targetId: string,
    reason?: string,
    xpReward: number = 500
  ): Promise<Bounty> {
    if (issuerId === targetId) {
      throw new Error('Cannot place a bounty on yourself');
    }

    // Validate reward range
    if (xpReward < 100 || xpReward > 5000) {
      throw new Error('Bounty reward must be between 100 and 5000 XP');
    }

    // Check issuer has enough XP
    const issuer = await queryOne<{ xp: number }>(
      'SELECT xp FROM users WHERE id = $1',
      [issuerId]
    );

    if (!issuer || issuer.xp < xpReward) {
      throw new Error('Insufficient XP to place this bounty');
    }

    // Check target exists
    const target = await queryOne<{ id: string; username: string }>(
      'SELECT id, username FROM users WHERE id = $1 AND banned = FALSE',
      [targetId]
    );

    if (!target) {
      throw new Error('Target player not found');
    }

    // Check for existing active bounty from this issuer on same target
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM bounties
       WHERE issuer_id = $1 AND target_id = $2 AND status = 'active'`,
      [issuerId, targetId]
    );

    if (existing) {
      throw new Error('You already have an active bounty on this player');
    }

    // Deduct XP from issuer
    await query(
      'UPDATE users SET xp = xp - $1 WHERE id = $2',
      [xpReward, issuerId]
    );

    // Create bounty
    const bounty = await queryOne<Bounty>(
      `INSERT INTO bounties (issuer_id, target_id, reason, xp_reward)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [issuerId, targetId, reason || null, xpReward]
    );

    if (!bounty) {
      throw new Error('Failed to create bounty');
    }

    // Notify the target
    try {
      await sendNotification({
        userId: targetId,
        type: 'territory_attack' as any,
        title: 'Bounty Placed on You!',
        body: `Someone placed a ${xpReward} XP bounty on you. Defend your territories!`,
        data: { bounty_id: bounty.id, xp_reward: xpReward },
        priority: 'HIGH',
      });
    } catch (err) {
      console.error('[BountyService] Failed to notify bounty target:', err);
    }

    // Log to feed
    try {
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('bounty_placed', $1, $2)`,
        [issuerId, JSON.stringify({
          bounty_id: bounty.id,
          target_id: targetId,
          xp_reward: xpReward,
        })]
      );
    } catch (err) {
      console.error('[BountyService] Failed to log bounty placement:', err);
    }

    return bounty;
  }

  /**
   * Claim a bounty when someone takes territory from a bounty target.
   * Called automatically by the claim engine after a successful takeover.
   *
   * @param bountyId - Bounty to claim
   * @param claimerId - Player who took the territory
   * @returns The claimed bounty with XP awarded
   */
  async claimBounty(
    bountyId: string,
    claimerId: string
  ): Promise<{ bounty: Bounty; xpAwarded: number }> {
    const bounty = await queryOne<Bounty>(
      `SELECT * FROM bounties WHERE id = $1 AND status = 'active'`,
      [bountyId]
    );

    if (!bounty) {
      throw new Error('Bounty not found or already claimed');
    }

    if (claimerId === bounty.target_id) {
      throw new Error('Target cannot claim their own bounty');
    }

    if (claimerId === bounty.issuer_id) {
      throw new Error('Issuer cannot claim their own bounty');
    }

    // Mark bounty as claimed
    await query(
      `UPDATE bounties SET status = 'claimed', claimed_by = $1 WHERE id = $2`,
      [claimerId, bountyId]
    );

    // Award XP to claimer
    await awardXp(claimerId, bounty.xp_reward, 'bounty_claim');

    // Notify claimer
    try {
      wsService.sendToUser(claimerId, 'bounty_claimed', {
        title: 'Bounty Claimed!',
        body: `You earned ${bounty.xp_reward} XP from a bounty!`,
        bounty_id: bountyId,
        xp_reward: bounty.xp_reward,
      });
    } catch (err) {
      console.error('[BountyService] Failed to notify bounty claimer:', err);
    }

    // Log to feed
    try {
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('bounty_claimed', $1, $2)`,
        [claimerId, JSON.stringify({
          bounty_id: bountyId,
          target_id: bounty.target_id,
          xp_reward: bounty.xp_reward,
        })]
      );
    } catch (err) {
      console.error('[BountyService] Failed to log bounty claim:', err);
    }

    return {
      bounty: { ...bounty, status: 'claimed', claimed_by: claimerId },
      xpAwarded: bounty.xp_reward,
    };
  }

  /**
   * Get all active bounties, optionally filtered by location proximity.
   *
   * @param lat - Optional latitude for proximity filter
   * @param lng - Optional longitude for proximity filter
   * @param radius - Search radius in meters (default 5000)
   * @returns Array of active bounties
   */
  async getActiveBounties(lat?: number, lng?: number, radius: number = 5000): Promise<any[]> {
    // If location provided, find bounties on players who own nearby territories
    if (lat !== undefined && lng !== undefined) {
      const bounties = await queryMany(
        `SELECT b.*, u_target.username as target_username, u_issuer.username as issuer_username
         FROM bounties b
         JOIN users u_target ON b.target_id = u_target.id
         LEFT JOIN users u_issuer ON b.issuer_id = u_issuer.id
         WHERE b.status = 'active'
         AND b.expires_at > NOW()
         AND EXISTS (
           SELECT 1 FROM territories t
           WHERE t.owner_id = b.target_id
           AND ST_DWithin(
             ST_Centroid(t.polygon)::geography,
             ST_MakePoint($2, $1)::geography,
             $3
           )
         )
         ORDER BY b.xp_reward DESC
         LIMIT 50`,
        [lat, lng, radius]
      );
      return bounties;
    }

    // No location filter: return all active bounties
    const bounties = await queryMany(
      `SELECT b.*, u_target.username as target_username, u_issuer.username as issuer_username
       FROM bounties b
       JOIN users u_target ON b.target_id = u_target.id
       LEFT JOIN users u_issuer ON b.issuer_id = u_issuer.id
       WHERE b.status = 'active'
       AND b.expires_at > NOW()
       ORDER BY b.xp_reward DESC
       LIMIT 50`
    );
    return bounties;
  }

  /**
   * Get all active bounties targeting a specific user.
   *
   * @param userId - Target user ID
   * @returns Array of bounties on this user
   */
  async getUserBounties(userId: string): Promise<Bounty[]> {
    const bounties = await queryMany<Bounty>(
      `SELECT b.*, u_issuer.username as issuer_username
       FROM bounties b
       LEFT JOIN users u_issuer ON b.issuer_id = u_issuer.id
       WHERE b.target_id = $1 AND b.status = 'active' AND b.expires_at > NOW()
       ORDER BY b.xp_reward DESC`,
      [userId]
    );
    return bounties;
  }

  /**
   * Check for and auto-claim bounties when a territory is taken over.
   * Called by the claim engine after a successful takeover.
   *
   * @param previousOwnerId - The player who lost their territory
   * @param claimerId - The player who took the territory
   * @returns Array of claimed bounties
   */
  async checkAndClaimBounties(
    previousOwnerId: string,
    claimerId: string
  ): Promise<{ bounty: Bounty; xpAwarded: number }[]> {
    const activeBounties = await queryMany<Bounty>(
      `SELECT * FROM bounties
       WHERE target_id = $1 AND status = 'active' AND expires_at > NOW()
       ORDER BY xp_reward DESC`,
      [previousOwnerId]
    );

    const results: { bounty: Bounty; xpAwarded: number }[] = [];

    for (const bounty of activeBounties) {
      try {
        const result = await this.claimBounty(bounty.id, claimerId);
        results.push(result);
      } catch (err) {
        console.error(`[BountyService] Failed to auto-claim bounty ${bounty.id}:`, err);
      }
    }

    return results;
  }

  /**
   * Cron job: scan for players who have dominated territories for 14+ days.
   * Auto-place escalating bounties on them.
   *
   * Escalation tiers:
   * - Day 14: 500 XP
   * - Day 21: 1000 XP
   * - Day 28: 2000 XP
   */
  async checkAutoBounty(): Promise<{ created: number }> {
    let created = 0;

    for (const tier of AUTO_BOUNTY_TIERS) {
      try {
        // Find players who own territories claimed >= tier.days ago
        // that have NOT been defended/refreshed
        const dominators = await queryMany<{ owner_id: string; territory_count: number }>(
          `SELECT owner_id, COUNT(*) as territory_count
           FROM territories
           WHERE owner_id IS NOT NULL
           AND claimed_at <= NOW() - INTERVAL '1 day' * $1
           AND last_defended <= NOW() - INTERVAL '1 day' * $1
           GROUP BY owner_id
           HAVING COUNT(*) >= 3
           ORDER BY COUNT(*) DESC
           LIMIT 100`,
          [tier.days]
        );

        for (const dominator of dominators) {
          // Check if there's already an auto-bounty at this tier level
          const existing = await queryOne<{ id: string }>(
            `SELECT id FROM bounties
             WHERE target_id = $1
             AND is_auto = TRUE
             AND xp_reward >= $2
             AND status = 'active'`,
            [dominator.owner_id, tier.reward]
          );

          if (existing) continue;

          // Create auto-bounty (system-generated, issuer = target as placeholder)
          await query(
            `INSERT INTO bounties (issuer_id, target_id, reason, xp_reward, is_auto)
             VALUES ($1, $1, $2, $3, TRUE)`,
            [
              dominator.owner_id,
              `Auto-bounty: dominated ${dominator.territory_count} territories for ${tier.days}+ days`,
              tier.reward,
            ]
          );

          created++;

          // Notify the dominator
          try {
            await sendNotification({
              userId: dominator.owner_id,
              type: 'territory_attack' as any,
              title: 'Auto-Bounty Activated!',
              body: `Your ${tier.days}-day dominance triggered a ${tier.reward} XP bounty on you!`,
              data: { xp_reward: tier.reward, days: tier.days },
              priority: 'HIGH',
            });
          } catch (err) {
            console.error('[BountyService] Failed to notify auto-bounty target:', err);
          }
        }
      } catch (err) {
        console.error(`[BountyService] Auto-bounty check failed for tier ${tier.days}d:`, err);
      }
    }

    return { created };
  }
}

// ---- Singleton instance and functional exports ----

const bountyServiceInstance = new BountyService();

export async function placeBounty(
  issuerId: string,
  targetId: string,
  reason?: string,
  xpReward?: number
): Promise<Bounty> {
  return bountyServiceInstance.placeBounty(issuerId, targetId, reason, xpReward);
}

export async function claimBounty(
  bountyId: string,
  claimerId: string
): Promise<{ bounty: Bounty; xpAwarded: number }> {
  return bountyServiceInstance.claimBounty(bountyId, claimerId);
}

export async function getActiveBounties(
  lat?: number,
  lng?: number,
  radius?: number
): Promise<any[]> {
  return bountyServiceInstance.getActiveBounties(lat, lng, radius);
}

export async function getUserBounties(userId: string): Promise<Bounty[]> {
  return bountyServiceInstance.getUserBounties(userId);
}

export async function checkAndClaimBounties(
  previousOwnerId: string,
  claimerId: string
): Promise<{ bounty: Bounty; xpAwarded: number }[]> {
  return bountyServiceInstance.checkAndClaimBounties(previousOwnerId, claimerId);
}

export async function checkAutoBounty(): Promise<{ created: number }> {
  return bountyServiceInstance.checkAutoBounty();
}

export const bountyService = bountyServiceInstance;

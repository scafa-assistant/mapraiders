// ============================================================
// Moderation Service
// Content text filtering, report handling, auto-moderation,
// creator reputation, and review queue logic
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { ReportTargetType } from '../utils/types';

/**
 * Blocklist patterns for content filtering.
 * Includes explicit slurs, spam patterns, and common abusive terms.
 */
const BLOCKED_PATTERNS: RegExp[] = [
  // Slurs and hate speech (simplified, extend in production)
  /\bn[i1][g9]{2}[ae3]r?\b/i,
  /\bf[a@]g{1,2}[o0]t\b/i,
  /\bk[i1]ke\b/i,
  /\bsp[i1]c\b/i,
  /\bch[i1]nk\b/i,
  /\btr[a@]nn(y|ie)\b/i,

  // Threats
  /\b(kill|murder|shoot|bomb)\s+(you|them|everyone)\b/i,
  /\bdeath\s+threat\b/i,

  // Spam patterns
  /(.)\1{10,}/,                         // Excessive character repetition
  /\b(buy|sell|cheap|discount)\s+\w+\s+(now|today|here)\b/i,
  /(https?:\/\/\S+){3,}/,             // Multiple URLs = spam

  // Adult content
  /\bp[o0]rn\b/i,
  /\bxxx\b/i,
];

/**
 * Suspicious keywords that warrant a flag but not auto-rejection.
 */
const SUSPICIOUS_KEYWORDS: string[] = [
  'hack', 'cheat', 'exploit', 'bot', 'script',
  'free money', 'giveaway', 'click here',
];

/**
 * Content moderation service handling text filtering,
 * user reports, auto-moderation thresholds, and creator reputation.
 */
export class ModerationService {
  /**
   * Check text content for inappropriate material.
   *
   * Uses pattern matching against blocklist and suspicious keywords.
   * Returns whether the content is safe and any flags raised.
   *
   * @param text - The text content to check
   * @returns Safety assessment with flags
   */
  async checkText(text: string): Promise<{ safe: boolean; flags: string[] }> {
    const flags: string[] = [];
    let safe = true;

    if (!text || text.trim().length === 0) {
      return { safe: true, flags: [] };
    }

    const normalized = text.toLowerCase().trim();

    // Check against blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(normalized)) {
        flags.push(`Blocked content pattern detected`);
        safe = false;
        break; // One match is enough to block
      }
    }

    // Check suspicious keywords (flag but don't block)
    for (const keyword of SUSPICIOUS_KEYWORDS) {
      if (normalized.includes(keyword)) {
        flags.push(`Suspicious keyword: "${keyword}"`);
      }
    }

    // Check for excessive caps (> 70% uppercase with > 10 chars)
    if (text.length > 10) {
      const upperCount = (text.match(/[A-Z]/g) || []).length;
      const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
      if (letterCount > 0 && upperCount / letterCount > 0.7) {
        flags.push('Excessive uppercase (possible shouting/spam)');
      }
    }

    // Check for excessive repetition of words
    const words = normalized.split(/\s+/);
    if (words.length > 5) {
      const wordCounts = new Map<string, number>();
      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
      for (const [word, count] of wordCounts) {
        if (count > words.length * 0.5 && word.length > 2) {
          flags.push(`Excessive word repetition: "${word}" (${count}x)`);
          break;
        }
      }
    }

    return { safe, flags };
  }

  /**
   * Create a user report against a piece of content or another user.
   *
   * After storing the report, checks if the auto-moderation threshold
   * has been reached (3+ reports -> hide, 5+ reports -> remove).
   *
   * @param reporterId - ID of the reporting user
   * @param targetType - Type of content being reported
   * @param targetId - ID of the reported content
   * @param reason - Reason for the report
   */
  async createReport(
    reporterId: string,
    targetType: string,
    targetId: string,
    reason: string
  ): Promise<void> {
    const typedTarget = targetType as ReportTargetType;

    // Check for duplicate report from same user
    const existing = await queryOne(
      `SELECT id FROM reports
       WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3
       AND status = 'pending'`,
      [reporterId, typedTarget, targetId]
    );

    if (existing) {
      throw new Error('You already have a pending report for this content');
    }

    // Validate that the target exists
    const targetExists = await this.validateTargetExists(typedTarget, targetId);
    if (!targetExists) {
      throw new Error('Report target not found');
    }

    // Prevent self-reporting
    const isOwner = await this.isContentOwner(typedTarget, targetId, reporterId);
    if (isOwner) {
      throw new Error('You cannot report your own content');
    }

    // Store the report
    await query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason)
       VALUES ($1, $2, $3, $4)`,
      [reporterId, typedTarget, targetId, reason]
    );

    // Check auto-moderation threshold
    await this.checkAutoModeration(typedTarget, targetId);
  }

  /**
   * Get the number of pending reports for a specific piece of content.
   *
   * @param targetType - Type of content
   * @param targetId - Content ID
   * @returns Report count
   */
  async getReportCount(targetType: string, targetId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM reports
       WHERE target_type = $1 AND target_id = $2 AND status = 'pending'`,
      [targetType, targetId]
    );

    return parseInt(result?.count || '0', 10);
  }

  /**
   * Calculate a creator's reputation score.
   *
   * Formula:
   * (positive_ratings / total_ratings) * 0.5
   * + (1 - report_rate) * 0.3
   * + account_age_factor * 0.2
   *
   * Reputation ranges from 0.0 (terrible) to 1.0 (excellent).
   *
   * @param userId - Creator user ID
   * @returns Reputation score between 0 and 1
   */
  async calculateReputation(userId: string): Promise<number> {
    try {
      // Get rating stats for content created by this user
      const ratingStats = await queryOne<{
        total_ratings: string;
        positive_ratings: string;
      }>(
        `SELECT
           COUNT(*) as total_ratings,
           COUNT(*) FILTER (WHERE worth_it >= 3) as positive_ratings
         FROM ratings r
         JOIN quests q ON r.target_id = q.id::TEXT AND r.target_type = 'quest'
         WHERE q.creator_id = $1`,
        [userId]
      );

      const totalRatings = parseInt(ratingStats?.total_ratings || '0', 10);
      const positiveRatings = parseInt(ratingStats?.positive_ratings || '0', 10);

      // Rating factor: ratio of positive ratings
      const ratingFactor = totalRatings > 0
        ? positiveRatings / totalRatings
        : 0.5; // Neutral if no ratings

      // Report rate: reports against this user's content
      const reportStats = await queryOne<{
        total_content: string;
        reported_content: string;
      }>(
        `SELECT
           (SELECT COUNT(*) FROM quests WHERE creator_id = $1)
           + (SELECT COUNT(*) FROM echos WHERE creator_id = $1)
           + (SELECT COUNT(*) FROM challenges WHERE creator_id = $1) as total_content,
           (SELECT COUNT(DISTINCT target_id) FROM reports
            WHERE target_id IN (
              SELECT id::TEXT FROM quests WHERE creator_id = $1
              UNION SELECT id::TEXT FROM echos WHERE creator_id = $1
              UNION SELECT id::TEXT FROM challenges WHERE creator_id = $1
            )) as reported_content`,
        [userId]
      );

      const totalContent = parseInt(reportStats?.total_content || '0', 10);
      const reportedContent = parseInt(reportStats?.reported_content || '0', 10);
      const reportRate = totalContent > 0 ? reportedContent / totalContent : 0;
      const reportFactor = 1 - reportRate;

      // Account age factor (caps at 1 year = 365 days)
      const user = await queryOne<{ created_at: Date }>(
        'SELECT created_at FROM users WHERE id = $1',
        [userId]
      );

      let ageFactor = 0.5;
      if (user) {
        const ageInDays =
          (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
        ageFactor = Math.min(1.0, ageInDays / 365);
      }

      // Weighted combination
      const reputation =
        ratingFactor * 0.5 + reportFactor * 0.3 + ageFactor * 0.2;

      // Clamp to [0, 1]
      const clamped = Math.max(0, Math.min(1, reputation));

      // Update user reputation in DB
      await query('UPDATE users SET reputation = $1 WHERE id = $2', [
        Math.round(clamped * 100) / 100,
        userId,
      ]);

      return clamped;
    } catch (err) {
      console.error('[Moderation] Error calculating reputation:', err);
      return 0.5; // Neutral default on error
    }
  }

  /**
   * Check if a creator's content should go through the review queue
   * before being published.
   *
   * Low reputation (< 0.4) -> needs review.
   * New accounts with fewer than 3 approved items -> needs review.
   *
   * @param creatorId - Creator user ID
   * @returns Whether the content needs manual review
   */
  async needsReview(creatorId: string): Promise<boolean> {
    try {
      const user = await queryOne<{ reputation: number; created_at: Date }>(
        'SELECT reputation, created_at FROM users WHERE id = $1',
        [creatorId]
      );

      if (!user) return true;

      // Low reputation always needs review
      if (user.reputation < 0.4) {
        return true;
      }

      // New accounts (< 7 days) with fewer than 3 approved items need review
      const ageInDays =
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);

      if (ageInDays < 7) {
        const approvedContent = await queryOne<{ count: string }>(
          `SELECT
             (SELECT COUNT(*) FROM quests WHERE creator_id = $1 AND status = 'active')
             + (SELECT COUNT(*) FROM echos WHERE creator_id = $1 AND status = 'active')
             as count`,
          [creatorId]
        );

        if (parseInt(approvedContent?.count || '0', 10) < 3) {
          return true;
        }
      }

      return false;
    } catch {
      return true; // Err on the side of caution
    }
  }

  // ---- Private Helpers ----

  /**
   * Check if auto-moderation thresholds have been reached.
   * 3+ reports -> hide content (set status to 'reviewed' on reports)
   * 5+ reports -> remove content entirely
   */
  private async checkAutoModeration(
    targetType: ReportTargetType,
    targetId: string
  ): Promise<void> {
    const count = await this.getReportCount(targetType, targetId);

    if (count >= 5) {
      // Auto-remove content
      await this.removeContent(targetType, targetId);
      // Mark all reports as resolved
      await query(
        `UPDATE reports SET status = 'resolved'
         WHERE target_type = $1 AND target_id = $2 AND status = 'pending'`,
        [targetType, targetId]
      );
      console.log(
        `[Moderation] Auto-removed ${targetType} ${targetId} (${count} reports)`
      );
    } else if (count >= 3) {
      // Flag for manual review (hide content)
      await this.hideContent(targetType, targetId);
      await query(
        `UPDATE reports SET status = 'reviewed'
         WHERE target_type = $1 AND target_id = $2 AND status = 'pending'`,
        [targetType, targetId]
      );
      console.log(
        `[Moderation] Auto-hidden ${targetType} ${targetId} (${count} reports)`
      );
    }
  }

  /**
   * Remove content by setting its status to deleted/archived.
   */
  private async removeContent(
    targetType: ReportTargetType,
    targetId: string
  ): Promise<void> {
    switch (targetType) {
      case 'quest':
        await query("UPDATE quests SET status = 'deleted' WHERE id = $1", [targetId]);
        break;
      case 'echo':
        await query("UPDATE echos SET status = 'deleted' WHERE id = $1", [targetId]);
        break;
      case 'challenge':
        await query("UPDATE challenges SET status = 'deleted' WHERE id = $1", [
          targetId,
        ]);
        break;
      case 'travel_route':
        await query("UPDATE travel_routes SET status = 'archived' WHERE id = $1", [
          targetId,
        ]);
        break;
      case 'user':
        // Flag user for admin review, don't auto-ban
        await query(
          "UPDATE users SET settings = settings || '{\"flagged\": true}'::jsonb WHERE id = $1",
          [targetId]
        );
        break;
    }
  }

  /**
   * Hide content (intermediate step before removal).
   * Sets status to 'hidden' where applicable.
   */
  private async hideContent(
    targetType: ReportTargetType,
    targetId: string
  ): Promise<void> {
    switch (targetType) {
      case 'quest':
        await query("UPDATE quests SET status = 'archived' WHERE id = $1", [
          targetId,
        ]);
        break;
      case 'echo':
        await query("UPDATE echos SET status = 'expired' WHERE id = $1", [
          targetId,
        ]);
        break;
      case 'challenge':
        await query("UPDATE challenges SET status = 'archived' WHERE id = $1", [
          targetId,
        ]);
        break;
      case 'travel_route':
        await query("UPDATE travel_routes SET status = 'archived' WHERE id = $1", [
          targetId,
        ]);
        break;
      case 'user':
        // No hiding for users, only flagging
        break;
    }
  }

  /**
   * Validate that the report target actually exists in the database.
   */
  private async validateTargetExists(
    targetType: ReportTargetType,
    targetId: string
  ): Promise<boolean> {
    const tableMap: Record<ReportTargetType, string> = {
      quest: 'quests',
      echo: 'echos',
      challenge: 'challenges',
      user: 'users',
      travel_route: 'travel_routes',
    };

    const table = tableMap[targetType];
    if (!table) return false;

    const result = await queryOne(
      `SELECT id FROM ${table} WHERE id = $1`,
      [targetId]
    );

    return !!result;
  }

  /**
   * Check if the reporter is the owner of the content (prevent self-reporting).
   */
  private async isContentOwner(
    targetType: ReportTargetType,
    targetId: string,
    userId: string
  ): Promise<boolean> {
    const ownerColumnMap: Record<ReportTargetType, { table: string; column: string } | null> = {
      quest: { table: 'quests', column: 'creator_id' },
      echo: { table: 'echos', column: 'creator_id' },
      challenge: { table: 'challenges', column: 'creator_id' },
      travel_route: { table: 'travel_routes', column: 'founder_id' },
      user: null, // Users can't "own" themselves in the same way
    };

    const mapping = ownerColumnMap[targetType];
    if (!mapping) return false;

    const result = await queryOne<{ owner: string }>(
      `SELECT ${mapping.column} as owner FROM ${mapping.table} WHERE id = $1`,
      [targetId]
    );

    return result?.owner === userId;
  }
}

// ---- Legacy functional exports for backward compatibility ----

const moderationInstance = new ModerationService();

export async function createReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: string
): Promise<string> {
  await moderationInstance.createReport(reporterId, targetType, targetId, reason);
  // Fetch the created report ID for backward compat
  const result = await queryOne<{ id: string }>(
    `SELECT id FROM reports
     WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3
     ORDER BY created_at DESC LIMIT 1`,
    [reporterId, targetType, targetId]
  );
  return result?.id ?? '';
}

export async function getPendingReports(
  page: number = 1,
  limit: number = 20
): Promise<{ reports: any[]; total: number }> {
  const offset = (page - 1) * limit;

  const [reports, countResult] = await Promise.all([
    queryMany(
      `SELECT r.*,
              u.username as reporter_username
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"
    ),
  ]);

  return {
    reports,
    total: parseInt(countResult?.count || '0', 10),
  };
}

export const moderationService = moderationInstance;

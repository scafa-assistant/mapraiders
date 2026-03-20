// ============================================================
// Alias Service
// Anonymous second identities for stealth gameplay.
// One alias per player; cannot join same clan as main account.
// ============================================================

import { query, queryOne } from '../config/database';

/** Alias record from the database */
export interface Alias {
  id: string;
  user_id: string;
  alias_name: string;
  alias_level: number;
  alias_xp: number;
  is_revealed: boolean;
  revealed_by: string | null;
  created_at: Date;
  cooldown_until: Date | null;
}

/**
 * Alias service managing anonymous second identities.
 * Players at level 31+ (Architect) can create one alias
 * for stealth territory claiming.
 */
export class AliasService {
  /**
   * Create an anonymous alias for a user.
   * Requires level >= 31 (Architect). One alias per user.
   *
   * @param userId - Player creating the alias
   * @param aliasName - Desired alias name (must be unique)
   * @returns The created alias
   */
  async createAlias(userId: string, aliasName: string): Promise<Alias> {
    // Validate alias name
    if (!aliasName || aliasName.trim().length < 3 || aliasName.trim().length > 50) {
      throw new Error('Alias name must be between 3 and 50 characters');
    }

    const trimmedName = aliasName.trim();

    // Check user level
    const user = await queryOne<{ level: number; username: string }>(
      'SELECT level, username FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    if (user.level < 31) {
      throw new Error('Alias creation requires level 31 (Architect) or higher');
    }

    // Cannot use own username as alias
    if (trimmedName.toLowerCase() === user.username.toLowerCase()) {
      throw new Error('Alias cannot be the same as your username');
    }

    // Check for existing alias
    const existing = await queryOne<{ id: string; cooldown_until: Date | null }>(
      'SELECT id, cooldown_until FROM aliases WHERE user_id = $1',
      [userId]
    );

    if (existing) {
      // Check cooldown
      if (existing.cooldown_until && new Date(existing.cooldown_until) > new Date()) {
        const remaining = Math.ceil(
          (new Date(existing.cooldown_until).getTime() - Date.now()) / (1000 * 60 * 60)
        );
        throw new Error(`Alias on cooldown. ${remaining} hours remaining`);
      }
      throw new Error('You already have an alias. Delete it first to create a new one');
    }

    // Check alias name uniqueness (against both aliases and usernames)
    const nameTaken = await queryOne<{ id: string }>(
      `SELECT id FROM aliases WHERE LOWER(alias_name) = LOWER($1)
       UNION ALL
       SELECT id FROM users WHERE LOWER(username) = LOWER($1)
       LIMIT 1`,
      [trimmedName]
    );

    if (nameTaken) {
      throw new Error('This name is already taken');
    }

    // Create alias
    const alias = await queryOne<Alias>(
      `INSERT INTO aliases (user_id, alias_name)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, trimmedName]
    );

    if (!alias) {
      throw new Error('Failed to create alias');
    }

    return alias;
  }

  /**
   * Get a user's alias.
   *
   * @param userId - Player ID
   * @returns The user's alias or null
   */
  async getAlias(userId: string): Promise<Alias | null> {
    return queryOne<Alias>(
      'SELECT * FROM aliases WHERE user_id = $1',
      [userId]
    );
  }

  /**
   * Activate alias mode. Territory claims will go under the alias name.
   *
   * @param userId - Player ID
   * @returns Updated alias with active state
   */
  async switchToAlias(userId: string): Promise<Alias> {
    const alias = await queryOne<Alias>(
      'SELECT * FROM aliases WHERE user_id = $1',
      [userId]
    );

    if (!alias) {
      throw new Error('No alias found. Create one first');
    }

    if (alias.is_revealed) {
      throw new Error('Your alias has been revealed and can no longer be used');
    }

    // We use a session marker in the user's settings to track alias mode
    await query(
      `UPDATE users SET settings = settings || '{"alias_active": true}'::jsonb WHERE id = $1`,
      [userId]
    );

    return alias;
  }

  /**
   * Deactivate alias mode. Claims revert to the main identity.
   *
   * @param userId - Player ID
   */
  async switchToMain(userId: string): Promise<void> {
    await query(
      `UPDATE users SET settings = settings || '{"alias_active": false}'::jsonb WHERE id = $1`,
      [userId]
    );
  }

  /**
   * Check if a user is currently operating under their alias.
   *
   * @param userId - Player ID
   * @returns True if alias mode is active
   */
  async isAliasActive(userId: string): Promise<boolean> {
    const user = await queryOne<{ settings: any }>(
      'SELECT settings FROM users WHERE id = $1',
      [userId]
    );

    if (!user) return false;

    const settings = user.settings || {};
    return settings.alias_active === true;
  }

  /**
   * Reveal (unmask) an alias, exposing the player's true identity.
   * Requires a bounty claim or special conditions.
   *
   * @param aliasId - The alias to reveal
   * @param revealerId - Player performing the reveal
   * @returns The revealed alias with the linked user info
   */
  async revealAlias(
    aliasId: string,
    revealerId: string
  ): Promise<Alias & { real_username: string }> {
    const alias = await queryOne<Alias>(
      'SELECT * FROM aliases WHERE id = $1',
      [aliasId]
    );

    if (!alias) {
      throw new Error('Alias not found');
    }

    if (alias.is_revealed) {
      throw new Error('This alias has already been revealed');
    }

    if (alias.user_id === revealerId) {
      throw new Error('Cannot reveal your own alias');
    }

    // Mark alias as revealed
    await query(
      `UPDATE aliases SET is_revealed = TRUE, revealed_by = $1 WHERE id = $2`,
      [revealerId, aliasId]
    );

    // Deactivate alias mode for the owner
    await query(
      `UPDATE users SET settings = settings || '{"alias_active": false}'::jsonb WHERE id = $1`,
      [alias.user_id]
    );

    // Set cooldown before they can create a new alias (7 days)
    await query(
      `UPDATE aliases SET cooldown_until = NOW() + INTERVAL '7 days' WHERE id = $1`,
      [aliasId]
    );

    // Get real username
    const user = await queryOne<{ username: string }>(
      'SELECT username FROM users WHERE id = $1',
      [alias.user_id]
    );

    // Log to feed
    try {
      await query(
        `INSERT INTO feed_events (type, user_id, data)
         VALUES ('alias_revealed', $1, $2)`,
        [revealerId, JSON.stringify({
          alias_id: aliasId,
          alias_name: alias.alias_name,
          real_user_id: alias.user_id,
          real_username: user?.username,
        })]
      );
    } catch (err) {
      console.error('[AliasService] Failed to log alias reveal:', err);
    }

    return {
      ...alias,
      is_revealed: true,
      revealed_by: revealerId,
      real_username: user?.username ?? 'unknown',
    };
  }

  /**
   * Get the display name for a user, accounting for alias mode.
   * Used by other services when displaying territory ownership.
   *
   * @param userId - Player ID
   * @returns The display name (alias or real username)
   */
  async getDisplayName(userId: string): Promise<string> {
    const isAlias = await this.isAliasActive(userId);

    if (isAlias) {
      const alias = await this.getAlias(userId);
      if (alias && !alias.is_revealed) {
        return alias.alias_name;
      }
    }

    const user = await queryOne<{ username: string }>(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    );

    return user?.username ?? 'unknown';
  }
}

// ---- Singleton instance and functional exports ----

const aliasServiceInstance = new AliasService();

export async function createAlias(userId: string, aliasName: string): Promise<Alias> {
  return aliasServiceInstance.createAlias(userId, aliasName);
}

export async function getAlias(userId: string): Promise<Alias | null> {
  return aliasServiceInstance.getAlias(userId);
}

export async function switchToAlias(userId: string): Promise<Alias> {
  return aliasServiceInstance.switchToAlias(userId);
}

export async function switchToMain(userId: string): Promise<void> {
  return aliasServiceInstance.switchToMain(userId);
}

export async function isAliasActive(userId: string): Promise<boolean> {
  return aliasServiceInstance.isAliasActive(userId);
}

export async function revealAlias(
  aliasId: string,
  revealerId: string
): Promise<Alias & { real_username: string }> {
  return aliasServiceInstance.revealAlias(aliasId, revealerId);
}

export async function getDisplayName(userId: string): Promise<string> {
  return aliasServiceInstance.getDisplayName(userId);
}

export const aliasService = aliasServiceInstance;

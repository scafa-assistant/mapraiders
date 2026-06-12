// ============================================================
// Defense Game Engine — Multi-Layer Territory Defense
// Territories can have MULTIPLE defense layers (slot-based).
// Max slots = min(5, floor(area_m2 / 1000) + 1)
// Defense types: mini-games, challenges, quests, echos.
// Attacker must beat ALL active defenses to conquer territory.
// ============================================================

import { query, queryOne, queryMany, transaction } from '../config/database';
import { awardXp } from './progressionEngine';
import { notifyTerritoryAttack } from './notificationService';
import { wsService } from './wsService';
import { turnGameEngine } from './turnGameEngine';
import { BUILDINGS } from '../config/constants';

const GAME_TYPES = [
  'rock_paper_scissors',
  'sprint_race',
  'trivia',
  'photo_challenge',
  'step_challenge',
  'endurance',
  'coin_flip',
  'odd_even',
  'tic_tac_toe',
  'mini_chess',
  'challenge',
  'quest',
  'echo',
] as const;

type GameType = typeof GAME_TYPES[number];

/** Content-based defense types (linked to existing items) */
const CONTENT_DEFENSE_TYPES = ['challenge', 'quest', 'echo'] as const;

/** Cooldown: 10 minutes between failed attempts on the same defense */
const COOLDOWN_MINUTES = 10;

/** XP awarded on successful defense break */
const WIN_XP = 200;

/** Consolation XP for a failed attempt */
const LOSS_XP = 20;

/** Calculate max defense slots for a territory based on area */
function calculateMaxSlots(areaSqM: number): number {
  return Math.min(5, Math.floor(areaSqM / 1000) + 1);
}

class DefenseGameEngine {
  // ---- Public Methods ----

  /**
   * Calculate max slots and used slots for a territory.
   */
  async getSlotInfo(territoryId: string): Promise<{ max_slots: number; used_slots: number; defenses: any[] }> {
    // Get territory area
    const territory = await queryOne<{ area_m2: number }>(
      'SELECT ST_Area(polygon::geography) as area_m2 FROM territories WHERE id = $1',
      [territoryId]
    );
    if (!territory) throw new Error('Territory not found');

    const maxSlots = calculateMaxSlots(territory.area_m2 || 0);

    // Get active defenses
    const defenses = await queryMany(
      `SELECT d.id, d.game_type, d.config, d.slot_index, d.created_at,
              u.username as owner_username
       FROM territory_defenses d
       JOIN users u ON u.id = d.owner_id
       WHERE d.territory_id = $1 AND d.status = 'active'
       ORDER BY d.slot_index ASC`,
      [territoryId]
    );

    return { max_slots: maxSlots, used_slots: defenses.length, defenses };
  }

  /**
   * Add a defense to a territory slot.
   * Multiple defenses allowed up to max_slots.
   * Prevents adding defenses during active attacks (territory locked).
   */
  async setDefense(
    userId: string,
    territoryId: string,
    gameType: string,
    config: any,
    ownerSecret?: string,
    ownerBenchmark?: any
  ): Promise<{ defense_id: string; slot_index: number; created: boolean }> {
    // 1. Validate game type
    if (!GAME_TYPES.includes(gameType as GameType)) {
      throw new Error('Invalid game type');
    }

    // 2. Verify user owns the territory
    const territory = await queryOne<{ id: string; owner_id: string; area_m2: number; attack_status: string | null }>(
      'SELECT id, owner_id, attack_status, ST_Area(polygon::geography) as area_m2 FROM territories WHERE id = $1',
      [territoryId]
    );
    if (!territory) throw new Error('Territory not found');
    if (territory.owner_id !== userId) throw new Error('You do not own this territory');

    // 3. Check if territory is under attack (locked)
    if (territory.attack_status === 'under_attack') {
      throw new Error('Cannot add defenses while territory is under attack');
    }

    // 4. Check slot availability
    const maxSlots = calculateMaxSlots(territory.area_m2 || 0);
    const activeDefenses = await queryMany<{ id: string; slot_index: number }>(
      "SELECT id, slot_index FROM territory_defenses WHERE territory_id = $1 AND status = 'active' ORDER BY slot_index",
      [territoryId]
    );

    if (activeDefenses.length >= maxSlots) {
      throw new Error(`Max ${maxSlots} defense slots for this territory (${Math.round(territory.area_m2)} m²). Remove one first.`);
    }

    // 5. Find next available slot index
    const usedSlots = new Set(activeDefenses.map(d => d.slot_index));
    let slotIndex = 0;
    while (usedSlots.has(slotIndex)) slotIndex++;

    // 6. Create new defense
    const result = await queryOne<{ id: string }>(
      `INSERT INTO territory_defenses (territory_id, owner_id, game_type, config, owner_secret, owner_benchmark, slot_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        territoryId,
        userId,
        gameType,
        JSON.stringify(config),
        ownerSecret || null,
        ownerBenchmark ? JSON.stringify(ownerBenchmark) : null,
        slotIndex,
      ]
    );

    return { defense_id: result!.id, slot_index: slotIndex, created: true };
  }

  /**
   * Get ALL active defenses for a territory (public info only, never returns owner_secret).
   */
  async getDefenses(territoryId: string): Promise<any[]> {
    const defenses = await queryMany(
      `SELECT d.id, d.game_type, d.config, d.owner_benchmark, d.slot_index, d.created_at,
              u.username as owner_username
       FROM territory_defenses d
       JOIN users u ON u.id = d.owner_id
       WHERE d.territory_id = $1 AND d.status = 'active'
       ORDER BY d.slot_index ASC`,
      [territoryId]
    );
    return defenses;
  }

  /**
   * Get single active defense (backwards compatible).
   */
  async getDefense(territoryId: string): Promise<any | null> {
    const defenses = await this.getDefenses(territoryId);
    return defenses.length > 0 ? defenses[0] : null;
  }

  /**
   * Submit a challenge attempt against a specific defense layer.
   * Breaking one layer marks it as 'broken'. Territory only transfers
   * when ALL defenses are broken.
   * Sets attack_status to lock territory during active attack.
   */
  async submitChallenge(
    userId: string,
    defenseId: string,
    challengerData: any
  ): Promise<any> {
    // 1. Get defense
    const defense = await queryOne(
      "SELECT * FROM territory_defenses WHERE id = $1 AND status = 'active'",
      [defenseId]
    );
    if (!defense) throw new Error('Defense not found or expired');

    // 2. Check not challenging own territory
    if (defense.owner_id === userId) throw new Error('Cannot challenge your own defense');

    // 2b. Phase B shield: not a playable mini-game. A fresh shield absorbs the
    // attempt (cooldown), an exhausted one is auto-broken so the attacker can
    // proceed against the rest of the stack.
    if (defense.game_type === 'shield') {
      return this.handleShieldDefense(defense, userId);
    }

    // 3. Lock territory during attack (set attack status and attacker)
    await query(
      "UPDATE territories SET attack_status = 'under_attack', attack_started_at = NOW(), attacker_id = $1 WHERE id = $2 AND attack_status IS NULL",
      [userId, defense.territory_id]
    );

    // 4. Check cooldown (only after losses)
    const lastAttempt = await queryOne<{ created_at: string }>(
      `SELECT created_at FROM defense_attempts
       WHERE defense_id = $1 AND challenger_id = $2 AND result = 'lost'
       ORDER BY created_at DESC LIMIT 1`,
      [defenseId, userId]
    );
    if (lastAttempt) {
      const cooldownEnd = new Date(lastAttempt.created_at).getTime() + COOLDOWN_MINUTES * 60 * 1000;
      if (Date.now() < cooldownEnd) {
        const remainingMin = Math.ceil((cooldownEnd - Date.now()) / 60000);
        throw new Error(`Cooldown active. Try again in ${remainingMin} minutes.`);
      }
    }

    // 5. Content-based defenses: special handling
    if (defense.game_type === 'challenge' || defense.game_type === 'quest' || defense.game_type === 'echo') {
      return this.handleContentDefense(defense, userId, challengerData);
    }

    // 6. Turn-based games: create a game instance
    if (defense.game_type === 'tic_tac_toe' || defense.game_type === 'mini_chess') {
      const game = await turnGameEngine.createGame(
        defense.territory_id,
        defense.owner_id,
        userId,
        defense.game_type,
        defenseId
      );
      return {
        attempt_id: null,
        result: 'game_started',
        defense_game_type: defense.game_type,
        game_id: game.id,
        game: game,
      };
    }

    // 7. Evaluate result (instant games)
    const result = this.evaluateGame(defense, challengerData);

    // 8. Store attempt
    const attempt = await queryOne<{ id: string }>(
      `INSERT INTO defense_attempts (defense_id, challenger_id, challenger_data, result)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [defenseId, userId, JSON.stringify(challengerData), result]
    );

    // 9. Handle outcome
    if (result === 'won') {
      await this.handleLayerBroken(defense, userId, attempt!.id);
    } else if (result === 'lost') {
      await this.handleLoss(defense, userId, attempt!.id);
    }

    return {
      attempt_id: attempt!.id,
      result,
      defense_game_type: defense.game_type,
    };
  }

  /**
   * Remove (expire) a defense. Only the owner can do this.
   */
  async removeDefense(userId: string, defenseId: string): Promise<void> {
    const defense = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM territory_defenses WHERE id = $1',
      [defenseId]
    );
    if (!defense) throw new Error('Defense not found');
    if (defense.owner_id !== userId) throw new Error('Not your defense');
    await query("UPDATE territory_defenses SET status = 'expired' WHERE id = $1", [defenseId]);
  }

  // ---- Shield Defense Handling (Phase B) ----

  /**
   * Handle an attack against a passive shield defense.
   * - Below the daily block quota: absorb the attempt, record the block
   *   timestamp, return SHIELD_BLOCKED. The shield is NOT a playable game and
   *   stays 'active'.
   * - Quota exhausted (blocks within the last 24h ≥ the shield's tier quota):
   *   auto-break this layer so the attacker can continue against the rest.
   *
   * C.3 — blocks-per-day equals the shield_generator building's tier
   * (TIER_EFFECTS.shield_blocks_per_day[tier-1]); with no building row the
   * quota is 1, preserving the legacy single-block behavior. Block timestamps
   * are tracked in config.block_times (ISO strings, pruned to the last 24h).
   *
   * BACKWARD COMPAT: a legacy config with last_blocked_at but no block_times is
   * treated as a single recent block entry. A tier-1 shield therefore behaves
   * exactly as before (quota 1, one block per 24h window).
   */
  private async handleShieldDefense(defense: any, userId: string): Promise<any> {
    const config = typeof defense.config === 'string' ? JSON.parse(defense.config) : (defense.config ?? {});
    const cooldownMs = BUILDINGS.SHIELD_BLOCK_COOLDOWN_HOURS * 60 * 60 * 1000;
    const now = Date.now();
    const windowStart = now - cooldownMs;

    // Resolve the daily block quota from the shield building's tier.
    const shieldRow = await queryOne<{ tier: number }>(
      `SELECT tier FROM buildings
        WHERE territory_id = $1 AND type = 'shield_generator' AND status = 'active'
        ORDER BY tier DESC
        LIMIT 1`,
      [defense.territory_id]
    );
    const quotaTable = BUILDINGS.TIER_EFFECTS.shield_blocks_per_day;
    const tier = shieldRow?.tier ?? 1;
    const quotaIdx = Math.max(0, Math.min(quotaTable.length - 1, tier - 1));
    const allowed = shieldRow ? quotaTable[quotaIdx] : 1;

    // Extract recent (last-24h) block timestamps from a config object,
    // falling back to legacy last_blocked_at as a single entry.
    const recentBlocks = (cfg: any): string[] => {
      let times: string[] = Array.isArray(cfg?.block_times)
        ? cfg.block_times.filter((t: unknown): t is string => typeof t === 'string')
        : [];
      if (times.length === 0 && cfg?.last_blocked_at) {
        times = [new Date(cfg.last_blocked_at).toISOString()];
      }
      return times.filter((t) => {
        const ms = new Date(t).getTime();
        return Number.isFinite(ms) && ms >= windowStart;
      });
    };

    if (recentBlocks(config).length < allowed) {
      // Looks fresh — but two simultaneous attackers must not overwrite each
      // other's block entries (the quota would under-count). Re-read the
      // config under a row lock and re-check before appending.
      const blockedTimes = await transaction(async (c) => {
        const row = await c.query<{ config: any }>(
          `SELECT config FROM territory_defenses
            WHERE id = $1 AND status = 'active'
            FOR UPDATE`,
          [defense.id],
        );
        if (row.rowCount === 0) return null; // broken meanwhile
        const lockedCfg =
          typeof row.rows[0].config === 'string'
            ? JSON.parse(row.rows[0].config)
            : (row.rows[0].config ?? {});
        const recent = recentBlocks(lockedCfg);
        if (recent.length >= allowed) return null; // quota consumed concurrently
        const updatedTimes = [...recent, new Date(now).toISOString()];
        await c.query(
          `UPDATE territory_defenses
              SET config = jsonb_set(
                             jsonb_set(config, '{block_times}', $2::jsonb, true),
                             '{last_blocked_at}', to_jsonb(NOW()::text), true)
            WHERE id = $1`,
          [defense.id, JSON.stringify(updatedTimes)],
        );
        return updatedTimes;
      });

      if (blockedTimes) {
        try {
          wsService.sendToUser(defense.owner_id, 'shield_blocked', {
            territory_id: defense.territory_id,
            challenger_id: userId,
            blocks_used: blockedTimes.length,
            blocks_allowed: allowed,
          });
        } catch { /* non-critical */ }
        return {
          attempt_id: null,
          result: 'blocked',
          defense_game_type: 'shield',
          message: 'SHIELD_BLOCKED',
        };
      }
      // Fall through: the quota was consumed (or the layer broke) while we
      // were checking — treat as exhausted below.
    }

    // Exhausted shield → break this layer (no playable game, no XP).
    // Conditional on status='active' so two simultaneous attackers can't both
    // break the layer and both trigger conquest — only the attacker whose
    // UPDATE wins proceeds to the conquest check.
    const broke = await query(
      "UPDATE territory_defenses SET status = 'broken' WHERE id = $1 AND status = 'active'",
      [defense.id]
    );
    if ((broke.rowCount ?? 0) === 0) {
      // Another attacker broke this layer first; no conquest from this call.
      return {
        attempt_id: null,
        result: 'shield_down',
        defense_game_type: 'shield',
      };
    }

    // If that was the last active defense, conquest follows.
    const remaining = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM territory_defenses WHERE territory_id = $1 AND status = 'active'",
      [defense.territory_id]
    );
    if (parseInt(remaining?.count || '0', 10) === 0) {
      await this.handleFullConquest(defense, userId);
    }

    return {
      attempt_id: null,
      result: 'shield_down',
      defense_game_type: 'shield',
    };
  }

  // ---- Content Defense Handling ----

  /**
   * Handle content-based defenses (challenge, quest, echo).
   * Challenge: must complete the challenge at the location.
   * Quest: must complete the quest.
   * Echo: must listen to the echo and respond.
   */
  private async handleContentDefense(defense: any, userId: string, challengerData: any): Promise<any> {
    const config = typeof defense.config === 'string' ? JSON.parse(defense.config) : defense.config;

    // For content defenses, the challenger must have completed the linked item
    // challengerData should contain { completed: true, item_id: '...' }
    const completed = challengerData?.completed === true;

    const attempt = await queryOne<{ id: string }>(
      `INSERT INTO defense_attempts (defense_id, challenger_id, challenger_data, result)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [defense.id, userId, JSON.stringify(challengerData), completed ? 'won' : 'lost']
    );

    if (completed) {
      await this.handleLayerBroken(defense, userId, attempt!.id);
      return { attempt_id: attempt!.id, result: 'won', defense_game_type: defense.game_type };
    } else {
      await this.handleLoss(defense, userId, attempt!.id);
      return { attempt_id: attempt!.id, result: 'lost', defense_game_type: defense.game_type };
    }
  }

  // ---- Game Evaluation ----

  private evaluateGame(defense: any, challengerData: any): 'won' | 'lost' | 'draw' {
    const config = typeof defense.config === 'string' ? JSON.parse(defense.config) : defense.config;

    switch (defense.game_type) {
      case 'rock_paper_scissors':
        return this.evaluateRPS(defense.owner_secret, challengerData.move);

      case 'sprint_race': {
        const benchmark = typeof defense.owner_benchmark === 'string'
          ? JSON.parse(defense.owner_benchmark)
          : defense.owner_benchmark;
        const ownerTime = benchmark?.time_seconds || 999;
        const challengerTime = challengerData.time_seconds || 999;
        return challengerTime < ownerTime ? 'won' : 'lost';
      }

      case 'trivia': {
        const correctAnswer = (defense.owner_secret || '').toLowerCase().trim();
        const givenAnswer = (challengerData.answer || '').toLowerCase().trim();
        if (givenAnswer === correctAnswer) return 'won';
        if (correctAnswer.includes(givenAnswer) && givenAnswer.length >= 3) return 'won';
        return 'lost';
      }

      case 'photo_challenge':
        return challengerData.photo_url ? 'won' : 'lost';

      case 'step_challenge': {
        const goal = config.steps || 500;
        return (challengerData.steps || 0) >= goal ? 'won' : 'lost';
      }

      case 'endurance': {
        const required = config.duration_seconds || 300;
        return (challengerData.duration_seconds || 0) >= required ? 'won' : 'lost';
      }

      case 'coin_flip':
        return this.evaluateCoinFlip(defense.owner_secret, challengerData.flip_result, config);

      case 'odd_even':
        return this.evaluateOddEven(defense.owner_secret, config, challengerData.fingers);

      default:
        return 'lost';
    }
  }

  private evaluateRPS(ownerMove: string, challengerMove: string): 'won' | 'lost' | 'draw' {
    if (!ownerMove || !challengerMove) return 'lost';
    const o = ownerMove.toLowerCase();
    const c = challengerMove.toLowerCase();
    if (o === c) return 'draw';
    if (
      (c === 'rock' && o === 'scissors') ||
      (c === 'scissors' && o === 'paper') ||
      (c === 'paper' && o === 'rock')
    ) {
      return 'won';
    }
    return 'lost';
  }

  private evaluateCoinFlip(defenderBet: string, flipResult: string, config: any): 'won' | 'lost' | 'draw' {
    if (!defenderBet || !flipResult) return 'lost';
    const normBet = (defenderBet.toLowerCase().trim() === 'kopf' || defenderBet.toLowerCase().trim() === 'heads') ? 'heads' : 'tails';
    const normFlip = (flipResult.toLowerCase().trim() === 'kopf' || flipResult.toLowerCase().trim() === 'heads') ? 'heads' : 'tails';
    if (normBet === normFlip) return 'lost';
    return 'won';
  }

  private evaluateOddEven(defenderSecret: string, config: any, challengerFingers: number): 'won' | 'lost' | 'draw' {
    if (!defenderSecret || challengerFingers === undefined) return 'lost';
    const parts = defenderSecret.split(':');
    const defenderPick = parts[0];
    const defenderFingers = parseInt(parts[1], 10) || 1;
    const cFingers = Math.max(1, Math.min(5, Math.round(challengerFingers)));
    const sum = defenderFingers + cFingers;
    const sumParity = sum % 2 === 0 ? 'even' : 'odd';
    const normPick = (defenderPick === 'gerade' || defenderPick === 'even') ? 'even' : 'odd';
    if (normPick === sumParity) return 'lost';
    return 'won';
  }

  // ---- Outcome Handlers ----

  /**
   * Handle a broken defense layer.
   * If ALL layers are now broken → transfer territory.
   * If layers remain → just mark this one as broken.
   */
  private async handleLayerBroken(defense: any, challengerId: string, attemptId: string): Promise<void> {
    // Mark this defense layer as broken
    await query(
      "UPDATE territory_defenses SET status = 'broken' WHERE id = $1",
      [defense.id]
    );

    // Award XP for breaking a layer
    await awardXp(challengerId, WIN_XP, 'defense_win');
    await query('UPDATE defense_attempts SET xp_awarded = $1 WHERE id = $2', [WIN_XP, attemptId]);

    // Check if any active defenses remain
    const remaining = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM territory_defenses WHERE territory_id = $1 AND status = 'active'",
      [defense.territory_id]
    );

    const remainingCount = parseInt(remaining?.count || '0', 10);

    if (remainingCount === 0) {
      // ALL defenses broken → transfer territory!
      await this.handleFullConquest(defense, challengerId);
    } else {
      // Notify: layer broken but more remain
      try {
        wsService.sendToUser(defense.owner_id, 'defense_layer_broken', {
          territory_id: defense.territory_id,
          challenger_id: challengerId,
          game_type: defense.game_type,
          remaining_defenses: remainingCount,
        });
        wsService.sendToUser(challengerId, 'defense_layer_won', {
          territory_id: defense.territory_id,
          game_type: defense.game_type,
          remaining_defenses: remainingCount,
        });
      } catch { /* non-critical */ }
    }
  }

  /**
   * Handle full territory conquest (all defenses broken).
   * Clears the attack lock and transfers ownership.
   */
  private async handleFullConquest(defense: any, challengerId: string): Promise<void> {
    // Transfer territory ownership and clear attack lock
    await query(
      'UPDATE territories SET owner_id = $1, last_defended = NOW(), attack_status = NULL, attack_started_at = NULL, attacker_id = NULL WHERE id = $2',
      [challengerId, defense.territory_id]
    );

    // Expire ALL defenses on this territory (broken + any remaining)
    await query(
      "UPDATE territory_defenses SET status = 'expired' WHERE territory_id = $1 AND status IN ('active', 'broken')",
      [defense.territory_id]
    );

    // Notify previous owner
    try {
      await notifyTerritoryAttack(defense.owner_id, defense.territory_id, challengerId);
    } catch { /* non-critical */ }

    // WebSocket broadcasts
    try {
      wsService.sendToUser(defense.owner_id, 'defense_lost', {
        territory_id: defense.territory_id,
        challenger_id: challengerId,
      });
      wsService.sendToUser(challengerId, 'defense_won', {
        territory_id: defense.territory_id,
      });
    } catch { /* non-critical */ }

    // Feed event
    try {
      await query(
        `INSERT INTO feed_events (type, user_id, data) VALUES ('defense_win', $1, $2)`,
        [
          challengerId,
          JSON.stringify({
            territory_id: defense.territory_id,
            game_type: defense.game_type,
          }),
        ]
      );
    } catch { /* non-critical */ }
  }

  /**
   * Handle a failed defense attempt: consolation XP, notify owner.
   */
  private async handleLoss(defense: any, challengerId: string, attemptId: string): Promise<void> {
    await awardXp(challengerId, LOSS_XP, 'defense_attempt');
    await query('UPDATE defense_attempts SET xp_awarded = $1 WHERE id = $2', [LOSS_XP, attemptId]);

    try {
      wsService.sendToUser(defense.owner_id, 'defense_held', {
        territory_id: defense.territory_id,
        challenger_id: challengerId,
      });
    } catch { /* non-critical */ }
  }
}

export const defenseGameEngine = new DefenseGameEngine();

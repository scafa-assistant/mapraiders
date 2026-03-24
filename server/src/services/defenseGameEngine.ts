// ============================================================
// Defense Game Engine
// Territory defense mini-games: owners set a game challenge,
// attackers must beat it to take over the territory.
// Supports: rock_paper_scissors, sprint_race, trivia,
//           photo_challenge, step_challenge, endurance
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { awardXp } from './progressionEngine';
import { notifyTerritoryAttack } from './notificationService';
import { wsService } from './wsService';
import { turnGameEngine } from './turnGameEngine';

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
] as const;

type GameType = typeof GAME_TYPES[number];

/** Cooldown: 10 minutes between failed attempts on the same defense */
const COOLDOWN_MINUTES = 10;

/** XP awarded on successful defense break */
const WIN_XP = 200;

/** Consolation XP for a failed attempt */
const LOSS_XP = 20;

class DefenseGameEngine {
  // ---- Public Methods ----

  /**
   * Set or update a defense mini-game on an owned territory.
   * Only one active defense per territory (upsert).
   */
  async setDefense(
    userId: string,
    territoryId: string,
    gameType: string,
    config: any,
    ownerSecret?: string,
    ownerBenchmark?: any
  ): Promise<{ defense_id: string; updated?: boolean; created?: boolean }> {
    // 1. Validate game type
    if (!GAME_TYPES.includes(gameType as GameType)) {
      throw new Error('Invalid game type');
    }

    // 2. Verify user owns the territory
    const territory = await queryOne<{ id: string; owner_id: string }>(
      'SELECT id, owner_id FROM territories WHERE id = $1',
      [territoryId]
    );
    if (!territory) throw new Error('Territory not found');
    if (territory.owner_id !== userId) throw new Error('You do not own this territory');

    // 3. Check if defense already exists (only 1 active per territory)
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM territory_defenses WHERE territory_id = $1 AND status = 'active'",
      [territoryId]
    );

    if (existing) {
      // Update existing defense
      const result = await queryOne<{ id: string }>(
        `UPDATE territory_defenses
         SET game_type = $1, config = $2, owner_secret = $3, owner_benchmark = $4
         WHERE id = $5 RETURNING id`,
        [
          gameType,
          JSON.stringify(config),
          ownerSecret || null,
          ownerBenchmark ? JSON.stringify(ownerBenchmark) : null,
          existing.id,
        ]
      );
      return { defense_id: result!.id, updated: true };
    }

    // 4. Create new defense
    const result = await queryOne<{ id: string }>(
      `INSERT INTO territory_defenses (territory_id, owner_id, game_type, config, owner_secret, owner_benchmark)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        territoryId,
        userId,
        gameType,
        JSON.stringify(config),
        ownerSecret || null,
        ownerBenchmark ? JSON.stringify(ownerBenchmark) : null,
      ]
    );

    return { defense_id: result!.id, created: true };
  }

  /**
   * Get the active defense for a territory (public info only, never returns owner_secret).
   */
  async getDefense(territoryId: string): Promise<any | null> {
    const defense = await queryOne(
      `SELECT d.id, d.game_type, d.config, d.owner_benchmark, d.created_at,
              u.username as owner_username
       FROM territory_defenses d
       JOIN users u ON u.id = d.owner_id
       WHERE d.territory_id = $1 AND d.status = 'active'`,
      [territoryId]
    );
    // NEVER return owner_secret!
    return defense;
  }

  /**
   * Submit a challenge attempt against a territory defense.
   * Evaluates the game, stores the attempt, and handles outcomes.
   */
  async submitChallenge(
    userId: string,
    defenseId: string,
    challengerData: any
  ): Promise<{ attempt_id: string; result: string; defense_game_type: string }> {
    // 1. Get defense
    const defense = await queryOne(
      "SELECT * FROM territory_defenses WHERE id = $1 AND status = 'active'",
      [defenseId]
    );
    if (!defense) throw new Error('Defense not found or expired');

    // 2. Check not challenging own territory
    if (defense.owner_id === userId) throw new Error('Cannot challenge your own defense');

    // 3. Check cooldown (only after losses)
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

    // 4. Turn-based games: create a game instance instead of instant evaluation
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
      } as any;
    }

    // 5. Evaluate result (instant games)
    const result = this.evaluateGame(defense, challengerData);

    // 6. Store attempt
    const attempt = await queryOne<{ id: string }>(
      `INSERT INTO defense_attempts (defense_id, challenger_id, challenger_data, result)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [defenseId, userId, JSON.stringify(challengerData), result]
    );

    // 7. Handle outcome
    if (result === 'won') {
      await this.handleWin(defense, userId, attempt!.id);
    } else if (result === 'lost') {
      await this.handleLoss(defense, userId, attempt!.id);
    }
    // draw: no territory change, immediate retry allowed

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

  // ---- Game Evaluation ----

  /**
   * Evaluate the outcome of a defense challenge based on game type.
   */
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
        // Exact match
        if (givenAnswer === correctAnswer) return 'won';
        // Fuzzy match: contains or starts with (minimum 3 chars)
        if (correctAnswer.includes(givenAnswer) && givenAnswer.length >= 3) return 'won';
        return 'lost';
      }

      case 'photo_challenge':
        // Auto-accept for now (AI evaluation stub)
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

  /**
   * Evaluate Rock-Paper-Scissors from challenger's perspective.
   */
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

  /**
   * Evaluate Coin Flip (Münzwurf).
   * Defender bets heads/tails. Challenger flips and reports result.
   * If defender's bet matches flip → challenger loses (defense holds).
   */
  private evaluateCoinFlip(
    defenderBet: string,
    flipResult: string,
    config: any
  ): 'won' | 'lost' | 'draw' {
    if (!defenderBet || !flipResult) return 'lost';
    const bet = defenderBet.toLowerCase().trim();
    const flip = flipResult.toLowerCase().trim();

    // Normalize: 'kopf'/'heads' → 'heads', 'zahl'/'tails' → 'tails'
    const normBet = (bet === 'kopf' || bet === 'heads') ? 'heads' : 'tails';
    const normFlip = (flip === 'kopf' || flip === 'heads') ? 'heads' : 'tails';

    // Defender guessed correctly → defense holds → challenger lost
    if (normBet === normFlip) return 'lost';
    return 'won';
  }

  /**
   * Evaluate Odd/Even (Gerade oder Ungerade — Finger Poker).
   * Defender picks odd/even and their finger count (stored as secret).
   * Challenger shows their fingers. Sum determines winner.
   * If sum parity matches defender's pick → defense holds → challenger lost.
   */
  private evaluateOddEven(
    defenderSecret: string,
    config: any,
    challengerFingers: number
  ): 'won' | 'lost' | 'draw' {
    if (!defenderSecret || challengerFingers === undefined) return 'lost';

    // Secret format: "odd:3" or "even:2"
    const parts = defenderSecret.split(':');
    const defenderPick = parts[0]; // 'odd' or 'even'
    const defenderFingers = parseInt(parts[1], 10) || 1;

    const cFingers = Math.max(1, Math.min(5, Math.round(challengerFingers)));
    const sum = defenderFingers + cFingers;
    const sumParity = sum % 2 === 0 ? 'even' : 'odd';

    // Normalize: 'gerade'→'even', 'ungerade'→'odd'
    const normPick = (defenderPick === 'gerade' || defenderPick === 'even') ? 'even' : 'odd';

    // Defender guessed correctly → defense holds → challenger lost
    if (normPick === sumParity) return 'lost';
    return 'won';
  }

  // ---- Outcome Handlers ----

  /**
   * Handle a successful defense break: transfer territory, award XP, notify.
   */
  private async handleWin(defense: any, challengerId: string, attemptId: string): Promise<void> {
    // Transfer territory ownership
    await query(
      'UPDATE territories SET owner_id = $1, last_defended = NOW() WHERE id = $2',
      [challengerId, defense.territory_id]
    );

    // Expire the defense (new owner can set their own)
    await query(
      "UPDATE territory_defenses SET status = 'expired' WHERE id = $1",
      [defense.id]
    );

    // Award XP to challenger
    await awardXp(challengerId, WIN_XP, 'defense_win');
    await query('UPDATE defense_attempts SET xp_awarded = $1 WHERE id = $2', [WIN_XP, attemptId]);

    // Notify previous owner
    try {
      await notifyTerritoryAttack(defense.owner_id, defense.territory_id, challengerId);
    } catch {
      // Non-critical
    }

    // WebSocket broadcasts
    try {
      wsService.sendToUser(defense.owner_id, 'defense_lost', {
        territory_id: defense.territory_id,
        challenger_id: challengerId,
      });
      wsService.sendToUser(challengerId, 'defense_won', {
        territory_id: defense.territory_id,
      });
    } catch {
      // Non-critical
    }

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
    } catch {
      // Non-critical
    }
  }

  /**
   * Handle a failed defense attempt: consolation XP, notify owner.
   */
  private async handleLoss(defense: any, challengerId: string, attemptId: string): Promise<void> {
    // Consolation XP
    await awardXp(challengerId, LOSS_XP, 'defense_attempt');
    await query('UPDATE defense_attempts SET xp_awarded = $1 WHERE id = $2', [LOSS_XP, attemptId]);

    // Notify owner that their defense held
    try {
      wsService.sendToUser(defense.owner_id, 'defense_held', {
        territory_id: defense.territory_id,
        challenger_id: challengerId,
      });
    } catch {
      // Non-critical
    }
  }
}

export const defenseGameEngine = new DefenseGameEngine();

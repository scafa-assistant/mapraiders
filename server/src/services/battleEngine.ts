// ============================================================
// Battle Engine (Phase C.2 — Dice Assault)
// Resolves an attacker's march arrival against a territory's garrison via a
// dice-driven round loop, then records the battle and (maybe) drops a die to
// the winner.
//
// Transaction discipline (NON-NEGOTIABLE): resolveAssault runs ENTIRELY inside
// the caller's transaction client. It opens NO transaction of its own and
// issues ZERO pool queries — every read/write goes through the passed `client`.
// Any pool-dependent value (the live dice-drop probability from the feature
// flag config) is read by the CALLER before the tx and handed in via
// opts.diceDropP. This keeps the whole assault — casualties, dice mint, battle
// row — atomic: a transient failure rolls everything back together and no
// player unit is ever lost or duplicated.
//
// Randomness: crypto.randomInt for ALL dice (E5 — server-only randomness).
// ============================================================

import { PoolClient } from 'pg';
import { randomInt } from 'crypto';
import { COMBAT, CombatDomain } from '../config/constants';

/** Domain error carrying a stable machine-readable `code`. */
export class BattleError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'BattleError';
    this.code = code;
  }
}

// ---- Internal types ---------------------------------------------------------

interface SideUnit {
  id: string;
  definitionId: string;
  domain: CombatDomain;
}

interface EquippedDie {
  kind: string;
  sides?: number;
  effect?: string;
}

type SideKey = 'atk' | 'def';

interface RoundSideLog {
  rolls: number[];
  bonus: number;
  modifier: number;
  total: number;
  unit: string;
}

interface EffectLog {
  side: 'atk' | 'def';
  effect: string;
  cancelled: number;
}

interface RoundLog {
  round: number;
  atk: RoundSideLog;
  def: RoundSideLog;
  effects: EffectLog[];
  casualty: { side: 'atk' | 'def'; definition_id: string } | null;
}

export interface BattleLog {
  attacker_units_start: number;
  defender_units_start: number;
  walkover: boolean;
  rounds: RoundLog[];
  winner_side: 'attacker' | 'defender';
  survivors: { attacker: string[]; defender: string[] };
  loot: { dice_drop: string | null };
}

export interface ResolveAssaultOpts {
  attackerId: string;
  defenderId: string;
  territoryId: string;
  attackerInstanceIds: string[];
  /** Live winner dice-drop probability, read by the CALLER before the tx. */
  diceDropP: number;
}

export interface ResolveAssaultResult {
  battleId: string;
  winnerSide: 'attacker' | 'defender';
  survivorsAttacker: string[];
  log: BattleLog;
}

const VALID_DOMAINS: ReadonlySet<string> = new Set<string>([
  'ground', 'armor', 'air', 'aa', 'naval',
]);

/** Coerce an arbitrary stats.domain into a known CombatDomain ('ground' default). */
function toDomain(raw: unknown): CombatDomain {
  return (typeof raw === 'string' && VALID_DOMAINS.has(raw) ? raw : 'ground') as CombatDomain;
}

/** Parse a JSONB stats payload (already an object from pg, but be defensive). */
function asStats(raw: any): Record<string, any> {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

class BattleEngine {
  /**
   * Resolve an assault INSIDE the caller's tx client. No own transaction, no
   * pool queries. Loads both forces (FOR UPDATE), runs the dice loop, applies
   * casualties, drops a die to the winner, writes the battle row, returns the
   * result for the caller to act on (auto-return survivors, WS).
   */
  async resolveAssault(
    client: PoolClient,
    opts: ResolveAssaultOpts,
  ): Promise<ResolveAssaultResult> {
    const { attackerId, defenderId, territoryId, attackerInstanceIds } = opts;

    // ---- 1. Load attacker units (skip missing/non-deployed quietly) ----
    const attackerForce: SideUnit[] =
      attackerInstanceIds.length === 0
        ? []
        : (
            await client.query<{ id: string; definition_id: string; stats: any }>(
              `SELECT i.id, i.definition_id, d.stats
                 FROM item_instances i
                 JOIN item_definitions d ON d.id = i.definition_id
                WHERE i.id = ANY($1) AND i.status = 'deployed'
                FOR UPDATE OF i`,
              [attackerInstanceIds],
            )
          ).rows.map((r) => ({
            id: r.id,
            definitionId: r.definition_id,
            domain: toDomain(asStats(r.stats).domain),
          }));

    // ---- 2. Load defender garrison (FOR UPDATE) ----
    const defenderForce: SideUnit[] = (
      await client.query<{ id: string; definition_id: string; stats: any }>(
        `SELECT i.id, i.definition_id, d.stats
           FROM troop_deployments td
           JOIN item_instances i ON i.id = td.instance_id
           JOIN item_definitions d ON d.id = i.definition_id
          WHERE td.territory_id = $1
          FOR UPDATE OF i`,
        [territoryId],
      )
    ).rows.map((r) => ({
      id: r.id,
      definitionId: r.definition_id,
      domain: toDomain(asStats(r.stats).domain),
    }));

    // ---- 3. Each side's EQUIPPED die ----
    const attackerDie = await this.loadEquippedDie(client, attackerId);
    const defenderDie = await this.loadEquippedDie(client, defenderId);

    const attackerStart = attackerForce.length;
    const defenderStart = defenderForce.length;

    // ---- 4. Undefended territory -> instant walkover, NO dice drop ----
    if (defenderStart === 0) {
      const log: BattleLog = {
        attacker_units_start: attackerStart,
        defender_units_start: 0,
        walkover: true,
        rounds: [],
        winner_side: 'attacker',
        survivors: { attacker: attackerForce.map((u) => u.id), defender: [] },
        loot: { dice_drop: null },
      };
      const battleId = await this.insertBattle(client, {
        attackerId,
        defenderId,
        territoryId,
        winnerSide: 'attacker',
        log,
      });
      return {
        battleId,
        winnerSide: 'attacker',
        survivorsAttacker: attackerForce.map((u) => u.id),
        log,
      };
    }

    // ---- 5. Round loop ----
    const atkAlive = [...attackerForce];
    const defAlive = [...defenderForce];
    const rounds: RoundLog[] = [];

    // 'cancel_highest' is a once-per-BATTLE effect (per side that holds it).
    const effectConsumed: Record<SideKey, boolean> = { atk: false, def: false };

    let roundNo = 0;
    while (
      atkAlive.length > 0 &&
      defAlive.length > 0 &&
      roundNo < COMBAT.MAX_ROUNDS
    ) {
      roundNo++;

      const atkLead = atkAlive[0];
      const defLead = defAlive[0];

      // Domain modifier: +1 when this side's lead domain beats the other's.
      const atkMod = this.domainBonus(atkLead.domain, defLead.domain);
      const defMod = this.domainBonus(defLead.domain, atkLead.domain);

      // Base rolls: 2×d6 + optional bonus die.
      const atkRolls = [randomInt(1, 7), randomInt(1, 7)];
      const defRolls = [randomInt(1, 7), randomInt(1, 7)];
      const atkBonus = this.bonusRoll(attackerDie);
      const defBonus = this.bonusRoll(defenderDie);

      // Per-side dice pools used for effect resolution + totals.
      const atkDice = [...atkRolls];
      if (atkBonus > 0) atkDice.push(atkBonus);
      const defDice = [...defRolls];
      if (defBonus > 0) defDice.push(defBonus);

      const effects: EffectLog[] = [];

      const totalOf = (dice: number[], mod: number): number =>
        dice.reduce((s, v) => s + v, 0) + mod;

      let atkTotal = totalOf(atkDice, atkMod);
      let defTotal = totalOf(defDice, defMod);

      // Generic effect resolver: 'cancel_highest' — once per battle, when the
      // OPPOSING side's total would beat ours, cancel their single highest die
      // this round and recompute. Unknown effect names are ignored.
      // Attacker's effect fires when defender is currently winning; vice versa.
      if (this.hasEffect(attackerDie, 'cancel_highest') && !effectConsumed.atk && defTotal > atkTotal) {
        const removed = this.removeHighest(defDice);
        if (removed > 0) {
          effectConsumed.atk = true;
          effects.push({ side: 'atk', effect: 'cancel_highest', cancelled: removed });
          defTotal = totalOf(defDice, defMod);
        }
      }
      if (this.hasEffect(defenderDie, 'cancel_highest') && !effectConsumed.def && atkTotal > defTotal) {
        const removed = this.removeHighest(atkDice);
        if (removed > 0) {
          effectConsumed.def = true;
          effects.push({ side: 'def', effect: 'cancel_highest', cancelled: removed });
          atkTotal = totalOf(atkDice, atkMod);
        }
      }

      // Resolve casualty. Tie -> no casualty (still counts as one round).
      let casualty: { side: 'atk' | 'def'; definition_id: string } | null = null;
      if (atkTotal > defTotal) {
        const fallen = defAlive.shift()!;
        casualty = { side: 'def', definition_id: fallen.definitionId };
        await this.destroyDefenderUnit(client, fallen.id);
      } else if (defTotal > atkTotal) {
        const fallen = atkAlive.shift()!;
        casualty = { side: 'atk', definition_id: fallen.definitionId };
        await this.destroyAttackerUnit(client, fallen.id);
      }

      rounds.push({
        round: roundNo,
        atk: {
          rolls: atkRolls,
          bonus: atkBonus,
          modifier: atkMod,
          total: atkTotal,
          unit: atkLead.definitionId,
        },
        def: {
          rolls: defRolls,
          bonus: defBonus,
          modifier: defMod,
          total: defTotal,
          unit: defLead.definitionId,
        },
        effects,
        casualty,
      });
    }

    // ---- Decide winner ----
    // A side with 0 alive loses. If both still alive (MAX_ROUNDS hit), the side
    // with more survivors wins; tie -> defender wins (defender's advantage).
    let winnerSide: 'attacker' | 'defender';
    if (atkAlive.length > 0 && defAlive.length === 0) {
      winnerSide = 'attacker';
    } else if (defAlive.length > 0 && atkAlive.length === 0) {
      winnerSide = 'defender';
    } else if (atkAlive.length > defAlive.length) {
      winnerSide = 'attacker';
    } else {
      winnerSide = 'defender';
    }

    // ---- 6. Winner dice drop ----
    let diceDrop: string | null = null;
    const winnerId = winnerSide === 'attacker' ? attackerId : defenderId;
    const loserStart = winnerSide === 'attacker' ? defenderStart : attackerStart;
    if (this.rollChance(opts.diceDropP)) {
      const def = this.pickDrop(loserStart);
      if (def) {
        await this.mintDie(client, def, winnerId);
        diceDrop = def;
      }
    }

    const log: BattleLog = {
      attacker_units_start: attackerStart,
      defender_units_start: defenderStart,
      walkover: false,
      rounds,
      winner_side: winnerSide,
      survivors: {
        attacker: atkAlive.map((u) => u.id),
        defender: defAlive.map((u) => u.id),
      },
      loot: { dice_drop: diceDrop },
    };

    const battleId = await this.insertBattle(client, {
      attackerId,
      defenderId,
      territoryId,
      winnerSide,
      log,
    });

    return {
      battleId,
      winnerSide,
      survivorsAttacker: atkAlive.map((u) => u.id),
      log,
    };
  }

  // ---- Helpers ------------------------------------------------------------

  /** +1 when `mine` beats `theirs` per DOMAIN_MATRIX, else 0. */
  private domainBonus(mine: CombatDomain, theirs: CombatDomain): number {
    const beats = COMBAT.DOMAIN_MATRIX[mine];
    return beats && beats[theirs] ? 1 : 0;
  }

  /** Roll the side's bonus die (0 if no bonus_die equipped). */
  private bonusRoll(die: EquippedDie | null): number {
    if (die && die.kind === 'bonus_die' && typeof die.sides === 'number' && die.sides >= 1) {
      return randomInt(1, die.sides + 1);
    }
    return 0;
  }

  private hasEffect(die: EquippedDie | null, effect: string): boolean {
    return !!die && die.kind === 'effect' && die.effect === effect;
  }

  /** Remove and return the single highest value from a dice array (0 if empty). */
  private removeHighest(dice: number[]): number {
    if (dice.length === 0) return 0;
    let maxIdx = 0;
    for (let i = 1; i < dice.length; i++) {
      if (dice[i] > dice[maxIdx]) maxIdx = i;
    }
    const [removed] = dice.splice(maxIdx, 1);
    return removed;
  }

  /** crypto-backed probability check (p in 0..1). */
  private rollChance(p: number): boolean {
    if (!(p > 0)) return false;
    if (p >= 1) return true;
    // 4-decimal resolution is ample for drop chances.
    return randomInt(0, 10_000) < Math.round(p * 10_000);
  }

  /** Pick a drop definition by weighted choice for the loser's starting units. */
  private pickDrop(loserStartUnits: number): string | null {
    // Find the first bracket whose minUnits the loser meets (rows are ordered
    // high->low). DROP_RARITY always has a minUnits:0 catch-all.
    let weights: Record<string, number> | null = null;
    for (const bracket of COMBAT.DROP_RARITY) {
      if (loserStartUnits >= bracket.minUnits) {
        weights = bracket.weights as Record<string, number>;
        break;
      }
    }
    if (!weights) return null;

    const entries = Object.entries(weights).filter(([, w]) => w > 0);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    if (total <= 0) return null;

    let roll = randomInt(0, total);
    for (const [def, w] of entries) {
      if (roll < w) return def;
      roll -= w;
    }
    return entries[entries.length - 1][0];
  }

  /** Load a side's single equipped die (null if none). */
  private async loadEquippedDie(
    client: PoolClient,
    userId: string,
  ): Promise<EquippedDie | null> {
    const res = await client.query<{ stats: any }>(
      `SELECT d.stats
         FROM item_instances i
         JOIN item_definitions d ON d.id = i.definition_id
        WHERE i.owner_id = $1
          AND d.category = 'dice'
          AND i.status = 'inventory'
          AND (i.state->>'equipped')::boolean IS TRUE
        LIMIT 1`,
      [userId],
    );
    if (res.rowCount === 0) return null;
    const stats = asStats(res.rows[0].stats);
    return {
      kind: typeof stats.kind === 'string' ? stats.kind : '',
      sides: typeof stats.sides === 'number' ? stats.sides : undefined,
      effect: typeof stats.effect === 'string' ? stats.effect : undefined,
    };
  }

  /** Destroy an attacker unit (status only — march return excludes destroyed). */
  private async destroyAttackerUnit(client: PoolClient, instanceId: string): Promise<void> {
    await client.query(
      `UPDATE item_instances SET status = 'destroyed', updated_at = NOW() WHERE id = $1`,
      [instanceId],
    );
  }

  /** Destroy a defender unit: flip status AND remove its garrison row. */
  private async destroyDefenderUnit(client: PoolClient, instanceId: string): Promise<void> {
    await client.query(
      `UPDATE item_instances SET status = 'destroyed', updated_at = NOW() WHERE id = $1`,
      [instanceId],
    );
    await client.query(`DELETE FROM troop_deployments WHERE instance_id = $1`, [instanceId]);
  }

  /**
   * Mint a dropped die directly (client-bound). itemService.mintItem also
   * opens an item_events row but we need the SAME client and a 'battle_drop'
   * acquired_via; a direct INSERT keeps the assault atomic and pool-free.
   */
  private async mintDie(
    client: PoolClient,
    definitionId: string,
    ownerId: string,
  ): Promise<void> {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO item_instances
         (definition_id, owner_id, status, acquired_via, state, created_at, updated_at)
       VALUES ($1, $2, 'inventory', 'battle_drop', '{}'::jsonb, NOW(), NOW())
       RETURNING id`,
      [definitionId, ownerId],
    );
    await client.query(
      `INSERT INTO item_events (instance_id, event, from_user, to_user, context)
       VALUES ($1, 'minted', NULL, $2, $3)`,
      [inserted.rows[0].id, ownerId, JSON.stringify({ source: 'battle_drop' })],
    );
  }

  /** Insert the battle row and return its id. */
  private async insertBattle(
    client: PoolClient,
    args: {
      attackerId: string;
      defenderId: string;
      territoryId: string;
      winnerSide: 'attacker' | 'defender';
      log: BattleLog;
    },
  ): Promise<string> {
    const winnerUser = args.winnerSide === 'attacker' ? args.attackerId : args.defenderId;
    const res = await client.query<{ id: string }>(
      `INSERT INTO battles
         (attacker_id, defender_id, territory_id, type, log, winner, loot)
       VALUES ($1, $2, $3, 'assault', $4, $5, $6)
       RETURNING id`,
      [
        args.attackerId,
        args.defenderId,
        args.territoryId,
        JSON.stringify(args.log),
        winnerUser,
        JSON.stringify(args.log.loot),
      ],
    );
    return res.rows[0].id;
  }
}

export const battleEngine = new BattleEngine();
export default battleEngine;

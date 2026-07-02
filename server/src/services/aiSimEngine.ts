// ============================================================
// AI Sim Engine (Phase D — deterministic sector simulator)
//
// The cheap, deterministic half of the Hybrid AI. It NEVER calls an LLM.
// One row per res-6 sector in ai_region_state drives a small phase machine
// (dormant -> triggered -> invasion). The simulator:
//   * dormant   : quietly holds a deterministic slice of the sector's active
//                 cells and accrues a little strength. NEVER attacks.
//   * triggered : executes pending directives (issued by aiGeneralService —
//                 LLM or fallback), incl. the real PROBE_ATTACK that mints
//                 units and inserts a troop_movements row resolved by the
//                 EXISTING troopEngine.resolveOne + battleEngine path.
//   * invasion  : same directive execution plus deterministic invasion
//                 resolution (humans repel it -> dormant; or it persists 7+
//                 days -> the AI razes undefended held cells into `ruins`).
//
// Architecture: every AI unit/movement is owned by the seeded SYSTEM USER
// (AI.USER_ID). That keeps troopEngine/battleEngine/itemService unchanged —
// the AI is just "another player" to them, identified by its fixed id and the
// config.ai_faction flag on its movements.
//
// Transaction discipline (house rule): we NEVER query the pool while holding a
// tx client. All H3 math (parent/disk/pathBetween) is pure CPU. Each mutating
// step runs in its own small transaction; per-sector work is wrapped in
// try/catch so one bad sector never blocks a tick. Randomness uses
// crypto.randomInt (none is strictly needed here — picks are deterministic by
// sort order — but the dependency is available where a tiebreak is wanted).
//
// Deviation from the design doc documented in the Phase D migration: AI units
// are owner_id = AI.USER_ID, not NULL + faction marker.
// ============================================================

import { PoolClient } from 'pg';
import { transaction, query, queryMany } from '../config/database';
import { AI, COMBAT } from '../config/constants';
import { RES_SPAWN, RES_SECTOR, cellForPoint, parent, disk, pathBetween } from './h3Service';
import { wsService } from './wsService';
import { sendPushToUser } from './pushService';

// ---- Types ----------------------------------------------------------

export interface AiRegionState {
  h3_sector: string;
  phase: 'dormant' | 'triggered' | 'invasion';
  held_cells: string[];
  strength: number;
  resources: string; // BIGINT comes back as string from pg
  last_sim_at: Date | null;
  last_llm_at: Date | null;
  metrics: Record<string, any>;
}

const STATE_COLS = `h3_sector, phase, held_cells, strength, resources,
  last_sim_at, last_llm_at, metrics`;

// ---- Helpers --------------------------------------------------------

/**
 * The set of res-8 cells in this sector that have seen player activity in the
 * last ACTIVE_DAYS, derived from place_history points mapped via h3 parent().
 * Pool read — call OUTSIDE any held tx.
 */
async function activeCellsInSector(h3Sector: string): Promise<string[]> {
  const rows = await queryMany<{ lat: number; lng: number }>(
    `SELECT ST_Y(location) AS lat, ST_X(location) AS lng
       FROM place_history
      WHERE created_at > NOW() - ($1 || ' days')::interval
      LIMIT 5000`,
    [String(AI.TRIGGER.ACTIVE_DAYS)],
  );

  const cells = new Set<string>();
  for (const r of rows) {
    try {
      const cell = cellForPoint(r.lat, r.lng, RES_SPAWN);
      if (parent(cell, RES_SECTOR) === h3Sector) cells.add(cell);
    } catch {
      /* skip malformed coordinate */
    }
  }
  // Deterministic ordering so "take first N" is stable across requests.
  return [...cells].sort();
}

class AiSimEngine {
  // ---- ensureSector -------------------------------------------------

  /** Upsert the ai_region_state row for a sector (dormant by default). */
  async ensureSector(h3Sector: string): Promise<AiRegionState> {
    const res = await transaction((c) =>
      c.query<AiRegionState>(
        `INSERT INTO ai_region_state (h3_sector)
         VALUES ($1)
         ON CONFLICT (h3_sector) DO UPDATE SET h3_sector = EXCLUDED.h3_sector
         RETURNING ${STATE_COLS}`,
        [h3Sector],
      ),
    );
    return res.rows[0];
  }

  // ---- simulateSector ----------------------------------------------

  /**
   * Run one deterministic simulation step for a sector. Cooldown-guarded via
   * last_sim_at (SIM_COOLDOWN_MIN). Returns true if a step actually ran.
   *
   * The whole step is per-sector try/catch'd by the caller (the cron); inside,
   * each mutating write goes through a small transaction. Pool reads (active
   * cells, directive load, battle counts) happen BEFORE the writes that depend
   * on them — never interleaved with a held tx client.
   */
  async simulateSector(h3Sector: string): Promise<boolean> {
    const state = await this.ensureSector(h3Sector);

    // Cooldown: skip if simulated within SIM_COOLDOWN_MIN.
    if (state.last_sim_at) {
      const since = Date.now() - new Date(state.last_sim_at).getTime();
      if (since < AI.SIM_COOLDOWN_MIN * 60_000) return false;
    }

    if (state.phase === 'dormant') {
      await this.simulateDormant(h3Sector, state);
    } else {
      await this.simulateActive(h3Sector, state);
    }

    // Stamp last_sim_at (own tx — phase/held/strength were written above).
    await transaction((c) =>
      c.query(`UPDATE ai_region_state SET last_sim_at = NOW() WHERE h3_sector = $1`, [h3Sector]),
    );
    return true;
  }

  // ---- dormant ------------------------------------------------------

  /**
   * Dormant behavior: hold ~DORMANT_HOLD_PCT of the sector's active cells
   * (deterministic — sort cells, take the first N) and slowly accrue strength
   * (+1/sim, capped at 10). NEVER attacks.
   */
  private async simulateDormant(h3Sector: string, state: AiRegionState): Promise<void> {
    const active = await activeCellsInSector(h3Sector); // pool read, pre-tx
    const holdN = Math.floor(active.length * AI.DORMANT_HOLD_PCT);
    const held = active.slice(0, Math.max(0, holdN));

    const newStrength = Math.min(10, state.strength + 1);

    await transaction((c) =>
      c.query(
        `UPDATE ai_region_state
            SET held_cells = $2, strength = $3
          WHERE h3_sector = $1`,
        [h3Sector, held, newStrength],
      ),
    );
  }

  // ---- triggered / invasion ----------------------------------------

  /**
   * Active behavior (triggered or invasion): execute the oldest pending
   * directives, then (for invasion) resolve the invasion outcome.
   */
  private async simulateActive(h3Sector: string, state: AiRegionState): Promise<void> {
    // 1) Drain battle losses since last sim into a counter (pool read).
    const battlesLost = await this.countAiBattlesLostSince(h3Sector, state.last_sim_at);

    // 2) Expire stale orders first (own tx): a directive issued while the
    // sector was not being simulated must not fire days later. Stamping
    // executed_at keeps the pending query cheap and the log auditable.
    await transaction((c) =>
      c.query(
        `UPDATE ai_directives SET executed_at = NOW()
          WHERE h3_sector = $1 AND executed_at IS NULL
            AND created_at < NOW() - ($2 || ' hours')::interval`,
        [h3Sector, String(AI.DIRECTIVE_TTL_HOURS)],
      ),
    );

    // 3) Load pending directives oldest-first (pool read).
    const pending = await queryMany<{ id: string; directive: any }>(
      `SELECT id, directive
         FROM ai_directives
        WHERE h3_sector = $1 AND executed_at IS NULL
        ORDER BY created_at ASC
        LIMIT 10`,
      [h3Sector],
    );

    // Work on a local copy of mutable state and persist once at the end of the
    // directive loop (each directive is small + deterministic).
    let held = [...state.held_cells];
    let strength = state.strength;
    let resources = BigInt(state.resources || '0');
    let phase: AiRegionState['phase'] = state.phase;

    // Strength decays -2 per battle the AI lost in this sector since last sim.
    strength = Math.max(0, strength - 2 * battlesLost);

    for (const row of pending) {
      const d = row.directive ?? {};
      const command: string = typeof d.command === 'string' ? d.command : 'HOLD';
      const intensity: number =
        typeof d.intensity === 'number' ? Math.max(0, Math.min(1, d.intensity)) : 0.3;

      switch (command) {
        case 'HOLD':
          break;
        case 'EXPAND': {
          // Add up to 2 adjacent cells (deterministic: ring of held, sorted).
          // Set membership keeps this O(n); MAX_HELD_CELLS caps unbounded
          // growth in long-running triggered sectors (payload + scan size).
          const heldSet = new Set(held);
          const candidates = new Set<string>();
          for (const cell of held) {
            for (const nb of disk(cell, 1)) {
              if (!heldSet.has(nb)) candidates.add(nb);
            }
          }
          const add = [...candidates].sort().slice(0, 2);
          held = [...held, ...add].slice(0, AI.MAX_HELD_CELLS);
          break;
        }
        case 'FORTIFY':
          strength = Math.min(AI.MAX_STRENGTH, strength + 2);
          break;
        case 'HARVEST_AND_MOVE':
          resources += BigInt(Math.max(0, strength));
          // Shift 1 held cell (drop the first, deterministic).
          if (held.length > 0) held = held.slice(1);
          break;
        case 'RETREAT': {
          // Drop 30% of held cells (deterministic: keep the first 70%).
          const keep = Math.floor(held.length * 0.7);
          held = held.slice(0, keep);
          if (held.length === 0) phase = 'dormant';
          break;
        }
        case 'INVASION_TRIGGER':
          if (strength >= AI.INVASION_STRENGTH_THRESHOLD) phase = 'invasion';
          break;
        case 'PROBE_ATTACK': {
          // The real one: mint units + insert a troop_movements row.
          // target_cells from the directive are honored as PREFERRED targets
          // after strict validation (string, valid res-8 cell, inside this
          // sector) — the LLM steers, the simulator stays authoritative.
          const preferred: string[] = Array.isArray(d.target_cells)
            ? d.target_cells.filter(
                (x: unknown): x is string =>
                  typeof x === 'string' && this.isCellInSector(x, h3Sector),
              )
            : [];
          await this.executeProbeAttack(h3Sector, held, intensity, preferred);
          break;
        }
        default:
          // Unknown command — ignore (forward-compat).
          break;
      }

      // Mark this directive executed (own tx per directive keeps it idempotent
      // even if a later directive throws).
      await transaction((c) =>
        c.query(`UPDATE ai_directives SET executed_at = NOW() WHERE id = $1`, [row.id]),
      );
    }

    // Persist the post-directive state.
    await transaction((c) =>
      c.query(
        `UPDATE ai_region_state
            SET held_cells = $2, strength = $3, resources = $4, phase = $5
          WHERE h3_sector = $1`,
        [h3Sector, held, strength, resources.toString(), phase],
      ),
    );

    // Invasion resolution runs against the freshly-persisted state.
    if (phase === 'invasion') {
      await this.resolveInvasion(h3Sector, held, strength, state.metrics);
    }
  }

  // ---- PROBE_ATTACK -------------------------------------------------

  /**
   * Pick a player territory intersecting (or adjacent to) the sector, prefer
   * the lowest garrison count, mint N AI units, and insert an 'attack'
   * troop_movements row. The EXISTING troop_arrival_tick + resolveOne +
   * battleEngine resolve it. We DO NOT care about shields here (the AI probes
   * blindly — fog is symmetric).
   */
  /** True when `cell` is a valid H3 index whose res-6 parent is the sector. */
  private isCellInSector(cell: string, h3Sector: string): boolean {
    try {
      return parent(cell, RES_SECTOR) === h3Sector;
    } catch {
      return false;
    }
  }

  private async executeProbeAttack(
    h3Sector: string,
    held: string[],
    intensity: number,
    preferredCells: string[] = [],
  ): Promise<void> {
    if (held.length === 0) return;

    const n = Math.min(AI.MAX_UNITS_PER_ATTACK, AI.PROBE_INTENSITY_UNITS(intensity));

    // Cells we consider "in or adjacent to" the sector: every held cell + its
    // ring-1 disk. A player territory is a target if any of its h3_cells lands
    // in this set. Pool read (pre-tx).
    const reach = new Set<string>();
    for (const cell of held) {
      for (const nb of disk(cell, 1)) reach.add(nb);
    }
    const reachCells = [...reach];

    // Directive-preferred cells first (already sector-validated by the
    // caller): a territory on a preferred cell wins; otherwise fall back to
    // the lowest-garrison territory in reach.
    let territory: { id: string; h3_cells: string[] | null; owner_id: string | null } | null = null;
    if (preferredCells.length > 0) {
      const pref = await query<{ id: string; h3_cells: string[] | null; owner_id: string | null }>(
        `SELECT t.id, t.h3_cells, t.owner_id
           FROM territories t
          WHERE t.owner_id IS NOT NULL
            AND t.owner_id <> $2
            AND t.h3_cells && $1::text[]
          ORDER BY t.id ASC
          LIMIT 1`,
        [preferredCells, AI.USER_ID],
      );
      if (pref.rowCount && pref.rowCount > 0) territory = pref.rows[0];
    }

    if (!territory) {
      const target = await query<{
        id: string;
        h3_cells: string[] | null;
        owner_id: string | null;
        garrison: string;
      }>(
        `SELECT t.id, t.h3_cells, t.owner_id,
                COUNT(td.id)::bigint AS garrison
           FROM territories t
           LEFT JOIN troop_deployments td ON td.territory_id = t.id
          WHERE t.owner_id IS NOT NULL
            AND t.owner_id <> $2
            AND t.h3_cells && $1::text[]
          GROUP BY t.id, t.h3_cells, t.owner_id
          ORDER BY garrison ASC, t.id ASC
          LIMIT 1`,
        [reachCells, AI.USER_ID],
      );
      if (target.rowCount === 0) return; // nothing to probe in reach
      territory = target.rows[0];
    }
    const targetCells = territory.h3_cells ?? [];
    if (targetCells.length === 0) return;
    const targetCell = targetCells[0];

    // Nearest held cell as the launch point (deterministic: first by sort).
    const fromCell = [...held].sort()[0];

    // Build the path (pure CPU). Fallback to a direct [from,to] on PATH_FAILED.
    let path: string[];
    try {
      path = pathBetween(fromCell, targetCell);
      if (path.length === 0) path = [fromCell, targetCell];
    } catch {
      path = [fromCell, targetCell];
    }
    const travelMin = path.length * COMBAT.MARCH_MIN_PER_CELL;

    // Mint N units to the AI user + insert the movement, all in one tx so a
    // failure never leaves orphan units. Units are minted directly (same shape
    // as battleEngine.mintDie) with acquired_via 'system' — bypassing the
    // ItemAcquiredVia TS union exactly like the battle-drop mint does.
    await transaction(async (c: PoolClient) => {
      const instanceIds: string[] = [];
      for (let i = 0; i < n; i++) {
        const inserted = await c.query<{ id: string }>(
          `INSERT INTO item_instances
             (definition_id, owner_id, status, acquired_via, state, created_at, updated_at)
           VALUES ($1, $2, 'deployed', 'system', '{}'::jsonb, NOW(), NOW())
           RETURNING id`,
          [AI.UNIT_DEFINITION, AI.USER_ID],
        );
        instanceIds.push(inserted.rows[0].id);
        await c.query(
          `INSERT INTO item_events (instance_id, event, from_user, to_user, context)
           VALUES ($1, 'minted', NULL, $2, $3)`,
          [inserted.rows[0].id, AI.USER_ID, JSON.stringify({ source: 'ai_probe' })],
        );
      }

      await c.query(
        `INSERT INTO troop_movements
           (owner_id, instance_ids, from_cell, to_cell, path, purpose, config,
            departs_at, arrives_at, status)
         VALUES ($1, $2, $3, $4, $5, 'attack', $6,
                 NOW(), NOW() + ($7 || ' minutes')::interval, 'marching')`,
        [
          AI.USER_ID,
          instanceIds,
          fromCell,
          targetCell,
          path,
          JSON.stringify({ target_territory_id: territory.id, ai_faction: true }),
          String(travelMin),
        ],
      );
    });

    // Post-tx: the defender gets the SAME pre-warning a human attack triggers
    // at dispatch (parity — AI attacks must not "teleport in" unannounced).
    if (territory.owner_id) {
      try {
        wsService.sendToUser(territory.owner_id, 'under_attack', {
          territory_id: territory.id,
          eta: new Date(Date.now() + travelMin * 60_000).toISOString(),
          units: n,
          ai_faction: true,
        });
      } catch {
        /* non-critical */
      }
    }
  }

  // ---- Invasion resolution -----------------------------------------

  /**
   * Deterministic invasion outcome:
   *   * strength <= 0  -> humans repelled the AI: phase -> dormant,
   *     held_cells cleared, sector players notified ("repelled").
   *   * invasion persisted INVASION_PERSIST_DAYS (7+) -> AI wins: every held
   *     cell with NO active player territory becomes a `ruins` row; held reset;
   *     phase -> dormant. (The ruin_cache spawn comes later via the overgrowth
   *     cron, not here.)
   * metrics.invasion_started_at tracks the clock; set on first invasion sim.
   */
  private async resolveInvasion(
    h3Sector: string,
    held: string[],
    strength: number,
    metrics: Record<string, any>,
  ): Promise<void> {
    // Humans repelled it.
    if (strength <= 0) {
      await transaction((c) =>
        c.query(
          `UPDATE ai_region_state
              SET phase = 'dormant', held_cells = '{}',
                  metrics = metrics - 'invasion_started_at'
            WHERE h3_sector = $1`,
          [h3Sector],
        ),
      );
      await this.notifySectorPlayers(
        h3Sector,
        'ai_invasion',
        { sector: h3Sector, result: 'repelled' },
        'Invasion abgewehrt — MapRaiders',
        'Die Hyperboreer wurden aus eurem Sektor vertrieben.',
      );
      // NOTE (out of scope): a repair/defense discount for the defenders could
      // be granted here. Left as a follow-up.
      return;
    }

    // Clock: record the start of the invasion on first resolution.
    const startedRaw = metrics?.invasion_started_at;
    if (!startedRaw) {
      await transaction((c) =>
        c.query(
          `UPDATE ai_region_state
              SET metrics = jsonb_set(metrics, '{invasion_started_at}', to_jsonb(NOW()::text))
            WHERE h3_sector = $1`,
          [h3Sector],
        ),
      );
      return;
    }

    const startedMs = new Date(startedRaw).getTime();
    const ageDays = (Date.now() - startedMs) / 86_400_000;
    const PERSIST_DAYS = 7;
    if (ageDays < PERSIST_DAYS) return; // still raging

    // AI wins: raze every held cell that has NO active player territory.
    // Pool read of which held cells are "occupied" by a player territory.
    let occupied = new Set<string>();
    if (held.length > 0) {
      const occ = await query<{ cell: string }>(
        `SELECT DISTINCT unnest(t.h3_cells) AS cell
           FROM territories t
          WHERE t.owner_id IS NOT NULL
            AND t.h3_cells && $1::text[]`,
        [held],
      );
      occupied = new Set(occ.rows.map((r) => r.cell));
    }
    const toRaze = held.filter((cell) => !occupied.has(cell));

    await transaction(async (c) => {
      for (const cell of toRaze) {
        await c.query(
          `INSERT INTO ruins (h3_cell, h3_sector, overgrowth)
           VALUES ($1, $2, 0)
           ON CONFLICT (h3_cell) DO NOTHING`,
          [cell, h3Sector],
        );
      }
      await c.query(
        `UPDATE ai_region_state
            SET phase = 'dormant', held_cells = '{}',
                metrics = metrics - 'invasion_started_at'
          WHERE h3_sector = $1`,
        [h3Sector],
      );
    });

    await this.notifySectorPlayers(
      h3Sector,
      'ai_invasion',
      { sector: h3Sector, result: 'razed', ruins: toRaze.length },
      'Sektor verwüstet — MapRaiders',
      'Die Hyperboreer haben Teile eures Sektors in Ruinen gelegt.',
    );
  }

  // ---- Shared: count AI battle losses ------------------------------

  /**
   * Count battles in this sector where the AI attacked since `since` and did
   * NOT win. "In this sector" = the battle's territory has a cell whose res-6
   * parent equals h3Sector. h3 parent() is pure CPU, so we pull the candidate
   * battles' territory cells and filter in JS (no DB-side h3 function exists).
   * Pool read — used pre-tx.
   */
  private async countAiBattlesLostSince(
    h3Sector: string,
    since: Date | null,
  ): Promise<number> {
    const rows = await queryMany<{ h3_cells: string[] | null }>(
      `SELECT t.h3_cells
         FROM battles b
         JOIN territories t ON t.id = b.territory_id
        WHERE b.attacker_id = $1
          AND b.created_at > COALESCE($2::timestamptz, NOW() - INTERVAL '1 day')
          AND (b.winner IS NULL OR b.winner <> $1)`,
      [AI.USER_ID, since ? since.toISOString() : null],
    );
    let cnt = 0;
    for (const r of rows) {
      const cells = r.h3_cells ?? [];
      if (cells.some((cell) => safeParent(cell) === h3Sector)) cnt++;
    }
    return cnt;
  }

  // ---- Shared: notify sector players -------------------------------

  /**
   * WS + push every player with a territory whose cells fall in the sector.
   * Sector match is done in JS via the cell -> res-6 parent (no DB-side h3
   * function). Capped at 50 users. Failures are swallowed per-user.
   */
  private async notifySectorPlayers(
    h3Sector: string,
    wsEvent: string,
    wsData: Record<string, any>,
    pushTitle: string,
    pushBody: string,
  ): Promise<void> {
    let owners: string[] = [];
    try {
      const owned = await query<{ owner_id: string; h3_cells: string[] | null }>(
        `SELECT t.owner_id, t.h3_cells
           FROM territories t
          WHERE t.owner_id IS NOT NULL AND t.owner_id <> $1 AND t.h3_cells IS NOT NULL
          LIMIT 2000`,
        [AI.USER_ID],
      );
      const set = new Set<string>();
      for (const r of owned.rows) {
        const cells = r.h3_cells ?? [];
        if (cells.some((cell) => safeParent(cell) === h3Sector)) set.add(r.owner_id);
        if (set.size >= 50) break;
      }
      owners = [...set];
    } catch {
      owners = [];
    }

    for (const uid of owners) {
      try {
        wsService.sendToUser(uid, wsEvent, wsData);
      } catch {
        /* non-critical */
      }
      try {
        await sendPushToUser(uid, pushTitle, pushBody, { type: wsEvent, sector: h3Sector });
      } catch {
        /* non-critical */
      }
    }
  }
}

/** res-8/9 cell -> res-6 parent, swallowing pentagon/invalid errors. */
function safeParent(cell: string): string | null {
  try {
    return parent(cell, RES_SECTOR);
  } catch {
    return null;
  }
}

export const aiSimEngine = new AiSimEngine();
export default aiSimEngine;

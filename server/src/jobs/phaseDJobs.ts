// ============================================================
// Phase D Cron Jobs — Hybrid AI General
//
//   ai_trigger_tick    (hourly)  — compute sector metrics for player-active
//                                  sectors, flip dormant→triggered when the
//                                  thresholds are met, and run the cheap
//                                  cooldown-guarded deterministic sim on every
//                                  active sector.
//   ai_general_tick    (6-hourly)— for triggered/invasion sectors whose LLM
//                                  cooldown has elapsed, ask the LLM general
//                                  (or fallback) for fresh directives.
//   ruins_overgrowth   (nightly) — overgrow ruins; ripe ruins become hackable
//                                  'ruin_cache' pve spawns.
//
// ALL THREE are gated on the `ai_general` feature flag: while it is off they
// no-op (but still recordCronRun, matching the Phase B/C pattern, so
// /api/health/crons always sees a fresh "last success"). Registered in
// decayCron.ts.
// ============================================================

import { PoolClient } from 'pg';
import { query, queryMany, transaction } from '../config/database';
import { featureService } from '../services/featureService';
import { AI } from '../config/constants';
import { RES_SECTOR, RES_SPAWN, cellForPoint, parent, centerOf } from '../services/h3Service';
import { aiSimEngine } from '../services/aiSimEngine';
import { aiGeneralService } from '../services/aiGeneralService';
import { wsService } from '../services/wsService';
import { getContext } from '../services/osmContextService';

async function aiFlagEnabled(): Promise<boolean> {
  try {
    const flags = await featureService.getAllFlags();
    return flags.some((f) => f.key === 'ai_general' && f.enabled);
  } catch {
    return false;
  }
}

async function aiFlagConfig(): Promise<Record<string, any>> {
  try {
    const flags = await featureService.getAllFlags();
    const f = flags.find((x) => x.key === 'ai_general');
    return (f?.config ?? {}) as Record<string, any>;
  } catch {
    return {};
  }
}

/** res-8/9 cell → res-6 parent, swallowing pentagon/invalid errors. */
function safeParent(cell: string): string | null {
  try {
    return parent(cell, RES_SECTOR);
  } catch {
    return null;
  }
}

// ============================================================
// ai_trigger_tick
// ============================================================

/**
 * Derive player-active res-6 sectors from place_history (last ACTIVE_DAYS),
 * cap at 50. For each: ensure the state row, compute metrics, flip
 * dormant→triggered when thresholds are met, then run the (cooldown-guarded)
 * deterministic sim. Returns the number of sectors processed.
 */
export async function runAiTriggerTick(): Promise<number> {
  if (!(await aiFlagEnabled())) return 0;

  const cfg = await aiFlagConfig();
  const th = (cfg.thresholds ?? {}) as Record<string, any>;
  const minPlayers =
    typeof th.min_active_players === 'number'
      ? th.min_active_players
      : AI.TRIGGER.MIN_ACTIVE_PLAYERS;
  const minTierSum =
    typeof th.min_building_tier_sum === 'number'
      ? th.min_building_tier_sum
      : AI.TRIGGER.MIN_BUILDING_TIER_SUM;

  // ---- Derive active sectors from place_history (pool read) ----
  const ph = await queryMany<{ uid: string | null; lat: number; lng: number }>(
    `SELECT user_id AS uid, ST_Y(location) AS lat, ST_X(location) AS lng
       FROM place_history
      WHERE created_at > NOW() - ($1 || ' days')::interval
      LIMIT 5000`,
    [String(AI.TRIGGER.ACTIVE_DAYS)],
  );

  // sector -> set of active user ids
  const sectorPlayers = new Map<string, Set<string>>();
  for (const r of ph) {
    try {
      const cell = cellForPoint(r.lat, r.lng, RES_SPAWN);
      const sector = parent(cell, RES_SECTOR);
      let set = sectorPlayers.get(sector);
      if (!set) {
        if (sectorPlayers.size >= 50) continue;
        set = new Set<string>();
        sectorPlayers.set(sector, set);
      }
      if (r.uid) set.add(r.uid);
    } catch {
      /* skip malformed coordinate */
    }
  }

  // Active-phase sectors simulate ALWAYS, even with no recent player activity
  // in the window — otherwise a triggered sector freezes the moment players
  // stop walking there: the general keeps issuing directives (ai_general_tick
  // reads ai_region_state directly) but nothing ever executes them, and the
  // world only moves where a player has recently been. (Found 2026-07-02:
  // triggered sector unsimulated for 20 days with 97 pending directives.)
  const activePhase = await queryMany<{ h3_sector: string }>(
    `SELECT h3_sector FROM ai_region_state WHERE phase IN ('triggered', 'invasion') LIMIT 50`,
  );
  for (const row of activePhase) {
    if (!sectorPlayers.has(row.h3_sector)) sectorPlayers.set(row.h3_sector, new Set());
  }

  // Preload owned territories once for tier-sum metric (JS parent filter).
  const ownedTerr = await queryMany<{ id: string; owner_id: string; h3_cells: string[] | null }>(
    `SELECT id, owner_id, h3_cells FROM territories
      WHERE owner_id IS NOT NULL AND owner_id <> $1 AND h3_cells IS NOT NULL
      LIMIT 5000`,
    [AI.USER_ID],
  );

  let processed = 0;
  for (const [sector, players] of sectorPlayers) {
    try {
      const state = await aiSimEngine.ensureSector(sector);

      // ---- Metrics ----
      const nActive = players.size;
      const terrIds: string[] = [];
      for (const t of ownedTerr) {
        const cells = t.h3_cells ?? [];
        if (cells.some((c) => safeParent(c) === sector)) terrIds.push(t.id);
      }
      let tierSum = 0;
      if (terrIds.length > 0) {
        const b = await query<{ tier_sum: string | null }>(
          `SELECT COALESCE(SUM(tier),0)::bigint AS tier_sum
             FROM buildings WHERE territory_id = ANY($1) AND status = 'active'`,
          [terrIds],
        );
        tierSum = parseInt(b.rows[0]?.tier_sum ?? '0', 10);
      }

      // ---- Trigger: dormant → triggered ----
      if (state.phase === 'dormant' && nActive >= minPlayers && tierSum >= minTierSum) {
        await transaction((c) =>
          c.query(
            `UPDATE ai_region_state
                SET phase = 'triggered',
                    metrics = metrics || jsonb_build_object(
                      'triggered_at', NOW()::text,
                      'trigger_players', $2::int,
                      'trigger_tier_sum', $3::int,
                      'push_pending', true
                    )
              WHERE h3_sector = $1`,
            [sector, nActive, tierSum],
          ),
        );
        // Notify sector players that the faction has stirred (WS only; the
        // richer story push comes from the LLM general).
        for (const uid of players) {
          try {
            wsService.sendToUser(uid, 'ai_triggered', { sector });
          } catch {
            /* non-critical */
          }
        }
      }

      // ---- Cheap, cooldown-guarded deterministic sim ----
      await aiSimEngine.simulateSector(sector);
      processed++;
    } catch (err: any) {
      console.error(`[PhaseD] ai_trigger_tick sector ${sector} failed:`, err?.message ?? err);
    }
  }

  if (processed > 0) {
    console.log(`[PhaseD] ai_trigger_tick: ${processed} sectors processed`);
  }
  return processed;
}

// ============================================================
// ai_general_tick
// ============================================================

/**
 * For sectors in phase triggered|invasion whose last_llm_at is older than
 * LLM_CALL_INTERVAL_HOURS (or null), run the LLM general (per-sector try/catch).
 * Returns the number of sectors for which a general ran.
 */
export async function runAiGeneralTick(): Promise<number> {
  if (!(await aiFlagEnabled())) return 0;

  const due = await queryMany<{ h3_sector: string }>(
    `SELECT h3_sector
       FROM ai_region_state
      WHERE phase IN ('triggered', 'invasion')
        AND (last_llm_at IS NULL
             OR last_llm_at < NOW() - ($1 || ' hours')::interval)
      ORDER BY last_llm_at ASC NULLS FIRST
      LIMIT 50`,
    [String(AI.LLM_CALL_INTERVAL_HOURS)],
  );

  let ran = 0;
  for (const row of due) {
    try {
      await aiGeneralService.runGeneralForSector(row.h3_sector);
      ran++;
    } catch (err: any) {
      console.error(
        `[PhaseD] ai_general_tick sector ${row.h3_sector} failed:`,
        err?.message ?? err,
      );
    }
  }

  if (ran > 0) {
    console.log(`[PhaseD] ai_general_tick: ${ran} sectors ran a general`);
  }
  return ran;
}

// ============================================================
// ruins_overgrowth
// ============================================================

/**
 * Nightly: overgrow every ruin by RUIN_OVERGROWTH_PER_NIGHT. Ruins that reach
 * RUIN_NEST_THRESHOLD and have no active 'ruin_cache' spawn in their cell spawn
 * one (npc_type 'ruin_cache', biome from osm or 'urban', level 2, fixed loot,
 * 72h TTL) and reset their overgrowth to 0. The EXISTING hackEngine reads loot
 * off the spawn row, so these are immediately hackable. Returns the number of
 * ruin_cache spawns created.
 */
export async function runRuinsOvergrowth(): Promise<number> {
  if (!(await aiFlagEnabled())) return 0;

  // 1. Bump overgrowth on all ruins.
  await query(`UPDATE ruins SET overgrowth = overgrowth + $1`, [AI.RUIN_OVERGROWTH_PER_NIGHT]);

  // 2. Ripe ruins (overgrowth >= threshold) — process one spawn each.
  const ripe = await queryMany<{ h3_cell: string; h3_sector: string }>(
    `SELECT h3_cell, h3_sector FROM ruins WHERE overgrowth >= $1 LIMIT 200`,
    [AI.RUIN_NEST_THRESHOLD],
  );

  let created = 0;
  for (const ruin of ripe) {
    try {
      // Resolve a biome for the cell (pool read — pre-tx).
      let biome = 'urban';
      try {
        const ctx = await getContext(ruin.h3_cell);
        biome = ctx.biome || 'urban';
      } catch {
        /* default urban */
      }

      const spawned = await spawnRuinCache(ruin.h3_cell, biome);
      if (spawned) created++;
    } catch (err: any) {
      console.error(`[PhaseD] ruins_overgrowth cell ${ruin.h3_cell} failed:`, err?.message ?? err);
    }
  }

  if (created > 0) {
    console.log(`[PhaseD] ruins_overgrowth: ${created} ruin_cache spawns created`);
  }
  return created;
}

/**
 * Insert a 'ruin_cache' pve_spawn at the ruin cell (if none active there) and
 * reset the ruin's overgrowth to 0. Loot is fixed {tech:8,intel:4}; TTL 72h.
 * Location = the cell centre (pve_spawns.location is NOT NULL). Returns true if
 * a spawn was created.
 */
async function spawnRuinCache(h3Cell: string, biome: string): Promise<boolean> {
  const center = centerOf(h3Cell);
  return transaction(async (c: PoolClient) => {
    // Skip if an active ruin_cache already stands in this cell.
    const existing = await c.query(
      `SELECT 1 FROM pve_spawns
        WHERE h3_cell = $1 AND npc_type = 'ruin_cache'
          AND status = 'active' AND expires_at > NOW()
        LIMIT 1`,
      [h3Cell],
    );
    if ((existing.rowCount ?? 0) > 0) {
      // Still reset overgrowth so it can ripen again later.
      await c.query(`UPDATE ruins SET overgrowth = 0 WHERE h3_cell = $1`, [h3Cell]);
      return false;
    }

    const loot = { resources: { tech: 8, intel: 4 }, items: [] as unknown[] };
    await c.query(
      `INSERT INTO pve_spawns
         (h3_cell, location, npc_type, level, biome, status, loot, expires_at)
       VALUES
         ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), 'ruin_cache', 2, $4, 'active', $5,
          NOW() + INTERVAL '72 hours')`,
      [h3Cell, center.longitude, center.latitude, biome, JSON.stringify(loot)],
    );
    await c.query(`UPDATE ruins SET overgrowth = 0 WHERE h3_cell = $1`, [h3Cell]);
    return true;
  });
}

export const phaseDJobs = {
  runAiTriggerTick,
  runAiGeneralTick,
  runRuinsOvergrowth,
};

export default phaseDJobs;

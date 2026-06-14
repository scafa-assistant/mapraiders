// ============================================================
// AI General Service (Phase D — the LLM half of the Hybrid AI)
//
// The expensive, infrequent half. For a triggered/invasion sector it builds a
// compact German prompt from AGGREGATES ONLY (counts/sums — never player or
// clan names, never any user-authored text → prompt-injection safe), asks
// Claude Haiku for 1..3 high-level directives + an optional flavour story,
// validates the JSON against a strict zod schema, and writes a directive row
// the deterministic aiSimEngine later executes.
//
// Robustness ladder (per design):
//   1. PROVIDER CASCADE (AI.LLM_PROVIDER_CASCADE, overridable live via the
//      ai_general flag's config.llm_cascade). Each entry {provider,model} is
//      tried IN ORDER: unconfigured providers (no env key) are skipped; for a
//      configured one we check budget, call it, and zod-validate. On a parse/
//      call failure we do ONE retry with a correction line on the SAME provider,
//      then move to the NEXT cascade entry. First valid JSON wins.
//   2. All providers unconfigured/exhausted/failing OR daily budget cap reached
//      → fallbackGeneral(): a deterministic FSM produces the directive instead.
// Either way a row lands in ai_directives (source 'llm' | 'fallback'); on the
// LLM path raw_response is prefixed with `[provider model]` for auditability.
//
// The optional `story` becomes a sanitised push to sector players. The
// sanitiser strips URLs/markup and runs the slot text through the existing
// moderationService.checkText before it can ever reach a device.
//
// Transaction discipline: this service only does small independent writes
// (directive row, last_llm_at stamp) — never a pool query while holding a tx.
// ============================================================

import { z } from 'zod';
import { query, transaction } from '../config/database';
import redis from '../config/redis';
import { AI } from '../config/constants';
import { RES_SECTOR, parent, cellForPoint, RES_SPAWN } from './h3Service';
import { featureService } from '../services/featureService';
import { moderationService } from './moderationService';
import { sendPushToUser } from './pushService';
import { buildProvider } from './llmProviders';
import type { AiRegionState } from './aiSimEngine';

// ---- zod schema (EXACTLY per design) --------------------------------

const AiDirective = z.object({
  directives: z
    .array(
      z.object({
        command: z.enum([
          'HOLD',
          'EXPAND',
          'HARVEST_AND_MOVE',
          'PROBE_ATTACK',
          'INVASION_TRIGGER',
          'RETREAT',
          'FORTIFY',
        ]),
        target_cells: z.array(z.string()).max(10).optional(),
        intensity: z.number().min(0).max(1),
      }),
    )
    .max(3),
  story: z
    .object({
      template_id: z.enum(['radio_intercept', 'warning', 'taunt', 'retreat_note']),
      slots: z.record(z.string().max(60)),
    })
    .optional(),
});

type AiDirectivePayload = z.infer<typeof AiDirective>;

// ---- Story templates (EN strings inline; i18n later) ----------------

const STORY_TEMPLATES: Record<string, (slots: Record<string, string>) => string> = {
  radio_intercept: (s) =>
    `📡 Intercepted signal near ${s.area ?? 'your sector'}: "${s.line ?? '...'}"`,
  warning: (s) => `⚠️ Warning from the deep: "${s.line ?? 'They are coming.'}"`,
  taunt: (s) => `🗣️ A taunt echoes across ${s.area ?? 'the grid'}: "${s.line ?? '...'}"`,
  retreat_note: (s) => `📜 A scrawled note left behind: "${s.line ?? 'We will return.'}"`,
};

// ---- Slot sanitiser -------------------------------------------------

/**
 * Sanitise an LLM-provided slot value before it can reach a push. Strips
 * URLs/markup/handles, keeps only letters/numbers/basic punctuation, caps at
 * 60 chars. Returns '' if nothing safe remains. The caller additionally runs
 * the full rendered line through moderationService.checkText.
 */
function sanitizeSlot(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let v = raw;
  // Reject anything that looks like a URL/handle/markup/host outright.
  if (/[@<>]|https?:|www\.|\.[a-z]{2,}(\/|$)/i.test(v)) {
    // Strip the offending tokens rather than dropping the whole slot.
    v = v.replace(/https?:\S+/gi, ' ').replace(/www\.\S+/gi, ' ').replace(/[@<>]/g, ' ');
  }
  // Keep letters (any script), numbers, spaces and a small punctuation set.
  v = v.replace(/[^\p{L}\p{N} ,!?'-]/gu, ' ');
  v = v.replace(/\s+/g, ' ').trim();
  return v.slice(0, 60);
}

// Tiny extra blocklist on top of moderationService (defence in depth).
const SLOT_BLOCKLIST = ['http', 'script', 'select ', 'drop table'];

// ---- Flag config helpers --------------------------------------------

async function aiFlagConfig(): Promise<Record<string, any>> {
  try {
    const flags = await featureService.getAllFlags();
    const f = flags.find((x) => x.key === 'ai_general');
    return (f?.config ?? {}) as Record<string, any>;
  } catch {
    return {};
  }
}

// ---- Budget cap (Redis daily counter) -------------------------------

/** Returns true if today's LLM call budget is exhausted. */
async function budgetExhausted(maxPerDay: number): Promise<boolean> {
  try {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const n = parseInt((await redis.get(`ai:llm:calls:${day}`)) ?? '0', 10);
    return n >= maxPerDay;
  } catch {
    // Redis down → fail CLOSED: the budget counter is the only cost ceiling,
    // and the fallback FSM keeps the AI alive without spending a cent.
    return true;
  }
}

async function incrBudget(): Promise<void> {
  try {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const key = `ai:llm:calls:${day}`;
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, 90_000); // ~25h
  } catch {
    /* non-critical */
  }
}

// ---- Aggregate gathering (counts/sums ONLY — never names/user text) --

interface SectorAggregates {
  nActive: number;
  nClans: number;
  buildingTierSum: number;
  shieldCount: number;
  heldPct: number;
  strength: number;
  phase: string;
  events: string[];
}

async function gatherAggregates(
  sector: string,
  state: AiRegionState,
): Promise<SectorAggregates> {
  // Owned territories whose cells fall in the sector (JS parent filter).
  const owned = await query<{ owner_id: string; h3_cells: string[] | null }>(
    `SELECT t.owner_id, t.h3_cells
       FROM territories t
      WHERE t.owner_id IS NOT NULL AND t.owner_id <> $1 AND t.h3_cells IS NOT NULL
      LIMIT 3000`,
    [AI.USER_ID],
  );
  const players = new Set<string>();
  const sectorTerritoryIds: string[] = [];
  for (const r of owned.rows) {
    const cells = r.h3_cells ?? [];
    if (cells.some((c) => safeParent(c) === sector)) {
      players.add(r.owner_id);
    }
  }

  // n_active players: place_history in the sector over ACTIVE_DAYS, parent-filtered.
  let nActive = 0;
  try {
    const ph = await query<{ uid: string | null; lat: number; lng: number }>(
      `SELECT user_id AS uid, ST_Y(location) AS lat, ST_X(location) AS lng
         FROM place_history
        WHERE created_at > NOW() - ($1 || ' days')::interval
        LIMIT 5000`,
      [String(AI.TRIGGER.ACTIVE_DAYS)],
    );
    const active = new Set<string>();
    for (const r of ph.rows) {
      if (!r.uid) continue;
      try {
        const cell = cellForPoint(r.lat, r.lng, RES_SPAWN);
        if (parent(cell, RES_SECTOR) === sector) active.add(r.uid);
      } catch {
        /* skip */
      }
    }
    nActive = active.size || players.size;
  } catch {
    nActive = players.size;
  }

  // n_clans: distinct clans of the sector's players — COUNT ONLY (no names).
  let nClans = 0;
  try {
    if (players.size > 0) {
      const cl = await query<{ cnt: string }>(
        `SELECT COUNT(DISTINCT clan_id)::bigint AS cnt
           FROM clan_members
          WHERE user_id = ANY($1) AND clan_id IS NOT NULL`,
        [[...players]],
      );
      nClans = parseInt(cl.rows[0]?.cnt ?? '0', 10);
    }
  } catch {
    nClans = 0;
  }

  // Building tier sum + shield count over the sector's territories.
  let buildingTierSum = 0;
  let shieldCount = 0;
  try {
    // Resolve the sector's territory ids first (JS filter already done above is
    // owner-based; redo for territory ids).
    const terrIds: string[] = [];
    for (const r of owned.rows) {
      const cells = r.h3_cells ?? [];
      if (cells.some((c) => safeParent(c) === sector)) {
        // owner matched; we need ids — refetch lightweight below instead.
      }
    }
    const idRows = await query<{ id: string; h3_cells: string[] | null }>(
      `SELECT id, h3_cells FROM territories
        WHERE owner_id IS NOT NULL AND owner_id <> $1 AND h3_cells IS NOT NULL
        LIMIT 3000`,
      [AI.USER_ID],
    );
    for (const r of idRows.rows) {
      const cells = r.h3_cells ?? [];
      if (cells.some((c) => safeParent(c) === sector)) terrIds.push(r.id);
    }
    sectorTerritoryIds.push(...terrIds);
    if (terrIds.length > 0) {
      const b = await query<{ tier_sum: string | null; shields: string }>(
        `SELECT COALESCE(SUM(tier),0)::bigint AS tier_sum,
                COUNT(*) FILTER (WHERE type = 'shield_generator')::bigint AS shields
           FROM buildings
          WHERE territory_id = ANY($1) AND status = 'active'`,
        [terrIds],
      );
      buildingTierSum = parseInt(b.rows[0]?.tier_sum ?? '0', 10);
      shieldCount = parseInt(b.rows[0]?.shields ?? '0', 10);
    }
  } catch {
    /* keep zeros */
  }

  // Held % of the sector (held cells / active-ish denominator). Cheap estimate.
  const held = state.held_cells.length;
  const denom = Math.max(held, nActive, 1);
  const heldPct = Math.round((held / denom) * 100) / 100;

  // Last 5 events as NEUTRAL bullet strings — never user input. We use the AI's
  // own recent directives/battles, rendered as fixed phrases.
  const events: string[] = [];
  try {
    const lost = await query<{ created_at: Date }>(
      `SELECT b.created_at
         FROM battles b
        WHERE b.attacker_id = $1 AND (b.winner IS NULL OR b.winner <> $1)
        ORDER BY b.created_at DESC LIMIT 3`,
      [AI.USER_ID],
    );
    for (const _ of lost.rows) events.push('Angriff abgewehrt');
    const won = await query<{ created_at: Date }>(
      `SELECT b.created_at
         FROM battles b
        WHERE b.attacker_id = $1 AND b.winner = $1
        ORDER BY b.created_at DESC LIMIT 2`,
      [AI.USER_ID],
    );
    for (const _ of won.rows) events.push('Zelle eingenommen');
  } catch {
    /* events optional */
  }
  if (events.length === 0) events.push('Keine jüngeren Gefechte');

  return {
    nActive,
    nClans,
    buildingTierSum,
    shieldCount,
    heldPct,
    strength: state.strength,
    phase: state.phase,
    events: events.slice(0, 5),
  };
}

// ---- Prompt builder (compact German, ~500 tokens) -------------------

function buildPrompt(agg: SectorAggregates): { system: string; user: string } {
  const system =
    'Du bist der General der Hyperboreer in einem GPS-Strategiespiel. ' +
    'Du steuerst eine KI-Fraktion in EINEM Sektor. Antworte AUSSCHLIESSLICH mit ' +
    'gültigem JSON nach diesem Schema, ohne Erklärtext: ' +
    '{"directives":[{"command":"HOLD|EXPAND|HARVEST_AND_MOVE|PROBE_ATTACK|INVASION_TRIGGER|RETREAT|FORTIFY","intensity":0..1}],' +
    '"story":{"template_id":"radio_intercept|warning|taunt|retreat_note","slots":{"area":"...","line":"..."}}}. ' +
    'Maximal 3 directives. intensity ist eine Zahl zwischen 0 und 1. ' +
    'story ist optional und enthält NUR kurze, harmlose Stimmungstexte.';

  const user =
    `Sektorlage (nur aggregierte Zahlen):\n` +
    `- aktive Spieler: ${agg.nActive}\n` +
    `- Clans: ${agg.nClans}\n` +
    `- Gebäude-Stufen-Summe: ${agg.buildingTierSum}\n` +
    `- aktive Schilde: ${agg.shieldCount}\n` +
    `- von dir gehalten: ${Math.round(agg.heldPct * 100)}%\n` +
    `- deine Stärke: ${agg.strength}\n` +
    `- Phase: ${agg.phase}\n` +
    `- letzte Ereignisse: ${agg.events.join('; ')}\n\n` +
    `Wähle 1-3 Direktiven, die zur Phase und Stärke passen. ` +
    `Bei niedriger Stärke eher HOLD/FORTIFY/EXPAND, bei hoher Stärke PROBE_ATTACK/INVASION_TRIGGER. ` +
    `Antworte nur mit dem JSON.`;

  return { system, user };
}

// ---- Fallback FSM (deterministic) -----------------------------------

/**
 * Deterministic fallback when the LLM is unavailable, over budget, or returns
 * invalid output twice. Mirrors the phase machine:
 *   dormant   (on trigger) → EXPAND .3
 *   triggered → PROBE_ATTACK .4 + EXPAND .2
 *   invasion  → PROBE_ATTACK .8
 *   >50% held loss since last → RETREAT
 */
export function fallbackGeneral(state: AiRegionState): AiDirectivePayload {
  // >50% held-cell loss since last sim, tracked via metrics.peak_held.
  const peakHeld =
    typeof state.metrics?.peak_held === 'number' ? state.metrics.peak_held : state.held_cells.length;
  if (peakHeld > 0 && state.held_cells.length < peakHeld * 0.5) {
    return { directives: [{ command: 'RETREAT', intensity: 0.5 }] };
  }

  if (state.phase === 'invasion') {
    return { directives: [{ command: 'PROBE_ATTACK', intensity: 0.8 }] };
  }
  if (state.phase === 'triggered') {
    return {
      directives: [
        { command: 'PROBE_ATTACK', intensity: 0.4 },
        { command: 'EXPAND', intensity: 0.2 },
      ],
    };
  }
  // dormant (only reached when the caller decided a trigger happened)
  return { directives: [{ command: 'EXPAND', intensity: 0.3 }] };
}

// ---- JSON extractor + zod validation --------------------------------

/** Extract the first {...} block defensively, then zod-validate. */
function parsePayload(text: string): AiDirectivePayload | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    const result = AiDirective.safeParse(obj);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// ---- LLM provider cascade -------------------------------------------

const CORRECTION_LINE =
  'Deine letzte Antwort war ungültig. Antworte AUSSCHLIESSLICH mit dem gültigen JSON, ohne weiteren Text.';

/** Cascade entry shape (mirrors AI.LLM_PROVIDER_CASCADE / config.llm_cascade). */
interface CascadeEntry {
  provider: string;
  model: string;
}

/** Read the effective cascade: live config.llm_cascade if present, else default. */
function resolveCascade(cfg: Record<string, any>): CascadeEntry[] {
  const live = cfg?.llm_cascade;
  if (Array.isArray(live)) {
    const entries = live
      .filter((e) => e && typeof e.provider === 'string' && typeof e.model === 'string')
      .map((e) => ({ provider: e.provider as string, model: e.model as string }));
    if (entries.length > 0) return entries;
  }
  return AI.LLM_PROVIDER_CASCADE.map((e) => ({ provider: e.provider, model: e.model }));
}

/**
 * Try each cascade provider IN ORDER. For each: skip if unconfigured (no env
 * key); else check the shared daily budget BEFORE the call (fail closed),
 * incrBudget, call, zod-validate. On call/parse failure do ONE same-provider
 * retry with a correction line, then advance. The shared budget counts EVERY
 * attempt across all providers. Returns the winning payload + provider/model,
 * or null (→ caller uses fallbackGeneral, exactly as today).
 */
async function callLlmCascade(
  systemPrompt: string,
  userPrompt: string,
  cascade: CascadeEntry[],
  maxPerDay: number,
): Promise<{ payload: AiDirectivePayload; raw: string; provider: string; model: string } | null> {
  for (const entry of cascade) {
    const provider = buildProvider(entry.provider, entry.model);
    if (!provider) {
      console.debug(`[AIGeneral] unknown provider '${entry.provider}' in cascade — skipping`);
      continue;
    }
    if (!provider.isConfigured()) {
      console.debug(`[AIGeneral] provider '${entry.provider}' not configured (no env key) — skipping`);
      continue;
    }

    const attempt = async (extraUser?: string): Promise<string | null> => {
      // Budget is the single shared daily ceiling across all providers; check
      // BEFORE the call (fail closed) and count every attempt.
      if (await budgetExhausted(maxPerDay)) return null;
      await incrBudget();
      const fullUser = extraUser ? `${userPrompt}\n\n${extraUser}` : userPrompt;
      try {
        return await provider.complete(systemPrompt, fullUser, AI.LLM_MAX_TOKENS);
      } catch (err: any) {
        console.warn(
          `[AIGeneral] ${entry.provider}/${entry.model} call failed:`,
          err?.message ?? err,
        );
        return null;
      }
    };

    // First attempt on this provider.
    const first = await attempt();
    if (first === null && (await budgetExhausted(maxPerDay))) {
      // Budget ran out mid-cascade → no point trying further providers.
      return null;
    }
    if (first) {
      const p = parsePayload(first);
      if (p) return { payload: p, raw: first, provider: entry.provider, model: entry.model };
    }

    // ONE retry on the SAME provider with the correction line.
    const second = await attempt(CORRECTION_LINE);
    if (second === null && (await budgetExhausted(maxPerDay))) {
      return null;
    }
    if (second) {
      const p = parsePayload(second);
      if (p) return { payload: p, raw: second, provider: entry.provider, model: entry.model };
    }

    // Both attempts on this provider failed → advance to the next entry.
  }

  return null; // all providers unconfigured/exhausted/failing → caller uses fallback
}

// ---- Story → push ---------------------------------------------------

async function maybePushStory(
  sector: string,
  story: AiDirectivePayload['story'],
): Promise<void> {
  if (!story) return;

  // Sanitise slots.
  const cleanSlots: Record<string, string> = {};
  for (const [k, v] of Object.entries(story.slots)) {
    const cleaned = sanitizeSlot(v);
    if (!cleaned) continue;
    const lower = cleaned.toLowerCase();
    if (SLOT_BLOCKLIST.some((b) => lower.includes(b))) continue;
    cleanSlots[k] = cleaned;
  }

  const render = STORY_TEMPLATES[story.template_id];
  if (!render) return;
  const body = render(cleanSlots);

  // Run the rendered line through the existing moderation check.
  try {
    const verdict = await moderationService.checkText(body);
    if (!verdict.safe) return;
  } catch {
    return; // moderation hiccup → do not push (fail closed for user-facing text)
  }

  // Dedup: at most one story push per sector per 12h.
  try {
    const dedupKey = `ai:story:pushed:${sector}`;
    const fresh = await redis.set(dedupKey, '1', 'EX', 12 * 3600, 'NX');
    if (fresh === null) return;
  } catch {
    /* if Redis is down, proceed (better one extra than silent) */
  }

  // Recipients: players with a territory in the sector (cap 50). JS parent filter.
  let recipients: string[] = [];
  try {
    const owned = await query<{ owner_id: string; h3_cells: string[] | null }>(
      `SELECT t.owner_id, t.h3_cells FROM territories t
        WHERE t.owner_id IS NOT NULL AND t.owner_id <> $1 AND t.h3_cells IS NOT NULL
        LIMIT 2000`,
      [AI.USER_ID],
    );
    const set = new Set<string>();
    for (const r of owned.rows) {
      const cells = r.h3_cells ?? [];
      if (cells.some((c) => safeParent(c) === sector)) set.add(r.owner_id);
      if (set.size >= 50) break;
    }
    recipients = [...set];
  } catch {
    recipients = [];
  }

  // Quiet hours: notificationService owns the quiet-hours helper but it is
  // private and tied to per-user settings; per the spec we SKIP quiet-hours
  // here (documented follow-up) rather than reaching into its internals.
  for (const uid of recipients) {
    try {
      await sendPushToUser(uid, '📡 Abgefangener Funk — MapRaiders', body, {
        type: 'ai_story',
        sector,
        template: story.template_id,
      });
    } catch {
      /* per-user failure is non-critical */
    }
  }
}

// ---- Public: runGeneralForSector ------------------------------------

/**
 * Run the LLM general for one sector: gather aggregates → prompt → LLM (with
 * one retry) → fallback FSM if needed → persist a directive row → maybe push
 * the flavour story. Stamps last_llm_at. Per-sector try/catch is the caller's.
 */
export async function runGeneralForSector(sector: string): Promise<void> {
  // Load current state (also ensures the row exists).
  const stateRes = await query<AiRegionState>(
    `SELECT h3_sector, phase, held_cells, strength, resources,
            last_sim_at, last_llm_at, metrics
       FROM ai_region_state WHERE h3_sector = $1`,
    [sector],
  );
  if (stateRes.rowCount === 0) return; // nothing to do; sim ensures the row
  const state = stateRes.rows[0];

  const cfg = await aiFlagConfig();
  const maxPerDay =
    typeof cfg.max_calls_per_day === 'number' ? cfg.max_calls_per_day : AI.LLM_MAX_CALLS_PER_DAY;
  const cascade = resolveCascade(cfg);

  let payload: AiDirectivePayload;
  let source: 'llm' | 'fallback';
  let raw: string | null = null;

  // Any configured provider in the cascade? (When NONE has an env key the
  // cascade is effectively empty → fallback, same as today with no key.)
  const anyConfigured = cascade.some((e) => {
    const p = buildProvider(e.provider, e.model);
    return p?.isConfigured() ?? false;
  });

  const overBudget = await budgetExhausted(maxPerDay);
  if (overBudget || !anyConfigured) {
    payload = fallbackGeneral(state);
    source = 'fallback';
  } else {
    const agg = await gatherAggregates(sector, state);
    const { system, user } = buildPrompt(agg);
    const llm = await callLlmCascade(system, user, cascade, maxPerDay);
    if (llm) {
      payload = llm.payload;
      // Prefix the raw response with the winning provider+model so the LLM
      // path stays auditable without an ai_directives schema change.
      raw = `[${llm.provider} ${llm.model}]\n${llm.raw}`;
      source = 'llm';
    } else {
      payload = fallbackGeneral(state);
      source = 'fallback';
    }
  }

  // Persist the directive(s): one ai_directives row per directive so the sim
  // executes them oldest-first. The optional story rides on the first row.
  await transaction(async (c) => {
    for (const d of payload.directives) {
      await c.query(
        `INSERT INTO ai_directives (h3_sector, source, directive, raw_response)
         VALUES ($1, $2, $3, $4)`,
        [sector, source, JSON.stringify(d), raw],
      );
    }
    // Track peak_held for the fallback RETREAT heuristic + stamp last_llm_at.
    await c.query(
      `UPDATE ai_region_state
          SET last_llm_at = NOW(),
              metrics = jsonb_set(
                metrics, '{peak_held}',
                to_jsonb(GREATEST(
                  COALESCE((metrics->>'peak_held')::int, 0),
                  array_length(held_cells, 1)
                ))
              )
        WHERE h3_sector = $1`,
      [sector],
    );
  });

  // Story push (LLM path only — fallback emits no story).
  if (source === 'llm' && payload.story) {
    await maybePushStory(sector, payload.story);
  }
}

// ---- helpers --------------------------------------------------------

/** res-8/9 cell -> res-6 parent, swallowing pentagon/invalid errors. */
function safeParent(cell: string): string | null {
  try {
    return parent(cell, RES_SECTOR);
  } catch {
    return null;
  }
}

export const aiGeneralService = { runGeneralForSector, fallbackGeneral };
export default aiGeneralService;

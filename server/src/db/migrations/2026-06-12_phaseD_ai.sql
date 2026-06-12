-- ============================================================
-- Phase D — Hybrid AI General (deterministic sector sim + LLM)
-- Additive, idempotent. ALL behavior gated behind the `ai_general`
-- feature flag (default OFF, rollout 100).
--
-- Architecture note (deviation from the design doc, engineering-sound):
-- The doc models AI units with owner_id = NULL + an ai_faction marker, but
-- troop_movements.owner_id and the item_instances flows assume a real user.
-- Instead we SEED a SYSTEM USER row (fixed UUID) that owns every AI unit and
-- movement, so the existing troopEngine / battleEngine / itemService paths
-- work UNCHANGED. Clients identify AI via that fixed id (AI_USER_ID) and
-- config.ai_faction === true on movements.
--
--   ai_region_state — one row per res-6 sector the AI tracks (phase machine)
--   ai_directives   — append-only log of LLM / fallback orders per sector
--   ruins           — cells the AI razed; overgrow into ruin_cache spawns
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_region_state (
  h3_sector    TEXT PRIMARY KEY,            -- res 6
  phase        VARCHAR(10) NOT NULL DEFAULT 'dormant',   -- dormant|triggered|invasion
  held_cells   TEXT[] NOT NULL DEFAULT '{}',             -- res 8 cells
  strength     INT NOT NULL DEFAULT 0,
  resources    BIGINT NOT NULL DEFAULT 0,
  last_sim_at  TIMESTAMPTZ,
  last_llm_at  TIMESTAMPTZ,
  metrics      JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ai_directives (
  id          BIGSERIAL PRIMARY KEY,
  h3_sector   TEXT NOT NULL,
  source      VARCHAR(10) NOT NULL,         -- 'llm' | 'fallback'
  directive   JSONB NOT NULL,
  raw_response TEXT,
  executed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_directives_sector ON ai_directives(h3_sector, created_at DESC);

CREATE TABLE IF NOT EXISTS ruins (
  h3_cell    TEXT PRIMARY KEY,
  h3_sector  TEXT NOT NULL,
  ruined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overgrowth INT NOT NULL DEFAULT 0,
  scavenged  JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_ruins_sector ON ruins(h3_sector);

-- Feature flag (default OFF, rollout 100 so a single enabled=TRUE flips it on
-- for everyone once we are ready).
INSERT INTO feature_flags (key, enabled, rollout_percent, config)
VALUES ('ai_general', FALSE, 100, '{}')
ON CONFLICT (key) DO NOTHING;

-- AI system user (idempotent). users requires username/email/password_hash
-- (all NOT NULL). '!' is an impossible bcrypt hash, so this account can never
-- authenticate. Fixed UUID lets clients identify AI-owned units/movements.
-- username/email are UNIQUE — a player may already hold 'Hyperboreans', so the
-- insert falls back to alternative values instead of aborting the migration.
-- banned = TRUE hides the system account from player search and leaderboards
-- (both filter banned = FALSE); the AI's cron-driven combat never reads banned.
INSERT INTO users (id, username, email, password_hash, banned)
SELECT
  '00000000-0000-0000-0000-00000000a111',
  CASE WHEN EXISTS (SELECT 1 FROM users WHERE username = 'Hyperboreans')
       THEN 'Hyperboreans_System' ELSE 'Hyperboreans' END,
  CASE WHEN EXISTS (SELECT 1 FROM users WHERE email = 'ai@system.mapraiders.com')
       THEN 'ai-system@system.mapraiders.com' ELSE 'ai@system.mapraiders.com' END,
  '!',
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-00000000a111'
);
-- Idempotent re-run hardening: ensure the flag is set even on pre-existing rows.
UPDATE users SET banned = TRUE
 WHERE id = '00000000-0000-0000-0000-00000000a111' AND banned = FALSE;

-- ============================================================
-- Phase A.2 — Terminals + Jump&Run
-- Landmark cells now spit out hackable-looking 'terminal' spawns that
-- host a deterministic HTML5 runner minigame. Each finished run posts a
-- score to a per-spawn Redis leaderboard and (capped) grants intel.
-- terminal_runs is the append-only record of every submitted run; the
-- live leaderboard lives in Redis but can be rebuilt from this table.
-- Idempotent: safe to run repeatedly.
-- ============================================================

CREATE TABLE IF NOT EXISTS terminal_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spawn_id    UUID NOT NULL REFERENCES pve_spawns(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score       INT NOT NULL,
  duration_ms INT NOT NULL,
  finished    BOOLEAN NOT NULL DEFAULT FALSE,
  replay_hash VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_terminal_runs_spawn ON terminal_runs(spawn_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_terminal_runs_user ON terminal_runs(user_id, created_at);

INSERT INTO feature_flags (key, enabled, rollout_percent, config)
VALUES ('terminals', FALSE, 100, '{}') ON CONFLICT (key) DO NOTHING;

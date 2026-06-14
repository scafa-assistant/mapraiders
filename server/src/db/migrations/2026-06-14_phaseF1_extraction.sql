-- ============================================================
-- Phase F.1 — Biome-based Resource Extraction (the economy foundation)
-- Extraction buildings (sawmill / quarry / farm / fishery) accrue raw
-- resources (wood / stone / food) into a per-TERRITORY stockpile over time.
-- Hauling stockpile→player balance is a LATER phase.
--
-- NO change to buildings (buildings.type VARCHAR(30) already holds the new
-- types; tier CHECK 1..3 already covers them) and NONE to player_resources
-- (resource VARCHAR(15) already fits 'wood'/'stone'/'food').
--
-- Idempotent: safe to run repeatedly.
-- ============================================================

CREATE TABLE IF NOT EXISTS territory_stockpile (
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  resource     VARCHAR(15) NOT NULL,
  amount       BIGINT NOT NULL DEFAULT 0 CHECK (amount >= 0),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (territory_id, resource)
);

-- Feature flag gating the whole F.1 subsystem (build + accrual + cron).
INSERT INTO feature_flags (key, enabled, rollout_percent, config)
VALUES ('economy', FALSE, 100, '{}')
ON CONFLICT (key) DO NOTHING;

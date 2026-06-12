-- ============================================================
-- Phase B — Buildings + Energy Ticks
-- Tier-1 structures placed on owned territories:
--   shield_generator → spawns a passive 'shield' territory_defense
--   refinery         → boosts passive energy accrual on the territory
-- energy_ticks tracks the last passive-energy accrual per user so
-- lazy (on-request) and cron accrual never double-credit.
-- Idempotent: safe to run repeatedly.
-- ============================================================

CREATE TABLE IF NOT EXISTS buildings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id  UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  owner_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  type          VARCHAR(30) NOT NULL,   -- 'shield_generator' | 'refinery' (Phase B)
  tier          INT NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 3),
  status        VARCHAR(15) NOT NULL DEFAULT 'building',  -- building|active|damaged|destroyed
  hp            INT NOT NULL DEFAULT 100,
  completes_at  TIMESTAMPTZ,
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buildings_territory ON buildings(territory_id, status);
CREATE INDEX IF NOT EXISTS idx_buildings_completion ON buildings(completes_at) WHERE status = 'building';

CREATE TABLE IF NOT EXISTS energy_ticks (
  user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_tick_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

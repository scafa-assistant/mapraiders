-- ============================================================
-- Phase C.1 — Commander layer: Fog of War + Scouts
-- Additive, idempotent. Gated behind the `commander` feature flag.
--
--   player_visibility  — per-user revealed cells (radar / scout sources)
--   troop_movements    — generic unit movement plumbing (C.1: scouts only)
--   battles            — created now for schema stability; the battle
--                        engine itself is C.2 (NOT built here).
--
-- Active-territory predicate in this layer is `owner_id IS NOT NULL`
-- (the territories table has no `status` column — decay unclaims rows).
-- ============================================================

CREATE TABLE IF NOT EXISTS player_visibility (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  h3_cell    TEXT NOT NULL,
  source     VARCHAR(15) NOT NULL,        -- 'radar' | 'scout'
  expires_at TIMESTAMPTZ,                 -- NULL = permanent while source exists
  PRIMARY KEY (user_id, h3_cell, source)
);
CREATE INDEX IF NOT EXISTS idx_player_visibility_user ON player_visibility(user_id, expires_at);

CREATE TABLE IF NOT EXISTS troop_movements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_ids UUID[] NOT NULL,
  from_cell    TEXT NOT NULL,
  to_cell      TEXT NOT NULL,
  path         TEXT[] NOT NULL,
  purpose      VARCHAR(15) NOT NULL,      -- 'attack'|'reinforce'|'scout'|'return'
  config       JSONB NOT NULL DEFAULT '{}',
  departs_at   TIMESTAMPTZ NOT NULL,
  arrives_at   TIMESTAMPTZ NOT NULL,
  status       VARCHAR(15) NOT NULL DEFAULT 'marching',  -- marching|arrived|intercepted|cancelled
  resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_troop_movements_owner ON troop_movements(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_troop_movements_due ON troop_movements(arrives_at) WHERE status = 'marching' AND resolved = FALSE;

CREATE TABLE IF NOT EXISTS battles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  defender_id  UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL = PvE/AI
  territory_id UUID REFERENCES territories(id) ON DELETE SET NULL,
  type         VARCHAR(15) NOT NULL,      -- 'assault'|'airstrike'|'interception'
  log          JSONB NOT NULL DEFAULT '[]',
  winner       UUID,
  loot         JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_battles_attacker ON battles(attacker_id, created_at);
CREATE INDEX IF NOT EXISTS idx_battles_defender ON battles(defender_id, created_at);

-- GIN index for array-overlap (h3_cells && $1::text[]) lookups in the
-- commander /map endpoint. (A GIN index already exists as idx_territories_h3;
-- this is a no-op duplicate kept for explicitness and is harmless.)
CREATE INDEX IF NOT EXISTS idx_territories_h3_cells ON territories USING GIN(h3_cells);

-- The `commander` feature flag row is already seeded in the SEEDS block of
-- schema.sql (default FALSE). No INSERT needed here.

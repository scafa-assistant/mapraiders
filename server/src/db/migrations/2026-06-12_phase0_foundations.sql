-- ============================================================
-- Migration: 2026-06-12_phase0_foundations.sql
-- Phase 0: GDD Foundations — Feature-Flags, Items, Resources,
-- H3/OSM Context. All statements are idempotent (IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- FEATURE FLAGS (E4)
-- Server-side feature gating with optional per-user rollout.
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  key             VARCHAR(50) PRIMARY KEY,        -- 'pve_spawns', 'commander', 'tcg', ...
  enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_percent INT NOT NULL DEFAULT 100 CHECK (rollout_percent BETWEEN 0 AND 100),
  config          JSONB NOT NULL DEFAULT '{}',    -- feature-specific tuning values
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ITEM DEFINITIONS (E1)
-- Catalogue of all item archetypes: dice, units, cards, relics, blueprints.
-- ============================================================
CREATE TABLE IF NOT EXISTS item_definitions (
  id           VARCHAR(60) PRIMARY KEY,            -- 'dice_loaded', 'unit_tank_t1', 'card_carrier_s1_042'
  category     VARCHAR(20) NOT NULL,               -- 'dice' | 'unit' | 'card' | 'relic' | 'blueprint'
  rarity       VARCHAR(15) NOT NULL DEFAULT 'common',  -- common|uncommon|rare|epic|legendary|secret
  season       VARCHAR(20),                        -- NULL = evergreen; 'S1' etc. for TCG scarcity
  tradeable    BOOLEAN NOT NULL DEFAULT FALSE,     -- policy lever (Appendix B): wager only non-tradeable
  stats        JSONB NOT NULL DEFAULT '{}',        -- {faces:[1,2,3,null,null,null]} | {atk,def,speed,domain:'water'}
  lore         JSONB NOT NULL DEFAULT '{}',        -- {name_key, desc_key, faction:'hyperborean', art_url}
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ITEM INSTANCES (E1)
-- Concrete ownership records including burn/transfer lifecycle.
-- ============================================================
CREATE TABLE IF NOT EXISTS item_instances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id VARCHAR(60) NOT NULL REFERENCES item_definitions(id),
  owner_id      UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL after account deletion (soft-delete pattern)
  status        VARCHAR(15) NOT NULL DEFAULT 'inventory',
    -- 'inventory' | 'equipped' | 'deployed' (as troop on map) | 'staked' (in wager) | 'burned' | 'listed' (market)
  mint_number   INT,                                -- TCG scarcity: edition number
  acquired_via  VARCHAR(20) NOT NULL,               -- 'hack' | 'loot' | 'scavenge' | 'booster' | 'trade' | 'wager' | 'seed'
  state         JSONB NOT NULL DEFAULT '{}',        -- instance state: {hp}, {deployed_territory_id}, ...
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_instances_owner ON item_instances(owner_id, status);

-- ============================================================
-- ITEM EVENTS (E1)
-- Immutable audit log of transfers, burns, and trades.
-- ============================================================
CREATE TABLE IF NOT EXISTS item_events (
  id          BIGSERIAL PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES item_instances(id),
  event       VARCHAR(20) NOT NULL,    -- 'minted'|'transferred'|'burned'|'deployed'|'recalled'|'staked'|'won'|'lost'
  from_user   UUID,
  to_user     UUID,
  context     JSONB NOT NULL DEFAULT '{}',  -- {battle_id} | {wager_id} | {market_listing_id}
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PLAYER RESOURCES — LEDGER (E2)
-- Balances plus immutable transaction log for anti-cheat/audit.
-- ============================================================
CREATE TABLE IF NOT EXISTS player_resources (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource  VARCHAR(15) NOT NULL,      -- 'energy' | 'tech' | 'intel'
  balance   BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  PRIMARY KEY (user_id, resource)
);

CREATE TABLE IF NOT EXISTS resource_transactions (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL,
  resource   VARCHAR(15) NOT NULL,
  amount     BIGINT NOT NULL,           -- +credit / -debit
  reason     VARCHAR(30) NOT NULL,      -- 'territory_tick'|'hack_reward'|'minigame'|'build_cost'|'airstrike'|'market'|...
  context    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restx_user ON resource_transactions(user_id, created_at DESC);

-- ============================================================
-- OSM CONTEXT (E3, E8)
-- Biome cache per H3 res-8 cell, populated by osmContextService.
-- ============================================================
CREATE TABLE IF NOT EXISTS osm_context (
  h3_cell    TEXT PRIMARY KEY,          -- res 8
  biome      VARCHAR(15) NOT NULL DEFAULT 'urban',  -- water|forest|industrial|urban|rural|landmark
  tags       JSONB NOT NULL DEFAULT '{}',
  landmarks  JSONB NOT NULL DEFAULT '[]',  -- [{name, lat, lng, osm_tags}]
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TERRITORIES: add H3 cells column (E3)
-- Stores all res-8 cells that intersect the territory polygon.
-- Populated by h3_backfill cron job.
-- ============================================================
ALTER TABLE territories ADD COLUMN IF NOT EXISTS h3_cells TEXT[];
CREATE INDEX IF NOT EXISTS idx_territories_h3 ON territories USING GIN (h3_cells);

-- ============================================================
-- SEEDS: Feature Flags — all off by default
-- ============================================================
INSERT INTO feature_flags (key, enabled)
VALUES
  ('pve_spawns',  FALSE),
  ('resources',   FALSE),
  ('commander',   FALSE),
  ('tcg',         FALSE)
ON CONFLICT (key) DO NOTHING;

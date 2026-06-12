-- ============================================================
-- Migration: 2026-06-12_phaseA_pve.sql
-- Phase A: PvE Spawns + Hacking — context-driven NPC spawns
-- (Erdriss portals, Vril scouts, Aether-Leeches) and the
-- hacking minigame resolution log. All statements idempotent.
-- ============================================================

-- ============================================================
-- PVE SPAWNS
-- Context-driven NPC spawns per H3 res-8 cell. Biome decides
-- type, players hack them physically for units/intel/tech.
-- ============================================================
CREATE TABLE IF NOT EXISTS pve_spawns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  h3_cell     TEXT NOT NULL,
  location    GEOMETRY(POINT, 4326) NOT NULL,
  npc_type    VARCHAR(30) NOT NULL,     -- 'scout_disc' | 'aether_leech' | 'tech_drone' | 'obsidian_guard'
  level       INT NOT NULL DEFAULT 1,
  biome       VARCHAR(15) NOT NULL,
  status      VARCHAR(15) NOT NULL DEFAULT 'active',  -- active|hacked|expired
  hacked_by   UUID REFERENCES users(id),
  anchored_territory_id UUID REFERENCES territories(id),  -- nur aether_leech
  loot        JSONB NOT NULL DEFAULT '{}',  -- {items:[def_ids], resources:{tech:5,intel:2}}
  spawned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pve_spawns_cell ON pve_spawns(h3_cell, status);
CREATE INDEX IF NOT EXISTS idx_pve_spawns_loc ON pve_spawns USING GIST(location);

-- ============================================================
-- HACK ATTEMPTS
-- Append-only resolution log for the hacking minigame.
-- input_trace carries the anti-cheat plausibility payload.
-- ============================================================
CREATE TABLE IF NOT EXISTS hack_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spawn_id    UUID NOT NULL REFERENCES pve_spawns(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  success     BOOLEAN NOT NULL,
  input_trace JSONB NOT NULL DEFAULT '{}',   -- Anti-Cheat-Plausibilitaet
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hack_attempts_user ON hack_attempts(user_id, created_at DESC);

-- ============================================================
-- SEEDS: PvE Unit item definitions
-- Hackable units that drop from spawns. All non-tradeable
-- (units leave the player economy untouched in Phase A).
-- ============================================================
INSERT INTO item_definitions (id, category, rarity, tradeable, stats, lore)
VALUES
  ('unit_scout_disc', 'unit', 'common', FALSE,
    '{"domain":"air","atk":1,"def":1}',
    '{"name_key":"unit_scout_disc","faction":"hyperborean"}'),
  ('unit_tech_drone', 'unit', 'uncommon', FALSE,
    '{"domain":"air","atk":1,"def":2}',
    '{"name_key":"unit_tech_drone","faction":"hyperborean"}'),
  ('unit_water_strider', 'unit', 'uncommon', FALSE,
    '{"domain":"naval","atk":2,"def":1}',
    '{"name_key":"unit_water_strider","faction":"hyperborean"}'),
  ('unit_forest_construct', 'unit', 'uncommon', FALSE,
    '{"domain":"ground","atk":2,"def":2}',
    '{"name_key":"unit_forest_construct","faction":"hyperborean"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2026-07-02 — Base grid + military/industry catalog + training
--
-- 1. buildings gain a grid position: territory area becomes a square
--    build grid (BUILDINGS.GRID in constants.ts, cell = 25 m²) and every
--    structure occupies an individual FOOTPRINT of cells. NULL position =
--    legacy building; buildingEngine auto-places those on first read.
-- 2. Player-trainable unit definitions (military_base → ground,
--    airport → air). Non-tradeable 'unit' items so troopEngine /
--    battleEngine / hauling work unchanged.
--
-- Additive, idempotent: safe to run repeatedly.
-- ============================================================

ALTER TABLE buildings ADD COLUMN IF NOT EXISTS grid_x INT;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS grid_y INT;

INSERT INTO item_definitions (id, category, rarity, tradeable, stats, lore)
VALUES
  ('unit_militia', 'unit', 'common', FALSE,
    '{"domain":"ground","atk":1,"def":1}',
    '{"name_key":"unit_militia","faction":"player"}'),
  ('unit_infantry', 'unit', 'common', FALSE,
    '{"domain":"ground","atk":2,"def":2}',
    '{"name_key":"unit_infantry","faction":"player"}'),
  ('unit_ranger', 'unit', 'uncommon', FALSE,
    '{"domain":"ground","atk":3,"def":2}',
    '{"name_key":"unit_ranger","faction":"player"}'),
  ('unit_commando', 'unit', 'rare', FALSE,
    '{"domain":"ground","atk":4,"def":3}',
    '{"name_key":"unit_commando","faction":"player"}'),
  ('unit_recon_uav', 'unit', 'uncommon', FALSE,
    '{"domain":"air","atk":1,"def":1}',
    '{"name_key":"unit_recon_uav","faction":"player"}'),
  ('unit_gunship', 'unit', 'rare', FALSE,
    '{"domain":"air","atk":4,"def":2}',
    '{"name_key":"unit_gunship","faction":"player"}'),
  ('unit_jet', 'unit', 'epic', FALSE,
    '{"domain":"air","atk":6,"def":3}',
    '{"name_key":"unit_jet","faction":"player"}')
ON CONFLICT (id) DO NOTHING;

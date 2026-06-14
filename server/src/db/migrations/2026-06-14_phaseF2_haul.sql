-- ============================================================
-- Phase F.2 — Resource Hauling + Interception
-- Harvested resources sit in territory_stockpile (F.1). To turn them into a
-- player's BALANCE they must be HAULED home with troops. Haul units trade
-- carry capacity vs protection. A loaded haul can be INTERCEPTED; if its
-- escort loses the battle, the load is LOST (destroyed, gone).
--
-- This migration only adds the three hauler UNIT definitions. The haul/return
-- movements reuse the existing troop_movements table (purpose 'haul'/'return',
-- config JSONB carries carry_total + load); interception writes a battles row
-- with type 'interception' (the type column already allows it). No new table.
--
-- Haul is gated behind the `economy` flag; interception behind `commander`.
-- Additive + idempotent: ON CONFLICT DO NOTHING. Safe to run repeatedly.
-- ============================================================

-- Hauler unit definitions: non-tradeable 'unit' items carrying a `carry` stat
-- (units of resource they can transport). They trade carry vs combat power.
--   porter            — most carry, zero protection, cheap worker
--   transport         — protected, medium carry
--   armored_transport — premium: high carry + strong escort
INSERT INTO item_definitions (id, category, rarity, tradeable, stats, lore)
VALUES
  ('unit_porter', 'unit', 'common', FALSE,
    '{"domain":"ground","atk":0,"def":0,"carry":120}',
    '{"name_key":"unit_porter","faction":"hyperborean"}'),
  ('unit_transport', 'unit', 'uncommon', FALSE,
    '{"domain":"ground","atk":1,"def":2,"carry":70}',
    '{"name_key":"unit_transport","faction":"hyperborean"}'),
  ('unit_armored_transport', 'unit', 'rare', FALSE,
    '{"domain":"armor","atk":3,"def":3,"carry":90}',
    '{"name_key":"unit_armored_transport","faction":"hyperborean"}')
ON CONFLICT (id) DO NOTHING;

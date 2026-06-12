-- ============================================================
-- Phase C.2 — Commander layer: Troop deployment + Dice battle engine
-- Additive, idempotent. Gated behind the `commander` feature flag.
--
--   troop_deployments  — garrison rows: which unit instances defend which
--                        territory (1 row per deployed unit). The battles
--                        table already exists from C.1; the engine fills it.
--   dice item seeds    — bonus dice + effect dice dropped by battle winners.
-- ============================================================

CREATE TABLE IF NOT EXISTS troop_deployments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  UUID NOT NULL UNIQUE REFERENCES item_instances(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         VARCHAR(15) NOT NULL DEFAULT 'garrison',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_troop_deployments_territory ON troop_deployments(territory_id);
CREATE INDEX IF NOT EXISTS idx_troop_deployments_owner ON troop_deployments(owner_id);

-- scout_vision_tick looks up watchers per cell ("WHERE h3_cell = ...") —
-- without this index that is a sequential scan per in-flight movement.
CREATE INDEX IF NOT EXISTS idx_player_visibility_cell ON player_visibility(h3_cell);

-- Dice item definitions: bonus dice extend a side's round roll; effect dice
-- alter resolution once per battle. All non-tradeable archive-faction drops.
INSERT INTO item_definitions (id, category, rarity, tradeable, stats, lore)
VALUES
  ('dice_d6', 'dice', 'common', FALSE,
    '{"kind":"bonus_die","sides":6}',
    '{"name_key":"dice_d6","faction":"archive"}'),
  ('dice_d8', 'dice', 'rare', FALSE,
    '{"kind":"bonus_die","sides":8}',
    '{"name_key":"dice_d8","faction":"archive"}'),
  ('dice_shield', 'dice', 'epic', FALSE,
    '{"kind":"effect","effect":"cancel_highest"}',
    '{"name_key":"dice_shield","faction":"archive"}')
ON CONFLICT (id) DO NOTHING;

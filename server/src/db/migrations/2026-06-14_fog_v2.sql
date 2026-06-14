-- ============================================================
-- Fog v2 — 3-tier "Anno-style" fog of war (2026-06-14)
-- Additive, idempotent. Gated behind the `commander` feature flag.
--
-- NO TABLE CHANGES. player_visibility.source is already VARCHAR, so the new
-- PERMANENT tier reuses the existing column:
--
--   source = 'explored'  → PERMANENT terrain memory (expires_at NULL).
--                           Written on a scout/return arrival for the WHOLE
--                           walked corridor (visionService.writeExploredCorridor).
--                           Never expires — "once a scout walked there, you see
--                           the terrain forever". Rendered dim (no live detail).
--   source = 'scout'      → legacy TTL rows. ACTIVE (live) cells are now
--                           computed dynamically (radar buildings + in-flight
--                           scout disks), so we STOP writing 'scout' rows. The
--                           column + TTL cleanup keep working untouched.
--   source = 'radar'      → legacy TTL rows (unused going forward).
--
-- cleanupExpired only ever deletes rows WHERE expires_at IS NOT NULL, so the
-- permanent 'explored' rows are never touched.
--
-- New index: explored-tier reads filter by (user_id, source='explored'), so a
-- composite (user_id, source) index keeps that lookup an index scan.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_player_visibility_user_src
  ON player_visibility(user_id, source);

COMMENT ON COLUMN player_visibility.source IS
  'Visibility tier source: ''explored'' = PERMANENT terrain memory (expires_at NULL, '
  'written per scout corridor); ''scout''/''radar'' = legacy TTL rows (active/live '
  'cells are now computed dynamically and no longer written here).';

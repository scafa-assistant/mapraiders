-- Migration: territories.is_protected (Schema-Drift Fix vor Server-Deploy 2026-06-10)
-- Prod-DB hat diese Spalte nicht; decayEngine.ts:47 benoetigt sie.
-- Idempotent: kann mehrfach laufen.

ALTER TABLE territories ADD COLUMN IF NOT EXISTS is_protected BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_territories_protected ON territories (is_protected) WHERE is_protected = TRUE;

-- Seed-Territorien vor Decay schuetzen (IDs beginnen mit 10000000-)
UPDATE territories SET is_protected = TRUE WHERE id::text LIKE '10000000-%' AND is_protected = FALSE;

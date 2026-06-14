// ============================================================
// Map the server's machine-readable building error codes to readable text.
// The buildings route returns message = error code on domain failure
// (NOT_OWNER, NO_SLOTS, DUPLICATE_TYPE, INSUFFICIENT_RESOURCES, *_NOT_FOUND).
// ============================================================

const MESSAGES: Record<string, string> = {
  NOT_OWNER: 'You do not own this territory.',
  NO_SLOTS: 'No free building slot on this territory.',
  DUPLICATE_TYPE: 'A building of this type already exists here.',
  INVALID_TYPE: 'Unknown building type.',
  INSUFFICIENT_RESOURCES: 'Not enough resources.',
  NOT_DEMOLISHABLE: 'This building cannot be demolished right now.',
  TERRITORY_NOT_FOUND: 'Territory not found.',
  BUILDING_NOT_FOUND: 'Building not found.',
  // Upgrade-specific codes
  MAX_TIER: 'Already at maximum tier.',
  NOT_UPGRADABLE: 'Building must be active to upgrade.',
  // Extraction building (Phase F.1)
  BIOME_MISMATCH: "This territory's terrain doesn't match the extractor's required biome.",
  FEATURE_DISABLED: 'This feature is not yet enabled.',
};

export function readableBuildingError(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  return MESSAGES[code] ?? fallback;
}

// ============================================================
// Central theme tokens — MapRaiders brand: clean blue on off-white.
// Light theme matching the marketing landing page.
// Plain TS object, consumed inline and mirrored in index.css.
// ============================================================

export const theme = {
  color: {
    bg: '#F6F4F1',          // warm off-white background
    panel: '#FFFFFF',       // cards / panels
    panelAlt: '#EFEDE8',    // secondary surface
    border: '#C0BAB4',      // dim borders
    accent: '#1558F0',      // strong brand blue
    accentBright: '#4B7BFF', // lighter blue for hovers / glows
    text: '#141210',        // near-black text
    textDim: '#7A7470',     // muted text
    amber: '#F5A623',       // secondary accent (highlights / objectives)
    danger: '#D7263D',
    success: '#1B9E5A',
    foreign: '#F5A623',     // amber for foreign territories (light-friendly contrast)
    foreignFill: 'rgba(245, 166, 35, 0.18)',
    ownFill: 'rgba(21, 88, 240, 0.22)',
  },
  radius: 12,
} as const;

// Rarity palette for inventory items.
export const rarityColor: Record<string, string> = {
  common: '#7A7470',
  uncommon: '#1B9E5A',
  rare: '#1558F0',
  epic: '#0E7490', // deep teal (distinct tier, no purple)
  legendary: '#F5A623',
};

export function colorForRarity(rarity: string | undefined): string {
  if (!rarity) return rarityColor.common;
  return rarityColor[rarity.toLowerCase()] ?? rarityColor.common;
}

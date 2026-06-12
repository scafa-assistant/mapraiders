// ============================================================
// Central theme tokens — Vril violet on obsidian.
// Plain TS object, consumed inline and mirrored in index.css.
// ============================================================

export const theme = {
  color: {
    bg: '#0C0914',
    panel: '#161022',
    panelAlt: '#1F1733',
    border: '#2A2140',
    accent: '#9D4EDD',
    accentBright: '#D4A5FF',
    text: '#ECE6F5',
    textDim: '#9A8FB0',
    amber: '#FFB300',
    danger: '#FF5470',
    success: '#56D364',
    foreign: '#4DD0E1', // cyan for foreign territories
    foreignFill: 'rgba(77, 208, 225, 0.18)',
    ownFill: 'rgba(157, 78, 221, 0.30)',
  },
  radius: 12,
} as const;

// Rarity palette for inventory items.
export const rarityColor: Record<string, string> = {
  common: '#9A8FB0',
  uncommon: '#56D364',
  rare: '#4DA3FF',
  epic: '#9D4EDD',
  legendary: '#FFB300',
};

export function colorForRarity(rarity: string | undefined): string {
  if (!rarity) return rarityColor.common;
  return rarityColor[rarity.toLowerCase()] ?? rarityColor.common;
}

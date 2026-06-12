// ============================================================
// Small formatting helpers shared across components.
// ============================================================

import type { InventoryItem } from './api/types';

/** Human countdown like "1h 12m" / "4m 09s" until an ISO timestamp. */
export function countdownTo(iso: string | null): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ready';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

/** Pretty area: m² under 1 km², else km². */
export function formatArea(m2: number | undefined): string {
  if (!m2 || m2 <= 0) return '—';
  if (m2 < 1_000_000) return `${Math.round(m2).toLocaleString()} m²`;
  return `${(m2 / 1_000_000).toFixed(2)} km²`;
}

const BUILDING_LABELS: Record<string, string> = {
  shield_generator: 'Shield Generator',
  refinery: 'Refinery',
};

export function buildingLabel(type: string): string {
  return BUILDING_LABELS[type] ?? type;
}

/** Title-case a snake/kebab token: "shield_generator" → "Shield Generator". */
export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Item instances carry no human name on the server — only category + rarity +
 * lore/def_stats blobs. Derive the best display name we can.
 */
export function itemDisplayName(item: InventoryItem): string {
  const lore = item.lore ?? {};
  const stats = item.def_stats ?? {};
  const candidate =
    (lore.name as string | undefined) ??
    (lore.title as string | undefined) ??
    (stats.name as string | undefined);
  if (candidate && typeof candidate === 'string') return candidate;
  const base = titleCase(item.category);
  return item.mint_number ? `${base} #${item.mint_number}` : base;
}

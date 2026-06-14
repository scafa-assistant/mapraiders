// ============================================================
// Commander layer helpers — H3 geometry, unit-domain inference,
// rarity colors, cost math, and the dark "radar" map style.
// All combat is server-resolved; these are pure presentation utils.
// ============================================================

import { cellToBoundary, cellToLatLng, gridDistance } from 'h3-js';

// ─── Palette ─────────────────────────────────────────────────────────────────

export const COMMANDER_COLORS = {
  bg: '#0C0914',
  surface: '#15101F',
  border: '#241A33',
  accent: '#9D4EDD', // violet
  own: '#9D4EDD',
  foreign: '#22D3EE', // cyan
  vision: '#9D4EDD',
  enemy: '#FF4757',
  text: '#FFFFFF',
  textSecondary: '#8B7FA8',
  warning: '#FFB800',
  air: '#22D3EE',
  naval: '#3B82F6',
  ground: '#F59E0B',
} as const;

export type LatLng = { latitude: number; longitude: number };

// ─── H3 geometry ───────────────────────────────────────────────────────────────

/**
 * Convert an H3 cell to a closed polygon ring usable by react-native-maps.
 * h3-js v4 `cellToBoundary(cell)` returns [[lat, lng], ...] in degrees.
 */
export function cellToPolygon(cell: string): LatLng[] {
  try {
    const boundary = cellToBoundary(cell); // [[lat, lng], ...]
    return boundary.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
  } catch {
    return [];
  }
}

/** Center point of an H3 cell. h3-js v4 `cellToLatLng(cell)` returns [lat, lng]. */
export function cellCenter(cell: string): LatLng | null {
  try {
    const [lat, lng] = cellToLatLng(cell);
    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

/** Grid distance (in cells) between two H3 cells; null if h3 cannot compute it. */
export function safeGridDistance(a: string, b: string): number | null {
  try {
    const d = gridDistance(a, b);
    return d >= 0 ? d : null;
  } catch {
    return null;
  }
}

/**
 * Build a marker coordinate interpolated along a movement path by `progress`
 * (0..1). Falls back to the first/last available center.
 */
export function pathPositionAt(path: string[], progress: number): LatLng | null {
  if (!path || path.length === 0) return null;
  if (path.length === 1) return cellCenter(path[0]);

  const clamped = Math.max(0, Math.min(1, progress));
  const span = path.length - 1;
  const exact = clamped * span;
  const idx = Math.min(span - 1, Math.floor(exact));
  const frac = exact - idx;

  const a = cellCenter(path[idx]);
  const b = cellCenter(path[idx + 1]);
  if (!a || !b) return a ?? b;

  return {
    latitude: a.latitude + (b.latitude - a.latitude) * frac,
    longitude: a.longitude + (b.longitude - a.longitude) * frac,
  };
}

/** Full polyline of a path (cell centers). Empty cells are skipped. */
export function pathPolyline(path: string[]): LatLng[] {
  if (!path) return [];
  return path
    .map((c) => cellCenter(c))
    .filter((p): p is LatLng => p !== null);
}

// ─── Unit domain inference ─────────────────────────────────────────────────────

export type UnitDomain = 'air' | 'naval' | 'ground';

/**
 * Infer a unit's combat domain. Prefer explicit `stats.domain` when the server
 * exposes it; otherwise fall back to a definition_id → domain mapping.
 */
export function inferDomain(
  definitionId: string,
  stats?: Record<string, number | string>
): UnitDomain {
  const explicit = stats?.domain;
  if (explicit === 'air' || explicit === 'naval' || explicit === 'ground') {
    return explicit;
  }
  const id = (definitionId || '').toLowerCase();
  if (id.includes('scout_disc') || id.includes('tech_drone') || id.includes('disc') || id.includes('drone')) {
    return 'air';
  }
  if (id.includes('water_strider') || id.includes('strider') || id.includes('naval') || id.includes('ship')) {
    return 'naval';
  }
  return 'ground'; // forest_construct and everything else
}

export const DOMAIN_LABELS: Record<UnitDomain, string> = {
  air: 'Air',
  naval: 'Naval',
  ground: 'Ground',
};

export const DOMAIN_ICONS: Record<UnitDomain, string> = {
  air: 'airplane',
  naval: 'boat',
  ground: 'shield-half',
};

export function domainColor(domain: UnitDomain): string {
  return COMMANDER_COLORS[domain];
}

// ─── Hauler units (Phase F.2) ────────────────────────────────────────────────

/** Default carry capacity per hauler definition (server is authoritative). */
const HAULER_CARRY: Record<string, number> = {
  unit_porter: 120,
  unit_transport: 70,
  unit_armored_transport: 90,
};

/** A unit is a hauler when it has a carry stat or a known hauler definition_id. */
export function isHauler(definitionId: string, stats?: Record<string, number | string>): boolean {
  if (carryCapacity(definitionId, stats) > 0) return true;
  return (definitionId || '') in HAULER_CARRY;
}

/**
 * Carry capacity of a unit. Prefers explicit `stats.carry`, falls back to the
 * known hauler definition table, else 0 (not a hauler).
 */
export function carryCapacity(
  definitionId: string,
  stats?: Record<string, number | string>
): number {
  const raw = stats?.carry;
  if (typeof raw === 'number' && raw > 0) return raw;
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n > 0) return n;
  }
  return HAULER_CARRY[definitionId || ''] ?? 0;
}

/**
 * Format a haul cargo manifest like `{ wood: 120, stone: 40 }` into a short
 * string: "120 wood, 40 stone". Returns null when nothing is loaded.
 */
export function formatLoad(load?: Partial<Record<string, number>>): string | null {
  if (!load) return null;
  const parts = Object.entries(load)
    .filter(([, amt]) => typeof amt === 'number' && amt > 0)
    .map(([res, amt]) => `${amt} ${res}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

// ─── Rarity colors ─────────────────────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  common: '#8B7FA8',
  uncommon: '#00FF88',
  rare: '#00D4FF',
  epic: '#9D4EDD',
  legendary: '#FFB800',
  mythic: '#FF4757',
};

export function rarityColor(rarity: string): string {
  return RARITY_COLORS[(rarity || '').toLowerCase()] ?? RARITY_COLORS.common;
}

// ─── Cost / ETA math (client-side estimates; server is authoritative) ──────────

/** Scout: ~cells × 2 energy, ETA cells × 4 min. */
export function scoutEstimate(cells: number): { energy: number; etaMin: number } {
  return { energy: cells * 2, etaMin: cells * 4 };
}

/** Attack: cells × units × 1 energy, ETA cells × 6 min. */
export function attackEstimate(cells: number, units: number): { energy: number; etaMin: number } {
  return { energy: cells * units * 1, etaMin: cells * 6 };
}

// ─── Formatting ────────────────────────────────────────────────────────────────

/** Prettify a definition_id like "unit_scout_disc" → "Scout Disc". */
export function prettifyDefinitionId(definitionId: string): string {
  return (definitionId || '')
    .replace(/^unit_/, '')
    .replace(/^dice_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** A short "in Xm Ys" / "in Xs" countdown string from an ISO/epoch ETA. */
export function formatCountdown(target: string | number): string {
  const targetMs = typeof target === 'number' ? target : Date.parse(target);
  if (isNaN(targetMs)) return '--';
  const diffMs = targetMs - Date.now();
  if (diffMs <= 0) return 'arriving';
  const totalSec = Math.floor(diffMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min <= 0) return `${sec}s`;
  return `${min}m ${sec.toString().padStart(2, '0')}s`;
}

// ─── Dark "radar" map style ─────────────────────────────────────────────────────
// Near-black geometry, no POIs/labels except administrative outlines.

export const RADAR_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0C0914' }] },
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3A2E50' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0C0914' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#2A1F3D' }, { visibility: 'on' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B5A85' }, { visibility: 'on' }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0E0A18' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#150F22' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0C0914' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A0712' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0C0914' }] },
];

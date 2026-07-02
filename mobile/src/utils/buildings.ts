// ─────────────────────────────────────────────────────────────────────────────
// Base builder client-side constants. These MIRROR the server BUILDINGS and
// TRAINING config (server/src/config). Kept here so the isometric base view and
// the building picker share one source of truth. If the server config changes,
// update this map to match.
// ─────────────────────────────────────────────────────────────────────────────

import type { ImageSourcePropType } from 'react-native';
import type { BuildingType } from '../services/api';

/** Square build grid cell size in m² (matches server grid.cell_m2). */
export const CELL_M2 = 25;

/** Meters per degree of latitude (constant everywhere; longitude scales by cos(lat)). */
export const METERS_PER_DEG_LAT = 111320;

/** Build grid cell edge length in meters. cell_m2 = 25 → 5 m per side. */
export const CELL_SIZE_M = 5;

/** Max units trainable per single request (matches server TRAINING cap). */
export const MAX_TRAIN_BATCH = 10;

/** Footprint in grid cells [width, height] per building type (matches server BUILDINGS.FOOTPRINT). */
export const FOOTPRINTS: Record<BuildingType, [number, number]> = {
  shield_generator: [2, 2],
  refinery: [2, 3],
  radar: [2, 2],
  garrison: [3, 3],
  silo: [3, 3],
  teleporter: [2, 2],
  sawmill: [2, 2],
  quarry: [3, 3],
  farm: [4, 4],
  fishery: [2, 3],
  military_base: [5, 5],
  airport: [8, 6],
  datacenter: [3, 3],
};

/** Minimum player level required to construct a building. Absent = no requirement. */
export const MIN_LEVEL: Partial<Record<BuildingType, number>> = {
  military_base: 5,
  datacenter: 8,
  airport: 12,
};

/** Base construction cost per building type (matches server BUILDINGS costs). */
export const BUILD_COSTS: Record<BuildingType, { energy: number; tech: number }> = {
  shield_generator: { energy: 200, tech: 100 },
  refinery: { energy: 150, tech: 80 },
  radar: { energy: 180, tech: 120 },
  garrison: { energy: 250, tech: 150 },
  silo: { energy: 400, tech: 250 },
  teleporter: { energy: 300, tech: 200 },
  sawmill: { energy: 120, tech: 40 },
  quarry: { energy: 150, tech: 60 },
  farm: { energy: 120, tech: 30 },
  fishery: { energy: 130, tech: 40 },
  military_base: { energy: 500, tech: 300 },
  airport: { energy: 1200, tech: 800 },
  datacenter: { energy: 400, tech: 350 },
};

/** Category drives the isometric block color. No purple/violet anywhere. */
export type BuildingCategory = 'defense' | 'economy' | 'intel' | 'military' | 'datacenter';

export const CATEGORY: Record<BuildingType, BuildingCategory> = {
  shield_generator: 'defense',
  garrison: 'defense',
  silo: 'defense',
  refinery: 'economy',
  sawmill: 'economy',
  quarry: 'economy',
  farm: 'economy',
  fishery: 'economy',
  radar: 'intel',
  teleporter: 'intel',
  military_base: 'military',
  airport: 'military',
  datacenter: 'datacenter',
};

/** Top-face emoji label per building type. */
export const BUILDING_EMOJI: Record<BuildingType, string> = {
  shield_generator: '🛡️',
  refinery: '⚡',
  radar: '📡',
  garrison: '🏰',
  silo: '🚀',
  teleporter: '🌀',
  sawmill: '🪵',
  quarry: '⛏️',
  farm: '🌾',
  fishery: '🐟',
  military_base: '🎖️',
  airport: '✈️',
  datacenter: '🖥️',
};

/** Isometric block face colors per category (top / left / right). */
export const CATEGORY_COLORS: Record<BuildingCategory, { top: string; left: string; right: string }> = {
  defense: { top: '#3E78F5', left: '#1B4FCC', right: '#123B9E' },
  economy: { top: '#F5A623', left: '#C77E12', right: '#9E6109' },
  intel: { top: '#17B6C4', left: '#0E8792', right: '#0A6670' },
  military: { top: '#5B6B4A', left: '#3F4A33', right: '#2C3524' },
  datacenter: { top: '#6E7FA6', left: '#4C5A7E', right: '#37425E' },
};

/** A single trainable-unit recipe (matches server TRAINING.RECIPES). */
export interface TrainingRecipe {
  /** Server unit id, e.g. 'unit_militia'. */
  unit: string;
  minLevel: number;
  costEnergy: number;
  costTech: number;
  atk: number;
  def: number;
  emoji: string;
}

/** Which building trains which units. */
export const TRAINING: Record<'military_base' | 'airport', TrainingRecipe[]> = {
  military_base: [
    { unit: 'unit_militia', minLevel: 1, costEnergy: 30, costTech: 5, atk: 1, def: 1, emoji: '🪖' },
    { unit: 'unit_infantry', minLevel: 5, costEnergy: 60, costTech: 20, atk: 2, def: 2, emoji: '🔫' },
    { unit: 'unit_ranger', minLevel: 10, costEnergy: 120, costTech: 50, atk: 3, def: 2, emoji: '🎯' },
    { unit: 'unit_commando', minLevel: 15, costEnergy: 250, costTech: 120, atk: 4, def: 3, emoji: '🗡️' },
  ],
  airport: [
    { unit: 'unit_recon_uav', minLevel: 12, costEnergy: 100, costTech: 80, atk: 1, def: 1, emoji: '🛰️' },
    { unit: 'unit_gunship', minLevel: 15, costEnergy: 300, costTech: 200, atk: 4, def: 2, emoji: '🚁' },
    { unit: 'unit_jet', minLevel: 20, costEnergy: 600, costTech: 450, atk: 6, def: 3, emoji: '✈️' },
  ],
};

/** Building types that train units. */
export type TrainerType = keyof typeof TRAINING;

export function isTrainer(type: BuildingType): type is TrainerType {
  return type === 'military_base' || type === 'airport';
}

/** Cells occupied by a footprint. */
export function footprintCells(type: BuildingType): number {
  const [w, h] = FOOTPRINTS[type];
  return w * h;
}

// ─────────────────────────────────────────────────────────────────────────────
// Geo grid mapping (base builder v2). The build grid is anchored to the
// south-west corner of the territory polygon's bounding box. Cell (x, y) covers
// [minLng + x*dLng .. +dLng] × [minLat + y*dLat .. +dLat]; x runs east, y north.
// All helpers are pure and deterministic so the client can draw and hit-test the
// grid without a round trip.
// ─────────────────────────────────────────────────────────────────────────────

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Degree size of one grid cell at the given anchor latitude. */
export function cellDeltas(minLat: number): { dLat: number; dLng: number } {
  const dLat = CELL_SIZE_M / METERS_PER_DEG_LAT;
  const dLng = CELL_SIZE_M / (METERS_PER_DEG_LAT * Math.cos((minLat * Math.PI) / 180));
  return { dLat, dLng };
}

/** Four corner coordinates of a footprint rect anchored at cell (x, y), size w×h. */
export function footprintRect(
  minLat: number,
  minLng: number,
  x: number,
  y: number,
  w: number,
  h: number
): LatLng[] {
  const { dLat, dLng } = cellDeltas(minLat);
  const west = minLng + x * dLng;
  const east = minLng + (x + w) * dLng;
  const south = minLat + y * dLat;
  const north = minLat + (y + h) * dLat;
  return [
    { latitude: south, longitude: west },
    { latitude: south, longitude: east },
    { latitude: north, longitude: east },
    { latitude: north, longitude: west },
  ];
}

/** Center coordinate of a footprint rect anchored at cell (x, y), size w×h. */
export function footprintCenter(
  minLat: number,
  minLng: number,
  x: number,
  y: number,
  w: number,
  h: number
): LatLng {
  const { dLat, dLng } = cellDeltas(minLat);
  return {
    latitude: minLat + (y + h / 2) * dLat,
    longitude: minLng + (x + w / 2) * dLng,
  };
}

/** Map a coordinate to the grid cell containing it (may fall outside the grid). */
export function coordToCell(
  minLat: number,
  minLng: number,
  lat: number,
  lng: number
): { x: number; y: number } {
  const { dLat, dLng } = cellDeltas(minLat);
  return {
    x: Math.floor((lng - minLng) / dLng),
    y: Math.floor((lat - minLat) / dLat),
  };
}

/** Bundled ground sprite per building type (drawn as a Marker on the real map). */
export const BUILDING_SPRITE: Record<BuildingType, ImageSourcePropType> = {
  shield_generator: require('../../assets/buildings/shield_generator.png'),
  refinery: require('../../assets/buildings/refinery.png'),
  radar: require('../../assets/buildings/radar.png'),
  garrison: require('../../assets/buildings/garrison.png'),
  silo: require('../../assets/buildings/silo.png'),
  teleporter: require('../../assets/buildings/teleporter.png'),
  sawmill: require('../../assets/buildings/sawmill.png'),
  quarry: require('../../assets/buildings/quarry.png'),
  farm: require('../../assets/buildings/farm.png'),
  fishery: require('../../assets/buildings/fishery.png'),
  military_base: require('../../assets/buildings/military_base.png'),
  airport: require('../../assets/buildings/airport.png'),
  datacenter: require('../../assets/buildings/datacenter.png'),
};

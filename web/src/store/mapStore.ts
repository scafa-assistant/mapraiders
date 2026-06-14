// ============================================================
// Map store — territories + PvE spawns in the current viewport, and the
// currently selected territory (drives the side panel).
// Loads are debounced by the MapView on 'moveend'; this store just holds
// the data and de-dupes in-flight bbox loads.
// ============================================================

import type L from 'leaflet';
import { create } from 'zustand';
import { pveApi, territoryApi } from '../api/client';
import { useFeatureStore } from './featureStore';
import type { MyTerritory, PveSpawn, Territory } from '../api/types';

/**
 * The live Leaflet map instance lives outside React state (mutable ref).
 * MapView registers it on mount; panels recenter the map via flyToTerritory.
 * Kept off the zustand store value so it never triggers re-renders.
 */
let mapInstance: L.Map | null = null;
export function registerMap(map: L.Map | null): void {
  mapInstance = map;
}
export function getMapInstance(): L.Map | null {
  return mapInstance;
}
/** Recenter the live map on a point. No-op if the map isn't mounted yet. */
export function flyToTerritory(lat: number, lng: number, zoom = 16): void {
  if (mapInstance) mapInstance.flyTo([lat, lng], zoom);
}

export interface BBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapState {
  territories: Territory[];
  spawns: PveSpawn[];
  selectedId: string | null;
  selectedSpawnId: string | null;
  loading: boolean;

  /** The signed-in user's owned territories (centroids), for the "My Territories" list. */
  myTerritories: MyTerritory[];
  myLoading: boolean;

  loadViewport: (bbox: BBox) => Promise<void>;
  loadMine: () => Promise<void>;
  select: (id: string | null) => void;
  selectSpawn: (id: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  territories: [],
  spawns: [],
  selectedId: null,
  selectedSpawnId: null,
  loading: false,
  myTerritories: [],
  myLoading: false,

  loadViewport: async (bbox) => {
    set({ loading: true });
    const pveEnabled = useFeatureStore.getState().isEnabled('pve_spawns');

    // bbox string for the PvE endpoint: "minLng,minLat,maxLng,maxLat".
    const bboxStr = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;

    const [territories, spawns] = await Promise.all([
      territoryApi.getInBounds(bbox).catch(() => [] as Territory[]),
      pveEnabled
        ? pveApi.getSpawnsInBounds(bboxStr).catch(() => [] as PveSpawn[])
        : Promise.resolve([] as PveSpawn[]),
    ]);

    set({ territories, spawns, loading: false });
  },

  loadMine: async () => {
    set({ myLoading: true });
    try {
      const myTerritories = await territoryApi.mine();
      set({ myTerritories, myLoading: false });
    } catch {
      set({ myLoading: false });
    }
  },

  select: (id) => set({ selectedId: id, selectedSpawnId: null }),
  selectSpawn: (id) => set({ selectedSpawnId: id, selectedId: null }),
}));

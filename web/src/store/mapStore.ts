// ============================================================
// Map store — territories + PvE spawns in the current viewport, and the
// currently selected territory (drives the side panel).
// Loads are debounced by the MapView on 'moveend'; this store just holds
// the data and de-dupes in-flight bbox loads.
// ============================================================

import { create } from 'zustand';
import { pveApi, territoryApi } from '../api/client';
import { useFeatureStore } from './featureStore';
import type { PveSpawn, Territory } from '../api/types';

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
  loading: boolean;

  loadViewport: (bbox: BBox) => Promise<void>;
  select: (id: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  territories: [],
  spawns: [],
  selectedId: null,
  loading: false,

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

  select: (id) => set({ selectedId: id }),
}));

import { create } from 'zustand';
import api, { territoryApi } from '../services/api';
import { Territory, BoundingBox, GpsPoint, MovementClass } from '../navigation/types';

/** Convert a single server territory object to client Territory format */
function mapServerTerritory(t: any): Territory | null {
  if (!t) return null;

  // Convert GeoJSON polygon to GpsPoint array
  let polygon: GpsPoint[] = [];
  if (t.polygon?.type === 'Polygon' && t.polygon.coordinates?.[0]) {
    // GeoJSON format: coordinates are [lng, lat] — swap to {latitude, longitude}
    polygon = t.polygon.coordinates[0].map(([lng, lat]: [number, number]) => ({
      latitude: lat,
      longitude: lng,
      timestamp: 0,
    }));
  } else if (Array.isArray(t.polygon)) {
    // Already in GpsPoint[] format
    polygon = t.polygon;
  }

  if (polygon.length < 3) return null;

  return {
    id: t.id,
    ownerId: t.owner_id ?? t.ownerId,
    ownerUsername: t.owner_username ?? t.ownerUsername ?? '',
    polygon,
    claimedAt: t.claimed_at ?? t.claimedAt,
    decayPercent: (parseFloat(t.decay_level) || 0) * 100,
    movementClass: (t.class ?? t.movementClass ?? 'walker') as MovementClass,
    area: parseFloat(t.area_m2) || t.area || 0,
    color: t.color || t.owner_color || '',
    hasDefense: t.has_defense ?? t.hasDefense ?? false,
    defenseGameType: t.defense_game_type ?? t.defenseGameType ?? undefined,
  };
}

/** Extract territory array from various server response formats */
function extractTerritories(responseData: any): Territory[] {
  // Server sends { success, data: { territories: [...] } }
  // Axios gives us response.data = { success, data: { territories: [...] } }
  const data = responseData?.data ?? responseData;
  const raw = data?.territories ?? data?.data?.territories ?? (Array.isArray(data) ? data : []);
  if (!Array.isArray(raw)) return [];
  return raw.map(mapServerTerritory).filter((t: Territory | null): t is Territory => t !== null);
}

interface TerritoryState {
  territories: Territory[];
  myTerritories: Territory[];
  selectedTerritory: Territory | null;
  isLoading: boolean;
  error: string | null;
  fetchTerritories: (bbox: BoundingBox) => Promise<void>;
  fetchMyTerritories: () => Promise<void>;
  selectTerritory: (territory: Territory | null) => void;
  challengeTerritory: (territoryId: string) => Promise<boolean>;
}

export const useTerritoryStore = create<TerritoryState>((set, _get) => ({
  territories: [],
  myTerritories: [],
  selectedTerritory: null,
  isLoading: false,
  error: null,

  fetchTerritories: async (bbox: BoundingBox) => {
    set({ isLoading: true, error: null });
    try {
      const response = await territoryApi.getInBounds({
        north: bbox.north,
        south: bbox.south,
        east: bbox.east,
        west: bbox.west,
      });
      const territories = extractTerritories(response.data);
      set({ territories, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to load territories.',
      });
    }
  },

  fetchMyTerritories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await territoryApi.getMine();
      const myTerritories = extractTerritories(response.data);
      set({ myTerritories, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to load your territories.',
      });
    }
  },

  selectTerritory: (territory: Territory | null) => {
    set({ selectedTerritory: territory });
  },

  challengeTerritory: async (territoryId: string) => {
    try {
      const response = await api.post(`/territories/${territoryId}/challenge`);
      return response.data.success;
    } catch (_err) {
      return false;
    }
  },
}));

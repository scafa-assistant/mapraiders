import { create } from 'zustand';
import api, { territoryApi } from '../services/api';
import { Territory, BoundingBox } from '../navigation/types';

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
      set({ territories: response.data, isLoading: false });
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
      set({ myTerritories: response.data, isLoading: false });
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

import { create } from 'zustand';
import axios from 'axios';
import { Territory, BoundingBox } from '../navigation/types';

const API_BASE = 'https://api.gridwalker.app';

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
      const response = await axios.get(`${API_BASE}/territories`, {
        params: {
          north: bbox.north,
          south: bbox.south,
          east: bbox.east,
          west: bbox.west,
        },
      });
      set({ territories: response.data, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to load territories.',
      });
    }
  },

  fetchMyTerritories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/territories/mine`);
      set({ myTerritories: response.data, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to load your territories.',
      });
    }
  },

  selectTerritory: (territory: Territory | null) => {
    set({ selectedTerritory: territory });
  },

  challengeTerritory: async (territoryId: string) => {
    try {
      const response = await axios.post(`${API_BASE}/territories/${territoryId}/challenge`);
      return response.data.success;
    } catch (_err) {
      return false;
    }
  },
}));

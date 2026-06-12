import { create } from 'zustand';
import { buildingApi, BuildingType } from '../services/api';
import type { Building } from '../services/api';
import { useResourceStore } from './resourceStore';

// ─── Error code → user-readable message map ──────────────────────────────────

const BUILD_ERROR_MESSAGES: Record<string, string> = {
  NOT_OWNER: 'You do not own this territory.',
  NO_SLOTS: 'This territory has no free building slots.',
  DUPLICATE_TYPE: 'A building of this type already exists here.',
  INSUFFICIENT_RESOURCES: 'Not enough resources to construct this building.',
  INVALID_TYPE: 'Unknown building type.',
  TERRITORY_NOT_FOUND: 'Territory not found.',
  BUILDING_NOT_FOUND: 'Building not found.',
  NOT_DEMOLISHABLE: 'This building cannot be demolished.',
};

function resolveBuildError(message: string): string {
  return BUILD_ERROR_MESSAGES[message] ?? message;
}

// ─── State type ──────────────────────────────────────────────────────────────

interface BuildingState {
  /** Buildings keyed by territory ID. */
  buildingsByTerritory: Record<string, Building[]>;
  loading: boolean;
  error: string | null;
  // Actions
  fetchBuildings: (territoryId: string) => Promise<void>;
  build: (territoryId: string, type: BuildingType) => Promise<{ success: boolean; message?: string }>;
  demolish: (buildingId: string, territoryId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useBuildingStore = create<BuildingState>((set, get) => ({
  buildingsByTerritory: {},
  loading: false,
  error: null,

  /**
   * Fetch all buildings for the given territory.
   * Silently swallows errors — buildings are additive and must not block the screen.
   */
  fetchBuildings: async (territoryId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await buildingApi.list(territoryId);
      const buildings: Building[] = response.data?.data?.buildings ?? [];
      set((state) => ({
        buildingsByTerritory: { ...state.buildingsByTerritory, [territoryId]: buildings },
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  /**
   * Construct a new building on a territory.
   * No optimistic update — refetches after success and refreshes resource balances.
   */
  build: async (territoryId: string, type: BuildingType) => {
    set({ loading: true, error: null });
    try {
      await buildingApi.build(territoryId, type);
      // Refetch both buildings and resource balances
      await get().fetchBuildings(territoryId);
      useResourceStore.getState().fetchResources();
      set({ loading: false });
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveBuildError(raw);
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  /**
   * Demolish a building (50% refund from server).
   * Refetches buildings and resource balances after success.
   */
  demolish: async (buildingId: string, territoryId: string) => {
    set({ loading: true, error: null });
    try {
      await buildingApi.demolish(buildingId);
      await get().fetchBuildings(territoryId);
      useResourceStore.getState().fetchResources();
      set({ loading: false });
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      set({ loading: false, error: raw });
      return { success: false, message: raw };
    }
  },

  clearError: () => set({ error: null }),
}));

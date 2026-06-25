import { create } from 'zustand';
import { buildingApi, BuildingType } from '../services/api';
import type { Building, StockpileEntry } from '../services/api';
import { useResourceStore } from './resourceStore';
import { strings as S } from '../i18n';

// ─── Error code → i18n key map ───────────────────────────────────────────────
// Resolved at call time so the current language is always used.

const BUILD_ERROR_KEYS: Record<string, keyof typeof S.map.territoryDetail> = {
  NOT_OWNER: 'buildErrNotOwner',
  NO_SLOTS: 'buildErrNoSlots',
  DUPLICATE_TYPE: 'buildErrDuplicateType',
  INSUFFICIENT_RESOURCES: 'buildErrInsufficientResources',
  INVALID_TYPE: 'buildErrInvalidType',
  TERRITORY_NOT_FOUND: 'buildErrTerritoryNotFound',
  BUILDING_NOT_FOUND: 'buildErrBuildingNotFound',
  NOT_DEMOLISHABLE: 'buildErrNotDemolishable',
  MAX_TIER: 'buildErrMaxTier',
  NOT_UPGRADABLE: 'buildErrNotUpgradable',
  // Phase F.1 — biome extraction (economy flag)
  BIOME_MISMATCH: 'buildErrBiomeMismatch',
  FEATURE_DISABLED: 'buildErrFeatureDisabled',
};

function resolveBuildError(message: string): string {
  const key = BUILD_ERROR_KEYS[message];
  return key ? (S.map.territoryDetail[key] as string) : message;
}

// ─── State type ──────────────────────────────────────────────────────────────

interface BuildingState {
  /** Buildings keyed by territory ID. */
  buildingsByTerritory: Record<string, Building[]>;
  /** Per-territory raw resource stockpile (Phase F.1) — empty when economy flag off. */
  stockpileByTerritory: Record<string, StockpileEntry[]>;
  loading: boolean;
  error: string | null;
  // Actions
  fetchBuildings: (territoryId: string) => Promise<void>;
  build: (territoryId: string, type: BuildingType) => Promise<{ success: boolean; message?: string }>;
  upgrade: (buildingId: string, territoryId: string) => Promise<{ success: boolean; message?: string }>;
  demolish: (buildingId: string, territoryId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useBuildingStore = create<BuildingState>((set, get) => ({
  buildingsByTerritory: {},
  stockpileByTerritory: {},
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
      const stockpile: StockpileEntry[] = response.data?.data?.stockpile ?? [];
      set((state) => ({
        buildingsByTerritory: { ...state.buildingsByTerritory, [territoryId]: buildings },
        stockpileByTerritory: { ...state.stockpileByTerritory, [territoryId]: stockpile },
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
   * Upgrade a building to the next tier.
   * Status will be 'building' on the returned building until completes_at.
   */
  upgrade: async (buildingId: string, territoryId: string) => {
    set({ loading: true, error: null });
    try {
      await buildingApi.upgrade(buildingId);
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

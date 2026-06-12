import { create } from 'zustand';
import { inventoryApi } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ItemInstance {
  id: string;
  definition_id: string;
  category: string;
  rarity: string;
  status: string;
  stats: Record<string, number | string>;
  /** Per-instance mutable state (e.g. dice carry `{equipped: true}`). */
  state?: Record<string, unknown> | null;
  lore: string | null;
  mint_number: number | null;
}

interface InventoryFilters {
  category?: string;
  status?: string;
}

interface InventoryState {
  items: ItemInstance[];
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchInventory: (filters?: InventoryFilters) => Promise<void>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchInventory: async (filters?: InventoryFilters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await inventoryApi.getAll(filters);
      const items: ItemInstance[] = response.data?.data?.items ?? [];
      set({ items, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory.';
      set({ isLoading: false, error: message });
    }
  },
}));

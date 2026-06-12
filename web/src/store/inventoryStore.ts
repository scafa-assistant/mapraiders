// ============================================================
// Inventory store — the player's item instances joined with definitions.
// ============================================================

import { create } from 'zustand';
import { errorMessage, inventoryApi } from '../api/client';
import type { InventoryItem } from '../api/types';

interface InventoryState {
  items: InventoryItem[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  loaded: false,
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const items = await inventoryApi.getAll();
      set({ items, loaded: true, loading: false });
    } catch (err) {
      set({ loading: false, error: errorMessage(err, 'Failed to load inventory') });
    }
  },
}));

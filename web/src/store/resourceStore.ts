// ============================================================
// Resource store — energy / tech / intel balances.
// Only meaningful when the `resources` flag is enabled; otherwise the HUD
// hides itself and this store simply stays at zero.
// ============================================================

import { create } from 'zustand';
import { resourceApi } from '../api/client';
import type { ResourceBalances } from '../api/types';

interface ResourceState {
  balances: ResourceBalances;
  loaded: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ZERO: ResourceBalances = { energy: 0, tech: 0, intel: 0, wood: 0, stone: 0, food: 0 };

export const useResourceStore = create<ResourceState>((set) => ({
  balances: ZERO,
  loaded: false,
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const data = await resourceApi.get();
      // Merge fetched balances over ZERO so that new keys (wood/stone/food)
      // default to 0 even if the server omits them (old build / flag off).
      set({ balances: { ...ZERO, ...data.balances }, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));

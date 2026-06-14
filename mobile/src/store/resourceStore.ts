import { create } from 'zustand';
import { resourceApi } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResourceBalances {
  energy: number;
  tech: number;
  intel: number;
  // Phase F.1 — raw economy resources (0 when the economy flag is off)
  wood: number;
  stone: number;
  food: number;
}

export interface ResourceTransaction {
  id: string;
  type: string;
  amount: number;
  resource: keyof ResourceBalances;
  description: string | null;
  created_at: string;
}

const DEFAULT_BALANCES: ResourceBalances = {
  energy: 0,
  tech: 0,
  intel: 0,
  wood: 0,
  stone: 0,
  food: 0,
};

interface ResourceState {
  balances: ResourceBalances;
  transactions: ResourceTransaction[];
  isLoading: boolean;
  // Actions
  fetchResources: () => Promise<void>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useResourceStore = create<ResourceState>((set) => ({
  balances: DEFAULT_BALANCES,
  transactions: [],
  isLoading: false,

  fetchResources: async () => {
    set({ isLoading: true });
    try {
      const response = await resourceApi.get();
      const data = response.data?.data ?? {};
      const balances: ResourceBalances = {
        energy: data.balances?.energy ?? 0,
        tech: data.balances?.tech ?? 0,
        intel: data.balances?.intel ?? 0,
        wood: data.balances?.wood ?? 0,
        stone: data.balances?.stone ?? 0,
        food: data.balances?.food ?? 0,
      };
      const transactions: ResourceTransaction[] = data.transactions ?? [];
      set({ balances, transactions, isLoading: false });
    } catch {
      // Keep existing balances on error, just stop loading
      set({ isLoading: false });
    }
  },
}));

import { create } from 'zustand';
import { pveApi, HackInputTrace } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NpcType =
  | 'scout_disc'
  | 'tech_drone'
  | 'aether_leech'
  | 'water_strider_source'
  | 'forest_construct_source'
  | 'terminal';

export interface PvESpawn {
  id: string;
  npc_type: NpcType;
  /** 1 = easy, 2 = medium, 3 = hard */
  level: 1 | 2 | 3;
  latitude: number;
  longitude: number;
  biome: string;
  expires_at: string;
}

export interface HackLoot {
  resources?: {
    energy?: number;
    tech?: number;
    intel?: number;
  };
  items?: Array<{
    definition_id: string;
    rarity: string;
  }>;
}

export interface HackResult {
  success: boolean;
  loot?: HackLoot;
  /** Server error codes: 'TOO_FAR' | 'DAILY_CAP' | other message strings */
  message?: string;
}

interface PvEState {
  spawns: PvESpawn[];
  isHacking: boolean;
  lastLoot: HackLoot | null;
  error: string | null;
  // Actions
  fetchSpawns: (bbox: string) => Promise<void>;
  submitHack: (spawnId: string, inputTrace: HackInputTrace) => Promise<HackResult>;
  clearLoot: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const usePveStore = create<PvEState>((set) => ({
  spawns: [],
  isHacking: false,
  lastLoot: null,
  error: null,

  /**
   * Fetch spawns for the given bbox string ("minLng,minLat,maxLng,maxLat").
   * Silently fails — PvE content must never block map rendering.
   */
  fetchSpawns: async (bbox: string) => {
    try {
      const response = await pveApi.getSpawnsInBounds(bbox);
      const spawns: PvESpawn[] = response.data?.data?.spawns ?? [];
      set({ spawns, error: null });
    } catch {
      // Silently swallow — PvE is an additive feature
    }
  },

  /**
   * Submit a frequency-trace hack attempt.
   * Returns a typed HackResult so callers can react without reading store state.
   */
  submitHack: async (spawnId: string, inputTrace: HackInputTrace): Promise<HackResult> => {
    set({ isHacking: true, error: null });
    try {
      const response = await pveApi.hack(spawnId, inputTrace);
      const data = response.data;
      if (data?.success) {
        const loot: HackLoot = data.data?.loot ?? {};
        set({ isHacking: false, lastLoot: loot });
        return { success: true, loot };
      }
      const msg: string = data?.message ?? 'UNKNOWN_ERROR';
      set({ isHacking: false, error: msg });
      return { success: false, message: msg };
    } catch (err: any) {
      const msg: string = err?.message ?? 'NETWORK_ERROR';
      set({ isHacking: false, error: msg });
      return { success: false, message: msg };
    }
  },

  clearLoot: () => set({ lastLoot: null }),
}));

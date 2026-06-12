// ============================================================
// Commander store — fog-of-war hex map state + scout dispatch +
// troop garrison/march/battle actions (Phase C.2).
// ============================================================

import { create } from 'zustand';
import { api, battlesApi, errorMessage, strikeApi, troopsApi } from '../api/client';
import type { AirstrikeResult, ApiEnvelope, BattleDetail, BattleSummary, CommanderGarrison, CommanderForeignMovement, InventoryItem, SiloInfo } from '../api/types';

// ---- API shapes ----------------------------------------------------------------

export interface CommanderTerritory {
  id: string;
  owner_id: string | null;
  owner_username: string | null;
  claim_value: number;
  h3_cells: string[];
  is_own: boolean;
}

export interface CommanderMovement {
  id: string;
  purpose: 'scout' | 'return' | 'attack' | 'reinforce';
  status: string;
  from_cell: string;
  to_cell: string;
  path: string[];
  departs_at: string;
  arrives_at: string;
  progress: number;
  instance_ids: string[];
  is_own: boolean;
  /** present only on own movements */
  current_cell?: string;
  /** eta for foreign spotted movements */
  eta?: string;
  config?: Record<string, unknown>;
}

export interface CommanderRadar {
  building_id: string;
  territory_id: string;
  covert: boolean;
  cells: string[];
}

/** Hyperborean AI presence (Phase D) — fog-filtered server-side. */
export interface AiZone {
  h3_cell: string;
  phase: 'dormant' | 'triggered' | 'invasion';
}

/** The Hyperborean AI faction's system user id (battle labels). */
export const HYPERBOREAN_AI_USER_ID = '00000000-0000-0000-0000-00000000a111';

export interface CommanderMapData {
  visible_cells: string[];
  territories: CommanderTerritory[];
  movements: CommanderMovement[];
  radars: CommanderRadar[];
  /** Extended in Phase C.2 */
  garrisons?: CommanderGarrison[];
  /** Own active silos (Phase C.3) */
  silos?: SiloInfo[];
  /** Hyperborean-held cells (Phase D); absent on old servers → treat as []. */
  ai_zones?: AiZone[];
}

// Re-export for convenience
export type { CommanderGarrison, CommanderForeignMovement, BattleSummary, BattleDetail, SiloInfo, AirstrikeResult };

// ---- Dispatch state machine types -----------------------------------------------

export type DispatchStep =
  | { phase: 'idle' }
  | { phase: 'picking-unit' }
  | { phase: 'picking-target'; unit: InventoryItem }
  | { phase: 'confirming'; unit: InventoryItem; originTerritoryId: string; targetCell: string; buildRadar: boolean }
  | { phase: 'sending'; unit: InventoryItem; originTerritoryId: string; targetCell: string; buildRadar: boolean };

// ---- Store state ----------------------------------------------------------------

interface CommanderState {
  mapData: CommanderMapData | null;
  loading: boolean;
  error: string | null;
  dispatch: DispatchStep;

  // Battles
  battles: BattleSummary[];
  battlesLoading: boolean;
  battlesError: string | null;

  // Optimistic equipped die tracking (client-side, no server echo)
  equippedDieInstanceId: string | null;

  // Actions
  fetchMap: () => Promise<void>;
  setDispatch: (step: DispatchStep) => void;
  resetDispatch: () => void;
  sendScout: (params: {
    instanceId: string;
    fromTerritoryId: string;
    targetCell: string;
    buildRadar: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  recallScout: (movementId: string) => Promise<{ ok: boolean; error?: string }>;

  // Phase C.2 actions
  deployUnit: (instanceId: string, territoryId: string) => Promise<{ ok: boolean; error?: string }>;
  undeployUnit: (instanceId: string) => Promise<{ ok: boolean; error?: string }>;
  marchTroops: (params: {
    instanceIds: string[];
    fromTerritoryId: string;
    targetTerritoryId: string;
    purpose: 'attack' | 'reinforce';
  }) => Promise<{ ok: boolean; error?: string; teleport?: boolean }>;
  equipDie: (instanceId: string) => Promise<{ ok: boolean; error?: string }>;
  fetchBattles: () => Promise<void>;
  fetchBattleDetail: (id: string) => Promise<BattleDetail | null>;
  launchStrike: (fromTerritoryId: string, targetTerritoryId: string) => Promise<{ ok: true; result: AirstrikeResult } | { ok: false; error: string }>;
}

// ---- Error code → human messages ------------------------------------------------

export function marchErrorLabel(code: string): string {
  switch (code) {
    case 'TARGET_NOT_FOUND':       return 'Target territory not found.';
    case 'CANNOT_ATTACK_SELF':     return 'You cannot attack your own territory.';
    case 'NAVAL_REQUIRES_WATER':   return 'Naval units can only attack water territories.';
    case 'NO_BASE':                return 'Select one of your territories as origin.';
    case 'TARGET_TOO_FAR':         return 'Target is out of range.';
    case 'TOO_MANY_UNITS':         return 'You can march at most 6 units at once.';
    case 'INVALID_UNITS':          return 'One or more selected units are invalid.';
    case 'UNIT_BUSY':              return 'One or more units are already deployed or marching.';
    case 'INSUFFICIENT_RESOURCES': return 'Not enough Energy for this march.';
    case 'GARRISON_FULL':          return 'Garrison is full (max 6).';
    case 'FEATURE_DISABLED':       return 'Commander mode is not enabled for your account.';
    default:                       return code;
  }
}

export function strikeErrorLabel(code: string): string {
  switch (code) {
    case 'NO_BASE':                return 'Select one of your territories as origin.';
    case 'NO_SILO':                return 'No active silo in the origin territory.';
    case 'SILO_COOLDOWN':          return 'Silo is reloading.';
    case 'TARGET_NOT_FOUND':       return 'Target territory not found.';
    case 'CANNOT_STRIKE_SELF':     return 'You cannot airstrike your own territory.';
    case 'TARGET_TOO_FAR':         return 'Target is out of silo range (max 40 cells).';
    case 'INSUFFICIENT_RESOURCES': return 'Not enough Energy (150⚡ required).';
    case 'FEATURE_DISABLED':       return 'Commander mode is not enabled for your account.';
    default:                       return code;
  }
}

export function scoutErrorLabel(code: string): string {
  switch (code) {
    case 'FEATURE_DISABLED':
      return 'Commander mode is not enabled for your account.';
    case 'INSTANCE_NOT_FOUND':
      return 'Selected unit no longer exists.';
    case 'NOT_OWNER':
      return 'You do not own this unit or territory.';
    case 'NOT_A_UNIT':
      return 'Selected item is not a deployable unit.';
    case 'UNIT_BUSY':
      return 'This unit is already deployed.';
    case 'NO_BASE':
      return 'Select one of your territories as origin.';
    case 'TARGET_TOO_FAR':
      return 'Target is out of range.';
    case 'TOO_MANY_SCOUTS':
      return 'All scouts are deployed (max 3).';
    case 'INSUFFICIENT_RESOURCES':
      return 'Not enough Energy.';
    case 'TARGET_PROTECTED':
      return 'Target lies in a protected zone.';
    case 'PATH_FAILED':
      return 'Target is out of range.';
    default:
      return code;
  }
}

// ---- Store ----------------------------------------------------------------------

export const useCommanderStore = create<CommanderState>((set, get) => ({
  mapData: null,
  loading: false,
  error: null,
  dispatch: { phase: 'idle' },
  battles: [],
  battlesLoading: false,
  battlesError: null,
  equippedDieInstanceId: null,

  fetchMap: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<ApiEnvelope<CommanderMapData>>('/commander/map');
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message ?? 'Failed to load commander map');
      }
      set({ mapData: res.data.data, loading: false });
    } catch (err) {
      set({ loading: false, error: errorMessage(err, 'Failed to load commander map') });
    }
  },

  setDispatch: (step) => set({ dispatch: step }),

  resetDispatch: () => set({ dispatch: { phase: 'idle' } }),

  sendScout: async ({ instanceId, fromTerritoryId, targetCell, buildRadar }) => {
    set({ dispatch: { phase: 'idle' } });
    try {
      const res = await api.post<ApiEnvelope<{ movement: CommanderMovement }>>('/commander/scouts/send', {
        instance_id: instanceId,
        from_territory_id: fromTerritoryId,
        target_cell: targetCell,
        build_radar: buildRadar,
      });
      if (!res.data.success) {
        const code = res.data.message ?? 'SEND_FAILED';
        set({ dispatch: { phase: 'idle' } });
        return { ok: false, error: scoutErrorLabel(code) };
      }
      set({ dispatch: { phase: 'idle' } });
      await get().fetchMap();
      return { ok: true };
    } catch (err) {
      // Extract server error code if present
      const raw = (() => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axErr = err as { response?: { data?: { message?: string } } };
          return axErr.response?.data?.message ?? '';
        }
        return '';
      })();
      set({ dispatch: { phase: 'idle' } });
      return { ok: false, error: raw ? scoutErrorLabel(raw) : errorMessage(err, 'Failed to send scout') };
    }
  },

  recallScout: async (movementId) => {
    try {
      const res = await api.post<ApiEnvelope<{ movement: CommanderMovement }>>(`/commander/scouts/${movementId}/recall`);
      if (!res.data.success) {
        return { ok: false, error: res.data.message ?? 'Recall failed' };
      }
      await get().fetchMap();
      return { ok: true };
    } catch (err) {
      const raw = (() => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axErr = err as { response?: { data?: { message?: string } } };
          return axErr.response?.data?.message ?? '';
        }
        return '';
      })();
      return { ok: false, error: raw || errorMessage(err, 'Recall failed') };
    }
  },

  deployUnit: async (instanceId, territoryId) => {
    try {
      await troopsApi.deploy(instanceId, territoryId);
      await get().fetchMap();
      return { ok: true };
    } catch (err) {
      const raw = (() => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axErr = err as { response?: { data?: { message?: string } } };
          return axErr.response?.data?.message ?? '';
        }
        return '';
      })();
      return { ok: false, error: raw ? marchErrorLabel(raw) : errorMessage(err, 'Deploy failed') };
    }
  },

  undeployUnit: async (instanceId) => {
    try {
      await troopsApi.undeploy(instanceId);
      await get().fetchMap();
      return { ok: true };
    } catch (err) {
      const raw = (() => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axErr = err as { response?: { data?: { message?: string } } };
          return axErr.response?.data?.message ?? '';
        }
        return '';
      })();
      return { ok: false, error: raw || errorMessage(err, 'Undeploy failed') };
    }
  },

  marchTroops: async ({ instanceIds, fromTerritoryId, targetTerritoryId, purpose }) => {
    try {
      const movement = await troopsApi.march({
        instance_ids: instanceIds,
        from_territory_id: fromTerritoryId,
        target_territory_id: targetTerritoryId,
        purpose,
      });
      await get().fetchMap();
      const teleport = movement.config?.teleport === true;
      return { ok: true, teleport };
    } catch (err) {
      const raw = (() => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axErr = err as { response?: { data?: { message?: string } } };
          return axErr.response?.data?.message ?? '';
        }
        return '';
      })();
      return { ok: false, error: raw ? marchErrorLabel(raw) : errorMessage(err, 'March failed') };
    }
  },

  equipDie: async (instanceId) => {
    try {
      await troopsApi.equipDie(instanceId);
      // Optimistically mark as equipped client-side (server may not expose state in inventory)
      set({ equippedDieInstanceId: instanceId });
      return { ok: true };
    } catch (err) {
      const raw = (() => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axErr = err as { response?: { data?: { message?: string } } };
          return axErr.response?.data?.message ?? '';
        }
        return '';
      })();
      return { ok: false, error: raw || errorMessage(err, 'Equip failed') };
    }
  },

  fetchBattles: async () => {
    set({ battlesLoading: true, battlesError: null });
    try {
      const battles = await battlesApi.list();
      set({ battles, battlesLoading: false });
    } catch (err) {
      set({ battlesLoading: false, battlesError: errorMessage(err, 'Failed to load battles') });
    }
  },

  fetchBattleDetail: async (id) => {
    try {
      return await battlesApi.getById(id);
    } catch {
      return null;
    }
  },

  launchStrike: async (fromTerritoryId, targetTerritoryId) => {
    try {
      const result = await strikeApi.launch(fromTerritoryId, targetTerritoryId);
      // Refresh map (silo cooldown) and battles list after a successful strike
      await Promise.all([get().fetchMap(), get().fetchBattles()]);
      return { ok: true, result };
    } catch (err) {
      const raw = (() => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axErr = err as { response?: { data?: { message?: string }; status?: number } };
          // 429 = SILO_COOLDOWN
          if (axErr.response?.status === 429) return 'SILO_COOLDOWN';
          return axErr.response?.data?.message ?? '';
        }
        return '';
      })();
      return { ok: false, error: raw ? strikeErrorLabel(raw) : errorMessage(err, 'Strike failed') };
    }
  },
}));

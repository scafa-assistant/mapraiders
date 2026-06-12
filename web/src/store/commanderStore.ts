// ============================================================
// Commander store — fog-of-war hex map state + scout dispatch.
// Dispatch flow state machine:
//   idle → picking-unit → picking-target → confirming → idle
// ============================================================

import { create } from 'zustand';
import { api, errorMessage } from '../api/client';
import type { ApiEnvelope, InventoryItem } from '../api/types';

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
  config?: Record<string, unknown>;
}

export interface CommanderRadar {
  building_id: string;
  territory_id: string;
  covert: boolean;
  cells: string[];
}

export interface CommanderMapData {
  visible_cells: string[];
  territories: CommanderTerritory[];
  movements: CommanderMovement[];
  radars: CommanderRadar[];
}

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
}

// ---- Error code → human message -------------------------------------------------

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
}));

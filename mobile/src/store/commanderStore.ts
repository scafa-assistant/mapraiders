import { create } from 'zustand';
import {
  commanderApi,
  CommanderMapData,
  CommanderBattleSummary,
  CommanderBattleDetail,
  CommanderOwnMovement,
  AirstrikeResult,
} from '../services/api';

// ─── Error code → user-readable message map (terminalStore style) ─────────────

const COMMANDER_ERROR_MESSAGES: Record<string, string> = {
  FEATURE_DISABLED: 'The Commander layer is not yet available.',
  INSTANCE_NOT_FOUND: 'That unit could not be found.',
  NOT_OWNER: 'You do not own that unit.',
  NOT_A_UNIT: 'That item is not a deployable unit.',
  UNIT_BUSY: 'That unit is already on a mission.',
  NO_BASE: 'You need a base territory to launch from.',
  TARGET_TOO_FAR: 'The target is out of range.',
  TOO_MANY_SCOUTS: 'You already have the maximum number of scouts out.',
  INSUFFICIENT_RESOURCES: 'Not enough resources for this operation.',
  TARGET_PROTECTED: 'That target is protected and cannot be scouted.',
  PATH_FAILED: 'No route to the target could be plotted.',
  GARRISON_FULL: 'That garrison is already at full capacity.',
  NOT_TERRITORY_OWNER: 'You do not control that territory.',
  CANNOT_ATTACK_SELF: 'You cannot attack your own territory.',
  NAVAL_REQUIRES_WATER: 'Naval units need a water route to march.',
  TOO_MANY_UNITS: 'Too many units in this stack (max 6).',
  BATTLE_NOT_FOUND: 'That battle could not be found.',
  // Airstrike-specific
  NO_SILO: 'You have no silo on that territory.',
  SILO_COOLDOWN: 'Silo is reloading.',
  TARGET_NOT_FOUND: 'Target territory not found.',
  CANNOT_STRIKE_SELF: 'You cannot airstrike your own territory.',
};

export function resolveCommanderError(message: string): string {
  return COMMANDER_ERROR_MESSAGES[message] ?? message;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionResult {
  success: boolean;
  message?: string;
}

interface StrikeResult extends ActionResult {
  battle_id?: string;
  result?: AirstrikeResult;
}

interface CommanderState {
  mapData: CommanderMapData | null;
  loading: boolean;
  error: string | null;

  battles: CommanderBattleSummary[];
  battlesLoading: boolean;
  battleDetail: CommanderBattleDetail | null;
  battleDetailLoading: boolean;

  /** Optimistic client-side mark of the equipped die instance (server payload has no `state`). */
  equippedDieId: string | null;

  // Actions
  fetchMap: () => Promise<void>;
  sendScout: (
    instanceId: string,
    fromTerritoryId: string,
    targetCell: string,
    buildRadar?: boolean
  ) => Promise<ActionResult>;
  recall: (movementId: string) => Promise<ActionResult>;
  deploy: (instanceId: string, territoryId: string) => Promise<ActionResult>;
  undeploy: (instanceId: string) => Promise<ActionResult>;
  march: (
    instanceIds: string[],
    fromTerritoryId: string,
    targetTerritoryId: string,
    purpose: 'attack' | 'reinforce'
  ) => Promise<ActionResult>;
  equipDie: (instanceId: string) => Promise<ActionResult>;
  strike: (fromTerritoryId: string, targetTerritoryId: string) => Promise<StrikeResult>;
  fetchBattles: () => Promise<void>;
  fetchBattle: (id: string) => Promise<void>;
  clearBattleDetail: () => void;
  clearError: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCommanderStore = create<CommanderState>((set, get) => ({
  mapData: null,
  loading: false,
  error: null,

  battles: [],
  battlesLoading: false,
  battleDetail: null,
  battleDetailLoading: false,

  equippedDieId: null,

  /**
   * Fetch the fog-of-war strategic map. Keeps the previous mapData on error so
   * the periodic 30s refresh never blanks the screen on a transient failure.
   * The `silos` array is normalised to [] if absent (older server).
   */
  fetchMap: async () => {
    set({ loading: true, error: null });
    try {
      const response = await commanderApi.getMap();
      const data = response.data?.data;
      if (data) {
        // Back-fill silos + ai_zones arrays if the server omits them (graceful degradation).
        const normalised = { ...data, silos: data.silos ?? [], ai_zones: data.ai_zones ?? [] };
        set({ mapData: normalised, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      set({ loading: false, error: resolveCommanderError(raw) });
    }
  },

  sendScout: async (instanceId, fromTerritoryId, targetCell, buildRadar) => {
    set({ error: null });
    try {
      await commanderApi.sendScout({
        instance_id: instanceId,
        from_territory_id: fromTerritoryId,
        target_cell: targetCell,
        build_radar: buildRadar,
      });
      await get().fetchMap();
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveCommanderError(raw);
      set({ error: message });
      return { success: false, message };
    }
  },

  recall: async (movementId) => {
    set({ error: null });
    try {
      await commanderApi.recallScout(movementId);
      await get().fetchMap();
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveCommanderError(raw);
      set({ error: message });
      return { success: false, message };
    }
  },

  deploy: async (instanceId, territoryId) => {
    set({ error: null });
    try {
      await commanderApi.deployTroop({ instance_id: instanceId, territory_id: territoryId });
      await get().fetchMap();
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveCommanderError(raw);
      set({ error: message });
      return { success: false, message };
    }
  },

  undeploy: async (instanceId) => {
    set({ error: null });
    try {
      await commanderApi.undeployTroop({ instance_id: instanceId });
      await get().fetchMap();
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveCommanderError(raw);
      set({ error: message });
      return { success: false, message };
    }
  },

  march: async (instanceIds, fromTerritoryId, targetTerritoryId, purpose) => {
    set({ error: null });
    try {
      await commanderApi.march({
        instance_ids: instanceIds,
        from_territory_id: fromTerritoryId,
        target_territory_id: targetTerritoryId,
        purpose,
      });
      await get().fetchMap();
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveCommanderError(raw);
      set({ error: message });
      return { success: false, message };
    }
  },

  equipDie: async (instanceId) => {
    set({ error: null });
    // Optimistic mark — the inventory payload exposes no equipped `state`.
    const previous = get().equippedDieId;
    set({ equippedDieId: instanceId });
    try {
      await commanderApi.equipDie({ instance_id: instanceId });
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveCommanderError(raw);
      set({ equippedDieId: previous, error: message });
      return { success: false, message };
    }
  },

  /**
   * Launch an airstrike from fromTerritoryId onto targetTerritoryId.
   * Refreshes both the map (silo cooldown updated) and the battle list.
   */
  strike: async (fromTerritoryId, targetTerritoryId) => {
    set({ error: null });
    try {
      const response = await commanderApi.strike({
        from_territory_id: fromTerritoryId,
        target_territory_id: targetTerritoryId,
      });
      const { battle_id, result } = response.data.data;
      // Refresh map (cooldown) + battle log in parallel.
      await Promise.all([get().fetchMap(), get().fetchBattles()]);
      return { success: true, battle_id, result };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveCommanderError(raw);
      set({ error: message });
      return { success: false, message };
    }
  },

  fetchBattles: async () => {
    set({ battlesLoading: true });
    try {
      const response = await commanderApi.getBattles();
      const battles = response.data?.data?.battles ?? [];
      set({ battles, battlesLoading: false });
    } catch {
      set({ battlesLoading: false });
    }
  },

  fetchBattle: async (id: string) => {
    set({ battleDetailLoading: true, battleDetail: null });
    try {
      const response = await commanderApi.getBattle(id);
      const battle = response.data?.data?.battle ?? null;
      set({ battleDetail: battle, battleDetailLoading: false });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      set({ battleDetailLoading: false, error: resolveCommanderError(raw) });
    }
  },

  clearBattleDetail: () => set({ battleDetail: null }),

  clearError: () => set({ error: null }),
}));

// Re-export for ergonomic imports in screens.
export type { CommanderOwnMovement };

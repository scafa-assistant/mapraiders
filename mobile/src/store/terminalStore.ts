import { create } from 'zustand';
import {
  terminalApi,
  TerminalLeaderboardEntry,
  TerminalSubmitBody,
  TerminalSubmitData,
} from '../services/api';
import { useLocationStore } from './locationStore';

// ─── Error code → user-readable message map ──────────────────────────────────

const TERMINAL_ERROR_MESSAGES: Record<string, string> = {
  FEATURE_DISABLED: 'This feature is not yet available.',
  TERMINAL_NOT_FOUND: 'Terminal not found.',
  NOT_A_TERMINAL: 'This is not a terminal spawn.',
  TERMINAL_EXPIRED: 'This terminal has gone dark.',
  TOO_FAR: 'You must be at the terminal to play.',
  DAILY_CAP: 'Daily run limit reached — come back tomorrow.',
  INVALID_TOKEN: 'Run token is invalid.',
  TOKEN_USED: 'This run token has already been used.',
  IMPLAUSIBLE_RUN: 'Run rejected.',
};

function resolveTerminalError(message: string): string {
  return TERMINAL_ERROR_MESSAGES[message] ?? message;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActiveRun {
  spawnId: string;
  runToken: string;
  level: Record<string, unknown>;
}

export interface RunResult extends TerminalSubmitData {
  error?: string;
}

interface TerminalState {
  /** Leaderboard entries keyed by spawnId. */
  leaderboardBySpawn: Record<
    string,
    { entries: TerminalLeaderboardEntry[]; me: { rank: number; score: number } | null }
  >;
  activeRun: ActiveRun | null;
  lastResult: RunResult | null;
  loading: boolean;
  error: string | null;
  // Actions
  fetchLeaderboard: (spawnId: string) => Promise<void>;
  startRun: (spawnId: string) => Promise<{ success: boolean; message?: string }>;
  submitRun: (spawnId: string, body: TerminalSubmitBody) => Promise<RunResult>;
  clearRun: () => void;
  clearError: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTerminalStore = create<TerminalState>((set, get) => ({
  leaderboardBySpawn: {},
  activeRun: null,
  lastResult: null,
  loading: false,
  error: null,

  /**
   * Fetch the leaderboard for a terminal spawn.
   * Silently swallows errors — leaderboard must never block the screen.
   */
  fetchLeaderboard: async (spawnId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await terminalApi.leaderboard(spawnId);
      const data = response.data?.data;
      if (data) {
        set((state) => ({
          leaderboardBySpawn: {
            ...state.leaderboardBySpawn,
            [spawnId]: { entries: data.entries ?? [], me: data.me ?? null },
          },
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  /**
   * Start a terminal run. GPS coords are pulled from the location store,
   * mirroring how HackingScreen uses useLocationStore.getState().currentLocation.
   * No optimistic update.
   */
  startRun: async (spawnId: string) => {
    const currentLocation = useLocationStore.getState().currentLocation;
    if (!currentLocation) {
      const message = 'No GPS signal — location required.';
      set({ error: message });
      return { success: false, message };
    }

    set({ loading: true, error: null });
    try {
      const response = await terminalApi.start(spawnId, currentLocation);
      const data = response.data?.data;
      if (!data) throw new Error('TERMINAL_NOT_FOUND');

      set({
        activeRun: {
          spawnId,
          runToken: data.run_token,
          level: data.level,
        },
        loading: false,
      });
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveTerminalError(raw);
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  /**
   * Submit a completed or aborted run.
   * Returns RunResult which the screen uses to display score / rank / reward.
   */
  submitRun: async (spawnId: string, body: TerminalSubmitBody) => {
    set({ loading: true, error: null });
    try {
      const response = await terminalApi.submit(spawnId, body);
      const data = response.data?.data;
      if (!data) throw new Error('UNKNOWN_ERROR');

      const result: RunResult = { ...data };
      set({ activeRun: null, lastResult: result, loading: false });

      // Refresh leaderboard so the new score appears immediately
      get().fetchLeaderboard(spawnId);

      return result;
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      const message = resolveTerminalError(raw);
      const result: RunResult = {
        accepted: false,
        score: 0,
        best_score: 0,
        rank: 0,
        reward: null,
        error: message,
      };
      set({ activeRun: null, lastResult: result, loading: false, error: message });
      return result;
    }
  },

  /** Clear the active run and last result (e.g., when navigating away). */
  clearRun: () => set({ activeRun: null, lastResult: null, error: null }),

  clearError: () => set({ error: null }),
}));

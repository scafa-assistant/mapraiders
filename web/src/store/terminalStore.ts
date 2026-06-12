// ============================================================
// Terminal store — selected terminal spawn, leaderboard, run state.
// A "terminal" is a PvE spawn with npc_type === 'terminal' that hosts the
// Jump&Run minigame (Grid Runner). The panel reads this store; MapView
// selection is handled via the existing mapStore.selectedSpawnId.
// ============================================================

import { create } from 'zustand';
import { terminalApi, errorMessage } from '../api/client';
import type { LeaderboardEntry, PveSpawn } from '../api/types';

interface TerminalLeaderboardState {
  entries: LeaderboardEntry[];
  me: { rank: number; score: number } | null;
}

interface TerminalState {
  // The spawn that is currently "open" in the panel.
  selectedSpawn: PveSpawn | null;

  leaderboard: TerminalLeaderboardState | null;
  leaderboardLoading: boolean;
  leaderboardError: string | null;

  selectSpawn: (spawn: PveSpawn | null) => void;
  loadLeaderboard: (spawnId: string) => Promise<void>;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  selectedSpawn: null,
  leaderboard: null,
  leaderboardLoading: false,
  leaderboardError: null,

  selectSpawn: (spawn) =>
    set({
      selectedSpawn: spawn,
      // Reset leaderboard when switching terminals.
      leaderboard: null,
      leaderboardError: null,
    }),

  loadLeaderboard: async (spawnId) => {
    set({ leaderboardLoading: true, leaderboardError: null });
    try {
      const data = await terminalApi.getLeaderboard(spawnId);
      set({
        leaderboard: { entries: data.entries, me: data.me },
        leaderboardLoading: false,
      });
    } catch (err) {
      set({
        leaderboardLoading: false,
        leaderboardError: errorMessage(err, 'Failed to load leaderboard'),
      });
    }
  },
}));

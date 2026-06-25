import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Coachmark / teach system state.
//
// A screen calls showTeach('karte') on mount. The host (<Coachmark/>, mounted
// once at the app root) renders the overlay for the active id. Each id is shown
// exactly once ever: a "seen" map is persisted to AsyncStorage, so the second
// time a feature opens, showTeach is a no-op.
//
// Logic, engines and data flows are untouched: this is a pure first-run hint
// layer that sits on top of the existing screens.

const TEACH_SEEN_KEY = '@mapraiders_teach_seen';

interface TeachState {
  /** ids the user has already been taught (persisted). */
  seen: Record<string, boolean>;
  /** id currently shown, or null. Only one coachmark at a time. */
  activeId: string | null;
  /** seen-map has been hydrated from storage. */
  loaded: boolean;
  /** a showTeach() that arrived before hydration, replayed once loaded. */
  pendingId: string | null;
  loadSeen: () => Promise<void>;
  /** Show the teach for id, unless already seen or another is active. */
  showTeach: (id: string) => void;
  /** Mark the active id seen, persist, and close. */
  dismissActive: () => void;
  /** Dev/testing helper: forget all seen flags. */
  resetSeen: () => Promise<void>;
}

export const useTeachStore = create<TeachState>((set, get) => ({
  seen: {},
  activeId: null,
  loaded: false,
  pendingId: null,

  loadSeen: async () => {
    try {
      const stored = await AsyncStorage.getItem(TEACH_SEEN_KEY);
      const seen = stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
      const { pendingId } = get();
      // Replay a request that came in before hydration finished.
      const activeId = pendingId && !seen[pendingId] ? pendingId : null;
      set({ seen, loaded: true, pendingId: null, activeId });
    } catch {
      set({ loaded: true, pendingId: null });
    }
  },

  showTeach: (id) => {
    const { loaded, seen, activeId } = get();
    if (!loaded) {
      // Hydration not done yet: remember the last request and replay on load.
      set({ pendingId: id });
      return;
    }
    if (seen[id] || activeId) return;
    set({ activeId: id });
  },

  dismissActive: () => {
    const { activeId, seen } = get();
    if (!activeId) return;
    const nextSeen = { ...seen, [activeId]: true };
    set({ seen: nextSeen, activeId: null });
    AsyncStorage.setItem(TEACH_SEEN_KEY, JSON.stringify(nextSeen)).catch(() => {});
  },

  resetSeen: async () => {
    set({ seen: {}, activeId: null, pendingId: null });
    try {
      await AsyncStorage.removeItem(TEACH_SEEN_KEY);
    } catch {
      // best effort
    }
  },
}));

/**
 * Convenience hook: fire a teach once when a screen/feature mounts (or when
 * `enabled` flips true). Safe to call unconditionally at the top of a screen.
 */
import { useEffect } from 'react';
export function useTeachOnMount(id: string, enabled: boolean = true): void {
  const showTeach = useTeachStore((s) => s.showTeach);
  useEffect(() => {
    if (enabled) showTeach(id);
  }, [id, enabled, showTeach]);
}

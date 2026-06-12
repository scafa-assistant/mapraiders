// ============================================================
// Auth store — session token, current user, restore-on-load.
// ============================================================

import { create } from 'zustand';
import {
  authApi,
  errorMessage,
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
  userApi,
} from '../api/client';
import type { MeResponse, User } from '../api/types';

interface AuthState {
  user: User | null;
  me: MeResponse | null;
  status: 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';
  loginError: string | null;
  loginPending: boolean;

  restore: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  me: null,
  status: 'idle',
  loginError: null,
  loginPending: false,

  // Validate a persisted token by fetching the profile; 401 → unauthenticated.
  restore: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ status: 'unauthenticated' });
      return;
    }
    set({ status: 'restoring' });
    try {
      const me = await userApi.me();
      set({ user: me, me, status: 'authenticated' });
    } catch {
      setStoredToken(null);
      set({ user: null, me: null, status: 'unauthenticated' });
    }
  },

  login: async (email, password) => {
    set({ loginPending: true, loginError: null });
    try {
      const result = await authApi.login(email, password);
      setStoredToken(result.token);
      set({ user: result.user, status: 'authenticated', loginPending: false });
      // Fetch the richer profile in the background.
      get().refreshMe();
    } catch (err) {
      set({ loginError: errorMessage(err, 'Login failed'), loginPending: false });
    }
  },

  logout: () => {
    setStoredToken(null);
    set({ user: null, me: null, status: 'unauthenticated', loginError: null });
  },

  refreshMe: async () => {
    try {
      const me = await userApi.me();
      set({ user: me, me });
    } catch {
      /* non-fatal: keep whatever user we already have */
    }
  },
}));

// Wire the axios 401 handler to the store once at module load.
setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});

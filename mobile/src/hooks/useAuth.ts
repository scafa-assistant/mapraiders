import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { setTokens, clearTokens } from '../services/api';
import type { UserProfile } from '../navigation/types';

interface UseAuthReturn {
  /** Current user profile, or null if not logged in. */
  user: UserProfile | null;
  /** Auth token, or null. */
  token: string | null;
  /** Whether a user is currently logged in. */
  isLoggedIn: boolean;
  /** Whether an auth operation is in progress. */
  isLoading: boolean;
  /** Current error message, if any. */
  error: string | null;
  /** Log in with email and password. */
  login: (email: string, password: string) => Promise<void>;
  /** Register a new account. */
  register: (username: string, email: string, password: string) => Promise<void>;
  /** Log out and clear all stored credentials. */
  logout: () => Promise<void>;
  /** Refresh the user profile from the server. */
  refreshProfile: () => Promise<void>;
  /** Clear the current error. */
  clearError: () => void;
}

/**
 * Hook for auth state and actions.
 * Wraps the zustand auth store and synchronizes tokens with the API service.
 */
export function useAuth(): UseAuthReturn {
  const {
    token,
    user,
    isLoading,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    refreshProfile,
    clearError,
  } = useAuthStore();

  const isLoggedIn = useMemo(() => !!token && !!user, [token, user]);

  const login = useCallback(
    async (email: string, password: string) => {
      await storeLogin(email, password);
      // Sync the token to the API service's AsyncStorage cache
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        await setTokens(currentToken);
      }
    },
    [storeLogin]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await storeRegister(username, email, password);
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        await setTokens(currentToken);
      }
    },
    [storeRegister]
  );

  const logout = useCallback(async () => {
    storeLogout();
    await clearTokens();
  }, [storeLogout]);

  return {
    user,
    token,
    isLoggedIn,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshProfile,
    clearError,
  };
}

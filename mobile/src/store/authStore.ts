import { create } from 'zustand';
import { authApi, userApi, setTokens, clearTokens } from '../services/api';
import { UserProfile } from '../navigation/types';
import { registerForPushNotifications } from '../services/notifications';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  web3Login: (provider: string, idToken: string, userInfo: Record<string, any>) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      const { token, user } = response.data;
      await setTokens(token, response.data.refreshToken);
      set({ token, user, isLoading: false });

      // Register push token after login
      registerForPushNotifications().then((pushToken) => {
        if (pushToken) userApi.updatePushToken(pushToken).catch(() => {});
      });
    } catch (err: any) {
      const message = err.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register({ username, email, password });
      const { token, user } = response.data;
      await setTokens(token, response.data.refreshToken);
      set({ token, user, isLoading: false });

      // Register push token after registration
      registerForPushNotifications().then((pushToken) => {
        if (pushToken) userApi.updatePushToken(pushToken).catch(() => {});
      });
    } catch (err: any) {
      const message = err.message || 'Registration failed. Please try again.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  web3Login: async (provider: string, idToken: string, userInfo: Record<string, any>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.web3Login({ provider, idToken, userInfo });
      const { token, user } = response.data;
      await setTokens(token, response.data.refreshToken);
      set({ token, user, isLoading: false });

      // Register push token after web3 login
      registerForPushNotifications().then((pushToken) => {
        if (pushToken) userApi.updatePushToken(pushToken).catch(() => {});
      });
    } catch (err: any) {
      const message = err.message || 'Social login failed. Please try again.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  logout: () => {
    clearTokens();
    set({ token: null, user: null, error: null });
  },

  refreshProfile: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const response = await userApi.getMe();
      set({ user: response.data });
    } catch (err: any) {
      if (err.response?.status === 401) {
        get().logout();
      }
    }
  },

  clearError: () => set({ error: null }),
}));

import { create } from 'zustand';
import { authApi, userApi, setTokens, clearTokens, getToken } from '../services/api';
import { UserProfile } from '../navigation/types';
import { registerForPushNotifications } from '../services/notifications';
// Import after featureStore to avoid circular dependency (featureStore does NOT import authStore)
import { useFeatureStore } from './featureStore';

// Level curve: XP needed for level N = round(1000 * N^1.5)
function xpForLevel(level: number): number {
  return Math.round(1000 * Math.pow(level, 1.5));
}

/** Map server user data (snake_case, raw DB fields) to client UserProfile */
function mapServerUser(data: any): UserProfile {
  if (!data) return {} as UserProfile;

  const totalXp = typeof data.xp === 'string' ? parseInt(data.xp, 10) : (data.xp ?? 0);
  const level = data.level ?? 1;

  // Use server-computed XP progress if available, else compute locally
  let xpInLevel = data.xp_in_level;
  let xpToNextLevel = data.xp_to_next_level;

  if (xpInLevel == null || xpToNextLevel == null) {
    let accumulated = 0;
    for (let i = 1; i < level; i++) {
      accumulated += xpForLevel(i);
    }
    xpInLevel = xpInLevel ?? Math.max(0, totalXp - accumulated);
    xpToNextLevel = xpToNextLevel ?? xpForLevel(level);
  }

  return {
    id: data.id,
    username: data.username,
    email: data.email,
    level,
    xp: xpInLevel,
    xpToNextLevel,
    totalClaims: data.stats?.territories ?? data.totalClaims ?? 0,
    totalArea: data.stats?.total_territory_m2 ?? data.totalArea ?? 0,
    questsCompleted: data.stats?.quests_completed ?? data.questsCompleted ?? 0,
    currentStreak: data.streak_days ?? data.currentStreak ?? 0,
    longestStreak: data.longest_streak ?? data.longestStreak ?? 0,
    titles: data.titles ?? [],
    classBreakdown: data.class_breakdown ?? data.classBreakdown ?? ({} as Record<string, number>),
    createdAt: data.created_at ?? data.createdAt,
  };
}

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
  restoreSession: () => Promise<void>;
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
      const { token, user, refreshToken } = response.data.data;
      await setTokens(token, refreshToken);
      set({ token, user: mapServerUser(user), isLoading: false });

      // Forward capabilities to featureStore if the server sends them
      const caps = response.data.data.capabilities;
      if (caps) useFeatureStore.getState().setCapabilities(caps);

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
      const { token, user, refreshToken } = response.data.data;
      await setTokens(token, refreshToken);
      set({ token, user: mapServerUser(user), isLoading: false });

      // Forward capabilities to featureStore if the server sends them
      const caps = response.data.data.capabilities;
      if (caps) useFeatureStore.getState().setCapabilities(caps);

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
      const { token, user, refreshToken } = response.data.data;
      await setTokens(token, refreshToken);
      set({ token, user: mapServerUser(user), isLoading: false });

      // Forward capabilities to featureStore if the server sends them
      const caps = response.data.data.capabilities;
      if (caps) useFeatureStore.getState().setCapabilities(caps);

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
      const data = response.data?.data ?? response.data;
      set({ user: mapServerUser(data) });
      if (data?.capabilities) useFeatureStore.getState().setCapabilities(data.capabilities);
    } catch (err: any) {
      if (err.response?.status === 401) {
        get().logout();
      }
    }
  },

  restoreSession: async () => {
    try {
      const savedToken = await getToken();
      if (!savedToken) return;
      // Set token in store so the app navigates to MainNavigator
      set({ token: savedToken });
      // Fetch user profile from server to validate token and populate user data
      const response = await userApi.getMe();
      const data = response.data?.data ?? response.data;
      set({ user: mapServerUser(data) });
      if (data?.capabilities) useFeatureStore.getState().setCapabilities(data.capabilities);
    } catch (_err) {
      // Token expired or invalid — clear it
      await clearTokens();
      set({ token: null, user: null });
    }
  },

  clearError: () => set({ error: null }),
}));

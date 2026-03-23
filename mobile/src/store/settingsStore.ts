import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi } from '../services/api';

const SETTINGS_KEY = '@mapraiders_settings';

interface AppSettings {
  darkMapStyle: boolean;
  hapticFeedback: boolean;
  pushNotifications: boolean;
  territoryAlerts: boolean;
  questNearby: boolean;
  quietHours: boolean;
}

interface SettingsState {
  settings: AppSettings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: (key: keyof AppSettings, value: boolean) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMapStyle: true,
  hapticFeedback: true,
  pushNotifications: true,
  territoryAlerts: true,
  questNearby: true,
  quietHours: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed }, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  updateSetting: async (key, value) => {
    console.log(`[Settings] ${key} = ${value}`);
    const newSettings = { ...get().settings, [key]: value };
    set({ settings: newSettings });
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      console.log('[Settings] Saved to AsyncStorage');
    } catch (e: any) {
      console.error('[Settings] AsyncStorage error:', e?.message);
    }
    // Also sync to server (fire-and-forget)
    try { await userApi.updateSettings({ [key]: value }); } catch {}
  },
}));

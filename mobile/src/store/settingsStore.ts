import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi } from '../services/api';

const SETTINGS_KEY = '@mapraiders_settings';

// app.json pins userInterfaceStyle to "dark"; Google Maps' new renderer
// follows the Activity uiMode whenever customMapStyle is empty. Forcing the
// color scheme here keeps native surfaces (map tiles, dialogs) in sync with
// the in-app dark mode toggle.
function syncNativeColorScheme(darkMode: boolean): void {
  try {
    Appearance.setColorScheme(darkMode ? 'dark' : 'light');
  } catch {
    // Appearance override unsupported — UI theme still applies via useTheme
  }
}

interface AppSettings {
  darkMapStyle: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
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
  darkMapStyle: false,
  hapticFeedback: true,
  soundEffects: true,
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
        const settings = { ...DEFAULT_SETTINGS, ...parsed };
        syncNativeColorScheme(settings.darkMapStyle);
        set({ settings, loaded: true });
      } else {
        syncNativeColorScheme(DEFAULT_SETTINGS.darkMapStyle);
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  updateSetting: async (key, value) => {
    console.log(`[Settings] ${key} = ${value}`);
    const newSettings = { ...get().settings, [key]: value };
    if (key === 'darkMapStyle') {
      syncNativeColorScheme(value);
    }
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

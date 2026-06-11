import { useSettingsStore } from '../store/settingsStore';
import { DARK_THEME, LIGHT_THEME } from '../utils/constants';

// Global app theme. settings.darkMapStyle is the historic storage key,
// but it now means "dark mode for the whole app" (incl. map tiles).
export function useTheme() {
  const { settings } = useSettingsStore();
  return settings.darkMapStyle ? DARK_THEME : LIGHT_THEME;
}

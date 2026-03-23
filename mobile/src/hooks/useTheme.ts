import { useSettingsStore } from '../store/settingsStore';
import { DARK_THEME, LIGHT_THEME } from '../utils/constants';

export function useTheme() {
  const { settings } = useSettingsStore();
  return settings.darkMapStyle ? DARK_THEME : LIGHT_THEME;
}

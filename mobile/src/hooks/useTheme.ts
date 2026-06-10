import { DARK_THEME } from '../utils/constants';

// v1.0 ships dark-only UI. The darkMapStyle setting only affects
// the map tiles/overlays in MapScreen, not the app theme.
export function useTheme() {
  return DARK_THEME;
}

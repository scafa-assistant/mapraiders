import type { MovementClass } from './types';

// ─── Class Visual Mappings ──────────────────────────────────────────────────

export const CLASS_COLORS: Record<MovementClass, string> = {
  walker: '#1558F0',
  runner: '#D7263D',
  cyclist: '#1B9E5A',
  skater: '#F5A623',
  dog_walker: '#4B7BFF',
  driver: '#7A7470',
  unknown: '#C0BAB4',
};

export const CLASS_ICONS: Record<MovementClass, string> = {
  walker: 'walk-outline',
  runner: 'fitness-outline',
  cyclist: 'bicycle-outline',
  skater: 'flash-outline',
  dog_walker: 'paw-outline',
  driver: 'car-outline',
  unknown: 'help-circle-outline',
};

export const CLASS_LABELS: Record<MovementClass, string> = {
  walker: 'Walker',
  runner: 'Runner',
  cyclist: 'Cyclist',
  skater: 'Skater',
  dog_walker: 'Dog Walker',
  driver: 'Driver',
  unknown: 'Unknown',
};

// ─── Theme ──────────────────────────────────────────────────────────────────

export interface Theme {
  bg: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  warning: string;
  danger: string;
  text: string;
  textSecondary: string;
  border: string;
}

// MapRaiders brand light/blue theme — matches web cockpit + landing page.
// Both themes resolve to the SAME light palette so no dark/violet surface
// can leak in regardless of the historic dark-mode toggle.
export const LIGHT_THEME: Theme = {
  bg: '#F6F4F1',          // warm off-white
  surface: '#FFFFFF',     // cards
  primary: '#1558F0',     // brand blue
  secondary: '#4B7BFF',   // lighter blue
  accent: '#1558F0',      // blue (was violet) — keep brand-consistent
  warning: '#F5A623',     // amber
  danger: '#D7263D',      // red
  text: '#141210',        // near-black
  textSecondary: '#7A7470', // muted
  border: '#C0BAB4',      // dim border
};

// DARK_THEME kept for API compatibility but now mirrors the light brand look
// (the app ships light to match web). Secondary surface used for contrast.
export const DARK_THEME: Theme = {
  bg: '#EFEDE8',          // secondary surface (slightly deeper off-white)
  surface: '#FFFFFF',
  primary: '#1558F0',
  secondary: '#4B7BFF',
  accent: '#1558F0',
  warning: '#F5A623',
  danger: '#D7263D',
  text: '#141210',
  textSecondary: '#7A7470',
  border: '#C0BAB4',
};

// Backward compatibility — default export points to the brand (light) theme
export const THEME = LIGHT_THEME;

// ─── Layout ─────────────────────────────────────────────────────────────────

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  title: 34,
} as const;

// ─── Map Defaults ───────────────────────────────────────────────────────────

export const DEFAULT_MAP_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
} as const;

export const DEFAULT_TERRITORY_RADIUS = 500; // meters

// ─── GPS Tracking ───────────────────────────────────────────────────────────

export const GPS_CONFIG = {
  accuracy: 6, // Location.Accuracy.BestForNavigation
  distanceInterval: 5,
  timeInterval: 3000,
} as const;

// ─── Speed Thresholds for Class Detection (m/s) ────────────────────────────

export const SPEED_THRESHOLDS = {
  stationary: 0.5,
  walking: 2.0,
  running: 5.0,
  cycling: 12.0,
  driving: 30.0,
} as const;

// ─── Audio Constraints ──────────────────────────────────────────────────────

export const AUDIO_CONFIG = {
  maxRecordingDurationMs: 30000,
  defaultEchoRadius: 50, // meters
  minEchoRadius: 10,
  maxEchoRadius: 200,
} as const;

// ─── Quest Difficulty Stars ─────────────────────────────────────────────────

export const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'] as const;

// ─── XP Level Thresholds ────────────────────────────────────────────────────

export const XP_PER_LEVEL_BASE = 1000;
export const XP_LEVEL_SCALING = 1.15;

// ─── Leaderboard Types ──────────────────────────────────────────────────────

export const LEADERBOARD_TYPES = [
  { key: 'area', label: 'Area', icon: 'resize-outline' },
  { key: 'territory', label: 'Territory', icon: 'map-outline' },
  { key: 'explorer', label: 'Explorer', icon: 'footsteps-outline' },
  { key: 'questmaker', label: 'Questmaker', icon: 'flag-outline' },
  { key: 'echo_master', label: 'Echo Master', icon: 'musical-notes-outline' },
  { key: 'streak', label: 'Streaks', icon: 'flame-outline' },
] as const;

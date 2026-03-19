import type { MovementClass } from './types';

// ─── Class Visual Mappings ──────────────────────────────────────────────────

export const CLASS_COLORS: Record<MovementClass, string> = {
  walker: '#00D4FF',
  runner: '#FF4757',
  cyclist: '#00FF88',
  skater: '#FFB800',
  dog_walker: '#7B61FF',
  driver: '#8892B0',
  unknown: '#555E78',
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

export const THEME = {
  bg: '#0A0E17',
  surface: '#141B2D',
  primary: '#00D4FF',
  secondary: '#7B61FF',
  accent: '#00FF88',
  warning: '#FFB800',
  danger: '#FF4757',
  text: '#FFFFFF',
  textSecondary: '#8892B0',
  border: '#1E293B',
} as const;

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
  { key: 'area', label: 'Area Claimed', icon: 'map-outline' },
  { key: 'xp', label: 'Total XP', icon: 'star-outline' },
  { key: 'quests', label: 'Quests Done', icon: 'flag-outline' },
  { key: 'streaks', label: 'Streaks', icon: 'flame-outline' },
  { key: 'distance', label: 'Distance', icon: 'footsteps-outline' },
] as const;

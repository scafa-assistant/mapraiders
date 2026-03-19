import type { MovementClass } from './types';
import { CLASS_COLORS } from './constants';

/**
 * Get the color associated with a movement class.
 */
export function getClassColor(cls: MovementClass): string {
  return CLASS_COLORS[cls] ?? '#8892B0';
}

/**
 * Parse a hex color string into r, g, b components (0-255).
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/**
 * Convert r, g, b components (0-255) to hex.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    clamp(r).toString(16).padStart(2, '0') +
    clamp(g).toString(16).padStart(2, '0') +
    clamp(b).toString(16).padStart(2, '0')
  );
}

/**
 * Get a territory fill color incorporating class color and decay-based opacity.
 * Decay ranges from 0 (fresh) to 1 (fully decayed).
 * Returns an rgba string for map polygon usage.
 */
export function getTerritoryColor(cls: MovementClass, decay: number): string {
  const hex = getClassColor(cls);
  const { r, g, b } = hexToRgb(hex);
  // Opacity decreases with decay: 0.4 at fresh, down to 0.1 at full decay
  const opacity = 0.4 - decay * 0.3;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0.1, opacity).toFixed(2)})`;
}

/**
 * Get the territory stroke color for a class.
 */
export function getTerritoryStrokeColor(cls: MovementClass): string {
  return getClassColor(cls);
}

/**
 * Lighten a hex color by a given amount (0-1).
 */
export function lighten(color: string, amount: number): string {
  const { r, g, b } = hexToRgb(color);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

/**
 * Darken a hex color by a given amount (0-1).
 */
export function darken(color: string, amount: number): string {
  const { r, g, b } = hexToRgb(color);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/**
 * Return a hex color with opacity as an rgba string.
 */
export function withOpacity(color: string, opacity: number): string {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`;
}

/**
 * Get rank color for leaderboard: gold, silver, bronze, or default.
 */
export function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#FFD700';
    case 2:
      return '#C0C0C0';
    case 3:
      return '#CD7F32';
    default:
      return '#8892B0';
  }
}

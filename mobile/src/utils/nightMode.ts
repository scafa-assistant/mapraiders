// ============================================================
// Night Mode Detection (Nacht-Layer)
// Determines if the current local time falls in the night
// window (22:00-05:00) and provides night-mode visual styles.
// ============================================================

/**
 * Check if the current local time is within the night window.
 * Night = 22:00 (10 PM) to 05:00 (5 AM).
 */
export function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 5;
}

/**
 * Return night-mode visual overrides for the map and UI.
 * Only meaningful when `isNightTime()` returns true.
 */
export function getNightModeStyles() {
  return {
    mapStyle: 'light' as const,
    accentColor: '#1558F0',   // brand blue
    bgColor: '#EFEDE8',       // dimmed off-white surface for night
  };
}

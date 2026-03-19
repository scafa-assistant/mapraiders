/**
 * Format a distance in meters to a human-readable string.
 * Under 1000m shows meters, above shows km with one decimal.
 */
export function formatDistance(meters: number): string {
  if (meters < 0) return '0 m';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Format an area in square meters.
 * Under 1,000,000 m2 shows m2, above shows km2.
 */
export function formatArea(m2: number): string {
  if (m2 < 0) return '0 m\u00B2';
  if (m2 < 1_000_000) {
    return `${m2.toLocaleString('en-US', { maximumFractionDigits: 0 })} m\u00B2`;
  }
  const km2 = m2 / 1_000_000;
  return `${km2.toFixed(1)} km\u00B2`;
}

/**
 * Format a duration in seconds to a human-readable string.
 * Under 1 hour: "5:30", above: "1h 23m".
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format XP with K/M suffix for compact display.
 */
export function formatXP(xp: number): string {
  if (xp < 0) return '0';
  if (xp < 1000) {
    return xp.toString();
  }
  if (xp < 1_000_000) {
    const k = xp / 1000;
    return k < 100 ? `${k.toFixed(1)}K` : `${Math.round(k)}K`;
  }
  const m = xp / 1_000_000;
  return `${m.toFixed(1)}M`;
}

/**
 * Format a date to a relative time string.
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

/**
 * Format a numeric rating to a star display string.
 */
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)}\u2605`;
}

/**
 * Format a number with comma separators.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format speed from m/s to km/h.
 */
export function formatSpeed(metersPerSecond: number): string {
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

// ============================================================
// Geo Utilities
// Haversine distance, bearing, bounding box, route analysis,
// polygon area (Shoelace), segment intersection, centroid.
// All calculations use the WGS84 ellipsoid approximation.
// ============================================================

const EARTH_RADIUS_M = 6371000;
const METERS_PER_DEGREE_LAT = 111320; // approximate

// ---- Angle Conversions ------------------------------------------------

/**
 * Convert degrees to radians.
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees.
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// ---- Core Distance & Bearing ------------------------------------------

/**
 * Calculate haversine distance between two points in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Calculate bearing from point 1 to point 2 in degrees (0-360).
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  const theta = Math.atan2(y, x);
  return (toDegrees(theta) + 360) % 360;
}

// ---- Bounding Box -----------------------------------------------------

/**
 * Get a bounding box around a center point with a given radius in meters.
 * Approximate: 1 degree latitude ~ 111 320 m.
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusM: number,
): { north: number; south: number; east: number; west: number } {
  const latDelta = radiusM / METERS_PER_DEGREE_LAT;
  const lngDelta = radiusM / (METERS_PER_DEGREE_LAT * Math.cos(toRadians(lat)));
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

/**
 * Check if a point is inside a bounding box.
 */
export function isInBoundingBox(
  lat: number,
  lng: number,
  bbox: { north: number; south: number; east: number; west: number },
): boolean {
  return lat >= bbox.south && lat <= bbox.north && lng >= bbox.west && lng <= bbox.east;
}

// ---- Route Analysis ---------------------------------------------------

/**
 * Calculate total distance of a route (sum of segments) in meters.
 */
export function routeDistance(
  points: { latitude: number; longitude: number }[],
): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude,
    );
  }
  return total;
}

/**
 * Calculate average speed of a route in km/h.
 * Points must have a `timestamp` field (Unix epoch ms).
 */
export function averageSpeed(
  points: { latitude: number; longitude: number; timestamp: number }[],
): number {
  if (points.length < 2) return 0;
  const distM = routeDistance(points);
  const durationS =
    (points[points.length - 1].timestamp - points[0].timestamp) / 1000;
  if (durationS <= 0) return 0;
  return (distM / 1000) / (durationS / 3600); // km / h
}

/**
 * Calculate speed between consecutive points in km/h.
 * Returns an array of length `points.length - 1`.
 */
export function segmentSpeeds(
  points: { latitude: number; longitude: number; timestamp: number }[],
): number[] {
  const speeds: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const distM = haversineDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude,
    );
    const dtS = (points[i].timestamp - points[i - 1].timestamp) / 1000;
    if (dtS <= 0) {
      speeds.push(0);
    } else {
      speeds.push((distM / 1000) / (dtS / 3600));
    }
  }
  return speeds;
}

// ---- Centroid ---------------------------------------------------------

/**
 * Calculate the centroid (geographic center) of a set of points.
 */
export function centroid(
  points: { latitude: number; longitude: number }[],
): { latitude: number; longitude: number } {
  if (points.length === 0) {
    return { latitude: 0, longitude: 0 };
  }
  if (points.length === 1) {
    return { latitude: points[0].latitude, longitude: points[0].longitude };
  }

  // Convert to Cartesian, average, convert back (handles meridian wrapping).
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of points) {
    const latR = toRadians(p.latitude);
    const lonR = toRadians(p.longitude);
    x += Math.cos(latR) * Math.cos(lonR);
    y += Math.cos(latR) * Math.sin(lonR);
    z += Math.sin(latR);
  }
  const n = points.length;
  x /= n;
  y /= n;
  z /= n;

  const lon = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const lat = Math.atan2(z, hyp);
  return { latitude: toDegrees(lat), longitude: toDegrees(lon) };
}

// ---- Segment Intersection ---------------------------------------------

/**
 * Check if two line segments (p1-p2) and (p3-p4) intersect.
 * Each point is [latitude, longitude].
 */
export function segmentsIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number],
): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

/** Cross product of vectors (pi-pk) x (pj-pk). */
function direction(
  pi: [number, number],
  pj: [number, number],
  pk: [number, number],
): number {
  return (pk[0] - pi[0]) * (pj[1] - pi[1]) - (pj[0] - pi[0]) * (pk[1] - pi[1]);
}

/** Check if point pk lies on segment pi-pj (collinear case). */
function onSegment(
  pi: [number, number],
  pj: [number, number],
  pk: [number, number],
): boolean {
  return (
    Math.min(pi[0], pj[0]) <= pk[0] &&
    pk[0] <= Math.max(pi[0], pj[0]) &&
    Math.min(pi[1], pj[1]) <= pk[1] &&
    pk[1] <= Math.max(pi[1], pj[1])
  );
}

// ---- Polygon Area (Shoelace) ------------------------------------------

/**
 * Calculate area of a polygon using the Shoelace formula (in square meters).
 * Points must be in { latitude, longitude }. They are projected to approximate
 * meters using the centroid latitude for the longitude scale factor.
 * The polygon does not need to be explicitly closed (first !== last).
 */
export function polygonArea(
  points: { latitude: number; longitude: number }[],
): number {
  if (points.length < 3) return 0;

  // Use centroid latitude as reference for the longitude scale factor
  const avgLat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
  const cosLat = Math.cos(toRadians(avgLat));

  // Project lat/lng to approximate meters
  const projected = points.map((p) => ({
    x: p.longitude * cosLat * METERS_PER_DEGREE_LAT,
    y: p.latitude * METERS_PER_DEGREE_LAT,
  }));

  // Shoelace formula
  let area = 0;
  const n = projected.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += projected[i].x * projected[j].y;
    area -= projected[j].x * projected[i].y;
  }

  return Math.abs(area / 2);
}

// ---- Aliases & Additional Exports ------------------------------------

/**
 * Alias for haversineDistance using coordinate objects.
 * Calculates the distance in meters between two points.
 */
export function pointDistance(
  p1: { latitude: number; longitude: number },
  p2: { latitude: number; longitude: number },
): number {
  return haversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
}

/**
 * Calculate speed (km/h) between two consecutive GPS points.
 */
export function segmentSpeed(
  p1: { latitude: number; longitude: number; timestamp: number },
  p2: { latitude: number; longitude: number; timestamp: number },
): number {
  const distM = haversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  const dtS = (p2.timestamp - p1.timestamp) / 1000;
  if (dtS <= 0) return 0;
  return (distM / 1000) / (dtS / 3600);
}

/**
 * Alias for routeDistance.
 */
export const pathDistance = routeDistance;

/**
 * Calculate the duration of a path in seconds (last timestamp - first timestamp).
 */
export function pathDuration(
  points: { latitude: number; longitude: number; timestamp: number }[],
): number {
  if (points.length < 2) return 0;
  return (points[points.length - 1].timestamp - points[0].timestamp) / 1000;
}

/**
 * Alias for polygonArea.
 */
export const polygonAreaM2 = polygonArea;

/**
 * Convert a single coordinate to PostGIS WKT POINT format.
 * Re-exported from polygon.ts for convenience.
 */
export function pointToWkt(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

// ---- Night Layer ----------------------------------------------------------

/**
 * Check if the current server time is within the night window (22:00-05:00).
 * Used by the Nacht-Layer feature to filter content.
 */
export function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 5;
}

/**
 * Get the current time window label ('night' or 'day').
 */
export function getCurrentTimeWindow(): 'night' | 'day' {
  return isNightTime() ? 'night' : 'day';
}

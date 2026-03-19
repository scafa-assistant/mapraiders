// ============================================================
// Polygon Operations
// Smoothing, Douglas-Peucker simplification, validation,
// WKT conversion, and the full GPS-to-polygon pipeline.
// ============================================================

import { GpsPoint } from './types';
import { haversineDistance, segmentsIntersect, polygonArea } from './geo';
import { TERRITORY } from '../config/constants';

// ---- Smoothing --------------------------------------------------------

/**
 * Smooth a GPS route using a simple moving-average filter.
 * Window size: 5 points (current point + 2 neighbours on each side).
 * The first and last 2 points are kept as-is so the route endpoints
 * are preserved. Only latitude and longitude are averaged; all other
 * GpsPoint fields are copied from the original point.
 */
export function smoothRoute(points: GpsPoint[]): GpsPoint[] {
  if (points.length <= 4) return [...points];

  const smoothed: GpsPoint[] = [];

  // Keep first 2 points unchanged
  smoothed.push({ ...points[0] });
  smoothed.push({ ...points[1] });

  for (let i = 2; i < points.length - 2; i++) {
    const avgLat =
      (points[i - 2].latitude +
        points[i - 1].latitude +
        points[i].latitude +
        points[i + 1].latitude +
        points[i + 2].latitude) /
      5;
    const avgLng =
      (points[i - 2].longitude +
        points[i - 1].longitude +
        points[i].longitude +
        points[i + 1].longitude +
        points[i + 2].longitude) /
      5;
    smoothed.push({ ...points[i], latitude: avgLat, longitude: avgLng });
  }

  // Keep last 2 points unchanged
  smoothed.push({ ...points[points.length - 2] });
  smoothed.push({ ...points[points.length - 1] });

  return smoothed;
}

// ---- Douglas-Peucker Simplification -----------------------------------

/**
 * Perpendicular distance from a point to a line segment, measured in meters.
 * Uses the haversine-based approach: project the point onto the segment and
 * compute the great-circle distance.
 */
function perpendicularDistanceM(
  point: { latitude: number; longitude: number },
  lineStart: { latitude: number; longitude: number },
  lineEnd: { latitude: number; longitude: number },
): number {
  const dAB = haversineDistance(
    lineStart.latitude, lineStart.longitude,
    lineEnd.latitude, lineEnd.longitude,
  );

  if (dAB === 0) {
    return haversineDistance(
      point.latitude, point.longitude,
      lineStart.latitude, lineStart.longitude,
    );
  }

  // Parametric projection: t = dot(AP, AB) / dot(AB, AB) (in flat approx)
  const dx = lineEnd.longitude - lineStart.longitude;
  const dy = lineEnd.latitude - lineStart.latitude;
  const px = point.longitude - lineStart.longitude;
  const py = point.latitude - lineStart.latitude;

  let t = (px * dx + py * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  const projLat = lineStart.latitude + t * dy;
  const projLng = lineStart.longitude + t * dx;

  return haversineDistance(point.latitude, point.longitude, projLat, projLng);
}

/**
 * Simplify a route using the Douglas-Peucker algorithm.
 * Reduces the number of points while preserving shape.
 *
 * @param points   - ordered list of { latitude, longitude } points
 * @param tolerance - maximum perpendicular distance in **meters** (default 8)
 * @returns simplified list of points
 */
export function simplifyRoute(
  points: GpsPoint[],
  tolerance: number = 8,
): GpsPoint[] {
  if (points.length <= 2) return [...points];

  // Find the point with the maximum perpendicular distance from the
  // line segment formed by the first and last point.
  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistanceM(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    // Recursively simplify both halves
    const left = simplifyRoute(points.slice(0, maxIdx + 1), tolerance);
    const right = simplifyRoute(points.slice(maxIdx), tolerance);
    // Remove duplicate join point
    return [...left.slice(0, -1), ...right];
  }

  // All points are within tolerance - return just the endpoints
  return [points[0], points[points.length - 1]];
}

// ---- Self-intersection Check ------------------------------------------

/**
 * Check if a polygon self-intersects.
 * Compares every pair of non-adjacent edges.
 */
export function isSelfIntersecting(
  points: { latitude: number; longitude: number }[],
): boolean {
  const n = points.length;
  if (n < 4) return false;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      // Skip adjacent edges (they share a vertex)
      if (i === 0 && j === n - 2) continue;

      const intersects = segmentsIntersect(
        [points[i].latitude, points[i].longitude],
        [points[i + 1].latitude, points[i + 1].longitude],
        [points[j].latitude, points[j].longitude],
        [points[j + 1].latitude, points[j + 1].longitude],
      );

      if (intersects) return true;
    }
  }

  return false;
}

// ---- Minimum Polygon Width --------------------------------------------

/**
 * Calculate the approximate minimum bounding width of a polygon in meters.
 * Checks projected widths across N evenly spaced directions (rotating calipers
 * approximation). Returns the smallest width found.
 */
export function minPolygonWidth(
  points: { latitude: number; longitude: number }[],
): number {
  if (points.length < 3) return 0;

  const NUM_DIRECTIONS = 18; // every 10 degrees
  let minWidth = Infinity;

  // Project to approximate meters using centroid latitude
  const avgLat =
    points.reduce((s, p) => s + p.latitude, 0) / points.length;
  const cosLat = Math.cos((avgLat * Math.PI) / 180);
  const metersPerDegreeLat = 111320;

  const projected = points.map((p) => ({
    x: p.longitude * cosLat * metersPerDegreeLat,
    y: p.latitude * metersPerDegreeLat,
  }));

  for (let d = 0; d < NUM_DIRECTIONS; d++) {
    const angle = (d * Math.PI) / NUM_DIRECTIONS;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let minProj = Infinity;
    let maxProj = -Infinity;

    for (const p of projected) {
      const proj = p.x * cosA + p.y * sinA;
      if (proj < minProj) minProj = proj;
      if (proj > maxProj) maxProj = proj;
    }

    const width = maxProj - minProj;
    if (width < minWidth) minWidth = width;
  }

  return minWidth;
}

// ---- Polygon Validation -----------------------------------------------

/**
 * Check if a polygon (route) is valid:
 * - At least 4 points
 * - Not self-intersecting
 * - Has minimum area (500 m^2 from TERRITORY.min_area_m2)
 * - Has minimum width (20 m from TERRITORY.min_polygon_width_m) in at least one direction
 */
export function validatePolygon(
  points: GpsPoint[],
): { valid: boolean; reason?: string } {
  if (points.length < 4) {
    return { valid: false, reason: 'Polygon must have at least 4 points' };
  }

  if (isSelfIntersecting(points)) {
    return { valid: false, reason: 'Polygon must not self-intersect' };
  }

  const area = polygonArea(points);
  if (area < TERRITORY.min_area_m2) {
    return {
      valid: false,
      reason: `Polygon area ${Math.round(area)} m^2 is below minimum ${TERRITORY.min_area_m2} m^2`,
    };
  }

  const width = minPolygonWidth(points);
  if (width < TERRITORY.min_polygon_width_m) {
    return {
      valid: false,
      reason: `Polygon minimum width ${Math.round(width)} m is below minimum ${TERRITORY.min_polygon_width_m} m`,
    };
  }

  return { valid: true };
}

// ---- Close Route ------------------------------------------------------

/**
 * Close a route by connecting the last point to the first.
 * Only succeeds if the gap between first and last point is less than maxGapM.
 *
 * @param maxGapM - maximum gap in meters (default 50 for urban)
 * @returns the closed route (with the first point appended), or null if the gap is too large
 */
export function closeRoute(
  points: GpsPoint[],
  maxGapM: number = 50,
): GpsPoint[] | null {
  if (points.length < 3) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const gap = haversineDistance(
    first.latitude, first.longitude,
    last.latitude, last.longitude,
  );

  if (gap > maxGapM) return null;

  // Already closed?
  if (
    first.latitude === last.latitude &&
    first.longitude === last.longitude
  ) {
    return [...points];
  }

  // Append copy of the first point as the closing point
  return [...points, { ...first, timestamp: last.timestamp }];
}

// ---- WKT Conversions --------------------------------------------------

/**
 * Convert GPS points to PostGIS WKT POLYGON format.
 * e.g., "POLYGON((lng1 lat1, lng2 lat2, ..., lng1 lat1))"
 *
 * If the ring is not already closed (first !== last), it is closed automatically.
 */
export function toWktPolygon(
  points: { latitude: number; longitude: number }[],
): string {
  if (points.length < 3) {
    throw new Error('A polygon requires at least 3 points');
  }

  const pts = [...points];
  const first = pts[0];
  const last = pts[pts.length - 1];

  // Ensure the ring is closed
  if (first.latitude !== last.latitude || first.longitude !== last.longitude) {
    pts.push(first);
  }

  const coords = pts.map((p) => `${p.longitude} ${p.latitude}`).join(', ');
  return `POLYGON((${coords}))`;
}

/**
 * Convert GPS points to PostGIS WKT LINESTRING format.
 */
export function toWktLineString(
  points: { latitude: number; longitude: number }[],
): string {
  if (points.length < 2) {
    throw new Error('A linestring requires at least 2 points');
  }
  const coords = points.map((p) => `${p.longitude} ${p.latitude}`).join(', ');
  return `LINESTRING(${coords})`;
}

/**
 * Convert a single coordinate to PostGIS WKT POINT format.
 */
export function toWktPoint(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

// ---- Full Pipeline ----------------------------------------------------

/**
 * Full pipeline: Raw GPS points --> Claim-ready Polygon.
 *
 * 1. Smooth (moving-average filter)
 * 2. Simplify (Douglas-Peucker, 8 m tolerance)
 * 3. Close route (max gap = closeRadiusM, default 50 m)
 * 4. Validate (area >= 500 m^2, width >= 20 m, no self-intersection)
 *
 * @returns WKT polygon string and area if valid, or an error message.
 */
export function processRouteToPolygon(
  points: GpsPoint[],
  closeRadiusM: number = 50,
): { polygon: string; area: number } | { error: string } {
  if (points.length < 4) {
    return { error: 'Not enough GPS points (need at least 4)' };
  }

  // Step 1: Smooth
  const smoothed = smoothRoute(points);

  // Step 2: Simplify
  const simplified = simplifyRoute(smoothed, 8);

  if (simplified.length < 3) {
    return { error: 'Route too simple after simplification (fewer than 3 points)' };
  }

  // Step 3: Close the route
  const closed = closeRoute(simplified, closeRadiusM);
  if (closed === null) {
    const first = simplified[0];
    const last = simplified[simplified.length - 1];
    const gap = haversineDistance(
      first.latitude, first.longitude,
      last.latitude, last.longitude,
    );
    return {
      error: `Route start/end gap (${Math.round(gap)} m) exceeds maximum (${closeRadiusM} m)`,
    };
  }

  // Step 4: Validate
  const validation = validatePolygon(closed);
  if (!validation.valid) {
    return { error: validation.reason! };
  }

  // Build WKT and compute area
  const area = polygonArea(closed);
  const wkt = toWktPolygon(closed);

  return { polygon: wkt, area };
}

/**
 * Simplified wrapper: raw GPS points --> polygon GpsPoint array or null.
 */
export function routeToPolygon(points: GpsPoint[]): GpsPoint[] | null {
  const result = processRouteToPolygon(points);
  if ('error' in result) return null;
  // processRouteToPolygon returns a WKT string, but callers need points.
  // Re-run the pipeline to get the closed polygon points.
  if (points.length < 4) return null;
  const smoothed = smoothRoute(points);
  const simplified = simplifyRoute(smoothed, 8);
  if (simplified.length < 3) return null;
  const closed = closeRoute(simplified);
  return closed;
}

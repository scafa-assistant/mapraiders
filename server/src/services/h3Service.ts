// ============================================================
// H3 Service — wrapper around h3-js v4
// Uses H3 resolution constants:
//   RES_SPAWN  = 8  (~0.7 km² — spawning / fog-of-war)
//   RES_SECTOR = 6  (~36 km² — AI macro sectors)
//   RES_FINE   = 9  (ruins / scavenging points)
// h3-js v4 function names: latLngToCell, polygonToCells,
// gridDisk, cellToBoundary, cellToParent
// ============================================================

import * as h3 from 'h3-js';

// ---- Resolution constants -----------------------------------

/** Default spawn / fog-of-war resolution (~0.7 km²). */
export const RES_SPAWN = 8;

/** AI macro-sector resolution (~36 km²). */
export const RES_SECTOR = 6;

/** Fine-grained ruins / scavenging resolution. */
export const RES_FINE = 9;

// ---- Public API ---------------------------------------------

/**
 * Return the H3 cell index (as hex string) for a lat/lng point.
 *
 * @param lat  Latitude in decimal degrees.
 * @param lng  Longitude in decimal degrees.
 * @param res  H3 resolution (default: RES_SPAWN = 8).
 */
export function cellForPoint(
  lat: number,
  lng: number,
  res: number = RES_SPAWN,
): string {
  return h3.latLngToCell(lat, lng, res) as string;
}

/**
 * Return all H3 cells that are fully or partially covered by
 * the given polygon (closed loop — first and last points may differ).
 *
 * polygonToCells expects coordinates as [[lat, lng], ...] loops.
 *
 * @param points  Array of {latitude, longitude} vertices.
 * @param res     H3 resolution (default: RES_SPAWN = 8).
 */
export function cellsForPolygon(
  points: { latitude: number; longitude: number }[],
  res: number = RES_SPAWN,
): string[] {
  // Build a closed ring: [[lat, lng], ...]
  const ring = points.map((p) => [p.latitude, p.longitude] as [number, number]);
  // Ensure the ring is closed (last point === first point)
  if (
    ring.length > 0 &&
    (ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1])
  ) {
    ring.push(ring[0]);
  }

  // polygonToCells([outerRing, ...holes], resolution)
  return h3.polygonToCells([ring], res) as string[];
}

/**
 * Return all H3 cells within grid distance k of the given cell
 * (k=0 returns only the cell itself).
 *
 * @param cell  H3 cell index string.
 * @param k     Grid distance (default: 1).
 */
export function disk(cell: string, k: number = 1): string[] {
  return h3.gridDisk(cell, k) as string[];
}

/**
 * Return the boundary vertices of an H3 cell as {latitude, longitude}.
 *
 * @param cell  H3 cell index string.
 */
export function boundary(
  cell: string,
): { latitude: number; longitude: number }[] {
  // cellToBoundary returns [[lat, lng], ...]
  const pairs = h3.cellToBoundary(cell) as [number, number][];
  return pairs.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
}

/**
 * Return the parent cell of the given cell at the specified resolution.
 *
 * @param cell  H3 cell index string.
 * @param res   Target resolution (must be < resolution of cell).
 */
export function parent(cell: string, res: number): string {
  return h3.cellToParent(cell, res) as string;
}

/**
 * Return the geographic center of an H3 cell as {latitude, longitude}.
 *
 * @param cell  H3 cell index string.
 */
export function centerOf(cell: string): { latitude: number; longitude: number } {
  const [lat, lng] = h3.cellToLatLng(cell) as [number, number];
  return { latitude: lat, longitude: lng };
}

/**
 * Return the line of H3 cells between two cells (inclusive of both ends).
 *
 * gridPathCells throws for pentagon-adjacent cells or when the two cells are
 * too far apart / at differing resolutions; in those cases we rethrow a plain
 * Error('PATH_FAILED') so the caller can map it onto a domain error.
 *
 * @param a  Origin H3 cell index string.
 * @param b  Destination H3 cell index string.
 */
export function pathBetween(a: string, b: string): string[] {
  try {
    return h3.gridPathCells(a, b) as string[];
  } catch {
    throw new Error('PATH_FAILED');
  }
}

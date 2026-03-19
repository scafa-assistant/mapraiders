import * as Location from 'expo-location';
import type { GpsPoint, MovementClass } from '../utils/types';
import { SPEED_THRESHOLDS } from '../utils/constants';

export class GpsService {
  private subscription: Location.LocationSubscription | null = null;
  private points: GpsPoint[] = [];
  private startTime: number = 0;

  /**
   * Request foreground and background location permissions.
   * Returns true if at least foreground permission was granted.
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        return false;
      }

      // Attempt background permission (may not be granted, but that's okay)
      try {
        await Location.requestBackgroundPermissionsAsync();
      } catch {
        // Background permission is optional; foreground is sufficient for basic use.
      }

      return true;
    } catch (error) {
      console.error('[GpsService] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Start continuous GPS tracking.
   * Calls onLocationUpdate each time a new point is recorded.
   */
  async startTracking(
    onLocationUpdate: (point: GpsPoint) => void
  ): Promise<void> {
    // If already tracking, stop first
    if (this.subscription) {
      await this.stopTracking();
    }

    this.points = [];
    this.startTime = Date.now();

    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 3000,
      },
      (location) => {
        const point: GpsPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude ?? undefined,
          timestamp: location.timestamp,
          speed: location.coords.speed ?? undefined,
        };

        this.points.push(point);
        onLocationUpdate(point);
      }
    );
  }

  /**
   * Stop tracking and return all collected points.
   */
  async stopTracking(): Promise<GpsPoint[]> {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    const collectedPoints = [...this.points];
    this.points = [];
    return collectedPoints;
  }

  /**
   * Whether GPS tracking is currently active.
   */
  get isTracking(): boolean {
    return this.subscription !== null;
  }

  /**
   * Get tracking duration in milliseconds.
   */
  get trackingDuration(): number {
    if (!this.startTime || !this.subscription) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Get all collected points so far (without stopping).
   */
  get collectedPoints(): GpsPoint[] {
    return [...this.points];
  }

  /**
   * Calculate total distance of collected points in meters.
   */
  get totalDistance(): number {
    return calculateTotalDistance(this.points);
  }

  /**
   * Get current location once.
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('[GpsService] getCurrentLocation failed:', error);
      throw new Error('Unable to get current location. Check permissions.');
    }
  }

  /**
   * Detect movement class from recent GPS points based on average speed.
   */
  detectClass(points: GpsPoint[]): MovementClass {
    if (points.length < 2) return 'walker';

    // Use the last 10 points for speed averaging
    const recentPoints = points.slice(-10);
    const speeds: number[] = [];

    for (const p of recentPoints) {
      if (p.speed !== undefined && p.speed >= 0) {
        speeds.push(p.speed);
      }
    }

    // If no speed data from GPS, calculate from positions
    if (speeds.length === 0) {
      for (let i = 1; i < recentPoints.length; i++) {
        const dist = haversineDistance(
          recentPoints[i - 1].latitude,
          recentPoints[i - 1].longitude,
          recentPoints[i].latitude,
          recentPoints[i].longitude
        );
        const dt = (recentPoints[i].timestamp - recentPoints[i - 1].timestamp) / 1000;
        if (dt > 0) {
          speeds.push(dist / dt);
        }
      }
    }

    if (speeds.length === 0) return 'walker';

    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

    if (avgSpeed < SPEED_THRESHOLDS.stationary) return 'walker';
    if (avgSpeed < SPEED_THRESHOLDS.walking) return 'walker';
    if (avgSpeed < SPEED_THRESHOLDS.running) return 'runner';
    if (avgSpeed < SPEED_THRESHOLDS.cycling) return 'cyclist';
    if (avgSpeed < SPEED_THRESHOLDS.driving) return 'cyclist';
    return 'driver';
  }
}

// ─── Utility Functions ──────────────────────────────────────────────────────

/**
 * Calculate the Haversine distance between two lat/lng points in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate total distance of a point array in meters.
 */
export function calculateTotalDistance(points: GpsPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }
  return total;
}

// ─── Singleton ──────────────────────────────────────────────────────────────

export const gpsService = new GpsService();

import { useState, useEffect, useCallback, useRef } from 'react';
import { gpsService } from '../services/gps';
import type { GpsPoint, MovementClass } from '../utils/types';

interface UseLocationReturn {
  /** Current location coordinates, or null if not yet available. */
  location: { latitude: number; longitude: number } | null;
  /** Whether GPS tracking is currently active. */
  isTracking: boolean;
  /** All GPS points collected during the current tracking session. */
  points: GpsPoint[];
  /** Total distance covered in current session (meters). */
  distance: number;
  /** Duration of current session (seconds). */
  duration: number;
  /** Detected movement class from recent GPS data. */
  detectedClass: MovementClass;
  /** Start GPS tracking. */
  startTracking: () => Promise<void>;
  /** Stop GPS tracking and return collected points. */
  stopTracking: () => Promise<GpsPoint[]>;
  /** Refresh current location (one-shot). */
  refreshLocation: () => Promise<void>;
  /** Whether location permission has been granted. */
  hasPermission: boolean;
  /** Request location permissions. */
  requestPermission: () => Promise<boolean>;
  /** Error message, if any. */
  error: string | null;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [detectedClass, setDetectedClass] = useState<MovementClass>('walker');
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingStartRef = useRef<number>(0);

  // Request permission on mount
  useEffect(() => {
    (async () => {
      const granted = await gpsService.requestPermissions();
      setHasPermission(granted);

      if (granted) {
        try {
          const loc = await gpsService.getCurrentLocation();
          setLocation(loc);
        } catch (err) {
          console.warn('[useLocation] Could not get initial location:', err);
        }
      }
    })();

    return () => {
      // Clean up duration interval on unmount
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await gpsService.requestPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  const refreshLocation = useCallback(async () => {
    try {
      setError(null);
      const loc = await gpsService.getCurrentLocation();
      setLocation(loc);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
    }
  }, []);

  const startTracking = useCallback(async () => {
    try {
      setError(null);
      setPoints([]);
      setDistance(0);
      setDuration(0);
      setDetectedClass('walker');
      trackingStartRef.current = Date.now();

      await gpsService.startTracking((point) => {
        setLocation({ latitude: point.latitude, longitude: point.longitude });
        setPoints((prev) => {
          const next = [...prev, point];
          // Update distance
          setDistance(gpsService.totalDistance);
          // Update detected class every 5 points
          if (next.length % 5 === 0 || next.length < 5) {
            setDetectedClass(gpsService.detectClass(next));
          }
          return next;
        });
      });

      setIsTracking(true);

      // Update duration every second
      durationIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - trackingStartRef.current) / 1000;
        setDuration(Math.floor(elapsed));
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start tracking';
      setError(message);
      setIsTracking(false);
    }
  }, []);

  const stopTracking = useCallback(async (): Promise<GpsPoint[]> => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    const collectedPoints = await gpsService.stopTracking();
    setIsTracking(false);
    return collectedPoints;
  }, []);

  return {
    location,
    isTracking,
    points,
    distance,
    duration,
    detectedClass,
    startTracking,
    stopTracking,
    refreshLocation,
    hasPermission,
    requestPermission,
    error,
  };
}

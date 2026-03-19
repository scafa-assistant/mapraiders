import { create } from 'zustand';
import * as Location from 'expo-location';
import api from '../services/api';
import { GpsPoint, MovementClass } from '../navigation/types';

interface LocationState {
  currentLocation: { latitude: number; longitude: number } | null;
  isTracking: boolean;
  currentRoute: GpsPoint[];
  detectedClass: MovementClass;
  recordingStartTime: number | null;
  totalDistance: number;
  locationSubscription: Location.LocationSubscription | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<GpsPoint[]>;
  updateLocation: (location: Location.LocationObject) => void;
  requestPermissions: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
}

function classifyMovement(speeds: number[]): MovementClass {
  if (speeds.length < 3) return 'unknown';
  const recentSpeeds = speeds.slice(-10);
  const avgSpeed =
    recentSpeeds.reduce((sum, s) => sum + s, 0) / recentSpeeds.length;
  const avgKmh = avgSpeed * 3.6;

  if (avgKmh < 1) return 'unknown';
  if (avgKmh < 6) return 'walker';
  if (avgKmh < 14) return 'runner';
  if (avgKmh < 30) return 'cyclist';
  if (avgKmh < 50) return 'skater';
  return 'driver';
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isTracking: false,
  currentRoute: [],
  detectedClass: 'unknown',
  recordingStartTime: null,
  totalDistance: 0,
  locationSubscription: null,

  requestPermissions: async () => {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') return false;

    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    return background === 'granted';
  },

  getCurrentLocation: async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      set({
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });
    } catch (_err) {
      // Location unavailable
    }
  },

  updateLocation: (location: Location.LocationObject) => {
    const { currentRoute, isTracking } = get();
    const newPoint: GpsPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude ?? undefined,
      timestamp: location.timestamp,
      speed: location.coords.speed ?? undefined,
    };

    set({
      currentLocation: {
        latitude: newPoint.latitude,
        longitude: newPoint.longitude,
      },
    });

    if (isTracking) {
      const updatedRoute = [...currentRoute, newPoint];
      let distance = get().totalDistance;
      if (currentRoute.length > 0) {
        const prev = currentRoute[currentRoute.length - 1];
        distance += haversineDistance(
          prev.latitude,
          prev.longitude,
          newPoint.latitude,
          newPoint.longitude
        );
      }

      const speeds = updatedRoute
        .filter((p) => p.speed !== undefined && p.speed !== null)
        .map((p) => p.speed as number);
      const detectedClass = classifyMovement(speeds);

      set({
        currentRoute: updatedRoute,
        detectedClass,
        totalDistance: distance,
      });
    }
  },

  startTracking: async () => {
    const granted = await get().requestPermissions();
    if (!granted) return;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 3,
      },
      (location) => {
        get().updateLocation(location);
      }
    );

    set({
      isTracking: true,
      currentRoute: [],
      totalDistance: 0,
      recordingStartTime: Date.now(),
      detectedClass: 'unknown',
      locationSubscription: subscription,
    });
  },

  stopTracking: async () => {
    const { locationSubscription, currentRoute, detectedClass } = get();

    if (locationSubscription) {
      locationSubscription.remove();
    }

    set({
      isTracking: false,
      locationSubscription: null,
      recordingStartTime: null,
    });

    if (currentRoute.length >= 2) {
      try {
        await api.post('/claims', {
          route: currentRoute,
          movementClass: detectedClass,
        });
      } catch (_err) {
        // Claim submission failed - will retry later
      }
    }

    return currentRoute;
  },
}));

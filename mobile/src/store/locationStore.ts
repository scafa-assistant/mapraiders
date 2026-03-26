import { create } from 'zustand';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import api, { routeApi } from '../services/api';
import { GpsPoint, MovementClass } from '../navigation/types';
import { offlineQueue } from '../services/offlineQueue';
import {
  startBackgroundTracking,
  stopBackgroundTracking,
  getBackgroundPoints,
  clearBackgroundPoints,
} from '../services/backgroundLocation';
import { sensorFusion } from '../services/sensorFusion';
import { mapRaidersWs } from '../services/websocket';
import { useAuthStore } from './authStore';

export interface ClaimResultData {
  territory_id: string;
  claim_value: number;
  xp_earned: number;
  is_takeover: boolean;
  area_m2: number;
  blocked_by_defenses?: { territory_id: string; owner_id: string; defense_count: number; defenses: { id: string; game_type: string }[] }[];
}

interface LocationState {
  currentLocation: { latitude: number; longitude: number } | null;
  isTracking: boolean;
  currentRoute: GpsPoint[];
  detectedClass: MovementClass;
  recordingStartTime: number | null;
  totalDistance: number;
  locationSubscription: Location.LocationSubscription | null;
  pendingUploads: number;
  lastClaimResult: ClaimResultData | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<GpsPoint[]>;
  cancelTracking: () => void;
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
  pendingUploads: offlineQueue.getQueueSize(),
  lastClaimResult: null,

  requestPermissions: async () => {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') return false;

    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    return background === 'granted';
  },

  getCurrentLocation: async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 5000, // Accept cached location only if < 5 seconds old
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

    // Send location update via WebSocket
    mapRaidersWs.sendLocationUpdate(newPoint.latitude, newPoint.longitude);

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

    // Clear any leftover background points from a previous session
    await clearBackgroundPoints();

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

    // Start background tracking as a fallback for when the app is killed
    startBackgroundTracking().catch((err) =>
      console.warn('[LocationStore] Background tracking failed to start:', err)
    );

    // Start sensor fusion for accelerometer/gyroscope data collection
    sensorFusion.start().catch((err) =>
      console.warn('[LocationStore] Sensor fusion failed to start:', err)
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

    // Collect sensor analysis before stopping
    const sensorAnalysis = sensorFusion.getAnalysis();
    sensorFusion.stop();
    sensorFusion.reset();

    // Stop background tracking
    await stopBackgroundTracking().catch((err) =>
      console.warn('[LocationStore] Background tracking failed to stop:', err)
    );

    // Merge background points that were collected while app was in background/killed
    let mergedRoute = [...currentRoute];
    try {
      const bgPoints = await getBackgroundPoints();
      if (bgPoints.length > 0) {
        // Only merge background points that aren't already in the foreground route
        const existingTimestamps = new Set(currentRoute.map((p) => p.timestamp));
        const newBgPoints: GpsPoint[] = bgPoints
          .filter((p) => !existingTimestamps.has(p.timestamp))
          .map((p) => ({
            latitude: p.latitude,
            longitude: p.longitude,
            altitude: p.altitude ?? undefined,
            timestamp: p.timestamp,
            speed: p.speed ?? undefined,
          }));

        if (newBgPoints.length > 0) {
          mergedRoute = [...mergedRoute, ...newBgPoints].sort(
            (a, b) => a.timestamp - b.timestamp
          );
          console.log(`[LocationStore] Merged ${newBgPoints.length} background points`);
        }

        await clearBackgroundPoints();
      }
    } catch (err) {
      console.warn('[LocationStore] Failed to merge background points:', err);
    }

    set({
      isTracking: false,
      locationSubscription: null,
      recordingStartTime: null,
      currentRoute: mergedRoute,
    });

    if (mergedRoute.length >= 2) {
      // Check network status before uploading
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable !== false;

      const uploadPayload = {
        points: mergedRoute,
        class: detectedClass,
        sensorData: sensorAnalysis.sampleCount > 0 ? sensorAnalysis : undefined,
      };

      if (isOnline) {
        try {
          const result = await routeApi.upload({ points: mergedRoute, class: detectedClass });
          console.log('[Route] Claim successful:', JSON.stringify(result.data).substring(0, 200));

          // Store the server claim result for MapScreen to use
          const serverData = result.data?.data ?? result.data;
          if (serverData) {
            set({
              lastClaimResult: {
                territory_id: serverData.territory_id ?? '',
                claim_value: serverData.claim_value ?? 0,
                xp_earned: serverData.xp_earned ?? 0,
                is_takeover: serverData.is_takeover ?? false,
                area_m2: serverData.claim_value ?? 0,
                blocked_by_defenses: serverData.blocked_by_defenses ?? undefined,
              },
            });
          }

          // Refresh user profile to update XP display
          try {
            await useAuthStore.getState().refreshProfile();
          } catch (profileErr) {
            console.warn('[Route] Profile refresh failed:', profileErr);
          }
        } catch (err: any) {
          console.error('[Route] Claim failed:', err?.message);
          // Upload failed despite being online - queue for later
          await offlineQueue.enqueue({
            points: mergedRoute,
            class: detectedClass,
            sensorData: sensorAnalysis.sampleCount > 0 ? sensorAnalysis : undefined,
          });
          set({ pendingUploads: offlineQueue.getQueueSize() });
        }
      } else {
        // Offline - queue the route for later sync
        await offlineQueue.enqueue({
          points: mergedRoute,
          class: detectedClass,
          sensorData: sensorAnalysis.sampleCount > 0 ? sensorAnalysis : undefined,
        });
        set({ pendingUploads: offlineQueue.getQueueSize() });
      }
    }

    return mergedRoute;
  },

  /**
   * Cancel tracking WITHOUT uploading the route. Discards the current route.
   */
  cancelTracking: () => {
    const { locationSubscription } = get();
    if (locationSubscription) {
      locationSubscription.remove();
    }
    sensorFusion.stop();
    sensorFusion.reset();
    stopBackgroundTracking().catch(() => {});
    clearBackgroundPoints().catch(() => {});
    set({
      isTracking: false,
      locationSubscription: null,
      recordingStartTime: null,
      currentRoute: [],
      totalDistance: 0,
    });
    console.log('[LocationStore] Tracking cancelled — route discarded');
  },
}));

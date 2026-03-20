import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_LOCATION_TASK = 'mapraiders-background-location';
const BG_POINTS_KEY = '@mapraiders_bg_points';

// Define the background task OUTSIDE of any component
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BGLocation] Error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const stored = await AsyncStorage.getItem(BG_POINTS_KEY);
    const points = stored ? JSON.parse(stored) : [];

    for (const loc of locations) {
      points.push({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        speed: loc.coords.speed,
        timestamp: loc.timestamp,
      });
    }

    // Keep max 10000 points to prevent storage overflow
    if (points.length > 10000) points.splice(0, points.length - 10000);

    await AsyncStorage.setItem(BG_POINTS_KEY, JSON.stringify(points));
  }
});

export async function startBackgroundTracking(): Promise<boolean> {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return false;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') return false;

  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (isRunning) return true;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 5,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'MapRaiders',
      notificationBody: 'Recording your route...',
      notificationColor: '#00D4FF',
    },
    pausesUpdatesAutomatically: false,
  });

  return true;
}

export async function stopBackgroundTracking(): Promise<void> {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

export async function getBackgroundPoints(): Promise<any[]> {
  const stored = await AsyncStorage.getItem(BG_POINTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function clearBackgroundPoints(): Promise<void> {
  await AsyncStorage.removeItem(BG_POINTS_KEY);
}

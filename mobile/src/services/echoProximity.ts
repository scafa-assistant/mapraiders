import { echoApi } from './api';
import { audioService } from './audio';
import { useLocationStore } from '../store/locationStore';

// ─── Types ─────────────────────────────────────────────────────────────────

interface NearbyEcho {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  audioUrl: string;
  creatorUsername: string;
}

// ─── Haversine ─────────────────────────────────────────────────────────────

/**
 * Calculate the distance in meters between two GPS coordinates
 * using the Haversine formula.
 */
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Echo Proximity Service ────────────────────────────────────────────────

/**
 * Monitors user location and auto-plays echos when within range.
 * Start when entering the map screen, stop when leaving.
 */
class EchoProximityService {
  private nearbyEchos: NearbyEcho[] = [];
  private playedEchoIds: Set<string> = new Set(); // Don't replay same echo
  private isActive: boolean = false;
  private refreshInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring - called when user enters map screen.
   */
  start(): void {
    this.isActive = true;
    this.refreshNearbyEchos();
    this.refreshInterval = setInterval(() => this.refreshNearbyEchos(), 30000); // Refresh every 30s
  }

  /**
   * Stop monitoring - called when user leaves map screen.
   */
  stop(): void {
    this.isActive = false;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    audioService.stop();
  }

  /**
   * Called on each location update from locationStore.
   * Checks if user has entered any echo radius and triggers playback.
   */
  async onLocationUpdate(lat: number, lng: number): Promise<void> {
    if (!this.isActive) return;

    for (const echo of this.nearbyEchos) {
      if (this.playedEchoIds.has(echo.id)) continue;

      const distance = haversine(lat, lng, echo.latitude, echo.longitude);
      if (distance <= echo.radius) {
        // User entered echo radius!
        this.playedEchoIds.add(echo.id);
        await this.playEcho(echo, distance);
      }
    }
  }

  /**
   * Fetch nearby echos from the API based on current location.
   */
  private async refreshNearbyEchos(): Promise<void> {
    try {
      const location = useLocationStore.getState().currentLocation;
      if (!location) return;

      const response = await echoApi.getNearby(
        location.latitude,
        location.longitude,
        500 // 500m search radius
      );

      const echos = response.data?.data ?? response.data ?? [];
      this.nearbyEchos = echos.map((echo: any) => ({
        id: echo.id,
        latitude: echo.latitude ?? echo.location?.latitude,
        longitude: echo.longitude ?? echo.location?.longitude,
        radius: echo.radius_m ?? echo.radius ?? 40,
        audioUrl: echo.audio_url ?? echo.audioUrl,
        creatorUsername: echo.creator_username ?? echo.creatorUsername ?? 'Unknown',
      }));
    } catch (err) {
      console.error('[EchoProximity] Failed to refresh nearby echos:', err);
    }
  }

  /**
   * Play an echo with volume based on proximity (closer = louder).
   */
  private async playEcho(echo: NearbyEcho, distance: number): Promise<void> {
    try {
      const volume = Math.max(0.2, 1 - distance / echo.radius);
      await audioService.play(echo.audioUrl);
      await audioService.setVolume(volume);
    } catch (err) {
      console.error('[EchoProximity] Failed to play echo:', err);
    }
  }

  /**
   * Reset played echos (e.g., when user has moved far away).
   */
  resetPlayed(): void {
    this.playedEchoIds.clear();
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────

export const echoProximityService = new EchoProximityService();

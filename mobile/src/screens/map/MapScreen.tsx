import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polygon, Polyline, Circle, PROVIDER_GOOGLE, Region, LongPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { useTerritoryStore } from '../../store/territoryStore';
import { useQuestStore } from '../../store/questStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTheme } from '../../hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { echoProximityService } from '../../services/echoProximity';
import { echoApi, artifactApi, weatherApi, silentZoneApi, resonanceApi, meetupApi, territoryApi, MyTerritory } from '../../services/api';
import EchoMarker from '../../components/EchoMarker';
import PvESpawnMarker, { TerminalMarker } from '../../components/PvESpawnMarker';
import StreifzugEncounterCard from '../../components/StreifzugEncounterCard';
import { useStreifzug } from '../../hooks/useStreifzug';
import { useFeatureStore } from '../../store/featureStore';
import { usePveStore } from '../../store/pveStore';
import { useResourceStore } from '../../store/resourceStore';
import ResourceBar from '../../components/ResourceBar';
import { MapScreenProps, MovementClass, Territory, Echo, MapStackParamList } from '../../navigation/types';
import type { WeatherData, WeatherBonus } from '../../utils/types';
import { isNightTime, getNightModeStyles } from '../../utils/nightMode';
import { getMapStyle } from '../../utils/mapStyles';
import { strings as S, t, plural } from '../../i18n';

const WEATHER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  clear: 'sunny',
  rain: 'rainy',
  snow: 'snow',
  fog: 'cloud',
  wind: 'flag',
  storm: 'thunderstorm',
};

const WEATHER_BONUSES: Record<string, WeatherBonus> = {
  clear: { multiplier: 1.0, label: '1x' },
  rain: { multiplier: 1.5, label: '1.5x' },
  snow: { multiplier: 2.0, label: '2x' },
  fog: { multiplier: 1.3, label: '1.3x' },
  wind: { multiplier: 1.2, label: '1.2x' },
  storm: { multiplier: 2.5, label: '2.5x' },
};

const { width, height } = Dimensions.get('window');

const CLASS_COLORS: Record<MovementClass, string> = {
  walker: '#1558F0',
  runner: '#D7263D',
  cyclist: '#1B9E5A',
  skater: '#F5A623',
  dog_walker: '#4B7BFF',
  driver: '#7A7470',
  unknown: '#C0BAB4',
};

const getClassLabels = (): Record<MovementClass, string> => ({
  walker: S.map.mapScreen.classWalker,
  runner: S.map.mapScreen.classRunner,
  cyclist: S.map.mapScreen.classCyclist,
  skater: S.map.mapScreen.classSkater,
  dog_walker: S.map.mapScreen.classDogWalker,
  driver: S.map.mapScreen.classDriver,
  unknown: S.map.mapScreen.classDetecting,
});

const CLASS_ICONS: Record<MovementClass, keyof typeof Ionicons.glyphMap> = {
  walker: 'walk',
  runner: 'speedometer',
  cyclist: 'bicycle',
  skater: 'flash',
  dog_walker: 'paw',
  driver: 'car',
  unknown: 'help-circle',
};

function getPolygonCentroid(polygon: any[]): { latitude: number; longitude: number } | null {
  if (!polygon || !Array.isArray(polygon) || polygon.length === 0) return null;
  let latSum = 0;
  let lngSum = 0;
  let count = 0;
  for (const p of polygon) {
    if (p && typeof p.latitude === 'number' && typeof p.longitude === 'number') {
      latSum += p.latitude;
      lngSum += p.longitude;
      count++;
    }
  }
  if (count === 0) return null;
  return { latitude: latSum / count, longitude: lngSum / count };
}

export default function MapScreen({ navigation }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);
  // True only once the native map finished initializing. getMapBoundaries()
  // crashes NATIVELY (uncatchable NPE) if called before this — so every bbox
  // read gates on it. Set in <MapView onMapReady>.
  const mapReadyRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const recordingPulse = useRef(new Animated.Value(0)).current;

  const {
    currentLocation,
    isTracking,
    currentRoute,
    detectedClass,
    totalDistance,
    startTracking,
    stopTracking,
    cancelTracking,
    getCurrentLocation,
    requestPermissions,
    lastClaimResult,
  } = useLocationStore();

  const { territories, fetchTerritories } = useTerritoryStore();
  const { nearbyQuests, fetchNearby, fetchInBounds: fetchQuestsInBounds } = useQuestStore();
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const theme = useTheme();

  // PvE feature gate — spawns only rendered when flag + capability are both active
  const isPveEnabled = useFeatureStore((s) => s.isEnabled('pve_spawns') && s.capabilities.pve);
  const { spawns: pveSpawns, fetchSpawns: fetchPveSpawns } = usePveStore();

  // Streifzug (patrol mode, Stage 1) — foreground session that surfaces nearby
  // encounters. Gated behind the same pve_spawns feature (encounters ARE spawns).
  const streifzug = useStreifzug();

  // Terminals feature gate — Terminal markers only when flag + capability are both active
  const isTerminalsEnabled = useFeatureStore((s) => s.isEnabled('terminals') && s.capabilities.terminals);

  // Resources feature gate — ResourceBar only when flag + capability are both active
  const isResourcesEnabled = useFeatureStore((s) => s.isEnabled('resources') && s.capabilities.resources);
  const { balances, fetchResources } = useResourceStore();
  const classLabels = React.useMemo(getClassLabels, []);

  const [canCloseClaim, setCanCloseClaim] = useState(false);
  const [hideOverlays, setHideOverlays] = useState(false); // Briefly hides polygons to force native re-render
  const CLOSE_THRESHOLD_M = 50;
  const [showClaimResult, setShowClaimResult] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    area: number;
    xp: number;
  } | null>(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const [nearbyEchos, setNearbyEchos] = useState<(Echo & { likes?: number })[]>([]);
  const [nearbyArtifacts, setNearbyArtifacts] = useState<
    { id: string; name: string; rarity: string; location: { latitude: number; longitude: number } }[]
  >([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [nightMode, setNightMode] = useState(isNightTime());
  const [silentZones, setSilentZones] = useState<
    { id: string; name: string; polygon: { coordinates: number[][][] }; distance_m: number }[]
  >([]);
  const [weatherQuestCount, setWeatherQuestCount] = useState(0);
  const [resonanceSpots, setResonanceSpots] = useState<
    { id: string; lat: number; lng: number; resonance_level: number; bonus_multiplier: number; content_types: string[] }[]
  >([]);
  const [nearbyMeetups, setNearbyMeetups] = useState<any[]>([]);
  const [lastKnownLocation, setLastKnownLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const lastWeatherFetch = useRef<{ lat: number; lng: number } | null>(null);

  // "My Territories" list sheet
  const [showMyTerritories, setShowMyTerritories] = useState(false);
  const [myTerritories, setMyTerritories] = useState<MyTerritory[]>([]);
  const [myTerritoriesLoading, setMyTerritoriesLoading] = useState(false);

  // Load last known location from storage for instant map positioning
  useEffect(() => {
    (async () => {
      try {
        const stored = await (await import('@react-native-async-storage/async-storage')).default.getItem('@mapraiders_last_location');
        if (stored) setLastKnownLocation(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  // Fetch weather on mount and significant location change (>500m)
  useEffect(() => {
    if (!currentLocation) return;
    const shouldFetch = !lastWeatherFetch.current ||
      Math.abs(currentLocation?.latitude ?? 0 - lastWeatherFetch.current.lat) > 0.005 ||
      Math.abs(currentLocation?.longitude ?? 0 - lastWeatherFetch.current.lng) > 0.005;

    if (shouldFetch) {
      lastWeatherFetch.current = {
        lat: currentLocation?.latitude ?? 0,
        lng: currentLocation?.longitude ?? 0,
      };
      weatherApi
        .getCurrent(currentLocation?.latitude ?? 0, currentLocation?.longitude ?? 0)
        .then((res) => {
          setWeather(res.data);
          // Count weather-specific quests from nearbyQuests
          const condition = res.data?.condition;
          if (condition && nearbyQuests) {
            const count = nearbyQuests.filter(
              (q: any) => q.weather_condition && q.weather_condition === condition
            ).length;
            setWeatherQuestCount(count);
          }
        })
        .catch(() => { /* silently ignore weather fetch errors */ });
    }
  }, [currentLocation]);

  // Pulse animation for current location marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Keep map centered on user while walking/tracking
  useEffect(() => {
    if (!currentLocation || !mapRef.current) return;
    // Only auto-center if tracking OR if user hasn't manually scrolled
    if (isTracking) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
  }, [currentLocation, isTracking]);

  // Recording pulse animation
  useEffect(() => {
    if (isTracking) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(recordingPulse, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isTracking]);

  // Night mode check every minute
  useEffect(() => {
    setNightMode(isNightTime());
    const interval = setInterval(() => {
      setNightMode(isNightTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Start/stop echo proximity monitoring on mount/unmount
  useEffect(() => {
    try { echoProximityService.start(); } catch {}
    return () => {
      try { echoProximityService.stop(); } catch {}
    };
  }, []);

  // Safe route array — declared before useEffects that reference it
  const safeRoute = Array.isArray(currentRoute) ? currentRoute : [];

  // Check if user is close enough to start point to close the polygon
  useEffect(() => {
    if (!isTracking || !currentLocation || safeRoute.length < 10) {
      setCanCloseClaim(false);
      return;
    }
    const start = safeRoute[0];
    if (!start) return;
    const dlat = (currentLocation?.latitude ?? 0) - start.latitude;
    const dlng = (currentLocation?.longitude ?? 0) - start.longitude;
    const distM = Math.sqrt(dlat * dlat + dlng * dlng) * 111320;
    setCanCloseClaim(distM <= CLOSE_THRESHOLD_M);
  }, [currentLocation, isTracking, safeRoute]);

  // Feed location updates to echo proximity service
  useEffect(() => {
    if (currentLocation) {
      echoProximityService.onLocationUpdate(
        currentLocation?.latitude ?? 0,
        currentLocation?.longitude ?? 0
      );
    }
  }, [currentLocation]);

  // Helper to get current map bounding box
  const getMapBounds = useCallback(async () => {
    // Guard against the native getMapBoundaries() NPE: never call it before
    // the map reports ready (the JS ref exists well before the native map does).
    if (!mapRef.current || !mapReadyRef.current) return null;
    try {
      const bounds = await mapRef.current.getMapBoundaries();
      return {
        north: bounds.northEast.latitude,
        south: bounds.southWest.latitude,
        east: bounds.northEast.longitude,
        west: bounds.southWest.longitude,
      };
    } catch {
      return null;
    }
  }, []);

  // Fetch echos, artifacts, silent zones, resonance based on map viewport
  const fetchNearbyEchos = useCallback(async () => {
    const bbox = await getMapBounds();
    if (!bbox) return;
    try {
      const { data } = await echoApi.getInBounds(bbox);
      const echos = data?.data?.echos ?? data?.data ?? data ?? [];
      setNearbyEchos(Array.isArray(echos) ? echos : []);
    } catch (_err) {
      // Silently fail
    }
  }, [getMapBounds]);

  const fetchNearbySilentZones = useCallback(async () => {
    const bbox = await getMapBounds();
    if (!bbox) return;
    try {
      const { data } = await silentZoneApi.getInBounds(bbox);
      const zones = data.data?.zones ?? data.zones ?? [];
      setSilentZones(zones);
    } catch (_err) {
      // Silently fail
    }
  }, [getMapBounds]);

  const fetchNearbyArtifacts = useCallback(async () => {
    const bbox = await getMapBounds();
    if (!bbox) return;
    try {
      const { data } = await artifactApi.getInBounds(bbox);
      const arts = data?.data?.artifacts ?? data?.data ?? data ?? [];
      setNearbyArtifacts(Array.isArray(arts) ? arts : []);
    } catch (_err) {
      // Silently fail
    }
  }, [getMapBounds]);

  const fetchNearbyResonance = useCallback(async () => {
    const bbox = await getMapBounds();
    if (!bbox) return;
    try {
      const { data } = await resonanceApi.getInBounds(bbox);
      const spots = data.data?.resonance_spots ?? data.resonance_spots ?? [];
      setResonanceSpots(spots);
    } catch (_err) {
      // Silently fail
    }
  }, [getMapBounds]);

  const fetchNearbyMeetups = useCallback(async () => {
    const bbox = await getMapBounds();
    if (!bbox) return;
    try {
      const { data } = await meetupApi.getInBounds(bbox);
      const meetups = data?.data?.meetups ?? data?.data ?? data ?? [];
      setNearbyMeetups(Array.isArray(meetups) ? meetups : []);
    } catch {
      // Silently fail
    }
  }, [getMapBounds]);

  // PvE spawns — only fetched when feature flag is active
  const fetchNearbyPveSpawns = useCallback(async () => {
    if (!isPveEnabled) return;
    const bounds = await getMapBounds();
    if (!bounds) return;
    // Build "minLng,minLat,maxLng,maxLat" bbox string expected by /api/pve/spawns
    const bboxStr = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
    fetchPveSpawns(bboxStr);
  }, [isPveEnabled, getMapBounds, fetchPveSpawns]);

  useEffect(() => {
    fetchNearbyEchos();
    fetchNearbyArtifacts();
    fetchNearbySilentZones();
    fetchNearbyResonance();
    fetchNearbyMeetups();
    fetchNearbyPveSpawns();
  }, [fetchNearbyEchos, fetchNearbyArtifacts, fetchNearbySilentZones, fetchNearbyResonance, fetchNearbyMeetups, fetchNearbyPveSpawns]);

  // Initial location fetch - request permission and center map on user
  const initialLocationDone = useRef(false);
  useEffect(() => {
    (async () => {
      await requestPermissions();
      await getCurrentLocation();
    })();
  }, []);

  // Center map on user once we first get a location
  useEffect(() => {
    if (currentLocation && !initialLocationDone.current && mapRef.current) {
      initialLocationDone.current = true;
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation?.latitude ?? 0,
          longitude: currentLocation?.longitude ?? 0,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        600
      );
    }
  }, [currentLocation]);

  // Fix: react-native-maps Android doesn't repaint Polygon overlays after screen freeze.
  // Solution: Remove all overlays from the native layer, wait one frame, re-add them.
  // This forces Android MapView to fully re-render all polygons/markers.
  useFocusEffect(
    useCallback(() => {
      setHideOverlays(true);
      const timer = setTimeout(() => setHideOverlays(false), 100);
      return () => clearTimeout(timer);
    }, [])
  );

  // Resources: fetch balances on focus when feature flag is active (best-effort)
  useFocusEffect(
    useCallback(() => {
      if (isResourcesEnabled) {
        fetchResources();
      }
    }, [isResourcesEnabled, fetchResources])
  );

  // Fetch territories and all content when region changes (using viewport bbox)
  const handleRegionChange = useCallback(
    (region: Region) => {
      const bbox = {
        north: region.latitude + region.latitudeDelta / 2,
        south: region.latitude - region.latitudeDelta / 2,
        east: region.longitude + region.longitudeDelta / 2,
        west: region.longitude - region.longitudeDelta / 2,
      };
      fetchTerritories(bbox);
      fetchQuestsInBounds(bbox);
      fetchNearbyEchos();
      fetchNearbyArtifacts();
      fetchNearbySilentZones();
      fetchNearbyResonance();
      fetchNearbyMeetups();
      fetchNearbyPveSpawns();
    },
    [fetchTerritories, fetchQuestsInBounds, fetchNearbyEchos, fetchNearbyArtifacts, fetchNearbySilentZones, fetchNearbyResonance, fetchNearbyMeetups, fetchNearbyPveSpawns]
  );

  // City/place search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const Location = await import('expo-location');
      const results = await Location.geocodeAsync(searchQuery.trim());
      if (results.length > 0 && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 800);
        setShowSearch(false);
        setSearchQuery('');
      } else {
        Alert.alert(S.map.mapScreen.searchNotFoundTitle, S.map.mapScreen.searchNotFoundMsg);
      }
    } catch {
      Alert.alert(S.common.error, S.map.mapScreen.searchFailed);
    } finally {
      setIsSearching(false);
    }
  };

  // Center map on current location
  const centerOnUser = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation?.latitude ?? 0,
          longitude: currentLocation?.longitude ?? 0,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  // ─── My Territories list ──────────────────────────────────────────────────
  const fetchMyTerritories = useCallback(async () => {
    setMyTerritoriesLoading(true);
    try {
      const list = await territoryApi.mine();
      setMyTerritories(Array.isArray(list) ? list : []);
    } catch {
      setMyTerritories([]);
    } finally {
      setMyTerritoriesLoading(false);
    }
  }, []);

  const openMyTerritories = () => {
    setShowMyTerritories(true);
    fetchMyTerritories();
  };

  // Tap a territory row → recenter the map on it and close the sheet
  const focusTerritory = (terr: MyTerritory) => {
    setShowMyTerritories(false);
    if (mapRef.current && typeof terr.lat === 'number' && typeof terr.lng === 'number') {
      mapRef.current.animateToRegion(
        {
          latitude: terr.lat,
          longitude: terr.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        600
      );
    }
  };

  // Format territory area: <1000 → "N m²", else "N.Nk m²"
  const formatArea = (m2: number): string => {
    const v = Number(m2) || 0;
    if (v < 1000) return `${Math.round(v)} m²`;
    return `${(v / 1000).toFixed(1)}k m²`;
  };

  // Capitalize a movement class for display ("walker" → "Walker", "dog_walker" → "Dog Walker")
  const formatClass = (cls: string): string =>
    (cls || 'unknown')
      .split('_')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');

  // Toggle route recording
  const toggleRecording = async () => {
    if (isTracking) {
      const route = await stopTracking();
      if (route.length >= 2) {
        // Use server claim result if available, else estimate
        const serverResult = useLocationStore.getState().lastClaimResult;
        if (serverResult) {
          setClaimResult({ area: serverResult.area_m2, xp: serverResult.xp_earned });

          // Show defended territory alert if any territories were blocked
          if (serverResult.blocked_by_defenses && serverResult.blocked_by_defenses.length > 0) {
            const blocked = serverResult.blocked_by_defenses;
            const count = blocked.reduce((sum, b) => sum + b.defense_count, 0);
            setTimeout(() => {
              Alert.alert(
                S.map.mapScreen.defendedTerritoryTitle,
                t(S.map.mapScreen.defendedTerritoryMsg, { territories: blocked.length, defenses: count }),
                [{ text: S.map.mapScreen.understood }]
              );
            }, 500);
          }
        } else {
          setClaimResult({ area: Math.round(totalDistance * 12), xp: Math.round(totalDistance * 2) });
        }
        setShowClaimResult(true);
        // No auto-dismiss — user must tap "JETZT VERTEIDIGEN" or "Später"

        // Refresh territories on the map so the new claim appears
        // Small delay to ensure server has committed the territory
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (mapRef.current) {
          try {
            const camera = await mapRef.current.getCamera();
            if (camera?.center) {
              const bbox = {
                north: camera.center.latitude + 0.01,
                south: camera.center.latitude - 0.01,
                east: camera.center.longitude + 0.01,
                west: camera.center.longitude - 0.01,
              };
              fetchTerritories(bbox);
            }
          } catch (_err) {
            // Fallback: use current location for bbox
            if (currentLocation) {
              fetchTerritories({
                north: (currentLocation?.latitude ?? 0) + 0.01,
                south: (currentLocation?.latitude ?? 0) - 0.01,
                east: (currentLocation?.longitude ?? 0) + 0.01,
                west: (currentLocation?.longitude ?? 0) - 0.01,
              });
            }
          }
        }

        // Haptic feedback on successful territory claim
        if (useSettingsStore.getState().settings.hapticFeedback) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } else {
      await startTracking();
    }
  };

  const handleTerritoryPress = (territory: Territory) => {
    navigation.navigate('TerritoryDetail', { territory });
  };

  // Long-press on map opens Place History (Stadtgedächtnis)
  const handleMapLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    navigation.navigate('PlaceHistory', { lat: latitude, lng: longitude });
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDuration = (): string => {
    const store = useLocationStore.getState();
    if (!store.recordingStartTime) return '0:00';
    const secs = Math.floor((Date.now() - store.recordingStartTime) / 1000);
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs.toString().padStart(2, '0')}`;
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  const recordingBg = recordingPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(215, 38, 61, 0.8)', 'rgba(215, 38, 61, 1)'],
  });

  // Safe arrays — prevent crash if server returns unexpected format
  const safeTerritories = Array.isArray(territories) ? territories : [];
  const safeQuests = Array.isArray(nearbyQuests) ? nearbyQuests : [];
  const safeEchos = Array.isArray(nearbyEchos) ? nearbyEchos : [];
  const safeArtifacts = Array.isArray(nearbyArtifacts) ? nearbyArtifacts : [];
  const safeZones = Array.isArray(silentZones) ? silentZones : [];
  const safeResonance = Array.isArray(resonanceSpots) ? resonanceSpots : [];

  // Deduplicate territories (server may return duplicates from JOIN with defenses)
  const uniqueTerritories = React.useMemo(() => {
    const seen = new Set<string>();
    return safeTerritories.filter(t => {
      if (!t?.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [safeTerritories]);
  const safeMeetups = Array.isArray(nearbyMeetups) ? nearbyMeetups : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <MapView
        key={`map-${settings.darkMapStyle ? 'dark' : 'light'}`}
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={getMapStyle(settings.darkMapStyle)}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        showsCompass={false}
        rotateEnabled={false}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation?.latitude ?? 0,
                longitude: currentLocation?.longitude ?? 0,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }
            : {
                latitude: lastKnownLocation?.latitude ?? 51.3642,
                longitude: lastKnownLocation?.longitude ?? 7.9812,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
        }
        onMapReady={() => {
          // Native map is now initialized — bbox reads are safe from here on.
          mapReadyRef.current = true;
        }}
        onRegionChangeComplete={handleRegionChange}
        onLongPress={handleMapLongPress}
      >
        {/* Territory Polygons — hidden briefly on tab focus to force native re-render */}
        {!hideOverlays && uniqueTerritories.map((territory) => {
          if (!territory.polygon || !Array.isArray(territory.polygon) || territory.polygon.length < 3) return null;
          // Filter out any invalid points
          const validCoords = territory.polygon
            .filter((p: any) => p && typeof p.latitude === 'number' && typeof p.longitude === 'number')
            .map((p: any) => ({ latitude: p.latitude, longitude: p.longitude }));
          if (validCoords.length < 3) return null;
          const baseColor = territory.color || CLASS_COLORS[territory.movementClass] || '#1558F0';
          const decay = isNaN(territory.decayPercent) ? 0 : territory.decayPercent;
          const alpha = Math.round(Math.max(0.1, (1 - decay / 100)) * 0.4 * 255);
          const hexAlpha = alpha.toString(16).padStart(2, '0');
          return (
            <Polygon
              key={territory.id}
              coordinates={validCoords}
              fillColor={`${baseColor}${hexAlpha}`}
              strokeColor={baseColor}
              strokeWidth={1.5}
              tappable
              onPress={() => handleTerritoryPress(territory)}
            />
          );
        })}

        {/* Defense Shield Markers (defended territories) */}
        {!hideOverlays && uniqueTerritories.filter(t => t.hasDefense).map((territory) => {
          const centroid = getPolygonCentroid(territory.polygon);
          if (!centroid) return null;
          const shieldColor =
            territory.defenseGameType === 'rock_paper_scissors' ? '#1558F0' :
            territory.defenseGameType === 'sprint_race' ? '#1B9E5A' :
            territory.defenseGameType === 'trivia' ? '#1558F0' :
            territory.defenseGameType === 'coin_flip' ? '#F5A623' :
            territory.defenseGameType === 'odd_even' ? '#0E9CB0' :
            territory.defenseGameType === 'tic_tac_toe' ? '#1558F0' :
            territory.defenseGameType === 'mini_chess' ? '#F5A623' :
            '#F5A623';
          return (
            <Marker
              key={`def-${territory.id}`}
              coordinate={centroid}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => handleTerritoryPress(territory)}
            >
              <View style={[styles.defenseMarker, { borderColor: shieldColor, backgroundColor: `${shieldColor}20` }]}>
                <Ionicons name="shield-checkmark" size={14} color={shieldColor} />
              </View>
            </Marker>
          );
        })}

        {/* Undefended Own Territory Markers — pulsing red warning for owner */}
        {!hideOverlays && uniqueTerritories
          .filter(t => t.ownerId === user?.id && !t.hasDefense)
          .map((territory) => {
            const centroid = getPolygonCentroid(territory.polygon);
            if (!centroid) return null;
            return (
              <Marker
                key={`undefended-${territory.id}`}
                coordinate={centroid}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => navigation.navigate('DefenseSetup', { territoryId: territory.id })}
              >
                <View style={styles.undefendedMarkerOwn}>
                  <Ionicons name="warning" size={14} color="#D7263D" />
                  <Text style={styles.undefendedTextOwn}>{S.map.mapScreen.unprotectedBadge}</Text>
                </View>
              </Marker>
            );
          })}

        {/* Undefended Enemy Territory Markers — visible to attackers */}
        {!hideOverlays && uniqueTerritories
          .filter(t => t.ownerId !== user?.id && t.ownerId && !t.hasDefense)
          .map((territory) => {
            const centroid = getPolygonCentroid(territory.polygon);
            if (!centroid) return null;
            return (
              <Marker
                key={`target-${territory.id}`}
                coordinate={centroid}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => handleTerritoryPress(territory)}
              >
                <View style={styles.undefendedMarkerEnemy}>
                  <Ionicons name="flash" size={10} color="#1B9E5A" />
                </View>
              </Marker>
            );
          })}

        {/* Current Route Line */}
        {isTracking && safeRoute.length >= 2 && (
          <Polyline
            coordinates={safeRoute.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
            }))}
            strokeColor={CLASS_COLORS[detectedClass]}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Nearby Quest Markers */}
        {safeQuests.filter((q: any) => q.location?.latitude && q.location?.longitude).map((quest) => (
          <Marker
            key={`quest-${quest.id}`}
            coordinate={{
              latitude: quest.location.latitude,
              longitude: quest.location.longitude,
            }}
            onPress={() =>
              navigation
                .getParent()
                ?.navigate('Quests', { screen: 'QuestDetail', params: { questId: quest.id } })
            }
          >
            <View style={styles.questMarker}>
              <Ionicons name="compass" size={18} color="#1558F0" />
            </View>
          </Marker>
        ))}

        {/* Nearby Echo Markers */}
        {safeEchos.map((echo) => (
          <EchoMarker
            key={`echo-${echo.id}`}
            echo={echo}
            likes={echo.likes ?? 0}
            onPress={() => navigation.navigate('EchoDetail', { echoId: echo.id })}
          />
        ))}

        {/* Nearby Artifact Markers */}
        {safeArtifacts.filter((a: any) => a.location?.latitude && a.location?.longitude).map((artifact) => {
          const rarityColor =
            artifact.rarity === 'legendary'
              ? '#F5A623'
              : artifact.rarity === 'epic'
                ? '#1558F0'
                : artifact.rarity === 'rare'
                  ? '#1558F0'
                  : '#7A7470';
          return (
            <Marker
              key={`artifact-${artifact.id}`}
              coordinate={{
                latitude: artifact.location.latitude,
                longitude: artifact.location.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() =>
                navigation.navigate('ArtifactDetail', { artifactId: artifact.id })
              }
            >
              <View style={[styles.artifactMarker, { borderColor: rarityColor }]}>
                <Ionicons name="diamond" size={14} color={rarityColor} />
              </View>
            </Marker>
          );
        })}

        {/* Silent Zone Polygons */}
        {safeZones.map((zone) => {
          const coords = zone.polygon?.coordinates?.[0];
          if (!coords || coords.length < 3) return null;
          return (
            <Polygon
              key={`silent-${zone.id}`}
              coordinates={coords.map((c: number[]) => ({
                latitude: c[1],
                longitude: c[0],
              }))}
              fillColor="rgba(27, 158, 90, 0.12)"
              strokeColor="rgba(27, 158, 90, 0.6)"
              strokeWidth={2}
              tappable
            />
          );
        })}

        {/* Resonance Spot Markers */}
        {safeResonance.map((spot) => {
          const levelColor =
            spot.resonance_level >= 4 ? '#F5A623' :
            spot.resonance_level >= 3 ? '#F5A623' :
            '#1558F0';
          const opacity = spot.resonance_level >= 4 ? 0.35 : spot.resonance_level >= 3 ? 0.25 : 0.15;
          return (
            <React.Fragment key={`resonance-${spot.id}`}>
              <Circle
                center={{ latitude: spot.lat, longitude: spot.lng }}
                radius={30}
                fillColor={`${levelColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`}
                strokeColor={levelColor}
                strokeWidth={1.5}
              />
              <Marker
                coordinate={{ latitude: spot.lat, longitude: spot.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.resonanceMarker, { borderColor: levelColor }]}>
                  <Ionicons name="flash" size={12} color={levelColor} />
                </View>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Meetup Event Markers — animated for events starting within 24h */}
        {safeMeetups.map((meetup) => {
          const mLat = meetup.lat ?? meetup.latitude ?? 0;
          const mLng = meetup.lng ?? meetup.longitude ?? 0;
          if (mLat === 0 && mLng === 0) return null;
          const cat = meetup.category ?? 'other';
          const catColor =
            cat === 'dog_walk' ? '#F5A623' :
            cat === 'party' ? '#FF69B4' :
            cat === 'sport' ? '#1B9E5A' :
            cat === 'gaming' ? '#1558F0' :
            cat === 'meetup' ? '#1558F0' :
            '#7A7470';
          const catIcon: keyof typeof Ionicons.glyphMap =
            cat === 'dog_walk' ? 'paw' :
            cat === 'party' ? 'musical-notes' :
            cat === 'sport' ? 'fitness' :
            cat === 'gaming' ? 'game-controller' :
            cat === 'meetup' ? 'people' :
            'pin';

          // Check if event is spontaneous (within 24h)
          const eventDate = new Date(meetup.event_date ?? meetup.eventDate ?? 0);
          const now = Date.now();
          const msUntilStart = eventDate.getTime() - now;
          const hoursUntil = msUntilStart / (1000 * 60 * 60);
          const isSpontaneous = hoursUntil > 0 && hoursUntil <= 24;
          const isLive = hoursUntil <= 0.5 && hoursUntil > -2; // Started or starting in 30min
          const isUpcoming = isSpontaneous && !isLive;

          // Countdown text
          let countdownText = '';
          if (isLive) {
            countdownText = S.map.mapScreen.countdownNow;
          } else if (hoursUntil > 0 && hoursUntil < 1) {
            countdownText = `${Math.round(hoursUntil * 60)}min`;
          } else if (hoursUntil >= 1 && hoursUntil <= 24) {
            countdownText = `${Math.round(hoursUntil)}h`;
          }

          return (
            <Marker
              key={`meetup-${meetup.id}`}
              coordinate={{ latitude: mLat, longitude: mLng }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => navigation.navigate('MeetupDetail', { meetupId: meetup.id })}
            >
              <View style={{ alignItems: 'center' }}>
                {/* Pulsing ring for spontaneous events */}
                {(isSpontaneous || isLive) && (
                  <Animated.View style={[
                    styles.spontanPulse,
                    {
                      borderColor: isLive ? '#D7263D' : catColor,
                      transform: [{ scale: pulseScale }],
                      opacity: pulseOpacity,
                    },
                  ]} />
                )}
                {/* Main marker */}
                <View style={[
                  styles.meetupMarker,
                  { borderColor: catColor, backgroundColor: `${catColor}20` },
                  isLive && { backgroundColor: `${catColor}40`, borderWidth: 2.5 },
                ]}>
                  <Ionicons name={catIcon} size={16} color={catColor} />
                </View>
                {/* Countdown badge */}
                {countdownText ? (
                  <View style={[
                    styles.countdownBadge,
                    { backgroundColor: isLive ? '#D7263D' : catColor },
                  ]}>
                    <Text style={styles.countdownText}>{countdownText}</Text>
                  </View>
                ) : null}
              </View>
            </Marker>
          );
        })}

        {/* PvE Spawn Markers — only rendered when feature flag 'pve_spawns' + capability.pve are active */}
        {isPveEnabled && pveSpawns
          .filter((spawn) => spawn.npc_type !== 'terminal')
          .map((spawn) => (
            <PvESpawnMarker
              key={`pve-${spawn.id}`}
              spawn={spawn}
              onPress={() =>
                navigation.navigate('HackingScreen', {
                  // Runtime filter guarantees npc_type is never 'terminal' here.
                  spawn: spawn as MapStackParamList['HackingScreen']['spawn'],
                })
              }
            />
          ))}

        {/* Terminal Spawn Markers — only rendered when feature flag 'terminals' + capability.terminals are active */}
        {isTerminalsEnabled && pveSpawns
          .filter((spawn) => spawn.npc_type === 'terminal')
          .map((spawn) => (
            <TerminalMarker
              key={`terminal-${spawn.id}`}
              spawn={spawn}
              onPress={() =>
                navigation.navigate('TerminalScreen', {
                  spawn: {
                    id: spawn.id,
                    npc_type: 'terminal',
                    level: spawn.level,
                    latitude: spawn.latitude,
                    longitude: spawn.longitude,
                    biome: spawn.biome,
                    expires_at: spawn.expires_at,
                  },
                })
              }
            />
          ))}

        {/* Custom Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View style={styles.locationMarkerContainer}>
              <Animated.View
                style={[
                  styles.locationPulse,
                  {
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                    backgroundColor: CLASS_COLORS[detectedClass],
                  },
                ]}
              />
              <View
                style={[
                  styles.locationDot,
                  { backgroundColor: CLASS_COLORS[detectedClass] },
                ]}
              >
                <Ionicons
                  name={CLASS_ICONS[isTracking ? detectedClass : 'unknown']}
                  size={12}
                  color="#FFFFFF"
                />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Status Bar */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={[styles.statusBar, {
          backgroundColor: settings.darkMapStyle ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: settings.darkMapStyle ? '#C0BAB4' : '#C0BAB4',
        }]}>
          <View style={[styles.levelBadge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.levelText, { color: settings.darkMapStyle ? '#FFFFFF' : '#FFFFFF' }]}>Lv {user?.level ?? 1}</Text>
          </View>
          <View style={styles.xpContainer}>
            <Text style={[styles.xpText, { color: theme.textSecondary }]}>
              {user?.xp ?? 0} / {user?.xpToNextLevel ?? 100} XP
            </Text>
            <View style={[styles.xpBarBg, { backgroundColor: settings.darkMapStyle ? '#C0BAB4' : '#C0BAB4' }]}>
              <View
                style={[
                  styles.xpBarFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${Math.min(
                      ((user?.xp ?? 0) / (user?.xpToNextLevel ?? 100)) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={14} color={theme.warning} />
            <Text style={[styles.streakText, { color: theme.warning }]}>{user?.currentStreak ?? 0}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Resource HUD — only when resources flag + capability are active */}
      {isResourcesEnabled && <ResourceBar balances={balances} />}

      {/* Night Mode Badge */}
      {nightMode && (
        <View style={styles.nightBadge}>
          <Ionicons name="moon" size={14} color="#1558F0" />
          <Text style={styles.nightBadgeText}>{S.map.mapScreen.nightMode}</Text>
        </View>
      )}

      {/* Weather Badge */}
      {weather && (
        <View style={[styles.weatherBadge, {
          backgroundColor: settings.darkMapStyle ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: settings.darkMapStyle ? '#C0BAB4' : '#C0BAB4',
        }]}>
          <Ionicons
            name={WEATHER_ICONS[weather.condition] || 'partly-sunny'}
            size={16}
            color={WEATHER_BONUSES[weather.condition]?.multiplier > 1 ? theme.accent : theme.textSecondary}
          />
          <Text style={[styles.weatherText, { color: theme.textSecondary }]}>{weather.condition}</Text>
          {WEATHER_BONUSES[weather.condition]?.multiplier > 1 && (
            <View style={styles.weatherMultiplier}>
              <Text style={styles.weatherMultiplierText}>
                {WEATHER_BONUSES[weather.condition].label}
              </Text>
            </View>
          )}
          {weatherQuestCount > 0 && (
            <View style={styles.weatherQuestBadge}>
              <Text style={styles.weatherQuestBadgeText}>
                {t(
                  plural(weatherQuestCount, S.map.mapScreen.weatherQuestsOne, S.map.mapScreen.weatherQuestsOther),
                  { condition: weather.condition }
                )}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Map Control Buttons */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={[styles.controlButton, {
          backgroundColor: settings.darkMapStyle ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: settings.darkMapStyle ? '#C0BAB4' : '#C0BAB4',
        }]} onPress={centerOnUser}>
          <Ionicons name="locate" size={22} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, {
          backgroundColor: settings.darkMapStyle ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: settings.darkMapStyle ? '#C0BAB4' : '#C0BAB4',
        }]} onPress={() => setShowSearch(true)}>
          <Ionicons name="search" size={22} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, {
            backgroundColor: settings.darkMapStyle ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: settings.darkMapStyle ? '#C0BAB4' : '#C0BAB4',
          }]}
          onPress={() => navigation.navigate('ChallengeList')}
        >
          <Ionicons name="trophy" size={22} color={theme.warning} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, {
            backgroundColor: settings.darkMapStyle ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: settings.darkMapStyle ? '#C0BAB4' : '#C0BAB4',
          }]}
          onPress={openMyTerritories}
        >
          <Ionicons name="layers" size={22} color={theme.primary} />
        </TouchableOpacity>
        {isPveEnabled && (
          <TouchableOpacity
            style={[styles.controlButton, {
              backgroundColor: streifzug.active
                ? theme.primary
                : (settings.darkMapStyle ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)'),
              borderColor: streifzug.active ? theme.primary : '#C0BAB4',
            }]}
            onPress={() => (streifzug.active ? streifzug.stop() : streifzug.start())}
            disabled={streifzug.starting}
          >
            <Ionicons
              name="walk"
              size={22}
              color={streifzug.active ? '#FFFFFF' : theme.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Streifzug encounter overlay */}
      {streifzug.encounter && (
        <StreifzugEncounterCard
          encounter={streifzug.encounter}
          onDismiss={streifzug.dismissEncounter}
          onEngage={(enc) => {
            streifzug.dismissEncounter();
            navigation.navigate('HackingScreen', {
              spawn: {
                id: enc.spawnId,
                npc_type: enc.npcType,
                level: enc.level,
                latitude: enc.latitude,
                longitude: enc.longitude,
                biome: enc.biome,
                expires_at: enc.expiresAt,
              },
            });
          }}
        />
      )}

      {/* City/Place Search Overlay */}
      {showSearch && (
        <View style={styles.searchOverlay}>
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={S.map.mapScreen.searchPlaceholder}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              autoFocus
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* FAB - Record Button */}
      {/* Green = close enough to finish, Red = recording but too far, Cyan = start */}
      <TouchableOpacity
        style={[
          styles.fab,
          isTracking && (canCloseClaim ? styles.fabCanClose : styles.fabRecording),
        ]}
        onPress={() => {
          if (useSettingsStore.getState().settings.hapticFeedback) {
            Haptics.selectionAsync();
          }
          if (isTracking && !canCloseClaim && safeRoute.length >= 10) {
            Alert.alert(
              S.map.mapScreen.tooFarTitle,
              t(S.map.mapScreen.tooFarMsg, { threshold: CLOSE_THRESHOLD_M }),
              [
                { text: S.common.ok, style: 'cancel' },
                {
                  text: S.map.mapScreen.cancelRoute,
                  style: 'destructive',
                  onPress: () => {
                    cancelTracking();
                  },
                },
              ]
            );
            return;
          }
          toggleRecording();
        }}
        activeOpacity={0.8}
      >
        {isTracking ? (
          canCloseClaim ? (
            <View style={[styles.fabInner, { backgroundColor: '#1B9E5A' }]}>
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
          ) : (
            <Animated.View style={[styles.fabInner, { backgroundColor: recordingBg }]}>
              <Ionicons name="stop" size={28} color="#FFFFFF" />
            </Animated.View>
          )
        ) : (
          <View style={[styles.fabInner, { backgroundColor: theme.primary }]}>
            <Ionicons name="footsteps" size={28} color={settings.darkMapStyle ? '#FFFFFF' : '#FFFFFF'} />
          </View>
        )}
      </TouchableOpacity>

      {/* Small class badge bottom-left */}
      <View style={[styles.classBadgeFloat, {
        backgroundColor: settings.darkMapStyle ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: settings.darkMapStyle ? '#C0BAB4' : '#C0BAB4',
      }]}>
        <Ionicons
          name={CLASS_ICONS[detectedClass]}
          size={14}
          color={CLASS_COLORS[detectedClass]}
        />
        <Text style={[styles.classBadgeText, { color: CLASS_COLORS[detectedClass] }]}>
          {classLabels[detectedClass]}
        </Text>
        {isTracking && <View style={styles.recDotSmall} />}
      </View>

      {/* Tracking Stats Bar (only when recording) */}
      {isTracking && (
        <View style={[styles.trackingBar, {
          backgroundColor: settings.darkMapStyle ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: settings.darkMapStyle ? '#C0BAB4' : '#C0BAB4',
        }]}>
          <TouchableOpacity
            style={styles.trackingCancelBtn}
            onPress={() => {
              Alert.alert(
                S.map.mapScreen.cancelRouteTitle,
                S.map.mapScreen.cancelRouteMsg,
                [
                  { text: S.map.mapScreen.keepWalking, style: 'cancel' },
                  {
                    text: S.common.cancel,
                    style: 'destructive',
                    onPress: () => cancelTracking(),
                  },
                ]
              );
            }}
          >
            <Ionicons name="close" size={18} color="#D7263D" />
          </TouchableOpacity>
          <Text style={[styles.trackingStatText, { color: theme.text }]}>{formatDistance(totalDistance)}</Text>
          <View style={styles.trackingDot} />
          <Text style={[styles.trackingStatText, { color: theme.text }]}>{formatDuration()}</Text>
          <View style={styles.trackingDot} />
          <Text style={[styles.trackingStatText, { color: theme.text }]}>{t(S.map.mapScreen.ptsCount, { count: safeRoute.length })}</Text>
          <View style={styles.recBadge}>
            <View style={styles.recDotAnim} />
            <Text style={styles.recText}>{S.map.mapScreen.rec}</Text>
          </View>
        </View>
      )}

      {/* My Territories Sheet */}
      <Modal
        visible={showMyTerritories}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMyTerritories(false)}
      >
        <View style={styles.myTerrBackdrop}>
          <TouchableOpacity
            style={styles.myTerrBackdropTouch}
            activeOpacity={1}
            onPress={() => setShowMyTerritories(false)}
          />
          <View style={styles.myTerrSheet}>
            <View style={styles.myTerrHandle} />
            <View style={styles.myTerrHeaderRow}>
              <Text style={styles.myTerrTitle}>{S.map.mapScreen.myTerrTitle}</Text>
              <View style={styles.myTerrCountBadge}>
                <Text style={styles.myTerrCountText}>{myTerritories.length}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMyTerritories(false)} style={styles.myTerrClose}>
                <Ionicons name="close" size={22} color="#7A7470" />
              </TouchableOpacity>
            </View>

            {myTerritoriesLoading ? (
              <View style={styles.myTerrEmpty}>
                <ActivityIndicator size="small" color="#1558F0" />
              </View>
            ) : myTerritories.length === 0 ? (
              <View style={styles.myTerrEmpty}>
                <Ionicons name="flag-outline" size={32} color="#C0BAB4" />
                <Text style={styles.myTerrEmptyText}>
                  {S.map.mapScreen.myTerrEmpty}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.myTerrList}
                contentContainerStyle={styles.myTerrListContent}
                showsVerticalScrollIndicator={false}
              >
                {myTerritories.map((terr) => {
                  const dotColor =
                    CLASS_COLORS[(terr.class as MovementClass)] ?? CLASS_COLORS.unknown;
                  return (
                    <TouchableOpacity
                      key={terr.id}
                      style={styles.myTerrRow}
                      activeOpacity={0.7}
                      onPress={() => focusTerritory(terr)}
                    >
                      <View style={[styles.myTerrDot, { backgroundColor: dotColor }]} />
                      <View style={styles.myTerrRowMain}>
                        <View style={styles.myTerrRowTop}>
                          <Text style={styles.myTerrRowLabel}>
                            {formatClass(terr.class)} · {formatArea(terr.area_m2)}
                          </Text>
                          {terr.is_protected ? (
                            <Text style={styles.myTerrShield}>🛡</Text>
                          ) : null}
                        </View>
                        <View style={styles.myTerrRowBottom}>
                          <Text style={styles.myTerrCv}>cv {Math.round(Number(terr.claim_value) || 0)}</Text>
                          <Text style={styles.myTerrCoords}>
                            {(Number(terr.lat) || 0).toFixed(4)}, {(Number(terr.lng) || 0).toFixed(4)}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="locate" size={18} color="#1558F0" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Claim Result Overlay */}
      {showClaimResult && claimResult && (
        <View style={styles.claimOverlay}>
          <View style={[styles.claimCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="flag" size={36} color={theme.accent} />
            <Text style={[styles.claimTitle, { color: theme.accent }]}>{S.map.mapScreen.territoryClaimed}</Text>
            <View style={styles.claimStats}>
              <View style={styles.claimStatItem}>
                <Text style={[styles.claimStatValue, { color: theme.accent }]}>{claimResult.area} m²</Text>
                <Text style={[styles.claimStatLabel, { color: theme.textSecondary }]}>{S.map.mapScreen.statArea}</Text>
              </View>
              <View style={styles.claimStatItem}>
                <Text style={[styles.claimStatValue, { color: theme.primary }]}>+{claimResult.xp} XP</Text>
                <Text style={[styles.claimStatLabel, { color: theme.textSecondary }]}>{S.map.mapScreen.statEarned}</Text>
              </View>
            </View>

            {/* Warning: unprotected */}
            <View style={styles.claimWarningBox}>
              <Ionicons name="warning" size={22} color="#D7263D" />
              <Text style={styles.claimWarningText}>
                {S.map.mapScreen.unprotectedWarning}
              </Text>
            </View>

            {/* Step-by-step instruction */}
            <View style={styles.claimStepsBox}>
              <View style={styles.claimStep}>
                <View style={styles.claimStepNumber}><Text style={styles.claimStepNumberText}>1</Text></View>
                <Text style={styles.claimStepText}>{S.map.mapScreen.claimStep1}</Text>
              </View>
              <View style={styles.claimStep}>
                <View style={styles.claimStepNumber}><Text style={styles.claimStepNumberText}>2</Text></View>
                <Text style={styles.claimStepText}>{S.map.mapScreen.claimStep2}</Text>
              </View>
              <View style={styles.claimStep}>
                <View style={[styles.claimStepNumber, { backgroundColor: 'rgba(245, 166, 35, 0.2)' }]}><Text style={[styles.claimStepNumberText, { color: '#F5A623' }]}>3</Text></View>
                <Text style={styles.claimStepText}>{S.map.mapScreen.claimStep3}</Text>
              </View>
            </View>

            {/* Direct action buttons */}
            <TouchableOpacity
              style={styles.claimDefenseButton}
              onPress={() => {
                setShowClaimResult(false);
                const myTerritories = useTerritoryStore.getState().territories.filter(
                  t => t.ownerId === user?.id
                );
                if (myTerritories.length > 0) {
                  const newest = myTerritories[myTerritories.length - 1];
                  navigation.navigate('DefenseSetup', { territoryId: newest.id });
                }
              }}
            >
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.claimDefenseButtonText}>{S.map.mapScreen.defendNow}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.claimDismissButton}
              onPress={() => setShowClaimResult(false)}
            >
              <Text style={styles.claimDismissButtonText}>{S.map.mapScreen.later}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4F1',
  },
  map: {
    width,
    height,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C0BAB4',
  },
  levelBadge: {
    backgroundColor: '#1558F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  xpContainer: {
    flex: 1,
    marginRight: 10,
  },
  xpText: {
    color: '#7A7470',
    fontSize: 10,
    marginBottom: 4,
  },
  xpBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C0BAB4',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#1558F0',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  streakText: {
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '700',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: height * 0.15,
    gap: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#C0BAB4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 10,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#1558F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  fabRecording: {
    shadowColor: '#D7263D',
  },
  fabCanClose: {
    shadowColor: '#1B9E5A',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 15,
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1558F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetupMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spontanPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    top: -8,
  },
  countdownBadge: {
    position: 'absolute',
    top: -8,
    right: -14,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  questMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(21, 88, 240, 0.2)',
    borderWidth: 1.5,
    borderColor: '#1558F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artifactMarker: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  resonanceMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(21, 88, 240, 0.2)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defenseMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // (old undefendedMarker styles replaced by undefendedMarkerOwn/Enemy above)
  locationMarkerContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  locationDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  classBadgeFloat: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: '#C0BAB4',
  },
  classBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D7263D',
    marginLeft: 4,
  },
  trackingBar: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C0BAB4',
  } as any,
  trackingCancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(215, 38, 61, 0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(215, 38, 61, 0.3)',
  },
  trackingStatText: {
    color: '#141210',
    fontSize: 13,
    fontWeight: '700',
  },
  trackingDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#7A7470',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  recDotAnim: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D7263D',
  },
  recText: {
    color: '#D7263D',
    fontSize: 10,
    fontWeight: '800',
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EFEDE8',
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  classRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  classText: {
    fontSize: 14,
    fontWeight: '700',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D7263D',
  },
  recordingText: {
    color: '#D7263D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#141210',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#7A7470',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#C0BAB4',
  },
  idlePrompt: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  idleText: {
    color: '#141210',
    fontSize: 13,
    fontWeight: '600',
  },
  idleSubtext: {
    color: '#7A7470',
    fontSize: 11,
    marginTop: 2,
  },
  claimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#1B9E5A',
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#1B9E5A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  claimTitle: {
    color: '#1B9E5A',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 12,
    marginBottom: 20,
  },
  claimStats: {
    flexDirection: 'row',
    gap: 32,
  },
  claimStatItem: {
    alignItems: 'center',
  },
  claimStatValue: {
    color: '#1B9E5A',
    fontSize: 22,
    fontWeight: '800',
  },
  claimStatLabel: {
    color: '#7A7470',
    fontSize: 11,
    marginTop: 4,
  },
  claimWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(215, 38, 61, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(215, 38, 61, 0.3)',
  },
  claimWarningText: {
    flex: 1,
    color: '#D7263D',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  claimStepsBox: {
    marginTop: 14,
    gap: 8,
  },
  claimStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  claimStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimStepNumberText: {
    color: '#1558F0',
    fontSize: 12,
    fontWeight: '800',
  },
  claimStepText: {
    flex: 1,
    color: '#7A7470',
    fontSize: 12,
    fontWeight: '600',
  },
  claimDefenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5A623',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  claimDefenseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  claimDismissButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  claimDismissButtonText: {
    color: '#7A7470',
    fontSize: 13,
    fontWeight: '600',
  },
  undefendedMarkerOwn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(215, 38, 61, 0.92)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: '#D7263D',
  },
  undefendedTextOwn: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  undefendedMarkerEnemy: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(27, 158, 90, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(27, 158, 90, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nightBadge: {
    position: 'absolute',
    top: height * 0.12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 240, 0.3)',
    gap: 6,
  },
  nightBadgeText: {
    color: '#1558F0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  weatherBadge: {
    position: 'absolute',
    top: height * 0.12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C0BAB4',
    gap: 6,
  },
  weatherText: {
    color: '#7A7470',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weatherMultiplier: {
    backgroundColor: 'rgba(27, 158, 90, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weatherMultiplierText: {
    color: '#1B9E5A',
    fontSize: 10,
    fontWeight: '800',
  },
  weatherQuestBadge: {
    backgroundColor: 'rgba(21, 88, 240, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weatherQuestBadgeText: {
    color: '#1558F0',
    fontSize: 9,
    fontWeight: '700',
  },
  myTerrBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  myTerrBackdropTouch: {
    flex: 1,
  },
  myTerrSheet: {
    backgroundColor: '#F6F4F1',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#C0BAB4',
    paddingBottom: 24,
    maxHeight: height * 0.7,
  },
  myTerrHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EFEDE8',
    marginTop: 10,
    marginBottom: 6,
  },
  myTerrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  myTerrTitle: {
    color: '#141210',
    fontSize: 18,
    fontWeight: '800',
  },
  myTerrCountBadge: {
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  myTerrCountText: {
    color: '#1558F0',
    fontSize: 12,
    fontWeight: '800',
  },
  myTerrClose: {
    marginLeft: 'auto',
    padding: 4,
  },
  myTerrEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    gap: 12,
  },
  myTerrEmptyText: {
    color: '#7A7470',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  myTerrList: {
    paddingHorizontal: 16,
  },
  myTerrListContent: {
    paddingBottom: 8,
  },
  myTerrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C0BAB4',
  },
  myTerrDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  myTerrRowMain: {
    flex: 1,
    gap: 4,
  },
  myTerrRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myTerrRowLabel: {
    color: '#141210',
    fontSize: 14,
    fontWeight: '700',
  },
  myTerrShield: {
    fontSize: 12,
  },
  myTerrRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  myTerrCv: {
    color: '#1558F0',
    fontSize: 11,
    fontWeight: '700',
  },
  myTerrCoords: {
    color: '#7A7470',
    fontSize: 10,
    fontWeight: '500',
  },
});

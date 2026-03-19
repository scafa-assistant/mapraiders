import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Polygon, Polyline, Circle, PROVIDER_GOOGLE, Region, LongPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { useTerritoryStore } from '../../store/territoryStore';
import { useQuestStore } from '../../store/questStore';
import { useAuthStore } from '../../store/authStore';
import { echoProximityService } from '../../services/echoProximity';
import { echoApi, artifactApi, weatherApi, silentZoneApi, resonanceApi } from '../../services/api';
import EchoMarker from '../../components/EchoMarker';
import { MapScreenProps, MovementClass, Territory, Echo } from '../../navigation/types';
import type { WeatherData, WeatherBonus } from '../../utils/types';
import { isNightTime, getNightModeStyles } from '../../utils/nightMode';

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
  walker: '#00D4FF',
  runner: '#FF4757',
  cyclist: '#00FF88',
  skater: '#FFB800',
  dog_walker: '#7B61FF',
  driver: '#8892B0',
  unknown: '#555E78',
};

const CLASS_LABELS: Record<MovementClass, string> = {
  walker: 'Walker',
  runner: 'Runner',
  cyclist: 'Cyclist',
  skater: 'Skater',
  dog_walker: 'Dog Walker',
  driver: 'Driver',
  unknown: 'Detecting...',
};

const CLASS_ICONS: Record<MovementClass, keyof typeof Ionicons.glyphMap> = {
  walker: 'walk',
  runner: 'speedometer',
  cyclist: 'bicycle',
  skater: 'flash',
  dog_walker: 'paw',
  driver: 'car',
  unknown: 'help-circle',
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0A0E17' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0E17' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555E78' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A2340' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#141B2D' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D1220' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0F1A1A' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
];

export default function MapScreen({ navigation }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);
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
    getCurrentLocation,
    requestPermissions,
  } = useLocationStore();

  const { territories, fetchTerritories } = useTerritoryStore();
  const { nearbyQuests, fetchNearby } = useQuestStore();
  const { user } = useAuthStore();

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
  const lastWeatherFetch = useRef<{ lat: number; lng: number } | null>(null);

  // Fetch weather on mount and significant location change (>500m)
  useEffect(() => {
    if (!currentLocation) return;
    const shouldFetch = !lastWeatherFetch.current ||
      Math.abs(currentLocation.latitude - lastWeatherFetch.current.lat) > 0.005 ||
      Math.abs(currentLocation.longitude - lastWeatherFetch.current.lng) > 0.005;

    if (shouldFetch) {
      lastWeatherFetch.current = {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      };
      weatherApi
        .getCurrent(currentLocation.latitude, currentLocation.longitude)
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
    echoProximityService.start();
    return () => {
      echoProximityService.stop();
    };
  }, []);

  // Feed location updates to echo proximity service
  useEffect(() => {
    if (currentLocation) {
      echoProximityService.onLocationUpdate(
        currentLocation.latitude,
        currentLocation.longitude
      );
    }
  }, [currentLocation]);

  // Fetch nearby echos and artifacts
  const fetchNearbyEchos = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const { data } = await echoApi.getNearby(
        currentLocation.latitude,
        currentLocation.longitude,
        2000
      );
      setNearbyEchos(data.data ?? data);
    } catch (_err) {
      // Silently fail
    }
  }, [currentLocation]);

  const fetchNearbySilentZones = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const { data } = await silentZoneApi.getNearby(
        currentLocation.latitude,
        currentLocation.longitude,
        3000
      );
      const zones = data.data?.zones ?? data.zones ?? [];
      setSilentZones(zones);
    } catch (_err) {
      // Silently fail
    }
  }, [currentLocation]);

  const fetchNearbyArtifacts = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const { data } = await artifactApi.getNearby(
        currentLocation.latitude,
        currentLocation.longitude,
        2000
      );
      setNearbyArtifacts(data.data ?? data);
    } catch (_err) {
      // Silently fail
    }
  }, [currentLocation]);

  const fetchNearbyResonance = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const { data } = await resonanceApi.getNearby(
        currentLocation.latitude,
        currentLocation.longitude,
        2000
      );
      const spots = data.data?.resonance_spots ?? data.resonance_spots ?? [];
      setResonanceSpots(spots);
    } catch (_err) {
      // Silently fail
    }
  }, [currentLocation]);

  useEffect(() => {
    fetchNearbyEchos();
    fetchNearbyArtifacts();
    fetchNearbySilentZones();
    fetchNearbyResonance();
  }, [fetchNearbyEchos, fetchNearbyArtifacts, fetchNearbySilentZones, fetchNearbyResonance]);

  // Initial location fetch
  useEffect(() => {
    (async () => {
      await requestPermissions();
      await getCurrentLocation();
    })();
  }, []);

  // Fetch territories when region changes
  const handleRegionChange = useCallback(
    (region: Region) => {
      fetchTerritories({
        north: region.latitude + region.latitudeDelta / 2,
        south: region.latitude - region.latitudeDelta / 2,
        east: region.longitude + region.longitudeDelta / 2,
        west: region.longitude - region.longitudeDelta / 2,
      });
      if (currentLocation) {
        fetchNearby(currentLocation.latitude, currentLocation.longitude, 2000);
        fetchNearbyEchos();
        fetchNearbyArtifacts();
        fetchNearbySilentZones();
        fetchNearbyResonance();
      }
    },
    [currentLocation, fetchNearbyEchos, fetchNearbyArtifacts, fetchNearbySilentZones]
  );

  // Center map on current location
  const centerOnUser = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  // Toggle route recording
  const toggleRecording = async () => {
    if (isTracking) {
      const route = await stopTracking();
      if (route.length >= 2) {
        setClaimResult({ area: Math.round(totalDistance * 12), xp: Math.round(totalDistance * 2) });
        setShowClaimResult(true);
        setTimeout(() => setShowClaimResult(false), 4000);
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
    outputRange: ['rgba(255, 71, 87, 0.8)', 'rgba(255, 71, 87, 1)'],
  });

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }
            : {
                latitude: 44.4268,
                longitude: 26.1025,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
        }
        onRegionChangeComplete={handleRegionChange}
        onLongPress={handleMapLongPress}
      >
        {/* Territory Polygons */}
        {territories.map((territory) => (
          <Polygon
            key={territory.id}
            coordinates={territory.polygon.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
            }))}
            fillColor={`${territory.color || CLASS_COLORS[territory.movementClass]}${Math.round(
              (1 - territory.decayPercent / 100) * 0.4 * 255
            )
              .toString(16)
              .padStart(2, '0')}`}
            strokeColor={territory.color || CLASS_COLORS[territory.movementClass]}
            strokeWidth={1.5}
            tappable
            onPress={() => handleTerritoryPress(territory)}
          />
        ))}

        {/* Current Route Line */}
        {isTracking && currentRoute.length >= 2 && (
          <Polyline
            coordinates={currentRoute.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
            }))}
            strokeColor={CLASS_COLORS[detectedClass]}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Nearby Quest Markers */}
        {nearbyQuests.map((quest) => (
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
              <Ionicons name="compass" size={18} color="#00D4FF" />
            </View>
          </Marker>
        ))}

        {/* Nearby Echo Markers */}
        {nearbyEchos.map((echo) => (
          <EchoMarker
            key={`echo-${echo.id}`}
            echo={echo}
            likes={echo.likes ?? 0}
            onPress={() => navigation.navigate('EchoDetail', { echoId: echo.id })}
          />
        ))}

        {/* Nearby Artifact Markers */}
        {nearbyArtifacts.map((artifact) => {
          const rarityColor =
            artifact.rarity === 'legendary'
              ? '#FFB800'
              : artifact.rarity === 'epic'
                ? '#7B61FF'
                : artifact.rarity === 'rare'
                  ? '#00D4FF'
                  : '#8892B0';
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
        {silentZones.map((zone) => {
          const coords = zone.polygon?.coordinates?.[0];
          if (!coords || coords.length < 3) return null;
          return (
            <Polygon
              key={`silent-${zone.id}`}
              coordinates={coords.map((c: number[]) => ({
                latitude: c[1],
                longitude: c[0],
              }))}
              fillColor="rgba(0, 200, 83, 0.12)"
              strokeColor="rgba(0, 200, 83, 0.6)"
              strokeWidth={2}
              tappable
            />
          );
        })}

        {/* Resonance Spot Markers */}
        {resonanceSpots.map((spot) => {
          const levelColor =
            spot.resonance_level >= 4 ? '#FFB800' :
            spot.resonance_level >= 3 ? '#FF8C00' :
            '#00D4FF';
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
                  color="#0A0E17"
                />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Status Bar */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.statusBar}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv {user?.level ?? 1}</Text>
          </View>
          <View style={styles.xpContainer}>
            <Text style={styles.xpText}>
              {user?.xp ?? 0} / {user?.xpToNextLevel ?? 100} XP
            </Text>
            <View style={styles.xpBarBg}>
              <View
                style={[
                  styles.xpBarFill,
                  {
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
            <Ionicons name="flame" size={14} color="#FFB800" />
            <Text style={styles.streakText}>{user?.currentStreak ?? 0}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Night Mode Badge */}
      {nightMode && (
        <View style={styles.nightBadge}>
          <Ionicons name="moon" size={14} color="#8B5CF6" />
          <Text style={styles.nightBadgeText}>NIGHT MODE</Text>
        </View>
      )}

      {/* Weather Badge */}
      {weather && (
        <View style={styles.weatherBadge}>
          <Ionicons
            name={WEATHER_ICONS[weather.condition] || 'partly-sunny'}
            size={16}
            color={WEATHER_BONUSES[weather.condition]?.multiplier > 1 ? '#00FF88' : '#8892B0'}
          />
          <Text style={styles.weatherText}>{weather.condition}</Text>
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
                {weatherQuestCount} {weather.condition} quest{weatherQuestCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Map Control Buttons */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={22} color="#00D4FF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => navigation.navigate('ChallengeList')}
        >
          <Ionicons name="trophy" size={22} color="#FFB800" />
        </TouchableOpacity>
      </View>

      {/* FAB - Record Button */}
      <TouchableOpacity
        style={[styles.fab, isTracking && styles.fabRecording]}
        onPress={toggleRecording}
        activeOpacity={0.8}
      >
        {isTracking ? (
          <Animated.View style={[styles.fabInner, { backgroundColor: recordingBg }]}>
            <Ionicons name="stop" size={28} color="#FFFFFF" />
          </Animated.View>
        ) : (
          <View style={styles.fabInner}>
            <Ionicons name="footsteps" size={28} color="#0A0E17" />
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, bottomSheetExpanded && styles.bottomSheetExpanded]}>
        <TouchableOpacity
          style={styles.bottomSheetHandle}
          onPress={() => setBottomSheetExpanded(!bottomSheetExpanded)}
        >
          <View style={styles.handleBar} />
        </TouchableOpacity>

        <View style={styles.bottomSheetContent}>
          {/* Class Indicator */}
          <View style={styles.classRow}>
            <View
              style={[
                styles.classBadge,
                { backgroundColor: `${CLASS_COLORS[detectedClass]}20` },
              ]}
            >
              <Ionicons
                name={CLASS_ICONS[detectedClass]}
                size={18}
                color={CLASS_COLORS[detectedClass]}
              />
              <Text style={[styles.classText, { color: CLASS_COLORS[detectedClass] }]}>
                {CLASS_LABELS[detectedClass]}
              </Text>
            </View>

            {isTracking && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>REC</Text>
              </View>
            )}
          </View>

          {/* Tracking Stats */}
          {isTracking && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDistance(totalDistance)}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDuration()}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentRoute.length}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>
          )}

          {!isTracking && (
            <View style={styles.idlePrompt}>
              <Text style={styles.idleText}>
                Start walking to claim territory
              </Text>
              <Text style={styles.idleSubtext}>
                Tap the footsteps button to begin recording
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Claim Result Overlay */}
      {showClaimResult && claimResult && (
        <View style={styles.claimOverlay}>
          <View style={styles.claimCard}>
            <Ionicons name="flag" size={36} color="#00FF88" />
            <Text style={styles.claimTitle}>TERRITORY CLAIMED!</Text>
            <View style={styles.claimStats}>
              <View style={styles.claimStatItem}>
                <Text style={styles.claimStatValue}>{claimResult.area} m²</Text>
                <Text style={styles.claimStatLabel}>Area Claimed</Text>
              </View>
              <View style={styles.claimStatItem}>
                <Text style={[styles.claimStatValue, { color: '#00D4FF' }]}>
                  +{claimResult.xp} XP
                </Text>
                <Text style={styles.claimStatLabel}>Earned</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
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
    backgroundColor: 'rgba(13, 18, 32, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  levelBadge: {
    backgroundColor: '#00D4FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
  },
  levelText: {
    color: '#0A0E17',
    fontSize: 12,
    fontWeight: '900',
  },
  xpContainer: {
    flex: 1,
    marginRight: 10,
  },
  xpText: {
    color: '#8892B0',
    fontSize: 10,
    marginBottom: 4,
  },
  xpBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A2340',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#00D4FF',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  streakText: {
    color: '#FFB800',
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
    backgroundColor: 'rgba(13, 18, 32, 0.92)',
    borderWidth: 1,
    borderColor: '#1A2340',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 220,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  fabRecording: {
    shadowColor: '#FF4757',
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artifactMarker: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  resonanceMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 18, 32, 0.96)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#1A2340',
    minHeight: 140,
    paddingBottom: 100,
  },
  bottomSheetExpanded: {
    minHeight: 240,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A3450',
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
    backgroundColor: '#FF4757',
  },
  recordingText: {
    color: '#FF4757',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#141B2D',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8892B0',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#1A2340',
  },
  idlePrompt: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  idleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  idleSubtext: {
    color: '#555E78',
    fontSize: 12,
    marginTop: 4,
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
    backgroundColor: '#141B2D',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#00FF88',
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  claimTitle: {
    color: '#00FF88',
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
    color: '#00FF88',
    fontSize: 22,
    fontWeight: '800',
  },
  claimStatLabel: {
    color: '#8892B0',
    fontSize: 11,
    marginTop: 4,
  },
  nightBadge: {
    position: 'absolute',
    top: height * 0.12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    gap: 6,
  },
  nightBadgeText: {
    color: '#8B5CF6',
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
    backgroundColor: 'rgba(13, 18, 32, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1A2340',
    gap: 6,
  },
  weatherText: {
    color: '#8892B0',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weatherMultiplier: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weatherMultiplierText: {
    color: '#00FF88',
    fontSize: 10,
    fontWeight: '800',
  },
  weatherQuestBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weatherQuestBadgeText: {
    color: '#00D4FF',
    fontSize: 9,
    fontWeight: '700',
  },
});

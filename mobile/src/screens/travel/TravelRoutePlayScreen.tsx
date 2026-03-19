import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  Image,
  Vibration,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { travelApi } from '../../services/api';
import { useLocationStore } from '../../store/locationStore';
import { TravelRoutePlayScreenProps } from '../../navigation/types';
import { TravelRoute, TravelSpot } from '../../utils/types';

const { width, height } = Dimensions.get('window');

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TravelRoutePlayScreen({
  route,
  navigation,
}: TravelRoutePlayScreenProps) {
  const { routeId } = route.params;
  const { currentLocation } = useLocationStore();
  const mapRef = useRef<MapView>(null);

  const [travelRoute, setTravelRoute] = useState<TravelRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitedSpots, setVisitedSpots] = useState<Set<string>>(new Set());
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [showSpotDetail, setShowSpotDetail] = useState<TravelSpot | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [rating, setRating] = useState(0);
  const [completing, setCompleting] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const spotRevealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await travelApi.getById(routeId);
        setTravelRoute(data.data ?? data);
      } catch (_err) {
        // Error loading route
      } finally {
        setLoading(false);
      }
    })();
  }, [routeId]);

  const spots = (travelRoute?.spots ?? []).sort((a, b) => a.order - b.order);
  const currentSpot = spots[currentTargetIndex] ?? null;

  // Animate progress bar
  useEffect(() => {
    if (spots.length > 0) {
      Animated.timing(progressAnim, {
        toValue: visitedSpots.size / spots.length,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [visitedSpots.size, spots.length]);

  // Center map on current target
  useEffect(() => {
    if (currentSpot && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentSpot.location.latitude,
          longitude: currentSpot.location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  }, [currentTargetIndex, currentSpot]);

  // Check proximity to current spot
  useEffect(() => {
    if (!currentLocation || !currentSpot || visitedSpots.has(currentSpot.id)) return;

    const dist = haversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      currentSpot.location.latitude,
      currentSpot.location.longitude
    );

    if (dist <= 50) {
      // Arrived at spot
      Vibration.vibrate(400);
      const newVisited = new Set(visitedSpots);
      newVisited.add(currentSpot.id);
      setVisitedSpots(newVisited);
      setShowSpotDetail(currentSpot);

      // Animate spot reveal
      spotRevealAnim.setValue(0);
      Animated.spring(spotRevealAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Check if all spots visited
      if (newVisited.size >= spots.length) {
        setTimeout(() => {
          setShowSpotDetail(null);
          setShowComplete(true);
        }, 2000);
      }
    }
  }, [currentLocation, currentSpot]);

  const advanceToNextSpot = () => {
    setShowSpotDetail(null);
    if (currentTargetIndex < spots.length - 1) {
      setCurrentTargetIndex(currentTargetIndex + 1);
    }
  };

  const distToCurrentSpot = (): number => {
    if (!currentLocation || !currentSpot) return Infinity;
    return haversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      currentSpot.location.latitude,
      currentSpot.location.longitude
    );
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleAbandon = () => {
    Alert.alert(
      'Leave Route',
      'Are you sure you want to leave this route? Progress will be lost.',
      [
        { text: 'Continue Route', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleCompleteRoute = async () => {
    setCompleting(true);
    try {
      await travelApi.complete(routeId);
      if (rating > 0) {
        await travelApi.rate(routeId, { rating });
      }
    } catch (_err) {
      // Error completing
    } finally {
      setCompleting(false);
      navigation.popToTop();
    }
  };

  // Completion screen
  if (showComplete) {
    return (
      <SafeAreaView style={styles.completeContainer}>
        <View style={styles.completeContent}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={56} color="#FFB800" />
          </View>
          <Text style={styles.completeTitle}>ROUTE COMPLETE!</Text>
          <Text style={styles.completeSubtitle}>{travelRoute?.name}</Text>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingPrompt}>Rate this route</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= rating ? '#FFB800' : '#2A3450'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.doneButton, completing && styles.doneButtonDisabled]}
            onPress={handleCompleteRoute}
            disabled={completing}
            activeOpacity={0.8}
          >
            {completing ? (
              <ActivityIndicator color="#0A0E17" size="small" />
            ) : (
              <Text style={styles.doneButtonText}>COMPLETE ROUTE</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !travelRoute) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4FF" />
        <Text style={styles.loadingText}>Loading route...</Text>
      </SafeAreaView>
    );
  }

  const dist = distToCurrentSpot();
  const polylineCoords = spots.map((s) => ({
    latitude: s.location.latitude,
    longitude: s.location.longitude,
  }));

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: currentSpot?.location.latitude ?? 0,
          longitude: currentSpot?.location.longitude ?? 0,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Route line */}
        {polylineCoords.length >= 2 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="rgba(0, 255, 136, 0.4)"
            strokeWidth={3}
            lineDashPattern={[8, 6]}
          />
        )}

        {/* Spot markers */}
        {spots.map((spot, index) => {
          const isVisited = visitedSpots.has(spot.id);
          const isCurrent = index === currentTargetIndex && !isVisited;

          return (
            <Marker
              key={spot.id}
              coordinate={spot.location}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={[
                  styles.spotMarker,
                  isVisited && styles.spotMarkerVisited,
                  isCurrent && styles.spotMarkerCurrent,
                ]}
              >
                {isVisited ? (
                  <Ionicons name="checkmark" size={14} color="#0A0E17" />
                ) : (
                  <Text
                    style={[
                      styles.spotMarkerText,
                      isCurrent && styles.spotMarkerTextCurrent,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.abandonButton} onPress={handleAbandon}>
          <Ionicons name="close" size={22} color="#FF4757" />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {visitedSpots.size} / {spots.length}
          </Text>
        </View>
      </SafeAreaView>

      {/* Spot Detail Overlay */}
      {showSpotDetail && (
        <Animated.View
          style={[
            styles.spotDetailOverlay,
            {
              opacity: spotRevealAnim,
              transform: [
                {
                  translateY: spotRevealAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.spotDetailCard}>
            <View style={styles.spotDetailHeader}>
              <View style={styles.spotDetailBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#00FF88" />
                <Text style={styles.spotDetailBadgeText}>Spot Reached!</Text>
              </View>
            </View>

            {showSpotDetail.photoUrl && (
              <Image
                source={{ uri: showSpotDetail.photoUrl }}
                style={styles.spotDetailPhoto}
              />
            )}

            <Text style={styles.spotDetailName}>{showSpotDetail.name}</Text>
            {showSpotDetail.description ? (
              <Text style={styles.spotDetailDescription}>
                {showSpotDetail.description}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.nextSpotButton}
              onPress={advanceToNextSpot}
              activeOpacity={0.8}
            >
              <Text style={styles.nextSpotButtonText}>
                {visitedSpots.size >= spots.length ? 'FINISH' : 'NEXT SPOT'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#0A0E17" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Bottom Info Card (when no spot detail showing) */}
      {!showSpotDetail && currentSpot && (
        <View style={styles.bottomCard}>
          <View style={styles.bottomCardHeader}>
            <View style={styles.spotTargetBadge}>
              <Ionicons name="navigate" size={16} color="#00FF88" />
              <Text style={styles.spotTargetText}>
                Spot {currentTargetIndex + 1}: {currentSpot.name}
              </Text>
            </View>
          </View>

          <View style={styles.distanceRow}>
            <Ionicons name="navigate-outline" size={14} color="#8892B0" />
            <Text style={styles.distanceText}>
              {dist < Infinity ? formatDistance(dist) : '---'} away
            </Text>
          </View>

          {currentSpot.description ? (
            <Text style={styles.spotHint} numberOfLines={2}>
              {currentSpot.description}
            </Text>
          ) : null}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E17',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8892B0',
    fontSize: 14,
  },
  map: {
    width,
    height: height * 0.65,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  abandonButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 18, 32, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 18, 32, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A2340',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#00FF88',
  },
  progressText: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '700',
  },
  spotMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A2340',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555E78',
  },
  spotMarkerVisited: {
    backgroundColor: '#00FF88',
    borderColor: '#FFFFFF',
  },
  spotMarkerCurrent: {
    backgroundColor: '#00D4FF',
    borderColor: '#FFFFFF',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
  },
  spotMarkerText: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '800',
  },
  spotMarkerTextCurrent: {
    color: '#0A0E17',
    fontSize: 14,
  },
  // Spot detail overlay
  spotDetailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  spotDetailCard: {
    backgroundColor: '#0D1220',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: '#1A2340',
  },
  spotDetailHeader: {
    marginBottom: 12,
  },
  spotDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spotDetailBadgeText: {
    color: '#00FF88',
    fontSize: 15,
    fontWeight: '700',
  },
  spotDetailPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#1A2340',
    marginBottom: 14,
  },
  spotDetailName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  spotDetailDescription: {
    color: '#8892B0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  nextSpotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF88',
    borderRadius: 14,
    height: 52,
    gap: 8,
  },
  nextSpotButtonText: {
    color: '#0A0E17',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Bottom info card
  bottomCard: {
    flex: 1,
    backgroundColor: '#0D1220',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: '#1A2340',
  },
  bottomCardHeader: {
    marginBottom: 12,
  },
  spotTargetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  spotTargetText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '700',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  distanceText: {
    color: '#8892B0',
    fontSize: 13,
  },
  spotHint: {
    color: '#555E78',
    fontSize: 13,
    lineHeight: 18,
  },
  // Completion screen
  completeContainer: {
    flex: 1,
    backgroundColor: '#0A0E17',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderWidth: 3,
    borderColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  completeTitle: {
    color: '#FFB800',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  completeSubtitle: {
    color: '#8892B0',
    fontSize: 16,
    marginBottom: 40,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ratingPrompt: {
    color: '#8892B0',
    fontSize: 14,
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 8,
  },
  doneButton: {
    backgroundColor: '#00D4FF',
    borderRadius: 16,
    paddingHorizontal: 40,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  doneButtonDisabled: {
    opacity: 0.7,
  },
  doneButtonText: {
    color: '#0A0E17',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

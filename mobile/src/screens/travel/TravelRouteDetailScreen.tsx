import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '@components/map';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/constants';
import { travelApi } from '../../services/api';
import { strings as S, t } from '../../i18n';
import { TravelRouteDetailScreenProps } from '../../navigation/types';
import { TravelRoute, TravelSpot } from '../../utils/types';

const { width } = Dimensions.get('window');

export default function TravelRouteDetailScreen({
  route,
  navigation,
}: TravelRouteDetailScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { routeId } = route.params;
  const [travelRoute, setTravelRoute] = useState<TravelRoute | null>(null);
  const [loading, setLoading] = useState(true);

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

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderRatingStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? 'star' : 'star-outline'}
          size={16}
          color={star <= Math.round(rating) ? theme.warning : theme.textSecondary}
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!travelRoute) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.danger} />
        <Text style={styles.errorText}>{S.travel.detail.notFound}</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>{S.travel.detail.goBack}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const spots = (travelRoute.spots ?? []).sort((a, b) => a.order - b.order);

  const mapCenter =
    spots.length > 0
      ? spots[0].location
      : { latitude: 0, longitude: 0 };

  // Build a polyline from spot locations
  const polylineCoords = spots.map((s) => ({
    latitude: s.location.latitude,
    longitude: s.location.longitude,
  }));

  // Calculate map region to fit all spots
  const getRegion = () => {
    if (spots.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    if (spots.length === 1) {
      return {
        latitude: spots[0].location.latitude,
        longitude: spots[0].location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    const lats = spots.map((s) => s.location.latitude);
    const lngs = spots.map((s) => s.location.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat) * 0.3 || 0.005;
    const padLng = (maxLng - minLng) * 0.3 || 0.005;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: maxLat - minLat + padLat,
      longitudeDelta: maxLng - minLng + padLng,
    };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#7A7470" />
        </TouchableOpacity>

        {/* Map Preview */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.mapPreview}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={getRegion()}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {/* Dashed route line */}
            {polylineCoords.length >= 2 && (
              <Polyline
                coordinates={polylineCoords}
                strokeColor="#1B9E5A"
                strokeWidth={3}
                lineDashPattern={[8, 6]}
              />
            )}

            {/* Numbered spot markers */}
            {spots.map((spot, index) => (
              <Marker
                key={spot.id}
                coordinate={spot.location}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.spotMarker}>
                  <Text style={styles.spotMarkerText}>{index + 1}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>{t(S.travel.detail.spotsCount, { count: spots.length })}</Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>{travelRoute.name}</Text>

          <View style={styles.routeMeta}>
            {renderRatingStars(travelRoute.rating ?? 0)}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={theme.warning} />
              <Text style={styles.ratingText}>
                {(travelRoute.rating ?? 0).toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.routeStats}>
            <View style={styles.routeStat}>
              <Ionicons name="location" size={16} color={theme.textSecondary} />
              <Text style={styles.routeStatText}>{t(S.travel.detail.spotsCount, { count: spots.length })}</Text>
            </View>
            <View style={styles.routeStat}>
              <Ionicons name="navigate" size={16} color={theme.textSecondary} />
              <Text style={styles.routeStatText}>
                ~{formatDistance(travelRoute.distance ?? 0)}
              </Text>
            </View>
            <View style={styles.routeStat}>
              <Ionicons name="checkmark-done" size={16} color={theme.textSecondary} />
              <Text style={styles.routeStatText}>
                {t(S.travel.detail.completionsDone, { count: travelRoute.completions ?? 0 })}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{travelRoute.description}</Text>

          <View style={styles.creatorRow}>
            <Ionicons name="person-circle-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.creatorText}>{t(S.travel.detail.by, { username: travelRoute.creatorUsername })}</Text>
          </View>
        </View>

        {/* Spots List */}
        <View style={styles.spotsSection}>
          <Text style={styles.sectionTitle}>{S.travel.detail.spotsLabel}</Text>
          {spots.map((spot, index) => (
            <View key={spot.id} style={styles.spotCard}>
              <View style={styles.spotNumber}>
                <Text style={styles.spotNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.spotContent}>
                <Text style={styles.spotName}>{spot.name}</Text>
                {spot.description ? (
                  <Text style={styles.spotDescription} numberOfLines={2}>
                    {spot.description}
                  </Text>
                ) : null}
              </View>
              {spot.photoUrl ? (
                <Image
                  source={{ uri: spot.photoUrl }}
                  style={styles.spotPhoto}
                />
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('TravelRoutePlay', { routeId })}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={22} color={theme.bg} />
          <Text style={styles.startButtonText}>{S.travel.detail.startRoute}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: theme.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    width,
    height: 200,
    position: 'relative',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mapOverlayText: {
    color: '#7A7470',
    fontSize: 11,
    fontWeight: '600',
  },
  routeInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  routeTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: theme.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  routeStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeStatText: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  description: {
    color: '#141210',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorText: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  spotsSection: {
    padding: 20,
  },
  sectionTitle: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 14,
  },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  spotNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(27, 158, 90, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.accent,
  },
  spotContent: {
    flex: 1,
  },
  spotName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  spotDescription: {
    color: theme.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  spotPhoto: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.border,
  },
  spotMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1B9E5A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  spotMarkerText: {
    color: '#F6F4F1',
    fontSize: 12,
    fontWeight: '900',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(246, 244, 241, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderRadius: 16,
    height: 56,
    gap: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    color: theme.bg,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

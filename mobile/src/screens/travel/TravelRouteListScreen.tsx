import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { travelApi } from '../../services/api';
import { TravelRouteListScreenProps } from '../../navigation/types';
import { TravelRoute } from '../../utils/types';

type SortMode = 'nearest' | 'highest_rated' | 'newest';

export default function TravelRouteListScreen({ navigation }: TravelRouteListScreenProps) {
  const { currentLocation } = useLocationStore();
  const [routes, setRoutes] = useState<TravelRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('nearest');

  const loadRoutes = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const { data } = await travelApi.getRoutes(
        currentLocation.latitude,
        currentLocation.longitude,
        10000
      );
      const raw = data?.data?.routes ?? data?.data ?? data?.routes ?? data ?? [];
      setRoutes(Array.isArray(raw) ? raw : []);
    } catch (_err) {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const safeRoutes = Array.isArray(routes) ? routes : [];
  const sortedRoutes = [...safeRoutes].sort((a, b) => {
    switch (sortMode) {
      case 'highest_rated':
        return (b.rating ?? 0) - (a.rating ?? 0);
      case 'newest':
        return 0; // server-ordered
      case 'nearest':
      default:
        return (a.distance ?? 0) - (b.distance ?? 0);
    }
  });

  const renderRatingStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? 'star' : 'star-outline'}
          size={12}
          color={star <= Math.round(rating) ? '#FFB800' : '#2A3450'}
        />
      ))}
    </View>
  );

  const renderRouteCard = ({ item }: { item: TravelRoute }) => (
    <TouchableOpacity
      style={styles.routeCard}
      onPress={() => navigation.navigate('TravelRouteDetail', { routeId: item.id })}
      activeOpacity={0.7}
    >
      {/* Route Icon */}
      <View style={styles.routeIconCircle}>
        <Ionicons name="trail-sign" size={24} color="#00FF88" />
      </View>

      {/* Content */}
      <View style={styles.routeCardContent}>
        <Text style={styles.routeName} numberOfLines={1}>
          {item.name}
        </Text>

        {item.description ? (
          <Text style={styles.routeDescription} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.routeMeta}>
          {renderRatingStars(item.rating ?? 0)}
          <View style={styles.metaDivider} />
          <Ionicons name="location-outline" size={12} color="#8892B0" />
          <Text style={styles.metaText}>{item.spots?.length ?? 0} spots</Text>
          <View style={styles.metaDivider} />
          <Ionicons name="navigate-outline" size={12} color="#8892B0" />
          <Text style={styles.metaText}>{formatDistance(item.distance ?? 0)}</Text>
        </View>

        <View style={styles.routeBottom}>
          <Text style={styles.creatorText}>by {item.creatorUsername}</Text>
          <Text style={styles.completionsText}>
            {item.completions ?? 0} completed
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color="#2A3450" />
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trail-sign-outline" size={64} color="#2A3450" />
        <Text style={styles.emptyTitle}>No travel routes nearby</Text>
        <Text style={styles.emptySubtext}>
          Be the first to create a travel route in this area!
        </Text>
      </View>
    );
  };

  const SORT_OPTIONS: { label: string; value: SortMode }[] = [
    { label: 'Nearest', value: 'nearest' },
    { label: 'Highest Rated', value: 'highest_rated' },
    { label: 'Newest', value: 'newest' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Travel Routes</Text>
        <Text style={styles.headerSubtitle}>Discover curated routes</Text>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SORT_OPTIONS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.sortList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.sortChip,
                sortMode === item.value && styles.sortChipActive,
              ]}
              onPress={() => setSortMode(item.value)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortMode === item.value && styles.sortChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Route List */}
      {loading && routes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D4FF" />
          <Text style={styles.loadingText}>Searching for routes...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedRoutes}
          keyExtractor={(item) => item.id}
          renderItem={renderRouteCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00D4FF"
              colors={['#00D4FF']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8892B0',
    marginTop: 2,
  },
  sortBar: {
    marginBottom: 8,
  },
  sortList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  sortChip: {
    backgroundColor: '#141B2D',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  sortChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: '#00D4FF',
  },
  sortChipText: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#00D4FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8892B0',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  routeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  routeCardContent: {
    flex: 1,
  },
  routeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  routeDescription: {
    color: '#8892B0',
    fontSize: 12,
    marginBottom: 6,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#2A3450',
  },
  metaText: {
    color: '#8892B0',
    fontSize: 11,
  },
  routeBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creatorText: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
  },
  completionsText: {
    color: '#555E78',
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#555E78',
    fontSize: 13,
    marginTop: 6,
  },
});

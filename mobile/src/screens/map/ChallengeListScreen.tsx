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
import { challengeApi } from '../../services/api';
import ChallengeCard from '../../components/ChallengeCard';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { ChallengeListScreenProps, Challenge } from '../../navigation/types';

const TEMPLATE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Distance Sprint', value: 'Distance Sprint' },
  { label: 'Area', value: 'Area' },
  { label: 'Elevation', value: 'Elevation' },
  { label: 'Steps', value: 'Steps' },
  { label: 'Timed Walk', value: 'Timed Walk' },
  { label: 'Explorer', value: 'Explorer' },
] as const;

type TemplateFilter = (typeof TEMPLATE_FILTERS)[number]['value'];

export default function ChallengeListScreen({ navigation }: ChallengeListScreenProps) {
  const { currentLocation } = useLocationStore();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TemplateFilter>('all');

  const loadChallenges = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const response = await challengeApi.getNearby(
        currentLocation.latitude,
        currentLocation.longitude,
        5000
      );
      setChallenges(response.data);
    } catch (_err) {
      // Silently handle fetch error
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChallenges();
    setRefreshing(false);
  };

  const filteredChallenges = challenges.filter((c) => {
    if (activeFilter === 'all') return true;
    return c.template === activeFilter;
  });

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={64} color={THEME.border} />
        <Text style={styles.emptyTitle}>No challenges nearby</Text>
        <Text style={styles.emptySubtext}>
          Create a challenge or move to a new area!
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Challenges</Text>
          <Text style={styles.headerSubtitle}>
            {filteredChallenges.length} found nearby
          </Text>
        </View>
      </View>

      {/* Filter Chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TEMPLATE_FILTERS}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.filterList}
        style={styles.filterBar}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === item.value && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(item.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Challenge List */}
      {isLoading && challenges.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Scanning for challenges...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChallenges}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: item.id })}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
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
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  filterBar: {
    marginBottom: SPACING.sm,
    flexGrow: 0,
  },
  filterList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterChip: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: THEME.primary,
  },
  filterChipText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: THEME.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
});

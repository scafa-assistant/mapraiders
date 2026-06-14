import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { ChallengeListScreenProps, Challenge } from '../../navigation/types';
import { strings as S, t } from '../../i18n';

const getTemplateFilters = () =>
  [
    { label: S.map.challengeList.filterAll, value: 'all' },
    { label: S.map.challengeList.filterDistanceSprint, value: 'Distance Sprint' },
    { label: S.map.challengeList.filterArea, value: 'Area' },
    { label: S.map.challengeList.filterElevation, value: 'Elevation' },
    { label: S.map.challengeList.filterSteps, value: 'Steps' },
    { label: S.map.challengeList.filterTimedWalk, value: 'Timed Walk' },
    { label: S.map.challengeList.filterExplorer, value: 'Explorer' },
  ] as const;

type TemplateFilter = ReturnType<typeof getTemplateFilters>[number]['value'];

export default function ChallengeListScreen({ navigation }: ChallengeListScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const templateFilters = useMemo(getTemplateFilters, []);
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
      const raw = response.data?.data?.challenges ?? response.data?.data ?? response.data ?? [];
      setChallenges(Array.isArray(raw) ? raw : []);
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
        <Ionicons name="trophy-outline" size={64} color={theme.border} />
        <Text style={styles.emptyTitle}>{S.map.challengeList.emptyTitle}</Text>
        <Text style={styles.emptySubtext}>
          {S.map.challengeList.emptySubtext}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{S.map.challengeList.headerTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {t(S.map.challengeList.foundNearby, { count: filteredChallenges.length })}
          </Text>
        </View>
      </View>

      {/* Filter Chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={templateFilters}
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
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{S.map.challengeList.scanning}</Text>
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
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
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
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    borderColor: theme.primary,
  },
  filterChipText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: theme.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: theme.textSecondary,
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
    color: theme.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
});

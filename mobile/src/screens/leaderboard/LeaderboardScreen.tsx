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
import { leaderboardApi, userApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS, LEADERBOARD_TYPES } from '../../utils/constants';
import LeaderboardRow from '../../components/LeaderboardRow';
import type { LeaderboardScreenProps, ProfileLeaderboardScreenProps } from '../../navigation/types';
import type { LeaderboardEntry } from '../../utils/types';

type LeaderboardType = (typeof LEADERBOARD_TYPES)[number]['key'];

export default function LeaderboardScreen(_props: LeaderboardScreenProps | ProfileLeaderboardScreenProps) {
  const [activeType, setActiveType] = useState<LeaderboardType>('area');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    userApi.getMe().then((res) => setCurrentUserId(res.data.id)).catch(() => {});
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const [boardRes, rankRes] = await Promise.all([
        leaderboardApi.get(activeType),
        leaderboardApi.getMyRank(activeType),
      ]);
      setEntries(boardRes.data.entries || []);
      setMyRank(rankRes.data || null);
    } catch {
      setEntries([]);
      setMyRank(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    setIsLoading(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const renderTypeTab = ({
    item,
  }: {
    item: (typeof LEADERBOARD_TYPES)[number];
  }) => {
    const isActive = activeType === item.key;
    return (
      <TouchableOpacity
        style={[styles.typeTab, isActive && styles.typeTabActive]}
        onPress={() => setActiveType(item.key)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.icon as keyof typeof Ionicons.glyphMap}
          size={16}
          color={isActive ? THEME.primary : THEME.textSecondary}
        />
        <Text style={[styles.typeTabText, isActive && styles.typeTabTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRow = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <LeaderboardRow
      entry={item}
      rank={index + 1}
      isCurrentUser={item.userId === currentUserId}
    />
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={64} color="#2A3450" />
        <Text style={styles.emptyTitle}>No rankings yet</Text>
        <Text style={styles.emptySubtext}>
          Start walking to claim your place on the leaderboard!
        </Text>
      </View>
    );
  };

  const renderMyRankBar = () => {
    if (!myRank) return null;
    return (
      <View style={styles.myRankBar}>
        <Text style={styles.myRankLabel}>Your Rank</Text>
        <View style={styles.myRankContent}>
          <Text style={styles.myRankNumber}>#{myRank.rank}</Text>
          <Text style={styles.myRankScore}>{myRank.score.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Top Gridwalkers</Text>
      </View>

      {/* Type Selector */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={LEADERBOARD_TYPES}
        keyExtractor={(item) => item.key}
        renderItem={renderTypeTab}
        contentContainerStyle={styles.typeTabList}
        style={styles.typeTabContainer}
      />

      {/* My Rank Bar */}
      {renderMyRankBar()}

      {/* Leaderboard List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.userId}
          renderItem={renderRow}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  typeTabContainer: {
    maxHeight: 50,
    marginBottom: SPACING.sm,
  },
  typeTabList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    gap: 6,
  },
  typeTabActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: THEME.primary,
  },
  typeTabText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  typeTabTextActive: {
    color: THEME.primary,
  },
  myRankBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    marginHorizontal: 20,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  myRankLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  myRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  myRankNumber: {
    color: THEME.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  myRankScore: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  listContent: {
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
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#555E78',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

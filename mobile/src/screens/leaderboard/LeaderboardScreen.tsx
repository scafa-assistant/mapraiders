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
import { leaderboardApi, userApi } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS, LEADERBOARD_TYPES } from '../../utils/constants';
import LeaderboardRow from '../../components/LeaderboardRow';
import { strings as S } from '../../i18n';
import type { LeaderboardScreenProps, ProfileLeaderboardScreenProps } from '../../navigation/types';
import type { LeaderboardEntry } from '../../utils/types';

type LeaderboardType = (typeof LEADERBOARD_TYPES)[number]['key'];

export default function LeaderboardScreen(_props: LeaderboardScreenProps | ProfileLeaderboardScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      const entries = boardRes.data?.data?.entries ?? boardRes.data?.entries ?? boardRes.data?.data ?? [];
      setEntries(Array.isArray(entries) ? entries : []);
      setMyRank(rankRes.data?.data ?? rankRes.data ?? null);
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
          color={isActive ? theme.primary : theme.textSecondary}
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
        <Ionicons name="trophy-outline" size={64} color={theme.textSecondary} />
        <Text style={styles.emptyTitle}>{S.leaderboard.emptyTitle}</Text>
        <Text style={styles.emptySubtext}>
          {S.leaderboard.emptySubtext}
        </Text>
      </View>
    );
  };

  const renderMyRankBar = () => {
    if (!myRank) return null;
    return (
      <View style={styles.myRankBar}>
        <Text style={styles.myRankLabel}>{S.leaderboard.yourRank}</Text>
        <View style={styles.myRankContent}>
          <Text style={styles.myRankNumber}>#{myRank.rank ?? '?'}</Text>
          <Text style={styles.myRankScore}>{(myRank.score ?? 0).toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{S.leaderboard.title}</Text>
        <Text style={styles.headerSubtitle}>{S.leaderboard.subtitle}</Text>
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
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{S.leaderboard.loadingRankings}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  typeTabActive: {
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    borderColor: theme.primary,
  },
  typeTabText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  typeTabTextActive: {
    color: theme.primary,
  },
  myRankBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(21, 88, 240, 0.08)',
    marginHorizontal: 20,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 240, 0.2)',
  },
  myRankLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  myRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  myRankNumber: {
    color: theme.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  myRankScore: {
    color: theme.text,
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
    color: theme.textSecondary,
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
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

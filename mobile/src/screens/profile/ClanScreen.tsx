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
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { clanApi } from '../../services/api';
import { formatArea, formatNumber } from '../../utils/formatters';
import type { ClanScreenProps } from '../../navigation/types';
import type { Clan } from '../../utils/types';

interface ClanMember {
  userId: string;
  username: string;
  rank: 'leader' | 'officer' | 'member';
  joinedAt: string;
}

interface ClanDetail extends Clan {
  members?: ClanMember[];
}

const RANK_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  leader: { name: 'crown', color: THEME.warning },
  officer: { name: 'shield', color: THEME.secondary },
  member: { name: 'person', color: THEME.textSecondary },
};

export default function ClanScreen({ navigation }: ClanScreenProps) {
  const [clan, setClan] = useState<ClanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noClan, setNoClan] = useState(false);

  const fetchClan = useCallback(async () => {
    try {
      const { data } = await clanApi.getMine();
      const clanData = data.data ?? data;
      if (!clanData || (typeof clanData === 'object' && Object.keys(clanData).length === 0)) {
        setNoClan(true);
        setClan(null);
      } else {
        setClan(clanData);
        setNoClan(false);
      }
    } catch {
      setNoClan(true);
      setClan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClan();
  }, [fetchClan]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClan();
    setRefreshing(false);
  }, [fetchClan]);

  const renderMember = ({ item, index }: { item: ClanMember; index: number }) => {
    const rankConfig = RANK_ICONS[item.rank] ?? RANK_ICONS.member;

    return (
      <View style={styles.memberRow}>
        <Text style={styles.memberRank}>#{index + 1}</Text>
        <View style={[styles.rankIconCircle, { backgroundColor: `${rankConfig.color}15` }]}>
          <Ionicons name={rankConfig.name} size={16} color={rankConfig.color} />
        </View>
        <Text style={styles.memberName} numberOfLines={1}>
          {item.username}
        </Text>
        <View style={[styles.rankBadge, { backgroundColor: `${rankConfig.color}20` }]}>
          <Text style={[styles.rankBadgeText, { color: rankConfig.color }]}>
            {item.rank.charAt(0).toUpperCase() + item.rank.slice(1)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="people-outline" size={48} color="#2A3450" />
      </View>
      <Text style={styles.emptyTitle}>No Clan Yet</Text>
      <Text style={styles.emptySubtext}>
        You'll be matched with nearby players automatically
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Clan</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Loading clan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Clan</Text>
        <View style={styles.headerSpacer} />
      </View>

      {noClan || !clan ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={clan.members ?? []}
          keyExtractor={(item) => item.userId}
          renderItem={renderMember}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Clan Identity Card */}
              <View style={styles.clanCard}>
                <View style={styles.clanIconCircle}>
                  <Ionicons name="shield" size={32} color={THEME.secondary} />
                </View>
                <Text style={styles.clanName}>{clan.name}</Text>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>[{clan.tag}]</Text>
                </View>
                {clan.description ? (
                  <Text style={styles.clanDescription}>{clan.description}</Text>
                ) : null}
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Ionicons name="people-outline" size={20} color={THEME.primary} />
                  <Text style={styles.statValue}>{formatNumber(clan.memberCount)}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="resize-outline" size={20} color={THEME.accent} />
                  <Text style={styles.statValue}>{formatArea(clan.totalArea)}</Text>
                  <Text style={styles.statLabel}>Total Area</Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="trending-up-outline" size={20} color={THEME.warning} />
                  <Text style={styles.statValue}>{clan.level}</Text>
                  <Text style={styles.statLabel}>Level</Text>
                </View>
              </View>

              {/* Members Header */}
              <Text style={styles.sectionTitle}>Members</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.noMembersContainer}>
              <Text style={styles.noMembersText}>No members to display</Text>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  clanCard: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  clanIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(123, 97, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'rgba(123, 97, 255, 0.3)',
  },
  clanName: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  tagBadge: {
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  tagText: {
    color: THEME.secondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  clanDescription: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  statValue: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  sectionTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  memberRank: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    width: 28,
  },
  rankIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  memberName: {
    flex: 1,
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  rankBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  rankBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    color: '#555E78',
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  noMembersContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  noMembersText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
});

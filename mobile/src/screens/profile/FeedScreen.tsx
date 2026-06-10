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
import { socialApi } from '../../services/api';
import { formatRelativeTime } from '../../utils/formatters';
import { strings as S } from '../../i18n';
import type { FeedScreenProps } from '../../navigation/types';
import type { FeedItem } from '../../utils/types';

const FEED_TYPE_CONFIG: Record<
  FeedItem['type'],
  { icon: keyof typeof Ionicons.glyphMap; color: string; verb: string }
> = {
  claim: { icon: 'map', color: THEME.primary, verb: S.profile.feed.verbClaim },
  quest_complete: { icon: 'flag', color: THEME.accent, verb: S.profile.feed.verbQuestComplete },
  challenge_complete: { icon: 'trophy', color: THEME.warning, verb: S.profile.feed.verbChallengeComplete },
  echo_created: { icon: 'mic', color: THEME.secondary, verb: S.profile.feed.verbEchoCreated },
  level_up: { icon: 'star', color: '#FFB800', verb: S.profile.feed.verbLevelUp },
};

export default function FeedScreen({ navigation }: FeedScreenProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (pageNum: number, append = false) => {
    try {
      const { data } = await socialApi.getFeed(pageNum);
      const raw = data?.data?.feed ?? data?.data ?? data ?? [];
      const items: FeedItem[] = Array.isArray(raw) ? raw : [];
      if (append) {
        setFeedItems((prev) => [...prev, ...items]);
      } else {
        setFeedItems(items);
      }
      setHasMore(items.length >= 20);
    } catch {
      if (!append) setFeedItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchFeed(1);
    setRefreshing(false);
  }, [fetchFeed]);

  const onEndReached = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  }, [hasMore, loadingMore, loading, page, fetchFeed]);

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    const config = FEED_TYPE_CONFIG[item.type] ?? FEED_TYPE_CONFIG.claim;

    return (
      <View style={styles.feedCard}>
        {/* Type icon */}
        <View style={[styles.feedIconCircle, { backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>

        {/* Content */}
        <View style={styles.feedContent}>
          <Text style={styles.feedText} numberOfLines={2}>
            <Text style={[styles.feedUsername, { color: config.color }]}>
              {item.username}
            </Text>
            {' '}
            {item.description || config.verb}
          </Text>
          <Text style={styles.feedTime}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={64} color="#2A3450" />
        <Text style={styles.emptyTitle}>{S.profile.feed.emptyTitle}</Text>
        <Text style={styles.emptySubtext}>
          {S.profile.feed.emptySubtext}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={THEME.primary} />
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>{S.profile.feed.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Feed List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>{S.profile.feed.loadingFeed}</Text>
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
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
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  feedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  feedContent: {
    flex: 1,
  },
  feedText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
    marginBottom: 4,
  },
  feedUsername: {
    fontWeight: '700',
  },
  feedTime: {
    color: '#555E78',
    fontSize: FONT_SIZE.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    color: '#555E78',
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footerLoader: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
});

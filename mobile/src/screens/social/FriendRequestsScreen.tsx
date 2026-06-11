import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { friendApi } from '../../services/api';
import { strings as S, t, plural } from '../../i18n';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'FriendRequests'>;

interface FriendRequest {
  id: string;
  sender_id?: string;
  receiver_id?: string;
  username: string;
  level: number;
  avatar_url?: string;
  created_at: string;
}

const AVATAR_BASE = 'https://api.mapraiders.com';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return S.common.justNow;
  if (minutes < 60) return t(S.common.minutesAgo, { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t(S.common.hoursAgo, { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return plural(days, S.common.daysAgoOne, S.common.daysAgoOther);
  const weeks = Math.floor(days / 7);
  return plural(weeks, S.common.weeksAgoOne, S.common.weeksAgoOther);
}

export default function FriendRequestsScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [recvRes, sentRes] = await Promise.all([
        friendApi.getRequests(),
        friendApi.getSentRequests(),
      ]);
      const recvList = recvRes.data?.data?.requests ?? recvRes.data?.data ?? [];
      const sentList = sentRes.data?.data?.requests ?? sentRes.data?.data ?? [];
      setReceived(Array.isArray(recvList) ? recvList : []);
      setSent(Array.isArray(sentList) ? sentList : []);
    } catch {
      setReceived([]);
      setSent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleAccept = useCallback(async (request: FriendRequest) => {
    setProcessingIds((prev) => new Set(prev).add(request.id));
    try {
      await friendApi.acceptRequest(request.id);
      setReceived((prev) => prev.filter((r) => r.id !== request.id));
      Alert.alert(S.social.requests.acceptedTitle, t(S.social.requests.acceptedMsg, { username: request.username }));
    } catch {
      Alert.alert(S.common.error, S.social.requests.acceptFailed);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  }, []);

  const handleDecline = useCallback(async (request: FriendRequest) => {
    setProcessingIds((prev) => new Set(prev).add(request.id));
    try {
      await friendApi.declineRequest(request.id);
      setReceived((prev) => prev.filter((r) => r.id !== request.id));
    } catch {
      Alert.alert(S.common.error, S.social.requests.declineFailed);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  }, []);

  const renderReceivedItem = ({ item }: { item: FriendRequest }) => {
    const isProcessing = processingIds.has(item.id);

    return (
      <View style={styles.requestCard}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image
              source={{ uri: `${AVATAR_BASE}${item.avatar_url}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={22} color={theme.textSecondary} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.requestInfo}>
          <Text style={styles.requestName} numberOfLines={1}>
            {item.username}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={10} color={theme.warning} />
              <Text style={styles.levelText}>{t(S.social.levelShort, { level: item.level ?? 1 })}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionBtns}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.acceptBtn}
                activeOpacity={0.7}
                onPress={() => handleAccept(item)}
              >
                <Ionicons name="checkmark" size={20} color={theme.bg} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                activeOpacity={0.7}
                onPress={() => handleDecline(item)}
              >
                <Ionicons name="close" size={20} color={theme.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderSentItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image
            source={{ uri: `${AVATAR_BASE}${item.avatar_url}` }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={22} color={theme.textSecondary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.requestInfo}>
        <Text style={styles.requestName} numberOfLines={1}>
          {item.username}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.levelBadge}>
            <Ionicons name="star" size={10} color={theme.warning} />
            <Text style={styles.levelText}>{t(S.social.levelShort, { level: item.level ?? 1 })}</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>

      {/* Pending badge */}
      <View style={styles.pendingBadge}>
        <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
        <Text style={styles.pendingText}>{S.social.requests.pending}</Text>
      </View>
    </View>
  );

  const renderEmptyReceived = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="mail-open-outline" size={40} color={theme.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>{S.social.requests.emptyReceivedTitle}</Text>
        <Text style={styles.emptySubtitle}>
          {S.social.requests.emptyReceivedSubtitle}
        </Text>
      </View>
    );
  };

  const renderEmptySent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="paper-plane-outline" size={40} color={theme.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>{S.social.requests.emptySentTitle}</Text>
        <Text style={styles.emptySubtitle}>
          {S.social.requests.emptySentSubtitle}
        </Text>
      </View>
    );
  };

  const currentData = activeTab === 'received' ? received : sent;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.social.requests.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}
          onPress={() => setActiveTab('received')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-down-circle-outline"
            size={16}
            color={activeTab === 'received' ? theme.primary : theme.textSecondary}
          />
          <Text
            style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}
          >
            {S.social.requests.received}
          </Text>
          {received.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{received.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={16}
            color={activeTab === 'sent' ? theme.primary : theme.textSecondary}
          />
          <Text
            style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}
          >
            {S.social.requests.sent}
          </Text>
          {sent.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: `${theme.textSecondary}30` }]}>
              <Text style={[styles.tabBadgeText, { color: theme.textSecondary }]}>
                {sent.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'received' ? renderReceivedItem : renderSentItem}
          ListEmptyComponent={
            activeTab === 'received' ? renderEmptyReceived : renderEmptySent
          }
          contentContainerStyle={
            currentData.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
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

  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: 0.3,
  },

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  tabActive: {
    backgroundColor: `${theme.primary}15`,
    borderWidth: 1,
    borderColor: `${theme.primary}30`,
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  tabTextActive: {
    color: theme.primary,
  },
  tabBadge: {
    backgroundColor: `${theme.danger}20`,
    borderRadius: RADIUS.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 2,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.danger,
  },

  // ─── Request Card ──────────────────────────────────────────────────────────
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.border,
    gap: SPACING.md,
  },

  // ─── Avatar ────────────────────────────────────────────────────────────────
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: theme.border,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: `${theme.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.border,
  },

  // ─── Request Info ──────────────────────────────────────────────────────────
  requestInfo: {
    flex: 1,
    gap: 4,
  },
  requestName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: theme.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${theme.warning}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  levelText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: theme.warning,
  },
  timeText: {
    fontSize: FONT_SIZE.xs,
    color: theme.textSecondary,
  },

  // ─── Action Buttons ────────────────────────────────────────────────────────
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  acceptBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  declineBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: `${theme.danger}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${theme.danger}30`,
  },

  // ─── Pending Badge ─────────────────────────────────────────────────────────
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.textSecondary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: `${theme.textSecondary}20`,
  },
  pendingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: theme.textSecondary,
  },

  // ─── Empty State ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: `${theme.primary}08`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: theme.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ─── Loading ───────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.xs,
  },
  emptyListContent: {
    flexGrow: 1,
  },
});

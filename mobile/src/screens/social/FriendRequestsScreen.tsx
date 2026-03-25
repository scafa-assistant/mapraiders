import React, { useEffect, useState, useCallback } from 'react';
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
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { friendApi } from '../../services/api';
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
  if (minutes < 1) return 'Gerade eben';
  if (minutes < 60) return `Vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
  const weeks = Math.floor(days / 7);
  return `Vor ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'}`;
}

export default function FriendRequestsScreen({ navigation }: Props) {
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
      Alert.alert('Freundschaft angenommen!', `Du bist jetzt mit ${request.username} befreundet.`);
    } catch {
      Alert.alert('Fehler', 'Anfrage konnte nicht angenommen werden.');
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
      Alert.alert('Fehler', 'Anfrage konnte nicht abgelehnt werden.');
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
              <Ionicons name="person" size={22} color={THEME.textSecondary} />
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
              <Ionicons name="star" size={10} color={THEME.warning} />
              <Text style={styles.levelText}>Lv. {item.level ?? 1}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionBtns}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={THEME.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.acceptBtn}
                activeOpacity={0.7}
                onPress={() => handleAccept(item)}
              >
                <Ionicons name="checkmark" size={20} color="#0A0E17" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                activeOpacity={0.7}
                onPress={() => handleDecline(item)}
              >
                <Ionicons name="close" size={20} color={THEME.danger} />
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
            <Ionicons name="person" size={22} color={THEME.textSecondary} />
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
            <Ionicons name="star" size={10} color={THEME.warning} />
            <Text style={styles.levelText}>Lv. {item.level ?? 1}</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>

      {/* Pending badge */}
      <View style={styles.pendingBadge}>
        <Ionicons name="time-outline" size={12} color={THEME.textSecondary} />
        <Text style={styles.pendingText}>Ausstehend</Text>
      </View>
    </View>
  );

  const renderEmptyReceived = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="mail-open-outline" size={40} color={THEME.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>Keine Anfragen</Text>
        <Text style={styles.emptySubtitle}>
          Hier erscheinen eingehende Freundschaftsanfragen.
        </Text>
      </View>
    );
  };

  const renderEmptySent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="paper-plane-outline" size={40} color={THEME.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>Keine gesendeten Anfragen</Text>
        <Text style={styles.emptySubtitle}>
          Suche Spieler und sende ihnen eine Freundschaftsanfrage!
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
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Freundschaftsanfragen</Text>
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
            color={activeTab === 'received' ? THEME.primary : THEME.textSecondary}
          />
          <Text
            style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}
          >
            Empfangen
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
            color={activeTab === 'sent' ? THEME.primary : THEME.textSecondary}
          />
          <Text
            style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}
          >
            Gesendet
          </Text>
          {sent.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: `${THEME.textSecondary}30` }]}>
              <Text style={[styles.tabBadgeText, { color: THEME.textSecondary }]}>
                {sent.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
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
              tintColor={THEME.primary}
              colors={[THEME.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
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
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 0.3,
  },

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1A2340',
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
    backgroundColor: `${THEME.primary}15`,
    borderWidth: 1,
    borderColor: `${THEME.primary}30`,
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  tabTextActive: {
    color: THEME.primary,
  },
  tabBadge: {
    backgroundColor: `${THEME.danger}20`,
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
    color: THEME.danger,
  },

  // ─── Request Card ──────────────────────────────────────────────────────────
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#1A2340',
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
    borderColor: '#1A2340',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: `${THEME.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A2340',
  },

  // ─── Request Info ──────────────────────────────────────────────────────────
  requestInfo: {
    flex: 1,
    gap: 4,
  },
  requestName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: THEME.text,
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
    backgroundColor: `${THEME.warning}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  levelText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: THEME.warning,
  },
  timeText: {
    fontSize: FONT_SIZE.xs,
    color: THEME.textSecondary,
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
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  declineBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: `${THEME.danger}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${THEME.danger}30`,
  },

  // ─── Pending Badge ─────────────────────────────────────────────────────────
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${THEME.textSecondary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: `${THEME.textSecondary}20`,
  },
  pendingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: THEME.textSecondary,
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
    backgroundColor: `${THEME.primary}08`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: THEME.textSecondary,
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

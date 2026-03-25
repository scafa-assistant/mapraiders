import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { friendApi } from '../../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Friends'>;

interface Friend {
  id: string;
  username: string;
  level: number;
  avatar_url?: string;
  is_online?: boolean;
  last_seen?: string;
}

const AVATAR_BASE = 'https://api.mapraiders.com';

export default function FriendsScreen({ navigation }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const fetchFriends = useCallback(async () => {
    try {
      const { data } = await friendApi.getAll();
      const list = data?.data?.friends ?? data?.data ?? [];
      setFriends(Array.isArray(list) ? list : []);
    } catch {
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const { data } = await friendApi.getRequests();
      const requests = data?.data?.requests ?? data?.data ?? [];
      setPendingCount(Array.isArray(requests) ? requests.length : 0);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchPendingCount();
  }, [fetchFriends, fetchPendingCount]);

  // Re-fetch when returning from other screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFriends();
      fetchPendingCount();
    });
    return unsubscribe;
  }, [navigation, fetchFriends, fetchPendingCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFriends(), fetchPendingCount()]);
    setRefreshing(false);
  }, [fetchFriends, fetchPendingCount]);

  const filteredFriends = useMemo(() => {
    if (!searchText.trim()) return friends;
    const q = searchText.toLowerCase();
    return friends.filter((f) => f.username.toLowerCase().includes(q));
  }, [friends, searchText]);

  const handleRemoveFriend = useCallback(
    (friend: Friend) => {
      Alert.alert(
        'Freund entfernen?',
        `Willst du ${friend.username} wirklich als Freund entfernen?`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Entfernen',
            style: 'destructive',
            onPress: async () => {
              try {
                await friendApi.remove(friend.id);
                setFriends((prev) => prev.filter((f) => f.id !== friend.id));
              } catch {
                Alert.alert('Fehler', 'Konnte Freund nicht entfernen.');
              }
            },
          },
        ],
      );
    },
    [],
  );

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendRow}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('PlayerProfile', { playerId: item.id })}
      onLongPress={() => handleRemoveFriend(item)}
    >
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
        {item.is_online && <View style={styles.onlineDot} />}
      </View>

      {/* Info */}
      <View style={styles.friendInfo}>
        <Text style={styles.friendName} numberOfLines={1}>
          {item.username}
        </Text>
        <View style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Ionicons name="star" size={10} color={THEME.warning} />
            <Text style={styles.levelText}>Lv. {item.level ?? 1}</Text>
          </View>
          {item.is_online ? (
            <Text style={styles.onlineText}>Online</Text>
          ) : item.last_seen ? (
            <Text style={styles.offlineText}>Zuletzt gesehen</Text>
          ) : null}
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={18} color={THEME.textSecondary} />
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="people-outline" size={48} color={THEME.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>Noch keine Freunde</Text>
        <Text style={styles.emptySubtitle}>
          Suche Spieler um sie hinzuzufugen!
        </Text>
        <TouchableOpacity
          style={styles.emptySearchBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PlayerSearch')}
        >
          <Ionicons name="search" size={18} color="#0A0E17" />
          <Text style={styles.emptySearchBtnText}>Spieler suchen</Text>
        </TouchableOpacity>
      </View>
    );
  };

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

        <Text style={styles.headerTitle}>Freunde</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('PlayerSearch')}
        >
          <Ionicons name="search" size={22} color={THEME.primary} />
          {pendingCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Requests Button */}
      <TouchableOpacity
        style={styles.requestsBtn}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('FriendRequests')}
      >
        <View style={styles.requestsBtnLeft}>
          <View style={styles.requestsIconCircle}>
            <Ionicons name="mail-outline" size={18} color={THEME.primary} />
          </View>
          <Text style={styles.requestsBtnText}>Anfragen</Text>
          {pendingCount > 0 && (
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={THEME.textSecondary} />
      </TouchableOpacity>

      {/* Search Bar */}
      {friends.length > 0 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={THEME.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Freunde filtern..."
            placeholderTextColor={THEME.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={THEME.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Count */}
      {friends.length > 0 && (
        <Text style={styles.countText}>
          {filteredFriends.length} {filteredFriends.length === 1 ? 'Freund' : 'Freunde'}
        </Text>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            filteredFriends.length === 0
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
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 0.5,
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME.danger,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: THEME.bg,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },

  // ─── Requests Button ───────────────────────────────────────────────────────
  requestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  requestsBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  requestsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: `${THEME.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsBtnText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: THEME.text,
  },
  requestsBadge: {
    backgroundColor: THEME.danger,
    borderRadius: RADIUS.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.xs,
  },
  requestsBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: '#FFF',
  },

  // ─── Search ────────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#1A2340',
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: THEME.text,
    paddingVertical: SPACING.xs,
  },

  // ─── Count ─────────────────────────────────────────────────────────────────
  countText: {
    fontSize: FONT_SIZE.sm,
    color: THEME.textSecondary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  // ─── Friend Row ────────────────────────────────────────────────────────────
  friendRow: {
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
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: RADIUS.full,
    backgroundColor: THEME.accent,
    borderWidth: 3,
    borderColor: THEME.surface,
  },

  // ─── Friend Info ───────────────────────────────────────────────────────────
  friendInfo: {
    flex: 1,
    gap: 4,
  },
  friendName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: THEME.text,
  },
  levelRow: {
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
  onlineText: {
    fontSize: FONT_SIZE.xs,
    color: THEME.accent,
    fontWeight: '600',
  },
  offlineText: {
    fontSize: FONT_SIZE.xs,
    color: THEME.textSecondary,
  },

  // ─── Empty State ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: `${THEME.primary}08`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  emptySearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: THEME.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  emptySearchBtnText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#0A0E17',
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

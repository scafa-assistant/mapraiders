import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { playerApi, friendApi } from '../../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PlayerSearch'>;

interface PlayerResult {
  id: string;
  username: string;
  level: number;
  avatar_url?: string;
}

const AVATAR_BASE = 'https://api.mapraiders.com';
const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export default function PlayerSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < MIN_CHARS) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const { data } = await playerApi.search(q.trim(), 20);
      const list = data?.data?.players ?? data?.data ?? [];
      setResults(Array.isArray(list) ? list : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (text.trim().length < MIN_CHARS) {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      debounceRef.current = setTimeout(() => {
        doSearch(text);
      }, DEBOUNCE_MS);
    },
    [doSearch],
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSendRequest = useCallback(async (player: PlayerResult) => {
    setSendingId(player.id);
    try {
      await friendApi.sendRequest(player.id);
      setSentIds((prev) => new Set(prev).add(player.id));
    } catch {
      // Could already be friends or request already sent
      setSentIds((prev) => new Set(prev).add(player.id));
    } finally {
      setSendingId(null);
    }
  }, []);

  const renderPlayer = ({ item }: { item: PlayerResult }) => {
    const isSent = sentIds.has(item.id);
    const isSending = sendingId === item.id;

    return (
      <View style={styles.playerCard}>
        {/* Tappable area for profile */}
        <TouchableOpacity
          style={styles.playerTappable}
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            navigation.navigate('PlayerProfile', { playerId: item.id });
          }}
        >
          {/* Avatar */}
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

          {/* Info */}
          <View style={styles.playerInfo}>
            <Text style={styles.playerName} numberOfLines={1}>
              {item.username}
            </Text>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={10} color={THEME.warning} />
              <Text style={styles.levelText}>Lv. {item.level ?? 1}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Add Button */}
        {isSending ? (
          <View style={styles.sendingContainer}>
            <ActivityIndicator size="small" color={THEME.primary} />
          </View>
        ) : isSent ? (
          <View style={styles.sentBadge}>
            <Ionicons name="checkmark" size={14} color={THEME.textSecondary} />
            <Text style={styles.sentText}>Angefragt</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.7}
            onPress={() => handleSendRequest(item)}
          >
            <Ionicons name="person-add" size={14} color="#0A0E17" />
            <Text style={styles.addBtnText}>Hinzufugen</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="search-outline" size={48} color={THEME.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Spieler suchen</Text>
          <Text style={styles.emptySubtitle}>
            Gib einen Spielernamen ein{'\n'}(mindestens {MIN_CHARS} Zeichen)
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="sad-outline" size={48} color={THEME.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>Keine Ergebnisse</Text>
        <Text style={styles.emptySubtitle}>
          Kein Spieler mit "{query}" gefunden.{'\n'}Versuch einen anderen Namen.
        </Text>
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
        <Text style={styles.headerTitle}>Spieler suchen</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={THEME.primary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Spielername eingeben..."
            placeholderTextColor={THEME.textSecondary}
            value={query}
            onChangeText={handleChangeText}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => doSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
                inputRef.current?.focus();
              }}
            >
              <Ionicons name="close-circle" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {query.length > 0 && query.length < MIN_CHARS && (
          <Text style={styles.hintText}>
            Noch {MIN_CHARS - query.length} Zeichen...
          </Text>
        )}
      </View>

      {/* Results count */}
      {hasSearched && !loading && results.length > 0 && (
        <Text style={styles.countText}>
          {results.length} {results.length === 1 ? 'Spieler' : 'Spieler'} gefunden
        </Text>
      )}

      {/* Loading overlay for initial search */}
      {loading && !hasSearched ? null : loading ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator size="small" color={THEME.primary} />
          <Text style={styles.loadingText}>Suche...</Text>
        </View>
      ) : null}

      {/* Results List */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          results.length === 0 ? styles.emptyListContent : styles.listContent
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
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

  // ─── Search ────────────────────────────────────────────────────────────────
  searchWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: `${THEME.primary}30`,
    gap: SPACING.sm,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: THEME.text,
    paddingVertical: SPACING.xs,
  },
  hintText: {
    fontSize: FONT_SIZE.xs,
    color: THEME.textSecondary,
    marginTop: SPACING.xs,
    marginLeft: SPACING.lg,
  },

  // ─── Count ─────────────────────────────────────────────────────────────────
  countText: {
    fontSize: FONT_SIZE.sm,
    color: THEME.textSecondary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  // ─── Inline Loading ────────────────────────────────────────────────────────
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: THEME.textSecondary,
  },

  // ─── Player Card ───────────────────────────────────────────────────────────
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#1A2340',
    overflow: 'hidden',
  },
  playerTappable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },

  // ─── Avatar ────────────────────────────────────────────────────────────────
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

  // ─── Player Info ───────────────────────────────────────────────────────────
  playerInfo: {
    flex: 1,
    gap: 4,
  },
  playerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: THEME.text,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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

  // ─── Add Button ────────────────────────────────────────────────────────────
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: THEME.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#0A0E17',
  },

  // ─── Sent Badge ────────────────────────────────────────────────────────────
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${THEME.textSecondary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: `${THEME.textSecondary}20`,
  },
  sentText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: THEME.textSecondary,
  },

  // ─── Sending ───────────────────────────────────────────────────────────────
  sendingContainer: {
    paddingHorizontal: SPACING.md,
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

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { playerApi, friendApi } from '../../services/api';
import { strings as S, t, plural } from '../../i18n';
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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
              <Ionicons name="person" size={22} color={theme.textSecondary} />
            </View>
          )}

          {/* Info */}
          <View style={styles.playerInfo}>
            <Text style={styles.playerName} numberOfLines={1}>
              {item.username}
            </Text>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={10} color={theme.warning} />
              <Text style={styles.levelText}>{t(S.social.levelShort, { level: item.level ?? 1 })}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Add Button */}
        {isSending ? (
          <View style={styles.sendingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : isSent ? (
          <View style={styles.sentBadge}>
            <Ionicons name="checkmark" size={14} color={theme.textSecondary} />
            <Text style={styles.sentText}>{S.social.playerSearch.requested}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.7}
            onPress={() => handleSendRequest(item)}
          >
            <Ionicons name="person-add" size={14} color={theme.bg} />
            <Text style={styles.addBtnText}>{S.social.playerSearch.add}</Text>
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
            <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>{S.social.playerSearch.emptyInitialTitle}</Text>
          <Text style={styles.emptySubtitle}>
            {t(S.social.playerSearch.emptyInitialSubtitle, { count: MIN_CHARS })}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="sad-outline" size={48} color={theme.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>{S.social.playerSearch.noResultsTitle}</Text>
        <Text style={styles.emptySubtitle}>
          {t(S.social.playerSearch.noResultsSubtitle, { query })}
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
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.social.playerSearch.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.primary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={S.social.playerSearch.placeholder}
            placeholderTextColor={theme.textSecondary}
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
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {query.length > 0 && query.length < MIN_CHARS && (
          <Text style={styles.hintText}>
            {t(S.social.playerSearch.moreCharsHint, { count: MIN_CHARS - query.length })}
          </Text>
        )}
      </View>

      {/* Results count */}
      {hasSearched && !loading && results.length > 0 && (
        <Text style={styles.countText}>
          {plural(results.length, S.social.playerSearch.resultsCountOne, S.social.playerSearch.resultsCountOther)}
        </Text>
      )}

      {/* Loading overlay for initial search */}
      {loading && !hasSearched ? null : loading ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={styles.loadingText}>{S.social.playerSearch.searching}</Text>
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
    backgroundColor: theme.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: `${theme.primary}30`,
    gap: SPACING.sm,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: theme.text,
    paddingVertical: SPACING.xs,
  },
  hintText: {
    fontSize: FONT_SIZE.xs,
    color: theme.textSecondary,
    marginTop: SPACING.xs,
    marginLeft: SPACING.lg,
  },

  // ─── Count ─────────────────────────────────────────────────────────────────
  countText: {
    fontSize: FONT_SIZE.sm,
    color: theme.textSecondary,
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
    color: theme.textSecondary,
  },

  // ─── Player Card ───────────────────────────────────────────────────────────
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.border,
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

  // ─── Player Info ───────────────────────────────────────────────────────────
  playerInfo: {
    flex: 1,
    gap: 4,
  },
  playerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: theme.text,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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

  // ─── Add Button ────────────────────────────────────────────────────────────
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: theme.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: theme.bg,
  },

  // ─── Sent Badge ────────────────────────────────────────────────────────────
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.textSecondary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: `${theme.textSecondary}20`,
  },
  sentText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: theme.textSecondary,
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
    backgroundColor: `${theme.primary}08`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
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

  // ─── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.xs,
  },
  emptyListContent: {
    flexGrow: 1,
  },
});

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTerminalStore } from '../../store/terminalStore';
import { API_BASE_ORIGIN } from '../../services/api';
import type { TerminalSubmitBody } from '../../services/api';
import { SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MapStackParamList } from '../../navigation/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TERMINAL_COLOR = '#F5A623';
const TERMINAL_ACCENT = '#F5A623';
const TERMINAL_GLOW = 'rgba(245,166,35,0.12)';
const BG = '#F6F4F1';
const SURFACE = '#FFFFFF';
const BORDER = '#C0BAB4';
const TEXT_PRIMARY = '#141210';
const TEXT_SECONDARY = '#7A7470';

/** Game runner URL served by the same origin as the API server. */
const GAME_URL = `${API_BASE_ORIGIN}/games/runner/index.html`;

type TerminalScreenProps = NativeStackScreenProps<MapStackParamList, 'TerminalScreen'>;

// ─── View modes ───────────────────────────────────────────────────────────────

type ViewMode = 'leaderboard' | 'game' | 'result';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRankColor(rank: number): string {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return TEXT_SECONDARY;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TerminalScreen({ navigation, route }: TerminalScreenProps) {
  const { spawn } = route.params;

  const {
    leaderboardBySpawn,
    activeRun,
    lastResult,
    loading,
    error,
    fetchLeaderboard,
    startRun,
    submitRun,
    clearRun,
  } = useTerminalStore();

  const [viewMode, setViewMode] = useState<ViewMode>('leaderboard');
  const webviewRef = useRef<WebView>(null);
  // Guards against a duplicated runner:complete post (one token = one submit).
  const submittedRef = useRef(false);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetchLeaderboard(spawn.id);
  }, [spawn.id, fetchLeaderboard]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRun();
    };
  }, [clearRun]);

  const leaderboard = leaderboardBySpawn[spawn.id] ?? { entries: [], me: null };

  // ── Start the run
  const handlePlay = useCallback(async () => {
    const result = await startRun(spawn.id);
    if (result.success) {
      submittedRef.current = false;
      setViewMode('game');
    }
  }, [spawn.id, startRun]);

  // ── WebView message handler
  const handleWebViewMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      if (!activeRun) return;
      let msg: { type: string; [key: string]: unknown };
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'runner:ready': {
          // Inject init message into the game WebView.
          // We use the double-JSON.stringify technique to safely embed arbitrary
          // JSON (which may contain single quotes, backslashes, etc.) inside a
          // JS string literal. JSON.stringify produces a valid JSON string whose
          // inner quotes are escaped; we then embed THAT string as a JS string
          // literal in the injected script — no manual escaping needed.
          //
          // Step 1: build the payload object
          const payload = { type: 'runner:init', level: activeRun.level };
          // Step 2: JSON.stringify once → valid JSON string
          // Step 3: JSON.stringify again → a JS string literal safe for embedding
          const safePayload = JSON.stringify(JSON.stringify(payload));
          // safePayload is e.g. '"{\"type\":\"runner:init\",\"level\":{...}}"'
          // The injected JS calls dispatchEvent with data = the inner JSON string
          const js = `
(function() {
  var data = ${safePayload};
  window.dispatchEvent(new MessageEvent('message', { data: data }));
  document.dispatchEvent(new MessageEvent('message', { data: data }));
})();
true;
`;
          webviewRef.current?.injectJavaScript(js);
          break;
        }

        case 'runner:complete': {
          // Game over (won or out of lives) — submit the run exactly once.
          // The game posts camelCase fields (durationMs/orbsCollected) and a
          // real `finished` flag; the API body uses snake_case.
          if (submittedRef.current) break;
          submittedRef.current = true;
          const body: TerminalSubmitBody = {
            run_token: activeRun.runToken,
            score: typeof msg.score === 'number' ? msg.score : 0,
            duration_ms: typeof msg.durationMs === 'number' ? msg.durationMs : 0,
            orbs_collected: typeof msg.orbsCollected === 'number' ? msg.orbsCollected : 0,
            finished: msg.finished === true,
            trace: (msg.trace as Record<string, unknown>) ?? {},
          };
          await submitRun(spawn.id, body);
          setViewMode('result');
          break;
        }

        case 'runner:quit': {
          // Player quit mid-game — go back to leaderboard without submitting
          setViewMode('leaderboard');
          break;
        }

        default:
          break;
      }
    },
    [activeRun, spawn.id, submitRun]
  );

  // ── Render leaderboard view
  const renderLeaderboard = () => {
    const entries = leaderboard.entries.slice(0, 10);
    const me = leaderboard.me;
    const myRankOutsideTop10 = me && (entries.length === 0 || !entries.find((e) => e.rank === me.rank));

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>TOP RUNS</Text>

        {loading && entries.length === 0 ? (
          <ActivityIndicator color={TERMINAL_COLOR} style={{ marginVertical: SPACING.lg }} />
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="stats-chart" size={36} color={TEXT_SECONDARY} />
            <Text style={styles.emptyText}>No runs yet.</Text>
            <Text style={styles.emptySubtext}>Be the first to run this terminal!</Text>
          </View>
        ) : (
          <View style={styles.leaderboardContainer}>
            {entries.map((entry) => {
              const isMe = me !== null && entry.rank === me.rank;
              return (
                <View
                  key={entry.user_id}
                  style={[
                    styles.leaderboardRow,
                    isMe && styles.leaderboardRowMe,
                  ]}
                >
                  <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
                    #{entry.rank}
                  </Text>
                  <Text style={styles.usernameText} numberOfLines={1}>
                    {entry.username}
                  </Text>
                  <Text style={[styles.scoreText, { color: TERMINAL_COLOR }]}>
                    {entry.score.toLocaleString()}
                  </Text>
                </View>
              );
            })}

            {/* Show own entry below top 10 if not already in it */}
            {myRankOutsideTop10 && me && (
              <>
                <View style={styles.leaderboardSeparator}>
                  <Text style={styles.leaderboardSeparatorText}>···</Text>
                </View>
                <View style={[styles.leaderboardRow, styles.leaderboardRowMe]}>
                  <Text style={[styles.rankText, { color: TEXT_SECONDARY }]}>#{me.rank}</Text>
                  <Text style={styles.usernameText}>You</Text>
                  <Text style={[styles.scoreText, { color: TERMINAL_COLOR }]}>
                    {me.score.toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Error */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* Play button */}
        <TouchableOpacity
          style={[styles.playBtn, loading && styles.playBtnDisabled]}
          onPress={handlePlay}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Text style={styles.playBtnText}>Play Grid Runner</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ── Render game WebView
  const renderGame = () => (
    <View style={styles.webviewContainer}>
      <WebView
        ref={webviewRef}
        source={{ uri: GAME_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        originWhitelist={['*']}
        onMessage={handleWebViewMessage}
        renderLoading={() => (
          <View style={styles.webviewLoader}>
            <ActivityIndicator color={TERMINAL_COLOR} size="large" />
            <Text style={styles.webviewLoaderText}>Loading Grid Runner...</Text>
          </View>
        )}
        startInLoadingState
      />
    </View>
  );

  // ── Render result view
  const renderResult = () => {
    const result = lastResult;
    if (!result) return null;

    const hasError = !!result.error;
    const accepted = result.accepted && !hasError;

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultCard}>
          {accepted ? (
            <>
              <Ionicons name="checkmark-circle" size={52} color={TERMINAL_COLOR} />
              <Text style={styles.resultTitle}>Run Complete</Text>

              <View style={styles.resultStatsGrid}>
                <View style={styles.resultStatItem}>
                  <Text style={[styles.resultStatValue, { color: TERMINAL_COLOR }]}>
                    {result.score.toLocaleString()}
                  </Text>
                  <Text style={styles.resultStatLabel}>Score</Text>
                </View>
                <View style={styles.resultStatItem}>
                  <Text style={[styles.resultStatValue, { color: '#1558F0' }]}>
                    {result.best_score.toLocaleString()}
                  </Text>
                  <Text style={styles.resultStatLabel}>Best</Text>
                </View>
                <View style={styles.resultStatItem}>
                  <Text style={[styles.resultStatValue, { color: getRankColor(result.rank) }]}>
                    #{result.rank}
                  </Text>
                  <Text style={styles.resultStatLabel}>Rank</Text>
                </View>
              </View>

              {result.reward?.intel ? (
                <View style={styles.rewardRow}>
                  <Ionicons name="eye" size={18} color="#1558F0" />
                  <Text style={styles.rewardText}>+{result.reward.intel} Intel</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Ionicons name="close-circle" size={52} color="#D7263D" />
              <Text style={[styles.resultTitle, { color: '#D7263D' }]}>
                {hasError ? 'Run Rejected' : 'Run Not Accepted'}
              </Text>
              {result.error ? (
                <Text style={styles.resultError}>{result.error}</Text>
              ) : null}
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={async () => {
            await fetchLeaderboard(spawn.id);
            setViewMode('leaderboard');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ── Root render
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header — always visible */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={TEXT_SECONDARY} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hyperborean Terminal</Text>
          {viewMode !== 'game' && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LVL {spawn.level}</Text>
            </View>
          )}
        </View>

        {/* Right side placeholder to balance the close button */}
        <View style={styles.headerRight} />
      </View>

      {/* Body */}
      {viewMode === 'leaderboard' && renderLeaderboard()}
      {viewMode === 'game' && renderGame()}
      {viewMode === 'result' && renderResult()}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  levelBadge: {
    backgroundColor: TERMINAL_GLOW,
    borderWidth: 1,
    borderColor: TERMINAL_COLOR,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: TERMINAL_COLOR,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerRight: {
    width: 32, // matches close button width to keep title centered
  },

  // ── Scroll content
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  // ── Section
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    color: TERMINAL_COLOR,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },

  // ── Leaderboard
  leaderboardContainer: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  leaderboardRowMe: {
    backgroundColor: `${TERMINAL_COLOR}14`,
  },
  rankText: {
    width: 36,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  usernameText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  scoreText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  leaderboardSeparator: {
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  leaderboardSeparatorText: {
    color: TEXT_SECONDARY,
    fontSize: FONT_SIZE.sm,
    letterSpacing: 3,
  },

  // ── Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },

  // ── Error
  errorText: {
    color: '#D7263D',
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },

  // ── Play button
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: TERMINAL_COLOR,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    marginTop: SPACING.sm,
    shadowColor: TERMINAL_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  playBtnDisabled: {
    opacity: 0.5,
  },
  playBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── WebView
  webviewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webviewLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
    gap: SPACING.md,
  },
  webviewLoaderText: {
    color: TEXT_SECONDARY,
    fontSize: FONT_SIZE.sm,
  },

  // ── Result card
  resultCard: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: BORDER,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  resultTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  resultStatsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  resultStatItem: {
    alignItems: 'center',
    minWidth: 72,
  },
  resultStatValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  resultStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: TEXT_SECONDARY,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(21,88,240,0.12)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(21,88,240,0.3)',
    marginTop: SPACING.xs,
  },
  rewardText: {
    fontSize: FONT_SIZE.md,
    color: '#1558F0',
    fontWeight: '700',
  },
  resultError: {
    fontSize: FONT_SIZE.sm,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.xs,
  },

  // ── Done button
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: TERMINAL_COLOR,
    backgroundColor: TERMINAL_GLOW,
  },
  doneBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: TERMINAL_COLOR,
    letterSpacing: 0.5,
  },
});

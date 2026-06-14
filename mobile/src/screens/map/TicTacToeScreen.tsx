import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ScrollView,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { turnGameApi } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { TicTacToeGameScreenProps } from '../../navigation/types';
import { strings as S, t } from '../../i18n';

// ─── Types ───────────────────────────────────────────────────────────────────

type CellValue = null | 'X' | 'O';
type GameStatus = 'active' | 'completed' | 'timeout' | 'forfeit' | 'draw';
type GameResult = 'victory' | 'defeated' | 'draw' | null;

interface GameState {
  board: { cells: CellValue[] };
  your_turn: boolean;
  your_symbol: 'X' | 'O';
  status: string;
  winner_id: string | null;
  turn_deadline: string;
  turn_number: number;
  defender_username: string;
  challenger_username: string;
}

// ─── Winning Lines ───────────────────────────────────────────────────────────

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function findWinningLine(cells: CellValue[]): number[] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return line;
    }
  }
  return null;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const COLOR_X = '#1558F0'; // cyan
const COLOR_O = '#D7263D'; // magenta
const COLOR_VICTORY = '#1B9E5A';
const COLOR_DEFEATED = '#D7263D';
const COLOR_DRAW = '#F5A623';

// ─── Component ───────────────────────────────────────────────────────────────

export default function TicTacToeScreen({ route, navigation }: TicTacToeGameScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { gameId, opponentUsername } = route.params;

  // ─── State ───────────────────────────────────────────────────────────────
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GameResult>(null);
  const [countdown, setCountdown] = useState('--:--:--');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  // ─── Animations ──────────────────────────────────────────────────────────
  const cellScales = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(1))
  ).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const boardPulse = useRef(new Animated.Value(0)).current;
  const thinkingDots = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const winGlowAnims = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(0))
  ).current;

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoNavRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch Game ──────────────────────────────────────────────────────────

  const fetchGame = useCallback(async () => {
    try {
      const { data } = await turnGameApi.getGame(gameId);
      const state: GameState = data?.data ?? data;
      setGame(state);

      // Check for winning line
      const wl = findWinningLine(state.board.cells);
      setWinningLine(wl);

      // Determine result
      if (state.status === 'completed' || state.status === 'timeout' || state.status === 'forfeit' || state.status === 'draw') {
        if (state.winner_id === null) {
          setResult('draw');
        } else {
          // If there's a winner and it's not a draw, check if the current player won
          // The server returns the game state relative to the viewer, so we check your_symbol
          const winnerSymbol = wl
            ? state.board.cells[wl[0]]
            : null;
          if (winnerSymbol === state.your_symbol) {
            setResult('victory');
          } else if (state.winner_id) {
            setResult('defeated');
          }
        }
      }

      return state;
    } catch (err) {
      console.error('Failed to fetch game:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // ─── Initial Load ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchGame();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (autoNavRef.current) clearTimeout(autoNavRef.current);
    };
  }, [fetchGame]);

  // ─── Polling (when not your turn) ────────────────────────────────────────

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (game && !game.your_turn && game.status === 'active') {
      pollRef.current = setInterval(() => {
        fetchGame();
      }, 10000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [game?.your_turn, game?.status, fetchGame]);

  // ─── Countdown Timer ─────────────────────────────────────────────────────

  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (!game || game.status !== 'active') {
      setCountdown('--:--:--');
      return;
    }

    const updateCountdown = () => {
      const deadline = new Date(game.turn_deadline).getTime();
      const now = Date.now();
      const diff = Math.max(0, deadline - now);

      if (diff <= 0) {
        setCountdown('00:00:00');
        fetchGame(); // Refresh to detect timeout
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [game?.turn_deadline, game?.status, fetchGame]);

  // ─── Board Pulse Animation (your turn) ───────────────────────────────────

  useEffect(() => {
    if (game?.your_turn && game?.status === 'active') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(boardPulse, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(boardPulse, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      boardPulse.setValue(0);
    }
  }, [game?.your_turn, game?.status, boardPulse]);

  // ─── Symbol Glow Animation ──────────────────────────────────────────────

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [glowAnim]);

  // ─── Thinking Dots Animation ─────────────────────────────────────────────

  useEffect(() => {
    if (game && !game.your_turn && game.status === 'active') {
      const anim = Animated.loop(
        Animated.timing(thinkingDots, {
          toValue: 3,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      anim.start();
      return () => anim.stop();
    }
  }, [game?.your_turn, game?.status, thinkingDots]);

  // ─── Winning Line Glow ──────────────────────────────────────────────────

  useEffect(() => {
    if (winningLine) {
      const anims = winningLine.map((idx) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(winGlowAnims[idx], {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(winGlowAnims[idx], {
              toValue: 0,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        )
      );
      Animated.stagger(150, anims).start();
      return () => anims.forEach((a) => a.stop());
    }
  }, [winningLine, winGlowAnims]);

  // ─── Result Overlay + Auto-Nav ───────────────────────────────────────────

  useEffect(() => {
    if (result) {
      resultScale.setValue(0);
      resultOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(resultScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      autoNavRef.current = setTimeout(() => {
        navigation.goBack();
      }, 3000);
    }

    return () => {
      if (autoNavRef.current) clearTimeout(autoNavRef.current);
    };
  }, [result, resultScale, resultOpacity, navigation]);

  // ─── Make Move ───────────────────────────────────────────────────────────

  const handleCellPress = async (index: number) => {
    if (!game || !game.your_turn || game.status !== 'active' || submitting) return;
    if (game.board.cells[index] !== null) return;

    // Bounce animation
    cellScales[index].setValue(0.3);
    Animated.spring(cellScales[index], {
      toValue: 1,
      friction: 3,
      tension: 150,
      useNativeDriver: true,
    }).start();

    setSubmitting(true);
    try {
      const { data } = await turnGameApi.makeMove(gameId, { position: index });
      const state: GameState = data?.data ?? data;
      setGame(state);

      const wl = findWinningLine(state.board.cells);
      setWinningLine(wl);

      if (state.status === 'completed' || state.status === 'timeout' || state.status === 'forfeit' || state.status === 'draw') {
        if (state.winner_id === null) {
          setResult('draw');
        } else {
          const winnerSymbol = wl ? state.board.cells[wl[0]] : null;
          if (winnerSymbol === state.your_symbol) {
            setResult('victory');
          } else {
            setResult('defeated');
          }
        }
      }
    } catch (err: any) {
      console.error('Move failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render Helpers ──────────────────────────────────────────────────────

  const isYourTurn = game?.your_turn && game?.status === 'active';
  const isGameOver = game?.status !== 'active';
  const yourSymbol = game?.your_symbol ?? 'X';
  const opponentSymbol = yourSymbol === 'X' ? 'O' : 'X';

  const boardBorderColor = boardPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(21, 88, 240, 0.15)', 'rgba(21, 88, 240, 0.6)'],
  });

  const boardShadowOpacity = boardPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  // ─── Render Cell ─────────────────────────────────────────────────────────

  const renderCell = (index: number) => {
    const value = game?.board.cells[index] ?? null;
    const isWinCell = winningLine?.includes(index) ?? false;
    const isEmpty = value === null;
    const isInteractive = isEmpty && isYourTurn && !submitting;
    const symbolColor = value === 'X' ? COLOR_X : COLOR_O;

    const winGlow = winGlowAnims[index].interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(27, 158, 90, 0)', 'rgba(27, 158, 90, 0.4)'],
    });

    const activeGlow = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        value === 'X' ? 'rgba(21, 88, 240, 0.05)' : 'rgba(215, 38, 61, 0.05)',
        value === 'X' ? 'rgba(21, 88, 240, 0.25)' : 'rgba(215, 38, 61, 0.25)',
      ],
    });

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={isInteractive ? 0.6 : 1}
        onPress={() => handleCellPress(index)}
        disabled={!isInteractive}
      >
        <Animated.View
          style={[
            styles.cell,
            isEmpty && isYourTurn && styles.cellEmpty,
            !isEmpty && { backgroundColor: 'transparent' },
            isWinCell && { borderColor: COLOR_VICTORY, borderWidth: 2 },
            { transform: [{ scale: cellScales[index] }] },
          ]}
        >
          {/* Background glow layers */}
          {isWinCell && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: winGlow, borderRadius: RADIUS.lg },
              ]}
            />
          )}
          {value && !isWinCell && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: activeGlow, borderRadius: RADIUS.lg },
              ]}
            />
          )}

          {/* Symbol */}
          {value === 'X' && (
            <View style={styles.symbolContainer}>
              <Text style={[styles.symbolX, isWinCell && styles.symbolWin]}>X</Text>
            </View>
          )}
          {value === 'O' && (
            <View style={styles.symbolContainer}>
              <Text style={[styles.symbolO, isWinCell && styles.symbolWin]}>O</Text>
            </View>
          )}

          {/* Empty hint */}
          {isEmpty && isYourTurn && !submitting && (
            <View style={styles.cellHint}>
              <View style={styles.cellHintDot} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // ─── Render Board ────────────────────────────────────────────────────────

  const renderBoard = () => (
    <Animated.View
      style={[
        styles.boardOuter,
        {
          borderColor: boardBorderColor,
          shadowOpacity: boardShadowOpacity,
        },
      ]}
    >
      <View style={styles.board}>
        <View style={styles.boardRow}>
          {renderCell(0)}
          {renderCell(1)}
          {renderCell(2)}
        </View>
        <View style={styles.boardRow}>
          {renderCell(3)}
          {renderCell(4)}
          {renderCell(5)}
        </View>
        <View style={styles.boardRow}>
          {renderCell(6)}
          {renderCell(7)}
          {renderCell(8)}
        </View>
      </View>
    </Animated.View>
  );

  // ─── Render Move History ─────────────────────────────────────────────────

  const renderMoveHistory = () => {
    if (!game) return null;
    const cells = game.board.cells;
    const moves: { index: number; symbol: CellValue; moveNum: number }[] = [];

    // Reconstruct move order: X always goes first (defender)
    // We can infer order: count X's and O's to know which move we're on
    // But for display, just show filled cells in order X1, O1, X2, O2...
    let xMoves: number[] = [];
    let oMoves: number[] = [];
    cells.forEach((v, i) => {
      if (v === 'X') xMoves.push(i);
      if (v === 'O') oMoves.push(i);
    });

    const totalMoves = xMoves.length + oMoves.length;
    if (totalMoves === 0) return null;

    // Build alternating list
    for (let i = 0; i < Math.max(xMoves.length, oMoves.length); i++) {
      if (i < xMoves.length) {
        moves.push({ index: xMoves[i], symbol: 'X', moveNum: moves.length + 1 });
      }
      if (i < oMoves.length) {
        moves.push({ index: oMoves[i], symbol: 'O', moveNum: moves.length + 1 });
      }
    }

    const posLabel = (idx: number) => {
      const row = Math.floor(idx / 3) + 1;
      const col = (idx % 3) + 1;
      return `R${row}C${col}`;
    };

    return (
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>{S.map.ticTacToe.moveHistory}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.historyRow}>
            {moves.map((m) => (
              <View
                key={m.moveNum}
                style={[
                  styles.historyChip,
                  {
                    borderColor:
                      m.symbol === 'X'
                        ? `${COLOR_X}40`
                        : `${COLOR_O}40`,
                  },
                ]}
              >
                <Text style={styles.historyMoveNum}>#{m.moveNum}</Text>
                <Text
                  style={[
                    styles.historySymbol,
                    { color: m.symbol === 'X' ? COLOR_X : COLOR_O },
                  ]}
                >
                  {m.symbol}
                </Text>
                <Text style={styles.historyPos}>{posLabel(m.index)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // ─── Render Result Overlay ───────────────────────────────────────────────

  const renderResultOverlay = () => {
    if (!result) return null;

    const config = {
      victory: {
        icon: 'trophy' as const,
        title: S.map.ticTacToe.victory,
        subtitle: S.map.ticTacToe.victorySubtitle,
        color: COLOR_VICTORY,
        message:
          yourSymbol === 'X'
            ? S.map.ticTacToe.victoryMsgDefender
            : S.map.ticTacToe.victoryMsgChallenger,
      },
      defeated: {
        icon: 'close-circle' as const,
        title: S.map.ticTacToe.defeated,
        subtitle: yourSymbol === 'X' ? S.map.ticTacToe.defeatedSubtitleDefender : S.map.ticTacToe.defeatedSubtitleChallenger,
        color: COLOR_DEFEATED,
        message: t(S.map.ticTacToe.defeatedMsg, { username: opponentUsername }),
      },
      draw: {
        icon: 'shield-checkmark' as const,
        title: S.map.ticTacToe.draw,
        subtitle: S.map.ticTacToe.drawSubtitle,
        color: COLOR_DRAW,
        message: S.map.ticTacToe.drawMsg,
      },
    }[result];

    return (
      <Animated.View
        style={[
          styles.resultOverlay,
          {
            opacity: resultOpacity,
            transform: [{ scale: resultScale }],
          },
        ]}
        pointerEvents="box-only"
      >
        <View style={[styles.resultIconRing, { borderColor: config.color }]}>
          <Ionicons name={config.icon} size={64} color={config.color} />
        </View>
        <Text style={[styles.resultTitle, { color: config.color }]}>
          {config.title}
        </Text>
        <Text style={styles.resultSubtitle}>{config.subtitle}</Text>
        <Text style={styles.resultMessage}>{config.message}</Text>

        <View style={styles.resultDivider} />

        <Text style={styles.resultAutoNav}>{S.map.ticTacToe.returningToMap}</Text>

        <TouchableOpacity
          style={[styles.resultBtn, { backgroundColor: config.color }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.resultBtnText}>
            {result === 'victory' ? S.map.ticTacToe.celebrate : S.common.back}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ─── Render Info Section ─────────────────────────────────────────────────

  const renderInfo = () => (
    <View style={styles.infoContainer}>
      <View style={styles.infoRow}>
        <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
        <Text style={styles.infoText}>
          {S.map.ticTacToe.infoSymbols}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="shield-outline" size={16} color={theme.textSecondary} />
        <Text style={styles.infoText}>
          {S.map.ticTacToe.infoDraw}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="timer-outline" size={16} color={theme.textSecondary} />
        <Text style={styles.infoText}>
          {S.map.ticTacToe.infoTimeout}
        </Text>
      </View>
    </View>
  );

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{S.map.ticTacToe.loadingBattle}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerGameBadge}>
            <Ionicons name="grid-outline" size={16} color={theme.primary} />
            <Text style={styles.headerGameLabel}>{S.map.ticTacToe.headerTitle}</Text>
          </View>
          <Text style={styles.headerOpponent}>{t(S.map.ticTacToe.vsUsername, { username: opponentUsername })}</Text>
        </View>

        <View
          style={[
            styles.turnBadge,
            isYourTurn
              ? styles.turnBadgeYours
              : isGameOver
              ? styles.turnBadgeDone
              : styles.turnBadgeWaiting,
          ]}
        >
          <View
            style={[
              styles.turnDot,
              {
                backgroundColor: isYourTurn
                  ? COLOR_X
                  : isGameOver
                  ? theme.textSecondary
                  : COLOR_O,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer */}
        <View style={styles.timerContainer}>
          <Ionicons
            name="time-outline"
            size={20}
            color={
              isGameOver
                ? theme.textSecondary
                : isYourTurn
                ? COLOR_X
                : COLOR_O
            }
          />
          <Text
            style={[
              styles.timerText,
              isGameOver && { color: theme.textSecondary },
              isYourTurn && { color: COLOR_X },
              !isYourTurn && !isGameOver && { color: COLOR_O },
            ]}
          >
            {isGameOver ? S.map.ticTacToe.gameOver : countdown}
          </Text>
        </View>

        {/* Player Symbols */}
        <View style={styles.playersRow}>
          <View
            style={[
              styles.playerCard,
              yourSymbol === 'X' && isYourTurn && styles.playerCardActive,
            ]}
          >
            <Text style={[styles.playerSymbol, { color: COLOR_X }]}>X</Text>
            <Text style={styles.playerLabel} numberOfLines={1}>
              {game?.defender_username ?? S.map.ticTacToe.defenderFallback}
            </Text>
            {yourSymbol === 'X' && (
              <Text style={styles.playerYou}>{S.map.ticTacToe.youSuffix}</Text>
            )}
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>{S.map.ticTacToe.vsLabel}</Text>
          </View>

          <View
            style={[
              styles.playerCard,
              yourSymbol === 'O' && isYourTurn && styles.playerCardActive,
            ]}
          >
            <Text style={[styles.playerSymbol, { color: COLOR_O }]}>O</Text>
            <Text style={styles.playerLabel} numberOfLines={1}>
              {game?.challenger_username ?? S.map.ticTacToe.challengerFallback}
            </Text>
            {yourSymbol === 'O' && (
              <Text style={styles.playerYou}>{S.map.ticTacToe.youSuffix}</Text>
            )}
          </View>
        </View>

        {/* Turn Indicator */}
        <View style={styles.turnIndicatorRow}>
          {isGameOver ? (
            <View style={styles.turnIndicator}>
              <Ionicons name="flag" size={18} color={theme.textSecondary} />
              <Text style={styles.turnIndicatorText}>{S.map.ticTacToe.gameComplete}</Text>
            </View>
          ) : isYourTurn ? (
            <View style={[styles.turnIndicator, styles.turnIndicatorActive]}>
              <Ionicons name="hand-right" size={18} color={COLOR_X} />
              <Text style={[styles.turnIndicatorText, { color: COLOR_X }]}>
                {S.map.ticTacToe.yourTurnMove}
              </Text>
            </View>
          ) : (
            <View style={styles.turnIndicator}>
              <ActivityIndicator size="small" color={COLOR_O} />
              <ThinkingText />
            </View>
          )}
        </View>

        {/* Board */}
        {renderBoard()}

        {/* Move number badge */}
        {game && (
          <View style={styles.moveNumberContainer}>
            <Text style={styles.moveNumberLabel}>
              {t(S.map.ticTacToe.turnNumber, { number: game.turn_number })}
            </Text>
          </View>
        )}

        {/* Move History */}
        {renderMoveHistory()}

        {/* Info */}
        {renderInfo()}
      </ScrollView>

      {/* Submitting overlay */}
      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}

      {/* Result Overlay */}
      {renderResultOverlay()}
    </SafeAreaView>
  );
}

// ─── Thinking Text Component ─────────────────────────────────────────────────

function ThinkingText() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={[styles.turnIndicatorText, { color: COLOR_O }]}>
      {S.map.ticTacToe.waitingOpponent}{dots}
    </Text>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CELL_SIZE = 100;
const BOARD_GAP = 6;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  // ─── Loading ───────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  loadingText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },

  // ─── Header ────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  headerGameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: `${theme.primary}20`,
  },
  headerGameLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: theme.primary,
  },
  headerOpponent: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  turnBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  turnBadgeYours: {
    borderColor: COLOR_X,
    backgroundColor: `${COLOR_X}15`,
  },
  turnBadgeWaiting: {
    borderColor: COLOR_O,
    backgroundColor: `${COLOR_O}15`,
  },
  turnBadgeDone: {
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  turnDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // ─── Scroll Content ────────────────────────────────────────────────────
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 40,
  },

  // ─── Timer ─────────────────────────────────────────────────────────────
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },

  // ─── Players Row ───────────────────────────────────────────────────────
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  playerCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 2,
  },
  playerCardActive: {
    borderColor: `${theme.primary}60`,
    backgroundColor: `${theme.primary}08`,
  },
  playerSymbol: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  playerLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    maxWidth: 100,
  },
  playerYou: {
    color: theme.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  vsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ─── Turn Indicator ────────────────────────────────────────────────────
  turnIndicatorRow: {
    marginBottom: SPACING.xl,
    width: '100%',
    alignItems: 'center',
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  turnIndicatorActive: {
    borderColor: `${COLOR_X}40`,
    backgroundColor: `${COLOR_X}10`,
  },
  turnIndicatorText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },

  // ─── Board ─────────────────────────────────────────────────────────────
  boardOuter: {
    borderWidth: 2,
    borderRadius: RADIUS.xl + 4,
    padding: SPACING.md,
    backgroundColor: `${theme.surface}80`,
    shadowColor: COLOR_X,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  board: {
    gap: BOARD_GAP,
  },
  boardRow: {
    flexDirection: 'row',
    gap: BOARD_GAP,
  },

  // ─── Cell ──────────────────────────────────────────────────────────────
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: RADIUS.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cellEmpty: {
    borderColor: `${theme.primary}30`,
    borderStyle: 'dashed',
  },
  symbolContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolX: {
    fontSize: 48,
    fontWeight: '900',
    color: COLOR_X,
    textShadowColor: `${COLOR_X}60`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  symbolO: {
    fontSize: 48,
    fontWeight: '900',
    color: COLOR_O,
    textShadowColor: `${COLOR_O}60`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  symbolWin: {
    textShadowRadius: 24,
  },
  cellHint: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellHintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: `${theme.primary}30`,
  },

  // ─── Move Number ───────────────────────────────────────────────────────
  moveNumberContainer: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  moveNumberLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },

  // ─── Move History ──────────────────────────────────────────────────────
  historyContainer: {
    width: '100%',
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  historyTitle: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  historyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
  },
  historyMoveNum: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  historySymbol: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  historyPos: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },

  // ─── Info ──────────────────────────────────────────────────────────────
  infoContainer: {
    width: '100%',
    marginTop: SPACING.xl,
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: theme.border,
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    flex: 1,
  },

  // ─── Submitting Overlay ────────────────────────────────────────────────
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(246, 244, 241, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Result Overlay ────────────────────────────────────────────────────
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(246, 244, 241, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: SPACING.lg,
    zIndex: 100,
  },
  resultIconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 244, 241, 0.8)',
    marginBottom: SPACING.sm,
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
  },
  resultSubtitle: {
    color: theme.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultMessage: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultDivider: {
    width: 60,
    height: 2,
    backgroundColor: theme.border,
    marginVertical: SPACING.sm,
  },
  resultAutoNav: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  resultBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },
  resultBtnText: {
    color: '#141210',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
});

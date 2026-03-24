import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { turnGameApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { MiniChessGameScreenProps } from '../../navigation/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = 5;
const CELL_SIZE = (SCREEN_WIDTH - 80) / BOARD_SIZE;

const COLORS = {
  white: '#FFB800',
  black: '#7B61FF',
  lightSquare: '#232B45',
  darkSquare: '#1A2340',
  selectedGlow: '#00D4FF',
  validMove: '#00FF88',
  lastMoveFrom: 'rgba(0, 212, 255, 0.15)',
  lastMoveTo: 'rgba(0, 212, 255, 0.25)',
  boardBorder: '#0D1221',
  boardEdge: '#1E293B',
} as const;

const PIECE_SYMBOLS: Record<string, string> = {
  wK: '\u2654', // ♔
  wR: '\u2656', // ♖
  wB: '\u2657', // ♗
  wP: '\u2659', // ♙
  bK: '\u265A', // ♚
  bR: '\u265C', // ♜
  bB: '\u265D', // ♝
  bP: '\u265F', // ♟
};

const COLUMN_LABELS = ['a', 'b', 'c', 'd', 'e'];
const ROW_LABELS = ['1', '2', '3', '4', '5'];

type GameStatus = 'active' | 'completed' | 'expired' | 'abandoned';

interface GameState {
  board: { cells: (string | null)[]; captured: { white: string[]; black: string[] } };
  your_turn: boolean;
  your_symbol: 'w' | 'b';
  status: GameStatus;
  winner_id: string | null;
  turn_deadline: string;
  turn_number: number;
  defender_username: string;
  challenger_username: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function indexToRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
}

function rowColToIndex(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

function isOnBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function getPieceColor(piece: string | null): 'w' | 'b' | null {
  if (!piece) return null;
  return piece.startsWith('w') ? 'w' : 'b';
}

function isOwnPiece(piece: string | null, playerColor: 'w' | 'b'): boolean {
  return getPieceColor(piece) === playerColor;
}

function isEnemyPiece(piece: string | null, playerColor: 'w' | 'b'): boolean {
  const color = getPieceColor(piece);
  return color !== null && color !== playerColor;
}

function getPieceType(piece: string): string {
  return piece.charAt(1);
}

// ─── Move Validation ─────────────────────────────────────────────────────────

function getValidMoves(cells: (string | null)[], fromIndex: number, playerColor: 'w' | 'b'): number[] {
  const piece = cells[fromIndex];
  if (!piece || !isOwnPiece(piece, playerColor)) return [];

  const { row, col } = indexToRowCol(fromIndex);
  const type = getPieceType(piece);
  const moves: number[] = [];

  const addIfValid = (r: number, c: number): boolean => {
    if (!isOnBoard(r, c)) return false;
    const target = cells[rowColToIndex(r, c)];
    if (isOwnPiece(target, playerColor)) return false;
    moves.push(rowColToIndex(r, c));
    return !target; // return true if empty (can continue sliding), false if captured enemy
  };

  switch (type) {
    case 'K': {
      // King: 1 square any direction
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          addIfValid(row + dr, col + dc);
        }
      }
      break;
    }
    case 'R': {
      // Rook: horizontal/vertical sliding
      const directions = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      for (const [dr, dc] of directions) {
        for (let i = 1; i < BOARD_SIZE; i++) {
          if (!addIfValid(row + dr * i, col + dc * i)) break;
        }
      }
      break;
    }
    case 'B': {
      // Bishop: diagonal sliding
      const directions = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
      for (const [dr, dc] of directions) {
        for (let i = 1; i < BOARD_SIZE; i++) {
          if (!addIfValid(row + dr * i, col + dc * i)) break;
        }
      }
      break;
    }
    case 'P': {
      // Pawn: forward 1 if empty, diagonal capture
      const direction = playerColor === 'w' ? 1 : -1;
      const forwardRow = row + direction;

      // Forward
      if (isOnBoard(forwardRow, col)) {
        const forwardIdx = rowColToIndex(forwardRow, col);
        if (!cells[forwardIdx]) {
          moves.push(forwardIdx);
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const captureCol = col + dc;
        if (isOnBoard(forwardRow, captureCol)) {
          const captureIdx = rowColToIndex(forwardRow, captureCol);
          if (isEnemyPiece(cells[captureIdx], playerColor)) {
            moves.push(captureIdx);
          }
        }
      }
      break;
    }
  }

  return moves;
}

function needsPromotion(cells: (string | null)[], fromIndex: number, toIndex: number): boolean {
  const piece = cells[fromIndex];
  if (!piece || getPieceType(piece) !== 'P') return false;
  const { row } = indexToRowCol(toIndex);
  const color = getPieceColor(piece);
  return (color === 'w' && row === BOARD_SIZE - 1) || (color === 'b' && row === 0);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MiniChessScreen({ route, navigation }: MiniChessGameScreenProps) {
  const { gameId, opponentUsername } = route.params;

  // Game state
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [lastMoveFrom, setLastMoveFrom] = useState<number | null>(null);
  const [lastMoveTo, setLastMoveTo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ from: number; to: number } | null>(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Animations
  const resultScale = useRef(new Animated.Value(0)).current;
  const selectedGlow = useRef(new Animated.Value(0)).current;
  const piecePositions = useRef<Record<number, Animated.ValueXY>>({}).current;
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch Game State ──────────────────────────────────────────────────

  const fetchGame = useCallback(async () => {
    try {
      const { data } = await turnGameApi.getGame(gameId);
      const gameData = data?.data ?? data;
      setGame(gameData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Initial load
  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  // Poll every 15s when not your turn
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (game && !game.your_turn && game.status === 'active') {
      pollIntervalRef.current = setInterval(fetchGame, 15000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [game?.your_turn, game?.status, fetchGame]);

  // ─── Turn Timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!game?.turn_deadline || game.status !== 'active') {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const deadline = new Date(game.turn_deadline).getTime();
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes.toString().padStart(2, '0')}m`);
      } else {
        setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
      }
    };

    updateTimer();
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [game?.turn_deadline, game?.status]);

  // ─── Selection Glow Animation ──────────────────────────────────────────

  useEffect(() => {
    if (selectedIndex !== null) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(selectedGlow, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(selectedGlow, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      selectedGlow.stopAnimation();
      selectedGlow.setValue(0);
    }
  }, [selectedIndex, selectedGlow]);

  // ─── Result Animation ─────────────────────────────────────────────────

  useEffect(() => {
    if (game && game.status === 'completed') {
      resultScale.setValue(0);
      Animated.spring(resultScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [game?.status, resultScale]);

  // ─── Board Perspective ─────────────────────────────────────────────────

  const isBlack = game?.your_symbol === 'b';

  const displayCells = useMemo(() => {
    if (!game) return [];
    const cells = [...game.board.cells];
    if (isBlack) {
      // Rotate board 180 degrees for black player
      return cells.reverse();
    }
    // For white, flip rows so row 0 is at bottom
    const flipped: (string | null)[] = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        flipped.push(cells[row * BOARD_SIZE + col]);
      }
    }
    return flipped;
  }, [game, isBlack]);

  // Map display index to board index
  const displayToBoard = useCallback(
    (displayIdx: number): number => {
      if (isBlack) {
        return BOARD_SIZE * BOARD_SIZE - 1 - displayIdx;
      }
      const displayRow = Math.floor(displayIdx / BOARD_SIZE);
      const displayCol = displayIdx % BOARD_SIZE;
      const boardRow = BOARD_SIZE - 1 - displayRow;
      return boardRow * BOARD_SIZE + displayCol;
    },
    [isBlack]
  );

  const boardToDisplay = useCallback(
    (boardIdx: number): number => {
      if (isBlack) {
        return BOARD_SIZE * BOARD_SIZE - 1 - boardIdx;
      }
      const boardRow = Math.floor(boardIdx / BOARD_SIZE);
      const boardCol = boardIdx % BOARD_SIZE;
      const displayRow = BOARD_SIZE - 1 - boardRow;
      return displayRow * BOARD_SIZE + boardCol;
    },
    [isBlack]
  );

  // ─── Cell Tap Handler ─────────────────────────────────────────────────

  const handleCellTap = useCallback(
    (displayIdx: number) => {
      if (!game || game.status !== 'active' || !game.your_turn || isSubmitting) return;

      const boardIdx = displayToBoard(displayIdx);
      const cells = game.board.cells;
      const piece = cells[boardIdx];

      // If we have a selected piece and this is a valid move destination
      if (selectedIndex !== null && validMoves.includes(boardIdx)) {
        // Check for pawn promotion
        if (needsPromotion(cells, selectedIndex, boardIdx)) {
          setPendingMove({ from: selectedIndex, to: boardIdx });
          setShowPromotion(true);
          return;
        }
        executeMove(selectedIndex, boardIdx);
        return;
      }

      // If tapping own piece, select it
      if (piece && isOwnPiece(piece, game.your_symbol)) {
        const moves = getValidMoves(cells, boardIdx, game.your_symbol);
        setSelectedIndex(boardIdx);
        setValidMoves(moves);
        return;
      }

      // Deselect
      setSelectedIndex(null);
      setValidMoves([]);
    },
    [game, selectedIndex, validMoves, isSubmitting, displayToBoard]
  );

  // ─── Execute Move ─────────────────────────────────────────────────────

  const executeMove = useCallback(
    async (from: number, to: number, promotion?: string) => {
      if (!game) return;

      setIsSubmitting(true);
      setSelectedIndex(null);
      setValidMoves([]);
      setShowPromotion(false);
      setPendingMove(null);

      // Track last move for highlighting
      setLastMoveFrom(from);
      setLastMoveTo(to);

      try {
        const movePayload: { from: number; to: number; promotion?: string } = { from, to };
        if (promotion) movePayload.promotion = promotion;

        const { data } = await turnGameApi.makeMove(gameId, movePayload);
        const updatedGame = data?.data ?? data;
        setGame(updatedGame);
      } catch (err: any) {
        Alert.alert('Invalid Move', err.message || 'That move is not allowed.');
        // Refresh game state
        fetchGame();
      } finally {
        setIsSubmitting(false);
      }
    },
    [game, gameId, fetchGame]
  );

  // ─── Promotion Handler ────────────────────────────────────────────────

  const handlePromotion = useCallback(
    (promotionPiece: string) => {
      if (!pendingMove) return;
      executeMove(pendingMove.from, pendingMove.to, promotionPiece);
    },
    [pendingMove, executeMove]
  );

  // ─── Determine Result ─────────────────────────────────────────────────

  const getResult = useCallback((): 'victory' | 'defeated' | 'draw' | null => {
    if (!game || game.status !== 'completed') return null;
    if (!game.winner_id) return 'draw';
    // If you're the defender, check your_symbol. The winner_id tells us who won.
    // We compare: if game ended and winner is determined by the server
    // Since we don't have our own user_id, we check your_symbol context:
    // The server sets winner_id; if your_turn was the last state, you lost (opponent made winning move)
    // But that's unreliable. Better: check if any king is missing from the board.
    // Simplest: the server returns winner_id; we need to compare with our userId.
    // Since we don't have userId in route params, use a heuristic:
    // After the game ends, if it's still "your_turn" you likely lost (opponent's last move won)
    // Actually, the simplest: the server already told us. Let's check the board for kings.
    const cells = game.board.cells;
    const myKing = game.your_symbol + 'K';
    const hasMyKing = cells.includes(myKing);
    if (!hasMyKing) return 'defeated';
    return 'victory';
  }, [game]);

  const result = getResult();

  // ─── Coordinate Labels ────────────────────────────────────────────────

  const getColumnLabel = useCallback(
    (displayCol: number): string => {
      if (isBlack) return COLUMN_LABELS[BOARD_SIZE - 1 - displayCol];
      return COLUMN_LABELS[displayCol];
    },
    [isBlack]
  );

  const getRowLabel = useCallback(
    (displayRow: number): string => {
      if (isBlack) return ROW_LABELS[displayRow];
      return ROW_LABELS[BOARD_SIZE - 1 - displayRow];
    },
    [isBlack]
  );

  // ─── Render: Loading ──────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !game) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color={THEME.danger} />
          <Text style={styles.errorText}>{error || 'Failed to load game'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchGame}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: Captured Pieces ──────────────────────────────────────────

  const renderCapturedPieces = (pieces: string[], color: 'w' | 'b') => {
    if (pieces.length === 0) return null;
    return (
      <View style={styles.capturedRow}>
        {pieces.map((piece, idx) => (
          <Text
            key={`${piece}-${idx}`}
            style={[
              styles.capturedPiece,
              { color: color === 'w' ? COLORS.white : COLORS.black },
            ]}
          >
            {PIECE_SYMBOLS[piece] || piece}
          </Text>
        ))}
      </View>
    );
  };

  // ─── Render: Board Cell ───────────────────────────────────────────────

  const renderCell = (displayIdx: number) => {
    const displayRow = Math.floor(displayIdx / BOARD_SIZE);
    const displayCol = displayIdx % BOARD_SIZE;
    const boardIdx = displayToBoard(displayIdx);
    const piece = displayCells[displayIdx];
    const isLight = (displayRow + displayCol) % 2 === 0;
    const isSelected = selectedIndex === boardIdx;
    const isValidDest = validMoves.includes(boardIdx);
    const isLastFrom = lastMoveFrom === boardIdx;
    const isLastTo = lastMoveTo === boardIdx;
    const pieceColor = getPieceColor(piece);

    return (
      <TouchableOpacity
        key={displayIdx}
        style={[
          styles.cell,
          {
            backgroundColor: isLight ? COLORS.lightSquare : COLORS.darkSquare,
            width: CELL_SIZE,
            height: CELL_SIZE,
          },
          isLastFrom && styles.lastMoveFrom,
          isLastTo && styles.lastMoveTo,
        ]}
        onPress={() => handleCellTap(displayIdx)}
        activeOpacity={0.7}
        disabled={game.status !== 'active' || !game.your_turn || isSubmitting}
      >
        {/* Selected glow */}
        {isSelected && (
          <Animated.View
            style={[
              styles.selectedOverlay,
              {
                borderColor: COLORS.selectedGlow,
                opacity: selectedGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              },
            ]}
          />
        )}

        {/* Valid move indicator */}
        {isValidDest && !piece && (
          <View style={styles.validMoveDot} />
        )}

        {/* Valid capture indicator */}
        {isValidDest && piece && (
          <View style={styles.validCaptureRing} />
        )}

        {/* Piece */}
        {piece && (
          <Text
            style={[
              styles.pieceText,
              {
                color: pieceColor === 'w' ? COLORS.white : COLORS.black,
                textShadowColor:
                  pieceColor === 'w'
                    ? 'rgba(255, 184, 0, 0.5)'
                    : 'rgba(123, 97, 255, 0.5)',
              },
            ]}
          >
            {PIECE_SYMBOLS[piece] || piece}
          </Text>
        )}

        {/* Column label on bottom row */}
        {displayRow === BOARD_SIZE - 1 && (
          <Text
            style={[
              styles.coordLabel,
              styles.colLabel,
              { color: isLight ? COLORS.darkSquare : COLORS.lightSquare },
            ]}
          >
            {getColumnLabel(displayCol)}
          </Text>
        )}

        {/* Row label on right column */}
        {displayCol === BOARD_SIZE - 1 && (
          <Text
            style={[
              styles.coordLabel,
              styles.rowLabel,
              { color: isLight ? COLORS.darkSquare : COLORS.lightSquare },
            ]}
          >
            {getRowLabel(displayRow)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Render: Board ────────────────────────────────────────────────────

  const renderBoard = () => {
    const rows: React.ReactNode[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      const cells: React.ReactNode[] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        cells.push(renderCell(row * BOARD_SIZE + col));
      }
      rows.push(
        <View key={row} style={styles.boardRow}>
          {cells}
        </View>
      );
    }
    return rows;
  };

  // ─── Render: Promotion Dialog ─────────────────────────────────────────

  const renderPromotionDialog = () => {
    if (!showPromotion) return null;

    const color = game.your_symbol;
    const options = [
      { piece: 'R', symbol: PIECE_SYMBOLS[color + 'R'], label: 'Rook' },
      { piece: 'B', symbol: PIECE_SYMBOLS[color + 'B'], label: 'Bishop' },
    ];

    return (
      <View style={styles.promotionOverlay}>
        <View style={styles.promotionDialog}>
          <Text style={styles.promotionTitle}>Promote Pawn</Text>
          <Text style={styles.promotionSubtitle}>Choose a piece</Text>

          <View style={styles.promotionOptions}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.piece}
                style={styles.promotionOption}
                onPress={() => handlePromotion(opt.piece)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.promotionPieceText,
                    { color: color === 'w' ? COLORS.white : COLORS.black },
                  ]}
                >
                  {opt.symbol}
                </Text>
                <Text style={styles.promotionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.promotionCancel}
            onPress={() => {
              setShowPromotion(false);
              setPendingMove(null);
              setSelectedIndex(null);
              setValidMoves([]);
            }}
          >
            <Text style={styles.promotionCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Render: Result Overlay ───────────────────────────────────────────

  const renderResultOverlay = () => {
    if (!result) return null;

    const isVictory = result === 'victory';
    const isDraw = result === 'draw';
    const title = isVictory ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEATED';
    const icon = isVictory ? 'trophy' : isDraw ? 'swap-horizontal' : 'close-circle';
    const color = isVictory ? '#FFB800' : isDraw ? THEME.primary : '#FF4757';

    return (
      <Animated.View
        style={[
          styles.resultOverlay,
          { transform: [{ scale: resultScale }] },
        ]}
      >
        <View style={styles.resultContent}>
          <Ionicons name={icon as any} size={72} color={color} />
          <Text style={[styles.resultTitle, { color }]}>{title}</Text>
          <Text style={styles.resultMessage}>
            {isVictory
              ? 'Territory defended successfully!'
              : isDraw
              ? 'The battle ends in a stalemate.'
              : `${opponentUsername} conquers the territory!`}
          </Text>

          <TouchableOpacity
            style={[styles.resultButton, { backgroundColor: color }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.resultButtonText}>
              {isVictory ? 'Celebrate!' : 'Back to Map'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // ─── Render: Turn Status ──────────────────────────────────────────────

  const renderTurnStatus = () => {
    if (game.status !== 'active') return null;

    const isYourTurn = game.your_turn;

    return (
      <View style={[styles.turnBanner, isYourTurn ? styles.turnBannerYours : styles.turnBannerWaiting]}>
        <View style={styles.turnBannerLeft}>
          <Ionicons
            name={isYourTurn ? 'flash' : 'hourglass-outline'}
            size={18}
            color={isYourTurn ? '#FFB800' : THEME.textSecondary}
          />
          <Text
            style={[
              styles.turnBannerText,
              { color: isYourTurn ? '#FFB800' : THEME.textSecondary },
            ]}
          >
            {isYourTurn ? 'Your Turn' : 'Waiting for opponent...'}
          </Text>
        </View>
        {timeLeft ? (
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={14} color={THEME.textSecondary} />
            <Text style={styles.timerText}>{timeLeft}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────

  // Determine captured pieces display order (opponent on top, you on bottom)
  const topCaptured = isBlack ? game.board.captured.white : game.board.captured.black;
  const bottomCaptured = isBlack ? game.board.captured.black : game.board.captured.white;
  const topCapturedColor: 'w' | 'b' = isBlack ? 'w' : 'b';
  const bottomCapturedColor: 'w' | 'b' = isBlack ? 'b' : 'w';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="shield-half-outline" size={16} color={THEME.primary} />
            <Text style={styles.headerTitle}>Mini Chess</Text>
          </View>
          <Text style={styles.headerSubtitle}>vs {opponentUsername}</Text>
        </View>

        <View style={styles.colorIndicator}>
          <View
            style={[
              styles.colorDot,
              {
                backgroundColor: game.your_symbol === 'w' ? COLORS.white : COLORS.black,
                shadowColor: game.your_symbol === 'w' ? COLORS.white : COLORS.black,
              },
            ]}
          />
          <Text style={styles.colorLabel}>
            {game.your_symbol === 'w' ? 'White' : 'Black'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Turn Status */}
        {renderTurnStatus()}

        {/* Opponent captured pieces (top) */}
        <View style={styles.capturedContainer}>
          <Text style={styles.capturedLabel}>
            {isBlack ? game.defender_username || 'White' : game.challenger_username || 'Black'}
          </Text>
          {renderCapturedPieces(topCaptured, topCapturedColor)}
        </View>

        {/* Chess Board */}
        <View style={styles.boardWrapper}>
          <View style={styles.boardContainer}>
            <View style={styles.board}>{renderBoard()}</View>
          </View>
        </View>

        {/* Your captured pieces (bottom) */}
        <View style={styles.capturedContainer}>
          <Text style={styles.capturedLabel}>You</Text>
          {renderCapturedPieces(bottomCaptured, bottomCapturedColor)}
        </View>

        {/* Game Info */}
        <View style={styles.gameInfo}>
          <View style={styles.gameInfoItem}>
            <Ionicons name="layers-outline" size={16} color={THEME.textSecondary} />
            <Text style={styles.gameInfoText}>Turn {game.turn_number}</Text>
          </View>
          <View style={styles.gameInfoDivider} />
          <View style={styles.gameInfoItem}>
            <Ionicons name="information-circle-outline" size={16} color={THEME.textSecondary} />
            <Text style={styles.gameInfoText}>5x5 Board</Text>
          </View>
          <View style={styles.gameInfoDivider} />
          <View style={styles.gameInfoItem}>
            <Ionicons name="timer-outline" size={16} color={THEME.textSecondary} />
            <Text style={styles.gameInfoText}>4h / turn</Text>
          </View>
        </View>

        {/* Rules */}
        <View style={styles.rulesCard}>
          <View style={styles.rulesHeader}>
            <Ionicons name="book-outline" size={16} color={THEME.primary} />
            <Text style={styles.rulesTitle}>Rules</Text>
          </View>
          <Text style={styles.rulesText}>
            Capture the enemy King to win. Pawns promote to Rook or Bishop on the last rank.
            Each turn has a 4-hour time limit. If time expires, you forfeit.
          </Text>
        </View>
      </ScrollView>

      {/* Submitting overlay */}
      {isSubmitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      )}

      {/* Promotion Dialog */}
      {renderPromotionDialog()}

      {/* Result Overlay */}
      {renderResultOverlay()}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  errorText: {
    color: THEME.danger,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  retryBtnText: {
    color: THEME.bg,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },

  // ─── Header ───────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  colorIndicator: {
    alignItems: 'center',
    gap: 4,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  colorLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ─── Scroll ───────────────────────────────────────────────────────────
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // ─── Turn Status ──────────────────────────────────────────────────────
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  turnBannerYours: {
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderColor: 'rgba(255, 184, 0, 0.25)',
  },
  turnBannerWaiting: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
  },
  turnBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnBannerText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(136, 146, 176, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  timerText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // ─── Captured Pieces ──────────────────────────────────────────────────
  capturedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    minHeight: 32,
    gap: 8,
  },
  capturedLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    minWidth: 40,
  },
  capturedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  capturedPiece: {
    fontSize: 18,
    opacity: 0.7,
  },

  // ─── Board ────────────────────────────────────────────────────────────
  boardWrapper: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  boardContainer: {
    borderRadius: RADIUS.md,
    borderWidth: 3,
    borderColor: COLORS.boardEdge,
    backgroundColor: COLORS.boardBorder,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  board: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  boardRow: {
    flexDirection: 'row',
  },

  // ─── Cell ─────────────────────────────────────────────────────────────
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lastMoveFrom: {
    backgroundColor: COLORS.lastMoveFrom,
  },
  lastMoveTo: {
    backgroundColor: COLORS.lastMoveTo,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    borderColor: COLORS.selectedGlow,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
  },
  validMoveDot: {
    width: CELL_SIZE * 0.28,
    height: CELL_SIZE * 0.28,
    borderRadius: CELL_SIZE * 0.14,
    backgroundColor: COLORS.validMove,
    opacity: 0.55,
  },
  validCaptureRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: COLORS.validMove,
    borderRadius: 2,
    opacity: 0.5,
  },
  pieceText: {
    fontSize: 32,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  coordLabel: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '700',
    opacity: 0.6,
  },
  colLabel: {
    bottom: 2,
    left: 3,
  },
  rowLabel: {
    top: 2,
    right: 3,
  },

  // ─── Game Info ────────────────────────────────────────────────────────
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginHorizontal: 20,
    gap: SPACING.md,
  },
  gameInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gameInfoText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  gameInfoDivider: {
    width: 1,
    height: 14,
    backgroundColor: THEME.border,
  },

  // ─── Rules ────────────────────────────────────────────────────────────
  rulesCard: {
    marginTop: SPACING.lg,
    marginHorizontal: 20,
    padding: SPACING.lg,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    gap: SPACING.sm,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rulesTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  rulesText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },

  // ─── Promotion Dialog ─────────────────────────────────────────────────
  promotionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 23, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  promotionDialog: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    width: 260,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 16,
  },
  promotionTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  promotionSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginTop: -SPACING.sm,
  },
  promotionOptions: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  promotionOption: {
    width: 90,
    height: 100,
    borderRadius: RADIUS.lg,
    backgroundColor: THEME.bg,
    borderWidth: 2,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  promotionPieceText: {
    fontSize: 40,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  promotionLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promotionCancel: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  promotionCancelText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },

  // ─── Result Overlay ───────────────────────────────────────────────────
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  resultContent: {
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: 40,
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
  },
  resultMessage: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  resultButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  resultButtonText: {
    color: THEME.bg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },

  // ─── Submitting Overlay ───────────────────────────────────────────────
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 23, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
});

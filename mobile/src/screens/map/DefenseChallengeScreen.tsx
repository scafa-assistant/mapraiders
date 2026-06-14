import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { defenseApi, turnGameApi } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { DefenseChallengeScreenProps } from '../../navigation/types';
import { strings as S, t } from '../../i18n';

type RpsChoice = 'rock' | 'scissors' | 'paper';
type CoinSide = 'heads' | 'tails';
type ChallengeResult = 'win' | 'lose' | 'draw' | null;

// ─── Component ──────────────────────────────────────────────────────────────

export default function DefenseChallengeScreen({ route, navigation }: DefenseChallengeScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { defenseId, territoryId, gameType, config, ownerUsername } = route.params;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ChallengeResult>(null);
  const [resultMessage, setResultMessage] = useState('');

  // RPS state
  const [rpsChoice, setRpsChoice] = useState<RpsChoice | null>(null);
  const rpsScaleRock = useRef(new Animated.Value(1)).current;
  const rpsScaleScissors = useRef(new Animated.Value(1)).current;
  const rpsScalePaper = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  // Sprint state
  const [isRacing, setIsRacing] = useState(false);
  const [raceTime, setRaceTime] = useState(0);
  const [raceDistance, setRaceDistance] = useState(0);
  const raceSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastRaceLocation = useRef<{ latitude: number; longitude: number } | null>(null);
  const raceStartTime = useRef<number>(0);
  const raceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Trivia state
  const [triviaAnswer, setTriviaAnswer] = useState('');

  // Coin Flip state
  const [coinChoice, setCoinChoice] = useState<CoinSide | null>(null);
  const coinScaleHeads = useRef(new Animated.Value(1)).current;
  const coinScaleTails = useRef(new Animated.Value(1)).current;

  // Odd/Even state
  const [oeFingers, setOeFingers] = useState<number>(3);

  // Turn-game redirect: if this is a turn-based game, create the game and redirect
  useEffect(() => {
    if (gameType === 'tic_tac_toe' || gameType === 'mini_chess') {
      const startTurnGame = async () => {
        try {
          setIsSubmitting(true);
          const { data } = await defenseApi.submitChallenge(defenseId, {});
          const res = data?.data ?? data;
          if (res.game_id) {
            const screenName = gameType === 'tic_tac_toe' ? 'TicTacToeGame' : 'MiniChessGame';
            navigation.replace(screenName as any, {
              gameId: res.game_id,
              territoryId,
              opponentUsername: ownerUsername,
            });
          }
        } catch (err: any) {
          Alert.alert(S.common.error, err.message || S.map.defenseChallenge.gameStartFailed);
          navigation.goBack();
        }
      };
      startTurnGame();
    }
  }, [gameType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      raceSubscription.current?.remove();
      if (raceTimerRef.current) clearInterval(raceTimerRef.current);
    };
  }, []);

  // ─── Result Animation ─────────────────────────────────────────────────

  const showResult = (outcome: ChallengeResult, message: string) => {
    setResult(outcome);
    setResultMessage(message);
    resultScale.setValue(0);
    Animated.spring(resultScale, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  // ─── RPS Logic ────────────────────────────────────────────────────────

  const animateRpsChoice = (choice: RpsChoice) => {
    const scaleMap: Record<RpsChoice, Animated.Value> = {
      rock: rpsScaleRock,
      scissors: rpsScaleScissors,
      paper: rpsScalePaper,
    };
    Object.values(scaleMap).forEach((v) => v.setValue(1));
    Animated.sequence([
      Animated.spring(scaleMap[choice], {
        toValue: 1.15,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(scaleMap[choice], {
        toValue: 1.05,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
    setRpsChoice(choice);
  };

  const submitRps = async (choice: RpsChoice) => {
    setIsSubmitting(true);
    try {
      const { data } = await defenseApi.submitChallenge(defenseId, {
        move: choice,
      });
      const res = data?.data ?? data;
      if (res.result === 'win') {
        showResult('win', S.map.defenseChallenge.rpsWin);
      } else if (res.result === 'lose') {
        showResult('lose', t(S.map.defenseChallenge.rpsLose, { username: ownerUsername }));
      } else {
        // Draw — reset for retry
        showResult('draw', S.map.defenseChallenge.rpsDraw);
        setTimeout(() => {
          setResult(null);
          setRpsChoice(null);
          // reset scales
          rpsScaleRock.setValue(1);
          rpsScaleScissors.setValue(1);
          rpsScalePaper.setValue(1);
        }, 1500);
      }
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.map.defenseChallenge.submitChallengeFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Sprint Logic ─────────────────────────────────────────────────────

  const targetDistance = config?.distance || 200;
  const ownerTime = config?.benchmark_time ?? config?.time_seconds ?? 0;

  const startRace = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(S.map.defenseChallenge.permissionDeniedTitle, S.map.defenseChallenge.gpsNeededRace);
      return;
    }

    setIsRacing(true);
    setRaceDistance(0);
    setRaceTime(0);
    lastRaceLocation.current = null;
    raceStartTime.current = Date.now();

    // Timer update every second
    raceTimerRef.current = setInterval(() => {
      setRaceTime(Math.round((Date.now() - raceStartTime.current) / 1000));
    }, 1000);

    let totalDist = 0;

    raceSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 3,
        timeInterval: 1000,
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        if (lastRaceLocation.current) {
          const dist = haversine(
            lastRaceLocation.current.latitude,
            lastRaceLocation.current.longitude,
            latitude,
            longitude
          );
          totalDist += dist;
          setRaceDistance(totalDist);

          if (totalDist >= targetDistance) {
            const finalTime = Math.round((Date.now() - raceStartTime.current) / 1000);
            setRaceTime(finalTime);
            finishRace(finalTime);
          }
        }
        lastRaceLocation.current = { latitude, longitude };
      }
    );
  };

  const finishRace = async (finalTime: number) => {
    setIsRacing(false);
    raceSubscription.current?.remove();
    raceSubscription.current = null;
    if (raceTimerRef.current) {
      clearInterval(raceTimerRef.current);
      raceTimerRef.current = null;
    }

    setIsSubmitting(true);
    try {
      const { data } = await defenseApi.submitChallenge(defenseId, {
        time_seconds: finalTime,
      });
      const res = data?.data ?? data;
      if (res.result === 'win') {
        showResult('win', t(S.map.defenseChallenge.sprintWin, { time: finalTime, ownerTime }));
      } else {
        showResult('lose', t(S.map.defenseChallenge.sprintLose, { time: finalTime, ownerTime }));
      }
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.map.defenseChallenge.raceSubmitFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Trivia Logic ─────────────────────────────────────────────────────

  const submitTrivia = async () => {
    if (!triviaAnswer.trim()) {
      Alert.alert(S.map.defenseChallenge.enterAnswerTitle, S.map.defenseChallenge.enterAnswerMsg);
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await defenseApi.submitChallenge(defenseId, {
        answer: triviaAnswer.trim(),
      });
      const res = data?.data ?? data;
      if (res.result === 'win') {
        showResult('win', S.map.defenseChallenge.triviaWin);
      } else {
        showResult('lose', S.map.defenseChallenge.triviaLose);
      }
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.map.defenseChallenge.answerSubmitFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Coin Flip Logic ──────────────────────────────────────────────────

  const animateCoinChoice = (side: CoinSide) => {
    const scales = { heads: coinScaleHeads, tails: coinScaleTails };
    Object.values(scales).forEach((v) => v.setValue(1));
    Animated.spring(scales[side], { toValue: 1.15, friction: 3, useNativeDriver: true }).start();
    setCoinChoice(side);
  };

  const submitCoinFlip = async (side: CoinSide) => {
    setIsSubmitting(true);
    try {
      const { data } = await defenseApi.submitChallenge(defenseId, { flip_result: side });
      const res = data?.data ?? data;
      if (res.result === 'won') {
        showResult('win', S.map.defenseChallenge.coinWin);
      } else {
        showResult('lose', t(S.map.defenseChallenge.coinLose, { username: ownerUsername }));
      }
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.map.defenseChallenge.coinFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Odd/Even Logic ──────────────────────────────────────────────────

  const submitOddEven = async () => {
    setIsSubmitting(true);
    try {
      const { data } = await defenseApi.submitChallenge(defenseId, { fingers: oeFingers });
      const res = data?.data ?? data;
      if (res.result === 'won') {
        showResult('win', S.map.defenseChallenge.oddEvenWin);
      } else {
        showResult('lose', t(S.map.defenseChallenge.oddEvenLose, { username: ownerUsername }));
      }
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.map.defenseChallenge.oddEvenFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Game Type Labels & Colors ────────────────────────────────────────

  const gameLabels: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    rock_paper_scissors: { label: S.map.defenseChallenge.gameRps, icon: 'hand-left-outline', color: '#1558F0' },
    sprint_race: { label: S.map.defenseChallenge.gameSprintRace, icon: 'speedometer-outline', color: '#1B9E5A' },
    trivia: { label: S.map.defenseChallenge.gameTrivia, icon: 'help-circle-outline', color: '#1558F0' },
    coin_flip: { label: S.map.defenseChallenge.gameCoinFlip, icon: 'ellipse-outline', color: '#F5A623' },
    odd_even: { label: S.map.defenseChallenge.gameOddEven, icon: 'finger-print-outline', color: '#0E9CB0' },
    tic_tac_toe: { label: S.map.defenseChallenge.gameTicTacToe, icon: 'grid-outline', color: '#1558F0' },
    mini_chess: { label: S.map.defenseChallenge.gameMiniChess, icon: 'trophy-outline', color: '#F5A623' },
  };

  const gameInfo = gameLabels[gameType] || gameLabels.trivia;

  // ─── Render: Result Overlay ───────────────────────────────────────────

  const renderResultOverlay = () => {
    if (!result || result === 'draw') {
      // Draw is temporary, show inline
      if (result === 'draw') {
        return (
          <Animated.View
            style={[
              styles.resultOverlay,
              styles.resultDraw,
              { transform: [{ scale: resultScale }] },
            ]}
          >
            <Ionicons name="swap-horizontal" size={48} color={theme.warning} />
            <Text style={styles.resultDrawText}>{resultMessage}</Text>
          </Animated.View>
        );
      }
      return null;
    }

    const isWin = result === 'win';

    return (
      <Animated.View
        style={[
          styles.resultOverlay,
          isWin ? styles.resultWin : styles.resultLose,
          { transform: [{ scale: resultScale }] },
        ]}
      >
        <Ionicons
          name={isWin ? 'trophy' : 'close-circle'}
          size={64}
          color={isWin ? theme.warning : theme.danger}
        />
        <Text style={[styles.resultTitle, { color: isWin ? theme.warning : theme.danger }]}>
          {isWin ? S.map.defenseChallenge.victory : S.map.defenseChallenge.defeated}
        </Text>
        <Text style={styles.resultMsg}>{resultMessage}</Text>
        {isWin ? (
          <Text style={styles.resultSubtext}>{S.map.defenseChallenge.territoryConquered}</Text>
        ) : (
          <Text style={styles.resultSubtext}>{S.map.defenseChallenge.tryAgainCooldown}</Text>
        )}
        <TouchableOpacity
          style={[styles.resultBtn, { backgroundColor: isWin ? theme.warning : theme.danger }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.resultBtnText}>{isWin ? S.map.defenseChallenge.celebrate : S.common.back}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ─── Render: RPS Game ─────────────────────────────────────────────────

  const renderRpsGame = () => {
    const moves: { choice: RpsChoice; emoji: string; label: string; color: string; scale: Animated.Value }[] = [
      { choice: 'rock', emoji: '🪨', label: S.map.defenseChallenge.rock, color: '#7A7470', scale: rpsScaleRock },
      { choice: 'scissors', emoji: '✂️', label: S.map.defenseChallenge.scissors, color: '#D7263D', scale: rpsScaleScissors },
      { choice: 'paper', emoji: '📄', label: S.map.defenseChallenge.paper, color: '#1558F0', scale: rpsScalePaper },
    ];

    return (
      <View style={styles.gameArea}>
        <Text style={styles.gameInstruction}>{S.map.defenseChallenge.chooseYourMove}</Text>
        {config?.rounds === 3 && (
          <Text style={styles.gameSubInstruction}>{S.map.defenseChallenge.bestOf3Rounds}</Text>
        )}

        <View style={styles.rpsRow}>
          {moves.map((m) => (
            <Animated.View key={m.choice} style={{ transform: [{ scale: m.scale }] }}>
              <TouchableOpacity
                style={[
                  styles.rpsButton,
                  { borderColor: rpsChoice === m.choice ? m.color : theme.border },
                  rpsChoice === m.choice && { backgroundColor: `${m.color}15` },
                ]}
                onPress={() => {
                  if (!isSubmitting && result !== 'win' && result !== 'lose') {
                    animateRpsChoice(m.choice);
                  }
                }}
                activeOpacity={0.7}
                disabled={isSubmitting || result === 'win' || result === 'lose'}
              >
                <Text style={styles.rpsEmoji}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.rpsLabel,
                    rpsChoice === m.choice && { color: m.color },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {rpsChoice && result !== 'win' && result !== 'lose' && (
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.5 }]}
            onPress={() => submitRps(rpsChoice)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>{S.map.defenseChallenge.throwBtn}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ─── Render: Sprint Game ──────────────────────────────────────────────

  const renderSprintGame = () => {
    const progress = targetDistance > 0 ? Math.min(raceDistance / targetDistance, 1) : 0;

    return (
      <View style={styles.gameArea}>
        <View style={styles.sprintInfoCard}>
          <Ionicons name="trophy-outline" size={20} color={theme.warning} />
          <Text style={styles.sprintInfoText}>
            {t(S.map.defenseChallenge.sprintBeatPrefix, { username: ownerUsername })}{' '}
            <Text style={styles.sprintInfoHighlight}>{ownerTime}s</Text> {S.map.defenseChallenge.sprintOverWord}{' '}
            <Text style={styles.sprintInfoHighlight}>{targetDistance}m</Text>
          </Text>
        </View>

        {!isRacing && raceTime === 0 && result === null && (
          <TouchableOpacity style={styles.startRaceBtn} onPress={startRace}>
            <Ionicons name="play" size={32} color="#FFFFFF" />
            <Text style={styles.startRaceText}>{S.map.defenseChallenge.startBtn}</Text>
          </TouchableOpacity>
        )}

        {isRacing && (
          <View style={styles.raceLive}>
            <View style={styles.raceTimerContainer}>
              <Ionicons name="time-outline" size={28} color={theme.danger} />
              <Text style={styles.raceTimerText}>{raceTime}s</Text>
            </View>

            <View style={styles.raceProgressBg}>
              <View style={[styles.raceProgressFill, { width: `${progress * 100}%` }]} />
            </View>

            <Text style={styles.raceProgressText}>
              {Math.round(raceDistance)}m / {targetDistance}m
            </Text>

            <Text style={styles.raceHint}>{S.map.defenseChallenge.keepRunning}</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Render: Trivia Game ──────────────────────────────────────────────

  const renderTriviaGame = () => (
    <View style={styles.gameArea}>
      <View style={styles.triviaQuestionCard}>
        <Ionicons name="help-circle" size={28} color={theme.primary} />
        <Text style={styles.triviaQuestionText}>{config?.question || S.map.defenseChallenge.noQuestion}</Text>
      </View>

      {result !== 'win' && result !== 'lose' && (
        <>
          <TextInput
            style={styles.triviaInput}
            placeholder={S.map.defenseChallenge.answerPlaceholder}
            placeholderTextColor={theme.textSecondary}
            value={triviaAnswer}
            onChangeText={setTriviaAnswer}
            maxLength={100}
            editable={!isSubmitting}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!triviaAnswer.trim() || isSubmitting) && { opacity: 0.5 }]}
            onPress={submitTrivia}
            disabled={!triviaAnswer.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>{S.map.defenseChallenge.submitBtn}</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // ─── Render: Coin Flip Game ──────────────────────────────────────────

  const renderCoinFlipGame = () => {
    const sides: { side: CoinSide; emoji: string; label: string }[] = [
      { side: 'heads', emoji: '👑', label: S.map.defenseChallenge.heads },
      { side: 'tails', emoji: '🔢', label: S.map.defenseChallenge.tails },
    ];

    return (
      <View style={styles.gameArea}>
        <Text style={styles.gameInstruction}>{S.map.defenseChallenge.coinFlipInstruction}</Text>
        <Text style={styles.gameSubInstruction}>{S.map.defenseChallenge.coinFlipSub}</Text>

        <View style={styles.rpsRow}>
          {sides.map((s) => (
            <Animated.View
              key={s.side}
              style={{ transform: [{ scale: s.side === 'heads' ? coinScaleHeads : coinScaleTails }] }}
            >
              <TouchableOpacity
                style={[
                  styles.rpsButton,
                  { width: 130, height: 130 },
                  { borderColor: coinChoice === s.side ? '#F5A623' : theme.border },
                  coinChoice === s.side && { backgroundColor: 'rgba(245,166,35,0.15)' },
                ]}
                onPress={() => {
                  if (!isSubmitting && result !== 'win' && result !== 'lose') {
                    animateCoinChoice(s.side);
                  }
                }}
                disabled={isSubmitting || result === 'win' || result === 'lose'}
                activeOpacity={0.7}
              >
                <Text style={[styles.rpsEmoji, { fontSize: 44 }]}>{s.emoji}</Text>
                <Text style={[styles.rpsLabel, coinChoice === s.side && { color: '#F5A623' }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {coinChoice && result !== 'win' && result !== 'lose' && (
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.5 }]}
            onPress={() => submitCoinFlip(coinChoice)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>{S.map.defenseChallenge.flipBtn}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ─── Render: Odd/Even Game ─────────────────────────────────────────

  const renderOddEvenGame = () => (
    <View style={styles.gameArea}>
      <Text style={styles.gameInstruction}>{S.map.defenseChallenge.oddEvenInstruction}</Text>
      <Text style={styles.gameSubInstruction}>{S.map.defenseChallenge.oddEvenSub}</Text>

      <View style={[styles.rpsRow, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              styles.rpsButton,
              { width: 80, height: 90 },
              { borderColor: oeFingers === n ? '#0E9CB0' : theme.border },
              oeFingers === n && { backgroundColor: 'rgba(14, 156, 176, 0.15)' },
            ]}
            onPress={() => {
              if (!isSubmitting && result !== 'win' && result !== 'lose') setOeFingers(n);
            }}
            disabled={isSubmitting || result === 'win' || result === 'lose'}
            activeOpacity={0.7}
          >
            <Text style={[styles.rpsEmoji, { fontSize: 28 }]}>{'✋'.repeat(0)}{n}</Text>
            <Text style={[styles.rpsLabel, oeFingers === n && { color: '#0E9CB0' }]}>
              {n === 1 ? '☝️' : n === 2 ? '✌️' : n === 3 ? '🤟' : n === 4 ? '🖖' : '🖐️'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {result !== 'win' && result !== 'lose' && (
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && { opacity: 0.5 }]}
          onPress={submitOddEven}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="hand-left" size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>{S.map.defenseChallenge.showBtn}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Render: Turn Game Loading ─────────────────────────────────────

  const renderTurnGameLoading = () => (
    <View style={styles.gameArea}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={styles.gameInstruction}>{S.map.defenseChallenge.startingGame}</Text>
    </View>
  );

  // ─── Main Render ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerGameBadge, { backgroundColor: `${gameInfo.color}20` }]}>
            <Ionicons name={gameInfo.icon} size={16} color={gameInfo.color} />
            <Text style={[styles.headerGameLabel, { color: gameInfo.color }]}>{gameInfo.label}</Text>
          </View>
          <Text style={styles.headerOwner}>{t(S.map.defenseChallenge.vsUsername, { username: ownerUsername })}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Game Area */}
        {gameType === 'rock_paper_scissors' && renderRpsGame()}
        {gameType === 'sprint_race' && renderSprintGame()}
        {gameType === 'trivia' && renderTriviaGame()}
        {gameType === 'coin_flip' && renderCoinFlipGame()}
        {gameType === 'odd_even' && renderOddEvenGame()}
        {(gameType === 'tic_tac_toe' || gameType === 'mini_chess') && renderTurnGameLoading()}

        {/* Result Overlay */}
        {renderResultOverlay()}
      </View>
    </SafeAreaView>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
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
  },
  headerGameLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  headerOwner: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // ─── Game Area ──────────────────────────────────────────────────────
  gameArea: {
    alignItems: 'center',
    gap: SPACING.xl,
  },
  gameInstruction: {
    color: theme.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  gameSubInstruction: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginTop: -SPACING.md,
  },

  // ─── RPS ────────────────────────────────────────────────────────────
  rpsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  rpsButton: {
    width: 100,
    height: 110,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rpsEmoji: {
    fontSize: 36,
  },
  rpsLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },

  // ─── Submit Button ──────────────────────────────────────────────────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.warning,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: 40,
    gap: 10,
    shadowColor: theme.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 2,
  },

  // ─── Sprint ─────────────────────────────────────────────────────────
  sprintInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: theme.border,
    width: '100%',
  },
  sprintInfoText: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  sprintInfoHighlight: {
    color: theme.warning,
    fontWeight: '800',
  },
  startRaceBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  startRaceText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginTop: 4,
  },
  raceLive: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  raceTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  raceTimerText: {
    color: theme.danger,
    fontSize: 48,
    fontWeight: '800',
  },
  raceProgressBg: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  raceProgressFill: {
    height: '100%',
    borderRadius: 7,
    backgroundColor: theme.accent,
  },
  raceProgressText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  raceHint: {
    color: theme.accent,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },

  // ─── Trivia ─────────────────────────────────────────────────────────
  triviaQuestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(21,88,240,0.2)',
    width: '100%',
  },
  triviaQuestionText: {
    flex: 1,
    color: theme.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    lineHeight: 26,
  },
  triviaInput: {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: SPACING.lg,
    color: theme.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ─── Result Overlay ─────────────────────────────────────────────────
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: SPACING.lg,
  },
  resultWin: {
    backgroundColor: 'rgba(246,244,241,0.95)',
  },
  resultLose: {
    backgroundColor: 'rgba(246,244,241,0.95)',
  },
  resultDraw: {
    backgroundColor: 'rgba(246,244,241,0.85)',
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
  },
  resultMsg: {
    color: theme.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultSubtext: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  resultDrawText: {
    color: theme.warning,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },
  resultBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
});

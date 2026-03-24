import React, { useState, useRef, useEffect } from 'react';
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
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { DefenseChallengeScreenProps } from '../../navigation/types';

type RpsChoice = 'rock' | 'scissors' | 'paper';
type CoinSide = 'heads' | 'tails';
type ChallengeResult = 'win' | 'lose' | 'draw' | null;

// ─── Component ──────────────────────────────────────────────────────────────

export default function DefenseChallengeScreen({ route, navigation }: DefenseChallengeScreenProps) {
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
          Alert.alert('Fehler', err.message || 'Spiel konnte nicht gestartet werden.');
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
        showResult('win', 'You won! Territory conquered!');
      } else if (res.result === 'lose') {
        showResult('lose', `You lost! ${ownerUsername}'s defense holds.`);
      } else {
        // Draw — reset for retry
        showResult('draw', 'Draw! Pick again!');
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
      Alert.alert('Error', err.message || 'Failed to submit challenge.');
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
      Alert.alert('Permission Denied', 'GPS permission is needed for the sprint race.');
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
        showResult('win', `You won! ${finalTime}s vs ${ownerTime}s`);
      } else {
        showResult('lose', `You lost! ${finalTime}s vs ${ownerTime}s`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit race result.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Trivia Logic ─────────────────────────────────────────────────────

  const submitTrivia = async () => {
    if (!triviaAnswer.trim()) {
      Alert.alert('Enter Answer', 'Type your answer before submitting.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await defenseApi.submitChallenge(defenseId, {
        answer: triviaAnswer.trim(),
      });
      const res = data?.data ?? data;
      if (res.result === 'win') {
        showResult('win', 'Correct! Territory conquered!');
      } else {
        showResult('lose', 'Wrong answer! Defense holds.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit answer.');
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
        showResult('win', 'Münzwurf gewonnen! Territorium erobert!');
      } else {
        showResult('lose', `Falsch! ${ownerUsername} hat richtig gewettet.`);
      }
    } catch (err: any) {
      Alert.alert('Fehler', err.message || 'Münzwurf fehlgeschlagen.');
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
        showResult('win', 'Finger-Poker gewonnen! Territorium deins!');
      } else {
        showResult('lose', `Verteidigung hält! ${ownerUsername} lag richtig.`);
      }
    } catch (err: any) {
      Alert.alert('Fehler', err.message || 'Finger-Poker fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Game Type Labels & Colors ────────────────────────────────────────

  const gameLabels: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    rock_paper_scissors: { label: 'Schnick Schnack Schnuck', icon: 'hand-left-outline', color: '#7B61FF' },
    sprint_race: { label: 'Sprint Race', icon: 'speedometer-outline', color: '#00FF88' },
    trivia: { label: 'Trivia', icon: 'help-circle-outline', color: '#00D4FF' },
    coin_flip: { label: 'Münzwurf', icon: 'ellipse-outline', color: '#FFB800' },
    odd_even: { label: 'Gerade/Ungerade', icon: 'finger-print-outline', color: '#FF69B4' },
    tic_tac_toe: { label: 'Tic Tac Toe', icon: 'grid-outline', color: '#00D4FF' },
    mini_chess: { label: 'Mini-Schach', icon: 'trophy-outline', color: '#FFB800' },
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
            <Ionicons name="swap-horizontal" size={48} color="#FFB800" />
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
          color={isWin ? '#FFB800' : '#FF4757'}
        />
        <Text style={[styles.resultTitle, { color: isWin ? '#FFB800' : '#FF4757' }]}>
          {isWin ? 'VICTORY!' : 'DEFEATED'}
        </Text>
        <Text style={styles.resultMsg}>{resultMessage}</Text>
        {isWin ? (
          <Text style={styles.resultSubtext}>Territory conquered!</Text>
        ) : (
          <Text style={styles.resultSubtext}>Try again (10min cooldown)</Text>
        )}
        <TouchableOpacity
          style={[styles.resultBtn, { backgroundColor: isWin ? '#FFB800' : '#FF4757' }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.resultBtnText}>{isWin ? 'Celebrate!' : 'Back'}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ─── Render: RPS Game ─────────────────────────────────────────────────

  const renderRpsGame = () => {
    const moves: { choice: RpsChoice; emoji: string; label: string; color: string; scale: Animated.Value }[] = [
      { choice: 'rock', emoji: '🪨', label: 'Rock', color: '#8892B0', scale: rpsScaleRock },
      { choice: 'scissors', emoji: '✂️', label: 'Scissors', color: '#FF4757', scale: rpsScaleScissors },
      { choice: 'paper', emoji: '📄', label: 'Paper', color: '#00D4FF', scale: rpsScalePaper },
    ];

    return (
      <View style={styles.gameArea}>
        <Text style={styles.gameInstruction}>Choose your move!</Text>
        {config?.rounds === 3 && (
          <Text style={styles.gameSubInstruction}>Best of 3 rounds</Text>
        )}

        <View style={styles.rpsRow}>
          {moves.map((m) => (
            <Animated.View key={m.choice} style={{ transform: [{ scale: m.scale }] }}>
              <TouchableOpacity
                style={[
                  styles.rpsButton,
                  { borderColor: rpsChoice === m.choice ? m.color : THEME.border },
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
              <ActivityIndicator size="small" color="#0A0E17" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#0A0E17" />
                <Text style={styles.submitBtnText}>THROW!</Text>
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
          <Ionicons name="trophy-outline" size={20} color="#FFB800" />
          <Text style={styles.sprintInfoText}>
            Beat {ownerUsername}'s time: <Text style={styles.sprintInfoHighlight}>{ownerTime}s</Text> over{' '}
            <Text style={styles.sprintInfoHighlight}>{targetDistance}m</Text>
          </Text>
        </View>

        {!isRacing && raceTime === 0 && result === null && (
          <TouchableOpacity style={styles.startRaceBtn} onPress={startRace}>
            <Ionicons name="play" size={32} color="#0A0E17" />
            <Text style={styles.startRaceText}>START</Text>
          </TouchableOpacity>
        )}

        {isRacing && (
          <View style={styles.raceLive}>
            <View style={styles.raceTimerContainer}>
              <Ionicons name="time-outline" size={28} color="#FF4757" />
              <Text style={styles.raceTimerText}>{raceTime}s</Text>
            </View>

            <View style={styles.raceProgressBg}>
              <View style={[styles.raceProgressFill, { width: `${progress * 100}%` }]} />
            </View>

            <Text style={styles.raceProgressText}>
              {Math.round(raceDistance)}m / {targetDistance}m
            </Text>

            <Text style={styles.raceHint}>Keep running!</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Render: Trivia Game ──────────────────────────────────────────────

  const renderTriviaGame = () => (
    <View style={styles.gameArea}>
      <View style={styles.triviaQuestionCard}>
        <Ionicons name="help-circle" size={28} color="#00D4FF" />
        <Text style={styles.triviaQuestionText}>{config?.question || 'No question provided'}</Text>
      </View>

      {result !== 'win' && result !== 'lose' && (
        <>
          <TextInput
            style={styles.triviaInput}
            placeholder="Type your answer..."
            placeholderTextColor={THEME.textSecondary}
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
              <ActivityIndicator size="small" color="#0A0E17" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#0A0E17" />
                <Text style={styles.submitBtnText}>SUBMIT</Text>
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
      { side: 'heads', emoji: '👑', label: 'Kopf' },
      { side: 'tails', emoji: '🔢', label: 'Zahl' },
    ];

    return (
      <View style={styles.gameArea}>
        <Text style={styles.gameInstruction}>Wirf die Münze!</Text>
        <Text style={styles.gameSubInstruction}>Wähle das Ergebnis deines Wurfs</Text>

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
                  { borderColor: coinChoice === s.side ? '#FFB800' : THEME.border },
                  coinChoice === s.side && { backgroundColor: 'rgba(255, 184, 0, 0.15)' },
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
                <Text style={[styles.rpsLabel, coinChoice === s.side && { color: '#FFB800' }]}>
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
              <ActivityIndicator size="small" color="#0A0E17" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#0A0E17" />
                <Text style={styles.submitBtnText}>WERFEN!</Text>
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
      <Text style={styles.gameInstruction}>Zeig deine Finger!</Text>
      <Text style={styles.gameSubInstruction}>Wähle 1-5 Finger. Die Summe entscheidet!</Text>

      <View style={[styles.rpsRow, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              styles.rpsButton,
              { width: 80, height: 90 },
              { borderColor: oeFingers === n ? '#FF69B4' : THEME.border },
              oeFingers === n && { backgroundColor: 'rgba(255, 105, 180, 0.15)' },
            ]}
            onPress={() => {
              if (!isSubmitting && result !== 'win' && result !== 'lose') setOeFingers(n);
            }}
            disabled={isSubmitting || result === 'win' || result === 'lose'}
            activeOpacity={0.7}
          >
            <Text style={[styles.rpsEmoji, { fontSize: 28 }]}>{'✋'.repeat(0)}{n}</Text>
            <Text style={[styles.rpsLabel, oeFingers === n && { color: '#FF69B4' }]}>
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
            <ActivityIndicator size="small" color="#0A0E17" />
          ) : (
            <>
              <Ionicons name="hand-left" size={20} color="#0A0E17" />
              <Text style={styles.submitBtnText}>ZEIGEN!</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Render: Turn Game Loading ─────────────────────────────────────

  const renderTurnGameLoading = () => (
    <View style={styles.gameArea}>
      <ActivityIndicator size="large" color={THEME.primary} />
      <Text style={styles.gameInstruction}>Spiel wird gestartet...</Text>
    </View>
  );

  // ─── Main Render ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerGameBadge, { backgroundColor: `${gameInfo.color}20` }]}>
            <Ionicons name={gameInfo.icon} size={16} color={gameInfo.color} />
            <Text style={[styles.headerGameLabel, { color: gameInfo.color }]}>{gameInfo.label}</Text>
          </View>
          <Text style={styles.headerOwner}>vs {ownerUsername}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
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
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
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
    color: THEME.textSecondary,
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
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  gameSubInstruction: {
    color: THEME.textSecondary,
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
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rpsEmoji: {
    fontSize: 36,
  },
  rpsLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },

  // ─── Submit Button ──────────────────────────────────────────────────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB800',
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: 40,
    gap: 10,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: {
    color: '#0A0E17',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 2,
  },

  // ─── Sprint ─────────────────────────────────────────────────────────
  sprintInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    width: '100%',
  },
  sprintInfoText: {
    flex: 1,
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  sprintInfoHighlight: {
    color: '#FFB800',
    fontWeight: '800',
  },
  startRaceBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#00FF88',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  startRaceText: {
    color: '#0A0E17',
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
    color: '#FF4757',
    fontSize: 48,
    fontWeight: '800',
  },
  raceProgressBg: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  raceProgressFill: {
    height: '100%',
    borderRadius: 7,
    backgroundColor: '#00FF88',
  },
  raceProgressText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  raceHint: {
    color: '#00FF88',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },

  // ─── Trivia ─────────────────────────────────────────────────────────
  triviaQuestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    width: '100%',
  },
  triviaQuestionText: {
    flex: 1,
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    lineHeight: 26,
  },
  triviaInput: {
    width: '100%',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: SPACING.lg,
    color: THEME.text,
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
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
  },
  resultLose: {
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
  },
  resultDraw: {
    backgroundColor: 'rgba(10, 14, 23, 0.85)',
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
  },
  resultMsg: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultSubtext: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  resultDrawText: {
    color: '#FFB800',
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
    color: '#0A0E17',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
});

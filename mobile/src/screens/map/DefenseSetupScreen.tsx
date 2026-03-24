import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { defenseApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { DefenseSetupScreenProps } from '../../navigation/types';

// ─── Game Type Definitions ──────────────────────────────────────────────────

type GameType = 'rock_paper_scissors' | 'sprint_race' | 'trivia' | 'coin_flip' | 'odd_even' | 'tic_tac_toe' | 'mini_chess';

interface GameTypeCard {
  id: GameType;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  color: string;
  category: 'instant' | 'strategy';
}

const GAME_TYPES: GameTypeCard[] = [
  {
    id: 'rock_paper_scissors',
    name: 'Schnick Schnack Schnuck',
    icon: 'hand-left-outline',
    description: 'Wähle einen geheimen Zug. Herausforderer wählt seinen — Klassiker!',
    color: '#7B61FF',
    category: 'instant',
  },
  {
    id: 'coin_flip',
    name: 'Münzwurf',
    icon: 'ellipse-outline',
    description: 'Setze auf Kopf oder Zahl. 50/50 Glücksspiel!',
    color: '#FFB800',
    category: 'instant',
  },
  {
    id: 'odd_even',
    name: 'Gerade oder Ungerade',
    icon: 'finger-print-outline',
    description: 'Finger-Poker! Zeig 1-5 Finger, die Summe entscheidet.',
    color: '#FF69B4',
    category: 'instant',
  },
  {
    id: 'sprint_race',
    name: 'Sprint Race',
    icon: 'speedometer-outline',
    description: 'Setze eine Benchmark-Zeit. Herausforderer muss schneller sein!',
    color: '#00FF88',
    category: 'instant',
  },
  {
    id: 'trivia',
    name: 'Trivia',
    icon: 'help-circle-outline',
    description: 'Stelle eine Frage. Herausforderer muss richtig antworten!',
    color: '#00D4FF',
    category: 'instant',
  },
  {
    id: 'tic_tac_toe',
    name: 'Tic Tac Toe',
    icon: 'grid-outline',
    description: 'Klassisches 3×3 Strategiespiel. 2h pro Zug. Bei Unentschieden behältst du!',
    color: '#00D4FF',
    category: 'strategy',
  },
  {
    id: 'mini_chess',
    name: 'Mini-Schach 5×5',
    icon: 'trophy-outline',
    description: 'König, Turm, Läufer, 3 Bauern. 4h pro Zug. Das ultimative Duell!',
    color: '#FFB800',
    category: 'strategy',
  },
];

type RpsChoice = 'rock' | 'scissors' | 'paper';

// ─── Component ──────────────────────────────────────────────────────────────

export default function DefenseSetupScreen({ route, navigation }: DefenseSetupScreenProps) {
  const { territoryId } = route.params;

  // State
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RPS state
  const [rpsChoice, setRpsChoice] = useState<RpsChoice | null>(null);
  const [rpsRounds, setRpsRounds] = useState<1 | 3>(1);
  const rpsScaleRock = useRef(new Animated.Value(1)).current;
  const rpsScaleScissors = useRef(new Animated.Value(1)).current;
  const rpsScalePaper = useRef(new Animated.Value(1)).current;

  // Sprint state
  const [sprintDistance, setSprintDistance] = useState(200);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkTime, setBenchmarkTime] = useState<number | null>(null);
  const [benchmarkStartTime, setBenchmarkStartTime] = useState<number | null>(null);
  const [benchmarkDistanceCovered, setBenchmarkDistanceCovered] = useState(0);
  const benchmarkSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastBenchmarkLocation = useRef<{ latitude: number; longitude: number } | null>(null);

  // Trivia state
  const [triviaQuestion, setTriviaQuestion] = useState('');
  const [triviaAnswer, setTriviaAnswer] = useState('');

  // Coin Flip state
  const [coinBet, setCoinBet] = useState<'heads' | 'tails' | null>(null);

  // Odd/Even state
  const [oddEvenPick, setOddEvenPick] = useState<'odd' | 'even' | null>(null);
  const [oeFingers, setOeFingers] = useState<number>(3);

  const SPRINT_DISTANCES = [100, 200, 300, 500];

  // ─── RPS Selection ──────────────────────────────────────────────────────

  const animateRpsChoice = (choice: RpsChoice) => {
    const scaleMap: Record<RpsChoice, Animated.Value> = {
      rock: rpsScaleRock,
      scissors: rpsScaleScissors,
      paper: rpsScalePaper,
    };
    // Reset all
    Object.values(scaleMap).forEach((v) => v.setValue(1));
    // Bounce selected
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

  // ─── Sprint Benchmark ─────────────────────────────────────────────────

  const startBenchmark = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'GPS permission is needed for the sprint benchmark.');
      return;
    }

    setIsBenchmarking(true);
    setBenchmarkDistanceCovered(0);
    setBenchmarkTime(null);
    lastBenchmarkLocation.current = null;

    const startTime = Date.now();
    setBenchmarkStartTime(startTime);

    let totalDist = 0;

    benchmarkSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 3,
        timeInterval: 1000,
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        if (lastBenchmarkLocation.current) {
          const dist = haversine(
            lastBenchmarkLocation.current.latitude,
            lastBenchmarkLocation.current.longitude,
            latitude,
            longitude
          );
          totalDist += dist;
          setBenchmarkDistanceCovered(totalDist);

          if (totalDist >= sprintDistance) {
            // Benchmark complete
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            setBenchmarkTime(elapsed);
            setIsBenchmarking(false);
            benchmarkSubscription.current?.remove();
            benchmarkSubscription.current = null;
          }
        }
        lastBenchmarkLocation.current = { latitude, longitude };
      }
    );
  };

  const cancelBenchmark = () => {
    setIsBenchmarking(false);
    benchmarkSubscription.current?.remove();
    benchmarkSubscription.current = null;
    setBenchmarkDistanceCovered(0);
    setBenchmarkStartTime(null);
  };

  // ─── Submit Defense ───────────────────────────────────────────────────

  const handleActivate = async () => {
    if (!selectedGame) {
      Alert.alert('Select a Game', 'Choose a defense game type first.');
      return;
    }

    // Validate per game type
    if (selectedGame === 'rock_paper_scissors' && !rpsChoice) {
      Alert.alert('Choose Your Move', 'Select Rock, Scissors, or Paper as your secret move.');
      return;
    }
    if (selectedGame === 'sprint_race' && benchmarkTime === null) {
      Alert.alert('Set Benchmark', 'Run the sprint to set your benchmark time first.');
      return;
    }
    if (selectedGame === 'trivia') {
      if (!triviaQuestion.trim()) {
        Alert.alert('Missing Question', 'Enter a trivia question.');
        return;
      }
      if (!triviaAnswer.trim()) {
        Alert.alert('Missing Answer', 'Enter the correct answer.');
        return;
      }
    }
    if (selectedGame === 'coin_flip' && !coinBet) {
      Alert.alert('Wette fehlt', 'Wähle Kopf oder Zahl.');
      return;
    }
    if (selectedGame === 'odd_even' && !oddEvenPick) {
      Alert.alert('Wahl fehlt', 'Wähle Gerade oder Ungerade.');
      return;
    }

    setIsSubmitting(true);
    try {
      let config: Record<string, any> = {};
      let secret: string | undefined;
      let benchmark: Record<string, any> | undefined;

      if (selectedGame === 'rock_paper_scissors') {
        secret = rpsChoice!;
        config = { rounds: rpsRounds };
      } else if (selectedGame === 'sprint_race') {
        config = { distance: sprintDistance };
        benchmark = { time_seconds: benchmarkTime };
      } else if (selectedGame === 'trivia') {
        config = { question: triviaQuestion.trim() };
        secret = triviaAnswer.trim().toLowerCase();
      } else if (selectedGame === 'coin_flip') {
        secret = coinBet!;
        config = { game: 'coin_flip' };
      } else if (selectedGame === 'odd_even') {
        secret = `${oddEvenPick}:${oeFingers}`;
        config = { game: 'odd_even' };
      } else if (selectedGame === 'tic_tac_toe') {
        config = { turn_timeout_hours: 2 };
      } else if (selectedGame === 'mini_chess') {
        config = { turn_timeout_hours: 4 };
      }

      await defenseApi.setDefense({
        territoryId,
        gameType: selectedGame,
        config,
        secret,
        benchmark,
      });

      Alert.alert('Defense Activated!', 'Your territory is now defended. Challengers beware!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to activate defense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────

  const renderRpsConfig = () => {
    const moves: { choice: RpsChoice; label: string; emoji: string; color: string; scale: Animated.Value }[] = [
      { choice: 'rock', label: 'Rock', emoji: '🪨', color: '#8892B0', scale: rpsScaleRock },
      { choice: 'scissors', label: 'Scissors', emoji: '✂️', color: '#FF4757', scale: rpsScaleScissors },
      { choice: 'paper', label: 'Paper', emoji: '📄', color: '#00D4FF', scale: rpsScalePaper },
    ];

    return (
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>Choose Your Secret Move</Text>
        <Text style={styles.configHint}>Your move is secret — the challenger won't see it!</Text>

        <View style={styles.rpsRow}>
          {moves.map((m) => (
            <Animated.View key={m.choice} style={{ transform: [{ scale: m.scale }] }}>
              <TouchableOpacity
                style={[
                  styles.rpsButton,
                  { borderColor: rpsChoice === m.choice ? m.color : THEME.border },
                  rpsChoice === m.choice && { backgroundColor: `${m.color}15` },
                ]}
                onPress={() => animateRpsChoice(m.choice)}
                activeOpacity={0.7}
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

        <Text style={styles.configSubtitle}>Rounds</Text>
        <View style={styles.roundsRow}>
          {([1, 3] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.roundButton,
                rpsRounds === r && styles.roundButtonActive,
              ]}
              onPress={() => setRpsRounds(r)}
            >
              <Text
                style={[
                  styles.roundButtonText,
                  rpsRounds === r && styles.roundButtonTextActive,
                ]}
              >
                {r === 1 ? 'Single Round' : 'Best of 3'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSprintConfig = () => {
    const progress = sprintDistance > 0 ? Math.min(benchmarkDistanceCovered / sprintDistance, 1) : 0;
    const elapsedSecs = benchmarkStartTime ? Math.round((Date.now() - benchmarkStartTime) / 1000) : 0;

    return (
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>Sprint Distance</Text>
        <View style={styles.distanceRow}>
          {SPRINT_DISTANCES.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.distanceChip,
                sprintDistance === d && styles.distanceChipActive,
              ]}
              onPress={() => {
                if (!isBenchmarking) setSprintDistance(d);
              }}
            >
              <Text
                style={[
                  styles.distanceChipText,
                  sprintDistance === d && styles.distanceChipTextActive,
                ]}
              >
                {d}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.configSubtitle}>Your Benchmark</Text>
        <Text style={styles.configHint}>Challengers must beat your time!</Text>

        {benchmarkTime !== null ? (
          <View style={styles.benchmarkResult}>
            <Ionicons name="checkmark-circle" size={28} color="#00FF88" />
            <Text style={styles.benchmarkTimeText}>{benchmarkTime}s</Text>
            <Text style={styles.benchmarkLabel}>over {sprintDistance}m</Text>
            <TouchableOpacity
              style={styles.rerunButton}
              onPress={() => {
                setBenchmarkTime(null);
                setBenchmarkDistanceCovered(0);
              }}
            >
              <Ionicons name="refresh" size={16} color={THEME.primary} />
              <Text style={styles.rerunText}>Redo</Text>
            </TouchableOpacity>
          </View>
        ) : isBenchmarking ? (
          <View style={styles.benchmarkLive}>
            <View style={styles.sprintTimerRow}>
              <Ionicons name="time-outline" size={22} color="#FF4757" />
              <Text style={styles.sprintTimer}>{elapsedSecs}s</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(benchmarkDistanceCovered)}m / {sprintDistance}m
            </Text>
            <TouchableOpacity style={styles.cancelBenchmarkBtn} onPress={cancelBenchmark}>
              <Text style={styles.cancelBenchmarkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startBenchmarkBtn} onPress={startBenchmark}>
            <Ionicons name="play" size={22} color="#0A0E17" />
            <Text style={styles.startBenchmarkText}>Set Your Benchmark</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTriviaConfig = () => (
    <View style={styles.configSection}>
      <Text style={styles.configTitle}>Deine Frage</Text>
      <Text style={styles.configHint}>Herausforderer muss richtig antworten!</Text>

      <TextInput
        style={styles.triviaInput}
        placeholder="Trivia-Frage eingeben..."
        placeholderTextColor={THEME.textSecondary}
        value={triviaQuestion}
        onChangeText={setTriviaQuestion}
        multiline
        maxLength={200}
      />

      <Text style={styles.configSubtitle}>Richtige Antwort</Text>
      <TextInput
        style={[styles.triviaInput, { height: 48 }]}
        placeholder="Korrekte Antwort eingeben..."
        placeholderTextColor={THEME.textSecondary}
        value={triviaAnswer}
        onChangeText={setTriviaAnswer}
        maxLength={100}
      />
    </View>
  );

  const renderCoinFlipConfig = () => (
    <View style={styles.configSection}>
      <Text style={styles.configTitle}>Deine Wette</Text>
      <Text style={styles.configHint}>Setze auf Kopf oder Zahl. Der Herausforderer wirft!</Text>

      <View style={styles.rpsRow}>
        {(['heads', 'tails'] as const).map((bet) => (
          <TouchableOpacity
            key={bet}
            style={[
              styles.rpsButton,
              { width: 130, height: 110 },
              { borderColor: coinBet === bet ? '#FFB800' : THEME.border },
              coinBet === bet && { backgroundColor: 'rgba(255, 184, 0, 0.15)' },
            ]}
            onPress={() => setCoinBet(bet)}
            activeOpacity={0.7}
          >
            <Text style={styles.rpsEmoji}>{bet === 'heads' ? '👑' : '🔢'}</Text>
            <Text style={[styles.rpsLabel, coinBet === bet && { color: '#FFB800' }]}>
              {bet === 'heads' ? 'Kopf' : 'Zahl'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOddEvenConfig = () => (
    <View style={styles.configSection}>
      <Text style={styles.configTitle}>Gerade oder Ungerade?</Text>
      <Text style={styles.configHint}>
        Wähle gerade/ungerade und deine Fingeranzahl. Die Summe beider Spieler entscheidet!
      </Text>

      <View style={styles.roundsRow}>
        {(['odd', 'even'] as const).map((pick) => (
          <TouchableOpacity
            key={pick}
            style={[
              styles.roundButton,
              oddEvenPick === pick && { borderColor: '#FF69B4', backgroundColor: 'rgba(255, 105, 180, 0.1)' },
            ]}
            onPress={() => setOddEvenPick(pick)}
          >
            <Text style={[styles.roundButtonText, oddEvenPick === pick && { color: '#FF69B4' }]}>
              {pick === 'odd' ? 'Ungerade' : 'Gerade'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.configSubtitle}>Deine Finger (1-5)</Text>
      <View style={styles.distanceRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              styles.distanceChip,
              oeFingers === n && { borderColor: '#FF69B4', backgroundColor: 'rgba(255, 105, 180, 0.1)' },
            ]}
            onPress={() => setOeFingers(n)}
          >
            <Text style={[styles.distanceChipText, oeFingers === n && { color: '#FF69B4' }]}>
              {n} {'🤚'.repeat(0)}{n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTurnGameConfig = (gameType: 'tic_tac_toe' | 'mini_chess') => {
    const isTTT = gameType === 'tic_tac_toe';
    return (
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>{isTTT ? 'Tic Tac Toe' : 'Mini-Schach 5×5'}</Text>
        <Text style={styles.configHint}>
          {isTTT
            ? 'Zugbasiertes Strategiespiel. Du spielst X (erster Zug). 2 Stunden pro Zug. Bei Unentschieden behältst du das Territorium!'
            : 'König, Turm, Läufer und 3 Bauern auf einem 5×5 Brett. Du spielst Weiß (erster Zug). 4 Stunden pro Zug.'}
        </Text>

        <View style={[styles.rpsRow, { justifyContent: 'center' }]}>
          <View style={[styles.rpsButton, { width: 260, height: 80, borderColor: isTTT ? '#00D4FF' : '#FFB800', backgroundColor: isTTT ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255, 184, 0, 0.08)' }]}>
            <Text style={[styles.rpsEmoji, { fontSize: 28 }]}>{isTTT ? '❌⭕' : '♔♚'}</Text>
            <Text style={[styles.rpsLabel, { color: isTTT ? '#00D4FF' : '#FFB800' }]}>
              {isTTT ? '2h pro Zug · 5-9 Züge' : '4h pro Zug · 1-3 Tage'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Defend Your Territory</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Instant Games */}
        <Text style={styles.sectionHeader}>Sofort-Spiele</Text>
        <View style={styles.gameGrid}>
          {GAME_TYPES.filter((g) => g.category === 'instant').map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[
                styles.gameCard,
                selectedGame === game.id && {
                  borderColor: game.color,
                  backgroundColor: `${game.color}10`,
                },
              ]}
              onPress={() => setSelectedGame(game.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.gameIconCircle,
                  {
                    backgroundColor:
                      selectedGame === game.id ? `${game.color}20` : `${THEME.border}40`,
                  },
                ]}
              >
                <Ionicons
                  name={game.icon}
                  size={28}
                  color={selectedGame === game.id ? game.color : THEME.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.gameName,
                  selectedGame === game.id && { color: game.color },
                ]}
              >
                {game.name}
              </Text>
              <Text style={styles.gameDesc} numberOfLines={2}>
                {game.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Strategy Games */}
        <Text style={styles.sectionHeader}>Strategie-Spiele (Zugbasiert)</Text>
        <View style={styles.gameGrid}>
          {GAME_TYPES.filter((g) => g.category === 'strategy').map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[
                styles.gameCard,
                selectedGame === game.id && {
                  borderColor: game.color,
                  backgroundColor: `${game.color}10`,
                },
              ]}
              onPress={() => setSelectedGame(game.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.gameIconCircle,
                  {
                    backgroundColor:
                      selectedGame === game.id ? `${game.color}20` : `${THEME.border}40`,
                  },
                ]}
              >
                <Ionicons
                  name={game.icon}
                  size={28}
                  color={selectedGame === game.id ? game.color : THEME.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.gameName,
                  selectedGame === game.id && { color: game.color },
                ]}
              >
                {game.name}
              </Text>
              <Text style={styles.gameDesc} numberOfLines={2}>
                {game.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Game-specific configuration */}
        {selectedGame === 'rock_paper_scissors' && renderRpsConfig()}
        {selectedGame === 'sprint_race' && renderSprintConfig()}
        {selectedGame === 'trivia' && renderTriviaConfig()}
        {selectedGame === 'coin_flip' && renderCoinFlipConfig()}
        {selectedGame === 'odd_even' && renderOddEvenConfig()}
        {selectedGame === 'tic_tac_toe' && renderTurnGameConfig('tic_tac_toe')}
        {selectedGame === 'mini_chess' && renderTurnGameConfig('mini_chess')}

        {/* Activate Button */}
        {selectedGame && (
          <TouchableOpacity
            style={[styles.activateBtn, isSubmitting && styles.activateBtnDisabled]}
            onPress={handleActivate}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#0A0E17" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={22} color="#0A0E17" />
                <Text style={styles.activateBtnText}>ACTIVATE DEFENSE</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
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
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: THEME.text,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },

  // ─── Game Type Cards ────────────────────────────────────────────────
  gameGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    gap: 14,
  },
  gameIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameName: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    flex: 0,
  },
  gameDesc: {
    flex: 1,
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 16,
  },

  // ─── Config Section ─────────────────────────────────────────────────
  configSection: {
    marginHorizontal: 20,
    marginTop: SPACING.xl,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  configTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  configSubtitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  configHint: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },

  // ─── RPS ────────────────────────────────────────────────────────────
  rpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  rpsButton: {
    width: 95,
    height: 100,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    backgroundColor: THEME.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  rpsEmoji: {
    fontSize: 32,
  },
  rpsLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  roundsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roundButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.bg,
    alignItems: 'center',
  },
  roundButtonActive: {
    borderColor: '#7B61FF',
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
  },
  roundButtonText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  roundButtonTextActive: {
    color: '#7B61FF',
  },

  // ─── Sprint ─────────────────────────────────────────────────────────
  distanceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  distanceChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.bg,
    alignItems: 'center',
  },
  distanceChipActive: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  distanceChipText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  distanceChipTextActive: {
    color: '#00FF88',
  },
  startBenchmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF88',
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    gap: 10,
    marginTop: SPACING.sm,
  },
  startBenchmarkText: {
    color: '#0A0E17',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  benchmarkResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  benchmarkTimeText: {
    color: '#00FF88',
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  benchmarkLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
  rerunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  rerunText: {
    color: THEME.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  benchmarkLive: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  sprintTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sprintTimer: {
    color: '#FF4757',
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  progressBarBg: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.bg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#00FF88',
  },
  progressText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  cancelBenchmarkBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FF4757',
  },
  cancelBenchmarkText: {
    color: '#FF4757',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },

  // ─── Trivia ─────────────────────────────────────────────────────────
  triviaInput: {
    backgroundColor: THEME.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: SPACING.lg,
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // ─── Activate Button ───────────────────────────────────────────────
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB800',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 20,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  activateBtnDisabled: {
    opacity: 0.5,
  },
  activateBtnText: {
    color: '#0A0E17',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

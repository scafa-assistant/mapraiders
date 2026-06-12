import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePveStore, HackLoot } from '../../store/pveStore';
import { useLocationStore } from '../../store/locationStore';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MapStackParamList } from '../../navigation/types';
import type { HackInputTrace } from '../../services/api';
import PvEIntroCards from '../../components/PvEIntroCards';

// ─── Constants ────────────────────────────────────────────────────────────────

const VRIL_PRIMARY = '#7B61FF';
const VRIL_ACCENT = '#9D4EDD';
const PLAYER_COLOR = '#00D4FF';
const MATCH_THRESHOLD = 0.85;
const HOLD_DURATION_MS = 2000;
const TIMEOUT_SECS = 45;
const SAMPLE_INTERVAL_MS = 200;
const WAVE_POINTS = 60;
const INTRO_SEEN_KEY = 'pve_intro_seen';

type HackingScreenProps = NativeStackScreenProps<MapStackParamList, 'HackingScreen'>;

// ─── Wave math ────────────────────────────────────────────────────────────────

function buildWavePath(
  freq: number,
  amp: number,
  phase: number,
  width: number,
  height: number
): string {
  const midY = height / 2;
  const points: string[] = [];
  for (let i = 0; i <= WAVE_POINTS; i++) {
    const x = (i / WAVE_POINTS) * width;
    const t = (i / WAVE_POINTS) * Math.PI * 2 * freq + phase;
    const y = midY - amp * Math.sin(t);
    points.push(i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

/** Returns match ratio 0..1 between target and player wave over WAVE_POINTS samples. */
function calcMatch(
  targetFreq: number,
  targetAmp: number,
  playerFreq: number,
  playerAmp: number,
  phase: number
): number {
  let totalError = 0;
  for (let i = 0; i <= WAVE_POINTS; i++) {
    const t = (i / WAVE_POINTS) * Math.PI * 2 + phase;
    const target = targetAmp * Math.sin(t * targetFreq);
    const player = playerAmp * Math.sin(t * playerFreq);
    totalError += Math.abs(target - player);
  }
  const maxError = (targetAmp + playerAmp) * (WAVE_POINTS + 1);
  return Math.max(0, 1 - totalError / maxError);
}

// ─── Step button (replaces Slider to avoid new deps) ─────────────────────────

interface StepControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  onChange: (v: number) => void;
  color?: string;
}

function StepControl({ label, value, min, max, step, decimals = 1, onChange, color = VRIL_PRIMARY }: StepControlProps) {
  const decrement = () => onChange(Math.max(min, parseFloat((value - step).toFixed(decimals))));
  const increment = () => onChange(Math.min(max, parseFloat((value + step).toFixed(decimals))));
  return (
    <View style={stepStyles.row}>
      <Text style={[stepStyles.label, { color: '#8892B0' }]}>{label}</Text>
      <TouchableOpacity style={stepStyles.btn} onPress={decrement} activeOpacity={0.7}>
        <Ionicons name="remove" size={18} color={color} />
      </TouchableOpacity>
      <Text style={[stepStyles.value, { color }]}>{value.toFixed(decimals)}</Text>
      <TouchableOpacity style={stepStyles.btn} onPress={increment} activeOpacity={0.7}>
        <Ionicons name="add" size={18} color={color} />
      </TouchableOpacity>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  label: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(123,97,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  value: {
    width: 48,
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HackingScreen({ navigation, route }: HackingScreenProps) {
  const { spawn } = route.params;
  const theme = useTheme();
  const { submitHack, isHacking } = usePveStore();

  // ── Intro state
  const [showIntro, setShowIntro] = useState(false);
  const [introChecked, setIntroChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem(INTRO_SEEN_KEY);
      if (!seen) {
        setShowIntro(true);
      }
      setIntroChecked(true);
    })();
  }, []);

  const handleIntroFinish = useCallback(async () => {
    await AsyncStorage.setItem(INTRO_SEEN_KEY, '1');
    setShowIntro(false);
  }, []);

  // ── Target wave params (randomised per spawn level)
  const targetFreq = useMemo(
    () => parseFloat((0.8 + spawn.level * 0.6 + Math.random() * 0.4).toFixed(1)),
    [spawn.id, spawn.level]
  );
  const targetAmp = useMemo(
    () => parseFloat((0.3 + spawn.level * 0.1 + Math.random() * 0.15).toFixed(2)),
    [spawn.id, spawn.level]
  );

  // ── Player controls
  const [playerFreq, setPlayerFreq] = useState(1.0);
  const [playerAmp, setPlayerAmp] = useState(0.3);

  // ── Wave phase animation (Reanimated-free: plain Animated for phase scroll)
  const phaseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(phaseAnim, {
        toValue: Math.PI * 2,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false, // JS value needed for path calc
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // We need the JS-thread value for SVG path computation
  const phaseRef = useRef(0);
  useEffect(() => {
    const id = phaseAnim.addListener(({ value }) => {
      phaseRef.current = value;
    });
    return () => phaseAnim.removeListener(id);
  }, [phaseAnim]);

  // ── SVG wave paths (re-computed every 100 ms tick for smooth animation)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const WAVE_W = 300;
  const WAVE_H = 100;

  const targetPath = useMemo(
    () => buildWavePath(targetFreq, targetAmp * WAVE_H, phaseRef.current, WAVE_W, WAVE_H),
    [tick, targetFreq, targetAmp]
  );
  const playerPath = useMemo(
    () => buildWavePath(playerFreq, playerAmp * WAVE_H, phaseRef.current, WAVE_W, WAVE_H),
    [tick, playerFreq, playerAmp]
  );

  const matchRatio = useMemo(
    () => calcMatch(targetFreq, targetAmp, playerFreq, playerAmp, phaseRef.current),
    [tick, targetFreq, targetAmp, playerFreq, playerAmp]
  );

  const matchPct = Math.round(matchRatio * 100);

  // ── Hold-to-lock
  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdAnim = useRef<Animated.CompositeAnimation | null>(null);
  const holdStarted = useRef(false);

  const startHold = useCallback(() => {
    if (matchRatio < MATCH_THRESHOLD) return;
    holdStarted.current = true;
    holdAnim.current = Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    holdAnim.current.start(({ finished }) => {
      if (finished && holdStarted.current) {
        handleSubmit();
      }
    });
  }, [matchRatio]);

  const cancelHold = useCallback(() => {
    holdStarted.current = false;
    holdAnim.current?.stop();
    holdProgress.setValue(0);
  }, []);

  // ── Samples collection
  const samplesRef = useRef<Array<{ t: number; freq: number; amp: number }>>([]);
  const gameStartTime = useRef(Date.now());
  useEffect(() => {
    gameStartTime.current = Date.now();
    samplesRef.current = [];
    const interval = setInterval(() => {
      samplesRef.current.push({
        t: Date.now() - gameStartTime.current,
        freq: playerFreq,
        amp: playerAmp,
      });
    }, SAMPLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // ── Countdown
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECS);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setTimedOut(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Result state
  const [result, setResult] = useState<{
    success: boolean;
    loot?: HackLoot;
    message?: string;
  } | null>(null);

  const handleSubmit = useCallback(async () => {
    if (result || isHacking) return;
    // Real GPS position — the server enforces the 75 m proximity check
    const playerLocation = useLocationStore.getState().currentLocation;
    if (!playerLocation) {
      setResult({ success: false, message: 'Kein GPS-Signal — Standort wird benötigt.' });
      return;
    }
    const trace: HackInputTrace = {
      playerLocation,
      samples: [...samplesRef.current],
      durationS: (Date.now() - gameStartTime.current) / 1000,
    };
    const res = await submitHack(spawn.id, trace);
    setResult(res);
  }, [result, isHacking, spawn, submitHack]);

  // ── Glow animation for success
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (result?.success) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    return undefined;
  }, [result]);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(123,97,255,0.1)', 'rgba(123,97,255,0.55)'],
  });

  // ── Human-readable error messages
  function errorMessage(msg?: string): string {
    switch (msg) {
      case 'TOO_FAR':
        return 'Du bist zu weit entfernt. Geh näher ran!';
      case 'DAILY_CAP':
        return 'Tageslimit erreicht. Komm morgen wieder.';
      default:
        return 'Verbindung unterbrochen. Versuche es erneut.';
    }
  }

  // Wait until we checked AsyncStorage before rendering anything
  if (!introChecked) return null;

  if (showIntro) {
    return <PvEIntroCards onFinish={handleIntroFinish} />;
  }

  const matchColor =
    matchRatio >= MATCH_THRESHOLD
      ? '#00FF88'
      : matchRatio >= 0.6
        ? '#FFB800'
        : '#FF4757';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0A0E17' }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#8892B0" />
        </TouchableOpacity>
        <Text style={styles.title}>Frequenz-Hack</Text>
        <View style={[styles.timerBadge, secondsLeft <= 10 && styles.timerUrgent]}>
          <Ionicons name="time" size={13} color={secondsLeft <= 10 ? '#FF4757' : '#8892B0'} />
          <Text style={[styles.timerText, secondsLeft <= 10 && { color: '#FF4757' }]}>
            {secondsLeft}s
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* NPC info */}
        <View style={styles.npcRow}>
          <View style={[styles.npcBadge, { borderColor: VRIL_ACCENT }]}>
            <Text style={styles.npcType}>{spawn.npc_type.replace(/_/g, ' ')}</Text>
            <Text style={styles.npcLevel}>Level {spawn.level}</Text>
          </View>
        </View>

        {/* Wave display */}
        <View style={styles.waveContainer}>
          <Text style={styles.waveLabel}>Zielfrequenz</Text>
          <Svg width={WAVE_W} height={WAVE_H} style={styles.svg}>
            <Path d={targetPath} stroke={VRIL_PRIMARY} strokeWidth={2.5} fill="none" strokeOpacity={0.9} />
          </Svg>
          <Text style={[styles.waveLabel, { color: PLAYER_COLOR }]}>Deine Welle</Text>
          <Svg width={WAVE_W} height={WAVE_H} style={styles.svg}>
            <Path d={playerPath} stroke={PLAYER_COLOR} strokeWidth={2.5} fill="none" strokeOpacity={0.9} />
          </Svg>
        </View>

        {/* Match indicator */}
        <View style={styles.matchRow}>
          <Text style={styles.matchLabel}>Übereinstimmung</Text>
          <Text style={[styles.matchPct, { color: matchColor }]}>{matchPct}%</Text>
        </View>
        <View style={styles.matchBarBg}>
          <Animated.View
            style={[
              styles.matchBarFill,
              {
                width: `${matchPct}%`,
                backgroundColor: matchColor,
              },
            ]}
          />
          {/* Threshold line */}
          <View style={[styles.thresholdLine, { left: `${Math.round(MATCH_THRESHOLD * 100)}%` }]} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <StepControl
            label="Frequenz"
            value={playerFreq}
            min={0.2}
            max={4.0}
            step={0.1}
            decimals={1}
            onChange={setPlayerFreq}
            color={PLAYER_COLOR}
          />
          <StepControl
            label="Amplitude"
            value={playerAmp}
            min={0.05}
            max={0.8}
            step={0.05}
            decimals={2}
            onChange={setPlayerAmp}
            color={PLAYER_COLOR}
          />
        </View>

        {/* Hold-to-lock button */}
        {!result && !timedOut && (
          <View style={styles.lockArea}>
            {matchRatio >= MATCH_THRESHOLD ? (
              <>
                <Text style={styles.holdHint}>Halten zum Einloggen</Text>
                <TouchableOpacity
                  style={styles.lockBtn}
                  activeOpacity={0.85}
                  onPressIn={startHold}
                  onPressOut={cancelHold}
                >
                  <View style={styles.lockBtnInner}>
                    <Animated.View
                      style={[
                        styles.lockProgress,
                        {
                          width: holdProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                    <Ionicons name="lock-open" size={22} color="#FFFFFF" style={{ zIndex: 2 }} />
                    <Text style={styles.lockBtnText}>VERBINDEN</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.adjustHint}>Passe Frequenz und Amplitude an ({'>'}{Math.round(MATCH_THRESHOLD * 100)}%)</Text>
            )}
          </View>
        )}

        {/* Timeout */}
        {timedOut && !result && (
          <View style={styles.resultOverlay}>
            <Ionicons name="time" size={48} color="#FF4757" />
            <Text style={styles.resultTitle}>Zeit abgelaufen</Text>
            <Text style={styles.resultMsg}>Die Verbindung wurde unterbrochen.</Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.dismissText}>Zurück</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {isHacking && (
          <View style={styles.resultOverlay}>
            <Text style={[styles.resultTitle, { color: VRIL_PRIMARY }]}>Verbinde…</Text>
          </View>
        )}

        {/* Result overlay */}
        {result && !isHacking && (
          <Animated.View style={[styles.resultOverlay, result.success && { backgroundColor: glowColor as any }]}>
            {result.success ? (
              <>
                <Ionicons name="flash" size={48} color={VRIL_PRIMARY} />
                <Text style={styles.resultTitle}>Einheit gehackt!</Text>
                {result.loot && (
                  <View style={styles.lootList}>
                    {result.loot.resources?.energy != null && (
                      <View style={styles.lootRow}>
                        <Ionicons name="flash" size={16} color="#FFB800" />
                        <Text style={styles.lootText}>+{result.loot.resources.energy} Energie</Text>
                      </View>
                    )}
                    {result.loot.resources?.tech != null && (
                      <View style={styles.lootRow}>
                        <Ionicons name="hardware-chip" size={16} color="#00D4FF" />
                        <Text style={styles.lootText}>+{result.loot.resources.tech} Tech</Text>
                      </View>
                    )}
                    {result.loot.resources?.intel != null && (
                      <View style={styles.lootRow}>
                        <Ionicons name="eye" size={16} color="#9D4EDD" />
                        <Text style={styles.lootText}>+{result.loot.resources.intel} Intel</Text>
                      </View>
                    )}
                    {result.loot.items?.map((item, idx) => (
                      <View key={idx} style={styles.lootRow}>
                        <Ionicons name="cube" size={16} color="#8892B0" />
                        <Text style={styles.lootText}>{item.definition_id}</Text>
                        <Text style={[styles.rarityBadge, { color: item.rarity === 'rare' ? '#00D4FF' : item.rarity === 'epic' ? VRIL_PRIMARY : '#8892B0' }]}>
                          {item.rarity}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
                <Ionicons name="close-circle" size={48} color="#FF4757" />
                <Text style={[styles.resultTitle, { color: '#FF4757' }]}>Hack fehlgeschlagen</Text>
                <Text style={styles.resultMsg}>{errorMessage(result.message)}</Text>
              </>
            )}
            <TouchableOpacity style={styles.dismissBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.dismissText}>Zurück zur Karte</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2340',
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#1A2340',
    backgroundColor: '#0D1220',
  },
  timerUrgent: {
    borderColor: '#FF4757',
    backgroundColor: 'rgba(255,71,87,0.1)',
  },
  timerText: {
    fontSize: FONT_SIZE.sm,
    color: '#8892B0',
    fontWeight: '600',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  npcRow: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  npcBadge: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(157,78,221,0.1)',
    alignItems: 'center',
  },
  npcType: {
    fontSize: FONT_SIZE.md,
    color: '#C77DFF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  npcLevel: {
    fontSize: FONT_SIZE.xs,
    color: '#8892B0',
    marginTop: 2,
  },
  waveContainer: {
    alignItems: 'center',
    backgroundColor: '#0D1220',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  waveLabel: {
    fontSize: FONT_SIZE.xs,
    color: VRIL_PRIMARY,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  svg: {
    marginVertical: 4,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchLabel: {
    fontSize: FONT_SIZE.sm,
    color: '#8892B0',
  },
  matchPct: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  matchBarBg: {
    height: 8,
    backgroundColor: '#1A2340',
    borderRadius: 4,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  matchBarFill: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thresholdLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  controls: {
    backgroundColor: '#0D1220',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1A2340',
    marginBottom: SPACING.md,
  },
  lockArea: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  holdHint: {
    fontSize: FONT_SIZE.xs,
    color: '#8892B0',
    marginBottom: SPACING.sm,
  },
  adjustHint: {
    fontSize: FONT_SIZE.sm,
    color: '#555E78',
    textAlign: 'center',
    lineHeight: 20,
  },
  lockBtn: {
    width: '80%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: VRIL_PRIMARY,
  },
  lockBtnInner: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(123,97,255,0.15)',
    position: 'relative',
    overflow: 'hidden',
  },
  lockProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: 'rgba(123,97,255,0.35)',
  },
  lockBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: VRIL_PRIMARY,
    zIndex: 2,
    letterSpacing: 1.5,
  },
  resultOverlay: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: '#0D1220',
    borderWidth: 1,
    borderColor: '#1A2340',
    gap: 12,
  },
  resultTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultMsg: {
    fontSize: FONT_SIZE.sm,
    color: '#8892B0',
    textAlign: 'center',
    lineHeight: 20,
  },
  lootList: {
    width: '100%',
    gap: 8,
  },
  lootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  lootText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
  },
  rarityBadge: {
    fontSize: FONT_SIZE.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  dismissBtn: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: VRIL_PRIMARY,
    backgroundColor: 'rgba(123,97,255,0.12)',
  },
  dismissText: {
    fontSize: FONT_SIZE.sm,
    color: VRIL_PRIMARY,
    fontWeight: '700',
  },
});

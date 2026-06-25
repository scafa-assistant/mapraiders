import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTeachOnMount } from '../../store/teachStore';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BattleReplayScreenProps } from '../../navigation/types';
import { useCommanderStore } from '../../store/commanderStore';
import { useAuthStore } from '../../store/authStore';
import { COMMANDER_COLORS, prettifyDefinitionId } from '../../utils/commander';
import { SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { strings as S, t, plural } from '../../i18n';
import { fx } from '../../services/fx';
import { PipDie } from '../../components/fx/PipDie';
import { ParticleBurst } from '../../components/fx/ParticleBurst';
import { useReducedMotion } from '../../components/fx/useReducedMotion';
import type {
  CommanderBattleRound,
  CommanderBattleEffect,
  CommanderAirstrikeBattleLog,
  CommanderDiceBattleLog,
  AirstrikeResult,
} from '../../services/api';

const C = COMMANDER_COLORS;
const ROUND_MS = 800;
// Window at the start of each round during which the dice "roll" (shake + tick).
const ROLL_MS = 420;

// ─── VS badge that pops in before the resolution ───────────────────────────────

function VsBadge({ animKey }: { animKey: number }) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      scale.setValue(1);
      return;
    }
    scale.setValue(0);
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [animKey, reduced, scale]);

  return (
    <Animated.Text style={[styles.vs, { transform: [{ scale }] }]}>
      {S.commander.battleReplay.vs}
    </Animated.Text>
  );
}

// ─── Side column ─────────────────────────────────────────────────────────────────

function SideColumn({
  label,
  color,
  round,
  side,
  animKey,
  rolling,
}: {
  label: string;
  color: string;
  round: CommanderBattleRound;
  side: 'atk' | 'def';
  animKey: number;
  rolling: boolean;
}) {
  const data = round[side];
  return (
    <View style={styles.column}>
      <Text style={[styles.colLabel, { color }]}>{label}</Text>
      <Text style={styles.unitName} numberOfLines={1}>
        {prettifyDefinitionId(data.unit)}
      </Text>
      <View style={styles.diceRow}>
        {data.rolls.map((r, i) => (
          <PipDie
            key={`${animKey}-${i}`}
            value={r}
            color={color}
            animKey={animKey}
            rolling={rolling}
          />
        ))}
      </View>
      <View style={styles.modRow}>
        {data.bonus !== 0 ? (
          <View style={[styles.chip, { borderColor: color }]}>
            <Text style={[styles.chipText, { color }]}>
              {t(S.commander.battleReplay.bonus, {
                value: data.bonus > 0 ? `+${data.bonus}` : data.bonus,
              })}
            </Text>
          </View>
        ) : null}
        {data.modifier !== 0 ? (
          <View style={[styles.chip, { borderColor: color }]}>
            <Text style={[styles.chipText, { color }]}>
              {t(S.commander.battleReplay.mod, {
                value: data.modifier > 0 ? `+${data.modifier}` : data.modifier,
              })}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.total, { color }]}>{data.total}</Text>
    </View>
  );
}

function effectLabel(e: CommanderBattleEffect): string {
  const R = S.commander.battleReplay;
  const who = e.side === 'atk' ? R.whoAttacker : R.whoDefender;
  if (e.effect === 'cancel_highest') {
    return t(R.shieldCancel, { who, value: e.cancelled ?? '?' });
  }
  return `${who}: ${prettifyDefinitionId(e.effect)}`;
}

// ─── Post-battle balance summary ───────────────────────────────────────────────

function unitsLabel(n: number): string {
  const R = S.commander.battleReplay;
  return plural(n, R.summaryUnitsOne, R.summaryUnitsOther);
}

function SummaryRow({
  label,
  color,
  start,
  survivors,
  losses,
}: {
  label: string;
  color: string;
  start: number;
  survivors: number;
  losses: number;
}) {
  const R = S.commander.battleReplay;
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summarySide, { color }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.summaryCells}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryCellLabel}>{R.summaryStart}</Text>
          <Text style={styles.summaryCellValue}>{start}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryCellLabel}>{R.summarySurvivors}</Text>
          <Text style={[styles.summaryCellValue, { color: C.own }]}>{survivors}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryCellLabel}>{R.summaryLosses}</Text>
          <Text style={[styles.summaryCellValue, { color: losses > 0 ? C.enemy : C.textSecondary }]}>
            {losses}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Aggregates a short balance card purely from the existing dice-battle log.
 * Survivors come from `log.survivors`, losses are derived as start minus
 * survivors (never below 0). No invented numbers.
 */
function BattleSummaryCard({ log }: { log: CommanderDiceBattleLog }) {
  const R = S.commander.battleReplay;
  const atkStart = log.attacker_units_start ?? 0;
  const defStart = log.defender_units_start ?? 0;
  const atkSurv = log.survivors?.attacker?.length ?? 0;
  const defSurv = log.survivors?.defender?.length ?? 0;
  const atkLoss = Math.max(0, atkStart - atkSurv);
  const defLoss = Math.max(0, defStart - defSurv);
  const roundsFought = log.rounds?.length ?? 0;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons name="bar-chart" size={16} color={C.accent} />
        <Text style={styles.summaryTitle}>{R.summaryTitle}</Text>
      </View>

      <SummaryRow
        label={R.summaryAttacker}
        color={C.own}
        start={atkStart}
        survivors={atkSurv}
        losses={atkLoss}
      />
      <View style={styles.summaryDivider} />
      <SummaryRow
        label={R.summaryDefender}
        color={C.foreign}
        start={defStart}
        survivors={defSurv}
        losses={defLoss}
      />

      <Text style={styles.summaryMeta}>
        {plural(roundsFought, R.summaryRoundsOne, R.summaryRoundsOther)}
        {atkLoss + defLoss > 0
          ? ` · ${unitsLabel(atkLoss + defLoss)} ${R.summaryLosses.toLowerCase()}`
          : ''}
      </Text>
    </View>
  );
}

// ─── Airstrike result summary card ────────────────────────────────────────────

function airstrikeResultLine(result: AirstrikeResult): string {
  const R = S.commander.battleReplay;
  if ('shield_broken' in result && result.shield_broken) {
    return R.airstrikeShieldBroken;
  }
  if ('building_hit' in result) {
    const h = result.building_hit;
    return h.destroyed
      ? t(R.airstrikeBuildingDestroyed, { type: h.type })
      : t(R.airstrikeBuildingHit, { type: h.type, hp: h.hp_after });
  }
  return R.airstrikeNoEffect;
}

function AirstrikeCard({
  log,
  playerIsAttacker,
  onBack,
}: {
  log: CommanderAirstrikeBattleLog;
  playerIsAttacker: boolean;
  onBack: () => void;
}) {
  const R = S.commander.battleReplay;
  const hit = 'shield_broken' in log.result || 'building_hit' in log.result;
  const playerWon = playerIsAttacker && hit;
  const resultLine = airstrikeResultLine(log.result);

  // Resolution feedback for the airstrike (no dice replay).
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    fx.clash();
    const id = setTimeout(() => (playerWon ? fx.victory() : fx.defeat()), 280);
    return () => clearTimeout(id);
  }, [playerWon]);

  return (
    <View style={styles.scroll}>
      {/* Airstrike banner */}
      <View style={styles.airstrikeHeader}>
        <Ionicons name="rocket" size={40} color={C.warning} />
        <Text style={styles.airstrikeTitle}>{R.airstrike}</Text>
        <Text style={styles.airstrikeMeta}>
          {t(R.airstrikeMeta, { tier: log.silo_tier, damage: log.damage })}
        </Text>
      </View>

      {/* Result line */}
      <View style={[styles.airstrikeResultCard, { borderColor: hit ? C.own : C.border }]}>
        <Ionicons
          name={hit ? 'checkmark-circle' : 'alert-circle'}
          size={24}
          color={hit ? C.own : C.textSecondary}
        />
        <Text style={[styles.airstrikeResultText, { color: hit ? C.text : C.textSecondary }]}>
          {resultLine}
        </Text>
      </View>

      {/* Victory-style banner */}
      <ResultBanner playerWon={playerWon} onBack={onBack} />
    </View>
  );
}

// ─── Result banner (springs in, particle burst on win) ─────────────────────────

function ResultBanner({
  playerWon,
  onBack,
  children,
}: {
  playerWon: boolean;
  onBack: () => void;
  children?: React.ReactNode;
}) {
  const R = S.commander.battleReplay;
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(reduced ? 1 : 0.6)).current;
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (reduced) {
      scale.setValue(1);
    } else {
      scale.setValue(0.6);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 110,
        useNativeDriver: true,
      }).start();
    }
    if (playerWon) setBurstKey(Date.now());
  }, [playerWon, reduced, scale]);

  return (
    <View style={styles.finalWrap}>
      {playerWon ? <ParticleBurst fireKey={burstKey} /> : null}
      <Animated.View
        style={[
          styles.finalBanner,
          {
            borderColor: playerWon ? C.own : C.enemy,
            backgroundColor: playerWon ? `${C.own}1A` : `${C.enemy}1A`,
            transform: [{ scale }],
          },
        ]}
      >
        <Ionicons
          name={playerWon ? 'trophy' : 'sad'}
          size={40}
          color={playerWon ? C.warning : C.enemy}
        />
        <Text style={[styles.finalText, { color: playerWon ? C.own : C.enemy }]}>
          {playerWon ? R.victory : R.defeat}
        </Text>
      </Animated.View>

      {children}

      <TouchableOpacity style={styles.doneBtn} onPress={onBack} activeOpacity={0.8}>
        <Text style={styles.doneBtnText}>{R.done}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BattleReplayScreen({ navigation, route }: BattleReplayScreenProps) {
  useTeachOnMount('battle');
  const R = S.commander.battleReplay;
  const { battleId } = route.params;
  const { battleDetail, battleDetailLoading, fetchBattle, clearBattleDetail } = useCommanderStore();
  const userId = useAuthStore((s) => s.user?.id);

  const [roundIndex, setRoundIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [rolling, setRolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultFiredRef = useRef(false);

  useEffect(() => {
    fetchBattle(battleId);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
      clearBattleDetail();
    };
  }, [battleId, fetchBattle, clearBattleDetail]);

  // Airstrike guard: if log.type === 'airstrike', render summary card instead of dice replay.
  const isAirstrike =
    battleDetail?.log != null &&
    'type' in battleDetail.log &&
    battleDetail.log.type === 'airstrike';

  const airstrikeLog = isAirstrike
    ? (battleDetail!.log as CommanderAirstrikeBattleLog)
    : null;

  const diceBattleLog =
    !isAirstrike && battleDetail?.log != null ? battleDetail.log : null;

  const rounds = (diceBattleLog as { rounds?: CommanderBattleRound[] } | null)?.rounds ?? [];
  const walkover = (diceBattleLog as { walkover?: boolean } | null)?.walkover === true;

  // Drive the sequential replay (dice battles only)
  useEffect(() => {
    if (!battleDetail || isAirstrike) return;
    if (walkover || rounds.length === 0) {
      setFinished(true);
      return;
    }
    if (finished) return;

    timerRef.current = setTimeout(() => {
      setRoundIndex((idx) => {
        const next = idx + 1;
        if (next >= rounds.length) {
          setFinished(true);
          return idx;
        }
        return next;
      });
    }, ROUND_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [battleDetail, roundIndex, finished, rounds.length, walkover, isAirstrike]);

  // Per-round juice: dice roll (shake + tick) then a clash impact on resolution.
  useEffect(() => {
    if (!battleDetail || isAirstrike || walkover || rounds.length === 0 || finished) return;
    setRolling(true);
    if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    rollTimerRef.current = setTimeout(() => {
      setRolling(false);
      fx.clash();
    }, ROLL_MS);
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, [battleDetail, roundIndex, isAirstrike, walkover, rounds.length, finished]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    setRolling(false);
    if (rounds.length > 0) setRoundIndex(rounds.length - 1);
    setFinished(true);
  }, [rounds.length]);

  // Determine victory from the player's perspective.
  const playerIsAttacker = battleDetail?.attacker_id === userId;
  const winnerSide = (diceBattleLog as { winner_side?: 'attacker' | 'defender' } | null)?.winner_side;
  const playerWon =
    winnerSide != null &&
    ((playerIsAttacker && winnerSide === 'attacker') ||
      (!playerIsAttacker && winnerSide === 'defender'));

  // Fire the victory/defeat resolution sound + haptic once, after the last clash.
  useEffect(() => {
    if (!finished || isAirstrike || resultFiredRef.current || !battleDetail) return;
    resultFiredRef.current = true;
    const id = setTimeout(() => (playerWon ? fx.victory() : fx.defeat()), 260);
    return () => clearTimeout(id);
  }, [finished, isAirstrike, playerWon, battleDetail]);

  const currentRound = rounds[roundIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={C.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name={isAirstrike ? 'rocket' : 'flash'} size={18} color={C.accent} />
          <Text style={styles.headerTitle}>
            {isAirstrike ? R.titleAirstrike : R.titleBattle}
          </Text>
        </View>
        {!finished && !walkover && !isAirstrike ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>{R.skip}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {battleDetailLoading || !battleDetail ? (
        <View style={styles.loader}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : isAirstrike && airstrikeLog ? (
        /* ── Airstrike summary card (no dice) ── */
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <AirstrikeCard
            log={airstrikeLog}
            playerIsAttacker={playerIsAttacker}
            onBack={() => navigation.goBack()}
          />
        </ScrollView>
      ) : (
        /* ── Standard dice-battle replay ── */
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Force counts */}
          <View style={styles.forcesRow}>
            <View style={styles.forceBox}>
              <Text style={[styles.forceLabel, { color: C.own }]}>{R.attacker}</Text>
              <Text style={styles.forceCount}>
                {t(R.units, {
                  count:
                    (diceBattleLog as { attacker_units_start?: number } | null)
                      ?.attacker_units_start ?? 0,
                })}
              </Text>
            </View>
            <VsBadge animKey={battleDetail.id ? 1 : 0} />
            <View style={styles.forceBox}>
              <Text style={[styles.forceLabel, { color: C.foreign }]}>{R.defender}</Text>
              <Text style={styles.forceCount}>
                {t(R.units, {
                  count:
                    (diceBattleLog as { defender_units_start?: number } | null)
                      ?.defender_units_start ?? 0,
                })}
              </Text>
            </View>
          </View>

          {walkover ? (
            <View style={styles.walkoverCard}>
              <Ionicons name="walk" size={36} color={C.warning} />
              <Text style={styles.walkoverText}>{R.walkover}</Text>
            </View>
          ) : currentRound ? (
            <>
              <Text style={styles.roundLabel}>
                {t(R.round, { current: currentRound.round, total: rounds.length })}
              </Text>
              <View style={styles.battleRow}>
                <SideColumn
                  label={R.atkShort}
                  color={C.own}
                  round={currentRound}
                  side="atk"
                  animKey={roundIndex}
                  rolling={rolling}
                />
                <View style={styles.swords}>
                  <Ionicons name="flash" size={20} color={C.accent} />
                </View>
                <SideColumn
                  label={R.defShort}
                  color={C.foreign}
                  round={currentRound}
                  side="def"
                  animKey={roundIndex}
                  rolling={rolling}
                />
              </View>

              {/* Effects */}
              {currentRound.effects && currentRound.effects.length > 0 ? (
                <View style={styles.effectsWrap}>
                  {currentRound.effects.map((e, i) => (
                    <View
                      key={i}
                      style={[
                        styles.effectBanner,
                        e.cancelled != null ? styles.effectBannerCancelled : null,
                      ]}
                    >
                      <Ionicons
                        name={e.cancelled != null ? 'close-circle' : 'sparkles'}
                        size={14}
                        color={e.cancelled != null ? C.textSecondary : C.warning}
                      />
                      <Text style={styles.effectText}>{effectLabel(e)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Casualty */}
              {currentRound.casualty ? (
                <View style={styles.casualtyBanner}>
                  <Ionicons name="skull" size={14} color={C.enemy} />
                  <Text style={styles.casualtyText}>
                    {t(
                      currentRound.casualty.side === 'atk'
                        ? R.casualtyAttacker
                        : R.casualtyDefender,
                      { unit: prettifyDefinitionId(currentRound.casualty.definition_id) },
                    )}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          {/* Final banner + balance summary */}
          {finished ? (
            <>
              <ResultBanner playerWon={playerWon} onBack={() => navigation.goBack()}>
                {battleDetail.loot?.dice_drop ? (
                  <View style={styles.lootRow}>
                    <Ionicons name="dice" size={18} color={C.accent} />
                    <Text style={styles.lootText}>
                      {t(R.loot, { name: prettifyDefinitionId(battleDetail.loot.dice_drop) })}
                    </Text>
                  </View>
                ) : null}
              </ResultBanner>

              {diceBattleLog && !walkover ? (
                <BattleSummaryCard log={diceBattleLog as CommanderDiceBattleLog} />
              ) : null}
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeBtn: { padding: SPACING.xs },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  headerRight: { width: 48 },
  skipBtn: { width: 48, alignItems: 'flex-end' },
  skipText: { color: C.accent, fontWeight: '700', fontSize: FONT_SIZE.sm },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },

  forcesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  forceBox: { flex: 1, alignItems: 'center' },
  forceLabel: { fontSize: FONT_SIZE.xs, fontWeight: '800', letterSpacing: 1.5 },
  forceCount: { fontSize: FONT_SIZE.sm, color: C.text, marginTop: 2 },
  vs: { color: C.textSecondary, fontWeight: '800', fontSize: FONT_SIZE.md, marginHorizontal: SPACING.sm },

  roundLabel: {
    textAlign: 'center',
    color: C.textSecondary,
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  battleRow: { flexDirection: 'row', alignItems: 'center' },
  column: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 150,
  },
  colLabel: { fontSize: FONT_SIZE.xs, fontWeight: '800', letterSpacing: 1.5 },
  unitName: { fontSize: FONT_SIZE.sm, color: C.text, fontWeight: '600', marginTop: 2, marginBottom: SPACING.sm },
  diceRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', justifyContent: 'center' },
  modRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  chipText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  total: { fontSize: FONT_SIZE.xxl, fontWeight: '900', marginTop: SPACING.sm },
  swords: { width: 36, alignItems: 'center' },

  effectsWrap: { marginTop: SPACING.md, gap: SPACING.xs },
  effectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${C.warning}14`,
    borderWidth: 1,
    borderColor: `${C.warning}40`,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  effectBannerCancelled: {
    backgroundColor: C.surface,
    borderColor: C.border,
  },
  effectText: { color: C.text, fontSize: FONT_SIZE.sm, flex: 1 },

  casualtyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${C.enemy}14`,
    borderWidth: 1,
    borderColor: `${C.enemy}40`,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginTop: SPACING.sm,
  },
  casualtyText: { color: C.text, fontSize: FONT_SIZE.sm, fontWeight: '600' },

  walkoverCard: {
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: SPACING.xl,
  },
  walkoverText: { color: C.text, fontSize: FONT_SIZE.md, fontWeight: '600', textAlign: 'center' },

  finalWrap: { alignItems: 'center', marginTop: SPACING.xl, gap: SPACING.md },
  finalBanner: {
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
  },
  finalText: { fontSize: FONT_SIZE.xxl, fontWeight: '900', letterSpacing: 2 },
  lootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${C.accent}14`,
    borderWidth: 1,
    borderColor: `${C.accent}40`,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  lootText: { color: C.accent, fontWeight: '700', fontSize: FONT_SIZE.md },
  doneBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: C.accent,
    backgroundColor: `${C.accent}14`,
    marginTop: SPACING.sm,
  },
  doneBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: C.accent, letterSpacing: 0.5 },

  // Battle balance summary
  summaryCard: {
    marginTop: SPACING.xl,
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: SPACING.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryTitle: { color: C.text, fontWeight: '800', fontSize: FONT_SIZE.sm, letterSpacing: 0.5 },
  summaryRow: { gap: SPACING.xs },
  summarySide: { fontSize: FONT_SIZE.sm, fontWeight: '800', letterSpacing: 1 },
  summaryCells: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryCellLabel: { fontSize: FONT_SIZE.xs, color: C.textSecondary, marginBottom: 2 },
  summaryCellValue: { fontSize: FONT_SIZE.lg, fontWeight: '900', color: C.text },
  summaryDivider: { height: 1, backgroundColor: C.border, marginVertical: SPACING.sm },
  summaryMeta: {
    marginTop: SPACING.md,
    textAlign: 'center',
    color: C.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },

  // Airstrike summary card
  airstrikeHeader: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  airstrikeTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: C.text,
    letterSpacing: 1.5,
  },
  airstrikeMeta: {
    fontSize: FONT_SIZE.sm,
    color: C.textSecondary,
    fontWeight: '600',
  },
  airstrikeResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  airstrikeResultText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});

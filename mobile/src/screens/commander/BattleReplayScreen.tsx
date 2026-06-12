import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import type {
  CommanderBattleRound,
  CommanderBattleEffect,
  CommanderAirstrikeBattleLog,
  AirstrikeResult,
} from '../../services/api';

const C = COMMANDER_COLORS;
const ROUND_MS = 800;

// ─── Dice value pop-in cell ─────────────────────────────────────────────────────

function DieValue({ value, color, animKey }: { value: number; color: string; animKey: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.setValue(0.3);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [animKey, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.die,
        { borderColor: color, backgroundColor: `${color}1A`, transform: [{ scale }], opacity },
      ]}
    >
      <Text style={[styles.dieText, { color }]}>{value}</Text>
    </Animated.View>
  );
}

// ─── Side column ─────────────────────────────────────────────────────────────────

function SideColumn({
  label,
  color,
  round,
  side,
  animKey,
}: {
  label: string;
  color: string;
  round: CommanderBattleRound;
  side: 'atk' | 'def';
  animKey: number;
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
          <DieValue key={`${animKey}-${i}`} value={r} color={color} animKey={animKey} />
        ))}
      </View>
      <View style={styles.modRow}>
        {data.bonus !== 0 ? (
          <View style={[styles.chip, { borderColor: color }]}>
            <Text style={[styles.chipText, { color }]}>
              {data.bonus > 0 ? `+${data.bonus}` : data.bonus} bonus
            </Text>
          </View>
        ) : null}
        {data.modifier !== 0 ? (
          <View style={[styles.chip, { borderColor: color }]}>
            <Text style={[styles.chipText, { color }]}>
              {data.modifier > 0 ? `+${data.modifier}` : data.modifier} mod
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.total, { color }]}>{data.total}</Text>
    </View>
  );
}

function effectLabel(e: CommanderBattleEffect): string {
  const who = e.side === 'atk' ? 'Attacker' : 'Defender';
  if (e.effect === 'cancel_highest') {
    return `${who}'s shield die cancels a ${e.cancelled ?? '?'}!`;
  }
  return `${who}: ${prettifyDefinitionId(e.effect)}`;
}

// ─── Airstrike result summary card ────────────────────────────────────────────

function airstrikeResultLine(result: AirstrikeResult): string {
  if ('shield_broken' in result && result.shield_broken) {
    return 'Shield destroyed!';
  }
  if ('building_hit' in result) {
    const h = result.building_hit;
    return h.destroyed
      ? `${h.type} destroyed!`
      : `${h.type} hit — ${h.hp_after} HP remaining.`;
  }
  return 'No targets — strike wasted.';
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
  const hit = 'shield_broken' in log.result || 'building_hit' in log.result;
  const playerWon = playerIsAttacker && hit;
  const resultLine = airstrikeResultLine(log.result);

  return (
    <View style={styles.scroll}>
      {/* Airstrike banner */}
      <View style={styles.airstrikeHeader}>
        <Ionicons name="rocket" size={40} color={C.warning} />
        <Text style={styles.airstrikeTitle}>Airstrike</Text>
        <Text style={styles.airstrikeMeta}>Silo Tier {log.silo_tier} · {log.damage} damage</Text>
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
      <View style={styles.finalWrap}>
        <View
          style={[
            styles.finalBanner,
            {
              borderColor: playerWon ? C.own : C.enemy,
              backgroundColor: playerWon ? `${C.own}1A` : `${C.enemy}1A`,
            },
          ]}
        >
          <Ionicons
            name={playerWon ? 'trophy' : 'sad'}
            size={40}
            color={playerWon ? C.warning : C.enemy}
          />
          <Text style={[styles.finalText, { color: playerWon ? C.own : C.enemy }]}>
            {playerWon ? 'VICTORY' : 'DEFEAT'}
          </Text>
        </View>

        <TouchableOpacity style={styles.doneBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BattleReplayScreen({ navigation, route }: BattleReplayScreenProps) {
  const { battleId } = route.params;
  const { battleDetail, battleDetailLoading, fetchBattle, clearBattleDetail } = useCommanderStore();
  const userId = useAuthStore((s) => s.user?.id);

  const [roundIndex, setRoundIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchBattle(battleId);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
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

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
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
          <Text style={styles.headerTitle}>{isAirstrike ? 'Airstrike Report' : 'Battle Replay'}</Text>
        </View>
        {!finished && !walkover && !isAirstrike ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
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
              <Text style={[styles.forceLabel, { color: C.own }]}>ATTACKER</Text>
              <Text style={styles.forceCount}>
                {(diceBattleLog as { attacker_units_start?: number } | null)?.attacker_units_start ?? 0} units
              </Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.forceBox}>
              <Text style={[styles.forceLabel, { color: C.foreign }]}>DEFENDER</Text>
              <Text style={styles.forceCount}>
                {(diceBattleLog as { defender_units_start?: number } | null)?.defender_units_start ?? 0} units
              </Text>
            </View>
          </View>

          {walkover ? (
            <View style={styles.walkoverCard}>
              <Ionicons name="walk" size={36} color={C.warning} />
              <Text style={styles.walkoverText}>Walkover — no defenders present.</Text>
            </View>
          ) : currentRound ? (
            <>
              <Text style={styles.roundLabel}>
                Round {currentRound.round} / {rounds.length}
              </Text>
              <View style={styles.battleRow}>
                <SideColumn
                  label="ATK"
                  color={C.own}
                  round={currentRound}
                  side="atk"
                  animKey={roundIndex}
                />
                <View style={styles.swords}>
                  <Ionicons name="flash" size={20} color={C.accent} />
                </View>
                <SideColumn
                  label="DEF"
                  color={C.foreign}
                  round={currentRound}
                  side="def"
                  animKey={roundIndex}
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
                    {currentRound.casualty.side === 'atk' ? 'Attacker' : 'Defender'} loses{' '}
                    {prettifyDefinitionId(currentRound.casualty.definition_id)}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          {/* Final banner */}
          {finished ? (
            <View style={styles.finalWrap}>
              <View
                style={[
                  styles.finalBanner,
                  { borderColor: playerWon ? C.own : C.enemy, backgroundColor: playerWon ? `${C.own}1A` : `${C.enemy}1A` },
                ]}
              >
                <Ionicons
                  name={playerWon ? 'trophy' : 'sad'}
                  size={40}
                  color={playerWon ? C.warning : C.enemy}
                />
                <Text style={[styles.finalText, { color: playerWon ? C.own : C.enemy }]}>
                  {playerWon ? 'VICTORY' : 'DEFEAT'}
                </Text>
              </View>

              {battleDetail.loot?.dice_drop ? (
                <View style={styles.lootRow}>
                  <Ionicons name="dice" size={18} color={C.accent} />
                  <Text style={styles.lootText}>
                    Loot: {prettifyDefinitionId(battleDetail.loot.dice_drop)}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
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
  vs: { color: C.textSecondary, fontWeight: '800', fontSize: FONT_SIZE.sm, marginHorizontal: SPACING.sm },

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
  die: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieText: { fontWeight: '800', fontSize: FONT_SIZE.md },
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

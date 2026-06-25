import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Theme, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
import { strings as S, t } from '../i18n';
import { formatArea, formatXP } from '../utils/formatters';
import type { ClaimResult as ClaimResultType } from '../utils/types';
import { fx } from '../services/fx';
import { ParticleBurst } from './fx/ParticleBurst';
import { useReducedMotion } from './fx/useReducedMotion';
import { useTeachStore } from '../store/teachStore';

interface ClaimResultProps {
  /** The claim result data. */
  result: ClaimResultType;
  /** Callback when "View Territory" is pressed. */
  onViewTerritory?: () => void;
  /** Callback to dismiss the overlay. */
  onDismiss: () => void;
}

/**
 * Animated overlay shown after completing a route claim.
 * Displays area claimed, XP earned, and multiplier breakdowns with celebration effects.
 */
const ClaimResult: React.FC<ClaimResultProps> = ({
  result,
  onViewTerritory,
  onDismiss,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const xpCountAnim = useRef(new Animated.Value(0)).current;
  const starBurst1 = useRef(new Animated.Value(0)).current;
  const starBurst2 = useRef(new Animated.Value(0)).current;
  const starBurst3 = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const [burst, setBurst] = useState(0);
  const showTeach = useTeachStore((s) => s.showTeach);

  // First claim ever: explain decay after the victory moment has played, so the
  // celebration and the hint do not fight for the screen. No-op on later claims.
  useEffect(() => {
    const id = setTimeout(() => showTeach('claim'), 1400);
    return () => clearTimeout(id);
  }, [showTeach]);

  useEffect(() => {
    // Juice: sound + haptic + particle/shake celebration on claim success.
    fx.victory();
    if (!reduced) {
      setBurst(Date.now());
      Animated.sequence([
        Animated.delay(360),
        Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0.6, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]).start();
    }

    // Entrance animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // XP count-up animation
    Animated.timing(xpCountAnim, {
      toValue: result.xp,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Star burst particles
    const burstDelay = 400;
    [starBurst1, starBurst2, starBurst3].forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(burstDelay + index * 200),
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, [fadeAnim, scaleAnim, xpCountAnim, starBurst1, starBurst2, starBurst3, result.xp]);

  const calc = result.calculation;

  const renderMultiplier = (label: string, value: number, icon: keyof typeof Ionicons.glyphMap) => {
    if (value <= 1.0 && label !== S.components.claimResult.baseArea) return null;
    return (
      <View style={styles.multiplierRow} key={label}>
        <View style={styles.multiplierLeft}>
          <Ionicons name={icon} size={14} color={theme.textSecondary} />
          <Text style={styles.multiplierLabel}>{label}</Text>
        </View>
        <Text style={styles.multiplierValue}>
          {label === S.components.claimResult.baseArea ? formatArea(value) : `x${value.toFixed(2)}`}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }, { translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] }) }] },
        ]}
      >
        {/* Celebration header */}
        <View style={styles.header}>
          {/* Star particles */}
          {[starBurst1, starBurst2, starBurst3].map((anim, i) => {
            const rotation = [-30, 0, 30][i];
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -20 - i * 10],
            });
            const opacity = anim.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0, 1, 0.6],
            });
            return (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  top: 10,
                  opacity,
                  transform: [
                    { translateY },
                    { rotate: `${rotation}deg` },
                    { scale: anim },
                  ],
                }}
              >
                <Ionicons name="star" size={16} color={theme.warning} />
              </Animated.View>
            );
          })}

          <View style={styles.trophyCircle}>
            <Ionicons name="flag" size={32} color={theme.accent} />
          </View>

          <Text style={styles.title}>{S.components.claimResult.title}</Text>
        </View>

        {/* XP earned */}
        <View style={styles.xpContainer}>
          <Ionicons name="star" size={20} color={theme.warning} />
          <Text style={styles.xpValue}>{t(S.components.claimResult.xpEarned, { xp: formatXP(result.xp) })}</Text>
        </View>

        {/* Area claimed */}
        {calc.finalArea > 0 && (
          <View style={styles.areaContainer}>
            <Ionicons name="map-outline" size={16} color={theme.primary} />
            <Text style={styles.areaText}>{formatArea(calc.finalArea)}</Text>
          </View>
        )}

        {/* Multiplier breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>{S.components.claimResult.breakdown}</Text>
          {renderMultiplier(S.components.claimResult.baseArea, calc.baseArea, 'map-outline')}
          {renderMultiplier(S.components.claimResult.classBonus, calc.classMultiplier, 'footsteps-outline')}
          {renderMultiplier(S.components.claimResult.weatherBonus, calc.weatherMultiplier, 'cloudy-outline')}
          {renderMultiplier(S.components.claimResult.streakBonus, calc.streakMultiplier, 'flame-outline')}
          {calc.contestedBonus > 0 && (
            <View style={styles.multiplierRow}>
              <View style={styles.multiplierLeft}>
                <Ionicons name="flash-outline" size={14} color={theme.danger} />
                <Text style={styles.multiplierLabel}>{S.components.claimResult.contestedBonus}</Text>
              </View>
              <Text style={[styles.multiplierValue, { color: theme.danger }]}>
                +{calc.contestedBonus.toFixed(0)}
              </Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          {result.territory && onViewTerritory && (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={onViewTerritory}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={18} color={theme.bg} />
              <Text style={styles.viewButtonText}>{S.components.claimResult.viewTerritory}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissButtonText}>{S.common.done}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      <ParticleBurst fireKey={burst} />
    </Animated.View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.xl,
    width: '88%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: theme.text,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
  },
  xpValue: {
    color: theme.warning,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  areaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  areaText: {
    color: theme.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  breakdownContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  breakdownTitle: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  multiplierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  multiplierLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  multiplierValue: {
    color: theme.accent,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  viewButtonText: {
    color: theme.bg,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  dismissButton: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  dismissButtonText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});

export default React.memo(ClaimResult);

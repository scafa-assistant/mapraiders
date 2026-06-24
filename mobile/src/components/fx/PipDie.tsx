import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { fx } from '../../services/fx';
import { useReducedMotion } from './useReducedMotion';

/**
 * A single battle die rendered with REAL eye pips (1-6 as a dot raster, not a
 * number). On mount it pops in (spring) and, when `rolling` is true, it shakes
 * (Animated translate) and fires a per-step `fx.tick()` rattle. RN-core only.
 *
 * Pip layout uses a fixed 3x3 grid; `PIP_MAP` marks which cells are filled for
 * each value, the classic dice face arrangement.
 */

// 3x3 grid cells (index 0..8): which are lit for each die value 1-6.
const PIP_MAP: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface PipDieProps {
  /** The face value 1-6 (values outside the range fall back to a single pip). */
  value: number;
  /** Pip + border color. */
  color: string;
  /** Changing this re-triggers the pop-in (e.g. the replay round index). */
  animKey: number;
  /** While true, the die shakes and rattles (tick) per step. */
  rolling?: boolean;
  /** Edge length of the die in px. Default 34. */
  size?: number;
}

export function PipDie({ value, color, animKey, rolling = false, size = 34 }: PipDieProps) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const shakeLoop = useRef<Animated.CompositeAnimation | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pop-in whenever the round changes.
  useEffect(() => {
    if (reduced) {
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }
    scale.setValue(0.3);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [animKey, reduced, scale, opacity]);

  // Shake + rattle while rolling.
  useEffect(() => {
    const stopShake = () => {
      shakeLoop.current?.stop();
      shakeLoop.current = null;
      Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }).start();
      if (tickTimer.current) {
        clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
    };

    if (!rolling || reduced) {
      stopShake();
      return stopShake;
    }

    const seq = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
      ]),
    );
    shakeLoop.current = seq;
    seq.start();
    // Rattle haptic/sound per roll step (settings-gated inside fx).
    fx.tick();
    tickTimer.current = setInterval(() => fx.tick(), 150);

    return stopShake;
  }, [rolling, reduced, shake]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-2.5, 2.5] });
  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });

  const lit = PIP_MAP[value] ?? PIP_MAP[1];
  const pip = Math.max(3, Math.round(size * 0.16));
  const gap = Math.round(size * 0.1);

  return (
    <Animated.View
      style={[
        styles.die,
        {
          width: size,
          height: size,
          borderColor: color,
          backgroundColor: `${color}1A`,
          opacity,
          transform: [{ scale }, { translateX }, { rotate }],
        },
      ]}
    >
      <View style={[styles.grid, { padding: gap }]}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={[styles.cell]}>
            {lit.includes(i) ? (
              <View
                style={{ width: pip, height: pip, borderRadius: pip / 2, backgroundColor: color }}
              />
            ) : null}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  die: {
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
  },
  cell: {
    width: '33.33%',
    height: '33.33%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PipDie;

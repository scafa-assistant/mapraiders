import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

// System / faction colors (same palette as the landing page and map systems).
const COLORS = ['#1558F0', '#D7263D', '#1B9E5A', '#F5A623', '#5C8BFF', '#FFB23E'];
const COUNT = 26;

interface Particle {
  id: number;
  ang: number;
  dist: number;
  rot: number;
  size: number;
  color: string;
  square: boolean;
}

/** Deterministic pseudo-random so a given seed always yields the same burst. */
function buildParticles(seed: number): Particle[] {
  const rand = (i: number, n: number) => {
    const x = Math.sin(seed * 97.13 + i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return Array.from({ length: COUNT }).map((_, i) => {
    const ang = (Math.PI * 2 * i) / COUNT + (rand(i, 1) - 0.5) * 0.4;
    return {
      id: i,
      ang,
      dist: 70 + rand(i, 2) * 120,
      rot: rand(i, 3) * 720 - 360,
      size: 6 + rand(i, 4) * 8,
      color: COLORS[i % COLORS.length],
      square: rand(i, 5) > 0.5,
    };
  });
}

interface ParticleBurstProps {
  /**
   * Change this to a new truthy number to fire a burst. Use Date.now() or an
   * incrementing counter. A value of 0 / falsy never fires.
   */
  fireKey: number;
}

/**
 * Fire-and-forget particle explosion overlay. Bursts 26 colored shards from the
 * center, flying out, spinning and fading over ~0.9s. Self-clears and respects
 * reduce-motion (renders nothing). Place inside a full-bleed parent; it does not
 * capture touches.
 */
export function ParticleBurst({ fireKey }: ParticleBurstProps) {
  const reduced = useReducedMotion();
  const [parts, setParts] = useState<Particle[]>([]);
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fireKey || reduced) return;
    setParts(buildParticles(fireKey));
    t.setValue(0);
    Animated.timing(t, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setParts([]));
  }, [fireKey, reduced, t]);

  if (!parts.length) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.center}>
        {parts.map((p) => {
          const translateX = t.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(p.ang) * p.dist],
          });
          const translateY = t.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.sin(p.ang) * p.dist],
          });
          const opacity = t.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [1, 1, 0],
          });
          const rotate = t.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${p.rot}deg`],
          });
          const scale = t.interpolate({
            inputRange: [0, 0.2, 1],
            outputRange: [0.2, 1, 0.6],
          });
          return (
            <Animated.View
              key={p.id}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: p.square ? 2 : p.size / 2,
                backgroundColor: p.color,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }, { scale }],
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', left: '50%', top: '50%' },
});

export default ParticleBurst;

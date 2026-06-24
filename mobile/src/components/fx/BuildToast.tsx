import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from './useReducedMotion';

const ACCENT = '#1558F0';

interface BuildToastProps {
  /**
   * The message to show. When this changes to a non-empty string the banner
   * flies in, holds, then fades out. Set back to null/'' once dismissed.
   */
  message: string | null;
  /**
   * Bumps every time a build succeeds so an identical message can re-trigger
   * the banner. Use Date.now() or an incrementing counter.
   */
  fireKey: number;
  /** Called after the toast has fully faded out so the parent can clear state. */
  onDone: () => void;
}

/**
 * Local, screen-scoped confirmation banner. Flies in from the top, holds for
 * about 1.6s, then fades out. Pure RN-core Animated, no global toast system.
 * Respects reduce-motion: no slide, just a fade (still time-limited).
 */
export function BuildToast({ message, fireKey, onDone }: BuildToastProps) {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fireKey || !message) return;
    anim.setValue(0);
    const sequence = Animated.sequence([
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: reduced ? 0 : 9,
      }),
      Animated.delay(1600),
      Animated.timing(anim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]);
    sequence.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => sequence.stop();
  }, [fireKey, message, reduced, anim, onDone]);

  if (!message) return null;

  const translateY = reduced
    ? 0
    : anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] });

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View style={[styles.banner, { opacity: anim, transform: [{ translateY }] }]}>
        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        <Text style={styles.text} numberOfLines={1}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '90%',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
});

export default BuildToast;

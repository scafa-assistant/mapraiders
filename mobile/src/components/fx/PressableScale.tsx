import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { fx } from '../../services/fx';
import { useReducedMotion } from './useReducedMotion';

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Scale at full press. Default 0.95. */
  scaleTo?: number;
  /** Tactile feedback on press in. 'tick' (default), 'soft', or 'none'. */
  feedback?: 'tick' | 'soft' | 'none';
  disabled?: boolean;
  hitSlop?: PressableProps['hitSlop'];
  accessibilityLabel?: string;
  accessibilityRole?: PressableProps['accessibilityRole'];
}

/**
 * A Pressable that springs down on press (the "juice" every button gets) and
 * fires a light sound + haptic. Drop-in around any tappable surface. Respects
 * reduce-motion (no scale) and the sound/haptic settings (via fx).
 */
export function PressableScale({
  children,
  onPress,
  onPressIn,
  onLongPress,
  style,
  scaleTo = 0.95,
  feedback = 'tick',
  disabled,
  hitSlop,
  accessibilityLabel,
  accessibilityRole = 'button',
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();

  const animateTo = (value: number) => {
    if (reduced) return;
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      onPressIn={() => {
        animateTo(scaleTo);
        if (feedback === 'tick') fx.tick();
        else if (feedback === 'soft') fx.soft();
        onPressIn?.();
      }}
      onPressOut={() => animateTo(1)}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default PressableScale;

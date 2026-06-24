import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

interface PopInProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * When true the content springs in from scale 0 -> 1 on mount. When false it
   * renders at full scale immediately (use for items that were already there).
   * Reduce-motion always forces the immediate path.
   */
  animate?: boolean;
}

/**
 * Spring "pop" entrance for a freshly added item (e.g. a newly built building
 * card). Pure RN-core Animated. Reduce-motion safe: no bounce, instantly
 * visible at full scale.
 */
export function PopIn({ children, style, animate = false }: PopInProps) {
  const reduced = useReducedMotion();
  const shouldAnimate = animate && !reduced;
  const scale = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;

  useEffect(() => {
    if (!shouldAnimate) {
      scale.setValue(1);
      return;
    }
    scale.setValue(0);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 12,
    }).start();
  }, [shouldAnimate, scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

export default PopIn;

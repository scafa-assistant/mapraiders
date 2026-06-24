import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tracks the OS "reduce motion" accessibility setting. Decorative motion
 * (particles, shake, parallax) must be skipped when this is true. Sound and
 * haptics are gated separately via the settings store.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduced(!!v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) =>
      setReduced(!!v)
    );
    return () => {
      mounted = false;
      // RN >= 0.65 returns a subscription with remove()
      sub?.remove?.();
    };
  }, []);

  return reduced;
}

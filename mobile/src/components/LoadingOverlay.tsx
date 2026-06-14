import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, Easing, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE } from '../utils/constants';

interface LoadingOverlayProps {
  /** Whether the overlay is visible. */
  visible: boolean;
  /** Optional message to display below the spinner. */
  message?: string;
}

/**
 * Full-screen loading overlay with a semi-transparent dark backdrop,
 * animated spinner, and optional message text.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Custom spinner rotation
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spin.start();

      return () => spin.stop();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, spinAnim]);

  if (!visible) return null;

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="auto">
      <View style={styles.card}>
        {/* Outer ring spinner */}
        <Animated.View
          style={[
            styles.spinnerRing,
            { transform: [{ rotate: rotation }] },
          ]}
        />

        {/* Inner activity indicator */}
        <ActivityIndicator size="large" color={theme.primary} style={styles.spinner} />

        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </Animated.View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(246, 244, 241, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: SPACING.xxl,
    alignItems: 'center',
    minWidth: 160,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  spinnerRing: {
    position: 'absolute',
    top: SPACING.xl,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: theme.primary,
    borderRightColor: 'rgba(21, 88, 240, 0.3)',
  },
  spinner: {
    marginBottom: SPACING.lg,
  },
  message: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    maxWidth: 200,
  },
});

export default React.memo(LoadingOverlay);

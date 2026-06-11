import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE } from '../utils/constants';

interface StatBarProps {
  /** Current value. */
  current: number;
  /** Maximum value (for 100% fill). */
  max: number;
  /** Optional label shown above the bar. */
  label?: string;
  /** Bar fill color. Defaults to the theme primary color. */
  color?: string;
  /** Height of the bar. Defaults to 8. */
  height?: number;
  /** Whether to show the percentage text. Defaults to true. */
  showPercentage?: boolean;
  /** Whether to show the value text (e.g., "500 / 1000"). Defaults to false. */
  showValues?: boolean;
  /** Animation duration in ms. Defaults to 600. */
  animationDuration?: number;
}

/**
 * Animated XP/progress bar component.
 * Fills from left to right with a smooth animation.
 */
const StatBar: React.FC<StatBarProps> = ({
  current,
  max,
  label,
  color,
  height = 8,
  showPercentage = true,
  showValues = false,
  animationDuration = 600,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fillColor = color ?? theme.primary;
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: animationDuration,
      useNativeDriver: false,
    }).start();
  }, [percentage, animatedWidth, animationDuration]);

  // Subtle glow effect when bar is high
  useEffect(() => {
    if (percentage > 80) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      glow.start();
      return () => glow.stop();
    } else {
      glowAnim.setValue(0.4);
    }
  }, [percentage, glowAnim]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrapper}>
      {/* Label and percentage header */}
      {(label || showPercentage || showValues) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          <View style={styles.valueContainer}>
            {showValues && (
              <Text style={styles.valueText}>
                {(current ?? 0).toLocaleString()} / {(max ?? 0).toLocaleString()}
              </Text>
            )}
            {showPercentage && (
              <Text style={[styles.percentageText, { color: fillColor }]}>
                {Math.round(percentage)}%
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Bar track */}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        {/* Animated fill */}
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolated,
              height,
              borderRadius: height / 2,
              backgroundColor: fillColor,
            },
          ]}
        >
          {/* Shine effect */}
          <View style={[styles.shine, { borderRadius: height / 2 }]} />
        </Animated.View>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  valueText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  percentageText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  track: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  fill: {
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export default React.memo(StatBar);

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, RADIUS, SPACING, FONT_SIZE, CLASS_ICONS, CLASS_LABELS, CLASS_COLORS } from '../utils/constants';
import { formatDistance, formatDuration } from '../utils/formatters';
import type { MovementClass } from '../utils/types';

interface RouteRecorderProps {
  /** Whether a route is currently being recorded. */
  isRecording: boolean;
  /** Total distance covered in meters. */
  distance: number;
  /** Duration in seconds. */
  duration: number;
  /** Detected movement class. */
  detectedClass: MovementClass;
  /** Start recording callback. */
  onStart: () => void;
  /** Stop recording callback. */
  onStop: () => void;
}

/**
 * Bottom sheet UI for route recording.
 * Shows current class icon, distance, duration timer, and start/stop button.
 * Animated pulsing red dot when recording.
 */
const RouteRecorder: React.FC<RouteRecorderProps> = ({
  isRecording,
  distance,
  duration,
  detectedClass,
  onStart,
  onStop,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const recordingDotOpacity = useRef(new Animated.Value(1)).current;

  const classColor = CLASS_COLORS[detectedClass] ?? THEME.primary;
  const classIcon = (CLASS_ICONS[detectedClass] ?? 'walk-outline') as keyof typeof Ionicons.glyphMap;
  const classLabel = CLASS_LABELS[detectedClass] ?? 'Unknown';

  // Slide in animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 50,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Pulsing red dot when recording
  useEffect(() => {
    if (!isRecording) {
      recordingDotOpacity.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(recordingDotOpacity, {
          toValue: 0.2,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(recordingDotOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [isRecording, recordingDotOpacity]);

  // Button press animation
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }, { scale: pulseAnim }] },
      ]}
    >
      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingBar}>
          <Animated.View
            style={[styles.recordingDot, { opacity: recordingDotOpacity }]}
          />
          <Text style={styles.recordingText}>RECORDING</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Class indicator */}
        <View style={styles.classSection}>
          <View style={[styles.classIconCircle, { backgroundColor: `${classColor}20` }]}>
            <Ionicons name={classIcon} size={24} color={classColor} />
          </View>
          <Text style={[styles.classLabel, { color: classColor }]}>
            {classLabel}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Ionicons name="resize-outline" size={14} color={THEME.textSecondary} />
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={THEME.textSecondary} />
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        {/* Start/Stop Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isRecording ? styles.stopButton : styles.startButton,
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'play'}
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: 34, // Safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderTopWidth: 1,
    borderColor: THEME.border,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.danger,
  },
  recordingText: {
    color: THEME.danger,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.lg,
  },
  classSection: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  classIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  statsSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: THEME.border,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  startButton: {
    backgroundColor: THEME.accent,
  },
  stopButton: {
    backgroundColor: THEME.danger,
  },
});

export default React.memo(RouteRecorder);

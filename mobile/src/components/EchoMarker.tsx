import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { Echo } from '../utils/types';

// Echo markers are map content: the base color stays fixed regardless of the
// app theme so it always matches the hardcoded rgba(21, 88, 240, …) glow.
const ECHO_BASE_COLOR = '#1558F0';

interface EchoMarkerProps {
  /** The echo data to render. */
  echo: Echo;
  /** Callback when the marker is pressed. */
  onPress: () => void;
  /** Number of likes for color intensity. */
  likes?: number;
}

/**
 * Map marker for an echo.
 * Displays a musical note icon with a pulsing circle showing the audio radius.
 * Color intensity increases with the number of likes.
 */
const EchoMarker: React.FC<EchoMarkerProps> = ({ echo, onPress, likes = 0 }) => {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse opacity animation for the glow ring
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Scale breathing animation
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    scaleAnimation.start();

    return () => {
      pulseAnimation.stop();
      scaleAnimation.stop();
    };
  }, [pulseAnim, scaleAnim]);

  // Color intensity based on likes: more likes = more vivid
  const baseOpacity = Math.min(0.3 + likes * 0.05, 0.7);
  const markerColor = likes > 10 ? '#4B7BFF' : likes > 5 ? '#1558F0' : ECHO_BASE_COLOR;

  return (
    <>
      {/* Audio radius circle */}
      <Circle
        center={{
          latitude: echo.location?.latitude ?? echo.lat ?? 0,
          longitude: echo.location?.longitude ?? echo.lng ?? 0,
        }}
        radius={echo.radius}
        fillColor={`rgba(21, 88, 240, ${baseOpacity * 0.15})`}
        strokeColor={`rgba(21, 88, 240, ${baseOpacity * 0.4})`}
        strokeWidth={1}
      />

      {/* Marker */}
      <Marker
        coordinate={{
          latitude: echo.location?.latitude ?? echo.lat ?? 0,
          longitude: echo.location?.longitude ?? echo.lng ?? 0,
        }}
        onPress={onPress}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <Animated.View
          style={[
            styles.markerContainer,
            {
              opacity: pulseAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Outer glow ring */}
          <View style={[styles.glowRing, { borderColor: markerColor }]}>
            {/* Inner icon circle */}
            <View style={[styles.iconCircle, { backgroundColor: markerColor }]}>
              <Ionicons name="musical-notes" size={16} color="#FFFFFF" />
            </View>
          </View>
        </Animated.View>
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 88, 240, 0.1)',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1558F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default React.memo(EchoMarker);

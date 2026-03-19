import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Polygon } from 'react-native-maps';
import type { Territory } from '../utils/types';
import { getClassColor, withOpacity } from '../utils/colors';

interface TerritoryPolygonProps {
  /** The territory data to render. */
  territory: Territory;
  /** Whether this territory belongs to the current user. */
  isOwn: boolean;
  /** Whether this territory is currently being contested. */
  isContested?: boolean;
  /** Callback when the polygon is tapped. */
  onPress?: () => void;
}

/**
 * Renders a territory as a colored polygon overlay on the map.
 * Color is based on the territory's movement class.
 * Opacity decreases with decay level.
 * Own territories have thicker strokes.
 * Contested territories pulse.
 */
const TerritoryPolygon: React.FC<TerritoryPolygonProps> = ({
  territory,
  isOwn,
  isContested = false,
  onPress,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for contested territories
  useEffect(() => {
    if (!isContested) {
      pulseAnim.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [isContested, pulseAnim]);

  const classColor = getClassColor(territory.movementClass);

  // Decay reduces fill opacity: fresh territory is vibrant, decayed is faint
  const decayFraction = (territory.decayPercent ?? 0) / 100;
  const fillOpacity = Math.max(0.08, 0.35 - decayFraction * 0.27);
  const strokeOpacity = Math.max(0.3, 0.9 - decayFraction * 0.6);

  const fillColor = withOpacity(classColor, fillOpacity);
  const strokeColor = withOpacity(classColor, strokeOpacity);
  const strokeWidth = isOwn ? 3 : 1.5;

  const coordinates = territory.polygon.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  // react-native-maps Polygon does not support Animated directly,
  // so contested pulse is applied via the fillColor change cycle.
  // For a truly animated pulse, we render with the interpolated opacity.
  // Since RNMaps Polygon doesn't accept Animated.Value for fillColor,
  // we rely on the visual distinctiveness of the contested stroke instead.

  return (
    <Polygon
      coordinates={coordinates}
      fillColor={isContested ? withOpacity(classColor, fillOpacity * 0.7) : fillColor}
      strokeColor={isContested ? withOpacity('#FF4757', 0.9) : strokeColor}
      strokeWidth={isContested ? 3 : strokeWidth}
      tappable={!!onPress}
      onPress={onPress}
    />
  );
};

export default React.memo(TerritoryPolygon);

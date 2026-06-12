import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Ellipse, Polygon as SvgPolygon, Circle as SvgCircle, Line, Path } from 'react-native-svg';
import type { PvESpawn, NpcType } from '../store/pveStore';

// Vril brand palette
const VRIL_PRIMARY = '#7B61FF';
const VRIL_ACCENT = '#9D4EDD';
const VRIL_GLOW = 'rgba(123, 97, 255, 0.18)';

/** SVG icon for each NPC type, rendered at 24×24 */
function NpcIcon({ npcType }: { npcType: NpcType }) {
  switch (npcType) {
    case 'scout_disc':
      // Floating disc / ellipse
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Ellipse cx={12} cy={14} rx={10} ry={4} fill={VRIL_ACCENT} opacity={0.9} />
          <Ellipse cx={12} cy={12} rx={6} ry={3} fill="#FFFFFF" opacity={0.8} />
          <Ellipse cx={12} cy={11} rx={3} ry={1.5} fill={VRIL_PRIMARY} />
        </Svg>
      );
    case 'tech_drone':
      // Triangle / drone shape
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <SvgPolygon points="12,3 22,20 2,20" fill={VRIL_ACCENT} opacity={0.9} />
          <SvgPolygon points="12,8 18,18 6,18" fill="#FFFFFF" opacity={0.5} />
          <SvgCircle cx={12} cy={15} r={2} fill={VRIL_PRIMARY} />
        </Svg>
      );
    case 'aether_leech':
      // Circle with root-like lines radiating out
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <SvgCircle cx={12} cy={12} r={7} fill={VRIL_ACCENT} opacity={0.85} />
          <SvgCircle cx={12} cy={12} r={4} fill="#1A0E2E" opacity={0.7} />
          {/* Tentacle lines */}
          <Line x1={12} y1={5} x2={8} y2={1} stroke={VRIL_PRIMARY} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={12} y1={5} x2={16} y2={1} stroke={VRIL_PRIMARY} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={5} y1={12} x2={1} y2={9} stroke={VRIL_PRIMARY} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={5} y1={12} x2={1} y2={15} stroke={VRIL_PRIMARY} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={19} y1={12} x2={23} y2={9} stroke={VRIL_PRIMARY} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={19} y1={12} x2={23} y2={15} stroke={VRIL_PRIMARY} strokeWidth={1.5} strokeLinecap="round" />
          <SvgCircle cx={12} cy={12} r={2} fill={VRIL_PRIMARY} />
        </Svg>
      );
    case 'water_strider_source':
      // Hexagon — water tint
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <SvgPolygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#4E9DDD" opacity={0.85} />
          <SvgPolygon points="12,6 17,9 17,15 12,18 7,15 7,9" fill="#FFFFFF" opacity={0.4} />
          <SvgCircle cx={12} cy={12} r={2.5} fill="#4E9DDD" />
        </Svg>
      );
    case 'forest_construct_source':
      // Hexagon — forest tint
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <SvgPolygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#4EDD7A" opacity={0.85} />
          <SvgPolygon points="12,6 17,9 17,15 12,18 7,15 7,9" fill="#FFFFFF" opacity={0.4} />
          <SvgCircle cx={12} cy={12} r={2.5} fill="#4EDD7A" />
        </Svg>
      );
    default:
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <SvgCircle cx={12} cy={12} r={9} fill={VRIL_ACCENT} opacity={0.85} />
        </Svg>
      );
  }
}

/** Small level dots (1–3) below the marker */
function LevelDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <View style={styles.dotsRow}>
      {([1, 2, 3] as const).map((i) => (
        <View
          key={i}
          style={[styles.dot, i <= level ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

interface PvESpawnMarkerProps {
  spawn: PvESpawn;
  onPress: () => void;
}

/**
 * Map marker for a PvE spawn.
 * Pulsing violet glow (Vril brand), NPC-type SVG icon, level dots.
 */
const PvESpawnMarker: React.FC<PvESpawnMarkerProps> = ({ spawn, onPress }) => {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.18,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1600,
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

  // Higher-level spawns get a slightly more intense glow
  const glowColor =
    spawn.level === 3 ? '#C77DFF' : spawn.level === 2 ? VRIL_ACCENT : VRIL_PRIMARY;

  return (
    <Marker
      coordinate={{ latitude: spawn.latitude, longitude: spawn.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.wrapper}>
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
          <View style={[styles.glowRing, { borderColor: glowColor }]}>
            {/* Inner icon circle */}
            <View style={[styles.iconCircle, { backgroundColor: glowColor }]}>
              <NpcIcon npcType={spawn.npc_type} />
            </View>
          </View>
        </Animated.View>
        <LevelDots level={spawn.level} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VRIL_GLOW,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: VRIL_PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    backgroundColor: VRIL_PRIMARY,
  },
  dotInactive: {
    backgroundColor: 'rgba(123, 97, 255, 0.25)',
  },
});

export default React.memo(PvESpawnMarker);

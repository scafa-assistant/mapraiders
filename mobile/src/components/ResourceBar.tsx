import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import type { ResourceBalances } from '../store/resourceStore';
import { useReducedMotion } from './fx/useReducedMotion';

// Green gain-pulse color, settles back to the normal value color.
const GAIN_GREEN = '#1B9E5A';
const VALUE_COLOR = '#141210';

/**
 * A single HUD value that briefly scales up and flashes green whenever its
 * number INCREASES (resource gain). Decreases and first render are silent.
 * Respects reduce-motion (snaps to the value, no pulse).
 */
const PulseValue: React.FC<{ value: number; text: string }> = ({ value, text }) => {
  const reduced = useReducedMotion();
  const prev = useRef(value);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rose = value > prev.current;
    prev.current = value;
    if (!rose || reduced) return;
    pulse.setValue(0);
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, reduced, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const color = pulse.interpolate({ inputRange: [0, 1], outputRange: [VALUE_COLOR, GAIN_GREEN] });

  return (
    <Animated.Text style={[styles.value, { color, transform: [{ scale }] }]}>{text}</Animated.Text>
  );
};

// ─── Vril palette (shared with PvESpawnMarker / PvEIntroCards) ───────────────
const VRIL_ACCENT = '#1558F0';
const OBSIDIAN = 'rgba(255, 255, 255, 0.92)';
const OBSIDIAN_BORDER = '#C0BAB4';

// ─── Compact number formatter: 1234 → "1.2k", 1200000 → "1.2m" ─────────────
function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Unified mono-line vector icons (one stroke weight, per-resource tint) ────
// Replaces the mixed emoji/text glyphs so the whole bar reads as one icon set.
const ICON_COLORS: Record<keyof ResourceBalances, string> = {
  energy: '#F5A623',
  tech: '#1558F0',
  intel: '#1558F0',
  wood: '#A06A3C',
  stone: '#6B7280',
  food: '#1B9E5A',
};

const ResourceIcon: React.FC<{ resource: keyof ResourceBalances; size: number }> = ({ resource, size }) => {
  const c = ICON_COLORS[resource];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {resource === 'energy' && (
        <Path d="M13 2 L5 13 L11 13 L11 22 L19 10 L13 10 Z" fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {resource === 'tech' && (
        <>
          <Path d="M12 3 L19 7.5 L19 16.5 L12 21 L5 16.5 L5 7.5 Z" fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" />
          <Circle cx={12} cy={12} r={3.2} fill="none" stroke={c} strokeWidth={2} />
        </>
      )}
      {resource === 'intel' && (
        <>
          <Path d="M2 12 C5 6 9 4 12 4 C15 4 19 6 22 12 C19 18 15 20 12 20 C9 20 5 18 2 12 Z" fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" />
          <Circle cx={12} cy={12} r={3.1} fill="none" stroke={c} strokeWidth={2} />
        </>
      )}
      {resource === 'wood' && (
        <>
          <Path d="M8 6 H15 A5 6 0 0 1 15 18 H8 A5 6 0 0 1 8 6 Z" fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" />
          <Ellipse cx={8} cy={12} rx={2.4} ry={4} fill="none" stroke={c} strokeWidth={1.6} />
        </>
      )}
      {resource === 'stone' && (
        <>
          <Path d="M4 15 L5 9 L10 5 L16 6 L20 11 L18 17 L9 18 Z" fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M10 5 L12 12 L20 11 M12 12 L9 18" fill="none" stroke={c} strokeWidth={1.4} strokeLinejoin="round" />
        </>
      )}
      {resource === 'food' && (
        <>
          <Path d="M12 21 V8" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" />
          <Path d="M12 8 C10 6 10 4 12 3 C14 4 14 6 12 8 Z" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M12 11 C10 10.5 8.5 9 8.5 7 M12 11 C14 10.5 15.5 9 15.5 7" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M12 15 C10 14.5 8.5 13 8.5 11 M12 15 C14 14.5 15.5 13 15.5 11" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
};

const RESOURCE_LABELS: Record<keyof ResourceBalances, string> = {
  energy: 'NRG',
  tech: 'TECH',
  intel: 'INT',
  wood: 'WOOD',
  stone: 'STONE',
  food: 'FOOD',
};

// Per-resource label accent. Defaults to the Vril accent for the base trio.
const RESOURCE_LABEL_COLORS: Partial<Record<keyof ResourceBalances, string>> = {
  wood: '#A06A3C',
  stone: '#9CA3AF',
  food: '#1B9E5A',
};

// Core HUD = energy/tech/intel. Raw economy resources only appear when present (> 0).
const CORE_KEYS: Array<keyof ResourceBalances> = ['energy', 'tech', 'intel'];
const ECONOMY_KEYS: Array<keyof ResourceBalances> = ['wood', 'stone', 'food'];

// ─── Props ───────────────────────────────────────────────────────────────────

interface ResourceBarProps {
  balances: ResourceBalances;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Compact HUD bar showing Energy / Tech / Intel balances.
 * Collapsed by default to keep the map HUD calm — a small chip with the core
 * icons; tapping it expands the full bar, tapping again collapses it.
 * Positioned absolutely so the caller wraps it in a SafeAreaView or passes
 * explicit insets — we read safe-area insets here to push below the notch.
 */
const ResourceBar: React.FC<ResourceBarProps> = ({ balances }) => {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  // Economy resources are only shown once the player actually has some (economy flag on + extraction running).
  const economyKeys = ECONOMY_KEYS.filter((key) => balances[key] > 0);
  const keys: Array<keyof ResourceBalances> = [...CORE_KEYS, ...economyKeys];

  if (!expanded) {
    return (
      <TouchableOpacity
        style={[styles.chip, { top: insets.top + 58 }]}
        onPress={() => setExpanded(true)}
        activeOpacity={0.8}
      >
        {CORE_KEYS.map((key) => (
          <ResourceIcon key={key} resource={key} size={13} />
        ))}
        <Ionicons name="chevron-down" size={13} color="#8A837B" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { top: insets.top + 58 }]}
      onPress={() => setExpanded(false)}
      activeOpacity={0.9}
    >
      {keys.map((key, idx) => (
        <React.Fragment key={key}>
          {idx > 0 && <View style={styles.divider} />}
          <View style={styles.item}>
            <ResourceIcon resource={key} size={16} />
            <View style={styles.textCol}>
              <Text style={[styles.label, RESOURCE_LABEL_COLORS[key] ? { color: RESOURCE_LABEL_COLORS[key] } : null]}>
                {RESOURCE_LABELS[key]}
              </Text>
              <PulseValue value={balances[key]} text={formatCompact(balances[key])} />
            </View>
          </View>
        </React.Fragment>
      ))}
      <Ionicons name="chevron-up" size={13} color="#8A837B" style={styles.collapseHint} />
    </TouchableOpacity>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OBSIDIAN,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OBSIDIAN_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 7,
    // Vril accent shadow
    shadowColor: VRIL_ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  textCol: {
    alignItems: 'flex-start',
  },
  label: {
    color: VRIL_ACCENT,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    lineHeight: 10,
  },
  value: {
    color: '#141210',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: OBSIDIAN_BORDER,
    marginHorizontal: 2,
  },
  chip: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: OBSIDIAN,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OBSIDIAN_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: VRIL_ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  collapseHint: {
    marginLeft: 4,
  },
});

export default ResourceBar;

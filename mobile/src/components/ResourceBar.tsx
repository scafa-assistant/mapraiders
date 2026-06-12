import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ResourceBalances } from '../store/resourceStore';

// ─── Vril palette (shared with PvESpawnMarker / PvEIntroCards) ───────────────
const VRIL_ACCENT = '#9D4EDD';
const OBSIDIAN = 'rgba(13, 18, 32, 0.88)';
const OBSIDIAN_BORDER = '#1A2340';

// ─── Compact number formatter: 1234 → "1.2k", 1200000 → "1.2m" ─────────────
function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Simple text icons (no new deps) ─────────────────────────────────────────
const RESOURCE_ICONS: Record<keyof ResourceBalances, string> = {
  energy: '⚡',
  tech: '⚙',
  intel: '👁',
};

const RESOURCE_LABELS: Record<keyof ResourceBalances, string> = {
  energy: 'NRG',
  tech: 'TECH',
  intel: 'INT',
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface ResourceBarProps {
  balances: ResourceBalances;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Compact HUD bar showing Energy / Tech / Intel balances.
 * Positioned absolutely so the caller wraps it in a SafeAreaView or passes
 * explicit insets — we read safe-area insets here to push below the notch.
 */
const ResourceBar: React.FC<ResourceBarProps> = ({ balances }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { top: insets.top + 58 }]}>
      {(Object.keys(RESOURCE_ICONS) as Array<keyof ResourceBalances>).map((key, idx) => (
        <React.Fragment key={key}>
          {idx > 0 && <View style={styles.divider} />}
          <View style={styles.item}>
            <Text style={styles.icon}>{RESOURCE_ICONS[key]}</Text>
            <View style={styles.textCol}>
              <Text style={styles.label}>{RESOURCE_LABELS[key]}</Text>
              <Text style={styles.value}>{formatCompact(balances[key])}</Text>
            </View>
          </View>
        </React.Fragment>
      ))}
    </View>
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
  icon: {
    fontSize: 14,
    lineHeight: 18,
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
    color: '#FFFFFF',
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
});

export default ResourceBar;

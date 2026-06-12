import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BuildingType } from '../services/api';
import type { ResourceBalances } from '../store/resourceStore';

// ─── Vril palette ─────────────────────────────────────────────────────────────
const VRIL_ACCENT = '#9D4EDD';
const VRIL_PRIMARY = '#7B61FF';
const OBSIDIAN = '#0A0E17';
const SURFACE = '#141B2D';
const BORDER = '#1A2340';
const TEXT = '#FFFFFF';
const TEXT_SECONDARY = '#8892B0';

// ─── Building definitions ─────────────────────────────────────────────────────

interface BuildingDef {
  type: BuildingType;
  name: string;
  description: string;
  costEnergy: number;
  costTech: number;
  buildTimeHours: number;
}

const BUILDING_DEFS: BuildingDef[] = [
  {
    type: 'shield_generator',
    name: 'Shield Generator',
    description: 'Blocks the first takeover attempt every 24h.',
    costEnergy: 200,
    costTech: 100,
    buildTimeHours: 2,
  },
  {
    type: 'refinery',
    name: 'Refinery',
    description: '+25% energy generation for this territory.',
    costEnergy: 150,
    costTech: 80,
    buildTimeHours: 2,
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface BuildingPickerSheetProps {
  visible: boolean;
  balances: ResourceBalances;
  loading: boolean;
  onClose: () => void;
  onBuild: (type: BuildingType) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Modal bottom-sheet for picking a building type.
 * Uses React Native built-in Modal — no new dependencies.
 * Gated externally by the 'resources' feature flag.
 */
const BuildingPickerSheet: React.FC<BuildingPickerSheetProps> = ({
  visible,
  balances,
  loading,
  onClose,
  onBuild,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop tap to dismiss */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Construct Building</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Balance summary */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceItem}>⚡ {balances.energy}</Text>
          <Text style={styles.balanceItem}>⚙ {balances.tech}</Text>
        </View>

        {/* Building cards */}
        {BUILDING_DEFS.map((def) => {
          const canAfford = balances.energy >= def.costEnergy && balances.tech >= def.costTech;
          return (
            <View key={def.type} style={[styles.card, !canAfford && styles.cardDisabled]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{def.name}</Text>
                <View style={styles.costBadge}>
                  <Text style={styles.costText}>⚡{def.costEnergy}  ⚙{def.costTech}</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{def.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.buildTime}>Build time: {def.buildTimeHours}h</Text>
                <TouchableOpacity
                  style={[styles.buildBtn, !canAfford && styles.buildBtnDisabled]}
                  onPress={() => canAfford && onBuild(def.type)}
                  disabled={!canAfford || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={OBSIDIAN} />
                  ) : (
                    <Text style={styles.buildBtnText}>
                      {canAfford ? 'Build' : 'Not enough'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </Modal>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 8,
    // Vril glow on top edge
    shadowColor: VRIL_ACCENT,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: OBSIDIAN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  balanceItem: {
    color: VRIL_ACCENT,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: OBSIDIAN,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VRIL_PRIMARY,
    padding: 16,
    marginBottom: 12,
  },
  cardDisabled: {
    borderColor: BORDER,
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
  },
  costBadge: {
    backgroundColor: `${VRIL_ACCENT}20`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${VRIL_ACCENT}40`,
  },
  costText: {
    color: VRIL_ACCENT,
    fontSize: 11,
    fontWeight: '700',
  },
  cardDesc: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buildTime: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '600',
  },
  buildBtn: {
    backgroundColor: VRIL_ACCENT,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: VRIL_ACCENT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  buildBtnDisabled: {
    backgroundColor: BORDER,
    shadowOpacity: 0,
    elevation: 0,
  },
  buildBtnText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
  },
});

export default BuildingPickerSheet;

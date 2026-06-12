import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  effect: string;
  costEnergy: number;
  costTech: number;
  buildTimeHours: number;
  icon: keyof typeof Ionicons.glyphMap;
}

const BUILDING_DEFS: BuildingDef[] = [
  {
    type: 'shield_generator',
    name: 'Shield Generator',
    effect: 'Blocks first takeover attempt every 24h.',
    costEnergy: 200,
    costTech: 100,
    buildTimeHours: 2,
    icon: 'shield',
  },
  {
    type: 'refinery',
    name: 'Refinery',
    effect: '+25% energy generation for this territory.',
    costEnergy: 150,
    costTech: 80,
    buildTimeHours: 2,
    icon: 'flash',
  },
  {
    type: 'radar',
    name: 'Radar',
    effect: 'Reveals 2/3/4 cell vision ring (by tier).',
    costEnergy: 180,
    costTech: 120,
    buildTimeHours: 4,
    icon: 'radio',
  },
  {
    type: 'garrison',
    name: 'Garrison',
    effect: '+4/+6/+8 garrison slots (by tier).',
    costEnergy: 250,
    costTech: 150,
    buildTimeHours: 4,
    icon: 'people',
  },
  {
    type: 'silo',
    name: 'Silo',
    effect: 'Airstrike 50/75/100 dmg, 6h cooldown (by tier).',
    costEnergy: 400,
    costTech: 250,
    buildTimeHours: 4,
    icon: 'rocket',
  },
  {
    type: 'teleporter',
    name: 'Teleporter',
    effect: 'Instant reinforce between own teleporter pads.',
    costEnergy: 300,
    costTech: 200,
    buildTimeHours: 4,
    icon: 'swap-horizontal',
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
 * Renders all 6 types as compact list rows: icon, name, one-line effect, cost.
 * Disabled rows when balance is too low.
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

        {/* Building list rows */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {BUILDING_DEFS.map((def) => {
            const canAfford =
              balances.energy >= def.costEnergy && balances.tech >= def.costTech;
            return (
              <TouchableOpacity
                key={def.type}
                style={[styles.row, !canAfford && styles.rowDisabled]}
                onPress={() => canAfford && !loading && onBuild(def.type)}
                disabled={!canAfford || loading}
                activeOpacity={0.75}
              >
                {/* Icon */}
                <View style={[styles.iconWrap, !canAfford && styles.iconWrapDisabled]}>
                  <Ionicons
                    name={def.icon}
                    size={20}
                    color={canAfford ? VRIL_ACCENT : TEXT_SECONDARY}
                  />
                </View>

                {/* Text block */}
                <View style={styles.rowText}>
                  <Text style={[styles.rowName, !canAfford && styles.rowNameDisabled]}>
                    {def.name}
                  </Text>
                  <Text style={styles.rowEffect} numberOfLines={1}>
                    {def.effect}
                  </Text>
                </View>

                {/* Cost + build btn */}
                <View style={styles.rowRight}>
                  <Text style={[styles.rowCost, !canAfford && styles.rowCostInsufficient]}>
                    ⚡{def.costEnergy} ⚙{def.costTech}
                  </Text>
                  {loading ? (
                    <ActivityIndicator size="small" color={OBSIDIAN} style={styles.buildBtn} />
                  ) : (
                    <View style={[styles.buildBtn, !canAfford && styles.buildBtnDisabled]}>
                      <Text style={styles.buildBtnText}>
                        {canAfford ? 'Build' : '—'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
    maxHeight: '80%',
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
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  balanceItem: {
    color: VRIL_ACCENT,
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${VRIL_ACCENT}18`,
    borderWidth: 1,
    borderColor: `${VRIL_ACCENT}40`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapDisabled: {
    backgroundColor: `${BORDER}`,
    borderColor: BORDER,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  rowNameDisabled: {
    color: TEXT_SECONDARY,
  },
  rowEffect: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    lineHeight: 15,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  rowCost: {
    color: VRIL_ACCENT,
    fontSize: 10,
    fontWeight: '700',
  },
  rowCostInsufficient: {
    color: '#FF4757',
  },
  buildBtn: {
    backgroundColor: VRIL_ACCENT,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 52,
    alignItems: 'center',
    shadowColor: VRIL_ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buildBtnDisabled: {
    backgroundColor: BORDER,
    shadowOpacity: 0,
    elevation: 0,
  },
  buildBtnText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '800',
  },
});

export default BuildingPickerSheet;

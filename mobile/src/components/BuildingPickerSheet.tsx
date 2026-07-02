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
import { strings as S, t } from '../i18n';
import { fx } from '../services/fx';
import { FOOTPRINTS, MIN_LEVEL, CELL_M2 } from '../utils/buildings';

// ─── Brand palette (MapRaiders: white/blue, accent #1558F0) ──────────────────
const VRIL_ACCENT = '#1558F0';
const VRIL_PRIMARY = '#1558F0';
const OBSIDIAN = '#F6F4F1';
const SURFACE = '#FFFFFF';
const BORDER = '#C0BAB4';
const TEXT = '#141210';
const TEXT_SECONDARY = '#7A7470';

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

const getBuildingDefs = (): BuildingDef[] => [
  {
    type: 'shield_generator',
    name: S.map.territoryDetail.buildingShieldGenerator,
    effect: S.map.territoryDetail.buildingEffectShieldGenerator,
    costEnergy: 200,
    costTech: 100,
    buildTimeHours: 2,
    icon: 'shield',
  },
  {
    type: 'refinery',
    name: S.map.territoryDetail.buildingRefinery,
    effect: S.map.territoryDetail.buildingEffectRefinery,
    costEnergy: 150,
    costTech: 80,
    buildTimeHours: 2,
    icon: 'flash',
  },
  {
    type: 'radar',
    name: S.map.territoryDetail.buildingRadar,
    effect: S.map.territoryDetail.buildingEffectRadar,
    costEnergy: 180,
    costTech: 120,
    buildTimeHours: 4,
    icon: 'radio',
  },
  {
    type: 'garrison',
    name: S.map.territoryDetail.buildingGarrison,
    effect: S.map.territoryDetail.buildingEffectGarrison,
    costEnergy: 250,
    costTech: 150,
    buildTimeHours: 4,
    icon: 'people',
  },
  {
    type: 'silo',
    name: S.map.territoryDetail.buildingSilo,
    effect: S.map.territoryDetail.buildingEffectSilo,
    costEnergy: 400,
    costTech: 250,
    buildTimeHours: 4,
    icon: 'rocket',
  },
  {
    type: 'teleporter',
    name: S.map.territoryDetail.buildingTeleporter,
    effect: S.map.territoryDetail.buildingEffectTeleporter,
    costEnergy: 300,
    costTech: 200,
    buildTimeHours: 4,
    icon: 'swap-horizontal',
  },
];

// ─── Phase F.1 — biome extraction buildings (gated by the 'economy' flag) ──────
// Each requires a matching territory biome and produces a raw resource over time.
const getExtractionDefs = (): BuildingDef[] => [
  {
    type: 'sawmill',
    name: S.map.territoryDetail.buildingSawmill,
    effect: S.map.territoryDetail.buildingEffectSawmill,
    costEnergy: 120,
    costTech: 40,
    buildTimeHours: 2,
    icon: 'leaf',
  },
  {
    type: 'quarry',
    name: S.map.territoryDetail.buildingQuarry,
    effect: S.map.territoryDetail.buildingEffectQuarry,
    costEnergy: 150,
    costTech: 60,
    buildTimeHours: 2,
    icon: 'hammer',
  },
  {
    type: 'farm',
    name: S.map.territoryDetail.buildingFarm,
    effect: S.map.territoryDetail.buildingEffectFarm,
    costEnergy: 120,
    costTech: 30,
    buildTimeHours: 2,
    icon: 'nutrition',
  },
  {
    type: 'fishery',
    name: S.map.territoryDetail.buildingFishery,
    effect: S.map.territoryDetail.buildingEffectFishery,
    costEnergy: 130,
    costTech: 40,
    buildTimeHours: 2,
    icon: 'fish',
  },
];

// ─── Phase F.4 — advanced military / infrastructure buildings (base builder) ───
// Only offered when `advancedEnabled` is set. Each carries a minimum player level.
const getAdvancedDefs = (): BuildingDef[] => [
  {
    type: 'military_base',
    name: S.map.territoryDetail.buildingMilitaryBase,
    effect: S.map.territoryDetail.buildingEffectMilitaryBase,
    costEnergy: 500,
    costTech: 300,
    buildTimeHours: 6,
    icon: 'medal',
  },
  {
    type: 'datacenter',
    name: S.map.territoryDetail.buildingDatacenter,
    effect: S.map.territoryDetail.buildingEffectDatacenter,
    costEnergy: 400,
    costTech: 350,
    buildTimeHours: 6,
    icon: 'server',
  },
  {
    type: 'airport',
    name: S.map.territoryDetail.buildingAirport,
    effect: S.map.territoryDetail.buildingEffectAirport,
    costEnergy: 1200,
    costTech: 800,
    buildTimeHours: 8,
    icon: 'airplane',
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface BuildingPickerSheetProps {
  visible: boolean;
  balances: ResourceBalances;
  loading: boolean;
  /** When true, the 4 biome-extraction buildings are offered (Phase F.1 'economy' flag). */
  economyEnabled?: boolean;
  /** When true, the 3 advanced military / infrastructure buildings are offered (base builder). */
  advancedEnabled?: boolean;
  /** Current player level — locks rows whose type has a higher min level. */
  userLevel?: number;
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
  economyEnabled = false,
  advancedEnabled = false,
  userLevel,
  onClose,
  onBuild,
}) => {
  const insets = useSafeAreaInsets();

  // Extraction buildings appear with the economy flag; advanced ones with the base builder.
  const defs = [
    ...getBuildingDefs(),
    ...(economyEnabled ? getExtractionDefs() : []),
    ...(advancedEnabled ? getAdvancedDefs() : []),
  ];

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
          <Text style={styles.title}>{S.map.territoryDetail.buildPickerTitle}</Text>
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
          {defs.map((def) => {
            const [fw, fh] = FOOTPRINTS[def.type];
            const minLevel = MIN_LEVEL[def.type];
            const locked = userLevel != null && minLevel != null && userLevel < minLevel;
            const canAfford =
              balances.energy >= def.costEnergy && balances.tech >= def.costTech;
            const disabled = locked || !canAfford;
            return (
              <TouchableOpacity
                key={def.type}
                style={[styles.row, disabled && styles.rowDisabled]}
                onPress={() => {
                  if (!disabled && !loading) {
                    fx.tick();
                    onBuild(def.type);
                  }
                }}
                disabled={disabled || loading}
                activeOpacity={0.75}
              >
                {/* Icon */}
                <View style={[styles.iconWrap, disabled && styles.iconWrapDisabled]}>
                  <Ionicons
                    name={locked ? 'lock-closed' : def.icon}
                    size={20}
                    color={disabled ? TEXT_SECONDARY : VRIL_ACCENT}
                  />
                </View>

                {/* Text block */}
                <View style={styles.rowText}>
                  <Text style={[styles.rowName, disabled && styles.rowNameDisabled]}>
                    {def.name}
                  </Text>
                  {locked ? (
                    <Text style={styles.rowLocked} numberOfLines={1}>
                      {t(S.map.territoryDetail.buildLockedLevel, { n: minLevel! })}
                    </Text>
                  ) : (
                    <Text style={styles.rowEffect} numberOfLines={1}>
                      {def.effect}
                    </Text>
                  )}
                  <Text style={styles.rowFootprint}>
                    {t(S.map.territoryDetail.buildFootprintLabel, { w: fw, h: fh, m2: fw * fh * CELL_M2 })}
                  </Text>
                </View>

                {/* Cost + build btn */}
                <View style={styles.rowRight}>
                  <Text style={[styles.rowCost, !canAfford && styles.rowCostInsufficient]}>
                    ⚡{def.costEnergy} ⚙{def.costTech}
                  </Text>
                  {loading ? (
                    <ActivityIndicator size="small" color={'#FFFFFF'} style={styles.buildBtn} />
                  ) : (
                    <View style={[styles.buildBtn, disabled && styles.buildBtnDisabled]}>
                      <Text style={styles.buildBtnText}>
                        {disabled ? '—' : S.map.territoryDetail.buildPickerBuildBtn}
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
  rowLocked: {
    color: '#D7263D',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  rowFootprint: {
    color: TEXT_SECONDARY,
    fontSize: 10,
    marginTop: 1,
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
    color: '#D7263D',
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default BuildingPickerSheet;

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { DicePouchScreenProps } from '../../navigation/types';
import { useInventoryStore, ItemInstance } from '../../store/inventoryStore';
import { useCommanderStore } from '../../store/commanderStore';
import { COMMANDER_COLORS, rarityColor, prettifyDefinitionId } from '../../utils/commander';
import { SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { strings as S } from '../../i18n';
import { PressableScale } from '../../components/fx/PressableScale';

const C = COMMANDER_COLORS;

/** A dice item is any inventory item whose definition_id starts with "dice_". */
function isDie(item: ItemInstance): boolean {
  return item.category === 'dice' || (item.definition_id || '').startsWith('dice_');
}

export default function DicePouchScreen({ navigation }: DicePouchScreenProps) {
  const { items, isLoading, fetchInventory } = useInventoryStore();
  const { equippedDieId, equipDie, error, clearError } = useCommanderStore();
  const [equipping, setEquipping] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const dice = useMemo(() => items.filter(isDie), [items]);

  // Hydrate the equipped marker from the server's per-instance state so the
  // pouch survives app restarts (equipDie only sets it optimistically).
  useEffect(() => {
    if (equippedDieId) return;
    const serverEquipped = dice.find((d) => d.state?.equipped === true);
    if (serverEquipped) {
      useCommanderStore.setState({ equippedDieId: serverEquipped.id });
    }
  }, [dice, equippedDieId]);

  const handleEquip = async (instanceId: string) => {
    setEquipping(instanceId);
    await equipDie(instanceId);
    setEquipping(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={C.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="dice" size={18} color={C.accent} />
          <Text style={styles.headerTitle}>{S.commander.dicePouch.title}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{S.commander.dicePouch.subtitle}</Text>

        {error ? (
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        {isLoading && dice.length === 0 ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: SPACING.xl }} />
        ) : dice.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="dice-outline" size={40} color={C.textSecondary} />
            <Text style={styles.emptyTitle}>{S.commander.dicePouch.emptyTitle}</Text>
            <Text style={styles.emptyText}>{S.commander.dicePouch.emptyText}</Text>
          </View>
        ) : (
          dice.map((die) => {
            const equipped = equippedDieId === die.id;
            const color = rarityColor(die.rarity);
            return (
              <View
                key={die.id}
                style={[styles.dieCard, equipped && { borderColor: C.accent, backgroundColor: `${C.accent}14` }]}
              >
                <View style={[styles.dieIcon, { borderColor: color, backgroundColor: `${color}1A` }]}>
                  <Ionicons name="dice" size={22} color={color} />
                </View>
                <View style={styles.dieInfo}>
                  <Text style={styles.dieName}>{prettifyDefinitionId(die.definition_id)}</Text>
                  <Text style={[styles.dieRarity, { color }]}>{die.rarity?.toUpperCase()}</Text>
                  {die.mint_number != null ? (
                    <Text style={styles.dieMint}>#{die.mint_number}</Text>
                  ) : null}
                </View>
                {equipped ? (
                  <View style={styles.equippedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={C.accent} />
                    <Text style={styles.equippedText}>{S.commander.dicePouch.equipped}</Text>
                  </View>
                ) : (
                  <PressableScale
                    style={styles.equipBtn}
                    onPress={() => handleEquip(die.id)}
                    disabled={equipping === die.id}
                    feedback="soft"
                    accessibilityLabel={S.commander.dicePouch.equip}
                  >
                    {equipping === die.id ? (
                      <ActivityIndicator color={C.bg} size="small" />
                    ) : (
                      <Text style={styles.equipBtnText}>{S.commander.dicePouch.equip}</Text>
                    )}
                  </PressableScale>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeBtn: { padding: SPACING.xs },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  headerRight: { width: 32 },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: C.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  errorText: {
    color: C.enemy,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xxl },
  emptyTitle: { fontSize: FONT_SIZE.md, color: C.text, fontWeight: '700' },
  emptyText: { fontSize: FONT_SIZE.sm, color: C.textSecondary, textAlign: 'center' },
  dieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dieIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieInfo: { flex: 1 },
  dieName: { fontSize: FONT_SIZE.md, color: C.text, fontWeight: '700' },
  dieRarity: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  dieMint: { fontSize: FONT_SIZE.xs, color: C.textSecondary, marginTop: 1 },
  equipBtn: {
    backgroundColor: C.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  equipBtnText: { color: C.bg, fontWeight: '800', fontSize: FONT_SIZE.sm },
  equippedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  equippedText: { color: C.accent, fontWeight: '700', fontSize: FONT_SIZE.sm },
});

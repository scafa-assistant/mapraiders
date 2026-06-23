import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { StreifzugEncounter } from '../services/api';

// ─── Streifzug Encounter Card ────────────────────────────────────────────────
//
// Bottom overlay shown when a patrol ping surfaces a nearby encounter. The
// server provides title/body/distance; the player either heads over (routes
// into the existing HackingScreen flow) or dismisses it.

interface Props {
  encounter: StreifzugEncounter;
  onEngage: (encounter: StreifzugEncounter) => void;
  onDismiss: () => void;
}

const KIND_ICON: Record<StreifzugEncounter['kind'], keyof typeof Ionicons.glyphMap> = {
  loot: 'sparkles',
  recruit: 'people',
  threat: 'warning',
};

export const StreifzugEncounterCard: React.FC<Props> = ({ encounter, onEngage, onDismiss }) => {
  const theme = useTheme();
  const accent = encounter.kind === 'threat' ? theme.danger : theme.primary;
  const icon = KIND_ICON[encounter.kind] ?? 'sparkles';

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.iconBadge, { backgroundColor: accent }]}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {encounter.title}
        </Text>
        <Text style={[styles.text, { color: theme.textSecondary }]} numberOfLines={2}>
          {encounter.body}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {encounter.distanceM} m entfernt
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.engageBtn, { backgroundColor: accent }]}
            onPress={() => onEngage(encounter)}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={16} color="#FFFFFF" />
            <Text style={styles.engageText}>Hingehen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={[styles.dismissText, { color: theme.textSecondary }]}>Später</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.close} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 110,
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  text: { fontSize: 13, lineHeight: 18 },
  meta: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  engageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  engageText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginLeft: 6 },
  dismissBtn: { paddingHorizontal: 14, paddingVertical: 9, marginLeft: 4 },
  dismissText: { fontSize: 14, fontWeight: '600' },
  close: { position: 'absolute', top: 8, right: 8, padding: 4 },
});

export default StreifzugEncounterCard;

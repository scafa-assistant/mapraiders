import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, formatDistanceToNow } from 'date-fns';
import { TerritoryDetailScreenProps, MovementClass } from '../../navigation/types';
import { useTerritoryStore } from '../../store/territoryStore';
import { useAuthStore } from '../../store/authStore';
import { defenseApi } from '../../services/api';

const CLASS_COLORS: Record<MovementClass, string> = {
  walker: '#00D4FF', runner: '#FF4757', cyclist: '#00FF88',
  skater: '#FFB800', dog_walker: '#7B61FF', driver: '#8892B0', unknown: '#555E78',
};
const CLASS_LABELS: Record<MovementClass, string> = {
  walker: 'Walker', runner: 'Runner', cyclist: 'Cyclist',
  skater: 'Skater', dog_walker: 'Dog Walker', driver: 'Driver', unknown: 'Unknown',
};
const CLASS_ICONS: Record<MovementClass, keyof typeof Ionicons.glyphMap> = {
  walker: 'walk', runner: 'speedometer', cyclist: 'bicycle',
  skater: 'flash', dog_walker: 'paw', driver: 'car', unknown: 'help-circle',
};

const DEFENSE_LABELS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  rock_paper_scissors: { label: 'Schnick Schnack Schnuck', icon: 'hand-left-outline', color: '#7B61FF' },
  sprint_race: { label: 'Sprint Race', icon: 'speedometer-outline', color: '#00FF88' },
  trivia: { label: 'Trivia', icon: 'help-circle-outline', color: '#00D4FF' },
  coin_flip: { label: 'Münzwurf', icon: 'ellipse-outline', color: '#FFB800' },
  odd_even: { label: 'Gerade/Ungerade', icon: 'finger-print-outline', color: '#FF69B4' },
  tic_tac_toe: { label: 'Tic Tac Toe', icon: 'grid-outline', color: '#00D4FF' },
  mini_chess: { label: 'Mini-Schach', icon: 'trophy-outline', color: '#FFB800' },
  challenge: { label: 'Challenge', icon: 'flag-outline', color: '#FF4757' },
  quest: { label: 'Quest', icon: 'map-outline', color: '#00FF88' },
  echo: { label: 'Echo', icon: 'volume-high-outline', color: '#7B61FF' },
};

export default function TerritoryDetailScreen({ route, navigation }: TerritoryDetailScreenProps) {
  const { territory } = route.params;
  const { challengeTerritory } = useTerritoryStore();
  const { user } = useAuthStore();

  const isOwner = user?.id === territory.ownerId;
  const classColor = CLASS_COLORS[territory.movementClass];
  const decayLevel =
    territory.decayPercent < 30 ? 'Strong' : territory.decayPercent < 60 ? 'Fading' : 'Weak';
  const decayColor =
    territory.decayPercent < 30 ? '#00FF88' : territory.decayPercent < 60 ? '#FFB800' : '#FF4757';

  // Defense state (multi-layer)
  const [defenses, setDefenses] = useState<any[]>([]);
  const [maxSlots, setMaxSlots] = useState(1);
  const [defenseLoading, setDefenseLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDefenses();
  }, [territory.id]);

  const fetchDefenses = async () => {
    setDefenseLoading(true);
    try {
      const { data } = await defenseApi.getDefense(territory.id);
      const d = data?.data ?? data;
      setDefenses(d?.defenses ?? (d?.defense ? [d.defense] : []));
      setMaxSlots(d?.max_slots ?? 1);
    } catch {
      setDefenses([]);
    } finally {
      setDefenseLoading(false);
    }
  };

  const handleRemoveDefense = (defenseId: string, gameType: string) => {
    const info = DEFENSE_LABELS[gameType] || DEFENSE_LABELS.trivia;
    Alert.alert(
      'Verteidigung entfernen',
      `"${info.label}" von diesem Territorium entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(defenseId);
            try {
              await defenseApi.removeDefense(defenseId);
              setDefenses(prev => prev.filter(d => d.id !== defenseId));
            } catch (err: any) {
              Alert.alert('Fehler', err.message || 'Entfernen fehlgeschlagen.');
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDefenseChallenge = (defense: any) => {
    navigation.navigate('DefenseChallenge', {
      defenseId: defense.id,
      territoryId: territory.id,
      gameType: defense.game_type,
      config: defense.config,
      ownerUsername: territory.ownerUsername,
    });
  };

  const handleChallenge = () => {
    Alert.alert(
      'Territorium herausfordern',
      `Möchtest du ${territory.ownerUsername}s Territorium herausfordern?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Herausfordern',
          style: 'destructive',
          onPress: async () => {
            const success = await challengeTerritory(territory.id);
            if (success) {
              Alert.alert('Challenge gestartet', 'Lauf deine Route durch das Territorium!');
              navigation.goBack();
            } else {
              Alert.alert('Fehler', 'Challenge konnte nicht gestartet werden.');
            }
          },
        },
      ]
    );
  };

  const usedSlots = defenses.length;
  const freeSlots = Math.max(0, maxSlots - usedSlots);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#8892B0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Territorium</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Owner Card */}
        <View style={[styles.ownerCard, { borderColor: classColor }]}>
          <View style={[styles.classIconCircle, { backgroundColor: `${classColor}20` }]}>
            <Ionicons name={CLASS_ICONS[territory.movementClass]} size={28} color={classColor} />
          </View>
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>{territory.ownerUsername}</Text>
            <View style={[styles.classBadge, { backgroundColor: `${classColor}20` }]}>
              <Text style={[styles.classLabel, { color: classColor }]}>
                {CLASS_LABELS[territory.movementClass]}
              </Text>
            </View>
          </View>
          {isOwner && (
            <View style={styles.yoursBadge}>
              <Text style={styles.yoursText}>DEINS</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="resize" size={20} color="#00D4FF" />
            <Text style={styles.statValue}>{territory.area} m²</Text>
            <Text style={styles.statLabel}>Fläche</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.decayIndicator, { borderColor: decayColor }]}>
              <Text style={[styles.decayPercent, { color: decayColor }]}>
                {100 - territory.decayPercent}%
              </Text>
            </View>
            <Text style={[styles.statValue, { color: decayColor }]}>{decayLevel}</Text>
            <Text style={styles.statLabel}>Stärke</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>DETAILS</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color="#8892B0" />
            <Text style={styles.detailLabel}>Erobert</Text>
            <Text style={styles.detailValue}>
              {format(new Date(territory.claimedAt), 'dd.MM.yyyy')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#8892B0" />
            <Text style={styles.detailLabel}>Alter</Text>
            <Text style={styles.detailValue}>
              {formatDistanceToNow(new Date(territory.claimedAt), { addSuffix: true })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="trending-down-outline" size={18} color="#8892B0" />
            <Text style={styles.detailLabel}>Verfall</Text>
            <View style={styles.decayBarContainer}>
              <View style={styles.decayBarBg}>
                <View style={[styles.decayBarFill, { width: `${100 - territory.decayPercent}%`, backgroundColor: decayColor }]} />
              </View>
              <Text style={[styles.decayBarText, { color: decayColor }]}>{territory.decayPercent}%</Text>
            </View>
          </View>
        </View>

        {/* ─── DEFENSE SECTION ─── */}
        <Text style={styles.sectionTitle}>
          VERTEIDIGUNG ({usedSlots}/{maxSlots} Slots)
        </Text>

        {defenseLoading ? (
          <View style={styles.defenseLoading}>
            <ActivityIndicator size="small" color="#8892B0" />
          </View>
        ) : (
          <>
            {/* Slot Progress Bar */}
            <View style={styles.slotBar}>
              {Array.from({ length: maxSlots }).map((_, i) => {
                const filled = i < usedSlots;
                const defense = defenses[i];
                const color = defense ? (DEFENSE_LABELS[defense.game_type]?.color || '#FFB800') : '#1A2340';
                return (
                  <View
                    key={i}
                    style={[
                      styles.slotDot,
                      { backgroundColor: filled ? color : '#1A2340', borderColor: filled ? color : '#2A3350' },
                    ]}
                  >
                    {filled && <Ionicons name="shield-checkmark" size={10} color="#0A0E17" />}
                  </View>
                );
              })}
            </View>

            {/* Defense Layer Cards */}
            {defenses.map((defense, idx) => {
              const info = DEFENSE_LABELS[defense.game_type] || DEFENSE_LABELS.trivia;
              return (
                <View key={defense.id} style={[styles.defenseCard, { borderColor: info.color }]}>
                  <View style={[styles.defenseCardIcon, { backgroundColor: `${info.color}15` }]}>
                    <Ionicons name={info.icon} size={20} color={info.color} />
                  </View>
                  <View style={styles.defenseCardContent}>
                    <Text style={[styles.defenseCardTitle, { color: info.color }]}>
                      {info.label}
                    </Text>
                    <Text style={styles.defenseCardSlot}>Slot {idx + 1}</Text>
                  </View>

                  {/* Owner: remove button */}
                  {isOwner && (
                    <TouchableOpacity
                      style={styles.defenseCardRemove}
                      onPress={() => handleRemoveDefense(defense.id, defense.game_type)}
                      disabled={removingId === defense.id}
                    >
                      {removingId === defense.id ? (
                        <ActivityIndicator size="small" color="#FF4757" />
                      ) : (
                        <Ionicons name="close-circle" size={22} color="#FF4757" />
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Challenger: attack this layer */}
                  {!isOwner && (
                    <TouchableOpacity
                      style={[styles.defenseCardAttack, { backgroundColor: info.color }]}
                      onPress={() => handleDefenseChallenge(defense)}
                    >
                      <Ionicons name="flash" size={16} color="#0A0E17" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {/* Owner: Add Defense Button (if free slots) */}
            {isOwner && freeSlots > 0 && (
              <TouchableOpacity
                style={styles.addDefenseButton}
                onPress={() => navigation.navigate('DefenseSetup', { territoryId: territory.id })}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={22} color="#0A0E17" />
                <Text style={styles.addDefenseButtonText}>
                  VERTEIDIGUNG HINZUFÜGEN ({freeSlots} frei)
                </Text>
              </TouchableOpacity>
            )}

            {/* Owner: max slots reached */}
            {isOwner && freeSlots === 0 && usedSlots > 0 && (
              <View style={styles.slotsFullNotice}>
                <Ionicons name="shield-checkmark" size={16} color="#00FF88" />
                <Text style={styles.slotsFullText}>
                  Alle {maxSlots} Slots belegt! Territorium ist maximal geschützt.
                </Text>
              </View>
            )}

            {/* Owner: no defenses yet */}
            {isOwner && usedSlots === 0 && (
              <TouchableOpacity
                style={styles.setDefenseButton}
                onPress={() => navigation.navigate('DefenseSetup', { territoryId: territory.id })}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-outline" size={22} color="#0A0E17" />
                <Text style={styles.setDefenseButtonText}>VERTEIDIGUNG EINRICHTEN</Text>
              </TouchableOpacity>
            )}

            {/* Challenger: no defenses → direct challenge */}
            {!isOwner && usedSlots === 0 && (
              <TouchableOpacity
                style={styles.challengeButton}
                onPress={handleChallenge}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={22} color="#0A0E17" />
                <Text style={styles.challengeButtonText}>TERRITORIUM HERAUSFORDERN</Text>
              </TouchableOpacity>
            )}

            {/* Challenger: has defenses → info */}
            {!isOwner && usedSlots > 0 && (
              <View style={styles.challengeInfo}>
                <Ionicons name="information-circle" size={18} color="#FFB800" />
                <Text style={styles.challengeInfoText}>
                  Besiege alle {usedSlots} Verteidigungen um das Territorium zu erobern!
                </Text>
              </View>
            )}

            {/* Owner Notice */}
            {isOwner && (
              <View style={[styles.ownerNotice, { marginTop: 12 }]}>
                <Ionicons name="footsteps-outline" size={20} color="#00FF88" />
                <Text style={styles.ownerNoticeText}>
                  Laufe regelmäßig durch dein Territorium um Verfall zu verhindern.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#141B2D', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerSpacer: { width: 40 },
  ownerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141B2D', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  classIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  ownerInfo: { flex: 1 },
  ownerName: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  classBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  classLabel: { fontSize: 12, fontWeight: '600' },
  yoursBadge: { backgroundColor: 'rgba(0, 255, 136, 0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  yoursText: { color: '#00FF88', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#141B2D', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1A2340' },
  statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 8 },
  statLabel: { color: '#8892B0', fontSize: 11, marginTop: 4 },
  decayIndicator: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  decayPercent: { fontSize: 11, fontWeight: '800' },
  detailsSection: { marginBottom: 24 },
  sectionTitle: { color: '#8892B0', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141B2D', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  detailLabel: { color: '#8892B0', fontSize: 14, flex: 1 },
  detailValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  decayBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
  decayBarBg: { width: 80, height: 6, borderRadius: 3, backgroundColor: '#1A2340', overflow: 'hidden' },
  decayBarFill: { height: '100%', borderRadius: 3 },
  decayBarText: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
  defenseLoading: { alignItems: 'center', paddingVertical: 20 },

  // Slot bar
  slotBar: { flexDirection: 'row', gap: 6, marginBottom: 16, justifyContent: 'center' },
  slotDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },

  // Defense layer cards
  defenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141B2D', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
  defenseCardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  defenseCardContent: { flex: 1 },
  defenseCardTitle: { fontSize: 14, fontWeight: '700' },
  defenseCardSlot: { color: '#8892B0', fontSize: 11, marginTop: 2 },
  defenseCardRemove: { padding: 6 },
  defenseCardAttack: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Add defense button
  addDefenseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFB800', borderRadius: 16, height: 52, gap: 10, marginTop: 4, marginBottom: 8 },
  addDefenseButtonText: { color: '#0A0E17', fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  // Slots full
  slotsFullNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0, 255, 136, 0.08)', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.2)' },
  slotsFullText: { flex: 1, color: '#00FF88', fontSize: 12, fontWeight: '600' },

  // Set defense (first time)
  setDefenseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFB800', borderRadius: 16, height: 56, gap: 10, shadowColor: '#FFB800', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  setDefenseButtonText: { color: '#0A0E17', fontSize: 16, fontWeight: '800', letterSpacing: 2 },

  // Challenge button
  challengeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF4757', borderRadius: 16, height: 56, gap: 10, shadowColor: '#FF4757', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  challengeButtonText: { color: '#0A0E17', fontSize: 16, fontWeight: '800', letterSpacing: 2 },

  // Challenge info
  challengeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 184, 0, 0.08)', borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255, 184, 0, 0.2)' },
  challengeInfoText: { flex: 1, color: '#FFB800', fontSize: 12, fontWeight: '600' },

  // Owner notice
  ownerNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 255, 136, 0.08)', borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.2)', borderRadius: 12, padding: 16, gap: 12 },
  ownerNoticeText: { flex: 1, color: '#8892B0', fontSize: 13, lineHeight: 18 },
});

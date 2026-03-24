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
  walker: '#00D4FF',
  runner: '#FF4757',
  cyclist: '#00FF88',
  skater: '#FFB800',
  dog_walker: '#7B61FF',
  driver: '#8892B0',
  unknown: '#555E78',
};

const CLASS_LABELS: Record<MovementClass, string> = {
  walker: 'Walker',
  runner: 'Runner',
  cyclist: 'Cyclist',
  skater: 'Skater',
  dog_walker: 'Dog Walker',
  driver: 'Driver',
  unknown: 'Unknown',
};

const CLASS_ICONS: Record<MovementClass, keyof typeof Ionicons.glyphMap> = {
  walker: 'walk',
  runner: 'speedometer',
  cyclist: 'bicycle',
  skater: 'flash',
  dog_walker: 'paw',
  driver: 'car',
  unknown: 'help-circle',
};

const DEFENSE_GAME_LABELS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  rock_paper_scissors: { label: 'Rock Paper Scissors', icon: 'hand-left-outline', color: '#7B61FF' },
  sprint_race: { label: 'Sprint Race', icon: 'speedometer-outline', color: '#00FF88' },
  trivia: { label: 'Trivia', icon: 'help-circle-outline', color: '#00D4FF' },
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

  // Defense state
  const [defense, setDefense] = useState<any>(null);
  const [defenseLoading, setDefenseLoading] = useState(true);
  const [removingDefense, setRemovingDefense] = useState(false);

  useEffect(() => {
    fetchDefense();
  }, [territory.id]);

  const fetchDefense = async () => {
    setDefenseLoading(true);
    try {
      const { data } = await defenseApi.getDefense(territory.id);
      const defenseData = data?.data ?? data;
      setDefense(defenseData?.defense ?? defenseData ?? null);
    } catch {
      setDefense(null);
    } finally {
      setDefenseLoading(false);
    }
  };

  const handleRemoveDefense = () => {
    if (!defense?.id) return;
    Alert.alert(
      'Remove Defense',
      'Are you sure you want to remove the defense from this territory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingDefense(true);
            try {
              await defenseApi.removeDefense(defense.id);
              setDefense(null);
              Alert.alert('Defense Removed', 'Your territory is no longer defended.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove defense.');
            } finally {
              setRemovingDefense(false);
            }
          },
        },
      ]
    );
  };

  const handleDefenseChallenge = () => {
    if (!defense) return;
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
      'Challenge Territory',
      `Do you want to challenge ${territory.ownerUsername}'s territory? You'll need to walk a longer route through it to claim it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Challenge',
          style: 'destructive',
          onPress: async () => {
            const success = await challengeTerritory(territory.id);
            if (success) {
              Alert.alert('Challenge Started', 'Start recording your route through this territory!');
              navigation.goBack();
            } else {
              Alert.alert('Failed', 'Could not start challenge. Try again later.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#8892B0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Territory</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Owner Card */}
        <View style={[styles.ownerCard, { borderColor: classColor }]}>
          <View style={[styles.classIconCircle, { backgroundColor: `${classColor}20` }]}>
            <Ionicons
              name={CLASS_ICONS[territory.movementClass]}
              size={28}
              color={classColor}
            />
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
              <Text style={styles.yoursText}>YOURS</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="resize" size={20} color="#00D4FF" />
            <Text style={styles.statValue}>{territory.area} m²</Text>
            <Text style={styles.statLabel}>Area</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.decayIndicator, { borderColor: decayColor }]}>
              <Text style={[styles.decayPercent, { color: decayColor }]}>
                {100 - territory.decayPercent}%
              </Text>
            </View>
            <Text style={[styles.statValue, { color: decayColor }]}>{decayLevel}</Text>
            <Text style={styles.statLabel}>Strength</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>DETAILS</Text>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color="#8892B0" />
            <Text style={styles.detailLabel}>Claimed</Text>
            <Text style={styles.detailValue}>
              {format(new Date(territory.claimedAt), 'MMM d, yyyy')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#8892B0" />
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>
              {formatDistanceToNow(new Date(territory.claimedAt), { addSuffix: true })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="trending-down-outline" size={18} color="#8892B0" />
            <Text style={styles.detailLabel}>Decay</Text>
            <View style={styles.decayBarContainer}>
              <View style={styles.decayBarBg}>
                <View
                  style={[
                    styles.decayBarFill,
                    {
                      width: `${100 - territory.decayPercent}%`,
                      backgroundColor: decayColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.decayBarText, { color: decayColor }]}>
                {territory.decayPercent}%
              </Text>
            </View>
          </View>
        </View>

        {/* Defense Section */}
        {defenseLoading ? (
          <View style={styles.defenseLoading}>
            <ActivityIndicator size="small" color="#8892B0" />
          </View>
        ) : (
          <>
            {/* Defense Info Badge */}
            {defense && (() => {
              const gameInfo = DEFENSE_GAME_LABELS[defense.game_type] || DEFENSE_GAME_LABELS.trivia;
              return (
                <View style={[styles.defenseBadge, { borderColor: gameInfo.color }]}>
                  <Ionicons name="shield-checkmark" size={18} color={gameInfo.color} />
                  <Ionicons name={gameInfo.icon} size={16} color={gameInfo.color} />
                  <Text style={[styles.defenseBadgeText, { color: gameInfo.color }]}>
                    Defended: {gameInfo.label}
                  </Text>
                </View>
              );
            })()}

            {/* Owner Actions */}
            {isOwner && !defense && (
              <TouchableOpacity
                style={styles.setDefenseButton}
                onPress={() => navigation.navigate('DefenseSetup', { territoryId: territory.id })}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-outline" size={22} color="#0A0E17" />
                <Text style={styles.setDefenseButtonText}>SET DEFENSE</Text>
              </TouchableOpacity>
            )}

            {isOwner && defense && (
              <TouchableOpacity
                style={styles.removeDefenseButton}
                onPress={handleRemoveDefense}
                activeOpacity={0.8}
                disabled={removingDefense}
              >
                {removingDefense ? (
                  <ActivityIndicator size="small" color="#FF4757" />
                ) : (
                  <>
                    <Ionicons name="shield-outline" size={20} color="#FF4757" />
                    <Text style={styles.removeDefenseButtonText}>REMOVE DEFENSE</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Challenger Actions */}
            {!isOwner && defense && (
              <TouchableOpacity
                style={styles.defenseChallengeButton}
                onPress={handleDefenseChallenge}
                activeOpacity={0.8}
              >
                <Ionicons name="game-controller" size={22} color="#0A0E17" />
                <Text style={styles.defenseChallengeButtonText}>CHALLENGE!</Text>
              </TouchableOpacity>
            )}

            {!isOwner && !defense && (
              <TouchableOpacity
                style={styles.challengeButton}
                onPress={handleChallenge}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={22} color="#0A0E17" />
                <Text style={styles.challengeButtonText}>CHALLENGE TERRITORY</Text>
              </TouchableOpacity>
            )}

            {/* Owner Notice */}
            {isOwner && (
              <View style={[styles.ownerNotice, { marginTop: 12 }]}>
                <Ionicons name="shield-checkmark" size={20} color="#00FF88" />
                <Text style={styles.ownerNoticeText}>
                  This is your territory. Walk through it regularly to prevent decay.
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
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#141B2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  classIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  classBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  classLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  yoursBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  yoursText: {
    color: '#00FF88',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    color: '#8892B0',
    fontSize: 11,
    marginTop: 4,
  },
  decayIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decayPercent: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  detailLabel: {
    color: '#8892B0',
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  decayBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  decayBarBg: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A2340',
    overflow: 'hidden',
  },
  decayBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  decayBarText: {
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4757',
    borderRadius: 16,
    height: 56,
    gap: 10,
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  challengeButtonText: {
    color: '#0A0E17',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  ownerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  ownerNoticeText: {
    flex: 1,
    color: '#8892B0',
    fontSize: 13,
    lineHeight: 18,
  },
  defenseLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  defenseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#141B2D',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  defenseBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  setDefenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB800',
    borderRadius: 16,
    height: 56,
    gap: 10,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  setDefenseButtonText: {
    color: '#0A0E17',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  removeDefenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderWidth: 1,
    borderColor: '#FF4757',
    borderRadius: 16,
    height: 48,
    gap: 10,
  },
  removeDefenseButtonText: {
    color: '#FF4757',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  defenseChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B61FF',
    borderRadius: 16,
    height: 56,
    gap: 10,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  defenseChallengeButtonText: {
    color: '#0A0E17',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

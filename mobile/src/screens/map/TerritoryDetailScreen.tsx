import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import type { BuildingType } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/constants';
import { strings as S, t, plural } from '../../i18n';
import { useFeatureStore } from '../../store/featureStore';
import { useBuildingStore } from '../../store/buildingStore';
import { useResourceStore } from '../../store/resourceStore';
import BuildingPickerSheet from '../../components/BuildingPickerSheet';
import type { Building } from '../../services/api';

const CLASS_COLORS: Record<MovementClass, string> = {
  walker: '#00D4FF', runner: '#FF4757', cyclist: '#00FF88',
  skater: '#FFB800', dog_walker: '#7B61FF', driver: '#8892B0', unknown: '#555E78',
};
const getClassLabels = (): Record<MovementClass, string> => ({
  walker: S.map.territoryDetail.classWalker,
  runner: S.map.territoryDetail.classRunner,
  cyclist: S.map.territoryDetail.classCyclist,
  skater: S.map.territoryDetail.classSkater,
  dog_walker: S.map.territoryDetail.classDogWalker,
  driver: S.map.territoryDetail.classDriver,
  unknown: S.map.territoryDetail.classUnknown,
});
const CLASS_ICONS: Record<MovementClass, keyof typeof Ionicons.glyphMap> = {
  walker: 'walk', runner: 'speedometer', cyclist: 'bicycle',
  skater: 'flash', dog_walker: 'paw', driver: 'car', unknown: 'help-circle',
};

const getDefenseLabels = (): Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> => ({
  rock_paper_scissors: { label: S.map.territoryDetail.gameRps, icon: 'hand-left-outline', color: '#7B61FF' },
  sprint_race: { label: S.map.territoryDetail.gameSprintRace, icon: 'speedometer-outline', color: '#00FF88' },
  trivia: { label: S.map.territoryDetail.gameTrivia, icon: 'help-circle-outline', color: '#00D4FF' },
  coin_flip: { label: S.map.territoryDetail.gameCoinFlip, icon: 'ellipse-outline', color: '#FFB800' },
  odd_even: { label: S.map.territoryDetail.gameOddEven, icon: 'finger-print-outline', color: '#FF69B4' },
  tic_tac_toe: { label: S.map.territoryDetail.gameTicTacToe, icon: 'grid-outline', color: '#00D4FF' },
  mini_chess: { label: S.map.territoryDetail.gameMiniChess, icon: 'trophy-outline', color: '#FFB800' },
  challenge: { label: S.map.territoryDetail.gameChallenge, icon: 'flag-outline', color: '#FF4757' },
  quest: { label: S.map.territoryDetail.gameQuest, icon: 'map-outline', color: '#00FF88' },
  echo: { label: S.map.territoryDetail.gameEcho, icon: 'volume-high-outline', color: '#7B61FF' },
});

export default function TerritoryDetailScreen({ route, navigation }: TerritoryDetailScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const classLabels = useMemo(getClassLabels, []);
  const defenseLabels = useMemo(getDefenseLabels, []);
  const { territory } = route.params;
  const { challengeTerritory } = useTerritoryStore();
  const { user } = useAuthStore();

  const isOwner = user?.id === territory.ownerId;
  const classColor = CLASS_COLORS[territory.movementClass];
  const decayLevel =
    territory.decayPercent < 30
      ? S.map.territoryDetail.strengthStrong
      : territory.decayPercent < 60
        ? S.map.territoryDetail.strengthFading
        : S.map.territoryDetail.strengthWeak;
  const decayColor =
    territory.decayPercent < 30 ? theme.accent : territory.decayPercent < 60 ? theme.warning : theme.danger;

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
    const info = defenseLabels[gameType] || defenseLabels.trivia;
    Alert.alert(
      S.map.territoryDetail.removeDefenseTitle,
      t(S.map.territoryDetail.removeDefenseMsg, { label: info.label }),
      [
        { text: S.common.cancel, style: 'cancel' },
        {
          text: S.common.remove,
          style: 'destructive',
          onPress: async () => {
            setRemovingId(defenseId);
            try {
              await defenseApi.removeDefense(defenseId);
              setDefenses(prev => prev.filter(d => d.id !== defenseId));
            } catch (err: any) {
              Alert.alert(S.common.error, err.message || S.map.territoryDetail.removeFailed);
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
      S.map.territoryDetail.challengeTitle,
      t(S.map.territoryDetail.challengeConfirm, { username: territory.ownerUsername }),
      [
        { text: S.common.cancel, style: 'cancel' },
        {
          text: S.map.territoryDetail.challengeAction,
          style: 'destructive',
          onPress: async () => {
            const success = await challengeTerritory(territory.id);
            if (success) {
              Alert.alert(S.map.territoryDetail.challengeStartedTitle, S.map.territoryDetail.challengeStartedMsg);
              navigation.goBack();
            } else {
              Alert.alert(S.common.error, S.map.territoryDetail.challengeStartFailed);
            }
          },
        },
      ]
    );
  };

  const usedSlots = defenses.length;
  const freeSlots = Math.max(0, maxSlots - usedSlots);

  // ─── Buildings (resources feature flag) ────────────────────────────────────
  const isResourcesEnabled = useFeatureStore((s) => s.isEnabled('resources') && s.capabilities.resources);
  const { buildingsByTerritory, loading: buildingLoading, build, upgrade, demolish } = useBuildingStore();
  const { balances, fetchResources } = useResourceStore();
  const [showBuildPicker, setShowBuildPicker] = useState(false);
  const buildings = buildingsByTerritory[territory.id] ?? [];

  // Fetch buildings and resource balances when the screen mounts (flag-gated)
  useEffect(() => {
    if (!isResourcesEnabled) return;
    useBuildingStore.getState().fetchBuildings(territory.id);
    fetchResources();
  }, [isResourcesEnabled, territory.id, fetchResources]);

  // Countdown timer for buildings under construction
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isResourcesEnabled) return;
    const hasUnderConstruction = buildings.some((b) => b.status === 'building' && b.completes_at);
    if (!hasUnderConstruction) return;
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [isResourcesEnabled, buildings]);

  const handleBuild = useCallback(async (type: BuildingType) => {
    setShowBuildPicker(false);
    const result = await build(territory.id, type);
    if (!result.success && result.message) {
      Alert.alert('Build failed', result.message);
    }
  }, [build, territory.id]);

  const handleDemolish = useCallback((buildingId: string, buildingName: string) => {
    Alert.alert(
      'Demolish building?',
      `"${buildingName}" will be demolished. You get 50% of construction costs back.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demolish',
          style: 'destructive',
          onPress: async () => {
            const result = await demolish(buildingId, territory.id);
            if (!result.success && result.message) {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  }, [demolish, territory.id]);

  const getBuildingName = (type: BuildingType): string => {
    const names: Record<BuildingType, string> = {
      shield_generator: 'Shield Generator',
      refinery: 'Refinery',
      radar: 'Radar',
      garrison: 'Garrison',
      silo: 'Silo',
      teleporter: 'Teleporter',
    };
    return names[type] ?? type;
  };

  /** Upgrade cost = base_energy × 2^currentTier (presented simply). */
  const getUpgradeCost = (b: Building): string => {
    const BASE_COSTS: Record<BuildingType, { e: number; t: number }> = {
      shield_generator: { e: 200, t: 100 },
      refinery: { e: 150, t: 80 },
      radar: { e: 180, t: 120 },
      garrison: { e: 250, t: 150 },
      silo: { e: 400, t: 250 },
      teleporter: { e: 300, t: 200 },
    };
    const base = BASE_COSTS[b.type] ?? { e: 0, t: 0 };
    const mult = Math.pow(2, b.tier);
    return `⚡${base.e * mult} ⚙${base.t * mult}`;
  };

  const handleUpgrade = useCallback((buildingId: string, buildingName: string) => {
    Alert.alert(
      'Upgrade building?',
      `Upgrade "${buildingName}" to tier ${/* shown below via cost */''} next tier?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            const result = await upgrade(buildingId, territory.id);
            if (!result.success && result.message) {
              Alert.alert('Upgrade failed', result.message);
            }
          },
        },
      ]
    );
  }, [upgrade, territory.id]);

  const getCountdownText = (completesAt: string | null): string => {
    if (!completesAt) return '';
    const msLeft = new Date(completesAt).getTime() - now;
    if (msLeft <= 0) return 'completing…';
    const mins = Math.ceil(msLeft / 60_000);
    if (mins < 60) return `${mins}m remaining`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m remaining` : `${hrs}h remaining`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{S.map.territoryDetail.headerTitle}</Text>
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
                {classLabels[territory.movementClass]}
              </Text>
            </View>
          </View>
          {isOwner && (
            <View style={styles.yoursBadge}>
              <Text style={styles.yoursText}>{S.map.territoryDetail.yoursBadge}</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="resize" size={20} color={theme.primary} />
            <Text style={styles.statValue}>{territory.area} m²</Text>
            <Text style={styles.statLabel}>{S.map.territoryDetail.statArea}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.decayIndicator, { borderColor: decayColor }]}>
              <Text style={[styles.decayPercent, { color: decayColor }]}>
                {100 - territory.decayPercent}%
              </Text>
            </View>
            <Text style={[styles.statValue, { color: decayColor }]}>{decayLevel}</Text>
            <Text style={styles.statLabel}>{S.map.territoryDetail.statStrength}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>{S.map.territoryDetail.detailsTitle}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.detailLabel}>{S.map.territoryDetail.claimedLabel}</Text>
            <Text style={styles.detailValue}>
              {format(new Date(territory.claimedAt), 'dd.MM.yyyy')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.detailLabel}>{S.map.territoryDetail.ageLabel}</Text>
            <Text style={styles.detailValue}>
              {formatDistanceToNow(new Date(territory.claimedAt), { addSuffix: true })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="trending-down-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.detailLabel}>{S.map.territoryDetail.decayLabel}</Text>
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
          {t(S.map.territoryDetail.defenseTitle, { used: usedSlots, max: maxSlots })}
        </Text>

        {defenseLoading ? (
          <View style={styles.defenseLoading}>
            <ActivityIndicator size="small" color={theme.textSecondary} />
          </View>
        ) : (
          <>
            {/* Slot Progress Bar */}
            <View style={styles.slotBar}>
              {Array.from({ length: maxSlots }).map((_, i) => {
                const filled = i < usedSlots;
                const defense = defenses[i];
                const color = defense ? (defenseLabels[defense.game_type]?.color || theme.warning) : theme.border;
                return (
                  <View
                    key={i}
                    style={[
                      styles.slotDot,
                      { backgroundColor: filled ? color : theme.border, borderColor: filled ? color : '#2A3350' },
                    ]}
                  >
                    {filled && <Ionicons name="shield-checkmark" size={10} color="#0A0E17" />}
                  </View>
                );
              })}
            </View>

            {/* Defense Layer Cards */}
            {defenses.map((defense, idx) => {
              const info = defenseLabels[defense.game_type] || defenseLabels.trivia;
              return (
                <View key={defense.id} style={[styles.defenseCard, { borderColor: info.color }]}>
                  <View style={[styles.defenseCardIcon, { backgroundColor: `${info.color}15` }]}>
                    <Ionicons name={info.icon} size={20} color={info.color} />
                  </View>
                  <View style={styles.defenseCardContent}>
                    <Text style={[styles.defenseCardTitle, { color: info.color }]}>
                      {info.label}
                    </Text>
                    <Text style={styles.defenseCardSlot}>{t(S.map.territoryDetail.slotNumber, { number: idx + 1 })}</Text>
                  </View>

                  {/* Owner: remove button */}
                  {isOwner && (
                    <TouchableOpacity
                      style={styles.defenseCardRemove}
                      onPress={() => handleRemoveDefense(defense.id, defense.game_type)}
                      disabled={removingId === defense.id}
                    >
                      {removingId === defense.id ? (
                        <ActivityIndicator size="small" color={theme.danger} />
                      ) : (
                        <Ionicons name="close-circle" size={22} color={theme.danger} />
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
                  {t(S.map.territoryDetail.addDefense, { count: freeSlots })}
                </Text>
              </TouchableOpacity>
            )}

            {/* Owner: max slots reached */}
            {isOwner && freeSlots === 0 && usedSlots > 0 && (
              <View style={styles.slotsFullNotice}>
                <Ionicons name="shield-checkmark" size={16} color={theme.accent} />
                <Text style={styles.slotsFullText}>
                  {t(S.map.territoryDetail.slotsFull, { max: maxSlots })}
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
                <Text style={styles.setDefenseButtonText}>{S.map.territoryDetail.setupDefense}</Text>
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
                <Text style={styles.challengeButtonText}>{S.map.territoryDetail.challengeTerritoryBtn}</Text>
              </TouchableOpacity>
            )}

            {/* Challenger: has defenses → info */}
            {!isOwner && usedSlots > 0 && (
              <View style={styles.challengeInfo}>
                <Ionicons name="information-circle" size={18} color={theme.warning} />
                <Text style={styles.challengeInfoText}>
                  {plural(usedSlots, S.map.territoryDetail.defeatAllDefensesOne, S.map.territoryDetail.defeatAllDefensesOther)}
                </Text>
              </View>
            )}

            {/* Owner Notice */}
            {isOwner && (
              <View style={[styles.ownerNotice, { marginTop: 12 }]}>
                <Ionicons name="footsteps-outline" size={20} color={theme.accent} />
                <Text style={styles.ownerNoticeText}>
                  {S.map.territoryDetail.ownerNotice}
                </Text>
              </View>
            )}
          </>
        )}

        {/* ─── BUILDINGS SECTION (resources feature flag, owner only) ─── */}
        {isResourcesEnabled && isOwner && (
          <>
            <Text style={[styles.sectionTitle, styles.buildingsSectionTitle]}>
              BUILDINGS
            </Text>

            {buildingLoading ? (
              <View style={styles.defenseLoading}>
                <ActivityIndicator size="small" color="#9D4EDD" />
              </View>
            ) : (
              <>
                {buildings.length === 0 && (
                  <View style={styles.buildingsEmpty}>
                    <Text style={styles.buildingsEmptyText}>
                      No buildings yet. Construct one to strengthen this territory.
                    </Text>
                  </View>
                )}

                {buildings.map((building) => {
                  const isUnderConstruction = building.status === 'building';
                  const statusColor =
                    building.status === 'active' ? '#00FF88' :
                    building.status === 'building' ? '#9D4EDD' :
                    building.status === 'damaged' ? '#FFB800' :
                    '#FF4757';
                  const canUpgrade = building.status === 'active' && building.tier < 3;
                  const TIER_LABELS = ['', 'I', 'II', 'III'];

                  return (
                    <View key={building.id} style={styles.buildingCard}>
                      <View style={styles.buildingCardContent}>
                        <View style={styles.buildingNameRow}>
                          <Text style={styles.buildingName}>{getBuildingName(building.type)}</Text>
                          {building.tier > 0 && (
                            <View style={styles.tierBadge}>
                              <Text style={styles.tierBadgeText}>
                                {TIER_LABELS[building.tier] ?? `T${building.tier}`}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.buildingStatusRow}>
                          <View style={[styles.buildingStatusDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.buildingStatusText, { color: statusColor }]}>
                            {isUnderConstruction
                              ? getCountdownText(building.completes_at)
                              : building.status.charAt(0).toUpperCase() + building.status.slice(1)}
                          </Text>
                        </View>
                        {/* Upgrade button — visible when active and tier < 3 */}
                        {canUpgrade && (
                          <TouchableOpacity
                            style={styles.upgradeBtn}
                            onPress={() => handleUpgrade(building.id, getBuildingName(building.type))}
                            disabled={buildingLoading}
                          >
                            <Ionicons name="arrow-up-circle-outline" size={13} color="#9D4EDD" />
                            <Text style={styles.upgradeBtnText}>
                              Upgrade · {getUpgradeCost(building)}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {/* Upgrading countdown */}
                        {isUnderConstruction && building.tier > 1 && (
                          <Text style={styles.upgradingText}>Upgrading…</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.buildingDemolishBtn}
                        onPress={() => handleDemolish(building.id, getBuildingName(building.type))}
                        disabled={buildingLoading}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={styles.buildNewBtn}
                  onPress={() => setShowBuildPicker(true)}
                  activeOpacity={0.8}
                  disabled={buildingLoading}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#0A0E17" />
                  <Text style={styles.buildNewBtnText}>Build</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Building picker sheet — outside ScrollView so Modal renders above everything */}
      {isResourcesEnabled && isOwner && (
        <BuildingPickerSheet
          visible={showBuildPicker}
          balances={balances}
          loading={buildingLoading}
          onClose={() => setShowBuildPicker(false)}
          onBuild={handleBuild}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: theme.text, fontSize: 18, fontWeight: '700' },
  headerSpacer: { width: 40 },
  ownerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  classIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  ownerInfo: { flex: 1 },
  ownerName: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  classBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  classLabel: { fontSize: 12, fontWeight: '600' },
  yoursBadge: { backgroundColor: 'rgba(0, 255, 136, 0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  yoursText: { color: theme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: theme.surface, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  statValue: { color: theme.text, fontSize: 20, fontWeight: '800', marginTop: 8 },
  statLabel: { color: theme.textSecondary, fontSize: 11, marginTop: 4 },
  decayIndicator: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  decayPercent: { fontSize: 11, fontWeight: '800' },
  detailsSection: { marginBottom: 24 },
  sectionTitle: { color: theme.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  detailLabel: { color: theme.textSecondary, fontSize: 14, flex: 1 },
  detailValue: { color: theme.text, fontSize: 14, fontWeight: '600' },
  decayBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
  decayBarBg: { width: 80, height: 6, borderRadius: 3, backgroundColor: theme.border, overflow: 'hidden' },
  decayBarFill: { height: '100%', borderRadius: 3 },
  decayBarText: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
  defenseLoading: { alignItems: 'center', paddingVertical: 20 },

  // Slot bar
  slotBar: { flexDirection: 'row', gap: 6, marginBottom: 16, justifyContent: 'center' },
  slotDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },

  // Defense layer cards
  defenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
  defenseCardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  defenseCardContent: { flex: 1 },
  defenseCardTitle: { fontSize: 14, fontWeight: '700' },
  defenseCardSlot: { color: theme.textSecondary, fontSize: 11, marginTop: 2 },
  defenseCardRemove: { padding: 6 },
  defenseCardAttack: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Add defense button
  addDefenseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.warning, borderRadius: 16, height: 52, gap: 10, marginTop: 4, marginBottom: 8 },
  addDefenseButtonText: { color: '#0A0E17', fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  // Slots full
  slotsFullNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0, 255, 136, 0.08)', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.2)' },
  slotsFullText: { flex: 1, color: theme.accent, fontSize: 12, fontWeight: '600' },

  // Set defense (first time)
  setDefenseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.warning, borderRadius: 16, height: 56, gap: 10, shadowColor: theme.warning, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  setDefenseButtonText: { color: '#0A0E17', fontSize: 16, fontWeight: '800', letterSpacing: 2 },

  // Challenge button
  challengeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.danger, borderRadius: 16, height: 56, gap: 10, shadowColor: theme.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  challengeButtonText: { color: '#0A0E17', fontSize: 16, fontWeight: '800', letterSpacing: 2 },

  // Challenge info
  challengeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 184, 0, 0.08)', borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255, 184, 0, 0.2)' },
  challengeInfoText: { flex: 1, color: theme.warning, fontSize: 12, fontWeight: '600' },

  // Owner notice
  ownerNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 255, 136, 0.08)', borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.2)', borderRadius: 12, padding: 16, gap: 12 },
  ownerNoticeText: { flex: 1, color: theme.textSecondary, fontSize: 13, lineHeight: 18 },

  // Buildings section (resources feature flag)
  buildingsSectionTitle: { marginTop: 28, color: '#9D4EDD' },
  buildingsEmpty: { backgroundColor: theme.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1A2340' },
  buildingsEmptyText: { color: theme.textSecondary, fontSize: 13, lineHeight: 18 },
  buildingCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.surface, borderRadius: 14, borderWidth: 1, borderColor: '#3A2060', padding: 14, marginBottom: 8, gap: 12 },
  buildingCardContent: { flex: 1 },
  buildingNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  buildingName: { color: theme.text, fontSize: 14, fontWeight: '700' },
  tierBadge: { backgroundColor: 'rgba(157,78,221,0.2)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: 'rgba(157,78,221,0.5)' },
  tierBadgeText: { color: '#9D4EDD', fontSize: 10, fontWeight: '800' },
  buildingStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buildingStatusDot: { width: 7, height: 7, borderRadius: 3.5 },
  buildingStatusText: { fontSize: 11, fontWeight: '600' },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: 'rgba(157,78,221,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(157,78,221,0.3)', alignSelf: 'flex-start' },
  upgradeBtnText: { color: '#9D4EDD', fontSize: 10, fontWeight: '700' },
  upgradingText: { color: '#9D4EDD', fontSize: 10, fontWeight: '600', marginTop: 4, fontStyle: 'italic' },
  buildingDemolishBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,71,87,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,71,87,0.25)' },
  buildNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#9D4EDD', borderRadius: 14, height: 48, gap: 8, marginTop: 4, shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  buildNewBtnText: { color: '#0A0E17', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});

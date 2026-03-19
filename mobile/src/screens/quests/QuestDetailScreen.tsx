import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuestStore } from '../../store/questStore';
import { QuestDetailScreenProps, Quest, QuestStepType } from '../../navigation/types';

const { width } = Dimensions.get('window');

const STEP_TYPE_ICONS: Record<QuestStepType, keyof typeof Ionicons.glyphMap> = {
  FIND: 'camera',
  LISTEN: 'ear',
  CHALLENGE: 'videocam',
  SOLVE: 'help-circle',
  COLLECT: 'location',
  DOG: 'paw',
};

const STEP_TYPE_COLORS: Record<QuestStepType, string> = {
  FIND: '#00D4FF',
  LISTEN: '#7B61FF',
  CHALLENGE: '#FF4757',
  SOLVE: '#FFB800',
  COLLECT: '#00FF88',
  DOG: '#7B61FF',
};

const STEP_TYPE_LABELS: Record<QuestStepType, string> = {
  FIND: 'Find',
  LISTEN: 'Listen',
  CHALLENGE: 'Challenge',
  SOLVE: 'Solve',
  COLLECT: 'Collect',
  DOG: 'Dog Task',
};

export default function QuestDetailScreen({ route, navigation }: QuestDetailScreenProps) {
  const { questId } = route.params;
  const { fetchQuestDetail, startQuest, isLoading } = useQuestStore();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchQuestDetail(questId);
      setQuest(data);
      setLoading(false);
    })();
  }, [questId]);

  const handleStartQuest = async () => {
    await startQuest(questId);
    navigation.replace('QuestPlay', { questId });
  };

  const renderDifficultyStars = (difficulty: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= difficulty ? 'star' : 'star-outline'}
          size={16}
          color={star <= difficulty ? '#FFB800' : '#2A3450'}
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </SafeAreaView>
    );
  }

  if (!quest) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF4757" />
        <Text style={styles.errorText}>Quest not found</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const mapCenter = quest.steps.length > 0
    ? quest.steps[0].location
    : quest.location;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#8892B0" />
        </TouchableOpacity>

        {/* Map Preview */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.mapPreview}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: mapCenter.latitude,
              longitude: mapCenter.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {quest.steps.map((step, index) => (
              <Circle
                key={`step-circle-${index}`}
                center={{
                  latitude: step.location.latitude,
                  longitude: step.location.longitude,
                }}
                radius={step.radius || 50}
                fillColor={`${STEP_TYPE_COLORS[step.type]}30`}
                strokeColor={STEP_TYPE_COLORS[step.type]}
                strokeWidth={1.5}
              />
            ))}
          </MapView>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>{quest.stepCount} locations</Text>
          </View>
        </View>

        {/* Quest Info */}
        <View style={styles.questInfo}>
          <Text style={styles.questTitle}>{quest.title}</Text>

          <View style={styles.questMeta}>
            {renderDifficultyStars(quest.difficulty)}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>{quest.rating.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.questStats}>
            <View style={styles.questStat}>
              <Ionicons name="footsteps" size={16} color="#8892B0" />
              <Text style={styles.questStatText}>{quest.stepCount} steps</Text>
            </View>
            <View style={styles.questStat}>
              <Ionicons name="navigate" size={16} color="#8892B0" />
              <Text style={styles.questStatText}>
                ~{quest.estimatedDistance < 1000
                  ? `${Math.round(quest.estimatedDistance)}m`
                  : `${(quest.estimatedDistance / 1000).toFixed(1)}km`}
              </Text>
            </View>
            <View style={styles.questStat}>
              <Ionicons name="checkmark-done" size={16} color="#8892B0" />
              <Text style={styles.questStatText}>{quest.completions} done</Text>
            </View>
          </View>

          <Text style={styles.description}>{quest.description}</Text>

          <View style={styles.creatorRow}>
            <Ionicons name="person-circle-outline" size={18} color="#8892B0" />
            <Text style={styles.creatorText}>by {quest.creatorUsername}</Text>
          </View>
        </View>

        {/* Seed Quest Growth Indicator */}
        {(quest as any).is_seed && (
          <View style={styles.growthSection}>
            <View style={styles.growthHeader}>
              <Ionicons name="leaf" size={18} color="#00FF88" />
              <Text style={styles.growthTitle}>Seed Quest</Text>
            </View>
            <View style={styles.growthLevelRow}>
              {['Seed', 'Sprout', 'Growing', 'Mature', 'Legendary'].map((name, idx) => {
                const growthLevel = (quest as any).growth_level ?? 0;
                const isActive = idx <= growthLevel;
                const isCurrent = idx === growthLevel;
                const iconNames: (keyof typeof Ionicons.glyphMap)[] = [
                  'ellipse-outline', 'leaf-outline', 'leaf', 'flower-outline', 'trophy'
                ];
                return (
                  <View key={name} style={styles.growthStage}>
                    <Ionicons
                      name={iconNames[idx]}
                      size={isCurrent ? 22 : 16}
                      color={isActive ? '#00FF88' : '#2A3450'}
                    />
                    <Text style={[
                      styles.growthStageName,
                      isActive && styles.growthStageNameActive,
                      isCurrent && styles.growthStageNameCurrent,
                    ]}>
                      {name}
                    </Text>
                  </View>
                );
              })}
            </View>
            {(quest as any).growth_info && (
              <View style={styles.growthProgress}>
                {(quest as any).growth_info.completionsToNext > 0 && (
                  <Text style={styles.growthProgressText}>
                    {(quest as any).growth_info.completionsToNext} more completions to next level
                  </Text>
                )}
                {(quest as any).growth_info.ratingToNext > 0 && (
                  <Text style={styles.growthProgressText}>
                    Needs +{(quest as any).growth_info.ratingToNext.toFixed(1)} avg rating
                  </Text>
                )}
              </View>
            )}
            {(quest as any).linked_quests && (quest as any).linked_quests.length > 0 && (
              <View style={styles.linkedSection}>
                <Ionicons name="link" size={14} color="#00D4FF" />
                <Text style={styles.linkedText}>
                  Linked with {(quest as any).linked_quests.length} nearby quest{(quest as any).linked_quests.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Steps Preview */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>STEPS</Text>
          {quest.steps.map((step, index) => (
            <View key={step.id} style={styles.stepCard}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: `${STEP_TYPE_COLORS[step.type]}20` },
                ]}
              >
                <Text style={[styles.stepNumberText, { color: STEP_TYPE_COLORS[step.type] }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTypeRow}>
                  <Ionicons
                    name={STEP_TYPE_ICONS[step.type]}
                    size={14}
                    color={STEP_TYPE_COLORS[step.type]}
                  />
                  <Text style={[styles.stepTypeLabel, { color: STEP_TYPE_COLORS[step.type] }]}>
                    {STEP_TYPE_LABELS[step.type]}
                  </Text>
                </View>
                <Text style={styles.stepInstruction} numberOfLines={1}>
                  {index === 0 ? step.instruction : '???'}
                </Text>
              </View>
              {index > 0 && (
                <Ionicons name="lock-closed" size={16} color="#2A3450" />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.startButton, isLoading && styles.startButtonDisabled]}
          onPress={handleStartQuest}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#0A0E17" size="small" />
          ) : (
            <>
              <Ionicons name="play" size={22} color="#0A0E17" />
              <Text style={styles.startButtonText}>START QUEST</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E17',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#FF4757',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 18, 32, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    width,
    height: 200,
    position: 'relative',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(13, 18, 32, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mapOverlayText: {
    color: '#8892B0',
    fontSize: 11,
    fontWeight: '600',
  },
  questInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2340',
  },
  questTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: '#FFB800',
    fontSize: 13,
    fontWeight: '700',
  },
  questStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  questStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  questStatText: {
    color: '#8892B0',
    fontSize: 13,
  },
  description: {
    color: '#B8C0D8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorText: {
    color: '#8892B0',
    fontSize: 13,
  },
  stepsSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 14,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1A2340',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stepTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepInstruction: {
    color: '#8892B0',
    fontSize: 13,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#1A2340',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D4FF',
    borderRadius: 16,
    height: 56,
    gap: 10,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    color: '#0A0E17',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  growthSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2340',
  },
  growthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  growthTitle: {
    color: '#00FF88',
    fontSize: 16,
    fontWeight: '800',
  },
  growthLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  growthStage: {
    alignItems: 'center',
    gap: 4,
  },
  growthStageName: {
    color: '#2A3450',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  growthStageNameActive: {
    color: '#00FF88',
  },
  growthStageNameCurrent: {
    fontSize: 10,
    fontWeight: '900',
  },
  growthProgress: {
    backgroundColor: '#141B2D',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  growthProgressText: {
    color: '#8892B0',
    fontSize: 12,
  },
  linkedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  linkedText: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
  },
});

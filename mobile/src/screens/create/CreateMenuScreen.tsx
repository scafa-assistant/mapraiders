import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { strings as S } from '../../i18n';
import { CreateMenuScreenProps } from '../../navigation/types';

const { width } = Dimensions.get('window');

interface CreateOption {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  screen: 'QuestCreate' | 'EchoCreate' | 'ChallengeCreate' | 'TravelRouteCreate' | 'MeetupCreate';
  minLevel: number;
  requiresTerritory: boolean;
}

const CREATE_OPTIONS: CreateOption[] = [
  {
    key: 'meetup',
    title: S.create.menu.eventTitle,
    description: S.create.menu.eventDesc,
    icon: 'calendar-outline',
    color: '#FFB800',
    screen: 'MeetupCreate',
    minLevel: 1,
    requiresTerritory: false,
  },
  {
    key: 'echo',
    title: S.create.menu.echoTitle,
    description: S.create.menu.echoDesc,
    icon: 'musical-note',
    color: '#7B61FF',
    screen: 'EchoCreate',
    minLevel: 1,
    requiresTerritory: false,
  },
  {
    key: 'quest',
    title: S.create.menu.questTitle,
    description: S.create.menu.questDesc,
    icon: 'compass',
    color: '#00D4FF',
    screen: 'QuestCreate',
    minLevel: 3,
    requiresTerritory: false,
  },
  {
    key: 'challenge',
    title: S.create.menu.challengeTitle,
    description: S.create.menu.challengeDesc,
    icon: 'barbell',
    color: '#FF4757',
    screen: 'ChallengeCreate',
    minLevel: 5,
    requiresTerritory: false,
  },
  {
    key: 'travel',
    title: S.create.menu.travelTitle,
    description: S.create.menu.travelDesc,
    icon: 'trail-sign',
    color: '#555E78',
    screen: 'TravelRouteCreate',
    minLevel: 999,
    requiresTerritory: false,
  },
];

export default function CreateMenuScreen({ navigation }: CreateMenuScreenProps) {
  const { user } = useAuthStore();
  const userLevel = user?.level ?? 1;
  const hasTerritories = (user?.totalClaims ?? 0) > 0;

  // All features unlocked except Coming Soon items
  const isUnlocked = (option: CreateOption): boolean => option.minLevel < 900;
  const getLockedReason = (option: CreateOption): string => option.minLevel >= 900 ? S.common.comingSoon : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{S.create.menu.title}</Text>
        <Text style={styles.headerSubtitle}>{S.create.menu.subtitle}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {CREATE_OPTIONS.map((option) => {
          const unlocked = isUnlocked(option);
          const lockedReason = getLockedReason(option);

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionCard,
                !unlocked && styles.optionCardLocked,
                unlocked && { borderColor: `${option.color}40` },
              ]}
              onPress={() => {
                if (unlocked) {
                  if (useSettingsStore.getState().settings.hapticFeedback) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  navigation.navigate(option.screen);
                }
              }}
              activeOpacity={unlocked ? 0.7 : 1}
            >
              {/* Icon */}
              <View
                style={[
                  styles.optionIconCircle,
                  {
                    backgroundColor: unlocked
                      ? `${option.color}15`
                      : '#141B2D',
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={28}
                  color={unlocked ? option.color : '#2A3450'}
                />
              </View>

              {/* Content */}
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    !unlocked && styles.optionTitleLocked,
                  ]}
                >
                  {option.title}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    !unlocked && styles.optionDescriptionLocked,
                  ]}
                >
                  {option.description}
                </Text>

                {!unlocked && (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={12} color="#555E78" />
                    <Text style={styles.lockedText}>{lockedReason}</Text>
                  </View>
                )}
              </View>

              {/* Arrow */}
              {unlocked ? (
                <Ionicons name="chevron-forward" size={22} color={option.color} />
              ) : (
                <Ionicons name="lock-closed" size={22} color="#2A3450" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#00D4FF" />
        <Text style={styles.infoText}>
          {S.create.menu.info}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8892B0',
    marginTop: 2,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1A2340',
    gap: 14,
  },
  optionCardLocked: {
    opacity: 0.5,
    borderColor: '#1A2340',
  },
  optionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionTitleLocked: {
    color: '#555E78',
  },
  optionDescription: {
    color: '#8892B0',
    fontSize: 12,
    lineHeight: 17,
  },
  optionDescriptionLocked: {
    color: '#2A3450',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  lockedText: {
    color: '#555E78',
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#8892B0',
    fontSize: 13,
    lineHeight: 19,
  },
});

import React, { useMemo } from 'react';
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
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/constants';
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

const getCreateOptions = (): CreateOption[] => [
  {
    key: 'meetup',
    title: S.create.menu.eventTitle,
    description: S.create.menu.eventDesc,
    icon: 'calendar-outline',
    color: '#F5A623',
    screen: 'MeetupCreate',
    minLevel: 1,
    requiresTerritory: false,
  },
  {
    key: 'echo',
    title: S.create.menu.echoTitle,
    description: S.create.menu.echoDesc,
    icon: 'musical-note',
    color: '#1558F0',
    screen: 'EchoCreate',
    minLevel: 1,
    requiresTerritory: false,
  },
  {
    key: 'quest',
    title: S.create.menu.questTitle,
    description: S.create.menu.questDesc,
    icon: 'compass',
    color: '#1558F0',
    screen: 'QuestCreate',
    minLevel: 3,
    requiresTerritory: false,
  },
  {
    key: 'challenge',
    title: S.create.menu.challengeTitle,
    description: S.create.menu.challengeDesc,
    icon: 'barbell',
    color: '#D7263D',
    screen: 'ChallengeCreate',
    minLevel: 5,
    requiresTerritory: false,
  },
  {
    key: 'travel',
    title: S.create.menu.travelTitle,
    description: S.create.menu.travelDesc,
    icon: 'trail-sign',
    color: '#7A7470',
    screen: 'TravelRouteCreate',
    minLevel: 999,
    requiresTerritory: false,
  },
];

export default function CreateMenuScreen({ navigation }: CreateMenuScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const createOptions = useMemo(getCreateOptions, []);
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
        {createOptions.map((option) => {
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
                      : theme.surface,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={28}
                  color={unlocked ? option.color : theme.textSecondary}
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
                    <Ionicons name="lock-closed" size={12} color={theme.textSecondary} />
                    <Text style={styles.lockedText}>{lockedReason}</Text>
                  </View>
                )}
              </View>

              {/* Arrow */}
              {unlocked ? (
                <Ionicons name="chevron-forward" size={22} color={option.color} />
              ) : (
                <Ionicons name="lock-closed" size={22} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#1558F0" />
        <Text style={styles.infoText}>
          {S.create.menu.info}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14,
  },
  optionCardLocked: {
    opacity: 0.5,
    borderColor: theme.border,
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
    color: theme.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionTitleLocked: {
    color: theme.textSecondary,
  },
  optionDescription: {
    color: theme.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  optionDescriptionLocked: {
    color: theme.textSecondary,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  lockedText: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: 'rgba(21, 88, 240, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 240, 0.15)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});

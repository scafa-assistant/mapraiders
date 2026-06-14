import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Theme, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
import { strings as S, t } from '../i18n';
import { getClassColor } from '../utils/colors';
import { formatDistance, formatRating } from '../utils/formatters';
import ClassBadge from './ClassBadge';
import type { Quest } from '../utils/types';

interface QuestCardProps {
  /** The quest to display. */
  quest: Quest;
  /** Callback when the card is pressed. */
  onPress: () => void;
  /** Optional distance from the user to this quest (in meters). */
  distance?: number;
}

/**
 * Quest list item card with a premium dark design.
 * Shows title, difficulty stars, rating, step count, class badges, and distance.
 * Left border gradient accent based on class color.
 */
const QuestCard: React.FC<QuestCardProps> = ({ quest, onPress, distance }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const classColor = getClassColor(quest.movementClass);
  const weatherLabels: Record<string, string> = S.components.questCard.weather;

  const renderDifficultyStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= quest.difficulty ? 'star' : 'star-outline'}
          size={12}
          color={i <= quest.difficulty ? theme.warning : theme.textSecondary}
          style={styles.star}
        />
      );
    }
    return stars;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: classColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {(quest as any).is_seed && (
            <View style={styles.seedBadge}>
              <Ionicons name="leaf" size={10} color={theme.accent} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {quest.title}
          </Text>
        </View>
        <ClassBadge movementClass={quest.movementClass} size="sm" />
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {quest.description}
      </Text>

      <View style={styles.metaRow}>
        {/* Difficulty */}
        <View style={styles.metaItem}>
          {renderDifficultyStars()}
        </View>

        {/* Weather Badge */}
        {(quest as any).weather_condition && (
          <View style={styles.weatherBadge}>
            <Ionicons
              name={
                (quest as any).weather_condition === 'rain' ? 'rainy' :
                (quest as any).weather_condition === 'snow' ? 'snow' :
                (quest as any).weather_condition === 'storm' ? 'thunderstorm' :
                (quest as any).weather_condition === 'fog' ? 'cloud' :
                (quest as any).weather_condition === 'wind' ? 'flag' :
                (quest as any).weather_condition === 'cold' ? 'thermometer-outline' :
                (quest as any).weather_condition === 'heat' ? 'flame' :
                'sunny'
              }
              size={10}
              color={theme.primary}
            />
            <Text style={styles.weatherBadgeText}>{weatherLabels[(quest as any).weather_condition] ?? (quest as any).weather_condition}</Text>
          </View>
        )}

        {/* Rating */}
        {quest.rating > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color={theme.warning} />
            <Text style={styles.metaText}>{formatRating(quest.rating)}</Text>
          </View>
        )}

        {/* Step count */}
        <View style={styles.metaItem}>
          <Ionicons name="footsteps-outline" size={12} color={theme.textSecondary} />
          <Text style={styles.metaText}>{t(S.components.questCard.stepsCount, { count: quest.stepCount })}</Text>
        </View>

        {/* Completions */}
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={12} color={theme.textSecondary} />
          <Text style={styles.metaText}>{quest.completions}</Text>
        </View>
      </View>

      {/* Bottom row: distance and creator */}
      <View style={styles.bottomRow}>
        {distance !== undefined && (
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={11} color={theme.primary} />
            <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
          </View>
        )}
        <Text style={styles.creatorText}>{t(S.components.questCard.by, { username: quest.creatorUsername })}</Text>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.lg,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
    gap: 6,
  },
  seedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(27, 158, 90, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: theme.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    flex: 1,
  },
  description: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 88, 240, 0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  weatherBadgeText: {
    color: theme.primary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  star: {
    marginRight: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 88, 240, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  distanceText: {
    color: theme.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  creatorText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontStyle: 'italic',
  },
});

export default React.memo(QuestCard);

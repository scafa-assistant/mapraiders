import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
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
  const classColor = getClassColor(quest.movementClass);

  const renderDifficultyStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= quest.difficulty ? 'star' : 'star-outline'}
          size={12}
          color={i <= quest.difficulty ? THEME.warning : THEME.textSecondary}
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
        <Text style={styles.title} numberOfLines={1}>
          {quest.title}
        </Text>
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

        {/* Rating */}
        {quest.rating > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color={THEME.warning} />
            <Text style={styles.metaText}>{formatRating(quest.rating)}</Text>
          </View>
        )}

        {/* Step count */}
        <View style={styles.metaItem}>
          <Ionicons name="footsteps-outline" size={12} color={THEME.textSecondary} />
          <Text style={styles.metaText}>{quest.stepCount} steps</Text>
        </View>

        {/* Completions */}
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={12} color={THEME.textSecondary} />
          <Text style={styles.metaText}>{quest.completions}</Text>
        </View>
      </View>

      {/* Bottom row: distance and creator */}
      <View style={styles.bottomRow}>
        {distance !== undefined && (
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={11} color={THEME.primary} />
            <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
          </View>
        )}
        <Text style={styles.creatorText}>by {quest.creatorUsername}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.surface,
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
  title: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    flex: 1,
    marginRight: SPACING.sm,
  },
  description: {
    color: THEME.textSecondary,
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
  metaText: {
    color: THEME.textSecondary,
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
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  distanceText: {
    color: THEME.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  creatorText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontStyle: 'italic',
  },
});

export default React.memo(QuestCard);

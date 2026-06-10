import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
import { strings as S } from '../i18n';
import { getRankColor } from '../utils/colors';
import { formatXP } from '../utils/formatters';
import ClassBadge from './ClassBadge';
import type { LeaderboardEntry, MovementClass } from '../utils/types';

interface LeaderboardRowProps {
  /** The leaderboard entry data. */
  entry: LeaderboardEntry;
  /** The rank position (1-indexed). */
  rank: number;
  /** Whether this row represents the current user. */
  isCurrentUser: boolean;
}

/**
 * Single row in a leaderboard.
 * Shows rank number, username, score, and optional class badge.
 * Top 3 ranks get gold/silver/bronze coloring.
 * Current user's row is highlighted.
 */
const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  entry,
  rank,
  isCurrentUser,
}) => {
  const rankColor = getRankColor(rank);
  const isTopThree = rank <= 3;

  const getRankIcon = (): keyof typeof Ionicons.glyphMap | null => {
    switch (rank) {
      case 1:
        return 'trophy';
      case 2:
        return 'medal-outline';
      case 3:
        return 'medal-outline';
      default:
        return null;
    }
  };

  const rankIcon = getRankIcon();

  return (
    <View
      style={[
        styles.container,
        isCurrentUser && styles.currentUserContainer,
        isTopThree && styles.topThreeContainer,
      ]}
    >
      {/* Rank */}
      <View style={styles.rankContainer}>
        {rankIcon ? (
          <Ionicons name={rankIcon} size={20} color={rankColor} />
        ) : (
          <Text style={[styles.rankText, { color: rankColor }]}>
            {rank}
          </Text>
        )}
      </View>

      {/* Avatar placeholder + Username */}
      <View style={styles.userInfo}>
        <View
          style={[
            styles.avatarCircle,
            { borderColor: isCurrentUser ? THEME.primary : THEME.border },
          ]}
        >
          <Ionicons
            name="person"
            size={14}
            color={isCurrentUser ? THEME.primary : THEME.textSecondary}
          />
        </View>
        <View style={styles.nameContainer}>
          <Text
            style={[
              styles.username,
              isCurrentUser && styles.currentUserText,
              isTopThree && { color: rankColor },
            ]}
            numberOfLines={1}
          >
            {entry.username}
            {isCurrentUser && S.components.leaderboardRow.youSuffix}
          </Text>
        </View>
      </View>

      {/* Class badge */}
      {entry.movementClass && (
        <ClassBadge movementClass={entry.movementClass} size="sm" />
      )}

      {/* Score */}
      <View style={styles.scoreContainer}>
        <Text
          style={[
            styles.scoreText,
            isTopThree && { color: rankColor },
            isCurrentUser && styles.currentUserScore,
          ]}
        >
          {formatXP(entry.score)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  currentUserContainer: {
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: THEME.primary,
  },
  topThreeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  nameContainer: {
    flex: 1,
  },
  username: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  currentUserText: {
    color: THEME.primary,
  },
  scoreContainer: {
    marginLeft: SPACING.md,
    alignItems: 'flex-end',
    minWidth: 60,
  },
  scoreText: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  currentUserScore: {
    color: THEME.primary,
  },
});

export default React.memo(LeaderboardRow);

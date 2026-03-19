import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
import type { Challenge } from '../utils/types';

interface ChallengeCardProps {
  /** The challenge to display. */
  challenge: Challenge;
  /** Callback when the card is pressed. */
  onPress: () => void;
  /** Optional number of completions. */
  completions?: number;
  /** Optional movement class for badge display. */
  movementClass?: string;
}

/**
 * Map verification level to icon and label.
 */
function getVerificationInfo(level: Challenge['verificationLevel']): {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
} {
  switch (level) {
    case 'honor':
      return { icon: 'hand-left-outline', label: 'Honor', color: THEME.accent };
    case 'video':
      return { icon: 'videocam-outline', label: 'Video', color: THEME.warning };
    case 'sensor':
      return { icon: 'hardware-chip-outline', label: 'Sensor', color: THEME.danger };
    default:
      return { icon: 'shield-outline', label: 'Unknown', color: THEME.textSecondary };
  }
}

/**
 * Format challenge parameters into a readable string.
 */
function formatParameters(params: Record<string, number>): string {
  return Object.entries(params)
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return `${label}: ${value}`;
    })
    .join('  |  ');
}

/**
 * Challenge list item card.
 * Shows template name, parameters, verification level, completions, and class badge.
 */
const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onPress,
  completions = 0,
  movementClass,
}) => {
  const verification = getVerificationInfo(challenge.verificationLevel);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with icon and title */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="trophy-outline" size={22} color={THEME.warning} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.templateName} numberOfLines={1}>
            {challenge.template}
          </Text>
          <Text style={styles.creatorText}>
            by {challenge.creatorUsername}
          </Text>
        </View>
      </View>

      {/* Parameters */}
      {Object.keys(challenge.parameters).length > 0 && (
        <View style={styles.parametersContainer}>
          <Text style={styles.parametersText} numberOfLines={2}>
            {formatParameters(challenge.parameters)}
          </Text>
        </View>
      )}

      {/* Footer: verification level, completions */}
      <View style={styles.footer}>
        {/* Verification badge */}
        <View style={[styles.verificationBadge, { borderColor: verification.color }]}>
          <Ionicons
            name={verification.icon as keyof typeof Ionicons.glyphMap}
            size={12}
            color={verification.color}
          />
          <Text style={[styles.verificationText, { color: verification.color }]}>
            {verification.label}
          </Text>
        </View>

        {/* Completions */}
        <View style={styles.completionsContainer}>
          <Ionicons name="checkmark-circle-outline" size={13} color={THEME.textSecondary} />
          <Text style={styles.completionsText}>
            {completions} done
          </Text>
        </View>

        {/* Class badge if provided */}
        {movementClass && (
          <View style={styles.classBadge}>
            <Ionicons name="flash-outline" size={11} color={THEME.primary} />
            <Text style={styles.classText}>
              {movementClass.replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  templateName: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  creatorText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  parametersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  parametersText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    gap: 4,
  },
  verificationText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  completionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completionsText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  classText: {
    color: THEME.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});

export default React.memo(ChallengeCard);

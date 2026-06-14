import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Theme, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
import { strings as S, t } from '../i18n';
import { formatDistance, formatNumber } from '../utils/formatters';
import StatBar from './StatBar';
import type { Pet } from '../utils/types';

interface PetCardProps {
  /** The pet to display. */
  pet: Pet;
}

/**
 * Map pet specialization to color and icon.
 */
function getSpecInfo(spec: Pet['specialization'], theme: Theme): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
} {
  switch (spec) {
    case 'explorer':
      return { icon: 'compass-outline', color: theme.primary, label: S.components.petCard.specExplorer };
    case 'tracker':
      return { icon: 'search-outline', color: theme.accent, label: S.components.petCard.specTracker };
    case 'guardian':
      return { icon: 'shield-outline', color: theme.secondary, label: S.components.petCard.specGuardian };
    default:
      return { icon: 'help-outline', color: theme.textSecondary, label: S.components.petCard.specNone };
  }
}

/**
 * Pet display card showing name, species/breed, level with XP bar,
 * specialization badge, and stats (distance, walks, rare finds).
 */
const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const specInfo = getSpecInfo(pet.specialization, theme);

  return (
    <View style={styles.container}>
      {/* Paw decorations */}
      <View style={styles.pawDecor1}>
        <Ionicons name="paw" size={60} color="rgba(21, 88, 240, 0.04)" />
      </View>
      <View style={styles.pawDecor2}>
        <Ionicons name="paw" size={40} color="rgba(27, 158, 90, 0.04)" />
      </View>

      {/* Header: avatar + name/breed */}
      <View style={styles.header}>
        {pet.photo_url ? (
          <Image
            source={{ uri: 'https://api.mapraiders.com' + pet.photo_url }}
            style={styles.avatarPhoto}
          />
        ) : (
          <View style={styles.avatarCircle}>
            <Ionicons name="paw" size={28} color={theme.secondary} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.breed}>
            {pet.breed ? `${pet.breed} ${pet.species}` : pet.species}
          </Text>
        </View>
        {/* Specialization badge */}
        {pet.specialization && (
          <View style={[styles.specBadge, { borderColor: specInfo.color }]}>
            <Ionicons name={specInfo.icon} size={14} color={specInfo.color} />
            <Text style={[styles.specLabel, { color: specInfo.color }]}>
              {specInfo.label}
            </Text>
          </View>
        )}
      </View>

      {/* Level + XP bar */}
      <View style={styles.levelSection}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{t(S.components.petCard.level, { level: pet.level })}</Text>
        </View>
        <View style={styles.xpBarWrapper}>
          <StatBar
            current={pet.xp}
            max={pet.xpToNextLevel}
            color={theme.secondary}
            height={6}
            showPercentage={false}
            showValues
          />
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <Ionicons name="footsteps-outline" size={16} color={theme.primary} />
          </View>
          <Text style={styles.statValue}>{formatDistance(pet.totalDistance)}</Text>
          <Text style={styles.statLabel}>{S.components.petCard.distance}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <Ionicons name="walk-outline" size={16} color={theme.accent} />
          </View>
          <Text style={styles.statValue}>{formatNumber(pet.totalWalks)}</Text>
          <Text style={styles.statLabel}>{S.components.petCard.walks}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <Ionicons name="diamond-outline" size={16} color={theme.warning} />
          </View>
          <Text style={styles.statValue}>{formatNumber(pet.rareFinds)}</Text>
          <Text style={styles.statLabel}>{S.components.petCard.rareFinds}</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: '#1558F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  pawDecor1: {
    position: 'absolute',
    top: -10,
    right: -10,
    transform: [{ rotate: '-20deg' }],
  },
  pawDecor2: {
    position: 'absolute',
    bottom: 10,
    left: -5,
    transform: [{ rotate: '30deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(21, 88, 240, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(21, 88, 240, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: theme.secondary,
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    color: theme.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  breed: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 4,
  },
  specLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  levelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  levelBadge: {
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  levelText: {
    color: theme.secondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  xpBarWrapper: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20, 18, 16, 0.06)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 18, 16, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    color: theme.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  statLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.border,
    marginHorizontal: SPACING.sm,
  },
});

export default React.memo(PetCard);

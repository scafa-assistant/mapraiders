import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
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
function getSpecInfo(spec: Pet['specialization']): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
} {
  switch (spec) {
    case 'explorer':
      return { icon: 'compass-outline', color: THEME.primary, label: 'Explorer' };
    case 'tracker':
      return { icon: 'search-outline', color: THEME.accent, label: 'Tracker' };
    case 'guardian':
      return { icon: 'shield-outline', color: THEME.secondary, label: 'Guardian' };
    default:
      return { icon: 'help-outline', color: THEME.textSecondary, label: 'No Spec' };
  }
}

/**
 * Pet display card showing name, species/breed, level with XP bar,
 * specialization badge, and stats (distance, walks, rare finds).
 */
const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const specInfo = getSpecInfo(pet.specialization);

  return (
    <View style={styles.container}>
      {/* Paw decorations */}
      <View style={styles.pawDecor1}>
        <Ionicons name="paw" size={60} color="rgba(123, 97, 255, 0.04)" />
      </View>
      <View style={styles.pawDecor2}>
        <Ionicons name="paw" size={40} color="rgba(0, 255, 136, 0.04)" />
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
            <Ionicons name="paw" size={28} color={THEME.secondary} />
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
          <Text style={styles.levelText}>Lv.{pet.level}</Text>
        </View>
        <View style={styles.xpBarWrapper}>
          <StatBar
            current={pet.xp}
            max={pet.xpToNextLevel}
            color={THEME.secondary}
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
            <Ionicons name="footsteps-outline" size={16} color={THEME.primary} />
          </View>
          <Text style={styles.statValue}>{formatDistance(pet.totalDistance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <Ionicons name="walk-outline" size={16} color={THEME.accent} />
          </View>
          <Text style={styles.statValue}>{formatNumber(pet.totalWalks)}</Text>
          <Text style={styles.statLabel}>Walks</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <Ionicons name="diamond-outline" size={16} color={THEME.warning} />
          </View>
          <Text style={styles.statValue}>{formatNumber(pet.rareFinds)}</Text>
          <Text style={styles.statLabel}>Rare Finds</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
    shadowColor: '#7B61FF',
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
    backgroundColor: 'rgba(123, 97, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: THEME.secondary,
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  breed: {
    color: THEME.textSecondary,
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
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  levelText: {
    color: THEME.secondary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  statLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: THEME.border,
    marginHorizontal: SPACING.sm,
  },
});

export default React.memo(PetCard);

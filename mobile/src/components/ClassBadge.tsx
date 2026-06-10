import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CLASS_COLORS, CLASS_ICONS, CLASS_LABELS, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
import { strings as S } from '../i18n';
import { withOpacity } from '../utils/colors';
import type { MovementClass } from '../utils/types';

interface ClassBadgeProps {
  /** The movement class to display. */
  movementClass: MovementClass;
  /** Size variant. */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the label text alongside the icon. */
  showLabel?: boolean;
}

/**
 * Small badge showing a movement class with an icon and colored background.
 */
const ClassBadge: React.FC<ClassBadgeProps> = ({
  movementClass,
  size = 'md',
  showLabel = false,
}) => {
  const color = CLASS_COLORS[movementClass] ?? '#8892B0';
  const iconName = (CLASS_ICONS[movementClass] ?? 'help-outline') as keyof typeof Ionicons.glyphMap;
  const label = CLASS_LABELS[movementClass] ?? S.components.classBadge.unknown;

  const sizeConfig = SIZE_CONFIGS[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: withOpacity(color, 0.12),
          borderColor: withOpacity(color, 0.3),
          paddingHorizontal: sizeConfig.paddingH,
          paddingVertical: sizeConfig.paddingV,
          borderRadius: sizeConfig.borderRadius,
        },
      ]}
    >
      <Ionicons name={iconName} size={sizeConfig.iconSize} color={color} />
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color,
              fontSize: sizeConfig.fontSize,
              marginLeft: sizeConfig.gap,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const SIZE_CONFIGS = {
  sm: {
    iconSize: 12,
    fontSize: FONT_SIZE.xs,
    paddingH: SPACING.xs + 2,
    paddingV: 2,
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  md: {
    iconSize: 16,
    fontSize: FONT_SIZE.sm,
    paddingH: SPACING.sm,
    paddingV: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 5,
  },
  lg: {
    iconSize: 22,
    fontSize: FONT_SIZE.md,
    paddingH: SPACING.md,
    paddingV: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: 8,
  },
} as const;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
  },
});

export default React.memo(ClassBadge);

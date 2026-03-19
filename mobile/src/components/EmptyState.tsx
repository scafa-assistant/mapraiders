import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';

interface EmptyStateProps {
  /** Ionicons icon name to display. */
  icon: keyof typeof Ionicons.glyphMap;
  /** Title text. */
  title: string;
  /** Description message. */
  message: string;
  /** Optional action button label. */
  actionLabel?: string;
  /** Optional action button callback. */
  onAction?: () => void;
  /** Optional icon color override. */
  iconColor?: string;
}

/**
 * Generic empty state component.
 * Centered icon, title, message, and optional action button.
 * Used when a list or screen has no data to display.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  iconColor = THEME.textSecondary,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={48} color={iconColor} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxl * 2,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    backgroundColor: THEME.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  actionText: {
    color: THEME.bg,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});

export default React.memo(EmptyState);

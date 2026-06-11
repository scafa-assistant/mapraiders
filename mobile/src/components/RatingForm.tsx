import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Theme, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
import { strings as S } from '../i18n';
import type { Rating } from '../utils/types';

interface RatingFormProps {
  /** Callback with the completed rating. */
  onSubmit: (rating: Rating) => void;
  /** Whether the form is submitting. */
  isSubmitting?: boolean;
  /** Optional title text. */
  title?: string;
}

interface StarRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

/**
 * A single row of 5 tappable stars.
 */
const StarRow: React.FC<StarRowProps> = ({ label, value, onChange }) => {
  const theme = useTheme();
  const starStyles = useMemo(() => createStarStyles(theme), [theme]);

  return (
    <View style={starStyles.row}>
      <Text style={starStyles.label}>{label}</Text>
      <View style={starStyles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={28}
              color={star <= value ? theme.warning : theme.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const createStarStyles = (theme: Theme) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  label: {
    color: theme.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    flex: 1,
  },
  stars: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
});

/**
 * Rating form for quests and routes.
 * 3 rows of 5 stars: Creativity, Difficulty, "Worth it?"
 * Optional comment text input and submit button.
 */
const RatingForm: React.FC<RatingFormProps> = ({
  onSubmit,
  isSubmitting = false,
  title = S.components.ratingForm.titleDefault,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [creativity, setCreativity] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [worthIt, setWorthIt] = useState(0);
  const [comment, setComment] = useState('');

  const canSubmit = creativity > 0 && difficulty > 0 && worthIt > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      creativity,
      difficulty,
      worthIt,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Ionicons name="star-half-outline" size={20} color={theme.warning} />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Star rows */}
      <View style={styles.starsContainer}>
        <StarRow label={S.components.ratingForm.creativity} value={creativity} onChange={setCreativity} />
        <StarRow label={S.components.ratingForm.difficulty} value={difficulty} onChange={setDifficulty} />
        <StarRow label={S.components.ratingForm.worthIt} value={worthIt} onChange={setWorthIt} />
      </View>

      {/* Comment input */}
      <View style={styles.commentContainer}>
        <Text style={styles.commentLabel}>{S.components.ratingForm.commentLabel}</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder={S.components.ratingForm.commentPlaceholder}
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>
      </View>

      {/* Submit button */}
      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <Text style={styles.submitText}>{S.components.ratingForm.submitting}</Text>
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color={theme.bg} />
            <Text style={styles.submitText}>{S.components.ratingForm.submit}</Text>
          </>
        )}
      </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  title: {
    color: theme.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  starsContainer: {
    marginBottom: SPACING.lg,
  },
  commentContainer: {
    marginBottom: SPACING.xl,
  },
  commentLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  commentInput: {
    backgroundColor: theme.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: SPACING.md,
    color: theme.text,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    maxHeight: 160,
  },
  charCount: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: theme.bg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});

export default React.memo(RatingForm);

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, RADIUS, SPACING, FONT_SIZE } from '../utils/constants';
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
              color={star <= value ? THEME.warning : THEME.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  label: {
    color: THEME.text,
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
  title = 'Rate this experience',
}) => {
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
        <Ionicons name="star-half-outline" size={20} color={THEME.warning} />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Star rows */}
      <View style={styles.starsContainer}>
        <StarRow label="Creativity" value={creativity} onChange={setCreativity} />
        <StarRow label="Difficulty" value={difficulty} onChange={setDifficulty} />
        <StarRow label="Worth it?" value={worthIt} onChange={setWorthIt} />
      </View>

      {/* Comment input */}
      <View style={styles.commentContainer}>
        <Text style={styles.commentLabel}>Comment (optional)</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Share your thoughts..."
          placeholderTextColor={THEME.textSecondary}
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
          <Text style={styles.submitText}>Submitting...</Text>
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color={THEME.bg} />
            <Text style={styles.submitText}>Submit Rating</Text>
          </>
        )}
      </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  title: {
    color: THEME.text,
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
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  commentInput: {
    backgroundColor: THEME.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: SPACING.md,
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    maxHeight: 160,
  },
  charCount: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
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
    color: THEME.bg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});

export default React.memo(RatingForm);

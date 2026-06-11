import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { clanApi } from '../../services/api';
import { strings as S } from '../../i18n';

const PRESET_COLORS = [
  '#00D4FF',
  '#7B61FF',
  '#00FF88',
  '#FFB800',
  '#FF4757',
  '#FF69B4',
  '#8892B0',
  '#FFFFFF',
];

export default function CreateClanScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isValid = name.trim().length >= 3 && tag.trim().length >= 2;

  const handleTagChange = (text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 6) {
      setTag(cleaned);
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await clanApi.create({
        name: name.trim(),
        description: description.trim(),
        tag: tag.trim(),
        color,
        privacy: isPublic ? 'public' : 'private',
      });
      Alert.alert(S.profile.createClan.createdTitle, S.profile.createClan.createdMessage, [
        { text: S.common.ok, onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.profile.createClan.createFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.profile.createClan.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Card */}
          <View style={[styles.previewCard, { borderTopColor: color }]}>
            <View style={styles.previewTopBar} />
            <View style={[styles.previewShieldCircle, { borderColor: `${color}50` }]}>
              <Ionicons name="shield" size={28} color={color} />
            </View>
            {tag.length > 0 && (
              <View style={[styles.previewTagBadge, { backgroundColor: `${color}20` }]}>
                <Text style={[styles.previewTagText, { color }]}>[{tag}]</Text>
              </View>
            )}
            <Text style={styles.previewName} numberOfLines={1}>
              {name.trim() || S.profile.createClan.nameLabel}
            </Text>
            <View style={styles.previewMeta}>
              <Ionicons
                name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                size={12}
                color={theme.textSecondary}
              />
              <Text style={styles.previewMetaText}>
                {isPublic ? S.profile.clan.public : S.profile.clan.private}
              </Text>
            </View>
          </View>

          {/* Clan Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{S.profile.createClan.nameLabel} *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="people" size={18} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={S.profile.createClan.namePlaceholder}
                placeholderTextColor="#3A4560"
                value={name}
                onChangeText={(t) => t.length <= 30 && setName(t)}
                maxLength={30}
                autoCapitalize="words"
              />
              <Text style={styles.charCount}>{name.length}/30</Text>
            </View>
            {name.length > 0 && name.trim().length < 3 && (
              <Text style={styles.errorHint}>{S.profile.createClan.minChars3}</Text>
            )}
          </View>

          {/* Clan Tag */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{S.profile.createClan.tagLabel} *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="pricetag" size={18} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={S.profile.createClan.tagPlaceholder}
                placeholderTextColor="#3A4560"
                value={tag}
                onChangeText={handleTagChange}
                maxLength={6}
                autoCapitalize="characters"
              />
              <Text style={styles.charCount}>{tag.length}/6</Text>
            </View>
            {tag.length > 0 && tag.length < 2 && (
              <Text style={styles.errorHint}>{S.profile.createClan.minChars2}</Text>
            )}
            {tag.length >= 2 && (
              <View style={styles.tagPreviewRow}>
                <Text style={styles.tagPreviewLabel}>{S.profile.createClan.previewLabel}</Text>
                <View style={[styles.tagPreviewChip, { backgroundColor: `${color}20` }]}>
                  <Text style={[styles.tagPreviewChipText, { color }]}>[{tag}]</Text>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{S.profile.createClan.descriptionLabel}</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={S.profile.createClan.descriptionPlaceholder}
                placeholderTextColor="#3A4560"
                value={description}
                onChangeText={(t) => t.length <= 500 && setDescription(t)}
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <Text style={[styles.charCount, { alignSelf: 'flex-end', marginTop: 4 }]}>
              {description.length}/500
            </Text>
          </View>

          {/* Color Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{S.profile.createClan.colorLabel}</Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    color === c && styles.colorCircleSelected,
                    color === c && { borderColor: c, shadowColor: c },
                  ]}
                  onPress={() => setColor(c)}
                  activeOpacity={0.7}
                >
                  {color === c && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={c === '#FFFFFF' ? '#0A0E17' : '#0A0E17'}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy Toggle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{S.profile.createClan.privacyLabel}</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, isPublic && styles.toggleBtnActive]}
                onPress={() => setIsPublic(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={isPublic ? theme.bg : theme.textSecondary}
                />
                <Text style={[styles.toggleText, isPublic && styles.toggleTextActive]}>
                  {S.profile.clan.public}
                </Text>
                <Text style={[styles.toggleSubtext, isPublic && styles.toggleSubtextActive]}>
                  {S.profile.createClan.publicHint}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isPublic && styles.toggleBtnActive]}
                onPress={() => setIsPublic(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={!isPublic ? theme.bg : theme.textSecondary}
                />
                <Text style={[styles.toggleText, !isPublic && styles.toggleTextActive]}>
                  {S.profile.clan.private}
                </Text>
                <Text style={[styles.toggleSubtext, !isPublic && styles.toggleSubtextActive]}>
                  {S.profile.createClan.privateHint}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#0A0E17" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={22} color="#0A0E17" />
                <Text style={styles.submitBtnText}>{S.profile.createClan.submitButton}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // ─── Preview Card ──────────────────────────────────
  previewCard: {
    backgroundColor: theme.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderTopWidth: 4,
    overflow: 'hidden',
  },
  previewTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  previewShieldCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
  },
  previewTagBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
  previewTagText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
    letterSpacing: 2,
  },
  previewName: {
    color: theme.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  previewMetaText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
  },

  // ─── Form Fields ──────────────────────────────────
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  label: {
    color: theme.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: SPACING.lg,
    height: 52,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  textArea: {
    height: 96,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  charCount: {
    color: '#3A4560',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  errorHint: {
    color: theme.danger,
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
    marginLeft: 2,
  },
  tagPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.sm,
  },
  tagPreviewLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  tagPreviewChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  tagPreviewChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ─── Color Picker ──────────────────────────────────
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.15 }],
  },

  // ─── Privacy Toggle ─────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  toggleText: {
    color: theme.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: theme.bg,
  },
  toggleSubtext: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
  },
  toggleSubtextActive: {
    color: 'rgba(10,14,23,0.6)',
  },

  // ─── Submit Button ─────────────────────────────────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB800',
    borderRadius: RADIUS.lg,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginTop: SPACING.md,
  },
  submitBtnDisabled: {
    backgroundColor: '#2A3040',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#0A0E17',
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

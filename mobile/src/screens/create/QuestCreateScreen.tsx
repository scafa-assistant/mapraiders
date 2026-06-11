import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { questApi } from '../../services/api';
import { strings as S, t, plural } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/constants';
import { QuestCreateScreenProps, QuestStepType } from '../../navigation/types';

const { width } = Dimensions.get('window');

interface DraftStep {
  id: string;
  type: QuestStepType;
  instruction: string;
  location: { latitude: number; longitude: number };
  radius: number;
  hint: string;
}

const getStepTypes = (): { type: QuestStepType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] => [
  { type: 'FIND', label: S.create.quest.typeFind, icon: 'camera', color: '#00D4FF' },
  { type: 'LISTEN', label: S.create.quest.typeListen, icon: 'ear', color: '#7B61FF' },
  { type: 'CHALLENGE', label: S.create.quest.typeChallenge, icon: 'videocam', color: '#FF4757' },
  { type: 'SOLVE', label: S.create.quest.typeSolve, icon: 'help-circle', color: '#FFB800' },
  { type: 'COLLECT', label: S.create.quest.typeCollect, icon: 'location', color: '#00FF88' },
  { type: 'DOG', label: S.create.quest.typeDog, icon: 'paw', color: '#7B61FF' },
];

type WizardStep = 'info' | 'steps' | 'edit' | 'preview';

export default function QuestCreateScreen({ navigation }: QuestCreateScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const stepTypes = useMemo(getStepTypes, []);
  const { currentLocation } = useLocationStore();
  const mapRef = useRef<MapView>(null);

  const [wizardStep, setWizardStep] = useState<WizardStep>('info');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [weatherCondition, setWeatherCondition] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<'any' | 'day' | 'night'>('any');
  const [isSeed, setIsSeed] = useState(false);
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Current editing step
  const editingStep = editingStepIndex !== null ? steps[editingStepIndex] : null;

  const handleMapPress = (event: MapPressEvent) => {
    if (wizardStep !== 'steps') return;
    const { latitude, longitude } = event.nativeEvent.coordinate;

    const newStep: DraftStep = {
      id: `step-${Date.now()}`,
      type: 'FIND',
      instruction: '',
      location: { latitude, longitude },
      radius: 50,
      hint: '',
    };
    setSteps([...steps, newStep]);
    setEditingStepIndex(steps.length);
    setWizardStep('edit');
  };

  const updateStep = (field: keyof DraftStep, value: any) => {
    if (editingStepIndex === null) return;
    const updated = [...steps];
    updated[editingStepIndex] = { ...updated[editingStepIndex], [field]: value };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
    if (editingStepIndex === index) {
      setEditingStepIndex(null);
      setWizardStep('steps');
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert(S.create.quest.missingTitleTitle, S.create.quest.missingTitleMsg);
      return;
    }
    if (steps.length < 2) {
      Alert.alert(S.create.quest.tooFewStepsTitle, S.create.quest.tooFewStepsMsg);
      return;
    }
    for (const step of steps) {
      if (!step.instruction.trim()) {
        Alert.alert(S.create.quest.missingInstructionTitle, S.create.quest.missingInstructionMsg);
        return;
      }
    }

    setIsPublishing(true);
    try {
      await questApi.create({
        title: title.trim(),
        description: description.trim(),
        difficulty,
        weather_condition: weatherCondition || undefined,
        time_window: timeWindow,
        is_seed: isSeed,
        steps: steps.map((s, i) => ({
          order: i,
          type: s.type,
          instruction: s.instruction.trim(),
          location: s.location,
          radius: s.radius,
          hint: s.hint.trim() || undefined,
        })),
      });
      Alert.alert(S.create.quest.publishedTitle, S.create.quest.publishedMsg, [
        { text: S.common.ok, onPress: () => navigation.goBack() },
      ]);
    } catch (_err) {
      Alert.alert(S.common.error, S.create.quest.publishFailed);
    } finally {
      setIsPublishing(false);
    }
  };

  const renderInfoStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.infoContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.wizardTitle}>{S.create.quest.detailsTitle}</Text>
        <Text style={styles.wizardSubtitle}>{S.create.quest.detailsSubtitle}</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{S.create.quest.titleLabel}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={S.create.quest.titlePlaceholder}
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
          <Text style={styles.charCount}>{title.length}/60</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{S.create.quest.descriptionLabel}</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder={S.create.quest.descriptionPlaceholder}
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{S.create.quest.difficultyLabel}</Text>
          <View style={styles.difficultyRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setDifficulty(star)}>
                <Ionicons
                  name={star <= difficulty ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= difficulty ? '#FFB800' : theme.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{S.create.quest.weatherLabel}</Text>
          <View style={styles.weatherGrid}>
            {[
              { value: null, label: S.create.quest.weatherAny, icon: 'partly-sunny' as keyof typeof Ionicons.glyphMap },
              { value: 'rain', label: S.create.quest.weatherRain, icon: 'rainy' as keyof typeof Ionicons.glyphMap },
              { value: 'snow', label: S.create.quest.weatherSnow, icon: 'snow' as keyof typeof Ionicons.glyphMap },
              { value: 'fog', label: S.create.quest.weatherFog, icon: 'cloud' as keyof typeof Ionicons.glyphMap },
              { value: 'wind', label: S.create.quest.weatherWind, icon: 'flag' as keyof typeof Ionicons.glyphMap },
              { value: 'storm', label: S.create.quest.weatherStorm, icon: 'thunderstorm' as keyof typeof Ionicons.glyphMap },
              { value: 'clear', label: S.create.quest.weatherClear, icon: 'sunny' as keyof typeof Ionicons.glyphMap },
              { value: 'cold', label: S.create.quest.weatherCold, icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap },
              { value: 'heat', label: S.create.quest.weatherHeat, icon: 'flame' as keyof typeof Ionicons.glyphMap },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value ?? 'any'}
                style={[
                  styles.weatherChip,
                  weatherCondition === opt.value && styles.weatherChipActive,
                ]}
                onPress={() => setWeatherCondition(opt.value)}
              >
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={weatherCondition === opt.value ? '#00D4FF' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.weatherChipLabel,
                    weatherCondition === opt.value && { color: '#00D4FF' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seed Quest Toggle */}
        <View style={styles.fieldGroup}>
          <View style={styles.seedToggleRow}>
            <View style={styles.seedToggleInfo}>
              <View style={styles.seedToggleLabelRow}>
                <Ionicons name="leaf" size={18} color="#00FF88" />
                <Text style={styles.seedToggleLabel}>{S.create.quest.seedToggleLabel}</Text>
              </View>
              <Text style={styles.seedToggleDescription}>
                {S.create.quest.seedToggleDesc}
              </Text>
            </View>
            <Switch
              value={isSeed}
              onValueChange={setIsSeed}
              trackColor={{ false: theme.border, true: 'rgba(0, 255, 136, 0.3)' }}
              thumbColor={isSeed ? '#00FF88' : theme.textSecondary}
            />
          </View>
        </View>

        {/* Time Window (Night Layer) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{S.create.quest.timeWindowLabel}</Text>
          <View style={styles.difficultyRow}>
            {([
              { value: 'any' as const, label: S.create.quest.timeAny, icon: 'time-outline' as keyof typeof Ionicons.glyphMap },
              { value: 'day' as const, label: S.create.quest.timeDayOnly, icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap },
              { value: 'night' as const, label: S.create.quest.timeNightOnly, icon: 'moon-outline' as keyof typeof Ionicons.glyphMap },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.radiusChip,
                  timeWindow === opt.value && (opt.value === 'night'
                    ? { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: '#8B5CF6' }
                    : styles.radiusChipActive),
                ]}
                onPress={() => setTimeWindow(opt.value)}
              >
                <Ionicons
                  name={opt.icon}
                  size={14}
                  color={timeWindow === opt.value ? (opt.value === 'night' ? '#8B5CF6' : '#00D4FF') : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.radiusChipText,
                    timeWindow === opt.value && {
                      color: opt.value === 'night' ? '#8B5CF6' : '#00D4FF',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, !title.trim() && styles.nextButtonDisabled]}
          onPress={() => {
            if (title.trim()) setWizardStep('steps');
          }}
          disabled={!title.trim()}
        >
          <Text style={styles.nextButtonText}>{S.create.quest.nextPlaceSteps}</Text>
          <Ionicons name="arrow-forward" size={20} color="#0A0E17" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderStepsStep = () => (
    <View style={styles.flex}>
      <View style={styles.stepsHeader}>
        <Text style={styles.wizardTitle}>{S.create.quest.placeStepsTitle}</Text>
        <Text style={styles.wizardSubtitle}>
          {t(S.create.quest.placeStepsSubtitle, { count: steps.length })}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={
            currentLocation
              ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }
              : {
                  latitude: 44.4268,
                  longitude: 26.1025,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
          }
          onPress={handleMapPress}
          showsUserLocation
        >
          {steps.map((step, index) => {
            const typeInfo = stepTypes.find((t) => t.type === step.type);
            return (
              <Marker
                key={step.id}
                coordinate={step.location}
                onPress={() => {
                  setEditingStepIndex(index);
                  setWizardStep('edit');
                }}
              >
                <View style={[styles.stepMarker, { backgroundColor: typeInfo?.color || '#00D4FF' }]}>
                  <Text style={styles.stepMarkerText}>{index + 1}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
      </View>

      {/* Steps list at bottom */}
      {steps.length > 0 && (
        <View style={styles.stepsListContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsList}>
            {steps.map((step, index) => {
              const typeInfo = stepTypes.find((t) => t.type === step.type);
              return (
                <TouchableOpacity
                  key={step.id}
                  style={[styles.stepChip, { borderColor: typeInfo?.color || theme.border }]}
                  onPress={() => {
                    setEditingStepIndex(index);
                    setWizardStep('edit');
                  }}
                >
                  <Text style={[styles.stepChipNumber, { color: typeInfo?.color }]}>
                    {index + 1}
                  </Text>
                  <Ionicons name={typeInfo?.icon || 'help'} size={14} color={typeInfo?.color} />
                  <Text style={styles.stepChipLabel} numberOfLines={1}>
                    {step.instruction || S.create.quest.untitled}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.stepsActions}>
        <TouchableOpacity style={styles.backButton} onPress={() => setWizardStep('info')}>
          <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
          <Text style={styles.backButtonText}>{S.common.back}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, styles.nextButtonSmall, steps.length < 2 && styles.nextButtonDisabled]}
          onPress={() => {
            if (steps.length >= 2) setWizardStep('preview');
          }}
          disabled={steps.length < 2}
        >
          <Text style={styles.nextButtonText}>{S.create.quest.preview}</Text>
          <Ionicons name="arrow-forward" size={18} color="#0A0E17" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEditStep = () => {
    if (!editingStep) return null;
    const typeInfo = stepTypes.find((t) => t.type === editingStep.type);

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.editContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.editHeader}>
            <Text style={styles.wizardTitle}>
              {t(S.create.quest.stepTitle, { number: editingStepIndex !== null ? editingStepIndex + 1 : '' })}
            </Text>
            <TouchableOpacity
              style={styles.deleteStepButton}
              onPress={() => {
                if (editingStepIndex !== null) {
                  removeStep(editingStepIndex);
                }
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#FF4757" />
            </TouchableOpacity>
          </View>

          {/* Step Type Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{S.create.quest.typeLabel}</Text>
            <View style={styles.typeGrid}>
              {stepTypes.map((typeOption) => (
                <TouchableOpacity
                  key={typeOption.type}
                  style={[
                    styles.typeChip,
                    editingStep.type === typeOption.type && {
                      backgroundColor: `${typeOption.color}20`,
                      borderColor: typeOption.color,
                    },
                  ]}
                  onPress={() => updateStep('type', typeOption.type)}
                >
                  <Ionicons
                    name={typeOption.icon}
                    size={18}
                    color={editingStep.type === typeOption.type ? typeOption.color : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeChipLabel,
                      editingStep.type === typeOption.type && { color: typeOption.color },
                    ]}
                  >
                    {typeOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Instruction */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{S.create.quest.instructionLabel}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder={S.create.quest.instructionPlaceholder}
              placeholderTextColor={theme.textSecondary}
              value={editingStep.instruction}
              onChangeText={(text) => updateStep('instruction', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Hint */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{S.create.quest.hintLabel}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={S.create.quest.hintPlaceholder}
              placeholderTextColor={theme.textSecondary}
              value={editingStep.hint}
              onChangeText={(text) => updateStep('hint', text)}
            />
          </View>

          {/* Radius */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t(S.create.quest.radiusLabel, { radius: editingStep.radius })}</Text>
            <View style={styles.radiusRow}>
              {[20, 30, 50, 75, 100].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.radiusChip,
                    editingStep.radius === r && styles.radiusChipActive,
                  ]}
                  onPress={() => updateStep('radius', r)}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      editingStep.radius === r && styles.radiusChipTextActive,
                    ]}
                  >
                    {r}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setWizardStep('steps')}
          >
            <Ionicons name="checkmark" size={20} color="#0A0E17" />
            <Text style={styles.nextButtonText}>{S.create.quest.saveStep}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderPreview = () => (
    <ScrollView style={styles.flex} contentContainerStyle={styles.previewContent}>
      <Text style={styles.wizardTitle}>{S.create.quest.previewTitle}</Text>
      <Text style={styles.wizardSubtitle}>{S.create.quest.previewSubtitle}</Text>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>{title}</Text>
        <Text style={styles.previewDescription}>{description}</Text>

        <View style={styles.previewMeta}>
          <View style={styles.previewDifficulty}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= difficulty ? 'star' : 'star-outline'}
                size={14}
                color={star <= difficulty ? '#FFB800' : theme.textSecondary}
              />
            ))}
          </View>
          <Text style={styles.previewStepCount}>{plural(steps.length, S.create.quest.stepsCountOne, S.create.quest.stepsCountOther)}</Text>
        </View>
      </View>

      <Text style={styles.previewSectionTitle}>{S.create.quest.stepsLabel}</Text>
      {steps.map((step, index) => {
        const typeInfo = stepTypes.find((t) => t.type === step.type);
        return (
          <View key={step.id} style={styles.previewStep}>
            <View style={[styles.previewStepNumber, { backgroundColor: `${typeInfo?.color}20` }]}>
              <Text style={[styles.previewStepNumberText, { color: typeInfo?.color }]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.previewStepContent}>
              <View style={styles.previewStepTypeRow}>
                <Ionicons name={typeInfo?.icon || 'help'} size={14} color={typeInfo?.color} />
                <Text style={[styles.previewStepType, { color: typeInfo?.color }]}>
                  {typeInfo?.label}
                </Text>
              </View>
              <Text style={styles.previewStepInstruction}>{step.instruction}</Text>
            </View>
          </View>
        );
      })}

      <View style={styles.publishActions}>
        <TouchableOpacity style={styles.backButton} onPress={() => setWizardStep('steps')}>
          <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
          <Text style={styles.backButtonText}>{S.create.quest.edit}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishButton, isPublishing && styles.publishButtonDisabled]}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator color="#0A0E17" size="small" />
          ) : (
            <>
              <Ionicons name="rocket" size={20} color="#0A0E17" />
              <Text style={styles.publishButtonText}>{S.create.quest.publishQuest}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Step indicators */}
        <View style={styles.stepIndicators}>
          {(['info', 'steps', 'edit', 'preview'] as WizardStep[]).map((step, index) => (
            <View
              key={step}
              style={[
                styles.stepDot,
                (wizardStep === step ||
                  (['info', 'steps', 'edit', 'preview'].indexOf(wizardStep) >= index)) &&
                  styles.stepDotActive,
              ]}
            />
          ))}
        </View>

        <View style={{ width: 24 }} />
      </View>

      {/* Wizard content */}
      {wizardStep === 'info' && renderInfoStep()}
      {wizardStep === 'steps' && renderStepsStep()}
      {wizardStep === 'edit' && renderEditStep()}
      {wizardStep === 'preview' && renderPreview()}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  flex: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  stepDotActive: {
    backgroundColor: '#00D4FF',
  },
  infoContent: {
    padding: 20,
    paddingBottom: 40,
  },
  editContent: {
    padding: 20,
    paddingBottom: 40,
  },
  previewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  wizardTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  wizardSubtitle: {
    color: theme.textSecondary,
    fontSize: 13,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.text,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: theme.textSecondary,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weatherChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: '#00D4FF',
  },
  weatherChipLabel: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D4FF',
    borderRadius: 14,
    height: 52,
    gap: 8,
    marginTop: 8,
  },
  nextButtonSmall: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    color: '#0A0E17',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Steps placement
  stepsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  stepMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stepMarkerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepsListContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
  stepsList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    maxWidth: 160,
  },
  stepChipNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepChipLabel: {
    color: theme.textSecondary,
    fontSize: 11,
    flexShrink: 1,
  },
  stepsActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 12,
    backgroundColor: theme.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Edit step
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deleteStepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeChipLabel: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  radiusChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: '#00D4FF',
  },
  radiusChipText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  radiusChipTextActive: {
    color: '#00D4FF',
  },
  // Preview
  previewCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  previewTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  previewDescription: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewDifficulty: {
    flexDirection: 'row',
    gap: 2,
  },
  previewStepCount: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  previewSectionTitle: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  previewStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  previewStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewStepNumberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  previewStepContent: {
    flex: 1,
  },
  previewStepTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  previewStepType: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  previewStepInstruction: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  publishActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  publishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF88',
    borderRadius: 14,
    height: 52,
    gap: 8,
  },
  publishButtonDisabled: {
    opacity: 0.7,
  },
  publishButtonText: {
    color: '#0A0E17',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  seedToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
  },
  seedToggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  seedToggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  seedToggleLabel: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  seedToggleDescription: {
    color: theme.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
});

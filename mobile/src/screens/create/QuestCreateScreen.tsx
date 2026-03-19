import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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

const STEP_TYPES: { type: QuestStepType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { type: 'FIND', label: 'Find', icon: 'camera', color: '#00D4FF' },
  { type: 'LISTEN', label: 'Listen', icon: 'ear', color: '#7B61FF' },
  { type: 'CHALLENGE', label: 'Challenge', icon: 'videocam', color: '#FF4757' },
  { type: 'SOLVE', label: 'Solve', icon: 'help-circle', color: '#FFB800' },
  { type: 'COLLECT', label: 'Collect', icon: 'location', color: '#00FF88' },
  { type: 'DOG', label: 'Dog', icon: 'paw', color: '#7B61FF' },
];

type WizardStep = 'info' | 'steps' | 'edit' | 'preview';

export default function QuestCreateScreen({ navigation }: QuestCreateScreenProps) {
  const { currentLocation } = useLocationStore();
  const mapRef = useRef<MapView>(null);

  const [wizardStep, setWizardStep] = useState<WizardStep>('info');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(3);
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
      Alert.alert('Missing Title', 'Please enter a quest title.');
      return;
    }
    if (steps.length < 2) {
      Alert.alert('Too Few Steps', 'Add at least 2 steps to your quest.');
      return;
    }
    for (const step of steps) {
      if (!step.instruction.trim()) {
        Alert.alert('Missing Instruction', 'Every step needs an instruction.');
        return;
      }
    }

    setIsPublishing(true);
    try {
      await questApi.create({
        title: title.trim(),
        description: description.trim(),
        difficulty,
        steps: steps.map((s, i) => ({
          order: i,
          type: s.type,
          instruction: s.instruction.trim(),
          location: s.location,
          radius: s.radius,
          hint: s.hint.trim() || undefined,
        })),
      });
      Alert.alert('Quest Published!', 'Your quest is now live on the grid.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (_err) {
      Alert.alert('Error', 'Failed to publish quest. Please try again.');
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
        <Text style={styles.wizardTitle}>Quest Details</Text>
        <Text style={styles.wizardSubtitle}>Give your quest a name and description</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>TITLE</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter quest title..."
            placeholderTextColor="#555E78"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
          <Text style={styles.charCount}>{title.length}/60</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe your quest..."
            placeholderTextColor="#555E78"
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
          <Text style={styles.label}>DIFFICULTY</Text>
          <View style={styles.difficultyRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setDifficulty(star)}>
                <Ionicons
                  name={star <= difficulty ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= difficulty ? '#FFB800' : '#2A3450'}
                />
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
          <Text style={styles.nextButtonText}>NEXT: PLACE STEPS</Text>
          <Ionicons name="arrow-forward" size={20} color="#0A0E17" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderStepsStep = () => (
    <View style={styles.flex}>
      <View style={styles.stepsHeader}>
        <Text style={styles.wizardTitle}>Place Steps</Text>
        <Text style={styles.wizardSubtitle}>
          Tap on the map to add quest steps ({steps.length} added)
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
            const typeInfo = STEP_TYPES.find((t) => t.type === step.type);
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
              const typeInfo = STEP_TYPES.find((t) => t.type === step.type);
              return (
                <TouchableOpacity
                  key={step.id}
                  style={[styles.stepChip, { borderColor: typeInfo?.color || '#1A2340' }]}
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
                    {step.instruction || 'Untitled'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.stepsActions}>
        <TouchableOpacity style={styles.backButton} onPress={() => setWizardStep('info')}>
          <Ionicons name="arrow-back" size={20} color="#8892B0" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, styles.nextButtonSmall, steps.length < 2 && styles.nextButtonDisabled]}
          onPress={() => {
            if (steps.length >= 2) setWizardStep('preview');
          }}
          disabled={steps.length < 2}
        >
          <Text style={styles.nextButtonText}>PREVIEW</Text>
          <Ionicons name="arrow-forward" size={18} color="#0A0E17" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEditStep = () => {
    if (!editingStep) return null;
    const typeInfo = STEP_TYPES.find((t) => t.type === editingStep.type);

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
              Step {editingStepIndex !== null ? editingStepIndex + 1 : ''}
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
            <Text style={styles.label}>TYPE</Text>
            <View style={styles.typeGrid}>
              {STEP_TYPES.map((typeOption) => (
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
                    color={editingStep.type === typeOption.type ? typeOption.color : '#555E78'}
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
            <Text style={styles.label}>INSTRUCTION</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="What should the player do at this step?"
              placeholderTextColor="#555E78"
              value={editingStep.instruction}
              onChangeText={(text) => updateStep('instruction', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Hint */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>HINT (OPTIONAL)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Hint revealed after 5 minutes..."
              placeholderTextColor="#555E78"
              value={editingStep.hint}
              onChangeText={(text) => updateStep('hint', text)}
            />
          </View>

          {/* Radius */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>RADIUS: {editingStep.radius}m</Text>
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
            <Text style={styles.nextButtonText}>SAVE STEP</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderPreview = () => (
    <ScrollView style={styles.flex} contentContainerStyle={styles.previewContent}>
      <Text style={styles.wizardTitle}>Preview</Text>
      <Text style={styles.wizardSubtitle}>Review your quest before publishing</Text>

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
                color={star <= difficulty ? '#FFB800' : '#2A3450'}
              />
            ))}
          </View>
          <Text style={styles.previewStepCount}>{steps.length} steps</Text>
        </View>
      </View>

      <Text style={styles.previewSectionTitle}>STEPS</Text>
      {steps.map((step, index) => {
        const typeInfo = STEP_TYPES.find((t) => t.type === step.type);
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
          <Ionicons name="arrow-back" size={20} color="#8892B0" />
          <Text style={styles.backButtonText}>Edit</Text>
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
              <Text style={styles.publishButtonText}>PUBLISH QUEST</Text>
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
          <Ionicons name="close" size={24} color="#8892B0" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
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
    backgroundColor: '#1A2340',
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
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  wizardSubtitle: {
    color: '#8892B0',
    fontSize: 13,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#8892B0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A2340',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#555E78',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
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
    borderTopColor: '#1A2340',
    backgroundColor: '#0D1220',
  },
  stepsList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
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
    color: '#8892B0',
    fontSize: 11,
    flexShrink: 1,
  },
  stepsActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#0D1220',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#8892B0',
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
    backgroundColor: '#141B2D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A2340',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeChipLabel: {
    color: '#555E78',
    fontSize: 12,
    fontWeight: '600',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    backgroundColor: '#141B2D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A2340',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  radiusChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: '#00D4FF',
  },
  radiusChipText: {
    color: '#555E78',
    fontSize: 13,
    fontWeight: '600',
  },
  radiusChipTextActive: {
    color: '#00D4FF',
  },
  // Preview
  previewCard: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  previewDescription: {
    color: '#8892B0',
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
    color: '#8892B0',
    fontSize: 13,
  },
  previewSectionTitle: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  previewStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1A2340',
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
    color: '#8892B0',
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
});

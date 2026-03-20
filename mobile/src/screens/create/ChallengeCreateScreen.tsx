import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { challengeApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { ChallengeCreateScreenProps } from '../../navigation/types';

interface ChallengeTemplate {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  parameters: { key: string; label: string; unit: string; min: number; max: number; default: number }[];
}

const TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'distance_sprint',
    name: 'Distance Sprint',
    icon: 'speedometer-outline',
    description: 'Run a certain distance as fast as possible',
    parameters: [
      { key: 'distance', label: 'Distance', unit: 'm', min: 100, max: 5000, default: 500 },
    ],
  },
  {
    id: 'area_claim',
    name: 'Area Challenge',
    icon: 'resize-outline',
    description: 'Claim a minimum area in one session',
    parameters: [
      { key: 'minArea', label: 'Min Area', unit: 'm²', min: 1000, max: 100000, default: 5000 },
    ],
  },
  {
    id: 'elevation_climb',
    name: 'Elevation Climb',
    icon: 'trending-up-outline',
    description: 'Gain a certain elevation during your route',
    parameters: [
      { key: 'elevation', label: 'Elevation', unit: 'm', min: 10, max: 1000, default: 50 },
    ],
  },
  {
    id: 'step_count',
    name: 'Step Counter',
    icon: 'footsteps-outline',
    description: 'Walk a target number of steps',
    parameters: [
      { key: 'steps', label: 'Steps', unit: '', min: 1000, max: 50000, default: 10000 },
    ],
  },
  {
    id: 'time_walk',
    name: 'Timed Walk',
    icon: 'timer-outline',
    description: 'Walk continuously for a set duration',
    parameters: [
      { key: 'duration', label: 'Duration', unit: 'min', min: 5, max: 180, default: 30 },
    ],
  },
  {
    id: 'explore_new',
    name: 'Explorer',
    icon: 'compass-outline',
    description: 'Visit a number of new, unclaimed cells',
    parameters: [
      { key: 'cells', label: 'New Cells', unit: '', min: 5, max: 100, default: 20 },
    ],
  },
];

type VerificationLevel = 'honor' | 'video' | 'sensor';

export default function ChallengeCreateScreen({ navigation }: ChallengeCreateScreenProps) {
  const { currentLocation } = useLocationStore();
  const [selectedTemplate, setSelectedTemplate] = useState<ChallengeTemplate | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [verification, setVerification] = useState<VerificationLevel>('sensor');
  const [weatherCondition, setWeatherCondition] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<'any' | 'day' | 'night'>('any');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectTemplate = (template: ChallengeTemplate) => {
    setSelectedTemplate(template);
    const defaults: Record<string, number> = {};
    template.parameters.forEach((p) => {
      defaults[p.key] = p.default;
    });
    setParamValues(defaults);
  };

  const updateParam = (key: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setParamValues((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !currentLocation) {
      Alert.alert('Error', 'Please select a template and ensure GPS is available');
      return;
    }

    setIsSubmitting(true);
    try {
      await challengeApi.create({
        template: selectedTemplate.id,
        parameters: paramValues,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        verificationLevel: verification,
        weather_condition: weatherCondition || undefined,
        time_window: timeWindow,
      });
      Alert.alert('Challenge Created!', 'Other MapRaiders nearby can now attempt your challenge.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const VERIFICATION_OPTIONS: { value: VerificationLevel; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
    { value: 'honor', label: 'Honor', icon: 'hand-left-outline', desc: 'Trust-based' },
    { value: 'sensor', label: 'Sensor', icon: 'hardware-chip-outline', desc: 'GPS + motion verified' },
    { value: 'video', label: 'Video', icon: 'videocam-outline', desc: 'Video proof required' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Challenge</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Select Template */}
        <Text style={styles.sectionHeader}>1. Choose Template</Text>
        <View style={styles.templateGrid}>
          {TEMPLATES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.templateCard,
                selectedTemplate?.id === t.id && styles.templateCardActive,
              ]}
              onPress={() => selectTemplate(t)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={t.icon}
                size={28}
                color={selectedTemplate?.id === t.id ? THEME.primary : THEME.textSecondary}
              />
              <Text
                style={[
                  styles.templateName,
                  selectedTemplate?.id === t.id && styles.templateNameActive,
                ]}
              >
                {t.name}
              </Text>
              <Text style={styles.templateDesc} numberOfLines={2}>
                {t.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 2: Configure Parameters */}
        {selectedTemplate && (
          <>
            <Text style={styles.sectionHeader}>2. Set Parameters</Text>
            <View style={styles.paramsCard}>
              {selectedTemplate.parameters.map((param) => (
                <View key={param.key} style={styles.paramRow}>
                  <View style={styles.paramLabelRow}>
                    <Text style={styles.paramLabel}>{param.label}</Text>
                    <Text style={styles.paramRange}>
                      {param.min} - {param.max} {param.unit}
                    </Text>
                  </View>
                  <View style={styles.paramInputRow}>
                    <TouchableOpacity
                      style={styles.paramBtn}
                      onPress={() => {
                        const step = Math.max(1, Math.floor((param.max - param.min) / 20));
                        const newVal = Math.max(param.min, (paramValues[param.key] || param.default) - step);
                        setParamValues((prev) => ({ ...prev, [param.key]: newVal }));
                      }}
                    >
                      <Ionicons name="remove" size={18} color={THEME.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.paramInput}
                      value={String(paramValues[param.key] || param.default)}
                      onChangeText={(v) => updateParam(param.key, v)}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <Text style={styles.paramUnit}>{param.unit}</Text>
                    <TouchableOpacity
                      style={styles.paramBtn}
                      onPress={() => {
                        const step = Math.max(1, Math.floor((param.max - param.min) / 20));
                        const newVal = Math.min(param.max, (paramValues[param.key] || param.default) + step);
                        setParamValues((prev) => ({ ...prev, [param.key]: newVal }));
                      }}
                    >
                      <Ionicons name="add" size={18} color={THEME.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Step 3: Verification Level */}
            <Text style={styles.sectionHeader}>3. Verification</Text>
            <View style={styles.verificationRow}>
              {VERIFICATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.verificationCard,
                    verification === opt.value && styles.verificationCardActive,
                  ]}
                  onPress={() => setVerification(opt.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={verification === opt.value ? THEME.primary : THEME.textSecondary}
                  />
                  <Text
                    style={[
                      styles.verificationLabel,
                      verification === opt.value && styles.verificationLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.verificationDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Step 4: Weather Condition (optional) */}
            <Text style={styles.sectionHeader}>4. Weather Condition (Optional)</Text>
            <View style={styles.weatherGrid}>
              {[
                { value: null, label: 'Any', icon: 'partly-sunny' as keyof typeof Ionicons.glyphMap },
                { value: 'rain', label: 'Rain', icon: 'rainy' as keyof typeof Ionicons.glyphMap },
                { value: 'snow', label: 'Snow', icon: 'snow' as keyof typeof Ionicons.glyphMap },
                { value: 'fog', label: 'Fog', icon: 'cloud' as keyof typeof Ionicons.glyphMap },
                { value: 'wind', label: 'Wind', icon: 'flag' as keyof typeof Ionicons.glyphMap },
                { value: 'storm', label: 'Storm', icon: 'thunderstorm' as keyof typeof Ionicons.glyphMap },
                { value: 'clear', label: 'Clear', icon: 'sunny' as keyof typeof Ionicons.glyphMap },
                { value: 'cold', label: '<5C', icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap },
                { value: 'heat', label: '>30C', icon: 'flame' as keyof typeof Ionicons.glyphMap },
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
                    color={weatherCondition === opt.value ? THEME.primary : THEME.textSecondary}
                  />
                  <Text
                    style={[
                      styles.weatherChipText,
                      weatherCondition === opt.value && styles.weatherChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time Window */}
            <Text style={styles.sectionHeader}>4. Time Window</Text>
            <View style={styles.verificationRow}>
              {([
                { value: 'any' as const, label: 'Any Time', icon: 'time-outline' as keyof typeof Ionicons.glyphMap, desc: 'Always visible' },
                { value: 'day' as const, label: 'Day', icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap, desc: '05:00-22:00' },
                { value: 'night' as const, label: 'Night', icon: 'moon-outline' as keyof typeof Ionicons.glyphMap, desc: '22:00-05:00' },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.verificationCard,
                    timeWindow === opt.value && (opt.value === 'night'
                      ? { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.08)' }
                      : styles.verificationCardActive),
                  ]}
                  onPress={() => setTimeWindow(opt.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={timeWindow === opt.value ? (opt.value === 'night' ? '#8B5CF6' : THEME.primary) : THEME.textSecondary}
                  />
                  <Text
                    style={[
                      styles.verificationLabel,
                      timeWindow === opt.value && { color: opt.value === 'night' ? '#8B5CF6' : THEME.primary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.verificationDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location Info */}
            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={16} color={THEME.primary} />
              <Text style={styles.locationText}>
                {currentLocation
                  ? `Challenge at ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                  : 'Waiting for GPS...'}
              </Text>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createBtn, isSubmitting && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#0A0E17" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#0A0E17" />
                  <Text style={styles.createBtnText}>Place Challenge</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: THEME.text,
  },
  sectionHeader: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  templateCard: {
    width: '47%',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    gap: 6,
  },
  templateCardActive: {
    borderColor: THEME.primary,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  templateName: {
    color: THEME.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  templateNameActive: {
    color: THEME.primary,
  },
  templateDesc: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  paramsCard: {
    backgroundColor: THEME.surface,
    marginHorizontal: 20,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  paramRow: {
    marginBottom: SPACING.md,
  },
  paramLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  paramLabel: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  paramRange: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  paramInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  paramBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  paramInput: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  paramUnit: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    minWidth: 24,
  },
  verificationRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  verificationCard: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  verificationCardActive: {
    borderColor: THEME.primary,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  verificationLabel: {
    color: THEME.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  verificationLabelActive: {
    color: THEME.primary,
  },
  verificationDesc: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: SPACING.lg,
  },
  locationText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 20,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: '#0A0E17',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  weatherChipActive: {
    borderColor: THEME.primary,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  weatherChipText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  weatherChipTextActive: {
    color: THEME.primary,
  },
});

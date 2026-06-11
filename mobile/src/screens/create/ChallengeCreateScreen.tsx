import React, { useState, useMemo } from 'react';
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
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { strings as S, t } from '../../i18n';
import type { ChallengeCreateScreenProps } from '../../navigation/types';

interface ChallengeTemplate {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  parameters: { key: string; label: string; unit: string; min: number; max: number; default: number }[];
}

const getTemplates = (): ChallengeTemplate[] => [
  {
    id: 'step_count',
    name: S.create.challenge.templateStepsName,
    icon: 'footsteps-outline',
    description: S.create.challenge.templateStepsDesc,
    parameters: [
      { key: 'steps', label: S.create.challenge.paramSteps, unit: '', min: 1000, max: 50000, default: 10000 },
    ],
  },
  {
    id: 'time_walk',
    name: S.create.challenge.templateTimeWalkName,
    icon: 'timer-outline',
    description: S.create.challenge.templateTimeWalkDesc,
    parameters: [
      { key: 'duration', label: S.create.challenge.paramDuration, unit: 'min', min: 5, max: 180, default: 30 },
    ],
  },
  {
    id: 'explore_new',
    name: S.create.challenge.templateExplorerName,
    icon: 'compass-outline',
    description: S.create.challenge.templateExplorerDesc,
    parameters: [
      { key: 'cells', label: S.create.challenge.paramNewCells, unit: '', min: 5, max: 100, default: 20 },
    ],
  },
];

type VerificationLevel = 'honor' | 'video' | 'sensor';

export default function ChallengeCreateScreen({ navigation }: ChallengeCreateScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const templates = useMemo(getTemplates, []);
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
      Alert.alert(S.common.error, S.create.challenge.missingDataMsg);
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
      Alert.alert(S.create.challenge.createdTitle, S.create.challenge.createdMsg, [
        { text: S.common.ok, onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.create.challenge.createFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const VERIFICATION_OPTIONS: { value: VerificationLevel; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
    { value: 'honor', label: S.create.challenge.verificationHonor, icon: 'hand-left-outline', desc: S.create.challenge.verificationHonorDesc },
    { value: 'sensor', label: S.create.challenge.verificationSensor, icon: 'hardware-chip-outline', desc: S.create.challenge.verificationSensorDesc },
    { value: 'video', label: S.create.challenge.verificationVideo, icon: 'videocam-outline', desc: S.create.challenge.verificationVideoDesc },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.create.challenge.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Select Template */}
        <Text style={styles.sectionHeader}>{S.create.challenge.sectionTemplate}</Text>
        <View style={styles.templateGrid}>
          {templates.map((t) => (
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
                color={selectedTemplate?.id === t.id ? theme.primary : theme.textSecondary}
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
            <Text style={styles.sectionHeader}>{S.create.challenge.sectionParameters}</Text>
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
                      <Ionicons name="remove" size={18} color={theme.primary} />
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
                      <Ionicons name="add" size={18} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Step 3: Verification Level */}
            <Text style={styles.sectionHeader}>{S.create.challenge.sectionVerification}</Text>
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
                    color={verification === opt.value ? theme.primary : theme.textSecondary}
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
            <Text style={styles.sectionHeader}>{S.create.challenge.sectionWeather}</Text>
            <View style={styles.weatherGrid}>
              {[
                { value: null, label: S.create.challenge.weatherAny, icon: 'partly-sunny' as keyof typeof Ionicons.glyphMap },
                { value: 'rain', label: S.create.challenge.weatherRain, icon: 'rainy' as keyof typeof Ionicons.glyphMap },
                { value: 'snow', label: S.create.challenge.weatherSnow, icon: 'snow' as keyof typeof Ionicons.glyphMap },
                { value: 'fog', label: S.create.challenge.weatherFog, icon: 'cloud' as keyof typeof Ionicons.glyphMap },
                { value: 'wind', label: S.create.challenge.weatherWind, icon: 'flag' as keyof typeof Ionicons.glyphMap },
                { value: 'storm', label: S.create.challenge.weatherStorm, icon: 'thunderstorm' as keyof typeof Ionicons.glyphMap },
                { value: 'clear', label: S.create.challenge.weatherClear, icon: 'sunny' as keyof typeof Ionicons.glyphMap },
                { value: 'cold', label: S.create.challenge.weatherCold, icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap },
                { value: 'heat', label: S.create.challenge.weatherHeat, icon: 'flame' as keyof typeof Ionicons.glyphMap },
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
                    color={weatherCondition === opt.value ? theme.primary : theme.textSecondary}
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
            <Text style={styles.sectionHeader}>{S.create.challenge.sectionTimeWindow}</Text>
            <View style={styles.verificationRow}>
              {([
                { value: 'any' as const, label: S.create.challenge.timeAny, icon: 'time-outline' as keyof typeof Ionicons.glyphMap, desc: S.create.challenge.timeAnyDesc },
                { value: 'day' as const, label: S.create.challenge.timeDay, icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap, desc: S.create.challenge.timeDayDesc },
                { value: 'night' as const, label: S.create.challenge.timeNight, icon: 'moon-outline' as keyof typeof Ionicons.glyphMap, desc: S.create.challenge.timeNightDesc },
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
                    color={timeWindow === opt.value ? (opt.value === 'night' ? '#8B5CF6' : theme.primary) : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.verificationLabel,
                      timeWindow === opt.value && { color: opt.value === 'night' ? '#8B5CF6' : theme.primary },
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
              <Ionicons name="location-outline" size={16} color={theme.primary} />
              <Text style={styles.locationText}>
                {currentLocation
                  ? t(S.create.challenge.locationAt, {
                      lat: currentLocation.latitude.toFixed(4),
                      lng: currentLocation.longitude.toFixed(4),
                    })
                  : S.create.challenge.waitingForGps}
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
                <ActivityIndicator size="small" color={theme.bg} />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color={theme.bg} />
                  <Text style={styles.createBtnText}>{S.create.challenge.placeChallenge}</Text>
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
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
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: theme.text,
  },
  sectionHeader: {
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    gap: 6,
  },
  templateCardActive: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  templateName: {
    color: theme.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  templateNameActive: {
    color: theme.primary,
  },
  templateDesc: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  paramsCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  paramRange: {
    color: theme.textSecondary,
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
    backgroundColor: theme.bg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: theme.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  paramUnit: {
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  verificationCardActive: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  verificationLabel: {
    color: theme.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  verificationLabelActive: {
    color: theme.primary,
  },
  verificationDesc: {
    color: theme.textSecondary,
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
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
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
    color: theme.bg,
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
    backgroundColor: theme.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  weatherChipActive: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  weatherChipText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  weatherChipTextActive: {
    color: theme.primary,
  },
});

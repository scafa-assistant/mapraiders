import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocationStore } from '../../store/locationStore';
import { challengeApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { ChallengeDetailScreenProps, Challenge } from '../../navigation/types';

const { width } = Dimensions.get('window');

type ChallengePhase = 'detail' | 'active' | 'completed';

interface Submission {
  id: string;
  username: string;
  completedAt: string;
}

const VERIFICATION_INFO: Record<
  Challenge['verificationLevel'],
  { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }
> = {
  honor: { icon: 'hand-left-outline', label: 'Honor System', color: THEME.accent },
  sensor: { icon: 'hardware-chip-outline', label: 'Sensor Verified', color: THEME.danger },
  video: { icon: 'videocam-outline', label: 'Video Proof', color: THEME.warning },
};

function formatParameters(params: Record<string, number>): { label: string; value: string }[] {
  return Object.entries(params).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: String(value),
  }));
}

export default function ChallengeDetailScreen({ route, navigation }: ChallengeDetailScreenProps) {
  const { challengeId } = route.params;
  const { currentLocation } = useLocationStore();
  const mapRef = useRef<MapView>(null);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<ChallengePhase>('detail');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentCompletions, setRecentCompletions] = useState<Submission[]>([]);

  // Sensor tracking state
  const [trackedDistance, setTrackedDistance] = useState(0);
  const [trackedSteps, setTrackedSteps] = useState(0);
  const [trackedTime, setTrackedTime] = useState(0);
  const trackingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingStart = useRef<number>(0);

  const loadChallenge = useCallback(async () => {
    try {
      const response = await challengeApi.getNearby(
        currentLocation?.latitude ?? 0,
        currentLocation?.longitude ?? 0,
        10000
      );
      const found = (response.data as Challenge[]).find((c: Challenge) => c.id === challengeId);
      if (found) {
        setChallenge(found);
      }
    } catch (_err) {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }, [challengeId, currentLocation]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  // Cleanup tracking interval on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, []);

  const handleAccept = () => {
    setPhase('active');
    if (challenge?.verificationLevel === 'sensor') {
      trackingStart.current = Date.now();
      trackingInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - trackingStart.current) / 1000);
        setTrackedTime(elapsed);
        // Simulate distance/steps from GPS -- in real app these come from location store
        setTrackedDistance((prev) => prev + Math.random() * 5);
        setTrackedSteps((prev) => prev + Math.floor(Math.random() * 3) + 1);
      }, 2000);
    }
  };

  const handleHonorComplete = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('verificationLevel', 'honor');
      if (currentLocation) {
        formData.append('latitude', currentLocation.latitude.toString());
        formData.append('longitude', currentLocation.longitude.toString());
      }
      await challengeApi.submit(challengeId, formData);
      setPhase('completed');
    } catch (_err) {
      Alert.alert('Error', 'Failed to submit completion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSensorComplete = async () => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('verificationLevel', 'sensor');
      formData.append('distance', trackedDistance.toFixed(1));
      formData.append('steps', trackedSteps.toString());
      formData.append('duration', trackedTime.toString());
      if (currentLocation) {
        formData.append('latitude', currentLocation.latitude.toString());
        formData.append('longitude', currentLocation.longitude.toString());
      }
      await challengeApi.submit(challengeId, formData);
      setPhase('completed');
    } catch (_err) {
      Alert.alert('Error', 'Failed to submit sensor data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoComplete = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 120,
      quality: 0.5,
    });
    if (result.canceled || !result.assets[0]) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('verificationLevel', 'video');
      formData.append('video', {
        uri: result.assets[0].uri,
        type: 'video/mp4',
        name: 'challenge_proof.mp4',
      } as any);
      if (currentLocation) {
        formData.append('latitude', currentLocation.latitude.toString());
        formData.append('longitude', currentLocation.longitude.toString());
      }
      await challengeApi.submit(challengeId, formData);
      setPhase('completed');
    } catch (_err) {
      Alert.alert('Error', 'Failed to upload video proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Loading state ──
  if (isLoading || !challenge) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Loading challenge...</Text>
      </SafeAreaView>
    );
  }

  const verification = VERIFICATION_INFO[challenge.verificationLevel];
  const params = formatParameters(challenge.parameters);

  // ── Completed state ──
  if (phase === 'completed') {
    return (
      <SafeAreaView style={styles.completedContainer}>
        <View style={styles.completedContent}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={56} color={THEME.warning} />
          </View>
          <Text style={styles.completedTitle}>CHALLENGE COMPLETE!</Text>
          <Text style={styles.completedSubtitle}>{challenge.template}</Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Active / Submission state ──
  const renderActiveUI = () => {
    switch (challenge.verificationLevel) {
      case 'honor':
        return (
          <View style={styles.activeSection}>
            <Text style={styles.activeInstruction}>
              Complete the challenge and tap the button below when done.
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: THEME.accent }]}
              onPress={handleHonorComplete}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={THEME.bg} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={THEME.bg} />
                  <Text style={styles.actionButtonText}>COMPLETE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'sensor':
        return (
          <View style={styles.activeSection}>
            <Text style={styles.activeInstruction}>
              GPS tracking active. Meet the target metrics to complete.
            </Text>
            <View style={styles.sensorStats}>
              <View style={styles.sensorStatItem}>
                <Text style={styles.sensorStatValue}>{trackedDistance.toFixed(0)}m</Text>
                <Text style={styles.sensorStatLabel}>Distance</Text>
              </View>
              <View style={styles.sensorDivider} />
              <View style={styles.sensorStatItem}>
                <Text style={styles.sensorStatValue}>{trackedSteps}</Text>
                <Text style={styles.sensorStatLabel}>Steps</Text>
              </View>
              <View style={styles.sensorDivider} />
              <View style={styles.sensorStatItem}>
                <Text style={styles.sensorStatValue}>{formatTime(trackedTime)}</Text>
                <Text style={styles.sensorStatLabel}>Time</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: THEME.danger }]}
              onPress={handleSensorComplete}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={THEME.bg} />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={22} color={THEME.bg} />
                  <Text style={styles.actionButtonText}>FINISH &amp; SUBMIT</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'video':
        return (
          <View style={styles.activeSection}>
            <Text style={styles.activeInstruction}>
              Record a video showing your challenge completion as proof.
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: THEME.warning }]}
              onPress={handleVideoComplete}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={THEME.bg} />
              ) : (
                <>
                  <Ionicons name="videocam" size={22} color={THEME.bg} />
                  <Text style={styles.actionButtonText}>RECORD VIDEO</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Mini Map */}
      <MapView
        ref={mapRef}
        style={styles.miniMap}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: challenge.location.latitude,
          longitude: challenge.location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={challenge.location}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.challengeMarker}>
            <Ionicons name="trophy" size={18} color={THEME.warning} />
          </View>
        </Marker>
      </MapView>

      {/* Back button overlay */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.contentSheet}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Challenge Info */}
        <View style={styles.infoSection}>
          <View style={styles.templateRow}>
            <View style={styles.templateIcon}>
              <Ionicons name="trophy-outline" size={24} color={THEME.warning} />
            </View>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{challenge.template}</Text>
              <Text style={styles.creatorText}>by {challenge.creatorUsername}</Text>
            </View>
          </View>

          {/* Verification Badge */}
          <View style={[styles.verificationBadge, { borderColor: verification.color }]}>
            <Ionicons name={verification.icon} size={16} color={verification.color} />
            <Text style={[styles.verificationText, { color: verification.color }]}>
              {verification.label}
            </Text>
          </View>
        </View>

        {/* Parameters */}
        {params.length > 0 && (
          <View style={styles.parametersSection}>
            <Text style={styles.sectionTitle}>Parameters</Text>
            {params.map((param, index) => (
              <View key={index} style={styles.paramRow}>
                <Text style={styles.paramLabel}>{param.label}</Text>
                <Text style={styles.paramValue}>{param.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Accept or Active UI */}
        {phase === 'detail' ? (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={22} color={THEME.bg} />
            <Text style={styles.acceptButtonText}>ACCEPT CHALLENGE</Text>
          </TouchableOpacity>
        ) : (
          renderActiveUI()
        )}

        {/* Recent Completions */}
        {recentCompletions.length > 0 && (
          <View style={styles.completionsSection}>
            <Text style={styles.sectionTitle}>Recent Completions</Text>
            {recentCompletions.map((sub) => (
              <View key={sub.id} style={styles.completionRow}>
                <Ionicons name="checkmark-circle" size={16} color={THEME.accent} />
                <Text style={styles.completionUser}>{sub.username}</Text>
                <Text style={styles.completionTime}>{sub.completedAt}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  miniMap: {
    width,
    height: 240,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 18, 32, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  challengeMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    borderWidth: 2,
    borderColor: THEME.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSheet: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -20,
    borderTopWidth: 1,
    borderColor: THEME.border,
  },
  contentContainer: {
    padding: SPACING.xl,
    paddingBottom: 100,
  },
  infoSection: {
    marginBottom: SPACING.xl,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  creatorText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  verificationText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  parametersSection: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sectionTitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  paramLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  paramValue: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  acceptButton: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    borderRadius: RADIUS.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptButtonText: {
    color: THEME.bg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 2,
  },
  activeSection: {
    marginBottom: SPACING.xl,
  },
  activeInstruction: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  sensorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sensorStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  sensorStatValue: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  sensorStatLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  sensorDivider: {
    width: 1,
    height: 30,
    backgroundColor: THEME.border,
  },
  actionButton: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  actionButtonText: {
    color: THEME.bg,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    letterSpacing: 1,
  },
  completionsSection: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  completionUser: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    flex: 1,
  },
  completionTime: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  // Completed screen
  completedContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderWidth: 3,
    borderColor: THEME.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: THEME.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  completedTitle: {
    color: THEME.warning,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: SPACING.sm,
  },
  completedSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.lg,
    marginBottom: 40,
  },
  doneButton: {
    backgroundColor: THEME.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 40,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  doneButtonText: {
    color: THEME.bg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

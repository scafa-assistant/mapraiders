import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { THEME } from '../../utils/constants';
import { strings as S } from '../../i18n';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

type Step = 1 | 2 | 3;

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>(1);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Animated value for slide transitions
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToStep = useCallback(
    (nextStep: Step) => {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setStep(nextStep);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    },
    [slideAnim]
  );

  const handleNext = () => {
    animateToStep(2);
  };

  const handleRequestLocation = async () => {
    setRequesting(true);
    setLocationDenied(false);
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus === 'granted') {
        setLocationGranted(true);
        // Also request background (non-blocking - OK if denied)
        await Location.requestBackgroundPermissionsAsync().catch(() => {});
        // Short delay so user sees the success state
        setTimeout(() => animateToStep(3), 400);
      } else {
        setLocationDenied(true);
      }
    } catch (_err) {
      setLocationDenied(true);
    } finally {
      setRequesting(false);
    }
  };

  const handleStartPlaying = () => {
    onComplete();
  };

  // ─── Step Dot Indicator ──────────────────────────────────────────────────

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={[
            styles.dot,
            s === step && styles.dotActive,
            s < step && styles.dotCompleted,
          ]}
        />
      ))}
    </View>
  );

  // ─── Step 1: Welcome ────────────────────────────────────────────────────

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepContent}>
        {/* Icon cluster */}
        <View style={styles.iconCluster}>
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <Ionicons name="map" size={48} color={THEME.primary} />
            </View>
          </View>
          <View style={styles.iconBadgeLeft}>
            <Ionicons name="flash" size={20} color={THEME.warning} />
          </View>
          <View style={styles.iconBadgeRight}>
            <Ionicons name="shield" size={20} color={THEME.secondary} />
          </View>
        </View>

        <Text style={styles.title}>MAPRAIDERS</Text>
        <Text style={styles.tagline}>{S.auth.onboarding.tagline}</Text>

        <Text style={styles.description}>
          {S.auth.onboarding.welcomeDescription}
        </Text>
      </View>

      <View style={styles.stepFooter}>
        {renderDots()}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>{S.auth.onboarding.next}</Text>
          <Ionicons name="arrow-forward" size={18} color={THEME.bg} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Step 2: Location Permission ────────────────────────────────────────

  const renderLocation = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepContent}>
        <View style={styles.locationIconContainer}>
          <View style={styles.locationPulseRing} />
          <View style={styles.locationIconCircle}>
            <Ionicons name="location" size={52} color={THEME.primary} />
          </View>
        </View>

        <Text style={styles.stepTitle}>{S.auth.onboarding.locationTitle}</Text>
        <Text style={styles.stepDescription}>
          {S.auth.onboarding.locationDescription}
        </Text>

        {locationDenied && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={18} color={THEME.danger} />
            <Text style={styles.warningText}>
              {S.auth.onboarding.locationDeniedWarning}
            </Text>
          </View>
        )}

        {locationGranted && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={THEME.accent} />
            <Text style={styles.successText}>{S.auth.onboarding.locationGrantedBanner}</Text>
          </View>
        )}
      </View>

      <View style={styles.stepFooter}>
        {renderDots()}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            locationGranted && styles.successButton,
            requesting && styles.buttonDisabled,
          ]}
          onPress={handleRequestLocation}
          activeOpacity={0.8}
          disabled={requesting || locationGranted}
        >
          {requesting ? (
            <ActivityIndicator color={THEME.bg} size="small" />
          ) : locationGranted ? (
            <>
              <Ionicons name="checkmark" size={18} color={THEME.bg} />
              <Text style={styles.primaryButtonText}>{S.auth.onboarding.granted}</Text>
            </>
          ) : (
            <>
              <Ionicons name="location" size={18} color={THEME.bg} />
              <Text style={styles.primaryButtonText}>
                {locationDenied ? S.auth.onboarding.retry : S.auth.onboarding.enableLocation}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Step 3: Ready ──────────────────────────────────────────────────────

  const renderReady = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepContent}>
        <View style={styles.readyIconContainer}>
          <Ionicons name="rocket" size={56} color={THEME.primary} />
        </View>

        <Text style={styles.stepTitle}>{S.auth.onboarding.readyTitle}</Text>

        <View style={styles.tipsList}>
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: `${THEME.primary}20` }]}>
              <Ionicons name="footsteps" size={20} color={THEME.primary} />
            </View>
            <Text style={styles.tipText}>
              {S.auth.onboarding.tipWalk}
            </Text>
          </View>

          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: `${THEME.secondary}20` }]}>
              <Ionicons name="compass" size={20} color={THEME.secondary} />
            </View>
            <Text style={styles.tipText}>
              {S.auth.onboarding.tipCreate}
            </Text>
          </View>

          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: `${THEME.warning}20` }]}>
              <Ionicons name="trophy" size={20} color={THEME.warning} />
            </View>
            <Text style={styles.tipText}>
              {S.auth.onboarding.tipCompete}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.stepFooter}>
        {renderDots()}
        <TouchableOpacity
          style={[styles.primaryButton, styles.startButton]}
          onPress={handleStartPlaying}
          activeOpacity={0.8}
        >
          <Ionicons name="game-controller" size={20} color={THEME.bg} />
          <Text style={styles.primaryButtonText}>{S.auth.onboarding.startPlaying}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderWelcome();
      case 2:
        return renderLocation();
      case 3:
        return renderReady();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[styles.animatedContainer, { transform: [{ translateX: slideAnim }] }]}
      >
        {renderStep()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  animatedContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  stepFooter: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 24,
  },

  // ─── Dots ─────────────────────────────────────────────────────────────

  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A2340',
  },
  dotActive: {
    width: 28,
    backgroundColor: THEME.primary,
  },
  dotCompleted: {
    backgroundColor: `${THEME.primary}60`,
  },

  // ─── Step 1: Welcome ──────────────────────────────────────────────────

  iconCluster: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${THEME.primary}10`,
    borderWidth: 1,
    borderColor: `${THEME.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#141B2D',
    borderWidth: 2,
    borderColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  iconBadgeLeft: {
    position: 'absolute',
    left: 0,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#141B2D',
    borderWidth: 1.5,
    borderColor: THEME.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeRight: {
    position: 'absolute',
    right: 0,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#141B2D',
    borderWidth: 1.5,
    borderColor: THEME.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: `${THEME.primary}80`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
  },

  // ─── Step 2: Location ─────────────────────────────────────────────────

  locationIconContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  locationPulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: `${THEME.primary}25`,
  },
  locationIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#141B2D',
    borderWidth: 2,
    borderColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  stepDescription: {
    fontSize: 15,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 24,
    gap: 10,
  },
  warningText: {
    flex: 1,
    color: THEME.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 24,
    gap: 10,
  },
  successText: {
    flex: 1,
    color: THEME.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // ─── Step 3: Ready ────────────────────────────────────────────────────

  readyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#141B2D',
    borderWidth: 2,
    borderColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  tipsList: {
    marginTop: 32,
    gap: 16,
    width: '100%',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    color: THEME.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // ─── Buttons ──────────────────────────────────────────────────────────

  primaryButton: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: THEME.bg,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  successButton: {
    backgroundColor: THEME.accent,
    shadowColor: THEME.accent,
  },
  startButton: {
    shadowColor: THEME.primary,
    shadowOpacity: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

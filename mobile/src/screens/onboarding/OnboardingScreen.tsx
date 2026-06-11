import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/constants';
import { strings as S } from '../../i18n';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

type Step = 1 | 2 | 3;

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
              <Ionicons name="map" size={48} color={theme.primary} />
            </View>
          </View>
          <View style={styles.iconBadgeLeft}>
            <Ionicons name="flash" size={20} color={theme.warning} />
          </View>
          <View style={styles.iconBadgeRight}>
            <Ionicons name="shield" size={20} color={theme.secondary} />
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
          <Ionicons name="arrow-forward" size={18} color={theme.bg} />
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
            <Ionicons name="location" size={52} color={theme.primary} />
          </View>
        </View>

        <Text style={styles.stepTitle}>{S.auth.onboarding.locationTitle}</Text>
        <Text style={styles.stepDescription}>
          {S.auth.onboarding.locationDescription}
        </Text>

        {locationDenied && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={18} color={theme.danger} />
            <Text style={styles.warningText}>
              {S.auth.onboarding.locationDeniedWarning}
            </Text>
          </View>
        )}

        {locationGranted && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
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
            <ActivityIndicator color={theme.bg} size="small" />
          ) : locationGranted ? (
            <>
              <Ionicons name="checkmark" size={18} color={theme.bg} />
              <Text style={styles.primaryButtonText}>{S.auth.onboarding.granted}</Text>
            </>
          ) : (
            <>
              <Ionicons name="location" size={18} color={theme.bg} />
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
          <Ionicons name="rocket" size={56} color={theme.primary} />
        </View>

        <Text style={styles.stepTitle}>{S.auth.onboarding.readyTitle}</Text>

        <View style={styles.tipsList}>
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: `${theme.primary}20` }]}>
              <Ionicons name="footsteps" size={20} color={theme.primary} />
            </View>
            <Text style={styles.tipText}>
              {S.auth.onboarding.tipWalk}
            </Text>
          </View>

          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: `${theme.secondary}20` }]}>
              <Ionicons name="compass" size={20} color={theme.secondary} />
            </View>
            <Text style={styles.tipText}>
              {S.auth.onboarding.tipCreate}
            </Text>
          </View>

          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: `${theme.warning}20` }]}>
              <Ionicons name="trophy" size={20} color={theme.warning} />
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
          <Ionicons name="game-controller" size={20} color={theme.bg} />
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
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
    backgroundColor: theme.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: theme.primary,
  },
  dotCompleted: {
    backgroundColor: `${theme.primary}60`,
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
    backgroundColor: `${theme.primary}10`,
    borderWidth: 1,
    borderColor: `${theme.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
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
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.warning,
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
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: `${theme.primary}80`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
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
    borderColor: `${theme.primary}25`,
  },
  locationIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  stepDescription: {
    fontSize: 15,
    color: theme.textSecondary,
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
    color: theme.danger,
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
    color: theme.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // ─── Step 3: Ready ────────────────────────────────────────────────────

  readyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: theme.primary,
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
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // ─── Buttons ──────────────────────────────────────────────────────────

  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: theme.bg,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  successButton: {
    backgroundColor: theme.accent,
    shadowColor: theme.accent,
  },
  startButton: {
    shadowColor: theme.primary,
    shadowOpacity: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

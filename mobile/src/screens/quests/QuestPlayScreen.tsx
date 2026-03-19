import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useQuestStore } from '../../store/questStore';
import { useLocationStore } from '../../store/locationStore';
import { QuestPlayScreenProps, QuestStep, QuestStepType } from '../../navigation/types';

const { width, height } = Dimensions.get('window');

const STEP_TYPE_ICONS: Record<QuestStepType, keyof typeof Ionicons.glyphMap> = {
  FIND: 'camera',
  LISTEN: 'ear',
  CHALLENGE: 'videocam',
  SOLVE: 'help-circle',
  COLLECT: 'location',
  DOG: 'paw',
};

const STEP_TYPE_COLORS: Record<QuestStepType, string> = {
  FIND: '#00D4FF',
  LISTEN: '#7B61FF',
  CHALLENGE: '#FF4757',
  SOLVE: '#FFB800',
  COLLECT: '#00FF88',
  DOG: '#7B61FF',
};

export default function QuestPlayScreen({ route, navigation }: QuestPlayScreenProps) {
  const { questId } = route.params;
  const { activeQuest, verifyStep, isVerifying, abandonQuest, completeQuest } = useQuestStore();
  const { currentLocation } = useLocationStore();
  const mapRef = useRef<MapView>(null);

  const [solveAnswer, setSolveAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hintAvailable, setHintAvailable] = useState(false);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [showComplete, setShowComplete] = useState(false);
  const [rating, setRating] = useState(0);

  const successAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const quest = activeQuest?.quest;
  const currentStepIndex = activeQuest?.currentStepIndex ?? 0;
  const currentStep: QuestStep | null =
    quest && currentStepIndex < quest.steps.length ? quest.steps[currentStepIndex] : null;

  // Check if hint should be available (5 min)
  useEffect(() => {
    setStepStartTime(Date.now());
    setShowHint(false);
    setHintAvailable(false);
    setSolveAnswer('');

    const timer = setTimeout(() => {
      setHintAvailable(true);
    }, 5 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [currentStepIndex]);

  // Animate progress bar
  useEffect(() => {
    if (quest) {
      Animated.timing(progressAnim, {
        toValue: currentStepIndex / quest.steps.length,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [currentStepIndex, quest]);

  // Check quest completion
  useEffect(() => {
    if (quest && currentStepIndex >= quest.steps.length) {
      setShowComplete(true);
    }
  }, [currentStepIndex, quest]);

  // Center map on current step
  useEffect(() => {
    if (currentStep && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentStep.location.latitude,
          longitude: currentStep.location.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        },
        500
      );
    }
  }, [currentStep]);

  // Calculate distance to current step
  const distanceToStep = (): number => {
    if (!currentLocation || !currentStep) return Infinity;
    const R = 6371e3;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(currentStep.location.latitude - currentLocation.latitude);
    const dLon = toRad(currentStep.location.longitude - currentLocation.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(currentLocation.latitude)) *
        Math.cos(toRad(currentStep.location.latitude)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isNearStep = distanceToStep() <= (currentStep?.radius ?? 50);

  const playSuccessAnimation = () => {
    successAnim.setValue(0);
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Verification handlers by step type
  const handleFindVerify = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0] && currentStep) {
      const success = await verifyStep(questId, currentStep.id, {
        photo: result.assets[0].uri,
        location: currentLocation,
      });
      if (success) playSuccessAnimation();
      else Alert.alert('Not Verified', 'The photo did not match the requirement. Try again.');
    }
  };

  const handleChallengeVerify = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0] && currentStep) {
      const success = await verifyStep(questId, currentStep.id, {
        video: result.assets[0].uri,
        location: currentLocation,
      });
      if (success) playSuccessAnimation();
      else Alert.alert('Not Verified', 'Challenge verification failed. Try again.');
    }
  };

  const handleSolveVerify = async () => {
    if (!solveAnswer.trim() || !currentStep) return;
    const success = await verifyStep(questId, currentStep.id, {
      answer: solveAnswer.trim(),
      location: currentLocation,
    });
    if (success) {
      playSuccessAnimation();
      setSolveAnswer('');
    } else {
      Alert.alert('Incorrect', 'That answer is not correct. Try again!');
    }
  };

  const handleListenVerify = async () => {
    if (!currentStep || !isNearStep) return;
    const success = await verifyStep(questId, currentStep.id, {
      location: currentLocation,
    });
    if (success) playSuccessAnimation();
  };

  const handleCollectVerify = async () => {
    if (!currentStep || !isNearStep) return;
    const success = await verifyStep(questId, currentStep.id, {
      location: currentLocation,
    });
    if (success) playSuccessAnimation();
  };

  const handleDogVerify = async () => {
    if (!currentStep) return;
    const success = await verifyStep(questId, currentStep.id, {
      location: currentLocation,
    });
    if (success) playSuccessAnimation();
  };

  const handleAbandon = () => {
    Alert.alert('Abandon Quest', 'Are you sure you want to leave this quest? Progress will be lost.', [
      { text: 'Continue Quest', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: () => {
          abandonQuest();
          navigation.goBack();
        },
      },
    ]);
  };

  const handleCompleteQuest = async () => {
    if (rating > 0) {
      await completeQuest(questId, rating);
    }
    navigation.popToTop();
  };

  // Quest completion screen
  if (showComplete) {
    return (
      <SafeAreaView style={styles.completeContainer}>
        <View style={styles.completeContent}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={56} color="#FFB800" />
          </View>
          <Text style={styles.completeTitle}>QUEST COMPLETE!</Text>
          <Text style={styles.completeSubtitle}>{quest?.title}</Text>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingPrompt}>Rate this quest</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= rating ? '#FFB800' : '#2A3450'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleCompleteQuest}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>CLAIM REWARDS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!quest || !currentStep) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4FF" />
        <Text style={styles.loadingText}>Loading quest...</Text>
      </SafeAreaView>
    );
  }

  const stepColor = STEP_TYPE_COLORS[currentStep.type];
  const dist = distanceToStep();

  // Render verification UI based on step type
  const renderVerificationUI = () => {
    switch (currentStep.type) {
      case 'FIND':
        return (
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: stepColor }]}
            onPress={handleFindVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator color="#0A0E17" />
            ) : (
              <>
                <Ionicons name="camera" size={22} color="#0A0E17" />
                <Text style={styles.verifyButtonText}>TAKE PHOTO</Text>
              </>
            )}
          </TouchableOpacity>
        );

      case 'LISTEN':
        return (
          <View style={styles.listenContainer}>
            <View style={styles.proximityIndicator}>
              <View
                style={[
                  styles.proximityFill,
                  {
                    width: `${Math.max(0, Math.min(100, (1 - dist / (currentStep.radius * 2)) * 100))}%`,
                    backgroundColor: isNearStep ? '#00FF88' : stepColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.proximityText}>
              {isNearStep ? 'In range!' : `${Math.round(dist)}m away`}
            </Text>
            {isNearStep && (
              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: '#00FF88' }]}
                onPress={handleListenVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#0A0E17" />
                ) : (
                  <>
                    <Ionicons name="ear" size={22} color="#0A0E17" />
                    <Text style={styles.verifyButtonText}>LISTEN</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        );

      case 'CHALLENGE':
        return (
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: stepColor }]}
            onPress={handleChallengeVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator color="#0A0E17" />
            ) : (
              <>
                <Ionicons name="videocam" size={22} color="#0A0E17" />
                <Text style={styles.verifyButtonText}>RECORD VIDEO</Text>
              </>
            )}
          </TouchableOpacity>
        );

      case 'SOLVE':
        return (
          <View style={styles.solveContainer}>
            <View style={styles.solveInputRow}>
              <TextInput
                style={styles.solveInput}
                placeholder="Type your answer..."
                placeholderTextColor="#555E78"
                value={solveAnswer}
                onChangeText={setSolveAnswer}
                returnKeyType="send"
                onSubmitEditing={handleSolveVerify}
              />
              <TouchableOpacity
                style={[
                  styles.solveSubmit,
                  { backgroundColor: solveAnswer.trim() ? stepColor : '#1A2340' },
                ]}
                onPress={handleSolveVerify}
                disabled={!solveAnswer.trim() || isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#0A0E17" size="small" />
                ) : (
                  <Ionicons
                    name="send"
                    size={18}
                    color={solveAnswer.trim() ? '#0A0E17' : '#555E78'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'COLLECT':
        return (
          <View style={styles.collectContainer}>
            <Text style={styles.proximityText}>
              {isNearStep ? 'You found it!' : `${Math.round(dist)}m to collection point`}
            </Text>
            {isNearStep && (
              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: '#00FF88' }]}
                onPress={handleCollectVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#0A0E17" />
                ) : (
                  <>
                    <Ionicons name="hand-left" size={22} color="#0A0E17" />
                    <Text style={styles.verifyButtonText}>COLLECT</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        );

      case 'DOG':
        return (
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: stepColor }]}
            onPress={handleDogVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator color="#0A0E17" />
            ) : (
              <>
                <Ionicons name="paw" size={22} color="#0A0E17" />
                <Text style={styles.verifyButtonText}>CONFIRM WITH DOG</Text>
              </>
            )}
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: currentStep.location.latitude,
          longitude: currentStep.location.longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Circle
          center={currentStep.location}
          radius={currentStep.radius || 50}
          fillColor={`${stepColor}20`}
          strokeColor={stepColor}
          strokeWidth={2}
        />
        <Marker coordinate={currentStep.location} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.stepMarker, { backgroundColor: stepColor }]}>
            <Ionicons name={STEP_TYPE_ICONS[currentStep.type]} size={18} color="#0A0E17" />
          </View>
        </Marker>
      </MapView>

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.abandonButton} onPress={handleAbandon}>
          <Ionicons name="close" size={22} color="#FF4757" />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStepIndex + 1} / {quest.steps.length}
          </Text>
        </View>
      </SafeAreaView>

      {/* Instruction Card */}
      <View style={styles.instructionCard}>
        <View style={styles.instructionHeader}>
          <View style={[styles.stepTypeBadge, { backgroundColor: `${stepColor}20` }]}>
            <Ionicons name={STEP_TYPE_ICONS[currentStep.type]} size={16} color={stepColor} />
            <Text style={[styles.stepTypeText, { color: stepColor }]}>
              Step {currentStepIndex + 1}
            </Text>
          </View>

          {hintAvailable && currentStep.hint && (
            <TouchableOpacity
              style={styles.hintButton}
              onPress={() => setShowHint(!showHint)}
            >
              <Ionicons name="bulb" size={18} color="#FFB800" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.instructionText}>{currentStep.instruction}</Text>

        {showHint && currentStep.hint && (
          <View style={styles.hintBox}>
            <Ionicons name="bulb" size={14} color="#FFB800" />
            <Text style={styles.hintText}>{currentStep.hint}</Text>
          </View>
        )}

        {/* Distance Indicator */}
        <View style={styles.distanceRow}>
          <Ionicons name="navigate" size={14} color="#8892B0" />
          <Text style={styles.distanceText}>
            {dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`} away
          </Text>
        </View>

        {/* Verification UI */}
        {renderVerificationUI()}
      </View>

      {/* Step Success Animation */}
      <Animated.View
        style={[
          styles.successOverlay,
          {
            opacity: successAnim,
            transform: [
              {
                scale: successAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.2, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color="#00FF88" />
        </View>
        <Text style={styles.successText}>STEP COMPLETE!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E17',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8892B0',
    fontSize: 14,
  },
  map: {
    width,
    height: height * 0.55,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  abandonButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 18, 32, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 18, 32, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A2340',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#00D4FF',
  },
  progressText: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '700',
  },
  stepMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  instructionCard: {
    flex: 1,
    backgroundColor: '#0D1220',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: '#1A2340',
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  stepTypeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hintButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 12,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  hintText: {
    flex: 1,
    color: '#FFB800',
    fontSize: 13,
    lineHeight: 18,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  distanceText: {
    color: '#8892B0',
    fontSize: 13,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 52,
    gap: 10,
    marginTop: 8,
  },
  verifyButtonText: {
    color: '#0A0E17',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listenContainer: {
    gap: 10,
  },
  proximityIndicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A2340',
    overflow: 'hidden',
  },
  proximityFill: {
    height: '100%',
    borderRadius: 4,
  },
  proximityText: {
    color: '#8892B0',
    fontSize: 13,
    textAlign: 'center',
  },
  collectContainer: {
    gap: 10,
    alignItems: 'center',
  },
  solveContainer: {
    marginTop: 4,
  },
  solveInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  solveInput: {
    flex: 1,
    backgroundColor: '#141B2D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A2340',
    paddingHorizontal: 16,
    height: 48,
    color: '#FFFFFF',
    fontSize: 15,
  },
  solveSubmit: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderWidth: 3,
    borderColor: '#00FF88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    color: '#00FF88',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 16,
  },
  // Quest Complete Screen
  completeContainer: {
    flex: 1,
    backgroundColor: '#0A0E17',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderWidth: 3,
    borderColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  completeTitle: {
    color: '#FFB800',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  completeSubtitle: {
    color: '#8892B0',
    fontSize: 16,
    marginBottom: 40,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ratingPrompt: {
    color: '#8892B0',
    fontSize: 14,
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 8,
  },
  doneButton: {
    backgroundColor: '#00D4FF',
    borderRadius: 16,
    paddingHorizontal: 40,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  doneButtonText: {
    color: '#0A0E17',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useLocationStore } from '../../store/locationStore';
import { echoApi } from '../../services/api';
import { EchoCreateScreenProps } from '../../navigation/types';

const { width } = Dimensions.get('window');
const MAX_DURATION = 30; // seconds

export default function EchoCreateScreen({ navigation }: EchoCreateScreenProps) {
  const { currentLocation } = useLocationStore();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [radius, setRadius] = useState(40);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDropping, setIsDropping] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Waveform animation during recording
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(waveAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      waveAnim.setValue(0);
    }
  }, [isRecording]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to record echoes.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      setRecordingUri(null);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (_err) {
      // Recording may have already stopped
    }
  };

  const playPreview = async () => {
    if (!recordingUri) return;

    if (isPlaying && soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (_err) {
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  const handleDrop = async () => {
    if (!recordingUri || !currentLocation) return;

    setIsDropping(true);
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: recordingUri,
        type: 'audio/m4a',
        name: 'echo.m4a',
      } as any);
      formData.append('latitude', currentLocation.latitude.toString());
      formData.append('longitude', currentLocation.longitude.toString());
      formData.append('radius', radius.toString());
      formData.append('duration', duration.toString());

      await echoApi.create(formData);

      Alert.alert('Echo Dropped!', 'Your audio echo is now live at this location.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (_err) {
      Alert.alert('Error', 'Failed to drop echo. Please try again.');
    } finally {
      setIsDropping(false);
    }
  };

  const resetRecording = () => {
    setRecordingUri(null);
    setDuration(0);
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const waveHeight = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 24],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#8892B0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drop Echo</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={
            currentLocation
              ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.002,
                  longitudeDelta: 0.002,
                }
              : {
                  latitude: 44.4268,
                  longitude: 26.1025,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }
          }
          showsUserLocation
          scrollEnabled={false}
          zoomEnabled={false}
        >
          {currentLocation && (
            <>
              <Circle
                center={currentLocation}
                radius={radius}
                fillColor="rgba(123, 97, 255, 0.15)"
                strokeColor="#7B61FF"
                strokeWidth={2}
              />
              <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.echoMarker}>
                  <Ionicons name="musical-note" size={20} color="#7B61FF" />
                </View>
              </Marker>
            </>
          )}
        </MapView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Waveform Visualization */}
        <View style={styles.waveformContainer}>
          {isRecording ? (
            <View style={styles.waveform}>
              {Array.from({ length: 20 }).map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          4,
                          Math.random() * 28 + 6,
                        ],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          ) : recordingUri ? (
            <View style={styles.waveformStatic}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    styles.waveBarStatic,
                    { height: Math.random() * 28 + 6 },
                  ]}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.waveformPlaceholder}>
              Tap the microphone to start recording
            </Text>
          )}
        </View>

        {/* Duration */}
        <Text style={styles.durationText}>
          {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} / 0:
          {MAX_DURATION}
        </Text>

        {/* Record Button */}
        {!recordingUri ? (
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.7}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <Ionicons name="mic" size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.previewControls}>
            <TouchableOpacity style={styles.playButton} onPress={playPreview}>
              <Ionicons
                name={isPlaying ? 'stop' : 'play'}
                size={28}
                color="#7B61FF"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.retakeButton} onPress={resetRecording}>
              <Ionicons name="refresh" size={20} color="#FF4757" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Radius Slider */}
        <View style={styles.radiusSection}>
          <Text style={styles.radiusLabel}>ECHO RADIUS: {radius}m</Text>
          <View style={styles.radiusOptions}>
            {[30, 35, 40, 45, 50].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
                onPress={() => setRadius(r)}
              >
                <Text
                  style={[
                    styles.radiusChipText,
                    radius === r && styles.radiusChipTextActive,
                  ]}
                >
                  {r}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Drop Button */}
        <TouchableOpacity
          style={[
            styles.dropButton,
            (!recordingUri || isDropping) && styles.dropButtonDisabled,
          ]}
          onPress={handleDrop}
          disabled={!recordingUri || isDropping}
          activeOpacity={0.8}
        >
          {isDropping ? (
            <ActivityIndicator color="#0A0E17" size="small" />
          ) : (
            <>
              <Ionicons name="musical-note" size={20} color="#0A0E17" />
              <Text style={styles.dropButtonText}>DROP ECHO</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  mapContainer: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  map: {
    flex: 1,
  },
  echoMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  waveformContainer: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: '100%',
  },
  waveformStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#7B61FF',
  },
  waveBarStatic: {
    backgroundColor: '#555E78',
  },
  waveformPlaceholder: {
    color: '#555E78',
    fontSize: 13,
  },
  durationText: {
    color: '#8892B0',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FF4757',
    shadowColor: '#FF4757',
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  previewControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
  },
  retakeText: {
    color: '#FF4757',
    fontSize: 13,
    fontWeight: '600',
  },
  radiusSection: {
    width: '100%',
    marginBottom: 20,
  },
  radiusLabel: {
    color: '#8892B0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  radiusOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  radiusChip: {
    backgroundColor: '#141B2D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A2340',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  radiusChipActive: {
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderColor: '#7B61FF',
  },
  radiusChipText: {
    color: '#555E78',
    fontSize: 13,
    fontWeight: '600',
  },
  radiusChipTextActive: {
    color: '#7B61FF',
  },
  dropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B61FF',
    borderRadius: 16,
    height: 56,
    width: '100%',
    gap: 10,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dropButtonDisabled: {
    opacity: 0.4,
  },
  dropButtonText: {
    color: '#0A0E17',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

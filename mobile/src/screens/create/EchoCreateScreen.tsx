import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Image,
  TextInput,
} from 'react-native';
import MapView, { Circle, Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useLocationStore } from '../../store/locationStore';
import { useTerritoryStore } from '../../store/territoryStore';
import { echoApi, silentZoneApi } from '../../services/api';
import { strings as S, t } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { getMapStyle } from '../../utils/mapStyles';
import { useSettingsStore } from '../../store/settingsStore';
import { Theme } from '../../utils/constants';
import { EchoCreateScreenProps } from '../../navigation/types';

const { width } = Dimensions.get('window');
const MAX_DURATION = 30; // seconds

export default function EchoCreateScreen({ navigation }: EchoCreateScreenProps) {
  const theme = useTheme();
  const { settings } = useSettingsStore();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { currentLocation } = useLocationStore();
  const { territories } = useTerritoryStore();

  const [mediaType, setMediaType] = useState<'audio' | 'photo' | 'video'>('audio');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [duration, setDuration] = useState(0);
  const [radius, setRadius] = useState(40);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [timeWindow, setTimeWindow] = useState<'any' | 'day' | 'night'>('any');
  const [inSilentZone, setInSilentZone] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Check if current location is in a silent zone
  useEffect(() => {
    if (!currentLocation) return;
    silentZoneApi
      .getNearby(currentLocation.latitude, currentLocation.longitude, 100)
      .then(({ data }) => {
        const zones = data.data?.zones ?? data.zones ?? [];
        // Check if any zone polygon contains the user's location
        setInSilentZone(zones.length > 0);
      })
      .catch(() => setInSilentZone(false));
  }, [currentLocation]);

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
        Alert.alert(S.create.echo.micPermissionTitle, S.create.echo.micPermissionMsg);
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
      Alert.alert(S.common.error, S.create.echo.recordStartFailed);
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
      Alert.alert(S.common.error, S.create.echo.playFailed);
    }
  };

  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(S.create.echo.cameraPermissionTitle, S.create.echo.cameraPermissionPhotoMsg);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert(S.create.echo.cameraErrorTitle, err?.message || S.create.echo.cameraOpenFailed);
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(S.create.echo.cameraPermissionTitle, S.create.echo.cameraPermissionMsg);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 15,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert(S.create.echo.cameraErrorTitle, err?.message || S.create.echo.cameraOpenFailed);
    }
  };

  const handleDrop = async () => {
    if (!currentLocation) return;

    // Validate media is present based on type
    if (mediaType === 'audio' && !recordingUri) return;
    if ((mediaType === 'photo' || mediaType === 'video') && !mediaUri) return;

    if (inSilentZone) {
      Alert.alert(
        S.create.echo.silentZoneTitle,
        S.create.echo.silentZoneMsg
      );
      return;
    }

    setIsDropping(true);
    try {
      const formData = new FormData();
      formData.append('media_type', mediaType);
      formData.append('lat', currentLocation.latitude.toString());
      formData.append('lng', currentLocation.longitude.toString());
      formData.append('radius_m', radius.toString());
      formData.append('time_window', timeWindow);

      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      if (mediaType === 'audio' && recordingUri) {
        formData.append('media', {
          uri: recordingUri,
          type: 'audio/m4a',
          name: 'echo.m4a',
        } as any);
      } else if (mediaType === 'photo' && mediaUri) {
        formData.append('media', {
          uri: mediaUri,
          type: 'image/jpeg',
          name: 'echo.jpg',
        } as any);
      } else if (mediaType === 'video' && mediaUri) {
        formData.append('media', {
          uri: mediaUri,
          type: 'video/mp4',
          name: 'echo.mp4',
        } as any);
      }

      await echoApi.create(formData);

      const typeLabel = mediaType === 'audio' ? S.create.echo.typeAudio : mediaType === 'photo' ? S.create.echo.typePhoto : S.create.echo.typeVideo;
      Alert.alert(S.create.echo.droppedTitle, t(S.create.echo.droppedMsg, { type: typeLabel }), [
        { text: S.common.ok, onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(S.common.error, err?.message || S.create.echo.dropFailed);
    } finally {
      setIsDropping(false);
    }
  };

  const resetRecording = () => {
    setRecordingUri(null);
    setMediaUri(null);
    setCaption('');
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
          <Ionicons name="arrow-back" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.create.echo.title}</Text>
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
          scrollEnabled={true}
          zoomEnabled={true}
          rotateEnabled={false}
          pitchEnabled={false}
          customMapStyle={getMapStyle(settings.darkMapStyle)}
        >
          {/* Territory Polygons */}
          {Array.isArray(territories) && territories.map((t) => {
            if (!t.polygon || t.polygon.length < 3) return null;
            return (
              <Polygon
                key={t.id}
                coordinates={t.polygon.map((p: any) => ({ latitude: p.latitude, longitude: p.longitude }))}
                fillColor="rgba(0, 212, 255, 0.15)"
                strokeColor="#00D4FF"
                strokeWidth={1}
              />
            );
          })}
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

      {/* Silent Zone Warning */}
      {inSilentZone && (
        <View style={styles.silentZoneWarning}>
          <Ionicons name="leaf" size={16} color="#00C853" />
          <Text style={styles.silentZoneWarningText}>
            {S.create.echo.silentZoneWarning}
          </Text>
        </View>
      )}

      {/* Media Type Selector */}
      <View style={styles.mediaTypeContainer}>
        {([
          { value: 'audio' as const, label: S.create.echo.mediaAudio, icon: 'mic-outline' as const },
          { value: 'photo' as const, label: S.create.echo.mediaPhoto, icon: 'camera-outline' as const },
          // Video temporarily disabled to save server storage
        ]).map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.mediaTypeChip,
              mediaType === opt.value && styles.mediaTypeChipActive,
            ]}
            onPress={() => {
              resetRecording();
              setMediaType(opt.value);
            }}
          >
            <Ionicons
              name={opt.icon}
              size={16}
              color={mediaType === opt.value ? '#7B61FF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.mediaTypeChipText,
                mediaType === opt.value && { color: '#7B61FF' },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Audio waveform or Photo/Video preview */}
        {mediaType === 'audio' ? (
          <>
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
                  {S.create.echo.tapToRecord}
                </Text>
              )}
            </View>

            <Text style={styles.durationText}>
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} / 0:
              {MAX_DURATION}
            </Text>

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
                  <Text style={styles.retakeText}>{S.create.echo.retake}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Photo / Video preview */}
            <View style={styles.waveformContainer}>
              {mediaUri ? (
                <Image
                  source={{ uri: mediaUri }}
                  style={{ width: '100%', height: '100%', borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.waveformPlaceholder}>
                  {mediaType === 'photo'
                    ? S.create.echo.tapToPhoto
                    : S.create.echo.tapToVideo}
                </Text>
              )}
            </View>

            {!mediaUri ? (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={mediaType === 'photo' ? pickPhoto : pickVideo}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={mediaType === 'photo' ? 'camera' : 'videocam'}
                  size={32}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.previewControls}>
                <TouchableOpacity style={styles.retakeButton} onPress={resetRecording}>
                  <Ionicons name="refresh" size={20} color="#FF4757" />
                  <Text style={styles.retakeText}>{S.create.echo.retake}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Caption input for photo/video */}
            <TextInput
              style={styles.captionInput}
              placeholder={S.create.echo.captionPlaceholder}
              placeholderTextColor={theme.textSecondary}
              value={caption}
              onChangeText={setCaption}
              maxLength={200}
            />
          </>
        )}

        {/* Radius Slider */}
        <View style={styles.radiusSection}>
          <Text style={styles.radiusLabel}>{t(S.create.echo.radiusLabel, { radius })}</Text>
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

        {/* Time Window */}
        <View style={styles.radiusSection}>
          <Text style={styles.radiusLabel}>{S.create.echo.timeWindowLabel}</Text>
          <View style={styles.radiusOptions}>
            {([
              { value: 'any' as const, label: S.create.echo.timeAny },
              { value: 'day' as const, label: S.create.echo.timeDayOnly },
              { value: 'night' as const, label: S.create.echo.timeNightOnly },
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
                <Text
                  style={[
                    styles.radiusChipText,
                    timeWindow === opt.value && {
                      color: opt.value === 'night' ? '#8B5CF6' : '#7B61FF',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Drop Button */}
        <TouchableOpacity
          style={[
            styles.dropButton,
            (!(mediaType === 'audio' ? recordingUri : mediaUri) || isDropping) && styles.dropButtonDisabled,
          ]}
          onPress={handleDrop}
          disabled={!(mediaType === 'audio' ? recordingUri : mediaUri) || isDropping}
          activeOpacity={0.8}
        >
          {isDropping ? (
            <ActivityIndicator color="#0A0E17" size="small" />
          ) : (
            <>
              <Ionicons
                name={mediaType === 'audio' ? 'musical-note' : mediaType === 'photo' ? 'image' : 'videocam'}
                size={20}
                color="#0A0E17"
              />
              <Text style={styles.dropButtonText}>
                {mediaType === 'audio' ? S.create.echo.dropEcho : mediaType === 'photo' ? S.create.echo.dropPhoto : S.create.echo.dropVideo}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
  },
  mapContainer: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: theme.surface,
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
    backgroundColor: theme.textSecondary,
  },
  waveformPlaceholder: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  durationText: {
    color: theme.textSecondary,
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
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  radiusChipActive: {
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderColor: '#7B61FF',
  },
  radiusChipText: {
    color: theme.textSecondary,
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
  silentZoneWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 83, 0.3)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    gap: 10,
  },
  silentZoneWarningText: {
    color: '#00C853',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  mediaTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
  },
  mediaTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mediaTypeChipActive: {
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderColor: '#7B61FF',
  },
  mediaTypeChipText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  captionInput: {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
});

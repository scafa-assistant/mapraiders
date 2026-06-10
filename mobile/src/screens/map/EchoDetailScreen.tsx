import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { echoApi } from '../../services/api';
import { socialApi } from '../../services/api';
import { audioService } from '../../services/audio';
import { EchoDetailScreenProps } from '../../navigation/types';
import { strings as S, t, plural } from '../../i18n';

const { width } = Dimensions.get('window');

interface EchoDetail {
  id: string;
  creatorId: string;
  creatorUsername: string;
  location: { latitude: number; longitude: number };
  radius: number;
  audioUrl: string;
  duration: number;
  likes: number;
  liked: boolean;
  expiresAt: string;
  createdAt: string;
}

export default function EchoDetailScreen({ route, navigation }: EchoDetailScreenProps) {
  const { echoId } = route.params;
  const [echo, setEcho] = useState<EchoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await echoApi.getById(echoId);
        setEcho(data.data ?? data);
      } catch (_err) {
        // Silently fail
      }
      setLoading(false);
    })();

    return () => {
      audioService.stop();
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [echoId]);

  const handlePlayPause = async () => {
    if (!echo) return;

    if (isPlaying) {
      await audioService.pause();
      setIsPlaying(false);
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
      return;
    }

    setIsPlaying(true);
    setPlaybackProgress(0);

    try {
      await audioService.play(echo.audioUrl, () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
        if (progressTimer.current) {
          clearInterval(progressTimer.current);
          progressTimer.current = null;
        }
      });

      progressTimer.current = setInterval(async () => {
        const pos = await audioService.getPlaybackPosition();
        if (echo.duration > 0) {
          setPlaybackProgress(pos / (echo.duration * 1000));
        }
      }, 200);
    } catch (_err) {
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    await audioService.setVolume(newVolume);
  };

  const handleLike = async () => {
    if (!echo) return;
    try {
      await echoApi.like(echo.id);
      setEcho((prev) =>
        prev
          ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 }
          : prev
      );
    } catch (_err) {
      // Silently fail
    }
  };

  const handleReport = () => {
    if (!echo) return;
    Alert.alert(S.map.echoDetail.reportTitle, S.map.echoDetail.reportConfirm, [
      { text: S.common.cancel, style: 'cancel' },
      {
        text: S.map.echoDetail.reportAction,
        style: 'destructive',
        onPress: async () => {
          try {
            await socialApi.report({
              target_type: 'echo',
              target_id: echo.id,
              reason: 'inappropriate',
            });
            Alert.alert(S.map.echoDetail.reportedTitle, S.map.echoDetail.reportedMsg);
          } catch (_err) {
            Alert.alert(S.common.error, S.map.echoDetail.reportFailed);
          }
        },
      },
    ]);
  };

  const getExpiryText = (expiresAt: string): string => {
    const now = Date.now();
    const expiry = new Date(expiresAt || Date.now()).getTime();
    const diff = expiry - now;
    if (diff <= 0) return S.map.echoDetail.expired;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return t(S.map.echoDetail.expiresInDh, { days: Math.floor(hours / 24), hours: hours % 24 });
    if (hours > 0) return t(S.map.echoDetail.expiresInHm, { hours, minutes });
    return t(S.map.echoDetail.expiresInM, { minutes });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B61FF" />
      </SafeAreaView>
    );
  }

  if (!echo) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF4757" />
        <Text style={styles.errorText}>{S.map.echoDetail.notFound}</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>{S.map.echoDetail.goBack}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#8892B0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{S.map.echoDetail.headerTitle}</Text>
          <TouchableOpacity onPress={handleReport}>
            <Ionicons name="flag-outline" size={22} color="#8892B0" />
          </TouchableOpacity>
        </View>

        {/* Creator Info */}
        <View style={styles.creatorSection}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={28} color="#7B61FF" />
          </View>
          <View>
            <Text style={styles.creatorUsername}>{echo.creatorUsername}</Text>
            <Text style={styles.createdAt}>
              {new Date(echo.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Audio Player */}
        <View style={styles.playerSection}>
          {/* Waveform Visualization */}
          <View style={styles.waveformContainer}>
            {Array.from({ length: 30 }).map((_, i) => {
              const barProgress = i / 30;
              const isActive = barProgress <= playbackProgress;
              return (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: Math.sin((i / 30) * Math.PI * 3) * 20 + 8,
                      backgroundColor: isActive ? '#7B61FF' : '#2A3450',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${playbackProgress * 100}%` }]}
            />
          </View>

          {/* Duration */}
          <View style={styles.durationRow}>
            <Text style={styles.durationText}>
              {formatDuration(Math.floor(playbackProgress * echo.duration))}
            </Text>
            <Text style={styles.durationText}>
              {formatDuration(echo.duration)}
            </Text>
          </View>

          {/* Play/Pause + Volume */}
          <View style={styles.controlsRow}>
            <View style={{ width: 44 }} />
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* Volume Controls */}
            <View style={styles.volumeControls}>
              <TouchableOpacity
                onPress={() => handleVolumeChange(Math.max(0, volume - 0.25))}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={volume === 0 ? 'volume-mute' : 'volume-low'}
                  size={20}
                  color="#8892B0"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleVolumeChange(Math.min(1, volume + 0.25))}
                activeOpacity={0.7}
              >
                <Ionicons name="volume-high" size={20} color="#8892B0" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Like Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.likeButton, echo.liked && styles.likeButtonActive]}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Ionicons
              name={echo.liked ? 'heart' : 'heart-outline'}
              size={22}
              color={echo.liked ? '#FF4757' : '#8892B0'}
            />
            <Text style={[styles.likeText, echo.liked && styles.likeTextActive]}>
              {plural(echo.likes, S.map.echoDetail.likeOne, S.map.echoDetail.likeOther)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expiry Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#FFB800" />
            <Text style={styles.infoText}>{getExpiryText(echo.expiresAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="radio-outline" size={18} color="#8892B0" />
            <Text style={styles.infoText}>{t(S.map.echoDetail.radiusM, { radius: echo.radius })}</Text>
          </View>
        </View>

        {/* Mini Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.mapPreview}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: echo.location.latitude,
              longitude: echo.location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Circle
              center={{
                latitude: echo.location.latitude,
                longitude: echo.location.longitude,
              }}
              radius={echo.radius}
              fillColor="rgba(123, 97, 255, 0.15)"
              strokeColor="#7B61FF"
              strokeWidth={1.5}
            />
            <Marker
              coordinate={{
                latitude: echo.location.latitude,
                longitude: echo.location.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.echoMapMarker}>
                <Ionicons name="musical-notes" size={16} color="#7B61FF" />
              </View>
            </Marker>
          </MapView>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  errorText: {
    color: '#FF4757',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 100,
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
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2340',
    gap: 14,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorUsername: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  createdAt: {
    color: '#8892B0',
    fontSize: 13,
  },
  playerSection: {
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#141B2D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 50,
    marginBottom: 12,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A3450',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#7B61FF',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  durationText: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#141B2D',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  likeButtonActive: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  likeText: {
    color: '#8892B0',
    fontSize: 15,
    fontWeight: '600',
  },
  likeTextActive: {
    color: '#FF4757',
  },
  infoSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    color: '#8892B0',
    fontSize: 14,
  },
  mapContainer: {
    height: 180,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  echoMapMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

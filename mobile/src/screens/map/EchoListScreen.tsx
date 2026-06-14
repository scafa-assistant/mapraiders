import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { echoApi } from '../../services/api';
import { audioService } from '../../services/audio';
import { EchoListScreenProps } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/constants';
import { strings as S, t } from '../../i18n';

interface EchoItem {
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
  distance?: number;
}

export default function EchoListScreen({ navigation }: EchoListScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { currentLocation } = useLocationStore();
  const [echos, setEchos] = useState<EchoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const loadEchos = useCallback(async () => {
    if (currentLocation) {
      try {
        const { data } = await echoApi.getNearby(
          currentLocation.latitude,
          currentLocation.longitude,
          2000
        );
        setEchos(data.data ?? data);
      } catch (_err) {
        // Silently fail
      }
    }
    setLoading(false);
  }, [currentLocation]);

  useEffect(() => {
    loadEchos();
    return () => {
      audioService.stop();
    };
  }, [loadEchos]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEchos();
    setRefreshing(false);
  };

  const handlePlay = async (echo: EchoItem) => {
    if (playingId === echo.id) {
      await audioService.stop();
      setPlayingId(null);
      return;
    }

    setPlayingId(echo.id);
    try {
      await audioService.play(echo.audioUrl, () => {
        setPlayingId(null);
      });
    } catch (_err) {
      setPlayingId(null);
    }
  };

  const handleLike = async (echo: EchoItem) => {
    try {
      await echoApi.like(echo.id);
      setEchos((prev) =>
        prev.map((e) =>
          e.id === echo.id
            ? { ...e, liked: !e.liked, likes: e.liked ? e.likes - 1 : e.likes + 1 }
            : e
        )
      );
    } catch (_err) {
      // Silently fail
    }
  };

  const getExpiryText = (expiresAt: string): string => {
    const now = Date.now();
    const expiry = new Date(expiresAt || Date.now()).getTime();
    const diff = expiry - now;
    if (diff <= 0) return S.map.echoList.expired;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return t(S.map.echoList.expiresInH, { hours });
    return t(S.map.echoList.expiresInM, { minutes });
  };

  const formatDistance = (meters?: number): string => {
    if (!meters) return '';
    if (meters < 1000) return t(S.map.echoList.metersAway, { distance: Math.round(meters) });
    return t(S.map.echoList.kmAway, { distance: (meters / 1000).toFixed(1) });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderEchoCard = ({ item }: { item: EchoItem }) => {
    const isPlaying = playingId === item.id;

    return (
      <TouchableOpacity
        style={styles.echoCard}
        onPress={() => navigation.navigate('EchoDetail', { echoId: item.id })}
        activeOpacity={0.7}
      >
        {/* Waveform Icon + Creator */}
        <View style={styles.echoCardTop}>
          <View style={styles.echoCreator}>
            <View style={styles.waveformIcon}>
              <Ionicons name="musical-notes" size={20} color={theme.secondary} />
            </View>
            <View>
              <Text style={styles.creatorUsername}>{item.creatorUsername}</Text>
              <View style={styles.echoMeta}>
                <Text style={styles.metaText}>{formatDuration(item.duration)}</Text>
                {item.distance !== undefined && (
                  <>
                    <View style={styles.metaDivider} />
                    <Text style={styles.metaText}>{formatDistance(item.distance)}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={() => handlePlay(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPlaying ? 'stop' : 'play'}
              size={22}
              color={isPlaying ? '#FFFFFF' : theme.secondary}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Row */}
        <View style={styles.echoCardBottom}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLike(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.liked ? 'heart' : 'heart-outline'}
              size={16}
              color={item.liked ? theme.danger : '#7A7470'}
            />
            <Text style={[styles.likeCount, item.liked && styles.likeCountActive]}>
              {item.likes}
            </Text>
          </TouchableOpacity>

          <Text style={styles.expiryText}>{getExpiryText(item.expiresAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="musical-notes-outline" size={64} color="#7A7470" />
        <Text style={styles.emptyTitle}>{S.map.echoList.emptyTitle}</Text>
        <Text style={styles.emptySubtext}>
          {S.map.echoList.emptySubtext}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.map.echoList.headerTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Echo List */}
      {loading && echos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
          <Text style={styles.loadingText}>{S.map.echoList.scanning}</Text>
        </View>
      ) : (
        <FlatList
          data={echos}
          keyExtractor={(item) => item.id}
          renderItem={renderEchoCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.secondary}
              colors={[theme.secondary]}
            />
          }
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  echoCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  echoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  echoCreator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  waveformIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorUsername: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  echoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#EFEDE8',
  },
  metaText: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    borderWidth: 1.5,
    borderColor: theme.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: theme.secondary,
  },
  echoCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    color: '#7A7470',
    fontSize: 13,
    fontWeight: '600',
  },
  likeCountActive: {
    color: theme.danger,
  },
  expiryText: {
    color: theme.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#7A7470',
    fontSize: 13,
    marginTop: 6,
  },
});

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { artifactApi } from '../../services/api';
import { ArtifactDetailScreenProps } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/constants';
import { strings as S, t, plural } from '../../i18n';

const { width } = Dimensions.get('window');

const RARITY_COLORS: Record<string, string> = {
  common: '#7A7470',
  rare: '#1558F0',
  epic: '#1558F0',
  legendary: '#F5A623',
};

const getRarityLabels = (): Record<string, string> => ({
  common: S.map.artifactDetail.rarityCommon,
  rare: S.map.artifactDetail.rarityRare,
  epic: S.map.artifactDetail.rarityEpic,
  legendary: S.map.artifactDetail.rarityLegendary,
});

const PERMANENCE_THRESHOLD = 50;

interface Artifact {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  photoUrl?: string;
  creatorId: string;
  creatorUsername: string;
  location: { latitude: number; longitude: number };
  votes: number;
  voted: boolean;
  permanent: boolean;
  createdAt: string;
}

export default function ArtifactDetailScreen({ route, navigation }: ArtifactDetailScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const rarityLabels = useMemo(getRarityLabels, []);
  const { artifactId } = route.params;
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await artifactApi.getById(artifactId);
        setArtifact(data.data ?? data);
      } catch (_err) {
        // Silently fail
      }
      setLoading(false);
    })();
  }, [artifactId]);

  const handleVote = async () => {
    if (!artifact || artifact.voted || artifact.permanent) return;

    setVoting(true);
    try {
      await artifactApi.vote(artifact.id);
      setArtifact((prev) =>
        prev ? { ...prev, voted: true, votes: prev.votes + 1 } : prev
      );
    } catch (_err) {
      Alert.alert(S.common.error, S.map.artifactDetail.voteFailed);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.secondary} />
      </SafeAreaView>
    );
  }

  if (!artifact) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.danger} />
        <Text style={styles.errorText}>{S.map.artifactDetail.notFound}</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>{S.map.artifactDetail.goBack}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const rarityColor = RARITY_COLORS[artifact.rarity] ?? RARITY_COLORS.common;
  const rarityLabel = rarityLabels[artifact.rarity] ?? artifact.rarity;
  const permanenceProgress = Math.min(artifact.votes / PERMANENCE_THRESHOLD, 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{S.map.artifactDetail.headerTitle}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Photo */}
        {artifact.photoUrl && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: artifact.photoUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Name + Badges */}
        <View style={styles.infoSection}>
          <Text style={styles.artifactName}>{artifact.name}</Text>

          <View style={styles.badgeRow}>
            {/* Type Badge */}
            <View style={styles.typeBadge}>
              <Ionicons name="cube-outline" size={14} color={theme.textSecondary} />
              <Text style={styles.typeBadgeText}>{artifact.type}</Text>
            </View>

            {/* Rarity Badge */}
            <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
              <Ionicons name="diamond" size={14} color={rarityColor} />
              <Text style={[styles.rarityBadgeText, { color: rarityColor }]}>
                {rarityLabel}
              </Text>
            </View>

            {artifact.permanent && (
              <View style={styles.permanentBadge}>
                <Ionicons name="shield-checkmark" size={14} color={theme.accent} />
                <Text style={styles.permanentBadgeText}>{S.map.artifactDetail.permanentBadge}</Text>
              </View>
            )}
          </View>

          <Text style={styles.description}>{artifact.description}</Text>

          {/* Creator Info */}
          <View style={styles.creatorRow}>
            <Ionicons name="person-circle-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.creatorText}>{t(S.map.artifactDetail.createdBy, { username: artifact.creatorUsername })}</Text>
          </View>
          <View style={styles.creatorRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
            <Text style={styles.creatorText}>
              {new Date(artifact.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Permanence Progress */}
        <View style={styles.permanenceSection}>
          <Text style={styles.sectionTitle}>{S.map.artifactDetail.permanenceTitle}</Text>
          <View style={styles.permanenceCard}>
            <View style={styles.permanenceHeader}>
              <Text style={styles.permanenceVotes}>
                {t(S.map.artifactDetail.votesCount, { votes: artifact.votes, threshold: PERMANENCE_THRESHOLD })}
              </Text>
              <Text style={styles.permanencePercent}>
                {Math.round(permanenceProgress * 100)}%
              </Text>
            </View>
            <View style={styles.permanenceBarBg}>
              <View
                style={[
                  styles.permanenceBarFill,
                  {
                    width: `${permanenceProgress * 100}%`,
                    backgroundColor: artifact.permanent ? theme.accent : rarityColor,
                  },
                ]}
              />
            </View>
            {artifact.permanent ? (
              <Text style={styles.permanenceStatus}>
                {S.map.artifactDetail.madePermanent}
              </Text>
            ) : (
              <Text style={styles.permanenceStatus}>
                {plural(
                  PERMANENCE_THRESHOLD - artifact.votes,
                  S.map.artifactDetail.votesNeededOne,
                  S.map.artifactDetail.votesNeededOther
                )}
              </Text>
            )}
          </View>
        </View>

        {/* Vote Button */}
        {!artifact.permanent && (
          <View style={styles.voteSection}>
            <TouchableOpacity
              style={[
                styles.voteButton,
                artifact.voted && styles.voteButtonVoted,
                voting && styles.voteButtonDisabled,
              ]}
              onPress={handleVote}
              disabled={artifact.voted || voting}
              activeOpacity={0.8}
            >
              {voting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={artifact.voted ? 'checkmark-circle' : 'arrow-up-circle'}
                    size={22}
                    color={artifact.voted ? theme.textSecondary : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.voteButtonText,
                      artifact.voted && styles.voteButtonTextVoted,
                    ]}
                  >
                    {artifact.voted ? S.map.artifactDetail.voted : S.map.artifactDetail.voteForPermanence}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Mini Map */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>{S.map.artifactDetail.locationTitle}</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.mapPreview}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude: artifact.location.latitude,
                longitude: artifact.location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: artifact.location.latitude,
                  longitude: artifact.location.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.artifactMapMarker, { borderColor: rarityColor }]}>
                  <Ionicons name="diamond" size={16} color={rarityColor} />
                </View>
              </Marker>
            </MapView>
          </View>
        </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: theme.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    color: theme.primary,
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
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
  },
  photoContainer: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  artifactName: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  typeBadgeText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rarityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  permanentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(27,158,90,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  permanentBadgeText: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: '#141210',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  creatorText: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  permanenceSection: {
    padding: 20,
  },
  sectionTitle: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  permanenceCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  permanenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  permanenceVotes: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  permanencePercent: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  permanenceBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EFEDE8',
    overflow: 'hidden',
    marginBottom: 10,
  },
  permanenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  permanenceStatus: {
    color: '#7A7470',
    fontSize: 12,
  },
  voteSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.secondary,
    borderRadius: 16,
    height: 56,
    gap: 10,
    shadowColor: theme.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  voteButtonVoted: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  voteButtonDisabled: {
    opacity: 0.7,
  },
  voteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  voteButtonTextVoted: {
    color: theme.textSecondary,
  },
  mapSection: {
    paddingHorizontal: 20,
  },
  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  artifactMapMarker: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(21,88,240,0.15)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
});

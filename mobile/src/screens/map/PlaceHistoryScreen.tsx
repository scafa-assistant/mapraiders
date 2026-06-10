import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { placeApi } from '../../services/api';
import type { PlaceHistoryScreenProps } from '../../navigation/types';
import { strings as S, t, plural } from '../../i18n';

const { width } = Dimensions.get('window');

// ─── Event type configuration ─────────────────────────────────────────────

interface EventConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  claim: { icon: 'flag', color: '#00FF88', label: S.map.placeHistory.eventClaim },
  takeover: { icon: 'flash', color: '#FF4757', label: S.map.placeHistory.eventTakeover },
  quest_complete: { icon: 'compass', color: '#00D4FF', label: S.map.placeHistory.eventQuestComplete },
  echo_created: { icon: 'musical-note', color: '#7B61FF', label: S.map.placeHistory.eventEchoCreated },
  echo_expired: { icon: 'musical-note', color: '#555E78', label: S.map.placeHistory.eventEchoExpired },
  challenge_complete: { icon: 'trophy', color: '#FFB800', label: S.map.placeHistory.eventChallengeComplete },
  artifact_placed: { icon: 'diamond', color: '#7B61FF', label: S.map.placeHistory.eventArtifactPlaced },
};

const DEFAULT_EVENT_CONFIG: EventConfig = {
  icon: 'ellipse',
  color: '#8892B0',
  label: S.map.placeHistory.eventDefault,
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlaceEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  username: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

interface PlaceStats {
  total_events: number;
  unique_visitors: number;
  total_claims: number;
  total_quests: number;
  total_echos: number;
  total_artifacts: number;
  most_active_user: string | null;
  busiest_hour: number | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr || Date.now()).getTime()) / 1000);
  if (seconds < 60) return S.common.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t(S.common.minutesAgo, { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t(S.common.hoursAgo, { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return plural(days, S.common.daysAgoOne, S.common.daysAgoOther);
  return t(S.map.placeHistory.monthsAgo, { count: Math.floor(days / 30) });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PlaceHistoryScreen({ navigation, route }: PlaceHistoryScreenProps) {
  const { lat, lng } = route.params;

  const [events, setEvents] = useState<PlaceEvent[]>([]);
  const [stats, setStats] = useState<PlaceStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, statsRes] = await Promise.all([
        placeApi.getHistory(lat, lng, 50, 30),
        placeApi.getStats(lat, lng, 100),
      ]);
      setEvents(historyRes.data?.data?.events ?? []);
      setStats(statsRes.data?.data ?? null);
    } catch (_err) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderStatCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>{S.map.placeHistory.statsTitle}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.unique_visitors}</Text>
            <Text style={styles.statLabel}>{S.map.placeHistory.statVisitors}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total_claims}</Text>
            <Text style={styles.statLabel}>{S.map.placeHistory.statClaims}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total_quests}</Text>
            <Text style={styles.statLabel}>{S.map.placeHistory.statQuests}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total_echos}</Text>
            <Text style={styles.statLabel}>{S.map.placeHistory.statEchos}</Text>
          </View>
        </View>
        {stats.most_active_user && (
          <View style={styles.topUserRow}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.topUserText}>
              {S.map.placeHistory.mostActivePrefix} <Text style={styles.topUserName}>{stats.most_active_user}</Text>
            </Text>
          </View>
        )}
        {stats.busiest_hour !== null && (
          <View style={styles.topUserRow}>
            <Ionicons name="time" size={14} color="#00D4FF" />
            <Text style={styles.topUserText}>
              {S.map.placeHistory.busiestHourPrefix} <Text style={styles.topUserName}>{stats.busiest_hour}:00</Text>
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEvent = ({ item }: { item: PlaceEvent }) => {
    const config = EVENT_CONFIG[item.event_type] || DEFAULT_EVENT_CONFIG;
    const displayName = item.username || S.map.placeHistory.someone;

    return (
      <View style={styles.eventRow}>
        <View style={[styles.eventIcon, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon} size={16} color={config.color} />
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventText}>
            <Text style={[styles.eventUsername, { color: config.color }]}>{displayName}</Text>
            {' '}{config.label}
          </Text>
          <Text style={styles.eventTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#8892B0" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{S.map.placeHistory.headerTitle}</Text>
          <Text style={styles.headerCoords}>
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D4FF" />
          <Text style={styles.loadingText}>{S.map.placeHistory.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          ListHeaderComponent={
            <>
              {renderStatCard()}
              <View style={styles.timelineHeader}>
                <Ionicons name="time-outline" size={14} color="#8892B0" />
                <Text style={styles.timelineTitle}>{S.map.placeHistory.timelineTitle}</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color="#2A3450" />
              <Text style={styles.emptyText}>{S.map.placeHistory.emptyTitle}</Text>
              <Text style={styles.emptySubtext}>
                {S.map.placeHistory.emptySubtext}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2340',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#141B2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerCoords: {
    color: '#555E78',
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8892B0',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Stats card
  statsCard: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  statsTitle: {
    color: '#8892B0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#555E78',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  topUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1A2340',
    marginTop: 4,
  },
  topUserText: {
    color: '#8892B0',
    fontSize: 12,
  },
  topUserName: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Timeline
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timelineTitle: {
    color: '#8892B0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1A2340',
    gap: 12,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  eventUsername: {
    fontWeight: '700',
  },
  eventTime: {
    color: '#555E78',
    fontSize: 11,
    marginTop: 2,
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: '#8892B0',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#555E78',
    fontSize: 13,
    textAlign: 'center',
  },
});

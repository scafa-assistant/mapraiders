import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';
import { meetupApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { MeetupDetailScreenProps } from '../../navigation/types';
import { strings as S, t } from '../../i18n';

const { width } = Dimensions.get('window');

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0A0E17' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0E17' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555E78' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A2340' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#141B2D' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D1220' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0F1A1A' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
];

const CATEGORY_COLORS: Record<string, string> = {
  party: '#FF69B4',
  sport: '#00FF88',
  gaming: '#7B61FF',
  meetup: '#00D4FF',
  other: '#8892B0',
};

const CATEGORY_LABELS: Record<string, string> = {
  party: S.map.meetupDetail.categoryParty,
  sport: S.map.meetupDetail.categorySport,
  gaming: S.map.meetupDetail.categoryGaming,
  meetup: S.map.meetupDetail.categoryMeetup,
  other: S.map.meetupDetail.categoryOther,
};

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MeetupDetailScreen({ navigation, route }: MeetupDetailScreenProps) {
  const { meetupId } = route.params;
  const { user } = useAuthStore();
  const { currentLocation } = useLocationStore();
  const currentUserId = user?.id;

  const [meetup, setMeetup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMeetup = useCallback(async () => {
    try {
      const { data } = await meetupApi.getById(meetupId);
      const m = data?.data ?? data;
      setMeetup(m);
    } catch {
      Alert.alert(S.common.error, S.map.meetupDetail.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [meetupId]);

  useEffect(() => {
    fetchMeetup();
  }, [fetchMeetup]);

  const isCreator = meetup?.creator_id === currentUserId || meetup?.creatorId === currentUserId;
  const attendees: any[] = meetup?.attendees ?? [];
  const isJoined = attendees.some(
    (a: any) => (a.user_id ?? a.userId ?? a.id) === currentUserId
  );
  const maxAttendees = meetup?.max_attendees ?? meetup?.maxAttendees;
  const attendeeCount = attendees.length;

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await meetupApi.join(meetupId);
      await fetchMeetup();
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.map.meetupDetail.joinFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await meetupApi.leave(meetupId);
      await fetchMeetup();
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.map.meetupDetail.leaveFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    const hasAttendees = attendeeCount > 0;
    Alert.alert(
      hasAttendees ? S.map.meetupDetail.cancelEventTitle : S.map.meetupDetail.deleteEventTitle,
      hasAttendees
        ? t(S.map.meetupDetail.cancelEventMsg, { count: attendeeCount })
        : S.map.meetupDetail.deleteEventMsg,
      [
        { text: S.common.back, style: 'cancel' },
        {
          text: hasAttendees ? S.map.meetupDetail.cancelAction : S.common.delete,
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { data } = await meetupApi.cancel(meetupId);
              const msg = data?.data?.message || S.map.meetupDetail.eventCancelledFallback;
              Alert.alert(S.common.done, msg);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert(S.common.error, err.message || S.map.meetupDetail.cancelFailed);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkPresent = async () => {
    if (!currentLocation) {
      Alert.alert(S.map.meetupDetail.locationRequiredTitle, S.map.meetupDetail.locationRequiredMsg);
      return;
    }
    setActionLoading(true);
    try {
      await meetupApi.markPresent(meetupId, currentLocation.latitude, currentLocation.longitude);
      Alert.alert(S.map.meetupDetail.checkedInTitle, S.map.meetupDetail.checkedInMsg);
      await fetchMeetup();
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.map.meetupDetail.checkInFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChat = () => {
    const eventName = meetup?.name ?? S.map.meetupDetail.defaultEventName;
    navigation.navigate('MeetupChat', { eventId: meetupId, eventName });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>{S.map.meetupDetail.loadingEvent}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!meetup) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={THEME.danger} />
          <Text style={styles.loadingText}>{S.map.meetupDetail.notFound}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.goBackText}>{S.map.meetupDetail.goBack}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryKey = meetup.category ?? 'other';
  const categoryColor = CATEGORY_COLORS[categoryKey] ?? '#8892B0';
  const categoryLabel = CATEGORY_LABELS[categoryKey] ?? S.map.meetupDetail.categoryFallback;
  const eventLat = meetup.lat ?? meetup.latitude ?? 0;
  const eventLng = meetup.lng ?? meetup.longitude ?? 0;
  const creatorName = meetup.creator_username ?? meetup.creatorUsername ?? S.map.meetupDetail.unknownCreator;
  const eventDate = meetup.event_date ?? meetup.eventDate ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{S.map.meetupDetail.headerTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Card */}
        <View style={[styles.eventCard, { borderColor: `${categoryColor}40` }]}>
          <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}25` }]}>
            <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>{categoryLabel}</Text>
          </View>
          <Text style={styles.eventName}>{meetup.name}</Text>
          {eventDate ? (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color={THEME.textSecondary} />
              <Text style={styles.dateText}>{formatEventDate(eventDate)}</Text>
            </View>
          ) : null}
          {meetup.description ? (
            <Text style={styles.description}>{meetup.description}</Text>
          ) : null}
        </View>

        {/* Creator */}
        <View style={styles.creatorRow}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={18} color={THEME.textSecondary} />
          </View>
          <Text style={styles.creatorText}>
            {S.map.meetupDetail.createdByPrefix} <Text style={styles.creatorName}>{creatorName}</Text>
          </Text>
        </View>

        {/* Mini Map */}
        {eventLat !== 0 && eventLng !== 0 && (
          <View style={styles.miniMapContainer}>
            <MapView
              style={styles.miniMap}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              customMapStyle={DARK_MAP_STYLE}
              initialRegion={{
                latitude: eventLat,
                longitude: eventLng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker coordinate={{ latitude: eventLat, longitude: eventLng }}>
                <View style={[styles.mapPin, { backgroundColor: `${categoryColor}30`, borderColor: categoryColor }]}>
                  <Ionicons name="location" size={20} color={categoryColor} />
                </View>
              </Marker>
            </MapView>
          </View>
        )}

        {/* Attendees */}
        <View style={styles.attendeesSection}>
          <Text style={styles.sectionTitle}>
            {maxAttendees
              ? t(S.map.meetupDetail.attendingWithMax, { count: attendeeCount, max: maxAttendees })
              : t(S.map.meetupDetail.attendingCount, { count: attendeeCount })}
          </Text>
          {attendees.length === 0 ? (
            <Text style={styles.noAttendeesText}>{S.map.meetupDetail.noAttendees}</Text>
          ) : (
            <View style={styles.attendeeList}>
              {attendees.map((a: any, index: number) => {
                const username = a.username ?? a.user_username ?? 'User';
                const isPresent = a.is_present ?? a.isPresent ?? false;
                return (
                  <View key={a.user_id ?? a.userId ?? a.id ?? index} style={styles.attendeeRow}>
                    <View style={styles.attendeeAvatar}>
                      <Ionicons name="person" size={14} color={THEME.textSecondary} />
                    </View>
                    <Text style={styles.attendeeUsername}>{username}</Text>
                    {isPresent && (
                      <View style={styles.presentDot} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        {actionLoading ? (
          <ActivityIndicator size="large" color={THEME.primary} />
        ) : meetup?.status === 'cancelled' ? (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: THEME.danger, fontSize: 16, fontWeight: '800' }}>{S.map.meetupDetail.eventCancelledBanner}</Text>
          </View>
        ) : !isJoined ? (
          <View style={{ gap: 8 }}>
            <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} activeOpacity={0.8}>
              <Ionicons name="add-circle" size={22} color={THEME.bg} />
              <Text style={styles.joinBtnText}>{S.map.meetupDetail.joinBtn}</Text>
            </TouchableOpacity>
            {isCreator && (
              <TouchableOpacity style={styles.leaveBtn} onPress={handleCancel} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={18} color={THEME.danger} />
                <Text style={styles.leaveBtnText}>{S.map.meetupDetail.deleteEventBtn}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.joinedActions}>
            <TouchableOpacity style={styles.presentBtn} onPress={handleMarkPresent} activeOpacity={0.8}>
              <Ionicons name="location" size={20} color={THEME.bg} />
              <Text style={styles.presentBtnText}>{S.map.meetupDetail.imHereBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat} activeOpacity={0.8}>
              <Ionicons name="chatbubbles" size={20} color={THEME.primary} />
              <Text style={styles.chatBtnText}>{S.map.meetupDetail.chatBtn}</Text>
            </TouchableOpacity>
            {isCreator ? (
              <TouchableOpacity style={styles.leaveBtn} onPress={handleCancel} activeOpacity={0.8}>
                <Ionicons name="close-circle" size={20} color={THEME.danger} />
                <Text style={styles.leaveBtnText}>{attendeeCount > 0 ? S.map.meetupDetail.cancelBtn : S.map.meetupDetail.deleteBtn}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.8}>
                <Ionicons name="exit-outline" size={20} color={THEME.danger} />
                <Text style={styles.leaveBtnText}>{S.map.meetupDetail.leaveBtn}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  goBackText: {
    color: THEME.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: THEME.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eventCard: {
    marginTop: SPACING.lg,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  categoryBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    color: THEME.text,
    marginBottom: SPACING.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  dateText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  description: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  creatorName: {
    color: THEME.text,
    fontWeight: '700',
  },
  miniMapContainer: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  miniMap: {
    width: '100%',
    height: 150,
  },
  mapPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeesSection: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  noAttendeesText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  attendeeList: {
    gap: SPACING.sm,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: THEME.border,
    gap: SPACING.md,
  },
  attendeeAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  attendeeUsername: {
    flex: 1,
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  presentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF88',
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D4FF',
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    gap: SPACING.sm,
  },
  joinBtnText: {
    color: THEME.bg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    letterSpacing: 1,
  },
  joinedActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  presentBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF88',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    gap: 6,
  },
  presentBtnText: {
    color: THEME.bg,
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    gap: 4,
  },
  chatBtnText: {
    color: THEME.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  leaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: THEME.danger,
    gap: 4,
  },
  leaveBtnText: {
    color: THEME.danger,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
});

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { CLASS_COLORS, CLASS_LABELS } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';
import { formatArea, formatNumber, formatXP } from '../../utils/formatters';
import { notificationApi, userApi } from '../../services/api';
import StatBar from '../../components/StatBar';
import ClassBadge from '../../components/ClassBadge';
import type { ProfileScreenProps, MovementClass } from '../../navigation/types';

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, refreshProfile } = useAuthStore();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    refreshProfile();
    // Fetch avatar URL
    userApi.getMe().then(({ data }) => {
      const userData = data?.data ?? data;
      if (userData?.avatar_url) {
        setAvatarUrl(userData.avatar_url);
      }
    }).catch(() => {});
    // Fetch unread notification count
    notificationApi.get().then(({ data }) => {
      const items = data?.data?.notifications ?? data?.data ?? data ?? [];
      const unread = Array.isArray(items) ? items.filter((n: { read: boolean }) => !n.read).length : 0;
      setUnreadNotifications(unread);
    }).catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  const handleAvatarPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'avatar.jpg',
      } as any);

      const { data } = await userApi.uploadAvatar(formData);
      const responseData = data?.data ?? data;
      if (responseData?.avatar_url) {
        setAvatarUrl(responseData.avatar_url);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const classBreakdown = (user as any).classBreakdown || {};
  const dominantClass = (Object.entries(classBreakdown).length > 0
    ? Object.entries(classBreakdown).reduce(
        (max, [cls, count]) => ((count as number) > (max[1] as number) ? [cls, count] : max),
        ['walker', 0] as [string, number]
      )[0]
    : 'walker') as MovementClass;

  const totalClassSteps = Object.values(classBreakdown).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
  const stats = (user as any).stats || {};
  const totalClaims = stats.territories || (user as any).totalClaims || 0;
  const totalArea = stats.total_territory_m2 || (user as any).totalArea || 0;
  const questsCompleted = stats.quests_completed || (user as any).questsCompleted || 0;
  const xpToNextLevel = (user as any).xpToNextLevel || 100;
  const currentStreak = (user as any).streak_days || (user as any).currentStreak || 0;
  const longestStreak = (user as any).longestStreak || currentStreak;
  const titles = (user as any).titles || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header with settings */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity onPress={handleAvatarPick} activeOpacity={0.7} style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image
                source={{ uri: 'https://api.mapraiders.com' + avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={36} color={theme.primary} />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.username, { color: theme.text }]}>{user.username}</Text>

          {/* Level + XP */}
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={[styles.levelText, { color: theme.primary }]}>Level {user.level}</Text>
            </View>
            <ClassBadge movementClass={dominantClass} size="sm" />
          </View>

          <View style={styles.xpBarContainer}>
            <StatBar
              current={Number(user.xp) || 0}
              max={Number(xpToNextLevel) || 100}
              color={theme.primary}
              height={8}
              showPercentage={false}
              showValues
            />
          </View>

          {/* Titles */}
          {titles.length > 0 && (
            <View style={styles.titlesRow}>
              {titles.slice(0, 3).map((title) => (
                <View key={title} style={styles.titleBadge}>
                  <Ionicons name="ribbon-outline" size={12} color={theme.warning} />
                  <Text style={[styles.titleText, { color: theme.warning }]}>{title}</Text>
                </View>
              ))}
              {titles.length > 3 && (
                <Text style={[styles.moreText, { color: theme.textSecondary }]}>+{titles.length - 3}</Text>
              )}
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="map-outline" size={20} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{formatNumber(totalClaims)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Claims</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="resize-outline" size={20} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.text }]}>{formatArea(totalArea)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Area</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="flag-outline" size={20} color={theme.secondary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{formatNumber(questsCompleted)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Quests</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="star-outline" size={20} color={theme.warning} />
            <Text style={[styles.statValue, { color: theme.text }]}>{formatXP(Number(user.xp) || 0)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total XP</Text>
          </View>
        </View>

        {/* Streak */}
        <View style={[styles.streakCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.streakLeft}>
            <Ionicons name="flame" size={28} color="#FF6B35" />
            <View>
              <Text style={[styles.streakValue, { color: theme.text }]}>{currentStreak} Days</Text>
              <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Current Streak</Text>
            </View>
          </View>
          <View style={styles.streakRight}>
            <Text style={[styles.bestStreakValue, { color: theme.warning }]}>{longestStreak}</Text>
            <Text style={[styles.bestStreakLabel, { color: theme.textSecondary }]}>Best</Text>
          </View>
        </View>

        {/* Class Breakdown */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Movement Classes</Text>
          {Object.entries(classBreakdown)
            .filter(([, count]) => Number(count) > 0)
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .map(([cls, count]) => {
              const numCount = Number(count) || 0;
              const pct = totalClassSteps > 0 ? (numCount / totalClassSteps) * 100 : 0;
              return (
                <View key={cls} style={styles.classRow}>
                  <View style={styles.classInfo}>
                    <View
                      style={[
                        styles.classDot,
                        { backgroundColor: CLASS_COLORS[cls as MovementClass] || theme.textSecondary },
                      ]}
                    />
                    <Text style={[styles.classLabel, { color: theme.textSecondary }]}>
                      {CLASS_LABELS[cls as MovementClass] || cls}
                    </Text>
                  </View>
                  <View style={styles.classBarOuter}>
                    <View
                      style={[
                        styles.classBarInner,
                        {
                          width: `${pct}%`,
                          backgroundColor: CLASS_COLORS[cls as MovementClass] || theme.textSecondary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.classPct, { color: theme.textSecondary }]}>{pct.toFixed(0)}%</Text>
                </View>
              );
            })}
        </View>

        {/* Pet Button */}
        <TouchableOpacity
          style={[styles.petButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Pet')}
          activeOpacity={0.7}
        >
          <View style={styles.petIconCircle}>
            <Ionicons name="paw" size={22} color={theme.secondary} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={[styles.petButtonTitle, { color: theme.text }]}>My Pet</Text>
            <Text style={[styles.petButtonSubtitle, { color: theme.textSecondary }]}>View your companion</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.border} />
        </TouchableOpacity>

        {/* Notifications Button */}
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconCircle, { backgroundColor: 'rgba(0, 212, 255, 0.12)' }]}>
            <Ionicons name="notifications" size={22} color={theme.primary} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={[styles.petButtonTitle, { color: theme.text }]}>Notifications</Text>
            <Text style={[styles.petButtonSubtitle, { color: theme.textSecondary }]}>View your alerts</Text>
          </View>
          {unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={theme.border} />
        </TouchableOpacity>

        {/* Clan Button */}
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Clan')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconCircle, { backgroundColor: 'rgba(255, 184, 0, 0.12)' }]}>
            <Ionicons name="shield" size={22} color={theme.warning} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={[styles.petButtonTitle, { color: theme.text }]}>My Clan</Text>
            <Text style={[styles.petButtonSubtitle, { color: theme.textSecondary }]}>View your clan</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.border} />
        </TouchableOpacity>

        {/* Activity Feed Button */}
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Feed')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconCircle, { backgroundColor: 'rgba(0, 255, 136, 0.12)' }]}>
            <Ionicons name="newspaper" size={22} color={theme.accent} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={[styles.petButtonTitle, { color: theme.text }]}>Activity Feed</Text>
            <Text style={[styles.petButtonSubtitle, { color: theme.textSecondary }]}>See what's happening nearby</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.border} />
        </TouchableOpacity>

        {/* Leaderboard Button */}
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Leaderboard')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconCircle, { backgroundColor: 'rgba(255, 71, 87, 0.12)' }]}>
            <Ionicons name="trophy" size={22} color={theme.danger} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={[styles.petButtonTitle, { color: theme.text }]}>Leaderboard</Text>
            <Text style={[styles.petButtonSubtitle, { color: theme.textSecondary }]}>Top MapRaiders rankings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.border} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 1,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  userCard: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginHorizontal: 20,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.surface,
  },
  username: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  levelBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  levelText: {
    color: THEME.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  xpBarContainer: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  titlesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
  },
  titleText: {
    color: THEME.warning,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  moreText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    alignSelf: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  statValue: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  streakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 20,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  streakValue: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  streakLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  streakRight: {
    alignItems: 'center',
  },
  bestStreakValue: {
    color: THEME.warning,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  bestStreakLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  sectionCard: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 20,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sectionTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
    gap: 6,
  },
  classDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  classLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  classBarOuter: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  classBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  classPct: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
  petButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  petIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123, 97, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  petButtonContent: {
    flex: 1,
  },
  petButtonTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  petButtonSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  navIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  badge: {
    backgroundColor: THEME.danger,
    borderRadius: RADIUS.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  badgeText: {
    color: THEME.text,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
});

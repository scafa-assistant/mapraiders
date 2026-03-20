import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { CLASS_COLORS, CLASS_LABELS } from '../../utils/constants';
import { formatArea, formatNumber, formatXP } from '../../utils/formatters';
import { notificationApi } from '../../services/api';
import StatBar from '../../components/StatBar';
import ClassBadge from '../../components/ClassBadge';
import type { ProfileScreenProps, MovementClass } from '../../navigation/types';

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, refreshProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    refreshProfile();
    // Fetch unread notification count
    notificationApi.get().then(({ data }) => {
      const items = data.data ?? data ?? [];
      const unread = Array.isArray(items) ? items.filter((n: { read: boolean }) => !n.read).length : 0;
      setUnreadNotifications(unread);
    }).catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dominantClass = Object.entries(user.classBreakdown).reduce(
    (max, [cls, count]) => (count > max[1] ? [cls, count] : max),
    ['unknown', 0] as [string, number]
  )[0] as MovementClass;

  const totalClassSteps = Object.values(user.classBreakdown).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
      >
        {/* Header with settings */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={22} color={THEME.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color={THEME.primary} />
          </View>
          <Text style={styles.username}>{user.username}</Text>

          {/* Level + XP */}
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {user.level}</Text>
            </View>
            <ClassBadge movementClass={dominantClass} size="sm" />
          </View>

          <View style={styles.xpBarContainer}>
            <StatBar
              current={user.xp}
              max={user.xpToNextLevel}
              color={THEME.primary}
              height={8}
              showPercentage={false}
              showValues
            />
          </View>

          {/* Titles */}
          {user.titles.length > 0 && (
            <View style={styles.titlesRow}>
              {user.titles.slice(0, 3).map((title) => (
                <View key={title} style={styles.titleBadge}>
                  <Ionicons name="ribbon-outline" size={12} color={THEME.warning} />
                  <Text style={styles.titleText}>{title}</Text>
                </View>
              ))}
              {user.titles.length > 3 && (
                <Text style={styles.moreText}>+{user.titles.length - 3}</Text>
              )}
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="map-outline" size={20} color={THEME.primary} />
            <Text style={styles.statValue}>{formatNumber(user.totalClaims)}</Text>
            <Text style={styles.statLabel}>Claims</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="resize-outline" size={20} color={THEME.accent} />
            <Text style={styles.statValue}>{formatArea(user.totalArea)}</Text>
            <Text style={styles.statLabel}>Area</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="flag-outline" size={20} color={THEME.secondary} />
            <Text style={styles.statValue}>{formatNumber(user.questsCompleted)}</Text>
            <Text style={styles.statLabel}>Quests</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="star-outline" size={20} color={THEME.warning} />
            <Text style={styles.statValue}>{formatXP(user.xp)}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        {/* Streak */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <Ionicons name="flame" size={28} color="#FF6B35" />
            <View>
              <Text style={styles.streakValue}>{user.currentStreak} Days</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.bestStreakValue}>{user.longestStreak}</Text>
            <Text style={styles.bestStreakLabel}>Best</Text>
          </View>
        </View>

        {/* Class Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Movement Classes</Text>
          {Object.entries(user.classBreakdown)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([cls, count]) => {
              const pct = totalClassSteps > 0 ? (count / totalClassSteps) * 100 : 0;
              return (
                <View key={cls} style={styles.classRow}>
                  <View style={styles.classInfo}>
                    <View
                      style={[
                        styles.classDot,
                        { backgroundColor: CLASS_COLORS[cls as MovementClass] || THEME.textSecondary },
                      ]}
                    />
                    <Text style={styles.classLabel}>
                      {CLASS_LABELS[cls as MovementClass] || cls}
                    </Text>
                  </View>
                  <View style={styles.classBarOuter}>
                    <View
                      style={[
                        styles.classBarInner,
                        {
                          width: `${pct}%`,
                          backgroundColor: CLASS_COLORS[cls as MovementClass] || THEME.textSecondary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.classPct}>{pct.toFixed(0)}%</Text>
                </View>
              );
            })}
        </View>

        {/* Pet Button */}
        <TouchableOpacity
          style={styles.petButton}
          onPress={() => navigation.navigate('Pet')}
          activeOpacity={0.7}
        >
          <View style={styles.petIconCircle}>
            <Ionicons name="paw" size={22} color={THEME.secondary} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={styles.petButtonTitle}>My Pet</Text>
            <Text style={styles.petButtonSubtitle}>View your companion</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#2A3450" />
        </TouchableOpacity>

        {/* Notifications Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconCircle, { backgroundColor: 'rgba(0, 212, 255, 0.12)' }]}>
            <Ionicons name="notifications" size={22} color={THEME.primary} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={styles.petButtonTitle}>Notifications</Text>
            <Text style={styles.petButtonSubtitle}>View your alerts</Text>
          </View>
          {unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#2A3450" />
        </TouchableOpacity>

        {/* Clan Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Clan')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconCircle, { backgroundColor: 'rgba(255, 184, 0, 0.12)' }]}>
            <Ionicons name="shield" size={22} color={THEME.warning} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={styles.petButtonTitle}>My Clan</Text>
            <Text style={styles.petButtonSubtitle}>View your clan</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#2A3450" />
        </TouchableOpacity>

        {/* Activity Feed Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Feed')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconCircle, { backgroundColor: 'rgba(0, 255, 136, 0.12)' }]}>
            <Ionicons name="newspaper" size={22} color={THEME.accent} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={styles.petButtonTitle}>Activity Feed</Text>
            <Text style={styles.petButtonSubtitle}>See what's happening nearby</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#2A3450" />
        </TouchableOpacity>

        {/* Leaderboard Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Leaderboard')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconCircle, { backgroundColor: 'rgba(255, 71, 87, 0.12)' }]}>
            <Ionicons name="trophy" size={22} color={THEME.danger} />
          </View>
          <View style={styles.petButtonContent}>
            <Text style={styles.petButtonTitle}>Leaderboard</Text>
            <Text style={styles.petButtonSubtitle}>Top MapRaiders rankings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#2A3450" />
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
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
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

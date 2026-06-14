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
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { notificationApi } from '../../services/api';
import { formatRelativeTime } from '../../utils/formatters';
import { strings as S } from '../../i18n';
import type { NotificationsScreenProps } from '../../navigation/types';
import type { NotificationData } from '../../utils/types';

const getNotificationIcons = (
  theme: Theme
): Record<NotificationData['type'], { name: keyof typeof Ionicons.glyphMap; color: string }> => ({
  territory_contested: { name: 'shield', color: theme.danger },
  quest_completed: { name: 'flag', color: theme.accent },
  level_up: { name: 'star', color: theme.warning },
  challenge_nearby: { name: 'flash', color: theme.secondary },
  echo_liked: { name: 'heart', color: '#FF6B8A' },
  general: { name: 'notifications', color: theme.primary },
});

export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const notificationIcons = useMemo(() => getNotificationIcons(theme), [theme]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationApi.get();
      const raw = data?.data?.notifications ?? data?.data ?? data ?? [];
      setNotifications(Array.isArray(raw) ? raw : []);
    } catch {
      // Silently fail - user sees empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await notificationApi.markRead(unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Silently fail
    }
  }, [notifications]);

  const handlePressNotification = useCallback(
    async (item: NotificationData) => {
      if (!item.read) {
        try {
          await notificationApi.markRead([item.id]);
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
          );
        } catch {
          // Silently fail
        }
      }
    },
    []
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: NotificationData }) => {
    const iconConfig = notificationIcons[item.type] ?? notificationIcons.general;

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.notificationUnread]}
        onPress={() => handlePressNotification(item)}
        activeOpacity={0.7}
      >
        {/* Unread indicator */}
        {!item.read && <View style={styles.unreadDot} />}

        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: `${iconConfig.color}15` }]}>
          <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.notificationTime}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} />
        <Text style={styles.emptyTitle}>{S.profile.notifications.emptyTitle}</Text>
        <Text style={styles.emptySubtext}>
          {S.profile.notifications.emptySubtext}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.profile.notifications.title}</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={handleMarkAllRead}
          >
            <Ionicons name="checkmark-done" size={20} color={theme.primary} />
            <Text style={styles.markReadText}>{S.profile.notifications.readAll}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{S.profile.notifications.loadingNotifications}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 1,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 88, 240, 0.12)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  markReadText: {
    color: theme.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  notificationUnread: {
    borderColor: 'rgba(21, 88, 240, 0.2)',
  },
  unreadDot: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: theme.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  notificationBody: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
  },
});

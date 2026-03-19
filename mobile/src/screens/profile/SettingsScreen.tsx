import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { SettingsScreenProps } from '../../navigation/types';

interface SettingsState {
  pushNotifications: boolean;
  territoryAlerts: boolean;
  questNearby: boolean;
  quietHoursEnabled: boolean;
  highAccuracyGps: boolean;
  backgroundTracking: boolean;
  hapticFeedback: boolean;
  darkMap: boolean;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { logout } = useAuthStore();
  const [settings, setSettings] = useState<SettingsState>({
    pushNotifications: true,
    territoryAlerts: true,
    questNearby: true,
    quietHoursEnabled: false,
    highAccuracyGps: true,
    backgroundTracking: true,
    hapticFeedback: true,
    darkMap: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = async (key: keyof SettingsState, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsSaving(true);
    try {
      await userApi.updateSettings({ [key]: value });
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const renderToggle = (
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    key: keyof SettingsState,
    subtitle?: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIconCircle}>
        <Ionicons name={icon} size={18} color={THEME.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={settings[key]}
        onValueChange={(val) => updateSetting(key, val)}
        trackColor={{ false: '#2A3450', true: 'rgba(0, 212, 255, 0.4)' }}
        thumbColor={settings[key] ? THEME.primary : '#555E78'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.sectionCard}>
          {renderToggle('Push Notifications', 'notifications-outline', 'pushNotifications')}
          {renderToggle('Territory Alerts', 'shield-outline', 'territoryAlerts', 'When someone contests your territory')}
          {renderToggle('Nearby Quests', 'compass-outline', 'questNearby', 'Alert when a new quest appears nearby')}
          {renderToggle('Quiet Hours', 'moon-outline', 'quietHoursEnabled', 'No notifications 22:00 - 08:00')}
        </View>

        {/* GPS Section */}
        <Text style={styles.sectionHeader}>GPS & Tracking</Text>
        <View style={styles.sectionCard}>
          {renderToggle('High Accuracy GPS', 'locate-outline', 'highAccuracyGps', 'Uses more battery but better tracking')}
          {renderToggle('Background Tracking', 'navigate-outline', 'backgroundTracking', 'Track routes when app is minimized')}
        </View>

        {/* Display Section */}
        <Text style={styles.sectionHeader}>Display</Text>
        <View style={styles.sectionCard}>
          {renderToggle('Haptic Feedback', 'phone-portrait-outline', 'hapticFeedback')}
          {renderToggle('Dark Map Style', 'contrast-outline', 'darkMap')}
        </View>

        {/* Account Section */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingIconCircle}>
              <Ionicons name="mail-outline" size={18} color={THEME.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Change Email</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#2A3450" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingIconCircle}>
              <Ionicons name="lock-closed-outline" size={18} color={THEME.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#2A3450" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={THEME.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Gridwalker v1.0.0</Text>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: THEME.text,
  },
  sectionHeader: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  sectionCard: {
    backgroundColor: THEME.surface,
    marginHorizontal: 20,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  settingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  settingSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    marginHorizontal: 20,
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.2)',
  },
  logoutText: {
    color: THEME.danger,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  versionText: {
    color: '#2A3450',
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});

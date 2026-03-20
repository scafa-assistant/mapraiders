import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
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
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingHomeZone, setIsSettingHomeZone] = useState(false);
  const [homeZoneSet, setHomeZoneSet] = useState(false);

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

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await userApi.exportData();
      Alert.alert(
        'Data Export Requested',
        'Your data export has been started. You will receive an email with a download link once it is ready.'
      );
    } catch {
      Alert.alert('Export Failed', 'Unable to export your data. Please try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data, territories, routes, and progress will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async (input) => {
                    if (input !== 'DELETE') {
                      Alert.alert('Cancelled', 'You must type DELETE to confirm.');
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await userApi.deleteAccount();
                      logout();
                    } catch {
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ],
              'plain-text',
              '',
            );
          },
        },
      ]
    );
  };

  const handleSetHomeZone = async () => {
    setIsSettingHomeZone(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to set your home zone.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await userApi.setHomeZone(location.coords.latitude, location.coords.longitude);
      setHomeZoneSet(true);
      Alert.alert(
        'Home Zone Set',
        'Your claims within 200m of this location will be hidden from the public map.'
      );
    } catch {
      Alert.alert('Error', 'Failed to set home zone. Please try again.');
    } finally {
      setIsSettingHomeZone(false);
    }
  };

  const handleRemoveHomeZone = async () => {
    Alert.alert(
      'Remove Home Zone',
      'Your territories near this location will become visible on the public map.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.removeHomeZone();
              setHomeZoneSet(false);
              Alert.alert('Home Zone Removed', 'Your territories are now fully visible.');
            } catch {
              Alert.alert('Error', 'Failed to remove home zone.');
            }
          },
        },
      ]
    );
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

        {/* Privacy Section */}
        <Text style={styles.sectionHeader}>Privacy</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={homeZoneSet ? handleRemoveHomeZone : handleSetHomeZone}
            disabled={isSettingHomeZone}
          >
            <View style={styles.settingIconCircle}>
              <Ionicons name="home-outline" size={18} color={THEME.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>
                {homeZoneSet ? 'Remove Home Zone' : 'Set Home Zone'}
              </Text>
              <Text style={styles.settingSubtitle}>
                {homeZoneSet
                  ? 'Your claims near home are hidden from the public map'
                  : 'Hide claims within 200m of your home from the public map'}
              </Text>
            </View>
            {isSettingHomeZone ? (
              <ActivityIndicator size="small" color={THEME.primary} />
            ) : (
              <Ionicons
                name={homeZoneSet ? 'close-circle-outline' : 'chevron-forward'}
                size={18}
                color={homeZoneSet ? THEME.danger : '#2A3450'}
              />
            )}
          </TouchableOpacity>
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

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={handleExportData}
            disabled={isExporting}
          >
            <View style={styles.settingIconCircle}>
              <Ionicons name="download-outline" size={18} color={THEME.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Export My Data</Text>
              <Text style={styles.settingSubtitle}>Download all your personal data</Text>
            </View>
            {isExporting ? (
              <ActivityIndicator size="small" color={THEME.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#2A3450" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            <View style={[styles.settingIconCircle, { backgroundColor: 'rgba(255, 71, 87, 0.08)' }]}>
              <Ionicons name="trash-outline" size={18} color={THEME.danger} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: THEME.danger }]}>Delete Account</Text>
              <Text style={styles.settingSubtitle}>Permanently delete your account and data</Text>
            </View>
            {isDeleting ? (
              <ActivityIndicator size="small" color={THEME.danger} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#2A3450" />
            )}
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

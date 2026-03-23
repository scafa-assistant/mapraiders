import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { userApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { SettingsScreenProps } from '../../navigation/types';

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { logout, user } = useAuthStore();
  const { settings, updateSetting } = useSettingsStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingHomeZone, setIsSettingHomeZone] = useState(false);
  const [homeZoneSet, setHomeZoneSet] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await userApi.exportData();
      Alert.alert('Data Exported', 'Your data has been exported successfully.');
    } catch {
      Alert.alert('Export Failed', 'Unable to export your data. Please try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This is PERMANENT. All territories, routes, and progress will be deleted forever.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await userApi.deleteAccount();
              logout();
            } catch {
              Alert.alert('Error', 'Failed to delete account.');
            } finally {
              setIsDeleting(false);
            }
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
      Alert.alert('Home Zone Set', 'Your claims within 200m of this location will be hidden from the public map.');
    } catch {
      Alert.alert('Error', 'Failed to set home zone.');
    } finally {
      setIsSettingHomeZone(false);
    }
  };

  const handleRemoveHomeZone = async () => {
    Alert.alert('Remove Home Zone', 'Your territories near home will become visible again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.removeHomeZone();
            setHomeZoneSet(false);
            Alert.alert('Home Zone Removed');
          } catch {
            Alert.alert('Error', 'Failed to remove home zone.');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const renderRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    subtitle: string,
    onPress: () => void,
    color: string = THEME.primary,
    loading: boolean = false,
    rightIcon: keyof typeof Ionicons.glyphMap = 'chevron-forward'
  ) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={loading} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={rightIcon} size={16} color="#2A3450" />
      )}
    </TouchableOpacity>
  );

  const renderToggleRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    subtitle: string,
    value: boolean,
    onToggle: (val: boolean) => void,
    color: string = THEME.primary
  ) => (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#1A2340', true: `${color}60` }}
        thumbColor={value ? color : '#555E78'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Info */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 212, 255, 0.15)' }]}>
              <Ionicons name="person" size={18} color={THEME.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{user?.username || 'User'}</Text>
              <Text style={styles.rowSubtitle}>{user?.email || ''}</Text>
            </View>
          </View>
        </View>

        {/* Display */}
        <Text style={styles.sectionHeader}>Display</Text>
        <View style={styles.card}>
          {renderToggleRow(
            'moon-outline',
            'Dark Map Style',
            'Use dark theme for the map background',
            settings.darkMapStyle,
            (val) => updateSetting('darkMapStyle', val),
            THEME.secondary
          )}
          {renderToggleRow(
            'phone-portrait-outline',
            'Haptic Feedback',
            'Vibrate on claims, actions, and buttons',
            settings.hapticFeedback,
            (val) => updateSetting('hapticFeedback', val),
            THEME.primary
          )}
        </View>

        {/* Notifications */}
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.card}>
          {renderToggleRow(
            'notifications-outline',
            'Push Notifications',
            'Receive push notifications',
            settings.pushNotifications,
            (val) => updateSetting('pushNotifications', val),
            THEME.accent
          )}
          {renderToggleRow(
            'shield-outline',
            'Territory Alerts',
            'Alert when someone contests your territory',
            settings.territoryAlerts,
            (val) => updateSetting('territoryAlerts', val),
            THEME.warning
          )}
          {renderToggleRow(
            'compass-outline',
            'Nearby Quests',
            'Alert when a new quest appears nearby',
            settings.questNearby,
            (val) => updateSetting('questNearby', val),
            THEME.primary
          )}
          {renderToggleRow(
            'time-outline',
            'Quiet Hours',
            'No notifications 22:00 - 08:00',
            settings.quietHours,
            (val) => updateSetting('quietHours', val),
            '#8892B0'
          )}
        </View>

        {/* Privacy */}
        <Text style={styles.sectionHeader}>Privacy</Text>
        <View style={styles.card}>
          {renderRow(
            'home-outline',
            homeZoneSet ? 'Remove Home Zone' : 'Set Home Zone',
            homeZoneSet
              ? 'Claims near home are hidden from the map'
              : 'Hide your claims within 200m of home',
            homeZoneSet ? handleRemoveHomeZone : handleSetHomeZone,
            THEME.primary,
            isSettingHomeZone
          )}
        </View>

        {/* Data */}
        <Text style={styles.sectionHeader}>Your Data</Text>
        <View style={styles.card}>
          {renderRow(
            'download-outline',
            'Export My Data',
            'Download all your personal data (GDPR)',
            handleExportData,
            THEME.accent,
            isExporting
          )}
          {renderRow(
            'trash-outline',
            'Delete Account',
            'Permanently delete your account and all data',
            handleDeleteAccount,
            THEME.danger,
            isDeleting
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={THEME.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MapRaiders v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: THEME.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: THEME.border,
  },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: THEME.text },
  sectionHeader: {
    color: THEME.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 20, marginTop: SPACING.xl, marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: THEME.surface, marginHorizontal: 20,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: THEME.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: THEME.border,
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  rowContent: { flex: 1 },
  rowLabel: { color: THEME.text, fontSize: FONT_SIZE.md, fontWeight: '600' },
  rowSubtitle: { color: THEME.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)', marginHorizontal: 20,
    marginTop: SPACING.xl, padding: SPACING.lg, borderRadius: RADIUS.lg,
    gap: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255, 71, 87, 0.2)',
  },
  logoutText: { color: THEME.danger, fontSize: FONT_SIZE.md, fontWeight: '700' },
  version: { color: '#2A3450', fontSize: FONT_SIZE.xs, textAlign: 'center', marginTop: SPACING.xl },
});

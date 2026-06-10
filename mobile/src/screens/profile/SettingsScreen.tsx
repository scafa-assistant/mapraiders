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
  Vibration,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { userApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';
import { strings as S, t } from '../../i18n';
import type { SettingsScreenProps } from '../../navigation/types';

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { logout, user } = useAuthStore();
  const { settings, updateSetting } = useSettingsStore();
  const theme = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingHomeZone, setIsSettingHomeZone] = useState(false);
  const [homeZoneSet, setHomeZoneSet] = useState(false);
  const [territoryColor, setTerritoryColor] = useState('#00D4FF');
  const [editUsername, setEditUsername] = useState(user?.username || '');

  // Load territory color from server
  React.useEffect(() => {
    (async () => {
      try {
        const { userApi: uApi } = await import('../../services/api');
        const { data } = await uApi.getMe();
        const userData = data?.data ?? data;
        if (userData?.territory_color) setTerritoryColor(userData.territory_color);
      } catch {}
    })();
  }, []);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await userApi.exportData();
      Alert.alert(S.profile.settings.dataExportedTitle, S.profile.settings.dataExportedMessage);
    } catch {
      Alert.alert(S.profile.settings.exportFailedTitle, S.profile.settings.exportFailedMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      S.profile.settings.deleteAccount,
      S.profile.settings.deleteAccountConfirmMessage,
      [
        { text: S.common.cancel, style: 'cancel' },
        {
          text: S.profile.settings.deleteAccount,
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await userApi.deleteAccount();
              logout();
            } catch {
              Alert.alert(S.common.error, S.profile.settings.deleteAccountFailed);
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
        Alert.alert(S.profile.settings.permissionDeniedTitle, S.profile.settings.homeZonePermission);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await userApi.setHomeZone(location.coords.latitude, location.coords.longitude);
      setHomeZoneSet(true);
      Alert.alert(S.profile.settings.homeZoneSetTitle, S.profile.settings.homeZoneSetMessage);
    } catch {
      Alert.alert(S.common.error, S.profile.settings.homeZoneSetFailed);
    } finally {
      setIsSettingHomeZone(false);
    }
  };

  const handleRemoveHomeZone = async () => {
    Alert.alert(S.profile.settings.removeHomeZone, S.profile.settings.removeHomeZoneConfirm, [
      { text: S.common.cancel, style: 'cancel' },
      {
        text: S.common.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.removeHomeZone();
            setHomeZoneSet(false);
            Alert.alert(S.profile.settings.homeZoneRemoved);
          } catch {
            Alert.alert(S.common.error, S.profile.settings.homeZoneRemoveFailed);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(S.profile.settings.logout, S.profile.settings.logoutConfirm, [
      { text: S.common.cancel, style: 'cancel' },
      { text: S.profile.settings.logout, style: 'destructive', onPress: () => logout() },
    ]);
  };

  const renderRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    subtitle: string,
    onPress: () => void,
    color: string = theme.primary,
    loading: boolean = false,
    rightIcon: keyof typeof Ionicons.glyphMap = 'chevron-forward'
  ) => (
    <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]} onPress={onPress} disabled={loading} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={rightIcon} size={16} color={theme.border} />
      )}
    </TouchableOpacity>
  );

  const renderToggleRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    subtitle: string,
    value: boolean,
    onToggle: (val: boolean) => void,
    color: string = theme.primary
  ) => (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: settings.darkMapStyle ? '#1A2340' : '#D0D0D0', true: `${color}60` }}
        thumbColor={value ? color : settings.darkMapStyle ? '#555E78' : '#AAAAAA'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{S.profile.settings.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Info + Username Change */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{S.profile.settings.account}</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 212, 255, 0.15)' }]}>
              <Ionicons name="mail" size={18} color={theme.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>{user?.email || ''}</Text>
              <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{S.profile.settings.emailNotChangeable}</Text>
            </View>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 255, 136, 0.15)' }]}>
              <Ionicons name="person" size={18} color="#00FF88" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowSubtitle, { color: theme.textSecondary, marginBottom: 6 }]}>{S.profile.settings.usernameLabel}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: theme.bg,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: theme.text,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  maxLength={30}
                  placeholder={S.profile.settings.usernamePlaceholder}
                  placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: editUsername !== (user?.username || '') ? '#00FF88' : theme.border,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                  }}
                  disabled={!editUsername || editUsername === (user?.username || '')}
                  onPress={async () => {
                    const newName = editUsername.trim();
                    if (!newName || newName === user?.username) return;
                    // Client-side validation with clear messages
                    if (newName.length < 3) {
                      Alert.alert(S.profile.settings.usernameTooShortTitle, S.profile.settings.usernameTooShort);
                      return;
                    }
                    if (newName.length > 30) {
                      Alert.alert(S.profile.settings.usernameTooLongTitle, S.profile.settings.usernameTooLong);
                      return;
                    }
                    if (/\s/.test(newName)) {
                      Alert.alert(S.profile.settings.usernameNoSpacesTitle, S.profile.settings.usernameNoSpaces);
                      return;
                    }
                    if (!/^[a-zA-Z0-9_.\-äöüÄÖÜß]+$/.test(newName)) {
                      Alert.alert(S.profile.settings.usernameInvalidCharsTitle, S.profile.settings.usernameInvalidChars);
                      return;
                    }
                    try {
                      const { userApi: uApi } = await import('../../services/api');
                      await uApi.changeUsername(newName);
                      Alert.alert(S.common.done, t(S.profile.settings.usernameChanged, { username: newName }));
                    } catch (err: any) {
                      const serverMsg = err?.response?.data?.message;
                      Alert.alert(S.common.error, serverMsg || S.profile.settings.usernameChangeFailed);
                    }
                  }}
                >
                  <Text style={{ color: editUsername !== (user?.username || '') ? '#0A0E17' : theme.textSecondary, fontWeight: '700', fontSize: 13 }}>
                    {S.common.save}
                  </Text>
                </TouchableOpacity>
                <Ionicons name="pencil" size={16} color={theme.textSecondary} />
              </View>
            </View>
          </View>
        </View>

        {/* Display */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{S.profile.settings.display}</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {renderToggleRow(
            'moon-outline',
            S.profile.settings.darkMode,
            S.profile.settings.darkModeSubtitle,
            settings.darkMapStyle,
            (val) => updateSetting('darkMapStyle', val),
            theme.secondary
          )}
          {renderToggleRow(
            'phone-portrait-outline',
            S.profile.settings.hapticFeedback,
            S.profile.settings.hapticFeedbackSubtitle,
            settings.hapticFeedback,
            (val) => updateSetting('hapticFeedback', val),
            theme.primary
          )}
          {settings.hapticFeedback && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${theme.primary}15`,
                borderRadius: 12,
                paddingVertical: 12,
                marginTop: 8,
                gap: 8,
              }}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Vibration.vibrate(200);
              }}
            >
              <Ionicons name="pulse" size={18} color={theme.primary} />
              <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>
                {S.profile.settings.testHaptics}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Territory Color */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{S.profile.settings.territoryColor}</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 16 }]}>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 12 }}>
            {S.profile.settings.territoryColorHint}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {['#00D4FF', '#7B61FF', '#00FF88', '#FFB800', '#FF4757', '#FF69B4', '#FF6B35', '#00BFFF',
              '#E040FB', '#76FF03', '#FFEA00', '#FF1744', '#00E5FF', '#D500F9', '#1DE9B6', '#F50057',
            ].map((c) => (
              <TouchableOpacity
                key={c}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: c,
                  borderWidth: territoryColor === c ? 3 : 1,
                  borderColor: territoryColor === c ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                }}
                onPress={async () => {
                  setTerritoryColor(c);
                  try {
                    const { userApi: uApi } = await import('../../services/api');
                    await uApi.changeTerritoryColor(c);
                  } catch {}
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8 }}>
            <View style={{ width: 50, height: 30, borderRadius: 6, backgroundColor: territoryColor, opacity: 0.4 }} />
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{S.profile.settings.preview}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{territoryColor}</Text>
          </View>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{S.profile.settings.notifications}</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {renderToggleRow(
            'notifications-outline',
            S.profile.settings.pushNotifications,
            S.profile.settings.pushNotificationsSubtitle,
            settings.pushNotifications,
            (val) => updateSetting('pushNotifications', val),
            theme.accent
          )}
          {renderToggleRow(
            'shield-outline',
            S.profile.settings.territoryAlerts,
            S.profile.settings.territoryAlertsSubtitle,
            settings.territoryAlerts,
            (val) => updateSetting('territoryAlerts', val),
            theme.warning
          )}
          {renderToggleRow(
            'compass-outline',
            S.profile.settings.nearbyQuests,
            S.profile.settings.nearbyQuestsSubtitle,
            settings.questNearby,
            (val) => updateSetting('questNearby', val),
            theme.primary
          )}
          {renderToggleRow(
            'time-outline',
            S.profile.settings.quietHours,
            S.profile.settings.quietHoursSubtitle,
            settings.quietHours,
            (val) => updateSetting('quietHours', val),
            '#8892B0'
          )}
        </View>

        {/* Privacy */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{S.profile.settings.privacy}</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {renderRow(
            'home-outline',
            homeZoneSet ? S.profile.settings.removeHomeZone : S.profile.settings.setHomeZone,
            homeZoneSet
              ? S.profile.settings.homeZoneActiveSubtitle
              : S.profile.settings.homeZoneInactiveSubtitle,
            homeZoneSet ? handleRemoveHomeZone : handleSetHomeZone,
            theme.primary,
            isSettingHomeZone
          )}
        </View>

        {/* Data */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{S.profile.settings.yourData}</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {renderRow(
            'download-outline',
            S.profile.settings.exportData,
            S.profile.settings.exportDataSubtitle,
            handleExportData,
            theme.accent,
            isExporting
          )}
          {renderRow(
            'trash-outline',
            S.profile.settings.deleteAccount,
            S.profile.settings.deleteAccountSubtitle,
            handleDeleteAccount,
            theme.danger,
            isDeleting
          )}
        </View>

        {/* Legal */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{S.profile.settings.legal}</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {renderRow(
            'document-text-outline',
            S.profile.settings.terms,
            S.profile.settings.termsSubtitle,
            () => Linking.openURL('https://mapraiders.com/agb.html'),
            theme.accent
          )}
          {renderRow(
            'shield-checkmark-outline',
            S.profile.settings.privacyPolicy,
            S.profile.settings.privacyPolicySubtitle,
            () => Linking.openURL('https://mapraiders.com/datenschutz.html'),
            theme.accent
          )}
          {renderRow(
            'information-circle-outline',
            S.profile.settings.imprint,
            S.profile.settings.imprintSubtitle,
            () => Linking.openURL('https://mapraiders.com/impressum.html'),
            theme.accent
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={theme.danger} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>{S.profile.settings.logout}</Text>
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

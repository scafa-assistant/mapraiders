import './src/polyfills';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './src/store/authStore';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import { offlineQueue } from './src/services/offlineQueue';
import { mapRaidersWs } from './src/services/websocket';
import { setupWsEventHandlers } from './src/services/wsEventHandler';
import {
  registerForPushNotifications,
  setupNotificationHandler,
  setNotificationNavigationCallback,
} from './src/services/notifications';
import { userApi } from './src/services/api';
import { useSettingsStore } from './src/store/settingsStore';
import { initLocale, onLanguageChange } from './src/i18n';

const ONBOARDING_KEY = '@mapraiders_onboarding_complete';

// Navigation ref so tapped push-notifications can deep-link into the app.
export const navigationRef = createNavigationContainerRef();

function AppContent() {
  const { token, isLoading, refreshProfile, restoreSession } = useAuthStore();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [restoringSession, setRestoringSession] = useState(true);

  // Check onboarding status on mount
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => setOnboardingComplete(value === 'true'))
      .catch(() => setOnboardingComplete(false));
  }, []);

  // Restore persisted session on app start
  useEffect(() => {
    restoreSession().finally(() => setRestoringSession(false));
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingComplete(true);
  };

  const networkCleanupRef = useRef<(() => void) | null>(null);

  // Settings are loaded by AppShell before this component mounts.

  // Initialize offline queue and network listener on mount
  useEffect(() => {
    offlineQueue.init().then(() => {
      // After loading persisted queue, set up auto-sync on reconnect
      networkCleanupRef.current = offlineQueue.setupNetworkListener();
    });

    return () => {
      // Cleanup network listener on unmount
      if (networkCleanupRef.current) {
        networkCleanupRef.current();
        networkCleanupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token]);

  // Connect/disconnect WebSocket based on auth state
  useEffect(() => {
    if (token) {
      mapRaidersWs.connect();
      const cleanupHandlers = setupWsEventHandlers();
      return () => {
        cleanupHandlers();
        mapRaidersWs.disconnect();
      };
    } else {
      mapRaidersWs.disconnect();
    }
  }, [token]);

  // Wire tapped/received push-notifications to navigation (deep-link router).
  // Without this the notification listeners are never installed, so tapping a
  // push does nothing.
  useEffect(() => {
    setNotificationNavigationCallback((screen, params) => {
      if (navigationRef.isReady()) {
        // Screen names (TerritoryDetail/QuestDetail/MapMain/ProfileMain) are
        // unique across the nav tree, so navigate-by-name resolves them.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigationRef.navigate as any)(screen, params);
      }
    });
    const cleanup = setupNotificationHandler();
    return cleanup;
  }, []);

  // Re-register push token on app foreground resume (tokens can change)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && token) {
        registerForPushNotifications().then((pushToken) => {
          if (pushToken) userApi.updatePushToken(pushToken).catch(() => {});
        });
      }
    });
    return () => subscription.remove();
  }, [token]);

  if (isLoading || restoringSession || onboardingComplete === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#F6F4F1' }]}>
        <ActivityIndicator size="large" color="#1558F0" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return token ? <MainNavigator /> : <AuthNavigator />;
}

function AppShell() {
  const { settings, loaded: settingsLoaded } = useSettingsStore();
  const isDark = settings.darkMapStyle;

  // Locale must be resolved before the first render; settings before the
  // first themed frame (avoids a dark flash for light-mode users).
  const [localeReady, setLocaleReady] = useState(false);
  // Language change swaps the strings container in place; the key remount
  // re-renders every screen so module trees pick up the new language.
  const [langVersion, setLangVersion] = useState(0);

  useEffect(() => {
    initLocale().finally(() => setLocaleReady(true));
    useSettingsStore.getState().loadSettings();
    return onLanguageChange(() => setLangVersion((v) => v + 1));
  }, []);

  // Brand nav theme — white/blue regardless of the map's dark-tile toggle.
  const navTheme = useMemo(() => ({
    dark: false,
    colors: {
      primary: '#1558F0',
      background: '#F6F4F1',
      card: '#FFFFFF',
      text: '#141210',
      border: '#C0BAB4',
      notification: '#D7263D',
    },
  }), []);

  if (!localeReady || !settingsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#F6F4F1' }]}>
        <ActivityIndicator size="large" color="#1558F0" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} key={langVersion} theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppContent />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import './src/polyfills';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
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
import { registerForPushNotifications } from './src/services/notifications';
import { userApi } from './src/services/api';
import { useSettingsStore } from './src/store/settingsStore';

const ONBOARDING_KEY = '@mapraiders_onboarding_complete';

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

  // Load persisted settings from AsyncStorage on mount
  useEffect(() => {
    useSettingsStore.getState().loadSettings();
  }, []);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return token ? <MainNavigator /> : <AuthNavigator />;
}

function AppShell() {
  const { settings } = useSettingsStore();
  const isDark = settings.darkMapStyle;

  const navTheme = useMemo(() => ({
    dark: isDark,
    colors: {
      primary: isDark ? '#00D4FF' : '#0099CC',
      background: isDark ? '#0A0E17' : '#F5F5F5',
      card: isDark ? '#0D1220' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#1A1A1A',
      border: isDark ? '#1A2340' : '#E0E0E0',
      notification: '#FF4757',
    },
  }), [isDark]);

  return (
    <NavigationContainer theme={navTheme}>
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

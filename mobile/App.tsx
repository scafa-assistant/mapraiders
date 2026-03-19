import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from './src/store/authStore';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { offlineQueue } from './src/services/offlineQueue';

const DARK_THEME = {
  dark: true,
  colors: {
    primary: '#00D4FF',
    background: '#0A0E17',
    card: '#0D1220',
    text: '#FFFFFF',
    border: '#1A2340',
    notification: '#FF4757',
  },
};

function AppContent() {
  const { token, isLoading, refreshProfile } = useAuthStore();
  const networkCleanupRef = useRef<(() => void) | null>(null);

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  return token ? <MainNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DARK_THEME}>
        <StatusBar style="light" />
        <AppContent />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E17',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

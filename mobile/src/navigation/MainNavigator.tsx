import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { MainTabParamList } from './types';
import MapStack from './MapStack';
import QuestStack from './QuestStack';
import CreateStack from './CreateStack';
import TravelStack from './TravelStack';
import ProfileStack from './ProfileStack';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../store/settingsStore';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Map: 'map',
  Quests: 'compass',
  Create: 'add-circle',
  Travel: 'trail-sign',
  Profile: 'person',
};

export default function MainNavigator() {
  const theme = useTheme();
  const { settings } = useSettingsStore();
  const isDark = settings.darkMapStyle;

  const tabBarStyle = useMemo(() => ({
    backgroundColor: isDark ? '#0D1220' : '#FFFFFF',
    borderTopColor: isDark ? '#1A2340' : '#E0E0E0',
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
  }), [isDark]);

  const createButtonStyle = useMemo(() => ({
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: isDark ? '#141B2D' : '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: -20,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  }), [isDark, theme.primary]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = TAB_ICONS[route.name] || 'ellipse';
          if (route.name === 'Create') {
            return (
              <View style={createButtonStyle}>
                <Ionicons name={iconName} size={32} color={theme.primary} />
              </View>
            );
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen
        name="Map"
        component={MapStack}
        options={{ freezeOnBlur: false }}
      />
      <Tab.Screen name="Quests" component={QuestStack} />
      <Tab.Screen
        name="Create"
        component={CreateStack}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen name="Travel" component={TravelStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
});

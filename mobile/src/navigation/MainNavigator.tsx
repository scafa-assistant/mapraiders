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
import { strings as S } from '../i18n';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Travel is not finished — hidden for the v1.0 store release.
const SHOW_TRAVEL_TAB = false;

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Map: 'map',
  Quests: 'compass',
  Create: 'add-circle',
  Travel: 'trail-sign',
  Profile: 'person',
};

export default function MainNavigator() {
  const theme = useTheme();

  const tabBarStyle = useMemo(() => ({
    backgroundColor: '#0D1220',
    borderTopColor: '#1A2340',
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  }), []);

  const createButtonStyle = useMemo(() => ({
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#141B2D',
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
  }), [theme.primary]);

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
        options={{ freezeOnBlur: false, tabBarLabel: S.nav.tabs.map }}
      />
      <Tab.Screen
        name="Quests"
        component={QuestStack}
        options={{ tabBarLabel: S.nav.tabs.quests }}
      />
      <Tab.Screen
        name="Create"
        component={CreateStack}
        options={{ tabBarLabel: '' }}
      />
      {SHOW_TRAVEL_TAB && (
        <Tab.Screen
          name="Travel"
          component={TravelStack}
          options={{ tabBarLabel: S.nav.tabs.travel }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: S.nav.tabs.profile }}
      />
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

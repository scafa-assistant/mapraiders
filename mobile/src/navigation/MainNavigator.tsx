import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { MainTabParamList } from './types';
import MapStack from './MapStack';
import QuestStack from './QuestStack';
import CreateStack from './CreateStack';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Map: 'map',
  Quests: 'compass',
  Create: 'add-circle',
  Leaderboard: 'trophy',
  Profile: 'person',
};

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = TAB_ICONS[route.name] || 'ellipse';
          if (route.name === 'Create') {
            return (
              <View style={styles.createButton}>
                <Ionicons name={iconName} size={32} color="#00D4FF" />
              </View>
            );
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00D4FF',
        tabBarInactiveTintColor: '#8892B0',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen name="Map" component={MapStack} />
      <Tab.Screen name="Quests" component={QuestStack} />
      <Tab.Screen
        name="Create"
        component={CreateStack}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
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
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#141B2D',
    borderWidth: 2,
    borderColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});

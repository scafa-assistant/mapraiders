import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import PetScreen from '../screens/profile/PetScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import ClanScreen from '../screens/profile/ClanScreen';
import CreateClanScreen from '../screens/profile/CreateClanScreen';
import ClanChatScreen from '../screens/profile/ClanChatScreen';
import FeedScreen from '../screens/profile/FeedScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import FriendsScreen from '../screens/social/FriendsScreen';
import FriendRequestsScreen from '../screens/social/FriendRequestsScreen';
import PlayerSearchScreen from '../screens/social/PlayerSearchScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F6F4F1' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Pet" component={PetScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Clan" component={ClanScreen} />
      <Stack.Screen name="CreateClan" component={CreateClanScreen} />
      <Stack.Screen name="ClanChat" component={ClanChatScreen} />
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
      <Stack.Screen name="PlayerSearch" component={PlayerSearchScreen} />
    </Stack.Navigator>
  );
}

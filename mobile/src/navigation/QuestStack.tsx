import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QuestStackParamList } from './types';
import QuestListScreen from '../screens/quests/QuestListScreen';
import QuestDetailScreen from '../screens/quests/QuestDetailScreen';
import QuestPlayScreen from '../screens/quests/QuestPlayScreen';

const Stack = createNativeStackNavigator<QuestStackParamList>();

export default function QuestStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F6F4F1' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="QuestList" component={QuestListScreen} />
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
      <Stack.Screen
        name="QuestPlay"
        component={QuestPlayScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

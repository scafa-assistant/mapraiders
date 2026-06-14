import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommanderStackParamList } from './types';
import CommanderMapScreen from '../screens/commander/CommanderMapScreen';
import BattleReplayScreen from '../screens/commander/BattleReplayScreen';
import DicePouchScreen from '../screens/commander/DicePouchScreen';

const Stack = createNativeStackNavigator<CommanderStackParamList>();

export default function CommanderStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F6F4F1' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="CommanderMap" component={CommanderMapScreen} />
      <Stack.Screen
        name="BattleReplay"
        component={BattleReplayScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="DicePouch"
        component={DicePouchScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

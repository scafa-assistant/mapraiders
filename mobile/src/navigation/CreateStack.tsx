import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateStackParamList } from './types';
import CreateMenuScreen from '../screens/create/CreateMenuScreen';
import QuestCreateScreen from '../screens/create/QuestCreateScreen';
import EchoCreateScreen from '../screens/create/EchoCreateScreen';
import ChallengeCreateScreen from '../screens/create/ChallengeCreateScreen';
import TravelRouteCreateScreen from '../screens/travel/TravelRouteCreateScreen';

const Stack = createNativeStackNavigator<CreateStackParamList>();

export default function CreateStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0E17' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="CreateMenu" component={CreateMenuScreen} />
      <Stack.Screen name="QuestCreate" component={QuestCreateScreen} />
      <Stack.Screen name="EchoCreate" component={EchoCreateScreen} />
      <Stack.Screen name="ChallengeCreate" component={ChallengeCreateScreen} />
      <Stack.Screen name="TravelRouteCreate" component={TravelRouteCreateScreen} />
    </Stack.Navigator>
  );
}

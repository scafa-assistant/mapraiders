import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TravelStackParamList } from './types';
import TravelRouteListScreen from '../screens/travel/TravelRouteListScreen';
import TravelRouteDetailScreen from '../screens/travel/TravelRouteDetailScreen';
import TravelRoutePlayScreen from '../screens/travel/TravelRoutePlayScreen';

const Stack = createNativeStackNavigator<TravelStackParamList>();

export default function TravelStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0E17' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="TravelRouteList" component={TravelRouteListScreen} />
      <Stack.Screen name="TravelRouteDetail" component={TravelRouteDetailScreen} />
      <Stack.Screen
        name="TravelRoutePlay"
        component={TravelRoutePlayScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

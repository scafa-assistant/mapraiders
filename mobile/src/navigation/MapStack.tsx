import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapStackParamList } from './types';
import MapScreen from '../screens/map/MapScreen';
import TerritoryDetailScreen from '../screens/map/TerritoryDetailScreen';

const Stack = createNativeStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0E17' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MapMain" component={MapScreen} />
      <Stack.Screen
        name="TerritoryDetail"
        component={TerritoryDetailScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

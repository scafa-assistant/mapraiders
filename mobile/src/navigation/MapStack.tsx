import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapStackParamList } from './types';
import MapScreen from '../screens/map/MapScreen';
import TerritoryDetailScreen from '../screens/map/TerritoryDetailScreen';
import ChallengeListScreen from '../screens/map/ChallengeListScreen';
import ChallengeDetailScreen from '../screens/map/ChallengeDetailScreen';
import EchoListScreen from '../screens/map/EchoListScreen';
import EchoDetailScreen from '../screens/map/EchoDetailScreen';
import ArtifactDetailScreen from '../screens/map/ArtifactDetailScreen';
import PlaceHistoryScreen from '../screens/map/PlaceHistoryScreen';

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
      <Stack.Screen name="ChallengeList" component={ChallengeListScreen} />
      <Stack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="EchoList" component={EchoListScreen} />
      <Stack.Screen
        name="EchoDetail"
        component={EchoDetailScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="ArtifactDetail"
        component={ArtifactDetailScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="PlaceHistory"
        component={PlaceHistoryScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

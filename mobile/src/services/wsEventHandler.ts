import { gridwalkerWs } from './websocket';
import { Alert, Vibration } from 'react-native';
import { useTerritoryStore } from '../store/territoryStore';

export function setupWsEventHandlers(): () => void {
  const unsubs: (() => void)[] = [];

  // Territory attacked - vibrate + alert
  unsubs.push(gridwalkerWs.on('territory_attacked', (data) => {
    Vibration.vibrate(500);
    Alert.alert('Territory Under Attack!', `${data.attacker} is contesting your territory!`);
  }));

  // Territory claimed nearby - refresh my territories
  unsubs.push(gridwalkerWs.on('territory_claimed', (_data) => {
    useTerritoryStore.getState().fetchMyTerritories();
  }));

  // Level up
  unsubs.push(gridwalkerWs.on('level_up', (data) => {
    Alert.alert('Level Up!', `You reached level ${data.level}!`);
  }));

  // Notification
  unsubs.push(gridwalkerWs.on('notification', (data) => {
    console.log('[WS] Notification:', data.title);
  }));

  return () => unsubs.forEach(fn => fn());
}

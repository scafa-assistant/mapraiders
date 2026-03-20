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

  // Resonance discovered - cross-content synergy bonus
  unsubs.push(gridwalkerWs.on('resonance_discovered', (data) => {
    Vibration.vibrate(300);
    const typesStr = data.types?.join(' + ') || 'multiple content';
    Alert.alert(
      'Resonance!',
      `${typesStr} at this spot = ${data.bonus}x bonus!`
    );
  }));

  // Quest growth - seed quest leveled up
  unsubs.push(gridwalkerWs.on('quest_growth', (data) => {
    Alert.alert(
      'Quest Grew!',
      `Your seed quest reached ${data.growth_name} level!`
    );
  }));

  // Duel challenge received - show Accept/Decline dialog
  unsubs.push(gridwalkerWs.on('duel_challenge', (data) => {
    Vibration.vibrate(500);
    const typeLabel = (data.type || 'speed_claim').replace(/_/g, ' ');
    Alert.alert(
      'Duel Challenge!',
      `${data.challenger_name} challenges you to a ${typeLabel} duel!`,
      [
        {
          text: 'Decline',
          style: 'cancel',
          onPress: () => {
            import('./api').then(({ duelApi }) => {
              duelApi.decline(data.duel_id).catch(console.error);
            });
          },
        },
        {
          text: 'Accept',
          onPress: () => {
            import('./api').then(({ duelApi }) => {
              duelApi.accept(data.duel_id).catch(console.error);
            });
          },
        },
      ]
    );
  }));

  // Duel accepted - notify challenger
  unsubs.push(gridwalkerWs.on('duel_accepted', (data) => {
    Alert.alert('Duel Accepted!', `Your ${(data.type || '').replace(/_/g, ' ')} duel has started!`);
  }));

  // Duel declined - notify challenger
  unsubs.push(gridwalkerWs.on('duel_declined', (_data) => {
    Alert.alert('Duel Declined', 'Your opponent declined the duel.');
  }));

  // Duel result - show winner
  unsubs.push(gridwalkerWs.on('duel_result', (data) => {
    Vibration.vibrate(300);
    if (data.is_draw) {
      Alert.alert('Duel Draw!', `The duel ended in a tie! (${data.challenger_score} - ${data.defender_score})`);
    } else {
      Alert.alert(
        'Duel Complete!',
        `${data.winner_name} wins! (${data.challenger_score} - ${data.defender_score})\nXP: Winner +${data.xp_winner}, Loser +${data.xp_loser}`
      );
    }
  }));

  // Race record - someone set a new track record
  unsubs.push(gridwalkerWs.on('race_record', (data) => {
    Alert.alert(
      'New Race Record!',
      `${data.username} set a new record on "${data.track_name}" (${data.time_seconds}s)!`
    );
  }));

  // Event started - Eclipse, Blitz, King of the Hill, etc.
  unsubs.push(gridwalkerWs.on('event_started', (data) => {
    Vibration.vibrate(400);
    const messages: Record<string, string> = {
      eclipse: 'Eclipse has begun! All territories weakened. Double XP for 6 hours!',
      blitz: 'Blitz Claims active nearby! 10x XP for 10 minutes!',
      king_of_hill: 'King of the Hill started! Claim the most territory to win!',
      wave_attack: `Wave Attack! Your clan is assaulting ${data.target_district || 'a district'}!`,
      mystery_zone: 'You discovered a Mystery Zone! Hidden rewards await...',
    };
    const msg = messages[data.type] || `Event "${data.name}" has started!`;
    Alert.alert('Game Event!', msg);
  }));

  // Loot spawned nearby - show pickup prompt
  unsubs.push(gridwalkerWs.on('loot_spawned', (data) => {
    Vibration.vibrate(200);
    Alert.alert('Loot Drop!', `A ${data.type || 'loot'} drop appeared nearby!`);
  }));

  // Event ended - show results
  unsubs.push(gridwalkerWs.on('event_ended', (data) => {
    const resultMsg = data.winner_id
      ? `Winner declared! Event "${data.name || data.type}" is over.`
      : `Event "${data.name || data.type}" has ended.`;
    Alert.alert('Event Over', resultMsg);
  }));

  return () => unsubs.forEach(fn => fn());
}

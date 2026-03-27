import { mapRaidersWs } from './websocket';
import { Alert, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTerritoryStore } from '../store/territoryStore';
import { useSettingsStore } from '../store/settingsStore';

/** Vibrate only if haptic feedback is enabled in settings */
function hapticVibrate(pattern?: number | number[]) {
  if (!useSettingsStore.getState().settings.hapticFeedback) return;
  if (pattern) {
    Vibration.vibrate(pattern);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function setupWsEventHandlers(): () => void {
  const unsubs: (() => void)[] = [];

  // Territory attacked - vibrate + alert
  unsubs.push(mapRaidersWs.on('territory_attacked', (data) => {
    if (!data) return;
    hapticVibrate(500);
    Alert.alert('Territorium angegriffen!', `${data.attacker || 'Ein Spieler'} greift dein Territorium an!`);
  }));

  // Territory claimed nearby - refresh my territories
  unsubs.push(mapRaidersWs.on('territory_claimed', (_data) => {
    useTerritoryStore.getState().fetchMyTerritories();
  }));

  // Level up
  unsubs.push(mapRaidersWs.on('level_up', (data) => {
    if (!data) return;
    Alert.alert('Level Up!', `Du hast Level ${data.level || '?'} erreicht!`);
  }));

  // Notification
  unsubs.push(mapRaidersWs.on('notification', (data) => {
    if (!data) return;
    console.log('[WS] Notification:', data.title || 'unknown');
  }));

  // Resonance discovered - cross-content synergy bonus
  unsubs.push(mapRaidersWs.on('resonance_discovered', (data) => {
    hapticVibrate(300);
    const typesStr = data.types?.join(' + ') || 'multiple content';
    Alert.alert(
      'Resonance!',
      `${typesStr} at this spot = ${data.bonus}x bonus!`
    );
  }));

  // Quest growth - seed quest leveled up
  unsubs.push(mapRaidersWs.on('quest_growth', (data) => {
    Alert.alert(
      'Quest Grew!',
      `Your seed quest reached ${data.growth_name} level!`
    );
  }));

  // Duel challenge received - show Accept/Decline dialog
  unsubs.push(mapRaidersWs.on('duel_challenge', (data) => {
    hapticVibrate(500);
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
  unsubs.push(mapRaidersWs.on('duel_accepted', (data) => {
    Alert.alert('Duel Accepted!', `Your ${(data.type || '').replace(/_/g, ' ')} duel has started!`);
  }));

  // Duel declined - notify challenger
  unsubs.push(mapRaidersWs.on('duel_declined', (_data) => {
    Alert.alert('Duel Declined', 'Your opponent declined the duel.');
  }));

  // Duel result - show winner
  unsubs.push(mapRaidersWs.on('duel_result', (data) => {
    hapticVibrate(300);
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
  unsubs.push(mapRaidersWs.on('race_record', (data) => {
    Alert.alert(
      'New Race Record!',
      `${data.username} set a new record on "${data.track_name}" (${data.time_seconds}s)!`
    );
  }));

  // Event started - Eclipse, Blitz, King of the Hill, etc.
  unsubs.push(mapRaidersWs.on('event_started', (data) => {
    hapticVibrate(400);
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
  unsubs.push(mapRaidersWs.on('loot_spawned', (data) => {
    hapticVibrate(200);
    Alert.alert('Loot Drop!', `A ${data.type || 'loot'} drop appeared nearby!`);
  }));

  // Event ended - show results
  unsubs.push(mapRaidersWs.on('event_ended', (data) => {
    const resultMsg = data.winner_id
      ? `Winner declared! Event "${data.name || data.type}" is over.`
      : `Event "${data.name || data.type}" has ended.`;
    Alert.alert('Event Over', resultMsg);
  }));

  // ─── Turn-Based Game Events ─────────────────────────────────────────

  // Game started - defender gets notified
  unsubs.push(mapRaidersWs.on('game_started', (data) => {
    hapticVibrate([0, 200, 100, 200]);
    const gameLabel = data.game_type === 'tic_tac_toe' ? 'Tic Tac Toe' : 'Mini-Schach';
    Alert.alert(
      `${gameLabel} Herausforderung!`,
      data.your_turn
        ? 'Ein Angreifer fordert dein Territorium! Du bist am Zug.'
        : 'Spiel gestartet! Warte auf den Gegner.',
    );
  }));

  // Game turn - it's your move
  unsubs.push(mapRaidersWs.on('game_turn', (data) => {
    hapticVibrate(300);
    const gameLabel = data.game_type === 'tic_tac_toe' ? 'Tic Tac Toe' : 'Mini-Schach';
    Alert.alert(`${gameLabel}`, 'Du bist am Zug!');
  }));

  // Game ended - result
  unsubs.push(mapRaidersWs.on('game_ended', (data) => {
    hapticVibrate(500);
    const resultText = data.result === 'won'
      ? 'Du hast gewonnen!'
      : data.result === 'draw'
      ? 'Unentschieden!'
      : 'Du hast verloren!';
    Alert.alert('Spiel beendet', `${resultText}\n${data.message || ''}`);
    // Refresh territories
    useTerritoryStore.getState().fetchMyTerritories();
  }));

  // Defense lost via instant game
  unsubs.push(mapRaidersWs.on('defense_lost', (_data) => {
    hapticVibrate([0, 300, 100, 300]);
    Alert.alert('Territorium verloren!', 'Ein Angreifer hat deine Verteidigung durchbrochen!');
    useTerritoryStore.getState().fetchMyTerritories();
  }));

  // Defense held - your defense worked
  unsubs.push(mapRaidersWs.on('defense_held', (_data) => {
    Alert.alert('Verteidigung hält!', 'Ein Angreifer wurde abgewehrt.');
  }));

  return () => unsubs.forEach(fn => fn());
}

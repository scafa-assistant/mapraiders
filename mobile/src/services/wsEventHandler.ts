import { mapRaidersWs } from './websocket';
import { Alert, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTerritoryStore } from '../store/territoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { strings as S, t } from '../i18n';

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
    Alert.alert(
      S.system.ws.territoryAttackedTitle,
      t(S.system.ws.territoryAttackedMessage, { attacker: data.attacker || S.system.ws.unknownPlayer })
    );
  }));

  // Territory claimed nearby - refresh my territories
  unsubs.push(mapRaidersWs.on('territory_claimed', (_data) => {
    useTerritoryStore.getState().fetchMyTerritories();
  }));

  // Level up
  unsubs.push(mapRaidersWs.on('level_up', (data) => {
    if (!data) return;
    Alert.alert(S.system.ws.levelUpTitle, t(S.system.ws.levelUpMessage, { level: data.level || '?' }));
  }));

  // Notification
  unsubs.push(mapRaidersWs.on('notification', (data) => {
    if (!data) return;
    console.log('[WS] Notification:', data.title || 'unknown');
  }));

  // Resonance discovered - cross-content synergy bonus
  unsubs.push(mapRaidersWs.on('resonance_discovered', (data) => {
    hapticVibrate(300);
    const typesStr = data.types?.join(' + ') || S.system.ws.resonanceFallbackTypes;
    Alert.alert(
      S.system.ws.resonanceTitle,
      t(S.system.ws.resonanceMessage, { types: typesStr, bonus: data.bonus })
    );
  }));

  // Quest growth - seed quest leveled up
  unsubs.push(mapRaidersWs.on('quest_growth', (data) => {
    Alert.alert(
      S.system.ws.questGrowthTitle,
      t(S.system.ws.questGrowthMessage, { growth: data.growth_name })
    );
  }));

  // Duel challenge received - show Accept/Decline dialog
  unsubs.push(mapRaidersWs.on('duel_challenge', (data) => {
    hapticVibrate(500);
    const typeLabel = (data.type || 'speed_claim').replace(/_/g, ' ');
    Alert.alert(
      S.system.ws.duelChallengeTitle,
      t(S.system.ws.duelChallengeMessage, { challenger: data.challenger_name, type: typeLabel }),
      [
        {
          text: S.system.ws.duelDecline,
          style: 'cancel',
          onPress: () => {
            import('./api').then(({ duelApi }) => {
              duelApi.decline(data.duel_id).catch(console.error);
            });
          },
        },
        {
          text: S.system.ws.duelAccept,
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
    Alert.alert(
      S.system.ws.duelAcceptedTitle,
      t(S.system.ws.duelAcceptedMessage, { type: (data.type || '').replace(/_/g, ' ') })
    );
  }));

  // Duel declined - notify challenger
  unsubs.push(mapRaidersWs.on('duel_declined', (_data) => {
    Alert.alert(S.system.ws.duelDeclinedTitle, S.system.ws.duelDeclinedMessage);
  }));

  // Duel result - show winner
  unsubs.push(mapRaidersWs.on('duel_result', (data) => {
    hapticVibrate(300);
    if (data.is_draw) {
      Alert.alert(
        S.system.ws.duelDrawTitle,
        t(S.system.ws.duelDrawMessage, { challengerScore: data.challenger_score, defenderScore: data.defender_score })
      );
    } else {
      Alert.alert(
        S.system.ws.duelCompleteTitle,
        t(S.system.ws.duelCompleteMessage, {
          winner: data.winner_name,
          challengerScore: data.challenger_score,
          defenderScore: data.defender_score,
          xpWinner: data.xp_winner,
          xpLoser: data.xp_loser,
        })
      );
    }
  }));

  // Race record - someone set a new track record
  unsubs.push(mapRaidersWs.on('race_record', (data) => {
    Alert.alert(
      S.system.ws.raceRecordTitle,
      t(S.system.ws.raceRecordMessage, { username: data.username, track: data.track_name, time: data.time_seconds })
    );
  }));

  // Event started - Eclipse, Blitz, King of the Hill, etc.
  unsubs.push(mapRaidersWs.on('event_started', (data) => {
    hapticVibrate(400);
    const messages: Record<string, string> = {
      eclipse: S.system.ws.eventEclipse,
      blitz: S.system.ws.eventBlitz,
      king_of_hill: S.system.ws.eventKingOfHill,
      wave_attack: t(S.system.ws.eventWaveAttack, {
        district: data.target_district || S.system.ws.eventWaveAttackFallbackDistrict,
      }),
      mystery_zone: S.system.ws.eventMysteryZone,
    };
    const msg = messages[data.type] || t(S.system.ws.eventGenericStarted, { name: data.name });
    Alert.alert(S.system.ws.eventTitle, msg);
  }));

  // Loot spawned nearby - show pickup prompt
  unsubs.push(mapRaidersWs.on('loot_spawned', (data) => {
    hapticVibrate(200);
    Alert.alert(
      S.system.ws.lootTitle,
      t(S.system.ws.lootMessage, { type: data.type || S.system.ws.lootFallbackType })
    );
  }));

  // Event ended - show results
  unsubs.push(mapRaidersWs.on('event_ended', (data) => {
    const resultMsg = data.winner_id
      ? t(S.system.ws.eventEndedWinnerMessage, { name: data.name || data.type })
      : t(S.system.ws.eventEndedMessage, { name: data.name || data.type });
    Alert.alert(S.system.ws.eventOverTitle, resultMsg);
  }));

  // ─── Turn-Based Game Events ─────────────────────────────────────────

  // Game started - defender gets notified
  unsubs.push(mapRaidersWs.on('game_started', (data) => {
    hapticVibrate([0, 200, 100, 200]);
    const gameLabel = data.game_type === 'tic_tac_toe' ? S.system.ws.gameTicTacToe : S.system.ws.gameMiniChess;
    Alert.alert(
      t(S.system.ws.gameChallengeTitle, { game: gameLabel }),
      data.your_turn
        ? S.system.ws.gameStartedYourTurn
        : S.system.ws.gameStartedWaiting,
    );
  }));

  // Game turn - it's your move
  unsubs.push(mapRaidersWs.on('game_turn', (data) => {
    hapticVibrate(300);
    const gameLabel = data.game_type === 'tic_tac_toe' ? S.system.ws.gameTicTacToe : S.system.ws.gameMiniChess;
    Alert.alert(`${gameLabel}`, S.system.ws.gameYourTurn);
  }));

  // Game ended - result
  unsubs.push(mapRaidersWs.on('game_ended', (data) => {
    hapticVibrate(500);
    const resultText = data.result === 'won'
      ? S.system.ws.gameWon
      : data.result === 'draw'
      ? S.system.ws.gameDraw
      : S.system.ws.gameLost;
    Alert.alert(S.system.ws.gameEndedTitle, `${resultText}\n${data.message || ''}`);
    // Refresh territories
    useTerritoryStore.getState().fetchMyTerritories();
  }));

  // Defense lost via instant game
  unsubs.push(mapRaidersWs.on('defense_lost', (_data) => {
    hapticVibrate([0, 300, 100, 300]);
    Alert.alert(S.system.ws.territoryLostTitle, S.system.ws.territoryLostMessage);
    useTerritoryStore.getState().fetchMyTerritories();
  }));

  // Defense held - your defense worked
  unsubs.push(mapRaidersWs.on('defense_held', (_data) => {
    Alert.alert(S.system.ws.defenseHeldTitle, S.system.ws.defenseHeldMessage);
  }));

  // Phase F.3 — spy_detected: own covert radar spotted an enemy column
  unsubs.push(mapRaidersWs.on('spy_detected', (data) => {
    if (!data) return;
    hapticVibrate([0, 200, 80, 200]);
    const loaded = data.carrying ? S.system.ws.spyDetectedLoaded : '';
    Alert.alert(
      S.system.ws.spyDetectedTitle,
      t(S.system.ws.spyDetectedMessage, { purpose: data.purpose || 'unknown', loaded })
    );
  }));

  return () => unsubs.forEach(fn => fn());
}

import { components as en } from '../en/components';

export const components: typeof en = {
  challengeCard: {
    verificationHonor: 'Ehrenwort',
    verificationVideo: 'Video',
    verificationSensor: 'Sensor',
    verificationUnknown: 'Unbekannt',
    completionsDone: '{count} abgeschlossen',
    by: 'von {username}',
  },
  claimResult: {
    title: 'Territorium erobert!',
    xpEarned: '+{xp} XP',
    breakdown: 'Aufschlüsselung',
    baseArea: 'Basisfläche',
    classBonus: 'Klassen-Bonus',
    weatherBonus: 'Wetter-Bonus',
    streakBonus: 'Serien-Bonus',
    contestedBonus: 'Umkämpft-Bonus',
    viewTerritory: 'Territorium ansehen',
  },
  classBadge: {
    unknown: 'Unbekannt',
  },
  leaderboardRow: {
    youSuffix: ' (Du)',
  },
  petCard: {
    specExplorer: 'Entdecker',
    specTracker: 'Spurensucher',
    specGuardian: 'Beschützer',
    specNone: 'Keine Spezialisierung',
    level: 'Lv.{level}',
    distance: 'Distanz',
    walks: 'Spaziergänge',
    rareFinds: 'Seltene Funde',
  },
  questCard: {
    weather: {
      rain: 'Regen',
      snow: 'Schnee',
      storm: 'Sturm',
      fog: 'Nebel',
      wind: 'Wind',
      cold: 'Kälte',
      heat: 'Hitze',
      clear: 'Klar',
    },
    stepsCount: '{count} Schritte',
    by: 'von {username}',
  },
  ratingForm: {
    titleDefault: 'Bewerte dieses Erlebnis',
    creativity: 'Kreativität',
    difficulty: 'Schwierigkeit',
    worthIt: 'Lohnt es sich?',
    commentLabel: 'Kommentar (optional)',
    commentPlaceholder: 'Teile deine Gedanken...',
    submitting: 'Wird gesendet...',
    submit: 'Bewertung senden',
  },
  routeRecorder: {
    recording: 'AUFNAHME',
    distance: 'Distanz',
    duration: 'Dauer',
  },
};

// First-run coachmark texts. One entry per feature id (see teachStore + the
// TEACH_META registry in components/fx/Coachmark.tsx). Shown once, then never
// again. No em-dashes (founder rule).
export const teach = {
  ui: {
    next: 'Weiter',
    gotIt: 'Verstanden',
    skip: 'Überspringen',
    step: 'Schritt',
  },
  karte: {
    kicker: 'Karte',
    steps: [
      {
        title: 'Das ist dein Spielbrett',
        body: 'Die echte Karte um dich herum. Geh raus, bewege dich, und das Land unter deinen Füßen wird zu deinem Revier. Blaue Flächen gehören dir.',
      },
      {
        title: 'Erobere dein erstes Gebiet',
        body: 'Tippe unten auf "Gebiet erobern", sobald du in einem freien Feld stehst.',
      },
      {
        title: 'Wechsle die Ebenen',
        body: 'Territorien, Aufklärung (Nebel des Krieges) oder Kampf. Erkunde, bevor du angreifst.',
      },
    ],
  },
  claim: {
    kicker: 'Erobert',
    steps: [
      {
        title: 'Gebiet gesichert',
        body: 'Du hast Land beansprucht. Ungepflegtes Land verfällt mit der Zeit, lauf regelmäßig deine Grenzen ab, um es zu halten.',
      },
    ],
  },
  imperium: {
    kicker: 'Imperium',
    steps: [
      {
        title: 'Dein Hauptquartier',
        body: 'Hier verwaltest du dein Reich aus der Vogelperspektive: Gebäude, Truppen und Ressourcen an einem Ort.',
      },
      {
        title: 'Bauen kostet Ressourcen',
        body: 'Jedes Gebäude verbraucht Energie, Tech oder Rohstoffe und bringt dir dafür neue Fähigkeiten oder Einkommen.',
      },
      {
        title: 'Truppen und Aufklärung',
        body: 'Stelle Einheiten auf, kläre den Nebel des Krieges auf und bereite deine Angriffe vor, bevor du losziehst.',
      },
    ],
  },
  build: {
    kicker: 'Bauen',
    steps: [
      {
        title: 'Wähle ein Gebäude',
        body: 'Jedes Gebäude hat eine Funktion: Ressourcen fördern, Truppen stärken oder dein Gebiet verteidigen. Tippe eines an, um es zu errichten.',
      },
    ],
  },
  battle: {
    kicker: 'Kampf',
    steps: [
      {
        title: 'Würfel entscheiden',
        body: 'Im Kampf rollen Würfel: blau für deinen Angriff, rot für die Verteidigung. Mehr Truppen heißt höhere Siegchance, aber nie garantiert.',
      },
    ],
  },
  recon: {
    kicker: 'Aufklärung',
    steps: [
      {
        title: 'Nebel des Krieges',
        body: 'Unerkundetes Land liegt im Dunkeln. Schick Späher los, um die Karte aufzudecken und gegnerische Gebiete zu sehen, bevor du angreifst.',
      },
    ],
  },
  quests: {
    kicker: 'Quests',
    steps: [
      {
        title: 'Aufträge unterwegs',
        body: 'Quests führen dich zu echten Orten und belohnen dich mit Ressourcen und Erfahrung. Nimm eine an und folge der Karte.',
      },
    ],
  },
  clan: {
    kicker: 'Clan',
    steps: [
      {
        title: 'Gemeinsam stärker',
        body: 'Schließ dich mit anderen Spielern zusammen. Clans teilen Gebiete, verteidigen sich gegenseitig und steigen zusammen in den Ranglisten.',
      },
    ],
  },
  streifzug: {
    kicker: 'Streifzug',
    steps: [
      {
        title: 'Begegnungen unterwegs',
        body: 'Während du gehst, tauchen spontane Begegnungen auf: Schätze, Söldner oder Patrouillen. Reagiere, oder lauf weiter. (Beta)',
      },
    ],
  },
  echo: {
    kicker: 'Echo',
    steps: [
      {
        title: 'Spuren hinterlassen',
        body: 'Echos sind Audio- und Text-Spuren, die du an echten Orten ablegst. Andere Spieler finden sie, wenn sie vorbeikommen.',
      },
    ],
  },
};

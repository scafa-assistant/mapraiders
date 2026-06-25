// First-run coachmark texts (English). Shape must match de/teach.ts.
export const teach = {
  ui: {
    next: 'Next',
    gotIt: 'Got it',
    skip: 'Skip',
    step: 'Step',
  },
  karte: {
    kicker: 'Map',
    steps: [
      {
        title: 'This is your board',
        body: 'The real map around you. Step outside, move, and the ground under your feet becomes your territory. Blue areas are yours.',
      },
      {
        title: 'Claim your first ground',
        body: 'Tap "Claim territory" below once you are standing in an open tile.',
      },
      {
        title: 'Switch the layers',
        body: 'Territories, recon (fog of war) or battle. Scout before you strike.',
      },
    ],
  },
  claim: {
    kicker: 'Claimed',
    steps: [
      {
        title: 'Ground secured',
        body: 'You have claimed land. Neglected land decays over time, so walk your borders regularly to hold it.',
      },
    ],
  },
  imperium: {
    kicker: 'Empire',
    steps: [
      {
        title: 'Your headquarters',
        body: 'Manage your realm from above here: buildings, troops and resources in one place.',
      },
      {
        title: 'Building costs resources',
        body: 'Every building spends energy, tech or raw resources and gives you new abilities or income in return.',
      },
      {
        title: 'Troops and recon',
        body: 'Deploy units, clear the fog of war, and prepare your attacks before you set out.',
      },
    ],
  },
  build: {
    kicker: 'Build',
    steps: [
      {
        title: 'Pick a building',
        body: 'Each building has a purpose: harvest resources, strengthen troops or defend your ground. Tap one to construct it.',
      },
    ],
  },
  battle: {
    kicker: 'Battle',
    steps: [
      {
        title: 'Dice decide',
        body: 'In battle the dice roll: blue for your attack, red for the defense. More troops means a higher chance to win, but never a guarantee.',
      },
    ],
  },
  recon: {
    kicker: 'Recon',
    steps: [
      {
        title: 'Fog of war',
        body: 'Unexplored land stays in the dark. Send scouts to reveal the map and see enemy ground before you attack.',
      },
    ],
  },
  quests: {
    kicker: 'Quests',
    steps: [
      {
        title: 'Missions on the move',
        body: 'Quests lead you to real places and reward you with resources and experience. Accept one and follow the map.',
      },
    ],
  },
  clan: {
    kicker: 'Clan',
    steps: [
      {
        title: 'Stronger together',
        body: 'Team up with other players. Clans share territory, defend each other and climb the leaderboards together.',
      },
    ],
  },
  streifzug: {
    kicker: 'Patrol',
    steps: [
      {
        title: 'Encounters on the move',
        body: 'As you walk, spontaneous encounters appear: treasures, mercenaries or patrols. React, or keep walking. (Beta)',
      },
    ],
  },
  echo: {
    kicker: 'Echo',
    steps: [
      {
        title: 'Leave a trace',
        body: 'Echos are audio and text traces you drop at real places. Other players find them when they pass by.',
      },
    ],
  },
};

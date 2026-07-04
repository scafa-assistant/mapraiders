import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// ─── Shared Types ──────────────────────────────────────────────────────────────

export type MovementClass =
  | 'walker'
  | 'runner'
  | 'cyclist'
  | 'skater'
  | 'dog_walker'
  | 'driver'
  | 'unknown';

export type QuestStepType =
  | 'FIND'
  | 'LISTEN'
  | 'CHALLENGE'
  | 'SOLVE'
  | 'COLLECT'
  | 'DOG';

export interface GpsPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: number;
  speed?: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalClaims: number;
  totalArea: number;
  questsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  titles: string[];
  classBreakdown: Record<MovementClass, number>;
  createdAt: string;
}

export interface Territory {
  id: string;
  ownerId: string;
  ownerUsername: string;
  polygon: GpsPoint[];
  claimedAt: string;
  decayPercent: number;
  movementClass: MovementClass;
  area: number;
  color: string;
  hasDefense?: boolean;
  defenseGameType?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorUsername: string;
  difficulty: number;
  rating: number;
  completions: number;
  movementClass: MovementClass;
  stepCount: number;
  estimatedDistance: number;
  location: { latitude: number; longitude: number };
  steps: QuestStep[];
}

export interface QuestStep {
  id: string;
  order: number;
  type: QuestStepType;
  instruction: string;
  location: { latitude: number; longitude: number };
  radius: number;
  hint?: string;
}

export interface QuestProgress {
  questId: string;
  quest: Quest;
  currentStepIndex: number;
  completedSteps: string[];
  startedAt: string;
}

export interface Echo {
  id: string;
  creatorId: string;
  creatorUsername: string;
  location: { latitude: number; longitude: number };
  lat?: number;
  lng?: number;
  radius: number;
  audioUrl: string;
  duration: number;
  createdAt: string;
}

export interface Challenge {
  id: string;
  creatorId: string;
  creatorUsername: string;
  template: string;
  parameters: Record<string, number>;
  location: { latitude: number; longitude: number };
  verificationLevel: 'honor' | 'video' | 'sensor';
  createdAt: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  specialization: 'explorer' | 'tracker' | 'guardian' | null;
  totalDistance: number;
  totalWalks: number;
  rareFinds: number;
  photo_url?: string;
}

// ─── Auth Navigator ────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// ─── Map Stack ─────────────────────────────────────────────────────────────────

export type MapStackParamList = {
  MapMain: undefined;
  TerritoryDetail: { territory: Territory };
  BaseBuilder: { territory: Territory };
  MapLibreProof: undefined;
  ChallengeList: undefined;
  ChallengeDetail: { challengeId: string };
  EchoList: undefined;
  EchoDetail: { echoId: string };
  ArtifactDetail: { artifactId: string };
  PlaceHistory: { lat: number; lng: number };
  DefenseSetup: { territoryId: string };
  DefenseChallenge: {
    defenseId: string;
    territoryId: string;
    gameType: string;
    config: any;
    ownerUsername: string;
  };
  MeetupDetail: { meetupId: string };
  MeetupChat: { eventId: string; eventName: string };
  TicTacToeGame: {
    gameId: string;
    territoryId: string;
    opponentUsername: string;
  };
  MiniChessGame: {
    gameId: string;
    territoryId: string;
    opponentUsername: string;
  };
  HackingScreen: {
    spawn: {
      id: string;
      npc_type: 'scout_disc' | 'tech_drone' | 'aether_leech' | 'water_strider_source' | 'forest_construct_source';
      level: 1 | 2 | 3;
      latitude: number;
      longitude: number;
      biome: string;
      expires_at: string;
    };
  };
  TerminalScreen: {
    spawn: {
      id: string;
      npc_type: 'terminal';
      level: 1 | 2 | 3;
      latitude: number;
      longitude: number;
      biome: string;
      expires_at: string;
    };
  };
};

export type MapScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MapStackParamList, 'MapMain'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type TerritoryDetailScreenProps = NativeStackScreenProps<
  MapStackParamList,
  'TerritoryDetail'
>;

export type BaseBuilderScreenProps = NativeStackScreenProps<
  MapStackParamList,
  'BaseBuilder'
>;
export type MapLibreProofScreenProps = NativeStackScreenProps<
  MapStackParamList,
  'MapLibreProof'
>;

export type ChallengeListScreenProps = NativeStackScreenProps<MapStackParamList, 'ChallengeList'>;
export type ChallengeDetailScreenProps = NativeStackScreenProps<MapStackParamList, 'ChallengeDetail'>;

export type EchoListScreenProps = NativeStackScreenProps<MapStackParamList, 'EchoList'>;
export type EchoDetailScreenProps = NativeStackScreenProps<MapStackParamList, 'EchoDetail'>;
export type ArtifactDetailScreenProps = NativeStackScreenProps<MapStackParamList, 'ArtifactDetail'>;
export type PlaceHistoryScreenProps = NativeStackScreenProps<MapStackParamList, 'PlaceHistory'>;
export type DefenseSetupScreenProps = NativeStackScreenProps<MapStackParamList, 'DefenseSetup'>;
export type DefenseChallengeScreenProps = NativeStackScreenProps<MapStackParamList, 'DefenseChallenge'>;
export type MeetupDetailScreenProps = NativeStackScreenProps<MapStackParamList, 'MeetupDetail'>;
export type MeetupChatScreenProps = NativeStackScreenProps<MapStackParamList, 'MeetupChat'>;
export type TicTacToeGameScreenProps = NativeStackScreenProps<MapStackParamList, 'TicTacToeGame'>;
export type MiniChessGameScreenProps = NativeStackScreenProps<MapStackParamList, 'MiniChessGame'>;
export type HackingScreenProps = NativeStackScreenProps<MapStackParamList, 'HackingScreen'>;
export type TerminalScreenProps = NativeStackScreenProps<MapStackParamList, 'TerminalScreen'>;

// ─── Quest Stack ───────────────────────────────────────────────────────────────

export type QuestStackParamList = {
  QuestList: undefined;
  QuestDetail: { questId: string };
  QuestPlay: { questId: string };
};

export type QuestListScreenProps = NativeStackScreenProps<QuestStackParamList, 'QuestList'>;
export type QuestDetailScreenProps = NativeStackScreenProps<QuestStackParamList, 'QuestDetail'>;
export type QuestPlayScreenProps = NativeStackScreenProps<QuestStackParamList, 'QuestPlay'>;

// ─── Create Stack ──────────────────────────────────────────────────────────────

export type CreateStackParamList = {
  CreateMenu: undefined;
  QuestCreate: undefined;
  EchoCreate: undefined;
  ChallengeCreate: undefined;
  TravelRouteCreate: undefined;
  MeetupCreate: undefined;
};

export type CreateMenuScreenProps = NativeStackScreenProps<CreateStackParamList, 'CreateMenu'>;
export type QuestCreateScreenProps = NativeStackScreenProps<CreateStackParamList, 'QuestCreate'>;
export type EchoCreateScreenProps = NativeStackScreenProps<CreateStackParamList, 'EchoCreate'>;
export type ChallengeCreateScreenProps = NativeStackScreenProps<
  CreateStackParamList,
  'ChallengeCreate'
>;
export type TravelRouteCreateScreenProps = NativeStackScreenProps<
  CreateStackParamList,
  'TravelRouteCreate'
>;
export type MeetupCreateScreenProps = NativeStackScreenProps<CreateStackParamList, 'MeetupCreate'>;

// ─── Profile Stack ─────────────────────────────────────────────────────────────

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Pet: undefined;
  Notifications: undefined;
  Clan: undefined;
  CreateClan: undefined;
  ClanChat: { clanId: string; clanName: string };
  Feed: undefined;
  Leaderboard: undefined;
  Friends: undefined;
  FriendRequests: undefined;
  PlayerSearch: undefined;
  PlayerProfile: { playerId: string };
};

export type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;
export type SettingsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;
export type PetScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Pet'>;
export type NotificationsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Notifications'>;
export type ClanScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Clan'>;
export type ClanChatScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ClanChat'>;
export type FeedScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Feed'>;
export type ProfileLeaderboardScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Leaderboard'>;
export type FriendsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Friends'>;
export type FriendRequestsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'FriendRequests'>;
export type PlayerSearchScreenProps = NativeStackScreenProps<ProfileStackParamList, 'PlayerSearch'>;
export type PlayerProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'PlayerProfile'>;

// ─── Travel Stack ─────────────────────────────────────────────────────────────

export type TravelStackParamList = {
  TravelRouteList: undefined;
  TravelRouteDetail: { routeId: string };
  TravelRoutePlay: { routeId: string };
};

export type TravelRouteListScreenProps = NativeStackScreenProps<
  TravelStackParamList,
  'TravelRouteList'
>;
export type TravelRouteDetailScreenProps = NativeStackScreenProps<
  TravelStackParamList,
  'TravelRouteDetail'
>;
export type TravelRoutePlayScreenProps = NativeStackScreenProps<
  TravelStackParamList,
  'TravelRoutePlay'
>;

// ─── Commander Stack ───────────────────────────────────────────────────────────

export type CommanderStackParamList = {
  CommanderMap: undefined;
  BattleReplay: { battleId: string };
  DicePouch: undefined;
};

export type CommanderMapScreenProps = CompositeScreenProps<
  NativeStackScreenProps<CommanderStackParamList, 'CommanderMap'>,
  BottomTabScreenProps<MainTabParamList>
>;
export type BattleReplayScreenProps = NativeStackScreenProps<
  CommanderStackParamList,
  'BattleReplay'
>;
export type DicePouchScreenProps = NativeStackScreenProps<CommanderStackParamList, 'DicePouch'>;

// ─── Main Tab Navigator ────────────────────────────────────────────────────────

export type MainTabParamList = {
  Map: NavigatorScreenParams<MapStackParamList>;
  Quests: NavigatorScreenParams<QuestStackParamList>;
  Create: NavigatorScreenParams<CreateStackParamList>;
  Travel: NavigatorScreenParams<TravelStackParamList>;
  Commander: NavigatorScreenParams<CommanderStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type LeaderboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Travel'>,
  NativeStackScreenProps<MapStackParamList>
>;

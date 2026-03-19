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
};

export type MapScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MapStackParamList, 'MapMain'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type TerritoryDetailScreenProps = NativeStackScreenProps<
  MapStackParamList,
  'TerritoryDetail'
>;

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
};

export type CreateMenuScreenProps = NativeStackScreenProps<CreateStackParamList, 'CreateMenu'>;
export type QuestCreateScreenProps = NativeStackScreenProps<CreateStackParamList, 'QuestCreate'>;
export type EchoCreateScreenProps = NativeStackScreenProps<CreateStackParamList, 'EchoCreate'>;
export type ChallengeCreateScreenProps = NativeStackScreenProps<
  CreateStackParamList,
  'ChallengeCreate'
>;

// ─── Profile Stack ─────────────────────────────────────────────────────────────

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Pet: undefined;
};

export type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;
export type SettingsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;
export type PetScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Pet'>;

// ─── Main Tab Navigator ────────────────────────────────────────────────────────

export type MainTabParamList = {
  Map: NavigatorScreenParams<MapStackParamList>;
  Quests: NavigatorScreenParams<QuestStackParamList>;
  Create: NavigatorScreenParams<CreateStackParamList>;
  Leaderboard: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type LeaderboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Leaderboard'>,
  NativeStackScreenProps<MapStackParamList>
>;

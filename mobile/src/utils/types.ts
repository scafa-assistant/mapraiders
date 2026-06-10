// ─── Shared Mobile Types ────────────────────────────────────────────────────
// Re-exports from navigation/types for convenience, plus additional mobile-only types.

export type {
  MovementClass,
  QuestStepType,
  GpsPoint,
  BoundingBox,
  UserProfile,
  Territory,
  Quest,
  QuestStep,
  QuestProgress,
  Echo,
  Challenge,
  Pet,
} from '../navigation/types';

// ─── Additional Mobile-only Types ───────────────────────────────────────────

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface ClaimCalculation {
  baseArea: number;
  classMultiplier: number;
  weatherMultiplier: number;
  streakMultiplier: number;
  contestedBonus: number;
  finalArea: number;
  xpAwarded: number;
}

export interface ClaimResult {
  territory?: {
    id: string;
    area: number;
    movementClass: string;
  };
  xp: number;
  calculation: ClaimCalculation;
}

export interface RouteUpload {
  points: import('../navigation/types').GpsPoint[];
  class?: import('../navigation/types').MovementClass;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  movementClass?: import('../navigation/types').MovementClass;
  avatarUrl?: string;
}

export interface WeatherData {
  condition: 'clear' | 'rain' | 'snow' | 'fog' | 'wind' | 'storm';
  temperature: number;
  description: string;
  icon: string;
}

export interface WeatherBonus {
  multiplier: number;
  label: string;
}

export interface NotificationData {
  id: string;
  type: 'territory_contested' | 'quest_completed' | 'challenge_nearby' | 'echo_liked' | 'level_up' | 'general';
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

// Shape matches GET /api/social/feed response items
export interface FeedItem {
  id: string;
  type: string;
  user: {
    id: string;
    username: string;
    level: number;
  };
  data?: Record<string, unknown>;
  created_at: string;
}

export interface Rating {
  creativity: number;
  difficulty: number;
  worthIt: number;
  comment?: string;
}

export interface TravelRoute {
  id: string;
  name: string;
  description: string;
  spots: TravelSpot[];
  creatorId: string;
  creatorUsername: string;
  distance: number;
  completions: number;
  rating: number;
}

export interface TravelSpot {
  id: string;
  name: string;
  description: string;
  location: { latitude: number; longitude: number };
  photoUrl?: string;
  order: number;
}

export interface Clan {
  id: string;
  name: string;
  tag: string;
  description: string;
  memberCount: number;
  totalArea: number;
  level: number;
}

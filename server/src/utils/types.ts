// ============================================================
// MapRaiders Type Definitions
// Every interface, type alias, and enum used across the server.
// ============================================================

// ---- Enums / Union Types --------------------------------------------

export type MovementClass =
  | 'walker'
  | 'dog_walker'
  | 'runner'
  | 'cyclist'
  | 'skater'
  | 'driver';

export type QuestStepType =
  | 'FIND'
  | 'LISTEN'
  | 'CHALLENGE'
  | 'SOLVE'
  | 'COLLECT'
  | 'DOG';

export type VerificationType =
  | 'photo'
  | 'proximity'
  | 'video'
  | 'text_input'
  | 'sensor'
  | 'dog_only';

export type ContentStatus = 'active' | 'decayed' | 'legendary';

export type TravelStatus =
  | 'draft'
  | 'recording'
  | 'verification'
  | 'published'
  | 'legendary';

export type ClanType = 'commute' | 'district' | 'dog_park' | 'route';

export type NotificationPriority = 'high' | 'medium' | 'low' | 'HIGH' | 'MEDIUM' | 'LOW';

export type LeaderboardType =
  | 'territory'
  | 'street_king'
  | 'questmaker'
  | 'echo_master'
  | 'explorer'
  | 'streak'
  | 'district'
  | 'pet';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

// ---- Backward-compatible types used by existing services ------------

export type WeatherCondition =
  | 'clear'
  | 'light_rain'
  | 'heavy_rain'
  | 'snow'
  | 'storm'
  | 'cold'
  | 'heat'
  | 'extreme_cold'
  | 'extreme_heat';

export type NotificationType =
  | 'territory_attack'
  | 'territory_lost'
  | 'new_quest_nearby'
  | 'streak_at_risk'
  | 'level_up'
  | 'new_title'
  | 'clan_formed'
  | 'quest_rated'
  | 'content_desert'
  | 'invite_bonus';

export type ReportTargetType = 'quest' | 'echo' | 'challenge' | 'user' | 'travel_route';

export type TitleKey =
  | 'first_claim'
  | 'claim_10'
  | 'claim_100'
  | 'quest_creator'
  | 'quest_master'
  | 'echo_dropper'
  | 'echo_legend'
  | 'streak_7'
  | 'streak_30'
  | 'streak_90'
  | 'streak_365'
  | 'explorer_100km'
  | 'explorer_1000km'
  | 'dog_whisperer'
  | 'night_owl'
  | 'early_bird'
  | 'storm_chaser'
  | 'clan_founder'
  | 'top_district'
  | 'level_10'
  | 'level_25'
  | 'level_50'
  | 'level_100'
  | 'street_beast'
  | 'iron_grip'
  | 'trail_dog'
  | 'urban_explorer'
  | 'echo_master'
  | 'questmaker'
  | 'night_runner'
  | 'storm_rider'
  | 'pioneer'
  | 'recruiter';

// ---- GPS Point ------------------------------------------------------

export interface GpsPoint {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: number;
  accuracy: number;
  speed: number;
  bearing: number;
  source: 'gps' | 'network' | 'fused';
  // Backward-compatible short-form accessors used by existing code
  lat?: number;
  lng?: number;
}

// ---- User -----------------------------------------------------------

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  level: number;
  xp: number;
  streak_days: number;
  last_active: Date;
  reputation: number;
  banned: boolean;
  settings: UserSettings;
}

export interface UserSettings {
  notifications: NotificationSettings;
  quiet_hours: boolean;
  language: string;
  // Backward-compatible flat keys used by existing notification service
  notifications_enabled?: boolean;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  max_push_per_day?: number;
  preferred_class?: MovementClass;
}

export interface NotificationSettings {
  territory_attack: boolean;
  territory_lost: boolean;
  quest_nearby: boolean;
  streak_warning: boolean;
  level_up: boolean;
  new_title: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  streak_days: number;
  reputation: number;
  titles: string[];
  total_claims: number;
  total_area_m2: number;
  // Backward-compatible fields
  created_at?: Date;
  clan_names?: string[];
  total_territory_m2?: number;
  total_quests_completed?: number;
  total_routes?: number;
}

// ---- Territory ------------------------------------------------------

export interface Territory {
  id: string;
  owner_id: string;
  polygon: any;
  class: MovementClass;
  claim_value: number;
  claimed_at: Date;
  last_defended: Date;
  decay_level: number;
}

// ---- Route ----------------------------------------------------------

export interface Route {
  id: string;
  user_id: string;
  points: GpsPoint[];
  polygon: any;
  class: MovementClass;
  distance_m: number;
  duration_s: number;
  weather_bonus: number;
  created_at: Date;
  trust_score: number;
}

// ---- Quest ----------------------------------------------------------

export interface Quest {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  territory_id: string;
  difficulty: number;
  avg_rating: number;
  total_completions: number;
  status: ContentStatus;
  created_at: Date;
  steps: QuestStep[];
  is_seed?: boolean;
  growth_level?: number;
  parent_quest_id?: string;
  linked_quests?: string[];
}

export interface QuestStep {
  id: string;
  quest_id: string;
  step_order: number;
  type: QuestStepType;
  location: { lat: number; lng: number };
  radius_m: number;
  instruction: string;
  verification_type: VerificationType;
  expected_answer?: string;
  hint?: string;
}

export interface QuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  current_step: number;
  started_at: Date;
  completed_at?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
}

// ---- Echo -----------------------------------------------------------

export interface Echo {
  id: string;
  creator_id: string;
  location: { lat: number; lng: number };
  radius_m: number;
  audio_url: string;
  likes: number;
  expires_at: Date;
  status: ContentStatus;
  created_at: Date;
}

// ---- Challenge ------------------------------------------------------

export interface Challenge {
  id: string;
  creator_id: string;
  template: string;
  location: { lat: number; lng: number };
  parameters: Record<string, any>;
  verification_level: number;
  class?: MovementClass;
  total_completions: number;
  avg_rating: number;
  status: ContentStatus;
  created_at: Date;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  user_id: string;
  media_url?: string;
  verified: boolean;
  submitted_at: Date;
}

// ---- Pet ------------------------------------------------------------

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed?: string;
  level: number;
  xp: number;
  specialization?: 'explorer' | 'tracker' | 'guardian';
  total_distance_km: number;
  total_walks: number;
  rare_finds: number;
  created_at: Date;
}

// ---- Travel Route ---------------------------------------------------

export interface TravelRoute {
  id: string;
  founder_id: string;
  title: string;
  path: any;
  total_distance_km: number;
  avg_rating: number;
  total_ratings: number;
  status: TravelStatus;
  created_at: Date;
  spots: TravelSpot[];
}

export interface TravelSpot {
  id: string;
  route_id: string;
  location: { lat: number; lng: number };
  title: string;
  description?: string;
  media_url?: string;
  spot_order: number;
  created_by: string;
}

// ---- Rating ---------------------------------------------------------

export interface Rating {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  creativity: number;
  difficulty: number;
  worth_it: number;
  comment?: string;
  created_at: Date;
}

// ---- Clan -----------------------------------------------------------

export interface Clan {
  id: string;
  type: ClanType;
  name: string;
  auto_generated: boolean;
  metadata: Record<string, any>;
  created_at: Date;
}

// ---- Notification ---------------------------------------------------

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  data: Record<string, any>;
  read: boolean;
  created_at: Date;
}

// ---- Claim Calculation ----------------------------------------------

export interface ClaimCalculation {
  base_area: number;
  class_multiplier: number;
  weather_bonus: number;
  streak_bonus: number;
  novelty_bonus: number;
  time_bonus: number;
  total_value: number;
}

// Backward-compatible alias used by claim engine
export interface ClaimResult {
  territory_id: string;
  claim_value: number;
  xp_earned: number;
  is_takeover: boolean;
  previous_owner?: string;
  bonuses: {
    weather: number;
    streak: number;
    novelty: number;
    time: number;
    class: number;
  };
}

// ---- Anti-Cheat -----------------------------------------------------

export interface TrustAssessment {
  trust_score: number;
  flags: string[];
  details?: Record<string, any>;
  auto_reject: boolean;
  manual_review: boolean;
  account_warning: boolean;
}

// ---- API Responses --------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// ---- Auth -----------------------------------------------------------

export interface AuthPayload {
  userId: string;
  username: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: UserProfile;
}

// Backward-compatible alias
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ---- Leaderboard ----------------------------------------------------

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  class?: MovementClass;
  metadata?: Record<string, any>;
}

// ---- Weather --------------------------------------------------------

export interface WeatherData {
  temperature: number;
  wind_speed: number;
  rain_mm: number;
  snow: boolean;
  weather_code: number;
  bonus: number;
  // Backward-compatible fields used by existing weather service
  condition?: WeatherCondition;
  cached_at?: number;
}

// ---- Bounding Box ---------------------------------------------------

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
  // Backward-compatible aliases
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
}

// ---- Request Types --------------------------------------------------

export interface CreateQuestRequest {
  title: string;
  description: string;
  territory_id: string;
  difficulty: number;
  steps: Omit<QuestStep, 'id' | 'quest_id'>[];
}

export interface CreateEchoRequest {
  location: { lat: number; lng: number };
  radius_m?: number;
}

export interface CreateChallengeRequest {
  template: string;
  location: { lat: number; lng: number };
  parameters: Record<string, any>;
  verification_level?: number;
  class?: MovementClass;
}

export interface UploadRouteRequest {
  points: GpsPoint[];
  class?: MovementClass;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ---- Feed -----------------------------------------------------------

export interface FeedItem {
  id: string;
  type: 'claim' | 'quest_complete' | 'echo_drop' | 'challenge_complete' | 'level_up' | 'title_earned';
  user_id: string;
  username: string;
  data: Record<string, any>;
  created_at: Date;
}

// ---- WebSocket ------------------------------------------------------

export interface WsMessage {
  type: string;
  payload: any;
}

// ---- User Title / Achievement ---------------------------------------

export interface UserTitle {
  id: string;
  user_id: string;
  title_key: string;
  earned_at: Date;
}

// ---- Clan Member ----------------------------------------------------

export interface ClanMember {
  clan_id: string;
  user_id: string;
  joined_at: Date;
}

// ---- Report ---------------------------------------------------------

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: Date;
}

// ---- Express extensions ---------------------------------------------

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: User;
    }
  }
}

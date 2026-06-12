// ============================================================
// API shapes mirrored from the MapRaiders server routes.
// Response envelope is ALWAYS { success, data } / { success, message }.
// ============================================================

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ---- Auth / User -------------------------------------------------------------

export interface User {
  id: string;
  username: string;
  email?: string;
  level: number;
  xp: number;
  streak_days?: number;
  created_at?: string;
  avatar_url?: string | null;
  territory_color?: string | null;
}

export interface Capabilities {
  [key: string]: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  capabilities?: Capabilities;
}

// GET /users/me returns the user fields plus stats + xp progress.
export interface MeStats {
  territories: number;
  total_territory_m2: number;
  quests_completed: number;
  total_routes: number;
  total_echos: number;
  total_distance_km: number;
}

export interface MeResponse extends User {
  xp_in_level?: number;
  xp_to_next_level?: number;
  titles?: string[];
  stats?: MeStats;
  capabilities?: Capabilities;
}

// ---- Feature flags -----------------------------------------------------------

export interface ClientFeatureFlag {
  key: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

// ---- Territories -------------------------------------------------------------

// GeoJSON geometry as returned by ST_AsGeoJSON (Polygon or MultiPolygon).
export interface GeoJsonGeometry {
  type: string;
  coordinates: number[][][] | number[][][][];
}

export interface Territory {
  id: string;
  owner_id: string | null;
  owner_username?: string | null;
  owner_level?: number | null;
  color?: string | null;
  class?: string | null;
  claim_value?: number | null;
  claimed_at?: string | null;
  last_defended?: string | null;
  decay_level: number;
  polygon: GeoJsonGeometry | null;
  area_m2?: number;
  has_defense?: boolean;
  defense_game_type?: string | null;
}

export interface TerritoryDetail extends Territory {
  defense_id?: string | null;
  recent_claims?: unknown[];
}

// ---- Resources ---------------------------------------------------------------

export type ResourceType = 'energy' | 'tech' | 'intel';

export type ResourceBalances = Record<ResourceType, number>;

export interface ResourcesResponse {
  balances: ResourceBalances;
  transactions?: unknown[];
}

// ---- Buildings ---------------------------------------------------------------

export type BuildingType = 'shield_generator' | 'refinery';
export type BuildingStatus = 'building' | 'active' | 'damaged' | 'destroyed';

export interface Building {
  id: string;
  territory_id: string;
  owner_id: string | null;
  type: BuildingType;
  tier: number;
  status: BuildingStatus;
  hp: number;
  completes_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
}

// ---- Inventory ---------------------------------------------------------------

export interface InventoryItem {
  id: string;
  definition_id: string;
  owner_id: string | null;
  status: string;
  mint_number: number | null;
  acquired_via?: string;
  state?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  category: string;
  rarity: string;
  tradeable?: boolean;
  def_stats?: Record<string, unknown>;
  lore?: Record<string, unknown>;
}

// ---- PvE spawns --------------------------------------------------------------

export interface PveSpawn {
  id: string;
  npc_type: string;
  level: number;
  biome?: string;
  status: string;
  latitude: number;
  longitude: number;
  anchored_territory_id?: string | null;
  spawned_at?: string;
  expires_at?: string;
}

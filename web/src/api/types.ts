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

export type BuildingType =
  | 'shield_generator'
  | 'refinery'
  | 'radar'
  | 'garrison'
  | 'silo'
  | 'teleporter';

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

// ---- Terminals (Jump&Run minigame) -------------------------------------------

/**
 * Opaque level descriptor passed through to the game iframe.
 * The only field we may read locally is par.maxScore for display.
 */
export interface RunnerLevel extends Record<string, unknown> {
  par?: { maxScore?: number };
}

export interface TerminalStartResponse {
  run_token: string;
  level: RunnerLevel;
  expires_at: number;
}

export interface TerminalSubmitBody {
  run_token: string;
  score: number;
  duration_ms: number;
  orbs_collected: number;
  finished: boolean;
  trace: unknown;
}

export interface TerminalSubmitResponse {
  accepted: true;
  score: number;
  best_score: number;
  rank: number;
  reward: { intel: number } | null;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
}

export interface TerminalLeaderboardResponse {
  entries: LeaderboardEntry[];
  me: { rank: number; score: number } | null;
}

// ---- Commander: Troops & Battles ---------------------------------------------

export interface CommanderGarrisonUnit {
  instance_id: string;
  definition_id: string;
}

export interface CommanderGarrison {
  territory_id: string;
  count: number;
  is_own: boolean;
  /** null for foreign territories (fog of war) */
  units: CommanderGarrisonUnit[] | null;
}

export interface CommanderForeignMovement {
  id: string;
  purpose: string;
  current_cell: string;
  eta: string;
  is_own: false;
}

export interface BattleRoundDiceSide {
  rolls: number[];
  bonus: number;
  modifier: number;
  total: number;
  unit: string;
}

export interface BattleRoundEffect {
  side: 'atk' | 'def';
  effect: string;
  cancelled?: number;
}

export interface BattleCasualty {
  side: 'atk' | 'def';
  definition_id: string;
}

export interface BattleRound {
  round: number;
  atk: BattleRoundDiceSide;
  def: BattleRoundDiceSide;
  effects: BattleRoundEffect[];
  casualty: BattleCasualty | null;
}

export interface BattleLog {
  attacker_units_start: number;
  defender_units_start: number;
  walkover: boolean;
  rounds: BattleRound[];
  winner_side: 'attacker' | 'defender';
  survivors: { attacker: string[]; defender: string[] };
  loot: { dice_drop?: string };
  /** Present when this battle is an airstrike (type field on BattleSummary = 'airstrike') */
  type?: 'airstrike';
  silo_tier?: number;
  damage?: number;
  result?: AirstrikeResultPayload;
}

export interface BattleSummary {
  id: string;
  type: string;
  attacker_id: string;
  defender_id: string;
  territory_id: string;
  winner: string | null;
  winner_side: 'attacker' | 'defender' | null;
  created_at: string;
}

export interface BattleDetail extends BattleSummary {
  log: BattleLog;
}

export interface TroopDeployment {
  id?: string;
  instance_id: string;
  territory_id: string;
  deployed_at?: string;
}

export interface TroopMovement {
  id: string;
  purpose: 'attack' | 'reinforce';
  status: string;
  from_territory_id: string;
  target_territory_id: string;
  instance_ids: string[];
  departs_at: string;
  arrives_at: string;
  config?: Record<string, unknown>;
}

// ---- Airstrikes (Phase C.3) --------------------------------------------------

/** One own silo returned in GET /commander/map */
export interface SiloInfo {
  territory_id: string;
  tier: number;
  /** ISO timestamp or null when the silo is ready now */
  ready_at: string | null;
}

export type AirstrikeResultPayload =
  | { shield_broken: true }
  | { building_hit: { id: string; type: string; hp_after: number; destroyed: boolean } }
  | { no_effect: true };

export interface AirstrikeResult {
  battle_id: string;
  result: AirstrikeResultPayload;
}

/** Airstrike log shape returned inside BattleDetail.log for type==='airstrike' */
export interface AirstrikeLog {
  type: 'airstrike';
  silo_tier: number;
  damage: number;
  result: AirstrikeResultPayload;
}

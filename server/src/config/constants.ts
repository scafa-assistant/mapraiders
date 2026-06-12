// ============================================================
// MapRaiders Game Constants
// Every balance value, multiplier, threshold and configuration
// referenced in the GDD lives here.
// ============================================================

import type { MovementClass } from '../utils/types';

// ---- Movement Class Multipliers -------------------------------------

export const CLASS_MULTIPLIERS: Record<MovementClass, number> = {
  walker: 1.0,
  dog_walker: 1.2,
  runner: 2.5,
  cyclist: 1.3,
  skater: 2.0,
  driver: 0.3,
};

// ---- Speed Limits (km/h) per class ----------------------------------

export const SPEED_LIMITS: Record<
  MovementClass,
  { min: number; max: number }
> = {
  walker: { min: 1, max: 8 },
  dog_walker: { min: 1, max: 8 },
  runner: { min: 7, max: 30 },
  cyclist: { min: 10, max: 45 },
  skater: { min: 5, max: 35 },
  driver: { min: 30, max: 200 },
};

// Speed ranges in m/s for class detection and anti-cheat
export const CLASS_SPEED_RANGES: Record<MovementClass, { min: number; max: number }> = {
  walker: { min: 0.5, max: 2.2 },      // ~1.8 - 8 km/h
  dog_walker: { min: 0.3, max: 2.5 },   // ~1 - 9 km/h
  runner: { min: 2.0, max: 7.0 },       // ~7 - 25 km/h
  cyclist: { min: 2.5, max: 15.0 },     // ~9 - 54 km/h
  skater: { min: 2.0, max: 10.0 },      // ~7 - 36 km/h
  driver: { min: 3.0, max: 50.0 },      // ~11 - 180 km/h
};

// ---- Weather Bonuses ------------------------------------------------

export const WEATHER_BONUSES: Record<string, number> = {
  clear: 1.0,
  light_rain: 1.3,
  heavy_rain: 1.5,
  snow: 1.5,
  storm: 2.0,
  extreme_cold: 1.8,
  extreme_heat: 1.5,
};

// Alias for backward compatibility with existing service code
export const WEATHER_MULTIPLIERS = WEATHER_BONUSES;

// Temperature thresholds for extreme-weather bonus conditions
export const WEATHER_TEMP_COLD_THRESHOLD = -5;  // Celsius
export const WEATHER_TEMP_HEAT_THRESHOLD = 35;   // Celsius
export const WEATHER_CACHE_MINUTES = 15;

// ---- Streak Bonuses -------------------------------------------------

export const STREAK_BONUSES: { days: number; mult: number }[] = [
  { days: 3, mult: 1.1 },
  { days: 7, mult: 1.3 },
  { days: 14, mult: 1.5 },
  { days: 30, mult: 2.0 },
  { days: 90, mult: 2.5 },
];

// Backward-compatible alias (sorted descending for the claim engine)
export const STREAK_MULTIPLIERS: { days: number; multiplier: number }[] = [
  { days: 90, multiplier: 2.5 },
  { days: 30, multiplier: 2.0 },
  { days: 14, multiplier: 1.5 },
  { days: 7, multiplier: 1.3 },
  { days: 3, multiplier: 1.1 },
];

/**
 * Return the streak multiplier for the given number of consecutive days.
 * Picks the highest bracket the player qualifies for.
 */
export function getStreakMultiplier(streakDays: number): number {
  let mult = 1.0;
  for (const bracket of STREAK_BONUSES) {
    if (streakDays >= bracket.days) {
      mult = bracket.mult;
    }
  }
  return mult;
}

// ---- Novelty Bonuses ------------------------------------------------

export const NOVELTY_BONUSES = {
  first_ever: 2.0,
  new_for_player: 1.3,
  repeat: 1.0,
} as const;

// Backward-compatible alias
export const NOVELTY_MULTIPLIERS = {
  FIRST_EVER_CLAIM: 2.0,
  NEW_STREET: 1.3,
  REPEAT: 1.0,
} as const;

// ---- Time-of-Day Bonuses --------------------------------------------

export const TIME_BONUSES: { start: number; end: number; mult: number }[] = [
  { start: 5, end: 7, mult: 1.3 },   // early morning
  { start: 7, end: 22, mult: 1.0 },  // normal
  { start: 22, end: 5, mult: 1.5 },  // night
];

// Backward-compatible alias
export const TIME_MULTIPLIERS: { start: number; end: number; multiplier: number }[] = [
  { start: 5, end: 7, multiplier: 1.3 },
  { start: 7, end: 22, multiplier: 1.0 },
  { start: 22, end: 5, multiplier: 1.5 },
];

/**
 * Return the time-of-day multiplier for a given hour (0-23).
 */
export function getTimeMultiplier(hour: number): number {
  if (hour >= 22 || hour < 5) return 1.5;
  if (hour >= 5 && hour < 7) return 1.3;
  return 1.0;
}

// ---- XP Values ------------------------------------------------------

export const XP = {
  // GDD spec keys
  claim_mult: 0.5,
  quest_create: 200,
  quest_solve_base: 100,
  quest_solve_per_diff: 40,
  echo_drop: 50,
  echo_liked: 100,
  challenge_base: 50,
  challenge_per_diff: 90,
  artifact_base: 50,
  artifact_per_rarity: 50,
  streak_per_day: 50,
  // Backward-compatible aliases used by existing services
  CLAIM_MULTIPLIER: 0.5,
  QUEST_CREATE: 200,
  QUEST_SOLVE_BASE: 100,
  QUEST_SOLVE_DIFFICULTY: 40,
  ECHO_DROP_INSTANT: 50,
  ECHO_DROP_POPULAR: 100,
  ECHO_POPULAR_THRESHOLD: 10,
  CHALLENGE_BASE: 50,
  CHALLENGE_DIFFICULTY: 90,
  ARTIFACT_BASE: 50,
  ARTIFACT_RARITY: 50,
  STREAK_BONUS_PER_DAY: 50,
} as const;

// ---- Level Curve ----------------------------------------------------
// XP required to reach level N = round(1000 * N^1.5)

export const LEVEL_CURVE_BASE = 1000;
export const LEVEL_CURVE_EXPONENT = 1.5;

export function xpForLevel(level: number): number {
  return Math.round(LEVEL_CURVE_BASE * Math.pow(level, LEVEL_CURVE_EXPONENT));
}

/**
 * Determine the level that corresponds to a cumulative XP total.
 * Levels start at 1; XP required for level N is added cumulatively.
 */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  let accumulated = 0;
  while (level < 999) {
    accumulated += xpForLevel(level);
    if (totalXp < accumulated) return level;
    level++;
  }
  return 999;
}

// ---- Decay ----------------------------------------------------------

export const DECAY = {
  check_hour: 4,
  grace_days: 1,
  slow_phase_days: 7,
  slow_phase_max: 0.7,
  fast_phase_days: 7,
  echo_ttl_hours: 48,
  echo_like_extension_hours: 48,
  echo_max_days: 30,
  quest_inactive_days: 30,
  quest_min_rating: 4.0,
  challenge_inactive_days: 30,
  // Backward-compatible nested shape
  TERRITORY: {
    GRACE_DAYS: 1,
    PHASE1_END: 7,
    PHASE1_MAX: 0.7,
    PHASE2_DAYS: 7,
    PHASE2_START: 0.7,
    MAX: 1.0,
  },
  ECHO: {
    BASE_HOURS: 48,
    LIKE_BONUS_HOURS: 48,
    MAX_DAYS: 30,
  },
  QUEST: {
    INACTIVE_DAYS: 30,
    RATING_PROTECTION: 4.0,
  },
  CHALLENGE: {
    INACTIVE_DAYS: 30,
  },
} as const;

// ---- Territory ------------------------------------------------------

export const TERRITORY = {
  min_area_m2: 500,
  min_polygon_width_m: 20,
  max_area_walker: 1_000_000,
  max_area_cyclist: 5_000_000,
  max_area_driver: 50_000_000,
  max_loss_per_day: 0.3,
  route_close_radius_urban: 50,
  route_close_radius_rural: 200,
  min_duration_s: 300,
  min_distance_m: 200,
  // Backward-compatible flat keys
  MIN_AREA_M2: 500,
  MAX_AREA_M2: 50_000_000,
} as const;

// ---- Claim Calculation Constants ------------------------------------

export const CLAIM_BASE_AREA_DIVISOR = 100;
export const CLAIM_LOG_BASE = 2;
export const CLAIM_MULTIPLIER = 100;
export const TAKEOVER_DECAY_FACTOR = 0.7;

// ---- Anti-Cheat -----------------------------------------------------

export const ANTI_CHEAT = {
  max_gps_jump_m: 100,
  trust_review_threshold: 0.5,
  trust_reject_threshold: 0.3,
  trust_warn_threshold: 0.1,
  // Backward-compatible aliases
  MAX_GPS_JUMP_M: 100,
  LOW_SPEED_THRESHOLD_MS: 8.33,  // 30 km/h in m/s
  TRUST_MANUAL_REVIEW: 0.5,
  TRUST_AUTO_REJECT: 0.3,
  TRUST_ACCOUNT_WARNING: 0.1,
} as const;

// ---- Notifications --------------------------------------------------

export const NOTIFICATIONS = {
  max_per_day: 5,
  quiet_start: 23,
  quiet_end: 7,
  // Backward-compatible aliases
  MAX_PUSH_PER_DAY: 5,
  QUIET_HOURS_START: 23,
  QUIET_HOURS_END: 7,
  STREAK_WARNING_HOURS: 23,
  BATCH_INTERVAL_HOURS: 24,
} as const;

// ---- Quest ----------------------------------------------------------

export const QUEST = {
  max_steps: 10,
  hint_offer_min: 5,
  hint_auto_min: 10,
  skip_offer_min: 20,
  min_level_create: 6,
  // Backward-compatible aliases
  MIN_STEPS: 1,
  MAX_STEPS: 10,
  HINT_OFFER_MINUTES: 5,
  HINT_AUTO_SHOW_MINUTES: 10,
  HINT_SKIP_MINUTES: 20,
  DEFAULT_STEP_RADIUS_M: 30,
  RATING_WEIGHT_CREATIVITY: 1,
  RATING_WEIGHT_DIFFICULTY: 1,
  RATING_WEIGHT_WORTH_IT: 2,
} as const;

// ---- Legendary Thresholds -------------------------------------------

export const LEGENDARY = {
  quest_rating: 4.8,
  quest_completions: 50,
  echo_likes: 200,
  route_rating: 4.8,
  route_ratings: 20,
} as const;

// ---- Titles / Prestige ---------------------------------------------

export interface TitleDefinition {
  key: string;
  name: string;
  condition: string;
  description?: string;
}

export const TITLES: Record<string, TitleDefinition> = {
  street_beast: {
    key: 'street_beast',
    name: 'Street Beast',
    condition: '100 fitness challenges',
  },
  iron_grip: {
    key: 'iron_grip',
    name: 'Iron Grip',
    condition: '50 pullup challenges',
  },
  trail_dog: {
    key: 'trail_dog',
    name: 'Trail Dog',
    condition: '500km with dog',
  },
  urban_explorer: {
    key: 'urban_explorer',
    name: 'Urban Explorer',
    condition: '100 different streets',
  },
  echo_master: {
    key: 'echo_master',
    name: 'Echo Master',
    condition: '10 permanent echos',
  },
  questmaker: {
    key: 'questmaker',
    name: 'Questmaker',
    condition: '20 quests >=4.5 rating',
  },
  night_runner: {
    key: 'night_runner',
    name: 'Nachtl\u00e4ufer',
    condition: '10 claims 22:00-05:00',
  },
  storm_rider: {
    key: 'storm_rider',
    name: 'Sturmreiter',
    condition: '20 claims in storm',
  },
  pioneer: {
    key: 'pioneer',
    name: 'Pioneer',
    condition: 'Among the first 100 players in your city',
  },
  recruiter: {
    key: 'recruiter',
    name: 'Recruiter',
    condition: 'Successfully invite 5 players',
  },
};

// Backward-compatible array-form title definitions used by existing services
export const TITLE_DEFINITIONS: TitleDefinition[] = [
  { key: 'first_claim', name: 'Trailblazer', condition: 'Claim your first territory', description: 'Claim your first territory' },
  { key: 'claim_10', name: 'Landowner', condition: 'Claim 10 territories', description: 'Claim 10 territories' },
  { key: 'claim_100', name: 'Territory Baron', condition: 'Claim 100 territories', description: 'Claim 100 territories' },
  { key: 'quest_creator', name: 'Quest Architect', condition: 'Create a quest with a positive rating', description: 'Create a quest with a positive rating' },
  { key: 'quest_master', name: 'Quest Master', condition: 'Complete 50 quests', description: 'Complete 50 quests' },
  { key: 'echo_dropper', name: 'Voice of the City', condition: 'Drop 10 echos', description: 'Drop 10 echos' },
  { key: 'echo_legend', name: 'Echo Legend', condition: 'Get 100 total likes on echos', description: 'Get 100 total likes on echos' },
  { key: 'streak_7', name: 'Consistent', condition: 'Maintain a 7-day streak', description: 'Maintain a 7-day streak' },
  { key: 'streak_30', name: 'Dedicated', condition: 'Maintain a 30-day streak', description: 'Maintain a 30-day streak' },
  { key: 'streak_90', name: 'Unstoppable', condition: 'Maintain a 90-day streak', description: 'Maintain a 90-day streak' },
  { key: 'streak_365', name: 'Legendary', condition: 'Maintain a 365-day streak', description: 'Maintain a 365-day streak' },
  { key: 'explorer_100km', name: 'Explorer', condition: 'Walk/run/ride 100km total', description: 'Walk/run/ride 100km total' },
  { key: 'explorer_1000km', name: 'Grand Explorer', condition: 'Walk/run/ride 1000km total', description: 'Walk/run/ride 1000km total' },
  { key: 'dog_whisperer', name: 'Dog Whisperer', condition: 'Walk your dog 100 times', description: 'Walk your dog 100 times' },
  { key: 'night_owl', name: 'Night Owl', condition: 'Claim 20 territories between 22:00-05:00', description: 'Claim 20 territories between 22:00-05:00' },
  { key: 'early_bird', name: 'Early Bird', condition: 'Claim 20 territories between 05:00-07:00', description: 'Claim 20 territories between 05:00-07:00' },
  { key: 'storm_chaser', name: 'Storm Chaser', condition: 'Claim 10 territories in storm weather', description: 'Claim 10 territories in storm weather' },
  { key: 'clan_founder', name: 'Clan Founder', condition: 'Be part of 5 different clans', description: 'Be part of 5 different clans' },
  { key: 'top_district', name: 'District Champion', condition: 'Be #1 in a district leaderboard', description: 'Be #1 in a district leaderboard' },
  { key: 'level_10', name: 'Apprentice', condition: 'Reach level 10', description: 'Reach level 10' },
  { key: 'level_25', name: 'Journeyman', condition: 'Reach level 25', description: 'Reach level 25' },
  { key: 'level_50', name: 'Expert', condition: 'Reach level 50', description: 'Reach level 50' },
  { key: 'level_100', name: 'Grandmaster', condition: 'Reach level 100', description: 'Reach level 100' },
  // GDD titles
  { key: 'street_beast', name: 'Street Beast', condition: '100 fitness challenges' },
  { key: 'iron_grip', name: 'Iron Grip', condition: '50 pullup challenges' },
  { key: 'trail_dog', name: 'Trail Dog', condition: '500km with dog' },
  { key: 'urban_explorer', name: 'Urban Explorer', condition: '100 different streets' },
  { key: 'echo_master', name: 'Echo Master', condition: '10 permanent echos' },
  { key: 'questmaker', name: 'Questmaker', condition: '20 quests >=4.5 rating' },
  { key: 'night_runner', name: 'Nachtl\u00e4ufer', condition: '50 claims 22:00-05:00' },
  { key: 'storm_rider', name: 'Sturmreiter', condition: '20 claims in storm' },
  { key: 'pioneer', name: 'Pioneer', condition: 'Among the first 100 players in your city', description: 'Among the first 100 players in your city' },
  { key: 'recruiter', name: 'Recruiter', condition: 'Successfully invite 5 players', description: 'Successfully invite 5 players' },
];

// ---- Unlock Levels --------------------------------------------------

export const UNLOCK_LEVELS = {
  newcomer: 1,
  claimer: 6,
  creator: 16,
  architect: 31,
  legend: 51,
} as const;

// ---- Pet Specializations --------------------------------------------

export const PET_SPECS = {
  explorer: { rare_find_bonus: 1.5 },
  tracker: { detection_radius_mult: 2.0 },
  guardian: { decay_reduction: 0.5 },
} as const;

// ---- Diminishing Returns --------------------------------------------
// Multipliers for repeating the same route within 24 hours.
// Index 0 = first run, 1 = second run, etc.

export const DIMINISHING_RETURNS: readonly number[] = [1.0, 0.5, 0.25, 0.1];

// Backward-compatible alias
export const ANTI_GRIND_RETURNS = DIMINISHING_RETURNS;

// ---- Leaderboard Types ----------------------------------------------

export type LeaderboardType =
  | 'territory'
  | 'street_king'
  | 'questmaker'
  | 'echo_master'
  | 'explorer'
  | 'streak'
  | 'district'
  | 'pet';

export const LEADERBOARD_TYPES: LeaderboardType[] = [
  'territory',
  'street_king',
  'questmaker',
  'echo_master',
  'explorer',
  'streak',
  'district',
  'pet',
];

export const LEADERBOARD_PERIODS = ['monthly', 'alltime'] as const;
export type LeaderboardPeriod = typeof LEADERBOARD_PERIODS[number];

// ---- Echo Settings --------------------------------------------------

export const ECHO = {
  DEFAULT_RADIUS_M: 40,
  MIN_RADIUS_M: 10,
  MAX_RADIUS_M: 200,
} as const;

// ---- Clan Formation -------------------------------------------------

export const CLAN = {
  TRANSIT: {
    TIME_WINDOW_MINUTES: 15,
    MIN_OVERLAPS: 3,
    LOOKBACK_DAYS: 7,
  },
  DISTRICT: {
    TOP_PLAYERS: 10,
  },
  DOG_PARK: {
    MIN_VISITS: 3,
  },
  DISTRICT_SCORING: {
    CLAIMS: 0.3,
    QUEST_COMPLETIONS: 0.3,
    ECHO_LIKES: 0.2,
    ACTIVE_PLAYERS: 0.2,
  },
} as const;

// ---- Rate Limiting --------------------------------------------------

export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 10 },
  GENERAL: { windowMs: 60 * 1000, max: 60 },
  CLAIM: { windowMs: 60 * 1000, max: 5 },
  ECHO: { windowMs: 60 * 1000, max: 10 },
} as const;

// ---- Polygon Processing ---------------------------------------------

export const POLYGON = {
  DOUGLAS_PEUCKER_TOLERANCE: 0.00005,
  MIN_POINTS: 4,
  KALMAN_Q: 0.00001,
  KALMAN_R: 0.0001,
} as const;

// ---- PvE Spawns + Hacking (Phase A) ---------------------------------
// Context-driven NPC spawns: Erdriss portals, Vril scouts, Aether-Leeches.
// Biome decides which NPC types can appear; each type carries a loot table.

/** NPC archetypes that can spawn in the world. */
export type PveNpcType =
  | 'scout_disc'
  | 'aether_leech'
  | 'tech_drone'
  | 'obsidian_guard'
  | 'terminal'
  | 'ruin_cache'; // Phase D — overgrown AI-razed cells, hackable for salvage

/** Biomes returned by osmContextService.getContext(). */
export type Biome = 'water' | 'forest' | 'industrial' | 'rural' | 'urban' | 'landmark';

/** A single loot drop entry for an NPC type. */
export interface PveLootTable {
  /** Flat resource grant on a successful hack. */
  resources: Partial<Record<'energy' | 'tech' | 'intel', number>>;
  /** Optional unit item dropped with the given probability (0..1). */
  unit?: { definitionId: string; chance: number };
}

export const PVE = {
  // ---- Spawn lifecycle ----
  SPAWN_TTL_HOURS_MIN: 24,
  SPAWN_TTL_HOURS_MAX: 72,
  MAX_SPAWNS_PER_CELL: 3,

  // ---- Hacking ----
  HACK_RADIUS_M: 75,
  HACK_DAILY_CAP: 30,

  // ---- Spawn engine throttling ----
  CELL_COOLDOWN_SEC: 600, // 10 min Redis cooldown per cell

  // ---- Aether-Leech debuff (applied in Phase B, surfaced now) ----
  LEECH_YIELD_PENALTY: 0.2, // -20% claim_value yield while anchored

  /**
   * Biome -> candidate NPC types. The engine picks from this set when
   * filling a cell. Phase A.2 has arrived: landmark cells now host
   * 'terminal' spawns (the Jump&Run minigame) alongside scout discs.
   */
  BIOME_SPAWN_MATRIX: {
    water: ['scout_disc', 'water_strider_source'],
    forest: ['aether_leech', 'forest_construct_source'],
    industrial: ['tech_drone'],
    urban: ['scout_disc'],
    rural: ['scout_disc'],
    landmark: ['terminal', 'scout_disc'],
  } as Record<Biome, string[]>,

  /**
   * Loot table per NPC type. `scout_disc` and `tech_drone` carry their own
   * unit drop. Biome-flavoured drops (water -> water_strider, forest ->
   * forest_construct) are layered on top by the engine via BIOME_UNIT_DROP.
   */
  LOOT: {
    scout_disc: {
      resources: { intel: 3 },
      unit: { definitionId: 'unit_scout_disc', chance: 0.6 },
    },
    tech_drone: {
      resources: { tech: 5 },
      unit: { definitionId: 'unit_tech_drone', chance: 0.5 },
    },
    aether_leech: {
      resources: { tech: 3, energy: 5 },
      // no unit drop
    },
    // Phase D: ruin_cache spawns are seeded by the ruins_overgrowth cron with
    // their own explicit loot on the spawn row; this entry is the buildLoot
    // fallback should one ever be created via the generic spawn path.
    ruin_cache: {
      resources: { tech: 8, intel: 4 },
      // no unit drop
    },
  } as Record<string, PveLootTable>,

  /**
   * Biome-specific bonus unit drops, layered onto the base loot table of a
   * spawn that was created in that biome.
   *   water  spawns drop unit_water_strider   @ 40%
   *   forest spawns drop unit_forest_construct @ 40%
   */
  BIOME_UNIT_DROP: {
    water: { definitionId: 'unit_water_strider', chance: 0.4 },
    forest: { definitionId: 'unit_forest_construct', chance: 0.4 },
  } as Partial<Record<Biome, { definitionId: string; chance: number }>>,
} as const;

// ============================================================
// BUILDINGS (Phase B) — Tier-1 structures on owned territories.
// All numbers here are DEFAULTS; the `resources` feature flag's
// `config` block can override them live (no deploy) — e.g.
// config.buildings.costs.refinery.energy. buildingEngine and
// energyService read flag config with these as the fallback.
// ============================================================

export const BUILDINGS = {
  /** Resource costs to start construction, per building type. */
  COSTS: {
    shield_generator: { energy: 200, tech: 100 },
    refinery: { energy: 150, tech: 80 },
    // Phase C.3 — tier-2/3 capable structures.
    radar: { energy: 180, tech: 120 },
    garrison: { energy: 250, tech: 150 },
    silo: { energy: 400, tech: 250 },
    teleporter: { energy: 300, tech: 200 },
  } as Record<string, { energy: number; tech: number }>,

  /**
   * Phase C.3 — building tiers. Buildings start at tier 1 and may be upgraded
   * up to MAX_TIER. The upgrade cost is the base COSTS[type] scaled by
   * UPGRADE_COST_MULT^(currentTier); the upgrade duration is indexed by the
   * CURRENT tier (1→2 from index 1, 2→3 from index 2; index 0 unused).
   */
  TIERS: {
    MAX_TIER: 3,
    UPGRADE_COST_MULT: 2,
    UPGRADE_TIME_HOURS: [0, 4, 8],
  },

  /**
   * Phase C.3 — per-tier gameplay effects (index by tier-1). These are the
   * code defaults; the refinery_bonus is additionally overridable at tier 1
   * via the `resources` flag (config.buildings.refinery_energy_bonus) for
   * backward compatibility with the Phase-B flat bonus.
   */
  TIER_EFFECTS: {
    refinery_bonus: [0.25, 0.4, 0.5],
    shield_blocks_per_day: [1, 2, 3],
    radar_vision_k: [2, 3, 4],
    garrison_bonus_slots: [4, 6, 8],
    silo_damage: [50, 75, 100],
  },

  /** Construction time before a building flips building → active. */
  BUILD_TIME_HOURS: 2,

  /** Fraction of the original cost refunded on demolish. */
  DEMOLISH_REFUND: 0.5,

  /** Energy-accrual bonus per ACTIVE refinery on the same territory. */
  REFINERY_ENERGY_BONUS: 0.25,

  /**
   * After a shield blocks a takeover it is exhausted for this many
   * hours; a second attack within the window slips past the shield.
   */
  SHIELD_BLOCK_COOLDOWN_HOURS: 24,

  /**
   * While an active shield stands, Phase-1 territory decay accrues
   * this much slower (0.25 = 25% slower ramp).
   */
  SHIELD_DECAY_SLOWDOWN: 0.25,

  /**
   * Max building slots per territory by area (m²). Mirrors the
   * defense-slot model (min(5, floor(area/1000)+1)) so structures
   * scale with territory size. THRESHOLDS is the explicit fallback
   * used when no area-based formula applies.
   */
  SLOTS: {
    /** Same formula the defense engine uses for defense slots. */
    maxByArea(areaSqM: number): number {
      return Math.min(5, Math.floor((areaSqM || 0) / 1000) + 1);
    },
    /** Coarse fallback thresholds (only used if maxByArea is bypassed). */
    THRESHOLDS: [
      { maxAreaSqM: 50_000, slots: 1 },
      { maxAreaSqM: 200_000, slots: 2 },
    ] as { maxAreaSqM: number; slots: number }[],
    FALLBACK_SLOTS: 3,
  },

  ENERGY: {
    /** Cap on accrual hours to prevent a windfall after long absence. */
    MAX_ACCRUAL_HOURS: 168,
  },
} as const;

// ============================================================
// TERMINALS (Phase A.2) — Jump&Run terminals on landmark cells.
// A 'terminal' pve_spawn hosts a deterministic HTML5 runner game.
// The server is the single source of truth for the level (seeded
// from the spawn id) and validates submitted scores. Finished runs
// post to a per-spawn Redis leaderboard and grant intel (capped).
// The `terminals` feature flag's `config` block can override
// require_proximity and runs_per_day live (no deploy).
// ============================================================

export const TERMINALS = {
  TTL_HOURS: 168,              // terminal spawns live 7 days (leaderboards need time)
  RUNS_PER_DAY: 10,            // max starts per user/day
  REWARD_RUNS_PER_DAY: 3,      // only first N finished runs/day grant intel
  RUN_TOKEN_TTL_SEC: 600,
  ORB_POINTS: 10,
  FINISH_BONUS: 100,
  TIME_BONUS_MAX: 50,
  REWARD_INTEL_MIN: 5,
  REWARD_INTEL_MAX: 15,
  PLAY_RADIUS_M: 75,
  LEADERBOARD_TTL_BUFFER_SEC: 604_800,
} as const;

// ============================================================
// COMMANDER (Phase C.1) — Fog of War + Scouts.
// The commander layer adds per-user map visibility (fog of war) revealed
// by own territories, radars and dispatched scouts, plus generic troop
// movement plumbing (C.1 ships scouts only). All gated behind the
// `commander` feature flag.
// ============================================================

export const COMMANDER = {
  SCOUT_MIN_PER_CELL: 4,        // travel minutes per res-8 cell
  SCOUT_ENERGY_PER_CELL: 2,     // energy cost per one-way path cell
  SCOUT_VISION_K: 1,            // disk radius revealed around scout target
  SCOUT_VISION_TTL_HOURS: 24,
  RADAR_VISION_K: 2,            // disk radius around a radar's territory cells
  TERRITORY_VISION_K: 1,        // base vision around own territory cells
  MAX_ACTIVE_SCOUTS: 3,
  MAX_PATH_CELLS: 60,
  MAX_VISIBLE_CELLS: 1500,      // hard response cap
} as const;

// ============================================================
// COMBAT (Phase C.2) — Troop deployment + dice battle engine.
// Units march to a target territory and resolve an assault against its
// garrison via a dice-driven round loop. The winner may drop a die.
// All randomness is server-side (crypto.randomInt). The DICE_DROP_P value
// here is the default; the `commander` flag's config.dice_drop_p overrides
// it live (read by the route BEFORE the tx, passed into the battle engine).
// ============================================================

export type CombatDomain = 'ground' | 'armor' | 'air' | 'aa' | 'naval';

export const COMBAT = {
  MARCH_MIN_PER_CELL: 6,
  MARCH_ENERGY_PER_CELL_PER_UNIT: 1,
  MAX_MARCH_UNITS: 6,
  MAX_GARRISON: 6,
  MAX_ROUNDS: 20,
  DICE_DROP_P: 0.35,            // winner dice-drop chance, flags.config 'dice_drop_p' overrides
  DROP_CAP_PER_TARGET_PER_DAY: 3, // attacker wins per territory/day that still roll for a drop
  // attacker-domain beats defender-domain -> +1 (and the reverse check gives -1)
  DOMAIN_MATRIX: {
    ground: { aa: 1 }, armor: { ground: 1 }, air: { armor: 1 }, aa: { air: 1 }, naval: {},
  } as Record<CombatDomain, Partial<Record<CombatDomain, number>>>,
  // dice-drop rarity table by DEFEATED side's starting unit count
  DROP_RARITY: [
    { minUnits: 5, weights: { dice_d6: 0, dice_d8: 60, dice_shield: 40 } },
    { minUnits: 3, weights: { dice_d6: 50, dice_d8: 40, dice_shield: 10 } },
    { minUnits: 0, weights: { dice_d6: 80, dice_d8: 20, dice_shield: 0 } },
  ],
} as const;

// ============================================================
// AIRSTRIKE (Phase C.3) — Silo-launched ranged strikes.
// A 'silo' building lets its owner strike a foreign territory within range,
// breaking a shield, damaging the highest-HP building, or (recon-by-fire)
// hitting nothing — always at the energy + cooldown cost. Damage scales with
// the silo's tier (BUILDINGS.TIER_EFFECTS.silo_damage). Gated behind the
// `commander` feature flag.
// ============================================================

export const AIRSTRIKE = {
  ENERGY_COST: 150,
  RANGE_CELLS: 40,     // max h3 gridDistance from a silo cell to the target cell
  COOLDOWN_HOURS: 6,
} as const;

// ============================================================
// TELEPORT (Phase C.3) — Teleporter fast-path for reinforcements.
// When BOTH the origin and target territory are owned by the user and each
// has an active teleporter, a reinforce march travels in TRAVEL_MIN minutes
// flat (instead of per-cell), at a flat per-unit energy cost. Attacks never
// teleport. Gated behind the `commander` feature flag.
// ============================================================

export const TELEPORT = {
  TRAVEL_MIN: 2,
  ENERGY_PER_UNIT: 5,
} as const;

// ============================================================
// AI GENERAL (Phase D) — Hybrid AI: deterministic sector simulation
// (aiSimEngine) + a Claude-driven general (aiGeneralService) that issues
// high-level directives the sim executes via the EXISTING troop/battle
// engines. All gated behind the `ai_general` feature flag.
//
// Architecture: a seeded SYSTEM USER (AI.USER_ID) owns every AI unit and
// movement so troopEngine / battleEngine / itemService work unchanged.
// Clients identify AI via that id and config.ai_faction === true.
//
// Live overrides: the `ai_general` flag's config block can override
// thresholds (config.thresholds.*) and the LLM budget (config.max_calls_per_day).
// ============================================================

export const AI = {
  USER_ID: '00000000-0000-0000-0000-00000000a111',
  // Trigger thresholds (flags.config 'ai_general'.thresholds.* overrides live)
  TRIGGER: { MIN_ACTIVE_PLAYERS: 3, MIN_BUILDING_TIER_SUM: 5, ACTIVE_DAYS: 14 },
  // Phase behavior
  DORMANT_HOLD_PCT: 0.12,          // hold ~12% of the sector's active cells
  MAX_HELD_CELLS: 60,              // hard cap on held cells per sector
  SIM_COOLDOWN_MIN: 30,            // min minutes between sims of one sector
  UNIT_DEFINITION: 'unit_scout_disc',   // what the AI fields (exists already)
  STRENGTH_PER_UNIT: 1,
  MAX_UNITS_PER_ATTACK: 4,
  PROBE_INTENSITY_UNITS: (i: number) => Math.max(1, Math.round(i * 4)), // intensity 0..1 -> 1..4 units
  INVASION_STRENGTH_THRESHOLD: 20,
  // LLM
  LLM_MODEL: 'claude-haiku-4-5',
  LLM_MAX_TOKENS: 400,
  LLM_CALL_INTERVAL_HOURS: 6,
  LLM_MAX_CALLS_PER_DAY: 200,      // flags.config max_calls_per_day overrides
  // Ruins
  RUIN_OVERGROWTH_PER_NIGHT: 1,
  RUIN_NEST_THRESHOLD: 7,          // overgrowth >= this -> spawns a ruin_cache pve spawn
} as const;

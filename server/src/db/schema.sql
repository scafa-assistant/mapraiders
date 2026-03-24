-- ============================================================
-- MapRaiders Database Schema
-- PostgreSQL + PostGIS
-- Complete foundation schema for the GPS-based city MMO.
-- ============================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- Core player accounts with progression data.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(30)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  level         INT          NOT NULL DEFAULT 1,
  xp            BIGINT       NOT NULL DEFAULT 0,
  streak_days   INT          NOT NULL DEFAULT 0,
  last_active   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  reputation    DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  banned        BOOLEAN      NOT NULL DEFAULT FALSE,
  web3_provider  VARCHAR(20),
  push_token    TEXT,
  settings      JSONB        NOT NULL DEFAULT '{
    "notifications": {
      "territory_attack": true,
      "territory_lost": true,
      "quest_nearby": true,
      "streak_warning": true,
      "level_up": true,
      "new_title": true
    },
    "quiet_hours": false,
    "language": "en"
  }'::jsonb
);

COMMENT ON TABLE users IS 'Player accounts with progression, reputation and settings.';

CREATE INDEX IF NOT EXISTS idx_users_username    ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email       ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_level       ON users (level DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users (last_active);
CREATE INDEX IF NOT EXISTS idx_users_streak      ON users (streak_days DESC);
CREATE INDEX IF NOT EXISTS idx_users_banned      ON users (banned) WHERE banned = TRUE;

-- ============================================================
-- REFRESH TOKENS
-- Long-lived tokens for silent re-authentication.
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE refresh_tokens IS 'Hashed refresh tokens for JWT renewal.';

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_exp  ON refresh_tokens (expires_at);

-- ============================================================
-- TERRITORIES
-- Polygonal areas claimed by players.
-- ============================================================
CREATE TABLE IF NOT EXISTS territories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID             REFERENCES users(id) ON DELETE SET NULL,
  polygon       GEOMETRY(POLYGON, 4326) NOT NULL,
  class         VARCHAR(20)  NOT NULL,
  claim_value   DOUBLE PRECISION NOT NULL DEFAULT 0,
  claimed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_defended TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  decay_level   DOUBLE PRECISION NOT NULL DEFAULT 0.0
);

COMMENT ON TABLE territories IS 'GPS polygons claimed through walking/running/cycling routes.';

CREATE INDEX IF NOT EXISTS idx_territories_polygon  ON territories USING GIST (polygon);
CREATE INDEX IF NOT EXISTS idx_territories_owner    ON territories (owner_id);
CREATE INDEX IF NOT EXISTS idx_territories_decay    ON territories (decay_level);
CREATE INDEX IF NOT EXISTS idx_territories_claimed  ON territories (claimed_at DESC);
CREATE INDEX IF NOT EXISTS idx_territories_class    ON territories (class);

-- ============================================================
-- ROUTES
-- GPS traces that generate territory claims.
-- ============================================================
CREATE TABLE IF NOT EXISTS routes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points        JSONB        NOT NULL,
  polygon       GEOMETRY(POLYGON, 4326),
  class         VARCHAR(20)  NOT NULL,
  distance_m    DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_s    INT          NOT NULL DEFAULT 0,
  weather_bonus DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  trust_score   DOUBLE PRECISION NOT NULL DEFAULT 1.0
);

COMMENT ON TABLE routes IS 'Recorded GPS routes used for territory claims and anti-cheat validation.';

CREATE INDEX IF NOT EXISTS idx_routes_user      ON routes (user_id);
CREATE INDEX IF NOT EXISTS idx_routes_created   ON routes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routes_polygon   ON routes USING GIST (polygon);
CREATE INDEX IF NOT EXISTS idx_routes_class     ON routes (class);

-- ============================================================
-- QUESTS
-- Player-created multi-step adventures tied to territories.
-- ============================================================
CREATE TABLE IF NOT EXISTS quests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id        UUID         REFERENCES users(id) ON DELETE SET NULL,
  title             VARCHAR(200) NOT NULL,
  description       TEXT         NOT NULL DEFAULT '',
  territory_id      UUID         REFERENCES territories(id) ON DELETE SET NULL,
  difficulty        INT          NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 10),
  avg_rating        DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_completions INT          NOT NULL DEFAULT 0,
  status            VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE quests IS 'Multi-step player-authored quests anchored to territories.';

CREATE INDEX IF NOT EXISTS idx_quests_creator    ON quests (creator_id);
CREATE INDEX IF NOT EXISTS idx_quests_territory  ON quests (territory_id);
CREATE INDEX IF NOT EXISTS idx_quests_status     ON quests (status);
CREATE INDEX IF NOT EXISTS idx_quests_rating     ON quests (avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_quests_difficulty ON quests (difficulty);

-- ============================================================
-- QUEST STEPS
-- Individual steps within a quest.
-- ============================================================
CREATE TABLE IF NOT EXISTS quest_steps (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id          UUID         NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  step_order        INT          NOT NULL,
  type              VARCHAR(20)  NOT NULL,
  location          GEOMETRY(POINT, 4326) NOT NULL,
  radius_m          DOUBLE PRECISION NOT NULL DEFAULT 30,
  instruction       TEXT         NOT NULL,
  verification_type VARCHAR(20)  NOT NULL,
  expected_answer   TEXT,
  hint              TEXT
);

COMMENT ON TABLE quest_steps IS 'Ordered steps within a quest, each with a location and verification rule.';

CREATE INDEX IF NOT EXISTS idx_quest_steps_quest    ON quest_steps (quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_steps_location ON quest_steps USING GIST (location);

-- ============================================================
-- QUEST PROGRESS
-- Tracks each player's progress through a quest.
-- ============================================================
CREATE TABLE IF NOT EXISTS quest_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id     UUID        NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  current_step INT         NOT NULL DEFAULT 0,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status       VARCHAR(20) NOT NULL DEFAULT 'in_progress'
);

COMMENT ON TABLE quest_progress IS 'Per-user quest completion state.';

CREATE INDEX IF NOT EXISTS idx_quest_progress_user  ON quest_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_quest ON quest_progress (quest_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quest_progress_active
  ON quest_progress (user_id, quest_id) WHERE status = 'in_progress';

-- ============================================================
-- ECHOS
-- Geo-anchored audio messages with a decay timer.
-- ============================================================
CREATE TABLE IF NOT EXISTS echos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID         REFERENCES users(id) ON DELETE SET NULL,
  location   GEOMETRY(POINT, 4326) NOT NULL,
  radius_m   DOUBLE PRECISION NOT NULL DEFAULT 40,
  audio_url  VARCHAR(500) NOT NULL,
  likes      INT          NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ  NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE echos IS 'Location-anchored audio drops with time-limited lifespan.';

CREATE INDEX IF NOT EXISTS idx_echos_location ON echos USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_echos_status   ON echos (status);
CREATE INDEX IF NOT EXISTS idx_echos_expires  ON echos (expires_at);
CREATE INDEX IF NOT EXISTS idx_echos_creator  ON echos (creator_id);
CREATE INDEX IF NOT EXISTS idx_echos_likes    ON echos (likes DESC);

-- ============================================================
-- ECHO LIKES
-- Records which users liked which echos (prevent double-likes).
-- ============================================================
CREATE TABLE IF NOT EXISTS echo_likes (
  echo_id  UUID NOT NULL REFERENCES echos(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (echo_id, user_id)
);

COMMENT ON TABLE echo_likes IS 'Junction table preventing duplicate echo likes.';

CREATE INDEX IF NOT EXISTS idx_echo_likes_user ON echo_likes (user_id);

-- ============================================================
-- CHALLENGES
-- Location-based fitness/creative challenges.
-- ============================================================
CREATE TABLE IF NOT EXISTS challenges (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
  template           VARCHAR(50)  NOT NULL,
  location           GEOMETRY(POINT, 4326) NOT NULL,
  parameters         JSONB        NOT NULL DEFAULT '{}',
  verification_level INT          NOT NULL DEFAULT 1,
  class              VARCHAR(20),
  total_completions  INT          NOT NULL DEFAULT 0,
  avg_rating         DOUBLE PRECISION NOT NULL DEFAULT 0,
  status             VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE challenges IS 'Fitness and creative micro-challenges pinned to map locations.';

CREATE INDEX IF NOT EXISTS idx_challenges_location ON challenges USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_challenges_status   ON challenges (status);
CREATE INDEX IF NOT EXISTS idx_challenges_template ON challenges (template);
CREATE INDEX IF NOT EXISTS idx_challenges_creator  ON challenges (creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_class    ON challenges (class);

-- ============================================================
-- CHALLENGE SUBMISSIONS
-- Player attempts at completing challenges.
-- ============================================================
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url    VARCHAR(500),
  verified     BOOLEAN     NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE challenge_submissions IS 'Player submissions for challenge verification.';

CREATE INDEX IF NOT EXISTS idx_challenge_subs_challenge ON challenge_submissions (challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_subs_user      ON challenge_submissions (user_id);

-- ============================================================
-- PETS
-- Companion animals that grow with the player.
-- ============================================================
CREATE TABLE IF NOT EXISTS pets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(50) NOT NULL,
  species           VARCHAR(20) NOT NULL DEFAULT 'dog',
  breed             VARCHAR(50),
  level             INT         NOT NULL DEFAULT 1,
  xp                BIGINT      NOT NULL DEFAULT 0,
  specialization    VARCHAR(20),
  total_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_walks       INT         NOT NULL DEFAULT 0,
  rare_finds        INT         NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pets IS 'Player companion pets with progression and specializations.';

CREATE INDEX IF NOT EXISTS idx_pets_owner          ON pets (owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_specialization ON pets (specialization);

-- ============================================================
-- TRAVEL ROUTES
-- Curated multi-spot exploration routes.
-- ============================================================
CREATE TABLE IF NOT EXISTS travel_routes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id        UUID         REFERENCES users(id) ON DELETE SET NULL,
  title             VARCHAR(200) NOT NULL,
  path              GEOMETRY(LINESTRING, 4326),
  total_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_rating        DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_ratings     INT          NOT NULL DEFAULT 0,
  status            VARCHAR(20)  NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE travel_routes IS 'Curated walking/cycling routes with points of interest.';

CREATE INDEX IF NOT EXISTS idx_travel_routes_path    ON travel_routes USING GIST (path);
CREATE INDEX IF NOT EXISTS idx_travel_routes_founder ON travel_routes (founder_id);
CREATE INDEX IF NOT EXISTS idx_travel_routes_status  ON travel_routes (status);
CREATE INDEX IF NOT EXISTS idx_travel_routes_rating  ON travel_routes (avg_rating DESC);

-- ============================================================
-- TRAVEL SPOTS
-- Points of interest within a travel route.
-- ============================================================
CREATE TABLE IF NOT EXISTS travel_spots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id    UUID NOT NULL REFERENCES travel_routes(id) ON DELETE CASCADE,
  location    GEOMETRY(POINT, 4326) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  media_url   VARCHAR(500),
  spot_order  INT  NOT NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE travel_spots IS 'Individual waypoints inside a travel route.';

CREATE INDEX IF NOT EXISTS idx_travel_spots_route    ON travel_spots (route_id);
CREATE INDEX IF NOT EXISTS idx_travel_spots_location ON travel_spots USING GIST (location);

-- ============================================================
-- RATINGS
-- Unified 3-axis rating system for quests, challenges, echos, routes.
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,
  target_id   UUID        NOT NULL,
  creativity  INT         NOT NULL CHECK (creativity BETWEEN 1 AND 5),
  difficulty  INT         NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  worth_it    INT         NOT NULL CHECK (worth_it BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ratings IS 'Three-axis (creativity, difficulty, worth_it) ratings for content.';

CREATE INDEX IF NOT EXISTS idx_ratings_target ON ratings (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user   ON ratings (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_unique
  ON ratings (user_id, target_type, target_id);

-- ============================================================
-- CLANS
-- Auto-generated social groups based on shared behaviour.
-- ============================================================
CREATE TABLE IF NOT EXISTS clans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type           VARCHAR(20)  NOT NULL,
  name           VARCHAR(100) NOT NULL,
  auto_generated BOOLEAN      NOT NULL DEFAULT TRUE,
  metadata       JSONB        NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clans IS 'Automatically formed social groups (commute, district, dog_park, route).';

ALTER TABLE clans ADD CONSTRAINT clans_type_name_unique UNIQUE (type, name);

CREATE INDEX IF NOT EXISTS idx_clans_type ON clans (type);

-- ============================================================
-- CLAN MEMBERS
-- Many-to-many join between users and clans.
-- ============================================================
CREATE TABLE IF NOT EXISTS clan_members (
  clan_id   UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clan_id, user_id)
);

COMMENT ON TABLE clan_members IS 'Membership junction for clans.';

CREATE INDEX IF NOT EXISTS idx_clan_members_user ON clan_members (user_id);

-- ============================================================
-- CLAN MESSAGES
-- Real-time chat messages within a clan.
-- ============================================================
CREATE TABLE IF NOT EXISTS clan_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_id    UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id),
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clan_messages IS 'Chat messages exchanged within a clan.';

CREATE INDEX IF NOT EXISTS idx_clan_messages_clan ON clan_messages (clan_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- Push / in-app notification queue.
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50)  NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  data       JSONB        NOT NULL DEFAULT '{}',
  read       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Queued push and in-app notifications per player.';

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications (user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);

-- ============================================================
-- REPORTS
-- User-submitted content moderation reports.
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID        REFERENCES users(id) ON DELETE SET NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id   UUID        NOT NULL,
  reason      TEXT        NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reports IS 'Content moderation reports submitted by players.';

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports (target_type, target_id);

-- ============================================================
-- USER TITLES / ACHIEVEMENTS
-- Earned prestige titles.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_titles (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_key VARCHAR(50) NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, title_key)
);

COMMENT ON TABLE user_titles IS 'Prestige titles unlocked by players.';

CREATE INDEX IF NOT EXISTS idx_user_titles_user ON user_titles (user_id);

-- ============================================================
-- FEED EVENTS
-- Activity stream for social features.
-- ============================================================
CREATE TABLE IF NOT EXISTS feed_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       VARCHAR(30) NOT NULL,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE feed_events IS 'Global activity feed for social interactions.';

CREATE INDEX IF NOT EXISTS idx_feed_events_created ON feed_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_events_user    ON feed_events (user_id);
CREATE INDEX IF NOT EXISTS idx_feed_events_type    ON feed_events (type);

-- ============================================================
-- ROUTE VISITS
-- Tracks how many times a user ran a specific route in a 24h window
-- for diminishing-returns calculation.
-- ============================================================
CREATE TABLE IF NOT EXISTS route_visits (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_hash VARCHAR(64) NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE route_visits IS 'Per-user route repeat tracking for diminishing returns.';

CREATE INDEX IF NOT EXISTS idx_route_visits_user_hash ON route_visits (user_id, route_hash);
CREATE INDEX IF NOT EXISTS idx_route_visits_visited   ON route_visits (visited_at);

-- ============================================================
-- ARTIFACTS
-- Geo-anchored creative content placed in owned territories.
-- ============================================================
CREATE TABLE IF NOT EXISTS artifacts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id        UUID         NOT NULL REFERENCES users(id),
  territory_id      UUID         REFERENCES territories(id),
  name              VARCHAR(100) NOT NULL,
  description       TEXT,
  type              VARCHAR(30)  NOT NULL DEFAULT 'trophy',
  rarity            VARCHAR(20)  NOT NULL DEFAULT 'common',
  location          GEOMETRY(POINT, 4326) NOT NULL,
  photo_url         TEXT,
  permanence_votes  INT          DEFAULT 0,
  is_permanent      BOOLEAN      DEFAULT FALSE,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  expires_at        TIMESTAMPTZ  DEFAULT (NOW() + INTERVAL '14 days')
);

COMMENT ON TABLE artifacts IS 'Geo-anchored creative artifacts placed in owned territories with community permanence voting.';

CREATE INDEX IF NOT EXISTS idx_artifacts_location ON artifacts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_artifacts_creator  ON artifacts (creator_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_territory ON artifacts (territory_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_permanent ON artifacts (is_permanent) WHERE is_permanent = TRUE;

-- ============================================================
-- PLACE HISTORY (Stadtgedächtnis / City Memory)
-- Geo-anchored event log: every claim, quest, echo, artifact
-- and challenge leaves a trace on the map.
-- ============================================================
CREATE TABLE IF NOT EXISTS place_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location   GEOMETRY(POINT, 4326) NOT NULL,
  grid_cell  VARCHAR(20)  NOT NULL,
  event_type VARCHAR(30)  NOT NULL,
  user_id    UUID         REFERENCES users(id),
  username   VARCHAR(50),
  data       JSONB        DEFAULT '{}',
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE place_history IS 'Geo-anchored event log powering the City Memory / Place Timeline feature.';

CREATE INDEX IF NOT EXISTS idx_place_history_cell     ON place_history (grid_cell, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_place_history_location ON place_history USING GIST (location);

-- ============================================================
-- NIGHT LAYER (Nacht-Layer) — time_window columns
-- Content can be restricted to day-only, night-only, or any time.
-- Night = 22:00–05:00 local server time.
-- ============================================================
ALTER TABLE quests      ADD COLUMN IF NOT EXISTS time_window VARCHAR(10) DEFAULT 'any';
ALTER TABLE echos       ADD COLUMN IF NOT EXISTS time_window VARCHAR(10) DEFAULT 'any';
ALTER TABLE challenges  ADD COLUMN IF NOT EXISTS time_window VARCHAR(10) DEFAULT 'any';

-- ============================================================
-- WEATHER CONDITIONS ON QUESTS AND CHALLENGES
-- Certain quests/challenges only activate in specific weather.
-- NULL = any weather (always active).
-- Valid values: 'rain', 'snow', 'fog', 'wind', 'storm', 'clear', 'cold', 'heat'
-- ============================================================
ALTER TABLE quests      ADD COLUMN IF NOT EXISTS weather_condition VARCHAR(20) DEFAULT NULL;
ALTER TABLE challenges  ADD COLUMN IF NOT EXISTS weather_condition VARCHAR(20) DEFAULT NULL;

COMMENT ON COLUMN quests.weather_condition IS 'If set, quest only appears when current weather matches. NULL = any weather.';
COMMENT ON COLUMN challenges.weather_condition IS 'If set, challenge only appears when current weather matches. NULL = any weather.';

-- ============================================================
-- SILENT ZONES
-- Community-proposed quiet areas where echos are forbidden
-- but special contemplative artifacts yield bonus XP.
-- ============================================================
CREATE TABLE IF NOT EXISTS silent_zones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  polygon         GEOMETRY(POLYGON, 4326) NOT NULL,
  created_by      UUID REFERENCES users(id),
  approved        BOOLEAN DEFAULT FALSE,
  approval_votes  INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE silent_zones IS 'Community-proposed quiet areas: no echos allowed, but special contemplative artifacts with bonus XP.';

CREATE INDEX IF NOT EXISTS idx_silent_zones_polygon  ON silent_zones USING GIST(polygon);
CREATE INDEX IF NOT EXISTS idx_silent_zones_approved ON silent_zones (approved) WHERE approved = TRUE;

-- ============================================================
-- SEED QUEST EXTENSIONS
-- Self-growing quests that evolve with community engagement.
-- ============================================================
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS growth_level INT DEFAULT 0; -- 0=seed, 1=sprout, 2=growing, 3=mature, 4=legendary
ALTER TABLE quests ADD COLUMN IF NOT EXISTS parent_quest_id UUID REFERENCES quests(id);
ALTER TABLE quests ADD COLUMN IF NOT EXISTS linked_quests UUID[] DEFAULT '{}';

COMMENT ON COLUMN quests.is_seed IS 'Whether this quest was planted as a seed quest.';
COMMENT ON COLUMN quests.growth_level IS 'Growth stage: 0=seed, 1=sprout, 2=growing, 3=mature, 4=legendary.';
COMMENT ON COLUMN quests.parent_quest_id IS 'Parent quest ID for growth-spawned bonus steps.';
COMMENT ON COLUMN quests.linked_quests IS 'Array of linked quest IDs for nearby seed quest chains.';

CREATE INDEX IF NOT EXISTS idx_quests_seed ON quests (is_seed) WHERE is_seed = TRUE;
CREATE INDEX IF NOT EXISTS idx_quests_growth ON quests (growth_level);

-- ============================================================
-- RESONANCE SPOTS
-- Cross-content synergy bonus when multiple content types
-- overlap at the same location.
-- ============================================================
CREATE TABLE IF NOT EXISTS resonance_spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location GEOMETRY(POINT, 4326) NOT NULL,
  grid_cell VARCHAR(20) NOT NULL,
  content_types TEXT[] NOT NULL, -- e.g., ['quest', 'echo', 'artifact', 'challenge']
  resonance_level INT DEFAULT 2, -- number of overlapping content types (min 2)
  bonus_multiplier NUMERIC(3,2) DEFAULT 1.25,
  discovered_by UUID REFERENCES users(id),
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- NULL = permanent
);

COMMENT ON TABLE resonance_spots IS 'Cross-content synergy spots where multiple content types overlap for bonus XP.';

CREATE INDEX IF NOT EXISTS idx_resonance_spots_location ON resonance_spots USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_resonance_spots_cell ON resonance_spots(grid_cell);

-- ============================================================
-- DUELS
-- Player-vs-player competitive encounters.
-- ============================================================
CREATE TABLE IF NOT EXISTS duels (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id     UUID NOT NULL REFERENCES users(id),
  defender_id       UUID NOT NULL REFERENCES users(id),
  location          GEOMETRY(POINT, 4326) NOT NULL,
  type              VARCHAR(30) NOT NULL DEFAULT 'speed_claim',
  status            VARCHAR(20) NOT NULL DEFAULT 'pending',
  winner_id         UUID REFERENCES users(id),
  challenger_score  NUMERIC DEFAULT 0,
  defender_score    NUMERIC DEFAULT 0,
  stake_territory_id UUID REFERENCES territories(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes')
);

COMMENT ON TABLE duels IS 'PvP duel challenges: speed_claim, distance, area, quiz.';

CREATE INDEX IF NOT EXISTS idx_duels_players  ON duels (challenger_id, defender_id);
CREATE INDEX IF NOT EXISTS idx_duels_location ON duels USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_duels_status   ON duels (status) WHERE status IN ('pending', 'active');

-- ============================================================
-- RACE TRACKS
-- Player-created race courses with leaderboards.
-- ============================================================
CREATE TABLE IF NOT EXISTS race_tracks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id        UUID NOT NULL REFERENCES users(id),
  name              VARCHAR(100) NOT NULL,
  description       TEXT,
  start_location    GEOMETRY(POINT, 4326) NOT NULL,
  end_location      GEOMETRY(POINT, 4326) NOT NULL,
  route_line        GEOMETRY(LINESTRING, 4326) NOT NULL,
  distance_m        NUMERIC NOT NULL,
  class             VARCHAR(20) NOT NULL DEFAULT 'runner',
  best_time_seconds NUMERIC,
  best_time_user_id UUID REFERENCES users(id),
  total_attempts    INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE race_tracks IS 'GPS race courses created by players with per-track leaderboards.';

CREATE INDEX IF NOT EXISTS idx_race_tracks_start   ON race_tracks USING GIST(start_location);
CREATE INDEX IF NOT EXISTS idx_race_tracks_creator ON race_tracks (creator_id);

-- ============================================================
-- RACE ATTEMPTS
-- Individual race runs with times and optional GPS traces.
-- ============================================================
CREATE TABLE IF NOT EXISTS race_attempts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id    UUID NOT NULL REFERENCES race_tracks(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  time_seconds NUMERIC NOT NULL,
  route_line  GEOMETRY(LINESTRING, 4326),
  is_record   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE race_attempts IS 'Individual race attempts with time records per track.';

CREATE INDEX IF NOT EXISTS idx_race_attempts_track ON race_attempts (track_id, time_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_race_attempts_user  ON race_attempts (user_id);

-- ============================================================
-- BOUNTIES
-- Player-placed or auto-generated bounties on dominant players.
-- ============================================================
CREATE TABLE IF NOT EXISTS bounties (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_id   UUID         NOT NULL REFERENCES users(id),
  target_id   UUID         NOT NULL REFERENCES users(id),
  reason      TEXT,
  xp_reward   INT          NOT NULL DEFAULT 500,
  is_auto     BOOLEAN      DEFAULT FALSE,
  status      VARCHAR(20)  NOT NULL DEFAULT 'active',
  claimed_by  UUID         REFERENCES users(id),
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  DEFAULT (NOW() + INTERVAL '7 days')
);

COMMENT ON TABLE bounties IS 'Player-placed or auto-generated bounties on territory dominators.';

CREATE INDEX IF NOT EXISTS idx_bounties_target ON bounties(target_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_issuer ON bounties(issuer_id);

-- ============================================================
-- ALIASES
-- Anonymous second identities for stealth gameplay.
-- ============================================================
CREATE TABLE IF NOT EXISTS aliases (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID         NOT NULL REFERENCES users(id) UNIQUE,
  alias_name     VARCHAR(50)  NOT NULL UNIQUE,
  alias_level    INT          DEFAULT 1,
  alias_xp       INT          DEFAULT 0,
  is_revealed    BOOLEAN      DEFAULT FALSE,
  revealed_by    UUID         REFERENCES users(id),
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  cooldown_until TIMESTAMPTZ
);

COMMENT ON TABLE aliases IS 'Anonymous second identities for stealth territory claiming.';

CREATE INDEX IF NOT EXISTS idx_aliases_user ON aliases(user_id);
CREATE INDEX IF NOT EXISTS idx_aliases_name ON aliases(alias_name);

-- ============================================================
-- TRAPS
-- Defensive mechanisms placed within owned territories.
-- ============================================================
CREATE TABLE IF NOT EXISTS traps (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id     UUID         NOT NULL REFERENCES users(id),
  territory_id UUID         NOT NULL REFERENCES territories(id),
  type         VARCHAR(30)  NOT NULL DEFAULT 'slow',
  location     GEOMETRY(POINT, 4326) NOT NULL,
  radius_m     INT          DEFAULT 50,
  is_active    BOOLEAN      DEFAULT TRUE,
  triggered_by UUID         REFERENCES users(id),
  triggered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  expires_at   TIMESTAMPTZ  DEFAULT (NOW() + INTERVAL '7 days')
);

COMMENT ON TABLE traps IS 'Defensive traps placed in owned territories: slow, alert, or decoy.';

CREATE INDEX IF NOT EXISTS idx_traps_location  ON traps USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_traps_territory ON traps(territory_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_traps_owner     ON traps(owner_id);

-- ============================================================
-- GAME EVENTS
-- Eclipse, King of the Hill, Blitz Claims, Mystery Zones,
-- Wave Attacks, Loot Drops — engagement drivers from Kreuzanalyse.
-- ============================================================
CREATE TABLE IF NOT EXISTS game_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            VARCHAR(30)  NOT NULL, -- 'eclipse', 'king_of_hill', 'wave_attack', 'blitz', 'mystery_zone', 'loot_drop'
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  location        GEOMETRY(POINT, 4326), -- NULL for global events
  radius_m        INT,
  status          VARCHAR(20)  NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed'
  config          JSONB        DEFAULT '{}', -- Event-specific config
  participants    UUID[]       DEFAULT '{}',
  winner_id       UUID         REFERENCES users(id),
  winner_clan_id  UUID         REFERENCES clans(id),
  starts_at       TIMESTAMPTZ  NOT NULL,
  ends_at         TIMESTAMPTZ  NOT NULL,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE game_events IS 'Scheduled and live game events: eclipse, king of hill, blitz, mystery zones, wave attacks.';

CREATE INDEX IF NOT EXISTS idx_events_status   ON game_events(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_location ON game_events USING GIST(location);

-- ============================================================
-- LOOT DROPS
-- Collectable items scattered on the map by the event engine.
-- ============================================================
CREATE TABLE IF NOT EXISTS loot_drops (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location     GEOMETRY(POINT, 4326) NOT NULL,
  type         VARCHAR(30)  NOT NULL DEFAULT 'xp', -- 'xp', 'title', 'artifact', 'streak_freeze'
  value        JSONB        NOT NULL, -- {"xp": 500} or {"title": "Lucky Finder"}
  collected_by UUID         REFERENCES users(id),
  spawned_at   TIMESTAMPTZ  DEFAULT NOW(),
  expires_at   TIMESTAMPTZ  DEFAULT (NOW() + INTERVAL '2 hours')
);

COMMENT ON TABLE loot_drops IS 'Collectable loot items scattered on the map, expire after 2 hours.';

CREATE INDEX IF NOT EXISTS idx_loot_location ON loot_drops USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_loot_active   ON loot_drops(collected_by) WHERE collected_by IS NULL;

-- ============================================================
-- MONUMENTS
-- Permanent markers left by players who went inactive 30+ days.
-- ============================================================
CREATE TABLE IF NOT EXISTS monuments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID         NOT NULL REFERENCES users(id),
  username     VARCHAR(50)  NOT NULL,
  location     GEOMETRY(POINT, 4326) NOT NULL,
  total_claims INT,
  total_xp     INT,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE monuments IS 'Permanent markers honouring long-inactive players at their most-claimed location.';

CREATE INDEX IF NOT EXISTS idx_monuments_location ON monuments USING GIST(location);

-- ============================================================
-- BALANCE MECHANICS — Home Zone + Daily Loss Tracking
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_zone_lat NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_zone_lng NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_zone_radius INT DEFAULT 200;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_territory_lost INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_loss_reset_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS return_bonus_until TIMESTAMPTZ;

-- ============================================================
-- ROUTE DELAY (Anti-Stalking)
-- Territories are not visible publicly until 15 min after creation.
-- ============================================================
ALTER TABLE territories ADD COLUMN IF NOT EXISTS visible_after TIMESTAMPTZ;

-- ============================================================
-- INVITES
-- Referral system: invite friends, earn bonus XP on first claim.
-- ============================================================
CREATE TABLE IF NOT EXISTS invites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id  UUID NOT NULL REFERENCES users(id),
  invite_code VARCHAR(12) NOT NULL UNIQUE,
  invitee_id  UUID REFERENCES users(id),
  status      VARCHAR(20) DEFAULT 'pending', -- 'pending', 'registered', 'first_claim', 'expired'
  bonus_awarded BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

COMMENT ON TABLE invites IS 'Referral invite codes with bonus tracking for inviter and invitee.';

CREATE INDEX IF NOT EXISTS idx_invites_code    ON invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);

-- ============================================================
-- ECHO MEDIA EXTENSIONS (Photo/Video Graffiti)
-- Extend echos beyond audio to support photo and video content.
-- ============================================================
ALTER TABLE echos ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'audio'; -- 'audio', 'photo', 'video'
ALTER TABLE echos ADD COLUMN IF NOT EXISTS media_url TEXT; -- For photo/video (audio_url remains for audio)
ALTER TABLE echos ADD COLUMN IF NOT EXISTS caption TEXT;
-- Make audio_url nullable for photo/video echos
ALTER TABLE echos ALTER COLUMN audio_url DROP NOT NULL;

-- ============================================================
-- TERRITORY DEFENSES
-- Multi-layer defense system: games, challenges, quests, echos.
-- Multiple defenses per territory (slot-based, limited by area).
-- Attacker must beat ALL active defenses to take the territory.
-- ============================================================
CREATE TABLE IF NOT EXISTS territory_defenses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  territory_id     UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  owner_id         UUID NOT NULL REFERENCES users(id),
  game_type        VARCHAR(30) NOT NULL, -- mini-games: 'rock_paper_scissors', 'coin_flip', 'odd_even', 'tic_tac_toe', 'mini_chess', 'sprint_race', 'trivia'
                                          -- content: 'challenge', 'quest', 'echo'
  config           JSONB NOT NULL DEFAULT '{}', -- game config OR linked item: {linked_id, linked_title, ...}
  owner_secret     TEXT, -- encrypted move/answer (null for non-secret games)
  owner_benchmark  JSONB, -- sprint time, step goal, etc.
  slot_index       INT NOT NULL DEFAULT 0, -- position in defense stack (0-based)
  status           VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'broken'
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE territory_defenses IS 'Multi-layer territory defenses. Each territory can have multiple defenses (slot-limited by area). Attacker must beat all to conquer.';

-- Allow MULTIPLE active defenses per territory (removed old unique constraint)
DROP INDEX IF EXISTS idx_defense_territory;
CREATE INDEX IF NOT EXISTS idx_defense_territory_active ON territory_defenses(territory_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_defense_owner ON territory_defenses(owner_id);

-- ============================================================
-- DEFENSE ATTEMPTS
-- Records of challengers attempting to beat territory defenses.
-- ============================================================
CREATE TABLE IF NOT EXISTS defense_attempts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  defense_id      UUID NOT NULL REFERENCES territory_defenses(id) ON DELETE CASCADE,
  challenger_id   UUID NOT NULL REFERENCES users(id),
  challenger_data JSONB NOT NULL DEFAULT '{}', -- move, time, answer, photo_url
  result          VARCHAR(10), -- 'won', 'lost', 'draw', 'pending'
  xp_awarded      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE defense_attempts IS 'Challenge attempts against territory defense mini-games.';

CREATE INDEX IF NOT EXISTS idx_attempts_defense ON defense_attempts(defense_id);
CREATE INDEX IF NOT EXISTS idx_attempts_challenger ON defense_attempts(challenger_id);

-- ============================================================
-- TERRITORY GAMES (Turn-based mini-games: Tic Tac Toe, Mini Chess)
-- Asynchronous strategy games for territory defense.
-- ============================================================
CREATE TABLE IF NOT EXISTS territory_games (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  territory_id    UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  defense_id      UUID REFERENCES territory_defenses(id) ON DELETE SET NULL,
  defender_id     UUID NOT NULL REFERENCES users(id),
  challenger_id   UUID NOT NULL REFERENCES users(id),
  game_type       VARCHAR(20) NOT NULL, -- 'tic_tac_toe', 'mini_chess'
  board_state     JSONB NOT NULL DEFAULT '{}',
  current_turn    UUID NOT NULL, -- player who plays next
  turn_number     INT NOT NULL DEFAULT 1,
  status          VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'forfeit', 'timeout', 'draw'
  winner_id       UUID REFERENCES users(id),
  turn_deadline   TIMESTAMPTZ NOT NULL,
  config          JSONB NOT NULL DEFAULT '{}', -- turn_timeout_hours, best_of, etc.
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

COMMENT ON TABLE territory_games IS 'Turn-based async mini-games (Tic Tac Toe, Mini Chess) for territory defense/attack.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_territory_games_active ON territory_games(territory_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_territory_games_players ON territory_games(defender_id, challenger_id);
CREATE INDEX IF NOT EXISTS idx_territory_games_turn ON territory_games(current_turn) WHERE status = 'active';

-- ============================================================
-- GAME MOVES (Individual moves in turn-based games)
-- ============================================================
CREATE TABLE IF NOT EXISTS game_moves (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id     UUID NOT NULL REFERENCES territory_games(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES users(id),
  move_data   JSONB NOT NULL, -- {position} for TTT, {from, to} for chess
  move_number INT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE game_moves IS 'Individual moves in turn-based territory games.';

CREATE INDEX IF NOT EXISTS idx_game_moves_game ON game_moves(game_id, move_number);

-- ============================================================
-- MEETUP EVENTS
-- Player-organized real-world meetups and gatherings.
-- ============================================================
CREATE TABLE IF NOT EXISTS meetup_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id    UUID NOT NULL REFERENCES users(id),
  location      GEOMETRY(POINT, 4326) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  event_date    TIMESTAMPTZ NOT NULL,
  category      VARCHAR(20) NOT NULL DEFAULT 'meetup', -- 'party', 'sport', 'gaming', 'meetup', 'other'
  max_attendees INT,
  status        VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'live', 'completed', 'cancelled'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE meetup_events IS 'Player-organized real-world meetups and gatherings on the map.';

CREATE INDEX IF NOT EXISTS idx_meetup_location ON meetup_events USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_meetup_date ON meetup_events(event_date) WHERE status IN ('active', 'live');
CREATE INDEX IF NOT EXISTS idx_meetup_creator ON meetup_events(creator_id);

-- ============================================================
-- MEETUP ATTENDEES
-- Players who joined a meetup event.
-- ============================================================
CREATE TABLE IF NOT EXISTS meetup_attendees (
  event_id   UUID NOT NULL REFERENCES meetup_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  is_present BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (event_id, user_id)
);

COMMENT ON TABLE meetup_attendees IS 'Junction table tracking meetup attendees and physical presence.';

-- ============================================================
-- MEETUP MESSAGES
-- Chat messages within a meetup event.
-- ============================================================
CREATE TABLE IF NOT EXISTS meetup_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES meetup_events(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id),
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE meetup_messages IS 'Chat messages exchanged between meetup attendees.';

CREATE INDEX IF NOT EXISTS idx_meetup_messages ON meetup_messages(event_id, created_at DESC);

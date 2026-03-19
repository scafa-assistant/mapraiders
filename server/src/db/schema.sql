-- ============================================================
-- Gridwalker Database Schema
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

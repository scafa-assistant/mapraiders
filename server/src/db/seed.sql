-- ============================================================
-- Gridwalker Seed Data
-- Development / testing data for local environment.
-- Run AFTER schema.sql has been applied.
-- ============================================================

-- Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- TEST USERS
-- Password for all test users: "test1234"
-- bcrypt hash generated with 10 rounds
-- ============================================================
INSERT INTO users (id, username, email, password_hash, level, xp, streak_days, reputation) VALUES
  ('00000000-0000-0000-0000-000000000001', 'TestWalker', 'walker@test.com',
   '$2a$10$D.tKxmRK4V4bRoFXrpSJIeSbdmFrhITIsspJnVCfs34EdCl7lEYY2', 25, 15000, 5, 1.2),
  ('00000000-0000-0000-0000-000000000002', 'DogLover', 'dog@test.com',
   '$2a$10$D.tKxmRK4V4bRoFXrpSJIeSbdmFrhITIsspJnVCfs34EdCl7lEYY2', 18, 8000, 12, 1.5),
  ('00000000-0000-0000-0000-000000000003', 'SpeedRunner', 'runner@test.com',
   '$2a$10$D.tKxmRK4V4bRoFXrpSJIeSbdmFrhITIsspJnVCfs34EdCl7lEYY2', 30, 25000, 3, 1.8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TERRITORIES (Berlin / Alexanderplatz area)
-- Schema columns: id, owner_id, polygon, class, claim_value, claimed_at, last_defended, decay_level
-- ============================================================
INSERT INTO territories (id, owner_id, polygon, class, claim_value, claimed_at, last_defended, decay_level) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   ST_GeomFromText('POLYGON((13.4050 52.5200, 13.4060 52.5200, 13.4060 52.5210, 13.4050 52.5210, 13.4050 52.5200))', 4326),
   'walker', 120, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 0.05),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   ST_GeomFromText('POLYGON((13.4070 52.5200, 13.4080 52.5200, 13.4080 52.5215, 13.4070 52.5215, 13.4070 52.5200))', 4326),
   'dog_walker', 180, NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours', 0.02),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
   ST_GeomFromText('POLYGON((13.4090 52.5190, 13.4110 52.5190, 13.4110 52.5205, 13.4090 52.5205, 13.4090 52.5190))', 4326),
   'runner', 250, NOW(), NOW(), 0.0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- QUESTS
-- Schema columns: id, creator_id, title, description, territory_id, difficulty,
--                 avg_rating, total_completions, status, created_at
-- ============================================================
INSERT INTO quests (id, creator_id, title, description, territory_id, difficulty, avg_rating, total_completions, status) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Alexanderplatz Discovery', 'Explore the iconic landmarks around Alexanderplatz and uncover its history.',
   '10000000-0000-0000-0000-000000000001', 3, 4.2, 12, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- QUEST STEPS
-- Schema columns: id, quest_id, step_order, type, location, radius_m,
--                 instruction, verification_type, expected_answer, hint
-- ============================================================
INSERT INTO quest_steps (id, quest_id, step_order, type, location, radius_m, instruction, verification_type, expected_answer, hint) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   1, 'FIND',
   ST_GeomFromText('POINT(13.4134 52.5219)', 4326), 30,
   'Find the World Clock at Alexanderplatz',
   'proximity', NULL, 'Look for the large rotating structure in the plaza'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
   2, 'SOLVE',
   ST_GeomFromText('POINT(13.4134 52.5219)', 4326), 50,
   'How many countries are shown on the World Clock?',
   'text', '148', 'Count the panels around the base'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
   3, 'FIND',
   ST_GeomFromText('POINT(13.4094 52.5208)', 4326), 40,
   'Walk to the Fernsehturm entrance and take a photo',
   'photo', NULL, 'The tall TV tower is hard to miss')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ECHOS
-- Schema columns: id, creator_id, location, radius_m, audio_url, likes,
--                 expires_at, status, created_at
-- ============================================================
INSERT INTO echos (id, creator_id, location, radius_m, audio_url, likes, expires_at, status) VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
   ST_GeomFromText('POINT(13.4050 52.5205)', 4326), 50,
   '/uploads/echos/sample-echo.mp3', 3,
   NOW() + INTERVAL '48 hours', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CHALLENGES
-- Schema columns: id, creator_id, template, location, parameters,
--                 verification_level (INT), class, total_completions,
--                 avg_rating, status, created_at
-- ============================================================
INSERT INTO challenges (id, creator_id, template, location, parameters, verification_level, class, total_completions, avg_rating, status) VALUES
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003',
   'distance_sprint',
   ST_GeomFromText('POINT(13.4100 52.5195)', 4326),
   '{"distance": 500, "time_limit_seconds": 180}'::jsonb,
   2, 'runner', 5, 3.8, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PETS
-- Schema columns: id, owner_id, name, species, breed, level, xp,
--                 specialization, total_distance_km, total_walks, rare_finds, created_at
-- ============================================================
INSERT INTO pets (id, owner_id, name, species, breed, level, xp, specialization, total_distance_km, total_walks, rare_finds) VALUES
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
   'Bruno', 'dog', 'Golden Retriever', 7, 3500, 'explorer', 85.5, 42, 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FEED EVENTS
-- Schema columns: id, type, user_id, data, created_at
-- ============================================================
INSERT INTO feed_events (type, user_id, data) VALUES
  ('claim', '00000000-0000-0000-0000-000000000001', '{"area": 8500, "class": "walker"}'::jsonb),
  ('claim', '00000000-0000-0000-0000-000000000002', '{"area": 12000, "class": "dog_walker"}'::jsonb),
  ('level_up', '00000000-0000-0000-0000-000000000003', '{"level": 30}'::jsonb),
  ('quest_complete', '00000000-0000-0000-0000-000000000001', '{"quest_title": "Alexanderplatz Discovery"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- USER TITLES
-- Schema columns: id, user_id, title_key, earned_at
-- ============================================================
INSERT INTO user_titles (user_id, title_key) VALUES
  ('00000000-0000-0000-0000-000000000001', 'early_adopter'),
  ('00000000-0000-0000-0000-000000000003', 'speed_demon'),
  ('00000000-0000-0000-0000-000000000002', 'dog_whisperer')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CLANS
-- Schema columns: id, type, name, auto_generated, metadata, created_at
-- ============================================================
INSERT INTO clans (id, type, name, auto_generated, metadata) VALUES
  ('70000000-0000-0000-0000-000000000001', 'district', 'Alexanderplatz Locals', TRUE,
   '{"center_lat": 52.5219, "center_lng": 13.4132}'::jsonb)
ON CONFLICT DO NOTHING;

-- CLAN MEMBERS
INSERT INTO clan_members (clan_id, user_id) VALUES
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

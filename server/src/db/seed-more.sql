-- ============================================================
-- MORE NPC Territories: Irregular organic shapes + German festivals
-- ============================================================

-- Helper: Create irregular territory (different shapes per type)
-- Type 1: Long street-like shape
CREATE OR REPLACE FUNCTION make_street_territory(cx double precision, cy double precision, len double precision, wid double precision, angle double precision)
RETURNS geometry AS $$
DECLARE
  ca double precision := cos(angle);
  sa double precision := sin(angle);
BEGIN
  RETURN ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
    ST_MakePoint(cx + len*ca - wid*sa, cy + len*sa + wid*ca),
    ST_MakePoint(cx + len*ca + wid*sa, cy + len*sa - wid*ca),
    ST_MakePoint(cx + len*0.3*ca + wid*1.2*sa, cy + len*0.3*sa - wid*1.2*ca),
    ST_MakePoint(cx - len*ca + wid*0.8*sa, cy - len*sa - wid*0.8*ca),
    ST_MakePoint(cx - len*ca - wid*sa, cy - len*sa + wid*ca),
    ST_MakePoint(cx - len*0.5*ca - wid*1.3*sa, cy - len*0.5*sa + wid*1.3*ca),
    ST_MakePoint(cx + len*ca - wid*sa, cy + len*sa + wid*ca)
  ])), 4326);
END;
$$ LANGUAGE plpgsql;

-- Type 2: Park/plaza blob shape
CREATE OR REPLACE FUNCTION make_blob_territory(cx double precision, cy double precision, r double precision, seed int)
RETURNS geometry AS $$
DECLARE
  pts geometry[];
  i int;
  a double precision;
  rr double precision;
BEGIN
  FOR i IN 0..7 LOOP
    a := i * 3.14159 * 2.0 / 8.0;
    rr := r * (0.7 + 0.6 * ((seed * (i+1) * 7 + 13) % 100) / 100.0);
    pts := pts || ST_MakePoint(cx + rr * cos(a), cy + rr * sin(a));
  END LOOP;
  pts := pts || pts[1]; -- close ring
  RETURN ST_SetSRID(ST_MakePolygon(ST_MakeLine(pts)), 4326);
END;
$$ LANGUAGE plpgsql;

-- Type 3: L-shaped territory
CREATE OR REPLACE FUNCTION make_l_territory(cx double precision, cy double precision, s double precision)
RETURNS geometry AS $$
BEGIN
  RETURN ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
    ST_MakePoint(cx, cy + s*1.5),
    ST_MakePoint(cx + s*0.8, cy + s*1.5),
    ST_MakePoint(cx + s*0.8, cy + s*0.3),
    ST_MakePoint(cx + s*1.8, cy + s*0.3),
    ST_MakePoint(cx + s*1.8, cy - s*0.5),
    ST_MakePoint(cx + s*0.3, cy - s*0.5),
    ST_MakePoint(cx + s*0.3, cy),
    ST_MakePoint(cx, cy),
    ST_MakePoint(cx, cy + s*1.5)
  ])), 4326);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MORE KÖLN (diverse shapes)
-- ============================================================
-- Köln Südstadt (street shape)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_street_territory(6.9585, 50.9255, 0.0015, 0.0004, 0.3), 'runner', 380, NOW()-INTERVAL '8 days', NOW()-INTERVAL '4 days'
FROM users WHERE username = 'LukasKoeln';

-- Köln Deutz (blob)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_blob_territory(6.9745, 50.9365, 0.0012, 42), 'walker', 440, NOW()-INTERVAL '6 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'EmmaWest';

-- Aachener Weiher Park (L-shape)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_l_territory(6.9345, 50.9340, 0.0008), 'cyclist', 360, NOW()-INTERVAL '9 days', NOW()-INTERVAL '5 days'
FROM users WHERE username = 'LukasKoeln';

-- ============================================================
-- MORE BERLIN (diverse shapes)
-- ============================================================
-- Potsdamer Platz (blob)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_blob_territory(13.3760, 52.5095, 0.0014, 17), 'walker', 700, NOW()-INTERVAL '2 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'MaxBerlin';

-- Friedrichshain RAW (street)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_street_territory(13.4545, 52.5085, 0.0018, 0.0005, 1.2), 'runner', 530, NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'MiaMoves';

-- Tiergarten (L-shape)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_l_territory(13.3505, 52.5145, 0.0012), 'cyclist', 620, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'MaxBerlin';

-- Neukölln Schillerkiez (blob)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_blob_territory(13.4225, 52.4745, 0.0011, 33), 'walker', 350, NOW()-INTERVAL '7 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'MiaMoves';

-- ============================================================
-- MORE MÜNCHEN (diverse shapes)
-- ============================================================
-- Viktualienmarkt (blob)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_blob_territory(11.5765, 48.1350, 0.0010, 55), 'walker', 600, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'DavidMuc';

-- Isar Flaucher (street)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_street_territory(11.5640, 48.1155, 0.0020, 0.0005, 1.8), 'runner', 480, NOW()-INTERVAL '6 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'DavidMuc';

-- ============================================================
-- MORE HAMBURG (diverse shapes)
-- ============================================================
-- Reeperbahn (street)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_street_territory(9.9620, 53.5495, 0.0016, 0.0004, 0.5), 'runner', 550, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'FelixHH';

-- Alster (blob)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_blob_territory(9.9945, 53.5615, 0.0018, 77), 'cyclist', 680, NOW()-INTERVAL '2 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'MilaHH';

-- ============================================================
-- MORE NRW CITIES
-- ============================================================
-- Essen Rüttenscheid (street)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_street_territory(7.0055, 51.4395, 0.0014, 0.0004, 0.8), 'runner', 380, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'BenEssen';

-- Bochum Stadtpark (blob)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_blob_territory(7.2225, 51.4745, 0.0015, 29), 'walker', 340, NOW()-INTERVAL '7 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'TimoWalks';

-- Wuppertal Nordpark (L-shape)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_l_territory(7.1385, 51.2625, 0.0009), 'cyclist', 310, NOW()-INTERVAL '9 days', NOW()-INTERVAL '4 days'
FROM users WHERE username = 'JannikR';

-- Münster Aasee (blob)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_blob_territory(7.6135, 51.9505, 0.0016, 61), 'walker', 420, NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'LauraFit';

-- Bonn Rheinaue (street)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_street_territory(7.1225, 50.7145, 0.0020, 0.0006, 1.5), 'cyclist', 460, NOW()-INTERVAL '6 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'LenaM_';

-- ============================================================
-- MORE SAUERLAND (diverse shapes near user)
-- ============================================================
-- Hachen Schützenhalle (blob)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_blob_territory(7.9835, 51.3776, 0.0009, 88), 'walker', 260, NOW()-INTERVAL '11 days', NOW()-INTERVAL '5 days'
FROM users WHERE username = 'TimoWalks';

-- Sundern Freibad (L-shape)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_l_territory(8.0025, 51.3265, 0.0007), 'runner', 290, NOW()-INTERVAL '8 days', NOW()-INTERVAL '4 days'
FROM users WHERE username = 'SarahK92';

-- Arnsberg Neumarkt (street)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_street_territory(8.0705, 51.3955, 0.0012, 0.0004, 0.6), 'walker', 350, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'JannikR';

-- Neheim Möhnestraße (street)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_street_territory(7.9645, 51.4505, 0.0013, 0.0003, 1.1), 'runner', 310, NOW()-INTERVAL '6 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'LauraFit';

-- Hüsten Ruhr-Promenade (street)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_street_territory(7.9755, 51.4345, 0.0015, 0.0004, 0.2), 'cyclist', 280, NOW()-INTERVAL '10 days', NOW()-INTERVAL '5 days'
FROM users WHERE username = 'SophieRun';

-- ============================================================
-- FESTIVALS & EVENTS (as NPC meetup_events)
-- ============================================================

-- Kölner Karneval (Rosenmontagszug)
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(6.9578, 50.9413), 4326),
  'Kölner Karneval Treff', 'Rosenmontagszug gemeinsam schauen! Treffpunkt am Dom. Kostüm erwünscht!',
  '2027-02-15 10:00:00+01', 'party', 100, 'active'
FROM users WHERE username = 'LukasKoeln';

-- Oktoberfest München
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(11.5497, 48.1316), 4326),
  'Oktoberfest MapRaiders Meetup', 'Wiesn-Treff für MapRaiders Spieler! Gemeinsam Territorien auf der Theresienwiese claimen.',
  '2026-09-19 14:00:00+02', 'party', 50, 'active'
FROM users WHERE username = 'DavidMuc';

-- Christopher Street Day Köln
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(6.9530, 50.9380), 4326),
  'CSD Köln - Walk & Claim', 'Beim CSD mitlaufen und dabei die Paradestrecke claimen! Pride Territory!',
  '2026-07-05 12:00:00+02', 'meetup', 200, 'active'
FROM users WHERE username = 'EmmaWest';

-- Schützenfest Neheim
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(7.9595, 51.4536), 4326),
  'Neheimer Schützenfest Walk', 'Schützenfest Neheim! Gemeinsam über den Festplatz laufen und Territorien abstecken.',
  '2026-07-11 16:00:00+02', 'party', 30, 'active'
FROM users WHERE username = 'GridGuard';

-- Hamburger Hafengeburtstag
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(9.9695, 53.5460), 4326),
  'Hafengeburtstag Hamburg Territory Run', 'Hafen-Meile entlang rennen und die Elbe claimen!',
  '2026-05-08 11:00:00+02', 'sport', 40, 'active'
FROM users WHERE username = 'FelixHH';

-- Berlin Festival of Lights
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(13.3777, 52.5163), 4326),
  'Festival of Lights Night Walk', 'Nachts durch Berlin laufen und beleuchtete Territorien claimen! 2x XP Nacht-Bonus!',
  '2026-10-10 20:00:00+02', 'meetup', 60, 'active'
FROM users WHERE username = 'MaxBerlin';

-- Cranger Kirmes (Herne, NRW)
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(7.1885, 51.5395), 4326),
  'Cranger Kirmes Territory Battle', 'Größte Kirmes NRWs! Wer claimt den Rummelplatz?',
  '2026-08-06 15:00:00+02', 'party', 50, 'active'
FROM users WHERE username = 'NiklasNRW';

-- Sauerland Wandertag
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(7.9518, 51.3468), 4326),
  'Sorpesee Hundespaziergang', 'Gemeinsamer Hundespaziergang am Sorpesee! Bring deinen Vierbeiner mit.',
  '2026-04-12 10:00:00+02', 'dog_walk', 20, 'active'
FROM users WHERE username = 'NightOwl';

-- Rhein in Flammen Bonn
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(7.1010, 50.7340), 4326),
  'Rhein in Flammen Walk', 'Feuerwerk am Rhein + Nacht-Territory-Run! Wer claimt das Rheinufer?',
  '2026-05-02 19:00:00+02', 'party', 40, 'active'
FROM users WHERE username = 'LenaM_';

-- Dortmunder Weihnachtsmarkt
INSERT INTO meetup_events (creator_id, location, name, description, event_date, category, max_attendees, status)
SELECT id, ST_SetSRID(ST_MakePoint(7.4665, 51.5135), 4326),
  'Weihnachtsmarkt Territory Walk', 'Glühwein trinken und dabei den Weihnachtsmarkt claimen!',
  '2026-12-05 17:00:00+01', 'meetup', 30, 'active'
FROM users WHERE username = 'PaulDTM';

-- Summary
SELECT 'Territories' as type, COUNT(*) as total FROM territories WHERE owner_id IS NOT NULL
UNION ALL
SELECT 'Events' as type, COUNT(*) as total FROM meetup_events WHERE status = 'active';

-- Drop helper functions
DROP FUNCTION IF EXISTS make_street_territory;
DROP FUNCTION IF EXISTS make_blob_territory;
DROP FUNCTION IF EXISTS make_l_territory;

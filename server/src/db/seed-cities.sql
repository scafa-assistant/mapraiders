-- ============================================================
-- NPC Territory Seed: German Major Cities + Sauerland
-- Real hotspots with realistic polygon shapes
-- ============================================================

-- Helper function to create hexagon territory around a point
CREATE OR REPLACE FUNCTION make_hex_territory(cx double precision, cy double precision, r double precision)
RETURNS geometry AS $$
SELECT ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(cx, cy + r),
  ST_MakePoint(cx + r*0.866, cy + r*0.5),
  ST_MakePoint(cx + r*0.866, cy - r*0.5),
  ST_MakePoint(cx, cy - r),
  ST_MakePoint(cx - r*0.866, cy + r*0.5 - r),
  ST_MakePoint(cx - r*0.866, cy + r*0.5),
  ST_MakePoint(cx, cy + r)
])), 4326);
$$ LANGUAGE sql;

-- ============================================================
-- KÖLN (LukasKoeln + EmmaWest)
-- ============================================================
-- Kölner Dom
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(6.9578, 50.9413, 0.0012), 'walker', 650, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'LukasKoeln';

-- Heumarkt Köln
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(6.9612, 50.9365, 0.0010), 'runner', 480, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'LukasKoeln';

-- Rheinauhafen
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(6.9645, 50.9290, 0.0014), 'cyclist', 520, NOW()-INTERVAL '4 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'EmmaWest';

-- Ehrenfeld Venloer Straße
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(6.9215, 50.9485, 0.0011), 'walker', 380, NOW()-INTERVAL '7 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'EmmaWest';

-- ============================================================
-- DÜSSELDORF (NiklasNRW + BenEssen)
-- ============================================================
-- Altstadt Düsseldorf
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(6.7735, 51.2270, 0.0012), 'walker', 580, NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'NiklasNRW';

-- Medienhafen
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(6.7625, 51.2180, 0.0013), 'runner', 450, NOW()-INTERVAL '6 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'NiklasNRW';

-- Königsallee
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(6.7822, 51.2250, 0.0010), 'walker', 620, NOW()-INTERVAL '2 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'BenEssen';

-- ============================================================
-- DORTMUND (PaulDTM + SophieRun)
-- ============================================================
-- Westfalenpark
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(7.4745, 51.4945, 0.0015), 'walker', 420, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'PaulDTM';

-- Alter Markt Dortmund
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(7.4665, 51.5135, 0.0011), 'runner', 550, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'PaulDTM';

-- Dortmunder U
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(7.4505, 51.5150, 0.0012), 'cyclist', 480, NOW()-INTERVAL '6 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'SophieRun';

-- ============================================================
-- ESSEN (BenEssen)
-- ============================================================
-- Zollverein
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(7.0475, 51.4865, 0.0014), 'walker', 500, NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'BenEssen';

-- Baldeneysee
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(7.0130, 51.4080, 0.0016), 'cyclist', 440, NOW()-INTERVAL '8 days', NOW()-INTERVAL '4 days'
FROM users WHERE username = 'BenEssen';

-- ============================================================
-- BERLIN (MaxBerlin + MiaMoves)
-- ============================================================
-- Brandenburger Tor
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(13.3777, 52.5163, 0.0012), 'walker', 800, NOW()-INTERVAL '2 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'MaxBerlin';

-- Alexanderplatz
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(13.4132, 52.5219, 0.0013), 'runner', 720, NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'MaxBerlin';

-- Kreuzberg Görlitzer Park
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(13.4370, 52.4960, 0.0015), 'walker', 550, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'MiaMoves';

-- Mauerpark
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(13.4025, 52.5430, 0.0014), 'runner', 600, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'MiaMoves';

-- ============================================================
-- MÜNCHEN (DavidMuc)
-- ============================================================
-- Marienplatz
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(11.5755, 48.1372, 0.0011), 'walker', 750, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'DavidMuc';

-- Englischer Garten
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(11.5920, 48.1545, 0.0018), 'cyclist', 680, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'DavidMuc';

-- Olympiapark
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(11.5530, 48.1755, 0.0016), 'runner', 580, NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'DavidMuc';

-- ============================================================
-- HAMBURG (FelixHH + MilaHH)
-- ============================================================
-- Landungsbrücken
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(9.9695, 53.5460, 0.0013), 'walker', 620, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'FelixHH';

-- Schanzenviertel
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(9.9655, 53.5630, 0.0012), 'runner', 480, NOW()-INTERVAL '6 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'FelixHH';

-- Speicherstadt
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(9.9915, 53.5435, 0.0014), 'walker', 700, NOW()-INTERVAL '2 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'MilaHH';

-- Planten un Blomen
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(9.9815, 53.5575, 0.0015), 'cyclist', 520, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'MilaHH';

-- ============================================================
-- FRANKFURT (AnnaFfm)
-- ============================================================
-- Römerberg
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(8.6820, 50.1105, 0.0011), 'walker', 580, NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'AnnaFfm';

-- Mainufer/Sachsenhausen
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(8.6865, 50.1045, 0.0013), 'runner', 450, NOW()-INTERVAL '6 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'AnnaFfm';

-- Palmengarten
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(8.6590, 50.1225, 0.0014), 'cyclist', 500, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'AnnaFfm';

-- ============================================================
-- STUTTGART (LeaStgt)
-- ============================================================
-- Schlossplatz
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(9.1800, 48.7785, 0.0012), 'walker', 540, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'LeaStgt';

-- Königstraße
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(9.1792, 48.7755, 0.0010), 'runner', 460, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'LeaStgt';

-- ============================================================
-- DRESDEN (JonasDD)
-- ============================================================
-- Frauenkirche
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(13.7415, 51.0520, 0.0011), 'walker', 560, NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'JonasDD';

-- Zwinger
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(13.7345, 51.0535, 0.0013), 'runner', 500, NOW()-INTERVAL '6 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'JonasDD';

-- ============================================================
-- LEIPZIG (ClaraLP)
-- ============================================================
-- Augustusplatz
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(12.3820, 51.3390, 0.0012), 'walker', 490, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'ClaraLP';

-- Karli (Karl-Liebknecht-Straße)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(12.3755, 51.3285, 0.0011), 'runner', 420, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'ClaraLP';

-- ============================================================
-- EXTRA NRW: Bochum, Duisburg, Wuppertal
-- ============================================================
-- Bochum Bermuda3eck (TimoWalks)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(7.2165, 51.4815, 0.0011), 'walker', 380, NOW()-INTERVAL '6 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'TimoWalks';

-- Duisburg Innenhafen (SarahK92)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(6.7620, 51.4375, 0.0013), 'runner', 420, NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'SarahK92';

-- Wuppertal Schwebebahn Station (JannikR)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(7.1505, 51.2555, 0.0012), 'walker', 350, NOW()-INTERVAL '7 days', NOW()-INTERVAL '3 days'
FROM users WHERE username = 'JannikR';

-- Münster Prinzipalmarkt (LauraFit)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(7.6280, 51.9625, 0.0011), 'runner', 480, NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'
FROM users WHERE username = 'LauraFit';

-- Bonn Marktplatz (LenaM_)
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, make_hex_territory(7.1010, 50.7340, 0.0012), 'walker', 440, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days'
FROM users WHERE username = 'LenaM_';

-- Drop helper function
DROP FUNCTION make_hex_territory;

-- Final count
SELECT u.username, u.territory_color, COUNT(t.id) as territories
FROM users u JOIN territories t ON t.owner_id = u.id
GROUP BY u.username, u.territory_color
ORDER BY territories DESC, u.username;

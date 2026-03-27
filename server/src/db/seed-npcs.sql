-- ============================================================
-- NPC Territory Seed: Real Hotspots Sundern → Arnsberg → Neheim
-- ============================================================

-- GRIDGUARD (Red #FF4757) - Arnsberg + Neheim
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(8.0632, 51.3980), ST_MakePoint(8.0645, 51.3978),
  ST_MakePoint(8.0648, 51.3972), ST_MakePoint(8.0640, 51.3968),
  ST_MakePoint(8.0628, 51.3970), ST_MakePoint(8.0625, 51.3976),
  ST_MakePoint(8.0632, 51.3980)])), 4326), 'walker', 450, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'
FROM users WHERE username = 'GridGuard';

INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(8.0606, 51.4022), ST_MakePoint(8.0620, 51.4020),
  ST_MakePoint(8.0622, 51.4014), ST_MakePoint(8.0612, 51.4010),
  ST_MakePoint(8.0600, 51.4013), ST_MakePoint(8.0598, 51.4019),
  ST_MakePoint(8.0606, 51.4022)])), 4326), 'runner', 380, NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'
FROM users WHERE username = 'GridGuard';

INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(7.9595, 51.4536), ST_MakePoint(7.9610, 51.4534),
  ST_MakePoint(7.9612, 51.4528), ST_MakePoint(7.9602, 51.4524),
  ST_MakePoint(7.9588, 51.4526), ST_MakePoint(7.9586, 51.4532),
  ST_MakePoint(7.9595, 51.4536)])), 4326), 'walker', 520, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
FROM users WHERE username = 'GridGuard';

INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(7.9608, 51.4528), ST_MakePoint(7.9622, 51.4527),
  ST_MakePoint(7.9624, 51.4521), ST_MakePoint(7.9614, 51.4518),
  ST_MakePoint(7.9602, 51.4520), ST_MakePoint(7.9600, 51.4525),
  ST_MakePoint(7.9608, 51.4528)])), 4326), 'runner', 410, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'
FROM users WHERE username = 'GridGuard';

-- STREETRUNNER (Purple #7B61FF) - Sundern Zentrum
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(8.0072, 51.3303), ST_MakePoint(8.0086, 51.3301),
  ST_MakePoint(8.0088, 51.3295), ST_MakePoint(8.0078, 51.3291),
  ST_MakePoint(8.0065, 51.3293), ST_MakePoint(8.0063, 51.3299),
  ST_MakePoint(8.0072, 51.3303)])), 4326), 'runner', 350, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days'
FROM users WHERE username = 'StreetRunner';

INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(8.0050, 51.3286), ST_MakePoint(8.0065, 51.3284),
  ST_MakePoint(8.0067, 51.3278), ST_MakePoint(8.0055, 51.3274),
  ST_MakePoint(8.0043, 51.3277), ST_MakePoint(8.0042, 51.3283),
  ST_MakePoint(8.0050, 51.3286)])), 4326), 'walker', 300, NOW() - INTERVAL '8 days', NOW() - INTERVAL '4 days'
FROM users WHERE username = 'StreetRunner';

-- CITYWALKER (Green #00FF88) - Hachen + Müschede
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(7.9818, 51.3773), ST_MakePoint(7.9835, 51.3771),
  ST_MakePoint(7.9837, 51.3765), ST_MakePoint(7.9825, 51.3761),
  ST_MakePoint(7.9812, 51.3763), ST_MakePoint(7.9810, 51.3769),
  ST_MakePoint(7.9818, 51.3773)])), 4326), 'walker', 280, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'
FROM users WHERE username = 'CityWalker';

INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(7.9782, 51.3820), ST_MakePoint(7.9798, 51.3818),
  ST_MakePoint(7.9800, 51.3812), ST_MakePoint(7.9790, 51.3808),
  ST_MakePoint(7.9776, 51.3810), ST_MakePoint(7.9774, 51.3816),
  ST_MakePoint(7.9782, 51.3820)])), 4326), 'cyclist', 400, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'
FROM users WHERE username = 'CityWalker';

INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(7.9962, 51.4055), ST_MakePoint(7.9978, 51.4053),
  ST_MakePoint(7.9980, 51.4047), ST_MakePoint(7.9968, 51.4043),
  ST_MakePoint(7.9955, 51.4046), ST_MakePoint(7.9954, 51.4052),
  ST_MakePoint(7.9962, 51.4055)])), 4326), 'walker', 250, NOW() - INTERVAL '12 days', NOW() - INTERVAL '6 days'
FROM users WHERE username = 'CityWalker';

-- NIGHTOWL (Gold #FFB800) - Sorpesee + Langscheid
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(7.9518, 51.3468), ST_MakePoint(7.9536, 51.3466),
  ST_MakePoint(7.9538, 51.3458), ST_MakePoint(7.9526, 51.3454),
  ST_MakePoint(7.9512, 51.3456), ST_MakePoint(7.9510, 51.3464),
  ST_MakePoint(7.9518, 51.3468)])), 4326), 'walker', 480, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
FROM users WHERE username = 'NightOwl';

INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(7.9542, 51.3514), ST_MakePoint(7.9558, 51.3512),
  ST_MakePoint(7.9560, 51.3505), ST_MakePoint(7.9548, 51.3501),
  ST_MakePoint(7.9535, 51.3504), ST_MakePoint(7.9534, 51.3510),
  ST_MakePoint(7.9542, 51.3514)])), 4326), 'cyclist', 360, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'
FROM users WHERE username = 'NightOwl';

-- TRAILBLAZER (Pink #FF69B4) - Hüsten + Neheim + Arnsberg
INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(7.9695, 51.4390), ST_MakePoint(7.9712, 51.4388),
  ST_MakePoint(7.9714, 51.4382), ST_MakePoint(7.9702, 51.4378),
  ST_MakePoint(7.9688, 51.4380), ST_MakePoint(7.9687, 51.4386),
  ST_MakePoint(7.9695, 51.4390)])), 4326), 'runner', 320, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days'
FROM users WHERE username = 'TrailBlazer';

INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(7.9568, 51.4548), ST_MakePoint(7.9582, 51.4546),
  ST_MakePoint(7.9584, 51.4540), ST_MakePoint(7.9574, 51.4536),
  ST_MakePoint(7.9560, 51.4538), ST_MakePoint(7.9558, 51.4544),
  ST_MakePoint(7.9568, 51.4548)])), 4326), 'walker', 290, NOW() - INTERVAL '9 days', NOW() - INTERVAL '4 days'
FROM users WHERE username = 'TrailBlazer';

INSERT INTO territories (owner_id, polygon, class, claim_value, claimed_at, last_defended)
SELECT id, ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[
  ST_MakePoint(8.0644, 51.3933), ST_MakePoint(8.0658, 51.3931),
  ST_MakePoint(8.0660, 51.3925), ST_MakePoint(8.0650, 51.3921),
  ST_MakePoint(8.0636, 51.3923), ST_MakePoint(8.0635, 51.3929),
  ST_MakePoint(8.0644, 51.3933)])), 4326), 'cyclist', 340, NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'
FROM users WHERE username = 'TrailBlazer';

-- Summary
SELECT u.username, u.territory_color, COUNT(t.id) as territories
FROM users u LEFT JOIN territories t ON t.owner_id = u.id
WHERE u.username IN ('GridGuard','StreetRunner','CityWalker','NightOwl','TrailBlazer','DopeRunner')
GROUP BY u.username, u.territory_color ORDER BY u.username;

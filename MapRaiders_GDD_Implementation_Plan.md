# MapRaiders — GDD Implementation Plan (Master GDD v1.0 → Code)

> **Grundlage:** `MapRaiders_Master_GDD_v1.0.md` (Vision + Anhänge A–C) + vollständige Codebase-Analyse (Server 36 Services / 31 Routes / 45+ Tabellen, Mobile Expo SDK 55 / 5 Tabs / Zustand).
> **Leitprinzip:** Robuste Fundamente, die bleiben. Das Datenmodell wird EINMAL richtig entworfen (Phase 0), sodass Commander-Layer UND TCG später ohne Migrations-Schmerz daraufpassen.
> **Unantastbar:** Die laufende Play-Store-Submission (v1.0, versionCode 2). Alles hier ist additiv, feature-geflaggt oder server-seitig dormant bis v1 live ist.

---

## 0. ARCHITEKTUR-GRUNDSATZENTSCHEIDUNGEN (gelten für alle Phasen)

Diese 10 Entscheidungen sind das Fundament. Wer eine davon kippt, kippt den Plan.

### E1 — Ein Item-System für ALLES (Würfel, Truppen, Karten, Relikte)
Würfel (Phase C), Einheiten (A/C), TCG-Karten (E) und Ruinen-Relikte (A) sind **dasselbe Datenmodell**: ein Katalog (`item_definitions`) + Instanzen (`item_instances`). Die Burn-Mechanik des TCG, system-belohnte Match-Drops und das "Karte wird Truppe"-Einlösen sind dann nur Status-Übergänge derselben Tabelle — kein zweites Inventarsystem, keine Migration. (Pink-Slip-Item-Verlust zwischen Spielern: per Entscheidung 2026-06-12 GESTRICHEN — das Transfer-Event-Modell bleibt trotzdem, es trägt Marktplatz-Trades in Phase E.)

### E2 — Ressourcen als Append-only-Ledger, nicht als Spalten
Energie/Bauteile/Daten werden NICHT als `INT`-Spalten auf `users` geführt, sondern als Kontostand (`player_resources`) + unveränderliches Transaktionslog (`resource_transactions`). Grund: Der Marktplatz (E), Wager-Matches (E) und die KI-Ökonomie (D) brauchen auditierbare Geldflüsse — nachträglich ein Ledger einzuziehen wäre die teuerste Migration des Projekts. Anti-Cheat und Balancing bekommen das Log gratis.

### E3 — H3 in der App-Schicht, nicht in PostGIS
`h3-js` v4 (reines JS, läuft in Node 20 UND React Native ohne Native-Modul). H3-Zellen werden als `TEXT`-Spalte (`h3_cell`, B-Tree-Index) gespeichert; PostGIS bleibt für exakte Geometrie (Polygone, ST_Intersects), H3 für Bucketing/KI/Spawning. Keine `h3-pg`-Extension (hält Docker-Setup simpel). Auflösungen: **res 8** (~0,7 km² — Spawning/Fog-of-War), **res 6** (~36 km² — KI-Makro-Sektoren), **res 9** (Ruinen/Scavenging-Punkte).

### E4 — Feature-Flags server-seitig, Capabilities im Login
Neue Tabelle `feature_flags` + Endpoint `GET /api/features` + `capabilities`-Objekt in der Login/Refresh-Response. Mobile bekommt einen `featureStore` (Zustand), alle neuen UI-Einstiege rendern conditional. So shippen wir App-Code in vc3+ **dunkel** und schalten Features pro Umgebung/Prozentsatz frei, ohne Store-Release. (Heute existiert nur das hardcodierte `SHOW_TRAVEL_TAB`-Muster — das skaliert nicht.)

### E5 — Kampf-/Spiellogik bleibt 100 % backend-only
Wie heute (Duelle, Turn-Games, Decay): Würfelwürfe, Truppenkämpfe, Hack-Erfolge und KI-Züge werden NUR auf dem Server gewürfelt/berechnet. Der Client rendert Ergebnisse und Animationen. Seeds für Würfel: `crypto.randomInt` server-seitig, Ergebnis + Wurf-Log in DB (Disputes, Anti-Cheat, Replays).

### E6 — Jump&Run-Minigames als server-gehostete WebView (HTML5 Canvas)
`react-native-webview` neu als Dependency (einzige neue Native-Dependency des ganzen Plans → ein einziger neuer EAS-Build nötig, geht mit vc3 raus). Die Minigames selbst sind HTML5/Canvas, **vom Server ausgeliefert** (`/games/runner/v1/…`) — Updates ohne App-Release, prozedurale Level kommen als JSON vom Server, Score-Submit ist signiert (HMAC mit Session-Nonce gegen Replay). Das Hacking-Minigame (Frequenz-Matching) ist dagegen simpel genug für reines RN + Reanimated — keine WebView nötig.

### E7 — Lazy Evaluation nach bestehendem Muster, pro H3-Zelle
Die Welt wird nicht 24/7 simuliert. Muster wie heute beim Decay: Zustand wird berechnet, wenn (a) der tägliche Cron läuft oder (b) ein Spieler eine Zelle abruft (`territories?bbox` triggert `ensureCellSimulated(h3Cell)` mit Redis-Lock + Cooldown 10 min pro Zelle). KI-Truppenbewegungen werden als Zeitpläne gespeichert (`departs_at`, `arrives_at`) und beim Abruf materialisiert — exakt wie `turn_deadline` bei Turn-Games heute.

### E8 — OSM-Kontext über Overpass API, gecacht pro H3-Zelle
Keine eigene OSM-Datenbank (Planet-Import wäre Wartungs-Monster). Stattdessen: Overpass-API-Query pro res-8-Zelle bei Erstbedarf, Ergebnis klassifiziert zu **Biomen** (`water | forest | industrial | urban | rural | landmark`) und gecacht in `osm_context` (TTL 90 Tage). Rate-Limit-freundlich: max. 2 req/s, Redis-Queue, Fallback-Biom `urban`. Landmark-Erkennung (für Terminals): OSM-Tags `historic=*`, `tourism=attraction|viewpoint`, `amenity=townhall|marketplace`.

### E9 — Der LLM-General ist ein Cron-Consumer mit striktem JSON-Schema
Das LLM (Anthropic Haiku 4.5 primär, lokales Qwen via Ollama als Fallback-Option) wird alle 6 h pro **aktiver** res-6-Region mit einem kompakten Aggregat-Prompt gefüttert und MUSS gegen ein zod-Schema validierte Makro-Befehle liefern. Bei Schema-Fehler: 1 Retry, dann **regelbasierter Fallback-General** (deterministische FSM) — die KI ist nie down, nur dümmer. Story-Texte: nur Template-Slots füllen (kein Freitext direkt in Push), Safety-Filter davor.

### E10 — Terminologie & Lore-Mapping
Code behält `clans` (Tabellen/Routes umbenennen = sinnlose Churn). UI-Anzeigename wird über i18n-Key gesteuert ("Crew" als Anzeige ist eine 5-Minuten-Entscheidung, keine Architektur). Lore-Begriffe (Vril, Hyperboreer) leben in `item_definitions.lore` + i18n — Server-Code bleibt englisch-generisch (`npc_type: 'scout_disc'`, nicht `vril_auge`).

---

## PHASE 0 — FUNDAMENTE (vor allem anderen, parallel zum v1-Launch baubar)

**Ziel:** Die vier Querschnitts-Systeme, auf denen A–E stehen: Feature-Flags, Items, Ressourcen-Ledger, H3/OSM-Kontext. Kein sichtbares Gameplay — dafür nie wieder Fundament-Migrationen.

### DB (Migration `2026-06-xx_phase0_foundations.sql`)

```sql
-- Feature-Flags (E4)
CREATE TABLE IF NOT EXISTS feature_flags (
  key             VARCHAR(50) PRIMARY KEY,        -- 'pve_spawns', 'commander', 'tcg', ...
  enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_percent INT NOT NULL DEFAULT 100 CHECK (rollout_percent BETWEEN 0 AND 100),
  config          JSONB NOT NULL DEFAULT '{}',    -- Feature-spezifische Tuning-Werte
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item-Katalog (E1): Würfel, Einheiten, Karten, Relikte, Gebäude-Baupläne
CREATE TABLE IF NOT EXISTS item_definitions (
  id           VARCHAR(60) PRIMARY KEY,            -- 'dice_loaded', 'unit_tank_t1', 'card_carrier_s1_042'
  category     VARCHAR(20) NOT NULL,               -- 'dice' | 'unit' | 'card' | 'relic' | 'blueprint'
  rarity       VARCHAR(15) NOT NULL DEFAULT 'common',  -- common|uncommon|rare|epic|legendary|secret
  season       VARCHAR(20),                        -- NULL = evergreen; 'S1' etc. für TCG-Verknappung
  tradeable    BOOLEAN NOT NULL DEFAULT FALSE,     -- Policy-Hebel (Anhang B): Wager nur non-tradeable
  stats        JSONB NOT NULL DEFAULT '{}',        -- {faces:[1,2,3,null,null,null]} | {atk,def,speed,domain:'water'}
  lore         JSONB NOT NULL DEFAULT '{}',        -- {name_key, desc_key, faction:'hyperborean', art_url}
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item-Instanzen (E1): konkreter Besitz, inkl. Burn/Transfer-Lebenszyklus
CREATE TABLE IF NOT EXISTS item_instances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id VARCHAR(60) NOT NULL REFERENCES item_definitions(id),
  owner_id      UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL nach Konto-Löschung (Soft-Delete-Muster)
  status        VARCHAR(15) NOT NULL DEFAULT 'inventory',
    -- 'inventory' | 'equipped' | 'deployed' (als Truppe auf Karte) | 'staked' (in Wager) | 'burned' | 'listed' (Markt)
  mint_number   INT,                                -- TCG-Verknappung: Nr. der Auflage
  acquired_via  VARCHAR(20) NOT NULL,               -- 'hack' | 'loot' | 'scavenge' | 'booster' | 'trade' | 'wager' | 'seed'
  state         JSONB NOT NULL DEFAULT '{}',        -- Instanz-Zustand: {hp}, {deployed_territory_id}, ...
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_item_instances_owner ON item_instances(owner_id, status);

-- Item-Historie (Pink-Slip-Transfers, Burns, Trades — auditierbar)
CREATE TABLE IF NOT EXISTS item_events (
  id          BIGSERIAL PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES item_instances(id),
  event       VARCHAR(20) NOT NULL,    -- 'minted'|'transferred'|'burned'|'deployed'|'recalled'|'staked'|'won'|'lost'
  from_user   UUID, to_user UUID,
  context     JSONB NOT NULL DEFAULT '{}',  -- {battle_id} | {wager_id} | {market_listing_id}
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ressourcen-Ledger (E2)
CREATE TABLE IF NOT EXISTS player_resources (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource  VARCHAR(15) NOT NULL,      -- 'energy' | 'tech' | 'intel'
  balance   BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  PRIMARY KEY (user_id, resource)
);
CREATE TABLE IF NOT EXISTS resource_transactions (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL,
  resource   VARCHAR(15) NOT NULL,
  amount     BIGINT NOT NULL,           -- +Einnahme / -Ausgabe
  reason     VARCHAR(30) NOT NULL,      -- 'territory_tick'|'hack_reward'|'minigame'|'build_cost'|'airstrike'|'market'|...
  context    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_restx_user ON resource_transactions(user_id, created_at DESC);

-- H3-/OSM-Kontext (E3, E8)
CREATE TABLE IF NOT EXISTS osm_context (
  h3_cell    TEXT PRIMARY KEY,          -- res 8
  biome      VARCHAR(15) NOT NULL DEFAULT 'urban',  -- water|forest|industrial|urban|rural|landmark
  tags       JSONB NOT NULL DEFAULT '{}',
  landmarks  JSONB NOT NULL DEFAULT '[]',  -- [{name, lat, lng, osm_tags}]
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bestehende Tabellen: H3-Spalte nachrüsten (idempotent, kein Risiko für v1)
ALTER TABLE territories ADD COLUMN IF NOT EXISTS h3_cells TEXT[];      -- res-8-Zellen, die das Polygon schneidet
CREATE INDEX IF NOT EXISTS idx_territories_h3 ON territories USING GIN (h3_cells);
```

### Server
- **Neu:** `services/featureService.ts` (Flags lesen/cachen 60 s in Redis, `isEnabledFor(userId, key)` mit Prozent-Bucketing über `hash(userId+key)`), `services/itemService.ts` (mint/transfer/burn/deploy — IMMER in `transaction()`, IMMER mit `item_events`-Eintrag), `services/resourceService.ts` (`credit()/debit()` — debit prüft Balance im selben UPDATE … RETURNING, wirft bei Unterdeckung), `services/h3Service.ts` (Wrapper um h3-js: `cellsForPolygon`, `cellForPoint`, `gridDisk`), `services/osmContextService.ts` (Overpass-Fetch + Biom-Klassifikator + Redis-Queue).
- **Routes:** `GET /api/features` (public, gecacht), `GET /api/inventory` (+ Filter category/status), `GET /api/resources` (+ letzte 50 Transaktionen).
- **Cron:** `h3_backfill` (einmalig/nightly: `h3_cells` für bestehende Territorien füllen), `osm_prefetch` (nightly: Zellen mit Spieler-Aktivität der letzten 7 Tage vorab holen).
- **Deps:** `h3-js@^4`.
- **Login-Response erweitern:** `data.capabilities = { pve: bool, commander: bool, tcg: bool }` (additiv — bricht keinen vc2-Client).

### Mobile (shipped dunkel mit vc3)
- `store/featureStore.ts` (lädt `/api/features` beim Start + nach Login), `store/inventoryStore.ts`, `store/resourceStore.ts`.
- `services/api.ts`: Namespaces `featureApi`, `inventoryApi`, `resourceApi`.
- Noch KEINE sichtbare UI (HUD kommt in Phase B).

**Aufwand:** ~1 Woche (Server 4 Tage, Mobile 1 Tag, Tests/Seeds 1–2 Tage).
**Risiken:** Overpass-Rate-Limits (Mitigation: Queue + langer Cache + Fallback-Biom); h3-js-Bundle-Größe in RN (gering, ~100 KB).
**Explizit NICHT in Phase 0:** Gameplay, UI, NPCs, LLM. Nur Fundament + Flags.

---

## PHASE A — LORE-RESKIN + PvE-SPAWNS + HACKING (erster sichtbarer Content)

**Ziel:** Die Welt fühlt sich nach dem GDD an: Erdriss-Portale und Vril-Augen/Aether-Sauger erscheinen kontextbasiert auf der Map, Spieler hacken sie (Frequenz-Matching) und bekommen Einheiten/Intel/Tech. Sofortiger Retention-Content auf existierender Map-Infrastruktur.

### Design-Konkretisierung
- **Spawn-Regeln (server-seitig, pro res-8-Zelle, lazy bei Map-Abruf + nightly Cron):** Dichte abhängig von Spieleraktivität der Zelle (place_history zählt). Biom steuert Typ: `water` → Wasser-Einheiten-Loot, `forest`/`water` → Aether-Sauger (verankern sich, debuffen Territorium), `industrial` → Tech-Drohnen (mehr Bauteile), `landmark` → Terminal-Spawns (Phase A.2). Max. 3 aktive Spawns/Zelle, TTL 24–72 h.
- **Aether-Sauger als erstes "echtes" PvE:** spawnt NUR in/neben Spieler-Territorien, reduziert `claim_value`-Ertrag des Territoriums um 20 % (sichtbar im Territory-Detail), muss **physisch** besucht und gehackt werden → erzeugt den Kern-Loop "rausgehen, weil das Spiel dich ruft".
- **Hacking-Minigame (reines RN):** Frequenz-Matching = 2 überlagerte Sinuswellen (SVG/Reanimated), Spieler matcht per Slider Frequenz+Amplitude innerhalb Zeitlimit; Schwierigkeit nach NPC-Level. Client schickt nur `{spawnId, inputTrace}` — **Server entscheidet** Erfolg (Trace-Plausibilität + Toleranzfenster, E5). Erfolg: NPC-Kern färbt sich in Clan-Farbe (Animation), Item-Instanz (`unit_*`) wird gemintet + Ressourcen gutgeschrieben.
- **Erdriss-Portale:** reine Spawn-Inszenierung (Marker + Animation), kein eigenes System — Portale sind die Spawn-Quelle im UI.

### DB
```sql
CREATE TABLE IF NOT EXISTS pve_spawns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  h3_cell     TEXT NOT NULL,
  location    GEOMETRY(POINT, 4326) NOT NULL,
  npc_type    VARCHAR(30) NOT NULL,     -- 'scout_disc' | 'aether_leech' | 'tech_drone' | 'obsidian_guard'
  level       INT NOT NULL DEFAULT 1,
  biome       VARCHAR(15) NOT NULL,
  status      VARCHAR(15) NOT NULL DEFAULT 'active',  -- active|hacked|expired
  hacked_by   UUID REFERENCES users(id),
  anchored_territory_id UUID REFERENCES territories(id),  -- nur aether_leech
  loot        JSONB NOT NULL DEFAULT '{}',  -- {items:[def_ids], resources:{tech:5,intel:2}}
  spawned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pve_spawns_cell ON pve_spawns(h3_cell, status);
CREATE INDEX IF NOT EXISTS idx_pve_spawns_loc ON pve_spawns USING GIST(location);

CREATE TABLE IF NOT EXISTS hack_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spawn_id    UUID NOT NULL REFERENCES pve_spawns(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  success     BOOLEAN NOT NULL,
  input_trace JSONB NOT NULL DEFAULT '{}',   -- Anti-Cheat-Plausibilität
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Server
- **Neu:** `services/pveSpawnEngine.ts` (Spawn-Logik: `ensureCellSpawns(h3Cell)` lazy mit Redis-Cooldown 10 min, Biom→Typ-Matrix in `constants.ts`), `services/hackEngine.ts` (Proximity-Check ≤ 75 m via ST_DWithin, Server-Resolution, Loot-Vergabe via itemService+resourceService in EINER Transaktion).
- **Routes:** `GET /api/pve/spawns?bbox=` (nur wenn Flag `pve_spawns` für User an), `POST /api/pve/spawns/:id/hack`.
- **Cron:** `pve_spawn_tick` (06:00 UTC: Expired aufräumen, aktive Zellen nachfüllen), `aether_leech_tick` (04:10 UTC, direkt nach Decay: Sauger-Debuffs auf Territorien anwenden).
- **WS-Events:** `pve_spawned` (broadcastByProximity 2 km), `pve_hacked` (Proximity), `territory_leeched` (sendToUser an Owner — "Ein Aether-Sauger zapft dein Gebiet an!").
- **Rate-Limit:** max. 30 Hacks/Tag/User (Anti-Grind, Muster aus balanceService).

### Mobile
- `components/MapMarkers/PvESpawnMarker.tsx` (pulsierender Vril-Glow, violett `#7B61FF`-Familie — passt zum bestehenden Echo-Lila), `screens/map/HackingScreen.tsx` (Modal im MapStack, Reanimated-Wellen), `store/pveStore.ts`.
- **Dabei gleich:** `MarkerFactory`-Refactor (Echo/Challenge/Artifact/Meetup/PvE über eine Factory — der Explore-Report nennt das explizit als Schuld; jetzt ist der richtige Moment, weil ein 6. Marker-Typ dazukommt).
- Lore-Onboarding: 3 Story-Cards beim ersten PvE-Kontakt (i18n, 13 Sprachen wie gehabt).

### A.2 — Terminals + Jump&Run ✅ FERTIG (2026-06-12, Commit 6bd4b3f, produktiv deployed)
- **Umgesetzt mit einer Verbesserung gegenüber der Skizze:** Level wird SERVERSEITIG generiert (`terminalEngine.generateLevel`, mulberry32 aus sha256(spawnId) — deterministisch pro Terminal, faire Rangliste) und als JSON an das Spiel gereicht; das HTML5-Spiel (`server/public/games/runner/`, ausgeliefert unter `/games` VOR helmet mit eigener CSP) ist reiner Renderer. Kein Auth-Token in der iframe-URL — Host (Web/RN-WebView) macht Start/Submit, Spiel meldet per postMessage.
- Score-Submit HMAC-signiert (spawnId+userId+nonce+iat, Einmal-Nonce via Redis GETDEL), Plausibilität gegen server-seitiges `par` (maxScore/minDurationMs), Rangliste pro Terminal als Redis Sorted Set (atomares ZADD GT), Intel-Reward für die ersten 3 geschafften Runs/Tag.
- DB: `terminal_runs (id, spawn_id, user_id, score, duration_ms, finished, replay_hash, created_at)`. Flag `terminals` (Config `require_proximity` schaltet GPS-Pflicht ohne Deploy — aktuell AUS für Web-Testphase).
- Mobile-Code (react-native-webview 13.16.0 + TerminalScreen) ist dark-shipped → **braucht EAS-Build vc4**. Web spielt SOFORT auf mapraiders.com/play (Track W.2 damit teilerfüllt).

**Aufwand:** A.1 ~2 Wochen, A.2 ~2 Wochen.
**Risiken:** Spawn-Dichte-Balancing in dünn besiedelten Gebieten (Mitigation: Mindest-Spawns um jeden aktiven Spieler, wie heute Seed-Territorien); Hacking-Trace-Anti-Cheat anfangs simpel halten (Toleranz + Tagescap reicht für Beta).
**Explizit NICHT in Phase A:** Kampf gegen NPCs (draußen wird per GDD NICHT gekämpft), Gebäude, Truppen-Deployment (Einheiten landen nur im Inventar), Obsidian-Wächter-Angriffe (brauchen Commander-Layer).

---

## PHASE B — RESSOURCEN-TRINITÄT LIVE + GEBÄUDE STUFE 1

**Ziel:** Territorien generieren Energie, gehackte Einheiten liefern Tech, Minigames liefern Intel — und die ersten Gebäude (Schildgenerator, Raffinerie) machen Territorien strategisch wertvoll. Verstärkt den Kern-Loop, ohne neuen Layer.

### Design-Konkretisierung
- **Energie-Tick:** stündlich pro Territorium `claim_value × decay-Faktor × (1 + Raffinerie-Bonus) / 24`. Lazy + Cron-Hybrid: nightly Cron schreibt gut (Batch), `GET /api/resources` materialisiert seit-letztem-Tick on-the-fly (E7) — kein stündlicher Voll-Scan.
- **Schildgenerator (Stufe 1):** blockt den ersten Takeover-Versuch pro 24 h (integriert sich in das BESTEHENDE `territory_defenses`-System als neuer `game_type='shield'` — kein Parallelsystem!). **Raffinerie:** +25 % Energie-Tick.
- Baukosten in Tech+Energie, Bauzeit real (z. B. 2 h, `completes_at`), Abriss erstattet 50 %.

### DB
```sql
CREATE TABLE IF NOT EXISTS buildings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id  UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  owner_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  type          VARCHAR(30) NOT NULL,    -- 'shield_generator'|'refinery'  (B); 'radar'|'garrison'|'silo'|'teleporter' (C); 'archive' (E)
  tier          INT NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 3),
  status        VARCHAR(15) NOT NULL DEFAULT 'building',  -- building|active|damaged|destroyed
  hp            INT NOT NULL DEFAULT 100,
  completes_at  TIMESTAMPTZ,
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buildings_territory ON buildings(territory_id, status);
-- Slot-Limit nach Territoriums-Fläche (wie heute defense slots): in App-Logik, Konstante BUILDING_SLOTS_PER_AREA
```

### Server
- **Neu:** `services/buildingEngine.ts` (Bau/Upgrade/Abriss, Slot-Validierung, Effekt-Resolver `getTerritoryEffects(territoryId)` → wird von decayEngine, claimEngine und Energie-Tick konsumiert), Erweiterung `resourceService` um Energie-Tick.
- **Routes:** `GET/POST /api/territories/:id/buildings`, `DELETE /api/buildings/:id`.
- **Cron:** `energy_tick` (nightly Batch 03:30 UTC), `building_completion` (alle 10 min: `status building→active` wo `completes_at <= NOW()`, Push "Raffinerie fertig").
- **Decay-Integration:** Schildgenerator verlangsamt Decay-Phase 1 um 25 % (eine Zeile im decayEngine-Faktor — Effekt-Resolver macht's sauber).

### Mobile
- `components/HUD/ResourceBar.tsx` (oben auf MapScreen, hinter Flag `resources`), Territory-Detail bekommt Gebäude-Sektion (Bauen/Upgrade/Timer), `BuildingPickerSheet.tsx`.
- Erste Lore-Verankerung im UI: Ressourcen-Icons im Vril-Stil.

**Aufwand:** ~2 Wochen.
**Risiken:** Ökonomie-Balancing (Energie-Inflation) → alle Raten in `feature_flags.config` statt hardcoded, live nachjustierbar; Ledger macht Fehlbuchungen reversibel.
**Explizit NICHT in Phase B:** Stufe-2/3-Gebäude (Radar/Silo brauchen Fog-of-War/Kampf aus C), Gebäude-HP-Kampf, Wasser-Einheiten.

---

## PHASE C — COMMANDER-LAYER: FOG OF WAR, SPÄHER, TRUPPEN, WÜRFEL-KAMPF

**Ziel:** Der Indoor-Strategie-Layer. Größtes Paket — intern in C.1 (Sicht & Späher), C.2 (Truppen & Würfel-Kampf), C.3 (Stufe-2/3-Gebäude & Luftschläge) geschnitten, jeweils einzeln shipbar.

### C.1 — Commander-Karte + Fog of War + Späher ✅ FERTIG (2026-06-12, Commits f7c1c39 + 60956b0, produktiv; Mobile-Commander-Tab kommt gebündelt mit C.2)
- **Sichtbarkeits-Modell:** sichtbar = gridDisk(eigene Territorium-Zellen, 1) ∪ aktive Radar-Zellen ∪ aktive Späher-Pfade (TTL 24 h). Persistiert als `player_visibility (user_id, h3_cell, source, expires_at)` — Abfrage ist ein simpler Index-Lookup, kein PostGIS.
- **Späher:** Item-Instanz (`unit_scout`), Entsendung kostet Energie ("Proviant"), bewegt sich entlang H3-Pfad (`gridPathCells`) mit realer Laufzeit, muss zurückkehren. 1× pro Reise: verdecktes Radar beim Feind bauen (`buildings.type='radar', config.covert=true`). Abfangbar durch gegnerische schnelle Einheiten (C.2).
- **Intel-Drops:** Cron `scout_vision_tick` (alle 15 min): kreuzt eine gegnerische Truppenbewegung eine Späher-Sichtzelle → Push an Besitzer mit Ziel + ETA. (Verkauf von Intel: Stretch, NICHT in C.)

### C.2 — Truppen + Würfel-Kampf (2+1) ✅ FERTIG (2026-06-12, Commit a2826a5, produktiv; inkl. Mobile-Commander-Tab dark-shipped + Anti-Farm-Drop-Cap 3 Siege/Territorium/Tag)
- **Deployment:** `item_instances.status='deployed'` + Eintrag in `troop_deployments (instance_id, territory_id, role)`— Einheiten verteidigen Territorien oder marschieren (`troop_movements` mit `departs_at/arrives_at`, materialisiert lazy, E7).
- **Kampfdreieck:** `stats.domain` (ground/armor/air/aa/naval) + Matrix in constants.ts (ground>aa, armor>ground, air>armor, aa>air; naval nur auf `biome='water'`-Zellen).
- **Würfel-Resolution (backend-only):** Angreifer & Verteidiger: 2×W6 + 1 Bonus-Würfel (equippte Dice-Item-Instanz). Domains-Matrix gibt ±1-Modifier. Höchste Summe gewinnt Runde, Verlierer verliert 1 Einheit; best-of-N nach Truppengröße. **Sieger-Drop statt Pink Slip (Entscheidung 2026-06-12):** Der Verlierer behält seine Würfel — der Sieger bekommt mit Wahrscheinlichkeit p (config) einen system-geminteten Würfel-Drop (Rarität skaliert mit Gegner-Stärke). Kein Item-Verlust zwischen Spielern → IARC-sicher. Komplettes Wurf-Log in `battles.log` (JSONB) → Client spielt Animation ab.
- **Schild-Würfel:** annulliert höchsten gegnerischen Wurf — nur ein Stats-Flag `{effect:'cancel_highest'}`, Resolution-Engine wertet Effekte generisch aus (TCG-ready).

### C.3 — Stufe-2/3-Gebäude + Luftschläge ✅ FERTIG (2026-06-12, Commit 510e400, produktiv live-getestet: Silo-Bau → Strike (Raffinerie 100→50 HP) → SILO_COOLDOWN → Tier-2-Upgrade)
- Radar (permanent Sicht), Garnison (gehackte Einheiten als Wachen = Auto-Defender), Silo (Luftschlag: hohe Energie-Kosten, zerstört Schilde/Gebäude-HP aus Distanz, KEIN Truppenmarsch nötig), Teleporter (Truppen-Schnellreise zwischen eigenen Pads).

### DB (Kern)
```sql
CREATE TABLE IF NOT EXISTS player_visibility (
  user_id UUID NOT NULL, h3_cell TEXT NOT NULL,
  source VARCHAR(15) NOT NULL,            -- 'territory'|'radar'|'scout'
  expires_at TIMESTAMPTZ,                 -- NULL = solange Quelle existiert
  PRIMARY KEY (user_id, h3_cell, source)
);
CREATE TABLE IF NOT EXISTS troop_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL, instance_ids UUID[] NOT NULL,
  from_cell TEXT NOT NULL, to_cell TEXT NOT NULL, path TEXT[] NOT NULL,
  purpose VARCHAR(15) NOT NULL,           -- 'attack'|'reinforce'|'scout'|'return'
  departs_at TIMESTAMPTZ NOT NULL, arrives_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(15) NOT NULL DEFAULT 'marching',  -- marching|arrived|intercepted|cancelled
  resolved BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id UUID, defender_id UUID,     -- defender NULL = PvE/KI
  territory_id UUID REFERENCES territories(id),
  type VARCHAR(15) NOT NULL,              -- 'assault'|'airstrike'|'interception'
  log JSONB NOT NULL DEFAULT '[]',        -- [{round, atkRoll:[..], defRoll:[..], modifiers, casualty}]
  winner UUID, loot JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Server
- **Neu:** `services/visionService.ts`, `services/troopEngine.ts` (March-Scheduling + lazy Resolution), `services/battleEngine.ts` (Würfel + Effekte + Kampfdreieck, generischer Effekt-Resolver), `services/airstrikeService.ts`.
- **Routes:** `/api/commander/map?cells=` (liefert NUR sichtbare Zellen: Territorien aggregiert, Truppen, Gebäude — Fog-of-War wird server-seitig durchgesetzt, E5), `/api/commander/troops/deploy|march|recall`, `/api/commander/scouts/send`, `/api/commander/strike`, `/api/battles/:id`.
- **Cron:** `troop_arrival_tick` (alle 5 min, plus lazy bei Map-Abruf), `scout_vision_tick` (15 min), `visibility_cleanup` (nightly).
- **WS:** `troops_arrived`, `battle_resolved`, `scout_report`, `under_attack` (sendToUser).

### Mobile
- **Neuer Tab "Commander"** (Flag `commander`, MainNavigator + CommanderStack): `CommanderMapScreen` — ZWEITE react-native-maps-Instanz mit eigenem Radar-Dark-Style + H3-Hex-Polygone (h3-js `cellToBoundary` → Polygon-Koordinaten; bei >300 sichtbaren Zellen: Aggregation auf res 7). Kein Skia nötig für v1 des Layers; Optimierung später falls FPS-Probleme.
- `screens/commander/`: `CommanderMapScreen`, `TroopPanelSheet`, `BattleReplayScreen` (Würfel-Animation aus `battles.log`, Reanimated), `ScoutDispatchSheet`, `DicePouchScreen` (Loadout: 1 Bonus-Würfel equippen).
- `store/commanderStore.ts`.

**Aufwand:** C.1 ~2 Wochen, C.2 ~3 Wochen, C.3 ~2 Wochen.
**Risiken:** Hex-Rendering-Performance auf Low-End-Androids (Mitigation: res-7-Aggregation + Viewport-Culling); Balancing Kampfdreieck (alle Modifier in flags.config); Späher-Pfade dürfen Home-Zones nicht verraten (Späher-Sicht endet an `silent_zones`/Home-Zone-Radien — Privacy-USP nicht beschädigen!).
**Explizit NICHT in Phase C:** Intel-VERKAUF (Markt ist E), Wager-Matches, KI-Gegner im Commander-Layer (D), Reiter-Abfangen automatisiert (erst D macht das interessant; in C nur manuelles Abfangen via Movement auf Späher-Zelle).

---

## PHASE D — HYBRID-KI: H3-SIMULATION + LLM-GENERAL

**Ziel:** Die Hyperboreer werden ein autonomer Akteur: besetzen Zellen, eskalieren in 3 Phasen, greifen im Commander-Layer an. Rechnen (deterministisch, Server) ist strikt getrennt vom Denken (LLM, alle 6 h Makro-Befehle).

### Architektur
1. **`ai_region_state` (res-6-Zelle = Sektor):** `phase (dormant|triggered|invasion)`, `held_cells TEXT[]`, `strength`, `resources`, `last_sim_at`. Nur Sektoren mit Spieler-Aktivität (place_history letzte 14 Tage) werden überhaupt simuliert — Lazy par excellence.
2. **Deterministischer Simulator (`aiSimEngine.ts`):** führt Direktiven aus (spawnen, marschieren via troopEngine — die KI nutzt DIESELBEN Truppen-/Battle-Engines wie Spieler, owner_id = NULL + `ai_faction`-Marker), Phase-1-Verhalten (10–15 % Zellen halten, nicht angreifen) ist hardcoded-deterministisch und braucht NULL LLM.
3. **Trigger-Detektor (Cron, stündlich):** Sektor-Metriken (aktive Spieler, Gebäude-Tier-Summe, Clan-Anzahl) gegen Schwellen aus `flags.config` → markiert Sektor `triggered`, legt LLM-Job in Redis-Queue.
4. **LLM-General (`aiGeneralService.ts`, Cron alle 6 h, nur `triggered|invasion`-Sektoren):**

**Prompt (kompakt, ~500 Token):**
```
Du bist der General der Hyperboreer. Sektor {h3} ("{city}"):
Spieler: {n_active} aktiv, {n_clans} Crews, Gebäude-Stärke {sum_tiers}, Schilde: {n_shields}.
Deine Lage: {held_pct}% Zellen, Stärke {strength}, Phase {phase}.
Letzte Ereignisse: {bullet_list_max_5}.
Antworte NUR mit JSON nach Schema.
```

**Makro-Befehl-Schema (zod, server-validiert):**
```typescript
const AiDirective = z.object({
  directives: z.array(z.object({
    command: z.enum(['HOLD','EXPAND','HARVEST_AND_MOVE','PROBE_ATTACK','INVASION_TRIGGER','RETREAT','FORTIFY']),
    target_cells: z.array(z.string()).max(10).optional(),
    intensity: z.number().min(0).max(1),
  })).max(3),
  story: z.object({
    template_id: z.enum(['radio_intercept','warning','taunt','retreat_note']),
    slots: z.record(z.string().max(60)),   // nur kurze Slot-Texte, KEIN freier Fließtext
  }).optional(),
});
```
5. **Story → Push:** Template-Bibliothek (i18n, 13 Sprachen) + LLM füllt nur Slots (Stadtname, Crew-Name, Frist). Safety: Slot-Regex (kein @, keine URLs, max 60 Zeichen) + Blockliste + Push klar gebrandet "📡 Abgefangener Funk — MapRaiders". Erfüllt Anhang B Punkt 4.
6. **Fallback-General:** validiert das LLM 2× nicht oder API down → deterministische FSM (dormant→bei Trigger expandiere 1 Zelle/Tick, bei >50 % Verlust RETREAT). KI ist nie tot.
7. **Invasions-Ausgang:** Sieg Menschen → Sektor `dormant`, Gebäude-Reparatur −50 % (resourceService-Discount-Flag). Sieg KI → Zellen werden `ruins` (neue Spawn-Quelle: Scavenging-Relikte via pve_spawns `npc_type='ruin_cache'`, Wiederaufbau 90 % — schließt den Kreis zu Phase A Ruinen-Scavenging).

### Modell & Kosten
- **Primär: `claude-haiku-4-5`** (Schema-Treue + Mehrsprachigkeit besser als lokales Qwen, und der Server "zoro" hat keine GPU — lokales LLM müsste auf dem Heim-PC laufen = Single Point of Failure fürs Backend; daher API first, Ollama-Adapter als zweiter Provider hinter Interface `LlmProvider`).
- **Kosten:** ~600 Token in / ~200 out pro Sektor-Tick. Selbst 200 aktive Sektoren × 4 Ticks/Tag ≈ 0,6 M Token/Tag ≈ **< 1 €/Tag** mit Haiku. Vernachlässigbar; Budget-Cap trotzdem als Flag (`ai_general.config.max_calls_per_day`).

### DB
```sql
CREATE TABLE IF NOT EXISTS ai_region_state (
  h3_sector TEXT PRIMARY KEY,             -- res 6
  phase VARCHAR(10) NOT NULL DEFAULT 'dormant',
  held_cells TEXT[] NOT NULL DEFAULT '{}',
  strength INT NOT NULL DEFAULT 0, resources BIGINT NOT NULL DEFAULT 0,
  last_sim_at TIMESTAMPTZ, last_llm_at TIMESTAMPTZ,
  metrics JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS ai_directives (
  id BIGSERIAL PRIMARY KEY, h3_sector TEXT NOT NULL,
  source VARCHAR(10) NOT NULL,            -- 'llm'|'fallback'
  directive JSONB NOT NULL, raw_response TEXT,
  executed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ruins (
  h3_cell TEXT PRIMARY KEY, h3_sector TEXT NOT NULL,
  ruined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overgrowth INT NOT NULL DEFAULT 0,      -- wächst nightly; >threshold spawnt 'nest'
  scavenged JSONB NOT NULL DEFAULT '[]'
);
```

**Aufwand:** ~3 Wochen (Sim 1 W, LLM-Pipeline + Fallback 1 W, Invasion/Ruinen + Balancing 1 W).
**Risiken:** Globale Invasions-Pushes nerven → streng pro Sektor + Quiet Hours (existiert schon in notificationService) + opt-out-Einstellung; LLM-Prompt-Injection über Spieler-Namen in Metriken → Namen NIE in den Prompt, nur Aggregat-Zahlen.
**Explizit NICHT in Phase D:** KI im Explorer-Layer (draußen bleibt Hacken), KI-Diplomatie/Chat, Cross-Sektor-Strategie.

---

## PHASE E — TCG "DAS ARCHIV" + MARKTPLATZ (erst nach Ökonomie- & Policy-Klärung)

**Ziel:** Sammelkarten-Endgame. Freischaltung über Gebäude "Archiv" (buildings.type='archive'). Dank Phase 0 ist 80 % des Datenmodells fertig: Karten = `item_definitions(category='card', season='S1')` + `item_instances` mit `mint_number`; Burn = `status='burned'` + `item_events`; "Karte als Truppe einlösen" = burn + mint der Unit in EINER Transaktion.

- **Match-Engine:** asynchron turn-basiert auf dem BESTEHENDEN turnGameEngine-Muster (board_state JSONB, turn_deadline) — Leader, Vril-Energie-Kurve, Counter-Phase als State-Machine; komplette Regelvalidierung server-seitig.
- **Booster ("Daten-Tresore"):** nur erspielbar (Loot, Terminals, Invasions-Siege). **KEIN IAP in E.** Drop-Tabellen in flags.config.
- **Marktplatz:** `market_listings` + Escrow über item_events; Tausch Karte↔Karte und Karte↔Ressourcen.
- **Ranked-/High-Stakes-Matches (Entscheidung 2026-06-12 — final):** KEINE Item-Wetten, kein Item-Verlust. Einsatz nur als non-tradeable Ressourcen-Pot; der Sieger erhält zusätzlich einen system-geminteten epischen Drop. Verlierer behalten alle Items. Damit bleibt das IARC-Rating bei USK 6/12 / PEGI 7/12.
- **Saisons:** `season`-Spalte existiert ab Phase 0; Set-Rotation = neue Definitionen + Drop-Tabellen-Switch.
- Holo/Gyroskop & Secret-Art: reine Client-Kosmetik (expo-sensors existiert).

**Aufwand:** ~4–6 Wochen (Match-Engine dominiert).
**Risiken:** Glücksspiel-Optik (siehe oben), Karten-Balancing, UI-Aufwand für Deck-Builder.
**Explizit NICHT in Phase E:** IAP/Monetarisierung (separater Policy-/Listing-Workstream), Echtgeld-Handel, Cross-Game-Trading.

---

## TRACK W — WEB-CLIENT (Gigi, 2026-06-12: "gewisse Schichten auch ohne Handy spielbar")

**Ziel:** Spielbare/einsehbare Web-Oberfläche auf mapraiders.com mit Login — läuft PARALLEL zu den Phasen, kein App-Build nötig. Doppelnutzen:
1. **Test-Cockpit für Gigi:** Neue Features (Phase 0/A/B+) sofort im Browser sichtbar — kein APK-Download/Neuinstallation pro Build. Die Store-AAB (vc2) enthält die neue UI ohnehin nicht; der Web-Client ist bis vc3 die EINZIGE Sicht auf den neuen Content.
2. **Produkt-Feature:** Der Commander-Layer (Phase C) ist per GDD ein INDOOR-Layer — prädestiniert für Web. Langfristig: draußen Handy (Explorer), zuhause Browser (Commander). Genau die GDD-Vision.

### Architektur
- **Neues Verzeichnis `web/`:** Vite + React + TypeScript (KEIN Expo-Web — react-native-maps ist web-inkompatibel; sauberer separater Client ist robuster). Karte: Leaflet + OSM-Tiles (kein API-Key nötig). State: Zustand (gleiche Patterns wie Mobile).
- **Gleiche API:** api.mapraiders.com, gleiches Token-Auth (`token`-Feld), gleiche Feature-Flags/Capabilities — der Web-Client ist NUR ein weiterer Client, null Server-Sonderlogik. Einzige Server-Änderung: CORS-Origin für die Web-Domain erlauben.
- **Deploy:** statischer Build (`vite build` → `dist/`) per SCP auf den Hetzner-VPS, nginx-Location auf mapraiders.com (z. B. `/play`) oder Subdomain `play.mapraiders.com`. Kein Node-Prozess für den Client nötig.
- **GPS-Grenze (Design-Wahrheit):** Alles, was echte Bewegung erfordert (Territorium claimen, Hacking-Proximity ≤ 75 m, Quests laufen), bleibt handy-exklusiv — der Server prüft das eh (Anti-Cheat). Web zeigt diese Aktionen read-only an.

### W.1 — Beobachter-Cockpit (SOFORT, ~2–4 Tage)
Login (E-Mail/Passwort) → Karte mit Territorien (eigene hervorgehoben) + PvE-Spawns (Flag) → Ressourcen-HUD → Inventar-Liste → Profil/XP. Read-only plus die Aktionen, die KEINE GPS-Position brauchen: **Gebäude bauen/abreißen** (Phase B), Feature-Flag-Sicht. Vril-Violett-Theme von Anfang an.

### W.2 — Indoor-Aktionen (nach Phase C-Start)
Commander-Karte (Fog of War), Späher entsenden, Truppen verwalten, Würfel-Kampf-Replays — der komplette Indoor-Layer nativ im Web. Ranked Jump&Run (A.2) läuft als server-gehostetes HTML5-Spiel ohnehin im Browser → im Web-Client direkt einbettbar.

### W.3 — Später
TCG-Sammlung + Marktplatz (Phase E), Clan-Verwaltung, Replay-Sharing (SEO-Hebel: öffentliche Territorial-Karten pro Stadt = organische Landing Pages).

**Explizit NICHT im Web:** GPS-Aktionen simulieren (Anti-Cheat-Grenze), eigener Web-Account-Typ (ein Account, zwei Clients).

---

## QUERSCHNITT

### Rollout & v1-Schutz
| Build | Inhalt | Wann |
|---|---|---|
| vc2 (AAB, fertig) | v1.0 — NICHT anfassen | jetzt im Review-Prozess |
| vc3 | Phase 0 Stores/Flags (dunkel) + neues App-Icon + Hacking/PvE-UI (Flag aus) | nach v1-Live |
| vc4 | WebView-Dependency + Terminals + Ressourcen-HUD | A.2/B |
| vc5+ | Commander-Tab, dann D/E | C+ |

Server-Deploys sind jederzeit möglich (additive Routes brechen vc2 nicht; `capabilities` ist neues optionales Feld).

### Qualitäts-Gates (jede Phase)
1. `cd server && npx tsc --noEmit` = 0 Errors (CI-Pflicht wie bisher).
2. Jede neue Engine bekommt Vitest/Jest-Unit-Tests für die Resolution-Logik (Würfel, Kampfdreieck, Ledger-Invarianten: Summe aller Transaktionen == Balance).
3. Kreuzanalyse-Pass nach jeder Phase (Skill `/kreuzanalyse`): besonders Decay×Gebäude, Ledger×Konto-Löschung (Soft-Delete: item_instances.owner_id SET NULL — bereits im DDL berücksichtigt), Home-Zone×Späher-Sicht.
4. Migrationen idempotent (`IF NOT EXISTS`), eine Datei pro Phase in `server/src/db/migrations/`.

### Entscheidungen (von Gigi, 2026-06-12, ASO/SEO-getrieben — FINAL)
1. **"Clan" bleibt** — im UI UND im Schema. Begründung: riesiges ASO-Suchvolumen ("Clan Wars", "Spiel mit Clans"); "Crew" assoziiert Rennspiele/Tanz. GEO-Hebel: Website-Headings wie "Gründe deinen eigenen Clan und erobere reale Territorien in deiner Stadt" (→ SEO-Backlog).
2. **Item-Wetten & Pink-Slip GESTRICHEN.** Kein Spieler verliert je ein Item per Wette/Einsatz an einen anderen Spieler (IARC würde auf 16+/18+ hochstufen → organische Reichweite tot, CPI explodiert). Stattdessen: **System-belohnte Ranked-/High-Stakes-Matches** — der Gewinner bekommt einen system-geminteten epischen Drop, der Verlierer behält sein Inventar. Wager-Pots nur mit nicht-handelbaren Ressourcen. Ziel-Rating: USK 6/12, PEGI 7/12.
   **Klarstellung (Gigi, 2026-06-12): Verlieren bleibt echt!** Siehe "Verlust-Ökonomie" unten — Territorien, Gebäude und Truppen im Feld gehen bei Niederlagen verloren, Ruinen kann der Eroberer recyceln. Die IARC-Grenze betrifft NUR Wett-Transfers von Inventar-Items, nicht normale Spielverluste (Truppen-Zerstörung im Kampf = Spielmechanik wie bei Clash of Clans, IARC-unkritisch).
3. **Brand-Farbe wechselt auf Vril-Violett** (Neon-Lila auf Obsidian/Dunkel) — App-Icon, Feature Graphic, App-Akzentfarbe, Website-Akzente. Begründung: Geolocation-Top-Charts sind blau/grün — Violett = maximaler Kontrast + Mystery/Sci-Fi/AI-Assoziation (Twitch/Discord-Psychologie), höhere Store-CTR. Rollout: Icon + Feature Graphic VOR Launch; App-Theme (`#00D4FF` → Vril-Akzent) und Website-Akzente phasenweise danach (Cyan bleibt als Sekundärfarbe im Farbsystem erhalten).

### Verlust-Ökonomie (Klarstellung Gigi 2026-06-12: "Man muss schon was verlieren")

**Was man verlieren KANN (volle Härte, gewollt):**
- **Territorien** — durch Eroberung oder Decay. Wie heute, bleibt der Kern des Spiels.
- **Gebäude auf eroberten Territorien** — werden bei feindlicher Übernahme zu **Ruinen auf dem Gebiet**. Der Eroberer entscheidet: **recyceln** (50 % der Baukosten als Tech/Energie zurück) oder **wieder aufbauen** (50 % der Neubaukosten statt 100 % — GDD-Renovierungsregel). Der Verlierer bekommt nichts zurück.
- **Deployed Truppen** — Einheiten, die im Kampf fallen, sind zerstört (`item_instances.status='burned'`, `acquired_via`-Historie bleibt im Log). Wer seine Armee in eine verlorene Schlacht schickt, hat sie nicht mehr.
- **Eingesetzte Ressourcen-Pots** in Ranked-Matches.
- **TCG-Karten, die als Truppe eingelöst wurden** (Burn-Mechanik) — wenn die Truppe fällt, ist die Karte für immer weg. Das deflationäre Risiko trägt der Besitzer bewusst.

**Was man NIE an andere Spieler verliert (IARC-Grenze):**
- Inventar-Items (Würfel, Karten, Relikte im Lager), solange sie nicht als Truppe deployed sind. Verlust durch eigene Deployment-Entscheidung = Spielmechanik; Verlust durch Wette = Glücksspiel-Optik. Diese Linie hält das 6/12er-Rating.

**ENTSCHIEDEN (Gigi, 2026-06-12): Total-Verlust & Neustart — "Die Karten-Reserve + der Weg zurück führt über die Straße".**
1. Es gibt keinen geschützten Besitz außer der Home-Zone-Privatsphäre (die ist Datenschutz, kein Gameplay-Schild) — ein Spieler kann auf 0 Territorien, 0 Gebäude, 0 Truppen fallen. Verlieren ist echt.
2. **Die Karten-Reserve:** Gefundene und gewonnene Karten (Inventar, nicht-deployte Items, Würfel, Relikte) behält der Verlierer IMMER. Sie sind seine eiserne Reserve — wer alles verloren hat, kann seine Karten als Truppen einlösen (Burn-Mechanik) und damit sofort wieder kämpfen. Hochriskant (Karten sind dann für immer weg), aber seine Entscheidung.
3. **Der Weg zurück wird GELAUFEN, nicht geschenkt:** Kein Gratis-Start-Trupp, kein Geschenk-Paket. Wer keine Karten (mehr) hat oder sie nicht opfern will, arbeitet sich über den Explorer-Layer zurück — Territorien erlaufen/erradeln, Quests abschließen, an Events teilnehmen, PvE hacken. Der Totalverlust drückt den Spieler zurück auf die Straße — das IST das Spiel.
4. Bestehende Schutzmechaniken bleiben darunter aktiv (kein neues System nötig): Daily-Loss-Cap 30 % (verhindert Overnight-Totalverlust), Return-Bonus 2× in `balanceService`, Newcomer-Protection 1.5×.
→ Verlieren ist hart, aber nie ein Account-Ende: XP/Level, Titel, Clan und die Karten-Reserve bleiben. Der Frust-Exit ("App deinstallieren") wird zum Revanche-Loop — und der Revanche-Loop erzeugt echte Bewegung (Kern-USP des Spiels).

### Gesamt-Timeline (1 Entwickler + Agents, realistisch)
Phase 0: 1 W → A: 4 W → B: 2 W → C: 7 W → D: 3 W → E: 4–6 W ≈ **5–6 Monate** bis Voll-Vision; erster sichtbarer GDD-Content (Phase A.1) ist **~5 Wochen** nach Start live — feature-geflaggt und unabhängig vom v1-Review.

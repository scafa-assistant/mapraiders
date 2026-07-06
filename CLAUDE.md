# MapRaiders - Claude Code Instructions

<!-- Canonical source: MapRaiders/FOUNDER_THINKING_MODE.md , Version 2026-06-15. Bei Abweichung gilt die Quelle. -->

## Founder Thinking Mode (Standing Order)
Gilt für jeden Turn. Kein Hintergrund-Prozess (ein LLM denkt nur beim Antworten), sondern ein Self-Check, den du dir VOR jeder Antwort selbst stellst.

### Grundhaltung (immer aktiv)
Denke wie ein First-Principles-Operator, der Firmen gebaut und verkauft hat. Keine generischen Ratschläge. Gib die exakte Entscheidung, die ein erfahrener Gründer treffen würde, inklusive Trade-offs, Risiken und dem, was die meisten übersehen. Sag nicht, was ich hören will. Bei Strategie- oder Entscheidungs-Antworten eröffne sinngemäß mit "Was ich konkret tun würde:".

### Router (wähle VOR der Antwort selbst die passende Linse, genau eine, ggf. kombiniert)
1. Business-Model-Stresstest, bei "ist das tragfähig / lohnt sich / Geschäftsmodell": Was bricht zuerst? Was übersehe ich? Was machen die Top 3% in diesem Feld anders? Blunt, keine Schonung.
2. Wettbewerbs-Gap, bei Konkurrenz/Positionierung: Schwächen, blinde Flecken und Positionierungslücke des Wettbewerbers. 3 Moves, die ihn in 12 Monaten irrelevant machen, sortiert nach Execution-Speed.
3. Harte Entscheidung ohne Spirale, bei Entscheidungen: (a) Was bricht, wenn ich falsch liege, (b) wofür optimiere ich vs. wofür sollte ich, (c) was würde ein Gründer sagen, der diesen Fehler schon gemacht hat.
4. Hidden Revenue, bei Offer/Monetarisierung: ungenutztes Umsatzpotenzial, 3 neue Angles, sortiert nach Effort-to-Return, einer markiert als "zuerst testen" mit Begründung.
5. A-Player-Filter, bei Hiring: Fragen, die A-Player von guten Interviewees trennen, plus der eine Red Flag, den die meisten erst in Monat 3 sehen.
6. Execution (Default), bei normaler Bau-/Code-/Ops-Arbeit: handeln statt fragen, klarer Weg = machen.

### Dosierung (kritisch, sonst kontraproduktiv)
- Strategie/Business/Entscheidung: volle Founder-Linse.
- Mechanische Ausführung (Code, Build, Deploy, Refactor): leichte Hand. NICHT den vollen Investoren-Prompt über einen Debugging-Task stülpen, das macht dich nur geschwätzig und schlechter. Hier zählt: präzise, entscheiden, liefern.
- Aktuelle Architektur immer von Zukunftsvision trennen.

### Stilregeln
- Sprache Deutsch, Code/Configs Englisch.
- Keine Em-Dashes. Nutze ", " oder ": " statt " - ".

## Project Overview
MapRaiders is a GPS-based MMO territory game (React Native + Node.js). Players walk, run, cycle to claim real-world territory, create content (quests, echos, challenges, artifacts), compete in duels, and form organic clans.

## Architecture
- **Server:** `server/` — Node.js + Express + TypeScript + PostgreSQL/PostGIS + Redis + WebSocket
- **Mobile:** `mobile/` — React Native / Expo + TypeScript + Zustand stores
- **Docker:** `docker-compose.yml` — PostGIS (port 5433) + Redis (port 6379)

## How to Run
```bash
./setup.bat    # First time: install deps
./start.bat    # Start everything (Docker + Server + Expo)
./stop.bat     # Stop everything
```
Test login: `walker@test.com` / `test1234`

## Code Conventions
- Server response format: `{ success: true, data: {...} }` or `{ success: false, message: "..." }`
- Auth token field name: `token` (NOT `accessToken`)
- Error field: `message` (NOT `error`)
- Express route params: always cast `req.params.id as string` (TS strict mode)
- GpsPoint interface: `latitude/longitude` required, `lat/lng` optional aliases
- Mobile stores use the API service (`services/api.ts`), never raw axios
- All `.bat` files must use `"C:\Program Files\Git\bin\bash.exe"` (not `bash`)
- Docker PostGIS runs on port **5433** (local PostgreSQL occupies 5432)

## Server Structure
```
server/src/
├── config/        # database.ts, redis.ts, constants.ts
├── db/            # schema.sql, seed.sql
├── middleware/     # auth.ts, rateLimit.ts, validation.ts
├── routes/        # 30 route files (REST API endpoints)
├── services/      # 29 service files (business logic)
├── jobs/          # decayCron.ts (13 cron jobs), leaderboardCron.ts, clanFormation.ts, titleCheck.ts
└── utils/         # types.ts, geo.ts, polygon.ts
```

## Mobile Structure
```
mobile/src/
├── components/    # 11 reusable components
├── hooks/         # 5 custom hooks
├── navigation/    # 7 navigation stacks + types
├── screens/       # 28 screens across auth/, map/, quests/, create/, travel/, profile/, leaderboard/
├── services/      # 12 services (api, gps, audio, websocket, echoProximity, etc.)
├── store/         # 4 Zustand stores (auth, location, quest, territory)
└── utils/         # types, colors, constants, formatters, nightMode
```

## Key Design Documents (read these for game design context)
- `_docs/gdd/Gridwalker_GDD.md` — Full Game Design Document
- `_docs/gdd/Gridwalker_Mechanismus_Analyse.md` — Technical mechanics deep-dive
- `_docs/gdd/Gridwalker_Marktanalyse.md` — Market analysis + 6 innovative ideas
- `_docs/gdd/Kreuzanalyse_Mechaniken.md` — Interaction matrix, game loops, feedback cycles

## Database
- PostgreSQL 16 + PostGIS 3.4
- 35+ tables with spatial indexes (GIST)
- Schema: `server/src/db/schema.sql`
- Seed data: `server/src/db/seed.sql`

## TypeScript
- Server must compile with `cd server && npx tsc --noEmit` (0 errors)
- Always verify compilation after changes

## Working with René Scafarti (project owner)
- Communicate in German
- Act autonomously — don't ask "soll ich weitermachen?", just execute
- Deploy multiple agents in parallel for large tasks
- Use watchdog agents to audit code after builds
- Run cross-analysis (Kreuzanalyse) after major feature additions
- Commit after each phase with detailed messages

## OTA-Updates (EAS Update) , Standing Rule, AKTUELL GEPARKT
**Status (2026-06-17): GEPARKT bis nach Launch.** `ENABLED=false` (vc2-Zustand). Grund: bei 3 Testern + 5-min-Gradle-Build löst OTA ein Problem, das es noch nicht gibt, und schiebt JS ohne Review direkt auf Tester-Handys. Außerdem fehlt dem lokalen Gradle-Build der Channel-Header (`expo-channel-name`), den nur der EAS-Cloud-Build automatisch einspritzt, OTA wäre also bei lokalen APKs ohnehin halb. **WICHTIG: APK wird LOKAL mit Gradle gebaut (`mobile/android/gradlew`, ~5 min), NICHT per EAS-Cloud-Build (20 min Queue). Bauen und OTA sind getrennte Dinge; die externe `u.expo.dev`-URL ist nur der OTA-Briefkasten, keine Bau-Voraussetzung.**

Reaktivieren (NUR nach Launch / auf Renés Ansage): `ENABLED=true` + Channel-Header ins Manifest (oder via EAS-Build), dann gilt unten. Bis dahin: kein `eas update`, kein `eas build`.

Wenn aktiviert, gelten diese Wächter (OTA geht ohne Store-Review direkt auf Tester-Handys, ein grüner Build kann zur Laufzeit trotzdem crashen):

1. **Nur JS/Assets:** Texte, Logik, Farben, Screens, Bugfix → OTA möglich. Native Änderung (AndroidManifest, neue Permission/Library, App-Version, neue Expo-Module) → KANN NICHT OTA, braucht vollen `eas build`. Der Agent erkennt das selbst und meldet es statt zu pushen.
2. **Gate vorher:** `cd server && npx tsc --noEmit` = 0 Fehler (bzw. der betroffene Workspace baut), und die Änderung ist wirklich nur JS/Assets.
3. **Channel-Disziplin:** Routine-Updates immer auf `preview` (Tester). `production` NIE automatisch, nur auf Renés ausdrückliches "Production raus".
4. **Transparenz:** Agent meldet in einer Zeile "OTA raus: <was>"; René kann jederzeit "nicht pushen" sagen, dann hält der Agent.

Befehl (aus `mobile/`): `npx eas-cli update --branch preview -m "<knappe Beschreibung>"`. Native Build (wenn nötig): `npx eas-cli build -p android --profile preview`. Auth steht lokal; läuft wie `git push` direkt aus dem Terminal. EAS Project ID `11263b5c-0b4f-4039-bc2a-9f9ebe3c0769`, Channel `preview` aktiv. Native Switch (ENABLED=true + UPDATE_URL + runtimeVersion "1.0.0") committet dfc186e.

## Production
- Domain: mapraiders.com
- API: api.mapraiders.com
- GitHub: github.com/scafa-assistant/mapraiders (private)

---

<!-- Stammdaten migriert aus globaler CLAUDE.md, 2026-06-27 -->
## Projekt: MapRaiders (GPS Territory MMO)

- **Pfad:** `C:\Users\r.scafarti\Desktop\MapRaiders`
- **App-Paket:** `com.mapraiders.app`
- **Domain:** mapraiders.com / api.mapraiders.com
- **GitHub:** github.com/scafa-assistant/mapraiders (privat)
- **EAS Org:** iveezee23s-organization
- **EAS Project ID:** 11263b5c-0b4f-4039-bc2a-9f9ebe3c0769
- **Ziel:** GPS-basiertes MMO: Spieler laufen/radeln um echte Territorien zu erobern, erstellen Quests/Echos/Challenges, Duellieren, bilden Clans
- **Tech-Stack:**
  - Mobile: React Native / Expo SDK 55 + TypeScript + Zustand
  - Server: Node.js + Express + TypeScript + PostgreSQL 16/PostGIS 3.4 + Redis + WebSocket
  - Docker: PostGIS Port 5433, Redis Port 6379
- **Build-System:**
  - EAS Build: `preview` Profil = APK (direkt installierbar), `production` = AAB (Play Store)
  - Gradle: MUSS 8.11.1 sein, Gradle 9.0 bricht Expo SDK 55 / RN 0.83
  - `mobile/android/build.gradle` braucht `ext {}` Block mit compileSdkVersion=35, targetSdkVersion=35, minSdkVersion=24
  - TypeScript-Check: `cd server && npx tsc --noEmit` muss 0 Errors haben
- **Server Response-Format:** `{ success: true, data: {...} }` oder `{ success: false, message: "..." }`
- **Auth Token:** Feld heißt `token` (NICHT `accessToken`)
- **Error Feld:** `message` (NICHT `error`)
- **Datenbank:** 35+ Tabellen, PostGIS Spatial Indexes (GIST), Schema in `server/src/db/schema.sql`
- **Cron-Jobs:** 13+ Jobs (Decay, Clan-Formation, Leaderboards, Events, Bounties), alle in `server/src/jobs/decayCron.ts`
- **Kritisches System:** Territory Decay Engine (`server/src/services/decayEngine.ts`), täglich 04:00 UTC
- **ASO/SEO:** 13-Sprachen-Strategie, Triple-Tag Methode, vs-Wettbewerber-Pages, Pillar/Cluster Content
- **Design Docs:** `Gridwalker_GDD.md`, `Gridwalker_Mechanismus_Analyse.md`, `Gridwalker_Marktanalyse.md`, `Kreuzanalyse_Mechaniken.md`

### MapRaiders: Bekannte Pitfalls

- Git-Push geht NUR vom lokalen Rechner (Sandbox hat keine GitHub-Auth)
- `.git/index.lock` Files bleiben manchmal stecken nach parallelen Agents → mit `mv` umbenennen
- EAS Build Fehler "Gradle build failed with unknown error" = fast immer Gradle-Version oder fehlender ext-Block
- Play Console braucht erst Signing Key vom EAS Build bevor Package registriert werden kann
- Seed-Territorien haben jetzt `is_protected = TRUE`, werden nicht mehr vom Decay gelöscht
- Account-Löschung ist jetzt Soft-Delete (SET owner_id = NULL, nicht DELETE)
- Cron-Monitoring via `/api/health/crons` Endpoint + Redis-basiertes Locking


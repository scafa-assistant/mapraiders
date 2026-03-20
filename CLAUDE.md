# MapRaiders - Claude Code Instructions

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
- `Gridwalker_GDD.md` — Full Game Design Document
- `Gridwalker_Mechanismus_Analyse.md` — Technical mechanics deep-dive
- `Gridwalker_Marktanalyse.md` — Market analysis + 6 innovative ideas
- `Kreuzanalyse_Mechaniken.md` — Interaction matrix, game loops, feedback cycles

## Database
- PostgreSQL 16 + PostGIS 3.4
- 35+ tables with spatial indexes (GIST)
- Schema: `server/src/db/schema.sql`
- Seed data: `server/src/db/seed.sql`

## TypeScript
- Server must compile with `cd server && npx tsc --noEmit` (0 errors)
- Always verify compilation after changes

## Working with Ralph (project owner)
- Communicate in German
- Act autonomously — don't ask "soll ich weitermachen?", just execute
- Deploy multiple agents in parallel for large tasks
- Use watchdog agents to audit code after builds
- Run cross-analysis (Kreuzanalyse) after major feature additions
- Commit after each phase with detailed messages

## Production
- Domain: mapraiders.com
- API: api.mapraiders.com
- GitHub: github.com/scafa-assistant/mapraiders (private)

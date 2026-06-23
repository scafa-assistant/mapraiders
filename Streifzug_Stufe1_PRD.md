# Streifzug Stufe 1 , PRD + Implementierungs-Status

**Stand:** 2026-06-23
**Scope:** Foreground-Streifzug (bewusst gestartete Session), KEINE Sensitive-Permission. Stufe 2 (echter Hintergrund) bleibt geparkt, siehe `Streifzug_Modus_Spec.md`.
**Designprinzip:** Orchestrierungs-Schicht über bestehende Systeme, kein neuer Content-Motor.
- Encounter-Content = `pveSpawnEngine` (biom-getriebene NPCs + Loot, liegen schon auf der Karte).
- Encounter-Auflösung = `hackEngine` (existierender Hack-Flow, eigener Proximity + Daily-Cap-Check).
- Push = `pushService` (FCM).
- Session/Pacing-State = Redis (keine Schema-Änderung).

---

## 1. SERVER , GEBAUT & KOMPILIERT (tsc=0)

### Neue Dateien
- `server/src/services/streifzugService.ts` , Session-Lifecycle + Encounter-Ping-Loop.
- `server/src/routes/streifzug.ts` , REST-Endpunkte.
- `server/src/config/constants.ts` , `STREIFZUG`-Block (Radius, Cooldown, Dedup, Daily-Cap, Plausibilitäts-Limit).
- `server/src/index.ts` , Route registriert unter `/api/streifzug`.

### API-Vertrag (für Mobile-Anbindung)
Alle Antworten: `{ success, data }` / `{ success:false, message }`. Auth via Bearer-Token.

| Methode | Pfad | Body | Antwort `data` |
|---|---|---|---|
| POST | `/api/streifzug/start` | , | `{ active:true, startedAt }` |
| POST | `/api/streifzug/stop` | , | `{ active:false }` |
| GET | `/api/streifzug/status` | , | `{ active, startedAt? }` |
| POST | `/api/streifzug/ping` | `{ latitude, longitude }` | `{ active, encounter, reason? }` |

`encounter` (oder `null`):
```jsonc
{
  "spawnId": "uuid",        // -> POST /api/pve/spawns/:id/hack zum Auflösen
  "npcType": "scout_disc",
  "kind": "loot|recruit|threat",
  "distanceM": 80,
  "bearingDeg": 134,
  "latitude": 51.32, "longitude": 8.00,
  "level": 2, "biome": "forest",
  "title": "✨ Etwas glänzt in der Nähe",
  "body":  "80m vor dir liegt etwas. Geh hin und sichere es dir."
}
```
`reason` bei `encounter:null`: `inactive | implausible | cooldown | daily_cap | none_nearby | feature_off`.

### Verhalten / Wächter
- **Gating:** `/ping`-Encounters hinter `pve_spawns`-Flag (Encounter = PvE-Spawn). Flag off → `active:true, encounter:null, reason:'feature_off'`, Client pingt harmlos weiter. start/stop/status ungated.
- **Pacing:** max. 1 Encounter-Push pro `PING_COOLDOWN_SEC` (90s) je User (Redis NX).
- **Dedup:** derselbe Spawn wird demselben User 1h lang nicht erneut serviert.
- **Daily-Cap:** 20 Encounters/User/UTC-Tag (Pity-Ceiling gegen Spam).
- **Session-TTL:** 4h Sliding-Window Auto-Stop (Safety, falls Client nicht stoppt).
- **Anti-Cheat (light):** Ping mit implizierter Geschwindigkeit > 200 km/h wird ignoriert. Der echte Loot-Gate bleibt der `hackEngine`-Proximity-Check (75m) , Stufe 1 verschenkt nie Loot ohne physische Nähe.

### Tuning (live über `STREIFZUG` in constants.ts)
`ENCOUNTER_RADIUS_M=150`, `PING_COOLDOWN_SEC=90`, `ENCOUNTER_DEDUP_SEC=3600`, `DAILY_ENCOUNTER_CAP=20`, `SESSION_TTL_SEC=14400`, `MAX_PLAUSIBLE_SPEED_KMH=200`.

---

## 2. MOBILE , GEBAUT & KOMPILIERT (tsc=0)

### Neue/geänderte Dateien
- `mobile/src/services/api.ts` , `streifzugApi` (start/stop/status/ping) + `StreifzugEncounter`-Typen.
- `mobile/src/hooks/useStreifzug.ts` , Foreground-Location-Watch + getakteter Ping-Loop (12s Client-Throttle), Encounter-State, sauberes Cleanup.
- `mobile/src/components/StreifzugEncounterCard.tsx` , Bottom-Overlay (Titel/Text/Distanz vom Server), "Hingehen" → HackingScreen, "Später"/Dismiss.
- `mobile/src/screens/map/MapScreen.tsx` , Toggle-Button in den Map-Controls (Walk-Icon, nur bei aktivem `pve_spawns`-Flag), Encounter-Card-Overlay → bestehender Hack-Flow.
- `mobile/src/services/notifications.ts` , Push-Routing-Case `streifzug_encounter` (Tap zentriert Karte auf Spawn).

### Verhalten
- Toggle "Streifzug" auf der Map → `requestForegroundPermissions` (KEINE Background-Permission) → `streifzugApi.start()` → eigener `watchPositionAsync` (Balanced, 10s/10m) pingt bei Bewegung.
- Encounter kommt synchron in der Ping-Antwort (hängt NICHT am Push) → Card erscheint → "Hingehen" navigiert mit vollem Spawn-Descriptor in `HackingScreen` → bestehender Hack/Loot-Flow.
- Stop entfernt den Watch + `streifzugApi.stop()`; Session läuft serverseitig per TTL ohnehin aus.

### Offene Mobile-Follow-ups (bewusst zurückgestellt)
- **i18n:** Card-Button-Labels ("Hingehen"/"Später") + Distanz-Zeile sind hart Deutsch (App ist Deutsch-first; Encounter-Titel/-Text kommen vom Server). Keys ins `strings`-System nachziehen, wenn mehrsprachig.
- **Push-Token-Mismatch (vorbestehend, NICHT von Streifzug):** Mobile registriert Expo-Push-Token, `pushService` sendet via Raw-FCM. Betrifft alle Pushes. In-App-Encounter läuft unabhängig (Ping-Antwort). Separat fixen.

### Mobile-Gates
- `expo-location` Foreground-Permission (kein Sonder-Review).
- Android 13+ Notification-Runtime-Permission (für die Encounter-Pushes).
- Foreground-Service-Type in `app.json`/Manifest deklarieren (`location`).

---

## 3. OFFEN / STUFE 2
- Echter Hintergrund (`ACCESS_BACKGROUND_LOCATION`) + Demo-Video-Review → erst nach Tag-2-Validierung.
- Dedizierter `streifzug` Feature-Flag statt Mitnutzung von `pve_spawns` (sauberere Trennung).
- Encounter-Typen verfeinern: `recruit` (Truppen-Rekrut) und PvP-Encounters (echte Spieler im selben Slot) , Server-Flavour-Mapping ist dafür schon vorbereitet.
- GPS-Plausibilität härten (Segment-Historie statt nur Last-Point).

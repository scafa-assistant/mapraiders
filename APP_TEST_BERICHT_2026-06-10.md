# MapRaiders App-Test-Bericht — Store-Readiness

**Datum:** 2026-06-10
**Gerät:** Pixel 9 Pro (Android 16, SDK 36), via ADB
**Getestete Version:** v1.0.0 (versionCode 1), installiert 25.03., letzter Update 27.03.2026
**Server:** api.mapraiders.com (Health 200 OK, Uptime 31 Tage)
**Methodik:** Vollständiger Screen-Walkthrough mit Screenshots (test_01 bis test_20), Logcat-Monitoring, API-Cross-Checks, SSH-Verifikation Server-Stand

---

## Gesamturteil

**Die App selbst ist stabil — aber NICHT store-ready.** Kein einziger Crash, saubere UI, Compliance-Features vorhanden. Es gibt aber **2 absolute Blocker** (Build-Pipeline kaputt, Production-Server veraltet) und **1 Qualitäts-Blocker** (i18n-Chaos), die vor dem Store-Release weg müssen.

---

## ✅ Was funktioniert (getestet & bestanden)

| Bereich | Status | Detail |
|---|---|---|
| App-Start | ✅ | Kein Crash, Login-Screen rendert sauber |
| Auth | ✅ | Google Password Manager Autofill + Session-Persistenz funktionieren |
| Map-Screen | ✅ | GPS-Fix, Karten-Rendering, Level/XP-Bar, Activity-Detection ("Detecting...") |
| Quests-Tab | ✅ | Empty-State korrekt, Stern+Distanz-Filter, Weather-Active-Banner |
| Profil | ✅ | Avatar-Upload-UI, Badges (pioneer, level_10, level_25, +2), Edit-Username |
| My Pet | ✅ | Pet "Negra" rendert, Level-System, How-to-level-up Hints |
| Freunde | ✅ | Empty-State, Suche, Anfragen-Inbox |
| Clan | ✅ | Empty-State, Erstellen/Suchen-Buttons |
| Activity Feed | ⚠️ | Lädt + scrollt, aber Items unvollständig (siehe Bugs) |
| Leaderboard-Screen | ⚠️ | UI + Kategorie-Filter ok, aber leer (Server-Problem, siehe Blocker 2) |
| Quest-Create-Wizard | ✅ | 4-Step-Flow, Difficulty, Weather-Conditions, Seed-Quest-Toggle, Time Window |
| Settings | ✅ | Dark-Mode-Toggle, Haptik, Territorium-Farbwahl, Notification-Prefs, Quiet Hours |
| **Store-Compliance** | ✅ | **Delete Account ✓ (Play-Pflicht!), GDPR-Datenexport ✓, Home Zone Privacy ✓** |
| Stabilität | ✅ | Logcat über gesamte Session: 0 Errors, 0 FATALs, 0 ANRs |

---

## 🚨 BLOCKER 1: Build-Pipeline ist tot (KRITISCH — ohne Fix kein Store)

**Symptom:** Alle 3 letzten EAS-Builds errored (16.04. + 23.04.). Lokaler Build bricht ebenfalls.

**Root-Cause-Kette (heute diagnostiziert):**
1. Mit Gradle 8.11.1 (CLAUDE.md-Pflicht): `Minimum supported Gradle version is 8.13` — das ungepinnte Android Gradle Plugin (`classpath('com.android.tools.build:gradle')` ohne Version) wurde durch ein npm-Update hochgezogen
2. Mit Gradle 8.13: `SoftwareComponent with name 'release' not found` im `:expo`-Modul — Expo-SDK-55-Module inkompatibel mit der neuen AGP-Version
3. Ursache des Drifts: `package.json` nutzt Caret-Ranges (`expo: ^55.0.8`, `react-native: ^0.83.2`) → jeder `npm install` zieht neue Minor-Versionen mit neuen AGP-Anforderungen

**Die Installierte App vom 27.03. war der letzte erfolgreiche Build.**

**Fix-Optionen (Reihenfolge der Empfehlung):**
- **A (sauber):** `npx expo install --fix` um alle Expo-Module auf konsistente SDK-55-Versionen zu bringen, dann AGP-Version explizit pinnen, Gradle-Version danach ausrichten
- **B (Holzhammer):** package.json auf exakte Versionen einfrieren (Stand letzter funktionierender Build), `package-lock.json` aus März-Commit wiederherstellen
- **C (Upgrade):** Auf Expo SDK 56+ gehen — größerer Aufwand, aber zukunftssicher

**Status:** Gradle-Wrapper wurde heute testweise auf 8.13 gestellt (`mobile/android/gradle/wrapper/gradle-wrapper.properties`) — Problem 2 bleibt. Braucht dedizierten Fix-Block.

---

## 🚨 BLOCKER 2: Production-Server läuft 2,5 Monate alten Code

**Beweis (SSH-verifiziert):**
- `/opt/mapraiders/server/dist/index.js` — Build-Datum **27. März 2026**
- Service: `mapraiders.service` (systemd), `node dist/index.js`
- `curl https://api.mapraiders.com/api/leaderboards` → **404 "Endpoint not found"** (lokal in `server/src/index.ts:146` definiert)
- `curl https://api.mapraiders.com/api/health/crons` → **404** (Cron-Monitoring nicht deployed)

**Sichtbare Folgen in der App:**
- Leaderboard zeigt "No rankings yet" (Endpoint existiert nicht)
- Profile-Stats vermutlich betroffen: 0 Claims / 0 m² / 0 Quests bei Level 378 / 4.5M XP — Diskrepanz
- Alle 13+ Cron-Jobs (Decay, Clan-Formation, Leaderboards, Events) laufen ohne Monitoring — unklar ob überhaupt

**Fix:** `cd server && npm run build`, dist + node_modules auf Server, `systemctl restart mapraiders`. Vorher: lokal `npx tsc --noEmit` (0 Errors Pflicht). DB-Migrationen prüfen (Schema-Drift zwischen März-Stand und heute!).

**⚠️ Vorsicht:** 2,5 Monate Code-Diff inkl. Schema-Änderungen (`is_protected`, Soft-Delete etc.). Deploy braucht Migrations-Check, sonst crasht die API beim Start.

---

## 🚨 BLOCKER 3: i18n-Chaos — Deutsch/Englisch wild gemischt

**Play-Store-Relevanz:** Reviewer und Nutzer sehen eine unfertige App. Für DE-Nutzer wirkt es kaputt, für EN-Nutzer unverständlich.

| Screen | Zustand |
|---|---|
| Login | komplett EN |
| Map/Quests/Leaderboard/My Pet | komplett EN |
| Freunde | komplett DE ("Noch keine Freunde", "Spieler suchen") |
| Clan | komplett DE ("Kein Clan", "Clan erstellen") |
| Create-Menü | **gemischt im selben Screen**: Titel "Create" EN, Items DE ("Event erstellen", "Echo hinterlassen"), Footer EN |
| Settings | **gemischt**: "Dark Mode"/"Settings" EN, "E-Mail (nicht änderbar)"/"Speichern"/"TERRITORIUM-FARBE" DE |
| Profile | gemischt: "My Pet"/"Notifications"/"Activity Feed" EN, "Freunde"/"Mein Clan" DE |

**Fix:** i18n-System konsequent durchziehen (device-locale-basiert), alle hardcodierten Strings in Sprach-Files. Mindestens: EN komplett + DE komplett.

---

## ⚠️ Hohe Priorität (keine Blocker, aber vor Release fixen)

1. **Theme-System halb implementiert:** Dark-Mode-Toggle (Settings) wirkt nur auf Profile/Settings. Map, Quests, Login, Create sind hardcoded dark. Mit Toggle OFF entsteht Light/Dark-Flickenteppich beim Navigieren. → Entweder Toggle entfernen und alles dark forcen, oder Theme überall durchziehen.
2. **Activity Feed ohne Kontext:** Items zeigen nur "claimed territory" / "leveled up" — **kein Username, kein Zeitstempel, kein Ort**. Wirkt kaputt.
3. **Profile-Stats-Diskrepanz:** 0 Claims / 0 m² / 0 Quests vs. Level 378 / 4.5M XP. Nach Server-Deploy re-testen; wenn's bleibt → Stats-Aggregation debuggen.
4. **"1 Days" Grammatik** (Streak-Karte): Singular/Plural-Logik fehlt.

## ℹ️ Mittel/Niedrig

5. **Travel-Tab = "Coming Soon"-Platzhalter:** Google mag keine sichtbar unfertigen Features im Release. Empfehlung: Tab für v1.0 ausblenden (Feature-Flag), bei Fertigstellung einblenden.
6. **Quests "0 found nearby"** in ländlicher Test-Region — korrekt, aber Cold-Start-Problem: neue Nutzer sehen leere Welt. Seed-Content-Strategie für Launch-Städte überlegen.
7. **versionCode 1 / v1.0.0** — für Erstrelease ok. Neuer Build muss versionCode erhöhen.

---

## Empfohlene Reihenfolge zum Store

| # | Task | Aufwand | Blockiert Store? |
|---|---|---|---|
| 1 | Build-Pipeline fixen (Expo/AGP/Gradle-Matrix) | 2-4 h | **JA** |
| 2 | Server-Deploy (Build + Migrations-Check + Restart) | 1-2 h | **JA** (Leaderboard/Stats kaputt) |
| 3 | i18n konsolidieren (EN + DE vollständig) | 4-8 h | **JA** (Qualität) |
| 4 | Activity-Feed-Items + Stats-Bug + "1 Days" | 2-3 h | empfohlen |
| 5 | Theme-Entscheidung umsetzen | 1-2 h | empfohlen |
| 6 | Travel-Tab ausblenden | 30 min | empfohlen |
| 7 | Fresh EAS production AAB + versionCode 2 | 1 h | **JA** (Artefakt für Store) |
| 8 | Play-Console: Signing-Key registrieren, Listing, Data-Safety-Form | 2-3 h | **JA** |

**Realistischer Weg zum einreichbaren Build: 2-3 fokussierte Arbeitstage.**

---

## Anhang

- Screenshots: `test_01_launch.png` … `test_20_settings_bottom.png` (Projekt-Root)
- Geänderte Dateien heute: `mobile/android/gradle/wrapper/gradle-wrapper.properties` (8.11.1 → 8.13, Teil-Fix, noch nicht committet)
- Logcat: sauber (0 Errors über gesamte Session)
- Server-Detail: PM2 leer, API läuft via systemd `mapraiders.service`, Postgres-Container `mapraiders-postgres` up 7 Wochen

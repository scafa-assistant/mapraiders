# Streifzug-Modus , Spec (Ambient GPS + Push-Encounters)

**Status:** GEPARKT bis Tag-2-Retention via Play-Internal-Testing validiert ist (Phase-E-Gebiet, siehe Pivot 2026-06-14). Diese Spec hält die Design-Entscheidung fest, sie ist KEIN Bau-Auftrag.
**Datum Entscheidung:** 2026-06-23
**Kern-Entscheidung:** PvE-Default + PvP opt-in. NPC-Layer als Kaltstart-Motor und Welt-Füllung.

---

## 1. Pitch

Du gehst eh durch die Welt, die App ist "scharf". Echte Bewegung + Ort + Würfel triggern Encounters: Funde, Truppen-Rekruten, Schlachten, seltene Events. Das Leben wird zum Spielbrett. Zenly-/Pokémon-GO-Nerv, an MapRaiders-Systeme (Territorien, Truppen, Schlachten, F.1-Wirtschaft, Fog-of-War, Biome) angedockt.

## 2. Kern-Entscheidung: PvE-Default, PvP opt-in, NPC füllt

- **NPCs lösen Kaltstart.** Streuner, Räuberbanden, Patrouillen spawnen um jeden Spieler, unabhängig von Spielerdichte. Welt fühlt sich ab Tag 1 voll an, auch mit 3 Testern.
- **PvP wächst organisch rein.** Derselbe Encounter-Slot ("feindliche Truppe in der Nähe") wird mit steigender Population öfter ein echter Mensch statt NPC. Kein Umschalten nötig, nur die Quelle ändert sich.
- **Alarmbereitschaft** = der Push-Moment. Für das Gefühl ist egal, ob Bedrohung NPC oder PvP ist.
- **Difficulty:** NPC-Stärke skaliert mit Spieler-Level. PvP über Matchmaking-Bänder (kein L15 vs L2).

## 3. Encounter-Loop

Trigger = **Bewegung + Ort + Würfel** (nie Timer allein → Anti-Cheat + Akku).

| # | Typ | Push-Beispiel | Speist System |
|---|-----|---------------|---------------|
| 1 | Fund (Schatz/Ressource) | "Etwas glänzt 80m vor dir." | F.1 Extraktion / Hauling |
| 2 | Rekrut (Truppen) | "Söldner am Waldrand will sich anschließen." | Truppen / Biom (OSM): Wald→Späher, Stadt→Soldat |
| 3 | Schlacht / Überfall | "Du betrittst Gebiet von X. Wache stellt dich." | Schlachten, Beute, Sabotage |
| 4 | Echo / Späher-Sichtung | "Ein Späher meldet Bewegung." | Fog-of-War-Aufdeckung |
| 5 | Seltenes Event (1-2%) | "Etwas Legendäres in der Nähe." | Adrenalin-Kick, fettes Reward |

**Balancing-Pflicht:** Pity-Timer + Tages-Cap. Garantiert 1-3 Encounters pro aktiver Geh-Session, seltene Sachen echt selten. NIE "3 Tage passiert nix" (→ Deinstallation).

## 4. Technische Realität (die harten Gates)

- **`ACCESS_BACKGROUND_LOCATION`** = Play-Store-Sensitive-Permission. Eigenes Review + Demo-Video Pflicht. Reject-Risiko. NICHT vor Tag-2-Validierung einreichen.
- **Akku:** KEIN Continuous-GPS-Streaming. Stattdessen Android `Geofencing` + `SignificantMotion`/Activity-Recognition. App schläft, OS weckt sie bei echter Bewegung / Geofence-Eintritt (= Spawn-Punkt).
- **Push:** Android 13+ Runtime-Permission, kein Auto-Ja.
- **Anti-Cheat:** Bewegung-als-Trigger macht GPS-Spoofing attraktiv. Plausibilitäts-Check (Speed, Sprünge) ab Tag 1.

## 5. Rollout in zwei Stufen

**Stufe 1 , "Streifzug aktiv" (Foreground, KEINE Sensitive-Permission):**
- Button "Streifzug starten", App läuft als Foreground-Service (wie Fitness-Tracker, laufende Notification).
- Voller Encounter-Loop, NPC-Layer aktiv, PvE-Default + PvP opt-in.
- Braucht KEIN Sonder-Review, schont Akku, beweist den Loop.
- **Vereinbar mit Pivot:** testet exakt Tag-2-Retention ("ich geh raus, weil die App was gibt").

**Stufe 2 , echter Hintergrund ("scharf den ganzen Tag"):**
- Erst wenn Stufe 1 Nutzung + Wiederkehr zeigt.
- Dann Demo-Video + Background-Permission-Review, weil dann Daten den Aufwand rechtfertigen.
- Das ist Renés Vision (random mitten am Tag, immer scharf), aber der teuerste Teil.

## 6. Offene Punkte

- Encounter-Spawn-Dichte / Geofence-Radius tunen (Stadt vs Land unterschiedlich).
- NPC-Truppen-Stats + Loot-Tabellen definieren.
- Matchmaking-Bänder für PvP-Encounters.
- Integration mit "Meine Territorien"-Liste (Encounter in/nahe eigenem Gebiet?).
- Privacy/Recht: Hintergrund-Standort-Disclosure in Datenschutz (SCAFA INVESTMENTS LLC).

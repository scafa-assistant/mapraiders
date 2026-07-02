# FABLE-OPERATOR-BRIEFING , MapRaiders

> Uebergabe-Briefing fuer das neue, staerkere Modell ("Fable-Operator"), das MapRaiders als Operator uebernimmt.
> Erstellt 2026-07-01 durch eine Elite-Analyse (4 parallele Domaenen-Audits: Server, Mobile, Ops/Build/Deploy, GDD/Vision) + Kreuzanalyse. Council-Zweitmeinung: siehe §10.
> Sprache Deutsch, Code/Configs Englisch, keine Em-Dashes. Oeffentlich immer SCAFA INVESTMENTS LLC.

---

# TEIL A , DIE MISSION (dafuer braucht es Fable, nicht fuer den Hausmeister-Kram)

Der Hausmeister-Teil (Secrets, Deploy-Gate, toter Code, Doktrin-Drift) steht in TEIL B. Den raeumt der Vorgaenger weg. DEIN eigentlicher Auftrag ist ein ungeloestes PRODUKT-Problem, kein Code-Problem: **Zieht das Spiel? Noch nicht. Mach es so, dass N=1 (Rene selbst) es abends aus echtem Sog oeffnet, und morgen wieder.**

## Der Coup , der Doppel-Loop
Nicht "noch ein Lauf-und-Claim-Spiel" (das ist INTVL, erledigt). Der Coup ist eine **lebendige Welt auf der echten Landkarte, die dich in ZWEI Schleifen haelt**:

**DRAUSSEN , der Sog (bringt dich vom Sofa runter):**
- Der **reale Ort**, den DU mit deinen Beinen erlaufen hast und den du verteidigst (Zuhause, Gym, Cafe). Verlust tut weh, weil es ein echter Ort ist, nicht ein Pixel.
- **Unterwegs-Finden** (Streifzug): variable Belohnung, genau DIESER Weg lohnt sich, den du im Sitzen nie kriegst.
- **Rivalitaet**: einen Rivalen ueberholen, ein umkaempftes Ziel in der Naehe holen.

**DRINNEN , der Halt (behaelt dich auf der Couch):**
- Wenn du abends muede/faul zu Hause sitzt oder es regnet, brauchst du TROTZDEM etwas zu tun. Das ist der Commander-Layer: Territorium verwalten, Truppen kommandieren, Wirtschaft einsammeln, Spaeher schicken, schmieden, auf die lebendige Welt reagieren.
- **Das ist der Retention-Moat.** Die meisten GPS-Spiele sterben an Regentagen, weil sie nur draussen funktionieren. MapRaiders hat dich auch dann. Draussen erobert wird drinnen verwaltet und bedroht, und das treibt dich morgen wieder raus.

**Der KI-General = das Kreislaufsystem, das beide Loops speist** (nicht das Herz, der Motor): er macht die Bedrohung draussen ECHT (jemand marschiert auf dein Land, du MUSST raus) UND die Couch-Zeit LEBENDIG (es passiert immer etwas, es gibt immer einen Zug). Ohne ihn ist der Indoor-Loop leer und der Outdoor-Threat existiert bei duenner Spielerdichte gar nicht. Er ist damit auch die Antwort auf das Kaltstart-Problem: die Welt lebt, auch wenn ausser dir kein Mensch in der Stadt spielt. Das ist der Moat gegen Pokemon GO (kein Massendichte-Zwang) UND gegen INTVL (Tiefe statt nur Claim).

## Der Beweis, der fehlt (warum der Coup NICHT erreicht ist)
Die Organe des Sogs sind alle gebaut, aber genau der Motor ist AUS: die lebendige Welt haengt hinter default-AUS-Flags, und der General laeuft ohne API-Key nur als dumme Zustandsmaschine (FSM). Heisst: ein frischer Spieler bekommt aktuell die Gridwalker-Grundschleife (laufen, claimen, XP), aber NICHT das Versprechen der lebendigen Welt. Es ist Beschaeftigung, noch kein Drama. Ohne Drama kein Sog. Der Tag-2-Pivot misst deshalb gerade das Falsche, solange der Motor dunkel ist.

> **KORREKTUR NACH CODE-VERIFIKATION (Fable, 2026-07-02):** Die Diagnose oben war auf Server-Ebene veraltet. Ist-Stand: alle Flags ausser tcg sind LIVE auf enabled/100%, und der General laeuft auf der ECHTEN LLM-Kaskade (83 von 97 Direktiven source=llm, Gemini 2.5 Flash primary). Der Motor war AN, aber drei Bruchstellen im Getriebe hielten die Welt trotzdem tot, alle am 2026-07-02 gefixt und deployed:
> 1. **Sim folgte nur Spieler-Aktivitaet** (phaseDJobs): ein triggered-Sektor fror ein, sobald dort 14 Tage niemand lief. Der General befahl weiter (97 Direktiven, 20 Tage unausgefuehrt, executed_at NULL), aber nichts marschierte. Fix: aktive Sektoren simulieren immer (+ Direktiven-TTL 48h + FORTIFY-Cap 30).
> 2. **Kampfpfad hatte keine Pushes** (troopEngine/aiSimEngine): under_attack/battle_resolved gingen nur per WS, eine geschlossene App sah nie etwas. Fix: Push bei Angriffs-Dispatch (PvP + KI), Ausgangs-Push an den Verteidiger (neuer Typ battle_resolved, HIGH, umgeht Ruhezeiten).
> 3. **Es wurde noch NIE ein Push zugestellt:** users.push_token sind Expo-Tokens, pushService sprach aber Firebase-Admin ohne Credentials. Fix: Expo-Push-API-Pfad im pushService + FCM-V1-Service-Account-Key (Firebase-Console generiert, bei EAS hochgeladen, Kopie in ~/.ssh/mapraiders-deploy/). Ende-zu-Ende verifiziert: echter Push kam auf DopeRunners Geraet an.
>
> Damit steht die Erste-Nacht-Kette: General denkt (LLM, 6h-Takt) -> Sim fuehrt aus (stuendlich, auch ohne Spieler-Praesenz) -> Probe-Attack marschiert -> Verteidiger kriegt Push mit ETA -> Kampf loest auf -> Ausgangs-Push. Was JETZT fehlt, ist nicht Infrastruktur, sondern der N=1-BEWEIS (zieht es Rene?) und danach die Loop-Verkettung/progressive Enthuellung.

## Fables eigentliche Aufgabe (in dieser Reihenfolge)
1. **Indoor-Loop lebendig & intelligent machen.** General mit echtem Modell, gespeist aus den Labor-Datenketten (Bewegungsmuster, OSM-Kontext, Spielerverhalten, Territoriums-Historie), so dass Couch-Zeit nie leer ist und Bedrohung glaubwuerdig inszeniert wird. Das ist Orchestrierung ueber viele Signale , genau die Klasse Problem, wo ein staerkerer Kopf gewinnt.
2. **Outdoor-Sog schaerfen.** Reale-Ort-Bindung (warum DIESES Territorium: Zuhause/Gym/Cafe), Unterwegs-Finds mit Stakes, Rivalen-Overtake mit Uhr und Push.
3. **Die zwei Loops verketten.** Draussen erobert -> drinnen verwaltet/bedroht -> treibt morgen wieder raus. Das Flag/Capability-System von An/Aus zu progressiver Enthuellung umbauen: Onboarding dosiert die Verlockung, statt alles dunkel zu lassen.
4. **N=1-Sog beweisen** (Rene oeffnet abends aus Sog), dann N=3 Tester. ERST danach skalieren.

**Explizit NICHT Fables Aufgabe (Bloat-Falle):** TCG/Phase E, F.4 Ruinen-Tech, Social Layer 2.0 , alles VOR dem N=1-Sog-Beweis. Breite hat dieses Projekt genug; was fehlt, ist Tiefe an der EINEN Schleife, die suechtig macht.

---

# TEIL B , PFLICHTPROGRAMM (Betrieb & Substanz, raeumt Fable den Weg frei)

## 1. Dein Auftrag & die heilige Regel
MapRaiders ist ein GPS-Territory-MMO (React Native/Expo Mobile + Node/Express/PostGIS/Redis Server). Ein-Personen-Projekt, Owner: Rene ("Gigi"), Kommunikation Deutsch.

**Die eine Regel ueber allem , der Gruender-Pivot (2026-06-14):** VALIDIEREN VOR AUSBAUEN. Kern-Loop (Install -> 1. Territorium -> Tag-2-Retention) via Play-Internal-Testing beweisen, BEVOR neue Systeme gebaut werden. Das groesste Risiko dieses Projekts ist nicht Mangel, sondern Bloat: enorm viel ist bereits gebaut. Dein Reflex "noch ein System bauen" ist hier der Feind.

## 2. Grundregeln (nicht verhandelbar)
- **Aktuelle Architektur strikt von Zukunftsvision trennen.** Gigi wird sauer, wenn beides vermischt wird.
- **Bei Konflikt gewinnt der bestehende Code**, nicht die Doku.
- **Git-Push nur lokal** (Sandbox hat keine GitHub-Auth). `.git/index.lock` bleibt nach parallelen Agents manchmal stecken -> per `mv` umbenennen.
- **Server-Gate:** `cd server && npx tsc --noEmit` muss 0 Fehler zeigen (aktuell: 0). Mobile ebenso (aktuell: 0).
- **Keine destruktiven Aktionen** ohne Blick auf das Ziel. Account-Loeschung = Soft-Delete (owner_id=NULL). Seed-Territorien sind is_protected=TRUE.
- **Oeffentliche Dokumente:** nie persoenliche Namen, immer SCAFA INVESTMENTS LLC, Kontakt info@scafa-investments.com.
- **Nicht bauen (Zukunftsvision/Policy-Falle):** Krypto-Waehrung, Wager/Wett-Matches (IARC-Gluecksspiel), Pink-Slip-Territory-Transfer, Spieler-KI-Waechter, Background-Streifzug (vor Tag-2), TCG (vor Policy-Klaerung).

## 3. KORRIGIERTE DOKTRIN (WICHTIG: die Handoff-Docs selbst driften vom Code)
Die Analyse fand, dass CLAUDE.md + Memory an harten Stellen VERALTET sind. Vertraue dem Code, nicht der alten Doktrin. Diese Werte sind gegen den echten Code verifiziert (Stand 2026-07-01):

| Thema | Alte Doktrin (falsch) | Realitaet im Code (Source of Truth) |
|---|---|---|
| Gradle-Version | "MUSS 8.11.1" | `gradle-8.13-bin.zip` (Bereich 8.11-8.13, nur NICHT 9.x) |
| Android SDK | compile/target 35 | `build.gradle` ext: compile/target **36**, minSdk 24, buildTools 36.0.0, ndk 27.1.12297006 |
| New Architecture | (unerwaehnt) | `gradle.properties` `newArchEnabled=true` |
| Cron-Anzahl | "13+ Jobs" | ~30-39 registrierte Crons |
| versionCode | app.json (=1) | **build.gradle (=2) gewinnt** im bare Workflow; app.json-Edit wirkt nicht |
| Dev-DB-Port | setup.sh generiert 5432 | Docker exposed **5433** (setup.sh:56 ist der Bug) |

Ziehe CLAUDE.md + Memory bei Gelegenheit nach. Der `ext{}`-Block in `mobile/android/build.gradle` ist die Android-Config-Wahrheit.

## 4. Ist-Zustand kompakt (zwei Visionen, ein Codebase)
- **Ebene A , Gridwalker (gebaute, validierte Basis):** Outdoor-Social-MMO. Bewegungsklassen, Territory-Claim durch echtes Laufen, UGC (Quests/Echos/Challenges/Artefakte), Pets, Duelle, Rennen, Clans, Bounties, Alias, Traps, Silent Zones, Resonance, Meetups, Events, Wetter. Wettbewerber: INTVL (~790k DL). Differenzierer = Content-/Oekosystem-Layer.
- **Ebene B , Master-GDD Strategie-MMO (gebaut, server-live, aber "dark shipped"):** Explorer/Commander/TCG + Hybrid-KI-General. Phasen 0-D + Wirtschaft F.1/F.2/F.3 sind fertig und server-live, im Mobile aber hinter Doppel-Gate (Feature-Flag + Server-Capability), **default AUS**.
- **KRITISCH , "FERTIG" heisst hier server-live + dark-shipped, NICHT beim Nutzer sichtbar.** Ein frischer Tester ohne serverseitige Flag-Freischaltung sieht NUR die Gridwalker-Basis, obwohl die Landingpage Commander/Wirtschaft/Spionage als LIVE-Pillars bewirbt. Siehe §6-B1.
- **Verlaesslichste Ist-Quelle:** `_docs/gdd/BRIEFING_LANDING_PAGE_FEATURES.md` + Code. Der Master-GDD ist Vision und veraltet (Brand, Wager, Anhang A behauptet faelschlich "Commander nicht gebaut").
- **Substanz-Note:** tsc=0 auf beiden Seiten; Server-Oekonomie zeigt durchgehende Tx+FOR-UPDATE-Concurrency-Disziplin (kein Double-Spend); Mobile-Release-Crashes (Hermes) sind gefixt + gegen Regression kommentiert. Das ist A-Player-Substanz, kein Wegwerf-Prototyp.

---

## 5. BEFUNDLISTE (dedupliziert ueber 4 Domaenen, cross-bestaetigt markiert)

### P0 , existenziell
- **[P0] ERLEDIGT 2026-07-02 (Fable):** DB-PW + Root-PW rotiert (neue Werte in `~/.ssh/mapraiders-deploy/secrets.local.md`, nicht im Repo), SSH auf key-only (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`), DEPLOYMENT.md von Klartext befreit. Die geleakten JWT-Werte waren NICHT live (Server-.env nutzte laengst andere), keine Session-Invalidierung noetig. Rest-Fund: Container `mapraiders-postgres` traegt altes PW als `POSTGRES_PASSWORD`-Env (wirkt nur bei Neu-Init mit leerem Volume, notiert). History-Scrub bewusst uebersprungen (privates Repo + Werte tot).
- **[P0][Server+Ops bestaetigt] Secrets im Klartext im Repo.** SSH-Root-PW + DB-PW + JWT-Secrets stehen im Klartext in `DEPLOYMENT.md` (und damit in der Git-History). Verschaerfend: derselbe Hetzner-VPS traegt AUCH das EGON-Backend -> Blast-Radius > MapRaiders. **Fix:** SSH auf key-only (Deploy-Key `~/.ssh/mapraiders-deploy/deploy_key` existiert), Root-PW + DB-PW rotieren, Klartext aus der Doku entfernen, Git-History-Scrub erwaegen. (Werte hier bewusst nicht wiederholt , Fundort: DEPLOYMENT.md Z.9/76/93/95-96.)

### P1 , hoher Impact
- **[P1] ERLEDIGT 2026-07-02 (Fable, commits 91f681a+418fa43):** Deploy-Gate `deploy-server.sh` gebaut und im Ernstfall getestet (lokales tsc-Gate, Push-Gate, npm ci voll, direkter node_modules-tsc, Full-Rebuild wegen incremental:true, Artefakt-Frische-Check, Restart+Health mit Auto-Rollback auf dist-Backup, HTTPS-Gate). DEPLOYMENT.md-Update-Sektion umgestellt, Landmine dokumentiert.
- **[P1][Server+Ops bestaetigt] tsc-Strip-Deploy-Landmine.** `DEPLOYMENT.md` (Z.68-70 + 208-216) nutzt `npm install --production` + `npx tsc`. `typescript` steht in devDependencies (`server/package.json:61`), wird von `--production` NICHT installiert -> `npx tsc` kompiliert nicht neu, Exit 0 -> `systemctl restart` startet ALTES `dist/`. Scheitert LEISE: gruener Deploy, neue Routes 404. **Fix (Gate, kein Symptom):** `npm ci` -> `./node_modules/.bin/tsc -p tsconfig.json` (kein `npx`) -> Artefakt-Check (mtime `dist/index.js`) -> restart -> `curl -fsS https://api.mapraiders.com/api/health` als Gate BEVOR "deployed" gilt. Vorbild fuer verify+rollback: `deploy_mapraiders_301.sh` (macht es fuer nginx richtig).
- **[P1][Server] claimEngine Cross-Transaction-Write unter gehaltenem Lock.** In `handleTerritoryCreation` (haelt `FOR UPDATE` auf territories) ruft `balanceService.recordTerritoryLoss` (Z.606) ein separates `UPDATE users` in EIGENER Verbindung/Tx. (a) Rollt die aeussere Tx danach zurueck, ist der Loss-Counter schon erhoeht -> Verteidiger faelschlich Richtung 30%-Tageslimit gedrueckt. (b) Pool-Starvation/Deadlock-Risiko (neue Verbindung waehrend FOR-UPDATE, Pool max 20). **Fix:** `processRoute` in eine `transaction()` ziehen und `client` durchreichen (das withClient-Muster, das buildingEngine/energyService bereits nutzen).
- **[P1][Server] Cron-Lock nicht atomar.** `cronMonitor.ts:46` macht get-then-set statt Redis `SET NX`. Zwei gleichzeitige Feuerungen koennen beide den Lock erwerben , Zeitbombe bei Skalierung/Job-Overlap. `releaseCronLock:65` setzt `''` mit TTL statt `DEL`. **Fix:** `redis.set(key, v, 'NX', 'EX', ttl)` + echtes `del`.
- **[P1][Server] aiVerification ist accept-all Stub.** `aiVerification.ts:51/85/110` (verifyPhoto/Video/Audio) geben hartkodiert `true`, genutzt in `questEngine.ts:653/662`. Betrifft nur Foto/Video-Quest-Steps (nicht den Claim-Kern). **Vor Content-Launch:** echte Vision/EXIF-Integration ODER Zwang auf `manual_review`.
- **[P1][Mobile] Toter GPS-Zwilling.** `services/gps.ts` (`gpsService`) + `hooks/useLocation.ts` = komplettes zweites Tracking-System, nirgends importiert (live ist nur `locationStore`). Zwei divergierende Movement-Klassifikationen. ~400 LOC loeschbarer Ballast + latente Verwechslungsgefahr. **Fix:** loeschen, eine Klassifikationsquelle.
- **[P1-Debt][Mobile] God-Components.** `MapScreen.tsx` (2284 LOC, 21 useState/14 useEffect) + `CommanderMapScreen.tsx` (~2300 LOC) tragen die halbe Spiellogik. **Fable-Hebel:** Overlay-Layer in `useMapLayer(bbox)`-Hooks + memoized Marker zerlegen (parallelisierbar, loest Re-Render-Last, konzentriert die WS-any-Casts).

### P2 , Debt & Skalierung
- **[P2+B4] ERLEDIGT 2026-07-02 (Fable, commit d440184):** Weather-Precedence-Bug gefixt, WS-sendLocationUpdate auf 5s gedrosselt, AsyncStorage-Location-Persist auf 15s (GPS tickt ~1/s; Route-Aufzeichnung ungedrosselt). Release-APK gebaut, auf Testgeraet installiert (laeuft, Commander-Tab + Wirtschaft sichtbar) und als mapraiders.com/mapraiders.apk serviert. Hinweis: Testgeraet 0011134AV000352 ist ein CMF Phone 1 von Nothing (Codename Tetris, Modell A015), NICHT Samsung.
- **[P2][Mobile] Weather-Precedence-Bug** `MapScreen.tsx:201`: `latitude ?? 0 - lat` parst als `latitude ?? (0-lat)` -> Throttle defekt, Weather-API feuert bei jedem GPS-Update (Fehler still gecatcht). **Fix:** `(currentLocation?.latitude ?? 0)`. (Batterie-relevant im Geh-Test , siehe §6-B4.)
- **[P2][Server] claimEngine.processRoute nicht atomar (Orchestrierung).** 4 separate Writes ohne gemeinsame Klammer (INSERT routes / handleTerritoryCreation / awardXp / INSERT feed_events) -> partieller Zustand moeglich (Route ohne Territory, Takeover ohne XP/Feed). Gleicher Fix wie P1-claimEngine (eine Tx).
- **[P2][Server] aiGeneral gatherAggregates Doppel-Scan + JS-Filter.** `gatherAggregates:158` scannt `territories` 2x mit LIMIT 3000 und filtert H3-Sektor in JavaScript statt den GIN-Index `idx_territories_h3` via `h3_cells && ARRAY[...]` in SQL zu nutzen; `place_history` LIMIT 5000 Full-scan. **Fable-Hebel:** index-getriebene Query, Doppel-Scan zusammenfuehren (Faktor-10/Tick realistisch).
- **[P2][Server] decayEngine Per-Row-Loop.** `runTerritoryDecay:60-83` laedt alle Territorien und macht Per-Row-UPDATE in JS-Schleife, ohne Tx/Batch (idempotent, aber O(n) taeglich 04:00). **Fix:** set-based CTE/UNNEST-UPDATE.
- **[P2][Server] Cron-Health-Monitoring-Luecke.** `getCronHealth:78` listet 8 hartkodierte Namen; die Decay-Sub-Jobs + ~20 Phase-Jobs stehen nicht drin -> `/api/health/crons` zeigt fuer die halbe Landschaft null. Stiller Cron-Ausfall bleibt unbemerkt. **Fix:** `getCronHealth` dynamisch per Redis-SCAN ueber `cron:history:*`.
- **[P2][Server] eventEngine Loot laeuft ins Leere.** `eventEngine.ts:310`: Loot-Typen title/artifact/streak_freeze nicht eingeloest, obwohl der 30-min-Loot-Cron `title` spawnt. Spieler sieht Loot-Event im Feed, bekommt nichts.
- **[P2][Server+Mobile] any-Cast-Erosion (~480 total).** Server 351 in 84 Dateien (Hotspots troopEngine/routes/commander/defenseGameEngine); Mobile 129 (API-Response + WS-Payloads). **Fable-Hebel (Synergie):** EIN getippter DTO-Vertrag aus dem Server-Schema fixt beide Seiten + haertet Input-Validierung (zod).
- **[P2][Mobile] i18n-Leaks.** `HackingScreen.tsx:485/506/542` (hart DE), `CommanderMapScreen.tsx:1095/1534` ("Haul home" hart EN). de/en sonst 1:1. **Fix + i18n-Lint-Gate im Pre-Commit.**
- **[P2][Mobile] echoProximity.playedEchoIds** waechst monoton, `resetPlayed()` nie aufgerufen.
- **[P2][Ops] build-apk.sh gefaehrlich.** Option 2 laeuft `npx expo prebuild` -> regeneriert `android/`, ueberschreibt ext{}-Block/Heap-Bump/signingConfigs UND das native OTA-Flag `ENABLED=false`. Zusaetzlich bietet Option 1 EAS-Cloud-Build an (gegen die Local-Gradle-Doktrin). **Fix:** Skript neu schreiben (kein prebuild) oder auf den `apk-build`-Skill verweisen. (Siehe §6-B3.)
- **[P2][Ops] OTA-Flag halb-scharf.** Nativ korrekt geparkt (`AndroidManifest.xml` `ENABLED=false`, verifiziert), aber `app.json` hat `updates.url`+`runtimeVersion "1.0.0"` OHNE `updates.enabled:false` -> JS-Config sieht "an" aus. Solange geparkt auch in app.json `"enabled": false` setzen.
- **[P2][Ops] setup.sh Port 5432** statt 5433 (siehe §3). **[P2][Ops] Release-APK mit debug.keystore** signiert , OK fuer internes Testen, aber Play-Production-AAB NUR via EAS managed signing.

### NIT
Rate-Limit-Fenster nicht gleitend (Server); 19 console.log (Mobile); docker-compose "server"-Service ungenutzt (Port-3000-Kollisionsrisiko); duelEngine.completeDuel:412 ohne Owner-Re-Check zum Abschluss (Korrektheits-Edge, atomar).

---

## 6. STILLE FOLGEPROBLEME (Propagation , das, was die meisten uebersehen)
- **B1 (STRATEGISCH #1) Flags default-AUS vs. Landing verspricht "live".** Landing bewirbt Commander/Wirtschaft/Spionage als LIVE -> im Mobile default AUS -> fuer Tester muessen Server-Flags an sein. FOLGE: Der Pivot validiert Tag-2-Retention, MISST aber das Falsche, wenn die versprochenen Pillars beim Tester dunkel sind. Erwartungs-Gap (Strategie-MMO angekuendigt, laufen->claimen geliefert) verbrennt genau das Retention-Signal, das validiert werden soll, und das Privacy-Vertrauen. **Das ist der wichtigste einzelne Hebel: kein Bau, sondern Flag-Provisioning + Onboarding-Verkettung.**
- **B2 Kaltstart-Motor hinter default-AUS.** NPC/PvE + Streifzug + Hybrid-KI-General fuellen die Welt unabhaengig von Spielerdichte (staerkstes Asset gegen Geisterstadt). aiGeneral laeuft ohne API-Key als deterministische FSM (Kosten 0). ABER Flags pve_spawns/economy/commander muessen an sein. Gleiche Wurzel wie B1.
- **B3 build-apk.sh reaktiviert still OTA.** prebuild wischt `ENABLED=false` -> ungereviewtes JS koennte auf Tester-Handys landen, exakt das, was CLAUDE.md geparkt hat.
- **B4 Walk-Test-Killer stapeln sich.** Weather-Precedence-Bug + ungedrosseltes WS-sendLocationUpdate hammern Netz/Batterie beim Gehen , genau waehrend des Tag-2-Geh-Tests, von dem der Pivot abhaengt.
- **B5 Content-Layer hat Fake-Verifier.** aiVerification accept-all gated Foto/Video-Quests; UGC ist der Gridwalker-Differenzierer gegen INTVL -> Content-Launch vor echter Verifikation flutet Cheating den differenzierenden Layer.
- **B6 Loot laeuft ins Leere** (eventEngine, siehe P2) , sichtbar im lokalisierten Feed.

## 7. WO DU (FABLE) DEN GROESSTEN HEBEL HAST (Orchestrierung > Einzel-Fix)
1. **Strategisch , Flag/Capability-System von An/Aus zu progressivem Unlock-Onboarding umbauen** (loest B1+B2). Braucht Vision + Code + Funnel in einem Kopf. Hoechster Wert.
2. **Deploy-Verifikations-Gate** statt Symptom-Fix (P1-Landmine).
3. **Getippter DTO-Vertrag Server<->Mobile** (~480 any-Casts, cross-domain, multi-file).
4. **God-Component-Zerlegung** MapScreen/CommanderMapScreen in Layer-Hooks (parallelisierbar).
5. **claimEngine.processRoute-Atomaritaet** (subtiles Cross-Tx-Reasoning).
6. **aiGeneral index-getriebene Query** (elegante SQL, Faktor-10).

## 8. PRIORISIERTE ARBEITS-REIHENFOLGE
**Sofort (Betrieb/Sicherheit, kein Feature-Bau):**
1. P0 Secrets rotieren + VPS haerten.
2. P1 Deploy-Verifikations-Gate (killt die teuerste Betriebsfehlerklasse).
3. P2 build-apk.sh entschaerfen + OTA-Flag doppelt sichern (B3).
4. Korrigierte Doktrin (§3) in CLAUDE.md/Memory nachziehen.

**Vor/waehrend Tag-2-Validierung (Pivot-kritisch):**
5. B1/B2 Flag-Provisioning fuer Tester synchronisieren (Landing-Pillars serverseitig an) + Onboarding laufen->claimen->Commander verketten.
6. P2 Weather-Precedence-Bug + WS-Drosselung (B4, Batterie im Geh-Test).
7. Streifzug Stufe 1 echter Geh-Test.

**Danach (Debt, wenn Loop traegt):**
8. P1 claimEngine-Tx + P1 Cron-Lock SET NX + dynamisches Cron-Health.
9. P1 toten GPS-Zwilling loeschen; P2 i18n-Leaks + Lint-Gate.
10. P1-Debt God-Components zerlegen; P2 DTO-Vertrag gegen any-Casts.
11. P2 aiGeneral index-getrieben; decayEngine set-based; eventEngine-Loot einloesen.
12. aiVerification-Entscheidung VOR Content-Launch erzwingen.

**Nicht anfassen bis Retention-Signal:** Phase E TCG, F.4 Ruinen-Tech, Streifzug Stufe 2, Social Layer 2.0. Danach EINES, nicht beides parallel (Hauptstadt-Wahl oder TCG je nach Tester-Daten).

## 9. WAS BEWUSST NICHT ANFASSEN (beide Codeseiten bestaetigen)
- **Server-Concurrency-Kerne:** claim-Kern, battleEngine, buildingEngine, extractionService, itemService, troopEngine, energyService, resourceService, duelEngine. Richtig gebaut, Refactoring = reines Regressionsrisiko ohne Upside.
- **Mobile:** polyfills.ts (deckt beide Hermes-Release-Crashes), api.ts-Interceptor (Token-Refresh-Queueing), featureStore-Resilienz, wsEventHandler-Wiring, fx-Service, i18n-Container-Swap, App.tsx-Lifecycle.

---

## 10. COUNCIL-ZWEITMEINUNG (Market Oracle Council, persona_set=code)
> Status 2026-07-01: Der Council-Slot war beim Erstellen dieses Briefings durch einen laufenden EGON-Council belegt (nicht wegschiessen). Dieser Abschnitt wird gefuellt, sobald der MapRaiders-Code-Council durchgelaufen ist. Der Council bekommt dieselbe Aufgabe (Elite-Analyse + Handoff-Befunde) mit Code-Zugriff und die vier Analyse-Dateien als Material. Ergebnis wird hier gemergt: Bestaetigungen, Widersprueche zu §5, und zusaetzliche Befunde.

_[PENDING , wird nach Council-Lauf ergaenzt]_

---

## 11. Anhang , Betriebs-Fakten
- **Build (APK, lokal):** `cd mobile/android && ./gradlew assembleRelease` (~5 min, cached ~27s), Skill `apk-build`. KEIN `expo prebuild`. Release signiert mit debug.keystore -> `adb install -r` ohne uninstall. Testgeraet Samsung A015 serial `0011134AV000352`, 1080x2400.
- **Server-Gate:** `cd server && npx tsc --noEmit` = 0.
- **Deploy:** Hetzner VPS "zoro" 159.69.157.42 (nginx). Web-Deploy via GitHub Action (`docs/`, mit curl-200-Gate). Server-App-Deploy MANUELL, ohne CI, ohne Gate (siehe P1-Landmine). Deploy-Key `~/.ssh/mapraiders-deploy/deploy_key`, nginx `/etc/nginx/sites-available/mapraiders`.
- **Docker:** PostGIS 5433, Redis 6379, Healthchecks vorhanden.
- **EAS:** Project ID 11263b5c-0b4f-4039-bc2a-9f9ebe3c0769, preview=APK, production=AAB. OTA geparkt (ENABLED=false nativ).
- **Test-Account:** DopeRunner (workspace.scafa@gmail.com), Level 15, 2 Territorien in SUNDERN (nicht Berlin). Web mapraiders.com/play.
- **Credentials:** liegen in `~/.claude/council.json` (Council) und , als Finding , im Klartext in DEPLOYMENT.md (rotieren!). Werte in diesem Briefing bewusst nicht abgedruckt.
- **Analyse-Rohbefunde:** im Session-Scratchpad `analysis_server.md`, `analysis_mobile.md`, `analysis_ops.md`, `analysis_gdd.md`, `kreuzanalyse.md`.

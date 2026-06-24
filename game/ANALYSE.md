# MapRaiders , Elite-Analyse aller Zyklen, Features & Wege

**Zweck:** Grundlage für den UX-Umbau ("schöner verpackt, einfacher, mit Erklärschritten"). Erst verstehen, dann optimieren.
**Quelle:** Aktueller Build , `mobile/src` (Navigation, Screens, Stores) + `server/src` (Engines) + GDD-Dokumente. Stand 2026-06-23.
**Methode:** First-Principles. Was IST gebaut, wie hängt es zusammen, wo bricht die UX, wie löst man es.

---

## 0. Kernbefund (TL;DR)

MapRaiders ist heute **zwei Spiele in einer App**, die sich überlagern:

1. **Gridwalker-Layer (Ursprung):** Bewegungs-RPG. Klassen (Walker/Runner/Cyclist/Skater/Dog Walker/Driver), Straßen claimen, Quests/Echos/Challenges/Artefakte hinterlassen, Pet-System, Travel-Routen.
2. **Commander-Layer (Evolution):** Strategie-MMO. Gebäude, Ressourcen-Wirtschaft, Truppen, Schlachten, Würfel, Fog of War, NPC-Gegner (Hacking/Terminal), Airstrikes/Hacks.

Beide Layer leben parallel im Code: **6 Tabs, ~40 Screens.** Der Commander-Tab ist hinter Feature-Flag + Capability versteckt und "ships DARK", der Travel-Tab ist für v1.0 ausgeblendet. Das sind Symptome einer **unfertigen Konsolidierung** , das Produkt hat sich von "Bewegungs-RPG" zu "Strategie-MMO" verschoben, aber die alte Welt ist nie aufgeräumt worden.

**Das ist die Wurzel deines Bauchgefühls.** Es ist nicht die Optik einzelner Screens, es ist das Fehlen **einer** klaren Fantasie und **eines** roten Fadens. Die Landingpage hat das schon gelöst (Strategie-MMO, "wer wirst du"). Die App muss nachziehen.

**Optimierungs-These:** EINE Fantasie nach vorne stellen (Strategie/Eroberung), die Tiefe **progressiv enthüllen** statt alles auf einmal, und jede neue Funktion beim ersten Kontakt **in Schritten erklären**.

---

## 1. Vollständige Feature- & Screen-Landkarte

### 1.1 Navigation (Ist-Zustand)
**Bottom-Tabs (`MainNavigator`):** Map · Quests · **Create (+)** · Travel\* · Commander\*\* · Profile
\*Travel = `SHOW_TRAVEL_TAB=false` (ausgeblendet). \*\*Commander = doppeltes Gate (Feature-Flag + Capability), startet dunkel.

### 1.2 Screens je Stack (~40)
- **Map-Stack (Hub):** MapMain + Modals: TerritoryDetail, ChallengeList/Detail, EchoList/Detail, ArtifactDetail, PlaceHistory, DefenseSetup, DefenseChallenge, MeetupDetail/Chat, **TicTacToe**, **MiniChess**, **Hacking** (NPC: scout_disc / tech_drone / aether_leech / water_strider_source / forest_construct_source, Level 1-3, biom-abhängig), **Terminal** (Handel/Logistik, Level 1-3).
- **Quests-Stack:** QuestList · QuestDetail · QuestPlay.
- **Create-Stack:** CreateMenu -> QuestCreate · EchoCreate · ChallengeCreate · TravelRouteCreate · MeetupCreate.
- **Travel-Stack (versteckt):** List · Detail · Play.
- **Commander-Stack (dunkel/gated):** CommanderMap · BattleReplay · DicePouch.
- **Profile-Stack:** ProfileMain · Settings · Pet · Notifications · Clan · CreateClan · ClanChat · Feed · Leaderboard · Friends · FriendRequests · PlayerSearch · PlayerProfile.

### 1.3 Verifizierte Systeme (LIVE, server-seitig)
Territorien/Claim/**Decay** (täglich 04:00 UTC) · Gebäude (Teleporter, Radar, Garrison, Schild-Generator, Raffinerie, Sägewerk, Steinbruch, Farm, Fischerei, Silo) · Ressourcen/Extraktion/Hauling/**Terminals**/mehrere Währungen · **Fog of War** (3 Stufen) · Silent Zones/Traps · Duelle · Schlachten/Truppen · PvE/NPC-Spawns · Verteidigungs-Minispiele (TicTacToe, Schere-Stein-Papier, Mini-Schach) · Airstrikes/Hacks · Clans · Ranglisten/Titel · Events/Bounties · Quests/Echos/Challenges/Artefakte · Freunde/Meetups/Resonanz · Pets/Rennen/Wetter · Anti-Cheat. **Streifzug = in Entwicklung.**

### 1.4 Datenmodelle (Kern)
UserProfile (level, xp, totalClaims, totalArea, currentStreak, titles, classBreakdown) · Territory (polygon, decayPercent, movementClass, area, color, hasDefense) · Quest/QuestStep (FIND/LISTEN/CHALLENGE/SOLVE/COLLECT/DOG) · Echo · Challenge (honor/video/sensor) · Pet (explorer/tracker/guardian).

---

## 2. Alle Zyklen (Cycles)

### 2.1 Core Loop (was der Spieler real tut)
**BEWEGEN -> EROBERN -> BAUEN -> PRODUZIEREN -> AUFKLÄREN -> KÄMPFEN -> VERTEIDIGEN -> (wiederholen)**
Bewegung (GPS) ist der Input; Territorium der Besitz; Gebäude+Wirtschaft der Aufbau; Aufklärung+Kampf die Spannung; Decay der Druck, der alles in Bewegung hält.

### 2.2 Zeitliche Zyklen
- **Mikro (Session, Minuten):** App auf -> Karte -> claimen/Encounter -> 1 Aktion (bauen/sammeln/kämpfen) -> zu.
- **Meso (täglich):** Decay 04:00 UTC zwingt zur Pflege; Ressourcen-Produktion (auch offline) abholen; tägliche Bounties/Events.
- **Makro (wöchentlich/saisonal):** Territorium verteidigen/zurückerobern, Clan-Wettbewerbe, Ranglisten, Titel, Saison-Events.
- **Progression:** XP -> Level -> Titel + **Unlock-Gating** (Newcomer -> Claimer -> Creator -> Architect -> Legend). Rechte werden durch Bewegung verdient, nicht gekauft.

### 2.3 Subsysteme als eigene Schleifen
- **Wirtschaft:** Biom (OSM) -> Extraktion -> Hauling/Logistik -> Lager/Silo -> Bauen/Aufrüsten -> mehr Extraktion. Terminals = Handelsknoten.
- **Kampf:** Aufklären (Radar/Späher) -> Ziel -> Truppen stellen -> Schlacht/Duell -> Beute/Gebiet. Verteidigung über Garrison/Schild + Minispiele.
- **Aufklärung:** Fog of War (unerforscht/erforscht/aktiv) -> Späher erweitern Sicht -> Radar zeigt Gegner -> Silent Zones/Traps für Hinterhalt.
- **Social:** Clans (organisch+manuell) -> Bezirk-vs-Bezirk -> Ranglisten/Titel -> Events/Bounties -> Meetups/Resonanz. Echos/Quests/Artefakte = Spieler-Content-Schleife.
- **Pet/Travel (Gridwalker-Erbe):** Hund-XP/Spezialisierung; Langstrecken-Ghost-Mode. Beide aktuell randständig (Travel versteckt).
- **Streifzug (kommt):** Ambient-Loop , Bewegung+Ort+Würfel triggert Push-Encounter (Fund/Rekrut/Schlacht), PvE-Default + PvP opt-in.

---

## 3. UX-Friktions-Inventar (warum es sich "nicht 100%" anfühlt)

1. **Zwei Paradigmen, keine Hierarchie.** Bewegungs-RPG und Strategie-MMO konkurrieren. Der Spieler weiß nicht, ob er Straßen-Sammler oder Feldherr ist.
2. **Tab- & Screen-Sprawl.** 6 Tabs, ~40 Screens, viele tiefe Modals (Hacking, Terminal, 2 Brettspiele, Defense-Setup). Hohe kognitive Last ab Sekunde 1.
3. **Inkonsistente Sichtbarkeit.** Commander gated+dunkel, Travel versteckt, Resources-HUD doppelt-gated. Für den Nutzer wirkt das willkürlich ("mal ist es da, mal nicht").
4. **Create-Menü überladen.** 5 Creator-Tools (Quest/Echo/Challenge/Travel/Meetup) gleichwertig , zu viel für Neulinge, die noch nichts besitzen.
5. **Kein Lehr-System.** Onboarding sind nur 3 Schritte (Welcome/Standort/Los). Danach wird der Spieler mit Wirtschaft, Truppen, Fog, Decay, Gebäuden allein gelassen. Genau hier setzt dein Wunsch nach Erklärschritten an.
6. **Tiefe ohne Führung.** Sehr reiche Systeme (Biom-Wirtschaft, Hauling, Würfel-Kampf), aber keine progressive Enthüllung -> Overwhelm statt Sog.
7. **Doppelte Karten-Welten.** MapScreen (real) vs CommanderMap (strategisch) , zwei Karten, die der Nutzer mental verbinden muss.

---

## 4. Optimierungs-Prinzipien (der Fix)

1. **Eine Fantasie zuerst.** Strategie/Eroberung als Leitbild (deckt sich mit der neuen Landingpage). Bewegung ist das Mittel, nicht das Thema.
2. **Progressive Enthüllung.** Tag 1 = nur Karte + erste Eroberung. Bauen, Wirtschaft, Aufklärung, Kampf, Social schalten sich gestaffelt frei (am bestehenden Unlock-Gating andocken). Weniger sichtbare Macht = mehr Sog.
3. **Ein klares "Was-jetzt".** Jeder Screen hat genau EINE Primäraktion + einen Ressourcen-HUD. Rest in Kontext-Sheets.
4. **Kontextuelles Lehren statt Tutorial-Wand.** Erklären, wenn die Funktion zum ersten Mal auftaucht , in 1-3 Schritten, danach nie wieder (persistente "seen"-Flags).
5. **Karten konsolidieren.** EINE Weltkarte mit umschaltbaren Layern (Territorien / Aufklärung / Kampf), statt zwei getrennter Karten-Tabs.
6. **Konsistente Sichtbarkeit.** Gestaffelt freischalten und ANKÜNDIGEN ("Neu freigeschaltet: Aufklärung"), statt still ein-/auszublenden.

---

## 5. Vorgeschlagene Informations-Architektur (Redesign)

Von 6 Tabs auf **4 klare Ziele**:

| Tab | Bündelt | Primäraktion |
|---|---|---|
| **KARTE** | Weltkarte, Territorien, Claim, NPC-Encounter, Echos/Quests-Pins, Fog-Layer | Bewegen & erobern |
| **IMPERIUM** | Basis/Gebäude, Wirtschaft/Ressourcen, Truppen, Aufklärung/Radar (ersetzt das gated "Commander") | Bauen, aufrüsten, Truppen führen |
| **ERSTELLEN (+)** | Quest/Echo/Challenge/Meetup , kontextabhängig, erst ab Claimer-Level prominent | Content droppen |
| **SOZIAL/PROFIL** | Clans, Rangliste, Freunde, Events/Bounties, Feed, Profil, Pet, Settings | Wettbewerb & Identität |

Travel/Pet bleiben als Sub-Features unter Imperium/Profil, nicht als eigene Tabs. Streifzug als eigener, klar als "bald" markierter Modus.

**Effekt:** Der Spieler hat zwei Welten (draußen = KARTE, zuhause = IMPERIUM) statt sechs , das ist das mentale Modell jedes erfolgreichen Standort-Strategiespiels.

---

## 6. Lehr-/Onboarding-System (genau dein Wunsch)

Wiederverwendbares Konzept in drei Ebenen:

**A) First-Run-Intro (1x):** 3-4 knackige Slides , "Die Karte ist dein Spielbrett", Standort-Permission (mit Mehrwert erklärt), erste Mission ("Erobere dein erstes Gebiet"). Visuell wie die neue Landingpage.

**B) Feature-Coachmarks (beim ERSTEN Öffnen):** Eine `Teach`-Komponente , abgedunkelter Hintergrund, Spotlight auf das relevante Element, 1-3 sequenzielle Schritte ("Das ist dein Radar. Tippe, um Gegner aufzudecken." -> "Verstanden"). Pro Feature ein `seen`-Flag (lokal + serverseitig), wird nie zweimal gezeigt. Trigger u. a.: erste Karte, erste Eroberung, erstes Gebäude, erstes Radar/Aufklärung, erster Kampf/Truppen, erste Wirtschaft/Ressource, erste Quest, erstes Echo, Clan, Streifzug.

**C) Lehrreiche Leerzustände + Just-in-time-Tooltips:** Kein Territorium -> "So eroberst du dein erstes Gebiet". Leeres Lager -> "Bau eine Raffinerie, um X zu fördern". HUD-Werte beim ersten Erscheinen kurz erklärt.

**Designregeln:** maximal 3 Schritte pro Coachmark, immer überspringbar, nie blockierend nach dem ersten Mal, klare Sprache (du-Form), eine Idee pro Schritt.

---

## 7. Priorisierte Umbau-Roadmap

1. **Lehr-System bauen** (wiederverwendbare Coachmark-/Intro-Komponente) , Fundament für alles.
2. **KARTE-Hub neu** , klarer HUD, eine Primäraktion, Layer-Umschalter, lehrreiche Leerzustände.
3. **IMPERIUM-Hub** , Basis/Wirtschaft/Truppen/Aufklärung konsolidiert (löst das gated Commander-Problem).
4. **ERSTELLEN** vereinfachen , kontext- und level-abhängig.
5. **SOZIAL/PROFIL** zusammenführen.
6. **Coachmarks ausrollen** über alle Features + Freischalt-Ankündigungen.
7. **Streifzug** als klar getrennter "Bald"-Modus vorbereiten.

---

## 8. Offene Entscheidungen (für den Umbau zu klären)
- **Identität:** Voll auf Strategie/Eroberung pivotieren und den Bewegungs-Klassen-Layer (Walker/Runner/...) zurückstufen? Oder beide Welten bewusst koppeln?
- **Fidelity/Scope des Prototyps:** Welche Flows zuerst hochwertig (KARTE + Onboarding + IMPERIUM), wie viele Screens?
- **Geräte-Rahmen:** Android-Frame (wie die App) für den Prototyp?
- **Klassen-Farben:** die polychrome Palette (die dir gefällt) als Spielsystem-Farbcode weiterführen?

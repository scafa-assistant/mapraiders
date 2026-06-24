# 🌍 MAP RAIDERS — ULTIMATE MASTER GAME DESIGN DOCUMENT (v1.0)

> **Status dieses Dokuments:** Design-Bibel für die Weiterentwicklung nach dem v1.0-Launch.
> **Abschnitt 1 = implementierter Ist-Stand.** Abschnitte 2–7 = **Zukunftsvision** (noch NICHT implementiert).
> Diese Trennung ist verbindlich — Ist-Architektur und Vision dürfen in Briefings nie vermischt werden.
> Delta-Mapping auf den Codebestand: siehe Anhang A. Policy-Risiken (Play Store): siehe Anhang B.

---

## 1. STATUS QUO & BEREITS IMPLEMENTIERTE BASIS

- **Territorial-System:** Reale GPS-Standorte können abgelaufen, Gebiete eingenommen und verteidigt werden.
- **Soziales & Crews:** Gilden-System zur Erstellung von "Crews". *(Im Code/UI heißt das System aktuell "Clans" — Terminologie-Mapping: Crew = Clan.)*
- **Event-System:** Spieler können physische Events (z. B. "Hausparty") erstellen, diese an einem realen GPS-Punkt platzieren, für andere auf der Karte sichtbar machen und Anmeldungen verwalten.

---

## 2. LORE & DIE FEIND-FRAKTION (PvE)

**Die Hintergrundgeschichte:** Basiert auf Mythen um Admiral Byrd (Operation Highjump, 1947) und der "Hohlen Erde" (Agartha). Die Gegner sind keine Aliens, sondern **Hyperboreer / Aghartani** — eine uralte, hochtechnologisierte Rasse aus dem Erdinneren.

**Optik & Design:** "Ancient High-Tech". Kein Plastik-Sci-Fi, sondern schwerer, dunkler Obsidian, gealtertes Messing, schwebende monolithische Blöcke. Fortbewegung über Elektromagnetismus. Energiequelle: Violett oder tiefblau leuchtendes **"Vril"**.

**Die "Erdriss-Portale":** Sie greifen nicht über die Erdoberfläche an, sondern brechen direkt an Spielerstandorten (z. B. mitten in Sundern) durch die Erdkruste.

### Gegner-Klassen

| Klasse | Rolle | Verhalten | Loot |
|---|---|---|---|
| **Vril-Augen** | Späher | Schwebende Scheiben ("Flugelrads"). Greifen nicht an, scannen die Map. | Daten (Intel) |
| **Obsidian-Wächter** | Tanks | 3 Meter hohe Steinkonstrukte, bewachen Risse, greifen im Commander-Layer an. | Bauteile (Tech) |
| **Aether-Sauger** | Saboteure | Verankern sich tief im Boden (z. B. in Wäldern oder am Wasser). Saugen passiv die Energie deines Gebiets ab. Müssen physisch vernichtet werden. | — |

---

## 3. LAYER 1: DER EXPLORER (Outdoor / Reale Welt)

- **UI/UX:** Stark stilisierte 2D/3D-Map, bewusst **kein Kamera-AR** (um Akku zu sparen und Performance zu halten).
- **Kontextbasiertes Spawning:** Die KI liest OpenStreetMap-Tags aus. Am Sorpesee spawnen Wasser-Einheiten, in Industriegebieten Tech-Drohnen, im Wald Natur-Konstrukte.
- **Kampf-Verzicht draußen (Hacking):** Draußen wird nicht gekämpft. Gegner werden **"gehackt"** (Frequenz-Matching, Ladebalken). Bei Erfolg ändert sich die Farbe des gegnerischen Vril-Kerns in die Crew-Farbe (z. B. Neon-Grün). Die Einheit wandert als Truppe ins Inventar.
- **Ranked Games (Hotspots):** An Landmarks spawnen Terminals. Hier friert die Map ein und ein asynchrones **Jump & Run-Minispiel** (WebGL/Canvas) startet. Die Layouts sind prozedural ans Terrain angepasst. Belohnung: Platz in lokalen Ranglisten, Loot, Intel.
- **Ruinen-Scavenging (Draußen):** Wenn ein Gebiet verwüstet wurde, können Spieler physisch hinlaufen, um im Schutt nach seltenen Relikten zu wühlen (z. B. kaputte Panzer oder Flugzeugträger, die sich später extrem billig restaurieren lassen). Bleiben Ruinen unangetastet, wuchern sie zu und spawnen wilde **"Nester"**.

---

## 4. LAYER 2: DER COMMANDER (Indoor / Strategie & Risiko)

- **UI/UX:** Polygonale Taktik-Karte. Dunkler "Radar-Look" mit Fraktionsfarben.

### Die Ressourcen-Trinität

1. **Energie:** Passiv durch Territorien generiert.
2. **Bauteile (Tech):** Durch das Hacken von Wächtern draußen.
3. **Daten (Intel):** Durch Jump & Runs.

### Der Tech-Tree (Gebäude)

- **Stufe 1:** Schildgeneratoren (blocken Erstschlag), Raffinerien (boosten Energie).
- **Stufe 2:** Radarstationen (lüften lokal den Fog of War), Arg-Garnisonen (gefangene Einheiten als Wachen einteilen).
- **Stufe 3:** Raketensilos (erlauben Fern-Luftschläge), Teleporter-Pads.

### Der "Iron Dome" & das Kampfdreieck

Spezialisierte Verteidigung, die auf Terrain reagiert. Schere-Stein-Papier-System:

- **Bodentruppen** zerstören Flugabwehr.
- **Panzerfahrzeuge** überrollen Bodentruppen.
- **Flugzeuge / Luftschläge** vernichten Panzer.
- **Flugabwehr** holt Luftschläge vom Himmel.
- **Wasser-Einheiten** (Torpedo-Türme, Flugzeugträger): Notwendig für Gebiete wie den Sorpesee.

### Fog of War & Spionage

- Alles abseits der eigenen Gebiete ist grau.
- Spieler schicken **Späher** aus (brauchen Proviant, müssen zurückkehren). Diese lüften das Grau in ihrem Radius temporär.
- Späher können **1× pro Reise heimlich ein Radar-Gebäude beim Feind bauen**.
- Gegner können Späher mit schnellen Einheiten ("Reiter") abfangen.
- **Intel-Drops:** Kreuzen gegnerische Truppen das Sichtfeld eines Spähers, erhält der Besitzer eine geheime Push-Nachricht (z. B. "Truppen marschieren zu Sektor 9, Ankunft 15 Min"). Ermöglicht "Backstabs" oder das **Verkaufen von Informationen**.

### Asynchrones Kämpfen & Auto-Battler

- Truppenbewegungen dauern real Zeit (z. B. 15 Minuten Marschzeit).
- Luftschläge kosten massiv Energie, schwächen aber Gebiete (zerstören Schilde) aus der Distanz, ohne Truppen bewegen zu müssen.
- **Kampfberechnung findet rein im Backend statt** (keine 3D-Hitboxen, maximale Server-Skalierbarkeit).

---

## 5. DAS WÜRFEL-KAMPFSYSTEM (Die 2+1 Mechanik)

Kämpfe im Commander-Layer werden nach einem modifizierten Risiko-Prinzip ausgewürfelt.

- **Loadout:** Jeder Spieler hat **2 Standard-Würfel (W6)** und darf **1 Bonus-Würfel** als Loot anlegen.

### Würfel als Trophäen / Loot

| Würfel | Rarität | Seiten |
|---|---|---|
| **Defekt** | Common | 1, 2, 3, Leer, Leer, Leer |
| **Gezinkt** | Uncommon | 3, 4, 4, 5, 5, 6 (sehr berechenbar) |
| **Hyperboreer-Kristall** | Epic | 8-seitig (D8), hohe Siegeschance |
| **Schild-Würfel** | — | Annulliert den höchsten gegnerischen Wurf |

- **Verlust-Mechanik:** Eingesetzte Würfel können im Kampf als Trophäen an den gegnerischen Spieler verloren gehen (**"Pink Slip"-Prinzip**).

---

## 6. LAYER 3: DAS ARCHIV (Das TCG & Sammelkarten-Endgame)

- **Integration:** Alles in EINER App. Das TCG wird erst freigeschaltet, wenn der Spieler ein Gebäude (**"Das Archiv"**) im Commander-Layer baut. Das hält das Onboarding für Anfänger extrem simpel.

### Das TCG-Gameplay (One Piece TCG Style)

- **Leader-Karten** (Menschliche Generäle oder Hyperboreer-Meister).
- **"Vril-Energie"** (ersetzt das DON!!-System), um Angriffe zu boosten.
- **Counter-Mechanik** (Karten abwerfen, um Angriffe im Gegnerzug abzuwehren).
- **Farbsystem:** Gelb (Leben/Schilde, Heilung), Schwarz (Friedhof/Ruinen, Opfer-Mechaniken), Rot (Aggro, Luftschläge), Blau (Kontrolle, Spionage).

### Das Deflationäre Meisterstück (Die Burn-Mechanik)

- Karten (z. B. ein epischer Flugzeugträger) können im TCG-Deck gespielt werden **ODER** auf der Commander-Weltkarte als echte Kampftruppe platziert werden.
- **Konsequenz:** Wird eine Karte als Truppe eingelöst, wird sie mit einer epischen Animation verbrannt/gelöscht. Sie verschwindet für immer aus dem TCG-Archiv. Das macht überlebende Karten extrem wertvoll.

### Saisons & Verknappung

- Alle 3 Monate neues Set. Alte Sets droppen nie wieder.
- Holo-Karten reagieren aufs Handy-Gyroskop.
- Secret Rares haben alternative Artworks (z. B. Manga-Style).

### Wetten & Turniere

- In **"Wager-Matches"** können Spieler Würfel oder Karten wetten. Winner takes all.
- Entwickler und Crews können eigene Turniere veranstalten.

### Marktplatz

- Gefundene **"Daten-Tresore"** (Booster) oder Einzelkarten können im In-Game-Auktionshaus gegen Ressourcen oder andere Karten gehandelt werden.

---

## 7. DIE HYBRID-KI (Backend-Architektur & Eskalations-Phasen)

Die KI ist ein autonomer Spieler, skaliert aber kostengünstig durch eine Trennung von **"Rechnen" (Server)** und **"Denken" (LLM)**.

### Der Technische Unterbau

- **Lazy Evaluation:** Aufgebaut in Hexagon-Grids (wie Uber H3). Die Welt wird **nicht 24/7 simuliert**. Truppenbewegungen der KI und Ruinen-Verfall werden erst berechnet, wenn ein Spieler in diesem Sektor die App öffnet.

### Die 3 Phasen der KI-Eskalation

1. **Phase 1 (Schlafmodus):** Wenige Spieler = gedrosselte KI. Sie besetzt 10–15 % des Gebiets, greift nicht an, wartet darauf, als Loot gefarmt zu werden.
2. **Phase 2 (Trigger):** Eine Stadt erreicht eine bestimmte Spieler-Anzahl oder Gebäude-Stufe. Das Backend meldet dies an das LLM.
3. **Phase 3 (Invasion):** Alle Spieler erhalten eine globale Warnung ("Invasionsprotokoll aktiv"). Die KI beginnt, Gebiete mit aggressiven Einheiten und Luftschlägen anzugreifen. Menschliche Crews sind gezwungen, Waffenstillstände zu schließen und sich zu verbünden.

### Ausgang der Invasion

- **Sieg der Menschen:** Stadt wird befreit. Renovierung von Gebäuden kostet nur **50 %**.
- **Sieg der KI (Ruinen):** KI saugt alle Ressourcen auf und zieht weiter. Gebiet wird zur **"Ruine"**. Neuaufbau kostet **90 %** der Ressourcen (es sei denn, man findet alte Flugzeugträger/Panzer zum Recyceln).

### Das LLM ("Der General")

- Ein lokales Modell (z. B. Qwen) oder API (Gemini) wird alle paar Stunden mit einem Text-Prompt gefüttert (Beispiel: *"Im Sektor Sauerland bauen Crews Schilde. KI hält 15 %."*).
- Das LLM antwortet im **JSON-Format** mit globalen Makro-Befehlen (`INVASION_TRIGGER`, `HARVEST_AND_MOVE`).
- Das LLM generiert autonom In-Game-Storytexte (z. B. *"Abgefangener Funk: Menschen des Sauerlands, wir werden eure Schilde brechen…"*), die als Push-Notifications in der App auftauchen.

---
---

# ANHANG A — DELTA-MAPPING: GDD-Vision vs. Codebestand (Stand 2026-06-12)

| GDD-Feature | Status im Code | Anmerkung |
|---|---|---|
| Territorial-System (GPS-Loops, Decay, Verteidigung) | ✅ Implementiert | `decayEngine.ts`, PostGIS-Polygone, Fallen/Challenges |
| Crews/Gilden | ✅ Implementiert (als "Clans") | Clan-Chat, Auto-Formation, Clan-Ranglisten. **Terminologie-Entscheidung nötig: Crew vs. Clan** |
| Event-System (physische Events, Anmeldungen) | ✅ Implementiert | Meetups/Events auf der Karte |
| Quests, Echos, Artefakte, Duelle, Pet, Titel | ✅ Implementiert | Nicht im GDD §1 erwähnt, aber vorhanden — gehört zum Ist-Stand |
| Lore (Hyperboreer/Agartha/Vril) | ❌ Vision | Kein Lore-Layer im Code |
| PvE-Gegner (Vril-Augen, Wächter, Sauger) | ❌ Vision | Keine NPC-/Einheiten-Tabellen im Schema |
| Kontextbasiertes Spawning via OSM-Tags | ❌ Vision | OSM-Tag-Auswertung existiert nicht; PostGIS-Basis dafür ist aber da |
| Hacking-Minigame (Frequenz-Matching) | ❌ Vision | — |
| Jump&Run-Terminals (WebGL/Canvas, prozedural) | ❌ Vision | Mini-Games existieren rudimentär (Duell-Challenges), kein Jump&Run |
| Commander-Layer (Basis, Tech-Tree, Truppen) | ❌ Vision | Größtes Einzelpaket; braucht ~10–15 neue Tabellen |
| Ressourcen-Trinität (Energie/Tech/Intel) | ❌ Vision | Aktuell nur XP/Level |
| Fog of War + Späher + Intel-Drops | ❌ Vision | — |
| Würfel-Kampfsystem (2+1, Loot-Würfel, Pink Slip) | ❌ Vision | — |
| TCG ("Das Archiv", Burn-Mechanik, Saisons) | ❌ Vision | Größtes Risiko-Paket (siehe Anhang B) |
| Marktplatz / Auktionshaus | ❌ Vision | — |
| Hybrid-KI (H3 Lazy Eval + LLM-General) | ❌ Vision | H3-Hexgrid passt gut auf bestehende PostGIS-Architektur |
| Wager-Matches (Wetten) | ❌ Vision | **Policy-kritisch, siehe Anhang B** |

**Architektur-Anschlussfähigkeit:** Die bestehende Basis (PostGIS-Polygone, Redis-Locking, Cron-Jobs mit Lazy-Berechnung beim Decay, WebSocket-Layer, Backend-only-Game-Logic) ist konzeptionell kompatibel mit Layer 2 und der Hybrid-KI. "Kampfberechnung rein im Backend" entspricht bereits dem heutigen Muster (Decay/Duelle serverseitig).

# ANHANG B — POLICY- & LAUNCH-RISIKEN (vor Implementierung klären)

1. **Wager-Matches / "Winner takes all" (§6):** Sobald Spieler Items mit Tauschwert (Karten, Würfel, handelbar im Auktionshaus) **setzen und verlieren** können, wertet IARC/Google das als simuliertes Glücksspiel-Element. Unser aktueller IARC-Fragebogen sagt "Glücksspiel: Nein" — die v1.0-Einreichung bleibt davon unberührt (Feature existiert nicht), aber **vor** Implementierung muss das Rating neu beantragt und die Mechanik ggf. entschärft werden (z. B. Wetten nur mit nicht-handelbaren Ressourcen).
   → **ENTSCHIEDEN (Gigi, 2026-06-12):** Item-Wetten und Pink-Slip-Verlust (§5) sind gestrichen. Stattdessen system-belohnte Ranked-Matches (Sieger bekommt System-Drop, Verlierer behält alles) + Ressourcen-Pots. Ebenfalls entschieden: "Clan" bleibt als Begriff (ASO-Suchvolumen), Brand wechselt auf Vril-Violett. Details: `MapRaiders_GDD_Implementation_Plan.md` → "Entscheidungen".
2. **TCG + Booster ("Daten-Tresore"):** Solange Booster nur erspielt (nicht gekauft) werden, keine Loot-Box-Problematik. Sobald IAP dazukommt: Loot-Box-Offenlegungspflichten (Drop-Raten) in mehreren Märkten (u. a. Play-Policy, Japan, Belgien/Niederlande beachten).
3. **Data Safety / Listing:** Aktuelles Listing sagt "keine Werbung, keine IAP, kein Teilen von Daten". Jede Monetarisierung des TCG erfordert Listing-, Data-Safety- und AGB-Updates.
4. **LLM-Push-Notifications (§7):** Autonom generierte Storytexte als Push — brauchen einen Profanity-/Safety-Filter vor Versand (Google-Policy: keine irreführenden/erschreckenden Notifications; "Invasionswarnung" muss klar als In-Game erkennbar sein).
5. **Scope-Schutz:** v1.0-Launch (Play Store) läuft gerade. Dieses GDD ist die Post-Launch-Roadmap — kein Feature daraus blockiert oder verzögert die laufende Submission.

# ANHANG C — EMPFOHLENE BAUREIHENFOLGE (CEO-Sicht)

1. **Phase A (post-launch, klein):** Lore-Reskin + PvE-Spawns (Vril-Augen als hackbare Map-Objekte) — nutzt bestehende Map/GPS-Infrastruktur, sofort sichtbarer Content, hält Retention.
2. **Phase B:** Ressourcen-Trinität + erste Gebäude (Schild, Raffinerie) auf bestehenden Territorien — macht Territorien wertvoller, verstärkt den Kern-Loop.
3. **Phase C:** Commander-Layer (Fog of War, Späher, Truppen, Würfel-Kampf) — das strategische Indoor-Spiel.
4. **Phase D:** Hybrid-KI (H3-Grid, Phasen-Eskalation, LLM-General) — braucht B+C als Substrat.
5. **Phase E:** TCG/Archiv + Marktplatz — erst wenn Ökonomie und Policy-Fragen (Anhang B) geklärt sind.

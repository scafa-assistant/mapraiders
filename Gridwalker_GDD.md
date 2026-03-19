# GAME DESIGN DOCUMENT

## CODENAME: GRIDWALKER

*Die Stadt als lebendiges MMO*

---

**Version:** 1.0
**Datum:** März 2026
**Autor:** Gigi / René Scafarti
**Status:** Konzeptphase

---

## Inhaltsverzeichnis

1. [Vision & Core Concept](#1-vision--core-concept)
2. [Spieler-Klassen (Movement Types)](#2-spieler-klassen-movement-types)
3. [Core Game Loop](#3-core-game-loop)
4. [Territory System](#4-territory-system)
5. [Content Layers](#5-content-layers)
6. [Pet System (Dog Walker Layer)](#6-pet-system-dog-walker-layer)
7. [Travel Route System (Langstrecke)](#7-travel-route-system-langstrecke)
8. [Schnitzeljagd-System (Quest Chains)](#8-schnitzeljagd-system-quest-chains)
9. [Progression & Economy](#9-progression--economy)
10. [Social Systems](#10-social-systems)
11. [Moderation & Safety](#11-moderation--safety)
12. [Monetarisierung](#12-monetarisierung)
13. [Release Roadmap](#13-release-roadmap)
14. [Technical Overview](#14-technical-overview)

---

## 1. Vision & Core Concept

### 1.1 Elevator Pitch

Gridwalker verwandelt jede Stadt in ein spielbares MMO. Spieler erobern Straßen durch echte Bewegung, hinterlassen Quests, Sounds und Challenges an realen Orten, und kämpfen um Territorium und Status. Jede menschliche Routine wird zum Gameplay: Pendeln, Joggen, Gassi gehen, Radfahren, Skaten. Die Stadt wird nicht mehr nur gesehen – sie wird gespielt.

### 1.2 Design-Philosophie

**Kernprinzip:** *Jede menschliche Routine ist ein ungespieltes Spiel.*

Drei Design-Säulen tragen das gesamte System:

- **UNSICHTBAR → SICHTBAR:** Alltagshandlungen die niemand sieht (Pendeln, Laufen, Warten) werden messbar und sichtbar gemacht
- **LEADERBOARD + TERRITORIUM:** Punkte und Besitz erzeugen Wettbewerb aus dem Nichts
- **FRUST → GAMEPLAY:** Negative Alltagssituationen (schlechtes Wetter, Wartezeiten, Pendelstress) werden durch Scoring in positive Erlebnisse umgewandelt

### 1.3 Was Gridwalker NICHT ist

- Kein Fitness-Tracker mit Gamification-Skin
- Kein Pokémon GO Klon (kein Catching, kein AR-Monster-Layer)
- Kein Social Media mit Karten-Feature
- Kein reines Territorial-Spiel wie Risk

**Gridwalker ist eine unsichtbare Parallelwelt über der echten Stadt.** Straßen haben Besitzer. Orte haben Erinnerungen. Wege haben Bedeutung.

### 1.4 Zielgruppe

| Segment | Beschreibung | Motivation |
|---------|-------------|------------|
| Urban Movers | Pendler, Jogger, Radfahrer (18–35) | Status + tägliche Routine aufwerten |
| Creative Explorers | Fotografen, Sound-Künstler, Storyteller | Kreatives Hinterlassen von Spuren |
| Dog Owners | Hundebesitzer mit täglicher Gassi-Routine | Spielerische Aufwertung des Spaziergangs |
| Competitive Casuals | Gamer die draußen spielen wollen | Territory Wars + Leaderboards |

---

## 2. Spieler-Klassen (Movement Types)

Jeder Spieler bewegt sich anders durch die Stadt. Die Fortbewegungsart bestimmt die Klasse, den Claim-Wert, die verfügbaren Challenges und den Status-Titel. Ein Spieler kann mehrere Klassen nutzen – die Klasse wird automatisch per Sensor erkannt.

### 2.1 Klassen-Übersicht

| Klasse | Icon | Claim-Wert | Schwierigkeit | Titel |
|--------|------|-----------|---------------|-------|
| Walker | 🚶 | ★☆☆☆☆ | Sehr leicht | Explorer |
| Dog Walker | 🐕 | ★★☆☆☆ | Leicht + Bonus | Pack Leader |
| Runner | 🏃 | ★★★★☆ | Schwer | Endurance King |
| Cyclist | 🚴 | ★★☆☆☆ | Leicht | Speed King |
| Skater | 🛹 | ★★★☆☆ | Mittel + Skill | Style Lord |
| Driver | 🚗 | ★☆☆☆☆ | Passiv | Pathfinder |

### 2.2 Klassen-Design-Prinzip

**Kernregel:** Je schwieriger die Fortbewegung, desto höher der Claim-Wert. Ein Runner der 5 km läuft, erobert wertvolleres Territorium als ein Cyclist der 20 km fährt. Ein Skater der eine technische Line mit Tricks abschließt, bekommt mehr als beide.

Jede Klasse erlebt dieselben Straßen anders:

- Der Skater sieht Rails und Ledges
- Der Runner sieht Hindernisse und Parcours-Möglichkeiten
- Der Walker sieht Details, Muster und versteckte Dinge
- Der Hund „riecht" Geheimnisse (Bonus-Layer nur für Dog Walker)

### 2.3 Klassen-spezifische Challenges

| Klasse | Challenge-Typen | Fokus |
|--------|----------------|-------|
| Walker | Finden, Beobachten, Dokumentieren, Rätsel | Wahrnehmung + Geduld |
| Dog Walker | Exploration, versteckte Spots, Hunde-Tricks | Entdeckung + Charme |
| Runner | Hindernisse, Parcours, Ausdauer-Challenges | Körper + Durchhaltevermögen |
| Cyclist | Distanz, Technik-Passagen, Speed-Segmente | Flow + Mut |
| Skater | Rail Slides, Trick-Lines, kreative Runs | Style + Skill |
| Driver | Langstrecken-Routen, Raststätten-Quests | Exploration + Verbindung |

**Class-Locked Creation:** Spieler dürfen nur Challenges erstellen, die zu ihrer aktiven Klasse passen. Ein Walker kann keine 50-Klimmzüge-Challenge droppen. Ein Cyclist kann keine Skate-Tricks verlangen. Das sichert Authentizität und Qualität.

### 2.4 Multi-Herrschaft pro Straße

Eine einzelne Straße kann mehrere Herrscher gleichzeitig haben – in verschiedenen Kategorien. Die Sonnenallee kann gleichzeitig einen Speed King (Cyclist), einen Endurance King (Runner) und einen Style Lord (Skater) haben. Jede Klasse kämpft nur gegen ihresgleichen.

---

## 3. Core Game Loop

### 3.1 Primärer Loop (täglich)

Der Core Loop besteht aus vier Phasen die sich täglich wiederholen:

| Phase | Aktion | Ergebnis |
|-------|--------|----------|
| 1. BEWEGEN | Spieler bewegt sich durch die Stadt (laufen, radfahren, pendeln, etc.) | GPS trackt Route + Klasse wird erkannt |
| 2. CLAIMEN | Abgeschlossene Routen werden zu Territorium | Straße/Gebiet gehört dem Spieler |
| 3. GESTALTEN | Besitzer hinterlässt Content an seinen Spots | Quests, Echos, Challenges, Rätsel, Artefakte |
| 4. ERLEBEN | Andere Spieler entdecken den Content | Bewertungen, Likes, XP, Statusänderungen |

### 3.2 Master-Prinzip: Zugriff durch Engagement

**Nicht jeder darf alles. Nur wer sich bewegt, darf gestalten.** Dies ist der zentrale Designhebel. Rechte werden durch echte Bewegung verdient, nicht durch Bezahlung. Das System belohnt Präsenz und Konsistenz.

| Unlock-Stufe | Voraussetzung | Neue Rechte |
|-------------|--------------|-------------|
| Newcomer | App installiert | Karte sehen, fremde Quests spielen |
| Claimer | Erste 3 Straßen geclaimed | Einfache Quests erstellen (1–2 Steps) |
| Creator | 10 Claims + 5 positive Bewertungen | Audio Echos droppen, mehrstufige Quests |
| Architect | 50 Claims + 20 Bewertungen + 1 Legendary Quest | Cross-Territory Schnitzeljagden, Challenge-Templates |
| Legend | Community-Vote + 100+ Claims | Stadt-Events erstellen, Mentor-Status |

### 3.3 Sekundärer Loop (wöchentlich)

- Territorium verteidigen: Andere Spieler können Claims übernehmen, Besitzer wird benachrichtigt
- Quest-Bewertungen prüfen: Feedback auf eigene Quests optimiert Creator-Score
- Clan-Aktivität: Team-Challenges und Bezirks-Wettbewerbe
- Progression: Level-Ups, neue Titel, freigeschaltete Fähigkeiten

### 3.4 Tertiärer Loop (saisonal)

- Saisonale Events: Winter-Challenges, Sommer-Territorium-Kriege
- Stadtweite Wettbewerbe: Bezirk vs. Bezirk
- Legendary Route Awards: Beste Schnitzeljagden der Saison
- Meta-Progression: Jahresrang, permanente Titel

---

## 4. Territory System

### 4.1 Claim-Mechanik

Territorium wird durch Bewegung erobert. Jede GPS-getrackte Route wird als Polygon auf die Stadtkarte gelegt. Die umschlossene Fläche wird in Quadratmetern berechnet und dem Spieler zugewiesen.

| Regel | Beschreibung |
|-------|-------------|
| Geschlossene Route | Route muss ein geschlossenes Polygon bilden (Start ≈ Ende) |
| Mindest-Fläche | Minimum 500m² damit ein Claim zählt |
| Mindest-Tempo | Tempo muss zur Klasse passen (kein Spazier-Cheat für Runner) |
| Überlappung | Neue Claims können bestehende teilweise oder ganz übernehmen |
| Verfall | Unverteidigte Gebiete verlieren nach 7 Tagen ohne Aktivität an Wert |
| Anti-Cheat | GPS-Sprünge, unrealistische Geschwindigkeit und Autofahrt-Muster werden erkannt |

### 4.2 Claim-Wert-Berechnung

Der Wert eines Claims ergibt sich aus mehreren Faktoren:

**`Claim-Wert = Fläche (m²) × Klassen-Multiplikator × Wetter-Bonus × Streak-Bonus`**

| Faktor | Multiplikator |
|--------|--------------|
| Walker | ×1.0 |
| Dog Walker | ×1.2 (Hunde-Bonus) |
| Runner | ×2.5 |
| Cyclist | ×1.3 |
| Skater | ×2.0 |
| Driver | ×0.3 (stark reduziert) |
| Regen/Schnee | ×1.5 |
| Sturm (>50 km/h Wind) | ×2.0 |
| Extreme Kälte (<−5°C) | ×1.8 |
| 7-Tage-Streak | ×1.3 |
| 30-Tage-Streak | ×2.0 |

### 4.3 Territory Display

Die Stadtkarte zeigt Territorien als farbige Overlays. Jeder Spieler hat eine Signaturfarbe. Umkämpfte Gebiete pulsieren. Ungeclaimte Straßen sind grau. Die Dichte der Aktivität bestimmt die Intensität der Farbe.

---

## 5. Content Layers

Gridwalker hat fünf verschiedene Content-Typen, die Spieler an ihren Spots hinterlassen können. Jeder Content-Typ erfüllt eine andere Funktion im Ökosystem.

### 5.1 Quests (Witness-Layer)

**Kern:** Finde-Aufgaben mit Foto-Beweis und AI-Verifikation.

- Tägliche Missions: Finde einen roten Briefkasten, eine Katze im Fenster, eine Tür ohne Klinke
- Community Cases: Spieler erstellen eigene Suchaufgaben für andere
- Multi-Step Schnitzeljagden: 3–5 verbundene Spots, Cross-Territory möglich
- Bewertung nach Kreativität, Schwierigkeit und Originalität
- GPS + Foto + AI-Check als Verifikation

### 5.2 Echos (Audio-Layer)

**Kern:** Audio-Graffiti an GPS-Koordinaten. Hörbar nur vor Ort.

- Max. 30 Sekunden pro Echo
- Zerfallen nach 48 Stunden, außer die Community liked sie
- Top-Echo pro Spot wird permanent (Community-Vote)
- Fokus auf Musik, Beats, Soundscapes – keine reinen Sprachnachrichten am Anfang
- Künstler kämpfen darum, wessen Echo an den besten Spots überlebt

### 5.3 Challenges (Fitness-Layer)

**Kern:** Physische Aufgaben an realen Spots mit Video-Beweis.

- Nur an passenden Orten: Fitnesspark, Spielplatz, Trimm-Dich-Pfad etc.
- Template-basiert: Push-ups, Klimmzüge, Plank, Balance, Skate-Tricks
- 3-Level-Verifikation: Foto (Standard), Sensor+Timer (Ausdauer), Video (Special)
- Safety Limits: Keine extremen Wiederholungen, keine gefährlichen Orte
- Klassen-spezifisch: Skater-Challenges an Rails, Runner-Parcours an Hindernissen

### 5.4 Rätsel (Brain-Layer)

**Kern:** Quiz-Fragen, Logikrätsel, Wissens-Challenges an Orten.

- Ortsgebundene Fragen: Wie viele Fenster hat dieses Gebäude? Welche Farbe hat die Tür?
- Hinweisketten: Ein Rätsel führt zum nächsten Spot
- Eingebettet in Schnitzeljagden als Zwischenschritt

### 5.5 Artefakte (Creative-Layer)

**Kern:** Kreative Hinterlassenschaften: Gedichte, Nachrichten, Zeichnungen, Fotografie.

- Trophäen für Finder: Wer ein Artefakt entdeckt, kann es seiner Sammlung hinzufügen
- Seltenheitsgrade basierend auf Ort und Creator-Status
- Permanente Artefakte nur durch Community-Vote

---

## 6. Pet System (Dog Walker Layer)

Das Pet System ist kein Gimmick – es ist ein eigenständiger Meta-Layer der die Exploration-Mechanik verstärkt. Hundebesitzer gehen ohnehin täglich raus. Das System macht diesen Alltag spielbar.

### 6.1 Hunde-Profil

- Digitales Pet-Profil mit Level, XP, Spezialisierungen
- Jeder Spaziergang gibt XP proportional zu Distanz und Neuheit der Route
- Hunde entwickeln Spezialisierungen: Spürhund, Explorer, Wachposten

### 6.2 Exklusive Dog Walker Mechaniken

| Feature | Beschreibung |
|---------|-------------|
| Schnüffel-Spots | Nur mit Hund sichtbare versteckte Locations auf der Karte |
| Rare Finds | Hund kann seltene Items entdecken die andere Spieler nicht sehen |
| Dog Challenges | Hund macht Trick an Spot (Sitz, Platz, Pfote) als Beweis |
| Park-Encounters | Begegnung mit anderen Dog Walkern triggert kooperative Mini-Quests |
| Exploration Boost | Neue/seltene Wege geben 2× XP für den Hund |

### 6.3 Hund als Schnitzeljagd-Element

In Schnitzeljagden können einzelne Steps als Dog-Only markiert sein. Der Hund findet den nächsten Hinweis. Dies fördert die Zusammenarbeit zwischen verschiedenen Spielertypen: Ein Walker erstellt eine Schnitzeljagd, ein Dog Walker löst den Hunde-Step, ein Runner sprint zum Finale.

---

## 7. Travel Route System (Langstrecke)

Das Travel Route System erweitert das Stadtspiel auf Langstrecken. Autofahrten, Zugreisen und Roadtrips werden zu verifizierten Erlebnis-Korridoren.

### 7.1 Route Ghost Mode

Während einer Langstreckenfahrt (z.B. Deutschland → Italien):

- App läuft im Hintergrund, trackt die Route passiv
- Fahrer kann Spots markieren (nur bei Stopps – keine Interaktion über 30 km/h)
- Quests, Echos und Notizen werden vorbereitet aber bleiben unsichtbar
- Erst nach Abschluss der gesamten Route werden alle Spots freigeschaltet

### 7.2 Verifikationsprinzip

***Nur wer den Weg wirklich gegangen ist, darf ihn für andere gestalten.*** Die Route muss vollständig abgeschlossen sein bevor Content aktiv wird. GPS-Daten werden auf Plausibilität geprüft. Kein Cheating möglich.

### 7.3 Route Evolution

- Mehrere Spieler können dieselbe Route fahren und bewerten
- Neue Stops können hinzugefügt werden (nach eigener Verifikation)
- Routen wachsen organisch über Zeit
- Legendary Routes: Nach vielen guten Bewertungen wird eine Route hervorgehoben und empfohlen

### 7.4 Erlebnis-Design (Langstrecke)

Für nachfolgende Spieler auf derselben Route:

- Audio-Hinweise bei Annäherung an Spots (nur im Stand abspielbar)
- Cliffhanger: „Nächster Spot in 12 km... etwas wartet an der Raststätte"
- Raststätten werden zu aktiven Spielzonen mit Quests, Echos, Fotos
- Die Fahrt selbst wird zur Story – nicht nur das Ziel

### 7.5 Safety Rules (Fahrzeug)

| Regel | Umsetzung |
|-------|-----------|
| Keine Interaktion bei Bewegung | UI sperrt sich komplett über 30 km/h |
| Nur Stopps sind aktiv | GPS muss Stillstand bestätigen bevor Interaktion möglich |
| Claim-Wert stark reduziert | Multiplikator ×0.3 für Auto-Claims |
| Keine Challenges auf Straßen | Nur sichere Zonen (Parkplätze, Raststätten, Städte) |

---

## 8. Schnitzeljagd-System (Quest Chains)

Schnitzeljagden sind das kreative Herzstück von Gridwalker. Spieler werden zu Level-Designern ihrer eigenen Stadt.

### 8.1 Grundregeln

- Quests können nur in eigenem Territorium erstellt werden
- Cross-Territory Quests erfordern Besitz mehrerer zusammenhängender Gebiete
- 3–5 Steps sind ideal für den Start, Maximum 10 Steps
- Jeder Step muss klar, konkret und ortsgebunden sein
- Unlock-Logik: Erst ab Claimer-Level (3+ Claims) darf man Quests erstellen

### 8.2 Quest-Step-Typen

| Step-Typ | Aktion | Beweis |
|----------|--------|--------|
| FIND | Finde ein bestimmtes Objekt/Ort | Foto + GPS |
| LISTEN | Höre ein Echo an diesem Spot | Proximity-Check |
| CHALLENGE | Führe eine physische Aufgabe aus | Video/Sensor |
| SOLVE | Beantworte eine Frage / löse ein Rätsel | Texteingabe |
| COLLECT | Finde ein verstecktes Artefakt | GPS + Bestätigung |
| DOG | Hund findet den nächsten Hinweis | Dog Walker Only |

### 8.3 Quest-Qualitätssicherung

Ohne Kontrolle entsteht Spam. Das Qualitätssystem arbeitet in drei Stufen:

**1. Unlock-Gating:** Neue Spieler dürfen noch keine Quests erstellen. Erst nach X Claims und positiven Bewertungen.

**2. Community-Rating:** Spieler bewerten Kreativität, Schwierigkeit und „Lohnt es sich?" Gute Creator steigen auf, schlechte verschwinden.

**3. Zerfall:** Quests die niemand spielt oder schlecht bewertet werden, verschwinden automatisch. Die Stadt bleibt frisch.

### 8.4 Beispiel: Perfekte Schnitzeljagd

*Neukölln Mystery Route – 4.8★ – 2.3 km – 5 Steps*

| Step | Typ | Aufgabe |
|------|-----|---------|
| 1 | FIND | Finde die blaue Tür ohne Griff in der Weserstraße (Foto-Beweis) |
| 2 | LISTEN | Höre den Beat unter der Brücke am Landwehrkanal |
| 3 | SOLVE | Zähle die roten Fenster an diesem Gebäude und gib die Zahl ein |
| 4 | CHALLENGE | 15 Push-ups am Trainingsplatz im Volkspark (Video-Beweis) |
| 5 | COLLECT | Finde das versteckte Gedicht am letzten Spot (Artefakt-Trophäe) |

---

## 9. Progression & Economy

### 9.1 XP-System

| Aktion | XP |
|--------|-----|
| Straße claimen | 50–500 (abhängig von Fläche + Klasse) |
| Quest erstellen (gut bewertet) | 200 |
| Quest lösen | 100–300 (je nach Schwierigkeit) |
| Echo droppen (geliked) | 150 |
| Challenge abschließen | 100–500 |
| Artefakt finden | 50–200 (je nach Seltenheit) |
| 7-Tage-Streak | 500 Bonus |
| Neues Gebiet betreten (Erstbegehung) | 100 |

### 9.2 Level-System

| Level | XP Required | Titel | Unlock |
|-------|------------|-------|--------|
| 1–5 | 0–2.000 | Newcomer | Karte, fremde Quests spielen |
| 6–15 | 2.000–10.000 | Claimer | Eigene Quests (1–2 Steps) |
| 16–30 | 10.000–50.000 | Creator | Echos, mehrstufige Quests, Challenges |
| 31–50 | 50.000–150.000 | Architect | Cross-Territory Quests, Templates |
| 51+ | 150.000+ | Legend | Stadt-Events, Mentor-Status, Legendary Quests |

### 9.3 Prestige-System (Titel)

Neben dem Level-System gibt es Prestige-Titel die spezifische Leistungen anerkennen:

| Titel | Bedingung |
|-------|-----------|
| Street Beast | 100 Fitness-Challenges abgeschlossen |
| Iron Grip | 50 Klimmzug-Challenges bestanden |
| Trail Dog | 500 km mit Hund gelaufen |
| Urban Explorer | 100 verschiedene Straßen geclaimed |
| Echo Master | 10 permanente Echos (Community-Vote) |
| Questmaker | 20 Quests mit ≥4.5★ Rating |
| Alpenüberquerer | Route über 500 km abgeschlossen |
| Grenzgänger | Claims in 3+ Ländern |
| Nachtläufer | 50 Claims zwischen 22:00–05:00 |
| Sturmreiter | 20 Claims bei Unwetter-Bedingungen |

### 9.4 Zerfall & Dynamik

Nichts bleibt automatisch bestehen. Das hält die Welt lebendig:

- Territorien verlieren Wert nach 7 Tagen ohne Aktivität des Besitzers
- Echos zerfallen nach 48h ohne Likes
- Quests verschwinden wenn sie schlecht bewertet oder nicht gespielt werden
- Claims können jederzeit von anderen übernommen werden
- Einzige Ausnahme: Legendary-Status Content (Community-gesichert)

---

## 10. Social Systems

### 10.1 Clans (organisch)

Clans entstehen nicht durch manuelle Erstellung, sondern organisch durch gemeinsame Aktivität:

- Pendler-Clans: Alle auf der S7 morgens um 7:43 werden automatisch gruppiert
- Bezirks-Clans: Spieler die dasselbe Viertel dominieren, bilden Teams
- Routen-Clans: Spieler die regelmäßig dieselbe Langstrecke fahren
- Hunde-Clans: Dog Walker die sich regelmäßig in denselben Parks treffen

### 10.2 Bezirk vs. Bezirk

Stadtteile treten gegeneinander an. Der Bezirk mit der meisten Aktivität, den besten Quests und den meisten Claims gewinnt saisonale Wettbewerbe. Erzeugt hyper-lokale Identität und Stolz.

### 10.3 Social Content

- Jede Challenge, jeder Quest-Abschluss ist teilbar (Screenshot/Video)
- In-App Feed: Beste Echos in deiner Nähe, neue Quests, Territory-Änderungen
- Profil-Seite: Komplette Claim-History, Titel, Abzeichen, Pet-Stats

---

## 11. Moderation & Safety

### 11.1 Content-Moderation

| Bereich | Lösung |
|---------|--------|
| Audio Echos | AI-Scan auf unangemessene Inhalte + Community-Flagging |
| Fotos | AI-Content-Filter + EXIF/GPS-Verifikation + Manuelles Review |
| Videos | Nur für Challenges, AI-Check + Community-Review |
| Quests | Template-basiert, Review-Queue für neue Creator |
| Text/Artefakte | Standard Content-Filter + Community-Report |

### 11.2 Anti-Cheat

- GPS-Spoofing Detection: Unrealistische Bewegungsmuster, fehlende Accelerometer-Daten
- Speed-Plausibilität: Klassen-spezifische Tempolimits (Runner ≤30 km/h, Walker ≤8 km/h)
- Fahrzeug-Detection: Barometer + Accelerometer-Muster unterscheiden Auto von Laufen
- Community-Reporting: Verdächtige Claims können gemeldet werden

### 11.3 Physische Safety

- Challenge-Templates mit Safety-Limits (keine extremen Wiederholungen)
- Gefährliche Orte gesperrt: Gleise, Autobahnen, Baugebiete
- Auto-UI sperrt sich komplett über 30 km/h
- Riskante Challenges werden automatisch gefiltert
- Haftungsausschluss + Altersbeschränkung bei Fitness-Challenges

---

## 12. Monetarisierung

### 12.1 Philosophie

**Gridwalker kostet einmalig ~1 € im App Store. Danach: keine Abos, keine Mikrotransaktionen, keine bezahlten Cosmetics.** Das Spiel gehört den Spielern, nicht einem Monetarisierungs-Engine.

Warum dieser Ansatz:

- Einmalig 1 € filtert Bots und Fake-Accounts – jeder Account hat einen realen Wert
- Kein Pay-to-Win, kein Pay-to-Progress, kein Pay-to-Customize – alles wird erspielt
- Massenfähig: 1 € ist keine Hürde, aber ein Commitment
- Vertrauen: Spieler wissen, dass sie nicht gemolken werden – das erzeugt Loyalität und Mundpropaganda

### 12.2 Einnahmequellen

| Stream | Beschreibung |
|--------|-------------|
| App-Kauf (einmalig) | ~1 € pro Download – die einzige direkte Einnahme von Spielern |
| Brand Partnerships | Sponsored Quests von Marken, Branded Challenges an realen Locations |
| City Partnerships | Stadtführungen als Quests, Tourismus-Integration, ÖPNV-Kooperationen |
| Corporate Wellness | Team-Challenges für Unternehmen, Pendler-Wettbewerbe als Firmen-Events |
| Data Insights | Anonymisierte Bewegungsdaten für Stadtplanung (strikt opt-in, DSGVO-konform) |
| Event-Sponsoring | Saisonale Wettbewerbe gesponsert von lokalen Businesses |

### 12.3 Was NIEMALS bezahlt werden kann

- Territorium kaufen (nur durch Bewegung)
- Claim-Wert künstlich erhöhen
- Quest-Bewertungen manipulieren
- Titel, Level oder Abzeichen kaufen
- Cosmetics, Farben oder Skins kaufen
- Anderen Spieler verdrängen durch Zahlung
- Irgendein Gameplay-Vorteil

**Alles im Spiel wird erspielt. Punkt.**

---

## 13. Release Roadmap

| Phase | Zeitraum | Features | Ziel |
|-------|----------|----------|------|
| Phase 1: Foundation | Monat 1–4 | Bewegung tracken, Straßen claimen, Leaderboards, Basis-Karte | Ownership muss sich real anfühlen |
| Phase 2: Content | Monat 5–8 | Einfache Quests (Witness Light), Foto-Beweis, Community-Rating | Spieler fangen an Content zu erstellen |
| Phase 3: Audio | Monat 9–12 | Echo Drops, Audio an Spots, Zerfall-System, Likes | Emotionaler + kultureller Layer |
| Phase 4: Depth | Monat 13–18 | Pet System, Challenges, Schnitzeljagden, Klassen-System | Volles Ökosystem, tiefe Progression |
| Phase 5: Travel | Monat 19–24 | Langstrecken-Routen, Ghost Mode, Cross-Country | Expansion über Stadtgrenzen hinaus |

**MVP-Fokus (Phase 1):** Nur Bewegung + Claiming + Leaderboard. Ein einziger klarer Satz: *Lauf durch deine Stadt, erobere Straßen und dokumentiere sie.* Alles andere kommt später.

---

## 14. Technical Overview

### 14.1 Core Stack

| Komponente | Technologie |
|-----------|-------------|
| Mobile App | React Native / Flutter (Cross-Platform) |
| GPS/Sensor | Native APIs (Accelerometer, Barometer, GPS) |
| Backend | Node.js / Go Microservices |
| Datenbank | PostgreSQL + PostGIS (Geospatial Queries) |
| Audio | CDN + Spatial Audio Engine |
| AI (Foto-Verifikation) | Vision API (Custom Model + GPT-4V Fallback) |
| Karten | Mapbox GL (Custom Styling) |
| Polygon-Berechnung | Turf.js / PostGIS Geometry Operations |
| Anti-Cheat | Server-side GPS Validation + Sensor Fusion |
| Push Notifications | Firebase Cloud Messaging |

### 14.2 Polygon-Engine

Das technische Herz der App ist die Flächenberechnung und Überlappungserkennung von GPS-Polygonen. Jede Route wird als Polygon gespeichert. Bei neuen Claims wird geprüft: Was ist neues Land? Was überschneidet sich mit bestehendem Land? Welcher Teil muss dem alten Besitzer abgezogen und dem neuen zugeordnet werden?

### 14.3 Sensorfusion für Klassen-Erkennung

Die automatische Klassen-Erkennung nutzt eine Kombination aus GPS-Speed, Accelerometer-Muster, Barometer-Daten und Bewegungsprofil. Walker haben eine gleichmäßige, langsame Bewegung. Runner zeigen rhythmische Beschleunigungsmuster. Cyclist haben höhere Geschwindigkeit mit weniger vertikaler Beschleunigung. Autofahrer zeigen charakteristische Beschleunigungs-/Bremsprofile und Barometer-Muster.

---

**GRIDWALKER**
*Die Stadt wird nicht mehr nur gesehen – sie wird gespielt.*

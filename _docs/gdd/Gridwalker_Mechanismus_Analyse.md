# GRIDWALKER — Mechanismus-Analyse & Entwicklungsleitfaden

## Vollständige technische Zerlegung aller Systeme

**Version:** 1.0
**Datum:** März 2026
**Zweck:** Entwicklungsleitfaden mit Spielraum — kein starres Pflichtenheft, sondern eine Landkarte die zeigt wo Entscheidungen nötig sind

---

## Inhaltsverzeichnis

1. [Systemarchitektur (Gesamtbild)](#1-systemarchitektur-gesamtbild)
2. [GPS & Bewegungserkennung](#2-gps--bewegungserkennung)
3. [Polygon-Engine (Territorium)](#3-polygon-engine-territorium)
4. [Klassen-Erkennung (Sensor Fusion)](#4-klassen-erkennung-sensor-fusion)
5. [Claim-Wert-Engine](#5-claim-wert-engine)
6. [Territory Ownership & Konflikte](#6-territory-ownership--konflikte)
7. [Verfall-System (Decay)](#7-verfall-system-decay)
8. [Quest-Engine](#8-quest-engine)
9. [Echo-System (Spatial Audio)](#9-echo-system-spatial-audio)
10. [Challenge-System (Fitness)](#10-challenge-system-fitness)
11. [Foto-Verifikation (AI Vision)](#11-foto-verifikation-ai-vision)
12. [Pet-System](#12-pet-system)
13. [Travel Route Engine](#13-travel-route-engine)
14. [Schnitzeljagd-Engine (Quest Chains)](#14-schnitzeljagd-engine-quest-chains)
15. [Progression & XP Engine](#15-progression--xp-engine)
16. [Social & Clan System](#16-social--clan-system)
17. [Leaderboard-System](#17-leaderboard-system)
18. [Wetter-Integration](#18-wetter-integration)
19. [Anti-Cheat](#19-anti-cheat)
20. [Content Moderation](#20-content-moderation)
21. [Push Notification Logic](#21-push-notification-logic)
22. [Offline-Fähigkeit](#22-offline-fähigkeit)
23. [Datenbank-Schema (Kernmodelle)](#23-datenbank-schema-kernmodelle)
24. [API-Architektur](#24-api-architektur)
25. [Privacy & DSGVO](#25-privacy--dsgvo)
26. [Performance & Skalierung](#26-performance--skalierung)
27. [Offene Entscheidungen (Spielraum)](#27-offene-entscheidungen-spielraum)

---

## 1. Systemarchitektur (Gesamtbild)

### 1.1 Architektur-Philosophie

Das System hat drei Schichten:

**Physical Layer** — Echte Welt: GPS, Sensoren, Wetter, Bewegung. Alles was der Spieler körperlich tut.

**Game Layer** — Spiellogik: Claims, Quests, Echos, Challenges, Progression. Alles was aus der Bewegung Gameplay macht.

**Social Layer** — Interaktion: Bewertungen, Clans, Leaderboards, Feed. Alles was Spieler verbindet.

### 1.2 Client-Server-Aufteilung

**Client (Mobile App) ist zuständig für:**
- GPS-Tracking (kontinuierlich im Hintergrund)
- Sensor-Daten sammeln (Accelerometer, Barometer, Gyroskop)
- Lokale Karten-Darstellung (Mapbox)
- Audio-Wiedergabe (Proximity-basiert)
- Kamera + Foto/Video Capture
- Offline-Queue (Aktionen zwischenspeichern wenn kein Netz)

**Server ist zuständig für:**
- Polygon-Berechnung und Überlappung (PostGIS)
- Claim-Validierung und Anti-Cheat
- AI Foto-Verifikation
- Quest-Matching und Bewertungslogik
- Leaderboard-Berechnung
- Audio-Storage und -Delivery (CDN)
- Push Notifications
- Decay/Verfall-Cronjobs

### 1.3 Kritische Design-Entscheidung

> **SPIELRAUM:** React Native vs. Flutter vs. Native (Kotlin/Swift). Sensor-Zugriff und Background-GPS funktionieren in allen drei, aber Native gibt die beste Kontrolle über Batterie und Hintergrund-Tracking. Flutter ist der beste Kompromiss. React Native hat das größte Ökosystem aber schwächere Sensor-Integration. Entscheidung kann nach Prototyp fallen.

---

## 2. GPS & Bewegungserkennung

### 2.1 Was das System können muss

- Kontinuierliches GPS-Tracking im Hintergrund (auch bei gesperrtem Bildschirm)
- Route als geordnete Liste von Koordinaten + Zeitstempel speichern
- Erkennen wann eine Route "geschlossen" ist (Start ≈ Ende)
- Erkennen wann der Spieler steht, geht, rennt, fährt
- Minimaler Batterieverbrauch

### 2.2 GPS-Tracking-Logik

**Sampling-Rate:** Nicht konstant — adaptiv nach Geschwindigkeit.

| Geschwindigkeit | Sample-Intervall | Genauigkeit |
|----------------|-----------------|-------------|
| Stillstand (<1 km/h) | Kein Tracking | — |
| Gehen (1–7 km/h) | Alle 5 Sekunden | Hoch (GPS + WLAN) |
| Laufen (7–20 km/h) | Alle 3 Sekunden | Hoch |
| Radfahren (20–40 km/h) | Alle 2 Sekunden | Mittel |
| Auto (>40 km/h) | Alle 5 Sekunden | Niedrig reicht |

**Warum adaptiv:** Batterie. Ein Spieler der 8 Stunden pendelt und die App im Hintergrund hat, darf nicht 50% Akku verlieren. Bei Stillstand wird GPS komplett pausiert und nur Geofencing/Significant Location Changes genutzt.

### 2.3 Route-Datenstruktur

Jeder GPS-Punkt wird gespeichert als:

```
{
  latitude: float,
  longitude: float,
  altitude: float,
  timestamp: unix_ms,
  accuracy: float (Meter),
  speed: float (m/s),
  bearing: float (Grad),
  source: "gps" | "network" | "fused"
}
```

Eine Route ist eine geordnete Liste solcher Punkte. Der Client sammelt und sendet sie in Batches (alle 30 Sekunden oder bei Route-Ende).

### 2.4 Route-Abschluss-Erkennung

Eine Route gilt als "geschlossen" wenn:

- Der Endpunkt innerhalb von X Metern vom Startpunkt liegt
- X = dynamisch: 50m in der Stadt, 200m auf dem Land, 500m auf Langstrecken
- Mindestens Y Minuten vergangen sind (verhindert "auf der Stelle drehen")
- Mindestens Z Meter Distanz zurückgelegt wurden

> **SPIELRAUM:** Die Werte für X, Y, Z müssen durch Playtesting bestimmt werden. Startvorschlag: 50m Radius, 5 Minuten Mindestdauer, 200m Mindestdistanz. Aber: zu streng = frustrierend, zu lasch = Exploit-anfällig.

### 2.5 Offene Route (nicht geschlossen)

Nicht jede Bewegung bildet ein Polygon. Ein Spieler läuft von A nach B ohne Rückkehr. Diese Bewegung kann trotzdem wertvoll sein:

- Straßensegmente auf dem Weg werden als "begangen" markiert
- Kein Flächen-Claim, aber Segment-Ownership möglich
- XP für Distanz und Erstbegehung

> **SPIELRAUM:** Sollen offene Routen überhaupt Claims erzeugen? Zwei Modelle möglich: (A) Nur geschlossene Polygone = Flächen-Claims, offene Routen = nur XP. (B) Offene Routen claimen die Straßensegmente direkt. Modell B ist einfacher zu verstehen aber schwerer zu balancen.

### 2.6 Batterie-Management

**Background-Tracking Strategien:**

- iOS: Significant Location Changes + Background Location Updates (mit ActivityType .fitness)
- Android: Foreground Service mit Notification + FusedLocationProvider
- Beide: Geofencing als Fallback wenn App gekillt wird
- Sensor-Batching: Accelerometer nicht in Echtzeit abfragen sondern in 10-Sekunden-Batches

**Erwarteter Verbrauch:** 5–8% pro Stunde aktives Tracking. Ziel: unter 3% im passiven Modus.

---

## 3. Polygon-Engine (Territorium)

### 3.1 Kernproblem

Aus einer GPS-Route muss eine Fläche berechnet werden. Diese Fläche muss mit allen bestehenden Flächen auf der Karte verglichen werden um Überlappungen zu finden.

### 3.2 Route → Polygon Konvertierung

**Schritt 1: Smoothing** — Rohe GPS-Daten haben Jitter. Kalman-Filter oder einfacher gleitender Durchschnitt über 3–5 Punkte entfernt Ausreißer.

**Schritt 2: Simplification** — Eine 30-Minuten-Route hat hunderte Punkte. Douglas-Peucker-Algorithmus reduziert auf die wesentlichen Eckpunkte (Toleranz: 5–10 Meter).

**Schritt 3: Polygon schließen** — Letzten Punkt mit erstem verbinden wenn Distanz < Schwellenwert.

**Schritt 4: Validierung** — Polygon darf sich nicht selbst schneiden (self-intersection). Wenn doch: Convex Hull als Fallback, oder dem Spieler zeigen und korrigieren lassen.

**Schritt 5: Flächenberechnung** — Gaußsche Trapezformel oder PostGIS `ST_Area()` auf der projizierten Geometrie.

### 3.3 Überlappungsberechnung

Das ist der technisch anspruchsvollste Teil. Wenn Spieler A ein Polygon hat und Spieler B ein neues Polygon claimen will das teilweise überlappt:

```
Neues_Land_B = ST_Difference(Polygon_B, Polygon_A)
Überlappung = ST_Intersection(Polygon_A, Polygon_B)
Verbleibendes_Land_A = ST_Difference(Polygon_A, Polygon_B)
```

PostGIS kann das nativ. Aber: bei tausenden Polygonen in einer Stadt wird das teuer.

### 3.4 Performance-Strategie

**Spatial Index:** GiST-Index auf allen Polygon-Spalten (PostGIS Standard).

**Bounding Box Pre-Filter:** Bevor teure ST_Intersection-Operationen laufen, prüft `ST_Intersects(bbox_a, bbox_b)` ob sich die Bounding Boxes überhaupt berühren.

**Tile-System:** Stadt wird in Hex-Tiles unterteilt (z.B. H3 von Uber). Claims werden pro Tile gecacht. Nur betroffene Tiles werden neu berechnet.

**Async Processing:** Claim-Berechnung muss nicht in Echtzeit passieren. Spieler beendet Route → Server berechnet in Queue → Push Notification wenn fertig ("Dein neues Territorium ist berechnet").

> **SPIELRAUM:** H3 Hex-Tiles vs. S2 Cells vs. eigenes Grid. H3 ist am besten dokumentiert und hat Libraries für alle Sprachen. Aber: die Tile-Größe bestimmt die Granularität. Resolution 9 (≈0.1 km²) ist ein guter Start für urbanes Gebiet.

### 3.5 Edge Cases

- **Extrem großes Polygon:** Spieler fährt mit dem Auto einen Kreis von 50 km Durchmesser. Limit: Max-Fläche pro Claim (z.B. 1 km² für Walker, 5 km² für Cyclist, 50 km² für Driver).
- **Haardünnes Polygon:** Spieler läuft hin und zurück auf derselben Straße. Ergebnis ist eine Linie, kein Polygon. Minimum-Breite-Check: Polygon muss in mindestens eine Richtung >20m breit sein.
- **Polygon in Polygon:** Spieler läuft eine Runde innerhalb seines eigenen Gebiets. Kein neuer Claim, aber: Verstärkung/Verteidigung des bestehenden Gebiets.
- **Gebiete in Gewässern/Parks:** Polygon überlappt Fluss/See. Option: Wasserflächen ausschneiden, oder ignorieren (einfacher).

---

## 4. Klassen-Erkennung (Sensor Fusion)

### 4.1 Ziel

Automatisch erkennen ob der Spieler gerade geht, rennt, radelt, skatet oder Auto fährt. Ohne dass er es manuell auswählen muss.

### 4.2 Verfügbare Sensordaten

| Sensor | Was er liefert | Relevanz |
|--------|---------------|----------|
| GPS | Speed, Bearing, Altitude | Primär für Grundgeschwindigkeit |
| Accelerometer | Beschleunigung in X/Y/Z | Bewegungsmuster (Schrittfrequenz, Stöße) |
| Gyroskop | Rotationsgeschwindigkeit | Unterscheidung Skate vs. Laufen |
| Barometer | Luftdruck/Höhe | Treppen vs. Aufzug, Steigung |
| Activity Recognition API | iOS CMMotionActivity / Android ActivityRecognition | Grobe Klassifikation (Walking/Running/Cycling/Automotive) |

### 4.3 Erkennungslogik (Entscheidungsbaum)

**Stufe 1 — OS-Level Activity Recognition:**
iOS und Android liefern bereits eine Grundklassifikation. Diese ist zu ~85% korrekt. Als erste Schicht nutzen.

**Stufe 2 — Speed-basierte Korrektur:**

| Klasse | Typische Geschwindigkeit | Accelerometer-Muster |
|--------|------------------------|---------------------|
| Walker | 3–6 km/h | Regelmäßig, niedrige Amplitude |
| Runner | 8–20 km/h | Rhythmisch, hohe Amplitude, ~150–180 BPM |
| Cyclist | 15–35 km/h | Wenig vertikale Beschleunigung, gleichmäßig |
| Skater | 10–25 km/h | Seitliche Schwingung (push-pattern), unregelmäßiger |
| Driver | >35 km/h sustained | Sehr wenig Beschleunigung am Körper, Barometer-Muster |

**Stufe 3 — Skater-Spezifisch (der schwierige Fall):**
Skater vs. Cyclist ist am schwersten zu unterscheiden. Schlüssel: Gyroskop-Daten. Skater haben charakteristische seitliche Rotation beim Pushen. Cyclist haben kaum Rotation.

> **SPIELRAUM:** Soll der Spieler seine Klasse auch manuell wählen können? Pro: Fallback wenn Erkennung falsch liegt. Contra: Exploit-Risiko (als Runner claimen während man Rad fährt). Empfehlung: Manuelle Wahl erlauben, aber Server validiert plausibilität nachträglich.

### 4.4 Dog Walker Erkennung

Kein Sensor kann einen Hund erkennen. Mögliche Ansätze:

- Spieler aktiviert "Dog Walk"-Modus manuell
- Optional: Bluetooth-Tag am Hund (z.B. AirTag) als Proximity-Beweis
- Einfachster MVP: Manuelle Aktivierung, Community meldet Missbrauch

> **SPIELRAUM:** Dog Walker Verifikation ist ein soziales Problem, kein technisches. Wer cheatet, schadet sich selbst kaum (Dog Walker Claims sind nicht die wertvollsten). Manueller Modus + Community-Report reicht vermutlich.

---

## 5. Claim-Wert-Engine

### 5.1 Formel

```
Claim-Wert = Basis-Fläche × Klassen-Multiplikator × Wetter-Bonus × Streak-Bonus × Neuheits-Bonus × Tageszeit-Bonus
```

### 5.2 Faktoren im Detail

**Basis-Fläche:** Rohwert in m². Logarithmisch skaliert damit riesige Gebiete nicht übermäßig dominieren.

```
Basis = log2(Fläche_m² / 100) × 100
Beispiel: 1000m² = log2(10) × 100 ≈ 332 Punkte
Beispiel: 10000m² = log2(100) × 100 ≈ 664 Punkte (doppelt so groß, aber nicht 10× mehr wert)
```

**Klassen-Multiplikatoren:**

| Klasse | Multiplikator | Begründung |
|--------|--------------|------------|
| Walker | ×1.0 | Basis |
| Dog Walker | ×1.2 | Leichter Bonus für tägliche Routine |
| Runner | ×2.5 | Körperlich anspruchsvoll |
| Cyclist | ×1.3 | Einfacher als Laufen, größere Flächen |
| Skater | ×2.0 | Skill-basiert |
| Driver | ×0.3 | Stark reduziert — Auto ist zu einfach |

**Wetter-Bonus:** (aus Wetter-API, siehe Kapitel 18)

| Bedingung | Bonus |
|-----------|-------|
| Klar/Bewölkt | ×1.0 (kein Bonus) |
| Leichter Regen | ×1.3 |
| Starker Regen | ×1.5 |
| Schnee | ×1.5 |
| Sturm (Wind >50 km/h) | ×2.0 |
| Extreme Kälte (<−5°C) | ×1.8 |
| Extreme Hitze (>35°C) | ×1.5 |

**Streak-Bonus:**

| Streak | Bonus |
|--------|-------|
| 3 Tage | ×1.1 |
| 7 Tage | ×1.3 |
| 14 Tage | ×1.5 |
| 30 Tage | ×2.0 |
| 90 Tage | ×2.5 |

**Neuheits-Bonus:**

| Situation | Bonus |
|-----------|-------|
| Erstbegehung (Straße hatte noch nie einen Claim) | ×2.0 |
| Neue Straße für diesen Spieler | ×1.3 |
| Bekannte Straße (wiederholter Claim) | ×1.0 |

**Tageszeit-Bonus:**

| Zeit | Bonus | Begründung |
|------|-------|------------|
| 05:00–07:00 | ×1.3 | Frühaufsteher |
| 07:00–22:00 | ×1.0 | Normal |
| 22:00–05:00 | ×1.5 | Nachtläufer |

> **SPIELRAUM:** Alle Multiplikatoren sind Startwerte. Das Balancing muss durch echte Daten angepasst werden. Ein Dashboard das zeigt "Welche Klasse dominiert?" und "Wie schnell verfallen Gebiete?" ist essentiell für Live-Tuning.

---

## 6. Territory Ownership & Konflikte

### 6.1 Ownership-Modell

Jedes Polygon auf der Karte hat einen Owner. Aber: eine Straße kann in mehreren Kategorien unterschiedliche Owner haben.

```
Territory {
  id: uuid,
  polygon: geometry,
  owner_id: uuid,
  class: "walker" | "runner" | "cyclist" | "skater" | "driver",
  claim_value: int,
  claimed_at: timestamp,
  last_defended: timestamp,
  decay_level: float (0.0 = frisch, 1.0 = verfallen),
}
```

### 6.2 Übernahme-Logik

Wenn Spieler B über Land von Spieler A läuft und einen neuen Claim macht:

1. Server berechnet Überlappung (PostGIS)
2. Für die überlappende Fläche: Vergleich der Claim-Werte
3. Wenn `new_claim_value > existing_claim_value × decay_factor`: Übernahme
4. Wenn nicht: Bestehender Claim bleibt, aber neuer Spieler bekommt XP für den Versuch
5. Bisheriger Owner wird per Push benachrichtigt

**Decay Factor:** Ein frischer Claim (gestern gemacht) ist schwerer zu übernehmen als ein alter (vor 6 Tagen, nie verteidigt). Der Decay Factor senkt den effektiven Wert:

```
effective_value = claim_value × (1.0 - decay_level × 0.7)
```

Bei `decay_level = 1.0` (komplett verfallen) ist der effektive Wert nur noch 30% des Originals.

### 6.3 Verteidigung

Ein Owner verteidigt sein Gebiet indem er einfach dort aktiv bleibt:

- Durch das Gebiet laufen/fahren (muss nicht erneut claimen)
- Eine Quest in seinem Gebiet spielen oder erstellen
- Einen Echo droppen oder liken

Jede Aktivität im eigenen Gebiet setzt `last_defended` auf jetzt und `decay_level` zurück auf 0.

### 6.4 Teil-Übernahme

Nicht immer wird ein ganzes Polygon übernommen. Oft überlappt nur ein Teil:

- Spieler A hat ein großes Gebiet
- Spieler B läuft eine kleine Runde die 30% von As Gebiet überlappt
- Ergebnis: B bekommt die 30% Überlappung. A behält die restlichen 70%.
- As Polygon wird per `ST_Difference` neu berechnet.

> **SPIELRAUM:** Soll ein Spieler sein ganzes Gebiet auf einmal verlieren können? Oder maximal X% pro Tag? Rate-Limiting bei Übernahmen verhindert dass ein Spieler über Nacht alles verliert. Vorschlag: Max 30% Gebietsverlust pro 24h.

---

## 7. Verfall-System (Decay)

### 7.1 Zweck

Ohne Verfall würden frühe Spieler alles besitzen und neue hätten keine Chance. Verfall sorgt für:

- Frische Karte (nicht alles ist besetzt)
- Motivation zur täglichen Aktivität
- Faire Chancen für neue Spieler
- Dynamische, lebendige Welt

### 7.2 Decay-Logik

Einmal täglich (z.B. 04:00 Uhr nachts) läuft ein Server-Cronjob:

```
Für jedes Territory:
  days_since_activity = (now - last_defended) in Tagen
  
  if days_since_activity <= 1:
    decay_level = 0.0
  elif days_since_activity <= 7:
    decay_level = (days_since_activity - 1) / 6 × 0.7   // Langsam bis 70%
  elif days_since_activity > 7:
    decay_level = 0.7 + (days_since_activity - 7) / 7 × 0.3  // Beschleunigt bis 100%
  
  if decay_level >= 1.0:
    → Territory wird "ungeclaimed" (grau auf der Karte)
    → Owner wird benachrichtigt: "Du hast [Straßenname] verloren"
```

**Ergebnis:** Ein Gebiet das 7 Tage nicht verteidigt wird, ist leicht übernehmbar. Nach 14 Tagen ist es weg.

### 7.3 Decay für Content

Nicht nur Gebiete verfallen — auch Content:

| Content-Typ | Verfall | Rettung |
|-------------|---------|---------|
| Echo | 48h | Likes verlängern um 48h pro Like (max 30 Tage) |
| Quest | 30 Tage ohne Spieler | Gute Bewertung (≥4.0★) = kein Verfall |
| Challenge | 30 Tage ohne Abschluss | Mind. 1 Abschluss/Monat hält sie am Leben |
| Artefakt | 60 Tage | Community-Vote für Permanent-Status |
| Legendary Content | Nie | Community-gesichert |

### 7.4 Legendary-Status

Content der Legendary wird, verfällt nie:

- Quests mit ≥4.8★ und ≥50 Abschlüssen
- Echos mit ≥200 Likes
- Artefakte mit Community-Vote (Mehrheit)
- Routen mit ≥4.8★ und ≥20 Bewertungen

Legendary Content bekommt ein spezielles Icon auf der Karte und wird in der Suche bevorzugt.

---

## 8. Quest-Engine

### 8.1 Quest-Datenmodell

```
Quest {
  id: uuid,
  creator_id: uuid,
  title: string,
  description: string,
  territory_id: uuid (Quest muss in eigenem Gebiet liegen),
  steps: [QuestStep],
  difficulty: 1-5,
  avg_rating: float,
  total_completions: int,
  created_at: timestamp,
  status: "active" | "decayed" | "legendary",
}

QuestStep {
  id: uuid,
  order: int,
  type: "FIND" | "LISTEN" | "CHALLENGE" | "SOLVE" | "COLLECT" | "DOG",
  location: point (lat/lng),
  radius: float (wie nah muss der Spieler sein — Standard 30m),
  instruction: string,
  verification: {
    type: "photo" | "proximity" | "video" | "text_input" | "sensor" | "dog_only",
    expected_answer?: string (für SOLVE),
    ai_check?: boolean (für FIND),
  },
  hint?: string (optional, nach X Minuten anzeigen),
}
```

### 8.2 Quest-Erstellung Flow

1. Spieler öffnet "Quest erstellen" (nur verfügbar wenn Level ≥ Claimer)
2. Karte zeigt nur eigenes Territorium als verfügbaren Bereich
3. Spieler setzt Steps per Tap auf Karte
4. Pro Step: Typ wählen, Anweisung schreiben, Verifikationstyp setzen
5. Preview-Modus: Spieler kann seine eigene Quest durchspielen
6. Veröffentlichung → Quest erscheint auf der Karte

### 8.3 Quest-Matching

Wie findet ein Spieler passende Quests?

**Proximity-basiert:** Quests in der Nähe (Standard-View)

**Empfohlen:** Basierend auf: bisherige Bewertungen, Klasse, bevorzugte Schwierigkeit, Sprache

**Suche:** Nach Name, Bezirk, Schwierigkeit, Typ, Bewertung

**Feed:** "Neue Quests in deinem Bezirk" / "Trending Quests diese Woche"

### 8.4 Quest-Bewertung

Nach Abschluss bewertet der Spieler:

- Kreativität (1–5 Sterne)
- Schwierigkeit (1–5 Sterne)
- "War es das wert?" (1–5 Sterne)

Gesamtrating = Gewichteter Durchschnitt. "War es das wert?" zählt doppelt.

> **SPIELRAUM:** Sollen Bewertungen anonym sein? Pro: Ehrlichkeit. Contra: Kein sozialer Druck gegen Troll-Bewertungen. Empfehlung: Sichtbar aber ohne direkte Konfrontation — Creator sieht Durchschnitt und Kommentare, nicht welcher Spieler was gesagt hat.

---

## 9. Echo-System (Spatial Audio)

### 9.1 Kern-Mechanik

Spieler nehmen kurze Audio-Clips auf und platzieren sie an GPS-Koordinaten. Andere Spieler hören sie nur wenn sie physisch dort vorbeigehen.

### 9.2 Audio-Spezifikation

| Parameter | Wert |
|-----------|------|
| Max. Länge | 30 Sekunden |
| Format | AAC / Opus (komprimiert) |
| Max. Dateigröße | ~500 KB |
| Hörradius | 30–50 Meter (konfigurierbar pro Echo) |
| Fade-in/out | 5 Meter Radius für sanften Übergang |

### 9.3 Platzierung

- Spieler muss physisch am Ort sein (GPS-Check)
- Spieler muss das Gebiet ownen ODER Creator-Level haben
- Max. 1 Echo pro 50m Radius (verhindert Spam-Cluster)
- Max. 5 aktive Echos pro Spieler gleichzeitig (erhöht sich mit Level)

### 9.4 Entdeckung & Wiedergabe

**Proximity Detection:** App prüft im Hintergrund alle X Sekunden ob ein Echo in der Nähe ist. Dafür: lokaler Cache der Echo-Positionen in einem Radius von ~500m um den Spieler. Cache aktualisiert sich wenn Spieler sich um >200m bewegt.

**Wiedergabe:** Automatisch wenn Spieler in den Radius kommt (mit Opt-in/Notification). Audio startet leise und wird lauter je näher man kommt. Maximale Lautstärke im Zentrum.

**Kopfhörer-Erkennung:** Wenn keine Kopfhörer: Vibration + Notification statt Auto-Play (kein plötzliches lautes Audio in der Öffentlichkeit).

### 9.5 Like-Mechanik & Verfall

```
Echo wird erstellt → Timer: 48h
Jeder Like → Timer +48h (max 30 Tage total)
Bei 0 Likes nach 48h → Echo verschwindet
Bei ≥200 Likes → Permanent-Kandidat (Community-Vote)
```

### 9.6 Audio-Storage

Echos werden auf CDN gespeichert (z.B. Cloudflare R2, AWS S3). Client cached Echos in der Nähe lokal (max 50 MB Cache). Verfallene Echos werden vom CDN gelöscht (Cleanup-Job wöchentlich).

> **SPIELRAUM:** Sollen Echos nur Musik/Beats sein, oder auch Sprache? MVP: Alles erlauben, aber AI-Moderation für unangemessene Inhalte. Langfristig evtl. Kategorien: "Musik", "Soundscape", "Sprache", "Story".

---

## 10. Challenge-System (Fitness)

### 10.1 Challenge-Templates

Challenges sind NICHT frei definierbar. Spieler wählen aus Templates:

**Fitness-Kategorie:**

| Template | Parameter | Verifikation |
|----------|-----------|-------------|
| Push-ups | Anzahl (5–50) | Video + AI Pose Detection |
| Klimmzüge | Anzahl (1–20) | Video |
| Plank | Dauer (15s–180s) | Accelerometer (Stillstand) + Timer |
| Kniebeugen | Anzahl (10–50) | Video + AI Pose Detection |
| Sprint | Distanz (50m–400m) | GPS Speed + Timer |
| Balance | Dauer (10s–60s) | Accelerometer (Stabilitäts-Score) |

**Skater-Kategorie:**

| Template | Parameter | Verifikation |
|----------|-----------|-------------|
| Rail Slide | Spot-spezifisch | Video + Community-Vote |
| Trick Line | Mindest-Tricks (3–10) | Video + Community-Vote |
| Drop | Höhe (geschätzt) | Video |

**Fun-Kategorie:**

| Template | Parameter | Verifikation |
|----------|-----------|-------------|
| Rutschen | Anzahl (3–10) | Video/Foto |
| Stein werfen (Wasser) | Anzahl Sprünge | Video |
| Balancieren | Distanz/Dauer | Video |

### 10.2 Verifikations-Level

**Level 1 — Foto:** Spieler macht Foto am Spot. AI prüft ob er dort ist. Niedrigste Hürde.

**Level 2 — Sensor:** Accelerometer + Timer verifizieren Bewegungsmuster (Plank, Balance, Sprint). Kein Video nötig.

**Level 3 — Video:** Spieler filmt sich (10–30 Sekunden). AI Pose Detection prüft Grundplausibilität. Bei Skater-Challenges: Community-Review.

### 10.3 Safety Limits

| Regel | Limit |
|-------|-------|
| Max Push-ups pro Challenge | 50 |
| Max Klimmzüge | 20 |
| Max Plank | 3 Minuten |
| Ortstyp-Beschränkung | Challenge nur an passenden Orten (Park, Fitnessplatz, Skatepark) |
| Gefährliche Orte | Blacklist: Gleise, Brückengeländer, Baustellen, Autobahnen |
| Altersbeschränkung | Fitness-Challenges ab 16 Jahren |

> **SPIELRAUM:** AI Pose Detection für Push-up-Zählung ist technisch möglich (MediaPipe, MoveNet) aber nicht trivial. Für MVP: Nur Video-Upload + Community-Bestätigung. AI-basierte Zählung in späterer Phase.

---

## 11. Foto-Verifikation (AI Vision)

### 11.1 Anwendungsfälle

1. **Quest FIND-Steps:** "Finde die rote Tür" → Spieler fotografiert → AI prüft ob eine rote Tür im Bild ist
2. **Claim-Beweis:** Foto am Ort als Zusatzbeweis
3. **Challenge-Beweis:** Foto zeigt Spieler am Spot
4. **Anti-Fake:** EXIF-Daten und GPS müssen konsistent sein

### 11.2 Technische Umsetzung

**Option A — Cloud Vision API (schnell, teuer):**
Google Cloud Vision, AWS Rekognition, oder GPT-4V. Hoch genau, ~$0.001–0.003 pro Bild.

**Option B — On-Device (langsam, kostenlos):**
CoreML (iOS) / ML Kit (Android) mit Custom Model. Funktioniert offline. Aber: deutlich weniger flexibel für variable Quests.

**Empfehlung:** Hybrid. Einfache Checks (Objekt vorhanden? Farbe stimmt?) on-device. Komplexe Checks (spezifisches Gebäude, detaillierte Szene) cloud-basiert.

### 11.3 Verifikations-Pipeline

```
1. Foto wird aufgenommen
2. EXIF-Check: GPS im Foto ≈ GPS der App? Zeitstempel plausibel?
3. Duplikat-Check: Bild-Hash gegen bekannte Uploads (kein Copy-Paste aus Google)
4. Content-Safety: AI scannt auf unangemessene Inhalte
5. Quest-spezifischer Check: Enthält das Bild was die Quest verlangt?
6. Ergebnis: PASS / FAIL / UNSICHER (→ Community-Review)
```

### 11.4 Edge Cases

- **Nacht-Fotos:** Zu dunkel für AI. Lösung: Flash erlauben, aber auch Nacht-Modus-Toleranz in der AI.
- **Gleicher Spot, verschiedene Jahreszeiten:** Baum im Winter vs. Sommer sieht anders aus. AI muss strukturelle Merkmale nutzen, nicht Farben.
- **Foto von Foto:** Jemand fotografiert ein Bild auf seinem Bildschirm. Detection: Moiré-Muster, Reflexionen, EXIF-Inkonsistenzen.

---

## 12. Pet-System

### 12.1 Datenmodell

```
Pet {
  id: uuid,
  owner_id: uuid,
  name: string,
  species: "dog" | "cat" | "other" (Erweiterbar),
  breed?: string,
  level: int,
  xp: int,
  specialization: "explorer" | "tracker" | "guardian" | null,
  total_distance_km: float,
  total_walks: int,
  rare_finds: int,
  created_at: timestamp,
}
```

### 12.2 XP-Quellen für Pets

| Aktion | XP |
|--------|-----|
| Spaziergang (pro km) | 50 |
| Neue Route (nie gelaufen) | 100 Bonus |
| Park besucht | 30 |
| Schnüffel-Spot gefunden | 80 |
| Rare Find entdeckt | 200 |
| Dog Challenge abgeschlossen | 150 |
| Park-Encounter (anderer Dog Walker getroffen) | 50 |

### 12.3 Spezialisierungen

Ab Level 10 kann der Hund eine Spezialisierung wählen:

**Explorer:** Findet mehr versteckte Spots auf neuen Wegen. +50% Rare Find Chance auf unbekannten Routen.

**Tracker:** Findet Schnüffel-Spots schneller (größerer Detection-Radius). Kann als Hinweisgeber in Schnitzeljagden fungieren.

**Guardian:** Verteidigt Territorium des Owners passiv. Gebiete die regelmäßig mit Hund begangen werden, verfallen 50% langsamer.

### 12.4 Schnüffel-Spots

Versteckte Punkte auf der Karte die nur für Dog Walker sichtbar sind. Generiert per Algorithmus:

- An interessanten Geo-Features (Parkbänke, Bäume, Hydranten in der realen Welt — aus OpenStreetMap-Daten)
- Täglich neue Spots an wechselnden Orten
- Seltenheitsgrade: Common (weiß), Uncommon (grün), Rare (blau), Epic (lila)
- Finden eines Spots = XP + mögliches Item (Artefakt, Quest-Hinweis)

> **SPIELRAUM:** Schnüffel-Spots können auch User-Generated sein. Dog Walker A versteckt etwas, Dog Walker B findet es. Das wäre ein eigenes Mini-Spiel innerhalb des Pet-Systems.

---

## 13. Travel Route Engine

### 13.1 Route-Lifecycle

```
DRAFT → RECORDING → VERIFICATION → PUBLISHED → EVOLVING → LEGENDARY
```

**DRAFT:** Spieler plant Route (optional, kann auch spontan starten)

**RECORDING:** App trackt im Hintergrund. Spieler markiert Spots bei Stopps. Alle Spots sind "Ghost" — unsichtbar für andere.

**VERIFICATION:** Route abgeschlossen. Server prüft:
- GPS-Daten plausibel? (Keine Teleportation)
- Geschwindigkeit realistisch? (Nicht 500 km/h)
- Stopps vorhanden? (Mindestens X Stopps für Routen >100 km)
- Gesamtdistanz stimmt?

**PUBLISHED:** Alle Ghost-Spots werden sichtbar. Route erscheint auf der Karte.

**EVOLVING:** Andere Spieler fahren dieselbe Route, bewerten und erweitern sie.

**LEGENDARY:** Nach ≥20 Bewertungen mit ≥4.8★ Durchschnitt.

### 13.2 Route-Matching

Wann gilt eine Route als "dieselbe"?

Nicht pixel-genau. Sondern: Zwei Routen gelten als "gleich" wenn ≥70% der Strecke innerhalb eines 2km-Korridors verlaufen. Algorithmus: Fréchet-Distanz oder Hausdorff-Distanz auf simplifizierte Routen.

### 13.3 Erlebnis-Sequenzierung

Wenn ein Spieler eine bekannte Route fährt, zeigt die App Spots in der richtigen Reihenfolge:

```
while driving:
  next_spot = nächster Spot auf der Route (in Fahrtrichtung)
  if distance_to(next_spot) < 5km:
    show notification: "In 5 km wartet etwas..."
  if distance_to(next_spot) < 500m AND speed < 30 km/h:
    unlock spot interaction
  if speed > 30 km/h:
    lock all interaction, nur Audio-Hinweis erlaubt
```

### 13.4 Multi-Spieler Route Ownership

Wer "besitzt" eine Route die von 20 Leuten gefahren wurde?

- Der Ersteller bleibt als "Founder" gelistet
- Spots können von jedem verifizierten Fahrer hinzugefügt werden
- Bewertungen sind pro Spot, nicht pro Route
- Routing-Vorschläge basieren auf den am besten bewerteten Spots aller Contributors

---

## 14. Schnitzeljagd-Engine (Quest Chains)

### 14.1 Chain-Logik

Eine Schnitzeljagd ist eine geordnete Kette von Quest-Steps (siehe Kapitel 8). Die Besonderheit: Steps müssen in Reihenfolge abgeschlossen werden.

```
QuestChain {
  id: uuid,
  creator_id: uuid,
  title: string,
  description: string,
  steps: [QuestStep] (geordnet),
  total_distance_km: float (geschätzt),
  estimated_duration_min: int,
  territories: [territory_id] (alle beteiligten Gebiete),
  cross_territory: boolean,
  requires_dog: boolean (true wenn mindestens ein DOG-Step),
  avg_rating: float,
  status: "active" | "decayed" | "legendary",
}
```

### 14.2 Cross-Territory Validierung

Wenn eine Schnitzeljagd über mehrere Gebiete geht:

- ALLE beteiligten Gebiete müssen dem Creator gehören
- ODER: Creator hat Architect-Level (kann dann auch durch ungeclaimtes Gebiet legen)
- ODER: Kooperation — mehrere Spieler verknüpfen ihre Quests

### 14.3 Kooperative Schnitzeljagden

Spieler A besitzt Gebiet 1, Spieler B besitzt Gebiet 2. Beide wollen eine zusammenhängende Schnitzeljagd:

1. Spieler A erstellt Steps in seinem Gebiet
2. Spieler A "lädt ein" Spieler B (über Profil/Suche)
3. Spieler B fügt Steps in seinem Gebiet hinzu
4. Beide bestätigen → Schnitzeljagd wird veröffentlicht
5. Credits gehen an beide Creator

### 14.4 Dynamische Hinweise

Nach X Minuten Inaktivität an einem Step bekommt der Spieler optional einen Hinweis. Hinweise sind vom Creator vordefiniert (pro Step).

```
Hint-Timing:
  5 Min → "Brauchst du einen Tipp?" (anklickbar)
  10 Min → Tipp automatisch anzeigen
  20 Min → "Möchtest du diesen Step überspringen?" (XP-Abzug)
```

> **SPIELRAUM:** Skip-Mechanik ja oder nein? Pro: Verhindert Frustration bei einem unlösbaren Step. Contra: Entwertet die Challenge. Empfehlung: Skip erlauben, aber: (a) XP-Malus, (b) Quest gilt nicht als "vollständig abgeschlossen", (c) Creator sieht welcher Step geskippt wird und kann ihn verbessern.

---

## 15. Progression & XP Engine

### 15.1 XP-Berechnung (Server-Side)

Alle XP werden Server-seitig berechnet. Der Client zeigt nur das Ergebnis. Verhindert Client-Side-Manipulation.

```
Claim-XP: Claim-Wert × 0.5 (gerundet)
Quest-Erstellen-XP: 200 (erst nach erster positiver Bewertung)
Quest-Lösen-XP: 100 + (Difficulty × 40)
Echo-Drop-XP: 50 (sofort) + 100 (wenn ≥10 Likes)
Challenge-XP: 50 + (Difficulty × 90)
Artefakt-XP: 50 + (Seltenheit × 50)
Streak-Bonus-XP: streak_days × 50 (am Streak-Tag ausgezahlt)
```

### 15.2 Level-Kurve

Exponentielle Kurve die am Anfang schnell geht und dann flacher wird:

```
XP für Level N = round(1000 × N^1.5)

Level 1:  1.000 XP
Level 5:  11.180 XP (kumulativ)
Level 10: 31.623 XP
Level 20: 89.443 XP
Level 30: 164.317 XP
Level 50: 353.553 XP
```

### 15.3 Prestige (Titel)

Titel werden unabhängig vom Level vergeben. Ein Level-5-Spieler der 100 km mit seinem Hund gelaufen ist, bekommt "Trail Dog" — obwohl er noch Newcomer ist.

Titel-Check läuft als Background-Job: Einmal pro Stunde prüft der Server alle Spieler auf neue Titel-Qualifikationen.

### 15.4 Anti-Grind

Problem: Spieler läuft 50× dieselbe kleine Runde um XP zu farmen.

Lösung: Diminishing Returns auf repetitive Aktionen:

```
Gleiche Route innerhalb 24h:
  1. Mal: 100% XP
  2. Mal: 50% XP
  3. Mal: 25% XP
  4+ Mal: 10% XP

Gleicher Quest-Typ am selben Tag:
  Ähnliche Reduktion
```

---

## 16. Social & Clan System

### 16.1 Organische Clan-Bildung

Clans werden NICHT manuell erstellt. Sie entstehen automatisch:

**Algorithmus:**

```
Alle 24h:
  Für jede ÖPNV-Linie + Zeitslot (±15 Min):
    Finde Spieler die ≥3× in den letzten 7 Tagen diese Linie zur gleichen Zeit genommen haben
    → Gruppiere als "Pendler-Clan"
  
  Für jeden Bezirk:
    Finde Top-10 aktivste Spieler
    → Gruppiere als "Bezirks-Clan"
  
  Für jeden Park:
    Finde Dog Walker die ≥3× im gleichen Park waren
    → Gruppiere als "Hunde-Clan"
```

Spieler werden benachrichtigt: "Du bist jetzt Teil der S7 07:43 Crew!" — können opt-out.

### 16.2 Clan-Features

- Gemeinsames Leaderboard
- Clan-Chat (optional)
- Team-Challenges (Clan vs. Clan)
- Gemeinsame Territory-Statistik
- Clan-Farbe auf der Karte (wenn Clan ein Gebiet dominiert)

### 16.3 Bezirk vs. Bezirk

Saisonale Events (monatlich oder quartalsweise):

```
Bezirks-Score = 
  Summe aller Claims × 0.3 +
  Summe aller Quest-Completions × 0.3 +
  Summe aller Echo-Likes × 0.2 +
  Anzahl aktive Spieler × 0.2
```

Gewinner-Bezirk bekommt: Sichtbares Banner auf der Karte, Bonus-XP für alle Spieler des Bezirks im nächsten Monat.

---

## 17. Leaderboard-System

### 17.1 Leaderboard-Typen

| Leaderboard | Scope | Metrik |
|-------------|-------|--------|
| Territory | Stadt / Bezirk | m² im Besitz |
| Street King | Pro Straße | Bestzeit / Claim-Wert |
| Questmaker | Stadt | Durchschnittliches Quest-Rating × Anzahl |
| Echo Master | Stadt | Permanente Echos |
| Explorer | Stadt | Verschiedene geclaimate Straßen |
| Streak | Global | Längster aktiver Streak |
| Bezirk | Stadt | Bezirks-Score (siehe 16.3) |
| Pet | Stadt | Pet-Level |

### 17.2 Update-Frequenz

- Territory-Leaderboard: Echtzeit (nach jedem Claim-Update)
- Alle anderen: Stündlich oder täglich (reduziert Server-Last)

### 17.3 Fairness

- Separate Leaderboards pro Klasse (Runner vs. Cyclist vs. Walker)
- Zeitbasierte Resets: Monatliches Leaderboard neben All-Time
- Neue Spieler sehen "Newcomer Leaderboard" (nur Spieler <30 Tage)

---

## 18. Wetter-Integration

### 18.1 Datenquelle

OpenWeatherMap API (kostenlos bis 1.000 Calls/Tag, $40/Monat für 100k) oder Open-Meteo (komplett kostenlos, keine API-Key nötig).

### 18.2 Abfrage-Logik

Nicht pro Spieler in Echtzeit. Stattdessen:

```
Alle 15 Minuten:
  Für jede aktive Stadt (wo gerade Spieler aktiv sind):
    Wetter-API Call → Cache das Ergebnis
    Felder: temperature, wind_speed, rain_mm, snow, weather_code
```

Client holt Wetter aus dem Cache statt direkt von der API.

### 18.3 Bonus-Berechnung

```
weather_bonus = 1.0  // default

if rain_mm > 0 and rain_mm < 5: weather_bonus = 1.3
if rain_mm >= 5: weather_bonus = 1.5
if snow > 0: weather_bonus = 1.5
if wind_speed > 50: weather_bonus = max(weather_bonus, 2.0)
if temperature < -5: weather_bonus = max(weather_bonus, 1.8)
if temperature > 35: weather_bonus = max(weather_bonus, 1.5)
```

Boni stacken NICHT multiplikativ. Es gilt immer der höchste Einzelbonus.

> **SPIELRAUM:** Sollen Wetter-Boni bei Auto-Claims auch gelten? Argument dagegen: Man sitzt im trockenen Auto. Empfehlung: Wetter-Bonus nur für Walker, Runner, Cyclist, Skater. Nicht für Driver.

---

## 19. Anti-Cheat

### 19.1 Cheat-Vektoren

| Cheat | Methode | Erkennung |
|-------|---------|-----------|
| GPS Spoofing | Fake GPS App | Mock Location Flag (Android), Jailbreak Detection (iOS), fehlende Accelerometer-Daten |
| Speed Hack | Als Runner claimen während im Auto | Accelerometer-Muster passen nicht zur Klasse |
| Foto Fake | Google-Bild statt echtes Foto | EXIF-GPS-Mismatch, Bild-Hash gegen Web-Datenbank, kein Kamera-Rauschen |
| Multi-Account | Mehrere Accounts für mehr Claims | 1€ Paywall pro Account, Device-Fingerprinting |
| Auto-Walk | Handy auf Modell-Eisenbahn | Unrealistisches Bewegungsmuster (perfekt gerade Linien, keine Variance) |

### 19.2 Erkennungs-Pipeline

```
Jeder Claim durchläuft:

1. GPS-Plausibilität:
   - Keine Sprünge >100m zwischen Samples (bei <30 km/h)
   - Speed konsistent mit Klasse
   - Altitude-Änderungen plausibel

2. Sensor-Konsistenz:
   - Accelerometer-Daten vorhanden? (Wenn nicht: verdächtig)
   - Muster passt zur behaupteten Klasse?
   - Barometer zeigt Outdoor-Bedingungen? (Druckschwankungen vs. Indoor-Konstanz)

3. Verhaltens-Analyse:
   - Claim-Frequenz realistisch? (Nicht 50 Claims in 1 Stunde)
   - Routen-Muster menschlich? (Nicht perfekte Rechtecke)
   - Zeitliche Verteilung: Nicht 24/7 aktiv

4. Ergebnis:
   - trust_score: 0.0–1.0
   - Unter 0.5: Claim wird gequeued für Manual Review
   - Unter 0.3: Claim automatisch abgelehnt
   - Unter 0.1: Account-Warnung
```

### 19.3 Bestrafung

- 1. Vergehen: Claim wird gelöscht, Warnung
- 2. Vergehen: 7-Tage Claim-Sperre
- 3. Vergehen: Permanenter Bann

> **SPIELRAUM:** False Positives sind gefährlich. Ein ehrlicher Spieler der gebannt wird, kommt nie wieder. Lieber zu lasch als zu streng am Anfang. Manual Review für alle Grenzfälle. Appeals-System nötig.

---

## 20. Content Moderation

### 20.1 Automatische Moderation

| Content | Tool | Aktion bei Flag |
|---------|------|----------------|
| Audio (Echos) | Speech-to-Text + Toxicity Check (Perspective API) | Auto-Hide + Review Queue |
| Fotos | Cloud Vision SafeSearch + NSFW Detection | Auto-Reject bei "very likely" |
| Videos | Frame-Sampling + SafeSearch auf Frames | Auto-Hide + Review Queue |
| Text (Quests, Artefakte) | Perspective API / Custom Filter | Auto-Reject bei hohem Score |

### 20.2 Community Moderation

- Report-Button auf jedem Content
- Bei ≥3 Reports: Content temporär versteckt
- Bei ≥5 Reports: Auto-Removal + Creator-Review
- Trusted Reporter Status: Spieler mit guter Moderation-History zählen ×2

### 20.3 Creator Reputation

```
creator_reputation = 
  (positive_ratings / total_ratings) × 0.5 +
  (1 - report_rate) × 0.3 +
  (account_age_factor) × 0.2
```

Niedrige Reputation → Content geht in Review-Queue bevor es live geht.
Hohe Reputation → Content geht direkt live.

---

## 21. Push Notification Logic

### 21.1 Notification-Typen und Priorität

| Event | Priorität | Timing |
|-------|----------|--------|
| Territorium angegriffen | HOCH | Sofort |
| Territorium verloren | HOCH | Sofort |
| Neuer Quest in der Nähe | MITTEL | Gebatcht (max 1×/Tag) |
| Echo geliked (Milestone: 10, 50, 100, 200) | MITTEL | Sofort |
| Streak in Gefahr (23h ohne Aktivität) | HOCH | Sofort |
| Quest-Bewertung erhalten | NIEDRIG | Gebatcht |
| Neuer Clan-Member | NIEDRIG | Gebatcht |
| Saisonales Event gestartet | MITTEL | Einmal |
| Level Up | MITTEL | Sofort |
| Neuer Titel freigeschaltet | HOCH | Sofort |
| Reise-Route: nächster Spot in der Nähe | HOCH | Sofort |

### 21.2 Notification-Limits

- Max 5 Push Notifications pro Tag (außer Territory-Angriffe)
- Quiet Hours: 23:00–07:00 (nur Streak-Warnung durchlassen)
- Spieler kann Kategorien einzeln an/aus schalten

---

## 22. Offline-Fähigkeit

### 22.1 Was offline funktionieren muss

- GPS-Tracking und Route-Aufzeichnung (komplett offline)
- Karte anzeigen (Tiles vorab cached)
- Foto aufnehmen (lokal gespeichert)
- Audio aufnehmen (lokal gespeichert)

### 22.2 Was online braucht

- Claim-Berechnung (Server)
- Quest-Verifikation (Server AI)
- Leaderboard-Updates
- Echo-Entdeckung (Cache reicht für lokale Echos)
- Soziale Features (Chat, Bewertungen)

### 22.3 Sync-Strategie

```
Offline-Queue:
  Spieler beendet Route offline
  → Route wird lokal gespeichert
  → Bei nächster Verbindung: Upload + Server-Berechnung
  → Push mit Ergebnis: "Dein Claim von heute Morgen: 1.200m² erobert!"

Conflict Resolution:
  Was wenn zwei Spieler offline denselben Bereich claimen?
  → Timestamp entscheidet (wer zuerst da war)
  → Beide bekommen XP, aber nur der Erste den Claim
```

---

## 23. Datenbank-Schema (Kernmodelle)

### 23.1 Primäre Datenbank: PostgreSQL + PostGIS

```sql
-- Spieler
users (
  id UUID PRIMARY KEY,
  username VARCHAR(30) UNIQUE,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_active TIMESTAMP,
  reputation FLOAT DEFAULT 1.0,
  banned BOOLEAN DEFAULT FALSE
)

-- Territorien
territories (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  polygon GEOMETRY(POLYGON, 4326),
  class VARCHAR(20),
  claim_value INT,
  claimed_at TIMESTAMP,
  last_defended TIMESTAMP,
  decay_level FLOAT DEFAULT 0.0,
  INDEX USING GIST(polygon)
)

-- Routen (Rohdaten)
routes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  points JSONB,  -- Array von GPS-Punkten
  polygon GEOMETRY(POLYGON, 4326),  -- Berechnetes Polygon (NULL wenn offen)
  class VARCHAR(20),
  distance_m FLOAT,
  duration_s INT,
  weather_bonus FLOAT DEFAULT 1.0,
  created_at TIMESTAMP,
  trust_score FLOAT DEFAULT 1.0
)

-- Quests
quests (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  title VARCHAR(200),
  description TEXT,
  territory_id UUID REFERENCES territories(id),
  difficulty INT,
  avg_rating FLOAT,
  total_completions INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP
)

-- Quest Steps
quest_steps (
  id UUID PRIMARY KEY,
  quest_id UUID REFERENCES quests(id),
  step_order INT,
  type VARCHAR(20),
  location GEOMETRY(POINT, 4326),
  radius_m FLOAT DEFAULT 30,
  instruction TEXT,
  verification_type VARCHAR(20),
  expected_answer TEXT,
  hint TEXT,
  INDEX USING GIST(location)
)

-- Echos
echos (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  location GEOMETRY(POINT, 4326),
  radius_m FLOAT DEFAULT 40,
  audio_url VARCHAR(500),
  likes INT DEFAULT 0,
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP,
  INDEX USING GIST(location)
)

-- Pets
pets (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  name VARCHAR(50),
  species VARCHAR(20),
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  specialization VARCHAR(20),
  total_distance_km FLOAT DEFAULT 0,
  total_walks INT DEFAULT 0
)

-- Travel Routes
travel_routes (
  id UUID PRIMARY KEY,
  founder_id UUID REFERENCES users(id),
  title VARCHAR(200),
  path GEOMETRY(LINESTRING, 4326),
  total_distance_km FLOAT,
  avg_rating FLOAT,
  total_ratings INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP
)

-- Bewertungen
ratings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  target_type VARCHAR(20),  -- 'quest', 'echo', 'challenge', 'route'
  target_id UUID,
  creativity INT,
  difficulty INT,
  worth_it INT,
  comment TEXT,
  created_at TIMESTAMP
)

-- Clan Memberships
clan_members (
  clan_id UUID,
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP,
  PRIMARY KEY (clan_id, user_id)
)

-- Clans
clans (
  id UUID PRIMARY KEY,
  type VARCHAR(20),  -- 'commute', 'district', 'dog_park', 'route'
  name VARCHAR(100),
  auto_generated BOOLEAN DEFAULT TRUE,
  metadata JSONB,  -- z.B. {"line": "S7", "time": "07:43", "direction": "Barmbek"}
  created_at TIMESTAMP
)
```

### 23.2 Redis (Cache + Realtime)

- Leaderboards (Sorted Sets)
- Online-Spieler-Positionen (Geo)
- Echo-Positionen pro Tile (schneller Proximity-Check)
- Rate Limiting (Anti-Spam, Anti-Cheat)
- Session Management

### 23.3 Object Storage (S3/R2)

- Audio-Dateien (Echos)
- Fotos (Quest-Beweise, Profilbilder)
- Videos (Challenge-Beweise)

---

## 24. API-Architektur

### 24.1 Endpunkte (Kerngruppen)

```
AUTH
  POST /auth/register
  POST /auth/login
  POST /auth/refresh

USER
  GET  /users/me
  GET  /users/:id/profile
  PUT  /users/me/settings

ROUTES
  POST /routes              (Upload einer aufgezeichneten Route)
  GET  /routes/me            (Meine Routen)

TERRITORIES
  GET  /territories          (Alle Territorien in Bounding Box)
  GET  /territories/:id
  GET  /territories/me       (Meine Gebiete)

QUESTS
  GET  /quests               (In der Nähe, gefiltert)
  POST /quests               (Erstellen)
  GET  /quests/:id
  POST /quests/:id/start     (Schnitzeljagd starten)
  POST /quests/:id/steps/:stepId/verify  (Step abschließen)
  POST /quests/:id/rate      (Bewerten)

ECHOS
  GET  /echos                (In der Nähe)
  POST /echos                (Erstellen — Upload Audio + Location)
  POST /echos/:id/like
  DELETE /echos/:id          (Eigene löschen)

CHALLENGES
  GET  /challenges           (In der Nähe)
  POST /challenges           (Erstellen)
  POST /challenges/:id/submit  (Video/Foto Upload)

PETS
  GET  /pets/me
  POST /pets                 (Registrieren)
  PUT  /pets/:id

TRAVEL
  POST /travel/routes        (Neue Route starten)
  PUT  /travel/routes/:id    (Spots hinzufügen)
  POST /travel/routes/:id/complete  (Abschließen)
  GET  /travel/routes        (In der Nähe / Suche)

LEADERBOARDS
  GET  /leaderboards/:type   (territory, streak, explorer, etc.)

CLANS
  GET  /clans/me
  GET  /clans/:id

NOTIFICATIONS
  GET  /notifications
  PUT  /notifications/settings

SOCIAL
  POST /reports              (Content melden)
  GET  /feed                 (Persönlicher Feed)
```

### 24.2 Realtime (WebSocket)

Für Echtzeit-Events:

- Territory-Angriff (sofort sichtbar auf der Karte)
- Proximity-Alerts (Echo in der Nähe)
- Clan-Chat
- Live Leaderboard Updates (bei Events)

---

## 25. Privacy & DSGVO

### 25.1 Datenkategorien

| Daten | Kategorie | Speicherdauer | Löschbar? |
|-------|-----------|--------------|-----------|
| GPS-Routen (Rohdaten) | Personenbezogen | 90 Tage | Ja |
| Territorien (Polygone) | Spiellogik | Solange aktiv | Mit Account |
| Fotos/Videos | UGC | Solange Content aktiv | Ja |
| Audio (Echos) | UGC | Bis Verfall/Löschung | Ja |
| Sensor-Daten | Personenbezogen | 7 Tage (nur für Anti-Cheat) | Automatisch |
| Wetter-Daten | Nicht personenbezogen | Unbegrenzt | n/a |

### 25.2 DSGVO-Anforderungen

- Datenschutzerklärung in App und Web
- Explizites Opt-in für GPS-Tracking (kein Default-On)
- Datenexport auf Anfrage (Art. 15 DSGVO)
- Account-Löschung mit Datenlöschung (Art. 17)
- Anonymisierung von Bewegungsdaten wenn für Analytics genutzt
- Kein Tracking von Nicht-Spielern (keine Fotos mit erkennbaren Personen speichern/teilen)
- Standortdaten nie an Dritte ohne explizites Opt-in

### 25.3 Besondere Vorsicht

- **Kinder:** USK/PEGI Rating beachten. Fitness-Challenges = Altersbeschränkung.
- **Foto-Inhalte:** Automatische Gesichtserkennung NUR für Blur (nicht für Identifikation).
- **Audio:** Echos dürfen keine erkennbaren Drittpersonen enthalten.
- **Data Insights (B2B):** Nur aggregierte, anonymisierte Daten. Nie individuelle Routen. Opt-in Pflicht.

---

## 26. Performance & Skalierung

### 26.1 Engpässe

| System | Potentieller Engpass | Lösung |
|--------|---------------------|--------|
| Polygon-Berechnung | CPU-intensiv bei vielen Überlappungen | Queue-basiert, Tile-Caching, Background Processing |
| Karten-Rendering | Tausende Polygone pro Viewport | Tile-basiertes Rendering, LOD (weniger Detail bei Zoom-Out) |
| Echo-Proximity | Häufige Geo-Queries | Redis Geo Set, lokaler Cache |
| AI Foto-Verifikation | Latenz + Kosten | On-Device für einfache Checks, Cloud nur für komplexe |
| Audio Storage | Bandbreite bei vielen Spielern | CDN mit regionalem Caching |
| Leaderboards | Häufige Sortierung | Redis Sorted Sets (O(log N) Update) |

### 26.2 Skalierungsstrategie

**Phase 1 (MVP, <1.000 Spieler):** Einzelner Server reicht. PostgreSQL + PostGIS auf managed DB. Kein Redis nötig.

**Phase 2 (<10.000 Spieler):** Redis hinzufügen für Cache + Leaderboards. CDN für Audio. Background Worker für Claim-Berechnung.

**Phase 3 (<100.000 Spieler):** Horizontale Skalierung: API-Server behind Load Balancer. Read Replicas für DB. Geo-Sharding (Claims pro Region auf unterschiedliche DB-Shards).

**Phase 4 (>100.000 Spieler):** Dedicated Polygon-Compute-Cluster. Event-Driven Architecture (Kafka/NATS). Regional Deployments (EU, US, etc.).

---

## 27. Offene Entscheidungen (Spielraum)

Diese Punkte sind bewusst noch nicht final entschieden. Jeder einzelne muss durch Prototyping und Playtesting geklärt werden.

### 27.1 Fundamentale Entscheidungen

| Frage | Optionen | Impact |
|-------|----------|--------|
| Mobile Framework | React Native / Flutter / Native | Sensor-Qualität, Entwicklungsgeschwindigkeit, Team-Skills |
| Polygon vs. Segment-basiertes Claiming | Geschlossene Flächen vs. einzelne Straßen | Gesamtes Territory-System |
| Realtime vs. Async Claims | Sofort berechnet vs. Queue-basiert | UX bei Claim-Moment |
| Globaler Launch vs. Stadt-für-Stadt | Alles auf einmal vs. Berlin first | Community-Dichte, Server-Kosten |

### 27.2 Gameplay-Entscheidungen

| Frage | Optionen | Worauf es ankommt |
|-------|----------|-------------------|
| Max Gebietsverlust pro Tag | Unbegrenzt / 30% / 50% | Frustration vs. Dynamik |
| Offene Routen = Claims? | Ja (Segment-Claim) / Nein (nur XP) | Einstiegshürde für neue Spieler |
| Skip bei Schnitzeljagden | Erlaubt / Verboten | Frustration vs. Challenge-Integrität |
| Manuelle Klassenwahl | Ja (mit Server-Check) / Nein (nur automatisch) | Accuracy vs. Accessibility |
| Echos: Audio-Typen | Alles / Nur Musik / Kategorien | Moderation-Aufwand, Kulturelle Identität |
| Dog Walker Verifikation | Manuell / Bluetooth Tag / Gar nicht | Cheat-Risiko vs. UX-Friction |

### 27.3 Technische Entscheidungen

| Frage | Optionen | Trade-Off |
|-------|----------|-----------|
| Tile-System | H3 / S2 / Custom Grid | Ökosystem vs. Flexibilität |
| AI Foto-Check | On-Device / Cloud / Hybrid | Kosten vs. Genauigkeit vs. Offline |
| Challenge-Verifikation (Fitness) | AI Pose Detection / Community-Vote / Nur Video | Entwicklungsaufwand vs. Cheat-Resistenz |
| Wetter-API | OpenWeatherMap / Open-Meteo / Kombination | Kosten vs. Genauigkeit |
| Audio-Format | AAC / Opus / Beide | Kompatibilität vs. Dateigröße |

### 27.4 Empfohlene Reihenfolge der Entscheidungen

1. **Sofort entscheiden:** Mobile Framework, Polygon vs. Segment, Stadt-für-Stadt vs. Global
2. **Nach Prototyp entscheiden:** Offene Routen, Manuelle Klassenwahl, Max Gebietsverlust
3. **Nach Beta entscheiden:** Challenge-Verifikation, Echo-Typen, Dog Walker Verifikation
4. **Laufend anpassen:** Alle Multiplikatoren, XP-Werte, Decay-Raten, Level-Kurve

---

*Die Stadt wird nicht mehr nur gesehen – sie wird gespielt.*

**GRIDWALKER** — Game Design Document v1.0

# KREUZANALYSE — Mechaniken, Zyklen & Abhängigkeiten

## Wie jedes System mit jedem anderen verbunden ist

**Version:** 1.0
**Datum:** März 2026

---

## 1. Mechanik-Interaktionsmatrix

Jeder Mechanismus beeinflusst andere. Diese Matrix zeigt WIE.

Legende: **→** = wirkt auf / **⊕** = verstärkt sich gegenseitig / **⊘** = blockiert/begrenzt / **∅** = keine direkte Verbindung

### MVP-Mechaniken untereinander

```
                    TERRITORY   GRAFFITI   QUESTS   DUELLS/RENNEN   PROGRESSION
TERRITORY              —          →⊕         →⊕        →              →
GRAFFITI               ⊕          —          →⊕        ∅              →
QUESTS                 ⊕          ⊕          —         ∅              →
DUELLS/RENNEN          →          ∅          ∅         —              →
PROGRESSION            ⊘→         →          →         →              —
```

**Was das bedeutet im Detail:**

| Verbindung | Wie sie wirkt |
|-----------|---------------|
| Territory → Graffiti | Du MUSST Gebiet besitzen um Graffiti zu platzieren (oder Creator-Level sein). Mehr Gebiet = mehr Graffiti-Spots |
| Graffiti → Territory | Graffiti in deinem Gebiet zählt als Aktivität → resettet Decay-Timer → schützt dein Land |
| Territory → Quests | Quests können nur in eigenem Gebiet erstellt werden. Mehr Land = mehr Quest-Fläche |
| Quests → Territory | Quest spielen in einem Gebiet = Aktivität → resettet Decay des Gebiets-Besitzers |
| Territory → Duells | Duells finden an Spots statt → Gewinner kann Gebiet beanspruchen |
| Duells → Territory | Duell-Sieg an einem Spot stärkt deinen Claim dort |
| Graffiti → Quests | Quests können LISTEN-Steps haben die auf Echos verweisen. CREATE-Steps verlangen Graffiti-Erstellung |
| Quests → Graffiti | Gute Quests ziehen Spieler an → diese entdecken Graffiti in der Nähe → Likes steigen |
| Progression → Alles | Level-Unlocks bestimmen was du darfst: Graffiti-Slots, Quest-Erstellung, Cross-Territory |
| Alles → Progression | Jede Aktion gibt XP → Level steigt → neue Rechte freigeschaltet |

### Phase 2 Mechaniken eingebunden

```
                    TERRITORY   GRAFFITI   QUESTS   DUELLS   CLANS   BOUNTIES   ALIAS
TERRITORY              —          →⊕        →⊕       →        →⊕       ⊘          →
GRAFFITI               ⊕          —         →⊕       ∅        →        ∅          →
QUESTS                 ⊕          ⊕         —        ∅        →        ∅          →
DUELLS                 →          ∅         ∅        —        →        →          ∅
CLANS                  ⊕          ⊕         ⊕        →        —        →          ⊘
BOUNTIES               →          ∅         ∅        →        →        —          ⊕
ALIAS                  →          →         →        ∅        ⊘        ⊕          —
```

**Neue Verbindungen:**

| Verbindung | Wie sie wirkt |
|-----------|---------------|
| Clans → Territory | Clans koordinieren Claims → Bezirks-Dominanz → Parade-Trigger |
| Territory → Clans | Spieler im selben Gebiet werden automatisch gruppiert |
| Bounties → Territory | Bounty motiviert andere, ein bestimmtes Gebiet anzugreifen |
| Bounties → Duells | Bounty-Ziel wird häufiger herausgefordert |
| Clans → Bounties | Clans können koordiniert Bounties setzen um Gegner zu schwächen |
| Alias → Territory | Alias baut eigenes Territorium auf (separater Layer der Identität) |
| Alias → Bounties | Bounty auf einen Alias möglich → Enttarnungsjagd beginnt |
| Alias ⊘ Clans | Alias kann NICHT im selben Clan sein wie Hauptaccount (würde Identität verraten) |

### Phase 3 & 4 eingebunden

```
                    TERR   GRAFF   QUESTS   DUELLS   CLANS   BOUNTY   ALIAS   TRAPS   EVENTS
TERRITORY            —      →⊕      →⊕       →       →⊕       ⊘        →       →        →
GRAFFITI             ⊕      —       →⊕       ∅       →        ∅        →       ∅        →
QUESTS               ⊕      ⊕       —        ∅       →        ∅        →       ∅        →
DUELLS               →      ∅       ∅        —       →        →        ∅       ∅        →
CLANS                ⊕      ⊕       ⊕        →       —        →        ⊘       ⊕        →⊕
BOUNTIES             →      ∅       ∅        →       →        —        ⊕       ∅        →
ALIAS                →      →       →        ∅       ⊘        ⊕        —       →        →
TRAPS                ⊘      ∅       ∅        ∅       ⊕        ∅        ⊘       —        ⊘
EVENTS               →→     →       →        →       →        →        →       ⊘        —
```

**Kritische Verbindungen Phase 3–4:**

| Verbindung | Wie sie wirkt |
|-----------|---------------|
| Traps ⊘ Territory | Traps schützen Gebiete → verlangsamen Übernahmen → stabilisieren Karte |
| Traps ⊘ Alias | Alias triggert Traps genauso → keine Sonderbehandlung |
| Events → Alles | Eclipse invertiert Territorien, deaktiviert Traps, aktiviert Stealth für alle |
| Events → Clans | King of the Hill und Waves erfordern Clan-Koordination |
| Events ⊘ Traps | Während Eclipse: Traps deaktiviert → Chaos-Fenster |
| Sabotage → Territory | Beschleunigt Decay fremder Gebiete ohne direkten Claim |
| Clans → Traps | Clan kann koordiniert Traps in einem Bezirk verteilen (Festungsring) |

---

## 2. Kern-Zyklen (Loops)

### 2.1 Primärer Loop — "Der tägliche Grind" (5–30 Min/Tag)

```
BEWEGEN → CLAIMEN → VERTEIDIGEN → GESTALTEN → zurück zu BEWEGEN
   ↓         ↓           ↓             ↓
  GPS     Polygon      Decay         Content
 trackt   berechnet    resettet     (Graffiti/
 Route    Fläche      Timer         Quest)
   ↓         ↓           ↓             ↓
  XP       Land        Land          XP +
 sofort   auf Karte   bleibt       Likes
```

**Trigger:** Spieler geht raus (Habit).
**Belohnung:** Gebiet wächst, XP steigt, Content wird entdeckt.
**Frequenz:** Täglich. Streak-Bonus belohnt Regelmäßigkeit.
**Minimale Session:** 5 Minuten (eine kleine Runde um den Block = 50m² Claim).

### 2.2 Sekundärer Loop — "Der kreative Loop" (10–30 Min, 2–3×/Woche)

```
GEBIET BESITZEN → CONTENT ERSTELLEN → ANDERE ENTDECKEN → BEWERTUNG → PRESTIGE
       ↓                 ↓                    ↓               ↓           ↓
  Unlock-Stufe      Graffiti/Quest/       Proximity-        Likes/      Creator-
  bestimmt was      Schnitzeljagd         Trigger           Rating      Score steigt
  erlaubt ist                                                              ↓
       ↑←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←← XP ←←←←←←←←←←←←←←←←←←←←←←
```

**Trigger:** "Ich habe Gebiet — was mache ich damit?"
**Belohnung:** Bewertungen, Likes, Creator-Reputation, Prestige-Titel.
**Abhängigkeit:** Ohne primären Loop (Gebiet) kein sekundärer Loop (Content).

### 2.3 Tertiärer Loop — "Der Kampf-Loop" (spontan, 1–5×/Woche)

```
NOTIFICATION → ENTSCHEIDUNG → AKTION → ERGEBNIS → EMOTION
     ↓              ↓            ↓          ↓          ↓
"Jemand greift   Verteidigen   Hinlaufen   Gebiet    Adrenalin
 dein Gebiet     oder          Duell       gehalten   oder
 an!"            aufgeben?     Sabotage    oder       Frustration
                               Trap lösen  verloren      ↓
                                                    MOTIVATION
                                                    (Rache oder
                                                     Stolz)
                                                        ↓
                                              zurück zu BEWEGEN
```

**Trigger:** Push Notification (Angriff, Sabotage, Bounty).
**Belohnung:** Verteidigung = Sicherheit + Stolz. Angriff = neues Land + Dominanz.
**Emotionaler Motor:** Verlustangst (stärker als Gewinnfreude).
**Frequenz:** Unvorhersehbar. Genau deshalb süchtig machend.

### 2.4 Sozialer Loop — "Der Clan-Loop" (wöchentlich)

```
GEMEINSAM AKTIV → CLAN ENTSTEHT → KOORDINATION → CLAN-EVENTS → IDENTITÄT
       ↓                ↓               ↓              ↓            ↓
  Gleiche Routen   Auto-Gruppierung   Chat/         Wave Attack   "Ich bin
  gleiche Zeiten   Notification:      Planung       Bezirk vs.    Kreuzberg
  gleiche Gebiete  "Du bist jetzt     Wer läuft     Bezirk        Crew"
                   Teil der           wo?            Parade-             ↓
                   Kreuzberg Crew"                   Trigger      LOYALITÄT
                                                                       ↓
                                                              zurück zu BEWEGEN
                                                              (für den Clan)
```

**Trigger:** Organische Gruppierung + Clan-Notification.
**Belohnung:** Zugehörigkeit, gemeinsame Dominanz, Clan-Prestige.
**Abhängigkeit:** Braucht genügend Spielerdichte in einem Gebiet.
**Verstärker:** Bezirk vs. Bezirk Events.

### 2.5 Meta-Loop — "Die Legende" (monatlich/saisonal)

```
SPIELEN → LEVEL UP → NEUE RECHTE → GRÖSSERE AKTIONEN → STATUS → LEGACY
   ↓          ↓            ↓               ↓               ↓        ↓
 Wochen    Newcomer →   Quest-        Cross-Territory   Prestige  "Jeder
 und       Claimer →    Erstellung    Schnitzeljagd     Titel     kennt
 Monate    Creator →    Alias         Events erstellen  "Legend"  deinen
           Architect →  Traps setzen  Frozen Throne              Namen"
           Legend        Bounties
```

**Trigger:** Langfristige Progression, Meilensteine.
**Belohnung:** Macht, Einfluss, Reputation.
**Retention-Mechanismus:** Je mehr investiert, desto schwerer aufzuhören (Sunk Cost).

---

## 3. Abhängigkeitsbaum (Was braucht Was?)

### Harte Abhängigkeiten (MUSS existieren bevor das andere funktioniert)

```
GPS-Tracking
  └→ Route Recording
      └→ Polygon-Berechnung
          └→ Territory Claiming
              ├→ Graffiti-Platzierung (braucht Gebiet ODER Creator-Level)
              ├→ Quest-Erstellung (braucht Gebiet + Unlock-Level)
              ├→ Traps (braucht Gebiet)
              ├→ Festungen (braucht Gebiet + 14 Tage Besitz)
              └→ Sabotage (braucht fremdes Gebiet)

Level-System
  └→ Unlock-Stufen
      ├→ Newcomer: Karte + Quests spielen
      ├→ Claimer (3 Claims): Quest-Erstellung
      ├→ Creator (10 Claims + 5 Bewertungen): Echos, Schnitzeljagden
      ├→ Architect (50 Claims + 20 Bewertungen): Cross-Territory
      └→ Legend (100+ Claims + Community-Vote): Events, Mentor

Spielerdichte
  └→ Clans (braucht ≥3 Spieler im selben Gebiet/Route)
  └→ Duells (braucht 2 Spieler am selben Spot)
  └→ Bounties (braucht genug Spieler die jagen)
  └→ Events (braucht kritische Masse für Spannung)
```

### Weiche Abhängigkeiten (funktioniert ohne, aber BESSER mit)

```
Territory + Graffiti = Gebiet fühlt sich "lebendig" an
Territory + Quests = Gebiet hat Zweck (nicht nur Farbe auf Karte)
Quests + Graffiti = Quests verweisen auf Echos (LISTEN-Steps)
Clans + Bounties = Koordinierte Jagd statt Solo-Aktionen
Duells + Leaderboards = Duell-Ergebnisse sind sichtbar und motivierend
Alias + Bounties = Kopfgeld auf unsichtbaren Gegner (Spannung)
Traps + Sabotage = Verteidigung vs. Angriff Balance
Events + Clans = Koordinierte Clan-Aktionen bei Eclipse/KotH
```

---

## 4. Feedback-Loops (selbstverstärkende Zyklen)

### 4.1 Positiver Loop: "Der Dominator"

```
Viel Claims → Großes Gebiet → Mehr Graffiti-Plätze → Mehr Likes →
Mehr XP → Höheres Level → Mehr Rechte → Noch mehr Claims → ...
```

**Gefahr:** Runaway-Effekt. Ein Spieler wird uneinholbar.
**Gegengewicht:** Auto-Bounty (nach 14 Tagen Dominanz), Decay (Gebiet verfällt ohne Aktivität), Eclipse (monatlicher Reset-Schock), Max 30% Verlust/Tag (verhindert Total-Crash aber erlaubt Erosion).

### 4.2 Positiver Loop: "Der Creator"

```
Gute Quest → Viele Spieler lösen sie → Hohe Bewertung → Creator-Score steigt →
Mehr Rechte (längere Quests, Cross-Territory) → Noch bessere Quests → ...
```

**Gefahr:** Creator-Elite die alles dominiert.
**Gegengewicht:** Verfall (Quests ohne Spieler verschwinden), Neue Creator bekommen "Newcomer-Boost" (erste Quests werden prominenter angezeigt).

### 4.3 Negativer Loop: "Der Verlierer-Spiral"

```
Gebiet verloren → Weniger Graffiti-Plätze → Weniger Likes → Weniger XP →
Kein Level-Up → Kann nicht zurückerobern → Noch mehr Gebiet verloren → ...
```

**Gefahr:** Spieler gibt auf.
**Gegengewichte:**
- Trost-XP bei gescheitertem Claim (du bekommst immer etwas)
- Erstbegehungs-Bonus (neue Straßen = ×2.0, motiviert Exploration statt Revanche)
- Eclipse (monatlicher Reset gibt allen eine Chance)
- Blitz-Claims (schnelle 10× XP für Micro-Aktionen)
- Offene Routen geben XP auch ohne Flächen-Claim

### 4.4 Balancing-Loop: "Auto-Bounty"

```
Spieler dominiert lange → System setzt Bounty → Alle jagen ihn →
Gebiet schrumpft → Bounty verschwindet → Stabilisierung
```

**Zweck:** Verhindert ewige Monarchen. Selbstregulierend.

### 4.5 Balancing-Loop: "Decay als Equalizer"

```
Spieler wird inaktiv → Gebiet verfällt → Wird übernehmbar →
Neue Spieler expandieren → Karte bleibt dynamisch
```

**Zweck:** Keine toten Zonen. Frische Möglichkeiten für alle.

### 4.6 Sozialer Loop: "Clans als Multiplikator"

```
Einzelspieler ist schwach → Clan gibt Koordination → Wave Attack möglich →
Großes Gebiet gemeinsam → Parade-Trigger → Clan-Prestige →
Mehr Spieler wollen beitreten → Clan wird stärker → ...
```

**Gefahr:** Mega-Clans die alles dominieren.
**Gegengewicht:** Bezirk vs. Bezirk teilt die Aufmerksamkeit, Eclipse trifft Clans genauso, kein Clan-Gebiet-Schutz (jedes Mitglied muss individuell verteidigen).

---

## 5. Zeitliche Zyklen

### Innerhalb eines Tages (24h)

```
MORGEN (05–09)                MITTAG (12–13)           ABEND (18–22)              NACHT (22–05)
├ Frühaufsteher-Bonus ×1.3    ├ King of the Hill       ├ Peak Activity             ├ Nacht-Bonus ×1.5
├ Pendler-Routen              │ (tägliches Event)      ├ Duelle häufig             ├ Nacht-Layer
├ Dog Walker Morning Run      ├ Loot Drops spawnen     ├ Clan-Koordination         ├ Seltene Drops
└ Wenig Konkurrenz            └ Viele Spieler aktiv    ├ Graffiti-Erstellung       └ Wenig Konkurrenz
                                                       └ Quest-Spielen                (hoher Wert)
```

### Innerhalb einer Woche (7 Tage)

```
TAG 1    TAG 2    TAG 3    TAG 4    TAG 5    TAG 6    TAG 7
 Claim    Claim    Claim    Claim    Claim    Claim    Claim
  ↓        ↓        ↓        ↓        ↓        ↓        ↓
 XP       XP       XP+      XP       XP       XP      XP +
                  Streak                              7-Tage-
                  ×1.1                                Streak
                                                      ×1.3 +
                                                     500 Bonus

 Decay-Check: Gebiete die 7 Tage unberührt sind beginnen schnell zu verfallen
 Clan-Check: Wöchentliche Clan-Zuordnung basierend auf Aktivitätsmuster
 Wettbewerb: Wochenend-Hills dauern 3 Stunden statt 1
```

### Innerhalb eines Monats (30 Tage)

```
WOCHE 1          WOCHE 2          WOCHE 3          WOCHE 4
├ Normal          ├ Streak-Aufbau   ├ Streak ×1.5    ├ 30-Tage-Streak ×2.0
├ Clan bildet     ├ Clan wächst     ├ Clan-Events    ├ Bezirk vs. Bezirk Finale
│ sich            │                 │                ├ Eclipse (zufällig in Woche 3 oder 4)
└ Exploration     └ Verteidigung    └ Expansion      └ Frozen Throne (Top-Spieler)
                    wird wichtig      beginnt

Monatsende:
  → Leaderboard-Reset (monatlich)
  → Bezirk-Sieger gekürt
  → Auto-Bounties angepasst
  → Alias-Enttarnungs-Cooldown reset
```

### Innerhalb eines Quartals / einer Saison

```
MONAT 1              MONAT 2              MONAT 3
├ Saisonaler          ├ Mid-Season         ├ Saison-Finale
│ Event-Start         │ Intensivierung     │ Große Events
├ Neue Quest-         ├ Clan-Kriege        ├ Finales Bezirk vs. Bezirk
│ Templates           │ eskalieren         ├ Saison-Leaderboard
├ Wetter-Quests       ├ Bounty-Phase       │ abgeschlossen
│ (saisonal)          │ (Top-Spieler       ├ Saisonale Prestige-Titel
└ Neuer Content       │  im Visier)        │ vergeben
                      └ Mid-Season Eclipse └ Saison-Reset
```

---

## 6. Emotionale Zyklen

### Die Sucht-Schleife (Session-Level)

```
NEUGIER ("Was hat sich auf meiner Karte verändert?")
    ↓
ENTDECKUNG ("Jemand hat ein Graffiti in meinem Gebiet hinterlassen!")
    ↓
REAKTION ("Ich muss mein Gebiet verteidigen / Ich will das hören")
    ↓
AKTION (Claim, Graffiti, Quest, Duell)
    ↓
BELOHNUNG (XP, Gebiet, Likes, Sieg)
    ↓
ZUFRIEDENHEIT + NEUE NEUGIER ("Was passiert als nächstes?")
    ↓
zurück zu NEUGIER
```

### Die Verlustangst-Schleife (Retention)

```
BESITZ ("Das ist MEIN Gebiet")
    ↓
BEDROHUNG ("Notification: Jemand greift an!")
    ↓
ANGST ("Ich könnte alles verlieren!")
    ↓
DRINGLICHKEIT ("Ich muss JETZT raus!")
    ↓
AKTION (Verteidigung)
    ↓
ERLEICHTERUNG ("Gerettet!") ODER FRUSTRATION ("Verloren!")
    ↓                                  ↓
STÄRKERER BESITZ-                  RACHE-MOTIVATION
INSTINKT                           ("Das hol ich mir zurück!")
    ↓                                  ↓
    └────────→ zurück zu BESITZ ←──────┘
```

### Die Creator-Schleife (Langzeit)

```
KREATIVITÄT ("Ich will was Geiles bauen")
    ↓
ERSTELLUNG (Quest, Schnitzeljagd, Graffiti)
    ↓
WARTEN ("Hat es jemand gefunden?")
    ↓
FEEDBACK (Bewertungen, Likes, Kommentare)
    ↓
STOLZ ("4.8 Sterne! 50 Leute haben meine Quest gelöst!")
    ↓
AMBITION ("Ich kann was noch Besseres machen")
    ↓
zurück zu KREATIVITÄT
```

---

## 7. Kritische Schwachstellen & Gegenmaßnahmen

### Schwachstelle 1: Leere Karte (Cold Start)

**Problem:** Am Anfang ist alles grau. Keine Graffitis, keine Quests, keine Spieler. Kein Grund die App zu öffnen.

**Gegenmaßnahmen:**
- Erstbegehungs-Bonus ×2.0 macht die leere Karte zum Vorteil ("Alles ist noch zu holen!")
- System-generierte "Seed Quests" in jeder Launch-Stadt (einfache FIND-Quests an bekannten Orten)
- Launch nur in EINER Stadt (Berlin) für maximale Spielerdichte
- Invite-System: Spieler die Freunde einladen bekommen Bonus wenn der Freund seinen ersten Claim macht
- Die ersten 100 Spieler einer Stadt bekommen "Pioneer"-Titel (permanent, nie wieder vergeben)

### Schwachstelle 2: Toxische Dominanz

**Problem:** Ein Spieler oder Clan kontrolliert alles. Neue Spieler haben keine Chance.

**Gegenmaßnahmen:**
- Auto-Bounty nach 14 Tagen Dominanz (eskalierend)
- Max 30% Gebietsverlust pro 24h (aber: kontinuierliche Erosion möglich)
- Eclipse (monatlicher Chaos-Reset)
- Blitz-Claims (schnelle 10× XP auch ohne großes Gebiet)
- Newcomer-Schutz: Erste 7 Tage nach Account-Erstellung sind Claims 50% schwerer zu übernehmen

### Schwachstelle 3: Content-Wüste

**Problem:** Niemand erstellt Quests oder Graffitis. Gebiet ist da, aber leer.

**Gegenmaßnahmen:**
- XP für Content-Erstellung (nicht nur für Lösung)
- "Leeres Gebiet"-Notification an Besitzer: "Dein Gebiet hat noch keine Quests — erstelle eine!"
- Graffiti-Verfall ohne Likes motiviert Qualität (kein Spam der ewig bleibt)
- Quest-Empfehlungen: "In deiner Nähe fehlt eine Quest — sei der Erste!"

### Schwachstelle 4: Spieler gibt auf nach Totalverlust

**Problem:** Alles verloren durch Eclipse, Wave Attack oder einfach 2 Wochen Urlaub. Spieler deinstalliert.

**Gegenmaßnahmen:**
- Rückkehr-Bonus: Nach ≥7 Tagen Inaktivität: 48h doppelter Claim-Wert
- Offene Routen geben immer XP (auch ohne Flächen-Claim)
- Prestige-Titel bleiben permanent (auch wenn Gebiet weg ist)
- "Dein Monument" (bei 30 Tagen Inaktivität): Denkmal bleibt auf der Karte — emotionaler Anker für Rückkehr

### Schwachstelle 5: Privatsphäre-Bedenken

**Problem:** App zeigt wo du wohnst, wann du zur Arbeit gehst, welche Routen du läufst.

**Gegenmaßnahmen:**
- Alias-System (Phase 2): Komplett separates Profil
- "Home Zone": 200m Radius um eine selbst gewählte Adresse → Claims hier werden NICHT auf der öffentlichen Karte angezeigt
- Routen-Delay: Deine aktive Route wird erst 15 Minuten NACH Abschluss auf der Karte sichtbar (kein Live-Stalking)
- Kein Live-Positions-Sharing (außer bei Duells und Rennen, und dort nur für die Dauer)

### Schwachstelle 6: Auto/Bus-Missbrauch

**Problem:** Jemand fährt Bus und sammelt riesige Cruise-Layer Claims die nichts kosten.

**Gegenmaßnahme:** Bereits gelöst durch Speed-Layer. Cruise = ×0.1. Kein Wetter-Bonus. Keine Quests erstellbar. Eigenes Leaderboard. Ground Layer ist unerreichbar mit Motor. Das Problem reguliert sich selbst.

### Schwachstelle 7: Fake-Foto Exploits

**Problem:** AI-generierte Bilder, Fotos von Fotos, manipulierte EXIF-Daten.

**Gegenmaßnahme:** Bereits gelöst durch Anti-Fake-System. Nur In-App-Kamera, App-eigene Metadaten, AI-Content-Detection, Szenen-Tiefe-Analyse, Community-Review bei Unsicherheit.

---

## 8. Build-Reihenfolge (Was MUSS zuerst existieren?)

### Schicht 1: Infrastruktur (Woche 1–4)

```
GPS-Tracking Engine
  ↓
Polygon-Berechnung (PostGIS)
  ↓
Karten-Darstellung (Mapbox)
  ↓
User Auth + Account System
  ↓
Push Notification System
```

Ohne das läuft NICHTS. Alles andere baut darauf auf.

### Schicht 2: Core Gameplay (Woche 5–8)

```
Speed-Layer Zuordnung (Ground/Rush/Cruise)
  ↓
Claim-Wert Berechnung (Formel + Boni)
  ↓
Übernahme-Logik (Polygon-Vergleich)
  ↓
Decay-System (Cronjob)
  ↓
XP + Level System
  ↓
Basis-Leaderboard
```

Jetzt kann man spielen. Noch kein Content, aber Territory-Kampf funktioniert.

### Schicht 3: Content (Woche 9–12)

```
In-App-Kamera + Anti-Fake-Pipeline
  ↓
Foto-Graffiti (platzieren + entdecken)
  ↓
Audio-Graffiti (aufnehmen + Proximity-Playback)
  ↓
Video-Graffiti (15 Sek Clips)
  ↓
Like/Dislike System + Verfall
  ↓
Einfache Quests (FIND + SOLVE Steps)
```

Jetzt hat die Karte Leben. Gebiete sind nicht nur Farben sondern haben Inhalt.

### Schicht 4: Kompetition (Woche 10–14)

```
Duell-System (Proximity Detection + Challenge Types)
  ↓
Renn-Strecken (erstellen + Leaderboard pro Strecke)
  ↓
Ride-Bonus (Foto-Beweis Start/Ende)
  ↓
Prestige-Titel
```

Jetzt gibt es direkten Wettkampf. Nicht nur passives Übernehmen.

### Schicht 5: Sozial (Monat 3–6)

```
Clan-Auto-Erkennung (Proximity + Zeitpattern)
  ↓
Clan-Chat
  ↓
Bezirk vs. Bezirk Scoring
  ↓
Bounty-System
  ↓
Alias-System
  ↓
Mehrstufige Schnitzeljagden
```

### Schicht 6: Tiefe (Monat 7–12)

```
Traps
  ↓
Sabotage
  ↓
Erweiterte Quest-Typen (LISTEN, CREATE, REACH)
  ↓
Cross-Territory Quests
```

### Schicht 7: Events (Monat 12+)

```
King of the Hill (tägliches Event)
  ↓
Loot Drops (zufällige Spawns)
  ↓
Blitz-Claims (Mikro-Events)
  ↓
Mystery Zones
  ↓
Eclipse (monatlicher Mega-Event)
  ↓
Wave Attacks (Clan-koordiniert)
```

---

## 9. KPI-Zuordnung (Was messen wir wo?)

| Mechanik | Primäre KPI | Sekundäre KPI |
|----------|------------|---------------|
| Territory | Aktive Claims/Spieler, m² gesamt, Übernahme-Rate | Karten-Abdeckung pro Stadt |
| Graffiti | Graffitis/Tag, Like-Rate, Permanent-Rate | Verfall-Quote, Report-Rate |
| Quests | Quests erstellt/Woche, Completion-Rate, Avg Rating | Skip-Rate pro Step, Creator-Retention |
| Duells | Duelle/Tag, Accept-Rate, Rematch-Rate | Durchschnittliche Duell-Dauer |
| Rennen | Strecken erstellt, Rekord-Versuche/Strecke | Unique Runners pro Strecke |
| Clans | Clan-Größe, Clan-Aktivität, Bezirks-Events | Clan-Retention vs. Solo-Retention |
| Bounties | Bounties gesetzt/Tag, Einlöse-Rate | Durchschnittlicher Bounty-Wert |
| Alias | Alias-Nutzung (%), Enttarnungs-Rate | Alias-Retention vs. Haupt-Retention |
| Traps | Traps gesetzt, Trigger-Rate, Erfolgsrate | Trap-Typ-Verteilung |
| Events | Teilnahme-Rate, Session-Länge während Event | Retention-Lift nach Event |

### Gesundheits-Metriken (Alarm wenn schlecht)

| Metrik | Gesund | Warnung | Kritisch |
|--------|--------|---------|----------|
| DAU/MAU | >30% | 15–30% | <15% |
| Claims/Spieler/Tag | >0.5 | 0.2–0.5 | <0.2 |
| Graffiti Like-Rate | >20% | 10–20% | <10% |
| Quest Completion-Rate | >40% | 20–40% | <20% |
| Duell Accept-Rate | >50% | 30–50% | <30% |
| 7-Day Retention | >40% | 25–40% | <25% |
| 30-Day Retention | >20% | 10–20% | <10% |
| Report-Rate (Content) | <2% | 2–5% | >5% |
| Cheat-Detection-Rate | <1% | 1–3% | >3% |

---

## 10. Zusammenfassung: Die Maschinerie

Das gesamte System funktioniert wie ein Motor mit fünf Zylindern:

**Zylinder 1 — BEWEGUNG:** GPS → Route → Polygon → Claim. Der physische Antrieb.

**Zylinder 2 — BESITZ:** Claim → Gebiet → Rechte → Macht. Der emotionale Antrieb.

**Zylinder 3 — KREATIVITÄT:** Gebiet → Content → Entdeckung → Bewertung. Der soziale Antrieb.

**Zylinder 4 — KONFLIKT:** Übernahme → Verlust → Rache → Reconquest. Der kompetitive Antrieb.

**Zylinder 5 — GEMEINSCHAFT:** Clans → Koordination → Events → Identität. Der langfristige Antrieb.

Jeder Zylinder braucht die anderen. Bewegung ohne Besitz ist langweilig. Besitz ohne Content ist leer. Content ohne Konflikt ist passiv. Konflikt ohne Gemeinschaft ist einsam. Gemeinschaft ohne Bewegung existiert nicht.

**Die App stirbt wenn ein Zylinder ausfällt.** Deshalb muss jeder einzelne überwacht, getuned und gepflegt werden — nicht einmal, sondern permanent.

---

*Die Stadt wird nicht mehr nur gesehen — sie wird gespielt.*

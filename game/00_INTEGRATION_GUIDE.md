# 00 , Integration Guide: Design-Ideen in die bestehende App einweben

**Prinzip:** Enhancement-Layer, kein Rebuild. Die App hat bereits ~6 Tabs und ~40 Screens (siehe `ANALYSE.md`). Wir fassen die Navigation **nicht** an, solange das Team das nicht ausdrücklich will. Stattdessen legen wir vier Schichten über die bestehenden Screens.

---

## Die vier Schichten (in Reihenfolge des Aufwand/Wirkung-Verhältnisses)

### Schicht 1 , Sound & Haptik (größter Effekt, kleinstes Risiko)
Eine zentrale Helper-Datei (`feedback.ts`), die an bestehenden Aktionen aufgerufen wird. **Verändert keine Logik**, hängt sich nur an Events. Details: `03_SOUND_HAPTIC_KIT.md`.

**Andockpunkte im bestehenden Code** (Beispiele , an die realen Handler anpassen):
- Territorium beansprucht → `feedback.victory()`
- Gebäude gebaut → `feedback.build()`
- Kampf aufgelöst → `feedback.clash()` dann `victory()`/`defeat()`
- Tab-Wechsel, Button-Tap → `feedback.tick()`
- Bottom-Sheet/Modal öffnen → `feedback.soft()`
- Push/Benachrichtigung → `feedback.notify()`

### Schicht 2 , Motion / Hypermotion
Mikro-Animationen auf bestehende Komponenten legen (Press-Spring auf Buttons, Einflug von Screens/Sheets, Celebration beim Erfolg). Mit **Reanimated/Moti**, das in Expo-Apps meist schon vorhanden ist. Details: `02_MOTION_LIBRARY.md`.

**Reihenfolge:** erst die **Erfolgsmomente** (Erobern, Bauen, Kampf-Sieg) , das sind die emotionalen Höhepunkte. Dann globaler Button-Press-Spring. Zuletzt Screen-/Sheet-Transitions.

### Schicht 3 , Design-Tokens / optische Angleichung
Farben, Typo, Radien, Schatten aus `01_DESIGN_TOKENS.md` als zentrale Theme-Konstanten anlegen und bestehende Screens schrittweise darauf umstellen. **Nicht alles auf einmal** , Screen für Screen, beginnend mit den meistgenutzten (Karte, Imperium/Commander).

### Schicht 4 , Neue UX-Bausteine
Die wiederverwendbaren Komponenten aus `04_COMPONENT_SPECS.md`, vor allem das **Coachmark-/Lehr-System** (die „Erklärschritte beim ersten Öffnen"). Das ist die größte echte UX-Verbesserung und wird einmal gebaut, dann überall getriggert.

---

## Das Lehr-System (Kern-Wunsch des Auftraggebers)

Wiederverwendbare Komponente, die beim **ersten** Kontakt mit einem Feature 1-3 Erklärschritte zeigt und sich dann ein `seen`-Flag merkt (persistent, z. B. AsyncStorage). Nie zweimal.

**Andocken an bestehende Screens:** beim Mount eines Screens/Features prüfen `if (!seen['karte']) showTeach('karte')`. Inhalte (Texte) liegen zentral, sodass das Team sie pflegen kann. Spezifikation + Beispieltexte: `04_COMPONENT_SPECS.md` → „Coachmark".

**Trigger-Punkte (Vorschlag):** erstes Öffnen von Karte, erste Eroberung, erstes Gebäude, erstes Radar/Aufklärung, erster Kampf, erste Wirtschaft/Ressource, erste Quest, erstes Echo, Clan-Beitritt, Streifzug.

---

## Screen-für-Screen-Map (bestehend → was wir hinzufügen)

| Bestehender Screen | Hinzufügen (nicht ersetzen) |
|---|---|
| **MapScreen** | Erober-Celebration (Partikel+Ring+Badge+Shake), HUD-Politur, Layer-Umschalter-Feel, Tap-Sounds, Coachmark beim ersten Öffnen |
| **Territory/Claim** | `victory`-Sound + Erfolgs-Haptik + Count-up auf Ressourcen |
| **Commander / Bau-Screens** | Bau-Pop-in (`mrConstruct`) + `build`-Sound + Toast, Press-Springs |
| **Battle / DicePouch / BattleReplay** | Würfel mit Pips + Roll-Shake + `clash`/`victory`/`defeat`, Truppen-Slider-Feel, Ergebnis-Einflug |
| **Quests / Echo / Challenge / Create** | Sheet-Einflug + `soft`-Sound, Coachmark „Fülle die Welt" |
| **Clan / Leaderboard / Profile** | optische Token-Angleichung, dezente Einflüge, Tap-Sounds |
| **(global) alle Buttons** | Press-Spring + `tick` |
| **(global) Settings** | Zwei Schalter „Sound" / „Haptik" (getrennt), + „Reduzierte Bewegung" respektieren |

---

## Was wir bewusst NICHT tun (ohne ausdrückliche Freigabe)
- Die Navigation von 6 auf 4 Tabs umbauen (steht als **Empfehlung** in `ANALYSE.md`, ist aber ein großer Eingriff , separat entscheiden).
- Bestehende Datenmodelle/Engines anfassen.
- Streifzug als fertiges Feature ausliefern.
- Alles gleichzeitig umfärben , lieber inkrementell pro Screen.

---

## Definition of Done je Schicht
- **Sound/Haptik:** zentrale Helper-Datei vorhanden, an allen Kern-Aktionen verdrahtet, getrennt schaltbar, respektiert Stummschaltung.
- **Motion:** Erfolgsmomente + Button-Springs + Transitions, respektiert Reduced Motion.
- **Tokens:** zentrales Theme, Kern-Screens umgestellt.
- **UX:** Coachmark-System gebaut + an ≥5 Features getriggert, `seen`-Flags persistent.

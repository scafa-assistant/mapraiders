# 04 , Component Specs (wiederverwendbare Bausteine)

Die neuen UX-Bausteine aus dem Prototyp als Spezifikation , gedacht zum Nachbauen als React-Native-Komponenten und Einhängen in bestehende Screens. Maße/Farben siehe `01_DESIGN_TOKENS.md`.

---

## 1. Coachmark / Lehr-System ⭐ (wichtigster Baustein)

**Zweck:** beim ersten Kontakt mit einem Feature 1-3 Erklärschritte zeigen, dann nie wieder.

**Aufbau:**
- Abdunkelnder Vollbild-Scrim (`rgba(8,11,22,.74)`, Fade-in .25s), Tap darauf = überspringen.
- Karte am unteren Rand (weiß, radius 22, Schatten `modal`), fliegt hoch (`mrUp`).
- Kopf: Icon-Chip (42×42, Systemfarbe-Tint) + Kicker (uppercase micro) + „Schritt X/Y" + Titel (17.5px/800).
- Body-Text (14.5px, `textMuted`).
- Fuß: Fortschritts-Dots links · „Skip" (nur wenn >1 Schritt und nicht letzter) · Primär-Button „Weiter"/„Verstanden".

**API (Vorschlag):**
```ts
showTeach(id: string)   // zeigt nur, wenn !seen[id]
// Inhalte zentral:
TEACH = {
  karte:   { kicker:'Karte', steps:[ {t:'Das ist dein Spielbrett', b:'...'}, ... ] },
  claim:   { ... }, build:{...}, imperium:{...}, encounter:{...}, ...
}
```
`seen[id]` persistent (AsyncStorage). Trigger beim Screen-/Feature-Mount.

**Beispieltexte (aus dem Prototyp, übernehmbar):**
- Karte · „Das ist dein Spielbrett" → „Die echte Karte um dich herum. Geh raus, bewege dich, und das Land unter deinen Füßen wird zu deinem Revier. Blaue Flächen gehören dir."
- Karte · „Erobere dein erstes Gebiet" → „Tippe unten auf ‚Gebiet erobern', sobald du in einem freien Feld stehst."
- Karte · „Wechsle die Ebenen" → „Territorien, Aufklärung (Nebel des Krieges) oder Kampf. Erkunde, bevor du angreifst."
- Erobert · „Gebiet gesichert!" → „Du hast 0,4 km² beansprucht. Ungepflegtes Land verfällt täglich , lauf regelmäßig deine Grenzen ab."
- Imperium (3 Schritte): „Dein Hauptquartier" / „Bauen kostet Ressourcen" / „Truppen & Aufklärung".
- Bauen · „Wähle ein Gebäude" → Funktion je Gebäude erklärt.
(Volltexte im `TEACH`-Objekt des Prototyps.)

---

## 2. Bottom-Sheet
Griff-Pille (42×5) oben sticky · Inhalt scrollbar (max-height ~86%) · radius oben 26 · Einflug `mrSheet` + Scrim. Öffnen spielt `feedback.soft()`. Verwendet für: Bauen, Truppen, Aufklärung, Einstellungen.

---

## 3. HUD (Karte, oben)
Glas-Leiste (weiß 92% + blur) · Avatar-Chip (Initialen, Systemfarbe) · Name + Rang/Level · rechts Ressourcen-Pills (Icon + `Space Grotesk`-Zahl). Beim Ressourcen-Gewinn Count-up-Puls (`mrCount`).

---

## 4. Celebration-Overlay
Einmal-Effekt bei Erfolg: 26 Partikel + 2 Ringe + Badge + Screen-Shake (Details `02_MOTION_LIBRARY.md` §4). Als imperatives `celebrate(message)` kapseln, das von Erobern/Kampf-Sieg/Schatz aufgerufen wird. Spielt `feedback.victory()`.

---

## 5. Würfel (Kampf)
48×48 weiße Karte, radius 13 · **Pips als 3×3-Grid** (nicht Zahl) · zittert beim Rollen (`mrShake`), Werte wechseln je Tick mit `tick`-Sound · fällt auf Endwert. Pip-Map in `02_MOTION_LIBRARY.md` §7.

## 6. Truppen-Slider (vor Kampf)
12 Einheiten auf Angriff/Verteidigung verteilen. Mehr Angriff = höhere Siegchance. Pro Schritt `feedback.tick()` + Light-Haptik. Zwei große Zahlen (rot/blau) + Slider mit Schwert-/Schild-Icons.

## 7. Push-Encounter-Karte (Streifzug, Beta)
Banner oben (weiß 98% + blur), fliegt ein (`mrUp`), Live-Punkt blinkt (`mrDot`) · Icon-Chip + „Streifzug · jetzt" + Titel + Body · Buttons „Ignorieren" / „[Aktion]". 3 Typen: Schatz (→ Ressourcen + `victory`), Söldner (→ +1 Truppe + Bestätigung), Patrouille (→ startet Kampf). Erscheint mit `feedback.notify()`.

---

## 8. Primär-Button
Höhe ~54, radius 15, Systemfarbe, farbiger Glow-Schatten, weißer Text 15.5/700 · Press-Spring (`scale .96`) · bei Status-Wechsel (z. B. erobert) Farb-/Label-Wechsel mit Transition. Globaler `<PressableSpring>`-Wrapper empfohlen.

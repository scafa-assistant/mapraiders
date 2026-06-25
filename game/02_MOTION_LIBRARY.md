# 02 , Motion Library (Hypermotion)

Jede Animation aus dem Prototyp als **Web-Keyframe** (Referenz) **+ React-Native-Übersetzung** (Reanimated/Moti). Timings und Werte sind 1:1 aus dem Prototyp.

> Stack-Annahme: Expo-App. Motion → `react-native-reanimated` (oder `moti` als High-Level-Wrapper). Wo „Spring" steht: `withSpring`. Wo „Timing/Easing" steht: `withTiming` + `Easing`.

---

## Signature-Easing
Der Prototyp nutzt durchgehend `cubic-bezier(.16,1,.3,1)` (sanftes Aus-Gleiten) für Einflüge und `cubic-bezier(.2,.7,.3,1.4)` (Overshoot) für Press/Pop.
- Reanimated Einflug: `withTiming(v,{duration:Dms,easing:Easing.bezier(.16,1,.3,1)})`
- Reanimated Pop/Press: `withSpring(v,{damping:12,stiffness:380,mass:.6})`

---

## Katalog

### 1. Button-Press (global, überall)
Web: `transition:transform .12s cubic-bezier(.2,.7,.3,1.4); active → scale(.93–.97)`
RN: `onPressIn → scale=withSpring(.95)`, `onPressOut → scale=withSpring(1)`. In eine `<Pressable>`-Wrapper-Komponente kapseln und global verwenden.

### 2. Screen-/Element-Einflug `mrUp`
Web: `from{opacity:0;translateY(14px)} to{opacity:1;translateY(0)}` (.32-.5s)
RN: `entering={FadeInDown.duration(360).easing(...)}` (Reanimated layout-animation) oder Moti `from={{opacity:0,translateY:14}} animate={{opacity:1,translateY:0}}`.

### 3. Bottom-Sheet `mrSheet` + Scrim `mrScrim`
Web: Sheet `translateY(100%)→0` (.34s bezier(.16,1,.3,1)), Scrim `opacity 0→1` (.25s).
RN: vorhandene Sheet-Lib (z. B. `@gorhom/bottom-sheet`) nutzen; sonst `translateY` via `withTiming`. Scrim = `Animated.View` opacity.

### 4. Erfolg-Celebration (Erobern / Kampf-Sieg / Schatz) , das Highlight
Bausteine, gleichzeitig:
- **Partikel** `mrParticle`: 26 Stück, radial verteilt, in Systemfarben, fliegen 70-190px nach außen, drehen, schrumpfen, faden (.7-1.2s). RN: N `Animated.View`-Punkte, je `translateX/Y`+`rotate`+`opacity` via `withTiming`. Beim Auslösen einmalig erzeugen.
- **Erfolgs-Ringe** `mrRingPop`: 2 Ringe `scale(.2→3.2)`, opacity `.9→0` (.7/.9s, leicht versetzt).
- **Badge** `mrBadge`: „+0,4 km² erobert!" skaliert rein, hält, fadet (1.4s).
- **Screen-Shake** `mrShake`: ~.55s, Ausschlag ±5px (siehe unten).
- **Count-up** `mrCount`: Zielzahl zählt hoch, Skalen-Puls auf 1.35 + kurz grün.

### 5. Screen-Shake `mrShake`
Web: translate-Sequenz ±5px über .55s.
RN: `translateX/Y` Sequenz `withSequence(withTiming(-5,{duration:50})…)` auf dem Screen-Container. Sparsam, nur bei Treffer/Sieg.

### 6. Bauen `mrConstruct` + Dust `mrDust` + Toast `mrToastIn`
- Gebäude poppt ins Raster: `scale(.3→1.14→1)`, dabei kurzer grüner Ring (`box-shadow 0 0 0 7px rgba(27,158,90,.4)→0`). RN: `withSequence(withSpring)` auf scale + separater Ring-View.
- Toast „[Gebäude] errichtet!" fliegt von unten ein, hält, fadet (`mrToastIn`).

### 7. Würfel `mrShake` (rollend) + Pips
- Beim Rollen zittern alle vier Würfel (`mrShake` loop ~9 Ticks à 115ms), Werte wechseln je Tick (mit `tick`-Sound).
- Dann fallen sie auf Endwert. **Augen als Pip-Raster** (3×3 Grid, Punkte je nach Wert), nicht als Zahl.
- Pip-Map: `1:[4] 2:[0,8] 3:[0,4,8] 4:[0,2,6,8] 5:[0,2,4,6,8] 6:[0,2,3,5,6,8]` (Index im 3×3-Grid).

### 8. „VS" Pop `mrVS` / Ergebnis `mrResultIn`
- VS: `scale(0→1.25→1)` mit Rotation, Overshoot.
- Ergebnis „Sieg!/Niederlage": `scale(.5→1.12→1)`, bei Sieg Partikel-Burst.

### 9. Loops (dezent, Dauerbetrieb)
- `mrPing` (Marker-Puls, 2-2.6s), `mrFlag` (Flagge wiegt ±5°, 3.4s), `mrFloat` (schweben ±6px), `mrDot` (Live-Punkt blinkt), `mrPulse`.
RN: `withRepeat(withTiming(...), -1, true)`.

---

## Reduced Motion (Pflicht)
Web: `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`.
RN: `AccessibilityInfo.isReduceMotionEnabled()` abfragen + Listener; wenn aktiv, alle Entrances/Loops/Shakes überspringen (Endzustand direkt setzen). An denselben Schalter wie „Reduzierte Bewegung" in den Settings koppeln.

## Vollständige Keyframe-Quelle
Alle exakten `@keyframes` stehen im `<style>`-Block von `MapRaiders Prototyp.dc.html` (Zeilen ~17-44). Bei Unsicherheit dort die genauen %-Stops nachschlagen.

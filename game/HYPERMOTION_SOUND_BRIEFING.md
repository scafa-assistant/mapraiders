# MapRaiders Prototyp , Hypermotion, Sound & Haptik , Briefing

**Datei:** `MapRaiders Prototyp.dc.html`
**Stand:** 2026-06-24
**Zweck:** Übersicht, wo überall Bewegung (Hypermotion), Soundeffekte und Haptik eingebaut sind , als Referenz für den Code-Agenten beim Übertrag in die echte App (React Native).

> Alle Sounds sind **synthetisiert per Web Audio API** (Oszillatoren), **keine externen Audiodateien**. In der echten App durch echte Sound-Assets (z. B. via `expo-av` / `react-native-sound`) ersetzbar; die Trigger-Punkte bleiben dieselben. Haptik nutzt `navigator.vibrate` (im Web), in React Native → `expo-haptics` / `Vibration`.

---

## 1. Globale Regeln

- **`prefers-reduced-motion`**: alle Animationen werden abgeschaltet (`@media (prefers-reduced-motion:reduce){*{animation:none!important}}`).
- **Audio-Start**: AudioContext startet erst beim ersten Tippen (Browser-Autoplay-Policy). Nie aufdringlich.
- **Einstellungen**: **Sound und Haptik sind getrennt** an/aus schaltbar , Zahnrad unten links → Einstellungs-Sheet mit zwei Schaltern (`soundOn`, `hapticOn`). Sound aus lässt Haptik laufen und umgekehrt.

---

## 2. Sound-Effekte (synthetisierte „sfx"-Bank)

| Name | Klang | Wird ausgelöst bei |
|---|---|---|
| `victory` | Trompeten-Fanfare (Sägezahn-Triade, 5 Töne) | **Errungenschaft**: Gebiet erobert, Schlacht gewonnen, Schatz im Streifzug |
| `build` | Tiefer „Thunk" + kurzer Hochton | Gebäude platziert |
| `clash` | Aufprall (tiefer Square + Klick) | Schlacht-Auflösung (Würfel fallen) |
| `defeat` | Absteigende Tonfolge | Schlacht verloren |
| `notify` | Sanfter Zwei-Ton-Chime | Streifzug Push-Encounter erscheint |
| `soft` | Zwei weiche Töne | Sheet/Menü öffnen, Streifzug starten |
| `tick` | Kurzer Klick | Taps: Tab-Wechsel, Coachmark „Weiter", Onboarding, **Würfel-Rattern**, Slider-Schritte |

**Trigger-Punkte im Code (Methoden):**
- `claim()` → `victory` + Erfolgs-Haptik
- `buildOne()` → `build` + Haptik
- `resolveBattle()` → `clash`, dann `victory`/`defeat`
- `spawnPush()` → `notify`; `streifAccept()` → `victory`/`claim`
- `openSheet()` → `soft`; `go()`, `onbNext()`, `teachNext()`, `setAtk()` → `tick`

---

## 3. Haptik (Vibration)

| Muster | Bedeutung | Auslöser |
|---|---|---|
| `[0,35,45,90]` | Erfolg (Doppel-Puls) | Erobern, Schatz, Schlacht gewonnen |
| `28`–`30` | Bestätigung | Bauen, Söldner rekrutieren |
| `[0,18,50,18]` | Benachrichtigung | Streifzug-Push |
| `[0,130]` | Fehlschlag | Schlacht verloren |
| `6`–`12` | leichter Tap | Tabs, Coachmark, Slider, Menü |

Nur auf Geräten mit Vibrationsmotor spürbar (am Desktop stumm, ohne Fehler).

---

## 4. Hypermotion (Bewegung / „Juice")

### Keyframes (im `<helmet><style>`)
`mrPulse, mrPing, mrFloat, mrFlag, mrUp, mrSheet, mrScrim, mrDot, mrShake, mrParticle, mrRingPop, mrPop, mrBadge, mrPlant, mrCount, mrSpin, mrConstruct, mrDust, mrToastIn, mrVS, mrResultIn`

### Wo welche Bewegung sitzt

**Onboarding**
- Jeder Schritt fliegt ein (`mrUp`), Fortschritts-Dots animiert, Button mit Press-Spring (`style-active` scale).

**Coachmarks (Erklärschritte)**
- Abdunkelnder Hintergrund (`mrScrim`), Karte gleitet hoch (`mrUp`), Schritt-für-Schritt mit Punktanzeige.

**KARTE**
- **Erobern (Highlight):** 26 Partikel in Systemfarben (`mrParticle`), zwei Erfolgs-Ringe (`mrRingPop`), einfliegendes „+X"-Badge (`mrBadge`), **Screen-Shake** (`mrShake`), Energie-Zähler-Puls (`mrCount`).
- Begegnungs-/Kampf-Marker pulsieren (`mrPing`), eigene Flagge weht (`mrFlag`).
- Primär-Button + Streifzug-Button mit Press-Spring.

**Tab-Wechsel**
- Screen blendet/gleitet ein (`mrUp`).

**IMPERIUM**
- **Bauen:** neues Gebäude poppt mit Feder-Bounce ins Raster + grüner Blitz (`mrConstruct`), „[Gebäude] errichtet!"-Toast fliegt ein (`mrToastIn`).
- Bauplätze, Bau-Menü-Einträge, Aktions-Buttons: Press-Spring.

**KAMPF (Schlacht-Arena)**
- Vier **Würfel mit echten Augen-Pips** (per `sc-for`-Raster), zittern beim Rollen (`mrShake`), „VS" poppt rein (`mrVS`).
- Auflösung: Clash-Shake, Ergebnis skaliert ein (`mrResultIn`); bei Sieg Partikel-Burst.
- **Truppen-Slider**: verteilt 12 Einheiten auf Angriff/Verteidigung (mehr Angriff = höhere Siegchance), mit Tick-Sound + Mikro-Haptik pro Schritt.

**STREIFZUG (Beta-Teaser, voll spielbar im Prototyp)**
- „Streifzug starten" → nach ~1,4 s erscheint ein **Push-Encounter-Karte** (gleitet ein `mrUp`, Live-Punkt pulsiert `mrDot`).
- 3 Encounter-Typen: **Schatz** (Einsammeln → Energie + Sieges-Effekt), **Söldner** (Rekrutieren → +1 Truppe), **Patrouille** (Kämpfen → startet Schlacht). „Ignorieren" verwirft.

**Buttons global**
- Druck staucht (Spring, `style-active: scale(.93–.97)`).

---

## 5. Übertrag in die echte App (Hinweise)
- **Sound**: Trigger-Punkte (Tabelle §2) 1:1 übernehmen, synthetisierte Töne durch echte Assets ersetzen. Lautstärke/Mix global drosselbar (Master-Gain liegt bei 0.5).
- **Haptik**: `navigator.vibrate` → `expo-haptics` (`ImpactFeedbackStyle`, `NotificationFeedbackType.Success/Error`).
- **Motion**: CSS-Keyframes → Reanimated/Moti; Spring-Werte und Timings stehen in den `@keyframes` und `transition`-Definitionen.
- **Reduced Motion & FX-Schalter**: beide Einstellungen müssen in der App erhalten bleiben (Barrierefreiheit + Nutzerwahl).
- **Streifzug**: bleibt **„In Entwicklung"** , der Prototyp zeigt nur, wie sich der Loop anfühlen soll.

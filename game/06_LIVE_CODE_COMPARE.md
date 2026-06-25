# 06 , Live-Code-Vergleich (Stand vs. Prototyp)

**Verglichen am:** 2026-06-25 gegen `scafa-assistant/mapraiders@master`, `mobile/src`.
**Zweck:** Kein Rebuild , dieser Abgleich zeigt, was **schon umgesetzt** ist, was **gebaut, aber noch nicht verdrahtet** ist, und wo echte **Lücken** sind. Als Inspiration/Stake für den nächsten Schritt.

> Erfreulich: Der Code-Agent hat das Hypermotion/Sound-Briefing bereits umgesetzt , es gibt `services/fx.ts` und einen `components/fx/`-Ordner. Vieles ist **schon da**. Der Rest ist „anschließen", nicht „neu bauen".

---

## Ampel-Übersicht

| Bereich | Status | Kurz |
|---|---|---|
| Design-Tokens (Farben) | 🟢 deckungsgleich | `utils/constants.ts` = Prototyp-Palette |
| Sound/Haptik-Engine | 🟢 fertig | `services/fx.ts`, settings-gated, getrennt schaltbar |
| Reduced-Motion | 🟢 fertig | `components/fx/useReducedMotion.ts` |
| Press-Spring (Buttons) | 🟡 teilweise | `PressableScale` gebaut, nur punktuell verdrahtet |
| Erober-Celebration | 🟢 fertig | `ClaimResult.tsx`: Partikel+Shake+Count-up+`fx.victory()` |
| Würfel mit Pips | 🟠 gebaut, NICHT genutzt | `PipDie.tsx` existiert, wird nirgends gerendert |
| Bau-Toast | 🟠 gebaut, NICHT genutzt | `BuildToast.tsx` existiert, nicht eingehängt |
| Bau-Pop-in | 🟠 gebaut, NICHT genutzt | `PopIn.tsx` existiert, nicht eingehängt |
| Streifzug-Karte | 🟢 fertig | `StreifzugEncounterCard.tsx` mit voller Juice |
| Ressourcen-HUD Count-up | 🟡 statisch | `ResourceBar.tsx` zeigt Werte ohne Zähl-Puls |
| **Coachmark / Lehr-System** | 🔴 **fehlt** | kein Coachmark/Teach , der Kern-Wunsch ist offen |
| Typo (Outfit/Space Grotesk) | 🟡 prüfen | Tokens da, eigene Fonts evtl. nicht geladen |

---

## 🟢 Schon umgesetzt (nur bestätigen, nicht anfassen)

### Farb-Tokens , deckungsgleich
`utils/constants.ts` → `LIGHT_THEME` nutzt exakt die Prototyp-Palette: `primary #1558F0`, `danger #D7263D`, `secondary/sky #4B7BFF`, `warning #F5A623`, `bg #F6F4F1`, `text #141210`. Grün `#1B9E5A` lebt in `CLASS_COLORS.cyclist` + ResourceBar. **Nichts zu tun.**
Mini-Abweichungen (optional angleichen): `textSecondary #7A7470` (Proto `#756F6A`), `border #C0BAB4` (Proto-Hairline `rgba(20,18,16,.07)`), `RADIUS.sm 6` (Proto 8).

### Sound + Haptik , `services/fx.ts`
Voll da und **näher an „richtig" als der Prototyp**: echte `.wav`-Assets statt Web-Audio, `expo-av` + `expo-haptics`, iOS-Notification-Generator + Android-Vibrationsmuster, settings-gated (`soundEffects`/`hapticFeedback` getrennt), Fehler gekapselt. Trigger-Methoden `victory/buildFx/clash/defeat/notifyFx/soft/tick/confirm` , identisch zur Briefing-Tabelle. **Fertig.**

### Erober-Celebration , `components/ClaimResult.tsx`
Enthält `fx.victory()`, `ParticleBurst`, Screen-**Shake** (`shakeAnim` ±7px), Stern-Bursts und **XP-Count-up** , genau der Prototyp-Höhepunkt. **Fertig.**

### Streifzug , `components/StreifzugEncounterCard.tsx`
Slide-in (`mrUp`), pulsierender Live-Dot, `fx.notifyFx()` beim Erscheinen, typ-abhängiges Feedback (loot→`victory`+Burst, recruit→`confirm`, threat→`soft`), Beta-Badge, routet in den bestehenden HackingScreen. **Fertig + sauber als „Beta" markiert.**

### Reduced-Motion , `components/fx/useReducedMotion.ts`
OS-Setting + Live-Listener, überall berücksichtigt. **Fertig.**

---

## 🟠 Gebaut, aber noch nicht verdrahtet (kleinste Aufgaben, großer Effekt)

Diese Komponenten **existieren bereits** und müssen nur an die bestehenden Screens gehängt werden , kein Neubau.

### 1. `PipDie.tsx` (Würfel mit echten Augen) , nirgends gerendert
Voll funktionsfähig (3×3-Pip-Raster, Pop-in, Roll-Shake, `fx.tick()`-Rattern). Aber kein Screen importiert ihn.
→ **Aktion:** In `screens/commander/DicePouchScreen.tsx` und im Kampf/Battle-Flow (`BattleReplayScreen.tsx` bzw. wo Würfel/Werte gezeigt werden) die alte Zahlen-/Würfel-Darstellung durch `<PipDie value=… color=… animKey=… rolling=… />` ersetzen.

### 2. `BuildToast.tsx` (Bau-Bestätigung) , nicht eingehängt
Fertiger Toast („[Gebäude] errichtet!", fliegt ein, hält, fadet).
→ **Aktion:** In `CommanderMapScreen.tsx` nach erfolgreichem Bau `setBuildMsg(name); setBuildKey(Date.now())` setzen und `<BuildToast message= fireKey= onDone= />` rendern. `fx.buildFx()` parallel.

### 3. `PopIn.tsx` (Gebäude-Pop-in) , nicht eingehängt
Spring-Einflug für ein frisch platziertes Gebäude.
→ **Aktion:** In `CommanderMapScreen.tsx` das neu gebaute Gebäude-Element in `<PopIn animate>` wrappen.

### 4. `PressableScale.tsx` , nur teilweise ausgerollt
Wird in `DicePouchScreen` + `StreifzugEncounterCard` genutzt, aber die meisten Buttons (Map-Primäraktion, Sheets, Profil/Clan/Quests) sind noch normale `TouchableOpacity`.
→ **Aktion:** Schrittweise zentrale CTAs auf `PressableScale` umstellen (Press-Spring + `tick`). Beginnen mit Map-Primäraktion und Bottom-Sheet-Buttons.

---

## 🟡 Vorhanden, aber abweichend (Politur)

### ResourceBar , kein Count-up
`components/ResourceBar.tsx` zeigt Werte statisch (`formatCompact`) und nutzt **Emoji-Icons** (⚡⚙👁). Prototyp: SVG-Icons + Zähl-Puls (`mrCount`) beim Ressourcen-Gewinn.
→ **Aktion (optional):** beim Wert-Anstieg einen kurzen Scale-Puls (1.0→1.35→1.0, kurz grün) auf die geänderte Zahl legen; Emojis ggf. durch Ionicons/SVG ersetzen.

### Typografie , eigene Fonts prüfen
Tokens/Größen passen, aber es ist nicht ersichtlich, dass **Outfit** + **Space Grotesk** geladen sind. Im Prototyp tragen Zahlen (Ressourcen, Würfel, Stats) bewusst `Space Grotesk`.
→ **Aktion (optional):** Fonts via `expo-font` laden; Zahlen-Labels auf Space Grotesk setzen. Rein optisch, kein Muss.

---

## 🔴 Echte Lücke , das Lehr-/Coachmark-System (Kern-Wunsch)

**Im Code nicht vorhanden** (keine Treffer für Coachmark/Teach/Tutorial). Es gibt `screens/onboarding/OnboardingScreen.tsx` (Erst-Intro) und `components/PvEIntroCards.tsx` (ein punktuelles Intro für PvE) , aber **kein generisches „Erklär mir dieses Feature beim ersten Öffnen"-System**, das sich ein `seen`-Flag merkt und über die ganze App wiederverwendet wird. Genau das war der ausdrückliche Wunsch.

→ **Aktion (Neubau, einmalig):** Komponente nach `04_COMPONENT_SPECS.md` §1 bauen:
- `components/fx/Coachmark.tsx` (Scrim + Bottom-Karte, 1-3 Schritte, Dots, Skip/Weiter, `fx.tick()`).
- Zentrale Inhalte `i18n/de/teach.ts` (Texte je Feature , Beispieltexte liegen im Prototyp-`TEACH`-Objekt und in `04_COMPONENT_SPECS.md`).
- Persistenz: `seen`-Flags in den bestehenden `settingsStore`/AsyncStorage.
- Trigger beim Mount der jeweiligen Screens: Map, erste Eroberung, Commander/Bau, Radar/Aufklärung, Kampf, Quests, Echo, Clan, Streifzug.
- `PvEIntroCards` kann als Vorlage/Spezialfall dienen oder später darin aufgehen.

Das ist die **größte echte UX-Verbesserung**, die noch offen ist , alles andere ist Anschließen oder Politur.

---

## Priorisierte To-do-Liste (für den Code-Agenten)

1. **Coachmark-System bauen** + an ≥5 Screens triggern (🔴 Kern-Wunsch).
2. **`PipDie` verdrahten** in DicePouch + Battle (🟠, 1 Stelle je Screen).
3. **`BuildToast` + `PopIn` + `fx.buildFx()`** in den Bau-Flow von `CommanderMapScreen` (🟠).
4. **`PressableScale`** schrittweise auf zentrale CTAs ausrollen (🟡).
5. **ResourceBar Count-up** + Icon-Feinschliff (🟡, optional).
6. **Outfit/Space Grotesk** laden, Zahlen auf Space Grotesk (🟡, optional).

> Faustregel bleibt: bestehende Logik/Engines/Datenflüsse nicht anfassen , nur die Feel-Schicht andocken. Streifzug bleibt „Beta".

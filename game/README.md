# MapRaiders , Design-Integration-Paket

**Für:** den MapRaiders Code-Agenten (bestehende React-Native/Expo-App)
**Von:** Design
**Stand:** 2026-06-25

---

## Worum es geht (in einem Satz)

Die App **existiert bereits** und funktioniert. Dieses Paket bringt **nur die Design-, Motion-, Sound- und UX-Ideen** aus dem Prototyp in den bestehenden App-Code ein. **Kein Rebuild, kein neues Framework, keine neue Navigation erzwingen.** Wir veredeln das, was schon da ist.

> Goldene Regel: Wenn eine Idee hier mit dem bestehenden Code kollidiert, **gewinnt der bestehende Code**. Wir legen eine Schicht drüber (Motion, Sound, Haptik, Politur), wir reißen nichts ein.

---

## Was im Paket liegt

| Datei | Inhalt | Für wen |
|---|---|---|
| **`README.md`** | Dieses Dokument , Überblick + Reihenfolge | zuerst lesen |
| **`00_INTEGRATION_GUIDE.md`** | Die Strategie: was wo eingebaut wird, Screen für Screen, Prioritäten | Entscheider + Agent |
| **`01_DESIGN_TOKENS.md`** | Exakte Farben, Schriften, Abstände, Radien, Schatten | Agent |
| **`02_MOTION_LIBRARY.md`** | Jede Animation als Web-Keyframe **+ React-Native-Reanimated-Übersetzung** | Agent |
| **`03_SOUND_HAPTIC_KIT.md`** | Komplette Sound-Bank (exakte Frequenzen) + Haptik, mit expo-Übersetzung + Trigger-Tabelle | Agent |
| **`04_COMPONENT_SPECS.md`** | Die wiederverwendbaren Bausteine (Coachmark, Bottom-Sheet, HUD, Celebration, Würfel, Push-Karte) | Agent |
| **`05_AGENT_PROMPTS.md`** | **Fertige Copy-Paste-Prompts** , Aufgabe für Aufgabe, die du dem Code-Agenten gibst | du |
| **`06_LIVE_CODE_COMPARE.md`** | ⭐ **Abgleich mit dem echten Live-Code** , was schon drin ist, was gebaut-aber-unverdrahtet, was fehlt | Entscheider + Agent |
| **`ANALYSE.md`** | Eliteanalyse aller Zyklen/Features (das „Warum") | Hintergrund |
| **`HYPERMOTION_SOUND_BRIEFING.md`** | Ursprüngliches Motion/Sound-Briefing (vom Agenten bereits umgesetzt) | Hintergrund |
| **`MapRaiders Prototyp.dc.html`** | Der lauffähige Prototyp , die visuelle Referenz | Agent (ansehen) |

> **Wichtig , lies `06_LIVE_CODE_COMPARE.md` zuerst.** Der Code-Agent hat das Motion/Sound-Briefing **bereits weitgehend umgesetzt** (`services/fx.ts`, `components/fx/*`). Das meiste ist „anschließen", nicht „neu bauen". Die einzige echte Lücke ist das **Coachmark-/Lehr-System**.

---

## Empfohlene Reihenfolge für den Code-Agenten

1. **`06_LIVE_CODE_COMPARE.md`** lesen , der Ist-Abgleich. Zeigt, dass vieles schon da ist und was wirklich offen ist.
2. **`00_INTEGRATION_GUIDE.md`** , das Prinzip „drüberlegen statt neu bauen".
3. Prototyp (`.dc.html`) im Browser ansehen , das Zielgefühl erleben.
4. **`05_AGENT_PROMPTS.md`** abarbeiten , die Prompts gibst **du** dem Agenten, einen nach dem anderen (Coachmark zuerst).
5. **`01_–04_`** als Nachschlagewerk (Tokens, Motion, Sound, Komponenten) beim Umsetzen.

---

## Drei Dinge, die immer gelten

1. **Reduced Motion + FX-Schalter respektieren.** Sound und Haptik sind getrennt abschaltbar (existiert im Prototyp). Reduced-Motion schaltet Animationen ab.
2. **Streifzug bleibt „In Entwicklung".** Der Prototyp zeigt nur das Zielgefühl.
3. **Zahlen im Prototyp sind Platzhalter.** Echte Werte kommen aus den bestehenden Stores/Engines der App.

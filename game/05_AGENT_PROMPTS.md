# 05 , Fertige Prompts für den Code-Agenten

Kopiere diese Prompts **einzeln** in deinen MapRaiders-Code-Agenten, in dieser Reihenfolge. Jeder ist eigenständig. Sie sind auf den **echten Live-Code** abgestimmt (siehe `06_LIVE_CODE_COMPARE.md`).

> Grundsatz, der in jedem Prompt steckt: **bestehende Logik, Engines und Datenflüsse nicht verändern , nur die Feel-/Design-Schicht andocken.** Reduced-Motion + getrennte Sound/Haptik-Settings respektieren. Streifzug bleibt „Beta".

---

## Prompt 1 , Coachmark-/Lehr-System (Priorität 1, echte Lücke)

```
Baue ein wiederverwendbares Coachmark-/Lehr-System für die MapRaiders-App (React Native/Expo). Es zeigt beim ERSTEN Öffnen eines Features 1-3 Erklärschritte und merkt sich danach ein „seen"-Flag (nie zweimal).

Bestehendes nutzen, nichts umbauen:
- Feedback über services/fx.ts (fx.tick() bei „Weiter").
- Reduced-Motion über components/fx/useReducedMotion.ts.
- Persistenz über den vorhandenen settingsStore bzw. AsyncStorage.

Liefere:
1. components/fx/Coachmark.tsx:
   - Vollflächiger Scrim (rgba(8,11,22,.74), Fade-in 250ms), Tap = überspringen.
   - Bottom-Karte (weiß, radius 22, Schatten), fliegt hoch (translateY 14→0 + fade, 320ms, Easing.out(cubic)).
   - Kopf: Icon-Chip (42×42, Systemfarbe-Tint) + Kicker (uppercase) + „Schritt X/Y" + Titel (17.5/800).
   - Body (14.5, textSecondary). Fuß: Fortschritts-Dots, „Skip" (nur wenn >1 Schritt & nicht letzter), Primär-Button „Weiter"/„Verstanden".
   - Reduced-Motion: kein Slide, nur Fade.
2. Ein Hook/Provider useTeach() mit showTeach(id) (zeigt nur wenn !seen[id]) und persistentem seen-State.
3. i18n/de/teach.ts mit den Texten je Feature. Übernimm die Beispieltexte aus game/04_COMPONENT_SPECS.md §1 (karte, claim, imperium, build, encounter ...).
4. Trigger beim Mount in: MapScreen (id 'karte'), nach erster Eroberung ('claim'), CommanderMapScreen ('imperium' + 'build'), Aufklärung/Radar ('recon'), Kampf ('battle'), QuestList ('quests'), Echo ('echo'), ClanScreen ('clan'), Streifzug ('streifzug').
Farben/Maße aus game/01_DESIGN_TOKENS.md. Respektiere reduce-motion und ändere keine Spiellogik.
```

---

## Prompt 2 , Würfel mit Augen-Pips verdrahten

```
Die Komponente components/fx/PipDie.tsx existiert bereits (Würfel mit echtem 3×3-Pip-Raster, Pop-in, Roll-Shake, fx.tick()-Rattern), wird aber nirgends gerendert. Verdrahte sie:

- In screens/commander/DicePouchScreen.tsx und im Kampf-/Würfel-Flow (BattleReplayScreen.tsx bzw. wo Würfelwerte angezeigt werden) die bestehende Zahlen-/Würfeldarstellung durch <PipDie value={…} color={…} animKey={…} rolling={…} /> ersetzen.
- color = Systemfarbe der Seite (Angreifer theme.primary #1558F0, Verteidiger theme.danger #D7263D).
- animKey bei jeder neuen Runde bumpen; rolling=true während des Wurfs.
Ändere NICHT die Kampf-/Würfel-Logik oder den Server-Contract , nur die Darstellung.
```

---

## Prompt 3 , Bau-Flow: Toast + Pop-in + Sound

```
components/fx/BuildToast.tsx und components/fx/PopIn.tsx existieren bereits, sind aber nicht eingehängt. Verdrahte sie im Bau-Flow von screens/commander/CommanderMapScreen.tsx:

- Nach erfolgreichem Gebäudebau: fx.buildFx() aufrufen.
- <BuildToast message={`${name} errichtet!`} fireKey={Date.now()} onDone={() => setBuildMsg(null)} /> rendern.
- Das frisch platzierte Gebäude-Element in <PopIn animate>…</PopIn> wrappen, damit es einfedert.
Keine Änderung an der Bau-/Ressourcen-Logik , nur die Erfolgs-Rückmeldung. Reduced-Motion wird von den Komponenten selbst berücksichtigt.
```

---

## Prompt 4 , PressableScale auf zentrale Buttons ausrollen

```
Rolle components/fx/PressableScale.tsx (Press-Spring + fx.tick()) auf die wichtigsten CTAs aus, die aktuell noch TouchableOpacity/Pressable sind. Beginne mit:
- der Primäraktion auf MapScreen,
- den Buttons in Bottom-Sheets/Modals (z. B. BuildingPickerSheet),
- den Haupt-CTAs in Quests, Clan und Profile.
Pro Button: TouchableOpacity → PressableScale, onPress beibehalten, feedback='tick' (oder 'soft' bei Sheet-Öffnern). Keine Layout-/Logikänderung. Nicht alles auf einmal , nur zentrale CTAs.
```

---

## Prompt 5 , ResourceBar Count-up + Icon-Feinschliff (optional)

```
In components/ResourceBar.tsx: wenn ein Ressourcenwert STEIGT, einen kurzen Zähl-/Scale-Puls auf die geänderte Zahl legen (scale 1→1.35→1 über ~600ms, kurz in #1B9E5A, dann zurück auf #141210). Vorherigen Wert je Resource in einem ref halten, um Anstiege zu erkennen. Reduced-Motion: kein Puls, Wert direkt setzen.
Optional: die Emoji-Icons (⚡⚙👁) durch Ionicons/SVG ersetzen, passend zu den Systemfarben. Keine Änderung an der Ressourcen-Logik.
```

---

## Prompt 6 , Fonts Outfit + Space Grotesk (optional)

```
Lade die Schriften Outfit (400-900) und Space Grotesk (500-700) via expo-font in der App. Setze Zahlen-/Stat-/Würfel-/Ressourcen-Labels auf Space Grotesk, restliche Typografie auf Outfit. Nur visuell, keine Layout-Brüche; Fallback auf System-Font, bis geladen.
```

---

## Reihenfolge & Hinweis
1 (Coachmark) ist der größte Mehrwert , zuerst. 2-4 sind „Anschließen" von bereits gebauten Teilen (schnell). 5-6 sind Politur. Nach jedem Prompt testen, dann den nächsten geben. Bei Konflikt mit bestehendem Code gewinnt der bestehende Code , im Zweifel zurückfragen.

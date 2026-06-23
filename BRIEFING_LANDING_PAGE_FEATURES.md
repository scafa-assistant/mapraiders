# BRIEFING: MapRaiders Landing Page , Feature-Breakdown

**Für:** Landing-Page-Agent
**Quelle:** Gegen aktuellen Build verifiziert (server/src/routes + services, Stand 2026-06-23)
**Sprache:** Deutsch. Design Weiß/Blau (Akzent #1558F0, Amber #F5A623), KEIN Lila. Keine Em-Dashes.
**Rechtsträger öffentlich:** SCAFA INVESTMENTS LLC, Kontakt info@scafa-investments.com.

---

## 0. ENTSCHEIDUNG: "Walker / Runner / Cyclist / Skater" , nicht als ZIELGRUPPE, aber als FEATURE behalten

**Wichtige Unterscheidung (gegen Code verifiziert):** Die Bewegungsklassen sind KEIN veralteter Text, sondern eine LIVE-Mechanik mit sichtbarem UI. `classDetection.ts` erkennt per GPS-Speed deine Klasse (walker/runner/cyclist/skater/dog_walker/driver), `claimEngine.ts` belohnt sie unterschiedlich (z.B. Runner + Regen + Streak = ×9.0), und `ClassBadge.tsx` zeigt das farbige Badge auf Claim-Ergebnis, Leaderboard, Quests, Challenges, Route-Recorder und MapScreen (DE/EN übersetzt).

Daraus zwei getrennte Regeln für die Landing Page:

- **NICHT als Zielgruppen-Schublade framen.** Nirgends "MapRaiders ist für Walker, Runner, Cyclists, Skater". Das engt auf eine Fitness-/Sport-App ein. Es ist ein **Strategie-MMO**, das Bewegung als Input nutzt. Verkauf **wer du im Spiel wirst** (Eroberer, Commander, Spion, Clan-Boss). Zielgruppe offen und inklusiv halten: "egal ob zu Fuß, mit dem Rad oder beim Hund-Ausführen, jeder Schritt zählt."
- **ALS Spiel-Feature darstellen, das ist ein Verkaufsargument.** "Die App erkennt, ob du gehst, läufst oder radelst, und belohnt jede Fortbewegungsart anders." Das ist Tiefe und Durchdachtheit, kein Ballast. Darf rein.

---

## 1. Die eine Zeile (Positionierung)

MapRaiders verwandelt die echte Welt in ein Strategiespiel. Du bewegst dich durch deine Stadt, eroberst echtes Territorium, baust ein Imperium auf der echten Karte, spionierst Gegner aus und kämpfst um Gebiete.
**Die Karte ist das Spielbrett. Dein Spaziergang ist der Spielzug.**

---

## 2. FEATURE-PILLARS , alle gegen Code verifiziert (LIVE)

### Erobern & Imperium
- **Territorium erobern** (`territories`, `claimEngine`): Lauf durch die echte Welt, zieh Grenzen, claim echtes Gebiet. Deine Wege werden zu deinem Reich.
- **Decay-Spannung** (`decayEngine`, täglich 04:00 UTC): Gebiet verfällt ohne Pflege. Kein "einmal meins, für immer meins". Hält die Karte umkämpft und lebendig.

### Bauen & Aufrüsten (`buildings`, `buildingEngine`)
Auf deinem Territorium baust und verbesserst du Strukturen, jede mit echter Funktion:
- **Teleporter** , Schnellreise (Teletransport ist LIVE).
- **Radar** , Aufklärung/Spionage gegnerischer Gebiete.
- **Garrison** , mehr Verteidigungs-Slots.
- **Schild-Generator** , Schutz.
- **Raffinerie / Sägewerk / Steinbruch / Farm / Fischerei / Silo** , Ressourcen-Produktion, je nach Biom unter dir.
Strukturen brauchen Bauzeit und arbeiten dann für dich, auch offline.

### Lebende Wirtschaft (`resources`, `extractionService`, `terminals` , F.1/F.2/F.3)
- **Extraktion:** Dein Gebiet produziert Ressourcen abhängig vom echten Biom (Wald/Stadt/Wasser via OSM-Kartendaten, `osmContextService`). Wald gibt anderes als Innenstadt.
- **Hauling/Logistik:** Ressourcen transportieren, Versorgungslinien.
- **Mehrere Währungen** (energy, tech, u.a.), Terminals als Handels-/Logistik-Knoten.

### Aufklärung & Verdeckung
- **Spionage-Radar** mit Lebenszyklus , echtes Katz-und-Maus.
- **Fog of War** (`visionService`): 3 Stufen (unerforscht / erforscht / aktiv, Anno-Style). Späher decken die Karte Stück für Stück auf, Späher-Kapazität wächst mit dem Level.
- **Silent Zones / Traps** (`silentZones`, `traps`): Hinterhalte und stille Zonen für taktisches Spiel.

### Kampf
- **Duelle** (`duels`, `duelEngine`): 1v1-Arena.
- **Schlachten & Truppen** (`battleEngine`, `troopEngine`): Truppen aufstellen, um Gebiete kämpfen.
- **PvE / NPC-Gegner** (`pve`, `pveSpawnEngine`): biom-getriebene NPC-Spawns auf der echten Karte, mit Loot. Die Welt ist auch ohne andere Spieler voll.
- **Verteidigungs-Minispiele** (`defenses`, `turnGames`): taktische Würze.
- **Airstrikes / Hacks** (`airstrikeService`, `hackEngine`): Angriffs-Optionen.

### Social & Wettbewerb
- **Clans** (`clans`, organisch via `clanFormation` + manuell): Gruppen formen sich aus echtem Zusammenspiel.
- **Ranglisten & Titel** (`leaderboards`, `titleCheck`): verdienbare Titel, Bestenlisten.
- **Events & Bounties** (`events`, `bounties`): laufende Ziele und Kopfgelder.
- **Spieler-Content:** Quests, Echos, Challenges, Artefakte (`quests`, `echos`, `challenges`, `artifacts`): Spieler füllen die echte Welt mit dem, was sie hinterlassen.
- **Freunde, Meetups, Resonanz** (`friends`, `meetups`, `resonance`): die Karte zeigt, wo Freunde und Rivalen waren.
- **Pets, Rennen, Wetter** (`pets`, `races`, `weather`): zusätzliche Tiefe und Live-Welt.

### Fairness
- **Anti-Cheat** (`antiCheat`): GPS-Spoofing/Teleport-Erkennung. Echte Bewegung zählt, nicht gefälschte.

---

## 3. BALD / COMING SOON (ehrlich als Teaser, NICHT als "schon da")

### ⭐ Streifzug-Modus / Bereitschaftstruppe (HERO-TEASER, das Killer-Feature)
**Das ist der Aufhänger, der Vorfreude und Signups bringt , prominent platzieren.**

Du startest einen Streifzug und die Welt wird zum Spielfeld. Während du durch deinen Tag gehst, passieren Dinge in Echtzeit an echten Orten: ein Schatz glänzt 80m vor dir, ein Söldner am Waldrand will sich deiner Truppe anschließen, eine feindliche Patrouille stellt dich. Eine Push-Benachrichtigung, du entscheidest in Sekunden , hingehen, einsacken, kämpfen oder ziehen lassen. **Alarmbereitschaft: das Spiel kommt zu dir, wo immer du bist.** Gegner können NPC-Streuner oder echte Rivalen sein , die Welt ist immer voll.

Marketing-Linie: "Dein Spaziergang ist nie mehr nur ein Spaziergang." Spielt direkt auf den Privacy-/Zenly-Angle ein (die Karte lebt um dich herum).

**Ehrlichkeits-Regel (Founder-Disziplin):**
- **Stufe 1 (Foreground-Streifzug, in aktiver Entwicklung):** du startest bewusst eine Session, Encounter-Loop läuft, App als laufende Notification. Kommt zuerst.
- **Stufe 2 (Hintergrund, "den ganzen Tag scharf"):** kommt nach Launch, braucht Sonder-Permission. Auf der Landing Page als Vision teasern, NICHT als heute-verfügbar.
- Detail-Spec: `Streifzug_Modus_Spec.md`. Solange Stufe 1 nicht im Tester-Build live ist: als "kommt" framen, nicht als "drin".

---

## 4. NICHT NENNEN (Founder-Disziplin)

- **Krypto-/Echtgeld-Währung** , Play-Store/Recht-Falle, erst nach Launch mit Beratung.
- **Wager-/Wett-Matches** , IARC-Glücksspiel-Falle.
- **TCG-Layer / Master-GDD-Visionen ab Kapitel 2** , nicht gebaut.
- **Spieler-KI-Wächter** , Zukunftsidee, noch nicht da.
- **Hintergrund-Streifzug als "live"** , nur als Teaser.

---

## 5. TONALITÄT & USP

- **Strategie & Eroberung, nicht Fitness.** Verkauf Macht, Imperium, Rivalität, nicht Kalorien.
- **Privacy als USP** (besonders Tier-1): Hinter MapRaiders steht kein Datenkonzern. Standort respektvoll behandelt. (Die Saudi-Übernahme der Pokémon-GO-Macher hat eine Vertrauens-Lücke gerissen, die wir füllen.)
- **Map als soziales Netzwerk:** die Karte zeigt Freunde, Rivalen, hinterlassene Spuren. Zenly-Vakuum.
- **CTA bei Pre-Launch:** auf E-Mail-Signup / Internal-Testing-Beitritt optimieren, NICHT auf toten Store-Link.

---

## 6. PFLICHT-CHECK vor Veröffentlichung

Jede konkrete Feature-Claim gegen den aktuellen Build gegenprüfen. Wenn die Landing Page etwas verspricht, das der erste Tester nicht findet, verbrennt das genau das Vertrauen, das der Privacy-Angle aufbaut. Lieber drei Features ehrlich live als zehn halb versprochen.

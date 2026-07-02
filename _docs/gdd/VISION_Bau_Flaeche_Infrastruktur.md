# VISION: Flächen-Bau, Infrastruktur & Maut (René, 2026-07-02)

> **Status-Update 2026-07-02 (abends): Stufe 1 IST GEBAUT.** René hat das Bau-Gate selbst
> aufgehoben ("die Gebäude möchte ich sehen und platzieren, denk dir was Kluges aus").
> Umgesetzt: Basis-Grid mit individuellen m²-Fußabdrücken (Zelle = 25 m², Grid aus der
> Territoriumsfläche), isometrische Basis-Ansicht (Anno-View) im Mobile-Client mit
> Tap-to-Place, plus Katalog-Erweiterung Militärbasis / Airport / Datacenter und
> Einheiten-Ausbildung mit Level-Gates. Details in §4 unten. Offen bleiben: Anbau-Claim,
> Wege-Evolution, Maut, Erz-Arten.

## Die Vision in einem Satz
Territorium ist Baufläche: jede Baute verbraucht individuelle m², wer mehr bauen will, muss mehr
Land erlaufen, und zwischen verstreuten Territorien entsteht durch Nutzung echte, gemeinschaftliche
Infrastruktur (Wege → Straßen → Schnellstraßen), die Dritten gegen Maut offensteht.

## 1. Flächen-Ökonomie (Bauten verbrauchen m²)
- Jede Baute hat einen individuellen Flächen-Fußabdruck in m² (Sägewerk klein, Airport riesig).
- Freie Baufläche = Territoriums-m² minus Summe der Fußabdrücke. Je mehr gebaut, desto weniger frei.
- Reicht die Fläche nicht: wieder raus, Land erlaufen. Zwei Wege:
  a) **Anbau:** direkt an der Grenze des bestehenden Territoriums laufen → Land wächst zusammenhängend.
  b) **Neugründung:** woanders claimen → dann braucht es Verbindungen (siehe 2).
- Damit wird die m²-Zahl eines Territoriums zur zentralen Progressions-Währung des Indoor-Loops,
  und der Grund, morgen wieder rauszugehen.

## 2. Logistik über Territoriumsgrenzen
- Produktionsketten sind räumlich: Erze (Eisen, Gold, Silber, Metalle) liegen in Minen-Territorien,
  Verarbeiter (Schmiede, Waffenschmiede, Airport) woanders → Rohstoffe MÜSSEN physisch von
  Territorium A nach B gebracht werden (Hauling existiert bereits, F.2).
- Truppen-Verlegung über Ländergrenzen läuft über dieselbe Infrastruktur.

## 3. Wege werden Infrastruktur (der Community-Twist)
- Erste Fahrt auf einer neuen Route: riskant, muss "sauber durchlaufen" (Abfangen möglich, existiert heute).
- Wiederholte Nutzung entwickelt den Pfad: Trampelpfad → Straße → Schnellstraße/Autobahn.
- Entwicklungsstufe gated, WAS darüber darf: erst Kutschen/Träger, später gepanzerte Fahrzeuge usw.
- Entwickelte Infrastruktur wird (teil-)sicher: nicht mehr beliebig angreifbar wie eine Frischroute.
- **Maut:** Andere Spieler dürfen fremde Infrastruktur nutzen und zahlen Maut an die Erbauer/Anlieger.
  Damit wird Infrastruktur eine passive Einnahmequelle und ein sozialer Kitt (Community baut gemeinsam).
- Spätere Bautenklassen: Airport (Luftlogistik), Militärbasis, ...

## Ist-Zustand im Code (verifiziert 2026-07-02)
| Vision-Element | Heute im Code |
|---|---|
| Fläche gated Bauen | JA, aber grob: Slots = min(5, floor(m²/1000)+1) (`constants.ts BUILDINGS.SLOTS`), JEDE Baute kostet 1 Einheits-Slot, kein individueller Fußabdruck, Hard-Cap 5 |
| Rohstoff-Transport A→B | JA: Hauling (F.2, troopEngine dispatchHaul), mit Abfang-Risiko (`haul_intercepted`) |
| Truppen-Märsche | JA: troop_movements mit Pfad + Reisezeit über H3-Zellen |
| Minen/Erze nach Ort | TEILWEISE: Biom-Wirtschaft via OSM (Extraktion F.1), aber kein Erz-Arten-System (Eisen/Gold/Silber) |
| Anbau an bestehendes Territorium | NEIN: Claims sind eigenständige Polygone, kein Merge/Anwachsen |
| Wege→Straßen-Evolution | NEIN: Routen sind flüchtige Movement-Pfade, nichts persistiert/entwickelt sich |
| Maut / nutzbare Fremd-Infrastruktur | NEIN |
| Airport/Militärbasis | NEIN (Bautenkatalog hat sie nicht) |

## Design-Spannungen (vor dem Bauen lösen)
1. **Sicherheit vs. Spannung:** Entwickelte Straßen "immer sicherer" nimmt dem Abfang-Gameplay
   (Spionage F.3, haul_intercepted) genau dann die Beute, wenn viel transportiert wird. Braucht eine
   bewusste Kurve (z.B. sicher gegen Gelegenheits-Abfang, aber Sabotage-Mechanik für organisierte Angriffe).
2. **Slot→m²-Migration:** Bestehende Territorien mit 5 Slots dürfen beim Umstieg auf Fußabdrücke
   nicht enteignet werden (Bestandsschutz/Grandfathering).
3. **Anbau-Claim:** "Direkt am Rand weiterlaufen" braucht eine Merge-Logik für Polygone + Anti-Cheese
   (GPS-Drift am Rand darf kein Gratis-Wachstum sein).
4. **Maut-Ökonomie:** Preisbildung (fix? auktion? anteilig?), Splitting bei Gemeinschaftsstraßen,
   und IARC-Check (Spieler-zu-Spieler-Zahlungen sind ok, solange keine Echtgeld-Kopplung).
5. **Kaltstart:** Straßen-Evolution braucht NUTZUNG. Bei 4 Spielern entwickelt sich nichts →
   der KI-General/NPC-Fraktionen müssten Infrastruktur mitbenutzen (passt zur Kreislauf-Rolle des Generals).

## Reihenfolge, wenn es soweit ist (Vorschlag)
1. Flächen-Fußabdrücke statt Einheits-Slots (kleinster Schritt, macht m² sofort wertvoll) ✅ 2026-07-02
2. Anbau-Claim (Land wächst zusammenhängend) , verstärkt den Outdoor-Loop direkt
3. Persistente Wege mit Nutzungszähler (noch ohne Gameplay-Effekt, nur Daten sammeln)
4. Straßen-Stufen + Maut
5. Erz-Arten + ortsgebundene Produktionsketten
6. Airport/Militärbasis als Endgame-Bauten ✅ 2026-07-02 (vorgezogen auf Renés Ansage)

## 4. GEBAUT 2026-07-02: Basis-Layer Stufe 1 (Grid + Anno-View + Militär)

### Basis-Grid (Server)
- Territorium wird Baugrid: 1 Zelle = 25 m², quadratisches Grid mit
  Seite = ceil(sqrt(Fläche/25)), geklemmt auf 4..40 (`BUILDINGS.GRID`).
- Jede Baute hat FOOTPRINT in Zellen (`BUILDINGS.FOOTPRINT`): Sägewerk 2x2 (100 m²)
  bis Airport 8x6 (1200 m², passt physisch nur auf große Territorien = Vision pur).
- `buildings.grid_x/grid_y` (Migration 2026-07-02); Build-Request mit Position validiert
  Grenzen + Überlappung (OUT_OF_BOUNDS/SPOT_TAKEN/NO_SPACE); ohne Position gilt
  weiter die alte Slot-Regel + Auto-Platzierung (Bestandsschutz für alte Clients).
- Legacy-Gebäude werden beim ersten Lesen automatisch platziert (row-major) und persistiert.

### Katalog v2 + Level-Gates
- NEU: `military_base` (5x5, 500/300, ab Level 5), `datacenter` (3x3, 400/350, ab Level 8,
  KI-Kern: Bauzeit-Beschleunigung 15/25/35 % nach Tier), `airport` (8x6, 1200/800, ab Level 12).
- Level-Gate serverseitig in build() (`BUILDINGS.LEVEL_GATES`).

### Einheiten-Ausbildung (POST /api/buildings/:id/train)
- Militärbasis (Boden): Miliz L1 → Infanterie L5 → Ranger L10 → Kommando L15.
- Airport (Luft): Aufklärungs-UAV L12 → Gunship L15 → Jet L20.
- Rezepte in `TRAINING.RECIPES` (constants.ts), Kosten Energy+Tech pro Einheit, Batch max 10.
- Einheiten sind normale non-tradeable 'unit' item_instances → troopEngine/battleEngine/
  Hauling funktionieren unverändert (Kommando marschiert wie jeder Trupp).

### Anno-View (Mobile)
- Neuer Screen BaseBuilder: isometrisches SVG-Grid, Gebäude als extrudierte Blöcke mit
  Emoji-Glyphen, Platzierungs-Modus mit Footprint-Ghost (grün/rot), Info-Karte mit
  Upgrade/Abriss/Ausbilden, freie-m²-Anzeige. Einstieg: TerritoryDetail → "Basis-Ansicht".

### Katalog-Lücken (nächste Kandidaten, noch NICHT gebaut)
| Gebäude | Zweck | Hängt an |
|---|---|---|
| Mine + Schmelze | Erz-Arten (Eisen/Gold/Silber) → Barren | Erz-System (§2), OSM-Biome |
| Schmiede/Waffenwerk | Barren → Waffen/Ausrüstung für Einheiten | Mine/Schmelze |
| Lagerhaus | Stockpile-Cap erhöhen, Hauling-Puffer | nichts, quick win |
| Hafen/Werft | Naval-Einheiten (Domain 'naval' existiert!) | Wasser-Biom-Gate wie Fischerei |
| Hauptquartier | Territorium-Zentrale, gated max Tier anderer Bauten (Anno-Kette) | Design |
| Wachturm/Mauer | statische Verteidigung sichtbar auf dem Grid | Defense-Integration |
| Straßenmeisterei | Infrastruktur-Pflege | Wege-Evolution (§3) |

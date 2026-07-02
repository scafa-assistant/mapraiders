# VISION: Flächen-Bau, Infrastruktur & Maut (René, 2026-07-02)

> **Status: VISION, nicht Auftrag.** Festgehalten aus Renés Kopf am 2026-07-02, direkt nach dem
> Erste-Nacht-Rollout. Bau-Gate: NICHTS hiervon vor dem N=1-Sog-Beweis bauen (Gründer-Pivot).
> Dieses Dokument trennt sauber: was HEUTE schon im Code existiert, was die Vision ändert,
> und welche Design-Spannungen vorher gelöst werden müssen.

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
1. Flächen-Fußabdrücke statt Einheits-Slots (kleinster Schritt, macht m² sofort wertvoll)
2. Anbau-Claim (Land wächst zusammenhängend) , verstärkt den Outdoor-Loop direkt
3. Persistente Wege mit Nutzungszähler (noch ohne Gameplay-Effekt, nur Daten sammeln)
4. Straßen-Stufen + Maut
5. Erz-Arten + ortsgebundene Produktionsketten
6. Airport/Militärbasis als Endgame-Bauten

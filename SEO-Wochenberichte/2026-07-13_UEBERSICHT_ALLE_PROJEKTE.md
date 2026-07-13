# SEO-Wochenmonitoring, Portfolio-Übersicht, 2026-07-13

Voller Lauf (Chrome wieder verbunden). GSC-Fenster: 04.–10.07.2026. Vergleichsbasis: Bericht 2026-07-01 (der 08.07.-Lauf hatte keine GSC-Daten).

## 🔴 Kritischer Befund zuerst
**dopaspeak.com verliert massiv Indexierung: 358 → 279 (−22 %).** 79 Seiten sind aus dem Index gefallen und stehen jetzt unter „gecrawlt, zurzeit nicht indexiert" (64 → 143), Validierung dieses Grunds: „Fehlgeschlagen". Details und Empfehlung im Detailbericht, Eskalation an den betreuenden Agenten nötig.

## Portfolio-Snapshot

| Property | Indexiert | Nicht indexiert | Klicks 7T | Impr. 7T | Ø Pos. | Manuelle Maßn. | TLS/Cert | Ampel |
|---|---|---|---|---|---|---|---|---|
| mapraiders.com | 556 (▲12) | 375 (▲18) | 13 (▲6) | 409 (▲32) | 12,7 (=) | Keine | 🟢 OK | 🟢 |
| dopaspeak.com | **279 (▼79)** | **1260 (▲90)** | 8 (▲5) | 261 (▽33) | 16,4 (▲5,7) | Keine | 🟢 OK | 🔴 |
| egons.io | 12 (=) | 0 (=) | 1 (▽1) | 31 (▽12) | 25,4 (▲3,4) | Keine | 🟢 OK | 🟢 |
| ungehoert.music | 7 (=) | 3 (=) | 0 (=) | 2 (▲2) | 7 | Keine | 🟢 OK | 🟡 |

CTR: mapraiders 3,2 % · dopaspeak 3,1 % · egons.io 3,2 % · ungehoert 0 %.
(▲/▽ vs. 01.07. · TLS-Live-Check diese Woche voll in Chrome verifiziert, alle 4 Domains laden die echte Seite, kein NET::ERR_CERT.)

## Wichtigste neue Erkenntnisse

1. **🔴 dopaspeak-Indexeinbruch (−79 Seiten):** Google bewertet die Property nach dem Relaunch neu und wirft Seiten in „gecrawlt, nicht indexiert" (+79). Gleichzeitig performen die verbleibenden Seiten besser (Klicks 3→8, Ø Pos. 22,1→16,4). Diagnose: Mengen-, kein Qualitätsproblem, die deindexierten URLs brauchen eine Ursachen-Stichprobe (Thin Content / Verlinkung / Canonical-Konflikte). Die 895er-Canonical-Gruppe bewegt sich erstmals leicht (882, Validierung läuft).
2. **🟢 mapraiders mit bester Woche bisher:** Klicks 7→13, CTR 1,9→3,2 %, Indexierung wächst erstmals wieder (544→556). Neu: ko/ja/ar-Seiten holen erste Klicks, die 13-Sprachen-Strategie greift messbar. Gate grün (763 Seiten), /es/→/es-mx/ ✅, llms.txt ✅, Crawl-Verteilung unverändert (Sonstiges 8 %, 404 5 %).
3. **TLS-Live-Check portfolioweit grün, erstmals seit 2 Wochen wieder Chrome-verifiziert.** Kein Wiederholungsfall des 22.06.-Cert-Ausfalls auf den Hetzner-Domains.
4. **Keine manuellen Maßnahmen** auf allen 4 Properties.
5. **mapraiders-Validierungsstati vielfach „Fehlgeschlagen":** betrifft überwiegend Absichts-Ausschlüsse (noindex, Canonicals, Redirects), dort erwartbar und folgenlos. Einzig relevanter Posten: 87 „gecrawlt, nicht indexiert" (+24), das ist die Arbeitsliste für interne Verlinkung.

## Empfohlene nächste Aktionen

- **dopaspeak (dringend, an betreuenden Agenten):** Stichprobe der 79 deindexierten URLs aus dem GSC-Detailbericht, Ursache klären, Bestandsseiten stärken statt neue publizieren.
- **mapraiders:** 87 „gecrawlt, nicht indexiert" per interner Verlinkung aus den Cluster-Hubs anschieben; Snippet-Test für /en/games-like-pokemon-go.html (80 Impr., CTR 1,3 %); Off-Page starten (externe Links weiter 0).
- **egons.io:** Content-Fläche ausbauen (12 Seiten), Vergleichs-/Long-Tail-Seiten.
- **ungehoert.music:** statische Release-/Artist-Seiten (SSR/Pre-Rendering) bleiben Voraussetzung für jede Sichtbarkeit; Spotify-Link-Bug fixen.
- **GSC-Schreibaktionen** (Validierungen, Einreichungen) wie immer nur durch René.

## Detailberichte
- `2026-07-13_mapraiders.md`
- `2026-07-13_dopaspeak.md`
- `2026-07-13_egons-io.md`
- `2026-07-13_ungehoert-music.md`

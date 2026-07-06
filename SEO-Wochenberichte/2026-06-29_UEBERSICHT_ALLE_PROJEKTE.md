# SEO-Wochenmonitoring, Portfolio-Übersicht, 2026-06-29

Erste gespeicherte Wochenausgabe in diesem Ordner. Es existiert kein Vorwochenbericht zum Vergleich, daher Trend-Ampeln = neu/Basis. Werte für GSC sind 7-Tage-Fenster 21.–27.06.2026.

## Portfolio-Snapshot

| Property | Indexiert | Nicht indexiert | Klicks 7T | Impr. 7T | Ø Pos. | Manuelle Maßn. | TLS/Cert | Ampel |
|---|---|---|---|---|---|---|---|---|
| mapraiders.com | 544 | 357 (9 Gründe) | 6 | 373 | 12,1 | Keine | 🟢 OK | 🟡 |
| dopaspeak.com | 358 | 1170 (8 Gründe) | 3 | 298 | 23,9 | Keine | 🟢 OK | 🟡 |
| egons.io | 12 | 0 | 2 | 43 | 23,8 | Keine | 🟢 OK | 🟢 |
| ungehoert.music | 7 | 3 (2 Gründe) | 0 | 1 | 1,0 | Keine | 🟢 OK | 🟢 |

CTR: mapraiders 1,6 % · dopaspeak 1,0 % · egons.io 4,7 % · ungehoert 0 %.

## Wichtigste neue Erkenntnisse (portfolioweit)

1. **TLS-Live-Check für alle 4 Domains grün.** Chrome lädt jede Property-Root als echte Seite (kein NET::ERR_CERT). Der am 22.06. offene mapraiders-Cert-Ausfall ist im Browser aktuell nicht mehr reproduzierbar. mapraiders-Crawl-Statistik zeigt aber noch Hoststatus „Am Host sind in der Vergangenheit Probleme aufgetreten" (Nachwirkung des Ausfalls, kein aktiver Fehler).
2. **Keine manuellen Maßnahmen / Sicherheitsprobleme** auf irgendeiner Property.
3. **mapraiders: lokales SEO-Gate ist regrediert.** `_validate_seo.py` meldet jetzt FEHLER (war 22.06. komplett grün): 15× `fehlende_selbstreferenz` und 255× `homepage_fallback`, alle verursacht durch neue `*/_legacy_index.html`-Dateien. Das ist ein echter Gate-Bruch, nicht nur die bekannten 219 Content-Warnungen. → Aktion bei René/Build-Pipeline.
4. **dopaspeak: 1170 Seiten nicht indexiert, davon 895 „Alternative Seite mit richtigem kanonischen Tag".** Das ist die erwartete Folge der Relaunch-Canonical-Konsolidierung, aber das Verhältnis indexiert (358) zu nicht indexiert (1170) bleibt der kritischste Portfolio-Punkt. Beobachten, ob die 895 mit der Zeit fallen.
5. **mapraiders-Stichproben grün:** `/es/` leitet sauber auf `/es-mx/` (Endstatus 200), `/llms.txt` liefert 200 mit vollständigem Inhalt.

## Empfohlene nächste Aktionen

- **mapraiders (Gate-Regression, zuerst):** `*/_legacy_index.html` aus dem Build entfernen oder mit korrekter Selbstreferenz + Canonical versehen. Diese Legacy-Dateien sind neu seit der 22.06.-Basis und brechen das Gate. Danach `_validate_seo.py` erneut bis grün.
- **mapraiders (Crawl-Qualität):** „Verschoben (Sonstiges)" 8 % und 404 5 % senken (Soll Sonstiges →0). 357 nicht indexierte Seiten enthalten u. a. 106 noindex + 67 „gefunden, nicht indexiert" + 63 „gecrawlt, nicht indexiert" → interne Verlinkung/Content-Tiefe der Cluster-Seiten stärken.
- **dopaspeak:** Canonical-Konsolidierung beobachten; prüfen, ob die 92 „Seite mit Weiterleitung" und 82 „404" durch saubere 301 ohne Ketten reduzierbar sind.
- **egons.io / ungehoert.music:** früh, sauber, keine Probleme. egons.io zeigt mit 4,7 % CTR die beste Effizienz, hier lohnt Content-Ausbau (aktuell nur 12 Seiten).
- **GSC-Schreibaktionen** (Validierungen starten, Einreichen) bleiben bei René.

## Detailberichte
- `2026-06-29_mapraiders.md`
- `2026-06-29_dopaspeak.md`
- `2026-06-29_egons-io.md`
- `2026-06-29_ungehoert-music.md`

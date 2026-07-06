# SEO-Wochenmonitoring, Portfolio-Übersicht, 2026-07-01

Vergleichsbasis: Bericht 2026-06-29. GSC-Werte = 7-Tage-Fenster 23.–29.06.2026. Ruhige Woche, keine kritischen Befunde, ein wichtiger Fortschritt (mapraiders-Gate wieder grün).

## Portfolio-Snapshot

| Property | Indexiert | Nicht indexiert | Klicks 7T | Impr. 7T | Ø Pos. | Manuelle Maßn. | TLS/Cert | Ampel |
|---|---|---|---|---|---|---|---|---|
| mapraiders.com | 544 (=) | 357 (=) | 7 (▲6) | 377 (▲373) | 12,6 (▽12,1) | Keine | 🟢 OK | 🟢 |
| dopaspeak.com | 358 (=) | 1170 (=) | 3 (=) | 294 (▽298) | 22,1 (▲23,9) | Keine | 🟢 OK | 🟡 |
| egons.io | 12 (=) | 0 (=) | 2 (=) | 43 (=) | 28,8 (▽23,8) | Keine | 🟢 OK | 🟢 |
| ungehoert.music | 7 (=) | 3 (=) | 0 (=) | 0 (▽1) | n/a | Keine | 🟢 OK | 🟢 |

CTR: mapraiders 1,9 % · dopaspeak 1,0 % · egons.io 4,7 % · ungehoert 0 %.
(= unverändert · ▲ verbessert · ▽ leicht schlechter)

## Wichtigste neue Erkenntnisse (portfolioweit)

1. **mapraiders-Gate wieder grün (🔴 → 🟢).** Die Vorwochen-Regression (`*/_legacy_index.html` mit 15× fehlender Selbstreferenz + 255× homepage_fallback) ist behoben. `_validate_seo.py` meldet für 763 Seiten „alle Gate-Prüfungen bestanden", nur die bekannten 219 hreflang-Content-Warnungen bleiben. Der wichtigste offene Punkt der Vorwoche ist geschlossen.
2. **TLS-Live-Check für alle 4 Domains grün.** Chrome lädt jede Property-Root als echte Seite (kein NET::ERR_CERT). Kein Cert-Ausfall diese Woche, auch bei den Hetzner-Domains mapraiders + egons.io.
3. **Keine manuellen Maßnahmen / Sicherheitsprobleme** auf irgendeiner Property.
4. **dopaspeak eingefroren:** 358 / 1170 exakt wie Vorwoche, die 895 Canonical-Alternativseiten bewegen sich nicht. Immerhin Ø Position 23,9 → 22,1 verbessert. Bleibt der kritischste Portfolio-Punkt, jetzt „stabil hoch" statt „fallend".
5. **mapraiders-Stichproben grün:** `/es/` leitet sauber auf `/es-mx/` (Endstatus 200), `/llms.txt` liefert 200 mit vollständigem, sauberem UTF-8-Inhalt (Datei `docs/llms.txt` geprüft, das anfängliche Mojibake war nur ein Render-Artefakt des Auslesetools, kein Datei-Fehler).

## Kleinere Nebenbefunde
- mapraiders `/llms.txt`: kein Befund. Datei `docs/llms.txt` ist sauberes UTF-8, das anfängliche Mojibake war ein Client-Render-Artefakt.
- ungehoert.music: „Spotify"-Link zeigt auf `track/undefined` (defekte Track-ID), Frontend-Bug, kein SEO-Blocker.
- egons.io + ungehoert: Ø Position bzw. Impressionen leicht gesunken, bei sehr kleiner Datenbasis statistisch im Rauschen.

## Empfohlene nächste Aktionen

- **mapraiders (jetzt Crawl-Qualität statt Gate):** Gate ist grün, Fokus auf 404/„Sonstiges"-Anteil (5 % / 8 %) senken und die 130 „gefunden/gecrawlt, nicht indexiert" über interne Verlinkung + Content-Tiefe indexierbar machen. Neu: lebende Watch-List `seo-strategy/SEO_MONITORING_BRIEFING.md` für den Projektagenten angelegt.
- **dopaspeak:** an betreuenden Agenten, prüfen ob die 895 Canonical-Alternativseiten gewollt sind; 404/Redirect-Reste auf saubere 301 ohne Ketten. Trend der 895 weiter beobachten.
- **egons.io:** Content-Ausbau (nur 12 Seiten), weitere Nischen-Long-Tail-Seiten im Stil /ki-bei-adhs, um Positions-Erosion durch Fläche + gute CTR auszugleichen.
- **ungehoert.music:** Release-/Artist-Seiten veröffentlichen für indexierbare Substanz; Spotify-Link-Bug beheben.
- **GSC-Schreibaktionen** (Validierungen starten, Einreichen) bleiben bei René.

## Detailberichte
- `2026-07-01_mapraiders.md`
- `2026-07-01_dopaspeak.md`
- `2026-07-01_egons-io.md`
- `2026-07-01_ungehoert-music.md`

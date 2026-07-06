# mapraiders.com, SEO-Wochenbericht 2026-06-29

GSC-Fenster: 21.–27.06.2026 (7 Tage). Kein Vorwochenbericht vorhanden → Vorwoche = n/a.

## Kennzahlen

| Kennzahl | Vorwoche | Aktuell | Ampel |
|---|---|---|---|
| Indexiert | n/a | 544 | 🟢 |
| Nicht indexiert | n/a | 357 (9 Gründe) | 🟡 |
| Klicks 7T | n/a | 6 | 🟡 |
| Impressionen 7T | n/a | 373 | 🟡 |
| Ø CTR | n/a | 1,6 % | 🟡 |
| Ø Position | n/a | 12,1 | 🟡 |
| Manuelle Maßnahmen | n/a | Keine | 🟢 |
| TLS-/Cert-Live-Check | 🔴 (22.06.) | 🟢 lädt normal | 🟢 |
| Lokales Gate `_validate_seo.py` | 🟢 (22.06.) | 🔴 FEHLER | 🔴 |

### Nicht-indexiert-Gründe (GSC)
noindex 106 · 404 36 · alternative Seite m. Canonical 36 · Weiterleitung 13 · 403 blockiert 2 · Duplikat (Nutzer) 1 · gefunden, nicht indexiert 67 · gecrawlt, nicht indexiert 63 · Duplikat (Google wählt anderes Canonical) 33. Alle Validierungen „Gestartet".

### Crawling-Statistik
Anfragen gesamt 3840 · Ø Reaktionszeit 328 ms · Hoststatus: „Am Host sind in der Vergangenheit Probleme aufgetreten". Antwortverteilung: OK(200) 84 % · Verschoben (Sonstiges) 8 % · 404 5 % · 301 2 % · nicht erreichbar <1 %.

### Top-Seiten (Klicks/Impr.)
- /en/territory-game-app.html, 2/17
- /en/, 1/8
- /ru/igra-territoriy.html, 1/3
- /en/games-like-pokemon-go.html, 0/71 (höchste Impr.)
- /en-in/vs/zenly.html, 0/24

### Stichproben (Browser, Cert grün → verifizierbar)
- `/es/` → `/es-mx/` Weiterleitung, Endstatus 200 ✅
- `/llms.txt` → 200, vollständiger Inhalt ✅

## Erkenntnisse
- **Gate-Regression (kritisch):** `_validate_seo.py` (778 Seiten) meldet 15× `fehlende_selbstreferenz` + 255× `homepage_fallback`, alle aus neuen `*/_legacy_index.html`-Dateien. Am 22.06. war das Gate grün. Daneben unverändert 219 `indexierbar_ohne_hreflang`-Warnungen (Content-Aufgabe, kein Gate-Fehler).
- Crawl-Qualität: „Verschoben (Sonstiges)" 8 % (Soll →0) und 404 5 % sind die größten Hebel. Hoststatus-Hinweis ist Nachwirkung des 22.06.-Cert-Ausfalls, aktuell kein Live-Fehler.
- Sichtbarkeit niedrig aber stabil (6 Klicks, Ø Pos 12,1); große Impressionsträger (games-like-pokemon-go, vs/zenly) konvertieren noch nicht (CTR 0).

## Empfohlene nächste Aktion
`*/_legacy_index.html` aus dem Build nehmen oder korrekt kanonisieren, dann `_validate_seo.py` bis grün. Parallel 404/„Sonstiges"-Anteil in Crawl-Stats senken. GSC-Validierungen bleiben bei René.

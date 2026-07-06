# mapraiders.com, SEO-Wochenbericht 2026-07-01

GSC-Fenster: 23.–29.06.2026 (7 Tage). Vergleichsbasis: Bericht 2026-06-29.

## Kennzahlen

| Kennzahl | Vorwoche | Aktuell | Ampel |
|---|---|---|---|
| Indexiert | 544 | 544 | 🟢 |
| Nicht indexiert | 357 (9 Gründe) | 357 (9 Gründe) | 🟡 |
| Klicks 7T | 6 | 7 | 🟢 |
| Impressionen 7T | 373 | 377 | 🟢 |
| Ø CTR | 1,6 % | 1,9 % | 🟢 |
| Ø Position | 12,1 | 12,6 | 🟡 |
| Manuelle Maßnahmen | Keine | Keine | 🟢 |
| TLS-/Cert-Live-Check | 🟢 | 🟢 lädt normal | 🟢 |
| Lokales Gate `_validate_seo.py` | 🔴 FEHLER | 🟢 alle Prüfungen bestanden | 🟢 |

### Nicht-indexiert-Gründe (GSC, unverändert zur Vorwoche)
noindex 106 · 404 36 · alternative Seite m. Canonical 36 · Weiterleitung 13 · 403 blockiert 2 · Duplikat (Nutzer) 1 · gefunden, nicht indexiert 67 · gecrawlt, nicht indexiert 63 · Duplikat (Google wählt anderes Canonical) 33. Alle Validierungen „Gestartet".

### Crawling-Statistik (unverändert)
Anfragen gesamt 3860 (Vw 3840) · Ø Reaktionszeit 328 ms · Hoststatus: „Am Host sind in der Vergangenheit Probleme aufgetreten". Antwortverteilung: OK(200) 84 % · Verschoben (Sonstiges) 8 % · 404 5 % · 301 2 % · nicht erreichbar <1 %.

### Top-Seiten (Klicks/Impr.)
- /en/cycling-game/, 2/16
- /en/territory-game-app.html, 2/15
- /fr/jeu-course/, 1/8
- /en/games-like-pokemon-go.html, 0/69 (höchste Impr.)
- /en/best-walking-apps-with-game.html, 0/24 · /en-in/vs/zenly.html, 0/22

### Stichproben (Browser, Cert grün → verifizierbar)
- `/es/` → `/es-mx/` Weiterleitung, Endstatus 200 ✅
- `/llms.txt` → 200, vollständiger Inhalt ✅

## Erkenntnisse
- **Gate-Regression behoben (🔴 → 🟢):** `_validate_seo.py` (763 Seiten) meldet jetzt „alle Gate-Prüfungen bestanden". Die 15× `fehlende_selbstreferenz` + 255× `homepage_fallback` aus den `*/_legacy_index.html`-Dateien (Vorwoche) sind weg. Es bleiben nur die bekannten 219 `indexierbar_ohne_hreflang`-Warnungen (Content-/Cluster-Aufgabe, kein Gate-Fehler).
- Sichtbarkeit leicht verbessert: Klicks 6 → 7, CTR 1,6 → 1,9 %. Ø Position minimal schlechter (12,1 → 12,6), im Rauschen. Große Impressionsträger (games-like-pokemon-go 69, zenly 22) konvertieren weiter mit CTR 0.
- Crawl-Qualität unverändert: „Sonstiges" 8 % und 404 5 % bleiben die größten Hebel. Hoststatus-Hinweis ist weiter Nachwirkung des 22.06.-Cert-Ausfalls, kein Live-Fehler.
- Kein Befund bei `/llms.txt`: Datei geprüft (`docs/llms.txt`), sauberes valides UTF-8 (Pokémon, Gedankenstrich, japanische Zeichen korrekt). Das im Browser-Auslesetool sichtbare Mojibake war ein Render-/Charset-Artefakt des Clients, kein Datei-Fehler, kein Handlungsbedarf.

## Empfohlene nächste Aktion
Fokus verschiebt sich weg vom Gate (grün) hin zur Crawl-Qualität: 404/„Sonstiges"-Anteil senken, interne Verlinkung/Content-Tiefe der 130 „gefunden/gecrawlt, nicht indexiert" stärken. GSC-Validierungen bleiben bei René.

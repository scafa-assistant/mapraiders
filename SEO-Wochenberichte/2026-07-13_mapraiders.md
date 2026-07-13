# mapraiders.com, SEO-Wochenbericht 2026-07-13

GSC-Fenster: 04.–10.07.2026 (7 Tage). Vergleichsbasis: Bericht 2026-07-01 (Lauf 08.07. war wegen Chrome-Ausfall ohne GSC-Daten).

## Kennzahlen

| Kennzahl | Vorwoche (01.07.) | Aktuell | Ampel |
|---|---|---|---|
| Indexiert | 544 | 556 | 🟢 |
| Nicht indexiert | 357 (9 Gründe) | 375 (8 Gründe) | 🟡 |
| Klicks 7T | 7 | 13 | 🟢 |
| Impressionen 7T | 377 | 409 | 🟢 |
| Ø CTR | 1,9 % | 3,2 % | 🟢 |
| Ø Position | 12,6 | 12,7 | 🟡 |
| Manuelle Maßnahmen | Keine | Keine | 🟢 |
| TLS-/Cert-Live-Check | 🟡 indirekt | 🟢 lädt normal in Chrome | 🟢 |
| Externe Links (GSC) | 0 | 0 | 🟡 |
| Lokales Gate `_validate_seo.py` | 🟢 | 🟢 763 Seiten, alle Prüfungen bestanden | 🟢 |

### Nicht-indexiert-Gründe (Veränderung vs. 01.07.)
noindex 99 (−7) · gecrawlt, nicht indexiert 87 (+24) · alternative Seite m. Canonical 47 (+11) · 404 40 (+4) · Duplikat (Google wählt anderes Canonical) 37 (+4) · gefunden, nicht indexiert 36 (−31) · Weiterleitung 27 (+14) · 403 blockiert 2 (=) · Duplikat (Nutzer) 0 (−1).
**Validierungsstatus:** die meisten Gründe stehen jetzt auf „Fehlgeschlagen" (Vorwoche „Gestartet"). Bei absichtlichen Ausschlüssen (noindex, Canonical-Alternativen, Redirects, 404) ist das erwartbar und kein Schaden, GSC prüft dort, ob Seiten indexierbar wurden, was nie das Ziel war. Relevant ist nur „Gecrawlt – zurzeit nicht indexiert" (87, Fehlgeschlagen): das sind echte Kandidaten, die Content/Verlinkung brauchen, keine erneute Validierung.

### Crawling-Statistik
Anfragen gesamt 4000 (Vw 3860) · Ø Reaktionszeit 326 ms (Vw 328) · Hoststatus weiter „in der Vergangenheit Probleme" (Nachwirkung 22.06., kein Live-Fehler). Antwortverteilung unverändert: OK(200) 84 % · Verschoben (Sonstiges) 8 % · 404 5 % · 301 2 % · nicht erreichbar <1 %.

### Top-Seiten 7T (Klicks/Impr.)
- /ko/위치기반게임.html, 2/23
- /ar/cycling-game/, 2/5
- /ja/ジオキャッシング無料代替.html, 2/2
- /en/games-like-pokemon-go.html, 1/80 (höchste Impr., CTR 1,3 %)
- 99 Seiten mit Impressionen insgesamt (Vw ~lower), Long-Tail über ko/ja/ar/es-mx/fr/ru verteilt

### Stichproben (Chrome, Cert grün → verifizierbar)
- `/es/` → `/es-mx/` Weiterleitung, Endstatus 200 ✅
- `/llms.txt` → 200, vollständiger Inhalt ✅ (Mojibake im Auslesetool = bekanntes Render-Artefakt, Datei sauber)
- Gate: 219 `indexierbar_ohne_hreflang`-Warnungen unverändert (Content-/Cluster-Aufgabe)

## Erkenntnisse
- **Beste Leistungswoche bisher:** Klicks 7 → 13 (fast verdoppelt), Impressionen 377 → 409, CTR 1,9 → 3,2 %. Erstmals konvertieren die asiatischen Sprachversionen (ko/ja) und ar sichtbar, die 13-Sprachen-Strategie beginnt zu greifen.
- **Indexierung wächst wieder:** 544 → 556 (+12), erster Zuwachs seit Wochen. Gegenläufig: „gecrawlt, nicht indexiert" 63 → 87 (+24), Google zieht Seiten aus „gefunden" (−31) ins Crawling, indexiert sie aber noch nicht, das ist der normale Zwischenschritt, aber auch die To-do-Liste für interne Verlinkung.
- /en/games-like-pokemon-go.html bleibt größter Impressionsträger (80) mit nur 1 Klick, Title/Snippet-Hebel.
- Externe Links weiterhin 0, Off-Page bleibt komplett unbearbeitet.

## Empfohlene nächste Aktion
Die 87 „gecrawlt, nicht indexiert" priorisieren: interne Links aus den Cluster-Hubs auf diese Seiten setzen, Content-Tiefe prüfen. Zweiter Hebel: Snippet-Optimierung für games-like-pokemon-go (80 Impr., CTR 1,3 %). GSC-Validierungen bleiben bei René, die „Fehlgeschlagen"-Stati bei Absichts-Ausschlüssen kann er ignorieren.

# Wochenbericht SEO — MapRaiders · 15.06.2026

**Property:** https://mapraiders.com/ · **Modus:** GSC nur lesend (Guardrail eingehalten — keine Validierungen gestartet, nichts eingereicht/entfernt) · **Vergleichsbasis:** Vorbericht 15.06.2026 (Index-Stand 10.–12.06.)

## Kennzahlen

| Kennzahl | Vorwoche | Aktuell | Ampel |
|---|---|---|---|
| Seiten indexiert | 544 | 544 | 🟢 stabil |
| Seiten nicht indexiert | 357 | 357 (9 Gründe) | 🟡 stabil |
| Validierung 404 | Fehlgeschlagen (36) | **Fehlgeschlagen (36)** | 🔴 unverändert |
| Validierung Duplikat-Canonical | Fehlgeschlagen (33) | **Fehlgeschlagen (33)** | 🔴 unverändert |
| Validierung „Gefunden – nicht indexiert" | Gestartet (67) | Gestartet (67) | 🟡 läuft |
| Validierung 403 | Gestartet (2) | Gestartet (2) | 🟡 läuft |
| noindex (nur René) | 106 (nicht gestartet) | 106 (nicht gestartet) | 🟡 |
| Alternative Seite m. kanon. Tag | 36 (nicht gestartet) | 36 (nicht gestartet) | 🟡 |
| Seite mit Weiterleitung | 13 (nicht gestartet) | 13 (nicht gestartet) | 🟢 301-Effekt |
| Gecrawlt – nicht indexiert | 63 | 63 (nicht gestartet) | 🟡 |
| Crawl: OK (200) | — | 83 % | 🟢 |
| Crawl: Verschoben (Sonstiges) | 9 % | 9 % | 🟡 Soll →0 |
| Crawl: Nicht gefunden (404) | 5 % | 5 % | 🟡 |
| Hoststatus | — | „in Vergangenheit Probleme" | 🟡 beobachten |
| Verweisende Domains (extern) | 0 | 0 | 🔴 Outreach offen |
| Interne Links | 4.975 | 4.975 | 🟢 |
| Leistung 7 T: Klicks / Impr. | 15 / 347 | 15 / 347 (CTR 4,3 %, Pos. 10,4) | 🟢 |
| Live `/es/` → `/es-mx/` (301) | 301 → 200 | **301 → 200 OK** | 🟢 |
| Live `/llms.txt` | 200 OK | **200 OK** (2.961 B) | 🟢 |
| Lokal `_validate_seo.py` (tote Links) | 232 | n/v (Sandbox aus) | ⚪ nicht prüfbar |

**Top-3-Seiten (7 Tage, Klicks/Impr.):** `/en/games-like-pokemon-go.html` (3/108) · `/ko/위치기반게임.html` (2/14) · `/ja/位置情報ゲーム.html` (1/11)

## Erkenntnisse

- **Lage stabil, keine Verschlechterung:** Indexierung hält bei 544 idx / 357 nicht idx, Leistung konstant (15 Klicks / 347 Impr.). Live-Stichproben erneut grün — `/es/`→`/es-mx/` endet bei 200, `/llms.txt` liefert 200. Keine manuellen Maßnahmen.
- **🔴 Zwei Validierungen weiterhin „Fehlgeschlagen":** 404 (36) und Duplikat-Canonical (33) unverändert seit letzter Woche. Kein automatischer Neustart erlaubt (nur René) — vorher Ursache je einer Beispiel-URL lesend prüfen, dann Repo-Fix, dann neu validieren lassen.
- **Backlinks + Crawl-Verteilung unverändert:** verweisende Domains weiter 0 (Outreach-Versand nur René); „Verschoben (Sonstiges)" stabil 9 %. Crawl-Statistik ist ein ~90-Tage-Fenster — in 1–2 Wochen erneut bewerten. Hoststatus meldet vergangene Probleme: im Auge behalten.

## Empfohlene nächste Aktion

Fehlgeschlagene Validierungen 404 + Duplikat-Canonical lesend aufschlüsseln (Beispiel-URLs in GSC ansehen), Resturschen im Repo beheben, erst danach **René** die Neu-Validierung anstoßen lassen. Parallel: Outreach-Versand durch René gegen die 0-Backlink-Lage. Hinweis: `_validate_seo.py` konnte diese Woche nicht laufen (Linux-Sandbox nicht verfügbar) — beim nächsten Lauf nachholen.

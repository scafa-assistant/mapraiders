# Wochenbericht SEO — MapRaiders · 15.06.2026

**Property:** https://mapraiders.com/ · **Modus:** GSC nur lesend (Guardrail eingehalten — keine Validierungen gestartet, nichts eingereicht/entfernt) · **Basis-Vergleich:** 10.06.2026

## Kennzahlen

| Kennzahl | Vorwoche (10.06.) | Aktuell | Ampel |
|---|---|---|---|
| Seiten indexiert | 500 | **544** | 🟢 +44 |
| Seiten nicht indexiert | 381 | **357** | 🟢 −24 |
| Validierung 404 | gestartet (33) | **Fehlgeschlagen (36)** | 🔴 |
| Validierung Duplikat-Canonical | gestartet (35) | **Fehlgeschlagen (33)** | 🔴 |
| Validierung „Gefunden – nicht indexiert" | gestartet (130) | Gestartet (67) | 🟢 −63 |
| Validierung 403 | gestartet (2) | Gestartet (2) | 🟡 läuft |
| Rezensions-Snippets ungültig | ~hunderte | **3** (252 gültig) | 🟢 |
| Validierung itemReviewed / author | gestartet (je 156) | „Bisher alles in Ordnung" (je 3) | 🟢 |
| noindex (Validierung offen, nur René) | 89 | 106 (nicht gestartet) | 🟡 |
| Crawl: Verschoben (Sonstiges) | 10 % | 9 % | 🟡 Soll →0 |
| Crawl: Nicht gefunden (404) | 6 % | 5 % | 🟡 |
| Verweisende Domains (externe Links) | 0 | 0 | 🔴 Outreach offen |
| Interne Links | — | 4.975 | 🟢 |
| Leistung 7 T: Klicks / Impressionen | — | 15 / 347 (CTR 4,3 %, Pos. 10,4) | 🟢 |
| Live `/es/` → `/es-mx/` (301) | — | 301 → 200 OK | 🟢 |
| Live `/llms.txt` | — | 200 OK | 🟢 |
| Lokal `_validate_seo.py` (tote Links) | 232 | 232 | 🟡 bekannt |

**Top-3-Seiten (7 Tage, Klicks/Impr.):** `/en/games-like-pokemon-go.html` (3/108) · `/ko/위치기반게임.html` (2/14) · `/ja/位置情報ゲーム.html` (1/11)

## Erkenntnisse

- **Indexierung wächst, Snippets saniert:** +44 indexierte Seiten, nicht-indexiert −24, „Gefunden – nicht indexiert" halbiert (130→67). Rezensions-Snippets von hunderten Fehlern auf 3 ungültig / 252 gültig — die itemReviewed/author-Validierungen laufen sauber. Die 301-Migration greift: 13 URLs werden jetzt als „Seite mit Weiterleitung" erkannt, Live-Redirect `/es/`→`/es-mx/` und `llms.txt` bestätigt.
- **🔴 Zwei Validierungen fehlgeschlagen:** 404 (36 URLs) und Duplikat-Canonical (33 URLs), beide am 10.06. gestartet. Google sieht bei diesen URLs das Problem weiterhin. Kein automatischer Neustart möglich/erlaubt (nur René) — vorher Ursache je einer Beispiel-URL lesend prüfen.
- **Backlinks + Crawl-Verteilung stagnieren:** verweisende Domains weiterhin 0 (OUTREACH_KIT versandbereit, Versand nur René); „Verschoben (Sonstiges)" nur 10 %→9 %, da Crawl-Statistik ein ~90-Tage-Fenster ist und der 301-Deploy erst 5 Tage alt ist — in 1–2 Wochen erneut bewerten.

## Empfohlene nächste Aktion

Fehlgeschlagene Validierungen 404 + Duplikat-Canonical lesend aufschlüsseln (Beispiel-URLs in GSC ansehen), Resturschen im Repo beheben (`_validate_seo.py` als Gate), erst danach **René** die Neu-Validierung anstoßen lassen. Parallel: Outreach-Versand durch René, um die 0-Backlink-Lage zu durchbrechen.

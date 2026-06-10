# Redirect-Volltest — 10.06.2026

**Methode:** Live-HTTP-Tests im Browser (fetch, cache:no-store, redirect manual+follow). Getestet: alle 195 Meta-Refresh-Stub-URLs aus dem Repo + 110 Slash-Varianten = **305 URL-Varianten** auf mapraiders.com, plus Stichproben auf dopaspeak.com.

## Ergebnis mapraiders.com — KEINE Migrations-Redirects aktiv

| Kategorie | Anzahl | Befund |
|---|---|---|
| Stub-URLs (Soll: 301 auf finales Ziel) | 195 | **ALLE antworten 200** (Meta-Refresh-Stub, kein HTTP-Redirect) |
| Slash-Varianten (`/dir` → `/dir/`) | 110 | 111 × 301 — aber nur nginx-Standard-Slash-Normalisierung, KEINE Migrations-Regel |
| Fehler/Timeouts | 0 | — |

**Server:** nginx/1.24.0 (Ubuntu) — mapraiders.com wird vom eigenen Server ausgeliefert (nicht GitHub Pages). Die AP1-301-Regeln aus dem Briefing sind dort **nicht deployed**: Es existiert offenbar noch keine aktive Redirect-Conf für die Locale-Migration (es→es-mx, pt→pt-br, zh→zh-cn/tw, ja/ko-Slugs, en-in-Renames).

**Konsequenz:** Der Zustand entspricht weiter der Diagnose im Briefing — noindex-Stubs statt 301, kein Linkjuice-Transfer, Crawl-Verschwendung. AP1 (nginx-Conf generieren + deployen) ist offen. Die fertige 301-Matrix (195 Quellen → finale Ziele, Ketten aufgelöst) liegt vor und kann direkt in eine nginx-Conf übersetzt werden.

## Stichproben dopaspeak.com — Redirects teilweise aktiv

| URL | Ergebnis |
|---|---|
| /en/learn-with-music/ | ✅ 301 → /en/language-learning-app/ (200) |
| /de/ | ✅ 301 → / (200) |
| /ar/taallum-aliabania/ | ❌ 404 — keine Regel |
| /de/yds-vorbereitung-erfahrungen/ | ❌ 404 — keine Regel |
| /en/learn-georgian-reviews/ | ❌ 404 — keine Regel |

Die deployte Sprint2-Conf (≈80 Regeln) greift, deckt aber nur einen Teil der ~1000 gelöschten Alt-URLs ab. Für den exakten Volltest aller 80 Regeln wird die Datei `DopaSpeak/gsc_audit_2026-06-10/sprint2_404fix_nginx_redirects.conf` benötigt (Quelle-Ziel-Paare).

## NACHTRAG — Deploy + finaler Volltest (10.06., nachmittags)

Die 301-Conf wurde von René auf zoro deployt (Backup `mapraiders.bak_20260610_131521`, nginx -t ok, Include 4× nach server_name-Zeilen). **Finaler Volltest: 305/305 bestanden** — jede Quelle antwortet 301 direkt auf das Soll-Ziel, jedes Ziel 200, keine Redirect-Ketten; Unicode-Pfade dekodiert und percent-encoded verifiziert. Anschließend: 195 Stub-Dateien nach `docs/_retired/` archiviert, 103 interne Links von Stub-URLs auf finale Ziele umgeschrieben (Commit d06debc). AP1 = **Definition of Done erfüllt** (0 
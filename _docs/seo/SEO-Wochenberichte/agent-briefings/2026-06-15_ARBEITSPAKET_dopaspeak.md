# Arbeitspaket dopaspeak.com — SEO/GEO/AEO · 15.06.2026

**Property:** https://dopaspeak.com/ · **Quelle:** GSC (NUR LESEND). **Betreut ein anderer Agent** — dies ist ein Analyse-/Handoff-Paket, **kein Eingriff** von hier (keine Datei-/Server-/Conf-Änderung).
**Stand GSC:** 358 indexiert / **1.170 nicht indexiert** (8 Gründe) · 3 Klicks, 312 Impr. (7T), Ø Pos. 19,7 · keine manuellen Maßnahmen. Mehrsprachig (de/en/ar/ja/zh/pt/tr/ru/hi/es…).

## Nicht-indexiert-Diagnose (mit Beispiel-URLs aus GSC)

| Grund | Anzah| Validierung | Beispiel-URLs | Interpretation |
|---|---|---|---|---|
| **Alternative Seite mit kanon. Tag** | **895** | Gestartet | `/en/learn-with-music/`, `/en/learn-georgian-reviews/`, `/de/yds-vorbereitung-erfahrungen/`, viele `/ar/taallum-*`, `/ar/...-tajarub/` | **Größter Block.** Review-/Erfahrungs-Varianten-Slugs (`-reviews`,`-erfahrungen`,`-tajarub`,`-avaliacoes`) + sehr viele `/ar/`-Seiten zeigen per Canonical auf eine andere Version → bewusst (Dubletten) ODER hreflang-Cluster defekt |
| **Nicht gefunden (404)** | **82** | **Fehlgeschlagen** | `/pt/aprender-frances-avaliacoes/`, `/zh/xue-putaoyayu/`, `/ja/supein-go-wo-manabu/`, `/de/chancenkarte-deutsch-lernen/`, `/en/hebrew-for-aliyah/` | Relaunch-Slug-Wechsel ohne 301. **Locale-Code-Mismatch**: `/pt/` (statt `/pt-br/`?), `/zh/` (statt `/zh-cn/`?) |
| Seite mit Weiterleitung | 92 | Nicht gestartet | — | offene Weiterleitungen aus Relaunch |
| Gecrawlt – nicht indexiert | 64 | Nicht gestartet | — | Crawl-Budget/Dünninhalt |
| Gefunden – nicht indexiert | 33 | Gestartet | — | Indexierungs-Warteschlange |
| 403 blockiert | 2 | Nicht gestartet | — | Zugriffsschutz prüfen |
| noindex | 3 | Gestartet | — | gewollt? |
| Duplikat – Google wählt Canonical | 2 | Nicht gestartet | — | gering |

## Kernbefund
Klassische **Relaunch-ohne-sauberes-301/Canonical-Mapping**-Altlast (deckt sich mit GSC-Audit 10.06.). Drei zusammenhängende Symptome:
1. **82 fehlgeschlagene 404** — alte/umbenannte Slugs ohne 301; teils Locale-Code-Mismatch (`/pt/`,`/zh/`).
2. **92 offene Weiterleitungen** — Redirect-Ketten/Endziele nicht final.
3. **895 Canonical-Ausschlüsse** — größter Hebel; v. a. Review-Varianten-Slugs und `/ar/`-Cluster.

Sichtbarkeit besteht (312 Impr./Woche, mehrsprachig, impressionsstarke Seiten wie `/en/features/learn-through-music/` 0/49, `/methode/dekodierung/` 0/31) — wird aber durch die Indexierungslage gedeckelt.

## Empfohlene Maßnahmen (für den zuständigen dopaspeak-Agenten)
1. **404 (82):** alte Slugs auf finale 200-Ziele **301-mappen**; Locale-Code-Schema vereinheitlichen (`/pt/`→`/pt-br/`, `/zh/`→`/zh-cn/` o. ä., konsistent zur Sitemap).
2. **Weiterleitungen (92):** Redirect-Ketten auf **einen** finalen 200-Hop reduzieren.
3. **Canonical (895):** klären ob die Review-/Erfahrungs-Varianten **gewollte Dubletten** sind (dann ok, bewusst per Canonical gebündelt) oder **Fehlkonfiguration** (dann hreflang/Canonical je Sprachcluster reparieren). `/ar/`-Cluster separat prüfen (eigene Canonical-Logik?).
4. **AEO/GEO:** impressionsstarke 0-Klick-Seiten (`learn-through-music`, `dekodierung`) on-page für Featured Snippets/Answer-Engines optimieren (FAQ-Schema, prägnante Antwort-Blöcke).

## Snippet-Berichte (Shopping/Produkt)
GSC zeigt für dopaspeak zusätzlich „Produkt-Snippets", „Bild-Metadaten", „Rezensions-Snippets" im Menü — **vom zuständigen Agenten** auf Validierungsstatus prüfen (hier nicht geöffnet, da read-only Handoff).

*GSC ausschließlich gelesen. Umsetzung ausschließlich durch den dopaspeak-Agenten; Ergebnis zur Quer-Prüfung gern an mich zurück.*

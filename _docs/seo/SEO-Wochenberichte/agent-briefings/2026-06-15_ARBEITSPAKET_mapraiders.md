# Arbeitspaket mapraiders.com — SEO/GEO/AEO · 15.06.2026

**Property:** https://mapraiders.com/ · **Quelle:** GSC (nur lesend) + vollständiges Codebasis-Audit (`docs/`).
**Architektur:** Python-generierte Static-Site. `docs/*.html` = Build-Output → **niemals gebaute HTML direkt editieren**, immer die Build-Skripte fixen, dann neu bauen. Gate: `python3 docs/_validate_seo.py` (+ `_check_dead_links.py`). **Sandbox aktuell aus** → Ausführung sobald verfügbar / durch René.
**Stand GSC:** 544 indexiert / 357 nicht · 15 Klicks, 347 Impr. (7T) · keine manuellen Maßnahmen · 0 externe Backlinks.

## Inventar
~958 HTML-Dateien, davon ~215 in `docs/_retired/` (robots-blockiert, nicht in Sitemap) → **~743 live**, 16 Locales. Sitemap: ~848 URLs.
Seitentypen: Startseiten (16), `features/*` (6×Sprache), `vs/*` (Pokémon GO, Ingress, Geocaching, Zenly), `howto/*` (Hub + Artikel), Nischen-Landings (`jogging/`, `hundespaziergang/`, `fitness-mmo/`…), pSEO-Slugs + Review-Dubletten (`geocaching-alternative-kostenlos`, `games-like-pokemon-go`, `who-owns-pokemon-go`…), Legal, Explainer.

## Priorisierte Maßnahmen

### 🔴 KRITISCH 1 — Self-Review-Spam entfernen (NEU, höchste Prio)
`AggregateRating` 5.0 + 3 immer gleiche „Tester" (Ron C., Vivian N., Aljoscha P.) als JSON-LD in **569 Live-Seiten** (Marker `PHASE-K-FOUNDER-JSONLD`, gesetzt von `_apply_founder_reviews.py`). Selbst-gehostete Bewertungen für das eigene Produkt sind seit 2019 **richtlinienwidrig** → Risiko: Entzug aller Review-Rich-Results bis hin zu manueller Maßnahme.
**Fix:** `docs/_apply_remove_review.py` sitewide ausführen (Review + AggregateRating-JSON-LD entfernen). Falls Reviews gewünscht: auf **eine** Hub-Seite mit echten, verifizierbaren Bewertungen beschränken. Danach `_validate_seo.py`.

### 🔴 KRITISCH 2 — hreflang reparieren (= Ursache „Duplikat-Canonical", 33 GSC-URLs)
`hreflang="en-IN"` (und Region-Variants) fehlt auf allen Unterseiten außer den Startseiten — Phase 0c (`_apply_hreflang_v2.py`, Z.7–8) wurde nur teilweise ausgeführt. Beispiel: `docs/en-in/vs/geocaching.html` hat **keine** en-IN-Selbstreferenz, und `docs/vs/geocaching.html` bindet en-IN **nicht reziprok** ein. Ohne saubere Cluster wählt Google einen eigenen Canonical → genau die GSC-Befunde (`/id/features/echos.html`, `/es-mx/vs/geocaching.html`, `/es/vs/ingress.html` …).
**Fix:** Phase-0c-Skript für **alle** Seitentypen (vs/features/howto/Nischen) ausführen: en-IN + Region-Variants + Selbstreferenz + Return-Tags. Tools vorhanden: `_clean_hreflang.py`, `_repair_hreflang.py`. Locale-Codes sind korrekt (`es`→`/es-mx/`, `zh-Hans`→`/zh-cn/`). Danach `_validate_seo.py` = 0 hreflang-Fehler.

### 🔴 KRITISCH 3 — tote Links beseitigen (= Ursache „404 fehlgeschlagen", 36 GSC-URLs)
GSC-404-Beispiele: `/en-in/howto/clans/`, `/en-in/howto/territories/`, `/id/howto/echos/`, `/howto/klangs.html`, `/fr/howto/mini-jeux-defence.html`, `/en-in/vs/pokemon-go/`, `/es/vs/zenly.html`, `/pt-br/-corrida/` (fehlerhafter Slug). Ursache: interne Links zeigen auf nicht (in dieser Sprache) existierende Ziele bzw. falsche URL-Form (Trailing-Slash statt `.html`). Der `howto/`-Hub ist nicht in allen Locales vollständig.
**Fix:** `docs/_check_dead_links.py` ausführen → Top-Ausgabe abarbeiten: tote Ziele entweder bauen oder den Link sprachbedingt ausblenden; fehlerhafte Slugs (`/-corrida/`) korrigieren/410. href-Vergabe sitzt in „Phase J" + `_apply_killer_slugs.py`/`_apply_explainer_links.py`/`_build_phase1_*.py`. Danach René die 404- + Canonical-Validierung in GSC **neu** starten.

### 🟡 MITTEL
4. **301 `/es/*`→`/es-mx/*` und `/pt/*`→`/pt-br/*` serverseitig verifizieren** (alte Pfade nur noch in `_retired/`; Live-Stichprobe `/es/`→`/es-mx/` ist grün, aber Vollabdeckung prüfen — veraltete `/es/`-URLs noch im Google-Index).
5. **Sitemap-Deploy-Konsistenz:** `sitemap.xml` + `sitemap-index.xml` beide live (robots verweist auf Index). Nach hreflang-Fix Vollabgleich Dateiliste ↔ Sitemap (en-in-Unterseiten enthalten?).
6. **Crawl „Verschoben (Sonstiges)" 9 %** beobachten (90-Tage-Fenster, 301-Deploy jung) — in 1–2 Wochen erneut.
7. **0 externe Backlinks:** `OUTREACH_KIT_2026-06-10.md` versenden (nur René). Pitch #1 switchbladegaming zuerst (deckt Top-Klick-Seite `games-like-pokemon-go.html`).

### 🟢 NIEDRIG
8. **COMING-SOON-MODE** sitewide aktiv (gewollt, Pre-Launch) → vor Go-Live `_revert_coming_soon.py`, `offers.availability` auf verfügbar.
9. **`id/terms.html`** noindex-Stub (gewollt) — Konsistenz der Legal-Stubs über Locales prüfen.
10. **Descriptions teils >160 Z.** (z. B. `en/games-like-pokemon-go.html`) — kosmetisch.

## GEO/AEO-Bewertung
Solide: JSON-LD VideoGame/MobileApplication, FAQPage, HowTo, BreadcrumbList; `_apply_geo_tables.py` liefert BLUF-Fakten + Ownership-Kontext auf vs-Seiten; `llms.txt` vorbildlich (Genre, Ownership, 13 Sprachen, Core-Pages, Sitemap). **Nach Entfernen der Fake-Reviews** ist die strukturierte-Daten-Basis sauber. Nächster GEO-Schritt: konsistente Entitäts-Fakten + externe Belege (Backlinks) für LLM-Grounding.

## Ausführungs-Reihenfolge (für den mapraiders-Agenten)
1. `_apply_remove_review.py` → 2. Phase-0c hreflang (+ `_repair_hreflang.py`) → 3. `_check_dead_links.py`-Funde fixen → 4. **Build** → 5. `_validate_seo.py` = 0 Fehler + `_check_dead_links.py` = 0 → 6. `tsc --noEmit` = 0, commit → 7. **René** startet GSC-Neuvalidierung (404 + Canonical) und prüft URL-Inspection-Stichproben. Ergebnis zur Kontrolle an mich zurück.

*GSC ausschließlich gelesen. Keine gebauten HTML-Dateien direkt patchen — nur Build-Skripte.*

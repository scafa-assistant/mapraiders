# mapraiders.com: Nicht-indexierte Seiten, Analyse + umgesetzte Fixes, 2026-07-13

## Befund (GSC-Drilldown, 87 Seiten „gecrawlt – zurzeit nicht indexiert")
Analyse aller 87 URLs (Liste: `mapraiders_gecrawlt_nicht_indexiert_87.txt`):

- **36 von 87 hatten KEIN hreflang** (sitewide 219 Waisen laut Validator). Es sind die Adjacent-Intent-Nischenseiten (yuruyus-oyunu, 산책게임, 宝探しアプリ, handyspiel-zum-laufen …), die pro Locale ausgerollt, aber nie zu Sprachclustern verdrahtet wurden. Google konnte die Varianten nicht clustern → isolierte „Thin Pages" → keine Indexierung.
- **41 von 87 hatten keinen Link von ihrer eigenen Locale-Homepage.** Pikant: Die Homepages verlinkten die REVIEW-Varianten (…-yorumlar, …-후기), aber nicht die Basis-Geldseiten. PageRank floss in die falsche Richtung.
- 5 Legal-/About-Seiten (利用規約, الشروط, syarat, शर्तें, sobre-nosotros): nicht in der Sitemap, wertlos für Index, KEIN Handlungsbedarf, dass Google sie nicht indexiert, ist korrekt.
- `/pt/cacada-tesouro/` existiert lokal nicht mehr (Altlast, fällt von selbst raus).
- Base↔Review-Querverlinkung und Sitemap-Abdeckung waren bereits in Ordnung.

## Umgesetzt (heute, im Repo)

**1. `docs/_apply_niche_hreflang.py` (neu): 19 hreflang-Cluster, 162 Seiten verdrahtet.**
Verifizierte Themengruppen über bis zu 16 Locales: mapraiders-reviews, treasure-hunt (+reviews), walking-app (+reviews), territory-game-reviews, location-game-reviews, pokemon-go-alternative-free (+reviews), games-like-pokemon-go (+reviews), fake-gps (+reviews), neighborhood-game (+reviews), pokemon-go-saudi (+reviews), f2p-location-game (+reviews). Selbstreferenz + Reziprozität + x-default (en, sonst de) nach Site-Konvention. Bewusst lokale Seiten (cricket-fan, ramadan, koin-jagat, ドラクエウォーク, 無VPN, 香港行山, woog, gaiasmart, draconius, EGE/YDS …) bleiben absichtlich ohne Cluster. hreflang-Waisen: 219 → 59 (Rest = Absicht + 404.html).

**2. `docs/_apply_home_discover_links.py` (neu): 75 Homepage-Links ergänzt.**
Alle 16 Locale-Homepages verlinken jetzt ihre Basis-Nischenseiten in der „Mehr entdecken"-Spalte (Marker `PHASE-M2-LINK`, idempotent, Ankertext = Title-Keyword).

**3. Verifikation:** `python3 docs/_validate_seo.py` → 763 Seiten, **alle Gate-Prüfungen bestanden**, beide Skripte idempotent (2. Lauf = 0 Änderungen).

## Offen für René (2 Handgriffe)

1. **Commit + Push vom lokalen Rechner** (Sandbox kann `.git/index.lock` nicht löschen, bekannter Blocker; zwei stale Locks liegen als `.git/index.lock.stale*_20260713`):
```bash
cd ~/Desktop/MapRaiders
rm -f .git/index.lock .git/index.lock.stale_20260713 .git/index.lock.stale2_20260713
git add docs/_apply_niche_hreflang.py docs/_apply_home_discover_links.py
git add docs/*.html docs/*/ SEO-Wochenberichte/
git commit -m "seo: hreflang-Cluster für 162 Nischenseiten (19 Gruppen) + 75 Homepage-Discover-Links (GSC 'gecrawlt, nicht indexiert' Fix 2026-07-13)"
git push
```
ACHTUNG: `git status` zeigt ~730 modifizierte Dateien, der Großteil sind Zeilenende-Artefakte aus früheren Sessions, nicht Teil dieses Fixes. Wenn nur der Fix committet werden soll: Dateiliste der 178 geänderten Dateien = alle Pfade aus den GROUPS/ADDITIONS-Tabellen der beiden neuen Skripte.
2. **Deploy** wie üblich (Hetzner), danach in GSC NICHTS neu validieren müssen, Google recrawlt die 87 von allein; Kontrolle im Wochenmonitoring ab ~27.07.

## Erwartung
Die 87er-Gruppe sollte in 2–4 Wochen sichtbar schrumpfen (hreflang-Cluster + Hub-Links sind genau die zwei Signale, die den indexierten Schwestern-Seiten den Unterschied gaben: 60–110 interne Links + volles Cluster vs. 6–18 Links + kein Cluster). Nebeneffekt: auch die 37 „Duplikat – Google wählt anderes Canonical" profitieren von sauberen Clustern.

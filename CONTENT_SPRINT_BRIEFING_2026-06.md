# Content-Sprint-Briefing: Keyword-Universum umsetzen (ab 11.06.2026)

**Strategie-Quelle:** `LINKQUELLEN_UND_WACHSTUM_2026-06-10.md` · **Guardrails:** Briefing 10.06. gilt (GSC nur lesen, Validator vor jedem Publish)

## Arbeitsweise (für jede Seite identisch)
1. **Template klonen, nicht neu erfinden:** Beste bestehende Seite des Typs als Basis (Vergleich → `en/vs/pokemon-go.html`; Feature-Nische → `jogging/index.html`; Ratgeber → neu nach gleichem Grundgerüst). Übernehmen: Head-Aufbau, Canonical, FAQPage-Schema, geo-tldr-Absatz, Sharing, Breadcrumb-Schema, Lang-Switcher.
2. **Pro Seite Pflicht:** self-canonical · `geo-tldr`-Faktenabsatz · FAQPage (3–5 echte Fragen) · interne Brücke auf 2–3 passende Bestandsseiten · KEINE erfundenen Zahlen/Mechaniken (Spielfakten nur aus `server/src/config/constants.ts`/GDD).
3. **Nach jedem Batch:** Seite(n) in `sitemap.xml` ergänzen (lastmod setzen) · falls Übersetzungspaar existiert: hreflang-Set reziprok inkl. Selbstreferenz · `python3 docs/_validate_seo.py` muss sauber bleiben (Reststand 232) · Commit pro Batch · René pusht.
4. **Staffelung:** max. 6 neue Seiten pro Woche bis zum Indexierungs-Review (Juli). Reihenfolge unten einhalten. Jede Welle 4 Wochen im Montags-Monitoring beobachten, bevor Ausbau.

## Sprint 1 (sofort): Social Welle 1 — 6 Seiten
| # | URL | Fokus-Query | Brücken auf |
|---|---|---|---|
| 1 | /en/zenly-alternative.html | zenly alternative | en/vs/zenly, features/territories |
| 2 | /zenly-alternative.html (de) | zenly alternative deutsch, freunde karte app | de-Pendants |
| 3 | /en/meetup-alternative.html | meetup alternative free | en/about, features |
| 4 | /leute-kennenlernen-app.html (de) | leute kennenlernen app ohne dating | Meetups/Clans-Inhalte |
| 5 | /en/discord-alternative-outdoor.html | discord alternative for outdoor crews | howto/clans |
| 6 | /nachbarschafts-app.html (de) | nachbarschafts app, facebook gruppen alternative | features/echos |
Hinweis: zenly-alternative-reviews.html (en) existiert — neue Seite als Haupt-LP, Review-Seite intern verlinken, KEIN Duplikat.

## Sprint 2: Genre-Felder — 6 Seiten
/eroberungsspiel.html + /en/real-world-risk-game.html · /schatzsuche-app.html + en-Pendant prüfen (treasure-hunt existiert!) · /verstecken-fangen-app.html + /en/gps-manhunt-game.html. Frame: Eroberung/Risiko — nie Kriegs-/Geopolitik-Frame.

## Sprint 3: Ideen-Hub-Pilot — 5 Seiten (de)
Hub /ideen/ + die 5 Pilot-URLs aus dem Wachstumsdoc. Format: ehrlicher Ratgeber (10–12 Ideen, MapRaiders als EINE davon), eigene Silo-Sitemap `sitemap-ideen-de.xml` in den Index einhängen.

## Sprint 4 (ab Juli, nach Indexierungs-Review >85 %): pSEO Stadtteile + Welle-2-Skelette (TikTok/Live — erst mit Social-Layer-Launch publizieren).

## Messung
Montags-Monitoring ergänzt ab Sprint 1: Impressionen/Klicks der Neu-Seiten als eigene Zeile. Erfolgskriterium pro Seite nach 4 Wochen: >20 Impressionen ODER Position <20 für Fokus-Query → sonst Title/Content nachschärfen statt neue Seiten.

# Session-Übergabe SEO-Sanierung — 10.06.2026, abends

**Für:** Nächste Session / Terminal-Agent · **Kontext:** `AGENT_BRIEFING_MAPRAIDERS_SEO_2026-06-10.md` gilt weiter (Guardrails!)

## Erledigt heute (alle Commits gepusht, Stand 752493e)

| Was | Beleg |
|---|---|
| GSC-Vollaudit (3 Properties) + Ursachenanalyse | `SEO_GSC_Analyse_2026-06-10.md` |
| hreflang site-weit repariert (510 Seiten, reziprok, zh-Hant neu) | Commit 23410f2, live verifiziert |
| Sitemap bereinigt (755→671, nur indexierbare 200er) | Commit 23410f2 |
| 965 tote interne Links gefixt | Commit 23410f2 |
| Rezensions-Snippets-Fix (translationOfWork, nested itemReviewed, 13 JSON-LD-Fehler) | Commits f649b74, 2d48c46 |
| GSC: phase1-Sitemap raus, Sitemap neu eingereicht, 4 Validierungen gestartet (10.06.) | mit René-Freigabe |
| Redirect-Volltest: 305 Varianten | `REDIRECT_VOLLTEST_2026-06-10.md` |
| AP1: nginx-Conf (305 Regeln) + Deploy-Script | `mapraiders_301_migration.conf`, `deploy_mapraiders_301.sh` |

## Kernbefund
mapraiders.com läuft auf **nginx (zoro)**, nicht GitHub Pages. **0 von 195 Stub-URLs leiten um** — die Locale-Migration ist live weiterhin nur Meta-Refresh+noindex. Die fertige, zielverifizierte 301-Conf liegt im Repo-Root.

## Nächste Schritte (Reihenfolge)
1. **René/Terminal-Agent:** `scp mapraiders_301_migration.conf root@159.69.157.42:/root/` → `bash deploy_mapraiders_301.sh` auf zoro (Script macht Duplikat-Check, Backup, nginx -t, curl-Proben).
2. **Danach Agent:** 305er-Volltest wiederholen (Quelle: `redirect_matrix.json`-Logik bzw. Conf; Soll: alle 301→finale 200). Schnelltest: `/es/` muss 301 auf `/es-mx/` geben.
3. Stubs nach `docs/_retired/` verschieben, committen.
4. Sitemap-Doppeleinreichung auflösen (Empfehlung: nur sitemap-index.xml behalten).
5. **Nur René:** GSC-noindex-Validierung (89) starten.
6. AP4 (Locale-Entscheidungsvorlage) + AP6 (Linkquellen-Liste, 0 Backlinks) sind unbearbeitet.

## Guardrails (unverändert)
- dopaspeak.com macht ein anderer Agent — Ordner/Conf nicht anfassen.
- GSC ab jetzt nur lesen; schreibende Aktionen klickt René.
- Kein Meta-Refresh, kein noindex als Migrationswerkzeug; jede Server-Änderung mit Backup + nginx -t + curl-Doku.
- Vor jedem Seiten-Rollout: `python3 docs/_validate_seo.py` (CI-Gate; bekannte Rest-Fehler: 232 tote Sprachumschalter-Slugs, /press/ existiert nicht).

## Laufende GSC-Validierungen (nicht stören, Kontrolle ab ~17.06.)
Rezensions-Snippets itemReviewed+author (je 156), Duplikat-Canonical (35), 404 (33) — gestartet 10.06. · 403 (2) seit 19.05. · Gefunden–nicht indexiert (130) seit 11.05.

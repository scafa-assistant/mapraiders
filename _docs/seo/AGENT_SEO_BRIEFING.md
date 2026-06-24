# Agent-Briefing — mapraiders.com (SEO/GSC)
*Stand 15.06.2026. Für jeden neuen Agenten in diesem Projektordner. Ergänzt `CLAUDE.md`.*

## Auftrag in einem Satz
Technik ist „gut genug" — der Engpass ist Autorität & Distribution, nicht weitere On-Page-Optimierung.

## Betriebsmodus & Guardrails (gelten immer)
- **Google Search Console NUR LESEN.** Keine Validierungen starten, nichts einreichen/entfernen, keine Einstellungen ändern. Schreibende GSC-Klicks macht ausschließlich René.
- Vor jedem Seiten-Rollout: `python3 docs/_validate_seo.py` (CI-Gate; bekannter Reststand ~232 tote Sprachumschalter-Links, `/press/` existiert nicht).
- Jede Server-/nginx-Änderung mit Backup + `nginx -t` + curl-Probe dokumentieren. nginx läuft auf zoro (root@159.69.157.42). Lektion: `sed -i s//` NIE in `server_name`-Zeilen.
- Server muss kompilieren: `cd server && npx tsc --noEmit` (0 Fehler).
- Code-Änderungen erlaubt (das ist das Haupt-Repo). Nach jeder Phase committen.

## Aktueller SEO-Stand
- Indexiert 544 / nicht indexiert 357 (Index-Stand 12.06.). hreflang, 13 Sprachen, 301-Migration (195 Stubs → `docs/_retired/`), Rezensions-Snippets saniert (3 ungültig / 252 gültig).
- **Offen, kritisch:** 404- und Duplikat-Canonical-Validierung in GSC stehen auf „Fehlgeschlagen" → Resturschen im Repo finden/fixen, dann René neu-validieren lassen.
- **Wachstums-Engpass: 0 verweisende Domains.** OUTREACH_KIT liegt versandbereit (Versand nur René).
- Leistung 7T: ~15 Klicks / 347 Impressionen, Ø Position 10,4.

## Prioritäten für einen neuen Agenten (in dieser Reihenfolge)
1. **Distribution > Technik.** Backlinks/Launch (Product Hunt, Reddit, App-Verzeichnisse, Gaming/Fitness-Blogs), Play-Store-Präsenz. Ziel: 0 → 10–20 echte verweisende Domains.
2. Technik nur noch als *einmaliger* Cleanup-Pass (232 tote Links, 2 fehlgeschlagene Validierungen) — danach einfrieren. Kein neuer hreflang-/pSEO-Ausbau ohne Traffic-Beleg.
3. pSEO-Stadtteile erst nach Indexierungs-Review (gestaffelt 25–50/Woche) — nicht vorziehen.

## Berichte & Monitoring
- Globaler Ordner: `SEO-Wochenberichte/` (Übersicht + Einzelbericht je Projekt).
- Scheduler: `seo-wochenmonitoring-global` (Mo, nur lesend, alle Properties). Bericht-Leitkennzahlen: **Klicks & verweisende Domains zuerst**, Index-/Validierungszahlen sind Hygiene.

## Was NICHT tun
- dopaspeak.com-Ordner/-Conf nicht anfassen (anderer Agent).
- Kein Meta-Refresh / noindex als Migrationswerkzeug.
- GSC nicht schreibend bedienen.

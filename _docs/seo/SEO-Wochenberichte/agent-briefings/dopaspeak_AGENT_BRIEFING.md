# Agent-Briefing — dopaspeak.com (SEO/GSC)
*Stand 15.06.2026. In den dopaspeak-Projektordner legen. NICHT die bestehende CLAUDE.md/Instruktion überschreiben — anhängen oder als separate Datei.*

## Was dieses Projekt ist
Mehrsprachige Sprachlern-App-Website (Duolingo-Alternative, „Lernen über Musik / Dekodierung"). Eigener Agent/Workflow.

## Betriebsmodus & Guardrails
- **Google Search Console NUR LESEN.** Keine Validierungen, keine Einreichungen, keine Entfernungen. Schreibende GSC-Aktionen nur René.
- Dieses Projekt wird von einem **eigenen Agenten** betreut. Ein Cross-Projekt-Agent (z. B. aus dem MapRaiders-Ordner) fasst hier **keine Dateien/Server/Conf** an — nur GSC lesen und melden.

## Aktueller Stand — KRITISCH (Index-Stand 12.06.)
- **Indexiert 358 vs. nicht indexiert 1.170.** Größtes Problem im gesamten Portfolio.
- Nicht-indexiert-Gründe: 404-Validierung **fehlgeschlagen (82)**, „Seite mit Weiterleitung" 92 (offen), **„Alternative Seite mit kanonischem Tag" 895**, Gecrawlt-nicht-indexiert 64, Gefunden-nicht-indexiert 33.
- Ursache passt zu **Relaunch ohne sauberes 301-/Canonical-Mapping**.
- Leistung 7T: 3 Klicks / 312 Impressionen, Ø Pos. 19,7. Keine manuellen Maßnahmen.

## Prioritäten für den zuständigen Agenten
1. **301-Mapping reparieren:** alte 404-URLs + 92 Weiterleitungen auf finale 200-Ziele leiten (keine Ketten, kein Meta-Refresh).
2. **Die 895 Canonical-Ausschlüsse prüfen:** gewollt (Duplikate/Sprachvarianten) vs. Fehlkonfiguration. Das ist der größte Index-Hebel.
3. Erst danach Content/Backlinks. Technik geht hier vor.

## Berichte
- Lese-Befunde landen im globalen Ordner des MapRaiders-Workspaces: `SEO-Wochenberichte/JJJJ-MM-TT_dopaspeak.md`. Wöchentlich vom Scheduler `seo-wochenmonitoring-global` (nur lesend).

## Was NICHT tun
- GSC nicht schreibend bedienen. Keine massenhaften noindex/Entfernungen als „Aufräumen".

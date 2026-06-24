# SEO-Wochenübersicht — alle Projekte · 15.06.2026

**Quelle:** Google Search Console (nur lesend) · **Index-Stand:** 10.–12.06.2026 · **Leistungszeitraum:** 07.–13.06.2026 (7 Tage)
**Properties:** mapraiders.com · dopaspeak.com · egons.io · ungehoert.music

## Portfolio-Snapshot

| Projekt | Indexiert | Nicht idx. | Klicks 7T | Impr. 7T | Ø Pos. | Man. Maßn. | Ampel |
|---|---|---|---|---|---|---|---|
| mapraiders.com | 544 | 357 | 15 | 347 | 10,4 | keine | 🟡 |
| dopaspeak.com | 358 | **1.170** | 3 | 312 | 19,7 | keine | 🔴 |
| egons.io | 12 | 0 | 0 | 6 | 12,5 | keine | 🟢 |
| ungehoert.music | 7 | 3 | 0 | 6 | 52,2 | keine | 🟢 |

*Alle Werte stabil gegenüber dem Vorbericht — keine neuen kritischen Befunde, keine manuellen Maßnahmen/Sicherheitsprobleme in irgendeiner Property.*

## Wichtigste Erkenntnisse

- **🟢 Keine Verschlechterung portfolioweit:** Indexierung, Leistung und Fehlerbilder aller vier Properties sind identisch zur Vorwoche. Keine manuellen Maßnahmen, keine Sicherheitsprobleme.
- **🔴 dopaspeak.com — Indexierungs-Altlast unverändert:** 1.170 nicht indexiert vs. 358 indexiert. 404-Validierung weiter **fehlgeschlagen (82)**, 92 offene Weiterleitungen, **895 Canonical-Ausschlüsse**. Relaunch-ohne-301-Altlast. **Betreut anderer Agent** — nur gemeldet, nicht angefasst.
- **🔴/🟡 mapraiders.com — stabil mit zwei offenen Validierungen:** 544 idx / 357 nicht idx. 404 (36) und Duplikat-Canonical (33) stehen weiterhin auf „Fehlgeschlagen". Live-Stichproben grün: `/es/`→`/es-mx/` (301→200), `/llms.txt` (200). Externe Backlinks weiter 0.
- **🟢 egons.io & ungehoert.music — sauber, kaum Sichtbarkeit:** technisch fehlerfrei, je 6 Impressionen/Woche, 0 Klicks. Hebel: Content/Backlinks, nicht Technik.

## Empfohlene nächste Aktionen

1. **dopaspeak:** Mit zuständigem Agenten 301-Redirects + Canonical-Strategie klären (größter Hebel im Portfolio).
2. **mapraiders:** Fehlgeschlagene 404/Dup-Canonical-Validierungen lesend aufschlüsseln, Resturschen fixen, dann René neu-validieren lassen; Outreach-Versand starten (0 Backlinks).
3. **egons.io / ungehoert.music:** Inhalte/Backlinks ausbauen — technisch sauber, aber kaum Sichtbarkeit.

## Hinweise zum Lauf

- GSC ausschließlich gelesen (Guardrail eingehalten — keine Validierung gestartet, nichts eingereicht/entfernt/geändert).
- Lokaler Check `_validate_seo.py` konnte nicht laufen — die Linux-Sandbox war diesen Lauf nicht verfügbar. Beim nächsten Lauf nachholen.

*Einzelberichte je Projekt liegen im selben Ordner.*

# SEO-Monitoring-Briefing, ungehoert.music

> **Handover:** Zum Einfügen in das ungehoert.music-Repo (z. B. `seo-strategy/SEO_MONITORING_BRIEFING.md`). Aus dem globalen Wochenmonitor erzeugt, Repo ist in der Monitor-Session nicht gemountet.

**Letzte Aktualisierung:** 2026-07-01 (aus `SEO-Wochenberichte/2026-07-01_ungehoert-music.md`).

## Aktueller Status (2026-07-01)

| Bereich | Stand | Ampel |
|---|---|---|
| TLS/Cert live (Chrome) | lädt normal | 🟢 |
| Manuelle Maßnahmen | keine | 🟢 |
| Indexiert / nicht indexiert (GSC) | 7 / 3 | 🟡 |
| Leistung 7T | 0 Klicks · 0 Impr (Vw 1) | 🟡 |

## Dauer-Watch-List (worauf achten)

1. **Indexierbare Substanz fehlt (Hauptthema).** 7 Seiten indexiert, diese Woche 0 Impressionen. Die Startseite zeigt jetzt Artists-/Releases-/Global-Navigation, aber ohne veröffentlichte Release-/Artist-Seiten hat Google nichts zu werten. Solange keine Drops live sind, bleibt die Property unsichtbar.
2. **Konkreter Frontend-Bug (verifiziert 01.07.).** Der „Spotify"-Link auf der Startseite zeigt auf `https://open.spotify.com/track/undefined` (defekte Track-ID, `undefined` statt echter ID). Kein SEO-Blocker, aber toter Outbound-Link, bei Gelegenheit im Frontend fixen (Track-ID wird offenbar nicht gesetzt/gerendert).
3. **TLS wöchentlich.** Root in Chrome prüfen.

## Grenzen
- Monitor liest GSC nur. Frontend-Fix und GSC-Schreibaktionen laufen über das ungehoert-Repo/René.

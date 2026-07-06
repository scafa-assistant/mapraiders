# SEO-Monitoring-Briefing, MapRaiders

**Adressat:** Projekt-/SEO-Agent, der an mapraiders.com arbeitet.
**Zweck:** Lebende Watch-List. „Worauf achten wir gerade, was ist offen, was ist erledigt." Wird nach jedem Wochenlauf aktualisiert.
**Letzte Aktualisierung:** 2026-07-01 (aus Wochenlauf `SEO-Wochenberichte/2026-07-01_mapraiders.md`).

Der wöchentliche Lese-Monitor läuft automatisch (Scheduler `seo-wochenmonitoring-global`, GSC nur lesen). Die Zahlen unten kommen aus diesem Lauf, die Wochenberichte liegen in `SEO-Wochenberichte/JJJJ-MM-TT_mapraiders.md`.

---

## Aktueller Status (2026-07-01)

| Bereich | Stand | Ampel |
|---|---|---|
| TLS/Cert live (Chrome) | lädt normal, kein NET::ERR_CERT | 🟢 |
| Manuelle Maßnahmen | keine | 🟢 |
| Lokales Gate `docs/_validate_seo.py` | 763 Seiten, alle Gate-Prüfungen bestanden | 🟢 |
| Indexiert / nicht indexiert (GSC) | 544 / 357 | 🟡 |
| Leistung 7T | 7 Klicks · 377 Impr · CTR 1,9 % · Ø Pos 12,6 | 🟡 |
| Crawl-Qualität | 404 5 %, „Verschoben (Sonstiges)" 8 % | 🟡 |

---

## Dauer-Watch-List (worauf achten)

1. **TLS/Cert (kritisch, wöchentlich).** mapraiders.com läuft auf Hetzner-nginx mit Let's-Encrypt/certbot (90-Tage-Certs, Auto-Renew). Typischer Ausfall = fehlgeschlagenes Renew, dann ist die Domain für echte Chrome-/Safari-Nutzer praktisch down, obwohl curl/web_fetch noch verbinden. Prüfung: Property-Root in Chrome öffnen, echte Seite = 🟢, „Datenschutzfehler"/NET::ERR_CERT = 🔴. Fix gehört René (SSH/certbot), NICHT selbst eingreifen. Historie: Ausfall 22.06.2026, seitdem grün, aber GSC-Crawl-Hoststatus zeigt noch „in der Vergangenheit Probleme" als Nachwirkung.

2. **Lokales Gate `docs/_validate_seo.py` (vor jedem Deploy).** Muss „alle Gate-Prüfungen bestanden" melden. Am 22.06. grün, am 29.06. gebrochen (15× `fehlende_selbstreferenz` + 255× `homepage_fallback` durch neue `*/_legacy_index.html`-Dateien), seit 01.07. wieder grün. **Regel:** kein Deploy bei rotem Gate. Die ~219 `indexierbar_ohne_hreflang`-Warnungen sind KEIN Gate-Fehler, sondern Content-/Cluster-Aufgabe (siehe Punkt 5).

3. **Crawl-Qualität senken.** In GSC Crawl-Stats: „Verschoben (Sonstiges)" 8 % (Soll → 0) und 404 5 % sind die größten Hebel. Ursache in 301-Ketten / toten internen Links suchen. Basis-Dokument: `docs/PHASE_2_DEAD_LINK_FIX_PLAN.md`.

4. **„Gefunden/gecrawlt, nicht indexiert" (130 Seiten).** 67 „gefunden – nicht indexiert" + 63 „gecrawlt – nicht indexiert". Hebel: interne Verlinkung + Content-Tiefe der Cluster-Seiten, damit Google sie für indexierungswürdig hält. Kein technischer Fehler, sondern Autoritäts-/Link-Signal.

5. **219 `indexierbar_ohne_hreflang`.** Content-Aufgabe, keine Gate-Blockade: betroffene Seiten brauchen vollständige hreflang-Cluster-Anbindung bzw. Unique-Content-Tiefe. Langfristiger Reduktionspfad, kein Deploy-Blocker.

6. **Große Impressionsträger konvertieren nicht.** `games-like-pokemon-go.html` (~69 Impr/Woche) und `vs/zenly.html` (~22) mit CTR 0. Title/Meta/Snippet-Optimierung, nicht Technik.

## GSC-Stichproben, die grün bleiben müssen
- `https://mapraiders.com/es/` → 301 auf `/es-mx/`, Endstatus 200.
- `https://mapraiders.com/llms.txt` → 200, vollständiger Inhalt.
(Beide Stichproben setzen grünen Cert voraus. Bei Cert-Fehler nicht verifizierbar, dann als Folgebefund vermerken, nicht als separaten Redirect-Defekt.)

## Klargestellt / kein Handlungsbedarf
- **`docs/llms.txt` Kodierung:** Die Datei ist sauberes, valides UTF-8 (Pokémon, Gedankenstrich, japanische Zeichen alle korrekt, geprüft 01.07.). Falls ein Browser-Auslesetool Mojibake zeigt, ist das ein Render-/Charset-Artefakt des Clients, KEIN Datei-Fehler. Die Datei NICHT „reparieren". Einzige mögliche echte Ursache wäre ein fehlender `charset=utf-8`-Header auf der nginx-`text/plain`-Response, das wäre Server-Conf (René), kein Repo-Fix.

---

## Zuständigkeiten / Grenzen
- **GSC schreiben** (Sitemap einreichen, „Request Indexing", Validierungen starten): macht René selbst, siehe `GSC_BROWSER_AGENT_BRIEFING.md`. Der Monitor liest nur.
- **Server/nginx/certbot:** René. Nicht per SSH eingreifen.
- **Git-Push:** nur vom lokalen Rechner (Sandbox hat keine GitHub-Auth). Änderungen landen im Working-Dir, René committet/pusht.

## Ankerdokumente
- Wochenberichte: `SEO-Wochenberichte/`
- Framework: `docs/SEO_GEO_AEO_Framework_2026.md`
- Gate-Skript: `docs/_validate_seo.py`
- GSC-Schreib-Briefing: `seo-strategy/GSC_BROWSER_AGENT_BRIEFING.md`
- Dead-Link-Plan: `docs/PHASE_2_DEAD_LINK_FIX_PLAN.md`

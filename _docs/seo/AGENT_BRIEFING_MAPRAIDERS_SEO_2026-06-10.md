# AGENT-BRIEFING: MapRaiders SEO-Sanierung (Stand 10.06.2026, abends)

**Adressat:** Terminal-Agent (Claude Code) im MapRaiders-Projektordner
**Auftraggeber:** René Scafarti (Scafa Investment LLC)
**Lies zuerst:** `DopaSpeak/SEO_MASTER_LOG.md` (Pflicht; dort eintragen, was du tust). Falls nicht erreichbar: dieses Briefing ist autark, alle Fakten stehen hier.
**Arbeitsweise:** Keine Provisorien. Jeder Fix mit Verifikation. KEINE Meta-Refresh-Stubs, nur echte HTTP-301. Schreibende GSC-Aktionen macht nur René.

---

## 1. Verifizierter IST-Zustand (alle Daten von heute, 10.06.2026)

### GSC (Property https://mapraiders.com/)
- 500 indexiert / 381 nicht indexiert, 9 Gruende
- Validierung LAEUFT bereits (seit 10.06.) fuer: Nicht gefunden 404 (33), 403 (2), Gefunden zurzeit nicht indexiert (130), Duplikat Google-Canonical (35). NICHT anfassen, laufen lassen.
- Validierung NICHT gestartet fuer: **noindex (89)**, Alternative Seite mit kanonischem Tag (37), Seite mit Weiterleitung (9), Duplikat ohne User-Canonical (1), Gecrawlt nicht indexiert (45)
- Rezensions-Snippets: 156 ungueltig (itemReviewed fehlt + author fehlt), 168 Warnungen (itemReviewed in verschachteltem Objekt). Validierung laeuft seit 10.06. (2 Meldungen), Fix evtl. schon deployt; ergebnisoffen pruefen.
- Sitemaps: /sitemap-phase1.xml = tot ("Konnte nicht abgerufen werden", muss von René in GSC entfernt werden), /sitemap.xml und /sitemap-index.xml beide eingereicht mit identisch 755 Seiten (Doppel-Einreichung aufloesen: eine Quelle der Wahrheit).
- Crawl-Stats: 10 % der Antworten "Verschoben (Sonstiges)" = Nicht-301-Redirects (302/307/308). 6 % 404.
- Links: **0 externe Backlinks.** Interne Links werden von Sprach-Roots dominiert (/id/ 248, /ar/ 233, ... /en/ nur 46).
- Leistung 3 Monate: 43 Klicks, 1.450 Impressionen, Position 11,5. Staerkste Seite: /en/games-like-pokemon-go.html (303 Impressionen, +140 %). Staerkste Querys: pokemon go alternatives (25), pokemon go alternative (23), games like pokemon go (16), walking games (14), klanlar (14, TR!).
- Vollstaendiger GSC-Rohdaten-Export: `DopaSpeak/gsc_audit_2026-06-10/MAPRAIDERS_GSC_EXPORT_2026-06-10.md`

### Live-Verifikation (10.06., curl-aequivalent im Browser)
Die 89 noindex-Seiten sind **Meta-Refresh-Stubs**, identisches Muster wie bei dopaspeak:

| URL | Status | robots | refresh | canonical |
|---|---|---|---|---|
| /es/howto/clanes.html | 200 | noindex,follow | JA | /es-mx/howto/clanes.html |
| /zh/features/clans.html | 200 | noindex,follow | JA | /zh-cn/features/clans.html |
| /id/privacy-policy/ | 200 | noindex,follow | JA | /id/privacy.html |
| /pt/ | 200 | noindex,follow | JA | /pt-br/ |
| /es-mx/, /zh-cn/ | 200 | index,follow | nein | self |

**Diagnose:** Die Locale-Migration (es zu es-mx, pt zu pt-br, zh zu zh-cn, id-Slug-Renames) wurde per Soft-Redirect-Stubs statt HTTP-301 umgesetzt. Folgen: noindex-Flut in GSC, kein Linkjuice-Transfer, Crawl-Budget-Verschwendung, und die 10 % Nicht-301-Redirects.

## 2. Arbeitspakete in dieser Reihenfolge

### AP1: Stub-Inventur und 301-Matrix (hoechste Prioritaet)
1. Repo-weiter Scan: alle HTML-Dateien mit `http-equiv="refresh"` finden. Quelle-URL = Pfad, Ziel-URL = url= im refresh-Tag (Fallback: canonical).
2. Redirect-Ketten aufloesen (Stub zeigt auf Stub): nur finale Ziele verwenden.
3. Jedes finale Ziel pruefen: lokal echte Seite (kein refresh-Tag) UND live HTTP 200.
4. nginx-Conf generieren: `location = <pfad> { return 301 <ziel>; }`, fuer Verzeichnis-URLs beide Slash-Varianten, fuer .html-URLs nur exakt. Achtung nicht-ASCII-Pfade (ja/ko/zh): URL-encoded UND dekodiert testen.
5. Duplikat-Check gegen die aktive Server-Conf: `/etc/nginx/sites-available/mapraiders` (Server zoro, root@159.69.157.42; sites-enabled sind SYMLINKS, bei grep -R statt -r verwenden!). Doppelte exact-locations = nginx -t Fehler.
6. Vorlage/Blaupause: `DopaSpeak/gsc_audit_2026-06-10/sprint2_404fix_nginx_redirects.conf` + `deploy_sprint2_404fix.sh` (Deploy-Muster: Snippet nach /etc/nginx/snippets/, Include in sites-available/mapraiders, Backup, nginx -t, reload, curl-Stichproben).
7. Nach Deploy: Stub-Dateien aus Repo nach _retired/ verschieben, GSC-404-Liste (33) gegen Matrix pruefen und fehlende Mappings ergaenzen.
8. **Validierung "noindex" in GSC startet René manuell, NICHT du.** Sag ihm Bescheid, wenn deploy-verifiziert.

### AP2: Rezensions-Snippets endgueltig pruefen (156)
1. Ist-Zustand im Template pruefen: Review-Objekte duerfen NICHT lose im @graph stehen. Korrekt: als `review`-Property innerhalb der MobileApplication (dann KEIN itemReviewed im Review), jeder Review mit `author` (Person mit name) und `reviewRating`.
2. Da Validierung seit 10.06. laeuft: erst pruefen ob ein Fix schon deployt wurde (Live-HTML einer Beispielseite gegen Template vergleichen). Nur handeln, wenn live noch fehlerhaft.
3. Verifikation: 3 Beispielseiten durch https://search.google.com/test/rich-results bzw. schema-Validierung jagen.

### AP3: Sitemap-Hygiene
1. Doppel-Einreichung aufloesen: Entscheidung, ob sitemap.xml oder sitemap-index.xml die Quelle der Wahrheit ist (Empfehlung: index, wie bei dopaspeak). Die andere Datei serverseitig auf den Index 301en oder leeren. GSC-Entfernung der Alt-Einreichung + von sitemap-phase1.xml macht René.
2. Sicherstellen: keine Stub-URLs, keine noindex-URLs, keine Redirect-Quellen in den Sitemaps; nur kanonische 200er.

### AP4: Locale-Strategie (braucht René-Entscheidung, nur vorbereiten)
- Fakten: 130 Seiten "Gefunden, nie gecrawlt" und 35 Canonical-Foldings betreffen fast nur Regional-Varianten (en-in, es-mx, pt-br, zh-cn, zh-tw, plus ja/ko/ru/tr/hi/it/fr-Longtail).
- Erarbeite eine Entscheidungsvorlage: pro Locale-Paar (en vs en-in, es-mx als einzige ES-Variante etc.) Impressionen/Klicks aus GSC, Content-Unterschied (identisch vs. lokalisiert), Empfehlung behalten/zusammenlegen. KEINE Umsetzung ohne René-Go.

### AP5: Nicht-301-Redirects (10 % der Crawl-Antworten)
- Nach AP1-Deploy erneut pruefen (viele davon sind dann weg). Rest: Serverkonfig auf 302/307 durchsuchen, auf 301 umstellen, sofern permanent gemeint.

### AP6: Offpage-Grundstein (0 Backlinks)
- Nur Vorbereitung: Liste der 10 staerksten Seiten nach Impressionen + 20 relevante Linkquellen-Kandidaten (Gaming-/GPS-Game-Listicles, Pokemon-GO-Alternative-Roundups, Reddit/Foren-Threads). Keine Outreach-Mails ohne René.

## 3. Guardrails
- NIE Meta-Refresh als Redirect. NIE noindex als Migrationswerkzeug.
- Jede Server-Aenderung: vorher Backup der Datei, nginx -t vor reload, danach curl-Stichproben dokumentieren.
- GSC: nur lesen. Validierungen, Sitemap-Einreichungen, Entfernungen klickt René.
- Laufende Validierungen (404, 403, Gefunden, Duplikat, Rezensions-Snippets) nicht stoeren, keine Doppel-Fixes: erst Live-Zustand pruefen, dann handeln.
- Nach jedem AP: Eintrag in DopaSpeak/SEO_MASTER_LOG.md (Was, Verifikation, offene Reste).

## 4. Definition of Done
1. 0 Meta-Refresh-Stubs im Repo und live; alle Alt-URLs antworten 301 auf finale 200-Ziele.
2. nginx -t sauber, Crawl-Anteil "Verschoben (Sonstiges)" faellt Richtung 0 (Kontrolle in 2 Wochen).
3. Rezensions-Snippets: Validierung in GSC bestanden (Kontrolle in 1 bis 2 Wochen), 156 zu 0.
4. Eine Sitemap-Quelle, ohne tote/noindex/Redirect-URLs.
5. Entscheidungsvorlage Locale-Strategie liegt René vor.
6. SEO_MASTER_LOG aktualisiert.

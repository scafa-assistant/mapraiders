# Google Search Console — Technische Indexierungsanalyse

**Datum:** 10.06.2026 · **Datenstand GSC:** 01.06.2026 · **Analysierte Properties:** mapraiders.com, dopaspeak.com, ungehoert.music

Methodik: Vollständige Auswertung der GSC-Berichte (Seitenindexierung, Sitemaps, Drilldowns aller 9 Ausschlussgründe) + Abgleich mit dem Website-Quellcode in `docs/` + Live-HTTP-Checks. Jede Schlussfolgerung ist mit Daten belegt.

---

## Executive Summary

**Gesamtbild:** Google bewertet mapraiders.com aktuell als Website mit stark widersprüchlichen technischen Signalen. 500 von 881 bekannten Seiten sind indexiert (57 %). Die Nichtindexierung ist zu ~40 % selbst verursacht (noindex, Canonicals, 404) und zu ~60 % eine Vertrauens-/Qualitätsentscheidung von Google ("Gefunden/Gecrawlt – zurzeit nicht indexiert"), die direkt aus den widersprüchlichen Signalen folgt.

**Die 5 wichtigsten Probleme (Kurzfassung):**

1. **hreflang-Architektur defekt (kritisch):** 650 von 926 Seiten verlinken per hreflang auf Sprach-Homepages statt auf die äquivalente Unterseite. Google verwirft solche Sets (fehlende Return-Tags) — die Folge ist sichtbar im Bericht „Duplikat – Google hat andere kanonische Seite bestimmt" (35 Seiten) und in der schwachen Indexierung der Sprachversionen.
2. **80 noindex-URLs in der Sitemap (hoch):** Die Sitemap sagt „indexiere mich", die Seite sagt noindex. Direkt widersprüchliche Signale, die Crawl-Budget verbrennen und Googles Vertrauen in die Sitemap senken.
3. **102 hreflang-Verweise auf stillgelegte Locales** /es/, /pt/, /zh/ (hoch): Die Alternates zeigen auf Seiten, die selbst noindex tragen und per Canonical wegzeigen — tote hreflang-Ziele.
4. **dopaspeak.com: Relaunch ohne Redirects (kritisch für diese Domain):** ~1000 alte URLs wurden gelöscht und liefern 404 statt 301. 923 Seiten stehen noch als „Alternative Seite" im Index-Bericht und kippen nach und nach in 404 — die gesamte aufgebaute Equity geht verloren.
5. **Veraltete Sitemap-Einreichung (niedrig, aber rot):** `sitemap-phase1.xml` ist gelöscht (live 404), aber noch in GSC eingereicht → Dauerfehler im Sitemap-Bericht.

**Größte Chance:** Die 175 Seiten unter „Gefunden/Gecrawlt – zurzeit nicht indexiert" sind fertige, indexierbare Inhalte (komplette Sprachversionen). Sie warten nur darauf, dass Google der Site wieder vertraut. hreflang-Reparatur + Sitemap-Bereinigung + konsistente URL-Konventionen sind der Hebel.

**Geschätzter Einfluss nach Umsetzung:** Indexierbare Seiten von 500 auf ~700–750 (+40–50 %), korrekte Sprachzuordnung in den SERPs (heute ranken vermutlich falsche Locale-Versionen), und mittelfristig bessere Crawl-Frequenz. Bei aktuell 43 Klicks/3 Monate ist die internationale Sichtbarkeit der einzige relevante Wachstumshebel.

---

## Property 1: mapraiders.com

### Ausgangslage

| Kennzahl | Wert |
|---|---|
| Indexierte Seiten | 500 |
| Nicht indexierte Seiten | 381 (9 Gründe) |
| URLs in Sitemap | 755 |
| HTML-Dateien im Repo (`docs/`) | 927 |
| Klicks (09.04.–08.06.) | 43 |

Verlauf: Massiver Seitenzuwachs ab ~04.05.26 (Sprachen-Rollout, von ~100 auf ~880 bekannte Seiten). Indexierung folgte schnell auf ~500, stagniert seitdem. Die nicht indexierten Seiten wuchsen parallel auf ~380 — das Wachstum wurde von Google nur teilweise angenommen.

### Befund 1: Defekte hreflang-Architektur — KRITISCH

- **Beschreibung:** 650 von 926 Seiten enthalten hreflang-Einträge, die auf eine Sprach-Homepage zeigen statt auf die äquivalente Unterseite. Beispiel `es-mx/vs/geocaching.html`: `hreflang="id"` → `https://mapraiders.com/id/` (Homepage statt `id/vs/geocaching.html`), `hreflang="en-IN"` → `/en-in/`. Zusätzlich fehlt in vielen Sets die Selbstreferenz (es-MX-Seite ohne `hreflang="es-MX"`-Eintrag; ~199 Seiten ohne Selbstreferenz).
- **Technische Ursache:** Die Generator-Skripte (`_apply_hreflang.py`, `_apply_hreflang_v2.py`) setzen als Fallback die Sprach-Homepage ein, wenn keine Übersetzung existiert, statt den Eintrag wegzulassen. hreflang-Sets sind aber nur gültig, wenn alle Seiten im Set wechselseitig aufeinander zeigen (Return-Tags). Homepage-Fallbacks brechen jedes Set.
- **Auswirkung:** Google ignoriert die hreflang-Signale weitgehend und entscheidet selbst, welche Sprachversion „kanonisch" ist → Bericht „Duplikat – Google hat eine andere Seite als kanonisch bestimmt" (35 Seiten: id/, es-mx/, en-in/, en/). Nutzer in Indien/Mexiko bekommen ggf. die falsche Version oder gar keine. Die komplette 13-Sprachen-Strategie verpufft.
- **Priorität:** KRITISCH
- **Empfehlung:** hreflang-Generator korrigieren: (1) Eintrag nur setzen, wenn die äquivalente Seite existiert — niemals Homepage-Fallback. (2) Selbstreferenz immer einschließen. (3) Stillgelegte Locales (es, pt, zh) aus allen Sets entfernen und durch es-MX, pt-BR, zh-Hans/zh-Hant ersetzen. (4) Validierung als CI-Schritt (jedes Set: alle Ziele existieren, sind indexierbar, Return-Tags vollständig).
- **Erwarteter Nutzen:** Korrekte Locale-Zuordnung in SERPs, Auflösung der 35 Duplikat-Fälle, deutlich besseres Vertrauenssignal — Haupthebel, um die 175 „zurzeit nicht indexiert"-Seiten in den Index zu bekommen.

### Befund 2: 80 noindex-URLs in der Sitemap — HOCH

- **Beschreibung:** `sitemap.xml` (755 URLs) enthält 80 URLs, deren Seiten `noindex` tragen — vor allem die stillgelegten /es/-, /pt/-, /zh/-Bereiche (z. B. `es/features/clanes.html`, `es/howto/`).
- **Technische Ursache:** Beim Locale-Split (es→es-mx, pt→pt-br, zh→zh-cn/zh-tw via `_apply_es_split.py` etc.) wurden die Altseiten auf noindex gesetzt, aber nicht aus der Sitemap-Generierung entfernt.
- **Auswirkung:** Widersprüchliche Signale (Sitemap: „wichtig" / Seite: „nicht indexieren"). Google crawlt diese 80 URLs immer wieder (sichtbar an aktuellen Crawl-Daten im noindex-Bericht: 89 Seiten, Spike ab 06.05.) — verschwendetes Crawl-Budget, gesenktes Sitemap-Vertrauen.
- **Priorität:** HOCH
- **Empfehlung:** Sitemap-Generator filtern: nur Seiten mit `index,follow` UND selbstreferenzierendem Canonical aufnehmen. Die 80 URLs entfernen.
- **Erwarteter Nutzen:** Crawl-Budget fließt zu den 175 wartenden Seiten; Sitemap wird wieder verlässliches Signal.

### Befund 3: noindex + Canonical statt 301 bei stillgelegten Locales — HOCH

- **Beschreibung:** 171 von 927 HTML-Dateien tragen noindex. Stillgelegte Locales: zh (46), es (30), pt (29). Dazu englischsprachige Slug-Duplikate in ko/ (13) und ja/ (13), z. B. `ko/cycling-game/` mit Canonical auf `ko/자전거게임/` PLUS noindex.
- **Technische Ursache:** Migrationsmuster „noindex + canonical" statt 301-Redirect. Die beiden Signale widersprechen sich: Canonical sagt „Inhalt zählt dort", noindex sagt „vergiss diese Seite komplett". Google kann die Signale dann nicht konsolidieren.
- **Auswirkung:** Linkequity und Ranking-Historie der alten URLs (z. B. /es/, /pt/ Startseiten) werden nicht auf die Nachfolger übertragen, sondern verfallen. 89 Seiten hängen dauerhaft im noindex-Bericht und werden weiter gecrawlt.
- **Priorität:** HOCH
- **Empfehlung:** Serverseitige 301-Redirects: `/es/* → /es-mx/*`, `/pt/* → /pt-br/*`, `/zh/* → /zh-cn/*`, `ko|ja/englischer-slug → lokalisierter Slug`. Bei GitHub Pages: per Meta-Refresh-Stub nur als Notlösung — besser auf Hosting mit echten Redirects (Cloudflare Pages/Redirects-Regeln) wechseln. Danach alte Dateien löschen.
- **Erwarteter Nutzen:** Equity-Konsolidierung auf die richtigen URLs, ~150 Crawl-Waste-URLs eliminiert.

### Befund 4: „Gefunden/Gecrawlt – zurzeit nicht indexiert" (175 Seiten) — Symptom, nicht Ursache

- **Beschreibung:** 130 Seiten „Gefunden – zurzeit nicht indexiert" (nie gecrawlt) + 45 „Gecrawlt – zurzeit nicht indexiert". Betroffen: praktisch ausschließlich Sprachversionen (en-in/, es-mx/, hi/, id/, it/, ja/, ko/, zh-cn/, zh-tw/, ar/, fr/).
- **Technische Ursache:** Googles Qualitäts-/Vertrauensentscheidung. Nach dem Massen-Rollout von ~780 neuen URLs am 04.05. mit gleichzeitig widersprüchlichen Signalen (Befunde 1–3) drosselt Google die Indexierungsbereitschaft. Übersetzte Seiten mit identischer Struktur sind dafür besonders anfällig.
- **Auswirkung:** Die Hälfte der internationalen Inhalte ist unsichtbar — genau die Seiten, die die globale ASO/SEO-Strategie tragen sollen.
- **Priorität:** HOCH (wird aber durch Befunde 1–3 gelöst, nicht direkt)
- **Empfehlung:** Keine Einzelmaßnahme. Nach Umsetzung der Befunde 1–3: interne Verlinkung der Sprachversionen stärken (Sprachumschalter-Links auf Unterseitenebene statt nur Homepage), Inhalte der wichtigsten Locale-Seiten substanziell differenzieren (lokale Beispiele, Städte, Events statt 1:1-Übersetzung). Indexierungsanträge für die Top-20-Seiten pro Kernmarkt via URL-Prüfung.
- **Erwarteter Nutzen:** +150–200 indexierte Seiten realistisch innerhalb von 4–8 Wochen nach Signalbereinigung.

### Befund 5: 404-Fehler durch URL-Konventions-Mix und tote Links — MITTEL

- **Beschreibung:** 33 404-Fehler. Zwei Muster: (a) Trailing-Slash-Varianten von .html-Seiten (`en-in/howto/clans/` vs. `en-in/howto/clans.html` — beide existieren inzwischen als getrennte Dateien!), (b) tote interne Links: `howto/klangs.html` (404) wird von `en/howto/clans.html`, `en-in/howto/clans.html`, `id/howto/clans.html` verlinkt.
- **Technische Ursache:** Inkonsistente URL-Strategie — das Repo mischt `seite.html` und `seite/index.html` für denselben Inhalt. Umbenennungen (klangs→echos) ohne Linkpflege.
- **Auswirkung:** Crawl-Waste, verwässerte interne Linksignale, doppelte URL-Varianten konkurrieren („Alternative Seite mit kanonischem Tag": 37).
- **Priorität:** MITTEL
- **Empfehlung:** Eine Konvention festlegen (Empfehlung: Verzeichnis-URLs `…/clans/` für alle neuen Seiten), Duplikat-Dateien entfernen, 3 tote klangs-Links auf `echos.html` korrigieren. Linkchecker als CI-Schritt.
- **Erwarteter Nutzen:** Sauberere Crawl-Pfade; verhindert, dass das Problem mit jedem Rollout wächst.

### Befund 6: Veraltete Sitemap + Doppeleinreichung — NIEDRIG

- **Beschreibung:** `sitemap-phase1.xml` (240 URLs): in GSC eingereicht, live 404 → Status „Konnte nicht abgerufen werden". Außerdem ist `sitemap.xml` doppelt erfasst (direkt + via `sitemap-index.xml`, der ausschließlich auf sitemap.xml zeigt).
- **Technische Ursache:** Datei beim Aufräumen gelöscht, GSC-Einreichung blieb. Index-Sitemap ohne Mehrwert (nur 1 Kind).
- **Auswirkung:** Kosmetisch (roter Dauerfehler), kein Indexierungsschaden.
- **Priorität:** NIEDRIG
- **Empfehlung:** `sitemap-phase1.xml` in GSC entfernen. Entweder nur `sitemap-index.xml` einreichen (wenn künftig mehrere Sitemaps geplant) oder nur `sitemap.xml`.
- **Erwarteter Nutzen:** Sauberes Monitoring — echte Sitemap-Fehler werden wieder sichtbar.

### Befund 7: Widersprüchliche Hub-Seiten (`features/index.html`) — NIEDRIG

- **Beschreibung:** Die Feature-Hub-Seiten aller Locales tragen noindex — die deutsche `features/index.html` hat dabei `noindex` UND selbstreferenzierendes Canonical (direkter Widerspruch). 2 403-Fälle (en-in/features/, fr/features/) liefern inzwischen 200/Redirect-Stubs.
- **Priorität:** NIEDRIG
- **Empfehlung:** Entscheiden: Hub-Seiten entweder indexierbar machen (interne Verteilerseiten mit eigenem Inhalt — empfohlen, gut für interne Verlinkung) oder konsequent per 301 auf die Startseite leiten. Self-Canonical + noindex nie kombinieren.

---

## Property 2: dopaspeak.com

### Ausgangslage

377 indexiert / 1150 nicht indexiert. Dominanter Grund: „Alternative Seite mit richtigem kanonischen Tag" — **923 Seiten** (Spike ab Ende April). Dazu: Weiterleitung 89, 404 78, Gefunden 35, Gecrawlt 14, noindex 3, 403 2.

### Befund 8: Relaunch ohne Redirect-Strategie — KRITISCH (für diese Domain)

- **Beschreibung:** Die Website wurde auf eine schlanke per-Locale-Struktur umgestellt (`sitemap-index.xml` → de/en/es/…-Sitemaps, en enthält nur 29 URLs). Die alte Struktur (~1000+ URLs: `ar/taallum-aliabania/`, `en/learn-with-music/`, `de/yds-vorbereitung-erfahrungen/` …) wurde **gelöscht und liefert 404** — live verifiziert.
- **Technische Ursache:** Content-Pruning ohne 301-Mapping. Die 923 „Alternative Seite"-Einträge stammen aus Crawls Anfang Mai (vor der Löschung); beim Re-Crawl kippen sie in 404.
- **Auswirkung:** Sämtliche Ranking-Signale, Backlinks und Historie der alten URLs gehen ersatzlos verloren. Die 78 bestehenden 404s wachsen absehbar in die Hunderte. Indexierte Seiten (377) werden weiter fallen.
- **Priorität:** KRITISCH
- **Empfehlung:** 301-Mapping alte→neue URLs für alle Seiten mit Impressionen/Backlinks (GSC-Leistungsdaten + Linkbericht exportieren und priorisieren). Mindestens: thematische Weiterleitung auf die nächstliegende neue Seite, sonst auf die Locale-Homepage. Die neuen Seiten selbst sind technisch sauber (self-canonical, index,follow, vollständige hreflang-Sets — stichprobengeprüft).
- **Erwarteter Nutzen:** Rettung der vorhandenen Equity vor dem endgültigen Verfall (Zeitfenster: wenige Wochen, solange Google die alten URLs noch kennt).

### Befund 9: Stale Haupt-Sitemap — NIEDRIG

`/sitemap.xml` (45 URLs) wurde zuletzt am 07.05. gelesen und passt nicht zur neuen Struktur (431 URLs via Index). Entfernen oder aktualisieren.

---

## Property 3: ungehoert.music

7 indexiert / 3 nicht indexiert (2× Alternative mit Canonical, 1× Gecrawlt-nicht-indexiert) — **unauffällig**. Einziger Punkt: Die Property zeigt in GSC ein Warnsymbol (vermutlich Verifizierungsproblem). Empfehlung: Einstellungen → Inhaberschaft prüfen und ggf. neu verifizieren, sonst gehen Zugriff und Daten verloren. Priorität: MITTEL (rein administrativ).

---

## Maßnahmenplan

### Schnellste Verbesserungen (diese Woche, < 1 Tag Aufwand)
1. `sitemap-phase1.xml` aus GSC entfernen (5 Min).
2. 3 tote `klangs.html`-Links auf `echos.html` fixen (10 Min).
3. Sitemap-Generator: noindex-Seiten ausschließen → 80 URLs raus (1–2 h).
4. ungehoert.music-Verifizierung prüfen (10 Min).

### Wichtigste Probleme (nächste 2 Wochen)
5. hreflang-Generator reparieren (kein Homepage-Fallback, Selbstreferenz, tote Locales raus) + CI-Validierung — **der** Haupthebel.
6. dopaspeak.com: 301-Mapping für gelöschte URLs (Equity-Rettung, zeitkritisch).
7. 301-Strategie für /es/, /pt/, /zh/, ko/ja-Slug-Duplikate statt noindex+canonical.

### Langfristige Optimierungen (1–3 Monate)
8. Einheitliche URL-Konvention + Linkchecker/hreflang-Validator als CI-Gate vor jedem Rollout.
9. Locale-Inhalte differenzieren statt 1:1 übersetzen (gegen „zurzeit nicht indexiert").
10. Interne Verlinkung: Sprachumschalter auf Unterseiten-Ebene, Hub-Seiten als echte Verteiler indexierbar machen.
11. Monitoring: wöchentlicher GSC-Check der Validierungen (403 und „Gefunden" laufen bereits, gestartet 11.05./19.05.).

### Geschätzter Einfluss auf die organische Sichtbarkeit
- **mapraiders.com:** +200–250 indexierbare Seiten (500 → ~750), korrekte Locale-Auslieferung in 13 Sprachen. Bei der aktuellen Basis (43 Klicks/Quartal) ist mit Vervielfachung der Impressionen aus Nicht-DACH-Märkten zu rechnen — die en-Seiten zeigen bereits Traktion (`games-like-pokemon-go.html` +140 % Impressionen).
- **dopaspeak.com:** Verhindert Total-Verlust der bisherigen Equity; Stabilisierung des Index auf die neue Struktur (~460 Seiten).
- **ungehoert.music:** kein Handlungsdruck.

---

*Belege: GSC-Berichte (Stand 01.06.26), Quellcode-Analyse `docs/` (927 HTML-Dateien, 171 noindex, 650 Homepage-hreflang, 80 Sitemap-Konflikte), Live-HTTP-Checks vom 10.06.2026.*

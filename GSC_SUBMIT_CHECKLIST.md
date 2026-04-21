# Google Search Console — Submit-Checkliste MapRaiders

**Stand:** 2026-04-21
**Domain:** mapraiders.com (GitHub Pages)
**Legal Entity:** Scafa Investments LLC

---

## 1. Property-Setup

- [ ] GSC öffnen: https://search.google.com/search-console
- [ ] Property `https://mapraiders.com/` hinzufügen (Domain-Property bevorzugt, sonst URL-Prefix)
- [ ] Verifikation via DNS-TXT-Record (Domain) oder HTML-File (URL-Prefix)
  - HTML-File-Upload in `docs/` einchecken falls benötigt
- [ ] Falls Domain-Property: auch `www` und Subdomains erfasst automatisch

## 2. Sitemaps einreichen

Unter **Sitemaps** (links im GSC Menu):

**Haupt-Sitemap (Sitemap-Index):**
- [ ] `https://mapraiders.com/sitemap.xml`

**Per-Language Sitemaps** (13 Stück):
- [ ] `https://mapraiders.com/sitemap-de.xml`
- [ ] `https://mapraiders.com/sitemap-en.xml`
- [ ] `https://mapraiders.com/sitemap-fr.xml`
- [ ] `https://mapraiders.com/sitemap-es.xml`
- [ ] `https://mapraiders.com/sitemap-it.xml`
- [ ] `https://mapraiders.com/sitemap-pt.xml`
- [ ] `https://mapraiders.com/sitemap-tr.xml`
- [ ] `https://mapraiders.com/sitemap-ru.xml`
- [ ] `https://mapraiders.com/sitemap-ja.xml`
- [ ] `https://mapraiders.com/sitemap-ko.xml`
- [ ] `https://mapraiders.com/sitemap-zh.xml`
- [ ] `https://mapraiders.com/sitemap-ar.xml`
- [ ] `https://mapraiders.com/sitemap-hi.xml`

**Erwartete URL-Counts (nach aktuellem Stand):**
- Root sitemap.xml: ~190+ URLs (inkl. hreflang-Matrix)
- sitemap-de.xml: ~21 URLs (Home + 6 Features + 4 VS + 5 Howto + About + 4 Kategorien)
- Andere Sprachen: vergleichbar

## 3. URL-Inspection & Indexierung erzwingen

Für die wichtigsten Seiten manuell `URL-Prüfung` → `Indexierung beantragen`:

**Priorität 1 (Homepage + Brand-Seiten):**
- [ ] `https://mapraiders.com/` (DE Home)
- [ ] `https://mapraiders.com/en/` (EN Home)
- [ ] `https://mapraiders.com/ueber-uns.html`
- [ ] `https://mapraiders.com/en/about.html`

**Priorität 2 (VS-Pages mit hohem Search-Volume):**
- [ ] `https://mapraiders.com/vs/pokemon-go.html` + `/en/vs/pokemon-go.html`
- [ ] `https://mapraiders.com/vs/zenly.html` + `/en/vs/zenly.html`
- [ ] `https://mapraiders.com/vs/ingress.html` + `/en/vs/ingress.html`

**Priorität 3 (Kategorie-Keyword-Seiten):**
- [ ] DE: `/outdoor-social-app.html`, `/standort-spiel.html`, `/territorium-spiel.html`, `/social-media-alternative.html`
- [ ] EN: `/en/outdoor-social-app.html`, `/en/location-based-game.html`, `/en/territory-game-app.html`, `/en/social-media-alternative.html`

## 4. International Targeting

Unter **Einstellungen → International Targeting** (nur bei URL-Prefix-Property):
- [ ] Tab "Sprache": kein Targeting setzen (wir nutzen hreflang)
- [ ] Tab "Land": "Not targeted to specific country" (globale Nutzung)
- [ ] Hreflang-Report prüfen: Errors = 0 erwartet

## 5. Mobile Usability

- [ ] Mobile Usability Report checken: 0 Errors erwartet
- [ ] Falls Fehler: betroffene URL prüfen, Fix deployen, Re-Validation

## 6. Rich Results / Structured Data

Unter **Verbesserungen** prüfen:
- [ ] `FAQ` Report → sollte nach 1-2 Wochen Seiten zeigen
- [ ] `HowTo` Report → Feature/Howto-Seiten sollten erscheinen
- [ ] `Breadcrumbs` Report → VS/Feature/Howto-Seiten
- [ ] `Organization` / `SoftwareApplication` → About + Kategorie-Seiten

**Validator für Einzel-URL-Tests:**
https://search.google.com/test/rich-results

## 7. Bing Webmaster Tools (parallel einrichten)

- [ ] Property auf https://www.bing.com/webmasters hinzufügen
- [ ] GSC-Import nutzen (spart Zeit): "Import from Google Search Console"
- [ ] Sitemaps werden automatisch übernommen

## 8. Cloudflare (optional, falls DNS migriert)

- [ ] GitHub Pages bleibt Origin, Cloudflare nur als DNS + Cache-Layer
- [ ] CNAME `mapraiders.com` → `scafa-assistant.github.io`
- [ ] SSL: Full (strict) — GitHub Pages liefert eigenes Cert

---

# Share-of-Model Tracking (AEO/GEO)

**Ziel:** MapRaiders in AI-Search-Antworten (ChatGPT, Perplexity, Gemini, Claude, Mistral) sichtbar bekommen.

## Baseline-Messung (einmalig, jetzt durchführen)

Für jeden AI-Provider die folgenden **Test-Queries** stellen und Ergebnis dokumentieren:

### Query-Set (beide Sprachen)

**DE:**
1. "Was ist die beste GPS-Alternative zu Pokémon GO?"
2. "Gibt es eine Territorien-Spiel-App?"
3. "Welche App ist wie Zenly aber ohne Tracking-Probleme?"
4. "App um Hundespaziergänge zu einer Community zu machen"
5. "Nachbarschafts-App ohne Werbung"

**EN:**
1. "What is the best GPS alternative to Pokémon GO?"
2. "Is there a territory claiming app based on real-world GPS?"
3. "Zenly alternative that works in 2026"
4. "Outdoor social app for dog walkers"
5. "Location-based social network without ads"

## Providers zum Testen

| Provider | URL | Kommentar |
|---|---|---|
| ChatGPT (GPT-5) | chatgpt.com | Nutzt SearchGPT — crawlt aktiv |
| Perplexity | perplexity.ai | Zitiert Quellen direkt (beste AEO-Messung) |
| Google Gemini | gemini.google.com | Bezieht GSC-indexierte Seiten |
| Claude | claude.ai | Nutzt WebSearch in neueren Versionen |
| Mistral Le Chat | chat.mistral.ai | European Search via Brave |
| You.com | you.com | Hybrid-Search |

## Dokumentation-Template (pro Query × Provider)

```markdown
### Query: "{query}"
**Provider:** {provider}
**Date:** 2026-04-{dd}
**MapRaiders erwähnt:** ja/nein
**Position in Antwort:** {top-1 / top-3 / erwähnt / nicht erwähnt}
**Zitierte URL:** {url oder -}
**Konkurrenten genannt:** {Liste}
**Kontext:** {kurze Notiz}
```

## Tracking-Cadence

- [ ] **Woche 1 nach GSC-Submit:** Baseline-Messung, alle 10 Queries × 6 Provider = 60 Datenpunkte
- [ ] **Woche 4:** Re-Messung, Share-of-Model %-Change dokumentieren
- [ ] **Woche 12:** Re-Messung nach SEO-Reifung, Benchmark gegen Konkurrenz (Geocaching, Zenly, Ingress)

## Optimierungs-Feedback-Loop

**Falls Provider X zitiert uns nicht, aber Konkurrent Y:**
- Untersuche welche Seite/Content Y zitiert wurde → Format adaptieren
- Häufige Trigger: FAQ mit direkten Fragen, HowTo-Listen, klare Value-Propositions im Lead-Paragraphen
- AEO-Tactics: **TL;DR-Blocks** am Anfang, **Named-Entity-Anreicherung**, **structured lists** mit `<h3>` + `<p>`-Paaren

---

# Legal-Notiz zur Coming-Soon-Phase

Da App noch nicht im Play Store verfügbar ist:
- Site kommuniziert klar "Coming Soon" auf allen CTAs (13 Sprachen lokalisiert)
- Statt Download-Link: `mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify` als Waitlist-Platzhalter
- JSON-LD Offer: `availability: "https://schema.org/PreOrder"` + `priceValidUntil: "2026-12-31"`
- UWG §5-konform: keine Irreführung, da klare Kommunikation des Pre-Launch-Status

**Nach Play-Store-Launch:**
- [ ] Coming-Soon-Mode rückwärts anwenden: mailto → Play Store-URL
- [ ] JSON-LD: `availability: "InStock"` + `downloadUrl` wieder einfügen
- [ ] Script vorbereiten: `docs/_revert_coming_soon.py` (invertiert `_apply_coming_soon.py`)

---

**Owner:** René Scafarti (Scafa Investments LLC)
**Google Account:** workspace.scafa@gmail.com

# Arbeitspaket egons.io — SEO/GEO/AEO · 15.06.2026

**Property:** https://egons.io/ · **Quelle:** GSC (nur lesend) + Live-Seitenanalyse. **Code nicht verbunden** → Maßnahmen führt der egons-Agent/DevOps aus.
**Gesamtstatus:** 🟢 technisch sauber, inhaltlich stark. Einziger echter Hebel: **Sichtbarkeit** (28 Tage: 0 Klicks / 6 Impressionen). Einsprachig (DE), daher kein hreflang nötig.

## Inventar (Sitemap = 13 URLs, 12 indexiert)

| # | URL | Typ | Prio | Indexiert | Befund | Aktion |
|---|---|---|---|---|---|---|
| 1 | `/` | Home | 1.0 | ✅ | Title 42 Z. ✅, **Desc nur 107 Z.** (kurz), Self-Canonical ✅, JSON-LD vorhanden | Description auf ~150 Z. erweitern (Keyword „KI-Companion on-device / lokal") |
| 2 | `/was-ist-egon` | Entity/Grounding (P0 GEO/AEO) | 0.9 | ✅ | 1.813 Wörter, Schema-Graph (Organization, AboutPage, WebSite, SoftwareApplication, FAQPage) ✅✅, Desc 171 Z. | Desc auf ≤160 Z. kürzen; sonst Vorzeige-Seite |
| 3 | `/egon-vs-replika` | Vergleich (P0 BOFU/GEO) | 0.8 | ✅ | analog vs-Template | Desc-Länge prüfen (≤160) |
| 4 | `/egon-vs-gemini` | Vergleich (P0 BOFU/GEO) | 0.8 | ✅ | analog vs-Template | Desc-Länge prüfen |
| 5 | `/egon-vs-chatgpt` | Vergleich (P0 BOFU/GEO) | 0.8 | ⚠️ ggf. noch nicht idx (am 12.06. hinzugefügt) | 2.078 Wörter, voller Schema-Graph + BreadcrumbList + FAQPage ✅✅, Desc 177 Z. | Indexierung in GSC prüfen (URL-Prüfung); Desc ≤160 |
| 6 | `/ki-fuer-senioren` | Ratgeber (P1 TOFU) | 0.8 | ✅ | Nischen-Landing | Interne Verlinkung von Home + was-ist-egon sicherstellen |
| 7 | `/ki-bei-adhs` | Ratgeber (P1) | 0.8 | ✅ | rankt bereits (2 Impr.) | Content vertiefen, FAQ ergänzen |
| 8 | `/ki-glossar` | Support (P1 AEO) | 0.7 | ✅ | Glossar = gut für AEO/Entities | `DefinedTermSet`-Schema ergänzen falls nicht vorhanden |
| 9 | `/haeufige-fragen` | FAQ (P1 AEO) | 0.7 | ✅ | 1.865 Wörter, FAQPage-Schema ✅ | Vorzeige-Seite; Fragen an reale Suchanfragen anpassen |
| 10 | `/was-ist-local-first` | Support (P1) | 0.7 | ✅ | Entity/Konzept | intern stärker verlinken |
| 11–13 | `/datenschutz/` `/nutzungsbedingungen/` `/impressum/` | Legal | 0.3 | ✅ | Trailing-Slash-Form | siehe DevOps-Hinweis |

## Kritische/wichtige Maßnahmen

1. **🟡 Sichtbarkeit aufbauen (Haupthebel):** Seite ist technisch fertig, aber neu → kaum Impressionen. Maßnahmen: (a) erste Backlinks/Erwähnungen (KI-/ADHS-/Senioren-Communities, Produkt-Verzeichnisse), (b) interne Verlinkung verdichten (Home → alle P0/P1), (c) `/egon-vs-chatgpt` aktiv via GSC-URL-Prüfung anstoßen (René, da GSC-Schreibaktion).
2. **🟢 Meta-Descriptions normalisieren:** Home zu kurz (107), was-ist-egon/vs-chatgpt zu lang (171/177) → einheitlich 140–160 Z. mit Such-Keyword.
3. **DevOps (aus Sitemap-Kommentaren):** nginx-locations für alle slug-URLs in **beiden Formen** (mit/ohne Trailing-Slash, mit/ohne `.html`) sicherstellen; nach Deploy Live-Erreichbarkeit + JSON-LD-Validität je P0-Seite verifizieren (rich-results.google.com).

## GEO/AEO-Bewertung
Bereits sehr gut aufgestellt: Entity-Seite (`was-ist-egon`) + Vergleichsseiten + FAQ mit `@graph`-Schema (Organization/SoftwareApplication/FAQPage) = ideale Grounding-Basis für Answer-Engines. **Nächster GEO-Schritt:** konsistente Entitäts-Nennung („EGON = on-device KI-Companion") über alle Seiten + externe Erwähnungen, damit LLMs die Entität verankern.

*GSC nur gelesen. Ausführung durch egons-Agent/DevOps; Ergebnis zur Prüfung an mich zurück.*

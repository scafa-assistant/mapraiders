# AP4 — Locale-Entscheidungsvorlage (Stand 10.06.2026)

**Datenbasis:** GSC-Leistung 3 Monate (alle 213 Seiten mit Impressionen, per DOM-Scrape aggregiert), Seitenindexierung Stand 01.06., Content-Analyse aus `docs/` + Master-Plänen. **Keine Umsetzung ohne René-Go.**

## Leistung pro Locale (3 Monate)

| Locale | Seiten m. Impr. | Klicks | Impressionen | Ø Pos. | Content-Status |
|---|---|---|---|---|---|
| en | 34 | 16 | 724 | 12,9 | voll lokalisiert, eigene Killer-Slugs |
| ja | 9 | 2 | 142 | 7,9 | native Slugs (位置情報ゲーム: 108 Impr.!) |
| de (Root) | 19 | 1 | 118 | 13,9 | Original; /jogging/ 46 Impr. |
| en-in | 24 | 2 | 112 | 10,8 | eigene India-Pages (…-india.html: 26 Impr.) + en-Duplikate |
| ko | 13 | 2 | 93 | 9,8 | native Slugs ziehen |
| ru | 13 | 2 | 80 | 7,4 | Übersetzung, überraschend stark |
| fr | 18 | 8 | 56 | 11,1 | **beste Klickausbeute der Site** |
| it | 9 | 2 | 46 | 6,6 | Übersetzung |
| tr | 10 | 1 | 39 | 15,1 | Query „klanlar" (14 Impr.) = Clan-Nachfrage |
| es-mx (+es-Alt) | 7 (+9) | 2 (+1) | 18 (+31) | 6,9 | es-Alt läuft seit 10.06. per 301 auf es-mx |
| zh-tw | 12 | 2 | 30 | 9,9 | **stärker als zh-cn!** |
| id | 6 | 1 | 25 | 7,5 | Übersetzung |
| ar | 9 | 1 | 20 | 7,1 | RTL, kulturell angepasst |
| zh-cn | 8 | 0 | 13 | 5,9 | Festland sucht eh nicht via Google |
| hi | 5 | 0 | 10 | 6,1 | Übersetzung |
| pt-br (+pt-Alt) | 3 (+3) | 0 | 4 (+5) | — | schwächste Locale |

## Empfehlung in vier Stufen

**A — AUSBAUEN (aktives Investment):**
- **en** — Kernmarkt, 50 % aller Impressionen. `games-like-pokemon-go.html` (314 Impr., Pos. 14,9) steht kurz vor Seite 1 → primäres Linkaufbau-Ziel.
- **ja** — beste Position-zu-Impression-Relation; native Slugs funktionieren. Passt perfekt zum One-Piece/Nakama-Frame (s. Wachstumsdoc).
- **de** — Heimatmarkt, CTR-Problem (118 Impr., 1 Klick) → Title/Description-Sprint lohnt.

**B — BEHALTEN (Status quo, normale Pflege):** ko, ru, fr (CTR-Vorbild!), tr (Clan-Content vertiefen wg. „klanlar"), it.

**C — BEHALTEN MIT BEDINGUNG:**
- **en-in:** Nur die India-spezifischen Killer-Pages (cricket, …-india) behalten; die 1:1-en-Duplikate (howto/features) per Canonical auf en konsolidieren — Google foldet sie ohnehin (35 Duplikat-Fälle im GSC). Spart Crawl-Budget ohne Sichtbarkeitsverlust.
- **es-mx, id, ar, hi, zh-tw:** Halten ohne Investment. Review-Termin 10.12.2026: Wer dann <50 Impr./3 Mon. hat, wird Kandidat für Konsolidierung.

**D — EINFRIEREN (kein weiterer Content):**
- **zh-cn** — 13 Impr., 0 Klicks; Zielgruppe nutzt Google kaum. zh-tw als einzige chinesische Wachstums-Locale führen.
- **pt-br** — 4 Impr. nach Monaten. Einfrieren, Review 10.12.2026; bei Null-Trend: auf en kanonisieren.

**Nicht empfohlen:** komplette Löschung einer Locale — die 301-Architektur steht jetzt, Rückbau wäre teurer als Einfrieren.

## Entscheidungsbedarf (René)
1. en-in-Duplikat-Konsolidierung auf en: ja/nein?
2. zh-cn + pt-br einfrieren: ja/nein?
3. Review-Termin 10.12.2026 fixieren?

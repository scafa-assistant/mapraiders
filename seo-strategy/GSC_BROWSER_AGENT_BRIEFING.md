# Briefing: Google Search Console + Bing Webmaster Submission

**Adressat:** Browser-fähiger Agent (kann Webseiten öffnen, Buttons klicken, Formulare ausfüllen).

**Stand:** 2026-05-07. Alle URLs in dieser Liste sind verifiziert HTTP 200 (live + erreichbar).

**Property:** mapraiders.com (Domain-Property in GSC, nicht URL-Prefix)

**Google-Account:** workspace.scafa@gmail.com (laut globaler CLAUDE.md)

---

## Auftrag (in dieser Reihenfolge)

### Schritt 1 — Sitemap einreichen (einmalig)

1. Öffne **https://search.google.com/search-console**
2. Property auswählen: **mapraiders.com**
3. Linke Sidebar → **„Sitemaps"**
4. Im Feld „Add a new sitemap" eintragen:
   ```
   sitemap-index.xml
   ```
   (GSC hängt die Property-URL automatisch davor; vollständig wird also `https://mapraiders.com/sitemap-index.xml`)
5. **„Senden"** klicken

**Erwartetes Ergebnis:** Status "Erfolg", entdeckte URLs ~820. Falls noch alte Sitemaps (`sitemap-de.xml`, `sitemap-phase1.xml`, etc.) als "Couldn't fetch" angezeigt werden — die sind absichtlich gelöscht. **NICHT erneut einreichen.** Wenn GSC dafür einen "Remove sitemap"-Button anbietet, kannst du sie entfernen, sonst ignorieren.

**Wichtig:** Die einzige aktive Sitemap ist `sitemap-index.xml`. Diese verlinkt auf `sitemap.xml` mit 820 URLs.

---

### Schritt 2 — Tag 1: Top 10 Volume-Kings „Request Indexing"

Für jede URL einzeln durchgehen:

1. In GSC oben das **„URL Inspection"-Suchfeld** (oder linke Sidebar → „URL inspection")
2. URL einfügen, Enter drücken
3. Falls "URL is not on Google" oder "URL is on Google but has issues": **„Request Indexing"** klicken
4. Falls "URL is on Google" und keine Probleme: nichts tun, weiter zur nächsten

**Quota-Limit:** Google erlaubt ca. 10-12 "Request Indexing" pro Tag pro Property. Nicht überschreiten — sonst werden weitere Requests still verworfen.

**Tag 1 Liste (höchstes Volumen zuerst, alle verifiziert HTTP 200):**

| # | Sprache | URL | Volumen/Mo |
|---|---|---|---|
| 1 | EN | `https://mapraiders.com/en/games-like-pokemon-go.html` | 30.000-45.000 |
| 2 | JA | `https://mapraiders.com/ja/位置情報ゲーム.html` | 15.000-25.000 |
| 3 | EN-IN | `https://mapraiders.com/en-in/games-like-pokemon-go-india.html` | 8.000-12.000 |
| 4 | IT | `https://mapraiders.com/it/caccia-al-tesoro-app-italia.html` | 6.000-10.000 |
| 5 | KO | `https://mapraiders.com/ko/위치기반게임.html` | 5.000-8.000 |
| 6 | PT-BR | `https://mapraiders.com/pt-br/jogo-de-gps.html` | 5.000-8.000 |
| 7 | ES-MX | `https://mapraiders.com/es-mx/juego-de-gps.html` | 5.000-8.000 |
| 8 | ZH-CN | `https://mapraiders.com/zh-cn/寻宝游戏App.html` | 4.000-6.000 |
| 9 | FR | `https://mapraiders.com/fr/chasse-au-tresor-application.html` | 4.000-6.000 |
| 10 | DE | `https://mapraiders.com/spiele-wie-pokemon-go.html` | 4.000-6.000 |

**Hinweis zu CJK-URLs (JA/KO/ZH-CN/ZH-TW):** GSC's URL Inspection sollte die japanischen/koreanischen/chinesischen Zeichen als raw UTF-8 akzeptieren. Falls "URL kann nicht gelesen werden" angezeigt wird — die percent-encoded Variante einfügen. Beispiele:

| Original | Percent-encoded |
|---|---|
| `https://mapraiders.com/ja/位置情報ゲーム.html` | `https://mapraiders.com/ja/%E4%BD%8D%E7%BD%AE%E6%83%85%E5%A0%B1%E3%82%B2%E3%83%BC%E3%83%A0.html` |
| `https://mapraiders.com/ko/위치기반게임.html` | `https://mapraiders.com/ko/%EC%9C%84%EC%B9%98%EA%B8%B0%EB%B0%98%EA%B2%8C%EC%9E%84.html` |
| `https://mapraiders.com/zh-cn/寻宝游戏App.html` | `https://mapraiders.com/zh-cn/%E5%AF%BB%E5%AE%9D%E6%B8%B8%E6%88%8FApp.html` |

---

### Schritt 3 — Tag 2: Restliche Tier-1/Tier-2 + Hubs

**Erst nach 24 Stunden** (Quota-Reset abwarten). Selbe Prozedur wie Tag 1:

| # | Sprache | URL | Typ |
|---|---|---|---|
| 1 | AR | `https://mapraiders.com/ar/location-game.html` | Killer 1.5-2.5K |
| 2 | RU | `https://mapraiders.com/ru/geo-igra.html` | Killer 1.5-2.5K |
| 3 | TR | `https://mapraiders.com/tr/hazine-avi-uygulamasi.html` | Killer 2-3.5K |
| 4 | ZH-TW | `https://mapraiders.com/zh-tw/尋寶遊戲應用程式.html` | Killer 3-5K |
| 5 | ID | `https://mapraiders.com/id/game-lokasi.html` | Killer 2-3.5K |
| 6 | HI | `https://mapraiders.com/hi/location-game.html` | Killer 1.5-2.5K |
| 7 | DE | `https://mapraiders.com/mapraiders-erfahrungen.html` | DE Hub |
| 8 | EN | `https://mapraiders.com/en/mapraiders-reviews.html` | EN Hub |
| 9 | HI | `https://mapraiders.com/hi/mohalla-game.html` | HI-EXKLUSIV |
| 10 | EN-IN | `https://mapraiders.com/en-in/cricket-fan-map-app.html` | IN-EXKLUSIV |

**ZH-TW URL percent-encoded:** `https://mapraiders.com/zh-tw/%E5%B0%8B%E5%AF%B6%E9%81%8A%E6%88%B2%E6%87%89%E7%94%A8%E7%A8%8B%E5%BC%8F.html`

---

### Schritt 4 — Bing Webmaster Tools

1. Öffne **https://www.bing.com/webmasters**
2. Account: gleicher Google-Login (workspace.scafa@gmail.com via "Sign in with Google")
3. Site auswählen: **mapraiders.com**
4. Sidebar → **„Sitemaps"** → **„Submit sitemap"**
5. Eintragen:
   ```
   https://mapraiders.com/sitemap-index.xml
   ```
6. „Submit" klicken

Bing crawled in der Regel langsamer als Google, kein extra Indexing-Request nötig.

---

## Was du **nicht** tun darfst

- ❌ **Keine Sitemap-URL aus dem alten Format einreichen** — die sind alle gelöscht und liefern 404. Nur `sitemap-index.xml`.
- ❌ **Keine URLs aus den 13 alten Sprach-Sitemaps** (`sitemap-de.xml`, `sitemap-pt.xml`, etc.) — diese sind GELÖSCHT.
- ❌ **Kein „Remove URL"-Tool** für Soft-404-URLs (`/features/clans.html`, `/vs/woog.html`, etc.) verwenden — die wurden gerade auf echtes 404 umgestellt, Google entdeckt das beim nächsten Crawl automatisch und entfernt sie aus dem Index.
- ❌ **Keine GSC-Property löschen oder neu hinzufügen** — die mapraiders.com Property ist bereits korrekt verifiziert.
- ❌ **Nicht mehr als 10 Request-Indexing pro Tag** — Quota wird sonst still verworfen.

---

## Was du nach Submission reporten sollst

Nach beiden Schritten kurzer Status-Report (unter 200 Wörter):

1. **Sitemap-Status:** „Erfolgreich gelesen, 820 URLs entdeckt" oder welche Fehlermeldung kam
2. **Wieviele Request-Indexing-Requests** wirklich abgeschickt wurden (manche URLs sind ggf. schon indexiert → kein Request nötig)
3. **GSC-Bing Status:** beide submissions durch oder nur eines?
4. **Probleme:** wenn URLs nicht akzeptiert wurden, welche und mit welcher Fehlermeldung
5. **Quota-Hinweis:** Falls GSC nach z.B. dem 7. Request meldet „Quota erreicht" — welche URLs sind noch offen für Tag 2

Diesen Report bitte als Plain-Text zurückgeben, kein Markdown nötig.

---

## Background-Kontext (für Robustheit)

**Was vor 30 Minuten gefixt wurde** (relevant für Crawler-Verhalten):

1. **nginx Soft-404-Bug:** Der Server lieferte vorher für nicht-existente URLs HTTP 200 + DE-Homepage als Fallback. Jetzt: echtes 404 mit `/404.html`. Das eliminiert Duplicate-Content-Signale die DE-Indexing zerstört haben.

2. **hreflang-Cleanup:** 212 broken hreflang-Tags wurden aus 85 Pages entfernt (zeigten auf nicht-existente Übersetzungen wie `/es-es/` oder `/de/schnitzeljagd/`). Crawler entdeckt jetzt nur noch existierende Sprach-Alternativen.

3. **Sitemap konsolidiert:** Eine einzige `sitemap.xml` mit 820 URLs (vorher 16 fragmentierte Sitemaps, davon 13 stale).

**Warum das wichtig ist für GSC-Submission:** Wenn GSC Beim Re-Crawl die alten Phantom-URLs als 404 sieht, wird Google die im Laufe von 2-4 Wochen aus dem Index entfernen. Das löst die DE-Indexing-Probleme aus dem letzten GSC-Bericht (DE = 0 Impressionen).

---

## Verifikation der URL-Liste

Alle 20 Tag-1 + Tag-2 URLs wurden am 2026-05-07 verifiziert HTTP 200 (CJK-URLs via Browser-Verhalten, also percent-encoded request). Wenn beim Submission-Versuch eine URL doch 404 liefert, melde welche — das wäre dann ein neuer Deploy-Bug.

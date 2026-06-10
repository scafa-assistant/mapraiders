# Briefing: GSC-Export-Agent für MapRaiders

**Adressat:** Browser-fähiger Agent (kann GUI bedienen, Login, Navigation, Screenshots, Copy-Paste)
**Auftraggeber:** René Scafarti (Founder MapRaiders)
**Datum:** 2026-06-10
**Mission-Typ:** Read-only Daten-Extraktion. **Nichts ändern, nichts einreichen, nichts löschen.**

---

## 1. Wer du bist und was du tust

Du bist ein autonomer Browser-Agent. Deine Aufgabe ist **eine vollständige Daten-Extraktion** aus der **Google Search Console** für die Property **mapraiders.com**. Du loggst dich ein, navigierst durch die Reports, exportierst Daten oder kopierst sie ab, und lieferst sie als strukturierten Bericht zurück.

**Du analysierst nicht. Du extrahierst.** Die Analyse macht der Hauptagent in Claude Code, nachdem du fertig bist.

---

## 2. Projektkontext (kurz)

**MapRaiders** ist ein GPS-basiertes MMO-Territory-Game (gleiche Mechanik wie Pokémon GO, aber territory-basiert wie Ingress).
- **Domain:** `mapraiders.com` (Property in GSC sollte als Domain-Property oder URL-Prefix für `https://mapraiders.com/` vorhanden sein)
- **Sprachen:** 16 (DE, EN, EN-IN, FR, IT, ES-MX, PT-BR, TR, RU, JA, KO, ZH-CN, ZH-TW, AR, HI, ID)
- **Pages:** ~755 URLs in der Sitemap
- **Rechtsträger:** Scafa Investments LLC
- **Was zuletzt passiert ist (wichtig, weil GSC die Effekte zeigen wird):**
  - Mai 2026: nginx Soft-404-Bug gefixt (vorher fielen alle 404er auf DE-Homepage zurück)
  - Mai 2026: hreflang-Müll entfernt (212 Tags auf nicht-existierende Pages gelöscht)
  - Mai 2026: Sitemap konsolidiert von 16 fragmentierten Files auf 1 (`sitemap.xml` + `sitemap-index.xml`)
  - Mai 2026: 64 Legal-Pages erstellt (EN + 14 Sprachen × 4 Files)

**Diese Fixes brauchen 2-4 Wochen bis GSC sie reflektiert.** Du extrahierst den aktuellen Stand — auch wenn er noch "alt" aussieht.

---

## 3. Login

**Google-Account:** `workspace.scafa@gmail.com`
**2FA:** Wahrscheinlich aktiv. Wenn du ein 2FA-Prompt siehst, **brich ab und melde dich beim User**. Login darf nicht stocken — keine Code-Eingabe ohne explizite Freigabe.

**URL zum Einstieg:** `https://search.google.com/search-console`

**Property auswählen:** `mapraiders.com` (kann als Domain-Property oder URL-Prefix `https://mapraiders.com/` gelistet sein — wähle die mit den meisten Daten, wenn beide existieren).

---

## 4. Was du extrahieren musst (PFLICHT-Reports)

Arbeite die Liste **strikt in dieser Reihenfolge** ab. Bei jedem Report: erst **Datumsbereich auf "Letzte 28 Tage"** stellen, dann extrahieren.

### Report A — Indexierung → Seiten

**Pfad:** Sidebar → "Indexierung" → "Seiten"

**Was du brauchst:**

1. **Top-Zahlen** (immer ablesen und notieren):
   - Anzahl **"Indexiert"**
   - Anzahl **"Nicht indexiert"**

2. **Tabelle "Warum Seiten nicht indexiert werden"** — komplett abschreiben:
   ```
   | Grund | Anzahl Seiten | Trend |
   |---|---|---|
   | (z.B. "Duplikat – ohne vom Nutzer ausgewählten Canonical") | 142 | ↑/↓/→ |
   ```
   Alle Kategorien mitnehmen. Typische Kategorien:
   - Duplikat ohne vom Nutzer ausgewählten Canonical
   - Duplikat – Google hat einen anderen Canonical ausgewählt als der Nutzer
   - Seite mit Weiterleitung
   - Soft 404
   - Gefunden – zurzeit nicht indexiert
   - Gecrawlt – zurzeit nicht indexiert
   - Durch robots.txt blockiert
   - Durch noindex-Tag ausgeschlossen
   - Alternative Seite mit richtigem Canonical-Tag
   - Nicht gefunden (404)
   - Serverfehler (5xx)
   - URL aufgrund eines anderen 4xx-Problems blockiert

3. **Beispiel-URLs pro Kategorie** — klicke jede Kategorie an und liste die ersten **10 Beispiel-URLs** auf. Format:
   ```
   ## Kategorie: "Gefunden – zurzeit nicht indexiert" (298 Seiten)
   Beispiel-URLs:
   1. https://mapraiders.com/...
   2. https://mapraiders.com/...
   ...
   ```

4. **Screenshot** der Übersichts-Seite (Top-Zahlen + Tabelle), als `gsc_pages_overview.png` benennen.

---

### Report B — Sitemaps

**Pfad:** Sidebar → "Indexierung" → "Sitemaps"

**Was du brauchst:**
- Liste aller eingereichten Sitemaps mit:
  - URL
  - Eingereicht am
  - Letzter Lesevorgang
  - Status (Erfolg / Fehler)
  - **"Entdeckte URLs"** (Zahl)
- Falls Fehler: Fehlertext + welche Sitemap betroffen

**Erwarteter Stand:** `https://mapraiders.com/sitemap-index.xml` und `https://mapraiders.com/sitemap.xml`.
**Wenn andere Sitemaps gelistet sind (z.B. alte `sitemap-de.xml`, `sitemap-phase1.xml`):** notieren, **nicht löschen**.

**Screenshot:** `gsc_sitemaps.png`

---

### Report C — Leistung → Suchergebnisse (28 Tage)

**Pfad:** Sidebar → "Leistung" → "Suchergebnisse"

**Filter setzen:** Datumsbereich "Letzte 28 Tage".

#### C.1 Gesamt-Zahlen (oben in den 4 Karten)
- Klicks (Zahl)
- Impressionen (Zahl)
- Durchschnittliche CTR (%)
- Durchschnittliche Position (Zahl)

#### C.2 Tab "Suchanfragen" — Top 30
Tabelle mit Spalten: Anfrage / Klicks / Impressionen / CTR / Position
**Wichtig:** Klicke auf die Spalte "Impressionen" um nach Impressionen abzusteigen zu sortieren. **Nicht** nach Klicks (Klicks könnten 0 sein).

Format als Markdown-Tabelle exportieren oder per Copy/Paste übernehmen.

#### C.3 Tab "Seiten" — Top 30
Gleich, sortiert nach Impressionen. Welche URLs ziehen Traffic?

#### C.4 Tab "Länder" — alle Länder mit > 100 Impressionen
Sortiert nach Impressionen. Erwartet: Deutschland, USA, Indien, Brasilien, Japan, Südkorea, Türkei, Russland, Mexiko, Italien, Frankreich, Indonesien, China-bezogene, Saudi-Arabien.

#### C.5 Tab "Geräte"
Mobile vs. Desktop vs. Tablet — Klicks + Impressionen + Position für alle drei.

#### C.6 Tab "Darstellung in der Suche"
Falls Rich Results / FAQ / Sitelinks aufgelistet sind → übernehmen.

**Screenshot:** `gsc_performance_overview.png`

---

### Report D — Leistung Pro Sprache/Markt (wichtig!)

Der Hauptagent muss wissen, **welche Sprachversion in welchem Land Traffic kriegt**. Mach für jede dieser Länder einen separaten Datensatz:

**Top-Märkte (in dieser Reihenfolge):**
1. **Deutschland** — Filter "Land = Deutschland", dann Tab "Seiten" → Top 20 + Tab "Suchanfragen" → Top 20
2. **USA** — gleich
3. **Indien** — gleich
4. **Brasilien** — gleich
5. **Japan** — gleich
6. **Südkorea** — gleich
7. **Türkei** — gleich
8. **Mexiko** — gleich
9. **Saudi-Arabien** — gleich (für AR-Markt)

Falls Land in der Top-15 der Impressionen-Liste fehlt: leeres Datenset notieren mit Vermerk "0 Impressionen — Sprache läuft nicht".

---

### Report E — Core Web Vitals

**Pfad:** Sidebar → "Nutzerfreundlichkeit" → "Core Web Vitals" (kann auch "Web Vitals" heißen)

**Was du brauchst:**
- Mobile: Anzahl "Gut" / "Verbesserungswürdig" / "Schlecht"
- Desktop: gleich
- Falls Beispiele gelistet: 5 schlechteste URLs pro Plattform

**Screenshot:** `gsc_cwv_mobile.png` + `gsc_cwv_desktop.png`

---

### Report F — Nutzerfreundlichkeit auf Mobilgeräten

**Pfad:** Sidebar → "Nutzerfreundlichkeit" → "Nutzerfreundlichkeit auf Mobilgeräten" (falls vorhanden)

Fehler-Counts notieren. Falls 0 Fehler: notieren.

---

### Report G — Manuelle Maßnahmen + Sicherheit

**Pfad:** Sidebar → "Sicherheit & manuelle Maßnahmen"
- "Manuelle Maßnahmen": **Status notieren** (sollte "Keine Probleme gefunden" sein)
- "Sicherheitsprobleme": gleich

Falls **irgendwas anderes als "Keine Probleme"** angezeigt wird: **SOFORT Screenshot + an User eskalieren**, bevor du weitermachst.

---

### Report H — Links

**Pfad:** Sidebar → "Links"

**Was du brauchst:**
- "Top-Websites, die einen Link setzen" → Top 10
- "Top-verlinkte Seiten" → Top 10
- "Top-Linktexte" → Top 10

(Nice-to-have, nicht kritisch wenn Daten dünn sind.)

---

## 5. Was du **nicht** machst (rote Linien)

- **Keine Sitemap-Einreichung.** Auch wenn du eine fehlende siehst — du reichst nichts ein.
- **Keine URL-Inspection + "Indexierung beantragen".** Klicken zum Anschauen ja, Button drücken nein.
- **Keine Property-Settings ändern.** Nicht zu Domain-Property wechseln wenn URL-Prefix vorhanden, nicht User hinzufügen, nicht E-Mail-Benachrichtigungen ändern.
- **Keine Property löschen.** Selbstverständlich.
- **Keine Validierung von Fixes starten.** GSC hat manchmal Buttons wie "Behebung als 'gelöst' markieren" — Finger weg.
- **Keine Datenschutz-relevanten Daten teilen.** Account-Email ist okay (steht in der Briefing), aber keine OAuth-Tokens, keine Session-Cookies kopieren.

---

## 6. Output-Format (was du am Ende lieferst)

Schreibe **eine einzige Markdown-Datei** namens `GSC_EXPORT_2026-06-10.md` mit dieser Struktur:

```markdown
# GSC Export MapRaiders — 2026-06-10

## Meta
- Property-Typ: [Domain / URL-Prefix]
- Property-URL: [genau wie in GSC angezeigt]
- Datumsbereich: 2026-05-13 bis 2026-06-09 (Letzte 28 Tage)
- Extraktion durchgeführt: 2026-06-10 HH:MM CET

## Section A — Indexierung
[Top-Zahlen + Tabelle + Beispiel-URLs pro Kategorie]

## Section B — Sitemaps
[Tabelle]

## Section C — Performance Gesamt
### C.1 Totals
[4 Zahlen]
### C.2 Top 30 Queries
[Tabelle]
### C.3 Top 30 Pages
[Tabelle]
### C.4 Länder
[Tabelle]
### C.5 Geräte
[Tabelle]
### C.6 Darstellung
[Liste]

## Section D — Per-Country Performance
### D.1 Deutschland
#### Top Queries DE
[Tabelle]
#### Top Pages DE
[Tabelle]
### D.2 USA
[gleich]
... (alle 9 Länder)

## Section E — Core Web Vitals
[Mobile + Desktop Counts + Beispiele]

## Section F — Mobile Usability
[Counts]

## Section G — Manuelle Maßnahmen + Security
[Status]

## Section H — Links
[3 Tabellen]

## Notizen vom Agent
- [Alles was auffällig war, aber nicht in den Reports stand]
- [z.B. UI-Anomalien, Banner mit Warnung, ungewöhnliche Trends]
- [z.B. neue GSC-Features die noch nicht in diesem Briefing standen]
```

**Plus alle Screenshots** als Anhang neben der Markdown-Datei. Datei-Naming:
- `gsc_pages_overview.png`
- `gsc_sitemaps.png`
- `gsc_performance_overview.png`
- `gsc_cwv_mobile.png`
- `gsc_cwv_desktop.png`
- Plus alles was du sonst für klärungsbedürftig hältst

**Ablageort:** `C:\Users\r.scafarti\Desktop\MapRaiders\seo-strategy\gsc-export-2026-06-10\` (Ordner anlegen falls nicht existiert).

---

## 7. Wenn du in einer Sackgasse steckst

**Mache nicht weiter mit halben Daten.** Stoppe und gib eine Statusmeldung an den User mit:
1. Was du erfolgreich extrahiert hast (bis wohin du gekommen bist)
2. Wo du steckst (welche Seite, welcher Klick funktioniert nicht)
3. Screenshot der Sackgasse
4. Was du brauchst um weiterzumachen (Re-Login? Property-Auswahl? Permissions?)

Typische Sackgassen:
- **2FA-Prompt:** sofort melden
- **"Sie haben keinen Zugriff auf diese Property":** Property-Auswahl wahrscheinlich falsch, kurz prüfen + melden
- **"Daten werden geladen" über 60s:** Reload, dann nochmal versuchen, dann melden
- **CAPTCHA:** sofort melden, nicht selber lösen

---

## 8. Geschätzte Dauer
~30-45 Minuten für eine vollständige Extraktion bei normaler GSC-Performance.

---

## 9. Übergabe an den nächsten Agent

Nachdem du fertig bist:
1. Markdown-Datei am o.g. Ort speichern
2. Screenshots im gleichen Ordner
3. Kurze Status-Nachricht an User: **"GSC-Export fertig. Datei: `seo-strategy/gsc-export-2026-06-10/GSC_EXPORT_2026-06-10.md`. [N] Screenshots. Anomalien: [Liste oder 'keine']."**

Der Hauptagent in Claude Code übernimmt dann die Korrelation Code-Bug ↔ GSC-Symptom.

---

## 10. Was der Hauptagent als nächstes mit deinen Daten tut (zur Info, beeinflusst deine Arbeit nicht)

Der Hauptagent wartet auf deinen Export, um:
1. **OG-URL-Bug korrelieren:** EN-IN-Page hat falschen OG-Tag → schaut in Section C/D nach Indien-Traffic auf `/en/` vs. `/en-in/`
2. **Founder-Foto Impact messen:** 250 Pages referenzieren ein fehlendes Bild → Section A "Soft 404" + Section E (CWV LCP) prüfen
3. **Features-Hub-noindex evaluieren:** 17 Hub-Pages haben `noindex` → Section A "Durch noindex-Tag ausgeschlossen" check
4. **DE-Indexierung verifizieren:** 25 DE-Pages am Root, kein /de/-Ordner → Section D Deutschland-Performance
5. **Phase-2.2 Wirkung messen:** 60 neue Legal-Pages → Section A "Gefunden, nicht indexiert" Trend
6. **Phase-1 Killer-URLs verifizieren:** 240 Killer-URLs (CJK + native Slugs) → Section C Top-Pages, ob CJK-URLs ranken

Du musst nichts davon tun. **Nur extrahieren.**

---

**Ende des Briefings. Viel Erfolg.**

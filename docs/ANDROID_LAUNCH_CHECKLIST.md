# MapRaiders — Android Launch Checkliste & Aktionsplan
**Stand: 15. April 2026**  
**Ziel: Von Closed Beta → Öffentlicher Google Play Launch**

---

## Status-Zusammenfassung

| Bereich | Status | Priorität |
|---------|--------|-----------|
| Store Listings (13 Sprachen) | ✅ Fertig | — |
| Data Safety Section | ✅ Fertig | — |
| AGB / Datenschutz (DE) | ✅ Fertig | — |
| Privacy Policy (EN) | ✅ NEU erstellt | — |
| Terms of Service (EN) | ✅ NEU erstellt | — |
| Sitemap aktualisiert | ✅ Erledigt | — |
| Play Console Setup | 🔶 In Arbeit | HOCH |
| Google Search Console | 🔴 Nicht indexiert | HOCH |
| App Bundle / Build | 🔶 Prüfen | HOCH |

---

## TEIL 1: Google Play Console — Schritte zum öffentlichen Launch

### 1.1 Store-Eintrag vervollständigen
In der Play Console unter **Wachstum → Store-Eintrag**:

- [ ] **Haupt-Store-Eintrag (DE)** eintragen aus `store-listings-all-languages.md`
  - App-Titel: `MapRaiders: GPS Territorium` (29 Zeichen)
  - Kurzbeschreibung: `Erobere Gebiete im GPS-MMO! Kostenlos, ohne Werbung. Kämpfe in deiner Stadt.`
  - Vollständige Beschreibung: siehe store-listings-all-languages.md
- [ ] **Übersetzungen hinzufügen** für alle 13 Sprachen (EN, FR, ES, IT, PT, TR, RU, JA, KO, ZH, AR, HI)
  - In Play Console → Store-Eintrag → Übersetzungen verwalten → Eigene Übersetzungen
- [ ] **Screenshots hochladen** (mindestens 2, empfohlen 4-8 pro Sprache)
  - Phone: 16:9 oder 9:16, min 320px, max 3840px
  - Empfohlen: 1080×1920px (Portrait)
- [ ] **Feature-Grafik** hochladen (1024×500px) — wird im Store angezeigt
- [ ] **App-Icon** prüfen (512×512px, PNG, 32-bit, kein Alpha)

### 1.2 App-Kategorien & Tags (ASO-kritisch!)
In der Play Console unter **Store-Eintrag → Kategorisierung**:

- [ ] **Kategorie:** Games
- [ ] **Tags (Triple-Tag-Strategie):**
  1. Strategy
  2. Adventure  
  3. Social
  - ⚠️ NICHT verwässern — diese drei Tags sind ASO-optimiert für unsere Nische

### 1.3 Inhaltsrichtlinien & Datenschutz
In der Play Console unter **Richtlinien → App-Inhalte**:

- [ ] **Datenschutzerklärung-URL eintragen:**
  - `https://mapraiders.com/en/privacy.html` (für internationale Nutzer)
  - Alternative DE: `https://mapraiders.com/datenschutz.html`
- [ ] **Data Safety Section** ausfüllen gemäß `play-store-data-safety.md`
  - Standort: Ja (genau + ungefähr)
  - Persönliche Daten: E-Mail, Benutzername
  - Fotos, Audio: Ja (optional, nutzerinitiiert)
  - Nicht gesammelt: Finanzen, Kontakte, Browsing-History, Advertising ID
- [ ] **Altersfreigabe-Fragebogen** ausfüllen
  - Enthält Chat-Funktionalität → wahrscheinlich PEGI 12 / Everyone 10+
  - Nutzerinteraktion: Ja (Echos, Chat, Meetups)
  - Standort wird geteilt: Ja (für Spielmechanik)
- [ ] **Anzeigen-Deklaration:** Keine Werbung → "Nein, meine App enthält keine Werbung"
- [ ] **COVID-19 Kontaktverfolgung:** Nein
- [ ] **Regierungsbezogene Apps:** Nein
- [ ] **Finanz-Features:** Nein

### 1.4 App-Zugriff (für Review-Team)
- [ ] **Anmeldedaten bereitstellen** falls Google die App testen will
  - Test-Account: `walker@test.com` / `test1234`
  - Unter "App-Zugriff" → "Alle Funktionen der App sind ohne spezielle Zugangsbeschränkungen verfügbar" ODER Test-Anmeldedaten angeben

### 1.5 Zielgruppe & Inhalt
- [ ] **Zielgruppe:** 16+ (wegen GPS-Tracking und Chat)
- [ ] Nicht für Kinder unter 13 deklarieren (COPPA-relevant)
- [ ] Kein Gambling, keine Kryptowährungen

### 1.6 Build & Release
- [ ] **Production Track** auswählen (von Closed Beta → Production)
  - In Play Console → Release → Production → Neuen Release erstellen
- [ ] **App Bundle (AAB)** hochladen (nicht APK!)
  - `eas.json` hat bereits `"production": { "android": { "buildType": "app-bundle" } }`
  - Build: `cd mobile && eas build --platform android --profile production`
- [ ] **Schrittweiser Rollout** empfohlen: Start mit 10%, dann 25%, 50%, 100%
- [ ] **Release Notes** für erste öffentliche Version schreiben

---

## TEIL 2: ASO-Optimierung (App Store Optimization)

### 2.1 Keyword-Strategie
Der Play Store nutzt keine expliziten Keywords wie Apple — stattdessen werden Keywords aus Titel, Kurzbeschreibung und Langbeschreibung extrahiert.

**Primäre Keywords pro Markt (in Listings bereits eingebaut):**
- DE: GPS-MMO, Territorium, Outdoor-Adventure, Kostenlos, Clans, Duell
- EN: GPS Territory Game, Walking MMO, Free MMO, Location-Based Gaming, Clan Wars
- Alle weiteren Sprachen: siehe `store-listings-all-languages.md`

### 2.2 ASO vs SEO — Der Unterschied
| | ASO (App Store Optimization) | SEO (Search Engine Optimization) |
|---|---|---|
| **Wo** | Play Store / App Store Suche | Google/Bing Websuche |
| **Ranking-Faktoren** | Downloads, Bewertungen, Keywords in Listing, Retention | Backlinks, Content, Technik, Authority |
| **Ziel** | App-Installationen | Website-Besucher |
| **Was wir tun** | Listing optimieren, Reviews sammeln | Landing Page indexieren, Content erstellen |

### 2.3 Erste Bewertungen sammeln (kritisch für ASO!)
- [ ] Freunde/Beta-Tester bitten, echte Reviews zu schreiben
- [ ] In-App Review-Prompt implementieren (nach Level 3 oder 5 beanspruchten Territorien)
- [ ] Auf negative Reviews schnell antworten in Play Console

### 2.4 Screenshots-Empfehlungen
Für maximale Conversion:
1. **Screen 1:** Hero-Shot — Karte mit beanspruchten Territorien + Headline "Deine Stadt. Dein Spielfeld."
2. **Screen 2:** Echo-Feature — Audio-Nachricht an einem Ort
3. **Screen 3:** Defense-Minigames — Tic Tac Toe / Memory auf der Karte
4. **Screen 4:** Clan-System — Gruppen erobern gemeinsam
5. **Screen 5:** Events / Meetups — Spontane Treffen auf der Karte
6. **Screen 6:** Quests & Challenges — Abenteuer-System
7. **Screen 7:** "100% Kostenlos. Keine Werbung. Keine Pay-to-Win."
8. **Screen 8:** Leaderboard / Statistiken

---

## TEIL 3: Google Search Console — Aktionsplan

### 3.1 Sofort erledigen (heute)
- [ ] **Search Console öffnen:** https://search.google.com/search-console
- [ ] **Property mapraiders.com** auswählen (bereits verifiziert)
- [ ] **Sitemaps** → `https://mapraiders.com/sitemap.xml` einreichen
  - Falls bereits eingereicht: "Erneut senden" klicken
- [ ] **URL-Prüfung** → folgende URLs manuell zur Indexierung einreichen:
  1. `https://mapraiders.com/`
  2. `https://mapraiders.com/en/`
  3. `https://mapraiders.com/en/privacy.html` (NEU!)
  4. `https://mapraiders.com/en/terms.html` (NEU!)
  5. `https://mapraiders.com/vs/ingress.html`
  6. `https://mapraiders.com/vs/pokemon-go.html`
  7. `https://mapraiders.com/howto/`
  8. `https://mapraiders.com/en/howto/`

### 3.2 Indexierungsstatus prüfen
- [ ] **Seiten → Indexierung** aufrufen
- [ ] Prüfen: Wie viele Seiten sind "Gültig"? Wie viele "Nicht indexiert"?
- [ ] Häufige Probleme bei neuen Domains:
  - "Gefunden – derzeit nicht indexiert" → Google kennt die URL, hat sie aber noch nicht gecrawlt
  - "Gecrawlt – derzeit nicht indexiert" → Google hat die Seite gelesen, hält sie aber (noch) für nicht relevant genug
  - Lösung: Mehr Backlinks, Social Shares, manuelle Indexierung anfragen

### 3.3 Leistungsdaten prüfen (sobald indexiert)
- [ ] **Leistung** → Suchanfragen anschauen
- [ ] Nach Brand-Keywords suchen: "mapraiders", "map raiders"
- [ ] Klicks vs. Impressionen analysieren
- [ ] CTR (Click-Through-Rate) — wenn <5%, Meta-Descriptions verbessern

### 3.4 Internationales Targeting
- [ ] **Hreflang-Tags** sind in der Sitemap korrekt (13 Sprachen + x-default) ✅
- [ ] In GSC prüfen unter **Internationale Ausrichtung** ob hreflang-Fehler angezeigt werden
- [ ] Separate Properties für `/en/`, `/fr/` etc. sind NICHT nötig — die hreflang-Tags reichen

### 3.5 Backlink-Strategie (parallel starten)
Neue Domains brauchen Backlinks um bei Google Autorität aufzubauen:
- [ ] Eintrag bei relevanten Gaming-Verzeichnissen
- [ ] Reddit-Posts in r/AndroidGaming, r/locationbasedgaming, r/ingress
- [ ] ProductHunt Launch planen
- [ ] Gaming-Blogs/Reviewer kontaktieren
- [ ] Social Media Profiles verlinken auf mapraiders.com

---

## TEIL 4: Zeitplan — Nächste Schritte

| Tag | Aufgabe |
|-----|---------|
| **Heute** | ✅ EN Privacy Policy + Terms erstellt, Sitemap aktualisiert |
| **Heute** | GSC: Sitemap einreichen, Top-URLs manuell indexieren |
| **Heute** | Play Console: Privacy URL eintragen, Data Safety ausfüllen |
| **Morgen** | Play Console: Store Listings in allen 13 Sprachen eintragen |
| **Morgen** | Screenshots erstellen / beauftragen |
| **Diese Woche** | Altersfreigabe-Fragebogen + App-Zugriff ausfüllen |
| **Diese Woche** | Production Build (AAB) erstellen und hochladen |
| **Diese Woche** | Schrittweiser Rollout starten (10%) |
| **Nächste Woche** | Erste Reviews sammeln, ASO überwachen |
| **Nächste Woche** | GSC Indexierungsstatus prüfen |

---

## Dateien-Referenz

| Datei | Zweck |
|-------|-------|
| `docs/en/privacy.html` | Englische Datenschutzerklärung (NEU) |
| `docs/en/terms.html` | Englische AGB (NEU) |
| `docs/agb.html` | Deutsche AGB |
| `docs/datenschutz.html` | Deutsche Datenschutzerklärung |
| `docs/impressum.html` | Impressum |
| `docs/sitemap.xml` | Sitemap (aktualisiert mit Legal-Seiten) |
| `docs/store-listing.md` | Play Store Listing (Original DE) |
| `docs/store-listings-all-languages.md` | Alle 13 Sprach-Listings |
| `docs/play-store-data-safety.md` | Data Safety Vorlage |

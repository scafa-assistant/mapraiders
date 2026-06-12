# Einarbeitungs-Plan: Marktrecherche → Website/ASO/GEO (2026-06-11)

**Quelle:** Externe Deep-Research (Protokoll `MAPRAIDERS_RECHERCHE_PROTOKOLL.md`),
abgeglichen gegen Memory-Stände (SEO-Plan, ASO-Strategie, Nischen, Saudi-Asset)
und Live-Site (curl-verifiziert 2026-06-11).

**Arbeitsregel:** EINS NACH DEM ANDEREN. Jede Phase endet mit: tsc/Validierung →
Commit → Deploy (SSH Hetzner) → Live-Verifikation per curl. Keine Phase
beginnen, bevor die vorherige live verifiziert ist.

**Leitplanken (gelten für JEDEN Text):**
- Keine Spielerzahl-Behauptungen. Frame: "Die Karte ist leer — sei der Erste."
- Privacy-Claims nur belegbar: "Standort nur beim Spielen, keine Werbe-Tracker,
  kein Datenverkauf." NICHT: "anonym", "100% privat".
- Scopely/Saudi: NUR belegte Fakten (Verkauf März 2025, 3,5 Mrd. $, Scopely ⊂
  Savvy Games ⊂ PIF) mit Quellen-Links (404media, Engadget, Techdirt — URLs im
  Saudi-Memory). Kein Bashing, keine Spekulation über Datennutzung.
- AR-Markt (arabische Seiten): KEINE Saudi-Kritik — Komplement-Frame
  (siehe Memory saudi-pokemon-go-acquisition). Scripts müssen `ar/` ausschließen.
- Keine Gesundheitsversprechen (ADHS-Seite: "kann helfen, macht Spaß" — keine
  Therapie-Claims).
- EN-Texte: Humanizer-Pass (Skill `~/.claude/skills/humanizer/`). DE: Hand-Ton.

---

## Phase 0 — Ehrlichkeits- & Konsistenz-Fixes (≈1h, SOFORT)

### 0.1 llms.txt korrigieren (`docs/llms.txt`)
- [x] **"iOS/Android" → "Android"** ✅ live verifiziert 2026-06-11 (Commit `ecbadc8`)
- [x] "closed beta 2026" → "Google Play launch 2026; iOS planned" ✅
      (auf "live on Google Play" umstellen, sobald Listing live ist)
- [x] Identitäts-Frame ergänzt (Ownership-Zeile + "no ads, no sale of location
      data" als Price-Zeile) ✅
- [x] Kontrast-Fakt aufgenommen (Context-Zeile: Scopely/Savvy/PIF März 2025) ✅
- [x] Neue Core-Pages in llms.txt verlinkt ✅ (Buyout-Explainer + Geocaching-
      Listicle, 2026-06-11).

### 0.2 assetlinks.json (`docs/.well-known/assetlinks.json`)
Stand: 404 — steht seit April im eigenen ASO-Plan (Subsystem 8), nie umgesetzt.
- [ ] SHA-256-Fingerprint des **Google-Play-App-Signing-Keys** holen
      (Play Console → Einrichtung → App-Signatur — erst NACH erstem AAB-Upload
      verfügbar; zusätzlich EAS-Upload-Key-Fingerprint mit aufnehmen).
- [ ] Datei erzeugen (`relation: delegate_permission/common.handle_all_urls`,
      package `com.mapraiders.app`).
- [ ] nginx prüfen: `/.well-known/` muss mit `Content-Type: application/json`
      ausgeliefert werden (SSH-Key `~/.ssh/mapraiders-deploy/deploy_key`).
- [ ] Verifikation: `curl -s https://mapraiders.com/.well-known/assetlinks.json`
      + Googles Digital Asset Links API Testtool.

### 0.3 Fakten-Basis zentralisieren
- [x] `docs/_facts_scopely.md` erstellt ✅ (Commit `ecbadc8`). Zusatz-Fix:
      nginx blockt jetzt `^/_`-Pfade (404) — die `_apply_*.py`-Scripts waren
      bisher öffentlich abrufbar. Config-Backup auf dem Server angelegt.

**Phase-Abschluss:** Deploy + curl-Verifikation llms.txt & assetlinks.json, Commit.

---

## Phase 1 — GEO-Härtung der vs-Seiten (≈3–4h)

Befund: `vs/pokemon-go.html` hat nur 1 Tabelle, **0 Erwähnungen** von
Scopely/Saudi. Die Memory-Strategie von April wurde nie in Content umgesetzt.
LLMs extrahieren bevorzugt harte Tabellen → größter GEO-Hebel pro Stunde.

### 1.1 Vergleichstabellen-Template (DE+EN handschriftlich)
Zeilen (Feature | MapRaiders | Konkurrent):
Preis/Paywall · Werbung · In-App-Käufe nötig · Eigentümer (unabhängig vs.
Konzern/Staatsfonds) · Standortdaten-Verkauf · Echte Flächen-Eroberung ·
User-Generated-Content (Quests/Echos) · Funktioniert in Kleinstädten ·
Accountlöschung in-App.
- [x] Tabelle als HTML `<table>` direkt unter Hero (BLUF) ✅ — via
      `_apply_geo_tables.py` (Marker `GEO-FACTS-TABLE`) auf DE/EN/EN-IN/ID
      für pokemon-go, ingress, geocaching.
- **NEBENBEFUND BEHOBEN:** `en|en-in|id /vs/geocaching.html` hatten den
  kompletten Pokémon-GO-Body (Copy-Paste-Template-Bug, sichtbarer Content
  widersprach Title/Schema). EN-Body neu geschrieben (inkl. Paywall-Block),
  in en-in/id transplantiert. Außerdem: en-in CSS-Korruption gefixt
  (`align-items:centre`, `colour:` in 29+2 Dateien — `_fix_enin_css.py`).

### 1.2 Scopely/Ownership-Block
- [x] `vs/pokemon-go.html` + `vs/ingress.html` (DE+EN+EN-IN+ID): "Who owns
      your location data?"-Block mit 3 Quellen-Links ✅ (im Tabellen-Block
      von `_apply_geo_tables.py`, Bausteine aus `_facts_scopely.md`).
- [x] `vs/geocaching.html`: EN-Paywall-Abschnitt im neuen Body; DE eigener
      Abschnitt "Verschwundene Dosen → Echo-Prinzip" (Marker
      `GEO-PAYWALL-SECTION`) ✅
- [x] `vs/zenly.html` (DE+EN): Jagat-Abschnitt (Marker `GEO-JAGAT-SECTION`) ✅

### 1.3 Script-Rollout auf Restsprachen
- [x] `docs/_apply_geo_tables.py` ✅ (Commits `fe0b6e3` + `04aca43`):
      45 vs-Seiten in 15 Sprachvarianten (de, en, en-in, id + 11 übersetzte).
      `ar/` per Pfad-Filter + assert hart ausgeschlossen, live verifiziert
      (0 Savvy-Treffer auf ar/vs/pokemon-go.html). Native Dicts inkl.
      zh-tw eigenständig traditionell (沙烏地/匯出).

### 1.4 VideoGame-Schema
- [x] `docs/_apply_videogame_schema.py`: 343 Seiten (alle mit MobileApplication-
      Schema) haben jetzt zusätzlich VideoGame-JSON-LD, gespiegelt aus dem
      jeweiligen MobileApplication-Block ✅. Alle 3204 JSON-LD-Blöcke der Site
      parsen fehlerfrei. Rich-Results-Stichprobe nach Deploy.

**Phase-Abschluss:** ✅ ERLEDIGT 2026-06-11. Shingle-Check vs-Seiten max 17,6%
(EN-geocaching-Fix beseitigte das schlimmste Near-Duplicate). Deployed +
live-verifiziert: DE/EN/JA/RU/ZH-TW Stichproben ok, AR-Ausschluss bestätigt.
Commits: `fe0b6e3` (DE/EN + VideoGame-Schema + Bugfixes), `04aca43` (11 Sprachen).

---

## Phase 2 — Neue Content-Assets (≈1–2 Tage, EN zuerst, dann DE)

Reihenfolge = Priorität. Jedes Asset: BLUF-Aufbau (Antwort im ersten Absatz),
FAQ-Schema, interne Links auf vs-Seiten + Nischen-Seiten + Play-CTA mit UTM.

### 2.1 Scopely/Niantic-Explainer (TOFU, Prio 1)
- [ ] `/en/niantic-scopely-buyout.html` + `/de/niantic-scopely-verkauf.html`
- Inhalt: Was wurde verkauft, an wen, was bedeutet das für Standortdaten,
  was können Spieler tun (inkl. ehrlicher "Alternativen"-Abschnitt, in dem
  MapRaiders EINE Option unter mehreren ist — Glaubwürdigkeit > Pitch).
- Ziel-Queries: "pokemon go saudi arabia", "niantic scopely buyout explained",
  "wer besitzt pokemon go".
- [x] Alle vs-Seiten (außer AR) verlinken intern hierauf ✅
      (`_apply_explainer_links.py`, 30 Seiten, DE→DE-Artikel, Rest→EN).
- [x] **2.1 KOMPLETT** ✅ Commit `a5c8f1d`, live verifiziert:
      /en/niantic-scopely-buyout.html + /niantic-scopely-verkauf.html
      (DE im Site-Root statt /de/ — Site-Konvention).

### 2.2 Geocaching-Listicle (MOFU, Prio 2)
- [x] `/en/free-geocaching-alternatives.html` +
      `/geocaching-alternative-kostenlos.html` ✅ Commit `a5c8f1d`, live.
      Roundup Munzee/Adventure Lab/Waymarking/Gratis-Tier/MapRaiders mit
      Offenlegung + ItemList-Schema.
- Roundup-Format (rankt für "alternatives"-Queries besser als vs-Seiten):
  ehrlicher Vergleich Munzee / Adventure Lab / Waymarking / MapRaiders mit
  Tabelle (Paywall? Werbung? UGC?). MapRaiders-Stärke: keine Premium-Stufe,
  Echos statt physischer Dosen.
- Abgrenzung zur bestehenden `vs/geocaching.html`: Listicle = Marktübersicht,
  vs-Seite = 1:1-Vergleich. Gegenseitig verlinken, Canonicals getrennt.

### 2.3 ADHS / Bewegungsmotivation (TOFU, Prio 3 — NEUE Nische #16)
- [ ] `/en/adhd-walking-motivation.html` (EN zuerst; DE nach Performance-Check)
- Frame: Gamification, sichtbarer Fortschritt, Streaks, "der Spaziergang hat
  ein Ziel" — KEINE Therapie-/Gesundheits-Claims, keine Heilversprechen.
- [x] Nischen-Memory um Nische 16 (ADHS) + Soundmap-Wettbewerber ergänzt ✅

### 2.4 Early-Adopter / "Claim your empty city" (BOFU, Prio 4)
- [ ] `/en/claim-your-city.html` + `/de/erobere-deine-stadt.html`
- Anti-Geisterstadt-Spin als Stärke: "Das weiße Blatt. Jede Straße noch frei.
  Pionier-Titel für die Ersten." (pioneer-Badge existiert in der App — Beleg!)
- Direktester Install-Intent → prominenter Play-CTA, UTM `utm_campaign=pioneer`.

### 2.5 Soundmap-Abgrenzung (klein, Prio 5)
- [x] Abschnitt "Soundmap and Music-GPS Apps" auf `/en/audio-graffiti/`
      (Marker `GEO-SOUNDMAP-SECTION`, Sammeln-vs-Publizieren-Frame) ✅

**Phase-Abschluss:** Humanizer-Pass (EN), FAQ-Schema-Validierung, Sitemap-
Einträge, hreflang DE↔EN, Deploy, Commit pro Asset.

---

## Phase 3 — Rollout, Verlinkung, Hygiene (≈1 Tag)

- [ ] 3.1 Sprach-Rollout NUR für Explainer + Geocaching-Listicle (internationales
      Suchvolumen belegt). ADHS + Claim-your-city: erst 4 Wochen GSC-Daten
      abwarten, dann entscheiden. AR: Explainer NICHT ausrollen.
- [ ] 3.2 Interne Verlinkung per `_apply_internal_links.py`-Muster: Killer-
      Keyword-Anker von Nischen-Seiten → neue Assets (z.B. dog-walking →
      claim-your-city).
- [ ] 3.3 llms.txt um die neuen Core-Pages ergänzen (Rückbezug Phase 0.1).
- [ ] 3.4 Sitemaps regenerieren (`_apply_*_sitemaps.py`-Muster), GSC-Submit
      der geänderten URLs (URL-Inspection-Stichproben).
- [ ] 3.5 Duplicate-Audit: Shingle-Hashing über neue + geänderte Seiten,
      Threshold >80% → Refactor (Plan steht im SEO-Memory).

---

## Phase 4 — ASO-Anbindung (nach Play-Listing-Freischaltung, ≈2–3h)

- [ ] 4.1 **Custom Store Listings** (Bericht-Hebel #1 für 2026):
      CSL "Dog Walking" (Screenshots: Pet-Screen, Gassi-Event, Karte) und
      CSL "Geocaching/Quests" (Screenshots: Erstellen-Hub, Echo, Quest).
      `store-assets/generate_screenshots.py` mit anderen Quellen/Captions
      wiederverwenden. Verknüpfung: Nischen-Page-UTM → passendes CSL.
- [ ] 4.2 Install-Buttons aller 13-Sprachen-Seiten auf finale Play-URL mit
      UTM umstellen (`?id=com.mapraiders.app&referrer=utm_source%3Dweb...`).
- [ ] 4.3 `_apply_*`-Script: Organization-Schema `sameAs` += Play-Store-URL
      (alle 13 Sprachen).
- [ ] 4.4 DE-Titel-Experiment ("GPS Revier-Spiel" vs "GPS Spiel & Karte")
      als Play-Listing-Experiment — FRÜHESTENS 4 Wochen nach Launch, nicht
      die laufende Submission anfassen.
- [ ] 4.5 KPI-Setup: D1/D7/D30-Retention + Vitals (Thresholds im ASO-Memory),
      Acquisition-Report pro UTM-Campaign.

---

## Phase 5 — Seeding & UGC (laufend, nachgelagert)

- [ ] 5.1 Reddit-Seeding-Briefing für René: ehrliche "Indie dev built a
      privacy-friendly GPS territory game"-Posts in r/AndroidGaming,
      r/walking, r/geocaching (Regeln je Subreddit prüfen!). KEIN Astroturfing,
      keine Fake-Accounts — LLMs zitieren Reddit, ein Bann schadet dauerhaft.
- [ ] 5.2 Forum auf mapraiders.com: läuft über `SOCIAL_LAYER_MISSION.md`
      (Prio nach App-Launch). Neu aus dem Bericht dort einarbeiten:
      `DiscussionForumPosting`-Schema + Start klein/stark moderiert
      (Spieler-Geschichten, Quest-Routen) gegen Thin-Content-Risiko.

---

## Mess-Methodik (nach jeder Phase prüfen)

| Kanal | Metrik | Werkzeug |
|---|---|---|
| SEO | Impressionen/Klicks neue URLs, PAA-Snippets | GSC (Export steht aus — Briefing `seo-strategy/GSC_EXPORT_AGENT_BRIEFING.md`) |
| GEO | Zitiert in Antworten auf 5 Ziel-Prompts ("best privacy gps games 2026", "pokemon go alternative no data selling", …) | monatlicher Hand-Check ChatGPT/Perplexity/AI Overviews, Ergebnis in `seo-strategy/` loggen |
| AEO | FAQ-Rich-Results, Snippet-Eroberung | GSC Darstellung + Rich-Results-Test |
| ASO | D1/D7/D30, Conversion, Installs pro UTM | Play Console |

## Aufwands-Übersicht & Reihenfolge

| Phase | Aufwand | Abhängigkeit |
|---|---|---|
| 0 Konsistenz-Fixes | ~1h | keine (0.2 braucht ersten AAB-Upload für Play-Fingerprint) |
| 1 GEO-vs-Seiten | 3–4h | Phase 0 (Fakten-Basis) |
| 2 Content-Assets | 1–2 Tage | Phase 1 (Verlinkungs-Ziele) |
| 3 Rollout/Hygiene | 1 Tag | Phase 2 |
| 4 ASO | 2–3h | Play-Listing live |
| 5 Seeding/UGC | laufend | App im Store |

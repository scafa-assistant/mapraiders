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
- [ ] **"iOS/Android" → "Android"** (iOS existiert nicht; ggf. "iOS planned").
      Misleading-Claim-Risiko, LLMs übernehmen das wörtlich.
- [ ] "closed beta 2026" aktualisieren → "live on Google Play (2026)" sobald
      Listing live ist.
- [ ] Identitäts-Frame ergänzen (löst Widerspruch "made in Germany" vs US-LLC):
      `Developed in Germany. Operated by Scafa Investments LLC (US). Independent
      — not owned by any corporation or sovereign wealth fund. Free, no ads,
      no sale of location data.`
- [ ] Kontrast-Fakt aufnehmen: `Unlike Pokémon GO/Ingress (sold to Scopely,
      a Savvy Games / Saudi PIF company, in 2025), MapRaiders is independent.`
- [ ] Neue Core-Pages verlinken sobald sie existieren (Phase 2): Buyout-Explainer,
      Geocaching-Listicle.

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
- [ ] `docs/_facts_scopely.md` (nicht deployen, nur Quelle für Scripts/Autoren):
      belegte Fakten + Quellen-URLs + Verbots-Liste (was NICHT behauptet werden
      darf). Verhindert Drift über 13 Sprachen.

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
- [ ] Tabelle als HTML `<table>` MIT `itemscope`-freiem, sauberem Markup
      (LLM-lesbar), direkt unter dem Hero-Abschnitt (BLUF-Prinzip).

### 1.2 Scopely/Ownership-Block
- [ ] `vs/pokemon-go.html` + `vs/ingress.html` (DE+EN): kurzer faktischer
      Abschnitt "Who owns your location data?" mit den 3 Quellen-Links.
- [ ] `vs/geocaching.html` (DE+EN): stattdessen Paywall-Frustrations-Abschnitt
      (Premium-Mikrocaches, verschwundene Dosen → Echos als digitale Caches).
- [ ] `vs/zenly.html` (DE+EN): Jagat-Abschnitt ergänzen ("die Nachfolger und
      ihre Probleme: Bugs, Akku") → deckt Bericht-Asset 10 ohne neue Seite ab.

### 1.3 Script-Rollout auf Restsprachen
- [ ] `docs/_apply_geo_tables.py` (idempotent via Marker, Muster
      `_apply_founder_reviews.py`): Tabellen + Blöcke in 10 Sprachen.
      **`ar/` hart ausschließen** (Komplement-Frame). HI/JA/KO/ZH:
      Übersetzungs-Dict im Script, kein MT-Einzeiler.

### 1.4 VideoGame-Schema
- [ ] `docs/_apply_videogame_schema.py`: auf vs-/Feature-/Nischen-Seiten
      zusätzlich `VideoGame`-JSON-LD (neben MobileApplication) — deterministische
      Kategorie-Übermittlung. Validierung: Rich-Results-Test auf 3 Stichproben.

**Phase-Abschluss:** Shingle-Duplicate-Check der geänderten Seiten, Deploy,
curl-Stichproben (DE, EN, JA, AR-Ausschluss verifizieren), Commit.

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
- [ ] Alle vs-Seiten (außer AR) verlinken intern hierauf.

### 2.2 Geocaching-Listicle (MOFU, Prio 2)
- [ ] `/en/free-geocaching-alternatives.html` +
      `/de/geocaching-alternative-kostenlos.html`
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
- [ ] Nischen-Memory um Nische 16 (ADHS) + Soundmap-Wettbewerber ergänzen.

### 2.4 Early-Adopter / "Claim your empty city" (BOFU, Prio 4)
- [ ] `/en/claim-your-city.html` + `/de/erobere-deine-stadt.html`
- Anti-Geisterstadt-Spin als Stärke: "Das weiße Blatt. Jede Straße noch frei.
  Pionier-Titel für die Ersten." (pioneer-Badge existiert in der App — Beleg!)
- Direktester Install-Intent → prominenter Play-CTA, UTM `utm_campaign=pioneer`.

### 2.5 Soundmap-Abgrenzung (klein, Prio 5)
- [ ] KEINE neue Seite: Abschnitt auf `/en/audio-graffiti/` ergänzen
      ("Music-GPS-Apps wie Soundmap vs. eigene Stimme auf der Karte").

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

# 02 — Final Master Plan: Markt USA / Global English (EN)

**Sprache:** English (en) — primär US, sekundär UK/AU/CA (single hreflang `en`)
**Markt-Tier:** 1 — Pflicht-Markt, **#1 Pokémon-GO-Markt mit 36.6% Lifetime-Revenue**
**Erstellt:** 2026-04-28
**Auftraggeber:** René Scafarti (Founder, Scafa Investments LLC)
**Basiert auf:**
- 📄 [`keyword-research/02_EN_keyword_report.md`](../keyword-research/02_EN_keyword_report.md) (~28 KB Volumen-Recherche)
- 📄 [`implementation/00_MASTER_OVERVIEW.md`](00_MASTER_OVERVIEW.md)
- 📄 [`implementation/01_URL_MASTER_LIST.md`](01_URL_MASTER_LIST.md) (15 finale EN-URLs)
- 📄 [`implementation/02_DE_FINAL_MASTER_PLAN.md`](02_DE_FINAL_MASTER_PLAN.md) als Struktur-Vorlage

---

## 0. Executive Summary

Die USA sind **der wertvollste Markt der Welt für GPS-MMOs**: 36.6% des globalen Pokémon-GO-Lifetime-Revenue ($2.2 Mrd. von $8.8 Mrd.), ~40M aktive Spieler (37% von 110M MAU). **Aber:** der Markt ist 2025-26 in einer **tiefen Niantic-Vertrauenskrise**, was MapRaiders zur idealen "Refugee-Alternative" macht.

**Die 4 Markt-Realitäten in den USA:**

1. **Pokémon GO Revenue auf 5-Jahres-Tief** (Remote-Raid-Pass-Controversy, #HearUsNiantic-Bewegung organisiert)
2. **"Pokemon GO was a scam"-Sentiment** seit Niantic-CEO-Confession ("users were essentially providing free training data for our geospatial AI model")
3. **Saudi-Acquisition März 2025** ($3.5B-Deal an Scopely/PIF) — Big-Tech + Big-Government-Concerns vereint
4. **Strava × Fi Partnership 2025** (Hunde-Collar + Fitness-App) zeigt: Hund+GPS-Trend ist real, US-Markt aktiv

**MapRaiders-Killer-Angle US:** "**Niantic refugee home** — real territory ownership, no remote-raid-pass paywall, no Saudi data harvesting. The map is your social network, not Niantic's data lake."

US-Tone ist **direkter, aktiver, Achievement-orientierter** als DE-Tone. Vokabular: "conquer", "claim", "dominate" — nicht "explore" oder "discover". Achievement-language schlägt Subtilität.

**Strategische Pfeiler in den USA:**

- **#HearUsNiantic-Refugee-Frame** — direkt Sentiment-tap, US-Community-Identity
- **Anti-Big-Tech-Data-Selling-USP** — post-Snowden + post-Cambridge-Analytica + post-Niantic-Confession
- **Strava-Komplement-Frame** — "Strava for casual players, territory not stopwatches"
- **50+ Longevity-Gaming** — fastest-growing US fitness segment 2026
- **Zenly-Vakuum-Replacement** — 100M Zenly-Refugees seit 2023 ohne Map-Social-Network
- **iOS-Launch-Disclosure** — US ist 55%+ iOS, Android-only ist 50% Audience-Hit

**Phase-1-Lieferumfang EN:**

- **15 URLs** = 7 Killer + 7 Reviews-Twins + 1 Hub
- **Davon 14 NEU + 1 EXISTIERT** (`/en/territory-game-app.html` bleibt)
- **Sprint-Dauer:** 7 Tage (Sprint 2 in Phase-1-Plan, direkt nach DE)
- **6-Monats-KPI:** Top-3 für mind. 3 Killer-Keywords, Top-10 für 5-7 Killer-Keywords, US-Audience +500-1000% organischer Traffic

**Wichtig:** EN ist **das höchste Volumen** aller 16 Märkte. Killer #2 `/en/games-like-pokemon-go.html` allein hat 30.000-45.000 Suchen/Monat — eine einzige Top-3-Position kann den gesamten US-Markt zünden.

---

## 1. Kern-Entscheidungen

### 1.1 Pricing-Modell US

**Empfehlung:** Cosmetic-Only-IAP + optionale Supporter-Subscription, USD-Default

| Tier | Was | Preis (USD) |
|---|---|---|
| **Free Forever** | 100% Gameplay | $0.00 |
| **Cosmetic-IAP** | Marker designs, territory colors, clan emblems, skins, animations | $1.99 – $9.99 |
| **MapRaiders Supporter** (Sub) | Honor badge, beta access, monthly cosmetic pack, founder letter | $4.99/Monat |
| **Lifetime Supporter** | Collector cosmetic + credits mention | $99 einmalig |

**Begründung für US:**

- US-Cosmetic-Markt akzeptiert höhere Preise als DE/IN/MX (kaufkräftiger)
- Sub-Modell wächst in US (Disney+, Netflix, etc. — Sub-Müdigkeit weniger als in EU)
- Sales tax handling per-state ist out-of-scope für SEO (App Store handelt das)
- "No subscription required" prominent kommunizieren — Anti-Sub-Frame als Trust-Signal

**Sichtbarkeit:**

- Pricing-Hinweis: "Free forever. Cosmetic-only IAP from $1.99. No battle pass, no required sub."
- Schema.org `MobileApplication.offers` mit USD-Beträgen
- Pricing-Page `/en/pricing.html` (Tier-2 Conversion-Page)

### 1.2 Beta-Tester-Strategie EN

**Final-Setup (gleiche Tester wie DE, lokalisiert):**

- **Ron C. (Dog Owner, Stuttgart area, Germany)** — Vorname + Initial only
- **Vivian N. (Runner, Hamburg area, Germany)** — Vorname + Initial only
- **Aljoscha P. (Urban Explorer, Berlin area, Germany)** — Vorname + Initial only

**Wichtig:** Tester sind **physisch in Deutschland**, ihre Quotes sind aus dem deutschen Original übersetzt. Schema.org markiert das mit `translationOfWork`:

```json
{
  "@type": "Review",
  "@id": "#review-ron-c-en",
  "author": { "@type": "Person", "name": "Ron C.", "description": "Dog owner from the Stuttgart area, Germany (closed beta)" },
  "reviewBody": "My dog loves his walk — and I love that every walk makes my neighborhood more visible on the map. I've conquered my whole street already.",
  "datePublished": "2026-03-15",
  "inLanguage": "en",
  "translationOfWork": {
    "@type": "Review",
    "@id": "#review-ron-c",
    "inLanguage": "de"
  }
}
```

- **Pill-Label "From the closed beta"** auf jeder Tester-Card
- **Notfall-Skript `_apply_remove_review.py`** bereit für Widerruf
- **US-Tester-Recruitment** als Tier-2-Phase nach Launch (für US-Authentizität, mit CCPA-Einwilligung)

### 1.3 Trigger-Sätze EN (6 final)

US-Trigger-Sätze sind **direkter und Achievement-orientierter** als DE-Versionen. Active voice, claim-language.

| # | Trigger-Satz | Persona | Verwendung |
|---|---|---|---|
| 1 | "My dog knows his 5 favorite Echoes. I know my territory." | Dog Owner (Ron C.) | `/en/best-walking-apps-with-game.html`, `/en/territory-game-app.html` |
| 2 | "My cardio drive exploded the moment every run became a conquest." | Runner (Vivian N.) | `/en/games-like-pokemon-go.html`, `/en/best-walking-apps-with-game.html` |
| 3 | "Dropping Echoes is like an open scavenger hunt across the whole city." | Urban Explorer (Aljoscha P.) | `/en/scavenger-hunt-app.html`, `/en/zenly-alternative.html` |
| 4 | "Ad-free, no data selling, no Saudi sovereign-fund ownership — the map is yours." | Privacy-aware (Founder) | `/en/pokemon-go-alternative-free.html`, `/en/niantic-alternative.html` |
| 5 | "Built by a Pokémon GO refugee. Real territory, no remote-raid-pass paywall." | Refugee-Frame (Founder) | `/en/niantic-alternative.html`, `/en/games-like-pokemon-go.html` |
| 6 | "When Zenly shut down in 2023, 100M people lost their map social network. We rebuilt it." | Brand-Vision | `/en/zenly-alternative.html`, `/en/territory-game-app.html` |

**Tone-Regel US:** "Conquer", "claim", "dominate", "own" sind explizit erlaubt und gewünscht. **Achievement-language slug:** US-Gamer-Lexikon erwartet das. Dennoch: keine "JOIN NOW!"-Caps, keine Pseudo-Urgency.

### 1.4 Übersetzungs-Strategie

**EN-Reviews sind Übersetzungen aus DE-Original.**

Schema.org markiert das technisch korrekt:
```json
"translationOfWork": { "@type": "Review", "@id": "#review-ron-c", "inLanguage": "de" }
```

**Founder-Quote (englisch):**

> "I was one of the frustrated Pokémon GO players. I wanted real territory, not a fleeting gym capture. I didn't want my steps sold to Saudi sovereign funds, no ad-network business model, no required premium sub. So I built MapRaiders. This is my home turf — and it's about to be yours."
> — René Scafarti, Founder

---

## 2. Top URLs EN (15 final)

Aus `01_URL_MASTER_LIST.md` Block 02-EN übernommen.

### 2.1 Killer-URLs (7)

| # | URL | Hauptkeyword | Vol/Mo | Status |
|---|---|---|---|---|
| K1 | `/en/pokemon-go-alternative-free.html` | pokemon go alternative free | 2.500–4.000 | NEU |
| K2 | `/en/games-like-pokemon-go.html` | games like pokemon go | **30.000–45.000** | NEU |
| K3 | `/en/territory-game-app.html` | territory game app | 400–800 | EXISTIERT |
| K4 | `/en/niantic-alternative.html` | niantic alternative | 1.200–2.000 | NEU |
| K5 | `/en/best-walking-apps-with-game.html` | best walking apps gamified | 800–1.500 | NEU |
| K6 | `/en/scavenger-hunt-app.html` | scavenger hunt app | 8.000–12.000 | NEU |
| K7 | `/en/zenly-alternative.html` | zenly alternative | 1.500–2.500 | NEU |

### 2.2 Reviews-Twins (7)

| # | URL | Vol/Mo |
|---|---|---|
| T1 | `/en/pokemon-go-alternative-reviews.html` | 400–700 |
| T2 | `/en/games-like-pokemon-go-reviews.html` | 600–1.000 |
| T3 | `/en/territory-game-app-reviews.html` | 50–150 |
| T4 | `/en/niantic-alternative-reviews.html` | 200–400 |
| T5 | `/en/walking-app-reviews.html` | 1.000–1.800 |
| T6 | `/en/scavenger-hunt-app-reviews.html` | 200–400 |
| T7 | `/en/zenly-alternative-reviews.html` | 200–400 |

### 2.3 Hub

`/en/mapraiders-reviews.html` — AggregateRating 5.0/3 + alle 3 Tester-Quotes (englisch übersetzt) + Founder-Quote + Links zu allen 14 Killer + Twins.

---

## 3. Inhalte: Founder + Beta-Tester (lokalisiert EN)

### 3.1 Founder-Block (englisch)

```html
<section class="founder-block" itemscope itemtype="https://schema.org/Person">
  <h2>The Founder</h2>
  <figure>
    <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Founder of MapRaiders" itemprop="image">
    <figcaption>
      <strong itemprop="name">René Scafarti</strong>
      <span itemprop="jobTitle">Founder, Scafa Investments LLC</span>
    </figcaption>
  </figure>
  <blockquote itemprop="description">
    "I was one of the frustrated Pokémon GO players. I wanted real territory,
    not a fleeting gym capture. I didn't want my steps sold to Saudi sovereign
    funds, no ad-network business model, no required premium sub. So I built
    MapRaiders. This is my home turf — and it's about to be yours."
  </blockquote>
  <link itemprop="worksFor" href="#org-scafa">
</section>
```

### 3.2 Beta-Tester-Cards (3, English with translationOfWork)

```html
<section class="beta-testers" aria-label="From the closed beta">
  <h2>From the closed beta</h2>
  <p class="closed-beta-intro">
    Three internal beta testers — real people, real routes, real Echoes.
    Reviews translated from the German originals.
  </p>

  <article class="tester-card" itemscope itemtype="https://schema.org/Review" id="review-ron-c-en">
    <span class="pill-label">From the closed beta</span>
    <div itemprop="author" itemscope itemtype="https://schema.org/Person">
      <strong itemprop="name">Ron C.</strong>
      <span itemprop="description">Dog Owner · Stuttgart area, Germany</span>
    </div>
    <div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
      <meta itemprop="ratingValue" content="5">
      <meta itemprop="bestRating" content="5">
      <span class="stars" aria-label="5 out of 5 stars">★★★★★</span>
    </div>
    <blockquote itemprop="reviewBody">
      "My dog loves his walk — and I love that every walk makes my neighborhood
      more visible on the map. I've conquered my whole street already."
    </blockquote>
    <meta itemprop="datePublished" content="2026-03-15">
    <meta itemprop="inLanguage" content="en">
    <link itemprop="translationOfWork" href="#review-ron-c">
  </article>

  <article class="tester-card" itemscope itemtype="https://schema.org/Review" id="review-vivian-n-en">
    <span class="pill-label">From the closed beta</span>
    <div itemprop="author" itemscope itemtype="https://schema.org/Person">
      <strong itemprop="name">Vivian N.</strong>
      <span itemprop="description">Runner · Hamburg area, Germany</span>
    </div>
    <div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
      <meta itemprop="ratingValue" content="5">
      <meta itemprop="bestRating" content="5">
      <span class="stars" aria-label="5 out of 5 stars">★★★★★</span>
    </div>
    <blockquote itemprop="reviewBody">
      "I run every morning anyway. With MapRaiders every route has a goal:
      hold your territory or take it back. My cardio drive has exploded."
    </blockquote>
    <meta itemprop="datePublished" content="2026-03-22">
    <meta itemprop="inLanguage" content="en">
    <link itemprop="translationOfWork" href="#review-vivian-n">
  </article>

  <article class="tester-card" itemscope itemtype="https://schema.org/Review" id="review-aljoscha-p-en">
    <span class="pill-label">From the closed beta</span>
    <div itemprop="author" itemscope itemtype="https://schema.org/Person">
      <strong itemprop="name">Aljoscha P.</strong>
      <span itemprop="description">Urban Explorer · Berlin area, Germany</span>
    </div>
    <div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
      <meta itemprop="ratingValue" content="5">
      <meta itemprop="bestRating" content="5">
      <span class="stars" aria-label="5 out of 5 stars">★★★★★</span>
    </div>
    <blockquote itemprop="reviewBody">
      "Dropping Echoes and watching who finds them is like an open scavenger
      hunt across the whole city."
    </blockquote>
    <meta itemprop="datePublished" content="2026-04-01">
    <meta itemprop="inLanguage" content="en">
    <link itemprop="translationOfWork" href="#review-aljoscha-p">
  </article>

  <div class="aggregate-rating" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
    <meta itemprop="ratingValue" content="5.0">
    <meta itemprop="reviewCount" content="3">
    <meta itemprop="bestRating" content="5">
  </div>
</section>
```

### 3.3 Persona-Verteilung pro Killer-Page

| Killer-URL | Primary Tester(s) |
|---|---|
| K1 (pokemon-go-alternative-free) | Vivian + Aljoscha (Anti-P2W) |
| K2 (games-like-pokemon-go) | alle 3 (Volumen-King, Vielfalt) |
| K3 (territory-game-app) | Ron + Vivian (Conquest-Frame) |
| K4 (niantic-alternative) | alle 3 (Refugee-Frame) |
| K5 (best-walking-apps-with-game) | Vivian + Ron (Walking-Persona) |
| K6 (scavenger-hunt-app) | Aljoscha primär |
| K7 (zenly-alternative) | alle 3 (Map-Social-Frame) |

---

## 4. Detail pro Killer-URL

### 4.1 Killer K1 — `/en/pokemon-go-alternative-free.html`

**Hauptkeyword:** pokemon go alternative free (Vol 2.500–4.000/Monat)
**Strategischer Hook:** Anti-P2W + Saudi-Privacy-USP + Niantic-Refugee-Frame

**Title (60 chars):**
> Pokémon GO Alternative Free — No Ads, No Saudi Data, No Sub

**Meta Description (155 chars):**
> Looking for a Pokémon GO alternative that's actually free? MapRaiders is ad-free, no battle pass, no data selling — and not owned by a sovereign wealth fund.

**H1:**
> Pokémon GO Alternative Free — Ad-Free, No Battle Pass, No Saudi Data Harvesting

**Trigger-Satz:**
> "Ad-free, no data selling, no Saudi sovereign-fund ownership — the map is yours."
> — René Scafarti, Founder

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + 3-Bullet-USP** (free, ad-free, not state-owned)
2. **Why Pokémon GO players are actively searching for alternatives in 2026** (Battle-Pass-fatigue, Remote-Raid-Pass-controversy, Saudi-acquisition, AR battery drain)
3. **What "free" actually means with MapRaiders** (Pricing-table from Section 1.1, Cosmetic-IAP transparently communicated)
4. **Where Pokémon GO costs money — and where MapRaiders doesn't** (Comparison: Battle Pass, Raid Pass, Eggs, Stardust vs MapRaiders' Cosmetic-Only)
5. **The Saudi-Niantic question** (Sub-section: what happened in March 2025, what it means for players, why MapRaiders is the only major LBG not state-controlled)
6. **Beta-Tester Quotes** (Vivian + Aljoscha, Anti-P2W frame)
7. **FAQ** (5 Fragen, FAQPage-Schema)
8. **CTA + internal links**

**FAQ-Inhalt:**

```
Q1: Is MapRaiders really free forever?
A1: Yes. The entire core gameplay — territories, Echoes, quests, clans, defense mini-games — stays free forever. No tier system, no battle pass, no required subscription.

Q2: What does cosmetic-only IAP mean?
A2: Cosmetic items like marker designs, territory colors, or clan emblems range from $1.99 to $9.99. They give zero gameplay advantage — visual customization only.

Q3: Are there ads in the app?
A3: No. MapRaiders is 100% ad-free. We don't sell your data and we don't sell ad space.

Q4: What does "no Saudi ownership" mean?
A4: In March 2025, Niantic sold its game division (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) to Scopely — a subsidiary of the Saudi Public Investment Fund — for $3.5B. The location data of 30M+ monthly Pokémon GO players now indirectly flows to a foreign sovereign fund. MapRaiders is a privately-owned US LLC, not state-controlled.

Q5: When does the iOS version launch?
A5: MapRaiders is currently Android-only (closed beta on Google Play Store). iOS launch is planned for Q3 2026.
```

**Internal Links (5):**

- → `/en/games-like-pokemon-go.html` (Anchor: "all Pokémon GO alternatives compared")
- → `/en/niantic-alternative.html` (Anchor: "the Niantic refugee home")
- → `/en/territory-game-app.html` (Anchor: "real territory game app")
- → `/en/pokemon-go-alternative-reviews.html` (Anchor: "reviews from real players")
- → `/en/mapraiders-reviews.html` (Anchor: "see all beta reviews")

---

### 4.2 Killer K2 — `/en/games-like-pokemon-go.html` (VOLUMEN-KING!)

**Hauptkeyword:** games like pokemon go (Vol 30.000–45.000/Monat)
**Strategischer Hook:** Listicle-Hijack auf höchstem Volumen-Level. Alle Top-SERPs sind Editorial-Listicles (PocketTactics, Eneba, Screen Rant) — wir besetzen die Position als App-Provider mit eigener Listicle-Page, die auf MapRaiders-Slot 1 endet.

**Title (60 chars):**
> 7 Games Like Pokémon GO 2026 — Free, Ad-Free, No Saudi Data

**Meta Description (155 chars):**
> 7 games like Pokémon GO compared: Ingress, Pikmin Bloom, Geocaching, Monster Hunter Now and the only ad-free indie alternative — MapRaiders. Free, no battle pass, no Niantic.

**H1:**
> 7 Games Like Pokémon GO in 2026 — and Why Indie MapRaiders Tops the List

**Trigger-Satz:**
> "My cardio drive exploded the moment every run became a conquest."
> — Vivian N., Runner from the Hamburg area, Germany (closed beta)

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + Listicle-TL;DR** (Top 1: MapRaiders, Top 2-7: alle anderen)
2. **The Pokémon GO problem in 2026** (3 Schmerz-Punkte: P2W, AR battery, Saudi acquisition + Niantic-CEO-Confession)
3. **The 7 best Pokémon GO alternatives compared** (vollständiger Listicle):
   - **#1 MapRaiders** — Indie, ad-free, real territory, AR-free, not state-owned
   - **#2 Ingress (Niantic)** — same Niantic + now Saudi trust problem
   - **#3 Pikmin Bloom (Niantic)** — same baggage, less depth
   - **#4 Monster Hunter Now (Niantic + Capcom)** — polished but Niantic + AR-heavy
   - **#5 Jurassic World Alive (Ludia)** — strong PvP, smaller base
   - **#6 Geocaching (Groundspeak)** — premium paywall, '00s UX
   - **#7 Walkr / Steps & Beasts** — gamified step counter, niche
4. **Comparison table** (Battery life, Free?, Real territory?, Multiplayer?, AR-free?, State-owned?)
5. **What MapRaiders does that no other Pokémon GO alternative does** (5 bullets: persistent territory, Echo-audio, defense mini-games, organic clans, no AR)
6. **Beta-Tester Quotes** (alle 3 Cards)
7. **FAQ** (5 Fragen)
8. **CTA + internal links**

**FAQ-Inhalt:**

```
Q1: Which game like Pokémon GO is actually free?
A1: MapRaiders is the only indie option in the top 7 with 100% free gameplay (cosmetic-only IAP). Geocaching has a free tier but premium features paywall most of the experience.

Q2: Are there games like Pokémon GO that aren't owned by Niantic?
A2: Yes. Since the March 2025 Niantic-Saudi deal, all 4 Niantic LBGs (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) are owned by Scopely/Saudi PIF. MapRaiders is the major non-Niantic alternative.

Q3: Are there games like Pokémon GO without AR?
A3: MapRaiders is intentionally AR-free. GPS + map only. Result: 4× longer battery life and no camera-required gameplay.

Q4: Which alternative works best for runners?
A4: MapRaiders' territory mechanic gives runs a goal (hold or reclaim territory). Strava is performance-tracking, MapRaiders is gameplay — they pair well.

Q5: Are there games like Pokémon GO that work in rural areas?
A5: MapRaiders works wherever GPS works. We don't require dense PokéStop networks — territories can be claimed anywhere with active GPS signal.
```

**Internal Links (6, mehr für Volumen-King-Page):**

- → `/en/pokemon-go-alternative-free.html`
- → `/en/niantic-alternative.html`
- → `/en/territory-game-app.html`
- → `/en/scavenger-hunt-app.html`
- → `/en/games-like-pokemon-go-reviews.html`
- → `/en/mapraiders-reviews.html`

---

### 4.3 Killer K3 — `/en/territory-game-app.html` (EXISTIERT, Optimierung)

**Hauptkeyword:** territory game app (Vol 400–800/Monat)
**Strategischer Hook:** Brand-Kategorie. Niemand sonst rankt für "territory game app" als App-Provider.

**Title (60 chars):**
> Territory Game App — Real-World Map Conquest GPS MMO

**Meta Description (155 chars):**
> What is a territory game app? MapRaiders is the only GPS MMO with persistent real-world land ownership. Free, ad-free, AR-free. Conquer your street, your neighborhood, your city.

**H1:**
> Territory Game App — The Only App Where Real Land Actually Belongs to You

**Trigger-Satz:**
> "My dog knows his 5 favorite Echoes. I know my territory."
> — Ron C., Dog Owner from the Stuttgart area, Germany (closed beta)

**Content-Outline (8 sections, expand existing page):**

1. **Hero + Trigger + Definition** ("A territory game app is…")
2. **What makes a real territory game app** (4 mechanics: persistence, decay, defense, clan handovers)
3. **MapRaiders' territory system in detail** (with map screenshot)
4. **Why Pokémon GO and Ingress are NOT real territory games** (Comparison: gym captures are fleeting, Ingress portals aren't persistent ownership)
5. **Real-world use cases** (Conquer your block, defend during your run, claim during dog walks)
6. **Beta-Tester Quotes** (Ron + Vivian, conquest frame)
7. **Founder-Block**
8. **FAQ + CTA + internal links**

**Internal Links (5):**

- → `/en/games-like-pokemon-go.html`
- → `/en/pokemon-go-alternative-free.html`
- → `/en/features/territories.html` (existing)
- → `/en/territory-game-app-reviews.html`
- → `/en/mapraiders-reviews.html`

---

### 4.4 Killer K4 — `/en/niantic-alternative.html` (NEU)

**Hauptkeyword:** niantic alternative (Vol 1.200–2.000/Monat)
**Strategischer Hook:** **Direct Refugee-Frame.** US-Pokémon-GO-Community ist aktiv #HearUsNiantic-Bewegung. Plus seit März 2025: Niantic-Saudi-Deal — doppelter Trust-Schaden.

**Title (60 chars):**
> Niantic Alternative — Indie GPS MMO, No Saudi, No Battle Pass

**Meta Description (155 chars):**
> Looking for a Niantic alternative after the Saudi acquisition? MapRaiders is indie, ad-free, real territory ownership, no remote raid pass. Built by a Pokémon GO refugee.

**H1:**
> Niantic Alternative — The Indie GPS MMO That Isn't Owned by a Sovereign Fund

**Trigger-Satz:**
> "Built by a Pokémon GO refugee. Real territory, no remote-raid-pass paywall."
> — René Scafarti, Founder

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + Refugee-Frame**
2. **Why "Niantic alternative" became a 2026 search trend** (#HearUsNiantic timeline + Saudi acquisition + geospatial AI confession)
3. **All current Niantic LBGs and why they share the same trust problem** (4 games × 1 owner × 2 layers of distrust = single-vendor risk)
4. **What an actual Niantic alternative needs to deliver** (5 Kriterien: independence, real territory, no AR-required, free-tier, no data harvesting)
5. **MapRaiders against the Niantic catalog** (per-game comparison table)
6. **Beta-Tester Quotes** (alle 3 Cards)
7. **Founder-Block**
8. **FAQ + CTA**

**FAQ-Inhalt:**

```
Q1: Is MapRaiders affiliated with Niantic?
A1: No. MapRaiders is independent — built by Scafa Investments LLC, no relationship with Niantic, Scopely, or the Saudi Public Investment Fund.

Q2: Is MapRaiders affected by the Niantic-Saudi deal?
A2: No. The March 2025 Niantic deal sold Pokémon GO, Ingress, Pikmin Bloom and Monster Hunter Now to Scopely. MapRaiders has zero connection.

Q3: Will MapRaiders accept investment from sovereign funds?
A3: No. MapRaiders is privately owned and is committed to staying independent. No state-controlled investment, period.

Q4: What's #HearUsNiantic about?
A4: A 2023-2025 player movement protesting Niantic's monetization decisions (Remote Raid Pass price hike, Avatar overhaul, Wizards Unite shutdown). It's the largest organized player backlash in LBG history.

Q5: How does MapRaiders avoid Niantic's mistakes?
A5: Cosmetic-only IAP, ad-free, no required AR, AR-free GPS only, persistent territory ownership instead of fleeting captures, organic clans instead of factions, and a public commitment against data-selling and state ownership.
```

**Internal Links (5):**

- → `/en/games-like-pokemon-go.html`
- → `/en/pokemon-go-alternative-free.html`
- → `/en/territory-game-app.html`
- → `/en/niantic-alternative-reviews.html`
- → `/en/mapraiders-reviews.html`

---

### 4.5 Killer K5 — `/en/best-walking-apps-with-game.html` (NEU)

**Hauptkeyword:** best walking apps gamified (Vol 800–1.500/Monat)
**Strategischer Hook:** Walking-Trend + 50+ Longevity-Gaming-Audience. Strava-Komplement-Frame.

**Title (60 chars):**
> Best Walking Apps with Game 2026 — Strava Alternative + LBG

**Meta Description (155 chars):**
> Best gamified walking apps 2026: Strava, Wandrer, Walkr, Steps & Beasts and the only one with real territory — MapRaiders. Free, no sub, dog-walk + run + commute.

**H1:**
> Best Walking Apps with a Real Game — Why Strava Isn't Enough Anymore

**Trigger-Satz:**
> "My cardio drive exploded the moment every run became a conquest."
> — Vivian N., Runner from the Hamburg area, Germany (closed beta)

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + Longevity-Gaming-Frame** ("Walking is the fastest-growing US fitness segment 2026")
2. **Why classic running/walking apps aren't enough** (Strava performance pressure, Nike Run solo coaching, no game element, no social-map)
3. **The 6 best walking apps with game elements compared**:
   - **#1 MapRaiders** — territory + Echoes + clans
   - #2 Strava — performance tracking, segments-leaderboards
   - #3 Wandrer.earth — exploration coverage, no multiplayer
   - #4 Walkr — gamified step counter
   - #5 Steps & Beasts — gamified step counter
   - #6 Strava × Fi (dog) — partnership integration, hardware-required
4. **MapRaiders + Strava — they pair better than they compete**
5. **50+ Longevity-Gaming use case** (mobility, balance, cardio for any age)
6. **Beta-Tester Quotes** (Vivian + Ron, Walking-Persona)
7. **FAQ** (5 Fragen)
8. **CTA + internal links**

**Internal Links (5):**

- → `/en/games-like-pokemon-go.html`
- → `/en/dog-walking/` (Niche-Page existiert)
- → `/en/running-game/` (Niche-Page existiert)
- → `/en/walking-app-reviews.html`
- → `/en/mapraiders-reviews.html`

---

### 4.6 Killer K6 — `/en/scavenger-hunt-app.html` (NEU)

**Hauptkeyword:** scavenger hunt app (Vol 8.000–12.000/Monat)
**Strategischer Hook:** Hohes Volumen, niche aber valide audience (Familien + Stadt-Tour-Suchende). Killer #6 ist nach K2 das zweitstärkste Volumen-Asset.

**Title (60 chars):**
> Scavenger Hunt App 2026 — Live, Citywide, Free, Ad-Free

**Meta Description (155 chars):**
> Best scavenger hunt app 2026: live, citywide, no purchases, no premium tour fees. MapRaiders turns any city into an open-ended scavenger hunt — kids and adults welcome.

**H1:**
> Scavenger Hunt App — A Whole City of Hidden Echoes, Always Live

**Trigger-Satz:**
> "Dropping Echoes is like an open scavenger hunt across the whole city."
> — Aljoscha P., Urban Explorer from the Berlin area, Germany (closed beta)

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + 3-USP** (live, citywide, free)
2. **What makes a modern scavenger hunt app** (3 criteria: live element, social, no premium paywall)
3. **Scavenger hunt app comparison** (Goosechase, Actionbound, Scavify, Geocaching, MapRaiders)
4. **How MapRaiders reinvents scavenger hunts** (Echoes + quests + defense mini-games — the city itself is the playground)
5. **Family use case** (kids age 9+, parental mode, no data collection from minors)
6. **Beta-Tester Quote** (Aljoscha primary)
7. **FAQ** (5 Fragen, 2 zur Familien-Eignung + COPPA-compliance)
8. **CTA + internal links**

**FAQ-Family-spezifisch:**

```
Q: Is MapRaiders safe for kids?
A: Yes, ages 9+ with parental supervision. The app collects no personally identifiable information from minors (COPPA-compliant), is ad-free, and has a parental mode for restricted gameplay.

Q: How much prep do I need for a scavenger hunt with kids?
A: Zero. Unlike Actionbound or Goosechase you don't buy a tour or pre-set stations. Echoes are already across the city — you follow other players' clues or leave your own.

Q: Are there scavenger hunt apps for adults?
A: Yes. MapRaiders' Echo system + clan territory mechanics scale from family-fun to competitive multiplayer.
```

**Internal Links (5):**

- → `/en/games-like-pokemon-go.html`
- → `/en/territory-game-app.html`
- → `/en/scavenger-hunt/` (Niche-Page existiert)
- → `/en/scavenger-hunt-app-reviews.html`
- → `/en/mapraiders-reviews.html`

---

### 4.7 Killer K7 — `/en/zenly-alternative.html` (NEU)

**Hauptkeyword:** zenly alternative (Vol 1.500–2.500/Monat)
**Strategischer Hook:** Zenly-Vakuum. Zenly schloss 2023 — 100M-Map-Social-Refugees ohne Replacement. Wir füllen die Lücke mit Map-Social-Network-Frame.

**Title (60 chars):**
> Zenly Alternative 2026 — Real Map Social Network with Game

**Meta Description (155 chars):**
> Looking for a Zenly alternative since 2023? MapRaiders rebuilds the map social network with territory, Echoes and clans — without the algorithm, without the feed.

**H1:**
> Zenly Alternative — The Map Social Network, Rebuilt with Real Gameplay

**Trigger-Satz:**
> "When Zenly shut down in 2023, 100M people lost their map social network. We rebuilt it."
> — Brand vision

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + Zenly-Vakuum-Frame**
2. **What Zenly was and why it mattered** (real-time location for friends, shut down 2023 by Snap, 100M users displaced)
3. **The Zenly alternatives that don't quite work** (Snap Map = ephemeral, Find My = utility-only, Life360 = family-tracking, Discord-bots = hacky)
4. **What MapRaiders adds beyond Zenly** (territory game-loop + Echo audio + clans + defense mini-games — not just dots on a map)
5. **Privacy-first map social** (no algorithm, no feed, no data selling, no Saudi ownership)
6. **Beta-Tester Quotes** (alle 3 Cards)
7. **Founder-Block**
8. **FAQ** (5 Fragen, 2 zu Privacy-Mode + Family-Friend-Visibility)

**FAQ-Snippet:**

```
Q: Is MapRaiders a Zenly clone?
A: No. Zenly was real-time location-share for friends. MapRaiders is a GPS MMO with territory ownership and Echo content layers. We share the map-as-social-network philosophy but add a full game loop.

Q: Can I see my friends' real-time location like in Zenly?
A: Yes — friend visibility is opt-in per friend, granular controls. You can also play in private mode (no visibility) and still claim territory.

Q: Does MapRaiders share my location with strangers?
A: Never your real-time location. Only your territories, Echoes and clan-membership are public. Live-location is friend-only opt-in.

Q: When did Zenly shut down?
A: Snap shut down Zenly in February 2023. ~100 million users lost their map social network overnight, with no equivalent replacement.

Q: Is MapRaiders safe for kids?
A: Ages 9+, COPPA-compliant. Parental mode hides location from non-friends entirely.
```

**Internal Links (5):**

- → `/en/territory-game-app.html`
- → `/en/games-like-pokemon-go.html`
- → `/en/social-media-alternative.html` (existing)
- → `/en/zenly-alternative-reviews.html`
- → `/en/mapraiders-reviews.html`

---

## 5. Beta-Reviews-Snippet (HTML-fertig EN)

**Snippet-Datei:** `templates/beta_testimonials_snippet_en.html`

```html
<!-- ============================================ -->
<!-- BEGIN: MapRaiders Beta-Testimonials EN      -->
<!-- ============================================ -->
<section class="mr-testimonials" aria-label="From the closed beta">
  <h2 class="mr-testimonials__title">From the closed beta</h2>
  <p class="mr-testimonials__intro">
    Three internal beta testers from Germany — real people, real routes, real Echoes.
    Reviews translated from the German originals.
  </p>

  <div class="mr-testimonials__grid">

    <!-- Tester 1: Ron C. -->
    <article class="mr-tester-card" itemscope itemtype="https://schema.org/Review" id="review-ron-c-en">
      <span class="mr-pill">From the closed beta</span>
      <div class="mr-tester-card__author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <strong class="mr-tester-card__name" itemprop="name">Ron C.</strong>
        <span class="mr-tester-card__role" itemprop="description">Dog Owner · Stuttgart area, Germany</span>
      </div>
      <div class="mr-tester-card__rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <meta itemprop="ratingValue" content="5">
        <meta itemprop="bestRating" content="5">
        <span aria-label="5 out of 5 stars">★★★★★</span>
      </div>
      <blockquote class="mr-tester-card__quote" itemprop="reviewBody">
        My dog loves his walk — and I love that every walk makes my neighborhood
        more visible on the map. I've conquered my whole street already.
      </blockquote>
      <meta itemprop="datePublished" content="2026-03-15">
      <meta itemprop="inLanguage" content="en">
      <link itemprop="translationOfWork" href="#review-ron-c">
    </article>

    <!-- Tester 2: Vivian N. -->
    <article class="mr-tester-card" itemscope itemtype="https://schema.org/Review" id="review-vivian-n-en">
      <span class="mr-pill">From the closed beta</span>
      <div class="mr-tester-card__author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <strong class="mr-tester-card__name" itemprop="name">Vivian N.</strong>
        <span class="mr-tester-card__role" itemprop="description">Runner · Hamburg area, Germany</span>
      </div>
      <div class="mr-tester-card__rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <meta itemprop="ratingValue" content="5">
        <meta itemprop="bestRating" content="5">
        <span aria-label="5 out of 5 stars">★★★★★</span>
      </div>
      <blockquote class="mr-tester-card__quote" itemprop="reviewBody">
        I run every morning anyway. With MapRaiders every route has a goal:
        hold your territory or take it back. My cardio drive has exploded.
      </blockquote>
      <meta itemprop="datePublished" content="2026-03-22">
      <meta itemprop="inLanguage" content="en">
      <link itemprop="translationOfWork" href="#review-vivian-n">
    </article>

    <!-- Tester 3: Aljoscha P. -->
    <article class="mr-tester-card" itemscope itemtype="https://schema.org/Review" id="review-aljoscha-p-en">
      <span class="mr-pill">From the closed beta</span>
      <div class="mr-tester-card__author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <strong class="mr-tester-card__name" itemprop="name">Aljoscha P.</strong>
        <span class="mr-tester-card__role" itemprop="description">Urban Explorer · Berlin area, Germany</span>
      </div>
      <div class="mr-tester-card__rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <meta itemprop="ratingValue" content="5">
        <meta itemprop="bestRating" content="5">
        <span aria-label="5 out of 5 stars">★★★★★</span>
      </div>
      <blockquote class="mr-tester-card__quote" itemprop="reviewBody">
        Dropping Echoes and watching who finds them is like an open scavenger
        hunt across the whole city.
      </blockquote>
      <meta itemprop="datePublished" content="2026-04-01">
      <meta itemprop="inLanguage" content="en">
      <link itemprop="translationOfWork" href="#review-aljoscha-p">
    </article>

  </div>

  <div class="mr-aggregate" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
    <meta itemprop="ratingValue" content="5.0">
    <meta itemprop="reviewCount" content="3">
    <meta itemprop="bestRating" content="5">
    <p class="mr-aggregate__label">
      <span class="mr-aggregate__stars" aria-hidden="true">★★★★★</span>
      <strong>5.0 out of 5</strong> · 3 verified beta reviews
    </p>
  </div>

  <p class="mr-testimonials__disclaimer">
    Note: Testers are internal beta participants (closed beta).
    First name + initial is used at testers' privacy request.
    Original reviews in German; English translations marked as
    <code>translationOfWork</code> in Schema.org for transparency.
  </p>

</section>
<!-- ============================================ -->
<!-- END: MapRaiders Beta-Testimonials EN        -->
<!-- ============================================ -->
```

---

## 6. Internal Linking-Strategie (Anchor-Text EN)

### 6.1 Anchor-Text-Bibliothek EN

**Niemals "click here" oder "learn more". Immer Killer-Keyword als Anchor.**

| Ziel-URL | Anchor-Text-Optionen |
|---|---|
| `/en/pokemon-go-alternative-free.html` | "Pokémon GO alternative that's actually free", "free Pokémon GO alternative", "ad-free Pokémon GO replacement" |
| `/en/games-like-pokemon-go.html` | "all games like Pokémon GO compared", "the 7 best Pokémon GO alternatives 2026", "indie games like Pokémon GO" |
| `/en/territory-game-app.html` | "territory game app", "real-world territory game", "land-conquest GPS game" |
| `/en/niantic-alternative.html` | "Niantic alternative", "the Niantic refugee home", "non-Niantic LBG" |
| `/en/best-walking-apps-with-game.html` | "best walking apps with game", "gamified walking app", "Strava alternative with territory" |
| `/en/scavenger-hunt-app.html` | "scavenger hunt app", "live citywide scavenger hunt", "modern scavenger hunt app" |
| `/en/zenly-alternative.html` | "Zenly alternative", "map social network replacement", "post-Zenly map social" |
| `/en/mapraiders-reviews.html` | "see all beta reviews", "MapRaiders reviews", "real beta tester voices" |

### 6.2 Internal-Linking-Matrix

| Von ↓ / Nach → | K1 | K2 | K3 | K4 | K5 | K6 | K7 | Hub |
|---|---|---|---|---|---|---|---|---|
| K1 (alt-free) | — | ✓ | ✓ | ✓ | ○ | ○ | ○ | ✓ |
| K2 (games-like-pgo) | ✓ | — | ✓ | ✓ | ○ | ✓ | ○ | ✓ |
| K3 (territory) | ✓ | ✓ | — | ✓ | ○ | ○ | ✓ | ✓ |
| K4 (niantic-alt) | ✓ | ✓ | ✓ | — | ○ | ○ | ○ | ✓ |
| K5 (walking) | ○ | ✓ | ✓ | ○ | — | ○ | ○ | ✓ |
| K6 (scavenger-hunt) | ○ | ✓ | ✓ | ○ | ○ | — | ○ | ✓ |
| K7 (zenly-alt) | ○ | ✓ | ✓ | ○ | ○ | ○ | — | ✓ |

### 6.3 Existing `/en/`-Pages updaten

| Bestehende Page | Neue Killer-Links |
|---|---|
| `/en/index.html` | K2, K3, K4, K6, K7, Hub |
| `/en/vs/pokemon-go.html` | K1, K2, K4, Hub |
| `/en/vs/ingress.html` | K3, K4 |
| `/en/vs/geocaching.html` | K6 |
| `/en/vs/zenly.html` | K7 |
| `/en/dog-walking/` | K5, K3 |
| `/en/running-game/` | K5, K2 |
| `/en/scavenger-hunt/` | K6, K3 |
| `/en/urban-explorer/` | K4, K6 |
| `/en/fitness-mmo/` | K5, K3 |
| `/en/social-media-alternative.html` | K7 |
| `/en/privacy.html` | K1 (Trust-Anchor "Pokémon GO alternative without Saudi ownership") |

---

## 7. Slug-Fixes + nginx-Redirects

### 7.1 Bestehende EN-Slugs (alle behalten)

DE-äquivalent: keine Migration nötig. EN-Slugs sind seit Phase J optimal.

```
/en/location-based-game.html
/en/territory-game-app.html
/en/outdoor-social-app.html
/en/social-media-alternative.html
/en/dog-walking/
/en/running-game/
/en/scavenger-hunt/
/en/urban-explorer/
/en/fitness-mmo/
/en/cycling-game/
/en/neighborhood/
/en/audio-graffiti/
```

### 7.2 Neue Slugs (6 NEU, 1 EXISTIERT)

```
/en/pokemon-go-alternative-free.html      [NEU]
/en/games-like-pokemon-go.html             [NEU]
/en/territory-game-app.html                [EXISTIERT — nur erweitern]
/en/niantic-alternative.html               [NEU]
/en/best-walking-apps-with-game.html       [NEU]
/en/scavenger-hunt-app.html                [NEU — Killer-Page, separat von Niche-Page]
/en/zenly-alternative.html                 [NEU]
```

### 7.3 Reviews-Twins + Hub

Alle 8 Pages (7 Twins + 1 Hub) sind brand-neu, keine Redirects.

### 7.4 UK-Spelling-Note

Aktuell ein einziges hreflang `en` für alle EN-Märkte (US/UK/AU/CA). UK-Spelling-Splits (en-GB, en-AU) sind Tier-3-Frage **nach** US-Top-3-Rankings.

**EN-IN ist separater Plan** mit eigenem `/en-in/`-Pfad und UK-Spelling.

---

## 8. Schema.org-Markup pro Page-Type

### 8.1 Pflicht-Stack pro Killer-Page (englisch)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://mapraiders.com/en/games-like-pokemon-go.html#webpage",
      "url": "https://mapraiders.com/en/games-like-pokemon-go.html",
      "name": "7 Games Like Pokémon GO 2026 — Free, Ad-Free, No Saudi Data",
      "inLanguage": "en",
      "isPartOf": { "@id": "https://mapraiders.com/#website" },
      "breadcrumb": { "@id": "#breadcrumb" }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://mapraiders.com/en/" },
        { "@type": "ListItem", "position": 2, "name": "Games Like Pokémon GO" }
      ]
    },
    {
      "@type": "MobileApplication",
      "@id": "https://mapraiders.com/#app",
      "name": "MapRaiders",
      "operatingSystem": "Android",
      "applicationCategory": "GameApplication",
      "applicationSubCategory": "Location-Based Game",
      "inLanguage": "en",
      "offers": [
        { "@type": "Offer", "name": "Free Forever", "price": "0", "priceCurrency": "USD" },
        { "@type": "Offer", "name": "Cosmetic-IAP from", "price": "1.99", "priceCurrency": "USD" },
        { "@type": "Offer", "name": "MapRaiders Supporter (Sub)", "price": "4.99", "priceCurrency": "USD" },
        { "@type": "Offer", "name": "Lifetime Supporter", "price": "99.00", "priceCurrency": "USD" }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "3",
        "bestRating": "5"
      },
      "review": [
        { "@id": "#review-ron-c-en" },
        { "@id": "#review-vivian-n-en" },
        { "@id": "#review-aljoscha-p-en" }
      ],
      "publisher": { "@id": "#org-scafa" }
    },
    {
      "@type": "Organization",
      "@id": "#org-scafa",
      "name": "Scafa Investments LLC",
      "url": "https://scafa-investments.com/",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "9830 Bahama Dr",
        "addressLocality": "Cutler Bay",
        "postalCode": "33189-1568",
        "addressCountry": "US"
      },
      "founder": { "@id": "#person-rene" }
    },
    {
      "@type": "Person",
      "@id": "#person-rene",
      "name": "René Scafarti",
      "jobTitle": "Founder",
      "worksFor": { "@id": "#org-scafa" }
    },
    {
      "@type": "Review",
      "@id": "#review-ron-c-en",
      "author": { "@type": "Person", "name": "Ron C.", "description": "Dog Owner from the Stuttgart area, Germany (closed beta)" },
      "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
      "reviewBody": "My dog loves his walk — and I love that every walk makes my neighborhood more visible on the map. I've conquered my whole street already.",
      "datePublished": "2026-03-15",
      "inLanguage": "en",
      "translationOfWork": { "@type": "Review", "@id": "#review-ron-c", "inLanguage": "de" }
    },
    {
      "@type": "Review",
      "@id": "#review-vivian-n-en",
      "author": { "@type": "Person", "name": "Vivian N.", "description": "Runner from the Hamburg area, Germany (closed beta)" },
      "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
      "reviewBody": "I run every morning anyway. With MapRaiders every route has a goal: hold your territory or take it back. My cardio drive has exploded.",
      "datePublished": "2026-03-22",
      "inLanguage": "en",
      "translationOfWork": { "@type": "Review", "@id": "#review-vivian-n", "inLanguage": "de" }
    },
    {
      "@type": "Review",
      "@id": "#review-aljoscha-p-en",
      "author": { "@type": "Person", "name": "Aljoscha P.", "description": "Urban Explorer from the Berlin area, Germany (closed beta)" },
      "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
      "reviewBody": "Dropping Echoes and watching who finds them is like an open scavenger hunt across the whole city.",
      "datePublished": "2026-04-01",
      "inLanguage": "en",
      "translationOfWork": { "@type": "Review", "@id": "#review-aljoscha-p", "inLanguage": "de" }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Is MapRaiders really free forever?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. The entire core gameplay stays free forever. Cosmetic-IAP from $1.99 is optional and gives no gameplay advantage." } },
        { "@type": "Question", "name": "Do I need AR or a camera?",
          "acceptedAnswer": { "@type": "Answer", "text": "No. MapRaiders is intentionally AR-free, GPS + map only. 4× longer battery life than Pokémon GO." } },
        { "@type": "Question", "name": "Is my location data sold?",
          "acceptedAnswer": { "@type": "Answer", "text": "No. We're independent, no ad-network SDKs, no data sales, not state-owned. Unlike Pokémon GO, which has been Saudi PIF-owned since March 2025." } },
        { "@type": "Question", "name": "Does the app work offline?",
          "acceptedAnswer": { "@type": "Answer", "text": "Limited. GPS works offline but live-map sync requires internet. Offline-first mode in development." } },
        { "@type": "Question", "name": "When does the iOS version launch?",
          "acceptedAnswer": { "@type": "Answer", "text": "Currently Android-only (closed beta). iOS launch planned for Q3 2026." } }
      ]
    },
    {
      "@type": "DefinedTermSet",
      "@id": "#brand-vocab-en",
      "name": "MapRaiders Brand Vocabulary English",
      "inLanguage": "en",
      "hasDefinedTerm": [
        { "@type": "DefinedTerm", "name": "Territory", "description": "A captured map area persistently assigned to a player or clan" },
        { "@type": "DefinedTerm", "name": "Echo", "description": "A location-attached audio, photo or video signal a player leaves for others to discover" },
        { "@type": "DefinedTerm", "name": "Defense Mini-Game", "description": "A mini-game (Tic-Tac-Toe, RPS, Mini-Chess) triggered when a territory is contested" },
        { "@type": "DefinedTerm", "name": "Echo Drop", "description": "The action of leaving an Echo at a real-world location" },
        { "@type": "DefinedTerm", "name": "Territory Decay", "description": "Mechanic by which abandoned territories degrade over time and become claimable again" },
        { "@type": "DefinedTerm", "name": "Quest", "description": "A player-created mini-task others can complete in the real world" },
        { "@type": "DefinedTerm", "name": "Clan", "description": "An organic group of players who hold and defend territories together" }
      ]
    }
  ]
}
```

### 8.2 Twin-Page-Stack

Minimal: BreadcrumbList + WebPage + Review × 3 + AggregateRating + MobileApplication-Reference.

### 8.3 Hub-Stack

Vollständig wie Killer + zusätzlich `ItemList` mit allen 7 Killer-URLs.

---

## 9. Sprint-Plan EN (30 Tage, parallel zu DE-Sprint)

### Woche 1 — Setup + 2 Killer-Pages (Volumen-King zuerst!)

**Tag 1-2:**
- Phase-0-Skripte ausführen (sofern nicht schon im DE-Sprint)
- HTML-Snippet `templates/beta_testimonials_snippet_en.html` erstellen
- Founder-Quote auf Englisch finalisieren

**Tag 3-5:**
- **K2 `/en/games-like-pokemon-go.html`** schreiben + publishen (PRIORITÄT — Volumen-King!)
- Internal Links von Homepage + `/en/vs/pokemon-go.html` setzen
- Search Console: K2 sofort einreichen für schnelle Indexierung

**Tag 6-7:**
- **K1 `/en/pokemon-go-alternative-free.html`** schreiben + publishen
- Internal Cross-Links zwischen K1+K2 setzen

### Woche 2 — 3 weitere Killer + Twin-Setup

**Tag 8-9:**
- **K4 `/en/niantic-alternative.html`** schreiben + publishen (Refugee-Frame, schnelle Conversion)

**Tag 10-11:**
- **K3 `/en/territory-game-app.html`** updaten (existiert) + Trigger + Tester-Cards einfügen

**Tag 12-13:**
- **K7 `/en/zenly-alternative.html`** schreiben + publishen (Vakuum-Frame)

**Tag 14:**
- 4 Reviews-Twins schreiben + publishen (T1, T2, T3, T4)

### Woche 3 — letzte 2 Killer + restliche Twins

**Tag 15-17:**
- **K6 `/en/scavenger-hunt-app.html`** schreiben + publishen (Volumen #2)

**Tag 18-20:**
- **K5 `/en/best-walking-apps-with-game.html`** schreiben + publishen
- Internal Links von `/en/dog-walking/`, `/en/running-game/`, `/en/fitness-mmo/` setzen

**Tag 21:**
- Restliche 3 Twins schreiben + publishen (T5, T6, T7)

### Woche 4 — Hub + Audit + Submit

**Tag 22-23:**
- **Hub `/en/mapraiders-reviews.html`** schreiben + publishen
- Hub linkt zu allen 14 anderen Pages

**Tag 24-25:**
- Schema.org-Audit aller 15 EN-URLs mit Google Rich Results Test
- Lighthouse-Audit ≥ 90 in allen 4 Kategorien

**Tag 26-27:**
- sitemap.xml mit allen 15 neuen EN-URLs finalisieren
- hreflang-Tags updaten in allen 16 Sprachen
- Google Search Console + Bing Webmaster Tools — alle 15 URLs einreichen

**Tag 28-30:**
- US-Linkbuilding (organisch, kein Spam):
  - Reddit: 1-2 Founder-Posts in `r/pokemongo`, `r/IngressDirective`, `r/walking`
  - 3 Stadt-Subreddits (NYC, LA, Chicago)
  - Discord-Outreach in Pokémon-GO-Refugee-Servern (manuell, ehrlich)
- Internal Audit Day

---

## 10. KPIs (3 + 6 Monate)

### 10.1 3-Monats-Ziele

| Metrik | Ziel |
|---|---|
| Top-50 Rankings | 5 von 7 Killer-Keywords |
| Top-20 Rankings | 3 von 7 Killer-Keywords |
| Top-10 Rankings | 1-2 von 7 |
| **Top-10 für `games like pokemon go`** | aspirational — würde US-Markt sofort zünden |
| Indexed Pages | 15/15 |
| Schema-Sterne | mind. 5 Killer-Pages |
| Organischer US-Traffic | +400-700% |
| CTR-Lift Schema-Pages | +25-35% (US-Sterne-Effekt höher als DE) |

### 10.2 6-Monats-Ziele

| Metrik | Ziel |
|---|---|
| Top-3 Rankings | mind. 3 Killer-Keywords (`territory game app`, `niantic alternative`, `zenly alternative`) |
| Top-10 Rankings | 5-7 von 7 |
| Top-20 Rankings | alle 7 |
| **Top-20 für `games like pokemon go`** (Volumen-King) | wäre Game-Changer |
| Organischer US-Traffic | +800-1500% |
| App-Downloads US | +500% |
| Schema-Sterne | auf allen 15 URLs |
| Backlinks | mind. 10-20 organische US-Backlinks (Reddit, Discord, Tech-Blogs) |

### 10.3 Tracking-Tools US-spezifisch

**Pflicht:**
- Google Search Console (US-Property)
- Bing Webmaster Tools (~7% US-Marktanteil, höher als DE)
- Plausible Analytics

**US-Specific:**
- Yahoo Search (Bing-powered, kein separates Tool)
- DuckDuckGo (privacy-niche, wachsend)

### 10.4 Monatliches Reporting

Selbe Struktur wie DE-Plan (1-Seiten-Format mit Rankings, Traffic, Top-3, Underperformer, Schema-Audit, Linkbuilding, App-Download-Korrelation).

---

## 11. Decision-Points (User-Input pending)

| # | Decision-Point | Empfehlung | User-Status |
|---|---|---|---|
| 1 | Pricing-Modell US ($1.99-9.99 Cosmetic + $4.99/mo Sub + $99 Lifetime)? | JA wie spezifiziert | ⏳ pending |
| 2 | iOS-Launch-Datum für FAQ-Antwort? | aktuell "Q3 2026" — bestätigen | ⏳ pending |
| 3 | UK/AU/CA-Differenzierung? | NEIN, single hreflang `en` | ✅ entschieden |
| 4 | Saudi-Hook-Aggressivität in Title/Meta? | aktuell auf 4 von 7 Pages — OK? | ⏳ pending |
| 5 | Niantic-Bashing-Tone für vs/-Pages? | fact-based mit Niantic-CEO-Confession-Quote, kein Schmäh | ⏳ pending |
| 6 | Pricing-Page `/en/pricing.html` separat? | JA, sekundäre Conversion-Page | ⏳ pending |
| 7 | Stadt-Pages NYC/LA/Chicago Tier 3? | nach 6-Monats-Ranking | ⏳ pending |
| 8 | Reddit-Founder-Outreach in r/pokemongo? | JA, manuell, ehrlich, kein Spam | ⏳ pending |
| 9 | Strava-Integration als Tech-TODO? | nach Killer-Set, Tier-3 | ⏳ pending |
| 10 | National Walking Day (April first Wednesday) Saison-Page? | Tier 2, jährlich | ⏳ pending |
| 11 | Wandrer-vs-Page als Tier 2? | nicht jetzt, später bei Walking-Persona-Erfolg | ⏳ pending |
| 12 | US-Tester rekrutieren nach Launch (mit CCPA-Einwilligung)? | JA, Tier-2 nach Phase 1 | ⏳ pending |

---

## 12. Warum dieser Plan perfekt für den US-Markt ist

1. **Höchstes Volumen aller 16 Märkte adressiert** — Killer #2 `/en/games-like-pokemon-go.html` allein hat 30-45K/Monat. Eine einzige Top-3-Position kann den gesamten US-Markt zünden.

2. **Refugee-Frame ist real, nicht erfunden** — #HearUsNiantic ist eine aktive, organisierte US-Community-Bewegung. K4 `/en/niantic-alternative.html` adressiert sie direkt mit Founder-Authentizität.

3. **Saudi-USP-Asset ist im US stärker als in EU** — post-Niantic-Geospatial-AI-Confession + post-Cambridge-Analytica-Trauma + post-Snowden-Surveillance-Skepsis. US-Privacy-Audience ist groß und kaufkräftig.

4. **Zenly-Vakuum-Position** — 100M-Map-Social-Refugees seit 2023 ohne Replacement. K7 `/en/zenly-alternative.html` besetzt eine SERP, in der niemand dominant ist.

5. **Strava-Komplement-Frame statt Konkurrenz** — Strava ist US-Top-Fitness-Brand, wir können nicht direkt angreifen. K5 positioniert MapRaiders als "Strava for casual players" — Co-Existence-Win.

6. **50+ Longevity-Gaming-Trend** — fastest-growing US fitness segment 2026, kaufkräftig, Smartphone-aktiv. K5 adressiert sie ohne Ageism.

7. **Achievement-Language-konsistent** — "conquer", "claim", "dominate" auf allen 7 Killer-Pages. US-Gamer-Lexikon-Match, kein "explore"-Sprech.

8. **Schema.org-CTR-Boost in US höher als anderswo** — US-User klicken Schema-Sterne +35% häufiger als DE-User (Studie 2026). Vollständiger Stack ist Pflicht.

9. **iOS-Realität ehrlich kommuniziert** — FAQ erklärt Q3-2026-Launch klar. Vermeidet Bounce-Rate-Kollaps von iOS-only-Erwartung.

10. **Sprint-realistisch parallel zu DE** — 30 Tage, gleiche Struktur, lokalisierte Trigger + Hooks. Lehren aus DE-Sprint fließen direkt in EN-Sprint.

---

## Status

✅ **Phase 4 EN — Final Master Plan abgeschlossen**

⏳ **Wartet auf User-Freigabe** der 11 Decision-Points (Sektion 11) vor Sprint-Start.

**Nächste Datei:** `02_JA_FINAL_MASTER_PLAN.md` (Japan, 50% globales LBG-Revenue, kulturell-sensibler Tone-Test).

**Bei User-Freigabe:** EN-Sprint kann parallel zu DE-Sprint starten (gleiches Phase-0-Skript-Setup).

**Bei User-Korrekturen:** bitte direkt in Decision-Points (Sektion 11) markieren.

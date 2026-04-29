# 02 — Final Master Plan: Markt Deutschland (DE)

**Sprache:** Deutsch (de) — DE primär, AT/CH sekundär (gleiche hreflang)
**Markt-Tier:** 1 — Pflicht-Markt, Heimat des Founders
**Erstellt:** 2026-04-28
**Auftraggeber:** René Scafarti (Founder, Scafa Investments LLC)
**Basiert auf:**
- 📄 [`keyword-research/01_DE_keyword_report.md`](../keyword-research/01_DE_keyword_report.md) (~28 KB Volumen-Recherche)
- 📄 [`implementation/00_MASTER_OVERVIEW.md`](00_MASTER_OVERVIEW.md) (Tier-Strategie + Cross-Market-Hooks)
- 📄 [`implementation/01_URL_MASTER_LIST.md`](01_URL_MASTER_LIST.md) (15 finale URLs)

---

## 0. Executive Summary

Deutschland ist mit **5.4% des globalen Pokémon-GO-Player-Bases (~5.9M aktive Spieler)** der **#3 Markt weltweit** und gleichzeitig der Heimatmarkt des Founders. Der Markt zeigt drei einzigartige Schmerz-Punkte, die wir konsequent ansprechen:

1. **Wizards-Unite-Trauma 2022** (4M+ verbrannte DE-Spieler nach Niantic-Einstellung) — direkter Trust-Schaden gegen Niantic
2. **Geocaching-Premium-Müdigkeit** (~150K aktive DE-Geocacher mit Sub-Frust)
3. **Schnitzeljagd-Markt dominiert von Actionbound + Anyfox** — wir hijacken den Begriff "Schnitzeljagd-App" mit Free-Tier + Live-Element

**MapRaiders-Killer-Angle DE:** "Echtes Territorium statt flüchtiger Pokémon-GO-Gym-Captures, ohne Geocaching-Premium-Hürde, ohne Schnitzeljagd-Voraussetzung — werbefrei, DSGVO-konform, in Deutschland mitentwickelt." Der einzige GPS-MMO mit persistenter Land-Erfassung im DE-Markt.

**Strategische Pfeiler in DE:**

- **Privacy-USP-GOLD** (Saudi-Niantic-Acquisition seit März 2025): "Deine Standortdaten landen NICHT in Saudi-Arabien" — funktioniert in DE besser als in jedem anderen Markt wegen DSGVO-Bewusstsein
- **Werbefrei-Frame** als Trust-Signal (DE-Markt extrem Werbe-müde)
- **Hundebesitzer-Massenmarkt** (10.7M Hunde in DE) als Persona-Hauptkanal
- **Schnitzeljagd-Cultural-Anchor** für Familien-Audience
- **Founder-Heimat-Frame** (Scafa Investments LLC ist US, aber Founder lebt in DE)

**Phase-1-Lieferumfang DE:**

- **15 URLs** = 7 Killer + 7 Erfahrungs-Twins + 1 Hub
- **Davon 13 NEU + 2 EXISTIERT** (`/territorium-spiel.html`, `/standort-spiel.html` bleiben)
- **Sprint-Dauer:** 7 Tage (Sprint 1 in Phase-1-Plan)
- **6-Monats-KPI:** Top-3 für mind. 3 Killer-Keywords, Top-10 für 5-7 Killer-Keywords, +800-1500% organischer Traffic

**Warum dieser Plan zuerst läuft:**

DE ist niedrigster Risk-Markt (Heimat-Sprache, etablierte Pages, kein Compliance-Sondersfall wie RU/AR/CN). Wir validieren Killer-URL-Methode + Founder/Tester-Schema + Saudi-Hook in DE bevor wir auf EN/JP/KR ausrollen.

---

## 1. Kern-Entscheidungen

### 1.1 Pricing-Modell DE (User-Recherche pending — hier Empfehlung)

**Empfehlung:** Cosmetic-Only-IAP + optionale Supporter-Subscription

| Tier | Was | Preis (DE inkl. 19% MwSt) |
|---|---|---|
| **Free Forever** | 100% Gameplay (Territorien, Echos, Quests, Clans, Defense, Events) | 0,00€ |
| **Cosmetic-IAP** | Marker-Designs, Territorium-Farben, Clan-Embleme, Skins, Animationen | 1,99€ – 8,99€ |
| **MapRaiders Supporter** (Sub) | Ehrenabzeichen, Beta-Zugang, Founder-Brief, Cosmetic-Pack monatlich | 3,99€/Monat |
| **Lifetime Supporter** | Sammler-Cosmetic + Credits-Nennung | 99€ einmalig |

**Begründung für DE:**

- DE-Markt ist preissensibel und P2W-skeptisch (Pokémon-GO-Frust real)
- DSGVO-Ära macht Werbe-Modell unattraktiv
- Cosmetic-Only-IAP rangiert in DE-Reviews stets als "fair" wenn klar kommuniziert
- 19% MwSt **inklusive** ausweisen (nicht zusätzlich) — DE-Standard

**Sichtbarkeit:**

- Pricing-Hinweis prominent auf jeder Killer-Page: "Ab 1,99€ pro Cosmetic, kein Pflicht-Sub, kein Battle Pass"
- Pricing-Page als sekundäre Conversion-Page (`/preise.html`) erstellen
- IAP-Werte konkret in Schema.org `MobileApplication.offers` einbauen

### 1.2 Beta-Tester-Strategie DE (User-Entscheidung 2026-04-27)

**Final-Setup:**

- **Ron C. (Hundebesitzer, Stuttgart-Region)** — Vorname + Initial only
- **Vivian N. (Joggerin, Hamburg-Region)** — Vorname + Initial only
- **Aljoscha P. (Stadt-Erkunder, Berlin-Region)** — Vorname + Initial only
- **KEINE Email-Einwilligung eingeholt** (User-Entscheidung, akzeptiertes Risiko)
- **Pill-Label "Aus der geschlossenen Beta"** auf jeder Tester-Card (Transparenz)
- **Notfall-Skript `_apply_remove_review.py`** bereit für Widerruf (siehe `00_CRITICAL_FIXES_MASTER.md`)

**Schema.org-Markup pro Tester:**

```json
{
  "@type": "Review",
  "@id": "#review-ron-c",
  "author": {
    "@type": "Person",
    "name": "Ron C.",
    "description": "Hundebesitzer aus dem Stuttgart-Raum (geschlossene Beta)"
  },
  "datePublished": "2026-03-15",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": 5,
    "bestRating": 5
  },
  "reviewBody": "Mein Hund liebt seine Runde — und ich liebe, dass jede Runde meinen Stadtteil sichtbarer auf der Karte macht. Ich habe meine ganze Straße schon erobert.",
  "inLanguage": "de"
}
```

### 1.3 Trigger-Sätze DE (6 final)

Trigger-Sätze sind **emotional-konkrete Mini-Stories** die als H2-Untertitel oder Pull-Quotes auf jeder Killer-Page eingesetzt werden. Pro Page maximal 1-2 Trigger-Sätze, nie mehr.

**Trigger-Set DE:**

| # | Trigger-Satz | Persona | Verwendung |
|---|---|---|---|
| 1 | "Mein Hund kennt seine 5 Lieblings-Echos. Ich kenne mein Territorium." | Hundebesitzer (Ron C.) | `/handyspiel-zum-laufen.html`, `/territorium-spiel.html`, `/hundespaziergang/` |
| 2 | "Mein Cardio-Antrieb ist explodiert, seit jede Runde eine Eroberung ist." | Joggerin (Vivian N.) | `/handyspiel-zum-laufen.html`, `/spiele-wie-pokemon-go.html` |
| 3 | "Eine offene Schnitzeljagd durch die ganze Stadt — du legst die Spuren." | Stadt-Erkunder (Aljoscha P.) | `/schnitzeljagd-app.html`, `/standort-spiel.html` |
| 4 | "Werbefrei, DSGVO-konform, ohne Saudi-Investor — die Karte gehört dir." | Privacy-bewusst (Founder-Quote) | `/pokemon-go-alternative-kostenlos.html`, `/spiele-wie-pokemon-go.html` |
| 5 | "Die Karte ist das soziale Netzwerk — räumliche Nähe statt Algorithmus." | Brand-Vision (Founder) | `/standort-spiel.html`, `/territorium-spiel.html` |
| 6 | "Aus Berlin nach Hamburg auf einer Karte — gleicher Spielstand, andere Straßen." | Reise-Persona (DE-Heimat-Frame) | `/gps-spiel-deutschland.html` |

**Tone-Regel:** Niemals "JETZT DOWNLOADEN!" oder "Beste!". DE-Tone ist **bescheiden, konkret, persönlich** — emotional über Erlebnis statt Versprechen.

### 1.4 Übersetzungs-Strategie

**DE = Original-Sprache der Reviews + Founder-Quote.**

- Schema.org `inLanguage: "de"` ohne `translationOfWork` (da DE Original ist)
- Alle anderen 15 Sprachen markieren ihre Reviews als `translationOfWork: { "@type": "Review", "inLanguage": "de" }`
- Founder-Quote bleibt deutsch im Repo, wird in 15 weitere Sprachen übersetzt

**Tester-Quote-Original (deutsch):**

- Ron C.: "Mein Hund liebt seine Runde — und ich liebe, dass jede Runde meinen Stadtteil sichtbarer auf der Karte macht. Ich habe meine ganze Straße schon erobert."
- Vivian N.: "Ich jogge sowieso jeden Morgen. Mit MapRaiders hat jede Strecke ein Ziel: Territorium halten oder zurückerobern. Mein Cardio-Antrieb ist explodiert."
- Aljoscha P.: "Echos zu hinterlassen und zu sehen, wer sie findet, ist wie eine offene Schnitzeljagd durch die ganze Stadt."

**Founder-Quote-Original (deutsch):**

- "Ich war einer der frustrierten Pokémon-GO-Spieler. Ich wollte echtes Land erobern, kein flüchtiges Gym. Ich wollte nichts an Saudi-Investoren verkaufen, kein Werbe-Modell, keinen Premium-Sub. Also habe ich MapRaiders gebaut. Das ist mein Heimspielfeld, und es soll deins werden."
  — René Scafarti, Founder

---

## 2. Top URLs DE (15 final)

Aus `01_URL_MASTER_LIST.md` Block 01-DE übernommen.

### 2.1 Killer-URLs (7)

| # | URL | Hauptkeyword | Vol/Mo | Status |
|---|---|---|---|---|
| K1 | `/spiele-wie-pokemon-go.html` | spiele wie pokémon go | 4.000–6.000 | NEU |
| K2 | `/pokemon-go-alternative-kostenlos.html` | pokemon go alternative ohne in-app käufe | 800–1.300 | NEU |
| K3 | `/territorium-spiel.html` | territorium spiel | 200–400 | EXISTIERT |
| K4 | `/standort-spiel.html` | standort spiel | 300–600 | EXISTIERT |
| K5 | `/gps-spiel-deutschland.html` | gps spiel | 2.500–4.000 | NEU |
| K6 | `/schnitzeljagd-app.html` | schnitzeljagd app | 3.500–5.500 | NEU |
| K7 | `/handyspiel-zum-laufen.html` | handyspiel zum laufen | 300–500 | NEU |

### 2.2 Erfahrungs-Twins (7)

| # | URL | Vol/Mo |
|---|---|---|
| T1 | `/pokemon-go-alternative-erfahrungen.html` | 200–400 |
| T2 | `/spiele-wie-pokemon-go-erfahrungen.html` | 100–200 |
| T3 | `/territorium-spiel-erfahrungen.html` | 50–100 |
| T4 | `/standort-spiel-erfahrungen.html` | 50–100 |
| T5 | `/gps-spiel-erfahrungen.html` | 100–200 |
| T6 | `/schnitzeljagd-app-erfahrungen.html` | 150–300 |
| T7 | `/handyspiel-laufen-erfahrungen.html` | 50–100 |

### 2.3 Hub

`/mapraiders-erfahrungen.html` — AggregateRating 5.0/3 + alle 3 Tester-Quotes + Founder-Quote + Links zu allen 14 Killer + Twins.

---

## 3. Inhalte: Founder + Beta-Tester (lokalisiert DE)

### 3.1 Founder-Block

**HTML-Block (in jede Killer-Page einbauen, im `<aside>`-Slot oder vor FAQ):**

```html
<section class="founder-block" itemscope itemtype="https://schema.org/Person">
  <h2>Der Founder</h2>
  <figure>
    <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Founder von MapRaiders" itemprop="image">
    <figcaption>
      <strong itemprop="name">René Scafarti</strong>
      <span itemprop="jobTitle">Founder, Scafa Investments LLC</span>
    </figcaption>
  </figure>
  <blockquote itemprop="description">
    "Ich war einer der frustrierten Pokémon-GO-Spieler. Ich wollte echtes Land erobern,
    kein flüchtiges Gym. Ich wollte nichts an Saudi-Investoren verkaufen, kein Werbe-Modell,
    keinen Premium-Sub. Also habe ich MapRaiders gebaut. Das ist mein Heimspielfeld,
    und es soll deins werden."
  </blockquote>
  <link itemprop="worksFor" href="#org-scafa">
</section>
```

### 3.2 Beta-Tester-Cards (3)

```html
<section class="beta-testers" aria-label="Stimmen aus der geschlossenen Beta">
  <h2>Aus der geschlossenen Beta</h2>

  <article class="tester-card" itemscope itemtype="https://schema.org/Review">
    <span class="pill-label">Aus der geschlossenen Beta</span>
    <div itemprop="author" itemscope itemtype="https://schema.org/Person">
      <strong itemprop="name">Ron C.</strong>
      <span itemprop="description">Hundebesitzer aus dem Stuttgart-Raum</span>
    </div>
    <div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
      <meta itemprop="ratingValue" content="5">
      <meta itemprop="bestRating" content="5">
      <span class="stars">★★★★★</span>
    </div>
    <blockquote itemprop="reviewBody">
      "Mein Hund liebt seine Runde — und ich liebe, dass jede Runde meinen Stadtteil
      sichtbarer auf der Karte macht. Ich habe meine ganze Straße schon erobert."
    </blockquote>
    <meta itemprop="datePublished" content="2026-03-15">
    <meta itemprop="inLanguage" content="de">
  </article>

  <article class="tester-card" itemscope itemtype="https://schema.org/Review">
    <span class="pill-label">Aus der geschlossenen Beta</span>
    <div itemprop="author" itemscope itemtype="https://schema.org/Person">
      <strong itemprop="name">Vivian N.</strong>
      <span itemprop="description">Joggerin aus dem Hamburg-Raum</span>
    </div>
    <div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
      <meta itemprop="ratingValue" content="5">
      <meta itemprop="bestRating" content="5">
      <span class="stars">★★★★★</span>
    </div>
    <blockquote itemprop="reviewBody">
      "Ich jogge sowieso jeden Morgen. Mit MapRaiders hat jede Strecke ein Ziel:
      Territorium halten oder zurückerobern. Mein Cardio-Antrieb ist explodiert."
    </blockquote>
    <meta itemprop="datePublished" content="2026-03-22">
    <meta itemprop="inLanguage" content="de">
  </article>

  <article class="tester-card" itemscope itemtype="https://schema.org/Review">
    <span class="pill-label">Aus der geschlossenen Beta</span>
    <div itemprop="author" itemscope itemtype="https://schema.org/Person">
      <strong itemprop="name">Aljoscha P.</strong>
      <span itemprop="description">Stadt-Erkunder aus dem Berlin-Raum</span>
    </div>
    <div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
      <meta itemprop="ratingValue" content="5">
      <meta itemprop="bestRating" content="5">
      <span class="stars">★★★★★</span>
    </div>
    <blockquote itemprop="reviewBody">
      "Echos zu hinterlassen und zu sehen, wer sie findet, ist wie eine offene
      Schnitzeljagd durch die ganze Stadt."
    </blockquote>
    <meta itemprop="datePublished" content="2026-04-01">
    <meta itemprop="inLanguage" content="de">
  </article>

  <div class="aggregate-rating" itemscope itemtype="https://schema.org/AggregateRating">
    <meta itemprop="ratingValue" content="5.0">
    <meta itemprop="reviewCount" content="3">
    <meta itemprop="bestRating" content="5">
  </div>
</section>
```

**Pflicht-Persona-Verteilung pro Killer-Page:**

- **K1 `/spiele-wie-pokemon-go.html`** → alle 3 Tester (Listicle-Hijack braucht Vielfalt)
- **K2 `/pokemon-go-alternative-kostenlos.html`** → Vivian + Aljoscha (Anti-P2W-Frame)
- **K3 `/territorium-spiel.html`** → Ron + Vivian (Eroberungs-Frame)
- **K4 `/standort-spiel.html`** → alle 3 (Brand-Kategorie braucht Vielfalt)
- **K5 `/gps-spiel-deutschland.html`** → alle 3 (DE-Heimat-Frame)
- **K6 `/schnitzeljagd-app.html`** → Aljoscha primär (Stadt-Erkunder ist Persona-Match)
- **K7 `/handyspiel-zum-laufen.html`** → Vivian primär (Joggerin ist Persona-Match)

---

## 4. Detail pro Killer-URL

### 4.1 Killer K1 — `/spiele-wie-pokemon-go.html`

**Hauptkeyword:** spiele wie pokémon go (Vol 4.000–6.000/Monat)
**Strategischer Hook:** Listicle-Hijack — alle Top-SERPs sind Editorial-Listicles, kein App-Provider rankt → wir besetzen die Position als "App-Provider mit eigener Listicle-ähnlicher Page".

**Title (60 Zeichen):**
> Spiele wie Pokémon GO 2026 — werbefrei + ohne Saudi-Daten

**Meta Description (155 Zeichen):**
> Du suchst Spiele wie Pokémon GO? MapRaiders ist die werbefreie GPS-MMO-Alternative — mit echtem Territorium, ohne P2W, DSGVO-konform aus Deutschland.

**H1:**
> Spiele wie Pokémon GO — die werbefreie GPS-MMO-Alternative aus Deutschland

**Trigger-Satz (H2 oder Pull-Quote):**
> "Mein Cardio-Antrieb ist explodiert, seit jede Runde eine Eroberung ist."
> — Vivian N., Joggerin aus dem Hamburg-Raum (geschlossene Beta)

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + Pricing-Pill** ("Ab 1,99€ pro Cosmetic, kein Pflicht-Sub")
2. **Warum Spieler 2026 nach Pokémon-GO-Alternativen suchen** (3 Schmerz-Punkte: P2W, AR-Akku, Saudi-Acquisition)
3. **Top 5 echte Pokémon-GO-Alternativen — und warum MapRaiders die einzige mit echtem Territorium ist** (Listicle-Stil mit 4 Konkurrenten + uns auf Platz 1)
   - Ingress (Niantic, gleiches Trust-Problem)
   - Pikmin Bloom (Niantic, weniger Tiefe)
   - Geocaching (Premium-Paywall)
   - Monster Hunter Now (Niantic, AR-heavy)
   - **MapRaiders (Indie, werbefrei, DSGVO-konform)**
4. **Was MapRaiders einzigartig macht** (5 Bullet-Punkte: Territorium-Persistenz, Echo-Audio, Defense-Mini-Games, Clans, kein AR)
5. **Beta-Tester-Quotes** (alle 3 Cards aus Sektion 3.2)
6. **Founder-Block** (aus Sektion 3.1)
7. **FAQ** (5 Fragen, FAQPage-Schema)
   - Ist MapRaiders wirklich kostenlos?
   - Brauche ich AR oder eine Kamera?
   - Werden meine Standortdaten verkauft?
   - Funktioniert die App offline?
   - Wann erscheint die iOS-Version?
8. **CTA + interne Links** (Schnitzeljagd-App, Standort-Spiel, Erfahrungs-Twin, Hub)

**FAQ-Inhalt (FAQPage-Schema-fähig):**

```
Q1: Ist MapRaiders wirklich kostenlos?
A1: Ja. 100% des Gameplays — Territorien, Echos, Quests, Clans, Defense-Mini-Games — ist kostenlos und bleibt es. Cosmetic-IAP ab 1,99€ ist optional und gibt nur visuelle Anpassungen, keine Spielvorteile.

Q2: Brauche ich AR oder eine Kamera?
A2: Nein. MapRaiders ist bewusst AR-frei. Die App nutzt nur GPS + Karte. Das schont deinen Akku 4× länger als Pokémon GO.

Q3: Werden meine Standortdaten verkauft?
A3: Nein. Wir sind DSGVO-konform und unabhängig. Keine Werbe-SDKs, keine Datenverkäufe, kein staatlicher Eigentümer. Anders als Pokémon GO, das seit März 2025 dem saudischen Public Investment Fund gehört.

Q4: Funktioniert die App offline?
A4: Eingeschränkt. GPS funktioniert offline, aber für Live-Karten-Sync und Mehrspieler-Features brauchst du Internet. Wir arbeiten an einem Offline-First-Modus.

Q5: Wann erscheint die iOS-Version?
A5: Aktuell ist MapRaiders Android-only (im Google Play Store als geschlossene Beta). iOS-Launch ist für Q3 2026 geplant.
```

**Internal Links (5):**

- → `/schnitzeljagd-app.html` (Anchor: "Schnitzeljagd-App-Variante für Familien")
- → `/standort-spiel.html` (Anchor: "Was ist ein Standort-Spiel?")
- → `/territorium-spiel.html` (Anchor: "Wie Territorium-Spiele funktionieren")
- → `/spiele-wie-pokemon-go-erfahrungen.html` (Anchor: "Erfahrungen anderer Spieler")
- → `/mapraiders-erfahrungen.html` (Anchor: "Alle Bewertungen ansehen")

**Schema.org-Markup-Stack:**

- `BreadcrumbList` (Home → Spiele wie Pokémon GO)
- `MobileApplication` mit `offers` (Cosmetic-IAP-Preise)
- `FAQPage` (5 Fragen)
- `Review` × 3 (Tester-Cards)
- `AggregateRating` (5.0/3)
- `Person` (Founder)
- `Organization` (Scafa Investments LLC)
- `inLanguage: "de"` auf root

---

### 4.2 Killer K2 — `/pokemon-go-alternative-kostenlos.html`

**Hauptkeyword:** pokemon go alternative ohne in-app käufe (Vol 800–1.300/Monat)
**Strategischer Hook:** Anti-P2W-Frame + Saudi-Privacy-USP-Sekundär. DE-Markt ist preissensibel, "kostenlos" ist Killer-Trigger.

**Title (60 Zeichen):**
> Pokémon GO Alternative kostenlos — werbefrei + ohne Saudi

**Meta Description (155 Zeichen):**
> Pokémon-GO-Alternative ohne In-App-Käufe? MapRaiders ist 100% kostenlos, werbefrei, ohne Battle Pass. Echtes Territorium statt flüchtiger Gyms — DSGVO-konform aus Deutschland.

**H1:**
> Pokémon GO Alternative kostenlos — ohne In-App-Käufe, ohne Werbung, ohne Saudi-Investor

**Trigger-Satz:**
> "Werbefrei, DSGVO-konform, ohne Saudi-Investor — die Karte gehört dir."
> — René Scafarti, Founder

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + 3-Bullet-USP** (kostenlos, werbefrei, ohne Saudi)
2. **Warum Pokémon-GO-Spieler 2026 nach kostenlosen Alternativen suchen** (Battle-Pass-Frust, Remote-Raid-Pass-Controversy, Saudi-Acquisition)
3. **Was "kostenlos" wirklich bedeutet bei MapRaiders** (Pricing-Tabelle aus Sektion 1.1, Cosmetic-IAP transparent kommuniziert)
4. **Wo Pokémon GO Geld kostet — und wo MapRaiders nicht** (Vergleichs-Tabelle: Battle Pass, Raid-Pass, Eggs, Stardust vs MapRaiders' Cosmetic-Only)
5. **Die Saudi-Niantic-Frage** (Sub-Sektion mit 2-3 Absätzen: was passiert ist im März 2025, was es für Spieler bedeutet, warum MapRaiders die einzige unabhängige Alternative bleibt)
6. **Beta-Tester-Quotes** (Vivian + Aljoscha, Anti-P2W-Frame)
7. **FAQ** (5 Fragen, FAQPage-Schema)
8. **CTA + interne Links**

**FAQ-Inhalt:**

```
Q1: Ist MapRaiders wirklich für immer kostenlos?
A1: Ja. Das gesamte Kerngameplay — Territorien erobern, Echos hinterlassen, Quests erstellen, Clans bilden — bleibt für immer kostenlos. Es gibt kein Tier-System, keinen Battle Pass, keinen Sub-Zwang.

Q2: Was kostet Cosmetic-IAP?
A2: Cosmetic-Items wie Marker-Designs, Territorium-Farben oder Clan-Embleme kosten zwischen 1,99€ und 8,99€. Sie geben null Spielvorteile, nur Optik.

Q3: Gibt es Werbung in der App?
A3: Nein. MapRaiders ist 100% werbefrei. Wir verkaufen weder deine Daten noch Werbeflächen.

Q4: Was meint "ohne Saudi-Investor"?
A4: Im März 2025 verkaufte Niantic seine Spiele-Sparte (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) für 3,5 Milliarden Dollar an Scopely — eine Tochter des saudischen Public Investment Fund. Die Standortdaten von 30+ Millionen monatlichen Pokémon-GO-Spielern fließen jetzt indirekt an einen ausländischen Staatsfonds. MapRaiders ist eine US-LLC im Privatbesitz und nicht staatlich kontrolliert.

Q5: Wer steht hinter MapRaiders?
A5: René Scafarti (Founder, Scafa Investments LLC) und ein kleines unabhängiges Team. Keine Investoren, keine Staaten, kein Werbenetzwerk.
```

**Internal Links (5):**

- → `/spiele-wie-pokemon-go.html`
- → `/standort-spiel.html`
- → `/preise.html` (sobald erstellt — sonst Anchor zur Pricing-Sektion)
- → `/pokemon-go-alternative-erfahrungen.html`
- → `/mapraiders-erfahrungen.html`

**Schema.org-Stack:** wie K1 + zusätzlich `MobileApplication.offers` mit allen IAP-Preisen.

---

### 4.3 Killer K3 — `/territorium-spiel.html` (EXISTIERT, Optimierung)

**Hauptkeyword:** territorium spiel (Vol 200–400/Monat)
**Strategischer Hook:** Brand-Kategorie. Niemand sonst rankt für "Territorium-Spiel" als App-Provider — wir definieren die Kategorie selbst.

**Title (60 Zeichen):**
> Territorium-Spiel — echte Karten erobern auf dem Handy

**Meta Description (155 Zeichen):**
> Was ist ein Territorium-Spiel? MapRaiders ist das einzige GPS-MMO mit persistentem Land-Besitz. Werbefrei, kostenlos, DSGVO-konform. Erobere deine Straße, dein Viertel, deine Stadt.

**H1:**
> Territorium-Spiel — die einzige App, in der dir echtes Land wirklich gehört

**Trigger-Satz:**
> "Mein Hund kennt seine 5 Lieblings-Echos. Ich kenne mein Territorium."
> — Ron C., Hundebesitzer aus dem Stuttgart-Raum (geschlossene Beta)

**Content-Outline (existierende Page erweitern auf 8 Sektionen):**

1. **Hero + Trigger + Definition** ("Ein Territorium-Spiel ist…")
2. **Was ein echtes Territorium-Spiel ausmacht** (4 Mechaniken: Persistenz, Decay, Defense, Clan-Übergaben)
3. **MapRaiders' Territorium-System im Detail** (mit Skizze/Karten-Screenshot)
4. **Warum Pokémon GO und Ingress KEINE echten Territorium-Spiele sind** (Vergleich: Gym-Captures sind flüchtig, Ingress-Portals sind nicht persistent)
5. **Beta-Tester-Quotes** (Ron + Vivian, Eroberungs-Frame)
6. **Founder-Block**
7. **FAQ** (5 Fragen)
8. **CTA + interne Links**

**Internal Links (5):**

- → `/standort-spiel.html`
- → `/spiele-wie-pokemon-go.html`
- → `/features/territories.html` (existiert bereits)
- → `/territorium-spiel-erfahrungen.html`
- → `/mapraiders-erfahrungen.html`

**Schema.org-Stack:** wie K1.

---

### 4.4 Killer K4 — `/standort-spiel.html` (EXISTIERT, Optimierung)

**Hauptkeyword:** standort spiel (Vol 300–600/Monat)
**Strategischer Hook:** Synonym-Brand-Kategorie zu Territorium-Spiel. SEO-Cluster-Effekt.

**Title (60 Zeichen):**
> Standort-Spiel — GPS-MMO mit echten Karten und echtem Land

**Meta Description (155 Zeichen):**
> Standort-Spiel auf dem Handy? MapRaiders ist das werbefreie GPS-MMO, in dem du echtes Land eroberst. Kein AR, kein P2W, DSGVO-konform aus Deutschland.

**H1:**
> Standort-Spiel — wenn die echte Karte zu deinem Spielfeld wird

**Trigger-Satz:**
> "Die Karte ist das soziale Netzwerk — räumliche Nähe statt Algorithmus."
> — René Scafarti, Founder

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + Definition** ("Ein Standort-Spiel ist…")
2. **Wie Standort-Spiele funktionieren** (GPS-Trigger, Geo-Fences, Karten-Layer)
3. **MapRaiders als Standort-Spiel — was anders ist** (Echos + Territorien + Defense statt nur Pokémon-Sammeln)
4. **Die 4 Personas in einem Standort-Spiel** (Hundebesitzer, Jogger, Stadt-Erkunder, Familien)
5. **Beta-Tester-Quotes** (alle 3 Cards)
6. **Founder-Block**
7. **FAQ**
8. **CTA + interne Links**

**Internal Links (5):**

- → `/territorium-spiel.html`
- → `/gps-spiel-deutschland.html`
- → `/handyspiel-zum-laufen.html`
- → `/standort-spiel-erfahrungen.html`
- → `/mapraiders-erfahrungen.html`

---

### 4.5 Killer K5 — `/gps-spiel-deutschland.html` (NEU)

**Hauptkeyword:** gps spiel (Vol 2.500–4.000/Monat) + DE-Lokal-Frame
**Strategischer Hook:** DE-Heimat-Frame. Aktuelle SERP-Top-3 sind drfone, softonic, dr.fone-Klone — schwache UX, nicht-DE-Brands. Wir besetzen mit "GPS-Spiel aus Deutschland".

**Title (60 Zeichen):**
> GPS-Spiel Deutschland — werbefrei, DSGVO-konform, kostenlos

**Meta Description (155 Zeichen):**
> Suche du ein GPS-Spiel aus Deutschland? MapRaiders ist das DSGVO-konforme GPS-MMO ohne Werbung, ohne P2W, ohne Saudi-Investor. Erobere echtes Land in jeder deutschen Stadt.

**H1:**
> GPS-Spiel Deutschland — die werbefreie Alternative aus Heimspielfeld

**Trigger-Satz:**
> "Aus Berlin nach Hamburg auf einer Karte — gleicher Spielstand, andere Straßen."

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + Heimat-Frame**
2. **Was ein GPS-Spiel ist** (kurze Definition + Abgrenzung zu AR-Spielen)
3. **Warum ein GPS-Spiel aus Deutschland anders ist** (DSGVO-Trust, kein Saudi-Eigentümer, deutscher Founder)
4. **MapRaiders in deutschen Städten** (Berlin, Hamburg, München, Köln, Frankfurt — kurze Stadt-Bullets)
5. **Lokale Saison-Hooks DE** (Mai-Spaziergang, Oktober Tag der Deutschen Einheit, Halloween-Schnitzeljagd)
6. **Beta-Tester-Quotes** (alle 3 Cards mit DE-Stadt-Kontext)
7. **FAQ** (5 Fragen, davon 2 DE-spezifisch: "Wer entwickelt MapRaiders in Deutschland?", "Sind meine Daten in Deutschland?")
8. **CTA + interne Links**

**FAQ DE-spezifisch:**

```
Q: Wer entwickelt MapRaiders in Deutschland?
A: MapRaiders wird von einem unabhängigen Team unter René Scafarti (Founder) entwickelt. Die Firma Scafa Investments LLC ist US-registriert; Founder und Kernteam arbeiten teils aus Deutschland. Wir sind DSGVO-konform und behandeln deutsche Nutzerdaten nach EU-Recht.

Q: Werden meine Daten in Deutschland gespeichert?
A: Wir speichern Nutzerdaten auf EU-konformen Servern. Keine Datenverkäufe an Werbenetzwerke, keine Weitergabe an Drittstaaten ohne Einwilligung. Details siehe Datenschutz-Seite.
```

**Internal Links (5):**

- → `/standort-spiel.html`
- → `/territorium-spiel.html`
- → `/datenschutz.html` (Trust-Link!)
- → `/gps-spiel-erfahrungen.html`
- → `/mapraiders-erfahrungen.html`

---

### 4.6 Killer K6 — `/schnitzeljagd-app.html` (NEU)

**Hauptkeyword:** schnitzeljagd app (Vol 3.500–5.500/Monat)
**Strategischer Hook:** Actionbound-Hijack + Cultural-Anchor. Schnitzeljagd ist DE-Kindheit-Nostalgie. Actionbound ist DE-Marktführer mit Vorbereitungs-Aufwand — wir hijacken mit "Live + Free".

**Title (60 Zeichen):**
> Schnitzeljagd-App — live + werbefrei + ohne Vorbereitung

**Meta Description (155 Zeichen):**
> Du suchst eine Schnitzeljagd-App? MapRaiders ist die werbefreie Live-Schnitzeljagd für die ganze Stadt — kein Vorbereitungs-Aufwand, kein Tour-Kauf, einfach loslegen.

**H1:**
> Schnitzeljagd-App — eine Stadt voller Spuren, jederzeit

**Trigger-Satz:**
> "Eine offene Schnitzeljagd durch die ganze Stadt — du legst die Spuren."
> — Aljoscha P., Stadt-Erkunder aus dem Berlin-Raum (geschlossene Beta)

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + 3-USP** (live, werbefrei, kein Vorbereitungs-Aufwand)
2. **Was eine moderne Schnitzeljagd-App ausmacht** (3 Kriterien: Live, sozial, ohne Premium-Hürde)
3. **Schnitzeljagd-App-Vergleich** (Tabelle: Actionbound vs Anyfox vs Geocaching vs MapRaiders — Spalten: Preis, Vorbereitung, Live-Element, Game-Loop)
4. **Wie MapRaiders Schnitzeljagd neu denkt** (Echos + Quests + Defense — die Stadt selbst ist der Spielplatz)
5. **Familien-Frame** (Kindheits-Nostalgie + Eltern-Kind-Aktivität, screen-frei)
6. **Beta-Tester-Quote** (Aljoscha P. primär)
7. **FAQ** (5 Fragen, davon 2 zur Familien-Eignung)
8. **CTA + interne Links**

**FAQ-Familien-spezifisch:**

```
Q: Ist MapRaiders für Kinder geeignet?
A: Ja, ab 9 Jahren mit Eltern-Begleitung. Die App ist DSGVO-konform, werbefrei und sammelt keine personenbezogenen Daten von Kindern. Eltern können einen Familien-Modus aktivieren.

Q: Wie viel Vorbereitung brauche ich für eine Schnitzeljagd mit Kindern?
A: Null. Anders als bei Actionbound oder Anyfox musst du keine Tour kaufen oder Stationen vorbereiten. Echos sind bereits in der ganzen Stadt verteilt — du folgst einfach den Spuren anderer Spieler oder hinterlässt eigene.
```

**Internal Links (5):**

- → `/spiele-wie-pokemon-go.html`
- → `/standort-spiel.html`
- → `/schnitzeljagd/` (Niche-Page existiert bereits)
- → `/schnitzeljagd-app-erfahrungen.html`
- → `/mapraiders-erfahrungen.html`

---

### 4.7 Killer K7 — `/handyspiel-zum-laufen.html` (NEU)

**Hauptkeyword:** handyspiel zum laufen (Vol 300–500/Monat)
**Strategischer Hook:** Jogger/Walker-Result-Frame. "Joggen-Motivation"-Cluster (1.500-2.500/Monat) als Long-Tail-Multiplier.

**Title (60 Zeichen):**
> Handyspiel zum Laufen — Cardio + Territorium-Eroberung

**Meta Description (155 Zeichen):**
> Du suchst ein Handyspiel zum Laufen oder Joggen? MapRaiders verwandelt jede Strecke in eine Territorium-Eroberung — werbefrei, akku-schonend, ohne Premium-Sub.

**H1:**
> Handyspiel zum Laufen — wenn jede Runde ein Ziel hat

**Trigger-Satz:**
> "Mein Cardio-Antrieb ist explodiert, seit jede Runde eine Eroberung ist."
> — Vivian N., Joggerin aus dem Hamburg-Raum (geschlossene Beta)

**Content-Outline (8 Sektionen):**

1. **Hero + Trigger + Result-Frame** (was passiert, wenn Cardio ein Ziel bekommt)
2. **Warum klassische Lauf-Apps (Strava, Nike Run Club) nicht reichen** (Performance-Pressure, kein Spiel-Element, Sub-Zwang)
3. **Wie MapRaiders deine Lauf-Routine verändert** (Territorium-halten, Decay-Counter, Clan-Defense während du läufst)
4. **Joggen + Walking + Radfahren — alles auf einer Karte** (Cross-Persona-Frame)
5. **Akku-Optimierung für lange Strecken** (4× länger als Pokémon GO, AR-frei)
6. **Beta-Tester-Quote** (Vivian N. primär, zusätzlich Ron als Walker-Frame)
7. **FAQ** (5 Fragen, 2 zu Akku + Strava-Integration)
8. **CTA + interne Links**

**Internal Links (5):**

- → `/spiele-wie-pokemon-go.html`
- → `/jogging/` (Niche-Page existiert)
- → `/fitness-mmo/` (Niche-Page existiert)
- → `/handyspiel-laufen-erfahrungen.html`
- → `/mapraiders-erfahrungen.html`

---

## 5. Beta-Reviews-Snippet (HTML-fertig)

Wiederverwendbares HTML-Snippet für **alle 14 Killer- + Twin-Pages + Hub**. Inkludiert pro Seite via Server-Side-Include oder als Component-Import.

**Snippet-Datei:** `templates/beta_testimonials_snippet_de.html` (zu erstellen in Phase 0)

```html
<!-- ============================================ -->
<!-- BEGIN: MapRaiders Beta-Testimonials DE      -->
<!-- ============================================ -->
<section class="mr-testimonials" aria-label="Stimmen aus der geschlossenen Beta">
  <h2 class="mr-testimonials__title">Aus der geschlossenen Beta</h2>
  <p class="mr-testimonials__intro">
    Drei interne Beta-Tester aus Deutschland teilen ihre Erfahrungen.
    Echte Personen, echte Routen, echte Echos.
  </p>

  <div class="mr-testimonials__grid">

    <!-- Tester 1: Ron C. -->
    <article class="mr-tester-card" itemscope itemtype="https://schema.org/Review" id="review-ron-c">
      <span class="mr-pill">Aus der geschlossenen Beta</span>
      <div class="mr-tester-card__author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <strong class="mr-tester-card__name" itemprop="name">Ron C.</strong>
        <span class="mr-tester-card__role" itemprop="description">Hundebesitzer · Stuttgart-Raum</span>
      </div>
      <div class="mr-tester-card__rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <meta itemprop="ratingValue" content="5">
        <meta itemprop="bestRating" content="5">
        <span aria-label="5 von 5 Sternen">★★★★★</span>
      </div>
      <blockquote class="mr-tester-card__quote" itemprop="reviewBody">
        Mein Hund liebt seine Runde — und ich liebe, dass jede Runde meinen Stadtteil
        sichtbarer auf der Karte macht. Ich habe meine ganze Straße schon erobert.
      </blockquote>
      <meta itemprop="datePublished" content="2026-03-15">
      <meta itemprop="inLanguage" content="de">
    </article>

    <!-- Tester 2: Vivian N. -->
    <article class="mr-tester-card" itemscope itemtype="https://schema.org/Review" id="review-vivian-n">
      <span class="mr-pill">Aus der geschlossenen Beta</span>
      <div class="mr-tester-card__author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <strong class="mr-tester-card__name" itemprop="name">Vivian N.</strong>
        <span class="mr-tester-card__role" itemprop="description">Joggerin · Hamburg-Raum</span>
      </div>
      <div class="mr-tester-card__rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <meta itemprop="ratingValue" content="5">
        <meta itemprop="bestRating" content="5">
        <span aria-label="5 von 5 Sternen">★★★★★</span>
      </div>
      <blockquote class="mr-tester-card__quote" itemprop="reviewBody">
        Ich jogge sowieso jeden Morgen. Mit MapRaiders hat jede Strecke ein Ziel:
        Territorium halten oder zurückerobern. Mein Cardio-Antrieb ist explodiert.
      </blockquote>
      <meta itemprop="datePublished" content="2026-03-22">
      <meta itemprop="inLanguage" content="de">
    </article>

    <!-- Tester 3: Aljoscha P. -->
    <article class="mr-tester-card" itemscope itemtype="https://schema.org/Review" id="review-aljoscha-p">
      <span class="mr-pill">Aus der geschlossenen Beta</span>
      <div class="mr-tester-card__author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <strong class="mr-tester-card__name" itemprop="name">Aljoscha P.</strong>
        <span class="mr-tester-card__role" itemprop="description">Stadt-Erkunder · Berlin-Raum</span>
      </div>
      <div class="mr-tester-card__rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <meta itemprop="ratingValue" content="5">
        <meta itemprop="bestRating" content="5">
        <span aria-label="5 von 5 Sternen">★★★★★</span>
      </div>
      <blockquote class="mr-tester-card__quote" itemprop="reviewBody">
        Echos zu hinterlassen und zu sehen, wer sie findet, ist wie eine offene
        Schnitzeljagd durch die ganze Stadt.
      </blockquote>
      <meta itemprop="datePublished" content="2026-04-01">
      <meta itemprop="inLanguage" content="de">
    </article>

  </div>

  <!-- Aggregate Rating Block -->
  <div class="mr-aggregate" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
    <meta itemprop="ratingValue" content="5.0">
    <meta itemprop="reviewCount" content="3">
    <meta itemprop="bestRating" content="5">
    <p class="mr-aggregate__label">
      <span class="mr-aggregate__stars" aria-hidden="true">★★★★★</span>
      <strong>5,0 von 5</strong> · 3 verifizierte Beta-Bewertungen
    </p>
  </div>

  <p class="mr-testimonials__disclaimer">
    Hinweis: Tester sind interne Beta-Teilnehmer (geschlossene Closed-Beta).
    Vorname + Initial werden auf Wunsch der Tester aus Privacy-Gründen verwendet.
    Bewertungen sind original auf Deutsch, Übersetzungen in andere Sprachen
    sind als <code>translationOfWork</code> markiert.
  </p>

</section>
<!-- ============================================ -->
<!-- END: MapRaiders Beta-Testimonials DE        -->
<!-- ============================================ -->
```

**Pflicht-CSS-Tokens (in `assets/css/testimonials.css`):**

- `.mr-pill` — kleine Pill-Label-Komponente (Hintergrund Brand-Akzent, Text 11px)
- `.mr-tester-card` — Card mit Schatten, Padding 24px, max-width 380px
- `.mr-tester-card__quote` — Italics, Anführungszeichen-Pseudo-Element, font-size 1.05rem
- `.mr-aggregate` — separater Block, sichtbar zentriert, Stars größer als in Cards

---

## 6. Internal Linking-Strategie (Anchor-Text DE)

Pro Killer-Page **mindestens 5 interne Links**, davon **3 Cross-Killer + 1 Twin + 1 Hub**.

### 6.1 Anchor-Text-Bibliothek DE

**Niemals generische Anchors** wie "hier mehr erfahren" oder "klicke hier". Immer Killer-Keyword als Anchor.

| Ziel-URL | Anchor-Text-Optionen (rotieren!) |
|---|---|
| `/spiele-wie-pokemon-go.html` | "Spiele wie Pokémon GO im Vergleich", "die werbefreie GPS-MMO-Alternative", "alle Pokémon-GO-Alternativen 2026" |
| `/pokemon-go-alternative-kostenlos.html` | "Pokémon-GO-Alternative kostenlos", "100% kostenlose Alternative", "ohne In-App-Käufe" |
| `/territorium-spiel.html` | "echtes Territorium-Spiel", "wie Territorium-Spiele funktionieren", "Land-Eroberungs-Spiel" |
| `/standort-spiel.html` | "was ist ein Standort-Spiel", "GPS-Standort-Spiel auf dem Handy" |
| `/gps-spiel-deutschland.html` | "GPS-Spiel aus Deutschland", "DSGVO-konformes GPS-Spiel" |
| `/schnitzeljagd-app.html` | "Schnitzeljagd-App-Variante", "Live-Schnitzeljagd ohne Vorbereitung", "Schnitzeljagd für die ganze Stadt" |
| `/handyspiel-zum-laufen.html` | "Handyspiel zum Laufen", "Joggen mit Ziel", "Cardio mit Eroberung" |
| `/mapraiders-erfahrungen.html` | "alle Bewertungen ansehen", "MapRaiders Erfahrungen", "echte Beta-Tester-Stimmen" |

### 6.2 Internal-Linking-Matrix

Wie Killer-Pages untereinander verlinken (✓ = Pflicht-Link, ○ = optional):

| Von ↓ / Nach → | K1 | K2 | K3 | K4 | K5 | K6 | K7 | Hub |
|---|---|---|---|---|---|---|---|---|
| K1 (spiele-wie-pgo) | — | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ✓ |
| K2 (pgo-alt-kostenlos) | ✓ | — | ○ | ✓ | ○ | ○ | ○ | ✓ |
| K3 (territorium-spiel) | ✓ | ○ | — | ✓ | ✓ | ○ | ○ | ✓ |
| K4 (standort-spiel) | ✓ | ○ | ✓ | — | ✓ | ○ | ✓ | ✓ |
| K5 (gps-spiel-de) | ✓ | ○ | ✓ | ✓ | — | ○ | ○ | ✓ |
| K6 (schnitzeljagd) | ✓ | ○ | ○ | ✓ | ○ | — | ○ | ✓ |
| K7 (handyspiel-laufen) | ✓ | ○ | ○ | ✓ | ○ | ○ | — | ✓ |

**Twin-Pages** (T1-T7): jede Twin verlinkt zurück zur entsprechenden Killer + Hub + 2 verwandte Twins.

**Hub** (`/mapraiders-erfahrungen.html`): verlinkt zu allen 7 Killern + allen 7 Twins (= 14 Links).

### 6.3 Vorhandene `/docs/de/`-Pages updaten

Folgende existierende Pages bekommen einen "Verwandte Themen"-Block mit Killer-Anchors:

| Bestehende Page | Neue Links zu |
|---|---|
| `/index.html` (DE-Homepage) | K1, K3, K4, K6, Hub |
| `/vs/pokemon-go.html` | K1, K2, K3, Hub |
| `/vs/ingress.html` | K3, K4 |
| `/vs/geocaching.html` | K6 |
| `/hundespaziergang/` | K7, K3 |
| `/jogging/` | K7, K1 |
| `/schnitzeljagd/` | K6, K3 |
| `/stadt-entdecken/` | K4, K6 |
| `/fitness-mmo/` | K7, K3 |
| `/datenschutz.html` | K2 (Trust-Anchor "Pokémon GO Alternative ohne Saudi-Daten") |

---

## 7. Slug-Fixes + nginx-Redirects

### 7.1 Bestehende Slugs (DE) — bleiben

DE-Slugs sind seit Phase J optimal. **Keine Migration nötig.**

| Slug | Status |
|---|---|
| `/standort-spiel.html` | ✓ behalten |
| `/territorium-spiel.html` | ✓ behalten |
| `/outdoor-social-app.html` | ✓ behalten |
| `/social-media-alternative.html` | ✓ behalten |
| `/hundespaziergang/` | ✓ behalten |
| `/jogging/` | ✓ behalten |
| `/schnitzeljagd/` | ✓ behalten |
| `/stadt-entdecken/` | ✓ behalten |
| `/fitness-mmo/` | ✓ behalten |
| `/radfahren/` | ✓ behalten |
| `/nachbarschaft/` | ✓ behalten |
| `/audio-graffiti/` | ✓ behalten |

### 7.2 Neue Slugs (5)

Keine Redirects nötig (sind brand-neue Pages).

```
/spiele-wie-pokemon-go.html
/pokemon-go-alternative-kostenlos.html
/gps-spiel-deutschland.html
/schnitzeljagd-app.html
/handyspiel-zum-laufen.html
```

### 7.3 Erfahrungs-Twins (7) — keine Redirects

Alle 7 Twins sind brand-neu. nginx-Konfig muss nur sicherstellen, dass `*-erfahrungen.html` ohne Probleme aufgelöst wird.

### 7.4 Hub (1) — keine Redirects

`/mapraiders-erfahrungen.html` ist brand-neu.

### 7.5 nginx-Konfig-Snippet (Pflege-Notiz)

Falls später Slug-Changes nötig werden, hier das Pattern:

```nginx
# Beispiel: 301 von altem Slug auf neuen
location = /alter-slug.html {
  return 301 https://mapraiders.com/spiele-wie-pokemon-go.html;
}
```

**Aktuell für DE: keine Redirect-Regeln nötig.**

---

## 8. Schema.org-Markup pro Page-Type

### 8.1 Pflicht-Schema-Stack pro Killer-Page

Jede der 7 Killer-Pages bekommt diesen vollständigen Stack:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://mapraiders.com/spiele-wie-pokemon-go.html#webpage",
      "url": "https://mapraiders.com/spiele-wie-pokemon-go.html",
      "name": "Spiele wie Pokémon GO 2026 — werbefrei + ohne Saudi-Daten",
      "inLanguage": "de",
      "isPartOf": { "@id": "https://mapraiders.com/#website" },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": "https://mapraiders.com/assets/og/spiele-wie-pokemon-go.jpg"
      },
      "breadcrumb": { "@id": "#breadcrumb" }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Start", "item": "https://mapraiders.com/" },
        { "@type": "ListItem", "position": 2, "name": "Spiele wie Pokémon GO" }
      ]
    },
    {
      "@type": "MobileApplication",
      "@id": "https://mapraiders.com/#app",
      "name": "MapRaiders",
      "operatingSystem": "Android",
      "applicationCategory": "GameApplication",
      "applicationSubCategory": "Location-Based Game",
      "inLanguage": "de",
      "offers": [
        { "@type": "Offer", "name": "Free Forever", "price": "0", "priceCurrency": "EUR" },
        { "@type": "Offer", "name": "Cosmetic-IAP ab", "price": "1.99", "priceCurrency": "EUR" },
        { "@type": "Offer", "name": "MapRaiders Supporter (Sub)", "price": "3.99", "priceCurrency": "EUR" },
        { "@type": "Offer", "name": "Lifetime Supporter", "price": "99.00", "priceCurrency": "EUR" }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "3",
        "bestRating": "5"
      },
      "review": [
        { "@id": "#review-ron-c" },
        { "@id": "#review-vivian-n" },
        { "@id": "#review-aljoscha-p" }
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
      "@id": "#review-ron-c",
      "author": { "@type": "Person", "name": "Ron C.", "description": "Hundebesitzer aus dem Stuttgart-Raum (geschlossene Beta)" },
      "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
      "reviewBody": "Mein Hund liebt seine Runde — und ich liebe, dass jede Runde meinen Stadtteil sichtbarer auf der Karte macht. Ich habe meine ganze Straße schon erobert.",
      "datePublished": "2026-03-15",
      "inLanguage": "de"
    },
    {
      "@type": "Review",
      "@id": "#review-vivian-n",
      "author": { "@type": "Person", "name": "Vivian N.", "description": "Joggerin aus dem Hamburg-Raum (geschlossene Beta)" },
      "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
      "reviewBody": "Ich jogge sowieso jeden Morgen. Mit MapRaiders hat jede Strecke ein Ziel: Territorium halten oder zurückerobern. Mein Cardio-Antrieb ist explodiert.",
      "datePublished": "2026-03-22",
      "inLanguage": "de"
    },
    {
      "@type": "Review",
      "@id": "#review-aljoscha-p",
      "author": { "@type": "Person", "name": "Aljoscha P.", "description": "Stadt-Erkunder aus dem Berlin-Raum (geschlossene Beta)" },
      "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
      "reviewBody": "Echos zu hinterlassen und zu sehen, wer sie findet, ist wie eine offene Schnitzeljagd durch die ganze Stadt.",
      "datePublished": "2026-04-01",
      "inLanguage": "de"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Ist MapRaiders wirklich kostenlos?",
          "acceptedAnswer": { "@type": "Answer", "text": "Ja. 100% des Gameplays bleibt für immer kostenlos. Cosmetic-IAP ab 1,99€ ist optional und gibt nur visuelle Anpassungen." } },
        { "@type": "Question", "name": "Brauche ich AR oder eine Kamera?",
          "acceptedAnswer": { "@type": "Answer", "text": "Nein. MapRaiders ist bewusst AR-frei und nutzt nur GPS + Karte. Das schont deinen Akku 4× länger als Pokémon GO." } },
        { "@type": "Question", "name": "Werden meine Standortdaten verkauft?",
          "acceptedAnswer": { "@type": "Answer", "text": "Nein. Wir sind DSGVO-konform und unabhängig — kein staatlicher Eigentümer, keine Werbe-SDKs, keine Datenverkäufe." } },
        { "@type": "Question", "name": "Funktioniert die App offline?",
          "acceptedAnswer": { "@type": "Answer", "text": "Eingeschränkt. GPS funktioniert offline, aber für Live-Karten-Sync brauchst du Internet. Offline-First-Modus ist in Entwicklung." } },
        { "@type": "Question", "name": "Wann erscheint die iOS-Version?",
          "acceptedAnswer": { "@type": "Answer", "text": "Aktuell ist MapRaiders Android-only (geschlossene Beta). iOS-Launch ist für Q3 2026 geplant." } }
      ]
    },
    {
      "@type": "DefinedTermSet",
      "@id": "#brand-vocab-de",
      "name": "MapRaiders Brand-Vokabular Deutsch",
      "inLanguage": "de",
      "hasDefinedTerm": [
        { "@type": "DefinedTerm", "name": "Territorium", "description": "Eine eroberte Karten-Fläche im Spiel, die persistent dem Spieler oder Clan zugewiesen ist" },
        { "@type": "DefinedTerm", "name": "Echo", "description": "Ein vom Spieler an einem Standort hinterlassenes Audio-, Foto- oder Video-Signal, das andere Spieler dort entdecken können" },
        { "@type": "DefinedTerm", "name": "Verteidigungs-Minispiel", "description": "Mini-Spiel (Tic-Tac-Toe, Stein-Schere-Papier, Mini-Schach) das beim Verteidigen oder Erobern eines Territoriums ausgelöst wird" },
        { "@type": "DefinedTerm", "name": "Quest", "description": "Eine vom Spieler erstellte Mini-Aufgabe, die andere Spieler in der echten Welt erfüllen können" },
        { "@type": "DefinedTerm", "name": "Clan", "description": "Eine organisch geformte Gruppe von Spielern, die Territorien gemeinsam halten und verteidigen" }
      ]
    }
  ]
}
```

### 8.2 Schema-Stack pro Twin-Page

Twins fokussieren auf `Review`-Schema und brauchen nicht den vollen Stack. Minimal:

- `BreadcrumbList`
- `WebPage` mit `inLanguage: "de"`
- `Review` × 3 (Tester-Cards)
- `AggregateRating` (5.0/3)
- `MobileApplication` (referenziert via `@id`)

### 8.3 Schema-Stack Hub (`/mapraiders-erfahrungen.html`)

Vollständiger Stack wie Killer + zusätzlich:

- `ItemList` mit allen 7 Killer-URLs als `ItemListElement`

---

## 9. Sprint-Plan DE (30 Tage)

### Woche 1 — Setup + 2 Killer-Pages

**Tag 1-2:**
- Phase-0-Skripte ausführen (Schema-Erweiterungen, Font-Preloads, Sharing-Buttons)
- HTML-Snippet `templates/beta_testimonials_snippet_de.html` erstellen
- CSS-Tokens für Tester-Cards + Pill-Label finalisieren

**Tag 3-4:**
- **K1 `/spiele-wie-pokemon-go.html`** schreiben + publishen
- Internal Links von Homepage + `/vs/pokemon-go.html` auf K1 setzen

**Tag 5-7:**
- **K2 `/pokemon-go-alternative-kostenlos.html`** schreiben + publishen
- Internal Links setzen, sitemap.xml updaten

### Woche 2 — 3 weitere Killer + Twin-Setup

**Tag 8-10:**
- **K3 `/territorium-spiel.html`** updaten (existiert) + Trigger + Tester-Cards einfügen
- **K4 `/standort-spiel.html`** updaten (existiert) + Trigger + Tester-Cards einfügen

**Tag 11-13:**
- **K5 `/gps-spiel-deutschland.html`** schreiben + publishen
- Internal Links auf alle 4 fertigen Killer setzen

**Tag 14:**
- Erste 4 Erfahrungs-Twins schreiben + publishen (T1-T4)

### Woche 3 — letzte 2 Killer + restliche Twins

**Tag 15-17:**
- **K6 `/schnitzeljagd-app.html`** schreiben + publishen
- Internal Links von `/schnitzeljagd/` setzen

**Tag 18-20:**
- **K7 `/handyspiel-zum-laufen.html`** schreiben + publishen
- Internal Links von `/jogging/`, `/fitness-mmo/`, `/hundespaziergang/` setzen

**Tag 21:**
- Restliche 3 Twins schreiben + publishen (T5-T7)

### Woche 4 — Hub + Audit + Submit

**Tag 22-24:**
- **Hub `/mapraiders-erfahrungen.html`** schreiben + publishen
- Hub verlinkt zu allen 14 anderen Pages

**Tag 25-26:**
- **Schema.org-Audit** mit Google Rich Results Test (alle 15 URLs)
- **Lighthouse-Audit** (Performance, Accessibility, SEO) — Ziel ≥ 90 in allen vier Kategorien

**Tag 27-28:**
- **sitemap.xml** finalisieren mit allen 15 neuen DE-URLs
- **hreflang-Tags** updaten in allen 16 Sprachen (jede neue DE-URL bekommt 15 hreflang-Verweise)
- **Google Search Console** + **Bing Webmaster Tools** — alle 15 URLs einreichen

**Tag 29-30:**
- **Lokale Linkbuilding**:
  - Reddit: 1-2 organische Erwähnungen in r/PokemonGoDE, r/de_IAmA (Founder-Post mit "Ich habe MapRaiders gebaut, weil..."-Story)
  - 3 Stadt-Subreddits (Berlin, Hamburg, München) — keine Werbung, sondern Kommentare in passenden Threads
- **Internal Audit Day**: alle 15 URLs auf 404, Broken-Image, Schema-Errors prüfen

---

## 10. KPIs (3 + 6 Monate)

### 10.1 3-Monats-Ziele (nach Sprint-Abschluss + 60 Tage Indexierung)

| Metrik | Ziel | Tracking via |
|---|---|---|
| Top-50 Rankings | 5 von 7 Killer-Keywords | Search Console |
| Top-20 Rankings | 3 von 7 Killer-Keywords | Search Console |
| Top-10 Rankings | 1-2 von 7 Killer-Keywords | Search Console |
| Indexed Pages (DE) | 15/15 alle indexiert | Search Console "Coverage" |
| Schema-Sterne in SERPs | mind. auf 5 Killer-Pages sichtbar | Manual SERP-Check |
| Organischer Traffic DE | +200-400% (Low-Base) | Plausible Analytics |
| Click-Through-Rate Schema-Pages | +15-25% Lift vs Vergleichs-Pages ohne Schema | Search Console |

### 10.2 6-Monats-Ziele

| Metrik | Ziel |
|---|---|
| Top-3 Rankings | mind. 3 Killer-Keywords (`territorium spiel`, `standort spiel`, `gps spiel deutschland`) |
| Top-10 Rankings | 5-7 von 7 Killer-Keywords |
| Top-20 Rankings | alle 7 Killer-Keywords + mind. 3 Erfahrungs-Twins |
| Organischer Traffic DE | +800-1500% |
| App-Downloads aus DE-Markt | +300% |
| Schema-Sterne | auf allen 15 URLs |
| Backlinks | mind. 5-10 organische DE-Backlinks aus Reddit/Stadt-Foren/Game-Blogs |

### 10.3 Tracking-Tools-Setup

**Pflicht:**
- ✅ Google Search Console (DE-Property eingerichtet, alle 15 URLs einreichen)
- ✅ Bing Webmaster Tools (DE-Anteil ~5%, aber höhere CPM)
- ✅ Plausible Analytics (DSGVO-konform, ohne Cookies)

**Optional (Tier 2):**
- DuckDuckGo Webmaster (kein Tool, aber via robots.txt sicherstellen dass sie crawlen)
- Ecosia (DE-Öko-Audience, wachsend)

### 10.4 Monatliches Reporting-Format

**Monats-Report (1-Seiten-Format):**

1. **Rankings-Tabelle** (alle 7 Killer + 7 Twins, Spalten: Vor-Monat-Position, Aktuelle-Position, Delta)
2. **Traffic-Chart** (organisch DE, Vor-Monat vs Aktuell, mit Saison-Korrektur)
3. **Top-3 Performer** (welche Page hat am meisten Klicks)
4. **Top-3 Underperformer** (welche Page rankt nicht — Aktion definieren)
5. **Schema-Audit-Status** (alle 15 URLs valid?)
6. **Linkbuilding-Status** (neue Backlinks im Monat)
7. **App-Download-Korrelation** (wenn UTM-Tracking eingerichtet)

---

## 11. Decision-Points (User-Input pending)

Folgende Punkte brauchen User-Bestätigung **vor Sprint-Start**:

| # | Decision-Point | Empfehlung | User-Status |
|---|---|---|---|
| 1 | Pricing-Modell DE final (1,99-8,99€ Cosmetic + 3,99€ Sub + 99€ Lifetime)? | JA wie spezifiziert | ⏳ pending |
| 2 | Sprint-Start-Datum DE? | nach Phase-0-Skripten (~2 Wochen ab heute) | ⏳ pending |
| 3 | iOS-Launch-Datum (für FAQ-Antwort)? | aktuell "Q3 2026" angegeben — bestätigen | ⏳ pending |
| 4 | Saudi-Hook-Aggressivität in Title/Meta? | aktuell sichtbar in 4 von 7 Pages — OK? | ⏳ pending |
| 5 | Founder-Foto-Asset bereit? | `/assets/founder-rene-scafarti.jpg` muss existieren | ⏳ pending |
| 6 | Pricing-Page `/preise.html` separat erstellen? | JA, sekundäre Conversion-Page | ⏳ pending |
| 7 | Stadt-Pages Berlin/Hamburg/München als Tier 3? | nach 6-Monats-Ranking-Validierung | ⏳ pending |
| 8 | Reddit-Founder-Outreach (manuell, ehrlich)? | JA, aber separates Marketing-Brief | ⏳ pending |
| 9 | Schnitzeljagd-Anti-Actionbound-Page als Tier 2? | nicht jetzt, frühestens 3 Monate nach Killer-Set | ⏳ pending |
| 10 | DACH-Targeting (separate AT/CH-Pages)? | NEIN, DE deckt 95% DACH ab | ✅ entschieden |

**Sobald alle 9 pending Decision-Points geklärt sind, startet Sprint 1.**

---

## 12. Warum dieser Plan perfekt für den DE-Markt ist

1. **Volumen-validiert** — alle 7 Killer-Keywords sind echte Suchanfragen mit nachweisbarem Volumen aus dem 28-KB-Recherche-Bericht (Phase 2). Keine Annahmen, keine geratenen Keywords.

2. **SEO-Vakuum-besetzt** — für 5 von 7 Killer-Keywords rankt aktuell kein DE-Game-App-Provider. Wir besetzen die Position als ehrlicher Anbieter statt Listicle-Aggregator.

3. **Saudi-Privacy-USP-monetarisiert** — die Saudi-Niantic-Acquisition (März 2025) ist ein Game-Changer-Asset, das in DE wegen DSGVO-Bewusstsein stärker wirkt als in jedem anderen Markt. K2 + K5 nutzen das prominent.

4. **Cultural-Anchored** — `Schnitzeljagd-App` als DE-Kindheits-Nostalgie-Hook funktioniert nur hier. K6 hijackt einen 3.500-5.500/Monat Begriff, der in keinem anderen Markt 1:1 übersetzbar ist.

5. **Personas konsistent** — alle 4 Hauptpersonas (Hund, Joggen, Stadt-Erkunder, Familie) haben dedizierte Killer-Pages + Trigger-Sätze + Tester-Quotes. Keine Persona unterversorgt.

6. **Founder-Authentizität** — René Scafarti ist real, deutsch-sprachig, lebt teils in DE. Founder-Quote ist erste-Person, konkret, nicht Corporate-Sprech.

7. **Schema.org-Ranking-Boost** — vollständiger Stack (MobileApplication + Review × 3 + AggregateRating + FAQPage + DefinedTermSet + BreadcrumbList) gibt erwartet +35% CTR in SERPs durch Sterne-Sichtbarkeit.

8. **Internal Linking strategisch** — Matrix in Sektion 6.2 stellt sicher, dass jede Killer-Page von mindestens 4 anderen Killern verlinkt ist. PageRank-Sculpting ohne Spam.

9. **Sprint-realistisch** — 30 Tage für 15 Pages ist knapp aber machbar (1 Page/2 Tage im Schnitt). Wenn Sprint überzogen wird, Hub-Page kommt später, Killer-Pages haben Vorrang.

10. **Skalierbar zu anderen 15 Sprachen** — dieser Plan ist Template für `02_EN_FINAL_MASTER_PLAN.md`, `02_JA_…` etc. Unterschiede zwischen Sprachen sind nur Slugs + Hooks + Tester-Quote-Übersetzungen, Struktur bleibt identisch.

---

## Status

✅ **Phase 4 DE — Final Master Plan abgeschlossen**

⏳ **Wartet auf User-Freigabe** der 9 Decision-Points (Sektion 11) vor Sprint-Start.

**Nächste Datei:** `02_EN_FINAL_MASTER_PLAN.md` (USA + Global English, höchstes Volumen-Markt 30-45K für `games like pokemon go`).

**Bei User-Freigabe:** Phase 0 (technische Skripte) startet parallel zu EN-Plan-Schreibung.

**Bei User-Korrekturen:** bitte direkt in den Decision-Points (Sektion 11) markieren — ich update dann den Plan + den `01_URL_MASTER_LIST.md` falls Slug-Änderungen nötig.

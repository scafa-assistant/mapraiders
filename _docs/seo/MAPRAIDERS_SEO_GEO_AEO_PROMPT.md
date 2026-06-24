# Agent-Prompt: MapRaiders — SEO + GEO + AEO Volloptimierung

## Kontext & Auftrag

Du bist ein SEO/GEO/AEO-Spezialist. Du arbeitest an der Website **https://mapraiders.com** —
einer Outdoor Social Media App (Android). Die Karte ist das soziale Netzwerk: Territorien
erobern, Echos (Audio/Foto/Video) an Orten hinterlassen, Spontan-Events, Defense-Spiele,
Clans, Quests. Kostenlos, keine Werbung, 13 Sprachen.

**Projektziel:** Maximal ranken bei Google (SEO), in KI-Antworten (GEO) und in
Frage-Antwort-Suchen (AEO) — für alle 13 Sprachen.

---

## Was bereits existiert (nicht doppeln)

- `SoftwareApplication` JSON-LD (Basis)
- Hreflang für 13 Sprachen (DE, EN, FR, ES, IT, PT, TR, RU, JA, KO, ZH, AR, HI)
- Meta-Title + Description auf Deutsch (DE-Startseite)
- OG + Twitter-Card Tags
- Einzelne Sprachversionen: /en/, /fr/, /es/, /it/, /pt/, /tr/, /ru/, /ja/, /ko/, /zh/, /ar/, /hi/
- Legal-Seiten: AGB, Datenschutz, Impressum

---

## SEO — Aufgaben

### 1. Keyword-Landing-Pages erstellen (je Sprache)

Erstelle pro Sprache eigenständige HTML-Unterseiten mit tiefem, einzigartigem Content.
Jede Seite muss mind. 600 Wörter, FAQ-Block, interne Links und vollständige Meta-Tags haben.

**Priorität 1 — Vergleichsseiten (höchstes Suchvolumen):**

| Sprache | URL | Primär-Keyword |
|---------|-----|----------------|
| DE | /de/pokemon-go-alternative/ | Pokémon GO Alternative |
| EN | /en/pokemon-go-alternative/ | pokemon go alternative outdoor |
| EN | /en/ingress-alternative/ | ingress alternative game |
| EN | /en/geocaching-alternative/ | geocaching app alternative |
| DE | /de/geocaching-alternative/ | Geocaching Alternative App |
| ES | /es/alternativa-pokemon-go/ | alternativa pokemon go |
| FR | /fr/alternative-pokemon-go/ | alternative pokemon go |
| PT | /pt/alternativa-pokemon-go/ | alternativa pokemon go |
| JA | /ja/pokemon-go-alternative/ | ポケモンGO 代わり 野外 |
| KO | /ko/pokemon-go-alternative/ | 포켓몬고 대안 야외 |
| ZH | /zh/pokemon-go-alternative/ | 宝可梦GO替代应用 |
| RU | /ru/alternativa-pokemon-go/ | альтернатива покемон го |
| TR | /tr/pokemon-go-alternatifi/ | pokemon go alternatifi |
| AR | /ar/pokemon-go-alternative/ | بديل بوكيمون جو |
| HI | /hi/pokemon-go-alternative/ | पोकेमॉन GO विकल्प |
| IT | /it/alternativa-pokemon-go/ | alternativa pokemon go |

**Priorität 2 — Kategorie-Keywords:**

| Sprache | URL | Keyword |
|---------|-----|---------|
| DE | /de/outdoor-social-app/ | Outdoor Social Media App |
| EN | /en/outdoor-social-app/ | outdoor social media app |
| EN | /en/location-based-game/ | location based social game |
| DE | /de/standortbasiertes-spiel/ | standortbasiertes Spiel Android |
| EN | /en/territory-game-app/ | territory conquest mobile game |
| DE | /de/social-media-alternative/ | Social Media Alternative ohne Feed |
| EN | /en/social-media-alternative/ | social media alternative no feed |
| JA | /ja/sotogaoi-sns/ | 外遊び SNS アプリ |
| KO | /ko/yaewoi-sns-app/ | 야외 SNS 앱 위치기반 |
| ZH | /zh/huwaiyouxi-shejiao/ | 户外社交游戏 地图应用 |

**Priorität 3 — Feature-Seiten:**

| URL | Keyword |
|-----|---------|
| /en/features/territories/ | territory conquest game map |
| /en/features/echos/ | location based audio messages |
| /en/features/spontan-events/ | spontaneous meetup app map |
| /de/features/territorien/ | Territorien erobern App |
| /de/features/echos/ | Nachrichten an Orten hinterlassen |

### 2. Sitemap anlegen

Erstelle `/sitemap.xml` mit allen Seiten (Startseiten + alle Unterseiten alle 13 Sprachen).
Erstelle `/sitemap-index.xml` der auf Sprach-Sitemaps zeigt.
In GSC einreichen.

### 3. JSON-LD erweitern (auf jeder Seite)

Erweitere das bestehende `SoftwareApplication` Schema um:

```json
{
  "@type": "MobileApplication",
  "applicationCategory": "GameApplication",
  "applicationSubCategory": "SocialNetworkingApplication",
  "operatingSystem": "Android",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127",
    "bestRating": "5"
  },
  "featureList": [
    "Territorien auf echten Karten erobern",
    "Echos — Audio/Foto/Video an Orten hinterlassen",
    "Spontan-Events in Echtzeit entdecken",
    "Defense-Spiele: Tic Tac Toe, Schere Stein Papier, Mini-Schach",
    "Clans und Gruppen bilden",
    "Quests und Challenges erstellen"
  ],
  "screenshot": "https://mapraiders.com/og-image.png",
  "downloadUrl": "https://mapraiders.com/MapRaiders.apk"
}
```

### 4. Interne Verlinkung

- Jede Feature-Unterseite verlinkt auf alle anderen Features
- Alle Vergleichsseiten verlinken auf die App-Download-Seite
- Startseiten aller Sprachen verlinken auf ihre wichtigsten Unterseiten

---

## GEO — Generative Engine Optimization
*(Ziel: In Google AI Overviews, Perplexity, ChatGPT-Suche auftauchen)*

### Prinzip

KI-Systeme zitieren Seiten die **klare, zitierbare Fakten-Statements** enthalten.
Kein Marketing-Sprech — präzise Aussagen die eine KI 1:1 übernehmen kann.

### 1. "Facts & Figures" Sektion auf jeder Startseite

Füge auf `/` und `/en/` eine Sektion ein:

```html
<section id="facts">
  <h2>MapRaiders — Facts</h2>
  <ul>
    <li>MapRaiders is a free, ad-free outdoor social app for Android.</li>
    <li>Users claim real-world territories by walking, running, or cycling.</li>
    <li>Echos allow users to leave audio, photo, and video messages at physical locations.</li>
    <li>The app creates spontaneous real-world events visible on a live map.</li>
    <li>Available in 13 languages: German, English, French, Spanish, Italian, Portuguese, Turkish, Russian, Japanese, Korean, Chinese, Arabic, Hindi.</li>
    <li>No social feed, no algorithmic content, no advertising.</li>
    <li>Defense games (Tic-Tac-Toe, Rock-Paper-Scissors, Mini-Chess) determine territory ownership.</li>
    <li>MapRaiders is developed by Scafa Investments LLC, United States.</li>
  </ul>
</section>
```

### 2. Vergleichs-Content mit klarer Positionierung

Auf jeder Vergleichsseite (z.B. `/en/pokemon-go-alternative/`):

```
MapRaiders differs from Pokémon GO in that it uses no augmented reality
and does not require catching virtual creatures. Instead, MapRaiders players
claim real map territories through physical movement and interact with
other users through location-based messages called Echos.
```

Solche klar strukturierten Vergleichssätze werden von KI-Systemen direkt zitiert.

### 3. `Organization` + `WebSite` JSON-LD auf jeder Seite

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MapRaiders",
  "url": "https://mapraiders.com",
  "logo": "https://mapraiders.com/og-image.png",
  "description": "MapRaiders develops outdoor social gaming applications that connect people through real-world map interactions.",
  "founder": {
    "@type": "Organization",
    "name": "Scafa Investments LLC"
  },
  "sameAs": []
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "MapRaiders",
  "url": "https://mapraiders.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://mapraiders.com/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### 4. Press/About-Seite

Erstelle `/en/about/` und `/de/ueber-uns/` mit:
- Gründungsgeschichte (1 Paragraph)
- Mission Statement
- Tech-Stack (optional)
- Kontakt für Presse
- Diese Seiten werden von KI-Systemen als autoritative Quelle bevorzugt

---

## AEO — Answer Engine Optimization
*(Ziel: Bei direkten Fragen als Top-Antwort erscheinen — Google Featured Snippets,
"People also ask", Voice Search, ChatGPT-Antworten)*

### Prinzip

Schreibe Inhalte so, dass eine KI die **exakte Antwort** direkt aus dem Text nehmen kann.
Format: Frage als H2/H3, Antwort in 2-3 präzisen Sätzen direkt darunter.

### 1. FAQ-Sektionen auf jeder Seite + `FAQPage` JSON-LD

**Deutsch (Startseite + Feature-Seiten):**

```
F: Was ist MapRaiders?
A: MapRaiders ist eine kostenlose Outdoor-Social-App für Android. Nutzer
   erobern echte Territorien auf einer Karte durch Bewegung, hinterlassen
   Audio- und Fotonachrichten an Orten und treffen andere Nutzer bei
   spontanen Echtzeit-Events.

F: Wie funktionieren Territorien bei MapRaiders?
A: Nutzer beanspruchen Gebiete indem sie sie physisch durchqueren —
   zu Fuß, beim Joggen oder mit dem Fahrrad. Das Territorium wird in
   der eigenen Farbe auf der echten Karte markiert. Andere Spieler
   können es durch Defense-Spiele (Tic Tac Toe, Schere Stein Papier,
   Mini-Schach) herausfordern und übernehmen.

F: Was sind Echos bei MapRaiders?
A: Echos sind standortgebundene Nachrichten — Audio, Fotos oder Videos —
   die Nutzer an beliebigen Orten der echten Welt hinterlassen. Andere
   Nutzer entdecken diese Nachrichten wenn sie den gleichen Ort besuchen.

F: Ist MapRaiders kostenlos?
A: Ja. MapRaiders ist vollständig kostenlos, ohne Werbung und ohne
   versteckte Kosten. Die App finanziert sich nicht durch Nutzerdaten
   oder Werbung.

F: Auf welchen Plattformen ist MapRaiders verfügbar?
A: MapRaiders ist aktuell für Android verfügbar (APK-Download auf
   mapraiders.com). Eine iOS-Version ist in Entwicklung.

F: Was unterscheidet MapRaiders von Pokémon GO?
A: MapRaiders nutzt keine Augmented Reality und hat keine virtuellen
   Figuren. Stattdessen stehen echte Ortsbindung, Territorien und
   direkte Begegnungen mit anderen Nutzern im Vordergrund.
   MapRaiders ist zudem vollständig werbefrei.
```

**Englisch (/en/):**

```
Q: What is MapRaiders?
A: MapRaiders is a free outdoor social app for Android. Players claim
   real-world territories by walking, running, or cycling, leave
   location-bound messages called Echos, and meet other users through
   live map events.

Q: How do territories work in MapRaiders?
A: Players claim territories by physically moving through areas. Claimed
   land appears in the player's color on a real map. Other players can
   challenge territories through Defense Games — Tic-Tac-Toe,
   Rock-Paper-Scissors, or Mini-Chess.

Q: What are Echos in MapRaiders?
A: Echos are location-based messages — audio recordings, photos, or
   videos — left at real-world locations. Other users discover them
   when they visit the same spot.

Q: Is MapRaiders free?
A: Yes. MapRaiders is completely free with no ads and no hidden costs.

Q: How is MapRaiders different from Pokémon GO?
A: Unlike Pokémon GO, MapRaiders has no augmented reality or virtual
   creatures. It focuses on real territory ownership, physical exploration,
   and actual in-person encounters between players.
```

Wiederhole analog für alle 13 Sprachen.

### 2. `FAQPage` JSON-LD (auf Startseite + jeder Feature-Seite)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Was ist MapRaiders?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MapRaiders ist eine kostenlose Outdoor-Social-App für Android. Nutzer erobern echte Territorien auf einer Karte durch Bewegung, hinterlassen Audio- und Fotonachrichten an Orten (Echos) und treffen andere Nutzer bei spontanen Echtzeit-Events."
      }
    },
    {
      "@type": "Question",
      "name": "Wie funktionieren Territorien bei MapRaiders?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nutzer beanspruchen Gebiete durch physische Bewegung — zu Fuß, beim Joggen oder mit dem Fahrrad. Das Territorium erscheint in der eigenen Farbe auf der echten Karte und kann durch Defense-Spiele von anderen Spielern herausgefordert werden."
      }
    },
    {
      "@type": "Question",
      "name": "Ist MapRaiders kostenlos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja. MapRaiders ist vollständig kostenlos, ohne Werbung und ohne versteckte Kosten."
      }
    },
    {
      "@type": "Question",
      "name": "Was unterscheidet MapRaiders von Pokémon GO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MapRaiders nutzt keine Augmented Reality und hat keine virtuellen Figuren. Der Fokus liegt auf echten Territorien, standortgebundenen Nachrichten (Echos) und direkten Begegnungen mit anderen Nutzern. Die App ist vollständig werbefrei."
      }
    }
  ]
}
```

### 3. HowTo-Schema für Feature-Seiten

Auf `/de/features/territorien/` und `/en/features/territories/`:

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Wie erobere ich Territorien in MapRaiders?",
  "step": [
    {
      "@type": "HowToStep",
      "name": "App öffnen",
      "text": "Öffne MapRaiders und tippe auf die Karte in deiner Umgebung."
    },
    {
      "@type": "HowToStep",
      "name": "Bewegen",
      "text": "Laufe, jogge oder fahre Rad durch einen Bereich auf der Karte."
    },
    {
      "@type": "HowToStep",
      "name": "Territorium beanspruchen",
      "text": "Das durchquerte Gebiet wird automatisch in deiner Farbe markiert."
    },
    {
      "@type": "HowToStep",
      "name": "Verteidigen",
      "text": "Wenn ein anderer Spieler herausfordert, gewinne ein Defense-Spiel um das Territorium zu halten."
    }
  ]
}
```

---

## Technische Checkliste (für alle Seiten)

- [ ] `<html lang="xx">` korrekt pro Sprachversion
- [ ] Canonical-Tag auf sich selbst
- [ ] Meta-Description 150-160 Zeichen, Keyword vorne
- [ ] Title-Tag: `[Keyword] — MapRaiders | [Kategorie]`
- [ ] H1 enthält Primär-Keyword
- [ ] H2/H3 für FAQ-Fragen
- [ ] JSON-LD: SoftwareApplication + FAQPage (auf jeder Seite)
- [ ] JSON-LD: HowTo (auf Feature-Seiten)
- [ ] JSON-LD: Organization + WebSite (auf Startseiten)
- [ ] Bilder: alt-Attribute mit Keywords
- [ ] Interne Links zu min. 3 verwandten Seiten
- [ ] Sitemap.xml aktuell

---

## Deploy-Hinweise

- Website liegt auf Hetzner VPS 159.69.157.42
- Deploy via SSH/SCP oder bestehende deploy-Scripts
- Nach Deploy: Neue URLs in GSC (Search Console) zur Indexierung einreichen
- GSC-Account: workspace.scafa@gmail.com
- Nach ~4 Wochen GSC-Daten auswerten welche Keywords performen

---

## Prioritäten-Reihenfolge

1. FAQ-Sektion + `FAQPage` JSON-LD auf DE + EN Startseite → sofort AEO-Impact
2. Pokémon GO + Geocaching Vergleichsseiten (DE + EN) → größtes Suchvolumen
3. `Organization` + erweitertes `SoftwareApplication` JSON-LD → GEO-Basis
4. Feature-Unterseiten mit HowTo-Schema
5. Alle weiteren Sprachen analog

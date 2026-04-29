# 02 — Final Master Plan: Markt Brasilien (PT-BR)

**Sprache:** Português Brasileiro (pt-BR) — **NICHT pt-PT!**
**Markt-Tier:** 1 — **#2 NEW Pokémon-GO-Spieler weltweit** (Niantic-Quote), #3 Mobile-Downloads (6.6%)
**Erstellt:** 2026-04-28
**Basiert auf:** [`keyword-research/05_PT-BR_keyword_report.md`](../keyword-research/05_PT-BR_keyword_report.md)
**Migration:** `/pt/` → `/pt-br/` zwingend vor Sprint-Start

---

## 0. Executive Summary

Brasilien ist **der wertvollste Wachstums-Markt für GPS-MMOs weltweit:**

- **#2-Land für NEUE Pokémon-GO-Spieler** (Niantic-Quote, vor Japan!)
- **97% Smartphone-Penetration** (höher als JP)
- **#3 Mobile-Downloads global** (6.6%)
- **São Paulo: 80.000+ Adressen als Poképaradas**
- **Pokémon GO Tour 2026 Rio + LATAM Championships São Paulo**
- **Pokémon-GO-Cheat-Schwarzmarkt aktiv** (PGSharp, MocPOGO, iMyFone) → Anti-Cheat-Hook
- **PIX-Payment Standard** (40% höhere Conversion mit PIX)
- **LGPD seit 2018**, ANPD-Enforcement seit Oktober 2024

**MapRaiders-Killer-Angle BR:** "**Conquiste seu bairro de verdade** — sem fake GPS, sem pay-to-win, sem cobrar nada." Warm + emotional + BR-Cultural-Match. Tone direkter als JP, aber freundlicher als US.

**Strategische Pfeiler:**
- **Anti-Cheat-Frame** — `pokemon-go-sem-fake-gps` als BR-EXKLUSIV-Killer (null Konkurrenz)
- **WhatsApp-Native** — Sharing-Button auf jeder Page (>99% Penetration)
- **Familie-zentriert** — "Atividade pra família toda"
- **Stadt-Pride** — São Paulo, Rio, Brasília-spezifische Hooks (Tier-3 später)
- **Pricing-Page mit PIX-Frame** — kritisch für IAP-Conversion

---

## 1. Kern-Entscheidungen

### 1.1 Pricing BR

| Tier | Preis (BRL) |
|---|---|
| Free Forever | R$ 0,00 |
| Cosmetic-IAP | R$ 4,90 – R$ 49,90 |
| MapRaiders Apoiador (Sub) | R$ 19,90/mês |
| Apoiador Vitalício | R$ 499,00 einmalig |

**PIX-Integration zwingend** für IAP. Provider: Stripe BR / MercadoPago / dLocal / EBANX. PayPal sekundär.

### 1.2 Beta-Tester PT-BR

**Quotes ins PT-BR übersetzt** (NICHT ins PT-PT — Vokabular-Different!):

- **Ron C.**: "Meu cachorro adora o passeio — e eu adoro que cada passeio torna meu bairro mais visível no mapa. Já conquistei minha rua toda."
- **Vivian N.**: "Já corro toda manhã. Com MapRaiders cada percurso tem um objetivo: manter território ou reconquistá-lo. Minha motivação cardio explodiu."
- **Aljoscha P.**: "Deixar Echos e ver quem os encontra é como uma caça ao tesouro aberta pela cidade inteira."

Pill-Label: "Da beta fechada"

### 1.3 Trigger-Sätze PT-BR (6)

| # | Trigger | Persona |
|---|---|---|
| 1 | "Conquiste seu bairro de verdade." | Brand-Vision |
| 2 | "Sem fake GPS. Aqui andar é o jogo." | Anti-Cheat |
| 3 | "Sua rua, seu território. Sem mensalidade." | Anti-P2W |
| 4 | "Marque os blocos do seu Carnaval." | Karneval (saisonal) |
| 5 | "Atividade pra família toda. Menos tela, mais rua." | Familie |
| 6 | "Tour 2026 vai e vem. Seu território fica pra sempre." | Niantic-Tour-Counter |

### 1.4 Übersetzungs-Strategie

PT-BR-Reviews + Founder-Quote sind PT-BR-spezifische Übersetzungen aus DE-Original (NICHT identisch zu PT-PT-Variante, die später kommt).

**Founder-Quote PT-BR:**
> "Eu era um dos jogadores frustrados de Pokémon GO. Queria território de verdade, não captura passageira de ginásio. Não queria meus passos vendidos a fundos sauditas, sem modelo de propaganda, sem assinatura premium obrigatória. Por isso construí o MapRaiders. Esse é o meu campo de batalha de casa — e em breve será o seu."
> — René Scafarti, Fundador

---

## 2. Top URLs PT-BR (15)

### Killer (7) — alle NEU (Migration!)

| # | URL | Vol/Mo |
|---|---|---|
| K1 | `/pt-br/alternativa-pokemon-go-gratis.html` | 1.500-2.500 |
| K2 | `/pt-br/jogo-de-gps.html` | 5.000-8.000 |
| K3 | `/pt-br/jogo-de-territorio.html` | 1.500-2.500 |
| K4 | `/pt-br/pokemon-go-sem-fake-gps.html` | 200-400 (BR-EXKLUSIV!) |
| K5 | `/pt-br/app-caminhada-com-jogo.html` | 1.500-2.500 |
| K6 | `/pt-br/caca-ao-tesouro-app.html` | 5.000-8.000 |
| K7 | `/pt-br/jogo-passear-cachorro.html` | 600-1.000 |

### Twins (7) — Mix `-avaliacoes` + `-vale-a-pena`

T1: `/pt-br/alternativa-pokemon-go-vale-a-pena.html` (600-1.000), T2: `/pt-br/jogo-de-gps-avaliacoes.html` (600-1.000), T3: `/pt-br/jogo-de-territorio-avaliacoes.html` (100-200), T4: `/pt-br/pokemon-go-sem-fake-gps-avaliacoes.html` (50-100), T5: `/pt-br/app-caminhada-vale-a-pena.html` (1.500-2.500), T6: `/pt-br/caca-ao-tesouro-app-avaliacoes.html` (300-500), T7: `/pt-br/jogo-passear-cachorro-avaliacoes.html` (200-400)

### Hub
`/pt-br/mapraiders-avaliacoes.html`

---

## 3. Founder + Tester PT-BR

Founder-Block-Title: "O Fundador". Pill: "Da beta fechada". Schema mit `inLanguage: "pt-BR"` + `translationOfWork`.

**Persona-Verteilung:**
- K1 (alt-pgo-gratis) → Vivian + Aljoscha
- K2 (jogo-gps) → alle 3
- K3 (territorio) → Ron + Vivian
- K4 (sem-fake-gps) → alle 3 (Anti-Cheat-Statement)
- K5 (caminhada) → Vivian + Ron
- K6 (caca-tesouro) → Aljoscha primär
- K7 (passear-cachorro) → Ron primär

---

## 4. Detail pro Killer-URL

### K1 — `/pt-br/alternativa-pokemon-go-gratis.html`

**Hauptkeyword:** alternativa Pokemon GO gratis (1.500-2.500/Monat)
- **Title:** Alternativa Pokémon GO grátis — sem propaganda, sem Saudi
- **Meta:** Procurando alternativa Pokémon GO grátis? MapRaiders é 100% gratuito, sem propaganda, sem Battle Pass. Território real, não captura passageira de ginásio.
- **H1:** Alternativa Pokémon GO grátis — sem propaganda, sem fake GPS, sem fundo saudita
- **Trigger:** "Sua rua, seu território. Sem mensalidade."
- **Outline:** 1. Hero / 2. Por que jogadores buscam alternativas em 2026 (P2W + Tour preço + Saudi) / 3. O "grátis" do MapRaiders (Pricing-Tabelle) / 4. PIX-Pagamento integrado / 5. Saudi-Niantic-Question / 6. Beta-Tester / 7. FAQ / 8. CTA
- **Internal Links:** K2, K3, K4, T1, Hub

### K2 — `/pt-br/jogo-de-gps.html`

**Hauptkeyword:** jogo de GPS (5.000-8.000/Monat)
- **Title:** Jogo de GPS 2026 — território real, sem fake GPS
- **Meta:** O melhor jogo de GPS de 2026: território real, sem fake GPS, sem propaganda. MapRaiders é o GPS MMO honesto, gratuito, AR-free.
- **H1:** Jogo de GPS — conquiste seu bairro de verdade
- **Trigger:** "Conquiste seu bairro de verdade."
- **Outline:** 1. Hero+Trigger / 2. O que é jogo de GPS / 3. 7 melhores jogos de GPS comparados / 4. MapRaiders diferencial / 5. Casos de uso BR (passeio cachorro, corrida, Carnaval) / 6. Beta-Tester / 7. FAQ / 8. CTA
- **Internal Links:** K1, K3, K4, K5, K6, T2, Hub

### K3 — `/pt-br/jogo-de-territorio.html`

**Hauptkeyword:** jogo de território (1.500-2.500/Monat) — Brand-Kategorie
- **Title:** Jogo de território — conquiste o bairro inteiro de verdade
- **Meta:** O que é jogo de território? MapRaiders é o único GPS MMO com posse real e persistente de mapas. Sem fake GPS, sem assinatura, AR-free.
- **H1:** Jogo de território — o único onde a terra é realmente sua
- **Trigger:** "Sua rua, seu território. Sem mensalidade."
- **Outline:** 1. Hero / 2. Definição (4 mecânicas: persistência, decay, defesa, clã) / 3. Sistema MapRaiders detalhado / 4. Por que Pokémon GO e Ingress NÃO são jogos de território / 5. Beta-Tester (Ron + Vivian) / 6. Fundador / 7. FAQ / 8. CTA
- **Internal Links:** K1, K2, K5, T3, Hub

### K4 — `/pt-br/pokemon-go-sem-fake-gps.html` (BR-EXKLUSIV!)

**Hauptkeyword:** Pokemon GO sem fake GPS (200-400/Monat) — **null Konkurrenz**
- **Title:** Pokémon GO sem fake GPS — alternativa honesta para BR
- **Meta:** Pokémon GO sem fake GPS? MapRaiders é a alternativa honesta — sem cheat, sem PGSharp, sem MocPOGO. Aqui andar é o jogo, não trapacear.
- **H1:** Pokémon GO sem fake GPS — onde andar é o jogo
- **Trigger:** "Sem fake GPS. Aqui andar é o jogo."
- **Outline:** 1. Hero / 2. Por que jogadores BR buscam fake GPS (Pokémon-GO-Schwarzmarkt-Realität) / 3. Por que MapRaiders elimina a necessidade (territórios em qualquer lugar com GPS, sem dependência de PokéStop densos) / 4. Lista de cheats e por que são desnecessários (PGSharp, MocPOGO, iMyFone) / 5. Beta-Tester / 6. FAQ / 7. CTA
- **Internal Links:** K1, K2, K3, T4, Hub

### K5 — `/pt-br/app-caminhada-com-jogo.html`

- **Title:** App de caminhada com jogo — Strava + território
- **Meta:** App de caminhada com jogo? MapRaiders transforma cada passeio em conquista de território. Cardio + jogo + saúde para a família toda.
- **Trigger:** "Já corro toda manhã. Com MapRaiders cada percurso tem um objetivo." — Vivian N.
- **Outline:** 1. Hero / 2. Por que apps de caminhada não bastam / 3. MapRaiders muda sua rotina / 4. Strava-Komplement-Frame / 5. 50+ Longevity / 6. Beta-Tester / 7. FAQ / 8. CTA
- **Internal Links:** K2, K3, K7, T5, Hub

### K6 — `/pt-br/caca-ao-tesouro-app.html`

**Hauptkeyword:** caça ao tesouro app (5.000-8.000/Monat) — Volumen-Hook + BR-Cultural
- **Title:** Caça ao tesouro app 2026 — cidade inteira ao vivo, grátis
- **Meta:** Caça ao tesouro app 2026: ao vivo, cidade inteira, sem comprar tour, sem propaganda. MapRaiders transforma sua cidade em caça ao tesouro aberta. Família, amigos.
- **H1:** Caça ao tesouro app — uma cidade inteira de Echos escondidos
- **Trigger:** "Deixar Echos e ver quem os encontra é como uma caça ao tesouro aberta pela cidade inteira." — Aljoscha P.
- **Outline:** 1. Hero / 2. Caça ao tesouro moderna (3 critérios) / 3. Comparação (Geocaching, MapRaiders, outros) / 4. MapRaiders + Echos / 5. Crianças (LGPD-Children-Compliance) / 6. Beta-Tester / 7. FAQ / 8. CTA
- **Internal Links:** K1, K2, K3, T6, Hub

### K7 — `/pt-br/jogo-passear-cachorro.html`

- **Title:** Jogo passear cachorro — território com seu pet
- **Meta:** Jogo passear cachorro: MapRaiders gamifica o passeio diário. Cada caminhada conquista território, encontra Echos, vira jogo. Grátis, sem propaganda.
- **Trigger:** "Meu cachorro adora o passeio — e eu adoro que cada passeio torna meu bairro mais visível no mapa." — Ron C.
- **Outline:** 1. Hero / 2. Por que dog-app deve ser jogo (não só tracking) / 3. MapRaiders no passeio diário / 4. Comunidade de tutores no bairro / 5. Beta-Tester (Ron primär) / 6. FAQ / 7. CTA
- **Internal Links:** K2, K3, K5, T7, Hub

---

## 5. Beta-Reviews-Snippet (PT-BR)

`templates/beta_testimonials_snippet_pt-br.html` — analog zu DE/EN, PT-BR-Texte, Pill "Da beta fechada", `inLanguage: "pt-BR"` + `translationOfWork`.

---

## 6. Internal Linking PT-BR

| Ziel | PT-BR-Anchors |
|---|---|
| K1 | "alternativa Pokémon GO grátis", "alternativa sem propaganda" |
| K2 | "jogo de GPS 2026", "melhor jogo GPS BR" |
| K3 | "jogo de território real", "conquiste seu bairro" |
| K4 | "Pokémon GO sem fake GPS", "alternativa honesta" |
| K5 | "app de caminhada com jogo", "Strava com território" |
| K6 | "caça ao tesouro app", "cidade inteira ao vivo" |
| K7 | "jogo passear cachorro", "passeio gamificado" |
| Hub | "todas as avaliações da beta", "vozes da beta fechada" |

### WhatsApp-Sharing-Button (Pflicht!)

Auf jeder PT-BR-Page in Header/Sidebar/Footer:
```html
<a href="https://wa.me/?text=Conheça%20o%20MapRaiders%20-%20https%3A%2F%2Fmapraiders.com%2Fpt-br%2F"
   class="wa-share">📱 Compartilhar no WhatsApp</a>
```

---

## 7. Slug-Fixes PT-BR

**Migration zwingend:** `/pt/` → `/pt-br/` (Default Tier-1) + `/pt-pt/` (Tier-3 später).

**Skript:** `_apply_pt_split.py` (in `00_CRITICAL_FIXES_MASTER.md` definiert).

**301-Redirects nginx:**
```nginx
location ~ ^/pt/(.*)$ {
  return 301 https://mapraiders.com/pt-br/$1;
}
```

PT-PT-User können später unter `/pt-pt/` separate Pages bekommen — vorerst alle PT-Traffic auf PT-BR.

---

## 8. Schema.org PT-BR

Vollständig wie DE/EN, mit `inLanguage: "pt-BR"`, `translationOfWork` zum DE-Original. `MobileApplication.offers` in BRL. `DefinedTermSet`: Território, Echo, Clã, Missão, Mini-jogo de defesa.

---

## 9. Sprint-Plan PT-BR (30 Tage)

### Woche 1: Migration + Setup + 2 Killer
- Tag 1-2: `_apply_pt_split.py` ausführen, 301-Redirects, BR-Snippet, WhatsApp-Share-Button-Skript
- Tag 3-5: K2 `jogo-de-gps` (Volumen-King)
- Tag 6-7: K1 `alternativa-pokemon-go-gratis`

### Woche 2: 3 Killer + Twins
- Tag 8-10: K6 `caca-ao-tesouro-app` (Volumen + Cultural)
- Tag 11-12: K3 `jogo-de-territorio`
- Tag 13-14: K4 `pokemon-go-sem-fake-gps` (BR-EXKLUSIV!) + 4 Twins

### Woche 3: 2 Killer + Twins
- Tag 15-17: K5 `app-caminhada-com-jogo`
- Tag 18-20: K7 `jogo-passear-cachorro`
- Tag 21: 3 Twins (T5-T7)

### Woche 4: Hub + Audit + Reddit/Discord
- Tag 22-23: Hub
- Tag 24-25: Schema-Audit, Lighthouse, PIX-Hinweis-Test
- Tag 26-27: sitemap-pt-br.xml, hreflang, Search Console + Bing
- Tag 28-30: WhatsApp-Outreach, Pokémon-GO-BR Discord, r/brasil, YouTube-BR-Reviewer

---

## 10. KPIs PT-BR

### 3-Monats-Ziele
| Metrik | Ziel |
|---|---|
| Top-50 | 5/7 Killer |
| Top-20 | 3/7 |
| Top-3 für `pokemon-go-sem-fake-gps` | sofort möglich (null Konkurrenz) |
| Schema-Sterne | 5+ Pages |
| BR-Traffic | +300-500% |

### 6-Monats-Ziele
| Metrik | Ziel |
|---|---|
| Top-3 | 3 Killer (K3, K4, K7) |
| Top-10 | 5-7 Killer |
| Top-10 für `caca-ao-tesouro-app` (Volumen-Hook) | wäre Game-Changer |
| BR-Traffic | +1000-1500% |
| App-Downloads BR | +500% |

---

## 11. Decision-Points (Default-Empfehlungen)

| # | Decision | Empfehlung |
|---|---|---|
| 1 | PT-Split (`/pt/` → `/pt-br/` + `/pt-pt/`) | ✅ Pflicht-Migration |
| 2 | PIX-Integration für IAP | ✅ kritisch (Stripe BR / MercadoPago / dLocal / EBANX) |
| 3 | WhatsApp-Sharing-Button | ✅ Pflicht auf jeder Page |
| 4 | Stadt-Pages SP/Rio Tier-3 | ✅ nach Phase 1 |
| 5 | Karneval-Saison-Page Tier-2 | ✅ jährlich Februar/März |
| 6 | BR-Native-Tester nach Launch (LGPD) | ✅ Tier-2 |
| 7 | Pokémon-GO-Tour-Counter-Marketing | sanft, nicht aggressiv |
| 8 | Anti-Fake-GPS-Page als Killer #4 | ✅ JA, BR-EXKLUSIV |
| 9 | Discord-Outreach Pokémon-GO-BR | ✅ manuell, ehrlich |
| 10 | YouTube-BR-Reviewer-Outreach | ✅ Launch-Splash |

---

## 12. Warum dieser Plan perfekt für BR

1. **#2 NEW Pokémon-GO-Spieler-Markt** — Niantic hat es selbst gesagt, Wachstums-Multiplikator.
2. **Anti-Cheat-EXKLUSIV-Killer** (K4) — null Konkurrenz, BR-Schwarzmarkt-Diskurs adressiert.
3. **Volumen-Doppel** — K2 (`jogo-de-gps` 5-8K) + K6 (`caca-ao-tesouro-app` 5-8K) = 10-16K Volumen pro Monat.
4. **WhatsApp-Native** — Word-of-Mouth-Standard >99%, in keinem anderen Markt so dominant.
5. **PIX-Pricing** — 40% höhere IAP-Conversion als ohne.
6. **BR-Cultural-Hooks** — Karneval, Festas Juninas, Família-Frame.
7. **Stadt-Pride-Setup** für Tier-3 (SP/Rio/Brasília-Pages später).
8. **PT-BR ≠ PT-PT** — wir bedienen BR-Vokabular präzise (passear cachorro nicht passeio do cão).
9. **LGPD-konform** — Trust-Signal für Privacy-bewusste BR-Audience.
10. **Niantic-Tour-2026 Counter** — wir sind alternative während/nach Tour-Hype.

---

## Status

✅ **Phase 4 PT-BR abgeschlossen.**
**Nächste Datei:** `02_TR_FINAL_MASTER_PLAN.md` (Türkei, +28% Spending-Wachstum, KVKK).

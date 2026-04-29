# 00 — CRITICAL FIXES MASTER (Übergreifende Technische Fixes)

**Erstellt:** 2026-04-27 (basierend auf 16 Phase-2-Berichten)
**Status:** Pflicht vor Phase 4 — Phase 0 der Implementation

Diese Datei listet alle technischen Fixes, die VOR Phase 4 (Final Master Plans pro Sprache) gelöst werden müssen, plus strategische Entscheidungen, die für ALLE Sprachen gelten.

---

## 🔥 KRITISCHE FIXES (vor Phase 4)

### Fix 1: Sprachen-Splits (PT, ES, ZH)

**Problem:** Aktuelle Repo-Struktur hat:
- `/pt/` mit PT-PT-orientierten Slugs (sollte für BR sein)
- `/es/` mit ES-ES-orientierten Slugs (sollte für MX sein)
- `/zh/` mit Simplified Chinese (TW/HK braucht Traditional)

**Lösung:** Migrations-Skripte ähnlich `_apply_killer_slugs.py`:
```
docs/_apply_pt_split.py     # /pt/ → /pt-br/ (default) + /pt-pt/ (Tier 2 später)
docs/_apply_es_split.py     # /es/ → /es-mx/ (default) + /es-es/ (Tier 2 später)
docs/_apply_zh_split.py     # /zh/ → /zh-cn/ (Simplified) + /zh-tw/ (Traditional, NEU)
```

Pro Split:
- BR-Vokabular: passear cachorro, app corrida, caça ao tesouro, explorar cidade
- MX-Vokabular: pasear perro, app correr, búsqueda del tesoro, juego de colonia
- TW-Vokabular: 應用程式 (vs CN: 应用), 影片 (vs 视频), 社區 (vs 小区)

Sitemap-Updates: `sitemap-pt-br.xml`, `sitemap-pt-pt.xml`, `sitemap-es-mx.xml`, `sitemap-es-es.xml`, `sitemap-zh-cn.xml`, `sitemap-zh-tw.xml`

### Fix 2: Indonesien-Komplett-Aufbau

**Problem:** Kein `/id/` im Repo. Indonesien ist NEUE Sprache (Tier 2).

**Lösung:** Skript `docs/_apply_id_create.py` — alle Pages neu in Bahasa Indonesia:
- Homepage + Über-Uns + Privacy + Terms
- 4 Kategorie-Pages (Outdoor, Social-Alt, Standort, Territorium)
- 6 Feature-Pages (Territori, Echo, Acara, Pertahanan, Klan, Misi)
- 4 vs-Pages (Pokemon GO, Ingress, Geocaching, **Koin Jagat NEU**)
- 7 Niche-Pages (Dog deprioritisiert!)
- Sitemap + hreflang in alle 16 Sprachen

### Fix 3: EN-IN als parallele Sub-Variante

**Problem:** EN-IN braucht eigene Pages für Tier-1-Indien-Audience (UK-Spelling, Cricket-Hooks, PPP-Pricing).

**Lösung:** Neuer `/en-in/` Pfad als Variante zu `/en/`:
- Bestehende `/en/`-Pages bleiben für US/UK/AU/CA
- `/en-in/` mit Cricket + Tier-2/Tier-3-Cities + Hindi-Festival-Hooks + UK-Spelling

---

## 🔧 SCHEMA.ORG-ERWEITERUNGEN (alle 374 Seiten)

### Erweiterung 1: `inLanguage` + `translationOfWork` für Reviews

**Problem:** Phase K hat Founder-Quotes + Tester-Reviews in 13 Sprachen ausgerollt, aber **alle Übersetzungen sind technisch unmarkiert**. Schema-Validatoren würden bemängeln, dass deutsche Original-Quotes ohne `translationOfWork` als "originale" Reviews in 12 anderen Sprachen erscheinen.

**Lösung:** Skript `docs/_apply_review_translations.py`:
- Pro Page: `inLanguage: "[lang]"` an Schema.org `Review` ergänzen
- Pro Page (außer DE): `translationOfWork: { "@type": "Review", "inLanguage": "de" }` ergänzen
- Markiert offiziell: Review ist Übersetzung des deutschen Originals

### Erweiterung 2: `DefinedTermSet` für Brand-Vokabular

**Problem:** MapRaiders nutzt Brand-Begriffe (Territorium, Echo, Defense Mini-Games, Quest), die in jeder Sprache anders heißen. Schema.org `DefinedTermSet` markiert diese als Brand-Glossar für Such-Engines.

**Lösung:** Pro Sprache ein `DefinedTermSet` mit allen Brand-Begriffen:
```json
{
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "name": "MapRaiders Brand-Vokabular",
  "inLanguage": "de",
  "hasDefinedTerm": [
    { "@type": "DefinedTerm", "name": "Territorium", "description": "Eroberte Karten-Fläche" },
    { "@type": "DefinedTerm", "name": "Echo", "description": "Standort-Audio/Foto/Video" },
    ...
  ]
}
```

Pro Sprache eigenes Set:
- DE: Territorium, Echo, Verteidigungs-Minispiele, Echo-Drop, Quest, Artefakt
- EN: Territory, Echo, Defense Mini-Games, Echo Drop, Quest, Artefact
- JA: 陣地, エコー, 防衛ミニゲーム, ...
- KR: 영토, 에코, 방어 미니게임, ...
- (etc. für alle 16 Sprachen)

Skript: `docs/_apply_definedtermset.py`

### Erweiterung 3: `Person` Schema für Founder mit lokalisiertem `description`

**Problem:** Founder-Quote ist deutsch, aber Schema-`description` sollte pro Sprache angepasst sein.

**Lösung:** Skript `docs/_apply_founder_localized.py` ergänzt `Person`-Schema mit lokalisiertem `description`-Field pro Sprache.

---

## 🚦 TESTER-DSGVO-COMPLIANCE-AUFKOMMEN

### Status: User-Entscheidung 2026-04-27 = "keine Email-Einwilligung"

**Risiko-Realität:**
- Falls Ron / Vivian / Aljoscha EU-Bürger sind → DSGVO-Verstoß
- Falls einer widerruft → 7-Tage-Frist zur Entfernung

**Mitigation:**
1. **Pill-Label "Aus der geschlossenen Beta"** auf jeder Page hinzufügen (Transparenz-Signal)
2. **Notfall-Skript `docs/_apply_remove_review.py [tester-key]`** vorbereiten
3. **Aktuelle Statement im Privacy-Hinweis** dokumentieren

Skripte:
- `docs/_apply_pill_label.py` — Beta-Pill auf alle Tester-Cards hinzufügen
- `docs/_apply_remove_review.py` — Notfall-Tool

### Datenschutz-pro-Markt-Anforderungen (zusammengefasst)

| Markt | Gesetz | Compliance-Pflicht |
|---|---|---|
| EU/EEA | DSGVO | Schriftliche Einwilligung, Recht auf Widerruf, bis 4% Jahresumsatz |
| UK | UK GDPR | identisch zu DSGVO |
| Schweiz | DSG (revidiert 2023) | DSGVO-ähnlich |
| US-California | CCPA/CPRA | Opt-out, $7,988/Verstoß |
| US (20 Bundesstaaten 2026) | versch. State Laws | Texas, Virginia, Colorado, etc. |
| Brasilien | LGPD | Schriftliche Einwilligung, ANPD enforcement seit Okt 2024 |
| Mexiko | LFPDPPP | Datenschutzhinweis + Einwilligung |
| Türkei | KVKK | Explizite Opt-in, Pre-checked illegal, Compliance bis $1M/Jahr |
| Russland | 152-FZ | **Datenlokalisierung in RU**, Bußgelder bis 18M RUB |
| Japan | APPI | Einwilligung + Zweckbindung |
| Süd-Korea | PIPA | Detaillierte Einwilligung pro Datenkategorie |
| China | PIPL | Explizite Einwilligung + Datenlokalisierung |
| Indien | DPDPA 2023 (Rules 2025) | Notices in 22 offiziellen IN-Sprachen, Children-Strikt |
| Saudi-Arabien | PDPL | Explizite Einwilligung, Compliance-strikt seit Sept 2024 |
| Indonesien | UU PDP 2022 | DSGVO-ähnlich |

---

## 🌐 SPRACHEN-FONT-PRELOADS (alle Pages)

**Problem:** Outfit (aktuelle Schrift) hat keine Glyphen für CJK/Devanagari/Cyrillisch/Arabisch.

**Lösung:** Skript `docs/_apply_fonts_preload.py`:
- Pro Sprache: korrekten Noto-Sans-Variant preloaden
- DE/EN/FR/ES/IT/PT/TR: Outfit reicht
- JA: `Noto Sans JP`
- KO: `Noto Sans KR`
- ZH-CN: `Noto Sans SC`
- ZH-TW: `Noto Sans TC`
- AR: `Noto Sans Arabic` + `dir="rtl"`
- HI: `Noto Sans Devanagari`
- RU: `Noto Sans` Cyrillic Subset

CSS pro Sprache:
```css
@font-face { font-family: 'Outfit', 'Noto Sans JP', sans-serif; }  /* JA-Pages */
```

---

## 🔗 SHARING-BUTTONS (lokal-spezifisch)

Aktuell: Generic-Web-Share-API. Sollte pro Markt nativen Sharing-Button haben.

| Markt | Sharing-Button (Pflicht) |
|---|---|
| DE | WhatsApp, Telegram |
| EN-US/UK/AU/CA | Twitter/X, WhatsApp |
| EN-IN | WhatsApp, Telegram (>95% IN) |
| JA | LINE, Twitter/X |
| KO | KakaoTalk (>90% Penetration!), LINE |
| PT-BR | WhatsApp (>95%) |
| TR | WhatsApp, Twitter/X |
| ES-MX | WhatsApp (>95%) |
| ID | WhatsApp, TikTok |
| AR | Snapchat (KSA-Top!), WhatsApp |
| FR | WhatsApp, Twitter/X, Mastodon |
| IT | WhatsApp |
| RU | VKontakte, Telegram |
| ZH-CN | WeChat (Diaspora) |
| ZH-TW | LINE (TW: 90%), WhatsApp (HK) |
| HI | WhatsApp, Telegram, ShareChat |

Skript: `docs/_apply_sharing_buttons.py`

---

## 🌍 hreflang Region-Variants

Aktuell: Generic Sprach-Variants. Phase 0 sollte ergänzen:

| Generic | Region-Variants nötig (Tier-1+2) |
|---|---|
| `en` | `en` (Default) + `en-IN` (NEU für Indien Tier-1) |
| `pt` | `pt-BR` (Default) + `pt-PT` (Tier 2 später) |
| `es` | `es-MX` (Default) + `es-ES` (Tier 2 später) |
| `zh` | `zh-CN` (Simplified) + `zh-TW` (Traditional) |
| `ar` | `ar` (Default) + `ar-SA` Tier 3 |
| `fr` | `fr` (Default), `fr-CA` Tier 3 |

NICHT splitten:
- `de` (DACH-Sprache einheitlich genug)
- `it`, `tr`, `ja`, `ko`, `id`, `hi`, `ru` (sprachlich monolithisch in Marktrelevanz)

Skript: `docs/_apply_hreflang_v2.py`

---

## 💰 PAYMENT-PROVIDER-INTEGRATION (für IAP, falls aktiviert)

Pro Markt zwingend für IAP-Conversion:

| Markt | Payment-Mainstream |
|---|---|
| DE | PayPal, SEPA, Klarna |
| US | Apple Pay, Google Pay, Credit Card |
| JP | Apple Pay, PayPay, LINE Pay, Rakuten Pay |
| KR | KakaoPay, NaverPay, Toss |
| BR | **PIX (40% höhere Conversion!)**, Boleto |
| TR | iyzico, PayTR, Apple Pay |
| MX | OXXO Pay, MercadoPago, PayPal |
| EN-IN/HI | **UPI (Google Pay India, PhonePe, Paytm)**, Razorpay |
| ID | GoPay, OVO, Dana, ShopeePay |
| AR | STC Pay, Mada, Tabby, Tamara, Apple Pay |
| FR | PayPal, Apple Pay, Klarna FR |
| IT | PayPal, Satispay, Apple Pay |
| RU | YooMoney, СБП, МИР (PayPal blockiert) |
| ZH-CN | WeChat Pay, Alipay (nur über CN-Lizenz möglich) |
| ZH-TW | LINE Pay, JKO Pay |

**Strategische Entscheidung:** Mit Cosmetic-IAP-Modell (User-Vorschlag) sind alle diese Provider zu integrieren — sehr komplex. Empfehlung: **Stripe + Apple Pay + Google Pay** als Phase-1, regional-spezifische Provider Phase 2.

---

## 📋 USER-ENTSCHEIDUNGS-CHECKLISTE vor Phase 4

| # | Frage | Empfehlung |
|---|---|---|
| 1 | Pricing-Modell final? | Cosmetics-Only IAP (Fortnite-Modell) basierend auf Recherche |
| 2 | RU-Strategie: aktiv vs Diaspora-First? | **Diaspora-First** (Sanktions-sicher) |
| 3 | ZH-CN-Strategie: aktiv vs Diaspora-First? | **Diaspora-First** (User-Wunsch keine ICP) |
| 4 | iOS-Launch-Datum? | Beeinflusst US-/JP-Strategie kritisch |
| 5 | Saudi-Niantic-Hook für Tier-1 ausrollen? | **JA** — Privacy-USP-Gold |
| 6 | Region-Variants jetzt oder später? | **Jetzt** für PT-BR + ES-MX + ZH-CN/TW + EN-IN |
| 7 | DSGVO-Email-Backup für Tester? | Notfall-Skript vorbereiten |
| 8 | Anwalts-Review für Sanktions-Risiko (RU)? | **Empfohlen** vor RU-Marketing |

---

## ✅ Phase-0-Checkliste (vor Phase 4)

Diese Skripte müssen geschrieben + ausgeführt sein, bevor Phase 4 startet:

- [ ] `docs/_apply_pt_split.py` (PT → PT-BR + PT-PT)
- [ ] `docs/_apply_es_split.py` (ES → ES-MX + ES-ES)
- [ ] `docs/_apply_zh_split.py` (ZH → ZH-CN + ZH-TW)
- [ ] `docs/_apply_id_create.py` (Indonesien komplett neu)
- [ ] `docs/_apply_en_in_create.py` (EN-IN als Variante)
- [ ] `docs/_apply_review_translations.py` (`inLanguage` + `translationOfWork`)
- [ ] `docs/_apply_definedtermset.py` (Brand-Vokabular pro Sprache)
- [ ] `docs/_apply_pill_label.py` (Beta-Pill auf Tester-Cards)
- [ ] `docs/_apply_fonts_preload.py` (Noto Sans pro Sprache)
- [ ] `docs/_apply_sharing_buttons.py` (lokale Buttons pro Markt)
- [ ] `docs/_apply_hreflang_v2.py` (Region-Variants)

→ **`00_MASTER_OVERVIEW.md` enthält den Sprint-Plan dafür.**

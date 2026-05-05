# SEO-Marathon — Session-Status (Phase 1 ABGESCHLOSSEN)

**Letzte Session:** 2026-05-05
**Status:** ✅ Phase 1 komplett, **alles LIVE auf https://mapraiders.com**
**Aktiver Branch:** `master` (phase-marathon merged + gepusht)

---

## ✅ ABGESCHLOSSEN — Phase 1 (240 Killer-URLs)

### Sessions

| Session | Sprachen | Pages | Commit |
|---|---|---|---|
| **1** | DE, EN | 30 | `ad3623f` |
| **2** | JA, KO, PT-BR, TR | 60 | `d597510` |
| **3** | ES-MX, EN-IN, ID, AR | 60 | `0f2e098` |
| **4** | FR, IT, ZH-TW, HI | 60 | `c5c49bf` |
| **5** | RU, ZH-CN | 30 | `3ff9032` |
| **Final-Merge** | → master | — | `b83d66f` |
| **Sitemap-Phase1** | + GSC-Submission-Liste | — | `f9f149c` |

### Inventar Live

- **240 Killer-URLs** = 7 Killer + 7 Twins + 1 Hub × 16 Sprachen
- **Schema-Stack komplett** pro Page: WebPage + BreadcrumbList + MobileApplication+Offers+AggregateRating + Organization + Person + Review × 3 + FAQPage + DefinedTermSet + ItemList (Hub)
- **Translation-Chain:** alle 240 → DE-Original via `translationOfWork`
- **hreflang:** 16 Sprachen + x-default auf jeder Page
- **Founder-Block + 3 Tester-Cards** (Ron C. / Vivian N. / Aljoscha P., Pill-Label lokalisiert)
- **Lang-Switcher** in Nav mit 13+ Sprachen
- **Lokale Sharing-Buttons** pro Markt: WhatsApp (DE/PT-BR/ES-MX/IT/FR/ID/AR/HI), Telegram (RU primär), VK (RU), KakaoStory (KO), LINE (ZH-TW), 微信/微博/QQ (ZH-CN), Mastodon (FR), ShareChat (HI)

### Generator-Skripte

```
docs/_build_phase1_de.py     docs/_build_phase1_en.py
docs/_build_phase1_ja.py     docs/_build_phase1_ko.py
docs/_build_phase1_ptbr.py   docs/_build_phase1_tr.py
docs/_build_phase1_esmx.py   docs/_build_phase1_enin.py
docs/_build_phase1_id.py     docs/_build_phase1_ar.py
docs/_build_phase1_fr.py     docs/_build_phase1_it.py
docs/_build_phase1_zhtw.py   docs/_build_phase1_hi.py
docs/_build_phase1_ru.py     docs/_build_phase1_zhcn.py
docs/_gen_sitemap_phase1.py
```

Alle idempotent — re-runnable. Pro Sprache eine Daten-Struktur (URLs/Trigger/FAQ/Tester/Founder), zentrale Template-/Schema-/Renderer-Funktionen.

### Markt-Hooks Highlights

- **DE:** Saudi-PIF-Frame stark (DSGVO-Bewusstsein), Schnitzeljagd-Cultural-Anchor (Actionbound-Hijack)
- **EN:** Niantic-Refugee-Frame, Zenly-Vakuum-Hijack, Listicle-Position auf "games like pokemon go"
- **JA:** DQW-Komplement, kein Saudi-Bashing (JP-Polite-Tone)
- **KO:** KakaoStory-Sharing, 무과금-Frame
- **PT-BR:** Anti-Fake-GPS K4 (BR-EXKLUSIV), MX-Vokabular-Trennung
- **TR:** Anti-Fake-GPS K4 (TR-EXKLUSIV), KVKK-Frame, WhatsApp-Native
- **ES-MX:** K7 colonia (MX-EXKLUSIV, NICHT vecindario), Día-de-Muertos respektvoll
- **EN-IN:** UK-Spelling, K4 low-end-android + K7 cricket-fan-map (IN-EXKLUSIV), Hindi-Code-Switching
- **ID:** K4 Koin-Jagat-Alternative + K7 Ramadan (ID-EXKLUSIV), Mecca/Medina-Filter, echte Bahasa-Content
- **AR:** RTL-Layout, K3 Mukamil-Frame statt Saudi-Bashing (PIF-Acquisition!), K4 Ramadan + K7 Vision-2030 (AR-EXKLUSIV)
- **FR:** K4 Saudi-Frame + K7 Woog-Hijack (Woog fermé 2018, FR-EXKLUSIV), CNIL/RGPD, Mastodon-Sharing
- **IT:** K4 Saudi + K6 Caccia-Volume-King (6-10K) + K7 GaiaSmart-Komplement, Familien-Frame
- **ZH-TW:** Traditional-Body via dedizierter Build (kein zhconv-Skelett), K4 沙特問題 (Demokratie-Differenzierung), K5 夜市 + K7 香港行山 (HK-EXKLUSIV mit HK-Code-Switching), LINE
- **HI:** Devanagari + Hinglish, K4 Mohalla-Cultural-Hook + K7 Cricket-IPL (HI-EXKLUSIV), Noto Sans Devanagari, ShareChat
- **RU:** Sanktions-aware, K3 Refugee-Frame + K4 Draconius-Komplement (RU-EXKLUSIV), Telegram dominant
- **ZH-CN:** Mainland-sensitive (KEIN Saudi/Hong-Kong/Anti-Authoritarian), K4 Anti-VPN technisch + K7 Tencent-Komplement (CN-EXKLUSIV), 微信 + 微博 + QQ

---

## 🚧 OFFENE Folge-Aufgaben (nicht-blockierend)

### 1. Founder-Foto upload (kritisch für UX)

`/assets/founder-rene-scafarti.jpg` wird auf 240 Pages referenziert — Datei existiert noch nicht. Upload via SSH:

```bash
scp founder.jpg root@159.69.157.42:/opt/mapraiders/docs/assets/founder-rene-scafarti.jpg
```

Format: 256×256 oder 512×512 quadratisch, JPG, < 100 KB.

### 2. GSC + Bing Webmaster Tools

Submission-Liste: `seo-strategy/GSC_SUBMISSION_LIST.md`

```
https://mapraiders.com/sitemap-index.xml   ← einreichen in beiden
```

Tag-1-Priority: 10 Volume-Kings (Tag 1), 10 Tier-2 (Tag 2), Rest organisch.

### 3. Stale-Sitemap-Cleanup (low priority)

`sitemap-de.xml`/`sitemap-pt.xml`/`sitemap-zh.xml`/`sitemap-es.xml` zeigen noch auf Pre-Marathon-Pfade. Nicht blockierend (Phase-1-Sitemap deckt alle 240 neue Pages ab), aber Wartungs-Task.

### 4. Decision-Points (Marketing-Brief, nicht Engineering)

- Pricing-Modell final pro Markt
- iOS-Launch-Datum (aktuell "Q3 2026" in FAQ-Antworten)
- RU-Sanktions-Anwalt-Review vor RU-Marketing
- Reddit-Founder-Outreach pro Sprache
- Discord-Pokémon-GO-Refugees-Outreach pro Sprache

---

## 📊 Erfolgs-Metriken (6-Monats-Ziele)

| Metrik | Tier 1 (DE/EN/JA/KO/PT-BR/TR) | Tier 2 (ES-MX/EN-IN/ID/AR/FR/IT/ZH-TW/HI) | Tier 3 (RU/ZH-CN) |
|---|---|---|---|
| Top-3 Rankings | 3+ Killer-Keywords | 1+ | 0 (passiv) |
| Top-10 Rankings | 5-7 Killer | 3-5 | 1-2 |
| Organischer Traffic | +800-1500% | +500-800% | +100-300% |
| App-Downloads | +300% | +200% | +50% |
| Schema-Sterne in SERPs | alle Killer | 5+ Killer | Hub |

---

## 🚀 Deploy-Infrastruktur

- **GitHub Repo:** https://github.com/scafa-assistant/mapraiders
- **Live-Domain:** https://mapraiders.com (Hetzner-VPS zoro 159.69.157.42)
- **Auto-Deploy:** GitHub Action `deploy.yml` triggert auf push to master mit `docs/`-Änderung
- **SSH-Deploy-Path:** `/opt/mapraiders/` (Web-Root: `/opt/mapraiders/docs/`)
- **Deploy-Time:** ~13s

---

## 💬 Trigger für nächste Session

| Trigger | Was passiert |
|---|---|
| "Mach Founder-Foto" | Foto upload via SSH zu Hetzner + verify |
| "Sitemap-Cleanup" | stale Sprach-Sitemaps regenerieren |
| "Stand checken" | Rankings-Pull aus Search Console (manuell, dann analysieren) |
| "Phase 2" | Sub-Pages: City-Pages (Berlin/Mumbai/Tokyo), Niche-Pages, Cluster-Expansion |
| "Pricing finalisieren" | Decision-Point durchgehen, Pricing-Pages bauen |

---

**Wichtig:** Branch `phase-marathon` ist nach Final-Merge **nicht mehr aktiv**. Alle Folge-Arbeiten direkt auf master oder neue Feature-Branches.

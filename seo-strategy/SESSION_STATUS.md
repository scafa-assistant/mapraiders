# SEO-Marathon — Session-Status (Phase 1 + Humanize-Pass ABGESCHLOSSEN)

**Letzte Session:** 2026-05-06
**Status:** ✅ Phase 1 komplett + Humanize-Pass durch, **alles LIVE auf https://mapraiders.com**
**Aktiver Branch:** `master`

---

## ✅ ABGESCHLOSSEN — Phase 1 (240 Killer-URLs) + Humanize-Pass

### Sessions Phase 1 Build

| Session | Sprachen | Pages | Commit |
|---|---|---|---|
| **1** | DE, EN | 30 | `ad3623f` |
| **2** | JA, KO, PT-BR, TR | 60 | `d597510` |
| **3** | ES-MX, EN-IN, ID, AR | 60 | `0f2e098` |
| **4** | FR, IT, ZH-TW, HI | 60 | `c5c49bf` |
| **5** | RU, ZH-CN | 30 | `3ff9032` |
| **Final-Merge** | → master | — | `b83d66f` |
| **Sitemap-Phase1** | + GSC-Submission-Liste | — | `f9f149c` |

### Sessions Humanize-Pass (2026-05-06)

| Phase | Was | Commit |
|---|---|---|
| **DE-Humanize** | DE per Hand durchgeschrieben (Tone-Anker) | `4fbbdd5` |
| **15-Sprach-Humanize** | EN/JA/KO/PT-BR + 11 weitere via Sub-Agents | `764e5b0` |
| **Deploy-Härtung** | UTF-8 Locale + CJK-Defensive in deploy.yml | `45cd747` → `03de1a8` |

### Inventar Live

- **240 Killer-URLs** = 7 Killer + 7 Twins + 1 Hub × 16 Sprachen
- **Schema-Stack komplett** pro Page: WebPage + BreadcrumbList + MobileApplication+Offers+AggregateRating + Organization + Person + Review × 3 + FAQPage + DefinedTermSet + ItemList (Hub)
- **Translation-Chain:** alle 240 → DE-Original via `translationOfWork`
- **hreflang:** 16 Sprachen + x-default auf jeder Page
- **Founder-Block + 3 Tester-Cards** (Ron C. / Vivian N. / Aljoscha P., Pill-Label lokalisiert)
- **Lang-Switcher** in Nav mit 13+ Sprachen
- **Lokale Sharing-Buttons** pro Markt: WhatsApp/Telegram/LINE/KakaoStory/Mastodon/微信/微博/QQ/ShareChat/VK
- **Humanize:** 0 em-dashes auf allen 240 Pages (vorher ~2400 total). Tester-Quotes konkret + persönlich, Founder-Quote als Geschichte, Marketing-Stakkato aufgelöst.

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

- **DE:** Saudi-PIF-Frame (DSGVO-Bewusstsein), Schnitzeljagd-Cultural-Anchor (Actionbound-Hijack)
- **EN:** Niantic-Refugee-Frame, Zenly-Vakuum-Hijack, "games like pokemon go" Listicle-Position
- **JA:** DQW-Komplement, kein Saudi-Bashing (JP-Polite-Tone), 位置情報ゲーム-Keyword
- **KO:** KakaoStory-Sharing, 무과금-Frame
- **PT-BR:** Anti-Fake-GPS K4 (BR-EXKLUSIV), MX-Vokabular-Trennung (bairro NICHT colonia)
- **TR:** Anti-Fake-GPS K4 (TR-EXKLUSIV), KVKK-Frame, WhatsApp-Native
- **ES-MX:** K7 colonia (MX-EXKLUSIV, NICHT vecindario), Día-de-Muertos respektvoll, "celular"/"pasear al perro"
- **EN-IN:** UK-Spelling, K4 low-end-android + K7 cricket-fan-map (IN-EXKLUSIV), Hindi-Code-Switching
- **ID:** K4 Koin-Jagat-Alternative + K7 Ramadan, Mecca/Medina-Filter explizit, "menjaga adab"-Tone
- **AR:** RTL-Layout, K3 Mukamil-Frame statt Saudi-Bashing (PIF-Acquisition), K7 Vision-2030 (AR-EXKLUSIV, pro-Zukunft)
- **FR:** K4 Saudi-Frame + K7 Woog-Hijack (Woog fermé 2018), CNIL/RGPD mit konkreten Fällen, Mastodon-Sharing
- **IT:** K6 Caccia-al-tesoro Volume-King (6-10K, 16× im Hub) + K7 GaiaSmart-Komplement
- **ZH-TW:** Traditional-Body, K4 沙特問題 (Demokratie-Differenzierung), K5 夜市 + K7 香港行山 (HK-EXKLUSIV mit 粵語-Code-Switching), LINE
- **HI:** Devanagari + Hinglish, K4 Mohalla-Cultural-Hook + K7 Cricket-IPL (alle 7 IPL-Stadien), ShareChat
- **RU:** Sanktions-aware, K3 Refugee-Frame + K4 Draconius-Komplement, Telegram dominant
- **ZH-CN:** Mainland-sensitive (KEIN Saudi/Hong-Kong/Anti-Authoritarian), K4 Anti-VPN technisch + K7 Tencent-Komplement, 微信 + 微博 + QQ

### Humanize-Bilanz pro Sprache

| Sprache | Em-Dashes vorher | Nachher | Highlight |
|---|---|---|---|
| DE | 162 | 0 | Hand-Edit als Tone-Anker |
| EN | 167 | 0 | Humanizer-Skill-Audit-Pass |
| JA | 85 | 0 | Saudi neutral, polite (です/ます) |
| KO | 144 | 0 | 무과금-Frame erhalten, Polite-Register |
| PT-BR | 153 | 0 | Anti-Fake-GPS K4 erhalten |
| TR | 137 | 0 | KVKK + Anti-Fake-GPS, Saudi sachlich |
| ES-MX | 154 | 0 | "colonia" 37× in K7, MX-Vokabular |
| EN-IN | 182 | 0 | UK-Spelling, Cricket-IPL, Mohalla |
| ID | 166 | 0 | Mecca/Medina-Filter NEU, Ramadan |
| AR | 100 | 0 | Mukamil-Frame (kein Saudi-Bashing), Vision-2030 |
| FR | 177 | 0 | Woog-Hook + CNIL/RGPD |
| IT | 150 | 0 | Caccia-al-tesoro 16×, GaiaSmart-Komplement |
| ZH-TW | 108 | 0 | Traditional, 夜市, 香港行山 mit 粵語 |
| HI | 103 | 0 | Devanagari + Hinglish, Mohalla, Cricket |
| RU | 213 | 0 | Refugee-Frame, Draconius-Komplement |
| ZH-CN | 100 | 0 | 0 Saudi-Erwähnungen, Anti-VPN, Tencent |
| **Total** | **~2400** | **0** | |

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
- **CJK-Defensive:** UTF-8 Locale + `find -delete + git checkout HEAD --` für non-ASCII-Subdirs (gegen NFC/NFD-Encoding-Mismatch)

### Wichtig für CJK-URL-Tests

curl mit raw UTF-8 (`curl "https://mapraiders.com/ja/位置情報ゲーム.html"`) wird auf nginx-`index.html` zurückgemappt → falscher Content-Length (62757 statt 38670). **Echte Browser percent-encoden URLs automatisch** und kriegen die korrekte Datei. Bei Tests immer percent-encoded URLs verwenden:

```bash
curl -s "https://mapraiders.com/ja/%E4%BD%8D%E7%BD%AE%E6%83%85%E5%A0%B1%E3%82%B2%E3%83%BC%E3%83%A0.html"
```

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

## 📝 Lessons Learned

- **Quality-First-Ansatz funktioniert:** Variante B (Content-Tiefe) statt sofort live, dann Humanize-Pass nach User-Feedback ("AI-Tells erkennbar")
- **DE als Tone-Anker:** Hand-Edit zuerst, dann 15 Sprachen via Sub-Agents mit DE als Referenz + sprachspezifischen Cultural-Anchors
- **Sub-Agent-Briefe:** Klar strukturiert mit Anti-Pattern-Liste, Tone-Beispielen, sprachspezifischen Hooks → 100% Erfolgsrate Wave 1-4 (15/15)
- **Humanizer-Skill (github.com/blader/humanizer):** Wertvoll für englische AI-Tells als Audit-Pass, nicht für andere Sprachen
- **CJK-Filename-Deploy:** UTF-8 Locale + force-checkout auf Server nötig gegen NFC/NFD-Mismatch
- **CJK-URL-Testing:** curl raw UTF-8 ≠ Browser-Verhalten, immer percent-encoded URLs in Tests verwenden

---

**Wichtig:** Branch `phase-marathon` ist nach Final-Merge **nicht mehr aktiv**. Alle Folge-Arbeiten direkt auf master oder neue Feature-Branches.

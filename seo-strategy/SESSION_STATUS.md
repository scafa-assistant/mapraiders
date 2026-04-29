# SEO-Marathon — Session-Status & Wieder-Anfangs-Anleitung

**Letzte Session:** 2026-04-29
**Aktueller Branch:** `phase-marathon` (NICHT zu master gemergt — wartet auf Phase 1)
**Live-Site-Stand:** master (Phase 0a + 0b + PT-Split-Pilot)

---

## ✅ ABGESCHLOSSEN

### Phase 1-3 (Recherche + Strategie)
- 16 Phase-2-Keyword-Recherche-Berichte (~470 KB)
- 16 Phase-4-Final-Master-Plans (~7.580 Zeilen, alle 16 Sprachen)
- `01_URL_MASTER_LIST.md` mit allen 240 Killer-URLs

### Phase 0a — Schema-Erweiterungen (LIVE auf master)
- `_apply_review_translations.py` — `inLanguage` + `translationOfWork` (288 Pages)
- `_apply_pill_label.py` — Pill-Label "From the closed beta" / lokalisiert (288 Pages)
- `_apply_definedtermset.py` — Brand-Vokabular pro Sprache (288 Pages)

### Phase 0b — Tech-Erweiterungen (LIVE auf master)
- `_apply_fonts_preload.py` — Noto Sans pro Sprache (204 Pages)
- `_apply_sharing_buttons.py` — WhatsApp/LINE/KakaoTalk/Snapchat/VK lokalisiert (288 Pages)
- `_apply_hreflang_v2.py` — hreflang-Audit (115 Pages ergänzt)
- `_apply_remove_review.py` — Notfall-Tester-Widerruf (CLI-Tool, nicht ausgeführt)

### CI/CD — Auto-Deploy (LIVE)
- `.github/workflows/deploy.yml` — Auto-Deploy nach push auf master mit `docs/`-Änderung
- Hetzner-VPS zoro (159.69.157.42), Repo `/opt/mapraiders`
- 5 Secrets im GitHub-Repo: HETZNER_HOST/USER/PORT/SSH_KEY/DEPLOY_PATH
- Deploy-Key in `~/.ssh/mapraiders-deploy/deploy_key` (lokal) + `/root/.ssh/authorized_keys` (Server)

### Phase 0c — Sprach-Migrations (auf Branch `phase-marathon`, NICHT live!)
- **PT-Split** (LIVE seit Commit 290559c): `/pt/` → `/pt-br/`, 28 Pages + 28 Stubs
- **ES-Split** (Branch only): `/es/` → `/es-mx/`, 28 Pages + 28 Stubs
- **ZH-Split** (Branch only): `/zh/` → `/zh-cn/` (40 Pages) + `/zh-tw/` NEU (40 Pages mit Traditional via zhconv) + 40 Stubs
- **EN-IN-Create** (Branch only): `/en-in/` parallel zu `/en/`, 31 Pages mit UK-Spelling, 450 hreflang-Updates
- **ID-Create** (Branch only): `/id/` Skelett aus `/en/`, 31 Pages, **echte Bahasa-Content kommt in Phase 1**

**Inventar aktuell:**
- Total HTML: 608 Files (vorher 410)
- Branch online: https://github.com/scafa-assistant/mapraiders/tree/phase-marathon

---

## 🚧 OFFEN — Phase 1: 240 Killer-URLs mit Content

**Was es ist:** Pro Sprache 15 echte Pages mit lokalisiertem Content gemäß den Final-Master-Plans. Total 16 × 15 = 240 Pages.

**Pro Killer-Page (1 von 7):**
- Title (60 chars / CJK 30-35), Meta (155 chars), H1, Trigger-Satz
- 8 Sektionen Body (Hero, Definition, Vergleich-Tabelle, Persona, Tester, Founder, FAQ, CTA)
- 5 lokalisierte FAQ-Antworten (FAQPage Schema)
- 5 Internal Links mit Killer-Anchor-Text
- Vollständiger Schema-Stack (MobileApplication + Review × 3 + AggregateRating + Person + Organization + DefinedTermSet + BreadcrumbList)

**Pro Twin-Page (1 von 7):** Kürzere Page, AggregateRating + 3 Tester-Cards fokussiert.

**Hub-Page (1):** Sammelseite mit allen 14 Killer + Twins.

### Realistischer Phase-1-Plan (5 Sessions)

| Session | Sprachen | Markt-Tier | Aufwand |
|---|---|---|---|
| **1** | DE, EN | 1+1 (Heimat + Volumen-King) | ~4h |
| **2** | JA, KO, PT-BR, TR | 1×4 (Tier-1 Rest) | ~5h |
| **3** | ES-MX, EN-IN, ID, AR | 2×4 (Tier-2 Rest) | ~4h |
| **4** | FR, IT, ZH-TW, HI | 2×4 (Tier-2 EU+ASIA) | ~4h |
| **5** | RU, ZH-CN | 3×2 (Diaspora) | ~2h |

**Total ~19h Content-Engineering.** Spec-Material liegt vor in den 16 `02_*_FINAL_MASTER_PLAN.md`-Dateien.

---

## 🔄 So startest du nächste Session

### 1) Branch wieder aufnehmen
```bash
cd C:\Users\r.scafarti\Desktop\MapRaiders
git checkout phase-marathon
git pull
```

### 2) Status verifizieren
```bash
git log --oneline -5  # letzte 5 Commits
ls docs/pt-br docs/es-mx docs/zh-cn docs/zh-tw docs/en-in docs/id  # alle 6 Migrationen sollten existieren
```

### 3) Phase 1 starten — Erste Sprache: DE

**Spec:** `seo-strategy/implementation/02_DE_FINAL_MASTER_PLAN.md` (56 KB, alle Strings lokalisiert)

**Pages zu bauen (15):**
- 7 Killer-URLs:
  - `/spiele-wie-pokemon-go.html` (4-6K Volumen)
  - `/pokemon-go-alternative-kostenlos.html` (800-1.3K)
  - `/territorium-spiel.html` (existiert — erweitern)
  - `/standort-spiel.html` (existiert — erweitern)
  - `/gps-spiel-deutschland.html` (NEU)
  - `/schnitzeljagd-app.html` (NEU)
  - `/handyspiel-zum-laufen.html` (NEU)
- 7 Erfahrungs-Twins (`-erfahrungen.html`)
- 1 Hub: `/mapraiders-erfahrungen.html`

### 4) Reihenfolge nach Master Overview

DE → EN → JA → KO → PT-BR → TR → ES-MX → EN-IN → ID → AR → FR → IT → ZH-TW → HI → RU → ZH-CN

### 5) Live-Push

**NICHT mergen vor Phase 1 fertig!** Erst wenn alle 240 Pages stehen:
```bash
git checkout master
git merge phase-marathon
git push
# Auto-Deploy triggert → ~30 Sekunden bis Live
```

---

## 🔧 Verfügbare Skripte

```
docs/_apply_review_translations.py   # Phase 0a (idempotent)
docs/_apply_pill_label.py             # Phase 0a (idempotent)
docs/_apply_definedtermset.py         # Phase 0a (idempotent)
docs/_apply_fonts_preload.py          # Phase 0b (idempotent)
docs/_apply_sharing_buttons.py        # Phase 0b (idempotent)
docs/_apply_hreflang_v2.py            # Phase 0b (idempotent)
docs/_apply_remove_review.py ron|vivian|aljoscha   # Notfall-Tool

docs/_apply_pt_split.py               # Phase 0c (LIVE)
docs/_apply_es_split.py               # Phase 0c (Branch)
docs/_apply_zh_split.py               # Phase 0c (Branch, braucht zhconv)
docs/_apply_en_in_create.py           # Phase 0c (Branch)
docs/_apply_id_create.py              # Phase 0c (Branch)
```

Alle Skripte sind idempotent (safe to re-run, wird übersprungen wenn schon ausgeführt).

---

## 📦 Deploy-Tools-Snapshot

- **GitHub Repo:** https://github.com/scafa-assistant/mapraiders
- **Live-Domain:** https://mapraiders.com (Hetzner-VPS zoro)
- **Auto-Deploy:** GitHub Action triggert auf push to master mit docs/-Änderung
- **Deploy-Key:** `~/.ssh/mapraiders-deploy/deploy_key` (lokal) + `/root/.ssh/authorized_keys` (zoro)
- **Deploy-Path auf Server:** `/opt/mapraiders/` (Web-Root: `/opt/mapraiders/docs/`)
- **nginx-Config:** `/etc/nginx/sites-enabled/mapraiders`

---

## ⚠️ Offene Decision-Points (User)

Aus den Final-Master-Plans noch zu entscheiden:

1. **Pricing-Modell** (Cosmetic-IAP $1.99-9.99 + Sub $4.99/mo + Lifetime $99) — pro Markt anpassbar
2. **iOS-Launch-Datum** für FAQ-Antworten (aktuell "Q3 2026")
3. **RU-Sanktions-Anwalt-Review** vor RU-Marketing
4. **Saudi-Hook-Aggressivität** (auf 4 von 7 Pages aktuell)
5. **Founder-Foto-Asset** (`/assets/founder-rene-scafarti.jpg` muss existieren)
6. **Google Search Console Re-Submit** nach Migrations + Phase 1
7. **Pokémon-GO-Refugees-Discord-Outreach** in jeder Sprache

---

## 🎯 Erfolgs-Metriken (6-Monats-Ziele)

| Metrik | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Top-3 Rankings | 3+ Killer-Keywords | 1+ | 0 (passiv) |
| Top-10 Rankings | 5-7 Killer | 3-5 | 1-2 |
| Organischer Traffic | +800-1500% | +500-800% | +100-300% |
| App-Downloads | +300% | +200% | +50% |
| Schema.org-Sterne in SERPs | alle Killer | 5+ Killer | Hub |

---

## 📋 Tasks-Status für nächste Session

| Task | Status |
|---|---|
| Phase 0a (3 Schema-Skripte) | ✅ |
| Phase 0b (4 Tech-Skripte) | ✅ |
| Phase 0c PT-Split (Pilot live) | ✅ |
| Phase 0c ES-Split | ✅ Branch |
| Phase 0c ZH-Split | ✅ Branch |
| Phase 0c EN-IN-Create | ✅ Branch |
| Phase 0c ID-Create | ✅ Branch |
| Auto-Deploy Hetzner | ✅ |
| **Phase 1 — DE Killer-URLs** | ⏳ Session 1 |
| Phase 1 — EN Killer-URLs | ⏳ Session 1 |
| Phase 1 — JA/KO/PT-BR/TR | ⏳ Session 2 |
| Phase 1 — ES-MX/EN-IN/ID/AR | ⏳ Session 3 |
| Phase 1 — FR/IT/ZH-TW/HI | ⏳ Session 4 |
| Phase 1 — RU/ZH-CN | ⏳ Session 5 |
| Final-Merge phase-marathon → master | ⏳ nach Session 5 |

---

## 💬 Bei Wiederaufnahme einfach sagen

> "Mach mit Phase 1 weiter — DE Killer-URLs"

Ich lese diese Datei + den DE Final Master Plan und fang an.

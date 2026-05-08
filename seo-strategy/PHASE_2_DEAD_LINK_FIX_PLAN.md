# Phase 2 — Dead-Link-Fix-Plan (Pages systematisch erstellen)

**Erstellt:** 2026-05-07
**Trigger:** GSC zeigt 298 "gefunden, nicht indexiert" + 1445 Dead-Link-Occurrences im Repo

## Ausgangslage

Nach nginx-Soft-404-Fix + hreflang-Cleanup zeigt Dead-Link-Audit:
- **188 unique broken hrefs** über das Repo
- **1445 Dead-Link-Occurrences** total (Hits über alle Pages)

## Priorisierung nach SEO-Hit + Aufwand

| # | Phase | Kategorie | Hits | Files | Aufwand | Priorität |
|---|---|---|---|---|---|---|
| 1 | **EN Legal-Pages** | terms, privacy, imprint, contact | 726× | 4 | klein | KRITISCH |
| 2 | **Multi-Lang Legal-Pages** | je 4 pro Sprache | ~250× | 60 | mittel (Sub-Agents) | HOCH |
| 3 | **Howto-Sub-Pages** | clans, echos, defense, etc. | ~150× | ~70 | gross | MITTEL |
| 4 | **DE-Niche-Pages** | /de/schnitzeljagd/, /de/laufspiel/, /de/urban-explorer/ | ~25× | 3 | klein | NIEDRIG |
| 5 | **Press/About-Pages** | /press/, /en-in/about/, etc. | ~40× | ~10 | mittel | NIEDRIG |

**Strategie:** Quick-Win EN Legal zuerst (80/20-Regel), dann Multi-Lang via Sub-Agent-Wave, dann Rest organisch.

---

## Phase 2.1 — EN Legal-Pages (Quick-Win)

**Files zu erstellen:**
- `docs/en/terms.html` (Übersetzung von `/agb.html`)
- `docs/en/privacy.html` (Übersetzung von `/datenschutz.html`)
- `docs/en/imprint.html` (Übersetzung von `/impressum.html`)
- `docs/en/contact.html` (Übersetzung von `/kontakt.html`)

**Konventionen (laut globaler CLAUDE.md):**
- Rechtsträger: SCAFA INVESTMENTS LLC, 9830 Bahama Dr, Cutler Bay, FL 33189-1568, US
- Kontakt: info@scafa-investments.com
- Developer: j.scafarti@scafa.de
- Telefon: +491703220161

**Tone:** Professionell, rechtssicher, US-English. Kein Marketing-Tone.

**Styling:** identisch zu existierenden EN-Pages (CSS aus `/en/index.html`).

**hreflang:** Cross-Link zu allen 16 Sprach-Pendants WO existieren (also nach Phase 2.2 nachträglich anreichern).

**Geschätzter Aufwand:** ~30 min selbst geschrieben.

---

## Phase 2.2 — Multi-Lang Legal-Pages

**Sub-Agent-Wave (analog Humanize-Marathon):**

15 Sprachen × 4 Legal-Pages = 60 Files. Pro Sprache ein Sub-Agent.

Slug-Konventionen pro Sprache (Beispiel):
- FR: `/fr/cgu.html`, `/fr/confidentialite.html`, `/fr/mentions-legales.html`, `/fr/contact.html`
- ES-MX: `/es-mx/terminos.html`, `/es-mx/privacidad.html`, `/es-mx/aviso-legal.html`, `/es-mx/contacto.html`
- IT: `/it/termini.html`, `/it/privacy.html`, `/it/note-legali.html`, `/it/contatti.html`
- PT-BR: `/pt-br/termos.html`, `/pt-br/privacidade.html`, `/pt-br/aviso-legal.html`, `/pt-br/contato.html`
- TR: `/tr/sartlar.html`, `/tr/gizlilik.html`, `/tr/kunye.html`, `/tr/iletisim.html`
- RU: `/ru/usloviya.html`, `/ru/konfidentsialnost.html`, `/ru/vyhodnye-dannye.html`, `/ru/kontakt.html`
- JA: `/ja/利用規約.html`, `/ja/プライバシーポリシー.html`, `/ja/特定商取引法.html`, `/ja/お問い合わせ.html`
- KO: `/ko/약관.html`, `/ko/개인정보보호.html`, `/ko/사업자정보.html`, `/ko/문의.html`
- ZH-CN: `/zh-cn/条款.html`, `/zh-cn/隐私.html`, `/zh-cn/版权.html`, `/zh-cn/联系.html`
- ZH-TW: `/zh-tw/條款.html`, `/zh-tw/隱私.html`, `/zh-tw/版權.html`, `/zh-tw/聯絡.html`
- AR: `/ar/الشروط.html`, `/ar/الخصوصية.html`, `/ar/معلومات-قانونية.html`, `/ar/اتصل-بنا.html`
- HI: `/hi/शर्तें.html`, `/hi/गोपनीयता.html`, `/hi/प्रकाशक.html`, `/hi/संपर्क.html`
- ID: `/id/syarat.html`, `/id/privasi.html`, `/id/legal.html`, `/id/kontak.html`
- EN-IN: `/en-in/terms.html`, `/en-in/privacy.html`, `/en-in/imprint.html`, `/en-in/contact.html` (UK-Spelling)

**Wichtig:** vor Erstellen prüfen welche Slugs in Dead-Link-Audit auftauchen (manche Sprachen sind mit anderen Slug-Konventionen verlinkt — die müssen wir matchen).

**Geschätzter Aufwand:** 15 Sub-Agents × ~10 min = parallel 10-15 min Watchdog.

---

## Phase 2.3 — Howto-Sub-Pages

**Pattern:** Jede Sprache hat eine `/howto/` Index-Page die auf Sub-Pages linkt die noch nicht existieren:
- clans, echos, defense-minigames, quests, territories

Pro Sprache 5-6 Sub-Pages × 16 Sprachen = ~96 Files. Niedrigeres SEO-Volumen, aber notwendig für Dead-Link-Cleanup.

**Strategie:** Sub-Agent pro Sprache, Generator-Skript-basiert (Template + Daten).

**Aufwand:** mittel — kann per Skript ähnlich `_build_phase1_*.py` automatisiert werden.

---

## Phase 2.4 — DE-Niche-Pages

**Files:** `/de/schnitzeljagd/`, `/de/laufspiel/`, `/de/urban-explorer/` (jeweils mit `index.html`)

Drei kleine Pages. Niche-Keyword-Hooks. Existieren in anderen Sprachen schon (z.B. `/jogging/`, `/fitness-mmo/`, `/schnitzeljagd/` Pre-Marathon-Pages auf der Wurzel).

Werden vermutlich von hreflang in `/jogging/`, `/fitness-mmo/` etc. erwähnt aber wurden nie als DE-spezifische Pages erstellt.

**Aufwand:** klein, 3 Files schnell.

---

## Phase 2.5 — Press/About-Pages

**Files:** `/press/`, `/en-in/about/`, weitere About-Variants

Niedrige Priorität, niedriger SEO-Wert. Können später nach Stand-checken erstellt werden.

---

## Workflow pro Phase

1. Pages erstellen (selbst oder via Sub-Agent)
2. Re-run `_check_dead_links.py` — Dead-Link-Reduktion verifizieren
3. Re-run `_gen_sitemap.py` — neue Pages in Sitemap
4. Commit + Push
5. Live-Verify (HTTP 200 Stichprobe)

## Erfolgs-Metrik

- **Vorher:** 1445 Dead-Link-Occurrences
- **Nach Phase 2.1:** ~720 (50% Reduktion durch EN Legal)
- **Nach Phase 2.2:** ~470 (weitere 17% Reduktion)
- **Nach Phase 2.3:** ~320 (weitere 10% Reduktion)
- **Nach Phase 2.4 + 2.5:** < 250 (Endstand)

Ziel: Dead-Link-Occurrences unter 100 pro 1000 Pages = saubere Site.

---

## Status-Tracker

| Phase | Status | Commit |
|---|---|---|
| Map-Grid-Fix (Pre-Plan) | ✅ | `44591d9` |
| 2.1 EN Legal-Pages | 🚧 in progress | — |
| 2.2 Multi-Lang Legal | ⏸ pending | — |
| 2.3 Howto-Sub-Pages | ⏸ pending | — |
| 2.4 DE-Niche-Pages | ⏸ pending | — |
| 2.5 Press/About | ⏸ pending | — |

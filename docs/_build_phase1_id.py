#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 — Bahasa Indonesia (ID) Killer-URL Builder
Generates 15 ID pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_ID_FINAL_MASTER_PLAN.md.

Output: docs/id/
Run: py docs/_build_phase1_id.py
Idempotent: overwrites existing files.
"""

import json
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
OUT_DIR = DOCS / "id"
SITE = "https://mapraiders.com"
LANG = "id"

# Hreflang map — 16 languages + x-default
HREFLANG = [
    ("de", "/"),
    ("en", "/en/"),
    ("fr", "/fr/"),
    ("es", "/es-mx/"),
    ("it", "/it/"),
    ("pt-BR", "/pt-br/"),
    ("tr", "/tr/"),
    ("ru", "/ru/"),
    ("ja", "/ja/"),
    ("ko", "/ko/"),
    ("zh", "/zh-cn/"),
    ("ar", "/ar/"),
    ("hi", "/hi/"),
    ("id", "/id/"),
    ("en-IN", "/en-in/"),
]

LANG_SWITCHER = [
    ("Deutsch", "de", "/"),
    ("English", "en", "/en/"),
    ("Français", "fr", "/fr/"),
    ("Español", "es", "/es-mx/"),
    ("Italiano", "it", "/it/"),
    ("Português (BR)", "pt-BR", "/pt-br/"),
    ("Türkçe", "tr", "/tr/"),
    ("Русский", "ru", "/ru/"),
    ("日本語", "ja", "/ja/"),
    ("한국어", "ko", "/ko/"),
    ("中文", "zh", "/zh-cn/"),
    ("العربية", "ar", "/ar/"),
    ("हिन्दी", "hi", "/hi/"),
    ("Bahasa Indonesia", "id", "/id/"),
]

# -----------------------------------------------------------------------------
# REUSABLE BLOCKS — Bahasa Indonesia
# -----------------------------------------------------------------------------

# Beta-Tester data (Bahasa-translated quotes per Master-Plan §1.2)
TESTER_RON = {
    "name": "Ron C.",
    "role": "Pemilik anjing · wilayah Stuttgart",
    "role_long": "Pemilik anjing dari wilayah Stuttgart (beta tertutup)",
    "quote": "Anjingku menyukai jalan-jalannya — dan aku menyukai bahwa setiap jalan-jalan membuat lingkunganku lebih terlihat di peta. Aku sudah menaklukkan seluruh jalanku.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "Pelari · wilayah Hamburg",
    "role_long": "Pelari dari wilayah Hamburg (beta tertutup)",
    "quote": "Saya tetap lari setiap pagi. Dengan MapRaiders setiap rute punya tujuan: menjaga wilayah atau merebutnya kembali. Motivasi kardio saya meledak.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "Penjelajah kota · wilayah Berlin",
    "role_long": "Penjelajah kota dari wilayah Berlin (beta tertutup)",
    "quote": "Meninggalkan Echo dan melihat siapa yang menemukannya seperti perburuan harta karun terbuka di seluruh kota.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder Quote ID (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "Saya adalah salah satu pemain Pokémon GO yang frustrasi. Saya ingin wilayah nyata, bukan "
    "tangkapan gym yang sesaat. Saya tidak ingin langkah saya dijual kepada dana kekayaan Saudi, "
    "tidak ada model iklan, tidak ada langganan premium wajib. Jadi saya membangun MapRaiders. "
    "Ini adalah lapangan rumah saya — dan akan menjadi milikmu."
)

# Pricing offers (IDR — Master-Plan §1.1)
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0", "currency": "IDR"},
    {"name": "Cosmetic-IAP mulai dari", "price": "15000", "currency": "IDR"},
    {"name": "MapRaiders Pendukung (Sub)", "price": "49000", "currency": "IDR"},
    {"name": "Pendukung Seumur Hidup", "price": "1499000", "currency": "IDR"},
]

# DefinedTermSet ID (Master-Plan §8)
DEFINED_TERMS = [
    ("Wilayah", "Area yang ditaklukkan di peta permainan, secara persisten ditugaskan kepada pemain atau klan"),
    ("Echo (Gema)", "Sinyal audio, foto, atau video yang ditinggalkan oleh pemain di lokasi nyata, yang dapat ditemukan oleh pemain lain"),
    ("Mini-game pertahanan", "Mini-game (tic-tac-toe, batu-gunting-kertas, mini-catur) yang dipicu saat pertahanan atau penaklukan wilayah"),
    ("Misi", "Mini-tugas yang dibuat pemain yang dapat diselesaikan oleh pemain lain di dunia nyata"),
    ("Klan", "Kelompok pemain yang terbentuk secara organik yang mempertahankan dan menjaga wilayah bersama"),
    ("Lingkungan", "Tetangga geografis di sekitar pemain yang membentuk inti dari wilayah pribadi"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """Generate hreflang tags. slug is e.g. '/id/permainan-teritori.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "id":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="id"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">Dari beta tertutup</div>
        <div class="fr-stars">★★★★★</div>
        <div class="fr-quote">{tester['quote']}</div>
        <div class="fr-author">{tester['name']}</div>
        <div class="fr-role">{tester['role']}</div>
      </div>"""


def testers_section_html(testers):
    cards = "\n".join(tester_card_html(t) for t in testers)
    return f"""<!-- BETA-TESTER + FOUNDER -->
<style>
.fr-pill{{display:inline-block;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--accent);background:rgba(0,0,0,0.04);border:1px solid var(--border);padding:4px 10px;border-radius:99px;margin-bottom:14px}}
.fr-sec{{padding:80px 0;border-top:1px solid var(--border);background:var(--bg-alt)}}
.fr-sec .mx{{max-width:1180px;margin:0 auto;padding:0 28px}}
.fr-label{{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}}
.fr-card{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:36px;margin-bottom:32px;box-shadow:0 2px 12px rgba(20,18,16,.04)}}
.fr-card.founder{{border-left:4px solid var(--accent);display:flex;gap:24px;align-items:flex-start}}
.fr-card.founder img{{width:88px;height:88px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid var(--border)}}
.fr-card.founder .fr-body{{flex:1}}
.fr-quote{{font-size:18px;line-height:1.65;color:var(--text);font-weight:500;margin-bottom:20px;font-style:italic}}
.fr-author{{font-size:14px;font-weight:700;color:var(--text)}}
.fr-role{{font-size:13px;color:var(--muted);margin-top:2px}}
.fr-stars{{color:#F5A623;font-size:14px;letter-spacing:2px;margin-bottom:14px}}
.fr-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:32px}}
.fr-grid .fr-card{{margin-bottom:0}}
@media(max-width:640px){{.fr-sec{{padding:60px 0}}.fr-card{{padding:28px}}.fr-card.founder{{flex-direction:column}}}}
</style>
<section class="fr-sec">
  <div class="mx">
    <div class="fr-label">Sang Pendiri</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Pendiri MapRaiders" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">Pendiri, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">Dari beta tertutup</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.6">
      Catatan: Para penguji adalah peserta internal beta tertutup (Jerman). Hanya nama depan + inisial yang digunakan atas permintaan penguji, untuk alasan privasi. Ulasan diterjemahkan dari bahasa Jerman asli ke Bahasa Indonesia.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    """WhatsApp-Sharing-Button (Master-Plan §6 — wajib! >95% Penetrasi) + Telegram."""
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    wa_text = f"Lihat%20MapRaiders%20-%20{enc}"
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}.mr-share__btn.wa{{border-color:#25D366}}.mr-share__btn.wa:hover{{background:#25D366;color:#fff}}</style>
<div class="mr-share" aria-label="Bagikan"><span class="mr-share__label">Bagikan:</span><a class="mr-share__btn wa" href="https://wa.me/?text={wa_text}" target="_blank" rel="noopener noreferrer">📱 WhatsApp</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">Syarat</a><a href="/datenschutz.html">Privasi</a><a href="/impressum.html">Impressum</a><a href="/kontakt.html">Kontak</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; Taklukkan lingkunganmu nyata. Sebuah produk dari Scafa Investments LLC.</p>
</div>
</footer>
<script>
(function(){const t=localStorage.getItem('mr-theme')||'light';document.documentElement.dataset.theme=t;})();
window.addEventListener('scroll',function(){document.getElementById('nav').classList.toggle('scroll',scrollY>60);});
const io=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.classList.add('on');io.unobserve(x.target);}});},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.rv').forEach(function(el){io.observe(el);});
document.querySelectorAll('.faq-q').forEach(function(q){q.addEventListener('click',function(){q.parentElement.classList.toggle('open');});});
</script>
</body>
</html>"""


def nav_html(active_slug):
    return f"""<nav class="nav" id="nav">
<div class="nav-i mx">
  <a href="/id/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/id/#features" class="lnk">Fitur</a>
    <a href="/id/mapraiders-ulasan.html" class="lnk">Ulasan</a>
    <div class="lang-sw">
      <button class="lsw-btn">ID <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('id')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">Segera</a>
  </div>
</div>
</nav>"""


def base_css():
    return """*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:hidden}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;font-family:'Outfit',sans-serif}
a{color:inherit;text-decoration:none}button{font-family:inherit;cursor:pointer;border:none;background:none}
:root{--bg:#F6F4F1;--bg-alt:#EFEDE8;--surface:#FFFFFF;--border:rgba(20,18,16,.07);--text:#141210;--muted:#756F6A;--dim:#C0BAB4;--accent:#1558F0;--accent-m:rgba(21,88,240,.07);--accent-b:rgba(21,88,240,.18);--nav-bg:rgba(246,244,241,.9);}
[data-theme="dark"]{--bg:#0D0C0A;--bg-alt:#161410;--surface:#1C1916;--border:rgba(255,255,255,.06);--text:#EAE7E2;--muted:#7A7470;--dim:#3E3B37;--accent:#4B7BFF;--accent-m:rgba(75,123,255,.1);--accent-b:rgba(75,123,255,.22);--nav-bg:rgba(13,12,10,.9);}
body{background:var(--bg);color:var(--text);transition:background .4s,color .4s}
.mx{max-width:1180px;margin:0 auto;padding:0 28px}
.rv{opacity:0;transform:translateY(32px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.rv.on{opacity:1;transform:none}
.d1{transition-delay:.08s}.d2{transition-delay:.16s}.d3{transition-delay:.24s}.d4{transition-delay:.32s}
.nav{position:fixed;top:0;left:0;right:0;z-index:900;padding:20px 0;background:var(--nav-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:padding .4s}
.nav.scroll{padding:13px 0}
.nav-i{display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-size:14px;font-weight:800;letter-spacing:3.5px;text-transform:uppercase;color:var(--text)}
.nav-logo b{color:var(--accent)}
.nav-r{display:flex;gap:24px;align-items:center}
.nav-r a.lnk{font-size:13px;font-weight:500;color:var(--muted);transition:color .2s}.nav-r a.lnk:hover{color:var(--text)}
.btn-dl{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;padding:9px 20px;border-radius:6px;background:var(--accent);color:#fff;transition:opacity .2s,transform .2s}.btn-dl:hover{opacity:.88;transform:translateY(-1px)}
.lang-sw{position:relative}
.lsw-btn{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);padding:5px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:5px;background:none;border:none;font-family:inherit}
.lsw-drop{position:absolute;top:calc(100% + 6px);right:0;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:6px;min-width:170px;display:none;z-index:200;box-shadow:0 12px 40px rgba(0,0,0,.10);flex-direction:column;gap:1px}
.lang-sw:hover .lsw-drop,.lang-sw:focus-within .lsw-drop{display:flex}
.lsw-btn .chev{width:9px;height:9px;opacity:.5;transition:transform .2s}
.lang-sw:hover .lsw-btn .chev{transform:rotate(180deg)}
.lswi{font-size:13px;font-weight:500;color:var(--muted);padding:7px 12px;border-radius:7px;text-decoration:none;white-space:nowrap;transition:all .15s;display:block}
.lswi:hover{color:var(--text);background:var(--surface)}
.lswi.on{color:var(--accent);background:var(--accent-m);font-weight:700;pointer-events:none}
@media(max-width:900px){.lang-sw{display:none}}@media(max-width:740px){.nav-r a.lnk{display:none}}
.hero{padding:160px 0 100px;border-bottom:1px solid var(--border)}
.h-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);padding:6px 14px;border-radius:4px;background:var(--accent-m);border:1px solid var(--accent-b);margin-bottom:28px}
.hero h1{font-size:clamp(38px,6vw,76px);font-weight:900;line-height:1.0;letter-spacing:-2px;margin-bottom:24px}
.hero h1 em{font-style:normal;color:var(--accent)}
.hero p.lead{font-size:18px;color:var(--muted);line-height:1.75;max-width:640px;margin-bottom:32px}
.hero .pricing-pill{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text);background:#FFE066;padding:6px 14px;border-radius:99px;margin-bottom:18px}
.trigger-quote{margin:40px 0 0;padding:24px 28px;border-left:4px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;font-style:italic;font-size:17px;line-height:1.6;color:var(--text);max-width:720px}
.trigger-quote cite{display:block;margin-top:14px;font-style:normal;font-size:13px;color:var(--muted);font-weight:600}
.btn-p{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;padding:16px 36px;border-radius:6px;background:var(--accent);color:#fff;transition:all .25s}.btn-p:hover{transform:translateY(-2px);opacity:.9}
.sec{padding:90px 0;border-bottom:1px solid var(--border)}
.sec-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.sec-title{font-size:clamp(26px,3.8vw,42px);font-weight:800;letter-spacing:-1.5px;line-height:1.08;margin-bottom:24px}
.sec-title em{font-style:normal;color:var(--accent)}
.prose p{font-size:15px;color:var(--muted);line-height:1.8;margin-bottom:20px;max-width:820px}
.prose strong{color:var(--text);font-weight:700}
.prose ul{margin:16px 0 22px 24px;color:var(--muted);font-size:15px;line-height:1.85;max-width:820px}
.prose ul li{margin-bottom:8px}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:36px}
.feat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:32px;transition:all .3s}
.feat-card:hover{border-color:var(--accent-b);transform:translateY(-3px)}
.feat-card h3{font-size:18px;font-weight:700;margin-bottom:12px}
.feat-card p{font-size:14px;color:var(--muted);line-height:1.7}
.comp-table{width:100%;border-collapse:collapse;margin-top:32px;border:1px solid var(--border);border-radius:12px;overflow:hidden;font-size:14px}
.comp-table thead{background:var(--bg-alt)}
.comp-table th{padding:16px 18px;text-align:left;font-weight:700;font-size:13px;border-bottom:1px solid var(--border)}
.comp-table td{padding:14px 18px;border-bottom:1px solid var(--border);color:var(--muted)}
.comp-table tr:last-child td{border-bottom:none}
.feat-name{color:var(--text);font-weight:600}
.check{color:#10B981;font-weight:700}.cross{color:#EF4444;font-weight:700}
.faq-list{margin-top:36px;display:flex;flex-direction:column;gap:2px}
.faq-item{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:22px 28px;cursor:pointer;font-size:16px;font-weight:600;gap:16px}
.faq-q svg{flex-shrink:0;color:var(--accent);transition:transform .3s}
.faq-item.open .faq-q svg{transform:rotate(45deg)}
.faq-a{display:none;padding:0 28px 22px;font-size:15px;color:var(--muted);line-height:1.75}
.faq-item.open .faq-a{display:block}
.cta-sec{padding:90px 0;text-align:center}
.cta-sec h2{font-size:clamp(28px,4.5vw,52px);font-weight:800;letter-spacing:-2px;margin-bottom:16px}
.cta-sec p{font-size:15px;color:var(--muted);margin-bottom:32px}
.cta-note{font-size:12px;color:var(--dim);margin-top:12px}
.links-row{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;margin-top:32px}
.links-row a{font-size:14px;font-weight:600;color:var(--accent);text-decoration:underline;text-underline-offset:3px}
footer{padding:40px 0 32px;border-top:1px solid var(--border)}
.f-i{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.f-logo{font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--dim)}
.f-links{display:flex;gap:22px;flex-wrap:wrap}
.f-links a{font-size:12px;color:var(--muted);transition:color .2s}.f-links a:hover{color:var(--text)}
.f-copy{width:100%;text-align:center;margin-top:20px;font-size:11px;color:var(--dim)}"""


# -----------------------------------------------------------------------------
# SCHEMA BUILDERS
# -----------------------------------------------------------------------------

# DE-Original-Slugs für translationOfWork.
# ID-EXKLUSIV-Pages (K4 Koin-Jagat, K7 Ramadan, deren Twins) haben kein DE-Pendant
# → fallback auf "/" (DE-Homepage), Master-Plan §8: translationOfWork pflicht.
DE_TRANSLATION_MAP = {
    "/id/permainan-teritori.html": "/territorium-spiel.html",
    "/id/game-lokasi.html": "/gps-spiel-deutschland.html",
    "/id/alternatif-pokemon-go-gratis.html": "/pokemon-go-alternative-kostenlos.html",
    "/id/koin-jagat-alternatif.html": "/",
    "/id/aplikasi-jalan-kaki-game.html": "/handyspiel-zum-laufen.html",
    "/id/harta-karun-aplikasi.html": "/schnitzeljagd-app.html",
    "/id/permainan-ramadan.html": "/",
    "/id/permainan-teritori-ulasan.html": "/territorium-spiel-erfahrungen.html",
    "/id/game-lokasi-ulasan.html": "/gps-spiel-erfahrungen.html",
    "/id/alternatif-pokemon-go-gratis-ulasan.html": "/pokemon-go-alternative-erfahrungen.html",
    "/id/koin-jagat-alternatif-ulasan.html": "/",
    "/id/aplikasi-jalan-kaki-game-ulasan.html": "/handyspiel-laufen-erfahrungen.html",
    "/id/harta-karun-aplikasi-ulasan.html": "/schnitzeljagd-app-erfahrungen.html",
    "/id/permainan-ramadan-ulasan.html": "/",
    "/id/mapraiders-ulasan.html": "/mapraiders-erfahrungen.html",
}


def build_review_obj(t, page_slug, with_item_reviewed=False):
    de_orig = DE_TRANSLATION_MAP.get(page_slug, "/")
    obj = {
        "@type": "Review",
        "@id": f"#{t['id']}",
        "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
        "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
        "reviewBody": t["quote"],
        "datePublished": t["date"],
        "inLanguage": "id",
        "translationOfWork": {
            "@type": "Review",
            "inLanguage": "de",
            "url": f"{SITE}{de_orig}#{t['id']}",
        },
    }
    if with_item_reviewed:
        obj["itemReviewed"] = {"@id": f"{SITE}{page_slug}#app"}
    return obj


def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Beranda", "item": f"{SITE}/id/"},
        {"@type": "ListItem", "position": 2, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = [build_review_obj(t, page["slug"]) for t in page.get("testers", ALL_TESTERS)]
    review_count = len(page.get("testers", ALL_TESTERS))
    faq_entities = [
        {"@type": "Question", "name": q["q"],
         "acceptedAnswer": {"@type": "Answer", "text": q["a"]}}
        for q in page["faq"]
    ]
    defined_terms = [
        {"@type": "DefinedTerm", "name": n, "description": d}
        for n, d in DEFINED_TERMS
    ]
    de_orig = DE_TRANSLATION_MAP.get(page["slug"], "/")
    graph = [
        {
            "@type": "WebPage",
            "@id": f"{SITE}{page['slug']}#webpage",
            "url": f"{SITE}{page['slug']}",
            "name": page["title"],
            "inLanguage": "id",
            "isPartOf": {"@id": f"{SITE}/#website"},
            "breadcrumb": {"@id": f"{SITE}{page['slug']}#breadcrumb"},
            "translationOfWork": {"@type": "WebPage", "url": f"{SITE}{de_orig}", "inLanguage": "de"},
        },
        {
            "@type": "BreadcrumbList",
            "@id": f"{SITE}{page['slug']}#breadcrumb",
            "itemListElement": breadcrumbs,
        },
        {
            "@type": "MobileApplication",
            "@id": f"{SITE}{page['slug']}#app",
            "name": "MapRaiders",
            "operatingSystem": "Android",
            "applicationCategory": "GameApplication",
            "applicationSubCategory": "Location-Based Game",
            "inLanguage": "id",
            "description": page["meta"],
            "offers": [
                {"@type": "Offer", "name": o["name"], "price": o["price"], "priceCurrency": o["currency"]}
                for o in PRICING_OFFERS
            ],
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": str(review_count),
                "bestRating": "5",
            },
            "review": [{"@id": f"#{t['id']}"} for t in page.get("testers", ALL_TESTERS)],
            "publisher": {"@id": "#org-scafa"},
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
                "addressCountry": "US",
            },
            "founder": {"@id": "#person-rene"},
        },
        {
            "@type": "Person",
            "@id": "#person-rene",
            "name": "René Scafarti",
            "jobTitle": "Pendiri",
            "worksFor": {"@id": "#org-scafa"},
            "description": FOUNDER_QUOTE,
        },
        *review_objs,
        {
            "@type": "FAQPage",
            "mainEntity": faq_entities,
        },
        {
            "@type": "DefinedTermSet",
            "@id": f"{SITE}{page['slug']}#brand-vocab-id",
            "name": "MapRaiders Kosakata Merek ID",
            "inLanguage": "id",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Beranda", "item": f"{SITE}/id/"},
        {"@type": "ListItem", "position": 2, "name": "Ulasan", "item": f"{SITE}/id/mapraiders-ulasan.html"},
        {"@type": "ListItem", "position": 3, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = [build_review_obj(t, page["slug"], with_item_reviewed=True) for t in ALL_TESTERS]
    de_orig = DE_TRANSLATION_MAP.get(page["slug"], "/")
    graph = [
        {
            "@type": "WebPage",
            "@id": f"{SITE}{page['slug']}#webpage",
            "url": f"{SITE}{page['slug']}",
            "name": page["title"],
            "inLanguage": "id",
            "breadcrumb": {"@id": f"{SITE}{page['slug']}#breadcrumb"},
            "translationOfWork": {"@type": "WebPage", "url": f"{SITE}{de_orig}", "inLanguage": "de"},
        },
        {
            "@type": "BreadcrumbList",
            "@id": f"{SITE}{page['slug']}#breadcrumb",
            "itemListElement": breadcrumbs,
        },
        {
            "@type": "MobileApplication",
            "@id": f"{SITE}{page['slug']}#app",
            "name": "MapRaiders",
            "operatingSystem": "Android",
            "applicationCategory": "GameApplication",
            "inLanguage": "id",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "3",
                "bestRating": "5",
            },
            "review": [{"@id": f"#{t['id']}"} for t in ALL_TESTERS],
        },
        *review_objs,
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_hub(page, all_killers, all_twins):
    base = build_schema_killer(page)
    item_list = {
        "@type": "ItemList",
        "@id": f"{SITE}{page['slug']}#itemlist",
        "name": "MapRaiders ID — semua halaman Killer dan ulasan",
        "itemListElement": []
    }
    pos = 1
    for slug, name in all_killers + all_twins:
        item_list["itemListElement"].append({
            "@type": "ListItem",
            "position": pos,
            "url": f"{SITE}{slug}",
            "name": name,
        })
        pos += 1
    base["@graph"].append(item_list)
    return base


# -----------------------------------------------------------------------------
# RENDERERS
# -----------------------------------------------------------------------------

def render_section_html(section):
    label = section.get("label", "")
    title = section["title"]
    body = section.get("body", "")
    extra = section.get("extra", "")
    label_html = f'<div class="sec-label rv">{label}</div>' if label else ""
    return f"""<section class="sec">
<div class="mx">
  {label_html}
  <h2 class="sec-title rv d1">{title}</h2>
  <div class="prose rv d2">
    {body}
  </div>
  {extra}
</div>
</section>"""


def render_faq_html(faqs):
    items = []
    for i, q in enumerate(faqs):
        d = f"d{min(i, 4)}" if i > 0 else ""
        items.append(f"""    <div class="faq-item rv {d}">
      <div class="faq-q">{q['q']}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div>
      <div class="faq-a">{q['a']}</div>
    </div>""")
    return f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">FAQ</div>
  <h2 class="sec-title rv d1">Pertanyaan <em>yang sering diajukan</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Lebih banyak tentang <em>medan permainan</em></h2>
  <p class="rv d1">Topik terkait MapRaiders:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Segera di Google Play &bull; Gratis &bull; Tanpa spam</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">Beritahu saya saat peluncuran</a>
  </div>
</div>
</section>"""


def render_killer_page(page):
    schema = build_schema_killer(page)
    schema_json = json.dumps(schema, ensure_ascii=False, separators=(",", ":"))
    sections_html = "\n".join(render_section_html(s) for s in page["sections"])
    faq_html = render_faq_html(page["faq"])
    links_html = render_internal_links_html(page["internal_links"])
    testers_html = testers_section_html(page.get("testers", ALL_TESTERS))
    sharing = sharing_block_html(page["slug"])

    trigger_html = ""
    if page.get("trigger"):
        trigger_html = f"""<div class="trigger-quote rv d3">
  <span>„{page['trigger']['quote']}"</span>
  <cite>— {page['trigger']['author']}</cite>
</div>"""

    pricing_pill = ""
    if page.get("pricing_pill"):
        pricing_pill = f'<div class="pricing-pill rv">{page["pricing_pill"]}</div>'

    return f"""<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{page['title']}</title>
<meta name="description" content="{page['meta']}">
<link rel="canonical" href="{SITE}{page['slug']}">
{hreflang_block(page['slug'])}
<meta property="og:title" content="{page['og_title']}">
<meta property="og:description" content="{page['meta']}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE}{page['slug']}">
<meta property="og:locale" content="id_ID">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html(page['slug'])}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">{page['badge']}</div>
  {pricing_pill}
  <h1 class="rv d1">{page['h1_html']}</h1>
  <p class="lead rv d2">{page['lead']}</p>
  <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p rv d3">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
    Beritahu saya saat peluncuran
  </a>
  {trigger_html}
</div>
</section>

{sections_html}

{faq_html}

{testers_html}

{links_html}

{sharing}

{footer_html()}
"""


def render_twin_page(page):
    schema = build_schema_twin(page)
    schema_json = json.dumps(schema, ensure_ascii=False, separators=(",", ":"))

    intro_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">{page['intro_label']}</div>
  <h2 class="sec-title rv d1">{page['intro_title']}</h2>
  <div class="prose rv d2">
    {page['intro_body']}
  </div>
</div>
</section>"""

    aggregate_html = """<section class="sec">
<div class="mx">
  <div class="sec-label rv">Ulasan</div>
  <h2 class="sec-title rv d1">5,0 dari 5 — <em>3 ulasan beta yang terverifikasi</em></h2>
  <div class="prose rv d2">
    <p>Tiga penguji dari beta tertutup — pemilik anjing, seorang pelari, dan penjelajah kota — menggunakan MapRaiders selama beberapa minggu. Kesaksian berikut mewakili orang-orang sungguhan dari beta tertutup (Jerman). Ulasan diterjemahkan dari bahasa Jerman asli ke Bahasa Indonesia. Untuk alasan privasi, kami hanya menggunakan nama depan + inisial.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{page['title']}</title>
<meta name="description" content="{page['meta']}">
<link rel="canonical" href="{SITE}{page['slug']}">
{hreflang_block(page['slug'])}
<meta property="og:title" content="{page['og_title']}">
<meta property="og:description" content="{page['meta']}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE}{page['slug']}">
<meta property="og:locale" content="id_ID">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html(page['slug'])}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">Ulasan</div>
  <h1 class="rv d1">{page['h1_html']}</h1>
  <p class="lead rv d2">{page['lead']}</p>
</div>
</section>

{intro_html}

{aggregate_html}

{testers_html}

{links_html}

{sharing}

{footer_html()}
"""


def render_hub_page(page, all_killers, all_twins):
    schema = build_schema_hub(page, all_killers, all_twins)
    schema_json = json.dumps(schema, ensure_ascii=False, separators=(",", ":"))

    killer_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Pelajari lebih lanjut →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Ulasan terperinci →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">Hub Tematik</div>
  <h2 class="sec-title rv d1">Semua <em>topik MapRaiders</em> di satu tempat</h2>
  <div class="prose rv d2">
    <p>Di sini Anda menemukan semua 7 halaman Killer ditambah 7 ulasan terperinci yang menyoroti MapRaiders dari sudut pandang berbeda — dari perbandingan dengan Pokémon GO ke aplikasi perburuan harta karun, dari permainan teritori ke pendamping lari. Setiap halaman berdiri sendiri; bersama-sama, mereka membentuk gambaran lengkap.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Ulasan terperinci</div>
  <h2 class="sec-title rv d1">Apa yang dikatakan penguji dalam <em>perspektif berbeda</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Ulasan Agregat</div>
  <h2 class="sec-title rv d1">5,0 dari 5 — <em>3 ulasan beta terverifikasi</em></h2>
  <div class="prose rv d2">
    <p>Semua ulasan berasal dari fase beta tertutup (Februari–April 2026). Tiga penguji — pemilik anjing, pelari, dan penjelajah kota — menguji MapRaiders pada rute pribadi mereka di Stuttgart, Hamburg, dan Berlin. Ulasan yang ditampilkan di sini diterjemahkan dari bahasa Jerman asli dan mewakili orang-orang sungguhan.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{page['title']}</title>
<meta name="description" content="{page['meta']}">
<link rel="canonical" href="{SITE}{page['slug']}">
{hreflang_block(page['slug'])}
<meta property="og:title" content="{page['og_title']}">
<meta property="og:description" content="{page['meta']}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE}{page['slug']}">
<meta property="og:locale" content="id_ID">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html(page['slug'])}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">Hub MapRaiders</div>
  <h1 class="rv d1">{page['h1_html']}</h1>
  <p class="lead rv d2">{page['lead']}</p>
</div>
</section>

{sections_html}

{testers_html}

{sharing}

{footer_html()}
"""


# -----------------------------------------------------------------------------
# PAGE DATA — KILLERS (K1-K7) per Master-Plan §4
# -----------------------------------------------------------------------------

# K1 — permainan-teritori
K1 = {
    "slug": "/id/permainan-teritori.html",
    "breadcrumb": "Permainan teritori",
    "title": "Permainan teritori — taklukkan wilayahmu nyata",
    "og_title": "Permainan teritori — di mana tanah benar-benar milikmu",
    "meta": "Permainan teritori untuk smartphone. MapRaiders adalah satu-satunya GPS MMO dengan kepemilikan wilayah nyata. Tanpa iklan, tanpa biaya, AR tidak diperlukan.",
    "keywords": "permainan teritori, game teritori, permainan wilayah, taklukkan wilayah aplikasi, gps mmo indonesia",
    "badge": "Permainan Teritori",
    "pricing_pill": "Gratis selamanya · Cosmetic opsional · Tanpa iklan",
    "h1_html": 'Permainan teritori — taklukkan <em>lingkunganmu</em> nyata',
    "lead": "Permainan teritori seharusnya lebih dari sekadar titik di peta yang menghilang dalam 5 menit. MapRaiders menggabungkan GPS, penangkapan area persisten dan sistem pertahanan yang membuat penaklukan nyata menjadi mungkin. Anda berjalan di sebuah jalan — itu milik Anda. Selama Anda mempertahankannya. Tanpa fake GPS, tanpa AR yang menguras baterai, tanpa iklan.",
    "trigger": {
        "quote": "Taklukkan lingkunganmu.",
        "author": "MapRaiders, prinsip merek"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Definisi",
            "title": "Apa yang membuat <em>permainan teritori sungguhan</em>",
            "body": """
    <p><strong>Permainan teritori</strong> adalah permainan di mana pemain memiliki area yang diklaim di peta secara persisten, mempertahankan dan memperluas area tersebut. Berbeda dari permainan tangkap (gym, portal), kepemilikan tetap <strong>persisten</strong> — bahkan ketika pemain offline.</p>
    <p>Empat mekanisme yang mendefinisikan permainan teritori sungguhan:</p>
    <ul>
      <li><strong>Persistensi.</strong> Area yang ditaklukkan tetap ditugaskan kepada pemain atau klan sampai diambil secara aktif.</li>
      <li><strong>Decay.</strong> Wilayah yang tidak aktif menyusut seiring waktu — tidak ada yang memblokir secara permanen tanpa bermain aktif.</li>
      <li><strong>Pertahanan.</strong> Saat diserang, mini-game antara dua pemain memutuskan — bukan perbandingan stat otomatis.</li>
      <li><strong>Transfer klan.</strong> Wilayah dapat diberikan kepada sekutu atau klan — kedalaman ekonomi.</li>
    </ul>
            """,
        },
        {
            "label": "Sistem MapRaiders",
            "title": "<em>Sistem teritori</em> MapRaiders secara rinci",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Klaim</h3><p>Berjalan kaki, dengan anjing, atau bersepeda melewati sebuah jalan. Jejak GPS menghasilkan wilayah atas nama Anda — sebagai poligon yang terlihat di peta.</p></div>
    <div class="feat-card rv d1"><h3>Mesin Decay</h3><p>Siapa yang tidak melewati wilayah secara teratur akan melihatnya menyusut beberapa persen per hari. Aktivitas mempertahankan tanah — bukan uang.</p></div>
    <div class="feat-card rv d2"><h3>Mini-game pertahanan</h3><p>7 mini-game berbeda memutuskan serangan: tic-tac-toe, batu-gunting-kertas, mini-catur. Strategi lebih penting daripada waktu bermain.</p></div>
    <div class="feat-card rv d3"><h3>Wilayah klan</h3><p>Beberapa pemain dapat mempertahankan satu wilayah bersama-sama. Area klan lebih kuat — satu penyerang tidak cukup untuk merobohkan.</p></div>
  </div>""",
        },
        {
            "label": "Beda dari Pokémon GO",
            "title": "Mengapa Pokémon GO dan Ingress <em>bukan</em> permainan teritori sungguhan",
            "body": """
    <p><strong>Penangkapan gym Pokémon GO</strong> bersifat sementara: siapa yang mempertahankan rekor selama beberapa jam mendapat koin — tetapi wilayah itu sendiri tidak dapat dipahami sebagai kepemilikan tanah. Gym adalah titik, bukan area.</p>
    <p><strong>Portal Ingress</strong> serupa: titik yang terhubung dengan tautan dalam segitiga. Permainan mengetahui medan antar portal, tetapi tidak ada kepemilikan tanah persisten. Siapa yang tidak membuka aplikasi selama seminggu tidak kehilangan &ldquo;lingkungannya&rdquo; — itu tidak pernah benar-benar ditugaskan.</p>
    <p>MapRaiders menyerang tepat di titik ini: <strong>wilayah adalah sumber daya permainan</strong>, bukan titik di atasnya. Anda mendapatkan tanah, kehilangan tanah, mentransfer tanah — seperti dalam permainan ruang nyata.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Bagaimana sistem wilayah di MapRaiders bekerja?",
         "a": "Anda berjalan secara fisik melalui jalan-jalan dan mengklaim area GPS. Wilayah-wilayah ini muncul di peta secara langsung dan menjadi milik Anda — selama tidak ada pemain lain yang lewat dan menantang. Jika Anda berhasil mempertahankan, area tetap milik Anda."},
        {"q": "Bisakah saya kehilangan wilayah saya?",
         "a": "Ya. Sistem Decay membuat area yang tidak aktif menyusut per hari. Siapa yang tetap aktif dan secara teratur melewati area mereka akan mempertahankannya. Siapa yang berhenti, kehilangan. Ini menjaga peta tetap hidup."},
        {"q": "Apa yang terjadi dalam serangan teritorial?",
         "a": "Penyerang harus tiba secara fisik di wilayah Anda. Kemudian mini-game interaktif dimulai — pembela dan penyerang bermain satu sama lain. Siapa yang memenangkan mini-game memutuskan nasib area."},
        {"q": "Apakah ada sistem wilayah klan?",
         "a": "Ya. Klan di MapRaiders muncul secara organik dan dapat mengklaim wilayah bersama. Area klan lebih kuat dan membutuhkan beberapa penyerang untuk dirobohkan. Kerja tim terbayar."},
        {"q": "Apakah permainan teritori berbayar?",
         "a": "Tidak. Seluruh gameplay teritori gratis. Secara opsional ada item kosmetik (Rp 15.000 – Rp 150.000) untuk desain penanda dan warna wilayah — tanpa keuntungan dalam permainan. Pembayaran melalui GoPay, OVO, Dana, atau ShopeePay."},
    ],
    "internal_links": [
        ("/id/game-lokasi.html", "Game lokasi 2026"),
        ("/id/koin-jagat-alternatif.html", "Koin Jagat alternatif"),
        ("/id/permainan-ramadan.html", "Permainan Ramadan"),
        ("/id/permainan-teritori-ulasan.html", "Ulasan permainan teritori"),
        ("/id/mapraiders-ulasan.html", "Semua ulasan"),
    ],
}

# K2 — game-lokasi (Volume-King 2-3.5K/mo)
K2 = {
    "slug": "/id/game-lokasi.html",
    "breadcrumb": "Game lokasi",
    "title": "Game lokasi 2026 — 7 game GPS Indonesia perbandingan",
    "og_title": "Game lokasi 2026 — GPS MMO yang jujur, gratis",
    "meta": "Game lokasi 2026: MapRaiders vs Pokémon GO vs Koin Jagat dibandingkan. Wilayah nyata, tanpa iklan, ramah baterai.",
    "keywords": "game lokasi, game gps indonesia, location based game, game gps android, game peta, gps mmo",
    "badge": "GPS MMO",
    "pricing_pill": "Free Forever · UU PDP · WhatsApp-native",
    "h1_html": 'Game lokasi — <em>taklukkan lingkunganmu</em> nyata',
    "lead": "Game lokasi seharusnya lebih dari sekadar titik sementara di peta. MapRaiders menggabungkan GPS, penangkapan wilayah persisten dan sistem pertahanan yang membuat penaklukan nyata menjadi mungkin. Anda lewat di sebuah jalan — itu milik Anda. Selama Anda mempertahankannya. Tanpa fake GPS, tanpa AR menguras baterai, tanpa iklan.",
    "trigger": {
        "quote": "Taklukkan lingkunganmu.",
        "author": "MapRaiders, prinsip merek"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Apa itu?",
            "title": "Apa itu <em>game lokasi</em>",
            "body": """
    <p>Sebuah <strong>game lokasi (Location-Based Game)</strong> menggunakan posisi geografis perangkat sebagai mekanika inti. Berbeda dari game AR yang juga membutuhkan kamera, game GPS murni hanya bekerja dengan peta — menghemat baterai dan melindungi privasi.</p>
    <p>MapRaiders adalah <strong>GPS MMO</strong>: ribuan pemain bergerak secara bersamaan di peta yang sama, bersaing dalam waktu nyata, dan berbagi sistem wilayah yang terpadu. Tanpa AR, tanpa kamera, tanpa kacamata VR.</p>
            """,
        },
        {
            "label": "7 game GPS terbaik",
            "title": "7 game lokasi dibandingkan — dan mengapa <em>MapRaiders</em> adalah satu-satunya dengan wilayah nyata",
            "body": "<p>Sebagian besar daftar mencampur aplikasi yang hanya berbagi satu fitur dengan Pokémon GO. Berikut perbandingan jujurnya:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>Aplikasi</th><th>Operator</th><th>Tanpa iklan</th><th>Wilayah nyata</th><th>UU PDP</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Gym sementara</td><td class="cross">PIF Saudi</td></tr>
      <tr><td class="feat-name">Koin Jagat</td><td>Jagat (lokal ID)</td><td>Bervariasi</td><td class="cross">Hanya koin</td><td>Operator lokal</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">PIF Saudi</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="check">✓</td><td class="cross">Cache, bukan tanah</td><td>Premium-paywall</td></tr>
      <tr><td class="feat-name">Mobile Legends</td><td>Moonton</td><td class="cross">✗</td><td class="cross">Bukan game lokasi</td><td>Operator</td></tr>
      <tr><td class="feat-name">Ingress Prime</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Portal, bukan tanah</td><td class="cross">PIF Saudi</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓</td><td class="check">✓ persisten</td><td class="check">UU PDP, independen</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Pembeda",
            "title": "Apa yang membuat MapRaiders <em>unik</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Wilayah persisten</h3><p>Saat menaklukkan sebuah jalan, itu milik Anda — sampai seseorang merebutnya kembali atau decay bertindak. Tidak ada gym sementara.</p></div>
    <div class="feat-card rv d1"><h3>Echo bukan AR</h3><p>Tinggalkan Echo audio, foto, atau video di lokasi nyata. Pemain lain menemukannya. Tanpa AR menguras baterai.</p></div>
    <div class="feat-card rv d2"><h3>7 mini-game pertahanan</h3><p>Saat diserang: tic-tac-toe, batu-gunting-kertas, atau mini-catur. Strategi bukan hanya waktu.</p></div>
    <div class="feat-card rv d3"><h3>Klan organik</h3><p>Klan muncul dari lingkungan, bukan server Discord. Siapa yang lari di jalan yang sama menjadi sekutu.</p></div>
    <div class="feat-card rv d4"><h3>Hemat baterai</h3><p>Hanya GPS, tanpa kamera, tanpa AR. Daya baterai 4× lebih lama dari Pokémon GO pada rute panjang.</p></div>
  </div>""",
        },
        {
            "label": "Kasus penggunaan ID",
            "title": "Kasus penggunaan <em>Indonesia</em>",
            "body": "<p>MapRaiders beradaptasi dengan empat profil utama di Indonesia:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Lari pagi</h3><p>Kardio dengan tujuan: pertahankan wilayah atau rebut kembali. Strava + game.</p></div>
    <div class="feat-card rv d1"><h3>Jalan-jalan setelah berbuka</h3><p>Selama Ramadan: aktivitas keluarga setelah Iftar. Kalori turun, wilayah naik.</p></div>
    <div class="feat-card rv d2"><h3>Penjelajahan kota</h3><p>Jakarta, Surabaya, Bandung — temukan Echo dari pemain lain di gang dan lorong.</p></div>
    <div class="feat-card rv d3"><h3>Aktivitas keluarga</h3><p>Perburuan harta karun dengan Echo, tanpa AR, tanpa iklan — untuk anak-anak dan dewasa.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Apa itu game lokasi?",
         "a": "Game lokasi (Location-Based Game) menggunakan posisi GPS Anda untuk memicu mekanika permainan. MapRaiders menggunakan GPS untuk menghubungkan wilayah, Echo, dan misi ke lokasi nyata — kota Anda menjadi medan permainan."},
        {"q": "Apakah saya membutuhkan Augmented Reality?",
         "a": "Tidak. MapRaiders sengaja AR-free. Hanya menggunakan GPS dan peta. Ini menghemat baterai dan privasi — tanpa kamera, tanpa pengenalan wajah."},
        {"q": "Apakah berfungsi di kota mana pun di Indonesia?",
         "a": "Ya. Di mana pun ada data OpenStreetMap. Di pusat-pusat perkotaan seperti Jakarta, Surabaya, dan Bandung kepadatan pemain tinggi; di daerah, lebih sedikit kompetisi tetapi wilayah lebih besar."},
        {"q": "Apakah data lokasi saya dijual?",
         "a": "Tidak. Kami sesuai UU PDP, tanpa SDK iklan, tanpa penjualan data, tanpa pemilik negara. Berbeda dengan Pokémon GO, yang sejak Maret 2025 milik grup Scopely (PIF Saudi)."},
        {"q": "Berapa biayanya?",
         "a": "Gameplay gratis. Kosmetik (Rp 15.000 – Rp 150.000) tidak memberikan keuntungan dalam permainan, hanya estetika. Pembayaran melalui GoPay, OVO, Dana, ShopeePay, atau Virtual Account."},
    ],
    "internal_links": [
        ("/id/permainan-teritori.html", "Permainan teritori"),
        ("/id/alternatif-pokemon-go-gratis.html", "Alternatif Pokémon GO gratis"),
        ("/id/koin-jagat-alternatif.html", "Koin Jagat alternatif"),
        ("/id/aplikasi-jalan-kaki-game.html", "Aplikasi jalan kaki dengan game"),
        ("/id/harta-karun-aplikasi.html", "Harta karun aplikasi"),
        ("/id/permainan-ramadan.html", "Permainan Ramadan"),
        ("/id/game-lokasi-ulasan.html", "Ulasan game lokasi"),
        ("/id/mapraiders-ulasan.html", "Semua ulasan"),
    ],
}

# K3 — alternatif-pokemon-go-gratis
K3 = {
    "slug": "/id/alternatif-pokemon-go-gratis.html",
    "breadcrumb": "Alternatif Pokémon GO gratis",
    "title": "Alternatif Pokémon GO gratis — tanpa Saudi, tanpa iklan",
    "og_title": "Alternatif Pokémon GO gratis — 100% gratis, tanpa Battle Pass",
    "meta": "Mencari alternatif Pokémon GO gratis? MapRaiders 100% gratis, tanpa iklan, tanpa Battle Pass. Wilayah nyata, bukan tangkapan gym sementara.",
    "keywords": "alternatif pokemon go gratis, alternatif pokemon go indonesia, game gps gratis, tanpa iklan, tanpa battle pass",
    "badge": "Alternatif Pokémon GO",
    "pricing_pill": "Tanpa biaya selamanya · GoPay/OVO/Dana",
    "h1_html": 'Alternatif Pokémon GO gratis — tanpa iklan, <em>tanpa fake GPS</em>, tanpa dana Saudi',
    "lead": "Siapa pun yang mencari alternatif Pokémon GO tanpa Battle Pass, tanpa kegilaan Remote Raid Pass, dan tanpa iklan biasanya jatuh ke jebakan premium berikutnya. MapRaiders membalik ini: gameplay penuh adalah dan tetap gratis. Tanpa tingkatan, tanpa langganan wajib, tanpa penjualan data — pembayaran via GoPay, OVO, atau Dana untuk kosmetik opsional.",
    "trigger": {
        "quote": "Tanpa biaya selamanya. Ramah baterai, ramah data.",
        "author": "MapRaiders, prinsip harga"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Mengapa cari?",
            "title": "Mengapa pemain Pokémon GO Indonesia mencari <em>alternatif gratis</em> di 2026",
            "body": """
    <p>Tiga titik nyeri matang di pasar Indonesia antara 2024 dan 2026:</p>
    <ul>
      <li><strong>Frustrasi Battle Pass.</strong> Pass musiman dengan manfaat yang dikunci tanpa membayar. Yang melewatkan satu musim, kehilangan hadiah selamanya.</li>
      <li><strong>Polemik Remote Raid Pass.</strong> Niantic menaikkan harga dan mengurangi ketersediaan — gelombang pemain Indonesia berhenti pada tahun 2023.</li>
      <li><strong>Akuisisi Saudi Maret 2025.</strong> Niantic menjual Pokémon GO ke Scopely (anak perusahaan Public Investment Fund Saudi). Data lokasi jutaan pemain sekarang sampai secara tidak langsung ke dana kekayaan asing.</li>
    </ul>
            """,
        },
        {
            "label": "Apa arti gratis?",
            "title": "Apa arti <em>&ldquo;gratis&rdquo;</em> sebenarnya di MapRaiders",
            "body": "<p>Tier transparan — tanpa paywall tersembunyi, tanpa pemblokiran tutorial setelah 10 menit:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>Termasuk</th><th>Harga (ID)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% gameplay (wilayah, Echo, misi, klan, pertahanan, acara)</td><td>Rp 0</td></tr>
      <tr><td class="feat-name">Cosmetic-IAP</td><td>Desain penanda, warna wilayah, lencana klan, skin</td><td>Rp 15.000 &ndash; Rp 150.000</td></tr>
      <tr><td class="feat-name">MapRaiders Pendukung (Sub)</td><td>Lencana kehormatan, akses beta, surat pendiri, paket kosmetik bulanan</td><td>Rp 49.000 / bulan</td></tr>
      <tr><td class="feat-name">Pendukung Seumur Hidup</td><td>Kosmetik kolektor + kredit dalam game</td><td>Rp 1.499.000 (sekali)</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Penting:</strong> Item kosmetik tidak memberikan keuntungan apa pun dalam permainan. Yang tidak membeli apa pun bermain dengan mekanika identik dengan Pendukung Seumur Hidup.</p>""",
        },
        {
            "label": "GoPay terintegrasi",
            "title": "Pembayaran <em>via GoPay/OVO/Dana</em> — tanpa pusing",
            "body": """
    <p>Kosmetik opsional dan langganan Pendukung dapat dibayar via GoPay, OVO, Dana, ShopeePay, atau Virtual Account — tanpa perlu memasukkan data kartu internasional. GoPay adalah cara tercepat: Anda membuka aplikasi, scan QR-Code, konfirmasi, selesai. Kosmetik terbuka dalam hitungan detik.</p>
    <p>Penyedia pembayaran terintegrasi: Midtrans, Xendit, Doku. Tanpa biaya tambahan untuk pemain, tanpa kebutuhan PayPal.</p>
            """,
        },
        {
            "label": "Pertanyaan Saudi",
            "title": "<em>Pertanyaan Saudi-Niantic</em> — apa yang terjadi dengan langkahmu?",
            "body": """
    <p>Pada Maret 2025, Niantic menjual divisi gamenya (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) seharga 3,5 miliar dolar ke Scopely. Scopely adalah anak perusahaan dari Public Investment Fund (PIF) Arab Saudi — secara formal entitas yang dikendalikan negara Saudi.</p>
    <p>Konkretnya, ini berarti: <strong>data lokasi sekitar 30 juta pemain Pokémon GO bulanan</strong> — di mana mereka lari, kapan mereka berjalan-jalan, rute apa yang mereka tempuh setiap hari — sekarang diproses oleh infrastruktur Scopely. Detail transfer data tidak diumumkan secara publik. Yang jelas: tidak ada perlindungan setara UU PDP terhadap aktor terkait dana kekayaan di luar Indonesia.</p>
    <p>MapRaiders adalah LLC AS dalam <strong>kepemilikan pribadi</strong> (Scafa Investments LLC, Florida), dikembangkan oleh tim independen. Kami mengoperasikan server yang sesuai UU PDP, tidak menjual data, tidak memiliki jaringan iklan terhubung, dan tidak dikendalikan oleh negara mana pun.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Apakah MapRaiders benar-benar gratis selamanya?",
         "a": "Ya. Seluruh gameplay utama — menaklukkan wilayah, meninggalkan Echo, membuat misi, membentuk klan — tetap gratis selamanya. Tidak ada sistem level, Battle Pass, atau langganan wajib."},
        {"q": "Berapa biaya Cosmetic-IAP?",
         "a": "Item kosmetik seperti desain penanda, warna wilayah, atau lencana klan berharga antara Rp 15.000 dan Rp 150.000. Mereka tidak memberikan keuntungan dalam permainan, hanya estetika. Pembayaran via GoPay, OVO, Dana, ShopeePay."},
        {"q": "Bisakah saya bayar dengan GoPay?",
         "a": "Ya. GoPay adalah metode pembayaran utama Indonesia untuk kosmetik dan Pendukung-Sub. Anda scan QR-Code, konfirmasi di aplikasi, dan item terbuka dalam hitungan detik. Tanpa kartu internasional, tanpa PayPal wajib."},
        {"q": "Apakah ada iklan di aplikasi?",
         "a": "Tidak. MapRaiders 100% bebas iklan. Kami tidak menjual data Anda atau ruang iklan."},
        {"q": "Apa arti &ldquo;tanpa dana Saudi&rdquo;?",
         "a": "Pada Maret 2025, Niantic menjual divisi gamenya (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) seharga 3,5 miliar dolar ke Scopely — anak perusahaan Public Investment Fund Saudi. Data lokasi lebih dari 30 juta pemain bulanan kini sampai secara tidak langsung ke dana kekayaan asing. MapRaiders adalah LLC AS swasta, tidak dikendalikan negara mana pun."},
    ],
    "internal_links": [
        ("/id/permainan-teritori.html", "Permainan teritori"),
        ("/id/game-lokasi.html", "Game lokasi 2026"),
        ("/id/koin-jagat-alternatif.html", "Koin Jagat alternatif"),
        ("/id/alternatif-pokemon-go-gratis-ulasan.html", "Ulasan alternatif"),
        ("/id/mapraiders-ulasan.html", "Semua ulasan"),
    ],
}

# K4 — koin-jagat-alternatif (ID-EXKLUSIV!)
K4 = {
    "slug": "/id/koin-jagat-alternatif.html",
    "breadcrumb": "Koin Jagat alternatif",
    "title": "Koin Jagat alternatif — wilayah nyata, lebih dalam",
    "og_title": "Koin Jagat alternatif — lebih dari sekadar koin, taklukkan wilayah",
    "meta": "Koin Jagat alternatif: MapRaiders adalah game lokasi Indonesia dengan wilayah nyata, klan, mini-game pertahanan. Lebih dalam dari sekadar koin.",
    "keywords": "koin jagat alternatif, alternatif jagat, koin jagat indonesia, game lokal indonesia, jagat coin alternatif",
    "badge": "Koin Jagat Alternatif · Eksklusif ID",
    "pricing_pill": "Tidak ada server crash · Tidak ada antrian · Wilayah nyata",
    "h1_html": 'Koin Jagat alternatif — <em>lebih dari sekadar koin</em>, taklukkan wilayah nyata',
    "lead": "Koin Jagat membawa game lokasi ke Indonesia dengan ide bagus: berburu koin di kota nyata. Tetapi pemain mengeluh tentang server crash, antrian, dan kedalaman gameplay yang terbatas. MapRaiders mengambil titik awal yang sama — gerakan nyata, peta nyata — dan menambahkan wilayah persisten, klan, mini-game pertahanan, sistem Echo. Tidak ada server crash, tidak ada antrian. Lebih dalam.",
    "trigger": {
        "quote": "Lebih dari sekadar koin — taklukkan wilayah nyata.",
        "author": "MapRaiders, sudut pandang lokal ID"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Apa itu Koin Jagat",
            "title": "Apa itu <em>Koin Jagat</em> — secara hormat",
            "body": """
    <p>Koin Jagat adalah game lokasi Indonesia yang dikembangkan oleh tim Jagat. Ide intinya: pemain berburu koin virtual yang tersebar di lokasi nyata — di taman, jalan, gedung. Yang menemukan, mendapatkan poin atau hadiah. Konsep yang menarik dan buatan lokal.</p>
    <p>Yang dilakukan Koin Jagat dengan baik:</p>
    <ul>
      <li><strong>Lokal-pertama.</strong> Antarmuka Bahasa Indonesia, lokasi Indonesia, komunitas Indonesia.</li>
      <li><strong>Mekanika sederhana.</strong> Mudah dimulai, mudah dipahami.</li>
      <li><strong>Aktivasi outdoor.</strong> Membawa orang ke taman dan ruang publik.</li>
    </ul>
    <p>Tetapi ada keterbatasan yang dirasakan banyak pemain:</p>
    <ul>
      <li><strong>Server crash dan antrian.</strong> Pada peluncuran dan acara, server kewalahan.</li>
      <li><strong>Kedalaman gameplay terbatas.</strong> Setelah berburu beberapa koin, pengulangan menyusup.</li>
      <li><strong>Tidak ada kepemilikan persisten.</strong> Yang menemukan koin, mendapatkannya — tetapi tidak ada wilayah untuk dipertahankan jangka panjang.</li>
      <li><strong>Tidak ada komponen klan.</strong> Permainan terutama solo.</li>
    </ul>
            """,
        },
        {
            "label": "Apa yang ditambahkan MapRaiders",
            "title": "Apa yang <em>ditambahkan MapRaiders</em>",
            "body": "<p>MapRaiders mengambil titik awal yang sama (gerakan nyata, peta nyata) dan membangun lima lapisan tambahan:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Wilayah persisten</h3><p>Saat menaklukkan sebuah jalan, itu milik Anda — bukan koin yang menghilang setelah dikumpulkan. Pertahankan dan perluas selama berbulan-bulan.</p></div>
    <div class="feat-card rv d1"><h3>Klan organik</h3><p>Klan terbentuk dari lingkungan yang sama. Tetangga jadi sekutu — bukan server Discord asing.</p></div>
    <div class="feat-card rv d2"><h3>7 mini-game pertahanan</h3><p>Saat penyerang datang: tic-tac-toe, batu-gunting-kertas, mini-catur. Strategi memutuskan, bukan hanya kecepatan.</p></div>
    <div class="feat-card rv d3"><h3>Sistem Echo</h3><p>Tinggalkan pesan audio, foto, atau video di lokasi. Pemain lain menemukannya saat lewat. Lapisan sosial yang dalam.</p></div>
    <div class="feat-card rv d4"><h3>Mesin Decay</h3><p>Wilayah yang tidak aktif menyusut. Aktivitas mempertahankan tanah — peta tetap hidup.</p></div>
    <div class="feat-card rv d4"><h3>Server stabil</h3><p>Infrastruktur cloud global, tanpa antrian, tanpa server crash pada peluncuran.</p></div>
  </div>""",
        },
        {
            "label": "Perbandingan",
            "title": "Koin Jagat vs MapRaiders <em>secara langsung</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>Fitur</th><th>Koin Jagat</th><th>MapRaiders</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">Lokasi nyata</td><td class="check">✓</td><td class="check">✓</td></tr>
      <tr><td class="feat-name">Antarmuka Bahasa Indonesia</td><td class="check">✓</td><td class="check">✓</td></tr>
      <tr><td class="feat-name">Wilayah persisten</td><td class="cross">Tidak</td><td class="check">Ya, persisten</td></tr>
      <tr><td class="feat-name">Sistem klan</td><td class="cross">Terbatas</td><td class="check">Klan organik berbasis lingkungan</td></tr>
      <tr><td class="feat-name">Mini-game pertahanan</td><td class="cross">Tidak</td><td class="check">7 mini-game</td></tr>
      <tr><td class="feat-name">Sistem Echo (audio/foto/video)</td><td class="cross">Tidak</td><td class="check">Ya</td></tr>
      <tr><td class="feat-name">Server crash / antrian</td><td>Sering dilaporkan</td><td class="check">Tidak ada antrian</td></tr>
      <tr><td class="feat-name">Pembayaran lokal (GoPay/OVO/Dana)</td><td class="check">✓</td><td class="check">✓</td></tr>
      <tr><td class="feat-name">Tanpa iklan</td><td>Bervariasi</td><td class="check">100% tanpa iklan</td></tr>
      <tr><td class="feat-name">Hemat baterai (tanpa AR)</td><td class="check">✓</td><td class="check">✓</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Bermain bersamaan",
            "title": "<em>Pemain Koin Jagat juga bisa main MapRaiders bersamaan</em>",
            "body": """
    <p>Ini bukan keputusan &ldquo;atau&rdquo;. MapRaiders melengkapi Koin Jagat — tidak menggantikan. Anda bisa berburu koin di Koin Jagat di pagi hari, dan menaklukkan wilayah di MapRaiders saat jalan-jalan setelah berbuka. Kedua aplikasi menggunakan sensor GPS yang sama tanpa konflik.</p>
    <p>Banyak pemain beta Indonesia melaporkan: koin Jagat untuk burst harian cepat, MapRaiders untuk kedalaman jangka panjang. Jadwal yang sehat: pagi-Jagat, sore-MapRaiders.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Apakah MapRaiders pesaing Koin Jagat?",
         "a": "Tidak secara langsung. Kedua aplikasi memiliki titik awal yang sama (gerakan nyata, peta nyata) tetapi fokus berbeda. Koin Jagat: berburu koin cepat. MapRaiders: kepemilikan wilayah persisten + klan + mini-game. Banyak pemain memainkan keduanya — bersamaan."},
        {"q": "Mengapa MapRaiders tidak crash seperti Koin Jagat?",
         "a": "Infrastruktur cloud global dengan auto-scaling. Server kami menangani lonjakan tanpa antrian. Koin Jagat sering meningkat sangat cepat sehingga server lokal kewalahan — kami menggunakan strategi penyebaran berbeda dari hari pertama."},
        {"q": "Apakah Bahasa Indonesia didukung penuh?",
         "a": "Ya. MapRaiders sepenuhnya dilokalkan dalam Bahasa Indonesia — menu, sistem Echo, petunjuk, dukungan. Sama seperti Koin Jagat, kami memprioritaskan komunitas Indonesia."},
        {"q": "Bagaimana dengan UU PDP?",
         "a": "MapRaiders sepenuhnya sesuai UU PDP (UU Perlindungan Data Pribadi 2022). Tidak ada penjualan data, tidak ada SDK iklan, server di EU/AS dengan transparansi penuh tentang lokasi data."},
        {"q": "Bisakah saya transfer akun Koin Jagat ke MapRaiders?",
         "a": "Tidak. Mereka adalah game terpisah dengan akun terpisah. Tetapi pendaftaran MapRaiders memakan waktu 30 detik — masuk dengan email, dan Anda siap. Tidak ada akun yang hilang."},
    ],
    "internal_links": [
        ("/id/permainan-teritori.html", "Permainan teritori"),
        ("/id/game-lokasi.html", "Game lokasi 2026"),
        ("/id/alternatif-pokemon-go-gratis.html", "Alternatif Pokémon GO gratis"),
        ("/id/koin-jagat-alternatif-ulasan.html", "Ulasan Koin Jagat alternatif"),
        ("/id/mapraiders-ulasan.html", "Semua ulasan"),
    ],
}

# K5 — aplikasi-jalan-kaki-game
K5 = {
    "slug": "/id/aplikasi-jalan-kaki-game.html",
    "breadcrumb": "Aplikasi jalan kaki dengan game",
    "title": "Aplikasi jalan kaki dengan game — kardio + wilayah",
    "og_title": "Aplikasi jalan kaki dengan game — kardio + game + kesehatan",
    "meta": "Aplikasi jalan kaki dengan game? MapRaiders mengubah setiap jalan-jalan menjadi penaklukan wilayah. Kardio + game + kesehatan untuk seluruh keluarga.",
    "keywords": "aplikasi jalan kaki, aplikasi jalan kaki dengan game, jalan kaki game, game untuk jalan kaki, aplikasi kardio gps, strava wilayah",
    "badge": "Kardio + Game",
    "pricing_pill": "Free Forever · 4× lebih sedikit baterai dari Pokémon GO",
    "h1_html": 'Aplikasi jalan kaki dengan game — ketika <em>setiap langkah</em> menaklukkan wilayah',
    "lead": "Aplikasi jalan kaki memberi statistik. Game jalan kaki seperti Pokémon GO memberi koleksi. Tetapi tidak ada aplikasi yang mengubah jalan nyata Anda menjadi tanah nyata. MapRaiders melakukannya: setiap langkah membentuk wilayah, setiap putaran mempertahankannya. Kardio dengan konsekuensi. Keluarga bersama. Kesehatan sungguhan.",
    "trigger": {
        "quote": "Saya tetap lari setiap pagi. Dengan MapRaiders setiap rute punya tujuan: menjaga wilayah atau merebutnya kembali. Motivasi kardio saya meledak.",
        "author": "Vivian N., pelari dari wilayah Hamburg (beta tertutup)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "Masalah",
            "title": "Mengapa <em>aplikasi jalan kaki tradisional</em> tidak cukup",
            "body": """
    <p>Strava, Nike Run Club, Adidas Running — mengukur waktu, jarak, kecepatan. Tetapi tiga hal hilang untuk banyak orang Indonesia:</p>
    <ul>
      <li><strong>Tidak ada elemen game.</strong> Yang tidak mengejar rekor pribadi kehilangan motivasi dalam 4 minggu.</li>
      <li><strong>Tekanan performa.</strong> Leaderboard publik lebih demotivasi daripada membantu.</li>
      <li><strong>Memaksa langganan.</strong> Strava Premium Rp 130.000/bulan untuk peta panas dan perbandingan rute yang tidak berguna di paket gratis.</li>
    </ul>
            """,
        },
        {
            "label": "Solusi",
            "title": "Bagaimana MapRaiders <em>mengubah rutinitas</em> jalan kaki Anda",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Pertahankan wilayah</h3><p>Setiap rute mempertahankan tanah. Yang berhenti 3 hari melihat decay bertindak — insentif alami untuk kembali.</p></div>
    <div class="feat-card rv d1"><h3>Penghitung Decay</h3><p>Nilai Decay menunjukkan: &ldquo;Jika tidak lari hari ini, lingkunganmu menyusut X%&rdquo;. Tanpa rasa bersalah — hanya realitas fisik.</p></div>
    <div class="feat-card rv d2"><h3>Pertahanan klan saat lari</h3><p>Saat lari, push notifikasi memberitahu ketika wilayah klan diserang. Anda tidak lari sendiri — lari bersama.</p></div>
    <div class="feat-card rv d3"><h3>Hadiah via Echo</h3><p>Echo audio saat Anda lewat. Pemain lain menceritakan kisah jalanan — tanpa iklan, tanpa influencer.</p></div>
  </div>""",
        },
        {
            "label": "Strava komplemen",
            "title": "MapRaiders <em>melengkapi</em> Strava — bukan menggantikan",
            "body": """
    <p>MapRaiders tidak bersaing dengan Strava dalam metrik performa. Anda dapat menjalankan kedua aplikasi secara bersamaan, mereka menggunakan sensor GPS yang sama tanpa konflik. Yang tidak diberikan Strava: wilayah nyata dan pertahanan sosial. Yang tidak diberikan MapRaiders: analisis pace splits dan zona detak jantung yang detail.</p>
    <p>Kombinasi ideal: <strong>Strava untuk analisis teknis, MapRaiders untuk motivasi harian dan wilayah.</strong> Jalankan keduanya, tanpa rasa sakit.</p>
            """,
        },
        {
            "label": "Sehat 50+",
            "title": "Jalan kaki untuk <em>50+ tahun</em> — umur panjang ID",
            "body": """
    <p>Indonesia memiliki populasi 60+ yang berkembang pesat. Jalan kaki adalah aktivitas fisik yang paling direkomendasikan oleh dokter geriatri — tetapi motivasi kurang. MapRaiders memecahkan ini tanpa AR (yang membingungkan) dan tanpa kompetisi agresif (yang menjauhkan):</p>
    <ul>
      <li><strong>Kecepatan sendiri.</strong> Tidak ada kecepatan minimum. Walking, jalan kaki dengan tongkat, dengan teman — semua dihitung untuk wilayah.</li>
      <li><strong>Jalan yang sama setiap hari berhasil.</strong> Persistensi mengalahkan jarak. Yang mengulang, mempertahankan.</li>
      <li><strong>Komunitas lingkungan.</strong> Klan organik dengan tetangga. Tanpa Discord, tanpa chat toksik.</li>
      <li><strong>UU PDP-compatible.</strong> Untuk lansia yang khawatir tentang privasi — tanpa iklan tertarget, tanpa penjualan lokasi.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Berapa lama baterai bertahan?",
         "a": "Pada jalan kaki 1 jam, biasanya 15-25% baterai (vs ~50% di Pokémon GO dengan AR). Nilai bervariasi tergantung perangkat dan kecerahan layar."},
        {"q": "Apakah berfungsi dengan Strava atau Nike Run Club?",
         "a": "Saat ini tanpa integrasi langsung. Anda dapat menjalankan kedua aplikasi secara bersamaan — mereka menggunakan sensor GPS yang sama tanpa konflik. Integrasi Strava direncanakan untuk Q4 2026."},
        {"q": "Apakah walking lambat juga dihitung?",
         "a": "Ya. Tidak ada kecepatan minimum. Walking, jalan kaki lambat, jalan-jalan — semua membentuk wilayah, selama ada gerakan fisik nyata (tanpa auto-cheating)."},
        {"q": "Bisakah lansia menggunakan?",
         "a": "Ya, dirancang untuk semua usia. Tanpa AR, tanpa kebisingan, tanpa tekanan kecepatan. Huruf besar, kontras tinggi, kontrol sederhana."},
        {"q": "Berapa banyak data seluler yang dikonsumsi?",
         "a": "Sedang. Tanpa live-video, tanpa API berat. Jalan kaki 1 jam biasanya menggunakan 5-15 MB."},
    ],
    "internal_links": [
        ("/id/permainan-teritori.html", "Permainan teritori"),
        ("/id/game-lokasi.html", "Game lokasi 2026"),
        ("/id/permainan-ramadan.html", "Permainan Ramadan"),
        ("/id/aplikasi-jalan-kaki-game-ulasan.html", "Ulasan aplikasi jalan kaki"),
        ("/id/mapraiders-ulasan.html", "Semua ulasan"),
    ],
}

# K6 — harta-karun-aplikasi
K6 = {
    "slug": "/id/harta-karun-aplikasi.html",
    "breadcrumb": "Harta karun aplikasi",
    "title": "Harta karun aplikasi 2026 — seluruh kota live treasure hunt",
    "og_title": "Harta karun aplikasi — seluruh kota dipenuhi Echo tersembunyi",
    "meta": "Harta karun aplikasi 2026: live, seluruh kota, tanpa beli tour, tanpa iklan. MapRaiders mengubah kotamu menjadi perburuan harta karun terbuka. Keluarga, teman.",
    "keywords": "harta karun aplikasi, perburuan harta karun aplikasi, aplikasi harta karun, harta karun keluarga, geocaching alternatif indonesia",
    "badge": "Perburuan Harta Karun",
    "pricing_pill": "Free Forever · Tanpa beli tour · Seluruh kota",
    "h1_html": 'Harta karun aplikasi — <em>seluruh kota dipenuhi Echo</em> tersembunyi',
    "lead": "Aplikasi perburuan harta karun tradisional seperti Geocaching membutuhkan langganan premium dan tour yang telah ditentukan. MapRaiders membaliknya: Echo sudah tersebar di seluruh kota. Anda mengikuti jejak pemain lain atau meninggalkan jejak Anda sendiri. Live, gratis, tanpa beli tour, tanpa persiapan. Sangat Indonesia.",
    "trigger": {
        "quote": "Meninggalkan Echo dan melihat siapa yang menemukannya seperti perburuan harta karun terbuka di seluruh kota.",
        "author": "Aljoscha P., penjelajah kota dari wilayah Berlin (beta tertutup)"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Kriteria",
            "title": "Apa yang harus dimiliki <em>aplikasi harta karun modern</em>",
            "body": """
    <p>Tiga kriteria memisahkan aplikasi perburuan harta karun era 2020-an dari solusi cetak kertas:</p>
    <ul>
      <li><strong>Live.</strong> Petunjuk muncul secara real-time, bukan hanya dalam tour yang sudah dibuat.</li>
      <li><strong>Sosial.</strong> Pemain meninggalkan petunjuk satu sama lain, bukan hanya mengikuti.</li>
      <li><strong>Tanpa hambatan premium.</strong> Orang tua dan anak masuk pada saat itu juga, tanpa harus membeli tour Rp 50.000.</li>
    </ul>
            """,
        },
        {
            "label": "Perbandingan",
            "title": "Aplikasi perburuan harta karun <em>dibandingkan</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Aplikasi</th><th>Harga</th><th>Persiapan</th><th>Live?</th><th>Loop game</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Geocaching</td><td>Sub Premium ~Rp 100rb/bulan</td><td>Rendah — temukan cache</td><td class="cross">Asinkron</td><td>Mengumpulkan</td></tr>
      <tr><td class="feat-name">Actionbound</td><td>Tour / Sub</td><td>Tinggi — buat tour</td><td class="cross">✗</td><td>Per-tour</td></tr>
      <tr><td class="feat-name">Munzee</td><td>Premium-Sub</td><td>Sedang</td><td class="cross">Asinkron</td><td>Scan kode</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">Rp 0</td><td class="check">Nol</td><td class="check">Live</td><td>Echo + Misi + Wilayah</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Echo",
            "title": "Bagaimana MapRaiders <em>memikirkan ulang</em> perburuan harta karun",
            "body": """
    <p>Alih-alih tour linear dari stasiun 1 ke 10, MapRaiders menciptakan <strong>perburuan harta karun spasial terbuka</strong> — seluruh kota adalah taman bermain:</p>
    <ul>
      <li><strong>Tinggalkan Echo.</strong> Tinggalkan Echo audio, foto, atau video di sebuah tempat. Pemain lain menemukan saat lewat.</li>
      <li><strong>Temukan Echo.</strong> Lihat di peta di mana Echo berada. Ikuti jejak, temukan rahasia, dengar cerita.</li>
      <li><strong>Buat misi.</strong> Buat tugas kecil di lokasi (&ldquo;Foto pintu merah di sana&rdquo;). Pemain lain melaksanakan.</li>
      <li><strong>Lapisan wilayah.</strong> Yang sering melewati rute perburuan harta karun, menaklukkannya sebagai wilayah — jejak menjadi tanah.</li>
    </ul>
            """,
        },
        {
            "label": "Anak-anak",
            "title": "Aplikasi perburuan harta karun untuk <em>anak-anak dan keluarga</em>",
            "body": """
    <p>Perburuan harta karun adalah budaya masa kecil Indonesia — petunjuk dengan kapur, jejak daun, persembunyian akhir dengan permen. MapRaiders membawa ini ke era smartphone, tanpa membiarkan anak-anak sendirian di layar:</p>
    <ul>
      <li><strong>Aktivitas orang tua-anak.</strong> Orang tua meninggalkan Echo audio di rute yang direncanakan, anak-anak mengikuti jejak — gerakan analog, petunjuk digital.</li>
      <li><strong>Layar minimal, dunia maksimal.</strong> Aplikasi memandu di peta; pengalaman terjadi di dunia nyata.</li>
      <li><strong>UU PDP untuk anak-anak.</strong> Tanpa pelacak iklan personalisasi, tanpa penjualan data, tanpa chat dalam aplikasi tanpa persetujuan orang tua.</li>
      <li><strong>Mode keluarga.</strong> Acara privasi Idul Fitri, Tahun Baru Imlek, Hari Kemerdekaan — hanya untuk grup keluarga.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Apakah MapRaiders cocok untuk anak-anak?",
         "a": "Ya, mulai usia 9 tahun dengan pengawasan orang tua. Aplikasi sesuai UU PDP, tanpa iklan, dan tidak mengumpulkan data pribadi anak-anak. Orang tua dapat mengaktifkan mode keluarga."},
        {"q": "Berapa banyak persiapan yang saya butuhkan untuk perburuan dengan anak-anak?",
         "a": "Nol. Berbeda dari Actionbound atau Munzee, Anda tidak perlu membeli tour atau menyiapkan stasiun. Echo sudah tersebar di kota — cukup ikuti jejak pemain lain atau tinggalkan jejak Anda sendiri."},
        {"q": "Apakah aplikasi perburuan harta karun berbayar?",
         "a": "Tidak. Fungsi perburuan harta karun (meninggalkan Echo, menemukan Echo, membuat misi) sepenuhnya gratis. Secara opsional ada kosmetik mulai dari Rp 15.000 — tanpa keuntungan dalam permainan. Pembayaran via GoPay, OVO, Dana."},
        {"q": "Apakah berfungsi di kota kecil?",
         "a": "Ya. Bahkan di kota kecil atau lingkungan, Anda dapat meninggalkan Echo dan membuat misi. Di pusat kota Anda menemukan lebih banyak jejak pemain lain; di pedesaan, tour Anda memiliki lebih banyak ruang sendiri."},
        {"q": "Apakah aplikasi dalam Bahasa Indonesia?",
         "a": "Ya. MapRaiders sepenuhnya dilokalkan dalam Bahasa Indonesia — menu, sistem Echo, petunjuk, dukungan."},
    ],
    "internal_links": [
        ("/id/permainan-teritori.html", "Permainan teritori"),
        ("/id/game-lokasi.html", "Game lokasi 2026"),
        ("/id/permainan-ramadan.html", "Permainan Ramadan"),
        ("/id/harta-karun-aplikasi-ulasan.html", "Ulasan harta karun"),
        ("/id/mapraiders-ulasan.html", "Semua ulasan"),
    ],
}

# K7 — permainan-ramadan (ID-EXKLUSIV!)
K7 = {
    "slug": "/id/permainan-ramadan.html",
    "breadcrumb": "Permainan Ramadan",
    "title": "Permainan Ramadan — jalan-jalan setelah berbuka, gratis",
    "og_title": "Permainan Ramadan — setiap langkah punya makna",
    "meta": "Permainan untuk Ramadan: jalan-jalan keluarga setelah berbuka, taklukkan wilayah, hemat baterai. Tanpa iklan, tanpa biaya, sangat hormat.",
    "keywords": "permainan ramadan, game ramadan, aplikasi ramadan, jalan-jalan setelah berbuka, sahur game, idul fitri permainan",
    "badge": "Permainan Ramadan · Eksklusif ID",
    "pricing_pill": "Setiap langkah punya makna · Sangat hormat · Gratis",
    "h1_html": 'Permainan Ramadan — <em>setiap langkah</em> punya makna',
    "lead": "Ramadan adalah waktu istimewa: puasa, tarawih, sahur, iftar bersama keluarga. Setelah berbuka, banyak yang mencari aktivitas ringan untuk berjalan-jalan keluarga. MapRaiders cocok di sini secara hormat: jalan-jalan setelah Iftar menjadi penaklukan wilayah, ringan, hemat baterai, tanpa iklan. Tanpa mekanika judi, tanpa hadiah uang, hanya gerakan dan komunitas. Sangat hormat terhadap nilai-nilai Ramadan.",
    "trigger": {
        "quote": "Setiap langkah selama Ramadan punya makna.",
        "author": "MapRaiders, prinsip Ramadan-hormat"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Aktivitas Ramadan",
            "title": "Aktivitas Ramadan + <em>jalan-jalan</em>",
            "body": """
    <p>Ramadan memiliki ritme khasnya sendiri — dan jalan-jalan cocok di banyak titik dalam hari:</p>
    <ul>
      <li><strong>Setelah Sahur.</strong> Beberapa keluarga senang berjalan-jalan ringan setelah sahur sebelum matahari terbit — udara sejuk, jalanan tenang.</li>
      <li><strong>Sebelum Iftar.</strong> Saat menunggu adzan Maghrib, jalan-jalan singkat 15-20 menit di lingkungan dapat membantu mengalihkan perhatian dari rasa lapar.</li>
      <li><strong>Setelah Iftar dan sebelum Tarawih.</strong> Ini titik manis untuk jalan-jalan keluarga 30-45 menit. Energi kembali, suasana tenang.</li>
      <li><strong>Setelah Tarawih.</strong> Beberapa keluarga membuat &ldquo;tradisi jalan malam&rdquo; setelah salat malam — bertemu tetangga, anak-anak bermain.</li>
    </ul>
    <p>MapRaiders melayani semua titik ini secara diam-diam: Anda menaklukkan wilayah, melihat Echo, mempertahankan tanah klan — tanpa harus melihat layar terus-menerus. Aplikasi memandu di latar belakang.</p>
            """,
        },
        {
            "label": "Setelah Iftar",
            "title": "Setelah berbuka — <em>kegiatan ringan</em>, wilayah mengalir",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Kalori turun, wilayah naik</h3><p>Jalan-jalan 30-45 menit setelah Iftar membakar 100-150 kalori — dan menaklukkan wilayah pada saat yang sama. Konsekuensi sehat tanpa tekanan.</p></div>
    <div class="feat-card rv d1"><h3>Aktivitas keluarga</h3><p>Anak-anak, orang tua, kakek-nenek — semua dengan kecepatannya sendiri. MapRaiders bekerja dengan walking lambat sama baiknya dengan lari.</p></div>
    <div class="feat-card rv d2"><h3>Echo komunitas</h3><p>Tinggalkan Echo audio singkat di masjid lingkungan atau jalanan favorit. Komunitas Ramadan terbentuk secara organik.</p></div>
    <div class="feat-card rv d3"><h3>Hemat baterai untuk Tarawih</h3><p>Jalan-jalan 1 jam menggunakan 15-20% baterai. Anda masih memiliki cukup daya untuk Tarawih, panggilan keluarga, alarm sahur.</p></div>
  </div>""",
        },
        {
            "label": "Keluarga + anak",
            "title": "Keluarga dan <em>anak-anak</em> selama Ramadan",
            "body": """
    <p>Ramadan adalah waktu keluarga di Indonesia. MapRaiders mendukung ini, tidak menggantikan:</p>
    <ul>
      <li><strong>Aktivitas bersama, bukan layar individu.</strong> Aplikasi memandu di latar belakang; perhatian tetap pada keluarga, bukan ponsel.</li>
      <li><strong>Anak-anak belajar lingkungan mereka.</strong> Sambil menaklukkan wilayah, anak-anak melihat masjid, taman, jalan baru di lingkungan mereka.</li>
      <li><strong>Tanpa mekanika judi.</strong> Tidak ada hadiah acak, tidak ada loot box, tidak ada hadiah uang — hanya gerakan dan wilayah.</li>
      <li><strong>UU PDP untuk anak-anak.</strong> Tanpa iklan, tanpa pelacakan, tanpa berbagi data dengan platform iklan.</li>
      <li><strong>Mode keluarga.</strong> Buat acara privasi hanya untuk keluarga Anda — &ldquo;Tour Ramadan keluarga Ahmad&rdquo;.</li>
    </ul>
            """,
        },
        {
            "label": "Idul Fitri lanjutkan",
            "title": "<em>Idul Fitri</em> dan setelahnya — lanjutkan kebiasaan",
            "body": """
    <p>Setelah Ramadan, banyak yang kehilangan ritme jalan-jalan harian. MapRaiders membantu mempertahankannya:</p>
    <ul>
      <li><strong>Wilayah Ramadan tetap.</strong> Tanah yang Anda taklukkan selama Ramadan adalah milik Anda — pertahankan setelah Idul Fitri dengan jalan-jalan reguler.</li>
      <li><strong>Tradisi mudik berlanjut.</strong> Saat mudik, Anda dapat menaklukkan wilayah baru di kampung halaman — kenangan yang bertahan lama.</li>
      <li><strong>Klan Ramadan.</strong> Klan yang terbentuk dari jalan-jalan Ramadan dapat berlanjut sebagai komunitas lingkungan sepanjang tahun.</li>
      <li><strong>Hari Kemerdekaan, Idul Adha, Tahun Baru.</strong> Setiap acara budaya menjadi alasan baru untuk gerakan dan komunitas.</li>
    </ul>
    <p>Bulan Ramadan adalah pintu masuk — bukan akhir. MapRaiders memberi alasan untuk tetap aktif sepanjang tahun, dengan rasa hormat penuh terhadap budaya dan agama.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Apakah MapRaiders sesuai dengan nilai-nilai Ramadan?",
         "a": "Ya. Tidak ada mekanika judi (tanpa loot box, tanpa hadiah acak), tidak ada hadiah uang, tidak ada iklan yang mengganggu — hanya gerakan dan komunitas. Konsep dasar (jalan-jalan, keluarga, lingkungan) selaras dengan nilai-nilai Ramadan."},
        {"q": "Bisakah saya bermain saat puasa tanpa kelelahan?",
         "a": "Ya. MapRaiders dirancang untuk gerakan ringan. Anda tidak perlu lari atau berolahraga keras. Walking santai cukup. Yang terbaik: jalan-jalan singkat sebelum Iftar atau setelah Tarawih."},
        {"q": "Apakah aplikasi bekerja saat berpuasa di Ramadan?",
         "a": "Tentu saja. Aplikasi tidak peduli apakah Anda berpuasa atau tidak — hanya melacak gerakan GPS Anda. Banyak penguji beta melaporkan bahwa MapRaiders membuat puasa lebih mudah karena aktivitas ringan setelah Iftar terasa bermakna."},
        {"q": "Adakah acara Ramadan khusus dalam permainan?",
         "a": "Ya, kami merencanakan acara Ramadan tahunan dengan tema Iftar, kosmetik bertema Ramadan (opsional, tanpa keuntungan permainan), dan tantangan keluarga. Semua sangat hormat — tanpa komersialisasi."},
        {"q": "Bagaimana dengan privasi selama Ramadan?",
         "a": "MapRaiders sesuai UU PDP. Lokasi masjid, rute Tarawih, jadwal sahur Anda tidak dijual ke jaringan iklan. Server di EU/AS, transparansi penuh."},
    ],
    "internal_links": [
        ("/id/permainan-teritori.html", "Permainan teritori"),
        ("/id/game-lokasi.html", "Game lokasi 2026"),
        ("/id/aplikasi-jalan-kaki-game.html", "Aplikasi jalan kaki dengan game"),
        ("/id/permainan-ramadan-ulasan.html", "Ulasan permainan Ramadan"),
        ("/id/mapraiders-ulasan.html", "Semua ulasan"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/id/permainan-teritori-ulasan.html",
        "breadcrumb": "Permainan teritori ulasan",
        "title": "Permainan teritori ulasan — penguji beta tentang MapRaiders",
        "og_title": "Permainan teritori — ulasan beta nyata",
        "meta": "Ulasan permainan teritori dalam kehidupan sehari-hari: tiga penguji beta melaporkan bagaimana penaklukan tanah, decay, dan mini-game pertahanan bekerja di ruang kota nyata.",
        "keywords": "permainan teritori ulasan, permainan teritori tes, taklukkan wilayah aplikasi ulasan",
        "h1_html": 'Permainan teritori — ketika <em>jalan-jalanmu</em> milikmu',
        "lead": "Bagaimana rasanya menaklukkan jalan secara nyata? Tiga penguji beta melaporkan tentang wilayah pertama, kejutan Decay pertama, dan mini-game pertahanan pertama.",
        "intro_label": "Apa yang penting dalam tes?",
        "intro_title": "Apa yang membuat <em>permainan teritori</em> nyata",
        "intro_body": """
    <p>Dalam tes teritori, tiga sumbu pengalaman penting:</p>
    <ul>
      <li><strong>Penaklukan.</strong> Kapan jalan pertama terasa seperti &ldquo;tanah saya&rdquo;?</li>
      <li><strong>Kerugian.</strong> Bagaimana bereaksi terhadap Decay pertama atau kekalahan pertama dari penyerang?</li>
      <li><strong>Pertahanan.</strong> Bagaimana rasanya mini-game pertahanan — taktis, adil, frustrasi?</li>
    </ul>
    <p>Kutipan dari ketiga penguji mencakup ketiga sumbu dari perspektif yang sangat berbeda.</p>
        """,
        "internal_links": [
            ("/id/permainan-teritori.html", "Permainan teritori"),
            ("/id/game-lokasi.html", "Game lokasi 2026"),
            ("/id/game-lokasi-ulasan.html", "Ulasan game lokasi"),
            ("/id/mapraiders-ulasan.html", "Semua ulasan"),
        ],
    },
    {
        "slug": "/id/game-lokasi-ulasan.html",
        "breadcrumb": "Game lokasi ulasan",
        "title": "Game lokasi ulasan — MapRaiders dalam tes nyata",
        "og_title": "Game lokasi — ulasan dari penguji beta",
        "meta": "Ulasan game lokasi: tiga penguji beta melaporkan tentang baterai, akurasi GPS, privasi, dan kesenangan nyata dalam kehidupan sehari-hari di kota.",
        "keywords": "game lokasi ulasan, game lokasi tes, gps mmo tes, mapraiders ulasan",
        "h1_html": 'Game lokasi — <em>ulasan</em> dari penguji beta',
        "lead": "Seberapa akurat GPS di pusat kota? Berapa banyak baterai yang dikonsumsi aplikasi pada rute panjang? Bagaimana rasanya kepatuhan UU PDP di sisi pemain? Tiga penguji menjawab dengan jujur.",
        "intro_label": "Sumbu tes",
        "intro_title": "Apa yang kami uji dalam <em>game lokasi</em>",
        "intro_body": """
    <p>Tes game lokasi berkisar pada empat sumbu konkret:</p>
    <ul>
      <li><strong>Akurasi GPS</strong> di celah kota dan di bawah jembatan.</li>
      <li><strong>Konsumsi baterai</strong> pada perjalanan 1-2 jam (dibandingkan dengan Pokémon GO).</li>
      <li><strong>Sensasi privasi</strong>: berapa banyak gangguan pelacakan yang muncul?</li>
      <li><strong>Mekanika permainan</strong>: wilayah, Echo, dan misi bekerja dalam hari nyata?</li>
    </ul>
        """,
        "internal_links": [
            ("/id/game-lokasi.html", "Game lokasi 2026"),
            ("/id/permainan-teritori.html", "Permainan teritori"),
            ("/id/permainan-teritori-ulasan.html", "Ulasan permainan teritori"),
            ("/id/mapraiders-ulasan.html", "Semua ulasan"),
        ],
    },
    {
        "slug": "/id/alternatif-pokemon-go-gratis-ulasan.html",
        "breadcrumb": "Alternatif Pokémon GO ulasan",
        "title": "Alternatif Pokémon GO gratis ulasan — penguji beta menjawab",
        "og_title": "Alternatif Pokémon GO gratis ulasan — beta-tes jujur",
        "meta": "Apakah alternatif Pokémon GO gratis sepadan? Tiga penguji beta dari Stuttgart, Hamburg, dan Berlin menjawab secara jujur tentang kardio, jalan-jalan, dan eksplorasi kota.",
        "keywords": "alternatif pokemon go ulasan, alternatif pokemon go sepadan, mapraiders ulasan, beta tester laporan",
        "h1_html": 'Alternatif Pokémon GO gratis — <em>sepadan kah?</em>',
        "lead": "Tiga penguji beta dari tiga wilayah metropolitan Jerman menggunakan MapRaiders selama beberapa minggu. Berikut laporan tanpa filter — tanpa marketing-talk, tanpa kode influencer.",
        "intro_label": "Siapa yang menguji?",
        "intro_title": "Tiga orang, tiga <em>kasus penggunaan</em>",
        "intro_body": """
    <p>Ketiga penguji beta mencakup tiga persona yang sangat berbeda — dan itulah yang membuat perbandingan dengan Pokémon GO menjadi jujur:</p>
    <ul>
      <li><strong>Ron C.</strong> dari wilayah Stuttgart: pemilik anjing, jalan-jalan harian, tanpa latar belakang gamer.</li>
      <li><strong>Vivian N.</strong> dari wilayah Hamburg: pelari, bermain Pokémon GO pada 2018 dan berhenti setelah 3 bulan.</li>
      <li><strong>Aljoscha P.</strong> dari wilayah Berlin: penjelajah kota, veteran Ingress, mengenal ekosistem Niantic dari tangan pertama.</li>
    </ul>
    <p>Ketiganya menguji MapRaiders secara independen — tanpa promosi berbayar, tanpa skrip. Kutipan diterjemahkan dari bahasa Jerman asli.</p>
        """,
        "internal_links": [
            ("/id/alternatif-pokemon-go-gratis.html", "Alternatif Pokémon GO gratis"),
            ("/id/game-lokasi.html", "Game lokasi 2026"),
            ("/id/game-lokasi-ulasan.html", "Ulasan game lokasi"),
            ("/id/mapraiders-ulasan.html", "Semua ulasan"),
        ],
    },
    {
        "slug": "/id/koin-jagat-alternatif-ulasan.html",
        "breadcrumb": "Koin Jagat alternatif ulasan",
        "title": "Koin Jagat alternatif ulasan — tes nyata penguji beta",
        "og_title": "Koin Jagat alternatif — ulasan beta",
        "meta": "Ulasan Koin Jagat alternatif: penguji beta menguji MapRaiders sebagai pesaing lokal Indonesia — wilayah, klan, server stabil.",
        "keywords": "koin jagat alternatif ulasan, jagat alternatif tes, mapraiders ulasan indonesia",
        "h1_html": 'Koin Jagat alternatif — <em>ulasan jujur</em>',
        "lead": "Pemain Koin Jagat di Indonesia menyukai konsep gerakan + lokasi nyata. Tetapi server crash dan kedalaman gameplay menyebabkan frustrasi. Apakah MapRaiders memenuhi celah? Tiga penguji beta menjawab.",
        "intro_label": "Pertanyaan tes",
        "intro_title": "Bagaimana <em>MapRaiders berbeda</em> dari Koin Jagat?",
        "intro_body": """
    <p>Penguji beta menilai aplikasi sepanjang lima sumbu langsung dibandingkan dengan Koin Jagat:</p>
    <ul>
      <li><strong>Stabilitas server.</strong> Tanpa crash, tanpa antrian?</li>
      <li><strong>Kedalaman gameplay.</strong> Apakah ada lebih dari sekadar &ldquo;mengumpulkan&rdquo;?</li>
      <li><strong>Persistensi wilayah.</strong> Apakah penaklukan saya bertahan?</li>
      <li><strong>Lapisan klan.</strong> Apakah komunitas terbentuk secara organik?</li>
      <li><strong>Lokalisasi Bahasa Indonesia.</strong> Apakah terasa lokal atau diterjemahkan secara mekanis?</li>
    </ul>
        """,
        "internal_links": [
            ("/id/koin-jagat-alternatif.html", "Koin Jagat alternatif"),
            ("/id/permainan-teritori.html", "Permainan teritori"),
            ("/id/game-lokasi.html", "Game lokasi 2026"),
            ("/id/mapraiders-ulasan.html", "Semua ulasan"),
        ],
    },
    {
        "slug": "/id/aplikasi-jalan-kaki-game-ulasan.html",
        "breadcrumb": "Aplikasi jalan kaki ulasan",
        "title": "Aplikasi jalan kaki dengan game ulasan — tes nyata",
        "og_title": "Aplikasi jalan kaki dengan game — sepadan kah?",
        "meta": "Apakah aplikasi jalan kaki dengan game sepadan? Penguji beta melaporkan tentang motivasi kardio, baterai pada rute panjang, dan kerugian wilayah setelah jeda karena sakit.",
        "keywords": "aplikasi jalan kaki ulasan, aplikasi jalan kaki dengan game ulasan, kardio aplikasi tes",
        "h1_html": 'Aplikasi jalan kaki dengan game — <em>sepadan kah?</em>',
        "lead": "Apa yang terjadi pada motivasi berjalan ketika setiap rute mempertahankan tanah nyata? Bagaimana rasanya Decay pertama setelah jeda karena flu? Tiga penguji beta — pelari, walker, penjelajah kota — menjawab.",
        "intro_label": "Sumbu tes",
        "intro_title": "Apa yang harus diberikan <em>aplikasi jalan kaki</em>",
        "intro_body": """
    <p>Kami menguji pengalaman jalan kaki dalam tiga sumbu:</p>
    <ul>
      <li><strong>Jangkar motivasi.</strong> Kapan seseorang kembali setelah jeda?</li>
      <li><strong>Baterai pada rute panjang.</strong> Perjalanan 60-90 menit tanpa menguras ponsel.</li>
      <li><strong>Cross-modalitas.</strong> Apakah berfungsi sama untuk lari, walking, dan jalan-jalan dengan anjing?</li>
    </ul>
        """,
        "internal_links": [
            ("/id/aplikasi-jalan-kaki-game.html", "Aplikasi jalan kaki dengan game"),
            ("/id/permainan-ramadan.html", "Permainan Ramadan"),
            ("/id/game-lokasi.html", "Game lokasi 2026"),
            ("/id/mapraiders-ulasan.html", "Semua ulasan"),
        ],
    },
    {
        "slug": "/id/harta-karun-aplikasi-ulasan.html",
        "breadcrumb": "Harta karun aplikasi ulasan",
        "title": "Harta karun aplikasi ulasan — penguji beta di MapRaiders",
        "og_title": "Harta karun aplikasi — ulasan beta nyata",
        "meta": "Ulasan aplikasi perburuan harta karun tanpa beli tour atau persiapan: penguji beta melaporkan bagaimana MapRaiders mengubah seluruh kota menjadi perburuan harta karun langsung.",
        "keywords": "harta karun aplikasi ulasan, harta karun aplikasi tes, live perburuan harta karun ulasan, keluarga harta karun",
        "h1_html": 'Harta karun aplikasi — <em>ulasan</em> tanpa beli tour',
        "lead": "Sebagian besar aplikasi perburuan harta karun memerlukan persiapan: beli tour, rencanakan rute, atur stasiun. Bagaimana rasanya ketika seluruh kota sudah penuh dengan petunjuk? Tiga penguji beta menjawab.",
        "intro_label": "Pertanyaan tes",
        "intro_title": "Apakah <em>perburuan harta karun langsung</em> bekerja tanpa persiapan?",
        "intro_body": """
    <p>Kami menguji fungsi perburuan harta karun dalam tiga skenario:</p>
    <ul>
      <li><strong>Sendirian</strong> sebagai penjelajah kota (Aljoscha P.) — meninggalkan Echo, menemukan Echo.</li>
      <li><strong>Dengan anjing</strong> dalam jalan-jalan normal (Ron C.) — petunjuk sebagai produk sampingan dari jalan-jalan.</li>
      <li><strong>Skenario keluarga</strong> disimulasikan — seberapa cepat orang dewasa + anak-anak memahami mekanika?</li>
    </ul>
        """,
        "internal_links": [
            ("/id/harta-karun-aplikasi.html", "Harta karun aplikasi"),
            ("/id/game-lokasi.html", "Game lokasi 2026"),
            ("/id/permainan-teritori.html", "Permainan teritori"),
            ("/id/mapraiders-ulasan.html", "Semua ulasan"),
        ],
    },
    {
        "slug": "/id/permainan-ramadan-ulasan.html",
        "breadcrumb": "Permainan Ramadan ulasan",
        "title": "Permainan Ramadan ulasan — tes hormat selama bulan suci",
        "og_title": "Permainan Ramadan — ulasan hormat",
        "meta": "Ulasan permainan Ramadan: penguji beta menguji MapRaiders sebagai pendamping Ramadan yang hormat — jalan-jalan setelah Iftar, aktivitas keluarga, hemat baterai untuk Tarawih.",
        "keywords": "permainan ramadan ulasan, game ramadan tes, jalan-jalan iftar ulasan, mapraiders ramadan",
        "h1_html": 'Permainan Ramadan — <em>ulasan hormat</em>',
        "lead": "Apakah permainan dapat berfungsi secara hormat selama Ramadan? Bagaimana rasanya jalan-jalan setelah Iftar dengan elemen game? Apakah anak-anak terlibat tanpa terganggu? Tiga penguji beta menjawab.",
        "intro_label": "Pertanyaan tes",
        "intro_title": "Apa yang membuat <em>permainan Ramadan-hormat</em>",
        "intro_body": """
    <p>Kami menguji pengalaman selama Ramadan di empat sumbu — semuanya dengan kepekaan terhadap budaya dan agama:</p>
    <ul>
      <li><strong>Tanpa mekanika judi.</strong> Apakah aplikasi sungguh-sungguh tidak ada loot box, hadiah uang, atau acak?</li>
      <li><strong>Aktivitas keluarga.</strong> Apakah anak-anak dapat ikut serta tanpa terganggu dari nilai-nilai Ramadan?</li>
      <li><strong>Konsumsi baterai untuk Tarawih.</strong> Apakah masih ada cukup daya setelah jalan-jalan?</li>
      <li><strong>Sensasi hormat.</strong> Apakah aplikasi terasa pantas selama bulan suci, atau apakah ada elemen mengganggu?</li>
    </ul>
        """,
        "internal_links": [
            ("/id/permainan-ramadan.html", "Permainan Ramadan"),
            ("/id/aplikasi-jalan-kaki-game.html", "Aplikasi jalan kaki dengan game"),
            ("/id/game-lokasi.html", "Game lokasi 2026"),
            ("/id/mapraiders-ulasan.html", "Semua ulasan"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/id/mapraiders-ulasan.html",
    "breadcrumb": "MapRaiders ulasan",
    "title": "MapRaiders ulasan — beta-tes, pendiri, semua halaman",
    "og_title": "MapRaiders ulasan — semua di satu tempat",
    "meta": "MapRaiders ulasan: 5,0 dari 5 bintang dalam tiga beta-tes terverifikasi, pernyataan pendiri, semua halaman Killer dan laporan ulasan terhubung secara terpusat.",
    "keywords": "mapraiders ulasan, mapraiders ulasan, mapraiders tes, gps mmo ulasan indonesia",
    "badge": "Hub & Tinjauan",
    "pricing_pill": "5,0 / 5 — 3 ulasan beta terverifikasi",
    "h1_html": '<em>MapRaiders ulasan</em> — semua yang perlu Anda ketahui tentang GPS MMO',
    "lead": "Tiga penguji beta dari Stuttgart, Hamburg, dan Berlin. Tujuh topik Killer dari perbandingan dengan Pokémon GO ke aplikasi perburuan harta karun. Tujuh ulasan terperinci. Satu hub.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "Apa itu MapRaiders sebenarnya?",
         "a": "MapRaiders adalah GPS MMO untuk Android. Pemain menaklukkan wilayah nyata melalui gerakan, meninggalkan Echo, membuat misi, dan mempertahankan tanah mereka dengan mini-game. Tanpa iklan, sesuai UU PDP, gratis. Pembayaran GoPay/OVO/Dana untuk kosmetik."},
        {"q": "Berapa banyak penguji beta?",
         "a": "Saat ini tiga orang yang kami publikasikan — dengan persetujuan mereka dan dengan nama depan + inisial untuk alasan privasi. Beta tertutup secara keseluruhan lebih besar; ketiga yang dikutip mewakili persona utama."},
        {"q": "Apakah ulasan nyata?",
         "a": "Ya. Ketiga penguji adalah orang-orang sungguhan dari beta tertutup di Jerman. Mereka tidak dibayar; kutipan mereka awalnya ditulis dalam bahasa Jerman dan diterjemahkan ke Bahasa Indonesia. Dalam markup Schema.org mereka ditandai dengan tanggal, bahasa, dan referensi ke asli Jerman (translationOfWork)."},
        {"q": "Di mana saya bisa menjadi penguji beta di Indonesia?",
         "a": "Daftar di halaman beranda Indonesia dengan email Anda. Slot beta Indonesia akan dibuka dalam gelombang setelah peluncuran utama — prioritas untuk pelari, penjelajah kota, dan keluarga di kota dengan kepadatan Pokémon GO rendah."},
        {"q": "Kapan aplikasi resmi rilis di Indonesia?",
         "a": "MapRaiders dalam beta tertutup di Google Play (Jerman). Peluncuran ID resmi direncanakan untuk akhir 2026. iOS pada Q3 2026."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print("=== Phase 1 — ID (Bahasa Indonesia) Killer-URL Builder ===")
    print(f"Output: {OUT_DIR}")
    print()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    written = []

    # 1. Killer pages
    for page in ALL_KILLERS:
        out_path = DOCS / page["slug"].lstrip("/")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = render_killer_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(out_path.name)
        print(f"  [KILLER] {page['slug']}  ({len(html):,} bytes)")

    # 2. Twin pages
    for page in TWINS_DATA:
        out_path = DOCS / page["slug"].lstrip("/")
        html = render_twin_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(out_path.name)
        print(f"  [TWIN]   {page['slug']}  ({len(html):,} bytes)")

    # 3. Hub
    all_killer_links = [(p["slug"], p["breadcrumb"]) for p in ALL_KILLERS]
    all_twin_links = [(p["slug"], p["breadcrumb"]) for p in TWINS_DATA]
    out_path = DOCS / HUB["slug"].lstrip("/")
    html = render_hub_page(HUB, all_killer_links, all_twin_links)
    out_path.write_text(html, encoding="utf-8")
    written.append(out_path.name)
    print(f"  [HUB]    {HUB['slug']}  ({len(html):,} bytes)")

    print()
    print(f"=== {len(written)} files written ===")
    for n in written:
        print(f"  id/{n}")


if __name__ == "__main__":
    main()

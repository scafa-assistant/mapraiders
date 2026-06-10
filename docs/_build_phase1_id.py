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
    "role": "Pemilik anjing, wilayah Stuttgart",
    "role_long": "Pemilik anjing dari wilayah Stuttgart (beta tertutup)",
    "quote": "Anjing saya tetap harus jalan dua kali sehari, jadi sekalian saya bawa aplikasinya. Kedengarannya konyol, tapi setiap malam saya sempatkan lihat sebentar, masih biru semua atau belum.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "Pelari, wilayah Hamburg",
    "role_long": "Pelari dari wilayah Hamburg (beta tertutup)",
    "quote": "Pagi saya tetap lari seperti biasa, cuma sekarang ada yang harus saya jaga. Rute Alster itu wilayah saya, dan saya pengen tetap begitu. Aneh seberapa besar disiplin yang tiba-tiba muncul karena hal kecil ini.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "Penjelajah kota, wilayah Berlin",
    "role_long": "Penjelajah kota dari wilayah Berlin (beta tertutup)",
    "quote": "Saya taruh klip audio singkat di pintu masuk gedung, tiga hari kemudian seseorang yang tidak saya kenal menemukannya. Untuk sebuah game, rasanya cukup pribadi.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder Quote ID (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "Saya main Pokémon GO selama tiga tahun, lalu berhenti. Yang saya cari tidak pernah datang: "
    "tanah yang benar-benar milik saya, bukan gym yang hilang dalam beberapa jam. Waktu pengambilalihan "
    "Saudi terjadi di 2025, untuk saya jelas bahwa arah Niantic bukan arah yang saya inginkan. "
    "Jadi saya bangun MapRaiders sendiri. Tanpa iklan, tanpa tekanan investor, tanpa langganan wajib. "
    "Lingkungan saya, lapangan saya. Lingkungan kamu, terserah kamu."
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
      Catatan: penguji adalah peserta beta tertutup di Jerman. Atas permintaan mereka kami hanya memakai nama depan dan inisial, demi privasi. Ulasan diterjemahkan dari bahasa Jerman asli ke Bahasa Indonesia.
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
  <p class="f-copy">&copy; 2026 MapRaiders. Lingkunganmu, wilayahmu. Scafa Investments LLC.</p>
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
        "name": "MapRaiders ID: semua halaman Killer dan ulasan",
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
  <h2 class="rv">Lebih dalam ke <em>lapangan</em></h2>
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
  <cite>– {page['trigger']['author']}</cite>
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
  <h2 class="sec-title rv d1">5,0 dari 5 bintang, <em>tiga ulasan beta</em></h2>
  <div class="prose rv d2">
    <p>Ron jalan-jalan setiap hari dengan anjingnya, Vivian lari pagi, Aljoscha menjelajahi Berlin dengan jalan kaki. Tiga-tiganya memakai MapRaiders beberapa minggu di rutinitas mereka sendiri dan menulis balik dalam bahasa Jerman. Kutipan di bawah ini sudah diterjemahkan ke Bahasa Indonesia. Demi privasi, kami hanya pakai nama depan dan inisial.</p>
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
    <p>Di sini ada tujuh halaman Killer plus tujuh ulasan terperinci. Setiap halaman melihat MapRaiders dari sudut yang berbeda: sebagai alternatif Pokémon GO, sebagai aplikasi perburuan harta karun, sebagai pendamping lari, sebagai aktivitas Ramadan. Kamu bisa baca satu per satu, atau ikut alurnya dari topik ke topik.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Ulasan terperinci</div>
  <h2 class="sec-title rv d1">Apa yang dilaporkan penguji <em>dari sudut berbeda</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Ulasan Agregat</div>
  <h2 class="sec-title rv d1">5,0 dari 5 bintang, <em>tiga ulasan beta</em></h2>
  <div class="prose rv d2">
    <p>Ulasan berasal dari beta tertutup antara Februari dan April 2026. Ron menguji di Stuttgart, Vivian di Hamburg, Aljoscha di Berlin. Mereka memakai aplikasi di rutenya sendiri, bukan dalam setting tes buatan. Ulasan asli ditulis dalam bahasa Jerman, dan mewakili orang sungguhan.</p>
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
    "title": "Permainan teritori: taklukkan wilayahmu di dunia nyata",
    "og_title": "Permainan teritori: tanah yang benar-benar milikmu",
    "meta": "Permainan teritori untuk smartphone. MapRaiders adalah GPS MMO dengan kepemilikan wilayah persisten. Tanpa iklan, tanpa biaya, AR tidak diperlukan.",
    "keywords": "permainan teritori, game teritori, permainan wilayah, taklukkan wilayah aplikasi, gps mmo indonesia",
    "badge": "Permainan Teritori",
    "pricing_pill": "Gratis selamanya. Cosmetic opsional. Tanpa iklan.",
    "h1_html": 'Permainan teritori: taklukkan <em>lingkunganmu</em> di dunia nyata',
    "lead": "Permainan teritori seharusnya lebih dari titik di peta yang menghilang dalam lima menit. MapRaiders memakai GPS, penangkapan area persisten, dan sistem pertahanan yang bikin penaklukan terasa nyata. Kamu jalan di sebuah jalan, jalan itu jadi milikmu. Selama kamu masih melewatinya. Tanpa fake GPS, tanpa AR yang bikin baterai habis, tanpa iklan.",
    "trigger": {
        "quote": "Taklukkan lingkunganmu.",
        "author": "MapRaiders, prinsip merek"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Definisi",
            "title": "Apa yang membuat sebuah <em>permainan teritori jadi nyata</em>",
            "body": """
    <p><strong>Permainan teritori</strong> adalah game di mana pemain memiliki area yang diklaim di peta secara persisten, lalu mempertahankan dan memperluasnya. Tidak seperti game capture (gym, portal), kepemilikan tetap berlaku walau pemain sedang offline.</p>
    <p>Ada empat mekanisme yang penting di sini:</p>
    <ul>
      <li><strong>Persistensi.</strong> Area yang sudah ditaklukkan tetap milik pemain atau klan, sampai diambil secara aktif oleh pihak lain.</li>
      <li><strong>Decay.</strong> Wilayah yang tidak diaktivasi akan menyusut seiring waktu. Tidak ada yang bisa memblokir tanah selamanya tanpa bermain.</li>
      <li><strong>Pertahanan.</strong> Saat diserang, mini-game antara dua pemain yang memutuskan, bukan adu stat otomatis.</li>
      <li><strong>Transfer klan.</strong> Wilayah bisa diberikan ke teman atau klan, dan dari situ muncul lapisan ekonomi.</li>
    </ul>
            """,
        },
        {
            "label": "Sistem MapRaiders",
            "title": "<em>Sistem teritori</em> MapRaiders secara rinci",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Klaim</h3><p>Jalan kaki, jalan-jalan dengan anjing, atau gowes lewat sebuah jalan. Jejak GPS-mu menghasilkan wilayah atas namamu, sebagai poligon yang terlihat di peta.</p></div>
    <div class="feat-card rv d1"><h3>Mesin Decay</h3><p>Yang tidak rutin lewat akan melihat wilayahnya menyusut beberapa persen per hari. Aktivitas yang menjaga tanah, bukan uang.</p></div>
    <div class="feat-card rv d2"><h3>Mini-game pertahanan</h3><p>Tujuh mini-game memutuskan setiap serangan: tic-tac-toe, batu-gunting-kertas, mini-catur, dan beberapa lainnya. Strategi lebih berarti daripada jam main.</p></div>
    <div class="feat-card rv d3"><h3>Wilayah klan</h3><p>Beberapa pemain bisa menjaga satu wilayah bersama. Area klan lebih sulit dirobohkan, satu penyerang biasanya tidak cukup.</p></div>
  </div>""",
        },
        {
            "label": "Beda dari Pokémon GO",
            "title": "Kenapa Pokémon GO dan Ingress <em>bukan</em> permainan teritori beneran",
            "body": """
    <p><strong>Gym di Pokémon GO</strong> sifatnya sementara. Yang menahan posisi terlama dapat koin, tapi gym sendiri bukan tanah yang dimiliki. Gym itu titik di peta, bukan area.</p>
    <p><strong>Portal Ingress</strong> mirip. Titik yang dihubungkan dengan link jadi segitiga. Game mengenali ladang antar portal, tapi tidak ada kepemilikan tanah yang permanen. Yang seminggu tidak buka aplikasi tidak benar-benar kehilangan &ldquo;lingkungannya&rdquo;, karena lingkungannya memang tidak pernah jadi miliknya.</p>
    <p>MapRaiders mulai dari sini. <strong>Wilayah adalah sumber daya permainan</strong>, bukan sekadar titik di atasnya. Kamu dapat tanah, kehilangan tanah, mengoper tanah, persis seperti permainan ruang yang sungguhan.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Bagaimana sistem wilayah di MapRaiders bekerja?",
         "a": "Kamu jalan secara fisik melewati jalan-jalan, lalu mengklaim area GPS-nya. Wilayah muncul di peta dan jadi milikmu, sampai pemain lain datang dan menantang. Jika kamu berhasil bertahan, area tetap milikmu."},
        {"q": "Bisakah saya kehilangan wilayah saya?",
         "a": "Bisa. Sistem Decay bikin area yang tidak aktif menyusut sedikit setiap hari. Yang rutin lewat akan menjaganya. Yang berhenti, kehilangan pelan-pelan. Itu yang bikin peta tetap hidup."},
        {"q": "Apa yang terjadi saat ada serangan teritorial?",
         "a": "Penyerang harus datang secara fisik ke wilayahmu. Lalu mini-game interaktif dimulai antara penyerang dan pembela. Yang menang mini-game menentukan nasib area."},
        {"q": "Apakah ada sistem wilayah klan?",
         "a": "Ada. Klan di MapRaiders terbentuk organik dan bisa memegang wilayah bersama. Area klan lebih kokoh, butuh beberapa penyerang untuk merobohkan. Kerja sama jadi terbayar."},
        {"q": "Apakah permainan teritori berbayar?",
         "a": "Tidak. Seluruh gameplay teritori gratis. Secara opsional ada item kosmetik (Rp 15.000 sampai Rp 150.000) untuk desain penanda dan warna wilayah, tanpa keuntungan dalam permainan. Pembayaran via GoPay, OVO, Dana, atau ShopeePay."},
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
    "title": "Game lokasi 2026: tujuh game GPS Indonesia dibandingkan",
    "og_title": "Game lokasi 2026: GPS MMO yang jujur dan gratis",
    "meta": "Game lokasi 2026: MapRaiders vs Pokémon GO vs Koin Jagat dibandingkan. Wilayah persisten, tanpa iklan, hemat baterai.",
    "keywords": "game lokasi, game gps indonesia, location based game, game gps android, game peta, gps mmo",
    "badge": "GPS MMO",
    "pricing_pill": "Free Forever. UU PDP. Sharing via WhatsApp.",
    "h1_html": 'Game lokasi: <em>taklukkan lingkunganmu</em> di dunia nyata',
    "lead": "Game lokasi seharusnya lebih dari titik sementara di peta. MapRaiders memakai GPS, penangkapan wilayah persisten, dan sistem pertahanan yang bikin penaklukan terasa beneran. Kamu lewat di sebuah jalan, jalan itu jadi milikmu. Selama kamu masih melewatinya. Tanpa fake GPS, tanpa AR yang bikin baterai habis, tanpa iklan.",
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
    <p>Sebuah <strong>game lokasi (Location-Based Game)</strong> memakai posisi geografis perangkat sebagai mekanika inti. Berbeda dari game AR yang juga butuh kamera, game GPS murni cukup dengan peta. Lebih hemat baterai, dan privasi lebih terjaga.</p>
    <p>MapRaiders adalah <strong>GPS MMO</strong>. Ribuan pemain bergerak di peta yang sama secara bersamaan, bersaing dalam waktu nyata, lewat satu sistem wilayah yang terpadu. Tanpa AR, tanpa kamera, tanpa kacamata VR.</p>
            """,
        },
        {
            "label": "Tujuh game GPS",
            "title": "Tujuh game lokasi <em>dibandingkan secara jujur</em>",
            "body": "<p>Daftar Top-7 yang biasa beredar sering mencampur aplikasi yang cuma berbagi satu fitur dengan Pokémon GO. Versi yang lebih jujur:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>Aplikasi</th><th>Operator</th><th>Tanpa iklan</th><th>Wilayah nyata</th><th>UU PDP</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Gym sementara</td><td class="cross">Akuisisi Scopely 2025</td></tr>
      <tr><td class="feat-name">Koin Jagat</td><td>Jagat (lokal ID)</td><td>Bervariasi</td><td class="cross">Hanya koin</td><td>Operator lokal</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">Akuisisi Scopely 2025</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="check">✓</td><td class="cross">Cache, bukan tanah</td><td>Premium-paywall</td></tr>
      <tr><td class="feat-name">Mobile Legends</td><td>Moonton</td><td class="cross">✗</td><td class="cross">Bukan game lokasi</td><td>Operator</td></tr>
      <tr><td class="feat-name">Ingress Prime</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Portal, bukan tanah</td><td class="cross">Akuisisi Scopely 2025</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓</td><td class="check">✓ persisten</td><td class="check">UU PDP, independen</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Yang berbeda",
            "title": "Apa yang sebenarnya <em>berbeda</em> di MapRaiders",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Wilayah persisten</h3><p>Saat sebuah jalan kamu taklukkan, jalan itu milikmu sampai orang lain merebut atau decay bekerja. Bukan gym yang hilang dalam beberapa jam.</p></div>
    <div class="feat-card rv d1"><h3>Echo, bukan AR</h3><p>Tinggalkan Echo berisi audio, foto, atau video di lokasi nyata. Pemain lain menemukannya. Tidak butuh kamera, jadi baterai tidak boros.</p></div>
    <div class="feat-card rv d2"><h3>Tujuh mini-game pertahanan</h3><p>Saat diserang: tic-tac-toe, batu-gunting-kertas, atau mini-catur. Yang menentukan kepala, bukan jam main.</p></div>
    <div class="feat-card rv d3"><h3>Klan dari tetangga</h3><p>Klan muncul karena orang sering jalan di jalan yang sama, bukan karena ada di server Discord yang sama. Kedekatan ruang, bukan algoritma.</p></div>
    <div class="feat-card rv d4"><h3>Konsumsi baterai</h3><p>Cuma GPS, tanpa kamera, tanpa AR. Pada rute panjang baterai bisa bertahan sekitar empat kali lebih lama dibanding Pokémon GO.</p></div>
  </div>""",
        },
        {
            "label": "Untuk siapa di Indonesia",
            "title": "Empat <em>profil pemakai</em> di Indonesia",
            "body": "<p>MapRaiders cocok untuk beberapa kebiasaan harian yang umum di Indonesia:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Lari pagi</h3><p>Kardio yang punya tujuan: pertahankan wilayah, atau rebut yang hilang. Strava untuk angka, MapRaiders untuk lapangan.</p></div>
    <div class="feat-card rv d1"><h3>Jalan setelah berbuka</h3><p>Selama Ramadan: aktivitas keluarga setelah Iftar. Kalori turun, wilayah pelan-pelan naik.</p></div>
    <div class="feat-card rv d2"><h3>Penjelajahan kota</h3><p>Jakarta, Surabaya, Bandung. Temukan Echo dari pemain lain di gang dan lorong yang biasa kamu lewat.</p></div>
    <div class="feat-card rv d3"><h3>Aktivitas keluarga</h3><p>Perburuan harta karun dengan Echo, tanpa AR, tanpa iklan, cocok untuk anak-anak maupun orang dewasa.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Apa itu game lokasi?",
         "a": "Game lokasi (Location-Based Game) memakai posisi GPS-mu untuk memicu mekanika permainan. MapRaiders memakai GPS untuk menempelkan wilayah, Echo, dan misi ke lokasi nyata. Kotamu jadi lapangan."},
        {"q": "Apakah saya butuh Augmented Reality?",
         "a": "Tidak. MapRaiders sengaja dibangun tanpa AR. Cuma GPS dan peta. Itu yang bikin baterai awet dan privasi tetap terjaga, tidak ada kamera dan tidak ada pengenalan wajah."},
        {"q": "Apakah ini bekerja di kota mana pun di Indonesia?",
         "a": "Ya, di mana pun data OpenStreetMap tersedia. Di pusat kota seperti Jakarta, Surabaya, dan Bandung, kepadatan pemain lebih tinggi. Di daerah, lawannya lebih sedikit, tapi wilayahnya bisa lebih luas."},
        {"q": "Apakah data lokasi saya dijual?",
         "a": "Tidak. Kami patuh UU PDP, tanpa SDK iklan, tanpa penjualan data, tanpa kepemilikan negara. Berbeda dari Pokémon GO yang sejak Maret 2025 ada di bawah Scopely."},
        {"q": "Berapa biayanya?",
         "a": "Gameplay-nya gratis. Kosmetik (Rp 15.000 sampai Rp 150.000) tidak memberi keuntungan di dalam permainan, hanya estetika. Pembayaran via GoPay, OVO, Dana, ShopeePay, atau Virtual Account."},
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
    "title": "Alternatif Pokémon GO gratis: tanpa iklan, data tidak dijual",
    "og_title": "Alternatif Pokémon GO gratis: 100% gratis, tanpa Battle Pass",
    "meta": "Mencari alternatif Pokémon GO gratis? MapRaiders 100% gratis, tanpa iklan, tanpa Battle Pass. Wilayah persisten, bukan gym sementara.",
    "keywords": "alternatif pokemon go gratis, alternatif pokemon go indonesia, game gps gratis, tanpa iklan, tanpa battle pass",
    "badge": "Alternatif Pokémon GO",
    "pricing_pill": "Tanpa biaya selamanya. GoPay, OVO, Dana.",
    "h1_html": 'Alternatif Pokémon GO gratis: tanpa iklan, <em>tanpa fake GPS</em>, data tidak dijual',
    "lead": "Yang cari alternatif Pokémon GO tanpa Battle Pass dan tanpa drama Remote Raid Pass biasanya malah jatuh ke perangkap premium berikutnya. MapRaiders membaliknya. Seluruh gameplay inti gratis dan tetap gratis. Tidak ada tier, tidak ada langganan wajib, tidak ada penjualan data. Pembayaran lewat GoPay, OVO, atau Dana cuma untuk kosmetik opsional.",
    "trigger": {
        "quote": "Tanpa biaya selamanya. Hemat baterai, hemat kuota.",
        "author": "MapRaiders, prinsip harga"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Kenapa cari",
            "title": "Yang bikin pemain Pokémon GO Indonesia <em>cari alternatif gratis</em> di 2026",
            "body": """
    <p>Antara 2024 dan 2026 ada beberapa titik yang membuat pasar Indonesia siap pindah:</p>
    <ul>
      <li><strong>Frustrasi Battle Pass.</strong> Pass musiman dengan benefit yang baru aktif kalau bayar. Lewatkan satu musim, hadiahnya hilang selamanya.</li>
      <li><strong>Drama Remote Raid Pass.</strong> Niantic menaikkan harga dan mengurangi ketersediaannya. Gelombang pemain Indonesia berhenti di 2023.</li>
      <li><strong>Akuisisi Maret 2025.</strong> Niantic menjual Pokémon GO ke Scopely. Data lokasi jutaan pemain sekarang melewati infrastruktur perusahaan baru.</li>
    </ul>
            """,
        },
        {
            "label": "Arti gratis",
            "title": "Apa arti <em>&ldquo;gratis&rdquo;</em> sebenarnya di MapRaiders",
            "body": "<p>Tier-nya transparan. Tidak ada paywall tersembunyi, tidak ada tutorial yang tiba-tiba terkunci setelah sepuluh menit:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>Termasuk</th><th>Harga (ID)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% gameplay (wilayah, Echo, misi, klan, pertahanan, acara)</td><td>Rp 0</td></tr>
      <tr><td class="feat-name">Cosmetic-IAP</td><td>Desain penanda, warna wilayah, lencana klan, skin</td><td>Rp 15.000 &ndash; Rp 150.000</td></tr>
      <tr><td class="feat-name">MapRaiders Pendukung (Sub)</td><td>Lencana kehormatan, akses beta, surat pendiri, paket kosmetik bulanan</td><td>Rp 49.000 / bulan</td></tr>
      <tr><td class="feat-name">Pendukung Seumur Hidup</td><td>Kosmetik kolektor + kredit dalam game</td><td>Rp 1.499.000 (sekali)</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Penting:</strong> item kosmetik tidak memberi keuntungan apa pun di dalam permainan. Yang tidak beli apa-apa main dengan mekanika yang sama persis dengan Pendukung Seumur Hidup.</p>""",
        },
        {
            "label": "Pembayaran lokal",
            "title": "Pembayaran <em>via GoPay, OVO, dan Dana</em>",
            "body": """
    <p>Kosmetik opsional dan langganan Pendukung bisa dibayar via GoPay, OVO, Dana, ShopeePay, atau Virtual Account. Tidak perlu kartu kredit internasional. Cara tercepat biasanya GoPay: buka aplikasi, scan QR, konfirmasi, kosmetik terbuka dalam beberapa detik.</p>
    <p>Penyedia pembayaran yang terintegrasi: Midtrans, Xendit, Doku. Tanpa biaya tambahan untuk pemain, tanpa keharusan punya PayPal.</p>
            """,
        },
        {
            "label": "Soal kepemilikan",
            "title": "Soal <em>akuisisi Niantic</em> dan ke mana datamu pergi",
            "body": """
    <p>Pada Maret 2025, Niantic menjual divisi game-nya (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) senilai 3,5 miliar dolar ke Scopely. Setelah akuisisi itu, infrastruktur dan kepemilikan data berpindah.</p>
    <p>Konkretnya: <strong>data lokasi sekitar 30 juta pemain Pokémon GO bulanan</strong>, ke mana mereka lari, kapan mereka jalan-jalan, rute apa yang mereka tempuh setiap hari, sekarang melewati infrastruktur Scopely. Detail transfer datanya tidak dipublikasikan. Yang jelas, perlindungan setara UU PDP tidak otomatis berlaku untuk pemain Indonesia di luar yurisdiksi Indonesia.</p>
    <p>MapRaiders adalah LLC AS yang dimiliki secara <strong>privat</strong> (Scafa Investments LLC, Florida), dikembangkan tim independen. Kami menjalankan server yang patuh UU PDP, tidak menjual data, tidak terhubung ke jaringan iklan, dan tidak dikendalikan negara mana pun.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Apakah MapRaiders benar-benar gratis selamanya?",
         "a": "Ya. Gameplay inti, taklukkan wilayah, tinggalkan Echo, bikin misi, bentuk klan, tetap gratis selamanya. Tidak ada sistem tier, tidak ada Battle Pass, tidak ada langganan wajib."},
        {"q": "Berapa biaya Cosmetic-IAP?",
         "a": "Item kosmetik seperti desain penanda, warna wilayah, atau lencana klan harganya antara Rp 15.000 dan Rp 150.000. Tidak memberi keuntungan permainan, hanya estetika. Pembayaran via GoPay, OVO, Dana, atau ShopeePay."},
        {"q": "Bisakah saya bayar dengan GoPay?",
         "a": "Bisa. GoPay adalah metode utama untuk kosmetik dan langganan Pendukung. Scan QR, konfirmasi di aplikasi, kosmetiknya terbuka dalam beberapa detik. Tidak butuh kartu internasional dan tidak butuh PayPal."},
        {"q": "Apakah ada iklan di aplikasi?",
         "a": "Tidak. MapRaiders 100% bebas iklan. Kami tidak menjual datamu dan tidak menjual ruang iklan."},
        {"q": "Apa maksud &ldquo;data tidak dijual ke pihak ketiga&rdquo;?",
         "a": "Setelah akuisisi Niantic oleh Scopely di Maret 2025, data lokasi puluhan juta pemain Pokémon GO bulanan berpindah infrastruktur. MapRaiders adalah LLC AS swasta, datamu tidak dijual ke jaringan iklan, tidak ada kepemilikan negara, dan kami patuh UU PDP."},
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
    "title": "Koin Jagat alternatif: wilayah persisten, lebih banyak lapisan",
    "og_title": "Koin Jagat alternatif: lebih dari sekadar koin, taklukkan wilayah",
    "meta": "Koin Jagat alternatif: MapRaiders adalah game lokasi dengan wilayah persisten, klan, mini-game pertahanan. Lebih banyak lapisan daripada sekadar koin.",
    "keywords": "koin jagat alternatif, alternatif jagat, koin jagat indonesia, aplikasi koin jagat, jagat coin alternatif",
    "badge": "Koin Jagat Alternatif. Khusus ID.",
    "pricing_pill": "Tanpa antrian. Wilayah persisten. Server stabil.",
    "h1_html": 'Koin Jagat alternatif: <em>lebih dari sekadar koin</em>, taklukkan wilayah',
    "lead": "Koin Jagat membawa ide game lokasi ke Indonesia dengan cara yang menarik: berburu koin di kota nyata. Beberapa pemain mengeluhkan server crash, antrian, dan kedalaman gameplay yang terbatas. MapRaiders berangkat dari titik yang sama, gerakan nyata di peta nyata, lalu menambahkan wilayah persisten, klan, mini-game pertahanan, dan sistem Echo. Tidak ada antrian, dan ada lebih banyak hal untuk dilakukan setelah jam pertama.",
    "trigger": {
        "quote": "Lebih dari sekadar koin. Taklukkan wilayahmu.",
        "author": "MapRaiders, sudut pandang lokal ID"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Apa itu Koin Jagat",
            "title": "Apa itu <em>Koin Jagat</em>, dengan hormat",
            "body": """
    <p>Koin Jagat adalah game lokasi Indonesia yang dikembangkan tim Jagat. Idenya: pemain memburu koin virtual yang tersebar di lokasi nyata, di taman, jalan, gedung. Yang menemukan dapat poin atau hadiah. Konsepnya menarik, dan ini benar-benar buatan lokal.</p>
    <p>Yang Koin Jagat lakukan dengan baik:</p>
    <ul>
      <li><strong>Local-first.</strong> Antarmuka Bahasa Indonesia, lokasi Indonesia, komunitas Indonesia.</li>
      <li><strong>Mekanika sederhana.</strong> Mudah dimulai, gampang dimengerti.</li>
      <li><strong>Aktivasi outdoor.</strong> Mendorong orang ke taman dan ruang publik.</li>
    </ul>
    <p>Yang sering dirasakan pemain sebagai keterbatasan:</p>
    <ul>
      <li><strong>Server crash dan antrian.</strong> Saat peluncuran fitur dan acara, server sering kewalahan, dan bahkan ada laporan vandalisme di lokasi koin.</li>
      <li><strong>Kedalaman gameplay terbatas.</strong> Setelah beberapa kali berburu koin, polanya cepat berulang.</li>
      <li><strong>Tanpa kepemilikan persisten.</strong> Yang menemukan koin dapat koin, tapi tidak ada wilayah jangka panjang untuk dipertahankan.</li>
      <li><strong>Komponen sosialnya tipis.</strong> Sebagian besar tetap pengalaman solo.</li>
    </ul>
            """,
        },
        {
            "label": "Yang ditambah MapRaiders",
            "title": "Yang <em>MapRaiders tambahkan</em>",
            "body": "<p>MapRaiders berangkat dari titik yang sama (gerakan nyata, peta nyata) dan membangun beberapa lapisan tambahan di atasnya:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Wilayah persisten</h3><p>Saat sebuah jalan kamu taklukkan, jalan itu milikmu, bukan koin yang langsung hilang setelah diambil. Bisa dipertahankan dan diperluas selama berbulan-bulan.</p></div>
    <div class="feat-card rv d1"><h3>Klan dari tetangga</h3><p>Klan terbentuk dari lingkungan yang sama. Tetangga jadi rekan main, bukan kenalan dari server Discord acak.</p></div>
    <div class="feat-card rv d2"><h3>Tujuh mini-game pertahanan</h3><p>Saat penyerang datang: tic-tac-toe, batu-gunting-kertas, mini-catur. Yang memutuskan strategi, bukan kecepatan.</p></div>
    <div class="feat-card rv d3"><h3>Sistem Echo</h3><p>Tinggalkan pesan audio, foto, atau video di sebuah lokasi. Pemain lain menemukannya saat lewat. Lapisan sosial yang lumayan dalam.</p></div>
    <div class="feat-card rv d4"><h3>Mesin Decay</h3><p>Wilayah yang dibiarkan akan menyusut. Aktivitas yang menjaga tanah, dan peta tetap hidup.</p></div>
    <div class="feat-card rv d4"><h3>Server stabil</h3><p>Infrastruktur cloud global, tanpa antrian, tanpa server crash di hari pertama.</p></div>
  </div>""",
        },
        {
            "label": "Perbandingan",
            "title": "Koin Jagat vs MapRaiders <em>berdampingan</em>",
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
            "label": "Main bersamaan",
            "title": "<em>Bisa main keduanya</em>, tidak harus pilih satu",
            "body": """
    <p>Ini bukan pilihan &ldquo;atau&rdquo;. MapRaiders melengkapi Koin Jagat, bukan menggantikan. Kamu bisa berburu koin di Koin Jagat saat pagi, lalu taklukkan wilayah di MapRaiders pas jalan setelah berbuka. Kedua aplikasi memakai sensor GPS yang sama tanpa konflik.</p>
    <p>Banyak penguji beta di Indonesia bilang: Koin Jagat enak buat burst harian yang cepat, MapRaiders untuk kedalaman jangka panjang. Pola yang sehat: pagi Jagat, sore MapRaiders.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Apakah MapRaiders pesaing Koin Jagat?",
         "a": "Tidak langsung. Keduanya berangkat dari titik yang sama (gerakan nyata, peta nyata) tapi fokusnya berbeda. Koin Jagat: berburu koin cepat. MapRaiders: kepemilikan wilayah persisten plus klan dan mini-game. Banyak pemain main dua-duanya bareng."},
        {"q": "Kenapa MapRaiders tidak crash seperti Koin Jagat di awal?",
         "a": "Infrastruktur cloud global dengan auto-scaling. Server kami menahan lonjakan tanpa antrian. Strategi deployment-nya beda dari hari pertama."},
        {"q": "Apakah Bahasa Indonesia didukung penuh?",
         "a": "Ya. MapRaiders dilokalkan sepenuhnya dalam Bahasa Indonesia: menu, sistem Echo, petunjuk, dukungan. Komunitas Indonesia jadi prioritas."},
        {"q": "Bagaimana dengan UU PDP?",
         "a": "MapRaiders patuh UU PDP (UU Perlindungan Data Pribadi 2022). Tidak ada penjualan data, tidak ada SDK iklan, server di EU dan AS, dan kami transparan soal lokasi data."},
        {"q": "Bisakah saya transfer akun Koin Jagat ke MapRaiders?",
         "a": "Tidak. Keduanya adalah game terpisah dengan akun terpisah. Tapi pendaftaran MapRaiders cuma 30 detik, masuk dengan email dan kamu siap. Tidak ada yang hilang."},
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
    "title": "Aplikasi jalan kaki dengan game: kardio plus wilayah",
    "og_title": "Aplikasi jalan kaki dengan game: kardio, game, dan kesehatan",
    "meta": "Aplikasi jalan kaki dengan game? MapRaiders mengubah jalan-jalan harianmu jadi penaklukan wilayah. Kardio, game, dan kesehatan untuk seluruh keluarga.",
    "keywords": "aplikasi jalan kaki, aplikasi jalan kaki dengan game, jalan kaki game, game untuk jalan kaki, aplikasi kardio gps, strava wilayah, game jalan kaki ramadan",
    "badge": "Kardio + Game",
    "pricing_pill": "Free Forever. Baterai sekitar empat kali lebih hemat dari Pokémon GO.",
    "h1_html": 'Aplikasi jalan kaki dengan game: saat <em>setiap langkah</em> menaklukkan wilayah',
    "lead": "Aplikasi jalan kaki biasa memberi statistik. Game jalan kaki seperti Pokémon GO memberi koleksi. Tapi belum banyak yang mengubah jalan harianmu jadi tanah harianmu. MapRaiders melakukan itu: setiap langkah membentuk wilayah, setiap putaran menjaganya. Kardio yang punya konsekuensi, dan keluarga bisa ikut sama-sama.",
    "trigger": {
        "quote": "Pagi saya tetap lari seperti biasa, cuma sekarang ada yang harus saya jaga.",
        "author": "Vivian N., pelari dari wilayah Hamburg (beta tertutup)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "Masalah",
            "title": "Kenapa <em>aplikasi jalan kaki biasa</em> sering tidak cukup",
            "body": """
    <p>Strava, Nike Run Club, Adidas Running mengukur waktu, jarak, kecepatan. Untuk banyak orang di Indonesia, ada beberapa hal yang masih kurang:</p>
    <ul>
      <li><strong>Tidak ada elemen game.</strong> Yang tidak mengejar rekor pribadi sering kehilangan motivasi setelah beberapa minggu.</li>
      <li><strong>Tekanan performa.</strong> Leaderboard publik bisa lebih bikin patah semangat daripada membantu.</li>
      <li><strong>Langganan terasa wajib.</strong> Strava Premium sekitar Rp 130.000 per bulan untuk fitur dasar yang dulu gratis.</li>
    </ul>
            """,
        },
        {
            "label": "Solusi",
            "title": "Bagaimana MapRaiders <em>mengubah rutinitas</em> jalan kakimu",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Jaga wilayah</h3><p>Setiap rute menjaga tanah. Yang berhenti tiga hari mulai melihat decay bekerja, jadi ada alasan kecil untuk kembali.</p></div>
    <div class="feat-card rv d1"><h3>Indikator Decay</h3><p>Nilai Decay menampilkan: &ldquo;kalau tidak jalan hari ini, lingkunganmu menyusut sekian persen&rdquo;. Bukan menyalahkan, hanya menunjukkan keadaan.</p></div>
    <div class="feat-card rv d2"><h3>Pertahanan klan saat lari</h3><p>Push notifikasi memberi tahu kalau wilayah klan diserang. Kamu tidak lari sendirian, kamu lari bersama tim.</p></div>
    <div class="feat-card rv d3"><h3>Echo di tengah jalan</h3><p>Echo audio dari pemain lain muncul saat kamu lewat. Cerita-cerita kecil tentang jalanan, bukan iklan dan bukan influencer.</p></div>
  </div>""",
        },
        {
            "label": "Bersama Strava",
            "title": "MapRaiders <em>melengkapi</em> Strava, bukan menggantikan",
            "body": """
    <p>MapRaiders tidak bersaing dengan Strava di metrik performa. Kamu bisa jalankan keduanya bersamaan, mereka memakai sensor GPS yang sama tanpa konflik. Yang tidak ada di Strava: wilayah dan pertahanan sosial. Yang tidak ada di MapRaiders: analisis pace splits dan zona detak jantung yang rinci.</p>
    <p>Kombinasi yang enak: <strong>Strava untuk analisis teknis, MapRaiders untuk motivasi harian dan wilayah.</strong> Jalankan dua-duanya, dan tidak ada yang saling ganggu.</p>
            """,
        },
        {
            "label": "Sehat di usia 50+",
            "title": "Jalan kaki untuk <em>usia 50+</em>, kebugaran jangka panjang",
            "body": """
    <p>Indonesia punya populasi 60+ yang tumbuh cepat. Jalan kaki sering jadi aktivitas yang direkomendasikan dokter, tapi motivasi sering jadi titik lemahnya. MapRaiders membantu di sini tanpa AR yang bikin pusing dan tanpa kompetisi yang membuat orang menjauh:</p>
    <ul>
      <li><strong>Kecepatan sendiri.</strong> Tidak ada kecepatan minimum. Jalan santai, jalan dengan tongkat, jalan dengan teman, semua dihitung untuk wilayah.</li>
      <li><strong>Jalan yang sama tiap hari sudah cukup.</strong> Konsistensi mengalahkan jarak. Yang rutin, yang tetap memegang tanahnya.</li>
      <li><strong>Komunitas lingkungan.</strong> Klan organik dari tetangga. Tanpa Discord, tanpa chat yang toksik.</li>
      <li><strong>Patuh UU PDP.</strong> Untuk yang khawatir soal privasi: tanpa iklan tertarget dan tanpa penjualan lokasi.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Berapa lama baterai bertahan?",
         "a": "Untuk jalan kaki satu jam, biasanya pemakaian baterai 15 sampai 25 persen (dibandingkan sekitar 50 persen di Pokémon GO dengan AR). Bisa berbeda tergantung perangkat dan kecerahan layar."},
        {"q": "Apakah ini bekerja dengan Strava atau Nike Run Club?",
         "a": "Saat ini belum ada integrasi langsung. Kamu bisa jalankan keduanya bersamaan, sensor GPS-nya sama tanpa konflik. Integrasi Strava direncanakan untuk Q4 2026."},
        {"q": "Apakah jalan santai juga dihitung?",
         "a": "Ya. Tidak ada kecepatan minimum. Jalan santai, jalan lambat, jalan-jalan biasa, semua membentuk wilayah selama ada gerakan fisik (tanpa auto-cheating)."},
        {"q": "Bisakah lansia memakai aplikasi ini?",
         "a": "Bisa. Aplikasinya cocok untuk semua usia. Tanpa AR, tanpa kebisingan, tanpa tekanan kecepatan. Huruf besar, kontras tinggi, kontrol sederhana."},
        {"q": "Berapa banyak kuota yang dipakai?",
         "a": "Sedang. Tanpa live video, tanpa API berat. Jalan kaki satu jam biasanya menghabiskan 5 sampai 15 MB."},
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
    "title": "Harta karun aplikasi 2026: seluruh kota jadi perburuan",
    "og_title": "Harta karun aplikasi: seluruh kota dipenuhi Echo tersembunyi",
    "meta": "Harta karun aplikasi 2026: live, seluruh kota, tanpa beli tur, tanpa iklan. MapRaiders mengubah kotamu jadi perburuan harta karun terbuka. Cocok untuk keluarga dan teman.",
    "keywords": "harta karun aplikasi, perburuan harta karun aplikasi, aplikasi harta karun, harta karun keluarga, geocaching alternatif indonesia",
    "badge": "Perburuan Harta Karun",
    "pricing_pill": "Free Forever. Tanpa beli tur. Seluruh kota.",
    "h1_html": 'Harta karun aplikasi: <em>seluruh kota penuh Echo</em> tersembunyi',
    "lead": "Aplikasi perburuan harta karun seperti Geocaching biasanya butuh langganan premium dan tur yang sudah disiapkan. MapRaiders membaliknya. Echo sudah tersebar di seluruh kota. Kamu bisa ikuti jejak pemain lain, atau tinggalkan jejakmu sendiri. Live, gratis, tanpa beli tur, tanpa persiapan.",
    "trigger": {
        "quote": "Saya taruh klip audio singkat di pintu masuk gedung, tiga hari kemudian seseorang yang tidak saya kenal menemukannya.",
        "author": "Aljoscha P., penjelajah kota dari wilayah Berlin (beta tertutup)"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Kriteria",
            "title": "Yang harus dimiliki <em>aplikasi harta karun zaman sekarang</em>",
            "body": """
    <p>Beberapa hal yang membedakan aplikasi perburuan harta karun era smartphone dari versi cetak kertas:</p>
    <ul>
      <li><strong>Live.</strong> Petunjuk bisa muncul real-time, bukan hanya dalam tur yang sudah dibuat.</li>
      <li><strong>Sosial.</strong> Pemain saling meninggalkan petunjuk, bukan cuma mengikuti.</li>
      <li><strong>Tanpa paywall di awal.</strong> Orang tua dan anak bisa mulai langsung, tanpa harus beli tur Rp 50.000 dulu.</li>
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
      <tr><td class="feat-name">Geocaching</td><td>Sub Premium ~Rp 100rb/bulan</td><td>Rendah, temukan cache</td><td class="cross">Asinkron</td><td>Mengumpulkan</td></tr>
      <tr><td class="feat-name">Actionbound</td><td>Tur atau langganan</td><td>Tinggi, buat tur</td><td class="cross">✗</td><td>Per-tur</td></tr>
      <tr><td class="feat-name">Munzee</td><td>Premium-Sub</td><td>Sedang</td><td class="cross">Asinkron</td><td>Scan kode</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">Rp 0</td><td class="check">Nol</td><td class="check">Live</td><td>Echo, Misi, Wilayah</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Echo",
            "title": "Bagaimana MapRaiders <em>memikirkan ulang</em> perburuan harta karun",
            "body": """
    <p>Bukan tur linear dari titik 1 ke 10. MapRaiders membuat <strong>perburuan yang terbuka di ruang kota</strong>, dan seluruh kota jadi taman bermainnya:</p>
    <ul>
      <li><strong>Tinggalkan Echo.</strong> Tinggalkan Echo berisi audio, foto, atau video di sebuah tempat. Pemain lain akan menemukannya saat lewat.</li>
      <li><strong>Temukan Echo.</strong> Lihat di peta posisi Echo. Ikuti jejak, dengarkan ceritanya.</li>
      <li><strong>Bikin misi.</strong> Bikin tugas kecil di sebuah lokasi (&ldquo;foto pintu merah di sana&rdquo;), pemain lain yang menjalankan.</li>
      <li><strong>Lapisan wilayah.</strong> Yang sering lewat rute perburuan akan menaklukkannya jadi wilayah. Jejak pelan-pelan jadi tanah.</li>
    </ul>
            """,
        },
        {
            "label": "Anak dan keluarga",
            "title": "Perburuan harta karun untuk <em>anak-anak dan keluarga</em>",
            "body": """
    <p>Perburuan harta karun adalah bagian dari budaya masa kecil di Indonesia: petunjuk dengan kapur, jejak daun, dan akhirnya permen di tempat persembunyian. MapRaiders membawa ini ke smartphone, tanpa membuat anak-anak menatap layar sepanjang waktu:</p>
    <ul>
      <li><strong>Aktivitas orang tua dan anak.</strong> Orang tua menaruh Echo audio di rute, anak-anak mengikutinya. Gerakan tetap analog, petunjuknya digital.</li>
      <li><strong>Layar sedikit, dunia banyak.</strong> Aplikasi cuma memandu di peta. Pengalamannya terjadi di dunia nyata.</li>
      <li><strong>UU PDP untuk anak-anak.</strong> Tanpa pelacak iklan personalisasi, tanpa penjualan data, tanpa chat dalam aplikasi tanpa persetujuan orang tua.</li>
      <li><strong>Mode keluarga.</strong> Buat acara privat untuk Idul Fitri, Tahun Baru Imlek, atau Hari Kemerdekaan, hanya untuk grup keluarga.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Apakah MapRaiders cocok untuk anak-anak?",
         "a": "Ya, mulai usia 9 tahun dengan pengawasan orang tua. Aplikasinya patuh UU PDP, tanpa iklan, dan tidak mengumpulkan data pribadi anak. Orang tua bisa mengaktifkan mode keluarga."},
        {"q": "Butuh persiapan berapa banyak untuk berburu dengan anak-anak?",
         "a": "Tidak banyak. Berbeda dari Actionbound atau Munzee, kamu tidak perlu beli tur atau menyiapkan stasiun. Echo sudah tersebar di kota, cukup ikuti jejak pemain lain atau tinggalkan jejakmu sendiri."},
        {"q": "Apakah perburuan harta karunnya berbayar?",
         "a": "Tidak. Tinggalkan Echo, temukan Echo, dan buat misi semuanya gratis. Kosmetik opsional mulai Rp 15.000, tanpa keuntungan permainan. Pembayaran via GoPay, OVO, atau Dana."},
        {"q": "Apakah ini bekerja di kota kecil?",
         "a": "Ya. Bahkan di kota kecil atau lingkungan, kamu bisa tinggalkan Echo dan bikin misi. Di pusat kota jejaknya lebih ramai, di daerah jejakmu sendiri yang dominan."},
        {"q": "Apakah aplikasi dalam Bahasa Indonesia?",
         "a": "Ya. MapRaiders dilokalkan sepenuhnya dalam Bahasa Indonesia, mulai dari menu, sistem Echo, petunjuk, sampai dukungan."},
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
    "title": "Game Ramadan jalan kaki: jalan setelah berbuka, gratis",
    "og_title": "Permainan Ramadan: setiap langkah ada artinya",
    "meta": "Game Ramadan jalan kaki: jalan-jalan keluarga setelah berbuka, taklukkan wilayah, hemat baterai. Tanpa iklan, tanpa biaya, dengan menjaga adab.",
    "keywords": "permainan ramadan, game ramadan, game ramadan jalan kaki, aplikasi ramadan, jalan-jalan setelah berbuka, sahur game, idul fitri permainan",
    "badge": "Permainan Ramadan. Khusus ID.",
    "pricing_pill": "Setiap langkah ada artinya. Gratis. Menjaga adab.",
    "h1_html": 'Permainan Ramadan: <em>setiap langkah</em> ada artinya',
    "lead": "Ramadan adalah waktu yang punya ritmenya sendiri: puasa, tarawih, sahur, iftar bersama keluarga. Setelah berbuka, banyak yang mencari kegiatan ringan untuk jalan-jalan bersama. MapRaiders mencoba pas di sini, dengan menjaga adab. Jalan-jalan setelah Iftar bisa jadi penaklukan wilayah yang ringan, hemat baterai, dan tanpa iklan. Tidak ada mekanika judi, tidak ada hadiah uang, cuma gerakan dan komunitas.",
    "trigger": {
        "quote": "Setiap langkah selama Ramadan ada artinya.",
        "author": "MapRaiders, prinsip Ramadan"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Aktivitas Ramadan",
            "title": "Aktivitas Ramadan dan <em>jalan-jalan</em>",
            "body": """
    <p>Ramadan punya ritmenya sendiri, dan jalan-jalan bisa pas di beberapa titik dalam hari:</p>
    <ul>
      <li><strong>Setelah Sahur.</strong> Sebagian keluarga suka jalan ringan sebelum matahari terbit. Udaranya sejuk, jalannya sepi.</li>
      <li><strong>Sebelum Iftar.</strong> Saat menunggu adzan Maghrib, jalan singkat 15-20 menit di lingkungan bisa bantu mengalihkan rasa lapar.</li>
      <li><strong>Setelah Iftar dan sebelum Tarawih.</strong> Titik paling enak buat jalan keluarga 30-45 menit. Energi sudah balik, suasana tenang.</li>
      <li><strong>Setelah Tarawih.</strong> Sebagian keluarga punya tradisi jalan malam setelah salat. Ketemu tetangga, anak-anak ikut main.</li>
    </ul>
    <p>MapRaiders bisa hadir di setiap titik ini tanpa banyak gangguan. Kamu menaklukkan wilayah, melihat Echo, dan menjaga tanah klan tanpa harus terus-menerus melihat layar. Aplikasinya memandu di latar belakang.</p>
            """,
        },
        {
            "label": "Setelah Iftar",
            "title": "Setelah berbuka, <em>kegiatan ringan</em> dan wilayah pelan-pelan tumbuh",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Kalori turun, wilayah naik</h3><p>Jalan 30-45 menit setelah Iftar membakar sekitar 100-150 kalori, dan sambil itu menaklukkan wilayah. Sehat tanpa tekanan.</p></div>
    <div class="feat-card rv d1"><h3>Aktivitas keluarga</h3><p>Anak, orang tua, kakek-nenek, masing-masing dengan kecepatannya sendiri. Jalan santai dihitung sama seperti jogging.</p></div>
    <div class="feat-card rv d2"><h3>Echo komunitas</h3><p>Tinggalkan Echo audio singkat di masjid lingkungan atau jalan favorit. Komunitas Ramadan tumbuh secara organik.</p></div>
    <div class="feat-card rv d3"><h3>Hemat baterai untuk Tarawih</h3><p>Jalan satu jam pakai sekitar 15-20% baterai. Masih cukup untuk Tarawih, telepon keluarga, dan alarm sahur.</p></div>
  </div>""",
        },
        {
            "label": "Keluarga dan anak",
            "title": "Keluarga dan <em>anak-anak</em> selama Ramadan",
            "body": """
    <p>Ramadan adalah waktu keluarga di Indonesia. MapRaiders mau mendukung itu, bukan menggantikannya:</p>
    <ul>
      <li><strong>Aktivitas bersama, bukan layar sendiri-sendiri.</strong> Aplikasi memandu di latar belakang. Perhatian tetap di keluarga, bukan di ponsel.</li>
      <li><strong>Anak mengenal lingkungannya.</strong> Sambil menaklukkan wilayah, anak-anak melihat masjid, taman, dan gang baru di sekitar rumah.</li>
      <li><strong>Tanpa mekanika judi.</strong> Tidak ada hadiah acak, tidak ada loot box, tidak ada hadiah uang. Cuma gerakan dan wilayah.</li>
      <li><strong>UU PDP untuk anak-anak.</strong> Tanpa iklan, tanpa pelacakan, tanpa berbagi data ke platform iklan.</li>
      <li><strong>Mode keluarga.</strong> Buat acara privat hanya untuk keluargamu, misalnya &ldquo;tour Ramadan keluarga Ahmad&rdquo;.</li>
    </ul>
            """,
        },
        {
            "label": "Tempat suci dilindungi",
            "title": "<em>Tempat suci</em> tetap dilindungi",
            "body": """
    <p>Beberapa tempat punya aturan khusus di MapRaiders. Wilayah seperti Masjidil Haram di Mekkah, Masjid Nabawi di Madinah, dan area suci lainnya difilter dari sistem permainan. Di sana tidak ada penaklukan wilayah, tidak ada mini-game pertahanan, dan tidak ada Echo. Aplikasinya tetap menampilkan peta, tapi tanpa lapisan permainan.</p>
    <p>Alasannya sederhana: tempat-tempat ini bukan untuk dijadikan ajang kompetisi. Kalau kamu menemukan masjid atau lokasi sakral lain di kota yang menurutmu juga harus difilter, kamu bisa kirim laporan dari dalam aplikasi.</p>
            """,
        },
        {
            "label": "Setelah Idul Fitri",
            "title": "<em>Setelah Idul Fitri</em>, kebiasaan jalan tetap berlanjut",
            "body": """
    <p>Setelah Ramadan, banyak yang kehilangan ritme jalan-jalan harian. MapRaiders bisa bantu menjaganya:</p>
    <ul>
      <li><strong>Wilayah Ramadan tetap.</strong> Tanah yang kamu taklukkan selama Ramadan tetap milikmu, dipertahankan dengan jalan rutin setelah Lebaran.</li>
      <li><strong>Mudik jadi peta baru.</strong> Saat mudik, kamu bisa menaklukkan wilayah baru di kampung halaman. Kenangan yang awet.</li>
      <li><strong>Klan Ramadan.</strong> Klan yang terbentuk dari jalan-jalan Ramadan bisa berlanjut sebagai komunitas lingkungan sepanjang tahun.</li>
      <li><strong>Hari Kemerdekaan, Idul Adha, Tahun Baru.</strong> Setiap momen budaya jadi alasan untuk gerakan dan komunitas baru.</li>
    </ul>
    <p>Bulan Ramadan jadi pintu masuk, bukan akhir.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Apakah MapRaiders selaras dengan nilai-nilai Ramadan?",
         "a": "Tidak ada mekanika judi (tanpa loot box, tanpa hadiah acak), tidak ada hadiah uang, dan tidak ada iklan yang mengganggu. Cuma gerakan dan komunitas. Konsep dasarnya (jalan-jalan, keluarga, lingkungan) sejalan dengan ritme Ramadan."},
        {"q": "Apakah saya bisa main saat puasa tanpa kelelahan?",
         "a": "Bisa. Aplikasinya dirancang untuk gerakan ringan. Tidak harus lari atau olahraga berat. Jalan santai cukup. Yang paling enak biasanya jalan singkat sebelum Iftar atau setelah Tarawih."},
        {"q": "Apakah aplikasi tetap bekerja saat puasa?",
         "a": "Tetap. Aplikasi cuma melacak gerakan GPS, tidak peduli kamu sedang puasa atau tidak. Beberapa penguji beta bilang aktivitas ringan setelah Iftar bikin puasa terasa lebih bermakna."},
        {"q": "Apakah Mekkah dan Madinah masuk peta permainan?",
         "a": "Tidak. Tempat suci seperti Masjidil Haram dan Masjid Nabawi difilter dari mekanika permainan. Tidak ada wilayah, tidak ada mini-game, dan tidak ada Echo di sana. Petanya tetap muncul, tapi tanpa lapisan game."},
        {"q": "Adakah acara Ramadan khusus di dalam permainan?",
         "a": "Ada. Kami merencanakan acara Ramadan tahunan dengan tema Iftar, kosmetik bertema Ramadan (opsional, tanpa keuntungan permainan), dan tantangan keluarga. Semua dijaga adabnya, tanpa komersialisasi yang berlebihan."},
        {"q": "Bagaimana dengan privasi selama Ramadan?",
         "a": "MapRaiders patuh UU PDP. Lokasi masjid, rute Tarawih, dan jadwal sahurmu tidak dijual ke jaringan iklan. Server di EU dan AS, dengan transparansi penuh soal lokasi data."},
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
        "title": "Permainan teritori ulasan: penguji beta tentang MapRaiders",
        "og_title": "Permainan teritori: ulasan beta",
        "meta": "Ulasan permainan teritori dalam keseharian: tiga penguji beta melaporkan bagaimana penaklukan tanah, decay, dan mini-game pertahanan bekerja di ruang kota.",
        "keywords": "permainan teritori ulasan, permainan teritori tes, taklukkan wilayah aplikasi ulasan",
        "h1_html": 'Permainan teritori: saat <em>jalanmu</em> jadi milikmu',
        "lead": "Bagaimana rasanya menaklukkan jalan secara nyata? Tiga penguji beta menceritakan wilayah pertama mereka, kejutan Decay pertama, dan mini-game pertahanan pertama.",
        "intro_label": "Yang kami uji",
        "intro_title": "Apa yang membuat <em>permainan teritori</em> terasa nyata",
        "intro_body": """
    <p>Dalam tes teritori, ada tiga sumbu pengalaman yang penting:</p>
    <ul>
      <li><strong>Penaklukan.</strong> Kapan jalan pertama mulai terasa seperti &ldquo;tanah saya&rdquo;?</li>
      <li><strong>Kehilangan.</strong> Bagaimana respons saat Decay pertama atau kalah pertama dari penyerang?</li>
      <li><strong>Pertahanan.</strong> Mini-game pertahanannya terasa taktis, adil, atau bikin frustrasi?</li>
    </ul>
    <p>Kutipan dari ketiga penguji menyentuh tiga sumbu ini dari perspektif yang berbeda-beda.</p>
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
        "title": "Game lokasi ulasan: MapRaiders dalam tes harian",
        "og_title": "Game lokasi: ulasan dari penguji beta",
        "meta": "Ulasan game lokasi: tiga penguji beta menceritakan baterai, akurasi GPS, privasi, dan rasa main di rutinitas harian di kota.",
        "keywords": "game lokasi ulasan, game lokasi tes, gps mmo tes, mapraiders ulasan",
        "h1_html": 'Game lokasi: <em>ulasan</em> dari penguji beta',
        "lead": "Seberapa akurat GPS di pusat kota? Berapa banyak baterai yang dipakai aplikasi pada rute panjang? Bagaimana rasanya kepatuhan UU PDP di sisi pemain? Tiga penguji menjawab dengan jujur.",
        "intro_label": "Yang kami uji",
        "intro_title": "Yang kami uji di <em>game lokasi</em>",
        "intro_body": """
    <p>Tes game lokasi kami pegang di empat sumbu yang konkret:</p>
    <ul>
      <li><strong>Akurasi GPS</strong> di gang sempit dan di bawah jembatan.</li>
      <li><strong>Konsumsi baterai</strong> pada rute 1-2 jam (dibanding Pokémon GO).</li>
      <li><strong>Sensasi privasi</strong>: seberapa banyak gangguan pelacakan yang terasa.</li>
      <li><strong>Mekanika permainan</strong>: wilayah, Echo, dan misi terasa wajar di hari biasa.</li>
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
        "title": "Alternatif Pokémon GO gratis ulasan: penguji beta menjawab",
        "og_title": "Alternatif Pokémon GO gratis ulasan: beta-tes jujur",
        "meta": "Apakah alternatif Pokémon GO gratis itu sepadan? Tiga penguji beta dari Stuttgart, Hamburg, dan Berlin menjawab secara jujur soal kardio, jalan-jalan, dan eksplorasi kota.",
        "keywords": "alternatif pokemon go ulasan, alternatif pokemon go sepadan, mapraiders ulasan, beta tester laporan",
        "h1_html": 'Alternatif Pokémon GO gratis: <em>sepadan kah?</em>',
        "lead": "Tiga penguji beta dari tiga wilayah metropolitan Jerman memakai MapRaiders selama beberapa minggu. Laporan di bawah ini tanpa filter, tanpa bahasa marketing, dan tanpa kode influencer.",
        "intro_label": "Siapa yang menguji",
        "intro_title": "Tiga orang, tiga <em>cara pakai</em>",
        "intro_body": """
    <p>Ketiga penguji beta mewakili tiga persona yang berbeda. Itu yang bikin perbandingan dengan Pokémon GO jadi lebih jujur:</p>
    <ul>
      <li><strong>Ron C.</strong> dari wilayah Stuttgart: pemilik anjing, jalan-jalan harian, bukan gamer.</li>
      <li><strong>Vivian N.</strong> dari wilayah Hamburg: pelari, sempat main Pokémon GO di 2018, lalu berhenti setelah tiga bulan.</li>
      <li><strong>Aljoscha P.</strong> dari wilayah Berlin: penjelajah kota, veteran Ingress, kenal ekosistem Niantic dari dekat.</li>
    </ul>
    <p>Ketiganya menguji MapRaiders secara independen, tanpa promosi berbayar, tanpa skrip. Kutipan diterjemahkan dari bahasa Jerman asli.</p>
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
        "title": "Koin Jagat alternatif ulasan: tes harian penguji beta",
        "og_title": "Koin Jagat alternatif: ulasan beta",
        "meta": "Ulasan Koin Jagat alternatif: penguji beta mencoba MapRaiders sebagai pendamping lokal di Indonesia, dari sisi wilayah, klan, dan stabilitas server.",
        "keywords": "koin jagat alternatif ulasan, aplikasi koin jagat ulasan, jagat alternatif tes, mapraiders ulasan indonesia",
        "h1_html": 'Koin Jagat alternatif: <em>ulasan jujur</em>',
        "lead": "Pemain Koin Jagat di Indonesia suka konsep gerakan plus lokasi nyata. Tapi server crash dan kedalaman gameplay sering jadi sumber frustrasi. Apakah MapRaiders mengisi celah itu? Tiga penguji beta menjawab.",
        "intro_label": "Pertanyaan tes",
        "intro_title": "Bagaimana <em>MapRaiders berbeda</em> dari Koin Jagat",
        "intro_body": """
    <p>Penguji beta menilai aplikasi di lima sumbu langsung dibanding Koin Jagat:</p>
    <ul>
      <li><strong>Stabilitas server.</strong> Tanpa crash, tanpa antrian.</li>
      <li><strong>Kedalaman gameplay.</strong> Apakah ada lebih dari sekadar &ldquo;mengumpulkan&rdquo;.</li>
      <li><strong>Persistensi wilayah.</strong> Apakah penaklukan tetap bertahan.</li>
      <li><strong>Lapisan klan.</strong> Apakah komunitas terbentuk secara organik.</li>
      <li><strong>Lokalisasi Bahasa Indonesia.</strong> Apakah terasa lokal, atau hasil terjemahan otomatis.</li>
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
        "title": "Aplikasi jalan kaki dengan game ulasan: tes harian",
        "og_title": "Aplikasi jalan kaki dengan game: sepadan kah?",
        "meta": "Apakah aplikasi jalan kaki dengan game itu sepadan? Penguji beta menceritakan motivasi kardio, baterai di rute panjang, dan kerugian wilayah setelah jeda karena flu.",
        "keywords": "aplikasi jalan kaki ulasan, aplikasi jalan kaki dengan game ulasan, kardio aplikasi tes",
        "h1_html": 'Aplikasi jalan kaki dengan game: <em>sepadan kah?</em>',
        "lead": "Apa yang terjadi pada motivasi jalan kaki saat setiap rute menjaga tanah yang nyata? Seperti apa rasanya Decay pertama setelah jeda karena flu? Tiga penguji beta, seorang pelari, seorang walker, dan seorang penjelajah kota, menjawabnya.",
        "intro_label": "Yang kami uji",
        "intro_title": "Yang harus dikasih oleh <em>aplikasi jalan kaki</em>",
        "intro_body": """
    <p>Kami menguji pengalaman jalan kaki di tiga sumbu:</p>
    <ul>
      <li><strong>Jangkar motivasi.</strong> Kapan seseorang kembali setelah jeda.</li>
      <li><strong>Baterai pada rute panjang.</strong> Perjalanan 60-90 menit tanpa menguras ponsel.</li>
      <li><strong>Lintas-aktivitas.</strong> Apakah jalan dengan anjing, walking, dan lari semuanya bekerja sama baiknya.</li>
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
        "title": "Harta karun aplikasi ulasan: penguji beta di MapRaiders",
        "og_title": "Harta karun aplikasi: ulasan beta",
        "meta": "Ulasan aplikasi perburuan harta karun tanpa beli tur atau persiapan: penguji beta menceritakan bagaimana MapRaiders mengubah seluruh kota jadi perburuan langsung.",
        "keywords": "harta karun aplikasi ulasan, harta karun aplikasi tes, live perburuan harta karun ulasan, keluarga harta karun",
        "h1_html": 'Harta karun aplikasi: <em>ulasan</em> tanpa beli tur',
        "lead": "Aplikasi perburuan harta karun biasa butuh persiapan: beli tur, rencanakan rute, atur stasiun. Bagaimana rasanya kalau kota sudah penuh dengan petunjuk dari pemain lain? Tiga penguji beta menjawab.",
        "intro_label": "Pertanyaan tes",
        "intro_title": "Apakah <em>perburuan harta karun langsung</em> bekerja tanpa persiapan",
        "intro_body": """
    <p>Kami menguji fitur perburuan harta karun di tiga skenario:</p>
    <ul>
      <li><strong>Sendirian</strong> sebagai penjelajah kota (Aljoscha P.), menaruh dan menemukan Echo.</li>
      <li><strong>Dengan anjing</strong> dalam jalan-jalan normal (Ron C.), petunjuknya muncul sebagai produk sampingan dari jalan-jalan.</li>
      <li><strong>Skenario keluarga</strong> yang kami simulasikan, seberapa cepat orang dewasa dan anak memahami mekanikanya.</li>
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
        "title": "Permainan Ramadan ulasan: tes selama bulan suci",
        "og_title": "Permainan Ramadan: ulasan dengan menjaga adab",
        "meta": "Ulasan permainan Ramadan: penguji beta mencoba MapRaiders sebagai pendamping Ramadan yang menjaga adab, dari sisi jalan setelah Iftar, aktivitas keluarga, dan baterai untuk Tarawih.",
        "keywords": "permainan ramadan ulasan, game ramadan tes, game ramadan jalan kaki ulasan, jalan-jalan iftar ulasan, mapraiders ramadan",
        "h1_html": 'Permainan Ramadan: <em>ulasan dengan adab</em>',
        "lead": "Apakah sebuah game bisa berjalan dengan menjaga adab selama Ramadan? Bagaimana rasanya jalan setelah Iftar dengan elemen game? Apakah anak-anak bisa ikut tanpa terganggu fokusnya? Tiga penguji beta menjawab.",
        "intro_label": "Pertanyaan tes",
        "intro_title": "Yang bikin <em>permainan Ramadan</em> tetap pantas",
        "intro_body": """
    <p>Kami menguji pengalamannya selama Ramadan di empat sumbu, dengan kepekaan terhadap budaya dan agama:</p>
    <ul>
      <li><strong>Tanpa mekanika judi.</strong> Apakah benar tidak ada loot box, hadiah uang, atau hadiah acak.</li>
      <li><strong>Aktivitas keluarga.</strong> Apakah anak-anak bisa ikut tanpa terganggu dari nilai-nilai Ramadan.</li>
      <li><strong>Konsumsi baterai untuk Tarawih.</strong> Apakah daya cukup setelah jalan-jalan.</li>
      <li><strong>Rasa adab.</strong> Apakah aplikasinya terasa pantas selama bulan suci, atau ada elemen yang mengganggu.</li>
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
    "title": "MapRaiders ulasan: beta-tes, pendiri, semua halaman",
    "og_title": "MapRaiders ulasan: semua di satu tempat",
    "meta": "MapRaiders ulasan: 5,0 dari 5 bintang dari tiga beta-tes, kata pendiri, semua halaman Killer dan laporan ulasan terhubung di satu hub.",
    "keywords": "mapraiders ulasan, mapraiders tes, gps mmo ulasan indonesia",
    "badge": "Hub dan Tinjauan",
    "pricing_pill": "5,0 / 5. Tiga ulasan beta.",
    "h1_html": '<em>MapRaiders ulasan</em>: semua yang perlu kamu tahu soal GPS MMO ini',
    "lead": "Tiga penguji beta dari Stuttgart, Hamburg, dan Berlin. Tujuh topik Killer, dari perbandingan dengan Pokémon GO sampai aplikasi perburuan harta karun. Tujuh ulasan terperinci. Satu hub.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "Sebenarnya MapRaiders itu apa?",
         "a": "MapRaiders adalah GPS MMO untuk Android. Pemain menaklukkan wilayah nyata lewat gerakan, menaruh Echo, membuat misi, dan menjaga tanahnya dengan mini-game. Tanpa iklan, patuh UU PDP, gratis. Pembayaran via GoPay, OVO, atau Dana untuk kosmetik."},
        {"q": "Berapa banyak penguji beta?",
         "a": "Saat ini ada tiga yang kami publikasikan, atas persetujuan mereka dan hanya dengan nama depan plus inisial untuk privasi. Beta tertutupnya lebih besar dari itu, tiga orang ini mewakili persona utama."},
        {"q": "Apakah ulasannya asli?",
         "a": "Asli. Ketiga penguji adalah orang sungguhan dari beta tertutup di Jerman. Mereka tidak dibayar. Kutipannya awalnya ditulis dalam bahasa Jerman, lalu diterjemahkan ke Bahasa Indonesia. Di markup Schema.org, ulasannya ditandai dengan tanggal, bahasa, dan referensi ke versi asli Jerman (translationOfWork)."},
        {"q": "Bagaimana cara jadi penguji beta di Indonesia?",
         "a": "Daftarkan email kamu di halaman beranda Indonesia. Slot beta Indonesia akan dibuka secara bertahap setelah peluncuran utama, prioritas untuk pelari, penjelajah kota, dan keluarga di kota dengan kepadatan Pokémon GO yang rendah."},
        {"q": "Kapan aplikasinya rilis resmi di Indonesia?",
         "a": "MapRaiders saat ini di beta tertutup di Google Play (Jerman). Peluncuran resmi di Indonesia dijadwalkan untuk akhir 2026. iOS di Q3 2026."},
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

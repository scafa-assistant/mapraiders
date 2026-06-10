#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 2 - TR Killer-URL Builder
Generates 15 TR pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_TR_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_tr.py
Idempotent: overwrites existing files in docs/tr/.

TR-Tone: Misafirperverlik (hospitality), aile (family), mahalle (neighbourhood).
TR reviews are translations from DE originals - Schema.org marks this
via translationOfWork pointing to #review-ron-c (de).
"""

import json
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
TR_DIR = DOCS / "tr"
SITE = "https://mapraiders.com"
LANG = "tr"

HREFLANG = [
    ("de", "/"),
    ("en", "/en/"),
    ("fr", "/fr/"),
    ("es", "/es-mx/"),
    ("it", "/it/"),
    ("pt", "/pt-br/"),
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
    ("Português", "pt", "/pt-br/"),
    ("Türkçe", "tr", "/tr/"),
    ("Русский", "ru", "/ru/"),
    ("日本語", "ja", "/ja/"),
    ("한국어", "ko", "/ko/"),
    ("中文", "zh", "/zh-cn/"),
    ("العربية", "ar", "/ar/"),
    ("हिन्दी", "hi", "/hi/"),
]

# -----------------------------------------------------------------------------
# REUSABLE BLOCKS - Master-Plan TR §1.2 + §1.4
# -----------------------------------------------------------------------------

TESTER_RON = {
    "name": "Ron C.",
    "role": "Köpek sahibi · Stuttgart bölgesi, Almanya",
    "role_long": "Stuttgart bölgesinden köpek sahibi, Almanya (kapalı beta)",
    "quote": "Köpeğim zaten günde iki kez dışarı çıkmak zorunda, ben de yanıma blokumu alıyorum artık. Saçma geliyor biliyorum, ama her akşam kısa bir bakıyorum hâlâ her yer mavi mi diye.",
    "date": "2026-03-15",
    "id_tr": "review-ron-c-tr",
    "id_de": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "Koşucu · Hamburg bölgesi, Almanya",
    "role_long": "Hamburg bölgesinden koşucu, Almanya (kapalı beta)",
    "quote": "Zaten her sabah koşuyorum, ama artık bir şeyi de savunuyorum. Alster turum benim, öyle de kalsın. Tuhaf, bir anda ne kadar disiplin geliyor.",
    "date": "2026-03-22",
    "id_tr": "review-vivian-n-tr",
    "id_de": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "Şehir kâşifi · Berlin bölgesi, Almanya",
    "role_long": "Berlin bölgesinden şehir kâşifi, Almanya (kapalı beta)",
    "quote": "Bir kapı önüne kısa bir ses kaydı bırakıyorsun, üç gün sonra hiç tanımadığın biri onu bulmuş oluyor. Bir oyun için tuhaf biçimde samimi geliyor.",
    "date": "2026-04-01",
    "id_tr": "review-aljoscha-p-tr",
    "id_de": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "Pokémon GO'yu üç yıl oynadım, sonra bir noktada bıraktım. "
    "Bana eksik gelen şey hiç gelmedi: geçici gym'ler değil, gerçek toprak. "
    "2025'te Suudi devralması haberi geldiğinde Niantic modelinin benim ilgilendiğim yöne "
    "gitmediğini gördüm. O yüzden MapRaiders'ı kendim yapıyorum. "
    "Reklamsız, yatırımcı baskısı yok, zorunlu abonelik yok. Benim mahallem benim sahamdır; "
    "seninkini sen alabilirsin."
)

# Pricing TRY (Master-Plan §1.1)
PRICING_OFFERS = [
    {"name": "Sonsuza Kadar Ücretsiz", "price": "0", "currency": "TRY"},
    {"name": "Kozmetik IAP'tan", "price": "49", "currency": "TRY"},
    {"name": "MapRaiders Destekçi (Abonelik)", "price": "119", "currency": "TRY"},
    {"name": "Ömürlük Destekçi", "price": "2990", "currency": "TRY"},
]

# DefinedTermSet TR (Master-Plan §8)
DEFINED_TERMS = [
    ("Bölge", "Oyuncuya veya klana kalıcı olarak atanan, harita üzerinde fethedilmiş bir alan"),
    ("Eko", "Oyuncunun bir konumda bıraktığı, başkaları tarafından keşfedilebilecek ses, fotoğraf veya video sinyali"),
    ("Savunma mini oyunu", "Bir bölge çekişmesi sırasında tetiklenen mini oyun (XOX, taş-kağıt-makas, mini satranç)"),
    ("Görev", "Bir oyuncu tarafından oluşturulan, başkalarının gerçek dünyada tamamlayabileceği mini görev"),
    ("Klan", "Bölgeleri birlikte tutan ve savunan organik bir oyuncu grubu"),
    ("Bölge çürümesi", "Terk edilmiş bölgelerin zamanla bozulup yeniden fethedilebilir hale gelmesi mekaniği"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """slug e.g. '/tr/bolge-oyunu.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "tr":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="tr"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">Kapalı betadan</div>
        <div class="fr-stars">★★★★★</div>
        <div class="fr-quote">{tester['quote']}</div>
        <div class="fr-author">{tester['name']}</div>
        <div class="fr-role">{tester['role']}</div>
      </div>"""


def testers_section_html(testers):
    cards = "\n".join(tester_card_html(t) for t in testers)
    return f"""<!-- BETA-TESTCILERI + KURUCU -->
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
    <div class="fr-label">Kurucu</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, MapRaiders Kurucusu" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">Kurucu, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">Kapalı betadan</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.6">
      Not: Test kullanıcıları kapalı beta katılımcılarıdır. Mahremiyet talebi üzerine ad + soyad baş harfi kullanılır. Yorumlar Almanca orijinallerinin çevirisidir; Schema.org bunu şeffaflık için <code>translationOfWork</code> ile işaretler.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="Paylaş"><span class="mr-share__label">Paylaş:</span><a class="mr-share__btn" href="https://wa.me/?text={enc}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/tr/gizlilik.html">Gizlilik</a><a href="/tr/kosullar.html">Koşullar</a><a href="/tr/kunye.html">Künye</a><a href="/tr/iletisim.html">İletişim</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders. Senin sokağın, senin bölgen. Scafa Investments LLC ürünüdür.</p>
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
  <a href="/tr/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/tr/#feat" class="lnk">Özellikler</a>
    <a href="/tr/mapraiders-yorumlar.html" class="lnk">Yorumlar</a>
    <div class="lang-sw">
      <button class="lsw-btn">TR <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('tr')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">Yakında</a>
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
.lsw-drop{position:absolute;top:calc(100% + 6px);right:0;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:6px;min-width:148px;display:none;z-index:200;box-shadow:0 12px 40px rgba(0,0,0,.10);flex-direction:column;gap:1px}
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

def build_review_objects(testers):
    """Build Review schema objects with translationOfWork pointing to DE original."""
    return [
        {
            "@type": "Review",
            "@id": f"#{t['id_tr']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "tr",
            "translationOfWork": {"@type": "Review", "@id": f"#{t['id_de']}", "inLanguage": "de"},
        }
        for t in testers
    ]


def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{SITE}/tr/"},
        {"@type": "ListItem", "position": 2, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = build_review_objects(page.get("testers", ALL_TESTERS))
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
    graph = [
        {
            "@type": "WebPage",
            "@id": f"{SITE}{page['slug']}#webpage",
            "url": f"{SITE}{page['slug']}",
            "name": page["title"],
            "inLanguage": "tr",
            "isPartOf": {"@id": f"{SITE}/tr/#website"},
            "breadcrumb": {"@id": f"{SITE}{page['slug']}#breadcrumb"},
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
            "inLanguage": "tr",
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
            "review": [{"@id": f"#{t['id_tr']}"} for t in page.get("testers", ALL_TESTERS)],
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
            "jobTitle": "Kurucu",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-tr",
            "name": "MapRaiders Marka Sözlüğü Türkçe",
            "inLanguage": "tr",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{SITE}/tr/"},
        {"@type": "ListItem", "position": 2, "name": "Yorumlar", "item": f"{SITE}/tr/mapraiders-yorumlar.html"},
        {"@type": "ListItem", "position": 3, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = []
    for t in ALL_TESTERS:
        obj = {
            "@type": "Review",
            "@id": f"#{t['id_tr']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "tr",
            "translationOfWork": {"@type": "Review", "@id": f"#{t['id_de']}", "inLanguage": "de"},
            "itemReviewed": {"@id": f"{SITE}{page['slug']}#app"},
        }
        review_objs.append(obj)
    graph = [
        {
            "@type": "WebPage",
            "@id": f"{SITE}{page['slug']}#webpage",
            "url": f"{SITE}{page['slug']}",
            "name": page["title"],
            "inLanguage": "tr",
            "breadcrumb": {"@id": f"{SITE}{page['slug']}#breadcrumb"},
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
            "inLanguage": "tr",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "3",
                "bestRating": "5",
            },
            "review": [{"@id": f"#{t['id_tr']}"} for t in ALL_TESTERS],
        },
        *review_objs,
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_hub(page, all_killers, all_twins):
    base = build_schema_killer(page)
    item_list = {
        "@type": "ItemList",
        "@id": f"{SITE}{page['slug']}#itemlist",
        "name": "MapRaiders TR - tüm yorum ve killer sayfaları",
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
# PAGE TEMPLATE
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
  <div class="sec-label rv">SSS</div>
  <h2 class="sec-title rv d1">Sıkça <em>Sorulan Sorular</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Sahaya <em>daha derin</em></h2>
  <p class="rv d1">MapRaiders ile ilgili konular:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Yakında Google Play'de &bull; Ücretsiz &bull; Spam yok</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">Lansmanda haber ver</a>
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
  <span>"{page['trigger']['quote']}"</span>
  <cite>– {page['trigger']['author']}</cite>
</div>"""

    pricing_pill = ""
    if page.get("pricing_pill"):
        pricing_pill = f'<div class="pricing-pill rv">{page["pricing_pill"]}</div>'

    return f"""<!DOCTYPE html>
<html lang="tr" data-theme="light">
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
<meta property="og:locale" content="tr_TR">
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
    Lansmanda haber ver
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
  <div class="sec-label rv">Puanlama</div>
  <h2 class="sec-title rv d1">5,0 / 5 yıldız: <em>3 doğrulanmış beta yorumu</em></h2>
  <div class="prose rv d2">
    <p>Almanya'dan üç beta test kullanıcısı, bir köpek sahibi, bir koşucu ve bir şehir kâşifi, MapRaiders'ı haftalarca kullandı. Aşağıdaki yorumlar Almanca orijinallerinden çevrilmiştir ve kapalı betadaki gerçek kişileri temsil eder. Schema.org bunu şeffaflık için <code>translationOfWork</code> ile işaretler.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="tr" data-theme="light">
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
<meta property="og:locale" content="tr_TR">
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
  <div class="h-badge rv">Yorumlar</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">Daha fazla bilgi →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Yorum →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">Konu Merkezi</div>
  <h2 class="sec-title rv d1">Tüm <em>MapRaiders konuları</em> bir arada</h2>
  <div class="prose rv d2">
    <p>Burada 7 killer sayfa ve buna eşlik eden 7 yorum sayfası bulacaksın. Her biri MapRaiders'a farklı bir açıdan bakıyor: bir kez Pokémon GO alternatifi olarak, bir kez hazine avı uygulaması, bir kez koşu arkadaşı. İstediğin sayfayı tek başına okuyabilir veya konudan konuya geçebilirsin.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Detaylı Yorumlar</div>
  <h2 class="sec-title rv d1">Beta test kullanıcıları <em>farklı bakış açılarından</em> ne diyor</h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Toplu Puan</div>
  <h2 class="sec-title rv d1">5,0 / 5 yıldız: <em>3 doğrulanmış beta yorumu</em></h2>
  <div class="prose rv d2">
    <p>Tüm yorumlar Şubat ile Nisan 2026 arasındaki kapalı beta aşamasından gelir. Üç test kullanıcısı (bir köpek sahibi, bir koşucu, bir şehir kâşifi) MapRaiders'ı Stuttgart, Hamburg ve Berlin'deki kendi rotalarında test etti. Yorumlar Almanca orijinallerinden çevrilmiştir; Schema.org şeffaflık için <code>translationOfWork</code> ile işaretler.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="tr" data-theme="light">
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
<meta property="og:locale" content="tr_TR">
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
  <div class="h-badge rv">MapRaiders Merkezi</div>
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
# PAGE DATA - KILLERS (K1-K7) per Master-Plan §4
# -----------------------------------------------------------------------------

# K1 - bolge-oyunu (Brand-USP)
K1 = {
    "slug": "/tr/bolge-oyunu.html",
    "breadcrumb": "Bölge Oyunu",
    "title": "Bölge oyunu: gerçek toprağı fethet (Türkçe GPS MMO)",
    "og_title": "Bölge oyunu: gerçek toprağı fethet",
    "meta": "Bölge oyunu mobile uygulama. MapRaiders, gerçek toprağı kalıcı olarak fethettiren bir GPS MMO. Reklam yok, ücretsiz, AR yok.",
    "keywords": "bölge oyunu, bolge oyunu, mahalle oyunu, gps mmo türkçe, konum tabanlı oyun",
    "badge": "Bölge Oyunu",
    "pricing_pill": "Sonsuza kadar ücretsiz. Kozmetik 49 TL'den.",
    "h1_html": 'Senin sokağın. <em>Senin bölgen.</em>',
    "lead": "MapRaiders, gerçek GPS alanını kalıcı bölgeye dönüştüren bir oyun. Yürüyerek talep et, mini oyunlarla savun, klanınla birlikte tut. Reklam yok, pay-to-win mantığı yok, KVKK uyumlu olarak hazırlandı.",
    "trigger": {
        "quote": "Zaten her sabah koşuyorum, ama artık bir şeyi de savunuyorum. Alster turum benim, öyle de kalsın.",
        "author": "Vivian N., Hamburg bölgesinden koşucu (kapalı beta)"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Bölge oyunu nedir?",
            "title": "Gerçek bir <em>bölge oyununun</em> 4 mekaniği",
            "body": """
    <p><strong>Bölge oyunu</strong>, oyuncuların harita üzerinde kalıcı olarak alan sahiplendiği, savunduğu ve genişlettiği oyun türüdür. Pokémon GO'daki gym yakalamalarından farklı olarak <strong>kalıcılık</strong> esastır: oyuncu çevrimdışı olduğunda da bölge sahipliği devam eder.</p>
    <p>Gerçek bir bölge oyununu tanımlayan dört temel mekanik:</p>
    <ul>
      <li><strong>Kalıcılık.</strong> Fethedilmiş alanlar, aktif olarak ele geçirilmedikçe oyuncuya veya klana atanmış kalır.</li>
      <li><strong>Bölge çürümesi.</strong> Aktif olmayan bölgeler zamanla küçülür. Aktif oynamadan kimse alan tutamaz.</li>
      <li><strong>Savunma.</strong> Bir saldırı sırasında iki oyuncu arasında bir mini oyun karar verir, otomatik istatistik karşılaştırması değil.</li>
      <li><strong>Klan devirleri.</strong> Bölgeler oyunculara veya bir klana devredilebilir. Bu da ekonomik derinlik açar.</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders sistemi",
            "title": "MapRaiders'ın <em>bölge sistemi</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Talep et</h3><p>Yürüyerek, koşarak veya bisikletle bir sokaktan geç. GPS izi adına bölgeyi oluşturur, haritada görünür bir çokgen olarak.</p></div>
    <div class="feat-card rv d1"><h3>Çürüme motoru</h3><p>Düzenli geçilmeyen bölge günlük olarak yüzdelik biçimde küçülür. Araziyi aktivite tutar, ödeme değil.</p></div>
    <div class="feat-card rv d2"><h3>Savunma mini oyunları</h3><p>7 farklı mini oyun saldırılara karar verir: XOX, taş-kâğıt-makas, mini satranç. Oynama süresinden çok strateji önemli.</p></div>
    <div class="feat-card rv d3"><h3>Klan bölgeleri</h3><p>Birden fazla oyuncu bir bölgeyi birlikte tutabilir. Klan alanları daha sağlamdır, tek bir saldırgan kırmaya yetmez.</p></div>
  </div>""",
        },
        {
            "label": "Pokémon GO'dan farkı",
            "title": "Pokémon GO neden <em>gerçek bir bölge oyunu değildir</em>",
            "body": """
    <p><strong>Pokémon GO gym yakalamaları</strong> geçicidir: birkaç saat boyunca en yüksek skoru tutan kişi koin kazanır, ancak bölge gerçek anlamda bir arazi değildir. Gym bir noktadır, alan değil.</p>
    <p>MapRaiders tam bu noktada başlar. <strong>Bölge, oyun kaynağıdır</strong>, üzerindeki nokta değil. Toprak kazanırsın, toprak kaybedersin, toprak devredersin. Mekânsal bir oyunda olması gerektiği gibi.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders'da bölge sistemi nasıl çalışır?",
         "a": "Fiziksel olarak sokaklardan geçer ve GPS alanlarını talep edersin. Bu bölgeler canlı haritada görünür ve başka bir oyuncu gelip seni meydan okumadığı sürece sana aittir. Başarılı savunma yaparsan alan senin kalır."},
        {"q": "Bölgemi kaybedebilir miyim?",
         "a": "Evet. Bölge çürüme sistemi, aktif olmayan alanların günlük olarak küçülmesini sağlar. Düzenli olarak alanını gezenler bölgesini tutar, bırakanlar kaybeder. Böylece harita canlı kalır."},
        {"q": "Bölgesel saldırıda ne olur?",
         "a": "Saldırgan fiziksel olarak bölgene gelmek zorundadır. Sonra savunan ile saldıranın karşılıklı oynadığı bir mini oyun başlar. Mini oyunu kazanan, alanın kaderine karar verir."},
        {"q": "Klan bölgeleri sistemi var mı?",
         "a": "Evet. MapRaiders'daki klanlar organik olarak oluşur ve bölgeleri birlikte talep edebilir. Klan alanları daha güçlüdür, birden fazla saldırganın koordineli hareket etmesini gerektirir. Takım çalışması karşılığını verir."},
        {"q": "Bölge oyunu ücretsiz mi?",
         "a": "Evet. Tüm bölge oynanışı ücretsizdir. İsteğe bağlı olarak işaretçi tasarımları ve bölge renkleri için kozmetik ürünler vardır (49 ile 249 TL arası). Bunlar oyun avantajı vermez, sadece görseldir."},
    ],
    "internal_links": [
        ("/tr/konum-tabanli-oyun.html", "Konum tabanlı oyun karşılaştırması"),
        ("/tr/yuruyus-oyunu.html", "Yürüyüş oyunu - kardiyo + bölge"),
        ("/tr/mahalle-oyunu.html", "Mahalle oyunu"),
        ("/tr/bolge-oyunu-yorumlar.html", "Bölge oyunu yorumları"),
        ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
    ],
}

# K2 - konum-tabanli-oyun (Volumen-King)
K2 = {
    "slug": "/tr/konum-tabanli-oyun.html",
    "breadcrumb": "Konum Tabanlı Oyun",
    "title": "Konum tabanlı oyun 2026: 7 GPS oyun karşılaştırması",
    "og_title": "Konum tabanlı oyun 2026: 7 GPS oyun karşılaştırması",
    "meta": "Konum tabanlı oyun 2026: gerçek bölge, reklam yok, pay-to-win yok. MapRaiders ve 6 alternatifin karşılaştırması. Türkçe tam destek.",
    "keywords": "konum tabanlı oyun, konum bazlı oyun, gps oyun, location based game türkçe, harita oyunu",
    "badge": "Konum Tabanlı Oyun",
    "pricing_pill": "Ücretsiz. KVKK uyumlu. Reklam yok.",
    "h1_html": 'Konum tabanlı oyun: <em>gerçek harita</em> senin oyun alanın',
    "lead": "Konum tabanlı bir oyun, GPS ile şehri oyun alanına çevirir. Çoğu uygulama bunu sadece konum verisini reklam için toplama bahanesi olarak kullanıyor. MapRaiders bölgeleri, ekoları, görevleri ve savunma mini oyunlarını birleştirerek gerçekten mekânsal bir oyun kuruyor.",
    "trigger": {
        "quote": "Bir kapı önüne kısa bir ses kaydı bırakıyorsun, üç gün sonra hiç tanımadığın biri onu bulmuş oluyor.",
        "author": "Aljoscha P., Berlin bölgesinden şehir kâşifi (kapalı beta)"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "7 oyun karşılaştırma",
            "title": "2026'nın <em>7 dikkate değer</em> konum tabanlı oyunu",
            "body": "<p>Çoğu liste rastgele uygulamaları yan yana koyuyor. Aşağıda kim ne için iyi, daha dürüst bir bakış:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>#</th><th>Oyun</th><th>Yapımcı</th><th>Reklamsız</th><th>Gerçek bölge</th><th>KVKK</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓</td><td class="check">✓ kalıcı</td><td class="check">✓</td></tr>
      <tr><td>2</td><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely (Suudi PIF iştiraki)</td><td class="cross">✗</td><td class="cross">Geçici gym</td><td class="cross">Suudi PIF</td></tr>
      <tr><td>3</td><td class="feat-name">Turf Wars</td><td>Cazoodle</td><td class="cross">✗</td><td>Sınırlı</td><td>Bilinmiyor</td></tr>
      <tr><td>4</td><td class="feat-name">Ingress Prime</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Portal noktaları</td><td class="cross">Suudi PIF</td></tr>
      <tr><td>5</td><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">Suudi PIF</td></tr>
      <tr><td>6</td><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="check">✓</td><td class="cross">Cache, alan değil</td><td>Premium ödüllü</td></tr>
      <tr><td>7</td><td class="feat-name">Wokamon</td><td>SilkroadGames</td><td class="cross">✗</td><td class="cross">✗</td><td>Bilinmiyor</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "MapRaiders farkı",
            "title": "MapRaiders'ı <em>diğerlerinden</em> ayıran noktalar",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Kalıcı bölge</h3><p>Bir sokağı fethettiğinde, biri seni alana kadar veya çürüme başlayana kadar sana aittir. Birkaç saatte uçup giden gym yok.</p></div>
    <div class="feat-card rv d1"><h3>AR yerine eko</h3><p>Gerçek konumlara ses, fotoğraf veya video ekosu bırak. Diğer oyuncular oradan geçince keşfeder. Kameraya gerek yok, pil de yorulmuyor.</p></div>
    <div class="feat-card rv d2"><h3>7 savunma mini oyunu</h3><p>Saldırı geldiğinde XOX, taş-kâğıt-makas veya mini satranç karar verir. Saatlerce oynayan değil, kafa kullanan kazanır.</p></div>
    <div class="feat-card rv d3"><h3>Organik klanlar</h3><p>Klanlar aynı Discord sunucusundan değil, aynı sokakta yürüyen insanlardan doğar. Yani algoritma yerine mekânsal yakınlık.</p></div>
  </div>""",
        },
        {
            "label": "Suudi-Niantic sorunu",
            "title": "Mart 2025'te <em>Pokémon GO el değiştirdi</em>",
            "body": """
    <p>Mart 2025'te Niantic, oyun bölümünü (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) 3,5 milyar dolara Scopely'ye sattı. Scopely, Suudi Arabistan Public Investment Fund'ın (PIF) bir iştiraki, yani resmi olarak devlet kontrolündeki bir holdingin parçası.</p>
    <p>Somut olarak bu, <strong>aylık 30 milyondan fazla Pokémon GO oyuncusunun konum verisinin</strong> (kim nerede koşuyor, köpeğini ne zaman gezdiriyor, hangi rotaları her gün yürüyor) Scopely'nin altyapısı üzerinden işlendiği anlamına geliyor. AB dışındaki devlet fonu yakın aktörlere karşı KVKK doğrudan koruma sağlamıyor.</p>
    <p>MapRaiders, <strong>özel mülkiyetteki</strong> bir ABD LLC'sidir (Scafa Investments LLC, Florida) ve bağımsız bir ekip tarafından geliştirilir. Sunucular AB uyumlu, veri satışı yok, reklam ağı bağlı değil, devlet kontrolünde de değil.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Konum tabanlı oyun nedir?",
         "a": "Konum tabanlı oyun, cihazın GPS konumunu oyun mekaniği için kullanan oyun türüdür. MapRaiders bölgeleri, ekoları ve görevleri gerçek yerlere bağlamak için GPS kullanır. Yani gerçek şehir senin oyun alanına dönüşür."},
        {"q": "Türkçe tam destek var mı?",
         "a": "Evet. MapRaiders tamamen Türkçe yerelleştirilmiştir: menüler, eko sistemi, ipuçları, destek. Tüm fontlar Türkçe karakterleri (ç ş ğ ı ö ü) düzgün gösterir."},
        {"q": "AR (artırılmış gerçeklik) gerekli mi?",
         "a": "Hayır. MapRaiders bilinçli olarak AR kullanmadan kuruldu. Sadece GPS ve harita kullanılır. Bu hem pil ömrünü hem de mahremiyeti korur: kamera yok, yüz görüntüsü yok."},
        {"q": "Türkiye'nin her şehrinde çalışır mı?",
         "a": "Evet. OpenStreetMap verilerinin olduğu her yerde çalışır, yani fiilen Türkiye'nin her yerinde. İstanbul, Ankara, İzmir gibi büyük şehirlerde oyuncu yoğunluğu daha yüksek. Kırsal bölgelerde rekabet daha az, bölgeler ise daha geniş."},
        {"q": "KVKK uyumlu mu?",
         "a": "Evet. Veri satışı yok, reklam SDK'sı yok, üçüncü ülkelere onaysız veri aktarımı yok. KVKK kapsamındaki haklarını (bilgi alma, silme) info@scafa-investments.com adresinden 30 gün içinde kullanabilirsin."},
    ],
    "internal_links": [
        ("/tr/bolge-oyunu.html", "Bölge oyunu - marka USP"),
        ("/tr/pokemon-go-alternatif-ucretsiz.html", "Pokémon GO alternatif ücretsiz"),
        ("/tr/fake-gps-olmadan-oyun.html", "Fake GPS olmadan oyun"),
        ("/tr/yuruyus-oyunu.html", "Yürüyüş oyunu"),
        ("/tr/hazine-avi-uygulamasi.html", "Hazine avı uygulaması"),
        ("/tr/mahalle-oyunu.html", "Mahalle oyunu"),
        ("/tr/konum-tabanli-oyun-yorumlar.html", "Konum tabanlı oyun yorumları"),
        ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
    ],
}

# K3 - pokemon-go-alternatif-ucretsiz
K3 = {
    "slug": "/tr/pokemon-go-alternatif-ucretsiz.html",
    "breadcrumb": "Pokémon GO Alternatif Ücretsiz",
    "title": "Pokémon GO alternatifi ücretsiz: reklam yok, fake GPS yok",
    "og_title": "Pokémon GO alternatifi ücretsiz: bağımsız ve KVKK uyumlu",
    "meta": "Pokémon GO alternatifi ücretsiz arıyorsanız: MapRaiders tamamen ücretsiz, reklamsız, gerçek bölge sistemiyle çalışır. Suudi sahipliğinden bağımsız bir alternatif.",
    "keywords": "pokemon go alternatif, pokemon go alternatifi ücretsiz, pokemon go yerine, gps oyun ücretsiz",
    "badge": "Ücretsiz Alternatif",
    "pricing_pill": "0 TL oynanış. Kozmetik isteğe bağlı.",
    "h1_html": 'Pokémon GO alternatifi <em>ücretsiz</em>: reklam, zorunlu abonelik ve Suudi yatırımcı olmadan',
    "lead": "Battle Pass baskısı ve Remote Raid Pass tartışması olmayan bir Pokémon GO alternatifi arayanlar genellikle başka bir premium tuzağa düşüyor. MapRaiders bunu tersine çevirir: temel oynanışın tamamı ücretsizdir ve öyle kalır. Tier sistemi yok, zorunlu abonelik yok, veri satışı yok.",
    "trigger": {
        "quote": "Köpeğim zaten günde iki kez dışarı çıkmak zorunda, ben de yanıma blokumu alıyorum artık. Saçma geliyor biliyorum, ama her akşam kısa bir bakıyorum hâlâ her yer mavi mi diye.",
        "author": "Ron C., Stuttgart bölgesinden köpek sahibi (kapalı beta)"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Neden alternatif?",
            "title": "Türk oyuncuların 2026'da neden <em>alternatif aradığı</em>",
            "body": """
    <p>2024 ile 2026 arasında üç acı nokta pazarı olgunlaştırdı:</p>
    <ul>
      <li><strong>Battle Pass hayal kırıklığı.</strong> Ödemesiz işlemeyen sezonluk pass'ler. Bir sezonu atlayanın ödülleri kalıcı olarak kaybediliyor.</li>
      <li><strong>Remote Raid Pass tartışması.</strong> Niantic 2023'te fiyatları artırıp kullanılabilirliği azalttı, bunun üzerine bir oyuncu dalgası oyunu bıraktı.</li>
      <li><strong>Mart 2025 devri.</strong> Niantic, oyun bölümünü Suudi PIF iştiraki Scopely'ye sattı. Milyonlarca oyuncunun konum verisi o günden beri dolaylı olarak yabancı bir devlet fonu üzerinden işleniyor.</li>
    </ul>
            """,
        },
        {
            "label": "Ücretsiz ne demek?",
            "title": "MapRaiders'da <em>&bdquo;ücretsiz&rdquo;</em> gerçekten ne demek",
            "body": "<p>Tier'leri şeffafça açıklıyoruz: gizli ödeme duvarı yok, 10 dakika sonra eğitim kilidi yok:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>Ne</th><th>Fiyat (TL, KDV dâhil)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Sonsuza Kadar Ücretsiz</td><td>Tüm oynanış (bölgeler, ekolar, görevler, klanlar, savunma, etkinlikler)</td><td>0 TL</td></tr>
      <tr><td class="feat-name">Kozmetik IAP</td><td>İşaretçi tasarımları, bölge renkleri, klan amblemleri, kostümler</td><td>49 ile 249 TL arası</td></tr>
      <tr><td class="feat-name">MapRaiders Destekçi (Abonelik)</td><td>Onur rozeti, beta erişim, kurucu mektubu, aylık kozmetik paket</td><td>119 TL / ay</td></tr>
      <tr><td class="feat-name">Ömürlük Destekçi</td><td>Koleksiyoner kozmetik ve jenerikte adın</td><td>Tek seferlik 2.990 TL</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Önemli:</strong> Kozmetik ürünler hiçbir oyun avantajı vermez. Hiç satın almayan biri, Ömürlük Destekçi ile aynı mekanikleri oynar.</p>""",
        },
        {
            "label": "Suudi-Niantic sorusu",
            "title": "<em>Suudi-Niantic</em> sorusu: verilerinle ne oluyor?",
            "body": """
    <p>Niantic Mart 2025'te oyun bölümünü 3,5 milyar dolara Scopely'ye sattı. Scopely, Suudi Public Investment Fund'ın (PIF) bir iştiraki, yani Suudi Arabistan'ın devlet kontrolündeki bir holdingin parçası.</p>
    <p>MapRaiders ise <strong>özel mülkiyetteki</strong> bir ABD LLC'sidir (Scafa Investments LLC, Florida). AB uyumlu sunucular, veri satışı yok, reklam ağı yok, devlet kontrolünde de değil.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders gerçekten sonsuza dek ücretsiz mi?",
         "a": "Evet. Temel oynanış (bölge fethi, eko bırakma, görev oluşturma, klan kurma) sonsuza dek ücretsiz kalır. Tier sistemi yok, Battle Pass yok, abonelik zorunluluğu yok."},
        {"q": "Kozmetik IAP ne kadar?",
         "a": "İşaretçi tasarımları, bölge renkleri veya klan amblemleri gibi kozmetik ürünler 49 ile 249 TL arasındadır (KDV dâhil). Hiçbir oyun avantajı vermezler, sadece görsel değişiklik sağlarlar."},
        {"q": "Uygulamada reklam var mı?",
         "a": "Hayır. MapRaiders tamamen reklamsızdır. Ne veri ne de reklam alanı satıyoruz."},
        {"q": "&bdquo;Suudi yatırımcısız&rdquo; ne demek?",
         "a": "Mart 2025'te Niantic, oyun bölümünü 3,5 milyar dolara Scopely'ye sattı. Scopely, Suudi PIF iştirakidir. Aylık 30 milyondan fazla Pokémon GO oyuncusunun konum verisi o zamandan beri dolaylı olarak yabancı bir devlet fonu üzerinden işleniyor. MapRaiders ise özel mülkiyetteki bir ABD LLC'sidir ve devlet kontrolünde değildir."},
        {"q": "MapRaiders'ın arkasında kim var?",
         "a": "René Scafarti (Kurucu, Scafa Investments LLC) ve küçük bağımsız bir ekip. Dış yatırımcı, devlet katılımı veya reklam ağı yok."},
    ],
    "internal_links": [
        ("/tr/bolge-oyunu.html", "Bölge oyunu nedir"),
        ("/tr/konum-tabanli-oyun.html", "Konum tabanlı oyun karşılaştırması"),
        ("/tr/fake-gps-olmadan-oyun.html", "Fake GPS olmadan oyun"),
        ("/tr/pokemon-go-alternatif-yorumlar.html", "Pokémon GO alternatif yorumları"),
        ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
    ],
}

# K4 - fake-gps-olmadan-oyun (TR-EXKLUSIV!)
K4 = {
    "slug": "/tr/fake-gps-olmadan-oyun.html",
    "breadcrumb": "Fake GPS Olmadan Oyun",
    "title": "Fake GPS olmadan oyun: adil GPS MMO (anti-cheat)",
    "og_title": "Fake GPS olmadan oyun: adil GPS MMO",
    "meta": "Fake GPS olmadan oyun: MapRaiders dürüst bir alternatif. PGSharp veya MocPOGO ile koşacağına gerçekten yürürsün, oyun da bu temele dayanıyor.",
    "keywords": "fake gps olmadan oyun, hile yapmadan gps oyun, anti cheat gps oyun, dürüst gps mmo, pgsharp alternatifi",
    "badge": "Anti-Cheat (TR'ye özel)",
    "pricing_pill": "Adil oyun. Hile anlamsız. Yürümek = oynamak.",
    "h1_html": 'Fake GPS olmadan oyun: burada <em>herkes adil oynar</em>',
    "lead": "Türkiye'de PGSharp, MocPOGO ve diğer fake-GPS araçları neredeyse bir karaborsa haline geldi. Pokémon GO oyuncuları evden çıkmadan gym yakalıyor, bu da gerçekten yürüyenlere haksızlık. MapRaiders bu sorunu kökten çözer: bölge yalnızca gerçek hareketle gelir, hile yapmanın anlamı kalmaz.",
    "trigger": {
        "quote": "Fake GPS gerek yok. Burada herkes adil oynar.",
        "author": "MapRaiders Adil Oyun İlkesi"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "TR fake-GPS gerçeği",
            "title": "Türkiye'de <em>fake-GPS karaborsası</em>",
            "body": """
    <p>Türk oyuncu topluluklarında (Discord, Telegram, Ekşi Sözlük) fake-GPS araçları açıkça konuşulur: PGSharp aboneliği, MocPOGO yıllık paketleri, root'lu Android cihazlar için iSpoofer klonları. Bunların hepsi yıllardır <strong>Pokémon GO</strong> tarafında çözülememiş bir sorundur.</p>
    <p>Niantic'in tepkisi banlama dalgaları, ileri tespit ve üç-strike sistemi oldu. Ama temel sorun çözülmedi: <strong>fake-GPS oyunun temel mekaniğine bir kısa yol sunduğu sürece</strong> bir yenisi mutlaka geliyor.</p>
    <p>Sonuç olarak adil oyuncular sürekli hile yapanlarla karşılaşıyor. Gerçekten yürümek için zaman ayıran biri, fake-GPS kullanan birinden geride kalıyor. Bu, oyun deneyimini bozar.</p>
            """,
        },
        {
            "label": "Fake-GPS listesi",
            "title": "TR'de yaygın <em>fake-GPS araçları</em>",
            "body": "<p>MapRaiders bu araçları gereksiz kıldığı için ne yaptıklarını ve bizim modelimizde neden işe yaramadıklarını bilmek faydalı:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Araç</th><th>Platform</th><th>Pokémon GO'da kullanım</th><th>MapRaiders'da etkili mi?</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">PGSharp</td><td>Android (root gerekli)</td><td>Konum sahteciliği, hızlı atılım</td><td class="check">Gereksiz</td></tr>
      <tr><td class="feat-name">MocPOGO</td><td>iOS ve Android</td><td>Sahte yürüme, joystick kontrolü</td><td class="check">Gereksiz</td></tr>
      <tr><td class="feat-name">iPogo</td><td>iOS (jailbreak)</td><td>Konum ve ileri özellikler</td><td class="check">Gereksiz</td></tr>
      <tr><td class="feat-name">Tutuapp</td><td>Android</td><td>Modlu istemci</td><td class="check">Gereksiz</td></tr>
      <tr><td class="feat-name">FGL Pro</td><td>Android</td><td>Sahte konum sağlayıcı</td><td class="check">Gereksiz</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Neden gereksiz?",
            "title": "MapRaiders <em>fake-GPS'i neden gereksiz</em> kılar",
            "body": """
    <p>Birkaç tasarım seçimi fake-GPS motivasyonunu sıfıra indiriyor:</p>
    <ul>
      <li><strong>Bölge çürümesi.</strong> Sahte konumla bir alanı bir kez alabilirsin, ama düzenli dönmezsen çürüme onu eritir. Hile uzun vadeli avantaj sağlamaz.</li>
      <li><strong>Hız doğrulaması.</strong> 25 km/saatten hızlı hareket reddedilir (araba, uçak, fake-GPS sıçramaları). Yürüme, koşu ve bisiklet sayılır.</li>
      <li><strong>Klan tabanı.</strong> Klanlar fiziksel komşulardan oluşur. Sahte konum bir kişinin tek başına alan almasına yardım edebilir ama uzun vadeli bir klana ait olmasını imkânsız kılar.</li>
    </ul>
    <p>Sonuç olarak oynamak için yürümen gerekiyor. Hilenin bir anlamı kalmıyor.</p>
            """,
        },
        {
            "label": "Adil oyun değer önermesi",
            "title": "Adil oyun bir <em>değer önermesidir</em>, sadece kural değil",
            "body": """
    <p>Pokémon GO'nun fake-GPS sorunu sadece teknik bir problem değil, aynı zamanda <strong>bir topluluk sorunudur</strong>. Hile yapanlarla karşılaşan dürüst oyuncular ya kendileri hile yapmaya başlıyor ya da oyunu bırakıyor. İki yol da oyunu öldürür.</p>
    <p>MapRaiders bunu farklı çözüyor: hile teknik olarak imkânsız değil, <strong>anlamsız</strong>. Yürümeden bölge tutamazsın. Bu, fiziksel adaleti yapısal olarak garanti eder.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders'da fake GPS işe yarar mı?",
         "a": "Hayır. Hız doğrulaması (25 km/saat üst limit), bölge çürümesi (düzenli geçiş şartı) ve fiziksel klan tabanı sahte konumu anlamsız kılar. Sahte konumla bir alan alabilirsin ama elinde tutamazsın."},
        {"q": "Hile yapanlar yasaklanır mı?",
         "a": "Anormal GPS desenleri (sıçramalar, imkânsız hız) otomatik tespit edilir ve hesap işaretlenir. Asıl savunma ise yapısaldır: sistem hile yapmayı doğrudan avantajsız kılar."},
        {"q": "Otomatik araç tespiti var mı?",
         "a": "Evet. 25 km/saatten hızlı hareket araba kabul edilir ve bölge talebi reddedilir. Bisiklet (genelde 15-25 km/saat) sayılır, araba sayılmaz."},
        {"q": "PGSharp veya MocPOGO ile oynayabilir miyim?",
         "a": "Teknik olarak yükleyebilirsin ama anlamı kalmaz. Bu araçlar Pokémon GO'nun zayıf noktalarını sömürmek için yapılmıştır, MapRaiders'ın yapısı farklı."},
        {"q": "Saldırılar adil mi?",
         "a": "Evet. Bir bölgeye saldırmak için fiziksel olarak oraya gitmen gerekir. Sonra savunma mini oyunu (XOX, taş-kâğıt-makas, mini satranç) iki oyuncuyu eşit seviyeye getirir."},
    ],
    "internal_links": [
        ("/tr/bolge-oyunu.html", "Bölge oyunu nedir"),
        ("/tr/konum-tabanli-oyun.html", "Konum tabanlı oyun karşılaştırması"),
        ("/tr/pokemon-go-alternatif-ucretsiz.html", "Pokémon GO alternatif ücretsiz"),
        ("/tr/fake-gps-olmadan-yorumlar.html", "Fake-GPS olmadan yorumlar"),
        ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
    ],
}

# K5 - yuruyus-oyunu
K5 = {
    "slug": "/tr/yuruyus-oyunu.html",
    "breadcrumb": "Yürüyüş Oyunu",
    "title": "Yürüyüş oyunu: adımların bölgeye dönüşür (kardiyo ve oyun)",
    "og_title": "Yürüyüş oyunu: adımların bölgeye dönüşür",
    "meta": "Yürüyüş oyunu: MapRaiders her adımı bölge fethine çevirir. Kardiyo, oyun ve mahalle aktivitesi tek uygulamada.",
    "keywords": "yürüyüş oyunu, yuruyus oyunu, yürüyerek kazan, koşu oyunu, kardiyo oyun, fitness mmo",
    "badge": "Yürüyüş ve Kardiyo",
    "pricing_pill": "Sonsuza kadar ücretsiz. Pokémon GO'ya kıyasla yaklaşık dört kat daha az pil.",
    "h1_html": 'Yürüyüş oyunu: her <em>turun bir amacı</em> var',
    "lead": "Strava istatistik verir, Pokémon GO koleksiyon verir. Ama hiçbiri gerçek yürüyüş yolunu gerçek araziye çevirmiyor. MapRaiders bunu yapar: her adım bölge şekillendirir, her tur onu savunur. Kardiyonun bir sonucu olur.",
    "trigger": {
        "quote": "Zaten her sabah koşuyorum, ama artık bir şeyi de savunuyorum. Tuhaf, bir anda ne kadar disiplin geliyor.",
        "author": "Vivian N., Hamburg bölgesinden koşucu (kapalı beta)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "Sorun",
            "title": "Klasik yürüyüş uygulamalarının <em>eksiklikleri</em>",
            "body": """
    <p>Strava, Nike Run Club, Adidas Running zamanı, mesafeyi ve tempoyu ölçer. Ama birçok yürüyüşçü ve koşucu için bir kaç önemli nokta eksik kalıyor:</p>
    <ul>
      <li><strong>Oyun unsuru yok.</strong> En iyi süreleri kovalamayan biri dört hafta sonra motivasyonunu kaybediyor.</li>
      <li><strong>Performans baskısı.</strong> Genele açık liderlik tabloları bazılarını motive ederken bir o kadar kişiyi de demotive ediyor.</li>
      <li><strong>Abonelik zorunluluğu.</strong> Strava Premium ısı haritası ve rota karşılaştırması için aylık 8,99 dolar; ücretsiz katmanda bu özellikler neredeyse kullanılamaz hale geldi.</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders rutini değiştirir",
            "title": "MapRaiders <em>yürüyüş rutinini</em> nasıl değiştirir",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Bölgeyi tut</h3><p>Her rota bölgeyi savunur. Üç gün ara verirsen çürüme başlar, doğal bir geri dönüş motivasyonu olur.</p></div>
    <div class="feat-card rv d1"><h3>Çürüme sayacı</h3><p>Çürüme değeri "Bugün yürümezsen mahallen yüzde X kadar küçülür" der. Suçluluk değil, somut fiziksel gerçek.</p></div>
    <div class="feat-card rv d2"><h3>Yürürken klan savunması</h3><p>Koşarken klan bölgesi saldırıya uğrarsa push bildirim alırsın. Yalnız koşmuyorsun, ekibinle birlikte koşuyorsun.</p></div>
    <div class="feat-card rv d3"><h3>Eko ödülü</h3><p>Geçerken ses ekoları. Diğer oyuncular sokağın hikayelerini sana anlatıyor. Reklam yok, influencer yok.</p></div>
  </div>""",
        },
        {
            "label": "50+ yaş ve uzun ömür",
            "title": "<em>50+ yaş için</em> longevity gaming",
            "body": """
    <p>Türkiye'de 50 yaş üstü yürüyüş kültürü güçlü: sabah parkta yürüyenler, hafta sonu doğa yürüyüşleri, mahalle çevre turları. Klasik mobil oyunlar bu yaş grubuna pek hitap etmiyor; AR yorucu, refleks gerektiriyor, arayüz gençler için tasarlanıyor.</p>
    <p>MapRaiders farklı çalışıyor: <strong>yürümek yeterli</strong>. Bölge sahipliği günler ve haftalar içinde gelişir. Klan kurmak organik. Aileyle birlikte yürümek bölgeyi büyütür. Longevity gaming budur: yıllar boyunca oynanabilir, takıntıya yol açmaz, sağlığı destekler.</p>
            """,
        },
        {
            "label": "Çok sporlu",
            "title": "Yürüyüş, koşu, bisiklet: <em>hepsi tek haritada</em>",
            "body": """
    <p>MapRaiders spor türüne göre ayrım yapmaz. Koşan, köpeğiyle yürüyen veya işe bisikletle giden fark etmez; GPS izi bölge oluşturur, uygulama agnostiktir:</p>
    <ul>
      <li><strong>Koşu.</strong> Daha hızlı rotalar, tur başına daha büyük bölgeler.</li>
      <li><strong>Yürüyüş ve köpek turu.</strong> Günlük tekrar bölgeyi korur. Düşük kardiyo, yüksek bölge istikrarı.</li>
      <li><strong>Bisiklet.</strong> Günde daha geniş bölgeler. 25 km/saat altı geçerli, araba ile hile yapmak mümkün değil.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Pilim ne kadar dayanır?",
         "a": "İki saatlik bir yürüyüşte tipik olarak yüzde 30 ile 40 arası pil tüketimi olur. Aynı sürede Pokémon GO + AR yaklaşık yüzde 80 harcar. Değerler cihaza ve ekran parlaklığına göre değişir."},
        {"q": "Strava veya Nike Run Club ile çalışır mı?",
         "a": "Şu anda doğrudan bir entegrasyon yok. Strava export 2026 dördüncü çeyrekte yol haritasında. İki uygulamayı paralel çalıştırabilirsin, aynı GPS sensörünü çakışma olmadan kullanırlar."},
        {"q": "Yürüyüş de sayılır mı?",
         "a": "Evet. Minimum hız yok. Yürüyüş, koşu, doğa yürüyüşü, bisiklet hepsi geçerli. Fiziksel olarak hareket ettiğin sürece bölge oluşur. 25 km/saat üstü hız reddedilir, böylece arabayla hile yapılamaz."},
        {"q": "Hasta olup yürüyemediğimde ne olur?",
         "a": "Çürüme devam eder ama yavaş. 5 ile 7 gün ara verirsen bölge gözle görülür biçimde küçülür, 14 gün sonra tamamen kaybedilebilir. Sen yokken klan devirleri toprağı korumaya yardım eder."},
        {"q": "Mobil veri tüketir mi?",
         "a": "Çok az. Canlı video yok, yoğun API çağrısı yok. Bir saatlik bir rota tipik olarak 5 ile 15 MB arası veri tüketir."},
    ],
    "internal_links": [
        ("/tr/bolge-oyunu.html", "Bölge oyunu nedir"),
        ("/tr/konum-tabanli-oyun.html", "Konum tabanlı oyun"),
        ("/tr/mahalle-oyunu.html", "Mahalle oyunu"),
        ("/tr/yuruyus-oyunu-yorumlar.html", "Yürüyüş oyunu yorumları"),
        ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
    ],
}

# K6 - hazine-avi-uygulamasi
K6 = {
    "slug": "/tr/hazine-avi-uygulamasi.html",
    "breadcrumb": "Hazine Avı Uygulaması",
    "title": "Hazine avı uygulaması: bütün şehir canlı bir oyun (KVKK uyumlu)",
    "og_title": "Hazine avı uygulaması: şehir canlı oyun",
    "meta": "Hazine avı uygulaması 2026: MapRaiders bütün şehri açık bir hazine avına dönüştürür. Aile dostu, çocuklar için uygun, KVKK uyumlu.",
    "keywords": "hazine avı uygulaması, hazine avi app, şehir kaşifliği, çocuk hazine avı, aile hazine avı",
    "badge": "Hazine Avı (Aile)",
    "pricing_pill": "Sonsuza kadar ücretsiz. Tur satın alma yok.",
    "h1_html": 'Hazine avı uygulaması: bütün <em>şehir izlerle dolu</em>',
    "lead": "Klasik hazine avı uygulamaları hazırlık ister: tur satın al, istasyon ayarla, materyal yazdır. MapRaiders bunu tersine çevirir. Ekolar zaten tüm şehre dağılmıştır. Diğer oyuncuların izlerini takip edersin veya kendin yenilerini bırakırsın. Canlı, ücretsiz, hazırlıksız.",
    "trigger": {
        "quote": "Bir kapı önüne kısa bir ses kaydı bırakıyorsun, üç gün sonra hiç tanımadığın biri onu bulmuş oluyor.",
        "author": "Aljoscha P., Berlin bölgesinden şehir kâşifi (kapalı beta)"
    },
    "testers": [TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Modern hazine avı",
            "title": "Modern bir <em>hazine avı uygulamasında</em> aranan kriterler",
            "body": """
    <p>2020'lerin hazine avı uygulamalarını basılı çözümlerden ayıran birkaç temel kriter var:</p>
    <ul>
      <li><strong>Canlı.</strong> İzler gerçek zamanlı oluşur, sadece önceden hazırlanmış turlarda değil.</li>
      <li><strong>Sosyal.</strong> Oyuncular birbirleri için iz bırakır, hazırlanmış olanı tüketmekle sınırlı kalmaz.</li>
      <li><strong>Premium engeli yok.</strong> Aileler ve çocuklar 4,99 €'luk bir turu satın almadan hemen başlayabilir.</li>
    </ul>
            """,
        },
        {
            "label": "Karşılaştırma",
            "title": "Hazine avı uygulamaları <em>karşılaştırması</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Uygulama</th><th>Fiyat</th><th>Hazırlık</th><th>Canlı unsur</th><th>Oyun döngüsü</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">MapRaiders</td><td class="check">0 TL</td><td class="check">Sıfır</td><td class="check">Canlı</td><td>Eko, görev ve bölge</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Premium abonelik</td><td>Düşük (cache bulma)</td><td class="cross">Asenkron</td><td>Toplama</td></tr>
      <tr><td class="feat-name">Actionbound</td><td>Bound satın alma</td><td>Yüksek (tur kur)</td><td class="cross">✗</td><td>Tur başına</td></tr>
      <tr><td class="feat-name">Anyfox</td><td>Premium abonelik</td><td>Orta</td><td class="cross">✗</td><td>Tur başına</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Eko özellik",
            "title": "MapRaiders <em>hazine avını yeniden düşünür</em>",
            "body": """
    <p>İlk istasyondan onuncuya kadar doğrusal bir tur yerine MapRaiders'da <strong>açık mekânsal bir hazine avı</strong> oluşur. Şehir kendisi oyun alanıdır:</p>
    <ul>
      <li><strong>Eko bırak.</strong> Bir konuma ses, fotoğraf veya video ekosu bırak. Diğer oyuncular oradan geçince keşfeder.</li>
      <li><strong>Eko bul.</strong> Ekoların nerede olduğunu haritada gör. İzleri takip et, sırları bul, hikayeler dinle.</li>
      <li><strong>Görev oluştur.</strong> Bir konumda küçük bir görev hazırla ("Oradaki kırmızı kapının fotoğrafını çek"). Diğer oyuncular yapar.</li>
      <li><strong>Bölge katmanı.</strong> Bir hazine avı rotasını sık sık yürüyen onu bölge olarak fetheder. İzler zamanla araziye dönüşür.</li>
    </ul>
            """,
        },
        {
            "label": "Aile ve KVKK",
            "title": "<em>Aile için</em> hazine avı uygulaması (KVKK uyumlu)",
            "body": """
    <p>Türkiye'de hazine avı kültürü güçlüdür: okul gezileri, doğum günü partileri, mahalle çocuk oyunları. MapRaiders bunu akıllı telefon çağına taşır, üstelik çocukları ekran başında yalnız bırakmadan:</p>
    <ul>
      <li><strong>Ebeveyn-çocuk etkinliği.</strong> Ebeveynler planlanmış bir rotada ses ekoları bırakır, çocuklar izleri takip eder. Analog hareket, dijital ipuçları.</li>
      <li><strong>Bedensel deneyim öne çıkar.</strong> Uygulama harita üzerinde yönlendirir, asıl deneyim gerçek dünyada yaşanır.</li>
      <li><strong>Çocuklar için KVKK uyumlu.</strong> Kişiselleştirilmiş reklam izleyicisi yok, veri satışı yok, ebeveyn onayı olmadan uygulama içi sohbet yok.</li>
      <li><strong>Mahalle çerçevesi.</strong> Komşular birbirleri için iz bırakır, mahalle dijital olarak da yakınlaşır.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders çocuklar için uygun mu?",
         "a": "Evet, ebeveyn eşliğinde 9 yaşından itibaren. Uygulama KVKK uyumludur, reklamsızdır ve çocuklardan kişisel veri toplamaz. Ebeveynler aile modunu etkinleştirebilir."},
        {"q": "Çocuklarla hazine avı için ne kadar hazırlık gerekir?",
         "a": "Sıfır. Actionbound veya Anyfox'un aksine tur satın almak veya istasyon hazırlamak zorunda değilsin. Ekolar zaten şehre dağılmıştır; diğer oyuncuların izlerini takip eder veya kendin yenilerini bırakırsın."},
        {"q": "Hazine avı uygulaması ücretli mi?",
         "a": "Hayır. Hazine avı işlevleri (eko bırakma, eko bulma, görev oluşturma) tamamen ücretsizdir. İsteğe bağlı olarak işaretçi tasarımları için 49 TL'den başlayan kozmetik ürünler vardır, bunlar oyun avantajı vermez."},
        {"q": "Hazine avı küçük şehirlerde de çalışır mı?",
         "a": "Evet. Küçük şehirlerde veya köylerde de eko bırakabilir ve görev oluşturabilirsin. Yoğun bölgelerde diğer oyunculardan daha fazla iz bulursun, kırsalda ise kendi turuna daha fazla yer kalır."},
        {"q": "Uygulama Türkçe mi?",
         "a": "Evet. MapRaiders tamamen Türkçe yerelleştirilmiştir: menüler, eko sistemi, ipuçları, destek."},
    ],
    "internal_links": [
        ("/tr/bolge-oyunu.html", "Bölge oyunu nedir"),
        ("/tr/konum-tabanli-oyun.html", "Konum tabanlı oyun"),
        ("/tr/mahalle-oyunu.html", "Mahalle oyunu"),
        ("/tr/hazine-avi-uygulamasi-yorumlar.html", "Hazine avı uygulaması yorumları"),
        ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
    ],
}

# K7 - mahalle-oyunu
K7 = {
    "slug": "/tr/mahalle-oyunu.html",
    "breadcrumb": "Mahalle Oyunu",
    "title": "Mahalle oyunu: komşularla doğal yoldan tanış",
    "og_title": "Mahalle oyunu: komşularla doğal tanışma",
    "meta": "Mahalle oyunu: MapRaiders ile kendi mahallenin haritasını oluştur, komşularını doğal yoldan tanı. İçerik akışı yok, reklam yok.",
    "keywords": "mahalle oyunu, komşu oyunu, mahalle uygulaması, sokak oyunu, semt oyunu",
    "badge": "Mahalle Oyunu",
    "pricing_pill": "Sonsuza kadar ücretsiz. WhatsApp ile paylaşım.",
    "h1_html": 'Mahalle oyunu: <em>komşunun haritası</em>',
    "lead": "Mahalle Türk kültürünün kalbidir: komşu, çay, akşam yürüyüşü. Modern uygulamalar bu dengeyi bozuyor; algoritma seni dünyanın öbür ucundaki bir TikTok'çuya bağlarken, yan kapındaki komşunla karşılaşma sıklığını azaltıyor. MapRaiders tersine çalışır: harita sosyal ağ olur, fiziksel yakınlık algoritmanın yerine geçer.",
    "trigger": {
        "quote": "Bir kapı önüne kısa bir ses kaydı bırakıyorsun, üç gün sonra hiç tanımadığın biri onu bulmuş oluyor. Bir oyun için tuhaf biçimde samimi geliyor.",
        "author": "Aljoscha P., Berlin bölgesinden şehir kâşifi (kapalı beta)"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Mahalle çerçevesi",
            "title": "Türk <em>mahalle kültürü</em> ve dijital uçurum",
            "body": """
    <p>Türk mahalle kültürünün birkaç güçlü direği var: yan kapıdaki kişiyi ailenin parçası gibi görmek, akşam yürüyüşü, köşedeki bakkalla isim üzerinden konuşmak. Bunlar dijital ortama otomatik olarak taşınmıyor.</p>
    <p>Aksine, modern uygulamalar bu kültürün tam tersini kuruyor. Instagram seni dünyanın diğer ucuna yönlendiriyor, yan kapıdakine değil. TikTok algoritması coğrafyaya kayıtsız. WhatsApp grup sohbetleri çoğalırken, fiziksel olarak komşuyla karşılaşmalar azalıyor.</p>
            """,
        },
        {
            "label": "Algoritma değil harita",
            "title": "MapRaiders <em>algoritma yerine harita</em>",
            "body": """
    <p>MapRaiders'da içerik akışı yok. Sosyal besleme, takipçi sayısı veya viral video baskısı bulamazsın. Tek "akış" haritadır ve onu yürüdüğün adımlar şekillendirir.</p>
            """,
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Komşu = müttefik</h3><p>Klanın aynı sokakta yürüyen insanlardan oluşur. Discord değil, fiziksel komşuluk. Klan kurmak doğal yoldan olur.</p></div>
    <div class="feat-card rv d1"><h3>Mekânsal nezaket</h3><p>Komşunun bölgesine saldırırsan onunla mini oyun oynarsın. Saldırı bile bir karşılaşmaya dönüşür.</p></div>
    <div class="feat-card rv d2"><h3>Eko bir hediye gibidir</h3><p>Bir komşuya eko bırakırsın: "Bu kapı 50 yıl önce ailemizdeydi". Hikaye doğrudan yere bağlanır.</p></div>
    <div class="feat-card rv d3"><h3>Yerel ekonomiye bağlantı</h3><p>Köşedeki bakkal görev oluşturabilir: "Buradan geçen üç oyuncuya çay ikram et". Mahalle ekonomisi dijital olarak da ödüllendirilir.</p></div>
  </div>""",
        },
        {
            "label": "WhatsApp paylaşımı",
            "title": "WhatsApp ile <em>klan davetleri</em>",
            "body": """
    <p>Türkiye dünyada WhatsApp kullanım oranı en yüksek pazarlardan biridir. Aile grupları, mahalle grupları, okul grupları çoğunlukla WhatsApp üzerinden işliyor.</p>
    <p>MapRaiders WhatsApp ile doğal şekilde uyumludur:</p>
    <ul>
      <li><strong>Klan davet bağlantıları</strong> doğrudan WhatsApp üzerinden paylaşılır, tek tıkla katılım sağlanır.</li>
      <li><strong>Bölge fethi paylaşımı</strong> ekran görüntüsü olarak komşu grubuna gönderilir: "Bakın, sokağı fethettim!".</li>
      <li><strong>Hazine avı çağrıları</strong> aile grubuna gönderilir: "Bu Cumartesi öğleden sonra, çocukları da getir".</li>
    </ul>
            """,
        },
        {
            "label": "Aile ve komşu",
            "title": "Mahalle oyunu <em>her yaşa</em>",
            "body": """
    <p>MapRaiders'ı mahalle çerçevesinde kullanan birkaç farklı yaş grubu var:</p>
    <ul>
      <li><strong>Çocuklar (9+).</strong> Aile modunda, ebeveynleriyle birlikte hazine avı yapar.</li>
      <li><strong>Gençler.</strong> Klan kurar, savunma mini oyunlarında strateji geliştirir.</li>
      <li><strong>Ebeveynler.</strong> Çocuklarıyla sokakta vakit geçirmek için somut bir bahaneye kavuşur.</li>
      <li><strong>Büyükanne ve büyükbaba.</strong> Akşam yürüyüşü için motivasyon, sağlık için bir teşvik, mahallesinin haritasını tutma duygusu.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders'da gerçekten komşularımı tanıyabilir miyim?",
         "a": "Evet. Klanlar fiziksel olarak yakın oyunculardan oluşur. Aynı sokakta yürüyen başka bir oyuncu varsa muhtemelen sonunda klan yoldaşın olur. Doğal komşu tanışması, uygulamadan değil, paylaşılan rotadan doğar."},
        {"q": "Mahremiyet ne durumda? Komşum nereye gittiğimi görür mü?",
         "a": "Hayır. Sadece kendi bölge sınırların görünür, kesin GPS izlerin değil. Klan üyeleri bile gerçek zamanlı konumunu göremez. Detaylar gizlilik sayfasında."},
        {"q": "İçerik akışı gerçekten yok mu?",
         "a": "Doğru. Sosyal besleme yok, takipçi sayısı yok, viral video baskısı yok. Tek &bdquo;akış&rdquo; haritadır ve coğrafi olarak senin etrafındadır. Bu bilinçli bir tasarım kararıdır."},
        {"q": "WhatsApp ile entegre mi?",
         "a": "Evet. Klan davet bağlantıları, bölge fethi paylaşımları ve hazine avı çağrıları doğrudan WhatsApp üzerinden paylaşılır. Türk kullanım alışkanlıklarına göre tasarlandı."},
        {"q": "Yerel ekonomiye nasıl bağlı?",
         "a": "Mahalle işletmeleri (bakkal, kuaför, kafe) MapRaiders'da görev oluşturabilir. Örneğin &bdquo;Buradan geçen üç oyuncuya çay ikram et&rdquo;. Bu, dijital trafiği fiziksel mahalleye geri taşır."},
    ],
    "internal_links": [
        ("/tr/bolge-oyunu.html", "Bölge oyunu nedir"),
        ("/tr/konum-tabanli-oyun.html", "Konum tabanlı oyun"),
        ("/tr/yuruyus-oyunu.html", "Yürüyüş oyunu"),
        ("/tr/mahalle-oyunu-yorumlar.html", "Mahalle oyunu yorumları"),
        ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA - TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    # T1 - bolge-oyunu-yorumlar
    {
        "slug": "/tr/bolge-oyunu-yorumlar.html",
        "breadcrumb": "Bölge Oyunu Yorumları",
        "title": "Bölge oyunu yorumları: beta test kullanıcıları anlatıyor",
        "og_title": "Bölge oyunu yorumları: MapRaiders beta",
        "meta": "Bölge oyunu yorumları: üç beta test kullanıcısı MapRaiders'ı kendi sokaklarında haftalarca test etti. Köpek sahibi, koşucu, şehir kâşifi tarafından yazılmış gerçek deneyimler.",
        "keywords": "bölge oyunu yorumları, bolge oyunu yorum, mapraiders yorum, gps oyun test",
        "h1_html": 'Bölge oyunu: <em>gerçek yorumlar</em> betadan',
        "lead": "Üç beta test kullanıcısı, üç farklı şehir bölgesi. Stuttgart, Hamburg ve Berlin'den dürüst raporlar. Marka cümleleri veya influencer kodu yok.",
        "intro_label": "Burada kim test ediyor?",
        "intro_title": "Üç kişi, üç <em>kullanım durumu</em>",
        "intro_body": """
    <p>Üç beta test kullanıcısı birbirinden farklı kullanıcı tiplerini temsil ediyor; bu da karşılaştırmayı dürüst kılıyor:</p>
    <ul>
      <li><strong>Ron C.</strong> Stuttgart bölgesinden: köpek sahibi, günlük yürüyüş, oyun geçmişi yok.</li>
      <li><strong>Vivian N.</strong> Hamburg bölgesinden: koşucu, 2018'de Pokémon GO'yu denedi ve üç ay sonra bıraktı.</li>
      <li><strong>Aljoscha P.</strong> Berlin bölgesinden: şehir kâşifi, Ingress veteranı, Niantic ekosistemini birinci elden bilir.</li>
    </ul>
    <p>Üçü de MapRaiders'ı bağımsız olarak test etti. Ücretli tanıtım yok, senaryo yok. Yorumlar Almanca orijinallerinden çevrildi; Schema.org bunu şeffaflık için <code>translationOfWork</code> ile işaretler.</p>
        """,
        "internal_links": [
            ("/tr/bolge-oyunu.html", "Bölge oyunu nedir"),
            ("/tr/konum-tabanli-oyun.html", "Konum tabanlı oyun"),
            ("/tr/konum-tabanli-oyun-yorumlar.html", "Konum tabanlı oyun yorumları"),
            ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
        ],
    },
    # T2 - konum-tabanli-oyun-yorumlar
    {
        "slug": "/tr/konum-tabanli-oyun-yorumlar.html",
        "breadcrumb": "Konum Tabanlı Oyun Yorumları",
        "title": "Konum tabanlı oyun yorumları: MapRaiders test edildi",
        "og_title": "Konum tabanlı oyun yorumları: beta test",
        "meta": "Konum tabanlı oyun yorumları: üç beta test kullanıcısı MapRaiders'ı dört ile altı hafta arasında günlük rutininde kullandı. GPS doğruluğu, pil ve oyun mekanikleri test edildi.",
        "keywords": "konum tabanlı oyun yorumları, gps oyun test, konum oyun yorumu, location based game türkçe yorum",
        "h1_html": 'Konum tabanlı oyun: <em>beta testten yorumlar</em>',
        "lead": "Bir Pokémon GO veteranı, bir koşucu ve bir köpek sahibi aynı GPS MMO alternatifini test ederse ne olur? MapRaiders betasından üç çok farklı rapor.",
        "intro_label": "Test ortamı",
        "intro_title": "Nasıl <em>test ettik</em>",
        "intro_body": """
    <p>Üç test kullanıcısı MapRaiders'ı normal rutininde dört ile altı hafta arasında kullandı. Yapay test seansları yok, sponsorlu içerik yok:</p>
    <ul>
      <li><strong>Günlük kullanım</strong> kendi şehirlerinde (Stuttgart, Hamburg, Berlin).</li>
      <li><strong>Pokémon GO ile doğrudan karşılaştırma</strong> Aljoscha P. tarafında (iki hafta paralel oynama).</li>
      <li><strong>Pil ölçümü</strong> uygulama ayarları üzerinden: saat başına ortalama tüketim.</li>
      <li><strong>Dürüst geri bildirim kuralı.</strong> Buglar, hayal kırıklıkları ve istekler de raporda yer alır, sadece öne çıkanlar değil.</li>
    </ul>
        """,
        "internal_links": [
            ("/tr/konum-tabanli-oyun.html", "Konum tabanlı oyun"),
            ("/tr/bolge-oyunu.html", "Bölge oyunu nedir"),
            ("/tr/bolge-oyunu-yorumlar.html", "Bölge oyunu yorumları"),
            ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
        ],
    },
    # T3 - pokemon-go-alternatif-yorumlar
    {
        "slug": "/tr/pokemon-go-alternatif-yorumlar.html",
        "breadcrumb": "Pokémon GO Alternatif Yorumları",
        "title": "Pokémon GO alternatifi yorumları: betadan dürüst raporlar",
        "og_title": "Pokémon GO alternatifi yorumları: gerçek beta",
        "meta": "Pokémon GO alternatifi yorumları MapRaiders betasından: üç farklı kullanıcı tipi (köpek sahibi, koşucu, şehir kâşifi) MapRaiders deneyimi hakkında ne diyor?",
        "keywords": "pokemon go alternatif yorumları, pokemon go yerine yorumlar, mapraiders yorumu, beta test rapor",
        "h1_html": 'Pokémon GO alternatifi: <em>betadan dürüst raporlar</em>',
        "lead": "Pokémon GO'dan ayrılan biri MapRaiders ile gerçek bölge sahipliğini nasıl deneyimliyor? Üç beta test kullanıcısı kendi rotalarında (Stuttgart, Hamburg, Berlin) açıkça konuşuyor.",
        "intro_label": "Test sorusu",
        "intro_title": "Bir Pokémon GO oyuncusu MapRaiders'ı <em>nasıl yaşar</em>?",
        "intro_body": """
    <p>Testimiz üç eksen üzerinde yürüdü:</p>
    <ul>
      <li><strong>İlk eroberung deneyimi.</strong> İlk kendi sokağın ne zaman &bdquo;benim arazim&rdquo; gibi hissettiriyor?</li>
      <li><strong>Kayıp deneyimi.</strong> İlk bölge çürümesi veya bir saldırgana yenilgi nasıl bir tepki yaratıyor?</li>
      <li><strong>Savunma deneyimi.</strong> Savunma mini oyunları taktiksel mi, adil mi, yoksa sinir bozucu mu?</li>
    </ul>
        """,
        "internal_links": [
            ("/tr/pokemon-go-alternatif-ucretsiz.html", "Pokémon GO alternatif ücretsiz"),
            ("/tr/konum-tabanli-oyun.html", "Konum tabanlı oyun"),
            ("/tr/fake-gps-olmadan-oyun.html", "Fake GPS olmadan oyun"),
            ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
        ],
    },
    # T4 - fake-gps-olmadan-yorumlar
    {
        "slug": "/tr/fake-gps-olmadan-yorumlar.html",
        "breadcrumb": "Fake GPS Olmadan Yorumlar",
        "title": "Fake GPS olmadan yorumlar: adil GPS oyun deneyimi",
        "og_title": "Fake GPS olmadan yorumlar: anti-cheat beta",
        "meta": "Fake GPS olmadan yorumlar: MapRaiders'ın anti-cheat tasarımı betada nasıl çalışıyor? PGSharp ve MocPOGO kültürüne alışmış oyuncular için adil oyun nasıl hissettiriyor?",
        "keywords": "fake gps olmadan yorumlar, anti cheat gps oyun yorum, adil gps mmo, hilesiz gps oyun",
        "h1_html": 'Fake GPS olmadan: <em>adil oyun yorumları</em>',
        "lead": "Türkiye'de fake-GPS gerçek bir karaborsa haline geldi. MapRaiders bunu yapısal düzeyde farklı çözer. Üç beta test kullanıcısı bu değişimin nasıl hissettirdiğini paylaşıyor.",
        "intro_label": "TR'ye özel test sorusu",
        "intro_title": "Fake-GPS kültüründe <em>adil oyun</em> nasıl hissettiriyor?",
        "intro_body": """
    <p>Türkiye için özel olarak üç soruyu test ettik:</p>
    <ul>
      <li><strong>Hile motivasyonu kalıyor mu?</strong> 25 km/saat üst limiti gerçekten hileyi anlamsız kılıyor mu?</li>
      <li><strong>Sahte konum gerçekten engellenir mi?</strong> Test sırasında PGSharp ve MocPOGO denendi.</li>
      <li><strong>Adil oyun deneyimi nasıl?</strong> Pokémon GO'dan farkı oyuncular tarafından fark ediliyor mu?</li>
    </ul>
        """,
        "internal_links": [
            ("/tr/fake-gps-olmadan-oyun.html", "Fake GPS olmadan oyun"),
            ("/tr/pokemon-go-alternatif-ucretsiz.html", "Pokémon GO alternatif"),
            ("/tr/bolge-oyunu.html", "Bölge oyunu"),
            ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
        ],
    },
    # T5 - yuruyus-oyunu-yorumlar
    {
        "slug": "/tr/yuruyus-oyunu-yorumlar.html",
        "breadcrumb": "Yürüyüş Oyunu Yorumları",
        "title": "Yürüyüş oyunu yorumları: kardiyo testinde MapRaiders",
        "og_title": "Yürüyüş oyunu yorumları: kardiyo ve bölge",
        "meta": "Yürüyüş oyunu yorumları: beta test kullanıcıları kardiyo motivasyonu, uzun mesafede pil ve hastalık aralarından sonra bölge kaybı hakkında konuşuyor.",
        "keywords": "yürüyüş oyunu yorumları, koşu oyun yorumu, kardiyo app yorumu, fitness mmo yorumlar",
        "h1_html": 'Yürüyüş oyunu: <em>kardiyo testinden yorumlar</em>',
        "lead": "Her tur gerçek arazi savunduğunda yürüyüş motivasyonuna ne olur? Soğuk algınlığı arasından sonra ilk çürüme nasıl hissettiriyor? Üç beta test kullanıcısı (bir koşucu, bir yürüyüşçü ve bir şehir kâşifi) yanıtlıyor.",
        "intro_label": "Test eksenleri",
        "intro_title": "Bir <em>yürüyüş oyunu</em> ne sunmalı",
        "intro_body": """
    <p>Yürüyüş deneyimini üç eksende test ettik:</p>
    <ul>
      <li><strong>Motivasyon çapası.</strong> Birisi aradan sonra hangi anda yeniden başlıyor?</li>
      <li><strong>Uzun mesafede pil.</strong> 60-90 dakikalık rotalar pil ölmeden tamamlanabiliyor mu?</li>
      <li><strong>Çoklu spor.</strong> Koşu, yürüyüş ve köpek turu için aynı şekilde çalışıyor mu?</li>
    </ul>
        """,
        "internal_links": [
            ("/tr/yuruyus-oyunu.html", "Yürüyüş oyunu"),
            ("/tr/bolge-oyunu.html", "Bölge oyunu"),
            ("/tr/mahalle-oyunu.html", "Mahalle oyunu"),
            ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
        ],
    },
    # T6 - hazine-avi-uygulamasi-yorumlar
    {
        "slug": "/tr/hazine-avi-uygulamasi-yorumlar.html",
        "breadcrumb": "Hazine Avı Uygulaması Yorumları",
        "title": "Hazine avı uygulaması yorumları: tur satın alma olmadan",
        "og_title": "Hazine avı uygulaması yorumları: canlı şehir",
        "meta": "Hazine avı uygulaması yorumları, tur satın alma veya hazırlık olmadan: beta test kullanıcıları MapRaiders'ın tüm şehri canlı hazine avına nasıl çevirdiğini paylaşıyor.",
        "keywords": "hazine avı uygulaması yorumları, hazine avı app yorumu, şehir keşif yorum, aile hazine avı yorumlar",
        "h1_html": 'Hazine avı uygulaması: <em>tur satın alma olmadan yorumlar</em>',
        "lead": "Çoğu hazine avı uygulaması hazırlık ister: tur satın al, rota planla, istasyon ayarla. Tüm şehir zaten izlerle dolu olduğunda bu nasıl hissettiriyor? Üç beta test kullanıcısı paylaşıyor.",
        "intro_label": "Test sorusu",
        "intro_title": "<em>Canlı hazine avı</em> hazırlık olmadan çalışır mı?",
        "intro_body": """
    <p>Hazine avı işlevlerini üç farklı ortamda test ettik:</p>
    <ul>
      <li><strong>Yalnız</strong> şehir kâşifi olarak (Aljoscha P.): eko bırak, eko bul.</li>
      <li><strong>Köpekle</strong> normal rutinde (Ron C.): izler yan ürün olarak çıkıyor.</li>
      <li><strong>Aile ortamı</strong> simüle edildi: yetişkinler ve çocuklar mekaniği ne kadar hızlı kavrıyor?</li>
    </ul>
        """,
        "internal_links": [
            ("/tr/hazine-avi-uygulamasi.html", "Hazine avı uygulaması"),
            ("/tr/mahalle-oyunu.html", "Mahalle oyunu"),
            ("/tr/bolge-oyunu.html", "Bölge oyunu"),
            ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
        ],
    },
    # T7 - mahalle-oyunu-yorumlar
    {
        "slug": "/tr/mahalle-oyunu-yorumlar.html",
        "breadcrumb": "Mahalle Oyunu Yorumları",
        "title": "Mahalle oyunu yorumları: komşu deneyimleri",
        "og_title": "Mahalle oyunu yorumları: komşuluk ve harita",
        "meta": "Mahalle oyunu yorumları: beta test kullanıcıları MapRaiders'ın mahalle algısını nasıl değiştirdiğini, komşularla karşılaşmaları ve WhatsApp paylaşımlarını anlatıyor.",
        "keywords": "mahalle oyunu yorumları, komşu oyun yorum, mahalle uygulama yorumlar, semt oyun test",
        "h1_html": 'Mahalle oyunu: <em>komşu deneyimleri</em>',
        "lead": "MapRaiders gerçekten komşu tanışmasına yol açıyor mu? İçerik akışı olmaması ne kadar uygulanabilir? WhatsApp paylaşımları doğal mı duruyor? Üç beta test kullanıcısı yorumluyor.",
        "intro_label": "Mahalle çerçevesi testi",
        "intro_title": "<em>Mahalle algısı</em> gerçekten değişiyor mu?",
        "intro_body": """
    <p>Mahalle çerçevesini üç soru ile test ettik:</p>
    <ul>
      <li><strong>Doğal komşu tanışması.</strong> Klan oluşumu fiziksel komşulardan gerçekleşiyor mu?</li>
      <li><strong>İçerik akışının yokluğu.</strong> Sosyal beslemenin olmaması rahatlatıcı bir his mi yaratıyor?</li>
      <li><strong>WhatsApp entegrasyonu.</strong> Klan davetleri ve bölge paylaşımları doğal mı duruyor?</li>
    </ul>
        """,
        "internal_links": [
            ("/tr/mahalle-oyunu.html", "Mahalle oyunu"),
            ("/tr/yuruyus-oyunu.html", "Yürüyüş oyunu"),
            ("/tr/bolge-oyunu.html", "Bölge oyunu"),
            ("/tr/mapraiders-yorumlar.html", "Tüm puanları gör"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/tr/mapraiders-yorumlar.html",
    "breadcrumb": "MapRaiders Yorumlar",
    "title": "MapRaiders yorumları: puanlar, beta testler, kurucu açıklaması",
    "og_title": "MapRaiders yorumları: bir bakışta",
    "meta": "MapRaiders yorumları: üç doğrulanmış beta testten 5,0/5 yıldız, kurucu açıklaması, tüm killer sayfalar ve yorum sayfaları merkezi olarak bağlanmış.",
    "keywords": "mapraiders yorumları, mapraiders puan, mapraiders test, gps mmo yorumlar",
    "badge": "Merkez ve Genel Bakış",
    "pricing_pill": "5,0 / 5 yıldız: 3 doğrulanmış beta yorumu",
    "h1_html": '<em>MapRaiders yorumları</em>: GPS MMO hakkında her şey tek sayfada',
    "lead": "Stuttgart, Hamburg ve Berlin'den üç beta test kullanıcısı. Pokémon GO karşılaştırmasından hazine avı uygulamasına kadar yedi killer konu, yedi detay raporu, tek bir merkezde toplandı.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "MapRaiders nedir?",
         "a": "MapRaiders, Android için GPS tabanlı bir MMO oyunudur. Oyuncular hareket ederek gerçek bölgeleri fetheder, ekolar bırakır, görevler oluşturur ve mini oyunlarla arazilerini savunur. Reklamsız, KVKK uyumlu ve ücretsizdir."},
        {"q": "Beta test kullanıcısı kaç kişi?",
         "a": "Şu anda kamuoyuyla paylaşılan üç kişi var. Bu üçü, onların izniyle ve gizlilik amacıyla ad ve soyad baş harfiyle yer alıyor. Kapalı beta toplam olarak daha büyük; üç tanıtılan kişi ana kullanıcı tiplerini temsil ediyor."},
        {"q": "Yorumlar gerçek mi?",
         "a": "Evet. Üç test kullanıcısı kapalı betadan gerçek kişilerdir. Ücret almadılar, alıntılar Almanca olarak orijinal yazıldı. Schema.org Türkçe versiyonları translationOfWork etiketi ile Almanca orijinallerine bağlar; bu tam şeffaflık sağlar."},
        {"q": "Beta test kullanıcısı nasıl olabilirim?",
         "a": "Ana sayfada e-posta listesine kaydol. Beta yerleri dalgalar halinde dağıtılıyor. Düşük oyuncu yoğunluğundaki Türkiye şehirlerinden aktif yürüyüşçüler, koşucular ve köpek sahipleri öncelikli."},
        {"q": "Uygulama resmi olarak ne zaman çıkıyor?",
         "a": "MapRaiders şu anda Google Play'de kapalı beta olarak yayında. Türkiye için kamuya açık lansman 2026 yazında planlanıyor, iOS lansmanı ise 2026 üçüncü çeyrekte."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print(f"=== Phase 1 Session 2 - TR Killer-URL Builder ===")
    print(f"Output: {TR_DIR}")
    print()

    TR_DIR.mkdir(parents=True, exist_ok=True)

    written = []

    # 1. Killer pages
    for page in ALL_KILLERS:
        out_path = DOCS / page["slug"].lstrip("/")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = render_killer_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(out_path.relative_to(DOCS).as_posix())
        print(f"  [KILLER] {page['slug']}  ({len(html):,} bytes)")

    # 2. Twin pages
    for page in TWINS_DATA:
        out_path = DOCS / page["slug"].lstrip("/")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = render_twin_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(out_path.relative_to(DOCS).as_posix())
        print(f"  [TWIN]   {page['slug']}  ({len(html):,} bytes)")

    # 3. Hub
    all_killer_links = [(p["slug"], p["breadcrumb"]) for p in ALL_KILLERS]
    all_twin_links = [(p["slug"], p["breadcrumb"]) for p in TWINS_DATA]
    out_path = DOCS / HUB["slug"].lstrip("/")
    html = render_hub_page(HUB, all_killer_links, all_twin_links)
    out_path.write_text(html, encoding="utf-8")
    written.append(out_path.relative_to(DOCS).as_posix())
    print(f"  [HUB]    {HUB['slug']}  ({len(html):,} bytes)")

    print()
    print(f"=== {len(written)} files written ===")
    for n in written:
        print(f"  {n}")


if __name__ == "__main__":
    main()

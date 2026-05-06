#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 1 — EN Killer-URL Builder
Generates 15 EN pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_EN_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_en.py
Idempotent: overwrites existing files in docs/en/.

US-Tone: Achievement-language ("conquer", "claim", "dominate").
EN reviews are translations from DE originals — Schema.org marks this
via translationOfWork pointing to #review-ron-c (de).
Single hreflang `en` for US/UK/AU/CA, separate /en-in/ plan.
"""

import json
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
EN_DIR = DOCS / "en"
SITE = "https://mapraiders.com"
LANG = "en"

# Hreflang map — for new EN-killer pages, fallback to locale homepage for non-EN langs.
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
# REUSABLE BLOCKS — Master-Plan §1.4 + §3.2 (English, translated from DE)
# -----------------------------------------------------------------------------

TESTER_RON = {
    "name": "Ron C.",
    "role": "Dog owner · Stuttgart area, Germany",
    "role_long": "Dog owner from the Stuttgart area, Germany (closed beta)",
    "quote": "My dog needs his two walks a day no matter what, so I just bring my block along now. Sounds silly, but I check every evening to see if it's still blue.",
    "date": "2026-03-15",
    "id_en": "review-ron-c-en",
    "id_de": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "Runner · Hamburg area, Germany",
    "role_long": "Runner from the Hamburg area, Germany (closed beta)",
    "quote": "I run every morning anyway, but now I'm also defending something. My Alster loop is mine and I want to keep it that way. Weird how much discipline that suddenly mobilizes.",
    "date": "2026-03-22",
    "id_en": "review-vivian-n-en",
    "id_de": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "Urban explorer · Berlin area, Germany",
    "role_long": "Urban explorer from the Berlin area, Germany (closed beta)",
    "quote": "You leave a short audio clip at a doorway, and three days later somebody you don't know has found it. It feels weirdly intimate for a game.",
    "date": "2026-04-01",
    "id_en": "review-aljoscha-p-en",
    "id_de": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "I played Pokémon GO for three years and eventually quit. The thing I was "
    "missing never showed up: real land instead of fleeting gym captures. "
    "When the Saudi acquisition hit in 2025 it was clear to me that the Niantic "
    "model wasn't heading anywhere I wanted to follow. So I'm building MapRaiders "
    "myself. No ads, no investor pressure, no required sub. My block is my "
    "playing field; yours is up for grabs."
)

# Pricing offers (Master-Plan §1.1 — USD)
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0", "currency": "USD"},
    {"name": "Cosmetic-IAP from", "price": "1.99", "currency": "USD"},
    {"name": "MapRaiders Supporter (Sub)", "price": "4.99", "currency": "USD"},
    {"name": "Lifetime Supporter", "price": "99.00", "currency": "USD"},
]

# DefinedTermSet (Brand-Vocab EN, Master-Plan §8.1)
DEFINED_TERMS = [
    ("Territory", "A captured map area persistently assigned to a player or clan"),
    ("Echo", "A location-attached audio, photo or video signal a player leaves for others to discover"),
    ("Defense Mini-Game", "A mini-game (Tic-Tac-Toe, RPS, Mini-Chess) triggered when a territory is contested"),
    ("Echo Drop", "The action of leaving an Echo at a real-world location"),
    ("Territory Decay", "Mechanic by which abandoned territories degrade over time and become claimable again"),
    ("Quest", "A player-created mini-task others can complete in the real world"),
    ("Clan", "An organic group of players who hold and defend territories together"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """slug e.g. '/en/games-like-pokemon-go.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "en":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="en"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">From the closed beta</div>
        <div class="fr-stars">★★★★★</div>
        <div class="fr-quote">{tester['quote']}</div>
        <div class="fr-author">{tester['name']}</div>
        <div class="fr-role">{tester['role']}</div>
      </div>"""


def testers_section_html(testers):
    cards = "\n".join(tester_card_html(t) for t in testers)
    return f"""<!-- BETA-TESTERS + FOUNDER -->
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
    <div class="fr-label">From the founder</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Founder of MapRaiders" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">Founder, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">From the closed beta</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.6">
      Note: testers are internal beta participants from the closed beta. We use first name plus initial at their request, for privacy. The reviews you see here are translated from the German originals. Schema.org marks them with <code>translationOfWork</code> so the translation chain stays visible.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="Share"><span class="mr-share__label">Share:</span><a class="mr-share__btn" href="https://wa.me/?text={enc}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/en/privacy.html">Privacy</a><a href="/en/terms.html">Terms</a><a href="/en/imprint.html">Imprint</a><a href="/en/contact.html">Contact</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders. Your block, your rules. Scafa Investments LLC.</p>
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
  <a href="/en/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/en/#features" class="lnk">Features</a>
    <a href="/en/mapraiders-reviews.html" class="lnk">Reviews</a>
    <div class="lang-sw">
      <button class="lsw-btn">EN <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('en')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">Coming Soon</a>
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
            "@id": f"#{t['id_en']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "en",
            "translationOfWork": {"@type": "Review", "@id": f"#{t['id_de']}", "inLanguage": "de"},
        }
        for t in testers
    ]


def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/en/"},
        {"@type": "ListItem", "position": 2, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    testers = page.get("testers", ALL_TESTERS)
    review_objs = build_review_objects(testers)
    review_count = len(testers)
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
            "inLanguage": "en",
            "isPartOf": {"@id": f"{SITE}/#website"},
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
            "inLanguage": "en",
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
            "review": [{"@id": f"#{t['id_en']}"} for t in testers],
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
            "jobTitle": "Founder",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-en",
            "name": "MapRaiders Brand Vocabulary English",
            "inLanguage": "en",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/en/"},
        {"@type": "ListItem", "position": 2, "name": "Reviews", "item": f"{SITE}/en/mapraiders-reviews.html"},
        {"@type": "ListItem", "position": 3, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = []
    for t in ALL_TESTERS:
        obj = {
            "@type": "Review",
            "@id": f"#{t['id_en']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "en",
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
            "inLanguage": "en",
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
            "inLanguage": "en",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "3",
                "bestRating": "5",
            },
            "review": [{"@id": f"#{t['id_en']}"} for t in ALL_TESTERS],
        },
        *review_objs,
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_hub(page, all_killers, all_twins):
    base = build_schema_killer(page)
    item_list = {
        "@type": "ItemList",
        "@id": f"{SITE}{page['slug']}#itemlist",
        "name": "MapRaiders EN: all Killer and Reviews pages",
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
  <h2 class="sec-title rv d1">Common <em>questions</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Deeper into the <em>map</em></h2>
  <p class="rv d1">Related MapRaiders topics:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Coming soon on Google Play. Free. No spam.</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">Notify me at launch</a>
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
  <span>&ldquo;{page['trigger']['quote']}&rdquo;</span>
  <cite>– {page['trigger']['author']}</cite>
</div>"""

    pricing_pill = ""
    if page.get("pricing_pill"):
        pricing_pill = f'<div class="pricing-pill rv">{page["pricing_pill"]}</div>'

    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
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
<meta property="og:locale" content="en_US">
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
    Notify me at launch
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
  <div class="sec-label rv">Reviews</div>
  <h2 class="sec-title rv d1">5.0 out of 5 from <em>three closed-beta reviews</em></h2>
  <div class="prose rv d2">
    <p>Ron walks his dog every day in the Stuttgart area, Vivian runs around Hamburg's Alster every morning, Aljoscha covers Berlin on foot. The three of them used MapRaiders for several weeks inside their normal routines and reported back in German. We only use first name plus initial here, at the testers' request.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
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
<meta property="og:locale" content="en_US">
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
  <div class="h-badge rv">Reviews</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">Read more →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Reviews →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">Topic Hub</div>
  <h2 class="sec-title rv d1">All <em>MapRaiders topics</em> in one place</h2>
  <div class="prose rv d2">
    <p>This hub gathers the seven Killer pages and the seven matching reviews pages. Every page looks at MapRaiders from a different angle: once as a Pokémon GO alternative, once as a scavenger-hunt app, once as a running companion, once as the Zenly replacement. Read them one at a time, or work your way through topic by topic.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Reviews in detail</div>
  <h2 class="sec-title rv d1">What beta testers report from <em>different perspectives</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Aggregate rating</div>
  <h2 class="sec-title rv d1">5.0 out of 5 from <em>three closed-beta reviews</em></h2>
  <div class="prose rv d2">
    <p>The reviews come from the closed beta between February and April 2026. Ron tested in Stuttgart, Vivian in Hamburg, Aljoscha in Berlin. All three used the game on their own routes, not in some artificial test setting. The originals are written in German; the English versions you see here are translations, marked in Schema.org via <code>translationOfWork</code> so it stays transparent.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
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
<meta property="og:locale" content="en_US">
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
  <div class="h-badge rv">MapRaiders Hub</div>
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
# PAGE DATA — KILLERS (K1-K7) — verbatim from Master-Plan §4
# -----------------------------------------------------------------------------

# K1 — pokemon-go-alternative-free
K1 = {
    "slug": "/en/pokemon-go-alternative-free.html",
    "breadcrumb": "Pokémon GO Alternative Free",
    "title": "Pokémon GO alternative free in 2026, without ads or battle pass",
    "og_title": "Pokémon GO alternative free: ad-free, no required sub",
    "meta": "Looking for a Pokémon GO alternative that is actually free? MapRaiders has no ads, no battle pass, no required sub, and no Saudi sovereign-fund parent company. Indie, US-based, GDPR-compliant.",
    "keywords": "pokemon go alternative free, pokemon go alternative no ads, free gps game, ad-free location game, niantic refugee",
    "badge": "Free forever",
    "pricing_pill": "$0 gameplay. Cosmetic IAP from $1.99. No required sub.",
    "h1_html": 'Pokémon GO alternative <em>free</em>: no battle pass, no ads, no Saudi data flow',
    "lead": "If you're looking for a Pokémon GO alternative without battle passes or remote-raid-pass paywalls, most options walk you into the next premium trap. MapRaiders flips that around. The entire core game is free and stays free. No tiers, no required subscription, no data sales. We're a small independent team out of the US and Germany, and we built this for the people who quit Pokémon GO and never came back.",
    "trigger": {
        "quote": "No ads, no data selling, no Saudi sovereign-fund parent company. The map is yours.",
        "author": "René Scafarti, Founder"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Why people search",
            "title": "What pushes Pokémon GO players toward <em>a free alternative</em> in 2026",
            "body": """
    <p>Three things made the market ready between 2024 and 2026:</p>
    <ul>
      <li><strong>Battle-Pass fatigue.</strong> Seasonal passes are only useful if you keep paying. Skip a season and your rewards are gone.</li>
      <li><strong>The remote-raid-pass fight.</strong> Niantic raised prices and cut availability in 2023, and a whole wave of players walked away.</li>
      <li><strong>Saudi acquisition, March 2025.</strong> Niantic sold its game division (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) to Scopely for $3.5 billion. Scopely is a subsidiary of the Saudi Public Investment Fund. The location data of around 30 million monthly Pokémon GO players has been running through that company's infrastructure ever since.</li>
    </ul>
    <p>People searching for an alternative aren't looking for the next Pokémon GO. They're looking for <strong>something built against those three problems specifically</strong>.</p>
            """,
        },
        {
            "label": "What free actually means",
            "title": "What &ldquo;free&rdquo; actually means at <em>MapRaiders</em>",
            "body": "<p>We list every tier openly. No hidden paywalls, no tutorial wall after ten minutes:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>What you get</th><th>Price (USD)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% gameplay (territory, Echoes, quests, clans, defense, events)</td><td>$0.00</td></tr>
      <tr><td class="feat-name">Cosmetic-IAP</td><td>Marker designs, territory colors, clan emblems, skins</td><td>$1.99 &ndash; $9.99</td></tr>
      <tr><td class="feat-name">MapRaiders Supporter (Sub)</td><td>Honor badge, beta access, monthly cosmetic pack, founder letter</td><td>$4.99 / month</td></tr>
      <tr><td class="feat-name">Lifetime Supporter</td><td>Collector cosmetic + credits mention</td><td>$99 once</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Important:</strong> cosmetic items give zero gameplay advantage. A free player and a Lifetime Supporter run on the same mechanics.</p>""",
        },
        {
            "label": "Comparison",
            "title": "Where Pokémon GO <em>costs money</em>, and where MapRaiders doesn't",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Cost item</th><th>Pokémon GO</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Battle Pass</td><td>$5.99 to $11.99 per season</td><td class="check">doesn't exist</td></tr>
      <tr><td class="feat-name">Remote Raid Pass</td><td>$1.99 per raid</td><td class="check">doesn't exist</td></tr>
      <tr><td class="feat-name">Egg Incubators</td><td>$0.99 to $4.99</td><td class="check">doesn't exist</td></tr>
      <tr><td class="feat-name">Stardust Boosters</td><td>$0.99 to $9.99</td><td class="check">doesn't exist</td></tr>
      <tr><td class="feat-name">Cosmetic Skins</td><td>$1.99 to $14.99</td><td>$1.99 to $9.99 (optional)</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "The Saudi question",
            "title": "The <em>Saudi-Niantic question</em>: what happens to your data?",
            "body": """
    <p>In March 2025 Niantic sold its entire game division (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) to Scopely for $3.5 billion. Scopely is a subsidiary of the Saudi Public Investment Fund, which is a state-controlled entity of Saudi Arabia.</p>
    <p>In practice that means the <strong>location data of around 30 million monthly Pokémon GO players</strong> now runs through Scopely's infrastructure. Where people jog, when they walk the dog, which routes they cover daily. The full data-transfer chain has not been disclosed publicly. What is clear: GDPR-equivalent protection against actors connected to a foreign sovereign fund is essentially nonexistent.</p>
    <p>MapRaiders is a privately held US LLC, Scafa Investments LLC out of Florida, built by an independent team. We don't sell data, we don't run an ad network, and we are not state-controlled.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders really free forever?",
         "a": "Yes. The entire core game stays free: claim territory, drop Echoes, build quests, form clans, play the defense mini-games. Cosmetic IAP from $1.99 is optional and gives purely visual customization, no gameplay advantage."},
        {"q": "What does cosmetic-only IAP mean?",
         "a": "Cosmetic items like marker designs, territory colors or clan emblems cost between $1.99 and $9.99. They give zero gameplay advantage. Visual only."},
        {"q": "Are there ads in the app?",
         "a": "No. MapRaiders is fully ad-free. We don't sell your data and we don't sell ad space."},
        {"q": "What does &ldquo;no Saudi ownership&rdquo; mean concretely?",
         "a": "In March 2025 Niantic sold its game division (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) to Scopely for $3.5 billion. Scopely is a subsidiary of the Saudi Public Investment Fund. The location data of around 30 million monthly Pokémon GO players has been running through that company's infrastructure ever since. MapRaiders is a privately held US LLC and is not state-controlled."},
        {"q": "When does the iOS version launch?",
         "a": "MapRaiders is Android-only right now, in closed beta on Google Play. iOS launch is targeted for Q3 2026. If you're on iOS, drop your email on the homepage and we'll let you know."},
    ],
    "internal_links": [
        ("/en/games-like-pokemon-go.html", "all Pokémon GO alternatives compared"),
        ("/en/niantic-alternative.html", "the Niantic refugee home"),
        ("/en/territory-game-app.html", "real territory game app"),
        ("/en/pokemon-go-alternative-reviews.html", "reviews from real players"),
        ("/en/mapraiders-reviews.html", "see all beta reviews"),
    ],
}

# K2 — games-like-pokemon-go (VOLUMEN-KING)
K2 = {
    "slug": "/en/games-like-pokemon-go.html",
    "breadcrumb": "Games Like Pokémon GO",
    "title": "7 games like Pokémon GO in 2026, free and without the Saudi data flow",
    "og_title": "7 games like Pokémon GO in 2026, indie pick at the top",
    "meta": "Seven games like Pokémon GO compared: Ingress, Pikmin Bloom, Geocaching, Monster Hunter Now, plus the indie pick built against the Niantic and Saudi problems: MapRaiders. Free, no battle pass.",
    "keywords": "games like pokemon go, games similar to pokemon go, pokemon go alternatives, gps games, location based games, niantic alternative",
    "badge": "Listicle 2026",
    "pricing_pill": "Top pick: indie, free, ad-free, no AR required.",
    "h1_html": '7 games like Pokémon GO in 2026, and why <em>indie MapRaiders</em> tops the list',
    "lead": "Looking for games like Pokémon GO in 2026 means wading through Niantic-owned clones, premium-paywalled relics, and step-counter mini-toys. We ranked the top seven honestly, and yes, an indie game ends up at the top. Not because we wrote the page. We don't know any other game in the category that combines free gameplay with real territory, runs on GPS without forcing AR, and isn't owned by a sovereign fund. So we're trying to fill that gap ourselves. Small independent team out of the US and Germany. We don't sell movement data.",
    "trigger": {
        "quote": "I run every morning anyway, but now I'm also defending something. Weird how much discipline that suddenly mobilizes.",
        "author": "Vivian N., runner from the Hamburg area (closed beta)"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "What's broken",
            "title": "The <em>Pokémon GO problem</em> in 2026",
            "body": """
    <p>Three structural pain points are driving the search for alternatives:</p>
    <ul>
      <li><strong>Pay-to-Win drift.</strong> Remote-raid passes, battle pass, monthly token bundles. If you don't pay, you fall behind.</li>
      <li><strong>AR drains the battery.</strong> Augmented Reality eats phones alive. On a long route the game dies after about 90 minutes.</li>
      <li><strong>Saudi acquisition in March 2025, plus the Niantic-CEO geospatial-AI confession.</strong> Players' walks fed Niantic's training data, and that company now sits inside Scopely under the Saudi Public Investment Fund. Two trust shocks compounded into one search trend.</li>
    </ul>
            """,
        },
        {
            "label": "The list",
            "title": "The seven best Pokémon GO alternatives <em>compared</em>",
            "body": "<p>Most listicles lump apps together that share a single trait with Pokémon GO. We ranked these by the criteria that drove the search-trend in the first place: independence from Niantic and Scopely, real persistent territory, no AR requirement, a free tier that actually holds up, and no state-fund ownership.</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>#</th><th>Game</th><th>Owner</th><th>Free</th><th>Real territory</th><th>AR-free</th><th>State-owned</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>1</strong></td><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC (Indie)</td><td class="check">✓</td><td class="check">✓ persistent</td><td class="check">✓ GPS only</td><td class="check">No</td></tr>
      <tr><td>2</td><td class="feat-name">Ingress</td><td>Niantic / Scopely / Saudi PIF</td><td class="cross">✗</td><td class="cross">Portals, not land</td><td class="cross">AR-heavy</td><td class="cross">Saudi PIF</td></tr>
      <tr><td>3</td><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely / Saudi PIF</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">AR-heavy</td><td class="cross">Saudi PIF</td></tr>
      <tr><td>4</td><td class="feat-name">Monster Hunter Now</td><td>Niantic + Capcom</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">AR-heavy</td><td class="cross">Saudi PIF</td></tr>
      <tr><td>5</td><td class="feat-name">Jurassic World Alive</td><td>Ludia</td><td class="cross">✗</td><td class="cross">✗</td><td>partial</td><td class="check">No</td></tr>
      <tr><td>6</td><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="cross">Premium-paywalled</td><td class="cross">Caches, not land</td><td class="check">✓</td><td class="check">No</td></tr>
      <tr><td>7</td><td class="feat-name">Walkr / Steps &amp; Beasts</td><td>Various</td><td class="check">✓ free tier</td><td class="cross">✗ step counter</td><td class="check">✓</td><td class="check">No</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "What's different",
            "title": "What MapRaiders does that <em>no other Pokémon GO alternative</em> does",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Land stays land</h3><p>Walk a street and it's yours, until somebody takes it back or you drop off the map yourself. No fleeting gym that resets after three hours.</p></div>
    <div class="feat-card rv d1"><h3>Echoes instead of AR</h3><p>Drop audio, photo or video Echoes at real locations. Other players find them when they walk past. No camera, so no dead battery.</p></div>
    <div class="feat-card rv d2"><h3>Seven defense mini-games</h3><p>Tic-Tac-Toe, Rock-Paper-Scissors, Mini-Chess. Strategy decides attacks, not whoever logged more hours.</p></div>
    <div class="feat-card rv d3"><h3>Clans from the neighborhood</h3><p>Clans form because people walk the same street, not because they share a Discord server. Spatial proximity instead of an algorithm.</p></div>
    <div class="feat-card rv d4"><h3>Battery life</h3><p>GPS only, no AR, no camera. On long sessions the phone lasts roughly four times as long as it does on Pokémon GO.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Which game like Pokémon GO is actually free?",
         "a": "MapRaiders is the only indie option in the top seven with fully free gameplay and cosmetic-only IAP. Geocaching has a free tier, but most of the experience sits behind the premium paywall."},
        {"q": "Are there games like Pokémon GO that aren't owned by Niantic?",
         "a": "Yes. Since the March 2025 Niantic-Saudi deal, all four Niantic LBGs (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) sit under Scopely and the Saudi PIF. MapRaiders is the largest non-Niantic alternative right now."},
        {"q": "Are there games like Pokémon GO without AR?",
         "a": "MapRaiders is built without AR on purpose. GPS plus map only. The phone lasts about four times longer on long sessions, and no camera permission is ever required."},
        {"q": "Which alternative works best for runners?",
         "a": "MapRaiders gives runs a reason: hold your territory or take one back. Strava handles performance tracking, MapRaiders handles the game on top. They run together fine."},
        {"q": "Do games like Pokémon GO work in rural areas?",
         "a": "MapRaiders works wherever GPS works. There's no dense PokéStop network requirement, you can claim territory anywhere with an active GPS signal."},
    ],
    "internal_links": [
        ("/en/pokemon-go-alternative-free.html", "free Pokémon GO alternative"),
        ("/en/niantic-alternative.html", "the Niantic refugee home"),
        ("/en/territory-game-app.html", "territory game app"),
        ("/en/scavenger-hunt-app.html", "live citywide scavenger hunt"),
        ("/en/games-like-pokemon-go-reviews.html", "real player reviews"),
        ("/en/mapraiders-reviews.html", "see all beta reviews"),
    ],
}

# K3 — territory-game-app
K3 = {
    "slug": "/en/territory-game-app.html",
    "breadcrumb": "Territory Game App",
    "title": "Territory game app: real-world map conquest as a GPS MMO",
    "og_title": "Territory game app where real land actually belongs to you",
    "meta": "What is a territory game app? MapRaiders is a GPS MMO with persistent real-world land ownership. Free gameplay, no ads, no AR required. Conquer your street, your neighborhood, your city.",
    "keywords": "territory game app, territory game, claim territory game, gps territory game, real-world conquest, land conquest gps game",
    "badge": "Territory game",
    "pricing_pill": "Free forever. Cosmetic optional. No required sub.",
    "h1_html": 'Territory game app: the app where <em>real land</em> actually belongs to you',
    "lead": "A territory game app should be more than a dot on a map that vanishes after five minutes. MapRaiders combines GPS, persistent land claiming, a decay engine, and a defense system that makes conquest feel real. Walk a street and it's yours. As long as you keep defending it.",
    "trigger": {
        "quote": "My dog knows his five favorite corners. I know my territory.",
        "author": "Ron C., dog owner from the Stuttgart area (closed beta)"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Definition",
            "title": "What makes a <em>real territory game app</em>",
            "body": """
    <p><strong>A territory game app</strong> lets players permanently claim, defend and grow real-world map areas. Unlike capture-style games (gyms, portals), ownership is <strong>persistent</strong>, even when the player is offline.</p>
    <p>Four mechanics make the difference between a real territory game and a capture game:</p>
    <ul>
      <li><strong>Persistence.</strong> Captured areas stay assigned to the player or clan until somebody actively takes them back.</li>
      <li><strong>Decay.</strong> Inactive territories shrink over time. Nobody can permanently lock down land without actually playing.</li>
      <li><strong>Defense.</strong> Attacks are decided by a real-time mini-game between attacker and defender, not by an automatic stat-check.</li>
      <li><strong>Clan handovers.</strong> Territories can be transferred to teammates or a clan, which adds economic depth to the map.</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders in detail",
            "title": "The MapRaiders <em>territory system</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Claim</h3><p>Walk, run or cycle a street. Your GPS trail draws the territory under your name as a visible polygon on the live map.</p></div>
    <div class="feat-card rv d1"><h3>Decay engine</h3><p>Skip your territory for too long and it starts shrinking daily. Activity holds the land, not money.</p></div>
    <div class="feat-card rv d2"><h3>Defense mini-games</h3><p>Seven different mini-games decide attacks: Tic-Tac-Toe, Rock-Paper-Scissors, Mini-Chess and more. Strategy beats grind.</p></div>
    <div class="feat-card rv d3"><h3>Clan territory</h3><p>Multiple players can hold a territory together. Clan ground is harder to crack: a single attacker isn't enough.</p></div>
  </div>""",
        },
        {
            "label": "Real vs fake territory",
            "title": "Why Pokémon GO and Ingress are <em>not real territory games</em>",
            "body": """
    <p><strong>Pokémon GO gym captures</strong> are fleeting. You can hold a gym for hours and earn coins, but the gym is a point on the map, not an area. There's no real-estate logic, no land you actually own.</p>
    <p><strong>Ingress portals</strong> work the same way. Points connected by links into triangle fields. The game has fields, but no persistent land ownership. Stop playing for a week and you don't lose &ldquo;your neighborhood&rdquo;, because it was never really yours.</p>
    <p>MapRaiders flips that around. The <strong>territory is the resource</strong>, not the point on top of it. You gain land, you lose land, you hand off land. Like an actual spatial game.</p>
            """,
        },
        {
            "label": "Use cases",
            "title": "Real-world <em>use cases</em>",
            "body": """
    <p>The same loop works across very different player types:</p>
    <ul>
      <li><strong>Take your block.</strong> Walk it daily for two weeks. The territory becomes solid, defense-ready land.</li>
      <li><strong>Defend during your run.</strong> Push notifications fire when a clan territory gets attacked. Your run suddenly has stakes.</li>
      <li><strong>Claim on dog walks.</strong> Daily routines turn into low-effort territorial holds without changing anything about your life.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "How does territory claiming work in MapRaiders?",
         "a": "You walk, run or cycle through a street, and your GPS position claims that area. It shows up on the live map under your name and stays yours until another player physically walks there and challenges you in a defense mini-game. Real, persistent, yours."},
        {"q": "Can I lose my territory?",
         "a": "Yes. The Territory Decay Engine shrinks inactive areas every day. Stay active, walk your territory regularly, and you keep it. Stop, and you lose it. That's how the map stays alive."},
        {"q": "What happens when someone attacks my territory?",
         "a": "The attacker has to physically walk to your territory. Then an interactive mini-game starts between defender and attacker. Whoever wins the mini-game decides the fate of the area. Strategy and skill matter more than time played."},
        {"q": "Can a clan share territory?",
         "a": "Yes. Clans form organically and can jointly control large territory blocks. Clan-owned territory is more resilient: it takes coordinated attacks from multiple players to break it. Teamwork pays off."},
        {"q": "Is the territory game app free?",
         "a": "Yes. The full territory loop is free. Cosmetic items between $1.99 and $9.99 are visual only and give zero gameplay advantage."},
    ],
    "internal_links": [
        ("/en/games-like-pokemon-go.html", "all games like Pokémon GO compared"),
        ("/en/pokemon-go-alternative-free.html", "free Pokémon GO alternative"),
        ("/en/niantic-alternative.html", "Niantic alternative"),
        ("/en/territory-game-app-reviews.html", "territory game app reviews"),
        ("/en/mapraiders-reviews.html", "see all beta reviews"),
    ],
}

# K4 — niantic-alternative
K4 = {
    "slug": "/en/niantic-alternative.html",
    "breadcrumb": "Niantic Alternative",
    "title": "Niantic alternative: indie GPS MMO without Saudi ownership",
    "og_title": "Niantic alternative: the indie GPS MMO not owned by a sovereign fund",
    "meta": "Looking for a Niantic alternative after the Saudi acquisition? MapRaiders is indie, ad-free, with real territory ownership and no remote-raid-pass paywall. Built by a Pokémon GO refugee.",
    "keywords": "niantic alternative, hearusniantic, niantic refugee, post-niantic gps game, indie gps mmo, non-niantic lbg",
    "badge": "Niantic refugee home",
    "pricing_pill": "Indie. No Saudi PIF. No remote-raid-pass paywall.",
    "h1_html": 'Niantic alternative: the indie GPS MMO that isn\'t owned by a <em>sovereign fund</em>',
    "lead": "Since the March 2025 Saudi acquisition, every major Niantic location-based game (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) carries the same trust problem. Same publisher, same data flow, same sovereign-fund ownership chain. MapRaiders is the indie alternative. Independent, ad-free, real territory ownership, and no remote-raid-pass paywall. We don't sell movement data.",
    "trigger": {
        "quote": "Built by a Pokémon GO refugee. Real territory, no remote-raid-pass paywall.",
        "author": "René Scafarti, Founder"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Why now",
            "title": "Why &ldquo;Niantic alternative&rdquo; became a <em>2026 search trend</em>",
            "body": """
    <p>Three signals converged between 2024 and 2026:</p>
    <ul>
      <li><strong>#HearUsNiantic.</strong> The largest organized player backlash in LBG history, running from 2023 into 2025. Remote Raid Pass price hike, Avatar overhaul, Wizards Unite shutdown. Players got loud, organized, and stayed loud.</li>
      <li><strong>The geospatial-AI confession.</strong> Niantic's CEO admitted publicly that &ldquo;users were essentially providing free training data for our geospatial AI model&rdquo;. The framing &ldquo;Pokémon GO was a scam&rdquo; spread fast on Reddit.</li>
      <li><strong>The Saudi acquisition in March 2025.</strong> Niantic sold its game division to Scopely under the Saudi PIF for $3.5 billion. Two trust shocks compounded into one search trend: &ldquo;Niantic alternative&rdquo;.</li>
    </ul>
            """,
        },
        {
            "label": "Single-vendor risk",
            "title": "All current Niantic LBGs share the <em>same trust problem</em>",
            "body": "<p>Switching from Pokémon GO to Ingress doesn't solve anything. Same publisher, same ownership chain, same data flow:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Game</th><th>Publisher</th><th>Niantic-AI training</th><th>Saudi PIF chain</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely</td><td class="cross">Yes</td><td class="cross">Yes</td></tr>
      <tr><td class="feat-name">Ingress</td><td>Niantic / Scopely</td><td class="cross">Yes</td><td class="cross">Yes</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td class="cross">Yes</td><td class="cross">Yes</td></tr>
      <tr><td class="feat-name">Monster Hunter Now</td><td>Niantic + Capcom / Scopely</td><td class="cross">Yes</td><td class="cross">Yes</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC (Indie)</td><td class="check">No</td><td class="check">No</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Five criteria",
            "title": "What an actual <em>Niantic alternative</em> needs to deliver",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Independence</h3><p>Not owned by Niantic, Scopely or any sovereign-fund subsidiary.</p></div>
    <div class="feat-card rv d1"><h3>Real territory</h3><p>Persistent land ownership, not fleeting gym or portal captures.</p></div>
    <div class="feat-card rv d2"><h3>AR-free option</h3><p>GPS-only gameplay, so the camera and the heavy battery drain are optional, not required.</p></div>
    <div class="feat-card rv d3"><h3>Free tier that actually holds up</h3><p>Full game loop, no paywalls, no battle passes, no required subs.</p></div>
    <div class="feat-card rv d4"><h3>No data harvesting</h3><p>No ad-network SDK chain, no geospatial-AI training, no Saudi data flow.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Is MapRaiders affiliated with Niantic?",
         "a": "No. MapRaiders is independent. Built by Scafa Investments LLC, no relationship with Niantic, Scopely or the Saudi Public Investment Fund."},
        {"q": "Is MapRaiders affected by the Niantic-Saudi deal?",
         "a": "No. The March 2025 Niantic deal sold Pokémon GO, Ingress, Pikmin Bloom and Monster Hunter Now to Scopely. MapRaiders has zero connection to any of that."},
        {"q": "Will MapRaiders accept investment from sovereign funds?",
         "a": "No. MapRaiders is privately owned and is committed to staying independent. No state-controlled investment, period."},
        {"q": "What's #HearUsNiantic about?",
         "a": "A player movement that ran from 2023 into 2025, protesting Niantic's monetization decisions. Remote Raid Pass price hike, Avatar overhaul, Wizards Unite shutdown. It's the largest organized player backlash in LBG history."},
        {"q": "How does MapRaiders avoid Niantic's mistakes?",
         "a": "Cosmetic-only IAP. Ad-free. AR-free GPS gameplay. Persistent territory ownership instead of fleeting captures. Organic clans instead of factions. A public commitment against data-selling and state ownership."},
    ],
    "internal_links": [
        ("/en/games-like-pokemon-go.html", "all games like Pokémon GO compared"),
        ("/en/pokemon-go-alternative-free.html", "free Pokémon GO alternative"),
        ("/en/territory-game-app.html", "real territory game app"),
        ("/en/niantic-alternative-reviews.html", "Niantic alternative reviews"),
        ("/en/mapraiders-reviews.html", "see all beta reviews"),
    ],
}

# K5 — best-walking-apps-with-game
K5 = {
    "slug": "/en/best-walking-apps-with-game.html",
    "breadcrumb": "Best Walking Apps with Game",
    "title": "Best walking apps with a game in 2026, Strava alternative with LBG",
    "og_title": "Best walking apps with a real game, why Strava isn't enough",
    "meta": "Best gamified walking apps in 2026: Strava, Wandrer, Walkr, Steps & Beasts, and the one with real territory: MapRaiders. Free gameplay, no required sub, works for dog walks, runs and commutes.",
    "keywords": "best walking apps with game, gamified walking app, walking apps gamified, strava alternative with game, walking game app, longevity walking",
    "badge": "Walking with a game",
    "pricing_pill": "Free. No required sub. Roughly four times the battery life of Pokémon GO.",
    "h1_html": 'Best walking apps with a <em>real game</em>, and why Strava isn\'t quite enough',
    "lead": "Walking is the fastest-growing fitness segment in the US in 2026, but classic running apps deliver stats, not fun. The category that's actually growing is gamified walking apps that turn daily steps into something you want to do. We compared the top six. One of them gives you real territory; the rest don't.",
    "trigger": {
        "quote": "I run every morning anyway, but now I'm also defending something. Weird how much discipline that suddenly mobilizes.",
        "author": "Vivian N., runner from the Hamburg area (closed beta)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "The problem",
            "title": "Why classic running apps <em>aren't enough</em>",
            "body": """
    <p>Three structural gaps explain why Strava and Nike Run Club lose most casual users after the first four weeks:</p>
    <ul>
      <li><strong>No game element.</strong> If you're not chasing PRs, motivation drops fast. Stats alone don't pull most people back every day.</li>
      <li><strong>Performance pressure.</strong> Public leaderboards demotivate just as many casual walkers as they motivate.</li>
      <li><strong>No social map.</strong> Friends' workouts in a feed is not the same thing as friends visible on the map you actually walk.</li>
    </ul>
            """,
        },
        {
            "label": "The list",
            "title": "The 6 best walking apps with <em>game elements</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>#</th><th>App</th><th>Game depth</th><th>Real territory</th><th>Multiplayer</th><th>Price</th></tr></thead>
    <tbody>
      <tr><td><strong>1</strong></td><td class="feat-name">MapRaiders</td><td>Territory + Echoes + clans</td><td class="check">✓ persistent</td><td class="check">Real-time</td><td>Free + cosmetic IAP</td></tr>
      <tr><td>2</td><td class="feat-name">Strava</td><td>Segments + leaderboards</td><td class="cross">✗</td><td>Asynchronous</td><td>Free + Premium $11.99/mo</td></tr>
      <tr><td>3</td><td class="feat-name">Wandrer.earth</td><td>Exploration coverage</td><td class="cross">✗</td><td class="cross">No</td><td>Free + Premium</td></tr>
      <tr><td>4</td><td class="feat-name">Walkr</td><td>Step counter + sci-fi pets</td><td class="cross">✗</td><td class="cross">No</td><td>Free + IAP</td></tr>
      <tr><td>5</td><td class="feat-name">Steps &amp; Beasts</td><td>Step counter + creature collection</td><td class="cross">✗</td><td>Light</td><td>Free + IAP</td></tr>
      <tr><td>6</td><td class="feat-name">Strava × Fi</td><td>Dog-collar partnership</td><td class="cross">✗</td><td>Hardware-required</td><td>Hardware + sub</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Strava plus MapRaiders",
            "title": "MapRaiders and Strava <em>pair better than they compete</em>",
            "body": """
    <p>Strava is a performance-tracking app. MapRaiders is gameplay on top of the same walk. Used together they cover both halves of why people walk:</p>
    <ul>
      <li><strong>Strava handles the metric.</strong> Pace, distance, elevation, segments. Measured precisely.</li>
      <li><strong>MapRaiders handles the meaning.</strong> Same walk, now your block is on the map under your name.</li>
      <li><strong>Same GPS sensor.</strong> Both apps run in parallel without conflict. Neither one breaks the other.</li>
    </ul>
            """,
        },
        {
            "label": "Longevity walking",
            "title": "<em>50+ longevity gaming</em>, the fastest-growing US fitness segment in 2026",
            "body": """
    <p>Walking is the cardiovascular and cognitive backbone of healthy aging. The US 50+ segment is the fastest-growing buyer of fitness apps and connected hardware, and they aren't chasing race times. What they want:</p>
    <ul>
      <li><strong>Mobility goals</strong> that feel meaningful, not punishing.</li>
      <li><strong>Cognitive engagement</strong> on the daily walk, not just step counts.</li>
      <li><strong>Low-stakes social connection</strong>, neighborhood-scale, not nationwide leaderboards.</li>
    </ul>
    <p>MapRaiders' territory loop covers all three without any age-targeted UX. The same loop that makes a 25-year-old runner faster makes a 60-year-old walker more consistent.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders a Strava replacement?",
         "a": "No. Strava measures performance precisely. MapRaiders adds gameplay to the same walk. Use both in parallel, they don't conflict."},
        {"q": "Does it work for slow walking?",
         "a": "Yes. There's no minimum speed. Walking, jogging, hiking, cycling all generate territory as long as you're physically moving and the auto-cheat detection doesn't flag you."},
        {"q": "Will it drain my battery on long walks?",
         "a": "Roughly 30 to 40 percent battery on a two-hour walk, compared to 80 percent or more for Pokémon GO with AR. No camera, no AR rendering, GPS sample-rate optimized."},
        {"q": "Is there a sub required?",
         "a": "No. The full walking-plus-game loop is free forever. Cosmetic items are optional ($1.99 to $9.99) and give zero gameplay advantage."},
        {"q": "Does MapRaiders integrate with Strava?",
         "a": "Direct integration is on the Q4 2026 roadmap. For now, just run both apps in parallel. They share the same GPS sensor without conflict."},
    ],
    "internal_links": [
        ("/en/games-like-pokemon-go.html", "all games like Pokémon GO compared"),
        ("/en/territory-game-app.html", "real territory game app"),
        ("/en/dog-walking/", "dog-walking with a game"),
        ("/en/walking-app-reviews.html", "walking app reviews"),
        ("/en/mapraiders-reviews.html", "see all beta reviews"),
    ],
}

# K6 — scavenger-hunt-app
K6 = {
    "slug": "/en/scavenger-hunt-app.html",
    "breadcrumb": "Scavenger Hunt App",
    "title": "Scavenger hunt app in 2026, live citywide and free",
    "og_title": "Scavenger hunt app: a whole city of hidden Echoes",
    "meta": "Best scavenger hunt app in 2026: live, citywide, no in-app purchases, no premium tour fees. MapRaiders turns any city into an open scavenger hunt for kids and adults.",
    "keywords": "scavenger hunt app, citywide scavenger hunt, live scavenger hunt, family scavenger hunt app, urban scavenger hunt, free scavenger hunt",
    "badge": "Live scavenger hunt",
    "pricing_pill": "Free forever. No tour purchases. Family-safe and COPPA-aligned.",
    "h1_html": 'Scavenger hunt app: a whole city full of <em>hidden Echoes</em>, always live',
    "lead": "Most scavenger hunt apps need prep work. Buy a tour, set up stations, print a clue sheet. MapRaiders flips that. Echoes are already scattered across the whole city. You follow other players' clues, or you leave your own. Live, free, zero setup. Family-friendly with parental controls, with competitive depth for adults through clan territory.",
    "trigger": {
        "quote": "You leave a short audio clip at a doorway, three days later somebody you don't know has found it. It feels weirdly intimate for a game.",
        "author": "Aljoscha P., urban explorer from the Berlin area (closed beta)"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "What counts",
            "title": "What a <em>modern scavenger hunt app</em> needs",
            "body": """
    <p>Three things separate 2020s scavenger-hunt apps from the print-and-clue era:</p>
    <ul>
      <li><strong>Live.</strong> Clues exist in real time, not only inside pre-built tours.</li>
      <li><strong>Social.</strong> Players leave clues for each other instead of grinding through static stations.</li>
      <li><strong>No premium gate.</strong> Parents and kids start playing instantly, without buying a $4.99 tour first.</li>
    </ul>
            """,
        },
        {
            "label": "Comparison",
            "title": "Scavenger hunt apps <em>compared</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>Price</th><th>Setup</th><th>Live element</th><th>Game loop</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Goosechase</td><td>Per-event fees</td><td>High (build a hunt)</td><td class="cross">Pre-built only</td><td>Per-event</td></tr>
      <tr><td class="feat-name">Actionbound</td><td>Bound purchases or sub</td><td>High (build a tour)</td><td class="cross">✗</td><td>Per-tour</td></tr>
      <tr><td class="feat-name">Scavify</td><td>Enterprise/event sub</td><td>High</td><td class="cross">Pre-built only</td><td>Per-event</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Premium-paywalled</td><td>Low (find caches)</td><td class="cross">Asynchronous</td><td>Collection</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">$0</td><td class="check">Zero</td><td class="check">Live</td><td>Echoes + quests + territory</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "How we rethink it",
            "title": "How MapRaiders <em>rethinks</em> the scavenger hunt",
            "body": """
    <p>Instead of a linear tour from station one to station ten, MapRaiders creates an <strong>open spatial scavenger hunt</strong> where the city itself is the playground:</p>
    <ul>
      <li><strong>Drop Echoes.</strong> Leave an audio, photo or video Echo at a real location. Other players find it when they walk past.</li>
      <li><strong>Find Echoes.</strong> See on the map where Echoes are. Follow the trail, find secrets, hear stories.</li>
      <li><strong>Build quests.</strong> Create a small task at a place (&ldquo;photograph the red door across the street&rdquo;). Other players complete it.</li>
      <li><strong>Territory layer.</strong> Walk a scavenger route often enough and it becomes claimed territory. Your hunt becomes your land.</li>
    </ul>
            """,
        },
        {
            "label": "Family use case",
            "title": "Scavenger hunt app for <em>families</em>",
            "body": """
    <p>Scavenger hunts have always been a family thing. MapRaiders brings that into the smartphone era without sticking kids alone in front of a screen:</p>
    <ul>
      <li><strong>Parent-and-kid activity.</strong> Parents drop audio Echoes along a planned route. Kids follow the clues. Physical movement, digital hints.</li>
      <li><strong>Screen-light by design.</strong> The app shows the map. The experience happens in the real world.</li>
      <li><strong>COPPA-aligned.</strong> No personally identifiable information from minors, no ads, parental mode available for restricted gameplay.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders safe for kids?",
         "a": "Yes, ages nine and up with parental supervision. The app collects no personally identifiable information from minors (COPPA-aligned), is ad-free, and has a parental mode for restricted gameplay."},
        {"q": "How much prep do I need for a scavenger hunt with kids?",
         "a": "Zero. Unlike Actionbound or Goosechase you don't buy a tour or pre-set stations. Echoes are already scattered across the city. You follow other players' clues or leave your own."},
        {"q": "Are there scavenger hunt apps for adults?",
         "a": "Yes. MapRaiders' Echo system and clan-territory mechanics scale from family fun to competitive multiplayer."},
        {"q": "Does it cost anything?",
         "a": "No. The scavenger-hunt features (drop Echoes, find Echoes, build quests) are fully free. Cosmetic items ($1.99 to $9.99) are optional and give zero gameplay advantage."},
        {"q": "Does it work in small towns?",
         "a": "Yes. Even in small towns or rural areas you can drop Echoes and build quests. Dense cities have more clues from other players. Rural areas leave your own route more room for solo exploration."},
    ],
    "internal_links": [
        ("/en/games-like-pokemon-go.html", "all games like Pokémon GO compared"),
        ("/en/territory-game-app.html", "real territory game app"),
        ("/en/scavenger-hunt/", "scavenger hunt niche"),
        ("/en/scavenger-hunt-app-reviews.html", "scavenger hunt app reviews"),
        ("/en/mapraiders-reviews.html", "see all beta reviews"),
    ],
}

# K7 — zenly-alternative
K7 = {
    "slug": "/en/zenly-alternative.html",
    "breadcrumb": "Zenly Alternative",
    "title": "Zenly alternative in 2026: real map social network with a game",
    "og_title": "Zenly alternative: map social network rebuilt with gameplay",
    "meta": "Looking for a Zenly alternative since 2023? MapRaiders rebuilds the map social network with territory, Echoes and clans. No algorithm, no feed, granular opt-in privacy.",
    "keywords": "zenly alternative, post-zenly app, map social network, friends on map app, zenly replacement, snap map alternative",
    "badge": "Zenly refugee home",
    "pricing_pill": "Privacy-first map-social. No algorithm. No feed.",
    "h1_html": 'Zenly alternative: the map social network, <em>rebuilt with a real game</em> on top',
    "lead": "When Snap shut down Zenly in February 2023, around 100 million users lost their map social network overnight, and nothing showed up to replace it. Snap Map is ephemeral. Find My is utility only. Life360 is family-tracking. MapRaiders rebuilds the map-as-social-network and puts a real game loop on top of it.",
    "trigger": {
        "quote": "When Zenly shut down in 2023, around 100 million people lost their map social network. We rebuilt it.",
        "author": "MapRaiders brand vision"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "What Zenly was",
            "title": "What Zenly was and <em>why it mattered</em>",
            "body": """
    <p>Zenly was a real-time location-sharing app for friends. Live map, friends visible on it, with mood, battery, bumps. Snap acquired it and then shut it down in February 2023, citing strategic refocus.</p>
    <p>The result was <strong>around 100 million displaced users</strong>, mostly in Gen-Z friend groups, who never found an equivalent replacement. Snap Map is feed-flavored and ephemeral. Find My is iOS-only utility. Life360 is family-tracking with paid tiers. None of them actually rebuilt the map-as-social-network.</p>
            """,
        },
        {
            "label": "What doesn't quite work",
            "title": "The Zenly alternatives that <em>don't quite work</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>Type</th><th>Map-as-social</th><th>Privacy mode</th><th>Game loop</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Snap Map</td><td>Ephemeral feed-on-map</td><td class="cross">Half, feed-flavored</td><td>Ghost mode</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Find My (Apple)</td><td>Utility</td><td class="cross">No</td><td>Toggle</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Life360</td><td>Family-tracking</td><td class="cross">No</td><td>Paid tiers</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Discord bots</td><td>DIY hack</td><td class="cross">Hacky</td><td>Variable</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td>Map-social + GPS MMO</td><td class="check">✓ full</td><td class="check">Granular opt-in</td><td class="check">Territory + Echoes + clans</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Beyond Zenly",
            "title": "What MapRaiders <em>adds beyond Zenly</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territory game loop</h3><p>Friends on the map, plus a reason to walk: persistent land that actually belongs to you.</p></div>
    <div class="feat-card rv d1"><h3>Echo audio layer</h3><p>Drop voice notes at real locations for friends to find. The map gets sound, not just dots.</p></div>
    <div class="feat-card rv d2"><h3>Organic clans</h3><p>Friend groups turn into territorial alliances, co-defending shared neighborhoods.</p></div>
    <div class="feat-card rv d3"><h3>Defense mini-games</h3><p>Real-time interactions when territories clash, instead of just passive map presence.</p></div>
  </div>""",
        },
        {
            "label": "Privacy-first",
            "title": "Privacy-first <em>map social</em>",
            "body": """
    <p>The Zenly model defaulted to real-time location-sharing. MapRaiders rebuilds it on opt-in foundations:</p>
    <ul>
      <li><strong>No algorithm, no feed.</strong> The map is the interface. Nothing trends, nothing pushes.</li>
      <li><strong>Friend visibility is opt-in per friend.</strong> Granular controls. There's no &ldquo;share with everyone&rdquo; default.</li>
      <li><strong>Private mode.</strong> Hide your live location entirely and still claim territory and play.</li>
      <li><strong>No data selling.</strong> No ad-network SDKs, no Saudi sovereign-fund ownership. Independent US LLC.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders a Zenly clone?",
         "a": "No. Zenly was real-time location-sharing for friends. MapRaiders is a GPS MMO with territory ownership and an Echo content layer. We share the map-as-social-network idea, but with a full game loop on top."},
        {"q": "Can I see my friends' real-time location like in Zenly?",
         "a": "Yes. Friend visibility is opt-in per friend, with granular controls. You can also play in private mode (no visibility at all) and still claim territory."},
        {"q": "Does MapRaiders share my location with strangers?",
         "a": "Never your real-time location. Only your territories, Echoes and clan membership are public. Live location is friend-only opt-in."},
        {"q": "When did Zenly shut down?",
         "a": "Snap shut down Zenly in February 2023. Around 100 million users lost their map social network overnight, with no equivalent replacement."},
        {"q": "Is MapRaiders safe for kids?",
         "a": "Ages nine and up, COPPA-aligned. Parental mode hides location from non-friends entirely."},
    ],
    "internal_links": [
        ("/en/territory-game-app.html", "real territory game app"),
        ("/en/games-like-pokemon-go.html", "all games like Pokémon GO compared"),
        ("/en/social-media-alternative.html", "map-based social media alternative"),
        ("/en/zenly-alternative-reviews.html", "Zenly alternative reviews"),
        ("/en/mapraiders-reviews.html", "see all beta reviews"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/en/pokemon-go-alternative-reviews.html",
        "breadcrumb": "Pokémon GO Alternative Reviews",
        "title": "Pokémon GO alternative reviews from the MapRaiders closed beta",
        "og_title": "Pokémon GO alternative reviews: real beta tester voices",
        "meta": "Pokémon GO alternative reviews from the MapRaiders closed beta: three testers from Stuttgart, Hamburg and Berlin report honestly on cardio, dog walks, and urban exploration.",
        "keywords": "pokemon go alternative reviews, mapraiders reviews, gps game test, beta tester report, indie pokemon go alternative",
        "h1_html": 'Pokémon GO alternative: <em>real reviews</em> from the closed beta',
        "lead": "Three internal beta testers from three German urban areas used MapRaiders for several weeks. The reports below are unvarnished, with no marketing copy and no influencer promo codes. The reviews are translated from the German originals.",
        "intro_label": "Who's testing here",
        "intro_title": "Three people, three <em>use cases</em>",
        "intro_body": """
    <p>The three beta testers cover very different personas, and that's what makes the comparison to Pokémon GO honest:</p>
    <ul>
      <li><strong>Ron C.</strong> from the Stuttgart area. Dog owner, daily walk, no gamer background.</li>
      <li><strong>Vivian N.</strong> from the Hamburg area. Runner, tried Pokémon GO in 2018 and quit after three months.</li>
      <li><strong>Aljoscha P.</strong> from the Berlin area. Urban explorer, Ingress veteran, knows the Niantic ecosystem firsthand.</li>
    </ul>
    <p>All three tested MapRaiders independently. No paid promotion, no scripts. The quotes are translations from German originals, marked with <code>translationOfWork</code> in Schema.org so the chain stays transparent.</p>
        """,
        "internal_links": [
            ("/en/pokemon-go-alternative-free.html", "free Pokémon GO alternative"),
            ("/en/games-like-pokemon-go.html", "all games like Pokémon GO compared"),
            ("/en/games-like-pokemon-go-reviews.html", "games like Pokémon GO reviews"),
            ("/en/mapraiders-reviews.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en/games-like-pokemon-go-reviews.html",
        "breadcrumb": "Games Like Pokémon GO Reviews",
        "title": "Games like Pokémon GO: reviews from the MapRaiders beta",
        "og_title": "Reviews of games like Pokémon GO: MapRaiders beta",
        "meta": "Reviews of games like Pokémon GO: three German beta testers report on MapRaiders. Territory system, Echoes and defense mini-games, tested in real daily use.",
        "keywords": "games like pokemon go reviews, pokemon go alternative test, gps mmo test, mapraiders test, beta review",
        "h1_html": 'Games like Pokémon GO: <em>reviews from the beta</em>',
        "lead": "What happens when a Pokémon GO veteran, a runner, and a dog owner test the same GPS-MMO alternative side by side? Three very different reports from the MapRaiders closed beta.",
        "intro_label": "Test setting",
        "intro_title": "How we <em>tested</em>",
        "intro_body": """
    <p>The three testers used MapRaiders for four to six weeks inside their normal routine. No artificial test sessions, no sponsored content. Concretely:</p>
    <ul>
      <li><strong>Daily use</strong> in their own urban area (Stuttgart, Hamburg, Berlin).</li>
      <li><strong>Direct comparison</strong> against Pokémon GO at Aljoscha P., who played both in parallel for two weeks.</li>
      <li><strong>Battery measurement</strong> via app settings: average consumption per hour.</li>
      <li><strong>Honest-feedback rule.</strong> Bugs, frustration and wishes are reported alongside the highlights.</li>
    </ul>
        """,
        "internal_links": [
            ("/en/games-like-pokemon-go.html", "all games like Pokémon GO compared"),
            ("/en/pokemon-go-alternative-free.html", "free Pokémon GO alternative"),
            ("/en/pokemon-go-alternative-reviews.html", "Pokémon GO alternative reviews"),
            ("/en/mapraiders-reviews.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en/territory-game-app-reviews.html",
        "breadcrumb": "Territory Game App Reviews",
        "title": "Territory game app reviews: beta testers on MapRaiders",
        "og_title": "Territory game app: real reviews from the beta",
        "meta": "Territory game app reviews from real daily use: three German beta testers report on what claiming land, decay and the defense mini-games actually feel like in their urban routines.",
        "keywords": "territory game app reviews, claim territory game test, land conquest app reviews, territory game test",
        "h1_html": 'Territory game app: when <em>your own street</em> belongs to you',
        "lead": "What does it actually feel like to conquer a real street? Three beta testers report on their first territory, the first decay shock, and the first defense mini-game.",
        "intro_label": "What matters in the test",
        "intro_title": "What makes a <em>territory game</em> tangible",
        "intro_body": """
    <p>The territory test ran along three experience axes:</p>
    <ul>
      <li><strong>Conquest.</strong> When does the first claimed street start feeling like &ldquo;my land&rdquo;?</li>
      <li><strong>Loss.</strong> How do you react to the first decay, or to losing land to an attacker?</li>
      <li><strong>Defense.</strong> How do the defense mini-games feel: tactical, fair, frustrating?</li>
    </ul>
    <p>The three testers' quotes cover all three axes from very different perspectives.</p>
        """,
        "internal_links": [
            ("/en/territory-game-app.html", "real territory game app"),
            ("/en/games-like-pokemon-go.html", "all games like Pokémon GO compared"),
            ("/en/niantic-alternative-reviews.html", "Niantic alternative reviews"),
            ("/en/mapraiders-reviews.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en/niantic-alternative-reviews.html",
        "breadcrumb": "Niantic Alternative Reviews",
        "title": "Niantic alternative reviews: refugee players report from the beta",
        "og_title": "Niantic alternative: real reviews from Pokémon GO refugees",
        "meta": "Niantic alternative reviews from the MapRaiders closed beta. How does an indie GPS MMO actually compare to Pokémon GO and Ingress? Real beta testers report, including an ex-Ingress veteran.",
        "keywords": "niantic alternative reviews, post-niantic gps game reviews, hearusniantic reviews, pokemon go refugee reviews",
        "h1_html": 'Niantic alternative: <em>reviews from refugees</em>',
        "lead": "What does it look like when a Pokémon GO veteran, an Ingress player, and a casual mover all test an indie alternative side by side? Three honest reviews from the closed beta, including one from somebody who knows the Niantic ecosystem firsthand.",
        "intro_label": "Refugee perspective",
        "intro_title": "Why these reviews <em>matter</em>",
        "intro_body": """
    <p>Niantic alternatives are a flooded category, and most of the reviews out there come from launch-day promo. These three are different:</p>
    <ul>
      <li><strong>Aljoscha P.</strong> is an Ingress veteran. He tested MapRaiders against Niantic's actual mechanics, not against marketing.</li>
      <li><strong>Vivian N.</strong> tried Pokémon GO in 2018 and quit. The 2026 indie alternative is her first re-entry to the genre.</li>
      <li><strong>Ron C.</strong> isn't a gamer at all. His test answers the question: does the genre even work for non-gamers?</li>
    </ul>
        """,
        "internal_links": [
            ("/en/niantic-alternative.html", "Niantic alternative"),
            ("/en/games-like-pokemon-go.html", "all games like Pokémon GO compared"),
            ("/en/territory-game-app-reviews.html", "territory game app reviews"),
            ("/en/mapraiders-reviews.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en/walking-app-reviews.html",
        "breadcrumb": "Walking App Reviews",
        "title": "Walking app reviews: gamified GPS walking from the beta",
        "og_title": "Walking app reviews: cardio plus territory in the real world",
        "meta": "Walking app reviews from the MapRaiders beta: cardio motivation, battery life on long routes, territory loss after illness pauses. Three real testers report.",
        "keywords": "walking app reviews, gamified walking app reviews, strava alternative reviews, dog walking app reviews",
        "h1_html": 'Walking apps with a game: <em>real reviews</em> from the beta',
        "lead": "What happens to walking motivation when every route defends real land? What does the first decay after a sick week actually feel like? Three beta testers report. A runner, a walker, and an urban explorer.",
        "intro_label": "Test axes",
        "intro_title": "What a <em>walking-with-game app</em> needs to deliver",
        "intro_body": """
    <p>We tested the walking experience along three axes:</p>
    <ul>
      <li><strong>Motivation anchor.</strong> When does somebody come back after a pause?</li>
      <li><strong>Battery on long routes.</strong> Sixty- to ninety-minute walks without battery death.</li>
      <li><strong>Cross-activity.</strong> Does the same loop work for running, walking and dog walks?</li>
    </ul>
        """,
        "internal_links": [
            ("/en/best-walking-apps-with-game.html", "best walking apps with game"),
            ("/en/dog-walking/", "dog-walking with a game"),
            ("/en/territory-game-app-reviews.html", "territory game app reviews"),
            ("/en/mapraiders-reviews.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en/scavenger-hunt-app-reviews.html",
        "breadcrumb": "Scavenger Hunt App Reviews",
        "title": "Scavenger hunt app reviews: no-setup live city hunt",
        "og_title": "Scavenger hunt app: reviews from the beta test",
        "meta": "Scavenger hunt app reviews without tour purchases or setup: beta testers report on how MapRaiders turns the whole city into a live scavenger hunt.",
        "keywords": "scavenger hunt app reviews, citywide scavenger hunt reviews, family scavenger hunt reviews, urban hunt app test",
        "h1_html": 'Scavenger hunt app: <em>reviews</em> without tour purchases',
        "lead": "Most scavenger hunt apps need prep work. Buy a tour, plan a route, set up stations. What does it feel like when the whole city is already filled with clues from other players? Three beta testers report.",
        "intro_label": "The question",
        "intro_title": "Does a <em>live scavenger hunt</em> work without setup?",
        "intro_body": """
    <p>We tested the scavenger-hunt features in three settings:</p>
    <ul>
      <li><strong>Solo</strong> as urban explorer (Aljoscha P.). Drop Echoes, find Echoes.</li>
      <li><strong>With a dog</strong> on the regular walk (Ron C.). Clues as a side product of the routine.</li>
      <li><strong>Family setting,</strong> simulated. How fast do adults and kids together pick up the mechanic?</li>
    </ul>
        """,
        "internal_links": [
            ("/en/scavenger-hunt-app.html", "scavenger hunt app"),
            ("/en/scavenger-hunt/", "scavenger hunt niche"),
            ("/en/territory-game-app-reviews.html", "territory game app reviews"),
            ("/en/mapraiders-reviews.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en/zenly-alternative-reviews.html",
        "breadcrumb": "Zenly Alternative Reviews",
        "title": "Zenly alternative reviews: map social network rebuilt",
        "og_title": "Zenly alternative: real reviews from map-social refugees",
        "meta": "Zenly alternative reviews from the MapRaiders closed beta: what does a map-social network with a game loop feel like after three years without Zenly?",
        "keywords": "zenly alternative reviews, post-zenly app reviews, map social network reviews, friends on map app reviews",
        "h1_html": 'Zenly alternative: <em>reviews</em> from map-social refugees',
        "lead": "Three years after Zenly shut down, what does a map-as-social-network actually feel like with a real game loop on top? Three beta testers report, including one who used Zenly daily right up until the shutdown.",
        "intro_label": "What we tested",
        "intro_title": "Map social <em>without the algorithm</em>",
        "intro_body": """
    <p>The Zenly-replacement test focused on three points:</p>
    <ul>
      <li><strong>Friend visibility.</strong> Granular opt-in vs Zenly's default-on. Does it still feel social?</li>
      <li><strong>Privacy mode.</strong> Can you play invisibly and still get value out of the app?</li>
      <li><strong>Game loop on the map.</strong> Do territory and Echoes give the map a purpose beyond just &ldquo;dots of friends&rdquo;?</li>
    </ul>
        """,
        "internal_links": [
            ("/en/zenly-alternative.html", "Zenly alternative"),
            ("/en/territory-game-app.html", "real territory game app"),
            ("/en/games-like-pokemon-go-reviews.html", "games like Pokémon GO reviews"),
            ("/en/mapraiders-reviews.html", "see all beta reviews"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/en/mapraiders-reviews.html",
    "breadcrumb": "MapRaiders Reviews",
    "title": "MapRaiders reviews: beta tests, founder statement, all topics",
    "og_title": "MapRaiders reviews: every beta voice in one place",
    "meta": "MapRaiders reviews: 5.0 out of 5 from three verified beta tests, founder statement, every Killer page and reviews page linked from one hub.",
    "keywords": "mapraiders reviews, mapraiders beta reviews, gps mmo reviews, indie pokemon go alternative reviews",
    "badge": "Hub and overview",
    "pricing_pill": "5.0 out of 5 from three verified beta reviews",
    "h1_html": '<em>MapRaiders reviews</em>: everything about the GPS MMO in one place',
    "lead": "Three beta testers from Stuttgart, Hamburg and Berlin. Seven Killer topics, from the Pokémon GO comparison to the Zenly replacement. Seven dedicated reviews pages. One hub.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "What is MapRaiders, exactly?",
         "a": "MapRaiders is a GPS-based MMO for Android. Players claim real territories by moving through them, leave Echoes at locations, build quests, and defend their land with mini-games. Ad-free, AR-free, free gameplay."},
        {"q": "How many beta testers are these?",
         "a": "Three testers we feature publicly, with their consent, under first name plus initial for privacy. The full closed beta is bigger. The three featured here represent the main personas."},
        {"q": "Are the reviews real?",
         "a": "Yes. The three testers are real people from the closed beta. Nobody got paid, the quotes were originally written in German. Schema.org marks the English versions with translationOfWork pointing to the German originals, so the chain stays transparent."},
        {"q": "How can I become a beta tester?",
         "a": "Drop your email on the homepage. Beta slots get released in waves. Priority goes to active walkers, runners and dog owners in cities with low player density."},
        {"q": "When does the app launch officially?",
         "a": "MapRaiders is on Google Play as a closed beta right now. Public US launch is targeted for Summer 2026, with iOS following in Q3 2026."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print(f"=== Phase 1 Session 1 — EN Killer-URL Builder ===")
    print(f"Output: {EN_DIR}")
    print()

    EN_DIR.mkdir(parents=True, exist_ok=True)

    written = []

    # 1. Killer pages
    for page in ALL_KILLERS:
        # slug is /en/foo.html — strip leading slash, write under DOCS
        out_path = DOCS / page["slug"].lstrip("/")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = render_killer_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(out_path.name)
        print(f"  [KILLER] {page['slug']}  ({len(html):,} bytes)")

    # 2. Twin pages
    for page in TWINS_DATA:
        out_path = DOCS / page["slug"].lstrip("/")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = render_twin_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(out_path.name)
        print(f"  [TWIN]   {page['slug']}  ({len(html):,} bytes)")

    # 3. Hub
    all_killer_links = [(p["slug"], p["breadcrumb"]) for p in ALL_KILLERS]
    all_twin_links = [(p["slug"], p["breadcrumb"]) for p in TWINS_DATA]
    out_path = DOCS / HUB["slug"].lstrip("/")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    html = render_hub_page(HUB, all_killer_links, all_twin_links)
    out_path.write_text(html, encoding="utf-8")
    written.append(out_path.name)
    print(f"  [HUB]    {HUB['slug']}  ({len(html):,} bytes)")

    print()
    print(f"=== {len(written)} files written ===")
    for n in written:
        print(f"  {n}")


if __name__ == "__main__":
    main()

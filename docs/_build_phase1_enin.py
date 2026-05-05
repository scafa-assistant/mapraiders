#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 3 — EN-IN Killer-URL Builder
Generates 15 EN-IN pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_EN-IN_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_enin.py
Idempotent: overwrites existing files in docs/en-in/.

UK-Spelling konsequent (defence, neighbourhood, colour, centre, artefact,
favourite, customise, organise, realise, travelling).
EN-IN reviews are translations from DE originals — Schema.org marks this
via translationOfWork pointing to #review-ron-c (de).
hreflang en-IN explicit, og:locale en_IN, html lang="en-IN", inLanguage en-IN.
INR-Pricing in Schema (₹).
K4 (low-end-android) + K7 (cricket-fan-map-app) sind IN-EXKLUSIV.
"""

import json
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
EN_IN_DIR = DOCS / "en-in"
SITE = "https://mapraiders.com"
LANG = "en-IN"

# Hreflang map — for new EN-IN-killer pages.
HREFLANG = [
    ("de", "/"),
    ("en", "/en/"),
    ("en-IN", "/en-in/"),
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
]

LANG_SWITCHER = [
    ("Deutsch", "de", "/"),
    ("English", "en", "/en/"),
    ("English (IN)", "en-IN", "/en-in/"),
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
# REUSABLE BLOCKS — Master-Plan §1.2 + §3 (UK-Spelling)
# -----------------------------------------------------------------------------

TESTER_RON = {
    "name": "Ron C.",
    "role": "Dog Owner · Stuttgart area, Germany",
    "role_long": "Dog owner from the Stuttgart area, Germany (closed beta)",
    "quote": "My dog loves his walk — and I love that every walk makes my neighbourhood more visible on the map. I've conquered my whole street already.",
    "date": "2026-03-15",
    "id_local": "review-ron-c-en-in",
    "id_de": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "Runner · Hamburg area, Germany",
    "role_long": "Runner from the Hamburg area, Germany (closed beta)",
    "quote": "I run every morning anyway. With MapRaiders every route has a goal: hold your territory or take it back. My cardio drive has exploded.",
    "date": "2026-03-22",
    "id_local": "review-vivian-n-en-in",
    "id_de": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "Urban Explorer · Berlin area, Germany",
    "role_long": "Urban explorer from the Berlin area, Germany (closed beta)",
    "quote": "Dropping Echoes and watching who finds them is like an open scavenger hunt across the whole city.",
    "date": "2026-04-01",
    "id_local": "review-aljoscha-p-en-in",
    "id_de": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder quote EN-IN (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "I was one of the frustrated Pokémon GO players. I wanted real territory, "
    "not a fleeting gym capture. I didn't want my steps sold to Saudi sovereign "
    "funds, no ad-network business model, no required premium sub. So I built "
    "MapRaiders — designed to run smooth on every Indian phone, from Tier-1 "
    "flagships to Tier-2 budget devices. This is my home turf — and it's about "
    "to be yours."
)

# Pricing offers — IN PPP-Pricing in INR (Master-Plan §1.1)
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0", "currency": "INR"},
    {"name": "Cosmetic-IAP from", "price": "19", "currency": "INR"},
    {"name": "MapRaiders Supporter (Sub)", "price": "89", "currency": "INR"},
    {"name": "Lifetime Supporter", "price": "1899", "currency": "INR"},
]

# DefinedTermSet (Brand-Vocab EN-IN, UK-Spelling)
DEFINED_TERMS = [
    ("Territory", "A captured map area persistently assigned to a player or clan"),
    ("Echo", "A location-attached audio, photo or video signal a player leaves for others to discover"),
    ("Defence Mini-Game", "A mini-game (Tic-Tac-Toe, RPS, Mini-Chess) triggered when a territory is contested"),
    ("Echo Drop", "The action of leaving an Echo at a real-world location"),
    ("Territory Decay", "Mechanic by which abandoned territories degrade over time and become claimable again"),
    ("Quest", "A player-created mini-task others can complete in the real world"),
    ("Clan", "An organic group of players who hold and defend territories together"),
    ("Neighbourhood", "Your local block — the street you walk daily, your home turf"),
    ("Artefact", "A rare collectable item discovered through Echo exploration"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """slug e.g. '/en-in/games-like-pokemon-go-india.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "en-IN":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="en-IN"):
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
      Note: Testers are internal beta participants (closed beta). First name + initial is used at testers' privacy request. Reviews are translations from the German originals; Schema.org marks them with <code>translationOfWork</code> for transparency.
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
      <a href="/en-in/privacy.html">Privacy</a><a href="/en-in/terms.html">Terms</a><a href="/en-in/imprint.html">Imprint</a><a href="/en-in/contact.html">Contact</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; Conquer your neighbourhood. A product of Scafa Investments LLC.</p>
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
  <a href="/en-in/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/en-in/#features" class="lnk">Features</a>
    <a href="/en-in/mapraiders-reviews-india.html" class="lnk">Reviews</a>
    <div class="lang-sw">
      <button class="lsw-btn">EN-IN <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('en-IN')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify%20India" class="btn-dl">Coming Soon</a>
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
    return [
        {
            "@type": "Review",
            "@id": f"#{t['id_local']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "en-IN",
            "translationOfWork": {"@type": "Review", "@id": f"#{t['id_de']}", "inLanguage": "de"},
        }
        for t in testers
    ]


def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/en-in/"},
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
            "inLanguage": "en-IN",
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
            "inLanguage": "en-IN",
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
            "review": [{"@id": f"#{t['id_local']}"} for t in testers],
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-en-in",
            "name": "MapRaiders Brand Vocabulary English India",
            "inLanguage": "en-IN",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/en-in/"},
        {"@type": "ListItem", "position": 2, "name": "Reviews", "item": f"{SITE}/en-in/mapraiders-reviews-india.html"},
        {"@type": "ListItem", "position": 3, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = []
    for t in ALL_TESTERS:
        obj = {
            "@type": "Review",
            "@id": f"#{t['id_local']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "en-IN",
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
            "inLanguage": "en-IN",
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
            "inLanguage": "en-IN",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "3",
                "bestRating": "5",
            },
            "review": [{"@id": f"#{t['id_local']}"} for t in ALL_TESTERS],
        },
        *review_objs,
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_hub(page, all_killers, all_twins):
    base = build_schema_killer(page)
    item_list = {
        "@type": "ItemList",
        "@id": f"{SITE}{page['slug']}#itemlist",
        "name": "MapRaiders EN-IN — all Killer and Reviews pages",
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
  <h2 class="sec-title rv d1">Frequently Asked <em>Questions</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Deeper into the <em>territory</em></h2>
  <p class="rv d1">Related MapRaiders topics for India:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Coming soon on Google Play &bull; Free &bull; UPI-friendly &bull; No spam</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify%20India" class="btn-p">Notify me at launch</a>
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
  <cite>— {page['trigger']['author']}</cite>
</div>"""

    pricing_pill = ""
    if page.get("pricing_pill"):
        pricing_pill = f'<div class="pricing-pill rv">{page["pricing_pill"]}</div>'

    return f"""<!DOCTYPE html>
<html lang="en-IN" data-theme="light">
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
<meta property="og:locale" content="en_IN">
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
  <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify%20India" class="btn-p rv d3">
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
  <h2 class="sec-title rv d1">5.0 out of 5 — <em>3 verified beta reviews</em></h2>
  <div class="prose rv d2">
    <p>Three internal beta testers from Germany — a dog owner, a runner and an urban explorer — used MapRaiders for several weeks. The reviews below are translated from the German originals and represent real people from the closed beta. We use first name plus initial at the testers' privacy request.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="en-IN" data-theme="light">
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
<meta property="og:locale" content="en_IN">
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
  <div class="h-badge rv">Reviews India</div>
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
  <div class="sec-label rv">Topic Hub India</div>
  <h2 class="sec-title rv d1">All <em>MapRaiders India topics</em> at a glance</h2>
  <div class="prose rv d2">
    <p>This hub gathers all 7 Killer pages plus 7 dedicated reviews pages for the Indian market — from the Pokémon GO comparison to the cricket-fan map app, from low-end Android performance to citywide treasure hunts. UK-spelling throughout, INR pricing, UPI-friendly. Yeh app aapke neighbourhood ke liye banaya gaya hai — built for Tier-1 flagships and Tier-2 budget devices alike.</p>
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
  <div class="sec-label rv">Aggregate Rating</div>
  <h2 class="sec-title rv d1">5.0 out of 5 — <em>3 verified beta reviews</em></h2>
  <div class="prose rv d2">
    <p>All reviews come from the closed beta phase, February–April 2026. Three testers — a dog owner, a runner, an urban explorer — tested MapRaiders on their own routes in Stuttgart, Hamburg and Berlin. The reviews shown here are translations from the German originals and represent real people. Schema.org marks them via <code>translationOfWork</code> for transparency. Indian beta testers (DPDPA-compliant) launch in Tier-2 phase post-launch.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="en-IN" data-theme="light">
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
<meta property="og:locale" content="en_IN">
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
  <div class="h-badge rv">MapRaiders India Hub</div>
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
# PAGE DATA — KILLERS (K1-K7) — Master-Plan §4
# -----------------------------------------------------------------------------

# K1 — pokemon-go-alternative-free-india
K1 = {
    "slug": "/en-in/pokemon-go-alternative-free-india.html",
    "breadcrumb": "Pokémon GO Alternative Free India",
    "title": "Pokémon GO Alternative Free India — UPI-friendly, no Saudi",
    "og_title": "Pokémon GO Alternative Free India — Ad-Free, UPI-friendly",
    "meta": "Looking for Pokémon GO alternative free in India? MapRaiders is 100% free, UPI-friendly, runs on Tier-2 phones. No Saudi ownership.",
    "keywords": "pokemon go alternative free india, free gps game india, ad-free location game india, niantic refugee india, upi friendly game",
    "badge": "Free Forever · India",
    "pricing_pill": "₹0 Gameplay · Cosmetic-IAP from ₹19 · UPI-friendly",
    "h1_html": 'Pokémon GO Alternative Free India — <em>UPI-friendly</em>, no Saudi data, no battle pass',
    "lead": "Looking for a Pokémon GO alternative in India that's actually free? Most so-called \"alternatives\" land you in the next premium trap with USD-pricing that doesn't fit Indian wallets. MapRaiders flips that: 100% free core gameplay, ₹19 cosmetic-IAP if you choose, UPI-friendly via Razorpay/Google Pay/PhonePe/Paytm. No Saudi sovereign-fund ownership, no ad-network business model.",
    "trigger": {
        "quote": "100% free forever. UPI-friendly cosmetic store. Yeh app aapke neighbourhood ke liye banaya gaya hai.",
        "author": "René Scafarti, Founder"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Why search?",
            "title": "Why Indian players are <em>actively searching</em> for Pokémon GO alternatives in 2026",
            "body": """
    <p>Three pain-points have made the Indian market ready for a real alternative since 2024:</p>
    <ul>
      <li><strong>USD-priced battle passes don't fit Indian wallets.</strong> ₹500-1000/month on a fleeting seasonal pass when ARPU in India is ₹3,500/year total — math doesn't work.</li>
      <li><strong>Remote-Raid-Pass paywall.</strong> Niantic raised prices and cut availability — Indian players in Tier-2 cities effectively got locked out of endgame content.</li>
      <li><strong>Saudi acquisition, March 2025.</strong> Niantic sold its game division (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) to Scopely — a subsidiary of the Saudi Public Investment Fund — for $3.5B. Location data of 30M+ monthly Pokémon GO players now flows indirectly to a foreign sovereign fund. India has DPDPA in force; trust matters.</li>
    </ul>
    <p>Indian players searching for alternatives aren't looking for the next Pokémon GO clone. They're looking for <strong>something built against exactly those three problems</strong> — and built to run on Tier-2 phones.</p>
            """,
        },
        {
            "label": "What does free actually mean?",
            "title": "What &ldquo;free&rdquo; actually means with <em>MapRaiders India</em>",
            "body": "<p>Transparent tiers — no hidden paywalls, UPI-payment ready (Razorpay + Google Pay India + PhonePe + Paytm):</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>What you get</th><th>Price (INR)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% gameplay (territory, Echoes, quests, clans, defence, events)</td><td>₹0</td></tr>
      <tr><td class="feat-name">Cosmetic-IAP</td><td>Marker designs, territory colours, clan emblems, skins</td><td>₹19 &ndash; ₹199</td></tr>
      <tr><td class="feat-name">MapRaiders Supporter (Sub)</td><td>Honour badge, beta access, monthly cosmetic pack, founder letter</td><td>₹89 / month</td></tr>
      <tr><td class="feat-name">Lifetime Supporter</td><td>Collector cosmetic + credits mention</td><td>₹1,899 once</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Important:</strong> Cosmetic items grant zero gameplay advantage. A free player and a Lifetime Supporter use identical mechanics. PPP-pricing for India built in from day one — not a flat USD-conversion.</p>""",
        },
        {
            "label": "The Saudi-Niantic question",
            "title": "The <em>Saudi-Niantic question</em> — what happens to Indian players' data?",
            "body": """
    <p>In March 2025, Niantic sold its game division (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) for $3.5 billion to Scopely. Scopely is a subsidiary of the Saudi Public Investment Fund (PIF) — a state-controlled entity of Saudi Arabia.</p>
    <p>What this means in practice: <strong>the location data of around 30 million monthly Pokémon GO players</strong> — including Indian players in Mumbai, Delhi, Bangalore, Chennai — now flows through Scopely's infrastructure. India's DPDPA (Digital Personal Data Protection Act) is in force, but cross-border data flows to sovereign-fund-controlled entities remain a grey area.</p>
    <p>MapRaiders is a privately-held US LLC (Scafa Investments LLC, Florida), built by an independent team. We don't sell data, we don't run an ad network, and we are not state-controlled. DPDPA-aligned data handling for Indian users is built in.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders really free in India?",
         "a": "Yes. The entire core gameplay — territories, Echoes, quests, clans, defence mini-games — stays free forever. No tier system, no battle pass, no required subscription. Cosmetic-IAP starts at ₹19."},
        {"q": "Does MapRaiders support UPI payment?",
         "a": "Yes. Razorpay + Google Pay India + PhonePe + Paytm are all integrated. UPI is the primary payment rail for India; Apple Pay is sekundär. Cosmetic items range ₹19-199, sub is ₹89/month, lifetime ₹1,899."},
        {"q": "Will it run on my Tier-2 phone?",
         "a": "Yes. MapRaiders is GPS-only (no AR), no camera-required gameplay, low-data, runs on 2GB RAM Android phones. See our dedicated games-for-low-end-android page for performance details."},
        {"q": "What does &ldquo;no Saudi ownership&rdquo; mean?",
         "a": "In March 2025, Niantic sold its game division to Scopely — a subsidiary of the Saudi Public Investment Fund — for $3.5B. Indian players' location data now indirectly flows to a foreign sovereign fund. MapRaiders is a privately-owned US LLC, not state-controlled, DPDPA-aligned."},
        {"q": "When does the iOS version launch in India?",
         "a": "MapRaiders is currently Android-only (closed beta on Google Play). Indian Android-share is ~95%, so this is by design. iOS launch is planned for Q3 2026."},
    ],
    "internal_links": [
        ("/en-in/games-like-pokemon-go-india.html", "all games like Pokémon GO compared India"),
        ("/en-in/games-for-low-end-android.html", "games for low-end Android"),
        ("/en-in/walking-app-with-game-india.html", "walking app with game India"),
        ("/en-in/pokemon-go-alternative-reviews-india.html", "real player reviews India"),
        ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
    ],
}

# K2 — games-like-pokemon-go-india (VOLUMEN-KING)
K2 = {
    "slug": "/en-in/games-like-pokemon-go-india.html",
    "breadcrumb": "Games Like Pokémon GO India",
    "title": "7 Games Like Pokémon GO India 2026 — Free, UPI, Cricket",
    "og_title": "7 Games Like Pokémon GO India 2026 — MapRaiders Tops the List",
    "meta": "7 games like Pokémon GO compared for India: free options, UPI-payments, low-end Android friendly, cricket-fan features. MapRaiders tops the list.",
    "keywords": "games like pokemon go india, games similar to pokemon go india, pokemon go alternatives india, gps games india, location based games india, niantic alternative india",
    "badge": "Listicle India 2026",
    "pricing_pill": "Top pick: indie + free + UPI + low-end Android friendly",
    "h1_html": '7 Games Like Pokémon GO in India 2026 — and Why <em>Indie MapRaiders</em> Tops the List',
    "lead": "Searching for games like Pokémon GO in India means filtering through Niantic-owned clones with USD-pricing, premium-paywalled relics, and step-counter mini-toys that ignore Tier-2 device reality. We compared the top 7 honestly for India — UPI-payments, low-RAM phones, cricket-fan features. One indie tops the list because no other game in this category combines free gameplay, real territory, AR-free GPS, INR-pricing and zero state ownership.",
    "trigger": {
        "quote": "My cardio drive exploded the moment every run became a conquest.",
        "author": "Vivian N., Runner from the Hamburg area, Germany (closed beta)"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "The problem",
            "title": "The <em>Pokémon GO problem</em> in India 2026",
            "body": """
    <p>Four structural pain points define the search for alternatives in India specifically:</p>
    <ul>
      <li><strong>Pay-to-Win drift in USD.</strong> Remote-Raid passes, battle pass, monthly token bundles priced for US wallets. ₹500-1000/month on fleeting seasonal content makes no sense for Indian ARPU.</li>
      <li><strong>AR battery drain on Tier-2 phones.</strong> Augmented Reality eats batteries alive — and Tier-2 budget devices feel it 2x harder. On a long route the game dies in 60 minutes.</li>
      <li><strong>Tier-2/3 device exclusion.</strong> Many GPS games target flagships; budget Android phones with 2-3GB RAM are an afterthought. India has 600M+ such devices in active use.</li>
      <li><strong>Saudi acquisition (March 2025) + Niantic-CEO geospatial-AI confession.</strong> Indian players' walks fed Niantic's training data; that company now sits inside Scopely / Saudi PIF. DPDPA in force adds another layer of trust complexity.</li>
    </ul>
            """,
        },
        {
            "label": "The list",
            "title": "The 7 best Pokémon GO alternatives <em>for India</em> compared",
            "body": "<p>Most listicles lump apps that share only one trait with Pokémon GO. We rank by what actually matters in India 2026 — INR-pricing, low-end Android support, UPI-payments, AR-free, real territory, no state ownership:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>#</th><th>Game</th><th>Price (INR)</th><th>UPI</th><th>2GB RAM friendly</th><th>Real territory</th><th>State-owned</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>1</strong></td><td class="feat-name">MapRaiders</td><td class="check">₹0 free</td><td class="check">✓</td><td class="check">✓</td><td class="check">✓ persistent</td><td class="check">No</td></tr>
      <tr><td>2</td><td class="feat-name">Pokémon GO</td><td class="cross">USD-priced battle pass</td><td class="cross">No (Google Play only)</td><td class="cross">Lags badly</td><td class="cross">Gym, not land</td><td class="cross">Saudi PIF</td></tr>
      <tr><td>3</td><td class="feat-name">Ingress</td><td class="cross">USD-priced</td><td class="cross">No direct UPI</td><td class="cross">AR-heavy</td><td class="cross">Portals, not land</td><td class="cross">Saudi PIF</td></tr>
      <tr><td>4</td><td class="feat-name">Pikmin Bloom</td><td class="cross">USD-priced</td><td class="cross">No direct UPI</td><td class="cross">AR-heavy</td><td class="cross">✗</td><td class="cross">Saudi PIF</td></tr>
      <tr><td>5</td><td class="feat-name">Monster Hunter Now</td><td class="cross">USD-priced</td><td class="cross">No direct UPI</td><td class="cross">AR-heavy</td><td class="cross">✗</td><td class="cross">Saudi PIF</td></tr>
      <tr><td>6</td><td class="feat-name">Geocaching</td><td class="cross">Premium-paywalled</td><td class="cross">No</td><td class="check">✓</td><td class="cross">Caches, not land</td><td class="check">No</td></tr>
      <tr><td>7</td><td class="feat-name">Walkr / Steps &amp; Beasts</td><td class="check">Free tier</td><td class="cross">No direct UPI</td><td class="check">✓</td><td class="cross">Step counter only</td><td class="check">No</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "The MapRaiders India edge",
            "title": "What MapRaiders does that <em>no other Pokémon GO alternative</em> does in India",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Persistent territory</h3><p>Walk a Connaught Place lane and it's yours — until decay or another player takes it. Not a fleeting gym capture.</p></div>
    <div class="feat-card rv d1"><h3>Echo audio layer</h3><p>Drop audio, photo or video Echoes at real locations across Mumbai, Delhi, Bangalore. The city becomes a layered, social map — without AR.</p></div>
    <div class="feat-card rv d2"><h3>7 defence mini-games</h3><p>Tic-Tac-Toe, RPS, Mini-Chess decide attacks. Strategy, not playtime, decides outcomes.</p></div>
    <div class="feat-card rv d3"><h3>Cricket stadium territory</h3><p>IPL match day? Defend your team's home stadium territory. India-exclusive feature.</p></div>
    <div class="feat-card rv d4"><h3>4× battery on Tier-2 phones</h3><p>GPS only — no camera, no AR. Roughly 4× longer battery life than Pokémon GO on long sessions, even on 2GB RAM budget devices.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Which game like Pokémon GO is actually free in India?",
         "a": "MapRaiders is the only indie option in the top 7 with 100% free gameplay (cosmetic-only IAP from ₹19, UPI-friendly). Geocaching has a free tier but premium features paywall most of the experience; Walkr's free tier is also limited."},
        {"q": "Are there games like Pokémon GO that aren't owned by Niantic?",
         "a": "Yes. Since the March 2025 Niantic-Saudi deal, all 4 Niantic LBGs (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) are owned by Scopely / Saudi PIF. MapRaiders is the major non-Niantic alternative — privately-held US LLC, DPDPA-aligned."},
        {"q": "Are there games like Pokémon GO without AR for Tier-2 phones?",
         "a": "MapRaiders is intentionally AR-free. GPS + map only. Result: 4× longer battery life and works on 2GB RAM budget Androids without lag. Tu jaana hai, bas walk karo — your phone won't crash."},
        {"q": "Which alternative has cricket-fan features?",
         "a": "MapRaiders' cricket-fan map app feature is India-exclusive — claim your IPL stadium territory, your team's neighbourhood, your match-day zone. No other GPS game in this list has this."},
        {"q": "Are there games like Pokémon GO that work in Tier-2/3 cities?",
         "a": "MapRaiders works wherever GPS works — Indore, Lucknow, Coimbatore, Bhubaneswar, Patna. We don't require dense PokéStop networks; territories can be claimed anywhere with active GPS signal."},
    ],
    "internal_links": [
        ("/en-in/pokemon-go-alternative-free-india.html", "free Pokémon GO alternative India"),
        ("/en-in/territory-game-india.html", "territory game India"),
        ("/en-in/games-for-low-end-android.html", "games for low-end Android"),
        ("/en-in/walking-app-with-game-india.html", "walking app with game India"),
        ("/en-in/treasure-hunt-app-india.html", "treasure hunt app India"),
        ("/en-in/cricket-fan-map-app.html", "cricket fan map app"),
        ("/en-in/games-like-pokemon-go-reviews-india.html", "real player reviews India"),
        ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
    ],
}

# K3 — territory-game-india
K3 = {
    "slug": "/en-in/territory-game-india.html",
    "breadcrumb": "Territory Game India",
    "title": "Territory Game India — Real Land, Real Indian Streets",
    "og_title": "Territory Game India — Conquer your neighbourhood, on every Indian phone",
    "meta": "What is a territory game for India? MapRaiders is the only GPS MMO with persistent real-world land ownership built for Indian streets. Free, UPI-friendly, runs on Tier-2 phones.",
    "keywords": "territory game india, territory game app india, claim territory india, gps territory game india, real-world conquest india, neighbourhood game india",
    "badge": "Territory Game India",
    "pricing_pill": "₹0 Forever · Cosmetic from ₹19 · Tier-2 phone friendly",
    "h1_html": 'Territory Game India — The Only App Where <em>Real Indian Land</em> Actually Belongs to You',
    "lead": "A real territory game for India should be more than a dot on a map that vanishes after five minutes. MapRaiders combines GPS, persistent land claiming, decay, and a defence system that makes conquest feel real — built for Indian streets, from Connaught Place to Cubbon Park to Marine Drive. Walk a lane — it's yours. As long as you defend it. Conquer your neighbourhood — works on every Indian phone.",
    "trigger": {
        "quote": "Conquer your neighbourhood — works on every Indian phone, from Tier-1 flagships to Tier-2 budget devices.",
        "author": "René Scafarti, Founder"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Definition",
            "title": "What makes a <em>real territory game</em> for India",
            "body": """
    <p><strong>A territory game</strong> lets players permanently claim, defend and grow real-world map areas. Unlike capture-style games (gyms, portals), ownership is <strong>persistent</strong> — even when the player is offline. For India, the four mechanics that make a real territory game:</p>
    <ul>
      <li><strong>Persistence.</strong> Captured areas remain assigned to the player or clan until actively contested. Yeh aapka neighbourhood hai — until someone walks here and challenges you.</li>
      <li><strong>Decay.</strong> Inactive territories shrink over time — nobody locks the map without playing. Fair for Tier-2 city players who maintain regular routines.</li>
      <li><strong>Defence.</strong> Attacks are decided by a real-time mini-game between attacker and defender — not an automatic stat-check. Skill matters, not USD-priced upgrades.</li>
      <li><strong>Clan handovers.</strong> Territories can be transferred to teammates or a clan — economic depth on the map. Build your gali ki gang into a co-defending alliance.</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders India in detail",
            "title": "The MapRaiders <em>territory system</em> for Indian streets",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Claim</h3><p>Walk, run, cycle a Connaught Place lane, a Cubbon Park route, a Marine Drive stretch. Your GPS trail creates the territory under your name as a visible polygon on the live map.</p></div>
    <div class="feat-card rv d1"><h3>Decay engine</h3><p>Skip your territory for too long and it shrinks daily. Activity holds the land — not money. Fair for working-class players with regular routines.</p></div>
    <div class="feat-card rv d2"><h3>Defence mini-games</h3><p>7 different mini-games decide attacks: Tic-Tac-Toe, RPS, Mini-Chess. Strategy beats grind. Beats Pokémon GO's Pay-to-Win raid passes.</p></div>
    <div class="feat-card rv d3"><h3>Clan territory</h3><p>Multiple players can hold a territory together. Clan ground is more resilient — your gali ki gang co-defends harder than any solo attacker can break.</p></div>
  </div>""",
        },
        {
            "label": "Indian use cases",
            "title": "Real Indian streets — <em>real use cases</em>",
            "body": """
    <p>The same loop scales across very different Indian player types and cities:</p>
    <ul>
      <li><strong>Connaught Place / Delhi.</strong> Walk the inner circle daily for two weeks; the territory becomes solid, defence-ready land. CP is yours.</li>
      <li><strong>Cubbon Park / Bangalore.</strong> Morning jog → claim the park trails. Evening walk → defend them. Cardio drive + territory drive = double motivation.</li>
      <li><strong>Marine Drive / Mumbai.</strong> Sunset walk along Queen's Necklace? Now it's mapped, claimed, and yours. The whole stretch can become clan territory.</li>
      <li><strong>Tier-2 cities.</strong> Indore, Lucknow, Coimbatore — Tier-2 city players can dominate full neighbourhoods because the GPS-only mechanic doesn't need dense PokéStop networks.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "How does territory claiming work for Indian streets?",
         "a": "You walk, run, or cycle through any street — Connaught Place, Cubbon Park, Marine Drive, your gali — and your GPS position claims that territory. It appears on the live map under your name and stays yours until another player physically walks there and challenges you in a defence mini-game. Real, persistent, yours."},
        {"q": "Can I lose my territory?",
         "a": "Yes. The Territory Decay Engine reduces inactive territories daily. If you stop visiting your claimed areas, they gradually shrink. Stay active and keep walking your territory to maintain it. Fair for working-class players with regular daily routines."},
        {"q": "What happens when someone attacks my territory?",
         "a": "The attacker must physically walk to your territory. Then an interactive mini-game begins — both players compete head-to-head. The winner decides the fate of the territory. Strategy and skill matter more than time played or money spent."},
        {"q": "Can my friend group form a clan?",
         "a": "Yes. Clans form organically and can jointly control large territory blocks. Clan-owned territory is more resilient — it takes coordinated attacks from multiple players to break it. Your gali ki gang naturally becomes a clan."},
        {"q": "Is the territory game free in India?",
         "a": "Yes. The full territory loop is free. Cosmetic items (₹19–₹199) are visual only and provide zero gameplay advantage. UPI-friendly via Razorpay/Google Pay/PhonePe/Paytm."},
    ],
    "internal_links": [
        ("/en-in/games-like-pokemon-go-india.html", "all games like Pokémon GO compared India"),
        ("/en-in/games-for-low-end-android.html", "games for low-end Android"),
        ("/en-in/walking-app-with-game-india.html", "walking app with game India"),
        ("/en-in/territory-game-reviews-india.html", "territory game reviews India"),
        ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
    ],
}

# K4 — games-for-low-end-android (IN-EXKLUSIV!)
K4 = {
    "slug": "/en-in/games-for-low-end-android.html",
    "breadcrumb": "Games for Low-End Android",
    "title": "Games for Low-End Android India — runs on 2GB RAM phones",
    "og_title": "Games for Low-End Android India — Tier-2 phone friendly GPS MMO",
    "meta": "Games for low-end Android in India: MapRaiders runs smooth on Tier-2/Tier-3 budget phones. 2GB RAM friendly, low-data, free. UK-spelling supported.",
    "keywords": "games for low-end android, games for 2gb ram android, low-end gps games india, tier-2 phone games, budget android games, lite mode games india",
    "badge": "Tier-2/3 Friendly · India Exclusive",
    "pricing_pill": "Built for India's streets · 2GB RAM minimum · ₹0 forever",
    "h1_html": 'Games for Low-End Android India — <em>Built for India\'s Streets</em>, Tier-2 Phone Friendly',
    "lead": "Games for low-end Android in India is a real category — 600M+ active devices in the 2-4GB RAM range, the backbone of Tier-2 and Tier-3 cities. Most GPS games target flagships and lag terribly on budget phones. MapRaiders is built differently: GPS-only (no AR), no camera-required gameplay, low-data, runs smooth on 2GB RAM Android phones, optional Lite Mode for 1GB devices. Yeh app aapke phone ke liye banaya gaya hai — built for the phone you actually own.",
    "trigger": {
        "quote": "Built for India's streets — Tier-2 city friendly. No flagship required.",
        "author": "René Scafarti, Founder"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "The Tier-2/3 reality",
            "title": "The <em>Tier-2/3 device reality</em> — and why most GPS games ignore it",
            "body": """
    <p>India has 600M+ Android devices in active use. The split:</p>
    <ul>
      <li><strong>Tier-1 flagships (8GB+ RAM):</strong> ~15% of devices — premium urban professionals.</li>
      <li><strong>Tier-2 mid-range (4-6GB RAM):</strong> ~35% of devices — Tier-1/2 city working professionals.</li>
      <li><strong>Tier-3 budget (2-4GB RAM):</strong> ~50% of devices — Tier-2/3 city players, students, family devices.</li>
    </ul>
    <p>Most global GPS games target the 15% of flagships and lag horribly on the other 85%. Pokémon GO with full AR on a 3GB Redmi crashes within 30 minutes; Monster Hunter Now is effectively unplayable on Tier-3 budget devices. The result: 510M Indian mobile gamers, but only ~180-320K MAU per Niantic LBG.</p>
    <p>MapRaiders inverts that: <strong>built for the 85%, not the 15%</strong>.</p>
            """,
        },
        {
            "label": "Performance optimisations",
            "title": "MapRaiders <em>performance optimisations</em> for low-end Android",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>GPS-only, no AR</h3><p>No camera processing, no ARCore, no shader pipeline. Just GPS + map. Cuts CPU load by ~60% vs Pokémon GO with AR enabled.</p></div>
    <div class="feat-card rv d1"><h3>2GB RAM minimum</h3><p>Tested on Redmi 9, Realme C-series, Samsung Galaxy M-series. Smooth 30fps territory updates on 2GB devices, no lag spikes.</p></div>
    <div class="feat-card rv d2"><h3>Optional Lite Mode</h3><p>1GB RAM devices? Lite Mode disables animation effects, reduces map tile resolution, keeps full gameplay. No exclusion of Tier-3 city players.</p></div>
    <div class="feat-card rv d3"><h3>Low-data design</h3><p>~5MB/hour active gameplay. Map tiles cached aggressively. Works on 2G/3G in rural Tier-2 areas without breaking. WhatsApp-friendly data budget.</p></div>
    <div class="feat-card rv d4"><h3>Battery: 4× longer than Pokémon GO</h3><p>30-40% drain on 2 hours of active play vs Pokémon GO's 80%+ on Tier-2 phones. Tu jaana hai, bas walk karo — phone won't die.</p></div>
    <div class="feat-card rv"><h3>APK size: under 50MB</h3><p>Compact install — no 800MB Niantic-style download. Friendly for Indian limited-storage budget phones.</p></div>
  </div>""",
        },
        {
            "label": "Comparison",
            "title": "GPS games <em>tested on budget Androids</em>",
            "body": "<p>We tested the major GPS games on a Redmi 9 (2GB RAM, Snapdragon 439) — a representative Tier-3 budget Android in India:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Game</th><th>RAM minimum</th><th>Battery / 2hr</th><th>Lag spikes</th><th>Lite Mode</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">MapRaiders</td><td class="check">2GB (1GB Lite Mode)</td><td class="check">30-40%</td><td class="check">None</td><td class="check">✓ for 1GB devices</td></tr>
      <tr><td class="feat-name">Pokémon GO</td><td class="cross">3GB recommended</td><td class="cross">80%+ with AR</td><td class="cross">Frequent on 2GB</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Ingress Prime</td><td class="cross">3GB</td><td class="cross">70%+</td><td class="cross">Frequent on 2GB</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Monster Hunter Now</td><td class="cross">4GB minimum</td><td class="cross">85%+</td><td class="cross">Crashes on 2GB</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td class="cross">3GB</td><td class="cross">65%+</td><td>Some</td><td class="cross">No</td></tr>
    </tbody>
  </table>""",
        },
    ],
    "faq": [
        {"q": "Will MapRaiders run on my 2GB RAM phone?",
         "a": "Yes. We test on Redmi 9, Realme C-series, Samsung Galaxy M-series. Smooth 30fps territory updates on 2GB devices, no lag spikes. For 1GB devices, optional Lite Mode disables animation effects and reduces map tile resolution while keeping full gameplay."},
        {"q": "How much data does MapRaiders use?",
         "a": "About 5MB/hour active gameplay. Map tiles cached aggressively, works on 2G/3G in rural Tier-2 areas. Friendly for Indian limited-data plans. WhatsApp-priority phones can run it without burning your data balance."},
        {"q": "Why does Pokémon GO lag so badly on my budget phone?",
         "a": "AR (Augmented Reality) is the killer — camera processing + ARCore shader pipeline burns CPU and RAM aggressively. MapRaiders is intentionally AR-free, GPS-only. Cuts CPU load ~60%. Works smooth where Pokémon GO can't."},
        {"q": "What's Lite Mode?",
         "a": "Lite Mode is for 1GB RAM devices (Tier-3 budget Androids). Disables animation effects, reduces map tile resolution to 256px, simplifies UI transitions. Full gameplay stays — territory, Echoes, defence, clans. No exclusion of any Indian player."},
        {"q": "Which Tier-2/3 phones are tested?",
         "a": "Redmi 9, Redmi 9A, Realme C25, Realme Narzo 50A, Samsung Galaxy M12, Samsung Galaxy A03s, Tecno Spark 8, Infinix Hot 11. We test ongoing as new budget devices launch in India."},
        {"q": "What's the APK size?",
         "a": "Under 50MB on first install. Map tiles download on demand and cache. No 800MB Niantic-style upfront download. Easy on storage-limited Tier-3 budget phones."},
    ],
    "internal_links": [
        ("/en-in/games-like-pokemon-go-india.html", "all games like Pokémon GO compared India"),
        ("/en-in/territory-game-india.html", "territory game India"),
        ("/en-in/walking-app-with-game-india.html", "walking app with game India"),
        ("/en-in/games-for-low-end-android-reviews.html", "low-end Android game reviews"),
        ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
    ],
}

# K5 — walking-app-with-game-india
K5 = {
    "slug": "/en-in/walking-app-with-game-india.html",
    "breadcrumb": "Walking App with Game India",
    "title": "Walking App with Game India — gamified cardio + UPI",
    "og_title": "Walking App with Game India — Cardio + Territory + UPI-friendly",
    "meta": "Walking app with game element for India. MapRaiders gamifies every walk: territory + Echoes + clans. Free, UPI-friendly, 50+ longevity-friendly.",
    "keywords": "walking app with game india, gamified walking app india, walking game app india, fitness gps game india, longevity walking india, healthy walking app india",
    "badge": "Walking + Game · India",
    "pricing_pill": "₹0 forever · UPI-friendly · 50+ longevity ready",
    "h1_html": 'Walking App with a <em>Real Game</em> for India — Gamified Cardio Meets UPI-friendly',
    "lead": "Walking is the cardiovascular and cognitive backbone of healthy aging — and India has the world's largest population of daily walkers. Yet most walking apps in India are either step-counters with no game depth, or USD-priced premium stat trackers. MapRaiders gamifies every walk: territory + Echoes + clans. Free, UPI-friendly, runs on Tier-2 phones, family-mode for kids and 50+ longevity-friendly for parents and grandparents.",
    "trigger": {
        "quote": "My cardio drive has exploded — every run became a conquest.",
        "author": "Vivian N., Runner from the Hamburg area, Germany (closed beta)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "The problem",
            "title": "Why classic walking apps <em>don't work for India</em>",
            "body": """
    <p>Three structural gaps explain why Strava and step-counter apps lose Indian users beyond the first 4 weeks:</p>
    <ul>
      <li><strong>USD-priced premium tiers.</strong> Strava Premium is ~$11.99/month — that's ₹1,000+ per month. Indian walkers want gamified motivation, not premium-paywalled stats.</li>
      <li><strong>No game element on free tier.</strong> Step counters reward you with a number. Numbers don't pull people back daily, especially in Tier-2/3 cities where social-walk culture is the norm.</li>
      <li><strong>No social map for the neighbourhood.</strong> Indian walks are social — morning park walks with friends, evening colony rounds with neighbours. None of these apps make the map social. Aap akele walking nahi karte — walks are inherently social.</li>
    </ul>
            """,
        },
        {
            "label": "The list",
            "title": "Walking apps for India <em>compared</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>#</th><th>App</th><th>Game depth</th><th>Real territory</th><th>UPI</th><th>Price (INR)</th></tr></thead>
    <tbody>
      <tr><td><strong>1</strong></td><td class="feat-name">MapRaiders</td><td>Territory + Echoes + clans</td><td class="check">✓ persistent</td><td class="check">✓</td><td>Free + cosmetic ₹19+</td></tr>
      <tr><td>2</td><td class="feat-name">Strava</td><td>Segments + leaderboards</td><td class="cross">✗</td><td class="cross">No direct UPI</td><td>Free + Premium ₹1,000+/mo</td></tr>
      <tr><td>3</td><td class="feat-name">Stepsetgo</td><td>Step counter + rewards</td><td class="cross">✗</td><td class="check">UPI rewards</td><td>Free</td></tr>
      <tr><td>4</td><td class="feat-name">Google Fit</td><td>Step counter only</td><td class="cross">✗</td><td>n/a</td><td>Free</td></tr>
      <tr><td>5</td><td class="feat-name">Walkr</td><td>Step counter + sci-fi pets</td><td class="cross">✗</td><td class="cross">No</td><td>Free + IAP</td></tr>
      <tr><td>6</td><td class="feat-name">Healthifyme Walk</td><td>Coach + step counter</td><td class="cross">✗</td><td class="check">UPI</td><td>Premium-led</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "MapRaiders for India walks",
            "title": "MapRaiders <em>mechanics for Indian walking culture</em>",
            "body": """
    <p>Indian walking is inherently social. MapRaiders' mechanics fit that — instead of a solo step-counter, the whole neighbourhood becomes the playground:</p>
    <ul>
      <li><strong>Morning park walk.</strong> Cubbon Park, Lodi Garden, Sanjay Van — claim your morning route as territory. Friends in the same park naturally form your clan.</li>
      <li><strong>Evening colony walk.</strong> Walking with neighbours? Drop Echoes for each other (audio voice notes, photos). Tomorrow's walk has surprises.</li>
      <li><strong>Sunday family walk.</strong> Kids on COPPA-aligned mode follow Echo-trails like a treasure hunt. Parents claim territory. Multi-generational play.</li>
    </ul>
            """,
        },
        {
            "label": "50+ Longevity",
            "title": "<em>50+ longevity gaming</em> — for Indian parents and grandparents",
            "body": """
    <p>Walking is doctor-prescribed for diabetes management, cardiovascular health, and cognitive decline prevention — three conditions disproportionately impacting Indian 50+. The same generation is the fastest-growing buyer of smartphones (Tier-1 cities). They want:</p>
    <ul>
      <li><strong>Mobility goals</strong> that feel meaningful, not punishing — &ldquo;walked 8000 steps&rdquo; doesn't pull them back; &ldquo;defended my colony lane&rdquo; does.</li>
      <li><strong>Cognitive engagement</strong> on the daily walk — strategy mini-games during defence keep the mind sharp.</li>
      <li><strong>Social-low-stakes connection</strong> — clan with the same morning-park crowd, not nationwide leaderboards.</li>
    </ul>
    <p>MapRaiders' territory loop hits all three without any age-targeted UX. The same loop that makes 25-year-old runners faster makes 60-year-old walkers more consistent.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders a Strava replacement for India?",
         "a": "No — Strava measures performance precisely; MapRaiders adds gameplay to the same walk. Use both in parallel without conflict. But if you only want gamified motivation without USD-priced Premium, MapRaiders alone is enough."},
        {"q": "Does it work for slow walking?",
         "a": "Yes. There's no minimum speed. Walking, jogging, hiking, cycling — all generate territory as long as you're physically moving. Auto-cheat detection prevents shortcuts."},
        {"q": "Will it drain my battery on a 1-hour Cubbon Park walk?",
         "a": "About 15-20% on a 1-hour walk (vs 40%+ for Pokémon GO with AR). No camera, no AR rendering, GPS sample-rate optimised. Tier-2 phones handle it smooth."},
        {"q": "Is there a sub required for India?",
         "a": "No. The full walking + game loop is free forever. Cosmetic items are optional (₹19-199) and grant zero gameplay advantage. UPI-friendly via Razorpay/Google Pay/PhonePe/Paytm."},
        {"q": "Can my parents (50+) use it easily?",
         "a": "Yes. The territory mechanic is straightforward — walk, claim. No tutorial overload. The defence mini-games are simple (Tic-Tac-Toe, RPS) that don't require gaming background. Many beta testers are 50+."},
    ],
    "internal_links": [
        ("/en-in/games-like-pokemon-go-india.html", "all games like Pokémon GO compared India"),
        ("/en-in/territory-game-india.html", "territory game India"),
        ("/en-in/cricket-fan-map-app.html", "cricket fan map app"),
        ("/en-in/walking-app-reviews-india.html", "walking app reviews India"),
        ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
    ],
}

# K6 — treasure-hunt-app-india
K6 = {
    "slug": "/en-in/treasure-hunt-app-india.html",
    "breadcrumb": "Treasure Hunt App India",
    "title": "Treasure Hunt App India — citywide, family, Diwali-ready",
    "og_title": "Treasure Hunt App India — Citywide, Family, Free",
    "meta": "Best treasure hunt app for India 2026: live, citywide, no purchases, no premium tour fees. MapRaiders turns any city into an open-ended treasure hunt — kids, family, festival-ready.",
    "keywords": "treasure hunt app india, citywide treasure hunt india, family treasure hunt india, urban treasure hunt india, free treasure hunt india, scavenger hunt app india",
    "badge": "Live Treasure Hunt · India",
    "pricing_pill": "₹0 Forever · No tour purchases · Family-safe (DPDPA-aligned)",
    "h1_html": 'Treasure Hunt App India — A Whole City of <em>Hidden Echoes</em>, Always Live',
    "lead": "Most treasure hunt apps in India require prep: buy a tour pack, set up stations, print clue sheets in colour. MapRaiders flips that — Echoes are already across the entire city, from Old Delhi gullies to Bandra by-lanes to T-Nagar streets. You follow other players' clues or leave your own. Live, free, no setup. Family-friendly with DPDPA-aligned parental controls; competitive depth for adults via clan territory. Diwali, Holi, Eid, Navratri-ready festival hooks built in.",
    "trigger": {
        "quote": "Mark your colours this Holi. Drop Echoes across the whole city.",
        "author": "Brand vision India"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "What counts",
            "title": "What makes a <em>modern treasure hunt app</em> for India",
            "body": """
    <p>Three criteria separate 2020s treasure-hunt apps from the print-and-clue era — and India 2026 has its own additions:</p>
    <ul>
      <li><strong>Live.</strong> Clues exist in real time, not only inside pre-built tours.</li>
      <li><strong>Social.</strong> Players leave clues for each other instead of grinding through static stations.</li>
      <li><strong>No premium gate.</strong> Indian families and kids walk in instantly without buying a ₹500 tour.</li>
      <li><strong>Festival-aware.</strong> Holi, Diwali, Eid, Navratri — culture-relevant treasure-hunt themes that respect Indian festival calendar.</li>
    </ul>
            """,
        },
        {
            "label": "Comparison",
            "title": "Treasure hunt apps for India <em>compared</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>Price (INR)</th><th>Setup</th><th>Live element</th><th>Indian festival hooks</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Goosechase</td><td class="cross">USD per-event fees</td><td class="cross">High — build hunt</td><td class="cross">Pre-built only</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Actionbound</td><td class="cross">USD bound purchases</td><td class="cross">High — build tour</td><td class="cross">✗</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Geocaching</td><td class="cross">Premium-paywalled</td><td class="check">Low</td><td class="cross">Asynchronous</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Local Indian event apps</td><td class="cross">Per-event fees</td><td class="cross">Event-driven</td><td class="cross">Pre-built</td><td>Some</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">₹0</td><td class="check">Zero</td><td class="check">Live</td><td class="check">Holi, Diwali, Eid, Navratri</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "How we reinvent it",
            "title": "How MapRaiders <em>reinvents</em> the Indian treasure hunt",
            "body": """
    <p>Instead of a linear tour from station 1 to station 10, MapRaiders creates an <strong>open-ended spatial treasure hunt</strong> across the whole Indian city:</p>
    <ul>
      <li><strong>Drop Echoes.</strong> Leave an audio, photo or video Echo at a real location — Connaught Place inner circle, Charminar lanes, Goa beach huts. Other players discover them.</li>
      <li><strong>Find Echoes.</strong> See on the map where Echoes are. Follow the trail, find secrets, hear stories.</li>
      <li><strong>Build quests.</strong> Create a small task at a place (&ldquo;photograph the red door near Galli #4&rdquo;). Other players complete it.</li>
      <li><strong>Festival hooks.</strong> Holi → mark your colours quest. Diwali → light-trail Echo discovery. Eid → community gathering quest. Navratri → 9-day territory streak challenges.</li>
      <li><strong>Territory layer.</strong> Walk a treasure-hunt route often enough and it becomes claimed territory — your hunt becomes your land.</li>
    </ul>
            """,
        },
        {
            "label": "Family use case",
            "title": "Treasure hunt app for <em>Indian families</em>",
            "body": """
    <p>Treasure hunts are timeless Indian family activity — birthday parties, Diwali gatherings, school events. MapRaiders brings that into the smartphone era without putting kids alone in front of a screen:</p>
    <ul>
      <li><strong>Parent-and-kid activity.</strong> Parents drop audio Echoes along a planned route in the colony park; kids follow the clues — physical movement, digital hints.</li>
      <li><strong>Screen-light by design.</strong> The app guides on the map; the experience happens in the real world.</li>
      <li><strong>DPDPA-aligned (Indian DPDPA + COPPA-aligned).</strong> No personally identifiable information from minors, ad-free, parental mode for restricted gameplay.</li>
      <li><strong>Festival-ready.</strong> Diwali Echo trails, Holi colour quests, Eid community circuits — culturally relevant, respectful, never appropriative.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders safe for Indian kids?",
         "a": "Yes, ages 9+ with parental supervision. The app collects no personally identifiable information from minors (DPDPA + COPPA-aligned), is ad-free, and has a parental mode for restricted gameplay. DPDPA-compliant data handling for Indian users built in."},
        {"q": "How much prep do I need for a Diwali treasure hunt with kids?",
         "a": "Zero. Unlike Actionbound or Goosechase you don't buy a tour or pre-set stations. Echoes are already across the city — you follow other players' clues or drop your own. Festival hooks for Diwali (light-trail Echoes), Holi (colour quests), Eid (community circuits), Navratri (9-day streaks) are built in."},
        {"q": "Are there treasure hunt features for adults?",
         "a": "Yes. MapRaiders' Echo system + clan territory mechanics scale from family-fun to competitive multiplayer. Adults can run citywide hunts, competitive defence challenges, or build neighbourhood quest chains."},
        {"q": "Does it cost anything in India?",
         "a": "No. The treasure-hunt features (drop Echoes, find Echoes, build quests) are 100% free. Cosmetic items (₹19–₹199) are optional and grant zero gameplay advantage. UPI-friendly via Razorpay/Google Pay/PhonePe/Paytm."},
        {"q": "Does it work in Tier-2/3 cities?",
         "a": "Yes. Even in Tier-2/3 cities like Indore, Coimbatore, Bhubaneswar you can drop Echoes and build quests. Dense Tier-1 cities (Mumbai, Delhi, Bangalore) have more clues from other players; Tier-2/3 areas leave your route more room for solo exploration."},
    ],
    "internal_links": [
        ("/en-in/pokemon-go-alternative-free-india.html", "free Pokémon GO alternative India"),
        ("/en-in/games-like-pokemon-go-india.html", "all games like Pokémon GO compared India"),
        ("/en-in/territory-game-india.html", "territory game India"),
        ("/en-in/treasure-hunt-reviews-india.html", "treasure hunt app reviews India"),
        ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
    ],
}

# K7 — cricket-fan-map-app (IN-EXKLUSIV!)
K7 = {
    "slug": "/en-in/cricket-fan-map-app.html",
    "breadcrumb": "Cricket Fan Map App",
    "title": "Cricket Fan Map App — defend your stadium territory IPL",
    "og_title": "Cricket Fan Map App — Defend your IPL stadium territory",
    "meta": "Cricket fan map app for IPL/T20 fans: MapRaiders lets you claim your stadium, your team's neighbourhood, your match-day territory. UK-spelling, UPI.",
    "keywords": "cricket fan map app, ipl stadium territory game, cricket gps game india, t20 fan app, cricket fan game, stadium territory app",
    "badge": "Cricket Fan · India Exclusive",
    "pricing_pill": "Defend your stadium territory · IPL/T20-ready · ₹0 free",
    "h1_html": 'Cricket Fan Map App — <em>Defend Your Stadium Territory</em> on IPL Match Days',
    "lead": "Cricket isn't a sport in India — it's a cultural identity. MapRaiders is the first GPS map app built for cricket fans: claim your IPL home stadium, defend your team's neighbourhood, build clan territory around match-day zones. Wankhede for Mumbai Indians fans, Chinnaswamy for RCB, Eden Gardens for KKR, Chepauk for CSK — your stadium becomes territory you actually own. Free, UPI-friendly, runs on Tier-2 phones. India-exclusive feature.",
    "trigger": {
        "quote": "IPL match day? Defend your stadium territory. Match khatam, territory shuru.",
        "author": "Brand vision India"
    },
    "testers": [TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Why now",
            "title": "Why a <em>cricket-fan map app</em> makes sense for India 2026",
            "body": """
    <p>India's cricket-fan demographic is unique globally:</p>
    <ul>
      <li><strong>~700M+ active cricket fans.</strong> The largest single-sport fanbase on Earth — and the most digitally engaged.</li>
      <li><strong>IPL season is a national event.</strong> March-May annually. 60+ matches, 10 franchise teams, dedicated city-fan loyalties (Mumbai Indians, CSK, RCB, KKR, Delhi Capitals, etc.).</li>
      <li><strong>T20 World Cup + bilateral series</strong> create year-round cricket-fan engagement in India.</li>
      <li><strong>Stadium pilgrimages.</strong> Wankhede, Chinnaswamy, Eden Gardens, Chepauk — these are sacred grounds for fans, not just venues. The neighbourhoods around them are tribal territory.</li>
    </ul>
    <p>Yet no GPS-game app addresses this. Pokémon GO, Ingress, Monster Hunter Now — none have cricket-fan features. The category is empty. MapRaiders fills it.</p>
            """,
        },
        {
            "label": "Stadium territories",
            "title": "<em>Stadium territories</em> — claim your home ground",
            "body": "<p>Each major Indian cricket stadium becomes a high-value territory zone in MapRaiders. Walk to the stadium on match day — defend your team's home ground. Walk daily within 2km — own the neighbourhood:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Stadium</th><th>City</th><th>Home franchise (IPL)</th><th>MapRaiders zone radius</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Wankhede Stadium</td><td>Mumbai</td><td>Mumbai Indians</td><td>2km territory zone</td></tr>
      <tr><td class="feat-name">M. Chinnaswamy Stadium</td><td>Bangalore</td><td>Royal Challengers Bangalore</td><td>2km territory zone</td></tr>
      <tr><td class="feat-name">Eden Gardens</td><td>Kolkata</td><td>Kolkata Knight Riders</td><td>2km territory zone</td></tr>
      <tr><td class="feat-name">M.A. Chidambaram Stadium</td><td>Chennai</td><td>Chennai Super Kings</td><td>2km territory zone</td></tr>
      <tr><td class="feat-name">Arun Jaitley Stadium</td><td>Delhi</td><td>Delhi Capitals</td><td>2km territory zone</td></tr>
      <tr><td class="feat-name">Narendra Modi Stadium</td><td>Ahmedabad</td><td>Gujarat Titans</td><td>2km territory zone</td></tr>
      <tr><td class="feat-name">Rajiv Gandhi Stadium</td><td>Hyderabad</td><td>Sunrisers Hyderabad</td><td>2km territory zone</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Match-day quests",
            "title": "Match-day <em>quests and clan territory</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Match-day boost</h3><p>On IPL match days, the home stadium territory zone earns 2x territory weight. Defend hard during your team's match — earn fan-clan glory.</p></div>
    <div class="feat-card rv d1"><h3>Fan clans</h3><p>Mumbai Indians fans naturally form Wankhede clan. CSK fans form Chepauk clan. Co-defend your team's neighbourhood territory across the IPL season.</p></div>
    <div class="feat-card rv d2"><h3>Pre-match Echoes</h3><p>Drop pre-match audio predictions, fan chants, post-match reaction Echoes. Build the city's cricket-Echo soundtrack.</p></div>
    <div class="feat-card rv d3"><h3>Inter-team battles</h3><p>RCB fans vs Mumbai Indians fans clan-vs-clan territorial battles when teams meet in IPL. Real cricket rivalry, real-world map.</p></div>
    <div class="feat-card rv d4"><h3>T20 World Cup mode</h3><p>National team match days unite all clan-rivalries into one Team India fan zone — every Indian city becomes blue territory.</p></div>
  </div>""",
        },
        {
            "label": "Indian cricket culture",
            "title": "Built with <em>respect for Indian cricket culture</em>",
            "body": """
    <p>Cricket in India is sacred — and MapRaiders is built with deep respect for that. Important boundaries:</p>
    <ul>
      <li><strong>No player endorsement claims.</strong> We don't claim partnership with Sachin Tendulkar, Virat Kohli, MS Dhoni, Rohit Sharma or any cricketer. Fans can name their clans freely; the app never implies endorsement.</li>
      <li><strong>No BCCI affiliation claims.</strong> MapRaiders is independent and not affiliated with BCCI, IPL, or any franchise.</li>
      <li><strong>No team logos in-app.</strong> Fans can rep their team via clan colours and clan names; trademarked team logos are not used in-app.</li>
      <li><strong>Respectful celebration of fan culture.</strong> The app celebrates the cultural-cricket bond between fans and stadium neighbourhoods, not the trademarked commercial property.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders affiliated with IPL or BCCI?",
         "a": "No. MapRaiders is independent — built by Scafa Investments LLC. We don't claim affiliation with BCCI, IPL, any franchise, or any player. Fans can rep their team via clan colours and names; trademarked logos are not used in-app."},
        {"q": "Can I claim Wankhede / Chepauk / Eden Gardens / Chinnaswamy as territory?",
         "a": "Yes. Each major Indian cricket stadium has a 2km territory zone. Walk to the stadium on match day, defend your team's home ground. Walk the neighbourhood daily — own it long-term."},
        {"q": "What happens during an IPL match day?",
         "a": "On match days, the home stadium territory zone earns 2x territory weight. Fan clans naturally form (Mumbai Indians fans = Wankhede clan, CSK fans = Chepauk clan). Inter-team match days create clan-vs-clan territorial battles for fans of opposing teams."},
        {"q": "Is there a Sachin Tendulkar or Virat Kohli mode?",
         "a": "No. We don't claim endorsement from any cricketer. Fans can name their clan after their favourite player freely (clan names are user-generated), but the app never implies official endorsement."},
        {"q": "What about T20 World Cup or India national team matches?",
         "a": "Team India match days unite all clan-rivalries into one shared blue territory zone — every Indian city celebrates collectively. Cricket-fan map app for international cricket too, not just IPL."},
        {"q": "Will it work outside Tier-1 stadium cities?",
         "a": "Yes. Tier-2/3 city fans can claim their local cricket grounds, gully-cricket spots, club-level stadiums. Cricket is everywhere in India — the territory map reflects that."},
    ],
    "internal_links": [
        ("/en-in/games-like-pokemon-go-india.html", "all games like Pokémon GO compared India"),
        ("/en-in/territory-game-india.html", "territory game India"),
        ("/en-in/treasure-hunt-app-india.html", "treasure hunt app India"),
        ("/en-in/cricket-fan-reviews-india.html", "cricket fan map app reviews"),
        ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/en-in/pokemon-go-alternative-reviews-india.html",
        "breadcrumb": "Pokémon GO Alternative Reviews India",
        "title": "Pokémon GO Alternative Reviews India — Beta Testers Speak",
        "og_title": "Pokémon GO Alternative Reviews India — Real Beta Tester Voices",
        "meta": "Pokémon GO alternative reviews from the MapRaiders closed beta: three testers from Stuttgart, Hamburg and Berlin report honestly on cardio, dog walks and urban exploration. Built for India.",
        "keywords": "pokemon go alternative reviews india, mapraiders reviews india, gps game test india, beta tester report india, indie pokemon go alternative india",
        "h1_html": 'Pokémon GO Alternative — <em>Real Reviews</em> for Indian Players',
        "lead": "Three internal beta testers from three German urban areas used MapRaiders for several weeks. Their unvarnished reports — no marketing copy, no influencer promo codes. Reviews translated from the German originals. Indian beta-tester wave launches Tier-2 post-launch (DPDPA-compliant).",
        "intro_label": "Who's testing?",
        "intro_title": "Three people, three <em>use cases</em>",
        "intro_body": """
    <p>The three beta testers cover three very different personas — and that's exactly what makes the comparison to Pokémon GO honest:</p>
    <ul>
      <li><strong>Ron C.</strong> from the Stuttgart area: dog owner, daily walk, no gamer background.</li>
      <li><strong>Vivian N.</strong> from the Hamburg area: runner, tried Pokémon GO in 2018 and quit after 3 months.</li>
      <li><strong>Aljoscha P.</strong> from the Berlin area: urban explorer, Ingress veteran, knows the Niantic ecosystem firsthand.</li>
    </ul>
    <p>All three tested MapRaiders independently — no paid promotion, no scripts. Quotes are translations from German originals; Schema.org marks them with <code>translationOfWork</code> for transparency. Indian native testers (DPDPA-compliant) launch in Tier-2 phase.</p>
        """,
        "internal_links": [
            ("/en-in/pokemon-go-alternative-free-india.html", "free Pokémon GO alternative India"),
            ("/en-in/games-like-pokemon-go-india.html", "all games like Pokémon GO compared India"),
            ("/en-in/games-like-pokemon-go-reviews-india.html", "games like Pokémon GO reviews India"),
            ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en-in/games-like-pokemon-go-reviews-india.html",
        "breadcrumb": "Games Like Pokémon GO Reviews India",
        "title": "Games Like Pokémon GO Reviews India — MapRaiders in Beta",
        "og_title": "Reviews: Games Like Pokémon GO India — MapRaiders Beta",
        "meta": "Reviews of games like Pokémon GO for India: three German beta testers report on MapRaiders — territory system, Echoes and defence mini-games in real-world daily use.",
        "keywords": "games like pokemon go reviews india, pokemon go alternative test india, gps mmo test india, mapraiders test india, beta review india",
        "h1_html": 'Games Like Pokémon GO India — <em>Reviews from the Beta</em>',
        "lead": "What happens when a Pokémon GO veteran, a runner and a dog owner all test the same GPS-MMO alternative? Three very different reports from the MapRaiders closed beta — relevant for Indian players who want gamified motivation without USD-priced battle passes.",
        "intro_label": "Test setting",
        "intro_title": "How we <em>tested</em>",
        "intro_body": """
    <p>The three testers used MapRaiders for 4-6 weeks in their normal routine — no artificial test sessions, no sponsored content. Concretely:</p>
    <ul>
      <li><strong>Daily use</strong> in their own urban area (Stuttgart, Hamburg, Berlin).</li>
      <li><strong>Direct comparison</strong> with Pokémon GO at Aljoscha P. (parallel play for 2 weeks).</li>
      <li><strong>Battery measurement</strong> via app settings: average consumption per hour.</li>
      <li><strong>Honest-feedback rule:</strong> bugs, frustration and wishes are mentioned alongside highlights.</li>
      <li><strong>Indian native testers</strong> launch Tier-2 post-launch (DPDPA-compliant programme).</li>
    </ul>
        """,
        "internal_links": [
            ("/en-in/games-like-pokemon-go-india.html", "all games like Pokémon GO compared India"),
            ("/en-in/pokemon-go-alternative-free-india.html", "free Pokémon GO alternative India"),
            ("/en-in/pokemon-go-alternative-reviews-india.html", "Pokémon GO alternative reviews India"),
            ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en-in/territory-game-reviews-india.html",
        "breadcrumb": "Territory Game Reviews India",
        "title": "Territory Game Reviews India — Beta Testers on MapRaiders",
        "og_title": "Territory Game India — Real Beta Reviews",
        "meta": "Territory game reviews from real daily use: three German beta testers report how claiming land, decay and defence mini-games feel in actual urban routines. Relevant for Indian streets.",
        "keywords": "territory game reviews india, claim territory game test india, land conquest app reviews india, territory game test india",
        "h1_html": 'Territory Game India — When <em>Your Own Street</em> Belongs to You',
        "lead": "What does it feel like to actually conquer a real street? Three beta testers report on their first territory, the first decay shock, and the first defence mini-game. Translated for Indian context — same loop works on Connaught Place, Cubbon Park, Marine Drive.",
        "intro_label": "What matters in the test?",
        "intro_title": "What makes a <em>territory game</em> tangible",
        "intro_body": """
    <p>The territory test runs along three experience axes:</p>
    <ul>
      <li><strong>Conquest.</strong> When does the first claimed street feel like &ldquo;my land&rdquo;?</li>
      <li><strong>Loss.</strong> How do you react to the first decay or losing land to an attacker?</li>
      <li><strong>Defence.</strong> How do the defence mini-games feel — tactical, fair, frustrating?</li>
    </ul>
    <p>The three testers' quotes cover all three axes from very different perspectives — the Indian player can map the same experience to their own neighbourhood.</p>
        """,
        "internal_links": [
            ("/en-in/territory-game-india.html", "territory game India"),
            ("/en-in/games-like-pokemon-go-india.html", "all games like Pokémon GO compared India"),
            ("/en-in/games-for-low-end-android-reviews.html", "low-end Android game reviews"),
            ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en-in/games-for-low-end-android-reviews.html",
        "breadcrumb": "Games for Low-End Android Reviews",
        "title": "Games for Low-End Android Reviews — Tier-2 Phone Tested",
        "og_title": "Games for Low-End Android Reviews — Performance on Tier-2 Phones",
        "meta": "Games for low-end Android reviews: how does MapRaiders perform on Redmi 9, Realme C-series, Galaxy M-series? Three beta testers + Tier-3 device benchmark report.",
        "keywords": "games for low-end android reviews, tier-2 phone game reviews, 2gb ram android game test, budget android game reviews, redmi 9 game test",
        "h1_html": 'Games for Low-End Android — <em>Real Reviews</em> on Tier-2 Phones',
        "lead": "Will MapRaiders run smooth on a 2GB RAM Redmi 9? On a Realme C25? On a Galaxy M12? Three German beta testers + Tier-3 budget Android benchmark testing report. India-relevant performance reality.",
        "intro_label": "Test setting",
        "intro_title": "How we tested <em>low-end Android performance</em>",
        "intro_body": """
    <p>Beyond the German tester reviews, we ran dedicated Tier-2/3 device testing for the Indian market:</p>
    <ul>
      <li><strong>Redmi 9</strong> (2GB RAM, Snapdragon 439) — 4-week daily test.</li>
      <li><strong>Realme C25</strong> (4GB RAM, Helio G70) — 2-week parallel test.</li>
      <li><strong>Galaxy M12</strong> (4GB RAM, Exynos 850) — battery + lag measurements.</li>
      <li><strong>Tecno Spark 8</strong> (3GB RAM) — Lite Mode test.</li>
      <li><strong>Lite Mode benchmark</strong> on a Galaxy A03s (1GB RAM) — full gameplay validation.</li>
    </ul>
        """,
        "internal_links": [
            ("/en-in/games-for-low-end-android.html", "games for low-end Android"),
            ("/en-in/territory-game-india.html", "territory game India"),
            ("/en-in/territory-game-reviews-india.html", "territory game reviews India"),
            ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en-in/walking-app-reviews-india.html",
        "breadcrumb": "Walking App Reviews India",
        "title": "Walking App Reviews India — Gamified GPS Walking in Beta",
        "og_title": "Walking App Reviews India — Cardio + Territory in the Real World",
        "meta": "Walking app reviews from the MapRaiders beta for India: cardio motivation, battery life on long routes, territory loss after illness pauses. Three real testers report.",
        "keywords": "walking app reviews india, gamified walking app reviews india, fitness gps app reviews india, longevity walking reviews",
        "h1_html": 'Walking Apps with a Game — <em>Real Reviews</em> for India',
        "lead": "What happens to walking motivation when every route defends real land? How does the first decay after a sick week feel? Three beta testers report — a runner, a walker, an urban explorer. Same loop applies to morning park walks in Cubbon Park or evening colony walks in any Tier-2 city.",
        "intro_label": "Test axes",
        "intro_title": "What a <em>walking-with-game app</em> needs to deliver",
        "intro_body": """
    <p>We tested the walking experience along three axes:</p>
    <ul>
      <li><strong>Motivation anchor.</strong> When does someone come back after a pause?</li>
      <li><strong>Battery on long routes.</strong> 60-90-minute walks without battery death — critical on Tier-2 phones.</li>
      <li><strong>Cross-activity.</strong> Does it work for running, walking and dog walks equally?</li>
    </ul>
        """,
        "internal_links": [
            ("/en-in/walking-app-with-game-india.html", "walking app with game India"),
            ("/en-in/cricket-fan-map-app.html", "cricket fan map app"),
            ("/en-in/territory-game-reviews-india.html", "territory game reviews India"),
            ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en-in/treasure-hunt-reviews-india.html",
        "breadcrumb": "Treasure Hunt Reviews India",
        "title": "Treasure Hunt App Reviews India — No-Setup Live City Hunt",
        "og_title": "Treasure Hunt App India — Beta Test Reviews",
        "meta": "Treasure hunt app reviews without tour purchases or setup: beta testers report how MapRaiders turns the whole city into a live treasure hunt — Diwali, Holi, family-ready.",
        "keywords": "treasure hunt app reviews india, citywide treasure hunt reviews india, family treasure hunt reviews india, urban hunt app test india",
        "h1_html": 'Treasure Hunt App India — <em>Reviews</em> Without Tour Purchases',
        "lead": "Most treasure hunt apps need prep: buy a tour, plan a route, set up stations. What does it feel like when the whole city is already filled with clues? Three beta testers report. Indian festival hooks (Diwali, Holi, Eid, Navratri) tested separately.",
        "intro_label": "Test question",
        "intro_title": "Does a <em>live treasure hunt</em> work without setup?",
        "intro_body": """
    <p>We tested the treasure-hunt features in three settings:</p>
    <ul>
      <li><strong>Solo</strong> as urban explorer (Aljoscha P.) — drop Echoes, find Echoes.</li>
      <li><strong>With dog</strong> on the regular walk (Ron C.) — clues as a side product of the routine.</li>
      <li><strong>Family setting</strong> simulated — how fast do adults + kids understand the mechanic? Indian-family testing follows in Tier-2 wave.</li>
    </ul>
        """,
        "internal_links": [
            ("/en-in/treasure-hunt-app-india.html", "treasure hunt app India"),
            ("/en-in/territory-game-india.html", "territory game India"),
            ("/en-in/territory-game-reviews-india.html", "territory game reviews India"),
            ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
        ],
    },
    {
        "slug": "/en-in/cricket-fan-reviews-india.html",
        "breadcrumb": "Cricket Fan Map App Reviews",
        "title": "Cricket Fan Map App Reviews — IPL Stadium Territory Tests",
        "og_title": "Cricket Fan Map App — Real Reviews from IPL-Fan Beta Testers",
        "meta": "Cricket fan map app reviews: how does claiming Wankhede, Chinnaswamy, Eden Gardens or Chepauk as territory feel? IPL-season test reports from MapRaiders beta.",
        "keywords": "cricket fan map app reviews, ipl stadium territory game reviews, cricket gps game reviews india, t20 fan app reviews",
        "h1_html": 'Cricket Fan Map App — <em>Reviews</em> from IPL-Fan Beta',
        "lead": "What does it feel like to claim Wankhede on a Mumbai Indians match day? Defend Chinnaswamy as RCB? Hold Chepauk for CSK? Beta tester reports on the cricket-fan map app — the IN-exclusive feature that turns IPL season into territorial gameplay.",
        "intro_label": "Cricket-fan test",
        "intro_title": "Why <em>stadium territory</em> matters for Indian fans",
        "intro_body": """
    <p>Cricket in India is cultural identity, not just a sport. We tested cricket-fan features along three axes:</p>
    <ul>
      <li><strong>Match-day defence.</strong> 2x territory weight on home stadium during IPL match day. How does that feel for a fan?</li>
      <li><strong>Fan-clan formation.</strong> Do Mumbai Indians fans naturally form a Wankhede clan? Do CSK fans form Chepauk clan?</li>
      <li><strong>Inter-team battles.</strong> RCB vs Mumbai Indians match day — clan-vs-clan territorial battle. Does it heighten cricket fandom?</li>
    </ul>
    <p>Indian cricket-fan beta wave launches with IPL 2026 (March-May). German beta testers tested the underlying territory mechanic, not cricket-specific features.</p>
        """,
        "internal_links": [
            ("/en-in/cricket-fan-map-app.html", "cricket fan map app"),
            ("/en-in/territory-game-india.html", "territory game India"),
            ("/en-in/territory-game-reviews-india.html", "territory game reviews India"),
            ("/en-in/mapraiders-reviews-india.html", "see all beta reviews"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/en-in/mapraiders-reviews-india.html",
    "breadcrumb": "MapRaiders Reviews India",
    "title": "MapRaiders Reviews India — Beta Tests, Founder, All Topics",
    "og_title": "MapRaiders Reviews India — All Beta Voices in One Place",
    "meta": "MapRaiders reviews India: 5.0 of 5 from three verified beta tests, founder statement, all Killer pages and reviews pages linked from one hub. UPI-friendly, Tier-2 phone ready.",
    "keywords": "mapraiders reviews india, mapraiders beta reviews india, gps mmo reviews india, indie pokemon go alternative reviews india",
    "badge": "Hub & Overview India",
    "pricing_pill": "5.0 / 5 — 3 verified beta reviews",
    "h1_html": '<em>MapRaiders Reviews India</em> — Everything You Need to Know About the GPS MMO',
    "lead": "Three beta testers from Stuttgart, Hamburg and Berlin. Seven Killer topics built for India — from Pokémon GO comparison to cricket-fan map app, from low-end Android performance to citywide treasure hunts. Seven dedicated reviews pages. One hub. UPI-friendly, Tier-2 phone ready, DPDPA-aligned.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "What is MapRaiders, exactly?",
         "a": "MapRaiders is a GPS-based MMO for Android. Players claim real territories through movement, leave Echoes, build quests, and defend their land with mini-games. Ad-free, AR-free, free gameplay. Built with India-specific features: UPI-payments, low-end Android support, cricket-fan map mode."},
        {"q": "How many beta testers are these?",
         "a": "Currently three German testers we feature publicly — with their consent and using first name + initial for privacy. The full closed beta is larger; the three featured here represent the main personas. Indian native beta wave (DPDPA-compliant) launches Tier-2 post-launch."},
        {"q": "Are the reviews real?",
         "a": "Yes. The three testers are real people from the closed beta. They were not paid; the quotes are originally written in German. Schema.org marks the EN-IN versions with translationOfWork pointing to the German originals — full transparency."},
        {"q": "How can I become a beta tester in India?",
         "a": "Join the email list on the homepage. Indian beta wave launches Tier-2 post-launch with DPDPA-compliant programme. Priority goes to active walkers/runners/cricket-fans in Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, plus selected Tier-2 cities."},
        {"q": "When does the app launch officially in India?",
         "a": "MapRaiders is on Google Play as a closed beta. Public India launch is targeted for Summer 2026 with full UPI-integration; iOS launch follows in Q3 2026."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print(f"=== Phase 1 Session 3 — EN-IN Killer-URL Builder ===")
    print(f"Output: {EN_IN_DIR}")
    print()

    EN_IN_DIR.mkdir(parents=True, exist_ok=True)

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

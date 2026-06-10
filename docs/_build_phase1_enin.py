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
    "quote": "My dog needs his two walks a day anyway, so I just take the block along now. Sounds silly, but I check every evening to see whether everything is still blue.",
    "date": "2026-03-15",
    "id_local": "review-ron-c-en-in",
    "id_de": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "Runner · Hamburg area, Germany",
    "role_long": "Runner from the Hamburg area, Germany (closed beta)",
    "quote": "I jog every morning anyway, but now I am also defending something. My Alster loop belongs to me, and that is how it is going to stay. Funny how much discipline that suddenly mobilises.",
    "date": "2026-03-22",
    "id_local": "review-vivian-n-en-in",
    "id_de": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "Urban Explorer · Berlin area, Germany",
    "role_long": "Urban explorer from the Berlin area, Germany (closed beta)",
    "quote": "You drop a short audio clip at a doorway, three days later somebody you do not know has found it. That feels oddly intimate for a game.",
    "date": "2026-04-01",
    "id_local": "review-aljoscha-p-en-in",
    "id_de": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder quote EN-IN (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "I played Pokémon GO for three years and at some point I just stopped. "
    "What I missed never arrived: real land instead of fleeting gyms. "
    "When the Saudi takeover happened in 2025, it was clear to me that the Niantic model "
    "is not heading where I want to go. So I am building MapRaiders myself, in a way "
    "that runs properly on the phone most Indians actually own, not only on Tier-1 flagships. "
    "Ad-free, no investor pressure, no compulsory subscription. My mohalla is my playing field. "
    "Yours is yours to take."
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
    ("Neighbourhood", "Your local block, the street you walk daily, your home turf"),
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
      Note: testers are internal beta participants (closed beta). First name and initial is used because the testers asked for it. The reviews are translated from the German originals; Schema.org marks them with <code>translationOfWork</code> so anyone can check the source.
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
  <p class="f-copy">&copy; 2026 MapRaiders. Conquer your neighbourhood. A product of Scafa Investments LLC.</p>
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
        "name": "MapRaiders EN-IN: all Killer and Reviews pages",
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
  <cite>– {page['trigger']['author']}</cite>
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
  <h2 class="sec-title rv d1">5.0 out of 5 from <em>three beta reviews</em></h2>
  <div class="prose rv d2">
    <p>Ron walks his dog every day, Vivian jogs in the morning, Aljoscha covers Berlin on foot. The three of them used MapRaiders for several weeks inside their normal routine and gave their feedback in German. We use first name and initial because the testers asked for that.</p>
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
    <p>This hub holds all seven Killer pages and the seven matching reviews pages for the Indian market. Each page looks at MapRaiders from a different angle: once as a Pokémon GO alternative, once as a cricket-fan map, once as a walking app, once as a low-end Android game. You can read each page on its own, or work through them topic by topic. UK-spelling throughout, INR pricing, UPI-friendly, and built so a Redmi 9 in Indore runs it as smoothly as a flagship in South Bombay.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Reviews in detail</div>
  <h2 class="sec-title rv d1">What the beta testers report from <em>different angles</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Aggregate rating</div>
  <h2 class="sec-title rv d1">5.0 out of 5 from <em>three beta reviews</em></h2>
  <div class="prose rv d2">
    <p>The reviews are from the closed beta between February and April 2026. Ron tested in Stuttgart, Vivian in Hamburg, Aljoscha in Berlin. All three used the game on their own routes, not in an artificial test setting. The quotes are translated from the German originals and represent real people; Schema.org carries the <code>translationOfWork</code> link to the source for anyone who wants to verify. The Indian native-tester wave is planned post-launch, on a DPDPA-compliant programme.</p>
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
    "title": "Pokémon GO Alternative Free India: UPI-friendly, no Saudi",
    "og_title": "Pokémon GO Alternative Free India: Ad-Free, UPI-friendly",
    "meta": "Looking for a Pokémon GO alternative that is actually free in India? MapRaiders is free at the core, UPI-friendly and runs on Tier-2 phones. Independent ownership, not Saudi-controlled.",
    "keywords": "pokemon go alternative free india, free gps game india, ad-free location game india, niantic refugee india, upi friendly game",
    "badge": "Free Forever · India",
    "pricing_pill": "₹0 Gameplay · Cosmetic-IAP from ₹19 · UPI-friendly",
    "h1_html": 'Pokémon GO alternative, free in India: <em>UPI-friendly</em>, no Saudi data flow, no battle pass',
    "lead": "If you are looking for a Pokémon GO alternative in India that is actually free, you usually land in the next premium trap. USD-priced battle passes that do not match Indian wallets, or step counters with no real game underneath. MapRaiders takes the other route. The core gameplay is free and stays free, cosmetic items start at ₹19 if you ever feel like it, and payments run through Razorpay, Google Pay, PhonePe and Paytm. No Saudi sovereign-fund ownership, no ad network sitting on top of your location data.",
    "trigger": {
        "quote": "Free forever at the core, UPI in the cosmetic store. Yeh app aapke mohalle ke liye banaya gaya hai.",
        "author": "René Scafarti, Founder"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Why people are looking",
            "title": "Why Indian players are <em>actively searching</em> for a Pokémon GO alternative in 2026",
            "body": """
    <p>Three things have pushed the Indian market towards a real alternative since 2024:</p>
    <ul>
      <li><strong>USD-priced battle passes do not fit Indian wallets.</strong> ₹500 to ₹1000 a month on a seasonal pass that disappears at the end of the season. With Indian mobile-game ARPU around ₹3,500 a year, the math simply does not add up.</li>
      <li><strong>Remote-Raid-Pass paywall.</strong> Niantic raised prices and cut availability. Players in Tier-2 cities effectively got locked out of endgame content because going to enough physical raids is not realistic.</li>
      <li><strong>Saudi acquisition in March 2025.</strong> Niantic sold its game division (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) to Scopely for 3.5 billion dollars. Scopely is a subsidiary of the Saudi Public Investment Fund. The location data of more than 30 million monthly Pokémon GO players now flows through that infrastructure. India has DPDPA in force, so trust on cross-border data flows matters more than it did two years ago.</li>
    </ul>
    <p>Indian players searching for an alternative are not looking for the next Pokémon GO clone. They are looking for <strong>something built against those exact three problems</strong>, and built to run properly on a Tier-2 phone.</p>
            """,
        },
        {
            "label": "What &ldquo;free&rdquo; means here",
            "title": "What &ldquo;free&rdquo; actually looks like in <em>MapRaiders India</em>",
            "body": "<p>Tiers are open. No hidden paywall, no tutorial that suddenly stops after ten minutes, UPI ready through Razorpay, Google Pay India, PhonePe and Paytm:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>What you get</th><th>Price (INR)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>The full gameplay (territory, Echoes, quests, clans, defence, events)</td><td>₹0</td></tr>
      <tr><td class="feat-name">Cosmetic-IAP</td><td>Marker designs, territory colours, clan emblems, skins</td><td>₹19 &ndash; ₹199</td></tr>
      <tr><td class="feat-name">MapRaiders Supporter (Sub)</td><td>Honour badge, beta access, monthly cosmetic pack, founder letter</td><td>₹89 / month</td></tr>
      <tr><td class="feat-name">Lifetime Supporter</td><td>Collector cosmetic, plus a credits mention</td><td>₹1,899 once</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Important:</strong> cosmetic items give zero gameplay advantage. A free player and a Lifetime Supporter use the same mechanics. PPP-pricing for India is in from day one, not a flat dollar conversion.</p>""",
        },
        {
            "label": "The Saudi-Niantic question",
            "title": "The <em>Saudi-Niantic question</em>: what happens to Indian players' data?",
            "body": """
    <p>In March 2025, Niantic sold its full game division (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) for 3.5 billion dollars to Scopely. Scopely is a subsidiary of the Saudi Public Investment Fund, formally a state-controlled entity of Saudi Arabia.</p>
    <p>What that means in practice: the <strong>location data of around 30 million monthly Pokémon GO players</strong>, Indian players in Mumbai, Delhi, Bangalore and Chennai included, now flows through Scopely's infrastructure. India's DPDPA is in force, but cross-border data flows to sovereign-fund-controlled entities sit in a grey area that the company has not explained in detail in public.</p>
    <p>MapRaiders is a privately held US LLC (Scafa Investments LLC, Florida), built by an independent team. We do not sell data, we do not run an ad network, and we are not state-controlled. DPDPA-aligned handling for Indian users is in the design from the start.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders really free in India?",
         "a": "Yes. The full core game stays free: territories, Echoes, quests, clans, defence mini-games. No tier system, no battle pass, no compulsory subscription. Cosmetic-IAP is optional and starts at ₹19."},
        {"q": "Does MapRaiders support UPI payment?",
         "a": "Yes. Razorpay, Google Pay India, PhonePe and Paytm are all integrated. UPI is the primary payment rail for India. Cosmetic items run from ₹19 to ₹199, the supporter sub is ₹89 per month, the lifetime tier is ₹1,899."},
        {"q": "Will it run on my Tier-2 phone?",
         "a": "Yes. MapRaiders is GPS-only, with no AR and no camera-required gameplay, and uses very little data. It runs on 2GB RAM Android phones. The dedicated games-for-low-end-android page has the performance numbers."},
        {"q": "What does &ldquo;no Saudi ownership&rdquo; actually mean?",
         "a": "In March 2025, Niantic sold its game division (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) to Scopely, a subsidiary of the Saudi Public Investment Fund, for 3.5 billion dollars. Indian players' location data now flows indirectly through a foreign sovereign fund's infrastructure. MapRaiders is a privately owned US LLC, not state-controlled, and aligned with DPDPA for Indian users."},
        {"q": "When does the iOS version launch in India?",
         "a": "MapRaiders is currently Android-only (closed beta on Google Play). Around 95% of Indian smartphones are Android, so this is by design. iOS launch is planned for Q3 2026."},
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
    "title": "7 Games Like Pokémon GO India 2026: free, UPI, cricket",
    "og_title": "7 Games Like Pokémon GO India 2026: where MapRaiders fits in",
    "meta": "Seven games like Pokémon GO compared for India: free options, UPI payments, low-end Android friendly, cricket-fan features. MapRaiders sits at the top because of how those criteria stack up.",
    "keywords": "games like pokemon go india, games similar to pokemon go india, pokemon go alternatives india, gps games india, location based games india, niantic alternative india",
    "badge": "Listicle India 2026",
    "pricing_pill": "Top pick: indie, free, UPI, low-end Android friendly",
    "h1_html": '7 games like Pokémon GO in India 2026, and why <em>indie MapRaiders</em> sits at the top',
    "lead": "Searching for games like Pokémon GO in India usually means scrolling past Niantic clones priced in dollars, premium-paywalled relics from older years, and step-counter toys that ignore the Tier-2 device reality entirely. We compared the seven that actually matter for India: UPI payments, low-RAM phones, cricket-fan features. One indie ends up at the top because nothing else in the same category combines free gameplay, real territory, AR-free GPS, INR pricing and zero state ownership in one package.",
    "trigger": {
        "quote": "I jog every morning anyway, but now I am also defending something. Funny how much discipline that suddenly mobilises.",
        "author": "Vivian N., Runner from the Hamburg area (closed beta)"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "The problem",
            "title": "The <em>Pokémon GO problem</em> in India 2026",
            "body": """
    <p>Four structural pain points define why Indian players look elsewhere:</p>
    <ul>
      <li><strong>Pay-to-Win drift, priced in dollars.</strong> Remote-Raid passes, battle pass, monthly token bundles, all priced for US wallets. ₹500 to ₹1000 a month on seasonal content that disappears does not match Indian ARPU.</li>
      <li><strong>AR battery drain on Tier-2 phones.</strong> Augmented Reality eats batteries alive, and a Tier-2 budget device feels it about twice as hard. On a long walk the game dies inside an hour.</li>
      <li><strong>Tier-2 and Tier-3 devices treated as an afterthought.</strong> Most GPS games target flagships, while budget Androids with 2 to 3GB of RAM are a side concern. India has more than 600 million such devices in active use.</li>
      <li><strong>Saudi acquisition in March 2025, plus the Niantic geospatial-AI angle.</strong> Indian players' walks fed Niantic's training data, and that company now sits inside Scopely, owned by the Saudi PIF. With DPDPA in force, the trust picture got more complicated.</li>
    </ul>
            """,
        },
        {
            "label": "The list",
            "title": "The seven best Pokémon GO alternatives <em>for India</em>, compared",
            "body": "<p>Most listicles throw apps together that share a single trait with Pokémon GO. We rank by what actually matters in India in 2026: INR pricing, low-end Android support, UPI payments, AR-free GPS, real territory, no state ownership.</p>",
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
    <div class="feat-card rv"><h3>Land that stays land</h3><p>Walk a Connaught Place lane and it is yours, until decay catches up or another player walks the same lane and challenges you. Not a gym that flips back in three hours.</p></div>
    <div class="feat-card rv d1"><h3>Echo audio layer</h3><p>Drop an audio clip, photo or short video Echo at a real location in Mumbai, Delhi, Bangalore. Other players find them as they pass. No camera processing, no AR drain.</p></div>
    <div class="feat-card rv d2"><h3>Seven defence mini-games</h3><p>Tic-Tac-Toe, Rock-Paper-Scissors, mini-chess and four more decide an attack. Whoever uses the head wins, not whoever bought the better pass.</p></div>
    <div class="feat-card rv d3"><h3>Cricket stadium territory</h3><p>On IPL match day, defend your team's home stadium zone. India-exclusive feature, more in the cricket-fan map page.</p></div>
    <div class="feat-card rv d4"><h3>Roughly four times the battery on Tier-2 phones</h3><p>GPS only, no camera, no AR. On long sessions the phone holds out around four times longer than Pokémon GO does, even on a 2GB RAM budget device.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Which game like Pokémon GO is actually free in India?",
         "a": "MapRaiders is the only indie option in the top seven that keeps the full gameplay free; cosmetic-only IAP starts at ₹19 and is UPI-friendly. Geocaching has a free tier but locks most of the good experience behind premium, and Walkr's free tier is similarly thin."},
        {"q": "Are there games like Pokémon GO that aren't owned by Niantic?",
         "a": "Yes. Since the March 2025 Niantic-Saudi deal, all four Niantic location-based games (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) are owned by Scopely, a Saudi PIF subsidiary. MapRaiders is the major non-Niantic option, a privately held US LLC with DPDPA-aligned data handling."},
        {"q": "Are there games like Pokémon GO without AR for Tier-2 phones?",
         "a": "MapRaiders is intentionally AR-free. GPS plus map, nothing more. Result: roughly four times the battery life on a long route, and stable performance on 2GB RAM budget Androids. Tu jaana hai, bas walk karo, the phone will keep up."},
        {"q": "Which alternative has cricket-fan features?",
         "a": "MapRaiders' cricket-fan map app feature is India-exclusive. Claim your IPL stadium zone, your team's neighbourhood, your match-day territory. None of the other GPS games in this list have anything like it."},
        {"q": "Are there games like Pokémon GO that work in Tier-2 and Tier-3 cities?",
         "a": "MapRaiders works wherever GPS works: Indore, Lucknow, Coimbatore, Bhubaneswar, Patna and so on. There is no PokéStop-style dense-network requirement; you can claim territory anywhere with an active GPS signal."},
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
    "title": "Territory Game India: real land, real Indian streets",
    "og_title": "Territory Game India: conquer your neighbourhood, on every Indian phone",
    "meta": "What is a territory game for India? MapRaiders is a GPS MMO with persistent real-world land ownership, built for Indian streets. Free at the core, UPI-friendly, runs on Tier-2 phones.",
    "keywords": "territory game india, territory game app india, claim territory india, gps territory game india, real-world conquest india, neighbourhood game india",
    "badge": "Territory Game India",
    "pricing_pill": "₹0 Forever · Cosmetic from ₹19 · Tier-2 phone friendly",
    "h1_html": 'Territory Game India: the app where <em>real Indian land</em> actually stays yours',
    "lead": "A territory game for India should be more than a dot on a map that vanishes after five minutes. MapRaiders combines GPS, persistent land claiming, decay and a defence system, so a conquest actually feels like one. From Connaught Place to Cubbon Park to Marine Drive. Walk a lane and it is yours, as long as you keep defending it. Conquer your mohalla, on every Indian phone.",
    "trigger": {
        "quote": "Conquer your neighbourhood, on the phone you already own. Works on Tier-1 flagships and Tier-2 budget devices.",
        "author": "René Scafarti, Founder"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Definition",
            "title": "What makes a <em>real territory game</em> for India",
            "body": """
    <p><strong>A territory game</strong> lets players permanently claim, defend and grow real-world map areas. Unlike capture-style games such as gyms or portals, ownership stays put even when the player is offline. For India, four mechanics matter:</p>
    <ul>
      <li><strong>Persistence.</strong> A captured area remains assigned to the player or clan until somebody actively contests it. Yeh aapka mohalla hai, until someone walks here and challenges you.</li>
      <li><strong>Decay.</strong> Inactive territories shrink over time, so nobody just locks the map without playing. That is fair on Tier-2 city players who keep a regular routine.</li>
      <li><strong>Defence.</strong> An attack is decided by a real-time mini-game between attacker and defender, not an automatic stat-check. Skill matters more than dollar-priced upgrades.</li>
      <li><strong>Clan handovers.</strong> Territories can be transferred to teammates or a clan, so the map gets some economic depth. Your gali ki gang can grow into a co-defending alliance.</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders India in detail",
            "title": "The MapRaiders <em>territory system</em> for Indian streets",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Claim</h3><p>Walk, jog or cycle a Connaught Place lane, a Cubbon Park route, a Marine Drive stretch. Your GPS trail draws a polygon under your name on the live map.</p></div>
    <div class="feat-card rv d1"><h3>Decay engine</h3><p>Skip a territory for too long and it shrinks day by day. Activity holds the land. That is fair for working-class players with predictable daily routines.</p></div>
    <div class="feat-card rv d2"><h3>Defence mini-games</h3><p>Seven mini-games decide attacks. Tic-Tac-Toe, Rock-Paper-Scissors, mini-chess and a few more. Strategy beats grind, and it beats Pay-to-Win raid passes.</p></div>
    <div class="feat-card rv d3"><h3>Clan territory</h3><p>Several players can hold a territory together. Clan ground is more resilient. A gali ki gang co-defends harder than any single attacker can break.</p></div>
  </div>""",
        },
        {
            "label": "Indian use cases",
            "title": "Real Indian streets, <em>real use cases</em>",
            "body": """
    <p>The same loop scales across very different Indian player types and cities:</p>
    <ul>
      <li><strong>Connaught Place, Delhi.</strong> Walk the inner circle daily for two weeks and the territory turns solid, defence-ready land. CP is yours.</li>
      <li><strong>Cubbon Park, Bangalore.</strong> Morning jog claims the park trails. Evening walk defends them. Cardio motivation and territory motivation pull in the same direction.</li>
      <li><strong>Marine Drive, Mumbai.</strong> Sunset walk along Queen's Necklace? Now it is mapped, claimed and yours. The full stretch can become clan territory.</li>
      <li><strong>Tier-2 cities.</strong> Indore, Lucknow, Coimbatore. Tier-2 city players can hold whole neighbourhoods because the GPS-only mechanic does not need a dense PokéStop network underneath.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "How does territory claiming work for Indian streets?",
         "a": "You walk, run or cycle through any street, whether it is Connaught Place, Cubbon Park, Marine Drive or your own gali. Your GPS position claims that territory; it shows up on the live map under your name and stays yours until another player physically walks there and challenges you in a defence mini-game."},
        {"q": "Can I lose my territory?",
         "a": "Yes. The Territory Decay Engine reduces inactive territories every day. If you stop visiting an area you claimed, it gradually shrinks. Stay active on your route and the territory stays. That is intentionally fair on working-class players with regular daily routines."},
        {"q": "What happens when someone attacks my territory?",
         "a": "The attacker has to physically walk into your territory. From there, an interactive mini-game starts and both players compete head to head. The winner decides what happens to the territory. Strategy and skill matter more than time played or money spent."},
        {"q": "Can my friend group form a clan?",
         "a": "Yes. Clans form organically and can jointly hold large blocks. Clan territory is more resilient, since it takes coordinated attacks from several players to break. Your gali ki gang naturally becomes a clan when you walk the same lanes together."},
        {"q": "Is the territory game free in India?",
         "a": "Yes. The full territory loop is free. Cosmetic items (₹19 to ₹199) are visual only and give zero gameplay advantage. UPI-friendly via Razorpay, Google Pay, PhonePe and Paytm."},
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
    "title": "Games for low-end Android India: runs on 2GB RAM phones",
    "og_title": "Games for low-end Android India: Tier-2 phone friendly GPS MMO",
    "meta": "Games for low-end Android in India: MapRaiders runs smoothly on Tier-2 and Tier-3 budget phones. 2GB RAM friendly, low data use, free at the core. UK-spelling throughout.",
    "keywords": "games for low-end android, games for 2gb ram android, low-end gps games india, tier-2 phone games, budget android games, lite mode games india",
    "badge": "Tier-2 / Tier-3 Friendly · India Exclusive",
    "pricing_pill": "Built for Indian streets · 2GB RAM minimum · ₹0 forever",
    "h1_html": 'Games for low-end Android India: <em>built for the phone you actually own</em>, not the flagship in the ad',
    "lead": "Games for low-end Android is a real category in India. Around 600 million active devices sit in the 2 to 4GB RAM range, and they are the backbone of most Tier-2 and Tier-3 cities. Most GPS games are made for flagships and lag badly on a budget phone. MapRaiders is the other way around: GPS-only with no AR, no camera-required gameplay, low data use, smooth on 2GB RAM Androids, with an optional Lite Mode for 1GB devices. Yeh app aapke phone ke liye banaya gaya hai, made for the phone in your hand right now.",
    "trigger": {
        "quote": "Built for Indian streets, Tier-2 city friendly. No flagship needed.",
        "author": "René Scafarti, Founder"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "The Tier-2 and Tier-3 reality",
            "title": "The <em>Tier-2 and Tier-3 device reality</em>, and why most GPS games ignore it",
            "body": """
    <p>India has more than 600 million Android devices in active use. Roughly:</p>
    <ul>
      <li><strong>Tier-1 flagships (8GB+ RAM):</strong> around 15% of devices, mostly premium urban professionals.</li>
      <li><strong>Tier-2 mid-range (4 to 6GB RAM):</strong> around 35% of devices, working professionals across Tier-1 and Tier-2 cities.</li>
      <li><strong>Tier-3 budget (2 to 4GB RAM):</strong> around 50% of devices, Tier-2 and Tier-3 city players, students and family devices.</li>
    </ul>
    <p>Most global GPS games target the 15% of flagships and lag horribly on the other 85%. Pokémon GO with full AR on a 3GB Redmi tends to crash inside 30 minutes; Monster Hunter Now is basically unplayable on a Tier-3 budget device. The mismatch shows up in the numbers. India has roughly 510 million mobile gamers, but each Niantic location-based game only sees about 180 to 320 thousand monthly active users here.</p>
    <p>MapRaiders flips that: <strong>built for the 85%, not the 15%</strong>.</p>
            """,
        },
        {
            "label": "Performance optimisations",
            "title": "MapRaiders <em>performance optimisations</em> for low-end Android",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>GPS-only, no AR</h3><p>No camera processing, no ARCore, no shader pipeline. GPS plus a map, that is it. CPU load roughly 60% lower than Pokémon GO with AR enabled.</p></div>
    <div class="feat-card rv d1"><h3>2GB RAM minimum</h3><p>Tested on the Redmi 9, the Realme C-series and Samsung Galaxy M-series. Territory updates run at 30fps on 2GB devices without lag spikes.</p></div>
    <div class="feat-card rv d2"><h3>Optional Lite Mode</h3><p>On a 1GB RAM device, Lite Mode switches off animation effects and lowers map tile resolution. Full gameplay stays intact. Tier-3 city players are not excluded.</p></div>
    <div class="feat-card rv d3"><h3>Low data use by design</h3><p>About 5MB per hour of active play. Map tiles cache aggressively, so it holds up on 2G or 3G in rural Tier-2 areas. WhatsApp-friendly data budget.</p></div>
    <div class="feat-card rv d4"><h3>Battery: roughly four times longer than Pokémon GO</h3><p>30 to 40% drain on two hours of active play, compared to 80% or more for Pokémon GO on the same Tier-2 phones. Tu jaana hai, bas walk karo, the phone keeps up.</p></div>
    <div class="feat-card rv"><h3>APK size under 50MB</h3><p>Compact install, no 800MB Niantic-style download. Friendly on Indian budget phones with tight storage.</p></div>
  </div>""",
        },
        {
            "label": "Comparison",
            "title": "GPS games <em>tested on budget Androids</em>",
            "body": "<p>We tested the major GPS games on a Redmi 9 (2GB RAM, Snapdragon 439), a fairly representative Tier-3 budget Android for the Indian market:</p>",
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
         "a": "Yes. We test on the Redmi 9, the Realme C-series and the Samsung Galaxy M-series. Territory updates run at 30fps on 2GB devices without lag spikes. On a 1GB device, Lite Mode disables animation effects and reduces map tile resolution while keeping the full gameplay intact."},
        {"q": "How much data does MapRaiders use?",
         "a": "Around 5MB per hour of active play. Map tiles cache aggressively, so it holds up on 2G or 3G in rural Tier-2 areas. It is gentle on Indian limited-data plans, even when WhatsApp is your priority app."},
        {"q": "Why does Pokémon GO lag so badly on my budget phone?",
         "a": "AR is the heavy part. Camera processing and the ARCore shader pipeline burn CPU and RAM aggressively. MapRaiders is intentionally AR-free, GPS only. CPU load drops by roughly 60%, which is why it stays smooth where Pokémon GO does not."},
        {"q": "What is Lite Mode?",
         "a": "Lite Mode is meant for 1GB RAM devices (Tier-3 budget Androids). It disables animation effects, reduces map tile resolution to 256 pixels and simplifies UI transitions. The full gameplay stays: territory, Echoes, defence, clans. No Indian player gets excluded."},
        {"q": "Which Tier-2 and Tier-3 phones are tested?",
         "a": "Redmi 9, Redmi 9A, Realme C25, Realme Narzo 50A, Samsung Galaxy M12, Samsung Galaxy A03s, Tecno Spark 8, Infinix Hot 11. We keep adding new budget devices as they launch in India."},
        {"q": "What is the APK size?",
         "a": "Under 50MB on first install. Map tiles download on demand and then cache. There is no Niantic-style 800MB upfront download, which helps on storage-tight Tier-3 budget phones."},
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
    "title": "Walking App with Game India: gamified cardio plus UPI",
    "og_title": "Walking App with Game India: cardio, territory, UPI-friendly",
    "meta": "A walking app with a real game underneath, made for India. MapRaiders puts territory, Echoes and clans on top of every walk. Free at the core, UPI-friendly, and gentle enough for the 50+ crowd.",
    "keywords": "walking app with game india, gamified walking app india, walking game app india, fitness gps game india, longevity walking india, healthy walking app india",
    "badge": "Walking + Game · India",
    "pricing_pill": "₹0 forever · UPI-friendly · 50+ longevity ready",
    "h1_html": 'Walking app with a <em>real game</em> for India: gamified cardio that respects your wallet',
    "lead": "Walking is the cardiovascular and cognitive backbone of healthy aging, and India has the largest population of daily walkers in the world. Yet most walking apps available here are either step counters with no game underneath, or USD-priced premium stat trackers. MapRaiders puts a game on every walk: territory, Echoes, clans. The core is free, payments run through UPI, it runs on Tier-2 phones, and it is gentle enough for kids in family mode and for parents or grandparents looking for a 50+ longevity routine.",
    "trigger": {
        "quote": "I jog every morning anyway, but now I am also defending something. Funny how much discipline that mobilises.",
        "author": "Vivian N., Runner from the Hamburg area (closed beta)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "The problem",
            "title": "Why classic walking apps <em>do not really work for India</em>",
            "body": """
    <p>Three structural gaps explain why Strava and the usual step counters lose Indian users after the first four weeks:</p>
    <ul>
      <li><strong>USD-priced premium tiers.</strong> Strava Premium is around 11.99 dollars a month, which translates to ₹1,000 plus. Indian walkers want gamified motivation, not premium-paywalled stats.</li>
      <li><strong>No game on the free tier.</strong> A step counter rewards you with a number. Numbers do not pull people back daily, especially in Tier-2 and Tier-3 cities where social-walk culture is the norm.</li>
      <li><strong>No social layer for the neighbourhood.</strong> Indian walks are social. Morning park walks with friends, evening colony rounds with neighbours. None of these apps make the map social. Aap akele walking nahi karte. Walks here are inherently a group thing.</li>
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
            "label": "MapRaiders for Indian walks",
            "title": "MapRaiders <em>mechanics for Indian walking culture</em>",
            "body": """
    <p>Indian walking is inherently social, so MapRaiders is built around that rather than around a solo step counter. The whole neighbourhood turns into the playing field:</p>
    <ul>
      <li><strong>Morning park walk.</strong> Cubbon Park, Lodi Garden, Sanjay Van. Claim your morning route as territory. Friends in the same park naturally end up in the same clan.</li>
      <li><strong>Evening colony walk.</strong> Walking with neighbours? Drop voice-note Echoes or photos for each other. Tomorrow's walk has small surprises waiting.</li>
      <li><strong>Sunday family walk.</strong> Kids on the COPPA-aligned mode follow Echo trails like a treasure hunt. Parents claim territory. The same walk becomes multi-generational play.</li>
    </ul>
            """,
        },
        {
            "label": "50+ longevity",
            "title": "<em>50+ longevity gaming</em>: for Indian parents and grandparents",
            "body": """
    <p>Walking is doctor-prescribed for diabetes management, cardiovascular health and slowing cognitive decline. Those three are disproportionately common in Indian 50+ adults. The same generation is also the fastest-growing smartphone buyer in Tier-1 cities. What they want is fairly specific:</p>
    <ul>
      <li><strong>Mobility goals that feel meaningful</strong>, not punishing. &ldquo;Walked 8000 steps&rdquo; does not pull them back; &ldquo;defended my colony lane&rdquo; does.</li>
      <li><strong>Cognitive engagement</strong> on the daily walk. The defence mini-games are simple but tactical, which keeps the mind a little sharper.</li>
      <li><strong>Low-stakes social connection.</strong> A clan made up of the same morning-park crowd, not a nationwide leaderboard fight.</li>
    </ul>
    <p>The territory loop hits all three without any age-targeted UX. The same loop that makes a 25-year-old runner faster makes a 60-year-old walker more consistent.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders a Strava replacement for India?",
         "a": "Not really. Strava measures performance precisely; MapRaiders puts gameplay on top of the same walk. You can use both in parallel without any conflict. But if you only want gamified motivation and you would rather not pay for Strava Premium in dollars, MapRaiders on its own is enough."},
        {"q": "Does it work for slow walking?",
         "a": "Yes. There is no minimum speed. Walking, jogging, hiking and cycling all generate territory as long as you are physically moving. Auto-cheat detection takes care of GPS shortcuts."},
        {"q": "Will it drain my battery on a one-hour Cubbon Park walk?",
         "a": "Around 15 to 20% on a one-hour walk, compared to 40% or more for Pokémon GO with AR. No camera, no AR rendering, GPS sample rate is tuned. Tier-2 phones handle it smoothly."},
        {"q": "Is there a sub required for India?",
         "a": "No. The full walking and game loop is free forever. Cosmetic items are optional (₹19 to ₹199) and give zero gameplay advantage. UPI-friendly via Razorpay, Google Pay, PhonePe and Paytm."},
        {"q": "Can my parents (50+) use it easily?",
         "a": "Yes. The territory mechanic is straightforward: walk, claim. There is no tutorial overload. The defence mini-games are simple (Tic-Tac-Toe, Rock-Paper-Scissors) and do not require any gaming background. Several beta testers are over 50."},
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
    "title": "Treasure Hunt App India: citywide, family, festival-ready",
    "og_title": "Treasure Hunt App India: citywide, family-friendly, free",
    "meta": "A treasure hunt app for India that is actually live and citywide, with no tour purchases or premium fees. MapRaiders turns any city into an open-ended hunt for kids, families and festival days.",
    "keywords": "treasure hunt app india, citywide treasure hunt india, family treasure hunt india, urban treasure hunt india, free treasure hunt india, scavenger hunt app india",
    "badge": "Live Treasure Hunt · India",
    "pricing_pill": "₹0 Forever · No tour purchases · Family-safe (DPDPA-aligned)",
    "h1_html": 'Treasure Hunt App India: a whole city of <em>hidden Echoes</em>, always live',
    "lead": "Most treasure hunt apps in India need prep: buy a tour pack, set up stations, print colour clue sheets. MapRaiders works the other way around. Echoes are already spread across the whole city, from Old Delhi gullies to Bandra by-lanes to T-Nagar streets. You follow other players' clues or you leave your own. Live, free, no setup needed. Family-friendly with DPDPA-aligned parental controls, and competitive depth for adults through clan territory. Diwali, Holi, Eid and Navratri hooks are already in.",
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
    <p>A few criteria separate the 2020s treasure-hunt apps from the print-and-clue era. India 2026 has its own additions on top:</p>
    <ul>
      <li><strong>Live.</strong> Clues exist in real time, not only inside pre-built tours that someone bought weeks earlier.</li>
      <li><strong>Social.</strong> Players leave clues for each other instead of grinding through static stations.</li>
      <li><strong>No premium gate.</strong> An Indian family or a group of kids should be able to walk in instantly, without buying a ₹500 tour first.</li>
      <li><strong>Festival aware.</strong> Holi, Diwali, Eid, Navratri. Themes that respect the Indian festival calendar instead of pasting a Christmas skin on top of everything.</li>
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
      <tr><td class="feat-name">Goosechase</td><td class="cross">USD per-event fees</td><td class="cross">High: build the hunt</td><td class="cross">Pre-built only</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Actionbound</td><td class="cross">USD bound purchases</td><td class="cross">High: build the tour</td><td class="cross">✗</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Geocaching</td><td class="cross">Premium-paywalled</td><td class="check">Low</td><td class="cross">Asynchronous</td><td class="cross">No</td></tr>
      <tr><td class="feat-name">Local Indian event apps</td><td class="cross">Per-event fees</td><td class="cross">Event-driven</td><td class="cross">Pre-built</td><td>Some</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">₹0</td><td class="check">Zero</td><td class="check">Live</td><td class="check">Holi, Diwali, Eid, Navratri</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "How it works here",
            "title": "How MapRaiders <em>reshapes</em> the Indian treasure hunt",
            "body": """
    <p>Instead of a linear tour from station 1 to station 10, MapRaiders sets up an <strong>open-ended spatial treasure hunt</strong> across the whole Indian city:</p>
    <ul>
      <li><strong>Drop Echoes.</strong> Leave an audio, photo or video Echo at a real spot. Connaught Place inner circle, Charminar lanes, a Goa beach hut. Other players discover them later.</li>
      <li><strong>Find Echoes.</strong> See on the map where Echoes are. Follow the trail, find small secrets, hear short stories.</li>
      <li><strong>Build quests.</strong> Create a tiny task at a place (&ldquo;photograph the red door near Galli #4&rdquo;). Other players complete it.</li>
      <li><strong>Festival hooks.</strong> Holi: mark-your-colours quest. Diwali: light-trail Echo discovery. Eid: community gathering quest. Navratri: nine-day territory streaks.</li>
      <li><strong>Territory layer.</strong> Walk a hunt route often enough and it turns into claimed territory. Your hunt becomes your land.</li>
    </ul>
            """,
        },
        {
            "label": "Family use case",
            "title": "Treasure hunt app for <em>Indian families</em>",
            "body": """
    <p>Treasure hunts are a timeless Indian family activity, common at birthday parties, Diwali gatherings and school events. MapRaiders brings that into the smartphone era without putting kids alone in front of a screen:</p>
    <ul>
      <li><strong>Parent-and-kid activity.</strong> Parents drop audio Echoes along a route in the colony park; kids follow the clues. Physical movement, digital hints.</li>
      <li><strong>Screen-light by design.</strong> The app only points the way on the map; the actual experience happens in the real world.</li>
      <li><strong>DPDPA and COPPA aligned.</strong> No personally identifiable information from minors, no ads, parental mode for restricted gameplay. DPDPA-aligned data handling for Indian users is built in.</li>
      <li><strong>Festival ready.</strong> Diwali Echo trails, Holi colour quests, Eid community circuits. Culturally relevant, respectful, never appropriative.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders safe for Indian kids?",
         "a": "Yes, from age 9 upwards with parental supervision. The app collects no personally identifiable information from minors (DPDPA and COPPA aligned), runs without ads, and has a parental mode that restricts gameplay. DPDPA-aligned data handling for Indian users is part of the design."},
        {"q": "How much prep do I need for a Diwali treasure hunt with kids?",
         "a": "None. Unlike Actionbound or Goosechase you do not buy a tour or pre-set stations. Echoes are already spread across the city, so you can follow other players' clues or drop your own. Festival hooks for Diwali (light-trail Echoes), Holi (colour quests), Eid (community circuits) and Navratri (nine-day streaks) are already in."},
        {"q": "Are there treasure hunt features for adults?",
         "a": "Yes. The Echo system and the clan territory mechanic scale from family fun all the way up to competitive multiplayer. Adults can run citywide hunts, competitive defence challenges, or build neighbourhood quest chains."},
        {"q": "Does it cost anything in India?",
         "a": "No. The treasure-hunt features (drop Echoes, find Echoes, build quests) are completely free. Cosmetic items (₹19 to ₹199) are optional and give zero gameplay advantage. UPI-friendly via Razorpay, Google Pay, PhonePe and Paytm."},
        {"q": "Does it work in Tier-2 and Tier-3 cities?",
         "a": "Yes. In Tier-2 and Tier-3 cities such as Indore, Coimbatore or Bhubaneswar you can drop Echoes and build quests just the same. Dense Tier-1 cities (Mumbai, Delhi, Bangalore) have more clues from other players, so Tier-2 and Tier-3 areas tend to give you more room for solo exploration on a fresh route."},
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
    "title": "Cricket Fan Map App: defend your stadium territory on IPL days",
    "og_title": "Cricket Fan Map App: defend your IPL stadium territory",
    "meta": "A cricket fan map app for IPL and T20 fans. MapRaiders lets you claim your stadium, your team's neighbourhood and your match-day zone on a real map. UK-spelling, UPI-friendly.",
    "keywords": "cricket fan map app, ipl stadium territory game, cricket gps game india, t20 fan app, cricket fan game, stadium territory app",
    "badge": "Cricket Fan · India Exclusive",
    "pricing_pill": "Defend your stadium territory · IPL and T20 ready · ₹0 free",
    "h1_html": 'Cricket fan map app: <em>defend your stadium territory</em> on IPL match days',
    "lead": "Cricket in India is not just a sport, it is part of who people are. MapRaiders is the first GPS map app built around that. Claim your IPL home stadium, defend your team's neighbourhood, build clan territory around match-day zones. Wankhede for Mumbai Indians fans, Chinnaswamy for RCB, Eden Gardens for KKR, Chepauk for CSK. Your stadium becomes ground you actually hold on the map. Free at the core, UPI-friendly, runs on Tier-2 phones. India-exclusive feature.",
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
      <li><strong>Around 700 million active cricket fans.</strong> The largest single-sport fanbase on Earth, and probably the most digitally engaged one.</li>
      <li><strong>IPL season is a national event.</strong> March to May every year. 60-plus matches, ten franchise teams, dedicated city-fan loyalties (Mumbai Indians, CSK, RCB, KKR, Delhi Capitals and so on).</li>
      <li><strong>T20 World Cup and bilateral series</strong> keep cricket-fan engagement going year-round in India.</li>
      <li><strong>Stadium pilgrimages.</strong> Wankhede, Chinnaswamy, Eden Gardens, Chepauk. For fans these are sacred ground, not just venues, and the neighbourhoods around them are tribal territory.</li>
    </ul>
    <p>And yet no GPS game addresses any of this. Pokémon GO, Ingress, Monster Hunter Now: none have cricket-fan features. The category is empty. MapRaiders fills it.</p>
            """,
        },
        {
            "label": "Stadium territories",
            "title": "<em>Stadium territories</em>: claim your home ground",
            "body": "<p>Each major Indian cricket stadium becomes a high-value territory zone in MapRaiders. Walk to the stadium on match day to defend your team's home ground. Walk the area daily within a 2km radius and you own the neighbourhood around it:</p>",
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
    <div class="feat-card rv"><h3>Match-day boost</h3><p>On IPL match days, the home stadium zone earns double territory weight. Defend hard during your team's match and earn fan-clan glory.</p></div>
    <div class="feat-card rv d1"><h3>Fan clans</h3><p>Mumbai Indians fans naturally form a Wankhede clan, CSK fans form a Chepauk clan. Together you co-defend your team's neighbourhood through the IPL season.</p></div>
    <div class="feat-card rv d2"><h3>Pre-match Echoes</h3><p>Drop pre-match audio predictions, fan chants and post-match reactions. Over a season, your city builds up a cricket-Echo soundtrack of its own.</p></div>
    <div class="feat-card rv d3"><h3>Inter-team battles</h3><p>RCB fans against Mumbai Indians fans, clan against clan, on the days the teams meet. Real cricket rivalry plays out on the real-world map.</p></div>
    <div class="feat-card rv d4"><h3>T20 World Cup mode</h3><p>On national team match days the clan rivalries pause, and every Indian city briefly turns into one Team India blue zone.</p></div>
  </div>""",
        },
        {
            "label": "Indian cricket culture",
            "title": "Built with <em>respect for Indian cricket culture</em>",
            "body": """
    <p>Cricket here is close to sacred, and MapRaiders is built with respect for that. A few clear lines:</p>
    <ul>
      <li><strong>No player endorsement claims.</strong> We do not claim a partnership with Sachin Tendulkar, Virat Kohli, MS Dhoni, Rohit Sharma or any other cricketer. Fans can name their clans freely; the app never implies endorsement.</li>
      <li><strong>No BCCI affiliation claims.</strong> MapRaiders is independent and not affiliated with BCCI, IPL or any franchise.</li>
      <li><strong>No team logos in-app.</strong> Fans can rep their team through clan colours and clan names; trademarked team logos are not used inside the app.</li>
      <li><strong>Respect for fan culture.</strong> The app celebrates the cultural bond between fans and stadium neighbourhoods, not the trademarked commercial property around them.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Is MapRaiders affiliated with IPL or BCCI?",
         "a": "No. MapRaiders is independent; it is built by Scafa Investments LLC. We do not claim any affiliation with BCCI, IPL, any franchise or any individual player. Fans can rep their team through clan colours and clan names; trademarked logos are not used inside the app."},
        {"q": "Can I claim Wankhede, Chepauk, Eden Gardens or Chinnaswamy as territory?",
         "a": "Yes. Each major Indian cricket stadium has a 2km territory zone around it. Walk to the stadium on match day to defend your team's home ground. Walk the surrounding neighbourhood daily and you can hold it long-term."},
        {"q": "What happens during an IPL match day?",
         "a": "On match days, the home stadium zone earns double territory weight. Fan clans naturally form: Mumbai Indians fans cluster around Wankhede, CSK fans around Chepauk. On days when rival teams meet, clan-versus-clan territorial battles spill onto the map for fans of both sides."},
        {"q": "Is there a Sachin Tendulkar or Virat Kohli mode?",
         "a": "No. We do not claim endorsement from any cricketer. Fans are free to name their clan after their favourite player (clan names are user-generated), but the app never implies official endorsement."},
        {"q": "What about T20 World Cup or India national team matches?",
         "a": "On Team India match days the clan rivalries pause and every Indian city briefly turns into one Team India blue zone. So this is a cricket-fan map app for international cricket too, not only for the IPL."},
        {"q": "Will it work outside the Tier-1 stadium cities?",
         "a": "Yes. Tier-2 and Tier-3 city fans can claim their local cricket grounds, gully-cricket spots and club-level stadiums. Cricket is everywhere in India and the territory map reflects that."},
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
        "title": "Pokémon GO Alternative Reviews India: beta testers speak",
        "og_title": "Pokémon GO Alternative Reviews India: real beta tester voices",
        "meta": "Pokémon GO alternative reviews from the MapRaiders closed beta. Three testers from Stuttgart, Hamburg and Berlin report honestly on cardio, dog walks and urban exploration. Read with India in mind.",
        "keywords": "pokemon go alternative reviews india, mapraiders reviews india, gps game test india, beta tester report india, indie pokemon go alternative india",
        "h1_html": 'Pokémon GO alternative: <em>real reviews</em> for Indian players',
        "lead": "Three internal beta testers from three German urban areas used MapRaiders for several weeks. Their reports are not marketing copy and there are no influencer promo codes. The reviews are translated from the German originals. The Indian native-tester wave is planned post-launch on a DPDPA-compliant programme.",
        "intro_label": "Who is testing?",
        "intro_title": "Three people, three <em>use cases</em>",
        "intro_body": """
    <p>The three beta testers cover three very different personas, which is what makes the comparison to Pokémon GO honest:</p>
    <ul>
      <li><strong>Ron C.</strong> from the Stuttgart area: dog owner, daily walk, no gamer background.</li>
      <li><strong>Vivian N.</strong> from the Hamburg area: runner, tried Pokémon GO in 2018 and quit after three months.</li>
      <li><strong>Aljoscha P.</strong> from the Berlin area: urban explorer, Ingress veteran, knows the Niantic ecosystem firsthand.</li>
    </ul>
    <p>All three tested MapRaiders independently. No paid promotion, no scripts. Quotes are translations from the German originals; Schema.org marks them with <code>translationOfWork</code> so anyone can verify. Indian native testers will join post-launch under a DPDPA-compliant programme.</p>
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
        "title": "Games Like Pokémon GO Reviews India: MapRaiders in beta",
        "og_title": "Reviews: Games Like Pokémon GO India, the MapRaiders beta",
        "meta": "Reviews of games like Pokémon GO for India. Three German beta testers report on MapRaiders: territory system, Echoes and defence mini-games inside real daily use.",
        "keywords": "games like pokemon go reviews india, pokemon go alternative test india, gps mmo test india, mapraiders test india, beta review india",
        "h1_html": 'Games like Pokémon GO India: <em>reviews from the beta</em>',
        "lead": "What happens when a Pokémon GO veteran, a runner and a dog owner all test the same GPS-MMO alternative? Three very different reports from the MapRaiders closed beta. Useful reading for Indian players who want gamified motivation without USD-priced battle passes.",
        "intro_label": "Test setting",
        "intro_title": "How we <em>tested</em>",
        "intro_body": """
    <p>The three testers used MapRaiders for four to six weeks inside their normal routine. No artificial test sessions, no sponsored content. The setup:</p>
    <ul>
      <li><strong>Daily use</strong> in their own urban area (Stuttgart, Hamburg, Berlin).</li>
      <li><strong>Direct comparison</strong> with Pokémon GO at Aljoscha P. (two weeks of parallel play).</li>
      <li><strong>Battery measurement</strong> via app settings: average consumption per hour.</li>
      <li><strong>Honest-feedback rule:</strong> bugs, frustration and wishes are noted alongside the highlights.</li>
      <li><strong>Indian native testers</strong> join post-launch under a DPDPA-compliant programme.</li>
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
        "title": "Territory Game Reviews India: beta testers on MapRaiders",
        "og_title": "Territory Game India: real beta reviews",
        "meta": "Territory game reviews from real daily use. Three German beta testers report how claiming land, decay and defence mini-games feel inside an actual urban routine. The same loop carries over to Indian streets.",
        "keywords": "territory game reviews india, claim territory game test india, land conquest app reviews india, territory game test india",
        "h1_html": 'Territory game India: when <em>your own street</em> belongs to you',
        "lead": "What does it actually feel like to conquer a real street? Three beta testers report on their first territory, the first decay shock and the first defence mini-game. The loop translates directly to Indian context: Connaught Place, Cubbon Park, Marine Drive.",
        "intro_label": "What matters in the test?",
        "intro_title": "What makes a <em>territory game</em> tangible",
        "intro_body": """
    <p>The territory test runs along three experience axes:</p>
    <ul>
      <li><strong>Conquest.</strong> When does the first claimed street feel like &ldquo;my land&rdquo;?</li>
      <li><strong>Loss.</strong> How do you react to the first decay, or to losing land to an attacker?</li>
      <li><strong>Defence.</strong> How do the defence mini-games feel: tactical, fair, frustrating?</li>
    </ul>
    <p>The three testers' quotes cover all three axes from very different angles, which means an Indian player can map the same experience onto their own neighbourhood without a leap.</p>
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
        "title": "Games for Low-End Android Reviews: Tier-2 phone tested",
        "og_title": "Games for Low-End Android Reviews: performance on Tier-2 phones",
        "meta": "Games for low-end Android reviews: how does MapRaiders actually run on a Redmi 9, a Realme C-series or a Galaxy M-series? Three beta testers plus a Tier-3 device benchmark report.",
        "keywords": "games for low-end android reviews, tier-2 phone game reviews, 2gb ram android game test, budget android game reviews, redmi 9 game test",
        "h1_html": 'Games for low-end Android: <em>real reviews</em> on Tier-2 phones',
        "lead": "Will MapRaiders run smoothly on a 2GB RAM Redmi 9? On a Realme C25? On a Galaxy M12? Three German beta testers plus a Tier-3 budget Android benchmark report. The performance reality, written for India.",
        "intro_label": "Test setting",
        "intro_title": "How we tested <em>low-end Android performance</em>",
        "intro_body": """
    <p>Beyond the German tester reviews, we ran dedicated Tier-2 and Tier-3 device testing for the Indian market:</p>
    <ul>
      <li><strong>Redmi 9</strong> (2GB RAM, Snapdragon 439): four-week daily test.</li>
      <li><strong>Realme C25</strong> (4GB RAM, Helio G70): two-week parallel test.</li>
      <li><strong>Galaxy M12</strong> (4GB RAM, Exynos 850): battery and lag measurements.</li>
      <li><strong>Tecno Spark 8</strong> (3GB RAM): Lite Mode test.</li>
      <li><strong>Lite Mode benchmark</strong> on a Galaxy A03s (1GB RAM): full gameplay validation.</li>
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
        "title": "Walking App Reviews India: gamified GPS walking in beta",
        "og_title": "Walking App Reviews India: cardio plus territory in the real world",
        "meta": "Walking app reviews from the MapRaiders beta, written with India in mind. Cardio motivation, battery life on long routes, territory loss after a sick week. Three real testers report.",
        "keywords": "walking app reviews india, gamified walking app reviews india, fitness gps app reviews india, longevity walking reviews",
        "h1_html": 'Walking apps with a game: <em>real reviews</em> for India',
        "lead": "What happens to walking motivation when every route defends real land? How does the first decay after a sick week feel? Three beta testers report: a runner, a walker, an urban explorer. The same loop carries over to morning park walks at Cubbon Park or evening colony walks in any Tier-2 city.",
        "intro_label": "Test axes",
        "intro_title": "What a <em>walking-with-game app</em> needs to deliver",
        "intro_body": """
    <p>We tested the walking experience along three axes:</p>
    <ul>
      <li><strong>Motivation anchor.</strong> When does somebody come back after a pause?</li>
      <li><strong>Battery on long routes.</strong> 60 to 90 minute walks without the phone dying. Critical on Tier-2 phones.</li>
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
        "title": "Treasure Hunt App Reviews India: no-setup live city hunt",
        "og_title": "Treasure Hunt App India: beta test reviews",
        "meta": "Treasure hunt app reviews without tour purchases or any prep. Beta testers report how MapRaiders turns the whole city into a live hunt, with Indian festival hooks for Diwali and Holi.",
        "keywords": "treasure hunt app reviews india, citywide treasure hunt reviews india, family treasure hunt reviews india, urban hunt app test india",
        "h1_html": 'Treasure hunt app India: <em>reviews</em> without tour purchases',
        "lead": "Most treasure hunt apps need prep: buy a tour, plan a route, set up stations. What does it feel like when the whole city is already filled with clues? Three beta testers report. Indian festival hooks (Diwali, Holi, Eid, Navratri) are tested separately.",
        "intro_label": "Test question",
        "intro_title": "Does a <em>live treasure hunt</em> work without setup?",
        "intro_body": """
    <p>We tested the treasure-hunt features in three settings:</p>
    <ul>
      <li><strong>Solo</strong> as urban explorer (Aljoscha P.): drop Echoes, find Echoes.</li>
      <li><strong>With dog</strong> on the regular walk (Ron C.): clues as a side product of the routine.</li>
      <li><strong>Family setting</strong> simulated: how fast do adults and kids understand the mechanic? Indian-family testing follows in the Tier-2 wave.</li>
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
        "title": "Cricket Fan Map App Reviews: IPL stadium territory tests",
        "og_title": "Cricket Fan Map App: real reviews from IPL-fan beta testers",
        "meta": "Cricket fan map app reviews. How does it feel to claim Wankhede, Chinnaswamy, Eden Gardens or Chepauk as territory? IPL-season test reports from the MapRaiders beta.",
        "keywords": "cricket fan map app reviews, ipl stadium territory game reviews, cricket gps game reviews india, t20 fan app reviews",
        "h1_html": 'Cricket fan map app: <em>reviews</em> from the IPL-fan beta',
        "lead": "What does it actually feel like to claim Wankhede on a Mumbai Indians match day? To defend Chinnaswamy as RCB, or to hold Chepauk for CSK? Beta tester reports on the cricket-fan map app, the India-exclusive feature that turns IPL season into territorial gameplay.",
        "intro_label": "Cricket-fan test",
        "intro_title": "Why <em>stadium territory</em> matters for Indian fans",
        "intro_body": """
    <p>Cricket in India is cultural identity, not only a sport. We tested cricket-fan features along three axes:</p>
    <ul>
      <li><strong>Match-day defence.</strong> Double territory weight on the home stadium during an IPL match day. How does that feel for a fan?</li>
      <li><strong>Fan-clan formation.</strong> Do Mumbai Indians fans naturally form a Wankhede clan? Do CSK fans form a Chepauk clan?</li>
      <li><strong>Inter-team battles.</strong> RCB versus Mumbai Indians match day, with a clan-versus-clan territorial battle. Does it heighten the cricket fandom or feel forced?</li>
    </ul>
    <p>The Indian cricket-fan beta wave is planned for IPL 2026 (March to May). The German beta testers stress-tested the underlying territory mechanic, not the cricket-specific features.</p>
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
    "title": "MapRaiders Reviews India: beta tests, founder, all topics",
    "og_title": "MapRaiders Reviews India: all the beta voices in one place",
    "meta": "MapRaiders reviews India: 5.0 out of 5 from three verified beta tests, the founder's statement, plus every Killer page and review page linked from one hub. UPI-friendly, Tier-2 phone ready.",
    "keywords": "mapraiders reviews india, mapraiders beta reviews india, gps mmo reviews india, indie pokemon go alternative reviews india",
    "badge": "Hub and Overview India",
    "pricing_pill": "5.0 out of 5 from three verified beta reviews",
    "h1_html": '<em>MapRaiders reviews India</em>: everything worth knowing about the GPS MMO',
    "lead": "Three beta testers from Stuttgart, Hamburg and Berlin. Seven Killer topics built for India: Pokémon GO comparison, cricket-fan map app, low-end Android performance, citywide treasure hunts. Seven dedicated reviews pages. One hub. UPI-friendly, Tier-2 phone ready, DPDPA-aligned.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "What is MapRaiders, exactly?",
         "a": "MapRaiders is a GPS-based MMO for Android. Players claim real territories through movement, leave Echoes, build quests and defend their land with mini-games. Ad-free, AR-free, free at the core. India-specific features include UPI payments, low-end Android support and the cricket-fan map mode."},
        {"q": "How many beta testers are these?",
         "a": "Currently three German testers feature publicly, with their consent and using first name plus initial for privacy. The full closed beta is larger; these three represent the main personas. The Indian native beta wave is planned post-launch under a DPDPA-compliant programme."},
        {"q": "Are the reviews real?",
         "a": "Yes. The three testers are real people from the closed beta. They were not paid; the quotes are originally written in German. Schema.org marks the EN-IN versions with translationOfWork pointing back to the German originals so anyone can verify the source."},
        {"q": "How can I become a beta tester in India?",
         "a": "Join the email list on the homepage. The Indian wave launches post-launch under a DPDPA-compliant programme. Priority goes to active walkers, runners and cricket fans in Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata, Pune and Ahmedabad, plus selected Tier-2 cities."},
        {"q": "When does the app launch officially in India?",
         "a": "MapRaiders is on Google Play as a closed beta. Public India launch is targeted for Summer 2026 with full UPI integration. iOS follows in Q3 2026."},
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

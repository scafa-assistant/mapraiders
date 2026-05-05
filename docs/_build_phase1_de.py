#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 1 — DE Killer-URL Builder
Generates 15 DE pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_DE_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_de.py
Idempotent: overwrites existing files.
"""

import json
import os
import sys
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
SITE = "https://mapraiders.com"
LANG = "de"

# Hreflang map (slug per language for the territorium-spiel anchor — we keep
# the same path for new pages, default landing per locale).
HREFLANG = [
    ("de", ""),  # default — pointed via x-default
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
# REUSABLE BLOCKS
# -----------------------------------------------------------------------------

# Beta-Tester data — verbatim from Master-Plan §1.4 + §3.2
TESTER_RON = {
    "name": "Ron C.",
    "role": "Hundebesitzer · Stuttgart-Raum",
    "role_long": "Hundebesitzer aus dem Stuttgart-Raum (geschlossene Beta)",
    "quote": "Mein Hund liebt seine Runde — und ich liebe, dass jede Runde meinen Stadtteil sichtbarer auf der Karte macht. Ich habe meine ganze Straße schon erobert.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "Joggerin · Hamburg-Raum",
    "role_long": "Joggerin aus dem Hamburg-Raum (geschlossene Beta)",
    "quote": "Ich jogge sowieso jeden Morgen. Mit MapRaiders hat jede Strecke ein Ziel: Territorium halten oder zurückerobern. Mein Cardio-Antrieb ist explodiert.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "Stadt-Erkunder · Berlin-Raum",
    "role_long": "Stadt-Erkunder aus dem Berlin-Raum (geschlossene Beta)",
    "quote": "Echos zu hinterlassen und zu sehen, wer sie findet, ist wie eine offene Schnitzeljagd durch die ganze Stadt.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "Ich war einer der frustrierten Pokémon-GO-Spieler. Ich wollte echtes Land erobern, "
    "kein flüchtiges Gym. Ich wollte nichts an Saudi-Investoren verkaufen, kein Werbe-Modell, "
    "keinen Premium-Sub. Also habe ich MapRaiders gebaut. Das ist mein Heimspielfeld, "
    "und es soll deins werden."
)

# Pricing offers (Sektion 1.1)
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0", "currency": "EUR"},
    {"name": "Cosmetic-IAP ab", "price": "1.99", "currency": "EUR"},
    {"name": "MapRaiders Supporter (Sub)", "price": "3.99", "currency": "EUR"},
    {"name": "Lifetime Supporter", "price": "99.00", "currency": "EUR"},
]

# DefinedTermSet (Brand-Vocab DE)
DEFINED_TERMS = [
    ("Territorium", "Eine eroberte Karten-Fläche im Spiel, die persistent dem Spieler oder Clan zugewiesen ist"),
    ("Echo", "Ein vom Spieler an einem Standort hinterlassenes Audio-, Foto- oder Video-Signal, das andere Spieler dort entdecken können"),
    ("Verteidigungs-Minispiel", "Mini-Spiel (Tic-Tac-Toe, Stein-Schere-Papier, Mini-Schach), das beim Verteidigen oder Erobern eines Territoriums ausgelöst wird"),
    ("Quest", "Eine vom Spieler erstellte Mini-Aufgabe, die andere Spieler in der echten Welt erfüllen können"),
    ("Clan", "Eine organisch geformte Gruppe von Spielern, die Territorien gemeinsam halten und verteidigen"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """Generate hreflang tags. slug is e.g. '/spiele-wie-pokemon-go.html'.
    For other languages we point to their landing page (we don't have full
    translations of every killer URL yet, so x-default + de canonical)."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "de":
            href = f"{SITE}{slug}"
        else:
            # Other-lang fallback: the locale homepage
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="de"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">Aus der geschlossenen Beta</div>
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
    <div class="fr-label">Vom Gründer</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Founder von MapRaiders" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">Founder, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">Aus der geschlossenen Beta</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.6">
      Hinweis: Tester sind interne Beta-Teilnehmer (geschlossene Beta). Vorname + Initial werden auf Wunsch der Tester aus Privacy-Gründen verwendet. Bewertungen sind original auf Deutsch.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="Teilen"><span class="mr-share__label">Teilen:</span><a class="mr-share__btn" href="https://wa.me/?text={enc}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">AGB</a><a href="/datenschutz.html">Datenschutz</a><a href="/impressum.html">Impressum</a><a href="/kontakt.html">Kontakt</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; Dein Viertel, dein Revier. Ein Produkt von Scafa Investments LLC.</p>
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
  <a href="/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/#features" class="lnk">Features</a>
    <a href="/mapraiders-erfahrungen.html" class="lnk">Erfahrungen</a>
    <div class="lang-sw">
      <button class="lsw-btn">DE <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('de')}
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

def build_schema_killer(page):
    """Build full schema @graph for a Killer page."""
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Start", "item": f"{SITE}/"},
        {"@type": "ListItem", "position": 2, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = []
    for t in page.get("testers", ALL_TESTERS):
        review_objs.append({
            "@type": "Review",
            "@id": f"#{t['id']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "de",
        })
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
            "inLanguage": "de",
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
            "inLanguage": "de",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-de",
            "name": "MapRaiders Brand-Vokabular Deutsch",
            "inLanguage": "de",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    """Lighter schema for Erfahrungs-Twins."""
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Start", "item": f"{SITE}/"},
        {"@type": "ListItem", "position": 2, "name": "Erfahrungen", "item": f"{SITE}/mapraiders-erfahrungen.html"},
        {"@type": "ListItem", "position": 3, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = []
    for t in ALL_TESTERS:
        review_objs.append({
            "@type": "Review",
            "@id": f"#{t['id']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "de",
            "itemReviewed": {"@id": f"{SITE}{page['slug']}#app"},
        })
    graph = [
        {
            "@type": "WebPage",
            "@id": f"{SITE}{page['slug']}#webpage",
            "url": f"{SITE}{page['slug']}",
            "name": page["title"],
            "inLanguage": "de",
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
            "inLanguage": "de",
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
    """Hub gets full Killer-schema + ItemList of all 14 sub-pages."""
    base = build_schema_killer(page)
    item_list = {
        "@type": "ItemList",
        "@id": f"{SITE}{page['slug']}#itemlist",
        "name": "MapRaiders DE — alle Erfahrungs- und Killer-Pages",
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
    """Render a single content section."""
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
  <h2 class="sec-title rv d1">Häufige <em>Fragen</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Tiefer ins <em>Spielfeld</em></h2>
  <p class="rv d1">Verwandte Themen rund um MapRaiders:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Bald auf Google Play &bull; Kostenlos &bull; Kein Spam</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">Beim Launch benachrichtigen</a>
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
<html lang="de" data-theme="light">
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
<meta property="og:locale" content="de_DE">
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
    Beim Launch benachrichtigen
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
  <div class="sec-label rv">Bewertungen</div>
  <h2 class="sec-title rv d1">5,0 von 5 — <em>3 verifizierte Beta-Bewertungen</em></h2>
  <div class="prose rv d2">
    <p>Drei Beta-Tester aus Deutschland — ein Hundebesitzer, eine Joggerin und ein Stadt-Erkunder — haben MapRaiders über mehrere Wochen genutzt. Die folgenden Erfahrungen sind original auf Deutsch verfasst und repräsentieren echte Personen aus der geschlossenen Beta. Aus Privacy-Gründen verwenden wir nur Vorname + Initial.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="de" data-theme="light">
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
<meta property="og:locale" content="de_DE">
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
  <div class="h-badge rv">Erfahrungen</div>
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

    # Section: alle Killer
    killer_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Mehr erfahren →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Erfahrungsbericht →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">Themen-Hub</div>
  <h2 class="sec-title rv d1">Alle <em>MapRaiders-Themen</em> auf einen Blick</h2>
  <div class="prose rv d2">
    <p>Hier findest du alle 7 Killer-Pages plus 7 Erfahrungs-Berichte, die MapRaiders aus verschiedenen Blickwinkeln beleuchten — vom Pokémon-GO-Vergleich bis zur Schnitzeljagd-App, vom Territorium-Spiel bis zum Joggen-Begleiter. Jede Page ist eigenständig lesbar; zusammen zeichnen sie das vollständige Bild.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Erfahrungen im Detail</div>
  <h2 class="sec-title rv d1">Was Beta-Tester aus <em>verschiedenen Perspektiven</em> berichten</h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Aggregat-Bewertung</div>
  <h2 class="sec-title rv d1">5,0 von 5 — <em>3 verifizierte Beta-Bewertungen</em></h2>
  <div class="prose rv d2">
    <p>Alle Bewertungen stammen aus der geschlossenen Beta-Phase Februar–April 2026. Drei Tester — ein Hundebesitzer, eine Joggerin, ein Stadt-Erkunder — haben MapRaiders auf eigenen Routen in Stuttgart, Hamburg und Berlin getestet. Die hier gezeigten Reviews sind original auf Deutsch und repräsentieren echte Personen.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="de" data-theme="light">
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
<meta property="og:locale" content="de_DE">
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
  <div class="h-badge rv">MapRaiders-Hub</div>
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
# PAGE DATA — KILLERS (K1-K7)
# -----------------------------------------------------------------------------

K1 = {
    "slug": "/spiele-wie-pokemon-go.html",
    "breadcrumb": "Spiele wie Pokémon GO",
    "title": "Spiele wie Pokémon GO 2026 — werbefrei + ohne Saudi-Daten",
    "og_title": "Spiele wie Pokémon GO — werbefreie GPS-MMO-Alternative",
    "meta": "Du suchst Spiele wie Pokémon GO? MapRaiders ist die werbefreie GPS-MMO-Alternative — mit echtem Territorium, ohne P2W, DSGVO-konform aus Deutschland.",
    "keywords": "spiele wie pokemon go, pokemon go alternative, gps spiel, location based game, territorium spiel, werbefreies handyspiel",
    "badge": "Pokémon-GO-Alternative",
    "pricing_pill": "Ab 1,99€ pro Cosmetic — kein Pflicht-Sub",
    "h1_html": 'Spiele wie Pokémon GO — die <em>werbefreie GPS-MMO-Alternative</em> aus Deutschland',
    "lead": "Pokémon GO ist seit März 2025 in saudischer Hand. Die meisten Alternativen kommen vom selben Anbieter (Niantic) oder hinter einer Premium-Paywall. MapRaiders ist die einzige werbefreie GPS-MMO-Alternative mit echtem Territorium — DSGVO-konform, kein P2W, von einem unabhängigen Indie-Team aus Deutschland.",
    "trigger": {
        "quote": "Mein Cardio-Antrieb ist explodiert, seit jede Runde eine Eroberung ist.",
        "author": "Vivian N., Joggerin aus dem Hamburg-Raum (geschlossene Beta)"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Das Problem",
            "title": "Warum Spieler 2026 nach <em>Pokémon-GO-Alternativen</em> suchen",
            "body": """
    <p>Drei Schmerz-Punkte treiben den Wunsch nach Alternativen seit 2024:</p>
    <ul>
      <li><strong>Pay-to-Win-Drift.</strong> Remote-Raid-Pässe, Battle Pass, monatliche Token-Bündel. Wer nicht zahlt, fällt zurück.</li>
      <li><strong>AR-Akku-Drama.</strong> Augmented Reality saugt Akkus leer. Auf langen Routen ist das Spiel nach 90 Minuten vorbei.</li>
      <li><strong>Saudi-Acquisition März 2025.</strong> Niantic verkaufte seine Spiele-Sparte (inklusive Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) für 3,5 Milliarden US-Dollar an Scopely — eine Tochter des saudischen Public Investment Fund. Die Standortdaten von 30+ Millionen monatlichen Spielern fließen seitdem indirekt an einen ausländischen Staatsfonds.</li>
    </ul>
    <p>Wer nach Alternativen sucht, sucht nicht das nächste Pokémon GO. Sondern <strong>etwas, das gegen genau diese drei Punkte aufgebaut ist</strong>.</p>
            """,
        },
        {
            "label": "Die Liste",
            "title": "Top 5 echte Pokémon-GO-Alternativen — und warum <em>MapRaiders</em> die einzige mit echtem Territorium ist",
            "body": "<p>Die meisten Listicles werfen Apps zusammen, die nur eine Eigenschaft mit Pokémon GO teilen. Wir machen das ehrlicher — mit klarer Aussage, wer wofür gut ist:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>App</th><th>Anbieter</th><th>Werbefrei</th><th>Echtes Territorium</th><th>DSGVO-Trust</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">Ingress Prime</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Portals, nicht persistent</td><td class="cross">Saudi-PIF</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">Saudi-PIF</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="check">✓</td><td class="cross">Caches, nicht Land</td><td>Premium-Paywall</td></tr>
      <tr><td class="feat-name">Monster Hunter Now</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">Saudi-PIF</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓</td><td class="check">✓ persistent</td><td class="check">DSGVO, unabhängig</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "USP",
            "title": "Was MapRaiders <em>einzigartig</em> macht",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Echte Territorien-Persistenz</h3><p>Wenn du eine Straße erobert hast, gehört sie dir — bis sie jemand zurückerobert oder Decay einsetzt. Keine flüchtigen Gym-Captures.</p></div>
    <div class="feat-card rv d1"><h3>Echo-Audio statt AR</h3><p>Hinterlasse Audio-, Foto- oder Video-Echos an realen Standorten. Andere Spieler entdecken sie. Kein Akku-fressendes AR.</p></div>
    <div class="feat-card rv d2"><h3>7 Defense-Mini-Games</h3><p>Bei einem Angriff entscheiden Tic-Tac-Toe, Stein-Schere-Papier oder Mini-Schach. Strategie statt Spielzeit.</p></div>
    <div class="feat-card rv d3"><h3>Organische Clans</h3><p>Clans entstehen aus Nachbarschaft, nicht aus Discord-Servern. Wer dieselbe Straße läuft, wird zum Verbündeten.</p></div>
    <div class="feat-card rv d4"><h3>Akku-schonend</h3><p>Nur GPS, keine Kamera, kein AR. 4× längere Akku-Laufzeit als Pokémon GO auf langen Strecken.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Ist MapRaiders wirklich kostenlos?",
         "a": "Ja. 100% des Gameplays — Territorien, Echos, Quests, Clans, Defense-Mini-Games — ist kostenlos und bleibt es. Cosmetic-IAP ab 1,99€ ist optional und gibt nur visuelle Anpassungen, keine Spielvorteile."},
        {"q": "Brauche ich AR oder eine Kamera?",
         "a": "Nein. MapRaiders ist bewusst AR-frei. Die App nutzt nur GPS und die Karte. Das schont deinen Akku rund 4× länger als Pokémon GO auf längeren Routen."},
        {"q": "Werden meine Standortdaten verkauft?",
         "a": "Nein. Wir sind DSGVO-konform und unabhängig. Keine Werbe-SDKs, keine Datenverkäufe, kein staatlicher Eigentümer. Anders als Pokémon GO, das seit März 2025 zur Scopely-Gruppe (Saudi-Public-Investment-Fund) gehört."},
        {"q": "Funktioniert die App offline?",
         "a": "Eingeschränkt. GPS funktioniert offline, aber für Live-Karten-Sync und Mehrspieler-Features brauchst du Internet. Wir arbeiten an einem Offline-First-Modus für Wanderungen außerhalb von Funklöchern."},
        {"q": "Wann erscheint die iOS-Version?",
         "a": "Aktuell ist MapRaiders Android-only (im Google Play Store als geschlossene Beta). iOS-Launch ist für Q3 2026 geplant. Trag dich in die Mailing-Liste ein, wenn du iOS-User bist."},
    ],
    "internal_links": [
        ("/schnitzeljagd-app.html", "Schnitzeljagd-App-Variante für Familien"),
        ("/standort-spiel.html", "Was ist ein Standort-Spiel?"),
        ("/territorium-spiel.html", "Wie Territorium-Spiele funktionieren"),
        ("/pokemon-go-alternative-kostenlos.html", "Pokémon-GO-Alternative kostenlos"),
        ("/spiele-wie-pokemon-go-erfahrungen.html", "Erfahrungen anderer Spieler"),
        ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
    ],
}

K2 = {
    "slug": "/pokemon-go-alternative-kostenlos.html",
    "breadcrumb": "Pokémon GO Alternative kostenlos",
    "title": "Pokémon GO Alternative kostenlos — werbefrei + ohne Saudi",
    "og_title": "Pokémon GO Alternative kostenlos — ohne Werbung, ohne Sub",
    "meta": "Pokémon-GO-Alternative ohne In-App-Käufe? MapRaiders ist 100% kostenlos, werbefrei, ohne Battle Pass. Echtes Territorium statt flüchtiger Gyms — DSGVO-konform aus Deutschland.",
    "keywords": "pokemon go alternative kostenlos, pokemon go alternative ohne in-app käufe, gps spiel kostenlos, werbefrei, dsgvo",
    "badge": "Free Forever",
    "pricing_pill": "0,00€ Gameplay · Cosmetic optional ab 1,99€",
    "h1_html": 'Pokémon GO Alternative <em>kostenlos</em> — ohne In-App-Käufe, ohne Werbung, ohne Saudi-Investor',
    "lead": "Wer eine Pokémon-GO-Alternative ohne Battle Pass, Remote-Raid-Pass-Wahnsinn und Werbung sucht, landet meistens in der nächsten Premium-Falle. MapRaiders dreht das um: Das gesamte Kerngameplay ist und bleibt kostenlos. Keine Tier-Stufen, kein Pflicht-Abo, kein Datenverkauf.",
    "trigger": {
        "quote": "Werbefrei, DSGVO-konform, ohne Saudi-Investor — die Karte gehört dir.",
        "author": "René Scafarti, Founder"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Warum suchen?",
            "title": "Warum Pokémon-GO-Spieler 2026 nach <em>kostenlosen Alternativen</em> suchen",
            "body": """
    <p>Drei Pain-Points haben den Markt 2024-2026 reif gemacht:</p>
    <ul>
      <li><strong>Battle-Pass-Frust.</strong> Saisonale Pässe, die ohne Bezahlung nur eingeschränkt nutzbar sind. Wer aussetzt, verliert Belohnungen für immer.</li>
      <li><strong>Remote-Raid-Pass-Controversy.</strong> Niantic erhöhte Preise und reduzierte Verfügbarkeit — eine Welle von Spielern hörte 2023 auf.</li>
      <li><strong>Saudi-Acquisition März 2025.</strong> Niantic verkaufte Pokémon GO an Scopely (Saudi-PIF). Die Standortdaten von Millionen Spielern landen jetzt indirekt bei einem ausländischen Staatsfonds.</li>
    </ul>
            """,
        },
        {
            "label": "Was bedeutet kostenlos?",
            "title": "Was &bdquo;kostenlos&ldquo; wirklich bedeutet bei <em>MapRaiders</em>",
            "body": "<p>Wir nennen die Tiers transparent — keine versteckten Paywalls, keine Tutorial-Sperre nach 10 Minuten:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>Was</th><th>Preis (DE inkl. 19% MwSt)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% Gameplay (Territorien, Echos, Quests, Clans, Defense, Events)</td><td>0,00€</td></tr>
      <tr><td class="feat-name">Cosmetic-IAP</td><td>Marker-Designs, Territorium-Farben, Clan-Embleme, Skins</td><td>1,99€ &ndash; 8,99€</td></tr>
      <tr><td class="feat-name">MapRaiders Supporter (Sub)</td><td>Ehrenabzeichen, Beta-Zugang, Founder-Brief, Cosmetic-Pack monatlich</td><td>3,99€ / Monat</td></tr>
      <tr><td class="feat-name">Lifetime Supporter</td><td>Sammler-Cosmetic + Credits-Nennung</td><td>99,00€ einmalig</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Wichtig:</strong> Cosmetic-Items geben null Spielvorteile. Wer nichts kauft, spielt mit identischen Mechaniken wie Lifetime-Supporter.</p>""",
        },
        {
            "label": "Vergleich",
            "title": "Wo Pokémon GO <em>Geld kostet</em> — und wo MapRaiders nicht",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Kostenfaktor</th><th>Pokémon GO</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Battle Pass</td><td>5,99€ – 11,99€ / Saison</td><td class="check">— gibt es nicht</td></tr>
      <tr><td class="feat-name">Remote-Raid-Pass</td><td>1,99€ pro Raid</td><td class="check">— gibt es nicht</td></tr>
      <tr><td class="feat-name">Eier-Inkubator</td><td>0,79€ – 4,99€</td><td class="check">— gibt es nicht</td></tr>
      <tr><td class="feat-name">Stardust-Booster</td><td>0,99€ – 9,99€</td><td class="check">— gibt es nicht</td></tr>
      <tr><td class="feat-name">Cosmetic-Skins</td><td>1,99€ – 14,99€</td><td>1,99€ – 8,99€ (optional)</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Saudi-Frage",
            "title": "Die <em>Saudi-Niantic-Frage</em> — was passiert mit deinen Daten?",
            "body": """
    <p>Im März 2025 verkaufte Niantic seine Spiele-Sparte (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) für 3,5 Milliarden US-Dollar an Scopely. Scopely ist eine Tochter des saudischen Public Investment Fund (PIF) — also formal eine staatlich kontrollierte Einheit Saudi-Arabiens.</p>
    <p>Konkret bedeutet das: Die <strong>Standortdaten von rund 30 Millionen monatlichen Pokémon-GO-Spielern</strong> — wo sie joggen, wann sie ihren Hund Gassi führen, welche Routen sie täglich gehen — werden über Scopelys Infrastruktur verarbeitet. Welche Datentransfers das im Detail bedeutet, ist nicht öffentlich kommuniziert. Was klar ist: Es gibt keinen DSGVO-rechtlichen Schutz vor staatsfondsnahen Akteuren außerhalb der EU.</p>
    <p>MapRaiders ist eine US-LLC im <strong>Privatbesitz</strong> (Scafa Investments LLC, Florida), entwickelt von einem unabhängigen Team. Wir betreiben unsere Server EU-konform, verkaufen keine Daten, haben kein Werbenetzwerk angeschlossen und sind nicht staatlich kontrolliert.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Ist MapRaiders wirklich für immer kostenlos?",
         "a": "Ja. Das gesamte Kerngameplay — Territorien erobern, Echos hinterlassen, Quests erstellen, Clans bilden — bleibt für immer kostenlos. Es gibt kein Tier-System, keinen Battle Pass, keinen Sub-Zwang."},
        {"q": "Was kostet Cosmetic-IAP?",
         "a": "Cosmetic-Items wie Marker-Designs, Territorium-Farben oder Clan-Embleme kosten zwischen 1,99€ und 8,99€ (inkl. 19% MwSt). Sie geben null Spielvorteile, nur Optik."},
        {"q": "Gibt es Werbung in der App?",
         "a": "Nein. MapRaiders ist 100% werbefrei. Wir verkaufen weder deine Daten noch Werbeflächen."},
        {"q": "Was meint &bdquo;ohne Saudi-Investor&ldquo;?",
         "a": "Im März 2025 verkaufte Niantic seine Spiele-Sparte (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) für 3,5 Milliarden Dollar an Scopely — eine Tochter des saudischen Public Investment Fund. Die Standortdaten von 30+ Millionen monatlichen Pokémon-GO-Spielern fließen seitdem indirekt an einen ausländischen Staatsfonds. MapRaiders ist eine US-LLC im Privatbesitz und nicht staatlich kontrolliert."},
        {"q": "Wer steht hinter MapRaiders?",
         "a": "René Scafarti (Founder, Scafa Investments LLC) und ein kleines unabhängiges Team. Keine Investoren, keine Staaten, kein Werbenetzwerk."},
    ],
    "internal_links": [
        ("/spiele-wie-pokemon-go.html", "Spiele wie Pokémon GO im Vergleich"),
        ("/standort-spiel.html", "GPS-Standort-Spiel auf dem Handy"),
        ("/datenschutz.html", "Datenschutz & DSGVO bei MapRaiders"),
        ("/pokemon-go-alternative-erfahrungen.html", "Erfahrungsberichte zur Alternative"),
        ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
    ],
}

K3 = {
    "slug": "/territorium-spiel.html",
    "breadcrumb": "Territorium-Spiel",
    "title": "Territorium-Spiel — echte Karten erobern auf dem Handy",
    "og_title": "Territorium-Spiel — Land-Eroberung in der echten Welt",
    "meta": "Was ist ein Territorium-Spiel? MapRaiders ist das einzige GPS-MMO mit persistentem Land-Besitz. Werbefrei, kostenlos, DSGVO-konform. Erobere deine Straße, dein Viertel, deine Stadt.",
    "keywords": "territorium spiel, territorien spiel, land erobern app, gps territorium, territory game deutsch",
    "badge": "Territory Game",
    "pricing_pill": "Kostenlos · Cosmetic optional",
    "h1_html": 'Territorium-Spiel — die einzige App, in der dir <em>echtes Land</em> wirklich gehört',
    "lead": "Ein Territorium-Spiel sollte mehr sein als ein Punkt auf einer Karte, der nach 5 Minuten wieder verschwindet. MapRaiders verbindet GPS, persistente Land-Erfassung und ein Verteidigungs-System, das echte Eroberung möglich macht. Du gehst durch eine Straße — sie gehört dir. Solange du sie verteidigst.",
    "trigger": {
        "quote": "Mein Hund kennt seine 5 Lieblings-Echos. Ich kenne mein Territorium.",
        "author": "Ron C., Hundebesitzer aus dem Stuttgart-Raum (geschlossene Beta)"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Definition",
            "title": "Was ein <em>echtes Territorium-Spiel</em> ausmacht",
            "body": """
    <p><strong>Ein Territorium-Spiel</strong> ist ein Spiel, in dem Spieler dauerhaft beanspruchte Flächen auf einer Karte besitzen, verteidigen und ausbauen. Im Unterschied zu Capture-Spielen (Gym, Portal) bleibt der Besitz <strong>persistent</strong> — auch wenn der Spieler offline ist.</p>
    <p>Die vier Mechaniken, die ein echtes Territorium-Spiel ausmachen:</p>
    <ul>
      <li><strong>Persistenz.</strong> Eroberte Flächen bleiben dem Spieler oder Clan zugeordnet, bis sie aktiv übernommen werden.</li>
      <li><strong>Decay.</strong> Inaktive Territorien schrumpfen mit der Zeit — niemand blockiert dauerhaft, ohne aktiv zu spielen.</li>
      <li><strong>Defense.</strong> Bei einem Angriff entscheidet ein Mini-Game zwischen den beiden Spielern — nicht ein automatischer Stat-Vergleich.</li>
      <li><strong>Clan-Übergaben.</strong> Territorien lassen sich an Mitspieler oder einen Clan übertragen — wirtschaftliche Tiefe.</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders im Detail",
            "title": "Das <em>Territorium-System</em> von MapRaiders",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Beanspruchen</h3><p>Geh zu Fuß, mit dem Hund oder dem Rad durch eine Straße. Die GPS-Spur erzeugt das Territorium auf deinem Namen — als sichtbares Polygon auf der Karte.</p></div>
    <div class="feat-card rv d1"><h3>Decay-Engine</h3><p>Wer ein Territorium nicht regelmäßig begeht, sieht es täglich um wenige Prozent schrumpfen. Aktivität hält das Land — nicht Bezahlung.</p></div>
    <div class="feat-card rv d2"><h3>Defense-Mini-Games</h3><p>7 verschiedene Mini-Games entscheiden Angriffe: Tic-Tac-Toe, Stein-Schere-Papier, Mini-Schach. Strategie zählt mehr als reine Spielzeit.</p></div>
    <div class="feat-card rv d3"><h3>Clan-Territorien</h3><p>Mehrere Spieler können ein Territorium gemeinsam halten. Clan-Gebiete sind robuster — ein einzelner Angreifer reicht nicht zum Durchbrechen.</p></div>
  </div>""",
        },
        {
            "label": "Abgrenzung",
            "title": "Warum Pokémon GO und Ingress <em>keine echten Territorium-Spiele</em> sind",
            "body": """
    <p><strong>Pokémon GO Gym-Captures</strong> sind flüchtig: Wer eine Bestzeit über mehrere Stunden hält, gewinnt Münzen — aber das Territorium selbst lässt sich nicht im Sinne von Land-Besitz verstehen. Das Gym ist ein Punkt, kein Gebiet.</p>
    <p><strong>Ingress-Portals</strong> sind ähnlich: Punkte, die mit Links zu Dreiecken verbunden werden. Das Spiel kennt Felder zwischen Portalen, aber kein persistentes Land-Eigentum. Wer die App eine Woche nicht öffnet, verliert nicht „sein Viertel" — es war ihm nie wirklich zugeordnet.</p>
    <p>MapRaiders setzt an genau dieser Stelle an: Das <strong>Territorium ist die Spielressource</strong>, nicht der Punkt darauf. Du gewinnst Land, du verlierst Land, du übergibst Land — wie in einem echten räumlichen Spiel.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Wie funktioniert das Territorien-System in MapRaiders?",
         "a": "Du gehst physisch durch Straßen und beanspruchst GPS-Gebiete. Diese Territorien erscheinen auf der Live-Karte und gehören dir — solange kein anderer Spieler vorbeikommt und dich herausfordert. Verteidigst du erfolgreich, bleibt das Gebiet deins."},
        {"q": "Kann ich mein Territorium verlieren?",
         "a": "Ja. Das Territory-Decay-System sorgt dafür, dass inaktive Gebiete täglich schrumpfen. Wer aktiv bleibt und sein Revier regelmäßig begeht, hält es. Wer aufhört, verliert. Das hält die Karte lebendig."},
        {"q": "Was passiert bei einem Territorial-Angriff?",
         "a": "Der Angreifer muss physisch zu deinem Territorium kommen. Dann startet ein interaktives Mini-Game — Verteidiger und Angreifer spielen gegeneinander. Wer das Mini-Game gewinnt, entscheidet über das Schicksal des Gebiets."},
        {"q": "Gibt es ein Clan-Territorien-System?",
         "a": "Ja. Clans in MapRaiders entstehen organisch und können gemeinsam Territorien beanspruchen. Clan-Gebiete sind stärker und brauchen mehrere Angreifer, um sie zu brechen. Teamarbeit zahlt sich aus."},
        {"q": "Kostet das Territorium-Spiel etwas?",
         "a": "Nein. Das gesamte Territorium-Gameplay ist kostenlos. Optional gibt es Cosmetic-Items (1,99€ – 8,99€) für Marker-Designs und Territorium-Farben — sie geben keine Spielvorteile."},
    ],
    "internal_links": [
        ("/standort-spiel.html", "GPS-Standort-Spiel auf dem Handy"),
        ("/spiele-wie-pokemon-go.html", "Spiele wie Pokémon GO im Vergleich"),
        ("/gps-spiel-deutschland.html", "GPS-Spiel aus Deutschland"),
        ("/territorium-spiel-erfahrungen.html", "Erfahrungen mit dem Territorium-Spiel"),
        ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
    ],
}

K4 = {
    "slug": "/standort-spiel.html",
    "breadcrumb": "Standort-Spiel",
    "title": "Standort-Spiel — GPS-MMO mit echten Karten und echtem Land",
    "og_title": "Standort-Spiel — die echte Karte als Spielfeld",
    "meta": "Standort-Spiel auf dem Handy? MapRaiders ist das werbefreie GPS-MMO, in dem du echtes Land eroberst. Kein AR, kein P2W, DSGVO-konform aus Deutschland.",
    "keywords": "standort spiel, gps standort spiel, location based game deutsch, geospiel, standort game",
    "badge": "Location-Based Game",
    "pricing_pill": "Free Forever · Cosmetic optional",
    "h1_html": 'Standort-Spiel — wenn die <em>echte Karte</em> zu deinem Spielfeld wird',
    "lead": "Ein Standort-Spiel macht aus einer Stadt einen Spielplatz: GPS-Trigger, Geo-Fences, Karten-Layer. Aber während die meisten Apps Standortdaten nur für Werbung sammeln, baut MapRaiders ein echtes räumliches Spiel auf — mit Territorien, Echos, Quests und Defense-Mini-Games.",
    "trigger": {
        "quote": "Die Karte ist das soziale Netzwerk — räumliche Nähe statt Algorithmus.",
        "author": "René Scafarti, Founder"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Was ist das?",
            "title": "Wie <em>Standort-Spiele</em> funktionieren",
            "body": """
    <p><strong>Ein Standort-Spiel (Location-Based Game)</strong> nutzt die GPS-Position des Geräts, um Spielmechaniken auszulösen. Drei Bausteine sind klassisch:</p>
    <ul>
      <li><strong>GPS-Trigger.</strong> Erreichst du eine Koordinate, passiert etwas — ein Item erscheint, ein Event startet, ein Territorium wird beansprucht.</li>
      <li><strong>Geo-Fences.</strong> Unsichtbare Zonen auf der Karte (Parks, Plätze, Stadtviertel), die als Spielzonen funktionieren.</li>
      <li><strong>Karten-Layer.</strong> Sichtbare Spielinhalte (Echos, Markierungen, Territorien) liegen auf der echten OpenStreetMap-Welt.</li>
    </ul>
            """,
        },
        {
            "label": "Was ist anders?",
            "title": "MapRaiders als Standort-Spiel — <em>was anders ist</em>",
            "body": """
    <p>Die meisten Standort-Spiele kennen nur Sammeln (Pokémon GO) oder Stempeln (Geocaching). MapRaiders kombiniert <strong>vier Spiel-Schichten</strong>, die ineinandergreifen:</p>
            """,
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territorien</h3><p>Eroberte Flächen, persistent zugeordnet, mit Decay-Engine.</p></div>
    <div class="feat-card rv d1"><h3>Echos</h3><p>Audio-, Foto- oder Video-Signale, die andere Spieler entdecken — die räumliche Schnitzeljagd.</p></div>
    <div class="feat-card rv d2"><h3>Quests</h3><p>Mini-Aufgaben, die Spieler füreinander erstellen — die Stadt als kollaboratives Spielfeld.</p></div>
    <div class="feat-card rv d3"><h3>Defense-Mini-Games</h3><p>Tic-Tac-Toe, Mini-Schach, Stein-Schere-Papier — Strategie statt automatischer Kämpfe.</p></div>
  </div>""",
        },
        {
            "label": "Personas",
            "title": "Die <em>4 Personas</em> in einem Standort-Spiel",
            "body": "<p>MapRaiders wird täglich von vier sehr unterschiedlichen Persona-Gruppen genutzt. Die App bedient alle gleichzeitig, weil das Kern-Loop universell ist:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Hundebesitzer</h3><p>10,7 Mio Hunde in DE — die tägliche Runde wird zum Territorium-Halten.</p></div>
    <div class="feat-card rv d1"><h3>Jogger / Walker</h3><p>Cardio bekommt ein Ziel: Eroberung statt nur Strecke.</p></div>
    <div class="feat-card rv d2"><h3>Stadt-Erkunder</h3><p>Echos legen, Quests bauen, Ecken entdecken, die niemand sonst kennt.</p></div>
    <div class="feat-card rv d3"><h3>Familien</h3><p>Schnitzeljagd-Modus, Eltern-Kind-Aktivität, screen-frei in der echten Welt.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Was ist ein Standort-Spiel?",
         "a": "Ein Standort-Spiel (Location-Based Game) nutzt deine GPS-Position für Spielmechaniken. MapRaiders verwendet GPS, um Territorien, Echos und Quests an reale Orte zu binden — die echte Stadt wird zum Spielfeld."},
        {"q": "Brauche ich Augmented Reality?",
         "a": "Nein. MapRaiders ist bewusst AR-frei. Es nutzt nur GPS und die Karte. Das schont Akku und Privatsphäre — keine Kamera, keine Gesichtsbilder."},
        {"q": "Funktioniert das in jeder Stadt?",
         "a": "Ja, weltweit überall, wo OpenStreetMap-Daten existieren. In urbanen Regionen funktioniert das Spiel besonders dicht; in ländlichen Gebieten weniger Wettbewerb, dafür größere Territorien."},
        {"q": "Werden meine Standortdaten gespeichert?",
         "a": "Nur soweit nötig für das Spiel. Wir sind DSGVO-konform, verkaufen keine Daten, haben kein Werbenetzwerk angeschlossen."},
        {"q": "Was kostet die App?",
         "a": "Das Kerngameplay ist kostenlos. Cosmetic-Items (1,99€ – 8,99€) geben keine Spielvorteile, nur Optik."},
    ],
    "internal_links": [
        ("/territorium-spiel.html", "echtes Territorium-Spiel"),
        ("/gps-spiel-deutschland.html", "GPS-Spiel aus Deutschland"),
        ("/handyspiel-zum-laufen.html", "Handyspiel zum Laufen"),
        ("/standort-spiel-erfahrungen.html", "Erfahrungen Standort-Spiel"),
        ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
    ],
}

K5 = {
    "slug": "/gps-spiel-deutschland.html",
    "breadcrumb": "GPS-Spiel Deutschland",
    "title": "GPS-Spiel Deutschland — werbefrei, DSGVO-konform, kostenlos",
    "og_title": "GPS-Spiel aus Deutschland — werbefrei + DSGVO-konform",
    "meta": "Du suchst ein GPS-Spiel aus Deutschland? MapRaiders ist das DSGVO-konforme GPS-MMO ohne Werbung, ohne P2W, ohne Saudi-Investor. Erobere echtes Land in jeder deutschen Stadt.",
    "keywords": "gps spiel, gps spiel deutschland, gps mmo deutsch, dsgvo gps spiel, werbefreies gps spiel",
    "badge": "GPS-Spiel · Heimspielfeld",
    "pricing_pill": "Free Forever · DSGVO-konform · 19% MwSt inkl.",
    "h1_html": 'GPS-Spiel Deutschland — die <em>werbefreie Alternative</em> aus dem Heimspielfeld',
    "lead": "Die meisten GPS-Spiele in den deutschen App-Stores sind US-amerikanisch oder asiatisch — und seit März 2025 zu großen Teilen saudisch (Niantic-Acquisition). MapRaiders ist anders: DSGVO-konform, in Deutschland mitentwickelt, unabhängig finanziert, ohne Werbenetzwerk.",
    "trigger": {
        "quote": "Aus Berlin nach Hamburg auf einer Karte — gleicher Spielstand, andere Straßen.",
        "author": "MapRaiders-Spielprinzip"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Definition",
            "title": "Was ein <em>GPS-Spiel</em> ist",
            "body": """
    <p>Ein GPS-Spiel nutzt die geografische Position deines Geräts als Kern-Spielmechanik. Im Unterschied zu AR-Spielen, die zusätzlich die Kamera benötigen, kommt ein reines GPS-Spiel mit der Karte aus — was Akku spart und Privatsphäre schützt.</p>
    <p>MapRaiders ist ein <strong>GPS-MMO</strong>: Mehrere tausend Spieler bewegen sich gleichzeitig auf derselben Karte, treten in Echtzeit gegeneinander an und teilen ein gemeinsames Territorium-System. Kein AR, keine Kamera, keine VR-Brille.</p>
            """,
        },
        {
            "label": "Heimspielfeld",
            "title": "Warum ein GPS-Spiel <em>aus Deutschland</em> anders ist",
            "body": """
    <p>Drei Trust-Faktoren machen den Unterschied:</p>
    <ul>
      <li><strong>DSGVO ist nicht Marketing-Sprech.</strong> Wir betreiben EU-konforme Server, verkaufen keine Daten, haben kein Werbe-SDK eingebunden. Auskunfts- und Löschungsanfragen werden in 30 Tagen bearbeitet.</li>
      <li><strong>Kein Saudi-Eigentümer.</strong> Scafa Investments LLC ist privat geführt — keine Verbindung zu Niantic, Scopely oder dem saudischen Public Investment Fund.</li>
      <li><strong>Deutscher Founder.</strong> René Scafarti ist deutsch-sprachig, lebt teils in Deutschland, kennt den Markt aus eigener Erfahrung. Founder-Kommunikation läuft direkt — keine PR-Agentur dazwischen.</li>
    </ul>
            """,
        },
        {
            "label": "Städte",
            "title": "MapRaiders in <em>deutschen Städten</em>",
            "body": "<p>In urbanen Regionen ist die Spielerdichte am höchsten — dort entstehen die intensivsten Territorial-Kämpfe und Clan-Bildungen. Beta-Tester in den folgenden Räumen:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Berlin</h3><p>Stadt-Erkunder-Persona stark vertreten — Echos in Friedrichshain, Kreuzberg, Mitte.</p></div>
    <div class="feat-card rv d1"><h3>Hamburg</h3><p>Jogger-Persona dominiert — Alster-Runde wird zur täglichen Eroberung.</p></div>
    <div class="feat-card rv d2"><h3>München</h3><p>Hundebesitzer-Cluster im Englischen Garten — Audio-Echos auf jeder Wiese.</p></div>
    <div class="feat-card rv d3"><h3>Köln &amp; Frankfurt</h3><p>Wachsend, mit ersten Clan-Bildungen entlang der U-Bahn-Linien.</p></div>
  </div>""",
        },
        {
            "label": "Saison-Hooks",
            "title": "Lokale <em>Saison-Hooks</em> in Deutschland",
            "body": """
    <p>MapRaiders integriert lokale Saison-Events, die zu deutschen Anlässen passen — keine US-Holidays, kein asiatischer New-Year-Bonus:</p>
    <ul>
      <li><strong>Mai-Spaziergang.</strong> Doppelte Territorium-Punkte am 1. Mai für jede begangene Straße.</li>
      <li><strong>Tag der Deutschen Einheit (3. Oktober).</strong> Cross-City-Events zwischen Ost- und West-Clans.</li>
      <li><strong>Halloween-Schnitzeljagd.</strong> Echos mit Halloween-Geräuschen, Familien-Modus aktiv.</li>
      <li><strong>Adventszeit.</strong> Adventskalender-Echos in jeder Stadt — täglich ein neues Audio-Geschenk.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Wer entwickelt MapRaiders in Deutschland?",
         "a": "MapRaiders wird von einem unabhängigen Team unter René Scafarti (Founder) entwickelt. Die Firma Scafa Investments LLC ist US-registriert (Florida); Founder und Kernteam arbeiten teils aus Deutschland. Wir sind DSGVO-konform und behandeln deutsche Nutzerdaten nach EU-Recht."},
        {"q": "Werden meine Daten in Deutschland gespeichert?",
         "a": "Wir speichern Nutzerdaten auf EU-konformen Servern. Keine Datenverkäufe an Werbenetzwerke, keine Weitergabe an Drittstaaten ohne Einwilligung. Details siehe Datenschutz-Seite."},
        {"q": "Funktioniert MapRaiders überall in Deutschland?",
         "a": "Ja. Sobald OpenStreetMap-Daten vorhanden sind (also überall in DE), funktioniert das Spiel. In Großstädten höhere Spielerdichte, auf dem Land größere Territorien."},
        {"q": "Gibt es eine deutsche Support-Hotline?",
         "a": "Support läuft per E-Mail an info@scafa-investments.com. Antworten in der Regel binnen 24-48 Stunden, auf Deutsch. Eine Telefon-Hotline ist als Beta-Phase nicht eingerichtet."},
        {"q": "Ist 19% MwSt im Cosmetic-Preis enthalten?",
         "a": "Ja. Alle Preise (1,99€ – 8,99€) sind inkl. 19% deutscher Mehrwertsteuer. Keine versteckten Aufschläge."},
    ],
    "internal_links": [
        ("/standort-spiel.html", "GPS-Standort-Spiel auf dem Handy"),
        ("/territorium-spiel.html", "echtes Territorium-Spiel"),
        ("/datenschutz.html", "Datenschutz & DSGVO bei MapRaiders"),
        ("/gps-spiel-erfahrungen.html", "Erfahrungen mit dem GPS-Spiel"),
        ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
    ],
}

K6 = {
    "slug": "/schnitzeljagd-app.html",
    "breadcrumb": "Schnitzeljagd-App",
    "title": "Schnitzeljagd-App — live + werbefrei + ohne Vorbereitung",
    "og_title": "Schnitzeljagd-App — Live-Schnitzeljagd ohne Aufwand",
    "meta": "Du suchst eine Schnitzeljagd-App? MapRaiders ist die werbefreie Live-Schnitzeljagd für die ganze Stadt — kein Vorbereitungs-Aufwand, kein Tour-Kauf, einfach loslegen.",
    "keywords": "schnitzeljagd app, schnitzeljagd handy, live schnitzeljagd, schnitzeljagd stadt, schnitzeljagd familie, schnitzeljagd kostenlos",
    "badge": "Schnitzeljagd-App",
    "pricing_pill": "Free Forever · keine Tour-Käufe",
    "h1_html": 'Schnitzeljagd-App — eine <em>Stadt voller Spuren</em>, jederzeit',
    "lead": "Klassische Schnitzeljagd-Apps wie Actionbound oder Anyfox verlangen Vorbereitung: Tour kaufen, Stationen einrichten, Material drucken. MapRaiders dreht das um — Echos sind bereits in der ganzen Stadt verteilt. Du folgst Spuren anderer Spieler oder hinterlässt eigene. Live, kostenlos, ohne Vorlauf.",
    "trigger": {
        "quote": "Eine offene Schnitzeljagd durch die ganze Stadt — du legst die Spuren.",
        "author": "Aljoscha P., Stadt-Erkunder aus dem Berlin-Raum (geschlossene Beta)"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "Was zählt?",
            "title": "Was eine moderne <em>Schnitzeljagd-App</em> ausmachen sollte",
            "body": """
    <p>Drei Kriterien trennen die Schnitzeljagd-Apps der 2020er von Print-Out-Lösungen:</p>
    <ul>
      <li><strong>Live.</strong> Spuren entstehen in Echtzeit, nicht nur in vorgefertigten Touren.</li>
      <li><strong>Sozial.</strong> Spieler legen Spuren füreinander, statt sie nur abzuarbeiten.</li>
      <li><strong>Ohne Premium-Hürde.</strong> Eltern und Kinder kommen sofort rein, ohne 4,99€-Tour zu kaufen.</li>
    </ul>
            """,
        },
        {
            "label": "Vergleich",
            "title": "Schnitzeljagd-Apps im <em>Vergleich</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>Preis</th><th>Vorbereitung</th><th>Live-Element</th><th>Game-Loop</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Actionbound</td><td>Bound-Käufe / Sub</td><td>Hoch — Tour bauen</td><td class="cross">✗</td><td>Pro-Tour</td></tr>
      <tr><td class="feat-name">Anyfox</td><td>Premium-Sub</td><td>Mittel — Inhalte kaufen</td><td class="cross">✗</td><td>Pro-Tour</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Premium-Sub</td><td>Niedrig — Caches finden</td><td class="cross">Asynchron</td><td>Sammeln</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">0,00€</td><td class="check">Null</td><td class="check">Live</td><td>Echos + Quests + Territorium</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Wie wir Schnitzeljagd neu denken",
            "title": "Wie MapRaiders <em>Schnitzeljagd neu denkt</em>",
            "body": """
    <p>Statt einer linearen Tour von Station 1 bis Station 10 entsteht in MapRaiders eine <strong>offene räumliche Schnitzeljagd</strong> — die Stadt selbst ist der Spielplatz:</p>
    <ul>
      <li><strong>Echos legen.</strong> Hinterlasse ein Audio-, Foto- oder Video-Echo an einem Ort. Andere Spieler entdecken es, wenn sie vorbeikommen.</li>
      <li><strong>Echos finden.</strong> Sieh auf der Karte, wo Echos liegen. Folge den Spuren, finde Geheimnisse, hör Geschichten.</li>
      <li><strong>Quests bauen.</strong> Erstelle eine kleine Aufgabe an einem Ort („Mach ein Foto der roten Tür dort drüben"). Andere Spieler erfüllen sie.</li>
      <li><strong>Territorium-Layer.</strong> Wer eine Schnitzeljagd-Route oft läuft, erobert sie als Territorium — die Spuren werden zum Land.</li>
    </ul>
            """,
        },
        {
            "label": "Familien-Modus",
            "title": "Schnitzeljagd-App für <em>Familien</em>",
            "body": """
    <p>Schnitzeljagd ist deutsche Kindheits-Kultur — Pfeile mit Kreide, Blätter-Spuren, das letzte Versteck mit Schokolade. MapRaiders bringt das ins Smartphone-Zeitalter, ohne Kinder allein vor den Bildschirm zu setzen:</p>
    <ul>
      <li><strong>Eltern-Kind-Aktivität.</strong> Eltern legen Audio-Echos auf einer geplanten Route, Kinder folgen den Spuren — analoge Bewegung, digitale Hinweise.</li>
      <li><strong>Screen-frei in Bewegung.</strong> Die App leitet auf der Karte; das Erleben passiert in der echten Welt.</li>
      <li><strong>DSGVO-konform für Kinder.</strong> Kein personalisierter Werbe-Tracker, keine Datenverkäufe, kein In-App-Chat ohne Eltern-Freigabe.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Ist MapRaiders für Kinder geeignet?",
         "a": "Ja, ab 9 Jahren mit Eltern-Begleitung. Die App ist DSGVO-konform, werbefrei und sammelt keine personenbezogenen Daten von Kindern. Eltern können einen Familien-Modus aktivieren."},
        {"q": "Wie viel Vorbereitung brauche ich für eine Schnitzeljagd mit Kindern?",
         "a": "Null. Anders als bei Actionbound oder Anyfox musst du keine Tour kaufen oder Stationen vorbereiten. Echos sind bereits in der ganzen Stadt verteilt — du folgst einfach den Spuren anderer Spieler oder hinterlässt eigene."},
        {"q": "Kostet die Schnitzeljagd-App etwas?",
         "a": "Nein. Die Schnitzeljagd-Funktionen (Echos legen, Echos finden, Quests bauen) sind komplett kostenlos. Optional gibt es Cosmetic-Items für Marker-Designs ab 1,99€ — sie geben keine Spielvorteile."},
        {"q": "Funktioniert die Schnitzeljagd auch in kleinen Städten?",
         "a": "Ja. Auch in kleinen Städten oder Dörfern kannst du Echos legen und Quests bauen. In dichteren Regionen findest du mehr Spuren von anderen Spielern; auf dem Land hat dafür deine eigene Tour mehr Raum."},
        {"q": "Ist die App auf Deutsch?",
         "a": "Ja. MapRaiders ist vollständig auf Deutsch lokalisiert — Menüs, Echos-System, Hinweise, Support."},
    ],
    "internal_links": [
        ("/spiele-wie-pokemon-go.html", "Spiele wie Pokémon GO im Vergleich"),
        ("/standort-spiel.html", "GPS-Standort-Spiel auf dem Handy"),
        ("/schnitzeljagd/", "Schnitzeljagd-Nische bei MapRaiders"),
        ("/schnitzeljagd-app-erfahrungen.html", "Erfahrungen mit der Schnitzeljagd-App"),
        ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
    ],
}

K7 = {
    "slug": "/handyspiel-zum-laufen.html",
    "breadcrumb": "Handyspiel zum Laufen",
    "title": "Handyspiel zum Laufen — Cardio + Territorium-Eroberung",
    "og_title": "Handyspiel zum Laufen — wenn jede Runde ein Ziel hat",
    "meta": "Du suchst ein Handyspiel zum Laufen oder Joggen? MapRaiders verwandelt jede Strecke in eine Territorium-Eroberung — werbefrei, akku-schonend, ohne Premium-Sub.",
    "keywords": "handyspiel zum laufen, joggen handyspiel, laufen mit ziel, cardio app, handyspiel beim joggen",
    "badge": "Cardio-Spiel",
    "pricing_pill": "Free Forever · 4× weniger Akku als Pokémon GO",
    "h1_html": 'Handyspiel zum Laufen — wenn jede <em>Runde ein Ziel</em> hat',
    "lead": "Lauf-Apps geben Stats. Lauf-Spiele wie Pokémon GO geben Sammlung. Aber kein Spiel verwandelt deinen tatsächlichen Lauf-Weg in echtes Land. MapRaiders schon: Jeder Schritt formt Territorium, jede Runde verteidigt es. Cardio mit Konsequenz.",
    "trigger": {
        "quote": "Mein Cardio-Antrieb ist explodiert, seit jede Runde eine Eroberung ist.",
        "author": "Vivian N., Joggerin aus dem Hamburg-Raum (geschlossene Beta)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "Das Problem",
            "title": "Warum klassische <em>Lauf-Apps</em> nicht reichen",
            "body": """
    <p>Strava, Nike Run Club, Adidas Running — sie messen Zeit, Distanz, Pace. Aber drei Punkte fehlen für viele Läufer:</p>
    <ul>
      <li><strong>Kein Spiel-Element.</strong> Wer keine Bestzeiten jagt, hat nach 4 Wochen keine Motivation mehr.</li>
      <li><strong>Performance-Pressure.</strong> Public-Leaderboards sind für viele eher demotivierend als anspornend.</li>
      <li><strong>Sub-Zwang.</strong> Strava Premium 8,99€ / Monat für Heatmaps und Routen-Vergleiche, die im Free-Tier nutzlos werden.</li>
    </ul>
            """,
        },
        {
            "label": "Die Lösung",
            "title": "Wie MapRaiders deine <em>Lauf-Routine</em> verändert",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territorium halten</h3><p>Jede Strecke verteidigt Land. Wer 3 Tage pausiert, sieht Decay einsetzen — natürlicher Wiedereinstiegs-Anreiz.</p></div>
    <div class="feat-card rv d1"><h3>Decay-Counter</h3><p>Der Decay-Wert zeigt: „Wenn du heute nicht läufst, schrumpft dein Viertel um X%". Kein Schuldgefühl — einfach physische Realität.</p></div>
    <div class="feat-card rv d2"><h3>Clan-Defense während du läufst</h3><p>Während du joggst, bekommst du Push-Notifications, wenn Clan-Territorium angegriffen wird. Du läufst nicht allein — du läufst mit.</p></div>
    <div class="feat-card rv d3"><h3>Echo-Belohnung</h3><p>Audio-Echos beim Vorbeilaufen. Andere Spieler erzählen dir Geschichten der Strecke — keine Werbung, keine Influencer.</p></div>
  </div>""",
        },
        {
            "label": "Cross-Persona",
            "title": "Joggen, Walking, Radfahren — <em>alles auf einer Karte</em>",
            "body": """
    <p>MapRaiders unterscheidet nicht nach Sportart. Wer joggt, walkt mit dem Hund oder radelt zur Arbeit — die GPS-Spur formt Territorium, die App ist agnostisch:</p>
    <ul>
      <li><strong>Joggen.</strong> Schnellere Strecken, größere Territorien pro Runde.</li>
      <li><strong>Walking / Hund.</strong> Tägliche Wiederholung erhält das Territorium. Cardio-niedrig, Eroberungs-stabil.</li>
      <li><strong>Radfahren.</strong> Größere Territorien pro Tag, langsame Geschwindigkeit (unter 25 km/h gilt als gültig — kein Auto-Cheat).</li>
    </ul>
            """,
        },
        {
            "label": "Akku",
            "title": "Akku-Optimierung für <em>lange Strecken</em>",
            "body": """
    <p>Pokémon GO ist berühmt dafür, Akkus in 90 Minuten zu zerlegen — vor allem mit AR. MapRaiders ist auf Effizienz gebaut:</p>
    <ul>
      <li><strong>Kein AR.</strong> Keine Kamera, keine GPU-Last für Augmented-Reality-Rendering.</li>
      <li><strong>GPS-Polling-Optimierung.</strong> Niedrigere Sample-Rate während Standzeiten, höhere bei aktiver Bewegung.</li>
      <li><strong>Karten-Cache.</strong> OpenStreetMap-Tiles werden gecached, kein ständiger Daten-Pull bei langen Routen.</li>
      <li><strong>Resultat:</strong> Rund 4× längere Akku-Laufzeit als Pokémon GO bei vergleichbarer Strecke.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Wie lange hält mein Akku?",
         "a": "Bei 2-Stunden-Lauf typischerweise 30-40% Akku-Verbrauch (vs. ~80% bei Pokémon GO mit AR). Die Werte schwanken nach Gerät und Display-Helligkeit."},
        {"q": "Funktioniert MapRaiders mit Strava oder Nike Run Club?",
         "a": "Aktuell keine direkte Integration. Strava-Export ist auf der Roadmap für Q4 2026. Du kannst aber beide Apps parallel laufen lassen — sie nutzen denselben GPS-Sensor ohne Konflikt."},
        {"q": "Ist Walking auch erlaubt?",
         "a": "Ja. Es gibt keine Mindest-Geschwindigkeit. Walking, Joggen, Wandern, Radfahren — alles formt Territorium, solange du dich physisch bewegst (kein Auto-Cheating)."},
        {"q": "Was passiert, wenn ich krank bin und nicht laufen kann?",
         "a": "Decay läuft weiter, aber langsam. Bei 5-7 Tagen Pause schrumpft das Territorium spürbar; nach 14 Tagen kann es vollständig verloren sein. Clan-Übergaben helfen, Land zu sichern, wenn du ausfällst."},
        {"q": "Verbrennt das Spiel mein Datenvolumen?",
         "a": "Sehr moderat. Kein Live-Video, keine Hochlast-API. Eine 1-Stunden-Route verbraucht typischerweise 5-15 MB Daten."},
    ],
    "internal_links": [
        ("/spiele-wie-pokemon-go.html", "Spiele wie Pokémon GO im Vergleich"),
        ("/jogging/", "Joggen mit Ziel"),
        ("/fitness-mmo/", "Cardio mit Eroberung"),
        ("/handyspiel-laufen-erfahrungen.html", "Erfahrungen mit Handyspiel zum Laufen"),
        ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/pokemon-go-alternative-erfahrungen.html",
        "breadcrumb": "Pokémon-GO-Alternative Erfahrungen",
        "title": "Pokémon-GO-Alternative Erfahrungen — Beta-Tester berichten",
        "og_title": "Erfahrungen mit der Pokémon-GO-Alternative MapRaiders",
        "meta": "Pokémon-GO-Alternative Erfahrungen aus der MapRaiders-Beta: drei Tester aus Stuttgart, Hamburg und Berlin berichten ehrlich über Cardio, Hund-Runden und Stadt-Erkundung.",
        "keywords": "pokemon go alternative erfahrungen, mapraiders erfahrungen, gps spiel test, beta tester bericht",
        "h1_html": 'Pokémon-GO-Alternative — <em>echte Erfahrungen</em> aus der Beta',
        "lead": "Drei Beta-Tester aus drei deutschen Großstadt-Räumen haben MapRaiders über mehrere Wochen genutzt. Hier ihre ungeschönten Berichte — keine Marketing-Floskeln, keine Influencer-Codes.",
        "intro_label": "Wer testet hier?",
        "intro_title": "Drei Personen, drei <em>Use-Cases</em>",
        "intro_body": """
    <p>Die drei Beta-Tester decken drei sehr unterschiedliche Personas ab — und genau das macht den Vergleich zu Pokémon GO ehrlich:</p>
    <ul>
      <li><strong>Ron C.</strong> aus dem Stuttgart-Raum: Hundebesitzer, tägliche Runde, kein Gamer-Hintergrund.</li>
      <li><strong>Vivian N.</strong> aus dem Hamburg-Raum: Joggerin, hat Pokémon GO 2018 ausprobiert und nach 3 Monaten aufgehört.</li>
      <li><strong>Aljoscha P.</strong> aus dem Berlin-Raum: Stadt-Erkunder, Ingress-Veteran, kennt das Niantic-Ökosystem aus erster Hand.</li>
    </ul>
    <p>Alle drei haben MapRaiders unabhängig getestet — keine bezahlte Promotion, keine Skripte. Die Quotes sind original auf Deutsch verfasst.</p>
        """,
        "internal_links": [
            ("/pokemon-go-alternative-kostenlos.html", "Pokémon-GO-Alternative kostenlos"),
            ("/spiele-wie-pokemon-go.html", "Spiele wie Pokémon GO im Vergleich"),
            ("/spiele-wie-pokemon-go-erfahrungen.html", "Erfahrungen Spiele wie Pokémon GO"),
            ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
        ],
    },
    {
        "slug": "/spiele-wie-pokemon-go-erfahrungen.html",
        "breadcrumb": "Spiele wie Pokémon GO Erfahrungen",
        "title": "Spiele wie Pokémon GO Erfahrungen — MapRaiders im Beta-Test",
        "og_title": "Erfahrungen Spiele wie Pokémon GO — MapRaiders Beta",
        "meta": "Erfahrungen mit Spielen wie Pokémon GO: Drei Beta-Tester aus Deutschland berichten über MapRaiders — Territorium-System, Echos und Defense-Mini-Games im echten Alltagstest.",
        "keywords": "spiele wie pokemon go erfahrungen, pokemon go alternative test, gps mmo test, mapraiders test",
        "h1_html": 'Spiele wie Pokémon GO — <em>Erfahrungen aus der Beta</em>',
        "lead": "Was passiert, wenn ein Pokémon-GO-Veteran, eine Joggerin und ein Hundebesitzer dieselbe GPS-MMO-Alternative testen? Drei sehr unterschiedliche Berichte aus der MapRaiders-Beta.",
        "intro_label": "Test-Setting",
        "intro_title": "Wie wir <em>getestet</em> haben",
        "intro_body": """
    <p>Die drei Tester haben MapRaiders 4-6 Wochen lang in ihrer normalen Routine genutzt — keine künstlichen Test-Sessions, keine sponsored Content. Konkret:</p>
    <ul>
      <li><strong>Tägliche Nutzung</strong> in den eigenen Stadt-Raum (Stuttgart, Hamburg, Berlin).</li>
      <li><strong>Direkter Vergleich</strong> zu Pokémon GO bei Aljoscha P. (paralleles Spielen 2 Wochen).</li>
      <li><strong>Akku-Messung</strong> über App-Settings: durchschnittlicher Verbrauch pro Stunde.</li>
      <li><strong>Honest-Feedback-Regel:</strong> Bugs, Frust und Wünsche werden mitgenannt, nicht nur Highlights.</li>
    </ul>
        """,
        "internal_links": [
            ("/spiele-wie-pokemon-go.html", "Spiele wie Pokémon GO im Vergleich"),
            ("/pokemon-go-alternative-kostenlos.html", "Pokémon-GO-Alternative kostenlos"),
            ("/pokemon-go-alternative-erfahrungen.html", "Pokémon-GO-Alternative Erfahrungen"),
            ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
        ],
    },
    {
        "slug": "/territorium-spiel-erfahrungen.html",
        "breadcrumb": "Territorium-Spiel Erfahrungen",
        "title": "Territorium-Spiel Erfahrungen — Beta-Tester über MapRaiders",
        "og_title": "Territorium-Spiel — echte Erfahrungen aus der Beta",
        "meta": "Territorium-Spiel-Erfahrungen aus dem Alltag: drei Beta-Tester aus Deutschland berichten, wie sich Land erobern, Decay und Defense-Mini-Games im echten Stadtraum anfühlen.",
        "keywords": "territorium spiel erfahrungen, territorien spiel test, land erobern app erfahrungen, territory game test",
        "h1_html": 'Territorium-Spiel — wenn die <em>eigene Straße</em> dir gehört',
        "lead": "Wie fühlt es sich an, eine echte Straße zu erobern? Drei Beta-Tester berichten von ihrem ersten Territorium, dem ersten Decay-Schock und dem ersten Defense-Mini-Game.",
        "intro_label": "Was zählt im Test?",
        "intro_title": "Was ein <em>Territorium-Spiel</em> erlebbar macht",
        "intro_body": """
    <p>Beim Territorium-Test geht es um drei Erlebnis-Achsen:</p>
    <ul>
      <li><strong>Eroberung.</strong> Wann fühlt sich die erste eigene Straße als „mein Land" an?</li>
      <li><strong>Verlust.</strong> Wie reagiert man auf den ersten Decay oder den ersten Verlust an einen Angreifer?</li>
      <li><strong>Verteidigung.</strong> Wie fühlen sich die Defense-Mini-Games — taktisch, fair, frustrierend?</li>
    </ul>
    <p>Die Quotes der drei Tester decken alle drei Achsen aus drei sehr unterschiedlichen Perspektiven ab.</p>
        """,
        "internal_links": [
            ("/territorium-spiel.html", "echtes Territorium-Spiel"),
            ("/standort-spiel.html", "GPS-Standort-Spiel auf dem Handy"),
            ("/standort-spiel-erfahrungen.html", "Standort-Spiel Erfahrungen"),
            ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
        ],
    },
    {
        "slug": "/standort-spiel-erfahrungen.html",
        "breadcrumb": "Standort-Spiel Erfahrungen",
        "title": "Standort-Spiel Erfahrungen — MapRaiders im Alltagstest",
        "og_title": "Standort-Spiel — Erfahrungen aus drei deutschen Städten",
        "meta": "Standort-Spiel-Erfahrungen aus Stuttgart, Hamburg und Berlin: drei Beta-Tester berichten, wie GPS, Echos und Quests den Alltag in der eigenen Stadt verändern.",
        "keywords": "standort spiel erfahrungen, gps standort spiel test, location based game erfahrungen",
        "h1_html": 'Standort-Spiel — <em>Erfahrungen</em> aus dem Alltag',
        "lead": "Standort-Spiele klingen abstrakt, bis du selbst in deiner Stadt joggen gehst und plötzlich Audio-Echos anderer Spieler hörst. Drei Beta-Tester über das, was passiert, wenn die echte Karte zum Spielfeld wird.",
        "intro_label": "Drei Städte, drei Stile",
        "intro_title": "Wie sich ein <em>Standort-Spiel</em> in DE anfühlt",
        "intro_body": """
    <p>Standort-Spiele leben von der Dichte an Spielern in deinem Umkreis. Die drei Tester decken bewusst unterschiedliche Stadt-Profile ab:</p>
    <ul>
      <li><strong>Berlin (Aljoscha P.)</strong> — hohe Dichte an Stadt-Erkundern, viele Echos, Cross-Bezirk-Bewegungen.</li>
      <li><strong>Hamburg (Vivian N.)</strong> — viele Jogger entlang der Alster, Cardio-fokussierte Nutzung.</li>
      <li><strong>Stuttgart (Ron C.)</strong> — Hundebesitzer-Cluster, ruhigere Nachbarschafts-Logik.</li>
    </ul>
        """,
        "internal_links": [
            ("/standort-spiel.html", "GPS-Standort-Spiel auf dem Handy"),
            ("/territorium-spiel.html", "echtes Territorium-Spiel"),
            ("/gps-spiel-erfahrungen.html", "GPS-Spiel Erfahrungen"),
            ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
        ],
    },
    {
        "slug": "/gps-spiel-erfahrungen.html",
        "breadcrumb": "GPS-Spiel Erfahrungen",
        "title": "GPS-Spiel Erfahrungen — MapRaiders aus Deutschland im Test",
        "og_title": "GPS-Spiel — Erfahrungen aus der DE-Beta",
        "meta": "GPS-Spiel-Erfahrungen aus der MapRaiders-Beta: drei Tester aus Deutschland berichten über Akku, Genauigkeit, Datenschutz und Spielspaß im urbanen Alltag.",
        "keywords": "gps spiel erfahrungen, gps spiel test, gps mmo test, mapraiders erfahrungen",
        "h1_html": 'GPS-Spiel — <em>Erfahrungen</em> aus Deutschland',
        "lead": "Wie genau ist GPS in deutschen Innenstädten? Wie viel Akku zieht die App auf langen Routen? Wie fühlt sich DSGVO-Konformität als Spieler an? Drei Tester antworten ehrlich.",
        "intro_label": "Test-Achsen",
        "intro_title": "Was wir an einem <em>GPS-Spiel</em> getestet haben",
        "intro_body": """
    <p>Beim GPS-Spiel-Test ging es uns um vier konkrete Achsen:</p>
    <ul>
      <li><strong>GPS-Genauigkeit</strong> in Innenstadt-Schluchten und unter Brücken.</li>
      <li><strong>Akku-Verbrauch</strong> auf 1-2-Stunden-Strecken (Vergleich gegen Pokémon GO).</li>
      <li><strong>Datenschutz-Gefühl</strong>: Wie viel Tracking-Bauchgrummeln entsteht?</li>
      <li><strong>Spielmechanik</strong>: Funktionieren Territorium, Echos, Quests im echten Alltag?</li>
    </ul>
        """,
        "internal_links": [
            ("/gps-spiel-deutschland.html", "GPS-Spiel aus Deutschland"),
            ("/standort-spiel.html", "GPS-Standort-Spiel auf dem Handy"),
            ("/standort-spiel-erfahrungen.html", "Standort-Spiel Erfahrungen"),
            ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
        ],
    },
    {
        "slug": "/schnitzeljagd-app-erfahrungen.html",
        "breadcrumb": "Schnitzeljagd-App Erfahrungen",
        "title": "Schnitzeljagd-App Erfahrungen — Beta-Tester über MapRaiders",
        "og_title": "Schnitzeljagd-App — Erfahrungen aus dem Beta-Test",
        "meta": "Schnitzeljagd-App-Erfahrungen ohne Tour-Käufe und Vorbereitung: Beta-Tester berichten, wie MapRaiders die ganze Stadt zur Live-Schnitzeljagd macht.",
        "keywords": "schnitzeljagd app erfahrungen, schnitzeljagd app test, live schnitzeljagd erfahrungen, familie schnitzeljagd",
        "h1_html": 'Schnitzeljagd-App — <em>Erfahrungen</em> ohne Tour-Käufe',
        "lead": "Die meisten Schnitzeljagd-Apps brauchen Vorbereitung: Tour kaufen, Route planen, Stationen einrichten. Wie fühlt es sich an, wenn die ganze Stadt schon mit Spuren gefüllt ist? Drei Beta-Tester berichten.",
        "intro_label": "Test-Frage",
        "intro_title": "Funktioniert eine <em>Live-Schnitzeljagd</em> ohne Vorlauf?",
        "intro_body": """
    <p>Wir haben die Schnitzeljagd-Funktionen in drei Settings getestet:</p>
    <ul>
      <li><strong>Allein</strong> als Stadt-Erkunder (Aljoscha P.) — Echos legen, Echos finden.</li>
      <li><strong>Mit Hund</strong> auf normaler Runde (Ron C.) — Spuren als Nebenprodukt.</li>
      <li><strong>Familien-Setting</strong> simuliert — wie schnell verstehen Erwachsene + Kinder die Mechanik?</li>
    </ul>
        """,
        "internal_links": [
            ("/schnitzeljagd-app.html", "Schnitzeljagd-App-Variante"),
            ("/schnitzeljagd/", "Schnitzeljagd-Nische bei MapRaiders"),
            ("/standort-spiel-erfahrungen.html", "Standort-Spiel Erfahrungen"),
            ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
        ],
    },
    {
        "slug": "/handyspiel-laufen-erfahrungen.html",
        "breadcrumb": "Handyspiel zum Laufen Erfahrungen",
        "title": "Handyspiel zum Laufen — Erfahrungen aus dem Cardio-Test",
        "og_title": "Handyspiel zum Laufen — Erfahrungen aus der Beta",
        "meta": "Handyspiel-zum-Laufen-Erfahrungen: Beta-Tester berichten über Cardio-Motivation, Akku auf Langstrecke und Territorium-Verlust nach Krankheits-Pausen.",
        "keywords": "handyspiel zum laufen erfahrungen, joggen handyspiel test, cardio app erfahrungen",
        "h1_html": 'Handyspiel zum Laufen — <em>Erfahrungen</em> aus dem Cardio-Test',
        "lead": "Was passiert mit der Lauf-Motivation, wenn jede Runde echtes Land verteidigt? Wie fühlt sich der erste Decay nach einer Erkältungs-Pause an? Drei Beta-Tester berichten — eine Joggerin, ein Walker, ein Stadt-Erkunder.",
        "intro_label": "Test-Achsen",
        "intro_title": "Was ein <em>Handyspiel zum Laufen</em> leisten muss",
        "intro_body": """
    <p>Wir haben das Lauf-Erlebnis in drei Achsen getestet:</p>
    <ul>
      <li><strong>Motivations-Anker.</strong> Wann steigt jemand nach einer Pause wieder ein?</li>
      <li><strong>Akku auf Langstrecke.</strong> 60-90-Minuten-Routen ohne Akku-Tod.</li>
      <li><strong>Cross-Sportart.</strong> Funktioniert es für Joggen, Walking und Hund-Runden gleich gut?</li>
    </ul>
        """,
        "internal_links": [
            ("/handyspiel-zum-laufen.html", "Handyspiel zum Laufen"),
            ("/jogging/", "Joggen mit Ziel"),
            ("/fitness-mmo/", "Cardio mit Eroberung"),
            ("/mapraiders-erfahrungen.html", "Alle Bewertungen ansehen"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/mapraiders-erfahrungen.html",
    "breadcrumb": "MapRaiders Erfahrungen",
    "title": "MapRaiders Erfahrungen — Bewertungen, Beta-Tests, Founder-Statement",
    "og_title": "MapRaiders Erfahrungen — alles auf einen Blick",
    "meta": "MapRaiders Erfahrungen: 5,0 von 5 Sternen aus drei verifizierten Beta-Tests, Founder-Statement, alle Killer-Pages und Erfahrungs-Berichte zentral verlinkt.",
    "keywords": "mapraiders erfahrungen, mapraiders bewertung, mapraiders test, gps mmo erfahrungen",
    "badge": "Hub & Übersicht",
    "pricing_pill": "5,0 / 5 — 3 verifizierte Beta-Bewertungen",
    "h1_html": '<em>MapRaiders Erfahrungen</em> — alles, was du über das GPS-MMO wissen musst',
    "lead": "Drei Beta-Tester aus Stuttgart, Hamburg und Berlin. Sieben Killer-Themen vom Pokémon-GO-Vergleich bis zur Schnitzeljagd-App. Sieben Detail-Berichte. Ein Hub.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "Was ist MapRaiders überhaupt?",
         "a": "MapRaiders ist ein GPS-basiertes MMO-Spiel für Android. Spieler erobern echte Territorien durch Bewegung, hinterlassen Echos, erstellen Quests und verteidigen ihr Land mit Mini-Games. Werbefrei, DSGVO-konform, kostenlos."},
        {"q": "Wie viele Beta-Tester sind das?",
         "a": "Aktuell drei Personen, die wir öffentlich machen — mit deren Einverständnis und unter Vorname + Initial aus Privacy-Gründen. Insgesamt ist die geschlossene Beta-Phase größer; die drei genannten sind repräsentativ für die Hauptpersonas."},
        {"q": "Sind die Bewertungen echt?",
         "a": "Ja. Die drei Tester sind reale Personen aus der geschlossenen Beta. Sie wurden nicht bezahlt, ihre Quotes sind original auf Deutsch verfasst und stehen im Schema.org-Markup mit Datum und Sprache markiert."},
        {"q": "Wo kann ich selbst Beta-Tester werden?",
         "a": "Trag dich auf der Startseite mit deiner E-Mail ein. Bei Verfügbarkeit werden Beta-Plätze in Wellen vergeben — Priorität haben Personen aus deutschen Städten mit niedriger Spielerdichte."},
        {"q": "Wann erscheint die App offiziell?",
         "a": "MapRaiders erscheint im Google Play Store als geschlossene Beta. Die offizielle DE-Veröffentlichung ist für Sommer 2026 geplant; iOS folgt in Q3 2026."},
    ],
    "internal_links": [],  # Not used for hub
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print(f"=== Phase 1 Session 1 — DE Killer-URL Builder ===")
    print(f"Output: {DOCS}")
    print()

    written = []

    # 1. Killer pages
    for page in ALL_KILLERS:
        out_path = DOCS / page["slug"].lstrip("/")
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
        print(f"  {n}")


if __name__ == "__main__":
    main()

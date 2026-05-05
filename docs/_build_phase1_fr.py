#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 3 — FR Killer-URL Builder
Generates 15 FR pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_FR_FINAL_MASTER_PLAN.md.

Output: docs/fr/
Run: py docs/_build_phase1_fr.py
Idempotent: overwrites existing files.
"""

import json
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
OUT_DIR = DOCS / "fr"
SITE = "https://mapraiders.com"
LANG = "fr"
LANG_SHORT = "fr"

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
]

# -----------------------------------------------------------------------------
# REUSABLE BLOCKS — FR
# -----------------------------------------------------------------------------

# Beta-Tester data (FR-translated quotes per Master-Plan §1.2)
TESTER_RON = {
    "name": "Ron C.",
    "name_de": "Ron C.",
    "role": "Maître de chien · région de Stuttgart",
    "role_long": "Maître de chien de la région de Stuttgart (bêta fermée)",
    "quote": "Mon chien adore sa promenade — et j'adore que chaque promenade rend mon quartier plus visible sur la carte. J'ai déjà conquis toute ma rue.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "name_de": "Vivian N.",
    "role": "Coureuse · région de Hambourg",
    "role_long": "Coureuse de la région de Hambourg (bêta fermée)",
    "quote": "Je cours déjà chaque matin. Avec MapRaiders chaque parcours a un but : tenir le territoire ou le reconquérir. Ma motivation cardio a explosé.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "name_de": "Aljoscha P.",
    "role": "Explorateur urbain · région de Berlin",
    "role_long": "Explorateur urbain de la région de Berlin (bêta fermée)",
    "quote": "Déposer des Échos et voir qui les trouve, c'est comme une chasse au trésor ouverte à travers toute la ville.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder Quote FR (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "J'étais l'un des joueurs frustrés de Pokémon GO. Je voulais un vrai territoire, pas une "
    "capture de gym éphémère. Je ne voulais pas vendre mes pas à des fonds saoudiens, pas de "
    "modèle publicitaire, pas d'abonnement premium obligatoire. J'ai donc construit MapRaiders. "
    "C'est mon terrain de jeu personnel — et ce sera bientôt le tien."
)

# Pricing offers (EUR incl. 20% TVA — Master-Plan §1.1)
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0.00", "currency": "EUR"},
    {"name": "Cosmétique-IAP à partir de", "price": "1.99", "currency": "EUR"},
    {"name": "MapRaiders Soutien (Sub)", "price": "3.99", "currency": "EUR"},
    {"name": "Soutien à vie", "price": "99.00", "currency": "EUR"},
]

# DefinedTermSet FR (Master-Plan §8 — mit Akzent!)
DEFINED_TERMS = [
    ("Territoire", "Une zone conquise sur la carte du jeu, attribuée de façon persistante au joueur ou au clan"),
    ("Écho", "Signal audio, photo ou vidéo déposé par un joueur dans un lieu réel, que d'autres joueurs peuvent découvrir"),
    ("Mini-jeu de défense", "Mini-jeu (morpion, pierre-papier-ciseaux, mini-échecs) déclenché lors de la défense ou de la conquête d'un territoire"),
    ("Quête", "Mini-tâche créée par un joueur que d'autres joueurs peuvent accomplir dans le monde réel"),
    ("Clan", "Groupe formé organiquement de joueurs qui maintiennent et défendent ensemble des territoires"),
    ("Quartier", "Zone géographique définie par les rues, parcs et bâtiments qui forment l'unité naturelle de jeu en ville"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """Generate hreflang tags. slug is e.g. '/fr/jeu-territoire.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "fr":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="fr"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">De la bêta fermée</div>
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
    <div class="fr-label">Le Fondateur</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Fondateur de MapRaiders" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">Fondateur, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">De la bêta fermée</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.6">
      Mention : Les testeurs sont des participants internes de la bêta fermée (Allemagne). Seul le prénom + initiale est utilisé à la demande des testeurs, pour des raisons de protection de la vie privée. Les avis ont été traduits depuis les originaux allemands vers le français.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    """WhatsApp-Sharing-Button + Telegram + Mastodon (FR-privacy-tech-audience)."""
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    wa_text = f"D%C3%A9couvre%20MapRaiders%20-%20{enc}"
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}.mr-share__btn.wa{{border-color:#25D366}}.mr-share__btn.wa:hover{{background:#25D366;color:#fff}}</style>
<div class="mr-share" aria-label="Partager"><span class="mr-share__label">Partager :</span><a class="mr-share__btn wa" href="https://wa.me/?text={wa_text}" target="_blank" rel="noopener noreferrer">📱 WhatsApp</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a><a class="mr-share__btn" href="https://mastodonshare.com/?text={wa_text}" target="_blank" rel="noopener noreferrer">🐘 Mastodon</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">CGU</a><a href="/datenschutz.html">Confidentialité</a><a href="/impressum.html">Mentions légales</a><a href="/kontakt.html">Contact</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; Conquiers ton quartier de vrai. Un produit de Scafa Investments LLC.</p>
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
  <a href="/fr/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/fr/#features" class="lnk">Fonctionnalités</a>
    <a href="/fr/mapraiders-avis.html" class="lnk">Avis</a>
    <div class="lang-sw">
      <button class="lsw-btn">FR <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('fr')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">Bientôt</a>
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

# DE-Original-Slugs für translationOfWork
DE_TRANSLATION_MAP = {
    "/fr/jeu-territoire.html": "/territorium-spiel.html",
    "/fr/jeu-geolocalise.html": "/gps-spiel-deutschland.html",
    "/fr/alternative-pokemon-go-gratuit.html": "/pokemon-go-alternative-kostenlos.html",
    "/fr/pokemon-go-saudi-alternative.html": "/pokemon-go-alternative-kostenlos.html",
    "/fr/application-marche-avec-jeu.html": "/handyspiel-zum-laufen.html",
    "/fr/chasse-au-tresor-application.html": "/schnitzeljagd-app.html",
    "/fr/woog-alternative.html": "/standort-spiel.html",
    "/fr/jeu-territoire-avis.html": "/territorium-spiel-erfahrungen.html",
    "/fr/jeu-geolocalise-avis.html": "/gps-spiel-erfahrungen.html",
    "/fr/alternative-pokemon-go-avis.html": "/pokemon-go-alternative-erfahrungen.html",
    "/fr/pokemon-go-saudi-avis.html": "/pokemon-go-alternative-erfahrungen.html",
    "/fr/application-marche-avis.html": "/handyspiel-laufen-erfahrungen.html",
    "/fr/chasse-au-tresor-avis.html": "/schnitzeljagd-app-erfahrungen.html",
    "/fr/woog-alternative-avis.html": "/standort-spiel-erfahrungen.html",
    "/fr/mapraiders-avis.html": "/mapraiders-erfahrungen.html",
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
        "inLanguage": "fr",
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
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{SITE}/fr/"},
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
            "inLanguage": "fr",
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
            "inLanguage": "fr",
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
            "jobTitle": "Fondateur",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-fr",
            "name": "MapRaiders Vocabulaire de Marque FR",
            "inLanguage": "fr",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{SITE}/fr/"},
        {"@type": "ListItem", "position": 2, "name": "Avis", "item": f"{SITE}/fr/mapraiders-avis.html"},
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
            "inLanguage": "fr",
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
            "inLanguage": "fr",
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
        "name": "MapRaiders FR — toutes les pages Killer et avis",
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
  <h2 class="sec-title rv d1">Questions <em>fréquentes</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Plus sur le <em>terrain de jeu</em></h2>
  <p class="rv d1">Sujets liés à MapRaiders :</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Bientôt sur Google Play &bull; Gratuit &bull; Sans spam</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">Préviens-moi au lancement</a>
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
  <span>«&nbsp;{page['trigger']['quote']}&nbsp;»</span>
  <cite>— {page['trigger']['author']}</cite>
</div>"""

    pricing_pill = ""
    if page.get("pricing_pill"):
        pricing_pill = f'<div class="pricing-pill rv">{page["pricing_pill"]}</div>'

    return f"""<!DOCTYPE html>
<html lang="fr" data-theme="light">
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
<meta property="og:locale" content="fr_FR">
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
    Préviens-moi au lancement
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
  <div class="sec-label rv">Avis</div>
  <h2 class="sec-title rv d1">5,0 sur 5 — <em>3 avis vérifiés de la bêta</em></h2>
  <div class="prose rv d2">
    <p>Trois testeurs de la bêta fermée — un maître de chien, une coureuse et un explorateur urbain — ont utilisé MapRaiders pendant plusieurs semaines. Les témoignages ci-dessous représentent des personnes réelles de la bêta fermée (Allemagne). Les avis ont été traduits depuis les originaux allemands vers le français. Pour des raisons de protection de la vie privée, nous utilisons uniquement le prénom + initiale.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="fr" data-theme="light">
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
<meta property="og:locale" content="fr_FR">
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
  <div class="h-badge rv">Avis</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">En savoir plus →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Avis détaillé →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">Hub Thématique</div>
  <h2 class="sec-title rv d1">Tous les <em>sujets MapRaiders</em> au même endroit</h2>
  <div class="prose rv d2">
    <p>Ici tu trouves les 7 pages Killer plus 7 avis détaillés qui éclairent MapRaiders sous différents angles — de la comparaison avec Pokémon GO à l'application de chasse au trésor, du jeu de territoire au compagnon de course. Chaque page est indépendante ; ensemble, elles forment l'image complète.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Avis détaillés</div>
  <h2 class="sec-title rv d1">Ce que disent les testeurs sous <em>différentes perspectives</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Note Agrégée</div>
  <h2 class="sec-title rv d1">5,0 sur 5 — <em>3 avis vérifiés de la bêta</em></h2>
  <div class="prose rv d2">
    <p>Tous les avis proviennent de la phase de bêta fermée (février-avril 2026). Trois testeurs — un maître de chien, une coureuse et un explorateur urbain — ont testé MapRaiders sur leurs propres parcours à Stuttgart, Hambourg et Berlin. Les avis affichés ici ont été traduits des originaux allemands et représentent des personnes réelles.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="fr" data-theme="light">
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
<meta property="og:locale" content="fr_FR">
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
# PAGE DATA — KILLERS (K1-K7)  per Master-Plan §4
# -----------------------------------------------------------------------------

# K1 — jeu-territoire (EXISTIERT)
K1 = {
    "slug": "/fr/jeu-territoire.html",
    "breadcrumb": "Jeu de territoire",
    "title": "Jeu de territoire — conquiers ton quartier de vrai",
    "og_title": "Jeu de territoire — où la terre est vraiment à toi",
    "meta": "Jeu de territoire 2026 : MapRaiders est le seul GPS MMO avec possession réelle et persistante. Sans Niantic, sans Saudi, sans pub. RGPD-conforme.",
    "keywords": "jeu de territoire, jeu territoire gps, jeu conquete territoire, conquete quartier app, territory game france, jeu rgpd",
    "badge": "Jeu de Territoire",
    "pricing_pill": "Free Forever · RGPD-conforme · Sans Niantic",
    "h1_html": 'Jeu de territoire — le seul où la <em>terre est vraiment à toi</em>',
    "lead": "Un jeu de territoire devrait être plus qu'un point qui disparaît en 5 minutes sur une carte. MapRaiders combine GPS, capture persistante de zone et un système de défense qui rend la conquête réelle possible. Tu marches dans une rue — elle est à toi. Tant que tu la défends. Sans Niantic, sans fonds saoudien, sans pub.",
    "trigger": {
        "quote": "Conquiers ton quartier — sans Niantic, sans Saudi, sans pub.",
        "author": "MapRaiders, principe de marque"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Définition",
            "title": "Ce qui fait un <em>vrai jeu de territoire</em>",
            "body": """
    <p><strong>Un jeu de territoire</strong> est un jeu où les joueurs possèdent des zones revendiquées sur la carte de façon persistante, défendent et étendent ces zones. Contrairement aux jeux de capture (gym, portail), la possession reste <strong>persistante</strong> — même quand le joueur est hors ligne.</p>
    <p>Les quatre mécaniques qui définissent un vrai jeu de territoire :</p>
    <ul>
      <li><strong>Persistance.</strong> Les zones conquises restent attribuées au joueur ou au clan jusqu'à ce qu'elles soient activement reprises.</li>
      <li><strong>Decay.</strong> Les territoires inactifs rétrécissent avec le temps — personne ne bloque définitivement sans jouer activement.</li>
      <li><strong>Défense.</strong> En cas d'attaque, un mini-jeu entre les deux joueurs décide — pas de comparaison automatique de stats.</li>
      <li><strong>Transferts de clan.</strong> Les territoires peuvent être transmis aux alliés ou au clan — profondeur économique.</li>
    </ul>
            """,
        },
        {
            "label": "Système MapRaiders",
            "title": "Le <em>système de territoires</em> MapRaiders en détail",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Revendiquer</h3><p>Marche, promène le chien ou pédale dans une rue. La trace GPS génère le territoire à ton nom — comme polygone visible sur la carte.</p></div>
    <div class="feat-card rv d1"><h3>Decay Engine</h3><p>Qui ne parcourt pas régulièrement un territoire le voit rétrécir de quelques pour cent par jour. L'activité maintient la terre — pas l'argent.</p></div>
    <div class="feat-card rv d2"><h3>Mini-jeux de défense</h3><p>7 mini-jeux différents décident des attaques : morpion, pierre-papier-ciseaux, mini-échecs. La stratégie compte plus que le temps de jeu.</p></div>
    <div class="feat-card rv d3"><h3>Territoires de clan</h3><p>Plusieurs joueurs peuvent maintenir un territoire ensemble. Les zones de clan sont plus robustes — un seul attaquant ne suffit pas pour les briser.</p></div>
  </div>""",
        },
        {
            "label": "Pourquoi les autres ne sont pas",
            "title": "Pourquoi Pokémon GO et Ingress <em>ne sont pas</em> de vrais jeux de territoire",
            "body": """
    <p><strong>Les captures de gym de Pokémon GO</strong> sont éphémères : qui détient un record pendant quelques heures gagne des pièces — mais le territoire lui-même ne peut pas être compris comme possession de terre. Le gym est un point, pas une zone.</p>
    <p><strong>Les portails d'Ingress</strong> sont similaires : des points qui se connectent par liens en triangles. Le jeu connaît des champs entre portails, mais pas de possession persistante de terre. Qui reste une semaine sans ouvrir l'app ne perd pas «&nbsp;son quartier&nbsp;» — il ne lui a jamais vraiment été attribué.</p>
    <p>MapRaiders attaque exactement ce point : le <strong>territoire est la ressource de jeu</strong>, pas le point au-dessus. Tu gagnes de la terre, tu perds de la terre, tu transfères de la terre — comme dans un vrai jeu spatial.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Comment fonctionne le système de territoires dans MapRaiders ?",
         "a": "Tu marches physiquement dans des rues et revendiques des zones GPS. Ces territoires apparaissent sur la carte en direct et sont à toi — tant qu'aucun autre joueur ne passe par là pour défier. Si tu défends avec succès, la zone reste à toi."},
        {"q": "Puis-je perdre mon territoire ?",
         "a": "Oui. Le système de Decay fait rétrécir les zones inactives chaque jour. Qui reste actif et parcourt régulièrement sa zone la maintient. Qui s'arrête, perd. Cela maintient la carte vivante."},
        {"q": "Que se passe-t-il lors d'une attaque territoriale ?",
         "a": "L'attaquant doit arriver physiquement sur ton territoire. Alors un mini-jeu interactif commence — défenseur et attaquant jouent l'un contre l'autre. Qui gagne le mini-jeu décide du sort de la zone."},
        {"q": "Existe-t-il un système de territoires de clan ?",
         "a": "Oui. Les clans dans MapRaiders émergent organiquement et peuvent revendiquer des territoires ensemble. Les zones de clan sont plus fortes et nécessitent plusieurs attaquants pour être brisées. Le travail d'équipe paie."},
        {"q": "Le jeu de territoire est-il gratuit ?",
         "a": "Oui. Tout le gameplay de territoire est gratuit. Optionnellement, des cosmétiques (1,99€ – 8,99€) pour designs de marqueurs et couleurs de territoires — sans avantage de jeu. Paiement par carte bancaire, PayPal, Apple Pay, Google Pay ou Klarna."},
    ],
    "internal_links": [
        ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
        ("/fr/alternative-pokemon-go-gratuit.html", "Alternative Pokémon GO gratuit"),
        ("/fr/application-marche-avec-jeu.html", "Application marche avec jeu"),
        ("/fr/jeu-territoire-avis.html", "Avis jeu de territoire"),
        ("/fr/mapraiders-avis.html", "Tous les avis"),
    ],
}

# K2 — jeu-geolocalise (EXISTIERT — Volume-King 3-5K/mois)
K2 = {
    "slug": "/fr/jeu-geolocalise.html",
    "breadcrumb": "Jeu géolocalisé",
    "title": "Jeu géolocalisé 2026 — RGPD, sans Saudi, sans pub",
    "og_title": "Jeu géolocalisé 2026 — le GPS MMO honnête, RGPD",
    "meta": "Le meilleur jeu géolocalisé 2026 : territoire réel, RGPD-conforme, sans pub, sans Saudi. MapRaiders est le GPS MMO honnête, gratuit, sans AR.",
    "keywords": "jeu geolocalise, jeu geolocalise 2026, meilleur jeu geolocalise france, gps mmo, jeu gps android, location based game",
    "badge": "GPS MMO",
    "pricing_pill": "Free Forever · RGPD · Sans pub",
    "h1_html": 'Jeu géolocalisé — <em>conquiers ton quartier</em> de vrai',
    "lead": "Les jeux géolocalisés devraient être plus que des points éphémères sur une carte. MapRaiders combine GPS, capture persistante de territoire et un système de défense qui rend la conquête réelle possible. Tu marches dans une rue — elle est à toi. Tant que tu la défends. Sans fake GPS, sans AR qui draine la batterie, sans pub. RGPD-conforme, hébergement européen, sans propriétaire saoudien.",
    "trigger": {
        "quote": "Tes pas ne sont pas vendus à Big Tech ni aux fonds souverains.",
        "author": "MapRaiders, principe RGPD"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Définition",
            "title": "Qu'est-ce qu'un <em>jeu géolocalisé</em>",
            "body": """
    <p>Un <strong>jeu géolocalisé (Location-Based Game)</strong> utilise la position géographique de l'appareil comme mécanique centrale. Contrairement aux jeux AR, qui ont besoin en plus de la caméra, un jeu purement géolocalisé fonctionne uniquement avec la carte — économisant la batterie et protégeant la vie privée.</p>
    <p>MapRaiders est un <strong>GPS MMO</strong> : des milliers de joueurs se déplacent simultanément sur la même carte, s'affrontent en temps réel et partagent un système unifié de territoires. Sans AR, sans caméra, sans casque VR.</p>
            """,
        },
        {
            "label": "Les 7 meilleurs",
            "title": "Les 7 meilleurs jeux géolocalisés comparés — et pourquoi <em>MapRaiders</em> est le seul avec territoire réel",
            "body": "<p>La plupart des listes mélangent des apps qui ne partagent qu'une caractéristique avec Pokémon GO. Ici on est honnête :</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>App</th><th>Opérateur</th><th>Sans pub</th><th>Territoire réel</th><th>Confiance RGPD</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Gyms éphémères</td><td class="cross">PIF saoudien</td></tr>
      <tr><td class="feat-name">Ingress Prime</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Portails, non persistants</td><td class="cross">PIF saoudien</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">PIF saoudien</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="check">✓</td><td class="cross">Caches, pas terre</td><td>Premium-paywall</td></tr>
      <tr><td class="feat-name">Monster Hunter Now</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">PIF saoudien</td></tr>
      <tr><td class="feat-name">Woog</td><td>Indé FR (fermé 2018)</td><td class="check">✓</td><td class="cross">Promenade chien only</td><td class="check">RGPD</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓</td><td class="check">✓ persistant</td><td class="check">RGPD, indépendant</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Différence",
            "title": "Ce qui rend MapRaiders <em>unique</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territoires persistants</h3><p>En conquérant une rue, elle est à toi — jusqu'à ce que quelqu'un la reprenne ou que le decay agisse. Pas de gyms éphémères.</p></div>
    <div class="feat-card rv d1"><h3>Échos au lieu d'AR</h3><p>Dépose des Échos audio, photo ou vidéo dans des lieux réels. D'autres joueurs les découvrent. Sans AR qui draine la batterie.</p></div>
    <div class="feat-card rv d2"><h3>7 mini-jeux de défense</h3><p>Lors d'attaques : morpion, pierre-papier-ciseaux ou mini-échecs. Stratégie au lieu de simple temps de jeu.</p></div>
    <div class="feat-card rv d3"><h3>Clans organiques</h3><p>Les clans émergent du voisinage, pas de serveurs Discord. Qui court dans la même rue devient allié.</p></div>
    <div class="feat-card rv d4"><h3>Batterie économisée</h3><p>Juste GPS, sans caméra, sans AR. 4× plus d'autonomie de batterie que Pokémon GO sur longs trajets.</p></div>
  </div>""",
        },
        {
            "label": "Cas d'usage FR",
            "title": "Cas d'usage <em>français</em>",
            "body": "<p>MapRaiders s'adapte à quatre profils principaux en France :</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Promenade canine</h3><p>~7,5 millions de chiens en France — la promenade quotidienne devient maintenance de territoire.</p></div>
    <div class="feat-card rv d1"><h3>Course matinale</h3><p>Cardio avec but : défendre territoire ou le reconquérir. Strava + jeu, en complément.</p></div>
    <div class="feat-card rv d2"><h3>Tour de France personnel</h3><p>Marque ton parcours cycliste. Chaque kilomètre conquit. Événements saisonniers FR.</p></div>
    <div class="feat-card rv d3"><h3>Activité famille</h3><p>Chasse au trésor avec Échos, sans AR, sans pub — pour enfants et adultes. RGPD-compatible enfants.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Qu'est-ce qu'un jeu géolocalisé ?",
         "a": "Un jeu géolocalisé (Location-Based Game) utilise ta position GPS pour déclencher des mécaniques de jeu. MapRaiders utilise le GPS pour lier territoires, Échos et quêtes à des lieux réels — ta ville devient le terrain de jeu."},
        {"q": "Ai-je besoin de la Réalité Augmentée ?",
         "a": "Non. MapRaiders est délibérément sans AR. N'utilise que le GPS et la carte. Cela économise la batterie et la vie privée — sans caméra, sans capture faciale."},
        {"q": "Fonctionne-t-il dans toute la France ?",
         "a": "Oui. Partout où il y a des données OpenStreetMap. Dans les centres urbains comme Paris, Lyon, Marseille la densité de joueurs est élevée ; en zone rurale, moins de compétition mais territoires plus grands."},
        {"q": "Mes données de localisation sont-elles vendues ?",
         "a": "Non. Nous sommes RGPD-conformes, sans SDK publicitaire, sans vente de données, sans propriétaire étatique. Contrairement à Pokémon GO, qui depuis mars 2025 appartient au groupe Scopely (PIF saoudien). Hébergement européen, mentions légales conformes CNIL."},
        {"q": "Combien ça coûte ?",
         "a": "Le gameplay est gratuit. Cosmétiques (1,99€ – 8,99€) sans avantages de jeu, juste esthétique. Paiement par CB, PayPal, Apple Pay, Google Pay ou Klarna FR."},
    ],
    "internal_links": [
        ("/fr/jeu-territoire.html", "Jeu de territoire réel"),
        ("/fr/alternative-pokemon-go-gratuit.html", "Alternative Pokémon GO gratuit"),
        ("/fr/pokemon-go-saudi-alternative.html", "Pokémon GO Saudi alternative"),
        ("/fr/application-marche-avec-jeu.html", "Application marche avec jeu"),
        ("/fr/chasse-au-tresor-application.html", "Chasse au trésor application"),
        ("/fr/woog-alternative.html", "Woog alternative"),
        ("/fr/jeu-geolocalise-avis.html", "Avis jeu géolocalisé"),
        ("/fr/mapraiders-avis.html", "Tous les avis"),
    ],
}

# K3 — alternative-pokemon-go-gratuit
K3 = {
    "slug": "/fr/alternative-pokemon-go-gratuit.html",
    "breadcrumb": "Alternative Pokémon GO gratuit",
    "title": "Alternative Pokémon GO gratuit — sans pub, sans Saudi",
    "og_title": "Alternative Pokémon GO gratuit — 100% libre, sans Battle Pass",
    "meta": "Tu cherches une alternative Pokémon GO gratuit ? MapRaiders est 100% gratuit, sans pub, sans Battle Pass. Territoire réel, pas de capture éphémère de gym. RGPD.",
    "keywords": "alternative pokemon go gratuit, alternative pokemon go gratuite, jeu gps gratuit france, sans pub, sans battle pass, rgpd",
    "badge": "Alternative Pokémon GO",
    "pricing_pill": "0€ gameplay · Cosmétique optionnel à partir de 1,99€",
    "h1_html": 'Alternative Pokémon GO gratuit — sans pub, <em>sans fonds saoudien</em>, sans Battle Pass',
    "lead": "Qui cherche une alternative à Pokémon GO sans Battle Pass, sans folie de Remote Raid Pass et sans pub, tombe souvent dans le piège premium suivant. MapRaiders inverse cela : le gameplay complet est et reste gratuit. Pas de niveaux, pas d'abonnement obligatoire, pas de vente de données — paiement par carte bancaire ou Klarna pour les cosmétiques optionnels.",
    "trigger": {
        "quote": "Tes pas ne sont pas vendus à Big Tech ni aux fonds souverains.",
        "author": "MapRaiders, principe RGPD"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Pourquoi chercher ?",
            "title": "Pourquoi les joueurs Pokémon GO français cherchent <em>des alternatives gratuites</em> en 2026",
            "body": """
    <p>Trois points de douleur ont mûri le marché français entre 2024 et 2026 :</p>
    <ul>
      <li><strong>Frustration Battle Pass.</strong> Passes saisonniers avec avantages bloqués sans payer. Qui rate une saison, perd les récompenses pour toujours.</li>
      <li><strong>Polémique Remote Raid Pass.</strong> Niantic a augmenté les prix et réduit la disponibilité — une vague de joueurs français a arrêté en 2023.</li>
      <li><strong>Acquisition saoudienne mars 2025.</strong> Niantic a vendu Pokémon GO à Scopely (filiale du Public Investment Fund saoudien). Les données de localisation de millions de joueurs arrivent maintenant indirectement à un fonds souverain étranger — préoccupation CNIL/RGPD majeure.</li>
    </ul>
            """,
        },
        {
            "label": "Que signifie gratuit ?",
            "title": "Ce que <em>«&nbsp;gratuit&nbsp;»</em> signifie vraiment dans MapRaiders",
            "body": "<p>Tiers transparents — sans paywall caché, sans blocage de tutoriel après 10 minutes :</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>Inclus</th><th>Prix (FR, TVA 20%)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% du gameplay (territoires, Échos, quêtes, clans, défense, événements)</td><td>0€</td></tr>
      <tr><td class="feat-name">Cosmétique-IAP</td><td>Designs de marqueurs, couleurs de territoires, emblèmes de clan, skins</td><td>1,99€ &ndash; 8,99€</td></tr>
      <tr><td class="feat-name">MapRaiders Soutien (Sub)</td><td>Badge honorifique, accès bêta, lettre du fondateur, pack cosmétique mensuel</td><td>3,99€ / mois</td></tr>
      <tr><td class="feat-name">Soutien à vie</td><td>Cosmétique collectionneur + crédits in-game</td><td>99€ (une fois)</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Important :</strong> Les cosmétiques ne donnent aucun avantage de jeu. Qui n'achète rien joue avec des mécaniques identiques au Soutien à vie.</p>""",
        },
        {
            "label": "Paiement FR",
            "title": "Paiement <em>européen</em> — sans casse-tête",
            "body": """
    <p>Les cosmétiques optionnels et l'abonnement Soutien sont payables par Carte Bancaire, PayPal, Apple Pay, Google Pay ou Klarna FR — sans avoir à entrer des données de carte américaine. Klarna te permet de payer en 3 ou 4 fois sans frais. Le cosmétique se débloque en quelques secondes.</p>
    <p>Prestataires de paiement intégrés : Stripe Europe, PayPal Europe, Klarna FR. Pas de frais supplémentaires pour le joueur, pas de PayPal obligatoire, hébergement européen.</p>
            """,
        },
        {
            "label": "La question saoudienne",
            "title": "La <em>question Saudi-Niantic</em> — qu'arrive-t-il à tes pas ?",
            "body": """
    <p>En mars 2025, Niantic a vendu sa division jeux (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) pour 3,5 milliards de dollars à Scopely. Scopely est une filiale du Public Investment Fund (PIF) saoudien — formellement une entité contrôlée par l'État saoudien.</p>
    <p>Concrètement, cela signifie : les <strong>données de localisation d'environ 30 millions de joueurs mensuels de Pokémon GO</strong> — où ils courent, quand ils promènent le chien, quels itinéraires ils empruntent chaque jour — sont maintenant traitées par l'infrastructure de Scopely. Les détails des transferts de données ne sont pas divulgués publiquement. Ce qui est clair : il n'y a pas de protection RGPD-équivalente contre les acteurs liés à des fonds souverains hors UE.</p>
    <p>MapRaiders est une LLC américaine en <strong>propriété privée</strong> (Scafa Investments LLC, Floride), développée par une équipe indépendante. Nous opérons des serveurs RGPD-compatibles en Europe, ne vendons pas de données, n'avons pas de réseau publicitaire connecté et ne sommes contrôlés par aucun État.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders est-il vraiment gratuit pour toujours ?",
         "a": "Oui. Tout le gameplay principal — conquérir des territoires, déposer des Échos, créer des quêtes, former des clans — reste gratuit pour toujours. Pas de système de niveaux, pas de Battle Pass, pas d'abonnement obligatoire."},
        {"q": "Combien coûte le Cosmétique-IAP ?",
         "a": "Les cosmétiques comme designs de marqueurs, couleurs de territoires ou emblèmes de clan coûtent entre 1,99€ et 8,99€ (TVA 20% incluse). Ils ne donnent aucun avantage de jeu, juste esthétique. Paiement par CB, PayPal, Apple Pay, Google Pay ou Klarna."},
        {"q": "Puis-je payer en plusieurs fois ?",
         "a": "Oui, via Klarna FR — 3 ou 4 fois sans frais sur les cosmétiques et le Soutien Sub. Tu peux aussi utiliser PayPal Europe, Carte Bancaire ou Apple/Google Pay."},
        {"q": "Y a-t-il de la pub dans l'app ?",
         "a": "Non. MapRaiders est 100% sans pub. Nous ne vendons ni tes données ni espace publicitaire. RGPD-conforme, hébergement européen."},
        {"q": "Que signifie «&nbsp;sans fonds saoudien&nbsp;» ?",
         "a": "En mars 2025, Niantic a vendu sa division jeux (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) pour 3,5 milliards de dollars à Scopely — filiale du Public Investment Fund saoudien. Les données de localisation de plus de 30 millions de joueurs mensuels arrivent maintenant indirectement à un fonds souverain étranger. MapRaiders est une LLC américaine privée, non contrôlée par aucun État, RGPD-conforme."},
    ],
    "internal_links": [
        ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
        ("/fr/jeu-territoire.html", "Jeu de territoire réel"),
        ("/fr/pokemon-go-saudi-alternative.html", "Pokémon GO Saudi alternative"),
        ("/fr/alternative-pokemon-go-avis.html", "Avis : ça vaut le coup ?"),
        ("/fr/mapraiders-avis.html", "Tous les avis"),
    ],
}

# K4 — pokemon-go-saudi-alternative (FR-EXKLUSIV — Privacy-USP-GOLD)
K4 = {
    "slug": "/fr/pokemon-go-saudi-alternative.html",
    "breadcrumb": "Pokémon GO Saudi alternative",
    "title": "Pokémon GO Saudi — alternative française RGPD",
    "og_title": "Pokémon GO Saudi alternative — RGPD, sans PIF, indépendant",
    "meta": "Pokémon GO racheté par l'Arabie Saoudite en 2025 ? Tes données vont à un fonds souverain. MapRaiders est l'alternative française RGPD-conforme, indépendante.",
    "keywords": "pokemon go saudi, pokemon go arabie saoudite, pokemon go scopely pif, alternative pokemon go rgpd, jeu gps independant, alternative niantic saoudien",
    "badge": "RGPD · Sans PIF · FR-Exclusif",
    "pricing_pill": "RGPD-conforme · Hébergement Europe · Sans fonds souverain",
    "h1_html": 'Pokémon GO Saudi — l\'<em>alternative française RGPD</em> qui n\'appartient à aucun État',
    "lead": "En mars 2025, Niantic a vendu Pokémon GO à Scopely — filiale du Public Investment Fund (PIF) saoudien. Du jour au lendemain, les données de localisation de 30 millions de joueurs mensuels — dont des centaines de milliers de Français — atterrissent indirectement chez un fonds souverain étranger. La CNIL surveille. Les joueurs s'inquiètent. MapRaiders est l'alternative française RGPD-conforme, indépendante, sans PIF, sans pub, gratuite.",
    "trigger": {
        "quote": "Tes pas ne sont pas vendus à Big Tech ni aux fonds souverains.",
        "author": "MapRaiders, principe RGPD-GOLD"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Mars 2025 — les faits",
            "title": "L'<em>acquisition saoudienne</em> de Pokémon GO — chronologie sourcée",
            "body": """
    <p>Mars 2025. Niantic, Inc. (San Francisco, créateur de Pokémon GO et Ingress) annonce officiellement la vente de sa division Games à Scopely pour 3,5 milliards de dollars. Sont inclus : Pokémon GO, Ingress Prime, Pikmin Bloom et Monster Hunter Now.</p>
    <p>Scopely n'est pas un éditeur indépendant. Depuis avril 2023, Scopely est une filiale à 100% de Savvy Games Group — entité détenue à 100% par le Public Investment Fund (PIF) saoudien. Le PIF est le fonds souverain du Royaume d'Arabie Saoudite, géré directement par le prince héritier Mohammed bin Salman.</p>
    <p>Concrètement : depuis mars 2025, l'infrastructure technique et les données de Pokémon GO sont sous contrôle d'une filiale d'un fonds souverain saoudien. Les détails des transferts de données vers le siège saoudien ne sont pas publiquement divulgués. Aucune communication officielle de la CNIL n'a été émise à ce jour.</p>
            """,
        },
        {
            "label": "Implications RGPD",
            "title": "Implications pour les joueurs FR — la <em>question CNIL/RGPD</em>",
            "body": """
    <p>Quatre points de friction RGPD/CNIL apparaissent immédiatement :</p>
    <ul>
      <li><strong>Transferts hors UE non transparents.</strong> Le PIF est basé à Riyad. L'Arabie Saoudite n'est pas reconnue comme pays à protection adéquate par la Commission européenne. Tout transfert nécessite des Clauses Contractuelles Types (CCT) — opacité actuelle.</li>
      <li><strong>Données de localisation = données sensibles.</strong> Trajets quotidiens, itinéraires de course, lieux de promenade canine : profil comportemental complet. La CNIL classe ces données comme particulièrement sensibles (Délibération 2023-014).</li>
      <li><strong>Consentement éclairé compromis.</strong> Les utilisateurs FR ayant accepté les CGU Niantic en 2017-2024 n'ont pas consenti à un transfert vers un fonds souverain saoudien. Le RGPD exige un nouveau consentement spécifique.</li>
      <li><strong>Risque de demandes étatiques.</strong> Une infrastructure contrôlée par un État peut être soumise à des demandes d'accès gouvernementales — sans recours équivalent au RGPD européen.</li>
    </ul>
    <p>La CNIL a infligé 55 millions d'euros d'amendes RGPD en 2024 et 331 mesures correctives. Le contexte français est juridiquement strict.</p>
            """,
        },
        {
            "label": "MapRaiders indépendant",
            "title": "Pourquoi MapRaiders <em>reste indépendant</em> — statut, financement, juridiction",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Critère</th><th>Pokémon GO (depuis 03/2025)</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Propriétaire ultime</td><td class="cross">Scopely → Savvy → PIF (Arabie Saoudite)</td><td class="check">Scafa Investments LLC (privé, Floride)</td></tr>
      <tr><td class="feat-name">Financement</td><td>Fonds souverain étatique</td><td class="check">Auto-financé, indépendant</td></tr>
      <tr><td class="feat-name">Hébergement données</td><td>Infrastructure Scopely (US/Saudi)</td><td class="check">Serveurs UE, conformes RGPD</td></tr>
      <tr><td class="feat-name">SDK publicitaires</td><td class="cross">Présents</td><td class="check">Aucun</td></tr>
      <tr><td class="feat-name">Vente de données</td><td>Politique opaque</td><td class="check">Aucune — modèle cosmétique</td></tr>
      <tr><td class="feat-name">Recours utilisateur</td><td>CGU américaines/saoudiennes</td><td class="check">Droit européen + CNIL</td></tr>
      <tr><td class="feat-name">Mentions légales FR</td><td>Anglais primaire</td><td class="check">Conformes CNIL, en français</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Garantie de non-acquisition :</strong> Scafa Investments LLC s'engage à ne pas vendre MapRaiders à un acteur étatique ou à un fonds souverain. Cette clause est inscrite dans les CGU et opposable juridiquement.</p>""",
        },
        {
            "label": "Mastodon + Qwant",
            "title": "Pour la communauté <em>Privacy-Tech française</em>",
            "body": """
    <p>MapRaiders s'aligne avec l'écosystème Privacy-Tech français :</p>
    <ul>
      <li><strong>Compte Mastodon</strong> sur instance francophone (mamot.fr ou pouet.chapril.org). Pas de Twitter/X obligatoire.</li>
      <li><strong>Indexation Qwant</strong> en plus de Google. Le moteur de recherche français est notre cible secondaire.</li>
      <li><strong>Pas de Google Analytics.</strong> Stats internes uniquement, pas de tracking tiers.</li>
      <li><strong>Open data approche.</strong> Cartographie OpenStreetMap, pas Google Maps.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Pokémon GO appartient-il vraiment à l'Arabie Saoudite maintenant ?",
         "a": "Indirectement, oui. En mars 2025, Niantic a vendu sa division jeux (incluant Pokémon GO) à Scopely pour 3,5 milliards de dollars. Scopely est filiale à 100% de Savvy Games Group, lui-même détenu à 100% par le Public Investment Fund (PIF) — fonds souverain de l'État saoudien. Les serveurs et l'infrastructure sont donc sous contrôle d'une entité étatique étrangère."},
        {"q": "Mes données Pokémon GO sont-elles transférées en Arabie Saoudite ?",
         "a": "Les détails des transferts de données ne sont pas publiquement divulgués par Scopely. Ce qui est certain : l'infrastructure et la gouvernance des données sont sous contrôle Scopely depuis mars 2025. L'Arabie Saoudite n'étant pas reconnue par la Commission européenne comme pays à protection adéquate, tout transfert nécessite des Clauses Contractuelles Types — opacité actuelle."},
        {"q": "MapRaiders est-il RGPD-conforme et hébergé en Europe ?",
         "a": "Oui. Serveurs en Europe (Allemagne/France selon le déploiement), aucun SDK publicitaire, mentions légales conformes CNIL en français, droit applicable européen. Scafa Investments LLC (Floride) est l'éditeur privé indépendant, sans actionnaire étatique."},
        {"q": "MapRaiders peut-il être racheté par un fonds souverain plus tard ?",
         "a": "Une clause de non-acquisition étatique est inscrite dans les CGU MapRaiders. Scafa Investments LLC s'engage juridiquement à ne pas céder le projet à un acteur étatique ou à un fonds souverain. Cette clause est opposable juridiquement et auditable."},
        {"q": "Comment migrer de Pokémon GO vers MapRaiders ?",
         "a": "Pas de migration de compte (les données Niantic restent chez Scopely). Tu crées un nouveau compte MapRaiders avec ton e-mail, tu commences sur ta propre rue, tu conquiers ton quartier en quelques semaines de marche/course. Beaucoup d'ex-joueurs Pokémon GO disent que c'est libérateur — pas de FOMO de saison perdue, pas de Battle Pass à rattraper."},
    ],
    "internal_links": [
        ("/fr/jeu-territoire.html", "Jeu de territoire réel"),
        ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
        ("/fr/alternative-pokemon-go-gratuit.html", "Alternative Pokémon GO gratuit"),
        ("/fr/pokemon-go-saudi-avis.html", "Avis sur l'alternative Saudi"),
        ("/fr/mapraiders-avis.html", "Tous les avis"),
    ],
}

# K5 — application-marche-avec-jeu (Strava-Komplement-Frame)
K5 = {
    "slug": "/fr/application-marche-avec-jeu.html",
    "breadcrumb": "Application marche avec jeu",
    "title": "Application marche avec jeu — Strava + territoire",
    "og_title": "Application marche avec jeu — cardio + jeu + santé",
    "meta": "Application marche avec jeu ? MapRaiders transforme chaque promenade en conquête de territoire. Cardio + jeu + santé. Compatible Strava. RGPD, sans pub.",
    "keywords": "application marche avec jeu, application marche jeu, app cardio gps france, strava territoire, app marche rgpd, application sport gps",
    "badge": "Cardio + Jeu",
    "pricing_pill": "Free Forever · 4× moins de batterie que Pokémon GO · Compatible Strava",
    "h1_html": 'Application marche avec jeu — quand <em>chaque pas</em> conquiert un territoire',
    "lead": "Les apps de marche donnent des statistiques. Les jeux de marche comme Pokémon GO donnent de la collection. Mais aucune app ne transforme ton vrai chemin en vraie terre. MapRaiders si : chaque pas forme un territoire, chaque retour le défend. Cardio avec conséquence. Famille ensemble. Santé pour de vrai. Et compatible Strava — on complète, on ne remplace pas.",
    "trigger": {
        "quote": "Je cours déjà chaque matin. Avec MapRaiders chaque parcours a un but : tenir le territoire ou le reconquérir. Ma motivation cardio a explosé.",
        "author": "Vivian N., coureuse de la région de Hambourg (bêta fermée)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "Le problème",
            "title": "Pourquoi les <em>apps de marche</em> traditionnelles ne suffisent pas",
            "body": """
    <p>Strava, Nike Run Club, Adidas Running, Decathlon Coach — mesurent temps, distance, allure. Mais trois points manquent à beaucoup de Français :</p>
    <ul>
      <li><strong>Pas d'élément de jeu.</strong> Qui ne poursuit pas de records personnels perd la motivation en 4 semaines.</li>
      <li><strong>Pression de performance.</strong> Les classements publics démotivent plus qu'ils n'aident.</li>
      <li><strong>Forçage d'abonnement.</strong> Strava Premium 8,99€/mois pour les cartes thermiques et comparaisons d'itinéraires qui deviennent inutiles dans le plan gratuit.</li>
    </ul>
            """,
        },
        {
            "label": "La solution",
            "title": "Comment MapRaiders <em>change ta routine</em> de marche",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Tenir le territoire</h3><p>Chaque parcours défend de la terre. Qui s'arrête 3 jours voit le decay agir — incitation naturelle au retour.</p></div>
    <div class="feat-card rv d1"><h3>Compteur de Decay</h3><p>La valeur de Decay montre : «&nbsp;Si tu ne cours pas aujourd'hui, ton quartier rétrécit de X%&nbsp;». Sans culpabilité — juste réalité physique.</p></div>
    <div class="feat-card rv d2"><h3>Défense de clan en courant</h3><p>Pendant la course, des notifications push avertissent quand le territoire du clan est attaqué. Tu ne cours pas seul — tu cours ensemble.</p></div>
    <div class="feat-card rv d3"><h3>Récompense via Écho</h3><p>Échos audio quand tu passes. D'autres joueurs racontent des histoires de la rue — sans pub, sans influenceur.</p></div>
  </div>""",
        },
        {
            "label": "Strava complément",
            "title": "MapRaiders <em>complète</em> Strava — ne remplace pas",
            "body": """
    <p>MapRaiders ne concurrence pas Strava sur les métriques de performance. Tu peux faire tourner les deux apps en même temps, ils utilisent le même capteur GPS sans conflit. Ce que Strava ne donne pas : territoire réel et défense sociale. Ce que MapRaiders ne donne pas : analyse détaillée des splits d'allure et zones cardiaques.</p>
    <p>Combinaison idéale : <strong>Strava pour l'analyse technique, MapRaiders pour la motivation quotidienne et le territoire.</strong> Lance les deux, sans douleur de batterie disproportionnée — l'un avec AR, l'autre sans.</p>
            """,
        },
        {
            "label": "Tour de France personnel",
            "title": "Ton <em>Tour de France</em> personnel — chaque kilomètre conquit",
            "body": """
    <p>Le Tour de France est culte en France. MapRaiders permet de vivre cet esprit chaque matin :</p>
    <ul>
      <li><strong>Chaque rue conquise = étape gagnée.</strong> Le rythme journalier devient saga personnelle.</li>
      <li><strong>Mode cycliste optimisé.</strong> Détection automatique de vélo, polygones de territoire larges adaptés à la vitesse cycliste.</li>
      <li><strong>Maillot virtuel.</strong> Cosmétiques saisonniers en juillet — maillots jaune/vert/pois rouges.</li>
      <li><strong>Événements estivaux.</strong> Bastille Day (14 juillet) et 1er semaine du Tour : événements territoriaux nationaux.</li>
    </ul>
            """,
        },
        {
            "label": "60+ longévité",
            "title": "Marcher pour <em>60 ans et plus</em> — longévité française",
            "body": """
    <p>La France compte plus de 17 millions de personnes de 60+. La marche est l'activité physique la plus recommandée par les gériatres — mais la motivation manque. MapRaiders résout cela sans AR (qui déroute) et sans compétition agressive (qui éloigne) :</p>
    <ul>
      <li><strong>Rythme propre.</strong> Pas de vitesse minimum. Walking, marche avec canne, avec ami — tout compte pour le territoire.</li>
      <li><strong>La même rue chaque jour fonctionne.</strong> Persistance au-delà de la distance. Qui répète, maintient.</li>
      <li><strong>Communauté de quartier.</strong> Clans organiques avec voisins. Sans Discord, sans chat toxique.</li>
      <li><strong>RGPD-compatible.</strong> Pour les seniors préoccupés par la vie privée — sans pub ciblée, sans vente de localisation.</li>
      <li><strong>Le plaisir de marcher n'a pas d'âge.</strong></li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Combien de temps de batterie dure ?",
         "a": "Sur une marche d'1 heure, typiquement 15-25% de batterie (vs ~50% pour Pokémon GO avec AR). Les valeurs varient selon l'appareil et la luminosité de l'écran."},
        {"q": "Fonctionne-t-il avec Strava ou Nike Run Club ?",
         "a": "Actuellement sans intégration directe. Tu peux faire tourner les deux apps en même temps — ils utilisent le même capteur GPS sans conflit. Intégration Strava prévue pour Q4 2026."},
        {"q": "La marche lente compte-t-elle aussi ?",
         "a": "Oui. Pas de vitesse minimum. Walking, marche lente, promenade — tout forme du territoire, tant qu'il y a un mouvement physique réel (pas d'auto-cheating)."},
        {"q": "Une personne âgée peut-elle l'utiliser ?",
         "a": "Oui, c'est conçu pour tous les âges. Sans AR, sans bruit, sans pression d'allure. Grandes lettres, contraste élevé, contrôles simples. Le plaisir de marcher n'a pas d'âge."},
        {"q": "Combien consomme en données mobiles ?",
         "a": "Modéré. Sans live-vidéo, sans API lourde. Une marche d'1 heure utilise typiquement 5-15 MB. RGPD-conforme, sans tracking publicitaire."},
    ],
    "internal_links": [
        ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
        ("/fr/alternative-pokemon-go-gratuit.html", "Alternative Pokémon GO gratuit"),
        ("/fr/woog-alternative.html", "Woog alternative — promenade chien"),
        ("/fr/application-marche-avis.html", "Avis : ça vaut le coup ?"),
        ("/fr/mapraiders-avis.html", "Tous les avis"),
    ],
}

# K6 — chasse-au-tresor-application (Volume-King 4-6K/mois)
K6 = {
    "slug": "/fr/chasse-au-tresor-application.html",
    "breadcrumb": "Chasse au trésor application",
    "title": "Chasse au trésor application — ville entière en direct",
    "og_title": "Chasse au trésor application — ville entière d'Échos cachés",
    "meta": "Chasse au trésor application 2026 : en direct, ville entière, sans acheter de tour, sans pub. MapRaiders transforme ta ville en chasse au trésor ouverte. RGPD enfants.",
    "keywords": "chasse au tresor application, chasse au tresor app, chasse tresor smartphone, chasse tresor famille, geocaching alternative, chasse au tresor enfants",
    "badge": "Chasse au Trésor",
    "pricing_pill": "Free Forever · Sans acheter de tour · Ville entière",
    "h1_html": 'Chasse au trésor application — une <em>ville entière d\'Échos</em> cachés',
    "lead": "Les apps traditionnelles de chasse au trésor comme Geocaching exigent un abonnement premium et des tours pré-définis. MapRaiders inverse cela : les Échos sont déjà éparpillés dans la ville entière. Tu suis les traces d'autres joueurs ou laisses les tiens. En direct, gratuit, sans acheter de tour, sans préparation. RGPD-compatible enfants.",
    "trigger": {
        "quote": "Déposer des Échos et voir qui les trouve, c'est comme une chasse au trésor ouverte à travers toute la ville.",
        "author": "Aljoscha P., explorateur urbain de la région de Berlin (bêta fermée)"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "Critères",
            "title": "Ce qu'une <em>chasse au trésor application moderne</em> devrait avoir",
            "body": """
    <p>Trois critères séparent les apps de chasse au trésor des années 2020 des solutions de papier imprimé :</p>
    <ul>
      <li><strong>En direct.</strong> Les indices apparaissent en temps réel, pas seulement dans des tours pré-fabriqués.</li>
      <li><strong>Social.</strong> Les joueurs laissent des indices les uns aux autres, au lieu de seulement suivre.</li>
      <li><strong>Sans barrière premium.</strong> Parents et enfants entrent immédiatement, sans devoir acheter un tour à 15€.</li>
    </ul>
            """,
        },
        {
            "label": "Comparaison",
            "title": "Apps de chasse au trésor <em>comparées</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>Prix</th><th>Préparation</th><th>En direct ?</th><th>Loop de jeu</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Geocaching</td><td>Sub Premium ~5,99€/mois</td><td>Faible — trouver caches</td><td class="cross">Asynchrone</td><td>Collecter</td></tr>
      <tr><td class="feat-name">Actionbound</td><td>Tours / Sub</td><td>Élevée — monter tour</td><td class="cross">✗</td><td>Par-tour</td></tr>
      <tr><td class="feat-name">Anyfox</td><td>Premium-Sub</td><td>Moyenne</td><td class="cross">Asynchrone</td><td>Scanner codes</td></tr>
      <tr><td class="feat-name">Munzee</td><td>Premium-Sub</td><td>Moyenne</td><td class="cross">Asynchrone</td><td>Scanner codes</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">0€</td><td class="check">Zéro</td><td class="check">En direct</td><td>Échos + Quêtes + Territoire</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Échos",
            "title": "Comment MapRaiders <em>repense</em> la chasse au trésor",
            "body": """
    <p>Au lieu d'un tour linéaire de la station 1 à 10, MapRaiders crée une <strong>chasse au trésor spatiale ouverte</strong> — la ville entière est le terrain de jeu :</p>
    <ul>
      <li><strong>Déposer des Échos.</strong> Dépose un Écho audio, photo ou vidéo dans un lieu. D'autres joueurs le découvrent en passant.</li>
      <li><strong>Trouver des Échos.</strong> Vois sur la carte où sont les Échos. Suis les traces, trouve des secrets, écoute des histoires.</li>
      <li><strong>Créer des quêtes.</strong> Crée une petite tâche dans un lieu («&nbsp;Prends une photo de la porte rouge là-bas&nbsp;»). D'autres joueurs accomplissent.</li>
      <li><strong>Couche de territoire.</strong> Qui parcourt fréquemment un itinéraire de chasse au trésor le conquiert comme territoire — les traces deviennent terre.</li>
    </ul>
            """,
        },
        {
            "label": "Enfants RGPD",
            "title": "Chasse au trésor application pour <em>enfants et famille</em>",
            "body": """
    <p>La chasse au trésor est culture française d'enfance — pistes à la craie, traces de feuilles, cachette finale avec bonbons. MapRaiders amène cela à l'ère du smartphone, sans laisser les enfants seuls devant l'écran :</p>
    <ul>
      <li><strong>Activité parents-enfants.</strong> Les parents déposent des Échos audio sur un itinéraire planifié, les enfants suivent les traces — mouvement analogique, indices numériques.</li>
      <li><strong>Écran minimum, monde maximum.</strong> L'app guide sur la carte ; l'expérience se passe dans le monde réel.</li>
      <li><strong>RGPD-compatible enfants.</strong> Conformité CNIL stricte : pas de tracker publicitaire personnalisé, pas de vente de données, pas de chat in-app sans approbation parentale.</li>
      <li><strong>Mode famille.</strong> Événements privés de Pâques, Noël, anniversaire — uniquement pour le groupe familial.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders est-il approprié pour les enfants ?",
         "a": "Oui, à partir de 9 ans avec accompagnement parental. L'app est RGPD-conforme, sans pub et ne collecte pas de données personnelles d'enfants. Les parents peuvent activer un mode famille avec contrôle total."},
        {"q": "Combien de préparation pour une chasse avec enfants ?",
         "a": "Zéro. Contrairement à Actionbound ou Munzee, tu n'as pas besoin d'acheter un tour ni de préparer des stations. Les Échos sont déjà éparpillés dans la ville — il suffit de suivre les traces d'autres joueurs ou de laisser les tiens."},
        {"q": "L'application de chasse au trésor coûte-t-elle quelque chose ?",
         "a": "Non. Les fonctions de chasse au trésor (déposer des Échos, trouver des Échos, créer des quêtes) sont totalement gratuites. Optionnellement, des cosmétiques à partir de 1,99€ — sans avantage de jeu. Paiement par CB, PayPal, Apple Pay, Google Pay ou Klarna."},
        {"q": "Fonctionne-t-il dans les petites villes ?",
         "a": "Oui. Même dans les petites villes ou villages, tu peux déposer des Échos et créer des quêtes. Dans les grands centres tu trouves plus de traces d'autres joueurs ; en campagne, ton tour a plus d'espace propre."},
        {"q": "L'app est-elle en français ?",
         "a": "Oui. MapRaiders est entièrement localisé en français — menus, système d'Échos, indices, support. Mentions légales et politique de confidentialité conformes CNIL."},
    ],
    "internal_links": [
        ("/fr/alternative-pokemon-go-gratuit.html", "Alternative Pokémon GO gratuit"),
        ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
        ("/fr/jeu-territoire.html", "Jeu de territoire réel"),
        ("/fr/chasse-au-tresor-avis.html", "Avis chasse au trésor application"),
        ("/fr/mapraiders-avis.html", "Tous les avis"),
    ],
}

# K7 — woog-alternative (FR-EXKLUSIV — KOMPLEMENT-FRAME, sehr respektvoll)
K7 = {
    "slug": "/fr/woog-alternative.html",
    "breadcrumb": "Woog alternative",
    "title": "Woog alternative — MapRaiders pour le territoire",
    "og_title": "Woog alternative — utilise les deux ensemble pour le jeu",
    "meta": "Tu utilisais Woog pour les promenades de chien ? Woog a fermé en 2018. MapRaiders comble le vide : territoire, Échos, défense. Pour la promenade canine.",
    "keywords": "woog alternative, woog application, woog ferme, alternative woog promenade chien, app promenade chien france, walkies game france",
    "badge": "Woog Vide · FR-Exclusif",
    "pricing_pill": "Free Forever · Le vide Woog comblé · 7,5M chiens en FR",
    "h1_html": 'Woog alternative — <em>MapRaiders</em> comble le vide depuis 2018',
    "lead": "Woog était l'app française de réseau social cartographique pour maîtres de chien — un projet beau, pionnier, hexagonal. Woog a fermé en 2018, et le vide n'a jamais été comblé. Aucune app française ne propose depuis cette combinaison de carte sociale + promenade canine + communauté locale. MapRaiders n'est pas le clone de Woog — mais ajoute exactement ce qui manquait : territoire, Échos, défense, jeu. Avec ou sans ton ancien réflexe Woog.",
    "trigger": {
        "quote": "Avec Woog ou seul — MapRaiders pour le territoire.",
        "author": "MapRaiders, principe de complément"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Hommage Woog",
            "title": "Woog était <em>super</em> — et a manqué à beaucoup",
            "body": """
    <p>Woog (anciennement <em>WoogAvenue</em>) a été lancée en 2014 par une équipe française. L'idée : une carte sociale pour maîtres de chien, où tu pouvais voir d'autres tutaniers à proximité, partager des spots de promenade, créer des rencontres canines. C'était pionnier — bien avant que Strava ne devienne mainstream, bien avant que les apps GPS ne se multiplient.</p>
    <p>Woog a fermé en 2018. Les raisons : modèle économique difficile, financement insuffisant, équipe dispersée. Beaucoup de maîtres français ont gardé la nostalgie de cette époque où une app française simple créait du lien de quartier autour des chiens.</p>
    <p>Le vide n'a jamais été vraiment comblé. Petbnb, Wagit, Yummypets : aucun n'a la dimension carte sociale + jeu de quartier que Woog promettait. MapRaiders n'est pas Woog 2.0 — c'est autre chose. Mais qui aimait Woog trouvera dans MapRaiders quelques échos familiers, et beaucoup de nouveau.</p>
            """,
        },
        {
            "label": "Ce que MapRaiders ajoute",
            "title": "Ce que MapRaiders <em>ajoute</em> à la promenade canine",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territoire conquis</h3><p>Chaque promenade étend ton polygone. En 2 semaines, tu possèdes ta rue. En 2 mois, le quartier. Sans effort supplémentaire.</p></div>
    <div class="feat-card rv d1"><h3>Échos du quartier</h3><p>D'autres maîtres déposent des Échos audio («&nbsp;Ici mon chien Bento adore renifler&nbsp;»). Tu découvres en passant — communauté pet du quartier.</p></div>
    <div class="feat-card rv d2"><h3>Quêtes pour maîtres</h3><p>«&nbsp;Prends une photo du chien dans un parc inconnu&nbsp;». Petites quêtes qui apportent variété à la routine.</p></div>
    <div class="feat-card rv d3"><h3>Trace personnelle</h3><p>La carte se souvient des chemins préférés de ton chien. Mémoire visuelle de la cohabitation quotidienne.</p></div>
    <div class="feat-card rv d4"><h3>Défense et jeu</h3><p>Mini-jeux de défense quand quelqu'un attaque ton territoire. Élément ludique que Woog n'avait pas.</p></div>
    <div class="feat-card rv"><h3>Clans organiques</h3><p>Plusieurs maîtres du même quartier deviennent automatiquement clan. Sans Discord, sans inscription forcée.</p></div>
  </div>""",
        },
        {
            "label": "Utiliser ensemble",
            "title": "<em>Utiliser les deux ensemble</em> — quand une autre app de promenade existe",
            "body": """
    <p>MapRaiders ne remplace pas une app de promenade canine spécialisée (carnet de santé, vétérinaires, services). Si tu utilises déjà une app pour gérer ton chien (vaccins, RDV véto, croquettes), garde-la. MapRaiders s'ajoute par-dessus :</p>
    <ul>
      <li><strong>App véto/santé pour la logistique.</strong> RDV, vaccins, recherche de pet sitter.</li>
      <li><strong>MapRaiders pour le jeu et la communauté.</strong> Territoire, Échos, défense, voisinage.</li>
      <li><strong>Pas de conflit GPS.</strong> Les deux apps utilisent le même capteur sans surconsommation notable.</li>
      <li><strong>Pas d'obligation Woog-like.</strong> Tu peux jouer seul, sans interaction sociale forcée.</li>
    </ul>
            """,
        },
        {
            "label": "Comparatif sanft",
            "title": "Woog (souvenir) vs <em>MapRaiders</em> (aujourd'hui)",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Critère</th><th>Woog (2014-2018)</th><th>MapRaiders (2026+)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Carte sociale</td><td class="check">✓ pionnier</td><td class="check">✓ Échos + clans organiques</td></tr>
      <tr><td class="feat-name">Promenade canine</td><td class="check">Cœur du produit</td><td class="check">Cas d'usage central + autres</td></tr>
      <tr><td class="feat-name">Élément de jeu</td><td class="cross">Aucun</td><td class="check">Territoire + défense + Échos</td></tr>
      <tr><td class="feat-name">Communauté locale</td><td class="check">Spots partagés</td><td class="check">Clans de rue + événements</td></tr>
      <tr><td class="feat-name">Modèle</td><td>Freemium</td><td class="check">Free Forever + cosmétiques</td></tr>
      <tr><td class="feat-name">RGPD</td><td class="check">FR natif</td><td class="check">RGPD-conforme, hébergement Europe</td></tr>
      <tr><td class="feat-name">Statut</td><td class="cross">Fermé 2018</td><td class="check">Actif, indépendant</td></tr>
      <tr><td class="feat-name">Élargissement</td><td>Chiens uniquement</td><td>Maîtres + coureurs + cyclistes + familles</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Hommage :</strong> Woog était une idée française remarquable. MapRaiders n'est pas son successeur officiel — mais comble une partie du vide laissé. Avec respect pour le projet original.</p>""",
        },
    ],
    "faq": [
        {"q": "MapRaiders est-il le successeur de Woog ?",
         "a": "Non, pas officiellement. MapRaiders est un projet indépendant développé par Scafa Investments LLC (Floride). Mais beaucoup d'anciens utilisateurs Woog y trouvent des échos familiers : carte sociale, communauté de quartier, focus promenade. Avec en plus un élément de jeu (territoire, défense) que Woog n'avait pas."},
        {"q": "Pourquoi Woog a-t-il fermé en 2018 ?",
         "a": "Les raisons exactes appartiennent à l'équipe Woog. Généralement les apps de niche freemium françaises de cette époque ont souffert d'un modèle économique difficile et de financement insuffisant face aux géants américains. Le marché français était peut-être trop petit pour soutenir une app sociale dédiée chiens à l'époque."},
        {"q": "Mes anciennes données Woog sont-elles importables ?",
         "a": "Non, les serveurs Woog sont éteints depuis 2018. Aucune importation possible. Tu démarres frais sur MapRaiders avec ta propre rue."},
        {"q": "MapRaiders fonctionne-t-il pour les chiens petits, âgés, lents ?",
         "a": "Oui. Pas de vitesse minimum. Le jeu respecte le rythme du chien — marche lente, arrêts fréquents pour renifler, tout compte comme mouvement réel. Comme Woog respectait tous les types de promenades."},
        {"q": "Y a-t-il pub de marques de croquettes ou pet shops ?",
         "a": "Non. MapRaiders est 100% sans pub — ni croquettes, ni pet shops, ni marques. Pet-friendly authentique, comme Woog l'était."},
    ],
    "internal_links": [
        ("/fr/jeu-territoire.html", "Jeu de territoire réel"),
        ("/fr/application-marche-avec-jeu.html", "Application marche avec jeu"),
        ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
        ("/fr/woog-alternative-avis.html", "Avis Woog alternative"),
        ("/fr/mapraiders-avis.html", "Tous les avis"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/fr/jeu-territoire-avis.html",
        "breadcrumb": "Jeu de territoire avis",
        "title": "Jeu de territoire avis — testeurs bêta sur MapRaiders",
        "og_title": "Jeu de territoire — avis réels de la bêta",
        "meta": "Avis sur jeu de territoire au quotidien : trois testeurs bêta racontent comment conquérir terre, decay et mini-jeux de défense fonctionnent dans l'espace urbain réel.",
        "keywords": "jeu de territoire avis, jeu de territoire test, conquerir territoire app avis, mapraiders avis territoire",
        "h1_html": 'Jeu de territoire — quand <em>ta rue</em> est à toi',
        "lead": "Comment c'est de conquérir une rue pour de vrai ? Trois testeurs bêta racontent le premier territoire, le premier choc de Decay et le premier mini-jeu de défense.",
        "intro_label": "Ce qui compte au test",
        "intro_title": "Ce qui rend un <em>jeu de territoire</em> tangible",
        "intro_body": """
    <p>Au test de territoire, trois axes d'expérience comptent :</p>
    <ul>
      <li><strong>Conquête.</strong> Quand la première rue se sent comme «&nbsp;ma terre&nbsp;» ?</li>
      <li><strong>Perte.</strong> Comment réagir au premier Decay ou à la première défaite face à un attaquant ?</li>
      <li><strong>Défense.</strong> Comment se sentent les mini-jeux de défense — tactiques, justes, frustrants ?</li>
    </ul>
    <p>Les citations des trois testeurs couvrent tous les trois axes sous des perspectives très différentes.</p>
        """,
        "internal_links": [
            ("/fr/jeu-territoire.html", "Jeu de territoire réel"),
            ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
            ("/fr/jeu-geolocalise-avis.html", "Avis jeu géolocalisé"),
            ("/fr/mapraiders-avis.html", "Tous les avis"),
        ],
    },
    {
        "slug": "/fr/jeu-geolocalise-avis.html",
        "breadcrumb": "Jeu géolocalisé avis",
        "title": "Jeu géolocalisé avis — MapRaiders au test réel",
        "og_title": "Jeu géolocalisé — avis de testeurs bêta",
        "meta": "Avis sur jeu géolocalisé : trois testeurs bêta rapportent sur batterie, précision GPS, RGPD et plaisir réel au quotidien urbain.",
        "keywords": "jeu geolocalise avis, jeu geolocalise test, gps mmo test, mapraiders avis france",
        "h1_html": 'Jeu géolocalisé — <em>avis</em> de testeurs bêta',
        "lead": "Quelle précision GPS dans les centres urbains ? Combien de batterie l'app consomme sur de longs trajets ? Comment se ressent la conformité RGPD côté joueur ? Trois testeurs répondent honnêtement.",
        "intro_label": "Axes du test",
        "intro_title": "Ce que nous avons testé sur un <em>jeu géolocalisé</em>",
        "intro_body": """
    <p>Le test du jeu géolocalisé tournait autour de quatre axes concrets :</p>
    <ul>
      <li><strong>Précision GPS</strong> dans les ravines urbaines et sous les ponts.</li>
      <li><strong>Consommation de batterie</strong> sur trajets de 1 à 2 heures (comparé à Pokémon GO).</li>
      <li><strong>Sentiment de vie privée</strong> : combien de gêne de tracking apparaît ?</li>
      <li><strong>Mécanique de jeu</strong> : territoire, Échos et quêtes fonctionnent-ils au quotidien réel ?</li>
    </ul>
        """,
        "internal_links": [
            ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
            ("/fr/jeu-territoire.html", "Jeu de territoire réel"),
            ("/fr/jeu-territoire-avis.html", "Avis jeu de territoire"),
            ("/fr/mapraiders-avis.html", "Tous les avis"),
        ],
    },
    {
        "slug": "/fr/alternative-pokemon-go-avis.html",
        "breadcrumb": "Alternative Pokémon GO avis",
        "title": "Alternative Pokémon GO ça vaut le coup ? — testeurs bêta",
        "og_title": "Alternative Pokémon GO ça vaut le coup ? Bêta-test honnête",
        "meta": "Alternative Pokémon GO ça vaut le coup ? Trois testeurs bêta de Stuttgart, Hambourg et Berlin répondent honnêtement sur cardio, promenade et exploration urbaine.",
        "keywords": "alternative pokemon go avis, alternative pokemon go test, mapraiders avis, betatest pokemon go alternative",
        "h1_html": 'Alternative Pokémon GO — <em>ça vaut vraiment le coup ?</em>',
        "lead": "Trois testeurs bêta de trois régions métropolitaines allemandes ont utilisé MapRaiders pendant plusieurs semaines. Voici les rapports sans filtre — sans marketing-talk, sans code d'influenceur.",
        "intro_label": "Qui a testé ?",
        "intro_title": "Trois personnes, trois <em>cas d'usage</em>",
        "intro_body": """
    <p>Les trois testeurs bêta couvrent trois personas très différentes — et c'est ce qui rend la comparaison avec Pokémon GO honnête :</p>
    <ul>
      <li><strong>Ron C.</strong> de la région de Stuttgart : maître de chien, promenade quotidienne, sans background gamer.</li>
      <li><strong>Vivian N.</strong> de la région de Hambourg : coureuse, a joué Pokémon GO en 2018 et arrêté après 3 mois.</li>
      <li><strong>Aljoscha P.</strong> de la région de Berlin : explorateur urbain, vétéran d'Ingress, connaît l'écosystème Niantic en première ligne.</li>
    </ul>
    <p>Les trois ont testé MapRaiders indépendamment — sans promotion payée, sans script. Les citations ont été traduites des originaux allemands.</p>
        """,
        "internal_links": [
            ("/fr/alternative-pokemon-go-gratuit.html", "Alternative Pokémon GO gratuit"),
            ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
            ("/fr/jeu-geolocalise-avis.html", "Avis jeu géolocalisé"),
            ("/fr/mapraiders-avis.html", "Tous les avis"),
        ],
    },
    {
        "slug": "/fr/pokemon-go-saudi-avis.html",
        "breadcrumb": "Pokémon GO Saudi avis",
        "title": "Pokémon GO Saudi avis — testeurs bêta sur RGPD",
        "og_title": "Pokémon GO Saudi alternative — avis RGPD honnêtes",
        "meta": "Pokémon GO Saudi avis : trois testeurs bêta racontent comment ils vivent l'alternative RGPD-conforme, indépendante, sans fonds souverain. Hambourg, Stuttgart, Berlin.",
        "keywords": "pokemon go saudi avis, pokemon go scopely avis, alternative niantic saoudien avis, mapraiders rgpd avis",
        "h1_html": 'Pokémon GO Saudi — <em>avis sur l\'alternative RGPD</em>',
        "lead": "Comment se sentent les joueurs Pokémon GO ex-Niantic après le rachat saoudien de mars 2025 ? Trois testeurs bêta racontent leur transition vers une alternative RGPD-conforme, indépendante.",
        "intro_label": "Question centrale",
        "intro_title": "L'<em>indépendance étatique</em> change-t-elle l'expérience de jeu ?",
        "intro_body": """
    <p>Les trois testeurs bêta ont évalué l'argument anti-PIF sous des angles pratiques :</p>
    <ul>
      <li><strong>Ressenti privacy.</strong> Différence entre savoir que tes pas vont à un PIF étatique et savoir qu'ils ne vont nulle part ?</li>
      <li><strong>Trust juridique.</strong> Mentions légales conformes CNIL, hébergement européen — comment ça se ressent ?</li>
      <li><strong>Migration mentale.</strong> Comment lâcher Pokémon GO après 7 ans d'investissement personnel ?</li>
      <li><strong>Compatibilité usage.</strong> Faut-il rejouer toute la stratégie ou les réflexes restent valides ?</li>
    </ul>
        """,
        "internal_links": [
            ("/fr/pokemon-go-saudi-alternative.html", "Pokémon GO Saudi alternative"),
            ("/fr/alternative-pokemon-go-gratuit.html", "Alternative Pokémon GO gratuit"),
            ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
            ("/fr/mapraiders-avis.html", "Tous les avis"),
        ],
    },
    {
        "slug": "/fr/application-marche-avis.html",
        "breadcrumb": "Application marche avis",
        "title": "Application marche avec jeu avis — test réel",
        "og_title": "Application marche avec jeu — ça vaut le coup au quotidien ?",
        "meta": "Application marche avec jeu ça vaut le coup ? Testeurs bêta racontent motivation cardio, batterie sur longs trajets et perte de territoire après pause maladie.",
        "keywords": "application marche avis, application marche jeu avis, cardio app test france, strava territoire avis",
        "h1_html": 'Application marche avec jeu — <em>ça vaut le coup ?</em>',
        "lead": "Que devient la motivation à marcher quand chaque parcours défend de la vraie terre ? Comment se sent le premier Decay après une pause grippe ? Trois testeurs bêta — une coureuse, un walker, un explorateur urbain — répondent.",
        "intro_label": "Axes du test",
        "intro_title": "Ce qu'une <em>application de marche</em> doit livrer",
        "intro_body": """
    <p>Nous avons testé l'expérience de marche sur trois axes :</p>
    <ul>
      <li><strong>Ancrage motivationnel.</strong> Quand quelqu'un revient après une pause ?</li>
      <li><strong>Batterie en long trajet.</strong> Trajets de 60-90 minutes sans vider le téléphone.</li>
      <li><strong>Cross-modalité.</strong> Fonctionne-t-il pareil pour course, walking et promenade canine ?</li>
    </ul>
        """,
        "internal_links": [
            ("/fr/application-marche-avec-jeu.html", "Application marche avec jeu"),
            ("/fr/woog-alternative.html", "Woog alternative"),
            ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
            ("/fr/mapraiders-avis.html", "Tous les avis"),
        ],
    },
    {
        "slug": "/fr/chasse-au-tresor-avis.html",
        "breadcrumb": "Chasse au trésor avis",
        "title": "Chasse au trésor application avis — testeurs bêta MapRaiders",
        "og_title": "Chasse au trésor application — avis réels de la bêta",
        "meta": "Avis sur application de chasse au trésor sans acheter de tour ni préparation : testeurs bêta racontent comment MapRaiders transforme la ville entière en chasse au trésor en direct.",
        "keywords": "chasse au tresor application avis, chasse au tresor app test, chasse tresor live avis, famille chasse tresor avis",
        "h1_html": 'Chasse au trésor application — <em>avis</em> sans acheter de tour',
        "lead": "La plupart des apps de chasse au trésor exigent de la préparation : acheter un tour, planifier l'itinéraire, monter les stations. Comment se sent-on quand la ville entière vient déjà pleine d'indices ? Trois testeurs bêta répondent.",
        "intro_label": "Question du test",
        "intro_title": "Une <em>chasse au trésor en direct</em> sans préparation, ça marche ?",
        "intro_body": """
    <p>Nous avons testé les fonctions de chasse au trésor dans trois scénarios :</p>
    <ul>
      <li><strong>Seul</strong> comme explorateur urbain (Aljoscha P.) — déposer des Échos, trouver des Échos.</li>
      <li><strong>Avec chien</strong> en promenade normale (Ron C.) — indices comme sous-produit de la promenade.</li>
      <li><strong>Scénario familial</strong> simulé — combien de temps adultes + enfants comprennent-ils la mécanique ?</li>
    </ul>
        """,
        "internal_links": [
            ("/fr/chasse-au-tresor-application.html", "Chasse au trésor application"),
            ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
            ("/fr/jeu-territoire.html", "Jeu de territoire réel"),
            ("/fr/mapraiders-avis.html", "Tous les avis"),
        ],
    },
    {
        "slug": "/fr/woog-alternative-avis.html",
        "breadcrumb": "Woog alternative avis",
        "title": "Woog alternative avis — maîtres de chien testent MapRaiders",
        "og_title": "Woog alternative — avis réels de maîtres",
        "meta": "Avis sur alternative Woog : maîtres de chien bêta racontent comment MapRaiders comble le vide laissé depuis 2018 — territoire, Échos, communauté locale.",
        "keywords": "woog alternative avis, woog application avis, alternative woog test, app promenade chien avis france",
        "h1_html": 'Woog alternative — <em>avis</em> de maîtres de chien',
        "lead": "Woog manquait à beaucoup depuis 2018. Comment ça fait de retrouver une carte sociale, une communauté de quartier — et en plus un jeu de territoire ? Maîtres bêta répondent.",
        "intro_label": "Axes du test",
        "intro_title": "Ce qu'une <em>alternative Woog</em> doit respecter",
        "intro_body": """
    <p>Nous avons testé l'usage pet-friendly sur trois axes :</p>
    <ul>
      <li><strong>Attention au chien.</strong> L'app distrait-elle du chien ?</li>
      <li><strong>Rythme de l'animal.</strong> Fonctionne avec chien petit, âgé, lent ?</li>
      <li><strong>Communauté locale.</strong> Les maîtres parviennent-ils à se connecter sans réseau social parallèle, comme Woog le permettait ?</li>
    </ul>
        """,
        "internal_links": [
            ("/fr/woog-alternative.html", "Woog alternative"),
            ("/fr/application-marche-avec-jeu.html", "Application marche avec jeu"),
            ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
            ("/fr/mapraiders-avis.html", "Tous les avis"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/fr/mapraiders-avis.html",
    "breadcrumb": "MapRaiders avis",
    "title": "MapRaiders avis — bêta-tests, fondateur, toutes les pages",
    "og_title": "MapRaiders avis — tout au même endroit",
    "meta": "MapRaiders avis : 5,0 sur 5 étoiles dans trois bêta-tests vérifiés, statement du fondateur, toutes les pages Killer et rapports d'avis liés centralement. RGPD.",
    "keywords": "mapraiders avis, mapraiders avis france, mapraiders test, gps mmo avis france, alternative pokemon go avis",
    "badge": "Hub & Vue d'ensemble",
    "pricing_pill": "5,0 / 5 — 3 avis vérifiés de la bêta",
    "h1_html": '<em>MapRaiders avis</em> — tout ce que tu dois savoir sur le GPS MMO',
    "lead": "Trois testeurs bêta de Stuttgart, Hambourg et Berlin. Sept sujets Killer de la comparaison Pokémon GO à l'application chasse au trésor. Sept avis détaillés. Un hub.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "Qu'est-ce que MapRaiders au juste ?",
         "a": "MapRaiders est un GPS MMO pour Android. Les joueurs conquièrent des territoires réels par le mouvement, déposent des Échos, créent des quêtes et défendent leur terre avec des mini-jeux. Sans pub, RGPD-conforme, gratuit. Paiement par CB, PayPal, Apple Pay, Google Pay ou Klarna pour les cosmétiques."},
        {"q": "Combien de testeurs bêta sont-ils ?",
         "a": "Actuellement trois personnes que nous rendons publiques — avec leur consentement et sous prénom + initiale par souci de protection de la vie privée. La bêta fermée dans son ensemble est plus large ; les trois cités représentent les personas principales."},
        {"q": "Les avis sont-ils réels ?",
         "a": "Oui. Les trois testeurs sont des personnes réelles de la bêta fermée en Allemagne. Ils n'ont pas été payés ; leurs citations ont été initialement écrites en allemand et traduites en français. Dans le markup Schema.org elles sont marquées avec date, langue et référence à l'original allemand (translationOfWork)."},
        {"q": "Où puis-je être testeur bêta en France ?",
         "a": "Inscris-toi sur la page d'accueil française avec ton e-mail. Des places de bêta françaises seront libérées par vagues après le lancement principal — priorité aux maîtres de chien, coureurs et explorateurs urbains de villes françaises avec faible densité Pokémon GO."},
        {"q": "Quand l'app sort-elle officiellement en France ?",
         "a": "MapRaiders est en bêta fermée sur Google Play (Allemagne). Lancement FR officiel prévu pour l'été 2026 (juillet-août). iOS au Q3 2026. Mentions légales conformes CNIL, hébergement européen, RGPD strict."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print("=== Phase 1 Session 3 — FR Killer-URL Builder ===")
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
        print(f"  fr/{n}")


if __name__ == "__main__":
    main()

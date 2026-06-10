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
    "quote": "Mon chien sort deux fois par jour de toute façon, du coup je prends le bloc avec moi sans y penser. Ça paraît bête, mais le soir je vérifie quand même que tout est encore bleu.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "name_de": "Vivian N.",
    "role": "Coureuse · région de Hambourg",
    "role_long": "Coureuse de la région de Hambourg (bêta fermée)",
    "quote": "Je cours déjà tous les matins, sauf que maintenant je défends quelque chose. Mon tour de l'Alster m'appartient, et je voudrais que ça reste comme ça. Bizarre la discipline que ça mobilise d'un coup.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "name_de": "Aljoscha P.",
    "role": "Explorateur urbain · région de Berlin",
    "role_long": "Explorateur urbain de la région de Berlin (bêta fermée)",
    "quote": "Tu poses une petite piste audio devant une porte d'immeuble, trois jours plus tard quelqu'un que tu ne connais pas l'a trouvée. Ça fait un effet bizarrement intime pour un jeu.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder Quote FR (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "J'ai joué à Pokémon GO pendant trois ans, puis j'ai fini par lâcher. Ce qui me manquait "
    "n'est jamais venu : du vrai terrain au lieu de gyms qui s'évaporent. Quand le rachat saoudien "
    "est tombé en 2025, c'était clair pour moi que la direction prise par Niantic n'était plus la "
    "mienne. Donc je construis MapRaiders moi-même. Sans pub, sans pression d'investisseurs, sans "
    "abonnement obligatoire. Mon quartier, c'est mon terrain de jeu ; le tien, tu peux aller le chercher."
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
      Note : les testeurs sont des participants internes de la bêta fermée (Allemagne). Le prénom + initiale est utilisé à leur demande, pour des raisons de vie privée. Les avis ont été traduits depuis l'allemand vers le français.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    """WhatsApp-Sharing-Button + Telegram + Mastodon (FR-privacy-tech-audience)."""
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    wa_text = f"Regarde%20MapRaiders%20%3A%20{enc}"
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
  <p class="f-copy">&copy; 2026 MapRaiders. Ton quartier, ton terrain. Scafa Investments LLC.</p>
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
        "name": "MapRaiders FR : toutes les pages Killer et avis",
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
  <cite>– {page['trigger']['author']}</cite>
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
  <h2 class="sec-title rv d1">5,0 sur 5 étoiles, sur <em>trois avis bêta</em></h2>
  <div class="prose rv d2">
    <p>Ron sort tous les jours avec son chien, Vivian court le matin, Aljoscha arpente Berlin à pied. Tous les trois ont utilisé MapRaiders plusieurs semaines dans leur routine normale, et ont fait remonter leurs retours en allemand. Pour des raisons de vie privée, nous n'utilisons que le prénom et l'initiale.</p>
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
  <h2 class="sec-title rv d1">Tous les <em>sujets MapRaiders</em> en un seul endroit</h2>
  <div class="prose rv d2">
    <p>Tu trouves ici les sept pages Killer et les sept avis détaillés qui leur correspondent. Chaque page regarde MapRaiders depuis un angle différent : tantôt comme alternative à Pokémon GO, tantôt comme appli de chasse au trésor, tantôt comme compagnon de course. Tu peux lire chaque page seule, ou enchaîner sujet par sujet.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Avis détaillés</div>
  <h2 class="sec-title rv d1">Ce que les testeurs racontent sous <em>plusieurs angles</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Note agrégée</div>
  <h2 class="sec-title rv d1">5,0 sur 5 étoiles, sur <em>trois avis bêta</em></h2>
  <div class="prose rv d2">
    <p>Les avis viennent de la bêta fermée, entre février et avril 2026. Ron a testé à Stuttgart, Vivian à Hambourg, Aljoscha à Berlin. Tous les trois ont utilisé le jeu sur leurs propres parcours, pas dans un setup de test artificiel. Les retours ont été écrits à l'origine en allemand, ils sont traduits ici en français et correspondent à des personnes réelles.</p>
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
    "title": "Jeu de territoire 2026 : la rue que tu marches devient à toi",
    "og_title": "Jeu de territoire : la terre que tu marches t'appartient",
    "meta": "Jeu de territoire 2026 : MapRaiders est un GPS MMO avec possession persistante de zones réelles. Indépendant, RGPD-conforme, sans pub.",
    "keywords": "jeu de territoire, jeu territoire gps, jeu conquete territoire, conquete quartier app, territory game france, jeu rgpd",
    "badge": "Jeu de territoire",
    "pricing_pill": "Free Forever. RGPD. Indépendant.",
    "h1_html": 'Jeu de territoire : la rue que tu <em>marches devient à toi</em>',
    "lead": "Un jeu de territoire, ce devrait être autre chose qu'un point qui s'évapore au bout de cinq minutes sur une carte. MapRaiders combine GPS, capture persistante de zone et un système de défense où la conquête tient vraiment. Tu marches dans une rue, elle est à toi. Tant que tu la défends. Pas d'éditeur Niantic derrière, pas de fonds souverain, pas de pub.",
    "trigger": {
        "quote": "Conquiers ton quartier. Sans Niantic, sans pub, sans fonds étatique.",
        "author": "MapRaiders, principe de marque"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Définition",
            "title": "Ce qui fait un <em>vrai jeu de territoire</em>",
            "body": """
    <p><strong>Un jeu de territoire</strong>, c'est un jeu où les joueurs possèdent des zones revendiquées sur la carte de façon persistante, les défendent et les étendent. Contrairement aux jeux de capture (gym, portail), la possession reste <strong>persistante</strong>, même quand le joueur est hors ligne.</p>
    <p>Quatre mécaniques définissent un vrai jeu de territoire :</p>
    <ul>
      <li><strong>Persistance.</strong> Les zones conquises restent attribuées au joueur ou au clan jusqu'à ce qu'elles soient activement reprises.</li>
      <li><strong>Decay.</strong> Les territoires inactifs rétrécissent avec le temps. Personne ne bloque indéfiniment une zone sans la rejouer.</li>
      <li><strong>Défense.</strong> En cas d'attaque, c'est un mini-jeu entre les deux joueurs qui tranche, pas une comparaison automatique de stats.</li>
      <li><strong>Transferts de clan.</strong> Les territoires peuvent être transmis aux alliés ou au clan, ce qui ouvre une profondeur économique.</li>
    </ul>
            """,
        },
        {
            "label": "Système MapRaiders",
            "title": "Le <em>système de territoires</em> MapRaiders, en détail",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Revendiquer</h3><p>Marche, promène le chien ou pédale dans une rue. La trace GPS génère le territoire à ton nom, sous forme de polygone visible sur la carte.</p></div>
    <div class="feat-card rv d1"><h3>Decay Engine</h3><p>Si tu ne parcours plus régulièrement un territoire, il rétrécit de quelques pourcents par jour. C'est l'activité qui maintient la terre, pas le porte-monnaie.</p></div>
    <div class="feat-card rv d2"><h3>Mini-jeux de défense</h3><p>Sept mini-jeux différents tranchent les attaques : morpion, pierre-papier-ciseaux, mini-échecs. La stratégie compte plus que les heures jouées.</p></div>
    <div class="feat-card rv d3"><h3>Territoires de clan</h3><p>Plusieurs joueurs peuvent maintenir un territoire ensemble. Les zones de clan sont plus robustes : un attaquant seul ne suffit pas à les briser.</p></div>
  </div>""",
        },
        {
            "label": "Pourquoi les autres ne le sont pas",
            "title": "Pourquoi Pokémon GO et Ingress <em>ne sont pas</em> vraiment des jeux de territoire",
            "body": """
    <p><strong>Les captures de gym de Pokémon GO</strong> sont éphémères. Qui détient un record pendant quelques heures gagne des pièces, mais le territoire lui-même ne se comprend pas comme possession de terre. Le gym est un point, pas une zone.</p>
    <p><strong>Les portails d'Ingress</strong> fonctionnent sur un principe proche : des points qui se relient par des liens en triangles. Le jeu connaît des champs entre portails, mais pas de possession persistante de terrain. Si tu restes une semaine sans ouvrir l'app, tu ne perds pas «&nbsp;ton quartier&nbsp;» pour autant : il ne t'a jamais vraiment été attribué.</p>
    <p>MapRaiders s'attaque exactement à ce point : le <strong>territoire est la ressource de jeu</strong>, pas le point posé dessus. Tu gagnes de la terre, tu en perds, tu en transfères. Comme dans un jeu spatial classique.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Comment fonctionne le système de territoires dans MapRaiders ?",
         "a": "Tu marches physiquement dans des rues et tu revendiques des zones GPS. Ces territoires apparaissent en direct sur la carte et restent à toi tant qu'aucun joueur ne passe pour te défier. Si tu défends avec succès, la zone reste à ton nom."},
        {"q": "Puis-je perdre mon territoire ?",
         "a": "Oui. Le système de Decay fait rétrécir les zones inactives chaque jour. Qui reste actif et parcourt régulièrement sa zone la maintient ; qui s'arrête, perd. C'est ce qui garde la carte vivante."},
        {"q": "Que se passe-t-il lors d'une attaque territoriale ?",
         "a": "L'attaquant doit arriver physiquement sur ton territoire. À ce moment-là, un mini-jeu interactif se lance entre défenseur et attaquant. Le sort de la zone se joue à ce mini-match, pas à un calcul automatique."},
        {"q": "Existe-t-il un système de territoires de clan ?",
         "a": "Oui. Les clans MapRaiders se forment de façon organique et peuvent revendiquer des territoires ensemble. Les zones de clan sont plus solides : il faut plusieurs attaquants pour les briser, donc le travail d'équipe paie."},
        {"q": "Le jeu de territoire est-il gratuit ?",
         "a": "Oui. Tout le gameplay de territoire reste gratuit. Les cosmétiques optionnels (1,99€ à 8,99€) servent à personnaliser marqueurs et couleurs de territoires, sans avantage de jeu. Paiement par carte bancaire, PayPal, Apple Pay, Google Pay ou Klarna."},
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
    "title": "Jeu géolocalisé 2026 : un GPS MMO indépendant, RGPD, sans pub",
    "og_title": "Jeu géolocalisé 2026 : un GPS MMO honnête, RGPD",
    "meta": "Jeu géolocalisé 2026 : MapRaiders propose un territoire persistant, RGPD-conforme, sans pub. GPS MMO indépendant, gratuit, sans AR.",
    "keywords": "jeu geolocalise, jeu geolocalise 2026, meilleur jeu geolocalise france, gps mmo, jeu gps android, location based game",
    "badge": "GPS MMO",
    "pricing_pill": "Free Forever. RGPD. Sans pub.",
    "h1_html": 'Jeu géolocalisé : <em>conquiers ton quartier</em> pour de vrai',
    "lead": "Les jeux géolocalisés devraient être autre chose que des points éphémères sur une carte. MapRaiders combine GPS, capture persistante de territoire et un système de défense où la conquête tient. Tu marches dans une rue, elle est à toi. Tant que tu la défends. Pas de fake GPS, pas d'AR qui vide la batterie, pas de pub. Hébergement européen, RGPD-conforme, sans propriétaire étatique.",
    "trigger": {
        "quote": "Tes pas ne sont vendus ni à Big Tech, ni à un fonds souverain.",
        "author": "MapRaiders, principe RGPD"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Définition",
            "title": "Qu'est-ce qu'un <em>jeu géolocalisé</em>",
            "body": """
    <p>Un <strong>jeu géolocalisé (Location-Based Game)</strong> utilise la position géographique de l'appareil comme mécanique centrale. Contrairement aux jeux AR qui ont besoin en plus de la caméra, un jeu purement géolocalisé fonctionne avec la carte uniquement. C'est meilleur pour la batterie et pour la vie privée.</p>
    <p>MapRaiders est un <strong>GPS MMO</strong> : des milliers de joueurs se déplacent en même temps sur la même carte, s'affrontent en temps réel et partagent un système commun de territoires. Pas d'AR, pas de caméra, pas de casque VR.</p>
            """,
        },
        {
            "label": "Sept comparés",
            "title": "Sept jeux géolocalisés comparés, et pourquoi <em>MapRaiders</em> propose un vrai territoire persistant",
            "body": "<p>La plupart des listes mélangent des apps qui ne partagent qu'une seule caractéristique avec Pokémon GO. Voici une variante plus honnête :</p>",
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
            "label": "Ce qui change",
            "title": "Ce qui change concrètement avec <em>MapRaiders</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territoires persistants</h3><p>Conquiers une rue, elle est à toi jusqu'à ce que quelqu'un la reprenne ou que le decay grignote. Pas de gym éphémère.</p></div>
    <div class="feat-card rv d1"><h3>Échos plutôt qu'AR</h3><p>Dépose des Échos audio, photo ou vidéo dans des lieux réels. D'autres joueurs les découvrent. Sans AR qui vide la batterie.</p></div>
    <div class="feat-card rv d2"><h3>Sept mini-jeux de défense</h3><p>En cas d'attaque : morpion, pierre-papier-ciseaux ou mini-échecs. La tête, pas les heures jouées.</p></div>
    <div class="feat-card rv d3"><h3>Clans organiques</h3><p>Les clans naissent du voisinage, pas d'un serveur Discord. Qui court dans la même rue devient allié.</p></div>
    <div class="feat-card rv d4"><h3>Batterie ménagée</h3><p>Juste du GPS, sans caméra ni AR. Sur les longs trajets, le téléphone tient à peu près quatre fois plus longtemps que sous Pokémon GO.</p></div>
  </div>""",
        },
        {
            "label": "Cas d'usage FR",
            "title": "Quatre <em>profils français</em> typiques",
            "body": "<p>MapRaiders s'ajuste à quatre profils dominants en France :</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Promenade canine</h3><p>Environ 7,5 millions de chiens en France. La sortie quotidienne devient entretien de territoire, sans rien changer à la routine.</p></div>
    <div class="feat-card rv d1"><h3>Course du matin</h3><p>Cardio avec un but : tenir le territoire ou le reprendre. Tu peux faire tourner Strava et MapRaiders en parallèle, ils ne se gênent pas.</p></div>
    <div class="feat-card rv d2"><h3>Tour de France perso</h3><p>Marque tes parcours à vélo, kilomètre par kilomètre. Cosmétiques saisonniers en juillet, événements territoriaux nationaux.</p></div>
    <div class="feat-card rv d3"><h3>Sortie en famille</h3><p>Chasse au trésor par Échos, sans AR ni pub, pour les enfants comme pour les adultes. Compatible RGPD enfants.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Qu'est-ce qu'un jeu géolocalisé ?",
         "a": "Un jeu géolocalisé (Location-Based Game) utilise ta position GPS pour déclencher des mécaniques de jeu. MapRaiders se sert du GPS pour relier territoires, Échos et quêtes à des lieux réels. Ta ville devient le terrain de jeu."},
        {"q": "Ai-je besoin de la Réalité Augmentée ?",
         "a": "Non. MapRaiders est volontairement sans AR. L'app n'utilise que le GPS et la carte. C'est mieux pour la batterie et pour la vie privée : pas de caméra, pas de capture faciale."},
        {"q": "Fonctionne-t-il dans toute la France ?",
         "a": "Oui. Partout où OpenStreetMap couvre le terrain. Dans les centres urbains comme Paris, Lyon ou Marseille, la densité de joueurs est élevée. En zone rurale, moins de concurrence et des territoires plus grands."},
        {"q": "Mes données de localisation sont-elles vendues ?",
         "a": "Non. Nous sommes RGPD-conformes, sans SDK publicitaire, sans vente de données et sans propriétaire étatique. Contrairement à Pokémon GO qui appartient depuis mars 2025 à Scopely (filiale du PIF saoudien). Hébergement européen, mentions légales conformes CNIL."},
        {"q": "Combien ça coûte ?",
         "a": "Le gameplay est gratuit. Les cosmétiques (1,99€ à 8,99€) sont purement esthétiques, sans avantage de jeu. Paiement par CB, PayPal, Apple Pay, Google Pay ou Klarna FR."},
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
    "title": "Alternative Pokémon GO gratuite : sans pub, sans Battle Pass",
    "og_title": "Alternative Pokémon GO gratuite : 100% libre, sans Battle Pass",
    "meta": "Alternative Pokémon GO gratuite : MapRaiders reste 100% gratuit, sans pub, sans Battle Pass. Territoire réel, pas de gym éphémère. RGPD.",
    "keywords": "alternative pokemon go gratuit, alternative pokemon go gratuite, jeu gps gratuit france, sans pub, sans battle pass, rgpd",
    "badge": "Alternative Pokémon GO",
    "pricing_pill": "Gameplay 0€. Cosmétique optionnel à partir de 1,99€.",
    "h1_html": 'Alternative Pokémon GO gratuite : sans pub, <em>sans fonds étatique</em>, sans Battle Pass',
    "lead": "Beaucoup de joueurs cherchent une alternative à Pokémon GO qui n'impose ni Battle Pass, ni Remote Raid Pass à rallonge, ni pub, et finissent par tomber dans le piège du premium suivant. MapRaiders prend l'autre chemin : tout le gameplay reste gratuit, point. Pas de niveau payant, pas d'abonnement obligatoire, pas de vente de données. Pour les cosmétiques optionnels, tu paies par carte bancaire ou Klarna.",
    "trigger": {
        "quote": "Tes pas ne sont vendus ni à Big Tech, ni à un fonds souverain.",
        "author": "MapRaiders, principe RGPD"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Pourquoi chercher ?",
            "title": "Pourquoi les joueurs Pokémon GO français cherchent <em>une alternative gratuite</em> en 2026",
            "body": """
    <p>Trois points de friction ont fait mûrir le marché français entre 2024 et 2026 :</p>
    <ul>
      <li><strong>Frustration Battle Pass.</strong> Des passes saisonniers dont les avantages restent bloqués sans paiement. Qui rate une saison perd ses récompenses pour de bon.</li>
      <li><strong>Polémique Remote Raid Pass.</strong> Niantic a augmenté les prix et réduit la disponibilité. Une vague de joueurs français a décroché en 2023.</li>
      <li><strong>Rachat saoudien de mars 2025.</strong> Niantic a vendu Pokémon GO à Scopely, filiale du Public Investment Fund saoudien. Les données de localisation de millions de joueurs remontent désormais indirectement à un fonds souverain étranger. La question CNIL/RGPD est posée.</li>
    </ul>
            """,
        },
        {
            "label": "Que veut dire gratuit ?",
            "title": "Ce que <em>«&nbsp;gratuit&nbsp;»</em> veut dire concrètement dans MapRaiders",
            "body": "<p>Des tiers transparents, sans paywall caché ni blocage de tutoriel après dix minutes :</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>Inclus</th><th>Prix (FR, TVA 20%)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% du gameplay (territoires, Échos, quêtes, clans, défense, événements)</td><td>0€</td></tr>
      <tr><td class="feat-name">Cosmétique-IAP</td><td>Designs de marqueurs, couleurs de territoires, emblèmes de clan, skins</td><td>1,99€ &ndash; 8,99€</td></tr>
      <tr><td class="feat-name">MapRaiders Soutien (Sub)</td><td>Badge honorifique, accès bêta, lettre du fondateur, pack cosmétique mensuel</td><td>3,99€ / mois</td></tr>
      <tr><td class="feat-name">Soutien à vie</td><td>Cosmétique collectionneur + crédits in-game</td><td>99€ (une fois)</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>À noter :</strong> les cosmétiques ne donnent aucun avantage de jeu. Tu joues avec exactement les mêmes mécaniques qu'un joueur Soutien à vie.</p>""",
        },
        {
            "label": "Paiement FR",
            "title": "Paiement <em>européen</em>, sans casse-tête",
            "body": """
    <p>Les cosmétiques optionnels et l'abonnement Soutien se paient par Carte Bancaire, PayPal, Apple Pay, Google Pay ou Klarna FR. Pas besoin de saisir une carte américaine. Klarna te laisse payer en 3 ou 4 fois sans frais. Le cosmétique se débloque en quelques secondes.</p>
    <p>Côté prestataires : Stripe Europe, PayPal Europe, Klarna FR. Pas de frais cachés pour le joueur, pas de PayPal obligatoire, hébergement européen.</p>
            """,
        },
        {
            "label": "La question saoudienne",
            "title": "Que deviennent <em>tes pas</em> depuis le rachat ?",
            "body": """
    <p>En mars 2025, Niantic a vendu sa division jeux (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) pour 3,5 milliards de dollars à Scopely. Scopely est une filiale du Public Investment Fund (PIF) saoudien, donc formellement une entité contrôlée par l'État saoudien.</p>
    <p>Ce que ça implique : les <strong>données de localisation d'environ 30 millions de joueurs mensuels de Pokémon GO</strong> (où ils courent, quand ils promènent le chien, quels itinéraires ils prennent chaque jour) passent désormais par l'infrastructure Scopely. Le détail des transferts de données n'est pas rendu public. Ce qui est sûr, c'est qu'il n'existe pas de protection équivalente au RGPD face à un acteur lié à un fonds souverain hors UE.</p>
    <p>MapRaiders est une LLC américaine en <strong>propriété privée</strong> (Scafa Investments LLC, Floride), portée par une équipe indépendante. Nos serveurs sont en Europe et conformes RGPD, nous ne vendons pas de données, aucun réseau publicitaire n'est branché dessus, aucun État ne nous contrôle.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders est-il vraiment gratuit pour toujours ?",
         "a": "Oui. Tout le gameplay principal (conquérir des territoires, déposer des Échos, créer des quêtes, former des clans) reste gratuit pour toujours. Pas de système de niveaux payants, pas de Battle Pass, pas d'abonnement obligatoire."},
        {"q": "Combien coûte le Cosmétique-IAP ?",
         "a": "Les cosmétiques (designs de marqueurs, couleurs de territoires, emblèmes de clan) coûtent entre 1,99€ et 8,99€ TVA 20% incluse. Ils sont purement esthétiques, sans avantage de jeu. Paiement par CB, PayPal, Apple Pay, Google Pay ou Klarna."},
        {"q": "Puis-je payer en plusieurs fois ?",
         "a": "Oui, via Klarna FR : 3 ou 4 fois sans frais sur les cosmétiques et sur le Soutien Sub. Tu peux aussi utiliser PayPal Europe, Carte Bancaire ou Apple/Google Pay."},
        {"q": "Y a-t-il de la pub dans l'app ?",
         "a": "Non. MapRaiders est 100% sans pub. Nous ne vendons ni tes données, ni d'espace publicitaire. Conforme RGPD, hébergement européen."},
        {"q": "Que veut dire «&nbsp;sans fonds étatique&nbsp;» ?",
         "a": "En mars 2025, Niantic a vendu sa division jeux (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) pour 3,5 milliards de dollars à Scopely, filiale du Public Investment Fund saoudien. Les données de localisation de plus de 30 millions de joueurs mensuels remontent désormais indirectement à un fonds souverain étranger. MapRaiders, à l'inverse, est une LLC américaine privée, sans actionnaire étatique, RGPD-conforme."},
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
    "title": "Pokémon GO Saudi : une alternative RGPD pour la France",
    "og_title": "Pokémon GO Saudi alternative : RGPD, sans PIF, indépendante",
    "meta": "Pokémon GO racheté par un fonds souverain saoudien en 2025 ? MapRaiders est une alternative RGPD-conforme, indépendante, hébergée en Europe.",
    "keywords": "pokemon go saudi, pokemon go arabie saoudite, pokemon go scopely pif, alternative pokemon go rgpd, jeu gps independant, alternative niantic saoudien",
    "badge": "RGPD. Sans PIF. FR-Exclusif.",
    "pricing_pill": "RGPD-conforme. Hébergement Europe. Sans fonds souverain.",
    "h1_html": 'Pokémon GO Saudi : l\'<em>alternative RGPD</em> qui n\'appartient à aucun État',
    "lead": "En mars 2025, Niantic a vendu Pokémon GO à Scopely, filiale du Public Investment Fund (PIF) saoudien. Du jour au lendemain, les données de localisation de 30 millions de joueurs mensuels (dont des centaines de milliers de Français) atterrissent indirectement chez un fonds souverain étranger. La CNIL regarde. Les joueurs s'interrogent. MapRaiders propose une voie de sortie : RGPD-conforme, indépendante, sans PIF, sans pub, gratuite.",
    "trigger": {
        "quote": "Tes pas ne sont vendus ni à Big Tech, ni à un fonds souverain.",
        "author": "MapRaiders, principe RGPD"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Mars 2025, les faits",
            "title": "Le <em>rachat saoudien</em> de Pokémon GO, chronologie sourcée",
            "body": """
    <p>Mars 2025. Niantic, Inc. (San Francisco, créateur de Pokémon GO et Ingress) annonce officiellement la vente de sa division Games à Scopely pour 3,5 milliards de dollars. Sont inclus : Pokémon GO, Ingress Prime, Pikmin Bloom et Monster Hunter Now.</p>
    <p>Scopely n'est pas un éditeur indépendant. Depuis avril 2023, Scopely est une filiale à 100% de Savvy Games Group, entité elle-même détenue à 100% par le Public Investment Fund (PIF) saoudien. Le PIF est le fonds souverain du Royaume d'Arabie Saoudite, dirigé directement par le prince héritier Mohammed bin Salman.</p>
    <p>Concrètement : depuis mars 2025, l'infrastructure technique et les données de Pokémon GO sont sous contrôle d'une filiale d'un fonds souverain saoudien. Le détail des transferts de données vers le siège saoudien n'est pas rendu public. Aucune communication officielle de la CNIL n'a été émise à ce jour.</p>
            """,
        },
        {
            "label": "Implications RGPD",
            "title": "Côté joueurs FR : la <em>question CNIL/RGPD</em>",
            "body": """
    <p>Quatre points de friction RGPD/CNIL sortent du lot :</p>
    <ul>
      <li><strong>Transferts hors UE peu transparents.</strong> Le PIF est basé à Riyad. L'Arabie Saoudite n'est pas reconnue comme pays à protection adéquate par la Commission européenne. Tout transfert exige des Clauses Contractuelles Types (CCT), et là-dessus on manque d'informations.</li>
      <li><strong>Localisation = donnée sensible.</strong> Trajets quotidiens, itinéraires de course, lieux de promenade canine : c'est un profil comportemental complet. La CNIL classe ces données comme particulièrement sensibles (Délibération 2023-014).</li>
      <li><strong>Consentement éclairé fragilisé.</strong> Les utilisateurs FR qui ont accepté les CGU Niantic entre 2017 et 2024 n'ont pas consenti à un transfert vers un fonds souverain saoudien. Le RGPD impose un nouveau consentement spécifique.</li>
      <li><strong>Risque de réquisition étatique.</strong> Une infrastructure sous contrôle d'un État peut faire l'objet de demandes d'accès gouvernementales, sans recours équivalent au cadre européen.</li>
    </ul>
    <p>Pour rappel : la CNIL a infligé 55 millions d'euros d'amendes RGPD en 2024 et prononcé 331 mesures correctives. Le cadre français est juridiquement strict.</p>
            """,
        },
        {
            "label": "MapRaiders indépendant",
            "title": "Pourquoi MapRaiders <em>reste indépendant</em> : statut, financement, juridiction",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Critère</th><th>Pokémon GO (depuis 03/2025)</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Propriétaire ultime</td><td class="cross">Scopely → Savvy → PIF (Arabie Saoudite)</td><td class="check">Scafa Investments LLC (privé, Floride)</td></tr>
      <tr><td class="feat-name">Financement</td><td>Fonds souverain étatique</td><td class="check">Auto-financé, indépendant</td></tr>
      <tr><td class="feat-name">Hébergement données</td><td>Infrastructure Scopely (US/Saudi)</td><td class="check">Serveurs UE, conformes RGPD</td></tr>
      <tr><td class="feat-name">SDK publicitaires</td><td class="cross">Présents</td><td class="check">Aucun</td></tr>
      <tr><td class="feat-name">Vente de données</td><td>Politique opaque</td><td class="check">Aucune. Modèle cosmétique</td></tr>
      <tr><td class="feat-name">Recours utilisateur</td><td>CGU américaines/saoudiennes</td><td class="check">Droit européen + CNIL</td></tr>
      <tr><td class="feat-name">Mentions légales FR</td><td>Anglais primaire</td><td class="check">Conformes CNIL, en français</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Garantie de non-cession :</strong> Scafa Investments LLC s'engage à ne pas vendre MapRaiders à un acteur étatique ou à un fonds souverain. La clause figure dans les CGU et reste opposable juridiquement.</p>""",
        },
        {
            "label": "Mastodon, Qwant",
            "title": "Pour la communauté <em>Privacy-Tech française</em>",
            "body": """
    <p>MapRaiders s'aligne sur l'écosystème Privacy-Tech français :</p>
    <ul>
      <li><strong>Compte Mastodon</strong> sur instance francophone (mamot.fr ou pouet.chapril.org), sans obligation Twitter/X.</li>
      <li><strong>Indexation Qwant</strong> en plus de Google ; le moteur de recherche français reste une cible secondaire affirmée.</li>
      <li><strong>Pas de Google Analytics.</strong> Stats internes uniquement, sans tracker tiers.</li>
      <li><strong>Approche open data.</strong> Cartographie OpenStreetMap plutôt que Google Maps.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Pokémon GO appartient-il vraiment à l'Arabie Saoudite maintenant ?",
         "a": "Indirectement, oui. En mars 2025, Niantic a vendu sa division jeux (dont Pokémon GO) à Scopely pour 3,5 milliards de dollars. Scopely est filiale à 100% de Savvy Games Group, lui-même détenu à 100% par le Public Investment Fund (PIF), fonds souverain de l'État saoudien. Les serveurs et l'infrastructure sont donc sous contrôle d'une entité étatique étrangère."},
        {"q": "Mes données Pokémon GO sont-elles transférées en Arabie Saoudite ?",
         "a": "Le détail des transferts n'est pas rendu public par Scopely. Ce qui est sûr, c'est que depuis mars 2025 l'infrastructure et la gouvernance des données sont sous contrôle Scopely. L'Arabie Saoudite n'étant pas reconnue par la Commission européenne comme pays à protection adéquate, tout transfert exige des Clauses Contractuelles Types ; le cadre exact reste opaque."},
        {"q": "MapRaiders est-il RGPD-conforme et hébergé en Europe ?",
         "a": "Oui. Serveurs en Europe (Allemagne ou France selon le déploiement), aucun SDK publicitaire, mentions légales conformes CNIL en français, droit applicable européen. Scafa Investments LLC (Floride) est l'éditeur privé indépendant, sans actionnaire étatique."},
        {"q": "MapRaiders peut-il être racheté par un fonds souverain plus tard ?",
         "a": "Une clause de non-cession étatique figure dans les CGU MapRaiders. Scafa Investments LLC s'engage juridiquement à ne pas céder le projet à un acteur étatique ou à un fonds souverain. La clause est opposable et auditable."},
        {"q": "Comment migrer de Pokémon GO vers MapRaiders ?",
         "a": "Il n'y a pas de migration de compte : les données Niantic restent chez Scopely. Tu crées un nouveau compte MapRaiders avec ton e-mail, tu démarres sur ta propre rue, et tu reprends ton quartier en quelques semaines de marche ou de course. Beaucoup d'ex-joueurs Pokémon GO trouvent ça plutôt libérateur : pas de FOMO de saison perdue, pas de Battle Pass à rattraper."},
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
    "title": "Application de marche avec jeu : chaque pas conquiert un territoire",
    "og_title": "Application de marche avec jeu : cardio, jeu, santé",
    "meta": "Application de marche avec jeu : MapRaiders transforme chaque promenade en conquête de territoire. Cardio, jeu, santé. Compatible Strava, RGPD, sans pub.",
    "keywords": "application marche avec jeu, application marche jeu, app cardio gps france, strava territoire, app marche rgpd, application sport gps",
    "badge": "Cardio plus jeu",
    "pricing_pill": "Free Forever. Quatre fois moins de batterie que Pokémon GO. Compatible Strava.",
    "h1_html": 'Application de marche avec jeu : quand <em>chaque pas</em> conquiert un territoire',
    "lead": "Les apps de marche donnent des stats. Les jeux de marche type Pokémon GO donnent de la collection. Mais aucune ne transforme ton vrai chemin en vrai terrain. MapRaiders, si : chaque pas façonne un territoire, chaque retour le défend. Cardio avec conséquence, sortie famille, santé qui tient. Et compatible Strava : on complète, on ne remplace pas.",
    "trigger": {
        "quote": "Je cours déjà tous les matins, sauf que maintenant je défends quelque chose. Mon tour de l'Alster m'appartient, et je voudrais que ça reste comme ça.",
        "author": "Vivian N., coureuse de la région de Hambourg (bêta fermée)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "Le manque",
            "title": "Pourquoi les <em>apps de marche</em> classiques ne suffisent pas",
            "body": """
    <p>Strava, Nike Run Club, Adidas Running, Decathlon Coach mesurent le temps, la distance, l'allure. Mais beaucoup de Français y trouvent trois manques :</p>
    <ul>
      <li><strong>Pas d'enjeu de jeu.</strong> Si tu ne chasses pas tes propres records, la motivation tombe en quatre semaines.</li>
      <li><strong>Pression de performance.</strong> Les classements publics démotivent souvent plus qu'ils n'aident.</li>
      <li><strong>Pression à l'abonnement.</strong> Strava Premium à 8,99€/mois pour des cartes thermiques et des comparaisons qui deviennent inutilisables dans le plan gratuit.</li>
    </ul>
            """,
        },
        {
            "label": "Ce que ça change",
            "title": "Comment MapRaiders <em>déplace ta routine</em> de marche",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Tenir le territoire</h3><p>Chaque sortie défend du terrain. Trois jours sans bouger et le decay grignote, ce qui suffit en général à te faire ressortir.</p></div>
    <div class="feat-card rv d1"><h3>Indicateur de Decay</h3><p>La jauge te dit : «&nbsp;si tu ne sors pas aujourd'hui, ton quartier rétrécit de X%&nbsp;». Pas de culpabilisation, juste un fait physique.</p></div>
    <div class="feat-card rv d2"><h3>Défense de clan en courant</h3><p>Pendant la course, des notifications push préviennent quand le territoire du clan est attaqué. Tu ne cours plus seul.</p></div>
    <div class="feat-card rv d3"><h3>Récompense par Écho</h3><p>Des Échos audio se déclenchent quand tu passes. D'autres joueurs racontent leur rue, sans pub ni influenceur.</p></div>
  </div>""",
        },
        {
            "label": "Strava en complément",
            "title": "MapRaiders <em>complète</em> Strava au lieu de le remplacer",
            "body": """
    <p>MapRaiders ne joue pas dans la même cour que Strava sur les métriques de performance. Tu peux laisser tourner les deux apps en parallèle ; elles utilisent le même capteur GPS sans conflit. Strava ne donne pas de territoire réel ni de défense sociale. MapRaiders ne donne pas d'analyse détaillée des splits d'allure ou des zones cardiaques.</p>
    <p>La combinaison la plus simple : <strong>Strava pour l'analyse, MapRaiders pour la motivation quotidienne et le terrain.</strong> Tu lances les deux, sans coût batterie disproportionné, l'un avec AR et l'autre sans.</p>
            """,
        },
        {
            "label": "Tour de France perso",
            "title": "Ton <em>Tour de France</em> à toi, kilomètre par kilomètre",
            "body": """
    <p>Le Tour de France a un statut culte. MapRaiders te permet d'en vivre l'esprit chaque matin :</p>
    <ul>
      <li><strong>Une rue conquise vaut une étape.</strong> Le rythme du jour devient une petite saga personnelle.</li>
      <li><strong>Mode cycliste optimisé.</strong> Détection automatique du vélo, polygones de territoire larges adaptés à la vitesse.</li>
      <li><strong>Maillot virtuel.</strong> Cosmétiques saisonniers en juillet : jaune, vert, pois rouges.</li>
      <li><strong>Événements estivaux.</strong> 14 juillet et première semaine du Tour : événements territoriaux nationaux.</li>
    </ul>
            """,
        },
        {
            "label": "60 ans et plus",
            "title": "Marcher passé <em>60 ans</em>, sans AR ni compétition agressive",
            "body": """
    <p>La France compte plus de 17 millions de personnes de 60 ans et plus. La marche est l'activité la plus recommandée par les gériatres, mais la motivation manque souvent. MapRaiders répond à ça sans AR qui déroute et sans compétition qui éloigne :</p>
    <ul>
      <li><strong>Rythme libre.</strong> Pas de vitesse minimum. Walking, marche avec canne, marche avec un proche : tout compte pour le territoire.</li>
      <li><strong>La même rue chaque jour, ça marche.</strong> La persistance prime sur la distance. Qui répète, maintient.</li>
      <li><strong>Communauté de quartier.</strong> Clans organiques entre voisins, sans Discord ni chat toxique.</li>
      <li><strong>Compatible RGPD.</strong> Pour les seniors attentifs à la vie privée : pas de pub ciblée, pas de vente de localisation.</li>
      <li><strong>Le plaisir de marcher n'a pas d'âge.</strong></li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Combien de batterie ça consomme ?",
         "a": "Sur une marche d'une heure, typiquement entre 15 et 25% de batterie (contre environ 50% pour Pokémon GO avec AR). Les valeurs varient selon l'appareil et la luminosité de l'écran."},
        {"q": "Fonctionne-t-il avec Strava ou Nike Run Club ?",
         "a": "Pas d'intégration directe pour l'instant. Tu peux faire tourner les deux apps en parallèle ; elles utilisent le même capteur GPS sans se gêner. Une intégration Strava est prévue pour Q4 2026."},
        {"q": "La marche lente compte-t-elle ?",
         "a": "Oui. Pas de vitesse minimum. Walking, marche lente, promenade : tout forme du territoire dès qu'il y a un vrai mouvement physique (pas d'auto-cheating)."},
        {"q": "Une personne âgée peut-elle l'utiliser ?",
         "a": "Oui, c'est pensé pour tous les âges. Pas d'AR, pas de bruit, pas de pression sur l'allure. Grands caractères, contraste élevé, contrôles simples."},
        {"q": "Combien ça consomme en données mobiles ?",
         "a": "Peu. Pas de live vidéo, pas d'API lourde. Une marche d'une heure utilise en gros 5 à 15 Mo. Conforme RGPD, sans tracking publicitaire."},
    ],
    "internal_links": [
        ("/fr/jeu-geolocalise.html", "Meilleur jeu géolocalisé 2026"),
        ("/fr/alternative-pokemon-go-gratuit.html", "Alternative Pokémon GO gratuit"),
        ("/fr/woog-alternative.html", "Woog alternative : promenade chien"),
        ("/fr/application-marche-avis.html", "Avis : ça vaut le coup ?"),
        ("/fr/mapraiders-avis.html", "Tous les avis"),
    ],
}

# K6 — chasse-au-tresor-application (Volume-King 4-6K/mois)
K6 = {
    "slug": "/fr/chasse-au-tresor-application.html",
    "breadcrumb": "Chasse au trésor application",
    "title": "Chasse au trésor application : la ville entière en direct",
    "og_title": "Chasse au trésor application : ta ville pleine d'Échos",
    "meta": "Chasse au trésor application 2026 : en direct, à l'échelle de la ville, sans acheter de tour, sans pub. MapRaiders ouvre la chasse au trésor à toute ta ville. Compatible RGPD enfants.",
    "keywords": "chasse au tresor application, chasse au tresor app, chasse tresor smartphone, chasse tresor famille, geocaching alternative, chasse au tresor enfants",
    "badge": "Chasse au trésor",
    "pricing_pill": "Free Forever. Sans acheter de tour. Toute la ville.",
    "h1_html": 'Chasse au trésor application : une <em>ville entière d\'Échos</em> cachés',
    "lead": "Les apps traditionnelles de chasse au trésor comme Geocaching demandent un abonnement premium et des tours pré-définis. MapRaiders prend l'autre voie : les Échos sont déjà éparpillés à l'échelle de la ville. Tu suis les traces d'autres joueurs ou tu laisses les tiennes. En direct, gratuit, sans acheter de tour, sans préparation. Compatible RGPD enfants.",
    "trigger": {
        "quote": "Tu poses une petite piste audio devant une porte d'immeuble, trois jours plus tard quelqu'un que tu ne connais pas l'a trouvée.",
        "author": "Aljoscha P., explorateur urbain de la région de Berlin (bêta fermée)"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "Critères",
            "title": "Ce qu'une <em>application de chasse au trésor moderne</em> devrait offrir",
            "body": """
    <p>Trois critères séparent les apps de chasse au trésor des années 2020 des chasses sur papier imprimé :</p>
    <ul>
      <li><strong>En direct.</strong> Les indices apparaissent en temps réel, pas uniquement dans un tour pré-fabriqué.</li>
      <li><strong>Social.</strong> Les joueurs se laissent des indices entre eux, au lieu de seulement suivre.</li>
      <li><strong>Sans paywall.</strong> Parents et enfants entrent immédiatement, sans avoir à acheter un tour à 15€.</li>
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
      <tr><td class="feat-name">Geocaching</td><td>Sub Premium ~5,99€/mois</td><td>Faible (trouver caches)</td><td class="cross">Asynchrone</td><td>Collecter</td></tr>
      <tr><td class="feat-name">Actionbound</td><td>Tours / Sub</td><td>Élevée (monter tour)</td><td class="cross">✗</td><td>Par-tour</td></tr>
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
    <p>Plutôt qu'un tour linéaire de la station 1 à 10, MapRaiders ouvre une <strong>chasse au trésor spatiale</strong> à l'échelle de la ville :</p>
    <ul>
      <li><strong>Déposer des Échos.</strong> Pose un Écho audio, photo ou vidéo dans un lieu. D'autres joueurs le découvrent en passant.</li>
      <li><strong>Trouver des Échos.</strong> Vois sur la carte où sont les Échos. Tu suis les traces, tu trouves des secrets, tu écoutes des histoires.</li>
      <li><strong>Créer des quêtes.</strong> Pose une petite tâche dans un lieu («&nbsp;prends une photo de la porte rouge là-bas&nbsp;»). D'autres joueurs s'en chargent.</li>
      <li><strong>Couche de territoire.</strong> Qui parcourt souvent un itinéraire de chasse au trésor finit par le conquérir comme territoire. Les traces deviennent terrain.</li>
    </ul>
            """,
        },
        {
            "label": "Enfants, RGPD",
            "title": "Une chasse au trésor pour <em>enfants et familles</em>",
            "body": """
    <p>La chasse au trésor fait partie de la culture d'enfance française : pistes à la craie, traces de feuilles, cachette finale avec bonbons. MapRaiders amène ça à l'ère du smartphone, sans planter les enfants devant un écran :</p>
    <ul>
      <li><strong>Sortie parents-enfants.</strong> Les parents déposent des Échos audio sur un parcours préparé, les enfants suivent les traces. Mouvement réel, indices numériques.</li>
      <li><strong>Écran au minimum, monde au maximum.</strong> L'app guide sur la carte ; l'expérience se passe dehors.</li>
      <li><strong>Compatible RGPD enfants.</strong> Conformité CNIL stricte : pas de tracker publicitaire personnalisé, pas de vente de données, pas de chat in-app sans accord parental.</li>
      <li><strong>Mode famille.</strong> Événements privés de Pâques, Noël, anniversaire, réservés au groupe familial.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders convient-il aux enfants ?",
         "a": "Oui, à partir de 9 ans avec accompagnement parental. L'app est RGPD-conforme, sans pub, et ne collecte pas de données personnelles d'enfants. Les parents peuvent activer un mode famille avec contrôle complet."},
        {"q": "Quelle préparation pour une chasse avec les enfants ?",
         "a": "Zéro. Contrairement à Actionbound ou Munzee, pas besoin d'acheter un tour ou de monter des stations. Les Échos sont déjà répartis dans la ville. Il suffit de suivre les traces d'autres joueurs ou de laisser les tiennes."},
        {"q": "L'application de chasse au trésor coûte quelque chose ?",
         "a": "Non. Les fonctions de chasse au trésor (déposer des Échos, en trouver, créer des quêtes) sont 100% gratuites. Cosmétiques optionnels à partir de 1,99€, sans avantage de jeu. Paiement par CB, PayPal, Apple Pay, Google Pay ou Klarna."},
        {"q": "Fonctionne-t-il dans les petites villes ?",
         "a": "Oui. Même en village ou en petite ville, tu peux déposer des Échos et créer des quêtes. Dans les grands centres, tu trouves plus de traces d'autres joueurs ; en campagne, ton tour a plus d'espace pour lui."},
        {"q": "L'app est-elle en français ?",
         "a": "Oui. MapRaiders est entièrement localisé en français : menus, système d'Échos, indices, support. Mentions légales et politique de confidentialité conformes CNIL."},
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
    "title": "Woog alternative : MapRaiders comble le vide laissé en 2018",
    "og_title": "Woog alternative : MapRaiders pour le territoire de quartier",
    "meta": "Tu utilisais Woog pour les promenades de chien ? Woog a fermé en 2018. MapRaiders comble une partie du vide : territoire, Échos, communauté locale.",
    "keywords": "woog alternative, woog application, woog ferme, alternative woog promenade chien, app promenade chien france, walkies game france",
    "badge": "Vide Woog. FR-Exclusif.",
    "pricing_pill": "Free Forever. Une partie du vide Woog comblée. 7,5 M de chiens en FR.",
    "h1_html": 'Woog alternative : <em>MapRaiders</em> comble une partie du vide depuis 2018',
    "lead": "Woog, c'était l'app française de réseau social cartographique pour maîtres de chien : un projet beau, pionnier, fait en France. Woog a fermé en 2018, et personne n'a vraiment comblé le vide depuis. Aucune app française ne propose plus cette combinaison de carte sociale, promenade canine et communauté de quartier. MapRaiders n'est pas un clone de Woog. Mais il ajoute ce qui manquait : territoire, Échos, défense, jeu. Avec ou sans ton ancien réflexe Woog.",
    "trigger": {
        "quote": "Avec ou sans souvenir Woog : MapRaiders pour le territoire.",
        "author": "MapRaiders, principe de complément"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Hommage Woog",
            "title": "Woog était <em>bien</em>, et beaucoup l'ont regretté",
            "body": """
    <p>Woog (à l'origine <em>WoogAvenue</em>) a été lancée en 2014 par une équipe française. L'idée : une carte sociale pour maîtres de chien, où tu voyais les autres tutaniers à proximité, où tu partageais des spots de promenade, où tu organisais des rencontres canines. C'était pionnier, bien avant que Strava ne devienne mainstream, bien avant la multiplication des apps GPS.</p>
    <p>Woog a fermé en 2018. Les raisons connues : modèle économique difficile, financement insuffisant, équipe dispersée. Pas mal de maîtres français ont gardé la nostalgie de cette période où une app française simple suffisait à créer du lien de quartier autour des chiens.</p>
    <p>Le vide n'a jamais vraiment été comblé. Petbnb, Wagit, Yummypets : aucun n'a la dimension carte sociale plus jeu de quartier que Woog laissait entrevoir. MapRaiders n'est pas Woog 2.0, c'est autre chose. Mais qui aimait Woog y trouvera quelques échos familiers, et pas mal de nouveau.</p>
            """,
        },
        {
            "label": "Ce que ça ajoute",
            "title": "Ce que MapRaiders <em>ajoute</em> à la promenade canine",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territoire conquis</h3><p>Chaque promenade étend ton polygone. En deux semaines, tu possèdes ta rue. En deux mois, ton quartier. Sans effort supplémentaire.</p></div>
    <div class="feat-card rv d1"><h3>Échos du quartier</h3><p>D'autres maîtres déposent des Échos audio («&nbsp;ici mon chien Bento adore renifler&nbsp;»). Tu découvres en passant : c'est une petite communauté pet de proximité.</p></div>
    <div class="feat-card rv d2"><h3>Quêtes pour maîtres</h3><p>«&nbsp;Prends une photo du chien dans un parc inconnu&nbsp;» : des petites quêtes qui apportent de la variété à la routine.</p></div>
    <div class="feat-card rv d3"><h3>Trace personnelle</h3><p>La carte se souvient des chemins préférés de ton chien. C'est une mémoire visuelle de la cohabitation quotidienne.</p></div>
    <div class="feat-card rv d4"><h3>Défense et jeu</h3><p>Mini-jeux de défense quand quelqu'un attaque ton territoire. Cette couche ludique, Woog ne l'avait pas.</p></div>
    <div class="feat-card rv"><h3>Clans organiques</h3><p>Plusieurs maîtres du même quartier deviennent automatiquement clan. Sans Discord, sans inscription forcée.</p></div>
  </div>""",
        },
        {
            "label": "Cohabiter avec une autre app",
            "title": "<em>Utiliser les deux</em> quand une autre app de promenade existe déjà",
            "body": """
    <p>MapRaiders ne remplace pas une app spécialisée de promenade canine (carnet de santé, vétos, services). Si tu utilises déjà une app pour gérer ton chien (vaccins, RDV véto, croquettes), garde-la. MapRaiders se rajoute par-dessus :</p>
    <ul>
      <li><strong>App véto ou santé pour la logistique.</strong> RDV, vaccins, recherche de pet sitter.</li>
      <li><strong>MapRaiders pour le jeu et la communauté.</strong> Territoire, Échos, défense, voisinage.</li>
      <li><strong>Pas de conflit GPS.</strong> Les deux apps utilisent le même capteur sans surconsommation notable.</li>
      <li><strong>Aucune obligation sociale.</strong> Tu peux jouer seul, sans interaction sociale forcée.</li>
    </ul>
            """,
        },
        {
            "label": "Comparatif respectueux",
            "title": "Woog (souvenir) face à <em>MapRaiders</em> (aujourd'hui)",
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
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Hommage :</strong> Woog était une idée française remarquable. MapRaiders n'est pas son successeur officiel, mais comble une partie du vide laissé, avec respect pour le projet d'origine.</p>""",
        },
    ],
    "faq": [
        {"q": "MapRaiders est-il le successeur de Woog ?",
         "a": "Non, pas officiellement. MapRaiders est un projet indépendant porté par Scafa Investments LLC (Floride). Mais pas mal d'anciens utilisateurs Woog y retrouvent des échos familiers : carte sociale, communauté de quartier, focus promenade. Avec en plus une couche de jeu (territoire, défense) que Woog n'avait pas."},
        {"q": "Pourquoi Woog a-t-il fermé en 2018 ?",
         "a": "Les raisons précises appartiennent à l'équipe Woog. De façon générale, les apps de niche freemium françaises de cette période ont eu du mal entre un modèle économique difficile et un financement insuffisant face aux géants américains. Le marché français était sans doute trop petit à l'époque pour porter une app sociale spécialisée chiens."},
        {"q": "Mes anciennes données Woog sont-elles importables ?",
         "a": "Non, les serveurs Woog sont éteints depuis 2018. Aucune importation possible. Tu démarres frais sur MapRaiders avec ta propre rue."},
        {"q": "MapRaiders fonctionne-t-il pour les chiens petits, âgés ou lents ?",
         "a": "Oui. Pas de vitesse minimum. Le jeu respecte le rythme du chien : marche lente, arrêts fréquents pour renifler, tout compte comme mouvement réel. Dans la même logique que Woog avec tous les types de promenades."},
        {"q": "Y a-t-il de la pub de marques de croquettes ou de pet shops ?",
         "a": "Non. MapRaiders est 100% sans pub : pas de croquettes, pas de pet shops, pas de marques. Pet-friendly authentique, comme Woog l'était."},
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
        "title": "Jeu de territoire avis : testeurs bêta sur MapRaiders",
        "og_title": "Jeu de territoire : avis réels de la bêta",
        "meta": "Avis sur jeu de territoire au quotidien : trois testeurs bêta racontent comment fonctionnent la conquête, le decay et les mini-jeux de défense en milieu urbain réel.",
        "keywords": "jeu de territoire avis, jeu de territoire test, conquerir territoire app avis, mapraiders avis territoire",
        "h1_html": 'Jeu de territoire : quand <em>ta rue</em> est à toi',
        "lead": "Qu'est-ce que ça fait de conquérir une rue pour de vrai ? Trois testeurs bêta racontent leur premier territoire, leur premier choc de Decay et leur premier mini-jeu de défense.",
        "intro_label": "Ce qui compte au test",
        "intro_title": "Ce qui rend un <em>jeu de territoire</em> tangible",
        "intro_body": """
    <p>Au test, trois axes d'expérience nous intéressaient :</p>
    <ul>
      <li><strong>Conquête.</strong> À quel moment la première rue se met à ressembler à «&nbsp;ma terre&nbsp;» ?</li>
      <li><strong>Perte.</strong> Quelle réaction au premier Decay ou à la première défaite face à un attaquant ?</li>
      <li><strong>Défense.</strong> Comment ressent-on les mini-jeux de défense au quotidien ?</li>
    </ul>
    <p>Les retours des trois testeurs couvrent ces trois axes sous des angles bien différents.</p>
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
        "title": "Jeu géolocalisé avis : MapRaiders en test réel",
        "og_title": "Jeu géolocalisé : avis de testeurs bêta",
        "meta": "Avis sur jeu géolocalisé : trois testeurs bêta racontent batterie, précision GPS, ressenti RGPD et plaisir réel au quotidien urbain.",
        "keywords": "jeu geolocalise avis, jeu geolocalise test, gps mmo test, mapraiders avis france",
        "h1_html": 'Jeu géolocalisé : <em>avis</em> de testeurs bêta',
        "lead": "Quelle précision GPS dans les centres urbains ? Combien de batterie l'app prend sur les longs trajets ? Comment se ressent la conformité RGPD côté joueur ? Trois testeurs répondent sans filtre.",
        "intro_label": "Axes du test",
        "intro_title": "Ce que nous avons testé sur un <em>jeu géolocalisé</em>",
        "intro_body": """
    <p>Le test tournait autour de quatre axes concrets :</p>
    <ul>
      <li><strong>Précision GPS</strong> dans les ravines urbaines et sous les ponts.</li>
      <li><strong>Consommation de batterie</strong> sur des trajets d'une à deux heures, en comparaison de Pokémon GO.</li>
      <li><strong>Ressenti vie privée :</strong> combien de gêne de tracking surgit pendant l'usage ?</li>
      <li><strong>Mécanique de jeu :</strong> territoire, Échos et quêtes tiennent-ils au quotidien réel ?</li>
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
        "title": "Alternative Pokémon GO, ça vaut le coup ? Bêta-testeurs répondent",
        "og_title": "Alternative Pokémon GO, ça vaut le coup ? Bêta-test honnête",
        "meta": "Alternative Pokémon GO, ça vaut le coup ? Trois testeurs bêta de Stuttgart, Hambourg et Berlin répondent sur cardio, promenade et exploration urbaine.",
        "keywords": "alternative pokemon go avis, alternative pokemon go test, mapraiders avis, betatest pokemon go alternative",
        "h1_html": 'Alternative Pokémon GO : <em>ça vaut vraiment le coup ?</em>',
        "lead": "Trois testeurs bêta de trois régions métropolitaines allemandes ont utilisé MapRaiders plusieurs semaines. Voici leurs retours sans filtre, sans langage marketing, sans code d'influenceur.",
        "intro_label": "Qui a testé ?",
        "intro_title": "Trois personnes, trois <em>cas d'usage</em>",
        "intro_body": """
    <p>Les trois testeurs bêta couvrent trois profils très différents, et c'est ce qui rend la comparaison avec Pokémon GO honnête :</p>
    <ul>
      <li><strong>Ron C.</strong>, région de Stuttgart : maître de chien, sortie quotidienne, sans background gamer.</li>
      <li><strong>Vivian N.</strong>, région de Hambourg : coureuse, a joué Pokémon GO en 2018 puis arrêté après trois mois.</li>
      <li><strong>Aljoscha P.</strong>, région de Berlin : explorateur urbain, vétéran d'Ingress, connaît l'écosystème Niantic de l'intérieur.</li>
    </ul>
    <p>Les trois ont testé MapRaiders indépendamment, sans promotion payée ni script. Les citations ont été traduites des originaux allemands.</p>
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
        "title": "Pokémon GO Saudi avis : testeurs bêta sur l'aspect RGPD",
        "og_title": "Pokémon GO Saudi alternative : avis RGPD honnêtes",
        "meta": "Pokémon GO Saudi avis : trois testeurs bêta racontent comment ils vivent l'alternative RGPD-conforme, indépendante, sans fonds souverain.",
        "keywords": "pokemon go saudi avis, pokemon go scopely avis, alternative niantic saoudien avis, mapraiders rgpd avis",
        "h1_html": 'Pokémon GO Saudi : <em>avis sur l\'alternative RGPD</em>',
        "lead": "Comment se sentent les joueurs Pokémon GO ex-Niantic depuis le rachat saoudien de mars 2025 ? Trois testeurs bêta racontent leur transition vers une alternative RGPD-conforme et indépendante.",
        "intro_label": "Question centrale",
        "intro_title": "L'<em>indépendance étatique</em> change-t-elle vraiment l'expérience de jeu ?",
        "intro_body": """
    <p>Les trois testeurs bêta ont évalué l'argument anti-PIF sous des angles pratiques :</p>
    <ul>
      <li><strong>Ressenti privacy :</strong> ça change quoi de savoir que tes pas ne vont nulle part, plutôt qu'à un fonds étatique ?</li>
      <li><strong>Trust juridique :</strong> mentions légales conformes CNIL, hébergement européen, comment ça se ressent côté joueur ?</li>
      <li><strong>Migration mentale :</strong> comment lâcher Pokémon GO après sept ans d'investissement personnel ?</li>
      <li><strong>Compatibilité usage :</strong> faut-il refaire toute la stratégie, ou les réflexes restent valides ?</li>
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
        "title": "Application de marche avec jeu : avis et test réel",
        "og_title": "Application de marche avec jeu : ça vaut le coup au quotidien ?",
        "meta": "Application de marche avec jeu, ça vaut le coup ? Testeurs bêta racontent motivation cardio, batterie sur longs trajets et perte de territoire après pause maladie.",
        "keywords": "application marche avis, application marche jeu avis, cardio app test france, strava territoire avis",
        "h1_html": 'Application de marche avec jeu : <em>ça vaut le coup ?</em>',
        "lead": "Que devient la motivation à marcher quand chaque parcours défend du vrai terrain ? Quel effet le premier Decay après une grippe ? Une coureuse, un walker et un explorateur urbain répondent.",
        "intro_label": "Axes du test",
        "intro_title": "Ce qu'une <em>application de marche</em> doit tenir",
        "intro_body": """
    <p>Nous avons regardé l'expérience de marche sur trois axes :</p>
    <ul>
      <li><strong>Ancrage motivationnel :</strong> à quel moment quelqu'un revient après une pause ?</li>
      <li><strong>Batterie en long trajet :</strong> tenir 60 à 90 minutes sans vider le téléphone.</li>
      <li><strong>Polyvalence :</strong> fonctionne-t-il aussi bien pour la course, le walking et la promenade canine ?</li>
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
        "title": "Chasse au trésor application avis : testeurs bêta MapRaiders",
        "og_title": "Chasse au trésor application : avis réels de la bêta",
        "meta": "Avis sur application de chasse au trésor sans acheter de tour ni préparation : testeurs bêta racontent comment MapRaiders ouvre la ville entière à la chasse au trésor en direct.",
        "keywords": "chasse au tresor application avis, chasse au tresor app test, chasse tresor live avis, famille chasse tresor avis",
        "h1_html": 'Chasse au trésor application : <em>avis</em> sans acheter de tour',
        "lead": "La plupart des apps de chasse au trésor demandent de la préparation : acheter un tour, planifier l'itinéraire, monter les stations. Quel ressenti quand la ville arrive déjà pleine d'indices ? Trois testeurs bêta répondent.",
        "intro_label": "Question du test",
        "intro_title": "Une <em>chasse au trésor en direct</em> sans préparation, ça tient ?",
        "intro_body": """
    <p>Nous avons testé les fonctions de chasse au trésor dans trois scénarios :</p>
    <ul>
      <li><strong>Seul</strong> comme explorateur urbain (Aljoscha P.) : déposer des Échos, en trouver.</li>
      <li><strong>Avec chien</strong> en promenade normale (Ron C.) : indices comme sous-produit de la promenade.</li>
      <li><strong>Scénario familial</strong> simulé : combien de temps adultes plus enfants mettent-ils à comprendre la mécanique ?</li>
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
        "title": "Woog alternative avis : maîtres de chien testent MapRaiders",
        "og_title": "Woog alternative : avis réels de maîtres",
        "meta": "Avis sur alternative Woog : des maîtres de chien bêta racontent comment MapRaiders comble une partie du vide laissé depuis 2018.",
        "keywords": "woog alternative avis, woog application avis, alternative woog test, app promenade chien avis france",
        "h1_html": 'Woog alternative : <em>avis</em> de maîtres de chien',
        "lead": "Woog manquait à pas mal de monde depuis 2018. Quel effet de retrouver une carte sociale, une communauté de quartier, et en plus un jeu de territoire ? Maîtres bêta répondent.",
        "intro_label": "Axes du test",
        "intro_title": "Ce qu'une <em>alternative Woog</em> doit respecter",
        "intro_body": """
    <p>Nous avons testé l'usage pet-friendly sur trois axes :</p>
    <ul>
      <li><strong>Attention au chien :</strong> est-ce que l'app détourne du chien ?</li>
      <li><strong>Rythme de l'animal :</strong> est-ce que ça suit avec un chien petit, âgé ou lent ?</li>
      <li><strong>Communauté locale :</strong> les maîtres arrivent-ils à se connecter sans réseau social parallèle, comme Woog le permettait ?</li>
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
    "title": "MapRaiders avis : bêta-tests, fondateur, toutes les pages",
    "og_title": "MapRaiders avis : tout au même endroit",
    "meta": "MapRaiders avis : 5,0 sur 5 étoiles sur trois bêta-tests vérifiés, mot du fondateur, toutes les pages Killer et avis détaillés réunis. RGPD.",
    "keywords": "mapraiders avis, mapraiders avis france, mapraiders test, gps mmo avis france, alternative pokemon go avis",
    "badge": "Hub et vue d'ensemble",
    "pricing_pill": "5,0 / 5 sur trois avis bêta vérifiés.",
    "h1_html": '<em>MapRaiders avis</em> : tout ce qu\'il faut savoir sur le GPS MMO',
    "lead": "Trois testeurs bêta à Stuttgart, Hambourg et Berlin. Sept sujets Killer, de la comparaison Pokémon GO à l'application de chasse au trésor. Sept avis détaillés. Un hub.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "Qu'est-ce que MapRaiders, exactement ?",
         "a": "MapRaiders est un GPS MMO pour Android. Les joueurs conquièrent des territoires réels par le mouvement, déposent des Échos, créent des quêtes et défendent leur terrain via des mini-jeux. Sans pub, RGPD-conforme, gratuit. Paiement par CB, PayPal, Apple Pay, Google Pay ou Klarna pour les cosmétiques."},
        {"q": "Combien y a-t-il de testeurs bêta ?",
         "a": "Trois personnes rendues publiques pour l'instant, avec leur consentement, sous prénom et initiale pour la vie privée. La bêta fermée dans son ensemble est plus large ; les trois cités correspondent aux profils principaux."},
        {"q": "Les avis sont-ils réels ?",
         "a": "Oui. Les trois testeurs sont des personnes réelles de la bêta fermée en Allemagne. Ils n'ont pas été payés. Les citations ont été écrites à l'origine en allemand et traduites en français. Dans le balisage Schema.org, elles portent la date, la langue et une référence à l'original allemand (translationOfWork)."},
        {"q": "Comment devenir testeur bêta en France ?",
         "a": "Inscris-toi sur la page d'accueil française avec ton e-mail. Des places de bêta françaises seront libérées par vagues après le lancement principal, en priorité pour les maîtres de chien, coureurs et explorateurs urbains de villes françaises à faible densité Pokémon GO."},
        {"q": "Quand l'app sort-elle officiellement en France ?",
         "a": "MapRaiders est actuellement en bêta fermée sur Google Play (Allemagne). Lancement FR officiel prévu pour l'été 2026 (juillet-août). iOS au Q3 2026. Mentions légales conformes CNIL, hébergement européen, RGPD strict."},
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

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 3 — IT Killer-URL Builder
Generates 15 IT pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_IT_FINAL_MASTER_PLAN.md.

Output: docs/it/
Run: py docs/_build_phase1_it.py
Idempotent: overwrites existing files.
"""

import json
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
OUT_DIR = DOCS / "it"
SITE = "https://mapraiders.com"
LANG = "it"
LANG_SHORT = "it"

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
# REUSABLE BLOCKS — IT
# -----------------------------------------------------------------------------

# Beta-Tester data (IT-translated quotes per Master-Plan §1.2)
TESTER_RON = {
    "name": "Ron C.",
    "name_de": "Ron C.",
    "role": "Padrone di cane · area di Stoccarda",
    "role_long": "Padrone di cane dell'area di Stoccarda (beta chiusa)",
    "quote": "Il mio cane ama la sua passeggiata — e io amo che ogni giro renda il mio quartiere più visibile sulla mappa. Ho già conquistato tutta la mia strada.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "name_de": "Vivian N.",
    "role": "Runner · area di Amburgo",
    "role_long": "Runner dell'area di Amburgo (beta chiusa)",
    "quote": "Corro già ogni mattina. Con MapRaiders ogni percorso ha un obiettivo: tenere territorio o riconquistarlo. La mia motivazione cardio è esplosa.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "name_de": "Aljoscha P.",
    "role": "Esploratore urbano · area di Berlino",
    "role_long": "Esploratore urbano dell'area di Berlino (beta chiusa)",
    "quote": "Lasciare Echi e vedere chi li trova è come una caccia al tesoro aperta in tutta la città.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder Quote IT (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "Ero uno dei giocatori frustrati di Pokémon GO. Volevo un territorio reale, non una cattura "
    "di palestra effimera. Non volevo che i miei passi venissero venduti a fondi sauditi, nessun "
    "modello pubblicitario, nessun abbonamento premium obbligatorio. Quindi ho costruito MapRaiders. "
    "Questo è il mio campo di casa — e presto sarà il tuo."
)

# Pricing offers (EUR — Master-Plan §1.1, IVA 22% inclusa)
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0.00", "currency": "EUR"},
    {"name": "Cosmetic-IAP a partire da", "price": "1.99", "currency": "EUR"},
    {"name": "MapRaiders Sostenitore (Sub)", "price": "3.99", "currency": "EUR"},
    {"name": "Sostenitore a vita", "price": "99.00", "currency": "EUR"},
]

# DefinedTermSet IT (Master-Plan §8)
DEFINED_TERMS = [
    ("Territorio", "Un'area conquistata sulla mappa di gioco, persistentemente assegnata al giocatore o al clan"),
    ("Eco", "Segnale audio, foto o video lasciato dal giocatore in un luogo reale, che altri giocatori possono scoprire"),
    ("Mini-gioco di difesa", "Mini-gioco (tris, sasso-carta-forbici, mini-scacchi) attivato durante la difesa o conquista di un territorio"),
    ("Missione", "Mini-incarico creato dal giocatore che altri giocatori possono completare nel mondo reale"),
    ("Clan", "Gruppo formato organicamente di giocatori che mantengono e difendono territori insieme"),
    ("Quartiere", "L'area locale del giocatore — strade percorse abitualmente che diventano territorio personale"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """Generate hreflang tags. slug is e.g. '/it/gioco-territorio.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "it":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="it"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">Dalla beta chiusa</div>
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
    <div class="fr-label">Il Fondatore</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Fondatore di MapRaiders" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">Fondatore, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">Dalla beta chiusa</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.6">
      Avviso: I tester sono partecipanti interni della beta chiusa (Germania). Solo il nome di battesimo + iniziale del cognome sono utilizzati su richiesta dei tester, per motivi di privacy. Le recensioni sono state tradotte dagli originali in tedesco all'italiano.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    """WhatsApp-Sharing-Button (Master-Plan §6 — obbligatorio!) + Telegram."""
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    wa_text = f"Scopri%20MapRaiders%20-%20{enc}"
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}.mr-share__btn.wa{{border-color:#25D366}}.mr-share__btn.wa:hover{{background:#25D366;color:#fff}}</style>
<div class="mr-share" aria-label="Condividi"><span class="mr-share__label">Condividi:</span><a class="mr-share__btn wa" href="https://wa.me/?text={wa_text}" target="_blank" rel="noopener noreferrer">📱 WhatsApp</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">Termini</a><a href="/datenschutz.html">Privacy</a><a href="/impressum.html">Impressum</a><a href="/kontakt.html">Contatti</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; Conquista il tuo quartiere reale. Un prodotto di Scafa Investments LLC.</p>
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
  <a href="/it/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/it/#features" class="lnk">Funzionalità</a>
    <a href="/it/mapraiders-recensioni.html" class="lnk">Recensioni</a>
    <div class="lang-sw">
      <button class="lsw-btn">IT <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('it')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">In arrivo</a>
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

# DE-Original-Slugs für translationOfWork (IT-Slugs aus Master-Plan §2)
DE_TRANSLATION_MAP = {
    "/it/gioco-territorio.html": "/territorium-spiel.html",
    "/it/gioco-geolocalizzazione.html": "/gps-spiel-deutschland.html",
    "/it/alternativa-pokemon-go-gratis.html": "/pokemon-go-alternative-kostenlos.html",
    "/it/pokemon-go-saudi-alternativa.html": "/pokemon-go-alternative-kostenlos.html",
    "/it/app-camminata-con-gioco.html": "/handyspiel-zum-laufen.html",
    "/it/caccia-al-tesoro-app-italia.html": "/schnitzeljagd-app.html",
    "/it/gaiasmart-alternativa.html": "/standort-spiel.html",
    "/it/gioco-territorio-recensioni.html": "/territorium-spiel-erfahrungen.html",
    "/it/gioco-geolocalizzazione-recensioni.html": "/gps-spiel-erfahrungen.html",
    "/it/alternativa-pokemon-go-gratis-recensioni.html": "/pokemon-go-alternative-erfahrungen.html",
    "/it/pokemon-go-saudi-alternativa-recensioni.html": "/pokemon-go-alternative-erfahrungen.html",
    "/it/app-camminata-con-gioco-recensioni.html": "/handyspiel-laufen-erfahrungen.html",
    "/it/caccia-al-tesoro-app-italia-recensioni.html": "/schnitzeljagd-app-erfahrungen.html",
    "/it/gaiasmart-alternativa-recensioni.html": "/standort-spiel-erfahrungen.html",
    "/it/mapraiders-recensioni.html": "/mapraiders-erfahrungen.html",
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
        "inLanguage": "it",
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
        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/it/"},
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
            "inLanguage": "it",
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
            "inLanguage": "it",
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
            "jobTitle": "Fondatore",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-it",
            "name": "MapRaiders Vocabolario di Marca IT",
            "inLanguage": "it",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/it/"},
        {"@type": "ListItem", "position": 2, "name": "Recensioni", "item": f"{SITE}/it/mapraiders-recensioni.html"},
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
            "inLanguage": "it",
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
            "inLanguage": "it",
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
        "name": "MapRaiders IT — tutte le pagine Killer e di recensioni",
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
  <h2 class="sec-title rv d1">Domande <em>frequenti</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Altro sul tuo <em>campo di casa</em></h2>
  <p class="rv d1">Argomenti correlati di MapRaiders:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Presto su Google Play &bull; Gratuito &bull; Senza spam</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">Avvisami al lancio</a>
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
<html lang="it" data-theme="light">
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
<meta property="og:locale" content="it_IT">
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
    Avvisami al lancio
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
  <div class="sec-label rv">Recensioni</div>
  <h2 class="sec-title rv d1">5,0 su 5 — <em>3 recensioni verificate dalla beta</em></h2>
  <div class="prose rv d2">
    <p>Tre tester della beta chiusa — un padrone di cane, una runner e un esploratore urbano — hanno usato MapRaiders per diverse settimane. Le testimonianze seguenti rappresentano persone reali della beta chiusa (Germania). Le recensioni sono state tradotte dagli originali in tedesco all'italiano. Per motivi di privacy, utilizziamo solo nome di battesimo + iniziale del cognome.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="it" data-theme="light">
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
<meta property="og:locale" content="it_IT">
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
  <div class="h-badge rv">Recensioni</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">Scopri di più →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Recensione dettagliata →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">Hub Tematico</div>
  <h2 class="sec-title rv d1">Tutti gli <em>argomenti di MapRaiders</em> in un solo posto</h2>
  <div class="prose rv d2">
    <p>Qui trovi tutte le 7 pagine Killer più 7 recensioni dettagliate che illuminano MapRaiders da diverse angolazioni — dal confronto con Pokémon GO all'app di caccia al tesoro, dal gioco di territorio al compagno di corsa. Ogni pagina è indipendente; insieme, formano il quadro completo.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Recensioni in dettaglio</div>
  <h2 class="sec-title rv d1">Cosa dicono i tester da <em>diverse prospettive</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Valutazione Aggregata</div>
  <h2 class="sec-title rv d1">5,0 su 5 — <em>3 recensioni verificate dalla beta</em></h2>
  <div class="prose rv d2">
    <p>Tutte le recensioni provengono dalla fase di beta chiusa (febbraio–aprile 2026). Tre tester — un padrone di cane, una runner e un esploratore urbano — hanno testato MapRaiders su percorsi propri a Stoccarda, Amburgo e Berlino. Le recensioni mostrate qui sono state tradotte dagli originali in tedesco e rappresentano persone reali.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="it" data-theme="light">
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
<meta property="og:locale" content="it_IT">
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

# K1 — gioco-territorio
K1 = {
    "slug": "/it/gioco-territorio.html",
    "breadcrumb": "Gioco di territorio",
    "title": "Gioco di territorio — conquista il tuo quartiere reale",
    "og_title": "Gioco di territorio — dove la terra è davvero tua",
    "meta": "Cos'è un gioco di territorio? MapRaiders è l'unico GPS MMO con possesso reale e persistente della mappa. RGPD-conforme, senza Saudi, AR-free.",
    "keywords": "gioco di territorio, gioco territorio app, conquistare territorio app, territory game italia, gioco gps territorio",
    "badge": "Gioco di Territorio",
    "pricing_pill": "Free Forever · Cosmetici opzionali da 1,99€",
    "h1_html": 'Gioco di territorio — l\'unico dove la <em>terra è davvero tua</em>',
    "lead": "Un gioco di territorio dovrebbe essere più di un punto sulla mappa che svanisce in 5 minuti. MapRaiders combina GPS, cattura persistente di area e un sistema di difesa che rende possibile la conquista reale. Cammini in una via — è tua. Finché la difendi. Senza Niantic, senza Saudi.",
    "trigger": {
        "quote": "Conquista il tuo quartiere — senza Niantic, senza Saudi.",
        "author": "MapRaiders, principio del marchio"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Definizione",
            "title": "Cosa rende un <em>gioco di territorio autentico</em>",
            "body": """
    <p><strong>Un gioco di territorio</strong> è un gioco in cui i giocatori possiedono aree rivendicate sulla mappa in modo persistente, le difendono e le espandono. A differenza dei giochi di cattura (palestra, portale), il possesso rimane <strong>persistente</strong> — anche quando il giocatore è offline.</p>
    <p>Le quattro meccaniche che definiscono un gioco di territorio reale:</p>
    <ul>
      <li><strong>Persistenza.</strong> Le aree conquistate restano assegnate al giocatore o al clan finché non vengono attivamente prese.</li>
      <li><strong>Decay.</strong> I territori inattivi si riducono nel tempo — nessuno blocca permanentemente senza giocare attivamente.</li>
      <li><strong>Difesa.</strong> In attacco, un mini-gioco tra i due giocatori decide — non un confronto automatico di statistiche.</li>
      <li><strong>Trasferimenti di clan.</strong> I territori possono essere passati ad alleati o al clan — profondità economica.</li>
    </ul>
            """,
        },
        {
            "label": "Sistema MapRaiders",
            "title": "Il <em>sistema di territori</em> di MapRaiders in dettaglio",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Rivendicare</h3><p>Cammina a piedi, con il cane o in bici per una strada. La traccia GPS genera il territorio a tuo nome — come poligono visibile sulla mappa.</p></div>
    <div class="feat-card rv d1"><h3>Decay Engine</h3><p>Chi non percorre regolarmente un territorio lo vede ridursi di alcuni punti percentuali al giorno. L'attività mantiene la terra — non i soldi.</p></div>
    <div class="feat-card rv d2"><h3>Mini-giochi di difesa</h3><p>7 mini-giochi diversi decidono gli attacchi: tris, sasso-carta-forbici, mini-scacchi. La strategia conta più del tempo di gioco.</p></div>
    <div class="feat-card rv d3"><h3>Territori di clan</h3><p>Più giocatori possono mantenere insieme un territorio. Le aree di clan sono più robuste — un singolo attaccante non basta per rompere la difesa.</p></div>
  </div>""",
        },
        {
            "label": "Perché gli altri non lo sono",
            "title": "Perché Pokémon GO e Ingress <em>non sono</em> veri giochi di territorio",
            "body": """
    <p>Le <strong>catture di palestra di Pokémon GO</strong> sono effimere: chi mantiene un record per qualche ora guadagna monete — ma il territorio in sé non può essere inteso come possesso di terra. La palestra è un punto, non un'area.</p>
    <p>I <strong>portali di Ingress</strong> sono simili: punti che si collegano via link in triangoli. Il gioco conosce campi tra portali, ma non possesso persistente di terra. Chi non apre l'app per una settimana non perde &ldquo;il suo quartiere&rdquo; — non gli è mai stato realmente assegnato.</p>
    <p>MapRaiders attacca esattamente questo punto: il <strong>territorio è la risorsa di gioco</strong>, non il punto sopra di esso. Guadagni terra, perdi terra, trasferisci terra — come in un vero gioco spaziale.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Come funziona il sistema di territori in MapRaiders?",
         "a": "Cammini fisicamente per le strade e rivendichi aree GPS. Questi territori appaiono sulla mappa in tempo reale e sono tuoi — finché nessun altro giocatore passa di lì e ti sfida. Se difendi con successo, l'area resta tua."},
        {"q": "Posso perdere il mio territorio?",
         "a": "Sì. Il sistema Decay fa sì che le aree inattive si riducano ogni giorno. Chi resta attivo e percorre regolarmente la sua area la mantiene. Chi smette, perde. Questo mantiene la mappa viva."},
        {"q": "Cosa succede in un attacco territoriale?",
         "a": "L'attaccante deve raggiungere fisicamente il tuo territorio. Poi inizia un mini-gioco interattivo — difensore e attaccante giocano uno contro l'altro. Chi vince il mini-gioco decide il destino dell'area."},
        {"q": "Esiste un sistema di territori di clan?",
         "a": "Sì. I clan in MapRaiders nascono organicamente e possono rivendicare territori insieme. Le aree di clan sono più forti e necessitano di più attaccanti per essere rotte. Il lavoro di squadra paga."},
        {"q": "Il gioco di territorio costa qualcosa?",
         "a": "No. Tutto il gameplay di territorio è gratuito. Opzionalmente ci sono oggetti cosmetici (1,99€ – 8,99€) per design dei marker e colori del territorio — senza vantaggi nel gioco. Pagamento via PayPal, Apple Pay, Google Pay, Carta di Credito, Klarna o Satispay."},
    ],
    "internal_links": [
        ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
        ("/it/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/it/caccia-al-tesoro-app-italia.html", "Caccia al tesoro app Italia"),
        ("/it/gioco-territorio-recensioni.html", "Recensioni gioco di territorio"),
        ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
    ],
}

# K2 — gioco-geolocalizzazione (Volume-King 1.5-2.5K/mese)
K2 = {
    "slug": "/it/gioco-geolocalizzazione.html",
    "breadcrumb": "Gioco geolocalizzato",
    "title": "Gioco geolocalizzato 2026 — RGPD-conforme, no Saudi",
    "og_title": "Gioco geolocalizzato 2026 — il GPS MMO onesto, gratuito",
    "meta": "Il miglior gioco geolocalizzato del 2026: territorio reale, RGPD-conforme, senza Saudi. MapRaiders è il GPS MMO onesto, gratuito, AR-free.",
    "keywords": "gioco geolocalizzazione, gioco geolocalizzato, miglior gioco geolocalizzato italia, gps mmo, gioco gps android, location based game",
    "badge": "GPS MMO",
    "pricing_pill": "Free Forever · RGPD-conforme · Senza Saudi",
    "h1_html": 'Gioco geolocalizzato — <em>conquista il tuo quartiere</em> davvero',
    "lead": "I giochi geolocalizzati dovrebbero essere più di punti effimeri su una mappa. MapRaiders combina GPS, cattura persistente del territorio e un sistema di difesa che rende possibile la conquista reale. Passi in una strada — è tua. Finché la difendi. Senza fake GPS, senza AR che svuota la batteria, senza pubblicità.",
    "trigger": {
        "quote": "Conquista il tuo quartiere — senza Niantic, senza Saudi.",
        "author": "MapRaiders, principio del marchio"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Cos'è?",
            "title": "Cos'è un <em>gioco geolocalizzato</em>",
            "body": """
    <p>Un <strong>gioco geolocalizzato (Location-Based Game)</strong> usa la posizione geografica del dispositivo come meccanica centrale. A differenza dei giochi AR, che richiedono in più la fotocamera, un puro gioco GPS funziona solo con la mappa — risparmiando batteria e proteggendo la privacy.</p>
    <p>MapRaiders è un <strong>GPS MMO</strong>: migliaia di giocatori si muovono simultaneamente sulla stessa mappa, competono in tempo reale e condividono un sistema unificato di territori. Niente AR, niente fotocamera, niente occhiali VR.</p>
            """,
        },
        {
            "label": "I 7 migliori",
            "title": "I 7 migliori giochi geolocalizzati a confronto — e perché <em>MapRaiders</em> è l'unico con territorio reale",
            "body": "<p>La maggior parte delle classifiche mette insieme app che condividono solo una caratteristica con Pokémon GO. Qui è onesto:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>App</th><th>Operatore</th><th>Senza pubblicità</th><th>Territorio reale</th><th>Fiducia RGPD</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Palestre effimere</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Ingress Prime</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Portali, non persistenti</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="check">✓</td><td class="cross">Cache, non terra</td><td>Premium-paywall</td></tr>
      <tr><td class="feat-name">Gaiasmart</td><td>Italiano</td><td class="check">✓</td><td class="cross">Tour cittadini</td><td class="check">RGPD italiana</td></tr>
      <tr><td class="feat-name">City Adventure</td><td>Indie</td><td>Misto</td><td>Limitato</td><td>Variabile</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓</td><td class="check">✓ persistente</td><td class="check">RGPD, indipendente</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Differenza",
            "title": "Cosa rende MapRaiders <em>unico</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territori persistenti</h3><p>Quando conquisti una strada, è tua — finché qualcuno la riconquista o agisce il decay. Niente palestre effimere.</p></div>
    <div class="feat-card rv d1"><h3>Echi al posto dell'AR</h3><p>Lascia Echi audio, foto o video in luoghi reali. Altri giocatori li scoprono. Niente AR che svuota la batteria.</p></div>
    <div class="feat-card rv d2"><h3>7 mini-giochi di difesa</h3><p>In attacco: tris, sasso-carta-forbici o mini-scacchi. Strategia invece di solo tempo.</p></div>
    <div class="feat-card rv d3"><h3>Clan organici</h3><p>I clan nascono dal vicinato, non da server Discord. Chi corre nella stessa strada diventa alleato.</p></div>
    <div class="feat-card rv d4"><h3>Batteria risparmiata</h3><p>Solo GPS, niente fotocamera, niente AR. 4× più autonomia di Pokémon GO su percorsi lunghi.</p></div>
  </div>""",
        },
        {
            "label": "Casi italiani",
            "title": "Casi d'uso <em>italiani</em>",
            "body": "<p>MapRaiders si adatta a quattro profili principali in Italia:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Centro storico Roma</h3><p>Conquista vicoli del centro, lascia Echi davanti al Pantheon o a Trastevere. Caccia al tesoro spontanea.</p></div>
    <div class="feat-card rv d1"><h3>Stadio San Siro / Olimpico</h3><p>Territorio attorno allo stadio della tua squadra. Eventi calcistici stagionali, sfide tra tifoserie.</p></div>
    <div class="feat-card rv d2"><h3>Caccia al Tesoro Firenze</h3><p>Echi tra Uffizi, Ponte Vecchio, Palazzo Pitti. Tradizione fiorentina rivisitata.</p></div>
    <div class="feat-card rv d3"><h3>Passeggiata mediterranea</h3><p>La passeggiata serale italiana — ora con territorio reale. 50+ longevity friendly.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "Cos'è un gioco geolocalizzato?",
         "a": "Un gioco geolocalizzato (Location-Based Game) usa la tua posizione GPS per attivare meccaniche di gioco. MapRaiders usa GPS per legare territori, Echi e missioni a luoghi reali — la tua città diventa il campo di gioco."},
        {"q": "Mi serve la Realtà Aumentata?",
         "a": "No. MapRaiders è deliberatamente AR-free. Usa solo GPS e mappa. Questo risparmia batteria e privacy — niente fotocamera, niente cattura facciale."},
        {"q": "Funziona in qualsiasi città italiana?",
         "a": "Sì. Ovunque ci siano dati OpenStreetMap. In centri urbani come Roma, Milano e Firenze la densità di giocatori è alta; in provincia, meno competizione ma territori più grandi."},
        {"q": "I miei dati di posizione vengono venduti?",
         "a": "No. Siamo conformi al RGPD, senza SDK pubblicitari, senza vendita di dati, senza proprietà statale. A differenza di Pokémon GO, che da marzo 2025 appartiene al gruppo Scopely (PIF saudita)."},
        {"q": "Quanto costa?",
         "a": "Il gameplay è gratuito. I cosmetici (1,99€ – 8,99€) non danno vantaggi nel gioco, solo estetica. Pagamento via PayPal, Apple Pay, Google Pay, Carta di Credito, Klarna IT o Satispay."},
    ],
    "internal_links": [
        ("/it/gioco-territorio.html", "Gioco di territorio reale"),
        ("/it/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/it/pokemon-go-saudi-alternativa.html", "Pokemon GO Saudi alternativa"),
        ("/it/app-camminata-con-gioco.html", "App camminata con gioco"),
        ("/it/caccia-al-tesoro-app-italia.html", "Caccia al tesoro app Italia"),
        ("/it/gaiasmart-alternativa.html", "Gaiasmart alternativa"),
        ("/it/gioco-geolocalizzazione-recensioni.html", "Recensioni gioco geolocalizzato"),
        ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
    ],
}

# K3 — alternativa-pokemon-go-gratis
K3 = {
    "slug": "/it/alternativa-pokemon-go-gratis.html",
    "breadcrumb": "Alternativa Pokémon GO gratis",
    "title": "Alternativa Pokemon GO gratis — senza Saudi, senza inganni",
    "og_title": "Alternativa Pokémon GO gratis — 100% gratuito, no Battle Pass",
    "meta": "Cerchi un'alternativa Pokémon GO gratis? MapRaiders è 100% gratuito, senza pubblicità, senza Battle Pass. Territorio reale, AGCM-conforme, no Saudi.",
    "keywords": "alternativa pokemon go gratis, alternativa pokemon go gratuita, gioco gps gratis italia, senza pubblicita, senza battle pass",
    "badge": "Alternativa Pokémon GO",
    "pricing_pill": "0,00€ gameplay · Cosmetici opzionali da 1,99€",
    "h1_html": 'Alternativa Pokémon GO gratis — senza pubblicità, <em>senza inganni IAP</em>, senza fondo saudita',
    "lead": "Chi cerca un'alternativa a Pokémon GO senza Battle Pass, senza follia di Remote Raid Pass e senza pubblicità invadente, di solito cade nella prossima trappola premium. MapRaiders inverte il paradigma: il gameplay completo è e resta gratuito. Senza livelli, senza abbonamento obbligatorio, senza vendita di dati — pagamento conforme AGCM per i cosmetici opzionali.",
    "trigger": {
        "quote": "Senza pubblicità invadente. AGCM-conforme.",
        "author": "MapRaiders, principio del gioco"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Perché cercare?",
            "title": "Perché i giocatori italiani di Pokémon GO cercano <em>alternative gratuite</em> nel 2026",
            "body": """
    <p>Tre punti dolenti hanno maturato il mercato italiano tra il 2024 e il 2026:</p>
    <ul>
      <li><strong>Frustrazione con Battle Pass.</strong> Pass stagionali con benefici bloccati senza pagare. Chi salta una stagione, perde le ricompense per sempre.</li>
      <li><strong>Polemica Remote Raid Pass.</strong> Niantic ha aumentato i prezzi e ridotto la disponibilità — un'ondata di giocatori italiani ha smesso nel 2023.</li>
      <li><strong>Acquisizione saudita marzo 2025.</strong> Niantic ha venduto Pokémon GO a Scopely (sussidiaria del Public Investment Fund saudita). I dati di posizione di milioni di giocatori finiscono indirettamente in un fondo sovrano estero.</li>
    </ul>
            """,
        },
        {
            "label": "Cosa significa gratis?",
            "title": "Cosa significa veramente <em>&ldquo;gratis&rdquo;</em> in MapRaiders",
            "body": "<p>Tier trasparenti — senza paywall nascosto, senza blocco del tutorial dopo 10 minuti:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>Cosa include</th><th>Prezzo (IT, IVA 22% inclusa)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% del gameplay (territori, Echi, missioni, clan, difesa, eventi)</td><td>0,00€</td></tr>
      <tr><td class="feat-name">Cosmetic-IAP</td><td>Design marker, colori territorio, emblemi clan, skin</td><td>1,99€ &ndash; 8,99€</td></tr>
      <tr><td class="feat-name">MapRaiders Sostenitore (Sub)</td><td>Distintivo onorario, accesso beta, lettera del fondatore, pacchetto cosmetico mensile</td><td>3,99€ / mese</td></tr>
      <tr><td class="feat-name">Sostenitore a vita</td><td>Cosmetico da collezione + crediti nel gioco</td><td>99,00€ una volta</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Importante:</strong> Gli oggetti cosmetici non danno alcun vantaggio nel gioco. Chi non compra niente gioca con meccaniche identiche al Sostenitore a vita.</p>""",
        },
        {
            "label": "AGCM-Trust",
            "title": "Trasparenza <em>AGCM-conforme</em> — niente trucchi IAP",
            "body": """
    <p>L'AGCM (Autorità Garante della Concorrenza e del Mercato) ha investigato Activision Blizzard nel 2025 per pubblicità ingannevole sui meccanismi IAP. MapRaiders rispetta i criteri AGCM dal primo giorno:</p>
    <ul>
      <li><strong>Niente loot box.</strong> Tutti gli oggetti cosmetici hanno prezzo fisso e contenuto visibile prima dell'acquisto.</li>
      <li><strong>Niente urgenza artificiale.</strong> Niente offerte &ldquo;solo 5 minuti&rdquo;, niente scadenze finte.</li>
      <li><strong>Niente paywall del gameplay.</strong> Tutto il gioco competitivo è gratuito. I cosmetici sono solo estetica.</li>
      <li><strong>Disdetta in 1 click.</strong> Il Sostenitore-Sub si annulla nelle impostazioni, senza chiamate, senza email.</li>
    </ul>
            """,
        },
        {
            "label": "La questione Saudi",
            "title": "La <em>questione Saudi-Niantic</em> — cosa succede ai tuoi passi?",
            "body": """
    <p>A marzo 2025, Niantic ha venduto la sua divisione giochi (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) per 3,5 miliardi di dollari a Scopely. Scopely è una sussidiaria del Public Investment Fund (PIF) dell'Arabia Saudita — formalmente un'entità controllata dallo stato saudita.</p>
    <p>Concretamente, significa: i <strong>dati di posizione di circa 30 milioni di giocatori mensili di Pokémon GO</strong> — dove corrono, quando portano fuori il cane, quali percorsi fanno ogni giorno — sono ora processati dall'infrastruttura Scopely. I dettagli dei trasferimenti dati non sono pubblicamente divulgati. Quel che è chiaro: non c'è protezione equivalente al RGPD contro attori legati a fondi sovrani fuori dall'UE.</p>
    <p>MapRaiders è una LLC americana di <strong>proprietà privata</strong> (Scafa Investments LLC, Florida), sviluppata da un team indipendente. Operiamo server conformi al RGPD, non vendiamo dati, non abbiamo rete pubblicitaria collegata e non siamo controllati da alcuno stato.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders è davvero gratis per sempre?",
         "a": "Sì. Tutto il gameplay principale — conquistare territori, lasciare Echi, creare missioni, formare clan — resta gratis per sempre. Non c'è sistema di livelli, Battle Pass né abbonamento obbligatorio."},
        {"q": "Quanto costa il Cosmetic-IAP?",
         "a": "Gli oggetti cosmetici come design marker, colori territorio o emblemi clan costano tra 1,99€ e 8,99€. Non danno alcun vantaggio nel gioco, solo estetica. Pagamento via PayPal, Apple Pay, Google Pay, Carta di Credito, Klarna IT o Satispay."},
        {"q": "C'è pubblicità nell'app?",
         "a": "No. MapRaiders è 100% senza pubblicità. Non vendiamo i tuoi dati né spazio pubblicitario. AGCM-conforme dal primo giorno."},
        {"q": "Cosa significa &ldquo;senza fondo saudita&rdquo;?",
         "a": "A marzo 2025, Niantic ha venduto la sua divisione giochi (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) per 3,5 miliardi di dollari a Scopely — sussidiaria del Public Investment Fund saudita. I dati di posizione di oltre 30 milioni di giocatori mensili finiscono indirettamente in un fondo sovrano estero. MapRaiders è una LLC americana privata, non controllata da alcuno stato."},
        {"q": "Posso pagare con Satispay?",
         "a": "Sì. Satispay è uno dei metodi di pagamento integrati per l'Italia, insieme a PayPal, Apple Pay, Google Pay, Carta di Credito e Klarna IT."},
    ],
    "internal_links": [
        ("/it/gioco-territorio.html", "Gioco di territorio reale"),
        ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
        ("/it/pokemon-go-saudi-alternativa.html", "Pokemon GO Saudi alternativa"),
        ("/it/alternativa-pokemon-go-gratis-recensioni.html", "Recensioni alternativa gratis"),
        ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
    ],
}

# K4 — pokemon-go-saudi-alternativa (IT-EXKLUSIV!)
K4 = {
    "slug": "/it/pokemon-go-saudi-alternativa.html",
    "breadcrumb": "Pokémon GO Saudi alternativa",
    "title": "Pokemon GO comprato Saudi — alternativa italiana RGPD",
    "og_title": "Pokémon GO Saudi — l'alternativa italiana RGPD-conforme",
    "meta": "Pokémon GO comprato dall'Arabia Saudita nel 2025? I tuoi passi vanno a un fondo sovrano. MapRaiders è l'alternativa indipendente, RGPD-conforme.",
    "keywords": "pokemon go saudi alternativa, pokemon go arabia saudita, niantic scopely saudi, alternativa rgpd italia, pokemon go comprato saudi, pif saudita giochi",
    "badge": "Privacy USP · IT-Esclusivo",
    "pricing_pill": "Indipendente · RGPD-conforme · No PIF",
    "h1_html": 'Pokémon GO comprato Saudi — la tua <em>alternativa italiana RGPD</em>',
    "lead": "A marzo 2025 Niantic ha venduto Pokémon GO al gruppo Scopely — sussidiaria del Public Investment Fund (PIF) dell'Arabia Saudita. I dati di posizione di oltre 30 milioni di giocatori mensili finiscono indirettamente in un fondo sovrano estero. MapRaiders è l'alternativa indipendente: LLC privata americana, server RGPD, nessun controllo statale, nessuna vendita di dati.",
    "trigger": {
        "quote": "I tuoi passi non si vendono a Big Tech.",
        "author": "MapRaiders, principio della privacy"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "I fatti",
            "title": "Marzo 2025 — l'<em>acquisizione saudita</em> in numeri",
            "body": """
    <p>I fatti pubblicamente documentati sull'acquisizione:</p>
    <ul>
      <li><strong>Data.</strong> Marzo 2025, annuncio ufficiale di Niantic.</li>
      <li><strong>Importo.</strong> 3,5 miliardi di dollari.</li>
      <li><strong>Acquirente.</strong> Scopely Inc., con sede a Culver City, California.</li>
      <li><strong>Proprietà di Scopely.</strong> Il 100% delle azioni Scopely è di Savvy Games Group, sussidiaria al 100% del Public Investment Fund (PIF) dell'Arabia Saudita.</li>
      <li><strong>Cosa è stato venduto.</strong> Pokémon GO, Ingress Prime, Pikmin Bloom, Monster Hunter Now — l'intera divisione giochi di Niantic.</li>
      <li><strong>Cosa è rimasto a Niantic.</strong> La piattaforma AR enterprise (mappe 3D, kit per sviluppatori).</li>
    </ul>
            """,
        },
        {
            "label": "Implicazioni IT",
            "title": "Implicazioni per i <em>giocatori italiani</em> — RGPD e Garante",
            "body": """
    <p>Il <strong>Garante per la Protezione dei Dati Personali</strong> ha mostrato a dicembre 2025 cosa significa privacy seria in Italia: 98,6 milioni di euro di multa ad Apple per violazioni delle regole ATT (App Tracking Transparency). Lo stesso quadro RGPD si applica a Scopely/Pokémon GO:</p>
    <ul>
      <li><strong>Trasferimenti extra-UE.</strong> I dati di posizione che finiscono in infrastrutture controllate dal PIF saudita richiedono garanzie RGPD aggiuntive (Standard Contractual Clauses, valutazioni d'impatto). Il pubblico non sa se queste sono state implementate.</li>
      <li><strong>Diritto di accesso e cancellazione.</strong> Ogni cittadino italiano può chiedere a Scopely cosa sa di lui e farlo cancellare. Ma il processo passa per server statunitensi e potenzialmente sauditi.</li>
      <li><strong>Trasparenza limitata.</strong> Scopely non pubblica audit indipendenti sui trasferimenti dati post-acquisizione.</li>
    </ul>
    <p>MapRaiders è strutturalmente diverso: server UE, RGPD by design, nessun trasferimento extra-UE, nessuna proprietà statale.</p>
            """,
        },
        {
            "label": "MapRaiders indipendente",
            "title": "Perché MapRaiders <em>resta indipendente</em>",
            "body": """
    <p>MapRaiders è di proprietà di Scafa Investments LLC — una società a responsabilità limitata privata registrata in Florida (USA). Le azioni sono interamente private; nessun fondo sovrano, nessun investitore istituzionale, nessuno stato è coinvolto nella struttura di proprietà.</p>
    <ul>
      <li><strong>Proprietà privata al 100%.</strong> Scafa Investments LLC è di proprietà del fondatore René Scafarti.</li>
      <li><strong>Server RGPD.</strong> Hosting europeo (Hetzner, Germania), conforme al RGPD by design.</li>
      <li><strong>Nessuna pubblicità.</strong> Niente SDK pubblicitari, niente reti di tracking integrate.</li>
      <li><strong>Cosmetic-only IAP.</strong> Il modello di business è cosmetico-opzionale — niente paywall del gameplay.</li>
      <li><strong>Open per audit.</strong> La policy privacy è pubblica e verificabile. Nessuna clausola nascosta su trasferimenti dati extra-UE.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Pokémon GO appartiene davvero ai sauditi?",
         "a": "Sì, indirettamente. A marzo 2025 Niantic ha venduto la divisione giochi (Pokémon GO compreso) a Scopely per 3,5 miliardi di dollari. Scopely è interamente di proprietà di Savvy Games Group, sussidiaria al 100% del Public Investment Fund (PIF) dell'Arabia Saudita."},
        {"q": "I miei dati di posizione finiscono in Arabia Saudita?",
         "a": "I dettagli tecnici dei trasferimenti dati post-acquisizione non sono pubblicamente documentati. Quel che è certo: l'infrastruttura del proprietario di Scopely include server statunitensi e potenzialmente legati a entità saudite. Le garanzie RGPD aggiuntive (SCC, DPIA) non sono pubblicamente verificabili."},
        {"q": "Posso chiedere la cancellazione dei miei dati a Scopely?",
         "a": "Sì, il RGPD lo garantisce a ogni cittadino italiano. Il processo passa per il modulo privacy di Scopely. Tempi e completezza variano. MapRaiders rende il processo molto più semplice: un'email a info@scafa-investments.com, server UE, cancellazione completa in 30 giorni."},
        {"q": "MapRaiders è davvero indipendente?",
         "a": "Sì. Scafa Investments LLC è una LLC privata della Florida, di proprietà al 100% del fondatore René Scafarti. Nessun fondo sovrano, nessuno stato, nessun investitore istituzionale nella struttura di proprietà."},
        {"q": "Dove sono i server di MapRaiders?",
         "a": "In Germania (Hetzner, Norimberga). RGPD by design, nessun trasferimento extra-UE, conformità Garante italiano automatica."},
    ],
    "internal_links": [
        ("/it/gioco-territorio.html", "Gioco di territorio reale"),
        ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
        ("/it/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/it/pokemon-go-saudi-alternativa-recensioni.html", "Recensioni Saudi alternativa"),
        ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
    ],
}

# K5 — app-camminata-con-gioco
K5 = {
    "slug": "/it/app-camminata-con-gioco.html",
    "breadcrumb": "App camminata con gioco",
    "title": "App camminata con gioco — Strava + territorio",
    "og_title": "App camminata con gioco — cardio + gioco + salute",
    "meta": "App camminata con gioco? MapRaiders trasforma ogni passeggiata in conquista di territorio. Cardio + gioco + salute per tutta la famiglia. RGPD.",
    "keywords": "app camminata, app camminata con gioco, camminare con gioco, gioco per camminare, app cardio gps, strava territorio italia, passeggiata gamification",
    "badge": "Cardio + Gioco",
    "pricing_pill": "Free Forever · 4× meno batteria di Pokémon GO",
    "h1_html": 'App camminata con gioco — quando <em>ogni passo</em> conquista territorio',
    "lead": "Le app di camminata danno statistiche. I giochi di camminata come Pokémon GO danno collezione. Ma nessuna app trasforma il tuo cammino reale in terra reale. MapRaiders sì: ogni passo forma territorio, ogni giro lo difende. Cardio con conseguenza. Famiglia insieme. Salute vera.",
    "trigger": {
        "quote": "La mia motivazione cardio è esplosa.",
        "author": "Vivian N., runner dell'area di Amburgo (beta chiusa)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "Il problema",
            "title": "Perché le <em>app di camminata</em> tradizionali non bastano",
            "body": """
    <p>Strava, Nike Run Club, Adidas Running — misurano tempo, distanza, ritmo. Ma tre punti mancano per molti italiani:</p>
    <ul>
      <li><strong>Niente elemento di gioco.</strong> Chi non insegue record personali perde motivazione in 4 settimane.</li>
      <li><strong>Pressione di performance.</strong> Le classifiche pubbliche demotivano più di quanto aiutino.</li>
      <li><strong>Forzare l'abbonamento.</strong> Strava Premium 9,99€/mese per mappe di calore e confronti percorsi che restano inutili nel piano gratuito.</li>
    </ul>
            """,
        },
        {
            "label": "La soluzione",
            "title": "Come MapRaiders <em>cambia la tua routine</em> di camminata",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Mantenere territorio</h3><p>Ogni percorso difende terra. Chi si ferma 3 giorni vede agire il decay — incentivo naturale al ritorno.</p></div>
    <div class="feat-card rv d1"><h3>Contatore di Decay</h3><p>Il valore Decay mostra: &ldquo;Se non corri oggi, il tuo quartiere si riduce del X%&rdquo;. Senza colpa — solo realtà fisica.</p></div>
    <div class="feat-card rv d2"><h3>Difesa di clan mentre corri</h3><p>Durante la corsa, le push notification ti avvisano quando il territorio del clan è attaccato. Non corri da solo — corri insieme.</p></div>
    <div class="feat-card rv d3"><h3>Ricompensa via Eco</h3><p>Echi audio quando passi. Altri giocatori raccontano storie della strada — senza pubblicità, senza influencer.</p></div>
  </div>""",
        },
        {
            "label": "Strava complemento",
            "title": "MapRaiders <em>completa</em> Strava — non lo sostituisce",
            "body": """
    <p>MapRaiders non compete con Strava in metriche di performance. Puoi far girare entrambe le app contemporaneamente, usano lo stesso sensore GPS senza conflitto. Quel che Strava non dà: territorio reale e difesa sociale. Quel che MapRaiders non dà: analisi dettagliata di pace splits e zone cardiache.</p>
    <p>Combinazione ideale: <strong>Strava per analisi tecnica, MapRaiders per motivazione quotidiana e territorio.</strong> Esegui entrambi, senza problemi.</p>
            """,
        },
        {
            "label": "50+ longevità",
            "title": "Camminata per <em>50+ anni</em> — longevità mediterranea",
            "body": """
    <p>L'Italia ha oltre 14 milioni di persone con 65+. La camminata è l'attività fisica più raccomandata dai geriatri — ma manca motivazione. La cultura mediterranea della <strong>passeggiata</strong> serale è già lì: MapRaiders la trasforma in gioco senza AR (che confonde) e senza competizione aggressiva (che allontana):</p>
    <ul>
      <li><strong>Ritmo proprio.</strong> Niente velocità minima. Walking, camminare con bastone, con un amico — tutto conta per il territorio.</li>
      <li><strong>Stessa via ogni giorno funziona.</strong> La persistenza supera la distanza. Chi ripete, mantiene.</li>
      <li><strong>Comunità di quartiere.</strong> Clan organici con i vicini. Niente Discord, niente chat tossica.</li>
      <li><strong>RGPD-conforme.</strong> Per anziani preoccupati della privacy — nessuna pubblicità mirata, nessuna vendita di posizione, conforme Garante.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Quanto dura la batteria?",
         "a": "In una camminata di 1 ora, tipicamente 15-25% di batteria (vs ~50% in Pokémon GO con AR). I valori variano in base al dispositivo e alla luminosità dello schermo."},
        {"q": "Funziona con Strava o Nike Run Club?",
         "a": "Attualmente senza integrazione diretta. Puoi far girare entrambe le app contemporaneamente — usano lo stesso sensore GPS senza conflitto. Integrazione Strava prevista per Q4 2026."},
        {"q": "Il walking lento conta anche?",
         "a": "Sì. Non c'è velocità minima. Walking, camminata lenta, passeggiata serale — tutto forma territorio, purché ci sia movimento fisico reale (no auto-cheating)."},
        {"q": "Va bene per anziani?",
         "a": "Sì, è pensato per tutte le età. Senza AR, senza rumore, senza pressione di pace. Caratteri grandi, contrasto alto, controlli semplici."},
        {"q": "Quanti dati mobili consuma?",
         "a": "Moderato. Niente live-video, niente API pesanti. Una camminata di 1 ora usa tipicamente 5-15 MB."},
    ],
    "internal_links": [
        ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
        ("/it/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/it/caccia-al-tesoro-app-italia.html", "Caccia al tesoro app Italia"),
        ("/it/app-camminata-con-gioco-recensioni.html", "Recensioni app camminata"),
        ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
    ],
}

# K6 — caccia-al-tesoro-app-italia (VOLUMEN-KING 6-10K!)
K6 = {
    "slug": "/it/caccia-al-tesoro-app-italia.html",
    "breadcrumb": "Caccia al tesoro app Italia",
    "title": "Caccia al tesoro app Italia — città intera dal vivo",
    "og_title": "Caccia al tesoro app Italia — città intera di Echi nascosti",
    "meta": "Caccia al tesoro app Italia 2026: MapRaiders trasforma Roma, Milano, Firenze in caccia al tesoro aperta. Gratis, no abbonamento, AGCM-conforme.",
    "keywords": "caccia al tesoro app, caccia al tesoro app italia, caccia tesoro telefono, app caccia tesoro, geocaching alternativa italia, caccia tesoro famiglia, caccia tesoro bambini",
    "badge": "Caccia al Tesoro",
    "pricing_pill": "Free Forever · No abbonamento · Città intera",
    "h1_html": 'Caccia al tesoro app — un\'<em>intera città di Echi</em> nascosti',
    "lead": "Le app tradizionali di caccia al tesoro come Geocaching richiedono abbonamento premium e tour predefiniti. MapRaiders inverte il paradigma: gli Echi sono già sparsi per tutta la città. Segui le tracce di altri giocatori o lasci le tue. Dal vivo, gratuito, senza tour da comprare, senza preparazione. Tradizione italiana digitalizzata.",
    "trigger": {
        "quote": "Caccia al tesoro autentica — no abbonamento, no Premium.",
        "author": "MapRaiders, principio del marchio"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "Tradizione italiana",
            "title": "La caccia al tesoro <em>tradizione italiana</em> rivisitata",
            "body": """
    <p>La caccia al tesoro è cultura italiana profonda — dalla Befana che lascia indizi alle feste di compleanno con bigliettini nascosti, dai tour delle scuole alle escape room di Milano e Roma. MapRaiders prende questa tradizione e la apre alla città intera, senza tour da comprare, senza preparazione, senza barriera premium.</p>
    <p>Tre criteri separano le app di caccia al tesoro degli anni 2020 dalle soluzioni di carta stampata:</p>
    <ul>
      <li><strong>Dal vivo.</strong> Gli indizi appaiono in tempo reale, non solo in tour pre-fabbricati.</li>
      <li><strong>Sociale.</strong> I giocatori lasciano indizi gli uni per gli altri, invece di solo seguire.</li>
      <li><strong>Senza barriera premium.</strong> Genitori e bambini entrano subito, senza dover comprare tour da 15 euro.</li>
    </ul>
            """,
        },
        {
            "label": "Confronto",
            "title": "App di caccia al tesoro <em>a confronto</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>Prezzo</th><th>Preparazione</th><th>Dal vivo?</th><th>Loop di gioco</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Geocaching</td><td>Sub Premium ~30€/anno</td><td>Bassa — trovare cache</td><td class="cross">Asincrono</td><td>Collezionare</td></tr>
      <tr><td class="feat-name">Gaiasmart</td><td class="check">Gratuito</td><td>Bassa — tour cittadini</td><td class="cross">Tour predefiniti</td><td>Visitare</td></tr>
      <tr><td class="feat-name">City Adventure</td><td>Tour singoli</td><td>Alta — montare tour</td><td class="cross">✗</td><td>Per-tour</td></tr>
      <tr><td class="feat-name">World City Trail</td><td>Premium-Sub</td><td>Media</td><td class="cross">Asincrono</td><td>Tour guidati</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">0,00€</td><td class="check">Zero</td><td class="check">Dal vivo</td><td>Echi + Missioni + Territorio</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Echi",
            "title": "Come MapRaiders <em>ripensa</em> la caccia al tesoro",
            "body": """
    <p>Invece di un tour lineare dalla stazione 1 alla 10, MapRaiders crea una <strong>caccia al tesoro spaziale aperta</strong> — la città intera è il playground:</p>
    <ul>
      <li><strong>Lasciare Echi.</strong> Lascia un Eco audio, foto o video in un luogo. Altri giocatori lo scoprono passando.</li>
      <li><strong>Trovare Echi.</strong> Vedi sulla mappa dove sono gli Echi. Segui le tracce, trova segreti, ascolta storie.</li>
      <li><strong>Creare missioni.</strong> Crea un piccolo incarico in un luogo (&ldquo;Fai una foto della porta rossa&rdquo;). Altri giocatori lo completano.</li>
      <li><strong>Strato di territorio.</strong> Chi percorre frequentemente un percorso di caccia al tesoro lo conquista come territorio — le tracce diventano terra.</li>
    </ul>
            """,
        },
        {
            "label": "Famiglia + RGPD bambini",
            "title": "Caccia al tesoro app per <em>bambini e famiglia</em>",
            "body": """
    <p>La caccia al tesoro è cultura italiana dell'infanzia — indizi col gesso, traccia di foglie, nascondiglio finale con caramelle. MapRaiders porta questo nell'era smartphone, senza lasciare i bambini soli sullo schermo:</p>
    <ul>
      <li><strong>Attività genitori-figli.</strong> I genitori lasciano Echi audio su un percorso pianificato, i bambini seguono le tracce — movimento analogico, indizi digitali.</li>
      <li><strong>Schermo minimo, mondo massimo.</strong> L'app guida sulla mappa; l'esperienza accade nel mondo reale.</li>
      <li><strong>RGPD-conforme per bambini.</strong> Nessun tracker pubblicitario personalizzato, nessuna vendita di dati, nessuna chat in-app senza approvazione dei genitori. Conforme Garante Bambini.</li>
      <li><strong>Modalità famiglia.</strong> Eventi privati di Pasqua, Befana, Natale — solo per il gruppo familiare.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders è adatto ai bambini?",
         "a": "Sì, dai 9 anni con accompagnamento dei genitori. L'app è conforme al RGPD, senza pubblicità e non raccoglie dati personali dei bambini. I genitori possono attivare una modalità famiglia."},
        {"q": "Quanta preparazione serve per una caccia con bambini?",
         "a": "Zero. A differenza di City Adventure o World City Trail, non devi comprare tour né preparare stazioni. Gli Echi sono già sparsi in città — basta seguire le tracce di altri giocatori o lasciare le tue."},
        {"q": "L'app di caccia al tesoro costa qualcosa?",
         "a": "No. Le funzioni di caccia al tesoro (lasciare Echi, trovare Echi, creare missioni) sono totalmente gratuite. Opzionalmente, ci sono cosmetici da 1,99€ — senza vantaggio nel gioco. AGCM-conforme."},
        {"q": "Funziona in città piccole?",
         "a": "Sì. Anche in città piccole o quartieri puoi lasciare Echi e creare missioni. Nei centri maggiori trovi più tracce di altri giocatori; in provincia, il tuo tour ha più spazio proprio."},
        {"q": "L'app è in italiano?",
         "a": "Sì. MapRaiders è completamente localizzato in italiano — menu, sistema Echi, suggerimenti, supporto."},
    ],
    "internal_links": [
        ("/it/gioco-territorio.html", "Gioco di territorio reale"),
        ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
        ("/it/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/it/gaiasmart-alternativa.html", "Gaiasmart alternativa"),
        ("/it/caccia-al-tesoro-app-italia-recensioni.html", "Recensioni caccia al tesoro"),
        ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
    ],
}

# K7 — gaiasmart-alternativa (IT-EXKLUSIV — KOMPLEMENT)
K7 = {
    "slug": "/it/gaiasmart-alternativa.html",
    "breadcrumb": "Gaiasmart alternativa",
    "title": "Gaiasmart alternativa — MapRaiders per il territorio",
    "og_title": "Gaiasmart alternativa — usali insieme per la migliore esperienza",
    "meta": "Usi Gaiasmart per visitare le città? MapRaiders aggiunge il gioco di territorio, Echi, clan. Usali insieme per la migliore esperienza.",
    "keywords": "gaiasmart alternativa, gaiasmart vs mapraiders, gaiasmart territorio, app italiana caccia tesoro, complemento gaiasmart, gaiasmart territorio gioco",
    "badge": "Complemento · IT-Esclusivo",
    "pricing_pill": "Usali insieme · Free Forever",
    "h1_html": 'Gaiasmart alternativa — <em>MapRaiders</em> per il territorio',
    "lead": "Usi Gaiasmart per visitare città italiane? Ottima scelta — è un'app italiana fatta bene. MapRaiders non vuole sostituirla; aggiunge ciò che Gaiasmart non fa: gioco di territorio, Echi degli utenti, difesa di clan. Usali insieme per la migliore esperienza italiana.",
    "trigger": {
        "quote": "Con Gaiasmart o da solo — MapRaiders per il territorio.",
        "author": "MapRaiders, principio del complemento"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Rispetto",
            "title": "Gaiasmart è <em>ottimo</em> — rispetto",
            "body": """
    <p>Gaiasmart è un'app italiana di guide turistiche e tour cittadini che ha fatto un lavoro eccellente per la visita di città italiane. Tour audio guidati, contenuti culturali curati, focus sul patrimonio italiano. Se cerchi questo, Gaiasmart è la scelta giusta.</p>
    <p>Diciamolo chiaramente: <strong>MapRaiders non vuole sostituire Gaiasmart.</strong> Sono due app con due missioni diverse. Gaiasmart guida; MapRaiders gioca. Insieme, danno l'esperienza italiana più completa.</p>
            """,
        },
        {
            "label": "Cosa aggiunge MapRaiders",
            "title": "Cosa <em>aggiunge MapRaiders</em> oltre Gaiasmart",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territorio persistente</h3><p>Gaiasmart è guida singola; MapRaiders trasforma le strade percorse in territorio tuo, persistente, difendibile.</p></div>
    <div class="feat-card rv d1"><h3>Echi degli utenti</h3><p>Gaiasmart offre contenuti curati dall'editore; MapRaiders permette ai giocatori di lasciare Echi audio/foto/video propri ovunque.</p></div>
    <div class="feat-card rv d2"><h3>Difesa e attacco</h3><p>Gaiasmart è esperienza individuale; MapRaiders aggiunge clan, difesa, mini-giochi competitivi tra giocatori.</p></div>
    <div class="feat-card rv d3"><h3>Decay Engine</h3><p>Gaiasmart è statico; MapRaiders ha un sistema vivente in cui i territori si riducono se non vengono percorsi regolarmente.</p></div>
  </div>""",
        },
        {
            "label": "Usarli insieme",
            "title": "Come <em>usarli insieme</em> nella stessa giornata",
            "body": """
    <p>Esempio pratico: visita di Firenze in giornata.</p>
    <ul>
      <li><strong>Mattina con Gaiasmart.</strong> Tour guidato degli Uffizi e di Palazzo Pitti. Audio culturale, storia dell'arte, contesto. Gaiasmart fa ciò che fa meglio.</li>
      <li><strong>Pomeriggio con MapRaiders.</strong> Mentre cammini tra Ponte Vecchio e Duomo, conquisti territorio. Lasci un Eco davanti al Duomo (&ldquo;Tramonto incredibile alle 18&rdquo;). Cerchi Echi di altri giocatori.</li>
      <li><strong>Sera con entrambi.</strong> Aperitivo a San Niccolò — Gaiasmart ti racconta la storia del quartiere, MapRaiders ti dice se altri giocatori del tuo clan sono nelle vicinanze.</li>
    </ul>
    <p>Una sola batteria, due esperienze complementari. Niente conflitto, niente sovrapposizione.</p>
            """,
        },
        {
            "label": "Confronto sanft",
            "title": "Confronto <em>onesto</em> — quando usare quale",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Caso d'uso</th><th>Gaiasmart</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Tour guidato culturale</td><td class="check">Eccellente</td><td>Limitato</td></tr>
      <tr><td class="feat-name">Conquista quartiere quotidiano</td><td>Non disponibile</td><td class="check">Eccellente</td></tr>
      <tr><td class="feat-name">Echi sociali tra utenti</td><td>Non disponibile</td><td class="check">Eccellente</td></tr>
      <tr><td class="feat-name">Storia dell'arte locale</td><td class="check">Eccellente</td><td>Limitato</td></tr>
      <tr><td class="feat-name">Camminata cardio motivante</td><td>Non focus</td><td class="check">Eccellente</td></tr>
      <tr><td class="feat-name">Clan e difesa</td><td>Non disponibile</td><td class="check">Eccellente</td></tr>
      <tr><td class="feat-name">Visita una tantum di città</td><td class="check">Eccellente</td><td>Possibile</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Raccomandazione onesta:</strong> Tieni entrambe. Sono complementari, non concorrenti.</p>""",
        },
    ],
    "faq": [
        {"q": "MapRaiders sostituisce Gaiasmart?",
         "a": "No. Le due app hanno missioni diverse. Gaiasmart è guida turistica curata; MapRaiders è gioco di territorio sociale. La raccomandazione è tenerle entrambe."},
        {"q": "Posso usare entrambe contemporaneamente?",
         "a": "Sì. Le app non hanno conflitti tecnici — usano lo stesso sensore GPS senza interferenza. Puoi avere Gaiasmart attivo per audio guida e MapRaiders attivo in background per territorio."},
        {"q": "MapRaiders è italiano come Gaiasmart?",
         "a": "MapRaiders è una LLC americana (Florida) con localizzazione italiana completa e server europei. Gaiasmart è italiana al 100%. Entrambe sono RGPD-conformi e rispettano il Garante."},
        {"q": "Gaiasmart e MapRaiders condividono dati?",
         "a": "No. Sono app indipendenti, di aziende diverse, senza scambio dati. La tua attività su Gaiasmart non è visibile su MapRaiders e viceversa."},
        {"q": "Quale uso prima?",
         "a": "Dipende dall'intento. Per visita una tantum di una città italiana sconosciuta: Gaiasmart prima. Per quotidianità nel tuo quartiere e camminata regolare: MapRaiders prima. Per giornate complete in città: entrambe insieme."},
    ],
    "internal_links": [
        ("/it/gioco-territorio.html", "Gioco di territorio reale"),
        ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
        ("/it/caccia-al-tesoro-app-italia.html", "Caccia al tesoro app Italia"),
        ("/it/gaiasmart-alternativa-recensioni.html", "Recensioni Gaiasmart alternativa"),
        ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/it/gioco-territorio-recensioni.html",
        "breadcrumb": "Gioco di territorio recensioni",
        "title": "Gioco di territorio recensioni — tester beta su MapRaiders",
        "og_title": "Gioco di territorio — recensioni reali dalla beta",
        "meta": "Recensioni di gioco di territorio nella vita quotidiana: tre tester beta raccontano come conquistare terra, decay e mini-giochi di difesa funzionano nello spazio urbano reale.",
        "keywords": "gioco di territorio recensioni, gioco di territorio test, conquistare territorio app recensioni",
        "h1_html": 'Gioco di territorio — quando la <em>tua strada</em> è tua',
        "lead": "Com'è conquistare una strada davvero? Tre tester beta raccontano il primo territorio, il primo shock di Decay e il primo mini-gioco di difesa.",
        "intro_label": "Cosa conta nel test?",
        "intro_title": "Cosa rende un <em>gioco di territorio</em> tangibile",
        "intro_body": """
    <p>Nel test del territorio, tre assi di esperienza contano:</p>
    <ul>
      <li><strong>Conquista.</strong> Quando la prima strada si sente come &ldquo;la mia terra&rdquo;?</li>
      <li><strong>Perdita.</strong> Come reagire al primo Decay o alla prima sconfitta contro un attaccante?</li>
      <li><strong>Difesa.</strong> Come si sentono i mini-giochi di difesa — tattici, equi, frustranti?</li>
    </ul>
    <p>Le citazioni dei tre tester coprono tutti e tre gli assi da prospettive molto diverse.</p>
        """,
        "internal_links": [
            ("/it/gioco-territorio.html", "Gioco di territorio reale"),
            ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
            ("/it/gioco-geolocalizzazione-recensioni.html", "Recensioni gioco geolocalizzato"),
            ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
        ],
    },
    {
        "slug": "/it/gioco-geolocalizzazione-recensioni.html",
        "breadcrumb": "Gioco geolocalizzato recensioni",
        "title": "Gioco geolocalizzato recensioni — MapRaiders al test reale",
        "og_title": "Gioco geolocalizzato — recensioni di tester beta",
        "meta": "Recensioni di gioco geolocalizzato: tre tester beta raccontano di batteria, precisione GPS, privacy e divertimento reale nella vita urbana quotidiana.",
        "keywords": "gioco geolocalizzato recensioni, gioco geolocalizzato test, gps mmo test, mapraiders recensioni",
        "h1_html": 'Gioco geolocalizzato — <em>recensioni</em> di tester beta',
        "lead": "Quanto è preciso il GPS nei centri urbani? Quanta batteria consuma l'app su percorsi lunghi? Come si sente la conformità RGPD nella pelle di giocatore? Tre tester rispondono onestamente.",
        "intro_label": "Assi del test",
        "intro_title": "Cosa abbiamo testato in un <em>gioco geolocalizzato</em>",
        "intro_body": """
    <p>Il test del gioco geolocalizzato è ruotato attorno a quattro assi concreti:</p>
    <ul>
      <li><strong>Precisione GPS</strong> in canyon urbani e sotto i ponti.</li>
      <li><strong>Consumo di batteria</strong> in tragitti di 1-2 ore (rispetto a Pokémon GO).</li>
      <li><strong>Sensazione di privacy</strong>: quanto fastidio di tracking appare?</li>
      <li><strong>Meccanica di gioco</strong>: territorio, Echi e missioni funzionano nella giornata reale?</li>
    </ul>
        """,
        "internal_links": [
            ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
            ("/it/gioco-territorio.html", "Gioco di territorio reale"),
            ("/it/gioco-territorio-recensioni.html", "Recensioni gioco di territorio"),
            ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
        ],
    },
    {
        "slug": "/it/alternativa-pokemon-go-gratis-recensioni.html",
        "breadcrumb": "Alternativa Pokémon GO gratis recensioni",
        "title": "Alternativa Pokemon GO gratis vale la pena? — tester beta rispondono",
        "og_title": "Alternativa Pokémon GO gratis — beta-test onesto",
        "meta": "Alternativa Pokémon GO gratis vale la pena? Tre tester beta di Stoccarda, Amburgo e Berlino rispondono onestamente su cardio, passeggiata col cane e esplorazione urbana.",
        "keywords": "alternativa pokemon go gratis recensioni, alternativa pokemon go vale la pena, mapraiders recensioni, beta tester racconto",
        "h1_html": 'Alternativa Pokémon GO gratis — <em>vale davvero la pena?</em>',
        "lead": "Tre tester beta di tre regioni metropolitane tedesche hanno usato MapRaiders per diverse settimane. Qui i racconti senza filtro — niente marketing-talk, niente codice influencer.",
        "intro_label": "Chi ha testato?",
        "intro_title": "Tre persone, tre <em>casi d'uso</em>",
        "intro_body": """
    <p>I tre tester beta coprono tre persone molto diverse — ed è questo che rende il confronto con Pokémon GO onesto:</p>
    <ul>
      <li><strong>Ron C.</strong> dell'area di Stoccarda: padrone di cane, passeggiata quotidiana, senza background gamer.</li>
      <li><strong>Vivian N.</strong> dell'area di Amburgo: runner, ha giocato a Pokémon GO nel 2018 e ha smesso dopo 3 mesi.</li>
      <li><strong>Aljoscha P.</strong> dell'area di Berlino: esploratore urbano, veterano di Ingress, conosce l'ecosistema Niantic in prima persona.</li>
    </ul>
    <p>I tre hanno testato MapRaiders indipendentemente — senza promozione pagata, senza script. Le citazioni sono state tradotte dagli originali in tedesco.</p>
        """,
        "internal_links": [
            ("/it/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
            ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
            ("/it/pokemon-go-saudi-alternativa.html", "Pokemon GO Saudi alternativa"),
            ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
        ],
    },
    {
        "slug": "/it/pokemon-go-saudi-alternativa-recensioni.html",
        "breadcrumb": "Pokémon GO Saudi alternativa recensioni",
        "title": "Pokemon GO Saudi alternativa recensioni — test onesto",
        "og_title": "Pokémon GO Saudi alternativa — recensioni dalla beta",
        "meta": "Recensioni di alternativa Pokémon GO Saudi: tester beta raccontano perché MapRaiders elimina la preoccupazione del fondo sovrano alla radice. RGPD, server UE.",
        "keywords": "pokemon go saudi alternativa recensioni, alternativa rgpd recensioni, mapraiders test privacy",
        "h1_html": 'Pokémon GO Saudi alternativa — <em>recensioni oneste</em>',
        "lead": "Pokémon GO è stato comprato da Scopely (PIF saudita) a marzo 2025. Come si sente giocare un GPS MMO che è strutturalmente indipendente? Tre tester beta rispondono.",
        "intro_label": "Privacy by design",
        "intro_title": "Perché <em>l'indipendenza strutturale</em> conta",
        "intro_body": """
    <p>I tre tester beta hanno valutato l'argomento privacy da angolazioni pratiche:</p>
    <ul>
      <li><strong>Server UE.</strong> Hetzner Norimberga vs server Scopely americani.</li>
      <li><strong>Conformità Garante.</strong> Cosa significa RGPD by design nella vita quotidiana?</li>
      <li><strong>Trasparenza dei dati.</strong> Modulo privacy semplice vs opacità Scopely.</li>
      <li><strong>Proprietà privata.</strong> LLC privata vs sussidiaria di fondo sovrano.</li>
    </ul>
        """,
        "internal_links": [
            ("/it/pokemon-go-saudi-alternativa.html", "Pokemon GO Saudi alternativa"),
            ("/it/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
            ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
            ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
        ],
    },
    {
        "slug": "/it/app-camminata-con-gioco-recensioni.html",
        "breadcrumb": "App camminata con gioco recensioni",
        "title": "App camminata con gioco vale la pena? — test reale",
        "og_title": "App camminata con gioco — vale la pena nella quotidianità?",
        "meta": "App camminata con gioco vale la pena? Tester beta raccontano motivazione cardio, batteria su percorsi lunghi e perdita di territorio dopo pausa per malattia.",
        "keywords": "app camminata vale la pena, app camminata con gioco recensioni, cardio app test",
        "h1_html": 'App camminata con gioco — <em>vale la pena</em>?',
        "lead": "Cosa succede alla motivazione di camminare quando ogni percorso difende terra reale? Come si sente il primo Decay dopo una pausa per influenza? Tre tester beta — una runner, un walker, un esploratore urbano — rispondono.",
        "intro_label": "Assi del test",
        "intro_title": "Cosa un'<em>app di camminata</em> deve dare",
        "intro_body": """
    <p>Abbiamo testato l'esperienza di camminata su tre assi:</p>
    <ul>
      <li><strong>Ancora di motivazione.</strong> Quando qualcuno torna dopo una pausa?</li>
      <li><strong>Batteria su percorso lungo.</strong> Tragitti di 60-90 minuti senza esaurire il telefono.</li>
      <li><strong>Cross-modalità.</strong> Funziona uguale per corsa, walking e passeggiata col cane?</li>
    </ul>
        """,
        "internal_links": [
            ("/it/app-camminata-con-gioco.html", "App camminata con gioco"),
            ("/it/caccia-al-tesoro-app-italia.html", "Caccia al tesoro app Italia"),
            ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
            ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
        ],
    },
    {
        "slug": "/it/caccia-al-tesoro-app-italia-recensioni.html",
        "breadcrumb": "Caccia al tesoro app Italia recensioni",
        "title": "Caccia al tesoro app Italia recensioni — tester beta su MapRaiders",
        "og_title": "Caccia al tesoro app Italia — recensioni reali dalla beta",
        "meta": "Recensioni di app caccia al tesoro Italia senza tour da comprare o preparazione: tester beta raccontano come MapRaiders trasforma la città intera in caccia al tesoro dal vivo.",
        "keywords": "caccia al tesoro app italia recensioni, caccia al tesoro app test, live caccia tesoro recensioni, famiglia caccia tesoro",
        "h1_html": 'Caccia al tesoro app Italia — <em>recensioni</em> senza tour da comprare',
        "lead": "La maggior parte delle app di caccia al tesoro richiede preparazione: comprare tour, pianificare percorso, montare stazioni. Come si sente quando la città intera è già piena di indizi? Tre tester beta rispondono.",
        "intro_label": "Domanda del test",
        "intro_title": "Funziona una <em>caccia al tesoro dal vivo</em> senza preparazione?",
        "intro_body": """
    <p>Abbiamo testato le funzioni di caccia al tesoro in tre scenari:</p>
    <ul>
      <li><strong>Da solo</strong> come esploratore urbano (Aljoscha P.) — lasciare Echi, trovare Echi.</li>
      <li><strong>Col cane</strong> in passeggiata normale (Ron C.) — indizi come sottoprodotto della passeggiata.</li>
      <li><strong>Scenario familiare</strong> simulato — quanto velocemente adulti + bambini capiscono la meccanica?</li>
    </ul>
        """,
        "internal_links": [
            ("/it/caccia-al-tesoro-app-italia.html", "Caccia al tesoro app Italia"),
            ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
            ("/it/gioco-territorio.html", "Gioco di territorio reale"),
            ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
        ],
    },
    {
        "slug": "/it/gaiasmart-alternativa-recensioni.html",
        "breadcrumb": "Gaiasmart alternativa recensioni",
        "title": "Gaiasmart alternativa recensioni — tester beta raccontano",
        "og_title": "Gaiasmart alternativa — recensioni reali",
        "meta": "Recensioni di Gaiasmart alternativa: tester beta raccontano come MapRaiders completa Gaiasmart con territorio, Echi e clan. Usali insieme.",
        "keywords": "gaiasmart alternativa recensioni, gaiasmart vs mapraiders test, complemento gaiasmart recensioni",
        "h1_html": 'Gaiasmart alternativa — <em>recensioni</em> di chi ha provato entrambe',
        "lead": "Com'è usare Gaiasmart e MapRaiders insieme nella stessa giornata? Le due app entrano in conflitto o si completano davvero? Tre tester beta rispondono.",
        "intro_label": "Assi del test",
        "intro_title": "Cosa un <em>complemento</em> deve rispettare",
        "intro_body": """
    <p>Abbiamo testato la coesistenza in tre assi:</p>
    <ul>
      <li><strong>Conflitto tecnico.</strong> Le app si disturbano sul GPS o sulla batteria?</li>
      <li><strong>Sovrapposizione contenuto.</strong> I contenuti si ripetono o sono complementari?</li>
      <li><strong>Esperienza utente.</strong> Cambiare tra le due app è scomodo o naturale?</li>
    </ul>
        """,
        "internal_links": [
            ("/it/gaiasmart-alternativa.html", "Gaiasmart alternativa"),
            ("/it/caccia-al-tesoro-app-italia.html", "Caccia al tesoro app Italia"),
            ("/it/gioco-geolocalizzazione.html", "Gioco geolocalizzato 2026"),
            ("/it/mapraiders-recensioni.html", "Tutte le recensioni"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/it/mapraiders-recensioni.html",
    "breadcrumb": "MapRaiders recensioni",
    "title": "MapRaiders recensioni — beta-test, fondatore, tutte le pagine",
    "og_title": "MapRaiders recensioni — tutto in un solo posto",
    "meta": "MapRaiders recensioni: 5,0 su 5 stelle in tre beta-test verificati, statement del fondatore, tutte le pagine Killer e racconti di recensione collegati centralmente.",
    "keywords": "mapraiders recensioni, mapraiders recensione, mapraiders test, gps mmo recensioni italia",
    "badge": "Hub & Panoramica",
    "pricing_pill": "5,0 / 5 — 3 recensioni verificate dalla beta",
    "h1_html": '<em>MapRaiders recensioni</em> — tutto quello che devi sapere sul GPS MMO',
    "lead": "Tre tester beta da Stoccarda, Amburgo e Berlino. Sette argomenti Killer dal confronto con Pokémon GO all'app di caccia al tesoro. Sette recensioni dettagliate. Un hub.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "Cos'è MapRaiders, in fondo?",
         "a": "MapRaiders è un GPS MMO per Android. I giocatori conquistano territori reali col movimento, lasciano Echi, creano missioni e difendono la loro terra con mini-giochi. Senza pubblicità, RGPD-conforme, gratuito. Pagamento via PayPal, Apple Pay, Google Pay, Carta di Credito, Klarna IT o Satispay per i cosmetici."},
        {"q": "Quanti sono i tester beta?",
         "a": "Attualmente tre persone che abbiamo reso pubbliche — col loro consenso e sotto nome di battesimo + iniziale per motivi di privacy. La beta chiusa nel suo insieme è più grande; i tre citati rappresentano le persona principali."},
        {"q": "Le recensioni sono reali?",
         "a": "Sì. I tre tester sono persone reali della beta chiusa in Germania. Non sono stati pagati; le loro citazioni sono state originariamente scritte in tedesco e tradotte all'italiano. Nel markup Schema.org sono contrassegnate con data, lingua e riferimento all'originale tedesco (translationOfWork)."},
        {"q": "Dove posso essere tester beta in Italia?",
         "a": "Iscriviti sulla pagina iniziale italiana con la tua email. Posti beta italiani saranno rilasciati a ondate dopo il lancio principale — priorità per padroni di cane, runner ed esploratori urbani di città con bassa densità Pokémon GO."},
        {"q": "Quando esce ufficialmente l'app in Italia?",
         "a": "MapRaiders è in beta chiusa su Google Play (Germania). Lancio IT ufficiale previsto per estate 2026 (giugno-luglio IT). iOS in Q3 2026."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print("=== Phase 1 Session 3 — IT Killer-URL Builder ===")
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
        print(f"  it/{n}")


if __name__ == "__main__":
    main()

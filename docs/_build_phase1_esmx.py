#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 3 — ES-MX Killer-URL Builder
Generates 15 ES-MX pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_ES-MX_FINAL_MASTER_PLAN.md.

Output: docs/es-mx/
Run: py docs/_build_phase1_esmx.py
Idempotent: overwrites existing files.

MX-Vokabular zwingend:
- "colonia" (NICHT "vecindario", NICHT "barrio")
- "pasear el perro" (NICHT "paseo de perros")
- "celular" (NICHT "móvil")
- "computadora" (NICHT "ordenador")
"""

import json
from pathlib import Path

DOCS = Path(__file__).resolve().parent
OUT_DIR = DOCS / "es-mx"
SITE = "https://mapraiders.com"
LANG = "es-MX"
LANG_SHORT = "es"

# Hreflang map — 16 languages + x-default (per Master-Plan)
HREFLANG = [
    ("de", "/"),
    ("en", "/en/"),
    ("fr", "/fr/"),
    ("es-MX", "/es-mx/"),
    ("es-ES", "/es-es/"),
    ("it", "/it/"),
    ("pt-BR", "/pt-br/"),
    ("tr", "/tr/"),
    ("ru", "/ru/"),
    ("ja", "/ja/"),
    ("ko", "/ko/"),
    ("zh-CN", "/zh-cn/"),
    ("ar", "/ar/"),
    ("hi", "/hi/"),
    ("id", "/id/"),
    ("en-IN", "/en-in/"),
]

LANG_SWITCHER = [
    ("Deutsch", "de", "/"),
    ("English", "en", "/en/"),
    ("Français", "fr", "/fr/"),
    ("Español (MX)", "es-MX", "/es-mx/"),
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
# REUSABLE BLOCKS — ES-MX
# -----------------------------------------------------------------------------

# Beta-Tester data (ES-MX-translated quotes per Master-Plan §1.2)
TESTER_RON = {
    "name": "Ron C.",
    "name_de": "Ron C.",
    "role": "Dueño de perro · región de Stuttgart",
    "role_long": "Dueño de perro de la región de Stuttgart (beta cerrada)",
    "quote": "A mi perro lo tengo que sacar dos veces al día de todos modos, ahora me llevo el celular y reviso de noche si mi cuadra sigue azul. Suena tonto, pero ya me agarré la costumbre.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "name_de": "Vivian N.",
    "role": "Corredora · región de Hamburgo",
    "role_long": "Corredora de la región de Hamburgo (beta cerrada)",
    "quote": "Salgo a correr todas las mañanas, eso ya lo hacía. Pero ahora también defiendo algo. Mi vuelta por el Alster es mía y quiero que siga así. Es raro cuánta disciplina aparece de repente.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "name_de": "Aljoscha P.",
    "role": "Explorador urbano · región de Berlín",
    "role_long": "Explorador urbano de la región de Berlín (beta cerrada)",
    "quote": "Dejas un Echo de audio en la entrada de un edificio y tres días después lo encontró alguien que no conoces. Para ser un juego, se siente raramente íntimo.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder Quote ES-MX (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "Jugué Pokémon GO tres años y en algún punto lo dejé. Lo que me faltaba nunca llegó: "
    "tierra de verdad, en lugar de gimnasios pasajeros. Cuando en 2025 Pokémon GO pasó a una "
    "subsidiaria del fondo soberano saudita, supe que el camino de Niantic ya no iba para donde "
    "a mí me interesaba. Así que construyo MapRaiders por mi cuenta. Sin publicidad, sin presión "
    "de inversionistas, sin suscripción obligatoria. Mi colonia es mi cancha de casa. La tuya, "
    "la agarras tú."
)

# Pricing offers (MXN — Master-Plan §1.1)
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0.00", "currency": "MXN"},
    {"name": "Cosmético-IAP desde", "price": "39.00", "currency": "MXN"},
    {"name": "MapRaiders Apoyador (Sub)", "price": "79.00", "currency": "MXN"},
    {"name": "Apoyador Vitalicio", "price": "1990.00", "currency": "MXN"},
]

# DefinedTermSet ES-MX (Master-Plan §8 — incl. "Colonia" MX-spezifisch!)
DEFINED_TERMS = [
    ("Territorio", "Un área conquistada en el mapa del juego, asignada de forma persistente al jugador o clan"),
    ("Echo", "Señal de audio, foto o video dejada por un jugador en una ubicación real, que otros jugadores pueden descubrir"),
    ("Mini-juego de defensa", "Mini-juego (gato, piedra-papel-tijera, mini-ajedrez) activado durante la defensa o conquista de un territorio"),
    ("Misión", "Mini-tarea creada por un jugador que otros jugadores pueden completar en el mundo real"),
    ("Clan", "Grupo formado orgánicamente de jugadores que mantienen y defienden territorios juntos"),
    ("Colonia", "Vocablo mexicano para vecindario o barrio. En MapRaiders, la colonia es la unidad cultural-geográfica básica del territorio cotidiano del jugador"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """Generate hreflang tags. slug is e.g. '/es-mx/juego-de-gps.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "es-MX":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="es-MX"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">De la beta cerrada</div>
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
    <div class="fr-label">El Fundador</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Fundador de MapRaiders" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">Fundador, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">De la beta cerrada</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.6">
      Aviso: Los probadores son participantes internos de la beta cerrada (Alemania). Por petición de ellos y por privacidad, usamos solo el primer nombre y la inicial. Los textos se tradujeron del alemán al español mexicano.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    """WhatsApp-Sharing-Button (Master-Plan §6 — Pflicht!) + Telegram."""
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    wa_text = f"Conoce%20MapRaiders%20-%20{enc}"
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}.mr-share__btn.wa{{border-color:#25D366}}.mr-share__btn.wa:hover{{background:#25D366;color:#fff}}</style>
<div class="mr-share" aria-label="Compartir"><span class="mr-share__label">Compartir:</span><a class="mr-share__btn wa" href="https://wa.me/?text={wa_text}" target="_blank" rel="noopener noreferrer">📱 WhatsApp</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">Términos</a><a href="/datenschutz.html">Privacidad</a><a href="/impressum.html">Aviso legal</a><a href="/kontakt.html">Contacto</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders. Conquista tu colonia de verdad. Scafa Investments LLC.</p>
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
  <a href="/es-mx/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/es-mx/#features" class="lnk">Funciones</a>
    <a href="/es-mx/mapraiders-opiniones.html" class="lnk">Opiniones</a>
    <div class="lang-sw">
      <button class="lsw-btn">ES-MX <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('es-MX')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">Próximamente</a>
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
    "/es-mx/alternativa-pokemon-go-gratis.html": "/pokemon-go-alternative-kostenlos.html",
    "/es-mx/juego-de-gps.html": "/gps-spiel-deutschland.html",
    "/es-mx/juego-de-territorio.html": "/territorium-spiel.html",
    "/es-mx/pokemon-go-sin-fake-gps.html": "/spiele-wie-pokemon-go.html",
    "/es-mx/app-caminata-con-juego.html": "/handyspiel-zum-laufen.html",
    "/es-mx/busqueda-del-tesoro-app.html": "/schnitzeljagd-app.html",
    "/es-mx/juego-de-colonia.html": "/standort-spiel.html",
    "/es-mx/alternativa-pokemon-go-vale-la-pena.html": "/pokemon-go-alternative-erfahrungen.html",
    "/es-mx/juego-de-gps-opiniones.html": "/gps-spiel-erfahrungen.html",
    "/es-mx/juego-de-territorio-opiniones.html": "/territorium-spiel-erfahrungen.html",
    "/es-mx/pokemon-go-sin-fake-gps-opiniones.html": "/spiele-wie-pokemon-go-erfahrungen.html",
    "/es-mx/app-caminata-vale-la-pena.html": "/handyspiel-laufen-erfahrungen.html",
    "/es-mx/busqueda-del-tesoro-app-opiniones.html": "/schnitzeljagd-app-erfahrungen.html",
    "/es-mx/juego-de-colonia-opiniones.html": "/standort-spiel-erfahrungen.html",
    "/es-mx/mapraiders-opiniones.html": "/mapraiders-erfahrungen.html",
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
        "inLanguage": "es-MX",
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
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": f"{SITE}/es-mx/"},
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
            "inLanguage": "es-MX",
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
            "inLanguage": "es-MX",
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
            "jobTitle": "Fundador",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-es-mx",
            "name": "MapRaiders Vocabulario de Marca ES-MX",
            "inLanguage": "es-MX",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": f"{SITE}/es-mx/"},
        {"@type": "ListItem", "position": 2, "name": "Opiniones", "item": f"{SITE}/es-mx/mapraiders-opiniones.html"},
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
            "inLanguage": "es-MX",
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
            "inLanguage": "es-MX",
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
        "name": "MapRaiders ES-MX: todas las páginas Killer y de opiniones",
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
  <h2 class="sec-title rv d1">Preguntas <em>frecuentes</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Más sobre tu <em>cancha de casa</em></h2>
  <p class="rv d1">Otros temas alrededor de MapRaiders:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Próximamente en Google Play &bull; Gratis &bull; Sin spam</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">Avísame al lanzamiento</a>
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
<html lang="es-MX" data-theme="light">
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
<meta property="og:locale" content="es_MX">
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
    Avísame al lanzamiento
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
  <div class="sec-label rv">Opiniones</div>
  <h2 class="sec-title rv d1">5,0 de 5 con <em>tres opiniones verificadas de la beta</em></h2>
  <div class="prose rv d2">
    <p>Ron pasea a su perro todos los días, Vivian sale a correr en las mañanas, Aljoscha recorre Berlín a pie. Los tres usaron MapRaiders varias semanas dentro de su rutina normal y mandaron retroalimentación en alemán. Por privacidad usamos solo el primer nombre y la inicial. Los textos se tradujeron al español mexicano.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="es-MX" data-theme="light">
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
<meta property="og:locale" content="es_MX">
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
  <div class="h-badge rv">Opiniones</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">Saber más →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Opinión detallada →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">Hub Temático</div>
  <h2 class="sec-title rv d1">Todos los <em>temas de MapRaiders</em> en un solo lugar</h2>
  <div class="prose rv d2">
    <p>Aquí están las siete páginas Killer y sus siete relatos de opinión. Cada página mira a MapRaiders desde un ángulo distinto: una vez como alternativa a Pokémon GO, otra como app de búsqueda del tesoro, otra como compañero de carrera. Puedes leer cada página por separado, o irte de tema en tema.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Opiniones en detalle</div>
  <h2 class="sec-title rv d1">Lo que cuentan los probadores desde <em>perspectivas distintas</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Calificación Agregada</div>
  <h2 class="sec-title rv d1">5,0 de 5 con <em>tres opiniones verificadas de la beta</em></h2>
  <div class="prose rv d2">
    <p>Las opiniones vienen de la beta cerrada entre febrero y abril de 2026. Ron probó en Stuttgart, Vivian en Hamburgo, Aljoscha en Berlín. Los tres usaron el juego en sus propias rutas, no en un set-up artificial de prueba. Los textos están traducidos del alemán original y corresponden a personas reales.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="es-MX" data-theme="light">
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
<meta property="og:locale" content="es_MX">
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

# K1 — alternativa-pokemon-go-gratis
K1 = {
    "slug": "/es-mx/alternativa-pokemon-go-gratis.html",
    "breadcrumb": "Alternativa Pokémon GO gratis",
    "title": "Alternativa Pokémon GO gratis: sin publicidad, sin fondo saudita",
    "og_title": "Alternativa Pokémon GO gratis, 100% gratuita y sin Battle Pass",
    "meta": "Alternativa Pokémon GO gratis: MapRaiders es 100% gratuita, sin publicidad, sin Battle Pass. Territorio real para tu colonia, pago con OXXO y MercadoPago.",
    "keywords": "alternativa pokemon go gratis, alternativa pokemon go gratuita, juego gps gratis mexico, sin publicidad, sin battle pass",
    "badge": "Alternativa Pokémon GO",
    "pricing_pill": "$0 MXN gameplay. Cosmético opcional desde $39 MXN.",
    "h1_html": 'Alternativa Pokémon GO gratis: sin publicidad, <em>sin fake GPS</em>, sin fondo saudita',
    "lead": "Quien busca una alternativa a Pokémon GO sin Battle Pass, sin la locura del Remote Raid Pass y sin publicidad, suele caer en la siguiente trampa premium. MapRaiders le da la vuelta: el gameplay completo es y sigue siendo gratuito. Sin niveles, sin suscripción obligatoria, sin venta de datos. Para los cosméticos opcionales pagas con OXXO, MercadoPago o PayPal.",
    "trigger": {
        "quote": "Tu calle, tu territorio. Sin mensualidad.",
        "author": "MapRaiders, principio del juego"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "¿Por qué buscar?",
            "title": "Por qué jugadores de Pokémon GO en México buscan <em>alternativas gratuitas</em> en 2026",
            "body": """
    <p>Tres puntos de dolor maduraron el mercado mexicano entre 2024 y 2026:</p>
    <ul>
      <li><strong>Frustración con el Battle Pass.</strong> Pases de temporada con beneficios bloqueados sin pagar. Quien se pierde una temporada, pierde recompensas para siempre.</li>
      <li><strong>Polémica del Remote Raid Pass.</strong> Niantic subió precios y redujo disponibilidad. Una ola de jugadores mexicanos se fue en 2023.</li>
      <li><strong>Adquisición saudita en marzo de 2025.</strong> Niantic vendió Pokémon GO a Scopely, que es una subsidiaria del Public Investment Fund de Arabia Saudita. Desde entonces los datos de localización de millones de jugadores fluyen por la infraestructura de un fondo soberano extranjero.</li>
    </ul>
            """,
        },
        {
            "label": "¿Qué significa gratis?",
            "title": "Qué <em>&ldquo;gratis&rdquo;</em> significa realmente en MapRaiders",
            "body": "<p>Niveles transparentes, sin paywall escondido y sin bloqueo de tutorial después de diez minutos:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Nivel</th><th>Qué incluye</th><th>Precio (MX)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% del gameplay (territorios, Echos, misiones, clanes, defensa, eventos)</td><td>$0 MXN</td></tr>
      <tr><td class="feat-name">Cosmético-IAP</td><td>Diseños de marcador, colores de territorio, emblemas de clan, skins</td><td>$39 &ndash; $189 MXN</td></tr>
      <tr><td class="feat-name">MapRaiders Apoyador (Sub)</td><td>Distintivo honorario, acceso beta, carta del fundador, paquete cosmético mensual</td><td>$79 MXN / mes</td></tr>
      <tr><td class="feat-name">Apoyador Vitalicio</td><td>Cosmético coleccionista + créditos en el juego</td><td>$1,990 MXN (una vez)</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Importante:</strong> Los items cosméticos no dan ninguna ventaja en el juego. Quien no compra nada juega con mecánicas idénticas a las del Apoyador Vitalicio.</p>""",
        },
        {
            "label": "OXXO + MercadoPago",
            "title": "Pago <em>con OXXO o MercadoPago</em>, sin tarjeta internacional",
            "body": """
    <p>Los cosméticos opcionales y la suscripción Apoyador se pueden pagar con OXXO, MercadoPago, PayPal o tarjeta mexicana, sin necesidad de tarjeta de crédito internacional. OXXO es la forma más sencilla: el sistema te genera un código, lo llevas a la tienda OXXO más cercana, pagas en efectivo y el cosmético se desbloquea en minutos.</p>
    <p>Proveedores integrados: Stripe MX, MercadoPago, PayPal, dLocal. Sin recargo extra para el jugador, sin obligación de tarjeta gringa.</p>
            """,
        },
        {
            "label": "La cuestión saudita",
            "title": "La <em>cuestión Saudi-Niantic</em>: ¿qué pasa con tus pasos?",
            "body": """
    <p>En marzo de 2025, Niantic vendió su división de juegos (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) por 3,500 millones de dólares a Scopely. Scopely es una subsidiaria del Public Investment Fund (PIF) de Arabia Saudita, es decir, formalmente una entidad controlada por el estado saudita.</p>
    <p>En concreto significa lo siguiente. Los <strong>datos de localización de unos 30 millones de jugadores mensuales de Pokémon GO</strong> (dónde corren, cuándo pasean al perro, qué rutas recorren cada día) ahora pasan por la infraestructura de Scopely. Los detalles de las transferencias de datos no se han hecho públicos. Lo que sí queda claro: fuera de México no aplica una protección equivalente a la LFPDPPP frente a actores ligados a fondos soberanos.</p>
    <p>MapRaiders es una LLC de EE.UU. de <strong>propiedad privada</strong> (Scafa Investments LLC, Florida), desarrollada por un equipo independiente. Operamos servidores compatibles con LFPDPPP, no vendemos datos, no tenemos red publicitaria conectada y no estamos controlados por ningún estado.</p>
            """,
        },
    ],
    "faq": [
        {"q": "¿MapRaiders es realmente gratis para siempre?",
         "a": "Sí. Todo el gameplay principal (conquistar territorios, dejar Echos, crear misiones, formar clanes) sigue siendo gratuito para siempre. No hay sistema de niveles, Battle Pass ni suscripción obligatoria."},
        {"q": "¿Cuánto cuesta el Cosmético-IAP?",
         "a": "Los items cosméticos como diseños de marcador, colores de territorio o emblemas de clan cuestan entre $39 y $189 MXN. No dan ninguna ventaja en el juego, solo estética. Pago con OXXO, MercadoPago, PayPal o tarjeta."},
        {"q": "¿Puedo pagar con OXXO o MercadoPago?",
         "a": "Sí. OXXO y MercadoPago son las formas estándar de pago en México para cosméticos y la suscripción Apoyador. Eliges OXXO, recibes un código, pagas en efectivo en la tienda y el item se desbloquea en minutos. Sin tarjeta internacional, sin PayPal obligatorio."},
        {"q": "¿Hay publicidad en la app?",
         "a": "No. MapRaiders no tiene publicidad. No vendemos tus datos ni espacio publicitario."},
        {"q": "¿Qué significa &ldquo;sin fondo saudita&rdquo;?",
         "a": "En marzo de 2025, Niantic vendió su división de juegos (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) por 3,500 millones de dólares a Scopely, que es una subsidiaria del Public Investment Fund de Arabia Saudita. Los datos de localización de más de 30 millones de jugadores mensuales pasan ahora por la infraestructura de un fondo soberano extranjero. MapRaiders es una LLC privada de EE.UU. y no está controlada por ningún estado."},
    ],
    "internal_links": [
        ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
        ("/es-mx/juego-de-territorio.html", "Juego de territorio real"),
        ("/es-mx/pokemon-go-sin-fake-gps.html", "Pokémon GO sin fake GPS"),
        ("/es-mx/juego-de-colonia.html", "Juego de colonia"),
        ("/es-mx/alternativa-pokemon-go-vale-la-pena.html", "¿Vale la pena? Opiniones"),
        ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
    ],
}

# K2 — juego-de-gps  (Volume-King 5-8K/mes)
K2 = {
    "slug": "/es-mx/juego-de-gps.html",
    "breadcrumb": "Juego de GPS",
    "title": "Juego de GPS 2026: territorio real, sin fake GPS",
    "og_title": "Juego de GPS 2026: el GPS MMO honesto y gratuito",
    "meta": "Mejor juego de GPS 2026: MapRaiders es el GPS MMO con territorio real, sin Niantic, sin Saudi, sin trampa. Conquista tu colonia de verdad.",
    "keywords": "juego de gps, juego de gps 2026, mejor juego de gps mexico, gps mmo, juego gps android, location based game",
    "badge": "GPS MMO",
    "pricing_pill": "Free Forever. LFPDPPP compatible. OXXO integrado.",
    "h1_html": 'Juego de GPS: <em>conquista tu colonia</em> de verdad',
    "lead": "Un juego de GPS debería ser más que puntos efímeros en un mapa. MapRaiders combina GPS, captura persistente de territorio y un sistema de defensa que permite la conquista real. Pasas por una calle y es tuya, mientras la defiendas. Sin fake GPS, sin AR drenando batería, sin publicidad.",
    "trigger": {
        "quote": "Conquista tu colonia.",
        "author": "MapRaiders, principio de marca"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "¿Qué es?",
            "title": "Qué es un <em>juego de GPS</em>",
            "body": """
    <p>Un <strong>juego de GPS (Location-Based Game)</strong> usa la posición geográfica del dispositivo como mecánica central. A diferencia de los juegos AR, que además necesitan la cámara, un juego puro de GPS funciona solo con el mapa. Eso ahorra batería del celular y protege la privacidad.</p>
    <p>MapRaiders es un <strong>GPS MMO</strong>: miles de jugadores se mueven al mismo tiempo en el mismo mapa, compiten en tiempo real y comparten un sistema unificado de territorios. Sin AR, sin cámara, sin lentes VR.</p>
            """,
        },
        {
            "label": "Los 7 mejores",
            "title": "Los 7 mejores juegos de GPS comparados, y por qué <em>MapRaiders</em> es el único con territorio real",
            "body": "<p>La mayoría de listas mete junto apps que solo comparten una característica con Pokémon GO. Una versión más honesta:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>App</th><th>Operadora</th><th>Sin publicidad</th><th>Territorio real</th><th>Confianza LFPDPPP</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Gimnasios pasajeros</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Ingress Prime</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Portales, no persistente</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="check">✓</td><td class="cross">Caches, no tierra</td><td>Premium-paywall</td></tr>
      <tr><td class="feat-name">Monster Hunter Now</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Geowars</td><td>Indie</td><td>Mixto</td><td>Limitado</td><td>Variable</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓</td><td class="check">✓ persistente</td><td class="check">LFPDPPP, independiente</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Diferencial",
            "title": "Lo que hace a MapRaiders <em>distinto</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territorios persistentes</h3><p>Al conquistar una calle, es tuya, hasta que alguien la recapture o el decay actúe. Sin gimnasios pasajeros.</p></div>
    <div class="feat-card rv d1"><h3>Echos en lugar de AR</h3><p>Deja Echos de audio, foto o video en lugares reales. Otros jugadores los descubren. Sin AR drenando batería.</p></div>
    <div class="feat-card rv d2"><h3>Siete mini-juegos de defensa</h3><p>En ataques: gato, piedra-papel-tijera o mini-ajedrez. Cuenta más la estrategia que el tiempo invertido.</p></div>
    <div class="feat-card rv d3"><h3>Clanes orgánicos</h3><p>Los clanes salen de la colonia, no de servidores Discord. Quien corre la misma calle se vuelve aliado.</p></div>
    <div class="feat-card rv d4"><h3>Batería ahorrada</h3><p>Solo GPS, sin cámara, sin AR. En rutas largas el celular dura unas cuatro veces más que con Pokémon GO.</p></div>
  </div>""",
        },
        {
            "label": "Casos de uso MX",
            "title": "Casos de uso <em>mexicanos</em>",
            "body": "<p>MapRaiders se adapta a cuatro perfiles principales en México:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Pasear al perro</h3><p>En México hay más de 20 millones de perros. La vuelta diaria se vuelve mantenimiento de territorio.</p></div>
    <div class="feat-card rv d1"><h3>Carrera matutina</h3><p>Cardio con un objetivo concreto: defender territorio o reconquistarlo. Strava más juego.</p></div>
    <div class="feat-card rv d2"><h3>Día de Muertos</h3><p>Marca las ofrendas comunitarias de tu colonia. Eventos de temporada MX, tratados con el respeto que la tradición merece.</p></div>
    <div class="feat-card rv d3"><h3>Actividad familiar</h3><p>Búsqueda del tesoro con Echos, sin AR ni publicidad. Para niños y adultos.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "¿Qué es un juego de GPS?",
         "a": "Un juego de GPS (Location-Based Game) usa tu posición GPS para activar mecánicas de juego. MapRaiders ata territorios, Echos y misiones a lugares reales: tu ciudad se vuelve el campo de juego."},
        {"q": "¿Necesito Realidad Aumentada?",
         "a": "No. MapRaiders está construido a propósito sin AR. Usa solo GPS y el mapa. Eso ahorra batería y cuida tu privacidad: sin cámara, sin captura facial."},
        {"q": "¿Funciona en cualquier ciudad de México?",
         "a": "Sí, en cualquier lugar con datos OpenStreetMap. En centros urbanos como CDMX, Guadalajara y Monterrey la densidad de jugadores es alta. En provincia hay menos competencia pero territorios más grandes."},
        {"q": "¿Mis datos de localización se venden?",
         "a": "No. Somos compatibles con la LFPDPPP, sin SDK de publicidad, sin venta de datos, sin dueño estatal. A diferencia de Pokémon GO, que desde marzo de 2025 pertenece al grupo Scopely, una subsidiaria del fondo soberano saudita."},
        {"q": "¿Cuánto cuesta?",
         "a": "El gameplay es gratuito. Los cosméticos cuestan entre $39 y $189 MXN y no dan ventajas en el juego, solo estética. Pago con OXXO, MercadoPago, PayPal o tarjeta."},
    ],
    "internal_links": [
        ("/es-mx/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/es-mx/juego-de-territorio.html", "Juego de territorio real"),
        ("/es-mx/pokemon-go-sin-fake-gps.html", "Pokémon GO sin fake GPS"),
        ("/es-mx/app-caminata-con-juego.html", "App de caminata con juego"),
        ("/es-mx/busqueda-del-tesoro-app.html", "Búsqueda del tesoro app"),
        ("/es-mx/juego-de-colonia.html", "Juego de colonia"),
        ("/es-mx/juego-de-gps-opiniones.html", "Opiniones del juego de GPS"),
        ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
    ],
}

# K3 — juego-de-territorio
K3 = {
    "slug": "/es-mx/juego-de-territorio.html",
    "breadcrumb": "Juego de territorio",
    "title": "Juego de territorio: la app donde la tierra es de verdad tuya",
    "og_title": "Juego de territorio: donde la tierra es realmente tuya",
    "meta": "¿Qué es juego de territorio? MapRaiders es el único GPS MMO con posesión real y persistente de mapas. Sin fake GPS, sin suscripción, AR-free.",
    "keywords": "juego de territorio, juego de territorios, conquistar territorio app, territory game mexico, juego gps territorio",
    "badge": "Juego de Territorio",
    "pricing_pill": "Gratuito. Cosmético opcional.",
    "h1_html": 'Juego de territorio: la app donde la <em>tierra es realmente tuya</em>',
    "lead": "Un juego de territorio debería ser más que un punto en un mapa que desaparece en cinco minutos. MapRaiders combina GPS, captura persistente de área y un sistema de defensa que permite una conquista real. Caminas por una calle y es tuya, mientras la defiendas.",
    "trigger": {
        "quote": "Tu calle, tu territorio. Sin mensualidad.",
        "author": "MapRaiders, principio de marca"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Definición",
            "title": "Qué hace un <em>juego de territorio de verdad</em>",
            "body": """
    <p><strong>Un juego de territorio</strong> es un juego donde los jugadores poseen áreas reclamadas en el mapa de forma persistente, las defienden y las expanden. A diferencia de los juegos de captura (gimnasio, portal), la posesión sigue siendo <strong>persistente</strong> incluso cuando el jugador está offline.</p>
    <p>Las cuatro mecánicas que definen un juego de territorio real:</p>
    <ul>
      <li><strong>Persistencia.</strong> Las áreas conquistadas quedan asignadas al jugador o clan hasta ser tomadas activamente.</li>
      <li><strong>Decay.</strong> Los territorios inactivos se encogen con el tiempo. Nadie bloquea permanentemente sin jugar activamente.</li>
      <li><strong>Defensa.</strong> En el ataque decide un mini-juego entre los dos jugadores, no una comparación automática de stats.</li>
      <li><strong>Transferencias de clan.</strong> Los territorios pueden pasarse a aliados o al clan, lo que abre profundidad económica.</li>
    </ul>
            """,
        },
        {
            "label": "Sistema MapRaiders",
            "title": "El <em>sistema de territorios</em> de MapRaiders en detalle",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Reclamar</h3><p>Camina, pasea al perro o agarra la bici por una calle. La huella GPS genera el territorio a tu nombre, visible como polígono en el mapa.</p></div>
    <div class="feat-card rv d1"><h3>Decay Engine</h3><p>Quien no recorre seguido un territorio lo ve encogerse unos puntos por día. La actividad mantiene la tierra, no el dinero.</p></div>
    <div class="feat-card rv d2"><h3>Mini-juegos de defensa</h3><p>Siete mini-juegos distintos deciden los ataques: gato, piedra-papel-tijera, mini-ajedrez. La estrategia cuenta más que el tiempo de juego.</p></div>
    <div class="feat-card rv d3"><h3>Territorios de clan</h3><p>Varios jugadores pueden mantener un territorio juntos. Las áreas de clan son más robustas: un solo atacante no basta para romperlas.</p></div>
  </div>""",
        },
        {
            "label": "Por qué otros no lo son",
            "title": "Por qué Pokémon GO e Ingress <em>no son</em> juegos de territorio de verdad",
            "body": """
    <p><strong>Las capturas de gimnasio de Pokémon GO</strong> son pasajeras. Quien mantiene un récord por algunas horas gana monedas, pero el territorio mismo no se puede entender como posesión de tierra. El gimnasio es un punto, no un área.</p>
    <p><strong>Los portales de Ingress</strong> funcionan parecido: puntos que se conectan por enlaces formando triángulos. El juego conoce campos entre portales, pero no una posesión persistente de tierra. Quien pasa una semana sin abrir la app no pierde &ldquo;su colonia&rdquo;, porque nunca le fue asignada de verdad.</p>
    <p>MapRaiders ataca justo ese punto. El <strong>territorio es el recurso del juego</strong>, no el punto sobre él. Ganas tierra, pierdes tierra, transfieres tierra. Como en un juego espacial real.</p>
            """,
        },
    ],
    "faq": [
        {"q": "¿Cómo funciona el sistema de territorios en MapRaiders?",
         "a": "Caminas físicamente por calles y reclamas áreas GPS. Esos territorios aparecen en el mapa en vivo y son tuyos mientras ningún otro jugador pase por ahí y te desafíe. Si defiendes con éxito, el área sigue siendo tuya."},
        {"q": "¿Puedo perder mi territorio?",
         "a": "Sí. El sistema de Decay hace que las áreas inactivas se encojan día con día. Quien sigue activo y recorre regularmente su área la mantiene. Quien para, pierde. Así el mapa se queda vivo."},
        {"q": "¿Qué pasa en un ataque territorial?",
         "a": "El atacante necesita llegar físicamente a tu territorio. Ahí empieza un mini-juego interactivo entre defensor y atacante. Quien gane el mini-juego decide el destino del área."},
        {"q": "¿Existe sistema de territorios de clan?",
         "a": "Sí. Los clanes en MapRaiders surgen orgánicamente y pueden reclamar territorios juntos. Las áreas de clan son más fuertes y hacen falta varios atacantes para romperlas. El trabajo en equipo vale la pena."},
        {"q": "¿El juego de territorio cobra algo?",
         "a": "No. Todo el gameplay de territorio es gratuito. Hay items cosméticos opcionales (entre $39 y $189 MXN) para diseños de marcador y colores de territorio, sin ventajas en el juego. Pago con OXXO, MercadoPago, PayPal o tarjeta."},
    ],
    "internal_links": [
        ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
        ("/es-mx/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/es-mx/juego-de-colonia.html", "Juego de colonia"),
        ("/es-mx/juego-de-territorio-opiniones.html", "Opiniones juego de territorio"),
        ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
    ],
}

# K4 — pokemon-go-sin-fake-gps  (MX-Anti-Cheat)
K4 = {
    "slug": "/es-mx/pokemon-go-sin-fake-gps.html",
    "breadcrumb": "Pokémon GO sin fake GPS",
    "title": "Pokémon GO sin fake GPS: alternativa honesta para MX",
    "og_title": "Pokémon GO sin fake GPS: donde caminar es el juego",
    "meta": "¿Pokémon GO sin fake GPS? MapRaiders es la alternativa honesta: sin cheat, sin PGSharp, sin MocPOGO. Aquí caminar es el juego, no hacer trampa.",
    "keywords": "pokemon go sin fake gps, alternativa pokemon go sin cheat, sin pgsharp, sin mocpogo, sin imyfone, juego gps honesto",
    "badge": "Anti-Cheat · MX",
    "pricing_pill": "Sin fake GPS, sin PGSharp, sin MocPOGO.",
    "h1_html": 'Pokémon GO sin fake GPS: donde <em>caminar es el juego</em>',
    "lead": "Quien juega Pokémon GO en México conoce el problema. PokéParadas concentradas solo en los centros, pocos spawns en la colonia, raids sin nadie. La salida de muchos terminó siendo el fake GPS: PGSharp, MocPOGO, iMyFone. Pero hacer trampa cansa, te arriesgas a un baneo y le quita el sentido al juego. MapRaiders elimina la necesidad de fake GPS porque el territorio está donde haya señal GPS. Aquí caminar es el juego.",
    "trigger": {
        "quote": "Sin fake GPS. Aquí caminar es el juego.",
        "author": "MapRaiders, principio anti-cheat"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "El problema",
            "title": "Por qué jugadores de Pokémon GO en México <em>buscan fake GPS</em>",
            "body": """
    <p>El mercado negro mexicano de cheats para Pokémon GO es grande y activo, no por flojera de los jugadores sino por problemas estructurales del juego en México:</p>
    <ul>
      <li><strong>Densidad desigual de PokéStops.</strong> CDMX tiene más de 100,000 puntos marcados; en colonias periféricas, ciudades pequeñas y zonas rurales faltan puntos para jugar.</li>
      <li><strong>Raids sin participantes.</strong> En horario laboral las raids quedan vacías, sin equipo y sin captura. El fake GPS lleva al jugador virtualmente al centro donde hay gente.</li>
      <li><strong>Eventos centralizados.</strong> Tour Pokémon GO 2026, LATAM Championships en CDMX. Quien vive lejos queda fuera, o se va al fake GPS.</li>
      <li><strong>Costos acumulados.</strong> Battle Pass, Remote Raid Pass, incubadoras. Hacer trampa se vuelve un atajo financiero tentador.</li>
    </ul>
            """,
        },
        {
            "label": "Por qué MapRaiders elimina la necesidad",
            "title": "Por qué MapRaiders <em>elimina</em> la necesidad de fake GPS",
            "body": """
    <p>Cuatro cambios estructurales hacen inútil al fake GPS en MapRaiders:</p>
    <ul>
      <li><strong>El territorio está en cualquier lugar.</strong> No depende de puntos predefinidos. Cada calle, cada cuadra y cada parque puede ser territorio.</li>
      <li><strong>La persistencia supera a la presencia.</strong> No necesitas estar &ldquo;donde está la bola&rdquo;. Quien corre todas las mañanas la misma calle, esa calle es suya. La defensa activa pesa más que el spawn farming.</li>
      <li><strong>Los Echos abren cualquier rincón.</strong> Dejas Echos donde quieras y otros jugadores los descubren. Tus calles se vuelven destino, no periferia.</li>
      <li><strong>Los mini-juegos de defensa ganan a la presencia horaria.</strong> No necesitas &ldquo;estar ahí ahora&rdquo;: cuando alguien ataca tu territorio, juegas el mini-juego defensivo desde donde estés.</li>
    </ul>
            """,
        },
        {
            "label": "Lista de cheats",
            "title": "Lista de cheats y por qué son <em>innecesarios</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>Cheat / App</th><th>Función</th><th>Riesgo en Pokémon GO</th><th>Necesario en MapRaiders</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">PGSharp</td><td>Fake GPS Android</td><td>Baneo permanente</td><td class="check">No</td></tr>
      <tr><td class="feat-name">MocPOGO</td><td>Spoofing PC + Android</td><td>Baneo permanente</td><td class="check">No</td></tr>
      <tr><td class="feat-name">iMyFone AnyTo</td><td>Fake GPS iOS</td><td>Shadowban / baneo</td><td class="check">No</td></tr>
      <tr><td class="feat-name">iSpoofer</td><td>Fake GPS jailbreak</td><td>Baneo permanente</td><td class="check">No</td></tr>
      <tr><td class="feat-name">Joystick GPS apps</td><td>Movimiento simulado</td><td>Baneo + riesgo LFPDPPP</td><td class="check">No</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Resumen:</strong> En MapRaiders, el juego respeta tu lugar. No exige que finjas estar en CDMX. Tu calle, tus conquistas. Honesto.</p>""",
        },
    ],
    "faq": [
        {"q": "¿MapRaiders detecta fake GPS?",
         "a": "Sí. Detectamos fake GPS, joystick simulado y velocidades imposibles. La trampa se detecta y lleva a baneo. Pero la primera defensa es el propio diseño: no hay razón para usar fake GPS porque el juego respeta tu localización real."},
        {"q": "¿Por qué no necesito PGSharp ni MocPOGO?",
         "a": "Porque MapRaiders no depende de PokéStops centralizados ni de raids agendadas. Cada calle puede ser territorio, cada cuadra se vuelve tuya si pasas por ahí seguido. La periferia deja de ser desventaja y se vuelve ventaja (menos competencia)."},
        {"q": "¿Y si vivo en una ciudad pequeña?",
         "a": "La ciudad pequeña se vuelve tu ventaja en MapRaiders. Menos jugadores, territorios más grandes, defensa más fácil. En Pokémon GO la provincia se siente desierta; aquí se siente fortaleza."},
        {"q": "¿Puedo jugar desde casa, sin salir?",
         "a": "No. MapRaiders exige movimiento real. Aquí caminar es el juego. Pero no necesitas caminar kilómetros: empiezas con la cuadra de casa y expandes al ritmo natural del día (pasear al perro, ir al trabajo a pie, correr)."},
        {"q": "¿Es 100% gratuito?",
         "a": "Sí. Gameplay completo gratis. Los cosméticos opcionales (entre $39 y $189 MXN, también con OXXO) no dan ventaja competitiva."},
    ],
    "internal_links": [
        ("/es-mx/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
        ("/es-mx/juego-de-territorio.html", "Juego de territorio real"),
        ("/es-mx/pokemon-go-sin-fake-gps-opiniones.html", "Opiniones"),
        ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
    ],
}

# K5 — app-caminata-con-juego
K5 = {
    "slug": "/es-mx/app-caminata-con-juego.html",
    "breadcrumb": "App de caminata con juego",
    "title": "App de caminata con juego: Strava más territorio",
    "og_title": "App de caminata con juego: cardio, juego y salud",
    "meta": "¿App de caminata con juego? MapRaiders convierte cada caminata en conquista de territorio. Cardio, juego y salud para toda la familia, gratis con OXXO.",
    "keywords": "app de caminata, app caminata con juego, caminar con juego, juego para caminar, app cardio gps, strava territorio",
    "badge": "Cardio + Juego",
    "pricing_pill": "Free Forever. Hasta 4× menos batería que Pokémon GO.",
    "h1_html": 'App de caminata con juego: cuando <em>cada paso</em> conquista territorio',
    "lead": "Las apps de caminata dan estadísticas. Los juegos de caminata estilo Pokémon GO dan colección. Lo que casi nadie hace es convertir tu camino real en tierra real. MapRaiders sí: cada paso forma territorio, cada vuelta lo defiende. Cardio con consecuencia, familia junta, salud de verdad.",
    "trigger": {
        "quote": "Salgo a correr todas las mañanas, eso ya lo hacía. Pero ahora también defiendo algo. Mi vuelta por el Alster es mía y quiero que siga así.",
        "author": "Vivian N., corredora de la región de Hamburgo (beta cerrada)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "El problema",
            "title": "Por qué las <em>apps de caminata</em> tradicionales no bastan",
            "body": """
    <p>Strava, Nike Run Club y Adidas Running miden tiempo, distancia y ritmo. A muchos mexicanos les faltan tres cosas:</p>
    <ul>
      <li><strong>Sin elemento de juego.</strong> Quien no persigue récords personales pierde motivación en cuatro semanas.</li>
      <li><strong>Presión de performance.</strong> Las leaderboards públicas desmotivan más de lo que ayudan.</li>
      <li><strong>Suscripción a la fuerza.</strong> Strava Premium cuesta $109 MXN al mes por mapas de calor y comparaciones de rutas que quedan inútiles en el plan gratuito.</li>
    </ul>
            """,
        },
        {
            "label": "La solución",
            "title": "Cómo MapRaiders <em>cambia tu rutina</em> de caminata",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Mantener territorio</h3><p>Cada ruta defiende tierra. Quien para tres días ve actuar al decay. Es un incentivo natural para volver a salir.</p></div>
    <div class="feat-card rv d1"><h3>Contador de Decay</h3><p>El valor de Decay muestra: &ldquo;Si no sales hoy, tu colonia se encoge X%&rdquo;. Sin culpa, solo realidad física.</p></div>
    <div class="feat-card rv d2"><h3>Defensa de clan mientras corres</h3><p>Durante la corrida, las push notifications avisan cuando atacan el territorio del clan. No corres solo, corres en grupo.</p></div>
    <div class="feat-card rv d3"><h3>Recompensa vía Echo</h3><p>Te encuentras Echos de audio al pasar. Otros jugadores cuentan historias de la calle, sin publicidad ni influencers.</p></div>
  </div>""",
        },
        {
            "label": "Strava complemento",
            "title": "MapRaiders <em>complementa</em> a Strava, no la reemplaza",
            "body": """
    <p>MapRaiders no compite con Strava en métricas de performance. Puedes correr ambas apps al mismo tiempo: usan el mismo sensor GPS sin conflicto. Lo que Strava no da: territorio real y defensa social. Lo que MapRaiders no da: análisis detallado de pace splits y zonas cardíacas.</p>
    <p>La combinación ideal es <strong>Strava para análisis técnico y MapRaiders para motivación diaria y territorio</strong>. Corre las dos, sin dolor de cabeza.</p>
            """,
        },
        {
            "label": "50+ longevidad",
            "title": "Caminata para <em>50+ años</em>: longevidad MX",
            "body": """
    <p>México tiene más de 17 millones de personas con 60 o más años. La caminata es la actividad física que más recomiendan los geriatras, pero suele faltar motivación. MapRaiders ayuda sin AR (que confunde) y sin competencia agresiva (que aleja):</p>
    <ul>
      <li><strong>Ritmo propio.</strong> Sin mínimo de velocidad. Caminar tranquilo, ir con bastón o con un amigo: todo cuenta para territorio.</li>
      <li><strong>La misma calle todos los días funciona.</strong> La persistencia supera a la distancia. Quien repite, mantiene.</li>
      <li><strong>Comunidad de colonia.</strong> Clanes orgánicos con vecinos. Sin Discord ni chat tóxico.</li>
      <li><strong>Compatible con LFPDPPP.</strong> Pensado para adultos mayores preocupados por la privacidad: sin publicidad dirigida, sin venta de localización.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "¿Cuánta batería gasta el celular?",
         "a": "En una caminata de una hora, normalmente entre 15% y 25% de batería (frente a ~50% en Pokémon GO con AR). Los valores varían según el celular y el brillo de la pantalla."},
        {"q": "¿Funciona con Strava o Nike Run Club?",
         "a": "Por ahora no hay integración directa. Puedes correr ambas apps al mismo tiempo: usan el mismo sensor GPS sin conflicto. La integración con Strava está planeada para Q4 2026."},
        {"q": "¿La caminata lenta también cuenta?",
         "a": "Sí. No hay velocidad mínima. Caminar tranquilo, paseo, walking, todo forma territorio mientras haya movimiento físico real (sin auto-cheating)."},
        {"q": "¿La puede usar un adulto mayor?",
         "a": "Sí, está pensada para todas las edades. Sin AR, sin ruido, sin presión de pace. Letras grandes, contraste alto, controles simples."},
        {"q": "¿Cuántos datos móviles consume?",
         "a": "Moderado. Sin live-video y sin API pesada. Una caminata de una hora usa típicamente entre 5 y 15 MB."},
    ],
    "internal_links": [
        ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
        ("/es-mx/juego-de-territorio.html", "Juego de territorio real"),
        ("/es-mx/juego-de-colonia.html", "Juego de colonia"),
        ("/es-mx/app-caminata-vale-la-pena.html", "¿Vale la pena? Opiniones"),
        ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
    ],
}

# K6 — busqueda-del-tesoro-app
K6 = {
    "slug": "/es-mx/busqueda-del-tesoro-app.html",
    "breadcrumb": "Búsqueda del tesoro app",
    "title": "Búsqueda del tesoro app 2026: ciudad entera en vivo, gratis",
    "og_title": "Búsqueda del tesoro app: ciudad entera de Echos escondidos",
    "meta": "Búsqueda del tesoro app 2026: en vivo, ciudad entera, sin comprar tour, sin publicidad. MapRaiders convierte tu ciudad en búsqueda del tesoro abierta. Familia, amigos.",
    "keywords": "busqueda del tesoro app, busqueda tesoro celular, app busqueda tesoro, busqueda tesoro mexico, geocaching alternativa, busqueda tesoro familia",
    "badge": "Búsqueda del Tesoro",
    "pricing_pill": "Free Forever. Sin comprar tour. Ciudad entera.",
    "h1_html": 'Búsqueda del tesoro app: una <em>ciudad entera de Echos</em> escondidos',
    "lead": "Las apps tradicionales de búsqueda del tesoro como Geocaching exigen suscripción premium y tours pre-definidos. MapRaiders le da la vuelta: los Echos ya están esparcidos por la ciudad entera. Sigues rastros de otros jugadores o dejas los tuyos. En vivo, gratuito, sin comprar tour, sin preparación.",
    "trigger": {
        "quote": "Dejas un Echo de audio en la entrada de un edificio y tres días después lo encontró alguien que no conoces. Para ser un juego, se siente raramente íntimo.",
        "author": "Aljoscha P., explorador urbano de la región de Berlín (beta cerrada)"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "Criterios",
            "title": "Qué debería tener una <em>app de búsqueda del tesoro moderna</em>",
            "body": """
    <p>Tres criterios separan a las apps de búsqueda del tesoro modernas de las soluciones de papel impreso:</p>
    <ul>
      <li><strong>En vivo.</strong> Las pistas aparecen en tiempo real, no solo en tours pre-fabricados.</li>
      <li><strong>Social.</strong> Los jugadores dejan pistas unos para otros, en lugar de solo seguirlas.</li>
      <li><strong>Sin barrera premium.</strong> Padres e hijos entran al instante, sin pagar tour de $300 MXN.</li>
    </ul>
            """,
        },
        {
            "label": "Comparación",
            "title": "Apps de búsqueda del tesoro <em>comparadas</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>Precio</th><th>Preparación</th><th>¿En vivo?</th><th>Loop de juego</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Geocaching</td><td>Sub Premium ~$150 MXN/mes</td><td>Baja: encontrar caches</td><td class="cross">Asíncrono</td><td>Coleccionar</td></tr>
      <tr><td class="feat-name">Actionbound</td><td>Tours / Sub</td><td>Alta: montar tour</td><td class="cross">✗</td><td>Por-tour</td></tr>
      <tr><td class="feat-name">Munzee</td><td>Premium-Sub</td><td>Media</td><td class="cross">Asíncrono</td><td>Escanear códigos</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">$0 MXN</td><td class="check">Cero</td><td class="check">En vivo</td><td>Echos + Misiones + Territorio</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Echos",
            "title": "Cómo MapRaiders <em>repiensa</em> la búsqueda del tesoro",
            "body": """
    <p>En lugar de un tour lineal de la estación 1 a la 10, MapRaiders crea una <strong>búsqueda del tesoro espacial abierta</strong>: la ciudad entera es el playground.</p>
    <ul>
      <li><strong>Dejar Echos.</strong> Deja un Echo de audio, foto o video en un lugar. Otros jugadores lo descubren al pasar.</li>
      <li><strong>Encontrar Echos.</strong> Mira en el mapa dónde están los Echos. Sigue los rastros, encuentra secretos, escucha historias.</li>
      <li><strong>Crear misiones.</strong> Pones una pequeña tarea en un lugar (&ldquo;Toma foto de la puerta roja de allá&rdquo;) y otros jugadores la cumplen.</li>
      <li><strong>Capa de territorio.</strong> Quien recorre seguido una ruta de búsqueda del tesoro la conquista como territorio. Los rastros se vuelven tierra.</li>
    </ul>
            """,
        },
        {
            "label": "Niños",
            "title": "Búsqueda del tesoro app para <em>niños y familia</em>",
            "body": """
    <p>La búsqueda del tesoro es cultura mexicana de infancia: pistas con gis, rastro de hojas, escondite final con dulce. MapRaiders lo trae a la era del smartphone, sin dejar a los niños solos en la pantalla:</p>
    <ul>
      <li><strong>Actividad padres-hijos.</strong> Los papás dejan Echos de audio en una ruta planeada y los niños siguen los rastros: movimiento analógico, pistas digitales.</li>
      <li><strong>Pantalla mínima, mundo máximo.</strong> La app guía en el mapa; la vivencia ocurre en la calle.</li>
      <li><strong>Compatible con LFPDPPP para niños.</strong> Sin tracker de publicidad personalizada, sin venta de datos, sin chat in-app sin aprobación de los padres.</li>
      <li><strong>Modo familia.</strong> Eventos privados de Día de Muertos, posadas o Reyes solo para el grupo familiar, tratados con respeto a la tradición.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "¿MapRaiders es apropiado para niños?",
         "a": "Sí, a partir de nueve años con acompañamiento de los padres. La app es compatible con LFPDPPP, no tiene publicidad y no recolecta datos personales de niños. Los padres pueden activar un modo familia."},
        {"q": "¿Cuánta preparación necesito para una búsqueda con niños?",
         "a": "Cero. A diferencia de Actionbound o Munzee, no necesitas comprar tour ni preparar estaciones. Los Echos ya están esparcidos por la ciudad: basta con seguir los rastros de otros jugadores o dejar los tuyos."},
        {"q": "¿La app de búsqueda del tesoro cobra algo?",
         "a": "No. Las funciones de búsqueda del tesoro (dejar Echos, encontrar Echos, crear misiones) son totalmente gratuitas. Hay cosméticos opcionales desde $39 MXN, sin ventaja en el juego. Pago con OXXO, MercadoPago, PayPal o tarjeta."},
        {"q": "¿Funciona en ciudades pequeñas?",
         "a": "Sí. Incluso en ciudades pequeñas o colonias puedes dejar Echos y crear misiones. En centros grandes vas a encontrar más rastros de otros jugadores; en provincia tu tour tiene más espacio propio."},
        {"q": "¿La app está en español?",
         "a": "Sí. MapRaiders está totalmente localizada en español mexicano: menús, sistema de Echos, pistas y soporte. Sin traducciones de español de España."},
    ],
    "internal_links": [
        ("/es-mx/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
        ("/es-mx/juego-de-territorio.html", "Juego de territorio real"),
        ("/es-mx/busqueda-del-tesoro-app-opiniones.html", "Opiniones búsqueda del tesoro app"),
        ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
    ],
}

# K7 — juego-de-colonia (MX-EXKLUSIV!)
K7 = {
    "slug": "/es-mx/juego-de-colonia.html",
    "breadcrumb": "Juego de colonia",
    "title": "Juego de colonia: conoce a tus vecinos jugando",
    "og_title": "Juego de colonia: tu colonia, tu mapa social",
    "meta": "Juego de colonia: MapRaiders convierte tu colonia en mapa social. Conoce vecinos, marca ofrendas, conquista calles. Sin Facebook, sin algoritmo. MX-exclusivo.",
    "keywords": "juego de colonia, juego colonia mexico, app colonia mexicana, comunidad colonia app, juego vecinos colonia, mapa social colonia",
    "badge": "Juego de Colonia · MX-Exclusivo",
    "pricing_pill": "Free Forever. MX-exclusivo. WhatsApp nativo.",
    "h1_html": 'Juego de colonia: <em>conoce a tus vecinos</em> jugando',
    "lead": "Colonia es palabra de México. No es vecindario, no es barrio, no es neighborhood. Es la unidad cultural y geográfica donde la gente vive, camina, pasea al perro, va a la tortillería. MapRaiders convierte tu colonia en mapa social vivo: cada calle conquistada, cada Echo dejado, cada misión creada. Sin Facebook, sin algoritmo, sin publicidad. Tu colonia, tu cancha de casa.",
    "trigger": {
        "quote": "Conquista tu colonia.",
        "author": "MapRaiders, principio de marca MX"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "&ldquo;Colonia&rdquo; es México",
            "title": "Por qué <em>&ldquo;colonia&rdquo;</em> es la palabra clave de México",
            "body": """
    <p>En España dicen &ldquo;barrio&rdquo;. En Argentina, &ldquo;barrio&rdquo;. En Estados Unidos, &ldquo;neighborhood&rdquo;. En México la palabra que define el territorio cotidiano es <strong>colonia</strong>, y solo colonia. La Colonia Roma, la Condesa, los Doctores, Del Valle, Polanco. Tu domicilio en el INE empieza con tu colonia.</p>
    <p>Una colonia mexicana es más que una calle. Es identidad, es la fonda de la esquina, son los perros conocidos, es la tortillería favorita, es la Sra. Lupita que abre el changarro a las 7. Y eso es justamente lo que MapRaiders convierte en mecánica de juego: el territorio cotidiano se vuelve mapa social vivo.</p>
            """,
        },
        {
            "label": "Comunidad de colonia",
            "title": "Comunidad de colonia <em>sin Facebook</em>",
            "body": """
    <p>Los grupos de Facebook de colonia suelen ser tóxicos: algoritmo opaco, posts de marketing disfrazados, peleas políticas, anuncios de bienes raíces. Los grupos de WhatsApp de la colonia ayudan, pero les falta una capa visual del territorio. MapRaiders junta las dos cosas:</p>
    <ul>
      <li><strong>Reconocimiento espacial.</strong> Ves en el mapa quién pasea por las mismas calles que tú. Sin algoritmo y sin sponsored content.</li>
      <li><strong>Echos de colonia.</strong> Tu vecino del segundo piso deja un Echo de audio: &ldquo;Aquí pasa el camión de la basura los martes a las 7&rdquo;. Tú lo escuchas al pasar. Sabiduría vecinal sin chat infinito.</li>
      <li><strong>Clanes orgánicos.</strong> Quien recorre las mismas calles que tú es candidato natural a clan. Sin invitaciones, sin políticas, solo geografía compartida.</li>
      <li><strong>Defensa colectiva.</strong> Cuando alguien de fuera intenta tomar tu calle, todos los vecinos del mismo clan reciben aviso. Solidaridad de colonia, gamificada.</li>
    </ul>
            """,
        },
        {
            "label": "WhatsApp nativo",
            "title": "<em>WhatsApp-Sharing</em> en cada acción",
            "body": """
    <p>WhatsApp tiene más del 95% de penetración en México, más que Instagram, más que Facebook, más que cualquier otra red social. MapRaiders se construyó pensando en eso:</p>
    <ul>
      <li><strong>Compartir territorio.</strong> ¿Conquistaste tu calle? Mandas el polígono al chat de la familia con un tap.</li>
      <li><strong>Compartir Echo.</strong> ¿Dejaste un Echo en el parque? El link va directo a tu grupo de WhatsApp.</li>
      <li><strong>Invitar vecinos.</strong> Click en &ldquo;invitar vecinos&rdquo; y te arma un mensaje listo para enviar al grupo de WhatsApp de la colonia.</li>
      <li><strong>Sin red social paralela.</strong> Toda la comunicación del juego puede pasar por el WhatsApp que ya usas, sin descargar otra app de mensajería.</li>
    </ul>
            """,
        },
        {
            "label": "Día de Muertos",
            "title": "Día de Muertos: <em>marca las ofrendas</em> de tu colonia",
            "body": """
    <p>Día de Muertos no es Halloween. Es una de las tradiciones más profundas y respetadas de México, reconocida por la UNESCO como Patrimonio Cultural Inmaterial. MapRaiders trata el evento con el respeto que merece, no como &ldquo;skin temporal&rdquo;:</p>
    <ul>
      <li><strong>Mapa de ofrendas.</strong> Los usuarios marcan ofrendas comunitarias visibles en su colonia. Otros vecinos las visitan y dejan Echos respetuosos.</li>
      <li><strong>Sin gamificación irrespetuosa.</strong> Aquí nadie &ldquo;colecciona calaveras&rdquo; ni &ldquo;atrapa a la Catrina&rdquo;. Solo visibilidad y reconocimiento de la tradición.</li>
      <li><strong>Eventos familiares privados.</strong> El Modo Familia permite eventos de altar privado, visibles solo para el grupo familiar.</li>
      <li><strong>Patrocinio cultural.</strong> En noviembre, parte de los ingresos por cosméticos se dona a iniciativas culturales mexicanas, con transparencia pública.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "¿Por qué &ldquo;colonia&rdquo; y no &ldquo;barrio&rdquo;?",
         "a": "Porque colonia es la palabra mexicana correcta. En España dicen barrio, en Argentina barrio, pero en México la unidad geográfica básica es la colonia. Tu INE, tu domicilio fiscal y tu acta de nacimiento dicen &ldquo;Col.&rdquo; antes del nombre de tu zona. MapRaiders respeta eso."},
        {"q": "¿Qué pasa si no conozco a mis vecinos?",
         "a": "Justamente por eso existe el juego de colonia. Empiezas conquistando solo, ves qué calles ya tienen otros jugadores y dejas Echos que hablan de la colonia. Con el tiempo, el mapa te muestra con quién te cruzas en horarios similares y se forma un reconocimiento natural."},
        {"q": "¿Puedo crear un evento privado de mi colonia?",
         "a": "Sí. Puedes crear eventos privados (familia, calle específica, edificio) o eventos abiertos (toda la colonia). Los privados solo son visibles para los invitados; los abiertos aparecen en el mapa de toda la colonia."},
        {"q": "¿Hay categorías de colonia (zona segura, popular, rica)?",
         "a": "No. MapRaiders trata todas las colonias igual: Polanco como Iztapalapa, Roma como Ecatepec. Sin filtros de NSE, sin rankings de &ldquo;colonias top&rdquo;. Cada colonia es cancha de casa de quienes ahí viven."},
        {"q": "¿Cómo funciona el Día de Muertos en MapRaiders?",
         "a": "Con todo el respeto. Los usuarios marcan ofrendas comunitarias en el mapa, otros vecinos las visitan y dejan Echos respetuosos. Aquí nadie atrapa Catrinas ni colecciona calaveras. En noviembre, parte de los ingresos por cosméticos se dona a iniciativas culturales mexicanas con transparencia pública."},
    ],
    "internal_links": [
        ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
        ("/es-mx/juego-de-territorio.html", "Juego de territorio real"),
        ("/es-mx/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
        ("/es-mx/juego-de-colonia-opiniones.html", "Opiniones juego de colonia"),
        ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/es-mx/alternativa-pokemon-go-vale-la-pena.html",
        "breadcrumb": "¿Alternativa Pokémon GO vale la pena?",
        "title": "¿Alternativa Pokémon GO vale la pena? Beta MX",
        "og_title": "¿Alternativa Pokémon GO vale la pena? Beta-test honesto",
        "meta": "¿Alternativa Pokémon GO vale la pena? Tres probadores beta de Stuttgart, Hamburgo y Berlín responden honestamente sobre cardio, paseo del perro y exploración urbana.",
        "keywords": "alternativa pokemon go vale la pena, alternativa pokemon go opiniones, mapraiders opiniones, beta tester relato",
        "h1_html": 'Alternativa Pokémon GO: <em>¿realmente vale la pena?</em>',
        "lead": "Tres probadores beta de tres regiones metropolitanas alemanas usaron MapRaiders durante varias semanas. Aquí los relatos sin filtro: sin marketing-talk, sin código de influencer.",
        "intro_label": "¿Quién probó?",
        "intro_title": "Tres personas, tres <em>casos de uso</em>",
        "intro_body": """
    <p>Los tres probadores beta cubren perfiles muy distintos. Eso es justamente lo que hace honesta la comparación con Pokémon GO:</p>
    <ul>
      <li><strong>Ron C.</strong> de la región de Stuttgart: dueño de perro, paseo diario, sin background gamer.</li>
      <li><strong>Vivian N.</strong> de la región de Hamburgo: corredora, jugó Pokémon GO en 2018 y paró tras tres meses.</li>
      <li><strong>Aljoscha P.</strong> de la región de Berlín: explorador urbano, veterano de Ingress, conoce el ecosistema Niantic en primera mano.</li>
    </ul>
    <p>Los tres probaron MapRaiders por su cuenta, sin promoción pagada y sin script. Las citas están traducidas del alemán original.</p>
        """,
        "internal_links": [
            ("/es-mx/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
            ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
            ("/es-mx/juego-de-gps-opiniones.html", "Opiniones juego de GPS"),
            ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
        ],
    },
    {
        "slug": "/es-mx/juego-de-gps-opiniones.html",
        "breadcrumb": "Juego de GPS opiniones",
        "title": "Juego de GPS opiniones: MapRaiders en prueba real",
        "og_title": "Juego de GPS: opiniones de probadores beta",
        "meta": "Opiniones de juego de GPS: tres probadores beta relatan sobre batería, precisión GPS, privacidad y diversión real en el día a día urbano.",
        "keywords": "juego de gps opiniones, juego de gps prueba, gps mmo prueba, mapraiders opiniones",
        "h1_html": 'Juego de GPS: <em>opiniones</em> de probadores beta',
        "lead": "¿Qué tan preciso es el GPS en centros urbanos? ¿Cuánta batería del celular consume la app en rutas largas? ¿Cómo se siente la compatibilidad con LFPDPPP en piel de jugador? Tres probadores responden honestamente.",
        "intro_label": "Ejes de la prueba",
        "intro_title": "Lo que probamos en un <em>juego de GPS</em>",
        "intro_body": """
    <p>La prueba del juego de GPS giró en torno a cuatro ejes concretos:</p>
    <ul>
      <li><strong>Precisión GPS</strong> en barrancas urbanas y bajo puentes.</li>
      <li><strong>Consumo de batería del celular</strong> en trayectos de una a dos horas (comparado con Pokémon GO).</li>
      <li><strong>Sensación de privacidad</strong>: ¿cuánta incomodidad de tracking aparece?</li>
      <li><strong>Mecánica de juego</strong>: ¿territorio, Echos y misiones funcionan en el día real?</li>
    </ul>
        """,
        "internal_links": [
            ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
            ("/es-mx/juego-de-territorio.html", "Juego de territorio real"),
            ("/es-mx/juego-de-territorio-opiniones.html", "Opiniones juego de territorio"),
            ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
        ],
    },
    {
        "slug": "/es-mx/juego-de-territorio-opiniones.html",
        "breadcrumb": "Juego de territorio opiniones",
        "title": "Juego de territorio opiniones: probadores beta MX",
        "og_title": "Juego de territorio: opiniones reales de la beta",
        "meta": "Opiniones de juego de territorio en el día a día: tres probadores beta relatan cómo conquistar tierra, decay y mini-juegos de defensa funcionan en el espacio urbano real.",
        "keywords": "juego de territorio opiniones, juego de territorio prueba, conquistar territorio app opiniones",
        "h1_html": 'Juego de territorio: cuando <em>tu calle</em> es tuya',
        "lead": "¿Cómo se siente conquistar una calle de verdad? Tres probadores beta relatan el primer territorio, el primer choque de Decay y el primer mini-juego de defensa.",
        "intro_label": "¿Qué importa en la prueba?",
        "intro_title": "Lo que hace tangible un <em>juego de territorio</em>",
        "intro_body": """
    <p>En la prueba de territorio importan tres ejes de experiencia:</p>
    <ul>
      <li><strong>Conquista.</strong> ¿Cuándo se siente la primera calle como &ldquo;mi tierra&rdquo;?</li>
      <li><strong>Pérdida.</strong> ¿Cómo reaccionas al primer Decay o a la primera derrota frente a un atacante?</li>
      <li><strong>Defensa.</strong> ¿Cómo se sienten los mini-juegos de defensa: tácticos, justos, frustrantes?</li>
    </ul>
    <p>Las citas de los tres probadores cubren los tres ejes desde perspectivas muy distintas.</p>
        """,
        "internal_links": [
            ("/es-mx/juego-de-territorio.html", "Juego de territorio real"),
            ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
            ("/es-mx/juego-de-gps-opiniones.html", "Opiniones juego de GPS"),
            ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
        ],
    },
    {
        "slug": "/es-mx/pokemon-go-sin-fake-gps-opiniones.html",
        "breadcrumb": "Pokémon GO sin fake GPS opiniones",
        "title": "Pokémon GO sin fake GPS opiniones: prueba honesta",
        "og_title": "Pokémon GO sin fake GPS: opiniones de la beta",
        "meta": "Opiniones de alternativa Pokémon GO sin fake GPS: probadores beta relatan por qué el juego elimina la necesidad de PGSharp, MocPOGO o iMyFone.",
        "keywords": "pokemon go sin fake gps opiniones, alternativa sin cheat opiniones, mapraiders prueba anti-cheat",
        "h1_html": 'Pokémon GO sin fake GPS: <em>opiniones honestas</em>',
        "lead": "Pokémon GO en México tiene un problema: muchos jugadores recurren al fake GPS. ¿Cómo se siente jugar un GPS MMO que elimina esa necesidad de raíz? Tres probadores beta responden.",
        "intro_label": "Anti-cheat por diseño",
        "intro_title": "Por qué <em>el fake GPS deja de tener sentido</em>",
        "intro_body": """
    <p>Los tres probadores beta evaluaron el argumento anti-fake-GPS desde ángulos prácticos:</p>
    <ul>
      <li><strong>Densidad de spawn.</strong> ¿El juego funciona en colonia periférica o en provincia?</li>
      <li><strong>Justicia.</strong> ¿Quien está en CDMX tiene ventaja sobre quien está en Mérida?</li>
      <li><strong>Atractivo ético.</strong> ¿Por qué dejar PGSharp, MocPOGO o iMyFone?</li>
      <li><strong>Riesgo de baneo.</strong> ¿Cómo detecta y trata MapRaiders la trampa?</li>
    </ul>
        """,
        "internal_links": [
            ("/es-mx/pokemon-go-sin-fake-gps.html", "Pokémon GO sin fake GPS"),
            ("/es-mx/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO gratis"),
            ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
            ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
        ],
    },
    {
        "slug": "/es-mx/app-caminata-vale-la-pena.html",
        "breadcrumb": "¿App de caminata vale la pena?",
        "title": "¿App de caminata con juego vale la pena? Prueba real",
        "og_title": "App de caminata con juego: ¿vale la pena en el día a día?",
        "meta": "¿App de caminata con juego vale la pena? Probadores beta relatan motivación cardio, batería en rutas largas y pérdida de territorio tras pausa por enfermedad.",
        "keywords": "app de caminata vale la pena, app caminata con juego opiniones, cardio app prueba",
        "h1_html": 'App de caminata con juego: <em>¿vale la pena</em>?',
        "lead": "¿Qué pasa con la motivación de caminar cuando cada ruta defiende tierra real? ¿Cómo se siente el primer Decay tras una pausa por gripe? Una corredora, un walker y un explorador urbano responden.",
        "intro_label": "Ejes de la prueba",
        "intro_title": "Lo que una <em>app de caminata</em> debe entregar",
        "intro_body": """
    <p>Probamos la vivencia de caminata en tres ejes:</p>
    <ul>
      <li><strong>Ancla de motivación.</strong> ¿Cuándo alguien regresa tras una pausa?</li>
      <li><strong>Batería del celular en ruta larga.</strong> Trayectos de 60 a 90 minutos sin agotar el celular.</li>
      <li><strong>Cross-modalidad.</strong> ¿Funciona igual para correr, caminar y pasear al perro?</li>
    </ul>
        """,
        "internal_links": [
            ("/es-mx/app-caminata-con-juego.html", "App de caminata con juego"),
            ("/es-mx/juego-de-colonia.html", "Juego de colonia"),
            ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
            ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
        ],
    },
    {
        "slug": "/es-mx/busqueda-del-tesoro-app-opiniones.html",
        "breadcrumb": "Búsqueda del tesoro app opiniones",
        "title": "Búsqueda del tesoro app opiniones: probadores beta",
        "og_title": "Búsqueda del tesoro app: opiniones reales de la beta",
        "meta": "Opiniones de app de búsqueda del tesoro sin comprar tour ni preparación: probadores beta relatan cómo MapRaiders convierte la ciudad entera en búsqueda del tesoro en vivo.",
        "keywords": "busqueda del tesoro app opiniones, busqueda tesoro app prueba, live busqueda tesoro opiniones, familia busqueda tesoro",
        "h1_html": 'Búsqueda del tesoro app: <em>opiniones</em> sin comprar tour',
        "lead": "La mayoría de apps de búsqueda del tesoro exigen preparación: comprar tour, planear ruta, montar estaciones. ¿Cómo se siente cuando la ciudad entera ya viene llena de pistas? Tres probadores beta responden.",
        "intro_label": "Pregunta de la prueba",
        "intro_title": "¿Funciona una <em>búsqueda del tesoro en vivo</em> sin preparación?",
        "intro_body": """
    <p>Probamos las funciones de búsqueda del tesoro en tres escenarios:</p>
    <ul>
      <li><strong>Solo</strong> como explorador urbano (Aljoscha P.): dejar Echos, encontrar Echos.</li>
      <li><strong>Con perro</strong> en paseo normal (Ron C.): pistas como subproducto del paseo.</li>
      <li><strong>Escenario familiar</strong> simulado: ¿qué tan rápido entienden adultos y niños la mecánica?</li>
    </ul>
        """,
        "internal_links": [
            ("/es-mx/busqueda-del-tesoro-app.html", "Búsqueda del tesoro app"),
            ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
            ("/es-mx/juego-de-territorio.html", "Juego de territorio real"),
            ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
        ],
    },
    {
        "slug": "/es-mx/juego-de-colonia-opiniones.html",
        "breadcrumb": "Juego de colonia opiniones",
        "title": "Juego de colonia opiniones: probadores beta hablan",
        "og_title": "Juego de colonia: opiniones reales de vecinos beta",
        "meta": "Opiniones de juego de colonia: probadores beta relatan cómo MapRaiders convierte la colonia en mapa social vivo, sin Facebook ni algoritmo.",
        "keywords": "juego de colonia opiniones, juego colonia prueba, mapa social colonia opiniones, comunidad colonia mexicana app",
        "h1_html": 'Juego de colonia: <em>opiniones</em> de vecinos beta',
        "lead": "¿Cómo es convertir la colonia en mapa social vivo, sin Facebook? ¿Cómo se forma reconocimiento entre vecinos sin chat infinito? Tres probadores beta responden.",
        "intro_label": "Ejes de la prueba",
        "intro_title": "Lo que un <em>juego de colonia</em> debe respetar",
        "intro_body": """
    <p>Probamos el uso de colonia en tres ejes:</p>
    <ul>
      <li><strong>Reconocimiento espacial.</strong> ¿Es posible reconocer a vecinos sin invadir su privacidad?</li>
      <li><strong>WhatsApp-Sharing.</strong> ¿Funciona la integración con grupos de WhatsApp ya existentes?</li>
      <li><strong>Identidad cultural.</strong> ¿La colonia se siente como colonia y no como vecindario o barrio genérico?</li>
    </ul>
        """,
        "internal_links": [
            ("/es-mx/juego-de-colonia.html", "Juego de colonia"),
            ("/es-mx/app-caminata-con-juego.html", "App de caminata con juego"),
            ("/es-mx/juego-de-gps.html", "Mejor juego de GPS 2026"),
            ("/es-mx/mapraiders-opiniones.html", "Todas las opiniones"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/es-mx/mapraiders-opiniones.html",
    "breadcrumb": "MapRaiders opiniones",
    "title": "MapRaiders opiniones: beta-tests, fundador, hub MX",
    "og_title": "MapRaiders opiniones, todo en un solo lugar",
    "meta": "MapRaiders opiniones: 5,0 de 5 estrellas en tres beta-tests verificados, statement del fundador, todas las páginas Killer y relatos centralmente enlazados.",
    "keywords": "mapraiders opiniones, mapraiders opinion, mapraiders prueba, gps mmo opiniones mexico",
    "badge": "Hub & Resumen",
    "pricing_pill": "5,0 / 5 con tres opiniones verificadas de la beta",
    "h1_html": '<em>MapRaiders opiniones</em>: todo lo que necesitas saber sobre el GPS MMO',
    "lead": "Tres probadores beta de Stuttgart, Hamburgo y Berlín. Siete temas Killer, desde la comparación con Pokémon GO hasta la app de búsqueda del tesoro. Siete opiniones detalladas. Un hub.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "¿Qué es MapRaiders, en realidad?",
         "a": "MapRaiders es un GPS MMO para Android. Los jugadores conquistan territorios reales por movimiento, dejan Echos, crean misiones y defienden su tierra con mini-juegos. Sin publicidad, compatible con LFPDPPP, gratuito. Pago con OXXO, MercadoPago, PayPal o tarjeta para cosméticos."},
        {"q": "¿Cuántos probadores beta son?",
         "a": "Por ahora hicimos públicos a tres con su consentimiento, bajo primer nombre y la inicial por motivos de privacidad. La beta cerrada en su conjunto es mayor; los tres citados representan los perfiles principales."},
        {"q": "¿Las opiniones son reales?",
         "a": "Sí. Los tres probadores son personas reales de la beta cerrada en Alemania. No fueron pagados. Sus citas se escribieron originalmente en alemán y se tradujeron al español mexicano. En el markup Schema.org están marcadas con fecha, idioma y referencia al original alemán (translationOfWork)."},
        {"q": "¿Dónde puedo ser probador beta en México?",
         "a": "Regístrate en la página inicial mexicana con tu correo. Las plazas de beta mexicanas se liberan en olas tras el lanzamiento principal, con prioridad para dueños de perro, corredores y exploradores urbanos de ciudades con baja densidad de Pokémon GO."},
        {"q": "¿Cuándo sale oficialmente la app en México?",
         "a": "MapRaiders está en beta cerrada en Google Play (Alemania). El lanzamiento oficial en MX está planeado para verano de 2026 (julio o agosto). iOS llega en Q3 2026."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print("=== Phase 1 Session 3 — ES-MX Killer-URL Builder ===")
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
        print(f"  es-mx/{n}")


if __name__ == "__main__":
    main()

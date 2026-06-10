#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 2 — PT-BR Killer-URL Builder
Generates 15 PT-BR pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_PT-BR_FINAL_MASTER_PLAN.md.

Output: docs/pt-br/
Run: py docs/_build_phase1_ptbr.py
Idempotent: overwrites existing files.
"""

import json
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
OUT_DIR = DOCS / "pt-br"
SITE = "https://mapraiders.com"
LANG = "pt-BR"
LANG_SHORT = "pt"

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
# REUSABLE BLOCKS — PT-BR
# -----------------------------------------------------------------------------

# Beta-Tester data (PT-BR-translated quotes per Master-Plan §1.2)
TESTER_RON = {
    "name": "Ron C.",
    "name_de": "Ron C.",
    "role": "Tutor de cachorro · região de Stuttgart",
    "role_long": "Tutor de cachorro da região de Stuttgart (beta fechada)",
    "quote": "Meu cachorro precisa sair duas vezes por dia de qualquer jeito, então agora levo a quadra junto. Parece bobagem, mas toda noite eu dou uma olhada rápida se tudo ainda está azul.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "name_de": "Vivian N.",
    "role": "Corredora · região de Hamburgo",
    "role_long": "Corredora da região de Hamburgo (beta fechada)",
    "quote": "Eu corro toda manhã de qualquer jeito, mas agora também defendo alguma coisa. Minha volta no parque é minha, e quero que continue assim. É curioso quanta disciplina isso mobiliza de uma hora pra outra.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "name_de": "Aljoscha P.",
    "role": "Explorador urbano · região de Berlim",
    "role_long": "Explorador urbano da região de Berlim (beta fechada)",
    "quote": "Você deixa um áudio curto na entrada de um prédio, três dias depois alguém que você não conhece encontrou. Pra um jogo, isso parece estranhamente íntimo.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder Quote PT-BR (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "Joguei Pokémon GO durante três anos e em algum momento parei. O que sentia falta nunca chegou: "
    "terra de verdade no lugar de ginásios passageiros. Quando veio a venda para a Scopely em 2025, "
    "ficou claro que o caminho da Niantic não era o que me interessava. Então estou construindo o "
    "MapRaiders por conta própria. Sem propaganda, sem pressão de investidor, sem assinatura "
    "obrigatória. Meu bairro é meu campo de jogo; o seu, você conquista."
)

# Pricing offers (BRL — Master-Plan §1.1)
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0.00", "currency": "BRL"},
    {"name": "Cosmetic-IAP a partir de", "price": "4.90", "currency": "BRL"},
    {"name": "MapRaiders Apoiador (Sub)", "price": "19.90", "currency": "BRL"},
    {"name": "Apoiador Vitalício", "price": "499.00", "currency": "BRL"},
]

# DefinedTermSet PT-BR (Master-Plan §8)
DEFINED_TERMS = [
    ("Território", "Uma área conquistada no mapa do jogo, persistentemente atribuída ao jogador ou clã"),
    ("Echo", "Sinal de áudio, foto ou vídeo deixado pelo jogador em um local real, que outros jogadores podem descobrir"),
    ("Mini-jogo de defesa", "Mini-jogo (jogo da velha, pedra-papel-tesoura, mini-xadrez) acionado durante a defesa ou conquista de um território"),
    ("Missão", "Mini-tarefa criada pelo jogador que outros jogadores podem completar no mundo real"),
    ("Clã", "Grupo organicamente formado de jogadores que mantêm e defendem territórios juntos"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """Generate hreflang tags. slug is e.g. '/pt-br/jogo-de-gps.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "pt-BR":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="pt-BR"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">Da beta fechada</div>
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
    <div class="fr-label">O Fundador</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Fundador do MapRaiders" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">Fundador, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">Da beta fechada</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.6">
      Aviso: Os testadores são participantes internos da beta fechada (Alemanha). Apenas o primeiro nome + inicial são usados a pedido dos testadores, por motivos de privacidade. As avaliações foram traduzidas dos originais em alemão para o português brasileiro.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    """WhatsApp-Sharing-Button (Master-Plan §6 — Pflicht!) + Telegram."""
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    wa_text = f"Conhe%C3%A7a%20o%20MapRaiders%20-%20{enc}"
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}.mr-share__btn.wa{{border-color:#25D366}}.mr-share__btn.wa:hover{{background:#25D366;color:#fff}}</style>
<div class="mr-share" aria-label="Compartilhar"><span class="mr-share__label">Compartilhar:</span><a class="mr-share__btn wa" href="https://wa.me/?text={wa_text}" target="_blank" rel="noopener noreferrer">📱 WhatsApp</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">Termos</a><a href="/datenschutz.html">Privacidade</a><a href="/impressum.html">Impressum</a><a href="/kontakt.html">Contato</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders. Conquiste seu bairro de verdade. Um produto da Scafa Investments LLC.</p>
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
  <a href="/pt-br/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/pt-br/#features" class="lnk">Recursos</a>
    <a href="/pt-br/mapraiders-avaliacoes.html" class="lnk">Avaliações</a>
    <div class="lang-sw">
      <button class="lsw-btn">PT-BR <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('pt-BR')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">Em breve</a>
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
    "/pt-br/alternativa-pokemon-go-gratis.html": "/pokemon-go-alternative-kostenlos.html",
    "/pt-br/jogo-de-gps.html": "/gps-spiel-deutschland.html",
    "/pt-br/jogo-de-territorio.html": "/territorium-spiel.html",
    "/pt-br/pokemon-go-sem-fake-gps.html": "/spiele-wie-pokemon-go.html",
    "/pt-br/app-caminhada-com-jogo.html": "/handyspiel-zum-laufen.html",
    "/pt-br/caca-ao-tesouro-app.html": "/schnitzeljagd-app.html",
    "/pt-br/jogo-passear-cachorro.html": "/standort-spiel.html",
    "/pt-br/alternativa-pokemon-go-vale-a-pena.html": "/pokemon-go-alternative-erfahrungen.html",
    "/pt-br/jogo-de-gps-avaliacoes.html": "/gps-spiel-erfahrungen.html",
    "/pt-br/jogo-de-territorio-avaliacoes.html": "/territorium-spiel-erfahrungen.html",
    "/pt-br/pokemon-go-sem-fake-gps-avaliacoes.html": "/spiele-wie-pokemon-go-erfahrungen.html",
    "/pt-br/app-caminhada-vale-a-pena.html": "/handyspiel-laufen-erfahrungen.html",
    "/pt-br/caca-ao-tesouro-app-avaliacoes.html": "/schnitzeljagd-app-erfahrungen.html",
    "/pt-br/jogo-passear-cachorro-avaliacoes.html": "/standort-spiel-erfahrungen.html",
    "/pt-br/mapraiders-avaliacoes.html": "/mapraiders-erfahrungen.html",
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
        "inLanguage": "pt-BR",
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
        {"@type": "ListItem", "position": 1, "name": "Início", "item": f"{SITE}/pt-br/"},
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
            "inLanguage": "pt-BR",
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
            "inLanguage": "pt-BR",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-pt-br",
            "name": "MapRaiders Vocabulário de Marca PT-BR",
            "inLanguage": "pt-BR",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Início", "item": f"{SITE}/pt-br/"},
        {"@type": "ListItem", "position": 2, "name": "Avaliações", "item": f"{SITE}/pt-br/mapraiders-avaliacoes.html"},
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
            "inLanguage": "pt-BR",
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
            "inLanguage": "pt-BR",
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
        "name": "MapRaiders PT-BR: todas as páginas Killer e de avaliações",
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
  <h2 class="sec-title rv d1">Perguntas <em>frequentes</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Mais sobre o <em>campo de batalha</em></h2>
  <p class="rv d1">Tópicos relacionados ao MapRaiders:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Em breve no Google Play &bull; Grátis &bull; Sem spam</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">Avise-me no lançamento</a>
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
<html lang="pt-BR" data-theme="light">
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
<meta property="og:locale" content="pt_BR">
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
    Avise-me no lançamento
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
  <div class="sec-label rv">Avaliações</div>
  <h2 class="sec-title rv d1">5,0 de 5 a partir de <em>três avaliações verificadas da beta</em></h2>
  <div class="prose rv d2">
    <p>Ron passeia com o cachorro todos os dias, Vivian corre de manhã, Aljoscha caminha Berlim a pé. Os três usaram o MapRaiders por várias semanas dentro da rotina normal e responderam em alemão. Por motivos de privacidade usamos apenas o primeiro nome e a inicial. As avaliações foram traduzidas dos originais em alemão para o português brasileiro.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
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
<meta property="og:locale" content="pt_BR">
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
  <div class="h-badge rv">Avaliações</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">Saiba mais →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Avaliação detalhada →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">Hub Temático</div>
  <h2 class="sec-title rv d1">Todos os <em>tópicos do MapRaiders</em> num só lugar</h2>
  <div class="prose rv d2">
    <p>Aqui ficam todas as sete páginas Killer e as sete avaliações detalhadas que mostram o MapRaiders sob ângulos diferentes: da comparação com Pokémon GO ao app de caça ao tesouro, do jogo de território ao companheiro de corrida. Cada página funciona sozinha. Lendo todas, você vê o quadro completo.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Avaliações em detalhe</div>
  <h2 class="sec-title rv d1">O que dizem os testadores em <em>diferentes perspectivas</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Avaliação Agregada</div>
  <h2 class="sec-title rv d1">5,0 de 5 a partir de <em>três avaliações verificadas da beta</em></h2>
  <div class="prose rv d2">
    <p>As avaliações vêm da beta fechada entre fevereiro e abril de 2026. Ron testou em Stuttgart, Vivian em Hamburgo, Aljoscha em Berlim. Os três usaram o jogo nas próprias rotas, não em um cenário artificial de teste. Os textos são originais em alemão, traduzidos para o português brasileiro, e representam pessoas reais.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
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
<meta property="og:locale" content="pt_BR">
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
    "slug": "/pt-br/alternativa-pokemon-go-gratis.html",
    "breadcrumb": "Alternativa Pokémon GO grátis",
    "title": "Alternativa Pokémon GO grátis, sem propaganda e sem fundo saudita",
    "og_title": "Alternativa Pokémon GO grátis: 100% gratuito, sem Battle Pass",
    "meta": "Procurando alternativa Pokémon GO grátis? MapRaiders é 100% gratuito, sem propaganda, sem Battle Pass. Território real, não captura passageira de ginásio.",
    "keywords": "alternativa pokemon go gratis, alternativa pokemon go gratuita, jogo gps gratis brasil, sem propaganda, sem battle pass",
    "badge": "Alternativa Pokémon GO",
    "pricing_pill": "R$ 0,00 de gameplay. Cosmético opcional a partir de R$ 4,90.",
    "h1_html": 'Alternativa Pokémon GO grátis: sem propaganda, <em>sem fake GPS</em>, sem fundo saudita',
    "lead": "Quem busca uma alternativa ao Pokémon GO sem Battle Pass, sem pressão de Remote Raid Pass e sem propaganda, geralmente cai na próxima armadilha premium. O MapRaiders faz o contrário: o gameplay completo é gratuito e continua assim. Sem níveis pagos, sem assinatura obrigatória, sem venda de dados. Os cosméticos opcionais saem por PIX.",
    "trigger": {
        "quote": "Sua rua, seu território. Sem mensalidade.",
        "author": "MapRaiders, princípio do jogo"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Por que buscar?",
            "title": "Por que jogadores de Pokémon GO no Brasil buscam <em>alternativas gratuitas</em> em 2026",
            "body": """
    <p>Três pontos de dor amadureceram o mercado brasileiro entre 2024 e 2026:</p>
    <ul>
      <li><strong>Frustração com Battle Pass.</strong> Passes sazonais com benefícios bloqueados sem pagar. Quem perde uma temporada, perde recompensas para sempre.</li>
      <li><strong>Polêmica do Remote Raid Pass.</strong> A Niantic aumentou preços e reduziu a disponibilidade. Uma onda de jogadores brasileiros parou em 2023 por causa disso.</li>
      <li><strong>Aquisição saudita em março de 2025.</strong> A Niantic vendeu o Pokémon GO para a Scopely, subsidiária do Public Investment Fund saudita. Os dados de localização de milhões de jogadores passaram indiretamente para a esfera de um fundo soberano estrangeiro.</li>
    </ul>
            """,
        },
        {
            "label": "O que significa grátis?",
            "title": "O que <em>&ldquo;grátis&rdquo;</em> realmente significa no MapRaiders",
            "body": "<p>Tiers transparentes, sem paywall escondida e sem bloqueio de tutorial depois de dez minutos:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Tier</th><th>O que inclui</th><th>Preço (BR)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% do gameplay (territórios, Echos, missões, clãs, defesa, eventos)</td><td>R$ 0,00</td></tr>
      <tr><td class="feat-name">Cosmético-IAP</td><td>Designs de marcador, cores de território, emblemas de clã, skins</td><td>R$ 4,90 &ndash; R$ 49,90</td></tr>
      <tr><td class="feat-name">MapRaiders Apoiador (Sub)</td><td>Distintivo honorário, acesso beta, carta do fundador, pacote cosmético mensal</td><td>R$ 19,90 / mês</td></tr>
      <tr><td class="feat-name">Apoiador Vitalício</td><td>Cosmético colecionador + créditos no jogo</td><td>R$ 499,00 (uma vez)</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Importante:</strong> Itens cosméticos não dão nenhuma vantagem no jogo. Quem não compra nada joga com mecânicas idênticas às do Apoiador Vitalício.</p>""",
        },
        {
            "label": "PIX integrado",
            "title": "Pagamento <em>via PIX</em>, sem dor de cabeça",
            "body": """
    <p>Os cosméticos opcionais e a assinatura Apoiador podem ser pagos via PIX, cartão de crédito brasileiro ou carteira digital. Não precisa inserir dados de cartão internacional. O PIX é o caminho mais rápido: você abre o app do banco, escaneia o QR-Code, confirma e pronto. O cosmético desbloqueia em segundos.</p>
    <p>Provedores de pagamento integrados: Stripe BR, MercadoPago, dLocal, EBANX. Sem taxa adicional para o jogador, sem PayPal obrigatório.</p>
            """,
        },
        {
            "label": "A questão saudita",
            "title": "A <em>questão Saudi-Niantic</em>: o que acontece com seus passos",
            "body": """
    <p>Em março de 2025, a Niantic vendeu sua divisão de jogos (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) por 3,5 bilhões de dólares para a Scopely. A Scopely é subsidiária do Public Investment Fund (PIF) da Arábia Saudita, formalmente uma entidade controlada pelo estado saudita.</p>
    <p>Na prática, os <strong>dados de localização de cerca de 30 milhões de jogadores mensais de Pokémon GO</strong> passam pela infraestrutura da Scopely. Onde a galera corre, quando passeia com o cachorro, quais rotas percorre todo dia. Os detalhes das transferências de dados não foram divulgados publicamente pela empresa. O que se sabe: a LGPD não tem alcance equivalente sobre atores ligados a fundos soberanos fora do Brasil.</p>
    <p>O MapRaiders é uma LLC dos EUA em <strong>propriedade privada</strong> (Scafa Investments LLC, Flórida), desenvolvida por uma equipe independente. Operamos servidores compatíveis com LGPD, não vendemos dados, não temos rede de propaganda conectada e não somos controlados por nenhum estado.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders é realmente grátis para sempre?",
         "a": "Sim. Todo o gameplay principal continua grátis: conquistar territórios, deixar Echos, criar missões, formar clãs, jogar mini-jogos de defesa. Não há sistema de níveis, Battle Pass nem assinatura obrigatória."},
        {"q": "Quanto custa o Cosmético-IAP?",
         "a": "Itens cosméticos como designs de marcador, cores de território ou emblemas de clã custam entre R$ 4,90 e R$ 49,90. Eles não dão nenhuma vantagem no jogo, apenas estética. Pagamento via PIX, cartão ou carteira digital."},
        {"q": "Posso pagar com PIX?",
         "a": "Sim. PIX é a forma de pagamento padrão no Brasil para cosméticos e Apoiador-Sub. Você escaneia o QR-Code, confirma no app do banco, e o item desbloqueia em segundos. Sem cartão internacional, sem PayPal obrigatório."},
        {"q": "Há propaganda no app?",
         "a": "Não. MapRaiders é 100% sem propaganda. Não vendemos seus dados nem espaço publicitário."},
        {"q": "O que significa &ldquo;sem fundo saudita&rdquo;?",
         "a": "Em março de 2025, a Niantic vendeu sua divisão de jogos (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) por 3,5 bilhões de dólares para a Scopely, subsidiária do Public Investment Fund saudita. Os dados de localização de mais de 30 milhões de jogadores mensais passam indiretamente para a esfera de um fundo soberano estrangeiro. O MapRaiders é uma LLC privada dos EUA, não controlada por nenhum estado."},
    ],
    "internal_links": [
        ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
        ("/pt-br/jogo-de-territorio.html", "Jogo de território real"),
        ("/pt-br/pokemon-go-sem-fake-gps.html", "Pokémon GO sem fake GPS"),
        ("/pt-br/alternativa-pokemon-go-vale-a-pena.html", "Vale a pena? Avaliações"),
        ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
    ],
}

# K2 — jogo-de-gps  (Volume-King 5-8K/mes)
K2 = {
    "slug": "/pt-br/jogo-de-gps.html",
    "breadcrumb": "Jogo de GPS",
    "title": "Jogo de GPS 2026: território real e sem fake GPS",
    "og_title": "Jogo de GPS 2026: o GPS MMO honesto e gratuito",
    "meta": "O melhor jogo de GPS de 2026: território real, sem fake GPS, sem propaganda. MapRaiders é o GPS MMO honesto, gratuito, sem AR.",
    "keywords": "jogo de gps, jogo de gps 2026, melhor jogo de gps brasil, gps mmo, jogo gps android, location based game",
    "badge": "GPS MMO",
    "pricing_pill": "Free Forever. LGPD compatível. PIX integrado.",
    "h1_html": 'Jogo de GPS: <em>conquiste seu bairro</em> de verdade',
    "lead": "Jogos de GPS deveriam ser mais do que pontos efêmeros num mapa. O MapRaiders combina GPS, captura persistente de território e um sistema de defesa que torna a conquista real. Você passa numa rua, ela é sua. Enquanto você a defender. Sem fake GPS, sem AR drenando bateria, sem propaganda.",
    "trigger": {
        "quote": "Conquiste seu bairro de verdade.",
        "author": "MapRaiders, princípio da marca"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "O que é?",
            "title": "O que é um <em>jogo de GPS</em>",
            "body": """
    <p>Um <strong>jogo de GPS (Location-Based Game)</strong> usa a posição geográfica do dispositivo como mecânica central. Diferente de jogos AR, que dependem também da câmera, um jogo puro de GPS funciona só com o mapa. Isso economiza bateria e preserva a privacidade.</p>
    <p>O MapRaiders é um <strong>GPS MMO</strong>: milhares de jogadores se movimentam simultaneamente no mesmo mapa, competem em tempo real e compartilham um sistema unificado de territórios. Sem AR, sem câmera, sem óculos VR.</p>
            """,
        },
        {
            "label": "Os 7 melhores",
            "title": "Os 7 melhores jogos de GPS comparados, e por que <em>MapRaiders</em> é diferente",
            "body": "<p>A maioria das listas joga junto apps que só compartilham uma característica com Pokémon GO. Aqui é mais honesto:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>App</th><th>Operadora</th><th>Sem propaganda</th><th>Território real</th><th>Confiança LGPD</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Ginásios passageiros</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Ingress Prime</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">Portais, não persistente</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="check">✓</td><td class="cross">Caches, não terra</td><td>Premium-paywall</td></tr>
      <tr><td class="feat-name">Monster Hunter Now</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">✗</td><td class="cross">PIF saudita</td></tr>
      <tr><td class="feat-name">Geowars</td><td>Indie</td><td>Misto</td><td>Limitado</td><td>Variável</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓</td><td class="check">✓ persistente</td><td class="check">LGPD, independente</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Diferencial",
            "title": "O que faz o MapRaiders ser <em>diferente</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Territórios persistentes</h3><p>Ao conquistar uma rua, ela é sua até alguém recapturar ou o decay agir. Sem ginásios passageiros.</p></div>
    <div class="feat-card rv d1"><h3>Echos em vez de AR</h3><p>Deixe Echos de áudio, foto ou vídeo em locais reais. Outros jogadores descobrem ao passar. Sem AR drenando bateria.</p></div>
    <div class="feat-card rv d2"><h3>Sete mini-jogos de defesa</h3><p>Em ataques: jogo da velha, pedra-papel-tesoura ou mini-xadrez. Estratégia em vez de só tempo investido.</p></div>
    <div class="feat-card rv d3"><h3>Clãs orgânicos</h3><p>Clãs surgem da vizinhança, não de servidores Discord. Quem corre na mesma rua vira aliado natural.</p></div>
    <div class="feat-card rv d4"><h3>Bateria poupada</h3><p>Só GPS, sem câmera, sem AR. Em rotas longas, o celular dura cerca de quatro vezes mais do que com Pokémon GO.</p></div>
  </div>""",
        },
        {
            "label": "Casos de uso BR",
            "title": "Casos de uso <em>brasileiros</em>",
            "body": "<p>O MapRaiders se adapta a quatro perfis principais no Brasil:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Passear cachorro</h3><p>52,7 milhões de cães no Brasil. A volta diária vira manutenção de território.</p></div>
    <div class="feat-card rv d1"><h3>Corrida matinal</h3><p>Cardio com objetivo: defender território ou reconquistar. Strava na mão e jogo no bolso.</p></div>
    <div class="feat-card rv d2"><h3>Marcar o Carnaval</h3><p>Defina os blocos da sua rota de Carnaval. Eventos sazonais brasileiros próprios.</p></div>
    <div class="feat-card rv d3"><h3>Atividade família</h3><p>Caça ao tesouro com Echos, sem AR, sem propaganda. Para crianças e adultos no mesmo passeio.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "O que é um jogo de GPS?",
         "a": "Um jogo de GPS (Location-Based Game) usa sua posição GPS para acionar mecânicas. O MapRaiders vincula territórios, Echos e missões a locais reais. A sua cidade vira o campo de jogo."},
        {"q": "Preciso de Realidade Aumentada?",
         "a": "Não. O MapRaiders foi pensado deliberadamente sem AR. Usa só GPS e o mapa. Isso poupa bateria e privacidade. Sem câmera, sem captura facial."},
        {"q": "Funciona em qualquer cidade do Brasil?",
         "a": "Sim. Em qualquer lugar com dados OpenStreetMap. Em centros urbanos como São Paulo, Rio e Brasília a densidade de jogadores é alta; no interior, menos competição mas territórios maiores."},
        {"q": "Meus dados de localização são vendidos?",
         "a": "Não. Somos compatíveis com a LGPD, sem SDK de propaganda, sem venda de dados, sem dono estatal. Diferente do Pokémon GO, que desde março de 2025 pertence ao grupo Scopely (PIF saudita)."},
        {"q": "Quanto custa?",
         "a": "O gameplay é gratuito. Cosméticos (R$ 4,90 – R$ 49,90) não dão vantagens no jogo, só estética. Pagamento via PIX, cartão ou carteira digital."},
    ],
    "internal_links": [
        ("/pt-br/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO grátis"),
        ("/pt-br/jogo-de-territorio.html", "Jogo de território real"),
        ("/pt-br/pokemon-go-sem-fake-gps.html", "Pokémon GO sem fake GPS"),
        ("/pt-br/app-caminhada-com-jogo.html", "App de caminhada com jogo"),
        ("/pt-br/caca-ao-tesouro-app.html", "Caça ao tesouro app"),
        ("/pt-br/jogo-de-gps-avaliacoes.html", "Avaliações do jogo de GPS"),
        ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
    ],
}

# K3 — jogo-de-territorio
K3 = {
    "slug": "/pt-br/jogo-de-territorio.html",
    "breadcrumb": "Jogo de território",
    "title": "Jogo de território: conquiste o bairro inteiro de verdade",
    "og_title": "Jogo de território: onde a terra é realmente sua",
    "meta": "O que é jogo de território? MapRaiders é o GPS MMO com posse real e persistente de mapas. Sem fake GPS, sem assinatura, sem AR.",
    "keywords": "jogo de territorio, jogo de territorios, conquistar territorio app, territory game brasil, jogo gps territorio",
    "badge": "Jogo de Território",
    "pricing_pill": "Gratuito. Cosmético opcional.",
    "h1_html": 'Jogo de território: onde a <em>terra é realmente sua</em>',
    "lead": "Um jogo de território deveria ser mais que um ponto num mapa que some em cinco minutos. O MapRaiders combina GPS, captura persistente de área e um sistema de defesa que torna a conquista real. Você anda numa rua, ela é sua. Enquanto você defender.",
    "trigger": {
        "quote": "Sua rua, seu território. Sem mensalidade.",
        "author": "MapRaiders, princípio da marca"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Definição",
            "title": "O que faz um <em>jogo de território de verdade</em>",
            "body": """
    <p><strong>Um jogo de território</strong> é um jogo em que jogadores possuem áreas reivindicadas no mapa de forma persistente, defendem e expandem essas áreas. Diferente de jogos de captura (ginásio, portal), a posse permanece <strong>persistente</strong>, mesmo quando o jogador está offline.</p>
    <p>Quatro mecânicas definem um jogo de território de verdade:</p>
    <ul>
      <li><strong>Persistência.</strong> Áreas conquistadas ficam atribuídas ao jogador ou clã até serem ativamente tomadas.</li>
      <li><strong>Decay.</strong> Territórios inativos encolhem com o tempo. Ninguém bloqueia terra permanentemente sem jogar ativamente.</li>
      <li><strong>Defesa.</strong> Num ataque, um mini-jogo entre os dois jogadores decide. Não é comparação automática de stats.</li>
      <li><strong>Transferências de clã.</strong> Territórios podem ser passados a aliados ou ao clã. Daí surge profundidade econômica.</li>
    </ul>
            """,
        },
        {
            "label": "Sistema MapRaiders",
            "title": "O <em>sistema de territórios</em> do MapRaiders em detalhe",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Reivindicar</h3><p>Ande a pé, com o cachorro ou de bike por uma rua. O rastro GPS gera o território no seu nome, como polígono visível no mapa.</p></div>
    <div class="feat-card rv d1"><h3>Decay Engine</h3><p>Quem não percorre um território regularmente vê ele encolhendo alguns por cento por dia. Atividade segura a terra, não dinheiro.</p></div>
    <div class="feat-card rv d2"><h3>Mini-jogos de defesa</h3><p>Sete mini-jogos diferentes decidem ataques: jogo da velha, pedra-papel-tesoura, mini-xadrez. Quem usa a cabeça vence, não quem investiu mais horas.</p></div>
    <div class="feat-card rv d3"><h3>Territórios de clã</h3><p>Vários jogadores podem manter um território juntos. Áreas de clã são mais robustas. Um único atacante não basta para romper.</p></div>
  </div>""",
        },
        {
            "label": "Por que outros não são",
            "title": "Por que Pokémon GO e Ingress <em>não são</em> jogos de território de verdade",
            "body": """
    <p><strong>Capturas de ginásio do Pokémon GO</strong> são passageiras. Quem mantém um recorde por algumas horas ganha moedas, mas o território em si não conta como posse de terra. O ginásio é um ponto, não uma área.</p>
    <p><strong>Portais do Ingress</strong> são parecidos: pontos que se conectam por links em triângulos. O jogo conhece campos entre portais, mas não posse persistente de terra. Quem fica uma semana sem abrir o app não perde &ldquo;seu bairro&rdquo;. Ele nunca foi realmente atribuído.</p>
    <p>O MapRaiders ataca exatamente nesse ponto: o <strong>território é o recurso de jogo</strong>, não o ponto sobre ele. Você ganha terra, perde terra, transfere terra. Como num jogo espacial de verdade.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Como funciona o sistema de territórios no MapRaiders?",
         "a": "Você anda fisicamente por ruas e reivindica áreas GPS. Esses territórios aparecem no mapa ao vivo e são seus enquanto nenhum outro jogador passar por lá e desafiar. Se você defender com sucesso, a área continua sua."},
        {"q": "Posso perder meu território?",
         "a": "Sim. O sistema de Decay faz com que áreas inativas encolham por dia. Quem permanece ativo e percorre regularmente sua área a mantém. Quem para, perde. Isso mantém o mapa vivo."},
        {"q": "O que acontece num ataque territorial?",
         "a": "O atacante precisa chegar fisicamente ao seu território. Aí começa um mini-jogo interativo entre defensor e atacante. Quem ganhar o mini-jogo decide o destino da área."},
        {"q": "Existe sistema de territórios de clã?",
         "a": "Sim. Clãs no MapRaiders surgem organicamente e podem reivindicar territórios juntos. Áreas de clã são mais fortes e precisam de vários atacantes para serem rompidas. Trabalho em equipe vale a pena."},
        {"q": "O jogo de território cobra alguma coisa?",
         "a": "Não. Todo o gameplay de território é gratuito. Opcionalmente há itens cosméticos (R$ 4,90 a R$ 49,90) para designs de marcador e cores de território, sem vantagens no jogo. Pagamento via PIX."},
    ],
    "internal_links": [
        ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
        ("/pt-br/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO grátis"),
        ("/pt-br/app-caminhada-com-jogo.html", "App de caminhada com jogo"),
        ("/pt-br/jogo-de-territorio-avaliacoes.html", "Avaliações jogo de território"),
        ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
    ],
}

# K4 — pokemon-go-sem-fake-gps  (BR-EXKLUSIV-Killer)
K4 = {
    "slug": "/pt-br/pokemon-go-sem-fake-gps.html",
    "breadcrumb": "Pokémon GO sem fake GPS",
    "title": "Pokémon GO sem fake GPS: alternativa honesta para o Brasil",
    "og_title": "Pokémon GO sem fake GPS: aqui andar é o jogo",
    "meta": "Pokémon GO sem fake GPS? MapRaiders é a alternativa honesta. Sem cheat, sem PGSharp, sem MocPOGO. Aqui andar é o jogo, não trapacear.",
    "keywords": "pokemon go sem fake gps, alternativa pokemon go sem cheat, sem pgsharp, sem mocpogo, sem imyfone, jogo gps honesto",
    "badge": "Anti-Cheat · BR-Exclusivo",
    "pricing_pill": "Sem fake GPS. Sem PGSharp. Sem MocPOGO.",
    "h1_html": 'Pokémon GO sem fake GPS: onde <em>andar é o jogo</em>',
    "lead": "Quem joga Pokémon GO no Brasil conhece o problema. PokéParadas concentradas só em centros, falta de spawns no bairro, raids sem ninguém. A saída para muita gente virou fake GPS: PGSharp, MocPOGO, iMyFone. Só que trapacear é cansativo, arriscado (banimento) e mata o sentido do jogo. O MapRaiders elimina a necessidade de fake GPS, porque o território está em qualquer lugar com sinal GPS. Aqui andar é o jogo.",
    "trigger": {
        "quote": "Sem fake GPS. Aqui andar é o jogo.",
        "author": "MapRaiders, princípio anti-cheat"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "O problema",
            "title": "Por que jogadores de Pokémon GO no Brasil <em>buscam fake GPS</em>",
            "body": """
    <p>O mercado paralelo brasileiro de cheats para Pokémon GO é grande e ativo. Não por preguiça dos jogadores, mas por problemas estruturais do jogo no Brasil:</p>
    <ul>
      <li><strong>Densidade desigual de PokéStops.</strong> São Paulo capital tem mais de 80.000 endereços marcados. Já em bairros periféricos, cidades menores e zonas rurais, faltam pontos para jogar.</li>
      <li><strong>Raids sem participantes.</strong> Em horário de trabalho, raids ficam vazias. Sem time, sem captura. Fake GPS leva o jogador virtualmente ao centro onde tem gente.</li>
      <li><strong>Eventos centralizados.</strong> Tour Pokémon GO 2026 no Rio, LATAM Championships em São Paulo. Quem mora longe fica de fora, ou usa fake GPS.</li>
      <li><strong>Custos acumulados.</strong> Battle Pass, Remote Raid Pass, incubadoras de ovos. Trapacear vira atalho financeiro tentador.</li>
    </ul>
            """,
        },
        {
            "label": "Por que MapRaiders elimina a necessidade",
            "title": "Por que o MapRaiders <em>elimina</em> a necessidade de fake GPS",
            "body": """
    <p>Quatro mudanças estruturais tornam fake GPS inútil no MapRaiders:</p>
    <ul>
      <li><strong>Território está em qualquer lugar.</strong> Sem dependência de pontos pré-definidos. Cada rua, cada quadra, cada parque é território potencial.</li>
      <li><strong>Persistência supera presença.</strong> Você não precisa estar &ldquo;onde estão os outros&rdquo;. Quem corre toda manhã na mesma rua, possui essa rua. Defesa ativa pesa mais que spawn farming.</li>
      <li><strong>Echos abrem qualquer canto.</strong> Você deixa Echos onde quiser, outros jogadores descobrem. Suas ruas viram destino, não periferia.</li>
      <li><strong>Mini-jogos de defesa em vez de presença horária.</strong> Você não precisa &ldquo;estar lá agora&rdquo;. Quando alguém ataca seu território, o mini-jogo defensivo roda de onde você estiver.</li>
    </ul>
            """,
        },
        {
            "label": "Lista de cheats",
            "title": "Lista de cheats e por que são <em>desnecessários</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>Cheat / App</th><th>Função</th><th>Risco no Pokémon GO</th><th>Necessário no MapRaiders</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">PGSharp</td><td>Fake GPS Android</td><td>Banimento permanente</td><td class="check">Não</td></tr>
      <tr><td class="feat-name">MocPOGO</td><td>Spoofing PC + Android</td><td>Banimento permanente</td><td class="check">Não</td></tr>
      <tr><td class="feat-name">iMyFone AnyTo</td><td>Fake GPS iOS</td><td>Shadowban / banimento</td><td class="check">Não</td></tr>
      <tr><td class="feat-name">iSpoofer</td><td>Fake GPS jailbreak</td><td>Banimento permanente</td><td class="check">Não</td></tr>
      <tr><td class="feat-name">Joystick GPS apps</td><td>Movimento simulado</td><td>Banimento + risco LGPD</td><td class="check">Não</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>Resumo:</strong> no MapRaiders, o jogo respeita o seu lugar. Não exige que você simule estar em São Paulo. Sua rua, suas conquistas. Honesto.</p>""",
        },
    ],
    "faq": [
        {"q": "O MapRaiders detecta fake GPS?",
         "a": "Sim. Detectamos fake GPS, joystick simulado e velocidades impossíveis. Trapaça é detectada e leva a banimento. Mas a maior &ldquo;detecção&rdquo; é o próprio design: não há razão para usar fake GPS, porque o jogo respeita a sua localização real."},
        {"q": "Por que não preciso de PGSharp ou MocPOGO?",
         "a": "Porque o MapRaiders não depende de PokéStops centralizados ou raids agendados. Cada rua é território potencial, cada quadra vira terreno seu se você passar por lá regularmente. A periferia não é desvantagem, é vantagem: menos competição."},
        {"q": "E se eu morar em cidade pequena?",
         "a": "Cidade pequena vira sua vantagem no MapRaiders. Menos jogadores, territórios maiores, defesa mais fácil. No Pokémon GO o interior é deserto. Aqui é fortaleza."},
        {"q": "Posso jogar de casa, sem sair?",
         "a": "Não. O MapRaiders exige movimento real. Aqui andar é o jogo. Mas você não precisa caminhar quilômetros, dá pra começar com a quadra de casa e expandir no ritmo natural do dia: passear com o cachorro, ir a pé pro trabalho, correr."},
        {"q": "É 100% gratuito?",
         "a": "Sim. Gameplay completo de graça. Cosméticos opcionais via PIX (R$ 4,90 a R$ 49,90), sem vantagem competitiva."},
    ],
    "internal_links": [
        ("/pt-br/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO grátis"),
        ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
        ("/pt-br/jogo-de-territorio.html", "Jogo de território real"),
        ("/pt-br/pokemon-go-sem-fake-gps-avaliacoes.html", "Avaliações"),
        ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
    ],
}

# K5 — app-caminhada-com-jogo
K5 = {
    "slug": "/pt-br/app-caminhada-com-jogo.html",
    "breadcrumb": "App de caminhada com jogo",
    "title": "App de caminhada com jogo: Strava com território real",
    "og_title": "App de caminhada com jogo: cardio, jogo e saúde",
    "meta": "App de caminhada com jogo? O MapRaiders transforma cada passeio em conquista de território. Cardio, jogo e saúde para a família toda.",
    "keywords": "app de caminhada, app caminhada com jogo, caminhar com jogo, jogo para caminhar, app cardio gps, strava territorio",
    "badge": "Cardio + Jogo",
    "pricing_pill": "Free Forever. Cerca de quatro vezes menos bateria que Pokémon GO.",
    "h1_html": 'App de caminhada com jogo: quando <em>cada passo</em> conquista território',
    "lead": "Apps de caminhada entregam estatísticas. Jogos como Pokémon GO entregam coleção. Mas nenhum transforma seu caminho real em terra de verdade. O MapRaiders, sim: cada passo forma território, cada volta defende. Cardio com consequência. Família junta. Saúde de verdade.",
    "trigger": {
        "quote": "Eu corro toda manhã de qualquer jeito, mas agora também defendo alguma coisa. É curioso quanta disciplina isso mobiliza.",
        "author": "Vivian N., corredora da região de Hamburgo (beta fechada)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "O problema",
            "title": "Por que <em>apps de caminhada</em> tradicionais não bastam",
            "body": """
    <p>Strava, Nike Run Club, Adidas Running medem tempo, distância e ritmo. Mas três pontos faltam para muita gente no Brasil:</p>
    <ul>
      <li><strong>Sem elemento de jogo.</strong> Quem não persegue recordes pessoais perde motivação em quatro semanas.</li>
      <li><strong>Pressão de performance.</strong> Leaderboards públicos motivam alguns e desmotivam tantos outros.</li>
      <li><strong>Assinatura forçada.</strong> Strava Premium custa R$ 21,90 por mês para mapas de calor e comparações de rotas que ficaram quase inúteis no plano gratuito.</li>
    </ul>
            """,
        },
        {
            "label": "A solução",
            "title": "Como o MapRaiders <em>muda sua rotina</em> de caminhada",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Manter território</h3><p>Cada percurso defende terra. Quem para três dias vê o decay agir. Um incentivo natural pra voltar.</p></div>
    <div class="feat-card rv d1"><h3>Contador de Decay</h3><p>O valor de Decay diz: &ldquo;Se você não correr hoje, seu bairro encolhe X%&rdquo;. Sem culpa, só realidade física.</p></div>
    <div class="feat-card rv d2"><h3>Defesa de clã enquanto corre</h3><p>Durante a corrida, push notifications avisam quando o território do clã é atacado. Você não corre sozinho, corre junto.</p></div>
    <div class="feat-card rv d3"><h3>Recompensa via Echo</h3><p>Echos de áudio quando você passa. Outros jogadores contam histórias da rua. Sem propaganda, sem influencer.</p></div>
  </div>""",
        },
        {
            "label": "Strava complemento",
            "title": "MapRaiders <em>complementa</em> o Strava, não substitui",
            "body": """
    <p>O MapRaiders não compete com o Strava em métricas de performance. Dá pra rodar os dois apps ao mesmo tempo, eles usam o mesmo sensor GPS sem conflito. O que o Strava não dá: território real e defesa social. O que o MapRaiders não dá: análise detalhada de pace splits e zonas cardíacas.</p>
    <p>Combinação ideal: <strong>Strava para análise técnica, MapRaiders para motivação diária e território.</strong> Roda os dois, sem dor de cabeça.</p>
            """,
        },
        {
            "label": "Longevidade",
            "title": "Caminhada para o <em>público 50+</em>",
            "body": """
    <p>O Brasil tem mais de 25 milhões de pessoas com 60+. A caminhada é a atividade física mais recomendada por geriatras, e o que falta de fato é motivação. O MapRaiders resolve isso sem AR (que confunde) e sem competição agressiva (que afasta):</p>
    <ul>
      <li><strong>Ritmo próprio.</strong> Sem mínimo de velocidade. Walking, caminhar com bengala, caminhar com amigo, tudo conta para território.</li>
      <li><strong>Mesma rua todo dia funciona.</strong> Persistência supera distância. Quem repete, mantém.</li>
      <li><strong>Comunidade de bairro.</strong> Clãs orgânicos com vizinhos. Sem Discord, sem chat tóxico.</li>
      <li><strong>Compatível com a LGPD.</strong> Para idosos preocupados com privacidade. Sem propaganda direcionada, sem venda de localização.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Quanto tempo de bateria dura?",
         "a": "Numa caminhada de uma hora, costuma ficar entre 15% e 25% de bateria (contra cerca de 50% no Pokémon GO com AR). Os valores variam conforme aparelho e brilho da tela."},
        {"q": "Funciona com Strava ou Nike Run Club?",
         "a": "Hoje não há integração direta. Você pode rodar os dois apps ao mesmo tempo, eles usam o mesmo sensor GPS sem conflito. Integração com Strava está prevista para o quarto trimestre de 2026."},
        {"q": "Caminhar devagar também conta?",
         "a": "Sim. Não há velocidade mínima. Walking, caminhada lenta, passeio: tudo forma território, desde que seja movimento físico real (sem auto-cheating)."},
        {"q": "Pode usar idoso?",
         "a": "Sim, foi pensado para todas as idades. Sem AR, sem barulho, sem pressão de pace. Letras grandes, contraste alto, controles simples."},
        {"q": "Quanto consome de dados móveis?",
         "a": "Moderado. Sem live-video, sem API pesada. Uma caminhada de 1 hora usa tipicamente 5-15 MB."},
    ],
    "internal_links": [
        ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
        ("/pt-br/jogo-de-territorio.html", "Jogo de território real"),
        ("/pt-br/jogo-passear-cachorro.html", "Jogo passear cachorro"),
        ("/pt-br/app-caminhada-vale-a-pena.html", "Vale a pena? Avaliações"),
        ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
    ],
}

# K6 — caca-ao-tesouro-app
K6 = {
    "slug": "/pt-br/caca-ao-tesouro-app.html",
    "breadcrumb": "Caça ao tesouro app",
    "title": "Caça ao tesouro app 2026: cidade inteira ao vivo, grátis",
    "og_title": "Caça ao tesouro app: cidade inteira de Echos escondidos",
    "meta": "Caça ao tesouro app 2026: ao vivo, cidade inteira, sem comprar tour, sem propaganda. O MapRaiders transforma a sua cidade em caça ao tesouro aberta. Família e amigos.",
    "keywords": "caca ao tesouro app, caca ao tesouro celular, app caca tesouro, caca ao tesouro brasileira, geocaching alternativa, caca tesouro familia",
    "badge": "Caça ao Tesouro",
    "pricing_pill": "Free Forever. Sem comprar tour. Cidade inteira.",
    "h1_html": 'Caça ao tesouro app: uma <em>cidade inteira de Echos</em> escondidos',
    "lead": "Apps tradicionais de caça ao tesouro como Geocaching exigem assinatura premium e tours pré-definidos. O MapRaiders inverte isso. Echos já estão espalhados pela cidade inteira. Você segue rastros de outros jogadores ou deixa os seus. Ao vivo, gratuito, sem comprar tour, sem preparação.",
    "trigger": {
        "quote": "Você deixa um áudio na entrada de um prédio, três dias depois alguém que você não conhece encontrou. Pra um jogo, isso parece estranhamente íntimo.",
        "author": "Aljoscha P., explorador urbano da região de Berlim (beta fechada)"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "Critérios",
            "title": "O que uma <em>caça ao tesouro app moderna</em> deveria ter",
            "body": """
    <p>Três critérios separam apps de caça ao tesouro dos anos 2020 das soluções de papel impresso:</p>
    <ul>
      <li><strong>Ao vivo.</strong> Pistas surgem em tempo real, não só em tours pré-fabricados.</li>
      <li><strong>Social.</strong> Jogadores deixam pistas uns para os outros, em vez de só seguir.</li>
      <li><strong>Sem barreira premium.</strong> Pais e crianças entram na hora, sem precisar comprar tour de R$ 15,00.</li>
    </ul>
            """,
        },
        {
            "label": "Comparação",
            "title": "Apps de caça ao tesouro <em>comparadas</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>Preço</th><th>Preparação</th><th>Ao vivo?</th><th>Loop de jogo</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Geocaching</td><td>Sub Premium cerca de R$ 30/mês</td><td>Baixa, achar caches</td><td class="cross">Assíncrono</td><td>Coletar</td></tr>
      <tr><td class="feat-name">Actionbound</td><td>Tours / Sub</td><td>Alta, montar tour</td><td class="cross">✗</td><td>Por-tour</td></tr>
      <tr><td class="feat-name">Munzee</td><td>Premium-Sub</td><td>Média</td><td class="cross">Assíncrono</td><td>Escanear códigos</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">R$ 0,00</td><td class="check">Zero</td><td class="check">Ao vivo</td><td>Echos + Missões + Território</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Echos",
            "title": "Como o MapRaiders <em>repensa</em> a caça ao tesouro",
            "body": """
    <p>Em vez de uma tour linear da estação 1 até a 10, o MapRaiders cria uma <strong>caça ao tesouro espacial aberta</strong>. A cidade inteira é o playground:</p>
    <ul>
      <li><strong>Deixar Echos.</strong> Deixe um Echo de áudio, foto ou vídeo num lugar. Outros jogadores descobrem ao passar.</li>
      <li><strong>Encontrar Echos.</strong> Veja no mapa onde estão Echos. Siga os rastros, ache segredos, ouça histórias.</li>
      <li><strong>Criar missões.</strong> Crie uma tarefa pequena num local (&ldquo;Tire foto da porta vermelha ali&rdquo;). Outros jogadores cumprem.</li>
      <li><strong>Camada de território.</strong> Quem percorre uma rota de caça ao tesouro com frequência conquista como território. Os rastros viram terra.</li>
    </ul>
            """,
        },
        {
            "label": "Crianças",
            "title": "Caça ao tesouro app para <em>crianças e família</em>",
            "body": """
    <p>Caça ao tesouro faz parte da infância brasileira: pistas de giz, rastro de folhas, esconderijo final com bala. O MapRaiders traz isso para a era do smartphone, sem deixar crianças sozinhas na tela:</p>
    <ul>
      <li><strong>Atividade pais-filhos.</strong> Pais deixam Echos de áudio numa rota planejada, crianças seguem os rastros. Movimento analógico, dicas digitais.</li>
      <li><strong>Tela mínima, mundo máximo.</strong> O app guia no mapa, a vivência acontece no mundo real.</li>
      <li><strong>Compatível com a LGPD para crianças.</strong> Sem rastreador de propaganda personalizada, sem venda de dados, sem chat in-app sem aprovação dos pais.</li>
      <li><strong>Modo família.</strong> Eventos privados de Carnaval, Festas Juninas, Páscoa, só para o grupo familiar.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders é apropriado para crianças?",
         "a": "Sim, a partir de nove anos com acompanhamento dos pais. O app é compatível com a LGPD, sem propaganda e não coleta dados pessoais de crianças. Os pais podem ativar um modo família."},
        {"q": "Quanta preparação preciso para uma caça com crianças?",
         "a": "Zero. Diferente do Actionbound ou Munzee, você não precisa comprar tour nem preparar estações. Echos já estão espalhados pela cidade. Basta seguir os rastros de outros jogadores ou deixar os seus."},
        {"q": "A app de caça ao tesouro custa alguma coisa?",
         "a": "Não. As funções de caça ao tesouro (deixar Echos, encontrar Echos, criar missões) são totalmente gratuitas. Há cosméticos opcionais a partir de R$ 4,90, sem vantagem no jogo. Pagamento via PIX."},
        {"q": "Funciona em cidades pequenas?",
         "a": "Sim. Mesmo em cidades pequenas ou bairros menores, você pode deixar Echos e criar missões. Em centros maiores você encontra mais rastros de outros jogadores; no interior, sua tour tem mais espaço próprio."},
        {"q": "O app é em português?",
         "a": "Sim. O MapRaiders está totalmente localizado em português brasileiro: menus, sistema de Echos, dicas, suporte."},
    ],
    "internal_links": [
        ("/pt-br/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO grátis"),
        ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
        ("/pt-br/jogo-de-territorio.html", "Jogo de território real"),
        ("/pt-br/caca-ao-tesouro-app-avaliacoes.html", "Avaliações caça ao tesouro app"),
        ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
    ],
}

# K7 — jogo-passear-cachorro
K7 = {
    "slug": "/pt-br/jogo-passear-cachorro.html",
    "breadcrumb": "Jogo passear cachorro",
    "title": "Jogo passear cachorro: território com o seu pet",
    "og_title": "Jogo passear cachorro: gamifique o passeio diário",
    "meta": "Jogo passear cachorro: o MapRaiders gamifica o passeio diário. Cada caminhada conquista território, encontra Echos, vira jogo. Grátis, sem propaganda.",
    "keywords": "jogo passear cachorro, app passear cachorro, jogo cachorro gps, app pet brasileiro, gamificacao passeio cachorro, walkies game",
    "badge": "Pet + Território",
    "pricing_pill": "Free Forever. Mais de 52 milhões de cachorros no Brasil.",
    "h1_html": 'Jogo passear cachorro: <em>território com o seu pet</em>',
    "lead": "O Brasil tem mais de 52 milhões de cachorros. O passeio diário é ritual sagrado, mas vira monotonia depois de um mês. O MapRaiders gamifica essa rotina: cada passeio conquista território, encontra Echos de outros tutores, forma clã orgânico no bairro. Sem AR, sem propaganda direcionada. Pet-friendly de verdade.",
    "trigger": {
        "quote": "Meu cachorro precisa sair duas vezes por dia. Agora levo a quadra junto, e toda noite dou uma olhada se tudo continua azul.",
        "author": "Ron C., tutor de cachorro da região de Stuttgart (beta fechada)"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "O problema",
            "title": "Por que apps de pet <em>deveriam ser jogo</em>, não só tracking",
            "body": """
    <p>Apps de cachorro como Wag!, Rover ou os trackers brasileiros (Ze Delivery Pet, Petlove app) focam só em logística: agendar passeio, encontrar pet sitter, comprar ração. Falta o que o tutor realmente quer no dia a dia:</p>
    <ul>
      <li><strong>Motivação para o passeio.</strong> Depois de meses, o passeio das sete da manhã vira obrigação. Sai a diversão.</li>
      <li><strong>Conexão com vizinhos.</strong> Outros tutores na mesma rua não se conhecem. Apps de pet não criam comunidade local.</li>
      <li><strong>Memória da rotina.</strong> Que ruas o cachorro adora? Onde ele cheira mais? Apps de tracking dão linha azul no mapa, sem significado.</li>
    </ul>
            """,
        },
        {
            "label": "A solução",
            "title": "Como o MapRaiders <em>vira jogo</em> no passeio diário",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Território conquistado</h3><p>Cada passeio expande seu polígono. Em 2 semanas, você possui sua rua. Em 2 meses, o bairro. Sem esforço extra.</p></div>
    <div class="feat-card rv d1"><h3>Echos do bairro</h3><p>Outros tutores deixam Echos de áudio (&ldquo;Aqui meu cachorro Bento adora cheirar&rdquo;). Você descobre ao passar. Virou comunidade pet do bairro.</p></div>
    <div class="feat-card rv d2"><h3>Missões para tutores</h3><p>&ldquo;Tire foto do cachorro num parque desconhecido&rdquo;. Missões pequenas que rendem variedade na rotina.</p></div>
    <div class="feat-card rv d3"><h3>Rastro pessoal</h3><p>O mapa lembra os caminhos preferidos do seu pet. Memória visual da convivência diária.</p></div>
  </div>""",
        },
        {
            "label": "Comunidade tutores",
            "title": "Comunidade de <em>tutores no seu bairro</em>",
            "body": """
    <p>O MapRaiders forma clãs orgânicos por geografia. Quem passeia o cachorro pelas mesmas ruas que você, é candidato natural a clã. Sem Discord, sem chat tóxico, sem sponsored content de marcas de ração:</p>
    <ul>
      <li><strong>Reconhecimento de rotina.</strong> Cachorros que se cruzam no mesmo horário viram &ldquo;amigos do mapa&rdquo;.</li>
      <li><strong>Defesa em grupo.</strong> Quando alguém de fora ataca o território, todos os tutores vizinhos podem defender juntos.</li>
      <li><strong>Eventos de bairro.</strong> Festa Junina pet-friendly? Páscoa de cachorros? Crie evento próprio no mapa.</li>
      <li><strong>Sem rede social paralela.</strong> Tudo dentro do MapRaiders, sem Instagram, sem WhatsApp obrigatório.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Posso passear meu cachorro e jogar ao mesmo tempo sem perigo?",
         "a": "Sim. O app foi pensado para uso de bolso, você não precisa ficar olhando a tela. Notificações por som ou vibração avisam quando algo importante acontece. O passeio continua sendo do cachorro; o jogo roda em segundo plano."},
        {"q": "Funciona com cachorro pequeno, idoso, devagar?",
         "a": "Sim. Não há velocidade mínima. O jogo respeita o ritmo do pet: caminhada lenta, paradas frequentes para cheirar, tudo conta como movimento real."},
        {"q": "Meu cachorro precisa estar registrado?",
         "a": "Não. Não exigimos cadastro do animal. Você pode adicionar opcionalmente nome e foto do pet no perfil. Privado, sem venda para marcas de ração."},
        {"q": "E se eu tiver mais de um cachorro?",
         "a": "Sem problema. O MapRaiders rastreia o tutor (você), não o pet específico. Múltiplos cachorros, múltiplos passeios, tudo soma para o mesmo território."},
        {"q": "Tem propaganda de marcas pet?",
         "a": "Não. O MapRaiders é 100% sem propaganda. Nem de pet shops, nem de ração, nem de nada. Pet-friendly de verdade."},
    ],
    "internal_links": [
        ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
        ("/pt-br/jogo-de-territorio.html", "Jogo de território real"),
        ("/pt-br/app-caminhada-com-jogo.html", "App de caminhada com jogo"),
        ("/pt-br/jogo-passear-cachorro-avaliacoes.html", "Avaliações"),
        ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/pt-br/alternativa-pokemon-go-vale-a-pena.html",
        "breadcrumb": "Alternativa Pokémon GO vale a pena?",
        "title": "Alternativa Pokémon GO vale a pena? Testadores beta respondem",
        "og_title": "Alternativa Pokémon GO vale a pena? Beta-test honesto",
        "meta": "Alternativa Pokémon GO vale a pena? Três testadores beta de Stuttgart, Hamburgo e Berlim respondem honestamente sobre cardio, passeio com cachorro e exploração urbana.",
        "keywords": "alternativa pokemon go vale a pena, alternativa pokemon go avaliacoes, mapraiders avaliacoes, beta tester relato",
        "h1_html": 'Alternativa Pokémon GO: <em>vale a pena mesmo?</em>',
        "lead": "Três testadores beta de três regiões metropolitanas alemãs usaram o MapRaiders por várias semanas. Aqui os relatos sem filtro, sem marketing-talk e sem código de influencer.",
        "intro_label": "Quem testou?",
        "intro_title": "Três pessoas, três <em>casos de uso</em>",
        "intro_body": """
    <p>Os três testadores beta cobrem três personas bem diferentes. É isso que torna a comparação com Pokémon GO honesta:</p>
    <ul>
      <li><strong>Ron C.</strong> da região de Stuttgart: tutor de cachorro, passeio diário, sem background gamer.</li>
      <li><strong>Vivian N.</strong> da região de Hamburgo: corredora, jogou Pokémon GO em 2018 e parou após três meses.</li>
      <li><strong>Aljoscha P.</strong> da região de Berlim: explorador urbano, veterano de Ingress, conhece o ecossistema Niantic em primeira mão.</li>
    </ul>
    <p>Os três testaram o MapRaiders de forma independente, sem promoção paga e sem script. As citações foram traduzidas dos originais em alemão.</p>
        """,
        "internal_links": [
            ("/pt-br/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO grátis"),
            ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
            ("/pt-br/jogo-de-gps-avaliacoes.html", "Avaliações jogo de GPS"),
            ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
        ],
    },
    {
        "slug": "/pt-br/jogo-de-gps-avaliacoes.html",
        "breadcrumb": "Jogo de GPS avaliações",
        "title": "Jogo de GPS avaliações: MapRaiders no teste real",
        "og_title": "Jogo de GPS: avaliações de testadores beta",
        "meta": "Avaliações de jogo de GPS: três testadores beta relatam sobre bateria, precisão GPS, privacidade e diversão real no dia a dia urbano.",
        "keywords": "jogo de gps avaliacoes, jogo de gps teste, gps mmo teste, mapraiders avaliacoes",
        "h1_html": 'Jogo de GPS: <em>avaliações</em> de testadores beta',
        "lead": "Quão preciso é o GPS em centros urbanos? Quanta bateria o app consome em rotas longas? Como se sente a compatibilidade com a LGPD na pele do jogador? Três testadores respondem honestamente.",
        "intro_label": "Eixos do teste",
        "intro_title": "O que testamos num <em>jogo de GPS</em>",
        "intro_body": """
    <p>O teste do jogo de GPS girou em torno de quatro eixos concretos:</p>
    <ul>
      <li><strong>Precisão GPS</strong> em ravinas urbanas e sob pontes.</li>
      <li><strong>Consumo de bateria</strong> em trajetos de 1 a 2 horas (comparado ao Pokémon GO).</li>
      <li><strong>Sensação de privacidade</strong>: quanto incômodo de tracking aparece?</li>
      <li><strong>Mecânica de jogo</strong>: território, Echos e missões funcionam no dia real?</li>
    </ul>
        """,
        "internal_links": [
            ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
            ("/pt-br/jogo-de-territorio.html", "Jogo de território real"),
            ("/pt-br/jogo-de-territorio-avaliacoes.html", "Avaliações jogo de território"),
            ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
        ],
    },
    {
        "slug": "/pt-br/jogo-de-territorio-avaliacoes.html",
        "breadcrumb": "Jogo de território avaliações",
        "title": "Jogo de território avaliações: testadores beta sobre MapRaiders",
        "og_title": "Jogo de território: avaliações reais da beta",
        "meta": "Avaliações de jogo de território no dia a dia: três testadores beta relatam como conquistar terra, decay e mini-jogos de defesa funcionam no espaço urbano real.",
        "keywords": "jogo de territorio avaliacoes, jogo de territorio teste, conquistar territorio app avaliacoes",
        "h1_html": 'Jogo de território: quando a <em>sua rua</em> é sua',
        "lead": "Como é conquistar uma rua de verdade? Três testadores beta relatam o primeiro território, o primeiro susto com o Decay e o primeiro mini-jogo de defesa.",
        "intro_label": "O que importa no teste",
        "intro_title": "O que torna um <em>jogo de território</em> tangível",
        "intro_body": """
    <p>No teste de território, três eixos de experiência importam:</p>
    <ul>
      <li><strong>Conquista.</strong> Quando a primeira rua começa a parecer &ldquo;minha terra&rdquo;?</li>
      <li><strong>Perda.</strong> Como se reage ao primeiro Decay ou à primeira derrota para um atacante?</li>
      <li><strong>Defesa.</strong> Como se sentem os mini-jogos de defesa: táticos, justos, frustrantes?</li>
    </ul>
    <p>As citações dos três testadores cobrem os três eixos sob perspectivas bem diferentes.</p>
        """,
        "internal_links": [
            ("/pt-br/jogo-de-territorio.html", "Jogo de território real"),
            ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
            ("/pt-br/jogo-de-gps-avaliacoes.html", "Avaliações jogo de GPS"),
            ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
        ],
    },
    {
        "slug": "/pt-br/pokemon-go-sem-fake-gps-avaliacoes.html",
        "breadcrumb": "Pokémon GO sem fake GPS avaliações",
        "title": "Pokémon GO sem fake GPS avaliações: teste honesto",
        "og_title": "Pokémon GO sem fake GPS: avaliações da beta",
        "meta": "Avaliações de alternativa Pokémon GO sem fake GPS: testadores beta relatam por que o jogo elimina a necessidade de PGSharp, MocPOGO ou iMyFone.",
        "keywords": "pokemon go sem fake gps avaliacoes, alternativa sem cheat avaliacoes, mapraiders teste anti-cheat",
        "h1_html": 'Pokémon GO sem fake GPS: <em>avaliações honestas</em>',
        "lead": "Pokémon GO no Brasil tem um problema. Muita gente recorre a fake GPS. Como é jogar um GPS MMO que elimina essa necessidade na raiz? Três testadores beta respondem.",
        "intro_label": "Anti-cheat por design",
        "intro_title": "Por que <em>fake GPS deixa de fazer sentido</em>",
        "intro_body": """
    <p>Os três testadores beta avaliaram o argumento anti-fake-GPS sob ângulos práticos:</p>
    <ul>
      <li><strong>Densidade de spawn.</strong> O jogo funciona em bairro periférico ou interior?</li>
      <li><strong>Justiça.</strong> Quem está em São Paulo capital tem vantagem sobre quem está em Manaus?</li>
      <li><strong>Atratividade ética.</strong> Por que parar com PGSharp / MocPOGO / iMyFone?</li>
      <li><strong>Risco de banimento.</strong> Como o MapRaiders detecta e trata trapaça?</li>
    </ul>
        """,
        "internal_links": [
            ("/pt-br/pokemon-go-sem-fake-gps.html", "Pokémon GO sem fake GPS"),
            ("/pt-br/alternativa-pokemon-go-gratis.html", "Alternativa Pokémon GO grátis"),
            ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
            ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
        ],
    },
    {
        "slug": "/pt-br/app-caminhada-vale-a-pena.html",
        "breadcrumb": "App de caminhada vale a pena?",
        "title": "App de caminhada com jogo vale a pena? Teste real",
        "og_title": "App de caminhada com jogo: vale a pena no dia a dia?",
        "meta": "App de caminhada com jogo vale a pena? Testadores beta relatam motivação cardio, bateria em rotas longas e perda de território após pausa por doença.",
        "keywords": "app de caminhada vale a pena, app caminhada com jogo avaliacoes, cardio app teste",
        "h1_html": 'App de caminhada com jogo: <em>vale a pena?</em>',
        "lead": "O que acontece com a motivação de caminhar quando cada percurso defende terra real? Como se sente o primeiro Decay depois de uma pausa por gripe? Três testadores beta respondem: uma corredora, um walker, um explorador urbano.",
        "intro_label": "Eixos do teste",
        "intro_title": "O que um <em>app de caminhada</em> precisa entregar",
        "intro_body": """
    <p>Testamos a vivência de caminhada em três eixos:</p>
    <ul>
      <li><strong>Âncora de motivação.</strong> Quando alguém retorna após uma pausa?</li>
      <li><strong>Bateria em rota longa.</strong> Trajetos de 60-90 minutos sem esgotar o celular.</li>
      <li><strong>Cross-modalidade.</strong> Funciona igual para corrida, walking e passeio com cachorro?</li>
    </ul>
        """,
        "internal_links": [
            ("/pt-br/app-caminhada-com-jogo.html", "App de caminhada com jogo"),
            ("/pt-br/jogo-passear-cachorro.html", "Jogo passear cachorro"),
            ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
            ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
        ],
    },
    {
        "slug": "/pt-br/caca-ao-tesouro-app-avaliacoes.html",
        "breadcrumb": "Caça ao tesouro app avaliações",
        "title": "Caça ao tesouro app avaliações: testadores beta no MapRaiders",
        "og_title": "Caça ao tesouro app: avaliações reais da beta",
        "meta": "Avaliações de app de caça ao tesouro sem comprar tour nem preparação: testadores beta relatam como o MapRaiders transforma a cidade inteira em caça ao tesouro ao vivo.",
        "keywords": "caca ao tesouro app avaliacoes, caca ao tesouro app teste, live caca tesouro avaliacoes, familia caca tesouro",
        "h1_html": 'Caça ao tesouro app: <em>avaliações</em> sem comprar tour',
        "lead": "A maioria dos apps de caça ao tesouro exige preparação: comprar tour, planejar rota, montar estações. Como é quando a cidade inteira já vem cheia de pistas? Três testadores beta respondem.",
        "intro_label": "A pergunta do teste",
        "intro_title": "Funciona uma <em>caça ao tesouro ao vivo</em> sem preparação?",
        "intro_body": """
    <p>Testamos as funções de caça ao tesouro em três cenários:</p>
    <ul>
      <li><strong>Sozinho</strong> como explorador urbano (Aljoscha P.): deixar Echos, encontrar Echos.</li>
      <li><strong>Com cachorro</strong> em passeio normal (Ron C.): pistas como subproduto do passeio.</li>
      <li><strong>Cenário familiar</strong> simulado: em quanto tempo adultos e crianças entendem a mecânica?</li>
    </ul>
        """,
        "internal_links": [
            ("/pt-br/caca-ao-tesouro-app.html", "Caça ao tesouro app"),
            ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
            ("/pt-br/jogo-de-territorio.html", "Jogo de território real"),
            ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
        ],
    },
    {
        "slug": "/pt-br/jogo-passear-cachorro-avaliacoes.html",
        "breadcrumb": "Jogo passear cachorro avaliações",
        "title": "Jogo passear cachorro avaliações: tutores beta relatam",
        "og_title": "Jogo passear cachorro: avaliações reais",
        "meta": "Avaliações de jogo de passear cachorro: tutores beta relatam como o MapRaiders transforma o passeio diário em conquista de território e comunidade local.",
        "keywords": "jogo passear cachorro avaliacoes, app passear cachorro teste, jogo cachorro gps avaliacoes",
        "h1_html": 'Jogo passear cachorro: <em>avaliações</em> de tutores',
        "lead": "Como é gamificar o passeio diário sem distrair o cachorro? Como se forma comunidade pet num bairro em que os tutores não se conhecem? Tutores beta respondem.",
        "intro_label": "Eixos do teste",
        "intro_title": "O que um <em>jogo de passear cachorro</em> precisa respeitar",
        "intro_body": """
    <p>Testamos o uso pet-friendly em três eixos:</p>
    <ul>
      <li><strong>Atenção ao pet.</strong> O app distrai do cachorro?</li>
      <li><strong>Ritmo do animal.</strong> Funciona com cachorro pequeno, idoso, lento?</li>
      <li><strong>Comunidade local.</strong> Tutores conseguem se conectar sem rede social paralela?</li>
    </ul>
        """,
        "internal_links": [
            ("/pt-br/jogo-passear-cachorro.html", "Jogo passear cachorro"),
            ("/pt-br/app-caminhada-com-jogo.html", "App de caminhada com jogo"),
            ("/pt-br/jogo-de-gps.html", "Melhor jogo de GPS 2026"),
            ("/pt-br/mapraiders-avaliacoes.html", "Todas as avaliações"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/pt-br/mapraiders-avaliacoes.html",
    "breadcrumb": "MapRaiders avaliações",
    "title": "MapRaiders avaliações: beta-tests, fundador, todas as páginas",
    "og_title": "MapRaiders avaliações: tudo num só lugar",
    "meta": "MapRaiders avaliações: 5,0 de 5 estrelas em três beta-tests verificados, mensagem do fundador, todas as páginas Killer e relatos de avaliação centralmente linkados.",
    "keywords": "mapraiders avaliacoes, mapraiders avaliacao, mapraiders teste, gps mmo avaliacoes brasil",
    "badge": "Hub & Visão geral",
    "pricing_pill": "5,0 / 5 a partir de três avaliações verificadas da beta",
    "h1_html": '<em>MapRaiders avaliações</em>: tudo sobre o GPS MMO num só lugar',
    "lead": "Três testadores beta de Stuttgart, Hamburgo e Berlim. Sete tópicos Killer, da comparação com Pokémon GO ao app de caça ao tesouro. Sete avaliações detalhadas. Um hub.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "O que é MapRaiders, afinal?",
         "a": "O MapRaiders é um GPS MMO para Android. Os jogadores conquistam territórios reais andando, deixam Echos, criam missões e defendem sua terra com mini-jogos. Sem propaganda, compatível com a LGPD, gratuito. Pagamento via PIX para cosméticos."},
        {"q": "Quantos testadores beta são?",
         "a": "Tornamos públicas três pessoas, com consentimento delas, usando primeiro nome e inicial por motivos de privacidade. A beta fechada como um todo é maior; os três citados representam as personas principais."},
        {"q": "As avaliações são reais?",
         "a": "Sim. Os três testadores são pessoas reais da beta fechada na Alemanha. Não foram pagos; as citações foram escritas originalmente em alemão e traduzidas para o português brasileiro. No markup Schema.org estão marcadas com data, idioma e referência ao original alemão (translationOfWork)."},
        {"q": "Onde posso ser testador beta no Brasil?",
         "a": "Cadastre-se na página inicial brasileira com o seu e-mail. Vagas de beta brasileiras serão liberadas em ondas depois do lançamento principal. Prioridade para tutores de cachorro, corredores e exploradores urbanos de cidades com baixa densidade de Pokémon GO."},
        {"q": "Quando o app sai oficialmente no Brasil?",
         "a": "O MapRaiders está em beta fechada no Google Play (Alemanha). O lançamento brasileiro oficial está previsto para o inverno de 2026 (julho/agosto no Brasil). iOS no terceiro trimestre de 2026."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print("=== Phase 1 Session 2 — PT-BR Killer-URL Builder ===")
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
        print(f"  pt-br/{n}")


if __name__ == "__main__":
    main()

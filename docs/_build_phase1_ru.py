#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session - RU Killer-URL Builder
Generates 15 RU pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_RU_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_ru.py
Idempotent: overwrites existing files in docs/ru/.

RU-Spezial:
- Diaspora-First (25M+ russisch-sprachig auserhalb RU).
- Pokemon GO ist offiziell ABGESCHALTET in Russland seit Maerz 2022 (Refugee-Frame K3).
- Saudi-PIF-Acquisition Maerz 2025 als Trust-Verlust-Hook.
- Draconius Go (RU-lokaler Konkurrent, Pixonic/MyGames) als respektvoller Komplement-Vergleich.
- Telegram primary sharing (RU #1) + VKontakte als Sekundaer.
- RU-reviews are translations from DE originals - Schema marks via translationOfWork.
- Pricing dual: USD-Diaspora + RUB-Domestic, beide ausgewiesen.
- Pill: "Iz zakrytoy bety" / "Из закрытой беты".
"""

import json
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
RU_DIR = DOCS / "ru"
SITE = "https://mapraiders.com"
LANG = "ru"

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
# REUSABLE BLOCKS - Master-Plan RU §1.2 + §1.4
# -----------------------------------------------------------------------------

TESTER_RON = {
    "name": "Ron C.",
    "role": "Владелец собаки · район Штутгарта, Германия",
    "role_long": "Владелец собаки из района Штутгарта, Германия (закрытая бета)",
    "quote": "Моя собака обожает прогулку — а я обожаю, что каждая прогулка делает мой район виднее на карте. Уже захватил всю свою улицу.",
    "date": "2026-03-15",
    "id_ru": "review-ron-c-ru",
    "id_de": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "Бегунья · район Гамбурга, Германия",
    "role_long": "Бегунья из района Гамбурга, Германия (закрытая бета)",
    "quote": "Я и так бегаю каждое утро. С MapRaiders у каждого маршрута цель: удержать территорию или вернуть её. Кардио-мотивация взорвалась.",
    "date": "2026-03-22",
    "id_ru": "review-vivian-n-ru",
    "id_de": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "Городской исследователь · район Берлина, Германия",
    "role_long": "Городской исследователь из района Берлина, Германия (закрытая бета)",
    "quote": "Оставлять Эхо и смотреть, кто их находит — как открытая охота за сокровищами по всему городу.",
    "date": "2026-04-01",
    "id_ru": "review-aljoscha-p-ru",
    "id_de": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "Я был одним из разочарованных игроков Pokémon GO. Хотел настоящую территорию, "
    "а не мимолётный захват зала. Не хотел продавать свои шаги саудовским суверенным "
    "фондам — никакой рекламы, никаких обязательных премиум-подписок. Поэтому я создал "
    "MapRaiders. Это моё домашнее поле — и оно скоро станет вашим."
)

# Pricing RU (Master-Plan §1.1) - dual: USD-Diaspora + RUB-Domestic
PRICING_OFFERS = [
    {"name": "Бесплатно навсегда", "price": "0", "currency": "USD"},
    {"name": "Косметика IAP от", "price": "1.99", "currency": "USD"},
    {"name": "MapRaiders Поддержка (подписка)", "price": "4.99", "currency": "USD"},
    {"name": "Пожизненная Поддержка", "price": "99.00", "currency": "USD"},
    {"name": "Бесплатно навсегда (RU)", "price": "0", "currency": "RUB"},
    {"name": "Косметика IAP от (RU)", "price": "199", "currency": "RUB"},
    {"name": "MapRaiders Поддержка / мес (RU)", "price": "499", "currency": "RUB"},
    {"name": "Пожизненная Поддержка (RU)", "price": "9990", "currency": "RUB"},
]

# DefinedTermSet RU (Master-Plan §8)
DEFINED_TERMS = [
    ("Территория", "Захваченная область на карте, постоянно закреплённая за игроком или кланом"),
    ("Эхо", "Аудио-, фото- или видео-сигнал, оставленный игроком в реальном месте, который другие игроки могут найти"),
    ("Мини-игра защиты", "Мини-игра (крестики-нолики, камень-ножницы-бумага, мини-шахматы), запускаемая при оспаривании территории"),
    ("Миссия", "Мини-задание, созданное игроком, которое другие могут выполнить в реальном мире"),
    ("Клан", "Органически сформированная группа игроков, которая удерживает и защищает территории вместе"),
    ("Распад территории", "Механика, при которой заброшенные территории со временем уменьшаются и снова становятся доступны для захвата"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """slug e.g. '/ru/igra-territoriy.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "ru":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="ru"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">Из закрытой беты</div>
        <div class="fr-stars">★★★★★</div>
        <div class="fr-quote">{tester['quote']}</div>
        <div class="fr-author">{tester['name']}</div>
        <div class="fr-role">{tester['role']}</div>
      </div>"""


def testers_section_html(testers):
    cards = "\n".join(tester_card_html(t) for t in testers)
    return f"""<!-- BETA-TESTERY + OSNOVATEL -->
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
    <div class="fr-label">Основатель</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, Основатель MapRaiders" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">Основатель, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">Из закрытой беты</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.6">
      Примечание: тестеры — внутренние участники закрытой беты. По их просьбе используется имя + инициал из соображений приватности. Отзывы оригинально написаны на немецком и переведены на русский; Schema.org помечает это через <code>translationOfWork</code> для прозрачности.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="Поделиться"><span class="mr-share__label">Поделиться:</span><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a><a class="mr-share__btn" href="https://vk.com/share.php?url={enc}" target="_blank" rel="noopener noreferrer">VK</a><a class="mr-share__btn" href="https://wa.me/?text={enc}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/ru/konfidentsialnost.html">Конфиденциальность</a><a href="/ru/usloviya.html">Условия</a><a href="/ru/o-nas.html">О нас</a><a href="/ru/kontakt.html">Контакт</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; Твоя улица, твоя территория. Продукт Scafa Investments LLC.</p>
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
  <a href="/ru/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/ru/#feat" class="lnk">Возможности</a>
    <a href="/ru/mapraiders-otzyvy.html" class="lnk">Отзывы</a>
    <div class="lang-sw">
      <button class="lsw-btn">RU <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('ru')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">Скоро</a>
  </div>
</div>
</nav>"""


def base_css():
    return """*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:hidden}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;font-family:'Outfit','Noto Sans',sans-serif}
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
            "@id": f"#{t['id_ru']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "ru",
            "translationOfWork": {"@type": "Review", "@id": f"#{t['id_de']}", "inLanguage": "de"},
        }
        for t in testers
    ]


def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Главная", "item": f"{SITE}/ru/"},
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
            "inLanguage": "ru",
            "isPartOf": {"@id": f"{SITE}/ru/#website"},
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
            "inLanguage": "ru",
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
            "review": [{"@id": f"#{t['id_ru']}"} for t in page.get("testers", ALL_TESTERS)],
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
            "jobTitle": "Основатель",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-ru",
            "name": "MapRaiders Бренд-Словарь Русский",
            "inLanguage": "ru",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "Главная", "item": f"{SITE}/ru/"},
        {"@type": "ListItem", "position": 2, "name": "Отзывы", "item": f"{SITE}/ru/mapraiders-otzyvy.html"},
        {"@type": "ListItem", "position": 3, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = []
    for t in ALL_TESTERS:
        obj = {
            "@type": "Review",
            "@id": f"#{t['id_ru']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"],
            "datePublished": t["date"],
            "inLanguage": "ru",
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
            "inLanguage": "ru",
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
            "inLanguage": "ru",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "3",
                "bestRating": "5",
            },
            "review": [{"@id": f"#{t['id_ru']}"} for t in ALL_TESTERS],
        },
        *review_objs,
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_hub(page, all_killers, all_twins):
    base = build_schema_killer(page)
    item_list = {
        "@type": "ItemList",
        "@id": f"{SITE}{page['slug']}#itemlist",
        "name": "MapRaiders RU — все killer-страницы и отзывы",
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
  <div class="sec-label rv">FAQ</div>
  <h2 class="sec-title rv d1">Частые <em>вопросы</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">Глубже в <em>игровое поле</em></h2>
  <p class="rv d1">Связанные темы вокруг MapRaiders:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Скоро в Google Play &bull; Бесплатно &bull; Без спама</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">Сообщить о запуске</a>
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
  <span>«{page['trigger']['quote']}»</span>
  <cite>— {page['trigger']['author']}</cite>
</div>"""

    pricing_pill = ""
    if page.get("pricing_pill"):
        pricing_pill = f'<div class="pricing-pill rv">{page["pricing_pill"]}</div>'

    return f"""<!DOCTYPE html>
<html lang="ru" data-theme="light">
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
<meta property="og:locale" content="ru_RU">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Noto+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
    Сообщить о запуске
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
  <div class="sec-label rv">Оценка</div>
  <h2 class="sec-title rv d1">5,0 / 5 — <em>3 проверенных бета-отзыва</em></h2>
  <div class="prose rv d2">
    <p>Три бета-тестера из Германии — владелец собаки, бегунья и городской исследователь — пользовались MapRaiders несколько недель. Отзывы ниже переведены с немецких оригиналов и представляют реальных людей из закрытой беты. Schema.org помечает это через <code>translationOfWork</code> для прозрачности.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="ru" data-theme="light">
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
<meta property="og:locale" content="ru_RU">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Noto+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html(page['slug'])}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">Отзывы</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">Подробнее →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">Отзыв →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">Тематический хаб</div>
  <h2 class="sec-title rv d1">Все <em>темы MapRaiders</em> в одном месте</h2>
  <div class="prose rv d2">
    <p>Здесь собраны 7 killer-страниц и 7 страниц отзывов — от сравнения с Pokémon GO до приложения охоты за сокровищами, от игры территорий до прогулок с собакой. Каждая страница самостоятельна; вместе они дают полную картину.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Подробные отзывы</div>
  <h2 class="sec-title rv d1">Что бета-тестеры рассказывают <em>с разных точек зрения</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">Совокупная оценка</div>
  <h2 class="sec-title rv d1">5,0 / 5 — <em>3 проверенных бета-отзыва</em></h2>
  <div class="prose rv d2">
    <p>Все отзывы — из закрытой бета-фазы февраль-апрель 2026 года. Три тестера — владелец собаки, бегунья, городской исследователь — пользовались MapRaiders на собственных маршрутах в Штутгарте, Гамбурге и Берлине. Отзывы переведены с немецких оригиналов; Schema.org помечает это через <code>translationOfWork</code> для прозрачности.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="ru" data-theme="light">
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
<meta property="og:locale" content="ru_RU">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Noto+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html(page['slug'])}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">MapRaiders Хаб</div>
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

# K1 - igra-territoriy (territoriy = Brand-USP)
K1 = {
    "slug": "/ru/igra-territoriy.html",
    "breadcrumb": "Игра территорий",
    "title": "Игра территорий — захвати настоящую землю на смартфоне",
    "og_title": "Игра территорий — захвати настоящую землю",
    "meta": "Игра территорий MapRaiders — единственное GPS-MMO с настоящим, постоянным владением землёй. Без рекламы, бесплатно, работает везде, где есть GPS — без VPN.",
    "keywords": "игра территорий, захват территории, gps игра, gps mmo на русском, игра районов",
    "badge": "Игра территорий",
    "pricing_pill": "Бесплатно навсегда · Косметика от $1.99 / ₽199",
    "h1_html": 'Захвати свой <em>район.</em>',
    "lead": "MapRaiders — единственная игра территорий, которая превращает реальную GPS-площадь в настоящую территорию. Захватывай шагами, защищай мини-играми, удерживай вместе с кланом. Без рекламы, без P2W, без обязательной премиум-подписки. Работает везде, где есть GPS — без VPN.",
    "trigger": {
        "quote": "Захвати свой район — без VPN, без Pokemon GO, без Saudi.",
        "author": "Бренд-видение MapRaiders"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "Что такое игра территорий?",
            "title": "4 механики настоящей <em>игры территорий</em>",
            "body": """
    <p><strong>Игра территорий</strong> — это жанр, в котором игроки постоянно владеют, защищают и расширяют участки на карте. В отличие от захвата залов в Pokémon GO, здесь основа — <strong>постоянство</strong>: владение сохраняется, даже когда игрок офлайн.</p>
    <p>Четыре ключевые механики настоящей игры территорий:</p>
    <ul>
      <li><strong>Постоянство.</strong> Захваченные участки остаются за игроком или кланом, пока не будут отняты активно.</li>
      <li><strong>Распад территории.</strong> Неактивные территории со временем уменьшаются — никто не блокирует землю навсегда без игры.</li>
      <li><strong>Защита.</strong> При атаке исход решает мини-игра между двумя игроками — а не автоматическое сравнение статов.</li>
      <li><strong>Передача клану.</strong> Территории можно передавать игрокам или клану — экономическая глубина.</li>
    </ul>
            """,
        },
        {
            "label": "Система MapRaiders",
            "title": "<em>Территориальная система</em> MapRaiders",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Захват</h3><p>Иди пешком, с собакой или на велосипеде по улице. GPS-след создаёт территорию на твоё имя — видимый полигон на карте.</p></div>
    <div class="feat-card rv d1"><h3>Движок распада</h3><p>Если территорию не посещать регулярно, она уменьшается на проценты в день. Активность держит землю — не оплата.</p></div>
    <div class="feat-card rv d2"><h3>Мини-игры защиты</h3><p>7 разных мини-игр решают исход атаки: крестики-нолики, камень-ножницы-бумага, мини-шахматы. Стратегия важнее геймтайма.</p></div>
    <div class="feat-card rv d3"><h3>Клановые территории</h3><p>Несколько игроков могут держать территорию вместе. Клановые земли крепче — одиночный нападающий не пробьёт.</p></div>
  </div>""",
        },
        {
            "label": "Чем мы отличаемся от Pokémon GO",
            "title": "Почему Pokémon GO — <em>не настоящая игра территорий</em>",
            "body": """
    <p><strong>Захват зала в Pokémon GO</strong> — мимолётный: тот, кто держит лучшее время несколько часов, получает монеты, но сама территория не является землёй в смысле владения. Зал — это точка, не область.</p>
    <p>К тому же в марте 2022 года Pokémon GO была <strong>официально отключена в России и Беларуси</strong> по решению Niantic — миллионы игроков потеряли доступ за одну ночь. С марта 2025 года Niantic вообще продал свой игровой бизнес саудовскому Public Investment Fund (через Scopely, $3.5 млрд).</p>
    <p>MapRaiders начинается именно здесь: <strong>территория сама и есть игровой ресурс</strong>, а не точка на ней. Ты завоёвываешь землю, теряешь землю, передаёшь землю — как в настоящей пространственной игре. И мы работаем независимо: ни Niantic, ни саудовский фонд, ни обязательной серверной зависимости от одного государства.</p>
            """,
        },
    ],
    "faq": [
        {"q": "Как работает территориальная система в MapRaiders?",
         "a": "Ты физически проходишь по улицам и захватываешь GPS-области. Эти территории появляются на живой карте и принадлежат тебе — пока другой игрок не придёт и не бросит вызов. Если ты успешно защищаешь, область остаётся твоей."},
        {"q": "Можно ли потерять территорию?",
         "a": "Да. Система распада обеспечивает уменьшение неактивных областей каждый день. Активные игроки, которые регулярно посещают свой район, удерживают его. Те, кто бросает, теряют. Это поддерживает карту живой."},
        {"q": "Что происходит при атаке на территорию?",
         "a": "Атакующий должен физически прийти к твоей территории. Затем запускается интерактивная мини-игра — защитник и атакующий играют друг против друга. Победитель мини-игры решает судьбу области."},
        {"q": "Есть ли система клановых территорий?",
         "a": "Да. Кланы в MapRaiders формируются органически и могут совместно владеть территориями. Клановые области сильнее и требуют нескольких атакующих. Командная работа окупается."},
        {"q": "Игра территорий бесплатная?",
         "a": "Да. Весь территориальный геймплей бесплатен. По желанию доступна косметика (от $1.99 / ₽199) для дизайна маркеров и цветов территорий — она не даёт игровых преимуществ."},
    ],
    "internal_links": [
        ("/ru/geo-igra.html", "Гео-игры — сравнение 7 GPS-игр"),
        ("/ru/zamenitel-pokemon-go.html", "Заменитель Pokémon GO в России"),
        ("/ru/prilozhenie-progulki-s-igroy.html", "Приложение прогулки с игрой"),
        ("/ru/igra-territoriy-otzyvy.html", "Отзывы об игре территорий"),
        ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
    ],
}

# K2 - geo-igra (Volumen-King)
K2 = {
    "slug": "/ru/geo-igra.html",
    "breadcrumb": "Гео-игра",
    "title": "Локационная игра 2026 — 7 GPS-игр для России",
    "og_title": "Гео-игра 2026 — 7 GPS-игр сравнение",
    "meta": "Лучшие гео-игры и локационные игры 2026: сравнение 7 GPS-игр (MapRaiders, Draconius Go, Geocaching, Pikmin Bloom, Orna и др.) для русскоговорящих игроков. Без VPN.",
    "keywords": "гео игра, локационная игра, gps игра, geo игра 2026, gps mmo, лучшие gps игры, locative game",
    "badge": "Сравнение GPS-игр",
    "pricing_pill": "MapRaiders бесплатно · Без VPN · Без Saudi",
    "h1_html": 'Локационная игра 2026 — <em>7 GPS-игр</em> для России и диаспоры',
    "lead": "После того как Pokémon GO ушёл из России в марте 2022 года, многие игроки ищут альтернативы. Мы сравнили 7 актуальных гео-игр — какая работает без VPN, какая бесплатна, какая даёт настоящую территорию. Прозрачное сравнение, без переписанных пресс-релизов.",
    "trigger": {
        "quote": "Pokemon GO ушёл из России в 2022. MapRaiders работает везде.",
        "author": "Триггер RU-Diaspora"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Что такое гео-игра?",
            "title": "<em>Гео-игра</em> и <em>локационная игра</em> — определение",
            "body": """
    <p><strong>Гео-игра (локационная игра)</strong> использует GPS-позицию устройства как основную игровую механику. Три классических элемента:</p>
    <ul>
      <li><strong>GPS-триггеры.</strong> Достигаешь координаты — что-то происходит: появляется предмет, начинается событие, захватывается территория.</li>
      <li><strong>Гео-зоны.</strong> Невидимые области на карте (парки, площади, кварталы), работающие как игровые зоны.</li>
      <li><strong>Слой карты.</strong> Видимый игровой контент (Эхо, метки, территории) лежит поверх реального OpenStreetMap-мира.</li>
    </ul>
    <p>Гео-игра — это не просто игра с картой. Это игра, где <strong>реальное движение</strong> игрока меняет состояние игры.</p>
            """,
        },
        {
            "label": "Сравнение",
            "title": "7 <em>GPS-игр 2026</em> — что работает в России",
            "body": "<p>Мы сравнили 7 главных гео-игр по 4 критериям, важным для русскоговорящего игрока: работает ли без VPN, есть ли реальная территория, бесплатно ли играть, кто владелец проекта.</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Игра</th><th>Без VPN в РФ</th><th>Реальная территория</th><th>Бесплатно</th><th>Владелец</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">MapRaiders</td><td class="check">✓</td><td class="check">✓ постоянная</td><td class="check">✓</td><td>Scafa Investments LLC (независимая)</td></tr>
      <tr><td class="feat-name">Draconius Go</td><td class="check">✓ (российский разработчик)</td><td class="cross">Нет, существа</td><td class="check">F2P + IAP</td><td>Pixonic / MyGames (RU)</td></tr>
      <tr><td class="feat-name">Geocaching</td><td class="check">✓</td><td class="cross">Тайники, не земля</td><td>Премиум</td><td>Groundspeak (US)</td></tr>
      <tr><td class="feat-name">Pokémon GO</td><td class="cross">— отключён в РФ с 03.2022</td><td class="cross">Залы, не территория</td><td class="cross">P2W</td><td class="cross">Niantic / Scopely (Saudi-PIF)</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td class="cross">— ограничения</td><td class="cross">✗</td><td>F2P + IAP</td><td class="cross">Niantic / Scopely</td></tr>
      <tr><td class="feat-name">Orna</td><td class="check">✓</td><td class="cross">RPG-локации</td><td class="check">✓</td><td>Northern Forge Studios</td></tr>
      <tr><td class="feat-name">Walkr</td><td class="check">✓</td><td class="cross">Шаги-космос</td><td class="check">✓</td><td>Fourdesire (TW)</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "В чём отличие MapRaiders",
            "title": "Что делает MapRaiders <em>уникальным</em> среди гео-игр",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Настоящая территория</h3><p>Не точка на карте, а полигон. Захватил улицу шагами — она твоя, пока ты её защищаешь.</p></div>
    <div class="feat-card rv d1"><h3>Без VPN</h3><p>Работает везде, где есть GPS. Не зависит от санкционных решений Niantic или другого западного игрока.</p></div>
    <div class="feat-card rv d2"><h3>Без AR</h3><p>Только GPS и карта — нет камеры, нет жора батареи. 4× больше времени работы по сравнению с Pokémon GO.</p></div>
    <div class="feat-card rv d3"><h3>Независимость</h3><p>Не Niantic, не Scopely, не Saudi-PIF. Частная LLC во Флориде, разрабатывается небольшой независимой командой.</p></div>
  </div>""",
        },
        {
            "label": "Сценарии",
            "title": "Локационная игра <em>в реальной жизни</em>",
            "body": """
    <p>В крупных городах России и диаспоры MapRaiders играется по-разному:</p>
    <ul>
      <li><strong>Москва, Санкт-Петербург.</strong> Высокая плотность улиц, постоянные пограничные споры между кланами в центральных округах.</li>
      <li><strong>Берлин (русскоязычная диаспора).</strong> Друзья из Шарлоттенбурга и Пренцлауэр-Берг строят сети Эхо вокруг русских кафе и продуктовых.</li>
      <li><strong>Тель-Авив, Нью-Йорк.</strong> Прибрежные пробежки превращаются в защиту длинных линий территорий.</li>
      <li><strong>Алматы, Таллин.</strong> Меньшие города дают огромные территории каждому активному игроку — и быстрее формируются кланы.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Какие гео-игры работают в России без VPN в 2026?",
         "a": "MapRaiders, Draconius Go (российский разработчик), Geocaching, Orna и Walkr работают без VPN. Pokémon GO и Pikmin Bloom официально отключены или ограничены в РФ с 2022 года из-за санкций Niantic."},
        {"q": "Какая GPS-игра лучшая для бега?",
         "a": "MapRaiders разработан с фокусом на маршруты — каждая пробежка превращается в захват или удержание территории. Strava тоже хорошая, но это трекер, не игра. Можно использовать обе параллельно."},
        {"q": "Что лучше: Draconius Go или MapRaiders?",
         "a": "Это разные жанры. Draconius Go — собирай существ, как Pokémon GO. MapRaiders — захватывай настоящие территории и защищай мини-играми. Многие играют в обе одновременно. Если хочется собирать монстров — Draconius. Если хочется реальной земли — MapRaiders."},
        {"q": "Сколько стоит MapRaiders?",
         "a": "Основной геймплей бесплатный навсегда. Опциональная косметика стоит $1.99–$9.99 (или ₽199–₽999) — она не даёт игровых преимуществ. Без принудительной подписки, без Battle Pass."},
        {"q": "Кто владеет MapRaiders?",
         "a": "Scafa Investments LLC, частная компания во Флориде, США. Не связана с Niantic, Scopely, Saudi-PIF или другими крупными игроками. Основатель — René Scafarti."},
    ],
    "internal_links": [
        ("/ru/igra-territoriy.html", "Игра территорий"),
        ("/ru/zamenitel-pokemon-go.html", "Заменитель Pokémon GO"),
        ("/ru/draconius-go-alternativa.html", "Draconius Go альтернатива"),
        ("/ru/prilozhenie-progulki-s-igroy.html", "Приложение прогулки с игрой"),
        ("/ru/iskat-klad-prilozhenie.html", "Искать клад приложение"),
        ("/ru/pokemon-go-saudi-alternativa.html", "Pokémon GO Saudi альтернатива"),
        ("/ru/geo-igra-otzyvy.html", "Отзывы о гео-игре"),
        ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
    ],
}

# K3 - zamenitel-pokemon-go (RU-EXKLUSIV: Refugee-Frame!)
K3 = {
    "slug": "/ru/zamenitel-pokemon-go.html",
    "breadcrumb": "Заменитель Pokémon GO",
    "title": "Заменитель Pokemon GO — работает в России без VPN",
    "og_title": "Заменитель Pokemon GO — работает без VPN",
    "meta": "Pokemon GO ушёл из России в 2022. MapRaiders работает везде, где есть GPS — без VPN, без Niantic, без Saudi-PIF. Бесплатный заменитель с настоящими территориями.",
    "keywords": "заменитель pokemon go, замена покемон го, pokemon go в россии, pokemon go альтернатива русский, pokemon go без vpn",
    "badge": "Заменитель Pokémon GO",
    "pricing_pill": "Бесплатно · Без VPN · Без Niantic",
    "h1_html": 'Заменитель Pokémon GO — <em>работает в России</em> без VPN',
    "lead": "В марте 2022 года Niantic официально отключил Pokémon GO в России и Беларуси. Миллионы игроков остались без любимой игры — и без удобного решения. MapRaiders заполняет эту пустоту: настоящая территория вместо мимолётных залов, работает везде, где есть GPS — без VPN, без зависимости от одного западного издателя.",
    "trigger": {
        "quote": "Pokemon GO ушёл из России в 2022. MapRaiders работает везде.",
        "author": "Триггер RU-Refugee"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Что произошло",
            "title": "Pokémon GO в России — <em>что произошло в марте 2022</em>",
            "body": """
    <p>В марте 2022 года Niantic Inc., разработчик Pokémon GO, официально <strong>прекратил работу игры в России и Беларуси</strong>. Заявление компании ссылалось на санкционную ситуацию и общественное давление. Конкретно это означало:</p>
    <ul>
      <li><strong>Отключение серверов</strong> для российских и белорусских аккаунтов.</li>
      <li><strong>Прекращение покупок в App Store / Google Play</strong> через российские способы оплаты.</li>
      <li><strong>Удаление приложения</strong> из локальных магазинов приложений.</li>
      <li><strong>VPN не помогает надёжно</strong> — Niantic использует определение IP-региона + биллинг-страны.</li>
    </ul>
    <p>Многие игроки потеряли годы прогресса — покемонов, инвестиции в Battle Pass, локальные сообщества. Возврата средств для большинства не было.</p>
            """,
        },
        {
            "label": "Почему заменитель?",
            "title": "Почему игроки в РФ ищут <em>заменитель</em> Pokémon GO",
            "body": """
    <p>Четыре главные причины:</p>
    <ul>
      <li><strong>Доступность.</strong> Хочется играть в гео-игру без VPN-танцев каждый запуск.</li>
      <li><strong>Устойчивость.</strong> Не зависеть от санкционных решений одного западного издателя — игра не должна снова исчезнуть за одну ночь.</li>
      <li><strong>Реальная территория.</strong> После 6 лет залов хочется чего-то более глубокого — постоянного владения, не мимолётного захвата.</li>
      <li><strong>Доверие.</strong> С марта 2025 года Pokémon GO принадлежит Scopely — дочке саудовского Public Investment Fund. Многие игроки не хотят, чтобы их геолокация шла через эту инфраструктуру.</li>
    </ul>
            """,
        },
        {
            "label": "Решение MapRaiders",
            "title": "MapRaiders как <em>настоящий заменитель</em> — что меняется",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Работает везде, где есть GPS</h3><p>Никаких санкций, никаких регион-блокировок. Открыл приложение — играешь.</p></div>
    <div class="feat-card rv d1"><h3>Реальные территории, не залы</h3><p>Захватил улицу шагами — она твоя на месяцы. Постоянство вместо мимолётного захвата.</p></div>
    <div class="feat-card rv d2"><h3>Без AR — без жора батареи</h3><p>Только GPS и карта. 4× дольше работает на длинных маршрутах. Не сажает телефон до конца рабочего дня.</p></div>
    <div class="feat-card rv d3"><h3>Независимый разработчик</h3><p>Scafa Investments LLC — частная компания во Флориде. Не Niantic, не Scopely, не Saudi-PIF. Не зависит от санкционных решений одного государства.</p></div>
  </div>""",
        },
        {
            "label": "Что отличается",
            "title": "MapRaiders vs Pokémon GO — <em>в чём разница</em> для российского игрока",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Аспект</th><th>Pokémon GO в РФ (после 03.2022)</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Доступность</td><td class="cross">Только через VPN, нестабильно</td><td class="check">Работает напрямую, везде где есть GPS</td></tr>
      <tr><td class="feat-name">Игровая ресурс</td><td>Залы (мимолётный захват)</td><td class="check">Территории (постоянное владение)</td></tr>
      <tr><td class="feat-name">AR</td><td class="cross">Да — жор батареи</td><td class="check">Нет — только GPS</td></tr>
      <tr><td class="feat-name">Владелец</td><td class="cross">Niantic / Scopely (Saudi-PIF)</td><td class="check">Scafa Investments LLC (частная, US)</td></tr>
      <tr><td class="feat-name">Бизнес-модель</td><td class="cross">P2W, Battle Pass, Remote-Raid-Pass</td><td class="check">Free Forever + опциональная косметика</td></tr>
      <tr><td class="feat-name">Подписка</td><td>Не обязательно, но сильно стимулируется</td><td class="check">Опционально, без игровых преимуществ</td></tr>
    </tbody>
  </table>""",
        },
    ],
    "faq": [
        {"q": "Pokémon GO правда не работает в России?",
         "a": "С марта 2022 года Niantic официально прекратил поддержку игры в России и Беларуси. Серверы для российских аккаунтов отключены, приложение удалено из локальных магазинов. VPN иногда помогает, но Niantic проверяет IP-регион + биллинг — нестабильно."},
        {"q": "MapRaiders точно работает в России без VPN?",
         "a": "Да. MapRaiders — независимый проект Scafa Investments LLC, не зависит от санкционных решений Niantic или другого западного издателя. Серверы доступны напрямую через GPS — никакого региональный блокировки."},
        {"q": "Что будет с моим прогрессом из Pokémon GO?",
         "a": "К сожалению, ничего — Niantic заблокировал российские аккаунты в 2022. MapRaiders начинается с чистого листа, но захват настоящих территорий и кланы строятся быстрее, чем коллекция покемонов."},
        {"q": "Это бесплатно?",
         "a": "Да. Весь основной геймплей — захват территорий, Эхо, миссии, кланы, мини-игры защиты — навсегда бесплатен. Опциональная косметика от $1.99 / ₽199, она не даёт игровых преимуществ."},
        {"q": "Кто владеет MapRaiders? Это саудовцы?",
         "a": "Нет. MapRaiders принадлежит Scafa Investments LLC — частной компании во Флориде, США. Не Niantic, не Scopely, не Public Investment Fund Саудовской Аравии. Основатель — René Scafarti."},
    ],
    "internal_links": [
        ("/ru/igra-territoriy.html", "Игра территорий — что это"),
        ("/ru/geo-igra.html", "Сравнение 7 GPS-игр"),
        ("/ru/draconius-go-alternativa.html", "Draconius Go альтернатива"),
        ("/ru/pokemon-go-saudi-alternativa.html", "Pokémon GO Saudi альтернатива"),
        ("/ru/zamenitel-pokemon-go-otzyvy.html", "Отзывы о заменителе"),
        ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
    ],
}

# K4 - draconius-go-alternativa (RU-EXKLUSIV: Lokal-Konkurrent)
K4 = {
    "slug": "/ru/draconius-go-alternativa.html",
    "breadcrumb": "Draconius Go альтернатива",
    "title": "Draconius Go альтернатива — глубже, с территориями",
    "og_title": "Draconius Go альтернатива — настоящие территории",
    "meta": "Draconius Go альтернатива: MapRaiders глубже, с настоящими территориями, клан-битвами, мини-играми защиты. Бесплатно. Можно играть в обе одновременно — они дополняют друг друга.",
    "keywords": "draconius go альтернатива, draconius go аналог, gps mmo россия, российский gps игра, гео игра рпг",
    "badge": "Draconius Go альтернатива",
    "pricing_pill": "Бесплатно · Дополняет Draconius Go",
    "h1_html": '<em>Draconius Go альтернатива</em> — настоящие территории + клан-битвы',
    "lead": "Draconius Go от российского разработчика Pixonic — отличная гео-игра в стиле сбора существ. MapRaiders — другая игровая логика: настоящие территории на карте, мини-игры защиты, кланы из соседей. Не конкурент, а дополнение для тех, кто хочет больше глубины. Можно играть в обе одновременно.",
    "trigger": {
        "quote": "Глубже Draconius Go — настоящие территории + клан-битвы.",
        "author": "Триггер RU-Local-Konkurrent"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "Что хорошо в Draconius Go",
            "title": "Draconius Go — <em>что у проекта получилось</em>",
            "body": """
    <p>Сразу скажем честно: <strong>Draconius Go от Elyland (бывшая Pixonic, входит в MyGames / Mail.Ru) — серьёзный проект</strong>, который успешно занял нишу гео-игры по типу Pokémon GO для русскоговорящих игроков. Что они сделали хорошо:</p>
    <ul>
      <li><strong>Локальный разработчик.</strong> Российская команда, понимает свой рынок, серверы доступны без VPN.</li>
      <li><strong>Сбор существ + крафт.</strong> Глубокая RPG-механика с эволюциями и крафтом — для любителей коллекций.</li>
      <li><strong>AR-режим.</strong> Кто хочет полноценное AR-приключение, в Draconius Go это есть.</li>
      <li><strong>F2P-модель.</strong> Можно играть бесплатно, IAP не обязательно.</li>
    </ul>
    <p>Если ты любишь Pokémon GO именно за коллекционирование существ — Draconius Go покрывает эту потребность лучше, чем MapRaiders.</p>
            """,
        },
        {
            "label": "Что добавляет MapRaiders",
            "title": "Что MapRaiders <em>добавляет сверх</em> Draconius Go",
            "body": "<p>MapRaiders играет в другом жанре. Не лучше — другое. Если в Draconius Go ты собираешь существ, в MapRaiders ты владеешь землёй:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Настоящая территория</h3><p>Не точка на карте, а полигон, который ты захватил шагами и держишь, пока тебя не вытеснят. Постоянное владение вместо коллекции.</p></div>
    <div class="feat-card rv d1"><h3>Мини-игры защиты</h3><p>7 разных мини-игр (крестики-нолики, мини-шахматы, RPS) решают атаки. Стратегия, не статы существ.</p></div>
    <div class="feat-card rv d2"><h3>Органические кланы</h3><p>Кланы образуются из соседей — тех, кто ходит по тем же улицам. Не Discord-сервер, а живая близость.</p></div>
    <div class="feat-card rv d3"><h3>Эхо-система</h3><p>Оставляй аудио, фото, видео в реальных местах. Другие игроки находят их при прохождении мимо. Открытая охота за сокровищами.</p></div>
  </div>""",
        },
        {
            "label": "Сравнение",
            "title": "Draconius Go vs MapRaiders — <em>мягкое сравнение</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Аспект</th><th>Draconius Go</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Жанр</td><td>Сбор существ, гео-RPG</td><td>Захват территорий, гео-MMO</td></tr>
      <tr><td class="feat-name">Игровой ресурс</td><td>Существа, предметы, крафт</td><td>Реальная земля, Эхо, миссии</td></tr>
      <tr><td class="feat-name">AR</td><td>Да</td><td>Нет (экономия батареи)</td></tr>
      <tr><td class="feat-name">Защита</td><td>Бой существами (статы)</td><td>Мини-игры (стратегия)</td></tr>
      <tr><td class="feat-name">Кланы</td><td>Группы по интересам</td><td>Соседи на карте</td></tr>
      <tr><td class="feat-name">Бесплатно</td><td class="check">F2P + IAP</td><td class="check">Free Forever + косметика</td></tr>
      <tr><td class="feat-name">Работает в РФ без VPN</td><td class="check">Да (российский разработчик)</td><td class="check">Да (независимый, US-LLC)</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Можно ли играть в обе?",
            "title": "Можно ли <em>играть в обе одновременно</em>?",
            "body": """
    <p>Да, и это лучший вариант для активного игрока. Они дополняют друг друга:</p>
    <ul>
      <li><strong>Утром Draconius Go.</strong> Собрал существ по дороге на работу, выполнил квест.</li>
      <li><strong>Вечером MapRaiders.</strong> Прошёл свой район, удержал территорию, выиграл мини-игру против атакующего соседа.</li>
      <li><strong>Один GPS, два режима.</strong> Оба работают параллельно на одном устройстве — не конфликтуют.</li>
      <li><strong>Разные эмоции.</strong> Сбор + RPG-прогресс vs владение + защита. Дополняющие потребности.</li>
    </ul>
    <p>Мы не считаем Draconius Go конкурентом. Мы считаем их хорошим соседом по нише.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders — это российская игра, как Draconius Go?",
         "a": "Нет. MapRaiders разработан Scafa Investments LLC (Флорида, США). Но проект независимый, работает в России без VPN, и интерфейс полностью на русском языке. Основатель — René Scafarti."},
        {"q": "Что лучше — Draconius Go или MapRaiders?",
         "a": "Это разные жанры, не конкуренты. Draconius Go — сбор существ + AR + крафт. MapRaiders — захват настоящих территорий + мини-игры защиты + органические кланы. Многие играют в обе одновременно."},
        {"q": "Можно ли играть в обе игры на одном телефоне?",
         "a": "Да. Они используют один GPS-сенсор без конфликтов. Многие игроки запускают MapRaiders в фоне для удержания территории, пока активно играют в Draconius Go."},
        {"q": "В MapRaiders есть AR как в Draconius Go?",
         "a": "Нет, и это сознательное решение. AR требует камеры и сильно сажает батарею. MapRaiders использует только GPS и карту — поэтому работает 4× дольше на одной зарядке."},
        {"q": "MapRaiders бесплатна?",
         "a": "Да. Весь геймплей навсегда бесплатен. Опциональная косметика от $1.99 / ₽199 — не даёт игровых преимуществ. Никакого Battle Pass, никаких обязательных подписок."},
    ],
    "internal_links": [
        ("/ru/igra-territoriy.html", "Игра территорий"),
        ("/ru/geo-igra.html", "Сравнение GPS-игр"),
        ("/ru/zamenitel-pokemon-go.html", "Заменитель Pokémon GO"),
        ("/ru/draconius-go-alternativa-otzyvy.html", "Отзывы о Draconius Go альтернативе"),
        ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
    ],
}

# K5 - prilozhenie-progulki-s-igroy
K5 = {
    "slug": "/ru/prilozhenie-progulki-s-igroy.html",
    "breadcrumb": "Приложение прогулки с игрой",
    "title": "Приложение прогулки с игрой — кардио + территория",
    "og_title": "Приложение прогулки с игрой — кардио + захват",
    "meta": "Приложение прогулки с игрой: MapRaiders превращает каждую пробежку, прогулку с собакой или поездку на велосипеде в захват территории. Бесплатно, без рекламы, экономит батарею.",
    "keywords": "приложение прогулки с игрой, прогулка с собакой приложение, бег с игрой, кардио приложение, ходьба с целью",
    "badge": "Прогулки + Игра",
    "pricing_pill": "Бесплатно · 4× меньше батареи чем Pokémon GO",
    "h1_html": 'Приложение <em>прогулки с игрой</em> — кардио + территория',
    "lead": "Strava даёт статистику. Pokémon GO даёт коллекцию. Но ни одно приложение не превращает твой реальный путь в настоящую землю. MapRaiders — превращает. Каждый шаг формирует территорию, каждая пробежка её защищает. Кардио с последствиями.",
    "trigger": {
        "quote": "Кардио-мотивация взорвалась.",
        "author": "Vivian N., бегунья из района Гамбурга (закрытая бета)"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "Проблема",
            "title": "Почему обычных <em>трекеров недостаточно</em>",
            "body": """
    <p>Strava, Adidas Running, Nike Run Club — отличные трекеры, но трое из четырёх бегунов бросают через 4-6 недель. Почему?</p>
    <ul>
      <li><strong>Нет игрового элемента.</strong> Кто не гонится за рекордами, через месяц теряет мотивацию.</li>
      <li><strong>Давление производительности.</strong> Публичные leaderboard демотивируют больше, чем мотивируют — особенно средних бегунов.</li>
      <li><strong>Платный фарш.</strong> Strava Premium $9.99 / месяц за карты тепла и сравнение маршрутов, без которых бесплатная версия бесполезна.</li>
      <li><strong>Социальная нагрузка.</strong> Друзья видят твой плохой темп — некоторым это давит на психику.</li>
    </ul>
            """,
        },
        {
            "label": "Решение",
            "title": "Как MapRaiders <em>меняет рутину</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Удержание территории</h3><p>Каждая пробежка защищает землю. Если 3 дня пауза — видишь, как Decay начинается. Естественный стимул вернуться.</p></div>
    <div class="feat-card rv d1"><h3>Счётчик распада</h3><p>«Если ты сегодня не пройдёшь, твой район уменьшится на X%». Не вина — физическая реальность.</p></div>
    <div class="feat-card rv d2"><h3>Защита клана во время бега</h3><p>Пока ты бежишь, получаешь push, если на клан-территорию атакуют. Ты бежишь не один — ты бежишь с командой.</p></div>
    <div class="feat-card rv d3"><h3>Награда Эхо</h3><p>Аудио-эхо в местах, где проходишь. Истории других игроков о маршруте — без рекламы, без блогеров.</p></div>
  </div>""",
        },
        {
            "label": "Дополнение Strava",
            "title": "MapRaiders как <em>дополнение Strava</em>",
            "body": """
    <p>Мы не пытаемся заменить Strava — мы пытаемся дать ей причину открываться чаще:</p>
    <ul>
      <li><strong>Strava измеряет.</strong> Темп, пульс, высоту, калории.</li>
      <li><strong>MapRaiders играет.</strong> Захват, защита, мини-игры, кланы.</li>
      <li><strong>Один GPS.</strong> Обе работают параллельно без конфликтов и удвоенного жора батареи.</li>
      <li><strong>Strava-экспорт</strong> на дорожной карте на Q4 2026.</li>
    </ul>
            """,
        },
        {
            "label": "Активная старость 60+",
            "title": "<em>Активная старость 60+</em> — прогулка как ритуал",
            "body": """
    <p>Не только бегуны. Большая аудитория MapRaiders — люди после 60, которые ходят с собакой или просто гуляют:</p>
    <ul>
      <li><strong>Та же прогулка, новый смысл.</strong> Привычный круг превращается в защиту территории.</li>
      <li><strong>Без давления темпа.</strong> Скорость не важна — важна регулярность.</li>
      <li><strong>Сообщество района.</strong> Соседи в кланах — реальные знакомства из утренних встреч.</li>
      <li><strong>Простой UI.</strong> Без сложных настроек, без AR — просто карта и территория.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders подходит для прогулок с собакой?",
         "a": "Очень. Это одна из главных аудиторий. Собака любит свой круг, ты держишь территорию. Привычный ритуал получает игровое измерение без дополнительной нагрузки."},
        {"q": "Сколько времени работает на одной зарядке?",
         "a": "При 2-часовой пробежке расходуется 30-40% батареи (vs ~80% у Pokémon GO с AR). Зависит от телефона и яркости экрана."},
        {"q": "Работает ли с Apple Watch / Fitbit?",
         "a": "Прямой интеграции пока нет. На дорожной карте Q4 2026. Сейчас можно использовать MapRaiders + любой фитнес-трекер на одном устройстве — конфликтов нет."},
        {"q": "Велосипед считается?",
         "a": "Да, до 25 км/ч (выше — система отклоняет как «движение на машине», чтобы не было читов). Велосипед даёт большие территории за одну поездку."},
        {"q": "Сколько данных тратится на час пробежки?",
         "a": "Очень умеренно — 5-15 МБ на час. Без видео, без тяжёлых API. Если выходишь в зону без интернета — GPS продолжит писать трек, синхронизация догонит позже."},
    ],
    "internal_links": [
        ("/ru/igra-territoriy.html", "Игра территорий"),
        ("/ru/geo-igra.html", "Сравнение GPS-игр"),
        ("/ru/pokemon-go-saudi-alternativa.html", "Pokémon GO Saudi альтернатива"),
        ("/ru/prilozhenie-progulki-s-igroy-otzyvy.html", "Отзывы о приложении прогулки"),
        ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
    ],
}

# K6 - iskat-klad-prilozhenie
K6 = {
    "slug": "/ru/iskat-klad-prilozhenie.html",
    "breadcrumb": "Искать клад приложение",
    "title": "Искать клад приложение — целый город — открытая охота",
    "og_title": "Искать клад приложение — открытая охота за сокровищами",
    "meta": "Искать клад приложение MapRaiders: целый город — открытая охота за сокровищами. Эхо других игроков, миссии, никаких платных туров, для семьи и взрослых. Бесплатно.",
    "keywords": "искать клад приложение, охота за сокровищами, geocaching альтернатива, клад приложение русский, городская охота",
    "badge": "Охота за сокровищами",
    "pricing_pill": "Бесплатно · Без покупки туров",
    "h1_html": 'Искать клад приложение — <em>целый город</em>, открытая охота',
    "lead": "Geocaching хорош, но требует Premium-подписку для большинства тайников. MapRaiders переворачивает идею: Эхо других игроков уже разбросаны по всему городу — иди, находи, оставляй свои. Живая охота за сокровищами без подготовки и покупок туров.",
    "trigger": {
        "quote": "Открытая охота за сокровищами по всему городу.",
        "author": "Aljoscha P., городской исследователь из района Берлина (закрытая бета)"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "Что важно",
            "title": "3 критерия <em>современного приложения</em> для поиска клада",
            "body": """
    <p>Поиск клада в 2026 — это не печатные карты с крестиком. Три критерия отличают современное приложение от устаревшего:</p>
    <ul>
      <li><strong>Живое.</strong> Следы появляются в реальном времени — не только в готовых турах.</li>
      <li><strong>Социальное.</strong> Игроки оставляют клады друг для друга, а не только проходят их.</li>
      <li><strong>Без премиум-стены.</strong> Родители + дети заходят сразу, без покупки тура за 4.99$.</li>
    </ul>
            """,
        },
        {
            "label": "Сравнение",
            "title": "Приложения поиска клада <em>в сравнении</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Приложение</th><th>Цена</th><th>Подготовка</th><th>Живой элемент</th><th>Геймплей</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Geocaching</td><td>Premium-подписка</td><td>Низкая — найди тайники</td><td class="cross">Асинхронно</td><td>Сбор</td></tr>
      <tr><td class="feat-name">Actionbound</td><td>Покупка туров</td><td>Высокая — построй тур</td><td class="cross">✗</td><td>За тур</td></tr>
      <tr><td class="feat-name">Pokémon GO</td><td>P2W</td><td>Низкая</td><td class="check">Залы (мимолётно)</td><td>Сбор существ</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">$0</td><td class="check">Ноль</td><td class="check">Живое</td><td>Эхо + миссии + территория</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "Эхо-система",
            "title": "<em>Эхо-система</em> — что это и как работает",
            "body": """
    <p>Вместо линейного тура от пункта 1 до пункта 10 в MapRaiders создаётся <strong>открытая пространственная охота за сокровищами</strong> — весь город превращается в игровое поле:</p>
    <ul>
      <li><strong>Оставляй Эхо.</strong> Аудио, фото или видео в реальном месте. Другие игроки находят, когда проходят мимо.</li>
      <li><strong>Находи Эхо.</strong> На карте видно, где Эхо лежат. Иди по следам, открывай тайны, слушай истории.</li>
      <li><strong>Создавай миссии.</strong> Маленькое задание в локации («Сделай фото красной двери напротив»). Другие выполняют.</li>
      <li><strong>Слой территории.</strong> Кто часто ходит по маршруту охоты, постепенно захватывает его как территорию — следы превращаются в землю.</li>
    </ul>
            """,
        },
        {
            "label": "Семья",
            "title": "Поиск клада для <em>всей семьи</em>",
            "body": """
    <p>Поиск клада — детская классика во многих странах. MapRaiders переносит это в смартфон-эпоху, но без того, чтобы дети сидели одни перед экраном:</p>
    <ul>
      <li><strong>Родитель + ребёнок.</strong> Родители оставляют аудио-Эхо на спланированном маршруте, дети идут по следам — реальная активность с цифровыми подсказками.</li>
      <li><strong>Без экрана в движении.</strong> Приложение ведёт по карте; реальные впечатления — в реальном мире.</li>
      <li><strong>Без таргетированной рекламы.</strong> MapRaiders не таргетирует детей рекламой, не продаёт данные, нет встроенного чата без согласия родителей.</li>
      <li><strong>Многоразовый маршрут.</strong> Один и тот же район можно использовать снова и снова, каждый раз с новыми Эхо.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "Подходит ли MapRaiders для детей?",
         "a": "Да, с 9 лет в сопровождении родителей. Приложение не показывает рекламу, не собирает персональные данные у детей, родители могут включить семейный режим."},
        {"q": "Сколько подготовки нужно для охоты с детьми?",
         "a": "Ноль. В отличие от Actionbound или похожих, не нужно покупать тур или готовить станции. Эхо уже разбросаны по городу — просто идёшь по следам или оставляешь свои."},
        {"q": "Сколько стоит охота за сокровищами в MapRaiders?",
         "a": "Ноль. Все функции охоты (Эхо, миссии) бесплатны навсегда. Опциональная косметика для дизайна маркеров от $1.99 / ₽199 — не даёт игровых преимуществ."},
        {"q": "Работает ли в маленьких городах?",
         "a": "Да. В небольших городах Эхо других игроков меньше, но твой собственный маршрут получает больше пространства — можно построить охоту для своей семьи и соседей."},
        {"q": "Приложение на русском?",
         "a": "Да, MapRaiders полностью локализован на русский — меню, Эхо-система, подсказки, поддержка."},
    ],
    "internal_links": [
        ("/ru/igra-territoriy.html", "Игра территорий"),
        ("/ru/geo-igra.html", "Сравнение GPS-игр"),
        ("/ru/pokemon-go-saudi-alternativa.html", "Pokémon GO Saudi альтернатива"),
        ("/ru/iskat-klad-prilozhenie-otzyvy.html", "Отзывы о приложении поиска клада"),
        ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
    ],
}

# K7 - pokemon-go-saudi-alternativa (Saudi-Asset)
K7 = {
    "slug": "/ru/pokemon-go-saudi-alternativa.html",
    "breadcrumb": "Pokémon GO Saudi альтернатива",
    "title": "Pokemon GO Saudi приватность — независимое приложение",
    "og_title": "Pokémon GO Saudi альтернатива — независимая GPS-игра",
    "meta": "В марте 2025 Niantic продал Pokémon GO саудовскому Public Investment Fund (через Scopely, $3.5 млрд). MapRaiders — независимая альтернатива. Твои шаги не идут саудовскому фонду.",
    "keywords": "pokemon go saudi, pokemon go scopely, pokemon go pif, gps игра без саудовского, pokemon go альтернатива приватность",
    "badge": "Saudi-PIF альтернатива",
    "pricing_pill": "Независимая · Не Saudi-PIF · Не Niantic",
    "h1_html": 'Pokémon GO Saudi альтернатива — <em>независимая GPS-игра</em>',
    "lead": "В марте 2025 года Niantic продал свой игровой бизнес — Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now — за $3.5 миллиарда компании Scopely, дочке саудовского Public Investment Fund. Геолокация 30+ миллионов игроков теперь идёт через инфраструктуру государственного фонда Саудовской Аравии. MapRaiders — альтернатива, которая не находится в этой цепочке.",
    "trigger": {
        "quote": "Ваши шаги не продаются Big Tech — даже саудовскому фонду.",
        "author": "Триггер RU-Saudi-Asset"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Что произошло",
            "title": "Март 2025 — <em>саудовское приобретение</em>",
            "body": """
    <p>В марте 2025 года Niantic Inc., создатель Pokémon GO, продал свой игровой бизнес <strong>Scopely Inc. за $3.5 миллиарда</strong>. В сделку вошли:</p>
    <ul>
      <li><strong>Pokémon GO</strong> — крупнейшая мобильная гео-игра мира.</li>
      <li><strong>Ingress Prime</strong> — оригинальная гео-игра Niantic.</li>
      <li><strong>Pikmin Bloom</strong> — гео-игра с Nintendo.</li>
      <li><strong>Monster Hunter Now</strong> — гео-игра с Capcom.</li>
    </ul>
    <p><strong>Scopely</strong> с 2023 года принадлежит <strong>Savvy Games Group</strong> — игровому подразделению <strong>Public Investment Fund (PIF)</strong>, государственного суверенного фонда Саудовской Аравии. То есть: формально через цепочку владения <strong>геолокация 30+ миллионов игроков теперь обрабатывается инфраструктурой саудовского государственного фонда</strong>.</p>
            """,
        },
        {
            "label": "Что это значит",
            "title": "Что это значит для <em>русскоговорящих игроков</em>",
            "body": """
    <p>Особенно для диаспоры (Берлин, Тель-Авив, Нью-Йорк, Таллин, Алматы) и для игроков в РФ через VPN — есть несколько практических следствий:</p>
    <ul>
      <li><strong>Поток данных.</strong> Где ты бегаешь, когда выгуливаешь собаку, какие маршруты проходишь ежедневно — эта информация проходит через инфраструктуру Scopely.</li>
      <li><strong>Юрисдикция.</strong> Saudi-PIF — государственная структура. Не подпадает под GDPR-защиту, ФЗ-152 РФ или другие региональные законы прозрачности.</li>
      <li><strong>Геополитика.</strong> Многие игроки не хотят, чтобы их маршруты косвенно финансировали государственный фонд другой страны — особенно с её внешней политикой.</li>
      <li><strong>Без альтернативы внутри Niantic.</strong> Все 4 главные гео-игры Niantic теперь принадлежат той же группе.</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders независим",
            "title": "MapRaiders — <em>независимый</em> по структуре",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>Частная LLC</h3><p>Scafa Investments LLC, Флорида, частное владение. Не Niantic, не Scopely, не Saudi-PIF.</p></div>
    <div class="feat-card rv d1"><h3>Без рекламы</h3><p>Нет рекламной сети — нет необходимости агрегировать поведенческие данные для таргетинга.</p></div>
    <div class="feat-card rv d2"><h3>GDPR-сервера</h3><p>Серверы — в ЕС. GDPR-совместимы. Запросы доступа и удаления обрабатываются за 30 дней.</p></div>
    <div class="feat-card rv d3"><h3>Без скрытой подписки</h3><p>Free Forever на основной геймплей. Косметика опциональна и не даёт игровых преимуществ. Нет давления на покупку.</p></div>
  </div>""",
        },
        {
            "label": "Стек владения",
            "title": "<em>Стек владения</em> — кто получает твои данные",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>Игра</th><th>Прямой разработчик</th><th>Конечный владелец</th><th>Юрисдикция</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Pokémon GO (с 03.2025)</td><td>Scopely</td><td class="cross">Saudi-PIF (через Savvy Games)</td><td class="cross">Саудовская Аравия (государственная)</td></tr>
      <tr><td class="feat-name">Ingress (с 03.2025)</td><td>Scopely</td><td class="cross">Saudi-PIF</td><td class="cross">Саудовская Аравия</td></tr>
      <tr><td class="feat-name">Pikmin Bloom (с 03.2025)</td><td>Scopely</td><td class="cross">Saudi-PIF</td><td class="cross">Саудовская Аравия</td></tr>
      <tr><td class="feat-name">Monster Hunter Now (с 03.2025)</td><td>Scopely</td><td class="cross">Saudi-PIF</td><td class="cross">Саудовская Аравия</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">Scafa Investments LLC</td><td class="check">Частное владение</td><td class="check">США (Флорида), серверы — ЕС</td></tr>
    </tbody>
  </table>""",
        },
    ],
    "faq": [
        {"q": "Pokémon GO правда теперь принадлежит Саудовской Аравии?",
         "a": "Косвенно — да. В марте 2025 Niantic продал игровой бизнес Scopely за $3.5 млрд. Scopely с 2023 принадлежит Savvy Games Group, которая на 100% принадлежит Public Investment Fund (PIF) — государственному фонду Саудовской Аравии. Таким образом конечный собственник — государственная структура Саудовской Аравии."},
        {"q": "А что насчёт других игр Niantic?",
         "a": "Все 4 главные гео-игры (Pokémon GO, Ingress, Pikmin Bloom, Monster Hunter Now) перешли к Scopely в той же сделке. То есть весь Niantic-портфель теперь под одним саудовским государственным владельцем."},
        {"q": "Кто владеет MapRaiders?",
         "a": "Scafa Investments LLC — частная компания во Флориде, США. Не Niantic, не Scopely, не Saudi-PIF, не государственная структура. Основатель — René Scafarti."},
        {"q": "Где хранятся мои данные в MapRaiders?",
         "a": "Серверы расположены в ЕС, GDPR-совместимо. Мы не продаём данные рекламным сетям, нет встроенных рекламных SDK. Запросы на доступ и удаление обрабатываются за 30 дней."},
        {"q": "Какие данные собирает MapRaiders?",
         "a": "Только то, что нужно для игры: GPS-трек твоих захватов, аккаунт, статистика территорий. Без собранных контактов, без чтения списка приложений, без скрытого фингерпринтинга."},
    ],
    "internal_links": [
        ("/ru/igra-territoriy.html", "Игра территорий"),
        ("/ru/geo-igra.html", "Сравнение GPS-игр"),
        ("/ru/zamenitel-pokemon-go.html", "Заменитель Pokémon GO"),
        ("/ru/pokemon-go-saudi-alternativa-otzyvy.html", "Отзывы о Saudi-альтернативе"),
        ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA - TWINS (T1-T7) per Master-Plan §2
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/ru/igra-territoriy-otzyvy.html",
        "breadcrumb": "Игра территорий — отзывы",
        "title": "Игра территорий — отзывы бета-тестеров MapRaiders",
        "og_title": "Игра территорий — настоящие отзывы из беты",
        "meta": "Отзывы об игре территорий MapRaiders из закрытой беты: три тестера из Германии рассказывают, как ощущается захват настоящей улицы и первый Decay.",
        "keywords": "игра территорий отзывы, mapraiders отзывы, gps игра тест, бета тестеры",
        "h1_html": 'Игра территорий — <em>отзывы</em> из закрытой беты',
        "lead": "Каково это — впервые захватить улицу шагами? Как реагируешь на первый Decay? Три бета-тестера рассказывают честно — без маркетинга, без блогерских кодов.",
        "intro_label": "Что мы тестировали",
        "intro_title": "Что делает <em>игру территорий</em> ощутимой",
        "intro_body": """
    <p>В тесте игры территорий важны три оси переживаний:</p>
    <ul>
      <li><strong>Захват.</strong> Когда первая собственная улица ощущается как «моя земля»?</li>
      <li><strong>Потеря.</strong> Как реагируешь на первый Decay или потерю атакующему?</li>
      <li><strong>Защита.</strong> Как ощущаются мини-игры защиты — тактично, справедливо, фрустрирующе?</li>
    </ul>
    <p>Цитаты трёх тестеров покрывают все три оси с трёх разных точек зрения.</p>
        """,
        "internal_links": [
            ("/ru/igra-territoriy.html", "Игра территорий"),
            ("/ru/geo-igra.html", "Сравнение GPS-игр"),
            ("/ru/geo-igra-otzyvy.html", "Отзывы о гео-игре"),
            ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
        ],
    },
    {
        "slug": "/ru/geo-igra-otzyvy.html",
        "breadcrumb": "Гео-игра — отзывы",
        "title": "Гео-игра — отзывы и тест MapRaiders",
        "og_title": "Гео-игра — отзывы из беты MapRaiders",
        "meta": "Отзывы о гео-игре MapRaiders из закрытой беты: три тестера из Германии тестировали GPS-точность, расход батареи и игровую механику в реальном городе.",
        "keywords": "гео игра отзывы, gps игра тест, локационная игра отзывы, mapraiders тест",
        "h1_html": 'Гео-игра — <em>отзывы</em> из реальной городской рутины',
        "lead": "Насколько точен GPS в городских каньонах? Сколько батареи съедает приложение на длинных маршрутах? Как ощущается игровая механика, когда город становится игровым полем? Три тестера отвечают.",
        "intro_label": "Оси теста",
        "intro_title": "Что мы тестировали в <em>гео-игре</em>",
        "intro_body": """
    <p>Тест гео-игры шёл по четырём конкретным осям:</p>
    <ul>
      <li><strong>Точность GPS</strong> в городских каньонах и под мостами.</li>
      <li><strong>Расход батареи</strong> на маршрутах 1-2 часа (сравнение с Pokémon GO).</li>
      <li><strong>Чувство приватности</strong> — насколько спокойно использовать приложение?</li>
      <li><strong>Игровая механика</strong> — работают ли территории, Эхо, миссии в реальной рутине?</li>
    </ul>
        """,
        "internal_links": [
            ("/ru/geo-igra.html", "Гео-игра — сравнение GPS-игр"),
            ("/ru/igra-territoriy.html", "Игра территорий"),
            ("/ru/igra-territoriy-otzyvy.html", "Отзывы об игре территорий"),
            ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
        ],
    },
    {
        "slug": "/ru/zamenitel-pokemon-go-otzyvy.html",
        "breadcrumb": "Заменитель Pokémon GO — отзывы",
        "title": "Заменитель Pokémon GO — отзывы из беты",
        "og_title": "Заменитель Pokémon GO — отзывы тестеров",
        "meta": "Отзывы о заменителе Pokémon GO для России: три бета-тестера сравнили MapRaiders с Pokémon GO и рассказали честно — что лучше, что хуже, что иначе.",
        "keywords": "заменитель pokemon go отзывы, pokemon go альтернатива тест, без vpn pokemon go отзывы",
        "h1_html": 'Заменитель Pokémon GO — <em>отзывы</em> для русскоговорящих игроков',
        "lead": "Один из тестеров играл в Pokémon GO с 2018 по 2022, потом потерял аккаунт после блокировки в РФ. Другой никогда не играл в Pokémon GO — только в Ingress. Третий — обычный пользователь без Niantic-фона. Их сравнения честнее любого пресс-релиза.",
        "intro_label": "Кто тестировал",
        "intro_title": "Три перспективы на <em>заменитель Pokémon GO</em>",
        "intro_body": """
    <p>Три тестера дают три ракурса, которые нельзя свести:</p>
    <ul>
      <li><strong>Ron C.</strong> — обычный пользователь, не геймер. Ходит с собакой. Сравнение по простоте входа.</li>
      <li><strong>Vivian N.</strong> — играла в Pokémon GO 2018–2022. Потеряла аккаунт. Сравнение по эмоциональному переходу.</li>
      <li><strong>Aljoscha P.</strong> — Ingress-ветеран, знает Niantic-экосистему изнутри. Сравнение по механике и независимости.</li>
    </ul>
    <p>Все трое тестировали MapRaiders 4-6 недель в обычной рутине — без специальных тест-сессий.</p>
        """,
        "internal_links": [
            ("/ru/zamenitel-pokemon-go.html", "Заменитель Pokémon GO"),
            ("/ru/pokemon-go-saudi-alternativa.html", "Saudi альтернатива"),
            ("/ru/pokemon-go-saudi-alternativa-otzyvy.html", "Отзывы о Saudi-альтернативе"),
            ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
        ],
    },
    {
        "slug": "/ru/draconius-go-alternativa-otzyvy.html",
        "breadcrumb": "Draconius Go альтернатива — отзывы",
        "title": "Draconius Go альтернатива — отзывы тестеров",
        "og_title": "Draconius Go альтернатива — мнения из беты",
        "meta": "Отзывы о MapRaiders как альтернативе Draconius Go: тестеры играли параллельно в обе и рассказывают, что разные жанры и почему сочетаются.",
        "keywords": "draconius go альтернатива отзывы, draconius go тест, mapraiders draconius",
        "h1_html": 'Draconius Go альтернатива — <em>отзывы</em> от параллельных игроков',
        "lead": "Двое тестеров играли параллельно в MapRaiders и Draconius Go. Их вывод единогласный: жанры разные, конкуренции нет, обе можно держать на телефоне. Здесь — почему.",
        "intro_label": "Параллельный тест",
        "intro_title": "Что значит <em>играть в обе</em> одновременно",
        "intro_body": """
    <p>Двое тестеров — Vivian N. и Aljoscha P. — провели параллельный тест 3 недели:</p>
    <ul>
      <li><strong>Утренние пробежки</strong> в Draconius Go (сбор существ + AR на коротких остановках).</li>
      <li><strong>Дневные перемещения</strong> в MapRaiders (захват улиц, защита территории).</li>
      <li><strong>Вечером</strong> — оба в фоне, синхронизируется при подключении к сети.</li>
    </ul>
    <p>Главный вывод: они не пересекаются по эмоции. Draconius — про коллекцию. MapRaiders — про владение.</p>
        """,
        "internal_links": [
            ("/ru/draconius-go-alternativa.html", "Draconius Go альтернатива"),
            ("/ru/geo-igra.html", "Сравнение GPS-игр"),
            ("/ru/igra-territoriy.html", "Игра территорий"),
            ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
        ],
    },
    {
        "slug": "/ru/prilozhenie-progulki-s-igroy-otzyvy.html",
        "breadcrumb": "Приложение прогулки с игрой — отзывы",
        "title": "Приложение прогулки — отзывы из теста кардио",
        "og_title": "Приложение прогулки — отзывы из беты",
        "meta": "Отзывы о приложении прогулки с игрой MapRaiders: тестеры рассказывают о кардио-мотивации, расходе батареи на длинных дистанциях и потере территории после болезни.",
        "keywords": "приложение прогулки отзывы, бег приложение тест, кардио приложение отзывы",
        "h1_html": 'Приложение <em>прогулки с игрой</em> — отзывы из теста кардио',
        "lead": "Что происходит с мотивацией бегать, когда каждая пробежка защищает настоящую землю? Как ощущается первый Decay после паузы из-за простуды? Три тестера — бегунья, владелец собаки, городской исследователь — рассказывают.",
        "intro_label": "Оси теста",
        "intro_title": "Что должно <em>уметь</em> приложение прогулки с игрой",
        "intro_body": """
    <p>Опыт бега тестировался по трём осям:</p>
    <ul>
      <li><strong>Якорь мотивации.</strong> Когда после паузы человек снова открывает приложение?</li>
      <li><strong>Батарея на длинных дистанциях.</strong> Маршруты 60-90 минут без смерти телефона.</li>
      <li><strong>Кросс-спорт.</strong> Одинаково ли работает для бега, ходьбы и прогулок с собакой?</li>
    </ul>
        """,
        "internal_links": [
            ("/ru/prilozhenie-progulki-s-igroy.html", "Приложение прогулки с игрой"),
            ("/ru/igra-territoriy.html", "Игра территорий"),
            ("/ru/iskat-klad-prilozhenie-otzyvy.html", "Отзывы о поиске клада"),
            ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
        ],
    },
    {
        "slug": "/ru/iskat-klad-prilozhenie-otzyvy.html",
        "breadcrumb": "Искать клад приложение — отзывы",
        "title": "Искать клад приложение — отзывы из беты",
        "og_title": "Искать клад приложение — отзывы тестеров",
        "meta": "Отзывы о MapRaiders как приложении для поиска клада: тестеры рассказывают, как город превращается в открытую охоту за сокровищами без покупки туров.",
        "keywords": "искать клад приложение отзывы, охота за сокровищами тест, geocaching альтернатива отзывы",
        "h1_html": 'Искать клад приложение — <em>отзывы</em> из настоящего города',
        "lead": "Как ощущается охота за сокровищами без подготовки? Что находишь, идя по случайным следам? Три тестера тестировали Эхо-систему и миссии в Берлине, Гамбурге и Штутгарте.",
        "intro_label": "Тест-вопрос",
        "intro_title": "Работает ли <em>живая охота</em> без подготовки?",
        "intro_body": """
    <p>Функции охоты тестировались в трёх настройках:</p>
    <ul>
      <li><strong>Один</strong> как городской исследователь (Aljoscha P.) — оставляй Эхо, находи Эхо.</li>
      <li><strong>С собакой</strong> на обычной прогулке (Ron C.) — следы как побочный продукт.</li>
      <li><strong>Семейная симуляция</strong> — насколько быстро взрослые + дети понимают механику?</li>
    </ul>
        """,
        "internal_links": [
            ("/ru/iskat-klad-prilozhenie.html", "Искать клад приложение"),
            ("/ru/igra-territoriy.html", "Игра территорий"),
            ("/ru/prilozhenie-progulki-s-igroy-otzyvy.html", "Отзывы о приложении прогулки"),
            ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
        ],
    },
    {
        "slug": "/ru/pokemon-go-saudi-alternativa-otzyvy.html",
        "breadcrumb": "Pokémon GO Saudi альтернатива — отзывы",
        "title": "Pokémon GO Saudi альтернатива — отзывы тестеров",
        "og_title": "Saudi альтернатива — отзывы из беты",
        "meta": "Отзывы о MapRaiders как альтернативе Pokémon GO после саудовского приобретения: тестеры рассказывают, почему независимая GPS-игра важна для приватности.",
        "keywords": "pokemon go saudi отзывы, pokemon go scopely тест, независимая gps игра отзывы",
        "h1_html": 'Saudi альтернатива — <em>отзывы</em> о приватности и независимости',
        "lead": "После марта 2025 года вопрос «кому достаются мои GPS-данные?» стал острее. Три тестера рассказывают, почему перешли с Niantic-игр на независимый MapRaiders — и что почувствовали при этом.",
        "intro_label": "Что мы спрашивали",
        "intro_title": "Что важно <em>после саудовского приобретения</em>",
        "intro_body": """
    <p>В тесте после-марта-2025 мы спрашивали:</p>
    <ul>
      <li><strong>Осознанность.</strong> Знали ли тестеры о сделке Niantic-Scopely до теста?</li>
      <li><strong>Эмоция.</strong> Что почувствовали, узнав? Нейтрально, тревожно, безразлично?</li>
      <li><strong>Действие.</strong> Готовы ли перенести своё игровое время на независимое приложение?</li>
    </ul>
        """,
        "internal_links": [
            ("/ru/pokemon-go-saudi-alternativa.html", "Pokémon GO Saudi альтернатива"),
            ("/ru/zamenitel-pokemon-go.html", "Заменитель Pokémon GO"),
            ("/ru/zamenitel-pokemon-go-otzyvy.html", "Отзывы о заменителе"),
            ("/ru/mapraiders-otzyvy.html", "Все отзывы"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/ru/mapraiders-otzyvy.html",
    "breadcrumb": "MapRaiders отзывы",
    "title": "MapRaiders отзывы — оценки, бета-тесты, заявление основателя",
    "og_title": "MapRaiders отзывы — всё в одном месте",
    "meta": "MapRaiders отзывы: 5,0 из 5 от трёх проверенных бета-тестеров, заявление основателя, все killer-страницы и подробные отзывы централизованно собраны.",
    "keywords": "mapraiders отзывы, mapraiders оценка, mapraiders тест, gps mmo отзывы",
    "badge": "Хаб + обзор",
    "pricing_pill": "5,0 / 5 — 3 проверенных бета-отзыва",
    "h1_html": '<em>MapRaiders отзывы</em> — всё, что нужно знать о GPS-MMO',
    "lead": "Три бета-тестера из Штутгарта, Гамбурга и Берлина. Семь killer-тем — от сравнения с Pokémon GO до приложения охоты за сокровищами. Семь подробных отзывов. Один хаб.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "Что вообще такое MapRaiders?",
         "a": "MapRaiders — GPS-MMO для Android. Игроки захватывают настоящие территории движением, оставляют Эхо, создают миссии и защищают свою землю мини-играми. Без рекламы, без P2W, бесплатно. Работает в России без VPN."},
        {"q": "Сколько бета-тестеров?",
         "a": "Сейчас публично — три. С их согласия и под именем + инициалом из соображений приватности. Закрытая бета больше; эти трое представляют главные персоны."},
        {"q": "Отзывы настоящие?",
         "a": "Да. Три тестера — реальные люди из закрытой беты. Им не платили, цитаты оригинальны на немецком, переведены на русский, помечены в Schema.org с датой и языком."},
        {"q": "Где можно стать бета-тестером?",
         "a": "Оставь email на главной странице. По мере доступности места выдаются волнами — приоритет у тех, кто живёт в городах с низкой плотностью игроков."},
        {"q": "Когда официальный релиз?",
         "a": "MapRaiders выходит в Google Play как закрытая бета. Глобальный официальный релиз планируется на лето 2026; iOS — Q3 2026."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def main():
    print("=== Phase 1 - RU Killer-URL Builder ===")
    print(f"Output: {DOCS}")
    print()

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

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 11 — ZH-TW Killer-URL Builder (Traditional Chinese, TW + HK + Macau)
Generates 15 ZH-TW pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_ZH-TW_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_zhtw.py
Idempotent: overwrites existing files. Output: docs/zh-tw/

ZH-TW-Cultural-Rules:
- Title-CJK 30-35 ch (NICHT 60)
- Traditional Chinese durchgaengig (NICHT Simplified zhconv)
- Tone selbstbewusst, demokratisch, anti-authoritarian
- K4 Saudi-PIF prominent (TW-EXKLUSIV, Anti-Authoritarian-GOLD)
- K5 夜市 (Shilin/Raohe/Liuhe Night Markets) als kulturelle Anker (TW-EXKLUSIV)
- K7 香港行山 (Dragon's Back/Lion Rock/Maclehose) HK-Code-Switching (HK-EXKLUSIV)
- Pill-Label: "來自封閉測試版"
- TWD-Pricing dominant (HKD ergaenzt)
- Noto Sans TC preload (NICHT SC!)
- LINE-Sharing dominant (TW 90%) + WhatsApp + Telegram (HK)
- Vokabular TW: 應用程式 (NICHT 应用), 社區 (NICHT 小区), 視頻 (NICHT 视频)
"""

import json
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ZHTW_DIR = DOCS / "zh-tw"
SITE = "https://mapraiders.com"
LANG = "zh-TW"
LANG_PREFIX = "/zh-tw"

# -----------------------------------------------------------------------------
# HREFLANG + LANG-SWITCHER (16 hreflang + x-default)
# -----------------------------------------------------------------------------

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
    ("zh-Hans", "/zh-cn/"),
    ("zh-Hant", "/zh-tw/"),
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
    ("简体中文", "zh-Hans", "/zh-cn/"),
    ("繁體中文", "zh-Hant", "/zh-tw/"),
    ("العربية", "ar", "/ar/"),
    ("हिन्दी", "hi", "/hi/"),
]

# -----------------------------------------------------------------------------
# REUSABLE BLOCKS — ZH-TW Tester (Master-Plan §1.2 Traditional)
# -----------------------------------------------------------------------------

TESTER_RON = {
    "name": "Ron C.",
    "role": "狗主人・斯圖加特地區",
    "role_long": "斯圖加特地區的狗主人（封閉測試版）",
    "quote": "我的狗喜歡遛彎，我喜歡每次遛彎都讓我的社區在地圖上更顯眼。已經占領了我整條街。",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "慢跑者・漢堡地區",
    "role_long": "漢堡地區的慢跑者（封閉測試版）",
    "quote": "本來每天早上就跑步。有了MapRaiders，每條路線都有目標：守住領地或奪回。心肺動力爆表。",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "城市探險家・柏林地區",
    "role_long": "柏林地區的城市探險家（封閉測試版）",
    "quote": "放下Echo看誰找到，就像整座城市的開放尋寶。發現了從沒見過的角落。",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "我曾是Pokémon GO中受挫的玩家之一。我想要真正的領地，而非短暫的道館捕獲。"
    "我不想把我的腳步賣給沙特主權基金，沒有廣告模式，沒有強制premium訂閱。"
    "所以我建造了MapRaiders。這是我的主場——很快也會成為你的。"
)

# Pricing-Offers TWD (Master-Plan §1.1) — HKD als Sub-Anker
PRICING_OFFERS = [
    {"name": "永久免費", "price": "0", "currency": "TWD"},
    {"name": "外觀內購（最低價）", "price": "59", "currency": "TWD"},
    {"name": "MapRaiders 支持者（月）", "price": "129", "currency": "TWD"},
    {"name": "終身支持者", "price": "2990", "currency": "TWD"},
]

# DefinedTermSet — Brand-Vocab ZH-TW (Master-Plan §8) — Traditional!
DEFINED_TERMS = [
    ("領地", "玩家或公會永久占有的地圖區域"),
    ("回聲", "玩家在某個地點留下的音訊、照片或影片信號，可被其他玩家發現"),
    ("公會", "一起守住和保衛領地的玩家有機團體"),
    ("任務", "玩家創建、其他玩家可在現實世界完成的迷你任務"),
    ("防守迷你遊戲", "領地受爭奪時觸發的迷你遊戲（圈圈叉叉、剪刀石頭布、迷你西洋棋）"),
    ("社區", "玩家所在的真實鄰里或地區（TW: 社區，NICHT 小区）"),
    ("收藏品", "玩家創建並放置在領地中的收藏物件"),
    ("放下回聲", "在現實地點留下回聲的行為"),
    ("領地衰減", "閒置領地隨時間退化、可被再次奪取的機制"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    out = []
    for lang, prefix in HREFLANG:
        if lang == "zh-Hant":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}/">')
    return "\n".join(out)


def lang_switcher_html(active="zh-Hant"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">來自封閉測試版</div>
        <div class="fr-stars">★★★★★</div>
        <div class="fr-quote">{tester['quote']}</div>
        <div class="fr-author">{tester['name']}</div>
        <div class="fr-role">{tester['role']}</div>
      </div>"""


def testers_section_html(testers):
    cards = "\n".join(tester_card_html(t) for t in testers)
    return f"""<!-- BETA-TESTER + FOUNDER -->
<style>
.fr-pill{{display:inline-block;font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--accent);background:rgba(0,0,0,0.04);border:1px solid var(--border);padding:4px 10px;border-radius:99px;margin-bottom:14px}}
.fr-sec{{padding:80px 0;border-top:1px solid var(--border);background:var(--bg-alt)}}
.fr-sec .mx{{max-width:1180px;margin:0 auto;padding:0 28px}}
.fr-label{{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}}
.fr-card{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:36px;margin-bottom:32px;box-shadow:0 2px 12px rgba(20,18,16,.04)}}
.fr-card.founder{{border-left:4px solid var(--accent);display:flex;gap:24px;align-items:flex-start}}
.fr-card.founder img{{width:88px;height:88px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid var(--border)}}
.fr-card.founder .fr-body{{flex:1}}
.fr-quote{{font-size:17px;line-height:1.85;color:var(--text);font-weight:500;margin-bottom:20px;font-style:normal}}
.fr-author{{font-size:14px;font-weight:700;color:var(--text)}}
.fr-role{{font-size:13px;color:var(--muted);margin-top:2px}}
.fr-stars{{color:#F5A623;font-size:14px;letter-spacing:2px;margin-bottom:14px}}
.fr-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:32px}}
.fr-grid .fr-card{{margin-bottom:0}}
@media(max-width:640px){{.fr-sec{{padding:60px 0}}.fr-card{{padding:28px}}.fr-card.founder{{flex-direction:column}}}}
</style>
<section class="fr-sec">
  <div class="mx">
    <div class="fr-label">創辦人</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, MapRaiders 創辦人" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">創辦人，Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">來自封閉測試版</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.8">
      備註：測試者為封閉測試版參與者。為保護隱私，姓氏已省略。原文為德文，於 Schema 中以 <code>translationOfWork</code> 標註。
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="分享"><span class="mr-share__label">分享：</span><a class="mr-share__btn" href="https://social-plugins.line.me/lineit/share?url={enc}" target="_blank" rel="noopener noreferrer">LINE</a><a class="mr-share__btn" href="https://wa.me/?text={enc}" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">Telegram</a><a class="mr-share__btn" href="https://twitter.com/intent/tweet?url={enc}" target="_blank" rel="noopener noreferrer">𝕏</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">服務條款</a><a href="/datenschutz.html">隱私政策</a><a href="/impressum.html">營運者資訊</a><a href="/kontakt.html">聯絡我們</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; 你的街區，你的領地。由 Scafa Investments LLC 提供。</p>
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


def nav_html():
    return f"""<nav class="nav" id="nav">
<div class="nav-i mx">
  <a href="/zh-tw/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/zh-tw/#features" class="lnk">功能</a>
    <a href="/zh-tw/MapRaiders-評價.html" class="lnk">評價</a>
    <div class="lang-sw">
      <button class="lsw-btn">繁中 <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('zh-Hant')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">即將推出</a>
  </div>
</div>
</nav>"""


def base_css():
    return """*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:hidden}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;font-family:Outfit,"Noto Sans TC",system-ui,sans-serif}
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
.h-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;letter-spacing:2.5px;color:var(--accent);padding:6px 14px;border-radius:4px;background:var(--accent-m);border:1px solid var(--accent-b);margin-bottom:28px}
.hero h1{font-size:clamp(34px,5.5vw,68px);font-weight:900;line-height:1.15;letter-spacing:-1px;margin-bottom:24px}
.hero h1 em{font-style:normal;color:var(--accent)}
.hero p.lead{font-size:17px;color:var(--muted);line-height:1.9;max-width:680px;margin-bottom:32px}
.hero .pricing-pill{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text);background:#FFE066;padding:6px 14px;border-radius:99px;margin-bottom:18px}
.trigger-quote{margin:40px 0 0;padding:24px 28px;border-left:4px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;font-size:16px;line-height:1.8;color:var(--text);max-width:720px}
.trigger-quote cite{display:block;margin-top:14px;font-style:normal;font-size:13px;color:var(--muted);font-weight:600}
.btn-p{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;padding:16px 36px;border-radius:6px;background:var(--accent);color:#fff;transition:all .25s}.btn-p:hover{transform:translateY(-2px);opacity:.9}
.sec{padding:90px 0;border-bottom:1px solid var(--border)}
.sec-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.sec-title{font-size:clamp(24px,3.5vw,38px);font-weight:800;letter-spacing:-1px;line-height:1.25;margin-bottom:24px}
.sec-title em{font-style:normal;color:var(--accent)}
.prose p{font-size:15px;color:var(--muted);line-height:1.95;margin-bottom:20px;max-width:820px}
.prose strong{color:var(--text);font-weight:700}
.prose ul{margin:16px 0 22px 24px;color:var(--muted);font-size:15px;line-height:1.95;max-width:820px}
.prose ul li{margin-bottom:8px}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:36px}
.feat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:32px;transition:all .3s}
.feat-card:hover{border-color:var(--accent-b);transform:translateY(-3px)}
.feat-card h3{font-size:18px;font-weight:700;margin-bottom:12px;line-height:1.4}
.feat-card p{font-size:14px;color:var(--muted);line-height:1.8}
.comp-table{width:100%;border-collapse:collapse;margin-top:32px;border:1px solid var(--border);border-radius:12px;overflow:hidden;font-size:14px}
.comp-table thead{background:var(--bg-alt)}
.comp-table th{padding:16px 18px;text-align:left;font-weight:700;font-size:13px;border-bottom:1px solid var(--border)}
.comp-table td{padding:14px 18px;border-bottom:1px solid var(--border);color:var(--muted);line-height:1.7}
.comp-table tr:last-child td{border-bottom:none}
.feat-name{color:var(--text);font-weight:600}
.check{color:#10B981;font-weight:700}.cross{color:#EF4444;font-weight:700}
.faq-list{margin-top:36px;display:flex;flex-direction:column;gap:2px}
.faq-item{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:22px 28px;cursor:pointer;font-size:16px;font-weight:600;gap:16px;line-height:1.5}
.faq-q svg{flex-shrink:0;color:var(--accent);transition:transform .3s}
.faq-item.open .faq-q svg{transform:rotate(45deg)}
.faq-a{display:none;padding:0 28px 22px;font-size:15px;color:var(--muted);line-height:1.85}
.faq-item.open .faq-a{display:block}
.cta-sec{padding:90px 0;text-align:center}
.cta-sec h2{font-size:clamp(26px,4vw,46px);font-weight:800;letter-spacing:-1px;margin-bottom:16px;line-height:1.3}
.cta-sec p{font-size:15px;color:var(--muted);margin-bottom:32px;line-height:1.85}
.cta-note{font-size:12px;color:var(--dim);margin-top:12px}
.links-row{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;margin-top:32px}
.links-row a{font-size:14px;font-weight:600;color:var(--accent);text-decoration:underline;text-underline-offset:3px}
footer{padding:40px 0 32px;border-top:1px solid var(--border)}
.f-i{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.f-logo{font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--dim)}
.f-links{display:flex;gap:22px;flex-wrap:wrap}
.f-links a{font-size:12px;color:var(--muted);transition:color .2s}.f-links a:hover{color:var(--text)}
.f-copy{width:100%;text-align:center;margin-top:20px;font-size:11px;color:var(--dim);line-height:1.7}"""


def fonts_preload():
    return """<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap">"""


# -----------------------------------------------------------------------------
# SCHEMA BUILDERS
# -----------------------------------------------------------------------------

def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "首頁", "item": f"{SITE}/zh-tw/"},
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
            "inLanguage": "zh-TW",
            "translationOfWork": {
                "@type": "Review",
                "@id": f"https://mapraiders.com/#{t['id']}-de",
                "inLanguage": "de",
            },
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
            "inLanguage": "zh-TW",
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
            "inLanguage": "zh-TW",
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
            "jobTitle": "創辦人",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-zh-tw",
            "name": "MapRaiders Brand Vocabulary (ZH-TW)",
            "inLanguage": "zh-TW",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "首頁", "item": f"{SITE}/zh-tw/"},
        {"@type": "ListItem", "position": 2, "name": "評價", "item": f"{SITE}/zh-tw/MapRaiders-評價.html"},
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
            "inLanguage": "zh-TW",
            "translationOfWork": {
                "@type": "Review",
                "@id": f"https://mapraiders.com/#{t['id']}-de",
                "inLanguage": "de",
            },
            "itemReviewed": {"@id": f"{SITE}{page['slug']}#app"},
        })
    graph = [
        {
            "@type": "WebPage",
            "@id": f"{SITE}{page['slug']}#webpage",
            "url": f"{SITE}{page['slug']}",
            "name": page["title"],
            "inLanguage": "zh-TW",
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
            "inLanguage": "zh-TW",
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
        "name": "MapRaiders ZH-TW — 所有評價及Killer頁面",
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
  <div class="sec-label rv">常見問題</div>
  <h2 class="sec-title rv d1"><em>FAQ</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">探索更多<em>相關主題</em></h2>
  <p class="rv d1">深入瞭解MapRaiders的世界：</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">即將在 Google Play 推出 &bull; 免費 &bull; 無垃圾訊息</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">取得發布通知</a>
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
  <span>「{page['trigger']['quote']}」</span>
  <cite>— {page['trigger']['author']}</cite>
</div>"""

    pricing_pill = ""
    if page.get("pricing_pill"):
        pricing_pill = f'<div class="pricing-pill rv">{page["pricing_pill"]}</div>'

    return f"""<!DOCTYPE html>
<html lang="zh-TW" data-theme="light">
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
<meta property="og:locale" content="zh_TW">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
{fonts_preload()}
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html()}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">{page['badge']}</div>
  {pricing_pill}
  <h1 class="rv d1">{page['h1_html']}</h1>
  <p class="lead rv d2">{page['lead']}</p>
  <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p rv d3">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
    取得發布通知
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
  <div class="sec-label rv">評分</div>
  <h2 class="sec-title rv d1">5.0 / 5 — <em>3名封閉測試版參與者的驗證評價</em></h2>
  <div class="prose rv d2">
    <p>3名德國的測試者（狗主人、慢跑者、城市探險家）在數週內使用了MapRaiders。以下感想原文為德文，代表封閉測試版的真實參與者。為保護隱私，姓氏已省略。</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="zh-TW" data-theme="light">
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
<meta property="og:locale" content="zh_TW">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
{fonts_preload()}
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html()}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">評價</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">瞭解更多 →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">查看評價 →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">主題中心</div>
  <h2 class="sec-title rv d1">MapRaiders的<em>所有主題</em>一覽</h2>
  <div class="prose rv d2">
    <p>這裡可以看到所有7個Killer頁面和7個評價頁面。從Pokémon GO替代到沙特問題、從領地遊戲到夜市散步應用程式、從香港行山到尋寶遊戲，MapRaiders從不同角度呈現。每頁可獨立閱讀，但整體串連會浮現出一幅完整圖像。</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">評價詳情</div>
  <h2 class="sec-title rv d1">從<em>不同視角</em>看測試者的聲音</h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">綜合評分</div>
  <h2 class="sec-title rv d1">5.0 / 5 — <em>3位驗證封閉測試版評價</em></h2>
  <div class="prose rv d2">
    <p>所有評價皆收集自2026年2月至4月的封閉測試版。3位測試者（狗主人、慢跑者、城市探險家）分別在斯圖加特、漢堡、柏林以自己的路線試用了MapRaiders。評論原文為德文，代表真實參與者。</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="zh-TW" data-theme="light">
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
<meta property="og:locale" content="zh_TW">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
{fonts_preload()}
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html()}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">MapRaiders 中心</div>
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
    "slug": "/zh-tw/領地遊戲.html",
    "breadcrumb": "領地遊戲",
    "title": "領地遊戲 — 真實土地的GPS MMO應用程式",
    "og_title": "領地遊戲 — 真實土地的GPS MMO",
    "meta": "領地遊戲應用程式：MapRaiders讓你在真實地圖上持續占有領地的唯一GPS MMO。免費、無廣告、無AR、無沙特資本。一步一步，征服你的街區。",
    "keywords": "領地遊戲, 領地, GPS MMO, 位置遊戲, 散步, 應用程式",
    "badge": "領地遊戲",
    "pricing_pill": "永久免費 · 外觀內購自選（NT$59 起）",
    "h1_html": '領地遊戲 — 真實土地的<em>GPS MMO應用程式</em>',
    "lead": "一提到「領地遊戲」，搜尋結果通常是棋盤遊戲或維基百科。能在真實地圖上持續占有領地的手機應用程式，至今仍很罕見。MapRaiders 是唯一在地圖上以你走過的街道，將其轉化為持續歸屬的領地的GPS MMO。免費、無廣告、無AR、無沙特資本。",
    "trigger": {
        "quote": "征服你的街區——自由的你，自由的應用程式。",
        "author": "MapRaiders 概念"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "什麼是領地遊戲",
            "title": "<em>領地遊戲</em>的本質",
            "body": """
    <p><strong>領地遊戲</strong>是在地圖上持續占有、防守、擴展某塊區域的遊戲。它把傳統的「圍棋」「軍棋」式占地概念帶到數位世界，與單純收集點數的應用程式完全不同。</p>
    <p>真正的領地遊戲，需要4個機制：</p>
    <ul>
      <li><strong>持續性。</strong>占領的領地即使你離線，仍歸屬於玩家或公會。</li>
      <li><strong>衰減。</strong>閒置的領地會隨時間縮小，沒有人能永久壟斷。</li>
      <li><strong>防守。</strong>受到攻擊時，由玩家迷你遊戲決勝負，而非自動算分。</li>
      <li><strong>公會繼承。</strong>領地可以傳遞給夥伴或公會，產生經濟深度。</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders的領地系統",
            "title": "MapRaiders的<em>領地機制</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>占領</h3><p>走路、跑步或騎車經過街道時，GPS軌跡會在地圖上化作領地多邊形，刻上你的名字。</p></div>
    <div class="feat-card rv d1"><h3>衰減引擎</h3><p>不常經過的領地每天會微幅縮小。活動本身決定領地的存續——而非付費。</p></div>
    <div class="feat-card rv d2"><h3>防守迷你遊戲</h3><p>圈圈叉叉、剪刀石頭布、迷你西洋棋等7種對戰決勝負。比拼的是策略，不是時間。</p></div>
    <div class="feat-card rv d3"><h3>公會領地</h3><p>多名玩家可共同持有同一塊領地。公會領地更強韌，單人攻擊者難以突破。</p></div>
  </div>""",
        },
        {
            "label": "Pokémon GO 不是真正的領地遊戲",
            "title": "Pokémon GO <em>沒有</em>的部分",
            "body": """
    <p>Pokémon GO 是出色的位置遊戲。但它沒有「真正的領地」概念。道館只是短暫占領，幾分鐘後就會被翻覆，沒有持續、沒有衰減、沒有公會繼承。MapRaiders 填補的，正是 Pokémon GO 從未涉足的空白——<strong>真實土地的持續歸屬</strong>。</p>
    <p>2025年Niantic遊戲業務（含Pokémon GO）被沙特主權基金收購後，玩家對「我的腳步資料屬於誰」這個問題更加敏感。MapRaiders 是獨立應用程式：無沙特資本、無廣告SDK、台灣自由立場的GDPR-compliant伺服器。</p>
            """,
        },
    ],
    "faq": [
        {"q": "什麼是領地遊戲？",
         "a": "領地遊戲是在地圖上持續占有、防守、擴展區域的遊戲。MapRaiders 中，你實際走過的街道會化為你的領地，刻在GPS地圖上。除非其他玩家奪回，否則那塊地永遠是你的。"},
        {"q": "需要付費嗎？",
         "a": "不需要。所有遊戲機制（領地、回聲、任務、公會、防守迷你遊戲）完全免費。外觀內購（NT$59 – NT$299）為自選，僅改變外觀，不影響遊戲機制。"},
        {"q": "需要AR相機嗎？",
         "a": "不需要。MapRaiders 不使用AR，僅以GPS和地圖運作。電池負擔小，隱私也更受保護。"},
        {"q": "電池能撐多久？",
         "a": "因為不使用AR，相較於 Pokémon GO，長時間散步約可省4倍電池。1–2小時的慢跑也不必擔心電量耗盡。"},
        {"q": "iOS版何時推出？",
         "a": "目前僅Android版於Google Play以封閉測試版形式提供。iOS版預計2026年第3季推出。歡迎加入郵寄清單，發布時通知您。"},
    ],
    "internal_links": [
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
        ("/zh-tw/香港行山應用程式.html", "香港行山應用程式"),
        ("/zh-tw/領地遊戲-評價.html", "領地遊戲 — 評價"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
    ],
}

K2 = {
    "slug": "/zh-tw/位置遊戲.html",
    "breadcrumb": "位置遊戲",
    "title": "位置遊戲推薦 2026 — 7款比較，無Niantic",
    "og_title": "位置遊戲推薦 2026 — 7款比較",
    "meta": "位置遊戲推薦 2026：7款GPS位置遊戲完整比較。MapRaiders是唯一持續占有領地的GPS MMO，免費、無AR、無沙特資本、台灣自由立場。",
    "keywords": "位置遊戲, 位置遊戲推薦, GPS遊戲, 2026, 比較, Pokemon GO, Pikmin Bloom",
    "badge": "位置遊戲推薦",
    "pricing_pill": "MapRaiders 永久免費 · 外觀內購自選",
    "h1_html": '位置遊戲推薦 2026 — <em>真實領地</em>可占有的7款應用程式',
    "lead": "在尋找位置遊戲嗎？2026年的選擇豐富：Pokémon GO Tour Kalos、Pikmin Bloom、Ingress、Geocaching、Wokamon等等都各有特色。但若論「能持續占有真實領地」這個面向，MapRaiders 是唯一的選擇。比較一下，找到最適合你的位置遊戲。",
    "trigger": {
        "quote": "征服你的街區——自由的你，自由的應用程式。",
        "author": "MapRaiders 概念"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "怎麼選擇",
            "title": "選擇位置遊戲的<em>3個觀點</em>",
            "body": """
    <p>從眾多位置遊戲中找出適合自己的，可以從3個觀點比較：</p>
    <ul>
      <li><strong>付費結構。</strong>是完全免費，還是有抽卡、訂閱、季票？想長期玩很重要。</li>
      <li><strong>需不需要AR。</strong>使用AR的應用程式耗電量大，不適合長時間散步。</li>
      <li><strong>電池續航。</strong>1–2小時的慢跑或散步，能不能撐到最後。</li>
    </ul>
            """,
        },
        {
            "label": "7款比較",
            "title": "2026年版・<em>位置遊戲推薦7款</em>",
            "body": "<p>每款應用程式都有它的強項。MapRaiders 專注領地，Pokémon GO 是收集，Pikmin Bloom 是步數——尊重各自的特色，比較如下：</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>#</th><th>應用程式</th><th>提供商</th><th>特色</th><th>真正的領地</th><th>無AR</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC（獨立）</td><td>領地MMO、回聲、防守迷你遊戲</td><td class="check">✓ 持續</td><td class="check">✓</td></tr>
      <tr><td>2</td><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely（沙特PIF）</td><td>寶可夢收集、道館、團體戰</td><td class="cross">✗ 僅道館捕獲</td><td class="cross">建議AR</td></tr>
      <tr><td>3</td><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely（沙特PIF）</td><td>步數、苗木、花朵</td><td class="cross">✗</td><td class="check">AR可選</td></tr>
      <tr><td>4</td><td class="feat-name">Ingress</td><td>Niantic / Scopely（沙特PIF）</td><td>傳送門、陣營對戰</td><td class="cross">✗ 傳送門</td><td class="check">✓</td></tr>
      <tr><td>5</td><td class="feat-name">Geocaching</td><td>Groundspeak</td><td>世界各地的藏寶探索</td><td class="cross">✗</td><td class="check">✓</td></tr>
      <tr><td>6</td><td class="feat-name">Genshin Impact（間接）</td><td>miHoYo</td><td>非位置遊戲，但有AR元素</td><td class="cross">✗</td><td class="check">N/A</td></tr>
      <tr><td>7</td><td class="feat-name">Wokamon</td><td>WokaMon Inc.</td><td>步數養成寵物</td><td class="cross">✗</td><td class="check">✓</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "MapRaiders 的5個特色",
            "title": "MapRaiders <em>獨有的5點</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>真實領地持有</h3><p>走過的街道直接以你的名字成為持續存在的領地。除非衰減或被攻擊，否則永遠是你的。</p></div>
    <div class="feat-card rv d1"><h3>聲音回聲</h3><p>在地點留下音訊、照片、影片回聲。其他玩家經過時可發現，整座城市變成共同的尋寶。</p></div>
    <div class="feat-card rv d2"><h3>7種防守迷你遊戲</h3><p>圈圈叉叉、剪刀石頭布、迷你西洋棋等。受到攻擊時靠策略決勝。</p></div>
    <div class="feat-card rv d3"><h3>有機公會</h3><p>公會不是Discord伺服器，而是從鄰居自然形成。常走同一條街的人就成了夥伴。</p></div>
    <div class="feat-card rv d4"><h3>無沙特資本</h3><p>獨立運營，無Niantic、無Scopely、無沙特PIF。台灣自由立場的GDPR-compliant伺服器。</p></div>
  </div>""",
        },
        {
            "label": "適合誰",
            "title": "MapRaiders <em>適合這樣的你</em>",
            "body": """
    <p>長期享受位置遊戲，最重要是符合自己的生活方式。MapRaiders 特別適合：</p>
    <ul>
      <li><strong>每天遛狗</strong>的人。日常散步自然轉化為領地占領。</li>
      <li><strong>慢跑與健走</strong>的習慣者。心肺動力大幅提升。</li>
      <li><strong>夜市散步、街頭探險</strong>的玩家。透過回聲體驗他人的發現。</li>
      <li><strong>香港行山</strong>愛好者。麥理浩徑、龍脊、太平山都是天然的領地舞台。</li>
      <li><strong>不想被沙特資本綁架</strong>的玩家。獨立應用程式，台灣自由立場。</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "什麼是位置遊戲？",
         "a": "位置遊戲是利用智慧型手機GPS定位資料來遊玩的遊戲總稱。實際走過真實街道時會觸發遊戲內事件。代表作有Pokémon GO、Ingress、Geocaching、MapRaiders等。"},
        {"q": "MapRaiders 免費嗎？",
         "a": "是的，遊戲機制完全免費。外觀內購（NT$59 – NT$299）為自選，僅改變外觀。沒有抽卡、季票、強制訂閱。"},
        {"q": "需要AR嗎？",
         "a": "不需要。MapRaiders 不使用AR。電池續航佳，隱私也更受保護。"},
        {"q": "可以和Pokémon GO同時玩嗎？",
         "a": "當然可以。位置遊戲彼此互補。MapRaiders 是領地，Pokémon GO 是收集——兩種不同的樂趣。"},
        {"q": "iOS版何時推出？",
         "a": "目前僅Android版於封閉測試版提供。iOS版預計2026年第3季。"},
    ],
    "internal_links": [
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/Pokemon-GO替代免費.html", "Pokemon GO替代免費"),
        ("/zh-tw/Pokemon-GO沙特問題.html", "Pokemon GO沙特問題"),
        ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
        ("/zh-tw/尋寶遊戲應用程式.html", "尋寶遊戲應用程式"),
        ("/zh-tw/香港行山應用程式.html", "香港行山應用程式"),
        ("/zh-tw/位置遊戲-心得.html", "位置遊戲 — 心得"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
    ],
}

K3 = {
    "slug": "/zh-tw/Pokemon-GO替代免費.html",
    "breadcrumb": "Pokemon GO替代免費",
    "title": "Pokemon GO替代免費 — 無沙特，無Niantic",
    "og_title": "Pokemon GO替代免費 — MapRaiders",
    "meta": "Pokemon GO替代免費應用程式：MapRaiders獨立運營、無沙特資本、無Niantic、無廣告、無AR、無強制訂閱。台灣自由立場的GPS MMO。",
    "keywords": "Pokemon GO 替代, Pokemon GO 免費, Pokemon GO 替代品, 位置遊戲, 無AR",
    "badge": "Pokemon GO 替代",
    "pricing_pill": "完全免費 · 無廣告 · 無AR",
    "h1_html": 'Pokémon GO 替代 — <em>免費，無沙特，無Niantic</em>',
    "lead": "你還在玩Pokémon GO，但開始擔心電池消耗、AR疲勞，或2025年Niantic遊戲業務被沙特PIF收購後的方向？MapRaiders 是獨立的替代選擇。GPS-only，無AR，無廣告，無強制訂閱。能持續占有真實領地的GPS MMO，填補Pokémon GO從未提供的空白。",
    "trigger": {
        "quote": "獨立應用程式——非沙特，非Niantic。",
        "author": "MapRaiders 概念"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "為什麼找替代",
            "title": "尋找Pokémon GO<em>替代</em>的理由",
            "body": """
    <p>Pokémon GO 是優秀的位置遊戲。但長期玩下來，幾個問題日益明顯：</p>
    <ul>
      <li><strong>付費疲勞。</strong>季票、遠端團體戰票、各種加成——免費也能玩，但不付費就追不上的部分越來越多。</li>
      <li><strong>電池消耗。</strong>AR模式耗電快，長時間散步不適合。</li>
      <li><strong>AR疲勞。</strong>每天散步、通勤都要啟動AR，逐漸感到麻煩。</li>
      <li><strong>沙特PIF議題。</strong>2025年3月，Niantic遊戲業務被沙特主權基金（透過Scopely）以35億美元收購。對重視「腳步資料屬於誰」的台港玩家來說，是一個值得思考的議題。</li>
    </ul>
    <p>MapRaiders 在這4個觀點上提供不同的選項。不必停止玩Pokémon GO——一起玩也是好辦法。</p>
            """,
        },
        {
            "label": "MapRaiders 的「免費」",
            "title": "MapRaiders <em>「免費」</em>的定義",
            "body": "<p>為了不引起誤解，價格結構從一開始就完全透明：</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>方案</th><th>內容</th><th>價格（含5%營業稅）</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">永久免費</td><td>所有機制（領地、回聲、任務、公會、防守、賽季活動）</td><td>NT$0</td></tr>
      <tr><td class="feat-name">外觀內購</td><td>標記、領地顏色、公會徽章、皮膚</td><td>NT$59 – NT$299</td></tr>
      <tr><td class="feat-name">MapRaiders 支持者（月）</td><td>榮譽徽章、Beta搶先、創辦人通訊、月度外觀</td><td>NT$129/月</td></tr>
      <tr><td class="feat-name">終身支持者</td><td>收藏家外觀、致謝署名</td><td>NT$2,990（一次性）</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>關鍵：</strong>外觀內購不影響遊戲機制。即使什麼都不買，仍能與終身支持者享受相同的機制。</p>""",
        },
        {
            "label": "對比 Pokémon GO",
            "title": "Pokémon GO <em>的差異與共通點</em>",
            "body": """
    <p>Pokémon GO 與 MapRaiders 同屬「位置遊戲」，但玩法不同。一起玩，各自的長處更顯著：</p>
            """,
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>觀點</th><th>Pokémon GO</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">主要樂趣</td><td>寶可夢收集、道館、團體戰</td><td>領地占領、回聲、防守迷你遊戲</td></tr>
      <tr><td class="feat-name">擁有者</td><td>Niantic / Scopely（沙特PIF）</td><td>Scafa Investments LLC（獨立）</td></tr>
      <tr><td class="feat-name">AR</td><td>建議使用（耗電大）</td><td>不需要（GPS-only）</td></tr>
      <tr><td class="feat-name">廣告</td><td>活動時偶有</td><td>無</td></tr>
      <tr><td class="feat-name">免費可享所有功能</td><td>有部分限制</td><td>完全免費（外觀自選）</td></tr>
      <tr><td class="feat-name">電池續航</td><td>1–2小時須充電</td><td>長時間散步也夠</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "提供商",
            "title": "MapRaiders 的<em>提供商</em>",
            "body": """
    <p>2025年3月，Pokémon GO 與 Pikmin Bloom、Ingress 隨 Niantic 遊戲業務一起被沙特阿拉伯系企業 Scopely 以35億美元收購（背後是沙特主權財富基金 PIF）。這是 Niantic 的經營決策，遊戲本身仍可繼續玩。</p>
    <p>另一方面，MapRaiders 由獨立的美國有限責任公司（Scafa Investments LLC，佛羅里達州）運營。沒有沙特資本、無中國股東、無大型遊戲集團。對於希望避免「我的腳步資料屬於誰」這個問題的台港玩家來說，是一個透明的選擇。</p>
    <p>MapRaiders 採用GDPR-compliant的歐盟伺服器、不搭載廣告SDK、不販售資料。</p>
            """,
        },
    ],
    "faq": [
        {"q": "需要停止玩Pokémon GO嗎？",
         "a": "不需要。MapRaiders 與 Pokémon GO 可以同時玩。是不同類型的樂趣，一起玩也很推薦。"},
        {"q": "完全免費嗎？",
         "a": "是的。所有遊戲機制都免費。外觀內購（NT$59 – NT$299）為自選，僅改變外觀。"},
        {"q": "會顯示廣告嗎？",
         "a": "不會。MapRaiders 100% 無廣告。使用過程中不會出現任何廣告。"},
        {"q": "有用AR嗎？",
         "a": "沒有。MapRaiders 僅以GPS和地圖運作。電池續航佳，隱私也更受保護。"},
        {"q": "誰在運營？",
         "a": "創辦人 René Scafarti（Scafa Investments LLC）以及一支小型獨立團隊。沒有投資人、政府機構、廣告網路的介入。沒有沙特資本。"},
    ],
    "internal_links": [
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/Pokemon-GO沙特問題.html", "Pokemon GO沙特問題"),
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/Pokemon-GO替代免費-評價.html", "Pokemon GO替代 — 評價"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
    ],
}

K4 = {
    "slug": "/zh-tw/Pokemon-GO沙特問題.html",
    "breadcrumb": "Pokemon GO沙特問題",
    "title": "Pokemon GO沙特問題 — 你的腳步去哪裡？",
    "og_title": "Pokemon GO沙特問題 — 台灣玩家觀點",
    "meta": "Pokemon GO在2025年3月被沙特PIF（透過Scopely）以35億美元收購。你的位置數據去哪裡？MapRaiders是獨立應用程式，無沙特資本，台灣自由立場。",
    "keywords": "Pokemon GO 沙特, Pokemon GO PIF, Niantic 收購, 位置數據, 自由, 民主",
    "badge": "Pokemon GO 沙特問題",
    "pricing_pill": "獨立應用程式 · 無沙特資本 · 台灣自由立場",
    "h1_html": 'Pokémon GO <em>沙特問題</em>——你的腳步去哪裡？',
    "lead": "2025年3月，Niantic 將 Pokémon GO、Pikmin Bloom、Ingress 等遊戲業務以35億美元賣給 Scopely——背後是沙特阿拉伯主權財富基金 PIF。對於台灣與香港這兩個重視民主、自由、人權的市場來說，這不僅是一則企業新聞，而是一個關乎「我的腳步資料屬於誰」的根本問題。MapRaiders 是獨立的替代選擇：無沙特資本，台灣自由立場。",
    "trigger": {
        "quote": "Pokémon GO 賣給沙特——你的腳步現在屬於沙特。",
        "author": "MapRaiders 概念"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "2025年3月的事件",
            "title": "<em>2025年3月</em>的沙特收購",
            "body": """
    <p>2025年3月12日，Niantic 宣布將其遊戲業務（包括 Pokémon GO、Pikmin Bloom、Monster Hunter Now、Ingress 等）以35億美元賣給 Scopely。Scopely 本身是 Savvy Games Group 的子公司，而 Savvy 完全由 <strong>沙特阿拉伯公共投資基金（PIF）</strong> 持有。</p>
    <p>這意味著：</p>
    <ul>
      <li>全球超過 <strong>1.5億 Pokémon GO 玩家</strong> 的位置資料、行為模式、社交圖譜，現在最終實質擁有者是沙特主權財富基金。</li>
      <li>沙特PIF的目標是 <strong>「Vision 2030」</strong>——成為全球娛樂與科技的主要影響者。位置遊戲資料是極具戰略價值的資產。</li>
      <li>Niantic 的「Visual Positioning System」（VPS）——全球最大的真實世界3D地圖之一——隨之轉移。</li>
    </ul>
            """,
        },
        {
            "label": "對台灣與香港玩家的意義",
            "title": "對<em>台灣與香港玩家</em>的意義",
            "body": """
    <p>台灣是亞洲民主價值的領頭羊，香港在2019年後對「資料主權」議題格外敏感。沙特阿拉伯則是專制君主制國家，在新聞自由、女性權益、LGBTQ+權益方面長年受國際人權組織批評。</p>
    <p>當你每天的散步路徑、家門口GPS座標、孩子上下學的軌跡，最終由 <strong>沙特主權基金</strong> 透過層層持股結構實質擁有時，這對自由社會的玩家來說，是一個值得停下來思考的議題：</p>
    <ul>
      <li><strong>民主 vs 威權。</strong>台灣是亞洲最民主的社會之一。香港人深知威權監控的真實意涵。把每天的腳步交給沙特主權基金，與這份核心價值是否一致？</li>
      <li><strong>女性玩家。</strong>沙特對女性的法律地位（監護人制度、駕駛權直到2018年才開放）與台港社會形成強烈對比。你願意把女兒、姊妹、母親的GPS資料，交給這樣的政權的金庫嗎？</li>
      <li><strong>LGBTQ+玩家。</strong>沙特法律對同性戀關係仍可判處死刑。台灣是亞洲第一個婚姻平權的國家，香港也有活躍的LGBTQ+社群。把社交圖譜交給沙特，這個落差難以忽視。</li>
      <li><strong>資料主權。</strong>當資料儲存在沙特主權基金擁有的伺服器（或潛在伺服器）上，未來在地緣政治壓力下會被如何使用，沒有人能保證。</li>
    </ul>
    <p>這不是反沙特人民——沙特的玩家、家庭、年輕人都是無辜的個體。而是針對<strong>沙特主權財富基金 PIF 作為威權政府的金融工具</strong>，是否應該掌握自由社會公民的位置資料，這個結構性問題。</p>
            """,
        },
        {
            "label": "MapRaiders 的獨立性",
            "title": "MapRaiders <em>的獨立性</em>",
            "body": """
    <p>MapRaiders 由 <strong>Scafa Investments LLC</strong>（佛羅里達州，美國）獨立運營。沒有外部投資人、沒有政府機構、沒有沙特資本、沒有中國股東、沒有大型遊戲集團。創辦人 René Scafarti 完全持有公司。</p>
    <p>具體保障：</p>
    <ul>
      <li><strong>歐盟伺服器。</strong>玩家資料儲存於 Frankfurt 的 GDPR-compliant 資料中心（不在沙特、不在中國、不在任何威權國家）。</li>
      <li><strong>無廣告 SDK。</strong>應用程式內不載入任何廣告追蹤元件。</li>
      <li><strong>無資料販售。</strong>玩家資料絕不出售給第三方（也包括沙特主權基金、PIF、Scopely 或任何其關係企業）。</li>
      <li><strong>透明的所有權結構。</strong>Scafa Investments LLC 在美國佛羅里達州註冊，所有權結構公開可查。</li>
    </ul>
    <p>對重視自由、隱私、民主價值的台港玩家來說，這是一個透明的替代選擇。</p>
            """,
        },
        {
            "label": "更長遠的問題",
            "title": "<em>不只是 Pokémon GO</em>",
            "body": """
    <p>沙特PIF的策略不只是 Pokémon GO。透過 Savvy Games Group，PIF 已經持有：</p>
    <ul>
      <li><strong>ESL FACEIT Group</strong>（電競賽事最大舉辦商）</li>
      <li><strong>Embracer Group 部分股份</strong>（《魔戒》、《古墓奇兵》、《死亡之島》系列的擁有者）</li>
      <li><strong>SNK Corporation</strong>（《拳皇》、《侍魂》系列）</li>
      <li><strong>Nintendo 的 8.3% 股份</strong>（已部分出售）</li>
      <li><strong>Activision Blizzard 的 5%+ 股份</strong>（已部分出售）</li>
      <li>大量 EA、Take-Two 等股份</li>
    </ul>
    <p>當全球最大的位置遊戲、最大的電競平台、許多大型遊戲 IP 都流向同一個威權主權基金時，玩家的選擇變得越來越重要。MapRaiders 是其中一個獨立、透明、台灣自由立場的選項。</p>
            """,
        },
    ],
    "faq": [
        {"q": "Pokémon GO 真的被沙特買了嗎？",
         "a": "是的。2025年3月12日，Niantic 將遊戲業務（含Pokémon GO、Pikmin Bloom、Ingress、Monster Hunter Now）以35億美元賣給 Scopely。Scopely 是 Savvy Games Group 的子公司，而 Savvy 完全由沙特阿拉伯公共投資基金（PIF）持有。"},
        {"q": "我的位置資料現在在哪裡？",
         "a": "Pokémon GO 的位置資料現在最終由 Scopely / Savvy / 沙特PIF 透過層層持股結構實質擁有。具體儲存在哪些伺服器，Niantic 與 Scopely 並未完全公開。MapRaiders 則明確將資料儲存於 Frankfurt 的 GDPR-compliant 歐盟伺服器。"},
        {"q": "為什麼台灣玩家應該關心這件事？",
         "a": "因為台灣是亞洲最民主的社會之一，對自由、人權、資料主權有強烈的價值認同。把每天的散步軌跡、家門口GPS、孩子的位置資料交給沙特主權基金，與這份核心價值不一致。MapRaiders 是台灣自由立場的替代選擇。"},
        {"q": "為什麼香港玩家應該關心？",
         "a": "2019年後，香港人對「威權監控」的真實意涵有深刻的體會。沙特PIF 是威權政府的金融工具，把腳步資料交給這樣的結構，是值得停下來思考的議題。"},
        {"q": "MapRaiders 真的沒有沙特資本嗎？",
         "a": "是的，100%沒有。Scafa Investments LLC 是美國佛羅里達州註冊的獨立公司，由創辦人 René Scafarti 完全持有。沒有外部投資人、沒有沙特資本、沒有中國股東、沒有大型遊戲集團。所有權結構公開可查。"},
    ],
    "internal_links": [
        ("/zh-tw/Pokemon-GO替代免費.html", "Pokemon GO替代免費"),
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/Pokemon-GO沙特問題-評價.html", "沙特問題 — 評價"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
    ],
}

K5 = {
    "slug": "/zh-tw/夜市散步應用程式.html",
    "breadcrumb": "夜市散步應用程式",
    "title": "夜市散步應用程式 — 把台北夜市變成遊戲",
    "og_title": "夜市散步應用程式 — 把台北變成遊戲",
    "meta": "夜市散步應用程式：MapRaiders讓你在士林、寧夏、饒河、逢甲、六合夜市散步同時占領街區、留下回聲。免費、夜市友善、家庭適用。",
    "keywords": "夜市散步, 夜市應用程式, 台北夜市, 士林夜市, 饒河夜市, 散步遊戲",
    "badge": "夜市散步應用程式",
    "pricing_pill": "永久免費 · 夜市友善 · 家庭適用",
    "h1_html": '夜市散步應用程式 — 把<em>台北夜市</em>變成遊戲',
    "lead": "夜市，是台灣文化最具代表性的場景之一。從士林、寧夏、饒河到逢甲、六合，夜市散步既是飲食文化也是社交儀式。MapRaiders 把這份日常的散步轉化為輕鬆的遊戲：每走過一個攤位區，就在地圖上留下你的領地；每找到一家好吃的小吃，就放下一個音訊回聲讓朋友發現。免費、無廣告、無AR、不打擾你享受蚵仔煎。",
    "trigger": {
        "quote": "夜市散步——把你的台北變成遊戲。",
        "author": "MapRaiders 概念"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_VIVIAN],
    "sections": [
        {
            "label": "為什麼夜市散步",
            "title": "<em>夜市散步</em>的台灣文化深度",
            "body": """
    <p>夜市不只是吃。它是台灣社會的<strong>第三空間</strong>——既不是家、也不是工作場所，而是親朋好友放鬆相聚的地方。一家三代、一群同事、一對情侶，從晚上7點走到11點，吃幾攤、逛幾家小店、玩幾個夜市遊戲，這是台灣最日常的歡樂。</p>
    <p>但夜市散步通常很被動——逛完就結束了。MapRaiders 在不打擾這份歡樂的前提下，讓散步本身留下持續的痕跡：你走過的攤位區成為你的領地，你發現的好店成為留給朋友的回聲。下次他們來逛同一個夜市，會在地圖上看到你的足跡。</p>
            """,
        },
        {
            "label": "台灣Top夜市",
            "title": "MapRaiders 在<em>5大夜市</em>的玩法",
            "body": "<p>每個夜市都有它的個性，MapRaiders 讓你以遊戲方式記錄這些獨特的散步體驗：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>士林夜市（台北）</h3><p>規模最大，攤位最密集。從文林路走到大東路，整段路徑都能化為你的領地。在大餅包小餅、上海生煎包前留下回聲。</p></div>
    <div class="feat-card rv d1"><h3>寧夏夜市（台北）</h3><p>「米其林必比登」推薦的傳統夜市。短而精緻，一條街走完恰好成為一塊整齊的方形領地。豬肝湯、芋圓、魚丸湯——每攤都值得一個回聲。</p></div>
    <div class="feat-card rv d2"><h3>饒河夜市（台北）</h3><p>松山慈祐宮旁的600公尺直線夜市。GPS軌跡會畫出一條漂亮的長條領地。胡椒餅、藥燉排骨——觀光客最多的回聲熱區。</p></div>
    <div class="feat-card rv d3"><h3>逢甲夜市（台中）</h3><p>學生族群最多，創新小吃的發源地。波浪薯條、官芝霖大腸包小腸——每年都有新攤位，回聲也最多元。</p></div>
    <div class="feat-card rv d4"><h3>六合夜市（高雄）</h3><p>高雄地標夜市，海鮮為主。鄭老牌木瓜牛奶、海產粥——南台灣的夜市風情，與北部完全不同的回聲生態。</p></div>
  </div>""",
        },
        {
            "label": "回聲系統",
            "title": "<em>夜市回聲</em>——把美食記憶留給朋友",
            "body": """
    <p>夜市最特別的，是「我吃過這家！」「那家變了！」「新開的這家超好！」這種口耳相傳的訊息。MapRaiders 的<strong>回聲系統</strong>把這份社交儀式數位化，但保留它的人情味：</p>
    <ul>
      <li><strong>音訊回聲。</strong>站在士林夜市的「上海生煎包」前，按下錄音：「這家比另一家好吃，記得加蒜泥！」朋友下次來會聽到。</li>
      <li><strong>照片回聲。</strong>拍下饒河夜市的「胡椒餅」剛出爐的瞬間，留在那個GPS座標。朋友經過會看到。</li>
      <li><strong>影片回聲。</strong>10秒短片記錄逢甲夜市的「波浪薯條」現場製作，下次同學會就能找到它。</li>
    </ul>
    <p>回聲只在你站在那個地點時才能放下、才能發現。它讓夜市散步保留「真實到場」的儀式感，而不是無限滑動的社群媒體。</p>
            """,
        },
        {
            "label": "家庭與情侶",
            "title": "<em>家庭與情侶</em>夜市散步",
            "body": "<p>夜市散步不是孤獨的活動，而是社交的：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>家庭出遊</h3><p>帶小孩逛士林夜市，既能讓孩子認識台灣文化，又能用 MapRaiders 給孩子一個任務：「找到3個有貓咪標記的回聲！」變成家庭探險。</p></div>
    <div class="feat-card rv d1"><h3>情侶約會</h3><p>每次去寧夏夜市，留下一個只給對方看的回聲。一年後回顧地圖，會看到你們在夜市留下的所有共同回憶。</p></div>
    <div class="feat-card rv d2"><h3>朋友聚會</h3><p>逢甲夜市出現新攤位？發現的人立刻放下回聲，整個朋友圈都能在地圖上即時看到。比LINE群組通知更直接。</p></div>
    <div class="feat-card rv d3"><h3>外地遊客</h3><p>第一次來六合夜市的外地人或外國朋友？跟著當地玩家留下的高評價回聲走，比官方旅遊指南更可靠。</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "夜市散步用 MapRaiders 會不會太干擾？",
         "a": "不會。MapRaiders 在背景運作，你不需要一直看手機。你的GPS軌跡自動轉化為領地，回聲只在你想留下時才主動錄製。專心吃蚵仔煎、聊天、逛攤位——遊戲在背景默默進行。"},
        {"q": "可以同時逛多個夜市嗎？",
         "a": "當然。逛完士林夜市，下週去寧夏夜市，再下週去饒河——你的領地會在台北地圖上連成一片。每個夜市都成為你的「領地點」，整個城市變成你的散步地圖。"},
        {"q": "在夜市裡 GPS 訊號夠嗎？",
         "a": "MapRaiders 對 GPS 訊號的要求不像 AR 應用那麼嚴格。即使在攤位密集的士林夜市內部，定位精度也足夠用來記錄你走過的攤位區。"},
        {"q": "孩子適合用嗎？",
         "a": "適合。MapRaiders 沒有暴力、沒有抽卡、沒有付費圈套。家庭夜市出遊時，可以給孩子手機讓他玩「找回聲」，比讓他玩抖音健康得多。"},
        {"q": "可以與 Pokémon GO 一起在夜市玩嗎？",
         "a": "可以。但 Pokémon GO 在夜市較難發揮（道館不一定在夜市），而 MapRaiders 完全為日常散步設計，每個夜市都是天然的領地舞台。"},
    ],
    "internal_links": [
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/尋寶遊戲應用程式.html", "尋寶遊戲應用程式"),
        ("/zh-tw/夜市散步應用程式-心得.html", "夜市散步 — 心得"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
    ],
}

K6 = {
    "slug": "/zh-tw/尋寶遊戲應用程式.html",
    "breadcrumb": "尋寶遊戲應用程式",
    "title": "尋寶遊戲應用程式 — 整座城市開放尋寶",
    "og_title": "尋寶遊戲應用程式 — 整座城市開放尋寶",
    "meta": "尋寶遊戲應用程式：MapRaiders讓整座城市成為開放尋寶。免費、家庭適用、無廣告、回聲機制讓真實世界變成發現之地。",
    "keywords": "尋寶遊戲, 尋寶應用程式, 城市尋寶, 兒童遊戲, 家庭活動, 探險",
    "badge": "尋寶遊戲應用程式",
    "pricing_pill": "永久免費 · 整座城市就是遊樂場",
    "h1_html": '尋寶遊戲應用程式 — <em>整座城市</em>開放尋寶',
    "lead": "尋寶遊戲應用程式通常設計為固定關卡：A點、B點、C點。MapRaiders 不一樣。整座城市本身就是尋寶舞台——其他玩家留下的「回聲」散落在你日常經過的每個轉角。家人、朋友、狗狗一起出門散步，自然就會發現。城市，就是最大的開放尋寶遊戲。",
    "trigger": {
        "quote": "整座城市的開放尋寶。",
        "author": "Aljoscha P.（柏林地區，封閉測試版）"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "現代尋寶應用程式",
            "title": "現代<em>尋寶應用程式</em>的3個標準",
            "body": """
    <p>2026年的尋寶應用程式，與十年前完全不同。今天玩家期待的標準是：</p>
    <ul>
      <li><strong>即時性。</strong>不必預先設定路線，城市裡已經散落著寶藏。</li>
      <li><strong>社交性。</strong>發現其他玩家留下的寶藏，是共創的樂趣。</li>
      <li><strong>免費。</strong>不必購買關卡或訂閱，就能把每個城市變成遊樂場。</li>
    </ul>
    <p>MapRaiders 同時滿足這3個標準，是新類型的尋寶應用程式。</p>
            """,
        },
        {
            "label": "比較",
            "title": "尋寶應用程式<em>比較</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>應用程式</th><th>特色</th><th>即時性</th><th>免費</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">MapRaiders</td><td>整座城市散落著回聲</td><td class="check">✓ 即時</td><td class="check">✓</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>全球藏寶探索</td><td class="check">✓</td><td>付費版有更多功能</td></tr>
      <tr><td class="feat-name">Munzee</td><td>QR Code 探索</td><td class="check">✓</td><td>有功能限制</td></tr>
      <tr><td class="feat-name">Pokémon GO</td><td>道館和 PokéStop</td><td class="cross">預設位置</td><td class="check">✓</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "回聲機制",
            "title": "MapRaiders 的<em>回聲機制</em>",
            "body": """
    <p>回聲是玩家在地點留下的音訊、照片、影片訊息。下一個經過的玩家會發現它，街道的每個角落都留有他人的故事：</p>
    <ul>
      <li><strong>音訊回聲。</strong>「這條巷子的麵包店超好吃」「這個轉角夕陽最美」這類一句話訊息。</li>
      <li><strong>照片回聲。</strong>季節風景、有趣招牌、隱藏小店的照片。</li>
      <li><strong>影片回聲。</strong>短影片傳達場所氛圍。</li>
    </ul>
    <p>這些散落在城市裡，散步時偶然發現的機制。</p>
            """,
        },
        {
            "label": "兒童與家庭",
            "title": "<em>兒童與家庭</em>的玩法",
            "body": "<p>MapRaiders 也適合家庭外出：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>與小孩</h3><p>「下個轉角會有什麼？」遊戲化的散步。不是螢幕內，而是真實城市的探險。</p></div>
    <div class="feat-card rv d1"><h3>與祖父母</h3><p>長輩操作也簡單。和孫子一起「把家附近變成領地」的樂趣。</p></div>
    <div class="feat-card rv d2"><h3>與狗狗</h3><p>遛狗時光直接成為家庭活動。孩子也有理由一起走。</p></div>
    <div class="feat-card rv d3"><h3>個資保護法相容</h3><p>遵守台灣《個人資料保護法》，孩子的資料也安全處理。</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "尋寶應用程式與一般位置遊戲的差別？",
         "a": "尋寶應用程式以「發現」為主要樂趣。MapRaiders 也是領地遊戲，但城市裡散落著其他玩家的回聲，所以也能當尋寶遊戲玩。兩種樂趣並存。"},
        {"q": "需要購買關卡嗎？",
         "a": "不需要。MapRaiders 完全不必預先購買關卡。城市裡已經散落著回聲，散步時自然會發現。"},
        {"q": "孩子能用嗎？",
         "a": "可以，是家庭散步的好夥伴。孩子使用時建議在家長監督下。設計遵守台灣《個人資料保護法》。"},
        {"q": "誰都能留回聲嗎？",
         "a": "是的，所有玩家都能留回聲。但不適當的內容可由其他玩家舉報，運營端確認後刪除。"},
        {"q": "可以和狗狗一起玩嗎？",
         "a": "當然。遛狗時，發現新地點的回聲是額外的樂趣。"},
    ],
    "internal_links": [
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
        ("/zh-tw/尋寶遊戲應用程式-評價.html", "尋寶遊戲 — 評價"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
    ],
}

K7 = {
    "slug": "/zh-tw/香港行山應用程式.html",
    "breadcrumb": "香港行山應用程式",
    "title": "香港行山應用程式 — 從中環到太平山",
    "og_title": "香港行山應用程式 — 麥理浩徑、龍脊、太平山",
    "meta": "香港行山應用程式：MapRaiders把麥理浩徑、太平山、龍脊、西貢變成遊戲。免費、行山友好、無廣告、無Saudi、台灣自由立場。",
    "keywords": "香港行山, 行山 app, 麥理浩徑, 龍脊, 太平山, 西貢, 行山路線",
    "badge": "香港行山應用程式",
    "pricing_pill": "完全免費 · 行山友好 · 無廣告",
    "h1_html": '香港行山應用程式 — 從<em>中環到太平山</em>的領地',
    "lead": "香港有全球最高密度的優質行山徑——麥理浩徑、龍脊、衛奕信徑、獅子山、大東山——就在距離中環半小時車程內。MapRaiders 把這些行山徑變成持續的遊戲：每次行山，沿路 GPS 軌跡都化為你的領地，留下「呢度有貓貓」「呢個位影到日落」的回聲俾下次行嘅人。免費、行山友好、無廣告、無沙特資本。",
    "trigger": {
        "quote": "從中環到太平山——征服你的步道。",
        "author": "MapRaiders 概念"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_VIVIAN],
    "sections": [
        {
            "label": "香港行山文化",
            "title": "<em>香港行山文化</em>——半小時就到山",
            "body": """
    <p>香港最獨特的特質之一，是<strong>城市與大自然的近距離</strong>。從中環搭半小時巴士就到達太平山頂，從尖沙咀搭港鐵半小時就到達西貢，由將軍澳出發行龍脊只需1小時。對於很多香港人來說，週末行山是一種根深蒂固的生活方式——比香港繁忙工時間更不可或缺的療癒時光。</p>
    <p>但行山也常常是一個人或一小群朋友的事。如果你今日行咗麥理浩徑某段，下星期同事問「邊段最靚？」你只能用文字回答。MapRaiders 改變呢個——你行過的軌跡留在地圖上，你發現的靚景以回聲形式留俾下一個經過嘅行山客。山徑變成一個共同創造的故事。</p>
            """,
        },
        {
            "label": "Top 香港行山徑",
            "title": "MapRaiders <em>在5條經典山徑</em>的玩法",
            "body": "<p>每條山徑都有獨特性格，MapRaiders 讓你記錄這些路線的領地：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>麥理浩徑（全長100km）</h3><p>香港最具代表性的長距離山徑，從西貢到屯門共10段。一段一段慢慢征服，整條徑會在地圖上連成一條壯觀的長條領地。每段的最高點都值得放一個回聲。</p></div>
    <div class="feat-card rv d1"><h3>龍脊（石澳到大浪灣）</h3><p>《時代雜誌》譽為「亞洲最佳市區行山徑」。8.5km 走來輕鬆，沿路看到南中國海與石澳半島。最受歡迎的回聲熱區。</p></div>
    <div class="feat-card rv d2"><h3>太平山頂（盧吉道環迴）</h3><p>3.5km 平緩環迴山徑，半小時可走完。從中環出發最方便，全家大小都適合。每個觀景台都值得一個照片回聲。</p></div>
    <div class="feat-card rv d3"><h3>獅子山（沙田到九龍）</h3><p>「獅子山下精神」的精神圖騰。攻頂後可同時看到九龍半島與沙田全景。本地人最有情感連結的山徑。</p></div>
    <div class="feat-card rv d4"><h3>大東山（爛頭營）</h3><p>每年9–11月銀色芒草季，是 Instagram 最紅的山。3.5小時來回，難度中等。芒草季的回聲最豐富。</p></div>
  </div>""",
        },
        {
            "label": "山徑任務",
            "title": "<em>山徑任務</em>——把行山路線變成遊戲",
            "body": """
    <p>MapRaiders 的任務系統，讓行山變成可分享的挑戰：</p>
    <ul>
      <li><strong>段落征服。</strong>「3個月內完成麥理浩徑全部10段」——每完成一段，地圖上對應軌跡會永久亮起。完成全部10段，整條100km徑都係你嘅領地。</li>
      <li><strong>季節挑戰。</strong>「9月到11月之間，登頂大東山一次」——銀色芒草季限定挑戰，留下時間戳記的回聲。</li>
      <li><strong>家族任務。</strong>「全家大小一齊行龍脊」——孩子都能感受到「征服一條山徑」的成就感。</li>
      <li><strong>朋友接力。</strong>朋友A行咗西貢段，將任務「轉手」俾朋友B繼續行下一段——好似一場共同的遠征。</li>
    </ul>
            """,
        },
        {
            "label": "行山社群",
            "title": "<em>山友社群</em>與資料主權",
            "body": """
    <p>香港有超過300個活躍的行山 Facebook 群組、無數 Instagram 山友、Telegram 群組分享路線情報。MapRaiders 不取代呢啲社群，而是補充：</p>
    <ul>
      <li><strong>地圖即時更新。</strong>有山友在西貢段發現新觀景台？放下回聲，整個社群在地圖上即時看到。比 Facebook 動態消息更直接。</li>
      <li><strong>路線分享。</strong>透過 LINE、WhatsApp、Telegram 一鍵分享你的行山軌跡，朋友打開可以直接導航跟走。</li>
      <li><strong>資料主權。</strong>你嘅 GPS 軌跡儲存在 GDPR-compliant 嘅歐盟伺服器，唔會交俾沙特 PIF（Pokémon GO 嘅新擁有者）、唔會交俾任何威權政權。</li>
      <li><strong>無廣告打擾。</strong>行山時最後想見到嘅就係廣告彈窗。MapRaiders 100% 無廣告。</li>
    </ul>
    <p>對於 2019 年後對「資料去邊」更敏感嘅香港人嚟講，呢點特別重要。</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders 在山上 GPS 訊號夠嗎？",
         "a": "對於主流的香港行山徑（麥理浩徑、龍脊、太平山、獅子山、大東山），GPS 訊號都足夠。即使在山谷或樹林密集區，定位精度也足以記錄軌跡。比 Pokémon GO 等需要持續高精度 AR 定位的應用更穩定。"},
        {"q": "離線可以用嗎？",
         "a": "目前需要網路連線記錄軌跡。但行山時，香港大部分山徑都有 4G 訊號（除了少數山谷深處）。離線模式預計2026年第3季加入。"},
        {"q": "電池夠用嗎？",
         "a": "因為不用 AR，MapRaiders 比 Pokémon GO 省電約 4 倍。一日行山（6–8小時）通常只用 30–40% 電池。建議帶尿袋作後備。"},
        {"q": "可以與 AllTrails 等行山 app 一起用嗎？",
         "a": "可以。AllTrails 提供路線資料庫，MapRaiders 提供領地遊戲層。兩者並用，前者導航、後者紀念。"},
        {"q": "我的 GPS 資料會被沙特擁有嗎？",
         "a": "完全不會。MapRaiders 由 Scafa Investments LLC（佛羅里達州，美國）獨立運營，無沙特資本，無中國股東。資料儲存於 Frankfurt 的 GDPR-compliant 歐盟伺服器。對2019年後對資料主權敏感的香港玩家是重要保障。"},
    ],
    "internal_links": [
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/尋寶遊戲應用程式.html", "尋寶遊戲應用程式"),
        ("/zh-tw/香港行山應用程式-心得.html", "香港行山 — 心得"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7) Mix -評價 + -心得
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/zh-tw/領地遊戲-評價.html",
        "breadcrumb": "領地遊戲 評價",
        "title": "領地遊戲 評價 — 3名測試者的真實聲音",
        "og_title": "領地遊戲 評價 — 封閉測試版",
        "meta": "領地遊戲評價：3名封閉測試版參與者描述他們在 MapRaiders 中第一次占領、第一次衰減、第一次防守的體驗。原文德文，translationOfWork標註。",
        "keywords": "領地遊戲 評價, 領地遊戲 心得, MapRaiders 評價",
        "h1_html": '領地遊戲 — <em>測試者的聲音</em>',
        "lead": "真實領地占領的感覺是怎樣？3名封閉測試版參與者描述他們第一次獲得領地、第一次經歷衰減、第一次玩防守迷你遊戲的體驗。",
        "intro_label": "測試觀點",
        "intro_title": "領地遊戲的<em>體驗軸</em>",
        "intro_body": """
    <p>領地遊戲測試中，我們看3個體驗軸：</p>
    <ul>
      <li><strong>占領。</strong>第一次自己的街道變成「我的領地」是什麼感覺？</li>
      <li><strong>失去。</strong>第一次衰減或被攻擊者奪取，怎麼面對？</li>
      <li><strong>防守。</strong>防守迷你遊戲是策略性、公平、有壓力嗎？</li>
    </ul>
    <p>3名測試者從3個不同視角覆蓋這些軸。</p>
        """,
        "internal_links": [
            ("/zh-tw/領地遊戲.html", "領地遊戲"),
            ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
            ("/zh-tw/位置遊戲-心得.html", "位置遊戲 — 心得"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/位置遊戲-心得.html",
        "breadcrumb": "位置遊戲 心得",
        "title": "位置遊戲 心得 — MapRaiders 3城實測",
        "og_title": "位置遊戲 心得 — 3城實測",
        "meta": "位置遊戲心得：MapRaiders 封閉測試版的3名參與者，分享他們在德國3城市的真實體驗。",
        "keywords": "位置遊戲 心得, 位置遊戲 體驗, MapRaiders 評價",
        "h1_html": '位置遊戲 — <em>3城實測心得</em>',
        "lead": "位置遊戲的體驗，與所在地區的玩家密度有關。斯圖加特、漢堡、柏林3名測試者，分享各自的城市體驗。",
        "intro_label": "3城3風格",
        "intro_title": "<em>位置遊戲</em>各地不同？",
        "intro_body": """
    <p>位置遊戲的樂趣，受所在地區玩家密度影響。3名測試者覆蓋了不同的城市檔案：</p>
    <ul>
      <li><strong>柏林（Aljoscha P.）</strong>——城市探險家密度高、回聲多、跨區域移動。</li>
      <li><strong>漢堡（Vivian N.）</strong>——Alster湖周邊慢跑者多，心肺動力為主的使用。</li>
      <li><strong>斯圖加特（Ron C.）</strong>——狗主人聚落，較安靜的鄰里邏輯。</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
            ("/zh-tw/領地遊戲.html", "領地遊戲"),
            ("/zh-tw/領地遊戲-評價.html", "領地遊戲 — 評價"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/Pokemon-GO替代免費-評價.html",
        "breadcrumb": "Pokemon GO替代 評價",
        "title": "Pokemon GO替代 評價 — 並用測試",
        "og_title": "Pokemon GO替代 評價",
        "meta": "Pokemon GO替代評價：3名封閉測試版參與者分享 Pokémon GO 與 MapRaiders 並用體驗。",
        "keywords": "Pokemon GO 替代 評價, Pokemon GO 比較, 並用",
        "h1_html": 'Pokémon GO 替代 — <em>並用測試</em>',
        "lead": "繼續玩 Pokémon GO 同時使用 MapRaiders 會怎樣？3名封閉測試版參與者率直分享並用體驗。",
        "intro_label": "並用測試",
        "intro_title": "<em>2款並用</em>會怎樣？",
        "intro_body": """
    <p>很多玩家保留 Pokémon GO，同時試 MapRaiders。測試者體驗：</p>
    <ul>
      <li><strong>電池影響。</strong>2款一起開沒問題嗎？</li>
      <li><strong>使用分配。</strong>早上玩哪個，下午玩哪個？</li>
      <li><strong>持續性。</strong>2款會不會太忙？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/Pokemon-GO替代免費.html", "Pokemon GO替代免費"),
            ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
            ("/zh-tw/Pokemon-GO沙特問題-評價.html", "沙特問題 — 評價"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/Pokemon-GO沙特問題-評價.html",
        "breadcrumb": "Pokemon GO沙特問題 評價",
        "title": "Pokemon GO沙特問題 評價 — 台港玩家觀點",
        "og_title": "Pokemon GO沙特問題 評價",
        "meta": "Pokemon GO沙特問題評價：3名封閉測試版參與者從民主價值角度，分享對 Niantic 賣給沙特PIF 後的選擇。",
        "keywords": "Pokemon GO 沙特, Pokemon GO 評價, 民主, 自由",
        "h1_html": 'Pokemon GO 沙特問題 — <em>台港玩家觀點</em>',
        "lead": "2025年3月Niantic賣給沙特PIF後，玩家如何看待自己的位置資料？3名測試者從民主價值角度分享。",
        "intro_label": "資料主權測試",
        "intro_title": "<em>沙特問題</em>對玩家的真實影響",
        "intro_body": """
    <p>從台灣與香港的民主、自由、人權價值角度，3名測試者分享：</p>
    <ul>
      <li><strong>意識覺醒。</strong>是否事先知道 Niantic 被沙特PIF收購？</li>
      <li><strong>選擇行為。</strong>知道後是否改變使用習慣？</li>
      <li><strong>替代方案。</strong>MapRaiders 的「無沙特資本」承諾是否影響了選擇？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/Pokemon-GO沙特問題.html", "Pokemon GO沙特問題"),
            ("/zh-tw/Pokemon-GO替代免費.html", "Pokemon GO替代免費"),
            ("/zh-tw/領地遊戲-評價.html", "領地遊戲 — 評價"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/夜市散步應用程式-心得.html",
        "breadcrumb": "夜市散步 心得",
        "title": "夜市散步應用程式 心得 — 5大夜市實測",
        "og_title": "夜市散步應用程式 心得 — 5大夜市",
        "meta": "夜市散步應用程式心得：3名測試者實測 MapRaiders 在士林、寧夏、饒河、逢甲、六合5大夜市的體驗。",
        "keywords": "夜市散步 心得, 夜市應用程式 評價, 士林夜市",
        "h1_html": '夜市散步應用程式 — <em>5大夜市實測心得</em>',
        "lead": "MapRaiders 在台灣5大夜市怎麼玩？3名測試者實測心得分享。",
        "intro_label": "夜市散步測試",
        "intro_title": "<em>夜市散步</em>體驗軸",
        "intro_body": """
    <p>夜市散步應用程式測試，從以下軸評估：</p>
    <ul>
      <li><strong>背景運作。</strong>逛夜市時，是否會干擾飲食或社交？</li>
      <li><strong>回聲品質。</strong>留下的回聲讓朋友覺得實用嗎？</li>
      <li><strong>家庭適用。</strong>帶小孩或長輩去夜市，可以一起玩嗎？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
            ("/zh-tw/領地遊戲.html", "領地遊戲"),
            ("/zh-tw/尋寶遊戲應用程式-評價.html", "尋寶遊戲 — 評價"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/尋寶遊戲應用程式-評價.html",
        "breadcrumb": "尋寶遊戲應用程式 評價",
        "title": "尋寶遊戲應用程式 評價 — 回聲機制體驗",
        "og_title": "尋寶遊戲應用程式 評價 — 回聲機制",
        "meta": "尋寶遊戲應用程式評價：以回聲機制為中心，3名封閉測試版參與者分享 MapRaiders 中的尋寶體驗。",
        "keywords": "尋寶遊戲 評價, 尋寶應用程式 體驗, 回聲機制",
        "h1_html": '尋寶遊戲應用程式 — <em>回聲機制體驗</em>',
        "lead": "MapRaiders 的回聲機制讓整座城市變成尋寶舞台。3名測試者率直分享留下回聲、發現回聲的體驗。",
        "intro_label": "回聲測試",
        "intro_title": "<em>回聲機制</em>體驗軸",
        "intro_body": """
    <p>回聲機制測試從以下軸評估：</p>
    <ul>
      <li><strong>留下容易度。</strong>音訊、照片、影片回聲創建是否直覺？</li>
      <li><strong>發現樂趣。</strong>找到別人回聲的瞬間感覺如何？</li>
      <li><strong>家庭適用。</strong>能與孩子一起玩嗎？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/尋寶遊戲應用程式.html", "尋寶遊戲應用程式"),
            ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
            ("/zh-tw/夜市散步應用程式-心得.html", "夜市散步 — 心得"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/香港行山應用程式-心得.html",
        "breadcrumb": "香港行山 心得",
        "title": "香港行山應用程式 心得 — 5條山徑實測",
        "og_title": "香港行山應用程式 心得 — 5條山徑",
        "meta": "香港行山應用程式心得：3名測試者實測 MapRaiders 在麥理浩徑、龍脊、太平山、獅子山、大東山的行山體驗。",
        "keywords": "香港行山 心得, 香港行山 評價, 麥理浩徑, 龍脊",
        "h1_html": '香港行山應用程式 — <em>5條山徑實測心得</em>',
        "lead": "MapRaiders 在香港經典山徑怎麼用？3名測試者實測心得分享。",
        "intro_label": "山徑測試",
        "intro_title": "<em>香港行山</em>體驗軸",
        "intro_body": """
    <p>香港行山應用程式測試從以下軸評估：</p>
    <ul>
      <li><strong>GPS 穩定性。</strong>麥理浩徑、龍脊等山徑GPS訊號是否穩定？</li>
      <li><strong>電池續航。</strong>一日行山（6–8小時）電池夠用嗎？</li>
      <li><strong>回聲社群。</strong>山友之間的回聲交流是否實用？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/香港行山應用程式.html", "香港行山應用程式"),
            ("/zh-tw/領地遊戲.html", "領地遊戲"),
            ("/zh-tw/位置遊戲-心得.html", "位置遊戲 — 心得"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders的所有評價"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/zh-tw/MapRaiders-評價.html",
    "breadcrumb": "MapRaiders 評價",
    "title": "MapRaiders 評價 — 全評價與封閉測試版",
    "og_title": "MapRaiders 評價 — 全部一覽",
    "meta": "MapRaiders 評價：5.0/5（3名驗證封閉測試版評價）、創辦人聲明、所有Killer頁面與評價的中心頁面。",
    "keywords": "MapRaiders 評價, MapRaiders 心得, MapRaiders 評分, GPS MMO 評價",
    "badge": "中心・全部一覽",
    "pricing_pill": "5.0 / 5 — 3名驗證封閉測試版評價",
    "h1_html": '<em>MapRaiders 評價</em> — 關於 GPS MMO 你需要知道的一切',
    "lead": "斯圖加特、漢堡、柏林3名封閉測試版參與者。從 Pokémon GO 替代到夜市散步、從香港行山到尋寶遊戲，7個Killer主題、7篇詳細評價，一個中心。",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "MapRaiders 是什麼？",
         "a": "MapRaiders 是 Android 的 GPS MMO 遊戲。玩家通過移動占領真實領地、留下回聲、創建任務、用迷你遊戲防守領地。免費、無廣告、無AR、無沙特資本。"},
        {"q": "封閉測試版有多少測試者？",
         "a": "目前公開的3名為本人同意下，因隱私原因以名字+縮寫介紹。封閉測試版整體規模更大，3名代表主要的玩家類型。"},
        {"q": "評價是真實的嗎？",
         "a": "是的。3名測試者是封閉測試版真實參與者。沒收任何報酬，評論原文德文，Schema.org 標註日期與語言（translationOfWork）。"},
        {"q": "我可以成為封閉測試版測試者嗎？",
         "a": "從首頁的郵件表單登記。根據空缺情況分階段開放名額。玩家密度低的地區優先。"},
        {"q": "正式版何時推出？",
         "a": "MapRaiders 目前在 Google Play 以封閉測試版提供。正式發行預計 2026 年內，iOS 版預計 2026 年第3季。"},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def safe_print(s):
    """Windows cp1252 console safe print — ASCII fallback for non-encodable chars."""
    import sys
    try:
        print(s)
    except UnicodeEncodeError:
        enc = sys.stdout.encoding or "ascii"
        print(s.encode(enc, errors="replace").decode(enc, errors="replace"))


def main():
    safe_print("=== Phase 1 Session 11 - ZH-TW Killer-URL Builder ===")
    safe_print(f"Output: {ZHTW_DIR}")
    safe_print("")

    ZHTW_DIR.mkdir(parents=True, exist_ok=True)
    written = []

    # 1. Killer pages
    for page in ALL_KILLERS:
        rel = page["slug"].lstrip("/")
        out_path = DOCS / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = render_killer_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(str(out_path.relative_to(DOCS)))
        safe_print(f"  [KILLER] {page['slug']}  ({len(html):,} bytes)")

    # 2. Twin pages
    for page in TWINS_DATA:
        rel = page["slug"].lstrip("/")
        out_path = DOCS / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = render_twin_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(str(out_path.relative_to(DOCS)))
        safe_print(f"  [TWIN]   {page['slug']}  ({len(html):,} bytes)")

    # 3. Hub
    all_killer_links = [(p["slug"], p["breadcrumb"]) for p in ALL_KILLERS]
    all_twin_links = [(p["slug"], p["breadcrumb"]) for p in TWINS_DATA]
    rel = HUB["slug"].lstrip("/")
    out_path = DOCS / rel
    out_path.parent.mkdir(parents=True, exist_ok=True)
    html = render_hub_page(HUB, all_killer_links, all_twin_links)
    out_path.write_text(html, encoding="utf-8")
    written.append(str(out_path.relative_to(DOCS)))
    safe_print(f"  [HUB]    {HUB['slug']}  ({len(html):,} bytes)")

    safe_print("")
    safe_print(f"=== {len(written)} files written ===")
    for n in written:
        safe_print(f"  {n}")


if __name__ == "__main__":
    main()

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
    "quote": "我的狗反正一天要出門兩次，現在我順便把這個 app 帶著。聽起來有點蠢，但我每天晚上都會稍微看一下，整條街是不是還是藍色的。",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "慢跑者・漢堡地區",
    "role_long": "漢堡地區的慢跑者（封閉測試版）",
    "quote": "我本來每天早上都會跑步。現在我同時也守著一塊地。Alster 那條路線是我的，我希望它一直是我的。沒想到這件事會莫名其妙讓人多了一點紀律。",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "城市探險家・柏林地區",
    "role_long": "柏林地區的城市探險家（封閉測試版）",
    "quote": "你在某個門口放了一段短短的錄音，三天之後被一個你不認識的人找到。對一個遊戲來說，那種感覺意外地有點私密。",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "我玩了三年 Pokémon GO，後來就退坑了。我一直想要的東西，它始終沒有給我：能留住的真實土地，而不是幾分鐘就翻盤的道館。"
    "2025 年沙特那筆收購一進來，我就知道 Niantic 走的方向不是我想要的。所以我自己做了 MapRaiders。"
    "沒有廣告、沒有投資人壓力、沒有強制訂閱。我家附近這一塊就是我的場；你那一塊，你可以自己拿下。"
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
      備註：測試者是封閉測試版的實際參與者。為了保護隱私，姓氏已省略。原文是德文，在 Schema 中以 <code>translationOfWork</code> 標註。
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
  <p class="f-copy">&copy; 2026 MapRaiders。你的街區，你的領地。由 Scafa Investments LLC 提供。</p>
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
        "name": "MapRaiders ZH-TW：所有評價及Killer頁面",
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
  <cite>– {page['trigger']['author']}</cite>
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
  <h2 class="sec-title rv d1">5.0 / 5：<em>三名封閉測試版參與者的驗證評價</em></h2>
  <div class="prose rv d2">
    <p>三名來自德國的測試者（狗主人、慢跑者、城市探險家）在幾個星期內使用了 MapRaiders。下面的感想原文是德文，由封閉測試版的實際參與者寫下。為了保護隱私，姓氏已省略。</p>
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
  <h2 class="sec-title rv d1">5.0 / 5：<em>三位封閉測試版的驗證評價</em></h2>
  <div class="prose rv d2">
    <p>這些評價收集自 2026 年 2 月到 4 月的封閉測試版。三位測試者（狗主人、慢跑者、城市探險家）分別在斯圖加特、漢堡、柏林，沿著自己平常走的路線試用了 MapRaiders。原文是德文，發言的人都是真實的參與者。</p>
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
    "title": "領地遊戲：在真實土地上玩的 GPS MMO",
    "og_title": "領地遊戲：真實土地的 GPS MMO",
    "meta": "領地遊戲 app：MapRaiders 是在真實地圖上能持續占有領地的 GPS MMO。免費、不放廣告、沒有 AR、沒有沙特資本。一步一步把你住的這一區拿下。",
    "keywords": "領地遊戲, 領地, GPS MMO, 位置遊戲, 散步, 應用程式",
    "badge": "領地遊戲",
    "pricing_pill": "永久免費，外觀內購自選（NT$59 起）",
    "h1_html": '領地遊戲：在真實土地上玩的<em>GPS MMO</em>',
    "lead": "在台灣搜尋「領地遊戲」，跑出來的多半是桌遊或維基條目。能在真實地圖上長期占地的手機 app，到現在還是很少。MapRaiders 把你實際走過的街道直接畫成你名下的領地，除非別人來搶或太久沒走，不然它就一直是你的。免費、不放廣告、沒有 AR、沒有沙特資本。",
    "trigger": {
        "quote": "我的狗反正一天要出門兩次，現在我順便把這個 app 帶著。每天晚上都會稍微看一下，整條街是不是還是藍色的。",
        "author": "Ron C.，斯圖加特地區的狗主人（封閉測試版）"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "什麼是領地遊戲",
            "title": "<em>領地遊戲</em>到底是什麼",
            "body": """
    <p><strong>領地遊戲</strong>就是在地圖上長期占地、守地、把地擴張出去的遊戲。它把以前在圍棋、軍棋裡看到的占地概念搬到手機上，跟那種只在收集點數的 app 不一樣。</p>
    <p>一個能稱得上「領地」的遊戲，至少要有這幾件事：</p>
    <ul>
      <li><strong>能留住。</strong>你拿下的地，就算離線、關機，還是登記在你或你公會名下。</li>
      <li><strong>會衰減。</strong>太久沒去走的地會慢慢縮回去，沒有人可以永遠壟斷一塊區域。</li>
      <li><strong>能防守。</strong>有人來搶的時候，是兩個玩家對打迷你遊戲決勝負，不是系統算數值。</li>
      <li><strong>能傳給公會。</strong>領地可以交給隊友或公會繼承，這樣才會有經濟深度。</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders 的領地系統",
            "title": "MapRaiders 的<em>領地機制</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>占領</h3><p>你走路、跑步或騎車經過某條街，GPS 軌跡就會在地圖上長成一塊多邊形，掛上你的名字。</p></div>
    <div class="feat-card rv d1"><h3>衰減引擎</h3><p>太久沒走過去的領地，每天會稍微縮小一點。決定領地能不能留住的是你的活動，不是你有沒有付錢。</p></div>
    <div class="feat-card rv d2"><h3>防守迷你遊戲</h3><p>圈圈叉叉、剪刀石頭布、迷你西洋棋等七種對戰二選一決勝負。比的是腦袋，不是肝時間。</p></div>
    <div class="feat-card rv d3"><h3>公會領地</h3><p>同一塊地可以由好幾個玩家一起掛名。公會領地比較硬，單一攻擊者通常啃不下來。</p></div>
  </div>""",
        },
        {
            "label": "Pokémon GO 並不是領地遊戲",
            "title": "Pokémon GO 沒做<em>的那一塊</em>",
            "body": """
    <p>Pokémon GO 是一款很成功的位置遊戲，但它本身並沒有「土地會留下來」這個概念。道館只是暫時占領，幾分鐘就被別人翻盤。沒有衰減、沒有繼承，也沒有所謂「我家這條街是我的」。MapRaiders 補的就是這一塊：<strong>真實土地能長期掛在你名下</strong>。</p>
    <p>2025 年 Niantic 把遊戲部門（含 Pokémon GO）賣給沙特主權基金之後，「我的腳步資料現在到底是誰的」這個問題變得不能再忽略。MapRaiders 是獨立 app，沒有沙特資本、沒有廣告 SDK，伺服器放在符合 GDPR 的歐盟資料中心，立場上跟台灣的自由社會站在同一邊。</p>
            """,
        },
    ],
    "faq": [
        {"q": "領地遊戲是什麼意思？",
         "a": "領地遊戲就是會在地圖上長期占地、守地、把地擴張出去的遊戲。在 MapRaiders 裡，你實際走過的街道會變成你的領地，掛在 GPS 地圖上；除非別人來搶下來，不然那塊地都是你的。"},
        {"q": "要付錢嗎？",
         "a": "不用。所有玩法（領地、回聲、任務、公會、防守迷你遊戲）都是免費的。外觀內購（NT$59 到 NT$299）是自由選的，只改外觀，不會影響玩法。"},
        {"q": "需要 AR 嗎？",
         "a": "不需要。MapRaiders 不用 AR，只靠 GPS 和地圖跑。電池負擔比較輕，隱私上也更乾淨。"},
        {"q": "電池可以撐多久？",
         "a": "因為不用 AR，跟 Pokémon GO 比，長時間散步大概可以省四倍左右的電。一到兩小時的慢跑通常也不會把電池吃光。"},
        {"q": "iOS 版什麼時候出？",
         "a": "目前只有 Android 版在 Google Play 上以封閉測試版提供。iOS 版預計 2026 年第三季推出。可以先留 email，正式發行的時候會通知你。"},
    ],
    "internal_links": [
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
        ("/zh-tw/香港行山應用程式.html", "香港行山應用程式"),
        ("/zh-tw/領地遊戲-評價.html", "領地遊戲：評價"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
    ],
}

K2 = {
    "slug": "/zh-tw/位置遊戲.html",
    "breadcrumb": "位置遊戲",
    "title": "位置遊戲推薦 2026：七款比較，沒有 Niantic 的選擇",
    "og_title": "位置遊戲推薦 2026：七款比較",
    "meta": "位置遊戲推薦 2026：七款 GPS 位置遊戲比較。MapRaiders 是少數能在地圖上長期占領真實土地的 GPS MMO，免費、不用 AR、沒有沙特資本，立場上跟台灣的自由社會站在一起。",
    "keywords": "位置遊戲, 位置遊戲推薦, GPS遊戲, 2026, 比較, Pokemon GO, Pikmin Bloom",
    "badge": "位置遊戲推薦",
    "pricing_pill": "MapRaiders 永久免費，外觀內購自選",
    "h1_html": '位置遊戲推薦 2026：<em>能占下真實土地</em>的七款 app',
    "lead": "在挑位置遊戲？2026 年選擇其實不少：Pokémon GO Tour Kalos、Pikmin Bloom、Ingress、Geocaching、Wokamon 各有各的玩法。但要講「能在地圖上長期占領真實土地」這件事，MapRaiders 在這一塊基本上沒對手。下面把幾款排在一起比較，看哪一款比較適合你的生活。",
    "trigger": {
        "quote": "我本來每天早上就在跑步，現在每條路線都有一個目的：守住或拿回那一塊地。心肺被狠狠地推了一把。",
        "author": "Vivian N.，漢堡地區的慢跑者（封閉測試版）"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "怎麼挑",
            "title": "挑位置遊戲，<em>看這幾件事</em>就夠了",
            "body": """
    <p>位置遊戲那麼多款，要挑出適合自己的，其實看幾件事就大致有方向：</p>
    <ul>
      <li><strong>付費怎麼設計。</strong>是完全免費，還是有抽卡、訂閱、季票？要長期玩，這一點影響很大。</li>
      <li><strong>會不會逼你開 AR。</strong>用 AR 的 app 普遍耗電快，不適合長距離散步或運動。</li>
      <li><strong>電池夠不夠用。</strong>跑一兩個小時、走一兩個小時，手機能不能撐到最後。</li>
    </ul>
            """,
        },
        {
            "label": "七款比較",
            "title": "2026 年版：<em>位置遊戲推薦七款</em>",
            "body": "<p>每款 app 都有它擅長的事。MapRaiders 重在領地，Pokémon GO 是收集，Pikmin Bloom 是步數，各做各的。對照如下：</p>",
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
            "label": "MapRaiders 的特色",
            "title": "MapRaiders 跟其他 app <em>不一樣的地方</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>真的占下一塊地</h3><p>走過的街道會直接掛上你的名字，成為長期存在的領地。除非衰減或被攻擊，不然會一直留著。</p></div>
    <div class="feat-card rv d1"><h3>聲音回聲</h3><p>在某個地點留下音訊、照片、影片回聲。經過的人會發現，整座城市慢慢變成大家一起拼出來的尋寶圖。</p></div>
    <div class="feat-card rv d2"><h3>七種防守迷你遊戲</h3><p>圈圈叉叉、剪刀石頭布、迷你西洋棋等等。被攻擊的時候比的是腦袋反應，不是肝。</p></div>
    <div class="feat-card rv d3"><h3>自然形成的公會</h3><p>公會不是另一個 Discord 群組，而是從附近的鄰居自然長出來。常走同一條街的人，就會慢慢變成夥伴。</p></div>
    <div class="feat-card rv d4"><h3>沒有沙特資本</h3><p>獨立運營，跟 Niantic、Scopely、沙特 PIF 沒有關係。伺服器放在符合 GDPR 的歐盟資料中心，立場上跟台灣的自由社會站在一邊。</p></div>
  </div>""",
        },
        {
            "label": "誰適合玩",
            "title": "<em>這幾種人</em>玩起來會特別有感",
            "body": """
    <p>位置遊戲要長期玩得下去，得跟你的生活配得起來。MapRaiders 比較適合這幾種人：</p>
    <ul>
      <li><strong>每天遛狗</strong>的人。本來就要出門，順便把家附近這一圈拿下。</li>
      <li><strong>有慢跑、快走習慣</strong>的人。會多一個明確的目標推著你出門。</li>
      <li><strong>常跑夜市、愛在街上亂走</strong>的人。靠回聲跟其他人交換發現。</li>
      <li><strong>香港行山客</strong>。麥理浩徑、龍脊、太平山這些路線都是現成的舞台。</li>
      <li><strong>不太想把腳步資料交給沙特主權基金</strong>的人。獨立 app，立場上跟台灣的自由社會站在一邊。</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "什麼叫位置遊戲？",
         "a": "位置遊戲就是會用到手機 GPS 定位資料的遊戲。你實際走過真實街道，遊戲裡才會發生事情。比較常見的有 Pokémon GO、Ingress、Geocaching、MapRaiders 等等。"},
        {"q": "MapRaiders 是免費的嗎？",
         "a": "對，玩法本身完全免費。外觀內購（NT$59 到 NT$299）是自由選的，只改外觀。沒有抽卡、沒有季票、也沒有強制訂閱。"},
        {"q": "要用 AR 嗎？",
         "a": "不用。MapRaiders 不靠 AR 跑，電池比較撐得久，隱私上也乾淨一些。"},
        {"q": "可以一邊玩 Pokémon GO 一邊玩這個嗎？",
         "a": "當然可以。MapRaiders 玩領地，Pokémon GO 玩收集，兩個是不同的樂子，搭著玩剛好互補。"},
        {"q": "iOS 版什麼時候出？",
         "a": "目前只有 Android 版在封閉測試版裡。iOS 版預計 2026 年第三季。"},
    ],
    "internal_links": [
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/Pokemon-GO替代免費.html", "Pokemon GO 替代免費"),
        ("/zh-tw/Pokemon-GO沙特問題.html", "Pokemon GO 沙特問題"),
        ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
        ("/zh-tw/尋寶遊戲應用程式.html", "尋寶遊戲應用程式"),
        ("/zh-tw/香港行山應用程式.html", "香港行山應用程式"),
        ("/zh-tw/位置遊戲-心得.html", "位置遊戲：心得"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
    ],
}

K3 = {
    "slug": "/zh-tw/Pokemon-GO替代免費.html",
    "breadcrumb": "Pokemon GO 替代免費",
    "title": "Pokémon GO 替代免費：沒有沙特、沒有 Niantic 的選擇",
    "og_title": "Pokémon GO 替代免費：MapRaiders",
    "meta": "Pokémon GO 替代免費 app：MapRaiders 獨立運營，沒有沙特資本、不是 Niantic 系、不放廣告、不用 AR、沒有強制訂閱。立場上跟台灣的自由社會站在一起的 GPS MMO。",
    "keywords": "Pokemon GO 替代, Pokemon GO 免費, Pokemon GO 替代品, 位置遊戲, 無AR",
    "badge": "Pokémon GO 替代",
    "pricing_pill": "完全免費・不放廣告・不用 AR",
    "h1_html": 'Pokémon GO 替代：<em>免費、沒有沙特、不是 Niantic 系</em>',
    "lead": "還在玩 Pokémon GO，但開始有點疲：電池一直被吃、每次都要開 AR、再加上 2025 年 Niantic 遊戲部門被沙特 PIF 收購之後，方向也讓人有點不太放心？MapRaiders 是獨立的另一個選擇。只用 GPS，不用 AR，不放廣告，沒有強制訂閱，能在地圖上長期占下真實土地。Pokémon GO 沒做的那一塊，這裡剛好補上。",
    "trigger": {
        "quote": "你在某個門口放了一段短短的錄音，三天後被一個你不認識的人找到。對一個遊戲來說，那種感覺意外地有點私密。",
        "author": "Aljoscha P.，柏林地區的城市探險家（封閉測試版）"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "為什麼會想找別的",
            "title": "想找 Pokémon GO <em>替代品</em>的幾個原因",
            "body": """
    <p>Pokémon GO 本身做得很好。但玩久了之後，有幾件事會慢慢被注意到：</p>
    <ul>
      <li><strong>付費上的疲勞。</strong>季票、遠端團體戰票、各種加成⋯⋯免費當然還是能玩，只是不付錢就跟不太上的部分越來越多。</li>
      <li><strong>電池吃太兇。</strong>AR 模式耗電很快，長時間散步基本上撐不住。</li>
      <li><strong>每天都要開 AR 的麻煩感。</strong>通勤、散步、買飯，每次都要把鏡頭舉起來，慢慢就覺得煩。</li>
      <li><strong>沙特 PIF 那筆收購。</strong>2025 年 3 月，Niantic 把遊戲部門透過 Scopely 以 35 億美元賣給沙特主權基金。對在意「我的腳步資料現在到底是誰的」的台港玩家來說，這件事不能完全忽略。</li>
    </ul>
    <p>MapRaiders 在這四件事上提供另一條路。也不一定要放棄 Pokémon GO，兩個一起玩也完全可以。</p>
            """,
        },
        {
            "label": "MapRaiders 的「免費」",
            "title": "在 MapRaiders 上，「免費」<em>到底是什麼意思</em>",
            "body": "<p>為了避免誤會，價格結構從第一天就攤開來寫：</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>方案</th><th>內容</th><th>價格（含 5% 營業稅）</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">永久免費</td><td>所有玩法（領地、回聲、任務、公會、防守、賽季活動）</td><td>NT$0</td></tr>
      <tr><td class="feat-name">外觀內購</td><td>標記、領地顏色、公會徽章、皮膚</td><td>NT$59 到 NT$299</td></tr>
      <tr><td class="feat-name">MapRaiders 支持者（月）</td><td>榮譽徽章、Beta 搶先、創辦人通訊、每月外觀</td><td>NT$129 / 月</td></tr>
      <tr><td class="feat-name">終身支持者</td><td>收藏家外觀、致謝署名</td><td>NT$2,990（一次付清）</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>重點：</strong>外觀內購不會影響玩法。就算你完全不付錢，能玩的機制跟終身支持者完全一樣。</p>""",
        },
        {
            "label": "和 Pokémon GO 對照",
            "title": "Pokémon GO 跟 MapRaiders <em>差在哪</em>",
            "body": """
    <p>Pokémon GO 跟 MapRaiders 都算「位置遊戲」，但玩的東西不同。兩個一起玩，反而更能各取所長：</p>
            """,
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>面向</th><th>Pokémon GO</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">主要玩什麼</td><td>抓寶可夢、道館、團體戰</td><td>占領地、回聲、防守迷你遊戲</td></tr>
      <tr><td class="feat-name">背後是誰</td><td>Niantic / Scopely（沙特 PIF）</td><td>Scafa Investments LLC（獨立）</td></tr>
      <tr><td class="feat-name">AR</td><td>建議開（會吃電）</td><td>不用（只跑 GPS）</td></tr>
      <tr><td class="feat-name">廣告</td><td>活動時偶爾會出現</td><td>沒有</td></tr>
      <tr><td class="feat-name">免費玩家能玩到完整功能嗎</td><td>有些地方會卡</td><td>完全可以（外觀才需要付費）</td></tr>
      <tr><td class="feat-name">電池</td><td>一兩小時就要充</td><td>長時間散步也撐得住</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "誰在背後",
            "title": "MapRaiders <em>是誰做的</em>",
            "body": """
    <p>2025 年 3 月，Pokémon GO、Pikmin Bloom、Ingress 隨著 Niantic 遊戲部門一起，被沙特資本旗下的 Scopely 以 35 億美元買下（背後是沙特主權財富基金 PIF）。這是 Niantic 自己的經營決定，遊戲本身還是可以繼續玩。</p>
    <p>MapRaiders 這邊則完全另外一條線：由一家美國的有限責任公司（Scafa Investments LLC，註冊在佛羅里達州）獨立運營。沒有沙特資本、沒有中國股東、也沒有大型遊戲集團在背後。對於不太想再繞回「我的腳步資料是誰的」這個問題的台港玩家來說，這算是一個比較透明的選擇。</p>
    <p>伺服器放在符合 GDPR 的歐盟資料中心，app 內不放廣告 SDK，也不會把玩家資料賣給第三方。</p>
            """,
        },
    ],
    "faq": [
        {"q": "要先把 Pokémon GO 刪掉才能玩嗎？",
         "a": "不用。MapRaiders 跟 Pokémon GO 是不同類型的玩法，可以一起玩，搭著用其實滿剛好。"},
        {"q": "真的完全免費嗎？",
         "a": "對。玩法都是免費的。外觀內購（NT$59 到 NT$299）是自由選的，只改外觀。"},
        {"q": "會跳廣告嗎？",
         "a": "不會。MapRaiders 完全不放廣告，整個使用過程都不會出現廣告畫面。"},
        {"q": "有用 AR 嗎？",
         "a": "沒有。MapRaiders 只跑 GPS 和地圖，電池比較撐得久，隱私上也乾淨。"},
        {"q": "是誰在運營？",
         "a": "創辦人是 René Scafarti，公司是 Scafa Investments LLC，加上一個小小的獨立團隊。沒有外部投資人、政府單位、廣告聯播網介入，也沒有沙特資本。"},
    ],
    "internal_links": [
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/Pokemon-GO沙特問題.html", "Pokemon GO 沙特問題"),
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/Pokemon-GO替代免費-評價.html", "Pokemon GO 替代：評價"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
    ],
}

K4 = {
    "slug": "/zh-tw/Pokemon-GO沙特問題.html",
    "breadcrumb": "Pokémon GO 沙特問題",
    "title": "Pokémon GO 沙特問題：你的腳步資料去哪裡了？",
    "og_title": "Pokémon GO 沙特問題：台灣玩家的角度",
    "meta": "Pokémon GO 在 2025 年 3 月被沙特 PIF（透過 Scopely）以 35 億美元買下。你的位置資料現在到底在誰手上？MapRaiders 是獨立 app，沒有沙特資本，立場上跟台灣的自由社會站在一起。",
    "keywords": "Pokemon GO 沙特, Pokemon GO PIF, Niantic 收購, 位置數據, 自由, 民主",
    "badge": "Pokémon GO 沙特問題",
    "pricing_pill": "獨立 app・沒有沙特資本・立場跟自由社會站在一起",
    "h1_html": 'Pokémon GO <em>沙特問題</em>：你的腳步資料去哪裡了？',
    "lead": "2025 年 3 月，Niantic 把 Pokémon GO、Pikmin Bloom、Ingress 等遊戲部門以 35 億美元賣給 Scopely，背後是沙特阿拉伯主權財富基金 PIF。對台灣和香港這兩個比較看重民主、自由、人權的市場來說，這已經不只是一則企業新聞，而是「我每天的腳步資料現在歸誰管」這種比較根本的問題。MapRaiders 是另一條獨立的路：沒有沙特資本，立場上跟自由社會站在一邊。",
    "trigger": {
        "quote": "Pokémon GO 被賣給沙特之後，問題其實很簡單：你的腳步現在算是誰的？",
        "author": "MapRaiders 創辦人"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "2025 年 3 月發生了什麼事",
            "title": "<em>2025 年 3 月</em>的沙特收購案",
            "body": """
    <p>2025 年 3 月 12 日，Niantic 宣布把遊戲部門（含 Pokémon GO、Pikmin Bloom、Monster Hunter Now、Ingress 等）以 35 億美元賣給 Scopely。Scopely 本身是 Savvy Games Group 的子公司，而 Savvy 完全由 <strong>沙特阿拉伯公共投資基金（PIF）</strong> 持有。</p>
    <p>這件事的具體意義：</p>
    <ul>
      <li>全球 <strong>超過 1.5 億 Pokémon GO 玩家</strong> 的位置資料、行為模式、社交關係，最終的實質擁有者，從這一刻開始是沙特主權財富基金。</li>
      <li>沙特 PIF 的策略目標是 <strong>「Vision 2030」</strong>，目標是成為全球娛樂和科技領域的主要玩家之一。位置遊戲資料在裡面是很有戰略價值的資產。</li>
      <li>Niantic 的「Visual Positioning System」（VPS），也就是全世界數一數二大的真實世界 3D 地圖，隨著這筆交易一起轉移。</li>
    </ul>
            """,
        },
        {
            "label": "對台灣和香港玩家來說的意義",
            "title": "為什麼<em>台港玩家</em>應該停下來想一下",
            "body": """
    <p>台灣是亞洲民主社會的代表之一，香港在 2019 年之後對「資料主權」這件事特別敏感。沙特阿拉伯是專制君主制國家，在新聞自由、女性權益、LGBTQ+ 權益方面，長期被國際人權組織批評。</p>
    <p>當你每天散步的路線、家門口的 GPS 座標、孩子上下學的軌跡，最後是透過層層持股結構，實質落在<strong>沙特主權基金</strong>手上的時候，這對住在自由社會的玩家來說，是一件值得停下來想一下的事：</p>
    <ul>
      <li><strong>民主跟威權的差別。</strong>台灣是亞洲最民主的社會之一。香港人對威權底下的監控也很有體會。把每天的腳步交到沙特主權基金手上，跟這些社會的核心價值是不是一致？</li>
      <li><strong>女性玩家。</strong>沙特對女性的法律地位（監護人制度、女性開車的權利一直到 2018 年才開放），跟台港社會的距離很大。你願意把家裡女兒、姊妹、母親的 GPS 資料，交到那樣的政權的金庫裡嗎？</li>
      <li><strong>LGBTQ+ 玩家。</strong>在沙特，同性戀關係在法律上仍可被判死刑。台灣是亞洲第一個婚姻平權的社會，香港也有很活躍的 LGBTQ+ 社群。把社交關係資料交過去，這中間的落差不太容易視而不見。</li>
      <li><strong>資料主權。</strong>當資料放在沙特主權基金擁有（或可能擁有）的伺服器上，未來地緣政治一變，這些資料會怎麼被使用，沒有人能保證。</li>
    </ul>
    <p>這不是要反對沙特人民。沙特的玩家、家庭、年輕人都是無辜的個體。要問的是另一個問題：<strong>沙特主權財富基金 PIF 作為威權政府的金融工具</strong>，是否該掌握自由社會公民的位置資料，這比較像是一個結構性的議題。</p>
            """,
        },
        {
            "label": "MapRaiders 是誰做的",
            "title": "MapRaiders 的<em>獨立性</em>",
            "body": """
    <p>MapRaiders 由 <strong>Scafa Investments LLC</strong>（註冊在美國佛羅里達州）獨立運營。沒有外部投資人、沒有政府單位、沒有沙特資本、沒有中國股東，也沒有大型遊戲集團。公司全部由創辦人 René Scafarti 持有。</p>
    <p>具體做了哪些事：</p>
    <ul>
      <li><strong>歐盟伺服器。</strong>玩家資料放在法蘭克福、符合 GDPR 的資料中心。不放在沙特、不放在中國，也不放在任何威權國家。</li>
      <li><strong>不放廣告 SDK。</strong>app 裡面不嵌任何廣告追蹤元件。</li>
      <li><strong>不賣資料。</strong>玩家資料不會賣給任何第三方，當然也不會賣給沙特主權基金、PIF、Scopely 或它們相關的公司。</li>
      <li><strong>所有權結構是公開的。</strong>Scafa Investments LLC 註冊在佛羅里達州，可以從公開資料查到。</li>
    </ul>
    <p>對於在意自由、隱私、民主價值的台港玩家來說，這算是一個比較透明的選擇。</p>
            """,
        },
        {
            "label": "其實不只是 Pokémon GO",
            "title": "<em>不只一款</em>遊戲的問題",
            "body": """
    <p>沙特 PIF 的盤算不只在 Pokémon GO 上。透過 Savvy Games Group，PIF 目前已經持有：</p>
    <ul>
      <li><strong>ESL FACEIT Group。</strong>全球最大的電競賽事舉辦商。</li>
      <li><strong>Embracer Group 的一部分股份。</strong>《魔戒》、《古墓奇兵》、《死亡之島》系列等 IP 的母集團。</li>
      <li><strong>SNK Corporation。</strong>《拳皇》、《侍魂》系列。</li>
      <li><strong>Nintendo 約 8.3% 股份</strong>（部分已出售）。</li>
      <li><strong>Activision Blizzard 5% 以上股份</strong>（部分已出售）。</li>
      <li>另外還有大量 EA、Take-Two 等公司的股份。</li>
    </ul>
    <p>當全球最大的位置遊戲、最大的電競平台、很多大型遊戲 IP 都同時流向同一個威權主權基金的時候，玩家自己選擇用什麼產品，這件事本身就會變得越來越重要。MapRaiders 是其中一個獨立、透明、立場上跟自由社會站在一起的選項。</p>
            """,
        },
    ],
    "faq": [
        {"q": "Pokémon GO 真的被沙特買走了？",
         "a": "對。2025 年 3 月 12 日，Niantic 把遊戲部門（含 Pokémon GO、Pikmin Bloom、Ingress、Monster Hunter Now）以 35 億美元賣給 Scopely。Scopely 是 Savvy Games Group 的子公司，而 Savvy 完全由沙特阿拉伯公共投資基金（PIF）持有。"},
        {"q": "那我的位置資料現在到底放在哪裡？",
         "a": "Pokémon GO 的位置資料目前透過層層持股結構，最終實質歸 Scopely / Savvy / 沙特 PIF 所有。具體放在哪幾台伺服器，Niantic 跟 Scopely 並沒有完整公開。MapRaiders 這邊則明確把資料放在法蘭克福、符合 GDPR 的歐盟資料中心。"},
        {"q": "為什麼台灣玩家應該在意？",
         "a": "因為台灣是亞洲最民主的社會之一，對自由、人權、資料主權有比較強的認同感。把每天的散步軌跡、家門口 GPS、孩子的位置資料交給沙特主權基金，跟這些價值之間是有落差的。MapRaiders 在這件事上提供另一條路。"},
        {"q": "那香港玩家為什麼也應該在意？",
         "a": "2019 年之後，香港人對「威權底下的監控長什麼樣」有非常具體的體會。沙特 PIF 是威權政府的金融工具，把腳步資料交給這樣的結構，是值得想一下的事。"},
        {"q": "MapRaiders 真的完全沒有沙特資本嗎？",
         "a": "對，完全沒有。Scafa Investments LLC 是註冊在美國佛羅里達州的獨立公司，由創辦人 René Scafarti 完全持有。沒有外部投資人、沒有沙特資本、沒有中國股東、沒有大型遊戲集團。所有權結構是公開可查的。"},
    ],
    "internal_links": [
        ("/zh-tw/Pokemon-GO替代免費.html", "Pokemon GO 替代免費"),
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/Pokemon-GO沙特問題-評價.html", "沙特問題：評價"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
    ],
}

K5 = {
    "slug": "/zh-tw/夜市散步應用程式.html",
    "breadcrumb": "夜市散步應用程式",
    "title": "夜市散步 app：把台北夜市變成你會玩的東西",
    "og_title": "夜市散步 app：把台北變成可玩的城市",
    "meta": "夜市散步 app：MapRaiders 讓你在士林、寧夏、饒河、逢甲、六合夜市一邊散步、一邊占下攤位區、一邊留下回聲。免費、不會打擾你逛夜市、適合全家一起玩。",
    "keywords": "夜市散步, 夜市應用程式, 台北夜市, 士林夜市, 饒河夜市, 散步遊戲",
    "badge": "夜市散步應用程式",
    "pricing_pill": "永久免費・對夜市友善・適合全家",
    "h1_html": '夜市散步 app：把<em>台北夜市</em>變成你會玩的東西',
    "lead": "夜市是台灣文化裡最有代表性的場景之一。士林、寧夏、饒河、逢甲、六合，逛夜市對台灣人來說既是吃，也是一種日常的社交儀式。MapRaiders 不會干擾你享受蚵仔煎，只是在背景把這件事順便玩起來：你走過的攤位區會留在地圖上變成你的領地，找到喜歡的小吃可以放一段音訊回聲，朋友下次來逛同一個夜市時會發現。免費、不放廣告、不用 AR。",
    "trigger": {
        "quote": "我本來每天早上就在跑步，現在每條路線都有點目的：守住或拿回那一塊地。沒想到夜市晚上散步也是同一回事。",
        "author": "Vivian N.，漢堡地區的慢跑者（封閉測試版）"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_VIVIAN],
    "sections": [
        {
            "label": "為什麼是夜市",
            "title": "<em>夜市散步</em>背後的台灣味",
            "body": """
    <p>夜市不只是吃飯。它是台灣社會的<strong>第三空間</strong>：不是家，也不是辦公室，而是親朋好友放鬆湊在一起的場所。一家三代、一群同事、一對情侶，從晚上七點走到十一點，吃幾攤、逛幾家小店、玩個套圈圈，這是台灣最日常的小快樂。</p>
    <p>只是夜市散步通常結束就結束了。MapRaiders 不打算去搶這個氛圍，只是讓走過的路順便留下一點痕跡：你走過的攤位區會變成你的領地，你發現的好店可以變成留給朋友的回聲。下次他們來逛同一個夜市，地圖上就會看到你的足跡。</p>
            """,
        },
        {
            "label": "台灣的代表性夜市",
            "title": "MapRaiders 在<em>五大夜市</em>怎麼玩",
            "body": "<p>每個夜市都有自己的個性。MapRaiders 用遊戲的方式幫你把這些散步留下來：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>士林夜市（台北）</h3><p>規模最大，攤位最密集。從文林路走到大東路，整段路徑都會變成你的領地。在大餅包小餅、上海生煎包前留下幾段回聲都很合適。</p></div>
    <div class="feat-card rv d1"><h3>寧夏夜市（台北）</h3><p>「米其林必比登」推薦的傳統夜市。短而精緻，一條街走完剛好變成一塊整齊的方形領地。豬肝湯、芋圓、魚丸湯，每一攤都值得一段回聲。</p></div>
    <div class="feat-card rv d2"><h3>饒河夜市（台北）</h3><p>松山慈祐宮旁邊的 600 公尺直線夜市。GPS 軌跡會在地圖上畫出一條漂亮的長條領地。胡椒餅、藥燉排骨是觀光客回聲最多的位置。</p></div>
    <div class="feat-card rv d3"><h3>逢甲夜市（台中）</h3><p>學生最多、創新小吃最多的一個。波浪薯條、官芝霖大腸包小腸，每年都有新攤位，回聲的內容也最雜。</p></div>
    <div class="feat-card rv d4"><h3>六合夜市（高雄）</h3><p>高雄地標夜市，海鮮為主。鄭老牌木瓜牛奶、海產粥都是經典。南台灣的夜市味道跟北部完全不同，回聲的氛圍也很不一樣。</p></div>
  </div>""",
        },
        {
            "label": "回聲怎麼用",
            "title": "<em>夜市回聲</em>：把這一晚的味道留給朋友",
            "body": """
    <p>夜市裡最特別的，是那種「我吃過這家」「他們家換口味了」「新開那家超讚」的口耳相傳。MapRaiders 的<strong>回聲</strong>把這件事搬到地圖上，又不會把它變成那種無限滑的社群媒體：</p>
    <ul>
      <li><strong>音訊回聲。</strong>站在士林夜市的「上海生煎包」前，按一下錄音：「這家比另一家好吃，記得加蒜泥。」朋友下次來會聽到。</li>
      <li><strong>照片回聲。</strong>拍下饒河夜市「胡椒餅」剛出爐的那一刻，留在那個 GPS 座標。朋友經過會看到。</li>
      <li><strong>影片回聲。</strong>十秒短片記錄逢甲夜市「波浪薯條」現場製作的樣子，下次同學會的時候有人會挖到。</li>
    </ul>
    <p>回聲只能站在那個地點才能放、才能發現。所以夜市散步還是要真的到場，這個「親自走一趟」的儀式感不會被消費掉。</p>
            """,
        },
        {
            "label": "家人、情侶、朋友",
            "title": "<em>跟誰一起逛</em>都不一樣",
            "body": "<p>夜市散步從來就不是一個人的事：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>帶小孩</h3><p>帶小朋友逛士林夜市，順便讓孩子認識一下台灣文化。可以丟一個小任務給他：「找到三個有貓咪圖案的回聲」，整晚就會變成一場小探險。</p></div>
    <div class="feat-card rv d1"><h3>情侶約會</h3><p>每次去寧夏夜市，留一段只給對方看的回聲。一年之後再翻地圖，那一條街上會有你們兩個人的所有共同記憶。</p></div>
    <div class="feat-card rv d2"><h3>朋友聚會</h3><p>逢甲夜市出現新攤位？看到的人立刻放下回聲，整個朋友圈在地圖上即時就會看到，比丟到 LINE 群組還直接。</p></div>
    <div class="feat-card rv d3"><h3>外地遊客或外國朋友</h3><p>第一次來六合夜市，跟著當地玩家留下的高評價回聲走，通常比官方旅遊指南可靠很多。</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "在夜市開 MapRaiders 會不會很煩？",
         "a": "不會。它是在背景跑的，你不用一直盯手機。GPS 軌跡會自動變成領地，回聲只有你想錄的時候才會錄。其他時間就專心吃蚵仔煎、聊天、看攤就好。"},
        {"q": "可以一晚逛好幾個夜市嗎？",
         "a": "當然。這個禮拜士林、下週寧夏、再下週饒河，你的領地會慢慢在台北地圖上連成一片，整座城市會變成自己的散步地圖。"},
        {"q": "在夜市裡 GPS 收得到嗎？",
         "a": "MapRaiders 對 GPS 的要求沒有 AR app 那麼挑。就算是攤位很密的士林夜市內部，定位精度也夠用來記錄你走過的範圍。"},
        {"q": "小孩適合玩嗎？",
         "a": "可以。MapRaiders 沒有暴力、沒有抽卡、沒有那種「不付錢就跟不上」的設計。家庭逛夜市的時候，可以把手機給小孩玩「找回聲」，比讓他滑短影片健康一點。"},
        {"q": "可以一邊玩 Pokémon GO 一邊玩嗎？",
         "a": "可以。只是 Pokémon GO 在夜市常常沒什麼東西（道館不一定剛好在夜市），MapRaiders 本來就是為日常散步設計，所以夜市對它來說剛剛好。"},
    ],
    "internal_links": [
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/尋寶遊戲應用程式.html", "尋寶遊戲應用程式"),
        ("/zh-tw/夜市散步應用程式-心得.html", "夜市散步：心得"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
    ],
}

K6 = {
    "slug": "/zh-tw/尋寶遊戲應用程式.html",
    "breadcrumb": "尋寶遊戲應用程式",
    "title": "尋寶遊戲 app：把整座城市當作藏寶圖",
    "og_title": "尋寶遊戲 app：整座城市都是寶",
    "meta": "尋寶遊戲 app：MapRaiders 把整座城市當作藏寶圖。免費、適合全家、不放廣告，回聲機制讓真實街道變成大家一起拼出來的寶藏地圖。",
    "keywords": "尋寶遊戲, 尋寶應用程式, 城市尋寶, 兒童遊戲, 家庭活動, 探險",
    "badge": "尋寶遊戲應用程式",
    "pricing_pill": "永久免費・整座城市都是遊樂場",
    "h1_html": '尋寶遊戲 app：把<em>整座城市</em>當作藏寶圖',
    "lead": "一般尋寶遊戲 app 都是預先排好的關卡：A 點、B 點、C 點。MapRaiders 走的是另一條路，整座城市本身就是現場。其他玩家留下的「回聲」散落在你每天經過的轉角，跟家人、朋友、甚至狗狗出門散步時，自然就會被踩到。整個城市就是一張大家一起拼出來的藏寶圖。",
    "trigger": {
        "quote": "你在某個門口放了一段短短的錄音，三天後被一個你不認識的人找到。對一個遊戲來說，那種感覺意外地有點私密。",
        "author": "Aljoscha P.，柏林地區的城市探險家（封閉測試版）"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "現在的尋寶 app",
            "title": "<em>尋寶 app</em> 現在被期待的幾件事",
            "body": """
    <p>2026 年的尋寶 app，跟十年前長得不太一樣。現在玩家會在意的東西大概是這幾個：</p>
    <ul>
      <li><strong>隨時可以開始。</strong>不用先排路線，街上本來就已經有東西可以挖。</li>
      <li><strong>有社交感。</strong>找到其他玩家留下的東西這件事本身就是樂趣的來源。</li>
      <li><strong>不必先付錢。</strong>不買關卡、不訂閱，城市就已經是遊樂場。</li>
    </ul>
    <p>MapRaiders 在這三件事上一次到位，比較像是新一代的尋寶 app。</p>
            """,
        },
        {
            "label": "對照一下",
            "title": "幾款尋寶 app <em>對照</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>玩什麼</th><th>能不能隨時挖</th><th>免費</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">MapRaiders</td><td>整座城市散落著回聲</td><td class="check">✓ 隨時都可以</td><td class="check">✓</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>全世界的實體藏寶</td><td class="check">✓</td><td>付費版有更多功能</td></tr>
      <tr><td class="feat-name">Munzee</td><td>QR Code 探索</td><td class="check">✓</td><td>有功能限制</td></tr>
      <tr><td class="feat-name">Pokémon GO</td><td>道館和 PokéStop</td><td class="cross">預先設定的位置</td><td class="check">✓</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "回聲怎麼運作",
            "title": "MapRaiders 的<em>回聲</em>",
            "body": """
    <p>回聲就是玩家在某個地點留下來的音訊、照片或短影片。下一個經過那個位置的人會看到、聽到。久了之後，街角、巷口、公園都會有別人留下的小故事：</p>
    <ul>
      <li><strong>音訊回聲。</strong>「這條巷子的麵包店超好吃」「這個轉角夕陽最美」這類隨手一句的留言。</li>
      <li><strong>照片回聲。</strong>季節風景、有趣的招牌、隱藏版小店的一張照片。</li>
      <li><strong>影片回聲。</strong>短短一段影片，比文字更能傳達當下的氛圍。</li>
    </ul>
    <p>這些東西散落在城市裡，散步的時候偶然踩到才會跳出來。</p>
            """,
        },
        {
            "label": "小孩與家人",
            "title": "<em>跟家人一起</em>玩",
            "body": "<p>MapRaiders 帶出門也很適合：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>跟小孩一起</h3><p>「下個轉角會有什麼？」散步本身被遊戲化了，重點不在螢幕，而是真實的街道。</p></div>
    <div class="feat-card rv d1"><h3>跟長輩一起</h3><p>操作很簡單，阿公阿嬤也用得上。可以跟孫子一起把家附近這一圈變成自己的領地。</p></div>
    <div class="feat-card rv d2"><h3>跟狗狗一起</h3><p>遛狗時間直接變成家庭活動，小孩也多了一個理由一起走。</p></div>
    <div class="feat-card rv d3"><h3>符合個資法</h3><p>遵守台灣《個人資料保護法》，小孩的資料也是依規定處理。</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "尋寶 app 跟一般位置遊戲差在哪？",
         "a": "尋寶 app 的重點是「發現」。MapRaiders 本身是領地遊戲，但因為城市裡散落著其他玩家的回聲，所以也能當尋寶遊戲玩。兩種樂趣會同時存在。"},
        {"q": "要先買關卡嗎？",
         "a": "不用。MapRaiders 不會要你先買關卡。城市裡已經散落著回聲，你散步的時候自然就會踩到。"},
        {"q": "小孩可以用嗎？",
         "a": "可以，很適合一起散步用。小孩使用時建議家長陪在旁邊。資料處理依台灣《個人資料保護法》。"},
        {"q": "回聲是誰都可以留嗎？",
         "a": "是的，所有玩家都能留回聲。如果有不適當的內容，其他玩家可以檢舉，運營這邊確認之後會刪除。"},
        {"q": "可以帶狗狗一起玩嗎？",
         "a": "當然可以。遛狗的時候順便發現新地點的回聲，是額外的小樂趣。"},
    ],
    "internal_links": [
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
        ("/zh-tw/尋寶遊戲應用程式-評價.html", "尋寶遊戲：評價"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
    ],
}

K7 = {
    "slug": "/zh-tw/香港行山應用程式.html",
    "breadcrumb": "香港行山應用程式",
    "title": "香港行山 app：由中環到太平山，一條徑慢慢拎落嚟",
    "og_title": "香港行山 app：麥理浩徑、龍脊、太平山",
    "meta": "香港行山 app：MapRaiders 將麥理浩徑、太平山、龍脊、西貢變成遊戲。免費、對行山友好、無廣告、無沙特資本，立場上同自由社會企埋一邊。",
    "keywords": "香港行山, 行山 app, 麥理浩徑, 龍脊, 太平山, 西貢, 行山路線",
    "badge": "香港行山應用程式",
    "pricing_pill": "完全免費・對行山友好・無廣告",
    "h1_html": '香港行山 app：由<em>中環行到太平山</em>嘅領地',
    "lead": "全世界搵唔到幾多個地方，可以好似香港咁，由中環半個鐘車程之內就有麥理浩徑、龍脊、衛奕信徑、獅子山、大東山呢類質素嘅行山徑。MapRaiders 將呢啲徑變成可以慢慢累積嘅遊戲：每次行，GPS 軌跡會係地圖上面變成你嘅領地；遇到「呢度有貓貓」「呢個位影到日落」嘅位，可以留低一段回聲俾下次行嘅人。免費、對行山友好、無廣告、無沙特資本。",
    "trigger": {
        "quote": "你在某個門口放了一段短短的錄音，三天後被一個你不認識的人找到。對一個遊戲來說，那種感覺意外地有點私密。",
        "author": "Aljoscha P.，柏林地區的城市探險家（封閉測試版）"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_VIVIAN],
    "sections": [
        {
            "label": "香港行山文化",
            "title": "<em>香港行山</em>：半個鐘就上到山",
            "body": """
    <p>香港最特別嘅地方之一，係<strong>城市同大自然真係好近</strong>。中環搭半個鐘巴士已經到太平山頂，尖沙咀搭港鐵半個鐘到西貢，由將軍澳出發行龍脊都係一個鐘以內嘅事。對好多香港人嚟講，週末行山唔係娛樂，而係生活嘅一部分，係香港呢種高壓城市裏面，少數可以慢落嚟嘅時間。</p>
    <p>不過行山好多時都係自己或者三幾個朋友嘅事。今日你行咗麥理浩徑某一段，下星期同事問「邊段最靚？」你只可以用文字答。MapRaiders 想搞嘅就係呢一塊：你行過嘅路會留係地圖上面，你發現嘅靚景以回聲嘅形式留俾下一個行嘅人。一條徑慢慢就會變成大家一齊砌出嚟嘅故事。</p>
            """,
        },
        {
            "label": "經典香港山徑",
            "title": "MapRaiders 喺<em>五條經典山徑</em>點玩",
            "body": "<p>每條徑性格都唔同，MapRaiders 幫你將呢啲路慢慢累積成領地：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>麥理浩徑（全長 100km）</h3><p>香港最具代表性嘅長距離山徑，由西貢到屯門共 10 段。一段一段慢慢去攻，全程行完之後，整條徑會喺地圖上面連成一條相當有畫面嘅長條領地。每一段嘅最高點都值得放一段回聲。</p></div>
    <div class="feat-card rv d1"><h3>龍脊（石澳到大浪灣）</h3><p>俾《時代雜誌》叫做「亞洲最佳市區行山徑」。8.5km 行起上嚟唔算辛苦，沿路睇到南中國海同石澳半島。回聲熱區之一。</p></div>
    <div class="feat-card rv d2"><h3>太平山頂（盧吉道環迴）</h3><p>3.5km 平緩環迴山徑，半個鐘可以行完。由中環出發最方便，老人家、細路都行得。每個觀景台都值得放一張照片回聲。</p></div>
    <div class="feat-card rv d3"><h3>獅子山（沙田到九龍）</h3><p>「獅子山下精神」嘅精神圖騰。上到頂可以同時望到九龍半島同沙田全景。本地人最有情感連結嘅一條徑。</p></div>
    <div class="feat-card rv d4"><h3>大東山（爛頭營）</h3><p>每年 9 月到 11 月銀色芒草季，係 IG 最紅嘅山。3.5 個鐘來回，難度中等。芒草季嗰陣，回聲特別密。</p></div>
  </div>""",
        },
        {
            "label": "山徑任務",
            "title": "<em>山徑任務</em>：將行山變成可以分嘅挑戰",
            "body": """
    <p>MapRaiders 嘅任務系統，可以將一條徑變成幾個人一齊跟嘅挑戰：</p>
    <ul>
      <li><strong>逐段攻。</strong>「三個月內行完麥理浩徑全部 10 段」。每行完一段，地圖上對應嘅軌跡會永久亮著。10 段都行晒，成條 100km 都會係你嘅領地。</li>
      <li><strong>季節限定。</strong>「9 月到 11 月之間，登頂大東山一次」。銀色芒草季嘅限定挑戰，留低嘅回聲都帶住時間戳記。</li>
      <li><strong>全家行嘅版本。</strong>「全家大細一齊行龍脊」，細路仔都會感受到行完一條徑嘅那種成就感。</li>
      <li><strong>朋友接力。</strong>朋友 A 行咗西貢段，將任務「交棒」俾朋友 B 繼續行下一段，慢慢就變成幾個人一齊嘅遠征。</li>
    </ul>
            """,
        },
        {
            "label": "山友社群",
            "title": "<em>山友社群</em>同資料主權",
            "body": """
    <p>香港有超過 300 個活躍嘅行山 Facebook 群組、好多 IG 山友、Telegram 群組分享路線情報。MapRaiders 唔係要取代呢啲社群，而係補返一塊：</p>
    <ul>
      <li><strong>地圖即時更新。</strong>有山友喺西貢段發現新觀景台？放低一個回聲，成個社群即刻喺地圖上面睇到。比 Facebook 動態消息直接好多。</li>
      <li><strong>分享路線方便。</strong>用 LINE、WhatsApp、Telegram 一掂就可以將你今日嘅行山軌跡 send 俾朋友，佢揭開就可以跟住行。</li>
      <li><strong>資料主權。</strong>你嘅 GPS 軌跡放喺符合 GDPR 嘅歐盟伺服器，唔會跌入沙特 PIF（即係 Pokémon GO 而家嘅新老闆），亦都唔會去到任何威權政權手上。</li>
      <li><strong>唔會跳廣告。</strong>行山時最唔想見到嘅就係廣告彈窗。MapRaiders 完全無廣告。</li>
    </ul>
    <p>對於 2019 年之後，對「我啲資料去咗邊」特別敏感嘅香港人嚟講，呢一點唔細件。</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders 喺山上 GPS 收唔收到？",
         "a": "香港主要嘅行山徑（麥理浩徑、龍脊、太平山、獅子山、大東山）GPS 訊號都足夠。即使係山谷或樹林比較密嘅地方，定位精度都仲夠用嚟記錄軌跡。比起 Pokémon GO 嗰種需要持續高精度 AR 定位嘅 app，反而穩定啲。"},
        {"q": "可以離線用嗎？",
         "a": "暫時記錄軌跡需要網路。不過香港大部分山徑都有 4G 訊號（極少數山谷深處除外）。離線模式預計 2026 年第三季加入。"},
        {"q": "電池夠唔夠用？",
         "a": "因為唔使開 AR，MapRaiders 比 Pokémon GO 大概慳四倍電。行山一日（六到八個鐘）通常只係用 30 到 40% 電。穩陣啲帶埋尿袋。"},
        {"q": "可以同 AllTrails 之類嘅行山 app 一齊用嗎？",
         "a": "可以。AllTrails 提供路線資料庫，MapRaiders 多咗領地遊戲呢一層。一個負責導航，一個負責留低紀念。"},
        {"q": "我嘅 GPS 資料會落入沙特手上嗎？",
         "a": "完全唔會。MapRaiders 由 Scafa Investments LLC（美國佛羅里達州）獨立運營，無沙特資本、無中國股東。資料放喺法蘭克福、符合 GDPR 嘅歐盟伺服器。對 2019 年之後對資料主權敏感嘅香港玩家嚟講，呢點幾重要。"},
    ],
    "internal_links": [
        ("/zh-tw/領地遊戲.html", "領地遊戲"),
        ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
        ("/zh-tw/尋寶遊戲應用程式.html", "尋寶遊戲應用程式"),
        ("/zh-tw/香港行山應用程式-心得.html", "香港行山：心得"),
        ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
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
        "title": "領地遊戲評價：三名測試者實際說了什麼",
        "og_title": "領地遊戲評價：封閉測試版",
        "meta": "領地遊戲評價：三名封閉測試版參與者，講他們在 MapRaiders 第一次拿到地、第一次被衰減、第一次打防守迷你遊戲的感受。原文德文，Schema 以 translationOfWork 標註。",
        "keywords": "領地遊戲 評價, 領地遊戲 心得, MapRaiders 評價",
        "h1_html": '領地遊戲：<em>測試者實際說了什麼</em>',
        "lead": "在地圖上真的拿下一塊地，到底是什麼感覺？三名封閉測試版的參與者，講他們第一次拿到領地、第一次看到地縮回去、第一次打防守迷你遊戲的反應。",
        "intro_label": "我們在看哪幾件事",
        "intro_title": "領地遊戲<em>看什麼</em>",
        "intro_body": """
    <p>這次測試，我們主要在看幾件事：</p>
    <ul>
      <li><strong>第一次拿到地。</strong>看到自己常走的那條街變成「我的」是什麼感覺？</li>
      <li><strong>第一次失去地。</strong>太久沒去走，地縮回去了；或是被別人拿走了，反應如何？</li>
      <li><strong>防守。</strong>那個迷你遊戲玩起來是不是有腦、夠公平、會緊張？</li>
    </ul>
    <p>三名測試者從三個不同的角度涵蓋了這幾件事。</p>
        """,
        "internal_links": [
            ("/zh-tw/領地遊戲.html", "領地遊戲"),
            ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
            ("/zh-tw/位置遊戲-心得.html", "位置遊戲：心得"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/位置遊戲-心得.html",
        "breadcrumb": "位置遊戲 心得",
        "title": "位置遊戲心得：MapRaiders 在三個城市的實測",
        "og_title": "位置遊戲心得：三個城市實測",
        "meta": "位置遊戲心得：MapRaiders 封閉測試版的三名參與者，講他們在德國三個城市實際玩起來的感覺。",
        "keywords": "位置遊戲 心得, 位置遊戲 體驗, MapRaiders 評價",
        "h1_html": '位置遊戲：<em>三個城市實測心得</em>',
        "lead": "位置遊戲玩起來的感覺，跟你住在哪、附近有多少人在玩，關係其實滿大。斯圖加特、漢堡、柏林三名測試者，講各自城市的體驗。",
        "intro_label": "三個城市，三種樣子",
        "intro_title": "<em>同一款 app</em>，三個城市玩起來不一樣？",
        "intro_body": """
    <p>位置遊戲的玩起來什麼樣子，跟附近有多少人在玩很有關。三名測試者剛好涵蓋了三種典型場景：</p>
    <ul>
      <li><strong>柏林（Aljoscha P.）。</strong>城市探險家多，回聲密，常跨區跑。</li>
      <li><strong>漢堡（Vivian N.）。</strong>Alster 湖一圈慢跑客多，比較像體能驅動的使用方式。</li>
      <li><strong>斯圖加特（Ron C.）。</strong>狗主人聚落，比較安靜的鄰里型節奏。</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
            ("/zh-tw/領地遊戲.html", "領地遊戲"),
            ("/zh-tw/領地遊戲-評價.html", "領地遊戲：評價"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/Pokemon-GO替代免費-評價.html",
        "breadcrumb": "Pokémon GO 替代 評價",
        "title": "Pokémon GO 替代評價：兩款一起玩的實測",
        "og_title": "Pokémon GO 替代評價",
        "meta": "Pokémon GO 替代評價：三名封閉測試版參與者，講他們同時開 Pokémon GO 跟 MapRaiders 的真實體驗。",
        "keywords": "Pokemon GO 替代 評價, Pokemon GO 比較, 並用",
        "h1_html": 'Pokémon GO 替代：<em>兩款一起玩的實測</em>',
        "lead": "繼續留著 Pokémon GO，同時試 MapRaiders，實際玩起來會怎樣？三名封閉測試版參與者把感受講得很直接。",
        "intro_label": "並用測試",
        "intro_title": "<em>兩款一起跑</em>會怎樣？",
        "intro_body": """
    <p>很多玩家不會把 Pokémon GO 刪掉，而是把 MapRaiders 加進來一起玩。測試的時候我們在看：</p>
    <ul>
      <li><strong>電池會不會被吃光。</strong>兩款一起開撐不撐得住？</li>
      <li><strong>怎麼分配。</strong>早上開哪一個、下午開哪一個比較順？</li>
      <li><strong>會不會太忙。</strong>兩款一起跑會不會疲乏？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/Pokemon-GO替代免費.html", "Pokemon GO 替代免費"),
            ("/zh-tw/位置遊戲.html", "位置遊戲推薦 2026"),
            ("/zh-tw/Pokemon-GO沙特問題-評價.html", "沙特問題：評價"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/Pokemon-GO沙特問題-評價.html",
        "breadcrumb": "Pokémon GO 沙特問題 評價",
        "title": "Pokémon GO 沙特問題評價：台港玩家怎麼看",
        "og_title": "Pokémon GO 沙特問題評價",
        "meta": "Pokémon GO 沙特問題評價：三名封閉測試版參與者，從民主價值的角度，講 Niantic 被沙特 PIF 買下之後他們的選擇。",
        "keywords": "Pokemon GO 沙特, Pokemon GO 評價, 民主, 自由",
        "h1_html": 'Pokémon GO 沙特問題：<em>台港玩家怎麼看</em>',
        "lead": "2025 年 3 月 Niantic 被沙特 PIF 買下之後，玩家是怎麼看自己的位置資料的？三名測試者從民主、自由、人權的角度分享他們的反應。",
        "intro_label": "資料主權的部分",
        "intro_title": "<em>沙特問題</em>對玩家來說到底有什麼影響",
        "intro_body": """
    <p>從台灣和香港比較看重的民主、自由、人權這幾件事去看，三名測試者談了：</p>
    <ul>
      <li><strong>有沒有意識到。</strong>當初知不知道 Niantic 被沙特 PIF 買下這件事？</li>
      <li><strong>知道之後做了什麼。</strong>使用習慣有沒有變？</li>
      <li><strong>會不會換 app。</strong>MapRaiders「沒有沙特資本」這個承諾，會不會影響選擇？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/Pokemon-GO沙特問題.html", "Pokemon GO 沙特問題"),
            ("/zh-tw/Pokemon-GO替代免費.html", "Pokemon GO 替代免費"),
            ("/zh-tw/領地遊戲-評價.html", "領地遊戲：評價"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/夜市散步應用程式-心得.html",
        "breadcrumb": "夜市散步 心得",
        "title": "夜市散步 app 心得：五大夜市實測",
        "og_title": "夜市散步 app 心得：五大夜市",
        "meta": "夜市散步 app 心得：三名測試者實測 MapRaiders 在士林、寧夏、饒河、逢甲、六合的體驗。",
        "keywords": "夜市散步 心得, 夜市應用程式 評價, 士林夜市",
        "h1_html": '夜市散步 app：<em>五大夜市實測心得</em>',
        "lead": "MapRaiders 在台灣五大夜市玩起來怎麼樣？三名測試者把心得直接攤開來講。",
        "intro_label": "夜市測試在看什麼",
        "intro_title": "<em>夜市散步</em>看哪幾件事",
        "intro_body": """
    <p>夜市這場測試，我們主要看這幾件事：</p>
    <ul>
      <li><strong>會不會打擾。</strong>逛夜市時，這個 app 會不會干擾吃東西或聊天？</li>
      <li><strong>回聲有沒有用。</strong>朋友收到回聲時會覺得實用嗎？</li>
      <li><strong>適不適合一家人。</strong>帶小孩或長輩去夜市，能一起玩嗎？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
            ("/zh-tw/領地遊戲.html", "領地遊戲"),
            ("/zh-tw/尋寶遊戲應用程式-評價.html", "尋寶遊戲：評價"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/尋寶遊戲應用程式-評價.html",
        "breadcrumb": "尋寶遊戲應用程式 評價",
        "title": "尋寶遊戲 app 評價：回聲機制實際玩起來如何",
        "og_title": "尋寶遊戲 app 評價：回聲機制",
        "meta": "尋寶遊戲 app 評價：以回聲機制為中心，三名封閉測試版參與者談他們在 MapRaiders 上的尋寶體驗。",
        "keywords": "尋寶遊戲 評價, 尋寶應用程式 體驗, 回聲機制",
        "h1_html": '尋寶遊戲 app：<em>回聲機制實際玩起來如何</em>',
        "lead": "MapRaiders 的回聲讓整座城市變成尋寶現場。三名測試者把留回聲、撿到回聲的感受直接講出來。",
        "intro_label": "回聲測試",
        "intro_title": "<em>回聲</em>看哪幾件事",
        "intro_body": """
    <p>回聲這場測試，主要看這幾件事：</p>
    <ul>
      <li><strong>留起來會不會麻煩。</strong>音訊、照片、影片回聲，做起來夠不夠順？</li>
      <li><strong>找到別人的回聲時的感覺。</strong>那個瞬間是有趣，還是普通？</li>
      <li><strong>能不能跟小孩一起玩。</strong>家庭場景下適合嗎？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/尋寶遊戲應用程式.html", "尋寶遊戲應用程式"),
            ("/zh-tw/夜市散步應用程式.html", "夜市散步應用程式"),
            ("/zh-tw/夜市散步應用程式-心得.html", "夜市散步:心得"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
        ],
    },
    {
        "slug": "/zh-tw/香港行山應用程式-心得.html",
        "breadcrumb": "香港行山 心得",
        "title": "香港行山 app 心得：五條經典山徑實測",
        "og_title": "香港行山 app 心得：五條山徑",
        "meta": "香港行山 app 心得：三名測試者實測 MapRaiders 喺麥理浩徑、龍脊、太平山、獅子山、大東山行山嘅實際感受。",
        "keywords": "香港行山 心得, 香港行山 評價, 麥理浩徑, 龍脊",
        "h1_html": '香港行山 app：<em>五條經典山徑實測心得</em>',
        "lead": "MapRaiders 喺香港啲經典山徑用起上嚟係點？三名測試者直接分享實測感受。",
        "intro_label": "行山測試",
        "intro_title": "<em>香港行山</em>睇邊幾樣嘢",
        "intro_body": """
    <p>呢場行山測試，我哋主要睇幾樣嘢：</p>
    <ul>
      <li><strong>GPS 穩唔穩。</strong>麥理浩徑、龍脊呢類山徑，GPS 訊號夠唔夠穩定？</li>
      <li><strong>電池夠唔夠用。</strong>行成日山（六到八個鐘），電池頂得住？</li>
      <li><strong>山友回聲。</strong>山友之間留嘅回聲，幫到下一個行嘅人嗎？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-tw/香港行山應用程式.html", "香港行山應用程式"),
            ("/zh-tw/領地遊戲.html", "領地遊戲"),
            ("/zh-tw/位置遊戲-心得.html", "位置遊戲：心得"),
            ("/zh-tw/MapRaiders-評價.html", "MapRaiders 的所有評價"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/zh-tw/MapRaiders-評價.html",
    "breadcrumb": "MapRaiders 評價",
    "title": "MapRaiders 評價：所有評價與封閉測試版整理",
    "og_title": "MapRaiders 評價：所有頁面整理",
    "meta": "MapRaiders 評價：5.0 / 5（三名驗證封閉測試版評價）、創辦人說明，加上所有 Killer 頁面與評價的中心。",
    "keywords": "MapRaiders 評價, MapRaiders 心得, MapRaiders 評分, GPS MMO 評價",
    "badge": "中心：全部一覽",
    "pricing_pill": "5.0 / 5：三名驗證封閉測試版評價",
    "h1_html": '<em>MapRaiders 評價</em>：關於這款 GPS MMO，你需要知道的事都在這',
    "lead": "三名來自斯圖加特、漢堡、柏林的封閉測試版參與者。從 Pokémon GO 替代到夜市散步、從香港行山到尋寶遊戲，七個主題、七篇評價，一個中心頁面整理在一起。",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "MapRaiders 到底是什麼？",
         "a": "MapRaiders 是 Android 上的 GPS MMO 遊戲。玩家走路、跑步、騎車的時候會占下真實的領地、留下回聲、創建任務，地被攻擊的時候用迷你遊戲守。免費、不放廣告、不用 AR、沒有沙特資本。"},
        {"q": "封閉測試版總共有多少人？",
         "a": "目前公開介紹的三名是經過本人同意，為了保護隱私只用名字加上姓氏縮寫。封閉測試版整體規模比這個大，這三位代表三種不同類型的玩家。"},
        {"q": "評價是真的嗎？",
         "a": "是真的。三名測試者都是封閉測試版的實際參與者，沒收任何報酬。評論原文是德文，在 Schema.org 上標註了日期跟語言（translationOfWork）。"},
        {"q": "我可以加入封閉測試版嗎？",
         "a": "可以從首頁的 email 表單登記。會依空缺分階段開放名額，玩家密度比較低的地區會優先。"},
        {"q": "正式版什麼時候上？",
         "a": "MapRaiders 目前在 Google Play 上以封閉測試版提供。正式發行預計在 2026 年內，iOS 版預計 2026 年第三季。"},
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

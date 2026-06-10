#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 12 — ZH-CN Killer-URL Builder (Simplified Chinese, Mainland-Sensitive)
Generates 15 ZH-CN pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_ZH-CN_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_zhcn.py
Idempotent: overwrites existing files. Output: docs/zh-cn/

ZH-CN-Mainland-Sensitive-Rules:
- Title-CJK 30-35 ch
- Simplified Chinese durchgaengig (NICHT Traditional)
- KEIN Saudi-Bashing (China-Saudi-Beziehungen)
- KEIN Hong Kong-Reference
- KEIN Anti-Authoritarian-Frame
- KEIN Demokratie-Vergleich
- K4 Anti-VPN-Frame TECHNISCH (Pokemon GO braucht VPN, MapRaiders nicht), KEIN politischer Frame
- K7 Tencent 量子计划 als Komplement-Vergleich (kein Bashing)
- Pill-Label: "来自封闭测试"
- USD-Pricing dominant (Diaspora-Fokus), CNY-Pricing als Sub-Anker
- Noto Sans SC preload (NICHT TC!)
- WeChat-Sharing dominant + Weibo + QQ (KEIN WhatsApp/Telegram - in CN blockiert)
- Vokabular CN: 应用 (NICHT 應用程式), 小区 (NICHT 社區), 视频 (NICHT 視頻)
"""

import json
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ZHCN_DIR = DOCS / "zh-cn"
SITE = "https://mapraiders.com"
LANG = "zh-CN"
LANG_PREFIX = "/zh-cn"

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
# REUSABLE BLOCKS — ZH-CN Tester (Master-Plan §1.2 Simplified)
# -----------------------------------------------------------------------------

TESTER_RON = {
    "name": "Ron C.",
    "role": "狗主人・斯图加特地区",
    "role_long": "斯图加特地区的狗主人（封闭测试）",
    "quote": "我家狗反正一天得遛两次，那不如顺手把街区也带上。听起来挺傻的，但每天晚上我都会瞄一眼，看看是不是还都是蓝的。",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "慢跑者・汉堡地区",
    "role_long": "汉堡地区的慢跑者（封闭测试）",
    "quote": "我本来每天早上就跑，现在多了一件事要做：守着自己的圈子。Alster湖那一圈是我的，我希望它一直是。奇怪，这居然能逼出这么多自律。",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "城市探索者・柏林地区",
    "role_long": "柏林地区的城市探索者（封闭测试）",
    "quote": "你在某个门口留下一段几秒的录音，三天后被一个完全不认识的人捡到。说实话，对一个游戏来说，那种感觉有点过于私密了。",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "我玩了三年Pokémon GO，后来慢慢就放下了。一直缺的那个东西始终没来：真正属于自己的地，而不是几分钟就翻盘的道馆。"
    "我也不想再忍无止境的活动票、季票、抽卡。所以我自己写了MapRaiders。"
    "没有广告，没有投资人的KPI压力，没有强制订阅。我的街区是我的，你的街区，你自己拿。"
)

# Pricing-Offers USD dominant + CNY Sub (Master-Plan §1.1, Diaspora-Fokus)
PRICING_OFFERS = [
    {"name": "永久免费", "price": "0", "currency": "USD"},
    {"name": "外观内购（最低价）", "price": "1.99", "currency": "USD"},
    {"name": "MapRaiders 支持者（月）", "price": "4.99", "currency": "USD"},
    {"name": "终身支持者", "price": "99", "currency": "USD"},
    {"name": "永久免费（人民币）", "price": "0", "currency": "CNY"},
    {"name": "外观内购（最低价，人民币）", "price": "15", "currency": "CNY"},
    {"name": "MapRaiders 支持者（月，人民币）", "price": "35", "currency": "CNY"},
    {"name": "终身支持者（人民币）", "price": "699", "currency": "CNY"},
]

# DefinedTermSet — Brand-Vocab ZH-CN (Master-Plan §8) — Simplified, 小区 NICHT 社區!
DEFINED_TERMS = [
    ("领地", "玩家或公会持续占有的地图区域"),
    ("回声", "玩家在某个地点留下的音频、照片或视频信号，可被其他玩家发现"),
    ("公会", "共同守护和保卫领地的玩家有机群体"),
    ("任务", "玩家创建、其他玩家可在现实世界完成的小任务"),
    ("防守小游戏", "领地受争夺时触发的小游戏（井字棋、剪刀石头布、迷你国际象棋）"),
    ("小区", "玩家所在的真实邻里或地区"),
    ("收藏品", "玩家创建并放置在领地中的收藏物件"),
    ("放下回声", "在现实地点留下回声的行为"),
    ("领地衰减", "闲置领地随时间退化、可被再次占领的机制"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    out = []
    for lang, prefix in HREFLANG:
        if lang == "zh-Hans":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}/">')
    return "\n".join(out)


def lang_switcher_html(active="zh-Hans"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">来自封闭测试</div>
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
    <div class="fr-label">创始人</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, MapRaiders 创始人" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">创始人，Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">来自封闭测试</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.8">
      备注：测试者为封闭测试参与者。出于隐私考虑，姓氏没有放出来。原文是德文，已在 Schema 中以 <code>translationOfWork</code> 标注。
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    """ZH-CN Sharing: WeChat dominant + Weibo + QQ (KEIN WhatsApp/Telegram, blockiert in CN)"""
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING (ZH-CN: WeChat + Weibo + QQ) -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="分享"><span class="mr-share__label">分享：</span><a class="mr-share__btn" href="javascript:void(0)" onclick="alert('请打开微信扫一扫，分享给朋友')" title="微信">微信</a><a class="mr-share__btn" href="https://service.weibo.com/share/share.php?url={enc}" target="_blank" rel="noopener noreferrer">微博</a><a class="mr-share__btn" href="https://connect.qq.com/widget/shareqq/index.html?url={enc}" target="_blank" rel="noopener noreferrer">QQ</a><a class="mr-share__btn" href="https://twitter.com/intent/tweet?url={enc}" target="_blank" rel="noopener noreferrer">𝕏</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">服务条款</a><a href="/datenschutz.html">隐私政策</a><a href="/impressum.html">运营者信息</a><a href="/kontakt.html">联系我们</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders。你的街区，你的领地。由 Scafa Investments LLC 提供。</p>
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
  <a href="/zh-cn/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/zh-cn/#features" class="lnk">功能</a>
    <a href="/zh-cn/MapRaiders-评价.html" class="lnk">评价</a>
    <div class="lang-sw">
      <button class="lsw-btn">简中 <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('zh-Hans')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">即将推出</a>
  </div>
</div>
</nav>"""


def base_css():
    return """*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:hidden}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;font-family:Outfit,"Noto Sans SC",system-ui,sans-serif}
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
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap">"""


# -----------------------------------------------------------------------------
# SCHEMA BUILDERS
# -----------------------------------------------------------------------------

def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "首页", "item": f"{SITE}/zh-cn/"},
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
            "inLanguage": "zh-CN",
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
            "inLanguage": "zh-CN",
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
            "inLanguage": "zh-CN",
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
            "jobTitle": "创始人",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-zh-cn",
            "name": "MapRaiders Brand Vocabulary (ZH-CN)",
            "inLanguage": "zh-CN",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "首页", "item": f"{SITE}/zh-cn/"},
        {"@type": "ListItem", "position": 2, "name": "评价", "item": f"{SITE}/zh-cn/MapRaiders-评价.html"},
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
            "inLanguage": "zh-CN",
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
            "inLanguage": "zh-CN",
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
            "inLanguage": "zh-CN",
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
        "name": "MapRaiders ZH-CN：所有评价及Killer页面",
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
  <div class="sec-label rv">常见问题</div>
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
  <h2 class="rv">看看其他<em>相关主题</em></h2>
  <p class="rv d1">想再多看一点 MapRaiders 的内容：</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">即将在 Google Play 推出 &bull; 免费 &bull; 无垃圾信息</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">获取发布通知</a>
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
<html lang="zh-CN" data-theme="light">
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
<meta property="og:locale" content="zh_CN">
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
    获取发布通知
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
  <div class="sec-label rv">评分</div>
  <h2 class="sec-title rv d1">5.0 / 5：<em>3名封闭测试参与者的真实反馈</em></h2>
  <div class="prose rv d2">
    <p>3位德国测试者（狗主人、慢跑者、城市探索者）在几周时间里用了 MapRaiders。下面的反馈原文是德文，由封闭测试的真实参与者写的。出于隐私考虑，姓氏没有放出来。</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
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
<meta property="og:locale" content="zh_CN">
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
  <div class="h-badge rv">评价</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">了解更多 →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">查看评价 →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">主题中心</div>
  <h2 class="sec-title rv d1">MapRaiders的<em>所有主题</em>一览</h2>
  <div class="prose rv d2">
    <p>这里能看到全部7个Killer页面和7篇评价。从 Pokémon GO 替代到不用VPN直接玩，从领地游戏到散步游戏化，再到量子计划补位和城市寻宝，每个角度都拆开来讲了一次。每篇都能单独读，串起来又是一张完整的图。</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">评价详情</div>
  <h2 class="sec-title rv d1">从<em>不同视角</em>看测试者的反馈</h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">综合评分</div>
  <h2 class="sec-title rv d1">5.0 / 5：<em>3位封闭测试参与者反馈</em></h2>
  <div class="prose rv d2">
    <p>所有反馈都来自2026年2月到4月的封闭测试。3位测试者分别是狗主人、慢跑者、城市探索者，按各自的路线在斯图加特、汉堡、柏林试用了 MapRaiders。原文是德文，由真实参与者写的。</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
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
<meta property="og:locale" content="zh_CN">
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
    "slug": "/zh-cn/领地游戏.html",
    "breadcrumb": "领地游戏",
    "title": "领地游戏：在真实地图上征服土地的GPS MMO",
    "og_title": "领地游戏：在真实地图上征服土地的GPS MMO",
    "meta": "领地游戏应用：MapRaiders让你在真实地图上持续占有领地的GPS MMO。免费、无广告、无AR、无强制订阅。一步一步，征服你的街区。",
    "keywords": "领地游戏, 领地, GPS MMO, 位置游戏, 散步, 应用",
    "badge": "领地游戏",
    "pricing_pill": "永久免费 · 外观内购自选（¥15 起）",
    "h1_html": '领地游戏：在真实地图上<em>征服你的土地</em>',
    "lead": "搜「领地游戏」基本上跳出来的不是棋盘游戏就是维基词条。真正能在地图上持续占有一片地的手机应用，到今天还是少数。MapRaiders 把你走过的每条街变成留得住的领地。免费，没广告，没AR，也不强制订阅。",
    "trigger": {
        "quote": "把你的街区拿下来。无需VPN。",
        "author": "MapRaiders 概念"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "什么是领地游戏",
            "title": "<em>领地游戏</em>的本质",
            "body": """
    <p><strong>领地游戏</strong>是在地图上持续占有、防守、扩展某块区域的游戏。它把传统的「围棋」「占地」概念带到数字世界，与单纯收集点数的应用完全不同。</p>
    <p>真正的领地游戏，需要4个机制：</p>
    <ul>
      <li><strong>持续性。</strong>占领的领地即使你离线，仍归属于玩家或公会。</li>
      <li><strong>衰减。</strong>闲置的领地会随时间缩小，没有人能永久垄断。</li>
      <li><strong>防守。</strong>受到攻击时，由玩家小游戏决胜负，而非自动算分。</li>
      <li><strong>公会继承。</strong>领地可以传递给伙伴或公会，产生经济深度。</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders的领地系统",
            "title": "MapRaiders的<em>领地机制</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>占领</h3><p>走路、跑步或骑车经过街道时，GPS轨迹会在地图上化作领地多边形，刻上你的名字。</p></div>
    <div class="feat-card rv d1"><h3>衰减引擎</h3><p>不常经过的领地每天会一点点缩。能不能保住，看你走不走，不看你充不充。</p></div>
    <div class="feat-card rv d2"><h3>防守小游戏</h3><p>井字棋、剪刀石头布、迷你国际象棋等7种对战决胜负。比拼的是策略，不是时间。</p></div>
    <div class="feat-card rv d3"><h3>公会领地</h3><p>多名玩家可共同持有同一块领地。公会领地更强韧，单人攻击者难以突破。</p></div>
  </div>""",
        },
        {
            "label": "Pokémon GO 的不同",
            "title": "Pokémon GO <em>没有</em>的部分",
            "body": """
    <p>Pokémon GO 本身做得不错，但它没有「真正的领地」这个概念。道馆只是短暂占着，几分钟之后就会被翻盘。没有持续，没有衰减，也没有公会继承。MapRaiders 想填的，就是这个空白：<strong>真实土地的持续归属</strong>。</p>
    <p>另一个绕不开的现实：Pokémon GO 在中国大陆<strong>没法直接玩</strong>，多数玩家得靠VPN进去。MapRaiders 走的是另一条路：GPS-only，新加坡服务器，不依赖被屏蔽的任何服务，海外华人和国内用户都能直接连上。</p>
            """,
        },
    ],
    "faq": [
        {"q": "什么是领地游戏？",
         "a": "领地游戏是在地图上持续占有、防守、扩展区域的游戏。MapRaiders 中，你实际走过的街道会化为你的领地，刻在GPS地图上。除非其他玩家夺回，否则那块地永远是你的。"},
        {"q": "需要付费吗？",
         "a": "不需要。所有游戏机制（领地、回声、任务、公会、防守小游戏）完全免费。外观内购（¥15 – ¥69）为自选，仅改变外观，不影响游戏机制。"},
        {"q": "需要AR相机吗？",
         "a": "不需要。MapRaiders 不使用AR，仅以GPS和地图运作。电池负担小，隐私也更受保护。"},
        {"q": "电池能撑多久？",
         "a": "因为不使用AR，相较于 Pokémon GO，长时间散步约可省4倍电池。1–2小时的慢跑也不必担心电量耗尽。"},
        {"q": "iOS版何时推出？",
         "a": "目前仅Android版于Google Play以封闭测试形式提供。iOS版预计2026年第3季推出。欢迎加入邮件列表，发布时通知您。"},
    ],
    "internal_links": [
        ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
        ("/zh-cn/无VPN位置游戏.html", "无VPN位置游戏"),
        ("/zh-cn/量子计划替代.html", "量子计划替代"),
        ("/zh-cn/领地游戏-评价.html", "领地游戏 ：评价"),
        ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
    ],
}

K2 = {
    "slug": "/zh-cn/位置游戏.html",
    "breadcrumb": "位置游戏",
    "title": "位置游戏推荐 2026：7款GPS游戏对比",
    "og_title": "位置游戏推荐 2026：7款对比",
    "meta": "位置游戏推荐 2026：7款GPS位置游戏完整对比。MapRaiders专注持续占有领地的GPS MMO，免费、无AR、无需VPN、海外华人可直接玩。",
    "keywords": "位置游戏, 位置游戏推荐, GPS游戏, 2026, 对比, Pokemon GO, 量子计划",
    "badge": "位置游戏推荐",
    "pricing_pill": "MapRaiders 永久免费 · 外观内购自选",
    "h1_html": '位置游戏推荐 2026：可占有<em>真实领地</em>的7款应用',
    "lead": "想找一款位置游戏？2026年选择不少：Pokémon GO、Pikmin Bloom、Ingress、量子计划、地球入侵，各有各的玩法。但如果你在意「能不能持续占住一片真实的地」，MapRaiders 走的是不太一样的路线。对一对，看哪款适合你。",
    "trigger": {
        "quote": "Pokemon GO在中国玩不了，MapRaiders到处都能玩。",
        "author": "MapRaiders 概念"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "怎么选择",
            "title": "选择位置游戏的<em>3个维度</em>",
            "body": """
    <p>从众多位置游戏中找出适合自己的，可以从3个维度对比：</p>
    <ul>
      <li><strong>付费结构。</strong>是完全免费，还是有抽卡、订阅、季票？想长期玩很重要。</li>
      <li><strong>需不需要AR。</strong>使用AR的应用耗电量大，不适合长时间散步。</li>
      <li><strong>访问稳定性。</strong>是否需要VPN？是否在中国大陆可直接玩？</li>
    </ul>
            """,
        },
        {
            "label": "7款对比",
            "title": "2026年版・<em>位置游戏推荐7款</em>",
            "body": "<p>每款应用都有自己的长处。MapRaiders 在领地，Pokémon GO 在收集，Pikmin Bloom 在步数。下面这张表把它们放到一起对比一下：</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>#</th><th>应用</th><th>提供商</th><th>特色</th><th>真正的领地</th><th>无需VPN</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC（独立）</td><td>领地MMO、回声、防守小游戏</td><td class="check">✓ 持续</td><td class="check">✓ 直接玩</td></tr>
      <tr><td>2</td><td class="feat-name">Pokémon GO</td><td>Niantic / Scopely</td><td>宝可梦收集、道馆、团体战</td><td class="cross">✗ 仅道馆捕获</td><td class="cross">需VPN</td></tr>
      <tr><td>3</td><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td>步数、苗木、花朵</td><td class="cross">✗</td><td class="cross">需VPN</td></tr>
      <tr><td>4</td><td class="feat-name">Ingress</td><td>Niantic / Scopely</td><td>传送门、阵营对战</td><td class="cross">✗ 传送门</td><td class="cross">需VPN</td></tr>
      <tr><td>5</td><td class="feat-name">量子计划（Tencent）</td><td>腾讯</td><td>本地LBS游戏，国服顺畅</td><td class="cross">✗ 收集型</td><td class="check">✓ 中国本地</td></tr>
      <tr><td>6</td><td class="feat-name">地球入侵（上海）</td><td>独立工作室</td><td>本地AR/位置游戏</td><td class="cross">✗</td><td class="check">✓</td></tr>
      <tr><td>7</td><td class="feat-name">Geocaching</td><td>Groundspeak</td><td>世界各地的藏宝探索</td><td class="cross">✗</td><td>部分功能可访问</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "MapRaiders 的5个特色",
            "title": "MapRaiders <em>独有的5点</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>真实领地持有</h3><p>走过的街道直接以你的名字成为持续存在的领地。除非衰减或被攻击，否则永远是你的。</p></div>
    <div class="feat-card rv d1"><h3>声音回声</h3><p>在地点留下音频、照片、视频回声。其他玩家经过时可发现，整座城市变成共同的寻宝。</p></div>
    <div class="feat-card rv d2"><h3>7种防守小游戏</h3><p>井字棋、剪刀石头布、迷你国际象棋等。受到攻击时靠策略决胜。</p></div>
    <div class="feat-card rv d3"><h3>有机公会</h3><p>公会不是Discord服务器，而是从邻居自然形成。常走同一条街的人就成了伙伴。</p></div>
    <div class="feat-card rv d4"><h3>无需VPN</h3><p>新加坡服务器，海外华人与中国用户都可直接访问。GPS-only架构，无被屏蔽的依赖项。</p></div>
  </div>""",
        },
        {
            "label": "海外华人案例",
            "title": "新加坡、温哥华、纽约的<em>海外华人</em>怎么玩",
            "body": """
    <p>海外华人是MapRaiders的早期社区核心：</p>
    <ul>
      <li><strong>新加坡。</strong>华人浓密的小印度、牛车水街区，散步路线即领地。每天通勤都能积累。</li>
      <li><strong>温哥华。</strong>列治文Richmond的华人社区，遛狗、买菜路上自然占领街区。</li>
      <li><strong>纽约。</strong>法拉盛、唐人街，华人朋友圈通过MapRaiders的回声系统分享好餐厅、好咖啡馆。</li>
      <li><strong>洛杉矶。</strong>圣盖博、罗兰岗，华人慢跑团把每条路线变成公会领地。</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "什么是位置游戏？",
         "a": "位置游戏是利用智能手机GPS定位数据来游玩的游戏总称。实际走过真实街道时会触发游戏内事件。代表作有Pokémon GO、Ingress、量子计划、MapRaiders等。"},
        {"q": "MapRaiders 免费吗？",
         "a": "是的，游戏机制完全免费。外观内购（¥15 – ¥69）为自选，仅改变外观。没有抽卡、季票、强制订阅。"},
        {"q": "需要AR吗？",
         "a": "不需要。MapRaiders 不使用AR。电池续航佳，隐私也更受保护。"},
        {"q": "在中国大陆可以直接玩吗？",
         "a": "是的。MapRaiders 使用新加坡服务器、GPS-only架构，不依赖任何被屏蔽的服务。无需VPN即可正常使用。"},
        {"q": "iOS版何时推出？",
         "a": "目前仅Android版于封闭测试提供。iOS版预计2026年第3季。"},
    ],
    "internal_links": [
        ("/zh-cn/领地游戏.html", "领地游戏"),
        ("/zh-cn/Pokemon-GO替代免费.html", "Pokemon GO替代免费"),
        ("/zh-cn/无VPN位置游戏.html", "无VPN位置游戏"),
        ("/zh-cn/散步游戏化App.html", "散步游戏化App"),
        ("/zh-cn/寻宝游戏App.html", "寻宝游戏App"),
        ("/zh-cn/量子计划替代.html", "量子计划替代"),
        ("/zh-cn/位置游戏-评价.html", "位置游戏 ：评价"),
        ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
    ],
}

K3 = {
    "slug": "/zh-cn/Pokemon-GO替代免费.html",
    "breadcrumb": "Pokemon GO替代免费",
    "title": "Pokemon GO 替代：免费，无需VPN",
    "og_title": "Pokemon GO 替代免费：MapRaiders",
    "meta": "Pokemon GO替代免费应用：MapRaiders独立运营、无广告、无AR、无强制订阅、无需VPN。海外华人与中国用户均可直接玩的GPS MMO。",
    "keywords": "Pokemon GO 替代, Pokemon GO 免费, Pokemon GO 替代品, 位置游戏, 无AR",
    "badge": "Pokemon GO 替代",
    "pricing_pill": "完全免费 · 无广告 · 无AR · 无需VPN",
    "h1_html": 'Pokémon GO 替代：<em>免费，无需VPN</em>',
    "lead": "想玩Pokémon GO，但在国内连不上？开了VPN还动不动断线？怕AR一开半小时就没电？MapRaiders 是另一个选择，独立运营，GPS-only，没AR，没广告，也不强制订阅。新加坡服务器，无需VPN就能直接玩，是一款能持续占有真实领地的GPS MMO。",
    "trigger": {
        "quote": "不氪金，不放广告，不卖订阅。",
        "author": "MapRaiders 概念"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "为什么找替代",
            "title": "寻找Pokémon GO<em>替代</em>的理由",
            "body": """
    <p>Pokémon GO 本身没毛病。但放到国内玩家身上，几个问题挺明显：</p>
    <ul>
      <li><strong>没法直接玩。</strong>Pokémon GO 在中国大陆没通过NPPA审批，得靠VPN进。VPN本身就不太稳，再加上游戏对GPS和网络都挑，玩着玩着断线是常态。</li>
      <li><strong>付费疲劳。</strong>季票、远程团体战票、各种加成。免费也能玩，但不掏钱就追不上的部分一年比一年多。</li>
      <li><strong>电池消耗。</strong>AR模式费电，散步走个一小时就空。</li>
      <li><strong>AR疲劳。</strong>每天散步、通勤都得举起手机，时间一长就嫌烦。</li>
    </ul>
    <p>MapRaiders 在这4件事上做了不一样的选择。</p>
            """,
        },
        {
            "label": "MapRaiders 的「免费」",
            "title": "MapRaiders <em>「免费」</em>的定义",
            "body": "<p>为了不引起误解，价格结构从一开始就完全透明：</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>方案</th><th>内容</th><th>价格（人民币 / 美元）</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">永久免费</td><td>所有机制（领地、回声、任务、公会、防守、赛季活动）</td><td>¥0 / $0</td></tr>
      <tr><td class="feat-name">外观内购</td><td>标记、领地颜色、公会徽章、皮肤</td><td>¥15 – ¥69 / $1.99 – $9.99</td></tr>
      <tr><td class="feat-name">MapRaiders 支持者（月）</td><td>荣誉徽章、Beta抢先、创始人通讯、月度外观</td><td>¥35/月 / $4.99/月</td></tr>
      <tr><td class="feat-name">终身支持者</td><td>收藏家外观、致谢署名</td><td>¥699 / $99（一次性）</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>关键：</strong>外观内购不影响游戏机制。即使什么都不买，仍能与终身支持者享受相同的机制。</p>""",
        },
        {
            "label": "对比 Pokémon GO",
            "title": "Pokémon GO <em>的差异与共通点</em>",
            "body": """
    <p>Pokémon GO 和 MapRaiders 都算「位置游戏」，但玩法不在一个方向上。一起玩，各自的长处反而更明显：</p>
            """,
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>层面</th><th>Pokémon GO</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">主要乐趣</td><td>宝可梦收集、道馆、团体战</td><td>领地占领、回声、防守小游戏</td></tr>
      <tr><td class="feat-name">中国大陆访问</td><td>需VPN（不稳定）</td><td>直接玩（新加坡服务器）</td></tr>
      <tr><td class="feat-name">AR</td><td>建议使用（耗电大）</td><td>不需要（GPS-only）</td></tr>
      <tr><td class="feat-name">广告</td><td>活动时偶有</td><td>无</td></tr>
      <tr><td class="feat-name">免费可享所有功能</td><td>有部分限制</td><td>完全免费（外观自选）</td></tr>
      <tr><td class="feat-name">电池续航</td><td>1–2小时须充电</td><td>长时间散步也够</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "技术架构",
            "title": "MapRaiders 的<em>技术架构</em>",
            "body": """
    <p>MapRaiders 由 <strong>Scafa Investments LLC</strong>（佛罗里达州，美国）独立运营。技术架构从一开始就考虑全球访问的稳定性：</p>
    <ul>
      <li><strong>新加坡主服务器。</strong>对中国大陆、东南亚、海外华人均提供低延迟访问。</li>
      <li><strong>GPS-only架构。</strong>不依赖被屏蔽的服务（无Google Maps API依赖、无Firebase Auth依赖）。</li>
      <li><strong>无广告SDK。</strong>应用内不加载任何广告追踪组件。</li>
      <li><strong>透明的所有权结构。</strong>Scafa Investments LLC 在美国佛罗里达州注册，所有权结构公开可查。</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "需要停止玩Pokémon GO吗？",
         "a": "不需要。MapRaiders 与 Pokémon GO 可以同时玩。是不同类型的乐趣，一起玩也很推荐。但如果你在中国大陆，MapRaiders 无需VPN，体验更稳定。"},
        {"q": "完全免费吗？",
         "a": "是的。所有游戏机制都免费。外观内购（¥15 – ¥69）为自选，仅改变外观。"},
        {"q": "会显示广告吗？",
         "a": "不会。MapRaiders 100% 无广告。使用过程中不会出现任何广告。"},
        {"q": "有用AR吗？",
         "a": "没有。MapRaiders 仅以GPS和地图运作。电池续航佳，隐私也更受保护。"},
        {"q": "在中国大陆稳定吗？",
         "a": "是的。MapRaiders 使用新加坡服务器、GPS-only架构，不依赖任何被屏蔽的服务。无需VPN即可正常使用。"},
    ],
    "internal_links": [
        ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
        ("/zh-cn/无VPN位置游戏.html", "无VPN位置游戏"),
        ("/zh-cn/领地游戏.html", "领地游戏"),
        ("/zh-cn/Pokemon-GO替代免费-评价.html", "Pokemon GO替代 ：评价"),
        ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
    ],
}

K4 = {
    "slug": "/zh-cn/无VPN位置游戏.html",
    "breadcrumb": "无VPN位置游戏",
    "title": "无VPN位置游戏：在国内直接玩",
    "og_title": "无VPN位置游戏：直接玩",
    "meta": "无需VPN玩位置游戏：MapRaiders直接玩。Pokemon GO替代品，国内可玩，免费、无广告、不用AR、新加坡服务器低延迟。",
    "keywords": "无VPN, 位置游戏, 中国可玩, Pokemon GO 替代, 新加坡服务器",
    "badge": "无VPN位置游戏",
    "pricing_pill": "无需VPN · 直接玩 · 新加坡服务器",
    "h1_html": '无VPN位置游戏：在<em>国内直接玩</em>',
    "lead": "想玩位置游戏，但 Pokémon GO、Ingress、Pikmin Bloom 都得挂VPN？VPN本身不稳，玩着玩着就断？MapRaiders 在架构上就避开了这个问题：新加坡服务器、GPS-only、不依赖任何被屏蔽的服务。直接打开就能玩。",
    "trigger": {
        "quote": "Pokémon GO 在国内连不上，MapRaiders 到哪儿都能玩。",
        "author": "MapRaiders 概念"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "Pokémon GO 在国内",
            "title": "Pokémon GO <em>在国内的现状</em>",
            "body": """
    <p>Pokémon GO 从2016年全球上线到现在，没有拿到<strong>NPPA（国家新闻出版署）</strong>的版号。具体的影响是：</p>
    <ul>
      <li><strong>不在国内App Store上架。</strong>iPhone用户无法直接下载。</li>
      <li><strong>不在国内Android应用商店上架。</strong>华为、小米、OPPO、vivo应用市场都没有。</li>
      <li><strong>需要VPN访问游戏服务器。</strong>就算从海外商店装好，进游戏也常常卡在登录页。</li>
    </ul>
    <p>这是个技术加监管的现实问题：任何依赖 Google Maps API、Firebase Auth、Niantic 自有服务器的游戏，在国内都会遇到访问障碍。</p>
            """,
        },
        {
            "label": "为什么VPN方案不够好",
            "title": "为什么<em>VPN方案</em>不是答案",
            "body": """
    <p>很多Pokémon GO玩家选择挂VPN，但这套方案本身有几个槽点：</p>
    <ul>
      <li><strong>不稳定。</strong>VPN经常断线，断线之后游戏里的GPS会突然「跳」到VPN出口节点（日本、新加坡），直接触发反作弊。</li>
      <li><strong>延迟高。</strong>道馆战、团体战要低延迟，VPN一下就把延迟拉高200到500毫秒，实时操作受影响。</li>
      <li><strong>电池吃紧。</strong>VPN加密、AR模式、GPS定位三件事一起上，手机一两小时就空了。</li>
      <li><strong>账号风险。</strong>Niantic对位置「跳跃」很敏感，频繁切VPN有被封号的可能。</li>
      <li><strong>合规层面。</strong>个人挂VPN本身就有合规风险，公司发的工作机更可能直接违反IT政策。</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders 的技术架构",
            "title": "MapRaiders 的<em>架构层面</em>解决方案",
            "body": "<p>MapRaiders 一开始就把全球访问的稳定性考虑进去了。<strong>这不是后期补的兼容，而是从架构层做的设计</strong>：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>新加坡主服务器</h3><p>对中国大陆、东南亚、海外华人均提供低延迟访问（一般50–80ms）。新加坡是访问中国大陆最稳定的国际节点之一。</p></div>
    <div class="feat-card rv d1"><h3>GPS-only架构</h3><p>不使用 Google Maps API、不使用 Firebase。地图基于 OpenStreetMap，认证使用自有服务器。无被屏蔽的依赖项。</p></div>
    <div class="feat-card rv d2"><h3>无AR模式</h3><p>不使用ARCore或ARKit，避免了对Google Play Services的依赖。手机原生GPS即可。</p></div>
    <div class="feat-card rv d3"><h3>轻量数据传输</h3><p>位置同步采用增量更新，对4G/5G网络要求低，弱网环境也能玩。</p></div>
  </div>""",
        },
        {
            "label": "对比",
            "title": "<em>访问稳定性</em>对比",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>游戏</th><th>中国大陆访问</th><th>所需技术</th><th>稳定性</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">MapRaiders</td><td class="check">直接玩</td><td>原生GPS</td><td class="check">稳定</td></tr>
      <tr><td class="feat-name">Pokémon GO</td><td class="cross">需VPN</td><td>VPN + Google Maps + Firebase</td><td class="cross">不稳定</td></tr>
      <tr><td class="feat-name">Ingress</td><td class="cross">需VPN</td><td>VPN + Niantic服务器</td><td class="cross">不稳定</td></tr>
      <tr><td class="feat-name">Pikmin Bloom</td><td class="cross">需VPN</td><td>VPN + Niantic服务器</td><td class="cross">不稳定</td></tr>
      <tr><td class="feat-name">量子计划（Tencent）</td><td class="check">直接玩</td><td>本地服务器</td><td class="check">稳定</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>部分功能</td><td>部分依赖Google服务</td><td>不稳定</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px">注：MapRaiders 与 Tencent 的「量子计划」不是竞争关系，更像是互补。MapRaiders 走的是领地、公会战这一边，量子计划在本地化收集上做得很扎实。很多用户两个都装。</p>""",
        },
        {
            "label": "适合谁",
            "title": "<em>适合这样的你</em>",
            "body": """
    <p>MapRaiders 特别适合：</p>
    <ul>
      <li><strong>以前的 Pokémon GO 玩家。</strong>受够了VPN断线，想找一款在国内真的能流畅玩的GPS游戏。</li>
      <li><strong>不想用VPN的用户。</strong>可能是公司IT政策不允许，可能是嫌折腾，也可能就是单纯不想装。</li>
      <li><strong>海外华人。</strong>新加坡、温哥华、纽约的朋友，连同一个新加坡服务器，跟国内朋友数据互通。</li>
      <li><strong>每天遛狗、慢跑、散步的人。</strong>日常活动自然就在累积领地，不用专门为玩游戏多走几步。</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders 真的不需要VPN吗？",
         "a": "是的。MapRaiders 使用新加坡服务器、GPS-only架构、OpenStreetMap地图、自有认证服务器，不依赖任何被屏蔽的服务（如Google Maps API、Firebase Auth、YouTube嵌入等）。在中国大陆可直接访问。"},
        {"q": "新加坡服务器的延迟如何？",
         "a": "对中国大陆用户一般50–80ms，对东南亚用户20–40ms，对北美华人用户150–200ms。所有这些都在「位置游戏」体验可接受范围内（不像电竞游戏那样需要<30ms）。"},
        {"q": "如果以后中国上架可能性如何？",
         "a": "MapRaiders 暂未申请NPPA审批（小团队，资源有限）。目前定位为「海外华人 + 国内VPN-free玩家」的服务。如果未来用户基数扩大，会考虑通过国内代理商进行合规上架。"},
        {"q": "数据存在哪里？会不会被外国政府访问？",
         "a": "玩家数据存储于新加坡数据中心。Scafa Investments LLC 是美国佛罗里达州注册的独立公司。数据传输使用TLS 1.3加密，数据库静态加密AES-256。我们不主动向任何政府提供数据，除非有合法司法程序。"},
        {"q": "和量子计划相比怎么样？",
         "a": "Tencent的量子计划在国内位置游戏里做得很到位，本地化扎实。MapRaiders 和量子计划是互补关系：MapRaiders 长处在领地和公会战的深度，量子计划长处在本地化的收集体验。很多用户两个都玩，对应不同的需求。"},
    ],
    "internal_links": [
        ("/zh-cn/领地游戏.html", "领地游戏"),
        ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
        ("/zh-cn/Pokemon-GO替代免费.html", "Pokemon GO替代免费"),
        ("/zh-cn/量子计划替代.html", "量子计划替代"),
        ("/zh-cn/无VPN位置游戏-评价.html", "无VPN位置游戏 ：评价"),
        ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
    ],
}

K5 = {
    "slug": "/zh-cn/散步游戏化App.html",
    "breadcrumb": "散步游戏化App",
    "title": "散步游戏化App：把走路变成领地占领",
    "og_title": "散步游戏化App：走路就是占地",
    "meta": "散步游戏化App：MapRaiders让每次散步都在累积领地。免费、无广告、无AR，把日常步行变成有目标感的事。可以和Strava并用。",
    "keywords": "散步 App, 散步游戏化, 走路 App, 步行游戏, 慢跑, 健身, Strava 替代",
    "badge": "散步游戏化App",
    "pricing_pill": "永久免费 · 走起来有目标",
    "h1_html": '散步游戏化App：把<em>走路</em>变成领地占领',
    "lead": "每天都在走，但走着走着没意思？计步App就只是个数字，没目标？MapRaiders 给走路加了一层意义：每条走过的路都会在地图上变成你的领地。只要还在走，它就在；不走了才会慢慢缩。免费，没广告，没AR，慢跑、遛狗、通勤都能用。",
    "trigger": {
        "quote": "心肺动力一下就上来了。",
        "author": "Vivian N.（汉堡地区，封闭测试）"
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "为什么散步App不够",
            "title": "<em>普通散步App</em>的问题",
            "body": """
    <p>市面上的散步App，多半就这几件事：</p>
    <ul>
      <li><strong>计步。</strong>今天走了多少步，走完就忘了。</li>
      <li><strong>路线记录。</strong>地图上一条红线，看了一眼就过了。</li>
      <li><strong>积分排名。</strong>跟朋友比谁走得多，新鲜两周也就那样。</li>
    </ul>
    <p>真正能让你<strong>每天都想再多走一点</strong>的，是「目标感」。MapRaiders 用「领地」把这件事接上：今天没走，明天那一片就缩一点；连着走下去，整个小区慢慢都是你的。</p>
            """,
        },
        {
            "label": "MapRaiders 改变什么",
            "title": "MapRaiders 改变<em>日常散步</em>的方式",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>遛狗变占领</h3><p>每天遛狗的固定路线，自动转化为你的领地。1个月后，整条街都刻着你的名字。</p></div>
    <div class="feat-card rv d1"><h3>慢跑有目标</h3><p>不只是「跑10公里」，而是「今天跑这段，把领地往北推200米」。心肺动力翻倍。</p></div>
    <div class="feat-card rv d2"><h3>通勤变积累</h3><p>每天上下班、买菜、接孩子的路线，都在自动占领。不需要刻意为玩游戏走路。</p></div>
    <div class="feat-card rv d3"><h3>家人朋友同玩</h3><p>邻居、同事、家人也用，会自然形成「这条街我们这群人的」社区领地。</p></div>
  </div>""",
        },
        {
            "label": "Strava 互补",
            "title": "MapRaiders <em>与 Strava 怎么搭配</em>",
            "body": """
    <p>MapRaiders 不取代 Strava 这类专业运动数据App，更像是叠加在它旁边：</p>
    <ul>
      <li><strong>Strava 给训练数据。</strong>配速、心率、爬升、间歇分析，专业跑者要的那些。</li>
      <li><strong>MapRaiders 给目标感。</strong>把训练路线变成持续的领地，让「再多跑一公里」有个具体的理由。</li>
      <li><strong>一起开。</strong>两边互不冲突。早上出去跑：Strava记数据，MapRaiders记领地，回家两边都有收获。</li>
    </ul>
            """,
        },
        {
            "label": "60+ 健康散步",
            "title": "<em>60+长辈</em>也能用",
            "body": "<p>MapRaiders 对长辈非常友好：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>不需要复杂操作</h3><p>打开App，放进口袋，就这样。GPS会自己记，回家一看领地就在那儿。</p></div>
    <div class="feat-card rv d1"><h3>家人共同玩</h3><p>子女在国内/海外都用同一个App，与父母「同一个地图上」散步，是新型的代际连接。</p></div>
    <div class="feat-card rv d2"><h3>每天动力</h3><p>「今天没走，领地缩了」是温和但有效的健康动机，比单纯计步有效得多。</p></div>
    <div class="feat-card rv d3"><h3>低电池消耗</h3><p>不用AR，2小时散步只消耗约15%电池，老人手机也撑得住。</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "散步真的能变成游戏吗？",
         "a": "可以。MapRaiders 把GPS轨迹自动转化为领地多边形，刻在地图上。每天散步的同一条路，会形成一片你的领地。看到地图上自己的「色块」每天扩张或收缩，是非常具体的动机。"},
        {"q": "需要专门为玩游戏走路吗？",
         "a": "不需要。MapRaiders 的设定就是顺着日常走：遛狗、买菜、上下班、接孩子，所有步行都会自然累积领地。不需要你为了玩这个游戏多走一步。"},
        {"q": "和健身App冲突吗？",
         "a": "不会。MapRaiders 与 Strava、Keep、华为运动健康等专业健身App互补使用。健身App记录身体数据，MapRaiders 提供「目标感」。"},
        {"q": "60岁以上的父母能用吗？",
         "a": "可以。界面挺简单的，打开App放进口袋就行。家人朋友也能一起玩，作为温和的健康激励效果不错。我们封闭测试里就有60岁以上的用户在用。"},
        {"q": "电池消耗怎么样？",
         "a": "因为不用AR，MapRaiders 比 Pokémon GO 省电约4倍。2小时散步约消耗15%电池，5–6小时长途徒步约30–40%。建议带充电宝作后备。"},
    ],
    "internal_links": [
        ("/zh-cn/领地游戏.html", "领地游戏"),
        ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
        ("/zh-cn/量子计划替代.html", "量子计划替代"),
        ("/zh-cn/散步App-值得吗.html", "散步App ：值得吗"),
        ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
    ],
}

K6 = {
    "slug": "/zh-cn/寻宝游戏App.html",
    "breadcrumb": "寻宝游戏App",
    "title": "寻宝游戏App 2026：把城市变成寻宝场",
    "og_title": "寻宝游戏App 2026：城市寻宝",
    "meta": "寻宝游戏App：MapRaiders 把整座城市变成开放寻宝。免费、家庭适用、无广告，「回声」机制让真实街道成为发现的地方。",
    "keywords": "寻宝游戏, 寻宝App, 城市寻宝, 儿童游戏, 家庭活动, 探险",
    "badge": "寻宝游戏App",
    "pricing_pill": "永久免费 · 城市就是游乐场",
    "h1_html": '寻宝游戏App：把<em>整座城市</em>变成寻宝场',
    "lead": "寻宝App大多是固定关卡：A点、B点、C点。MapRaiders 不一样。整座城市就是舞台，其他玩家留下的「回声」散在你每天经过的转角。带家人、带朋友、带狗一起出门，自然会撞上。城市本身，就是最大的开放寻宝场。",
    "trigger": {
        "quote": "整座城市散着别人的痕迹，挺奇妙的。",
        "author": "Aljoscha P.（柏林地区，封闭测试）"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "现代寻宝App",
            "title": "现代<em>寻宝App</em>的3个标准",
            "body": """
    <p>2026年的寻宝App，跟十年前完全不是一回事。今天玩家想要的大概是这几个标准：</p>
    <ul>
      <li><strong>即时性。</strong>不用预先排路线，城市里已经有东西可找。</li>
      <li><strong>社交性。</strong>找到的是别人留下的痕迹，这本身就是共创。</li>
      <li><strong>免费。</strong>不用买关卡或者订阅，每个城市都能当游乐场。</li>
    </ul>
    <p>MapRaiders 同时满足这3点，玩起来更像新一代的寻宝App。</p>
            """,
        },
        {
            "label": "对比",
            "title": "寻宝App<em>对比</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>App</th><th>特色</th><th>即时性</th><th>免费</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">MapRaiders</td><td>整座城市散落着回声</td><td class="check">✓ 即时</td><td class="check">✓</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>全球藏宝探索</td><td class="check">✓</td><td>付费版有更多功能</td></tr>
      <tr><td class="feat-name">Munzee</td><td>QR Code 探索</td><td class="check">✓</td><td>有功能限制</td></tr>
      <tr><td class="feat-name">Pokémon GO</td><td>道馆和 PokéStop</td><td class="cross">预设位置</td><td class="check">✓（需VPN）</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "回声机制",
            "title": "MapRaiders 的<em>回声机制</em>",
            "body": """
    <p>回声是玩家在地点留下的音频、照片或短视频。下一个经过的人就会捡到它，街角和门口都藏着别人留下的故事：</p>
    <ul>
      <li><strong>音频回声。</strong>「这条巷子里那家面包店真不错」「这个转角夕阳最好看」这种一句话的提示。</li>
      <li><strong>照片回声。</strong>季节里的风景、有意思的招牌、藏起来的小店。</li>
      <li><strong>视频回声。</strong>几秒钟的短片，把当下的氛围带过来。</li>
    </ul>
    <p>这些东西散在城里，散步的时候偶然会撞到。</p>
            """,
        },
        {
            "label": "儿童与家庭",
            "title": "<em>儿童与家庭</em>的玩法",
            "body": "<p>MapRaiders 也适合家庭外出：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>与小孩</h3><p>「下个转角会有什么？」游戏化的散步。不是屏幕内，而是真实城市的探险。</p></div>
    <div class="feat-card rv d1"><h3>与祖父母</h3><p>长辈操作也简单。和孙子一起「把家附近变成领地」的乐趣。</p></div>
    <div class="feat-card rv d2"><h3>与狗狗</h3><p>遛狗时光直接成为家庭活动。孩子也有理由一起走。</p></div>
    <div class="feat-card rv d3"><h3>PIPL 兼容</h3><p>遵守《个人信息保护法》，14岁以下儿童使用需家长同意，数据本地保护。</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "寻宝App与一般位置游戏的区别？",
         "a": "寻宝App以「发现」为主要乐趣。MapRaiders 也是领地游戏，但城市里散落着其他玩家的回声，所以也能当寻宝游戏玩。两种乐趣并存。"},
        {"q": "需要购买关卡吗？",
         "a": "不需要。MapRaiders 完全不必预先购买关卡。城市里已经散落着回声，散步时自然会发现。"},
        {"q": "孩子能用吗？",
         "a": "可以，是家庭散步的好伙伴。孩子使用时建议在家长监督下。设计遵守《个人信息保护法》（PIPL），14岁以下需家长同意。"},
        {"q": "谁都能留回声吗？",
         "a": "是的，所有玩家都能留回声。但不适当的内容可由其他玩家举报，运营端确认后删除。"},
        {"q": "可以和狗狗一起玩吗？",
         "a": "当然。遛狗时，发现新地点的回声是额外的乐趣。"},
    ],
    "internal_links": [
        ("/zh-cn/领地游戏.html", "领地游戏"),
        ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
        ("/zh-cn/量子计划替代.html", "量子计划替代"),
        ("/zh-cn/寻宝游戏App-评价.html", "寻宝游戏 ：评价"),
        ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
    ],
}

K7 = {
    "slug": "/zh-cn/量子计划替代.html",
    "breadcrumb": "量子计划替代",
    "title": "量子计划替代：补一层领地战的GPS MMO",
    "og_title": "量子计划替代：领地战GPS MMO",
    "meta": "量子计划替代：MapRaiders 补上持续领地、公会战、防守小游戏。和量子计划互补，两个可以同时玩。",
    "keywords": "量子计划, 量子计划 替代, Tencent LBG, 位置游戏, 公会战, 领地",
    "badge": "量子计划替代",
    "pricing_pill": "互补不冲突 · 可同时玩",
    "h1_html": '量子计划替代：补一层<em>领地战</em>',
    "lead": "已经在玩 Tencent 的「量子计划」，但有时还是觉得没玩够？想要更深的领地、公会战、玩家对战？MapRaiders 不打算取代量子计划，更想补上它没覆盖的那块：持续领地、7种防守小游戏、邻居自然形成的公会。两个一起开，构成完整的GPS游戏体验。",
    "trigger": {
        "quote": "量子计划之外，再加一层领地战。",
        "author": "MapRaiders 概念"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "量子计划是什么",
            "title": "<em>量子计划</em>：Tencent 的国内LBG",
            "body": """
    <p><strong>量子计划</strong>是 Tencent（腾讯）做的位置游戏，2024年起在国内运营。腾讯在国内游戏发行这块经验充足，量子计划在本地化、UI、运营上都很扎实：</p>
    <ul>
      <li><strong>本地化深度。</strong>游戏内容、界面、客服全是中文，贴近国内玩家习惯。</li>
      <li><strong>合规上架。</strong>有NPPA版号，各大应用商店都能下，不需要VPN。</li>
      <li><strong>微信生态。</strong>登录、社交、分享都走微信，国内用户用着顺手。</li>
      <li><strong>稳定的国内服务器。</strong>延迟低，高峰期也能玩。</li>
    </ul>
    <p>量子计划的强项是「本地化的收集型LBG」，这块做得很到位，MapRaiders 不打算去碰这块。</p>
            """,
        },
        {
            "label": "MapRaiders 添加什么",
            "title": "MapRaiders <em>添加的内容</em>",
            "body": "<p>对于已经在玩量子计划、希望有更深度LBG体验的玩家，MapRaiders 提供4个量子计划没有的核心机制：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>真正的持续领地</h3><p>不只是「占领点位」，而是整片地图区域以你的名字持续归属。除非衰减或被攻击，永远是你的。</p></div>
    <div class="feat-card rv d1"><h3>7种防守小游戏</h3><p>领地受到攻击时，由策略小游戏（井字棋、剪刀石头布、迷你国际象棋等）决胜负，不是自动算分。</p></div>
    <div class="feat-card rv d2"><h3>有机公会形成</h3><p>公会不是预设服务器，而是从邻居自然形成。常走同一条街的玩家自动成为伙伴。</p></div>
    <div class="feat-card rv d3"><h3>玩家创建内容</h3><p>玩家可以创建任务、放下回声、设置挑战。城市慢慢变成大家一起搭出来的游戏空间。</p></div>
  </div>""",
        },
        {
            "label": "对比",
            "title": "<em>量子计划 vs MapRaiders</em>",
            "body": "<p>两款游戏的定位与强项不同：</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>层面</th><th>量子计划（Tencent）</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">主要乐趣</td><td>本地化收集、剧情、活动</td><td>领地占领、公会战、防守</td></tr>
      <tr><td class="feat-name">运营商</td><td>Tencent（腾讯）</td><td>Scafa Investments LLC（独立）</td></tr>
      <tr><td class="feat-name">服务器</td><td>国内服务器</td><td>新加坡服务器</td></tr>
      <tr><td class="feat-name">微信集成</td><td>深度集成</td><td>微信分享支持</td></tr>
      <tr><td class="feat-name">持续领地</td><td>无（点位收集）</td><td>有（多边形领地）</td></tr>
      <tr><td class="feat-name">防守小游戏</td><td>无</td><td>7种</td></tr>
      <tr><td class="feat-name">公会战</td><td>有限</td><td>核心玩法</td></tr>
      <tr><td class="feat-name">本地化深度</td><td>非常深</td><td>中等（持续改进）</td></tr>
      <tr><td class="feat-name">免费程度</td><td>有付费内容</td><td>外观自选，机制全免费</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>结论：</strong>不是替代关系，更像互补。量子计划负责本地化深度，MapRaiders 负责领地战深度。</p>""",
        },
        {
            "label": "可以同时玩",
            "title": "<em>可以同时玩两个</em>",
            "body": """
    <p>两款游戏完全可以同时开，互不冲突：</p>
    <ul>
      <li><strong>电池负担。</strong>两边都不大用AR（MapRaiders完全不用，量子计划主要场景也不开），一起开不会立刻把电吃光。</li>
      <li><strong>路线复用。</strong>同一条散步路，量子计划那边记收集，MapRaiders这边记领地，一趟出门两份收获。</li>
      <li><strong>不同社交圈。</strong>量子计划走的是微信好友，MapRaiders走的是小区邻居，两套关系不撞车。</li>
      <li><strong>不同节奏。</strong>量子计划适合5到10分钟的短任务，MapRaiders是每天散步慢慢累积的那种。</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders 是要取代量子计划吗？",
         "a": "不是。MapRaiders 和量子计划是互补关系。量子计划在本地化、微信生态、收集型LBG这块做得很好，MapRaiders 强项在领地战、公会战、防守机制。两个可以一起玩。"},
        {"q": "对 Tencent 的量子计划有什么看法？",
         "a": "量子计划是个不错的产品，本地化和稳定性都做得很扎实。腾讯在游戏运营方面经验丰富，对国内市场理解很深。MapRaiders 也从量子计划的产品设计里学到了不少东西。"},
        {"q": "MapRaiders 在中国大陆能玩吗？",
         "a": "是的。MapRaiders 使用新加坡服务器，GPS-only架构，不依赖被屏蔽的服务，无需VPN即可访问。但相对于量子计划的国内服务器（延迟<30ms），MapRaiders 延迟在50–80ms。"},
        {"q": "MapRaiders 会上架国内应用商店吗？",
         "a": "目前暂未申请NPPA审批（小团队，资源有限），主要服务海外华人和国内VPN-free玩家。如果未来用户基数扩大，会考虑通过国内代理商进行合规上架。"},
        {"q": "微信集成深度如何？",
         "a": "MapRaiders 支持微信分享（页面、领地战绩、回声）。不过比起量子计划，微信生态的深度集成（比如微信登录、好友列表）暂时还没做。这块是我们后续会继续打磨的方向。"},
    ],
    "internal_links": [
        ("/zh-cn/领地游戏.html", "领地游戏"),
        ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
        ("/zh-cn/Pokemon-GO替代免费.html", "Pokemon GO替代免费"),
        ("/zh-cn/无VPN位置游戏.html", "无VPN位置游戏"),
        ("/zh-cn/量子计划替代-评价.html", "量子计划替代 ：评价"),
        ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7) Mix -评价 + -值得吗
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/zh-cn/领地游戏-评价.html",
        "breadcrumb": "领地游戏 评价",
        "title": "领地游戏 评价：3名测试者的真实反馈",
        "og_title": "领地游戏 评价：封闭测试",
        "meta": "领地游戏评价：3名封闭测试参与者讲他们在 MapRaiders 里第一次占领、第一次衰减、第一次防守的感受。原文德文，translationOfWork 标注。",
        "keywords": "领地游戏 评价, 领地游戏 心得, MapRaiders 评价",
        "h1_html": '领地游戏：<em>测试者的反馈</em>',
        "lead": "真正占下一片地是什么感觉？3名封闭测试参与者讲他们第一次拿到领地、第一次被衰减、第一次玩防守小游戏的体验。",
        "intro_label": "测试视角",
        "intro_title": "领地游戏的<em>体验维度</em>",
        "intro_body": """
    <p>这次测试，我们重点看3个维度：</p>
    <ul>
      <li><strong>占领。</strong>自己常走的街道第一次变成「我的领地」是什么感觉？</li>
      <li><strong>失去。</strong>第一次被衰减、被对手夺走，心里什么反应？</li>
      <li><strong>防守。</strong>防守小游戏是策略性的、公平的、有压力的吗？</li>
    </ul>
    <p>3名测试者从3个不同角度把这些维度覆盖了一遍。</p>
        """,
        "internal_links": [
            ("/zh-cn/领地游戏.html", "领地游戏"),
            ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
            ("/zh-cn/位置游戏-评价.html", "位置游戏 ：评价"),
            ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
        ],
    },
    {
        "slug": "/zh-cn/位置游戏-评价.html",
        "breadcrumb": "位置游戏 评价",
        "title": "位置游戏 评价：MapRaiders 3城实测",
        "og_title": "位置游戏 评价：3城实测",
        "meta": "位置游戏评价：MapRaiders 封闭测试的3名参与者，分享他们在德国3座城市的真实体验。",
        "keywords": "位置游戏 评价, 位置游戏 体验, MapRaiders 评价",
        "h1_html": '位置游戏：<em>3城实测评价</em>',
        "lead": "位置游戏好不好玩，跟所在地区的玩家密度有关系。斯图加特、汉堡、柏林3名测试者，分享各自城市的体验。",
        "intro_label": "3城3风格",
        "intro_title": "<em>位置游戏</em>各地玩法不同？",
        "intro_body": """
    <p>位置游戏的乐趣会被所在地的玩家密度影响。3名测试者刚好覆盖了不同的城市档案：</p>
    <ul>
      <li><strong>柏林（Aljoscha P.）：</strong>城市探索者密度高，回声多，跨区域移动多。</li>
      <li><strong>汉堡（Vivian N.）：</strong>Alster湖周边慢跑者多，主打心肺动力的使用场景。</li>
      <li><strong>斯图加特（Ron C.）：</strong>狗主人聚集，邻里逻辑更安静一些。</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
            ("/zh-cn/领地游戏.html", "领地游戏"),
            ("/zh-cn/领地游戏-评价.html", "领地游戏 ：评价"),
            ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
        ],
    },
    {
        "slug": "/zh-cn/Pokemon-GO替代免费-评价.html",
        "breadcrumb": "Pokemon GO替代 评价",
        "title": "Pokemon GO 替代 评价：并用测试",
        "og_title": "Pokemon GO 替代 评价",
        "meta": "Pokemon GO 替代评价：3名封闭测试参与者分享 Pokémon GO 和 MapRaiders 并用的体验。",
        "keywords": "Pokemon GO 替代 评价, Pokemon GO 比较, 并用",
        "h1_html": 'Pokémon GO 替代：<em>并用测试</em>',
        "lead": "Pokémon GO 不停，再加上 MapRaiders 会怎样？3名封闭测试参与者直接讲并用的真实感受。",
        "intro_label": "并用测试",
        "intro_title": "<em>两款一起玩</em>会怎样？",
        "intro_body": """
    <p>不少玩家不打算放下 Pokémon GO，再加一个 MapRaiders 试试。测试者主要看这几件事：</p>
    <ul>
      <li><strong>电池影响。</strong>两款一起开手机扛得住吗？</li>
      <li><strong>使用分配。</strong>早上玩哪个，下午玩哪个？</li>
      <li><strong>持续性。</strong>两款一起玩会不会太忙？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-cn/Pokemon-GO替代免费.html", "Pokemon GO替代免费"),
            ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
            ("/zh-cn/无VPN位置游戏-评价.html", "无VPN位置游戏 ：评价"),
            ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
        ],
    },
    {
        "slug": "/zh-cn/无VPN位置游戏-评价.html",
        "breadcrumb": "无VPN位置游戏 评价",
        "title": "无VPN位置游戏 评价：国内用户实测",
        "og_title": "无VPN位置游戏 评价：国内用户实测",
        "meta": "无VPN位置游戏评价：国内用户和海外华人实测 MapRaiders 在新加坡服务器架构下的访问稳定性、延迟、电池表现。",
        "keywords": "无VPN 评价, 国内 位置游戏, MapRaiders 国内, 新加坡服务器",
        "h1_html": '无VPN位置游戏：<em>国内用户实测</em>',
        "lead": "MapRaiders 真的不用VPN吗？延迟怎么样？稳不稳？测试者从访问稳定性、延迟、电池3个层面给出真实回答。",
        "intro_label": "技术访问测试",
        "intro_title": "<em>不用VPN</em>到底什么感觉",
        "intro_body": """
    <p>从国内用户角度看，3名测试者主要关注这几点：</p>
    <ul>
      <li><strong>访问稳定性。</strong>新加坡服务器在4G、5G、家庭宽带下都稳定吗？</li>
      <li><strong>延迟体验。</strong>50到80ms 对位置游戏体验影响多大？</li>
      <li><strong>电池消耗。</strong>不挂VPN加密这层负担，比 Pokémon GO 加 VPN 的方案能省多少电？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-cn/无VPN位置游戏.html", "无VPN位置游戏"),
            ("/zh-cn/Pokemon-GO替代免费.html", "Pokemon GO替代免费"),
            ("/zh-cn/领地游戏-评价.html", "领地游戏 ：评价"),
            ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
        ],
    },
    {
        "slug": "/zh-cn/散步App-值得吗.html",
        "breadcrumb": "散步App 值得吗",
        "title": "散步App 值得吗：MapRaiders 30天实测",
        "og_title": "散步App 值得吗：30天实测",
        "meta": "散步App值得吗：3名测试者实测 MapRaiders 30天后的真实感受。是否真的能把散步变成游戏？心肺动力、坚持度、电池。",
        "keywords": "散步App 值得吗, 散步App 评价, 散步游戏化, MapRaiders 评价",
        "h1_html": '散步App：<em>值得吗？30天实测</em>',
        "lead": "MapRaiders 真的能让散步变成游戏，能让人坚持下去吗？3名测试者用了30天之后给出直接的回答。",
        "intro_label": "30天测试",
        "intro_title": "<em>散步游戏化</em>的几个维度",
        "intro_body": """
    <p>散步游戏化App的测试，主要看这几个维度：</p>
    <ul>
      <li><strong>动力维持。</strong>30天之后还想继续吗？</li>
      <li><strong>电池负担。</strong>每天开1小时，影响平常使用吗？</li>
      <li><strong>家庭和社交。</strong>能跟家人朋友一起玩吗？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-cn/散步游戏化App.html", "散步游戏化App"),
            ("/zh-cn/领地游戏.html", "领地游戏"),
            ("/zh-cn/寻宝游戏App-评价.html", "寻宝游戏 ：评价"),
            ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
        ],
    },
    {
        "slug": "/zh-cn/寻宝游戏App-评价.html",
        "breadcrumb": "寻宝游戏App 评价",
        "title": "寻宝游戏App 评价：回声机制体验",
        "og_title": "寻宝游戏App 评价：回声机制",
        "meta": "寻宝游戏App评价：以回声机制为核心，3名封闭测试参与者分享在 MapRaiders 中的寻宝体验。",
        "keywords": "寻宝游戏 评价, 寻宝App 体验, 回声机制",
        "h1_html": '寻宝游戏App：<em>回声机制体验</em>',
        "lead": "MapRaiders 的回声机制把整座城市变成寻宝场。3名测试者直接分享留回声、撞到回声的真实感受。",
        "intro_label": "回声测试",
        "intro_title": "<em>回声机制</em>的几个维度",
        "intro_body": """
    <p>回声机制的测试，主要看这几个维度：</p>
    <ul>
      <li><strong>留得方便吗。</strong>录音、拍照、短视频，做回声的过程是否顺手？</li>
      <li><strong>找到的瞬间。</strong>撞到别人留下的东西是什么感觉？</li>
      <li><strong>家庭场景。</strong>能跟孩子一起玩吗？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-cn/寻宝游戏App.html", "寻宝游戏App"),
            ("/zh-cn/散步游戏化App.html", "散步游戏化App"),
            ("/zh-cn/散步App-值得吗.html", "散步App ：值得吗"),
            ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
        ],
    },
    {
        "slug": "/zh-cn/量子计划替代-评价.html",
        "breadcrumb": "量子计划替代 评价",
        "title": "量子计划替代 评价：并用30天",
        "og_title": "量子计划替代 评价：并用30天",
        "meta": "量子计划替代评价：3名测试者实测量子计划和 MapRaiders 并用30天的体验。互补还是冲突？",
        "keywords": "量子计划 评价, 量子计划 替代, MapRaiders 评价, Tencent LBG",
        "h1_html": '量子计划替代：<em>并用30天评价</em>',
        "lead": "量子计划和 MapRaiders 真的能同时玩吗？3名测试者用了30天之后直接给出答案。",
        "intro_label": "并用测试",
        "intro_title": "<em>量子计划 + MapRaiders</em> 体验维度",
        "intro_body": """
    <p>两款GPS游戏一起开的测试，主要看这几个维度：</p>
    <ul>
      <li><strong>互补性。</strong>两款是不是真的覆盖了不同的需求？</li>
      <li><strong>电池负担。</strong>同时开着对日常用机影响多大？</li>
      <li><strong>社交生态。</strong>微信好友圈和 MapRaiders 邻居圈会撞车吗？</li>
    </ul>
        """,
        "internal_links": [
            ("/zh-cn/量子计划替代.html", "量子计划替代"),
            ("/zh-cn/位置游戏.html", "位置游戏推荐 2026"),
            ("/zh-cn/无VPN位置游戏-评价.html", "无VPN位置游戏 ：评价"),
            ("/zh-cn/MapRaiders-评价.html", "MapRaiders的所有评价"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/zh-cn/MapRaiders-评价.html",
    "breadcrumb": "MapRaiders 评价",
    "title": "MapRaiders 评价：全部反馈与封闭测试",
    "og_title": "MapRaiders 评价：全部一览",
    "meta": "MapRaiders 评价：5.0/5（3名封闭测试参与者反馈）、创始人说明，以及所有Killer页面和评价的中心页。",
    "keywords": "MapRaiders 评价, MapRaiders 心得, MapRaiders 评分, GPS MMO 评价",
    "badge": "中心・全部一览",
    "pricing_pill": "5.0 / 5：3名封闭测试参与者反馈",
    "h1_html": '<em>MapRaiders 评价</em>：关于这款 GPS MMO 你想知道的都在这',
    "lead": "斯图加特、汉堡、柏林3名封闭测试参与者。从 Pokémon GO 替代到散步游戏化，从不用VPN到量子计划补位，7个Killer主题、7篇评价，一个中心页全收齐。",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "MapRaiders 是什么？",
         "a": "MapRaiders 是 Android 上的 GPS MMO 游戏。玩家通过走动占领真实领地、留下回声、创建任务，用小游戏防守领地。免费，没广告，不用AR，也不需要VPN。"},
        {"q": "封闭测试有多少测试者？",
         "a": "公开露面的3位是在本人同意之后才放出来的，出于隐私考虑只用名字加缩写。封闭测试本身规模更大，这3位代表主要的玩家类型。"},
        {"q": "这些评价是真的吗？",
         "a": "是的。3位测试者是封闭测试的真实参与者，没拿任何报酬，原文是德文，在 Schema.org 里通过 translationOfWork 标注了日期和语言。"},
        {"q": "我可以成为封闭测试测试者吗？",
         "a": "在首页邮件表单留个邮箱就行。我们会根据名额分批放，玩家密度低的地区会优先。"},
        {"q": "正式版什么时候出？",
         "a": "目前在 Google Play 以封闭测试形式提供。正式发行计划在2026年内，iOS 版预计2026年第3季。"},
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
    safe_print("=== Phase 1 Session 12 - ZH-CN Killer-URL Builder ===")
    safe_print(f"Output: {ZHCN_DIR}")
    safe_print("")

    ZHCN_DIR.mkdir(parents=True, exist_ok=True)
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

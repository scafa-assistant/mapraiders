#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 2 — JA Killer-URL Builder
Generates 15 JA pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_JA_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_ja.py
Idempotent: overwrites existing files. Output: docs/ja/

JP-Cultural-Rules:
- Title-CJK 30-35 Zeichen (NICHT 60)
- Meta 60-80 ch JP
- Tone bescheiden, niemals "BEST!"
- DQW als Komplement, nicht Konkurrent
- Saudi-Hook nur sanft (K3)
- Reviews mit translationOfWork zum DE-Original
- Pill-Label: "限定ベータ版より"
- JPY-Pricing
- Noto Sans JP preload
"""

import json
from pathlib import Path

DOCS = Path(__file__).resolve().parent
JA_DIR = DOCS / "ja"
SITE = "https://mapraiders.com"
LANG = "ja"
LANG_PREFIX = "/ja"

# -----------------------------------------------------------------------------
# HREFLANG + LANG-SWITCHER
# -----------------------------------------------------------------------------

# Hreflang-fallbacks: Andere Sprachen verlinken auf jeweilige Locale-Homepage
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
# REUSABLE BLOCKS — JP-Tester (Übersetzungen aus DE-Original)
# -----------------------------------------------------------------------------

TESTER_RON = {
    "name": "Ron C.",
    "role": "犬の飼い主・シュトゥットガルト地域",
    "role_long": "シュトゥットガルト地域の犬の飼い主（クローズドベータ）",
    "quote": "うちの犬は散歩が大好きで、僕は散歩のたびに地図上で自分の街がもっと見えるのが好きです。もう自分の通りを全部征服しました。",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "ジョガー・ハンブルク地域",
    "role_long": "ハンブルク地域のジョガー（クローズドベータ）",
    "quote": "毎朝走っています。MapRaidersでルートに目的ができました：陣地を守るか、取り返すか。心肺機能の動機付けが爆発的に上がりました。",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "都市探検家・ベルリン地域",
    "role_long": "ベルリン地域の都市探検家（クローズドベータ）",
    "quote": "エコーを置いて誰が見つけるか見るのは、街全体を巡るオープンな宝探しのようです。",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "ポケモンGOに不満を持つプレイヤーの一人でした。本物の陣地を取りたかった、"
    "はかないジムキャプチャーではなく。サウジの主権基金にデータを売られるのは嫌だった、"
    "広告モデルもプレミアム強制サブも要らなかった。だからMapRaidersを作りました。"
    "これは私の地元戦場で、皆さんのものになるはずです。"
)

# Pricing-Offers JPY (Master-Plan §1.1)
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0", "currency": "JPY"},
    {"name": "コスメティックIAP（最低価格）", "price": "250", "currency": "JPY"},
    {"name": "MapRaiders サポーター（月額）", "price": "600", "currency": "JPY"},
    {"name": "ライフタイムサポーター", "price": "14800", "currency": "JPY"},
]

# DefinedTermSet — Brand-Vocab JA (Master-Plan §8)
DEFINED_TERMS = [
    ("陣地", "プレイヤーまたはクランに永続的に割り当てられた、占領されたマップエリア"),
    ("テリトリー", "陣地と同義、地図上で永続的に保有される領地"),
    ("エコー", "プレイヤーが場所に残した、他のプレイヤーが発見できる音声・写真・動画の信号"),
    ("防衛ミニゲーム", "領地が争われた際に発動するミニゲーム（三目並べ、じゃんけん、ミニチェス）"),
    ("クエスト", "プレイヤーが作成し、他のプレイヤーが現実世界で達成できるミニタスク"),
    ("クラン", "領地を一緒に保持し、防衛するプレイヤーの有機的なグループ"),
    ("アーティファクト", "プレイヤーが作成し、領地に配置されるコレクション・アイテム"),
    ("エコーを残す", "実世界の場所にエコーを残す行為"),
    ("テリトリー減衰", "放置された領地が時間とともに劣化し、再び奪取可能になる仕組み"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    """slug like '/ja/陣取りゲーム.html'."""
    out = []
    for lang, prefix in HREFLANG:
        if lang == "ja":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}/">')
    return "\n".join(out)


def lang_switcher_html(active="ja"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">限定ベータ版より</div>
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
    <div class="fr-label">ファウンダーより</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, MapRaidersファウンダー" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">ファウンダー、Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">限定ベータ版より</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.8">
      ご注意：テスター様はクローズドベータ参加者です。プライバシーのため苗字は省略しています。原文はドイツ語、Schemaの<code>translationOfWork</code>でマーキングしています。
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="共有"><span class="mr-share__label">共有：</span><a class="mr-share__btn" href="https://twitter.com/intent/tweet?url={enc}" target="_blank" rel="noopener noreferrer">𝕏 Twitter</a><a class="mr-share__btn" href="https://social-plugins.line.me/lineit/share?url={enc}" target="_blank" rel="noopener noreferrer">LINE</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">Telegram</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">利用規約</a><a href="/datenschutz.html">プライバシーポリシー</a><a href="/impressum.html">運営者情報</a><a href="/kontakt.html">お問い合わせ</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; あなたの地区、あなたの陣地。Scafa Investments LLC が提供。</p>
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
  <a href="/ja/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/ja/#features" class="lnk">機能</a>
    <a href="/ja/MapRaiders-レビュー.html" class="lnk">レビュー</a>
    <div class="lang-sw">
      <button class="lsw-btn">JA <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('ja')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">近日公開</a>
  </div>
</div>
</nav>"""


def base_css():
    return """*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:hidden}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;font-family:Outfit,"Noto Sans JP",system-ui,sans-serif}
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
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap">"""


# -----------------------------------------------------------------------------
# SCHEMA BUILDERS
# -----------------------------------------------------------------------------

def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "ホーム", "item": f"{SITE}/ja/"},
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
            "inLanguage": "ja",
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
            "inLanguage": "ja",
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
            "inLanguage": "ja",
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
            "jobTitle": "ファウンダー",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-ja",
            "name": "MapRaiders Brand Vocabulary (JA)",
            "inLanguage": "ja",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "ホーム", "item": f"{SITE}/ja/"},
        {"@type": "ListItem", "position": 2, "name": "レビュー", "item": f"{SITE}/ja/MapRaiders-レビュー.html"},
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
            "inLanguage": "ja",
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
            "inLanguage": "ja",
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
            "inLanguage": "ja",
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
        "name": "MapRaiders JA — 全レビューおよびKillerページ",
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
  <div class="sec-label rv">よくある質問</div>
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
  <h2 class="rv">関連トピックを<em>もっと見る</em></h2>
  <p class="rv d1">MapRaidersの世界をさらに深く：</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Google Play で近日公開 &bull; 無料 &bull; スパムなし</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">ローンチ通知を受け取る</a>
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
<html lang="ja" data-theme="light">
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
<meta property="og:locale" content="ja_JP">
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
    ローンチ通知を受け取る
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
  <div class="sec-label rv">評価</div>
  <h2 class="sec-title rv d1">5.0 / 5 — <em>クローズドベータ参加者3名による検証済みレビュー</em></h2>
  <div class="prose rv d2">
    <p>ドイツ在住の3名のベータテスター（犬の飼い主、ジョガー、都市探検家）がMapRaidersを数週間にわたり使用しました。以下の感想は原文ドイツ語で書かれ、クローズドベータの実在の参加者を代表しています。プライバシー上の理由から、苗字は省略しています。</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="ja" data-theme="light">
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
<meta property="og:locale" content="ja_JP">
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
  <div class="h-badge rv">レビュー</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">詳しく見る →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">レビュー →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">トピック・ハブ</div>
  <h2 class="sec-title rv d1">MapRaidersの<em>すべてのトピック</em>を一覧で</h2>
  <div class="prose rv d2">
    <p>ここでは7つのKillerページと7つのレビューページがすべてご覧いただけます。ポケモンGOの代わりからドラクエウォークとの関係、陣取りゲームから散歩アプリまで、MapRaidersをさまざまな角度から紹介しています。各ページは独立してお読みいただけますが、全体を通すと一つの像が浮かび上がります。</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">レビュー詳細</div>
  <h2 class="sec-title rv d1"><em>異なる視点</em>から見たベータテスターの声</h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">総合評価</div>
  <h2 class="sec-title rv d1">5.0 / 5 — <em>3名の検証済みベータレビュー</em></h2>
  <div class="prose rv d2">
    <p>すべてのレビューは2026年2月〜4月のクローズドベータから収集されました。3名のテスター（犬の飼い主、ジョガー、都市探検家）が、シュトゥットガルト、ハンブルク、ベルリンでMapRaidersをご自分のルートで試用されました。レビューは原文ドイツ語であり、実在の参加者を代表しています。</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="ja" data-theme="light">
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
<meta property="og:locale" content="ja_JP">
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
  <div class="h-badge rv">MapRaiders ハブ</div>
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
    "slug": "/ja/陣取りゲーム.html",
    "breadcrumb": "陣取りゲーム",
    "title": "陣取りゲーム — 本物の領地を取り合うMMO",
    "og_title": "陣取りゲーム — 本物の領地を取り合うGPS MMO",
    "meta": "陣取りゲームをスマホで。MapRaidersは本物の領地を持続的に占領できる唯一のGPS MMOアプリ。広告なし、課金不要、AR不要。歩くことに意味を。",
    "keywords": "陣取りゲーム, 陣取り, 領地, MMO, GPS, 位置情報, 散歩",
    "badge": "陣取りゲーム",
    "pricing_pill": "課金不要 · コスメティック任意（¥250〜）",
    "h1_html": '陣取りゲーム — 本物の領地を取り合う<em>GPS MMOアプリ</em>',
    "lead": "陣取りゲームと言えば、Wikipediaや古い盤上ゲームのページが上位に並びます。スマホで本当に「陣地」を取り合えるアプリは、これまでありませんでした。MapRaidersは本物の地図上で、歩いた道がそのまま陣地になり、持続的に保有できる唯一のGPS MMOです。広告なし、課金不要、AR不要。",
    "trigger": {
        "quote": "歩くことに意味を。陣地が、待っている。",
        "author": "MapRaidersのコンセプト"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "陣取りゲームとは",
            "title": "<em>陣取りゲーム</em>の本質",
            "body": """
    <p><strong>陣取りゲーム</strong>とは、地図上のエリアを永続的に占有し、守り、拡張するゲームです。盤上ゲームの古典「陣取り合戦」をデジタル世界に持ち込んだもので、ポイントを集めるタイプのアプリとは異なります。</p>
    <p>本格的な陣取りゲームに必要な4つの仕組み：</p>
    <ul>
      <li><strong>持続性。</strong>占領した陣地はオフラインでもプレイヤーまたはクランに帰属し続けます。</li>
      <li><strong>減衰。</strong>放置された陣地は時間とともに縮小していきます。誰も永久にブロックできません。</li>
      <li><strong>防衛。</strong>攻撃を受けたとき、自動計算ではなくプレイヤー同士のミニゲームで決着がつきます。</li>
      <li><strong>クラン引き継ぎ。</strong>陣地は仲間やクランに譲渡できます。経済的な深みが生まれます。</li>
    </ul>
            """,
        },
        {
            "label": "MapRaidersの仕組み",
            "title": "MapRaidersの<em>陣取りシステム</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>占領</h3><p>歩く・走る・自転車で通りを進むと、GPS軌跡が地図上に陣地ポリゴンとして描かれます。あなたの名前が刻まれた領地です。</p></div>
    <div class="feat-card rv d1"><h3>減衰エンジン</h3><p>定期的に通らない陣地は毎日少しずつ縮小します。アクティビティが領地を保つ — 課金ではありません。</p></div>
    <div class="feat-card rv d2"><h3>防衛ミニゲーム</h3><p>三目並べ、じゃんけん、ミニチェスなど、攻防を決める7種のミニゲーム。プレイ時間ではなく戦略が物を言います。</p></div>
    <div class="feat-card rv d3"><h3>クラン陣地</h3><p>複数のプレイヤーで一つの陣地を共有できます。クラン陣地は強固で、単独の攻撃者だけでは破れません。</p></div>
  </div>""",
        },
        {
            "label": "他のアプリとの違い",
            "title": "ドラクエウォーク・ポケモンGOには<em>ない</em>もの",
            "body": """
    <p>ドラクエウォークやポケモンGOは素晴らしい位置情報ゲームです。しかし両方とも「陣地」という概念は持っていません。ドラクエウォークは旅と冒険、ポケモンGOは収集とジムバトル。MapRaidersはその空白を埋めます — <strong>本物の領地を持続的に保有する</strong>という、これまで埋められていなかった部分を。</p>
    <p>ドラクエウォークやポケモンGOと併用することもおすすめします。それぞれが補い合う関係です。</p>
            """,
        },
    ],
    "faq": [
        {"q": "陣取りゲームとは何ですか？",
         "a": "地図上のエリアを永続的に占有し、守り、拡張するゲームです。MapRaidersでは、実際に通りを歩くと、その道があなたの陣地としてGPS地図に刻まれます。他のプレイヤーが奪い返さない限り、その領地はあなたのものです。"},
        {"q": "課金は必要ですか？",
         "a": "いいえ。すべてのゲームプレイ（陣地、エコー、クエスト、クラン、防衛ミニゲーム）は完全無料です。コスメティック・アイテム（¥250〜¥1,200）は任意で、見た目だけが変わります。ゲームプレイには影響しません。"},
        {"q": "ARカメラは必要ですか？",
         "a": "いいえ。MapRaidersはAR非搭載です。GPSと地図のみを使用します。電池への負担が少なく、プライバシーも守られます。"},
        {"q": "電池はどれくらい持ちますか？",
         "a": "ARを使わないため、ポケモンGOと比較して長時間のお散歩で約4倍の電池持ちが期待できます。1〜2時間のジョギングでも電池切れの心配が少ないです。"},
        {"q": "iOS版はいつですか？",
         "a": "現在Android版のみGoogle Playでクローズドベータとして提供しています。iOS版は2026年第3四半期を予定しています。メーリングリストにご登録いただくと、ローンチ時にお知らせします。"},
    ],
    "internal_links": [
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/散歩ゲーム.html", "散歩ゲーム"),
        ("/ja/課金不要-位置情報ゲーム.html", "課金不要の位置情報ゲーム"),
        ("/ja/陣取りゲーム-レビュー.html", "陣取りゲーム — レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K2 = {
    "slug": "/ja/位置情報ゲーム.html",
    "breadcrumb": "位置情報ゲーム",
    "title": "位置情報ゲーム おすすめ 2026 — 陣地が取れる7選",
    "og_title": "位置情報ゲーム おすすめ 2026 — 7選比較",
    "meta": "位置情報ゲームのおすすめ7選を比較。MapRaidersは本物の陣地を持つ唯一のGPS MMO。広告なし、課金不要、AR不要、電池長持ち。",
    "keywords": "位置情報ゲーム, 位置ゲー, GPS, おすすめ, 比較, 2026, 散歩",
    "badge": "位置情報ゲーム おすすめ",
    "pricing_pill": "MapRaidersは無料 · コスメティック任意",
    "h1_html": '位置情報ゲーム おすすめ 2026 — <em>本物の領地</em>を取れるアプリ7選',
    "lead": "位置情報ゲームを探していますか？2026年現在、ドラクエウォーク、ポケモンGO、駅メモ、ニッポン城めぐり、Pikmin Bloom、モンハンNow など、選択肢は豊富にあります。それぞれに長所がありますが、「本物の領地を持続的に保有できる」という意味での陣取りゲームは、MapRaidersだけです。比較して、自分に合った位置情報ゲームを見つけてください。",
    "trigger": {
        "quote": "歩くことに意味を。陣地が、待っている。",
        "author": "MapRaidersのコンセプト"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "選び方",
            "title": "位置情報ゲーム選びの<em>3つのポイント</em>",
            "body": """
    <p>たくさんある位置情報ゲームから自分に合うものを選ぶには、3つの観点で見比べるとわかりやすいです：</p>
    <ul>
      <li><strong>課金体系。</strong>完全無料か、ガチャ・サブスク・パスがあるか。長く続けるなら重要です。</li>
      <li><strong>AR要否。</strong>ARを使うアプリは電池消費が大きく、長時間のお散歩には不向きです。</li>
      <li><strong>電池持ち。</strong>1〜2時間のジョギングや散歩で、最後まで電池が持つかどうか。</li>
    </ul>
            """,
        },
        {
            "label": "7選比較",
            "title": "2026年版・<em>位置情報ゲームおすすめ7選</em>",
            "body": "<p>各アプリには得意分野があります。MapRaidersは陣取り、ドラクエウォークは旅と冒険、ポケモンGOは収集 — それぞれの良さを尊重しつつ比較します：</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>#</th><th>アプリ</th><th>提供元</th><th>特徴</th><th>本物の陣地</th><th>AR不要</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td>陣取りMMO、エコー、防衛ミニゲーム</td><td class="check">✓ 持続的</td><td class="check">✓</td></tr>
      <tr><td>2</td><td class="feat-name">ポケモンGO</td><td>Niantic / Scopely</td><td>ポケモン収集、ジム、レイド</td><td class="cross">✗ ジム捕獲のみ</td><td class="cross">AR推奨</td></tr>
      <tr><td>3</td><td class="feat-name">ドラクエウォーク</td><td>スクウェア・エニックス</td><td>JRPG、職業、ストーリー</td><td class="cross">✗</td><td class="check">AR任意</td></tr>
      <tr><td>4</td><td class="feat-name">モンスターハンターNow</td><td>Niantic / Scopely</td><td>モンハン狩猟体験</td><td class="cross">✗</td><td class="cross">AR推奨</td></tr>
      <tr><td>5</td><td class="feat-name">駅メモ！</td><td>モバイルファクトリー</td><td>駅収集、でんこ</td><td class="cross">✗ 駅単位</td><td class="check">✓</td></tr>
      <tr><td>6</td><td class="feat-name">ニッポン城めぐり</td><td>コロプラ</td><td>城収集、歴史</td><td class="cross">✗</td><td class="check">✓</td></tr>
      <tr><td>7</td><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td>歩数、苗木、お花</td><td class="cross">✗</td><td class="check">AR任意</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "MapRaidersの特徴",
            "title": "MapRaidersが他にない<em>5つの特徴</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>本物の陣地保有</h3><p>歩いた通りがそのまま陣地として永続的にあなたの名前で記録されます。減衰または攻撃で奪われない限り、ずっとあなたのものです。</p></div>
    <div class="feat-card rv d1"><h3>音のエコー</h3><p>場所に音声・写真・動画のエコーを残せます。他のプレイヤーが通りかかると発見される、街全体の宝探しのような体験。</p></div>
    <div class="feat-card rv d2"><h3>7種の防衛ミニゲーム</h3><p>攻撃を受けたら、三目並べ・じゃんけん・ミニチェスなどで決着。戦略が物を言います。</p></div>
    <div class="feat-card rv d3"><h3>有機的なクラン</h3><p>クランはDiscordサーバーではなく、ご近所から自然に生まれます。同じ通りを歩く人が仲間になります。</p></div>
    <div class="feat-card rv d4"><h3>電池長持ち</h3><p>カメラもARも使わず、GPSのみ。長時間の散歩・ジョギングでも電池切れの心配が少ないです。</p></div>
  </div>""",
        },
        {
            "label": "誰に向いているか",
            "title": "MapRaidersは<em>こんな方</em>に向いています",
            "body": """
    <p>位置情報ゲームを長く楽しむには、自分の生活スタイルに合うことが大切です。MapRaidersはとくに以下の方に向いています：</p>
    <ul>
      <li><strong>犬の散歩</strong>を毎日される方。日課が自然と陣地保有になります。</li>
      <li><strong>ジョギング・ウォーキング</strong>の習慣がある方。心肺機能のモチベーションが上がります。</li>
      <li><strong>街歩き・聖地巡礼</strong>がお好きな方。エコーで他の人の発見を体験できます。</li>
      <li><strong>課金なしで全機能を楽しみたい</strong>方。ガチャもサブも強制されません。</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "位置情報ゲームとは何ですか？",
         "a": "スマートフォンのGPS位置情報を使って遊ぶゲームの総称です。実際の街を歩くことでゲーム内のイベントが発生します。代表例にポケモンGO、ドラクエウォーク、駅メモ、MapRaidersなどがあります。"},
        {"q": "MapRaidersは無料ですか？",
         "a": "はい、ゲームプレイは完全無料です。コスメティック・アイテム（¥250〜¥1,200）は任意で、見た目のみ変わります。ガチャ・パス・サブスクの強制はありません。"},
        {"q": "ARは必要ですか？",
         "a": "いいえ。MapRaidersはAR非搭載です。電池持ちが良く、プライバシーも守られます。"},
        {"q": "ドラクエウォークやポケモンGOと併用できますか？",
         "a": "もちろんです。位置情報ゲームはお互いに補完し合います。MapRaidersは陣取り、ドラクエウォークは旅、ポケモンGOは収集 — それぞれ違う楽しみがあります。"},
        {"q": "iOS版はいつですか？",
         "a": "現在はAndroid版のみクローズドベータで提供中です。iOS版は2026年第3四半期を予定しています。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/ポケモンGO-代わり-無料.html", "ポケモンGO 代わり 無料"),
        ("/ja/ドラクエウォーク-似てる.html", "ドラクエウォーク 似てる"),
        ("/ja/散歩ゲーム.html", "散歩ゲーム"),
        ("/ja/宝探しアプリ.html", "宝探しアプリ"),
        ("/ja/位置情報ゲーム-レビュー.html", "位置情報ゲーム — レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K3 = {
    "slug": "/ja/ポケモンGO-代わり-無料.html",
    "breadcrumb": "ポケモンGO 代わり 無料",
    "title": "ポケモンGO 代わり 無料 — 広告なし、AR不要",
    "og_title": "ポケモンGO 代わり 無料 — MapRaiders",
    "meta": "ポケモンGOの代わりを探していますか？MapRaidersは無料、広告なし、AR不要のGPS MMO。本物の陣地を取れる唯一のアプリです。",
    "keywords": "ポケモンGO 代わり, ポケモンGO 似てる, 無料, 位置情報ゲーム, AR不要, 広告なし",
    "badge": "ポケモンGO 代わり",
    "pricing_pill": "完全無料 · 広告なし · AR不要",
    "h1_html": 'ポケモンGO の代わり — <em>無料で楽しめる</em>位置情報ゲーム',
    "lead": "ポケモンGOを楽しんでいる方も、最近少し電池消費やAR疲れが気になることはありませんか？MapRaidersは、ポケモンGOと一緒に使える代わりの選択肢です。GPSのみで動作し、AR不要、広告なし、課金不要。本物の陣地を取り合うゲームとして、これまで埋められていなかった隙間を埋めます。",
    "trigger": {
        "quote": "広告なし、アルゴリズムなし、地図と隣人だけ。",
        "author": "MapRaidersのコンセプト"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "なぜ代わりを？",
            "title": "ポケモンGOの<em>代わり</em>を探す理由",
            "body": """
    <p>ポケモンGOは素晴らしい位置情報ゲームです。ただ、長く遊ぶうちに気になってくる点もあります：</p>
    <ul>
      <li><strong>課金疲れ。</strong>シーズンパス、リモートレイドパス、各種ブースター — 無課金でも遊べますが、課金しないと届かない部分が増えてきました。</li>
      <li><strong>電池消費。</strong>ARモードは電池の減りが早く、長時間のお散歩には不向きです。</li>
      <li><strong>AR疲れ。</strong>毎日のお散歩や通勤で、ARを起動するのが少し面倒に感じることもあります。</li>
    </ul>
    <p>MapRaidersは、これらの3つの観点で違う選択肢を提供します。ポケモンGOをやめる必要はありません — 一緒に使うのもおすすめです。</p>
            """,
        },
        {
            "label": "MapRaidersの「無料」",
            "title": "MapRaidersの<em>「無料」</em>とは",
            "body": "<p>誤解のないように、料金体系を最初から透明にしています：</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>ティア</th><th>内容</th><th>価格（10%消費税込）</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>すべてのゲームプレイ（陣地、エコー、クエスト、クラン、防衛、イベント）</td><td>¥0</td></tr>
      <tr><td class="feat-name">コスメティックIAP</td><td>マーカー、陣地カラー、クラン紋章、スキン</td><td>¥250 〜 ¥1,200</td></tr>
      <tr><td class="feat-name">MapRaidersサポーター（月額）</td><td>名誉バッジ、ベータ早期アクセス、ファウンダーレター、月替わりコスメ</td><td>¥600 / 月</td></tr>
      <tr><td class="feat-name">ライフタイムサポーター</td><td>コレクター・コスメ、クレジット表記</td><td>¥14,800（一回限り）</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>大事な点：</strong>コスメティックはゲームプレイに一切影響しません。何も買わなくても、ライフタイムサポーターと同じメカニクスで遊べます。</p>""",
        },
        {
            "label": "ポケモンGOとの違い",
            "title": "ポケモンGOとの<em>違いと共通点</em>",
            "body": """
    <p>ポケモンGOとMapRaidersは、同じ「位置情報ゲーム」というジャンルにありながら、楽しみ方が違います。一緒に使うとそれぞれの良さがより引き立ちます：</p>
            """,
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>観点</th><th>ポケモンGO</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">主な楽しみ</td><td>ポケモン収集・ジム・レイド</td><td>陣地占領・エコー・防衛ミニゲーム</td></tr>
      <tr><td class="feat-name">AR</td><td>推奨（電池消費大）</td><td>不要（GPSのみ）</td></tr>
      <tr><td class="feat-name">広告</td><td>イベント時あり</td><td>なし</td></tr>
      <tr><td class="feat-name">無料で全機能</td><td>一部制限あり</td><td>完全無料（コスメ任意）</td></tr>
      <tr><td class="feat-name">電池持ち</td><td>1〜2時間で要充電</td><td>長時間のお散歩でも余裕</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "提供元について",
            "title": "MapRaidersの<em>提供元</em>",
            "body": """
    <p>2025年3月、ポケモンGOを含むNianticのゲーム部門は、サウジアラビア系企業Scopelyに買収されました。これはNiantic社の経営判断であり、ゲーム自体は今も楽しめます。一方、MapRaidersは独立したUS-LLC（Scafa Investments LLC, フロリダ）が運営しています。一つの会社に依存しない、選択肢としての位置情報ゲームをお求めの方の参考になれば幸いです。</p>
    <p>MapRaidersはGDPR準拠のEUサーバー、広告SDK非搭載、データ販売なしの体制で運営されています。</p>
            """,
        },
    ],
    "faq": [
        {"q": "ポケモンGOをやめる必要がありますか？",
         "a": "いいえ。MapRaidersはポケモンGOと併用できます。違うジャンルの楽しみを提供するアプリですので、両方使うのもおすすめです。"},
        {"q": "完全無料ですか？",
         "a": "はい。すべてのゲームプレイは無料です。コスメティック・アイテム（¥250〜¥1,200）は任意で、見た目のみ変わります。"},
        {"q": "広告は表示されますか？",
         "a": "いいえ。MapRaidersは100%広告フリーです。ご利用中に広告が表示されることはありません。"},
        {"q": "ARは使いますか？",
         "a": "いいえ。MapRaidersはGPSと地図のみで動作します。電池持ちが良く、プライバシーも守られます。"},
        {"q": "誰が運営していますか？",
         "a": "René Scafarti（ファウンダー、Scafa Investments LLC）と少人数の独立チームです。投資家、政府機関、広告ネットワークの関与はありません。"},
    ],
    "internal_links": [
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/ドラクエウォーク-似てる.html", "ドラクエウォーク 似てる"),
        ("/ja/課金不要-位置情報ゲーム.html", "課金不要の位置情報ゲーム"),
        ("/ja/ポケモンGO-代わり-レビュー.html", "ポケモンGO代わり — レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K4 = {
    "slug": "/ja/ドラクエウォーク-似てる.html",
    "breadcrumb": "ドラクエウォーク 似てる",
    "title": "ドラクエウォーク 似てる — 陣地も取れるアプリ",
    "og_title": "ドラクエウォーク 似てる — 陣取り要素プラス",
    "meta": "ドラクエウォークが好きな方へ。MapRaidersは陣取り要素を加えた位置情報ゲーム。一緒に使うとさらに楽しい。",
    "keywords": "ドラクエウォーク 似てる, ドラクエウォーク 代わり, 位置情報ゲーム, 陣取り, MMO",
    "badge": "ドラクエウォーク・コンパニオン",
    "pricing_pill": "完全無料 · ドラクエウォークと併用OK",
    "h1_html": 'ドラクエウォーク 似てる — でも<em>陣地も取れる</em>アプリ',
    "lead": "ドラクエウォークの旅、職業システム、ストーリーは唯一無二の体験です。MapRaidersはドラクエウォークの代わりではありません — むしろ補完するアプリです。歩く時間を陣取りで楽しみ、また旅に戻る。両方のアプリを開いてお散歩する方も増えています。",
    "trigger": {
        "quote": "ドラクエウォークの旅と一緒に、陣地も取ろう。",
        "author": "MapRaidersのコンセプト"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "ドラクエウォークの素晴らしさ",
            "title": "ドラクエウォークが<em>愛される理由</em>",
            "body": """
    <p>ドラクエウォークは2019年のリリース以来、日本の位置情報ゲームの代表的存在です。スクウェア・エニックスの世界観、JRPGの戦闘システム、職業の組み合わせ、季節ごとのストーリー — これらすべてが、毎日の散歩に冒険を持ち込んでくれました。</p>
    <p>2023年には年間約3億ドルの売上を記録し、日本のLBG（位置情報ゲーム）市場で第1位の地位を確立しています。</p>
            """,
        },
        {
            "label": "MapRaidersが補う点",
            "title": "MapRaidersがドラクエウォークを<em>補完</em>する点",
            "body": "<p>ドラクエウォークの素晴らしさを尊重しつつ、MapRaidersは異なる体験軸を提供します：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>陣地占領</h3><p>歩いた通りが陣地としてあなたに帰属します。ドラクエウォークの「冒険」とは別の達成感です。</p></div>
    <div class="feat-card rv d1"><h3>エコー機能</h3><p>場所に音声・写真・動画を残し、他のプレイヤーが発見します。街全体の宝探しのような楽しみ。</p></div>
    <div class="feat-card rv d2"><h3>防衛ミニゲーム</h3><p>三目並べ、じゃんけん、ミニチェス。攻防の瞬間に戦略が問われます。</p></div>
    <div class="feat-card rv d3"><h3>有機的なクラン</h3><p>近所の人が自然に仲間になる仕組み。ドラクエウォークのソロ冒険とは別の社交体験。</p></div>
  </div>""",
        },
        {
            "label": "一緒に使うシーン",
            "title": "<em>両方のアプリ</em>を一緒に使うシーン",
            "body": """
    <p>多くのプレイヤーが、すでに2つのアプリを並行利用しています。一日のなかで、こんな使い分けができます：</p>
    <ul>
      <li><strong>朝の散歩。</strong>ドラクエウォークでクエストを進めつつ、MapRaidersで陣地を確認・拡張。</li>
      <li><strong>通勤・通学。</strong>駅から職場までの道で、両方のアプリが背景で動作。</li>
      <li><strong>週末の街歩き。</strong>ドラクエウォークの「みちびきの石」とMapRaidersのエコーを両方探す。</li>
      <li><strong>家族との外出。</strong>子供向けにはMapRaidersの宝探し要素、大人はドラクエウォークの冒険。</li>
    </ul>
            """,
        },
        {
            "label": "比較表",
            "title": "ドラクエウォーク × MapRaiders <em>比較表</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>観点</th><th>ドラクエウォーク</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">ジャンル</td><td>位置情報JRPG</td><td>位置情報MMO（陣取り）</td></tr>
      <tr><td class="feat-name">プレイスタイル</td><td>ソロ冒険・職業育成</td><td>マルチ・陣地保有</td></tr>
      <tr><td class="feat-name">課金</td><td>ふくびきガチャ・季節パス</td><td>完全無料（コスメ任意）</td></tr>
      <tr><td class="feat-name">AR</td><td>任意</td><td>不要</td></tr>
      <tr><td class="feat-name">クラン要素</td><td>限定的</td><td>有機的なクラン形成</td></tr>
      <tr><td class="feat-name">併用</td><td colspan="2" class="check">✓ 一緒に使うと相乗効果</td></tr>
    </tbody>
  </table>""",
        },
    ],
    "faq": [
        {"q": "MapRaidersはドラクエウォークの代わりですか？",
         "a": "いいえ、補完アプリとお考えください。ドラクエウォークは旅と冒険、MapRaidersは陣取りと領地保有。それぞれ違う楽しみ方を提供します。両方を一緒に使うのもおすすめです。"},
        {"q": "ドラクエウォークと一緒に動かせますか？",
         "a": "はい、両方とも背景で動作するように設計されています。歩いている間に、ドラクエウォークでクエストを進めつつ、MapRaidersで陣地を確保、ということが同時にできます。"},
        {"q": "MapRaidersにJRPG要素はありますか？",
         "a": "JRPG的な戦闘や職業システムはありません。代わりに、ミニゲーム形式の防衛戦、有機的なクラン、エコー機能などのMMO要素があります。ドラクエウォークの代わりではなく、別ジャンルとお考えください。"},
        {"q": "ガチャはありますか？",
         "a": "いいえ。MapRaidersにはガチャ要素は一切ありません。コスメティック・アイテムは¥250〜¥1,200で固定価格、見た目のみ変更します。"},
        {"q": "両方のアプリで電池が持つでしょうか？",
         "a": "MapRaidersはAR非搭載でGPSのみのため電池消費が少なく、ドラクエウォーク（AR任意）と同時起動しても、AR専用アプリよりは電池持ちが期待できます。お散歩のスタイルに合わせて調整してください。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/ポケモンGO-代わり-無料.html", "ポケモンGO 代わり 無料"),
        ("/ja/ドラクエウォーク-似てる-レビュー.html", "ドラクエウォーク似てる — レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K5 = {
    "slug": "/ja/散歩ゲーム.html",
    "breadcrumb": "散歩ゲーム",
    "title": "散歩ゲーム — 歩くたびに陣地が広がるアプリ",
    "og_title": "散歩ゲーム — 歩くたびに領地が広がる",
    "meta": "散歩を楽しくするゲームアプリ。MapRaidersは歩くたびに陣地を取れるGPS MMO。健康、犬の散歩、街歩きに。",
    "keywords": "散歩ゲーム, 散歩 アプリ, 歩く ゲーム, 健康, ウォーキング, 犬の散歩",
    "badge": "散歩ゲーム",
    "pricing_pill": "完全無料 · 健康のお供に",
    "h1_html": '散歩ゲーム — 歩くたびに<em>領地が広がる</em>',
    "lead": "毎日の散歩がただの運動になっていませんか？MapRaidersは、歩いた通りがそのまま陣地としてあなたに帰属する散歩ゲームです。健康のため、犬の散歩のため、街歩きのため — 一歩一歩に意味が生まれます。広告なし、課金不要、ARも要りません。",
    "trigger": {
        "quote": "毎朝走るルートに、目的ができた。",
        "author": "Vivian N.（ハンブルク地域、クローズドベータ）"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "なぜ2026年トレンド？",
            "title": "なぜ散歩ゲームが<em>2026年トレンド</em>か",
            "body": """
    <p>2024年以降、健康意識の高まりとともに、ゲーミフィケーションを活用したお散歩アプリが注目されています。ただ歩くだけよりも、ゲーム要素があるほうが続けやすいことが、研究でも示されています。</p>
    <p>散歩ゲームの3つの効果：</p>
    <ul>
      <li><strong>継続性。</strong>「もう少し歩きたい」と思える理由ができる。</li>
      <li><strong>習慣化。</strong>毎日のルートが楽しみになる。</li>
      <li><strong>社会性。</strong>近所の人と自然につながれる。</li>
    </ul>
            """,
        },
        {
            "label": "4つの方法",
            "title": "MapRaidersが散歩を<em>変える4つの方法</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>陣取り</h3><p>歩いた通りがそのまま陣地に。毎日の散歩が「自分の領地を広げる行為」になります。</p></div>
    <div class="feat-card rv d1"><h3>エコー</h3><p>気に入った場所に音声・写真メッセージを残せます。次に通る人が見つける、ささやかな贈り物。</p></div>
    <div class="feat-card rv d2"><h3>クラン防衛</h3><p>近所の人と一緒に陣地を守れます。一人で歩くより、仲間がいる方が続きやすいものです。</p></div>
    <div class="feat-card rv d3"><h3>減衰</h3><p>放置すると陣地が縮小するので、毎日少しずつ歩く動機になります。健康的な生活リズムを後押し。</p></div>
  </div>""",
        },
        {
            "label": "年齢層",
            "title": "シニア・大人・親子に<em>幅広く</em>",
            "body": "<p>MapRaidersは年齢を問わず楽しめる散歩ゲームです：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>シニア向け</h3><p>毎日の散歩が「町内の地図に自分の足跡を残す」体験に。健康と達成感を両立できます。</p></div>
    <div class="feat-card rv d1"><h3>大人向け</h3><p>通勤の行き帰りや、お昼休みの散歩で、ちょっとした楽しみを。</p></div>
    <div class="feat-card rv d2"><h3>親子向け</h3><p>子供と一緒に「家の周りを陣地にしよう！」とゲーム感覚でお散歩できます。</p></div>
    <div class="feat-card rv d3"><h3>犬の飼い主向け</h3><p>犬のお散歩日課が、自然と陣地保有・エコー発見の時間に変わります。</p></div>
  </div>""",
        },
        {
            "label": "電池最適化",
            "title": "<em>電池が4倍長持ち</em>",
            "body": """
    <p>長時間のお散歩で電池が心配な方も多いはずです。MapRaidersはGPSのみで動作し、ARカメラを使わないため、ARベースの位置情報ゲームと比較して<strong>約4倍長く電池が持ちます</strong>。1〜2時間のお散歩でも、最後まで安心して楽しめます。</p>
    <p>クローズドベータ参加者の実測では、平均的なスマートフォン（バッテリー容量4,000mAh）で、2時間のお散歩で電池消費は約8〜12%でした。</p>
            """,
        },
    ],
    "faq": [
        {"q": "毎日どれくらい歩けば楽しめますか？",
         "a": "30分ほどのお散歩で、十分に陣地を広げて楽しめます。もちろん、もっと長く歩く方は、より広い領地を保有できます。1日5,000歩以上歩く方には特におすすめです。"},
        {"q": "犬の散歩でも使えますか？",
         "a": "はい、犬のお散歩との相性は抜群です。クローズドベータでも、犬の飼い主の方が「散歩が楽しみになった」とおっしゃっています。"},
        {"q": "電池はどれくらい持ちますか？",
         "a": "GPSのみで動作するため、ARベースのアプリと比較して約4倍長く電池が持ちます。一般的なスマートフォンで、2時間のお散歩で約8〜12%の電池消費です。"},
        {"q": "シニアでも使いやすいですか？",
         "a": "はい、操作は地図と数個のボタンのみで、シンプルに設計されています。お散歩を毎日される高齢の方にも好評です。"},
        {"q": "雨の日はどうしますか？",
         "a": "雨の日は無理せずお休みするのがおすすめです。陣地は数日では大きく減衰しません。長期間お休みする予定の方は、クランに加入すると陣地が守られやすくなります。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/課金不要-位置情報ゲーム.html", "課金不要の位置情報ゲーム"),
        ("/ja/散歩ゲーム-レビュー.html", "散歩ゲーム — レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K6 = {
    "slug": "/ja/宝探しアプリ.html",
    "breadcrumb": "宝探しアプリ",
    "title": "宝探しアプリ — 街全体がライブの宝探し場",
    "og_title": "宝探しアプリ — 街全体が遊び場",
    "meta": "宝探しアプリを探していますか？MapRaidersは街全体がライブの宝探しになるGPS MMO。家族、友達、犬と一緒に。",
    "keywords": "宝探しアプリ, 宝探し ゲーム, スカベンジャーハント, 街歩き, 家族, GPS",
    "badge": "宝探しアプリ",
    "pricing_pill": "完全無料 · 街がそのまま遊び場",
    "h1_html": '宝探しアプリ — 街全体が<em>遊び場</em>',
    "lead": "宝探しアプリといえば、特定のスポットを巡るタイプが多いですが、MapRaidersは違います。街全体に他のプレイヤーが残した「エコー」があり、歩くと自然に発見できます。家族で、友達で、犬とで — 街がそのままライブの宝探し場になります。",
    "trigger": {
        "quote": "街全体が、オープンな宝探しになる。",
        "author": "Aljoscha P.（ベルリン地域、クローズドベータ）"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "現代の宝探しアプリ",
            "title": "現代の宝探しアプリの<em>3条件</em>",
            "body": """
    <p>2026年の宝探しアプリに求められる条件は、昔とはずいぶん違います：</p>
    <ul>
      <li><strong>ライブ性。</strong>事前にコース設定する必要がなく、街にすでに宝が散りばめられている。</li>
      <li><strong>ソーシャル性。</strong>他のプレイヤーが残した宝を発見する、共同創造の楽しみ。</li>
      <li><strong>無料。</strong>コース購入や課金なしで、すべての街を遊び場にできる。</li>
    </ul>
    <p>MapRaidersはこの3つの条件をすべて満たす、新しいタイプの宝探しアプリです。</p>
            """,
        },
        {
            "label": "比較",
            "title": "宝探しアプリ<em>比較</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>アプリ</th><th>特徴</th><th>ライブ性</th><th>無料</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">MapRaiders</td><td>街全体にエコーが散らばる</td><td class="check">✓ ライブ</td><td class="check">✓</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>世界中のキャッシュを探す</td><td class="check">✓</td><td>プレミアム制</td></tr>
      <tr><td class="feat-name">ニッポン城めぐり</td><td>城を訪れて記録</td><td class="cross">事前設定済み</td><td class="check">✓</td></tr>
      <tr><td class="feat-name">Munzee</td><td>QRコード探索</td><td class="check">✓</td><td>機能制限あり</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "エコー機能",
            "title": "MapRaidersの<em>エコー機能</em>",
            "body": """
    <p>エコーとは、プレイヤーが場所に残せる音声・写真・動画のメッセージです。次に通りかかったプレイヤーが発見でき、街の隅々に他の人の物語が残ります：</p>
    <ul>
      <li><strong>音声エコー。</strong>「ここの桜が綺麗です」「この坂を登ると景色が良い」などの一言メッセージ。</li>
      <li><strong>写真エコー。</strong>季節ごとの風景や、面白い看板、隠れた名店の写真。</li>
      <li><strong>動画エコー。</strong>短い動画で場所の雰囲気を伝える。</li>
    </ul>
    <p>これらが街中に散らばり、お散歩中にひょっこり発見できる仕組みです。</p>
            """,
        },
        {
            "label": "家族向け",
            "title": "<em>家族向け</em>の楽しみ方",
            "body": "<p>MapRaidersは家族でのお出かけにも適しています：</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>子供と一緒に</h3><p>「次の通りに何があるかな？」と、ゲーム感覚でお散歩できます。スクリーンの中ではなく、本物の街を探検する体験。</p></div>
    <div class="feat-card rv d1"><h3>祖父母と</h3><p>シニアの方も操作が簡単。お孫さんと一緒に「うちの周りを陣地にしよう」と楽しめます。</p></div>
    <div class="feat-card rv d2"><h3>犬と一緒に</h3><p>犬のお散歩がそのまま家族イベントに。お子さんも一緒に歩く動機になります。</p></div>
    <div class="feat-card rv d3"><h3>個人情報保護法対応</h3><p>日本の個人情報保護法（APPI）に準拠し、お子様のデータも安全に扱います。</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "宝探しアプリと普通の位置情報ゲームの違いは？",
         "a": "宝探しアプリは「発見」がメインの楽しみです。MapRaidersは陣取りゲームでもありますが、街全体に他のプレイヤーのエコーが散らばっているため、宝探しとしても遊べます。両方の楽しみが同居しています。"},
        {"q": "コースを購入する必要がありますか？",
         "a": "いいえ。MapRaidersは事前のコース購入が一切不要です。すでに街にエコーが散らばっており、歩くと自然に発見できます。"},
        {"q": "子供と一緒に使えますか？",
         "a": "はい、家族でのお散歩に最適です。お子さんがいる場合、保護者の方の管理下で使うことをおすすめします。日本の個人情報保護法（APPI）に準拠した設計です。"},
        {"q": "エコーは誰でも残せますか？",
         "a": "はい、すべてのプレイヤーがエコーを残せます。ただし、不適切な内容は他のプレイヤーから報告でき、運営側で確認後に削除されます。"},
        {"q": "犬と一緒に楽しめますか？",
         "a": "もちろんです。犬のお散歩中に、新しい場所のエコーを発見する楽しみが加わります。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/散歩ゲーム.html", "散歩ゲーム"),
        ("/ja/宝探しアプリ-レビュー.html", "宝探しアプリ — レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K7 = {
    "slug": "/ja/課金不要-位置情報ゲーム.html",
    "breadcrumb": "課金不要 位置情報ゲーム",
    "title": "課金不要 位置情報ゲーム — 100%無料で全機能",
    "og_title": "課金不要 位置情報ゲーム — 100%無料",
    "meta": "課金不要の位置情報ゲームをお探しですか？MapRaidersは100%無料、ガチャなし、広告なし。コスメだけ任意購入。",
    "keywords": "課金不要 位置情報ゲーム, 無料 位置情報ゲーム, ガチャなし, 広告なし, P2W なし",
    "badge": "課金不要",
    "pricing_pill": "100% 無料ゲームプレイ · ガチャなし",
    "h1_html": '課金不要 位置情報ゲーム — 全機能<em>100%無料</em>',
    "lead": "課金しなくてもすべての機能が遊べる位置情報ゲームをお探しですか？MapRaidersは陣地、エコー、クエスト、クラン、防衛ミニゲーム、イベント — すべてが完全無料です。コスメティック・アイテムは任意で、購入してもゲームプレイに影響しません。",
    "trigger": {
        "quote": "課金しなくても、すべての遊びが楽しめます。",
        "author": "MapRaidersのコンセプト"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "課金疲れ",
            "title": "日本の<em>課金疲れ</em>の実態",
            "body": """
    <p>位置情報ゲームに限らず、スマホゲーム全体で「課金しないと先に進めない」「ガチャで何万円も使ってしまった」という声が増えています。本来の楽しみが、課金圧で薄れてしまうことも。</p>
    <p>2024年の調査では、位置情報ゲームを楽しんでいる方の約60%が「無課金で続けたい」と回答していますが、実際には：</p>
    <ul>
      <li><strong>シーズンパス</strong>を逃すと特典が永久に失われる</li>
      <li><strong>ガチャ</strong>で限定キャラを引かないと進めない</li>
      <li><strong>リモートパス</strong>で移動を補わないとイベントに参加できない</li>
    </ul>
    <p>こうした課金圧から離れて、ゆっくり楽しめる位置情報ゲームを探している方が増えています。</p>
            """,
        },
        {
            "label": "MapRaidersの「無料」",
            "title": "MapRaidersの<em>「無料」</em>定義",
            "body": "<p>誤解のないように、料金体系を最初から透明にしています：</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>ティア</th><th>内容</th><th>価格（10%消費税込）</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>陣地、エコー、クエスト、クラン、防衛ミニゲーム、季節イベント、すべて</td><td>¥0</td></tr>
      <tr><td class="feat-name">コスメティックIAP</td><td>マーカー、陣地カラー、クラン紋章、スキン</td><td>¥250 〜 ¥1,200</td></tr>
      <tr><td class="feat-name">サポーター（月額）</td><td>名誉バッジ、ファウンダーレター、月替わりコスメ</td><td>¥600 / 月</td></tr>
      <tr><td class="feat-name">ライフタイム</td><td>コレクター・コスメ、クレジット表記</td><td>¥14,800（一回限り）</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "ガチャなし宣言",
            "title": "<em>ガチャなし</em>宣言",
            "body": """
    <p>MapRaidersには<strong>ガチャ要素が一切ありません</strong>。ランダム性で課金を煽る仕組みは、設計段階から排除しています。コスメティック・アイテムはすべて固定価格で、欲しいものを直接購入できます。</p>
    <p>これは設計者の信念です：ゲームの楽しさは、運の良し悪しで決まるべきではなく、プレイの工夫で決まるべきだと考えています。</p>
            """,
        },
        {
            "label": "コスメ透明性",
            "title": "コスメティック・アイテムの<em>透明性</em>",
            "body": """
    <p>MapRaidersのコスメティックは、すべて以下の特性を持ちます：</p>
    <ul>
      <li><strong>固定価格。</strong>¥250、¥500、¥800、¥1,200の4ティア。すべて10%消費税込み。</li>
      <li><strong>ゲームプレイ無影響。</strong>陣地強度、攻撃力、防衛力に一切影響しません。見た目だけです。</li>
      <li><strong>永続所有。</strong>一度購入すれば、永久にあなたのものです。期間制限はありません。</li>
      <li><strong>払い戻し可能。</strong>Google Playの払い戻しポリシーに準拠します。</li>
    </ul>
    <p>支払い方法は、Apple Pay、PayPay、LINE Pay、楽天ペイ、メルペイなど、日本で広く使われているサービスに対応予定です。</p>
            """,
        },
    ],
    "faq": [
        {"q": "本当に課金不要で全機能遊べますか？",
         "a": "はい。陣地占領、エコー作成、クエスト、クラン形成、防衛ミニゲーム、季節イベント — すべてが完全無料です。コスメティックを購入したプレイヤーと、何も買わないプレイヤーで、ゲーム上の有利不利は一切ありません。"},
        {"q": "ガチャはありますか？",
         "a": "いいえ、一切ありません。コスメティックは固定価格で、欲しいものを直接購入する仕組みです。ランダム性で課金を煽る設計は意図的に排除しています。"},
        {"q": "広告は表示されますか？",
         "a": "いいえ。MapRaidersは100%広告フリーです。ゲーム内でも、UIでも、広告は一切表示されません。"},
        {"q": "コスメティック・アイテムを買うとゲームが有利になりますか？",
         "a": "いいえ。コスメティックは見た目のみを変更します。陣地の強度、攻撃力、防衛力には一切影響しません。「Pay-to-Win」要素はゼロです。"},
        {"q": "サブスクは強制ですか？",
         "a": "いいえ。MapRaidersサポーター（¥600/月）は完全に任意で、運営を支援したい方向けのオプションです。サブスクなしでも全機能を遊べます。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/ポケモンGO-代わり-無料.html", "ポケモンGO 代わり 無料"),
        ("/ja/課金不要-位置情報ゲーム-レビュー.html", "課金不要 — レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA — TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/ja/陣取りゲーム-レビュー.html",
        "breadcrumb": "陣取りゲーム レビュー",
        "title": "陣取りゲーム レビュー — ベータテスター3名の声",
        "og_title": "陣取りゲーム レビュー — クローズドベータ",
        "meta": "陣取りゲームのレビュー：3名のベータテスターが、本物の領地を取り合うMapRaidersでの体験を語ります。原文ドイツ語、translationOfWorkで明記。",
        "keywords": "陣取りゲーム レビュー, 陣取りゲーム 体験談, MapRaiders レビュー",
        "h1_html": '陣取りゲーム — <em>ベータテスターの声</em>',
        "lead": "本物の陣地を取り合う体験はどんな感じ？3名のクローズドベータ参加者が、初めて領地を獲得した瞬間、初めて減衰を経験した時、初めて防衛ミニゲームをプレイした感覚を語ります。",
        "intro_label": "テストの観点",
        "intro_title": "陣取りゲームの<em>体験軸</em>",
        "intro_body": """
    <p>陣取りゲームのテストでは、3つの体験軸を見ています：</p>
    <ul>
      <li><strong>占領。</strong>初めて自分の通りが「自分の領地」になった感覚はいつ？</li>
      <li><strong>喪失。</strong>初めての減衰、または攻撃者からの奪取をどう受け止める？</li>
      <li><strong>防衛。</strong>防衛ミニゲームは戦略的、公正、ストレスフル？</li>
    </ul>
    <p>3名のテスターのコメントは、3つの異なる視点からこれらの軸をカバーします。</p>
        """,
        "internal_links": [
            ("/ja/陣取りゲーム.html", "陣取りゲーム"),
            ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
            ("/ja/位置情報ゲーム-レビュー.html", "位置情報ゲーム — レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/位置情報ゲーム-レビュー.html",
        "breadcrumb": "位置情報ゲーム レビュー",
        "title": "位置情報ゲーム レビュー — MapRaidersの実体験",
        "og_title": "位置情報ゲーム レビュー — クローズドベータの声",
        "meta": "位置情報ゲームのレビュー：MapRaidersのクローズドベータ参加者3名が、ドイツの3都市での実体験を語ります。",
        "keywords": "位置情報ゲーム レビュー, 位置ゲー 体験談, MapRaiders 評価",
        "h1_html": '位置情報ゲーム — <em>3都市での実体験</em>',
        "lead": "位置情報ゲームは、住んでいる場所のプレイヤー密度で体験が変わります。シュトゥットガルト、ハンブルク、ベルリンの3名のテスターが、それぞれの街での実感を語ります。",
        "intro_label": "3都市・3スタイル",
        "intro_title": "<em>位置情報ゲーム</em>はどこでどう違う？",
        "intro_body": """
    <p>位置情報ゲームの楽しさは、自分の住んでいる地域のプレイヤー密度に大きく左右されます。3名のテスターは異なる都市プロファイルをカバーしています：</p>
    <ul>
      <li><strong>ベルリン（Aljoscha P.）</strong> — 都市探検家の密度が高く、エコーも多い、地区横断の動き。</li>
      <li><strong>ハンブルク（Vivian N.）</strong> — アルスター湖周辺のジョガーが多く、心肺機能フォーカスの利用。</li>
      <li><strong>シュトゥットガルト（Ron C.）</strong> — 犬の飼い主クラスター、より静かな近所ロジック。</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
            ("/ja/陣取りゲーム.html", "陣取りゲーム"),
            ("/ja/陣取りゲーム-レビュー.html", "陣取りゲーム — レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/ポケモンGO-代わり-レビュー.html",
        "breadcrumb": "ポケモンGO 代わり レビュー",
        "title": "ポケモンGO 代わり レビュー — 併用テスト",
        "og_title": "ポケモンGO 代わり レビュー",
        "meta": "ポケモンGOの代わりレビュー：3名のベータテスターが、ポケモンGOとMapRaidersの併用体験を語ります。",
        "keywords": "ポケモンGO 代わり レビュー, ポケモンGO 比較, 併用",
        "h1_html": 'ポケモンGO 代わり — <em>併用テスト</em>',
        "lead": "ポケモンGOを続けながら、MapRaidersも一緒に使ってみたら？3名のクローズドベータ参加者が、両アプリの併用体験を率直に語ります。",
        "intro_label": "併用テスト",
        "intro_title": "<em>2つのアプリ</em>を一緒に使うと？",
        "intro_body": """
    <p>多くのプレイヤーがポケモンGOを続けながら、MapRaidersも試しています。テスターたちが体験したのは：</p>
    <ul>
      <li><strong>電池への影響。</strong>両方を起動して大丈夫？</li>
      <li><strong>使い分け。</strong>朝はどちら、夕方はどちら？</li>
      <li><strong>飽きずに続けられるか。</strong>2つあると忙しすぎる？</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/ポケモンGO-代わり-無料.html", "ポケモンGO 代わり 無料"),
            ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
            ("/ja/ドラクエウォーク-似てる-レビュー.html", "ドラクエウォーク似てる — レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/ドラクエウォーク-似てる-レビュー.html",
        "breadcrumb": "ドラクエウォーク 似てる レビュー",
        "title": "ドラクエウォーク 似てる レビュー — 補完テスト",
        "og_title": "ドラクエウォーク 似てる レビュー",
        "meta": "ドラクエウォークが好きな方に向けたMapRaidersレビュー。両アプリ併用での体験を3名のテスターが語ります。",
        "keywords": "ドラクエウォーク 似てる レビュー, ドラクエウォーク 比較, 補完",
        "h1_html": 'ドラクエウォーク × MapRaiders — <em>補完テスト</em>',
        "lead": "ドラクエウォークを続けながら、MapRaidersも一緒に楽しめるか？3名のテスターが両アプリの併用体験を語ります。",
        "intro_label": "補完アプリとして",
        "intro_title": "<em>ドラクエウォークとの相性</em>",
        "intro_body": """
    <p>ドラクエウォークの代わりではなく、補完するアプリとしてのMapRaidersを評価します。観点は：</p>
    <ul>
      <li><strong>使い分けの自然さ。</strong>同じ散歩中に両方使えるか？</li>
      <li><strong>体験の重なり。</strong>JRPG要素と陣取り要素は混乱しない？</li>
      <li><strong>時間の取り合い。</strong>2つあると、どちらかをサボることにならない？</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/ドラクエウォーク-似てる.html", "ドラクエウォーク 似てる"),
            ("/ja/陣取りゲーム.html", "陣取りゲーム"),
            ("/ja/位置情報ゲーム-レビュー.html", "位置情報ゲーム — レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/散歩ゲーム-レビュー.html",
        "breadcrumb": "散歩ゲーム レビュー",
        "title": "散歩ゲーム レビュー — お散歩派テスター3名",
        "og_title": "散歩ゲーム レビュー — 健康と楽しさ",
        "meta": "散歩ゲームのレビュー：3名のベータテスターが、毎日のお散歩がどう変わったかを語ります。健康、犬の散歩、ジョギング。",
        "keywords": "散歩ゲーム レビュー, 散歩 アプリ 体験談, ウォーキング ゲーム 評価",
        "h1_html": '散歩ゲーム — <em>毎日のお散歩</em>がどう変わるか',
        "lead": "毎日のお散歩がゲーム体験になると、何が変わるのでしょうか？3名のテスターが、犬の散歩、ジョギング、街歩きそれぞれの体験を語ります。",
        "intro_label": "お散歩スタイル",
        "intro_title": "3つの<em>お散歩スタイル</em>",
        "intro_body": """
    <p>散歩ゲームの楽しさは、自分のお散歩スタイルとの相性で変わります。3名のテスターは：</p>
    <ul>
      <li><strong>Ron C.（犬の散歩）</strong> — 毎日同じ時間に同じルートを歩く生活リズム。</li>
      <li><strong>Vivian N.（ジョギング）</strong> — 朝のランニング、心肺機能のためのアクティビティ。</li>
      <li><strong>Aljoscha P.（街歩き）</strong> — 新しい場所を探索する不規則なパターン。</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/散歩ゲーム.html", "散歩ゲーム"),
            ("/ja/陣取りゲーム.html", "陣取りゲーム"),
            ("/ja/宝探しアプリ-レビュー.html", "宝探しアプリ — レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/宝探しアプリ-レビュー.html",
        "breadcrumb": "宝探しアプリ レビュー",
        "title": "宝探しアプリ レビュー — エコー機能の体験",
        "og_title": "宝探しアプリ レビュー — エコー機能",
        "meta": "宝探しアプリのレビュー：エコー機能を中心に、3名のベータテスターがMapRaidersでの宝探し体験を語ります。",
        "keywords": "宝探しアプリ レビュー, スカベンジャーハント 体験談, エコー機能",
        "h1_html": '宝探しアプリ — <em>エコー機能の体験</em>',
        "lead": "MapRaidersのエコー機能は、街全体を宝探し場に変えます。3名のテスターが、エコーを残し、エコーを発見する体験を率直に語ります。",
        "intro_label": "エコーテスト",
        "intro_title": "<em>エコー機能</em>の体験軸",
        "intro_body": """
    <p>エコー機能のテストでは、以下の軸で評価しました：</p>
    <ul>
      <li><strong>残しやすさ。</strong>音声・写真・動画のエコー作成は直感的か？</li>
      <li><strong>発見の楽しさ。</strong>他の人のエコーを見つけた瞬間の感覚は？</li>
      <li><strong>家族向け。</strong>子供と一緒に楽しめるか？</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/宝探しアプリ.html", "宝探しアプリ"),
            ("/ja/散歩ゲーム.html", "散歩ゲーム"),
            ("/ja/散歩ゲーム-レビュー.html", "散歩ゲーム — レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/課金不要-位置情報ゲーム-レビュー.html",
        "breadcrumb": "課金不要 位置情報ゲーム レビュー",
        "title": "課金不要 位置情報ゲーム レビュー — 完全無料の実態",
        "og_title": "課金不要 位置情報ゲーム レビュー",
        "meta": "課金不要の位置情報ゲームレビュー：本当にゲームプレイは無料？3名のベータテスターが、コスメ買わずに全機能遊べたか正直に語ります。",
        "keywords": "課金不要 位置情報ゲーム レビュー, 無料 評価, ガチャなし",
        "h1_html": '課金不要 位置情報ゲーム — <em>完全無料の実態</em>',
        "lead": "課金疲れから離れたい方が、本当に無料で全機能を楽しめるのか？3名のテスターが、コスメティックを買わずに数週間プレイした体験を語ります。",
        "intro_label": "無料テスト",
        "intro_title": "<em>本当に無料</em>か検証",
        "intro_body": """
    <p>「無料」と謳うアプリでも、実際に遊んでみると課金圧があるケースも多いものです。MapRaidersでは：</p>
    <ul>
      <li><strong>ゲームプレイ。</strong>陣地、エコー、クエストすべて無課金で遊べたか？</li>
      <li><strong>進行差。</strong>コスメ購入者と無課金者の進行に差はあったか？</li>
      <li><strong>イベント。</strong>季節イベントは無課金でも楽しめたか？</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/課金不要-位置情報ゲーム.html", "課金不要 位置情報ゲーム"),
            ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
            ("/ja/ポケモンGO-代わり-レビュー.html", "ポケモンGO代わり — レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/ja/MapRaiders-レビュー.html",
    "breadcrumb": "MapRaiders レビュー",
    "title": "MapRaiders レビュー — 全評価とベータテスト",
    "og_title": "MapRaiders レビュー — すべてを一覧で",
    "meta": "MapRaidersレビュー：5.0/5（3名の検証済みベータレビュー）、ファウンダー・ステートメント、全Killerページとレビューを一元化。",
    "keywords": "MapRaiders レビュー, MapRaiders 評価, MapRaiders 体験談, GPS MMO 評価",
    "badge": "ハブ・全体一覧",
    "pricing_pill": "5.0 / 5 — 3名の検証済みベータレビュー",
    "h1_html": '<em>MapRaidersレビュー</em> — GPS MMOについて知るべきすべて',
    "lead": "シュトゥットガルト、ハンブルク、ベルリンの3名のベータテスター。ポケモンGOの代わりから宝探しアプリまで、7つのKillerトピック。7つの詳細レビュー。一つのハブ。",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "MapRaidersとは何ですか？",
         "a": "MapRaidersはAndroid向けのGPS MMOゲームです。プレイヤーは移動によって本物の陣地を占領し、エコーを残し、クエストを作成し、ミニゲームで領地を防衛します。広告なし、課金不要、AR不要。"},
        {"q": "ベータテスターは何名ですか？",
         "a": "現在公開している3名は、本人の同意のもと、プライバシー上の理由から名前+イニシャルで紹介しています。クローズドベータ全体はもっと大規模ですが、3名の方は主要なペルソナを代表しています。"},
        {"q": "レビューは本物ですか？",
         "a": "はい。3名のテスターはクローズドベータの実在の参加者です。報酬は受け取っておらず、コメントは原文ドイツ語で書かれ、Schema.orgマークアップで日付と言語が明記されています。"},
        {"q": "ベータテスターになれますか？",
         "a": "トップページのメールフォームから登録してください。空き状況に応じて段階的に枠が開きます。プレイヤー密度が低い地域からの優先登録があります。"},
        {"q": "正式版はいつですか？",
         "a": "MapRaidersは現在Google Playでクローズドベータとして提供中です。正式リリースは2026年内の予定、iOS版は2026年第3四半期を予定しています。"},
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
    safe_print("=== Phase 1 Session 2 - JA Killer-URL Builder ===")
    safe_print(f"Output: {JA_DIR}")
    safe_print("")

    JA_DIR.mkdir(parents=True, exist_ok=True)
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

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
    "role": "犬の飼い主、シュトゥットガルト地域",
    "role_long": "シュトゥットガルト地域の犬の飼い主（クローズドベータ）",
    "quote": "うちの犬はどうせ毎日二回は外に出さないといけないので、ついでにスマホを持って歩くようになりました。馬鹿らしいかもしれませんが、夜寝る前に自分の通りがちゃんと青いままか、いつも確認してしまいます。",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "ジョガー、ハンブルク地域",
    "role_long": "ハンブルク地域のジョガー（クローズドベータ）",
    "quote": "もともと毎朝走っていたのですが、今は守るものができました。アルスター湖の周回ルートは私のもので、できればずっとそうあってほしい。これだけのことで、こんなに走るのが続くのかと自分でも驚いています。",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "街歩きが好き、ベルリン地域",
    "role_long": "ベルリン地域で街歩きを楽しむベータ参加者（クローズドベータ）",
    "quote": "あるアパートの入口に短い音声を置いてみました。三日後に、知らない人がそれを聞いていました。ゲームの一機能なのに、妙に親密な感じがして不思議でした。",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "ポケモンGOは三年ほど遊んで、途中でやめました。欲しかったのは消えてしまうジムではなく、"
    "ちゃんと残る自分の土地でしたが、それは結局来ませんでした。"
    "2025年にニアンティックのゲーム部門がスコープリーに売却されたとき、"
    "自分が興味を持っていた方向とは違う道に進むのだろうと思いました。"
    "だからMapRaidersは自分で作っています。広告なし、投資家からの圧力なし、サブスクの強制もなし。"
    "うちの近所は私の遊び場、皆さんの近所も、皆さんの手で取り戻してください。"
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
      ご注意：上記のテスターはクローズドベータ参加者の実在の方々です。本人の希望により、名字はイニシャルのみで掲載しています。原文はドイツ語で、Schema.orgの<code>translationOfWork</code>で原文と翻訳の関係を明示しています。
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
  <p class="f-copy">&copy; 2026 MapRaiders。あなたの地区、あなたの陣地。運営：Scafa Investments LLC。</p>
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
        "name": "MapRaiders JA：全レビューおよびテーマ別ページ一覧",
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
  <p class="rv d1">MapRaidersのほかの面も読んでみてください。</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Google Playで近日公開、無料、スパムなし。</p>
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
  <cite>– {page['trigger']['author']}</cite>
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
  <h2 class="sec-title rv d1">5.0 / 5：<em>クローズドベータ参加者3名のレビュー</em></h2>
  <div class="prose rv d2">
    <p>ドイツ在住の3名のベータテスター（犬の飼い主、ジョガー、街歩きが好きな方）が、それぞれ数週間にわたってMapRaidersを使ってくれました。以下のコメントは原文ドイツ語で書かれたもので、本人の希望によりプライバシー上の理由から名字はイニシャルのみにしています。</p>
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
    <p>ここから7つのテーマ別ページと、それぞれに対応するレビューページにアクセスできます。ポケモンGOからの乗り換え、ドラクエウォークとの併用、陣取りや散歩アプリとしての側面など、それぞれの角度から見たMapRaidersをまとめています。どのページから読み始めても構いませんが、通して読むと全体像がつながると思います。</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">レビュー詳細</div>
  <h2 class="sec-title rv d1">ベータテスターの声を<em>異なる視点</em>から</h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">総合評価</div>
  <h2 class="sec-title rv d1">5.0 / 5：<em>3名のベータテスターによるレビュー</em></h2>
  <div class="prose rv d2">
    <p>レビューは2026年2月から4月にかけてのクローズドベータで集まったものです。3名のテスター（犬の飼い主、ジョガー、街歩きが好きな方）が、それぞれシュトゥットガルト、ハンブルク、ベルリンの自分の生活ルートでMapRaidersを使ってくれました。原文はドイツ語で、本人の希望により名字はイニシャルのみで掲載しています。</p>
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
    "title": "陣取りゲーム：本物の土地を取り合うGPS MMO",
    "og_title": "陣取りゲーム：本物の土地を取り合うGPS MMO",
    "meta": "陣取りゲームをスマホで。MapRaidersは歩いた道がそのまま自分の陣地として残るGPS MMOです。広告なし、ガチャなし、AR不要。歩くことに意味を持たせます。",
    "keywords": "陣取りゲーム, 陣取り, 領地, MMO, GPS, 位置情報, 散歩",
    "badge": "陣取りゲーム",
    "pricing_pill": "ゲームプレイは無料、コスメは¥250から",
    "h1_html": '陣取りゲーム：本物の土地を取り合う<em>GPS MMOアプリ</em>',
    "lead": "「陣取りゲーム」で検索すると、Wikipediaや昔の盤上ゲームの解説が並びます。スマホで本当に「土地」を取り合えるアプリは、これまでほとんどありませんでした。MapRaidersは実際の地図の上で、歩いた道がそのまま自分の陣地として残るGPS MMOです。広告なし、ガチャなし、AR不要。",
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
    <p><strong>陣取りゲーム</strong>は、地図上のエリアを長く保有して、守ったり広げたりするタイプのゲームです。盤上ゲームの古典「陣取り合戦」をデジタルに移したような系譜で、ポイントを貯めるだけのアプリとは少し性質が違います。</p>
    <p>陣取りゲームらしさを支えている要素はいくつかあります。</p>
    <ul>
      <li><strong>持続性。</strong>取った陣地は、ログアウトしているあいだもプレイヤーやクランのものとして地図上に残ります。</li>
      <li><strong>減衰。</strong>歩かないでいると、陣地は少しずつ縮みます。誰かが永遠にブロックすることはありません。</li>
      <li><strong>防衛。</strong>攻撃を受けたときは、自動計算ではなく、プレイヤー同士のミニゲームで決着がつきます。</li>
      <li><strong>クランへの引き継ぎ。</strong>陣地は仲間やクランに譲ることができ、長く続けるほど関係性に深みが出ます。</li>
    </ul>
            """,
        },
        {
            "label": "MapRaidersの仕組み",
            "title": "MapRaidersの<em>陣取りシステム</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>占領</h3><p>歩いたり、走ったり、自転車で通ったりすると、GPSの軌跡が地図上に陣地のポリゴンとして描かれます。そこにはあなたの名前が残ります。</p></div>
    <div class="feat-card rv d1"><h3>減衰エンジン</h3><p>しばらく通らない陣地は毎日少しずつ縮みます。陣地を保つのは課金ではなく、実際に歩くことです。</p></div>
    <div class="feat-card rv d2"><h3>防衛ミニゲーム</h3><p>三目並べ、じゃんけん、ミニチェスなど7種類。プレイ時間の長さではなく、その場の判断で決まります。</p></div>
    <div class="feat-card rv d3"><h3>クラン陣地</h3><p>複数のプレイヤーで一つの陣地を共有できます。クラン陣地は単独の攻撃者だけでは簡単には破れません。</p></div>
  </div>""",
        },
        {
            "label": "他のアプリとの違い",
            "title": "ドラクエウォークやポケモンGOには<em>ない</em>もの",
            "body": """
    <p>ドラクエウォークもポケモンGOも、それぞれ完成度の高い位置情報ゲームです。ただ、どちらにも「自分の陣地」という概念は中心にはありません。ドラクエウォークは旅と冒険、ポケモンGOは収集とジムバトル。MapRaidersが埋めようとしているのは、<strong>本物の土地を長く持ち続ける</strong>という、これまで意外と空いていた部分です。</p>
    <p>もちろん、ドラクエウォークやポケモンGOと併用しても問題ありません。むしろ別の楽しみ方が並んでいると考えてもらうのが自然です。</p>
            """,
        },
    ],
    "faq": [
        {"q": "陣取りゲームとは何ですか？",
         "a": "地図上のエリアを長く保有し、守ったり広げたりするゲームの総称です。MapRaidersの場合、実際に通りを歩くと、そのルートがGPS地図上に自分の陣地として描かれます。誰かに奪い返されない限り、その土地はあなたのものとして残り続けます。"},
        {"q": "課金は必要ですか？",
         "a": "ゲームプレイの部分（陣地、エコー、クエスト、クラン、防衛ミニゲーム）はすべて無料です。コスメティック・アイテム（¥250〜¥1,200）は任意で、購入しても見た目だけが変わります。ゲーム上の有利不利には関係しません。"},
        {"q": "ARカメラは必要ですか？",
         "a": "必要ありません。MapRaidersはAR非搭載で、GPSと地図だけで動きます。そのぶん電池への負担が少なく、プライバシー面でも気を遣わずに済みます。"},
        {"q": "電池はどれくらい持ちますか？",
         "a": "ARを使わないので、AR中心の位置情報ゲームと比べると、長時間の散歩で電池の減りはかなり緩やかです。1〜2時間のジョギングでも、最後まで電池が残っていることが多いです。"},
        {"q": "iOS版はいつですか？",
         "a": "今のところAndroid版だけ、Google Playのクローズドベータとして提供しています。iOS版は2026年の第3四半期ごろを目安に準備中です。メーリングリストに登録しておくと、リリース時にお知らせが届きます。"},
    ],
    "internal_links": [
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/散歩ゲーム.html", "散歩ゲーム"),
        ("/ja/課金不要-位置情報ゲーム.html", "課金不要の位置情報ゲーム"),
        ("/ja/陣取りゲーム-レビュー.html", "陣取りゲーム：レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K2 = {
    "slug": "/ja/位置情報ゲーム.html",
    "breadcrumb": "位置情報ゲーム",
    "title": "位置情報ゲームおすすめ2026：陣地が取れる7選",
    "og_title": "位置情報ゲームおすすめ2026：7選を比較",
    "meta": "位置情報ゲームのおすすめ7選を比較しました。MapRaidersは本物の陣地が持続するGPS MMO。広告なし、ガチャなし、AR不要、電池も長持ち。",
    "keywords": "位置情報ゲーム, 位置ゲー, GPS, おすすめ, 比較, 2026, 散歩",
    "badge": "位置情報ゲームおすすめ",
    "pricing_pill": "MapRaidersのゲームプレイは無料、コスメは任意",
    "h1_html": '位置情報ゲームおすすめ2026：<em>本物の土地</em>を取れるアプリ7選',
    "lead": "位置情報ゲームを探していますか。2026年の時点で、ドラクエウォーク、ポケモンGO、駅メモ、ニッポン城めぐり、Pikmin Bloom、モンスターハンターNowなど、選択肢はかなり増えました。どれもそれぞれの良さがありますが、「自分の土地を長く持ち続ける」という意味での陣取りに振り切っているのはMapRaidersくらいです。比べてみて、自分のスタイルに合うものを選んでみてください。",
    "trigger": {
        "quote": "歩くことに意味を。陣地が、待っている。",
        "author": "MapRaidersのコンセプト"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "選び方",
            "title": "位置情報ゲームを選ぶときの<em>視点</em>",
            "body": """
    <p>選択肢が多いので、自分に合うものを見つけるにはいくつかの軸で比較してみるのが早いです。</p>
    <ul>
      <li><strong>課金の作法。</strong>ゲームプレイ自体は無料か、ガチャやサブスク・パスがあるかどうか。長く付き合うつもりなら、ここはそれなりに大事です。</li>
      <li><strong>ARの有無。</strong>ARを多用するアプリは電池の減りが速く、毎日の散歩用途では少し疲れることがあります。</li>
      <li><strong>電池持ち。</strong>1〜2時間のジョギングや街歩きで最後まで電池が残るかどうかは、続けるうえで効いてきます。</li>
    </ul>
            """,
        },
        {
            "label": "7選比較",
            "title": "2026年版、<em>位置情報ゲームおすすめ7選</em>",
            "body": "<p>それぞれのアプリに得意分野があります。MapRaidersは陣取り、ドラクエウォークは旅と冒険、ポケモンGOは収集と、別ジャンルとして並べてみます。</p>",
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
            "title": "MapRaidersが<em>少し違う</em>ところ",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>陣地が残る</h3><p>歩いた通りがそのまま自分の名前付きの陣地として地図に残ります。攻撃や減衰で削られない限り、ずっとあなたのものです。</p></div>
    <div class="feat-card rv d1"><h3>音のエコー</h3><p>気に入った場所に、音声・写真・動画のエコーを置けます。たまたま通りかかった他のプレイヤーがそれを見つける、ゆるい宝探しのような仕組みです。</p></div>
    <div class="feat-card rv d2"><h3>防衛ミニゲーム7種</h3><p>攻撃を受けたら、三目並べ・じゃんけん・ミニチェスなどで決着がつきます。プレイ時間より、その瞬間の判断が効きます。</p></div>
    <div class="feat-card rv d3"><h3>近所単位のクラン</h3><p>クランはDiscordから声をかけ合うものではなく、同じ通りを歩く人どうしが自然に重なって生まれます。</p></div>
    <div class="feat-card rv d4"><h3>電池に優しい</h3><p>カメラもARも使わず、地図とGPSだけで動くので、長めの散歩やジョギングでも電池切れの心配は少なめです。</p></div>
  </div>""",
        },
        {
            "label": "誰に向いているか",
            "title": "<em>こんな方</em>に向いています",
            "body": """
    <p>位置情報ゲームを長く楽しむには、ふだんの生活に自然に乗っかれることが大事です。MapRaidersは特にこんな方と相性が良いと思います。</p>
    <ul>
      <li><strong>犬の散歩</strong>を毎日される方。日課がそのまま陣地保有のリズムになります。</li>
      <li><strong>ジョギングやウォーキング</strong>を続けたい方。「守るルートがある」という感覚で続けやすくなります。</li>
      <li><strong>街歩きや聖地巡礼</strong>が好きな方。エコー機能で、他の人の小さな発見にも触れられます。</li>
      <li><strong>ガチャやサブスクなしで遊びたい</strong>方。コア機能はすべて無料で、強制される課金はありません。</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "位置情報ゲームとは何ですか？",
         "a": "スマホのGPS情報を使って、実際の場所と連動して遊ぶゲームの総称です。街を歩くと、ゲーム内のイベントが発生したり、地図上の状態が変わったりします。代表的なタイトルにはポケモンGO、ドラクエウォーク、駅メモ、MapRaidersなどがあります。"},
        {"q": "MapRaidersは無料ですか？",
         "a": "ゲームプレイの部分は無料です。コスメティック・アイテム（¥250〜¥1,200）は任意で、購入しても見た目だけが変わります。ガチャやパス、サブスクが強制されることはありません。"},
        {"q": "ARは必要ですか？",
         "a": "必要ありません。MapRaidersはAR非搭載で、地図とGPSだけで動きます。電池持ちが良く、プライバシー面の負担も少なめです。"},
        {"q": "ドラクエウォークやポケモンGOと併用できますか？",
         "a": "問題なく併用できます。MapRaidersは陣取り、ドラクエウォークは旅と冒険、ポケモンGOは収集と、楽しみ方が違うので、同じ散歩中に両方を開いている方もいます。"},
        {"q": "iOS版はいつですか？",
         "a": "現時点ではAndroid版のみ、クローズドベータで提供しています。iOS版は2026年の第3四半期を目安に準備を進めています。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/ポケモンGO-代わり-無料.html", "ポケモンGO 代わり 無料"),
        ("/ja/ドラクエウォーク-似てる.html", "ドラクエウォーク 似てる"),
        ("/ja/散歩ゲーム.html", "散歩ゲーム"),
        ("/ja/宝探しアプリ.html", "宝探しアプリ"),
        ("/ja/位置情報ゲーム-レビュー.html", "位置情報ゲーム：レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K3 = {
    "slug": "/ja/ポケモンGO-代わり-無料.html",
    "breadcrumb": "ポケモンGO 代わり 無料",
    "title": "ポケモンGOの代わりに無料で：広告なし、AR不要",
    "og_title": "ポケモンGOの代わりに無料で楽しむMapRaiders",
    "meta": "ポケモンGOの代わりを探している方へ。MapRaidersは無料、広告なし、AR不要のGPS MMOです。歩いた道がそのまま陣地として残ります。",
    "keywords": "ポケモンGO 代わり, ポケモンGO 似てる, 無料, 位置情報ゲーム, AR不要, 広告なし",
    "badge": "ポケモンGOの代わりに",
    "pricing_pill": "ゲームプレイ無料、広告なし、AR不要",
    "h1_html": 'ポケモンGOの代わりに：<em>無料で楽しめる</em>位置情報ゲーム',
    "lead": "ポケモンGOを今も楽しんでいる方でも、電池の減りやAR疲れが気になり始めたという話をよく聞きます。MapRaidersは「乗り換え」というより、ポケモンGOと一緒に使ってもいい選択肢です。GPSだけで動き、AR不要、広告なし、ガチャなし。「歩いた道が自分の土地として残る」という、ポケモンGOにはない楽しみ方を担当しています。",
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
    <p>ポケモンGO自体はよくできた位置情報ゲームです。ただ、長く遊んでいると気になってくる部分もあります。</p>
    <ul>
      <li><strong>課金との距離感。</strong>シーズンパス、リモートレイドパス、各種ブースター。無課金でも遊べますが、課金しないと届かない領域は少しずつ広がってきました。</li>
      <li><strong>電池消費。</strong>ARモードは電池の減りが速く、長めの散歩との相性は今ひとつです。</li>
      <li><strong>ARの手間。</strong>毎日の散歩や通勤で、わざわざARを立ち上げるのが面倒に感じる場面もあります。</li>
    </ul>
    <p>MapRaidersは、この3点について違うアプローチをとっています。ポケモンGOをやめる必要はなく、用途を分けて併用してもらうのが現実的です。</p>
            """,
        },
        {
            "label": "MapRaidersの「無料」",
            "title": "MapRaidersでいう<em>「無料」</em>",
            "body": "<p>誤解のないように、料金体系は最初から並べておきます。</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>ティア</th><th>内容</th><th>価格（10%消費税込）</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>陣地、エコー、クエスト、クラン、防衛、イベントなど、ゲームプレイ全般</td><td>¥0</td></tr>
      <tr><td class="feat-name">コスメティックIAP</td><td>マーカー、陣地カラー、クラン紋章、スキン</td><td>¥250〜¥1,200</td></tr>
      <tr><td class="feat-name">MapRaidersサポーター（月額）</td><td>名誉バッジ、ベータ早期アクセス、ファウンダーレター、月替わりコスメ</td><td>¥600／月</td></tr>
      <tr><td class="feat-name">ライフタイムサポーター</td><td>コレクター・コスメ、クレジット表記</td><td>¥14,800（一回限り）</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>大事な点：</strong>コスメティックはゲーム上の有利不利には関係しません。何も買わなくても、ライフタイムサポーターの方とまったく同じ条件で遊べます。</p>""",
        },
        {
            "label": "ポケモンGOとの違い",
            "title": "ポケモンGOとの<em>違いと重なり</em>",
            "body": """
    <p>ポケモンGOとMapRaidersは同じ「位置情報ゲーム」のジャンルですが、目的としているところが違います。同じ散歩のなかで担当箇所が分かれている、と捉えてもらうのが近いかもしれません。</p>
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
    <p>2025年3月、ニアンティックのゲーム部門（ポケモンGOを含む）は、サウジアラビア政府系のパブリック・インベストメント・ファンド（PIF）の傘下にあるスコープリーに売却されました。これは経営判断としての出来事で、ゲーム自体は今も同じように遊べます。MapRaidersはこれとは別に、独立したUS-LLC（Scafa Investments LLC、フロリダ州）が運営しているアプリです。運営元の構造で位置情報ゲームを選びたい方には、一つの参考になればと思います。</p>
    <p>運用面では、GDPR準拠のEUサーバーを使い、広告SDKは入れていません。プレイヤーのデータを第三者に販売することもありません。</p>
            """,
        },
    ],
    "faq": [
        {"q": "ポケモンGOをやめる必要はありますか？",
         "a": "やめる必要はありません。担当しているジャンルが違うので、用途を分けて両方使ってもらってかまいません。"},
        {"q": "本当に無料ですか？",
         "a": "ゲームプレイは無料です。コスメティック・アイテム（¥250〜¥1,200）は任意で、購入しても見た目だけが変わります。"},
        {"q": "広告は表示されますか？",
         "a": "アプリ内では広告を出していません。ゲーム画面でも、UIでも、広告が表示されることはありません。"},
        {"q": "ARは使いますか？",
         "a": "使いません。MapRaidersは地図とGPSだけで動きます。電池持ちが良く、プライバシー面の負担も少なめです。"},
        {"q": "誰が運営していますか？",
         "a": "René Scafarti（ファウンダー、Scafa Investments LLC）と、少人数の独立したチームです。外部の投資家、政府機関、広告ネットワークが関わる構造にはなっていません。"},
    ],
    "internal_links": [
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/ドラクエウォーク-似てる.html", "ドラクエウォーク 似てる"),
        ("/ja/課金不要-位置情報ゲーム.html", "課金不要の位置情報ゲーム"),
        ("/ja/ポケモンGO-代わり-レビュー.html", "ポケモンGO代わり：レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K4 = {
    "slug": "/ja/ドラクエウォーク-似てる.html",
    "breadcrumb": "ドラクエウォーク 似てる",
    "title": "ドラクエウォークに似てる、でも陣地も取れるアプリ",
    "og_title": "ドラクエウォークに似てる、陣取り要素もあるアプリ",
    "meta": "ドラクエウォークが好きな方に向けて。MapRaidersは陣取り要素を担当する位置情報ゲームで、併用するとお互いに補い合えます。",
    "keywords": "ドラクエウォーク 似てる, ドラクエウォーク 代わり, 位置情報ゲーム, 陣取り, MMO",
    "badge": "ドラクエウォークと併用",
    "pricing_pill": "ゲームプレイ無料、ドラクエウォークと併用OK",
    "h1_html": 'ドラクエウォークに似てる、でも<em>陣地も取れる</em>アプリ',
    "lead": "ドラクエウォークの旅、職業システム、季節ごとのストーリーは、ほかでは得られない体験です。MapRaidersはその「代わり」を狙っているアプリではなく、同じ散歩のなかで担当が違うアプリ、と考えてもらうのが近いと思います。歩く時間に陣取りを楽しんで、ふたたび旅へ戻る。両方を開きながら散歩している方が、実際に増えてきています。",
    "trigger": {
        "quote": "ドラクエウォークの旅と一緒に、陣地も取ろう。",
        "author": "MapRaidersのコンセプト"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "ドラクエウォークが愛される理由",
            "title": "ドラクエウォークの<em>立ち位置</em>",
            "body": """
    <p>ドラクエウォークは2019年のリリース以降、日本の位置情報ゲームの中でも特別な存在です。スクウェア・エニックスの世界観、JRPGとしての戦闘、職業の組み合わせ、季節ごとに更新されるストーリー。それらが毎日の散歩に「冒険」という意味を加えてくれました。</p>
    <p>2023年には年間で約3億ドル規模の売上を記録したと報じられており、日本の位置情報ゲーム市場の中心的なタイトルの一つです。</p>
            """,
        },
        {
            "label": "MapRaidersが補う点",
            "title": "MapRaidersがドラクエウォークを<em>補完</em>する部分",
            "body": "<p>ドラクエウォークの良さを置き換えようとはしていません。少し違う体験軸を並べて、選んでもらう、という考え方です。</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>陣地占領</h3><p>歩いた通りがそのまま陣地として残ります。ドラクエウォークの「冒険」とは別の、土地に対する愛着が出てきます。</p></div>
    <div class="feat-card rv d1"><h3>エコー機能</h3><p>場所に音声、写真、動画を置いて、誰かに見つけてもらえる仕組み。街全体に小さな贈り物が散らばっているような感覚です。</p></div>
    <div class="feat-card rv d2"><h3>防衛ミニゲーム</h3><p>三目並べ、じゃんけん、ミニチェス。攻防の瞬間にプレイヤー同士の判断がぶつかります。</p></div>
    <div class="feat-card rv d3"><h3>近所単位のクラン</h3><p>同じ通りを歩く人どうしが自然に仲間になる仕組み。ドラクエウォークのソロ冒険とは違う、ゆるい社交です。</p></div>
  </div>""",
        },
        {
            "label": "一緒に使うシーン",
            "title": "<em>両方</em>を開きたくなる場面",
            "body": """
    <p>すでに二つを並行して使っている方も多いです。一日のなかで、たとえばこんな使い分けができます。</p>
    <ul>
      <li><strong>朝の散歩。</strong>ドラクエウォークでクエストを進めつつ、MapRaidersで自分の陣地が無事か確認する。</li>
      <li><strong>通勤・通学。</strong>駅から職場までの道で、両方をバックグラウンドで動かしておく。</li>
      <li><strong>週末の街歩き。</strong>ドラクエウォークのみちびきの石と、MapRaidersのエコーを同時に探す。</li>
      <li><strong>家族との外出。</strong>お子さんにはMapRaidersの宝探し的な楽しみ方、大人はドラクエウォークの冒険、と分担する。</li>
    </ul>
            """,
        },
        {
            "label": "比較表",
            "title": "ドラクエウォーク × MapRaiders<em>比較表</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>観点</th><th>ドラクエウォーク</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">ジャンル</td><td>位置情報JRPG</td><td>位置情報MMO（陣取り）</td></tr>
      <tr><td class="feat-name">プレイスタイル</td><td>ソロ冒険、職業育成</td><td>マルチ、陣地保有</td></tr>
      <tr><td class="feat-name">課金</td><td>ふくびきガチャ、季節パス</td><td>ゲームプレイ無料、コスメ任意</td></tr>
      <tr><td class="feat-name">AR</td><td>任意</td><td>不要</td></tr>
      <tr><td class="feat-name">クラン要素</td><td>限定的</td><td>近所単位で自然に形成</td></tr>
      <tr><td class="feat-name">併用</td><td colspan="2" class="check">✓ 一緒に使うと役割が分かれて快適</td></tr>
    </tbody>
  </table>""",
        },
    ],
    "faq": [
        {"q": "MapRaidersはドラクエウォークの代わりですか？",
         "a": "代わりではなく、別の役割を担当するアプリと考えてもらうのが近いです。ドラクエウォークは旅と冒険、MapRaidersは陣取りと土地の保有。両方を一緒に動かしている方も多いです。"},
        {"q": "ドラクエウォークと同時に動かせますか？",
         "a": "両方ともバックグラウンドで動くように作られています。歩いている間にドラクエウォークでクエストを進めつつ、MapRaidersで陣地を確保する、という使い方が可能です。"},
        {"q": "MapRaidersにJRPG要素はありますか？",
         "a": "JRPGの戦闘や職業システムはありません。その代わり、防衛ミニゲーム、近所単位のクラン、エコー機能といったMMO的な要素があります。ジャンルが違うアプリ、と考えてもらえればわかりやすいと思います。"},
        {"q": "ガチャはありますか？",
         "a": "ガチャ要素はありません。コスメティック・アイテムは¥250〜¥1,200の固定価格で、購入しても見た目だけが変わります。"},
        {"q": "両方を起動して電池は持ちますか？",
         "a": "MapRaidersはAR非搭載でGPSだけを使うので、AR中心のアプリと比べると電池の減りは穏やかです。ドラクエウォーク（ARは任意）と同時に動かしても、ARを多用する場合よりは電池が残りやすい構成です。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/ポケモンGO-代わり-無料.html", "ポケモンGO 代わり 無料"),
        ("/ja/ドラクエウォーク-似てる-レビュー.html", "ドラクエウォーク似てる：レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K5 = {
    "slug": "/ja/散歩ゲーム.html",
    "breadcrumb": "散歩ゲーム",
    "title": "散歩ゲーム：歩くたびに陣地が広がるアプリ",
    "og_title": "散歩ゲーム：歩くたびに陣地が広がる",
    "meta": "散歩を楽しくするゲームアプリ。MapRaidersは歩いた道がそのまま陣地として残るGPS MMOです。健康、犬の散歩、街歩きに。",
    "keywords": "散歩ゲーム, 散歩 アプリ, 歩く ゲーム, 健康, ウォーキング, 犬の散歩",
    "badge": "散歩ゲーム",
    "pricing_pill": "ゲームプレイ無料、毎日の散歩のお供に",
    "h1_html": '散歩ゲーム：歩くたびに<em>領地が広がる</em>',
    "lead": "毎日の散歩がただの運動になっていませんか。MapRaidersは、歩いた通りがそのまま自分の陣地として残る散歩ゲームです。健康のための歩き、犬の散歩、街歩き。それぞれの一歩に少しだけ意味が加わります。広告なし、ガチャなし、ARも不要です。",
    "trigger": {
        "quote": "毎朝走るルートに、守りたいものができました。",
        "author": "Vivian N.（ハンブルク地域、クローズドベータ）"
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "なぜ今注目される？",
            "title": "散歩ゲームが<em>2026年に注目される理由</em>",
            "body": """
    <p>2024年以降、健康への関心の高まりと一緒に、ゲーム要素を取り入れた散歩アプリが少しずつ伸びています。ただ歩くより、ゲーム要素があるほうが続きやすい、という研究は以前から知られているところです。</p>
    <p>散歩ゲームが効くポイントは、おおむね次のあたりだと思います。</p>
    <ul>
      <li><strong>続けやすさ。</strong>「もう少し歩きたい」と思える理由ができる。</li>
      <li><strong>習慣化。</strong>毎日のルートを開くのが楽しみになる。</li>
      <li><strong>つながり。</strong>近所の人と自然な距離で関わるきっかけになる。</li>
    </ul>
            """,
        },
        {
            "label": "散歩が変わる",
            "title": "MapRaidersで散歩が<em>少し変わる場面</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>陣取り</h3><p>歩いた通りがそのまま陣地になります。毎日の散歩が「自分の領地を広げる時間」になります。</p></div>
    <div class="feat-card rv d1"><h3>エコー</h3><p>気に入った場所に音声や写真を置いておけます。次にそこを通った人にとっての、ささやかな贈り物。</p></div>
    <div class="feat-card rv d2"><h3>クラン防衛</h3><p>近所の人と一緒に陣地を守ることができます。ひとりで歩くより、仲間がいる方が続きやすいものです。</p></div>
    <div class="feat-card rv d3"><h3>減衰</h3><p>放置すると陣地が少しずつ縮みます。毎日少しずつ歩く理由になり、生活のリズムにも自然に乗ります。</p></div>
  </div>""",
        },
        {
            "label": "誰に向くか",
            "title": "シニア、大人、親子、それぞれの<em>関わり方</em>",
            "body": "<p>MapRaidersは年代を選びません。それぞれの生活の中での関わり方を並べてみます。</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>シニア向け</h3><p>毎日の散歩が、町内の地図に自分の足跡を残していく時間になります。健康と、ささやかな達成感が同居します。</p></div>
    <div class="feat-card rv d1"><h3>大人向け</h3><p>通勤の行き帰りや、お昼休みの散歩で、軽く開いて陣地を確認する程度の付き合い方ができます。</p></div>
    <div class="feat-card rv d2"><h3>親子向け</h3><p>お子さんと一緒に「家の周りを陣地にしよう」と話しながら歩く、ゲーム的な散歩になります。</p></div>
    <div class="feat-card rv d3"><h3>犬の飼い主向け</h3><p>犬の散歩の日課が、自然と陣地の確認やエコーを探す時間に変わっていきます。</p></div>
  </div>""",
        },
        {
            "label": "電池の話",
            "title": "<em>電池が長く持つ</em>理由",
            "body": """
    <p>長めの散歩だと、電池の残量が気になることがあります。MapRaidersは地図とGPSだけで動き、ARカメラを使わないので、AR中心の位置情報ゲームと比べると<strong>電池の持ちはおおむね4倍ほど</strong>長くなります。1〜2時間の散歩でも、最後まで安心して使える程度です。</p>
    <p>クローズドベータの実測では、4,000mAh前後のスマートフォンで、2時間の散歩中の電池消費は8〜12%程度でした。</p>
            """,
        },
    ],
    "faq": [
        {"q": "毎日どれくらい歩けば楽しめますか？",
         "a": "30分ほどの散歩でも、ある程度は陣地を広げられます。もう少し長く歩く方は、それに比例して領地も広くなります。1日5,000歩以上歩いている方とは特に相性が良いです。"},
        {"q": "犬の散歩でも使えますか？",
         "a": "犬の散歩との相性はとても良いです。クローズドベータでも、飼い主の方から「散歩が少し楽しみになった」という声をいただいています。"},
        {"q": "電池はどれくらい持ちますか？",
         "a": "地図とGPSだけで動くので、AR中心のアプリと比べて電池の減りは緩やかです。一般的なスマートフォンで、2時間の散歩でだいたい8〜12%程度の消費です。"},
        {"q": "シニアでも使いやすいですか？",
         "a": "操作は地図といくつかのボタンだけで、シンプルにまとめています。毎日の散歩を楽しまれているご年配の方にも、無理なく使える設計です。"},
        {"q": "雨の日はどうしますか？",
         "a": "雨の日は無理せず休んで大丈夫です。陣地は数日くらいでは大きく減衰しません。長く休む予定があるときは、クランに参加しておくと陣地が守られやすくなります。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/課金不要-位置情報ゲーム.html", "課金不要の位置情報ゲーム"),
        ("/ja/散歩ゲーム-レビュー.html", "散歩ゲーム：レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K6 = {
    "slug": "/ja/宝探しアプリ.html",
    "breadcrumb": "宝探しアプリ",
    "title": "宝探しアプリ：街全体がそのまま宝探し場に",
    "og_title": "宝探しアプリ：街全体が遊び場",
    "meta": "宝探しアプリをお探しの方へ。MapRaidersは街全体がそのまま宝探しの場になるGPS MMO。家族、友人、犬との散歩のお供に。",
    "keywords": "宝探しアプリ, 宝探し ゲーム, スカベンジャーハント, 街歩き, 家族, GPS",
    "badge": "宝探しアプリ",
    "pricing_pill": "ゲームプレイ無料、街がそのまま遊び場",
    "h1_html": '宝探しアプリ：街全体が<em>遊び場</em>',
    "lead": "宝探しアプリというと、特定のスポットを順に巡るタイプを思い浮かべるかもしれません。MapRaidersは少し違っていて、街のあちこちに他のプレイヤーが残した「エコー」があり、歩いているうちに自然に出会えます。家族で、友人と、あるいは犬と一緒に。街そのものが、その日その時にしかない宝探しの場所になります。",
    "trigger": {
        "quote": "街全体が、ゆるい宝探しになる感じです。",
        "author": "Aljoscha P.（ベルリン地域、クローズドベータ）"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "今どきの宝探しアプリ",
            "title": "今の宝探しアプリに求められる<em>条件</em>",
            "body": """
    <p>2026年の宝探しアプリに期待される条件は、昔とはずいぶん変わってきました。</p>
    <ul>
      <li><strong>ライブ性。</strong>事前にコース設定をしなくても、すでに街に宝が散らばっている。</li>
      <li><strong>共同性。</strong>他のプレイヤーが残したものを見つける、共同で作っていく楽しみ。</li>
      <li><strong>気軽さ。</strong>コース購入や課金がなくても、自分の街がそのまま遊び場になる。</li>
    </ul>
    <p>MapRaidersは、このあたりをカバーするタイプの宝探しアプリです。</p>
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
    <p>エコーは、プレイヤーがその場所に置いていける音声・写真・動画のメモです。次にそこを通りかかった人が見つけられる仕組みで、街のあちこちに小さな物語が残ります。</p>
    <ul>
      <li><strong>音声エコー。</strong>「ここの桜がきれい」「この坂を上がると景色がいい」のような、一言メッセージ。</li>
      <li><strong>写真エコー。</strong>季節の風景、面白い看板、知る人ぞ知るお店の写真など。</li>
      <li><strong>動画エコー。</strong>短い動画でその場所の雰囲気を伝える。</li>
    </ul>
    <p>これらが街じゅうに散らばっていて、散歩の途中でひょっこり見つかる、というのが基本の流れです。</p>
            """,
        },
        {
            "label": "家族向け",
            "title": "<em>家族</em>での使い方",
            "body": "<p>MapRaidersは家族のお出かけとも相性が良いです。</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>子供と一緒に</h3><p>「次の通りには何があるかな」とゲーム感覚で歩けます。画面の中ではなく、本物の街を探検する時間です。</p></div>
    <div class="feat-card rv d1"><h3>祖父母と</h3><p>操作はシンプルなので、ご年配の方でも無理がありません。お孫さんと「うちの周りを陣地にしよう」と歩けます。</p></div>
    <div class="feat-card rv d2"><h3>犬と一緒に</h3><p>犬の散歩がそのまま家族の時間に。お子さんが一緒に歩きたがる理由にもなります。</p></div>
    <div class="feat-card rv d3"><h3>個人情報保護法対応</h3><p>日本の個人情報保護法（APPI）に沿った設計で、お子さまのデータも丁寧に扱います。</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "宝探しアプリと普通の位置情報ゲームの違いは？",
         "a": "宝探しアプリは「発見」がメインの楽しみです。MapRaidersは陣取りゲームでもありますが、街じゅうに他のプレイヤーのエコーが散らばっているので、結果として宝探しとしても遊べます。両方の楽しみが同居しています。"},
        {"q": "コースを購入する必要はありますか？",
         "a": "コース購入は必要ありません。すでに街のあちこちにエコーが置かれていて、歩くと自然に出会えます。"},
        {"q": "子供と一緒に使えますか？",
         "a": "家族の散歩との相性は良いです。お子さんが使う場合は、保護者の方が一緒に確認しながらお使いいただくことをおすすめします。日本の個人情報保護法（APPI）に沿った設計です。"},
        {"q": "エコーは誰でも残せますか？",
         "a": "プレイヤーであれば誰でも残せます。不適切な内容については他のプレイヤーから通報でき、運営側で確認のうえ対応します。"},
        {"q": "犬と一緒に楽しめますか？",
         "a": "犬の散歩との相性はとても良いです。いつもの散歩のなかで、新しい場所のエコーに出会う楽しみが加わります。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/散歩ゲーム.html", "散歩ゲーム"),
        ("/ja/宝探しアプリ-レビュー.html", "宝探しアプリ：レビュー"),
        ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
    ],
}

K7 = {
    "slug": "/ja/課金不要-位置情報ゲーム.html",
    "breadcrumb": "課金不要 位置情報ゲーム",
    "title": "課金不要の位置情報ゲーム：全機能を無料で",
    "og_title": "課金不要の位置情報ゲーム：全機能を無料で",
    "meta": "課金不要の位置情報ゲームをお探しの方へ。MapRaidersはガチャなし、広告なし。ゲームプレイは無料で、コスメだけが任意購入です。",
    "keywords": "課金不要 位置情報ゲーム, 無料 位置情報ゲーム, ガチャなし, 広告なし, P2W なし",
    "badge": "課金不要",
    "pricing_pill": "ゲームプレイ無料、ガチャなし",
    "h1_html": '課金不要の位置情報ゲーム：全機能を<em>無料で</em>',
    "lead": "課金しなくても全機能が遊べる位置情報ゲームをお探しの方へ。MapRaidersは陣地、エコー、クエスト、クラン、防衛ミニゲーム、季節イベントまで、ゲームプレイの部分はすべて無料で開いています。コスメティック・アイテムは任意で、買ってもゲーム上の有利不利には影響しません。",
    "trigger": {
        "quote": "課金しなくても、ぜんぶの遊び方ができます。",
        "author": "MapRaidersのコンセプト"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "課金疲れ",
            "title": "日本のプレイヤーが感じる<em>課金疲れ</em>",
            "body": """
    <p>位置情報ゲームに限らず、スマホゲーム全体で「課金しないと先に進めない」「ガチャでつい使いすぎてしまった」という声をよく聞きます。楽しみのはずが、課金の存在感が大きくなるにつれて少しずつ薄れていく、ということもあります。</p>
    <p>2024年の調査では、位置情報ゲームを楽しんでいる方のおよそ6割が「できれば無課金で続けたい」と答えていますが、実際の運用では次のような場面に出くわします。</p>
    <ul>
      <li><strong>シーズンパス</strong>を逃すと、その特典が後から取り戻せない。</li>
      <li><strong>ガチャ</strong>で限定キャラを引けないと、特定の進行が止まる。</li>
      <li><strong>リモートパス</strong>で移動を補わないと、イベントに参加しづらい。</li>
    </ul>
    <p>こうした空気感から少し離れて、自分のペースで遊べる位置情報ゲームを探している方は増えてきている印象です。</p>
            """,
        },
        {
            "label": "MapRaidersの「無料」",
            "title": "MapRaidersでいう<em>「無料」</em>",
            "body": "<p>誤解のないように、料金体系は最初から並べておきます。</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>ティア</th><th>内容</th><th>価格（10%消費税込）</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>陣地、エコー、クエスト、クラン、防衛ミニゲーム、季節イベント、すべて</td><td>¥0</td></tr>
      <tr><td class="feat-name">コスメティックIAP</td><td>マーカー、陣地カラー、クラン紋章、スキン</td><td>¥250〜¥1,200</td></tr>
      <tr><td class="feat-name">サポーター（月額）</td><td>名誉バッジ、ファウンダーレター、月替わりコスメ</td><td>¥600／月</td></tr>
      <tr><td class="feat-name">ライフタイム</td><td>コレクター・コスメ、クレジット表記</td><td>¥14,800（一回限り）</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "ガチャなし",
            "title": "<em>ガチャなし</em>でいきます",
            "body": """
    <p>MapRaidersには<strong>ガチャ要素は入っていません</strong>。ランダム性で課金を促す仕組みは、設計の段階で意図的に外しました。コスメティックはすべて固定価格で、欲しいものを直接買うかたちです。</p>
    <p>これは作り手側のスタンスでもあります。遊びの中身は、運の良し悪しではなく、その日の判断や歩き方で決まるほうが健康的だと考えています。</p>
            """,
        },
        {
            "label": "コスメの透明性",
            "title": "コスメティック・アイテムの<em>透明性</em>",
            "body": """
    <p>MapRaidersのコスメティックは、次のような扱いにしています。</p>
    <ul>
      <li><strong>固定価格。</strong>¥250、¥500、¥800、¥1,200の4ティアで、いずれも10%消費税込み。</li>
      <li><strong>ゲーム上の有利不利なし。</strong>陣地の強度、攻撃力、防衛力には影響しません。見た目だけです。</li>
      <li><strong>買い切り。</strong>一度購入すれば、ずっと自分のものとして残ります。期間制限はありません。</li>
      <li><strong>返金対応。</strong>Google Playの払い戻しポリシーに沿って対応します。</li>
    </ul>
    <p>支払い方法は、Apple Pay、PayPay、LINE Pay、楽天ペイ、メルペイなど、日本で広く使われている手段に順次対応予定です。</p>
            """,
        },
    ],
    "faq": [
        {"q": "本当に課金不要で全機能を遊べますか？",
         "a": "陣地占領、エコー作成、クエスト、クラン、防衛ミニゲーム、季節イベントまで、すべて無料で遊べます。コスメティックを買った方と、まったく買わない方の間で、ゲーム上の有利不利は付きません。"},
        {"q": "ガチャはありますか？",
         "a": "ガチャは入っていません。コスメティックは固定価格で、欲しいものを直接買う方式です。ランダム性で課金を煽るような設計は意識的に避けています。"},
        {"q": "広告は表示されますか？",
         "a": "アプリ内では広告を出していません。ゲーム画面でも、UIでも、広告が表示されることはありません。"},
        {"q": "コスメティック・アイテムを買うとゲームが有利になりますか？",
         "a": "なりません。コスメティックは見た目だけが変わります。陣地の強度、攻撃力、防衛力には影響しません。いわゆる「Pay-to-Win」要素はありません。"},
        {"q": "サブスクは強制ですか？",
         "a": "強制ではありません。MapRaidersサポーター（¥600／月）は、運営を支援したい方向けの任意のオプションです。サブスクに入らなくても、機能はすべて遊べます。"},
    ],
    "internal_links": [
        ("/ja/陣取りゲーム.html", "陣取りゲーム"),
        ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
        ("/ja/ポケモンGO-代わり-無料.html", "ポケモンGO 代わり 無料"),
        ("/ja/課金不要-位置情報ゲーム-レビュー.html", "課金不要：レビュー"),
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
        "title": "陣取りゲーム レビュー：ベータテスター3名の声",
        "og_title": "陣取りゲーム レビュー：クローズドベータの感想",
        "meta": "陣取りゲームのレビュー。3名のベータテスターが、土地を取り合うMapRaidersでの体験を語ります。原文ドイツ語、translationOfWorkで明示。",
        "keywords": "陣取りゲーム レビュー, 陣取りゲーム 体験談, MapRaiders レビュー",
        "h1_html": '陣取りゲーム：<em>ベータテスターの声</em>',
        "lead": "本物の土地を取り合う体験は、実際どんな感じか。3名のクローズドベータ参加者が、はじめて自分の通りを陣地にした瞬間、減衰で削られた朝、防衛ミニゲームをはじめてプレイした時の感覚を、それぞれの言葉で振り返ります。",
        "intro_label": "テストの観点",
        "intro_title": "陣取りゲームの<em>体験軸</em>",
        "intro_body": """
    <p>陣取りゲームのテストでは、いくつかの軸を意識しています。</p>
    <ul>
      <li><strong>占領。</strong>「自分の通りが自分の領地になった」と感じるのは、どのタイミングか。</li>
      <li><strong>喪失。</strong>減衰や、攻撃者に奪われた瞬間を、どう受け止めたか。</li>
      <li><strong>防衛。</strong>防衛ミニゲームは、戦略的に感じたか、公正に感じたか、それともストレスだったか。</li>
    </ul>
    <p>3名のテスターのコメントは、それぞれ違う角度からこの軸をカバーしています。</p>
        """,
        "internal_links": [
            ("/ja/陣取りゲーム.html", "陣取りゲーム"),
            ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
            ("/ja/位置情報ゲーム-レビュー.html", "位置情報ゲーム：レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/位置情報ゲーム-レビュー.html",
        "breadcrumb": "位置情報ゲーム レビュー",
        "title": "位置情報ゲーム レビュー：MapRaidersの実体験",
        "og_title": "位置情報ゲーム レビュー：クローズドベータの声",
        "meta": "位置情報ゲームのレビュー。MapRaidersのクローズドベータ参加者3名が、ドイツの3都市での実体験を語ります。",
        "keywords": "位置情報ゲーム レビュー, 位置ゲー 体験談, MapRaiders 評価",
        "h1_html": '位置情報ゲーム：<em>3都市での実体験</em>',
        "lead": "位置情報ゲームの体感は、住んでいる場所のプレイヤー密度に意外と左右されます。シュトゥットガルト、ハンブルク、ベルリンの3名のテスターが、それぞれの街で感じたことを率直に語ってくれました。",
        "intro_label": "3都市、3つのスタイル",
        "intro_title": "<em>位置情報ゲーム</em>は街によってどう変わる？",
        "intro_body": """
    <p>位置情報ゲームの楽しさは、その地域のプレイヤー密度や生活パターンによって少しずつ変わります。今回の3名のテスターは、それぞれ違う都市プロファイルをカバーしています。</p>
    <ul>
      <li><strong>ベルリン（Aljoscha P.）</strong>：街歩きをする人が多く、エコーも多めで、地区をまたぐ動きが出やすい。</li>
      <li><strong>ハンブルク（Vivian N.）</strong>：アルスター湖の周辺にジョガーが多く、心肺機能を意識した使い方が中心。</li>
      <li><strong>シュトゥットガルト（Ron C.）</strong>：犬の飼い主が中心で、近所単位の落ち着いたリズム。</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
            ("/ja/陣取りゲーム.html", "陣取りゲーム"),
            ("/ja/陣取りゲーム-レビュー.html", "陣取りゲーム：レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/ポケモンGO-代わり-レビュー.html",
        "breadcrumb": "ポケモンGO 代わり レビュー",
        "title": "ポケモンGOの代わりに、レビュー：併用テスト",
        "og_title": "ポケモンGOの代わりに、レビュー",
        "meta": "ポケモンGOの代わりに、というテーマでのレビュー。3名のベータテスターが、ポケモンGOとMapRaidersを併用した体験を語ります。",
        "keywords": "ポケモンGO 代わり レビュー, ポケモンGO 比較, 併用",
        "h1_html": 'ポケモンGOの代わりに：<em>併用テスト</em>',
        "lead": "ポケモンGOを続けながら、MapRaidersも一緒に使ってみるとどうなるか。3名のクローズドベータ参加者が、両方のアプリを並行して使った体験を率直に話してくれました。",
        "intro_label": "併用テスト",
        "intro_title": "<em>2つのアプリ</em>を一緒に使うと？",
        "intro_body": """
    <p>ポケモンGOを続けながらMapRaidersも試しているプレイヤーは少なくありません。テスターたちが意識したのは、おおむね次のあたりでした。</p>
    <ul>
      <li><strong>電池への影響。</strong>両方を立ち上げていて、現実的に持つかどうか。</li>
      <li><strong>使い分け。</strong>朝に向くのはどちらで、夕方にはどちらが合うか。</li>
      <li><strong>続けやすさ。</strong>2つあることで忙しくなりすぎないか。</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/ポケモンGO-代わり-無料.html", "ポケモンGO 代わり 無料"),
            ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
            ("/ja/ドラクエウォーク-似てる-レビュー.html", "ドラクエウォーク似てる：レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/ドラクエウォーク-似てる-レビュー.html",
        "breadcrumb": "ドラクエウォーク 似てる レビュー",
        "title": "ドラクエウォーク 似てる レビュー：併用テスト",
        "og_title": "ドラクエウォーク 似てる レビュー",
        "meta": "ドラクエウォークが好きな方に向けたMapRaidersのレビュー。両アプリを併用した体験を、3名のテスターが語ります。",
        "keywords": "ドラクエウォーク 似てる レビュー, ドラクエウォーク 比較, 補完",
        "h1_html": 'ドラクエウォーク × MapRaiders：<em>併用テスト</em>',
        "lead": "ドラクエウォークを続けながら、MapRaidersも一緒に楽しめるか。3名のテスターが、両方のアプリを使ってみた感想を語ります。",
        "intro_label": "補完アプリとして",
        "intro_title": "<em>ドラクエウォークとの相性</em>",
        "intro_body": """
    <p>ドラクエウォークの代わりではなく、隣で動かすアプリとしてのMapRaidersを評価しました。観点はおおむねこの3点です。</p>
    <ul>
      <li><strong>使い分けの自然さ。</strong>同じ散歩のなかで、両方を無理なく開けるかどうか。</li>
      <li><strong>体験の重なり。</strong>JRPG要素と陣取り要素が頭の中でぶつからないか。</li>
      <li><strong>時間配分。</strong>2つあることで、どちらかが疎かにならないか。</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/ドラクエウォーク-似てる.html", "ドラクエウォーク 似てる"),
            ("/ja/陣取りゲーム.html", "陣取りゲーム"),
            ("/ja/位置情報ゲーム-レビュー.html", "位置情報ゲーム：レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/散歩ゲーム-レビュー.html",
        "breadcrumb": "散歩ゲーム レビュー",
        "title": "散歩ゲーム レビュー：散歩派テスター3名の声",
        "og_title": "散歩ゲーム レビュー：健康と、ささやかな楽しみ",
        "meta": "散歩ゲームのレビュー。3名のベータテスターが、毎日の散歩がどう変わったかを語ります。健康、犬の散歩、ジョギング。",
        "keywords": "散歩ゲーム レビュー, 散歩 アプリ 体験談, ウォーキング ゲーム 評価",
        "h1_html": '散歩ゲーム：<em>毎日の散歩</em>がどう変わるか',
        "lead": "毎日の散歩にゲーム要素が乗ると、何が変わるのか。3名のテスターが、犬の散歩、ジョギング、街歩きそれぞれの目線で振り返ります。",
        "intro_label": "散歩スタイル",
        "intro_title": "3つの<em>散歩スタイル</em>",
        "intro_body": """
    <p>散歩ゲームの相性は、ふだんの歩き方によって変わります。今回の3名は、それぞれ違うスタイルを担当しています。</p>
    <ul>
      <li><strong>Ron C.（犬の散歩）</strong>：毎日ほぼ同じ時間に、同じルートを歩く生活リズム。</li>
      <li><strong>Vivian N.（ジョギング）</strong>：朝のランニングを中心とした、心肺機能寄りの使い方。</li>
      <li><strong>Aljoscha P.（街歩き）</strong>：新しい場所を見つけたいときに歩く、不規則なパターン。</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/散歩ゲーム.html", "散歩ゲーム"),
            ("/ja/陣取りゲーム.html", "陣取りゲーム"),
            ("/ja/宝探しアプリ-レビュー.html", "宝探しアプリ：レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/宝探しアプリ-レビュー.html",
        "breadcrumb": "宝探しアプリ レビュー",
        "title": "宝探しアプリ レビュー：エコー機能の体験",
        "og_title": "宝探しアプリ レビュー：エコー機能",
        "meta": "宝探しアプリのレビュー。エコー機能を中心に、3名のベータテスターがMapRaidersでの体験を語ります。",
        "keywords": "宝探しアプリ レビュー, スカベンジャーハント 体験談, エコー機能",
        "h1_html": '宝探しアプリ：<em>エコー機能の体験</em>',
        "lead": "MapRaidersのエコー機能は、結果として街全体を宝探しの場所に変えていきます。3名のテスターが、エコーを置く側、見つける側それぞれの感覚を率直に話してくれました。",
        "intro_label": "エコーテスト",
        "intro_title": "<em>エコー機能</em>の体験軸",
        "intro_body": """
    <p>エコー機能のテストでは、次のような軸で見ています。</p>
    <ul>
      <li><strong>残しやすさ。</strong>音声、写真、動画のエコー作成が、直感的にできるかどうか。</li>
      <li><strong>発見の感覚。</strong>他の人のエコーを見つけた瞬間に、何を感じるか。</li>
      <li><strong>家族での使い心地。</strong>お子さんと一緒に楽しめるかどうか。</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/宝探しアプリ.html", "宝探しアプリ"),
            ("/ja/散歩ゲーム.html", "散歩ゲーム"),
            ("/ja/散歩ゲーム-レビュー.html", "散歩ゲーム：レビュー"),
            ("/ja/MapRaiders-レビュー.html", "MapRaidersのすべてのレビュー"),
        ],
    },
    {
        "slug": "/ja/課金不要-位置情報ゲーム-レビュー.html",
        "breadcrumb": "課金不要 位置情報ゲーム レビュー",
        "title": "課金不要の位置情報ゲーム レビュー：実際のところ",
        "og_title": "課金不要の位置情報ゲーム レビュー",
        "meta": "課金不要の位置情報ゲームのレビュー。本当に無料でゲームプレイが完結するのか、3名のベータテスターがコスメを買わずに遊んだ感想を語ります。",
        "keywords": "課金不要 位置情報ゲーム レビュー, 無料 評価, ガチャなし",
        "h1_html": '課金不要の位置情報ゲーム：<em>実際のところ</em>',
        "lead": "課金との距離をとりたい方が、本当に無料で全機能を楽しめるのか。3名のテスターが、コスメティックを買わずに数週間プレイした感想を語ります。",
        "intro_label": "無料テスト",
        "intro_title": "<em>本当に無料</em>か、確かめる",
        "intro_body": """
    <p>「無料」とうたいつつも、実際に遊んでみると課金圧を感じるアプリは多いものです。MapRaidersでは、特に次のあたりを確かめてもらいました。</p>
    <ul>
      <li><strong>ゲームプレイ。</strong>陣地、エコー、クエストといったコア機能が、無課金のままで成立しているか。</li>
      <li><strong>進行差。</strong>コスメを買った方と買わない方のあいだで、進行に差が出ないか。</li>
      <li><strong>イベント。</strong>季節イベントは無課金でも楽しめるか。</li>
    </ul>
        """,
        "internal_links": [
            ("/ja/課金不要-位置情報ゲーム.html", "課金不要 位置情報ゲーム"),
            ("/ja/位置情報ゲーム.html", "位置情報ゲームおすすめ2026"),
            ("/ja/ポケモンGO-代わり-レビュー.html", "ポケモンGO代わり：レビュー"),
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
    "title": "MapRaiders レビュー：全体一覧とベータテスト",
    "og_title": "MapRaiders レビュー：すべてを一覧で",
    "meta": "MapRaidersレビュー：5.0/5（3名の検証済みベータレビュー）、ファウンダー・ステートメント、全Killerページとレビューを一元化。",
    "keywords": "MapRaiders レビュー, MapRaiders 評価, MapRaiders 体験談, GPS MMO 評価",
    "badge": "全体ハブ",
    "pricing_pill": "5.0／5：3名のベータテスター",
    "h1_html": '<em>MapRaidersレビュー</em>：GPS MMOの全体像から',
    "lead": "シュトゥットガルト、ハンブルク、ベルリンの3名のベータテスター。ポケモンGOの代わりから宝探しアプリまで、7つのテーマ別ページと、それぞれに対応する7つのレビュー。すべてここから読めます。",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "MapRaidersとは何ですか？",
         "a": "MapRaidersはAndroid向けのGPS MMOです。実際に歩くことで陣地を占領し、エコーを残し、クエストを作り、ミニゲームで領地を守る、というゲームです。広告なし、ガチャなし、AR不要です。"},
        {"q": "ベータテスターは何名ですか？",
         "a": "現在公開しているのは3名で、本人の同意のもと、プライバシー上の理由から名前とイニシャルで紹介しています。クローズドベータ全体はもう少し人数がいますが、3名はそれぞれ代表的なペルソナを担当しています。"},
        {"q": "レビューは本物ですか？",
         "a": "本物です。3名のテスターはクローズドベータの実在の参加者で、報酬は受け取っていません。コメントは原文ドイツ語で書かれ、Schema.orgマークアップで日付と言語が明示されています。"},
        {"q": "ベータテスターになれますか？",
         "a": "トップページのメールフォームから登録してください。空き状況に応じて段階的に枠を広げています。プレイヤー密度が低い地域の方には、優先的にご案内しています。"},
        {"q": "正式版はいつですか？",
         "a": "現在はGoogle Playでクローズドベータとして提供しています。正式版は2026年内、iOS版は2026年の第3四半期を目安に準備を進めています。"},
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

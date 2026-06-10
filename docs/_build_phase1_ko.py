#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 2 - KO Killer-URL Builder
Generates 15 KO pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_KO_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_ko.py
Idempotent: overwrites existing files.
"""

import json
from pathlib import Path

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

DOCS = Path(__file__).resolve().parent
SITE = "https://mapraiders.com"
LANG = "ko"
LOCALE_PREFIX = "/ko"

# Hreflang map - points to localized landings; KO killer uses native UTF-8 slug
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
# REUSABLE BLOCKS - KO TESTERS (translations of DE originals)
# -----------------------------------------------------------------------------

TESTER_RON = {
    "name": "Ron C.",
    "role": "강아지 보호자 · 슈투트가르트 권역",
    "role_long": "슈투트가르트 권역의 강아지 보호자 (비공개 베타)",
    "quote": "강아지는 어차피 하루에 두 번 나가야 해서, 그 김에 앱을 켭니다. 좀 우습게 들리겠지만, 매일 저녁 우리 블록이 아직 파란색인지 한 번씩 확인하게 되네요.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "러너 · 함부르크 권역",
    "role_long": "함부르크 권역의 러너 (비공개 베타)",
    "quote": "원래도 매일 아침 뛰는데, 이제는 뭔가를 지키면서 뛰게 됐습니다. 알스터 호수 코스는 제 거고, 앞으로도 그래야 합니다. 이상하게 갑자기 규칙적으로 뛰게 되네요.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "도시 탐험가 · 베를린 권역",
    "role_long": "베를린 권역의 도시 탐험가 (비공개 베타)",
    "quote": "어떤 건물 입구에 짧은 음성을 남겼는데, 사흘 뒤에 모르는 사람이 그걸 들었더라구요. 게임치고는 묘하게 사적인 느낌입니다.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "저는 포켓몬고를 3년 동안 했고, 어느 날 그만뒀습니다. 그동안 기다렸던 것은 끝내 오지 않았어요. "
    "잠깐 떴다 사라지는 체육관이 아니라 진짜 영토 말입니다. 2025년에 사우디 인수 소식이 나왔을 때, "
    "Niantic이 가는 방향은 제가 원하는 방향이 아니라는 게 분명해졌습니다. 그래서 MapRaiders를 직접 만들고 있습니다. "
    "광고 없이, 투자자 압박 없이, 강제 구독 없이. 제 동네가 제 영역이고, 여러분의 동네는 여러분이 가져가시면 됩니다."
)

# Pricing offers (Master-Plan §1.1) - KRW
PRICING_OFFERS = [
    {"name": "Free Forever", "price": "0", "currency": "KRW"},
    {"name": "코스메틱 IAP (시작가)", "price": "2500", "currency": "KRW"},
    {"name": "MapRaiders 후원자 (구독)", "price": "5900", "currency": "KRW"},
    {"name": "평생 후원자", "price": "129000", "currency": "KRW"},
]

# DefinedTermSet - KO Brand-Vocab
DEFINED_TERMS = [
    ("영토", "플레이어 또는 클랜에 지속적으로 할당된 점령된 지도 영역"),
    ("에코", "플레이어가 위치에 남긴, 다른 플레이어가 발견할 수 있는 오디오/사진/비디오 신호"),
    ("방어 미니게임", "영토 분쟁 시 실행되는 미니게임 (틱택토, 가위바위보, 미니체스)"),
    ("퀘스트", "플레이어가 만든, 다른 플레이어가 현실 세계에서 완료할 수 있는 미니 과제"),
    ("클랜", "영토를 함께 보유하고 방어하는 자연 발생적 플레이어 그룹"),
    ("영토 쇠퇴", "방치된 영토가 시간이 지남에 따라 쇠퇴하는 메커니즘"),
]

PILL_LABEL = "비공개 베타에서"
SHARING_LABEL = "공유:"
LAUNCH_CTA = "출시 알림 받기"
FOOTER_TAGLINE = "당신의 동네, 당신의 영토."


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    out = []
    for lang, prefix in HREFLANG:
        if lang == "ko":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="ko"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">{PILL_LABEL}</div>
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
.fr-quote{{font-size:18px;line-height:1.7;color:var(--text);font-weight:500;margin-bottom:20px;font-style:italic}}
.fr-author{{font-size:14px;font-weight:700;color:var(--text)}}
.fr-role{{font-size:13px;color:var(--muted);margin-top:2px}}
.fr-stars{{color:#F5A623;font-size:14px;letter-spacing:2px;margin-bottom:14px}}
.fr-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:32px}}
.fr-grid .fr-card{{margin-bottom:0}}
@media(max-width:640px){{.fr-sec{{padding:60px 0}}.fr-card{{padding:28px}}.fr-card.founder{{flex-direction:column}}}}
</style>
<section class="fr-sec">
  <div class="mx">
    <div class="fr-label">파운더</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, MapRaiders 파운더" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">파운더, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">{PILL_LABEL}</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.7">
      참고: 테스터는 비공개 베타의 내부 참여자입니다. 본인 동의 하에 프라이버시를 위해 이름 + 이니셜만 사용합니다. 후기는 원본이 독일어로 작성됐고 한국어로 번역됐습니다.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="공유하기"><span class="mr-share__label">{SHARING_LABEL}</span><a class="mr-share__btn" href="https://story.kakao.com/share?url={enc}" target="_blank" rel="noopener noreferrer">💬 카카오스토리</a><a class="mr-share__btn" href="https://twitter.com/intent/tweet?url={enc}" target="_blank" rel="noopener noreferrer">🐦 X (Twitter)</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></div>"""


def footer_html():
    return f"""<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/ko/agb.html">이용약관</a><a href="/ko/datenschutz.html">개인정보처리방침</a><a href="/ko/impressum.html">법적 고지</a><a href="mailto:info@scafa-investments.com">문의</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders. {FOOTER_TAGLINE} Scafa Investments LLC의 제품.</p>
</div>
</footer>
<script>
(function(){{const t=localStorage.getItem('mr-theme')||'light';document.documentElement.dataset.theme=t;}})();
window.addEventListener('scroll',function(){{document.getElementById('nav').classList.toggle('scroll',scrollY>60);}});
const io=new IntersectionObserver(function(e){{e.forEach(function(x){{if(x.isIntersecting){{x.target.classList.add('on');io.unobserve(x.target);}}}});}},{{threshold:.1,rootMargin:'0px 0px -40px 0px'}});
document.querySelectorAll('.rv').forEach(function(el){{io.observe(el);}});
document.querySelectorAll('.faq-q').forEach(function(q){{q.addEventListener('click',function(){{q.parentElement.classList.toggle('open');}});}});
</script>
</body>
</html>"""


def nav_html():
    return f"""<nav class="nav" id="nav">
<div class="nav-i mx">
  <a href="/ko/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/ko/#feat" class="lnk">기능</a>
    <a href="/ko/MapRaiders-후기.html" class="lnk">후기</a>
    <div class="lang-sw">
      <button class="lsw-btn">KO <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('ko')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">곧 출시</a>
  </div>
</div>
</nav>"""


def base_css():
    return """*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:hidden}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;font-family:'Outfit','Noto Sans KR',system-ui,sans-serif}
h1,h2,h3,h4,h5,h6,p,a,span,div,blockquote,li,td,th{font-family:'Outfit','Noto Sans KR',system-ui,sans-serif}
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
.hero h1{font-size:clamp(34px,5.5vw,68px);font-weight:900;line-height:1.15;letter-spacing:-1.5px;margin-bottom:24px;word-break:keep-all}
.hero h1 em{font-style:normal;color:var(--accent)}
.hero p.lead{font-size:18px;color:var(--muted);line-height:1.85;max-width:680px;margin-bottom:32px;word-break:keep-all}
.hero .pricing-pill{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text);background:#FFE066;padding:6px 14px;border-radius:99px;margin-bottom:18px}
.trigger-quote{margin:40px 0 0;padding:24px 28px;border-left:4px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;font-style:italic;font-size:17px;line-height:1.75;color:var(--text);max-width:760px;word-break:keep-all}
.trigger-quote cite{display:block;margin-top:14px;font-style:normal;font-size:13px;color:var(--muted);font-weight:600}
.btn-p{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;padding:16px 36px;border-radius:6px;background:var(--accent);color:#fff;transition:all .25s}.btn-p:hover{transform:translateY(-2px);opacity:.9}
.sec{padding:90px 0;border-bottom:1px solid var(--border)}
.sec-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.sec-title{font-size:clamp(24px,3.6vw,40px);font-weight:800;letter-spacing:-1px;line-height:1.25;margin-bottom:24px;word-break:keep-all}
.sec-title em{font-style:normal;color:var(--accent)}
.prose p{font-size:15px;color:var(--muted);line-height:1.9;margin-bottom:20px;max-width:820px;word-break:keep-all}
.prose strong{color:var(--text);font-weight:700}
.prose ul{margin:16px 0 22px 24px;color:var(--muted);font-size:15px;line-height:1.9;max-width:820px}
.prose ul li{margin-bottom:10px;word-break:keep-all}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:36px}
.feat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:32px;transition:all .3s}
.feat-card:hover{border-color:var(--accent-b);transform:translateY(-3px)}
.feat-card h3{font-size:18px;font-weight:700;margin-bottom:12px;word-break:keep-all}
.feat-card p{font-size:14px;color:var(--muted);line-height:1.8;word-break:keep-all}
.comp-table{width:100%;border-collapse:collapse;margin-top:32px;border:1px solid var(--border);border-radius:12px;overflow:hidden;font-size:14px}
.comp-table thead{background:var(--bg-alt)}
.comp-table th{padding:16px 18px;text-align:left;font-weight:700;font-size:13px;border-bottom:1px solid var(--border)}
.comp-table td{padding:14px 18px;border-bottom:1px solid var(--border);color:var(--muted)}
.comp-table tr:last-child td{border-bottom:none}
.feat-name{color:var(--text);font-weight:600}
.check{color:#10B981;font-weight:700}.cross{color:#EF4444;font-weight:700}
.faq-list{margin-top:36px;display:flex;flex-direction:column;gap:2px}
.faq-item{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:22px 28px;cursor:pointer;font-size:16px;font-weight:600;gap:16px;word-break:keep-all}
.faq-q svg{flex-shrink:0;color:var(--accent);transition:transform .3s}
.faq-item.open .faq-q svg{transform:rotate(45deg)}
.faq-a{display:none;padding:0 28px 22px;font-size:15px;color:var(--muted);line-height:1.85;word-break:keep-all}
.faq-item.open .faq-a{display:block}
.cta-sec{padding:90px 0;text-align:center}
.cta-sec h2{font-size:clamp(26px,4.2vw,48px);font-weight:800;letter-spacing:-1.5px;margin-bottom:16px;word-break:keep-all}
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


def fonts_block():
    return """<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap">
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">"""


# -----------------------------------------------------------------------------
# SCHEMA BUILDERS
# -----------------------------------------------------------------------------

def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "홈", "item": f"{SITE}/ko/"},
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
            "inLanguage": "ko",
            "translationOfWork": {
                "@type": "Review",
                "@id": f"{SITE}/#{t['id']}",
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
            "inLanguage": "ko",
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
            "inLanguage": "ko",
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
            "jobTitle": "파운더",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-ko",
            "name": "MapRaiders 브랜드 어휘 (한국어)",
            "inLanguage": "ko",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "홈", "item": f"{SITE}/ko/"},
        {"@type": "ListItem", "position": 2, "name": "후기", "item": f"{SITE}/ko/MapRaiders-후기.html"},
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
            "inLanguage": "ko",
            "translationOfWork": {
                "@type": "Review",
                "@id": f"{SITE}/#{t['id']}",
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
            "inLanguage": "ko",
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
            "inLanguage": "ko",
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
        "name": "MapRaiders KO: 모든 후기 및 핵심 페이지",
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
  <h2 class="sec-title rv d1"><em>자주 묻는 질문</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">더 깊이 <em>탐험하기</em></h2>
  <p class="rv d1">MapRaiders 관련 주제:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">곧 Google Play에 출시 &bull; 무료 &bull; 스팸 없음</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">{LAUNCH_CTA}</a>
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
<html lang="ko" data-theme="light">
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
<meta property="og:locale" content="ko_KR">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
{fonts_block()}
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
    {LAUNCH_CTA}
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
  <div class="sec-label rv">평가</div>
  <h2 class="sec-title rv d1">5.0 / 5, <em>검증된 베타 후기 3건</em></h2>
  <div class="prose rv d2">
    <p>독일의 베타 테스터 세 명, 즉 강아지 보호자 한 명, 러너 한 명, 도시 탐험가 한 명이 몇 주에 걸쳐 MapRaiders를 일상 속에서 사용했습니다. 후기는 원본이 독일어로 작성됐고, 비공개 베타의 실제 인물입니다. 프라이버시를 위해 이름 + 이니셜만 표시합니다.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="ko" data-theme="light">
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
<meta property="og:locale" content="ko_KR">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
{fonts_block()}
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html()}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">후기</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">자세히 보기 →</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">후기 →</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">주제별 허브</div>
  <h2 class="sec-title rv d1">모든 <em>MapRaiders 주제</em>를 한눈에</h2>
  <div class="prose rv d2">
    <p>핵심 페이지 일곱 개와 후기 페이지 일곱 개가 모두 여기 모여 있습니다. 포켓몬고와의 비교, 보물찾기 앱, 영토게임, 만보기 게임까지 각각 다른 각도에서 MapRaiders를 다룹니다. 한 페이지씩 읽어도 되고, 주제 사이를 옮겨가면서 읽어도 됩니다.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">상세 후기</div>
  <h2 class="sec-title rv d1">베타 테스터의 <em>다양한 관점</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">종합 평점</div>
  <h2 class="sec-title rv d1">5.0 / 5, <em>검증된 베타 후기 3건</em></h2>
  <div class="prose rv d2">
    <p>후기는 2026년 2월부터 4월 사이의 비공개 베타에서 수집됐습니다. Ron은 슈투트가르트에서, Vivian은 함부르크에서, Aljoscha는 베를린에서 테스트했습니다. 인공적인 테스트 환경이 아니라 평소 다니던 코스에서 그대로 사용했습니다. 후기는 원본이 독일어로 작성됐고 한국어로 번역됐으며, 모두 실제 인물입니다.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="ko" data-theme="light">
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
<meta property="og:locale" content="ko_KR">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
{fonts_block()}
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html()}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">MapRaiders 허브</div>
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
# PAGE DATA - KILLERS (K1-K7)
# -----------------------------------------------------------------------------

K1 = {
    "slug": "/ko/영토게임.html",
    "breadcrumb": "영토게임",
    "title": "영토게임, 진짜 땅을 차지하는 GPS MMO",
    "og_title": "영토게임, 진짜 땅을 차지하는 GPS MMO 앱",
    "meta": "영토게임을 스마트폰에서. MapRaiders는 진짜 땅을 지속적으로 점령할 수 있는 GPS MMO입니다. 광고 없음, 무과금, AR 없음.",
    "keywords": "영토게임, 영역게임, 영토 점령 게임, GPS MMO, 위치기반게임, 땅 차지하는 게임",
    "badge": "영토게임",
    "pricing_pill": "100% 무과금. 코스메틱 ₩2,500부터.",
    "h1_html": '영토게임: <em>진짜 땅</em>을 점령하는 GPS MMO 앱',
    "lead": "영토게임은 원래 PC MMO 장르였습니다. 모바일에서는 거의 보이지 않았습니다. 검색 결과는 위키피디아와 오래된 MMO 포럼이 차지하고 있을 뿐, 실제로 작동하는 앱이 없었거든요. MapRaiders는 그 자리를 한국 모바일에 가져옵니다. 잠깐 떴다 사라지는 발자국이 아니라, 지키는 동안 계속 내 것인 영토. 광고 없음, AR 없음, 가챠 없음.",
    "trigger": {
        "quote": "원래도 매일 아침 뛰는데, 이제는 뭔가를 지키면서 뛰게 됐습니다.",
        "author": "Vivian N., 함부르크 권역의 러너 (비공개 베타)",
    },
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {
            "label": "정의",
            "title": "<em>영토게임</em>의 네 가지 메커니즘",
            "body": """
    <p><strong>영토게임</strong>은 플레이어가 지도에서 지속적으로 영역을 보유하고, 방어하고, 확장하는 게임입니다. 캡처 게임(체육관, 포털)과 달리 점유는 <strong>플레이어가 오프라인일 때도 유지</strong>됩니다.</p>
    <p>진짜 영토게임이 되려면 네 가지 메커니즘이 필요합니다:</p>
    <ul>
      <li><strong>지속성.</strong> 점령된 영역은 누군가 적극적으로 빼앗기 전까지 플레이어 또는 클랜에 그대로 할당됩니다.</li>
      <li><strong>쇠퇴(Decay).</strong> 비활성 영토는 시간이 지나면서 줄어듭니다. 활동하지 않고 땅을 영구 점유하는 건 불가능합니다.</li>
      <li><strong>방어 미니게임.</strong> 공격이 들어오면 두 플레이어가 미니게임으로 결판을 냅니다. 자동 스탯 비교가 아닙니다.</li>
      <li><strong>클랜 이전.</strong> 영토는 동료나 클랜에 양도할 수 있습니다. 거기서 경제적 깊이가 생깁니다.</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders",
            "title": "MapRaiders <em>영토 시스템</em>의 핵심",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>주장하기</h3><p>걷기, 뛰기, 자전거로 거리를 지나가세요. GPS 트레이스가 당신 이름으로 영토를 만듭니다. 지도에 다각형으로 보입니다.</p></div>
    <div class="feat-card rv d1"><h3>쇠퇴 엔진</h3><p>영토를 정기적으로 다니지 않으면 매일 몇 퍼센트씩 줄어듭니다. 결제가 아니라 활동이 땅을 지킵니다.</p></div>
    <div class="feat-card rv d2"><h3>방어 미니게임</h3><p>일곱 가지 미니게임이 공격 결과를 결정합니다. 틱택토, 가위바위보, 미니체스. 머리를 쓰는 사람이 이깁니다, 시간을 더 쏟은 사람이 아니라.</p></div>
    <div class="feat-card rv d3"><h3>클랜 영토</h3><p>여러 플레이어가 영토를 함께 보유할 수 있습니다. 클랜 영역은 더 견고해서 단일 공격자만으로는 뚫리지 않습니다.</p></div>
  </div>""",
        },
        {
            "label": "차이점",
            "title": "포켓몬고와 잉그레스가 <em>진짜 영토게임이 아닌 이유</em>",
            "body": """
    <p><strong>포켓몬고 체육관 점령</strong>은 일시적입니다. 몇 시간 동안 최고 기록을 유지하면 코인을 받지만, 영토 자체는 토지 소유라고 보기 어렵습니다. 체육관은 점이지, 영역이 아닙니다.</p>
    <p><strong>잉그레스 포털</strong>도 비슷합니다. 점을 링크로 연결해 삼각형을 만들죠. 포털 사이의 필드는 있지만 지속적인 토지 소유 개념은 없습니다. 일주일 동안 앱을 열지 않아도 "내 동네"를 잃지 않습니다. 애초에 내 것으로 할당된 적이 없으니까요.</p>
    <p>MapRaiders는 정확히 이 지점에서 시작합니다. <strong>영토 자체가 게임 자원</strong>이지, 그 위의 점이 아닙니다. 땅을 얻고, 잃고, 양도하는, 진짜 공간 게임의 방식입니다.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders의 영토 시스템은 어떻게 작동하나요?",
         "a": "거리를 직접 걸으면서 GPS 영역을 주장합니다. 이 영토는 라이브 지도에 나타나며, 다른 플레이어가 와서 도전하지 않는 한 당신 것입니다. 성공적으로 방어하면 영역이 유지됩니다."},
        {"q": "내 영토를 잃을 수도 있나요?",
         "a": "네. 영토 쇠퇴(Decay) 시스템 때문에 비활성 영역은 매일 줄어듭니다. 꾸준히 다니면 유지되고, 멈추면 잃습니다. 그래서 지도가 살아 있는 느낌이 납니다."},
        {"q": "영토 공격이 들어오면 어떻게 되나요?",
         "a": "공격자는 직접 당신의 영토까지 걸어와야 합니다. 그러면 방어자와 공격자 사이에 인터랙티브 미니게임이 시작되고, 이긴 사람이 영역의 운명을 결정합니다."},
        {"q": "클랜 영토 시스템이 있나요?",
         "a": "네. MapRaiders의 클랜은 자연스럽게 형성되며 영토를 함께 주장할 수 있습니다. 클랜 영역은 더 강해서 깨려면 공격자 여럿이 필요합니다. 팀워크가 그대로 보상으로 돌아옵니다."},
        {"q": "영토게임에 비용이 드나요?",
         "a": "아니요. 영토 관련 게임플레이는 모두 무료입니다. 마커 디자인이나 영토 색상을 바꾸는 코스메틱 아이템(₩2,500–₩12,000)이 선택사항으로 있지만, 게임 이점은 전혀 없습니다."},
    ],
    "internal_links": [
        ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
        ("/ko/산책게임.html", "산책게임: 걷는 만큼 영토가"),
        ("/ko/만보기-게임.html", "만보기 게임: 걸음이 영토가 되는 앱"),
        ("/ko/영토게임-후기.html", "영토게임 후기"),
        ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
    ],
}

K2 = {
    "slug": "/ko/위치기반게임.html",
    "breadcrumb": "위치기반게임",
    "title": "위치기반게임 추천 2026, 한국 지도가 제대로 도는 GPS",
    "og_title": "위치기반게임 추천 2026: 진짜 영토를 차지하는 7선",
    "meta": "위치기반게임 추천 7선. MapRaiders는 한국 지도가 정상 작동하는 GPS MMO입니다. 광고 없음, 무과금, AR 없음, 배터리 약 4배.",
    "keywords": "위치기반게임, 위치기반게임 추천, GPS MMO 비교, 한국 위치 게임, 포켓몬고 대안, 잉그레스",
    "badge": "위치기반게임",
    "pricing_pill": "무과금. 한국 지도 정상 작동.",
    "h1_html": '위치기반게임 추천 2026: 진짜 <em>영토</em>를 차지하는 7선',
    "lead": "위치기반게임 시장은 2017년 포켓몬고 한국 출시 이후로 성숙해졌지만, 한 가지 트라우마는 남아 있습니다. 구글 지도 데이터 문제로 출시가 1년 연기된 끝에 OpenStreetMap으로 갈아탔던 그 사건입니다. 거기에 2025년 사우디 인수까지 더해지면, 한국 사용자는 자국 지도와 데이터 주권을 진지하게 다루는 GPS 게임을 받을 자격이 있습니다. 이 추천 7선이 그 답입니다.",
    "trigger": {
        "quote": "어떤 건물 입구에 짧은 음성을 남겼는데, 사흘 뒤에 모르는 사람이 그걸 들었더라구요.",
        "author": "Aljoscha P., 베를린 권역의 도시 탐험가 (비공개 베타)",
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "한국 시장",
            "title": "한국 <em>위치기반게임</em> 시장의 현실",
            "body": """
    <p>한국은 세계 모바일 게임 시장 톱3입니다. 그런데 위치기반게임 분야는 특이한 이력을 갖고 있습니다:</p>
    <ul>
      <li><strong>2017년 구글 지도 트라우마.</strong> 포켓몬고는 한국에 1년 늦게 출시됐습니다. 구글 지도 데이터 제약 때문이었죠. Niantic은 결국 OpenStreetMap으로 전환했지만, 이 사건은 GPS 게임의 지도 데이터에 대한 한국 사용자의 신뢰에 영향을 남겼습니다.</li>
      <li><strong>2025년 3월 사우디 인수.</strong> Niantic이 게임 사업부(포켓몬고, 잉그레스, 피크민 블룸, 몬스터 헌터 나우)를 35억 달러에 Scopely에 매각했습니다. Scopely는 사우디 공공투자기금(PIF)의 자회사입니다. 한국 사용자의 위치 데이터는 이제 외국 국부 펀드를 거쳐 처리됩니다.</li>
      <li><strong>강아지 시장 포화.</strong> 펫피, 산책가자, 피리부는 강아지 등이 산책 트래커 시장을 차지했습니다. 다만 진짜 게임 메커니즘이 아니라 트래커입니다.</li>
    </ul>
            """,
        },
        {
            "label": "비교",
            "title": "위치기반게임 추천 <em>7선 비교</em>",
            "body": "<p>한국 시장에서 실제로 돌아가는 위치기반게임 7가지를 정리했습니다. 왜 MapRaiders를 1위로 두는지 표 안에서 직접 확인할 수 있습니다:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>순위</th><th>앱</th><th>제공자</th><th>광고 없음</th><th>진짜 영토</th><th>한국 지도</th></tr>
    </thead>
    <tbody>
      <tr><td class="feat-name">#1</td><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓</td><td class="check">✓ 지속적</td><td class="check">OSM 정상</td></tr>
      <tr><td class="feat-name">#2</td><td>포켓몬고</td><td>Niantic / Scopely (사우디 PIF)</td><td class="cross">✗ P2W</td><td class="cross">체육관 점령</td><td>OSM (1년 지연 후)</td></tr>
      <tr><td class="feat-name">#3</td><td>피리부는 강아지</td><td>국내 팀</td><td class="check">✓</td><td class="cross">트래커</td><td class="check">정상</td></tr>
      <tr><td class="feat-name">#4</td><td>잉그레스 프라임</td><td>Niantic / Scopely</td><td class="cross">✗</td><td class="cross">포털 + 필드</td><td>OSM</td></tr>
      <tr><td class="feat-name">#5</td><td>펫피</td><td>국내 팀</td><td class="check">✓</td><td class="cross">트래커</td><td class="check">정상</td></tr>
      <tr><td class="feat-name">#6</td><td>산책가자</td><td>국내 팀</td><td class="check">✓</td><td class="cross">트래커</td><td class="check">정상</td></tr>
      <tr><td class="feat-name">#7</td><td>Geocaching</td><td>Groundspeak (US)</td><td class="check">✓</td><td class="cross">캐시</td><td>제한적</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "차별점",
            "title": "MapRaiders가 <em>한국에서 다른 이유</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>한국 지도 정상 작동</h3><p>OpenStreetMap 한국 데이터로 출시 첫날부터 정상 작동합니다. 1년 지연 같은 트라우마 없습니다.</p></div>
    <div class="feat-card rv d1"><h3>사우디 자본 없음</h3><p>독립 LLC가 운영합니다. 외국 국부 펀드 소유가 아니고, 위치 데이터를 팔지 않습니다.</p></div>
    <div class="feat-card rv d2"><h3>약 4배 배터리</h3><p>AR을 빼고 GPS만 씁니다. 같은 거리를 다닐 때 포켓몬고 대비 배터리가 약 4배 갑니다.</p></div>
    <div class="feat-card rv d3"><h3>MMO 어휘</h3><p>"영토", "클랜", "MMO". 한국 게이머가 쓰는 단어로 그대로 이야기합니다.</p></div>
    <div class="feat-card rv d4"><h3>강아지 시장 보완</h3><p>펫피와 경쟁하는 앱이 아닙니다. 펫피는 트래킹, MapRaiders는 게임이라 같이 켜놓고 쓸 수 있습니다.</p></div>
  </div>""",
        },
    ],
    "faq": [
        {"q": "MapRaiders는 한국 지도를 정상적으로 사용하나요?",
         "a": "네. OpenStreetMap 한국 데이터를 사용하기 때문에 출시 첫날부터 정상 작동합니다. 포켓몬고 같은 1년 지연이 없습니다."},
        {"q": "위치 데이터는 어디로 가나요?",
         "a": "EU 호환 서버에서 처리되며, 광고 네트워크나 외국 국부 펀드에 판매되지 않습니다. PIPA(개인정보보호법) 준수 작업도 진행 중입니다."},
        {"q": "한국에서 쓰기에 적합한가요?",
         "a": "네. 서울, 부산, 대구 등 한국 도시에는 OpenStreetMap 데이터가 풍부합니다. 게임 메커니즘은 OSM 데이터가 있는 곳이면 어디서든 작동합니다."},
        {"q": "포켓몬고와 어떻게 다른가요?",
         "a": "MapRaiders는 진짜 영토 게임입니다. 체육관 점령이 아니라 지속적인 땅 소유 개념입니다. 광고 없음, 가챠 없음, AR 없음, 사우디 자본 없는 독립 개발."},
        {"q": "비용은 얼마나 드나요?",
         "a": "100% 무과금입니다. 코스메틱 IAP는 ₩2,500부터 ₩12,000 사이의 선택 사항이고, 게임 이점은 없습니다. 후원자 구독은 ₩5,900/월로 역시 선택입니다."},
    ],
    "internal_links": [
        ("/ko/영토게임.html", "영토게임"),
        ("/ko/포켓몬고-대안-무료.html", "포켓몬고 대안 무료"),
        ("/ko/산책게임.html", "산책게임"),
        ("/ko/보물찾기-앱.html", "보물찾기 앱"),
        ("/ko/만보기-게임.html", "만보기 게임"),
        ("/ko/위치기반게임-후기.html", "위치기반게임 후기"),
        ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
    ],
}

K3 = {
    "slug": "/ko/포켓몬고-대안-무료.html",
    "breadcrumb": "포켓몬고 대안 무료",
    "title": "포켓몬고 대안 무료, 광고 없음, 사우디 자본 없음",
    "og_title": "포켓몬고 대안 무료: 광고 없는 GPS MMO",
    "meta": "포켓몬고 대안을 찾고 있다면? MapRaiders는 무료에 광고도 AR도 없는 GPS MMO입니다. 진짜 영토를 차지할 수 있습니다.",
    "keywords": "포켓몬고 대안, 포켓몬고 대안 무료, 광고 없는 GPS 게임, 무과금 위치 게임, niantic 대안, 사우디 자본 없음",
    "badge": "포켓몬고 대안",
    "pricing_pill": "100% 무과금. 가챠 없음, 광고 없음.",
    "h1_html": '포켓몬고 대안 <em>무료</em>: 광고 없는 GPS MMO',
    "lead": "포켓몬고 대안을 찾는 이유는 보통 둘 중 하나입니다. P2W 압박이 지긋지긋하거나, 2025년 사우디 인수 이후 위치 데이터가 어디로 흘러가는지 걱정되거나. MapRaiders는 두 문제 모두를 다룹니다. 100% 무과금이고, 광고가 없고, 가챠가 없고, 외국 국부 펀드 소유도 아닙니다.",
    "trigger": {
        "quote": "강아지는 어차피 하루에 두 번 나가야 해서, 그 김에 앱을 켭니다.",
        "author": "Ron C., 슈투트가르트 권역의 강아지 보호자 (비공개 베타)",
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "왜 찾는가",
            "title": "포켓몬고 플레이어가 <em>대안을 찾는 이유</em>",
            "body": """
    <p>2025년 한국 시장에서 대안 검색이 늘어난 데에는 두 가지 흐름이 있습니다:</p>
    <ul>
      <li><strong>P2W 드리프트.</strong> 원격 레이드 패스, 배틀 패스, 월간 토큰 번들. 결제하지 않으면 뒤처집니다.</li>
      <li><strong>2025년 3월 사우디 인수.</strong> Niantic은 게임 사업부(포켓몬고, 잉그레스, 피크민 블룸, 몬스터 헌터 나우)를 35억 달러에 Scopely에 매각했습니다. Scopely는 사우디 공공투자기금(PIF)의 자회사입니다. 매월 3,000만 명 이상의 플레이어 위치 데이터가 이제 외국 국부 펀드 인프라를 거쳐 처리됩니다.</li>
    </ul>
            """,
        },
        {
            "label": "무료의 의미",
            "title": "MapRaiders에서 <em>&ldquo;무료&rdquo;가 의미하는 것</em>",
            "body": "<p>티어를 모두 공개합니다. 숨겨진 페이월도, 10분 뒤 튜토리얼이 막히는 일도 없습니다:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>티어</th><th>내용</th><th>가격 (KRW 부가세 포함)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% 게임플레이 (영토, 에코, 퀘스트, 클랜, 방어, 이벤트)</td><td>₩0</td></tr>
      <tr><td class="feat-name">코스메틱 IAP</td><td>마커 디자인, 영토 색상, 클랜 엠블럼, 스킨</td><td>₩2,500 – ₩12,000</td></tr>
      <tr><td class="feat-name">MapRaiders 후원자 (구독)</td><td>명예 배지, 베타 액세스, 파운더 편지, 월간 코스메틱 팩</td><td>₩5,900 / 월</td></tr>
      <tr><td class="feat-name">평생 후원자</td><td>수집가 코스메틱 + 크레딧 표기</td><td>₩129,000 일회</td></tr>
    </tbody>
  </table>
  <p style="margin-top:24px;color:var(--muted);font-size:14px"><strong>중요:</strong> 코스메틱 아이템은 게임 이점을 제공하지 않습니다. 아무것도 구매하지 않은 사람도 평생 후원자와 동일한 메커니즘으로 플레이합니다.</p>""",
        },
        {
            "label": "사우디 문제",
            "title": "<em>사우디-Niantic 문제</em>: 당신의 데이터는 어디로 갑니까?",
            "body": """
    <p>2025년 3월, Niantic은 게임 사업부(포켓몬고, 잉그레스, 피크민 블룸, 몬스터 헌터 나우)를 35억 미국 달러에 Scopely에 매각했습니다. Scopely는 사우디 공공투자기금(PIF)의 자회사이고, PIF는 사우디아라비아의 국부 펀드입니다.</p>
    <p>구체적으로 무슨 뜻이냐면, <strong>매월 3,000만 명에 달하는 포켓몬고 플레이어의 위치 데이터</strong>가 이제 Scopely 인프라를 거쳐 처리된다는 이야기입니다. 어디서 뛰는지, 언제 강아지를 산책시키는지, 매일 어떤 길로 다니는지가 그 데이터에 담겨 있죠. 구체적인 데이터 전송 구조가 어떻게 되는지 회사 측은 공개적으로 설명한 적이 없습니다. 분명한 점은 EU 밖에서 활동하는 국부 펀드 계열 사업자에게는 GDPR 같은 보호가 적용되지 않는다는 것입니다.</p>
    <p>MapRaiders는 <strong>독립 소유</strong>의 미국 LLC(Scafa Investments LLC, 플로리다)이고, 독립 팀이 개발하고 있습니다. 데이터를 판매하지 않으며, 광고 네트워크가 연결돼 있지 않고, 국가의 통제도 받지 않습니다.</p>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders는 정말 영원히 무료인가요?",
         "a": "네. 영토 점령, 에코 남기기, 퀘스트 만들기, 클랜 형성 같은 핵심 게임플레이는 영원히 무료입니다. 티어 시스템도, 배틀 패스도, 구독 강제도 없습니다."},
        {"q": "코스메틱 IAP는 얼마인가요?",
         "a": "마커 디자인, 영토 색상, 클랜 엠블럼 같은 코스메틱 아이템은 ₩2,500부터 ₩12,000 사이입니다(부가세 포함). 게임 이점은 전혀 없고 시각적 변경뿐입니다."},
        {"q": "앱에 광고가 있나요?",
         "a": "아니요. MapRaiders는 광고가 전혀 없습니다. 데이터도 광고 공간도 팔지 않습니다."},
        {"q": "\"사우디 자본 없음\"이 무슨 뜻인가요?",
         "a": "2025년 3월, Niantic은 게임 사업부를 35억 달러에 Scopely(사우디 공공투자기금의 자회사)에 매각했습니다. 매월 3,000만 명이 넘는 포켓몬고 플레이어의 위치 데이터가 이제 외국 국부 펀드 인프라를 거칩니다. MapRaiders는 사적 소유의 미국 LLC로, 국가의 통제를 받지 않습니다."},
        {"q": "MapRaiders 뒤에는 누가 있나요?",
         "a": "René Scafarti(파운더, Scafa Investments LLC)와 작은 독립 팀입니다. 외부 투자자도, 국가 지분도, 광고 네트워크도 없습니다."},
    ],
    "internal_links": [
        ("/ko/영토게임.html", "영토게임"),
        ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
        ("/ko/무과금-위치기반게임.html", "무과금 위치기반게임"),
        ("/ko/포켓몬고-대안-후기.html", "포켓몬고 대안 후기"),
        ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
    ],
}

K4 = {
    "slug": "/ko/산책게임.html",
    "breadcrumb": "산책게임",
    "title": "산책게임, 걷는 만큼 영토가 넓어진다",
    "og_title": "산책게임: 모든 걸음이 영토가 되는 GPS MMO",
    "meta": "산책을 게임으로 만들어주는 앱. MapRaiders는 걷는 만큼 영토를 차지하는 GPS MMO입니다. 강아지 산책, 조깅, 출근길에 어울립니다.",
    "keywords": "산책게임, 산책 게임 앱, 걷기 게임, 강아지 산책 게임, GPS 산책, 산책 보상",
    "badge": "산책게임",
    "pricing_pill": "무과금. 강아지 산책 앱과 같이 써도 됩니다.",
    "h1_html": '산책게임: 걷는 만큼 <em>영토</em>가 넓어진다',
    "lead": "산책게임은 한국에서 큰 카테고리입니다. 펫피, 산책가자, 피리부는 강아지가 시장을 잡고 있죠. 다만 그건 트래커지 게임은 아닙니다. MapRaiders는 다릅니다. 한 걸음 한 걸음이 영토를 만들고, 매일 다니는 산책 코스가 동네 지도를 그립니다. GPS 정확도와 게임 메커니즘이 같이 들어가 있고, 기존 트래커와 같이 켜놓고 쓸 수도 있습니다.",
    "trigger": {
        "quote": "강아지는 어차피 하루에 두 번 나가야 해서, 그 김에 앱을 켭니다.",
        "author": "Ron C., 슈투트가르트 권역의 강아지 보호자 (비공개 베타)",
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "트렌드",
            "title": "한국 <em>산책게임 트렌드</em> 2026",
            "body": """
    <p>한국 산책게임 시장은 세 단계를 거쳤습니다:</p>
    <ul>
      <li><strong>1세대 (2018-2020) 트래커.</strong> 펫피, 산책가자 등이 거리, 시간, 칼로리를 측정했습니다. 게임 메커니즘은 없었습니다.</li>
      <li><strong>2세대 (2021-2023) 보상 적립.</strong> 캐시워크, 토스 만보기 등이 걸음에 포인트를 부여했습니다. 게임이라기보다 보상 경제 모델에 가깝습니다.</li>
      <li><strong>3세대 (2024 이후) GPS MMO.</strong> 영토, 에코, 클랜이 들어가면서 산책 자체가 게임플레이가 되는 단계입니다. MapRaiders가 이 카테고리를 한국에 가져옵니다.</li>
    </ul>
            """,
        },
        {
            "label": "MapRaiders",
            "title": "MapRaiders가 <em>산책을 바꾸는 네 가지</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>모든 걸음이 영토</h3><p>걷기, 강아지 산책, 출근길 모두 GPS 트레이스가 영토 다각형을 만듭니다. 매일 산책이 지도를 그립니다.</p></div>
    <div class="feat-card rv d1"><h3>방어와 도전</h3><p>다른 플레이어가 도전해 오면 미니게임으로 결판을 냅니다. 단순 산책 트래커보다 깊은 게임 루프가 만들어집니다.</p></div>
    <div class="feat-card rv d2"><h3>에코로 이야기</h3><p>강아지가 좋아하는 모퉁이에 음성 에코를 남깁니다. 다른 산책자가 발견하면서 동네가 사회적 공간이 됩니다.</p></div>
    <div class="feat-card rv d3"><h3>강아지 시장과 호환</h3><p>펫피나 산책가자와 같이 사용할 수 있습니다. 그쪽은 트래킹을, MapRaiders는 게임을 맡습니다. 같은 GPS 센서를 쓰지만 충돌은 없습니다.</p></div>
  </div>""",
        },
        {
            "label": "페르소나",
            "title": "산책게임의 <em>네 가지 페르소나</em>",
            "body": "<p>산책게임은 사용자 폭이 넓은 카테고리입니다. MapRaiders는 한 앱 안에서 다음 네 그룹 모두에게 동시에 작동합니다:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>강아지 보호자</h3><p>한국 반려견 가구는 1,500만 규모입니다. 매일 산책이 그대로 영토 유지가 됩니다.</p></div>
    <div class="feat-card rv d1"><h3>시니어</h3><p>걷기는 한국 시니어 인구가 가장 많이 하는 활동입니다. 게임 요소가 거기에 동기를 더합니다.</p></div>
    <div class="feat-card rv d2"><h3>출근족</h3><p>지하철역까지의 짧은 길도 영토가 됩니다. 매일 똑같이 가던 길이 새로운 의미를 갖습니다.</p></div>
    <div class="feat-card rv d3"><h3>가족</h3><p>주말 가족 산책이 가족 단위 영토 점령으로 바뀝니다. 화면 앞이 아니라 실제로 밖에서 움직이게 됩니다.</p></div>
  </div>""",
        },
        {
            "label": "배터리",
            "title": "긴 산책을 위한 <em>배터리 최적화</em>",
            "body": """
    <p>한국 산책 평균은 30분에서 60분 정도입니다. MapRaiders는 효율을 염두에 두고 설계됐습니다:</p>
    <ul>
      <li><strong>AR 없음.</strong> 카메라가 돌지 않고, AR 렌더링을 위한 GPU 부하도 없습니다.</li>
      <li><strong>GPS 폴링 최적화.</strong> 정지 상태에서는 샘플 레이트를 낮추고, 활동 중에는 높입니다.</li>
      <li><strong>지도 캐시.</strong> OpenStreetMap 타일이 로컬에 캐시되어 긴 경로에서도 데이터를 계속 끌어오지 않습니다.</li>
      <li><strong>결과.</strong> 같은 거리를 다닐 때 포켓몬고 대비 배터리가 약 4배 갑니다.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders는 강아지 산책에 적합한가요?",
         "a": "네, 잘 맞습니다. 강아지 산책처럼 정해진 시간에 같은 코스를 도는 패턴이 영토 유지에 딱 맞습니다. 베타 테스터 Ron C.는 강아지 산책만으로 거리 전체를 점령했습니다."},
        {"q": "펫피나 산책가자와 같이 사용할 수 있나요?",
         "a": "네. MapRaiders는 트래커 앱과 충돌하지 않습니다. 두 앱이 같은 GPS 센서를 쓰지만 하는 일이 다릅니다. 펫피는 트래킹, MapRaiders는 게임입니다."},
        {"q": "시니어가 사용하기에 적합한가요?",
         "a": "네. UI를 큰 글씨와 명확한 구조로 만들었습니다. 강제 PvP가 없으니까 자기 페이스로 동네를 점령할 수 있습니다."},
        {"q": "가족 모드가 있나요?",
         "a": "네. 어린이를 위한 가족 모드가 있습니다. GDPR/PIPA 호환이고, 광고가 없고, 보호자 동의 없는 인앱 채팅도 없습니다."},
        {"q": "산책 보상 앱과 어떻게 다른가요?",
         "a": "캐시워크 같은 보상 앱은 걸음에 포인트를 줍니다. MapRaiders는 영토, 에코, 클랜 같은 게임 메커니즘을 줍니다. 카테고리가 달라서 같이 쓰는 것도 가능합니다."},
    ],
    "internal_links": [
        ("/ko/영토게임.html", "영토게임"),
        ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
        ("/ko/만보기-게임.html", "만보기 게임"),
        ("/ko/산책게임-후기.html", "산책게임 후기"),
        ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
    ],
}

K5 = {
    "slug": "/ko/무과금-위치기반게임.html",
    "breadcrumb": "무과금 위치기반게임",
    "title": "무과금 위치기반게임, 100% 무료에 모든 기능",
    "og_title": "무과금 위치기반게임: 가챠 없음, 광고 없음",
    "meta": "무과금 위치기반게임을 찾고 있나요? MapRaiders는 100% 무료, 가챠 없음, 광고 없음입니다. 코스메틱만 선택 구매.",
    "keywords": "무과금 위치기반게임, 무과금 GPS 게임, 100% 무료 게임, 가챠 없는 게임, 광고 없는 GPS, 무과금 MMO",
    "badge": "무과금",
    "pricing_pill": "₩0 게임플레이. 코스메틱은 ₩2,500부터 선택.",
    "h1_html": '무과금 위치기반게임: <em>100% 무료</em>의 모든 기능',
    "lead": "한국 모바일 게임 시장은 가챠와 P2W에 지쳐 있습니다. 리니지M, 원신, 포켓몬고 모두 IAP 압박이 무겁죠. 그래서 진짜 무과금 위치기반게임은 거의 보이지 않습니다. MapRaiders가 거기에 약속을 답니다. 게임플레이는 100% 무과금이고, 가챠도 없고, 광고도 없습니다. 코스메틱만 선택사항입니다.",
    "trigger": {
        "quote": "원래도 매일 아침 뛰는데, 이제는 뭔가를 지키면서 뛰게 됐습니다.",
        "author": "Vivian N., 함부르크 권역의 러너 (비공개 베타)",
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "한국 IAP 피로",
            "title": "한국 게이머의 <em>IAP 피로</em>",
            "body": """
    <p>한국 모바일 게임 시장은 세계에서 IAP 부담이 가장 무거운 축에 듭니다:</p>
    <ul>
      <li><strong>리니지M.</strong> 월 평균 ARPU가 20만 원을 넘고, 일부 사용자는 수백만 원에 달합니다.</li>
      <li><strong>원신.</strong> 가챠 1회 ₩3,000, 5성 캐릭터 한 명을 뽑는 데 평균 ₩200,000 수준.</li>
      <li><strong>포켓몬고.</strong> 원격 레이드 패스 ₩2,000, 배틀 패스 ₩9,900에서 ₩19,900 사이.</li>
    </ul>
    <p>그 결과 진지하게 즐길 만한 카테고리에서 무과금 사용자가 거의 사라졌습니다. 무과금 게임은 보통 광고로 가득 차 있는데, 그건 또 다른 형태의 페이월일 뿐입니다.</p>
            """,
        },
        {
            "label": "무료의 정의",
            "title": "MapRaiders가 <em>&ldquo;무료&rdquo;를 정의하는 방법</em>",
            "body": "<p>티어를 투명하게 공개합니다:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>티어</th><th>내용</th><th>가격 (KRW)</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Free Forever</td><td>100% 게임플레이 (영토, 에코, 퀘스트, 클랜, 방어, 이벤트)</td><td>₩0</td></tr>
      <tr><td class="feat-name">코스메틱 IAP</td><td>마커 디자인, 영토 색상, 클랜 엠블럼</td><td>₩2,500 – ₩12,000</td></tr>
      <tr><td class="feat-name">후원자 구독</td><td>명예 배지, 베타 액세스, 월간 코스메틱 팩</td><td>₩5,900 / 월</td></tr>
      <tr><td class="feat-name">평생 후원자</td><td>수집가 코스메틱 + 크레딧 표기</td><td>₩129,000 일회</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "가챠 없음 선언",
            "title": "<em>가챠 없음 선언</em>",
            "body": """
    <p>MapRaiders는 영원히 다음을 약속합니다:</p>
    <ul>
      <li><strong>가챠 없음.</strong> 무작위 박스, 무작위 캐릭터, 무작위 아이템 풀 없음.</li>
      <li><strong>P2W 없음.</strong> 결제하면 강해지는 시스템 없음. 모든 플레이어가 동일한 메커니즘.</li>
      <li><strong>스태미나/AP 없음.</strong> 매일 5번만 플레이 가능 같은 페이월 없음. 원하는 만큼 플레이.</li>
      <li><strong>배틀 패스 없음.</strong> 시즌별 결제 압박 없음.</li>
      <li><strong>광고 없음.</strong> 광고 시청 보상도 없습니다. 광고 자체가 없으니까요.</li>
    </ul>
            """,
        },
        {
            "label": "코스메틱 투명성",
            "title": "코스메틱 IAP의 <em>투명성</em>",
            "body": """
    <p>코스메틱은 게임 이점을 절대로 주지 않습니다. 이건 우리 쪽 약속입니다. 구체적으로 보면:</p>
    <ul>
      <li><strong>마커 디자인.</strong> 지도에 영토 마커가 어떻게 보일지 결정합니다. 스탯은 그대로입니다.</li>
      <li><strong>영토 색상.</strong> 영토가 다른 색으로 보일 뿐, 크기, 방어력, 생산성은 변하지 않습니다.</li>
      <li><strong>클랜 엠블럼.</strong> 클랜의 시각적 정체성에만 영향을 줍니다. 클랜 능력 자체는 같습니다.</li>
    </ul>
    <p>아무것도 사지 않은 사람도 평생 후원자와 똑같은 메커니즘으로 게임을 합니다. 그게 무과금의 진짜 의미입니다.</p>
            """,
        },
    ],
    "faq": [
        {"q": "정말 가챠가 없나요?",
         "a": "네. 랜덤 박스, 랜덤 캐릭터, 랜덤 아이템 풀이 전부 없습니다. 영원히 없습니다. 이건 우리 디자인 원칙입니다."},
        {"q": "후원자 구독은 페이월 아닌가요?",
         "a": "아니요. 후원자는 명예 배지, 베타 액세스, 월간 코스메틱 팩만 받습니다. 게임 이점은 없습니다. 무과금 사용자도 동일한 방어, 동일한 영토, 동일한 클랜 메커니즘을 씁니다."},
        {"q": "광고를 보면 보상을 받나요?",
         "a": "아니요. MapRaiders에는 광고가 없습니다. 광고 시청 보상도 당연히 없고요. 광고 자체가 없으니까요."},
        {"q": "스태미나 시스템이 있나요?",
         "a": "아니요. 일일 플레이 제한이 없습니다. 영토 점령, 에코 남기기, 클랜 활동 모두 원하는 만큼 할 수 있습니다."},
        {"q": "그러면 어떻게 운영비를 충당하나요?",
         "a": "코스메틱 IAP와 후원자 구독으로 충당합니다. 코스메틱을 사는 사용자는 매우 일부지만, 그걸로 충분합니다. 우리는 큰 마케팅 예산을 쓰지 않는 작은 독립 팀이거든요."},
    ],
    "internal_links": [
        ("/ko/영토게임.html", "영토게임"),
        ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
        ("/ko/포켓몬고-대안-무료.html", "포켓몬고 대안 무료"),
        ("/ko/무과금-게임-후기.html", "무과금 게임 후기"),
        ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
    ],
}

K6 = {
    "slug": "/ko/보물찾기-앱.html",
    "breadcrumb": "보물찾기 앱",
    "title": "보물찾기 앱, 도시 전체가 라이브 무대",
    "og_title": "보물찾기 앱: 도시가 통째로 보물찾기가 된다",
    "meta": "보물찾기 앱을 찾고 있나요? MapRaiders는 도시 전체가 라이브 보물찾기 무대가 되는 GPS MMO입니다. 가족, 친구, 강아지와 함께 즐길 수 있습니다.",
    "keywords": "보물찾기 앱, 보물찾기 게임, 도시 보물찾기, 가족 야외 게임, geocaching 한국, GPS 보물찾기",
    "badge": "보물찾기 앱",
    "pricing_pill": "무과금. 가족 모드 포함.",
    "h1_html": '보물찾기 앱: <em>도시 전체</em>가 라이브 무대',
    "lead": "기존 보물찾기 앱(Actionbound, Anyfox)은 준비할 게 많습니다. 투어를 사고, 스테이션을 설정하고, 자료를 인쇄해야 하죠. Geocaching은 캐시 중심이고요. MapRaiders는 다릅니다. 에코가 이미 도시 전체에 흩어져 있습니다. 다른 플레이어의 흔적을 따라가거나, 자기 흔적을 남기면 됩니다. 라이브로 돌아가고, 무료고, 사전 준비가 필요 없습니다.",
    "trigger": {
        "quote": "어떤 건물 입구에 짧은 음성을 남겼는데, 사흘 뒤에 모르는 사람이 그걸 들었더라구요.",
        "author": "Aljoscha P., 베를린 권역의 도시 탐험가 (비공개 베타)",
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "현대 보물찾기",
            "title": "현대 <em>보물찾기 앱</em>의 세 가지 카테고리",
            "body": """
    <p>2020년대 보물찾기 앱은 세 가지 모델로 갈라집니다:</p>
    <ul>
      <li><strong>투어 구매 모델 (Actionbound, Anyfox).</strong> 사전 제작된 투어를 사서 따라갑니다. 준비 부담이 크고, 가격은 ₩5,000부터 ₩20,000 사이.</li>
      <li><strong>캐시 모델 (Geocaching).</strong> 사용자가 만든 캐시를 찾는 방식입니다. 비동기적이고, 게임 루프는 없습니다.</li>
      <li><strong>라이브 에코 모델 (MapRaiders).</strong> 에코가 실시간으로 생깁니다. 보물찾기, 영토, 퀘스트가 같은 게임 루프 안에 있습니다.</li>
    </ul>
            """,
        },
        {
            "label": "비교",
            "title": "보물찾기 앱 <em>비교</em>",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>앱</th><th>가격</th><th>준비</th><th>라이브 요소</th><th>게임 루프</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">Actionbound</td><td>투어 구매 / 구독</td><td>높음, 투어 직접 구축</td><td class="cross">✗</td><td>투어 한정</td></tr>
      <tr><td class="feat-name">Anyfox</td><td>프리미엄 구독</td><td>중간, 콘텐츠 구매</td><td class="cross">✗</td><td>투어 한정</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>프리미엄 구독</td><td>낮음, 캐시 찾기</td><td class="cross">비동기</td><td>수집</td></tr>
      <tr><td class="feat-name">MapRaiders</td><td class="check">₩0</td><td class="check">없음</td><td class="check">라이브</td><td>에코 + 퀘스트 + 영토</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "에코 기능",
            "title": "MapRaiders가 <em>보물찾기를 다시 정의</em>",
            "body": """
    <p>스테이션 1번부터 10번까지 정해진 선형 투어가 아니라, MapRaiders에서는 <strong>도시 전체에 펼쳐진 개방형 공간 보물찾기</strong>가 만들어집니다:</p>
    <ul>
      <li><strong>에코 남기기.</strong> 한 장소에 음성, 사진 또는 영상 에코를 남깁니다. 다른 플레이어가 지나가면 발견합니다.</li>
      <li><strong>에코 찾기.</strong> 지도에서 에코 위치를 보고 따라갑니다. 흔적을 좇고, 비밀을 찾고, 이야기를 듣습니다.</li>
      <li><strong>퀘스트 만들기.</strong> 한 장소에 짧은 과제를 만듭니다. "저기 빨간 문 사진을 찍어." 다른 플레이어가 그걸 수행합니다.</li>
      <li><strong>영토 레이어.</strong> 보물찾기 경로를 자주 걷는 사람은 그 길을 영토로 점령합니다. 흔적이 그대로 땅이 됩니다.</li>
    </ul>
            """,
        },
        {
            "label": "가족",
            "title": "<em>가족용 보물찾기 앱</em>",
            "body": """
    <p>한국 가족은 주말 야외 활동을 중시합니다. 자연, 공원, 도시 산책 같은 거죠. MapRaiders는 디지털과 아날로그를 한 자리에서 묶습니다:</p>
    <ul>
      <li><strong>부모-자녀 활동.</strong> 부모가 정해놓은 경로에 음성 에코를 남기고, 아이들이 그 흔적을 따라갑니다. 운동은 아날로그, 힌트는 디지털입니다.</li>
      <li><strong>화면 밖 운동.</strong> 앱은 지도에서 안내만 합니다. 진짜 경험은 바깥에서 일어납니다.</li>
      <li><strong>PIPA 호환 어린이용.</strong> 개인화 광고 트래커 없음, 데이터 판매 없음, 보호자 승인 없는 인앱 채팅 없음.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "MapRaiders는 어린이에게 적합한가요?",
         "a": "네, 9세 이상부터 부모 동반으로 추천합니다. PIPA 호환이고, 광고가 없고, 어린이의 개인 정보를 수집하지 않습니다. 부모가 가족 모드를 활성화할 수 있습니다."},
        {"q": "어린이와 보물찾기를 하려면 얼마나 준비해야 하나요?",
         "a": "전혀 준비할 필요가 없습니다. Actionbound나 Anyfox와 달리 투어를 사거나 스테이션을 설치할 필요가 없습니다. 에코가 이미 도시 전체에 흩어져 있어서, 다른 플레이어의 흔적을 따라가거나 자기 흔적을 남기면 됩니다."},
        {"q": "보물찾기 앱에 비용이 드나요?",
         "a": "아니요. 에코 남기기, 에코 찾기, 퀘스트 만들기 같은 보물찾기 기능은 모두 무료입니다. 마커 디자인 코스메틱 아이템은 ₩2,500부터 선택 사항이고, 게임 이점은 없습니다."},
        {"q": "작은 도시나 시골에서도 작동하나요?",
         "a": "네. 작은 도시나 마을에서도 에코를 남기고 퀘스트를 만들 수 있습니다. 사람이 많은 지역에서는 다른 플레이어의 흔적을 더 자주 발견하고, 시골에서는 자기 코스가 더 넓은 공간을 차지합니다."},
        {"q": "한국어를 지원하나요?",
         "a": "네. 메뉴, 에코 시스템, 힌트, 고객 지원까지 한국어로 완전히 현지화됩니다."},
    ],
    "internal_links": [
        ("/ko/영토게임.html", "영토게임"),
        ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
        ("/ko/산책게임.html", "산책게임"),
        ("/ko/보물찾기-앱-후기.html", "보물찾기 앱 후기"),
        ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
    ],
}

K7 = {
    "slug": "/ko/만보기-게임.html",
    "breadcrumb": "만보기 게임",
    "title": "만보기 게임, 걸음이 영토가 된다",
    "og_title": "만보기 게임: 걸음이 영토가 되는 GPS MMO",
    "meta": "만보기 게임을 찾고 있나요? MapRaiders는 걸음이 영토가 되는 GPS MMO입니다. 건강, 게임, 사회적 연결이 한 앱 안에서 작동합니다.",
    "keywords": "만보기 게임, 만보기 앱, 걸음 게임, 걸음 보상, 헬스 게임, 캐시워크 대안, 토스 만보기 대안",
    "badge": "만보기 게임",
    "pricing_pill": "무과금. 보상 적립이 아니라 게임 메커니즘.",
    "h1_html": '만보기 게임: 걷는 <em>걸음</em>이 영토가 된다',
    "lead": "만보기 시장은 한국에서 큰 카테고리입니다. 캐시워크, 토스 만보기, 헬시 같은 앱들이 걸음을 포인트로 바꿔주죠. 다만 그건 게임이 아니라 보상 적립 시스템입니다. MapRaiders는 다른 카테고리에 있습니다. 한 걸음 한 걸음이 영토를 만들고, 매일 다니는 산책이 동네를 바꾸고, 온 가족이 같이 클랜을 만들 수 있습니다.",
    "trigger": {
        "quote": "강아지는 어차피 하루에 두 번 나가야 해서, 그 김에 앱을 켭니다.",
        "author": "Ron C., 슈투트가르트 권역의 강아지 보호자 (비공개 베타)",
    },
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {
            "label": "트렌드",
            "title": "한국 <em>만보기 + 게임</em> 트렌드",
            "body": """
    <p>한국 만보기 시장은 크게 두 갈래입니다:</p>
    <ul>
      <li><strong>보상 적립 모델 (캐시워크, 토스 만보기, 헬시).</strong> 걸음에 포인트가 붙고, 포인트로 쿠폰을 받습니다. 게임 메커니즘이나 사회적 요소는 없습니다.</li>
      <li><strong>피트니스 트래커 (삼성 헬스, 애플 헬스).</strong> 통계만 측정합니다. 게임 요소는 없습니다.</li>
    </ul>
    <p>그 사이가 비어 있습니다. 걷기와 진짜 게임 메커니즘을 결합한 앱이 거의 없죠. MapRaiders가 그 자리를 채웁니다.</p>
            """,
        },
        {
            "label": "헬스+게임",
            "title": "<em>헬스 + 게임</em> 시너지",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>걸음 = 영토</h3><p>한 걸음 한 걸음이 영토를 만듭니다. 통계 숫자가 아니라 지도에 남는 시각적, 지속적 보상입니다.</p></div>
    <div class="feat-card rv d1"><h3>쇠퇴가 동기 부여</h3><p>사흘 쉬면 영토가 줄어들기 시작합니다. 자연스럽게 다시 나갈 핑계가 생깁니다.</p></div>
    <div class="feat-card rv d2"><h3>클랜 = 가족</h3><p>가족이 한 클랜이 되어 동네 전체를 점령할 수 있습니다. 사회적 헬스인 셈이죠.</p></div>
    <div class="feat-card rv d3"><h3>약 4배 배터리</h3><p>AR을 빼고 GPS만 씁니다. 만보기 앱처럼 백그라운드에서 효율적으로 돕니다.</p></div>
  </div>""",
        },
        {
            "label": "보상 vs 게임",
            "title": "만보기 <em>보상 앱과의 차이</em>",
            "body": "<p>캐시워크나 토스 만보기와 직접 비교하면 차이가 분명합니다:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>측면</th><th>캐시워크 / 토스</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">메커니즘</td><td>걸음 → 포인트 → 쿠폰</td><td>걸음 → 영토 → 게임플레이</td></tr>
      <tr><td class="feat-name">사회적 요소</td><td class="cross">없음</td><td class="check">클랜, 에코, 퀘스트</td></tr>
      <tr><td class="feat-name">지속성</td><td>매일 0부터 시작</td><td class="check">영토는 지속적</td></tr>
      <tr><td class="feat-name">광고</td><td>가득함</td><td class="check">없음</td></tr>
      <tr><td class="feat-name">경쟁</td><td class="cross">없음</td><td class="check">방어 미니게임</td></tr>
      <tr><td class="feat-name">함께 사용 가능</td><td colspan="2" class="check">네, 같은 GPS 센서 공유</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "가족",
            "title": "<em>가족용</em> 만보기 게임",
            "body": """
    <p>한국 가족의 헬스 트렌드는 앱이 잘게 쪼개져 있는 편입니다. 아버지의 만보기, 어머니의 산책 트래커, 아이의 게임이 따로따로 있죠. MapRaiders는 그걸 한 군데로 모읍니다:</p>
    <ul>
      <li><strong>시니어.</strong> 큰 글씨 UI에 강제 PvP가 없어서 자기 페이스로 동네 영토를 유지할 수 있습니다.</li>
      <li><strong>어린이.</strong> PIPA 호환 가족 모드, 광고 없음, 보호자 동의 없는 채팅 없음.</li>
      <li><strong>강아지 가족.</strong> 매일 산책이 영토 유지로 이어집니다. 강아지 보호자 베타 테스터 Ron C.는 거리 전체를 점령했습니다.</li>
      <li><strong>주말 가족 산책.</strong> 클랜으로 같이 움직이면서 큰 영토를 점령합니다. 화면 앞이 아니라 밖에서 운동합니다.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "만보기 보상 앱과 같이 사용할 수 있나요?",
         "a": "네. 캐시워크, 토스 만보기, 삼성 헬스 등과 충돌하지 않습니다. 같은 GPS 센서를 쓰지만 하는 일이 다릅니다. 그쪽은 보상 적립, MapRaiders는 게임이거든요."},
        {"q": "걸음 수도 측정하나요?",
         "a": "주 측정 단위는 GPS 거리(영토를 만드는 방식)지만, 걸음 수도 같이 표시됩니다. 다만 핵심은 영토입니다. 걸음이 지도에 눈에 보이는 결과로 남습니다."},
        {"q": "시니어가 사용하기에 적합한가요?",
         "a": "네. UI를 큰 글씨에 명확한 구조로 만들었습니다. 강제 PvP가 없어서 자기 페이스로 동네를 점령할 수 있습니다."},
        {"q": "어린이가 사용해도 안전한가요?",
         "a": "네, 9세 이상부터 부모 동반으로 추천합니다. PIPA 호환이고, 광고가 없고, 보호자 승인 없는 채팅도 없습니다. 가족 모드를 켤 수 있습니다."},
        {"q": "배터리는 얼마나 쓰나요?",
         "a": "1시간 산책 기준 8~12% 정도 소모됩니다. 캐시워크나 토스 만보기와 비슷한 수준에 게임 메커니즘이 더해진 셈입니다."},
    ],
    "internal_links": [
        ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
        ("/ko/산책게임.html", "산책게임"),
        ("/ko/보물찾기-앱.html", "보물찾기 앱"),
        ("/ko/만보기-게임-후기.html", "만보기 게임 후기"),
        ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA - TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/ko/영토게임-후기.html",
        "breadcrumb": "영토게임 후기",
        "title": "영토게임 후기, 베타 테스터의 진짜 경험",
        "og_title": "영토게임 후기: 베타에서의 진짜 이야기",
        "meta": "영토게임 후기: 독일 베타 테스터 세 명이 MapRaiders로 진짜 땅을 점령한 경험을 공유합니다. 첫 영토, 첫 쇠퇴, 첫 방어 미니게임.",
        "keywords": "영토게임 후기, 영역게임 후기, 영토 점령 게임 후기, MapRaiders 후기, GPS MMO 후기",
        "h1_html": '영토게임: <em>나만의 거리</em>가 진짜 내 것이 될 때',
        "lead": "진짜 거리를 점령하는 느낌은 어떨까요. 베타 테스터 세 명이 첫 영토, 첫 쇠퇴, 첫 방어 미니게임을 어떻게 겪었는지 이야기합니다.",
        "intro_label": "테스트의 핵심",
        "intro_title": "영토게임을 <em>경험</em>으로 만드는 것",
        "intro_body": """
    <p>영토 테스트는 세 가지 경험 축을 본 것입니다:</p>
    <ul>
      <li><strong>점령.</strong> 처음 잡은 거리가 "내 땅"처럼 느껴지는 순간은 언제 오는가?</li>
      <li><strong>상실.</strong> 첫 쇠퇴나 첫 공격자에게 잃는 경험에는 어떻게 반응하는가?</li>
      <li><strong>방어.</strong> 방어 미니게임은 전술적인지, 공정한지, 아니면 답답한지?</li>
    </ul>
    <p>세 테스터의 후기는 매우 다른 관점에서 이 세 축을 모두 다룹니다.</p>
        """,
        "internal_links": [
            ("/ko/영토게임.html", "영토게임"),
            ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
            ("/ko/위치기반게임-후기.html", "위치기반게임 후기"),
            ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
        ],
    },
    {
        "slug": "/ko/위치기반게임-후기.html",
        "breadcrumb": "위치기반게임 후기",
        "title": "위치기반게임 후기, MapRaiders 베타 테스트 보고",
        "og_title": "위치기반게임 후기: 진짜 사용 경험",
        "meta": "위치기반게임 후기: 독일 베타 테스터 세 명의 정직한 보고. 영토 시스템, 에코, 방어 미니게임이 일상에서 어떻게 작동했는지.",
        "keywords": "위치기반게임 후기, GPS MMO 후기, 위치 게임 테스트, MapRaiders 베타 후기",
        "h1_html": '위치기반게임: <em>베타에서의 경험</em>',
        "lead": "포켓몬고 베테랑, 러너, 강아지 보호자가 같은 GPS MMO 대안을 테스트하면 어떤 결과가 나올까요. MapRaiders 베타에서 나온 매우 다른 세 가지 보고를 모았습니다.",
        "intro_label": "테스트 환경",
        "intro_title": "<em>어떻게</em> 테스트했는가",
        "intro_body": """
    <p>세 테스터는 4주에서 6주 동안 자기 일상 속에서 MapRaiders를 썼습니다. 인공적인 테스트 세션도, 후원받은 콘텐츠도 없습니다. 구체적으로 보면:</p>
    <ul>
      <li><strong>일일 사용.</strong> 자기 도시 권역(슈투트가르트, 함부르크, 베를린)에서 그대로 사용.</li>
      <li><strong>직접 비교.</strong> Aljoscha P.는 2주 동안 포켓몬고와 병행해서 사용.</li>
      <li><strong>배터리 측정.</strong> 앱 설정에서 시간당 평균 소비량 기록.</li>
      <li><strong>정직한 피드백 규칙.</strong> 버그, 좌절, 희망사항을 하이라이트와 함께 그대로 보고.</li>
    </ul>
        """,
        "internal_links": [
            ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
            ("/ko/영토게임.html", "영토게임"),
            ("/ko/영토게임-후기.html", "영토게임 후기"),
            ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
        ],
    },
    {
        "slug": "/ko/포켓몬고-대안-후기.html",
        "breadcrumb": "포켓몬고 대안 후기",
        "title": "포켓몬고 대안 후기, MapRaiders 베타에서의 보고",
        "og_title": "포켓몬고 대안 후기: MapRaiders 사용 경험",
        "meta": "포켓몬고 대안 후기: 독일 베타 테스터 세 명이 MapRaiders를 정직하게 보고합니다. 광고 없음, 사우디 자본 없음의 GPS MMO.",
        "keywords": "포켓몬고 대안 후기, niantic 대안 후기, 광고 없는 GPS 게임 후기, MapRaiders 비교",
        "h1_html": '포켓몬고 대안: <em>베타에서의 정직한 후기</em>',
        "lead": "베타 테스터 세 명이 서로 다른 페르소나로 MapRaiders를 시험했습니다. 포켓몬고와는 어떻게 다른지, 인플루언서 코드도 광고 카피도 없는 솔직한 보고를 정리했습니다.",
        "intro_label": "테스트 페르소나",
        "intro_title": "세 명, 세 가지 <em>사용 사례</em>",
        "intro_body": """
    <p>세 베타 테스터는 페르소나가 매우 다릅니다. 그래서 포켓몬고와의 비교가 정직해집니다:</p>
    <ul>
      <li><strong>Ron C.</strong> 슈투트가르트 권역. 강아지 보호자, 일일 산책, 게이머 배경 없음.</li>
      <li><strong>Vivian N.</strong> 함부르크 권역. 러너, 2018년에 포켓몬고를 시도했다가 3개월 뒤에 그만뒀습니다.</li>
      <li><strong>Aljoscha P.</strong> 베를린 권역. 도시 탐험가, 잉그레스 베테랑, Niantic 생태계를 직접 겪어 본 사람.</li>
    </ul>
    <p>세 명 모두 독립적으로 MapRaiders를 테스트했습니다. 유료 홍보도 스크립트도 없습니다. 후기는 원본이 독일어로 작성됐습니다.</p>
        """,
        "internal_links": [
            ("/ko/포켓몬고-대안-무료.html", "포켓몬고 대안 무료"),
            ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
            ("/ko/위치기반게임-후기.html", "위치기반게임 후기"),
            ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
        ],
    },
    {
        "slug": "/ko/산책게임-후기.html",
        "breadcrumb": "산책게임 후기",
        "title": "산책게임 후기, 매일 산책이 영토가 되는 경험",
        "og_title": "산책게임 후기: MapRaiders 베타에서의 보고",
        "meta": "산책게임 후기: 베타 테스터가 매일 다니던 산책이 영토를 만들고 동네 지도를 채워가는 경험을 공유합니다.",
        "keywords": "산책게임 후기, 강아지 산책 게임 후기, 걷기 게임 후기, MapRaiders 산책 경험",
        "h1_html": '산책게임: <em>매일 산책</em>이 영토가 될 때',
        "lead": "매일 산책이 영토 유지로 바뀌면 어떤 변화가 생길까요. 첫 며칠 뒤 동기는 어떻게 달라질까요. 강아지 보호자, 러너, 도시 탐험가 세 명이 직접 보고합니다.",
        "intro_label": "테스트 축",
        "intro_title": "<em>산책게임</em>이 일상에서 작동하는 방식",
        "intro_body": """
    <p>산책게임 테스트는 다음 세 축으로 봤습니다:</p>
    <ul>
      <li><strong>일관성.</strong> 매일 하는 산책이 동기로 계속 이어지는가?</li>
      <li><strong>확장성.</strong> 강아지 산책, 조깅, 출근길 모두에 잘 작동하는가?</li>
      <li><strong>사회적 연결.</strong> 다른 산책자와 클랜이 자연스럽게 만들어지는가?</li>
    </ul>
        """,
        "internal_links": [
            ("/ko/산책게임.html", "산책게임"),
            ("/ko/만보기-게임.html", "만보기 게임"),
            ("/ko/만보기-게임-후기.html", "만보기 게임 후기"),
            ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
        ],
    },
    {
        "slug": "/ko/무과금-게임-후기.html",
        "breadcrumb": "무과금 게임 후기",
        "title": "무과금 게임 후기, MapRaiders가 진짜 무과금인지",
        "og_title": "무과금 게임 후기: 가챠 없는 GPS MMO",
        "meta": "무과금 게임 후기: 베타 테스터가 MapRaiders가 진짜 무과금인지, 코스메틱이 게임 이점을 주는지 정직하게 보고합니다.",
        "keywords": "무과금 게임 후기, 무과금 GPS 후기, 가챠 없는 게임 후기, 100% 무료 게임 후기",
        "h1_html": '무과금 게임: <em>진짜 무과금인지</em> 베타에서 검증',
        "lead": "한국 게이머는 \"무과금\"이라는 단어에 회의적입니다. 너무 자주 거짓말이었거든요. 베타 테스터 세 명이 MapRaiders가 정말로 약속을 지키는지 정직하게 보고합니다.",
        "intro_label": "검증 질문",
        "intro_title": "<em>무엇</em>을 검증해야 하는가",
        "intro_body": """
    <p>무과금 검증은 네 가지 질문으로 귀결됩니다:</p>
    <ul>
      <li><strong>코스메틱이 정말 게임 이점이 없는가?</strong> 후원자와 무과금 사용자가 같은 영토를 가질 수 있는가?</li>
      <li><strong>스태미나/AP 페이월이 있는가?</strong> 매일 일정량을 채우면 차단되는가?</li>
      <li><strong>광고에 보상이 붙는가?</strong> 광고 시청 보너스 때문에 광고를 안 보는 사용자가 불리해지는가?</li>
      <li><strong>가챠가 어딘가에 숨어 있는가?</strong> 랜덤 박스나 랜덤 캐릭터가 있는가?</li>
    </ul>
    <p>세 테스터가 4주에서 6주에 걸쳐 이 네 가지 질문에 모두 답을 찾았습니다.</p>
        """,
        "internal_links": [
            ("/ko/무과금-위치기반게임.html", "무과금 위치기반게임"),
            ("/ko/포켓몬고-대안-무료.html", "포켓몬고 대안 무료"),
            ("/ko/포켓몬고-대안-후기.html", "포켓몬고 대안 후기"),
            ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
        ],
    },
    {
        "slug": "/ko/보물찾기-앱-후기.html",
        "breadcrumb": "보물찾기 앱 후기",
        "title": "보물찾기 앱 후기, 도시 전체가 보물찾기인 경험",
        "og_title": "보물찾기 앱 후기: MapRaiders 라이브 경험",
        "meta": "보물찾기 앱 후기: 베타 테스터가 도시 전체에서 에코를 발견하고 자기 흔적을 남기는 경험을 공유합니다.",
        "keywords": "보물찾기 앱 후기, 도시 보물찾기 후기, 가족 야외 게임 후기, geocaching 한국 후기",
        "h1_html": '보물찾기 앱: <em>투어 구매 없이</em> 작동하는가',
        "lead": "보물찾기 앱은 보통 준비할 게 많습니다. 투어 구매, 경로 계획, 스테이션 설치까지. 그런데 도시 전체가 이미 흔적으로 채워져 있으면 어떤 느낌일까요. 베타 테스터 세 명이 보고합니다.",
        "intro_label": "테스트 질문",
        "intro_title": "<em>라이브 보물찾기</em>가 사전 준비 없이 작동하는가?",
        "intro_body": """
    <p>세 가지 환경에서 보물찾기 기능을 테스트했습니다:</p>
    <ul>
      <li><strong>혼자.</strong> 도시 탐험가로 사용한 Aljoscha P. 케이스. 에코 남기기와 에코 찾기.</li>
      <li><strong>강아지와 함께.</strong> 평소 산책 중에 사용한 Ron C. 케이스. 흔적은 부산물로 생깁니다.</li>
      <li><strong>가족 시뮬레이션.</strong> 어른과 아이가 메커니즘을 얼마나 빨리 이해하는지 봤습니다.</li>
    </ul>
        """,
        "internal_links": [
            ("/ko/보물찾기-앱.html", "보물찾기 앱"),
            ("/ko/위치기반게임.html", "위치기반게임 추천 2026"),
            ("/ko/위치기반게임-후기.html", "위치기반게임 후기"),
            ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
        ],
    },
    {
        "slug": "/ko/만보기-게임-후기.html",
        "breadcrumb": "만보기 게임 후기",
        "title": "만보기 게임 후기, 걸음이 영토가 되는 경험",
        "og_title": "만보기 게임 후기: 캐시워크보다 게임적인",
        "meta": "만보기 게임 후기: 베타 테스터가 캐시워크, 토스 만보기와 비교해 MapRaiders 경험을 공유합니다. 게임 메커니즘이 동기를 어떻게 바꾸는지 확인할 수 있습니다.",
        "keywords": "만보기 게임 후기, 만보기 앱 후기, 캐시워크 대안 후기, 토스 만보기 대안 후기, 헬스 게임 후기",
        "h1_html": '만보기 게임: <em>걸음 = 영토</em> 경험',
        "lead": "캐시워크나 토스 만보기는 걸음을 포인트로 바꿉니다. MapRaiders는 걸음을 영토로 바꿉니다. 동기는 어떻게 달라질까요. 러너, 강아지 보호자, 도시 탐험가 세 명이 직접 보고합니다.",
        "intro_label": "테스트 축",
        "intro_title": "<em>만보기 게임</em>이 보상 앱과 다른 점",
        "intro_body": """
    <p>만보기 비교 테스트는 다음 네 측면에 초점을 맞췄습니다:</p>
    <ul>
      <li><strong>지속 동기.</strong> 30일 뒤에도 동기가 유지되는가? (보상 앱은 보통 그렇지 않습니다.)</li>
      <li><strong>사회적 요소.</strong> 클랜과 에코가 자연스럽게 형성되는가?</li>
      <li><strong>가족 통합.</strong> 한 가족 안에서 시니어, 어른, 어린이 모두에게 작동하는가?</li>
      <li><strong>병행 사용.</strong> 캐시워크, 토스 만보기와 같이 켜놓고 써도 되는가?</li>
    </ul>
        """,
        "internal_links": [
            ("/ko/만보기-게임.html", "만보기 게임"),
            ("/ko/산책게임.html", "산책게임"),
            ("/ko/산책게임-후기.html", "산책게임 후기"),
            ("/ko/MapRaiders-후기.html", "모든 후기 보기"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/ko/MapRaiders-후기.html",
    "breadcrumb": "MapRaiders 후기",
    "title": "MapRaiders 후기: 평가, 베타 테스트, 파운더 성명서",
    "og_title": "MapRaiders 후기: 한눈에 보는 모든 것",
    "meta": "MapRaiders 후기: 검증된 베타 테스트 3건의 5.0/5 평점, 파운더 성명서, 모든 핵심 페이지와 후기 페이지가 한 자리에 연결돼 있습니다.",
    "keywords": "MapRaiders 후기, MapRaiders 평가, MapRaiders 테스트, GPS MMO 후기 한국",
    "badge": "허브 & 개요",
    "pricing_pill": "5.0 / 5, 검증된 베타 후기 3건",
    "h1_html": '<em>MapRaiders 후기</em>: GPS MMO에 대해 알아야 할 모든 것',
    "lead": "독일 슈투트가르트, 함부르크, 베를린의 베타 테스터 세 명. 포켓몬고 비교부터 보물찾기 앱까지 일곱 가지 핵심 주제와 일곱 가지 상세 보고가 한 허브에 모여 있습니다.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "MapRaiders는 무엇인가요?",
         "a": "MapRaiders는 Android용 GPS 기반 MMO 게임입니다. 플레이어는 움직임으로 진짜 영토를 점령하고, 에코를 남기고, 퀘스트를 만들고, 미니게임으로 땅을 방어합니다. 광고 없음, PIPA 호환 작업 진행 중, 무료."},
        {"q": "베타 테스터는 몇 명인가요?",
         "a": "현재 세 명을 공개합니다. 본인 동의 하에 프라이버시를 위해 이름 + 이니셜만 사용했습니다. 비공개 베타 단계 자체는 더 크고, 공개한 세 명은 주요 페르소나를 대표하는 사람들입니다."},
        {"q": "후기는 진짜인가요?",
         "a": "네. 세 테스터는 비공개 베타의 실제 인물입니다. 보수는 받지 않았고, 후기는 원본이 독일어로 작성됐으며, 날짜와 언어가 Schema.org 마크업에 표시돼 있습니다."},
        {"q": "어디에서 베타 테스터가 될 수 있나요?",
         "a": "랜딩 페이지에서 이메일을 등록하면 됩니다. 베타 자리는 가용성에 따라 웨이브로 배포되고, 한국 도시 중에서도 플레이어 밀도가 낮은 지역에 우선순위를 둡니다."},
        {"q": "앱은 언제 공식 출시되나요?",
         "a": "MapRaiders는 Google Play Store에서 비공개 베타로 출시됩니다. 공식 한국 출시는 2026년 여름으로 예정; iOS는 2026년 3분기 예정."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def _safe_print(s):
    try:
        print(s)
    except UnicodeEncodeError:
        print(s.encode("ascii", "replace").decode("ascii"))


def main():
    _safe_print("=== Phase 1 Session 2 - KO Killer-URL Builder ===")
    _safe_print(f"Output: {DOCS}")
    _safe_print("")

    written = []

    # 1. Killer pages
    for page in ALL_KILLERS:
        out_path = DOCS / page["slug"].lstrip("/")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = render_killer_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(out_path.name)
        _safe_print(f"  [KILLER] {page['slug']}  ({len(html):,} bytes)")

    # 2. Twin pages
    for page in TWINS_DATA:
        out_path = DOCS / page["slug"].lstrip("/")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = render_twin_page(page)
        out_path.write_text(html, encoding="utf-8")
        written.append(out_path.name)
        _safe_print(f"  [TWIN]   {page['slug']}  ({len(html):,} bytes)")

    # 3. Hub
    all_killer_links = [(p["slug"], p["breadcrumb"]) for p in ALL_KILLERS]
    all_twin_links = [(p["slug"], p["breadcrumb"]) for p in TWINS_DATA]
    out_path = DOCS / HUB["slug"].lstrip("/")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    html = render_hub_page(HUB, all_killer_links, all_twin_links)
    out_path.write_text(html, encoding="utf-8")
    written.append(out_path.name)
    _safe_print(f"  [HUB]    {HUB['slug']}  ({len(html):,} bytes)")

    _safe_print("")
    _safe_print(f"=== {len(written)} files written ===")
    for n in written:
        _safe_print(f"  {n}")


if __name__ == "__main__":
    main()

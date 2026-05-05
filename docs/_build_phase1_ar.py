#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 3 - AR Killer-URL Builder (RTL-pflicht)
Generates 15 AR pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_AR_FINAL_MASTER_PLAN.md.

Run: py docs/_build_phase1_ar.py
Idempotent: overwrites existing files. Output: docs/ar/

AR/MENA-Cultural-Rules:
- RTL-Layout PFLICHT: <html lang="ar" dir="rtl">
- KEIN Saudi-Bashing - Saudi-PIF besitzt Pokemon GO seit Maerz 2025!
- Mukamil-Frame (Komplement) statt Konkurrenz fuer Pokemon GO
- Title 30-40 char (AR ist effizient)
- Ramadan-Page (K4) sehr respektvoll
- Vision-2030-Page (K7) staatlich-passend
- Familie-Frame, Hund-Persona deprioritisiert
- WhatsApp + Snapchat dominant
- Reviews mit translationOfWork zum DE-Original
- Pill-Label: "من النسخة التجريبية المغلقة"
- SAR-Pricing
- Noto Sans Arabic preload
"""

import json
from pathlib import Path

DOCS = Path(__file__).resolve().parent
AR_DIR = DOCS / "ar"
SITE = "https://mapraiders.com"
LANG = "ar"
LANG_PREFIX = "/ar"

# -----------------------------------------------------------------------------
# HREFLANG + LANG-SWITCHER
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
# AR-Tester (Master-Plan §1.2)
# -----------------------------------------------------------------------------

TESTER_RON = {
    "name": "Ron C.",
    "role": "صاحب كلب · منطقة شتوتغارت",
    "role_long": "صاحب كلب من منطقة شتوتغارت (نسخة تجريبية مغلقة)",
    "quote": "كلبي يحب نزهته — وأنا أحب أن كل نزهة تجعل حيي أكثر وضوحاً على الخريطة. لقد فتحت كل شارعي بالفعل.",
    "date": "2026-03-15",
    "id": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "عدّاءة · منطقة هامبورغ",
    "role_long": "عدّاءة من منطقة هامبورغ (نسخة تجريبية مغلقة)",
    "quote": "أركض كل صباح أصلاً. مع MapRaiders كل مسار له هدف: الحفاظ على المنطقة أو استعادتها. تفجر دافعي القلبي.",
    "date": "2026-03-22",
    "id": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "مستكشف مديني · منطقة برلين",
    "role_long": "مستكشف مديني من منطقة برلين (نسخة تجريبية مغلقة)",
    "quote": "ترك أصداء ورؤية من يجدها مثل لعبة بحث عن الكنز مفتوحة عبر المدينة كلها.",
    "date": "2026-04-01",
    "id": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

FOUNDER_QUOTE = (
    "كنت أحد لاعبي بوكيمون جو الذين شعروا بالإحباط. أردت منطقة حقيقية، "
    "وليس التقاط جيم عابر. لم أكن أرغب في بيع خطواتي لصناديق سيادية، "
    "ولا نموذج إعلاني، ولا اشتراك premium إلزامي. لذلك بنيت MapRaiders. "
    "هذا ميدان بيتي — وقريباً سيكون لك."
)

# Pricing-Offers SAR (Master-Plan §1.1)
PRICING_OFFERS = [
    {"name": "مجاني للأبد", "price": "0", "currency": "SAR"},
    {"name": "عناصر تجميلية (الأدنى)", "price": "7", "currency": "SAR"},
    {"name": "MapRaiders دائم (شهري)", "price": "19", "currency": "SAR"},
    {"name": "دائم للحياة", "price": "499", "currency": "SAR"},
]

# DefinedTermSet AR (Master-Plan §8)
DEFINED_TERMS = [
    ("منطقة", "منطقة على الخريطة تم احتلالها وتم تخصيصها بشكل دائم للاعب أو العشيرة"),
    ("صدى", "إشارة صوتية أو صورة أو فيديو تركها لاعب في موقع، يمكن لآخرين اكتشافها"),
    ("لعبة دفاع مصغرة", "لعبة مصغرة (إكس-أوه، حجر-ورقة-مقص، شطرنج مصغر) يتم تشغيلها أثناء النزاع على المنطقة"),
    ("مهمة", "مهمة مصغرة أنشأها لاعب يمكن للآخرين إكمالها في العالم الحقيقي"),
    ("عشيرة", "مجموعة عضوية من اللاعبين يحتفظون ويدافعون عن المناطق معاً"),
    ("اترك صدى", "إجراء ترك صدى في موقع حقيقي"),
    ("تلاشي المنطقة", "آلية يتم بموجبها تدهور المناطق المهجورة بمرور الوقت"),
    ("قطعة أثرية", "عنصر قابل للجمع، صنعه لاعب ووضعه في منطقة"),
]


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def hreflang_block(slug):
    out = []
    for lang, prefix in HREFLANG:
        if lang == "ar":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}/">')
    return "\n".join(out)


def lang_switcher_html(active="ar"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">من النسخة التجريبية المغلقة</div>
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
.fr-label{{font-size:11px;font-weight:700;letter-spacing:2px;color:var(--accent);margin-bottom:14px}}
.fr-card{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:36px;margin-bottom:32px;box-shadow:0 2px 12px rgba(20,18,16,.04);text-align:right}}
.fr-card.founder{{border-right:4px solid var(--accent);border-left:none;display:flex;gap:24px;align-items:flex-start;flex-direction:row-reverse}}
.fr-card.founder img{{width:88px;height:88px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid var(--border)}}
.fr-card.founder .fr-body{{flex:1}}
.fr-quote{{font-size:18px;line-height:1.85;color:var(--text);font-weight:500;margin-bottom:20px}}
.fr-author{{font-size:14px;font-weight:700;color:var(--text)}}
.fr-role{{font-size:13px;color:var(--muted);margin-top:2px}}
.fr-stars{{color:#F5A623;font-size:14px;letter-spacing:2px;margin-bottom:14px}}
.fr-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:32px}}
.fr-grid .fr-card{{margin-bottom:0}}
@media(max-width:640px){{.fr-sec{{padding:60px 0}}.fr-card{{padding:28px}}.fr-card.founder{{flex-direction:column}}}}
</style>
<section class="fr-sec">
  <div class="mx">
    <div class="fr-label">من المؤسس</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="رينيه سكافارتي، مؤسس MapRaiders" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">المؤسس، Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">من النسخة التجريبية المغلقة</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.85">
      ملاحظة: المختبرون مشاركون داخليون في النسخة التجريبية المغلقة. الأصل الألماني، ويتم تمييزه في Schema بـ <code>translationOfWork</code>. الاسم الأول والحرف الأول فقط لأسباب تتعلق بالخصوصية.
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    """AR sharing - WhatsApp dominant in Gulf, Snapchat for KSA, X (Saudi Top-3 weltweit pro Capita)."""
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px;direction:rtl}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;color:var(--muted);margin-left:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="مشاركة"><span class="mr-share__label">مشاركة:</span><a class="mr-share__btn" href="https://wa.me/?text={enc}" target="_blank" rel="noopener noreferrer">واتساب</a><a class="mr-share__btn" href="https://www.snapchat.com/scan?attachmentUrl={enc}" target="_blank" rel="noopener noreferrer">سناب شات</a><a class="mr-share__btn" href="https://twitter.com/intent/tweet?url={enc}" target="_blank" rel="noopener noreferrer">𝕏</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">تيليجرام</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/agb.html">شروط الاستخدام</a><a href="/datenschutz.html">سياسة الخصوصية</a><a href="/impressum.html">معلومات الناشر</a><a href="/kontakt.html">اتصل بنا</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; حيّك، منطقتك. منتج من Scafa Investments LLC.</p>
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
  <a href="/ar/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/ar/#features" class="lnk">الميزات</a>
    <a href="/ar/MapRaiders-tajriba.html" class="lnk">التجارب</a>
    <div class="lang-sw">
      <button class="lsw-btn">AR <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('ar')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">قريباً</a>
  </div>
</div>
</nav>"""


def base_css():
    """RTL-aware CSS. Mirrors margins, paddings, text-align where needed."""
    return """*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:hidden}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;font-family:Outfit,"Noto Sans Arabic",system-ui,sans-serif;text-align:right}
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
.nav-logo{font-size:14px;font-weight:800;letter-spacing:3.5px;text-transform:uppercase;color:var(--text);font-family:Outfit,sans-serif}
.nav-logo b{color:var(--accent)}
.nav-r{display:flex;gap:24px;align-items:center}
.nav-r a.lnk{font-size:13px;font-weight:500;color:var(--muted);transition:color .2s}.nav-r a.lnk:hover{color:var(--text)}
.btn-dl{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;padding:9px 20px;border-radius:6px;background:var(--accent);color:#fff;transition:opacity .2s,transform .2s}.btn-dl:hover{opacity:.88;transform:translateY(-1px)}
.lang-sw{position:relative}
.lsw-btn{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);padding:5px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:5px;background:none;border:none;font-family:Outfit,sans-serif}
.lsw-drop{position:absolute;top:calc(100% + 6px);left:0;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:6px;min-width:148px;display:none;z-index:200;box-shadow:0 12px 40px rgba(0,0,0,.10);flex-direction:column;gap:1px}
.lang-sw:hover .lsw-drop,.lang-sw:focus-within .lsw-drop{display:flex}
.lsw-btn .chev{width:9px;height:9px;opacity:.5;transition:transform .2s}
.lang-sw:hover .lsw-btn .chev{transform:rotate(180deg)}
.lswi{font-size:13px;font-weight:500;color:var(--muted);padding:7px 12px;border-radius:7px;text-decoration:none;white-space:nowrap;transition:all .15s;display:block;text-align:right}
.lswi:hover{color:var(--text);background:var(--surface)}
.lswi.on{color:var(--accent);background:var(--accent-m);font-weight:700;pointer-events:none}
@media(max-width:900px){.lang-sw{display:none}}@media(max-width:740px){.nav-r a.lnk{display:none}}
.hero{padding:160px 0 100px;border-bottom:1px solid var(--border)}
.h-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent);padding:6px 14px;border-radius:4px;background:var(--accent-m);border:1px solid var(--accent-b);margin-bottom:28px}
.hero h1{font-size:clamp(36px,5.8vw,72px);font-weight:900;line-height:1.15;letter-spacing:-1px;margin-bottom:24px}
.hero h1 em{font-style:normal;color:var(--accent)}
.hero p.lead{font-size:17px;color:var(--muted);line-height:1.95;max-width:680px;margin-bottom:32px}
.hero .pricing-pill{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text);background:#FFE066;padding:6px 14px;border-radius:99px;margin-bottom:18px}
.trigger-quote{margin:40px 0 0;padding:24px 28px;border-right:4px solid var(--accent);border-left:none;background:var(--surface);border-radius:12px 0 0 12px;font-size:16px;line-height:1.95;color:var(--text);max-width:720px}
.trigger-quote cite{display:block;margin-top:14px;font-style:normal;font-size:13px;color:var(--muted);font-weight:600}
.btn-p{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;padding:16px 36px;border-radius:6px;background:var(--accent);color:#fff;transition:all .25s}.btn-p:hover{transform:translateY(-2px);opacity:.9}
.sec{padding:90px 0;border-bottom:1px solid var(--border)}
.sec-label{font-size:11px;font-weight:700;letter-spacing:2px;color:var(--accent);margin-bottom:14px}
.sec-title{font-size:clamp(24px,3.5vw,40px);font-weight:800;letter-spacing:-1px;line-height:1.3;margin-bottom:24px}
.sec-title em{font-style:normal;color:var(--accent)}
.prose p{font-size:15px;color:var(--muted);line-height:1.95;margin-bottom:20px;max-width:820px}
.prose strong{color:var(--text);font-weight:700}
.prose ul{margin:16px 24px 22px 0;color:var(--muted);font-size:15px;line-height:1.95;max-width:820px;padding-right:20px}
.prose ul li{margin-bottom:8px}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:36px}
.feat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:32px;transition:all .3s;text-align:right}
.feat-card:hover{border-color:var(--accent-b);transform:translateY(-3px)}
.feat-card h3{font-size:18px;font-weight:700;margin-bottom:12px;line-height:1.4}
.feat-card p{font-size:14px;color:var(--muted);line-height:1.85}
.comp-table{width:100%;border-collapse:collapse;margin-top:32px;border:1px solid var(--border);border-radius:12px;overflow:hidden;font-size:14px}
.comp-table thead{background:var(--bg-alt)}
.comp-table th{padding:16px 18px;text-align:right;font-weight:700;font-size:13px;border-bottom:1px solid var(--border)}
.comp-table td{padding:14px 18px;border-bottom:1px solid var(--border);color:var(--muted);line-height:1.7;text-align:right}
.comp-table tr:last-child td{border-bottom:none}
.feat-name{color:var(--text);font-weight:600}
.check{color:#10B981;font-weight:700}.cross{color:#EF4444;font-weight:700}
.faq-list{margin-top:36px;display:flex;flex-direction:column;gap:2px}
.faq-item{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:22px 28px;cursor:pointer;font-size:16px;font-weight:600;gap:16px;line-height:1.5}
.faq-q svg{flex-shrink:0;color:var(--accent);transition:transform .3s}
.faq-item.open .faq-q svg{transform:rotate(45deg)}
.faq-a{display:none;padding:0 28px 22px;font-size:15px;color:var(--muted);line-height:1.95}
.faq-item.open .faq-a{display:block}
.cta-sec{padding:90px 0;text-align:center}
.cta-sec h2{font-size:clamp(26px,4vw,46px);font-weight:800;letter-spacing:-1px;margin-bottom:16px;line-height:1.3}
.cta-sec p{font-size:15px;color:var(--muted);margin-bottom:32px;line-height:1.85}
.cta-note{font-size:12px;color:var(--dim);margin-top:12px}
.links-row{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;margin-top:32px}
.links-row a{font-size:14px;font-weight:600;color:var(--accent);text-decoration:underline;text-underline-offset:3px}
footer{padding:40px 0 32px;border-top:1px solid var(--border)}
.f-i{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.f-logo{font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--dim);font-family:Outfit,sans-serif}
.f-links{display:flex;gap:22px;flex-wrap:wrap}
.f-links a{font-size:12px;color:var(--muted);transition:color .2s}.f-links a:hover{color:var(--text)}
.f-copy{width:100%;text-align:center;margin-top:20px;font-size:11px;color:var(--dim);line-height:1.7}"""


def fonts_preload():
    return """<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;700;900&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;700;900&display=swap">"""


# -----------------------------------------------------------------------------
# SCHEMA BUILDERS
# -----------------------------------------------------------------------------

def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "الرئيسية", "item": f"{SITE}/ar/"},
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
            "inLanguage": "ar",
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
            "inLanguage": "ar",
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
            "inLanguage": "ar",
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
            "jobTitle": "المؤسس",
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
            "@id": f"{SITE}{page['slug']}#brand-vocab-ar",
            "name": "MapRaiders Brand Vocabulary (AR)",
            "inLanguage": "ar",
            "hasDefinedTerm": defined_terms,
        },
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "الرئيسية", "item": f"{SITE}/ar/"},
        {"@type": "ListItem", "position": 2, "name": "التجارب", "item": f"{SITE}/ar/MapRaiders-tajriba.html"},
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
            "inLanguage": "ar",
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
            "inLanguage": "ar",
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
            "inLanguage": "ar",
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
        "name": "MapRaiders AR — جميع الصفحات والتجارب",
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
  <div class="sec-label rv">الأسئلة الشائعة</div>
  <h2 class="sec-title rv d1"><em>أسئلة متكررة</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">استكشف <em>المزيد</em></h2>
  <p class="rv d1">مواضيع ذات صلة في عالم MapRaiders:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">قريباً على Google Play &bull; مجاني &bull; بدون إزعاج</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">أبلغني عند الإطلاق</a>
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
<html lang="ar" dir="rtl" data-theme="light">
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
<meta property="og:locale" content="ar_SA">
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
    أبلغني عند الإطلاق
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
  <div class="sec-label rv">التقييم</div>
  <h2 class="sec-title rv d1">5.0 / 5 — <em>3 تقييمات تجريبية موثوقة</em></h2>
  <div class="prose rv d2">
    <p>ثلاثة مختبرين تجريبيين من ألمانيا — صاحب كلب، عدّاءة، ومستكشف مديني — استخدموا MapRaiders على مدار عدة أسابيع. التعليقات التالية مكتوبة في الأصل بالألمانية وتمثل أشخاصاً حقيقيين من النسخة التجريبية المغلقة. لأسباب تتعلق بالخصوصية، نستخدم الاسم الأول والحرف الأول فقط.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">
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
<meta property="og:locale" content="ar_SA">
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
  <div class="h-badge rv">التجارب</div>
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
        f'<h3>{name}</h3><p style="color:var(--muted)">المزيد ←</p></a>'
        for slug, name in all_killers
    )
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">تجربة ←</p></a>'
        for slug, name in all_twins
    )

    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">مركز الموضوعات</div>
  <h2 class="sec-title rv d1">جميع <em>موضوعات MapRaiders</em> في مكان واحد</h2>
  <div class="prose rv d2">
    <p>هنا ستجد جميع صفحات MapRaiders السبع الرئيسية بالإضافة إلى 7 تقارير تجريبية تستعرض التطبيق من زوايا مختلفة — من المكمّل لبوكيمون جو إلى لعبة رمضان، من لعبة الموقع إلى ألعاب رؤية 2030. كل صفحة قائمة بذاتها؛ ومعاً ترسم الصورة الكاملة.</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">التجارب بالتفصيل</div>
  <h2 class="sec-title rv d1">ما يقوله المختبرون من <em>زوايا مختلفة</em></h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">التقييم الإجمالي</div>
  <h2 class="sec-title rv d1">5.0 / 5 — <em>3 تقييمات تجريبية موثوقة</em></h2>
  <div class="prose rv d2">
    <p>جميع التقييمات مأخوذة من النسخة التجريبية المغلقة (فبراير-أبريل 2026). ثلاثة مختبرين — صاحب كلب، عدّاءة، ومستكشف مديني — اختبروا MapRaiders على مساراتهم الخاصة في شتوتغارت وهامبورغ وبرلين. التقييمات الأصلية بالألمانية وتمثل أشخاصاً حقيقيين.</p>
  </div>
</div>
</section>"""

    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])

    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">
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
<meta property="og:locale" content="ar_SA">
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
  <div class="h-badge rv">مركز MapRaiders</div>
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
    "slug": "/ar/territory-game.html",
    "breadcrumb": "لعبة المنطقة",
    "title": "لعبة المنطقة — احتلّ حيك بالعربية",
    "og_title": "لعبة المنطقة — MapRaiders",
    "meta": "لعبة المنطقة الأولى بالعربية بالكامل: امشِ، احتلّ شوارع حقيقية، دافع عنها بألعاب صغيرة. مجاني، خفيف على البطارية، عائلي.",
    "keywords": "لعبة المنطقة, لعبة أراضي, GPS, MMO, لعبة موقع, لعبة عربية, MapRaiders",
    "badge": "لعبة المنطقة",
    "pricing_pill": "مجاني · عناصر تجميلية اختيارية من ر.س ٧",
    "h1_html": 'لعبة المنطقة — <em>احتلّ حيك الحقيقي</em> بالعربية',
    "lead": "لعبة المنطقة الأولى التي تحوّل خريطة GPS إلى مساحة حقيقية تملكها. امشِ في شوارع حيك لتطالب بها، دافع عنها بألعاب صغيرة، شكّل عشيرة مع جيرانك. بالعربية بالكامل، خفيفة على البطارية، بدون إعلانات، مناسبة للعائلة.",
    "trigger": {
        "quote": "اكتشف حيك الحقيقي.",
        "author": "MapRaiders — رؤية الفريق"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "المفهوم",
            "title": "ما هي <em>لعبة المنطقة</em>؟",
            "body": """
    <p><strong>لعبة المنطقة</strong> هي لعبة تحتل فيها مساحات حقيقية على الخريطة، تحافظ عليها، وتوسّعها. تختلف عن ألعاب الموقع التقليدية في أن المنطقة <strong>تبقى لك بشكل دائم</strong> — وليس مجرد نقطة عابرة.</p>
    <p>أربع آليات أساسية للعبة المنطقة الحقيقية:</p>
    <ul>
      <li><strong>الاستمرارية.</strong> المنطقة المُحتلة تبقى لك أو لعشيرتك حتى أثناء عدم الاتصال.</li>
      <li><strong>التلاشي.</strong> المناطق المهجورة تتقلص مع الوقت — لا أحد يحتكر إلى الأبد.</li>
      <li><strong>الدفاع.</strong> عند الهجوم، تُحسم المعركة بألعاب صغيرة بين اللاعبين، لا بحساب آلي.</li>
      <li><strong>تسليم العشيرة.</strong> يمكن نقل المنطقة لرفيق أو لعشيرة، مما يخلق عمقاً اقتصادياً.</li>
    </ul>
            """,
        },
        {
            "label": "نظام MapRaiders",
            "title": "كيف يعمل <em>نظام المنطقة</em> في MapRaiders",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>الاحتلال</h3><p>مشِ، اركض، أو ركب الدراجة في الشوارع — يُرسم مسارك كمضلع منطقة على الخريطة باسمك أنت.</p></div>
    <div class="feat-card rv d1"><h3>محرك التلاشي</h3><p>المناطق التي لا تزورها بانتظام تتقلص يومياً. النشاط هو ما يحفظ المنطقة — لا الدفع.</p></div>
    <div class="feat-card rv d2"><h3>ألعاب دفاع مصغرة</h3><p>إكس-أوه، حجر-ورقة-مقص، شطرنج مصغر — 7 ألعاب تحدد المعركة. الاستراتيجية لا الوقت.</p></div>
    <div class="feat-card rv d3"><h3>مناطق العشيرة</h3><p>عدة لاعبين يتقاسمون منطقة واحدة. مناطق العشيرة أقوى ولا يستطيع مهاجم وحيد كسرها.</p></div>
  </div>""",
        },
        {
            "label": "الفارق عن بوكيمون جو",
            "title": "ما يضيفه MapRaiders <em>كمكمل</em> لبوكيمون جو",
            "body": """
    <p>بوكيمون جو لعبة موقع رائعة وتجربة مكتملة. MapRaiders ليست بديلاً لها — بل مكمّل: يضيف بُعد <strong>المنطقة الحقيقية الدائمة</strong> الذي لم تُغطه ألعاب الموقع الأخرى.</p>
    <p>اللعب الاثنين معاً ممكن وموصى به: خرج للنزهة، صَيد بوكيمون عابر، وفي الوقت نفسه سَجّل خطواتك كمنطقة دائمة. لا حاجة للاختيار.</p>
            """,
        },
    ],
    "faq": [
        {"q": "ما هي لعبة المنطقة؟",
         "a": "هي لعبة تحتل فيها مساحات حقيقية على الخريطة وتحافظ عليها مع الوقت. في MapRaiders، عندما تمشي في شارع، يصبح ذلك الشارع منطقتك المسجلة على خريطة GPS — تبقى لك حتى يستعيدها لاعب آخر."},
        {"q": "هل اللعبة مجانية تماماً؟",
         "a": "نعم. كل عناصر اللعب (المناطق، الأصداء، المهام، العشائر، ألعاب الدفاع) مجانية بالكامل. العناصر التجميلية اختيارية (من ر.س ٧) ولا تؤثر على اللعب."},
        {"q": "هل أحتاج AR أو الكاميرا؟",
         "a": "لا. MapRaiders تعمل بـ GPS والخريطة فقط. هذا يجعلها خفيفة على البطارية (تدوم 4 أضعاف ألعاب AR) وتحترم خصوصيتك."},
        {"q": "هل اللعبة بالعربية بالكامل؟",
         "a": "نعم. كل النصوص، القوائم، الأصداء، أسماء المهام، الإشعارات — كل شيء بالعربية الفصحى. واجهة RTL كاملة لا انجليزية مدسوسة."},
        {"q": "هل تعمل في رمضان والمناسبات الدينية؟",
         "a": "نعم — وهناك صفحة مخصصة للعبة رمضان مع وضع خاص للمشي بعد الإفطار وقبل التراويح. اللعبة تحترم الأوقات والتقاليد المحلية."},
    ],
    "internal_links": [
        ("/ar/location-game.html", "لعبة موقع — أفضل ٧"),
        ("/ar/pokemon-go-mukamil.html", "بوكيمون جو مكمل"),
        ("/ar/lo3bat-ramadan.html", "لعبة رمضان"),
        ("/ar/lo3bat-2030.html", "ألعاب رؤية 2030"),
        ("/ar/territory-game-tajriba.html", "تجارب لعبة المنطقة"),
        ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
    ],
}

K2 = {
    "slug": "/ar/location-game.html",
    "breadcrumb": "لعبة موقع",
    "title": "لعبة موقع — أفضل ٧ ألعاب GPS عربية ٢٠٢٦",
    "og_title": "لعبة موقع — أفضل ٧ ألعاب GPS عربية",
    "meta": "أفضل ٧ ألعاب موقع GPS بالعربية في ٢٠٢٦. مقارنة شاملة: MapRaiders، بوكيمون جو، Ingress، Pikmin، Geocaching. مجاني، عائلي.",
    "keywords": "لعبة موقع, ألعاب GPS, لعبة GPS عربية, ألعاب الموقع, لعبة خريطة, لعبة عربية ٢٠٢٦",
    "badge": "أفضل ٧ ألعاب موقع",
    "pricing_pill": "MapRaiders مجاني · عناصر تجميلية اختيارية",
    "h1_html": 'لعبة موقع — أفضل <em>٧ ألعاب GPS</em> عربية ٢٠٢٦',
    "lead": "تبحث عن لعبة موقع GPS بالعربية؟ في ٢٠٢٦ توجد خيارات متعددة — بوكيمون جو، Ingress، Geocaching، Pikmin، Monster Hunter Now، Wokamon. لكل واحدة نقاط قوتها. وحدها MapRaiders تجمع منطقة دائمة + بدون AR + بالعربية بالكامل + مناسبة للعائلة. قارن وأختار.",
    "trigger": {
        "quote": "اكتشف حيك الحقيقي.",
        "author": "MapRaiders — رؤية الفريق"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "كيف تختار",
            "title": "<em>3 معايير</em> لاختيار لعبة موقع",
            "body": """
    <p>الاختيار من بين ألعاب الموقع المتاحة يصبح أوضح عند النظر إلى ثلاث نقاط:</p>
    <ul>
      <li><strong>نظام الدفع.</strong> هل اللعب مجاني فعلاً، أم هناك اشتراكات وصناديق غنائم وضغط لشراء التذاكر؟</li>
      <li><strong>حاجة AR.</strong> ألعاب AR تستهلك البطارية بسرعة وتحتاج كاميرا، غير عملية في الحرارة الشديدة.</li>
      <li><strong>اللغة العربية.</strong> هل اللعبة عربية بالكامل (واجهة RTL، نصوص أصلية)، أم ترجمة جزئية؟</li>
    </ul>
            """,
        },
        {
            "label": "المقارنة",
            "title": "<em>أفضل ٧</em> ألعاب موقع ٢٠٢٦",
            "body": "<p>كل لعبة لها قوتها. MapRaiders تركز على المنطقة، بوكيمون جو على المجموعة، وكل واحدة تستحق التقدير لما تقدمه:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead>
      <tr><th>#</th><th>اللعبة</th><th>المُطوّر</th><th>عربية كاملة</th><th>منطقة دائمة</th><th>بدون AR</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓ كاملة</td><td class="check">✓ دائمة</td><td class="check">✓</td></tr>
      <tr><td>2</td><td class="feat-name">بوكيمون جو</td><td>Niantic / Scopely</td><td>ترجمة</td><td class="cross">جيمات عابرة</td><td class="cross">AR موصى به</td></tr>
      <tr><td>3</td><td class="feat-name">Ingress Prime</td><td>Niantic / Scopely</td><td>إنجليزية</td><td class="cross">بوابات</td><td class="check">✓</td></tr>
      <tr><td>4</td><td class="feat-name">Pikmin Bloom</td><td>Niantic / Scopely</td><td>ترجمة</td><td class="cross">✗</td><td class="check">✓</td></tr>
      <tr><td>5</td><td class="feat-name">Geocaching</td><td>Groundspeak</td><td>ترجمة</td><td class="cross">كنوز فقط</td><td class="check">✓</td></tr>
      <tr><td>6</td><td class="feat-name">Monster Hunter Now</td><td>Niantic / Scopely</td><td>ترجمة</td><td class="cross">✗</td><td class="cross">AR موصى به</td></tr>
      <tr><td>7</td><td class="feat-name">Wokamon</td><td>Wokamon Inc.</td><td>إنجليزية</td><td class="cross">✗</td><td class="check">✓</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "الفارق",
            "title": "ما تضيفه MapRaiders <em>للسوق العربي</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>عربية بالكامل</h3><p>كل النصوص، القوائم، التنبيهات، أسماء المهام والأصداء — بالعربية الفصحى. واجهة RTL أصلية لا ترجمة مدسوسة.</p></div>
    <div class="feat-card rv d1"><h3>وضع رمضان</h3><p>إعدادات خاصة لمواعيد السحور والإفطار والتراويح. مساراتك في رمضان لها معنى مضاعف.</p></div>
    <div class="feat-card rv d2"><h3>مكمّل لبوكيمون جو</h3><p>لا تحتاج للاختيار. العب الاثنين معاً — منطقتك الدائمة في MapRaiders، والمجموعة العابرة في بوكيمون جو.</p></div>
    <div class="feat-card rv d3"><h3>عائلي وآمن</h3><p>بدون إعلانات، بدون شات مفتوح، بدون مغامرات في الأماكن الحساسة. مناسب للأطفال والكبار.</p></div>
    <div class="feat-card rv d4"><h3>خفيف على البطارية</h3><p>GPS فقط، بدون AR ولا كاميرا. تدوم نزهتك حتى في حر الصيف بدون قلق على الشحن.</p></div>
  </div>""",
        },
        {
            "label": "حالات استعمال",
            "title": "MapRaiders في <em>الحياة اليومية</em>",
            "body": """
    <p>كيف يستخدمها العرب فعلاً؟ ثلاث حالات شائعة:</p>
    <ul>
      <li><strong>رمضان.</strong> نزهة بعد الإفطار، احتلال الحي، جمع الأصداء قبل التراويح. وضع خاص للموسم.</li>
      <li><strong>رؤية 2030.</strong> اكتشاف وامتلاك أماكن بوليفارد الرياض، QIDDIYA، كورنيش جدة، حي الدرعية الجديد.</li>
      <li><strong>المشي العائلي.</strong> الكورنيش، الحدائق، الأحياء الآمنة — للأطفال والكبار معاً، بدون شاشات إضافية.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "ما الفرق بين لعبة الموقع ولعبة GPS؟",
         "a": "لعبة GPS تستخدم موقعك للحركة داخل اللعبة. لعبة الموقع مصطلح أوسع يشمل أي لعبة تربط الواقع بالخريطة. MapRaiders هي الاثنان معاً — لعبة GPS من نوع MMO تجعل المنطقة الحقيقية ملكاً دائماً لك."},
        {"q": "هل MapRaiders مجانية؟",
         "a": "نعم. كل اللعب مجاني تماماً. العناصر التجميلية اختيارية (من ر.س ٧ إلى ر.س ٤٠) ولا تؤثر على اللعب. لا توجد صناديق غنائم ولا اشتراك إلزامي."},
        {"q": "هل تعمل MapRaiders في السعودية والإمارات؟",
         "a": "نعم، الخوادم محسنة للمنطقة. اللعبة بالعربية الفصحى، تتوافق مع نظام حماية البيانات السعودي PDPL، ومتاحة على Google Play."},
        {"q": "هل يمكنني لعبها مع بوكيمون جو في نفس الوقت؟",
         "a": "نعم — بل هذا المثالي. MapRaiders مكمّل لبوكيمون جو. خرج للنزهة وافتح كلتا اللعبتين: اصطد بوكيمون عابر، واحتلّ شوارع حقيقية بشكل دائم."},
        {"q": "هل اللعبة مناسبة للأطفال والعائلة؟",
         "a": "نعم. لا توجد إعلانات ولا شات مفتوح. المهام مناسبة لجميع الأعمار، والوضع العائلي يقيّد المسارات إلى الأحياء الآمنة. مثالية للنزهات العائلية بعد الإفطار."},
    ],
    "internal_links": [
        ("/ar/territory-game.html", "لعبة المنطقة"),
        ("/ar/pokemon-go-mukamil.html", "بوكيمون جو مكمل"),
        ("/ar/lo3bat-ramadan.html", "لعبة رمضان"),
        ("/ar/tatbeeq-mashy-3a2ila.html", "تطبيق المشي للعائلة"),
        ("/ar/lo3bat-bahth-kanz.html", "لعبة البحث عن الكنز"),
        ("/ar/lo3bat-2030.html", "ألعاب رؤية 2030"),
        ("/ar/location-game-tajriba.html", "تجارب لعبة الموقع"),
        ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
    ],
}

K3 = {
    "slug": "/ar/pokemon-go-mukamil.html",
    "breadcrumb": "بوكيمون جو مكمل",
    "title": "بوكيمون جو مكمل — لعبتك الثانية",
    "og_title": "بوكيمون جو مكمل — منطقتك الأخرى",
    "meta": "هل تلعب بوكيمون جو؟ MapRaiders هو لعبتك المكملة — منطقة حقيقية، ركض، صدى صوتي. لعب الاثنين معاً، خفيف على البطارية.",
    "keywords": "بوكيمون جو, مكمل, MapRaiders, لعبة موقع, GPS, ألعاب جنباً إلى جنب",
    "badge": "بوكيمون جو + MapRaiders",
    "pricing_pill": "العب الاثنين معاً · مجاني · بدون AR",
    "h1_html": 'بوكيمون جو مكمل — <em>لعبتك الثانية</em>، منطقتك الأخرى',
    "lead": "هل تلعب بوكيمون جو وتستمتع بها؟ ممتاز. MapRaiders ليست بديلاً عن بوكيمون جو ولا منافساً لها — هي <strong>لعبتك المكملة</strong> التي تضيف بُعداً مختلفاً: منطقة حقيقية دائمة، أصداء صوتية في الأماكن، عشيرة من جيرانك. خفيفة على البطارية لأنها بدون AR، فيمكن لعبها مع بوكيمون جو في نفس النزهة.",
    "trigger": {
        "quote": "كمكمل لبوكيمون جو — منطقتك الأخرى.",
        "author": "MapRaiders — رؤية الفريق"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "ليست منافساً",
            "title": "لماذا MapRaiders <em>مكمّل</em> لا منافس",
            "body": """
    <p>كثير من المقارنات تضع ألعاب الموقع في معركة مع بعضها: «أيّها أفضل؟» نحن نختار طريقاً مختلفاً. بوكيمون جو لعبة عظيمة بفلسفتها الخاصة — مجموعة، جيمات، رايدات. MapRaiders لها فلسفة أخرى — منطقة دائمة، أصداء، عشائر عضوية.</p>
    <p>هذه ليست مقارنة «أيّ أفضل»، بل اعتراف بأن <strong>كل لعبة تخدم نوعاً مختلفاً من اللاعبين ومن الأوقات</strong>. الاثنان يتعايشان بسلام في هاتفك.</p>
            """,
        },
        {
            "label": "اللعب المتوازي",
            "title": "كيف <em>تلعب الاثنين معاً</em>",
            "body": "<p>كثير من اللاعبين يفتحون التطبيقين في نفس النزهة. إليك كيف:</p>",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>قبل النزهة</h3><p>افتح بوكيمون جو لرؤية الجيمات والرايدات. افتح MapRaiders لمعرفة وضع منطقتك. خطّط مسارك وفقاً لكليهما.</p></div>
    <div class="feat-card rv d1"><h3>أثناء المشي</h3><p>بوكيمون جو في الخلفية لتجمع المشي. MapRaiders ترسم خطواتك كمنطقة دائمة. الاثنان معاً يشتغلان.</p></div>
    <div class="feat-card rv d2"><h3>الجيم vs المنطقة</h3><p>عند الجيم، شغّل بوكيمون جو لمعركة AR. ثم أغلقها واترك صدى صوتي للزوار التاليين عبر MapRaiders.</p></div>
    <div class="feat-card rv d3"><h3>البطارية</h3><p>بوكيمون جو يستهلك بشدة بسبب AR. أغلقه أحياناً واعتمد على MapRaiders فقط (GPS خفيف) لتطول النزهة.</p></div>
  </div>""",
        },
        {
            "label": "ما يضيفه MapRaiders",
            "title": "أربعة أبعاد <em>جديدة</em> لتجربة الموقع",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>منطقة دائمة</h3><p>الجيمات في بوكيمون جو تتغير ملكيتها كل ساعة. في MapRaiders شارعك يبقى لك حتى يعود لاعب آخر فعلياً ويسير فيه.</p></div>
    <div class="feat-card rv d1"><h3>أصداء صوتية</h3><p>اترك رسالة صوتية أو صورة في مكان جميل. الزوار التاليون يكتشفونها — لعبة بحث عن الكنز عبر الحي بأكمله.</p></div>
    <div class="feat-card rv d2"><h3>عشيرة من الجيران</h3><p>عشائر بوكيمون جو افتراضية وعالمية. عشائر MapRaiders عضوية — من يمشي شارعك يصبح حليفك الطبيعي.</p></div>
    <div class="feat-card rv d3"><h3>ألعاب دفاع مصغرة</h3><p>بوكيمون جو معاركها AR-style. MapRaiders معاركها لعبة فكرية صغيرة — تحدد القرار بالاستراتيجية لا بقوة الكاميرا.</p></div>
  </div>""",
        },
        {
            "label": "مقارنة هادئة",
            "title": "نقاط <em>الاختلاف</em>",
            "body": "<p>المقارنة هنا ليست لتحديد «الفائز»، بل لمساعدتك على اختيار الأنسب لكل لحظة:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>الميزة</th><th>بوكيمون جو</th><th>MapRaiders</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">المتعة الأساسية</td><td>جمع البوكيمون، الجيمات</td><td>منطقة دائمة، أصداء، دفاع</td></tr>
      <tr><td class="feat-name">AR</td><td>موصى به (يستنزف البطارية)</td><td>غير مطلوب (GPS فقط)</td></tr>
      <tr><td class="feat-name">الإعلانات</td><td>أحياناً (خاصة المناسبات)</td><td>أبداً</td></tr>
      <tr><td class="feat-name">العربية</td><td>ترجمة</td><td>أصلية بالكامل</td></tr>
      <tr><td class="feat-name">عمر البطارية</td><td>1-2 ساعة قبل الشحن</td><td>4 أضعاف أطول للنزهات</td></tr>
      <tr><td class="feat-name">اللعب جنباً إلى جنب</td><td colspan="2" class="check">✓ موصى به - الاثنان مكملان</td></tr>
    </tbody>
  </table>""",
        },
    ],
    "faq": [
        {"q": "هل عليّ ترك بوكيمون جو لاستخدام MapRaiders؟",
         "a": "أبداً. الفكرة كلها أن تلعب الاثنين معاً. بوكيمون جو لجمع المخلوقات والجيمات. MapRaiders للمنطقة الدائمة والأصداء. كلتاهما تكمل الأخرى."},
        {"q": "هل يستهلك التطبيقان البطارية كثيراً؟",
         "a": "بوكيمون جو وحده يستهلك بشدة بسبب AR. MapRaiders خفيفة (GPS فقط، بدون AR). يمكن تشغيل MapRaiders في الخلفية بينما تستخدم بوكيمون جو نشطاً، أو العكس عند الحاجة."},
        {"q": "ما الذي يضيفه MapRaiders فعلياً؟",
         "a": "أربعة أشياء غير موجودة في بوكيمون جو: (1) منطقة دائمة على الخريطة باسمك، (2) أصداء صوتية وصور تتركها للزوار التاليين، (3) عشيرة عضوية من الجيران الفعليين، (4) ألعاب دفاع مصغرة استراتيجية."},
        {"q": "هل MapRaiders بالعربية بالكامل؟",
         "a": "نعم، عربية فصحى أصلية بـ RTL كامل. ليست ترجمة. القوائم، الإشعارات، أسماء المهام، حتى الأصداء — كلها بالعربية بشكل طبيعي."},
        {"q": "متى تطلق MapRaiders في الخليج والشرق الأوسط؟",
         "a": "MapRaiders حالياً في النسخة التجريبية المغلقة على Google Play. الإطلاق العام مخطط له ٢٠٢٦. سجّل بريدك ليصلك تنبيه الإطلاق فور توفر اللعبة في منطقتك."},
    ],
    "internal_links": [
        ("/ar/territory-game.html", "لعبة المنطقة"),
        ("/ar/location-game.html", "لعبة موقع — أفضل ٧"),
        ("/ar/lo3bat-ramadan.html", "لعبة رمضان"),
        ("/ar/pokemon-go-mukamil-tajriba.html", "تجارب اللعب المتوازي"),
        ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
    ],
}

K4 = {
    "slug": "/ar/lo3bat-ramadan.html",
    "breadcrumb": "لعبة رمضان",
    "title": "لعبة رمضان — مشي بعد الإفطار",
    "og_title": "لعبة رمضان — كل خطوة لها معنى",
    "meta": "لعبة رمضان للمشي مع العائلة بعد الإفطار. مجاني، بدون إعلانات، خفيف على البطارية. كل خطوة في رمضان لها معنى.",
    "keywords": "لعبة رمضان, مشي رمضان, نزهة الإفطار, رمضان ٢٠٢٦, ألعاب رمضان, MapRaiders",
    "badge": "موسم رمضان",
    "pricing_pill": "مجاني · بدون إعلانات · مناسب لكل العائلة",
    "h1_html": 'لعبة رمضان — <em>مشي بعد الإفطار</em>، بدون إعلانات',
    "lead": "رمضان موسم خاص — صلاة، صيام، عائلة، تأمل. وأيضاً: المشي بعد الإفطار، الزيارات بين البيوت، النزهات قبل التراويح. MapRaiders تحول هذه الخطوات الموسمية إلى تجربة جميلة: منطقتك تنمو مع نزهات الإفطار، عائلتك تشارك، وكل شارع له معنى. بدون إعلانات، بدون ضغط، باحترام كامل لروحانية الموسم.",
    "trigger": {
        "quote": "كل خطوة في رمضان لها معنى.",
        "author": "MapRaiders — موسم رمضان"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "روح الموسم",
            "title": "رمضان <em>والمشي</em>",
            "body": """
    <p>رمضان ليس مجرد شهر صيام — هو إيقاع مختلف للحياة. الصباح للراحة، النهار للعمل والصلاة، المساء للعائلة والزيارات. وبعد الإفطار، الناس يتحركون: نزهة قصيرة لاستعادة النشاط قبل التراويح، أو مشي عائلي مع الأطفال في الشوارع المنعشة بعد المغرب.</p>
    <p>هذه الخطوات لها قيمة بحد ذاتها — اجتماعية، صحية، روحية. MapRaiders لا تضيف ضغطاً عليها بل <strong>تجعلها أكثر معنىً</strong>: كل شارع تمر به في نزهة الإفطار يصبح جزءاً من منطقتك.</p>
            """,
        },
        {
            "label": "الوضع الرمضاني",
            "title": "إعدادات <em>خاصة</em> بالموسم",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>توقيت السحور والإفطار</h3><p>اللعبة تتعرف على توقيت بلدك (المملكة، الإمارات، مصر، المغرب). تنبيهات اللعبة تتوقف قبل الإفطار وأثناء التراويح.</p></div>
    <div class="feat-card rv d1"><h3>وضع ما بعد الإفطار</h3><p>تنبيه لطيف بعد ساعة من الإفطار: «المشي بعد الإفطار يبارك الصحة». ابدأ نزهتك واحتلّ الحي.</p></div>
    <div class="feat-card rv d2"><h3>نزهة العائلة</h3><p>وضع عائلي خاص: المسارات تقتصر على الشوارع الآمنة قرب البيت. الأطفال يساهمون بمنطقة العائلة.</p></div>
    <div class="feat-card rv d3"><h3>أصداء رمضانية</h3><p>اترك رسالة عند فانوس جميل، عند مسجد، عند طاولة إفطار جماعي. تشاركها مع جيرانك.</p></div>
    <div class="feat-card rv d4"><h3>تحدي الجيران</h3><p>عشيرة الحي تتنافس بحماس لطيف على من يمتلك أطول مسار رمضاني. الفائز يُقدَّر في صفحة المجتمع.</p></div>
  </div>""",
        },
        {
            "label": "للعائلة",
            "title": "للأطفال <em>والكبار</em>",
            "body": """
    <p>رمضان فرصة ذهبية للأنشطة العائلية. كثير من العائلات تبحث عن طرق لإشراك الأطفال في نزهات صحية بعيداً عن الشاشات. MapRaiders تجمع الاثنين:</p>
    <ul>
      <li><strong>الأطفال (8 سنوات فأكبر).</strong> يمسكون الهاتف، يفتحون اللعبة، يحتلون الشوارع. يتعلمون الجغرافيا بصرياً.</li>
      <li><strong>الكبار.</strong> يتنافسون بلطف على عشيرة الحي. يلتقون بالجيران بشكل عضوي.</li>
      <li><strong>الجدات والأجداد.</strong> اللعبة بسيطة وعربية بالكامل. شاركهم بنزهة قصيرة بعد المغرب.</li>
      <li><strong>الأخوات والأخوة.</strong> تحدي ودي: من يحتل أكثر شارع في الأسبوع الأخير من رمضان؟</li>
    </ul>
            """,
        },
        {
            "label": "بعد رمضان",
            "title": "<em>عيد الفطر</em> ومتابعة",
            "body": """
    <p>اللعبة لا تتوقف بنهاية رمضان. وضع العيد يحتفل بمسارات الموسم، ويحفظ منطقتك الرمضانية في «أرشيف الموسم» — يمكنك زيارته في رمضان القادم لمقارنة. التطبيق يحترم خصوصية اللاعبين العرب: لا بيانات تُباع، لا إعلانات تُعرض في الأماكن الحساسة، لا مشاركة قسرية.</p>
            """,
        },
    ],
    "faq": [
        {"q": "هل اللعبة تتوقف عن العمل أثناء التراويح؟",
         "a": "اللعبة لا تتوقف، لكن الإشعارات تخفت تلقائياً في أوقات الصلاة والتراويح إذا اخترت ذلك في الإعدادات. اللعب نفسه يبقى نشطاً للذين لا يصلون التراويح في المسجد."},
        {"q": "هل MapRaiders مجانية في رمضان؟",
         "a": "نعم، اللعبة مجانية بالكامل — في رمضان وغيره. لا توجد عروض «رمضان حصري» مدفوعة، لا اشتراكات إلزامية، لا إعلانات. الموسم نفسه يكفي بهجة."},
        {"q": "ما هو وضع العائلة الرمضاني؟",
         "a": "وضع خاص يقيّد المسارات إلى الشوارع الآمنة قرب البيت، يفعّل أصداء «نزهة الإفطار» للأطفال، ويتيح حساباً عائلياً مشتركاً للوالدين."},
        {"q": "هل يمكن تركها في الخلفية أثناء الصيام؟",
         "a": "نعم، GPS يعمل بصمت بدون استهلاك بطارية كبير. يمكنك تركها مفتوحة طوال نزهة الإفطار وتسجيل المسار كاملاً. لا حاجة لفتح الكاميرا."},
        {"q": "هل اللعبة تحترم القيم الإسلامية؟",
         "a": "نعم بشكل صارم. لا توجد محتويات غير لائقة، لا ميكانيكا مقامرة، لا شات مفتوح. الأماكن الحساسة (مكة، المدينة) محجوبة برمجياً ولا يمكن إنشاء أصداء فيها."},
    ],
    "internal_links": [
        ("/ar/territory-game.html", "لعبة المنطقة"),
        ("/ar/location-game.html", "لعبة موقع — أفضل ٧"),
        ("/ar/tatbeeq-mashy-3a2ila.html", "تطبيق المشي للعائلة"),
        ("/ar/lo3bat-ramadan-tajriba.html", "تجارب لعبة رمضان"),
        ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
    ],
}

K5 = {
    "slug": "/ar/tatbeeq-mashy-3a2ila.html",
    "breadcrumb": "تطبيق المشي للعائلة",
    "title": "تطبيق المشي للعائلة — مغامرات للجميع",
    "og_title": "تطبيق المشي للعائلة — MapRaiders",
    "meta": "تطبيق المشي للعائلة بالعربية. مجاني، بدون إعلانات، آمن للأطفال. كورنيش جدة، بوليفارد الرياض، حدائق الإمارات.",
    "keywords": "تطبيق المشي للعائلة, مشي عائلي, تطبيق صحة العائلة, نزهات الأطفال, تطبيق عربي",
    "badge": "للعائلة كلها",
    "pricing_pill": "مجاني · آمن للأطفال · عربي بالكامل",
    "h1_html": 'تطبيق المشي للعائلة — <em>مغامرات حيوية</em> للجميع',
    "lead": "العائلات العربية تبحث عن أنشطة تجمع الكبار والصغار، بعيداً عن الشاشات الفردية، وقريبة من الحياة الواقعية. تطبيق MapRaiders تحوّل المشي العائلي إلى مغامرة لطيفة: الأطفال يحتلون شوارع الحي، الكبار يكتشفون الأماكن المعروفة في كورنيش جدة وبوليفارد الرياض وحدائق الإمارات. مجاني، عربي بالكامل، آمن.",
    "trigger": {
        "quote": "للعائلة كلها — أقل وقت أمام الشاشة.",
        "author": "MapRaidersا للعائلات"
    },
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {
            "label": "المشكلة الحديثة",
            "title": "المشي العائلي <em>تحت ضغط الشاشات</em>",
            "body": """
    <p>الأطفال والمراهقون في الخليج يقضون 6-8 ساعات يومياً أمام الشاشات (دراسات صحية محلية ٢٠٢٤). الوالدان يبحثان عن طرق لإخراج الأطفال من البيت بدون مقاومة. لكن المشي «العادي» ممل بنظر الأطفال — لا تحدي، لا متعة، لا قصة.</p>
    <p>MapRaiders تحل هذه المعادلة: الأطفال يمشون لأن «الحي يصبح ملكهم»، الأم والأب يكتشفون أن المشي ممتع بدون أن يكون مهمة تربوية. الكل يربح.</p>
            """,
        },
        {
            "label": "أداة العائلة",
            "title": "MapRaiders <em>كأداة عائلية</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>حساب عائلي</h3><p>والد + والدة + الأطفال يشاركون نفس المنطقة العائلية. خطوات الجميع تُحسب لمنطقة الأسرة.</p></div>
    <div class="feat-card rv d1"><h3>وضع الأطفال</h3><p>المسارات تقتصر على الشوارع الآمنة قرب البيت. لا مغامرة في أحياء بعيدة. الإشعارات لطيفة وملونة.</p></div>
    <div class="feat-card rv d2"><h3>تحديات يومية</h3><p>«اليوم: أكمل ١٠٠٠ خطوة كعائلة» أو «اكتشف صدى جديد». الكل يتعاون.</p></div>
    <div class="feat-card rv d3"><h3>بدون شات مفتوح</h3><p>لا توجد دردشة مع غرباء. التواصل محدود بقائمة الأصدقاء التي يوافق عليها الوالدان.</p></div>
  </div>""",
        },
        {
            "label": "أماكن مفضلة",
            "title": "<em>أماكن عائلية</em> في الخليج",
            "body": "<p>المسارات الموصى بها للعائلات في المدن الكبرى:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>المدينة</th><th>المكان</th><th>الوقت الأمثل</th><th>مدة المشي</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">جدة</td><td>كورنيش جدة الجديد</td><td>المساء بعد المغرب</td><td>45-90 دقيقة</td></tr>
      <tr><td class="feat-name">الرياض</td><td>بوليفارد رياض، حديقة الملك سلمان</td><td>المساء أو الفجر</td><td>60-120 دقيقة</td></tr>
      <tr><td class="feat-name">دبي</td><td>JBR Walk، الكورنيش</td><td>الصباح الباكر</td><td>45-90 دقيقة</td></tr>
      <tr><td class="feat-name">أبو ظبي</td><td>كورنيش أبو ظبي</td><td>المساء</td><td>60-90 دقيقة</td></tr>
      <tr><td class="feat-name">الدوحة</td><td>كورنيش الدوحة</td><td>المساء بعد المغرب</td><td>60 دقيقة</td></tr>
      <tr><td class="feat-name">الكويت</td><td>كورنيش السالمية</td><td>المساء</td><td>45-90 دقيقة</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "الأمان أولاً",
            "title": "<em>الأمان</em> والخصوصية",
            "body": """
    <p>الوالدان في المنطقة العربية حساسون جداً تجاه أمان الأطفال الرقمي — ومحقون في ذلك. MapRaiders صُممت بهذا في الذهن:</p>
    <ul>
      <li><strong>لا شات مفتوح.</strong> الأطفال لا يكلمون غرباء داخل التطبيق.</li>
      <li><strong>لا صور حقيقية للأطفال.</strong> الأفاتار رسومي فقط.</li>
      <li><strong>الأماكن الحساسة محجوبة.</strong> مكة، المدينة، المساجد الكبرى لا يمكن إنشاء أصداء فيها.</li>
      <li><strong>متوافق مع PDPL.</strong> نظام حماية البيانات السعودي مطبق بالكامل.</li>
      <li><strong>الأبوان يتحكمان.</strong> قائمة الأصدقاء، أوقات اللعب، نطاق المسار — كله بإذن الوالدين.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "ما الحد الأدنى لعمر الطفل؟",
         "a": "نوصي بـ 8 سنوات فأكثر. الطفل يحتاج فهم الخريطة بشكل بدائي. للأطفال الأصغر، يمكن للوالدين فتح اللعبة وإشراكهم بصرياً."},
        {"q": "هل التطبيق آمن من ناحية الإعلانات والمحتوى؟",
         "a": "نعم. لا توجد إعلانات تماماً، لا روابط خارجية، لا محتوى غير لائق. الأصداء التي يتركها اللاعبون تخضع لمراجعة ذاتية وحذف فوري عند الإبلاغ."},
        {"q": "كيف يساهم الأطفال؟",
         "a": "بطريقتين: (1) خطواتهم تُحسب في منطقة العائلة، (2) يمكنهم إنشاء أصداء بسيطة (نص أو صور حدائق وألعاب). الجميع يساهم في توسعة منطقة الأسرة."},
        {"q": "هل يعمل التطبيق في الحرارة الشديدة؟",
         "a": "نعم. التطبيق نفسه لا يحرر الهاتف لأنه بدون AR. لكن نوصي بالمشي صباحاً جداً أو مساءً في الصيف. وضع «الصيف» يقترح أوقات أنسب تلقائياً."},
        {"q": "كم يستهلك من البطارية؟",
         "a": "حوالي 4-6% للساعة الواحدة من المشي. هاتف بطاريته ٤٠٠٠ ميلي أمبير يدوم نزهة 4-5 ساعات بدون مشكلة."},
    ],
    "internal_links": [
        ("/ar/territory-game.html", "لعبة المنطقة"),
        ("/ar/location-game.html", "لعبة موقع — أفضل ٧"),
        ("/ar/lo3bat-ramadan.html", "لعبة رمضان"),
        ("/ar/lo3bat-2030.html", "ألعاب رؤية 2030"),
        ("/ar/tatbeeq-mashy-3a2ila-tajriba.html", "تجارب المشي العائلي"),
        ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
    ],
}

K6 = {
    "slug": "/ar/lo3bat-bahth-kanz.html",
    "breadcrumb": "لعبة البحث عن الكنز",
    "title": "لعبة البحث عن الكنز — مدينتك لعبة",
    "og_title": "لعبة البحث عن الكنز — MapRaiders",
    "meta": "لعبة البحث عن الكنز لكل المدينة. اترك أصداء، اكتشف ما تركه الآخرون. مجاني، عربي بالكامل، عائلي.",
    "keywords": "لعبة البحث عن الكنز, جيوكاشينغ, GPS, مغامرات, لعبة شاشة, MapRaiders",
    "badge": "بحث عن الكنز",
    "pricing_pill": "مجاني · المدينة كلها لعبة",
    "h1_html": 'لعبة البحث عن الكنز — <em>مدينتك بأكملها</em> لعبة',
    "lead": "ألعاب البحث عن الكنز التقليدية تتطلب تخطيطاً مسبقاً: مسار محدد، نقاط مُجهَّزة، قواعد معقدة. MapRaiders تختلف: المدينة بالفعل مليئة بالأصداء — رسائل صوتية وصور تركها لاعبون آخرون. اكتشفها أثناء المشي، اترك أصداءك للزوار التاليين، وحوّل كل نزهة إلى كنز ينتظرك.",
    "trigger": {
        "quote": "ترك أصداء ورؤية من يجدها.",
        "author": "Aljoscha P. — مستكشف مديني"
    },
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {
            "label": "ألعاب البحث عن الكنز ٢٠٢٦",
            "title": "<em>3 معايير</em> للبحث عن الكنز الحديث",
            "body": """
    <p>عام ٢٠٢٦، توقعات اللاعبين من «لعبة البحث عن الكنز» تطورت بشكل كبير:</p>
    <ul>
      <li><strong>الديناميكية.</strong> لا أحد يريد تخطيط مسارات مُجهَّزة. اللعبة يجب أن تكون حية، الكنوز موجودة الآن.</li>
      <li><strong>اجتماعية.</strong> الكنوز التي يتركها لاعبون آخرون أكثر إثارة من تلك التي يضعها مطور اللعبة.</li>
      <li><strong>مجانية.</strong> الجيوكاشينغ التقليدي يقفل ميزات وراء جدار الدفع. اللاعبون اليوم يفضلون التطبيقات المجانية الكاملة.</li>
    </ul>
    <p>MapRaiders تحقق المعايير الثلاثة بآلية واحدة: نظام الأصداء.</p>
            """,
        },
        {
            "label": "المقارنة",
            "title": "<em>تطبيقات</em> البحث عن الكنز",
            "body": "",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>التطبيق</th><th>المُطوّر</th><th>ديناميكي</th><th>محتوى لاعبين</th><th>مجاني</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">MapRaiders</td><td>Scafa Investments LLC</td><td class="check">✓ حي</td><td class="check">✓ أصداء</td><td class="check">✓</td></tr>
      <tr><td class="feat-name">Geocaching</td><td>Groundspeak</td><td class="check">✓</td><td class="check">✓</td><td>قيود مجاني</td></tr>
      <tr><td class="feat-name">Munzee</td><td>Munzee Inc.</td><td class="check">✓</td><td>QR codes</td><td>قيود</td></tr>
      <tr><td class="feat-name">Adventure Lab</td><td>Niantic / Scopely</td><td class="cross">سيناريوهات معدّة</td><td class="cross">رسمي فقط</td><td class="check">✓</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "نظام Echo",
            "title": "كيف يعمل <em>نظام الأصداء</em>",
            "body": """
    <p>الصدى (Echo) هو رسالة تتركها في موقع حقيقي. ثلاثة أنواع:</p>
    <ul>
      <li><strong>صدى صوتي.</strong> ١٥ ثانية تسجيل صوتي. مثال: «هذا الفرع من شجرة الأرز يشكل ظلاً جميلاً وقت العصر».</li>
      <li><strong>صدى صورة.</strong> صورة تلتقطها للموقع. الصورة تُحفظ مع إحداثيات GPS الدقيقة.</li>
      <li><strong>صدى فيديو.</strong> فيديو ٥-٢٠ ثانية. مثال: مشهد الكورنيش وقت الغروب.</li>
    </ul>
    <p>اللاعب التالي الذي يمر بمسافة ١٠ أمتار من الموقع يكتشف الصدى. كأن المدينة كلها لوحة جماعية حية.</p>
            """,
        },
        {
            "label": "للعائلات والأطفال",
            "title": "للأطفال <em>(متوافق مع PDPL)</em>",
            "body": """
    <p>الأطفال يحبون البحث عن الكنز فطرياً. MapRaiders تجعل هذه الميزة آمنة للعائلات:</p>
    <ul>
      <li><strong>أصداء العائلة.</strong> الأطفال يتركون أصداء يراها الوالدان والأخوة فقط. خصوصية كاملة.</li>
      <li><strong>وضع الحي الآمن.</strong> الأطفال يكتشفون أصداء جيرانهم فقط. لا غرباء.</li>
      <li><strong>تحديات يومية.</strong> «اليوم: اكتشف 3 أصداء جديدة في حيك».</li>
      <li><strong>بدون بيانات شخصية.</strong> الأصداء لا تربط بهوية حقيقية. PDPL مطبّقة.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "كيف يختلف عن جيوكاشينغ؟",
         "a": "جيوكاشينغ يتطلب البحث عن صناديق مادية مخفية. MapRaiders رقمية بالكامل: الأصداء رسائل افتراضية في المواقع، تكتشفها بهاتفك دون البحث الجسدي عن أي شيء مخفي."},
        {"q": "هل يمكنني ترك صدى في أي مكان؟",
         "a": "تقريباً. الأماكن الحساسة (المسجد الحرام، المسجد النبوي، المساجد الكبرى) محجوبة. الأماكن الخاصة (داخل البيوت) محجوبة بناءً على إعدادات المالك. كل مكان عام عادي مفتوح."},
        {"q": "كم يدوم الصدى؟",
         "a": "الأصداء النشطة تدوم 30 يوماً افتراضياً. اللاعبون النشطون (5+ أصداء يومياً) يمكنهم تمديد المدة. الأصداء التي يكتشفها كثيرون تُحفظ كمعالم دائمة."},
        {"q": "هل الأصداء عربية؟",
         "a": "نعم بالكامل. التسجيل الصوتي بالعربية، النصوص المكتوبة على الصور بالعربية، التصنيف باللغة العربية. RTL مطبق."},
        {"q": "ماذا لو وجدت صدى مسيئاً؟",
         "a": "زر «إبلاغ» على كل صدى. الإبلاغات تُراجع خلال 24 ساعة وتُحذف الأصداء المسيئة فوراً. حساب من يكرر الإساءة يُعلَّق."},
    ],
    "internal_links": [
        ("/ar/territory-game.html", "لعبة المنطقة"),
        ("/ar/location-game.html", "لعبة موقع — أفضل ٧"),
        ("/ar/tatbeeq-mashy-3a2ila.html", "تطبيق المشي للعائلة"),
        ("/ar/lo3bat-2030.html", "ألعاب رؤية 2030"),
        ("/ar/lo3bat-bahth-kanz-tajriba.html", "تجارب البحث عن الكنز"),
        ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
    ],
}

K7 = {
    "slug": "/ar/lo3bat-2030.html",
    "breadcrumb": "ألعاب رؤية 2030",
    "title": "ألعاب رؤية 2030 — اكتشف المملكة الجديدة",
    "og_title": "ألعاب رؤية 2030 — MapRaiders",
    "meta": "ألعاب لرؤية 2030: MapRaiders تساعدك على اكتشاف بوليفارد الرياض، QIDDIYA، كورنيش جدة. مجاني، بالعربية، خفيف على البطارية.",
    "keywords": "ألعاب رؤية 2030, رؤية 2030, بوليفارد الرياض, QIDDIYA, كورنيش جدة, الدرعية, ألعاب سعودية",
    "badge": "رؤية 2030",
    "pricing_pill": "مجاني · بالعربية الكاملة · داعم لرؤية 2030",
    "h1_html": 'ألعاب رؤية 2030 — <em>اكتشف وامتلك</em> المملكة الجديدة',
    "lead": "رؤية 2030 تحول المملكة العربية السعودية إلى وجهة رياضية وسياحية وثقافية. بوليفارد الرياض، QIDDIYA، كورنيش جدة الجديد، الدرعية التاريخية، نيوم — مشاريع تستحق الاستكشاف. MapRaiders تجمع رؤية 2030 مع نمط الحياة الصحي: امشِ في هذه المعالم الجديدة، احتلها كمناطقك، شارك أصداءك مع المجتمع. مجانية، بالعربية، تحترم خصوصيتك (PDPL).",
    "trigger": {
        "quote": "اكتشف أماكن رؤية 2030 وامتلكها.",
        "author": "MapRaiders — رؤية 2030"
    },
    "testers": ALL_TESTERS,
    "sections": [
        {
            "label": "السياق",
            "title": "رؤية 2030 <em>والنشاط البدني</em>",
            "body": """
    <p>رؤية المملكة 2030 رفعت من قطاع الرياضة والترفيه كأولوية وطنية. صندوق الاستثمارات العامة استثمر $38 مليار في صناعة الألعاب وحدها. برنامج جودة الحياة يستهدف رفع نسبة الممارسين للنشاط البدني من 13% إلى 40% بحلول 2030.</p>
    <p>هذا يخلق فرصة فريدة: <strong>تطبيقات تحوّل النشاط البدني إلى متعة</strong>. MapRaiders تعمل في هذا الفضاء بالضبط — لكنها تركز على ركن لم تركز عليه التطبيقات الأخرى: <strong>المعالم الجديدة لرؤية 2030 كملاعب أصلية</strong>.</p>
            """,
        },
        {
            "label": "الوجهات",
            "title": "<em>وجهات رؤية 2030</em> داخل MapRaiders",
            "body": "<p>المعالم الكبرى لرؤية 2030 محسّنة للعب MapRaiders:</p>",
            "extra": """  <table class="comp-table rv d2">
    <thead><tr><th>الوجهة</th><th>المدينة</th><th>الميزة الخاصة</th><th>مدة المسار</th></tr></thead>
    <tbody>
      <tr><td class="feat-name">بوليفارد الرياض</td><td>الرياض</td><td>أصداء فريدة، مناطق ضخمة قابلة للاحتلال</td><td>1-3 ساعات</td></tr>
      <tr><td class="feat-name">QIDDIYA</td><td>الرياض</td><td>تحدي الافتتاح ٢٠٢٦، عشيرة الترفيه</td><td>2-4 ساعات</td></tr>
      <tr><td class="feat-name">كورنيش جدة الجديد</td><td>جدة</td><td>أصداء البحر، أوقات الإفطار في رمضان</td><td>1-2 ساعة</td></tr>
      <tr><td class="feat-name">الدرعية التاريخية</td><td>الرياض</td><td>أصداء تراثية، مسارات الأزقة الأصلية</td><td>1-2 ساعة</td></tr>
      <tr><td class="feat-name">حديقة الملك سلمان</td><td>الرياض</td><td>أكبر حديقة عمودية، عائلية</td><td>2-3 ساعات</td></tr>
      <tr><td class="feat-name">نيوم (المرحلة 1)</td><td>تبوك</td><td>وضع الافتتاح، تحديات نيوم</td><td>متعدد</td></tr>
    </tbody>
  </table>""",
        },
        {
            "label": "الميزات",
            "title": "ميزات <em>خاصة برؤية 2030</em>",
            "body": "",
            "extra": """  <div class="features-grid">
    <div class="feat-card rv"><h3>أوسمة الرؤية</h3><p>اجمع أوسمة لكل معلم تكتمل: «بوليفارد رياض الكامل»، «QIDDIYA الافتتاح»، «كورنيش جدة الجديد».</p></div>
    <div class="feat-card rv d1"><h3>عشيرة المملكة</h3><p>عشائر خاصة بالمناطق السعودية. تحديات بين عشيرة الرياض وعشيرة جدة وعشيرة الشرقية.</p></div>
    <div class="feat-card rv d2"><h3>اليوم الوطني</h3><p>وضع خاص في 23 سبتمبر. أصداء وطنية، أوسمة محدودة، احتفال مجتمعي.</p></div>
    <div class="feat-card rv d3"><h3>تحديات الموسم</h3><p>تتزامن مع موسم الرياض، موسم جدة، أيام التراث الوطنية. كل موسم له أوسمة خاصة.</p></div>
  </div>""",
        },
        {
            "label": "PDPL والخصوصية",
            "title": "متوافق مع <em>PDPL</em>",
            "body": """
    <p>نظام حماية البيانات السعودي PDPL (Personal Data Protection Law) دخل حيز التنفيذ كاملاً ٢٠٢٦. MapRaiders صُممت ليس فقط للامتثال — بل لتجاوز المتطلبات:</p>
    <ul>
      <li><strong>حق المعرفة.</strong> صفحة «بياناتي» تعرض كل ما يحفظه التطبيق عنك.</li>
      <li><strong>حق الحذف.</strong> زر واحد لحذف الحساب وكل البيانات نهائياً، خلال 30 يوماً.</li>
      <li><strong>التشفير.</strong> كل البيانات الحساسة مشفرة AES-256-GCM.</li>
      <li><strong>الموقع داخل المملكة.</strong> خوادم MENA-region تستخدم لتسريع الأداء وتطمين البيانات.</li>
      <li><strong>عمر الأطفال.</strong> الأطفال (عمر <13) يحتاجون إذن الوالد بشكل صريح ضمن العائلة.</li>
    </ul>
            """,
        },
    ],
    "faq": [
        {"q": "هل MapRaiders جزء من برنامج رؤية 2030 رسمياً؟",
         "a": "MapRaiders تطبيق مستقل من Scafa Investments LLC (مقرها الولايات المتحدة)، صُمم باحترام كامل لرؤية 2030 وتطلعاتها للنمط الصحي. ليست مرتبطة رسمياً بأي جهة حكومية، لكن تطبيق متوافق مع PDPL ويدعم أهداف برنامج جودة الحياة."},
        {"q": "هل تتوفر اللعبة في كل مدن المملكة؟",
         "a": "نعم، GPS يعمل في كل أنحاء المملكة. المعالم الكبرى لرؤية 2030 لها مكافآت إضافية، لكن أحياء وقرى وضواحي المملكة كلها قابلة للاحتلال."},
        {"q": "ماذا عن مكة والمدينة؟",
         "a": "مكة المكرمة والمدينة المنورة محجوبتان برمجياً تماماً. لا يمكن إنشاء مناطق أو أصداء داخل الحرمين أو حدود الحرم. هذا قرار صارم لاحترام قدسية المكانين."},
        {"q": "هل يمكنني الانضمام لعشيرة سعودية؟",
         "a": "نعم. عشائر MapRaiders تتشكل عضوياً حسب النشاط الجغرافي. اللاعبون في الرياض ينضمون طبيعياً لعشيرة الرياض، إلخ. عشائر افتراضية كبرى أيضاً ممكنة."},
        {"q": "متى تطلق اللعبة في المملكة؟",
         "a": "MapRaiders حالياً في النسخة التجريبية المغلقة على Google Play. الإطلاق العام مخطط له ٢٠٢٦. سجّل بريدك ليصلك تنبيه الإطلاق."},
    ],
    "internal_links": [
        ("/ar/territory-game.html", "لعبة المنطقة"),
        ("/ar/location-game.html", "لعبة موقع — أفضل ٧"),
        ("/ar/tatbeeq-mashy-3a2ila.html", "تطبيق المشي للعائلة"),
        ("/ar/lo3bat-bahth-kanz.html", "لعبة البحث عن الكنز"),
        ("/ar/lo3bat-2030-tajriba.html", "تجارب رؤية 2030"),
        ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -----------------------------------------------------------------------------
# PAGE DATA - TWINS (T1-T7)
# -----------------------------------------------------------------------------

TWINS_DATA = [
    {
        "slug": "/ar/territory-game-tajriba.html",
        "breadcrumb": "تجربة لعبة المنطقة",
        "title": "تجربة لعبة المنطقة — أصوات المختبرين",
        "og_title": "تجربة لعبة المنطقة — كلمة المختبرين",
        "meta": "تجارب فعلية للعبة المنطقة من 3 مختبرين تجريبيين. كيف عاشوا أول احتلال، أول تلاشي، أول معركة دفاع.",
        "keywords": "تجربة لعبة المنطقة, تجارب MapRaiders, مراجعات",
        "h1_html": 'تجربة <em>لعبة المنطقة</em> — أصوات المختبرين',
        "lead": "كيف يبدو احتلال شارع حقيقي؟ ٣ مختبرين تجريبيين يحكون عن أول لحظة احتلال، أول صدمة تلاشي، وأول معركة دفاع مصغرة.",
        "intro_label": "محاور التجربة",
        "intro_title": "<em>ثلاثة محاور</em> للعبة المنطقة",
        "intro_body": """
    <p>عند اختبار لعبة المنطقة، نراقب ثلاثة محاور:</p>
    <ul>
      <li><strong>الاحتلال.</strong> متى شعرت أن الشارع «أصبح ملكي»؟</li>
      <li><strong>الفقد.</strong> أول تلاشي، أو هجوم لاعب آخر — كيف تستوعبه؟</li>
      <li><strong>الدفاع.</strong> ألعاب الدفاع المصغرة — استراتيجية، عادلة، مرهقة؟</li>
    </ul>
    <p>تعليقات المختبرين الثلاث تغطي هذه المحاور من زوايا مختلفة.</p>
        """,
        "internal_links": [
            ("/ar/territory-game.html", "لعبة المنطقة"),
            ("/ar/location-game.html", "لعبة موقع"),
            ("/ar/location-game-tajriba.html", "تجربة لعبة الموقع"),
            ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
        ],
    },
    {
        "slug": "/ar/location-game-tajriba.html",
        "breadcrumb": "تجربة لعبة الموقع",
        "title": "تجربة لعبة الموقع — تجارب من 3 مدن",
        "og_title": "تجربة لعبة الموقع — مختبرون",
        "meta": "تجارب لعبة الموقع: 3 مختبرين من شتوتغارت وهامبورغ وبرلين يحكون كيف عاشوا MapRaiders.",
        "keywords": "تجربة لعبة الموقع, مراجعات GPS, تجارب MapRaiders",
        "h1_html": 'تجربة <em>لعبة الموقع</em> — 3 مدن، 3 أساليب',
        "lead": "ألعاب الموقع تعتمد بقوة على كثافة اللاعبين في منطقتك. ٣ مختبرين من ٣ مدن ألمانية يحكون كيف اختلفت تجربتهم.",
        "intro_label": "3 مدن، 3 أنماط",
        "intro_title": "<em>كيف تختلف</em> لعبة الموقع جغرافياً؟",
        "intro_body": """
    <p>متعة لعبة الموقع تعتمد كثيراً على كثافة اللاعبين في منطقتك. المختبرون الثلاث يغطون ملفات حضرية مختلفة:</p>
    <ul>
      <li><strong>برلين (Aljoscha P.)</strong> — كثافة عالية من المستكشفين، أصداء كثيرة، حركة عبر الأحياء.</li>
      <li><strong>هامبورغ (Vivian N.)</strong> — عدّاؤون قرب بحيرة الألستر، تركيز قلبي.</li>
      <li><strong>شتوتغارت (Ron C.)</strong> — أصحاب الكلاب، منطق حي أهدأ.</li>
    </ul>
        """,
        "internal_links": [
            ("/ar/location-game.html", "لعبة موقع — أفضل ٧"),
            ("/ar/territory-game.html", "لعبة المنطقة"),
            ("/ar/territory-game-tajriba.html", "تجربة لعبة المنطقة"),
            ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
        ],
    },
    {
        "slug": "/ar/pokemon-go-mukamil-tajriba.html",
        "breadcrumb": "تجربة بوكيمون جو مكمل",
        "title": "تجربة المكمّل لبوكيمون جو — اللعب المتوازي",
        "og_title": "تجربة المكمّل لبوكيمون جو",
        "meta": "تجارب اللعب المتوازي: 3 مختبرين يحكون كيف لعبوا MapRaiders مع بوكيمون جو في نفس النزهة.",
        "keywords": "بوكيمون جو, مكمل, MapRaiders تجربة, لعب متوازي",
        "h1_html": 'تجربة <em>بوكيمون جو + MapRaiders</em>',
        "lead": "هل يمكن اللعب بالاثنين معاً؟ ٣ مختبرين تجريبيين يحكون عن تجربة فتح بوكيمون جو وMapRaiders في نفس النزهة.",
        "intro_label": "اللعب المتوازي",
        "intro_title": "<em>تطبيقان</em> في يد واحدة؟",
        "intro_body": """
    <p>كثير من اللاعبين يجربون اللعب المتوازي. ما اختبره المختبرون:</p>
    <ul>
      <li><strong>أثر البطارية.</strong> هل التطبيقان معاً يستهلكان كثيراً؟</li>
      <li><strong>التقسيم العملي.</strong> الصباح أيها، المساء أيها؟</li>
      <li><strong>الاستمرارية.</strong> هل اثنان يصبحان أكثر من اللازم؟</li>
    </ul>
        """,
        "internal_links": [
            ("/ar/pokemon-go-mukamil.html", "بوكيمون جو مكمل"),
            ("/ar/location-game.html", "لعبة موقع — أفضل ٧"),
            ("/ar/territory-game-tajriba.html", "تجربة لعبة المنطقة"),
            ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
        ],
    },
    {
        "slug": "/ar/lo3bat-ramadan-tajriba.html",
        "breadcrumb": "تجربة لعبة رمضان",
        "title": "تجربة لعبة رمضان — مشي بعد الإفطار",
        "og_title": "تجربة لعبة رمضان",
        "meta": "تجارب لعبة رمضان: كيف اختبر المختبرون نزهة الإفطار، وضع العائلة الرمضاني، الأصداء الموسمية.",
        "keywords": "تجربة لعبة رمضان, مراجعات رمضان, MapRaiders رمضان",
        "h1_html": 'تجربة <em>لعبة رمضان</em>',
        "lead": "كيف تشعر نزهة الإفطار في MapRaiders؟ ٣ مختبرين عاشوا الموسم بهذا التطبيق ويتشاركون التجربة.",
        "intro_label": "اختبار الموسم",
        "intro_title": "<em>محاور</em> اختبار رمضان",
        "intro_body": """
    <p>اختبرنا التجربة الرمضانية في ثلاثة محاور:</p>
    <ul>
      <li><strong>الاحترام.</strong> هل اللعبة تحترم أوقات الصلاة والتراويح؟</li>
      <li><strong>المتعة الموسمية.</strong> الأصداء الرمضانية، تحدي الجيران — كيف تشعر؟</li>
      <li><strong>العائلة.</strong> هل وضع العائلة فعلاً مناسب للأطفال؟</li>
    </ul>
        """,
        "internal_links": [
            ("/ar/lo3bat-ramadan.html", "لعبة رمضان"),
            ("/ar/tatbeeq-mashy-3a2ila.html", "تطبيق المشي للعائلة"),
            ("/ar/territory-game-tajriba.html", "تجربة لعبة المنطقة"),
            ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
        ],
    },
    {
        "slug": "/ar/tatbeeq-mashy-3a2ila-tajriba.html",
        "breadcrumb": "تجربة المشي العائلي",
        "title": "تجربة تطبيق المشي للعائلة",
        "og_title": "تجربة المشي العائلي",
        "meta": "تجارب تطبيق المشي العائلي: كيف اختبره الوالدان والأطفال. الأمان، السهولة، المتعة.",
        "keywords": "تجربة المشي العائلي, مراجعات عائلية, MapRaiders للعائلة",
        "h1_html": 'تجربة <em>تطبيق المشي للعائلة</em>',
        "lead": "هل MapRaiders فعلاً مناسبة للعائلات؟ المختبرون يجاوبون.",
        "intro_label": "محاور العائلة",
        "intro_title": "<em>اختبار</em> الأمان والمتعة",
        "intro_body": """
    <p>اختبرنا الميزات العائلية على ثلاث محاور:</p>
    <ul>
      <li><strong>الأمان.</strong> هل وضع الأطفال فعلاً يحجب الشوارع غير الآمنة؟</li>
      <li><strong>المتعة.</strong> هل الأطفال يستمتعون فعلاً، أم يملّون بسرعة؟</li>
      <li><strong>الخصوصية.</strong> هل التطبيق يحمي بيانات الأطفال (PDPL)؟</li>
    </ul>
        """,
        "internal_links": [
            ("/ar/tatbeeq-mashy-3a2ila.html", "تطبيق المشي للعائلة"),
            ("/ar/lo3bat-ramadan.html", "لعبة رمضان"),
            ("/ar/lo3bat-2030.html", "ألعاب رؤية 2030"),
            ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
        ],
    },
    {
        "slug": "/ar/lo3bat-bahth-kanz-tajriba.html",
        "breadcrumb": "تجربة البحث عن الكنز",
        "title": "تجربة لعبة البحث عن الكنز — الأصداء",
        "og_title": "تجربة البحث عن الكنز",
        "meta": "تجارب لعبة البحث عن الكنز: كيف اختبر المختبرون نظام الأصداء، الإيجاد، الترك.",
        "keywords": "تجربة البحث عن الكنز, مراجعات الأصداء, MapRaiders كنز",
        "h1_html": 'تجربة <em>البحث عن الكنز</em>',
        "lead": "نظام الأصداء يحوّل المدينة إلى لعبة. ٣ مختبرين يحكون كيف عاشوا التجربة.",
        "intro_label": "اختبار الأصداء",
        "intro_title": "<em>محاور</em> تجربة الصدى",
        "intro_body": """
    <p>اختبار الصدى تم وفقاً للمحاور التالية:</p>
    <ul>
      <li><strong>سهولة الترك.</strong> هل إنشاء صدى بسيط ومُلهم؟</li>
      <li><strong>متعة الإيجاد.</strong> ما شعور اكتشاف صدى لاعب آخر؟</li>
      <li><strong>للأطفال.</strong> هل الأطفال يستوعبون النظام؟</li>
    </ul>
        """,
        "internal_links": [
            ("/ar/lo3bat-bahth-kanz.html", "لعبة البحث عن الكنز"),
            ("/ar/tatbeeq-mashy-3a2ila.html", "تطبيق المشي للعائلة"),
            ("/ar/tatbeeq-mashy-3a2ila-tajriba.html", "تجربة المشي العائلي"),
            ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
        ],
    },
    {
        "slug": "/ar/lo3bat-2030-tajriba.html",
        "breadcrumb": "تجربة رؤية 2030",
        "title": "تجربة ألعاب رؤية 2030 — وجهات المملكة",
        "og_title": "تجربة رؤية 2030",
        "meta": "تجارب MapRaiders في معالم رؤية 2030: بوليفارد الرياض، QIDDIYA، كورنيش جدة.",
        "keywords": "تجربة رؤية 2030, مراجعات سعودية, MapRaiders السعودية",
        "h1_html": 'تجربة <em>ألعاب رؤية 2030</em>',
        "lead": "كيف يشعر اللعب في معالم رؤية 2030؟ المختبرون يحكون عن البوليفارد، QIDDIYA، الكورنيش.",
        "intro_label": "اختبار المملكة",
        "intro_title": "<em>محاور</em> اختبار رؤية 2030",
        "intro_body": """
    <p>اختبار وجهات رؤية 2030 شمل:</p>
    <ul>
      <li><strong>بوليفارد الرياض.</strong> كم هو ممتع؟ كم تستغرق المنطقة؟</li>
      <li><strong>الميزات الخاصة.</strong> الأوسمة، عشيرة المملكة، الأيام الوطنية.</li>
      <li><strong>PDPL.</strong> هل التطبيق فعلاً يحترم خصوصية المستخدم السعودي؟</li>
    </ul>
        """,
        "internal_links": [
            ("/ar/lo3bat-2030.html", "ألعاب رؤية 2030"),
            ("/ar/tatbeeq-mashy-3a2ila.html", "تطبيق المشي للعائلة"),
            ("/ar/location-game-tajriba.html", "تجربة لعبة الموقع"),
            ("/ar/MapRaiders-tajriba.html", "كل تجارب MapRaiders"),
        ],
    },
]


# -----------------------------------------------------------------------------
# HUB DATA
# -----------------------------------------------------------------------------

HUB = {
    "slug": "/ar/MapRaiders-tajriba.html",
    "breadcrumb": "تجربة MapRaiders",
    "title": "تجارب MapRaiders — كل التقييمات والمختبرين",
    "og_title": "تجارب MapRaiders — مركز الكل",
    "meta": "تجارب MapRaiders: 5.0/5 (3 تقييمات تجريبية موثوقة)، كلمة المؤسس، كل صفحات Killer والتجارب في مكان واحد.",
    "keywords": "تجربة MapRaiders, تقييمات MapRaiders, مراجعات GPS MMO, تجارب لعبة المنطقة",
    "badge": "مركز · كل التجارب",
    "pricing_pill": "5.0 / 5 — 3 تقييمات تجريبية موثوقة",
    "h1_html": '<em>تجارب MapRaiders</em> — كل ما يجب معرفته',
    "lead": "ثلاثة مختبرين تجريبيين من ألمانيا، سبعة موضوعات Killer من بوكيمون جو-مكمل إلى رؤية 2030، سبع تجارب تفصيلية. مركز واحد يجمع كل شيء.",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "ما هي MapRaiders؟",
         "a": "MapRaiders لعبة GPS من نوع MMO لأجهزة Android. اللاعبون يحتلون مناطق حقيقية بالحركة، يتركون أصداء، ينشئون مهاماً، يدافعون عن مناطقهم بألعاب صغيرة. مجاني، بدون إعلانات، بدون AR."},
        {"q": "كم عدد المختبرين؟",
         "a": "الـ 3 المعروضين علناً موافقون شخصياً، ويُذكرون بالاسم الأول والحرف الأول لأسباب الخصوصية. النسخة التجريبية المغلقة الكاملة أكبر، لكن الثلاثة يمثلون الشخصيات الرئيسية."},
        {"q": "هل التقييمات حقيقية؟",
         "a": "نعم. الثلاثة مشاركون فعليون في النسخة التجريبية المغلقة. لم يتلقوا أجراً. تعليقاتهم مكتوبة أصلاً بالألمانية ومعلَّمة في Schema.org بالتواريخ واللغة."},
        {"q": "هل يمكنني أن أصبح مختبراً؟",
         "a": "سجّل بريدك في النموذج بالصفحة الرئيسية. الفسحات تُفتح مرحلياً حسب التوفر. أصحاب المناطق ذات الكثافة المنخفضة لهم أولوية."},
        {"q": "متى الإطلاق الرسمي؟",
         "a": "MapRaiders حالياً نسخة تجريبية مغلقة على Google Play. الإطلاق الرسمي مخطط ٢٠٢٦. iOS متوقع الربع الثالث ٢٠٢٦."},
    ],
    "internal_links": [],
}


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def safe_print(s):
    """Windows cp1252 console safe print."""
    import sys
    try:
        print(s)
    except UnicodeEncodeError:
        enc = sys.stdout.encoding or "ascii"
        print(s.encode(enc, errors="replace").decode(enc, errors="replace"))


def main():
    safe_print("=== Phase 1 Session 3 - AR Killer-URL Builder (RTL) ===")
    safe_print(f"Output: {AR_DIR}")
    safe_print("")

    AR_DIR.mkdir(parents=True, exist_ok=True)
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

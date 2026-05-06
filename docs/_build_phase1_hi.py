#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 Session 4 - HI Killer-URL Builder (Hindi, Devanagari)
Generates 15 HI pages (7 Killers + 7 Twins + 1 Hub) per Master-Plan
02_HI_FINAL_MASTER_PLAN.md.

Slugs are English (Phase J Punycode-vorbeugung); Title/H1/Body/Trigger/
Tester/Founder/FAQ in Devanagari + Hinglish-Code-Switching.
inLanguage="hi", og:locale=hi_IN. INR-Pricing (PPP) gleich wie EN-IN.
K4 mohalla-game + K7 cricket-fan-app sind HI-EXKLUSIV.
WhatsApp + ShareChat-Sharing.

Run: py docs/_build_phase1_hi.py, idempotent.
"""

import json
from pathlib import Path

DOCS = Path(__file__).resolve().parent
HI_DIR = DOCS / "hi"
SITE = "https://mapraiders.com"

HREFLANG = [
    ("de", "/"), ("en", "/en/"), ("en-IN", "/en-in/"), ("fr", "/fr/"),
    ("es", "/es-mx/"), ("it", "/it/"), ("pt", "/pt-br/"), ("tr", "/tr/"),
    ("ru", "/ru/"), ("ja", "/ja/"), ("ko", "/ko/"), ("zh", "/zh-cn/"),
    ("ar", "/ar/"), ("hi", "/hi/"), ("id", "/id/"),
]

LANG_SWITCHER = [
    ("Deutsch", "de", "/"), ("English", "en", "/en/"),
    ("English (IN)", "en-IN", "/en-in/"), ("Français", "fr", "/fr/"),
    ("Español", "es", "/es-mx/"), ("Italiano", "it", "/it/"),
    ("Português", "pt", "/pt-br/"), ("Türkçe", "tr", "/tr/"),
    ("Русский", "ru", "/ru/"), ("日本語", "ja", "/ja/"),
    ("한국어", "ko", "/ko/"), ("中文", "zh", "/zh-cn/"),
    ("العربية", "ar", "/ar/"), ("हिन्दी", "hi", "/hi/"),
]

# Tester-Quotes Devanagari (Master-Plan §1.2)
TESTER_RON = {
    "name": "Ron C.",
    "role": "कुत्ते के मालिक · श्टुटगार्ट क्षेत्र, जर्मनी",
    "role_long": "श्टुटगार्ट क्षेत्र, जर्मनी से कुत्ते के मालिक (बंद बीटा)",
    "quote": "कुत्ता रोज़ दो बार बाहर जाता है, अब मैं साथ में MapRaiders भी ले जाता हूँ। थोड़ा बेवकूफ़ी जैसा लगता है, लेकिन हर रात सोने से पहले मैं चेक करता हूँ कि मेरी गली अभी भी नीली है या नहीं।",
    "date": "2026-03-15",
    "id_local": "review-ron-c-hi",
    "id_de": "review-ron-c",
}
TESTER_VIVIAN = {
    "name": "Vivian N.",
    "role": "धावक · हैम्बर्ग क्षेत्र, जर्मनी",
    "role_long": "हैम्बर्ग क्षेत्र, जर्मनी से धावक (बंद बीटा)",
    "quote": "मैं वैसे भी हर सुबह जॉगिंग करती हूँ, पर अब मैं कुछ defend भी कर रही हूँ। मेरा Alster-Round मेरा है, और बस मेरा रहना चाहिए। अजीब है कितनी discipline ये अचानक से देता है।",
    "date": "2026-03-22",
    "id_local": "review-vivian-n-hi",
    "id_de": "review-vivian-n",
}
TESTER_ALJOSCHA = {
    "name": "Aljoscha P.",
    "role": "शहरी अन्वेषक · बर्लिन क्षेत्र, जर्मनी",
    "role_long": "बर्लिन क्षेत्र, जर्मनी से शहरी अन्वेषक (बंद बीटा)",
    "quote": "आप किसी घर के दरवाज़े पर एक छोटी ऑडियो-क्लिप छोड़ देते हैं, और तीन दिन बाद वो किसी ऐसे आदमी ने ढूँढ ली जिसे आप जानते भी नहीं। एक game के लिए ये अजीब intimate लगता है।",
    "date": "2026-04-01",
    "id_local": "review-aljoscha-p-hi",
    "id_de": "review-aljoscha-p",
}
ALL_TESTERS = [TESTER_RON, TESTER_VIVIAN, TESTER_ALJOSCHA]

# Founder-Quote HI (Master-Plan §1.4)
FOUNDER_QUOTE = (
    "मैंने Pokémon GO तीन साल खेला, फिर एक दिन छोड़ दिया। जो चीज़ मुझे चाहिए थी वो "
    "कभी नहीं आई: असली ज़मीन, क्षणिक gyms नहीं। 2025 में जब Saudi-takeover हुआ, "
    "तब मेरे लिए साफ़ हो गया कि Niantic-model उस दिशा में नहीं जा रहा जो मुझे "
    "interest करती है। तो मैंने MapRaiders खुद बनाना शुरू किया। बिना ads, बिना "
    "investor-pressure, बिना mandatory subscription। मेरा मोहल्ला मेरा game है; "
    "आपका मोहल्ला आप खुद जीत सकते हैं।"
)

# INR-Pricing PPP (Master-Plan §1.1)
PRICING_OFFERS = [
    {"name": "हमेशा मुफ्त", "price": "0", "currency": "INR"},
    {"name": "Cosmetic-IAP से", "price": "19", "currency": "INR"},
    {"name": "MapRaiders समर्थक (Sub)", "price": "89", "currency": "INR"},
    {"name": "आजीवन समर्थक", "price": "1899", "currency": "INR"},
]

# DefinedTerms HI (Master-Plan §8)
DEFINED_TERMS = [
    ("क्षेत्र", "खेल में पकड़ा गया नक्शा-क्षेत्र जो स्थायी रूप से किसी खिलाड़ी या क्लान को सौंपा जाता है"),
    ("गूँज (Echo)", "किसी स्थान पर खिलाड़ी द्वारा छोड़ा गया ऑडियो/फोटो/वीडियो संकेत जिसे अन्य खिलाड़ी वहाँ खोज सकते हैं"),
    ("रक्षा मिनी-गेम", "क्षेत्र-विवाद के समय शुरू होने वाला मिनी-गेम (टिक-टैक-टो, RPS, मिनी-शतरंज)"),
    ("मिशन", "खिलाड़ी द्वारा बनाया गया छोटा कार्य जिसे अन्य लोग असली दुनिया में पूरा कर सकते हैं"),
    ("क्लान/गुट", "खिलाड़ियों का स्वाभाविक समूह जो साथ में क्षेत्रों की रक्षा करते हैं"),
    ("मोहल्ला", "आपका स्थानीय क्षेत्र: रोज़ की गलियाँ, पड़ोस, घरेलू मैदान"),
    ("क्षेत्र क्षय", "जिस तंत्र से बिना दौरे के क्षेत्र समय के साथ कमज़ोर होकर फिर से कब्ज़ा-योग्य बन जाते हैं"),
    ("इको ड्रॉप", "असली स्थान पर एक इको छोड़ने की क्रिया"),
]


# -- Helpers --

def hreflang_block(slug):
    out = []
    for lang, prefix in HREFLANG:
        if lang == "hi":
            href = f"{SITE}{slug}"
        else:
            href = f"{SITE}{prefix}"
        out.append(f'<link rel="alternate" hreflang="{lang}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{slug}">')
    return "\n".join(out)


def lang_switcher_html(active="hi"):
    items = []
    for label, code, href in LANG_SWITCHER:
        if code == active:
            items.append(f'        <span class="lswi on">{label}</span>')
        else:
            items.append(f'        <a href="{href}" class="lswi">{label}</a>')
    return "\n".join(items)


def tester_card_html(tester):
    return f"""      <div class="fr-card">
        <div class="fr-pill">बंद बीटा से</div>
        <div class="fr-stars">★★★★★</div>
        <div class="fr-quote">{tester['quote']}</div>
        <div class="fr-author">{tester['name']}</div>
        <div class="fr-role">{tester['role']}</div>
      </div>"""


def testers_section_html(testers):
    cards = "\n".join(tester_card_html(t) for t in testers)
    return f"""<!-- BETA-TESTERS + FOUNDER -->
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
    <div class="fr-label">संस्थापक की ओर से</div>
    <div class="fr-card founder">
      <img src="/assets/founder-rene-scafarti.jpg" alt="René Scafarti, MapRaiders के संस्थापक" loading="lazy">
      <div class="fr-body">
        <div class="fr-quote">{FOUNDER_QUOTE}</div>
        <div class="fr-author">René Scafarti</div>
        <div class="fr-role">संस्थापक, Scafa Investments LLC</div>
      </div>
    </div>
    <div class="fr-label" style="margin-top:48px">बंद बीटा से</div>
    <div class="fr-grid">
{cards}
    </div>
    <p style="margin-top:24px;font-size:12px;color:var(--dim);max-width:680px;line-height:1.7">
      नोट: टेस्टर बंद बीटा के आंतरिक प्रतिभागी हैं। प्राइवेसी के लिए केवल पहला नाम + initial इस्तेमाल किया जाता है। समीक्षाएँ जर्मन मूल से अनुवादित हैं; Schema.org पारदर्शिता के लिए <code>translationOfWork</code> चिह्न का उपयोग करता है।
    </p>
  </div>
</section>"""


def sharing_block_html(slug):
    url = f"{SITE}{slug}"
    enc = url.replace(":", "%3A").replace("/", "%2F")
    return f"""<!-- SHARING -->
<style>.mr-share{{margin:32px auto 16px;max-width:1180px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 28px;background:rgba(0,0,0,.02);border-radius:10px}}.mr-share__label{{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-right:8px}}.mr-share__btn{{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;transition:all .15s ease}}.mr-share__btn:hover{{border-color:var(--accent);transform:translateY(-1px)}}</style>
<div class="mr-share" aria-label="शेयर"><span class="mr-share__label">शेयर:</span><a class="mr-share__btn" href="https://wa.me/?text={enc}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a><a class="mr-share__btn" href="https://sharechat.com/share?url={enc}" target="_blank" rel="noopener noreferrer">📱 ShareChat</a><a class="mr-share__btn" href="https://t.me/share/url?url={enc}" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></div>"""


def footer_html():
    return """<footer>
<div class="mx">
  <div class="f-i">
    <div class="f-logo">MapRaiders</div>
    <div class="f-links">
      <a href="/hi/privacy.html">गोपनीयता</a><a href="/hi/terms.html">शर्तें</a><a href="/hi/imprint.html">इम्प्रिंट</a><a href="/hi/contact.html">संपर्क</a>
    </div>
  </div>
  <p class="f-copy">&copy; 2026 MapRaiders &mdash; अपना मोहल्ला जीतो। Scafa Investments LLC का उत्पाद।</p>
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
  <a href="/hi/" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="/hi/#features" class="lnk">फीचर्स</a>
    <a href="/hi/mapraiders-samiksha.html" class="lnk">समीक्षाएँ</a>
    <div class="lang-sw">
      <button class="lsw-btn">HI <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
{lang_switcher_html('hi')}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify%20India" class="btn-dl">जल्द आ रहा है</a>
  </div>
</div>
</nav>"""


def base_css():
    return """*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:hidden}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;font-family:'Noto Sans Devanagari','Outfit',sans-serif}
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
.hero h1{font-size:clamp(34px,5.5vw,68px);font-weight:900;line-height:1.15;letter-spacing:-1px;margin-bottom:24px}
.hero h1 em{font-style:normal;color:var(--accent)}
.hero p.lead{font-size:18px;color:var(--muted);line-height:1.85;max-width:640px;margin-bottom:32px}
.hero .pricing-pill{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text);background:#FFE066;padding:6px 14px;border-radius:99px;margin-bottom:18px}
.trigger-quote{margin:40px 0 0;padding:24px 28px;border-left:4px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;font-style:italic;font-size:17px;line-height:1.7;color:var(--text);max-width:720px}
.trigger-quote cite{display:block;margin-top:14px;font-style:normal;font-size:13px;color:var(--muted);font-weight:600}
.btn-p{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;padding:16px 36px;border-radius:6px;background:var(--accent);color:#fff;transition:all .25s}.btn-p:hover{transform:translateY(-2px);opacity:.9}
.sec{padding:90px 0;border-bottom:1px solid var(--border)}
.sec-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.sec-title{font-size:clamp(24px,3.6vw,40px);font-weight:800;letter-spacing:-1px;line-height:1.18;margin-bottom:24px}
.sec-title em{font-style:normal;color:var(--accent)}
.prose p{font-size:15px;color:var(--muted);line-height:1.85;margin-bottom:20px;max-width:820px}
.prose strong{color:var(--text);font-weight:700}
.prose ul{margin:16px 0 22px 24px;color:var(--muted);font-size:15px;line-height:1.9;max-width:820px}
.prose ul li{margin-bottom:8px}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:36px}
.feat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:32px;transition:all .3s}
.feat-card:hover{border-color:var(--accent-b);transform:translateY(-3px)}
.feat-card h3{font-size:18px;font-weight:700;margin-bottom:12px}
.feat-card p{font-size:14px;color:var(--muted);line-height:1.75}
.comp-table{width:100%;border-collapse:collapse;margin-top:32px;border:1px solid var(--border);border-radius:12px;overflow:hidden;font-size:14px}
.comp-table thead{background:var(--bg-alt)}
.comp-table th{padding:16px 18px;text-align:left;font-weight:700;font-size:13px;border-bottom:1px solid var(--border)}
.comp-table td{padding:14px 18px;border-bottom:1px solid var(--border);color:var(--muted)}
.feat-name{color:var(--text);font-weight:600}
.check{color:#10B981;font-weight:700}.cross{color:#EF4444;font-weight:700}
.faq-list{margin-top:36px;display:flex;flex-direction:column;gap:2px}
.faq-item{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:22px 28px;cursor:pointer;font-size:16px;font-weight:600;gap:16px}
.faq-q svg{flex-shrink:0;color:var(--accent);transition:transform .3s}
.faq-item.open .faq-q svg{transform:rotate(45deg)}
.faq-a{display:none;padding:0 28px 22px;font-size:15px;color:var(--muted);line-height:1.85}
.faq-item.open .faq-a{display:block}
.cta-sec{padding:90px 0;text-align:center}
.cta-sec h2{font-size:clamp(26px,4.2vw,46px);font-weight:800;letter-spacing:-1.5px;margin-bottom:16px}
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


# -- Schema --

def build_review_objects(testers):
    return [{
        "@type": "Review",
        "@id": f"#{t['id_local']}",
        "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
        "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
        "reviewBody": t["quote"],
        "datePublished": t["date"],
        "inLanguage": "hi",
        "translationOfWork": {"@type": "Review", "@id": f"#{t['id_de']}", "inLanguage": "de"},
    } for t in testers]


def build_schema_killer(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "होम", "item": f"{SITE}/hi/"},
        {"@type": "ListItem", "position": 2, "name": page["breadcrumb"], "item": f"{SITE}{page['slug']}"},
    ]
    testers = page.get("testers", ALL_TESTERS)
    review_objs = build_review_objects(testers)
    rcount = len(testers)
    faq_entities = [{"@type": "Question", "name": q["q"],
                     "acceptedAnswer": {"@type": "Answer", "text": q["a"]}} for q in page["faq"]]
    defined_terms = [{"@type": "DefinedTerm", "name": n, "description": d} for n, d in DEFINED_TERMS]
    graph = [
        {"@type": "WebPage", "@id": f"{SITE}{page['slug']}#webpage",
         "url": f"{SITE}{page['slug']}", "name": page["title"], "inLanguage": "hi",
         "isPartOf": {"@id": f"{SITE}/#website"},
         "breadcrumb": {"@id": f"{SITE}{page['slug']}#breadcrumb"}},
        {"@type": "BreadcrumbList", "@id": f"{SITE}{page['slug']}#breadcrumb",
         "itemListElement": breadcrumbs},
        {"@type": "MobileApplication", "@id": f"{SITE}{page['slug']}#app",
         "name": "MapRaiders", "operatingSystem": "Android",
         "applicationCategory": "GameApplication",
         "applicationSubCategory": "Location-Based Game",
         "inLanguage": "hi", "description": page["meta"],
         "offers": [{"@type": "Offer", "name": o["name"], "price": o["price"],
                     "priceCurrency": o["currency"]} for o in PRICING_OFFERS],
         "aggregateRating": {"@type": "AggregateRating", "ratingValue": "5.0",
                             "reviewCount": str(rcount), "bestRating": "5"},
         "review": [{"@id": f"#{t['id_local']}"} for t in testers],
         "publisher": {"@id": "#org-scafa"}},
        {"@type": "Organization", "@id": "#org-scafa",
         "name": "Scafa Investments LLC", "url": "https://scafa-investments.com/",
         "address": {"@type": "PostalAddress", "streetAddress": "9830 Bahama Dr",
                     "addressLocality": "Cutler Bay", "postalCode": "33189-1568",
                     "addressCountry": "US"},
         "founder": {"@id": "#person-rene"}},
        {"@type": "Person", "@id": "#person-rene", "name": "René Scafarti",
         "jobTitle": "संस्थापक", "worksFor": {"@id": "#org-scafa"},
         "description": FOUNDER_QUOTE},
        *review_objs,
        {"@type": "FAQPage", "mainEntity": faq_entities},
        {"@type": "DefinedTermSet", "@id": f"{SITE}{page['slug']}#brand-vocab-hi",
         "name": "MapRaiders ब्रांड शब्दावली हिन्दी",
         "inLanguage": "hi", "hasDefinedTerm": defined_terms},
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_twin(page):
    breadcrumbs = [
        {"@type": "ListItem", "position": 1, "name": "होम", "item": f"{SITE}/hi/"},
        {"@type": "ListItem", "position": 2, "name": "समीक्षाएँ",
         "item": f"{SITE}/hi/mapraiders-samiksha.html"},
        {"@type": "ListItem", "position": 3, "name": page["breadcrumb"],
         "item": f"{SITE}{page['slug']}"},
    ]
    review_objs = []
    for t in ALL_TESTERS:
        review_objs.append({
            "@type": "Review", "@id": f"#{t['id_local']}",
            "author": {"@type": "Person", "name": t["name"], "description": t["role_long"]},
            "reviewRating": {"@type": "Rating", "ratingValue": 5, "bestRating": 5},
            "reviewBody": t["quote"], "datePublished": t["date"],
            "inLanguage": "hi",
            "translationOfWork": {"@type": "Review", "@id": f"#{t['id_de']}", "inLanguage": "de"},
            "itemReviewed": {"@id": f"{SITE}{page['slug']}#app"},
        })
    graph = [
        {"@type": "WebPage", "@id": f"{SITE}{page['slug']}#webpage",
         "url": f"{SITE}{page['slug']}", "name": page["title"], "inLanguage": "hi",
         "breadcrumb": {"@id": f"{SITE}{page['slug']}#breadcrumb"}},
        {"@type": "BreadcrumbList", "@id": f"{SITE}{page['slug']}#breadcrumb",
         "itemListElement": breadcrumbs},
        {"@type": "MobileApplication", "@id": f"{SITE}{page['slug']}#app",
         "name": "MapRaiders", "operatingSystem": "Android",
         "applicationCategory": "GameApplication", "inLanguage": "hi",
         "aggregateRating": {"@type": "AggregateRating", "ratingValue": "5.0",
                             "reviewCount": "3", "bestRating": "5"},
         "review": [{"@id": f"#{t['id_local']}"} for t in ALL_TESTERS]},
        *review_objs,
    ]
    return {"@context": "https://schema.org", "@graph": graph}


def build_schema_hub(page, killers, twins):
    base = build_schema_killer(page)
    item_list = {"@type": "ItemList", "@id": f"{SITE}{page['slug']}#itemlist",
                 "name": "MapRaiders HI: सभी Killer + समीक्षा पेज",
                 "itemListElement": []}
    pos = 1
    for slug, name in killers + twins:
        item_list["itemListElement"].append({
            "@type": "ListItem", "position": pos,
            "url": f"{SITE}{slug}", "name": name})
        pos += 1
    base["@graph"].append(item_list)
    return base


# -- Renderers --

def render_section_html(s):
    label = s.get("label", "")
    label_html = f'<div class="sec-label rv">{label}</div>' if label else ""
    extra = s.get("extra", "")
    return f"""<section class="sec">
<div class="mx">
  {label_html}
  <h2 class="sec-title rv d1">{s['title']}</h2>
  <div class="prose rv d2">
    {s.get('body', '')}
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
  <h2 class="sec-title rv d1">अक्सर पूछे जाने वाले <em>प्रश्न</em></h2>
  <div class="faq-list">
{chr(10).join(items)}
  </div>
</div>
</section>"""


def render_internal_links_html(links):
    items = "\n".join(f'    <a href="{href}">{anchor}</a>' for href, anchor in links)
    return f"""<section class="cta-sec">
<div class="mx">
  <h2 class="rv">और गहराई में <em>क्षेत्र</em> की</h2>
  <p class="rv d1">भारत के लिए संबंधित MapRaiders विषय:</p>
  <div class="links-row rv d2">
{items}
  </div>
  <p class="cta-note">Google Play पर जल्द आ रहा है &bull; मुफ्त &bull; UPI-मित्र &bull; कोई स्पैम नहीं</p>
  <div class="rv d3" style="margin-top:32px">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify%20India%20Hindi" class="btn-p">लॉन्च पर सूचित करें</a>
  </div>
</div>
</section>"""


def render_killer_page(page):
    schema_json = json.dumps(build_schema_killer(page), ensure_ascii=False, separators=(",", ":"))
    sections_html = "\n".join(render_section_html(s) for s in page["sections"])
    faq_html = render_faq_html(page["faq"])
    links_html = render_internal_links_html(page["internal_links"])
    testers_html = testers_section_html(page.get("testers", ALL_TESTERS))
    sharing = sharing_block_html(page["slug"])
    trigger_html = ""
    if page.get("trigger"):
        trigger_html = f"""<div class="trigger-quote rv d3">
  <span>&ldquo;{page['trigger']['quote']}&rdquo;</span>
  <cite>– {page['trigger']['author']}</cite>
</div>"""
    pricing_pill = f'<div class="pricing-pill rv">{page["pricing_pill"]}</div>' if page.get("pricing_pill") else ""
    return f"""<!DOCTYPE html>
<html lang="hi" data-theme="light">
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
<meta property="og:locale" content="hi_IN">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
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
  <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify%20India%20Hindi" class="btn-p rv d3">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
    लॉन्च पर सूचित करें
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
    schema_json = json.dumps(build_schema_twin(page), ensure_ascii=False, separators=(",", ":"))
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
  <div class="sec-label rv">समीक्षाएँ</div>
  <h2 class="sec-title rv d1">5.0 / 5: <em>3 सत्यापित बीटा समीक्षाएँ</em></h2>
  <div class="prose rv d2">
    <p>तीन आंतरिक बीटा टेस्टर (एक कुत्ते के मालिक, एक धावक, एक शहरी अन्वेषक) ने कई हफ्तों तक अपनी रोज़मर्रा की routine में MapRaiders का इस्तेमाल किया। नीचे दी गई समीक्षाएँ जर्मन मूल से अनुवादित हैं और real लोगों की हैं। Privacy की वजह से सिर्फ पहला नाम + initial इस्तेमाल हुआ है। भारतीय बीटा-टेस्टर (DPDPA-compliant) Tier-2 लॉन्च के बाद जुड़ेंगे।</p>
  </div>
</div>
</section>"""
    testers_html = testers_section_html(ALL_TESTERS)
    links_html = render_internal_links_html(page["internal_links"])
    sharing = sharing_block_html(page["slug"])
    return f"""<!DOCTYPE html>
<html lang="hi" data-theme="light">
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
<meta property="og:locale" content="hi_IN">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html(page['slug'])}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">समीक्षाएँ भारत</div>
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


def render_hub_page(page, killers, twins):
    schema_json = json.dumps(build_schema_hub(page, killers, twins), ensure_ascii=False, separators=(",", ":"))
    killer_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">और पढ़ें →</p></a>'
        for slug, name in killers)
    twin_cards = "\n".join(
        f'    <a href="{slug}" class="feat-card" style="display:block;text-decoration:none">'
        f'<h3>{name}</h3><p style="color:var(--muted)">समीक्षाएँ →</p></a>'
        for slug, name in twins)
    sections_html = f"""<section class="sec">
<div class="mx">
  <div class="sec-label rv">विषय हब भारत</div>
  <h2 class="sec-title rv d1">सभी <em>MapRaiders भारत विषय</em> एक नज़र में</h2>
  <div class="prose rv d2">
    <p>यह hub भारतीय बाज़ार के लिए सभी 7 Killer पेज और 7 समीक्षा पेज एक जगह पर रखता है: Pokémon GO तुलना से लेकर क्रिकेट fan map तक, low-end Android performance से लेकर शहरी treasure hunt तक। मुफ्त, बिना विज्ञापन, UPI-मित्र। App आपके मोहल्ले के लिए बना है। Tier-1 flagships और Tier-2 budget devices दोनों पर smooth चलता है।</p>
  </div>
  <div class="features-grid">
{killer_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">विस्तार से समीक्षाएँ</div>
  <h2 class="sec-title rv d1">बीटा टेस्टर <em>विभिन्न दृष्टिकोणों से</em> क्या रिपोर्ट करते हैं</h2>
  <div class="features-grid">
{twin_cards}
  </div>
</div>
</section>

<section class="sec">
<div class="mx">
  <div class="sec-label rv">कुल रेटिंग</div>
  <h2 class="sec-title rv d1">5.0 / 5: <em>3 सत्यापित बीटा समीक्षाएँ</em></h2>
  <div class="prose rv d2">
    <p>सभी समीक्षाएँ बंद बीटा (फरवरी से अप्रैल 2026) से हैं। तीन टेस्टर (कुत्ते का मालिक, धावक, शहरी अन्वेषक) ने श्टुटगार्ट, हैम्बर्ग और बर्लिन में अपने असली रास्तों पर MapRaiders test किया, किसी artificial setting में नहीं। यहाँ दिखाई गई समीक्षाएँ जर्मन मूल से अनुवादित हैं और real लोगों की हैं। पारदर्शिता के लिए Schema.org उन्हें <code>translationOfWork</code> से चिह्नित करता है। भारतीय native बीटा (DPDPA-compliant) Tier-2 चरण में लॉन्च के बाद आएगा।</p>
  </div>
</div>
</section>"""
    testers_html = testers_section_html(ALL_TESTERS)
    sharing = sharing_block_html(page["slug"])
    return f"""<!DOCTYPE html>
<html lang="hi" data-theme="light">
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
<meta property="og:locale" content="hi_IN">
<meta name="keywords" content="{page['keywords']}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">{schema_json}</script>
<style>
{base_css()}
</style>
</head>
<body>
{nav_html(page['slug'])}

<section class="hero">
<div class="mx">
  <div class="h-badge rv">MapRaiders भारत Hub</div>
  <h1 class="rv d1">{page['h1_html']}</h1>
  <p class="lead rv d2">{page['lead']}</p>
</div>
</section>

{sections_html}

{testers_html}

{sharing}

{footer_html()}
"""


# -- KILLER DATA (Master-Plan §4) --

K1 = {
    "slug": "/hi/territory-game.html",
    "breadcrumb": "क्षेत्र खेल",
    "title": "क्षेत्र खेल: असली ज़मीन पर कब्ज़ा करने वाला GPS MMO",
    "og_title": "क्षेत्र खेल: असली GPS Territory App भारत",
    "meta": "क्षेत्र खेल क्या है? MapRaiders एक GPS MMO है जिसमें असली ज़मीन स्थायी रूप से आपकी रहती है, जब तक आप उसे defend करते हैं। मुफ्त, बिना विज्ञापन, UPI-मित्र, हर भारतीय फोन पर।",
    "keywords": "क्षेत्र खेल, territory game hindi, असली ज़मीन GPS खेल, मोहल्ला कब्ज़ा app, gps mmo hindi",
    "badge": "Territory Game · भारत",
    "pricing_pill": "₹0 गेमप्ले · Cosmetic ₹19 से · UPI-मित्र",
    "h1_html": 'क्षेत्र खेल: <em>अपना मोहल्ला जीतो</em>',
    "lead": "क्षेत्र खेल का मतलब क्या है? MapRaiders में हर गली, हर पार्क, हर चौक एक असली क्षेत्र है। आप पैदल चलकर उसे claim करते हैं, decay के खिलाफ defend करते हैं, और अपने पड़ोसियों के साथ clan बनाते हैं। ये क्षणिक gym नहीं है। ये असली ज़मीन है, जो रहती है जब तक आप वहाँ जाते हैं।",
    "trigger": {"quote": "अपना मोहल्ला जीतो।", "author": "MapRaiders Brand-Vision"},
    "testers": [TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {"label": "परिभाषा", "title": "एक असली <em>क्षेत्र खेल</em> क्या है?",
         "body": "<p>एक क्षेत्र खेल वो है जहाँ आप असली नक्शे पर असली ज़मीन claim करते हैं। MapRaiders के चार core mechanics हैं:</p><ul><li><strong>स्थायित्व:</strong> आपका क्षेत्र persistent है, कोई auto-respawn नहीं।</li><li><strong>क्षय:</strong> अगर आप वहाँ नहीं जाते, तो क्षेत्र धीरे-धीरे कमज़ोर होकर फिर से खुलता है।</li><li><strong>रक्षा मिनी-गेम:</strong> हमलावर के साथ Tic-Tac-Toe, RPS या mini-chess से fight।</li><li><strong>क्लान-हस्तांतरण:</strong> मोहल्ले के साथी मिलकर rakhsa करते हैं।</li></ul>"},
        {"label": "क्यों MapRaiders अलग है", "title": "Pokémon GO और Ingress <em>क्षेत्र खेल नहीं</em> हैं",
         "body": "<p>Pokémon GO में gym capture क्षणिक है, कुछ घंटों में कोई और उसे ले लेता है। Ingress में portals stable हैं पर कोई असली ज़मीन-स्वामित्व नहीं है। MapRaiders में आपकी पूरी गली स्थायी रूप से आपकी हो सकती है, जब तक आप वहाँ जाते हैं और defend करते हैं।</p>"},
        {"label": "Tier-2/3 तकनीक", "title": "हर <em>भारतीय फोन</em> पर smooth",
         "body": "<p>MapRaiders हर Android phone के लिए बना है, Mumbai के Tier-1 flagship user से लेकर Lucknow के Tier-2 user तक। 2GB RAM minimum, Lite-Mode 1GB पर चलता है, लगभग 5MB/घंटा data, APK 50MB से कम। UPI-payment Razorpay, PhonePe, Paytm और GPay से।</p>"},
    ],
    "faq": [
        {"q": "क्या MapRaiders सच में मुफ्त है?",
         "a": "हाँ। पूरा core gameplay (क्षेत्र, Echo, मिशन, क्लान, रक्षा मिनी-गेम) हमेशा मुफ्त रहेगा। Cosmetic-IAP ₹19 से शुरू, optional है, और कोई gameplay advantage नहीं देता।"},
        {"q": "क्या मुझे AR camera चाहिए?",
         "a": "नहीं। MapRaiders सिर्फ GPS + map use करता है। Battery 4× longer Pokémon GO से, Tier-2 phones पर भी smooth।"},
        {"q": "क्या मेरा location data sell किया जाता है?",
         "a": "नहीं। हम DPDPA-aligned हैं, कोई ad-network नहीं, कोई data-sale नहीं, कोई state-control नहीं। Pokémon GO से अलग जो March 2025 से Saudi PIF के अधीन है।"},
        {"q": "Offline काम करता है?",
         "a": "Limited। GPS offline चलता है, पर live-map sync के लिए internet चाहिए। Offline-first mode में काम चल रहा है।"},
        {"q": "iOS कब आएगा?",
         "a": "अभी Android-only (Google Play closed beta)। iOS launch Q3 2026 के लिए planned।"},
    ],
    "internal_links": [
        ("/hi/location-game.html", "स्थान आधारित खेल"),
        ("/hi/mohalla-game.html", "मोहल्ला खेल"),
        ("/hi/treasure-hunt-app.html", "खजाना खोज ऐप"),
        ("/hi/territory-game-samiksha.html", "क्षेत्र खेल समीक्षा"),
        ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ देखें"),
    ],
}

K2 = {
    "slug": "/hi/location-game.html",
    "breadcrumb": "स्थान आधारित खेल",
    "title": "स्थान आधारित खेल 2026: भारतीय फोन के लिए 7 ऐप",
    "og_title": "Location Game Hindi: 7 GPS खेल तुलना भारत",
    "meta": "स्थान आधारित खेल 2026: 7 GPS games की तुलना (MapRaiders, Pokémon GO, Pikmin Bloom, Geocaching)। UPI-मित्र, Tier-2 phone पर smooth, मुफ्त।",
    "keywords": "स्थान आधारित खेल, location game hindi, gps game india, pokemon go alternative, location based game",
    "badge": "Volumen-King · 7 खेल तुलना",
    "pricing_pill": "Tier-2 phone ready · UPI-मित्र · ₹0 gameplay",
    "h1_html": 'स्थान आधारित खेल 2026: <em>7 GPS खेल</em> भारतीय फोन के लिए तुलना',
    "lead": "ऐसा स्थान आधारित खेल खोज रहे हैं जो भारतीय wallet और भारतीय phone पर सच में चले? यहाँ 7 खेलों की honest तुलना है। MapRaiders हमारे हिसाब से सबसे आगे है, क्योंकि असली क्षेत्र-स्वामित्व, UPI और Tier-2 phone support तीनों मिलते हैं।",
    "trigger": {"quote": "मुफ्त। हर भारतीय फोन पर चलता है।", "author": "Tier-2/3 Tech-Promise"},
    "testers": ALL_TESTERS,
    "sections": [
        {"label": "तुलना तालिका", "title": "7 स्थान आधारित खेल भारत के लिए <em>तुलना</em>",
         "body": "<p>हर खेल का अपना अलग offer है। नीचे honest comparison है, बिना किसी affiliate-bias के।</p>",
         "extra": """<table class="comp-table rv d2">
<thead><tr><th>खेल</th><th>मुफ्त</th><th>UPI</th><th>Tier-2 phone</th><th>असली क्षेत्र</th></tr></thead>
<tbody>
<tr><td class="feat-name">MapRaiders</td><td class="check">✓ हमेशा</td><td class="check">✓</td><td class="check">✓ 2GB RAM</td><td class="check">✓ स्थायी</td></tr>
<tr><td class="feat-name">Pokémon GO</td><td class="cross">USD-paywall</td><td class="cross">✗</td><td class="cross">3GB+ RAM</td><td class="cross">क्षणिक gym</td></tr>
<tr><td class="feat-name">Pikmin Bloom</td><td>cosmetic-light</td><td class="cross">✗</td><td>3GB+ RAM</td><td class="cross">कोई territory</td></tr>
<tr><td class="feat-name">Geocaching</td><td class="cross">premium-paywall</td><td class="cross">✗</td><td class="check">✓</td><td class="cross">कोई territory</td></tr>
<tr><td class="feat-name">Monster Hunter Now</td><td class="cross">USD-paywall</td><td class="cross">✗</td><td class="cross">flagship-only</td><td class="cross">कोई territory</td></tr>
<tr><td class="feat-name">Ludo King (indirekt)</td><td class="check">✓ ad-heavy</td><td class="check">✓</td><td class="check">✓</td><td class="cross">कोई GPS</td></tr>
<tr><td class="feat-name">Wokamon (Walking)</td><td>limited free</td><td class="cross">✗</td><td class="check">✓</td><td class="cross">कोई territory</td></tr>
</tbody></table>"""},
        {"label": "MapRaiders का अंतर", "title": "क्यों <em>MapRaiders</em> भारत के लिए सबसे आगे है",
         "body": "<ul><li><strong>स्थायी क्षेत्र-स्वामित्व:</strong> Pokémon GO में नहीं है, Ingress में भी नहीं।</li><li><strong>UPI-payment ready:</strong> Razorpay, PhonePe, Paytm, GPay सब integrated।</li><li><strong>PPP-pricing:</strong> Cosmetic ₹19 से, कोई flat USD conversion नहीं।</li><li><strong>Tier-2 phone optimized:</strong> 2GB RAM minimum, Lite-Mode 1GB तक।</li><li><strong>DPDPA-aligned:</strong> कोई data-sale नहीं, कोई ad-network नहीं।</li></ul>"},
        {"label": "केस-Study", "title": "मोहल्ला, IPL, होली: <em>3 भारतीय use-cases</em>",
         "body": "<p><strong>मोहल्ला:</strong> सुबह की सैर पूरी गली पर कब्ज़ा बना देती है। पड़ोसी देखते हैं, WhatsApp group में बात होती है।</p><p><strong>IPL season:</strong> RCB fan Chinnaswamy stadium पर territory रखता है, MI fan Wankhede पर। Match-day पर 2x boost।</p><p><strong>होली:</strong> रंगों के निशान Echo के रूप में मोहल्ले में छोड़ें। Family-friendly mode, Tier-2 city festival।</p>"},
    ],
    "faq": [
        {"q": "क्या Pokémon GO से बेहतर है?",
         "a": "Pokémon GO में आप creature पकड़ते हैं, हमारे पास असली क्षेत्र है। दोनों अलग loops हैं। पर भारत के context में MapRaiders fairer है: मुफ्त, UPI, और Tier-2 phone पर चलता है।"},
        {"q": "Pikmin Bloom + MapRaiders साथ खेल सकते हैं?",
         "a": "हाँ। Pikmin Bloom flower-walking है, MapRaiders territory है। दोनों parallel चल सकते हैं। बैटरी पर ध्यान दें।"},
        {"q": "Geocaching के मुकाबले?",
         "a": "Geocaching में premium-paywall है। MapRaiders का core forever मुफ्त है। दोनों treasure-search करते हैं पर loop अलग।"},
        {"q": "Tier-3 city में चलेगा?",
         "a": "हाँ। Lite-Mode 1GB RAM phones पर चलता है, ~5MB/घंटा data। APK <50MB।"},
        {"q": "Cricket-IPL feature कब आएगा?",
         "a": "IPL 2026 (March-May) के साथ launch। Stadium-territories: Wankhede, Chinnaswamy, Eden Gardens, Chepauk, Arun Jaitley, Narendra Modi, Rajiv Gandhi।"},
    ],
    "internal_links": [
        ("/hi/territory-game.html", "क्षेत्र खेल"),
        ("/hi/pokemon-go-alternative-free.html", "Pokemon GO का विकल्प मुफ्त"),
        ("/hi/mohalla-game.html", "मोहल्ला खेल"),
        ("/hi/cricket-fan-app.html", "क्रिकेट प्रशंसक ऐप"),
        ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
    ],
}

K3 = {
    "slug": "/hi/pokemon-go-alternative-free.html",
    "breadcrumb": "Pokemon GO का विकल्प मुफ्त",
    "title": "Pokemon GO का विकल्प मुफ्त: UPI मित्र, बिना सऊदी",
    "og_title": "Pokemon GO Alternative Free Hindi: बिना सऊदी, UPI",
    "meta": "Pokemon GO का विकल्प मुफ्त खोज रहे हैं? MapRaiders 100% मुफ्त है, UPI-मित्र, Tier-2 phone पर smooth। बिना VPN, बिना Niantic, बिना सऊदी।",
    "keywords": "pokemon go alternative free hindi, pokemon go विकल्प, niantic refugee hindi, मुफ्त gps खेल",
    "badge": "मुफ्त · बिना सऊदी",
    "pricing_pill": "₹0 हमेशा · Cosmetic ₹19 से · कोई battle pass नहीं",
    "h1_html": 'Pokemon GO का <em>विकल्प मुफ्त</em>: बिना सऊदी, बिना battle pass',
    "lead": "Pokémon GO के साथ क्या गलत हुआ? Battle Pass की कीमतें बढ़ीं, Remote-Raid के नियम बदले, और March 2025 में Saudi-PIF acquisition के बाद Niantic अब independent नहीं रहा। MapRaiders एक honest विकल्प है: 100% मुफ्त, UPI-मित्र, DPDPA-aligned, और हर भारतीय phone पर smooth।",
    "trigger": {"quote": "बिना VPN, बिना Niantic, मुक्त भारतीय player।", "author": "Saudi-Anti-Frame"},
    "testers": [TESTER_VIVIAN, TESTER_ALJOSCHA],
    "sections": [
        {"label": "Niantic-समस्या", "title": "Pokémon GO 2026 में <em>क्या बदला</em>?",
         "body": "<ul><li><strong>Battle Pass + IAP:</strong> ARPU calculation भारतीय wallet के लिए design नहीं हुआ था।</li><li><strong>Remote-Raid-Pass:</strong> Niantic ने कीमत बढ़ाई और availability घटाई। Tier-2 fans practically cut off हो गए।</li><li><strong>Saudi-PIF, March 2025:</strong> Niantic ने अपनी game division Scopely (एक PIF subsidiary) को 3.5 billion डॉलर में बेच दी। 30 million से ज़्यादा MAU का location data अब एक foreign sovereign-fund के through जाता है।</li></ul>"},
        {"label": "मुफ्त की परिभाषा", "title": "MapRaiders में <em>मुफ्त</em> का असली अर्थ",
         "body": "<p>कोई tier-system नहीं, कोई battle-pass नहीं, कोई premium-sub force नहीं। Cosmetic-IAP ₹19 से शुरू, UPI से payment। Cosmetic items zero gameplay-advantage देते हैं, सिर्फ visual change।</p>"},
        {"label": "Saudi-Niantic प्रश्न", "title": "<em>भारतीय player का data</em> कहाँ जाता है?",
         "body": "<p>Niantic-Scopely (Saudi PIF) acquisition के बाद Pokémon GO, Ingress, Pikmin Bloom और Monster Hunter Now सब Saudi-controlled infrastructure से चलते हैं। India में DPDPA लागू है पर cross-border data flows अभी grey area में हैं। MapRaiders एक privately-held US LLC है (Scafa Investments LLC, Florida) जिसमें कोई state-control नहीं, कोई data-sale नहीं, कोई ad-network नहीं।</p>"},
    ],
    "faq": [
        {"q": "क्या MapRaiders हमेशा मुफ्त रहेगा?",
         "a": "हाँ। पूरा core gameplay हमेशा मुफ्त। Cosmetic-IAP optional, ₹19 से।"},
        {"q": "UPI काम करता है?",
         "a": "हाँ। Razorpay + PhonePe + Paytm + Google Pay India सब integrated। Apple Pay secondary।"},
        {"q": "Saudi-acquisition matter क्यों करती है?",
         "a": "Pokémon GO का location data अब Scopely के through Saudi PIF infrastructure से जाता है। DPDPA-grey-area में। MapRaiders independent US LLC है।"},
        {"q": "क्या MapRaiders ad दिखाएगा?",
         "a": "नहीं। हम 100% ad-free हैं। हम न data sell करते हैं न ad-space।"},
        {"q": "VPN चाहिए?",
         "a": "नहीं। MapRaiders India में directly चलता है, कोई geo-block नहीं।"},
    ],
    "internal_links": [
        ("/hi/territory-game.html", "क्षेत्र खेल"),
        ("/hi/location-game.html", "स्थान आधारित खेल"),
        ("/hi/mohalla-game.html", "मोहल्ला खेल"),
        ("/hi/pokemon-go-alternative-samiksha.html", "Pokemon GO विकल्प समीक्षा"),
        ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
    ],
}

K4 = {
    "slug": "/hi/mohalla-game.html",
    "breadcrumb": "मोहल्ला खेल",
    "title": "मोहल्ला खेल: अपना मोहल्ला जीतो, पड़ोसियों से जुड़ो",
    "og_title": "मोहल्ला खेल: Mohalla Game हिन्दी",
    "meta": "मोहल्ला खेल: MapRaiders आपके मोहल्ले को खेल बनाता है। पड़ोसियों से मिलें, गलियों पर कब्ज़ा करें, होली की यादें छोड़ें। मुफ्त, बिना विज्ञापन।",
    "keywords": "मोहल्ला खेल, mohalla game, neighborhood game hindi, पड़ोस खेल, मोहल्ला app",
    "badge": "HI-EXKLUSIV · Cultural-Hook",
    "pricing_pill": "मोहल्ले के लिए · WhatsApp-Native · ₹0",
    "h1_html": '<em>मोहल्ला खेल</em>: अपना मोहल्ला जीतो, पड़ोसियों से जुड़ो',
    "lead": "&ldquo;मोहल्ला&rdquo; एक ऐसा शब्द है जो neighbourhood या barrio से कहीं गहरा है। ये आपकी पहचान का हिस्सा है। MapRaiders मोहल्ले को एक खेल बनाता है: गलियों पर कब्ज़ा, पड़ोसी क्लान, होली-दिवाली Echo, और सब कुछ WhatsApp-group में share करने लायक।",
    "trigger": {"quote": "अपना मोहल्ला जीतो।", "author": "MapRaiders Brand-Vision (HI-Cultural)"},
    "testers": ALL_TESTERS,
    "sections": [
        {"label": "मोहल्ला = गहराई", "title": "<em>मोहल्ला</em> क्या है, और क्यों ये सिर्फ neighbourhood नहीं है?",
         "body": "<p>&ldquo;मोहल्ला&rdquo; एक cultural concept है: एक छोटा क्षेत्र जहाँ सब पड़ोसी एक-दूसरे को जानते हैं, जहाँ साझा इतिहास है, साझा त्योहार हैं, साझा गलियाँ हैं। English का &lsquo;neighbourhood&rsquo; इसका सिर्फ एक हिस्सा पकड़ता है। Spanish का &lsquo;barrio&rsquo; भी अलग है। मोहल्ला अपने आप में एक पहचान है।</p>"},
        {"label": "MapRaiders + मोहल्ला", "title": "MapRaiders <em>मोहल्ले को खेल</em> बनाता है",
         "body": "<ul><li><strong>हर गली एक क्षेत्र:</strong> सुबह की walk से, बच्चों को school छोड़ने के रास्ते में।</li><li><strong>पड़ोसी क्लान:</strong> मोहल्ले-वाले मिलकर rakhsa करते हैं, बिना किसी forced grouping के।</li><li><strong>WhatsApp-share:</strong> मोहल्ला-WhatsApp-group में app के screenshots भेजना आसान।</li><li><strong>Inter-generational:</strong> 70 साल की दादी की सैर भी क्षेत्र बनाती है।</li></ul>"},
        {"label": "त्योहार + मोहल्ला", "title": "<em>होली, दिवाली, ईद</em>: साल भर मोहल्ले में",
         "body": "<p><strong>होली:</strong> रंगों के Echo मोहल्ले में छोड़ें। Family-friendly mode।</p><p><strong>दिवाली:</strong> दीयों के Echo, घर-वापसी की walk के साथ।</p><p><strong>ईद:</strong> ईदी-Echo, gourmet routes।</p><p><strong>नवरात्रि:</strong> 9 nights, 9 क्षेत्र-quests।</p><p>सभी त्योहार respectfully implement किए गए हैं। कोई gambling-mechanic नहीं, कोई religious-monetization नहीं।</p>"},
    ],
    "faq": [
        {"q": "क्या मेरे मोहल्ले में चलेगा?",
         "a": "हाँ, कहीं भी जहाँ GPS signal है। Mumbai-Mulund, Delhi-Lajpat-Nagar, Lucknow-Hazratganj, Indore-Vijaynagar, सब जगह काम करता है।"},
        {"q": "WhatsApp-group में share कैसे करें?",
         "a": "हर page पर WhatsApp-share button है। App के अंदर achievements के screenshot share करें।"},
        {"q": "बच्चों के लिए safe है?",
         "a": "हाँ। DPDPA-children-compliant, 13+ age-gate, parents के लिए family-mode। कोई chat-with-strangers feature नहीं है।"},
        {"q": "बुजुर्गों के लिए?",
         "a": "हाँ, दादी-दादा friendly है। Walk-pace पर काम करता है, कोई fast-action नहीं। Larger UI text का option है।"},
        {"q": "क्या Tier-3 cities में?",
         "a": "हाँ। Lite-Mode 1GB RAM phones पर भी चलता है। Patna, Bhopal, Lucknow, Indore, Jaipur, सब tested।"},
    ],
    "internal_links": [
        ("/hi/territory-game.html", "क्षेत्र खेल"),
        ("/hi/location-game.html", "स्थान आधारित खेल"),
        ("/hi/walking-app-with-game.html", "टहलने का ऐप खेल"),
        ("/hi/mohalla-game-samiksha.html", "मोहल्ला खेल समीक्षा"),
        ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
    ],
}

K5 = {
    "slug": "/hi/walking-app-with-game.html",
    "breadcrumb": "टहलने का ऐप खेल",
    "title": "टहलने का ऐप खेल: कार्डियो और क्षेत्र विजय",
    "og_title": "Walking App Game Hindi: टहलने का खेल",
    "meta": "टहलने का ऐप खेल: MapRaiders हर walk को क्षेत्र-विजय बनाता है। बिना विज्ञापन, battery-saving, बुजुर्गों के लिए भी friendly। मुफ्त, UPI-मित्र।",
    "keywords": "टहलने का ऐप, walking app hindi, fitness gps हिन्दी, बुजुर्ग walking app, cardio खेल",
    "badge": "Walking · Fitness · 50+ friendly",
    "pricing_pill": "हर walk एक mission · ₹0 hamesha",
    "h1_html": 'टहलने का ऐप खेल: <em>हर walk का एक लक्ष्य</em>',
    "lead": "Strava जैसे apps performance-pressure डालते हैं। MapRaiders अलग चलता है: हर walk एक क्षेत्र-mission है, चाहे मोहल्ले की rakhsa हो, clan-defense हो, या decay counter। 50 साल से ऊपर वाले बुजुर्गों के लिए भी friendly, क्योंकि app walk-pace पर बना है।",
    "trigger": {"quote": "मेरा cardio motivation अचानक से वापस आ गया।", "author": "Vivian N., धावक"},
    "testers": [TESTER_VIVIAN, TESTER_RON],
    "sections": [
        {"label": "क्यों classic walking-apps नहीं", "title": "<em>Strava, Nike Run Club</em> क्यों अधूरे हैं",
         "body": "<ul><li><strong>Performance-pressure:</strong> हर run KOM-leaderboard के लिए, और fun गायब हो जाता है।</li><li><strong>कोई game-element नहीं:</strong> सिर्फ stats दिखते हैं, कोई reward नहीं।</li><li><strong>Sub-zwang:</strong> Strava premium ₹449/month, Indian wallet के लिए काफी ज़्यादा।</li></ul>"},
        {"label": "MapRaiders अलग कैसे", "title": "<em>हर walk</em> एक mission",
         "body": "<p>आप वैसे भी walk करते हैं। MapRaiders जोड़ता है: क्षेत्र-स्वामित्व, decay-counter, क्लान-rakhsa। Strava का complement है, replacement नहीं। आप दोनों parallel use कर सकते हैं।</p>"},
        {"label": "50+ Friendly", "title": "<em>बुजुर्गों के लिए</em> design किया गया",
         "body": "<p>India का fastest-growing fitness segment 50+ है। MapRaiders walk-pace पर काम करता है, larger-text option देता है, कोई quick-time-events नहीं, कोई flashing animations नहीं। दादी-दादा भी अपने मोहल्ले की रक्षा कर सकते हैं।</p>"},
    ],
    "faq": [
        {"q": "Strava के साथ चलेगा?",
         "a": "हाँ, दोनों parallel चल सकते हैं। MapRaiders Strava को replace नहीं करता, complement करता है। Strava: pace और distance। MapRaiders: territory और defense।"},
        {"q": "Battery कितनी जाएगी?",
         "a": "हमारी internal testing में 60 से 90 min की walk पर Tier-2 phones पर लगभग 10 से 15% battery जाती है। Pokémon GO के मुक़ाबले लगभग 4 गुना efficient।"},
        {"q": "Indoor-treadmill पर?",
         "a": "नहीं। MapRaiders outdoor-only है। GPS की जरूरत है। Indoor walking के लिए पारंपरिक apps बेहतर।"},
        {"q": "Dog-walking?",
         "a": "हाँ, Ron C. का favorite use-case यही है। कुत्ते की रोज़ की walk से ही क्षेत्र बन जाता है।"},
        {"q": "बुजुर्गों के लिए कितना safe?",
         "a": "Walk-pace पर बना है, कोई fast actions नहीं, larger-text और family-mode option मौजूद। 50+ India का fastest-growing fitness segment है।"},
    ],
    "internal_links": [
        ("/hi/territory-game.html", "क्षेत्र खेल"),
        ("/hi/location-game.html", "स्थान आधारित खेल"),
        ("/hi/cricket-fan-app.html", "क्रिकेट प्रशंसक ऐप"),
        ("/hi/walking-app-kaisa-hai.html", "टहलने का ऐप कैसा है"),
        ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
    ],
}

K6 = {
    "slug": "/hi/treasure-hunt-app.html",
    "breadcrumb": "खजाना खोज ऐप",
    "title": "खजाना खोज ऐप: पूरा शहर लाइव खजाना खोज",
    "og_title": "Treasure Hunt App Hindi: खजाना खोज",
    "meta": "खजाना खोज ऐप: MapRaiders पूरे शहर को live treasure hunt बनाता है। बिना setup, बिना tour खरीदे। Family-friendly, DPDPA-children-protection।",
    "keywords": "खजाना खोज ऐप, treasure hunt app hindi, scavenger hunt हिन्दी, family खेल, बच्चे खेल",
    "badge": "Live Treasure Hunt · Family",
    "pricing_pill": "बिना setup · ₹0 · DPDPA-children-safe",
    "h1_html": 'खजाना खोज ऐप: <em>पूरा शहर</em> live खजाना खोज',
    "lead": "ज़्यादातर खजाना खोज apps pre-prep मांगते हैं: tour खरीदो, route plan करो। MapRaiders अलग है। पूरा शहर पहले से Echo से भरा है। आप सिर्फ चलते हैं, खोजते हैं, अपने Echo छोड़ते हैं। Diwali, Holi, Eid, Navratri, साल भर कुछ न कुछ।",
    "trigger": {"quote": "Echo छोड़ना और देखना कि कौन उन्हें ढूँढता है।", "author": "Aljoscha P., शहरी अन्वेषक"},
    "testers": [TESTER_ALJOSCHA, TESTER_RON],
    "sections": [
        {"label": "3 आधुनिक मानदंड", "title": "एक <em>आधुनिक treasure hunt</em> क्या है?",
         "body": "<ul><li><strong>Live:</strong> servers पर real-time, कोई pre-recording नहीं।</li><li><strong>Social:</strong> Echo छोड़ना, ढूँढना, share करना, सब community-driven।</li><li><strong>बिना premium-Hürde:</strong> कोई tour-खरीद नहीं, कोई setup-fee नहीं, कोई Goosechase-Subscription नहीं।</li></ul>"},
        {"label": "तुलना", "title": "<em>Geocaching, Goosechase, Actionbound</em> vs MapRaiders",
         "body": "<p><strong>Geocaching:</strong> premium-paywall, slow-update। MapRaiders forever-free है, live-Echo के साथ।</p><p><strong>Goosechase:</strong> tour-organizer को खरीदना पड़ता है, $/team। MapRaiders pre-filled और free है।</p><p><strong>Actionbound:</strong> German-prep-heavy। MapRaiders zero-prep पर चलता है।</p>"},
        {"label": "बच्चे + DPDPA", "title": "<em>बच्चों के लिए</em> safe, DPDPA-compliant",
         "body": "<p>13+ age-gate, parents के लिए family-mode option, no chat-with-strangers, no in-app-purchase under-18। DPDPA-Children-Protection का hard-audit हो चुका है।</p>"},
    ],
    "faq": [
        {"q": "बच्चों के साथ खेल सकते हैं?",
         "a": "हाँ। 13+ age-gate, parental-mode, DPDPA-compliant। Goosechase से safer है।"},
        {"q": "Tour खरीदनी पड़ती है?",
         "a": "नहीं। पूरा शहर pre-filled है। आप तुरंत शुरू करते हैं।"},
        {"q": "Echo क्या है?",
         "a": "Echo एक location पर आपका छोड़ा हुआ audio/photo/video signal है। दूसरे players उसे वहाँ खोज सकते हैं।"},
        {"q": "Diwali/Holi specials?",
         "a": "हाँ, सालभर त्योहार-Echo चलते हैं: Diwali दीये, Holi रंग, Eid ईदी, Navratri की 9 nights।"},
        {"q": "Family-mode क्या करता है?",
         "a": "Children-content filter on, no stranger-Echo, parental-supervision, larger-UI option।"},
    ],
    "internal_links": [
        ("/hi/territory-game.html", "क्षेत्र खेल"),
        ("/hi/location-game.html", "स्थान आधारित खेल"),
        ("/hi/cricket-fan-app.html", "क्रिकेट प्रशंसक ऐप"),
        ("/hi/treasure-hunt-samiksha.html", "खजाना खोज समीक्षा"),
        ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
    ],
}

K7 = {
    "slug": "/hi/cricket-fan-app.html",
    "breadcrumb": "क्रिकेट प्रशंसक ऐप",
    "title": "क्रिकेट प्रशंसक ऐप: IPL स्टेडियम पर कब्ज़ा करें",
    "og_title": "Cricket Fan App Hindi: IPL Stadium Territory",
    "meta": "क्रिकेट प्रशंसक नक्शा ऐप: MapRaiders के साथ IPL स्टेडियम पर कब्ज़ा करें और अपनी टीम के मोहल्ले की rakhsa करें। मुफ्त, हिंदी, UPI।",
    "keywords": "क्रिकेट fan app, cricket app hindi, ipl stadium app, क्रिकेट खेल, ipl territory",
    "badge": "HI-EXKLUSIV · IPL Cricket",
    "pricing_pill": "Match-day boost 2x · IPL 2026 ready · ₹0",
    "h1_html": 'क्रिकेट प्रशंसक ऐप: <em>IPL स्टेडियम</em> पर कब्ज़ा करें',
    "lead": "क्रिकेट भारत की पहचान है, सिर्फ खेल नहीं है। MapRaiders cricket-fans के लिए एक IN-Exclusive feature देता है: सभी 7 IPL stadiums territory हैं (Wankhede MI, Chinnaswamy RCB, Eden Gardens KKR, Chepauk CSK, Arun Jaitley DC, Narendra Modi GT, Rajiv Gandhi SRH)। Match-day पर 2x boost मिलता है।",
    "trigger": {"quote": "क्रिकेट स्टेडियम जीतो, अपना मोहल्ला बचाओ।", "author": "Cricket-Hook IN-EXKLUSIV"},
    "testers": [TESTER_ALJOSCHA, TESTER_RON, TESTER_VIVIAN],
    "sections": [
        {"label": "IPL + भारत", "title": "क्रिकेट <em>cultural identity</em> है",
         "body": "<p>India में cricket सिर्फ खेल नहीं है। ये पहचान भी है, परिवार भी, और मोहल्ला भी। MapRaiders cricket-fans के लिए एक dedicated mode बनाता है: हर IPL match-day पर stadium-territory active रहता है।</p>"},
        {"label": "7 IPL Stadiums", "title": "<em>सभी 7 IPL stadiums</em> territory हैं",
         "body": "<ul><li><strong>Wankhede (Mumbai Indians):</strong> Marine Drive flow।</li><li><strong>Chinnaswamy (RCB):</strong> Bangalore central।</li><li><strong>Eden Gardens (KKR):</strong> Kolkata historic।</li><li><strong>Chepauk (CSK):</strong> Chennai marina-vicinity।</li><li><strong>Arun Jaitley (DC):</strong> Delhi central।</li><li><strong>Narendra Modi (GT):</strong> Ahmedabad में दुनिया का सबसे बड़ा cricket stadium।</li><li><strong>Rajiv Gandhi (SRH):</strong> Hyderabad uppal।</li></ul>"},
        {"label": "Match-Day Mechanics", "title": "<em>Match-day</em> पर 2x territory boost",
         "body": "<p>Match-day पर home stadium का territory 2x weight देता है। MI fans Wankhede defend करते हैं, RCB fans Chinnaswamy। Inter-team match-days clan-vs-clan territorial battle बनाते हैं। BCCI-Disclaimer और No-Endorsement-Klausel: कोई player (Sachin, Virat, Dhoni, Rohit) endorse नहीं किया जाता, सिर्फ stadium-locations use होती हैं।</p>"},
    ],
    "faq": [
        {"q": "मेरी team को कैसे चुनूँ?",
         "a": "App में team-flag pick करें। Stadium-territory automatically उस team को mapped। Match-day पर 2x boost।"},
        {"q": "IPL season बाहर?",
         "a": "Stadium-territories year-round active रहते हैं, bilateral series, World Cup, T20I सब के लिए। IPL match-day पर extra boost मिलता है।"},
        {"q": "क्या कोई player endorse करता है?",
         "a": "नहीं। हम किसी player को endorse नहीं करते। सिर्फ stadium-locations use करते हैं। BCCI से कोई official partnership नहीं है। ये एक independent fan-tribute है।"},
        {"q": "Cricket-Cosmetics?",
         "a": "Cricket-themed cosmetic items planned: team-flags, bat-marker-design, helmet-skin। Cosmetic-only, gameplay-advantage zero।"},
        {"q": "Stadium पर physically जाना है?",
         "a": "नहीं। Stadium-territory को आसपास के locations से influence किया जा सकता है। Physical-attendance का bonus है पर ज़रूरी नहीं।"},
    ],
    "internal_links": [
        ("/hi/territory-game.html", "क्षेत्र खेल"),
        ("/hi/location-game.html", "स्थान आधारित खेल"),
        ("/hi/treasure-hunt-app.html", "खजाना खोज ऐप"),
        ("/hi/cricket-fan-kaisa-hai.html", "क्रिकेट fan कैसा है"),
        ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
    ],
}

ALL_KILLERS = [K1, K2, K3, K4, K5, K6, K7]


# -- TWINS DATA (Mix samiksha + kaisa-hai) --

TWINS_DATA = [
    {
        "slug": "/hi/territory-game-samiksha.html",
        "breadcrumb": "क्षेत्र खेल समीक्षा",
        "title": "क्षेत्र खेल समीक्षा: Beta Tester बताते हैं",
        "og_title": "क्षेत्र खेल समीक्षा हिन्दी",
        "meta": "क्षेत्र खेल समीक्षा: तीन जर्मन beta tester अपनी रोज़ की routine में क्षेत्र-claim, क्षय और रक्षा के अनुभव बताते हैं। भारतीय गलियों के लिए relevant।",
        "keywords": "क्षेत्र खेल समीक्षा, territory game review hindi, gps mmo review hindi",
        "h1_html": 'क्षेत्र खेल: जब <em>आपकी अपनी गली</em> आपकी हो',
        "lead": "अपना पहला कब्ज़ा कैसा लगता है? पहला क्षय shock? पहला defense mini-game? तीन beta tester की honest reports। वही loop Connaught Place, Cubbon Park, Marine Drive पर भी काम करता है।",
        "intro_label": "Test के axes",
        "intro_title": "एक <em>क्षेत्र खेल</em> को क्या tangible बनाता है",
        "intro_body": "<ul><li><strong>कब्ज़ा:</strong> पहली claimed गली कब &lsquo;मेरी&rsquo; लगती है?</li><li><strong>हानि:</strong> पहले क्षय या attack पर reaction?</li><li><strong>रक्षा:</strong> mini-games tactical, fair, frustrating?</li></ul>",
        "internal_links": [
            ("/hi/territory-game.html", "क्षेत्र खेल"),
            ("/hi/location-game.html", "स्थान आधारित खेल"),
            ("/hi/mohalla-game.html", "मोहल्ला खेल"),
            ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
        ],
    },
    {
        "slug": "/hi/location-game-kaisa-hai.html",
        "breadcrumb": "स्थान आधारित खेल कैसा है",
        "title": "स्थान आधारित खेल कैसा है: 7 GPS Apps Test",
        "og_title": "Location Game Kaisa Hai: Hindi Review",
        "meta": "स्थान आधारित खेल कैसा है? 7 GPS apps की honest beta-tester reviews (MapRaiders, Pokémon GO, Pikmin Bloom, Geocaching, Wokamon)।",
        "keywords": "location game कैसा, स्थान खेल review, gps खेल honest review",
        "h1_html": 'स्थान आधारित खेल: <em>7 apps</em> honest tested',
        "lead": "GPS खेल hype से अलग, actual experience कैसा है? तीन tester ने हफ़्तों use किया, बीच में Pokémon GO से comparison भी लिया। ये उनकी honest reports हैं।",
        "intro_label": "Test setup",
        "intro_title": "हमने <em>क्या test किया</em>",
        "intro_body": "<ul><li>Battery-life Tier-2 phones पर।</li><li>Data consumption ~MB/घंटा।</li><li>Loop-engagement 4-week sustain।</li><li>Game-element का real-life integration।</li></ul>",
        "internal_links": [
            ("/hi/location-game.html", "स्थान आधारित खेल"),
            ("/hi/territory-game.html", "क्षेत्र खेल"),
            ("/hi/pokemon-go-alternative-free.html", "Pokemon GO का विकल्प"),
            ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
        ],
    },
    {
        "slug": "/hi/pokemon-go-alternative-samiksha.html",
        "breadcrumb": "Pokemon GO विकल्प समीक्षा",
        "title": "Pokemon GO विकल्प समीक्षा: Honest Beta Reports",
        "og_title": "Pokemon GO Alternative Review Hindi",
        "meta": "Pokemon GO विकल्प समीक्षा: ad-free, UPI-friendly, Tier-2 phone पर smooth, beta tester reports। Saudi-frame, DPDPA, मुफ्त forever।",
        "keywords": "pokemon go विकल्प समीक्षा, pokemon go alternative review hindi",
        "h1_html": 'Pokemon GO का विकल्प: <em>honest tester reports</em>',
        "lead": "Saudi-acquisition के बाद कई players ने Pokémon GO छोड़ा। MapRaiders एक refuge की तरह है। Beta tester ने 6 से ज़्यादा हफ़्ते parallel use किया, ये उनके honest experiences हैं।",
        "intro_label": "Comparison-test",
        "intro_title": "क्या MapRaiders <em>refuge</em> है?",
        "intro_body": "<ul><li>Battle-pass-frustration absent।</li><li>Saudi-data-flow कोई नहीं।</li><li>UPI-payment integration smooth।</li><li>Tier-2 phone performance Pokémon GO से 4x बेहतर।</li></ul>",
        "internal_links": [
            ("/hi/pokemon-go-alternative-free.html", "Pokemon GO का विकल्प मुफ्त"),
            ("/hi/territory-game.html", "क्षेत्र खेल"),
            ("/hi/location-game.html", "स्थान आधारित खेल"),
            ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
        ],
    },
    {
        "slug": "/hi/mohalla-game-samiksha.html",
        "breadcrumb": "मोहल्ला खेल समीक्षा",
        "title": "मोहल्ला खेल समीक्षा: पड़ोसियों से जुड़ने का अनुभव",
        "og_title": "मोहल्ला खेल समीक्षा हिन्दी",
        "meta": "मोहल्ला खेल समीक्षा: पड़ोसी क्लान, गली-कब्ज़ा, होली-Echo के experiences। Cultural-deep हिन्दी context।",
        "keywords": "मोहल्ला खेल समीक्षा, mohalla game review",
        "h1_html": 'मोहल्ला खेल: <em>पड़ोसियों से जुड़ने</em> की honest reports',
        "lead": "मोहल्ला सिर्फ neighbourhood नहीं है। एक खेल जो मोहल्ले को capture करना चाहे, वो practically काम कैसे करता है? Beta tester reports और Indian-context Tier-2 reflections।",
        "intro_label": "Cultural-test",
        "intro_title": "क्या <em>मोहल्ला</em> capture होता है?",
        "intro_body": "<ul><li>WhatsApp-group में share कितनी आसान।</li><li>पड़ोसी-clan formation organic।</li><li>Inter-generational engagement।</li><li>त्योहार-Echo respectful।</li></ul>",
        "internal_links": [
            ("/hi/mohalla-game.html", "मोहल्ला खेल"),
            ("/hi/territory-game.html", "क्षेत्र खेल"),
            ("/hi/walking-app-with-game.html", "टहलने का ऐप खेल"),
            ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
        ],
    },
    {
        "slug": "/hi/walking-app-kaisa-hai.html",
        "breadcrumb": "टहलने का ऐप कैसा है",
        "title": "टहलने का ऐप कैसा है: Beta Walker Reports",
        "og_title": "Walking App Kaisa Hai: Hindi Review",
        "meta": "टहलने का ऐप कैसा है? Beta-tester walker, dog-owner और runner की reports: battery, motivation, और क्षेत्र-loss को cardio-hook की तरह।",
        "keywords": "walking app कैसा, walking app review hindi, fitness app review",
        "h1_html": 'टहलने का ऐप: <em>cardio-motivation</em> reports',
        "lead": "Strava से अलग एक walking-loop कैसा लगता है? तीन tester ने अलग-अलग routines (jog, walk, dog-walk) में MapRaiders try किया। ये उनकी honest cardio-reports हैं।",
        "intro_label": "Walking-axes",
        "intro_title": "एक <em>walking-with-game</em> app को क्या deliver करना चाहिए",
        "intro_body": "<ul><li>Motivation-anchor: pause के बाद वापसी।</li><li>Battery 60-90min walks पर।</li><li>Cross-activity: jog/walk/dog-walk।</li></ul>",
        "internal_links": [
            ("/hi/walking-app-with-game.html", "टहलने का ऐप"),
            ("/hi/territory-game.html", "क्षेत्र खेल"),
            ("/hi/cricket-fan-app.html", "क्रिकेट fan app"),
            ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
        ],
    },
    {
        "slug": "/hi/treasure-hunt-samiksha.html",
        "breadcrumb": "खजाना खोज समीक्षा",
        "title": "खजाना खोज ऐप समीक्षा: बिना setup live City Hunt",
        "og_title": "Treasure Hunt App Review Hindi",
        "meta": "खजाना खोज ऐप समीक्षा: बिना tour-purchase, बिना setup। Family-friendly, DPDPA-children-safe। Beta tester reports।",
        "keywords": "खजाना खोज समीक्षा, treasure hunt review hindi, family खेल समीक्षा",
        "h1_html": 'खजाना खोज ऐप: <em>बिना setup</em> reviews',
        "lead": "अधिकतर treasure-hunt apps prep-heavy हैं। MapRaiders अलग है, पूरा शहर pre-filled आता है। Beta tester ने तीन settings में test किया: solo, dog-walk, और family-simulated।",
        "intro_label": "Test-question",
        "intro_title": "क्या <em>live treasure-hunt</em> बिना setup चलता है?",
        "intro_body": "<ul><li>Solo शहरी अन्वेषक।</li><li>Dog-walk side-discovery।</li><li>Family-simulated learning-curve।</li></ul>",
        "internal_links": [
            ("/hi/treasure-hunt-app.html", "खजाना खोज ऐप"),
            ("/hi/territory-game.html", "क्षेत्र खेल"),
            ("/hi/location-game.html", "स्थान आधारित खेल"),
            ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
        ],
    },
    {
        "slug": "/hi/cricket-fan-kaisa-hai.html",
        "breadcrumb": "क्रिकेट fan कैसा है",
        "title": "क्रिकेट fan ऐप कैसा है: IPL Stadium Test",
        "og_title": "Cricket Fan App Kaisa Hai: Hindi Review",
        "meta": "क्रिकेट fan ऐप कैसा है? Wankhede, Chinnaswamy, Eden Gardens, Chepauk capture का experience। IPL season tester reports।",
        "keywords": "cricket fan ऐप कैसा, cricket app review hindi, ipl stadium review",
        "h1_html": 'क्रिकेट fan ऐप: <em>IPL stadium</em> reports',
        "lead": "Wankhede capture करना MI match-day पर कैसा? Chinnaswamy defend RCB के लिए? Chepauk hold CSK के लिए? Beta tester ने territory-mechanic test किया (cricket-features Indian beta-wave में IPL 2026 के साथ launch)।",
        "intro_label": "Cricket-test",
        "intro_title": "क्यों <em>stadium-territory</em> Indian fans के लिए",
        "intro_body": "<ul><li>Match-day defense 2x boost।</li><li>Fan-clan organic formation।</li><li>Inter-team battles RCB vs MI।</li></ul>",
        "internal_links": [
            ("/hi/cricket-fan-app.html", "क्रिकेट fan ऐप"),
            ("/hi/territory-game.html", "क्षेत्र खेल"),
            ("/hi/walking-app-with-game.html", "टहलने का ऐप"),
            ("/hi/mapraiders-samiksha.html", "सभी समीक्षाएँ"),
        ],
    },
]


# -- HUB --

HUB = {
    "slug": "/hi/mapraiders-samiksha.html",
    "breadcrumb": "MapRaiders समीक्षाएँ",
    "title": "MapRaiders समीक्षाएँ: Beta Tests, Founder, सभी विषय",
    "og_title": "MapRaiders समीक्षाएँ हिन्दी: सभी beta-voices",
    "meta": "MapRaiders समीक्षाएँ: 5.0/5, तीन verified beta tests, founder statement, सभी 7 Killer + 7 reviews पेज एक hub से। UPI-मित्र, Tier-2 ready, DPDPA-aligned।",
    "keywords": "mapraiders समीक्षाएँ, mapraiders review hindi, gps mmo review",
    "badge": "Hub & Overview · हिन्दी",
    "pricing_pill": "5.0 / 5 · 3 verified beta",
    "h1_html": '<em>MapRaiders समीक्षाएँ</em> · हिन्दी में सब कुछ एक जगह',
    "lead": "तीन beta tester Stuttgart, Hamburg और Berlin से, सात Killer-विषय (territory, location, Pokémon GO विकल्प, मोहल्ला, walking, treasure-hunt, cricket), सात समीक्षा-पेज, और एक hub। UPI-मित्र, Tier-2 ready, DPDPA-aligned, सब Devanagari और Hinglish-comfort में।",
    "trigger": None,
    "testers": ALL_TESTERS,
    "sections": [],
    "faq": [
        {"q": "MapRaiders क्या है exactly?",
         "a": "Android के लिए एक GPS-MMO है। Players अपनी movement से असली क्षेत्र claim करते हैं, Echo छोड़ते हैं, mission बनाते हैं, और mini-games से defend करते हैं। Ad-free, AR-free, मुफ्त। India-features में UPI, Tier-2 support, मोहल्ला-mode और cricket-fan-mode शामिल हैं।"},
        {"q": "कितने beta tester हैं?",
         "a": "अभी public में तीन हैं (with consent, first-name + initial के साथ)। पूरी closed beta इससे बड़ी है। Indian native-tester wave Tier-2 launch के बाद DPDPA-compliant programme में आएगी।"},
        {"q": "क्या reviews real हैं?",
         "a": "हाँ। तीनों real लोग हैं, और किसी को पैसे नहीं दिए गए। Quotes original German में हैं। Schema.org translationOfWork से full transparency रखी गई है।"},
        {"q": "Beta tester कैसे बनूँ?",
         "a": "Email-list join करें। Indian wave Tier-2 launch के बाद आएगी, DPDPA-compliant तरीके से। Priority cities: Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, और Tier-2।"},
        {"q": "Official India launch कब?",
         "a": "Closed-beta अभी Google Play पर चल रही है। Public India launch Summer 2026 के लिए planned है, full UPI-integration के साथ। iOS Q3 2026 में।"},
    ],
    "internal_links": [],
}


# -- MAIN --

def main():
    print("=== Phase 1 Session 4 - HI Killer-URL Builder ===")
    print(f"Output: {HI_DIR}")
    print()
    HI_DIR.mkdir(parents=True, exist_ok=True)
    written = []

    for page in ALL_KILLERS:
        out = DOCS / page["slug"].lstrip("/")
        out.parent.mkdir(parents=True, exist_ok=True)
        html = render_killer_page(page)
        out.write_text(html, encoding="utf-8")
        written.append(out.name)
        print(f"  [KILLER] {page['slug']}  ({len(html):,} bytes)")

    for page in TWINS_DATA:
        out = DOCS / page["slug"].lstrip("/")
        out.parent.mkdir(parents=True, exist_ok=True)
        html = render_twin_page(page)
        out.write_text(html, encoding="utf-8")
        written.append(out.name)
        print(f"  [TWIN]   {page['slug']}  ({len(html):,} bytes)")

    killers_links = [(p["slug"], p["breadcrumb"]) for p in ALL_KILLERS]
    twins_links = [(p["slug"], p["breadcrumb"]) for p in TWINS_DATA]
    out = DOCS / HUB["slug"].lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    html = render_hub_page(HUB, killers_links, twins_links)
    out.write_text(html, encoding="utf-8")
    written.append(out.name)
    print(f"  [HUB]    {HUB['slug']}  ({len(html):,} bytes)")

    print()
    print(f"=== {len(written)} files written ===")


if __name__ == "__main__":
    main()

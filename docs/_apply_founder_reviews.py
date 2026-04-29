"""
Phase K: Founder-Statement (René Scafarti) + 3 Tester-Reviews (Ron C., Vivian N., Aljoscha P.).

- Sichtbarer HTML-Block (Founder-Card + 3 Tester-Cards) vor </body>
- JSON-LD: Person (founder) + Review × 3 + AggregateRating 5.0/3 vor </head>
- 13 Sprachen, idiomatische Übersetzungen
- Idempotent via Marker

Skip:
- Stub-Redirects (haben KILLER-SLUG-REDIRECT-STUB)
- Howto-Pages, About-Pages, Legal-Pages
- index-backup, 404
"""
from __future__ import annotations
from pathlib import Path
import json
import re
import sys

if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
MARKER_HTML = "<!-- PHASE-K-FOUNDER-REVIEWS -->"
MARKER_JSONLD = "<!-- PHASE-K-FOUNDER-JSONLD -->"
STUB_MARKER = "<!-- KILLER-SLUG-REDIRECT-STUB -->"

# Skip-Patterns für Pfade (Substring-Match)
SKIP_PATH_PATTERNS = [
    "index-backup",
    "404.html",
    "/howto/",
    "\\howto\\",
    "/privacy",
    "/terms",
    "/agb",
    "/datenschutz",
    "/impressum",
    "/kontakt",
    "about.html",
    "a-propos.html",
    "sobre.html",
    "sobre-nosotros.html",
    "chi-siamo.html",
    "hakkimizda.html",
    "o-nas.html",
    "ueber-uns.html",
]

# Strings pro Sprache
T = {
    "de": {
        "founder_label": "Vom Gründer",
        "founder_role": "Gründer & Visionär, MapRaiders",
        "founder_quote": "Ich habe MapRaiders gebaut, weil GPS-Spiele dich entweder zur Geldbörse zwingen oder dich allein lassen. Hier formt jeder Schritt echtes Territorium — und jede Karte wird zum sozialen Netzwerk deiner Stadt.",
        "tester_label": "Was Beta-Tester sagen",
        "ron_role": "Hundebesitzer, Beta-Tester",
        "ron_quote": "Mein Hund liebt seine Runde — und ich liebe, dass jede Runde mein Viertel auf der Karte sichtbarer macht. Habe meine ganze Straße jetzt erobert.",
        "vivi_role": "Joggerin, Beta-Testerin",
        "vivi_quote": "Ich jogge sowieso jeden Morgen. Mit MapRaiders hat jede Strecke ein Ziel: Gebiet halten oder zurückerobern. Mein Cardio-Antrieb ist explodiert.",
        "alj_role": "Stadt-Erkunder, Beta-Tester",
        "alj_quote": "Echos zu legen und zu sehen wer sie findet, ist wie eine offene Schnitzeljagd durch die ganze Stadt. Ich entdecke Ecken, die ich noch nie gesehen habe.",
    },
    "en": {
        "founder_label": "From the Founder",
        "founder_role": "Founder & Visionary, MapRaiders",
        "founder_quote": "I built MapRaiders because GPS games either force your wallet or leave you alone. Here every step shapes real territory — and every map becomes the social network of your city.",
        "tester_label": "What Beta Testers Say",
        "ron_role": "Dog owner, Beta tester",
        "ron_quote": "My dog loves his walk — and I love that every walk makes my neighborhood more visible on the map. I've conquered my whole street now.",
        "vivi_role": "Jogger, Beta tester",
        "vivi_quote": "I jog every morning anyway. With MapRaiders every route has a goal: hold ground or reclaim it. My cardio drive has exploded.",
        "alj_role": "Urban explorer, Beta tester",
        "alj_quote": "Dropping Echoes and watching who finds them is like an open scavenger hunt through the whole city. I discover corners I'd never seen.",
    },
    "fr": {
        "founder_label": "Du Fondateur",
        "founder_role": "Fondateur & Visionnaire, MapRaiders",
        "founder_quote": "J'ai créé MapRaiders parce que les jeux GPS te forcent au porte-monnaie ou te laissent seul. Ici chaque pas façonne un vrai territoire — et chaque carte devient le réseau social de ta ville.",
        "tester_label": "Ce que disent les Beta-testeurs",
        "ron_role": "Propriétaire de chien, Beta-testeur",
        "ron_quote": "Mon chien adore sa promenade — et j'adore que chaque promenade rend mon quartier plus visible sur la carte. J'ai conquis toute ma rue maintenant.",
        "vivi_role": "Joggeuse, Beta-testeuse",
        "vivi_quote": "Je cours déjà chaque matin. Avec MapRaiders chaque parcours a un but : tenir le territoire ou le reconquérir. Ma motivation cardio a explosé.",
        "alj_role": "Explorateur urbain, Beta-testeur",
        "alj_quote": "Déposer des Échos et voir qui les trouve, c'est comme une chasse au trésor ouverte à travers toute la ville. Je découvre des coins jamais vus.",
    },
    "es": {
        "founder_label": "Del Fundador",
        "founder_role": "Fundador y Visionario, MapRaiders",
        "founder_quote": "Construí MapRaiders porque los juegos GPS o te obligan a pagar o te dejan solo. Aquí cada paso moldea territorio real — y cada mapa se convierte en la red social de tu ciudad.",
        "tester_label": "Lo que dicen los Beta-testers",
        "ron_role": "Dueño de perro, Beta-tester",
        "ron_quote": "A mi perro le encanta su paseo — y a mí me encanta que cada paseo haga mi barrio más visible en el mapa. Ya conquisté toda mi calle.",
        "vivi_role": "Corredora, Beta-tester",
        "vivi_quote": "Igual corro todas las mañanas. Con MapRaiders cada ruta tiene un objetivo: mantener territorio o reconquistarlo. Mi motivación cardio ha explotado.",
        "alj_role": "Explorador urbano, Beta-tester",
        "alj_quote": "Dejar Echos y ver quién los encuentra es como una búsqueda del tesoro abierta por toda la ciudad. Descubro rincones que nunca había visto.",
    },
    "it": {
        "founder_label": "Dal Fondatore",
        "founder_role": "Fondatore e Visionario, MapRaiders",
        "founder_quote": "Ho creato MapRaiders perché i giochi GPS o ti spremono il portafoglio o ti lasciano da solo. Qui ogni passo forma territorio reale — e ogni mappa diventa il social network della tua città.",
        "tester_label": "Cosa dicono i Beta-tester",
        "ron_role": "Proprietario di cane, Beta-tester",
        "ron_quote": "Il mio cane ama la sua passeggiata — e io amo che ogni giro renda il mio quartiere più visibile sulla mappa. Ho conquistato tutta la mia via.",
        "vivi_role": "Runner, Beta-tester",
        "vivi_quote": "Corro già ogni mattina. Con MapRaiders ogni percorso ha un obiettivo: tenere territorio o riconquistarlo. La mia motivazione cardio è esplosa.",
        "alj_role": "Esploratore urbano, Beta-tester",
        "alj_quote": "Lasciare Echi e vedere chi li trova è come una caccia al tesoro aperta in tutta la città. Scopro angoli mai visti.",
    },
    "pt": {
        "founder_label": "Do Fundador",
        "founder_role": "Fundador e Visionário, MapRaiders",
        "founder_quote": "Criei o MapRaiders porque os jogos GPS ou forçam tua carteira ou te deixam sozinho. Aqui cada passo molda território real — e cada mapa vira a rede social da tua cidade.",
        "tester_label": "O que dizem os Beta-testers",
        "ron_role": "Dono de cachorro, Beta-tester",
        "ron_quote": "Meu cachorro adora o passeio — e eu adoro que cada passeio torna meu bairro mais visível no mapa. Já conquistei minha rua toda.",
        "vivi_role": "Corredora, Beta-tester",
        "vivi_quote": "Já corro toda manhã. Com MapRaiders cada percurso tem um objetivo: manter território ou reconquistá-lo. Minha motivação cardio explodiu.",
        "alj_role": "Explorador urbano, Beta-tester",
        "alj_quote": "Deixar Echos e ver quem os encontra é como uma caça ao tesouro aberta pela cidade inteira. Descubro cantos que nunca tinha visto.",
    },
    "tr": {
        "founder_label": "Kurucudan",
        "founder_role": "Kurucu ve Vizyoner, MapRaiders",
        "founder_quote": "MapRaiders'ı yaptım çünkü GPS oyunları ya cüzdanını zorluyor ya da seni yalnız bırakıyor. Burada her adım gerçek bölge şekillendirir — ve her harita şehrinin sosyal ağına dönüşür.",
        "tester_label": "Beta Test Kullanıcıları Ne Diyor",
        "ron_role": "Köpek sahibi, Beta tester",
        "ron_quote": "Köpeğim yürüyüşünü seviyor — ben de her yürüyüşün mahallemi haritada daha görünür yapmasını seviyorum. Tüm sokağımı fethettim bile.",
        "vivi_role": "Koşucu, Beta tester",
        "vivi_quote": "Zaten her sabah koşuyorum. MapRaiders ile her rotanın bir amacı var: bölgeyi tutmak ya da geri almak. Kardiyo motivasyonum patladı.",
        "alj_role": "Şehir kâşifi, Beta tester",
        "alj_quote": "Eko bırakmak ve kimin bulduğunu izlemek, tüm şehirde açık bir hazine avı gibi. Hiç görmediğim köşeleri keşfediyorum.",
    },
    "ru": {
        "founder_label": "От Основателя",
        "founder_role": "Основатель и Визионер, MapRaiders",
        "founder_quote": "Я создал MapRaiders, потому что GPS-игры либо опустошают твой кошелёк, либо оставляют одного. Здесь каждый шаг формирует реальную территорию — и каждая карта становится социальной сетью твоего города.",
        "tester_label": "Что говорят Бета-тестеры",
        "ron_role": "Владелец собаки, Бета-тестер",
        "ron_quote": "Моя собака обожает прогулку — а я обожаю, что каждая прогулка делает мой район виднее на карте. Уже захватил всю свою улицу.",
        "vivi_role": "Бегунья, Бета-тестер",
        "vivi_quote": "Я и так бегаю каждое утро. С MapRaiders у каждого маршрута цель: удержать территорию или вернуть её. Мотивация к кардио взорвалась.",
        "alj_role": "Городской исследователь, Бета-тестер",
        "alj_quote": "Оставлять Эхо и смотреть, кто их находит — как открытая охота за сокровищами по всему городу. Открываю уголки, которые никогда не видел.",
    },
    "ja": {
        "founder_label": "創設者から",
        "founder_role": "創設者・ビジョナリー、MapRaiders",
        "founder_quote": "MapRaidersを作ったのは、GPSゲームが財布を奪うか、君を孤独にするかのどちらかだったからだ。ここでは一歩一歩がリアルなテリトリーを形作り — 地図が街のSNSになる。",
        "tester_label": "ベータテスターの声",
        "ron_role": "犬の飼い主、ベータテスター",
        "ron_quote": "犬は散歩が大好きで、僕は散歩のたびに地図上で自分の街がもっと見えるのが大好き。もう自分の通りを全部征服した。",
        "vivi_role": "ジョガー、ベータテスター",
        "vivi_quote": "毎朝走ってる。MapRaidersでルートに目的ができた：陣地を守るか、取り返すか。カーディオのモチベがバクれた。",
        "alj_role": "都市探検家、ベータテスター",
        "alj_quote": "エコーを置いて誰が見つけるか見るのは、街全体を巡るオープンな宝探しみたい。今まで見たことない場所を発見してる。",
    },
    "ko": {
        "founder_label": "창립자로부터",
        "founder_role": "창립자 & 비전가, MapRaiders",
        "founder_quote": "MapRaiders를 만든 이유는 GPS 게임들이 지갑을 노리거나 너를 혼자 두기 때문이다. 여기서는 한 걸음 한 걸음이 진짜 영토를 만들고 — 지도가 도시의 소셜 네트워크가 된다.",
        "tester_label": "베타 테스터의 이야기",
        "ron_role": "강아지 보호자, 베타 테스터",
        "ron_quote": "강아지는 산책을 사랑하고, 나는 매 산책이 우리 동네를 지도에서 더 잘 보이게 하는 게 좋다. 이미 우리 거리 전체를 점령했다.",
        "vivi_role": "러너, 베타 테스터",
        "vivi_quote": "어차피 매일 아침 뛴다. MapRaiders로 모든 코스에 목적이 생겼다: 영토를 지키거나 되찾거나. 카디오 의욕이 폭발했다.",
        "alj_role": "도시 탐험가, 베타 테스터",
        "alj_quote": "에코를 남기고 누가 찾는지 보는 건 도시 전체를 무대로 하는 보물찾기 같다. 지금까지 못 본 골목을 발견하고 있다.",
    },
    "zh": {
        "founder_label": "来自创始人",
        "founder_role": "创始人 & 远见者，MapRaiders",
        "founder_quote": "我打造MapRaiders是因为GPS游戏要么逼你掏钱，要么让你独自一人。在这里，每一步都塑造真实领地——每一张地图都成为你城市的社交网络。",
        "tester_label": "Beta测试者怎么说",
        "ron_role": "狗主人，Beta测试者",
        "ron_quote": "我的狗喜欢遛弯，我喜欢每次遛弯都让我的社区在地图上更显眼。已经占领了我整条街。",
        "vivi_role": "跑者，Beta测试者",
        "vivi_quote": "本来每天早上就跑步。有了MapRaiders，每条路线都有目标：守住领地或夺回。心肺动力爆表。",
        "alj_role": "城市探索者，Beta测试者",
        "alj_quote": "放下Echo看谁找到，就像整座城市的开放寻宝。发现了从没见过的角落。",
    },
    "ar": {
        "founder_label": "من المؤسس",
        "founder_role": "المؤسس وصاحب الرؤية، MapRaiders",
        "founder_quote": "بنيت MapRaiders لأن ألعاب GPS إما تجبرك على الدفع أو تتركك وحدك. هنا كل خطوة تصنع منطقة حقيقية — وكل خريطة تتحول إلى شبكة اجتماعية لمدينتك.",
        "tester_label": "ماذا يقول مختبرو النسخة التجريبية",
        "ron_role": "صاحب كلب، مختبر تجريبي",
        "ron_quote": "كلبي يحب نزهته — وأنا أحب أن كل نزهة تجعل حيي أكثر ظهوراً على الخريطة. غزوت شارعي كله الآن.",
        "vivi_role": "عدّاءة، مختبرة تجريبية",
        "vivi_quote": "أركض كل صباح أصلاً. مع MapRaiders كل مسار له هدف: الحفاظ على المنطقة أو استعادتها. حماسي للكارديو انفجر.",
        "alj_role": "مستكشف مديني، مختبر تجريبي",
        "alj_quote": "ترك أصداء ورؤية من يجدها مثل لعبة بحث عن الكنز مفتوحة عبر المدينة كلها. أكتشف زوايا لم أرها من قبل.",
    },
    "hi": {
        "founder_label": "संस्थापक से",
        "founder_role": "संस्थापक और दूरदर्शी, MapRaiders",
        "founder_quote": "मैंने MapRaiders इसलिए बनाया क्योंकि GPS खेल या तो आपका बटुआ खाते हैं या आपको अकेला छोड़ देते हैं। यहाँ हर कदम असली क्षेत्र बनाता है — और हर नक्शा आपके शहर का सोशल नेटवर्क बनता है।",
        "tester_label": "बीटा टेस्टर्स क्या कहते हैं",
        "ron_role": "कुत्ते का मालिक, बीटा टेस्टर",
        "ron_quote": "मेरा कुत्ता अपनी सैर पसंद करता है — और मुझे पसंद है कि हर सैर मेरे मोहल्ले को नक्शे पर ज्यादा दिखाती है। पूरी सड़क जीत ली है।",
        "vivi_role": "जॉगर, बीटा टेस्टर",
        "vivi_quote": "मैं वैसे भी हर सुबह दौड़ती हूँ। MapRaiders के साथ हर रास्ते का एक लक्ष्य है: क्षेत्र बनाए रखना या वापस जीतना। मेरी कार्डियो प्रेरणा फट गई।",
        "alj_role": "शहर खोजकर्ता, बीटा टेस्टर",
        "alj_quote": "इको छोड़ना और देखना कि कौन उन्हें ढूँढता है, पूरे शहर में एक खुले खजाने की खोज जैसा है। मुझे ऐसे कोने मिलते हैं जो पहले कभी नहीं देखे।",
    },
}

# CSS für Cards (one-liner, in HTML-Block injiziert; sehr klein, idempotent)
CSS = """<style>
.fr-sec{padding:80px 0;border-top:1px solid var(--border);background:var(--bg-alt)}
.fr-sec .mx{max-width:1180px;margin:0 auto;padding:0 28px}
.fr-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.fr-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:36px;margin-bottom:32px;box-shadow:0 2px 12px rgba(20,18,16,.04)}
.fr-card.founder{border-left:4px solid var(--accent)}
.fr-quote{font-size:18px;line-height:1.65;color:var(--text);font-weight:500;margin-bottom:20px;font-style:italic}
.fr-author{font-size:14px;font-weight:700;color:var(--text)}
.fr-role{font-size:13px;color:var(--muted);margin-top:2px}
.fr-stars{color:#F5A623;font-size:14px;letter-spacing:2px;margin-bottom:14px}
.fr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:32px}
.fr-grid .fr-card{margin-bottom:0}
@media(max-width:640px){.fr-sec{padding:60px 0}.fr-card{padding:28px}}
</style>"""


def detect_lang(html: str, path: Path) -> str | None:
    m = re.search(r'<html\s+lang="([a-z]{2})"', html)
    if m:
        lang = m.group(1)
        if lang in T:
            return lang
    # Fallback: aus Pfad ableiten
    parts = path.relative_to(ROOT).parts
    if parts and parts[0] in T:
        return parts[0]
    # Wurzel = DE
    if not parts or parts[0].endswith(".html"):
        return "de"
    return None


def should_skip(path: Path, html: str) -> str | None:
    """None wenn Page verarbeitet werden soll, sonst Skip-Grund."""
    p = str(path).replace("\\", "/")
    if STUB_MARKER in html:
        return "stub"
    for pat in SKIP_PATH_PATTERNS:
        if pat.replace("\\", "/") in p:
            return f"path:{pat}"
    if MARKER_HTML in html:
        return "already-processed"
    # Marketing-Page-Heuristik: muss MobileApplication-Schema haben
    if '"@type": "MobileApplication"' not in html and '"@type":"MobileApplication"' not in html:
        return "no-mobileapp-schema"
    return None


def build_html_block(lang: str, page_url: str) -> str:
    s = T[lang]
    return f"""{MARKER_HTML}
{CSS}
<section class="fr-sec">
  <div class="mx">
    <div class="fr-label">{s['founder_label']}</div>
    <div class="fr-card founder">
      <div class="fr-quote">{s['founder_quote']}</div>
      <div class="fr-author">René Scafarti</div>
      <div class="fr-role">{s['founder_role']}</div>
    </div>
    <div class="fr-label" style="margin-top:48px">{s['tester_label']}</div>
    <div class="fr-grid">
      <div class="fr-card">
        <div class="fr-stars">★★★★★</div>
        <div class="fr-quote">{s['ron_quote']}</div>
        <div class="fr-author">Ron C.</div>
        <div class="fr-role">{s['ron_role']}</div>
      </div>
      <div class="fr-card">
        <div class="fr-stars">★★★★★</div>
        <div class="fr-quote">{s['vivi_quote']}</div>
        <div class="fr-author">Vivian N.</div>
        <div class="fr-role">{s['vivi_role']}</div>
      </div>
      <div class="fr-card">
        <div class="fr-stars">★★★★★</div>
        <div class="fr-quote">{s['alj_quote']}</div>
        <div class="fr-author">Aljoscha P.</div>
        <div class="fr-role">{s['alj_role']}</div>
      </div>
    </div>
  </div>
</section>
"""


def build_jsonld(lang: str, page_url: str) -> str:
    s = T[lang]
    person_founder = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "René Scafarti",
        "jobTitle": s["founder_role"],
        "founder": {
            "@type": "Organization",
            "name": "Scafa Investments LLC",
            "url": "https://scafa-investments.com/",
        },
        "description": s["founder_quote"],
    }

    def review(name: str, role: str, body: str):
        return {
            "@type": "Review",
            "author": {"@type": "Person", "name": name, "jobTitle": role},
            "reviewBody": body,
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5",
                "worstRating": "1",
            },
        }

    reviews_block = {
        "@context": "https://schema.org",
        "@type": "MobileApplication",
        "name": "MapRaiders",
        "url": page_url,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "3",
            "reviewCount": "3",
        },
        "review": [
            review("Ron C.", s["ron_role"], s["ron_quote"]),
            review("Vivian N.", s["vivi_role"], s["vivi_quote"]),
            review("Aljoscha P.", s["alj_role"], s["alj_quote"]),
        ],
    }

    return (
        MARKER_JSONLD + "\n"
        + '<script type="application/ld+json">'
        + json.dumps(person_founder, ensure_ascii=False)
        + "</script>\n"
        + '<script type="application/ld+json">'
        + json.dumps(reviews_block, ensure_ascii=False)
        + "</script>"
    )


def page_url_from_path(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel.endswith("/index.html"):
        rel = rel[: -len("index.html")]
    return "https://mapraiders.com/" + rel


def process_file(path: Path) -> tuple[bool, str]:
    try:
        html = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"read-error: {e}"

    skip = should_skip(path, html)
    if skip:
        return False, f"skip:{skip}"

    lang = detect_lang(html, path)
    if not lang:
        return False, "skip:no-lang"

    page_url = page_url_from_path(path)

    # 1. JSON-LD vor </head>
    jsonld = build_jsonld(lang, page_url)
    if "</head>" in html:
        html = html.replace("</head>", jsonld + "\n</head>", 1)

    # 2. HTML-Block vor footer (oder vor </body>)
    block = build_html_block(lang, page_url)
    if re.search(r"<footer\b", html):
        html = re.sub(r"(<footer\b)", block + r"\n\1", html, count=1)
    elif "</body>" in html:
        html = html.replace("</body>", block + "\n</body>", 1)
    else:
        return False, "no-body-end"

    path.write_text(html, encoding="utf-8")
    return True, "OK"


def main():
    print("=" * 60)
    print("Phase K — Founder + 3 Tester Reviews")
    print("=" * 60)

    files = sorted(ROOT.rglob("*.html"))
    stats = {"ok": 0, "skip": 0}
    skip_reasons = {}
    for fp in files:
        changed, info = process_file(fp)
        if changed:
            stats["ok"] += 1
        else:
            stats["skip"] += 1
            reason = info.split(":", 1)[1] if ":" in info else info
            skip_reasons[reason] = skip_reasons.get(reason, 0) + 1

    print(f"\nVerarbeitet: {stats['ok']} Pages")
    print(f"Übersprungen: {stats['skip']} Pages")
    print("Skip-Gründe (Top):")
    for reason, count in sorted(skip_reasons.items(), key=lambda x: -x[1]):
        print(f"  {count:>4}  {reason}")


if __name__ == "__main__":
    main()

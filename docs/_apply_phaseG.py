"""Phase G: BreadcrumbList JSON-LD on all feature + vs subpages.
Idempotent via marker PHASE-G-BREADCRUMBS."""
import re, pathlib, json, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

MARKER = "<!-- PHASE-G-BREADCRUMBS -->"
ROOT = pathlib.Path(__file__).parent
BASE = "https://mapraiders.com"

# Localized labels: (home, features, comparisons)
LABELS = {
    "de": ("Startseite", "Funktionen", "Vergleiche"),
    "en": ("Home", "Features", "Comparisons"),
    "fr": ("Accueil", "Fonctionnalités", "Comparaisons"),
    "es": ("Inicio", "Funciones", "Comparativas"),
    "it": ("Home", "Funzionalità", "Confronti"),
    "pt": ("Início", "Recursos", "Comparações"),
    "tr": ("Ana Sayfa", "Özellikler", "Karşılaştırmalar"),
    "ru": ("Главная", "Функции", "Сравнения"),
    "ja": ("ホーム", "機能", "比較"),
    "ko": ("홈", "기능", "비교"),
    "zh": ("首页", "功能", "比较"),
    "ar": ("الرئيسية", "الميزات", "مقارنات"),
    "hi": ("होम", "विशेषताएं", "तुलना"),
}

# Feature-Titel pro Slug pro Sprache (menschenlesbar)
FEATURE_TITLES = {
    "de": {"territorien": "Territorien", "echos": "Echos", "events": "Events",
           "defense": "Defense-Games", "quests": "Quests", "social": "Social"},
    "en": {"territories": "Territories", "echos": "Echos", "events": "Events",
           "defense-games": "Defense Games", "quests": "Quests", "clans": "Clans"},
    "fr": {"territoires": "Territoires", "echos": "Echos", "evenements": "Événements",
           "jeux-defense": "Jeux de Défense", "quetes": "Quêtes", "clans": "Clans"},
    "es": {"territorios": "Territorios", "ecos": "Ecos", "eventos": "Eventos",
           "juegos-defensa": "Juegos de Defensa", "misiones": "Misiones", "clanes": "Clanes"},
    "it": {"territori": "Territori", "echi": "Echi", "eventi": "Eventi",
           "giochi-difesa": "Giochi di Difesa", "missioni": "Missioni", "clan": "Clan"},
    "pt": {"territories": "Territórios", "echos": "Echos", "events": "Eventos",
           "defense": "Defesa", "quests": "Quests", "clans": "Clãs"},
    "tr": {"territories": "Bölgeler", "echos": "Echos", "events": "Etkinlikler",
           "defense": "Savunma", "quests": "Görevler", "clans": "Klanlar"},
    "ru": {"territories": "Территории", "echos": "Эхо", "events": "События",
           "defense": "Защита", "quests": "Квесты", "clans": "Кланы"},
    "ja": {"territories": "テリトリー", "echos": "エコー", "events": "イベント",
           "defense": "防衛", "quests": "クエスト", "clans": "クラン"},
    "ko": {"territories": "영역", "echos": "에코", "events": "이벤트",
           "defense": "방어", "quests": "퀘스트", "clans": "클랜"},
    "zh": {"territories": "领地", "echos": "回音", "events": "活动",
           "defense": "防御", "quests": "任务", "clans": "氏族"},
    "ar": {"territories": "الأراضي", "echos": "الأصداء", "events": "الفعاليات",
           "defense": "الدفاع", "quests": "المهام", "clans": "العشائر"},
    "hi": {"territories": "क्षेत्र", "echos": "इको", "events": "इवेंट्स",
           "defense": "रक्षा", "quests": "क्वेस्ट्स", "clans": "क्लैन्स"},
}

VS_TITLES = {
    "pokemon-go": "Pokémon GO",
    "ingress": "Ingress",
    "geocaching": "Geocaching",
    "zenly": "Zenly",
}


def lang_prefix(lang: str) -> str:
    return "" if lang == "de" else f"/{lang}"


def home_url(lang: str) -> str:
    return f"{BASE}/" if lang == "de" else f"{BASE}/{lang}/"


def build_breadcrumb(items: list) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": url}
            for i, (name, url) in enumerate(items)
        ]
    }


def inject_breadcrumb(path: pathlib.Path, breadcrumb: dict) -> str:
    html = path.read_text(encoding="utf-8")
    if MARKER in html:
        return f"SKIP {path.relative_to(ROOT)}"
    bc_json = json.dumps(breadcrumb, ensure_ascii=False)
    inject = MARKER + '<script type="application/ld+json">' + bc_json + '</script>'
    m = re.search(r'</head>', html, re.IGNORECASE)
    if not m:
        return f"NOHEAD {path.relative_to(ROOT)}"
    new_html = html[:m.start()] + inject + html[m.start():]
    path.write_text(new_html, encoding="utf-8")
    return f"OK   {path.relative_to(ROOT)}"


def process_features():
    results = []
    for lang, titles in FEATURE_TITLES.items():
        home_label, feat_label, _ = LABELS[lang]
        prefix = lang_prefix(lang)
        for slug, feat_name in titles.items():
            path = ROOT / (lang if lang != "de" else ".") / "features" / f"{slug}.html"
            if lang == "de":
                path = ROOT / "features" / f"{slug}.html"
            if not path.exists():
                results.append(f"MISS {path.relative_to(ROOT)}")
                continue
            bc = build_breadcrumb([
                (home_label, home_url(lang)),
                (feat_label, f"{BASE}{prefix}/#features"),
                (feat_name, f"{BASE}{prefix}/features/{slug}.html"),
            ])
            results.append(inject_breadcrumb(path, bc))
    return results


def process_vs():
    results = []
    for lang in LABELS.keys():
        home_label, _, cmp_label = LABELS[lang]
        prefix = lang_prefix(lang)
        vs_dir = ROOT / (lang if lang != "de" else ".") / "vs"
        if lang == "de":
            vs_dir = ROOT / "vs"
        if not vs_dir.exists():
            continue
        for slug, comp_name in VS_TITLES.items():
            path = vs_dir / f"{slug}.html"
            if not path.exists():
                continue
            bc = build_breadcrumb([
                (home_label, home_url(lang)),
                (cmp_label, f"{BASE}{prefix}/#vs"),
                (f"MapRaiders vs {comp_name}", f"{BASE}{prefix}/vs/{slug}.html"),
            ])
            results.append(inject_breadcrumb(path, bc))
    return results


if __name__ == "__main__":
    all_results = process_features() + process_vs()
    ok = sum(1 for r in all_results if r.startswith("OK"))
    skip = sum(1 for r in all_results if r.startswith("SKIP"))
    miss = sum(1 for r in all_results if r.startswith("MISS") or r.startswith("NOHEAD"))
    for r in all_results:
        print(r)
    print(f"\nTotal: OK={ok} SKIP={skip} MISS/NOHEAD={miss} (of {len(all_results)})")

"""Add category keyword pages to sitemap-{lang}.xml + sitemap.xml root (hreflang-rich)."""
import pathlib, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = pathlib.Path(__file__).parent

# 4 Kategorien × 13 Sprachen = 52 URLs
CATEGORIES = {
    "outdoor_social": {
        "de": "https://mapraiders.com/outdoor-social-app.html",
        "en": "https://mapraiders.com/en/outdoor-social-app.html",
        "fr": "https://mapraiders.com/fr/appli-sociale-outdoor.html",
        "es": "https://mapraiders.com/es/app-social-outdoor.html",
        "it": "https://mapraiders.com/it/app-social-outdoor.html",
        "pt": "https://mapraiders.com/pt/app-social-outdoor.html",
        "tr": "https://mapraiders.com/tr/outdoor-sosyal-app.html",
        "ru": "https://mapraiders.com/ru/outdoor-social-app.html",
        "ja": "https://mapraiders.com/ja/outdoor-social-app.html",
        "ko": "https://mapraiders.com/ko/outdoor-social-app.html",
        "zh": "https://mapraiders.com/zh/outdoor-social-app.html",
        "ar": "https://mapraiders.com/ar/outdoor-social-app.html",
        "hi": "https://mapraiders.com/hi/outdoor-social-app.html",
    },
    "location_based": {
        "de": "https://mapraiders.com/standort-spiel.html",
        "en": "https://mapraiders.com/en/location-based-game.html",
        "fr": "https://mapraiders.com/fr/jeu-geolocalise.html",
        "es": "https://mapraiders.com/es/juego-geolocalizacion.html",
        "it": "https://mapraiders.com/it/gioco-geolocalizzazione.html",
        "pt": "https://mapraiders.com/pt/jogo-geolocalizacao.html",
        "tr": "https://mapraiders.com/tr/konum-tabanli-oyun.html",
        "ru": "https://mapraiders.com/ru/geo-igra.html",
        "ja": "https://mapraiders.com/ja/location-game.html",
        "ko": "https://mapraiders.com/ko/location-game.html",
        "zh": "https://mapraiders.com/zh/location-game.html",
        "ar": "https://mapraiders.com/ar/location-game.html",
        "hi": "https://mapraiders.com/hi/location-game.html",
    },
    "territory_game": {
        "de": "https://mapraiders.com/territorium-spiel.html",
        "en": "https://mapraiders.com/en/territory-game-app.html",
        "fr": "https://mapraiders.com/fr/jeu-territoire.html",
        "es": "https://mapraiders.com/es/juego-territorio.html",
        "it": "https://mapraiders.com/it/gioco-territorio.html",
        "pt": "https://mapraiders.com/pt/jogo-territorio.html",
        "tr": "https://mapraiders.com/tr/bolge-oyunu.html",
        "ru": "https://mapraiders.com/ru/igra-territoriy.html",
        "ja": "https://mapraiders.com/ja/territory-game.html",
        "ko": "https://mapraiders.com/ko/territory-game.html",
        "zh": "https://mapraiders.com/zh/territory-game.html",
        "ar": "https://mapraiders.com/ar/territory-game.html",
        "hi": "https://mapraiders.com/hi/territory-game.html",
    },
    "social_alternative": {
        "de": "https://mapraiders.com/social-media-alternative.html",
        "en": "https://mapraiders.com/en/social-media-alternative.html",
        "fr": "https://mapraiders.com/fr/alternative-reseaux-sociaux.html",
        "es": "https://mapraiders.com/es/alternativa-redes-sociales.html",
        "it": "https://mapraiders.com/it/alternativa-social-media.html",
        "pt": "https://mapraiders.com/pt/alternativa-redes-sociais.html",
        "tr": "https://mapraiders.com/tr/sosyal-medya-alternatifi.html",
        "ru": "https://mapraiders.com/ru/alternativa-soc-setyam.html",
        "ja": "https://mapraiders.com/ja/social-media-alternative.html",
        "ko": "https://mapraiders.com/ko/social-media-alternative.html",
        "zh": "https://mapraiders.com/zh/social-media-alternative.html",
        "ar": "https://mapraiders.com/ar/social-media-alternative.html",
        "hi": "https://mapraiders.com/hi/social-media-alternative.html",
    },
}

LANGS = ["de", "en", "fr", "es", "it", "pt", "tr", "ru", "ja", "ko", "zh", "ar", "hi"]

# 1. Patch per-language sitemaps
for lang in LANGS:
    path = ROOT / f"sitemap-{lang}.xml"
    if not path.exists():
        print(f"MISS {path.name}")
        continue
    txt = path.read_text(encoding="utf-8")
    added = 0
    entries = []
    for cat_key, urls in CATEGORIES.items():
        url = urls[lang]
        if url in txt:
            continue
        entries.append(
            f'  <url>\n    <loc>{url}</loc>\n'
            f'    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n\n'
        )
        added += 1
    if not entries:
        print(f"SKIP {path.name}")
        continue
    new = txt.replace("</urlset>", "".join(entries) + "</urlset>")
    path.write_text(new, encoding="utf-8")
    print(f"OK   {path.name} (+{added})")

# 2. Patch root sitemap.xml — hreflang-rich
root_path = ROOT / "sitemap.xml"
txt = root_path.read_text(encoding="utf-8")
if "outdoor-social-app" in txt and "social-media-alternative" in txt and "territorium-spiel" in txt and "geo-igra" in txt:
    # Already patched — crude check
    print("SKIP sitemap.xml (all categories present)")
else:
    blocks = ['\n  <!-- Category Keyword Pages -->\n']
    for cat_key, urls in CATEGORIES.items():
        for lang in LANGS:
            url = urls[lang]
            if url in txt:
                continue
            hreflang_lines = "\n".join(
                f'    <xhtml:link rel="alternate" hreflang="{l}" href="{urls[l]}"/>'
                for l in LANGS
            )
            blocks.append(
                f'  <url>\n    <loc>{url}</loc>\n'
                f'{hreflang_lines}\n'
                f'    <xhtml:link rel="alternate" hreflang="x-default" href="{urls["en"]}"/>\n'
                f'    <changefreq>monthly</changefreq><priority>0.7</priority>\n  </url>\n'
            )
    if len(blocks) == 1:
        print("SKIP sitemap.xml (no new URLs)")
    else:
        new = txt.replace("</urlset>", "".join(blocks) + "\n</urlset>")
        root_path.write_text(new, encoding="utf-8")
        print(f"OK   sitemap.xml (+{len(blocks)-1} URLs)")

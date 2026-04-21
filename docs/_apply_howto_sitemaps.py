"""Add Phase F Howto pages (13 languages × 5 pages = 65 URLs) to per-lang sitemaps + root."""
import pathlib, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = pathlib.Path(__file__).parent

HOWTO = {
    "de": {
        "index":       "https://mapraiders.com/howto/",
        "territories": "https://mapraiders.com/howto/territorien.html",
        "echos":       "https://mapraiders.com/howto/echos.html",
        "clans":       "https://mapraiders.com/howto/clans.html",
        "defense":     "https://mapraiders.com/howto/verteidigungs-minispiele.html",
    },
    "en": {
        "index":       "https://mapraiders.com/en/howto/",
        "territories": "https://mapraiders.com/en/howto/territories.html",
        "echos":       "https://mapraiders.com/en/howto/echos.html",
        "clans":       "https://mapraiders.com/en/howto/clans.html",
        "defense":     "https://mapraiders.com/en/howto/defense-minigames.html",
    },
    "fr": {
        "index":       "https://mapraiders.com/fr/howto/",
        "territories": "https://mapraiders.com/fr/howto/territoires.html",
        "echos":       "https://mapraiders.com/fr/howto/echos.html",
        "clans":       "https://mapraiders.com/fr/howto/clans.html",
        "defense":     "https://mapraiders.com/fr/howto/jeux-defense.html",
    },
    "es": {
        "index":       "https://mapraiders.com/es/howto/",
        "territories": "https://mapraiders.com/es/howto/territorios.html",
        "echos":       "https://mapraiders.com/es/howto/ecos.html",
        "clans":       "https://mapraiders.com/es/howto/clanes.html",
        "defense":     "https://mapraiders.com/es/howto/juegos-defensa.html",
    },
    "it": {
        "index":       "https://mapraiders.com/it/howto/",
        "territories": "https://mapraiders.com/it/howto/territori.html",
        "echos":       "https://mapraiders.com/it/howto/echi.html",
        "clans":       "https://mapraiders.com/it/howto/clan.html",
        "defense":     "https://mapraiders.com/it/howto/minigiochi-difesa.html",
    },
    "pt": {
        "index":       "https://mapraiders.com/pt/howto/",
        "territories": "https://mapraiders.com/pt/howto/territorios.html",
        "echos":       "https://mapraiders.com/pt/howto/ecos.html",
        "clans":       "https://mapraiders.com/pt/howto/cla.html",
        "defense":     "https://mapraiders.com/pt/howto/minijogos-defesa.html",
    },
    "tr": {
        "index":       "https://mapraiders.com/tr/howto/",
        "territories": "https://mapraiders.com/tr/howto/bolgeler.html",
        "echos":       "https://mapraiders.com/tr/howto/echolar.html",
        "clans":       "https://mapraiders.com/tr/howto/klanlar.html",
        "defense":     "https://mapraiders.com/tr/howto/savunma-oyunlari.html",
    },
    "ru": {
        "index":       "https://mapraiders.com/ru/howto/",
        "territories": "https://mapraiders.com/ru/howto/territorii.html",
        "echos":       "https://mapraiders.com/ru/howto/ekho.html",
        "clans":       "https://mapraiders.com/ru/howto/klany.html",
        "defense":     "https://mapraiders.com/ru/howto/zashchita-igry.html",
    },
    "ja": {
        "index":       "https://mapraiders.com/ja/howto/",
        "territories": "https://mapraiders.com/ja/howto/territories.html",
        "echos":       "https://mapraiders.com/ja/howto/echos.html",
        "clans":       "https://mapraiders.com/ja/howto/clans.html",
        "defense":     "https://mapraiders.com/ja/howto/defense-minigames.html",
    },
    "ko": {
        "index":       "https://mapraiders.com/ko/howto/",
        "territories": "https://mapraiders.com/ko/howto/territories.html",
        "echos":       "https://mapraiders.com/ko/howto/echos.html",
        "clans":       "https://mapraiders.com/ko/howto/clans.html",
        "defense":     "https://mapraiders.com/ko/howto/defense-minigames.html",
    },
    "zh": {
        "index":       "https://mapraiders.com/zh/howto/",
        "territories": "https://mapraiders.com/zh/howto/territories.html",
        "echos":       "https://mapraiders.com/zh/howto/echos.html",
        "clans":       "https://mapraiders.com/zh/howto/clans.html",
        "defense":     "https://mapraiders.com/zh/howto/defense-minigames.html",
    },
    "ar": {
        "index":       "https://mapraiders.com/ar/howto/",
        "territories": "https://mapraiders.com/ar/howto/territories.html",
        "echos":       "https://mapraiders.com/ar/howto/echos.html",
        "clans":       "https://mapraiders.com/ar/howto/clans.html",
        "defense":     "https://mapraiders.com/ar/howto/defense-minigames.html",
    },
    "hi": {
        "index":       "https://mapraiders.com/hi/howto/",
        "territories": "https://mapraiders.com/hi/howto/territories.html",
        "echos":       "https://mapraiders.com/hi/howto/echos.html",
        "clans":       "https://mapraiders.com/hi/howto/clans.html",
        "defense":     "https://mapraiders.com/hi/howto/defense-minigames.html",
    },
}

LANGS = list(HOWTO.keys())
KEYS = ["index", "territories", "echos", "clans", "defense"]

# 1. Per-language sitemaps
for lang in LANGS:
    path = ROOT / f"sitemap-{lang}.xml"
    txt = path.read_text(encoding="utf-8")
    added = 0
    entries = []
    for key in KEYS:
        url = HOWTO[lang][key]
        if url in txt:
            continue
        prio = "0.7" if key != "index" else "0.7"
        entries.append(
            f'  <url>\n    <loc>{url}</loc>\n'
            f'    <changefreq>monthly</changefreq>\n    <priority>{prio}</priority>\n  </url>\n\n'
        )
        added += 1
    if entries:
        new = txt.replace("</urlset>", "".join(entries) + "</urlset>")
        path.write_text(new, encoding="utf-8")
    print(f"OK   sitemap-{lang}.xml (+{added})")

# 2. Root sitemap with hreflang-reciprocity
root = ROOT / "sitemap.xml"
txt = root.read_text(encoding="utf-8")
blocks = ['\n  <!-- Howto Guides (Phase F) -->\n']
for key in KEYS:
    for lang in LANGS:
        url = HOWTO[lang][key]
        if url in txt:
            continue
        hreflang_lines = "\n".join(
            f'    <xhtml:link rel="alternate" hreflang="{l}" href="{HOWTO[l][key]}"/>'
            for l in LANGS
        )
        blocks.append(
            f'  <url>\n    <loc>{url}</loc>\n'
            f'{hreflang_lines}\n'
            f'    <xhtml:link rel="alternate" hreflang="x-default" href="{HOWTO["en"][key]}"/>\n'
            f'    <changefreq>monthly</changefreq><priority>0.7</priority>\n  </url>\n'
        )
if len(blocks) > 1:
    new = txt.replace("</urlset>", "".join(blocks) + "\n</urlset>")
    root.write_text(new, encoding="utf-8")
    print(f"OK   sitemap.xml (+{len(blocks)-1})")
else:
    print("SKIP sitemap.xml")

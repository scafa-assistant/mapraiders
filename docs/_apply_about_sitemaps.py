"""Add About page URLs to all 13 language sitemaps + sitemap.xml root."""
import pathlib, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = pathlib.Path(__file__).parent

ABOUT = {
    "de": "https://mapraiders.com/ueber-uns.html",
    "en": "https://mapraiders.com/en/about.html",
    "fr": "https://mapraiders.com/fr/a-propos.html",
    "es": "https://mapraiders.com/es/sobre-nosotros.html",
    "it": "https://mapraiders.com/it/chi-siamo.html",
    "pt": "https://mapraiders.com/pt/sobre.html",
    "tr": "https://mapraiders.com/tr/hakkimizda.html",
    "ru": "https://mapraiders.com/ru/o-nas.html",
    "ja": "https://mapraiders.com/ja/about.html",
    "ko": "https://mapraiders.com/ko/about.html",
    "zh": "https://mapraiders.com/zh/about.html",
    "ar": "https://mapraiders.com/ar/about.html",
    "hi": "https://mapraiders.com/hi/about.html",
}

# Patch single-lang sitemaps
for lang, url in ABOUT.items():
    path = ROOT / f"sitemap-{lang}.xml"
    if not path.exists():
        print(f"MISS {path.name}")
        continue
    txt = path.read_text(encoding="utf-8")
    if url in txt:
        print(f"SKIP {path.name}")
        continue
    entry = f'  <url>\n    <loc>{url}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n\n'
    new = txt.replace("</urlset>", entry + "</urlset>")
    path.write_text(new, encoding="utf-8")
    print(f"OK   {path.name}")

# Patch root sitemap.xml with hreflang-rich block
root_path = ROOT / "sitemap.xml"
txt = root_path.read_text(encoding="utf-8")
if "/ueber-uns.html" in txt:
    print("SKIP sitemap.xml")
else:
    block = ['  <!-- About Pages -->\n']
    for lang, url in ABOUT.items():
        hreflang_lines = '\n'.join(
            f'    <xhtml:link rel="alternate" hreflang="{l}" href="{ABOUT[l]}"/>'
            for l in ABOUT.keys()
        )
        block.append(f'''  <url>
    <loc>{url}</loc>
{hreflang_lines}
    <xhtml:link rel="alternate" hreflang="x-default" href="{ABOUT["en"]}"/>
    <changefreq>monthly</changefreq><priority>0.7</priority>
  </url>
''')
    new = txt.replace("</urlset>", ''.join(block) + "\n</urlset>")
    root_path.write_text(new, encoding="utf-8")
    print("OK   sitemap.xml")

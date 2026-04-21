"""Add Phase I-1 niche landing pages to sitemap-de.xml, sitemap-en.xml, and root sitemap.xml."""
import pathlib, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = pathlib.Path(__file__).parent

# 8 Nischen × 2 Sprachen = 16 URLs (trailing slash → index.html in Ordner)
NICHES = {
    "dog_walking":    {"de": "https://mapraiders.com/hundespaziergang/",  "en": "https://mapraiders.com/en/dog-walking/"},
    "jogging":        {"de": "https://mapraiders.com/jogging/",           "en": "https://mapraiders.com/en/running-game/"},
    "scavenger":      {"de": "https://mapraiders.com/schnitzeljagd/",     "en": "https://mapraiders.com/en/scavenger-hunt/"},
    "urban_explorer": {"de": "https://mapraiders.com/stadt-entdecken/",   "en": "https://mapraiders.com/en/urban-explorer/"},
    "fitness_mmo":    {"de": "https://mapraiders.com/fitness-mmo/",       "en": "https://mapraiders.com/en/fitness-mmo/"},
    "cycling":        {"de": "https://mapraiders.com/radfahren/",         "en": "https://mapraiders.com/en/cycling-game/"},
    "neighborhood":   {"de": "https://mapraiders.com/nachbarschaft/",     "en": "https://mapraiders.com/en/neighborhood/"},
    "audio_graffiti": {"de": "https://mapraiders.com/audio-graffiti/",    "en": "https://mapraiders.com/en/audio-graffiti/"},
}

for lang in ["de", "en"]:
    path = ROOT / f"sitemap-{lang}.xml"
    txt = path.read_text(encoding="utf-8")
    added = 0
    entries = []
    for urls in NICHES.values():
        url = urls[lang]
        if url in txt:
            continue
        entries.append(
            f'  <url>\n    <loc>{url}</loc>\n'
            f'    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n\n'
        )
        added += 1
    if entries:
        new = txt.replace("</urlset>", "".join(entries) + "</urlset>")
        path.write_text(new, encoding="utf-8")
    print(f"OK   sitemap-{lang}.xml (+{added})")

# Root sitemap — hreflang DE+EN, x-default=EN
root = ROOT / "sitemap.xml"
txt = root.read_text(encoding="utf-8")
blocks = ['\n  <!-- Niche Landing Pages (Phase I-1) -->\n']
for urls in NICHES.values():
    for lang in ["de", "en"]:
        url = urls[lang]
        if url in txt:
            continue
        blocks.append(
            f'  <url>\n    <loc>{url}</loc>\n'
            f'    <xhtml:link rel="alternate" hreflang="de" href="{urls["de"]}"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="en" href="{urls["en"]}"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="x-default" href="{urls["en"]}"/>\n'
            f'    <changefreq>monthly</changefreq><priority>0.8</priority>\n  </url>\n'
        )
if len(blocks) > 1:
    new = txt.replace("</urlset>", "".join(blocks) + "\n</urlset>")
    root.write_text(new, encoding="utf-8")
    print(f"OK   sitemap.xml (+{len(blocks)-1})")
else:
    print("SKIP sitemap.xml")

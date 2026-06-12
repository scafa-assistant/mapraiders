# Phase 3.2: contextual killer-keyword links from niche pages to the new
# Phase-2 assets (claim-your-city, ADHD motivation, geocaching listicle).
# Inserts a compact "related" section right before the final cta-sec.
# Idempotent via the geo-asset-links marker.
import io
from pathlib import Path

ROOT = Path(__file__).parent
MARKER = "<!-- GEO-ASSET-LINKS -->"

# page -> list of (href, anchor text). Anchor carries the target keyword.
LINKS = {
    "en/dog-walking/index.html": [
        ("/en/claim-your-city.html", "Claim your city before anyone else"),
        ("/en/adhd-walking-motivation.html", "Walking motivation through gamification"),
    ],
    "en/running-game/index.html": [
        ("/en/claim-your-city.html", "Claim your city before anyone else"),
        ("/en/adhd-walking-motivation.html", "Walking motivation through gamification"),
    ],
    "en/urban-explorer/index.html": [
        ("/en/claim-your-city.html", "Claim your city before anyone else"),
    ],
    "en/scavenger-hunt/index.html": [
        ("/en/free-geocaching-alternatives.html", "Free geocaching alternatives compared"),
    ],
    "en/fitness-mmo/index.html": [
        ("/en/claim-your-city.html", "Claim your city before anyone else"),
    ],
    "hundespaziergang/index.html": [
        ("/erobere-deine-stadt.html", "Erobere deine Stadt, bevor es jemand anderes tut"),
    ],
    "jogging/index.html": [
        ("/erobere-deine-stadt.html", "Erobere deine Stadt, bevor es jemand anderes tut"),
    ],
    "schnitzeljagd/index.html": [
        ("/geocaching-alternative-kostenlos.html", "Kostenlose Geocaching-Alternativen im Vergleich"),
    ],
    "stadt-entdecken/index.html": [
        ("/erobere-deine-stadt.html", "Erobere deine Stadt, bevor es jemand anderes tut"),
    ],
}

HEADING = {"en": "Read next", "de": "Lies weiter"}


def main() -> None:
    changed = 0
    for rel, links in LINKS.items():
        path = ROOT / rel
        if not path.exists():
            print(f"!! missing {rel}")
            continue
        html = io.open(path, encoding="utf-8").read()
        if MARKER in html:
            continue
        anchor = html.rfind('<section class="cta-sec">')
        if anchor == -1:
            print(f"!! no cta-sec in {rel}")
            continue
        lang = "en" if rel.startswith("en/") else "de"
        items = "".join(
            f'    <p style="margin:6px 0"><a href="{href}" '
            f'style="color:var(--accent);font-weight:600">{text} &rarr;</a></p>\n'
            for href, text in links
        )
        section = (
            f"{MARKER}\n"
            '<section class="sec rv" style="padding:48px 0">\n'
            '  <div class="mx" style="max-width:760px;margin:0 auto;padding:0 28px">\n'
            f'    <h2 style="font-size:22px;font-weight:800;margin-bottom:14px">{HEADING[lang]}</h2>\n'
            f"{items}"
            "  </div>\n"
            "</section>\n"
            "<!-- /GEO-ASSET-LINKS -->\n\n"
        )
        html = html[:anchor] + section + html[anchor:]
        io.open(path, "w", encoding="utf-8", newline="").write(html)
        changed += 1
        print(f"linked {rel}")
    print(f"{changed} pages changed")


if __name__ == "__main__":
    main()

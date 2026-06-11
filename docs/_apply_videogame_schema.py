# Adds a VideoGame JSON-LD block next to the existing MobileApplication schema.
# MobileApplication tells engines "this is an app", VideoGame tells them
# deterministically "this is a game" - LLMs and rich results use both.
#
# Targets every page that already carries a MobileApplication schema (vs pages,
# feature pages, niche landing pages, category pages, homepages). Name, url,
# description, language and offers are mirrored from the page's own
# MobileApplication block, so nothing can drift.
#
# Idempotent: pages already containing a VideoGame schema are skipped.
import io
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent

SCRIPT_RE = re.compile(
    r'<script type="application/ld\+json">(\{.*?\})</script>', re.S
)


def build_videogame(mobile_app: dict) -> dict:
    vg = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": mobile_app.get("name", "MapRaiders"),
        "url": mobile_app.get("url", "https://mapraiders.com/"),
        "genre": [
            "Location-based game",
            "Territory conquest",
            "Fitness game",
            "MMO",
        ],
        "gamePlatform": "Android",
        "operatingSystem": "Android",
        "applicationCategory": "Game",
        "playMode": "https://schema.org/MultiPlayer",
        "author": mobile_app.get(
            "author",
            {
                "@type": "Organization",
                "name": "Scafa Investments LLC",
                "url": "https://scafa-investments.com/",
            },
        ),
    }
    for key in ("description", "inLanguage", "offers", "screenshot"):
        if key in mobile_app:
            vg[key] = mobile_app[key]
    return vg


def process(path: Path) -> bool:
    html = io.open(path, encoding="utf-8").read()
    if '"@type":"VideoGame"' in html or '"@type": "VideoGame"' in html:
        return False
    mobile_match = None
    mobile_data = None
    for m in SCRIPT_RE.finditer(html):
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and data.get("@type") == "MobileApplication":
            mobile_match, mobile_data = m, data
            break
    if mobile_match is None:
        return False
    vg_json = json.dumps(build_videogame(mobile_data), ensure_ascii=False, separators=(",", ":"))
    insert = f'\n<script type="application/ld+json">{vg_json}</script>'
    pos = mobile_match.end()
    html = html[:pos] + insert + html[pos:]
    io.open(path, "w", encoding="utf-8", newline="").write(html)
    return True


def main() -> None:
    changed = 0
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        parts = rel.parts
        if parts[0] in ("_retired", "__pycache__"):
            continue
        if process(path):
            changed += 1
    print(f"{changed} pages got a VideoGame schema")


if __name__ == "__main__":
    main()

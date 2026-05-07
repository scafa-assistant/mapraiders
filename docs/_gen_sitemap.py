#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates a single sitemap.xml from all HTML files in docs/.

Replaces the previous mess of:
  - sitemap.xml (372 URLs, no Phase-1)
  - sitemap-phase1.xml (240 Phase-1 URLs only)
  - sitemap-{de,en,fr,...}.xml (13 stale per-language sitemaps with /pt/ etc.)

Run: py docs/_gen_sitemap.py
Idempotent: overwrites sitemap.xml.
"""

import datetime
from pathlib import Path
from urllib.parse import quote

DOCS = Path(__file__).resolve().parent
SITE = "https://mapraiders.com"

# Files/dirs to exclude from sitemap
EXCLUDE_NAMES = {
    "404.html",  # not for indexing
    "google-search-console-verification.html",  # internal
}
EXCLUDE_DIR_PARTS = {
    "node_modules",
    ".git",
    "_drafts",
}

# Priority rules (highest first, first match wins)
PRIORITY_RULES = [
    # Phase-1 Killer slugs (hand-curated key keywords -> priority 0.9)
    (lambda p: any(kw in p for kw in [
        "spiele-wie-pokemon-go", "games-like-pokemon-go", "jeux-comme-pokemon-go",
        "juegos-como-pokemon-go", "giochi-come-pokemon-go", "alternativa-pokemon-go",
        "alternative-pokemon-go", "pokemon-go-alternative", "konum-tabanli",
        "geo-igra", "igra-territoriy", "territorium-spiel", "territory-game",
        "jogos-como-pokemon-go", "ポケモンgo", "位置情報ゲーム", "陣取りゲーム",
        "포켓몬고", "宝可梦go", "寶可夢go", "पोकेमॉन", "بوكيمون", "pokemon-go-mukamil",
        "schnitzeljagd-app", "scavenger-hunt", "caccia-al-tesoro", "chasse-au-tresor",
        "caca-ao-tesouro", "handyspiel-zum-laufen", "best-walking-apps", "running-game",
        "standort-spiel", "location-game", "location-based-game", "geolocalisation",
        "gps-spiel", "jeu-gps", "juego-gps", "gioco-gps", "jogo-de-gps",
    ]), 0.9),
    # Index / homepage / root
    (lambda p: p in ("/", "/index.html") or p.endswith("/index.html"), 0.8),
    # Hub pages
    (lambda p: "erfahrungen.html" in p or "reviews.html" in p or "MapRaiders-" in p, 0.8),
    # Legal / about
    (lambda p: any(s in p for s in ["agb", "datenschutz", "impressum", "kontakt", "about", "chi-siamo", "a-propos", "soobre"]), 0.3),
    # Default
    (lambda p: True, 0.5),
]


def get_priority(url_path: str) -> float:
    for matcher, prio in PRIORITY_RULES:
        if matcher(url_path):
            return prio
    return 0.5


def should_include(p: Path) -> bool:
    if p.name in EXCLUDE_NAMES:
        return False
    if p.name.startswith("_"):
        return False  # builder scripts, drafts
    for part in p.parts:
        if part in EXCLUDE_DIR_PARTS:
            return False
    return True


def file_to_url_path(p: Path) -> str:
    """Build URL path from file path. /index.html -> /, others as-is, percent-encoded for CJK."""
    rel = p.relative_to(DOCS)
    raw = "/" + str(rel).replace("\\", "/")
    if raw.endswith("/index.html"):
        raw = raw[: -len("index.html")]
    # percent-encode non-ASCII for valid sitemap XML and nginx URL handling
    return quote(raw, safe="/-._~")


def main():
    htmls = sorted(p for p in DOCS.rglob("*.html") if should_include(p))
    today = datetime.date.today().isoformat()

    entries = []
    for h in htmls:
        url_path = file_to_url_path(h)
        url = f"{SITE}{url_path}"
        prio = get_priority(url_path)
        entries.append(
            f"  <url>\n"
            f"    <loc>{url}</loc>\n"
            f"    <lastmod>{today}</lastmod>\n"
            f"    <priority>{prio:.1f}</priority>\n"
            f"  </url>"
        )

    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )

    out = DOCS / "sitemap.xml"
    out.write_text(sitemap, encoding="utf-8")
    print(f"[OK] {len(entries)} URLs written to {out}")
    print(f"     Priority breakdown:")
    from collections import Counter
    prios = Counter(get_priority(file_to_url_path(h)) for h in htmls)
    for p, n in sorted(prios.items(), reverse=True):
        print(f"       {p}: {n} URLs")


if __name__ == "__main__":
    main()

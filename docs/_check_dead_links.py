#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Scan all HTML files in docs/ and find internal links to non-existent files.
Groups results by source-page-language for systematic gap-filling.
"""

import re
import urllib.parse
from collections import defaultdict
from pathlib import Path

DOCS = Path(__file__).resolve().parent
HREF_RE = re.compile(r'href="([^"]+)"')


def url_to_path(href: str):
    """Convert internal href to local docs/ path. Returns None for external/anchor/asset."""
    if href.startswith(("http://", "https://", "mailto:", "tel:", "javascript:", "#")):
        return None
    # Strip fragment + query
    href = href.split("#")[0].split("?")[0]
    if not href:
        return None
    href = urllib.parse.unquote(href)
    # Skip favicons / static assets
    if any(href.endswith(ext) for ext in (".ico", ".png", ".svg", ".css", ".js", ".jpg", ".webp", ".xml", ".pdf")):
        return None
    if href == "/":
        return DOCS / "index.html"
    if href.endswith("/"):
        return DOCS / href.lstrip("/").rstrip("/") / "index.html"
    return DOCS / href.lstrip("/")


def main():
    # broken_link -> set of source pages that link to it
    broken_to_sources = defaultdict(set)

    for html_path in DOCS.rglob("*.html"):
        if html_path.name.startswith("_"):
            continue
        try:
            content = html_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        rel_source = str(html_path.relative_to(DOCS)).replace("\\", "/")

        for href in HREF_RE.findall(content):
            target = url_to_path(href)
            if target is None:
                continue
            if not target.exists():
                broken_to_sources[href].add(rel_source)

    # Group by language prefix of source
    lang_to_broken = defaultdict(set)
    for href, sources in broken_to_sources.items():
        for src in sources:
            parts = src.split("/")
            lang = parts[0] if parts[0] in {
                "en", "fr", "es-mx", "it", "pt-br", "tr", "ru",
                "ja", "ko", "zh-cn", "zh-tw", "ar", "hi", "id", "en-in",
            } else "de"
            lang_to_broken[lang].add(href)

    print(f"Total broken hrefs: {len(broken_to_sources)}")
    print(f"Total dead-link occurrences: {sum(len(s) for s in broken_to_sources.values())}")
    print()

    # Most-referenced broken links
    print("=== Top 20 most-referenced broken links ===")
    sorted_broken = sorted(broken_to_sources.items(), key=lambda kv: -len(kv[1]))
    for href, sources in sorted_broken[:20]:
        print(f"  [{len(sources):4}x]  {href}")

    print()
    print("=== Broken links by SOURCE language ===")
    for lang in sorted(lang_to_broken.keys()):
        print(f"  {lang}: {len(lang_to_broken[lang])} unique broken hrefs")

    print()
    print("=== ALL broken hrefs (sorted) ===")
    for href in sorted(broken_to_sources.keys()):
        n = len(broken_to_sources[href])
        # show a sample source
        sample = next(iter(broken_to_sources[href]))
        print(f"  [{n:3}x]  {href}    (e.g. linked from: {sample})")


if __name__ == "__main__":
    main()

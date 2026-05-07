#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Removes <link rel="alternate" hreflang="..." href="..."> tags whose href
points to a non-existent page on disk.

Why: stale hreflang tags pointing to soft-404 URLs cause Google to discover
"phantom" URLs that confuse the language signal. With nginx now returning real
404 (instead of fallback to /index.html), such hreflang tags are pure noise.

Run: py docs/_clean_hreflang.py
Idempotent: re-running on cleaned files removes nothing.
"""

import re
import urllib.parse
from collections import Counter
from pathlib import Path

DOCS = Path(__file__).resolve().parent
SITE = "https://mapraiders.com"

HREFLANG_RE = re.compile(
    r'<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*/?>',
    re.IGNORECASE,
)


def url_to_path(url: str):
    if not url.startswith(SITE):
        return None
    p = url[len(SITE):]
    p = urllib.parse.unquote(p)
    if p == "" or p == "/":
        return DOCS / "index.html"
    if p.endswith("/"):
        return DOCS / p.lstrip("/").rstrip("/") / "index.html"
    return DOCS / p.lstrip("/")


def main():
    files_changed = 0
    removed_total = 0
    broken_url_counts = Counter()

    for html_path in DOCS.rglob("*.html"):
        if html_path.name.startswith("_"):
            continue
        if any(part in (".git", "node_modules") for part in html_path.parts):
            continue

        content = html_path.read_text(encoding="utf-8")

        removed_in_this_file = [0]

        def replace(match):
            lang = match.group(1)
            url = match.group(2)
            target = url_to_path(url)
            if target is not None and target.exists():
                return match.group(0)
            broken_url_counts[(lang, url)] += 1
            removed_in_this_file[0] += 1
            return ""

        new_content = HREFLANG_RE.sub(replace, content)

        if new_content != content:
            # collapse 3+ consecutive newlines (with optional whitespace) to 2,
            # cleaning up gaps left by removed tags
            new_content = re.sub(r'(\n[ \t]*){3,}', '\n\n', new_content)
            html_path.write_text(new_content, encoding="utf-8")
            files_changed += 1
            removed_total += removed_in_this_file[0]

    print(f"Files modified:        {files_changed}")
    print(f"Hreflang tags removed: {removed_total}")
    print(f"Unique broken targets: {len(broken_url_counts)}")
    print()
    print("Top 30 broken (lang, url) pairs by occurrence count:")
    for (lang, url), n in broken_url_counts.most_common(30):
        print(f"  [{n:4}x]  {lang:<8}  {url}")


if __name__ == "__main__":
    main()

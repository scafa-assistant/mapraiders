#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix grid-map cell styling bug across all 16 language index pages.

Bug: when a cell is hovered (.soft, opacity 0.2) AND clicked (.on, opacity 0.72)
at the same time, CSS specificity ties pick the LATER declaration. Original
order was .on then .soft -> .soft wins -> click looks washed out.

Fix:
1. Swap CSS order: .soft first, .on after (so .on wins on conflict)
2. Defense-in-depth: in JS click/drag handlers, remove .soft before adding .on
"""

import re
from pathlib import Path

DOCS = Path(__file__).resolve().parent

LANG_INDEXES = [
    "index.html",
    "en/index.html",
    "fr/index.html",
    "es-mx/index.html",
    "it/index.html",
    "pt-br/index.html",
    "tr/index.html",
    "ru/index.html",
    "ja/index.html",
    "ko/index.html",
    "zh-cn/index.html",
    "zh-tw/index.html",
    "ar/index.html",
    "hi/index.html",
    "id/index.html",
    "en-in/index.html",
]

# CSS swap: ".mc.on{opacity:.72}.mc.soft{opacity:.2}" (any whitespace incl none)
# -> ".mc.soft{opacity:.2}.mc.on{opacity:.72}"
CSS_PATTERN = re.compile(
    r'(\.mc\.on\{opacity:\.72\})(\s*)(\.mc\.soft\{opacity:\.2\})'
)
CSS_REPLACEMENT = r'\3\2\1'

# JS: when adding .on (in mousedown/mousemove/touchstart/touchmove) -> also remove .soft
# Match: t.classList.add('on');\n      t.style.transition='opacity .15s ease';
JS_PATTERN = re.compile(
    r"(\s*)(t\.classList\.add\('on'\);)\s*\n(\s*)(t\.style\.transition='opacity \.15s ease';)"
)
JS_REPLACEMENT = r"\1t.classList.remove('soft');\n\1\2\n\3\4"


def main():
    files_changed = 0
    css_swaps = 0
    js_patches = 0
    for rel in LANG_INDEXES:
        path = DOCS / rel
        if not path.exists():
            print(f"  -- skip (missing): {rel}")
            continue

        content = path.read_text(encoding="utf-8")
        original = content

        new_content, n = CSS_PATTERN.subn(CSS_REPLACEMENT, content)
        css_swaps += n

        new_content, m = JS_PATTERN.subn(JS_REPLACEMENT, new_content)
        js_patches += m

        if new_content != original:
            path.write_text(new_content, encoding="utf-8")
            files_changed += 1
            print(f"  [OK] {rel}  (css_swap={n}, js_patch={m})")
        else:
            print(f"  -- {rel}  (no change — already fixed or different format)")

    print()
    print(f"Files changed: {files_changed}")
    print(f"CSS order swaps: {css_swaps}")
    print(f"JS .soft-cleanup additions: {js_patches}")


if __name__ == "__main__":
    main()

# Fix en-IN CSS corruption: a past en -> en-IN britishization pass also rewrote
# CSS inside <style> blocks (align-items:centre, colour:var(--accent), ...),
# which are invalid CSS properties/values and break layout/colors.
# Only touches <style>...</style> regions; visible British text stays untouched.
# Idempotent: re-running finds nothing to replace.
import io
import re
from pathlib import Path

FIXES = [
    ("colour", "color"),          # property names and var() usages
    (":centre", ":center"),       # property values like align-items:centre
    (" centre;", " center;"),
    ("text-align:centre", "text-align:center"),
]

STYLE_RE = re.compile(r"(<style>)(.*?)(</style>)", re.S)


def fix_css(css: str) -> str:
    for old, new in FIXES:
        css = css.replace(old, new)
    return css


# Inline style="..." attributes were corrupted too. These colon/hyphenated
# forms only ever occur in CSS, never in visible British prose, so a global
# replace is safe.
INLINE_FIXES = [
    ("border-left-colour", "border-left-color"),
    ("background-colour", "background-color"),
    ("colour:", "color:"),
    ("currentColour", "currentColor"),
]


def main() -> None:
    root = Path(__file__).parent / "en-in"
    changed = 0
    for path in sorted(root.rglob("*.html")):
        html = io.open(path, encoding="utf-8").read()
        fixed = STYLE_RE.sub(lambda m: m.group(1) + fix_css(m.group(2)) + m.group(3), html)
        for old, new in INLINE_FIXES:
            fixed = fixed.replace(old, new)
        if fixed != html:
            io.open(path, "w", encoding="utf-8", newline="").write(fixed)
            changed += 1
            print(f"fixed {path}")
    print(f"{changed} files changed")


if __name__ == "__main__":
    main()

"""
Phase 0c — ID-Create: /id/ komplett neu (Bahasa Indonesia).

Skelett-Migration: /en/ → /id/ als Basis. Echter Bahasa-Content kommt in
Phase 1 mit dedizierten Page-Generierungen pro Killer-URL.

1. Kopiere /en/ → /id/ als Skelett
2. lang="id" + Schema inLanguage="id"
3. Canonical-URLs → /id/
4. Internal Links /en/ → /id/ (innerhalb /id/-Files)
5. hreflang id global ergänzen

Aufruf: py docs/_apply_id_create.py
"""
from __future__ import annotations
from pathlib import Path
import re
import sys
import shutil

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
EN_DIR = ROOT / "en"
ID_DIR = ROOT / "id"


def transform_html_for_id(html: str) -> str:
    """EN → ID Skelett-Transform (lang/inLanguage/links/canonical)."""
    html = re.sub(r'<html\s+lang="en"', '<html lang="id"', html)
    html = re.sub(r'<html\s+lang="en-US"', '<html lang="id"', html)

    # Internal /en/ → /id/ within copied pages
    html = re.sub(r'href="/en/([^"]*)"', r'href="/id/\1"', html)

    # inLanguage in JSON-LD
    html = re.sub(r'"inLanguage"\s*:\s*"en"', '"inLanguage": "id"', html)
    html = re.sub(r'"inLanguage"\s*:\s*"en-US"', '"inLanguage": "id"', html)

    # Canonical
    html = re.sub(
        r'<link\s+rel="canonical"\s+href="https://mapraiders\.com/en/([^"]*)"',
        r'<link rel="canonical" href="https://mapraiders.com/id/\1"',
        html,
    )
    return html


def copy_skeleton() -> int:
    if not EN_DIR.exists():
        return 0
    ID_DIR.mkdir(exist_ok=True)
    count = 0
    for src in EN_DIR.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(EN_DIR).as_posix()
        dest = ID_DIR / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix == ".html":
            html = src.read_text(encoding="utf-8")
            dest.write_text(transform_html_for_id(html), encoding="utf-8")
        else:
            shutil.copy2(src, dest)
        count += 1
    return count


def update_global_hreflang_add_id() -> int:
    """Add hreflang id tag globally (next to existing en or fr)."""
    new_tag = '<link rel="alternate" hreflang="id" href="https://mapraiders.com/id/">'
    count = 0
    for fp in ROOT.rglob("*.html"):
        rel = fp.relative_to(ROOT).as_posix()
        if rel.startswith("id/"):
            continue
        try:
            html = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        if 'hreflang="id"' in html:
            continue
        # Insert after en hreflang
        new_html = re.sub(
            r'(<link\s+rel="alternate"\s+hreflang="en"[^>]*>)',
            r'\1\n' + new_tag,
            html,
            count=1,
        )
        if new_html != html:
            fp.write_text(new_html, encoding="utf-8")
            count += 1
    return count


def main() -> None:
    print("=" * 60)
    print("Phase 0c — ID-Create: /id/ komplett neu (Bahasa Indonesia Skelett)")
    print("=" * 60)

    if ID_DIR.exists() and any(ID_DIR.iterdir()):
        print("⚠ /id/ existiert bereits. Skip.")
        return

    print("\n[1/2] Kopiere /en/ → /id/ als Skelett…")
    print(f"     → {copy_skeleton()} Pages")

    print("\n[2/2] Ergänze hreflang id global…")
    print(f"     → {update_global_hreflang_add_id()} Pages")

    print("\n✓ ID-Create-Skelett fertig.")
    print("   Bahasa-Content kommt in Phase 1 (dedizierte Page-Generierung).")


if __name__ == "__main__":
    main()

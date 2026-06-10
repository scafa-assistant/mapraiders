"""
Phase 0c — EN-IN-Create: /en-in/ parallel zu /en/.

KEIN Split — beide existieren parallel:
- /en/ bleibt für US/UK/AU/CA (en hreflang)
- /en-in/ NEU für India (en-IN hreflang)

Strategie:
1. Kopiere /en/-Pages nach /en-in/
2. UK-Spelling-Conversion (defense→defence, neighborhood→neighbourhood, artifact→artefact, color→colour, center→centre)
3. lang="en-IN" + Schema inLanguage="en-IN"
4. hreflang en-IN in alle 13 Sprachen ergänzen
5. KEINE Stubs unter /en/ (parallel!)

Aufruf: py docs/_apply_en_in_create.py
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
EN_IN_DIR = ROOT / "en-in"

# US-Spelling → UK-Spelling (case-aware)
UK_SPELLING_MAP = [
    # Whole-word replacements (case-sensitive base, regex \b boundaries)
    (r"\bdefense\b", "defence"),
    (r"\bDefense\b", "Defence"),
    (r"\bDEFENSE\b", "DEFENCE"),
    (r"\bneighborhood\b", "neighbourhood"),
    (r"\bNeighborhood\b", "Neighbourhood"),
    (r"\bneighborhoods\b", "neighbourhoods"),
    (r"\bNeighborhoods\b", "Neighbourhoods"),
    (r"\bneighbor\b", "neighbour"),
    (r"\bNeighbor\b", "Neighbour"),
    (r"\bneighbors\b", "neighbours"),
    (r"\bNeighbors\b", "Neighbours"),
    (r"\bartifact\b", "artefact"),
    (r"\bArtifact\b", "Artefact"),
    (r"\bartifacts\b", "artefacts"),
    (r"\bArtifacts\b", "Artefacts"),
    (r"\bcolor\b", "colour"),
    (r"\bColor\b", "Colour"),
    (r"\bcolors\b", "colours"),
    (r"\bColors\b", "Colours"),
    (r"\bfavorite\b", "favourite"),
    (r"\bFavorite\b", "Favourite"),
    (r"\bcenter\b", "centre"),
    (r"\bCenter\b", "Centre"),
    (r"\bcenters\b", "centres"),
    (r"\bCenters\b", "Centres"),
    (r"\bcustomize\b", "customise"),
    (r"\bCustomize\b", "Customise"),
    (r"\borganize\b", "organise"),
    (r"\bOrganize\b", "Organise"),
    (r"\brealize\b", "realise"),
    (r"\bRealize\b", "Realise"),
    (r"\btraveling\b", "travelling"),
    (r"\bTraveling\b", "Travelling"),
    (r"\btraveled\b", "travelled"),
    (r"\bTraveled\b", "Travelled"),
]


def convert_to_uk_spelling(text: str) -> str:
    for pattern, replacement in UK_SPELLING_MAP:
        text = re.sub(pattern, replacement, text)
    return text


def transform_html_for_en_in(html: str) -> str:
    """Convert EN-US HTML to EN-IN: lang attr + UK-spelling + hreflang + canonical."""
    # 1) lang
    html = re.sub(r'<html\s+lang="en"', '<html lang="en-IN"', html)
    html = re.sub(r'<html\s+lang="en-US"', '<html lang="en-IN"', html)

    # 2) Internal /en/ → /en-in/
    html = re.sub(r'href="/en/([^"]*)"', r'href="/en-in/\1"', html)

    # 3) inLanguage
    html = re.sub(r'"inLanguage"\s*:\s*"en"', '"inLanguage": "en-IN"', html)
    html = re.sub(r'"inLanguage"\s*:\s*"en-US"', '"inLanguage": "en-IN"', html)

    # 4) Canonical
    html = re.sub(
        r'<link\s+rel="canonical"\s+href="https://mapraiders\.com/en/([^"]*)"',
        r'<link rel="canonical" href="https://mapraiders.com/en-in/\1"',
        html,
    )

    # 5) UK-Spelling (carefully — only in body text, but globally OK because tag names won't match)
    html = convert_to_uk_spelling(html)

    return html


def copy_and_transform_pages() -> int:
    """Copy /en/ → /en-in/ with UK-spelling transformation."""
    if not EN_DIR.exists():
        return 0
    EN_IN_DIR.mkdir(exist_ok=True)
    count = 0
    for src in EN_DIR.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(EN_DIR).as_posix()
        # Note: defense-games slug stays the same (existing en path), no slug rename needed
        dest = EN_IN_DIR / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix == ".html":
            html = src.read_text(encoding="utf-8")
            dest.write_text(transform_html_for_en_in(html), encoding="utf-8")
        else:
            shutil.copy2(src, dest)
        count += 1
    return count


def update_global_hreflang_add_en_in() -> int:
    """Add hreflang en-IN tag to all pages globally (next to en)."""
    new_tag = '<link rel="alternate" hreflang="en-IN" href="https://mapraiders.com/en-in/">'
    count = 0
    for fp in ROOT.rglob("*.html"):
        rel = fp.relative_to(ROOT).as_posix()
        if rel.startswith("en-in/"):
            continue
        try:
            html = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        if "en-IN" in html:
            continue  # already has en-IN
        # Add after hreflang="en" tag
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
    print("Phase 0c — EN-IN-Create: /en-in/ parallel zu /en/")
    print("=" * 60)

    if EN_IN_DIR.exists() and any(EN_IN_DIR.iterdir()):
        print("⚠ /en-in/ existiert bereits. Skip.")
        return

    print("\n[1/2] Kopiere /en/ → /en-in/ + UK-Spelling-Conversion…")
    print(f"     → {copy_and_transform_pages()} Pages")

    print("\n[2/2] Ergänze hreflang en-IN in allen 13 Sprachen…")
    print(f"     → {update_global_hreflang_add_en_in()} Pages")

    print("\n✓ EN-IN-Create fertig. KEINE Stubs unter /en/ (parallel-Variante).")


if __name__ == "__main__":
    main()

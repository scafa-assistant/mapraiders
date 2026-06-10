"""
Phase 0c — PT-Split: /pt/ → /pt-br/ (Default Tier-1) + /pt-pt/ (Tier 3 später).

Pilot-Migration für die Sprach-Splits. Strategie aus
`seo-strategy/infrastructure/nginx-redirects-strategy.md`:

1. Kopiere alle /pt/-Pages nach /pt-br/ mit BR-Vokabular-Slugs
2. Ersetze in kopierten Files:
   - alle "/pt/" → "/pt-br/" (Internal Links + canonical + Schema URLs)
   - PT-PT Vokabel → BR-Vokabel (passeio do cão → passeio do cachorro etc.)
3. Update <html lang="pt-BR"> + Schema inLanguage
4. Wandle Original-/pt/-Files in noindex,follow Redirect-Stubs
5. Update hreflang in allen 13 Sprachen (pt → pt-BR)

Idempotent via Marker.

Aufruf: py docs/_apply_pt_split.py
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
PT_DIR = ROOT / "pt"
PT_BR_DIR = ROOT / "pt-br"
STUB_MARKER = "<!-- PHASE-0C-PT-STUB -->"

# Slug-Mapping: alt (/pt/) → neu (/pt-br/)
SLUG_MAP = {
    "passeio-cao": "passear-cachorro",
    "jogo-corrida": "app-corrida",
    "cacada-tesouro": "caca-ao-tesouro",
    "explorador-urbano": "explorar-cidade",
    "jogo-geolocalizacao.html": "jogo-de-gps.html",
    "jogo-territorio.html": "jogo-de-territorio.html",
    "jogo-ciclismo": "pedalar-jogo",
    # Diese bleiben:
    "audio-graffiti": "audio-graffiti",
    "bairro": "bairro",
    "fitness-mmo": "fitness-mmo",
    "alternativa-redes-sociais.html": "alternativa-redes-sociais.html",
    "app-social-outdoor.html": "app-social-outdoor.html",
    "sobre.html": "sobre.html",
    "index.html": "index.html",
    "vs": "vs",
    "features": "features",
    "howto": "howto",
}

# Vokabular-Translations (PT-PT → BR im Body-Content)
# Sehr konservativ — nur eindeutige Wechsel
BODY_VOCAB = [
    ("passeio do cão", "passeio do cachorro"),
    ("passear cão", "passear cachorro"),
    ("o cão", "o cachorro"),
    ("um cão", "um cachorro"),
    ("cães", "cachorros"),
    ("explorador urbano", "explorar a cidade"),
    ("explorar urbano", "explorar a cidade"),
    ("ciclismo", "pedalar"),
]


def map_path(rel_path: str) -> str:
    """Map /pt/foo/bar.html → /pt-br/{mapped-foo}/bar.html"""
    parts = rel_path.split("/")
    new_parts = []
    for i, p in enumerate(parts):
        if i == 0:
            # First segment under /pt/ may be in mapping
            new_parts.append(SLUG_MAP.get(p, p))
        else:
            new_parts.append(p)
    return "/".join(new_parts)


def transform_html_for_pt_br(html: str, page_path_in_pt_br: str) -> str:
    """Update HTML body for PT-BR: lang attr, internal links, vocabulary."""
    # 1) <html lang="pt"> → <html lang="pt-BR">
    html = re.sub(r'<html\s+lang="pt"', '<html lang="pt-BR"', html)

    # 2) All internal /pt/ links → /pt-br/ (with slug-mapping)
    def replace_pt_link(m: re.Match) -> str:
        old_url = m.group(1)
        # Strip /pt/ prefix
        sub = old_url[len("/pt/"):]
        # Apply slug mapping per segment
        sub_parts = sub.split("/")
        new_sub = "/".join(SLUG_MAP.get(p, p) for p in sub_parts)
        return f'href="/pt-br/{new_sub}"'

    html = re.sub(r'href="/pt/([^"]*)"', replace_pt_link, html)

    # 3) Schema.org inLanguage: "pt" → "pt-BR"
    html = re.sub(r'"inLanguage"\s*:\s*"pt"', '"inLanguage": "pt-BR"', html)

    # 4) Body vocabulary (BR-spezifisch)
    for old, new in BODY_VOCAB:
        html = html.replace(old, new)

    # 5) Canonical URL: from /pt/ to /pt-br/
    html = re.sub(
        r'<link\s+rel="canonical"\s+href="https://mapraiders\.com/pt/([^"]*)"',
        lambda m: f'<link rel="canonical" href="https://mapraiders.com/pt-br/{map_path(m.group(1))}"',
        html,
    )

    return html


def build_redirect_stub(new_url: str, old_lang: str = "pt") -> str:
    """Build a noindex,follow redirect stub for the old /pt/ page."""
    return (
        f'<!DOCTYPE html>\n'
        f'<html lang="{old_lang}">\n'
        f'<head>\n'
        f'  {STUB_MARKER}\n'
        f'  <meta charset="UTF-8">\n'
        f'  <meta name="robots" content="noindex,follow">\n'
        f'  <link rel="canonical" href="https://mapraiders.com{new_url}">\n'
        f'  <meta http-equiv="refresh" content="0; url={new_url}">\n'
        f'  <title>Redirect zu {new_url}</title>\n'
        f'</head>\n'
        f'<body>\n'
        f'  <p>This page has moved permanently to <a href="{new_url}">{new_url}</a>.</p>\n'
        f'  <script>window.location.replace("{new_url}");</script>\n'
        f'</body>\n'
        f'</html>\n'
    )


def copy_and_transform_pages() -> tuple[int, int]:
    """Copy all /pt/ pages to /pt-br/ with BR-vocab transformations.

    Returns (pages_copied, slugs_renamed).
    """
    if not PT_DIR.exists():
        print(f"⚠ /pt/ directory not found: {PT_DIR}")
        return 0, 0

    PT_BR_DIR.mkdir(exist_ok=True)
    pages_copied = 0
    slugs_renamed = 0

    for src in PT_DIR.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(PT_DIR).as_posix()
        new_rel = map_path(rel)
        if new_rel != rel:
            slugs_renamed += 1
        dest = PT_BR_DIR / new_rel
        dest.parent.mkdir(parents=True, exist_ok=True)

        if src.suffix == ".html":
            html = src.read_text(encoding="utf-8")
            new_html = transform_html_for_pt_br(html, new_rel)
            dest.write_text(new_html, encoding="utf-8")
        else:
            # Non-HTML files (images, etc.) → just copy
            shutil.copy2(src, dest)
        pages_copied += 1

    return pages_copied, slugs_renamed


def replace_pt_pages_with_stubs() -> int:
    """Replace all /pt/*.html files with redirect stubs."""
    count = 0
    if not PT_DIR.exists():
        return 0
    for old in PT_DIR.rglob("*.html"):
        rel = old.relative_to(PT_DIR).as_posix()
        new_url = "/pt-br/" + map_path(rel)
        # Strip /index.html → directory style
        if new_url.endswith("/index.html"):
            new_url = new_url[: -len("index.html")]
        stub = build_redirect_stub(new_url, old_lang="pt")
        old.write_text(stub, encoding="utf-8")
        count += 1
    return count


def update_global_hreflang() -> int:
    """Update hreflang tags in ALL non-PT pages: pt → pt-BR."""
    count = 0
    for fp in ROOT.rglob("*.html"):
        # Skip pt/ and pt-br/ directories themselves
        rel = fp.relative_to(ROOT).as_posix()
        if rel.startswith("pt/") or rel.startswith("pt-br/"):
            continue
        try:
            html = fp.read_text(encoding="utf-8")
        except Exception:
            continue

        # Replace hreflang="pt" → hreflang="pt-BR" + URL update
        new_html = re.sub(
            r'<link\s+rel="alternate"\s+hreflang="pt"\s+href="https://mapraiders\.com/pt/?"',
            '<link rel="alternate" hreflang="pt-BR" href="https://mapraiders.com/pt-br/">',
            html,
        )
        if new_html != html:
            fp.write_text(new_html, encoding="utf-8")
            count += 1
    return count


def update_global_internal_links() -> int:
    """Update ALL `href="/pt/..."` and `href="https://mapraiders.com/pt/..."` links
    across all 13 language directories to use /pt-br/ + new slugs.

    This catches language-switcher dropdowns, footer links, sitemap-references etc.
    """
    count = 0
    for fp in ROOT.rglob("*.html"):
        rel = fp.relative_to(ROOT).as_posix()
        # Skip /pt/ stubs (already done) and /pt-br/ (already transformed)
        if rel.startswith("pt/") or rel.startswith("pt-br/"):
            continue
        try:
            html = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        if 'href="/pt/' not in html and 'href="https://mapraiders.com/pt/' not in html:
            continue

        def replace_link(m: re.Match) -> str:
            prefix = m.group(1)  # 'href="' or 'href="https://mapraiders.com'
            sub = m.group(2)     # path after /pt/
            # Apply slug mapping per first segment
            sub_parts = sub.split("/")
            new_sub = "/".join(SLUG_MAP.get(p, p) for p in sub_parts)
            return f'{prefix}/pt-br/{new_sub}'

        # Match both href="/pt/..." and href="https://mapraiders.com/pt/..."
        new_html = re.sub(
            r'(href=")/pt/([^"]*)',
            replace_link,
            html,
        )
        new_html = re.sub(
            r'(href="https://mapraiders\.com)/pt/([^"]*)',
            replace_link,
            new_html,
        )

        if new_html != html:
            fp.write_text(new_html, encoding="utf-8")
            count += 1
    return count


def main() -> None:
    print("=" * 60)
    print("Phase 0c PILOT — PT-Split: /pt/ → /pt-br/")
    print("=" * 60)

    # Idempotency check
    if PT_BR_DIR.exists() and any(PT_BR_DIR.iterdir()):
        print("⚠ /pt-br/ existiert bereits + ist nicht leer.")
        print("→ Migration wahrscheinlich schon ausgeführt. Prüfe mit git diff.")
        print("→ Zum nochmal-Ausführen: rm -rf docs/pt-br/ + nochmal git checkout docs/pt/")
        return

    print("\n[1/3] Kopiere /pt/ → /pt-br/ + transformiere…")
    pages, renames = copy_and_transform_pages()
    print(f"     → {pages} Pages kopiert ({renames} Slug-Umbenennungen)")

    print("\n[2/3] Wandle /pt/-Originale in Redirect-Stubs…")
    stubs = replace_pt_pages_with_stubs()
    print(f"     → {stubs} Stub-Pages erzeugt")

    print("\n[3/4] Update hreflang in allen 13 Sprachen…")
    hreflang_updates = update_global_hreflang()
    print(f"     → {hreflang_updates} Pages mit hreflang-Update")

    print("\n[4/4] Update Internal Links global (Sprachwechsler, Footer)…")
    link_updates = update_global_internal_links()
    print(f"     → {link_updates} Pages mit internal /pt/ → /pt-br/ Links")

    print("\n" + "=" * 60)
    print("✓ PT-Split abgeschlossen.")
    print("=" * 60)
    print("Pre-Deploy-Checkliste (manuell):")
    print("  [ ] git status  → alle Änderungen plausibel?")
    print("  [ ] git diff docs/pt/index.html  → Stub OK?")
    print("  [ ] cat docs/pt-br/jogo-de-gps.html | head -30  → BR-Page OK?")
    print("  [ ] grep -r 'href=\"/pt/' docs/  → keine alten Links mehr?")


if __name__ == "__main__":
    main()

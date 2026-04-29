"""
Phase 0c — ES-Split: /es/ → /es-mx/ (Default Tier-2) + /es-es/ (Tier 3 später).

Analog zu _apply_pt_split.py mit MX-Vokabular-Mapping.

Aufruf: py docs/_apply_es_split.py
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
ES_DIR = ROOT / "es"
ES_MX_DIR = ROOT / "es-mx"
STUB_MARKER = "<!-- PHASE-0C-ES-STUB -->"

# Slug-Mapping nach _apply_es_split.py / 02_ES-MX_FINAL_MASTER_PLAN.md
SLUG_MAP = {
    "paseo-perros": "pasear-perro",
    "juego-correr": "app-correr",
    "busqueda-tesoro": "busqueda-del-tesoro",
    "juego-geolocalizacion.html": "juego-de-gps.html",
    "juego-territorio.html": "juego-de-territorio.html",
    "vecindario": "colonia",  # MX-EXKLUSIV!
    # Diese bleiben:
    "audio-graffiti": "audio-graffiti",
    "explorador-urbano": "explorador-urbano",
    "fitness-mmo": "fitness-mmo",
    "juego-ciclismo": "juego-ciclismo",
    "alternativa-redes-sociales.html": "alternativa-redes-sociales.html",
    "app-social-outdoor.html": "app-social-outdoor.html",
    "sobre-nosotros.html": "sobre-nosotros.html",
    "index.html": "index.html",
    "vs": "vs",
    "features": "features",
    "howto": "howto",
}

# MX-spezifische Vokabel-Updates im Body
BODY_VOCAB = [
    ("paseo del perro", "paseo del perro"),  # gleich
    ("vecindario", "colonia"),
    ("vecino", "vecino"),  # gleich
]


def map_path(rel_path: str) -> str:
    parts = rel_path.split("/")
    return "/".join(SLUG_MAP.get(p, p) for p in parts)


def transform_html_for_es_mx(html: str, page_path: str) -> str:
    html = re.sub(r'<html\s+lang="es"', '<html lang="es-MX"', html)

    def replace_es_link(m: re.Match) -> str:
        sub = m.group(1)
        sub_parts = sub.split("/")
        new_sub = "/".join(SLUG_MAP.get(p, p) for p in sub_parts)
        return f'href="/es-mx/{new_sub}"'

    html = re.sub(r'href="/es/([^"]*)"', replace_es_link, html)
    html = re.sub(r'"inLanguage"\s*:\s*"es"', '"inLanguage": "es-MX"', html)

    for old, new in BODY_VOCAB:
        if old != new:
            html = html.replace(old, new)

    html = re.sub(
        r'<link\s+rel="canonical"\s+href="https://mapraiders\.com/es/([^"]*)"',
        lambda m: f'<link rel="canonical" href="https://mapraiders.com/es-mx/{map_path(m.group(1))}"',
        html,
    )
    return html


def build_redirect_stub(new_url: str, old_lang: str = "es") -> str:
    return (
        f'<!DOCTYPE html>\n<html lang="{old_lang}">\n<head>\n  {STUB_MARKER}\n'
        f'  <meta charset="UTF-8">\n  <meta name="robots" content="noindex,follow">\n'
        f'  <link rel="canonical" href="https://mapraiders.com{new_url}">\n'
        f'  <meta http-equiv="refresh" content="0; url={new_url}">\n'
        f'  <title>Redirect zu {new_url}</title>\n</head>\n<body>\n'
        f'  <p>This page has moved permanently to <a href="{new_url}">{new_url}</a>.</p>\n'
        f'  <script>window.location.replace("{new_url}");</script>\n</body>\n</html>\n'
    )


def copy_and_transform_pages() -> tuple[int, int]:
    if not ES_DIR.exists():
        return 0, 0
    ES_MX_DIR.mkdir(exist_ok=True)
    pages, renames = 0, 0
    for src in ES_DIR.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(ES_DIR).as_posix()
        new_rel = map_path(rel)
        if new_rel != rel:
            renames += 1
        dest = ES_MX_DIR / new_rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix == ".html":
            html = src.read_text(encoding="utf-8")
            dest.write_text(transform_html_for_es_mx(html, new_rel), encoding="utf-8")
        else:
            shutil.copy2(src, dest)
        pages += 1
    return pages, renames


def replace_es_pages_with_stubs() -> int:
    count = 0
    if not ES_DIR.exists():
        return 0
    for old in ES_DIR.rglob("*.html"):
        rel = old.relative_to(ES_DIR).as_posix()
        new_url = "/es-mx/" + map_path(rel)
        if new_url.endswith("/index.html"):
            new_url = new_url[: -len("index.html")]
        old.write_text(build_redirect_stub(new_url), encoding="utf-8")
        count += 1
    return count


def update_global_hreflang() -> int:
    count = 0
    for fp in ROOT.rglob("*.html"):
        rel = fp.relative_to(ROOT).as_posix()
        if rel.startswith("es/") or rel.startswith("es-mx/"):
            continue
        try:
            html = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        new_html = re.sub(
            r'<link\s+rel="alternate"\s+hreflang="es"\s+href="https://mapraiders\.com/es/?"',
            '<link rel="alternate" hreflang="es-MX" href="https://mapraiders.com/es-mx/">',
            html,
        )
        if new_html != html:
            fp.write_text(new_html, encoding="utf-8")
            count += 1
    return count


def update_global_internal_links() -> int:
    count = 0
    for fp in ROOT.rglob("*.html"):
        rel = fp.relative_to(ROOT).as_posix()
        if rel.startswith("es/") or rel.startswith("es-mx/"):
            continue
        try:
            html = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        if 'href="/es/' not in html and 'href="https://mapraiders.com/es/' not in html:
            continue

        def replace_link(m: re.Match) -> str:
            prefix = m.group(1)
            sub = m.group(2)
            sub_parts = sub.split("/")
            new_sub = "/".join(SLUG_MAP.get(p, p) for p in sub_parts)
            return f'{prefix}/es-mx/{new_sub}'

        new_html = re.sub(r'(href=")/es/([^"]*)', replace_link, html)
        new_html = re.sub(
            r'(href="https://mapraiders\.com)/es/([^"]*)', replace_link, new_html
        )
        if new_html != html:
            fp.write_text(new_html, encoding="utf-8")
            count += 1
    return count


def main() -> None:
    print("=" * 60)
    print("Phase 0c — ES-Split: /es/ → /es-mx/")
    print("=" * 60)

    if ES_MX_DIR.exists() and any(ES_MX_DIR.iterdir()):
        print("⚠ /es-mx/ existiert bereits. Skip.")
        return

    print("\n[1/4] Kopiere /es/ → /es-mx/ + transformiere…")
    pages, renames = copy_and_transform_pages()
    print(f"     → {pages} Pages ({renames} Slug-Renames)")

    print("\n[2/4] Wandle /es/-Originale in Stubs…")
    stubs = replace_es_pages_with_stubs()
    print(f"     → {stubs} Stubs")

    print("\n[3/4] Update hreflang…")
    print(f"     → {update_global_hreflang()} Pages")

    print("\n[4/4] Update Internal Links…")
    print(f"     → {update_global_internal_links()} Pages")

    print("\n✓ ES-Split fertig.")


if __name__ == "__main__":
    main()

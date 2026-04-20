"""
Apply hreflang tags to all subpages (features/, vs/, howto/).

- Idempotent via marker <!-- HREFLANG-INJECTED -->
- Only inserts hreflang for language equivalents that actually exist on disk
- x-default always points to the EN equivalent (or DE if EN doesn't exist)
- Injects before </head>
- For pages that already have hreflang but are missing x-default: adds x-default only
"""

from pathlib import Path
import re

ROOT = Path(__file__).parent
MARKER = "<!-- HREFLANG-INJECTED -->"

# Feature name mapping: canonical key -> filenames per language
# DE (root) uses custom names; all others use filenames defined here
FEATURE_MAP = {
    "territories": {
        "de":  "territorien.html",
        "en":  "territories.html",
        "fr":  "territoires.html",
        "es":  "territorios.html",
        "it":  "territori.html",
        "pt":  "territories.html",
        "tr":  "territories.html",
        "ru":  "territories.html",
        "ja":  "territories.html",
        "ko":  "territories.html",
        "zh":  "territories.html",
        "ar":  "territories.html",
        "hi":  "territories.html",
    },
    "echos": {
        "de":  "echos.html",
        "en":  "echos.html",
        "fr":  "echos.html",
        "es":  "ecos.html",
        "it":  "echi.html",
        "pt":  "echos.html",
        "tr":  "echos.html",
        "ru":  "echos.html",
        "ja":  "echos.html",
        "ko":  "echos.html",
        "zh":  "echos.html",
        "ar":  "echos.html",
        "hi":  "echos.html",
    },
    "events": {
        "de":  "events.html",
        "en":  "events.html",
        "fr":  "evenements.html",
        "es":  "eventos.html",
        "it":  "eventi.html",
        "pt":  "events.html",
        "tr":  "events.html",
        "ru":  "events.html",
        "ja":  "events.html",
        "ko":  "events.html",
        "zh":  "events.html",
        "ar":  "events.html",
        "hi":  "events.html",
    },
    "defense": {
        "de":  "defense.html",
        "en":  "defense-games.html",
        "fr":  "jeux-defense.html",
        "es":  "juegos-defensa.html",
        "it":  "giochi-difesa.html",
        "pt":  "defense.html",
        "tr":  "defense.html",
        "ru":  "defense.html",
        "ja":  "defense.html",
        "ko":  "defense.html",
        "zh":  "defense.html",
        "ar":  "defense.html",
        "hi":  "defense.html",
    },
    "quests": {
        "de":  "quests.html",
        "en":  "quests.html",
        "fr":  "quetes.html",
        "es":  "misiones.html",
        "it":  "missioni.html",
        "pt":  "quests.html",
        "tr":  "quests.html",
        "ru":  "quests.html",
        "ja":  "quests.html",
        "ko":  "quests.html",
        "zh":  "quests.html",
        "ar":  "quests.html",
        "hi":  "quests.html",
    },
    "clans": {
        "de":  "social.html",   # DE uses social.html for clans
        "en":  "clans.html",
        "fr":  "clans.html",
        "es":  "clanes.html",
        "it":  "clan.html",
        "pt":  "clans.html",
        "tr":  "clans.html",
        "ru":  "clans.html",
        "ja":  "clans.html",
        "ko":  "clans.html",
        "zh":  "clans.html",
        "ar":  "clans.html",
        "hi":  "clans.html",
    },
}

# VS pages: same filename across DE (root) and EN; other langs don't exist yet
VS_PAGES = ["pokemon-go.html", "ingress.html", "geocaching.html"]

# Howto pages mapping: canonical key -> per-language filenames
HOWTO_MAP = {
    "territories": {
        "de": "territorien.html",
        "en": "territories.html",
    },
    "echos": {
        "de": "echos.html",
        "en": "echos.html",
    },
    "clans": {
        "de": "clans.html",
        "en": "clans.html",
    },
    "defense": {
        "de": "verteidigungs-minispiele.html",
        "en": "defense-minigames.html",
    },
    "index": {
        "de": "index.html",
        "en": "index.html",
    },
}

LANGS_ORDER = ["de", "en", "fr", "es", "it", "pt", "tr", "ru", "ja", "ko", "zh", "ar", "hi"]


def lang_dir(lang: str) -> Path:
    """Return the features/ base path for a language."""
    if lang == "de":
        return ROOT  # root is DE
    return ROOT / lang


def feature_path(lang: str, filename: str) -> Path:
    return lang_dir(lang) / "features" / filename


def vs_path(lang: str, filename: str) -> Path:
    return lang_dir(lang) / "vs" / filename


def howto_path(lang: str, filename: str) -> Path:
    return lang_dir(lang) / "howto" / filename


def feature_url(lang: str, filename: str) -> str:
    if lang == "de":
        return f"https://mapraiders.com/features/{filename}"
    return f"https://mapraiders.com/{lang}/features/{filename}"


def vs_url(lang: str, filename: str) -> str:
    if lang == "de":
        return f"https://mapraiders.com/vs/{filename}"
    return f"https://mapraiders.com/{lang}/vs/{filename}"


def howto_url(lang: str, filename: str) -> str:
    if lang == "de":
        return f"https://mapraiders.com/howto/{filename}"
    return f"https://mapraiders.com/{lang}/howto/{filename}"


def build_hreflang_links(entries: list[tuple[str, str]], default_url: str) -> str:
    """Build hreflang link tags. entries = [(lang, url), ...]"""
    lines = []
    for lang, url in entries:
        lines.append(f'<link rel="alternate" hreflang="{lang}" href="{url}">')
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{default_url}">')
    return "\n".join(lines)


def add_xdefault_only(html: str, xdefault_url: str) -> str:
    """Add x-default after last existing hreflang tag."""
    xdefault_tag = f'<link rel="alternate" hreflang="x-default" href="{xdefault_url}">'
    # Find last hreflang occurrence
    last_match = None
    for m in re.finditer(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*">', html):
        last_match = m
    if last_match:
        insert_pos = last_match.end()
        return html[:insert_pos] + "\n" + xdefault_tag + html[insert_pos:]
    return html


def inject_hreflang(html: str, hreflang_block: str) -> str:
    """Inject hreflang block before </head>."""
    return re.sub(r'(</head>)', hreflang_block + "\n" + MARKER + "\n" + r'\1', html, count=1)


def process_feature_pages() -> list[str]:
    results = []
    for feature_key, lang_files in FEATURE_MAP.items():
        # Determine which languages have this file on disk
        existing: list[tuple[str, str, Path]] = []  # (lang, url, path)
        for lang in LANGS_ORDER:
            if lang not in lang_files:
                continue
            fname = lang_files[lang]
            p = feature_path(lang, fname)
            if p.exists():
                existing.append((lang, feature_url(lang, fname), p))

        if not existing:
            results.append(f"SKIP feature/{feature_key}: no files found")
            continue

        # x-default = EN url if exists, else DE
        xdefault_url = next(
            (url for lang, url, _ in existing if lang == "en"),
            next((url for lang, url, _ in existing if lang == "de"), existing[0][1])
        )

        for lang, url, path in existing:
            html = path.read_text(encoding="utf-8")

            # Already fully processed
            if MARKER in html:
                results.append(f"SKIP feature/{lang}/{lang_files[lang]}: already processed")
                continue

            # Has hreflang but missing x-default
            if 'hreflang=' in html and 'x-default' not in html:
                html = add_xdefault_only(html, xdefault_url)
                path.write_text(html, encoding="utf-8")
                results.append(f"ADD_XDEFAULT feature/{lang}/{lang_files[lang]}")
                continue

            # Has both -> skip
            if 'hreflang=' in html and 'x-default' in html:
                results.append(f"SKIP feature/{lang}/{lang_files[lang]}: hreflang+xdefault present")
                continue

            # No hreflang at all -> inject full block
            entries = [(l, u) for l, u, _ in existing]
            block = build_hreflang_links(entries, xdefault_url)
            html = inject_hreflang(html, block)
            path.write_text(html, encoding="utf-8")
            results.append(f"INJECT feature/{lang}/{lang_files[lang]}")

    return results


def process_vs_pages() -> list[str]:
    results = []
    for fname in VS_PAGES:
        # Only DE (root) and EN exist currently
        existing: list[tuple[str, str, Path]] = []
        for lang in ["de", "en"]:
            p = vs_path(lang, fname)
            if p.exists():
                existing.append((lang, vs_url(lang, fname), p))

        if not existing:
            results.append(f"SKIP vs/{fname}: no files")
            continue

        # x-default = EN
        xdefault_url = next(
            (url for lang, url, _ in existing if lang == "en"),
            existing[0][1]
        )

        for lang, url, path in existing:
            html = path.read_text(encoding="utf-8")

            if MARKER in html:
                results.append(f"SKIP vs/{lang}/{fname}: already processed")
                continue

            if 'hreflang=' in html and 'x-default' not in html:
                html = add_xdefault_only(html, xdefault_url)
                path.write_text(html, encoding="utf-8")
                results.append(f"ADD_XDEFAULT vs/{lang}/{fname}")
                continue

            if 'hreflang=' in html and 'x-default' in html:
                results.append(f"SKIP vs/{lang}/{fname}: hreflang+xdefault present")
                continue

            entries = [(l, u) for l, u, _ in existing]
            block = build_hreflang_links(entries, xdefault_url)
            html = inject_hreflang(html, block)
            path.write_text(html, encoding="utf-8")
            results.append(f"INJECT vs/{lang}/{fname}")

    return results


def process_howto_pages() -> list[str]:
    results = []
    for page_key, lang_files in HOWTO_MAP.items():
        existing: list[tuple[str, str, Path]] = []
        for lang in LANGS_ORDER:
            if lang not in lang_files:
                continue
            fname = lang_files[lang]
            p = howto_path(lang, fname)
            if p.exists():
                existing.append((lang, howto_url(lang, fname), p))

        if not existing:
            results.append(f"SKIP howto/{page_key}: no files")
            continue

        xdefault_url = next(
            (url for lang, url, _ in existing if lang == "en"),
            next((url for lang, url, _ in existing if lang == "de"), existing[0][1])
        )

        for lang, url, path in existing:
            html = path.read_text(encoding="utf-8")

            if MARKER in html:
                results.append(f"SKIP howto/{lang}/{lang_files[lang]}: already processed")
                continue

            if 'hreflang=' in html and 'x-default' not in html:
                html = add_xdefault_only(html, xdefault_url)
                path.write_text(html, encoding="utf-8")
                results.append(f"ADD_XDEFAULT howto/{lang}/{lang_files[lang]}")
                continue

            if 'hreflang=' in html and 'x-default' in html:
                results.append(f"SKIP howto/{lang}/{lang_files[lang]}: hreflang+xdefault present")
                continue

            entries = [(l, u) for l, u, _ in existing]
            block = build_hreflang_links(entries, xdefault_url)
            html = inject_hreflang(html, block)
            path.write_text(html, encoding="utf-8")
            results.append(f"INJECT howto/{lang}/{lang_files[lang]}")

    return results


if __name__ == "__main__":
    import sys
    all_results = []
    all_results += process_feature_pages()
    all_results += process_vs_pages()
    all_results += process_howto_pages()

    for r in all_results:
        print(r)

    injected = sum(1 for r in all_results if r.startswith("INJECT") or r.startswith("ADD_XDEFAULT"))
    skipped = sum(1 for r in all_results if r.startswith("SKIP"))
    print(f"\nSummary: {injected} modified, {skipped} skipped")

    fails = [r for r in all_results if r.startswith("FAIL")]
    sys.exit(1 if fails else 0)

"""
Phase 0b — Sprach-spezifische Webfont-Preloads.

Outfit (Standard-Schrift) hat keine Glyphen für CJK/Devanagari/Arabisch/Cyrillisch.
Wir preloaden pro Sprache den richtigen Noto-Sans-Variant via Google Fonts.

- DE/EN/FR/ES/IT/PT/TR: Outfit reicht — kein Patch nötig
- JA: Noto Sans JP
- KO: Noto Sans KR
- ZH-CN (zh): Noto Sans SC
- ZH-TW: Noto Sans TC (separater Pfad, später)
- AR: Noto Sans Arabic
- HI: Noto Sans Devanagari
- RU: Noto Sans (Cyrillic Subset)

Idempotent via Marker.
"""
from __future__ import annotations
from pathlib import Path
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
MARKER = "<!-- PHASE-0B-FONTS-PRELOAD -->"

# Pro Sprache: Font-Family + URL-Subset für Google Fonts
FONTS = {
    "ja": {
        "family": "Noto Sans JP",
        "url": "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap",
    },
    "ko": {
        "family": "Noto Sans KR",
        "url": "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap",
    },
    "zh": {
        "family": "Noto Sans SC",
        "url": "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap",
    },
    "ar": {
        "family": "Noto Sans Arabic",
        "url": "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;700&display=swap",
    },
    "hi": {
        "family": "Noto Sans Devanagari",
        "url": "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;700&display=swap",
    },
    "ru": {
        "family": "Noto Sans",
        "url": "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&display=swap&subset=cyrillic",
    },
}


def detect_lang_from_path(path: Path) -> str:
    parts = path.relative_to(ROOT).parts
    if len(parts) >= 2 and parts[0] in {"de", "en", "fr", "it", "es", "pt", "tr"}:
        return "skip"  # Outfit reicht
    if len(parts) >= 2 and parts[0] in FONTS:
        return parts[0]
    return "skip"


def build_preload_block(lang: str) -> str:
    cfg = FONTS[lang]
    return (
        MARKER + "\n"
        + '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        + f'<link rel="preload" as="style" href="{cfg["url"]}">\n'
        + f'<link rel="stylesheet" href="{cfg["url"]}">\n'
        + f'<style>body,h1,h2,h3,h4,h5,h6,p,a,span,div,blockquote{{font-family:Outfit,"{cfg["family"]}",system-ui,sans-serif}}</style>'
    )


def process_file(path: Path) -> tuple[bool, str]:
    try:
        html = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"read-error: {e}"

    if MARKER in html:
        return False, "skip:already-applied"

    lang = detect_lang_from_path(path)
    if lang == "skip":
        return False, "skip:outfit-only"
    if lang not in FONTS:
        return False, f"skip:unsupported-lang:{lang}"
    if "</head>" not in html:
        return False, "skip:no-head-end"

    block = build_preload_block(lang)
    new_html = html.replace("</head>", block + "\n</head>", 1)
    path.write_text(new_html, encoding="utf-8")
    return True, "OK"


def main() -> None:
    print("=" * 60)
    print("Phase 0b — Webfont Preload (CJK/Arabic/Devanagari/Cyrillic)")
    print("=" * 60)

    files = sorted(ROOT.rglob("*.html"))
    stats = {"ok": 0, "skip": 0}
    by_lang: dict[str, int] = {}
    skip_reasons: dict[str, int] = {}

    for fp in files:
        changed, info = process_file(fp)
        if changed:
            stats["ok"] += 1
            lang = detect_lang_from_path(fp)
            by_lang[lang] = by_lang.get(lang, 0) + 1
        else:
            stats["skip"] += 1
            reason = info.split(":", 1)[1] if ":" in info else info
            skip_reasons[reason] = skip_reasons.get(reason, 0) + 1

    print(f"\nVerarbeitet: {stats['ok']} Pages")
    print(f"Übersprungen: {stats['skip']} Pages")
    print("\nBy language:")
    for lang, count in sorted(by_lang.items(), key=lambda x: -x[1]):
        print(f"  {count:>4}  {lang}")
    print("\nSkip-Gründe:")
    for reason, count in sorted(skip_reasons.items(), key=lambda x: -x[1])[:10]:
        print(f"  {count:>4}  {reason}")


if __name__ == "__main__":
    main()

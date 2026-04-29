"""
Phase 0b — hreflang-Audit + Konsistenz-Fix.

Prüft pro Page ob alle 13 hreflang-Tags vorhanden sind (de/en/fr/es/it/pt/tr/ru/
ja/ko/zh/ar/hi + x-default). Wenn nicht, ergänzt fehlende.

Region-Variants (en-IN, pt-BR, es-MX, zh-CN, zh-TW) werden erst in Phase 0c
hinzugefügt, wenn die entsprechenden Pfade existieren.

Idempotent: lässt korrekt vorhandene Pages unverändert.
"""
from __future__ import annotations
from pathlib import Path
import re
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
EXPECTED_LANGS = ["de", "en", "fr", "es", "it", "pt", "tr", "ru", "ja", "ko", "zh", "ar", "hi"]


def hreflang_for_lang(lang: str) -> str:
    if lang == "de":
        return "https://mapraiders.com/"
    return f"https://mapraiders.com/{lang}/"


def process_file(path: Path) -> tuple[bool, str]:
    try:
        html = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"read-error: {e}"

    # Find all current hreflang tags
    pattern = re.compile(r'<link\s+rel="alternate"\s+hreflang="([^"]+)"[^>]*>', re.IGNORECASE)
    existing = {m.group(1): m.group(0) for m in pattern.finditer(html)}

    needed = set(EXPECTED_LANGS) | {"x-default"}
    missing = needed - set(existing.keys())

    if not missing:
        return False, "skip:complete"

    # Build missing tags
    new_tags: list[str] = []
    for lang in EXPECTED_LANGS:
        if lang in missing:
            new_tags.append(
                f'<link rel="alternate" hreflang="{lang}" href="{hreflang_for_lang(lang)}">'
            )
    if "x-default" in missing:
        new_tags.append(
            '<link rel="alternate" hreflang="x-default" href="https://mapraiders.com/">'
        )

    # Insert before </head>, after the last existing hreflang if any
    if existing:
        last_existing = list(existing.values())[-1]
        new_block = "\n".join(new_tags)
        new_html = html.replace(last_existing, last_existing + "\n" + new_block, 1)
    elif "</head>" in html:
        new_block = "\n".join(new_tags)
        new_html = html.replace("</head>", new_block + "\n</head>", 1)
    else:
        return False, "skip:no-head-end"

    path.write_text(new_html, encoding="utf-8")
    return True, f"OK (added {len(missing)})"


def main() -> None:
    print("=" * 60)
    print("Phase 0b — hreflang-Audit + Konsistenz-Fix")
    print("=" * 60)

    files = sorted(ROOT.rglob("*.html"))
    stats = {"ok": 0, "skip": 0}
    skip_reasons: dict[str, int] = {}

    for fp in files:
        changed, info = process_file(fp)
        if changed:
            stats["ok"] += 1
        else:
            stats["skip"] += 1
            reason = info.split(":", 1)[1] if ":" in info else info
            skip_reasons[reason] = skip_reasons.get(reason, 0) + 1

    print(f"\nVerarbeitet (ergänzt): {stats['ok']} Pages")
    print(f"Übersprungen (komplett): {stats['skip']} Pages")
    print("\nSkip-Gründe:")
    for reason, count in sorted(skip_reasons.items(), key=lambda x: -x[1])[:10]:
        print(f"  {count:>4}  {reason}")


if __name__ == "__main__":
    main()

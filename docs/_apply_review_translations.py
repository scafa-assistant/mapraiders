"""
Phase 0a — Review-Übersetzungs-Markierung.

Erweitert alle Phase-K Review-JSON-LD-Blöcke (Ron C., Vivian N., Aljoscha P.) um:
- `inLanguage`: Sprache der Page
- `translationOfWork`: Verweis auf das deutsche Original (für alle Sprachen außer DE)

Schema-Validatoren markieren so technisch korrekt, dass die Tester-Quotes in 15 Sprachen
Übersetzungen des deutschen Originals sind, nicht 15 separate Original-Reviews.

Idempotent via "inLanguage"-Check pro Review-Block.
"""
from __future__ import annotations
from pathlib import Path
import json
import re
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
PHASE_K_MARKER = "PHASE-K-FOUNDER-REVIEWS"
PHASE_K_JSONLD_MARKER = "PHASE-K-FOUNDER-JSONLD"


def detect_lang_from_path(path: Path) -> str:
    """Detect language from file path under docs/."""
    parts = path.relative_to(ROOT).parts
    if len(parts) >= 2 and parts[0] in {
        "de", "en", "ja", "ko", "fr", "it", "es", "pt", "tr", "ru", "ar", "zh", "hi"
    }:
        return parts[0]
    if len(parts) >= 2 and parts[0] in {"en-in", "pt-br", "pt-pt", "es-mx", "es-es", "zh-cn", "zh-tw"}:
        return parts[0]
    # Root-Level Files = DE (German is root in this repo)
    return "de"


def patch_jsonld_block(block_text: str, lang: str) -> tuple[str, bool]:
    """Patch a JSON-LD <script> block to add inLanguage + translationOfWork to reviews.

    Returns (new_text, changed).
    """
    # Extract JSON between script tags
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', block_text, re.DOTALL)
    if not m:
        return block_text, False

    raw = m.group(1).strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return block_text, False

    if not isinstance(data, dict):
        return block_text, False

    # Only patch the MobileApplication block (which holds the review[] array)
    if data.get("@type") != "MobileApplication":
        return block_text, False
    reviews = data.get("review")
    if not isinstance(reviews, list) or not reviews:
        return block_text, False

    changed = False
    for review in reviews:
        if not isinstance(review, dict):
            continue
        if review.get("inLanguage"):
            continue  # already patched, idempotent
        review["inLanguage"] = lang
        if lang != "de":
            review["translationOfWork"] = {
                "@type": "Review",
                "inLanguage": "de",
            }
        changed = True

    if not changed:
        return block_text, False

    new_json = json.dumps(data, ensure_ascii=False)
    new_block = block_text[: m.start(1)] + new_json + block_text[m.end(1):]
    return new_block, True


def process_file(path: Path) -> tuple[bool, str]:
    try:
        html = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"read-error: {e}"

    if PHASE_K_JSONLD_MARKER not in html:
        return False, "skip:no-phase-k-jsonld"

    lang = detect_lang_from_path(path)

    # Find all <script type="application/ld+json"> blocks AFTER the Phase-K JSON-LD marker
    # The marker is followed by 2 script blocks (Person + MobileApplication-with-Reviews)
    marker_idx = html.find(PHASE_K_JSONLD_MARKER)
    if marker_idx < 0:
        return False, "skip:marker-not-found"

    # Walk through script blocks after the marker
    pattern = re.compile(r'<script type="application/ld\+json">.*?</script>', re.DOTALL)
    any_changed = False
    new_html_parts = [html[:marker_idx]]
    pos = marker_idx
    matches_after = list(pattern.finditer(html, marker_idx))
    if not matches_after:
        return False, "skip:no-jsonld-after-marker"

    for m in matches_after[:2]:  # only first 2 blocks after marker (Person + MobileApp)
        new_html_parts.append(html[pos:m.start()])
        block_new, changed = patch_jsonld_block(m.group(0), lang)
        new_html_parts.append(block_new)
        pos = m.end()
        if changed:
            any_changed = True

    new_html_parts.append(html[pos:])

    if not any_changed:
        return False, "skip:already-patched"

    new_html = "".join(new_html_parts)
    path.write_text(new_html, encoding="utf-8")
    return True, "OK"


def main() -> None:
    print("=" * 60)
    print("Phase 0a — Review-Translations (inLanguage + translationOfWork)")
    print("=" * 60)

    files = sorted(ROOT.rglob("*.html"))
    stats = {"ok": 0, "skip": 0}
    skip_reasons: dict[str, int] = {}
    by_lang: dict[str, int] = {}

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
    print("\nBy language (geändert):")
    for lang, count in sorted(by_lang.items(), key=lambda x: -x[1]):
        print(f"  {count:>4}  {lang}")
    print("\nSkip-Gründe (Top 10):")
    for reason, count in sorted(skip_reasons.items(), key=lambda x: -x[1])[:10]:
        print(f"  {count:>4}  {reason}")


if __name__ == "__main__":
    main()

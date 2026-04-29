"""
Phase 0b — Notfall-Tool: Tester-Widerruf.

Wenn ein Beta-Tester (Ron C., Vivian N. oder Aljoscha P.) die Veröffentlichung
seines Quotes widerruft, entfernt dieses Tool den Tester aus allen Pages:

- HTML: `<article class="tester-card">` / `<div class="fr-card">` mit dem Author entfernen
- JSON-LD: Review aus dem `review[]` Array entfernen
- AggregateRating: ratingCount/reviewCount auf verbleibende reduzieren

Aufruf:
  py docs/_apply_remove_review.py ron       # entfernt Ron C. überall
  py docs/_apply_remove_review.py vivian    # entfernt Vivian N. überall
  py docs/_apply_remove_review.py aljoscha  # entfernt Aljoscha P. überall

DSGVO-konformer 7-Tage-Widerruf einhalten: nach Aufruf SOFORT git push damit
der GitHub-Action-Auto-Deploy die Änderung live bringt (~30 Sekunden).
"""
from __future__ import annotations
from pathlib import Path
import argparse
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

# Tester-Mapping
TESTERS = {
    "ron": {"name": "Ron C.", "slug": "ron-c"},
    "vivian": {"name": "Vivian N.", "slug": "vivian-n"},
    "aljoscha": {"name": "Aljoscha P.", "slug": "aljoscha-p"},
}


def remove_review_from_jsonld(json_text: str, tester_name: str) -> tuple[str, bool]:
    """Remove the matching review from the MobileApplication JSON-LD block.

    Updates ratingCount/reviewCount accordingly.
    Returns (new_text, changed).
    """
    try:
        data = json.loads(json_text)
    except json.JSONDecodeError:
        return json_text, False

    if not isinstance(data, dict) or data.get("@type") != "MobileApplication":
        return json_text, False

    reviews = data.get("review")
    if not isinstance(reviews, list):
        return json_text, False

    new_reviews = []
    removed = False
    for r in reviews:
        if isinstance(r, dict) and isinstance(r.get("author"), dict):
            author_name = r["author"].get("name", "")
            if author_name == tester_name:
                removed = True
                continue
        new_reviews.append(r)

    if not removed:
        return json_text, False

    data["review"] = new_reviews
    if isinstance(data.get("aggregateRating"), dict):
        new_count = str(len(new_reviews))
        data["aggregateRating"]["ratingCount"] = new_count
        data["aggregateRating"]["reviewCount"] = new_count

    return json.dumps(data, ensure_ascii=False), True


def remove_html_card(html: str, tester_name: str) -> tuple[str, bool]:
    """Remove the `<div class="fr-card">` containing the tester's name."""
    # Find the `<div class="fr-card">…</div>` block where the author is named
    pattern = re.compile(
        r'<div class="fr-card"(?!\s+founder)[^>]*>.*?</div>\s*(?=<div|</div>)',
        re.DOTALL,
    )

    def has_tester(block: str) -> bool:
        # Match `<div class="fr-author">Ron C.</div>`
        return bool(re.search(rf'<div class="fr-author">\s*{re.escape(tester_name)}', block))

    matches = list(pattern.finditer(html))
    new_html = html
    changed = False
    for m in matches:
        if has_tester(m.group(0)):
            new_html = new_html.replace(m.group(0), "", 1)
            changed = True
    return new_html, changed


def process_file(path: Path, tester_name: str) -> tuple[bool, str]:
    try:
        html = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"read-error: {e}"

    if "PHASE-K-FOUNDER-REVIEWS" not in html:
        return False, "skip:no-phase-k"

    # 1) Remove HTML card
    html_new, html_changed = remove_html_card(html, tester_name)

    # 2) Patch JSON-LD blocks
    jsonld_changed = False
    pattern = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.DOTALL)
    pos = 0
    parts: list[str] = []
    for m in pattern.finditer(html_new):
        parts.append(html_new[pos:m.start(1)])
        new_json, changed = remove_review_from_jsonld(m.group(1), tester_name)
        parts.append(new_json)
        pos = m.end(1)
        if changed:
            jsonld_changed = True
    parts.append(html_new[pos:])
    html_new = "".join(parts)

    if not html_changed and not jsonld_changed:
        return False, "skip:tester-not-found"

    path.write_text(html_new, encoding="utf-8")
    return True, f"OK (html={html_changed}, jsonld={jsonld_changed})"


def main() -> None:
    parser = argparse.ArgumentParser(description="Notfall-Tester-Widerruf")
    parser.add_argument(
        "tester",
        choices=list(TESTERS.keys()),
        help="Tester-Key (ron / vivian / aljoscha)",
    )
    args = parser.parse_args()

    tester_name = TESTERS[args.tester]["name"]
    print("=" * 60)
    print(f"Notfall-Widerruf: Tester '{tester_name}' wird entfernt")
    print("=" * 60)
    print(f"Hinweis: NACH Ausführung sofort 'git add docs/ && git commit -m \"DSGVO: Widerruf {tester_name}\" && git push'")
    print(f"Live in ~30 Sek dank Auto-Deploy.")
    print()

    files = sorted(ROOT.rglob("*.html"))
    stats = {"ok": 0, "skip": 0}
    skip_reasons: dict[str, int] = {}

    for fp in files:
        changed, info = process_file(fp, tester_name)
        if changed:
            stats["ok"] += 1
        else:
            stats["skip"] += 1
            reason = info.split(":", 1)[1] if ":" in info else info
            skip_reasons[reason] = skip_reasons.get(reason, 0) + 1

    print(f"\nEntfernt aus: {stats['ok']} Pages")
    print(f"Übersprungen: {stats['skip']} Pages")
    print("\nSkip-Gründe:")
    for reason, count in sorted(skip_reasons.items(), key=lambda x: -x[1])[:10]:
        print(f"  {count:>4}  {reason}")


if __name__ == "__main__":
    main()

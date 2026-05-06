"""
Fix GSC-Fehler: itemReviewed zu allen Review-Objekten hinzufügen.

Google verlangt 'itemReviewed' auf jedem Review-Objekt, auch wenn es
innerhalb einer MobileApplication.review-Array verschachtelt ist.

Betrifft:
- 240 Review-Seiten (@graph mit separaten Review-Objekten)
- 329 Feature-/Kategorie-Seiten (inline Reviews in MobileApplication)

Usage:
  python _fix_add_itemReviewed.py           # Dry-run
  python _fix_add_itemReviewed.py --confirm  # Tatsächlich schreiben
"""
import json, re, pathlib, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = pathlib.Path(__file__).parent
JSONLD_RE = re.compile(
    r'(<script\s+type="application/ld\+json">)(.*?)(</script>)', re.DOTALL
)
CONFIRM = "--confirm" in sys.argv

ITEM_REVIEWED = {
    "@type": "MobileApplication",
    "name": "MapRaiders"
}


def add_itemReviewed(data):
    """Add itemReviewed to all Review objects that don't have it."""
    changed = False

    if isinstance(data, dict):
        # Handle @graph style (review pages)
        if "@graph" in data:
            for item in data["@graph"]:
                if isinstance(item, dict) and item.get("@type") == "Review":
                    if "itemReviewed" not in item:
                        item["itemReviewed"] = ITEM_REVIEWED.copy()
                        changed = True

        # Handle inline style (feature/category pages)
        if "review" in data and isinstance(data["review"], list):
            for review in data["review"]:
                if isinstance(review, dict) and review.get("@type") == "Review":
                    if "itemReviewed" not in review:
                        review["itemReviewed"] = ITEM_REVIEWED.copy()
                        changed = True

    return changed


fixed = 0
skipped = 0
errors = 0

for html_file in sorted(ROOT.rglob("*.html")):
    if html_file.name.startswith("_"):
        continue

    text = html_file.read_text(encoding="utf-8", errors="ignore")

    if '"Review"' not in text:
        continue

    new_text = text
    file_changed = False

    for match in JSONLD_RE.finditer(text):
        open_tag, blob, close_tag = match.group(1), match.group(2), match.group(3)
        try:
            data = json.loads(blob)
        except json.JSONDecodeError:
            continue

        if add_itemReviewed(data):
            new_blob = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
            new_text = new_text.replace(
                open_tag + blob + close_tag,
                open_tag + new_blob + close_tag,
                1,
            )
            file_changed = True

    if file_changed:
        fixed += 1
        rel = html_file.relative_to(ROOT)
        if CONFIRM:
            html_file.write_text(new_text, encoding="utf-8")
            print(f"  FIXED  {rel}")
        else:
            print(f"  [dry]  {rel}")
    else:
        skipped += 1

print(f"\n{'GESCHRIEBEN' if CONFIRM else 'DRY-RUN'}: {fixed} Dateien gefixt, {skipped} übersprungen")

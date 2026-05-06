"""Fix GSC-Warnung: itemReviewed aus verschachtelten Review-Objekten entfernen.

Google sagt: Wenn ein Review innerhalb eines Parent-Objekts (z.B. MobileApplication)
verschachtelt ist, darf itemReviewed nicht enthalten sein — es ist redundant.

Betrifft 112 Review-Seiten in allen Sprachen.

Ausfuehrung: python3 _fix_itemReviewed.py          (dry-run)
             python3 _fix_itemReviewed.py --confirm (schreibt Aenderungen)
"""
import json, re, pathlib, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = pathlib.Path(__file__).parent
JSONLD_RE = re.compile(
    r'(<script\s+type="application/ld\+json">)(.*?)(</script>)',
    re.DOTALL
)

def remove_itemReviewed_from_reviews(data):
    """Rekursiv itemReviewed aus Review-Objekten entfernen, die in einem Parent verschachtelt sind."""
    changed = False
    if isinstance(data, dict):
        # Wenn es ein @graph gibt, iteriere durch die Elemente
        if "@graph" in data:
            for item in data["@graph"]:
                # Wenn das Item Reviews als Array hat
                if "review" in item and isinstance(item["review"], list):
                    for review in item["review"]:
                        if isinstance(review, dict) and "itemReviewed" in review:
                            del review["itemReviewed"]
                            changed = True
                # Wenn das Item selbst ein Review mit itemReviewed ist und parent hat
                if item.get("@type") == "Review" and "itemReviewed" in item:
                    del item["itemReviewed"]
                    changed = True
        # Direkt auf Top-Level
        if "review" in data and isinstance(data["review"], list):
            for review in data["review"]:
                if isinstance(review, dict) and "itemReviewed" in review:
                    del review["itemReviewed"]
                    changed = True
    return changed


def process(path):
    html = path.read_text(encoding="utf-8")
    if "itemReviewed" not in html:
        return None

    new_html = html
    total_changes = 0

    for m in JSONLD_RE.finditer(html):
        raw_json = m.group(2)
        try:
            data = json.loads(raw_json)
        except json.JSONDecodeError:
            continue

        if remove_itemReviewed_from_reviews(data):
            new_json = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
            new_html = new_html.replace(m.group(0), m.group(1) + new_json + m.group(3))
            total_changes += 1

    if total_changes > 0:
        return (path, new_html, total_changes)
    return None


if __name__ == "__main__":
    confirm = "--confirm" in sys.argv
    results = []

    for path in sorted(ROOT.rglob("*.html")):
        result = process(path)
        if result:
            results.append(result)

    print(f"{'WRITE' if confirm else 'DRY-RUN'} MODE")
    print(f"Dateien mit itemReviewed-Fix: {len(results)}")

    for path, new_html, changes in results:
        rel = path.relative_to(ROOT)
        print(f"  {'OK' if confirm else 'WOULD FIX'} [{changes}] {rel}")
        if confirm:
            path.write_text(new_html, encoding="utf-8")

    print(f"\nTotal: {len(results)} Dateien {'gefixt' if confirm else 'wuerden gefixt'}")

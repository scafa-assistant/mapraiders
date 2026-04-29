"""
Phase 0a — Pill-Label "Aus der geschlossenen Beta" auf alle Tester-Cards.

Erweitert den Phase-K HTML-Block (siehe `_apply_founder_reviews.py`):
- CSS `.fr-pill { ... }` wird zum bestehenden <style>-Block hinzugefügt
- HTML `<div class="fr-pill">{{lokalisiert}}</div>` wird vor jede Tester-Card-`fr-stars`-Zeile eingefügt

Transparenz-Signal: Tester sind interne Beta-Teilnehmer (geschlossene Closed-Beta),
nicht öffentliche User. Schützt vor irreführenden Erwartungen + dokumentiert offen.

Idempotent via "fr-pill"-CSS-Check.
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
PHASE_K_MARKER = "<!-- PHASE-K-FOUNDER-REVIEWS -->"
PILL_CSS_MARKER = ".fr-pill{"

# Pill-Label pro Sprache
PILL_LABEL = {
    "de": "Aus der geschlossenen Beta",
    "en": "From the closed beta",
    "fr": "De la bêta fermée",
    "it": "Dalla beta chiusa",
    "es": "De la beta cerrada",
    "pt": "Da beta fechada",
    "tr": "Kapalı betadan",
    "ru": "Из закрытой беты",
    "ja": "限定ベータ版より",
    "ko": "비공개 베타에서",
    "zh": "来自封闭测试",
    "ar": "من النسخة التجريبية المغلقة",
    "hi": "बंद बीटा से",
}

PILL_CSS = (
    ".fr-pill{display:inline-block;font-size:10px;font-weight:700;letter-spacing:1.5px;"
    "text-transform:uppercase;color:var(--accent);background:rgba(0,0,0,0.04);"
    "border:1px solid var(--border);padding:4px 10px;border-radius:99px;margin-bottom:14px}"
)


def detect_lang_from_path(path: Path) -> str:
    parts = path.relative_to(ROOT).parts
    if len(parts) >= 2 and parts[0] in PILL_LABEL:
        return parts[0]
    return "de"


def add_pill_css(html: str) -> tuple[str, bool]:
    """Add `.fr-pill` rule to the Phase-K <style> block."""
    if PILL_CSS_MARKER in html:
        return html, False  # already added
    # Find the Phase-K <style>...</style> block (right after PHASE_K_MARKER)
    marker_idx = html.find(PHASE_K_MARKER)
    if marker_idx < 0:
        return html, False
    style_match = re.search(r"<style>(.*?)</style>", html[marker_idx:], re.DOTALL)
    if not style_match:
        return html, False
    style_open = marker_idx + style_match.start() + len("<style>")
    new_html = html[:style_open] + "\n" + PILL_CSS + html[style_open:]
    return new_html, True


def add_pill_html(html: str, lang: str) -> tuple[str, int]:
    """Insert <div class="fr-pill">{label}</div> before each Tester-Card's <div class="fr-stars">.

    Returns (new_html, num_added).
    """
    label = PILL_LABEL.get(lang, PILL_LABEL["en"])
    pill = f'<div class="fr-pill">{label}</div>'

    marker_idx = html.find(PHASE_K_MARKER)
    if marker_idx < 0:
        return html, 0

    # Locate `<div class="fr-grid">` — that's where 3 Tester-Cards live
    grid_match = re.search(r'<div class="fr-grid">', html[marker_idx:])
    if not grid_match:
        return html, 0
    grid_start = marker_idx + grid_match.start()
    # End of section is `</section>` after grid
    section_end = html.find("</section>", grid_start)
    if section_end < 0:
        return html, 0

    grid_html = html[grid_start:section_end]
    # Insert pill before EACH `<div class="fr-stars">` in the grid_html
    # If pill already added (from previous run), skip
    if 'class="fr-pill"' in grid_html:
        return html, 0

    new_grid_html, count = re.subn(
        r'(<div class="fr-stars">)',
        pill + r"\n        \1",
        grid_html,
    )
    if count == 0:
        return html, 0

    new_html = html[:grid_start] + new_grid_html + html[section_end:]
    return new_html, count


def process_file(path: Path) -> tuple[bool, str]:
    try:
        html = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"read-error: {e}"

    if PHASE_K_MARKER not in html:
        return False, "skip:no-phase-k"

    lang = detect_lang_from_path(path)

    # Step 1: Add CSS
    html_new, css_added = add_pill_css(html)
    # Step 2: Add HTML pills to tester cards
    html_new, pills_added = add_pill_html(html_new, lang)

    if not css_added and pills_added == 0:
        return False, "skip:already-applied"

    path.write_text(html_new, encoding="utf-8")
    return True, f"OK (css={css_added}, pills={pills_added})"


def main() -> None:
    print("=" * 60)
    print("Phase 0a — Pill-Label 'Closed Beta' on all Tester-Cards")
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
    print("\nBy language:")
    for lang, count in sorted(by_lang.items(), key=lambda x: -x[1]):
        print(f"  {count:>4}  {lang}")
    print("\nSkip-Gründe:")
    for reason, count in sorted(skip_reasons.items(), key=lambda x: -x[1])[:10]:
        print(f"  {count:>4}  {reason}")


if __name__ == "__main__":
    main()

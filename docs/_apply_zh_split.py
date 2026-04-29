"""
Phase 0c — ZH-Split: /zh/ → /zh-cn/ (Simplified, Diaspora) + /zh-tw/ (Traditional, NEU).

Komplexer als PT/ES weil 2-way Split:
1. /zh/ → /zh-cn/ (1:1 Kopie, gleiche Simplified-Slugs)
2. /zh-cn/ → /zh-tw/ (Body + Slugs via zhconv konvertieren zu Traditional)
3. /zh/ werden Stubs zu /zh-cn/
4. hreflang updaten: zh → zh-CN + NEU zh-TW
5. Internal Links global: /zh/ → /zh-cn/

Aufruf: py docs/_apply_zh_split.py
Voraussetzung: pip install zhconv
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

try:
    import zhconv
except ImportError:
    print("ERROR: pip install zhconv erforderlich")
    sys.exit(1)

ROOT = Path(__file__).parent
ZH_DIR = ROOT / "zh"
ZH_CN_DIR = ROOT / "zh-cn"
ZH_TW_DIR = ROOT / "zh-tw"
STUB_MARKER = "<!-- PHASE-0C-ZH-STUB -->"


def transform_html_for_zh_cn(html: str) -> str:
    """zh → zh-CN (Simplified bleibt, nur lang/inLanguage update)."""
    html = re.sub(r'<html\s+lang="zh"', '<html lang="zh-CN"', html)
    html = re.sub(r'href="/zh/([^"]*)"', r'href="/zh-cn/\1"', html)
    html = re.sub(r'"inLanguage"\s*:\s*"zh"', '"inLanguage": "zh-CN"', html)
    html = re.sub(
        r'<link\s+rel="canonical"\s+href="https://mapraiders\.com/zh/([^"]*)"',
        r'<link rel="canonical" href="https://mapraiders.com/zh-cn/\1"',
        html,
    )
    return html


def transform_html_for_zh_tw(html: str) -> str:
    """zh-CN → zh-TW: Simplified→Traditional via zhconv + lang-Update.

    Konvertiert sowohl Body-Text als auch href-Slugs.
    """
    # 1) Lang attribute
    html = re.sub(r'<html\s+lang="zh-CN"', '<html lang="zh-TW"', html)
    html = re.sub(r'<html\s+lang="zh"', '<html lang="zh-TW"', html)

    # 2) inLanguage
    html = re.sub(r'"inLanguage"\s*:\s*"zh-CN"', '"inLanguage": "zh-TW"', html)
    html = re.sub(r'"inLanguage"\s*:\s*"zh"', '"inLanguage": "zh-TW"', html)

    # 3) Internal /zh-cn/ → /zh-tw/ (with slug conversion)
    def replace_zh_cn_link(m: re.Match) -> str:
        sub = m.group(1)
        # Convert any Chinese chars in the URL path itself
        new_sub = zhconv.convert(sub, 'zh-tw')
        return f'href="/zh-tw/{new_sub}"'

    html = re.sub(r'href="/zh-cn/([^"]*)"', replace_zh_cn_link, html)
    html = re.sub(r'href="/zh/([^"]*)"', replace_zh_cn_link, html)

    # 4) Canonical
    html = re.sub(
        r'<link\s+rel="canonical"\s+href="https://mapraiders\.com/zh-cn/([^"]*)"',
        lambda m: f'<link rel="canonical" href="https://mapraiders.com/zh-tw/{zhconv.convert(m.group(1), "zh-tw")}"',
        html,
    )

    # 5) Convert body text Simplified → Traditional
    # Splits HTML into chunks, only converts text between tags + attributes that look like text
    # Conservative: convert only between > and <
    def convert_text_chunks(s: str) -> str:
        out: list[str] = []
        i = 0
        while i < len(s):
            if s[i] == "<":
                # tag
                j = s.find(">", i)
                if j == -1:
                    out.append(s[i:])
                    break
                out.append(s[i : j + 1])
                i = j + 1
            else:
                j = s.find("<", i)
                if j == -1:
                    out.append(zhconv.convert(s[i:], "zh-tw"))
                    break
                out.append(zhconv.convert(s[i:j], "zh-tw"))
                i = j
        return "".join(out)

    html = convert_text_chunks(html)
    return html


def build_redirect_stub(new_url: str, old_lang: str = "zh") -> str:
    return (
        f'<!DOCTYPE html>\n<html lang="{old_lang}">\n<head>\n  {STUB_MARKER}\n'
        f'  <meta charset="UTF-8">\n  <meta name="robots" content="noindex,follow">\n'
        f'  <link rel="canonical" href="https://mapraiders.com{new_url}">\n'
        f'  <meta http-equiv="refresh" content="0; url={new_url}">\n'
        f'  <title>Redirect zu {new_url}</title>\n</head>\n<body>\n'
        f'  <p>This page has moved permanently to <a href="{new_url}">{new_url}</a>.</p>\n'
        f'  <script>window.location.replace("{new_url}");</script>\n</body>\n</html>\n'
    )


def copy_zh_to_zh_cn() -> int:
    """Kopiere /zh/ → /zh-cn/ (Simplified bleibt, nur lang-Update)."""
    if not ZH_DIR.exists():
        return 0
    ZH_CN_DIR.mkdir(exist_ok=True)
    count = 0
    for src in ZH_DIR.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(ZH_DIR).as_posix()
        dest = ZH_CN_DIR / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix == ".html":
            html = src.read_text(encoding="utf-8")
            dest.write_text(transform_html_for_zh_cn(html), encoding="utf-8")
        else:
            shutil.copy2(src, dest)
        count += 1
    return count


def copy_zh_cn_to_zh_tw() -> tuple[int, int]:
    """Kopiere /zh-cn/ → /zh-tw/ (Traditional via zhconv).

    Konvertiert Body + Slug-Pfade zu Traditional.
    Returns (pages_created, slug_changes).
    """
    if not ZH_CN_DIR.exists():
        return 0, 0
    ZH_TW_DIR.mkdir(exist_ok=True)
    pages, slug_changes = 0, 0
    for src in ZH_CN_DIR.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(ZH_CN_DIR).as_posix()
        # Convert path itself (Simplified → Traditional)
        new_rel = zhconv.convert(rel, "zh-tw")
        if new_rel != rel:
            slug_changes += 1
        dest = ZH_TW_DIR / new_rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix == ".html":
            html = src.read_text(encoding="utf-8")
            dest.write_text(transform_html_for_zh_tw(html), encoding="utf-8")
        else:
            shutil.copy2(src, dest)
        pages += 1
    return pages, slug_changes


def replace_zh_pages_with_stubs() -> int:
    count = 0
    if not ZH_DIR.exists():
        return 0
    for old in ZH_DIR.rglob("*.html"):
        rel = old.relative_to(ZH_DIR).as_posix()
        new_url = "/zh-cn/" + rel
        if new_url.endswith("/index.html"):
            new_url = new_url[: -len("index.html")]
        old.write_text(build_redirect_stub(new_url), encoding="utf-8")
        count += 1
    return count


def update_global_hreflang() -> int:
    """Update hreflang: zh → zh-CN + ergänze zh-TW."""
    count = 0
    new_zh_tw_tag = '<link rel="alternate" hreflang="zh-TW" href="https://mapraiders.com/zh-tw/">'

    for fp in ROOT.rglob("*.html"):
        rel = fp.relative_to(ROOT).as_posix()
        if rel.startswith("zh/") or rel.startswith("zh-cn/") or rel.startswith("zh-tw/"):
            continue
        try:
            html = fp.read_text(encoding="utf-8")
        except Exception:
            continue

        # Replace hreflang="zh" with hreflang="zh-CN"
        new_html = re.sub(
            r'<link\s+rel="alternate"\s+hreflang="zh"\s+href="https://mapraiders\.com/zh/?"',
            '<link rel="alternate" hreflang="zh-CN" href="https://mapraiders.com/zh-cn/">',
            html,
        )
        # Add zh-TW after zh-CN if not present
        if "zh-TW" not in new_html and 'hreflang="zh-CN"' in new_html:
            new_html = re.sub(
                r'(<link\s+rel="alternate"\s+hreflang="zh-CN"[^>]*>)',
                r'\1\n' + new_zh_tw_tag,
                new_html,
                count=1,
            )

        if new_html != html:
            fp.write_text(new_html, encoding="utf-8")
            count += 1
    return count


def update_global_internal_links() -> int:
    count = 0
    for fp in ROOT.rglob("*.html"):
        rel = fp.relative_to(ROOT).as_posix()
        if rel.startswith("zh/") or rel.startswith("zh-cn/") or rel.startswith("zh-tw/"):
            continue
        try:
            html = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        if 'href="/zh/' not in html and 'href="https://mapraiders.com/zh/' not in html:
            continue
        new_html = re.sub(r'(href=")/zh/([^"]*)', r'\1/zh-cn/\2', html)
        new_html = re.sub(
            r'(href="https://mapraiders\.com)/zh/([^"]*)', r'\1/zh-cn/\2', new_html
        )
        if new_html != html:
            fp.write_text(new_html, encoding="utf-8")
            count += 1
    return count


def main() -> None:
    print("=" * 60)
    print("Phase 0c — ZH-Split: /zh/ → /zh-cn/ + /zh-tw/ (Traditional NEU)")
    print("=" * 60)

    if (ZH_CN_DIR.exists() and any(ZH_CN_DIR.iterdir())) or (
        ZH_TW_DIR.exists() and any(ZH_TW_DIR.iterdir())
    ):
        print("⚠ /zh-cn/ oder /zh-tw/ existiert bereits. Skip.")
        return

    print("\n[1/5] Kopiere /zh/ → /zh-cn/ (Simplified bleibt)…")
    print(f"     → {copy_zh_to_zh_cn()} Pages")

    print("\n[2/5] Kopiere /zh-cn/ → /zh-tw/ (Traditional via zhconv)…")
    pages, slug_changes = copy_zh_cn_to_zh_tw()
    print(f"     → {pages} Pages ({slug_changes} Slug-Konvertierungen)")

    print("\n[3/5] Wandle /zh/-Originale in Stubs…")
    print(f"     → {replace_zh_pages_with_stubs()} Stubs")

    print("\n[4/5] Update hreflang (zh → zh-CN + ergänze zh-TW)…")
    print(f"     → {update_global_hreflang()} Pages")

    print("\n[5/5] Update Internal Links (/zh/ → /zh-cn/)…")
    print(f"     → {update_global_internal_links()} Pages")

    print("\n✓ ZH-Split fertig.")


if __name__ == "__main__":
    main()

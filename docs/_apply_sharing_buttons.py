"""
Phase 0b — Lokale Sharing-Buttons pro Markt.

Fügt einen kleinen "Share-Bar"-Block in den <footer> ein. Pro Sprache eigene
Plattformen aus dem Phase-2-Markt-Insight:
- DE: WhatsApp, Telegram
- EN: Twitter/X, WhatsApp
- JA: LINE, Twitter/X
- KO: KakaoTalk (web-share), LINE
- PT: WhatsApp
- TR: WhatsApp, Twitter/X
- ES: WhatsApp
- AR: Snapchat, WhatsApp
- FR: WhatsApp, Twitter/X
- IT: WhatsApp
- RU: VKontakte, Telegram
- ZH: WeChat (web-share, "Copy Link")
- HI: WhatsApp, Telegram

Idempotent via Marker.
"""
from __future__ import annotations
from pathlib import Path
import re
import sys
from urllib.parse import quote

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
MARKER = "<!-- PHASE-0B-SHARING -->"

# Sharing-Konfiguration pro Sprache
# Jede Sprache: Liste von (Label, URL-Template, Icon-Symbol)
SHARING = {
    "de": [
        ("WhatsApp", "https://wa.me/?text={url}", "💬"),
        ("Telegram", "https://t.me/share/url?url={url}", "✈️"),
    ],
    "en": [
        ("Twitter/X", "https://twitter.com/intent/tweet?url={url}", "𝕏"),
        ("WhatsApp", "https://wa.me/?text={url}", "💬"),
    ],
    "ja": [
        ("LINE", "https://social-plugins.line.me/lineit/share?url={url}", "LINE"),
        ("X", "https://twitter.com/intent/tweet?url={url}", "𝕏"),
    ],
    "ko": [
        ("KakaoTalk", "https://accounts.kakao.com/login?continue=https%3A%2F%2Faccounts.kakao.com%2Fweblogin%2Faccount&url={url}", "Kakao"),
        ("LINE", "https://social-plugins.line.me/lineit/share?url={url}", "LINE"),
    ],
    "pt": [
        ("WhatsApp", "https://wa.me/?text={url}", "💬"),
    ],
    "tr": [
        ("WhatsApp", "https://wa.me/?text={url}", "💬"),
        ("X", "https://twitter.com/intent/tweet?url={url}", "𝕏"),
    ],
    "es": [
        ("WhatsApp", "https://wa.me/?text={url}", "💬"),
    ],
    "ar": [
        ("Snapchat", "https://www.snapchat.com/scan?attachmentUrl={url}", "👻"),
        ("WhatsApp", "https://wa.me/?text={url}", "💬"),
    ],
    "fr": [
        ("WhatsApp", "https://wa.me/?text={url}", "💬"),
        ("X", "https://twitter.com/intent/tweet?url={url}", "𝕏"),
    ],
    "it": [
        ("WhatsApp", "https://wa.me/?text={url}", "💬"),
    ],
    "ru": [
        ("VKontakte", "https://vk.com/share.php?url={url}", "VK"),
        ("Telegram", "https://t.me/share/url?url={url}", "✈️"),
    ],
    "zh": [
        ("WeChat", "javascript:void(navigator.clipboard.writeText(location.href))", "微信"),
    ],
    "hi": [
        ("WhatsApp", "https://wa.me/?text={url}", "💬"),
        ("Telegram", "https://t.me/share/url?url={url}", "✈️"),
    ],
}

# Pro Sprache: Label "Share" lokalisiert
SHARE_LABEL = {
    "de": "Teilen",
    "en": "Share",
    "ja": "シェア",
    "ko": "공유",
    "pt": "Partilhar",
    "tr": "Paylaş",
    "es": "Compartir",
    "ar": "مشاركة",
    "fr": "Partager",
    "it": "Condividi",
    "ru": "Поделиться",
    "zh": "分享",
    "hi": "शेयर करें",
}


def detect_lang_from_path(path: Path) -> str:
    parts = path.relative_to(ROOT).parts
    if len(parts) >= 2 and parts[0] in SHARING:
        return parts[0]
    return "de"  # Root = DE


def page_url_from_path(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel.endswith("/index.html"):
        rel = rel[: -len("index.html")]
    return "https://mapraiders.com/" + rel


def build_share_block(lang: str, page_url: str) -> str:
    encoded_url = quote(page_url, safe="")
    buttons_html = []
    for label, url_tpl, icon in SHARING[lang]:
        share_url = url_tpl.replace("{url}", encoded_url)
        buttons_html.append(
            f'<a class="mr-share__btn" href="{share_url}" '
            f'target="_blank" rel="noopener noreferrer" aria-label="{label}">'
            f'<span class="mr-share__icon">{icon}</span>{label}</a>'
        )

    css = (
        ".mr-share{margin:32px 0 16px 0;display:flex;flex-wrap:wrap;align-items:center;gap:12px;"
        "padding:16px 24px;background:rgba(0,0,0,.02);border-radius:10px}"
        ".mr-share__label{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;"
        "color:var(--muted,#666);margin-right:8px}"
        ".mr-share__btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;"
        "background:var(--surface,#fff);border:1px solid var(--border,#e0e0e0);border-radius:99px;"
        "font-size:13px;font-weight:500;color:var(--text,#222);text-decoration:none;"
        "transition:all .15s ease}"
        ".mr-share__btn:hover{border-color:var(--accent,#000);transform:translateY(-1px)}"
        ".mr-share__icon{font-size:14px}"
    )

    label = SHARE_LABEL.get(lang, "Share")
    return (
        MARKER + "\n"
        + f"<style>{css}</style>\n"
        + f'<div class="mr-share" aria-label="{label}">'
        + f'<span class="mr-share__label">{label}:</span>'
        + "".join(buttons_html)
        + "</div>"
    )


def process_file(path: Path) -> tuple[bool, str]:
    try:
        html = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"read-error: {e}"

    if MARKER in html:
        return False, "skip:already-applied"

    # Skip pages without Phase-K block (legal/howto/etc. don't get share)
    if "<!-- PHASE-K-FOUNDER-REVIEWS -->" not in html:
        return False, "skip:no-phase-k"

    lang = detect_lang_from_path(path)
    if lang not in SHARING:
        return False, f"skip:unsupported-lang:{lang}"

    page_url = page_url_from_path(path)
    block = build_share_block(lang, page_url)

    # Insert before <footer>, fallback before </body>
    if re.search(r"<footer\b", html):
        new_html = re.sub(r"(<footer\b)", block + r"\n\1", html, count=1)
    elif "</body>" in html:
        new_html = html.replace("</body>", block + "\n</body>", 1)
    else:
        return False, "skip:no-insert-anchor"

    path.write_text(new_html, encoding="utf-8")
    return True, "OK"


def main() -> None:
    print("=" * 60)
    print("Phase 0b — Lokale Sharing-Buttons pro Markt")
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

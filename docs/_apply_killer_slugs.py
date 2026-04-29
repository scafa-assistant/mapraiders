"""
Phase J: Killer-Keyword-URL-Slugs für JA/KO/ZH (Native UTF-8 in URL).

Idempotent — prüft Marker und überspringt bereits migrierte Pfade.

Migration:
- 4 Kategorien × 3 Sprachen + 8 Nischen × 3 Sprachen = 36 neue lokalisierte URLs
- Alte URLs werden zu Redirect-Stubs (noindex,follow + canonical + meta refresh)
- ALLE 374 HTML-Dateien + 14 Sitemap-XMLs bekommen URL-Updates für hreflang/Lang-Switcher/Internal-Links

AR/HI bleiben bewusst bei englischen Slugs (Punycode-Mess in Backlinks vermeiden).
"""
from __future__ import annotations
from pathlib import Path
import re
import sys

# UTF-8 für Windows-Konsole erzwingen
if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
STUB_MARKER = "<!-- KILLER-SLUG-REDIRECT-STUB -->"

# (lang, old_relative_path, new_relative_path)
# Niche-Pfade enden auf "/" → Verzeichnis mit index.html
# Kategorie-Pfade enden auf ".html" → einzelne Datei
MIGRATIONS = [
    # JA Kategorien
    ("ja", "ja/location-game.html",          "ja/位置情報ゲーム.html"),
    ("ja", "ja/outdoor-social-app.html",     "ja/アウトドアSNS.html"),
    ("ja", "ja/social-media-alternative.html","ja/新しいSNS.html"),
    ("ja", "ja/territory-game.html",         "ja/陣取りゲーム.html"),
    # JA Nischen
    ("ja", "ja/dog-walking/",                "ja/犬の散歩ゲーム/"),
    ("ja", "ja/running-game/",               "ja/ランニングゲーム/"),
    ("ja", "ja/scavenger-hunt/",             "ja/宝探し/"),
    ("ja", "ja/urban-explorer/",             "ja/都市探検/"),
    ("ja", "ja/fitness-mmo/",                "ja/フィットネスMMO/"),
    ("ja", "ja/cycling-game/",               "ja/サイクリングゲーム/"),
    ("ja", "ja/neighborhood/",               "ja/ご近所アプリ/"),
    ("ja", "ja/audio-graffiti/",             "ja/オーディオグラフィティ/"),
    # KO Kategorien
    ("ko", "ko/location-game.html",          "ko/위치기반게임.html"),
    ("ko", "ko/outdoor-social-app.html",     "ko/아웃도어소셜.html"),
    ("ko", "ko/social-media-alternative.html","ko/새로운SNS.html"),
    ("ko", "ko/territory-game.html",         "ko/영토게임.html"),
    # KO Nischen
    ("ko", "ko/dog-walking/",                "ko/강아지산책게임/"),
    ("ko", "ko/running-game/",               "ko/러닝게임/"),
    ("ko", "ko/scavenger-hunt/",             "ko/보물찾기/"),
    ("ko", "ko/urban-explorer/",             "ko/도시탐험/"),
    ("ko", "ko/fitness-mmo/",                "ko/피트니스MMO/"),
    ("ko", "ko/cycling-game/",               "ko/자전거게임/"),
    ("ko", "ko/neighborhood/",               "ko/동네앱/"),
    ("ko", "ko/audio-graffiti/",             "ko/오디오그래피티/"),
    # ZH Kategorien
    ("zh", "zh/location-game.html",          "zh/位置游戏.html"),
    ("zh", "zh/outdoor-social-app.html",     "zh/户外社交.html"),
    ("zh", "zh/social-media-alternative.html","zh/社交替代.html"),
    ("zh", "zh/territory-game.html",         "zh/领地游戏.html"),
    # ZH Nischen
    ("zh", "zh/dog-walking/",                "zh/遛狗游戏/"),
    ("zh", "zh/running-game/",               "zh/跑步游戏/"),
    ("zh", "zh/scavenger-hunt/",             "zh/寻宝游戏/"),
    ("zh", "zh/urban-explorer/",             "zh/城市探索/"),
    ("zh", "zh/fitness-mmo/",                "zh/健身MMO/"),
    ("zh", "zh/cycling-game/",               "zh/骑行游戏/"),
    ("zh", "zh/neighborhood/",               "zh/邻里游戏/"),
    ("zh", "zh/audio-graffiti/",             "zh/音频涂鸦/"),
]

BASE = "https://mapraiders.com/"


def is_dir(rel_path: str) -> bool:
    return rel_path.endswith("/")


def src_file(rel: str) -> Path:
    """Source HTML file for a relative path."""
    if is_dir(rel):
        return ROOT / rel.rstrip("/") / "index.html"
    return ROOT / rel


def dst_file(rel: str) -> Path:
    if is_dir(rel):
        return ROOT / rel.rstrip("/") / "index.html"
    return ROOT / rel


def url_for(rel: str) -> str:
    return BASE + rel


def make_redirect_stub(new_url: str, lang: str, label: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
{STUB_MARKER}
<meta charset="UTF-8">
<title>Redirect — {label}</title>
<link rel="canonical" href="{new_url}">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0; url={new_url}">
<script>window.location.replace("{new_url}");</script>
</head>
<body>
<p>Redirecting to <a href="{new_url}">{label}</a>…</p>
</body>
</html>
"""


def update_self_references(html: str, old_url: str, new_url: str, lang: str) -> str:
    """In dem zu kopierenden Source: canonical, og:url, eigenes hreflang aktualisieren."""
    # canonical
    html = re.sub(
        r'(<link\s+rel="canonical"\s+href=")[^"]*(")',
        rf'\1{new_url}\2',
        html, count=1,
    )
    # og:url
    html = re.sub(
        r'(<meta\s+property="og:url"\s+content=")[^"]*(")',
        rf'\1{new_url}\2',
        html, count=1,
    )
    # twitter:url falls vorhanden
    html = re.sub(
        r'(<meta\s+(?:name|property)="twitter:url"\s+content=")[^"]*(")',
        rf'\1{new_url}\2',
        html, count=1,
    )
    # eigenes hreflang ersetzen
    html = re.sub(
        rf'(<link\s+rel="alternate"\s+hreflang="{lang}"\s+href=")[^"]*(")',
        rf'\1{new_url}\2',
        html, count=1,
    )
    return html


def update_global_references(text: str, old_url: str, new_url: str, old_rel: str, new_rel: str) -> str:
    """In ALLEN HTML/XML-Dateien: alte URL durch neue ersetzen.

    Wir ersetzen mehrere Formen:
    - vollqualifizierte URL  (https://mapraiders.com/ja/dog-walking/)
    - root-relative URL      (/ja/dog-walking/)
    - Verzeichnis-Form ohne Trailing-Slash bei Verzeichnissen unterlassen wir
      (zu riskant — z.B. matched fitness-mmo gegen fitness-mmo-extra)
    """
    text = text.replace(old_url, new_url)
    # root-relative
    old_root = "/" + old_rel
    new_root = "/" + new_rel
    text = text.replace(old_root, new_root)
    # auch index.html-Pfad falls Verzeichnis: jemand könnte direkt /ja/dog-walking/index.html linken
    if is_dir(old_rel):
        text = text.replace(old_url + "index.html", new_url + "index.html")
        text = text.replace(old_root + "index.html", new_root + "index.html")
    return text


def label_from_new_rel(new_rel: str) -> str:
    """Letzter Pfadteil als sichtbares Label im Stub."""
    rel = new_rel.rstrip("/")
    if rel.endswith(".html"):
        rel = rel[: -len(".html")]
    return rel.split("/")[-1]


def migrate_one(lang: str, old_rel: str, new_rel: str) -> tuple[bool, str]:
    """Erstellt neue lokalisierte Page + Stub auf alter URL.

    Returns (changed, info).
    """
    src = src_file(old_rel)
    dst = dst_file(new_rel)

    if not src.exists():
        return False, f"SKIP (kein Source): {old_rel}"

    src_text = src.read_text(encoding="utf-8")

    # Bereits migriert? Source ist schon ein Stub.
    if STUB_MARKER in src_text and dst.exists():
        return False, f"SKIP (bereits migriert): {old_rel}"

    old_url = url_for(old_rel)
    new_url = url_for(new_rel)

    # 1. Neue Datei mit angepasstem Self-Reference erstellen
    new_text = update_self_references(src_text, old_url, new_url, lang)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(new_text, encoding="utf-8")

    # 2. Source durch Redirect-Stub ersetzen
    label = label_from_new_rel(new_rel)
    src.write_text(make_redirect_stub(new_url, lang, label), encoding="utf-8")

    return True, f"OK: {old_rel} → {new_rel}"


def update_all_references() -> int:
    """In allen HTML/XML-Dateien alte URLs durch neue ersetzen."""
    files = list(ROOT.rglob("*.html")) + list(ROOT.rglob("*.xml"))
    changed = 0
    for fp in files:
        try:
            text = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        original = text
        for lang, old_rel, new_rel in MIGRATIONS:
            old_url = url_for(old_rel)
            new_url = url_for(new_rel)
            text = update_global_references(text, old_url, new_url, old_rel, new_rel)
        if text != original:
            fp.write_text(text, encoding="utf-8")
            changed += 1
    return changed


def main():
    print("=" * 60)
    print("Phase J — Killer-Keyword-URL-Slugs JA/KO/ZH")
    print("=" * 60)

    migrated = 0
    skipped = 0
    for lang, old_rel, new_rel in MIGRATIONS:
        changed, info = migrate_one(lang, old_rel, new_rel)
        print(("✓ " if changed else "· ") + info)
        if changed:
            migrated += 1
        else:
            skipped += 1

    print(f"\nMigrationen: {migrated} neu, {skipped} übersprungen")

    print("\nAktualisiere globale URL-Referenzen in allen HTML/XML-Dateien …")
    n = update_all_references()
    print(f"✓ {n} Dateien aktualisiert (hreflang, Lang-Switcher, Sitemaps, Interne Links)")


if __name__ == "__main__":
    main()

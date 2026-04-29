"""
Phase G: BreadcrumbList JSON-LD auf alle Seiten ausrollen.

- Idempotent via Marker
- Skip Stubs, 404, backup
- Crumbs basierend auf URL-Struktur: Home → [Section] → Current
"""
from __future__ import annotations
from pathlib import Path
import json
import re
import sys

if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
MARKER = "<!-- PHASE-G-BREADCRUMB -->"
STUB_MARKER = "<!-- KILLER-SLUG-REDIRECT-STUB -->"

LANG_HOME = {
    "de": "Startseite",
    "en": "Home",
    "fr": "Accueil",
    "es": "Inicio",
    "it": "Home",
    "pt": "Início",
    "tr": "Ana sayfa",
    "ru": "Главная",
    "ja": "ホーム",
    "ko": "홈",
    "zh": "首页",
    "ar": "الرئيسية",
    "hi": "होम",
}

SECTION_LABEL = {
    "features": {
        "de": "Features", "en": "Features", "fr": "Fonctionnalités", "es": "Funciones",
        "it": "Funzioni", "pt": "Funções", "tr": "Özellikler", "ru": "Функции",
        "ja": "機能", "ko": "기능", "zh": "功能", "ar": "الميزات", "hi": "सुविधाएँ",
    },
    "howto": {
        "de": "Anleitung", "en": "How to", "fr": "Guide", "es": "Guía",
        "it": "Guida", "pt": "Guia", "tr": "Kılavuz", "ru": "Руководство",
        "ja": "使い方", "ko": "가이드", "zh": "指南", "ar": "كيفية", "hi": "गाइड",
    },
    "vs": {
        "de": "Vergleich", "en": "Compare", "fr": "Comparaison", "es": "Comparar",
        "it": "Confronto", "pt": "Comparar", "tr": "Karşılaştırma", "ru": "Сравнение",
        "ja": "比較", "ko": "비교", "zh": "对比", "ar": "مقارنة", "hi": "तुलना",
    },
}

LANG_CODES = set(LANG_HOME.keys())


def detect_lang(html: str, path: Path) -> str | None:
    m = re.search(r'<html\s+lang="([a-z]{2})"', html)
    if m and m.group(1) in LANG_CODES:
        return m.group(1)
    parts = path.relative_to(ROOT).parts
    if parts and parts[0] in LANG_CODES:
        return parts[0]
    return "de"


def get_title(html: str) -> str:
    m = re.search(r"<title>(.*?)</title>", html, re.DOTALL | re.IGNORECASE)
    if not m:
        return ""
    title = m.group(1).strip()
    # Splitte am ersten "|" oder "—" oder ":" — nimm Teil davor
    for sep in ("|", "—", ":"):
        if sep in title:
            title = title.split(sep)[0].strip()
            break
    return title


def page_url(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel.endswith("/index.html"):
        rel = rel[: -len("index.html")]
    return "https://mapraiders.com/" + rel


def home_url(lang: str) -> str:
    if lang == "de":
        return "https://mapraiders.com/"
    return f"https://mapraiders.com/{lang}/"


def build_crumbs(path: Path, lang: str, html: str) -> list[dict] | None:
    rel = path.relative_to(ROOT).as_posix()

    # Skip wenn = Homepage (entweder Wurzel-index oder lang-index)
    if rel == "index.html" or rel == f"{lang}/index.html":
        return None

    crumbs: list[dict] = [{
        "@type": "ListItem",
        "position": 1,
        "name": LANG_HOME[lang],
        "item": home_url(lang),
    }]

    parts = rel.split("/")
    # Wenn lang-Präfix vorhanden, weglassen
    if parts and parts[0] in LANG_CODES:
        parts = parts[1:]

    # parts ist jetzt entweder ["section", "page.html"] oder ["page.html"] oder ["niche-dir", "index.html"]
    if not parts:
        return None

    pos = 2
    section_key = parts[0].rstrip("/").lower().replace(".html", "")
    if len(parts) > 1 and section_key in SECTION_LABEL:
        # Section + Page
        section_url = home_url(lang) + section_key + "/"
        crumbs.append({
            "@type": "ListItem",
            "position": pos,
            "name": SECTION_LABEL[section_key][lang],
            "item": section_url,
        })
        pos += 1

    page_title = get_title(html)
    if page_title:
        crumbs.append({
            "@type": "ListItem",
            "position": pos,
            "name": page_title,
            "item": page_url(path),
        })
    return crumbs


def process(path: Path) -> tuple[bool, str]:
    try:
        html = path.read_text(encoding="utf-8")
    except Exception:
        return False, "read-error"

    if STUB_MARKER in html:
        return False, "skip:stub"
    if MARKER in html:
        return False, "skip:done"
    if "index-backup" in str(path) or path.name == "404.html":
        return False, "skip:special"
    # Skip wenn schon BreadcrumbList vorhanden
    if '"BreadcrumbList"' in html:
        return False, "skip:has-breadcrumb"

    lang = detect_lang(html, path)
    crumbs = build_crumbs(path, lang, html)
    if not crumbs:
        return False, "skip:no-crumbs"

    payload = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": crumbs,
    }
    block = MARKER + '\n<script type="application/ld+json">' + json.dumps(payload, ensure_ascii=False) + "</script>"

    if "</head>" not in html:
        return False, "skip:no-head"
    new_html = html.replace("</head>", block + "\n</head>", 1)
    path.write_text(new_html, encoding="utf-8")
    return True, "OK"


def main():
    print("=" * 60)
    print("Phase G — BreadcrumbList JSON-LD")
    print("=" * 60)
    files = sorted(ROOT.rglob("*.html"))
    ok = 0
    skip_reasons: dict[str, int] = {}
    for fp in files:
        changed, info = process(fp)
        if changed:
            ok += 1
        else:
            reason = info.split(":", 1)[1] if ":" in info else info
            skip_reasons[reason] = skip_reasons.get(reason, 0) + 1
    print(f"\nVerarbeitet: {ok} Pages")
    print("Übersprungen:")
    for r, c in sorted(skip_reasons.items(), key=lambda x: -x[1]):
        print(f"  {c:>4}  {r}")


if __name__ == "__main__":
    main()

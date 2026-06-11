# Adds a "read the full story" link to every GEO ownership block, pointing to
# the Niantic/Scopely explainer article (Phase 2.1). EN + DE link to their own
# language version, every other language links to the EN article.
# ar/ has no ownership blocks, so it is naturally excluded.
# Idempotent via the geo-own-link marker class.
import io
import re
from pathlib import Path

ROOT = Path(__file__).parent

EN_URL = "/en/niantic-scopely-buyout.html"
DE_URL = "/niantic-scopely-verkauf.html"

# lang dir -> (href, link text). Root (de) handled via "" key.
LINKS = {
    "": (DE_URL, "Die ganze Geschichte: Der Niantic-Scopely-Verkauf erklärt"),
    "en": (EN_URL, "The full story: the Niantic-Scopely deal explained"),
    "en-in": (EN_URL, "The full story: the Niantic-Scopely deal explained"),
    "id": (EN_URL, "The full story: the Niantic-Scopely deal explained"),
    "es-mx": (EN_URL, "La historia completa: la venta de Niantic a Scopely (en inglés)"),
    "fr": (EN_URL, "Toute l'histoire : la vente de Niantic à Scopely (en anglais)"),
    "it": (EN_URL, "La storia completa: la vendita di Niantic a Scopely (in inglese)"),
    "pt-br": (EN_URL, "A história completa: a venda da Niantic para a Scopely (em inglês)"),
    "ru": (EN_URL, "Вся история: продажа Niantic компании Scopely (на английском)"),
    "tr": (EN_URL, "Hikayenin tamamı: Niantic-Scopely satışı (İngilizce)"),
    "ja": (EN_URL, "全体像はこちら: Niantic売却の経緯まとめ（英語）"),
    "ko": (EN_URL, "전체 스토리: Niantic-Scopely 인수 정리(영어)"),
    "zh-cn": (EN_URL, "完整经过：Niantic 出售 Scopely 始末（英文）"),
    "zh-tw": (EN_URL, "完整經過：Niantic 出售 Scopely 始末（英文）"),
    "hi": (EN_URL, "पूरी कहानी: Niantic-Scopely सौदा (अंग्रेज़ी में)"),
}

PAGES = ["pokemon-go", "ingress"]

# Insert before the sources <p> inside the geo-own div.
ANCHOR_RE = re.compile(r'(<p style="font-size:13px;color:var\(--muted\);margin-top:10px">)')


def main() -> None:
    changed = 0
    for lang, (href, text) in LINKS.items():
        base = ROOT / lang if lang else ROOT
        for page in PAGES:
            path = base / "vs" / f"{page}.html"
            if not path.exists():
                continue
            html = io.open(path, encoding="utf-8").read()
            if "geo-own-link" in html or 'class="geo-own' not in html:
                continue
            link = (
                f'<p class="geo-own-link" style="font-size:14px;margin-top:14px">'
                f'<a href="{href}" style="color:var(--accent);font-weight:600">{text} &rarr;</a></p>\n    '
            )
            new_html, n = ANCHOR_RE.subn(link + r"\1", html, count=1)
            if n == 0:
                print(f"!! no anchor in {path}")
                continue
            io.open(path, "w", encoding="utf-8", newline="").write(new_html)
            changed += 1
            print(f"linked {path.relative_to(ROOT)}")
    print(f"{changed} pages linked")


if __name__ == "__main__":
    main()

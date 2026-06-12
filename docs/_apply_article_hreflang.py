# Post-pass for the Phase-3 article rollout: rewrites the hreflang block of
# every language variant of the two new articles (Scopely explainer,
# geocaching listicle) to the FULL cluster, and adds missing sitemap entries.
# Translation agents only set self/en/x-default; this script makes the
# cluster consistent across all variants including the original EN/DE pages.
# Raw UTF-8 in hrefs is intentional (site convention, see ja/ pages).
# Idempotent: rewrites the block in place on every run.
import io
import re
from pathlib import Path

ROOT = Path(__file__).parent
BASE = "https://mapraiders.com"

# hreflang code -> path per article. Keys follow the existing vs-page clusters
# (es -> es-mx dir, pt -> pt-br dir, zh-Hans/zh-Hant). No ar (excluded), no id.
EXPLAINER = {
    "de": "/niantic-scopely-verkauf.html",
    "en": "/en/niantic-scopely-buyout.html",
    "es": "/es-mx/quien-es-dueno-de-pokemon-go.html",
    "fr": "/fr/qui-possede-pokemon-go.html",
    "hi": "/hi/who-owns-pokemon-go.html",
    "it": "/it/chi-possiede-pokemon-go.html",
    "ja": "/ja/ポケモンGOは誰のもの.html",
    "ko": "/ko/포켓몬GO-소유자는-누구.html",
    "pt": "/pt-br/quem-e-dono-do-pokemon-go.html",
    "ru": "/ru/kto-vladeet-pokemon-go.html",
    "tr": "/tr/pokemon-go-artik-kimin.html",
    "zh-Hans": "/zh-cn/Pokemon-GO现在属于谁.html",
    "zh-Hant": "/zh-tw/Pokemon-GO現在屬於誰.html",
}
LISTICLE = {
    "de": "/geocaching-alternative-kostenlos.html",
    "en": "/en/free-geocaching-alternatives.html",
    "es": "/es-mx/alternativas-geocaching-gratis.html",
    "fr": "/fr/alternatives-geocaching-gratuites.html",
    "hi": "/hi/free-geocaching-alternatives.html",
    "it": "/it/alternative-geocaching-gratuite.html",
    "ja": "/ja/ジオキャッシング無料代替.html",
    "ko": "/ko/무료-지오캐싱-대안.html",
    "pt": "/pt-br/alternativas-geocaching-gratis.html",
    "ru": "/ru/besplatnye-alternativy-geocaching.html",
    "tr": "/tr/ucretsiz-geocaching-alternatifleri.html",
    "zh-Hans": "/zh-cn/免费Geocaching替代.html",
    "zh-Hant": "/zh-tw/免費Geocaching替代.html",
}

HREFLANG_LINE = re.compile(r'[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?')


def block(cluster: dict) -> str:
    lines = [
        f'  <link rel="alternate" hreflang="{code}" href="{BASE}{path}">'
        for code, path in sorted(cluster.items())
    ]
    lines.append(
        f'  <link rel="alternate" hreflang="x-default" href="{BASE}{cluster["en"]}">'
    )
    return "\n".join(lines) + "\n"


def apply(cluster: dict) -> int:
    done = 0
    for path in cluster.values():
        f = ROOT / path.lstrip("/")
        if not f.exists():
            print(f"!! missing: {f}")
            continue
        html = io.open(f, encoding="utf-8").read()
        canon = re.search(r'<link rel="canonical"[^>]*>\n?', html)
        if not canon:
            print(f"!! no canonical in {f}")
            continue
        html = HREFLANG_LINE.sub("", html)
        canon = re.search(r'<link rel="canonical"[^>]*>\n?', html)
        pos = canon.end()
        html = html[:pos] + block(cluster) + html[pos:]
        io.open(f, "w", encoding="utf-8", newline="").write(html)
        done += 1
    return done


def update_sitemap() -> None:
    p = ROOT / "sitemap.xml"
    s = io.open(p, encoding="utf-8").read()
    added = 0
    entries = ""
    for cluster in (EXPLAINER, LISTICLE):
        for path in cluster.values():
            url = BASE + path
            if url not in s:
                entries += (
                    f"  <url>\n    <loc>{url}</loc>\n    <lastmod>2026-06-12</lastmod>\n"
                    f"    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>\n"
                )
                added += 1
    s = s.replace("</urlset>", entries + "</urlset>")
    io.open(p, "w", encoding="utf-8", newline="").write(s)
    print(f"sitemap: {added} URLs added")


def main() -> None:
    n1 = apply(EXPLAINER)
    n2 = apply(LISTICLE)
    print(f"hreflang rewritten: explainer {n1}, listicle {n2}")
    update_sitemap()


if __name__ == "__main__":
    main()

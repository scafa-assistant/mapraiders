# -*- coding: utf-8 -*-
"""
Phase M2: homepage discover-links for orphaned niche BASE pages (GSC fix 2026-07-13).

Finding: every locale homepage's "Mehr entdecken"-column links the REVIEW
variants (-erfahrungen/-yorumlar/-후기 ...) but NOT the base money pages
(yuruyus-oyunu, hazine-avi-uygulamasi, handyspiel-zum-laufen ...). 41 of the
87 "crawled - currently not indexed" pages had no link from their own locale
homepage. This script appends the missing own-locale links to the discover
column (last <ul> of the pre-footer nav).

Idempotent via marker comment PHASE-M2-LINK on each inserted <li>.
Anchor text = page <title> up to the first ":" / "–" / "—" / "|".
"""
from __future__ import annotations
import re, sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
MARK = "PHASE-M2-LINK"

# locale-homepage -> list of own-locale pages that must be linked from it
ADDITIONS = {
    "index.html": [
        "/handyspiel-zum-laufen.html",
        "/schnitzeljagd-app.html",
        "/territorium-spiel-erfahrungen.html",
        "/spiele-wie-pokemon-go.html",
        "/pokemon-go-alternative-kostenlos.html",
        "/outdoor-social-app.html",
    ],
    "en/index.html": [
        "/en/scavenger-hunt-app.html",
        "/en/games-like-pokemon-go.html",
        "/en/pokemon-go-alternative-free.html",
        "/en/social-media-alternative.html",
        "/en/fitness-mmo/",
        "/en/scavenger-hunt/",
    ],
    "en-in/index.html": [
        "/en-in/pokemon-go-alternative-free-india.html",
        "/en-in/treasure-hunt-app-india.html",
        "/en-in/walking-app-with-game-india.html",
        "/en-in/games-for-low-end-android.html",
        "/en-in/games-like-pokemon-go-india.html",
    ],
    "fr/index.html": [
        "/fr/application-marche-avec-jeu.html",
        "/fr/chasse-au-tresor-application.html",
        "/fr/alternative-pokemon-go-gratuit.html",
        "/fr/jeu-geolocalise.html",
        "/fr/audio-graffiti/",
        "/fr/pokemon-go-saudi-alternative.html",
    ],
    "it/index.html": [
        "/it/app-camminata-con-gioco.html",
        "/it/caccia-al-tesoro-app-italia.html",
        "/it/gaiasmart-alternativa.html",
    ],
    "es-mx/index.html": [
        "/es-mx/app-caminata-con-juego.html",
        "/es-mx/busqueda-del-tesoro-app.html",
        "/es-mx/juego-de-colonia.html",
        "/es-mx/pokemon-go-sin-fake-gps.html",
        "/es-mx/app-social-outdoor.html",
    ],
    "pt-br/index.html": [
        "/pt-br/app-caminhada-com-jogo.html",
        "/pt-br/caca-ao-tesouro-app.html",
        "/pt-br/pokemon-go-sem-fake-gps.html",
        "/pt-br/app-corrida/",
        "/pt-br/jogo-passear-cachorro.html",
    ],
    "id/index.html": [
        "/id/aplikasi-jalan-kaki-game.html",
        "/id/harta-karun-aplikasi.html",
        "/id/alternatif-pokemon-go-gratis.html",
        "/id/permainan-teritori.html",
        "/id/game-lokasi.html",
        "/id/koin-jagat-alternatif.html",
    ],
    "tr/index.html": [
        "/tr/yuruyus-oyunu.html",
        "/tr/hazine-avi-uygulamasi.html",
        "/tr/mahalle-oyunu.html",
        "/tr/pokemon-go-alternatif-ucretsiz.html",
        "/tr/fake-gps-olmadan-oyun.html",
        "/tr/konum-tabanli-oyun.html",
    ],
    "ru/index.html": [
        "/ru/zamenitel-pokemon-go.html",
        "/ru/prilozhenie-progulki-s-igroy.html",
        "/ru/iskat-klad-prilozhenie.html",
        "/ru/draconius-go-alternativa.html",
    ],
    "ja/index.html": [
        "/ja/散歩ゲーム.html",
        "/ja/宝探しアプリ.html",
        "/ja/ポケモンGO-代わり-無料.html",
        "/ja/課金不要-位置情報ゲーム.html",
        "/ja/位置情報ゲーム.html",
        "/ja/ドラクエウォーク-似てる.html",
    ],
    "ko/index.html": [
        "/ko/산책게임.html",
        "/ko/보물찾기-앱.html",
        "/ko/포켓몬고-대안-무료.html",
        "/ko/무과금-위치기반게임.html",
        "/ko/만보기-게임.html",
    ],
    "zh-cn/index.html": [
        "/zh-cn/散步游戏化App.html",
        "/zh-cn/寻宝游戏App.html",
        "/zh-cn/Pokemon-GO替代免费.html",
        "/zh-cn/无VPN位置游戏.html",
        "/zh-cn/量子计划替代.html",
    ],
    "zh-tw/index.html": [
        "/zh-tw/尋寶遊戲應用程式.html",
        "/zh-tw/Pokemon-GO替代免費.html",
        "/zh-tw/夜市散步應用程式.html",
        "/zh-tw/香港行山應用程式.html",
        "/zh-tw/鄰裡遊戲/",
        "/zh-tw/Pokemon-GO沙特問題.html",
    ],
    "hi/index.html": [
        "/hi/walking-app-with-game.html",
        "/hi/treasure-hunt-app.html",
        "/hi/mohalla-game.html",
        "/hi/pokemon-go-alternative-free.html",
        "/hi/cricket-fan-app.html",
        "/hi/scavenger-hunt/",
    ],
    "ar/index.html": [
        "/ar/lo3bat-bahth-kanz.html",
        "/ar/pokemon-go-mukamil.html",
        "/ar/tatbeeq-mashy-3a2ila.html",
        "/ar/lo3bat-ramadan.html",
        "/ar/lo3bat-2030.html",
    ],
}

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S)


def anchor_for(page: Path) -> str | None:
    m = TITLE_RE.search(page.read_text(encoding="utf-8", errors="ignore"))
    if not m:
        return None
    t = re.split(r"[:|–—]", m.group(1).strip())[0].strip()
    t = t.replace("&amp;", "&")
    return t or None


def file_for(href: str) -> Path:
    p = href.lstrip("/")
    return ROOT / (p + "index.html" if p.endswith("/") else p)


def main() -> int:
    total = 0
    errors = []
    for home, hrefs in ADDITIONS.items():
        hp = ROOT / home
        if not hp.exists():
            errors.append(f"homepage missing: {home}")
            continue
        t = hp.read_text(encoding="utf-8")
        # last </ul></div></div> before </nav> = discover column
        nav_end = t.rfind("</nav>")
        ul_end = t.rfind("</ul>", 0, nav_end)
        if ul_end == -1 or nav_end == -1:
            errors.append(f"no discover <ul> found in {home}")
            continue
        lis = []
        for href in hrefs:
            if MARK in t and f'href="{href}"' in t:
                continue  # already inserted on a previous run
            if f'href="{href}"' in t:
                continue  # already linked natively
            target = file_for(href)
            if not target.exists():
                errors.append(f"{home}: target missing {href}")
                continue
            a = anchor_for(target)
            if not a:
                errors.append(f"{home}: no title in {href}")
                continue
            lis.append(
                f'<li><!--{MARK}--><a href="{href}" '
                f'style="color:#9fb0d0;text-decoration:none">{a}</a></li>'
            )
        if not lis:
            print(f"--  {home}: nothing to add")
            continue
        t = t[:ul_end] + "".join(lis) + t[ul_end:]
        hp.write_text(t, encoding="utf-8")
        total += len(lis)
        print(f"OK  {home}: +{len(lis)} links")
    print(f"\nLinks added: {total}")
    if errors:
        print("ERRORS:")
        for e in errors:
            print("  ", e)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

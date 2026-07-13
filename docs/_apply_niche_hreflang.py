# -*- coding: utf-8 -*-
"""
Phase M: hreflang clusters for the Adjacent-Intent niche pages (GSC fix 2026-07-13).

Background: 87 pages sit in GSC "Crawled - currently not indexed"; 36 of them
(plus ~130 siblings sitewide) are niche/review pages that were rolled out per
locale WITHOUT any hreflang wiring. Google cannot cluster the language variants,
treats each as an isolated thin page and refuses to index them.

This script wires 19 verified topic clusters (161 pages). Pages that are
DELIBERATELY locale-unique (cricket-fan, ramadan, koin-jagat, DoraQue-Walk,
no-VPN, HK hiking, woog, gaiasmart, draconius ...) are intentionally NOT
clustered - a solo page needs no hreflang.

Idempotent: strips any existing rel=alternate hreflang links from member pages,
then inserts the full cluster block directly after <link rel="canonical">.

Rules honoured (see _validate_seo.py):
- self-reference in every set
- full reciprocity (every member carries the identical set)
- x-default -> en member if present, else de (root) member, else omitted
- refuses members that are non-indexable (noindex or foreign canonical)
"""
from __future__ import annotations
import os, re, sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
BASE = "https://mapraiders.com/"

# locale key -> hreflang code
CODE = {
    "de": "de", "en": "en", "en-IN": "en-IN", "fr": "fr", "it": "it",
    "es": "es", "pt": "pt", "id": "id", "tr": "tr", "ru": "ru",
    "ja": "ja", "ko": "ko", "zh-Hans": "zh-Hans", "zh-Hant": "zh-Hant",
    "hi": "hi", "ar": "ar",
}

# 19 clusters: {hreflang-code: relative file path}
GROUPS = {
    "mapraiders-reviews": {
        "de": "mapraiders-erfahrungen.html",
        "en": "en/mapraiders-reviews.html",
        "en-IN": "en-in/mapraiders-reviews-india.html",
        "fr": "fr/mapraiders-avis.html",
        "it": "it/mapraiders-recensioni.html",
        "es": "es-mx/mapraiders-opiniones.html",
        "pt": "pt-br/mapraiders-avaliacoes.html",
        "id": "id/mapraiders-ulasan.html",
        "tr": "tr/mapraiders-yorumlar.html",
        "ru": "ru/mapraiders-otzyvy.html",
        "ja": "ja/MapRaiders-レビュー.html",
        "ko": "ko/MapRaiders-후기.html",
        "zh-Hans": "zh-cn/MapRaiders-评价.html",
        "zh-Hant": "zh-tw/MapRaiders-評價.html",
        "hi": "hi/mapraiders-samiksha.html",
        "ar": "ar/MapRaiders-tajriba.html",
    },
    "treasure-hunt-app": {
        "de": "schnitzeljagd-app.html",
        "en": "en/scavenger-hunt-app.html",
        "en-IN": "en-in/treasure-hunt-app-india.html",
        "fr": "fr/chasse-au-tresor-application.html",
        "it": "it/caccia-al-tesoro-app-italia.html",
        "es": "es-mx/busqueda-del-tesoro-app.html",
        "pt": "pt-br/caca-ao-tesouro-app.html",
        "id": "id/harta-karun-aplikasi.html",
        "tr": "tr/hazine-avi-uygulamasi.html",
        "ru": "ru/iskat-klad-prilozhenie.html",
        "ja": "ja/宝探しアプリ.html",
        "ko": "ko/보물찾기-앱.html",
        "zh-Hans": "zh-cn/寻宝游戏App.html",
        "zh-Hant": "zh-tw/尋寶遊戲應用程式.html",
        "hi": "hi/treasure-hunt-app.html",
        "ar": "ar/lo3bat-bahth-kanz.html",
    },
    "treasure-hunt-reviews": {
        "de": "schnitzeljagd-app-erfahrungen.html",
        "en": "en/scavenger-hunt-app-reviews.html",
        "en-IN": "en-in/treasure-hunt-reviews-india.html",
        "fr": "fr/chasse-au-tresor-avis.html",
        "it": "it/caccia-al-tesoro-app-italia-recensioni.html",
        "es": "es-mx/busqueda-del-tesoro-app-opiniones.html",
        "pt": "pt-br/caca-ao-tesouro-app-avaliacoes.html",
        "id": "id/harta-karun-aplikasi-ulasan.html",
        "tr": "tr/hazine-avi-uygulamasi-yorumlar.html",
        "ru": "ru/iskat-klad-prilozhenie-otzyvy.html",
        "ja": "ja/宝探しアプリ-レビュー.html",
        "ko": "ko/보물찾기-앱-후기.html",
        "zh-Hans": "zh-cn/寻宝游戏App-评价.html",
        "zh-Hant": "zh-tw/尋寶遊戲應用程式-評價.html",
        "hi": "hi/treasure-hunt-samiksha.html",
        "ar": "ar/lo3bat-bahth-kanz-tajriba.html",
    },
    "walking-app-with-game": {
        "de": "handyspiel-zum-laufen.html",
        "en-IN": "en-in/walking-app-with-game-india.html",
        "fr": "fr/application-marche-avec-jeu.html",
        "it": "it/app-camminata-con-gioco.html",
        "es": "es-mx/app-caminata-con-juego.html",
        "pt": "pt-br/app-caminhada-com-jogo.html",
        "id": "id/aplikasi-jalan-kaki-game.html",
        "tr": "tr/yuruyus-oyunu.html",
        "ru": "ru/prilozhenie-progulki-s-igroy.html",
        "ja": "ja/散歩ゲーム.html",
        "ko": "ko/산책게임.html",
        "zh-Hans": "zh-cn/散步游戏化App.html",
        "hi": "hi/walking-app-with-game.html",
    },
    "walking-app-reviews": {
        "de": "handyspiel-laufen-erfahrungen.html",
        "en": "en/walking-app-reviews.html",
        "en-IN": "en-in/walking-app-reviews-india.html",
        "fr": "fr/application-marche-avis.html",
        "it": "it/app-camminata-con-gioco-recensioni.html",
        "es": "es-mx/app-caminata-vale-la-pena.html",
        "pt": "pt-br/app-caminhada-vale-a-pena.html",
        "id": "id/aplikasi-jalan-kaki-game-ulasan.html",
        "tr": "tr/yuruyus-oyunu-yorumlar.html",
        "ru": "ru/prilozhenie-progulki-s-igroy-otzyvy.html",
        "ja": "ja/散歩ゲーム-レビュー.html",
        "ko": "ko/산책게임-후기.html",
        "zh-Hans": "zh-cn/散步App-值得吗.html",
        "hi": "hi/walking-app-kaisa-hai.html",
    },
    "territory-game-reviews": {
        "de": "territorium-spiel-erfahrungen.html",
        "en": "en/territory-game-app-reviews.html",
        "en-IN": "en-in/territory-game-reviews-india.html",
        "fr": "fr/jeu-territoire-avis.html",
        "it": "it/gioco-territorio-recensioni.html",
        "es": "es-mx/juego-de-territorio-opiniones.html",
        "pt": "pt-br/jogo-de-territorio-avaliacoes.html",
        "id": "id/permainan-teritori-ulasan.html",
        "tr": "tr/bolge-oyunu-yorumlar.html",
        "ru": "ru/igra-territoriy-otzyvy.html",
        "ja": "ja/陣取りゲーム-レビュー.html",
        "ko": "ko/영토게임-후기.html",
        "zh-Hans": "zh-cn/领地游戏-评价.html",
        "zh-Hant": "zh-tw/領地遊戲-評價.html",
        "hi": "hi/territory-game-samiksha.html",
        "ar": "ar/territory-game-tajriba.html",
    },
    "location-game-reviews": {
        "de": "standort-spiel-erfahrungen.html",
        "fr": "fr/jeu-geolocalise-avis.html",
        "it": "it/gioco-geolocalizzazione-recensioni.html",
        "es": "es-mx/juego-de-gps-opiniones.html",
        "pt": "pt-br/jogo-de-gps-avaliacoes.html",
        "id": "id/game-lokasi-ulasan.html",
        "tr": "tr/konum-tabanli-oyun-yorumlar.html",
        "ru": "ru/geo-igra-otzyvy.html",
        "ja": "ja/位置情報ゲーム-レビュー.html",
        "ko": "ko/위치기반게임-후기.html",
        "zh-Hans": "zh-cn/位置游戏-评价.html",
        "zh-Hant": "zh-tw/位置遊戲-心得.html",
        "hi": "hi/location-game-kaisa-hai.html",
        "ar": "ar/location-game-tajriba.html",
    },
    "pokemon-go-alternative-reviews": {
        "de": "pokemon-go-alternative-erfahrungen.html",
        "en": "en/pokemon-go-alternative-reviews.html",
        "en-IN": "en-in/pokemon-go-alternative-reviews-india.html",
        "fr": "fr/alternative-pokemon-go-avis.html",
        "it": "it/alternativa-pokemon-go-gratis-recensioni.html",
        "es": "es-mx/alternativa-pokemon-go-vale-la-pena.html",
        "pt": "pt-br/alternativa-pokemon-go-vale-a-pena.html",
        "id": "id/alternatif-pokemon-go-gratis-ulasan.html",
        "tr": "tr/pokemon-go-alternatif-yorumlar.html",
        "ru": "ru/zamenitel-pokemon-go-otzyvy.html",
        "ja": "ja/ポケモンGO-代わり-レビュー.html",
        "ko": "ko/포켓몬고-대안-후기.html",
        "zh-Hans": "zh-cn/Pokemon-GO替代免费-评价.html",
        "zh-Hant": "zh-tw/Pokemon-GO替代免費-評價.html",
        "hi": "hi/pokemon-go-alternative-samiksha.html",
        "ar": "ar/pokemon-go-mukamil-tajriba.html",
    },
    "pokemon-go-alternative-free": {
        "de": "pokemon-go-alternative-kostenlos.html",
        "en": "en/pokemon-go-alternative-free.html",
        "en-IN": "en-in/pokemon-go-alternative-free-india.html",
        "fr": "fr/alternative-pokemon-go-gratuit.html",
        "id": "id/alternatif-pokemon-go-gratis.html",
        "tr": "tr/pokemon-go-alternatif-ucretsiz.html",
        "ru": "ru/zamenitel-pokemon-go.html",
        "ja": "ja/ポケモンGO-代わり-無料.html",
        "ko": "ko/포켓몬고-대안-무료.html",
        "zh-Hans": "zh-cn/Pokemon-GO替代免费.html",
        "zh-Hant": "zh-tw/Pokemon-GO替代免費.html",
        "hi": "hi/pokemon-go-alternative-free.html",
        "ar": "ar/pokemon-go-mukamil.html",
    },
    "games-like-pokemon-go": {
        "de": "spiele-wie-pokemon-go.html",
        "en": "en/games-like-pokemon-go.html",
        "en-IN": "en-in/games-like-pokemon-go-india.html",
    },
    "games-like-pokemon-go-reviews": {
        "de": "spiele-wie-pokemon-go-erfahrungen.html",
        "en": "en/games-like-pokemon-go-reviews.html",
        "en-IN": "en-in/games-like-pokemon-go-reviews-india.html",
    },
    "fake-gps-free": {
        "tr": "tr/fake-gps-olmadan-oyun.html",
        "es": "es-mx/pokemon-go-sin-fake-gps.html",
        "pt": "pt-br/pokemon-go-sem-fake-gps.html",
    },
    "fake-gps-reviews": {
        "tr": "tr/fake-gps-olmadan-yorumlar.html",
        "es": "es-mx/pokemon-go-sin-fake-gps-opiniones.html",
        "pt": "pt-br/pokemon-go-sem-fake-gps-avaliacoes.html",
    },
    "neighborhood-game": {
        "tr": "tr/mahalle-oyunu.html",
        "hi": "hi/mohalla-game.html",
        "es": "es-mx/juego-de-colonia.html",
    },
    "neighborhood-game-reviews": {
        "tr": "tr/mahalle-oyunu-yorumlar.html",
        "hi": "hi/mohalla-game-samiksha.html",
        "es": "es-mx/juego-de-colonia-opiniones.html",
    },
    "pokemon-go-saudi": {
        "fr": "fr/pokemon-go-saudi-alternative.html",
        "zh-Hant": "zh-tw/Pokemon-GO沙特問題.html",
    },
    "pokemon-go-saudi-reviews": {
        "fr": "fr/pokemon-go-saudi-avis.html",
        "zh-Hant": "zh-tw/Pokemon-GO沙特問題-評價.html",
        "it": "it/pokemon-go-saudi-alternativa-recensioni.html",
        "ru": "ru/pokemon-go-saudi-alternativa-otzyvy.html",
    },
    "f2p-location-game": {
        "ja": "ja/課金不要-位置情報ゲーム.html",
        "ko": "ko/무과금-위치기반게임.html",
    },
    "f2p-location-game-reviews": {
        "ja": "ja/課金不要-位置情報ゲーム-レビュー.html",
        "ko": "ko/무과금-게임-후기.html",
    },
}

ALT_RE = re.compile(r'[ \t]*<link rel="alternate" hreflang="[^"]+" href="[^"]+"\s*/?>\s*\n?')
CAN_RE = re.compile(r'(<link rel="canonical" href="([^"]+)"\s*/?>)')


def url_for(path: str) -> str:
    return BASE + path


def main() -> int:
    errors = []
    changed = 0
    for name, members in GROUPS.items():
        # sanity: files exist + indexable
        texts = {}
        for code, path in members.items():
            fp = ROOT / path
            if not fp.exists():
                errors.append(f"{name}: file missing {path}")
                continue
            t = fp.read_text(encoding="utf-8")
            m = CAN_RE.search(t)
            if not m:
                errors.append(f"{name}: no canonical in {path}")
                continue
            if m.group(2) != url_for(path):
                errors.append(f"{name}: foreign canonical in {path} -> {m.group(2)}")
                continue
            if 'content="noindex' in t:
                errors.append(f"{name}: noindex in {path}")
                continue
            texts[path] = t
        if len(texts) != len(members):
            print(f"SKIP group {name} (see errors)")
            continue

        # build block (identical for every member -> reciprocity guaranteed)
        ordered = sorted(members.items(), key=lambda kv: kv[0].lower())
        lines = [
            f'<link rel="alternate" hreflang="{code}" href="{url_for(path)}">'
            for code, path in ordered
        ]
        xdef = members.get("en") or members.get("de")
        if xdef:
            lines.append(
                f'<link rel="alternate" hreflang="x-default" href="{url_for(xdef)}">'
            )
        block = "\n".join(lines)

        for code, path in members.items():
            fp = ROOT / path
            t = texts[path]
            t2 = ALT_RE.sub("", t)  # strip any existing hreflang links
            m = CAN_RE.search(t2)
            insert_at = m.end(1)
            t2 = t2[:insert_at] + "\n" + block + t2[insert_at:]
            if t2 != t:
                fp.write_text(t2, encoding="utf-8")
                changed += 1
        print(f"OK  {name}: {len(members)} pages wired")

    print(f"\nFiles changed: {changed}")
    if errors:
        print("ERRORS:")
        for e in errors:
            print("  ", e)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

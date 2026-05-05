#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate sitemap-phase1.xml mit allen 240 Killer-URLs (Phase 1).
Update sitemap-index.xml um die neuen Sprach-Sitemaps + Phase-1-Sitemap.
Output: 240 URLs auf einen Blick + Submission-Markdown für GSC.
"""
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
SITE = "https://mapraiders.com"
TODAY = datetime.now().strftime("%Y-%m-%d")

# Alle 240 Phase-1-URLs (15 pro Sprache × 16 Sprachen)
# Format: (slug, breadcrumb-name, lang, type, priority)
PAGES = []

# DE (15)
DE = [
    ("/spiele-wie-pokemon-go.html", "Spiele wie Pokémon GO", "killer", "0.9"),
    ("/pokemon-go-alternative-kostenlos.html", "Pokémon GO Alternative kostenlos", "killer", "0.9"),
    ("/territorium-spiel.html", "Territorium-Spiel", "killer", "0.9"),
    ("/standort-spiel.html", "Standort-Spiel", "killer", "0.9"),
    ("/gps-spiel-deutschland.html", "GPS-Spiel Deutschland", "killer", "0.9"),
    ("/schnitzeljagd-app.html", "Schnitzeljagd-App", "killer", "0.9"),
    ("/handyspiel-zum-laufen.html", "Handyspiel zum Laufen", "killer", "0.9"),
    ("/spiele-wie-pokemon-go-erfahrungen.html", "Spiele wie PG Erfahrungen", "twin", "0.7"),
    ("/pokemon-go-alternative-erfahrungen.html", "PG Alternative Erfahrungen", "twin", "0.7"),
    ("/territorium-spiel-erfahrungen.html", "Territorium-Spiel Erfahrungen", "twin", "0.7"),
    ("/standort-spiel-erfahrungen.html", "Standort-Spiel Erfahrungen", "twin", "0.7"),
    ("/gps-spiel-erfahrungen.html", "GPS-Spiel Erfahrungen", "twin", "0.7"),
    ("/schnitzeljagd-app-erfahrungen.html", "Schnitzeljagd Erfahrungen", "twin", "0.7"),
    ("/handyspiel-laufen-erfahrungen.html", "Handyspiel Erfahrungen", "twin", "0.7"),
    ("/mapraiders-erfahrungen.html", "MapRaiders Erfahrungen Hub", "hub", "0.8"),
]
for slug, name, t, p in DE:
    PAGES.append((slug, name, "de", t, p))

# EN (15)
EN = [
    ("/en/pokemon-go-alternative-free.html", "Pokémon GO Alternative Free", "killer", "0.9"),
    ("/en/games-like-pokemon-go.html", "Games Like Pokémon GO", "killer", "1.0"),  # Volume-King!
    ("/en/territory-game-app.html", "Territory Game App", "killer", "0.9"),
    ("/en/niantic-alternative.html", "Niantic Alternative", "killer", "0.9"),
    ("/en/best-walking-apps-with-game.html", "Best Walking Apps Gamified", "killer", "0.9"),
    ("/en/scavenger-hunt-app.html", "Scavenger Hunt App", "killer", "0.9"),
    ("/en/zenly-alternative.html", "Zenly Alternative", "killer", "0.9"),
    ("/en/pokemon-go-alternative-reviews.html", "PG Alt Reviews", "twin", "0.7"),
    ("/en/games-like-pokemon-go-reviews.html", "Games Like PG Reviews", "twin", "0.7"),
    ("/en/territory-game-app-reviews.html", "Territory Game Reviews", "twin", "0.7"),
    ("/en/niantic-alternative-reviews.html", "Niantic Alt Reviews", "twin", "0.7"),
    ("/en/walking-app-reviews.html", "Walking App Reviews", "twin", "0.7"),
    ("/en/scavenger-hunt-app-reviews.html", "Scavenger Hunt Reviews", "twin", "0.7"),
    ("/en/zenly-alternative-reviews.html", "Zenly Alt Reviews", "twin", "0.7"),
    ("/en/mapraiders-reviews.html", "MapRaiders Reviews Hub", "hub", "0.8"),
]
for slug, name, t, p in EN:
    PAGES.append((slug, name, "en", t, p))

# JA (15)
JA = [
    ("/ja/陣取りゲーム.html", "陣取りゲーム", "killer", "0.9"),
    ("/ja/位置情報ゲーム.html", "位置情報ゲーム", "killer", "1.0"),  # Volume-King
    ("/ja/ポケモンGO-代わり-無料.html", "ポケモンGO 代わり 無料", "killer", "0.9"),
    ("/ja/ドラクエウォーク-似てる.html", "ドラクエウォーク 似てる", "killer", "0.9"),
    ("/ja/散歩ゲーム.html", "散歩ゲーム", "killer", "0.9"),
    ("/ja/宝探しアプリ.html", "宝探しアプリ", "killer", "0.9"),
    ("/ja/課金不要-位置情報ゲーム.html", "課金不要 位置情報ゲーム", "killer", "0.9"),
    ("/ja/陣取りゲーム-レビュー.html", "陣取りゲーム レビュー", "twin", "0.7"),
    ("/ja/位置情報ゲーム-レビュー.html", "位置情報ゲーム レビュー", "twin", "0.7"),
    ("/ja/ポケモンGO-代わり-レビュー.html", "ポケモンGO 代わり レビュー", "twin", "0.7"),
    ("/ja/ドラクエウォーク-似てる-レビュー.html", "ドラクエウォーク 似てる レビュー", "twin", "0.7"),
    ("/ja/散歩ゲーム-レビュー.html", "散歩ゲーム レビュー", "twin", "0.7"),
    ("/ja/宝探しアプリ-レビュー.html", "宝探しアプリ レビュー", "twin", "0.7"),
    ("/ja/課金不要-位置情報ゲーム-レビュー.html", "課金不要 レビュー", "twin", "0.7"),
    ("/ja/MapRaiders-レビュー.html", "MapRaiders レビュー Hub", "hub", "0.8"),
]
for slug, name, t, p in JA:
    PAGES.append((slug, name, "ja", t, p))

# KO (15)
KO = [
    ("/ko/영토게임.html", "영토게임", "killer", "0.9"),
    ("/ko/위치기반게임.html", "위치기반게임", "killer", "1.0"),  # Volume-King
    ("/ko/포켓몬고-대안-무료.html", "포켓몬고 대안 무료", "killer", "0.9"),
    ("/ko/산책게임.html", "산책게임", "killer", "0.9"),
    ("/ko/무과금-위치기반게임.html", "무과금 위치기반게임", "killer", "0.9"),
    ("/ko/보물찾기-앱.html", "보물찾기 앱", "killer", "0.9"),
    ("/ko/만보기-게임.html", "만보기 게임", "killer", "0.9"),
    ("/ko/영토게임-후기.html", "영토게임 후기", "twin", "0.7"),
    ("/ko/위치기반게임-후기.html", "위치기반게임 후기", "twin", "0.7"),
    ("/ko/포켓몬고-대안-후기.html", "포켓몬고 대안 후기", "twin", "0.7"),
    ("/ko/산책게임-후기.html", "산책게임 후기", "twin", "0.7"),
    ("/ko/무과금-게임-후기.html", "무과금 후기", "twin", "0.7"),
    ("/ko/보물찾기-앱-후기.html", "보물찾기 후기", "twin", "0.7"),
    ("/ko/만보기-게임-후기.html", "만보기 후기", "twin", "0.7"),
    ("/ko/MapRaiders-후기.html", "MapRaiders 후기 Hub", "hub", "0.8"),
]
for slug, name, t, p in KO:
    PAGES.append((slug, name, "ko", t, p))

# PT-BR (15)
PTBR = [
    ("/pt-br/alternativa-pokemon-go-gratis.html", "Alt PG Grátis", "killer", "0.9"),
    ("/pt-br/jogo-de-gps.html", "Jogo de GPS", "killer", "1.0"),  # Volume-King
    ("/pt-br/jogo-de-territorio.html", "Jogo de Território", "killer", "0.9"),
    ("/pt-br/pokemon-go-sem-fake-gps.html", "PG sem fake-GPS", "killer", "0.9"),
    ("/pt-br/app-caminhada-com-jogo.html", "App Caminhada", "killer", "0.9"),
    ("/pt-br/caca-ao-tesouro-app.html", "Caça ao Tesouro App", "killer", "0.9"),
    ("/pt-br/jogo-passear-cachorro.html", "Jogo Passear Cachorro", "killer", "0.9"),
    ("/pt-br/alternativa-pokemon-go-vale-a-pena.html", "Alt PG Vale a Pena", "twin", "0.7"),
    ("/pt-br/jogo-de-gps-avaliacoes.html", "GPS Avaliações", "twin", "0.7"),
    ("/pt-br/jogo-de-territorio-avaliacoes.html", "Território Avaliações", "twin", "0.7"),
    ("/pt-br/pokemon-go-sem-fake-gps-avaliacoes.html", "Sem fake-GPS Avaliações", "twin", "0.7"),
    ("/pt-br/app-caminhada-vale-a-pena.html", "Caminhada Vale a Pena", "twin", "0.7"),
    ("/pt-br/caca-ao-tesouro-app-avaliacoes.html", "Caça ao Tesouro Avaliações", "twin", "0.7"),
    ("/pt-br/jogo-passear-cachorro-avaliacoes.html", "Passear Cachorro Avaliações", "twin", "0.7"),
    ("/pt-br/mapraiders-avaliacoes.html", "MapRaiders Avaliações Hub", "hub", "0.8"),
]
for slug, name, t, p in PTBR:
    PAGES.append((slug, name, "pt-BR", t, p))

# TR (15)
TR = [
    ("/tr/bolge-oyunu.html", "Bölge Oyunu", "killer", "0.9"),
    ("/tr/konum-tabanli-oyun.html", "Konum Tabanlı Oyun", "killer", "0.9"),
    ("/tr/pokemon-go-alternatif-ucretsiz.html", "PG Alternatif Ücretsiz", "killer", "0.9"),
    ("/tr/fake-gps-olmadan-oyun.html", "Fake GPS Olmadan", "killer", "0.9"),
    ("/tr/yuruyus-oyunu.html", "Yürüyüş Oyunu", "killer", "0.9"),
    ("/tr/hazine-avi-uygulamasi.html", "Hazine Avı Uygulaması", "killer", "1.0"),  # Volume-King
    ("/tr/mahalle-oyunu.html", "Mahalle Oyunu", "killer", "0.9"),
    ("/tr/bolge-oyunu-yorumlar.html", "Bölge Yorumlar", "twin", "0.7"),
    ("/tr/konum-tabanli-oyun-yorumlar.html", "Konum Yorumlar", "twin", "0.7"),
    ("/tr/pokemon-go-alternatif-yorumlar.html", "PG Alt Yorumlar", "twin", "0.7"),
    ("/tr/fake-gps-olmadan-yorumlar.html", "Fake GPS Yorumlar", "twin", "0.7"),
    ("/tr/yuruyus-oyunu-yorumlar.html", "Yürüyüş Yorumlar", "twin", "0.7"),
    ("/tr/hazine-avi-uygulamasi-yorumlar.html", "Hazine Yorumlar", "twin", "0.7"),
    ("/tr/mahalle-oyunu-yorumlar.html", "Mahalle Yorumlar", "twin", "0.7"),
    ("/tr/mapraiders-yorumlar.html", "MapRaiders Yorumlar Hub", "hub", "0.8"),
]
for slug, name, t, p in TR:
    PAGES.append((slug, name, "tr", t, p))

# ES-MX (15)
ESMX = [
    ("/es-mx/alternativa-pokemon-go-gratis.html", "Alt PG Gratis", "killer", "0.9"),
    ("/es-mx/juego-de-gps.html", "Juego de GPS", "killer", "1.0"),  # Volume-King
    ("/es-mx/juego-de-territorio.html", "Juego de Territorio", "killer", "0.9"),
    ("/es-mx/pokemon-go-sin-fake-gps.html", "PG sin fake-GPS", "killer", "0.9"),
    ("/es-mx/app-caminata-con-juego.html", "App Caminata", "killer", "0.9"),
    ("/es-mx/busqueda-del-tesoro-app.html", "Búsqueda del Tesoro", "killer", "0.9"),
    ("/es-mx/juego-de-colonia.html", "Juego de Colonia", "killer", "0.9"),
    ("/es-mx/alternativa-pokemon-go-vale-la-pena.html", "Alt PG Vale la Pena", "twin", "0.7"),
    ("/es-mx/juego-de-gps-opiniones.html", "GPS Opiniones", "twin", "0.7"),
    ("/es-mx/juego-de-territorio-opiniones.html", "Territorio Opiniones", "twin", "0.7"),
    ("/es-mx/pokemon-go-sin-fake-gps-opiniones.html", "Sin fake-GPS Opiniones", "twin", "0.7"),
    ("/es-mx/app-caminata-vale-la-pena.html", "Caminata Vale la Pena", "twin", "0.7"),
    ("/es-mx/busqueda-del-tesoro-app-opiniones.html", "Tesoro Opiniones", "twin", "0.7"),
    ("/es-mx/juego-de-colonia-opiniones.html", "Colonia Opiniones", "twin", "0.7"),
    ("/es-mx/mapraiders-opiniones.html", "MapRaiders Opiniones Hub", "hub", "0.8"),
]
for slug, name, t, p in ESMX:
    PAGES.append((slug, name, "es-MX", t, p))

# EN-IN (15)
ENIN = [
    ("/en-in/pokemon-go-alternative-free-india.html", "PG Alt Free India", "killer", "0.9"),
    ("/en-in/games-like-pokemon-go-india.html", "Games Like PG India", "killer", "1.0"),  # Volume-King
    ("/en-in/territory-game-india.html", "Territory Game India", "killer", "0.9"),
    ("/en-in/games-for-low-end-android.html", "Games Low-End Android", "killer", "0.9"),
    ("/en-in/walking-app-with-game-india.html", "Walking App India", "killer", "0.9"),
    ("/en-in/treasure-hunt-app-india.html", "Treasure Hunt India", "killer", "0.9"),
    ("/en-in/cricket-fan-map-app.html", "Cricket Fan Map", "killer", "0.9"),
    ("/en-in/pokemon-go-alternative-reviews-india.html", "PG Alt Reviews India", "twin", "0.7"),
    ("/en-in/games-like-pokemon-go-reviews-india.html", "Games Like PG Reviews India", "twin", "0.7"),
    ("/en-in/territory-game-reviews-india.html", "Territory Reviews India", "twin", "0.7"),
    ("/en-in/games-for-low-end-android-reviews.html", "Low-End Reviews", "twin", "0.7"),
    ("/en-in/walking-app-reviews-india.html", "Walking App Reviews India", "twin", "0.7"),
    ("/en-in/treasure-hunt-reviews-india.html", "Treasure Hunt Reviews India", "twin", "0.7"),
    ("/en-in/cricket-fan-reviews-india.html", "Cricket Fan Reviews", "twin", "0.7"),
    ("/en-in/mapraiders-reviews-india.html", "MapRaiders Reviews India Hub", "hub", "0.8"),
]
for slug, name, t, p in ENIN:
    PAGES.append((slug, name, "en-IN", t, p))

# ID (15)
ID = [
    ("/id/permainan-teritori.html", "Permainan Teritori", "killer", "0.9"),
    ("/id/game-lokasi.html", "Game Lokasi", "killer", "1.0"),  # Volume-King
    ("/id/alternatif-pokemon-go-gratis.html", "Alt PG Gratis", "killer", "0.9"),
    ("/id/koin-jagat-alternatif.html", "Koin Jagat Alternatif", "killer", "0.9"),
    ("/id/aplikasi-jalan-kaki-game.html", "Aplikasi Jalan Kaki", "killer", "0.9"),
    ("/id/harta-karun-aplikasi.html", "Harta Karun Aplikasi", "killer", "0.9"),
    ("/id/permainan-ramadan.html", "Permainan Ramadan", "killer", "0.9"),
    ("/id/permainan-teritori-ulasan.html", "Teritori Ulasan", "twin", "0.7"),
    ("/id/game-lokasi-ulasan.html", "Lokasi Ulasan", "twin", "0.7"),
    ("/id/alternatif-pokemon-go-gratis-ulasan.html", "Alt PG Ulasan", "twin", "0.7"),
    ("/id/koin-jagat-alternatif-ulasan.html", "Koin Jagat Ulasan", "twin", "0.7"),
    ("/id/aplikasi-jalan-kaki-game-ulasan.html", "Jalan Kaki Ulasan", "twin", "0.7"),
    ("/id/harta-karun-aplikasi-ulasan.html", "Harta Karun Ulasan", "twin", "0.7"),
    ("/id/permainan-ramadan-ulasan.html", "Ramadan Ulasan", "twin", "0.7"),
    ("/id/mapraiders-ulasan.html", "MapRaiders Ulasan Hub", "hub", "0.8"),
]
for slug, name, t, p in ID:
    PAGES.append((slug, name, "id", t, p))

# AR (15)
AR = [
    ("/ar/territory-game.html", "لعبة المنطقة", "killer", "0.9"),
    ("/ar/location-game.html", "لعبة موقع", "killer", "1.0"),  # Volume-King
    ("/ar/pokemon-go-mukamil.html", "بوكيمون جو مكمل", "killer", "0.9"),
    ("/ar/lo3bat-ramadan.html", "لعبة رمضان", "killer", "0.9"),
    ("/ar/tatbeeq-mashy-3a2ila.html", "تطبيق المشي للعائلة", "killer", "0.9"),
    ("/ar/lo3bat-bahth-kanz.html", "لعبة البحث عن الكنز", "killer", "0.9"),
    ("/ar/lo3bat-2030.html", "ألعاب رؤية 2030", "killer", "0.9"),
    ("/ar/territory-game-tajriba.html", "Territory Tajriba", "twin", "0.7"),
    ("/ar/location-game-tajriba.html", "Location Tajriba", "twin", "0.7"),
    ("/ar/pokemon-go-mukamil-tajriba.html", "Mukamil Tajriba", "twin", "0.7"),
    ("/ar/lo3bat-ramadan-tajriba.html", "Ramadan Tajriba", "twin", "0.7"),
    ("/ar/tatbeeq-mashy-3a2ila-tajriba.html", "Mashy Tajriba", "twin", "0.7"),
    ("/ar/lo3bat-bahth-kanz-tajriba.html", "Bahth Kanz Tajriba", "twin", "0.7"),
    ("/ar/lo3bat-2030-tajriba.html", "2030 Tajriba", "twin", "0.7"),
    ("/ar/MapRaiders-tajriba.html", "MapRaiders Tajriba Hub", "hub", "0.8"),
]
for slug, name, t, p in AR:
    PAGES.append((slug, name, "ar", t, p))

# FR (15)
FR = [
    ("/fr/jeu-territoire.html", "Jeu Territoire", "killer", "0.9"),
    ("/fr/jeu-geolocalise.html", "Jeu Géolocalisé", "killer", "0.9"),
    ("/fr/alternative-pokemon-go-gratuit.html", "Alt PG Gratuit", "killer", "0.9"),
    ("/fr/pokemon-go-saudi-alternative.html", "PG Saudi Alternative", "killer", "0.9"),
    ("/fr/application-marche-avec-jeu.html", "App Marche", "killer", "0.9"),
    ("/fr/chasse-au-tresor-application.html", "Chasse au Trésor", "killer", "1.0"),  # Volume-King
    ("/fr/woog-alternative.html", "Woog Alternative", "killer", "0.9"),
    ("/fr/jeu-territoire-avis.html", "Territoire Avis", "twin", "0.7"),
    ("/fr/jeu-geolocalise-avis.html", "Géolocalisé Avis", "twin", "0.7"),
    ("/fr/alternative-pokemon-go-avis.html", "Alt PG Avis", "twin", "0.7"),
    ("/fr/pokemon-go-saudi-avis.html", "PG Saudi Avis", "twin", "0.7"),
    ("/fr/application-marche-avis.html", "Marche Avis", "twin", "0.7"),
    ("/fr/chasse-au-tresor-avis.html", "Chasse au Trésor Avis", "twin", "0.7"),
    ("/fr/woog-alternative-avis.html", "Woog Alt Avis", "twin", "0.7"),
    ("/fr/mapraiders-avis.html", "MapRaiders Avis Hub", "hub", "0.8"),
]
for slug, name, t, p in FR:
    PAGES.append((slug, name, "fr", t, p))

# IT (15)
IT = [
    ("/it/gioco-territorio.html", "Gioco Territorio", "killer", "0.9"),
    ("/it/gioco-geolocalizzazione.html", "Gioco Geolocalizzazione", "killer", "0.9"),
    ("/it/alternativa-pokemon-go-gratis.html", "Alt PG Gratis", "killer", "0.9"),
    ("/it/pokemon-go-saudi-alternativa.html", "PG Saudi Alternativa", "killer", "0.9"),
    ("/it/app-camminata-con-gioco.html", "App Camminata", "killer", "0.9"),
    ("/it/caccia-al-tesoro-app-italia.html", "Caccia al Tesoro Italia", "killer", "1.0"),  # Volume-King!
    ("/it/gaiasmart-alternativa.html", "GaiaSmart Alternativa", "killer", "0.9"),
    ("/it/gioco-territorio-recensioni.html", "Territorio Recensioni", "twin", "0.7"),
    ("/it/gioco-geolocalizzazione-recensioni.html", "Geolocalizzazione Recensioni", "twin", "0.7"),
    ("/it/alternativa-pokemon-go-gratis-recensioni.html", "Alt PG Recensioni", "twin", "0.7"),
    ("/it/pokemon-go-saudi-alternativa-recensioni.html", "PG Saudi Recensioni", "twin", "0.7"),
    ("/it/app-camminata-con-gioco-recensioni.html", "Camminata Recensioni", "twin", "0.7"),
    ("/it/caccia-al-tesoro-app-italia-recensioni.html", "Caccia al Tesoro Recensioni", "twin", "0.7"),
    ("/it/gaiasmart-alternativa-recensioni.html", "GaiaSmart Recensioni", "twin", "0.7"),
    ("/it/mapraiders-recensioni.html", "MapRaiders Recensioni Hub", "hub", "0.8"),
]
for slug, name, t, p in IT:
    PAGES.append((slug, name, "it", t, p))

# ZH-TW (15)
ZHTW = [
    ("/zh-tw/領地遊戲.html", "領地遊戲", "killer", "0.9"),
    ("/zh-tw/位置遊戲.html", "位置遊戲", "killer", "0.9"),
    ("/zh-tw/Pokemon-GO替代免費.html", "PG替代免費", "killer", "0.9"),
    ("/zh-tw/Pokemon-GO沙特問題.html", "PG沙特問題", "killer", "0.9"),
    ("/zh-tw/夜市散步應用程式.html", "夜市散步", "killer", "0.9"),
    ("/zh-tw/尋寶遊戲應用程式.html", "尋寶遊戲", "killer", "1.0"),  # Volume-King
    ("/zh-tw/香港行山應用程式.html", "香港行山", "killer", "0.9"),
    ("/zh-tw/領地遊戲-評價.html", "領地評價", "twin", "0.7"),
    ("/zh-tw/位置遊戲-心得.html", "位置心得", "twin", "0.7"),
    ("/zh-tw/Pokemon-GO替代免費-評價.html", "PG替代評價", "twin", "0.7"),
    ("/zh-tw/Pokemon-GO沙特問題-評價.html", "PG沙特評價", "twin", "0.7"),
    ("/zh-tw/夜市散步應用程式-心得.html", "夜市心得", "twin", "0.7"),
    ("/zh-tw/尋寶遊戲應用程式-評價.html", "尋寶評價", "twin", "0.7"),
    ("/zh-tw/香港行山應用程式-心得.html", "香港行山心得", "twin", "0.7"),
    ("/zh-tw/MapRaiders-評價.html", "MapRaiders 評價 Hub", "hub", "0.8"),
]
for slug, name, t, p in ZHTW:
    PAGES.append((slug, name, "zh-TW", t, p))

# HI (15)
HI = [
    ("/hi/territory-game.html", "क्षेत्र खेल", "killer", "0.9"),
    ("/hi/location-game.html", "स्थान आधारित खेल", "killer", "1.0"),  # Volume-King
    ("/hi/pokemon-go-alternative-free.html", "PG विकल्प मुफ्त", "killer", "0.9"),
    ("/hi/mohalla-game.html", "मोहल्ला खेल", "killer", "0.9"),
    ("/hi/walking-app-with-game.html", "टहलने का ऐप", "killer", "0.9"),
    ("/hi/treasure-hunt-app.html", "खजाना खोज ऐप", "killer", "0.9"),
    ("/hi/cricket-fan-app.html", "क्रिकेट fan ऐप", "killer", "0.9"),
    ("/hi/territory-game-samiksha.html", "क्षेत्र समीक्षा", "twin", "0.7"),
    ("/hi/location-game-kaisa-hai.html", "स्थान कैसा है", "twin", "0.7"),
    ("/hi/pokemon-go-alternative-samiksha.html", "PG समीक्षा", "twin", "0.7"),
    ("/hi/mohalla-game-samiksha.html", "मोहल्ला समीक्षा", "twin", "0.7"),
    ("/hi/walking-app-kaisa-hai.html", "टहलने कैसा", "twin", "0.7"),
    ("/hi/treasure-hunt-samiksha.html", "खजाना समीक्षा", "twin", "0.7"),
    ("/hi/cricket-fan-kaisa-hai.html", "क्रिकेट कैसा", "twin", "0.7"),
    ("/hi/mapraiders-samiksha.html", "MapRaiders समीक्षाएँ Hub", "hub", "0.8"),
]
for slug, name, t, p in HI:
    PAGES.append((slug, name, "hi", t, p))

# RU (15)
RU = [
    ("/ru/igra-territoriy.html", "Игра территорий", "killer", "0.9"),
    ("/ru/geo-igra.html", "Гео-игра", "killer", "1.0"),  # Volume-King
    ("/ru/zamenitel-pokemon-go.html", "Заменитель Pokémon GO", "killer", "0.9"),
    ("/ru/draconius-go-alternativa.html", "Draconius Go альтернатива", "killer", "0.9"),
    ("/ru/prilozhenie-progulki-s-igroy.html", "Приложение прогулки", "killer", "0.9"),
    ("/ru/iskat-klad-prilozhenie.html", "Искать клад приложение", "killer", "0.9"),
    ("/ru/pokemon-go-saudi-alternativa.html", "PG Saudi альтернатива", "killer", "0.9"),
    ("/ru/igra-territoriy-otzyvy.html", "Игра территорий отзывы", "twin", "0.7"),
    ("/ru/geo-igra-otzyvy.html", "Гео-игра отзывы", "twin", "0.7"),
    ("/ru/zamenitel-pokemon-go-otzyvy.html", "Заменитель отзывы", "twin", "0.7"),
    ("/ru/draconius-go-alternativa-otzyvy.html", "Draconius отзывы", "twin", "0.7"),
    ("/ru/prilozhenie-progulki-s-igroy-otzyvy.html", "Прогулки отзывы", "twin", "0.7"),
    ("/ru/iskat-klad-prilozhenie-otzyvy.html", "Клад отзывы", "twin", "0.7"),
    ("/ru/pokemon-go-saudi-alternativa-otzyvy.html", "Saudi отзывы", "twin", "0.7"),
    ("/ru/mapraiders-otzyvy.html", "MapRaiders отзывы Hub", "hub", "0.8"),
]
for slug, name, t, p in RU:
    PAGES.append((slug, name, "ru", t, p))

# ZH-CN (15)
ZHCN = [
    ("/zh-cn/领地游戏.html", "领地游戏", "killer", "0.9"),
    ("/zh-cn/位置游戏.html", "位置游戏", "killer", "0.9"),
    ("/zh-cn/Pokemon-GO替代免费.html", "PG替代免费", "killer", "0.9"),
    ("/zh-cn/无VPN位置游戏.html", "无VPN位置游戏", "killer", "0.9"),
    ("/zh-cn/散步游戏化App.html", "散步游戏化", "killer", "0.9"),
    ("/zh-cn/寻宝游戏App.html", "寻宝游戏", "killer", "1.0"),  # Volume-King
    ("/zh-cn/量子计划替代.html", "量子计划替代", "killer", "0.9"),
    ("/zh-cn/领地游戏-评价.html", "领地评价", "twin", "0.7"),
    ("/zh-cn/位置游戏-评价.html", "位置评价", "twin", "0.7"),
    ("/zh-cn/Pokemon-GO替代免费-评价.html", "PG替代评价", "twin", "0.7"),
    ("/zh-cn/无VPN位置游戏-评价.html", "无VPN评价", "twin", "0.7"),
    ("/zh-cn/散步App-值得吗.html", "散步值得吗", "twin", "0.7"),
    ("/zh-cn/寻宝游戏App-评价.html", "寻宝评价", "twin", "0.7"),
    ("/zh-cn/量子计划替代-评价.html", "量子评价", "twin", "0.7"),
    ("/zh-cn/MapRaiders-评价.html", "MapRaiders 评价 Hub", "hub", "0.8"),
]
for slug, name, t, p in ZHCN:
    PAGES.append((slug, name, "zh-CN", t, p))


def gen_sitemap_phase1():
    """Erstelle sitemap-phase1.xml mit allen 240 URLs."""
    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for slug, name, lang, ptype, prio in PAGES:
        url = SITE + slug
        # URL-encode non-ASCII chars in path
        safe_url = SITE + quote(slug, safe="/.-")
        parts.append(f"  <url>\n    <loc>{safe_url}</loc>\n    <lastmod>{TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>{prio}</priority>\n  </url>")
    parts.append('</urlset>\n')
    out = ROOT / "sitemap-phase1.xml"
    out.write_text("\n".join(parts), encoding="utf-8")
    print(f"  [OK] sitemap-phase1.xml ({len(PAGES)} URLs)")


def update_sitemap_index():
    """Update sitemap-index.xml: füge sitemap-phase1.xml hinzu, ergänze fehlende Sprach-Sitemaps."""
    locales = ["de", "en", "fr", "es", "it", "pt", "tr", "ru", "ja", "ko", "zh", "ar", "hi"]
    new_locales = ["es-mx", "pt-br", "zh-cn", "zh-tw", "en-in", "id"]
    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    parts.append(f"  <sitemap>\n    <loc>{SITE}/sitemap.xml</loc>\n    <lastmod>{TODAY}</lastmod>\n  </sitemap>")
    parts.append(f"  <sitemap>\n    <loc>{SITE}/sitemap-phase1.xml</loc>\n    <lastmod>{TODAY}</lastmod>\n  </sitemap>")
    for loc in locales:
        sitefile = ROOT / f"sitemap-{loc}.xml"
        if sitefile.exists():
            parts.append(f"  <sitemap>\n    <loc>{SITE}/sitemap-{loc}.xml</loc>\n    <lastmod>{TODAY}</lastmod>\n  </sitemap>")
    parts.append('</sitemapindex>\n')
    out = ROOT / "sitemap-index.xml"
    out.write_text("\n".join(parts), encoding="utf-8")
    print(f"  [OK] sitemap-index.xml updated")


def gen_submission_md():
    """Erstelle GSC_SUBMISSION_LIST.md mit Priorisierung für GSC Request-Indexing."""
    lines = ["# Google Search Console — Submission List Phase 1",
             "",
             f"**Generiert:** {TODAY}",
             f"**Total:** {len(PAGES)} URLs (16 Sprachen × 15 Pages)",
             "",
             "## Schritt 1 — Sitemap einreichen (1× pro Property)",
             "",
             "**In GSC → Sitemaps → \"Add a new sitemap\":**",
             "",
             "```",
             f"{SITE}/sitemap-index.xml",
             "```",
             "",
             "Das reicht — Google findet alle 240 + bestehende Pages über den Index.",
             "",
             "## Schritt 2 — Priority Request-Indexing (max 10/Tag)",
             "",
             "Für die wichtigsten Pages **\"URL Inspection\" → \"Request Indexing\"** in GSC.",
             "Beginne mit den Volume-Kings (höchstes Such-Volumen pro Markt):",
             "",
             "### Tag 1 — Volume-Kings (Tier 1)",
             "",
             "| # | Sprache | URL | Vol/Mo |",
             "|---|---|---|---|"]
    vol_kings = [
        ("EN", "/en/games-like-pokemon-go.html", "30.000-45.000"),
        ("JA", "/ja/位置情報ゲーム.html", "15.000-25.000"),
        ("ZH-CN", "/zh-cn/寻宝游戏App.html", "4.000-6.000"),
        ("HI", "/hi/location-game.html", "1.500-2.500"),
        ("KO", "/ko/위치기반게임.html", "5.000-8.000"),
        ("PT-BR", "/pt-br/jogo-de-gps.html", "5.000-8.000"),
        ("ES-MX", "/es-mx/juego-de-gps.html", "5.000-8.000"),
        ("EN-IN", "/en-in/games-like-pokemon-go-india.html", "8.000-12.000"),
        ("IT", "/it/caccia-al-tesoro-app-italia.html", "6.000-10.000"),
        ("FR", "/fr/chasse-au-tresor-application.html", "4.000-6.000"),
    ]
    for i, (lang, slug, vol) in enumerate(vol_kings, 1):
        lines.append(f"| {i} | **{lang}** | `{SITE}{slug}` | {vol} |")
    lines.extend([
        "",
        "### Tag 2 — Volume-Kings (Tier 2 + Hubs)",
        "",
        "| # | Sprache | URL | Typ |",
        "|---|---|---|---|",
    ])
    tag2 = [
        ("DE", "/spiele-wie-pokemon-go.html", "Killer 4-6K"),
        ("AR", "/ar/location-game.html", "Killer 1.5-2.5K"),
        ("RU", "/ru/geo-igra.html", "Killer 1.5-2.5K"),
        ("TR", "/tr/hazine-avi-uygulamasi.html", "Killer 2-3.5K"),
        ("ZH-TW", "/zh-tw/尋寶遊戲應用程式.html", "Killer 3-5K"),
        ("ID", "/id/game-lokasi.html", "Killer 2-3.5K"),
        ("DE", "/mapraiders-erfahrungen.html", "Hub"),
        ("EN", "/en/mapraiders-reviews.html", "Hub"),
        ("HI", "/hi/mohalla-game.html", "HI-EXKLUSIV"),
        ("EN-IN", "/en-in/cricket-fan-map-app.html", "IN-EXKLUSIV"),
    ]
    for i, (lang, slug, t) in enumerate(tag2, 1):
        lines.append(f"| {i} | **{lang}** | `{SITE}{slug}` | {t} |")
    lines.extend([
        "",
        "### Tag 3+ — Restliche Killer (priorisiert nach Markt)",
        "",
        "Nutze `sitemap-phase1.xml` damit Google den Rest organisch crawlt.",
        "",
        "## Schritt 3 — Bing Webmaster Tools",
        "",
        "Gleiches Procedure: `https://www.bing.com/webmasters` → Sitemap einreichen.",
        "",
        "## Komplette URL-Liste (alle 240 nach Sprache)",
        ""
    ])
    by_lang = {}
    for slug, name, lang, ptype, prio in PAGES:
        by_lang.setdefault(lang, []).append((slug, name, ptype, prio))
    for lang in ["de", "en", "ja", "ko", "pt-BR", "tr", "es-MX", "en-IN", "id", "ar", "fr", "it", "zh-TW", "hi", "ru", "zh-CN"]:
        if lang not in by_lang:
            continue
        lines.append(f"### {lang.upper()} ({len(by_lang[lang])} URLs)")
        lines.append("")
        for slug, name, ptype, prio in by_lang[lang]:
            badge = {"killer": "🎯", "twin": "📝", "hub": "🏠"}[ptype]
            lines.append(f"- {badge} `{SITE}{slug}` — {name}")
        lines.append("")
    out = ROOT.parent / "seo-strategy" / "GSC_SUBMISSION_LIST.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"  [OK] {out.relative_to(ROOT.parent)}")


def main():
    print(f"=== Generate Phase 1 Sitemap + GSC Submission List ===")
    gen_sitemap_phase1()
    update_sitemap_index()
    gen_submission_md()
    print(f"\n[OK] {len(PAGES)} URLs in Sitemap")
    print(f"[OK] Submission-Markdown: seo-strategy/GSC_SUBMISSION_LIST.md")


if __name__ == "__main__":
    main()

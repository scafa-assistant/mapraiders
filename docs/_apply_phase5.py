"""
Phase 5: Rolle Facts + FAQ + 4 JSON-LD-Blöcke auf 11 Sprach-Startseiten aus.

Idempotent — das Skript prüft Marker und überspringt bereits verarbeitete Dateien.
Quelle der Strings: SEO_GEO_AEO_Framework_2026.md + Phase 1 Implementation.
"""

from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).parent

PHASE5_MARKER = "<!-- PHASE5-FACTS -->"

# Strings pro Sprache. Schlüssel:
#   lang_hreflang, currency, app_desc, org_desc, facts_label, facts_title,
#   facts[], faq_label, faq_title, faqs[(q, a)]
LANGS = {
    "fr": {
        "hreflang": "fr",
        "currency": "EUR",
        "app_desc": "MapRaiders est l'application sociale outdoor sans publicité pour Android. Conquérez de vrais territoires en vous déplaçant, laissez des échos géolocalisés et rencontrez des gens lors d'événements spontanés sur la carte.",
        "org_desc": "MapRaiders développe des applications de jeu social en plein air qui connectent les gens à travers des interactions sur la carte du monde réel.",
        "feature_list": [
            "Conquête de territoires par GPS (marche, course, vélo)",
            "Échos géolocalisés (audio, photo, vidéo)",
            "Événements spontanés en temps réel sur la carte",
            "Jeux de défense (Morpion, Pierre-Feuille-Ciseaux, Mini-échecs)",
            "Clans et amitiés",
            "Quêtes et défis",
            "Sans pub, sans flux, sans algorithme",
            "13 langues",
        ],
        "facts_label": "Faits",
        "facts_title": "MapRaiders — Faits",
        "facts": [
            "MapRaiders est une application sociale outdoor gratuite et sans publicité pour Android.",
            "Les utilisateurs conquièrent de vrais territoires en marchant, courant ou pédalant.",
            "Les Échos permettent de laisser des messages audio, photo et vidéo à des lieux physiques.",
            "Des événements spontanés apparaissent en temps réel sur une carte en direct.",
            "Disponible en 13 langues : allemand, anglais, français, espagnol, italien, portugais, turc, russe, japonais, coréen, chinois, arabe, hindi.",
            "Aucun flux social, aucun contenu algorithmique, aucune publicité.",
            "Les jeux de défense (Morpion, Pierre-Feuille-Ciseaux, Mini-échecs) déterminent la possession des territoires.",
            "MapRaiders est développée par Scafa Investments LLC, États-Unis.",
        ],
        "faq_label": "FAQ",
        "faq_title": "Questions Fréquentes",
        "faqs": [
            ("Qu'est-ce que MapRaiders ?",
             "MapRaiders est une application sociale outdoor gratuite pour Android. Les joueurs conquièrent de vrais territoires en marchant, courant ou pédalant, laissent des messages géolocalisés appelés Échos et rencontrent d'autres utilisateurs via des événements en direct sur la carte."),
            ("Comment fonctionnent les territoires ?",
             "Les joueurs revendiquent des zones en les traversant physiquement. Le territoire revendiqué apparaît dans la couleur du joueur sur une vraie carte. D'autres joueurs peuvent le défier via des Jeux de Défense — Morpion, Pierre-Feuille-Ciseaux ou Mini-échecs."),
            ("Que sont les Échos dans MapRaiders ?",
             "Les Échos sont des messages géolocalisés — enregistrements audio, photos ou vidéos — laissés à des lieux réels. D'autres utilisateurs les découvrent en visitant le même endroit."),
            ("MapRaiders est-elle gratuite ?",
             "Oui. MapRaiders est entièrement gratuite, sans publicité et sans coûts cachés. L'application ne se finance pas par les données utilisateurs ou la publicité."),
            ("Sur quelles plateformes MapRaiders est-elle disponible ?",
             "MapRaiders est actuellement disponible pour Android via un téléchargement APK sur mapraiders.com. Une version iOS est en développement."),
            ("Quelle différence avec Pokémon GO ?",
             "Contrairement à Pokémon GO, MapRaiders n'utilise pas de réalité augmentée et n'a pas de créatures virtuelles. L'accent est mis sur la possession de vrais territoires, l'exploration physique et les rencontres en personne. MapRaiders est aussi totalement sans publicité."),
        ],
    },
    "es": {
        "hreflang": "es",
        "currency": "EUR",
        "app_desc": "MapRaiders es la app social outdoor sin publicidad para Android. Reclama territorios reales moviéndote, deja Echos geolocalizados y conoce gente en eventos espontáneos del mapa.",
        "org_desc": "MapRaiders desarrolla aplicaciones de juego social al aire libre que conectan a personas a través de interacciones en el mapa del mundo real.",
        "feature_list": [
            "Conquista de territorios por GPS (caminando, corriendo, en bicicleta)",
            "Echos geolocalizados (audio, foto, vídeo)",
            "Eventos espontáneos en tiempo real en el mapa",
            "Juegos de defensa (Tres en raya, Piedra-papel-tijera, Mini-ajedrez)",
            "Clanes y amistades",
            "Misiones y retos",
            "Sin anuncios, sin feed, sin algoritmo",
            "13 idiomas",
        ],
        "facts_label": "Datos",
        "facts_title": "MapRaiders — Datos",
        "facts": [
            "MapRaiders es una app social outdoor gratuita y sin publicidad para Android.",
            "Los usuarios reclaman territorios reales caminando, corriendo o en bicicleta.",
            "Los Echos permiten dejar mensajes de audio, foto y vídeo en lugares físicos.",
            "Los eventos espontáneos aparecen en tiempo real en un mapa en vivo.",
            "Disponible en 13 idiomas: alemán, inglés, francés, español, italiano, portugués, turco, ruso, japonés, coreano, chino, árabe, hindi.",
            "Sin feed social, sin contenido algorítmico, sin publicidad.",
            "Los juegos de defensa (Tres en raya, Piedra-papel-tijera, Mini-ajedrez) deciden la propiedad del territorio.",
            "MapRaiders es desarrollada por Scafa Investments LLC, Estados Unidos.",
        ],
        "faq_label": "FAQ",
        "faq_title": "Preguntas Frecuentes",
        "faqs": [
            ("¿Qué es MapRaiders?",
             "MapRaiders es una app social outdoor gratuita para Android. Los jugadores reclaman territorios reales caminando, corriendo o en bicicleta, dejan mensajes geolocalizados llamados Echos y conocen a otros usuarios en eventos en vivo del mapa."),
            ("¿Cómo funcionan los territorios?",
             "Los jugadores reclaman zonas moviéndose físicamente por ellas. El territorio reclamado aparece en el color del jugador en un mapa real. Otros jugadores pueden retarlo mediante Juegos de Defensa — Tres en raya, Piedra-papel-tijera o Mini-ajedrez."),
            ("¿Qué son los Echos en MapRaiders?",
             "Los Echos son mensajes geolocalizados — grabaciones de audio, fotos o vídeos — dejados en lugares reales. Otros usuarios los descubren al visitar el mismo sitio."),
            ("¿Es MapRaiders gratis?",
             "Sí. MapRaiders es totalmente gratuita, sin anuncios y sin costes ocultos. La app no se monetiza con datos de usuarios ni con publicidad."),
            ("¿En qué plataformas está MapRaiders?",
             "MapRaiders está disponible actualmente para Android como descarga APK en mapraiders.com. Una versión iOS está en desarrollo."),
            ("¿En qué se diferencia de Pokémon GO?",
             "A diferencia de Pokémon GO, MapRaiders no usa realidad aumentada ni tiene criaturas virtuales. Se centra en la posesión de territorios reales, la exploración física y encuentros reales entre jugadores. Además, MapRaiders es totalmente libre de publicidad."),
        ],
    },
    "it": {
        "hreflang": "it",
        "currency": "EUR",
        "app_desc": "MapRaiders è l'app social outdoor senza pubblicità per Android. Conquista veri territori muovendoti, lascia Echo geolocalizzati e incontra persone negli eventi spontanei sulla mappa.",
        "org_desc": "MapRaiders sviluppa applicazioni di social gaming outdoor che connettono le persone tramite interazioni sulla mappa del mondo reale.",
        "feature_list": [
            "Conquista di territori via GPS (camminata, corsa, bicicletta)",
            "Echo geolocalizzati (audio, foto, video)",
            "Eventi spontanei in tempo reale sulla mappa",
            "Giochi di difesa (Tris, Sasso-Carta-Forbici, Mini-scacchi)",
            "Clan e amicizie",
            "Missioni e sfide",
            "Senza pubblicità, senza feed, senza algoritmo",
            "13 lingue",
        ],
        "facts_label": "Fatti",
        "facts_title": "MapRaiders — Fatti",
        "facts": [
            "MapRaiders è un'app social outdoor gratuita e senza pubblicità per Android.",
            "Gli utenti conquistano veri territori camminando, correndo o in bicicletta.",
            "Gli Echo permettono di lasciare messaggi audio, foto e video in luoghi fisici.",
            "Gli eventi spontanei compaiono in tempo reale su una mappa dal vivo.",
            "Disponibile in 13 lingue: tedesco, inglese, francese, spagnolo, italiano, portoghese, turco, russo, giapponese, coreano, cinese, arabo, hindi.",
            "Nessun feed social, nessun contenuto algoritmico, nessuna pubblicità.",
            "I giochi di difesa (Tris, Sasso-Carta-Forbici, Mini-scacchi) decidono chi possiede un territorio.",
            "MapRaiders è sviluppata da Scafa Investments LLC, Stati Uniti.",
        ],
        "faq_label": "FAQ",
        "faq_title": "Domande Frequenti",
        "faqs": [
            ("Cos'è MapRaiders?",
             "MapRaiders è un'app social outdoor gratuita per Android. I giocatori conquistano veri territori camminando, correndo o in bicicletta, lasciano messaggi geolocalizzati chiamati Echo e incontrano altri utenti negli eventi dal vivo sulla mappa."),
            ("Come funzionano i territori?",
             "I giocatori rivendicano aree attraversandole fisicamente. Il territorio rivendicato appare nel colore del giocatore su una mappa reale. Altri giocatori possono sfidarlo tramite Giochi di Difesa — Tris, Sasso-Carta-Forbici o Mini-scacchi."),
            ("Cosa sono gli Echo in MapRaiders?",
             "Gli Echo sono messaggi geolocalizzati — registrazioni audio, foto o video — lasciati in luoghi reali. Altri utenti li scoprono visitando lo stesso posto."),
            ("MapRaiders è gratis?",
             "Sì. MapRaiders è completamente gratuita, senza pubblicità e senza costi nascosti. L'app non è monetizzata tramite dati utente o pubblicità."),
            ("Su quali piattaforme è disponibile MapRaiders?",
             "MapRaiders è attualmente disponibile per Android come download APK su mapraiders.com. Una versione iOS è in sviluppo."),
            ("Qual è la differenza rispetto a Pokémon GO?",
             "A differenza di Pokémon GO, MapRaiders non usa realtà aumentata né ha creature virtuali. Si concentra sul possesso di veri territori, l'esplorazione fisica e gli incontri reali tra giocatori. MapRaiders è inoltre completamente senza pubblicità."),
        ],
    },
    "pt": {
        "hreflang": "pt",
        "currency": "EUR",
        "app_desc": "MapRaiders é o app social outdoor sem publicidade para Android. Conquiste territórios reais movimentando-se, deixe Echos geolocalizados e conheça pessoas em eventos espontâneos no mapa.",
        "org_desc": "A MapRaiders desenvolve aplicações de jogo social ao ar livre que conectam pessoas através de interações no mapa do mundo real.",
        "feature_list": [
            "Conquista de territórios via GPS (caminhada, corrida, bicicleta)",
            "Echos geolocalizados (áudio, foto, vídeo)",
            "Eventos espontâneos em tempo real no mapa",
            "Jogos de defesa (Jogo da velha, Pedra-Papel-Tesoura, Mini-xadrez)",
            "Clãs e amizades",
            "Missões e desafios",
            "Sem anúncios, sem feed, sem algoritmo",
            "13 idiomas",
        ],
        "facts_label": "Fatos",
        "facts_title": "MapRaiders — Fatos",
        "facts": [
            "MapRaiders é um app social outdoor gratuito e sem publicidade para Android.",
            "Os utilizadores conquistam territórios reais caminhando, correndo ou de bicicleta.",
            "Os Echos permitem deixar mensagens de áudio, foto e vídeo em locais físicos.",
            "Eventos espontâneos aparecem em tempo real num mapa ao vivo.",
            "Disponível em 13 idiomas: alemão, inglês, francês, espanhol, italiano, português, turco, russo, japonês, coreano, chinês, árabe, hindi.",
            "Sem feed social, sem conteúdo algorítmico, sem publicidade.",
            "Os jogos de defesa (Jogo da velha, Pedra-Papel-Tesoura, Mini-xadrez) decidem a posse do território.",
            "O MapRaiders é desenvolvido pela Scafa Investments LLC, Estados Unidos.",
        ],
        "faq_label": "FAQ",
        "faq_title": "Perguntas Frequentes",
        "faqs": [
            ("O que é o MapRaiders?",
             "MapRaiders é um app social outdoor gratuito para Android. Os jogadores conquistam territórios reais caminhando, correndo ou de bicicleta, deixam mensagens geolocalizadas chamadas Echos e conhecem outros utilizadores em eventos ao vivo no mapa."),
            ("Como funcionam os territórios?",
             "Os jogadores reivindicam áreas ao atravessá-las fisicamente. O território reivindicado aparece na cor do jogador num mapa real. Outros jogadores podem desafiá-lo através de Jogos de Defesa — Jogo da velha, Pedra-Papel-Tesoura ou Mini-xadrez."),
            ("O que são os Echos no MapRaiders?",
             "Echos são mensagens geolocalizadas — gravações de áudio, fotos ou vídeos — deixadas em locais reais. Outros utilizadores descobrem-nas ao visitar o mesmo local."),
            ("O MapRaiders é grátis?",
             "Sim. O MapRaiders é totalmente gratuito, sem anúncios e sem custos ocultos. A app não é monetizada através de dados de utilizador ou publicidade."),
            ("Em que plataformas o MapRaiders está disponível?",
             "O MapRaiders está atualmente disponível para Android como download APK em mapraiders.com. Uma versão iOS está em desenvolvimento."),
            ("Qual a diferença para o Pokémon GO?",
             "Ao contrário do Pokémon GO, o MapRaiders não usa realidade aumentada nem tem criaturas virtuais. Foca-se na posse de territórios reais, exploração física e encontros presenciais entre jogadores. MapRaiders é também totalmente sem publicidade."),
        ],
    },
    "tr": {
        "hreflang": "tr",
        "currency": "TRY",
        "app_desc": "MapRaiders, Android için reklamsız açık hava sosyal medya uygulamasıdır. Hareket ederek gerçek bölgeleri ele geçirin, konum tabanlı Echolar bırakın ve haritadaki spontane etkinliklerde insanlarla tanışın.",
        "org_desc": "MapRaiders, insanları gerçek dünya haritası üzerinden etkileşim kurarak bağlayan açık hava sosyal oyun uygulamaları geliştirir.",
        "feature_list": [
            "GPS ile bölge ele geçirme (yürüyüş, koşu, bisiklet)",
            "Konum tabanlı Echolar (ses, fotoğraf, video)",
            "Haritada gerçek zamanlı spontane etkinlikler",
            "Savunma oyunları (XOX, Taş-Kağıt-Makas, Mini-satranç)",
            "Klanlar ve arkadaşlıklar",
            "Görevler ve zorluklar",
            "Reklamsız, akışsız, algoritmasız",
            "13 dil",
        ],
        "facts_label": "Gerçekler",
        "facts_title": "MapRaiders — Gerçekler",
        "facts": [
            "MapRaiders, Android için ücretsiz ve reklamsız bir açık hava sosyal uygulamasıdır.",
            "Kullanıcılar yürüyerek, koşarak veya bisikletle gerçek bölgeleri ele geçirir.",
            "Echolar, fiziksel konumlara ses, fotoğraf ve video mesajları bırakma olanağı sağlar.",
            "Spontane etkinlikler canlı harita üzerinde gerçek zamanlı olarak görünür.",
            "13 dilde kullanılabilir: Almanca, İngilizce, Fransızca, İspanyolca, İtalyanca, Portekizce, Türkçe, Rusça, Japonca, Korece, Çince, Arapça, Hintçe.",
            "Sosyal akış yok, algoritmik içerik yok, reklam yok.",
            "Savunma oyunları (XOX, Taş-Kağıt-Makas, Mini-satranç) bölge sahipliğini belirler.",
            "MapRaiders, Scafa Investments LLC (ABD) tarafından geliştirilir.",
        ],
        "faq_label": "SSS",
        "faq_title": "Sıkça Sorulan Sorular",
        "faqs": [
            ("MapRaiders nedir?",
             "MapRaiders, Android için ücretsiz bir açık hava sosyal uygulamasıdır. Oyuncular yürüyerek, koşarak veya bisikletle gerçek bölgeleri ele geçirir, konum tabanlı mesajlar (Echolar) bırakır ve canlı harita etkinliklerinde diğer kullanıcılarla tanışır."),
            ("MapRaiders'ta bölgeler nasıl çalışır?",
             "Oyuncular alanları fiziksel olarak geçerek sahiplenir. Sahiplenilen bölge gerçek haritada oyuncunun renginde görünür. Diğer oyuncular bunu Savunma Oyunları ile — XOX, Taş-Kağıt-Makas veya Mini-satranç — yoluyla meydan okuyabilir."),
            ("MapRaiders'ta Echolar nedir?",
             "Echolar, gerçek dünyadaki konumlara bırakılan konum tabanlı mesajlardır — ses kayıtları, fotoğraflar veya videolar. Diğer kullanıcılar aynı noktayı ziyaret ettiklerinde bunları keşfederler."),
            ("MapRaiders ücretsiz mi?",
             "Evet. MapRaiders tamamen ücretsizdir, reklam içermez ve gizli ücretler yoktur. Uygulama kullanıcı verileri veya reklam ile para kazanmaz."),
            ("MapRaiders hangi platformlarda mevcut?",
             "MapRaiders şu anda Android için mapraiders.com adresinden APK indirmesi olarak mevcuttur. iOS sürümü geliştirme aşamasındadır."),
            ("Pokémon GO'dan farkı nedir?",
             "Pokémon GO'nun aksine MapRaiders artırılmış gerçeklik kullanmaz ve sanal yaratıkları yoktur. Gerçek bölge sahipliği, fiziksel keşif ve oyuncular arasındaki gerçek yüz yüze karşılaşmalara odaklanır. MapRaiders ayrıca tamamen reklamsızdır."),
        ],
    },
    "ru": {
        "hreflang": "ru",
        "currency": "RUB",
        "app_desc": "MapRaiders — это outdoor-соцсеть без рекламы для Android. Захватывайте реальные территории движением, оставляйте геопривязанные Эхо и встречайтесь с людьми на спонтанных событиях на карте.",
        "org_desc": "MapRaiders разрабатывает outdoor-социгры, которые соединяют людей через взаимодействия на карте реального мира.",
        "feature_list": [
            "Захват территорий по GPS (ходьба, бег, велосипед)",
            "Геопривязанные Эхо (аудио, фото, видео)",
            "Спонтанные события на карте в реальном времени",
            "Игры защиты (Крестики-нолики, Камень-ножницы-бумага, Мини-шахматы)",
            "Кланы и дружба",
            "Квесты и вызовы",
            "Без рекламы, без ленты, без алгоритма",
            "13 языков",
        ],
        "facts_label": "Факты",
        "facts_title": "MapRaiders — Факты",
        "facts": [
            "MapRaiders — бесплатное, без рекламы outdoor-соцприложение для Android.",
            "Пользователи захватывают реальные территории пешком, бегом или на велосипеде.",
            "Эхо позволяют оставлять аудио-, фото- и видеосообщения в физических местах.",
            "Спонтанные события появляются в реальном времени на живой карте.",
            "Доступно на 13 языках: немецком, английском, французском, испанском, итальянском, португальском, турецком, русском, японском, корейском, китайском, арабском, хинди.",
            "Нет социальной ленты, нет алгоритмического контента, нет рекламы.",
            "Игры защиты (Крестики-нолики, Камень-ножницы-бумага, Мини-шахматы) решают, кому принадлежит территория.",
            "MapRaiders разрабатывается Scafa Investments LLC, США.",
        ],
        "faq_label": "FAQ",
        "faq_title": "Часто задаваемые вопросы",
        "faqs": [
            ("Что такое MapRaiders?",
             "MapRaiders — это бесплатное outdoor-соцприложение для Android. Игроки захватывают реальные территории пешком, бегом или на велосипеде, оставляют геопривязанные сообщения (Эхо) и встречаются с другими пользователями на живых событиях карты."),
            ("Как работают территории в MapRaiders?",
             "Игроки заявляют права на области, физически проходя их. Захваченная земля отображается цветом игрока на реальной карте. Другие игроки могут оспорить её через Игры Защиты — Крестики-нолики, Камень-ножницы-бумага или Мини-шахматы."),
            ("Что такое Эхо в MapRaiders?",
             "Эхо — это геопривязанные сообщения: аудиозаписи, фотографии или видео, оставленные в реальных местах. Другие пользователи находят их, посещая то же самое место."),
            ("MapRaiders бесплатно?",
             "Да. MapRaiders полностью бесплатно, без рекламы и без скрытых расходов. Приложение не монетизируется через данные пользователей или рекламу."),
            ("На каких платформах доступен MapRaiders?",
             "MapRaiders в настоящее время доступен для Android как APK-загрузка на mapraiders.com. Версия для iOS в разработке."),
            ("Чем MapRaiders отличается от Pokémon GO?",
             "В отличие от Pokémon GO, MapRaiders не использует дополненную реальность и не имеет виртуальных существ. Фокус — на реальном владении территориями, физическом исследовании и живых встречах между игроками. MapRaiders также полностью без рекламы."),
        ],
    },
    "ja": {
        "hreflang": "ja",
        "currency": "JPY",
        "app_desc": "MapRaidersは、Android向けの広告なしアウトドアソーシャルアプリです。移動して実在の陣地を獲得し、位置情報付きのエコーを残し、マップ上のスポンタニアスなイベントで人々と出会えます。",
        "org_desc": "MapRaidersは、現実世界のマップ上の相互作用を通じて人々をつなぐアウトドア・ソーシャル・ゲーミング・アプリケーションを開発しています。",
        "feature_list": [
            "GPSでの陣地獲得(歩行、ジョギング、サイクリング)",
            "位置情報付きエコー(音声、写真、動画)",
            "マップ上のリアルタイム・スポンタニアスイベント",
            "ディフェンスゲーム(三目並べ、じゃんけん、ミニチェス)",
            "クランと友達",
            "クエストとチャレンジ",
            "広告なし、フィードなし、アルゴリズムなし",
            "13言語対応",
        ],
        "facts_label": "ファクト",
        "facts_title": "MapRaiders — ファクト",
        "facts": [
            "MapRaidersはAndroid向けの無料・広告なしのアウトドアソーシャルアプリです。",
            "ユーザーは歩行、ジョギング、サイクリングによって実在の陣地を獲得します。",
            "エコーで、物理的な場所に音声・写真・動画メッセージを残せます。",
            "スポンタニアスイベントはライブマップ上にリアルタイムで表示されます。",
            "13言語に対応:ドイツ語、英語、フランス語、スペイン語、イタリア語、ポルトガル語、トルコ語、ロシア語、日本語、韓国語、中国語、アラビア語、ヒンディー語。",
            "ソーシャルフィードなし、アルゴリズムコンテンツなし、広告なし。",
            "ディフェンスゲーム(三目並べ、じゃんけん、ミニチェス)が陣地の所有者を決めます。",
            "MapRaidersは米国のScafa Investments LLCによって開発されています。",
        ],
        "faq_label": "FAQ",
        "faq_title": "よくある質問",
        "faqs": [
            ("MapRaidersとは何ですか?",
             "MapRaidersはAndroid向けの無料アウトドアソーシャルアプリです。プレイヤーは歩行、ジョギング、サイクリングによって実在の陣地を獲得し、位置情報付きメッセージ(エコー)を残し、ライブマップイベントで他のユーザーと出会います。"),
            ("MapRaidersで陣地はどう機能しますか?",
             "プレイヤーはエリアを物理的に通り抜けることで陣地を主張します。獲得した陣地は実際のマップ上にプレイヤーの色で表示されます。他のプレイヤーはディフェンスゲーム(三目並べ、じゃんけん、ミニチェス)で挑戦できます。"),
            ("MapRaidersのエコーとは?",
             "エコーとは、実在の場所に残される位置情報付きメッセージ(音声録音、写真、動画)です。他のユーザーは同じ場所を訪れたときにそれらを発見します。"),
            ("MapRaidersは無料ですか?",
             "はい。MapRaidersは完全に無料で、広告や隠れたコストはありません。ユーザーデータや広告で収益化されません。"),
            ("MapRaidersはどのプラットフォームで利用できますか?",
             "MapRaidersは現在、Android向けにmapraiders.comでのAPKダウンロードとして利用可能です。iOS版は開発中です。"),
            ("ポケモンGOとの違いは何ですか?",
             "ポケモンGOとは異なり、MapRaidersは拡張現実を使用せず、仮想のクリーチャーもいません。実在の陣地所有、物理的探検、プレイヤー同士の実際の対面での出会いに焦点を当てています。またMapRaidersは完全に広告なしです。"),
        ],
    },
    "ko": {
        "hreflang": "ko",
        "currency": "KRW",
        "app_desc": "MapRaiders는 안드로이드용 광고 없는 아웃도어 소셜 앱입니다. 이동해 실제 영토를 점령하고, 위치 기반 에코를 남기고, 지도 위 즉석 이벤트에서 사람들을 만나세요.",
        "org_desc": "MapRaiders는 실제 세계 지도 위의 상호작용을 통해 사람들을 연결하는 아웃도어 소셜 게이밍 애플리케이션을 개발합니다.",
        "feature_list": [
            "GPS 기반 영토 점령(걷기, 조깅, 자전거)",
            "위치 기반 에코(오디오, 사진, 동영상)",
            "지도 위 실시간 즉석 이벤트",
            "방어 게임(틱택토, 가위바위보, 미니 체스)",
            "클랜과 친구",
            "퀘스트와 챌린지",
            "광고 없음, 피드 없음, 알고리즘 없음",
            "13개 언어 지원",
        ],
        "facts_label": "팩트",
        "facts_title": "MapRaiders — 팩트",
        "facts": [
            "MapRaiders는 안드로이드용 무료 광고 없는 아웃도어 소셜 앱입니다.",
            "사용자는 걷기, 조깅, 자전거로 실제 영토를 점령합니다.",
            "에코로 실제 장소에 오디오, 사진, 동영상 메시지를 남길 수 있습니다.",
            "즉석 이벤트는 라이브 지도에 실시간으로 나타납니다.",
            "13개 언어 지원: 독일어, 영어, 프랑스어, 스페인어, 이탈리아어, 포르투갈어, 터키어, 러시아어, 일본어, 한국어, 중국어, 아랍어, 힌디어.",
            "소셜 피드 없음, 알고리즘 콘텐츠 없음, 광고 없음.",
            "방어 게임(틱택토, 가위바위보, 미니 체스)이 영토 소유권을 결정합니다.",
            "MapRaiders는 미국의 Scafa Investments LLC에서 개발합니다.",
        ],
        "faq_label": "FAQ",
        "faq_title": "자주 묻는 질문",
        "faqs": [
            ("MapRaiders는 무엇인가요?",
             "MapRaiders는 안드로이드용 무료 아웃도어 소셜 앱입니다. 플레이어는 걷기, 조깅, 자전거로 실제 영토를 점령하고 위치 기반 메시지(에코)를 남기며, 라이브 지도 이벤트에서 다른 사용자를 만납니다."),
            ("MapRaiders에서 영토는 어떻게 작동하나요?",
             "플레이어는 해당 지역을 물리적으로 통과함으로써 영토를 주장합니다. 점령된 영토는 실제 지도에 플레이어의 색으로 표시됩니다. 다른 플레이어는 방어 게임(틱택토, 가위바위보, 미니 체스)을 통해 도전할 수 있습니다."),
            ("MapRaiders의 에코는 무엇인가요?",
             "에코는 실제 장소에 남겨진 위치 기반 메시지입니다 — 오디오 녹음, 사진 또는 동영상. 다른 사용자가 같은 장소를 방문할 때 이를 발견합니다."),
            ("MapRaiders는 무료인가요?",
             "네. MapRaiders는 완전 무료이며 광고와 숨겨진 비용이 없습니다. 앱은 사용자 데이터나 광고로 수익을 내지 않습니다."),
            ("MapRaiders는 어느 플랫폼에서 사용할 수 있나요?",
             "MapRaiders는 현재 Android용으로 mapraiders.com에서 APK 다운로드로 이용 가능합니다. iOS 버전은 개발 중입니다."),
            ("포켓몬 GO와 어떻게 다른가요?",
             "포켓몬 GO와 달리 MapRaiders는 증강 현실을 사용하지 않으며 가상 생물도 없습니다. 실제 영토 소유, 물리적 탐험, 플레이어 간의 실제 대면 만남에 초점을 둡니다. MapRaiders는 또한 완전히 광고가 없습니다."),
        ],
    },
    "zh": {
        "hreflang": "zh",
        "currency": "CNY",
        "app_desc": "MapRaiders 是一款面向 Android 的无广告户外社交应用。通过移动占领真实领地,留下基于位置的回声(Echos),并在地图上的即兴活动中结识他人。",
        "org_desc": "MapRaiders 开发户外社交游戏应用,通过真实世界地图上的互动将人们联系起来。",
        "feature_list": [
            "基于 GPS 的领地占领(步行、跑步、骑行)",
            "基于位置的回声(音频、照片、视频)",
            "地图上的实时即兴活动",
            "防御游戏(井字棋、石头剪刀布、迷你国际象棋)",
            "部落与朋友",
            "任务与挑战",
            "无广告、无信息流、无算法",
            "支持 13 种语言",
        ],
        "facts_label": "事实",
        "facts_title": "MapRaiders — 事实",
        "facts": [
            "MapRaiders 是一款面向 Android 的免费、无广告户外社交应用。",
            "用户通过步行、跑步或骑行占领真实领地。",
            "回声允许在物理位置留下音频、照片和视频信息。",
            "即兴活动在实时地图上实时显示。",
            "支持 13 种语言:德语、英语、法语、西班牙语、意大利语、葡萄牙语、土耳其语、俄语、日语、韩语、中文、阿拉伯语、印地语。",
            "无社交信息流、无算法内容、无广告。",
            "防御游戏(井字棋、石头剪刀布、迷你国际象棋)决定领地归属。",
            "MapRaiders 由美国 Scafa Investments LLC 开发。",
        ],
        "faq_label": "常见问题",
        "faq_title": "常见问题",
        "faqs": [
            ("什么是 MapRaiders?",
             "MapRaiders 是一款面向 Android 的免费户外社交应用。玩家通过步行、跑步或骑行占领真实领地,留下基于位置的信息(回声),并在实时地图活动中结识其他用户。"),
            ("MapRaiders 中的领地如何运作?",
             "玩家通过物理穿越区域来占领领地。占领的领地以玩家的颜色显示在真实地图上。其他玩家可以通过防御游戏——井字棋、石头剪刀布或迷你国际象棋——发起挑战。"),
            ("MapRaiders 中的回声是什么?",
             "回声是留在真实地点的基于位置的信息——音频录音、照片或视频。其他用户在访问同一地点时发现它们。"),
            ("MapRaiders 免费吗?",
             "是的。MapRaiders 完全免费,没有广告和隐藏费用。应用不通过用户数据或广告盈利。"),
            ("MapRaiders 在哪些平台上可用?",
             "MapRaiders 目前可在 Android 上通过 mapraiders.com 上的 APK 下载使用。iOS 版本正在开发中。"),
            ("与宝可梦 GO 有何不同?",
             "与宝可梦 GO 不同,MapRaiders 不使用增强现实,也没有虚拟生物。它专注于真实领地所有权、物理探索和玩家之间的真实面对面相遇。MapRaiders 也完全无广告。"),
        ],
    },
    "ar": {
        "hreflang": "ar",
        "currency": "USD",
        "app_desc": "MapRaiders هو تطبيق التواصل الاجتماعي الخارجي بدون إعلانات لنظام Android. استحوذ على أراضٍ حقيقية بالتحرك، واترك أصداءً مرتبطة بالموقع، والتقِ أشخاصًا في فعاليات تلقائية على الخريطة.",
        "org_desc": "تطور MapRaiders تطبيقات ألعاب اجتماعية خارجية تربط الناس من خلال التفاعلات على خريطة العالم الحقيقي.",
        "feature_list": [
            "الاستحواذ على الأراضي عبر GPS (المشي، الجري، ركوب الدراجات)",
            "أصداء مرتبطة بالموقع (صوت، صورة، فيديو)",
            "فعاليات تلقائية فورية على الخريطة",
            "ألعاب دفاع (إكس-أو، حجر-ورقة-مقص، شطرنج مصغر)",
            "عشائر وصداقات",
            "مهام وتحديات",
            "بدون إعلانات، بدون خلاصة، بدون خوارزمية",
            "13 لغة",
        ],
        "facts_label": "حقائق",
        "facts_title": "MapRaiders — حقائق",
        "facts": [
            "MapRaiders تطبيق اجتماعي خارجي مجاني وبدون إعلانات لنظام Android.",
            "يستحوذ المستخدمون على أراضٍ حقيقية بالمشي أو الجري أو ركوب الدراجات.",
            "تتيح الأصداء ترك رسائل صوتية وصور ومقاطع فيديو في أماكن فعلية.",
            "تظهر الفعاليات التلقائية فوريًا على خريطة حية.",
            "متوفر بـ 13 لغة: الألمانية، الإنجليزية، الفرنسية، الإسبانية، الإيطالية، البرتغالية، التركية، الروسية، اليابانية، الكورية، الصينية، العربية، الهندية.",
            "بدون خلاصة اجتماعية، بدون محتوى خوارزمي، بدون إعلانات.",
            "تحدد ألعاب الدفاع (إكس-أو، حجر-ورقة-مقص، شطرنج مصغر) ملكية الأراضي.",
            "تطور MapRaiders بواسطة Scafa Investments LLC في الولايات المتحدة.",
        ],
        "faq_label": "الأسئلة الشائعة",
        "faq_title": "الأسئلة الشائعة",
        "faqs": [
            ("ما هو MapRaiders؟",
             "MapRaiders تطبيق اجتماعي خارجي مجاني لنظام Android. يستحوذ اللاعبون على أراضٍ حقيقية بالمشي أو الجري أو ركوب الدراجات، ويتركون رسائل مرتبطة بالموقع تسمى الأصداء، ويلتقون بمستخدمين آخرين في فعاليات حية على الخريطة."),
            ("كيف تعمل الأراضي في MapRaiders؟",
             "يستحوذ اللاعبون على مناطق بالمرور خلالها فعليًا. تظهر الأرض المستحوَذ عليها بلون اللاعب على خريطة حقيقية. يمكن للاعبين الآخرين تحديها عبر ألعاب الدفاع — إكس-أو، حجر-ورقة-مقص، أو شطرنج مصغر."),
            ("ما هي الأصداء في MapRaiders؟",
             "الأصداء رسائل مرتبطة بالموقع — تسجيلات صوتية وصور ومقاطع فيديو — تُترك في أماكن حقيقية. يكتشفها المستخدمون الآخرون عند زيارة نفس المكان."),
            ("هل MapRaiders مجاني؟",
             "نعم. MapRaiders مجاني تمامًا، بدون إعلانات وبدون تكاليف خفية. لا يتم تحقيق دخل من بيانات المستخدم أو الإعلانات."),
            ("على أي منصات يتوفر MapRaiders؟",
             "يتوفر MapRaiders حاليًا لنظام Android كتحميل APK من mapraiders.com. إصدار iOS قيد التطوير."),
            ("ما الفرق بينه وبين Pokémon GO؟",
             "على عكس Pokémon GO، لا يستخدم MapRaiders الواقع المعزز ولا يحتوي على كائنات افتراضية. يركّز على ملكية أراضٍ حقيقية، واستكشاف فعلي، ولقاءات حقيقية وجهًا لوجه بين اللاعبين. وهو أيضًا خالٍ تمامًا من الإعلانات."),
        ],
    },
    "hi": {
        "hreflang": "hi",
        "currency": "INR",
        "app_desc": "MapRaiders एंड्रॉइड के लिए विज्ञापन-रहित आउटडोर सोशल मीडिया ऐप है। चलकर असली क्षेत्रों पर कब्जा करें, स्थान-आधारित Echos छोड़ें, और मानचित्र पर स्वतःस्फूर्त आयोजनों में लोगों से मिलें।",
        "org_desc": "MapRaiders आउटडोर सोशल गेमिंग ऐप विकसित करता है जो वास्तविक दुनिया के मानचित्र पर इंटरैक्शन के माध्यम से लोगों को जोड़ते हैं।",
        "feature_list": [
            "GPS के माध्यम से क्षेत्र पर कब्जा (चलना, दौड़ना, साइकिल चलाना)",
            "स्थान-आधारित Echos (ऑडियो, फोटो, वीडियो)",
            "मानचित्र पर रीयल-टाइम स्वतःस्फूर्त आयोजन",
            "रक्षा खेल (टिक-टैक-टो, रॉक-पेपर-सीज़र्स, मिनी-शतरंज)",
            "क्लान और मित्रता",
            "क्वेस्ट और चुनौतियाँ",
            "कोई विज्ञापन, कोई फीड, कोई एल्गोरिथम नहीं",
            "13 भाषाएँ",
        ],
        "facts_label": "तथ्य",
        "facts_title": "MapRaiders — तथ्य",
        "facts": [
            "MapRaiders एंड्रॉइड के लिए मुफ्त, विज्ञापन-रहित आउटडोर सोशल ऐप है।",
            "उपयोगकर्ता चलकर, दौड़कर या साइकिल चलाकर असली क्षेत्रों पर कब्जा करते हैं।",
            "Echos उपयोगकर्ताओं को भौतिक स्थानों पर ऑडियो, फोटो और वीडियो संदेश छोड़ने देते हैं।",
            "स्वतःस्फूर्त आयोजन लाइव मानचित्र पर रीयल-टाइम में दिखाई देते हैं।",
            "13 भाषाओं में उपलब्ध: जर्मन, अंग्रेजी, फ्रेंच, स्पेनिश, इतालवी, पुर्तगाली, तुर्की, रूसी, जापानी, कोरियाई, चीनी, अरबी, हिंदी।",
            "कोई सोशल फीड नहीं, कोई एल्गोरिथमिक सामग्री नहीं, कोई विज्ञापन नहीं।",
            "रक्षा खेल (टिक-टैक-टो, रॉक-पेपर-सीज़र्स, मिनी-शतरंज) क्षेत्र का स्वामित्व तय करते हैं।",
            "MapRaiders का विकास Scafa Investments LLC, संयुक्त राज्य अमेरिका द्वारा किया जाता है।",
        ],
        "faq_label": "FAQ",
        "faq_title": "अक्सर पूछे जाने वाले प्रश्न",
        "faqs": [
            ("MapRaiders क्या है?",
             "MapRaiders एंड्रॉइड के लिए एक मुफ्त आउटडोर सोशल ऐप है। खिलाड़ी चलकर, दौड़कर या साइकिल चलाकर असली क्षेत्रों पर कब्जा करते हैं, स्थान-आधारित संदेश (Echos) छोड़ते हैं, और लाइव मानचित्र आयोजनों में अन्य उपयोगकर्ताओं से मिलते हैं।"),
            ("MapRaiders में क्षेत्र कैसे काम करते हैं?",
             "खिलाड़ी क्षेत्रों से भौतिक रूप से गुजरकर उन पर कब्जा करते हैं। कब्जाई गई भूमि असली मानचित्र पर खिलाड़ी के रंग में दिखाई देती है। अन्य खिलाड़ी रक्षा खेलों — टिक-टैक-टो, रॉक-पेपर-सीज़र्स या मिनी-शतरंज — के माध्यम से चुनौती दे सकते हैं।"),
            ("MapRaiders में Echos क्या हैं?",
             "Echos स्थान-आधारित संदेश हैं — ऑडियो रिकॉर्डिंग, फोटो या वीडियो — जो असली स्थानों पर छोड़े जाते हैं। अन्य उपयोगकर्ता उसी स्थान पर जाने पर उन्हें खोजते हैं।"),
            ("क्या MapRaiders मुफ्त है?",
             "हाँ। MapRaiders पूरी तरह मुफ्त है, बिना विज्ञापनों और बिना छिपी लागतों के। ऐप उपयोगकर्ता डेटा या विज्ञापनों से पैसा नहीं कमाता।"),
            ("MapRaiders किन प्लेटफ़ॉर्म पर उपलब्ध है?",
             "MapRaiders वर्तमान में एंड्रॉइड के लिए mapraiders.com पर APK डाउनलोड के रूप में उपलब्ध है। iOS संस्करण विकास में है।"),
            ("Pokémon GO से क्या अंतर है?",
             "Pokémon GO के विपरीत, MapRaiders में कोई संवर्धित वास्तविकता या वर्चुअल प्राणी नहीं हैं। यह वास्तविक क्षेत्र स्वामित्व, भौतिक अन्वेषण और खिलाड़ियों के बीच वास्तविक आमने-सामने मुलाकातों पर केंद्रित है। MapRaiders पूरी तरह विज्ञापन-मुक्त भी है।"),
        ],
    },
}


def build_json_ld(lang_code: str, cfg: dict) -> str:
    """Baut die 4 JSON-LD Blöcke als String."""
    hreflang = cfg["hreflang"]
    all_langs = ["en", "de", "fr", "es", "it", "pt", "tr", "ru", "ja", "ko", "zh", "ar", "hi"]
    # primäre Sprache zuerst
    in_language = [hreflang] + [l for l in all_langs if l != hreflang]

    mobile_app = {
        "@context": "https://schema.org",
        "@type": "MobileApplication",
        "name": "MapRaiders",
        "description": cfg["app_desc"],
        "url": f"https://mapraiders.com/{hreflang}/",
        "applicationCategory": "GameApplication",
        "applicationSubCategory": "SocialNetworkingApplication",
        "operatingSystem": "Android",
        "inLanguage": in_language,
        "featureList": cfg["feature_list"],
        "screenshot": "https://mapraiders.com/og-image.png",
        "downloadUrl": "https://mapraiders.com/MapRaiders.apk",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": cfg["currency"],
        },
        "author": {
            "@type": "Organization",
            "name": "Scafa Investments LLC",
            "url": "https://scafa-investments.com/",
        },
    }

    organization = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "MapRaiders",
        "url": "https://mapraiders.com",
        "logo": "https://mapraiders.com/og-image.png",
        "description": cfg["org_desc"],
        "founder": {
            "@type": "Organization",
            "name": "Scafa Investments LLC",
            "url": "https://scafa-investments.com/",
        },
        "email": "info@scafa-investments.com",
        "sameAs": [],
    }

    website = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "MapRaiders",
        "url": "https://mapraiders.com",
        "inLanguage": hreflang,
        "potentialAction": {
            "@type": "SearchAction",
            "target": f"https://mapraiders.com/{hreflang}/?q={{search_term_string}}",
            "query-input": "required name=search_term_string",
        },
    }

    faq_page = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in cfg["faqs"]
        ],
    }

    def dump(obj):
        return json.dumps(obj, ensure_ascii=False, indent=2)

    return "\n".join(
        [
            f'<script type="application/ld+json">\n{dump(mobile_app)}\n</script>',
            f'<script type="application/ld+json">\n{dump(organization)}\n</script>',
            f'<script type="application/ld+json">\n{dump(website)}\n</script>',
            f'<script type="application/ld+json">\n{dump(faq_page)}\n</script>',
        ]
    )


CSS_BLOCK = """.facts{padding:120px 0;border-top:1px solid var(--border)}
.facts .sec-title{margin-bottom:32px}
.facts-list{list-style:none;display:grid;grid-template-columns:repeat(2,1fr);gap:14px;max-width:960px}
@media(max-width:720px){.facts-list{grid-template-columns:1fr}}
.facts-list li{padding:18px 22px;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:8px;font-size:15px;line-height:1.6;color:var(--text)}
.faq{padding:120px 0;background:var(--bg-alt);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.faq .sec-title{margin-bottom:40px}
.faq-list{display:flex;flex-direction:column;gap:12px;max-width:820px}
.faq-item{padding:24px 28px;background:var(--surface);border:1px solid var(--border);border-radius:10px;transition:box-shadow .3s,transform .3s cubic-bezier(.16,1,.3,1)}
.faq-item:hover{box-shadow:var(--sh-md);transform:translateY(-1px)}
.faq-item h3{font-size:18px;font-weight:700;letter-spacing:-.3px;margin-bottom:10px;color:var(--text)}
.faq-item p{font-size:15px;color:var(--muted);line-height:1.7}
.faq-item p strong{color:var(--text);font-weight:600}
"""


def build_sections(cfg: dict) -> str:
    """HTML für Facts + FAQ."""
    delays = ["d2", "d3", "d4", "d5", "", ""]
    faq_items = "\n    ".join(
        f'<div class="faq-item rv {delays[i]}">\n      <h3>{q}</h3>\n      <p>{a}</p>\n    </div>'
        for i, (q, a) in enumerate(cfg["faqs"])
    )
    facts_items = "\n    ".join(f"<li>{f}</li>" for f in cfg["facts"])

    return f"""{PHASE5_MARKER}
<section class="facts" id="facts">
<div class="mx">
  <div class="sec-label rv">{cfg["facts_label"]}</div>
  <h2 class="sec-title rv d1">{cfg["facts_title"]}</h2>
  <ul class="facts-list rv d2">
    {facts_items}
  </ul>
</div>
</section>

<section class="faq" id="faq">
<div class="mx">
  <div class="sec-label rv">{cfg["faq_label"]}</div>
  <h2 class="sec-title rv d1">{cfg["faq_title"]}</h2>
  <div class="faq-list">
    {faq_items}
  </div>
</div>
</section>

"""


def process_file(lang: str, cfg: dict) -> str:
    path = ROOT / lang / "index.html"
    if not path.exists():
        return f"SKIP {lang}: {path} not found"

    html = path.read_text(encoding="utf-8")

    if PHASE5_MARKER in html:
        return f"SKIP {lang}: already processed"

    # 1) JSON-LD nach dem letzten twitter:image meta einfügen
    tw_re = re.compile(r'(<meta name="twitter:image" content="[^"]+">)')
    json_ld = build_json_ld(lang, cfg)
    if not tw_re.search(html):
        return f"FAIL {lang}: twitter:image anchor not found"
    html = tw_re.sub(r"\1\n" + json_ld, html, count=1)

    # 2) CSS vor "footer{padding:40px 0 32px" einfügen
    footer_re = re.compile(r"(footer\{padding:40px 0 32px)")
    if not footer_re.search(html):
        return f"FAIL {lang}: footer CSS anchor not found"
    html = footer_re.sub(CSS_BLOCK + r"\1", html, count=1)

    # 3) Facts+FAQ-Section vor <section class="cta"> einfügen
    cta_re = re.compile(r'(<section class="cta">)')
    if not cta_re.search(html):
        return f"FAIL {lang}: cta anchor not found"
    html = cta_re.sub(build_sections(cfg) + r"\1", html, count=1)

    path.write_text(html, encoding="utf-8")
    return f"OK   {lang}"


if __name__ == "__main__":
    results = []
    for lang, cfg in LANGS.items():
        results.append(process_file(lang, cfg))
    for r in results:
        print(r)
    fails = [r for r in results if r.startswith("FAIL")]
    sys.exit(1 if fails else 0)

"""
Phase 0a — Schema.org `DefinedTermSet` für Brand-Vokabular pro Sprache.

Fügt JSON-LD-Block in <head> ein, der MapRaiders' Brand-Begriffe (Territorium, Echo,
Defense Mini-Games, Quest, Artefakt, Clan, Echo Drop, Territory Decay) als formales
Glossar markiert. Suchmaschinen verstehen so, dass diese Begriffe brand-spezifisch sind.

Pro Sprache eigenes Set mit lokalisierten Übersetzungen.

Idempotent via Marker.
"""
from __future__ import annotations
from pathlib import Path
import json
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent
MARKER = "<!-- PHASE-0A-DEFINEDTERMSET -->"

# Brand-Vokabular pro Sprache (8 Kern-Begriffe)
TERMS = {
    "de": [
        ("Territorium", "Eine eroberte Karten-Fläche im Spiel, die persistent dem Spieler oder Clan zugewiesen ist"),
        ("Echo", "Ein vom Spieler an einem Standort hinterlassenes Audio-, Foto- oder Video-Signal, das andere Spieler dort entdecken können"),
        ("Verteidigungs-Minispiel", "Mini-Spiel (Tic-Tac-Toe, Stein-Schere-Papier, Mini-Schach), das beim Verteidigen oder Erobern eines Territoriums ausgelöst wird"),
        ("Quest", "Eine vom Spieler erstellte Mini-Aufgabe, die andere Spieler in der echten Welt erfüllen können"),
        ("Artefakt", "Ein vom Spieler erschaffenes Sammler-Objekt, das in einem Territorium platziert werden kann"),
        ("Clan", "Eine organisch geformte Gruppe von Spielern, die Territorien gemeinsam halten und verteidigen"),
        ("Echo-Drop", "Die Aktion, ein Echo an einem realen Standort zu hinterlassen"),
        ("Territory Decay", "Mechanik, durch die unbesuchte Territorien über Zeit verfallen und wieder eroberbar werden"),
    ],
    "en": [
        ("Territory", "A captured map area persistently assigned to a player or clan"),
        ("Echo", "A location-attached audio, photo or video signal a player leaves for others to discover"),
        ("Defense Mini-Game", "A mini-game (Tic-Tac-Toe, Rock-Paper-Scissors, Mini-Chess) triggered when a territory is contested"),
        ("Quest", "A player-created mini-task others can complete in the real world"),
        ("Artefact", "A player-crafted collectible item placed in a territory"),
        ("Clan", "An organic group of players who hold and defend territories together"),
        ("Echo Drop", "The action of leaving an Echo at a real-world location"),
        ("Territory Decay", "Mechanic by which abandoned territories degrade over time and become claimable again"),
    ],
    "fr": [
        ("Territoire", "Une zone de carte capturée, attribuée de façon persistante à un joueur ou un clan"),
        ("Écho", "Un signal audio, photo ou vidéo laissé par un joueur à un emplacement, à découvrir par d'autres"),
        ("Mini-jeu de défense", "Mini-jeu (morpion, pierre-feuille-ciseaux, mini-échecs) déclenché lors d'une contestation de territoire"),
        ("Quête", "Une mini-tâche créée par un joueur que d'autres peuvent accomplir dans le monde réel"),
        ("Artefact", "Un objet collectionnable créé par un joueur et placé dans un territoire"),
        ("Clan", "Un groupe organique de joueurs qui tiennent et défendent ensemble des territoires"),
        ("Dépôt d'Écho", "L'action de laisser un Écho à un emplacement réel"),
        ("Dégradation du territoire", "Mécanique par laquelle les territoires abandonnés se dégradent dans le temps"),
    ],
    "it": [
        ("Territorio", "Un'area della mappa conquistata, assegnata persistentemente a un giocatore o clan"),
        ("Eco", "Un segnale audio, foto o video lasciato da un giocatore in un luogo, da scoprire da altri"),
        ("Mini-gioco di difesa", "Mini-gioco (tris, sasso-carta-forbici, mini-scacchi) attivato durante una contesa territoriale"),
        ("Missione", "Una mini-attività creata da un giocatore che altri possono completare nel mondo reale"),
        ("Artefatto", "Un oggetto da collezione creato da un giocatore e posizionato in un territorio"),
        ("Clan", "Un gruppo organico di giocatori che tengono e difendono insieme i territori"),
        ("Lasciare un Eco", "L'azione di lasciare un Eco in un luogo reale"),
        ("Decadimento del territorio", "Meccanica per cui i territori abbandonati si degradano nel tempo"),
    ],
    "es": [
        ("Territorio", "Un área del mapa conquistada, asignada de forma persistente a un jugador o clan"),
        ("Eco", "Una señal de audio, foto o vídeo dejada por un jugador en una ubicación, para que otros descubran"),
        ("Mini-juego de defensa", "Mini-juego (tres en raya, piedra-papel-tijera, mini-ajedrez) activado durante una disputa territorial"),
        ("Misión", "Una mini-tarea creada por un jugador que otros pueden completar en el mundo real"),
        ("Artefacto", "Un objeto coleccionable creado por un jugador y colocado en un territorio"),
        ("Clan", "Un grupo orgánico de jugadores que mantienen y defienden territorios juntos"),
        ("Dejar un Eco", "La acción de dejar un Eco en un lugar real"),
        ("Decaimiento del territorio", "Mecánica por la cual los territorios abandonados se degradan con el tiempo"),
    ],
    "pt": [
        ("Território", "Uma área do mapa conquistada, atribuída de forma persistente a um jogador ou clã"),
        ("Echo", "Um sinal de áudio, foto ou vídeo deixado por um jogador em um local, para outros descobrirem"),
        ("Mini-jogo de defesa", "Mini-jogo (jogo da velha, pedra-papel-tesoura, mini-xadrez) ativado durante uma disputa territorial"),
        ("Missão", "Uma mini-tarefa criada por um jogador que outros podem completar no mundo real"),
        ("Artefato", "Um item colecionável criado por um jogador e colocado em um território"),
        ("Clã", "Um grupo orgânico de jogadores que mantêm e defendem territórios juntos"),
        ("Deixar um Echo", "A ação de deixar um Echo em um local real"),
        ("Decaimento de Território", "Mecânica pela qual territórios abandonados se degradam ao longo do tempo"),
    ],
    "tr": [
        ("Bölge", "Oyuncuya veya klana kalıcı olarak atanan, harita üzerinde fethedilmiş bir alan"),
        ("Eko", "Oyuncunun bir konumda bıraktığı, başkaları tarafından keşfedilebilecek ses, fotoğraf veya video sinyali"),
        ("Savunma mini oyunu", "Bir bölge çekişmesi sırasında tetiklenen mini oyun (XOX, taş-kağıt-makas, mini satranç)"),
        ("Görev", "Bir oyuncu tarafından oluşturulan, başkalarının gerçek dünyada tamamlayabileceği mini görev"),
        ("Eser", "Bir oyuncu tarafından oluşturulan ve bir bölgeye yerleştirilen koleksiyon eşyası"),
        ("Klan", "Bölgeleri birlikte tutan ve savunan organik bir oyuncu grubu"),
        ("Eko bırakmak", "Gerçek bir konumda Eko bırakma eylemi"),
        ("Bölge çürümesi", "Terk edilmiş bölgelerin zamanla bozulup yeniden fethedilebilir hale gelmesi mekaniği"),
    ],
    "ru": [
        ("Территория", "Захваченная область карты, постоянно закреплённая за игроком или кланом"),
        ("Эхо", "Аудио-, фото- или видео-сигнал, оставленный игроком в локации для обнаружения другими"),
        ("Мини-игра защиты", "Мини-игра (крестики-нолики, камень-ножницы-бумага, мини-шахматы), запускаемая при оспаривании территории"),
        ("Миссия", "Мини-задание, созданное игроком, которое другие могут выполнить в реальном мире"),
        ("Артефакт", "Коллекционный предмет, созданный игроком и размещённый в территории"),
        ("Клан", "Органичная группа игроков, удерживающая и защищающая территории вместе"),
        ("Оставить Эхо", "Действие по оставлению Эха в реальной локации"),
        ("Распад территории", "Механика, при которой заброшенные территории со временем деградируют"),
    ],
    "ja": [
        ("陣地", "プレイヤーまたはクランに永続的に割り当てられた、捕獲されたマップエリア"),
        ("エコー", "プレイヤーが場所に残した、他のプレイヤーが発見できる音声、写真、または動画の信号"),
        ("防衛ミニゲーム", "領地が争われた際に発動するミニゲーム（三目並べ、じゃんけん、ミニチェス）"),
        ("クエスト", "プレイヤーが作成した、他のプレイヤーが現実世界で達成できるミニタスク"),
        ("アーティファクト", "プレイヤーが作成し、領地に配置されるコレクション・アイテム"),
        ("クラン", "領地を一緒に保持し、防衛するプレイヤーの有機的なグループ"),
        ("エコーを残す", "実世界の場所にエコーを残す行為"),
        ("テリトリー減衰", "放置された領地が時間とともに劣化し、再び奪取可能になる仕組み"),
    ],
    "ko": [
        ("영토", "플레이어 또는 클랜에 지속적으로 할당된 점령된 지도 영역"),
        ("에코", "플레이어가 위치에 남긴, 다른 플레이어가 발견할 수 있는 오디오/사진/비디오 신호"),
        ("방어 미니게임", "영토 분쟁 시 실행되는 미니게임 (틱택토, 가위바위보, 미니체스)"),
        ("퀘스트", "플레이어가 만든, 다른 플레이어가 현실 세계에서 완료할 수 있는 미니 과제"),
        ("아티팩트", "플레이어가 만들어 영토에 배치하는 수집 아이템"),
        ("클랜", "영토를 함께 보유하고 방어하는 자연 발생적 플레이어 그룹"),
        ("에코 남기기", "실제 위치에 에코를 남기는 행위"),
        ("영토 쇠퇴", "방치된 영토가 시간이 지남에 따라 쇠퇴하는 메커니즘"),
    ],
    "zh": [
        ("领地", "持续分配给玩家或公会的已占领地图区域"),
        ("回声", "玩家在某位置留下、可被他人发现的音频、照片或视频信号"),
        ("防守小游戏", "领地争夺时触发的小游戏（井字棋、剪刀石头布、迷你国际象棋）"),
        ("任务", "玩家创建的、可由他人在现实世界中完成的小任务"),
        ("遗物", "玩家创造并放置在领地中的收藏品"),
        ("公会", "共同持有和保卫领地的玩家自发形成的群体"),
        ("留下回声", "在真实位置留下回声的行为"),
        ("领地消退", "废弃领地随时间逐渐衰退、可重新占领的机制"),
    ],
    "ar": [
        ("منطقة", "منطقة على الخريطة تم احتلالها وتم تخصيصها بشكل دائم للاعب أو العشيرة"),
        ("صدى", "إشارة صوتية أو صورة أو فيديو تركها لاعب في موقع، يمكن لآخرين اكتشافها"),
        ("لعبة دفاع مصغرة", "لعبة مصغرة (إكس-أوه، حجر-ورقة-مقص، شطرنج مصغر) يتم تشغيلها أثناء النزاع على المنطقة"),
        ("مهمة", "مهمة مصغرة أنشأها لاعب يمكن للآخرين إكمالها في العالم الحقيقي"),
        ("قطعة أثرية", "عنصر قابل للجمع، صنعه لاعب ووضعه في منطقة"),
        ("عشيرة", "مجموعة عضوية من اللاعبين يحتفظون ويدافعون عن المناطق معاً"),
        ("اترك صدى", "إجراء ترك صدى في موقع حقيقي"),
        ("تلاشي المنطقة", "آلية يتم بموجبها تدهور المناطق المهجورة بمرور الوقت"),
    ],
    "hi": [
        ("क्षेत्र", "खिलाड़ी या क्लान को स्थायी रूप से सौंपा गया कब्ज़ा किया गया मानचित्र क्षेत्र"),
        ("गूँज", "एक स्थान पर खिलाड़ी द्वारा छोड़ा गया ऑडियो, फोटो या वीडियो संकेत, जिसे अन्य खोज सकते हैं"),
        ("रक्षा मिनी-गेम", "क्षेत्र विवाद के समय शुरू होने वाला मिनी-गेम (टिक-टैक-टो, पत्थर-कागज-कैंची, मिनी शतरंज)"),
        ("मिशन", "एक खिलाड़ी द्वारा बनाया गया मिनी-कार्य जिसे अन्य लोग वास्तविक दुनिया में पूरा कर सकते हैं"),
        ("कलाकृति", "एक खिलाड़ी द्वारा बनाई गई संग्रहणीय वस्तु जो किसी क्षेत्र में रखी जाती है"),
        ("क्लान", "एक प्राकृतिक खिलाड़ी समूह जो एक साथ क्षेत्रों को रखते और उनका बचाव करते हैं"),
        ("इको छोड़ना", "वास्तविक स्थान पर एक गूँज छोड़ने की क्रिया"),
        ("क्षेत्र क्षरण", "वह तंत्र जिसके द्वारा त्यागे गए क्षेत्र समय के साथ क्षीण होते हैं"),
    ],
}


def detect_lang_from_path(path: Path) -> str:
    parts = path.relative_to(ROOT).parts
    if len(parts) >= 2 and parts[0] in TERMS:
        return parts[0]
    return "de"


def build_jsonld(lang: str) -> str:
    terms_list = TERMS[lang]
    data = {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "name": f"MapRaiders Brand Vocabulary ({lang.upper()})",
        "inLanguage": lang,
        "hasDefinedTerm": [
            {
                "@type": "DefinedTerm",
                "name": name,
                "description": desc,
                "inDefinedTermSet": "https://mapraiders.com/#brand-vocab",
            }
            for name, desc in terms_list
        ],
    }
    return (
        MARKER + "\n"
        + '<script type="application/ld+json">'
        + json.dumps(data, ensure_ascii=False)
        + "</script>"
    )


def process_file(path: Path) -> tuple[bool, str]:
    try:
        html = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"read-error: {e}"

    if "<!-- PHASE-K-FOUNDER-REVIEWS -->" not in html:
        return False, "skip:no-phase-k"

    if MARKER in html:
        return False, "skip:already-applied"

    lang = detect_lang_from_path(path)
    if lang not in TERMS:
        return False, f"skip:unsupported-lang:{lang}"

    block = build_jsonld(lang)
    if "</head>" not in html:
        return False, "skip:no-head-end"

    new_html = html.replace("</head>", block + "\n</head>", 1)
    path.write_text(new_html, encoding="utf-8")
    return True, "OK"


def main() -> None:
    print("=" * 60)
    print("Phase 0a — DefinedTermSet (Brand-Vokabular pro Sprache)")
    print("=" * 60)

    files = sorted(ROOT.rglob("*.html"))
    stats = {"ok": 0, "skip": 0}
    skip_reasons: dict[str, int] = {}
    by_lang: dict[str, int] = {}

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

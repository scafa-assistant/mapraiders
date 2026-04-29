"""
Phase L: Generische "Mehr erfahren"-Anker → Killer-Keyword-Anker pro Sprache.

Idempotent — ersetzt NUR wenn der Anchor-Text noch einer der generischen Phrasen ist.
Die hrefs selbst werden nicht angefasst (das hat Phase J bereits gemacht).
"""
from __future__ import annotations
from pathlib import Path
import re
import sys

if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent

GENERIC_PHRASES = [
    "Mehr erfahren",
    "hier mehr erfahren",
    "Hier mehr erfahren",
    "Learn more",
    "En savoir plus",
    "Saber más",
    "Más info",
    "Scopri di più",
    "Saiba mais",
    "Daha fazla bilgi",
    "Узнать больше",
    "詳しく見る",
    "もっと見る",
    "자세히 보기",
    "了解更多",
    "اعرف المزيد",
    "और जानें",
]

# Per-Feature pro Sprache: Killer-Keyword-Anker
KW = {
    "territories": {
        "de": "Echte GPS-Territorien",
        "en": "Real GPS territories",
        "fr": "Vrais territoires GPS",
        "es": "Territorios GPS reales",
        "it": "Territori GPS reali",
        "pt": "Territórios GPS reais",
        "tr": "Gerçek GPS bölgeleri",
        "ru": "Реальные GPS-территории",
        "ja": "リアルなGPSテリトリー",
        "ko": "진짜 GPS 영토",
        "zh": "真实GPS领地",
        "ar": "مناطق GPS حقيقية",
        "hi": "असली GPS क्षेत्र",
    },
    "echos": {
        "de": "Standort-Echos entdecken",
        "en": "Discover location Echoes",
        "fr": "Découvrir les Échos géolocalisés",
        "es": "Descubrir Echos geolocalizados",
        "it": "Scopri Echi geolocalizzati",
        "pt": "Descobrir Echos geolocalizados",
        "tr": "Konum Eko'larını keşfet",
        "ru": "Узнать о геолокальных Эхо",
        "ja": "位置情報エコーを発見",
        "ko": "위치 에코 발견",
        "zh": "发现位置回声",
        "ar": "اكتشف أصداء المواقع",
        "hi": "स्थान इको खोजें",
    },
    "events": {
        "de": "Live Karten-Events",
        "en": "Live map events",
        "fr": "Événements en direct sur la carte",
        "es": "Eventos en vivo del mapa",
        "it": "Eventi mappa in diretta",
        "pt": "Eventos ao vivo no mapa",
        "tr": "Canlı harita etkinlikleri",
        "ru": "Живые события карты",
        "ja": "ライブ地図イベント",
        "ko": "실시간 지도 이벤트",
        "zh": "实时地图事件",
        "ar": "أحداث الخريطة المباشرة",
        "hi": "लाइव मैप इवेंट्स",
    },
    "defense": {
        "de": "Verteidigungs-Minispiele",
        "en": "Defense mini-games",
        "fr": "Mini-jeux de défense",
        "es": "Mini-juegos de defensa",
        "it": "Mini-giochi di difesa",
        "pt": "Mini-jogos de defesa",
        "tr": "Savunma mini oyunları",
        "ru": "Мини-игры защиты",
        "ja": "防衛ミニゲーム",
        "ko": "방어 미니게임",
        "zh": "防守小游戏",
        "ar": "ألعاب الدفاع المصغرة",
        "hi": "रक्षा मिनी-गेम्स",
    },
    "clans": {
        "de": "Echte Clan-Battles",
        "en": "Real clan battles",
        "fr": "Vraies batailles de clans",
        "es": "Batallas de clanes reales",
        "it": "Battaglie tra clan reali",
        "pt": "Batalhas de clãs reais",
        "tr": "Gerçek klan savaşları",
        "ru": "Настоящие битвы кланов",
        "ja": "リアルなクランバトル",
        "ko": "진짜 클랜 배틀",
        "zh": "真实公会战",
        "ar": "معارك العشائر الحقيقية",
        "hi": "असली क्लान युद्ध",
    },
    "quests": {
        "de": "Stadt-Quests starten",
        "en": "Start city quests",
        "fr": "Lancer des quêtes urbaines",
        "es": "Iniciar misiones urbanas",
        "it": "Avvia missioni urbane",
        "pt": "Iniciar missões urbanas",
        "tr": "Şehir görevlerini başlat",
        "ru": "Запустить городские квесты",
        "ja": "街クエストを開始",
        "ko": "도시 퀘스트 시작",
        "zh": "开启城市任务",
        "ar": "ابدأ مهام المدينة",
        "hi": "शहर क्वेस्ट शुरू करें",
    },
    "features_hub": {
        "de": "Alle GPS-MMO-Features",
        "en": "All GPS MMO features",
        "fr": "Toutes les fonctionnalités GPS-MMO",
        "es": "Todas las funciones GPS-MMO",
        "it": "Tutte le funzioni GPS-MMO",
        "pt": "Todas as funções GPS-MMO",
        "tr": "Tüm GPS-MMO özellikleri",
        "ru": "Все функции GPS-MMO",
        "ja": "すべてのGPS-MMO機能",
        "ko": "모든 GPS-MMO 기능",
        "zh": "所有GPS-MMO功能",
        "ar": "جميع ميزات GPS-MMO",
        "hi": "सभी GPS-MMO सुविधाएँ",
    },
    "howto_hub": {
        "de": "GPS-Spiel-Anleitung",
        "en": "How to play the GPS game",
        "fr": "Comment jouer au jeu GPS",
        "es": "Cómo jugar al juego GPS",
        "it": "Come giocare al gioco GPS",
        "pt": "Como jogar o jogo GPS",
        "tr": "GPS oyunu nasıl oynanır",
        "ru": "Как играть в GPS-игру",
        "ja": "GPSゲームの遊び方",
        "ko": "GPS 게임 플레이 방법",
        "zh": "如何玩GPS游戏",
        "ar": "كيفية لعب لعبة GPS",
        "hi": "GPS गेम कैसे खेलें",
    },
    "home": {
        "de": "Zur Startseite — GPS-Territorium-Spiel",
        "en": "Back to home — GPS territory game",
        "fr": "Accueil — jeu de territoire GPS",
        "es": "Inicio — juego de territorio GPS",
        "it": "Home — gioco di territorio GPS",
        "pt": "Início — jogo de território GPS",
        "tr": "Ana sayfa — GPS bölge oyunu",
        "ru": "На главную — GPS-игра территорий",
        "ja": "ホームへ — GPSテリトリーゲーム",
        "ko": "홈으로 — GPS 영토 게임",
        "zh": "返回主页 — GPS领地游戏",
        "ar": "الصفحة الرئيسية — لعبة منطقة GPS",
        "hi": "होम — GPS क्षेत्र खेल",
    },
}


def feature_from_href(href: str) -> str | None:
    """Erkenne Ziel-Feature aus dem href-String."""
    h = href.lower()
    if re.search(r"features/?$", h) or h.rstrip("/").endswith("/features"):
        return "features_hub"
    if "howto" in h:
        return "howto_hub"
    if any(k in h for k in ["territor"]):  # territories, territoires, territorios, territori, territorien
        return "territories"
    if any(k in h for k in ["echos", "ecos", "echi"]):
        return "echos"
    if any(k in h for k in ["events", "evenements", "eventos", "eventi"]):
        return "events"
    if any(k in h for k in ["defense", "defensa", "difesa"]):
        return "defense"
    if any(k in h for k in ["clans", "clanes", "clan.html", "klan"]):
        return "clans"
    if any(k in h for k in ["quests", "quetes", "misiones", "missioni", "quetas"]):
        return "quests"
    # Wenn href = "/<lang>/" oder "/" (Home), dann home-Anker
    if re.fullmatch(r"/(?:[a-z]{2}/)?", h):
        return "home"
    return None


def detect_lang(html: str, path: Path) -> str | None:
    m = re.search(r'<html\s+lang="([a-z]{2})"', html)
    if m and m.group(1) in next(iter(KW.values())):
        return m.group(1)
    parts = path.relative_to(ROOT).parts
    if parts and parts[0] in next(iter(KW.values())):
        return parts[0]
    return "de"


def replace_anchors(html: str, lang: str) -> tuple[str, int]:
    """Ersetze Anchor-Texte in <a ...>...</a> wenn Text generisch ist."""
    n_changed = 0

    # Pattern: <a HREF="..." [class="..."]>INHALT</a>
    # Wir matchen non-greedy und prüfen INHALT auf generische Phrase.
    anchor_re = re.compile(r'(<a\b[^>]*\bhref="([^"]+)"[^>]*>)(.*?)(</a>)', re.DOTALL)

    def repl(m: re.Match) -> str:
        nonlocal n_changed
        full_open, href, inner, close = m.group(1), m.group(2), m.group(3), m.group(4)

        # Inner-Text ohne HTML-Tags
        text_only = re.sub(r"<[^>]+>", "", inner).strip()

        # Nur ersetzen wenn Text-Only EINE der generischen Phrasen IST (oder enthält + sehr kurz)
        is_generic = False
        for phrase in GENERIC_PHRASES:
            if text_only == phrase:
                is_generic = True
                break
            # Mit "→" oder ähnlichem Suffix
            if text_only in (phrase + " →", phrase + " ›"):
                is_generic = True
                break
        if not is_generic:
            return m.group(0)

        feature = feature_from_href(href)
        if not feature or feature not in KW:
            return m.group(0)

        new_text = KW[feature].get(lang)
        if not new_text:
            return m.group(0)

        # Text in inner austauschen, SVG/Icons beibehalten
        # Suche nach text_only im inner und ersetze
        new_inner = inner.replace(text_only, new_text, 1) if text_only in inner else new_text
        n_changed += 1
        return full_open + new_inner + close

    new_html = anchor_re.sub(repl, html)
    return new_html, n_changed


def main():
    print("=" * 60)
    print("Phase L — Killer-Keyword-Anker für interne Links")
    print("=" * 60)

    files = sorted(ROOT.rglob("*.html"))
    total_changed_files = 0
    total_anchors = 0

    for fp in files:
        try:
            html = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        lang = detect_lang(html, fp)
        if not lang:
            continue
        new_html, n = replace_anchors(html, lang)
        if n > 0:
            fp.write_text(new_html, encoding="utf-8")
            total_changed_files += 1
            total_anchors += n
            rel = fp.relative_to(ROOT).as_posix()
            print(f"✓ {n:>2} anchors · {rel}")

    print(f"\n{total_changed_files} Dateien geändert, {total_anchors} Anker insgesamt")


if __name__ == "__main__":
    main()

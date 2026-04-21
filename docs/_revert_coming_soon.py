"""Post-Launch: Revert Coming-Soon-Mode -> Play-Store-Links.

Idempotent via Marker-Check. Invertiert was _apply_coming_soon.py gemacht hat.

AUSFUEHRUNG ERST NACH PLAY-STORE-LAUNCH!

Vor Ausführung setzen:
    PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.mapraiders.app"

Aenderungen:
- mailto-Launch-Notify -> Play-Store-URL
- Localisierte "Coming Soon"-Labels -> "Download" / "Get it on Google Play"
- JSON-LD offers.availability: PreOrder -> InStock
- JSON-LD downloadUrl wieder einfuegen
- Marker <!-- COMING-SOON-MODE --> entfernen
"""
import re, pathlib, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

MARKER = "<!-- COMING-SOON-MODE -->"
ROOT = pathlib.Path(__file__).parent
MAILTO_RE = r'"mailto:info@scafa-investments\.com\?subject=MapRaiders[^"]*"'
PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.mapraiders.app"

# Lokalisierte Download-Labels (original Texte wiederherstellen)
LABELS = {
    "de": {"short": "In Kürze", "long": "In Kürze verfügbar", "notify": "Benachrichtigen",
           "new_short": "Download", "new_long": "Jetzt herunterladen", "new_notify": "Aus Google Play"},
    "en": {"short": "Coming Soon", "long": "Coming Soon", "notify": "Get Notified",
           "new_short": "Download", "new_long": "Download now", "new_notify": "Get it on Google Play"},
    "fr": {"short": "Bientôt", "long": "Bientôt disponible", "notify": "Être notifié",
           "new_short": "Télécharger", "new_long": "Télécharger maintenant", "new_notify": "Disponible sur Google Play"},
    "es": {"short": "Próximamente", "long": "Próximamente disponible", "notify": "Avísame",
           "new_short": "Descargar", "new_long": "Descargar ahora", "new_notify": "Disponible en Google Play"},
    "it": {"short": "Prossimamente", "long": "Prossimamente", "notify": "Avvisami",
           "new_short": "Scarica", "new_long": "Scarica ora", "new_notify": "Disponibile su Google Play"},
    "pt": {"short": "Em breve", "long": "Em breve disponível", "notify": "Avisar",
           "new_short": "Baixar", "new_long": "Baixar agora", "new_notify": "Disponível no Google Play"},
    "tr": {"short": "Yakında", "long": "Yakında", "notify": "Haber ver",
           "new_short": "İndir", "new_long": "Şimdi İndir", "new_notify": "Google Play'de"},
    "ru": {"short": "Скоро", "long": "Скоро будет доступно", "notify": "Уведомить",
           "new_short": "Скачать", "new_long": "Скачать сейчас", "new_notify": "Доступно в Google Play"},
    "ja": {"short": "近日公開", "long": "近日公開", "notify": "通知を受ける",
           "new_short": "ダウンロード", "new_long": "今すぐダウンロード", "new_notify": "Google Playで入手"},
    "ko": {"short": "출시 예정", "long": "출시 예정", "notify": "알림 받기",
           "new_short": "다운로드", "new_long": "지금 다운로드", "new_notify": "Google Play에서 받기"},
    "zh": {"short": "即将推出", "long": "即将推出", "notify": "通知我",
           "new_short": "下载", "new_long": "立即下载", "new_notify": "在Google Play上获取"},
    "ar": {"short": "قريباً", "long": "قريباً", "notify": "أعلمني",
           "new_short": "تحميل", "new_long": "تحميل الآن", "new_notify": "متوفر على Google Play"},
    "hi": {"short": "जल्द आ रहा है", "long": "जल्द आ रहा है", "notify": "सूचित करें",
           "new_short": "डाउनलोड", "new_long": "अभी डाउनलोड करें", "new_notify": "Google Play पर प्राप्त करें"},
}


def detect_lang(html: str) -> str:
    m = re.search(r'<html\s+lang="([a-z]{2})"', html)
    return m.group(1) if m and m.group(1) in LABELS else "en"


def revert_labels(html: str, lang: str) -> str:
    """Ersetze Coming-Soon Labels zurueck zu Download-Texten."""
    L = LABELS[lang]
    for old_key, new_key in [("short", "new_short"), ("long", "new_long"), ("notify", "new_notify")]:
        pat = rf'(<a\s[^>]*href="{re.escape(PLAY_STORE_URL)}"[^>]*>[^<]*)(?:{re.escape(L[old_key])})(\s|<)'
        html = re.sub(pat, rf'\1{L[new_key]}\2', html)
    return html


def revert_jsonld(html: str) -> str:
    """availability: PreOrder -> InStock, downloadUrl wieder einfuegen."""
    html = re.sub(
        r'"availability"\s*:\s*"https://schema\.org/PreOrder"',
        f'"availability": "https://schema.org/InStock", "url": "{PLAY_STORE_URL}"',
        html
    )
    html = re.sub(r',?\s*"priceValidUntil"\s*:\s*"[^"]*"', '', html)
    return html


def process(path: pathlib.Path) -> str:
    html = path.read_text(encoding="utf-8")
    if MARKER not in html:
        return f"NOOP {path.relative_to(ROOT)}"

    lang = detect_lang(html)

    # 1. mailto -> Play-Store-URL
    html = re.sub(MAILTO_RE, f'"{PLAY_STORE_URL}"', html)

    # 2. Coming-Soon Labels -> Download Labels
    html = revert_labels(html, lang)

    # 3. JSON-LD
    html = revert_jsonld(html)

    # 4. Marker entfernen
    html = html.replace(MARKER + "\n", "").replace(MARKER, "")

    path.write_text(html, encoding="utf-8")
    return f"OK   [{lang}] {path.relative_to(ROOT)}"


if __name__ == "__main__":
    if "--confirm" not in sys.argv:
        print("DRY-RUN MODE. Pass --confirm to actually write changes.")
        print(f"Play Store URL: {PLAY_STORE_URL}")
        print(f"Searching for files with marker: {MARKER}")
        count = sum(1 for p in ROOT.rglob("*.html") if MARKER in p.read_text(encoding="utf-8"))
        print(f"Found {count} files that would be reverted.")
        sys.exit(0)

    counts = {"OK": 0, "NOOP": 0}
    for path in ROOT.rglob("*.html"):
        result = process(path)
        print(result)
        tag = result.split()[0]
        counts[tag] = counts.get(tag, 0) + 1
    print(f"\nTotal: OK={counts['OK']} NOOP={counts['NOOP']}")

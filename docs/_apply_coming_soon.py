"""Coming-Soon-Mode: Download-Links -> mailto-Waitlist, Labels lokalisiert.
Idempotent via Marker COMING-SOON-MODE.

Rechtlich:
- Kein Download-Link ins Leere (keine Irrefuehrung nach UWG).
- Klare "Coming Soon"-Kommunikation in 13 Sprachen.
- mailto: als Waitlist-Platzhalter (User kann sich bei info@scafa-investments.com melden).
- JSON-LD: offers.availability -> PreOrder, downloadUrl entfernt.
"""
import re, pathlib, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

MARKER = "<!-- COMING-SOON-MODE -->"
ROOT = pathlib.Path(__file__).parent
MAILTO = "mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify"

# Lokalisierte Button-Labels (kurz + lang)
LABELS = {
    "de": {"short": "In Kürze", "long": "In Kürze verfügbar", "notify": "Benachrichtigen"},
    "en": {"short": "Coming Soon", "long": "Coming Soon", "notify": "Get Notified"},
    "fr": {"short": "Bientôt", "long": "Bientôt disponible", "notify": "Être notifié"},
    "es": {"short": "Próximamente", "long": "Próximamente disponible", "notify": "Avísame"},
    "it": {"short": "Prossimamente", "long": "Prossimamente", "notify": "Avvisami"},
    "pt": {"short": "Em breve", "long": "Em breve disponível", "notify": "Avisar"},
    "tr": {"short": "Yakında", "long": "Yakında", "notify": "Haber ver"},
    "ru": {"short": "Скоро", "long": "Скоро будет доступно", "notify": "Уведомить"},
    "ja": {"short": "近日公開", "long": "近日公開", "notify": "通知を受ける"},
    "ko": {"short": "출시 예정", "long": "출시 예정", "notify": "알림 받기"},
    "zh": {"short": "即将推出", "long": "即将推出", "notify": "通知我"},
    "ar": {"short": "قريباً", "long": "قريباً", "notify": "أعلمني"},
    "hi": {"short": "जल्द आ रहा है", "long": "जल्द आ रहा है", "notify": "सूचित करें"},
}

# Alte Download-Texte pro Sprache (aus Sichtung gesammelt)
# short: Nav-Button (minimal), long: Hero/CTA (prominent)
DL_TEXTS = {
    "de": ["Download", "Jetzt laden", "Jetzt herunterladen", "Kostenlos herunterladen",
           "Download starten", "Play Store", "Aus Google Play"],
    "en": ["Download", "Download from Google Play", "Download from Play Store",
           "Get it on Google Play", "Download now", "Download for free", "Play Store"],
    "fr": ["Télécharger", "Télécharger sur Google Play", "Play Store", "Télécharger gratuitement"],
    "es": ["Descargar", "Descargar en Google Play", "Play Store", "Descarga gratis"],
    "it": ["Scarica", "Scarica da Google Play", "Play Store", "Scarica gratis"],
    "pt": ["Baixar", "Baixar no Google Play", "Play Store", "Baixar grátis"],
    "tr": ["İndir", "Google Play'den İndir", "Play Store", "Ücretsiz İndir"],
    "ru": ["Скачать", "Скачать в Google Play", "Play Store", "Скачать бесплатно"],
    "ja": ["ダウンロード", "Google Playからダウンロード", "Play Store", "無料ダウンロード"],
    "ko": ["다운로드", "Google Play에서 다운로드", "Play Store", "무료 다운로드"],
    "zh": ["下载", "在Google Play下载", "Play Store", "免费下载"],
    "ar": ["تحميل", "تحميل من Google Play", "Play Store", "تحميل مجاني"],
    "hi": ["डाउनलोड", "Google Play से डाउनलोड", "Play Store", "मुफ्त डाउनलोड"],
}

# URLs die ersetzt werden sollen
URL_PATTERNS = [
    r'"/MapRaiders\.apk"',
    r'"https://mapraiders\.com/MapRaiders\.apk"',
    r'"https://play\.google\.com/store/apps/details\?id=com\.mapraiders(?:\.app)?"',
]


def detect_lang(html: str) -> str:
    m = re.search(r'<html\s+lang="([a-z]{2})"', html)
    return m.group(1) if m and m.group(1) in LABELS else "en"


def replace_download_labels(html: str, lang: str) -> str:
    """Replace button text labels that follow a mailto-href (after URL replacement)."""
    short = LABELS[lang]["short"]
    long_label = LABELS[lang]["long"]
    notify = LABELS[lang]["notify"]

    # Pattern: find <a href="mailto:...Launch..."...> ... TEXT </a>
    # Replace the text content that matches known DL_TEXTS.
    dl_alternatives = "|".join(re.escape(t) for t in DL_TEXTS[lang])

    def repl_anchor(m):
        opening = m.group(1)
        inner = m.group(2)
        closing = m.group(3)
        # Replace any matching DL text inside the anchor
        new_inner = re.sub(
            rf'(\s|>)({dl_alternatives})(\s|<)',
            lambda x: f'{x.group(1)}{short}{x.group(3)}',
            inner
        )
        return opening + new_inner + closing

    pattern = re.compile(
        r'(<a\s[^>]*href="mailto:info@scafa-investments\.com\?subject=MapRaiders[^"]*"[^>]*>)'
        r'(.*?)'
        r'(</a>)',
        re.DOTALL
    )
    return pattern.sub(repl_anchor, html)


def patch_jsonld(html: str) -> str:
    """Remove downloadUrl and add offers.availability = PreOrder."""
    # Remove downloadUrl line
    html = re.sub(
        r',?\s*"downloadUrl"\s*:\s*"[^"]*"',
        '',
        html
    )
    # Add availability to offers if present (idempotent via 'availability' check)
    def add_avail(m):
        block = m.group(0)
        if '"availability"' in block:
            return block
        # Insert availability before closing brace
        return block.rstrip(' }') + ', "availability": "https://schema.org/PreOrder", "priceValidUntil": "2026-12-31"}'

    html = re.sub(
        r'"offers"\s*:\s*\{\s*"@type"\s*:\s*"Offer"\s*,\s*"price"\s*:\s*"0"\s*,\s*"priceCurrency"\s*:\s*"[A-Z]{3}"\s*\}',
        add_avail,
        html
    )
    return html


def process(path: pathlib.Path) -> str:
    html = path.read_text(encoding="utf-8")
    had_marker = MARKER in html

    # 1. Replace download URLs with mailto (always, even if marker exists)
    changed = False
    for pat in URL_PATTERNS:
        if re.search(pat, html):
            html = re.sub(pat, f'"{MAILTO}"', html)
            changed = True

    if not changed:
        return f"SKIP {path.relative_to(ROOT)}" if had_marker else f"NOOP {path.relative_to(ROOT)}"

    # 2. Replace button labels inside mailto-anchors
    lang = detect_lang(html)
    html = replace_download_labels(html, lang)

    # 3. Patch JSON-LD
    html = patch_jsonld(html)

    # 4. Add marker at top of <head> (only if not already present)
    if not had_marker:
        html = re.sub(r'<head>', f'<head>\n{MARKER}', html, count=1)

    path.write_text(html, encoding="utf-8")
    return f"OK   [{lang}] {path.relative_to(ROOT)}"


if __name__ == "__main__":
    counts = {"OK": 0, "SKIP": 0, "NOOP": 0}
    for path in ROOT.rglob("*.html"):
        result = process(path)
        print(result)
        tag = result.split()[0]
        counts[tag] = counts.get(tag, 0) + 1
    print(f"\nTotal: OK={counts['OK']} SKIP={counts['SKIP']} NOOP={counts['NOOP']}")

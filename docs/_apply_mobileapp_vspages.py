# Adds MobileApplication JSON-LD schema to existing vs-pages.
# Idempotent via marker comment.
import re, pathlib, json, sys

MARKER = "<!-- MA-JSONLD-INJECTED -->"

def build_mobileapp(lang: str) -> str:
    if lang == "de":
        desc = "MapRaiders ist ein GPS-basiertes MMO fuer Android, das reale Gebiete in virtuelle Territorien verwandelt. Spieler laufen, radeln oder fahren um Land zu erobern, Quests zu erstellen und in Duellen zu kaempfen."
        features = [
            "GPS Territory Claiming",
            "Player-generated Quests",
            "Duels & Clan Battles",
            "Real-time Map",
            "Echoes & Artifacts",
            "Clan Formation",
            "Leaderboards",
            "Territory Decay System"
        ]
    else:
        desc = "MapRaiders is a GPS-based MMO for Android that turns real-world areas into virtual territories. Walk, cycle or drive to conquer land, create quests and fight duels."
        features = [
            "GPS Territory Claiming",
            "Player-generated Quests",
            "Duels & Clan Battles",
            "Real-time Map",
            "Echoes & Artifacts",
            "Clan Formation",
            "Leaderboards",
            "Territory Decay System"
        ]
    data = {
        "@context": "https://schema.org",
        "@type": "MobileApplication",
        "name": "MapRaiders",
        "operatingSystem": "ANDROID",
        "applicationCategory": "GameApplication",
        "description": desc,
        "featureList": features,
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "publisher": {
            "@type": "Organization",
            "name": "Scafa Investments LLC",
            "url": "https://scafa-investments.com/"
        }
    }
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>'

TARGETS = [
    ("docs/vs/pokemon-go.html", "de"),
    ("docs/vs/ingress.html", "de"),
    ("docs/en/vs/pokemon-go.html", "en"),
    ("docs/en/vs/ingress.html", "en"),
]

def process(path: str, lang: str) -> str:
    p = pathlib.Path(path)
    html = p.read_text(encoding="utf-8")
    if MARKER in html:
        return "SKIP " + path
    m = re.search(r'<script type="application/ld\+json">', html)
    if not m:
        return "MISS " + path
    inject = MARKER + build_mobileapp(lang)
    new_html = html[:m.start()] + inject + html[m.start():]
    p.write_text(new_html, encoding="utf-8")
    return "OK   " + path

if __name__ == "__main__":
    for path, lang in TARGETS:
        print(process(path, lang))

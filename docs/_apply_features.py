# Phase 3/4: Injects MobileApplication + HowTo JSON-LD into feature pages.
# Idempotent via marker. Does not touch existing FAQPage blocks on EN pages.
import re, pathlib, json

MARKER = "<!-- PHASE3-FEATURES -->"

MOBILE_APP_BASE = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "MapRaiders",
    "operatingSystem": "ANDROID",
    "applicationCategory": "GameApplication",
    "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
    "publisher": {
        "@type": "Organization",
        "name": "Scafa Investments LLC",
        "url": "https://scafa-investments.com/"
    }
}

# feature slug -> (DE feature desc, EN feature desc, DE HowTo, EN HowTo)
# HowTo fields: name, description, steps (list of (name, text))
FEATURES = {
    "quests_de": {
        "lang": "de",
        "path": "docs/features/quests.html",
        "mob_desc": "MapRaiders Quests: Erstelle GPS-Abenteuer, platziere Herausforderungen an echten Orten und steige im Level auf.",
        "howto": {
            "name": "Wie erstelle ich eine GPS-Quest in MapRaiders?",
            "description": "In wenigen Schritten eine Quest an einem realen Ort erstellen und mit Freunden teilen.",
            "steps": [
                ("App oeffnen", "Starte MapRaiders und aktiviere die Standortfreigabe."),
                ("Quest-Button druecken", "Tippe auf den Plus-Button in der Kartenansicht."),
                ("Ort waehlen", "Setze den Pin auf den gewuenschten GPS-Punkt in deiner Stadt."),
                ("Aufgabe definieren", "Schreibe Titel, Beschreibung und setze eine Belohnung."),
                ("Veroeffentlichen", "Poste die Quest, damit andere Spieler sie finden und loesen koennen.")
            ]
        }
    },
    "quests_en": {
        "lang": "en",
        "path": "docs/en/features/quests.html",
        "mob_desc": "MapRaiders Quests: create GPS adventures, place challenges at real places, level up in the real world.",
        "howto": {
            "name": "How do I create a GPS quest in MapRaiders?",
            "description": "Create a quest at a real-world location and share it with friends in a few steps.",
            "steps": [
                ("Open the app", "Launch MapRaiders and grant location permission."),
                ("Tap the quest button", "Press the plus button on the map view."),
                ("Pick a location", "Place the pin on the desired GPS point in your city."),
                ("Define the task", "Add a title, description and set a reward."),
                ("Publish", "Post the quest so other players can find and solve it.")
            ]
        }
    },
    "territorien_de": {
        "lang": "de",
        "path": "docs/features/territorien.html",
        "mob_desc": "MapRaiders Territorien: Laufe, renne oder fahre Rad, um reale Gebiete fuer dich und deinen Clan zu beanspruchen.",
        "howto": {
            "name": "Wie erobere ich ein Territorium in MapRaiders?",
            "description": "Ein Gebiet durch Bewegung im echten Leben beanspruchen.",
            "steps": [
                ("Standort aktivieren", "Aktiviere GPS und Hintergrund-Standort."),
                ("Bewegung starten", "Laufe, renne oder fahre Rad entlang der Grenzlinie."),
                ("Gebiet schliessen", "Kehre zum Startpunkt zurueck, um das Polygon zu schliessen."),
                ("Territorium halten", "Besuche das Territorium regelmaessig, um Decay zu verhindern."),
                ("Mini-Games aufstellen", "Platziere Defense-Games, damit Angreifer nicht einfach einnehmen koennen.")
            ]
        }
    },
    "territories_en": {
        "lang": "en",
        "path": "docs/en/features/territories.html",
        "mob_desc": "MapRaiders Territories: walk, run or cycle to claim real-world territory for yourself or your clan.",
        "howto": {
            "name": "How do I claim a territory in MapRaiders?",
            "description": "Claim a real-world area by moving in the physical world.",
            "steps": [
                ("Enable location", "Turn on GPS and background location."),
                ("Start moving", "Walk, run or cycle along the border line."),
                ("Close the area", "Return to your starting point to close the polygon."),
                ("Hold the territory", "Visit the territory regularly to prevent decay."),
                ("Deploy mini-games", "Place defense games so attackers cannot simply take it.")
            ]
        }
    },
    "echos_de": {
        "lang": "de",
        "path": "docs/features/echos.html",
        "mob_desc": "MapRaiders Echos: Hinterlasse Audio-, Foto- und Video-Nachrichten an echten GPS-Orten.",
        "howto": {
            "name": "Wie hinterlasse ich ein Echo in MapRaiders?",
            "description": "Ein Medien-Echo an einem echten Ort platzieren.",
            "steps": [
                ("Ort aufsuchen", "Gehe physisch an den Ort, an dem das Echo liegen soll."),
                ("Echo-Button druecken", "Tippe auf das Mikrofon- oder Kamera-Symbol."),
                ("Medium aufnehmen", "Nimm Audio, Foto oder Video direkt in der App auf."),
                ("Sichtbarkeit waehlen", "Entscheide, ob das Echo oeffentlich oder clan-intern ist."),
                ("Veroeffentlichen", "Das Echo ist nun fuer andere Spieler an diesem Ort sichtbar.")
            ]
        }
    },
    "echos_en": {
        "lang": "en",
        "path": "docs/en/features/echos.html",
        "mob_desc": "MapRaiders Echos: leave audio, photo and video messages at real-world GPS locations.",
        "howto": {
            "name": "How do I leave an Echo in MapRaiders?",
            "description": "Place a media echo at a real location.",
            "steps": [
                ("Go to the place", "Physically walk to the location where the echo should live."),
                ("Tap the echo button", "Press the microphone or camera icon."),
                ("Record the media", "Record audio, photo or video directly inside the app."),
                ("Choose visibility", "Decide whether the echo is public or clan-internal."),
                ("Publish", "The echo is now visible to other players at that location.")
            ]
        }
    },
    "defense_de": {
        "lang": "de",
        "path": "docs/features/defense.html",
        "mob_desc": "MapRaiders Defense-Games: Schuetze Territorien mit sieben GPS-basierten Mini-Games.",
        "howto": {
            "name": "Wie verteidige ich mein Territorium mit Mini-Games?",
            "description": "Defense-Games platzieren und Angreifer zurueckschlagen.",
            "steps": [
                ("Territorium oeffnen", "Tippe in der Karte auf eines deiner Gebiete."),
                ("Defense-Tab waehlen", "Oeffne den Verteidigungs-Bereich des Territoriums."),
                ("Mini-Game auswaehlen", "Waehle aus sieben Spielen, z.B. Schnick Schnack Schnuck."),
                ("Schwierigkeit einstellen", "Lege Reaktionszeit oder Runden fest."),
                ("Aktivieren", "Angreifer muessen das Spiel loesen, um das Gebiet zu uebernehmen.")
            ]
        }
    },
    "defense_en": {
        "lang": "en",
        "path": "docs/en/features/defense-games.html",
        "mob_desc": "MapRaiders Defense Games: protect territories with seven GPS-based mini-games.",
        "howto": {
            "name": "How do I defend my territory with mini-games?",
            "description": "Place defense games to repel attackers.",
            "steps": [
                ("Open the territory", "Tap one of your territories on the map."),
                ("Go to the defense tab", "Open the defense section of the territory."),
                ("Pick a mini-game", "Choose from seven games, e.g. Rock-Paper-Scissors."),
                ("Set difficulty", "Configure reaction time or rounds."),
                ("Activate", "Attackers must beat the game to take the area.")
            ]
        }
    },
    "events_de": {
        "lang": "de",
        "path": "docs/features/events.html",
        "mob_desc": "MapRaiders Events: Erstelle spontane Treffen an GPS-Orten und lerne echte Menschen in deiner Naehe kennen.",
        "howto": {
            "name": "Wie erstelle ich ein Event in MapRaiders?",
            "description": "Ein spontanes Meetup an einem GPS-Ort starten.",
            "steps": [
                ("Events-Tab oeffnen", "Gehe in der App zum Events-Bereich."),
                ("Event erstellen", "Tippe auf den Plus-Button und setze Titel + Typ."),
                ("Ort und Zeit waehlen", "Pin den GPS-Ort und waehle eine Startzeit."),
                ("Teilnehmerzahl festlegen", "Bestimme, wie viele Spieler mitmachen koennen."),
                ("Veroeffentlichen", "Das Event erscheint auf der Karte fuer Spieler in der Naehe.")
            ]
        }
    },
    "events_en": {
        "lang": "en",
        "path": "docs/en/features/events.html",
        "mob_desc": "MapRaiders Events: create spontaneous meetups at GPS locations and meet real people nearby.",
        "howto": {
            "name": "How do I create an event in MapRaiders?",
            "description": "Start a spontaneous meetup at a GPS location.",
            "steps": [
                ("Open the events tab", "Go to the events section inside the app."),
                ("Create an event", "Tap plus and set title + type."),
                ("Pick place and time", "Pin the GPS location and choose a start time."),
                ("Set participant count", "Decide how many players can join."),
                ("Publish", "The event shows up on the map for nearby players.")
            ]
        }
    },
    "social_de": {
        "lang": "de",
        "path": "docs/features/social.html",
        "mob_desc": "MapRaiders Social: Finde Freunde im echten Leben, gruende einen Clan und erobere gemeinsam Gebiete.",
        "howto": {
            "name": "Wie gruende ich einen Clan in MapRaiders?",
            "description": "Einen Clan starten und Freunde einladen.",
            "steps": [
                ("Profil oeffnen", "Gehe in der App zu deinem Profil."),
                ("Clans-Tab waehlen", "Oeffne den Clans-Bereich."),
                ("Clan gruenden", "Tippe auf Gruenden und gib einen Namen ein."),
                ("Mitglieder einladen", "Verschicke Einladungen an Freunde oder nahe Spieler."),
                ("Gebiet beanspruchen", "Erobert gemeinsam euer erstes Clan-Territorium.")
            ]
        }
    },
    "clans_en": {
        "lang": "en",
        "path": "docs/en/features/clans.html",
        "mob_desc": "MapRaiders Social: find real-world friends, found a clan and claim territory together.",
        "howto": {
            "name": "How do I found a clan in MapRaiders?",
            "description": "Start a clan and invite friends.",
            "steps": [
                ("Open your profile", "Go to your profile in the app."),
                ("Go to the clans tab", "Open the clans section."),
                ("Found a clan", "Tap found and choose a name."),
                ("Invite members", "Send invites to friends or nearby players."),
                ("Claim territory", "Together claim your first clan territory.")
            ]
        }
    },
}


def build_mobileapp(desc: str) -> dict:
    d = dict(MOBILE_APP_BASE)
    d["description"] = desc
    return d


def build_howto(h: dict) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": h["name"],
        "description": h["description"],
        "step": [
            {"@type": "HowToStep", "position": i + 1, "name": n, "text": t}
            for i, (n, t) in enumerate(h["steps"])
        ],
    }


def process(entry: dict) -> str:
    p = pathlib.Path(entry["path"])
    html = p.read_text(encoding="utf-8")
    if MARKER in html:
        return "SKIP " + entry["path"]
    mob = json.dumps(build_mobileapp(entry["mob_desc"]), ensure_ascii=False)
    howto = json.dumps(build_howto(entry["howto"]), ensure_ascii=False)
    inject = (
        MARKER
        + '<script type="application/ld+json">' + mob + '</script>'
        + '<script type="application/ld+json">' + howto + '</script>'
    )
    # Inject right before </head>
    m = re.search(r'</head>', html, re.IGNORECASE)
    if not m:
        return "MISS " + entry["path"]
    new_html = html[:m.start()] + inject + html[m.start():]
    p.write_text(new_html, encoding="utf-8")
    return "OK   " + entry["path"]


if __name__ == "__main__":
    for key, entry in FEATURES.items():
        print(process(entry))

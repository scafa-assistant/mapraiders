"""Schema-Lücken schließen: HowTo + FAQPage + MobileApplication.

Fixes:
1. HowTo JSON-LD auf alle howto/*.html die es noch nicht haben
2. FAQPage JSON-LD auf DE-Root features/*.html (6 Seiten)
3. MobileApplication JSON-LD auf ALLE Unterseiten die es noch nicht haben

Idempotent: Prüft ob Schema schon existiert bevor es eingefügt wird.
"""
import re, json, pathlib, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = pathlib.Path(__file__).parent

# ============================================================
# 1. HowTo Schema data per topic (EN + DE)
# ============================================================

HOWTO_SCHEMAS = {
    # --- EN ---
    "en/howto/territories.html": {
        "name": "How to Claim Territory in MapRaiders",
        "description": "Step-by-step guide to claiming real-world territory using GPS movement in MapRaiders.",
        "step": [
            {"name": "Open MapRaiders and start walking", "text": "Launch the app and tap 'Start Claiming'. Your GPS position is tracked as you move."},
            {"name": "Trace a path around the area", "text": "Walk, run, or cycle to draw a polygon on the map. The path must enclose at least 500 square meters."},
            {"name": "Close the polygon", "text": "Return to your starting point to close the shape. The app detects when you are close enough to seal the territory."},
            {"name": "Submit your claim", "text": "Tap 'Claim Territory'. Your movement multiplier (1.0× walk, 2.5× run, 1.3× cycle) is applied to the territory value."},
            {"name": "Defend and maintain", "text": "Visit your territory regularly or place Echos to prevent decay. Territories lose value after 7 days without activity."}
        ]
    },
    "en/howto/echos.html": {
        "name": "How to Leave Echos in MapRaiders",
        "description": "Learn how to create location-bound audio, photo, and video messages called Echos.",
        "step": [
            {"name": "Navigate to a location", "text": "Walk to the spot where you want to leave an Echo. You must be physically present at the GPS coordinates."},
            {"name": "Tap Create Echo", "text": "Open the Echo creation screen from the map view. Choose between audio, photo, or video format."},
            {"name": "Record your message", "text": "Record an audio clip (up to 60 seconds), take a photo, or shoot a short video. Add a text caption if desired."},
            {"name": "Set visibility and duration", "text": "Choose who can discover your Echo: everyone, friends only, or clan members. Set how long it remains active."},
            {"name": "Place the Echo", "text": "Confirm placement. The Echo is now anchored to that GPS location. Other players will discover it when they walk nearby."}
        ]
    },
    "en/howto/clans.html": {
        "name": "How to Join or Create a Clan in MapRaiders",
        "description": "Guide to the organic clan system — clans form automatically when players conquer territory together.",
        "step": [
            {"name": "Claim territory near other players", "text": "When multiple players claim adjacent territories, the clan formation algorithm detects the cluster."},
            {"name": "Receive clan invitation", "text": "After enough shared territory activity, all nearby players receive an automatic clan formation notification."},
            {"name": "Accept or decline", "text": "Tap the notification to join the clan. You can also decline and remain independent."},
            {"name": "Collaborate on defense", "text": "Clan members can defend each other's territories through defense mini-games and shared bonuses."},
            {"name": "Grow your clan territory", "text": "Expand as a group. Connected clan territories earn bonus multipliers and unlock clan-exclusive events."}
        ]
    },
    "en/howto/defense-minigames.html": {
        "name": "How to Defend Territory with Mini-Games in MapRaiders",
        "description": "Step-by-step guide to defending your territory through Tic Tac Toe, Rock Paper Scissors, and Mini Chess.",
        "step": [
            {"name": "Receive attack notification", "text": "When another player challenges your territory, you get a push notification with the attacker's name and territory at stake."},
            {"name": "Choose a defense game", "text": "Select from Tic Tac Toe, Rock Paper Scissors, or Mini Chess. Each game has different time limits and strategy depth."},
            {"name": "Play the mini-game", "text": "Compete in real-time against the attacker. Games are turn-based with a 30-second timer per move."},
            {"name": "Win to keep your territory", "text": "If you win, your territory is safe and gains a defense bonus multiplier. The attacker loses their challenge attempt."},
            {"name": "Lose gracefully", "text": "If you lose, the attacker claims a portion of your territory. You keep the rest and can reclaim it later."}
        ]
    },
    "en/howto/index.html": {
        "name": "How to Get Started with MapRaiders",
        "description": "Complete beginner's guide to MapRaiders — from download to your first territory claim.",
        "step": [
            {"name": "Download MapRaiders", "text": "Install MapRaiders from the Google Play Store or download the APK directly from mapraiders.com. The app is 100% free with no ads."},
            {"name": "Create your account", "text": "Sign up with your email or sign in with Google. Choose a unique username that will be visible on the map."},
            {"name": "Enable GPS permissions", "text": "Allow location access so the app can track your movement. MapRaiders needs GPS to function — it is a real-world outdoor game."},
            {"name": "Claim your first territory", "text": "Start walking to trace a polygon on the map. Close the shape and tap Claim. Congratulations — you own real-world territory."},
            {"name": "Explore features", "text": "Leave Echos at locations, join spontaneous events, defend your territory in mini-games, and connect with nearby players."}
        ]
    },
    # --- DE ---
    "howto/territorien.html": {
        "name": "So eroberst du Territorien in MapRaiders",
        "description": "Schritt-für-Schritt-Anleitung zum Erobern von echten Gebieten per GPS-Bewegung in MapRaiders.",
        "step": [
            {"name": "MapRaiders öffnen und loslaufen", "text": "Starte die App und tippe auf 'Territorium beanspruchen'. Deine GPS-Position wird während der Bewegung verfolgt."},
            {"name": "Einen Pfad um das Gebiet ziehen", "text": "Laufe, jogge oder fahre Rad, um ein Polygon auf der Karte zu zeichnen. Der Pfad muss mindestens 500 Quadratmeter umschließen."},
            {"name": "Das Polygon schließen", "text": "Kehre zum Startpunkt zurück, um die Form zu schließen. Die App erkennt, wenn du nah genug am Ausgangspunkt bist."},
            {"name": "Anspruch einreichen", "text": "Tippe auf 'Territorium beanspruchen'. Dein Bewegungsmultiplikator (1,0× Gehen, 2,5× Joggen, 1,3× Radfahren) wird auf den Gebietswert angewendet."},
            {"name": "Verteidigen und pflegen", "text": "Besuche dein Territorium regelmäßig oder platziere Echos, um Verfall zu verhindern. Territorien verlieren nach 7 Tagen ohne Aktivität an Wert."}
        ]
    },
    "howto/echos.html": {
        "name": "So hinterlässt du Echos in MapRaiders",
        "description": "Anleitung zum Erstellen standortgebundener Audio-, Foto- und Videonachrichten (Echos).",
        "step": [
            {"name": "Zum gewünschten Ort gehen", "text": "Gehe zu der Stelle, an der du ein Echo hinterlassen möchtest. Du musst physisch an den GPS-Koordinaten anwesend sein."},
            {"name": "Echo erstellen antippen", "text": "Öffne den Echo-Erstellungsbildschirm aus der Kartenansicht. Wähle zwischen Audio-, Foto- oder Videoformat."},
            {"name": "Nachricht aufnehmen", "text": "Nimm einen Audioclip (bis 60 Sekunden) auf, mache ein Foto oder drehe ein kurzes Video. Füge optional einen Textkommentar hinzu."},
            {"name": "Sichtbarkeit und Dauer festlegen", "text": "Wähle, wer dein Echo entdecken kann: alle Spieler, nur Freunde oder Clan-Mitglieder. Bestimme die aktive Dauer."},
            {"name": "Echo platzieren", "text": "Bestätige die Platzierung. Das Echo ist jetzt an diesen GPS-Standort gebunden. Andere Spieler entdecken es, wenn sie in der Nähe vorbeikommen."}
        ]
    },
    "howto/clans.html": {
        "name": "So trittst du einem Clan bei oder gründest einen in MapRaiders",
        "description": "Anleitung zum organischen Clan-System — Clans bilden sich automatisch, wenn Spieler gemeinsam Gebiete erobern.",
        "step": [
            {"name": "Territorien nahe anderer Spieler beanspruchen", "text": "Wenn mehrere Spieler benachbarte Territorien beanspruchen, erkennt der Clan-Algorithmus das Cluster."},
            {"name": "Clan-Einladung erhalten", "text": "Nach ausreichender gemeinsamer Territorienaktivität erhalten alle Spieler in der Nähe eine automatische Clan-Bildungsbenachrichtigung."},
            {"name": "Annehmen oder ablehnen", "text": "Tippe auf die Benachrichtigung, um dem Clan beizutreten. Du kannst auch ablehnen und unabhängig bleiben."},
            {"name": "Gemeinsam verteidigen", "text": "Clan-Mitglieder können die Territorien der anderen durch Verteidigungs-Minispiele und gemeinsame Boni schützen."},
            {"name": "Clan-Territorium vergrößern", "text": "Expandiere als Gruppe. Verbundene Clan-Territorien erhalten Bonus-Multiplikatoren und schalten Clan-exklusive Events frei."}
        ]
    },
    "howto/verteidigungs-minispiele.html": {
        "name": "So verteidigst du Territorien mit Minispielen in MapRaiders",
        "description": "Schritt-für-Schritt-Anleitung zur Territorienverteidigung durch Tic Tac Toe, Schere Stein Papier und Mini-Schach.",
        "step": [
            {"name": "Angriffs-Benachrichtigung erhalten", "text": "Wenn ein anderer Spieler dein Territorium herausfordert, erhältst du eine Push-Benachrichtigung mit dem Namen des Angreifers."},
            {"name": "Verteidigungsspiel wählen", "text": "Wähle zwischen Tic Tac Toe, Schere Stein Papier oder Mini-Schach. Jedes Spiel hat unterschiedliche Zeitlimits und Strategietiefe."},
            {"name": "Minispiel spielen", "text": "Tritt in Echtzeit gegen den Angreifer an. Die Spiele sind rundenbasiert mit einem 30-Sekunden-Timer pro Zug."},
            {"name": "Gewinnen und Territorium behalten", "text": "Bei Sieg bleibt dein Territorium sicher und erhält einen Verteidigungs-Bonus-Multiplikator."},
            {"name": "Verlust verkraften", "text": "Bei Niederlage beansprucht der Angreifer einen Teil deines Territoriums. Den Rest behältst du und kannst zurückerobern."}
        ]
    },
    "howto/index.html": {
        "name": "So startest du mit MapRaiders",
        "description": "Komplette Anfänger-Anleitung für MapRaiders — vom Download bis zum ersten Territorium.",
        "step": [
            {"name": "MapRaiders herunterladen", "text": "Installiere MapRaiders aus dem Google Play Store oder lade die APK direkt von mapraiders.com herunter. Die App ist 100% kostenlos und werbefrei."},
            {"name": "Account erstellen", "text": "Registriere dich mit deiner E-Mail oder melde dich mit Google an. Wähle einen einzigartigen Benutzernamen, der auf der Karte sichtbar wird."},
            {"name": "GPS-Berechtigung aktivieren", "text": "Erlaube den Standortzugriff, damit die App deine Bewegung verfolgen kann. MapRaiders braucht GPS — es ist ein Outdoor-Spiel in der echten Welt."},
            {"name": "Erstes Territorium erobern", "text": "Laufe los und zeichne ein Polygon auf der Karte. Schließe die Form und tippe auf Beanspruchen. Glückwunsch — du besitzt echtes Gebiet."},
            {"name": "Features erkunden", "text": "Hinterlasse Echos an Orten, nimm an spontanen Events teil, verteidige dein Gebiet in Minispielen und verbinde dich mit Spielern in der Nähe."}
        ]
    },
}

# ============================================================
# 2. FAQPage data for DE feature pages
# ============================================================

DE_FEATURE_FAQS = {
    "features/territorien.html": [
        {"q": "Wie funktioniert das Territorien-System in MapRaiders?", "a": "MapRaiders verwendet GPS-Tracking, um Spielerbewegungen aufzuzeichnen. Spieler laufen, joggen oder radeln, um ein Polygon auf der Karte zu zeichnen. Sobald das Polygon geschlossen wird (mindestens 500 m²), wird das eingeschlossene Gebiet als Territorium beansprucht."},
        {"q": "Was sind Bewegungsmultiplikatoren?", "a": "Bewegungsmultiplikatoren erhöhen den Territorienwert basierend auf der Fortbewegungsart. Gehen ergibt ×1,0, Joggen ×2,5, Radfahren ×1,3. Zusätzlich gibt es Wetter-Boni (×1,3–2,0 bei Regen/Schnee) und Streak-Multiplikatoren (×1,1–2,5 für aufeinanderfolgende Tage)."},
        {"q": "Wie funktioniert der Territorien-Verfall?", "a": "Territorien verfallen über 7 Tage ohne Pflege. Jeden Tag verlieren Territorien schrittweise an Wert. Um Territorien stark zu halten, besuche das Gebiet erneut oder platziere ein Echo, um die Lebensdauer zu verlängern."},
        {"q": "Kann ich Territorien von anderen Spielern erobern?", "a": "MapRaiders erlaubt Territorien-Herausforderungen durch Verteidigungs-Minispiele (Tic Tac Toe, Schere Stein Papier, Mini-Schach). Der Verteidiger wählt das Spiel, der Angreifer muss gewinnen, um einen Teil des Territoriums zu übernehmen."}
    ],
    "features/echos.html": [
        {"q": "Was sind Echos in MapRaiders?", "a": "Echos sind standortgebundene Nachrichten, die Spieler an realen GPS-Koordinaten hinterlassen. Echos können Audio-Aufnahmen (bis 60 Sekunden), Fotos oder kurze Videos enthalten. Andere Spieler entdecken Echos, wenn sie physisch in der Nähe des Standorts vorbeikommen."},
        {"q": "Wie weit reicht ein Echo?", "a": "Echos haben einen Entdeckungsradius von 50 Metern. Spieler müssen sich innerhalb dieses Radius befinden, um ein Echo zu hören oder zu sehen. Der Radius kann durch Upgrades und Clan-Boni erweitert werden."},
        {"q": "Sind Echos dauerhaft?", "a": "Echos haben eine einstellbare Lebensdauer. Spieler können beim Erstellen wählen, wie lange das Echo aktiv bleibt. Echos an beliebten Orten mit vielen Interaktionen bleiben länger bestehen als unbesuchte Echos."}
    ],
    "features/events.html": [
        {"q": "Was sind Spontan-Events in MapRaiders?", "a": "Spontan-Events sind Echtzeit-Treffen auf der Karte. Spieler können Events an ihrem aktuellen Standort erstellen, die für andere Spieler in der Nähe sichtbar werden. Events haben einen Countdown und verschwinden nach Ablauf automatisch."},
        {"q": "Wie erstelle ich ein Event?", "a": "Tippe auf der Karte auf 'Event erstellen', wähle einen Typ (Treffen, Raid, Handel, Social) und setze eine Dauer. Das Event erscheint sofort für alle Spieler im Umkreis. Keine Voranmeldung nötig — einfach hingehen."},
        {"q": "Bekomme ich Belohnungen für Events?", "a": "Event-Teilnehmer erhalten XP-Boni, Territorien-Multiplikatoren und exklusive Achievements. Event-Ersteller erhalten zusätzliche Community-Punkte, die ihren Ruf auf der Karte steigern."}
    ],
    "features/quests.html": [
        {"q": "Was sind Quests in MapRaiders?", "a": "Quests sind spielerkreierte Aufgaben, die an reale GPS-Standorte gebunden sind. Spieler können mehrstufige Quests erstellen, die andere Spieler zu verschiedenen Orten in ihrer Stadt führen. Jede Quest-Station kann Rätsel, Foto-Aufgaben oder Entdeckungsaufgaben enthalten."},
        {"q": "Wie erstelle ich eine Quest?", "a": "Gehe zu den Orten, die du in deine Quest einbauen willst, und setze Wegpunkte. Füge an jedem Punkt eine Aufgabe hinzu (Text, Foto-Challenge, Quiz). Veröffentliche die Quest und andere Spieler können sie starten."},
        {"q": "Werden Quests bewertet?", "a": "Quests erhalten Bewertungen von Spielern, die sie abschließen. Hoch bewertete Quests werden prominenter auf der Karte angezeigt. Quest-Ersteller mit konstant guten Bewertungen erhalten den Titel 'Quest Master'."}
    ],
    "features/defense.html": [
        {"q": "Wie funktioniert die Territorienverteidigung?", "a": "Wenn ein Spieler dein Territorium angreift, erhältst du eine Benachrichtigung. Du wählst ein Verteidigungs-Minispiel: Tic Tac Toe, Schere Stein Papier oder Mini-Schach. Der Kampf findet in Echtzeit statt mit einem 30-Sekunden-Timer pro Zug."},
        {"q": "Was passiert wenn ich verliere?", "a": "Bei einer Niederlage beansprucht der Angreifer einen Teil deines Territoriums. Du behältst den Rest und kannst das verlorene Gebiet jederzeit zurückerobern, indem du den Angreifer erneut herausforderst."},
        {"q": "Gibt es Verteidigungs-Boni?", "a": "Erfolgreiche Verteidigungen erhöhen den Verteidigungs-Multiplikator deines Territoriums. Nach 3 erfolgreichen Verteidigungen in Folge erhält das Territorium einen 'Festung'-Status mit reduziertem Verfall und stärkerem Schutz."}
    ],
    "features/social.html": [
        {"q": "Wie funktioniert das Soziale in MapRaiders?", "a": "MapRaiders ist ein soziales Outdoor-Netzwerk. Spieler sehen andere auf der Karte, können Freundschaftsanfragen senden, sich zu Spontan-Events treffen und über Echos kommunizieren. Es gibt keinen Feed und keinen Algorithmus — nur echte Interaktionen in der echten Welt."},
        {"q": "Kann ich mit Freunden spielen?", "a": "MapRaiders unterstützt Freundeslisten, gemeinsame Territorien-Eroberung, Clan-Bildung und kooperative Events. Freunde sehen sich gegenseitig auf der Karte und können einander bei der Territorienverteidigung helfen."},
        {"q": "Ist MapRaiders eine Social-Media-Alternative?", "a": "MapRaiders ersetzt das passive Scrollen durch aktives Erleben. Statt Feeds und Likes gibt es echte Orte, echte Bewegung und echte Begegnungen. MapRaiders ist 100% werbefrei und sammelt keine Daten für Werbezwecke."}
    ],
}

# ============================================================
# 3. MobileApplication Schema (compact, for injection)
# ============================================================

MOBILE_APP_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "MapRaiders",
    "applicationCategory": "GameApplication",
    "applicationSubCategory": "SocialNetworkingApplication",
    "operatingSystem": "Android",
    "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
    "author": {"@type": "Organization", "name": "Scafa Investments LLC", "url": "https://scafa-investments.com/"}
}


def build_howto_jsonld(data: dict) -> str:
    schema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": data["name"],
        "description": data["description"],
        "step": []
    }
    for i, s in enumerate(data["step"], 1):
        schema["step"].append({
            "@type": "HowToStep",
            "position": i,
            "name": s["name"],
            "text": s["text"]
        })
    return json.dumps(schema, ensure_ascii=False, indent=2)


def build_faqpage_jsonld(faqs: list) -> str:
    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": []
    }
    for faq in faqs:
        schema["mainEntity"].append({
            "@type": "Question",
            "name": faq["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq["a"]
            }
        })
    return json.dumps(schema, ensure_ascii=False, indent=2)


def inject_jsonld(html: str, jsonld_str: str, schema_type: str) -> str:
    """Inject JSON-LD before </head> if schema_type not already present."""
    if f'"@type": "{schema_type}"' in html or f'"@type":"{schema_type}"' in html:
        return html  # Already exists

    tag = f'<script type="application/ld+json">\n{jsonld_str}\n</script>\n'

    # Insert before </head>
    if '</head>' in html:
        html = html.replace('</head>', tag + '</head>', 1)
    return html


def process_howto(dry_run: bool) -> int:
    count = 0
    for relpath, data in HOWTO_SCHEMAS.items():
        fpath = ROOT / relpath
        if not fpath.exists():
            print(f"SKIP (not found) {relpath}")
            continue
        html = fpath.read_text(encoding='utf-8')
        if '"HowTo"' in html:
            print(f"NOOP (exists)    {relpath}")
            continue
        jsonld = build_howto_jsonld(data)
        new_html = inject_jsonld(html, jsonld, "HowTo")
        if new_html != html:
            if not dry_run:
                fpath.write_text(new_html, encoding='utf-8')
            print(f"OK   (HowTo)     {relpath}")
            count += 1
    return count


def process_faqpage(dry_run: bool) -> int:
    count = 0
    for relpath, faqs in DE_FEATURE_FAQS.items():
        fpath = ROOT / relpath
        if not fpath.exists():
            print(f"SKIP (not found) {relpath}")
            continue
        html = fpath.read_text(encoding='utf-8')
        if '"FAQPage"' in html:
            print(f"NOOP (exists)    {relpath}")
            continue
        jsonld = build_faqpage_jsonld(faqs)
        new_html = inject_jsonld(html, jsonld, "FAQPage")
        if new_html != html:
            if not dry_run:
                fpath.write_text(new_html, encoding='utf-8')
            print(f"OK   (FAQPage)   {relpath}")
            count += 1
    return count


def process_mobileapp(dry_run: bool) -> int:
    count = 0
    jsonld = json.dumps(MOBILE_APP_SCHEMA, ensure_ascii=False, indent=2)
    for fpath in ROOT.rglob("*.html"):
        rel = fpath.relative_to(ROOT)
        # Skip build scripts, backups, non-content
        if str(rel).startswith('_') or 'backup' in str(rel).lower():
            continue
        html = fpath.read_text(encoding='utf-8')
        if '"MobileApplication"' in html:
            continue  # Already has it
        if '</head>' not in html:
            continue  # Not a proper HTML page
        new_html = inject_jsonld(html, jsonld, "MobileApplication")
        if new_html != html:
            if not dry_run:
                fpath.write_text(new_html, encoding='utf-8')
            print(f"OK   (MobileApp) {rel}")
            count += 1
    return count


if __name__ == "__main__":
    dry_run = "--confirm" not in sys.argv
    if dry_run:
        print("=== DRY-RUN MODE === (pass --confirm to write changes)\n")

    print("--- HowTo Schema ---")
    c1 = process_howto(dry_run)
    print(f"\n--- FAQPage Schema (DE features) ---")
    c2 = process_faqpage(dry_run)
    print(f"\n--- MobileApplication Schema ---")
    c3 = process_mobileapp(dry_run)

    print(f"\n{'DRY-RUN ' if dry_run else ''}TOTAL: HowTo={c1} FAQPage={c2} MobileApp={c3}")

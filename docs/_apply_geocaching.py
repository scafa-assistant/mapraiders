"""
Erzeugt docs/vs/geocaching.html (DE) und docs/en/vs/geocaching.html (EN) als
Vergleichsseite MapRaiders vs Geocaching aus dem pokemon-go Template.
"""

from pathlib import Path
import re

ROOT = Path(__file__).parent

# ------------------ DE ------------------
DE = {
    "canonical_from": "https://mapraiders.com/vs/pokemon-go.html",
    "canonical_to": "https://mapraiders.com/vs/geocaching.html",
    "title": "MapRaiders vs Geocaching: Territorien statt Caches, soziale Map statt Logbuch",
    "desc": "MapRaiders vs Geocaching: Statt Koordinaten abhaken — echte Territorien, Echos, Spontan-Events, aktives Gameplay. Die soziale Karte fuer Outdoor.",
    "og_loc": "de_DE",
    "keywords": "Geocaching Alternative, Geocaching Alternative App, Outdoor Social App, Territorienspiel, GPS Spiel kostenlos",
    "hero_badge": "⚔ Vergleich",
    "h1_left": "MapRaiders vs",
    "h1_right": "Geocaching",
    "hero_p": "Geocaching ist ein Klassiker — aber auch <strong>solitär, statisch und um Caches herum gebaut</strong>. MapRaiders ist das Gegenteil: echte Territorien auf der Karte, Echos, Spontan-Events und direkte Begegnungen mit anderen Menschen.",
    "back_link": "Zurueck zur Startseite",
    "sec1_h2_left": "Die",
    "sec1_h2_em": "Ehrliche",
    "sec1_h2_right": "Wahrheit",
    "sec1_p": "Geocaching erfand die GPS-Schatzsuche und hat seit 2000 Millionen Fans. Aber das Modell ist statisch: Koordinaten finden, Logbuch signieren, weiterziehen. Kaum soziale Interaktion, kein aktives Gameplay, keine echten Territorien.",
    "comp_left_name": "Geocaching",
    "comp_left_desc": "Der Ursprung der GPS-Schatzsuche. Millionen versteckter Caches weltweit, lange Community-Geschichte, verlässliche App. Perfekt für Einzel- und Familienausflüge.",
    "comp_left_strengths": [
        "Riesige bestehende Cache-Datenbank (3+ Mio)",
        "Etablierte Community seit 2000",
        "Familien- und anfaengerfreundlich",
        "Viele Cache-Typen (Traditional, Multi, Mystery)",
        "Offline-Funktionen fuer Wandertouren",
        "Verknuepfung mit realen Orten weltweit",
    ],
    "comp_left_weakness_label": "Schwaechen:",
    "comp_left_weaknesses": [
        "Premium-Paywall fuer viele Caches",
        "Kein soziales Gameplay — solitär",
        "Keine Echtzeit-Interaktion mit anderen Spielern",
        "Keine Territorien, keine Kampfe",
        "Statische Inhalte — Caches aendern sich selten",
        "Werbung und Werbekooperationen",
        "Kein Audio/Video an Orten",
    ],
    "comp_right_name": "MapRaiders",
    "comp_right_desc": "Die soziale Karte. Statt Cache-Koordinaten zu finden, eroberst du echte Territorien, hinterlaesst Echos und triffst Menschen bei spontanen Events. Keine Paywall, keine Werbung.",
    "comp_right_strengths_label": "Staerken:",
    "comp_right_strengths": [
        "100% kostenlos — keine Premium-Schranken",
        "Echte Territorien durch Bewegung",
        "Standortgebundene Echos (Audio, Foto, Video)",
        "Spontan-Events in Echtzeit auf der Karte",
        "Defense Mini-Games (Tic Tac Toe, Mini-Schach)",
        "Organische Clans und Freundschaften",
        "Aktives, kompetitives Gameplay",
    ],
    "comp_right_focus_label": "Fokus:",
    "comp_right_focus": [
        "Soziale Karte statt Schatzsuche",
        "Echtzeit-Territorienkontrolle",
        "Spieler-generierte Inhalte (Echos, Quests)",
        "Direkte Begegnungen statt Logbuch",
        "Werbefrei, keine versteckten Kosten",
    ],
    "sec2_h2_em": "Vergleichstabelle",
    "sec2_h2_before": "Feature",
    "sec2_h2_after": "",
    "sec2_p": "Direkter Vergleich aller wichtigen Aspekte.",
    "table_head_left": "Geocaching",
    "table_head_right": "MapRaiders",
    "table_rows": [
        ("Kosten zum Spielen", "Kostenlos + Premium-Paywall", "100% kostenlos, keine Paywall"),
        ("Werbung", "Ja (App + Website)", "Keine Werbung"),
        ("Gameplay-Typ", "Passiv, Caches finden", "Aktiv, Territorien erobern"),
        ("Echte Territorien", "Keine", "Zentral im Spiel-Design"),
        ("Defense Mini-Games", "Keine", "Tic Tac Toe, RPS, Mini-Schach"),
        ("Soziale Features", "Gering (Logeintraege)", "Echos, Events, Clans, Duelle"),
        ("Standortgebundene Medien", "Nur Text-Logs", "Audio, Foto, Video Echos"),
        ("Spontan-Events", "Keine", "Live auf der Karte"),
        ("Spieler-Inhalte", "Caches (teils premium)", "Echos, Quests, Artefakte"),
        ("Aktualitaet der Inhalte", "Statisch, teils veraltet", "Live, spieler-getrieben"),
        ("Community-Groesse", "Mehrere Millionen", "Wachsend, aber jung"),
        ("Datenbank-Umfang", "3+ Mio Caches weltweit", "Neue Territorien taeglich"),
    ],
    "sec3_h2_before": "Warum MapRaiders",
    "sec3_h2_em": "Besser",
    "sec3_h2_after": "ist",
    "sec3_p": "Sechs Faktoren, die den Unterschied machen.",
    "sec3_cards": [
        ("1. Keine Premium-Paywall", "Bei Geocaching sind viele Caches nur mit Premium-Abo zugaenglich. In MapRaiders ist alles kostenlos — keine Abos, keine Freemium-Schranken, keine Werbung. Jeder Spieler hat die gleichen Moeglichkeiten."),
        ("2. Soziale Karte statt Solo-Schatzsuche", "Geocaching ist im Kern eine Einzelaktivitaet — du findest einen Cache, trägst dich ins Logbuch ein, gehst weiter. MapRaiders dreht das um: die Karte ist das soziale Netzwerk. Echos, Events, Duelle, Clans."),
        ("3. Aktives Gameplay", "Geocaching-Loop: Koordinaten, hingehen, abhaken. MapRaiders-Loop: laufen, Territorium beanspruchen, verteidigen mit Mini-Games, neue Routen planen. Dein Spielzug veraendert die Karte fuer andere."),
        ("4. Dynamische Inhalte", "Viele Caches sind jahrelang unveraendert oder verschwunden. In MapRaiders entstehen Inhalte live — jedes Echo, jedes Event, jedes Territorium ist frisch. Die Stadt sieht heute anders aus als gestern."),
        ("5. Echte Begegnungen", "Geocaching ist still. Du triffst selten andere Spieler. MapRaiders macht Begegnungen zentral: Spontan-Events, Territoriums-Duelle, Clan-Treffen. Die Karte bringt dich zu Menschen."),
        ("6. Werbefrei, datensparsam", "Geocaching ist werbefinanziert und sammelt Daten fuer Kooperationen. MapRaiders hat null Werbung, verkauft keine Daten. Das Modell basiert auf optionalen Cosmetics, nicht auf Aufmerksamkeits-Ausbeutung."),
    ],
    "faq_h2_em": "Gestellte Fragen",
    "faq_h2_before": "Haeufig",
    "faqs": [
        ("Ist MapRaiders wie Geocaching mit Territorien?",
         "Nicht ganz. Geocaching ist eine Schatzsuche nach versteckten Dosen. MapRaiders ist eine soziale Karte: du eroberst sichtbare Territorien, hinterlaesst Echos und triffst Leute bei Events. Der Bewegungsaspekt ist aehnlich, der soziale Kern ist komplett anders."),
        ("Kann ich Geocaches in MapRaiders finden?",
         "Nein. MapRaiders ist keine Geocaching-Clone-App. Die Datenbank ist komplett eigen und spielergeneriert. Wenn du klassische Cache-Suche willst, nutze Geocaching; wenn du eine soziale Karte mit Territorien willst, nutze MapRaiders. Beide schliessen sich nicht aus."),
        ("Brauche ich ein Abo fuer alle Features?",
         "Nein. MapRaiders ist vollstaendig kostenlos — alle Territorien, alle Echos, alle Events, alle Defense-Games. Kein Premium-Tier, keine Paywall. Das ist unser Kernprinzip."),
        ("Ist die App auch fuer Familien geeignet wie Geocaching?",
         "Ja, aber der Fokus ist anders. Geocaching wirkt wie eine Familien-Schatzsuche. MapRaiders passt eher zu Laeufern, Radlern und Leuten, die aktiv andere treffen wollen. Fuer Familien-Sonntagsausfluege mit Kindern ist klassisches Geocaching noch immer ideal."),
    ],
    "final_h2_em": "Bereit,",
    "final_h2_after": "die Karte anders zu lesen?",
    "final_p": "Geocaching hat die GPS-Schatzsuche erfunden. MapRaiders macht die Karte sozial — mit Territorien, Echos und echten Begegnungen.",
    "cta_primary": "Jetzt kostenlos laden",
    "cta_secondary": "Features erkunden",
    "footer_agb": "AGB",
    "footer_privacy": "Datenschutz",
    "footer_imprint": "Impressum",
    "footer_contact": "Kontakt",
    "footer_tagline": "Social Media. Neu definiert.",
}

EN = {
    "canonical_from": "https://mapraiders.com/en/vs/pokemon-go.html",
    "canonical_to": "https://mapraiders.com/en/vs/geocaching.html",
    "title": "MapRaiders vs Geocaching: Territories Instead of Caches, a Social Map Instead of Logbooks",
    "desc": "MapRaiders vs Geocaching: Skip the coordinates checklist — claim real territories, leave Echos, join live map events. The social outdoor map.",
    "og_loc": "en_US",
    "keywords": "geocaching alternative, geocaching app alternative, outdoor social app, territory game, free GPS game",
    "hero_badge": "⚔ Comparison",
    "h1_left": "MapRaiders vs",
    "h1_right": "Geocaching",
    "hero_p": "Geocaching is a classic — but it is also <strong>solitary, static and built around hidden caches</strong>. MapRaiders is the opposite: real territories on the map, Echos, spontaneous events and direct encounters with other people.",
    "back_link": "Back to homepage",
    "sec1_h2_before": "The",
    "sec1_h2_em": "Honest",
    "sec1_h2_after": "Truth",
    "sec1_p": "Geocaching invented GPS treasure hunting and has had millions of fans since 2000. But the model is static: find coordinates, sign a logbook, move on. Little social interaction, no active gameplay, no real territories.",
    "comp_left_name": "Geocaching",
    "comp_left_desc": "The origin of GPS treasure hunting. Millions of hidden caches worldwide, long-standing community, reliable app. Perfect for solo and family outings.",
    "comp_left_strengths": [
        "Huge existing cache database (3M+)",
        "Established community since 2000",
        "Family and beginner friendly",
        "Many cache types (Traditional, Multi, Mystery)",
        "Offline features for hiking tours",
        "Real-world locations worldwide",
    ],
    "comp_left_weakness_label": "Weaknesses:",
    "comp_left_weaknesses": [
        "Premium paywall for many caches",
        "No social gameplay — solitary",
        "No real-time interaction with other players",
        "No territories, no battles",
        "Static content — caches rarely change",
        "Ads and commercial partnerships",
        "No audio or video at locations",
    ],
    "comp_right_name": "MapRaiders",
    "comp_right_desc": "The social map. Instead of finding cache coordinates, you claim real territories, leave Echos and meet people at spontaneous events. No paywall, no ads.",
    "comp_right_strengths_label": "Strengths:",
    "comp_right_strengths": [
        "100% free — no premium barriers",
        "Real territories through physical movement",
        "Location-bound Echos (audio, photo, video)",
        "Real-time spontaneous map events",
        "Defense mini-games (Tic-Tac-Toe, Mini-Chess)",
        "Organic clans and friendships",
        "Active, competitive gameplay",
    ],
    "comp_right_focus_label": "Focus:",
    "comp_right_focus": [
        "Social map instead of treasure hunt",
        "Real-time territory control",
        "Player-generated content (Echos, Quests)",
        "Direct encounters instead of logbooks",
        "Ad-free, no hidden costs",
    ],
    "sec2_h2_em": "Comparison Table",
    "sec2_h2_before": "Feature",
    "sec2_h2_after": "",
    "sec2_p": "Direct comparison across every relevant aspect.",
    "table_head_left": "Geocaching",
    "table_head_right": "MapRaiders",
    "table_rows": [
        ("Cost to play", "Free + premium paywall", "100% free, no paywall"),
        ("Ads", "Yes (app + website)", "No ads"),
        ("Gameplay style", "Passive, find caches", "Active, conquer territories"),
        ("Real territories", "None", "Core of the design"),
        ("Defense mini-games", "None", "Tic-Tac-Toe, RPS, Mini-Chess"),
        ("Social features", "Minimal (log entries)", "Echos, events, clans, duels"),
        ("Location-based media", "Text logs only", "Audio, photo, video Echos"),
        ("Spontaneous events", "None", "Live on the map"),
        ("Player content", "Caches (some premium)", "Echos, quests, artifacts"),
        ("Freshness of content", "Static, often outdated", "Live, player-driven"),
        ("Community size", "Several million", "Growing, still young"),
        ("Database scope", "3M+ caches worldwide", "New territories every day"),
    ],
    "sec3_h2_before": "Why MapRaiders",
    "sec3_h2_em": "Wins",
    "sec3_h2_after": "",
    "sec3_p": "Six factors that decide the match.",
    "sec3_cards": [
        ("1. No premium paywall", "In Geocaching, many caches are locked behind a premium subscription. In MapRaiders everything is free — no subscriptions, no freemium gates, no ads. Every player has the same opportunities."),
        ("2. Social map, not solo treasure hunt", "At its core, Geocaching is a solo activity — you find a cache, sign the logbook, move on. MapRaiders flips it: the map is the social network itself. Echos, events, duels, clans."),
        ("3. Active gameplay", "Geocaching loop: coordinates, walk there, check off. MapRaiders loop: move, claim, defend with mini-games, plan new routes. Your move reshapes the map for others."),
        ("4. Dynamic content", "Many caches stay unchanged for years or disappear entirely. In MapRaiders content is created live — every Echo, every event, every territory is fresh. The city looks different today than yesterday."),
        ("5. Real encounters", "Geocaching is quiet. You rarely meet other players. MapRaiders puts encounters at the center: spontaneous events, territory duels, clan meetups. The map brings you to people."),
        ("6. Ad-free, data-light", "Geocaching is ad-supported and collects data for commercial partners. MapRaiders has zero ads and does not sell data. Monetization is based on optional cosmetics, not attention extraction."),
    ],
    "faq_h2_em": "Asked Questions",
    "faq_h2_before": "Frequently",
    "faqs": [
        ("Is MapRaiders like Geocaching with territories?",
         "Not quite. Geocaching is a treasure hunt for hidden containers. MapRaiders is a social map: you conquer visible territories, leave Echos and meet people at events. The movement aspect is similar, the social core is completely different."),
        ("Can I find Geocaches in MapRaiders?",
         "No. MapRaiders is not a Geocaching clone. The database is fully independent and player-generated. If you want classic cache hunting, use Geocaching; if you want a social map with territories, use MapRaiders. They do not exclude each other."),
        ("Do I need a subscription for all features?",
         "No. MapRaiders is completely free — all territories, all Echos, all events, all defense games. No premium tier, no paywall. That is our core principle."),
        ("Is the app family-friendly like Geocaching?",
         "Yes, but the focus is different. Geocaching feels like a family treasure hunt. MapRaiders fits better for runners, cyclists and people who actively want to meet others. For family Sunday outings with kids, classic Geocaching is still ideal."),
    ],
    "final_h2_em": "Ready",
    "final_h2_after": "to read the map differently?",
    "final_p": "Geocaching invented GPS treasure hunting. MapRaiders makes the map social — with territories, Echos and real encounters.",
    "cta_primary": "Download free now",
    "cta_secondary": "Explore features",
    "footer_agb": "Terms",
    "footer_privacy": "Privacy",
    "footer_imprint": "Imprint",
    "footer_contact": "Contact",
    "footer_tagline": "Social Media. Redefined.",
}


def build_page(template_html: str, cfg: dict, lang_prefix: str) -> str:
    """Ersetzt Template-Abschnitte atomar. Nutzt eindeutige Marker aus pokemon-go."""
    h = template_html

    # --- Canonical / hreflang / URLs ---
    h = h.replace("/vs/pokemon-go.html", "/vs/geocaching.html")

    # --- Title & meta ---
    h = re.sub(
        r"<title>[^<]+</title>",
        f"<title>{cfg['title']}</title>",
        h,
        count=1,
    )
    h = re.sub(
        r'<meta name="description" content="[^"]+">',
        f'<meta name="description" content="{cfg["desc"]}">',
        h,
        count=1,
    )
    h = re.sub(
        r'<meta property="og:title" content="[^"]+">',
        f'<meta property="og:title" content="{cfg["title"]}">',
        h,
        count=1,
    )
    h = re.sub(
        r'<meta property="og:description" content="[^"]+">',
        f'<meta property="og:description" content="{cfg["desc"]}">',
        h,
        count=1,
    )
    h = re.sub(
        r'<meta name="keywords" content="[^"]+">',
        f'<meta name="keywords" content="{cfg["keywords"]}">',
        h,
        count=1,
    )

    # --- Hero ---
    hero_pattern = re.compile(
        r'(<div class="hero-content container">\s*)'
        r'<div class="hero-badge">[^<]+</div>\s*'
        r'<h1>[^<]+<br><span>[^<]+</span></h1>\s*'
        r'<p>.*?</p>\s*'
        r'<a href="[^"]+" class="back-link">[^<]+</a>',
        re.DOTALL,
    )
    new_hero = (
        f'\\1<div class="hero-badge">{cfg["hero_badge"]}</div>\n'
        f'    <h1>{cfg["h1_left"]}<br><span>{cfg["h1_right"]}</span></h1>\n'
        f'    <p>{cfg["hero_p"]}</p>\n'
        f'    <a href="{lang_prefix}/" class="back-link">&larr; {cfg["back_link"]}</a>'
    )
    h = hero_pattern.sub(new_hero, h, count=1)

    # --- Section 1: Ehrliche Wahrheit + Compare Cards (komplett) ---
    sec1_pattern = re.compile(
        r'(<section>\s*<div class="container">\s*<div class="section-header reveal">\s*)'
        r'<h2>.*?</h2>\s*<p>.*?</p>\s*(</div>\s*)'
        r'<div class="comparison-grid reveal">.*?</div>\s*</div>\s*</section>',
        re.DOTALL,
    )

    left_strengths = "\n            ".join(f"<li>{s}</li>" for s in cfg["comp_left_strengths"])
    left_weak = "\n            ".join(f"<li>{s}</li>" for s in cfg["comp_left_weaknesses"])
    right_strengths = "\n            ".join(f"<li>{s}</li>" for s in cfg["comp_right_strengths"])
    right_focus = "\n            ".join(f"<li>{s}</li>" for s in cfg["comp_right_focus"])
    strengths_label = "Stärken:" if lang_prefix == "" else "Strengths:"

    sec1_before = cfg.get("sec1_h2_before", cfg.get("sec1_h2_left", "Die"))
    sec1_after = cfg.get("sec1_h2_after", cfg.get("sec1_h2_right", "Wahrheit"))

    new_sec1 = (
        r"\1"
        f'<h2>{sec1_before} <em>{cfg["sec1_h2_em"]}</em> {sec1_after}</h2>\n'
        f'      <p>{cfg["sec1_p"]}</p>\n    \\2\n'
        f'    <div class="comparison-grid reveal">\n'
        f'      <div class="comp-card reveal">\n'
        f'        <h3>{cfg["comp_left_name"]}</h3>\n'
        f'        <p>{cfg["comp_left_desc"]}</p>\n'
        f'        <div class="comp-strengths">\n'
        f'          <h4>{strengths_label}</h4>\n'
        f'          <ul class="comp-list">\n            {left_strengths}\n          </ul>\n'
        f'        </div>\n'
        f'        <div class="comp-strengths">\n'
        f'          <h4>{cfg["comp_left_weakness_label"]}</h4>\n'
        f'          <ul class="comp-list">\n            {left_weak}\n          </ul>\n'
        f'        </div>\n'
        f'      </div>\n\n'
        f'      <div class="comp-card reveal reveal-delay-1">\n'
        f'        <h3>{cfg["comp_right_name"]}</h3>\n'
        f'        <p>{cfg["comp_right_desc"]}</p>\n'
        f'        <div class="comp-strengths">\n'
        f'          <h4>{cfg["comp_right_strengths_label"]}</h4>\n'
        f'          <ul class="comp-list">\n            {right_strengths}\n          </ul>\n'
        f'        </div>\n'
        f'        <div class="comp-strengths">\n'
        f'          <h4>{cfg["comp_right_focus_label"]}</h4>\n'
        f'          <ul class="comp-list">\n            {right_focus}\n          </ul>\n'
        f'        </div>\n'
        f'      </div>\n'
        f'    </div>\n  </div>\n</section>'
    )
    h = sec1_pattern.sub(new_sec1, h, count=1)

    # --- Section 2: Vergleichstabelle ---
    table_pattern = re.compile(
        r'(<table class="comparison-table reveal">\s*<thead>\s*<tr>\s*<th>[^<]+</th>\s*)'
        r'<th>[^<]+</th>\s*<th>[^<]+</th>(\s*</tr>\s*</thead>\s*<tbody>).*?(</tbody>\s*</table>)',
        re.DOTALL,
    )
    rows_html = ""
    for feat, left, right in cfg["table_rows"]:
        rows_html += (
            f'        <tr>\n'
            f'          <td class="feature-name">{feat}</td>\n'
            f'          <td><span class="cross-icon">✕</span> {left}</td>\n'
            f'          <td><span class="check-icon">✓</span> {right}</td>\n'
            f'        </tr>\n'
        )
    new_table = (
        r"\1"
        f'<th>{cfg["table_head_left"]}</th>\n          <th>{cfg["table_head_right"]}</th>'
        r"\2\n"
        f"{rows_html}      "
        r"\3"
    )
    h = table_pattern.sub(new_table, h, count=1)

    # Update section 2 header
    sec2_header_pattern = re.compile(
        r'(<div class="section-header reveal">\s*)<h2>Feature <em>[^<]+</em></h2>\s*<p>[^<]+</p>(\s*</div>\s*<table class="comparison-table)',
        re.DOTALL,
    )
    new_sec2_header = (
        r"\1"
        f'<h2>{cfg["sec2_h2_before"]} <em>{cfg["sec2_h2_em"]}</em> {cfg["sec2_h2_after"]}</h2>\n'
        f'      <p>{cfg["sec2_p"]}</p>'
        r"\2"
    )
    h = sec2_header_pattern.sub(new_sec2_header, h, count=1)

    # --- Section 3: Warum MapRaiders Besser ist ---
    sec3_pattern = re.compile(
        r'(<div class="section-header reveal">\s*<h2>)Warum MapRaiders <em>[^<]+</em>[^<]*</h2>\s*'
        r'<p>[^<]+</p>(\s*</div>\s*<div class="comparison-grid reveal">).*?(</div>\s*</div>\s*</section>)',
        re.DOTALL,
    )
    cards_html = ""
    for i, (title, text) in enumerate(cfg["sec3_cards"]):
        delay = f" reveal-delay-{i}" if i else ""
        cards_html += (
            f'      <div class="comp-card reveal{delay}">\n'
            f'        <h3 style="font-size:20px;background:none;color:var(--accent);">{title}</h3>\n'
            f'        <p>{text}</p>\n'
            f'      </div>\n\n'
        )
    new_sec3 = (
        r"\1"
        f'{cfg["sec3_h2_before"]} <em>{cfg["sec3_h2_em"]}</em> {cfg["sec3_h2_after"]}</h2>\n'
        f'      <p>{cfg["sec3_p"]}</p>'
        r"\2\n"
        f"{cards_html}    "
        r"\3"
    )
    h = sec3_pattern.sub(new_sec3, h, count=1)

    # --- FAQ Section ---
    faq_pattern = re.compile(
        r'(<div class="section-header reveal">\s*<h2>)[^<]*<em>[^<]+</em>[^<]*</h2>(\s*</div>\s*<div class="faq-section reveal">).*?(</div>\s*</div>\s*</section>)',
        re.DOTALL,
    )
    faq_html = ""
    for i, (q, a) in enumerate(cfg["faqs"]):
        delay = f" reveal-delay-{i}" if i else ""
        faq_html += (
            f'      <div class="faq-item reveal{delay}">\n'
            f'        <h4>{q}</h4>\n'
            f'        <p>{a}</p>\n'
            f'      </div>\n\n'
        )
    new_faq = (
        r"\1"
        f'{cfg["faq_h2_before"]} <em>{cfg["faq_h2_em"]}</em></h2>'
        r"\2\n"
        f"{faq_html}    "
        r"\3"
    )
    h = faq_pattern.sub(new_faq, h, count=1)

    # --- Final CTA Section ---
    final_pattern = re.compile(
        r'(<div class="section-header reveal">\s*<h2>)<em>[^<]+</em>[^<]*</h2>\s*'
        r'<p>[^<]+</p>(\s*</div>\s*<div class="cta-section reveal">)\s*'
        r'<a href="[^"]+" class="cta-button">[^<]+</a>\s*'
        r'<a href="[^"]+" class="cta-button secondary">[^<]+</a>',
        re.DOTALL,
    )
    new_final = (
        r"\1"
        f'<em>{cfg["final_h2_em"]}</em> {cfg["final_h2_after"]}</h2>\n'
        f'      <p>{cfg["final_p"]}</p>'
        r"\2\n"
        f'      <a href="/MapRaiders.apk" class="cta-button">{cfg["cta_primary"]}</a>\n'
        f'      <a href="{lang_prefix}/" class="cta-button secondary">{cfg["cta_secondary"]}</a>'
    )
    h = final_pattern.sub(new_final, h, count=1)

    # --- FAQPage JSON-LD neu aufbauen ---
    # Entferne alten Block, füge neuen ein mit Geocaching-FAQs + MobileApplication
    old_jsonld = re.search(
        r'<script type="application/ld\+json">.*?</script>', h, re.DOTALL
    )
    if old_jsonld:
        import json as json_mod

        lang_hreflang = "de" if lang_prefix == "" else "en"
        mobile_app = {
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            "name": "MapRaiders",
            "description": cfg["desc"],
            "url": cfg["canonical_to"],
            "applicationCategory": "GameApplication",
            "applicationSubCategory": "SocialNetworkingApplication",
            "operatingSystem": "Android",
            "inLanguage": [lang_hreflang],
            "screenshot": "https://mapraiders.com/og-image.png",
            "downloadUrl": "https://mapraiders.com/MapRaiders.apk",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR" if lang_prefix == "" else "USD",
            },
            "author": {
                "@type": "Organization",
                "name": "Scafa Investments LLC",
                "url": "https://scafa-investments.com/",
            },
        }
        faqpage = {
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
        new_blocks = (
            '<script type="application/ld+json">\n'
            + json_mod.dumps(mobile_app, ensure_ascii=False, indent=2)
            + "\n</script>\n\n"
            + '<script type="application/ld+json">\n'
            + json_mod.dumps(faqpage, ensure_ascii=False, indent=2)
            + "\n</script>"
        )
        h = h[: old_jsonld.start()] + new_blocks + h[old_jsonld.end() :]

    # --- Footer copy ---
    h = re.sub(
        r"(<p class=\"footer-copy\">&copy; 2026 MapRaiders &mdash; )[^<]+(</p>)",
        rf"\1{cfg['footer_tagline']}\2",
        h,
    )

    return h


def main():
    # DE
    de_src = (ROOT / "vs/geocaching.html").read_text(encoding="utf-8")
    de_out = build_page(de_src, DE, lang_prefix="")
    (ROOT / "vs/geocaching.html").write_text(de_out, encoding="utf-8")
    print("OK   docs/vs/geocaching.html")

    # EN
    en_src = (ROOT / "en/vs/geocaching.html").read_text(encoding="utf-8")
    en_out = build_page(en_src, EN, lang_prefix="/en")
    (ROOT / "en/vs/geocaching.html").write_text(en_out, encoding="utf-8")
    print("OK   docs/en/vs/geocaching.html")


if __name__ == "__main__":
    main()

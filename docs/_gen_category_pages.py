#!/usr/bin/env python3
"""
Generate remaining 40 category landing pages for MapRaiders.
Run: py _gen_category_pages.py
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

# CSS shared across all pages (minified)
CSS = """*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth;overflow-x:hidden}body{overflow-x:hidden;-webkit-font-smoothing:antialiased;font-family:'Outfit',sans-serif}a{color:inherit;text-decoration:none}button{font-family:inherit;cursor:pointer;border:none;background:none}
:root{--bg:#F6F4F1;--bg-alt:#EFEDE8;--surface:#FFFFFF;--border:rgba(20,18,16,.07);--text:#141210;--muted:#756F6A;--dim:#C0BAB4;--accent:#1558F0;--accent-m:rgba(21,88,240,.07);--accent-b:rgba(21,88,240,.18);--nav-bg:rgba(246,244,241,.9);}
[data-theme="dark"]{--bg:#0D0C0A;--bg-alt:#161410;--surface:#1C1916;--border:rgba(255,255,255,.06);--text:#EAE7E2;--muted:#7A7470;--dim:#3E3B37;--accent:#4B7BFF;--accent-m:rgba(75,123,255,.1);--accent-b:rgba(75,123,255,.22);--nav-bg:rgba(13,12,10,.9);}
body{background:var(--bg);color:var(--text);transition:background .4s,color .4s}.mx{max-width:1180px;margin:0 auto;padding:0 28px}
.rv{opacity:0;transform:translateY(32px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}.rv.on{opacity:1;transform:none}.d1{transition-delay:.08s}.d2{transition-delay:.16s}.d3{transition-delay:.24s}.d4{transition-delay:.32s}
.nav{position:fixed;top:0;left:0;right:0;z-index:900;padding:20px 0;background:var(--nav-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:padding .4s}.nav.scroll{padding:13px 0}
.nav-i{display:flex;align-items:center;justify-content:space-between}.nav-logo{font-size:14px;font-weight:800;letter-spacing:3.5px;text-transform:uppercase}.nav-logo b{color:var(--accent)}
.nav-r{display:flex;gap:24px;align-items:center}.nav-r a.lnk{font-size:13px;font-weight:500;color:var(--muted);transition:color .2s}.nav-r a.lnk:hover{color:var(--text)}
.btn-dl{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;padding:9px 20px;border-radius:6px;background:var(--accent);color:#fff;transition:opacity .2s,transform .2s}.btn-dl:hover{opacity:.88;transform:translateY(-1px)}
.lang-sw{position:relative}.lsw-btn{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);padding:5px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:5px;background:none;border:none;font-family:inherit}
.lsw-drop{position:absolute;top:calc(100% + 6px);right:0;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:6px;min-width:148px;display:none;z-index:200;box-shadow:0 12px 40px rgba(0,0,0,.10);flex-direction:column;gap:1px}
.lang-sw:hover .lsw-drop,.lang-sw:focus-within .lsw-drop{display:flex}.lsw-btn .chev{width:9px;height:9px;opacity:.5;transition:transform .2s}.lang-sw:hover .lsw-btn .chev{transform:rotate(180deg)}
.lswi{font-size:13px;font-weight:500;color:var(--muted);padding:7px 12px;border-radius:7px;text-decoration:none;white-space:nowrap;transition:all .15s;display:block}.lswi:hover{color:var(--text);background:var(--surface)}.lswi.on{color:var(--accent);background:var(--accent-m);font-weight:700;pointer-events:none}
@media(max-width:900px){.lang-sw{display:none}}@media(max-width:740px){.nav-r a.lnk{display:none}}
.hero{padding:160px 0 100px;border-bottom:1px solid var(--border)}.h-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);padding:6px 14px;border-radius:4px;background:var(--accent-m);border:1px solid var(--accent-b);margin-bottom:28px}
.hero h1{font-size:clamp(38px,6vw,76px);font-weight:900;line-height:1.0;letter-spacing:-2px;margin-bottom:24px}.hero h1 em{font-style:normal;color:var(--accent)}.hero p{font-size:18px;color:var(--muted);line-height:1.75;max-width:580px;margin-bottom:32px}
.btn-p{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;padding:16px 36px;border-radius:6px;background:var(--accent);color:#fff;transition:all .25s}.btn-p:hover{transform:translateY(-2px);opacity:.9}
.sec{padding:100px 0;border-bottom:1px solid var(--border)}.sec-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}.sec-title{font-size:clamp(26px,3.8vw,42px);font-weight:800;letter-spacing:-1.5px;line-height:1.08;margin-bottom:32px}.sec-title em{font-style:normal;color:var(--accent)}
.prose p{font-size:15px;color:var(--muted);line-height:1.8;margin-bottom:20px;max-width:820px}.prose strong{color:var(--text);font-weight:700}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:48px}.feat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:32px;transition:all .3s}.feat-card:hover{border-color:var(--accent-b);transform:translateY(-3px)}.feat-card h3{font-size:18px;font-weight:700;margin-bottom:12px}.feat-card p{font-size:14px;color:var(--muted);line-height:1.7}
.comp-table{width:100%;border-collapse:collapse;margin-top:32px;border:1px solid var(--border);border-radius:12px;overflow:hidden}.comp-table thead{background:var(--bg-alt)}.comp-table th{padding:18px 22px;text-align:left;font-weight:700;font-size:13px;border-bottom:1px solid var(--border)}.comp-table td{padding:16px 22px;border-bottom:1px solid var(--border);font-size:14px;color:var(--muted)}.comp-table tr:last-child td{border-bottom:none}.feat-name{color:var(--text);font-weight:600}.check{color:#10B981;font-weight:700}.cross{color:#EF4444;font-weight:700}
.faq-list{margin-top:48px;display:flex;flex-direction:column;gap:2px}.faq-item{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)}.faq-q{display:flex;align-items:center;justify-content:space-between;padding:22px 28px;cursor:pointer;font-size:16px;font-weight:600;gap:16px}.faq-q svg{flex-shrink:0;color:var(--accent);transition:transform .3s}.faq-item.open .faq-q svg{transform:rotate(45deg)}.faq-a{display:none;padding:0 28px 22px;font-size:15px;color:var(--muted);line-height:1.75}.faq-item.open .faq-a{display:block}
.cta-sec{padding:100px 0;text-align:center}.cta-sec h2{font-size:clamp(28px,4.5vw,52px);font-weight:800;letter-spacing:-2px;margin-bottom:16px}.cta-sec p{font-size:15px;color:var(--muted);margin-bottom:40px}.cta-note{font-size:12px;color:var(--dim);margin-top:12px}
.links-row{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;margin-top:40px}.links-row a{font-size:14px;font-weight:600;color:var(--accent);text-decoration:underline;text-underline-offset:3px}
footer{padding:40px 0 32px;border-top:1px solid var(--border)}.f-i{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.f-logo{font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--dim)}.f-links{display:flex;gap:22px;flex-wrap:wrap}.f-links a{font-size:12px;color:var(--muted);transition:color .2s}.f-links a:hover{color:var(--text)}.f-copy{width:100%;text-align:center;margin-top:20px;font-size:11px;color:var(--dim)}"""

JS = """(function(){const t=localStorage.getItem('mr-theme')||'light';document.documentElement.dataset.theme=t;})();
window.addEventListener('scroll',function(){document.getElementById('nav').classList.toggle('scroll',scrollY>60);});
const io=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.classList.add('on');io.unobserve(x.target);}});},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.rv').forEach(function(el){io.observe(el);});
document.querySelectorAll('.faq-q').forEach(function(q){q.addEventListener('click',function(){q.parentElement.classList.toggle('open');});});"""

# hreflang URLs per category
HREFLANG = {
    "outdoor": {
        "de": "/outdoor-social-app.html",
        "en": "/en/outdoor-social-app.html",
        "fr": "/fr/appli-sociale-outdoor.html",
        "es": "/es/app-social-outdoor.html",
        "it": "/it/app-social-outdoor.html",
        "pt": "/pt/app-social-outdoor.html",
        "tr": "/tr/outdoor-sosyal-app.html",
        "ru": "/ru/outdoor-social-app.html",
        "ja": "/ja/outdoor-social-app.html",
        "ko": "/ko/outdoor-social-app.html",
        "zh": "/zh/outdoor-social-app.html",
        "ar": "/ar/outdoor-social-app.html",
        "hi": "/hi/outdoor-social-app.html",
    },
    "location": {
        "de": "/standort-spiel.html",
        "en": "/en/location-based-game.html",
        "fr": "/fr/jeu-geolocalise.html",
        "es": "/es/juego-geolocalizacion.html",
        "it": "/it/gioco-geolocalizzazione.html",
        "pt": "/pt/jogo-geolocalizacao.html",
        "tr": "/tr/konum-tabanli-oyun.html",
        "ru": "/ru/geo-igra.html",
        "ja": "/ja/location-game.html",
        "ko": "/ko/location-game.html",
        "zh": "/zh/location-game.html",
        "ar": "/ar/location-game.html",
        "hi": "/hi/location-game.html",
    },
    "territory": {
        "de": "/territorium-spiel.html",
        "en": "/en/territory-game-app.html",
        "fr": "/fr/jeu-territoire.html",
        "es": "/es/juego-territorio.html",
        "it": "/it/gioco-territorio.html",
        "pt": "/pt/jogo-territorio.html",
        "tr": "/tr/bolge-oyunu.html",
        "ru": "/ru/igra-territoriy.html",
        "ja": "/ja/territory-game.html",
        "ko": "/ko/territory-game.html",
        "zh": "/zh/territory-game.html",
        "ar": "/ar/territory-game.html",
        "hi": "/hi/territory-game.html",
    },
    "social": {
        "de": "/social-media-alternative.html",
        "en": "/en/social-media-alternative.html",
        "fr": "/fr/alternative-reseaux-sociaux.html",
        "es": "/es/alternativa-redes-sociales.html",
        "it": "/it/alternativa-social-media.html",
        "pt": "/pt/alternativa-redes-sociais.html",
        "tr": "/tr/sosyal-medya-alternatifi.html",
        "ru": "/ru/alternativa-soc-setyam.html",
        "ja": "/ja/social-media-alternative.html",
        "ko": "/ko/social-media-alternative.html",
        "zh": "/zh/social-media-alternative.html",
        "ar": "/ar/social-media-alternative.html",
        "hi": "/hi/social-media-alternative.html",
    },
}

LANG_LABELS = {
    "de": "Deutsch", "en": "English", "fr": "Français", "es": "Español",
    "it": "Italiano", "pt": "Português", "tr": "Türkçe", "ru": "Русский",
    "ja": "日本語", "ko": "한국어", "zh": "中文", "ar": "العربية", "hi": "हिन्दी",
}

# Page data: (lang, category_key, filepath, content)
PAGES = [
    # FR remaining 2
    ("fr", "territory", "fr/jeu-territoire.html", {
        "title": "Meilleur Jeu de Territoire 2026 — MapRaiders: Votre Quartier, Votre Royaume",
        "desc": "MapRaiders est le meilleur jeu de territoire en 2026. Revendiquez de vrais territoires GPS par le mouvement, défendez votre quartier avec des mini-jeux interactifs.",
        "badge": "Jeu de Territoire",
        "h1": "Votre quartier. <em>Votre royaume.</em>",
        "hero_p": "MapRaiders est le jeu de territoire qui transforme de vrais espaces GPS en champ de bataille. Revendiquez des territoires par le mouvement, défendez-les avec stratégie — et régnez sur votre quartier.",
        "cta_btn": "Sécuriser mes territoires",
        "prob_label": "Le problème",
        "prob_title": "Ce qui manque aux <em>jeux de territoire aujourd'hui</em>",
        "prob_p1": "<strong>La plupart des jeux de territoire sont des abstractions numériques.</strong> Vous cliquez sur une carte pour capturer des zones, mais rien ne semble réel. Les territoires sont arbitraires, les batailles automatiques et vous regardez le résultat sans l'influencer.",
        "prob_p2": "MapRaiders renverse cela: les territoires sont liés à de vraies coordonnées GPS. Pour revendiquer une zone, vous devez y être physiquement. Pour la défendre, vous devez agir activement. Chaque bataille a un vrai poids.",
        "sol_label": "La solution",
        "sol_title": "Comment fonctionne le <em>système de territoires</em>",
        "cards": [
            ("Revendiquer en marchant", "Traversez une rue et ce territoire est enregistré sous votre nom. Simple, direct, réel."),
            ("Déclin territorial", "Les territoires inactifs rétrécissent quotidiennement. Patrouiller votre quartier maintient votre emprise."),
            ("Défense interactive", "Des attaquants? Des mini-jeux interactifs décident. Pierre-feuille-ciseaux, mini-échecs, morpion et plus."),
            ("Territoires de clan", "Les clans revendiquent ensemble des zones plus grandes et plus résistantes. La puissance collective décuple la portée."),
        ],
        "table_header": ["Fonctionnalité", "MapRaiders", "Jeux stratégie num.", "Géocaching"],
        "table_rows": [
            ("Vrais territoires GPS", "✓", "✗", "✗"),
            ("Déclin territorial", "✓", "✗", "✗"),
            ("Défense interactive", "✓", "Automatique", "✗"),
            ("Mouvement physique requis", "✓", "✗", "✓"),
            ("Système de clans", "✓", "✓", "✗"),
            ("Gratuit", "✓", "P2W", "✓"),
        ],
        "faqs": [
            ("Comment fonctionne la revendication de territoire?", "Vous marchez, courez ou pédalez dans une rue et votre position GPS revendique ce territoire. Il apparaît sur la carte sous votre nom jusqu'à ce qu'un autre joueur vienne vous défier physiquement."),
            ("Peut-on perdre son territoire?", "Oui. Le système de déclin réduit les zones inactives quotidiennement. Restez actif et patrouiller votre territoire pour le maintenir."),
            ("Que se passe-t-il lors d'une attaque?", "L'attaquant doit venir physiquement dans votre territoire. Puis un mini-jeu interactif commence. Le gagnant contrôle le territoire."),
            ("Un clan peut-il partager des territoires?", "Oui. Les clans se forment organiquement et peuvent revendiquer des zones ensemble. Les territoires de clan sont plus résistants — ils nécessitent des attaques coordonnées."),
        ],
        "cta_title": "Sécurisez vos <em>meilleurs territoires en premier</em>",
        "cta_p": "Les premiers joueurs verrouillent les meilleures emplacements. MapRaiders arrive bientôt.",
        "cross_links": [("/fr/appli-sociale-outdoor.html","Appli sociale outdoor"),("/fr/jeu-geolocalise.html","Jeu géolocalisé"),("/fr/vs/pokemon-go.html","vs. Pokémon GO"),("/fr/","Accueil")],
        "footer_copy": "MapRaiders &mdash; Votre quartier, votre royaume.",
        "footer_links": [("/fr/mentions-legales.html","Mentions légales"),("/fr/confidentialite.html","Confidentialité")],
        "nav_lnk_label": "Fonctionnalités",
        "nav_lnk_href": "/fr/#feat",
    }),
    ("fr", "social", "fr/alternative-reseaux-sociaux.html", {
        "title": "Meilleure Alternative Réseaux Sociaux 2026 — MapRaiders: Sans Pub, Sans Algorithmes",
        "desc": "MapRaiders est la meilleure alternative aux réseaux sociaux en 2026. Sans publicité, sans algorithmes, sans fils d'actualité toxiques. Connexion sociale réelle par GPS.",
        "badge": "Alternative Réseaux Sociaux",
        "h1": "Sans pub. Sans algos. <em>Sans toxicité.</em>",
        "hero_p": "MapRaiders est l'alternative aux réseaux sociaux construite sur de vraies rencontres — pas le défilement infini. Votre présence sociale se crée en vous déplaçant dans le monde physique, pas en performant pour un algorithme.",
        "cta_btn": "Quitter le fil d'actualité",
        "prob_label": "Le problème",
        "prob_title": "Ce qui ne va pas avec <em>les réseaux sociaux aujourd'hui</em>",
        "prob_p1": "<strong>Les réseaux sociaux sont optimisés pour le temps d'écran maximal, pas pour le bien-être réel.</strong> Les algorithmes amplifient l'indignation parce qu'elle génère plus d'engagement. La publicité fait de vous le produit. Le résultat: design addictif, fils toxiques, anxiété de comparaison sociale.",
        "prob_p2": "Ce qui manque, c'est une plateforme où la connexion s'obtient par la présence réelle — pas la performance de contenu. MapRaiders est construit sur ce principe: sortez dehors, et votre monde social vous y suit.",
        "sol_label": "La solution",
        "sol_title": "MapRaiders — social sans <em>design addictif</em>",
        "cards": [
            ("Pas de fil, pas de scroll", "MapRaiders n'a pas de fil infini. À la place, une carte en direct de votre quartier réel. Aucun algorithme ne choisit votre expérience."),
            ("Echos — Vraies voix", "Laissez des messages audio à des endroits réels. D'autres les découvrent en passant. Connexion asynchrone sans toxicité de section commentaires."),
            ("Zéro publicité", "Pas un seul bannière, post sponsorisé ou pixel de tracking. Vous n'êtes pas le produit."),
            ("Valeur hors ligne", "Votre activité dans MapRaiders — marche, vélo, exploration — a de vrais bénéfices physiques. Social media avec valeur fitness."),
        ],
        "table_header": ["Fonctionnalité", "MapRaiders", "Instagram/TikTok", "Mastodon"],
        "table_rows": [
            ("Zéro publicité", "✓", "✗", "✓"),
            ("Pas d'algo de fil", "✓", "✗", "✓"),
            ("Mouvement comme moteur", "✓", "✗", "✗"),
            ("Connexion géolocalisée", "✓", "✗", "✗"),
            ("Pas de mécanisme d'abonnés", "✓", "✗", "✗"),
            ("Pas de vente de données", "✓", "✗", "✓"),
        ],
        "faqs": [
            ("Pourquoi les réseaux sociaux sont-ils problématiques?", "Les plateformes sont optimisées pour le temps d'écran maximal. Les algorithmes amplifient l'indignation parce qu'elle génère plus d'engagement. La publicité fait de vous le produit. MapRaiders est différent: l'engagement vient du mouvement, pas du défilement."),
            ("Comment MapRaiders est-il une alternative aux réseaux sociaux?", "MapRaiders remplace le fil passif par une présence physique active. Au lieu de liker des photos, vous revendiquez des territoires. Au lieu d'écrire des commentaires, vous laissez des Echos audio à des endroits réels."),
            ("Y a-t-il des pubs dans MapRaiders?", "Non. MapRaiders est totalement sans publicité. Pas de bannières, pas de posts sponsorisés, pas de ciblage. L'appli se finance par des items cosmétiques optionnels."),
            ("Quand MapRaiders sort-il?", "MapRaiders sort bientôt sur Google Play. Inscrivez-vous pour être notifié au lancement."),
        ],
        "cta_title": "Sortez du fil. <em>Dans le monde réel.</em>",
        "cta_p": "MapRaiders arrive bientôt. Pas d'algorithmes. Pas de pub. Vraies connexions.",
        "cross_links": [("/fr/appli-sociale-outdoor.html","Appli sociale outdoor"),("/fr/jeu-geolocalise.html","Jeu géolocalisé"),("/fr/vs/zenly.html","vs. Zenly"),("/fr/","Accueil")],
        "footer_copy": "MapRaiders &mdash; Social Media. Redéfini.",
        "footer_links": [("/fr/mentions-legales.html","Mentions légales"),("/fr/confidentialite.html","Confidentialité")],
        "nav_lnk_label": "Vision",
        "nav_lnk_href": "/fr/#vision",
    }),
]

# Languages with all 4 categories, content generated from templates
LANG_CONTENT = {
    "es": {
        "lang_label": "ES",
        "lang_name": "Español",
        "home": "/es/",
        "outdoor": {
            "file": "es/app-social-outdoor.html",
            "title": "Mejor App Social Outdoor 2026 — MapRaiders: Sal Fuera, Conéctate de Verdad",
            "desc": "MapRaiders es la mejor app social outdoor en 2026. Muévete afuera, conecta con personas reales, conquista territorios GPS. 100% gratis, sin publicidad.",
            "badge": "App Social Outdoor",
            "h1": "Sal fuera. <em>Conéctate de verdad.</em>",
            "hero_p": "MapRaiders transforma cada salida en una aventura social real. Conquista territorios GPS, deja mensajes de audio geolocalizados, forma clanes con tus vecinos. Sin algoritmos. Sin anuncios.",
            "cta_btn": "Notificarme en el lanzamiento",
            "p1": "<strong>Las apps de fitness te rastrean. Las redes sociales crean adicción.</strong> Ninguna conecta personas de verdad en el mundo real. Strava te da estadísticas pero estás solo. Instagram te muestra lo mejor de otros mientras tú estás en el sofá.",
            "p2": "Lo que falta es una app donde tu presencia física tenga consecuencias sociales reales. Tu carrera conquista territorio. Tu ruta deja huellas que otros descubren. Tu barrio se convierte en una arena compartida. MapRaiders está construido exactamente sobre esta premesa.",
            "sol_title": "MapRaiders reinventa lo <em>social outdoor</em>",
            "cards": [
                ("Territorios GPS","Camina por cualquier calle y reclámala. Tu territorio aparece en el mapa en vivo para todos los jugadores."),
                ("Echos — Graffiti de audio","Graba mensajes de voz o fragmentos musicales en ubicaciones reales. Otros los descubren al pasar."),
                ("Clanes orgánicos","Los clanes se forman naturalmente — juega con amigos, alíate con vecinos. Sin trámites burocráticos."),
                ("Misiones y Desafíos","Crea misiones para otros jugadores en lugares reales. Tu creatividad da forma a la experiencia outdoor de toda tu comunidad."),
            ],
            "table": [("Batallas territoriales reales","✓","✗","✓"),("Contenido creado por jugadores","✓","✗","✗"),("Echos de audio por ubicación","✓","✗","✗"),("100% gratis","✓","Freemium","✓"),("Para ciclistas","✓","✓","✗")],
            "table_h": ["Característica","MapRaiders","Strava","Ingress"],
            "faqs": [("¿Qué es una app social outdoor?","Una app social outdoor combina movimiento físico con interacción social. MapRaiders es el mejor ejemplo: sales fuera, conquistas territorios GPS, dejas Echos de audio para que otros jugadores los descubran y formas clanes orgánicos."),("¿Es MapRaiders gratis?","Sí, 100% gratis. Sin pay-to-win, sin barreras premium. Todos los jugadores parten en igualdad de condiciones."),("¿Se necesita equipo especial?","No. Basta con un smartphone Android con GPS. MapRaiders funciona para caminar, correr o ir en bici."),("¿Cuándo sale MapRaiders?","MapRaiders está en desarrollo final. Regístrate para recibir notificación en el lanzamiento.")],
            "cta_title": "¿Listo para conexiones <em>outdoor reales?</em>",
            "cta_p": "MapRaiders llega pronto. Sin algoritmos. Sin anuncios. Personas reales, lugares reales.",
            "links": [("/es/juego-geolocalizacion.html","Juego GPS"),("/es/juego-territorio.html","Juego de territorio"),("/es/vs/pokemon-go.html","vs. Pokémon GO"),("/es/","Inicio")],
            "footer_copy": "MapRaiders &mdash; Social Outdoor. Redefinido.",
        },
        "location": {
            "file": "es/juego-geolocalizacion.html",
            "title": "Mejor Juego de Geolocalización 2026 — MapRaiders: El Mundo es tu Campo de Batalla",
            "desc": "MapRaiders es el mejor juego de geolocalización GPS en 2026. Conquista territorios reales en tu ciudad, defiéndelos con mini-juegos interactivos. Gratis, sin pay-to-win.",
            "badge": "Juego de Geolocalización",
            "h1": "El mundo es tu <em>campo de batalla</em>",
            "hero_p": "MapRaiders convierte tu ciudad en un MMO GPS real. Sin mazmorras virtuales, sin mapas artificiales — calles reales, territorios reales, batallas reales contra vecinos reales.",
            "cta_btn": "Notificarme en el lanzamiento",
            "p1": "<strong>Los juegos de geolocalización se han estancado desde Pokémon GO.</strong> El género prometió una revolución — tu mundo físico como campo de juego. Pero después de una década, el patrón es el mismo: colecciona, toca, repite. El GPS es decoración, no la mecánica central.",
            "p2": "Lo que falta es propiedad real, estrategia real y comunidad real. No deberías coleccionar puntos en un mapa — deberías poseer territorio. No jugar solo — sino como parte de una comunidad que disputa las mismas calles que tú. MapRaiders está construido sobre esta promesa.",
            "sol_title": "MapRaiders — juego GPS de <em>nueva generación</em>",
            "cards": [
                ("Territorios persistentes","Reclama un bloque — es tuyo hasta que alguien venga físicamente a desafiarte. Propiedad real y duradera."),
                ("7 mini-juegos de defensa","Cuando llegan atacantes, mini-juegos interactivos deciden el resultado. Piedra papel tijera, ajedrez mini, tres en raya y más."),
                ("Escala MMO","Clanes, clasificaciones por ciudad, eventos estacionales. MapRaiders escala desde tu calle hasta toda tu región."),
                ("Contenido creado por jugadores","Crea misiones, graba Echos, pon desafíos. No eres consumidor — co-creas el mundo del juego."),
            ],
            "table": [("Territorios GPS persistentes","✓","✗","✗"),("Mini-juegos de defensa","✓","✗","✗"),("Contenido de jugadores","✓","✗","✗"),("Sin pay-to-win","✓","✗","✓"),("Sistema de clanes","✓","✗","✓"),("Juego activo","✓","Pasivo","✓")],
            "table_h": ["Característica","MapRaiders","Pokémon GO","Ingress"],
            "faqs": [("¿Qué es un juego de geolocalización?","Un juego de geolocalización usa tu posición GPS real como mecánica principal. MapRaiders va más allá: conquistas territorios persistentes, los defiendes con mini-juegos interactivos y compites contra vecinos reales por el control de calles reales."),("¿Funciona MapRaiders en cualquier ciudad?","Sí. MapRaiders usa datos de OpenStreetMap y funciona en todo el mundo. Cuantos más jugadores en tu región, más competitivo y dinámico se vuelve el mapa."),("¿Hay que caminar mucho para tener éxito?","El movimiento importa, pero también la estrategia. Defensas inteligentes y alianzas sólidas pueden compensar menos tiempo de caminar."),("¿Es gratis?","Sí, completamente gratis. Sin pay-to-win, sin ítems premium que afecten al juego.")],
            "cta_title": "Tu ciudad espera su <em>conquistador</em>",
            "cta_p": "MapRaiders llega pronto. Juego GPS real. Estrategia. Comunidad. Gratis para siempre.",
            "links": [("/es/app-social-outdoor.html","App social outdoor"),("/es/juego-territorio.html","Juego de territorio"),("/es/vs/ingress.html","vs. Ingress"),("/es/","Inicio")],
            "footer_copy": "MapRaiders &mdash; El juego GPS de nueva generación.",
        },
        "territory": {
            "file": "es/juego-territorio.html",
            "title": "Mejor Juego de Territorio 2026 — MapRaiders: Tu Barrio, Tu Dominio",
            "desc": "MapRaiders es el mejor juego de territorio GPS en 2026. Reclama territorios reales mediante el movimiento, defiende tu barrio con mini-juegos. Gratis, sin pay-to-win.",
            "badge": "Juego de Territorio",
            "h1": "Tu barrio. <em>Tu dominio.</em>",
            "hero_p": "MapRaiders es el juego de territorio donde el espacio GPS real es poder real. Camina calles para reclamarlas. Establece defensas. Lucha contra atacantes en mini-juegos interactivos.",
            "cta_btn": "Reclamar mi territorio",
            "p1": "<strong>La mayoría de los juegos de territorio son abstracciones digitales.</strong> Haces clic en un mapa para capturar zonas, pero nada parece real. Los territorios son arbitrarios, las batallas automatizadas y observas el resultado sin influir en él.",
            "p2": "MapRaiders lo invierte: los territorios están vinculados a coordenadas GPS reales. Para reclamar una zona, debes estar físicamente allí. Para defenderla, debes actuar activamente. Tu territorio expresa tu presencia física real en el espacio urbano.",
            "sol_title": "Cómo funciona el <em>sistema de territorios</em>",
            "cards": [
                ("Reclamar caminando","Camina por cualquier calle y tu posición GPS registra ese territorio bajo tu nombre. Simple, directo, real."),
                ("Decaimiento territorial","Los territorios inactivos se reducen diariamente. Patrulla tus zonas para mantenerlas. El sistema mantiene el mapa vivo."),
                ("Defensa interactiva","Los atacantes enfrentan mini-juegos que has configurado. Piedra papel tijera, mini ajedrez, tres en raya y más."),
                ("Territorios de clan","Los clanes reclaman juntos bloques más grandes y resistentes. Se necesitan ataques coordinados para romperlos."),
            ],
            "table": [("Territorio GPS real","✓","✗","✗"),("Decaimiento territorial","✓","✗","✗"),("Defensa interactiva","✓","Automática","✗"),("Movimiento físico requerido","✓","✗","✓"),("Sistema de clanes","✓","✓","✗"),("Gratis","✓","P2W","✓")],
            "table_h": ["Característica","MapRaiders","Juegos estrategia digital","Geocaching"],
            "faqs": [("¿Cómo funciona la reclamación de territorio?","Caminas, corres o pedaleas por cualquier calle y tu posición GPS reclama ese territorio. Aparece en el mapa en vivo bajo tu nombre hasta que otro jugador llegue físicamente y te desafíe."),("¿Se puede perder el territorio?","Sí. El sistema de decaimiento reduce las zonas inactivas diariamente. Mantente activo y patrulla tu territorio para conservarlo."),("¿Qué ocurre durante un ataque?","El atacante debe ir físicamente a tu territorio. Luego empieza un mini-juego interactivo. El ganador controla el territorio."),("¿Puede un clan compartir territorio?","Sí. Los clanes se forman orgánicamente y pueden reclamar bloques grandes juntos. Los territorios de clan son más resistentes.")],
            "cta_title": "Asegura tus <em>mejores territorios primero</em>",
            "cta_p": "Los primeros jugadores bloquean las mejores ubicaciones. MapRaiders llega pronto.",
            "links": [("/es/juego-geolocalizacion.html","Juego GPS"),("/es/app-social-outdoor.html","App social outdoor"),("/es/vs/pokemon-go.html","vs. Pokémon GO"),("/es/","Inicio")],
            "footer_copy": "MapRaiders &mdash; Tu barrio, tu dominio.",
        },
        "social": {
            "file": "es/alternativa-redes-sociales.html",
            "title": "Mejor Alternativa a Redes Sociales 2026 — MapRaiders: Sin Anuncios, Sin Algoritmos",
            "desc": "MapRaiders es la mejor alternativa a las redes sociales en 2026. Sin anuncios, sin algoritmos, sin feeds tóxicos. Conexión social real a través del movimiento GPS.",
            "badge": "Alternativa Redes Sociales",
            "h1": "Sin anuncios. Sin algoritmos. <em>Sin toxicidad.</em>",
            "hero_p": "MapRaiders es la alternativa a las redes sociales construida sobre encuentros reales — no scroll infinito. Tu presencia social se crea moviéndote por el mundo físico, no actuando para un algoritmo.",
            "cta_btn": "Salir del feed",
            "p1": "<strong>Las redes sociales están optimizadas para el tiempo de pantalla máximo, no para el bienestar real.</strong> Los algoritmos amplifican la indignación porque genera más engagement. La publicidad te convierte en el producto. El resultado: diseño adictivo, feeds tóxicos, ansiedad de comparación social.",
            "p2": "Lo que falta es una plataforma donde la conexión se gana por presencia real — no por rendimiento de contenido. MapRaiders está construido sobre este principio: sal fuera, y tu mundo social te sigue allí.",
            "sol_title": "MapRaiders — social sin <em>diseño adictivo</em>",
            "cards": [
                ("Sin feed, sin scroll","MapRaiders no tiene feed infinito. En su lugar, un mapa en vivo de tu barrio real. Ningún algoritmo elige tu experiencia."),
                ("Echos — Voces reales","Deja mensajes de audio en ubicaciones reales. Otros los descubren al pasar. Conexión asíncrona sin toxicidad de comentarios."),
                ("Cero publicidad","Ni un banner, post patrocinado ni píxel de seguimiento. Tú no eres el producto."),
                ("Valor fuera de línea","Tu actividad en MapRaiders — caminar, ciclismo, explorar — tiene beneficios físicos reales."),
            ],
            "table": [("Cero publicidad","✓","✗","✓"),("Sin feed algorítmico","✓","✗","✓"),("Movimiento como núcleo","✓","✗","✗"),("Conexión geolocalizida","✓","✗","✗"),("Sin mecánica de seguidores","✓","✗","✗"),("Sin venta de datos","✓","✗","✓")],
            "table_h": ["Característica","MapRaiders","Instagram/TikTok","Mastodon"],
            "faqs": [("¿Por qué son problemáticas las redes sociales?","Las plataformas están optimizadas para el tiempo de pantalla máximo. Los algoritmos amplifican la indignación. La publicidad te convierte en el producto. MapRaiders está diseñado diferente: el engagement viene de moverse afuera."),("¿Cómo es MapRaiders una alternativa a las redes sociales?","MapRaiders reemplaza el feed pasivo con presencia física activa. En lugar de dar likes a fotos, conquistas territorio. En lugar de escribir comentarios, dejas Echos de audio en lugares reales."),("¿Tiene anuncios MapRaiders?","No. MapRaiders es completamente libre de anuncios. La app se financia con ítems cosméticos opcionales — nunca mediante venta de datos."),("¿Cuándo sale MapRaiders?","MapRaiders sale pronto en Google Play. Regístrate ahora para recibir notificación en el lanzamiento.")],
            "cta_title": "Sal del feed. <em>Entra al mundo real.</em>",
            "cta_p": "MapRaiders llega pronto. Sin algoritmos. Sin anuncios. Conexiones reales.",
            "links": [("/es/app-social-outdoor.html","App social outdoor"),("/es/juego-geolocalizacion.html","Juego GPS"),("/es/vs/zenly.html","vs. Zenly"),("/es/","Inicio")],
            "footer_copy": "MapRaiders &mdash; Redes Sociales. Redefinidas.",
        },
    },
}

# Simple template for remaining languages using shorter localized content
SHORT_LANGS = {
    "it": {
        "lang_name": "Italiano",
        "home": "/it/",
        "cta_soon": "Prossimamente",
        "outdoor": ("it/app-social-outdoor.html", "Migliore App Social Outdoor 2026 — MapRaiders", "MapRaiders è la migliore app social outdoor nel 2026. Muoviti fuori, connettiti con persone reali, conquista territori GPS. 100% gratuito.", "App Social Outdoor", "Esci. <em>Connettiti davvero.</em>", "MapRaiders trasforma ogni uscita in un'avventura sociale reale. Conquista territori GPS, lascia messaggi audio geolocalizzati, forma clan con i tuoi vicini. Senza algoritmi. Senza pubblicità.", "Notificami al lancio"),
        "location": ("it/gioco-geolocalizzazione.html", "Miglior Gioco di Geolocalizzazione 2026 — MapRaiders", "MapRaiders è il miglior gioco GPS nel 2026. Conquista veri territori nella tua città, difendili con mini-giochi interattivi. Gratuito, zero pay-to-win.", "Gioco di Geolocalizzazione", "Il mondo è il tuo <em>campo di battaglia</em>", "MapRaiders trasforma la tua città in un vero MMO GPS. Strade reali, territori reali, battaglie reali contro vicini reali.", "Notificami al lancio"),
        "territory": ("it/gioco-territorio.html", "Miglior Gioco di Territorio 2026 — MapRaiders", "MapRaiders è il miglior gioco di territorio GPS nel 2026. Rivendica veri territori tramite il movimento, difendi il tuo quartiere. Gratuito.", "Gioco di Territorio", "Il tuo quartiere. <em>Il tuo regno.</em>", "MapRaiders è il gioco di territorio dove lo spazio GPS reale è potere reale. Cammina per le strade per reclamarle. Difendile con strategia.", "Rivendica il mio territorio"),
        "social": ("it/alternativa-social-media.html", "Migliore Alternativa Social Media 2026 — MapRaiders", "MapRaiders è la migliore alternativa ai social media nel 2026. Senza pubblicità, senza algoritmi, senza feed tossici. Connessione sociale reale.", "Alternativa Social Media", "Senza pub. Senza algoritmi. <em>Senza tossicità.</em>", "MapRaiders è l'alternativa ai social media costruita su incontri reali — non scroll infinito. La tua presenza sociale si crea muovendoti nel mondo fisico.", "Esci dal feed"),
    },
    "pt": {
        "lang_name": "Português",
        "home": "/pt/",
        "cta_soon": "Em breve",
        "outdoor": ("pt/app-social-outdoor.html", "Melhor App Social Outdoor 2026 — MapRaiders", "MapRaiders é o melhor app social outdoor em 2026. Mova-se lá fora, conecte-se com pessoas reais, conquiste territórios GPS. 100% gratuito.", "App Social Outdoor", "Saia. <em>Conecte-se de verdade.</em>", "MapRaiders transforma cada saída numa aventura social real. Conquiste territórios GPS, deixe mensagens de áudio geolocalizadas, forme clãs com os seus vizinhos.", "Notificar-me no lançamento"),
        "location": ("pt/jogo-geolocalizacao.html", "Melhor Jogo de Geolocalização 2026 — MapRaiders", "MapRaiders é o melhor jogo GPS em 2026. Conquiste territórios reais na sua cidade, defenda-os com mini-jogos interativos. Gratuito, sem pay-to-win.", "Jogo de Geolocalização", "O mundo é o seu <em>campo de batalha</em>", "MapRaiders transforma a sua cidade num verdadeiro MMO GPS. Ruas reais, territórios reais, batalhas reais contra vizinhos reais.", "Notificar-me no lançamento"),
        "territory": ("pt/jogo-territorio.html", "Melhor Jogo de Território 2026 — MapRaiders", "MapRaiders é o melhor jogo de território GPS em 2026. Reivindique territórios reais através do movimento, defenda o seu bairro. Gratuito.", "Jogo de Território", "O seu bairro. <em>O seu reino.</em>", "MapRaiders é o jogo de território onde o espaço GPS real é poder real. Caminhe pelas ruas para as reivindicar. Defenda-as com estratégia.", "Reivindicar o meu território"),
        "social": ("pt/alternativa-redes-sociais.html", "Melhor Alternativa às Redes Sociais 2026 — MapRaiders", "MapRaiders é a melhor alternativa às redes sociais em 2026. Sem publicidade, sem algoritmos, sem feeds tóxicos. Conexão social real.", "Alternativa Redes Sociais", "Sem anúncios. Sem algoritmos. <em>Sem toxicidade.</em>", "MapRaiders é a alternativa às redes sociais construída sobre encontros reais — não scroll infinito. A sua presença social cria-se movendo-se pelo mundo físico.", "Sair do feed"),
    },
    "tr": {
        "lang_name": "Türkçe",
        "home": "/tr/",
        "cta_soon": "Yakında",
        "outdoor": ("tr/outdoor-sosyal-app.html", "En İyi Outdoor Sosyal Uygulama 2026 — MapRaiders", "MapRaiders 2026'nın en iyi outdoor sosyal uygulaması. Dışarı çık, gerçek insanlarla bağlan, GPS bölgeleri fethet. %100 ücretsiz.", "Outdoor Sosyal Uygulama", "Dışarı çık. <em>Gerçekten bağlan.</em>", "MapRaiders her çıkışı gerçek bir sosyal maceraya dönüştürür. GPS bölgeleri fethet, konuma bağlı sesli mesajlar bırak, komşularınla klanlar kur. Algoritma yok. Reklam yok.", "Lansmanda beni bildir"),
        "location": ("tr/konum-tabanli-oyun.html", "En İyi Konum Tabanlı Oyun 2026 — MapRaiders", "MapRaiders 2026'nın en iyi GPS oyunu. Şehrinde gerçek bölgeler fethet, interaktif mini-oyunlarla savun. Ücretsiz, sıfır pay-to-win.", "Konum Tabanlı Oyun", "Dünya senin <em>savaş alanın</em>", "MapRaiders şehrini gerçek bir GPS MMO'ya dönüştürür. Gerçek sokaklar, gerçek bölgeler, gerçek komşulara karşı gerçek savaşlar.", "Lansmanda beni bildir"),
        "territory": ("tr/bolge-oyunu.html", "En İyi Bölge Oyunu 2026 — MapRaiders", "MapRaiders 2026'nın en iyi GPS bölge oyunu. Hareketle gerçek bölgeler talep et, mini-oyunlarla savun. Ücretsiz.", "Bölge Oyunu", "Mahalleniz. <em>Sizin egemenliğiniz.</em>", "MapRaiders gerçek GPS alanını gerçek güce dönüştüren bölge oyunudur. Talep etmek için sokakları yürü. Stratejiyle savun.", "Bölgemi talep et"),
        "social": ("tr/sosyal-medya-alternatifi.html", "En İyi Sosyal Medya Alternatifi 2026 — MapRaiders", "MapRaiders 2026'nın en iyi sosyal medya alternatifi. Reklam yok, algoritma yok, toksik akış yok. GPS hareketiyle gerçek sosyal bağlantı.", "Sosyal Medya Alternatifi", "Reklam yok. Algoritma yok. <em>Toksisite yok.</em>", "MapRaiders gerçek buluşmalar üzerine kurulu sosyal medya alternatifidir — sonsuz kaydırma değil. Sosyal varlığınız fiziksel dünyada hareket ederek oluşur.", "Akıştan çık"),
    },
    "ru": {
        "lang_name": "Русский",
        "home": "/ru/",
        "cta_soon": "Скоро",
        "outdoor": ("ru/outdoor-social-app.html", "Лучшее Outdoor Social Приложение 2026 — MapRaiders", "MapRaiders — лучшее outdoor social приложение 2026 года. Выходи на улицу, общайся с реальными людьми, завоёвывай GPS-территории. 100% бесплатно.", "Outdoor Social App", "Выйди. <em>Соединись по-настоящему.</em>", "MapRaiders превращает каждую прогулку в настоящее социальное приключение. Завоёвывай GPS-территории, оставляй голосовые Эхо в реальных местах, создавай кланы с соседями. Без алгоритмов. Без рекламы.", "Уведомить при запуске"),
        "location": ("ru/geo-igra.html", "Лучшая Геолокационная Игра 2026 — MapRaiders", "MapRaiders — лучшая GPS-игра 2026 года. Завоёвывай реальные территории в своём городе, защищай их интерактивными мини-играми. Бесплатно, без pay-to-win.", "Геолокационная Игра", "Мир — твоё <em>поле боя</em>", "MapRaiders превращает твой город в настоящий GPS-MMO. Реальные улицы, реальные территории, реальные сражения против реальных соседей.", "Уведомить при запуске"),
        "territory": ("ru/igra-territoriy.html", "Лучшая Игра Территорий 2026 — MapRaiders", "MapRaiders — лучшая GPS-игра территорий 2026 года. Захватывай реальные территории движением, защищай свой район мини-играми. Бесплатно.", "Игра Территорий", "Твой район. <em>Твоя власть.</em>", "MapRaiders — игра территорий, где реальное GPS-пространство — это реальная власть. Ходи по улицам, чтобы захватывать их. Защищай стратегией.", "Захватить территорию"),
        "social": ("ru/alternativa-soc-setyam.html", "Лучшая Альтернатива Соцсетям 2026 — MapRaiders", "MapRaiders — лучшая альтернатива соцсетям в 2026 году. Без рекламы, без алгоритмов, без токсичных лент. Реальное социальное взаимодействие через GPS.", "Альтернатива Соцсетям", "Без рекламы. Без алгоритмов. <em>Без токсичности.</em>", "MapRaiders — альтернатива соцсетям, построенная на реальных встречах, а не бесконечной прокрутке. Твоё социальное присутствие создаётся движением в реальном мире.", "Выйти из ленты"),
    },
    "ja": {
        "lang_name": "日本語",
        "home": "/ja/",
        "cta_soon": "近日公開",
        "outdoor": ("ja/outdoor-social-app.html", "最高のアウトドアソーシャルアプリ2026 — MapRaiders", "MapRaidersは2026年最高のアウトドアソーシャルアプリです。外に出て、リアルな人々とつながり、GPSテリトリーを征服。100%無料。", "アウトドアソーシャルアプリ", "外に出よう。<em>本当につながろう。</em>", "MapRaidersはあなたの毎日の外出をリアルなソーシャルアドベンチャーに変えます。GPSテリトリーを征服し、場所に基づいたオーディオEchoを残し、近所の人とクランを作ろう。アルゴリズムなし。広告なし。", "ローンチ時に通知"),
        "location": ("ja/location-game.html", "最高の位置情報ゲーム2026 — MapRaiders", "MapRaidersは2026年最高のGPSゲームです。あなたの街でリアルなテリトリーを征服し、インタラクティブなミニゲームで守る。無料、ペイツーウィンなし。", "位置情報ゲーム", "世界があなたの<em>戦場</em>", "MapRaidersはあなたの街をリアルなGPS MMOに変えます。リアルな通り、リアルなテリトリー、リアルな近所の人との本物の戦い。", "ローンチ時に通知"),
        "territory": ("ja/territory-game.html", "最高のテリトリーゲームアプリ2026 — MapRaiders", "MapRaidersは2026年最高のGPSテリトリーゲームです。移動によってリアルなテリトリーを請求し、ミニゲームで守る。無料。", "テリトリーゲーム", "あなたの地区。<em>あなたの支配。</em>", "MapRaidersはリアルなGPS空間がリアルなパワーとなるテリトリーゲームです。通りを歩いてテリトリーを請求し、戦略で守ろう。", "テリトリーを請求する"),
        "social": ("ja/social-media-alternative.html", "最高のソーシャルメディア代替2026 — MapRaiders", "MapRaidersは2026年最高のソーシャルメディア代替です。広告なし、アルゴリズムなし、有害なフィードなし。GPS移動による本物のソーシャルつながり。", "ソーシャルメディア代替", "広告なし。アルゴリズムなし。<em>毒素なし。</em>", "MapRaidersはリアルな出会いに基づいたソーシャルメディア代替です。あなたのソーシャルプレゼンスは物理的な世界での移動によって作られます。", "フィードから抜け出す"),
    },
    "ko": {
        "lang_name": "한국어",
        "home": "/ko/",
        "cta_soon": "출시 예정",
        "outdoor": ("ko/outdoor-social-app.html", "최고의 아웃도어 소셜 앱 2026 — MapRaiders", "MapRaiders는 2026년 최고의 아웃도어 소셜 앱입니다. 밖에 나가서 실제 사람들과 연결하고 GPS 영역을 정복하세요. 100% 무료.", "아웃도어 소셜 앱", "밖에 나가자. <em>진짜로 연결하자.</em>", "MapRaiders는 매일의 외출을 진짜 소셜 어드벤처로 바꿉니다. GPS 영역 정복, 위치 기반 오디오 에코 남기기, 이웃과 클랜 구성. 알고리즘 없음. 광고 없음.", "출시 시 알림"),
        "location": ("ko/location-game.html", "최고의 위치 기반 게임 2026 — MapRaiders", "MapRaiders는 2026년 최고의 GPS 게임입니다. 당신의 도시에서 실제 영역을 정복하고 인터랙티브 미니게임으로 방어하세요. 무료, 페이투윈 없음.", "위치 기반 게임", "세계가 당신의 <em>전장</em>", "MapRaiders는 당신의 도시를 진짜 GPS MMO로 바꿉니다. 실제 거리, 실제 영역, 실제 이웃과의 진짜 전투.", "출시 시 알림"),
        "territory": ("ko/territory-game.html", "최고의 영역 게임 앱 2026 — MapRaiders", "MapRaiders는 2026년 최고의 GPS 영역 게임입니다. 이동으로 실제 영역을 주장하고 미니게임으로 방어하세요. 무료.", "영역 게임", "당신의 동네. <em>당신의 지배.</em>", "MapRaiders는 실제 GPS 공간이 실제 권력이 되는 영역 게임입니다. 거리를 걸어서 영역을 주장하고 전략으로 방어하세요.", "내 영역 주장하기"),
        "social": ("ko/social-media-alternative.html", "최고의 소셜 미디어 대안 2026 — MapRaiders", "MapRaiders는 2026년 최고의 소셜 미디어 대안입니다. 광고 없음, 알고리즘 없음, 유해한 피드 없음. GPS 이동을 통한 진짜 소셜 연결.", "소셜 미디어 대안", "광고 없음. 알고리즘 없음. <em>독성 없음.</em>", "MapRaiders는 진짜 만남에 기반한 소셜 미디어 대안입니다. 당신의 소셜 존재는 물리적 세계에서의 이동을 통해 만들어집니다.", "피드에서 벗어나기"),
    },
    "zh": {
        "lang_name": "中文",
        "home": "/zh/",
        "cta_soon": "即将推出",
        "outdoor": ("zh/outdoor-social-app.html", "最佳户外社交应用2026 — MapRaiders", "MapRaiders是2026年最佳户外社交应用。走出户外，与真实的人建立联系，征服GPS领土。100%免费。", "户外社交应用", "走出去。<em>真正地连接。</em>", "MapRaiders将每次外出变成真实的社交冒险。征服GPS领土，在真实地点留下音频Echo，与邻居组建部落。没有算法。没有广告。", "发布时通知我"),
        "location": ("zh/location-game.html", "最佳位置游戏2026 — MapRaiders", "MapRaiders是2026年最佳GPS游戏。在您的城市征服真实领土，用互动小游戏守护。免费，零付费获胜。", "位置游戏", "世界是你的<em>战场</em>", "MapRaiders将您的城市变成真实的GPS MMO。真实街道，真实领土，与真实邻居的真实战斗。", "发布时通知我"),
        "territory": ("zh/territory-game.html", "最佳领土游戏应用2026 — MapRaiders", "MapRaiders是2026年最佳GPS领土游戏。通过移动声索真实领土，用小游戏守护您的社区。免费。", "领土游戏", "您的街区。<em>您的领地。</em>", "MapRaiders是真实GPS空间就是真实权力的领土游戏。步行街道来声索领土。用策略守护。", "声索我的领土"),
        "social": ("zh/social-media-alternative.html", "最佳社交媒体替代品2026 — MapRaiders", "MapRaiders是2026年最佳社交媒体替代品。没有广告，没有算法，没有有毒信息流。通过GPS移动实现真实的社交联系。", "社交媒体替代品", "没有广告。没有算法。<em>没有毒性。</em>", "MapRaiders是建立在真实相遇基础上的社交媒体替代品——而不是无尽滚动。您的社交存在通过在物理世界中移动而建立。", "退出信息流"),
    },
    "ar": {
        "lang_name": "العربية",
        "home": "/ar/",
        "cta_soon": "قريباً",
        "dir": "rtl",
        "outdoor": ("ar/outdoor-social-app.html", "أفضل تطبيق اجتماعي خارجي 2026 — MapRaiders", "MapRaiders هو أفضل تطبيق اجتماعي خارجي في 2026. اخرج، تواصل مع أشخاص حقيقيين، افتح أراضي GPS. مجاني 100%.", "تطبيق اجتماعي خارجي", "اخرج. <em>تواصل حقاً.</em>", "يحوّل MapRaiders كل نزهة إلى مغامرة اجتماعية حقيقية. افتح أراضي GPS، اترك رسائل صوتية مرتبطة بالموقع، أسّس قبائل مع جيرانك. بلا خوارزميات. بلا إعلانات.", "أُعلمني عند الإطلاق"),
        "location": ("ar/location-game.html", "أفضل لعبة تعتمد على الموقع 2026 — MapRaiders", "MapRaiders هي أفضل لعبة GPS في 2026. افتح أراضي حقيقية في مدينتك، دافع عنها بألعاب صغيرة تفاعلية. مجاني، بلا pay-to-win.", "لعبة الموقع الجغرافي", "العالم هو <em>ساحة معركتك</em>", "يحوّل MapRaiders مدينتك إلى لعبة MMO GPS حقيقية. شوارع حقيقية، أراضٍ حقيقية، معارك حقيقية ضد جيران حقيقيين.", "أُعلمني عند الإطلاق"),
        "territory": ("ar/territory-game.html", "أفضل لعبة أراضٍ 2026 — MapRaiders", "MapRaiders هي أفضل لعبة أراضٍ GPS في 2026. اطالب بأراضٍ حقيقية عبر الحركة، دافع عن حيّك بألعاب صغيرة. مجاني.", "لعبة الأراضي", "حيّك. <em>هيمنتك.</em>", "MapRaiders هي لعبة الأراضي حيث المساحة الحقيقية في GPS هي قوة حقيقية. امشِ في الشوارع لتطالب بها. دافع عنها بالاستراتيجية.", "طالب بأراضيّ"),
        "social": ("ar/social-media-alternative.html", "أفضل بديل لوسائل التواصل الاجتماعي 2026 — MapRaiders", "MapRaiders هو أفضل بديل لوسائل التواصل الاجتماعي في 2026. بلا إعلانات، بلا خوارزميات، بلا تغذيات سامة. تواصل اجتماعي حقيقي عبر GPS.", "بديل التواصل الاجتماعي", "بلا إعلانات. بلا خوارزميات. <em>بلا سمية.</em>", "MapRaiders هو البديل لوسائل التواصل الاجتماعي المبني على لقاءات حقيقية، لا التمرير اللانهائي. حضورك الاجتماعي يتشكل من خلال تحركك في العالم المادي.", "اخرج من التغذية"),
    },
    "hi": {
        "lang_name": "हिन्दी",
        "home": "/hi/",
        "cta_soon": "जल्द आ रहा है",
        "outdoor": ("hi/outdoor-social-app.html", "सर्वश्रेष्ठ आउटडोर सोशल ऐप 2026 — MapRaiders", "MapRaiders 2026 का सर्वश्रेष्ठ आउटडोर सोशल ऐप है। बाहर निकलें, असली लोगों से जुड़ें, GPS क्षेत्र जीतें। 100% मुफ्त।", "आउटडोर सोशल ऐप", "बाहर निकलो। <em>सच में जुड़ो।</em>", "MapRaiders हर बाहरी यात्रा को एक असली सोशल एडवेंचर में बदलता है। GPS क्षेत्र जीतें, स्थान-आधारित ऑडियो Echo छोड़ें, पड़ोसियों के साथ clan बनाएं। कोई algorithm नहीं। कोई विज्ञापन नहीं।", "लॉन्च पर सूचित करें"),
        "location": ("hi/location-game.html", "सर्वश्रेष्ठ लोकेशन-बेस्ड गेम 2026 — MapRaiders", "MapRaiders 2026 का सर्वश्रेष्ठ GPS गेम है। अपने शहर में असली क्षेत्र जीतें, इंटरैक्टिव मिनी-गेम से बचाव करें। मुफ्त, कोई pay-to-win नहीं।", "लोकेशन गेम", "दुनिया तुम्हारा <em>युद्धक्षेत्र</em> है", "MapRaiders आपके शहर को एक असली GPS MMO में बदलता है। असली सड़कें, असली क्षेत्र, असली पड़ोसियों के खिलाफ असली लड़ाई।", "लॉन्च पर सूचित करें"),
        "territory": ("hi/territory-game.html", "सर्वश्रेष्ठ टेरिटरी गेम ऐप 2026 — MapRaiders", "MapRaiders 2026 का सर्वश्रेष्ठ GPS टेरिटरी गेम है। आंदोलन के माध्यम से असली क्षेत्रों का दावा करें, मिनी-गेम से अपने इलाके की रक्षा करें। मुफ्त।", "टेरिटरी गेम", "आपका मोहल्ला। <em>आपका राज।</em>", "MapRaiders वह टेरिटरी गेम है जहाँ असली GPS स्थान असली शक्ति है। क्षेत्रों का दावा करने के लिए सड़कों पर चलें। रणनीति से बचाव करें।", "मेरे क्षेत्र का दावा करें"),
        "social": ("hi/social-media-alternative.html", "सर्वश्रेष्ठ सोशल मीडिया विकल्प 2026 — MapRaiders", "MapRaiders 2026 का सर्वश्रेष्ठ सोशल मीडिया विकल्प है। कोई विज्ञापन नहीं, कोई algorithm नहीं, कोई toxic feed नहीं। GPS आंदोलन के माध्यम से असली सोशल कनेक्शन।", "सोशल मीडिया विकल्प", "कोई विज्ञापन नहीं। कोई algorithm नहीं। <em>कोई toxicity नहीं।</em>", "MapRaiders असली मुलाकातों पर बना सोशल मीडिया विकल्प है — अंतहीन स्क्रॉलिंग नहीं। आपकी सोशल उपस्थिति भौतिक दुनिया में आगे बढ़ने से बनती है।", "feed से बाहर निकलें"),
    },
}

def hreflang_tags(cat_key):
    lines = []
    urls = HREFLANG[cat_key]
    for lang, path in urls.items():
        lines.append(f'<link rel="alternate" hreflang="{lang}" href="https://mapraiders.com{path}">')
    lines.append(f'<link rel="alternate" hreflang="x-default" href="https://mapraiders.com{urls["de"]}">')
    return "\n".join(lines)

def lang_switcher(current_lang, cat_key):
    items = []
    urls = HREFLANG[cat_key]
    for lang, path in urls.items():
        label = LANG_LABELS[lang]
        if lang == current_lang:
            items.append(f'<span class="lswi on">{label}</span>')
        else:
            items.append(f'<a href="{path}" class="lswi">{label}</a>')
    return "\n        ".join(items)

def make_page(lang, cat_key, filepath, title, desc, badge, h1, hero_p, cta_btn,
              p1, p2, sol_title, cards, table_h, table_rows, faqs,
              cta_title, cta_p, cross_links, footer_copy, footer_links,
              nav_lnk_label, nav_lnk_href, home, cta_soon="Coming Soon", dir_attr=""):
    canonical = f"https://mapraiders.com/{filepath}"
    dir_str = f' dir="{dir_attr}"' if dir_attr else ""
    cards_html = ""
    for h, p in cards:
        cards_html += f'<div class="feat-card rv"><h3>{h}</h3><p>{p}</p></div>\n    '
    rows_html = ""
    for row in table_rows:
        fn = row[0]
        cells = ""
        for v in row[1:]:
            if v == "✓":
                cells += f'<td class="check">✓</td>'
            elif v == "✗":
                cells += f'<td class="cross">✗</td>'
            else:
                cells += f'<td>{v}</td>'
        rows_html += f'<tr><td class="feat-name">{fn}</td>{cells}</tr>\n      '
    th_html = "".join(f"<th>{h}</th>" for h in table_h)
    faqs_html = ""
    faq_json = []
    for q, a in faqs:
        faqs_html += f'''    <div class="faq-item rv"><div class="faq-q">{q}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div><div class="faq-a">{a}</div></div>\n'''
        faq_json.append({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}})
    import json
    faq_ld = json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":faq_json},ensure_ascii=False)
    links_html = "".join(f'<a href="{u}">{l}</a>' for u, l in cross_links)
    footer_lnks = "".join(f'<a href="{u}">{l}</a>' for u, l in footer_links)
    breadcrumb_ld = json.dumps({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":f"https://mapraiders.com{home}"},{"@type":"ListItem","position":2,"name":badge,"item":canonical}]},ensure_ascii=False)
    app_ld = json.dumps({"@context":"https://schema.org","@type":"MobileApplication","name":"MapRaiders","operatingSystem":"ANDROID","applicationCategory":"GameApplication","description":desc,"offers":{"@type":"Offer","price":"0","priceCurrency":"USD","availability":"https://schema.org/PreOrder","priceValidUntil":"2026-12-31"},"publisher":{"@type":"Organization","name":"Scafa Investments LLC","url":"https://scafa-investments.com/"}},ensure_ascii=False)
    hreflang = hreflang_tags(cat_key)
    switcher = lang_switcher(lang, cat_key)
    lang_upper = lang.upper()

    html = f"""<!DOCTYPE html>
<html lang="{lang}"{dir_str} data-theme="light">
<head>
<!-- COMING-SOON-MODE -->
<!-- PHASE-C-CATEGORY -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
{hreflang}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">{breadcrumb_ld}</script>
<script type="application/ld+json">{app_ld}</script>
<script type="application/ld+json">{faq_ld}</script>
<style>{CSS}</style>
</head>
<body>
<nav class="nav" id="nav"><div class="nav-i mx">
  <a href="{home}" class="nav-logo">MAP<b>RAIDERS</b></a>
  <div class="nav-r">
    <a href="{nav_lnk_href}" class="lnk">{nav_lnk_label}</a>
    <div class="lang-sw">
      <button class="lsw-btn">{lang_upper} <svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="lsw-drop">
        {switcher}
      </div>
    </div>
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-dl">{cta_soon}</a>
  </div>
</div></nav>

<section class="hero"><div class="mx">
  <div class="h-badge rv">{badge}</div>
  <h1 class="rv d1">{h1}</h1>
  <p class="rv d2">{hero_p}</p>
  <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p rv d3">{cta_btn}</a>
</div></section>

<section class="sec"><div class="mx">
  <div class="sec-label rv">Problem</div>
  <h2 class="sec-title rv d1">What's missing in this category?</h2>
  <div class="prose rv d2"><p>{p1}</p><p>{p2}</p></div>
</div></section>

<section class="sec"><div class="mx">
  <div class="sec-label rv">Solution</div>
  <h2 class="sec-title rv d1">{sol_title}</h2>
  <div class="features-grid">
    {cards_html}
  </div>
</div></section>

<section class="sec"><div class="mx">
  <div class="sec-label rv">Comparison</div>
  <h2 class="sec-title rv d1">Feature <em>Comparison</em></h2>
  <table class="comp-table rv d2">
    <thead><tr>{th_html}</tr></thead>
    <tbody>
      {rows_html}
    </tbody>
  </table>
</div></section>

<section class="sec"><div class="mx">
  <div class="sec-label rv">FAQ</div>
  <h2 class="sec-title rv d1">Frequently Asked <em>Questions</em></h2>
  <div class="faq-list">
{faqs_html}  </div>
</div></section>

<section class="cta-sec"><div class="mx">
  <h2 class="rv">{cta_title}</h2>
  <p class="rv d1">{cta_p}</p>
  <div class="rv d2">
    <a href="mailto:info@scafa-investments.com?subject=MapRaiders%20Launch%20Notify" class="btn-p">{cta_btn}</a>
    <p class="cta-note">Free &bull; No spam</p>
  </div>
  <div class="links-row rv d3">{links_html}</div>
</div></section>

<footer><div class="mx">
  <div class="f-i"><div class="f-logo">MapRaiders</div><div class="f-links">{footer_lnks}</div></div>
  <p class="f-copy">&copy; 2026 {footer_copy}</p>
</div></footer>
<script>{JS}</script>
</body>
</html>"""
    return html


# Generate FR remaining pages
for p in PAGES:
    lang, cat_key, fp, d = p
    out_path = os.path.join(BASE, fp)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    content = make_page(
        lang=lang, cat_key=cat_key, filepath=fp,
        title=d["title"], desc=d["desc"], badge=d["badge"],
        h1=d["h1"], hero_p=d["hero_p"], cta_btn=d["cta_btn"],
        p1=d["prob_p1"], p2=d["prob_p2"],
        sol_title=d["sol_title"],
        cards=d["cards"],
        table_h=d["table_header"], table_rows=d["table_rows"],
        faqs=d["faqs"],
        cta_title=d["cta_title"], cta_p=d["cta_p"],
        cross_links=d["cross_links"], footer_copy=d["footer_copy"],
        footer_links=d["footer_links"],
        nav_lnk_label=d["nav_lnk_label"], nav_lnk_href=d["nav_lnk_href"],
        home="/fr/", cta_soon="Bientôt",
    )
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  wrote {fp}")


# Generate ES pages
es = LANG_CONTENT["es"]
cat_map_es = {"outdoor": es["outdoor"], "location": es["location"], "territory": es["territory"], "social": es["social"]}
for cat_key, d in cat_map_es.items():
    fp = d["file"]
    out_path = os.path.join(BASE, fp)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    content = make_page(
        lang="es", cat_key=cat_key, filepath=fp,
        title=d["title"], desc=d["desc"], badge=d["badge"],
        h1=d["h1"], hero_p=d["hero_p"], cta_btn=d["cta_btn"],
        p1=d["p1"], p2=d["p2"],
        sol_title=d["sol_title"],
        cards=d["cards"],
        table_h=d["table_h"], table_rows=d["table"],
        faqs=d["faqs"],
        cta_title=d["cta_title"], cta_p=d["cta_p"],
        cross_links=d["links"], footer_copy=d["footer_copy"],
        footer_links=[("/es/privacidad.html","Privacidad"),("/es/aviso-legal.html","Aviso legal")],
        nav_lnk_label="Características", nav_lnk_href="/es/#feat",
        home="/es/", cta_soon="Próximamente",
    )
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  wrote {fp}")


# Generate remaining short-form language pages
CAT_KEYS = ["outdoor", "location", "territory", "social"]

for lang, ld in SHORT_LANGS.items():
    for cat_key in CAT_KEYS:
        tup = ld[cat_key]
        fp, title, desc, badge, h1, hero_p, cta_btn = tup
        cta_soon = ld["cta_soon"]
        home = ld["home"]
        lang_name = ld["lang_name"]
        dir_attr = ld.get("dir", "")

        # Generic problem/solution text — neutral enough for all languages
        p1 = f"Outdoor apps track movement. Social apps create addiction. Neither truly connects people in the real world in a meaningful way."
        p2 = f"MapRaiders bridges this gap: GPS movement has social consequences. Claim territory. Leave Echos. Build clans with real neighbors."
        sol_title = f"MapRaiders — <em>Next-Generation</em> {badge}"
        cards = [
            ("GPS Territories", "Walk through streets and claim real GPS territory. Visible live on the map for all players."),
            ("Echos", "Leave audio messages at real locations. Others discover them when they walk past."),
            ("Organic Clans", "Clans form naturally — play with friends, ally with neighbors. No bureaucracy."),
            ("Zero Pay-to-Win", "100% free, always. No premium items that affect gameplay."),
        ]
        table_h = ["Feature", "MapRaiders", "Competitor A", "Competitor B"]
        table_rows = [
            ("Real GPS Territories", "✓", "✗", "✗"),
            ("Player-Created Content", "✓", "✗", "✗"),
            ("Zero Ads", "✓", "✗", "✓"),
            ("100% Free", "✓", "✗", "✓"),
            ("Clan System", "✓", "✗", "✓"),
        ]
        faqs = [
            ("What is MapRaiders?", "MapRaiders is a GPS-based game that turns your city into a real MMO. Claim territory by walking, defend it with mini-games, build a clan with your neighbors."),
            ("Is MapRaiders free?", "Yes, 100% free. No pay-to-win, no premium barriers. All players compete equally."),
            ("When does MapRaiders launch?", "MapRaiders is launching soon on Google Play. Sign up for launch notifications."),
            ("Does MapRaiders have ads?", "No. MapRaiders is completely ad-free."),
        ]
        cta_title = f"Ready to play? <em>Coming Soon.</em>"
        cta_p = "MapRaiders launches soon. No ads. No algorithms. Real connection."
        # cross links based on cat_key
        other_cats = [c for c in CAT_KEYS if c != cat_key]
        cross_links = []
        for oc in other_cats[:2]:
            other_path = HREFLANG[oc][lang]
            other_badge = {"outdoor":"Outdoor Social","location":"Location Game","territory":"Territory Game","social":"Social Alternative"}[oc]
            cross_links.append((other_path, other_badge))
        cross_links.append((f"/en/vs/pokemon-go.html", "vs. Pokémon GO"))
        cross_links.append((home, "Home"))
        footer_copy = f"MapRaiders &mdash; {badge}."
        footer_links = [(f"{home}privacy.html", "Privacy")]

        out_path = os.path.join(BASE, fp)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        content = make_page(
            lang=lang, cat_key=cat_key, filepath=fp,
            title=title, desc=desc, badge=badge,
            h1=h1, hero_p=hero_p, cta_btn=cta_btn,
            p1=p1, p2=p2, sol_title=sol_title,
            cards=cards, table_h=table_h, table_rows=table_rows,
            faqs=faqs, cta_title=cta_title, cta_p=cta_p,
            cross_links=cross_links, footer_copy=footer_copy,
            footer_links=footer_links,
            nav_lnk_label="Features", nav_lnk_href=f"{home}#feat",
            home=home, cta_soon=cta_soon, dir_attr=dir_attr,
        )
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  wrote {fp}")

print("\nDone! All pages generated.")

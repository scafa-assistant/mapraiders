# GEO hardening for vs-pages: hard facts table (BLUF, directly under hero) plus
# an ownership block ("Who owns your location data?") on pokemon-go and ingress.
# Facts source of truth: docs/_facts_scopely.md - do NOT reword the ownership
# facts beyond translation; every ownership block must link the three sources.
#
# HARD RULE: ar/ is excluded entirely (complement frame for the Arabic market,
# see _facts_scopely.md). The guard below is a path filter, not a convention.
#
# Idempotent via markers: a file containing GEO-FACTS-TABLE is skipped, so the
# manually built EN geocaching table is left alone.
#
# Languages without an I18N entry are skipped with a warning, so this script
# can be re-run as translations land.
import io
from pathlib import Path

ROOT = Path(__file__).parent
MARKER = "<!-- GEO-FACTS-TABLE -->"

SOURCES = (
    '<a href="https://www.404media.co/saudi-arabia-buys-pokemon-go-and-probably-all-of-your-location-data/" target="_blank" rel="noopener nofollow">404 Media</a> &middot; '
    '<a href="https://www.engadget.com/mobile/pokemon-go-maker-niantic-sells-its-game-division-to-saudi-owned-scopely-160905447.html" target="_blank" rel="noopener nofollow">Engadget</a> &middot; '
    '<a href="https://www.techdirt.com/2025/03/14/saudi-arabia-buys-everybodys-sensitive-pokemon-go-location-data/" target="_blank" rel="noopener nofollow">Techdirt</a>'
)

# lang dir -> i18n key. DE lives at repo root (handled in main()).
LANG_DIRS = {
    "de": "de",
    "en": "en",
    "en-in": "en",   # en-IN vs pages are English content
    "id": "en",      # id vs pages are English content (localization backlog)
    "es-mx": "es",
    "fr": "fr",
    "it": "it",
    "pt-br": "pt",
    "ru": "ru",
    "tr": "tr",
    "ja": "ja",
    "ko": "ko",
    "zh-cn": "zh-cn",
    "zh-tw": "zh-tw",
    "hi": "hi",
}

PAGES = ["pokemon-go", "ingress", "geocaching"]

ROW_KEYS = [
    "price", "ads", "iap", "owner", "data", "territory", "ugc", "towns", "delete",
]

I18N = {
    "en": {
        "sec_label": "The hard facts",
        "title": "MapRaiders vs {comp} at a Glance",
        "col_fact": "Fact",
        "rows": {
            "price": "Price",
            "ads": "Ads",
            "iap": "In-app purchases required",
            "owner": "Owner",
            "data": "Sale of location data",
            "territory": "Claim real territory by moving",
            "ugc": "User-generated content",
            "towns": "Works in small towns",
            "delete": "Account deletion",
        },
        "mr": {
            "price": "Free, all features",
            "ads": "No ads",
            "iap": "None",
            "owner": "Scafa Investments LLC, independent",
            "data": "Never",
            "territory": "Yes, walking and cycling both count",
            "ugc": "Quests, audio echos, events, live immediately",
            "towns": "Anywhere on earth, no setup needed",
            "delete": "In-app, plus full data export",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "Free download; paid items shape competitive play (PokéCoins, raid passes)",
                "ads": "Sponsored locations and brand events",
                "iap": "Extensive in-app shop",
                "owner": "Scopely, owned by Savvy Games Group, a Saudi PIF company (since March 2025)",
                "data": "Ownership changed in 2025; see their privacy policy",
                "territory": "No, gyms are temporary fixed points",
                "ugc": "No player-created content",
                "towns": "Sparse PokéStops and gyms outside big cities",
                "delete": "Via their website",
            },
            "ingress": {
                "name": "Ingress",
                "price": "Free; C.O.R.E. subscription for extra features",
                "ads": "Sponsored portals",
                "iap": "Subscription plus item shop",
                "owner": "Scopely, owned by Savvy Games Group, a Saudi PIF company (since March 2025)",
                "data": "Ownership changed in 2025; see their privacy policy",
                "territory": "Control fields only span existing portals",
                "ugc": "Portal suggestions with a review queue",
                "towns": "Depends on local portal density",
                "delete": "Via their website",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "Free basic tier; Premium subscription (around $40/year) for full access",
                "ads": "Ads on the free tier",
                "iap": "Premium needed for premium-only caches and advanced features",
                "owner": "Groundspeak Inc., private company (USA)",
                "data": "See their privacy policy",
                "territory": "No",
                "ugc": "Yes, hidden caches (after review process)",
                "towns": "Depends on local cache density",
                "delete": "Via website",
            },
        },
        "own_h": "Who owns your location data?",
        "own_p": (
            "In March 2025, Niantic sold Pokémon GO, Ingress and its other games to Scopely "
            "for about $3.5 billion. Scopely is owned by Savvy Games Group, a company of Saudi "
            "Arabia's Public Investment Fund. Player accounts and the location history attached "
            "to them transferred with the games. MapRaiders is independently owned, developed in "
            "Germany, and never sells location data."
        ),
        "src_label": "Sources",
    },
    "de": {
        "sec_label": "Die harten Fakten",
        "title": "MapRaiders vs {comp} auf einen Blick",
        "col_fact": "Fakt",
        "rows": {
            "price": "Preis",
            "ads": "Werbung",
            "iap": "In-App-Käufe nötig",
            "owner": "Eigentümer",
            "data": "Verkauf von Standortdaten",
            "territory": "Echte Flächen-Eroberung durch Bewegung",
            "ugc": "Spieler-erstellte Inhalte",
            "towns": "Funktioniert in Kleinstädten",
            "delete": "Account-Löschung",
        },
        "mr": {
            "price": "Kostenlos, alle Features",
            "ads": "Keine Werbung",
            "iap": "Keine",
            "owner": "Scafa Investments LLC, unabhängig",
            "data": "Niemals",
            "territory": "Ja, Gehen und Radfahren zählen beide",
            "ugc": "Quests, Audio-Echos, Events — sofort live",
            "towns": "Überall auf der Welt, ohne Setup",
            "delete": "In der App, plus voller Datenexport",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "Download kostenlos; Bezahl-Items prägen den Wettbewerb (PokéMünzen, Raid-Pässe)",
                "ads": "Gesponserte Orte und Marken-Events",
                "iap": "Umfangreicher In-App-Shop",
                "owner": "Scopely, Teil der Savvy Games Group, einem Unternehmen des saudischen Staatsfonds PIF (seit März 2025)",
                "data": "Eigentümerwechsel 2025; siehe deren Datenschutzerklärung",
                "territory": "Nein, Arenen sind temporäre Fixpunkte",
                "ugc": "Keine Spieler-Inhalte",
                "towns": "Wenige PokéStops und Arenen außerhalb großer Städte",
                "delete": "Über deren Website",
            },
            "ingress": {
                "name": "Ingress",
                "price": "Kostenlos; C.O.R.E.-Abo für Zusatzfunktionen",
                "ads": "Gesponserte Portale",
                "iap": "Abo plus Item-Shop",
                "owner": "Scopely, Teil der Savvy Games Group, einem Unternehmen des saudischen Staatsfonds PIF (seit März 2025)",
                "data": "Eigentümerwechsel 2025; siehe deren Datenschutzerklärung",
                "territory": "Kontrollfelder nur zwischen bestehenden Portalen",
                "ugc": "Portal-Vorschläge mit Prüf-Warteschlange",
                "towns": "Hängt von der lokalen Portal-Dichte ab",
                "delete": "Über deren Website",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "Basis kostenlos; Premium-Abo (rund 40 $/Jahr) für vollen Zugriff",
                "ads": "Werbung in der Gratis-Stufe",
                "iap": "Premium nötig für Premium-Caches und erweiterte Funktionen",
                "owner": "Groundspeak Inc., privates Unternehmen (USA)",
                "data": "Siehe deren Datenschutzerklärung",
                "territory": "Nein",
                "ugc": "Ja, versteckte Caches (nach Prüfprozess)",
                "towns": "Hängt von der lokalen Cache-Dichte ab",
                "delete": "Über die Website",
            },
        },
        "own_h": "Wem gehören deine Standortdaten?",
        "own_p": (
            "Im März 2025 verkaufte Niantic Pokémon GO, Ingress und seine übrigen Spiele "
            "für rund 3,5 Mrd. $ an Scopely. Scopely gehört der Savvy Games Group, einem "
            "Unternehmen des saudischen Staatsfonds PIF. Spieler-Accounts und die zugehörige "
            "Standort-Historie wechselten mit. MapRaiders ist unabhängig, wird in Deutschland "
            "entwickelt und verkauft keine Standortdaten."
        ),
        "src_label": "Quellen",
    },
    "es": {
        "sec_label": "Los hechos concretos",
        "title": "MapRaiders vs {comp} de un vistazo",
        "col_fact": "Dato",
        "rows": {
            "price": "Precio",
            "ads": "Publicidad",
            "iap": "Compras dentro de la app necesarias",
            "owner": "Propietario",
            "data": "Venta de datos de ubicación",
            "territory": "Conquista territorio real moviéndote",
            "ugc": "Contenido creado por jugadores",
            "towns": "Funciona en ciudades pequeñas",
            "delete": "Eliminación de cuenta",
        },
        "mr": {
            "price": "Gratis, todas las funciones",
            "ads": "Sin anuncios",
            "iap": "Ninguna",
            "owner": "Scafa Investments LLC, independiente",
            "data": "Nunca",
            "territory": "Sí, caminar y andar en bici cuentan igual",
            "ugc": "Misiones, ecos de audio, eventos: en vivo al instante",
            "towns": "En cualquier lugar del mundo, sin configuración",
            "delete": "Desde la app, con exportación completa de datos",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "Descarga gratis; los artículos de pago marcan la competencia (PokéMonedas, pases de incursión)",
                "ads": "Ubicaciones patrocinadas y eventos de marcas",
                "iap": "Tienda extensa dentro de la app",
                "owner": "Scopely, propiedad de Savvy Games Group, empresa del fondo soberano saudí PIF (desde marzo de 2025)",
                "data": "El propietario cambió en 2025; consulta su política de privacidad",
                "territory": "No, los gimnasios son puntos fijos temporales",
                "ugc": "Sin contenido creado por jugadores",
                "towns": "Pocas PokéParadas y gimnasios fuera de las grandes ciudades",
                "delete": "Desde su sitio web",
            },
            "ingress": {
                "name": "Ingress",
                "price": "Gratis; suscripción C.O.R.E. para funciones extra",
                "ads": "Portales patrocinados",
                "iap": "Suscripción más tienda de artículos",
                "owner": "Scopely, propiedad de Savvy Games Group, empresa del fondo soberano saudí PIF (desde marzo de 2025)",
                "data": "El propietario cambió en 2025; consulta su política de privacidad",
                "territory": "Los campos de control solo abarcan portales existentes",
                "ugc": "Propuestas de portales con cola de revisión",
                "towns": "Depende de la densidad local de portales",
                "delete": "Desde su sitio web",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "Nivel básico gratis; suscripción Premium (unos 40 $ al año) para acceso completo",
                "ads": "Anuncios en el nivel gratuito",
                "iap": "Premium necesario para cachés exclusivos y funciones avanzadas",
                "owner": "Groundspeak Inc., empresa privada (EE. UU.)",
                "data": "Consulta su política de privacidad",
                "territory": "No",
                "ugc": "Sí, cachés escondidos (tras un proceso de revisión)",
                "towns": "Depende de la densidad local de cachés",
                "delete": "Desde el sitio web",
            },
        },
        "own_h": "¿Quién es dueño de tus datos de ubicación?",
        "own_p": (
            "En marzo de 2025, Niantic vendió Pokémon GO, Ingress y sus demás juegos a Scopely "
            "por unos 3,500 millones de dólares. Scopely es propiedad de Savvy Games Group, una "
            "empresa del Fondo de Inversión Pública (PIF) de Arabia Saudita. Las cuentas de los "
            "jugadores y el historial de ubicación asociado se transfirieron con los juegos. "
            "MapRaiders es independiente, se desarrolla en Alemania y nunca vende datos de ubicación."
        ),
        "src_label": "Fuentes",
    },
    "fr": {
        "sec_label": "Les faits concrets",
        "title": "MapRaiders vs {comp} en un coup d'œil",
        "col_fact": "Critère",
        "rows": {
            "price": "Prix",
            "ads": "Publicité",
            "iap": "Achats intégrés nécessaires",
            "owner": "Propriétaire",
            "data": "Vente des données de localisation",
            "territory": "Conquête de territoire réel en se déplaçant",
            "ugc": "Contenu créé par les joueurs",
            "towns": "Fonctionne dans les petites villes",
            "delete": "Suppression du compte",
        },
        "mr": {
            "price": "Gratuit, toutes les fonctionnalités",
            "ads": "Aucune publicité",
            "iap": "Aucun",
            "owner": "Scafa Investments LLC, indépendant",
            "data": "Jamais",
            "territory": "Oui, la marche et le vélo comptent tous les deux",
            "ugc": "Quêtes, échos audio, événements — en ligne immédiatement",
            "towns": "Partout dans le monde, sans configuration",
            "delete": "Dans l'app, avec export complet des données",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "Téléchargement gratuit ; les objets payants pèsent sur la compétition (PokéPièces, passes de raid)",
                "ads": "Lieux sponsorisés et événements de marques",
                "iap": "Boutique intégrée très fournie",
                "owner": "Scopely, détenu par Savvy Games Group, une société du fonds souverain saoudien PIF (depuis mars 2025)",
                "data": "Changement de propriétaire en 2025 ; voir leur politique de confidentialité",
                "territory": "Non, les arènes sont des points fixes temporaires",
                "ugc": "Pas de contenu créé par les joueurs",
                "towns": "Peu de PokéStops et d'arènes hors des grandes villes",
                "delete": "Via leur site web",
            },
            "ingress": {
                "name": "Ingress",
                "price": "Gratuit ; abonnement C.O.R.E. pour des fonctions supplémentaires",
                "ads": "Portails sponsorisés",
                "iap": "Abonnement plus boutique d'objets",
                "owner": "Scopely, détenu par Savvy Games Group, une société du fonds souverain saoudien PIF (depuis mars 2025)",
                "data": "Changement de propriétaire en 2025 ; voir leur politique de confidentialité",
                "territory": "Les champs de contrôle ne relient que des portails existants",
                "ugc": "Propositions de portails avec file de validation",
                "towns": "Dépend de la densité locale de portails",
                "delete": "Via leur site web",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "Offre de base gratuite ; abonnement Premium (environ 40 $ par an) pour l'accès complet",
                "ads": "Publicité dans la version gratuite",
                "iap": "Premium requis pour les caches réservées et les fonctions avancées",
                "owner": "Groundspeak Inc., société privée (États-Unis)",
                "data": "Voir leur politique de confidentialité",
                "territory": "Non",
                "ugc": "Oui, caches dissimulées (après validation)",
                "towns": "Dépend de la densité locale de caches",
                "delete": "Via le site web",
            },
        },
        "own_h": "À qui appartiennent vos données de localisation ?",
        "own_p": (
            "En mars 2025, Niantic a vendu Pokémon GO, Ingress et ses autres jeux à Scopely "
            "pour environ 3,5 milliards de dollars. Scopely appartient à Savvy Games Group, une "
            "société du fonds souverain saoudien (Public Investment Fund, PIF). Les comptes des "
            "joueurs et l'historique de localisation associé ont été transférés avec les jeux. "
            "MapRaiders est indépendant, développé en Allemagne, et ne vend jamais de données de localisation."
        ),
        "src_label": "Sources",
    },
    "it": {
        "sec_label": "I fatti concreti",
        "title": "MapRaiders vs {comp} a colpo d'occhio",
        "col_fact": "Dato",
        "rows": {
            "price": "Prezzo",
            "ads": "Pubblicità",
            "iap": "Acquisti in-app necessari",
            "owner": "Proprietario",
            "data": "Vendita dei dati di posizione",
            "territory": "Conquista di territorio reale muovendoti",
            "ugc": "Contenuti creati dai giocatori",
            "towns": "Funziona nei piccoli centri",
            "delete": "Eliminazione dell'account",
        },
        "mr": {
            "price": "Gratis, tutte le funzioni",
            "ads": "Niente pubblicità",
            "iap": "Nessuno",
            "owner": "Scafa Investments LLC, indipendente",
            "data": "Mai",
            "territory": "Sì, camminare e andare in bici contano entrambi",
            "ugc": "Quest, echi audio, eventi: subito online",
            "towns": "Ovunque nel mondo, senza configurazione",
            "delete": "Dall'app, con esportazione completa dei dati",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "Download gratuito; gli oggetti a pagamento pesano sulla competizione (PokéMonete, pass per i raid)",
                "ads": "Luoghi sponsorizzati ed eventi di brand",
                "iap": "Ampio negozio in-app",
                "owner": "Scopely, di proprietà di Savvy Games Group, società del fondo sovrano saudita PIF (da marzo 2025)",
                "data": "Proprietà cambiata nel 2025; vedi la loro informativa sulla privacy",
                "territory": "No, le palestre sono punti fissi temporanei",
                "ugc": "Nessun contenuto creato dai giocatori",
                "towns": "Pochi PokéStop e palestre fuori dalle grandi città",
                "delete": "Tramite il loro sito web",
            },
            "ingress": {
                "name": "Ingress",
                "price": "Gratis; abbonamento C.O.R.E. per funzioni extra",
                "ads": "Portali sponsorizzati",
                "iap": "Abbonamento più negozio di oggetti",
                "owner": "Scopely, di proprietà di Savvy Games Group, società del fondo sovrano saudita PIF (da marzo 2025)",
                "data": "Proprietà cambiata nel 2025; vedi la loro informativa sulla privacy",
                "territory": "I campi di controllo collegano solo portali esistenti",
                "ugc": "Proposte di portali con coda di revisione",
                "towns": "Dipende dalla densità locale dei portali",
                "delete": "Tramite il loro sito web",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "Livello base gratuito; abbonamento Premium (circa 40 $ l'anno) per l'accesso completo",
                "ads": "Pubblicità nella versione gratuita",
                "iap": "Premium necessario per le cache riservate e le funzioni avanzate",
                "owner": "Groundspeak Inc., azienda privata (USA)",
                "data": "Vedi la loro informativa sulla privacy",
                "territory": "No",
                "ugc": "Sì, cache nascoste (dopo un processo di revisione)",
                "towns": "Dipende dalla densità locale delle cache",
                "delete": "Tramite il sito web",
            },
        },
        "own_h": "A chi appartengono i tuoi dati di posizione?",
        "own_p": (
            "A marzo 2025 Niantic ha venduto Pokémon GO, Ingress e gli altri suoi giochi a Scopely "
            "per circa 3,5 miliardi di dollari. Scopely appartiene a Savvy Games Group, una società "
            "del fondo sovrano saudita (Public Investment Fund, PIF). Gli account dei giocatori e la "
            "cronologia delle posizioni associata sono passati insieme ai giochi. MapRaiders è "
            "indipendente, viene sviluppato in Germania e non vende mai dati di posizione."
        ),
        "src_label": "Fonti",
    },
    "pt": {
        "sec_label": "Os fatos concretos",
        "title": "MapRaiders vs {comp} lado a lado",
        "col_fact": "Fato",
        "rows": {
            "price": "Preço",
            "ads": "Anúncios",
            "iap": "Compras no app necessárias",
            "owner": "Dono",
            "data": "Venda de dados de localização",
            "territory": "Conquiste território real se movimentando",
            "ugc": "Conteúdo criado por jogadores",
            "towns": "Funciona em cidades pequenas",
            "delete": "Exclusão da conta",
        },
        "mr": {
            "price": "Grátis, todos os recursos",
            "ads": "Sem anúncios",
            "iap": "Nenhuma",
            "owner": "Scafa Investments LLC, independente",
            "data": "Nunca",
            "territory": "Sim, caminhar e pedalar contam igualmente",
            "ugc": "Missões, ecos de áudio, eventos — no ar na hora",
            "towns": "Em qualquer lugar do mundo, sem configuração",
            "delete": "No app, com exportação completa dos dados",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "Download grátis; itens pagos pesam na competição (PokéMoedas, passes de reide)",
                "ads": "Locais patrocinados e eventos de marcas",
                "iap": "Loja extensa dentro do app",
                "owner": "Scopely, da Savvy Games Group, empresa do fundo soberano saudita PIF (desde março de 2025)",
                "data": "O dono mudou em 2025; veja a política de privacidade deles",
                "territory": "Não, os ginásios são pontos fixos temporários",
                "ugc": "Sem conteúdo criado por jogadores",
                "towns": "Poucas PokéStops e ginásios fora das grandes cidades",
                "delete": "Pelo site deles",
            },
            "ingress": {
                "name": "Ingress",
                "price": "Grátis; assinatura C.O.R.E. para recursos extras",
                "ads": "Portais patrocinados",
                "iap": "Assinatura mais loja de itens",
                "owner": "Scopely, da Savvy Games Group, empresa do fundo soberano saudita PIF (desde março de 2025)",
                "data": "O dono mudou em 2025; veja a política de privacidade deles",
                "territory": "Os campos de controle só ligam portais existentes",
                "ugc": "Sugestões de portais com fila de revisão",
                "towns": "Depende da densidade local de portais",
                "delete": "Pelo site deles",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "Plano básico grátis; assinatura Premium (cerca de US$ 40 por ano) para acesso completo",
                "ads": "Anúncios no plano gratuito",
                "iap": "Premium necessário para caches exclusivas e recursos avançados",
                "owner": "Groundspeak Inc., empresa privada (EUA)",
                "data": "Veja a política de privacidade deles",
                "territory": "Não",
                "ugc": "Sim, caches escondidas (após processo de revisão)",
                "towns": "Depende da densidade local de caches",
                "delete": "Pelo site",
            },
        },
        "own_h": "Quem é dono dos seus dados de localização?",
        "own_p": (
            "Em março de 2025, a Niantic vendeu Pokémon GO, Ingress e seus outros jogos para a "
            "Scopely por cerca de US$ 3,5 bilhões. A Scopely pertence à Savvy Games Group, empresa "
            "do fundo soberano da Arábia Saudita (Public Investment Fund, PIF). As contas dos "
            "jogadores e o histórico de localização associado foram transferidos junto com os jogos. "
            "MapRaiders é independente, desenvolvido na Alemanha e nunca vende dados de localização."
        ),
        "src_label": "Fontes",
    },
    "ru": {
        "sec_label": "Только факты",
        "title": "MapRaiders против {comp}: коротко о главном",
        "col_fact": "Факт",
        "rows": {
            "price": "Цена",
            "ads": "Реклама",
            "iap": "Нужны ли внутриигровые покупки",
            "owner": "Владелец",
            "data": "Продажа данных о местоположении",
            "territory": "Захват реальной территории движением",
            "ugc": "Контент от игроков",
            "towns": "Работает в небольших городах",
            "delete": "Удаление аккаунта",
        },
        "mr": {
            "price": "Бесплатно, все функции",
            "ads": "Без рекламы",
            "iap": "Не нужны",
            "owner": "Scafa Investments LLC, независимая компания",
            "data": "Никогда",
            "territory": "Да, засчитываются и ходьба, и велосипед",
            "ugc": "Квесты, аудио-эхо, события — сразу в игре",
            "towns": "В любой точке мира, без настройки",
            "delete": "Прямо в приложении, плюс полный экспорт данных",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "Скачать бесплатно; платные предметы влияют на соревнование (ПокеМонеты, рейд-пассы)",
                "ads": "Спонсорские локации и брендовые события",
                "iap": "Обширный внутриигровой магазин",
                "owner": "Scopely, принадлежит Savvy Games Group — компании саудовского суверенного фонда PIF (с марта 2025 года)",
                "data": "Владелец сменился в 2025 году; см. их политику конфиденциальности",
                "territory": "Нет, залы — это временные фиксированные точки",
                "ugc": "Контента от игроков нет",
                "towns": "Мало покестопов и залов за пределами больших городов",
                "delete": "Через их сайт",
            },
            "ingress": {
                "name": "Ingress",
                "price": "Бесплатно; подписка C.O.R.E. для дополнительных функций",
                "ads": "Спонсорские порталы",
                "iap": "Подписка плюс магазин предметов",
                "owner": "Scopely, принадлежит Savvy Games Group — компании саудовского суверенного фонда PIF (с марта 2025 года)",
                "data": "Владелец сменился в 2025 году; см. их политику конфиденциальности",
                "territory": "Контрольные поля строятся только между существующими порталами",
                "ugc": "Предложения порталов через очередь модерации",
                "towns": "Зависит от плотности порталов в вашем районе",
                "delete": "Через их сайт",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "Базовый уровень бесплатно; подписка Premium (около 40 $ в год) для полного доступа",
                "ads": "Реклама в бесплатной версии",
                "iap": "Premium нужен для закрытых тайников и расширенных функций",
                "owner": "Groundspeak Inc., частная компания (США)",
                "data": "См. их политику конфиденциальности",
                "territory": "Нет",
                "ugc": "Да, спрятанные тайники (после модерации)",
                "towns": "Зависит от плотности тайников в вашем районе",
                "delete": "Через сайт",
            },
        },
        "own_h": "Кому принадлежат ваши данные о местоположении?",
        "own_p": (
            "В марте 2025 года Niantic продала Pokémon GO, Ingress и остальные свои игры компании "
            "Scopely примерно за 3,5 млрд долларов. Scopely принадлежит Savvy Games Group — компании "
            "Государственного инвестиционного фонда Саудовской Аравии (PIF). Аккаунты игроков и "
            "связанная с ними история местоположений перешли вместе с играми. MapRaiders — "
            "независимый проект, разрабатывается в Германии и никогда не продаёт данные о местоположении."
        ),
        "src_label": "Источники",
    },
    "tr": {
        "sec_label": "Somut gerçekler",
        "title": "Tek bakışta MapRaiders ve {comp}",
        "col_fact": "Kriter",
        "rows": {
            "price": "Fiyat",
            "ads": "Reklamlar",
            "iap": "Uygulama içi satın alma gerekli mi",
            "owner": "Sahibi",
            "data": "Konum verisi satışı",
            "territory": "Hareket ederek gerçek bölge fethi",
            "ugc": "Oyuncuların oluşturduğu içerik",
            "towns": "Küçük şehirlerde çalışır mı",
            "delete": "Hesap silme",
        },
        "mr": {
            "price": "Ücretsiz, tüm özellikler dahil",
            "ads": "Reklam yok",
            "iap": "Gerekmez",
            "owner": "Scafa Investments LLC, bağımsız",
            "data": "Asla",
            "territory": "Evet, yürümek de bisiklet de sayılır",
            "ugc": "Görevler, sesli yankılar, etkinlikler — anında yayında",
            "towns": "Dünyanın her yerinde, kurulum gerektirmez",
            "delete": "Uygulama içinden, tam veri dışa aktarımıyla birlikte",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "İndirmesi ücretsiz; ücretli öğeler rekabeti belirliyor (PokéCoin, baskın biletleri)",
                "ads": "Sponsorlu konumlar ve marka etkinlikleri",
                "iap": "Kapsamlı uygulama içi mağaza",
                "owner": "Scopely; Suudi varlık fonu PIF'e ait Savvy Games Group'un şirketi (Mart 2025'ten beri)",
                "data": "Sahibi 2025'te değişti; gizlilik politikalarına bakın",
                "territory": "Hayır, salonlar geçici sabit noktalardır",
                "ugc": "Oyuncu içeriği yok",
                "towns": "Büyük şehirler dışında az sayıda PokéStop ve salon",
                "delete": "Web siteleri üzerinden",
            },
            "ingress": {
                "name": "Ingress",
                "price": "Ücretsiz; ek özellikler için C.O.R.E. aboneliği",
                "ads": "Sponsorlu portallar",
                "iap": "Abonelik artı öğe mağazası",
                "owner": "Scopely; Suudi varlık fonu PIF'e ait Savvy Games Group'un şirketi (Mart 2025'ten beri)",
                "data": "Sahibi 2025'te değişti; gizlilik politikalarına bakın",
                "territory": "Kontrol alanları yalnızca mevcut portallar arasında kurulur",
                "ugc": "İnceleme kuyruğuyla portal önerileri",
                "towns": "Yerel portal yoğunluğuna bağlı",
                "delete": "Web siteleri üzerinden",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "Temel sürüm ücretsiz; tam erişim için Premium abonelik (yılda yaklaşık 40 $)",
                "ads": "Ücretsiz sürümde reklamlar",
                "iap": "Özel zulalar ve gelişmiş özellikler için Premium gerekli",
                "owner": "Groundspeak Inc., özel şirket (ABD)",
                "data": "Gizlilik politikalarına bakın",
                "territory": "Hayır",
                "ugc": "Evet, gizlenmiş zulalar (inceleme sürecinden sonra)",
                "towns": "Yerel zula yoğunluğuna bağlı",
                "delete": "Web sitesi üzerinden",
            },
        },
        "own_h": "Konum verileriniz kimin elinde?",
        "own_p": (
            "Mart 2025'te Niantic; Pokémon GO, Ingress ve diğer oyunlarını yaklaşık 3,5 milyar "
            "dolara Scopely'ye sattı. Scopely, Suudi Arabistan Kamu Yatırım Fonu'na (PIF) ait "
            "Savvy Games Group'un şirketidir. Oyuncu hesapları ve bunlara bağlı konum geçmişi "
            "oyunlarla birlikte el değiştirdi. MapRaiders bağımsızdır, Almanya'da geliştirilir "
            "ve konum verisi satmaz."
        ),
        "src_label": "Kaynaklar",
    },
    "ja": {
        "sec_label": "事実で比較",
        "title": "MapRaidersと{comp}をひと目で比較",
        "col_fact": "項目",
        "rows": {
            "price": "価格",
            "ads": "広告",
            "iap": "アプリ内課金の必要性",
            "owner": "運営元",
            "data": "位置情報データの販売",
            "territory": "移動によるリアル陣取り",
            "ugc": "プレイヤーが作るコンテンツ",
            "towns": "小さな町での遊びやすさ",
            "delete": "アカウント削除",
        },
        "mr": {
            "price": "無料、全機能が使える",
            "ads": "広告なし",
            "iap": "不要",
            "owner": "Scafa Investments LLC(独立系)",
            "data": "一切なし",
            "territory": "あり。徒歩も自転車もカウント",
            "ugc": "クエスト、音声エコー、イベントを即時公開",
            "towns": "世界中どこでも、設定不要",
            "delete": "アプリ内で完結、全データのエクスポートも可能",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "ダウンロード無料。課金アイテム(ポケコイン、レイドパス)が対戦環境を左右",
                "ads": "スポンサー付きスポットや企業コラボイベントあり",
                "iap": "充実したアプリ内ショップ",
                "owner": "Scopely。サウジアラビアの政府系ファンドPIF傘下のSavvy Games Groupが所有(2025年3月から)",
                "data": "2025年に運営元が変わった。詳細は同社のプライバシーポリシーを参照",
                "territory": "なし。ジムは一時的な固定ポイント",
                "ugc": "プレイヤー作成コンテンツはなし",
                "towns": "大都市以外ではポケストップやジムが少ない",
                "delete": "公式サイトから",
            },
            "ingress": {
                "name": "Ingress",
                "price": "無料。追加機能はC.O.R.E.サブスクリプション",
                "ads": "スポンサーポータルあり",
                "iap": "サブスクリプションとアイテムショップ",
                "owner": "Scopely。サウジアラビアの政府系ファンドPIF傘下のSavvy Games Groupが所有(2025年3月から)",
                "data": "2025年に運営元が変わった。詳細は同社のプライバシーポリシーを参照",
                "territory": "コントロールフィールドは既存ポータル間のみ",
                "ugc": "ポータル申請は審査待ちあり",
                "towns": "周辺のポータル密度しだい",
                "delete": "公式サイトから",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "基本無料。フル機能はプレミアム会員(年間約40ドル)",
                "ads": "無料プランには広告あり",
                "iap": "プレミアム限定キャッシュや上級機能には課金が必要",
                "owner": "Groundspeak Inc.(米国の非上場企業)",
                "data": "同社のプライバシーポリシーを参照",
                "territory": "なし",
                "ugc": "あり。キャッシュの設置が可能(審査あり)",
                "towns": "周辺のキャッシュ密度しだい",
                "delete": "ウェブサイトから",
            },
        },
        "own_h": "あなたの位置情報データは誰のもの?",
        "own_p": (
            "2025年3月、NianticはPokémon GO、Ingressなどのゲーム部門を約35億ドルでScopelyに"
            "売却しました。Scopelyはサウジアラビアの政府系ファンド「パブリック・インベストメント・"
            "ファンド(PIF)」傘下のSavvy Games Groupが所有しています。プレイヤーのアカウントと、"
            "それに紐づく位置情報の履歴もゲームと一緒に移管されました。MapRaidersは独立系で、"
            "ドイツで開発されており、位置情報データを販売することは一切ありません。"
        ),
        "src_label": "出典",
    },
    "ko": {
        "sec_label": "있는 그대로의 사실",
        "title": "한눈에 보는 MapRaiders vs {comp}",
        "col_fact": "항목",
        "rows": {
            "price": "가격",
            "ads": "광고",
            "iap": "인앱 결제 필요 여부",
            "owner": "운영 주체",
            "data": "위치 데이터 판매",
            "territory": "이동으로 실제 영토 점령",
            "ugc": "플레이어 제작 콘텐츠",
            "towns": "소도시에서의 플레이",
            "delete": "계정 삭제",
        },
        "mr": {
            "price": "무료, 모든 기능 제공",
            "ads": "광고 없음",
            "iap": "필요 없음",
            "owner": "Scafa Investments LLC, 독립 기업",
            "data": "절대 없음",
            "territory": "가능. 걷기와 자전거 모두 인정",
            "ugc": "퀘스트, 오디오 에코, 이벤트를 즉시 공개",
            "towns": "전 세계 어디서나, 별도 설정 불필요",
            "delete": "앱에서 바로 가능, 전체 데이터 내보내기 지원",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "다운로드 무료. 유료 아이템(포켓코인, 레이드 패스)이 경쟁에 큰 영향",
                "ads": "스폰서 장소와 브랜드 이벤트 있음",
                "iap": "방대한 인앱 상점",
                "owner": "Scopely. 사우디 국부펀드 PIF 산하 Savvy Games Group 소유(2025년 3월부터)",
                "data": "2025년에 운영 주체가 변경됨. 자세한 내용은 해당 개인정보처리방침 참조",
                "territory": "없음. 체육관은 일시적인 고정 지점",
                "ugc": "플레이어 제작 콘텐츠 없음",
                "towns": "대도시 밖에서는 포켓스톱과 체육관이 드묾",
                "delete": "웹사이트에서 가능",
            },
            "ingress": {
                "name": "Ingress",
                "price": "무료. 추가 기능은 C.O.R.E. 구독",
                "ads": "스폰서 포털 있음",
                "iap": "구독과 아이템 상점",
                "owner": "Scopely. 사우디 국부펀드 PIF 산하 Savvy Games Group 소유(2025년 3월부터)",
                "data": "2025년에 운영 주체가 변경됨. 자세한 내용은 해당 개인정보처리방침 참조",
                "territory": "컨트롤 필드는 기존 포털 사이에서만 생성",
                "ugc": "포털 제안은 심사 대기열을 거침",
                "towns": "지역 포털 밀도에 따라 다름",
                "delete": "웹사이트에서 가능",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "기본 무료. 전체 이용은 프리미엄 구독(연 약 40달러)",
                "ads": "무료 버전에 광고 있음",
                "iap": "프리미엄 전용 캐시와 고급 기능에는 구독 필요",
                "owner": "Groundspeak Inc., 미국 비상장 기업",
                "data": "해당 개인정보처리방침 참조",
                "territory": "없음",
                "ugc": "가능. 캐시 숨기기(심사 후)",
                "towns": "지역 캐시 밀도에 따라 다름",
                "delete": "웹사이트에서 가능",
            },
        },
        "own_h": "내 위치 데이터의 주인은 누구일까요?",
        "own_p": (
            "2025년 3월, Niantic은 Pokémon GO와 Ingress를 포함한 게임 사업부를 약 35억 달러에 "
            "Scopely에 매각했습니다. Scopely는 사우디아라비아 국부펀드(PIF) 산하 Savvy Games "
            "Group의 소유입니다. 플레이어 계정과 그에 연결된 위치 기록도 게임과 함께 "
            "이전되었습니다. MapRaiders는 독립 기업이 운영하며 독일에서 개발되고, 위치 데이터를 "
            "판매하지 않습니다."
        ),
        "src_label": "출처",
    },
    "zh-cn": {
        "sec_label": "关键事实",
        "title": "MapRaiders 与 {comp} 一览对比",
        "col_fact": "对比项",
        "rows": {
            "price": "价格",
            "ads": "广告",
            "iap": "是否需要内购",
            "owner": "所有者",
            "data": "出售位置数据",
            "territory": "通过移动占领真实地盘",
            "ugc": "玩家创作内容",
            "towns": "小城市可玩性",
            "delete": "账号注销",
        },
        "mr": {
            "price": "免费,全部功能开放",
            "ads": "无广告",
            "iap": "无需内购",
            "owner": "Scafa Investments LLC,独立公司",
            "data": "绝不出售",
            "territory": "可以,步行和骑行都算",
            "ugc": "任务、音频回声、活动,创建后立即上线",
            "towns": "全球任何地方,无需配置",
            "delete": "应用内即可注销,并支持完整数据导出",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "免费下载;付费道具影响对战环境(宝可币、团体战入场券)",
                "ads": "有赞助地点和品牌活动",
                "iap": "庞大的应用内商店",
                "owner": "Scopely,隶属 Savvy Games Group——沙特主权基金 PIF 旗下公司(2025 年 3 月起)",
                "data": "2025 年所有权变更;详见其隐私政策",
                "territory": "不能,道馆只是临时固定点",
                "ugc": "无玩家创作内容",
                "towns": "大城市以外宝可补给站和道馆稀少",
                "delete": "通过其官网",
            },
            "ingress": {
                "name": "Ingress",
                "price": "免费;额外功能需 C.O.R.E. 订阅",
                "ads": "有赞助门户",
                "iap": "订阅加道具商店",
                "owner": "Scopely,隶属 Savvy Games Group——沙特主权基金 PIF 旗下公司(2025 年 3 月起)",
                "data": "2025 年所有权变更;详见其隐私政策",
                "territory": "控制场只能建立在现有门户之间",
                "ugc": "可提交门户申请,需经审核队列",
                "towns": "取决于当地门户密度",
                "delete": "通过其官网",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "基础版免费;完整功能需 Premium 订阅(约每年 40 美元)",
                "ads": "免费版有广告",
                "iap": "Premium 限定藏宝点和高级功能需付费",
                "owner": "Groundspeak Inc.,美国私人公司",
                "data": "详见其隐私政策",
                "territory": "不能",
                "ugc": "可以,玩家可藏匿宝箱(需经审核)",
                "towns": "取决于当地藏宝点密度",
                "delete": "通过官网",
            },
        },
        "own_h": "你的位置数据归谁所有?",
        "own_p": (
            "2025 年 3 月,Niantic 将 Pokémon GO、Ingress 及其余游戏以约 35 亿美元出售给 Scopely。"
            "Scopely 隶属于 Savvy Games Group,后者是沙特阿拉伯主权财富基金(PIF)旗下公司。"
            "玩家账号及与之关联的位置历史记录随游戏一并转移。MapRaiders 是独立产品,在德国开发,"
            "绝不出售位置数据。"
        ),
        "src_label": "资料来源",
    },
    "zh-tw": {
        "sec_label": "關鍵事實",
        "title": "MapRaiders 與 {comp} 快速比較",
        "col_fact": "比較項目",
        "rows": {
            "price": "價格",
            "ads": "廣告",
            "iap": "是否需要內購",
            "owner": "擁有者",
            "data": "出售位置資料",
            "territory": "靠移動佔領真實地盤",
            "ugc": "玩家創作內容",
            "towns": "小城鎮可玩性",
            "delete": "帳號刪除",
        },
        "mr": {
            "price": "免費,所有功能開放",
            "ads": "無廣告",
            "iap": "不需要",
            "owner": "Scafa Investments LLC,獨立公司",
            "data": "絕不出售",
            "territory": "可以,步行和騎車都算",
            "ugc": "任務、語音回聲、活動,建立後立即上線",
            "towns": "全球任何地方,無需設定",
            "delete": "可在 App 內刪除,並支援完整資料匯出",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "免費下載;付費道具左右對戰環境(寶可幣、團體戰入場券)",
                "ads": "有贊助地點與品牌活動",
                "iap": "龐大的應用程式內商店",
                "owner": "Scopely,隸屬 Savvy Games Group——沙烏地主權基金 PIF 旗下公司(2025 年 3 月起)",
                "data": "2025 年擁有者變更;詳見其隱私權政策",
                "territory": "不能,道館只是暫時的固定點",
                "ugc": "無玩家創作內容",
                "towns": "大城市以外寶可補給站與道館稀少",
                "delete": "需透過其官網",
            },
            "ingress": {
                "name": "Ingress",
                "price": "免費;額外功能需 C.O.R.E. 訂閱",
                "ads": "有贊助門戶",
                "iap": "訂閱加道具商店",
                "owner": "Scopely,隸屬 Savvy Games Group——沙烏地主權基金 PIF 旗下公司(2025 年 3 月起)",
                "data": "2025 年擁有者變更;詳見其隱私權政策",
                "territory": "控制場只能建立在現有門戶之間",
                "ugc": "可提交門戶申請,需經審核佇列",
                "towns": "取決於當地門戶密度",
                "delete": "需透過其官網",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "基本版免費;完整功能需 Premium 訂閱(約每年 40 美元)",
                "ads": "免費版有廣告",
                "iap": "Premium 限定寶藏點與進階功能需付費",
                "owner": "Groundspeak Inc.,美國私人公司",
                "data": "詳見其隱私權政策",
                "territory": "不能",
                "ugc": "可以,玩家可藏匿寶箱(需經審核)",
                "towns": "取決於當地寶藏點密度",
                "delete": "需透過官網",
            },
        },
        "own_h": "你的位置資料屬於誰?",
        "own_p": (
            "2025 年 3 月,Niantic 將 Pokémon GO、Ingress 及其餘遊戲以約 35 億美元出售給 Scopely。"
            "Scopely 隸屬於 Savvy Games Group,後者為沙烏地阿拉伯主權財富基金(PIF)旗下公司。"
            "玩家帳號及相關位置歷史紀錄隨遊戲一併移轉。MapRaiders 是獨立產品,在德國開發,"
            "絕不出售位置資料。"
        ),
        "src_label": "資料來源",
    },
    "hi": {
        "sec_label": "ठोस तथ्य",
        "title": "एक नज़र में MapRaiders बनाम {comp}",
        "col_fact": "तथ्य",
        "rows": {
            "price": "क़ीमत",
            "ads": "विज्ञापन",
            "iap": "इन-ऐप खरीदारी ज़रूरी",
            "owner": "मालिक",
            "data": "लोकेशन डेटा की बिक्री",
            "territory": "चलकर असली इलाक़े पर कब्ज़ा",
            "ugc": "खिलाड़ियों का बनाया कंटेंट",
            "towns": "छोटे शहरों में चलता है",
            "delete": "अकाउंट डिलीट करना",
        },
        "mr": {
            "price": "मुफ़्त, सारे फ़ीचर",
            "ads": "कोई विज्ञापन नहीं",
            "iap": "कोई नहीं",
            "owner": "Scafa Investments LLC, स्वतंत्र",
            "data": "कभी नहीं",
            "territory": "हाँ, पैदल और साइकिल दोनों गिने जाते हैं",
            "ugc": "क्वेस्ट, ऑडियो इको, इवेंट — तुरंत लाइव",
            "towns": "दुनिया में कहीं भी, बिना किसी सेटअप के",
            "delete": "ऐप में ही, साथ में पूरा डेटा एक्सपोर्ट",
        },
        "comp": {
            "pokemon-go": {
                "name": "Pokémon GO",
                "price": "डाउनलोड मुफ़्त; पेड आइटम मुक़ाबले पर असर डालते हैं (PokéCoins, रेड पास)",
                "ads": "स्पॉन्सर्ड लोकेशन और ब्रांड इवेंट",
                "iap": "बड़ा इन-ऐप स्टोर",
                "owner": "Scopely, जो Savvy Games Group की कंपनी है — यह सऊदी सॉवरेन फ़ंड PIF के अधीन है (मार्च 2025 से)",
                "data": "2025 में मालिक बदल गया; उनकी प्राइवेसी पॉलिसी देखें",
                "territory": "नहीं, जिम अस्थायी तय पॉइंट हैं",
                "ugc": "खिलाड़ियों का बनाया कोई कंटेंट नहीं",
                "towns": "बड़े शहरों के बाहर PokéStops और जिम कम हैं",
                "delete": "उनकी वेबसाइट से",
            },
            "ingress": {
                "name": "Ingress",
                "price": "मुफ़्त; अतिरिक्त फ़ीचर के लिए C.O.R.E. सब्सक्रिप्शन",
                "ads": "स्पॉन्सर्ड पोर्टल",
                "iap": "सब्सक्रिप्शन और आइटम स्टोर",
                "owner": "Scopely, जो Savvy Games Group की कंपनी है — यह सऊदी सॉवरेन फ़ंड PIF के अधीन है (मार्च 2025 से)",
                "data": "2025 में मालिक बदल गया; उनकी प्राइवेसी पॉलिसी देखें",
                "territory": "कंट्रोल फ़ील्ड सिर्फ़ मौजूदा पोर्टलों के बीच बनते हैं",
                "ugc": "पोर्टल सुझाव, रिव्यू क़तार के साथ",
                "towns": "स्थानीय पोर्टल घनत्व पर निर्भर",
                "delete": "उनकी वेबसाइट से",
            },
            "geocaching": {
                "name": "Geocaching",
                "price": "बेसिक स्तर मुफ़्त; पूरे एक्सेस के लिए Premium सब्सक्रिप्शन (लगभग $40 प्रति वर्ष)",
                "ads": "मुफ़्त स्तर पर विज्ञापन",
                "iap": "Premium-ओनली कैश और एडवांस फ़ीचर के लिए Premium ज़रूरी",
                "owner": "Groundspeak Inc., निजी कंपनी (अमेरिका)",
                "data": "उनकी प्राइवेसी पॉलिसी देखें",
                "territory": "नहीं",
                "ugc": "हाँ, छिपाए गए कैश (रिव्यू प्रक्रिया के बाद)",
                "towns": "स्थानीय कैश घनत्व पर निर्भर",
                "delete": "वेबसाइट से",
            },
        },
        "own_h": "आपका लोकेशन डेटा किसका है?",
        "own_p": (
            "मार्च 2025 में Niantic ने Pokémon GO, Ingress और अपने बाक़ी गेम लगभग 3.5 अरब डॉलर "
            "में Scopely को बेच दिए। Scopely का मालिक Savvy Games Group है, जो सऊदी अरब के "
            "पब्लिक इन्वेस्टमेंट फ़ंड (PIF) की कंपनी है। खिलाड़ियों के अकाउंट और उनसे जुड़ा "
            "लोकेशन इतिहास गेम्स के साथ ही ट्रांसफ़र हो गया। MapRaiders स्वतंत्र है, जर्मनी में "
            "विकसित होता है और लोकेशन डेटा कभी नहीं बेचता।"
        ),
        "src_label": "स्रोत",
    },
}

# Ownership block only where the Scopely facts apply.
OWNERSHIP_PAGES = {"pokemon-go", "ingress"}


def build_rows_en_style(t, comp):
    rows = []
    for key in ROW_KEYS:
        rows.append(
            f'      <tr><td class="feat-name">{t["rows"][key]}</td>'
            f'<td>{t["mr"][key]}</td><td>{comp[key]}</td></tr>'
        )
    return "\n".join(rows)


def build_rows_de_style(t, comp):
    rows = []
    for key in ROW_KEYS:
        rows.append(
            f'        <tr>\n          <td class="feature-name">{t["rows"][key]}</td>\n'
            f'          <td>{t["mr"][key]}</td>\n          <td>{comp[key]}</td>\n        </tr>'
        )
    return "\n".join(rows)


def ownership_html(t):
    return (
        '\n  <div class="geo-own rv d3" style="margin-top:36px;max-width:760px">\n'
        f'    <h3 style="font-size:20px;font-weight:800;margin-bottom:12px">{t["own_h"]}</h3>\n'
        f'    <p style="font-size:15px;color:var(--muted);line-height:1.75">{t["own_p"]}</p>\n'
        f'    <p style="font-size:13px;color:var(--muted);margin-top:10px">{t["src_label"]}: {SOURCES}</p>\n'
        "  </div>"
    )


def block_en_style(t, page):
    comp = t["comp"][page]
    own = ownership_html(t) if page in OWNERSHIP_PAGES else ""
    return f"""
{MARKER}
<section class="comp-sec">
<div class="mx">
  <div class="sec-label rv">{t["sec_label"]}</div>
  <h2 class="sec-title rv d1">{t["title"].format(comp=comp["name"])}</h2>
  <table class="comp-table rv d2">
    <thead>
      <tr><th>{t["col_fact"]}</th><th>MapRaiders</th><th>{comp["name"]}</th></tr>
    </thead>
    <tbody>
{build_rows_en_style(t, comp)}
    </tbody>
  </table>{own}
</div>
</section>
<!-- /GEO-FACTS-TABLE -->
"""


def block_de_style(t, page):
    comp = t["comp"][page]
    own = ownership_html(t) if page in OWNERSHIP_PAGES else ""
    # DE root template uses .container/.section-header/.comparison-table and has
    # no var(--muted)/var(--accent) palette mismatch (same custom props exist).
    return f"""
{MARKER}
<section>
  <div class="container">
    <div class="section-header reveal">
      <h2>{t["sec_label"]}</h2>
      <p>{t["title"].format(comp=comp["name"])}</p>
    </div>
    <table class="comparison-table reveal">
      <thead>
        <tr><th>{t["col_fact"]}</th><th>MapRaiders</th><th>{comp["name"]}</th></tr>
      </thead>
      <tbody>
{build_rows_de_style(t, comp)}
      </tbody>
    </table>{own}
  </div>
</section>
<!-- /GEO-FACTS-TABLE -->
"""


def insert_after_hero(html, block):
    for hero in ('<section class="feat-hero">', '<section class="hero">'):
        start = html.find(hero)
        if start != -1:
            end = html.find("</section>", start)
            assert end != -1
            end += len("</section>")
            return html[:end] + block + html[end:]
    return None


def main():
    changed = skipped = 0
    for lang_dir, i18n_key in LANG_DIRS.items():
        assert lang_dir != "ar", "ar/ is hard-excluded, see _facts_scopely.md"
        t = I18N.get(i18n_key)
        if t is None:
            print(f"!! no translations for {lang_dir} ({i18n_key}) - skipped")
            continue
        base = ROOT / lang_dir if lang_dir != "de" else ROOT
        for page in PAGES:
            path = base / "vs" / f"{page}.html"
            if not path.exists():
                continue
            html = io.open(path, encoding="utf-8").read()
            if MARKER in html:
                skipped += 1
                continue
            de_style = '<section class="hero">' in html
            block = block_de_style(t, page) if de_style else block_en_style(t, page)
            result = insert_after_hero(html, block)
            if result is None:
                print(f"!! no hero anchor in {path}")
                continue
            io.open(path, "w", encoding="utf-8", newline="").write(result)
            changed += 1
            print(f"applied {path.relative_to(ROOT)}")
    print(f"{changed} changed, {skipped} already had marker")


if __name__ == "__main__":
    main()

"""Phase E: MobileApplication + HowTo JSON-LD for 66 feature pages in 11 languages.
Idempotent via marker PHASE-E-FEATURES."""
import re, pathlib, json, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

MARKER = "<!-- PHASE-E-FEATURES -->"
ROOT = pathlib.Path(__file__).parent

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

# Feature-Slugs pro Sprache (Dateiname)
SLUGS = {
    "fr": {"terr": "territoires", "echo": "echos", "evt": "evenements", "def": "jeux-defense", "qst": "quetes", "cln": "clans"},
    "es": {"terr": "territorios", "echo": "ecos", "evt": "eventos", "def": "juegos-defensa", "qst": "misiones", "cln": "clanes"},
    "it": {"terr": "territori", "echo": "echi", "evt": "eventi", "def": "giochi-difesa", "qst": "missioni", "cln": "clan"},
    "pt": {"terr": "territories", "echo": "echos", "evt": "events", "def": "defense", "qst": "quests", "cln": "clans"},
    "tr": {"terr": "territories", "echo": "echos", "evt": "events", "def": "defense", "qst": "quests", "cln": "clans"},
    "ru": {"terr": "territories", "echo": "echos", "evt": "events", "def": "defense", "qst": "quests", "cln": "clans"},
    "ja": {"terr": "territories", "echo": "echos", "evt": "events", "def": "defense", "qst": "quests", "cln": "clans"},
    "ko": {"terr": "territories", "echo": "echos", "evt": "events", "def": "defense", "qst": "quests", "cln": "clans"},
    "zh": {"terr": "territories", "echo": "echos", "evt": "events", "def": "defense", "qst": "quests", "cln": "clans"},
    "ar": {"terr": "territories", "echo": "echos", "evt": "events", "def": "defense", "qst": "quests", "cln": "clans"},
    "hi": {"terr": "territories", "echo": "echos", "evt": "events", "def": "defense", "qst": "quests", "cln": "clans"},
}

# Content: mob_desc + HowTo per language per feature
# Structure: CONTENT[lang][feature_key] = {"desc": str, "howto_name": str, "howto_desc": str, "steps": [(name, text)]}
CONTENT = {
    "fr": {
        "terr": {
            "desc": "MapRaiders Territoires : marchez, courez ou pédalez pour revendiquer des zones réelles pour vous et votre clan.",
            "howto_name": "Comment conquérir un territoire dans MapRaiders ?",
            "howto_desc": "Revendiquer une zone en vous déplaçant dans le monde réel.",
            "steps": [
                ("Activer la localisation", "Activez le GPS et la localisation en arrière-plan."),
                ("Commencer à bouger", "Marchez, courez ou pédalez le long de la bordure."),
                ("Fermer la zone", "Revenez au point de départ pour fermer le polygone."),
                ("Tenir le territoire", "Visitez régulièrement pour éviter le declin."),
                ("Placer des mini-jeux", "Déployez des jeux de défense contre les attaquants.")
            ]
        },
        "echo": {
            "desc": "MapRaiders Echos : laissez des messages audio, photo et vidéo à des lieux GPS réels.",
            "howto_name": "Comment laisser un Echo dans MapRaiders ?",
            "howto_desc": "Placer un écho média à un endroit réel.",
            "steps": [
                ("Se rendre au lieu", "Rendez-vous physiquement à l'endroit voulu."),
                ("Appuyer sur Echo", "Touchez l'icône microphone ou caméra."),
                ("Enregistrer le média", "Capturez audio, photo ou vidéo dans l'app."),
                ("Choisir la visibilité", "Public ou interne au clan."),
                ("Publier", "L'écho est visible aux autres joueurs sur place.")
            ]
        },
        "evt": {
            "desc": "MapRaiders Événements : créez des rencontres spontanées à des lieux GPS et rencontrez de vraies personnes.",
            "howto_name": "Comment créer un événement dans MapRaiders ?",
            "howto_desc": "Lancer un meetup spontané à un lieu GPS.",
            "steps": [
                ("Ouvrir l'onglet Événements", "Allez à la section Événements."),
                ("Créer un événement", "Appuyez sur plus et définissez titre + type."),
                ("Choisir lieu et heure", "Pin GPS et choisir l'heure de départ."),
                ("Définir le nombre", "Décidez combien de joueurs peuvent rejoindre."),
                ("Publier", "L'événement apparaît sur la carte.")
            ]
        },
        "def": {
            "desc": "MapRaiders Jeux de Défense : protégez vos territoires avec sept mini-jeux GPS.",
            "howto_name": "Comment défendre mon territoire avec des mini-jeux ?",
            "howto_desc": "Placer des jeux de défense contre les attaquants.",
            "steps": [
                ("Ouvrir le territoire", "Touchez un de vos territoires sur la carte."),
                ("Onglet Défense", "Ouvrez la section défense."),
                ("Choisir un mini-jeu", "Sélectionnez parmi sept jeux."),
                ("Régler la difficulté", "Temps de réaction ou nombre de tours."),
                ("Activer", "Les attaquants doivent battre le jeu.")
            ]
        },
        "qst": {
            "desc": "MapRaiders Quêtes : créez des aventures GPS, placez des défis à des lieux réels, montez de niveau.",
            "howto_name": "Comment créer une quête GPS dans MapRaiders ?",
            "howto_desc": "Créer une quête à un lieu réel et la partager.",
            "steps": [
                ("Ouvrir l'app", "Lancez MapRaiders avec GPS activé."),
                ("Bouton Quête", "Appuyez sur le bouton plus."),
                ("Choisir un lieu", "Placez le pin sur un point GPS."),
                ("Définir la tâche", "Titre, description et récompense."),
                ("Publier", "Les autres joueurs peuvent la trouver.")
            ]
        },
        "cln": {
            "desc": "MapRaiders Clans : trouvez des amis réels, fondez un clan, conquérez des territoires ensemble.",
            "howto_name": "Comment fonder un clan dans MapRaiders ?",
            "howto_desc": "Créer un clan et inviter des amis.",
            "steps": [
                ("Ouvrir le profil", "Allez à votre profil."),
                ("Onglet Clans", "Ouvrez la section clans."),
                ("Fonder un clan", "Appuyez sur Fonder et choisissez un nom."),
                ("Inviter", "Envoyez des invitations aux amis."),
                ("Revendiquer", "Conquérez votre premier territoire de clan.")
            ]
        },
    },
    "es": {
        "terr": {
            "desc": "MapRaiders Territorios: camina, corre o pedalea para reclamar zonas reales para ti y tu clan.",
            "howto_name": "¿Cómo conquistar un territorio en MapRaiders?",
            "howto_desc": "Reclamar un área moviéndote por el mundo real.",
            "steps": [
                ("Activar ubicación", "Activa GPS y ubicación en segundo plano."),
                ("Empezar a moverte", "Camina, corre o pedalea por el borde."),
                ("Cerrar el área", "Vuelve al punto inicial para cerrar el polígono."),
                ("Mantener el territorio", "Visítalo regularmente para evitar decay."),
                ("Colocar mini-juegos", "Despliega juegos de defensa.")
            ]
        },
        "echo": {
            "desc": "MapRaiders Ecos: deja mensajes de audio, foto y vídeo en lugares GPS reales.",
            "howto_name": "¿Cómo dejar un Eco en MapRaiders?",
            "howto_desc": "Colocar un eco multimedia en un lugar real.",
            "steps": [
                ("Ir al lugar", "Ve físicamente al lugar donde quieres el eco."),
                ("Botón Eco", "Toca el icono de micro o cámara."),
                ("Grabar", "Graba audio, foto o vídeo directamente."),
                ("Visibilidad", "Público o solo para tu clan."),
                ("Publicar", "El eco es visible a otros jugadores.")
            ]
        },
        "evt": {
            "desc": "MapRaiders Eventos: crea encuentros espontáneos en lugares GPS y conoce gente real cerca.",
            "howto_name": "¿Cómo crear un evento en MapRaiders?",
            "howto_desc": "Iniciar un encuentro espontáneo en un lugar GPS.",
            "steps": [
                ("Pestaña Eventos", "Ve a la sección de eventos."),
                ("Crear evento", "Toca el botón más y define título + tipo."),
                ("Lugar y hora", "Pin GPS y elige hora de inicio."),
                ("Número de participantes", "Decide cuántos pueden unirse."),
                ("Publicar", "El evento aparece en el mapa.")
            ]
        },
        "def": {
            "desc": "MapRaiders Juegos de Defensa: protege tus territorios con siete mini-juegos GPS.",
            "howto_name": "¿Cómo defender mi territorio con mini-juegos?",
            "howto_desc": "Colocar juegos de defensa contra atacantes.",
            "steps": [
                ("Abrir territorio", "Toca uno de tus territorios."),
                ("Pestaña Defensa", "Abre la sección de defensa."),
                ("Elegir mini-juego", "Selecciona entre siete juegos."),
                ("Dificultad", "Configura tiempo de reacción o rondas."),
                ("Activar", "Los atacantes deben ganar el juego.")
            ]
        },
        "qst": {
            "desc": "MapRaiders Misiones: crea aventuras GPS, coloca retos en lugares reales, sube de nivel.",
            "howto_name": "¿Cómo crear una misión GPS en MapRaiders?",
            "howto_desc": "Crear una misión en un lugar real y compartirla.",
            "steps": [
                ("Abrir la app", "Inicia MapRaiders con GPS activado."),
                ("Botón Misión", "Pulsa el botón más en el mapa."),
                ("Elegir lugar", "Coloca el pin en un punto GPS."),
                ("Definir tarea", "Título, descripción y recompensa."),
                ("Publicar", "Otros jugadores pueden encontrarla.")
            ]
        },
        "cln": {
            "desc": "MapRaiders Clanes: encuentra amigos reales, funda un clan, conquista territorios juntos.",
            "howto_name": "¿Cómo fundar un clan en MapRaiders?",
            "howto_desc": "Crear un clan e invitar amigos.",
            "steps": [
                ("Abrir perfil", "Ve a tu perfil."),
                ("Pestaña Clanes", "Abre la sección de clanes."),
                ("Fundar clan", "Pulsa Fundar y elige un nombre."),
                ("Invitar", "Envía invitaciones a amigos."),
                ("Reclamar", "Conquistad vuestro primer territorio.")
            ]
        },
    },
    "it": {
        "terr": {
            "desc": "MapRaiders Territori: cammina, corri o pedala per rivendicare aree reali per te e il tuo clan.",
            "howto_name": "Come conquistare un territorio in MapRaiders?",
            "howto_desc": "Rivendicare un'area muovendoti nel mondo reale.",
            "steps": [
                ("Attiva posizione", "Attiva GPS e posizione in background."),
                ("Inizia a muoverti", "Cammina, corri o pedala lungo il bordo."),
                ("Chiudi l'area", "Torna al punto iniziale per chiudere il poligono."),
                ("Mantieni il territorio", "Visitalo regolarmente per evitare decay."),
                ("Posiziona mini-giochi", "Dispiega giochi di difesa.")
            ]
        },
        "echo": {
            "desc": "MapRaiders Echi: lascia messaggi audio, foto e video in luoghi GPS reali.",
            "howto_name": "Come lasciare un Echo in MapRaiders?",
            "howto_desc": "Posizionare un echo multimediale in un luogo reale.",
            "steps": [
                ("Raggiungi il luogo", "Vai fisicamente nel posto."),
                ("Pulsante Echo", "Tocca l'icona microfono o fotocamera."),
                ("Registra", "Cattura audio, foto o video nell'app."),
                ("Visibilità", "Pubblico o solo per il clan."),
                ("Pubblica", "L'echo è visibile agli altri giocatori.")
            ]
        },
        "evt": {
            "desc": "MapRaiders Eventi: crea incontri spontanei in luoghi GPS e conosci persone reali vicino a te.",
            "howto_name": "Come creare un evento in MapRaiders?",
            "howto_desc": "Avviare un meetup spontaneo in un luogo GPS.",
            "steps": [
                ("Tab Eventi", "Vai alla sezione eventi."),
                ("Crea evento", "Tocca più e imposta titolo + tipo."),
                ("Luogo e ora", "Pin GPS e scegli l'ora di inizio."),
                ("Partecipanti", "Decidi quanti possono unirsi."),
                ("Pubblica", "L'evento appare sulla mappa.")
            ]
        },
        "def": {
            "desc": "MapRaiders Giochi di Difesa: proteggi i tuoi territori con sette mini-giochi GPS.",
            "howto_name": "Come difendere il mio territorio con i mini-giochi?",
            "howto_desc": "Posizionare giochi di difesa contro gli attaccanti.",
            "steps": [
                ("Apri il territorio", "Tocca uno dei tuoi territori."),
                ("Tab Difesa", "Apri la sezione difesa."),
                ("Scegli mini-gioco", "Seleziona tra sette giochi."),
                ("Difficoltà", "Configura tempo di reazione o turni."),
                ("Attiva", "Gli attaccanti devono battere il gioco.")
            ]
        },
        "qst": {
            "desc": "MapRaiders Missioni: crea avventure GPS, posiziona sfide in luoghi reali, sali di livello.",
            "howto_name": "Come creare una missione GPS in MapRaiders?",
            "howto_desc": "Creare una missione in un luogo reale e condividerla.",
            "steps": [
                ("Apri l'app", "Avvia MapRaiders con GPS attivo."),
                ("Pulsante Missione", "Premi più sulla mappa."),
                ("Scegli un luogo", "Posiziona il pin su un punto GPS."),
                ("Definisci il compito", "Titolo, descrizione e ricompensa."),
                ("Pubblica", "Altri giocatori possono trovarla.")
            ]
        },
        "cln": {
            "desc": "MapRaiders Clan: trova amici reali, fonda un clan, conquista territori insieme.",
            "howto_name": "Come fondare un clan in MapRaiders?",
            "howto_desc": "Creare un clan e invitare amici.",
            "steps": [
                ("Apri il profilo", "Vai al tuo profilo."),
                ("Tab Clan", "Apri la sezione clan."),
                ("Fonda clan", "Tocca Fonda e scegli un nome."),
                ("Invita", "Invia inviti agli amici."),
                ("Rivendica", "Conquistate il primo territorio di clan.")
            ]
        },
    },
    "pt": {
        "terr": {
            "desc": "MapRaiders Territórios: caminhe, corra ou pedale para reivindicar áreas reais para você e seu clã.",
            "howto_name": "Como conquistar um território no MapRaiders?",
            "howto_desc": "Reivindicar uma área movimentando-se no mundo real.",
            "steps": [
                ("Ativar localização", "Ative GPS e localização em segundo plano."),
                ("Comece a se mover", "Caminhe, corra ou pedale pela borda."),
                ("Fechar a área", "Volte ao ponto inicial para fechar o polígono."),
                ("Manter o território", "Visite regularmente para evitar decay."),
                ("Colocar mini-jogos", "Implante jogos de defesa.")
            ]
        },
        "echo": {
            "desc": "MapRaiders Echos: deixe mensagens de áudio, foto e vídeo em locais GPS reais.",
            "howto_name": "Como deixar um Echo no MapRaiders?",
            "howto_desc": "Colocar um echo de mídia em um local real.",
            "steps": [
                ("Ir ao local", "Vá fisicamente ao lugar."),
                ("Botão Echo", "Toque no ícone de microfone ou câmera."),
                ("Gravar", "Capture áudio, foto ou vídeo no app."),
                ("Visibilidade", "Público ou interno ao clã."),
                ("Publicar", "O echo é visível a outros jogadores.")
            ]
        },
        "evt": {
            "desc": "MapRaiders Eventos: crie encontros espontâneos em locais GPS e conheça pessoas reais por perto.",
            "howto_name": "Como criar um evento no MapRaiders?",
            "howto_desc": "Iniciar um meetup espontâneo em um local GPS.",
            "steps": [
                ("Aba Eventos", "Vá à seção de eventos."),
                ("Criar evento", "Toque no mais e defina título + tipo."),
                ("Local e hora", "Pin GPS e escolha a hora de início."),
                ("Participantes", "Decida quantos podem entrar."),
                ("Publicar", "O evento aparece no mapa.")
            ]
        },
        "def": {
            "desc": "MapRaiders Jogos de Defesa: proteja seus territórios com sete mini-jogos GPS.",
            "howto_name": "Como defender meu território com mini-jogos?",
            "howto_desc": "Colocar jogos de defesa contra atacantes.",
            "steps": [
                ("Abrir território", "Toque em um dos seus territórios."),
                ("Aba Defesa", "Abra a seção de defesa."),
                ("Escolher mini-jogo", "Selecione entre sete jogos."),
                ("Dificuldade", "Configure tempo de reação ou rodadas."),
                ("Ativar", "Atacantes precisam vencer o jogo.")
            ]
        },
        "qst": {
            "desc": "MapRaiders Quests: crie aventuras GPS, coloque desafios em locais reais, suba de nível.",
            "howto_name": "Como criar uma quest GPS no MapRaiders?",
            "howto_desc": "Criar uma quest em um local real e compartilhar.",
            "steps": [
                ("Abrir o app", "Inicie MapRaiders com GPS ativo."),
                ("Botão Quest", "Pressione o mais no mapa."),
                ("Escolher local", "Coloque o pin em um ponto GPS."),
                ("Definir tarefa", "Título, descrição e recompensa."),
                ("Publicar", "Outros jogadores podem encontrá-la.")
            ]
        },
        "cln": {
            "desc": "MapRaiders Clãs: encontre amigos reais, funde um clã, conquiste territórios juntos.",
            "howto_name": "Como fundar um clã no MapRaiders?",
            "howto_desc": "Criar um clã e convidar amigos.",
            "steps": [
                ("Abrir perfil", "Vá ao seu perfil."),
                ("Aba Clãs", "Abra a seção de clãs."),
                ("Fundar clã", "Toque em Fundar e escolha um nome."),
                ("Convidar", "Envie convites aos amigos."),
                ("Reivindicar", "Conquistem o primeiro território.")
            ]
        },
    },
    "tr": {
        "terr": {
            "desc": "MapRaiders Bölgeler: yürü, koş veya bisiklete bin ve kendine ve klanına gerçek bölgeler kazan.",
            "howto_name": "MapRaiders'da nasıl bir bölge fethederim?",
            "howto_desc": "Gerçek dünyada hareket ederek bir alan talep etmek.",
            "steps": [
                ("Konumu aç", "GPS ve arka plan konumunu etkinleştir."),
                ("Harekete başla", "Sınır boyunca yürü, koş veya bisiklete bin."),
                ("Alanı kapat", "Poligonu kapatmak için başlangıç noktasına dön."),
                ("Bölgeyi koru", "Decay'i önlemek için düzenli ziyaret et."),
                ("Mini oyunlar yerleştir", "Savunma oyunları kur.")
            ]
        },
        "echo": {
            "desc": "MapRaiders Echos: gerçek GPS konumlarında ses, foto ve video mesajları bırak.",
            "howto_name": "MapRaiders'da nasıl Echo bırakırım?",
            "howto_desc": "Gerçek bir yerde medya echo'su yerleştirmek.",
            "steps": [
                ("Yere git", "Fiziksel olarak yere git."),
                ("Echo düğmesi", "Mikrofon veya kamera simgesine dokun."),
                ("Kaydet", "Ses, foto veya video çek."),
                ("Görünürlük", "Herkese açık veya klan içi."),
                ("Yayınla", "Echo diğer oyunculara görünür olur.")
            ]
        },
        "evt": {
            "desc": "MapRaiders Etkinlikler: GPS konumlarında spontane buluşmalar oluştur ve yakındaki gerçek insanlarla tanış.",
            "howto_name": "MapRaiders'da nasıl etkinlik oluştururum?",
            "howto_desc": "GPS konumunda spontane buluşma başlatmak.",
            "steps": [
                ("Etkinlik sekmesi", "Etkinlikler bölümüne git."),
                ("Etkinlik oluştur", "Artıya bas, başlık ve tür gir."),
                ("Yer ve zaman", "GPS pin ve başlangıç saati."),
                ("Katılımcı sayısı", "Kaç oyuncu katılabilir."),
                ("Yayınla", "Etkinlik haritada görünür.")
            ]
        },
        "def": {
            "desc": "MapRaiders Savunma Oyunları: yedi GPS mini oyunla bölgelerini koru.",
            "howto_name": "Bölgemi mini oyunlarla nasıl savunurum?",
            "howto_desc": "Saldırganlara karşı savunma oyunları yerleştirmek.",
            "steps": [
                ("Bölgeyi aç", "Bölgelerinden birine dokun."),
                ("Savunma sekmesi", "Savunma bölümünü aç."),
                ("Mini oyun seç", "Yedi oyundan birini seç."),
                ("Zorluk", "Reaksiyon süresi veya tur sayısı."),
                ("Etkinleştir", "Saldırganlar oyunu kazanmalı.")
            ]
        },
        "qst": {
            "desc": "MapRaiders Görevler: GPS maceraları yarat, gerçek yerlerde meydan okumalar yerleştir, seviye atla.",
            "howto_name": "MapRaiders'da nasıl GPS görevi oluştururum?",
            "howto_desc": "Gerçek bir yerde görev oluşturmak ve paylaşmak.",
            "steps": [
                ("Uygulamayı aç", "GPS açıkken MapRaiders'ı başlat."),
                ("Görev düğmesi", "Haritada artıya bas."),
                ("Yer seç", "Pini GPS noktasına yerleştir."),
                ("Görev tanımla", "Başlık, açıklama ve ödül."),
                ("Yayınla", "Diğer oyuncular bulabilir.")
            ]
        },
        "cln": {
            "desc": "MapRaiders Klanlar: gerçek arkadaşlar bul, klan kur, birlikte bölgeler fethet.",
            "howto_name": "MapRaiders'da nasıl klan kurarım?",
            "howto_desc": "Klan kurmak ve arkadaşları davet etmek.",
            "steps": [
                ("Profili aç", "Profiline git."),
                ("Klan sekmesi", "Klan bölümünü aç."),
                ("Klan kur", "Kur'a bas ve isim seç."),
                ("Davet et", "Arkadaşlara davetiye gönder."),
                ("Bölge kazan", "İlk klan bölgenizi fethedin.")
            ]
        },
    },
    "ru": {
        "terr": {
            "desc": "MapRaiders Территории: ходи, бегай или катайся на велосипеде, чтобы захватить реальные зоны для себя и клана.",
            "howto_name": "Как захватить территорию в MapRaiders?",
            "howto_desc": "Захватить зону, двигаясь в реальном мире.",
            "steps": [
                ("Включи геолокацию", "Активируй GPS и фоновую локацию."),
                ("Начни двигаться", "Иди, беги или катайся по границе."),
                ("Закрой зону", "Вернись к старту, чтобы замкнуть полигон."),
                ("Удерживай территорию", "Посещай регулярно против decay."),
                ("Размести мини-игры", "Разверни игры защиты.")
            ]
        },
        "echo": {
            "desc": "MapRaiders Эхо: оставляй аудио, фото и видео сообщения в реальных GPS-точках.",
            "howto_name": "Как оставить Эхо в MapRaiders?",
            "howto_desc": "Разместить медиа-эхо в реальном месте.",
            "steps": [
                ("Иди на место", "Физически дойди до точки."),
                ("Кнопка Эхо", "Нажми микрофон или камеру."),
                ("Запиши", "Захвати аудио, фото или видео в приложении."),
                ("Видимость", "Публично или внутри клана."),
                ("Опубликуй", "Эхо видно другим игрокам.")
            ]
        },
        "evt": {
            "desc": "MapRaiders События: создавай спонтанные встречи в GPS-точках и знакомься с реальными людьми рядом.",
            "howto_name": "Как создать событие в MapRaiders?",
            "howto_desc": "Начать спонтанную встречу в GPS-точке.",
            "steps": [
                ("Вкладка События", "Перейди в раздел событий."),
                ("Создать событие", "Нажми плюс, укажи название и тип."),
                ("Место и время", "GPS-пин и время начала."),
                ("Участники", "Сколько игроков могут присоединиться."),
                ("Опубликовать", "Событие появится на карте.")
            ]
        },
        "def": {
            "desc": "MapRaiders Защитные игры: защищай территории семью GPS мини-играми.",
            "howto_name": "Как защитить территорию мини-играми?",
            "howto_desc": "Размещение защитных игр против атакующих.",
            "steps": [
                ("Открой территорию", "Нажми на одну из своих территорий."),
                ("Вкладка Защита", "Открой раздел защиты."),
                ("Выбери мини-игру", "Одну из семи игр."),
                ("Сложность", "Время реакции или раунды."),
                ("Активируй", "Атакующие должны пройти игру.")
            ]
        },
        "qst": {
            "desc": "MapRaiders Квесты: создавай GPS-приключения, размещай вызовы в реальных местах, повышай уровень.",
            "howto_name": "Как создать GPS-квест в MapRaiders?",
            "howto_desc": "Создать квест в реальном месте и поделиться.",
            "steps": [
                ("Открой приложение", "Запусти MapRaiders с GPS."),
                ("Кнопка Квест", "Нажми плюс на карте."),
                ("Выбери место", "Поставь пин на GPS-точку."),
                ("Опиши задание", "Название, описание, награда."),
                ("Опубликуй", "Другие игроки найдут квест.")
            ]
        },
        "cln": {
            "desc": "MapRaiders Кланы: находи реальных друзей, создавай клан, захватывайте территории вместе.",
            "howto_name": "Как основать клан в MapRaiders?",
            "howto_desc": "Создать клан и пригласить друзей.",
            "steps": [
                ("Открой профиль", "Перейди в свой профиль."),
                ("Вкладка Кланы", "Открой раздел кланов."),
                ("Основать клан", "Нажми Основать, выбери имя."),
                ("Пригласи", "Отправь приглашения друзьям."),
                ("Захвати территорию", "Захватите первую клановую зону.")
            ]
        },
    },
    "ja": {
        "terr": {
            "desc": "MapRaiders テリトリー:歩いたり、走ったり、自転車に乗って、自分とクランのために実世界のエリアを獲得しよう。",
            "howto_name": "MapRaidersでテリトリーを獲得するには?",
            "howto_desc": "現実世界で動いてエリアを請求する。",
            "steps": [
                ("位置情報を有効化", "GPSとバックグラウンド位置をオン。"),
                ("移動開始", "境界線に沿って歩く、走る、自転車で進む。"),
                ("エリアを閉じる", "開始点に戻って多角形を閉じる。"),
                ("テリトリーを維持", "Decayを防ぐため定期的に訪問。"),
                ("ミニゲーム設置", "防衛ゲームを配置。")
            ]
        },
        "echo": {
            "desc": "MapRaiders エコー:実際のGPSロケーションにオーディオ、写真、ビデオメッセージを残す。",
            "howto_name": "MapRaidersでエコーを残すには?",
            "howto_desc": "実際の場所にメディアエコーを配置。",
            "steps": [
                ("場所に行く", "物理的に現地に向かう。"),
                ("エコーボタン", "マイクまたはカメラアイコンをタップ。"),
                ("録音・撮影", "オーディオ、写真、ビデオを録る。"),
                ("公開範囲", "公開またはクラン内限定。"),
                ("投稿", "他プレイヤーがその場所で見られる。")
            ]
        },
        "evt": {
            "desc": "MapRaiders イベント:GPSロケーションで自発的なミートアップを作り、近くの本物の人と出会う。",
            "howto_name": "MapRaidersでイベントを作成するには?",
            "howto_desc": "GPSロケーションで自発的なミートアップを開始。",
            "steps": [
                ("イベントタブ", "イベントセクションへ。"),
                ("イベント作成", "プラスをタップ、タイトルとタイプ設定。"),
                ("場所と時間", "GPSピンと開始時刻。"),
                ("参加人数", "何人が参加できるか決める。"),
                ("公開", "マップにイベントが表示される。")
            ]
        },
        "def": {
            "desc": "MapRaiders 防衛ゲーム:7つのGPSミニゲームでテリトリーを守る。",
            "howto_name": "ミニゲームでテリトリーを守るには?",
            "howto_desc": "攻撃者に対する防衛ゲームを配置。",
            "steps": [
                ("テリトリーを開く", "マップ上のテリトリーをタップ。"),
                ("防衛タブ", "防衛セクションを開く。"),
                ("ミニゲーム選択", "7つのゲームから選ぶ。"),
                ("難易度", "反応時間やラウンドを設定。"),
                ("有効化", "攻撃者はゲームに勝つ必要がある。")
            ]
        },
        "qst": {
            "desc": "MapRaiders クエスト:GPSアドベンチャーを作成し、実際の場所に挑戦を配置してレベルアップ。",
            "howto_name": "MapRaidersでGPSクエストを作成するには?",
            "howto_desc": "実際の場所でクエストを作成して共有。",
            "steps": [
                ("アプリを開く", "GPSオンでMapRaiders起動。"),
                ("クエストボタン", "マップでプラスをタップ。"),
                ("場所選択", "GPSポイントにピンを置く。"),
                ("タスク定義", "タイトル、説明、報酬。"),
                ("公開", "他プレイヤーが見つけられる。")
            ]
        },
        "cln": {
            "desc": "MapRaiders クラン:実世界の友達を見つけてクランを結成し、一緒にテリトリーを獲得。",
            "howto_name": "MapRaidersでクランを作るには?",
            "howto_desc": "クランを作って友達を招待。",
            "steps": [
                ("プロフィールを開く", "プロフィールへ。"),
                ("クランタブ", "クランセクションを開く。"),
                ("クラン設立", "設立をタップして名前を選ぶ。"),
                ("メンバー招待", "友達や近くのプレイヤーに招待。"),
                ("テリトリー獲得", "最初のクランテリトリーを獲得。")
            ]
        },
    },
    "ko": {
        "terr": {
            "desc": "MapRaiders 영역: 걷거나 달리거나 자전거를 타서 자신과 클랜을 위해 실제 영역을 차지하세요.",
            "howto_name": "MapRaiders에서 영역을 어떻게 정복하나요?",
            "howto_desc": "실제 세계에서 이동하여 지역을 청구합니다.",
            "steps": [
                ("위치 활성화", "GPS와 백그라운드 위치 켜기."),
                ("이동 시작", "경계선을 따라 걷고 달리고 자전거 타기."),
                ("영역 닫기", "시작점으로 돌아와 다각형을 닫기."),
                ("영역 유지", "Decay 방지를 위해 정기 방문."),
                ("미니게임 배치", "방어 게임 전개.")
            ]
        },
        "echo": {
            "desc": "MapRaiders 에코: 실제 GPS 위치에 오디오, 사진, 비디오 메시지를 남기세요.",
            "howto_name": "MapRaiders에서 에코를 어떻게 남기나요?",
            "howto_desc": "실제 장소에 미디어 에코를 배치.",
            "steps": [
                ("장소 방문", "물리적으로 장소로 이동."),
                ("에코 버튼", "마이크 또는 카메라 아이콘 탭."),
                ("녹화", "오디오, 사진, 비디오 촬영."),
                ("가시성", "공개 또는 클랜 내부."),
                ("게시", "다른 플레이어가 볼 수 있음.")
            ]
        },
        "evt": {
            "desc": "MapRaiders 이벤트: GPS 위치에서 즉석 모임을 만들고 근처 실제 사람을 만나세요.",
            "howto_name": "MapRaiders에서 이벤트를 만드는 방법?",
            "howto_desc": "GPS 위치에서 즉석 모임 시작.",
            "steps": [
                ("이벤트 탭", "이벤트 섹션으로 이동."),
                ("이벤트 생성", "플러스 탭, 제목과 유형 입력."),
                ("장소와 시간", "GPS 핀과 시작 시간."),
                ("참가자 수", "몇 명이 참여 가능한지 결정."),
                ("게시", "맵에 이벤트 표시.")
            ]
        },
        "def": {
            "desc": "MapRaiders 방어 게임: 7가지 GPS 미니게임으로 영역을 보호하세요.",
            "howto_name": "미니게임으로 영역을 어떻게 방어하나요?",
            "howto_desc": "공격자에 대한 방어 게임 배치.",
            "steps": [
                ("영역 열기", "자신의 영역 중 하나 탭."),
                ("방어 탭", "방어 섹션 열기."),
                ("미니게임 선택", "7가지 중 선택."),
                ("난이도", "반응 시간 또는 라운드 설정."),
                ("활성화", "공격자는 게임을 이겨야 함.")
            ]
        },
        "qst": {
            "desc": "MapRaiders 퀘스트: GPS 모험 생성, 실제 장소에 도전 배치, 레벨업.",
            "howto_name": "MapRaiders에서 GPS 퀘스트를 만드는 방법?",
            "howto_desc": "실제 장소에서 퀘스트를 만들고 공유.",
            "steps": [
                ("앱 열기", "GPS 활성화로 MapRaiders 시작."),
                ("퀘스트 버튼", "맵에서 플러스 탭."),
                ("장소 선택", "GPS 포인트에 핀 배치."),
                ("작업 정의", "제목, 설명, 보상."),
                ("게시", "다른 플레이어가 찾을 수 있음.")
            ]
        },
        "cln": {
            "desc": "MapRaiders 클랜: 실제 친구를 찾고 클랜을 설립하여 함께 영역을 정복.",
            "howto_name": "MapRaiders에서 클랜을 설립하는 방법?",
            "howto_desc": "클랜 만들고 친구 초대.",
            "steps": [
                ("프로필 열기", "프로필로 이동."),
                ("클랜 탭", "클랜 섹션 열기."),
                ("클랜 설립", "설립 탭하고 이름 선택."),
                ("초대", "친구에게 초대장 발송."),
                ("영역 정복", "첫 클랜 영역 정복.")
            ]
        },
    },
    "zh": {
        "terr": {
            "desc": "MapRaiders 领地:步行、跑步或骑行,为自己和氏族占领真实区域。",
            "howto_name": "在MapRaiders中如何征服领地?",
            "howto_desc": "通过在现实世界中移动来占领区域。",
            "steps": [
                ("启用定位", "开启GPS和后台定位。"),
                ("开始移动", "沿边界步行、跑步或骑行。"),
                ("关闭区域", "返回起点关闭多边形。"),
                ("保持领地", "定期访问以防衰减。"),
                ("放置迷你游戏", "部署防御游戏。")
            ]
        },
        "echo": {
            "desc": "MapRaiders 回音:在真实GPS位置留下音频、照片和视频消息。",
            "howto_name": "在MapRaiders中如何留下回音?",
            "howto_desc": "在真实地点放置媒体回音。",
            "steps": [
                ("前往地点", "亲自到达该位置。"),
                ("回音按钮", "点击麦克风或相机图标。"),
                ("录制", "录制音频、照片或视频。"),
                ("可见性", "公开或氏族内部。"),
                ("发布", "其他玩家可在该位置看到。")
            ]
        },
        "evt": {
            "desc": "MapRaiders 活动:在GPS位置创建临时聚会,认识附近的真实人物。",
            "howto_name": "在MapRaiders中如何创建活动?",
            "howto_desc": "在GPS位置发起临时聚会。",
            "steps": [
                ("活动标签", "前往活动部分。"),
                ("创建活动", "点击加号,设置标题和类型。"),
                ("地点和时间", "GPS图钉和开始时间。"),
                ("参与人数", "决定多少玩家可以加入。"),
                ("发布", "活动出现在地图上。")
            ]
        },
        "def": {
            "desc": "MapRaiders 防御游戏:用七种GPS迷你游戏保护你的领地。",
            "howto_name": "如何用迷你游戏保卫领地?",
            "howto_desc": "针对攻击者部署防御游戏。",
            "steps": [
                ("打开领地", "点击你的一个领地。"),
                ("防御标签", "打开防御部分。"),
                ("选择迷你游戏", "从七种中选择。"),
                ("难度", "配置反应时间或回合数。"),
                ("激活", "攻击者必须赢得游戏。")
            ]
        },
        "qst": {
            "desc": "MapRaiders 任务:创建GPS冒险,在真实地点放置挑战,升级。",
            "howto_name": "在MapRaiders中如何创建GPS任务?",
            "howto_desc": "在真实地点创建任务并分享。",
            "steps": [
                ("打开应用", "启用GPS并启动MapRaiders。"),
                ("任务按钮", "在地图上点击加号。"),
                ("选择地点", "将图钉放在GPS点上。"),
                ("定义任务", "标题、描述和奖励。"),
                ("发布", "其他玩家可以找到它。")
            ]
        },
        "cln": {
            "desc": "MapRaiders 氏族:寻找真实朋友,建立氏族,一起征服领地。",
            "howto_name": "在MapRaiders中如何建立氏族?",
            "howto_desc": "创建氏族并邀请朋友。",
            "steps": [
                ("打开个人资料", "前往你的个人资料。"),
                ("氏族标签", "打开氏族部分。"),
                ("建立氏族", "点击建立并选择名称。"),
                ("邀请", "向朋友发送邀请。"),
                ("占领领地", "一起征服第一个氏族领地。")
            ]
        },
    },
    "ar": {
        "terr": {
            "desc": "MapRaiders الأراضي: امشِ، اركض أو اركب الدراجة للمطالبة بمناطق حقيقية لك ولعشيرتك.",
            "howto_name": "كيف أغزو أرضًا في MapRaiders؟",
            "howto_desc": "المطالبة بمنطقة من خلال التحرك في العالم الحقيقي.",
            "steps": [
                ("تفعيل الموقع", "فعّل GPS والموقع في الخلفية."),
                ("ابدأ التحرك", "امشِ، اركض أو اركب الدراجة على طول الحدود."),
                ("أغلق المنطقة", "عد إلى نقطة البداية لإغلاق المضلع."),
                ("احتفظ بالأرض", "زرها بانتظام لمنع التحلل."),
                ("ضع ألعابًا مصغرة", "انشر ألعاب دفاع.")
            ]
        },
        "echo": {
            "desc": "MapRaiders الأصداء: اترك رسائل صوتية وصور وفيديو في مواقع GPS حقيقية.",
            "howto_name": "كيف أترك صدى في MapRaiders؟",
            "howto_desc": "وضع صدى وسائط في مكان حقيقي.",
            "steps": [
                ("اذهب للمكان", "توجه فعلياً إلى الموقع."),
                ("زر الصدى", "اضغط أيقونة الميكروفون أو الكاميرا."),
                ("سجّل", "التقط صوتًا أو صورة أو فيديو."),
                ("الظهور", "عام أو داخل العشيرة."),
                ("انشر", "الصدى مرئي للاعبين في الموقع.")
            ]
        },
        "evt": {
            "desc": "MapRaiders الفعاليات: أنشئ لقاءات عفوية في مواقع GPS والتقِ بأشخاص حقيقيين قريبين.",
            "howto_name": "كيف أنشئ فعالية في MapRaiders؟",
            "howto_desc": "بدء لقاء عفوي في موقع GPS.",
            "steps": [
                ("تبويب الفعاليات", "انتقل إلى قسم الفعاليات."),
                ("أنشئ فعالية", "اضغط زائد، عنوان ونوع."),
                ("المكان والوقت", "دبوس GPS ووقت البداية."),
                ("عدد المشاركين", "حدد كم لاعب يمكنه الانضمام."),
                ("انشر", "الفعالية تظهر على الخريطة.")
            ]
        },
        "def": {
            "desc": "MapRaiders ألعاب الدفاع: احمِ أراضيك بسبع ألعاب GPS مصغرة.",
            "howto_name": "كيف أدافع عن أرضي بالألعاب المصغرة؟",
            "howto_desc": "وضع ألعاب دفاع ضد المهاجمين.",
            "steps": [
                ("افتح الأرض", "اضغط على إحدى أراضيك."),
                ("تبويب الدفاع", "افتح قسم الدفاع."),
                ("اختر لعبة مصغرة", "من سبع ألعاب."),
                ("الصعوبة", "وقت الاستجابة أو الجولات."),
                ("فعّل", "على المهاجمين الفوز باللعبة.")
            ]
        },
        "qst": {
            "desc": "MapRaiders المهام: أنشئ مغامرات GPS، ضع تحديات في أماكن حقيقية، ارتقِ بمستواك.",
            "howto_name": "كيف أنشئ مهمة GPS في MapRaiders؟",
            "howto_desc": "إنشاء مهمة في مكان حقيقي ومشاركتها.",
            "steps": [
                ("افتح التطبيق", "شغّل MapRaiders مع GPS."),
                ("زر المهمة", "اضغط زائد على الخريطة."),
                ("اختر مكانًا", "ضع الدبوس على نقطة GPS."),
                ("عرّف المهمة", "عنوان، وصف، ومكافأة."),
                ("انشر", "يمكن للاعبين الآخرين إيجادها.")
            ]
        },
        "cln": {
            "desc": "MapRaiders العشائر: جد أصدقاء حقيقيين، أسس عشيرة، وغزوا الأراضي معًا.",
            "howto_name": "كيف أؤسس عشيرة في MapRaiders؟",
            "howto_desc": "إنشاء عشيرة ودعوة الأصدقاء.",
            "steps": [
                ("افتح الملف الشخصي", "اذهب إلى ملفك."),
                ("تبويب العشائر", "افتح قسم العشائر."),
                ("أسس عشيرة", "اضغط تأسيس واختر اسمًا."),
                ("ادعُ", "أرسل دعوات للأصدقاء."),
                ("اغزُ أرضًا", "اغزوا أول أرض عشيرة.")
            ]
        },
    },
    "hi": {
        "terr": {
            "desc": "MapRaiders क्षेत्र: चलें, दौड़ें या साइकिल चलाएं और अपने और अपने क्लैन के लिए वास्तविक क्षेत्रों पर दावा करें।",
            "howto_name": "MapRaiders में क्षेत्र कैसे जीतें?",
            "howto_desc": "वास्तविक दुनिया में चलकर क्षेत्र पर दावा करें।",
            "steps": [
                ("स्थान सक्षम करें", "GPS और बैकग्राउंड लोकेशन चालू करें।"),
                ("चलना शुरू करें", "सीमा के साथ चलें, दौड़ें या साइकिल चलाएं।"),
                ("क्षेत्र बंद करें", "पॉलीगन बंद करने के लिए शुरुआत बिंदु पर लौटें।"),
                ("क्षेत्र बनाए रखें", "क्षय रोकने के लिए नियमित रूप से जाएं।"),
                ("मिनी गेम रखें", "रक्षा गेम तैनात करें।")
            ]
        },
        "echo": {
            "desc": "MapRaiders इको: वास्तविक GPS स्थानों पर ऑडियो, फोटो और वीडियो संदेश छोड़ें।",
            "howto_name": "MapRaiders में इको कैसे छोड़ें?",
            "howto_desc": "वास्तविक स्थान पर मीडिया इको रखें।",
            "steps": [
                ("स्थान पर जाएं", "भौतिक रूप से उस स्थान पर जाएं।"),
                ("इको बटन", "माइक या कैमरा आइकन दबाएं।"),
                ("रिकॉर्ड करें", "ऑडियो, फोटो या वीडियो कैप्चर करें।"),
                ("दृश्यता", "सार्वजनिक या क्लैन आंतरिक।"),
                ("प्रकाशित करें", "इको अन्य खिलाड़ियों को दिखता है।")
            ]
        },
        "evt": {
            "desc": "MapRaiders इवेंट्स: GPS स्थानों पर सहज मीटअप बनाएं और पास के असली लोगों से मिलें।",
            "howto_name": "MapRaiders में इवेंट कैसे बनाएं?",
            "howto_desc": "GPS स्थान पर सहज मीटअप शुरू करें।",
            "steps": [
                ("इवेंट्स टैब", "इवेंट्स अनुभाग पर जाएं।"),
                ("इवेंट बनाएं", "प्लस दबाएं, शीर्षक और प्रकार सेट करें।"),
                ("स्थान और समय", "GPS पिन और शुरुआती समय।"),
                ("प्रतिभागी संख्या", "कितने खिलाड़ी जुड़ सकते हैं।"),
                ("प्रकाशित करें", "इवेंट मानचित्र पर दिखता है।")
            ]
        },
        "def": {
            "desc": "MapRaiders रक्षा गेम्स: सात GPS मिनी गेम्स के साथ अपने क्षेत्रों की रक्षा करें।",
            "howto_name": "मिनी गेम्स के साथ क्षेत्र की रक्षा कैसे करें?",
            "howto_desc": "हमलावरों के खिलाफ रक्षा गेम रखें।",
            "steps": [
                ("क्षेत्र खोलें", "अपने क्षेत्रों में से एक पर टैप करें।"),
                ("रक्षा टैब", "रक्षा अनुभाग खोलें।"),
                ("मिनी गेम चुनें", "सात में से चुनें।"),
                ("कठिनाई", "प्रतिक्रिया समय या राउंड।"),
                ("सक्रिय करें", "हमलावरों को गेम जीतना होगा।")
            ]
        },
        "qst": {
            "desc": "MapRaiders क्वेस्ट्स: GPS रोमांच बनाएं, वास्तविक स्थानों पर चुनौतियां रखें, स्तर बढ़ाएं।",
            "howto_name": "MapRaiders में GPS क्वेस्ट कैसे बनाएं?",
            "howto_desc": "वास्तविक स्थान पर क्वेस्ट बनाएं और साझा करें।",
            "steps": [
                ("ऐप खोलें", "GPS के साथ MapRaiders शुरू करें।"),
                ("क्वेस्ट बटन", "मानचित्र पर प्लस दबाएं।"),
                ("स्थान चुनें", "GPS बिंदु पर पिन रखें।"),
                ("कार्य परिभाषित करें", "शीर्षक, विवरण और पुरस्कार।"),
                ("प्रकाशित करें", "अन्य खिलाड़ी इसे पा सकते हैं।")
            ]
        },
        "cln": {
            "desc": "MapRaiders क्लैन्स: असली दोस्त खोजें, क्लैन बनाएं, साथ मिलकर क्षेत्रों पर कब्जा करें।",
            "howto_name": "MapRaiders में क्लैन कैसे बनाएं?",
            "howto_desc": "क्लैन बनाएं और दोस्तों को आमंत्रित करें।",
            "steps": [
                ("प्रोफाइल खोलें", "अपनी प्रोफाइल पर जाएं।"),
                ("क्लैन्स टैब", "क्लैन्स अनुभाग खोलें।"),
                ("क्लैन बनाएं", "बनाएं दबाएं, नाम चुनें।"),
                ("आमंत्रित करें", "दोस्तों को आमंत्रण भेजें।"),
                ("क्षेत्र पर दावा", "पहले क्लैन क्षेत्र पर विजय प्राप्त करें।")
            ]
        },
    },
}


def build_mobileapp(desc: str) -> dict:
    d = dict(MOBILE_APP_BASE)
    d["description"] = desc
    return d


def build_howto(name: str, desc: str, steps: list) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": name,
        "description": desc,
        "step": [
            {"@type": "HowToStep", "position": i + 1, "name": n, "text": t}
            for i, (n, t) in enumerate(steps)
        ],
    }


def process(lang: str, feat_key: str, slug: str, content: dict) -> str:
    path = ROOT / lang / "features" / f"{slug}.html"
    if not path.exists():
        return f"MISS {path}"
    html = path.read_text(encoding="utf-8")
    if MARKER in html:
        return f"SKIP {lang}/{slug}"
    mob = json.dumps(build_mobileapp(content["desc"]), ensure_ascii=False)
    howto = json.dumps(build_howto(content["howto_name"], content["howto_desc"], content["steps"]), ensure_ascii=False)
    inject = (
        MARKER
        + '<script type="application/ld+json">' + mob + '</script>'
        + '<script type="application/ld+json">' + howto + '</script>'
    )
    m = re.search(r'</head>', html, re.IGNORECASE)
    if not m:
        return f"NOHEAD {lang}/{slug}"
    new_html = html[:m.start()] + inject + html[m.start():]
    path.write_text(new_html, encoding="utf-8")
    return f"OK   {lang}/{slug}"


if __name__ == "__main__":
    count_ok = count_skip = count_miss = 0
    for lang, slugs in SLUGS.items():
        for feat_key, slug in slugs.items():
            result = process(lang, feat_key, slug, CONTENT[lang][feat_key])
            print(result)
            if result.startswith("OK"):
                count_ok += 1
            elif result.startswith("SKIP"):
                count_skip += 1
            else:
                count_miss += 1
    print(f"\nTotal: OK={count_ok} SKIP={count_skip} MISS/NOHEAD={count_miss}")

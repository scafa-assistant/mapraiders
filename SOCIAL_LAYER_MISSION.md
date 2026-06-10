# Mission: Social Layer für MapRaiders entwickeln

> **Status:** Geplant — Implementierung NACH App-Store-Launch (Blocker-Fixes + Server-Deploy + Store-Submission zuerst)
> **Gespeichert:** 2026-06-10
> **Verwandt:** Memory `positioning_map_as_social.md` (Karte als Social Network, GPS-Stories, Zenly-Vakuum)

## Ziel

MapRaiders soll um eine schlanke, hochskalierbare Social-Funktion erweitert werden, die die Karte zum zentralen Discovery-Element macht.

Die Funktion darf die Kernanwendung nicht überladen, sondern muss sich natürlich in das bestehende Nutzererlebnis integrieren.

---

## Grundidee

Jeder Nutzer kann:

* Kurzvideos hochladen
* Fotos hochladen
* Beiträge erstellen
* Livestreams starten
* Mit anderen Nutzern chatten
* Inhalte auf der Karte veröffentlichen

Jeder Beitrag erhält automatisch einen Standortbezug.

Die Karte wird dadurch zu einem lebendigen Echtzeit-Netzwerk aus Erlebnissen, Events, Community-Aktivitäten und Live-Inhalten.

---

## Feed-System

### Lokaler Feed

Zeigt Inhalte in der unmittelbaren Umgebung des Nutzers.

Priorisierung:

* Entfernung
* Aktualität
* Interaktionen
* Relevanz

Beispiel: "Was passiert gerade in meiner Nähe?"

### Globaler Feed

Zeigt weltweit trendende Inhalte.

Priorisierung:

* Aufrufe
* Likes
* Kommentare
* Shares
* Watchtime

Beispiel: "Was passiert gerade weltweit?"

---

## Kartenintegration

Beim Öffnen der Karte erscheinen zusätzliche Marker für:

* Videos
* Fotos
* Beiträge
* Livestreams
* Events

Ein Klick öffnet direkt den Inhalt.

Die Karte wird damit gleichzeitig:

* Navigator
* Discovery-Plattform
* Social Network

---

## Live-System

Nutzer können Livestreams starten.

Auf der Karte erscheint ein Live-Marker.

Andere Nutzer sehen:

* Wer live ist
* Wie viele Zuschauer vorhanden sind
* Entfernung zum Stream
* Thema des Streams

Optional:

* Sofortiger Beitritt
* Folgen
* Benachrichtigungen

---

## JOY Voice Rooms

Zusätzliche Funktion: **"JOY"** — standortbasierte Sprachräume ähnlich Discord.

Eigenschaften:

* Voice-Channels
* Text-Chat
* Community-Räume
* Event-Räume
* Lokale Gruppen

Beispiele:

* Essen Innenstadt
* Nürburgring
* Gamescom
* Car Meets
* Festivals
* Reisegruppen

Nutzer können spontan beitreten oder eigene Räume erstellen.

---

## Technische Anforderungen

Die Integration muss maximal schlank erfolgen.

Verwende möglichst:

* vorhandene Nutzerkonten
* vorhandene Kartenstruktur
* vorhandene Standortdaten
* bestehende Backend-Komponenten

Keine unnötigen Microservices.
Keine komplexen Abhängigkeiten.
MVP zuerst.

---

## MVP Version (Phase 1)

1. Video-Upload
2. Lokaler Feed
3. Globaler Feed
4. Kartenmarker für Inhalte
5. Livestreams
6. JOY Voice Rooms

---

## Erfolgsziel

MapRaiders soll nicht nur zeigen, WO etwas ist.

MapRaiders soll zeigen:

* Was dort gerade passiert.
* Wer dort gerade aktiv ist.
* Welche Inhalte dort entstehen.
* Welche Communities dort leben.

Die Karte wird dadurch vom Navigationswerkzeug zu einem sozialen Echtzeit-Netzwerk.

---

## Implementierungs-Voraussetzungen (vom App-Test 2026-06-10)

Bevor diese Mission startet, müssen abgeschlossen sein:

1. ✅ Build-Pipeline-Fix (Gradle/AGP/Expo-Matrix)
2. ✅ Server-Deploy (dist vom 27.03. → aktueller Stand, Migrations-Check)
3. ✅ i18n-Konsolidierung (EN + DE vollständig)
4. ✅ Store-Submission (AAB, Signing, Listing, Data-Safety)

Vorhandene Bausteine, auf denen der Social Layer aufsetzt:

* Echo-System (Audio/Foto/Video am Standort) → Basis für Content-Upload + Kartenmarker
* Activity Feed (existiert, braucht Username/Timestamp-Fix) → Basis für Feed-System
* WebSocket-Infrastruktur (Server) → Basis für Live-Features + Chat
* Friends/Clan-System → Basis für Follower/Community-Graph
* PostGIS Spatial Indexes → Basis für lokalen Feed (Distanz-Queries)

---

## Anforderungen aus der Community-/SEO-Strategie (ergänzt 10.06.2026)

Für Gruppen/Communities — insbesondere Selbsthilfegruppen (siehe LINKQUELLEN_UND_WACHSTUM, Social-2.0-Roadmap):

1. **Anonymer Modus pro Gruppe (René-Anforderung):** Teilnahme mit Pseudonym + separatem Avatar, entkoppelt vom Spielprofil; keine Rückverfolgbarkeit zwischen Spiel-Identität und Gruppen-Identität.
2. **Sichtbarkeits-Stufen pro Gruppe:** öffentlich / privat (Beitritt auf Anfrage) / unsichtbar (nur per Einladungslink).
3. **Standort-Schutz in Gruppen:** kein Live-Standort in Gruppen-Kontexten; Treffen nur als bewusst gesetzter Treffpunkt (nie Wohnort/aktuelle Position); Umkreis-Anzeige statt Punkt („~2 km entfernt").
4. **Safety-Basics vor Launch des Selbsthilfe-Marketings:** Melden/Blockieren auf Gruppenebene, keine Screenshots-Erwartung kommunizieren, Moderations-Werkzeuge für Gruppengründer.

Begründung: „Private by Design + Server in Deutschland" wird erst mit diesen Stufen zum belegbaren Differenzierer gegen Meta/Discord — und Selbsthilfe-Suchanfragen („selbsthilfegruppe finden") dürfen erst dann beworben werden.

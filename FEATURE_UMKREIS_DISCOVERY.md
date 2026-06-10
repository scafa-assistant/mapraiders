# Feature-Spez: Umkreis-Discovery („eBay-Kleinanzeigen-Filter")

**Idee (René, 10.06.2026):** Alles Auffindbare im Spiel über einen frei wählbaren Umkreis filtern — Liste statt Kartensuche, Tap → Karte navigiert hin. Gilt als Standard-Muster für ALLE künftigen Inhaltstypen.

## UX
- Einstieg: Discovery-Tab oder Lupe auf der Map. Kategorie-Chips: **Territorien · Live-Events · Aktive Spieler · Minigames · Quests · Echos · Meetups** (erweiterbar).
- Pro Kategorie eigener Radius-Slider mit sinnvollen Defaults und Merken der letzten Wahl (Renés Beispiele als Defaults): Territorien 3 km · Live-Events 60 km · Aktive Spieler 1 km · Minigames 2 km.
- Ergebnis: sortierte Liste (Entfernung aufsteigend) mit Kategorie-Icon, Name, Distanz, 1-Zeilen-Status („umkämpft", „startet in 20 min", „3 Slots frei").
- Tap → MapScreen zentriert aufs Ziel + Routenlinie (bestehende Navigation nutzen). Zurück-Geste behält Filterzustand.

## Technik (Server)
- Ein generischer Endpoint statt sieben: `GET /api/discovery?types=territory,event&lat=…&lng=…&radius_m=…` (radius pro type erlaubbar: `radius_m[territory]=3000`).
- PostGIS: `ST_DWithin(geom, ST_MakePoint(lng,lat)::geography, radius_m)` + `ORDER BY ST_Distance` — GIST-Indizes existieren bereits auf den Kerntabellen.
- Response: `{ success, data: { items: [{type, id, name, lat, lng, distance_m, status}] } }` (Konventionen aus CLAUDE.md).
- Radius-Limits serverseitig kappen (z. B. max 100 km Events, max 10 km Spieler) — Performance + Abuse.
- Caching: Redis 30–60 s pro (geohash-Zelle × type × radius-Bucket).

## Privacy (verbindlich, konsistent mit SOCIAL_LAYER_MISSION-Anforderungen)
- **Aktive Spieler:** nur wer Sichtbarkeit aktiv eingeschaltet hat (Opt-in, Default AUS); Anzeige als Umkreis-Angabe („~800 m"), nie exakter Punkt; nie in anonymen Gruppen-Kontexten.
- Events/Meetups: nur öffentlicher Treffpunkt.

## Aufwand (Schätzung)
Server: 1 Endpoint + Service (~1 Tag, Tabellen + Indizes vorhanden). Mobile: 1 Discovery-Screen + Radius-Slider + Map-Handover (~2–3 Tage, List-Screens als Vorlage: ChallengeList/EchoList/QuestList existieren).

## SEO-Anschluss
Sobald live: Feature-Seite `/features/umkreis-suche/` + Erwähnung auf „Leute kennenlernen"-/Meetup-Seiten („zeig mir, was in 3 km um mich passiert") — konkreter Differenzierer, den weder Pokémon GO noch Meetup so bieten.

**Status:** Spez bereit für Produkt-Backlog. Implementierung durch Terminal-Agent/Session nach Priorisierung durch René (empfohlen: nach Store-Launch-Blockern, vor Social-Layer — Discovery macht alle künftigen Inhaltstypen sofort auffindbar).

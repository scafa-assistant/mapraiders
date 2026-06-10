# AP6 — Linkaufbau-Grundstein + Wachstums-Synthese (10.06.2026)

**Ausgangslage:** 0 externe Backlinks (GSC-Linkbericht). Technisches Fundament seit heute sauber. **Keine Outreach-Mails ohne René-Freigabe.**

## Top-10-Linkziele (eigene Seiten nach Impressionen, 3 Mon.)

| # | Seite | Klicks | Impr. | Pos. |
|---|---|---|---|---|
| 1 | /en/games-like-pokemon-go.html | 4 | 314 | 14,9 |
| 2 | /ja/位置情報ゲーム.html | 0 | 108 | 8,0 |
| 3 | /en/features/territories.html | 2 | 107 | 6,8 |
| 4 | /en/best-walking-apps-with-game.html | 0 | 73 | 25,0 |
| 5 | /jogging/ | 0 | 46 | 8,8 |
| 6 | /ko/위치기반게임.html | 2 | 43 | 9,9 |
| 7 | /en/location-based-game.html | 0 | 39 | 7,5 |
| 8 | /ru/features/territories.html | 1 | 30 | 5,5 |
| 9 | /en/audio-graffiti/ | 0 | 27 | 8,6 |
| 10 | /en-in/games-like-pokemon-go-india.html | 1 | 26 | 9,1 |

## 20+ Linkquellen-Kandidaten (recherchiert 10.06.2026)

**Listicles, die aktiv „Pokemon-GO-Alternativen" kuratieren (Aufnahme anfragen):**
1. switchbladegaming.com — „Games Like Pokemon GO: 12/15 Best Alternatives in 2026" (2 Artikel)
2. edgeorbital.io — „GPS Games Where You Walk Around (11 Active Picks)" + „Pokemon GO Alternatives 2026"
3. bitletics.com — „11 Best Games Like Pokémon GO (Walking + GPS)" + „Gamified Fitness Apps"
4. anyto.imyfone.com — „23+ Best Games Like Pokémon GO"
5. tenorshare.com — „Top 18 Similar Games Like Pokemon Go"
6. drfone.wondershare.com — „15 AR Games Similar To Pokémon Go"
7. mistyway.app/blog — „Best Walking Games" (Indie-Dev, Cross-Mention realistisch)
8. stepsandbeasts.app/blog — „Gamified Step Counting Apps" (Indie-Dev)
9. vantagefit.io — „15 Best Step Challenge Apps"
10. yukaichou.com — „Top 10 Gamified Fitness Apps (Octalysis)" — Autoritätsquelle

**Verzeichnisse/Plattformen (Einträge anlegen, hohe Trust-Signale):**
11. Product Hunt — Launch + Listung auf „Pokemon GO Alternatives"-Seite
12. AlternativeTo — Eintrag als Alternative zu Pokémon GO, Ingress, Zenly
13. Wikipedia — „List of geolocation-based video games" (neutraler Eintrag, Relevanzkriterien prüfen)
14. SaaSHub / Slant — App-Vergleichseinträge

**Communities (echte Teilnahme, kein Drop-Spam):**
15. r/Ingress — Spieler suchen aktiv Alternativen (mehrere passende Threads)
16. r/PokemonGO + r/NianticSpatial — bei Feature-News
17. ResetEra — Thread „Mobile games that incentivize walking…"
18. Lemmy.world — „Apps that encourage/gamify walking?"
19. Turf-/Qonqr-Communities — Kernzielgruppe Revier-Spieler
20. onepiece.fandom + r/OnePiece — NUR mit Crew-Feature-Launch (s. unten)

**DACH (für /jogging/, /schnitzeljagd/):**
21. Smartdroid, AppGefahren, Android-User — App-Vorstellung pitchen

## Synthese aus der Tiefenrecherche (Renés Input, 10.06.)

**These bestätigt:** Langlebige GPS-Spiele (Turf, Qonqr, Ingress) leben von lokaler Revier-Identität („Capo der eigenen Nachbarschaft") — nicht von generischen Spiele-Keywords. Der One-Piece/Nakama-Frame (Crew gründen, Territorium erobern) passt psychologisch exakt auf MapRaiders' vorhandene Mechaniken (Clans, Territorien, Duelle).

**Daraus abgeleitete Chancen (Reihenfolge!):**
1. **Stadt-/Bezirks-Landingpages (pSEO):** „Erobere [Stadtteil] mit deiner Crew" — z. B. Hamburg-Altona, Berlin-Kreuzberg. Datenfelder: Stadtteil, Territorien-Count, aktive Clans, Top-Spieler. ABER:
2. **⚠️ Guardrail aus dem Mai-Desaster:** Der Massen-Rollout (780 URLs an einem Tag) hat Google's Vertrauen gekostet (175 „zurzeit nicht indexiert"). pSEO erst, wenn die Indexierungsquote >85 % liegt (Kontrolle Juli), dann **gestaffelt**: max. 25–50 Seiten/Woche, nur DE+EN-Städte zuerst, jede Welle durch `docs/_validate_seo.py`, echte Daten statt Boilerplate (sonst „Gecrawlt – nicht indexiert"-Flut).
3. **Crew/One-Piece-Kampagne:** Landingpage „Gründe deine Crew" mit Nakama-Psychologie; Seeding in One-Piece-Communities erst mit echtem Feature-Hook.
4. **DopaSpeak-Querverweise** (Lyrics-pSEO, Anime/K-Pop-Hubs): liegt beim anderen Agenten — hier nur als gemeinsames Muster dokumentiert: Nischen-Hub-Verzeichnisse + eigene Sitemap + saubere hreflang-Integration nach dem jetzt etablierten MapRaiders-Standard.

## Nächste Schritte (Vorschlag)
1. René-Go für Verzeichnis-Einträge (Product Hunt, AlternativeTo) — kostenlos, hoher Effekt
2. Outreach-Shortlist (Quellen 1–10) mit je 2 Zeilen Pitch — auf Freigabe
3. pSEO-Konzept Stadtteile als eigenes Arbeitspaket NACH Indexierungs-Review im Juli

---

## Nachtrag 10.06. (spät): Übertragbare Muster aus der DopaSpeak-Master-Recherche

1. **Zitierfähige Vergleichsabsätze (GEO):** Auf allen 4 `/en/vs/`-Seiten ist jetzt ein faktischer „Unlike X, …"-Absatz (`<p class="geo-tldr">`) direkt unter dem Opener — das Format, das AI-Engines wörtlich übernehmen. Rollout auf de/ja-vs-Seiten bei nächstem Content-Sprint.
2. **Silo-Sitemaps fürs pSEO-Projekt (Juli):** Stadtteil-Seiten bekommen eigene Sitemaps unter dem Index (`/sitemap-districts-de.xml`, `/sitemap-districts-en.xml`) — Crawl-Steuerung + sauberes Monitoring pro Silo, exakt wie im DopaSpeak-Blueprint.
3. **Slug-Strategie bestätigt:** Native Slugs für ja/ko/zh funktionieren nachweislich (GSC: 位置情報ゲーム 108 Impr.), AR/HI bleiben bewusst lateinisch (Slug-Drift-/Encoding-Risiko) — MapRaiders macht es bereits richtig, keine Änderung.
4. **Keyword-Transfer (Language Gaps):** Querys, für die en bereits rankt (pokemon go alternatives, walking games), semantisch in de/fr-Pendants spiegeln — Kandidat für den Title/Description-Sprint de (CTR-Problem: 118 Impr., 1 Klick).
5. **⚠️ An den DopaSpeak-Agenten weitergeben:** Im Research-Dokument verlinkt der CTA auf `https://dopaspeak.com/MapRaiders.apk` — vermutlich Copy-Paste-Fehler (falsche App auf falscher Domain). Vor Umsetzung korrigieren.

---

## Nachtrag 10.06. (Recherche #2 „Nischen-Eroberung"): Bewertung & Übernahmen

**Bereits erledigt (Recherche basierte auf altem Master-Log):** noindex-Stub-Sanierung per nginx-301 (305 Regeln, deployt + volltestet), Rezensions-Snippets-Fix, Sitemap-Konsolidierung (eine Quelle, phase1 entfernt), Outreach-Grundstein. ⚠️ Recherche-Fehler korrigiert: vorgeschlagenes `/id/ → /id-id/` wäre 404 (id-id existiert nicht — /id/ ist bereits kanonisch); **die GEO-Formeln der Recherche waren erfunden** (Regen +0,25 statt real ×1,5; Slot-Stufentabelle statt real `min(5, ⌊Fläche/1000⌋+1)`).

**Neu übernommen:**
1. **GEO-Faktenblock mit ECHTEN Formeln** (aus `server/src/config/constants.ts` + `claimEngine.ts` verifiziert) live auf `/en/features/territories.html`: Wetter-/Zeit-/Streak-/Novelty-Multiplikatoren + Slot-Regel. Einzigartiger, RAG-extrahierbarer Content, den kein Wettbewerber hat. Rollout-Kandidaten: de/ja-Pendants.
2. **Drei Nischen-Briefs für den nächsten Content-Sprint** (Seiten existieren teils als Basis):
   - „Niantic-Flüchtlinge": neue Seite `/en/non-niantic-gps-games.html` (Keywords: indie pokemon go alternatives, no pay to win); Scopely/PIF-Frust sachlich aufgreifen, Hetzner/DE-Hosting + Akku-Vorteil als Fakten. Bestehende vs-Seiten verlinken.
   - „Gassi-Gaming": de-Fokusseite `/gassi-gehen-app.html` (Keyword: Gassi gehen App) — /hundespaziergang/ existiert, zielt aber auf „Hundespaziergang"; Gassi-Query ist größer. + Hunde-Profile/Gassi-Events als USP.
   - „Audio-Schnitzeljagd": de `/audio-schnitzeljagd.html` als Brücke Geocaching↔Echos (/schnitzeljagd/ + /audio-graffiti/ existieren, das Kombi-Keyword fehlt).
3. **Hunde-Blogger-Outreach** als neue Sektion im OUTREACH_KIT (Beta-Zugang gegen Bericht — lokal relevante Backlinks).

**Nicht übernommen:** Akku-Claim „4× länger als Pokémon GO" (unbelegt; Site sagt belegt „43 % weniger" — keine widersprüchlichen Zahlen publizieren).

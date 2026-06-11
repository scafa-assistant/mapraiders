# Fakten-Basis: Niantic/Scopely-Verkauf (NICHT deployen!)

> Einzige Quelle der Wahrheit für ALLE Texte (13 Sprachen, alle Scripts,
> alle Autoren/Sub-Agents), die den Niantic-Verkauf erwähnen.
> Bei Abweichung zwischen einem Text und dieser Datei gilt diese Datei.
> Stand: 2026-06-11. Underscore-Prefix → von Sitemap/Deploy ausgeschlossen.

## Belegte Fakten (dürfen behauptet werden)

| Fakt | Formulierung (EN-Referenz) |
|---|---|
| Verkauf | Niantic sold its games division to Scopely in March 2025 |
| Preis | The deal was valued at approximately $3.5 billion |
| Betroffene Spiele | Pokémon GO, Monster Hunter Now, Pikmin Bloom, Ingress |
| Eigentümerkette | Scopely is owned by Savvy Games Group, which is owned by Saudi Arabia's Public Investment Fund (PIF) |
| Daten-Scope | Player accounts and the associated location data history transferred with the games |
| PIF-Gaming-Programm | Savvy Games Group is part of a multi-billion-dollar PIF gaming investment program (Vision 2030) |
| MapRaiders-Kontrast | MapRaiders is independently owned (Scafa Investments LLC), developed in Germany, and does not sell location data |

## Quellen (immer mindestens eine verlinken)

- 404 Media: https://www.404media.co/saudi-arabia-buys-pokemon-go-and-probably-all-of-your-location-data/
- Engadget: https://www.engadget.com/mobile/pokemon-go-maker-niantic-sells-its-game-division-to-saudi-owned-scopely-160905447.html
- Techdirt: https://www.techdirt.com/2025/03/14/saudi-arabia-buys-everybodys-sensitive-pokemon-go-location-data/

## VERBOTEN (darf NIRGENDS behauptet werden)

- ❌ "Scopely/Saudi-Arabien missbraucht/verkauft die Daten" — keine Belege,
  reine Spekulation. Erlaubt ist nur die faktische Eigentümer-Frage:
  "Who owns your location data?" + Eigentümerkette.
- ❌ "Die saudische Regierung liest deine Standortdaten" — nicht belegbar.
- ❌ Zahlen zu MAU/Spielerzahlen von Pokémon GO ohne aktuelle Quelle.
- ❌ Jede Form von Saudi-Bashing oder politischer Wertung. Ton: nüchtern,
  faktisch, Quellen verlinkt. Die Fakten sprechen für sich.
- ❌ MapRaiders-Spielerzahlen (Anti-Geisterstadt: "Die Karte ist leer —
  sei der Erste", niemals Zahlen erfinden).
- ❌ "anonym" oder "100% privat" für MapRaiders — belegbar ist nur:
  Standort nur beim Spielen erfasst, keine Werbe-Tracker, kein Datenverkauf,
  Home Zone, Account-Löschung + Datenexport in-App.

## Markt-Sonderregel: Arabisch (`ar/`)

`ar/`-Seiten erhalten KEINE Scopely/PIF-Inhalte — weder Tabellen-Zeile
"Eigentümer" mit PIF-Nennung noch Ownership-Block noch Explainer-Links.
Frame dort: MapRaiders als Komplement zu bestehenden Spielen.
Jedes `_apply_*.py`-Script, das Scopely-Inhalte ausrollt, MUSS `ar/`
hart ausschließen (Pfad-Filter, nicht nur Konvention).

## Standard-Textbausteine

**EN Ownership-Block (vs-Seiten):**
> **Who owns your location data?** In March 2025, Niantic sold Pokémon GO,
> Ingress and its other games to Scopely for about $3.5 billion. Scopely is
> owned by Savvy Games Group, a company of Saudi Arabia's Public Investment
> Fund. Your account and location history transferred with it. MapRaiders is
> independently owned, developed in Germany, and never sells location data.

**DE Ownership-Block (vs-Seiten):**
> **Wem gehören deine Standortdaten?** Im März 2025 verkaufte Niantic
> Pokémon GO, Ingress und seine übrigen Spiele für rund 3,5 Mrd. $ an
> Scopely. Scopely gehört der Savvy Games Group, einem Unternehmen des
> saudischen Staatsfonds PIF. Accounts und Standort-Historie wechselten mit.
> MapRaiders ist unabhängig, wird in Deutschland entwickelt und verkauft
> keine Standortdaten.

# Finales Agenten-Briefing — SEO-Portfolio · 15.06.2026

**Quelle:** GSC nur lesend (alle 4 Properties) + Drill-down der zwei fehlgeschlagenen mapraiders-Validierungen + Repo-Spotchecks. **Guardrail:** Nichts in GSC geschrieben; Schreib-Klicks/Versand ausschließlich René.

---

## 1. mapraiders.com — die zwei „Fehlgeschlagen"-Validierungen aufgeschlüsselt

### A) „Nicht gefunden (404)" — 36 URLs, Validierung fehlgeschlagen
**Beispiel-URLs (zuletzt gecrawlt):** `/en-in/howto/clans/`, `/en-in/howto/territories/`, `/en-in/howto/defence-minigames.html`, `/id/howto/echos/`, `/howto/klangs.html`, `/fr/howto/mini-jeux-defence.html`, `/en-in/vs/pokemon-go/`, `/es/vs/zenly.html`, `/pt-br/-corrida/`, `/pt-br/jogo-pedalar/`.

**Ursache:** Tote interne Links. Die `howto/`- und `vs/`-Link-Templates sowie der Sprachumschalter erzeugen URLs für locale+slug-Kombinationen, die nie als Datei existieren (Repo-Spotcheck bestätigt: `/en-in/howto/*` u. a. existieren nicht). `/pt-br/-corrida/` ist zudem ein fehlerhafter Slug (führender Bindestrich). Das ist exakt der bekannte Reststand „~232 tote Sprachumschalter-Links", den `_validate_seo.py` (Check #6 `toter_interner_link`) als Gate abfängt. Die Validierung schlägt fehl, weil die toten Links weiterhin dorthin zeigen → Google findet die 404 bei jeder Re-Validierung erneut.

**Fix (mapraiders-Agent, Code-Änderung erlaubt):**
1. Tote interne Links entfernen ODER fehlende Zielseiten bauen — der Sprachumschalter/`vs`/`howto`-Generator darf nur auf real existierende locale-Varianten verlinken.
2. Fehlerhafte Slugs (`/-corrida/`) korrigieren oder auf finales Ziel 301/410.
3. `python3 docs/_validate_seo.py` als CI-Gate grün ziehen (0 `toter_interner_link`), **erst danach** René die 404-Validierung in GSC neu starten lassen.

### B) „Duplikat – Google hat anderen Canonical bestimmt" — 33 URLs, Validierung fehlgeschlagen
**Beispiel-URLs:** `/id/vs/ingress.html`, `/id/urban-explorer/`, `/id/features/echos.html`, `/id/features/defense-games.html`, `/id/features/quests.html`, `/es-mx/vs/geocaching.html`, `/es-mx/howto/juegos-defensa.html`, `/es-mx/app-correr/`, `/en/outdoor-social-app.html`, `/es/vs/ingress.html`.

**Ursache:** Das sind **echte, valide Seiten** — Google wählt nur eine andere Version als kanonisch. Treiber ist das bekannte **defekte/inkonsistente hreflang (650-Seiten-Defekt, Juni-Audit)**: Ohne saubere Return-Tags und korrekte locale-Codes kann Google die Sprachvarianten nicht clustern, konsolidiert sie und bestimmt einen eigenen Canonical — der Rest fällt als „Duplikat" raus. Zusätzlich liegen **veraltete `/es/`-URLs** (z. B. `/es/vs/ingress.html`) noch im Index, obwohl `/es/` auf `/es-mx/` weiterleiten soll.

**Fix (mapraiders-Agent):**
1. hreflang reparieren (`_validate_seo.py` Checks #1–4): Selbstreferenz je Set, vollständige Return-Tags, korrekte locale-Codes (`es` → `es-mx`).
2. Self-Canonical je lokalisierter Seite sicherstellen (Canonical zeigt auf sich selbst, nicht quer).
3. Bestätigen, dass alte `/es/...`-URLs sauber 301 auf `/es-mx/...` gehen (Live-Stichprobe `/es/`→`/es-mx/` ist grün), damit sie aus dem Index fallen.
4. Gate grün ziehen, **dann** René die Canonical-Validierung neu starten lassen.

> Merksatz: Beide Validierungen sind am 10.06. fehlgeschlagen, weil die Ursachen (tote Links + hreflang) beim Start noch nicht behoben waren. Reihenfolge immer: **Repo-Fix → `_validate_seo.py` grün → René validiert neu.** Niemals umgekehrt.

---

## 2. mapraiders.com — Backlinks (0 verweisende Domains = größter Engpass)

Das **Outreach-Kit (`OUTREACH_KIT_2026-06-10.md`) ist vollständig und versandfertig** — Verzeichnisse (AlternativeTo, Product Hunt), 10 Listicle-Pitches mit fertigen Mails, Community-Playbook, Hundeblogger-Nachtrag. Versand macht ausschließlich René.

**Meine Review-Hinweise (kleine Optimierungen, kein Blocker):**
- Reihenfolge stimmt: zuerst Verzeichnisse (sofortiger Trust), dann Listicles, Wikipedia zuletzt (Löschrisiko ohne Vorbeleg — korrekt vermerkt).
- Listicle-Pitch #1 `switchbladegaming.com` priorisieren: dessen Artikel-Thema deckt sich mit der aktuellen Top-Klick-Seite `/en/games-like-pokemon-go.html` (3 Klicks/108 Impr.) → höchste Konversionswahrscheinlichkeit.
- Vorschlag: pro versandter Mail Datum in einer Tracking-Spalte mitführen, damit das Montags-Monitoring neue verweisende Domains einem Pitch zuordnen kann (Ziel Q3: 10 Domains, 3 aus Listicles).

---

## 3. dopaspeak.com — Handoff an den zuständigen Agenten (NUR Meldung)

Unverändert kritisch: **358 indexiert vs. 1.170 nicht indexiert.** 404-Validierung fehlgeschlagen (82), 92 offene Weiterleitungen, **895 Canonical-Ausschlüsse** — klassische Relaunch-ohne-301-Altlast. Keine manuellen Maßnahmen.

**Auftrag an den dopaspeak-Agenten:** (1) 404/Weiterleitungen auf finale 200-Ziele 301-mappen, (2) die 895 Canonical-Ausschlüsse prüfen (gewollt vs. Fehlkonfiguration). **Von hier kein Eingriff** — keine Datei-/Server-/Conf-Änderung an dopaspeak.

---

## 4. egons.io & ungehoert.music — Content-Agenten

Beide technisch sauber, keine Fehler, keine manuellen Maßnahmen. Einziger Hebel: **Sichtbarkeit** (je nur 6 Impressionen/Woche, 0 Klicks).
- **egons.io:** 12/12 indexiert. Fokus: Content-Ausbau + erste Backlinks. Keine Technik nötig.
- **ungehoert.music:** 7/10 indexiert (3 Ausschlüsse harmlos), nur Startseite rankt (Ø Pos. 52). Fokus: indexierbare, eigenständige Unterseiten mit eigenem Content.

---

## 5. Offener Punkt für den nächsten Lauf

- **`_validate_seo.py` konnte nicht laufen:** die Linux-Sandbox war diesen Lauf nicht verfügbar, und der HTML-Baum ist nicht in diesen Desktop-Ordner synchronisiert (nur Script + `sitemap.xml` liegen unter `docs/`). Der Check muss dort laufen, wo die HTML-Dateien liegen (Server/GitHub-Repo) bzw. lokal durch René/den mapraiders-Agenten. Die GSC-Drill-downs bestätigen aber bereits dieselben Ursachen, die das Script gatet (tote Links + hreflang).

---

*Erstellt vom globalen SEO-Monitoring (nur lesend). Schreib-/Versand-/GSC-Validierungs-Aktionen ausschließlich René.*

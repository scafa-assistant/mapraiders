# Nachzieh-Auftrag mapraiders.com — an den ausführenden Agenten · 15.06.2026

**Kontext:** Commit `aa14e35` ist gegengeprüft. Bestätigt: `aggregateRating` = **0** (war 569) ✅, tote Links repariert, `_validate_seo.py` grün ✅. Zwei Dinge fehlen noch — beide rein in den Build-Skripten, **nie** gebaute HTML direkt patchen. Reihenfolge: Skript → Build → `_validate_seo.py` grün → `tsc --noEmit` = 0 → commit → push (René) → GSC-Neuvalidierung (René).

---

## Aufgabe 1 — Review-JSON-LD vollständig entfernen (Phase 1 zu Ende führen)

**Befund (verifiziert):** **240 Live-Seiten** tragen weiterhin die drei 5-Sterne-`Review`-Objekte (Ron C. / Vivian N. / Aljoscha P., je `reviewRating.ratingValue: 5`). Sie sind zwar vom Produkt-Schema **abgekoppelt** (kein `review[]`-Array, kein `itemReviewed`) — also niedriges Risiko, keine Rich Results — aber es ist selbstgeschriebenes Review-Markup mit **null SEO-Nutzen**. Für einen sauberen, zukunftssicheren Zustand raus damit.

**Aktion:**
- Die verwaisten `<script type="application/ld+json">`-Blöcke mit `"@type":"Review"` (Ron/Vivian/Aljoscha) aus allen 240 Seiten entfernen — `_apply_remove_review.py` entsprechend erweitern/erneut anwenden, damit es auch die standalone-Review-Nodes (nicht nur die unter dem Produkt-Schema) greift.
- **Sichtbare Tester-Cards bleiben** — als reines HTML (ehrlicher „geschlossene Beta"-Social-Proof). Nur das **Structured-Data-Markup** verschwindet.
- `offers`, `publisher`, `MobileApplication`/`VideoGame`-Schema **intakt** lassen.

**Abnahme:** `grep -r '"@type": *"Review"' docs --include='*.html'` (ohne `_retired/`) = **0 Treffer**. `_validate_seo.py` weiterhin grün.

---

## Aufgabe 2 — hreflang Phase 0c punktgenau (Ursache der 33 „Duplikat-Canonical")

**Befund (Audit):** `hreflang="en-IN"` + Region-Varianten fehlen auf allen Unterseiten außer den Startseiten (Phase 0c aus `_apply_hreflang_v2.py` nur teilweise gelaufen). Ohne saubere Cluster wählt Google einen eigenen Canonical → die 33 GSC-Duplikate.

**Vorbedingung (René):** die **33 URLs** aus GSC exportieren — Property mapraiders → *Seiten* → Grund **„Duplikat – Google hat eine andere Seite als der Nutzer als kanonische Seite bestimmt"** → **EXPORTIEREN → CSV**. Ablage: `gsc_audit_2026-06-10/gsc_canonical_export_2026-06-15.csv` (oder im mapraiders-Repo, wo der Executor liest). **Nicht aus Slug-Mustern raten** — exakt wie bei dopaspeak gelernt.

**Aktion (sobald CSV vorliegt):**
- Für jede der 33 URLs den hreflang-Cluster vervollständigen: **Selbstreferenz** + **en-IN/Region-Varianten** + vollständige **Return-Tags** (Reziprozität), über **alle** Seitentypen (vs/features/howto/Nischen), nicht nur Startseiten. Tools: `_clean_hreflang.py`, `_repair_hreflang.py`, Phase-0c-Logik.
- Sicherstellen, dass jede betroffene Seite ein **Self-Canonical** trägt (zeigt auf sich selbst).
- Locale-Codes bleiben wie gehabt korrekt (`es`→`/es-mx/`, `zh-Hans`→`/zh-cn/`).

**Bewusst NICHT (datenbelegt, niedriger ROI):** die ~190 hreflang-Waisen ohne Pendant *nicht* vergolden — das ist ein Content-Projekt nach Launch. Die neue Waisen-**Warnung** im Validator bleibt sichtbar, färbt das Gate aber nicht rot.

**Abnahme:** `_validate_seo.py` = 0 Fehler; die 33 Cluster reziprok + self-canonical; Waisen-Warnung gesichtet.

---

## Nach beiden Aufgaben
Build → `_validate_seo.py` grün + `tsc --noEmit` = 0 → commit → **René pusht** (Deploy via GitHub-Action) → **René** startet in GSC die Neuvalidierung **404 + Duplikat-Canonical** (erst nach Deploy, sonst fällt sie wieder durch). Ergebnis zur Kontrolle an mich — ich prüfe Live-Stichproben + GSC-Verlauf gegen.

**Parallel/davor wichtigster Hebel (René):** OUTREACH_KIT versenden — 0 verweisende Domains ist der eigentliche Engpass, größer als alle Tag-Fixes.

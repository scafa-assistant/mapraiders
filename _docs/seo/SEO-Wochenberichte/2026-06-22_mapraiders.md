# Wochenbericht SEO — MapRaiders · 22.06.2026

**Property:** https://mapraiders.com/ · **Modus:** GSC nur lesend (Guardrail eingehalten — keine Validierungen gestartet, nichts eingereicht/entfernt) · **Vergleichsbasis:** Vorbericht 15.06.2026 · **Leistungszeitraum:** 14.–20.06.2026 (7 Tage)

## 🔴 KRITISCH: TLS-/Zertifikatsfehler domain-weit in Chrome

Beim Live-Aufruf von `https://mapraiders.com/` UND `https://mapraiders.com/es/` zeigt Chrome eine **„Datenschutzfehler"-Seite** (NET::ERR_CERT-Klasse), und zwar für die gesamte Domain, nicht nur einen Pfad. Im selben Chrome luden google.com und die GSC unmittelbar davor fehlerfrei, das Problem ist also mapraiders-spezifisch und kein Browser-/Clock-Artefakt. Der lenientere web_fetch-Client (anderer HTTP-Stack) verbindet sich noch, ein echter Chrome-/Safari-Nutzer bekommt aber eine ganzseitige Sicherheitswarnung und kommt nicht auf die Seite. Vorwoche war `/es/`→`/es-mx/` noch 301→200 OK, das ist also **neu diese Woche**. Den exakten NET::ERR-Code konnte dieser Lauf nicht abgreifen (Fehlerseite blockt Screenshot/DOM, Desktop-Screenshot braucht Renés Freigabe, im Scheduler nicht verfügbar).

**Wahrscheinlichste Ursache:** abgelaufenes oder fehlkonfiguriertes TLS-Zertifikat (Chrome streng, web_fetch-Client nachsichtig). **Sofort prüfen** (René): Zertifikatsgültigkeit/Kette auf mapraiders.com, Renew/Deploy. Solange der Fehler steht, ist die Live-`/es/`-Redirect-Stichprobe nicht verifizierbar und für echte Nutzer ist die Seite praktisch down.

## Kennzahlen

| Kennzahl | Vorwoche | Aktuell | Ampel |
|---|---|---|---|
| Seiten indexiert | 544 | 544 | 🟢 stabil |
| Seiten nicht indexiert | 357 (9 Gründe) | 357 (9 Gründe) | 🟡 stabil |
| Validierung 404 | **Fehlgeschlagen (36)** | **Gestartet (36)** | 🟢 neu gestartet |
| Validierung Duplikat (Google-kanonisch) | **Fehlgeschlagen (33)** | **Gestartet (33)** | 🟢 neu gestartet |
| Validierung noindex | 106 (nicht gestartet) | Gestartet (106) | 🟢 läuft |
| Validierung Alt. kanon. Seite | 36 (nicht gestartet) | Gestartet (36) | 🟢 läuft |
| Validierung Weiterleitung | 13 (nicht gestartet) | Gestartet (13) | 🟢 läuft |
| Validierung „Gefunden – nicht idx." | Gestartet (67) | Gestartet (67) | 🟡 läuft |
| Validierung „Gecrawlt – nicht idx." | 63 (nicht gestartet) | Gestartet (63) | 🟡 läuft |
| Validierung 403 | Gestartet (2) | Gestartet (2) | 🟡 läuft |
| Validierung Duplikat (Nutzer) | — | Gestartet (1) | 🟡 läuft |
| Crawl: OK (200) | 83 % | 84 % | 🟢 |
| Crawl: Verschoben (Sonstiges) | 9 % | 9 % | 🟡 Soll →0 |
| Crawl: Nicht gefunden (404) | 5 % | 5 % | 🟡 |
| Crawl: Dauerhaft verschoben (301) | — | 1 % | 🟢 |
| Hoststatus | „in Vergangenheit Probleme" | „letzte Woche Probleme" | 🟡 beobachten |
| Verweisende Domains (extern) | 0 | 0 | 🔴 Outreach offen |
| Interne Links | 4.975 | 4.975 | 🟢 |
| Leistung 7 T: Klicks / Impr. | 15 / 347 | 4 / 394 (CTR 1 %, Pos. 12,3) | 🔴 Klicks ↓ |
| Live `/` & `/es/` (Chrome) | 301 → 200 OK | **Datenschutzfehler (Cert)** | 🔴 FAIL |
| Lokal `_validate_seo.py` | n/v (Sandbox aus) | **OK, alle Gates bestanden** (763 Seiten) | 🟢 |

**Top-3-Seiten (7 T, Klicks/Impr.):** `/ko/위치기반게임.html` (2/12) · `/ja/散歩ゲーム.html` (2/7) · `/en/games-like-pokemon-go.html` (0/98)

## Erkenntnisse

- **🔴 Domain-weiter Zertifikatsfehler ist der wichtigste Befund** (siehe oben). Alles andere ist nachrangig, bis die Seite in echten Browsern wieder lädt.
- **🟢 Validierungen wieder in Gang:** Die beiden seit Wochen „Fehlgeschlagenen" Validierungen (404, Duplikat-Canonical) stehen jetzt auf „Gestartet" — ebenso noindex, Alt-Canonical und Weiterleitung. Sieht nach einem Neustart durch René aus. Ergebnis in 1–2 Wochen beobachten.
- **🔴/🟡 Klicks von 15 auf 4 gefallen** bei leicht gestiegenen Impressionen (347→394) und etwas schlechterer Position (10,4→12,3). Bei diesen Kleinmengen teils Rauschen, aber zusammen mit dem Cert-Fehler beobachten: wenn die Seite für Nutzer nicht lädt, bricht die CTR weiter ein.
- **🟢 Lokaler Gate-Check bestanden:** `_validate_seo.py` lief diesmal (Sandbox verfügbar), 763 Seiten, alle Gate-Prüfungen OK. Verbleibend: 219 „indexierbar_ohne_hreflang" (Cluster-/Content-Aufgabe, kein Gate-Fehler).
- Backlinks weiter 0, Crawl-Verteilung praktisch unverändert, Hoststatus meldet nun „letzte Woche Probleme" — passt zum Cert-Verdacht.

## Empfohlene nächste Aktion

1. **SOFORT (René):** TLS-Zertifikat mapraiders.com prüfen (Gültigkeit, Kette, Deploy) und erneuern. Danach `/` und `/es/`→`/es-mx/` in Chrome gegenprüfen.
2. Laufende Validierungen (404, Dup-Canonical etc.) abwarten und nächste Woche auf „Bestanden/Fehlgeschlagen" kontrollieren.
3. Outreach-Versand durch René gegen die 0-Backlink-Lage.

# SEO-Wochenübersicht — alle Projekte · 22.06.2026

**Quelle:** Google Search Console (nur lesend) · **Index-Stand:** 17.–20.06.2026 · **Leistungszeitraum:** 14.–20.06.2026 (7 Tage)
**Properties:** mapraiders.com · dopaspeak.com · egons.io · ungehoert.music

## 🔴 ZUERST: kritischer Befund mapraiders.com

`https://mapraiders.com/` (gesamte Domain) wirft in Chrome eine **„Datenschutzfehler"-Seite (TLS-/Zertifikatsfehler)** — neu diese Woche. google.com/GSC luden im selben Chrome fehlerfrei, das Problem ist mapraiders-spezifisch. Der nachsichtige web_fetch-Client verbindet noch, ein echter Nutzer kommt aber nicht auf die Seite. Die Live-`/es/`→`/es-mx/`-Redirect-Stichprobe schlägt damit fehl. **Verdacht: abgelaufenes/fehlkonfiguriertes Zertifikat. René sollte das Zertifikat sofort prüfen und erneuern.**

## Portfolio-Snapshot

| Projekt | Indexiert | Nicht idx. | Klicks 7T | Impr. 7T | Ø Pos. | Man. Maßn. | Ampel |
|---|---|---|---|---|---|---|---|
| mapraiders.com | 544 | 357 | 4 | 394 | 12,3 | keine | 🔴 |
| dopaspeak.com | 358 | **1.170** | 2 | 321 | 21,6 | keine | 🔴 |
| egons.io | 12 | 0 | 2 | 58 | 19,9 | keine | 🟢 |
| ungehoert.music | 7 | 3 | 0 | 1 | 7,0 | keine | 🟢 |

*Keine manuellen Maßnahmen/Sicherheitsprobleme in irgendeiner Property. Indexierungszahlen portfolioweit stabil; der mapraiders-Cert-Fehler ist die einzige neue Eskalation.*

## Wichtigste Erkenntnisse

- **🔴 mapraiders.com — TLS-/Zertifikatsfehler domain-weit (NEU):** Seite lädt für echte Chrome-Nutzer nicht, Redirect-Stichprobe fehlgeschlagen. Höchste Priorität, siehe oben.
- **🟢 Validierungen laufen wieder (mapraiders & dopaspeak):** Die zuvor „Fehlgeschlagenen" 404-/Duplikat-Canonical-Validierungen stehen bei beiden Properties jetzt auf „Gestartet" — Neustart durch René erkennbar. Ergebnis in 1–2 Wochen kontrollieren.
- **🟢 egons.io zieht an:** Impressionen 6→58 (fast 10x), erstmals 2 Klicks. Themenseiten `KI bei ADHS` / `KI für Senioren` tragen. Bester Mover im Portfolio.
- **🟡 mapraiders Klicks 15→4** bei leicht höheren Impressionen — teils Rauschen, aber im Kontext des Cert-Fehlers beobachten.
- **🔴 dopaspeak Altlast unverändert:** 1.170 nicht indexiert, davon 895 Canonical-Ausschlüsse, 92 Weiterleitungen, 82 404. Betreut anderer Agent — nur gemeldet.

## Empfohlene nächste Aktionen

1. **mapraiders (René, sofort):** TLS-Zertifikat prüfen/erneuern, danach `/` und `/es/`-Redirect in Chrome gegenprüfen.
2. **mapraiders & dopaspeak:** Neu gestartete Validierungen nächste Woche auf Bestanden/Fehlgeschlagen kontrollieren.
3. **dopaspeak:** mit zuständigem Agenten 301-Mapping + 895 Canonical-Ausschlüsse klären (größter Indexierungshebel).
4. **egons.io:** Auftrieb nutzen — Content um die anziehenden KI-Themen ausbauen, erste Backlinks.
5. **mapraiders:** Outreach-Versand durch René gegen 0 externe Backlinks.

## Hinweise zum Lauf

- GSC ausschließlich gelesen (Guardrail eingehalten — keine Validierung gestartet, nichts eingereicht/entfernt/geändert).
- Lokaler Check `_validate_seo.py` lief diesmal (Sandbox verfügbar): 763 Seiten, **alle Gate-Prüfungen bestanden**, 219 „indexierbar_ohne_hreflang"-Warnungen (Content-/Cluster-Aufgabe, kein Gate-Fehler).
- Exakter NET::ERR-Cert-Code von mapraiders konnte nicht abgegriffen werden (Fehlerseite blockt DOM/Screenshot; Desktop-Screenshot braucht Renés Freigabe, im Scheduler nicht verfügbar).

*Einzelberichte je Projekt liegen im selben Ordner.*

# Beta-Tester Einwilligungs-Email (DE)

**Wann nutzen:** Wenn ein Beta-Tester **EU-Bürger** ist (Wohnsitz in DE/AT/CH/IT/FR/ES/PT/NL/BE/PL/usw.) → DSGVO-Pflicht.

Bei Nicht-EU-Testern technisch keine DSGVO-Pflicht, aber gute Praxis. Pro Land ggf. lokales Gesetz (UK GDPR, Swiss DSG, Türkei KVKK, Brasilien LGPD).

---

## Email-Vorlage

```
An: [tester-email]
Betreff: MapRaiders Beta — kurze Einwilligungs-Bestätigung für deine Stimme

Hi [Vorname],

danke fürs Testen von MapRaiders in der geschlossenen Beta!
Ich würde gerne dein Feedback auf mapraiders.com und in App-Store-
Listings veröffentlichen — über deine Initialen, also "[Vorname] [Nachname-Initial]."

Hier ist der Text-Vorschlag, den ich aus deinem Feedback formuliert habe:

> "[QUOTE-DRAFT]"

Bitte schau einmal drüber:

1. Passt der Text so, oder möchtest du was anpassen?
2. Wenn ja — bestätige bitte per Antwort, dass du folgendem zustimmst:

✅ Ich erlaube Scafa Investments LLC, folgendes öffentlich zu zeigen:
   - Mein Vorname + Nachnamen-Initial (z.B. "[Vorname] [N.]")
   - Berufsbeschreibung / Persona (z.B. "Hundebesitzer, Beta-Tester")
   - Mein Beta-Test-Feedback (Quote oben)
   - Sterne-Bewertung (5 von 5)
   - KEIN Foto, KEIN voller Nachname, KEINE Stadt

✅ Ich verstehe, dass dieser Text in 13 Sprachen übersetzt veröffentlicht
   wird (DE, EN, FR, ES, IT, PT, TR, RU, JA, KO, ZH, AR, HI). Eine kleine
   Markierung kennzeichnet, dass der Original-Text deutsch ist.

✅ Ich kann diese Einwilligung jederzeit widerrufen unter
   beta@mapraiders.com — dann wird mein Eintrag innerhalb von 7 Tagen
   von allen Seiten entfernt.

Antworte einfach mit "Einverstanden" wenn das passt — oder mit Korrekturen
wenn was geändert werden soll.

Danke, dass du MapRaiders mit aufbaust!

René
SCAFA INVESTMENTS LLC
9830 Bahama Dr, Cutler Bay, FL 33189-1568, USA
info@scafa-investments.com
```

---

## Drei vorbereitete Quote-Drafts (aus aktuellem Repo-Stand)

### Ron C. — Hundebesitzer
> "Mein Hund liebt seine Runde — und ich liebe, dass jede Runde mein Viertel auf der Karte sichtbarer macht. Habe meine ganze Straße jetzt erobert."

### Vivian N. — Joggerin
> "Ich jogge sowieso jeden Morgen. Mit MapRaiders hat jede Strecke ein Ziel: Gebiet halten oder zurückerobern. Mein Cardio-Antrieb ist explodiert."

### Aljoscha P. — Stadt-Erkunder
> "Echos zu legen und zu sehen wer sie findet, ist wie eine offene Schnitzeljagd durch die ganze Stadt. Ich entdecke Ecken, die ich noch nie gesehen habe."

---

## Speichern der Bestätigungen

Nach Erhalt: Email-Bestätigungen archivieren in:
```
seo-strategy/legal/beta_consent_log/
  ├── 2026-04-XX_ron_c_consent.eml
  ├── 2026-04-XX_vivian_n_consent.eml
  └── 2026-04-XX_aljoscha_p_consent.eml
```

(Hinweis: Email-Files mit `.eml` extension speichern, dann sind sie auch nach Jahren noch in jedem Email-Client lesbar als Beweis.)

---

## Was tun wenn ein Tester widerruft?

1. Innerhalb 7 Tagen: Tester-Karte aus den 288 Pages entfernen
2. Schema.org Review-Eintrag entfernen
3. AggregateRating auf 2 Reviews / 5.0 anpassen
4. Skript: `docs/_apply_remove_review.py [tester-key]` (TODO bauen)

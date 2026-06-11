# Play Store Submission — MapRaiders v1.0.0 (versionCode 2)

> **Artefakt:** `builds/mapraiders-v1.0.0-vc2-production.aab` (EAS-Build `8d3ee35d`, signiert mit EAS-Keystore "Build Credentials 62P9H0rQMx")
> **Account:** workspace.scafa@gmail.com — Play Console Account-ID 7101708942875114448
> **Rechtsträger:** SCAFA INVESTMENTS LLC (keine persönlichen Namen im Listing!)
> **Paket:** com.mapraiders.app

---

## 1. App anlegen + Signing

1. Play Console → "App erstellen": Name **MapRaiders**, Standardsprache **Englisch (US)**, Typ **App**, **Kostenlos**
2. Release → Setup → App-Signatur: **Google Play App Signing aktivieren**, beim ersten AAB-Upload wird der EAS-Upload-Key automatisch registriert
3. Track für den Start: **Internes Testing** (sofort live für Tester, kein Review) → danach Production

## 2. Store-Listing EN (Standardsprache)

**App-Name (30):** `MapRaiders: GPS Territory Game`

**Kurzbeschreibung (80):**
`Walk, run & cycle to claim real territory. Quests, clans & duels on a live map.`

**Lange Beschreibung:**
```
Your city is the board. Your legs are the controller.

MapRaiders turns the real world into a territory game. Walk, run or cycle a loop and the area inside becomes YOUR territory — visible to every player on the live map. Defend it, expand it, or lose it.

CLAIM REAL TERRITORY
• Close a loop on foot or by bike to capture the area
• Your territories decay if you stay home — keep moving
• Set defenses and mini-game challenges for attackers

CREATE & DISCOVER
• Build quests for other players at real locations
• Leave echoes: audio, photo or video messages pinned to places
• Find artifacts, join meetups and local events

COMPETE
• Challenge territory owners to duels and mini games
• Climb leaderboards: territory, explorer, questmaker and more
• Earn titles, badges and level up your pet companion

PLAY TOGETHER
• Add friends and see their activity
• Form clans — or get matched into one automatically based on where you play
• Clan chat, shared territory and clan rankings

PRIVACY FIRST
• Home Zone: hide all claims near your home from the public map
• Full data export and account deletion built in
• Your location is only tracked while you play

MapRaiders works anywhere on earth. Whether you jog in a park, walk your dog or cycle to work — every step can conquer ground.

The map is empty. Go claim it.
```

## 3. Store-Listing DE

**App-Name (30):** `MapRaiders: GPS Revier-Spiel`

**Kurzbeschreibung (80):**
`Geh, lauf & radle, um echtes Gebiet zu erobern. Quests, Clans & Duelle live.`

**Lange Beschreibung:**
```
Deine Stadt ist das Spielbrett. Deine Beine sind der Controller.

MapRaiders verwandelt die echte Welt in ein Revier-Spiel. Geh, lauf oder radle eine Runde und die Fläche darin gehört DIR — sichtbar für alle Spieler auf der Live-Karte. Verteidige sie, vergrößere sie oder verliere sie.

ECHTES GEBIET EROBERN
• Schließe eine Runde zu Fuß oder mit dem Rad und sichere dir die Fläche
• Deine Territorien zerfallen, wenn du zu Hause bleibst — bleib in Bewegung
• Stelle Verteidigungen und Minispiel-Herausforderungen für Angreifer auf

ERSCHAFFEN & ENTDECKEN
• Erstelle Quests für andere Spieler an echten Orten
• Hinterlasse Echos: Audio-, Foto- oder Video-Botschaften an Orten
• Finde Artefakte, tritt Meetups und lokalen Events bei

WETTKAMPF
• Fordere Gebietsbesitzer zu Duellen und Minispielen heraus
• Erklimm die Ranglisten: Territorium, Entdecker, Questbauer und mehr
• Verdiene Titel, Abzeichen und level dein Haustier

ZUSAMMEN SPIELEN
• Füge Freunde hinzu und sieh ihre Aktivität
• Gründe Clans — oder werde automatisch passend zugeordnet
• Clan-Chat, gemeinsames Gebiet und Clan-Ranglisten

PRIVATSPHÄRE ZUERST
• Home Zone: verbirg alle Claims in der Nähe deines Zuhauses
• Datenexport und Account-Löschung direkt in der App
• Dein Standort wird nur beim Spielen erfasst

MapRaiders funktioniert überall auf der Welt. Ob du im Park joggst, mit dem Hund gehst oder zur Arbeit radelst — jeder Schritt kann Boden erobern.

Die Karte ist leer. Hol sie dir.
```

## 4. Grafiken (müssen noch erstellt werden)

| Asset | Format | Status |
|---|---|---|
| App-Icon | 512×512 PNG | aus `mobile/assets/` exportieren |
| Feature Graphic | 1024×500 PNG | **fehlt — erstellen** |
| Screenshots Phone | min. 2, 16:9 oder 9:16 | aus Geräte-Tests vorhanden (test_*.png 1280×2856) — kuratieren: Map dark, Map light, Quests, Profil, Leaderboard, Settings |

## 5. Data-Safety-Formular (wahrheitsgemäß per Code-Stand)

**Werden Daten erhoben?** Ja. **Werden Daten geteilt?** Nein (keine Dritt-SDKs für Werbung/Analytics).

| Datentyp | Erhoben | Zweck | Verknüpft mit Identität | Optional |
|---|---|---|---|---|
| Standort (genau) | Ja | App-Funktion (Territorium, Quests) | Ja | Nein (Kernfunktion) |
| Standort (Hintergrund) | Ja, opt-in | App-Funktion (Tracking bei Bildschirm aus) | Ja | Ja |
| E-Mail | Ja | Konto | Ja | Nein |
| Name (Username) | Ja | Konto/Anzeige | Ja | Nein |
| Fotos/Audio/Video | Ja, nur bei Echo-Erstellung | App-Funktion (User-Content) | Ja | Ja |
| App-Interaktionen (XP, Routen) | Ja | App-Funktion | Ja | Nein |

**Sicherheit:** Daten verschlüsselt übertragen (HTTPS). **Löschung:** Account-Löschung in-App (Settings → Delete Account) + GDPR-Export. Datenschutz-URL: https://mapraiders.com/datenschutz.html

## 6. Content-Rating-Fragebogen (IARC)

- Kategorie: **Spiel**
- Gewalt/Sex/Drogen/Glücksspiel: **Nein**
- User-zu-User-Interaktion: **Ja** (Chat, User-Content) → ergibt typisch USK 6/PEGI 7-Bereich wegen Interaktion
- Standortweitergabe an andere Nutzer: **Ja** (Territorien öffentlich sichtbar — Home-Zone-Feature erwähnen)
- Persönliche Infos teilbar: Ja (Username, Avatar)

## 7. Sonstige Pflichtfelder

- **Kategorie:** Spiele → Abenteuer (alternativ: Gelegenheitsspiele)
- **Tags:** GPS, Fitness, Territorium, Outdoor, Multiplayer
- **E-Mail (öffentlich):** info@scafa-investments.com
- **Website:** https://mapraiders.com
- **Datenschutz-URL:** https://mapraiders.com/datenschutz.html ✅ (geprüft 2026-06-11: live, nennt SCAFA INVESTMENTS LLC, beschreibt Standort/GPS-Nutzung 16×)
- **Zielgruppe:** 13+ (keine Kinder-App — vermeidet Families-Policy-Auflagen)
- **Werbung enthalten:** Nein

## 8. Checkliste vor Submit

- [x] Privacy-Policy live: mapraiders.com/datenschutz.html (LLC als Betreiber ✓, GPS-Datennutzung ✓; AGB + Impressum ebenfalls live, App-Links zeigen auf dieselben URLs)
- [ ] AAB hochgeladen (Internal Testing)
- [ ] Data-Safety ausgefüllt wie oben
- [ ] Content-Rating-Fragebogen abgeschickt
- [ ] Listing EN + DE eingepflegt
- [ ] Feature Graphic + min. 4 Screenshots hochgeladen
- [ ] Tester-Liste fürs Internal Testing (workspace.scafa@gmail.com + Beta-Tester)
- [ ] Nach Internal-Test ok → Production-Release einreichen

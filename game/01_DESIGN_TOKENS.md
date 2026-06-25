# 01 , Design Tokens

Exakte Werte aus dem Prototyp. In der App als zentrales Theme-Objekt anlegen (z. B. `theme.ts`) und Screens schrittweise darauf umstellen.

---

## Farben

### Basis / Flächen
```
bg          #F6F4F1   App-Hintergrund (warmes Off-White)
bgAlt       #EFEDE8   alternierende Sektionen
surface     #FFFFFF   Karten, Sheets
hairline    rgba(20,18,16,.07)   feine Trennlinien/Ränder
```

### Text
```
text        #141210   Haupttext (fast schwarz, warm)
textMuted   #756F6A   Sekundärtext
textFaint   #8A847F   Captions, Labels
textDim     #A39C96   sehr leise / Platzhalter
```

### Systemfarben (Spielsysteme , das ist der „polychrome" Code, der gefällt)
```
blue   #1558F0   Primär / Erobern / Imperium / „du"
red    #D7263D   Kampf / Gegner
green  #1B9E5A   Bauen / Wirtschaft / Erfolg
amber  #F5A623   Aufklärung / Begegnung / Streifzug / Energie
sky    #4B7BFF   sekundäres Blau
```
Tints jeweils als `rgba(...,.08–.16)` für Flächen, `rgba(...,.16–.30)` für Ränder.

### Auf dunklem Grund (heller)
```
blue   #5C8BFF      red  #FF6B7A
green  #46E08A      amber #FFB23E
darkText  #EDEFF6   darkMuted #9FB0D0   darkFaint #7E8FB5
```

### Dunkle Bänder (Hero / Kampf / Commander-Header)
```
radial:  #1b2c57 → #0c1636 → #070d22   (Standard-Dunkel)
battle:  #2a1f3e → #160f26 → #0a0712   (Kampf, violett-dunkel)
grid-overlay: rgba(150,180,250,.06)     (feines Karten-Raster)
```

---

## Typografie
```
Display/Body:  Outfit        (300,400,500,600,700,800,900)
Zahlen/Mono:   Space Grotesk (400,500,600,700)   ← Ressourcen, Würfel, Stats, Uhrzeit
```
Skala (px): Hero 30-40 / Screen-Titel 22-25 / Sektion 15-18 / Body 13.5-15.5 / Caption 11-12.5 / Micro-Label 9.5-11 (uppercase, letter-spacing 1.5-2.5).
Gewichte: Titel 800-900, Buttons/Labels 700-800, Body 400-500.
letter-spacing: große Titel negativ (-.4 bis -1.5px), Micro-Labels positiv (+1.5 bis +2.5px, uppercase).

---

## Radien
```
pill     999px   (Chips, Toggles, kleine Buttons)
card     16-22px (Karten, Sheets oben)
chip     8-13px  (Icon-Container, kleine Felder)
button   14-15px (Primär-Buttons)
```

## Schatten (weich, niedrige Deckkraft, farbig bei Aktion)
```
card     0 2px 12px -8px rgba(20,18,16,.14)
float    0 8px 24px -12px rgba(8,14,40,.30)
sheet    0 -20px 60px -20px rgba(0,0,0,.45)
button   0 14px 32px -10px <systemfarbe @ .6>     ← farbiger „Glow" unter Primär-Buttons
modal    0 30px 70px -20px rgba(0,0,0,.6)
```

## Abstände
Screen-Rand 16-20px · Karten-Innen 14-26px · Element-Gap 8-13px · Sektion-Gap 18-32px.
Touch-Targets ≥ 44px.

## Statusleisten-/Nav-Maße (aus Prototyp)
Statusbar-Höhe 46px · Bottom-Nav Padding `9px 10px 22px` · Sheet-Griff 42×5px Pille.

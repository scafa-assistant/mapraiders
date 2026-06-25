# 03 , Sound & Haptik Kit

Komplette, synthetisierte Sound-Bank aus dem Prototyp , **exakte Frequenzen/Timings**, plus Übersetzung nach React Native (Expo). Sound und Haptik sind **getrennt** schaltbar.

---

## A. Die Sound-Bank (exakt aus dem Prototyp)

Jeder Sound besteht aus einem oder mehreren Oszillator-Tönen: `tone(freq, startOffset, dauer, wellenform, peakGain)`. Master-Gain = 0.5.

| Name | Töne (freq Hz, t0 s, dur s, typ, gain) | Charakter | Auslöser |
|---|---|---|---|
| `tick` | 520, 0, .05, square, .06 | kurzer Klick | Tap, Tab, Slider-Schritt, Würfel-Tick |
| `soft` | 330, 0, .12, sine, .10 · 494, +.04, .12, sine, .07 | weicher Zwei-Ton | Sheet/Menü öffnen |
| `build` | 170, 0, .16, square, .20 · 85, 0, .24, sine, .16 · 760, +.02, .05, square, .05 | satter „Thunk" | Gebäude gebaut |
| `victory` | 392/392/392 (.14 je, t=0/.13/.26) · 523 (+.44, .5) · 659 (+.7, .6), sawtooth, .15; je +Oktave square .035 | **Sieges-Fanfare** | Erobern, Kampf-Sieg, Schatz |
| `defeat` | 330,262,196 (je .34, t=0/.15/.30), sawtooth, .14 | absteigend | Kampf verloren |
| `clash` | 140, 0, .12, square, .22 · 2200, 0, .04, square, .06 | Aufprall | Würfel-Auflösung |
| `notify` | 660, 0, .12, sine, .13 · 880, +.1, .18, sine, .12 | Chime | Streifzug-Push |

**Referenz-Implementierung (Web, aus dem Prototyp , zum 1:1-Nachklang):**
```js
tone(ac,freq,t0,dur,type,peak){
  const o=ac.createOscillator(), g=ac.createGain();
  o.type=type||'sine'; o.frequency.setValueAtTime(freq,t0);
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.linearRampToValueAtTime(peak||0.18, t0+0.014);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0+dur+0.03);
}
```

---

## B. Umsetzung in der App (Expo)

Zwei Wege , Team wählt:

**Weg 1 (empfohlen, am einfachsten): echte Audio-Dateien.** Die 7 Sounds einmalig als kurze `.m4a`/`.wav` rendern (die Tabelle oben ist die exakte Vorlage; ein Audio-Designer oder ein kurzes Web-Audio-Render-Script erzeugt sie) und mit **`expo-av`** abspielen. Vorteil: konsistent über alle Geräte, kein Audio-Glitch.

**Weg 2: zur Laufzeit synthetisieren.** Nur falls gewünscht , aufwändiger auf RN (kein natives Web-Audio). In der Regel nicht nötig.

**Zentrale Helper-Datei `feedback.ts` (Skizze):**
```ts
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

let soundOn = true, hapticOn = true;            // aus Settings laden
const sounds: Record<string, Audio.Sound> = {}; // beim Start preload

export async function preload() {
  const map = { tick:require('../assets/sfx/tick.m4a'), soft:require('../assets/sfx/soft.m4a'),
    build:require('../assets/sfx/build.m4a'), victory:require('../assets/sfx/victory.m4a'),
    defeat:require('../assets/sfx/defeat.m4a'), clash:require('../assets/sfx/clash.m4a'),
    notify:require('../assets/sfx/notify.m4a') };
  for (const k in map){ const { sound } = await Audio.Sound.createAsync(map[k]); sounds[k]=sound; }
}
export function setSound(v:boolean){ soundOn=v; AsyncStorage.setItem('fx_sound', v?'1':'0'); }
export function setHaptic(v:boolean){ hapticOn=v; AsyncStorage.setItem('fx_haptic', v?'1':'0'); }

function sfx(name:string){ if(!soundOn||!sounds[name]) return; sounds[name].replayAsync(); }

export const feedback = {
  tick(){ sfx('tick'); if(hapticOn) Haptics.selectionAsync(); },
  soft(){ sfx('soft'); if(hapticOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
  build(){ sfx('build'); if(hapticOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
  victory(){ sfx('victory'); if(hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
  defeat(){ sfx('defeat'); if(hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); },
  clash(){ sfx('clash'); if(hapticOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); },
  notify(){ sfx('notify'); if(hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); },
};
```

---

## C. Haptik-Map (Web-Muster → Expo)

| Moment | Web `navigator.vibrate` | Expo |
|---|---|---|
| Erfolg (Erobern/Sieg/Schatz) | `[0,35,45,90]` | `notificationAsync(Success)` |
| Bestätigung (Bauen/Rekrut) | `28-30` | `impactAsync(Medium)` |
| Benachrichtigung (Push) | `[0,18,50,18]` | `notificationAsync(Warning)` |
| Fehlschlag (Niederlage) | `[0,130]` | `notificationAsync(Error)` |
| Tap (Tabs/Slider/Menü) | `6-12` | `selectionAsync()` / `impactAsync(Light)` |

---

## D. Trigger-Verdrahtung (an bestehende Handler hängen)

| Bestehende Aktion | Aufruf |
|---|---|
| Territorium beansprucht | `feedback.victory()` |
| Gebäude gebaut | `feedback.build()` |
| Kampf aufgelöst | `feedback.clash()` → nach ~360ms `victory()`/`defeat()` |
| Streifzug-/Push-Encounter erscheint | `feedback.notify()` |
| Bottom-Sheet/Modal öffnen | `feedback.soft()` |
| Tab-Wechsel, primärer Tap, Slider-Schritt, Coachmark „Weiter" | `feedback.tick()` |

---

## E. Settings (Pflicht , wie im Prototyp)
Zwei **getrennte** Schalter: **Sound** und **Haptik**. Plus „Reduzierte Bewegung" (koppelt an Motion, siehe `02`). Werte persistent (AsyncStorage), beim Start laden. Sound aus darf Haptik nicht abschalten und umgekehrt.

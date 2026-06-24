import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Vibration, Platform } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

/**
 * FX service: the "juice" layer. Synthesized SFX + haptics for the core game
 * interactions (claim, build, battle, streifzug, taps). Mirrors the prototype
 * trigger table (game/HYPERMOTION_SOUND_BRIEFING.md).
 *
 * Sound and haptics are independently gated by user settings
 * (settings.soundEffects / settings.hapticFeedback). Every call is wrapped so a
 * failure never interrupts gameplay. SFX assets live in assets/sfx/*.wav.
 */

export type SfxName =
  | 'victory'
  | 'build'
  | 'clash'
  | 'defeat'
  | 'notify'
  | 'soft'
  | 'tick';

// Static requires so Metro bundles the assets.
const SOURCES: Record<SfxName, number> = {
  victory: require('../../assets/sfx/victory.wav'),
  build: require('../../assets/sfx/build.wav'),
  clash: require('../../assets/sfx/clash.wav'),
  defeat: require('../../assets/sfx/defeat.wav'),
  notify: require('../../assets/sfx/notify.wav'),
  soft: require('../../assets/sfx/soft.wav'),
  tick: require('../../assets/sfx/tick.wav'),
};

class FxService {
  private sounds: Partial<Record<SfxName, Audio.Sound>> = {};
  private loaded = false;
  private loading: Promise<void> | null = null;

  private soundOn(): boolean {
    return useSettingsStore.getState().settings.soundEffects !== false;
  }

  private hapticOn(): boolean {
    return useSettingsStore.getState().settings.hapticFeedback !== false;
  }

  /** Preload all SFX into memory. Safe to call multiple times. */
  async preload(): Promise<void> {
    if (this.loaded) return;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        // Short SFX should play even in iOS silent mode and not duck music hard.
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          staysActiveInBackground: false,
        }).catch(() => {});
        const names = Object.keys(SOURCES) as SfxName[];
        await Promise.all(
          names.map(async (name) => {
            try {
              const { sound } = await Audio.Sound.createAsync(SOURCES[name], {
                volume: 0.9,
              });
              this.sounds[name] = sound;
            } catch {
              // a single missing sound must not break the rest
            }
          })
        );
        this.loaded = true;
      } catch {
        // ignore; sound simply stays silent
      }
    })();
    return this.loading;
  }

  /** Play one SFX by name (no-op if sound disabled). */
  async sound(name: SfxName): Promise<void> {
    if (!this.soundOn()) return;
    try {
      if (!this.loaded) await this.preload();
      const s = this.sounds[name];
      if (s) await s.replayAsync();
    } catch {
      // ignore playback errors
    }
  }

  // ─── Haptic primitives ──────────────────────────────────────────────────
  private impact(style: Haptics.ImpactFeedbackStyle): void {
    if (!this.hapticOn()) return;
    try {
      Haptics.impactAsync(style);
    } catch {
      // ignore
    }
  }

  private selection(): void {
    if (!this.hapticOn()) return;
    try {
      Haptics.selectionAsync();
    } catch {
      // ignore
    }
  }

  /**
   * Platform-aware notification haptic. iOS uses the native notification
   * feedback generator; Android replays a vibration pattern (richer than a
   * single buzz). Mirrors the prototype patterns.
   */
  private notify(type: 'success' | 'warning' | 'error', androidPattern: number[]): void {
    if (!this.hapticOn()) return;
    try {
      if (Platform.OS === 'ios') {
        const map = {
          success: Haptics.NotificationFeedbackType.Success,
          warning: Haptics.NotificationFeedbackType.Warning,
          error: Haptics.NotificationFeedbackType.Error,
        } as const;
        Haptics.notificationAsync(map[type]);
      } else {
        Vibration.vibrate(androidPattern);
      }
    } catch {
      // ignore
    }
  }

  // ─── Combined triggers (briefing table) ─────────────────────────────────
  /** Achievement: territory claimed, battle won, streifzug treasure. */
  victory(): void {
    this.sound('victory');
    this.notify('success', [0, 35, 45, 90]);
  }

  /** Building placed. */
  buildFx(): void {
    this.sound('build');
    this.impact(Haptics.ImpactFeedbackStyle.Medium);
  }

  /** Battle resolution impact (dice clash). */
  clash(): void {
    this.sound('clash');
    this.impact(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /** Battle lost. */
  defeat(): void {
    this.sound('defeat');
    this.notify('error', [0, 130]);
  }

  /** Streifzug push encounter appears. */
  notifyFx(): void {
    this.sound('notify');
    this.notify('warning', [0, 18, 50, 18]);
  }

  /** Sheet/menu open, streifzug start. */
  soft(): void {
    this.sound('soft');
    this.impact(Haptics.ImpactFeedbackStyle.Light);
  }

  /** Light tap: tab switch, slider step, coachmark next, dice rattle. */
  tick(): void {
    this.sound('tick');
    this.selection();
  }

  /** Confirmation buzz only (recruit, small confirm) without sound. */
  confirm(): void {
    this.impact(Haptics.ImpactFeedbackStyle.Medium);
  }

  /** Release all loaded sounds (e.g. on logout). */
  async unload(): Promise<void> {
    const all = Object.values(this.sounds);
    this.sounds = {};
    this.loaded = false;
    this.loading = null;
    for (const s of all) {
      try {
        await s?.unloadAsync();
      } catch {
        // ignore
      }
    }
  }
}

export const fx = new FxService();

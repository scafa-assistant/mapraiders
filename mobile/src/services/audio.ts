import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { AUDIO_CONFIG } from '../utils/constants';

export class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private recordingStartTime: number = 0;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private onMaxDurationReached: (() => void) | null = null;

  /**
   * Configure audio session for recording and playback.
   */
  private async configureAudioSession(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
  }

  /**
   * Configure audio session for playback only.
   */
  private async configurePlaybackSession(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });
  }

  /**
   * Request microphone permission.
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      return granted;
    } catch (error) {
      console.error('[AudioService] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Start audio recording. Max duration is enforced by AUDIO_CONFIG.maxRecordingDurationMs.
   * Optionally provide an onMaxDuration callback that fires when max length is hit.
   */
  async startRecording(onMaxDuration?: () => void): Promise<void> {
    try {
      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      await this.configureAudioSession();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.recordingStartTime = Date.now();
      this.onMaxDurationReached = onMaxDuration ?? null;

      // Auto-stop after max duration
      this.maxDurationTimer = setTimeout(async () => {
        if (this.recording) {
          this.onMaxDurationReached?.();
          await this.stopRecording();
        }
      }, AUDIO_CONFIG.maxRecordingDurationMs);
    } catch (error) {
      console.error('[AudioService] startRecording failed:', error);
      this.recording = null;
      throw error;
    }
  }

  /**
   * Stop recording and return the local file URI, or null if no recording was active.
   */
  async stopRecording(): Promise<string | null> {
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    if (!this.recording) {
      return null;
    }

    try {
      const status = await this.recording.getStatusAsync();
      if (status.isRecording) {
        await this.recording.stopAndUnloadAsync();
      }

      const uri = this.recording.getURI();
      this.recording = null;
      this.recordingStartTime = 0;

      return uri;
    } catch (error) {
      console.error('[AudioService] stopRecording failed:', error);
      this.recording = null;
      this.recordingStartTime = 0;
      return null;
    }
  }

  /**
   * Get the duration of the current recording in milliseconds.
   */
  getRecordingDuration(): number {
    if (!this.recording || this.recordingStartTime === 0) return 0;
    return Date.now() - this.recordingStartTime;
  }

  /**
   * Whether currently recording.
   */
  get isRecording(): boolean {
    return this.recording !== null;
  }

  /**
   * Play audio from a URL or local file URI.
   */
  async play(uri: string, onFinished?: () => void): Promise<void> {
    try {
      // Stop any existing playback
      await this.stop();

      await this.configurePlaybackSession();

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            onFinished?.();
          }
        }
      );

      this.sound = sound;
    } catch (error) {
      console.error('[AudioService] play failed:', error);
      throw error;
    }
  }

  /**
   * Stop current audio playback.
   */
  async stop(): Promise<void> {
    if (this.sound) {
      try {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          await this.sound.stopAsync();
          await this.sound.unloadAsync();
        }
      } catch (error) {
        console.error('[AudioService] stop failed:', error);
      }
      this.sound = null;
    }
  }

  /**
   * Pause current playback.
   */
  async pause(): Promise<void> {
    if (this.sound) {
      try {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await this.sound.pauseAsync();
        }
      } catch (error) {
        console.error('[AudioService] pause failed:', error);
      }
    }
  }

  /**
   * Resume paused playback.
   */
  async resume(): Promise<void> {
    if (this.sound) {
      try {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await this.sound.playAsync();
        }
      } catch (error) {
        console.error('[AudioService] resume failed:', error);
      }
    }
  }

  /**
   * Set playback volume (0.0 to 1.0). Useful for proximity-based fade.
   */
  async setVolume(volume: number): Promise<void> {
    if (this.sound) {
      try {
        const clamped = Math.max(0, Math.min(1, volume));
        await this.sound.setVolumeAsync(clamped);
      } catch (error) {
        console.error('[AudioService] setVolume failed:', error);
      }
    }
  }

  /**
   * Get current playback position in ms.
   */
  async getPlaybackPosition(): Promise<number> {
    if (!this.sound) return 0;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        return status.positionMillis;
      }
    } catch {
      // ignore
    }
    return 0;
  }

  /**
   * Clean up all audio resources.
   */
  async cleanup(): Promise<void> {
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    if (this.recording) {
      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          await this.recording.stopAndUnloadAsync();
        }
      } catch {
        // ignore errors during cleanup
      }
      this.recording = null;
    }

    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch {
        // ignore errors during cleanup
      }
      this.sound = null;
    }

    this.recordingStartTime = 0;
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

export const audioService = new AudioService();

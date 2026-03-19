// ============================================================
// AI Verification Service
// Photo, video, and audio verification for quest step completion.
// Currently uses stub implementations with clear interfaces
// ready for real AI integration (Google Cloud Vision, OpenAI Vision).
// ============================================================

export interface PhotoVerificationResult {
  valid: boolean;
  confidence: number;
  checks: {
    exifPresent: boolean;
    locationMatch: boolean;
    contentAppropriate: boolean;
    notDuplicate: boolean;
    matchesDescription: boolean;
  };
  rejectionReason?: string;
}

export interface VideoVerificationResult {
  valid: boolean;
  confidence: number;
  checks: {
    durationSufficient: boolean;
    locationConsistent: boolean;
    contentAppropriate: boolean;
    activityDetected: boolean;
  };
  rejectionReason?: string;
}

export interface AudioVerificationResult {
  valid: boolean;
  confidence: number;
  checks: {
    hasAudio: boolean;
    durationValid: boolean;
    notSilence: boolean;
    contentAppropriate: boolean;
  };
  rejectionReason?: string;
}

class AIVerificationService {
  /**
   * Verify a photo for quest step completion.
   * STUB: Currently does basic URL validation and EXIF check.
   * TODO: Integrate Google Cloud Vision or OpenAI Vision API.
   */
  async verifyPhoto(
    photoUrl: string,
    expectedLocation: { lat: number; lng: number },
    description?: string
  ): Promise<PhotoVerificationResult> {
    // Basic validation
    const hasUrl = !!photoUrl && (photoUrl.startsWith('http') || photoUrl.startsWith('/'));

    // STUB: In production, this would:
    // 1. Download the image
    // 2. Extract EXIF GPS data and compare to expectedLocation
    // 3. Run SafeSearch/NSFW detection
    // 4. Check image hash for duplicates
    // 5. Use Vision API to verify image matches description

    return {
      valid: hasUrl,
      confidence: hasUrl ? 0.7 : 0,
      checks: {
        exifPresent: false, // TODO: Extract EXIF from image
        locationMatch: true, // TODO: Compare EXIF GPS to expected
        contentAppropriate: true, // TODO: SafeSearch API
        notDuplicate: true, // TODO: perceptual hash comparison
        matchesDescription: true, // TODO: Vision API scene detection
      },
      rejectionReason: hasUrl ? undefined : 'No valid photo URL provided',
    };
  }

  /**
   * Verify a video for quest step completion.
   * STUB: Currently does basic URL validation.
   * TODO: Integrate video analysis (frame sampling, duration check, metadata).
   */
  async verifyVideo(
    videoUrl: string,
    expectedLocation: { lat: number; lng: number },
    minDurationSec: number = 5
  ): Promise<VideoVerificationResult> {
    const hasUrl = !!videoUrl && (videoUrl.startsWith('http') || videoUrl.startsWith('/'));

    return {
      valid: hasUrl,
      confidence: hasUrl ? 0.6 : 0,
      checks: {
        durationSufficient: true, // TODO: Extract video duration
        locationConsistent: true, // TODO: Check metadata
        contentAppropriate: true, // TODO: Frame sampling + SafeSearch
        activityDetected: true, // TODO: Pose/motion detection
      },
      rejectionReason: hasUrl ? undefined : 'No valid video URL provided',
    };
  }

  /**
   * Verify an audio clip for quest step completion.
   * STUB: Currently does basic URL validation.
   * TODO: Integrate audio analysis (duration, amplitude, speech-to-text).
   */
  async verifyAudio(
    audioUrl: string,
    minDurationSec: number = 1,
    maxDurationSec: number = 30
  ): Promise<AudioVerificationResult> {
    const hasUrl = !!audioUrl && (audioUrl.startsWith('http') || audioUrl.startsWith('/'));

    return {
      valid: hasUrl,
      confidence: hasUrl ? 0.7 : 0,
      checks: {
        hasAudio: hasUrl,
        durationValid: true, // TODO: Check audio duration
        notSilence: true, // TODO: Amplitude analysis
        contentAppropriate: true, // TODO: Speech-to-text + toxicity
      },
    };
  }
}

export const aiVerification = new AIVerificationService();

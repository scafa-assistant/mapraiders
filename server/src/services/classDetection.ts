// ============================================================
// Movement Class Detection Service
// Detects walker, runner, cyclist, skater, dog_walker, driver
// from GPS point data using speed analysis and motion patterns
// ============================================================

import { GpsPoint, MovementClass } from '../utils/types';
import { CLASS_SPEED_RANGES } from '../config/constants';
import { segmentSpeed, pathDistance, pathDuration } from '../utils/geo';

/** Score entry for class detection ranking */
interface ClassScore {
  class: MovementClass;
  score: number;
}

/**
 * Movement class detection engine.
 * Analyzes GPS tracks to determine whether the user is walking,
 * running, cycling, skating, walking a dog, or driving.
 */
export class ClassDetection {
  /**
   * Detect movement class from an array of GPS points.
   *
   * Algorithm:
   * 1. Compute segment speeds and aggregate statistics
   * 2. Score each class based on average speed fit, median speed fit,
   *    stop frequency, and speed variance heuristics
   * 3. Return the highest-scoring class
   *
   * @param points - Array of GPS points with timestamps
   * @returns The detected MovementClass
   */
  static detect(points: GpsPoint[]): MovementClass {
    if (points.length < 2) return 'walker';

    const speeds = ClassDetection.getSegmentSpeeds(points);
    if (speeds.length === 0) return 'walker';

    const avgSpeedMs = ClassDetection.getAverageSpeed(points);
    const avgSpeedKmh = avgSpeedMs * 3.6;
    const medianSpeed = ClassDetection.getMedianSpeed(speeds);
    const maxSpeed = Math.max(...speeds);
    const stopFrequency = ClassDetection.getStopFrequency(speeds);
    const speedVariance = ClassDetection.getSpeedVariance(points);

    // Quick speed-based classification (km/h)
    // < 8 -> walker, 8-20 -> runner, 20-40 -> cyclist or skater, > 40 -> driver
    // Then refine with pattern analysis

    const scores: ClassScore[] = [];

    for (const [className, range] of Object.entries(CLASS_SPEED_RANGES)) {
      const cls = className as MovementClass;
      let score = 0;

      // Score based on average speed fit within the range
      if (avgSpeedMs >= range.min && avgSpeedMs <= range.max) {
        const center = (range.min + range.max) / 2;
        const rangeWidth = range.max - range.min;
        const distFromCenter = Math.abs(avgSpeedMs - center) / (rangeWidth || 1);
        score += (1 - distFromCenter) * 40;
      } else {
        // Penalty for being out of range
        const distFromRange = avgSpeedMs < range.min
          ? (range.min - avgSpeedMs) / (range.min || 1)
          : (avgSpeedMs - range.max) / (range.max || 1);
        score -= distFromRange * 30;
      }

      // Score based on median speed (robust against outliers)
      if (medianSpeed >= range.min && medianSpeed <= range.max) {
        score += 20;
      }

      // Class-specific heuristics
      switch (cls) {
        case 'walker':
          if (stopFrequency > 0.2) score += 10;   // Walkers stop more
          if (speedVariance < 0.5) score += 5;     // Consistent pace
          if (avgSpeedKmh < 8) score += 10;        // Speed-based boost
          break;

        case 'dog_walker':
          if (stopFrequency > 0.3) score += 15;    // Dog walkers stop most often
          if (speedVariance > 0.3) score += 5;     // Variable speed (sniffing stops)
          if (avgSpeedKmh < 8) score += 5;
          break;

        case 'runner':
          if (speedVariance < 0.4) score += 10;    // Runners maintain pace
          if (stopFrequency < 0.1) score += 10;    // Rarely stop
          if (avgSpeedKmh >= 8 && avgSpeedKmh <= 20) score += 10;
          break;

        case 'cyclist':
          if (maxSpeed > 8) score += 10;           // Higher top speed
          if (stopFrequency < 0.15) score += 5;
          if (avgSpeedKmh >= 20 && avgSpeedKmh <= 40) score += 10;
          // Lower lateral variance than skater
          if (speedVariance < 0.4) score += 5;
          break;

        case 'skater':
          // Skaters have higher lateral movement variance and rhythmic patterns
          if (speedVariance > 0.2 && speedVariance < 0.6) score += 10;
          if (stopFrequency < 0.1) score += 5;
          if (avgSpeedKmh >= 20 && avgSpeedKmh <= 40) score += 5;
          // Higher variance distinguishes skater from cyclist
          if (speedVariance > 0.35) score += 10;
          break;

        case 'driver':
          if (maxSpeed > 15) score += 20;          // High top speed
          if (avgSpeedMs > 10) score += 15;        // Fast average
          if (avgSpeedKmh > 40) score += 15;
          break;
      }

      scores.push({ class: cls, score });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Safety: never auto-detect driver unless speed is genuinely high
    if (scores[0].class === 'driver' && avgSpeedMs < 10) {
      return scores[1]?.class || 'walker';
    }

    return scores[0].class;
  }

  /**
   * Validate a user-claimed class against detected movement patterns.
   * Allows manual override but flags implausible claims.
   *
   * @param claimed - The class the user claims to be using
   * @param points - The GPS track
   * @returns Validation result with detected class and confidence
   */
  static validateClass(
    claimed: MovementClass,
    points: GpsPoint[]
  ): { valid: boolean; detected: MovementClass; confidence: number } {
    const detected = ClassDetection.detect(points);

    if (points.length < 2) {
      return { valid: true, detected: 'walker', confidence: 0 };
    }

    const avgSpeed = ClassDetection.getAverageSpeed(points);
    const claimedRange = CLASS_SPEED_RANGES[claimed];
    const detectedRange = CLASS_SPEED_RANGES[detected];

    // Calculate confidence: how well does the detected class fit?
    const detectedCenter = (detectedRange.min + detectedRange.max) / 2;
    const detectedWidth = detectedRange.max - detectedRange.min;
    const distFromDetectedCenter = Math.abs(avgSpeed - detectedCenter) / (detectedWidth || 1);
    const confidence = Math.max(0, Math.min(1, 1 - distFromDetectedCenter));

    // Check if claimed class is plausible
    // Allow if average speed is within 50% tolerance of claimed range
    const tolerance = 0.5;
    const minAllowed = claimedRange.min * (1 - tolerance);
    const maxAllowed = claimedRange.max * (1 + tolerance);
    const valid = avgSpeed >= minAllowed && avgSpeed <= maxAllowed;

    return { valid, detected, confidence };
  }

  /**
   * Compute average speed across the entire route in m/s,
   * excluding stationary segments (speed < 0.3 m/s).
   *
   * @param points - GPS points
   * @returns Average moving speed in m/s
   */
  private static getAverageSpeed(points: GpsPoint[]): number {
    if (points.length < 2) return 0;
    const speeds = ClassDetection.getSegmentSpeeds(points);
    const moving = speeds.filter(s => s > 0.3);
    if (moving.length === 0) return 0;
    return moving.reduce((a, b) => a + b, 0) / moving.length;
  }

  /**
   * Compute the coefficient of variation of segment speeds.
   * Higher variance indicates less consistent movement (e.g., dog walker, skater).
   *
   * @param points - GPS points
   * @returns Coefficient of variation (stddev / mean)
   */
  private static getSpeedVariance(points: GpsPoint[]): number {
    const speeds = ClassDetection.getSegmentSpeeds(points);
    const moving = speeds.filter(s => s > 0.3);
    if (moving.length === 0) return 0;
    const avg = moving.reduce((a, b) => a + b, 0) / moving.length;
    if (avg === 0) return 0;
    const variance = moving.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / moving.length;
    return Math.sqrt(variance) / avg;
  }

  /**
   * Compute speed for each consecutive segment.
   */
  private static getSegmentSpeeds(points: GpsPoint[]): number[] {
    const speeds: number[] = [];
    for (let i = 1; i < points.length; i++) {
      speeds.push(segmentSpeed(points[i - 1], points[i]));
    }
    return speeds;
  }

  /**
   * Compute median speed from an array of speeds.
   */
  private static getMedianSpeed(speeds: number[]): number {
    if (speeds.length === 0) return 0;
    const sorted = [...speeds].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Fraction of segments where the user is effectively stopped (< 0.3 m/s).
   */
  private static getStopFrequency(speeds: number[]): number {
    if (speeds.length === 0) return 0;
    const stops = speeds.filter(s => s < 0.3).length;
    return stops / speeds.length;
  }
}

// Legacy functional export for backward compatibility
export function detectMovementClass(points: GpsPoint[]): MovementClass {
  return ClassDetection.detect(points);
}

export const classDetection = new ClassDetection();

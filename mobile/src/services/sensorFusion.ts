// ============================================================
// Sensor Fusion Service
// Collects accelerometer and gyroscope data to supplement
// GPS-based movement class detection. Provides analysis of
// motion patterns (bounce, smoothness, step frequency).
// ============================================================

import { Accelerometer, Gyroscope } from 'expo-sensors';

interface SensorSnapshot {
  timestamp: number;
  accelerometer: { x: number; y: number; z: number } | null;
  gyroscope: { x: number; y: number; z: number } | null;
}

export interface SensorAnalysis {
  avgAccelMagnitude: number;  // Higher for running/cycling
  accelVariance: number;      // Higher for walking/running (bouncy)
  gyroVariance: number;       // Higher for skating (twisting)
  stepFrequency: number;      // Steps per second estimate
  isSmooth: boolean;          // True for cycling/driving (less bounce)
  sampleCount: number;
}

class SensorFusionService {
  private accelData: { x: number; y: number; z: number }[] = [];
  private gyroData: { x: number; y: number; z: number }[] = [];
  private accelSub: any = null;
  private gyroSub: any = null;
  private isActive = false;

  async start(): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;
    this.accelData = [];
    this.gyroData = [];

    // Set update interval (100ms = 10Hz, good balance of data/battery)
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    this.accelSub = Accelerometer.addListener((data) => {
      if (this.accelData.length < 5000) { // Cap at 5000 samples (~8 min)
        this.accelData.push(data);
      }
    });

    this.gyroSub = Gyroscope.addListener((data) => {
      if (this.gyroData.length < 5000) {
        this.gyroData.push(data);
      }
    });
  }

  stop(): void {
    this.isActive = false;
    this.accelSub?.remove();
    this.gyroSub?.remove();
    this.accelSub = null;
    this.gyroSub = null;
  }

  /**
   * Analyze collected sensor data to help classify movement.
   * Returns characteristics that the server can use.
   */
  getAnalysis(): SensorAnalysis {
    if (this.accelData.length < 10) {
      return {
        avgAccelMagnitude: 0,
        accelVariance: 0,
        gyroVariance: 0,
        stepFrequency: 0,
        isSmooth: true,
        sampleCount: 0,
      };
    }

    // Calculate accelerometer magnitude (remove gravity ~9.81)
    const magnitudes = this.accelData.map((a) =>
      Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
    );

    const avgMag = magnitudes.reduce((s, m) => s + m, 0) / magnitudes.length;

    // Variance of magnitude (bouncy motion detection)
    const accelVar =
      magnitudes.reduce((s, m) => s + (m - avgMag) ** 2, 0) / magnitudes.length;

    // Gyroscope variance (rotational motion)
    let gyroVar = 0;
    if (this.gyroData.length > 0) {
      const gyroMags = this.gyroData.map((g) =>
        Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z)
      );
      const avgGyro = gyroMags.reduce((s, m) => s + m, 0) / gyroMags.length;
      gyroVar =
        gyroMags.reduce((s, m) => s + (m - avgGyro) ** 2, 0) / gyroMags.length;
    }

    // Estimate step frequency using zero-crossings of vertical acceleration
    const detrended = magnitudes.map((m) => m - avgMag);
    let zeroCrossings = 0;
    for (let i = 1; i < detrended.length; i++) {
      if ((detrended[i] >= 0) !== (detrended[i - 1] >= 0)) zeroCrossings++;
    }
    const durationSec = this.accelData.length * 0.1; // 10Hz
    const stepFreq = (zeroCrossings / 2) / durationSec; // ~2 steps per cycle

    return {
      avgAccelMagnitude: avgMag,
      accelVariance: accelVar,
      gyroVariance: gyroVar,
      stepFrequency: stepFreq,
      isSmooth: accelVar < 2.0, // Low variance = smooth (cycling/driving)
      sampleCount: this.accelData.length,
    };
  }

  reset(): void {
    this.accelData = [];
    this.gyroData = [];
  }
}

export const sensorFusion = new SensorFusionService();

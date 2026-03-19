// ============================================================
// Weather Service
// Uses Open-Meteo API (free, no key required)
// Caches per 0.1-degree grid cell with 15-minute TTL
// ============================================================

import { WeatherCondition, WeatherData } from '../utils/types';
import {
  WEATHER_MULTIPLIERS,
  WEATHER_TEMP_COLD_THRESHOLD,
  WEATHER_TEMP_HEAT_THRESHOLD,
  WEATHER_CACHE_MINUTES,
} from '../config/constants';
import { cacheGet, cacheSet } from '../config/redis';

/**
 * Open-Meteo WMO weather interpretation codes mapped to our conditions.
 * @see https://open-meteo.com/en/docs
 */
const WMO_CODES: Record<number, WeatherCondition> = {
  0: 'clear',       // Clear sky
  1: 'clear',       // Mainly clear
  2: 'clear',       // Partly cloudy
  3: 'clear',       // Overcast
  45: 'clear',      // Foggy
  48: 'clear',      // Depositing rime fog
  51: 'light_rain', // Drizzle: light
  53: 'light_rain', // Drizzle: moderate
  55: 'light_rain', // Drizzle: dense
  56: 'light_rain', // Freezing drizzle: light
  57: 'light_rain', // Freezing drizzle: dense
  61: 'light_rain', // Rain: slight
  63: 'heavy_rain', // Rain: moderate
  65: 'heavy_rain', // Rain: heavy
  66: 'heavy_rain', // Freezing rain: light
  67: 'heavy_rain', // Freezing rain: heavy
  71: 'snow',       // Snowfall: slight
  73: 'snow',       // Snowfall: moderate
  75: 'snow',       // Snowfall: heavy
  77: 'snow',       // Snow grains
  80: 'light_rain', // Rain showers: slight
  81: 'heavy_rain', // Rain showers: moderate
  82: 'heavy_rain', // Rain showers: violent
  85: 'snow',       // Snow showers: slight
  86: 'snow',       // Snow showers: heavy
  95: 'storm',      // Thunderstorm
  96: 'storm',      // Thunderstorm with slight hail
  99: 'storm',      // Thunderstorm with heavy hail
};

/**
 * In-memory fallback cache for when Redis is unavailable.
 */
const memoryCache = new Map<string, { data: WeatherData; fetchedAt: number }>();
const MEMORY_CACHE_TTL_MS = WEATHER_CACHE_MINUTES * 60 * 1000;

/**
 * Weather service that integrates with Open-Meteo for real-time
 * weather data and calculates game bonus multipliers.
 */
export class WeatherService {
  /**
   * Get weather data for a GPS location.
   * Rounds coordinates to a 0.1-degree grid (~11km) for cache efficiency.
   * Uses Redis cache with a 15-minute TTL, falling back to in-memory cache.
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Weather data including condition, temperature, and bonus multiplier
   */
  async getWeather(lat: number, lng: number): Promise<WeatherData> {
    // Round to 0.1-degree grid for caching
    const roundedLat = Math.round(lat * 10) / 10;
    const roundedLng = Math.round(lng * 10) / 10;
    const cacheKey = `weather:${roundedLat}:${roundedLng}`;

    // Try Redis cache first
    try {
      const cached = await cacheGet<WeatherData>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // Redis unavailable; try memory cache
    }

    // Try in-memory cache
    const memEntry = memoryCache.get(cacheKey);
    if (memEntry && (Date.now() - memEntry.fetchedAt) < MEMORY_CACHE_TTL_MS) {
      return memEntry.data;
    }

    // Fetch from Open-Meteo
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLng}&current=temperature_2m,rain,snowfall,wind_speed_10m,weather_code`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[Weather] API returned HTTP ${response.status}`);
        return WeatherService.defaultWeather();
      }

      const json = await response.json() as any;
      const current = json.current;

      if (!current) {
        console.warn('[Weather] No current data in API response');
        return WeatherService.defaultWeather();
      }

      const temperature: number = current.temperature_2m ?? 20;
      const weatherCode: number = current.weather_code ?? 0;
      const rain: number = current.rain ?? 0;
      const snowfall: number = current.snowfall ?? 0;
      const windSpeed: number = current.wind_speed_10m ?? 0;

      // Determine base condition from WMO code
      let condition: WeatherCondition = WMO_CODES[weatherCode] || 'clear';

      // Override with temperature extremes (take the maximum bonus)
      if (temperature < WEATHER_TEMP_COLD_THRESHOLD) {
        condition = 'cold';
      } else if (temperature > WEATHER_TEMP_HEAT_THRESHOLD) {
        condition = 'heat';
      }

      // Calculate bonus: use the MAXIMUM applicable bonus, no stacking
      const bonus = WeatherService.calculateBonus({
        condition,
        temperature,
        wind_speed: windSpeed,
        rain_mm: rain,
        snow: snowfall > 0,
        weather_code: weatherCode,
        bonus: 1.0,
        cached_at: Date.now(),
      }, rain, snowfall, windSpeed);

      const data: WeatherData = {
        condition,
        temperature,
        wind_speed: windSpeed,
        rain_mm: rain,
        snow: snowfall > 0,
        weather_code: weatherCode,
        bonus,
        cached_at: Date.now(),
      };

      // Store in Redis (15-min TTL)
      try {
        await cacheSet(cacheKey, data, WEATHER_CACHE_MINUTES * 60);
      } catch {
        // Redis write failure is non-critical
      }

      // Also store in memory cache as fallback
      memoryCache.set(cacheKey, { data, fetchedAt: Date.now() });

      // Prune memory cache if it grows too large
      if (memoryCache.size > 1000) {
        const now = Date.now();
        for (const [key, entry] of memoryCache) {
          if (now - entry.fetchedAt > MEMORY_CACHE_TTL_MS) {
            memoryCache.delete(key);
          }
        }
      }

      return data;
    } catch (err) {
      console.warn('[Weather] Failed to fetch weather data:', err);
      return WeatherService.defaultWeather();
    }
  }

  /**
   * Calculate the weather bonus multiplier from weather parameters.
   * Takes the MAXIMUM applicable bonus -- bonuses do not stack.
   *
   * Rules:
   * - rain > 0 && < 5mm: 1.3 (light rain)
   * - rain >= 5mm: 1.5 (heavy rain)
   * - snow > 0: 1.5
   * - wind > 50 km/h: 2.0 (storm)
   * - temp < -5C: 1.8 (cold)
   * - temp > 35C: 1.5 (heat)
   * - otherwise: use the condition-based multiplier
   *
   * @param weather - Weather data
   * @param rain - Rain amount in mm (optional, from API)
   * @param snowfall - Snowfall in cm (optional, from API)
   * @param windSpeed - Wind speed in km/h (optional, from API)
   * @returns The maximum applicable bonus multiplier
   */
  static calculateBonus(
    weather: WeatherData,
    rain: number = 0,
    snowfall: number = 0,
    windSpeed: number = 0
  ): number {
    const candidates: number[] = [1.0]; // baseline

    // Rain bonuses
    if (rain > 0 && rain < 5) {
      candidates.push(1.3);
    }
    if (rain >= 5) {
      candidates.push(1.5);
    }

    // Snow bonus
    if (snowfall > 0) {
      candidates.push(1.5);
    }

    // Wind/storm bonus
    if (windSpeed > 50) {
      candidates.push(2.0);
    }

    // Temperature bonuses
    if (weather.temperature < WEATHER_TEMP_COLD_THRESHOLD) {
      candidates.push(1.8);
    }
    if (weather.temperature > WEATHER_TEMP_HEAT_THRESHOLD) {
      candidates.push(1.5);
    }

    // Condition-based multiplier from constants
    const conditionMultiplier = WEATHER_MULTIPLIERS[weather.condition ?? 'clear'] ?? 1.0;
    candidates.push(conditionMultiplier);

    // Return the maximum (no stacking)
    return Math.max(...candidates);
  }

  /**
   * Returns a default clear-weather result for when the API is unavailable.
   */
  private static defaultWeather(): WeatherData {
    return {
      condition: 'clear',
      temperature: 20,
      wind_speed: 0,
      rain_mm: 0,
      snow: false,
      weather_code: 0,
      bonus: 1.0,
      cached_at: Date.now(),
    };
  }
}

// ---- Legacy functional exports for backward compatibility ----

const weatherServiceInstance = new WeatherService();

/**
 * @deprecated Use weatherService.getWeather() instead
 */
export async function getWeatherAtLocation(lat: number, lng: number): Promise<WeatherData> {
  return weatherServiceInstance.getWeather(lat, lng);
}

/**
 * @deprecated Use weatherService.getWeather() instead
 */
export async function getWeatherBonus(lat: number, lng: number): Promise<number> {
  const weather = await weatherServiceInstance.getWeather(lat, lng);
  return weather.bonus;
}

export const weatherService = weatherServiceInstance;

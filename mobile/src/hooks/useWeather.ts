import { useState, useEffect, useCallback, useRef } from 'react';
import { weatherApi } from '../services/api';
import type { WeatherData, WeatherBonus } from '../utils/types';

interface UseWeatherReturn {
  /** Current weather data, or null if not yet loaded. */
  weather: WeatherData | null;
  /** Weather-based XP bonus information. */
  bonus: WeatherBonus | null;
  /** Whether weather data is loading. */
  isLoading: boolean;
  /** Error message, if any. */
  error: string | null;
  /** Manually refresh weather data. */
  refresh: () => Promise<void>;
}

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Determine XP bonus based on weather condition.
 * Harsh weather rewards brave explorers with XP multipliers.
 */
function calculateWeatherBonus(weather: WeatherData): WeatherBonus {
  switch (weather.condition) {
    case 'rain':
      return { multiplier: 1.25, label: 'Rain Bonus +25%' };
    case 'snow':
      return { multiplier: 1.5, label: 'Snow Bonus +50%' };
    case 'storm':
      return { multiplier: 1.75, label: 'Storm Bonus +75%' };
    case 'fog':
      return { multiplier: 1.15, label: 'Fog Bonus +15%' };
    case 'wind':
      return { multiplier: 1.1, label: 'Wind Bonus +10%' };
    case 'clear':
    default:
      return { multiplier: 1.0, label: 'Clear Skies' };
  }
}

/**
 * Hook to fetch and cache current weather for a given location.
 * Auto-refreshes every 15 minutes.
 */
export function useWeather(lat?: number, lng?: number): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [bonus, setBonus] = useState<WeatherBonus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWeather = useCallback(async () => {
    if (lat === undefined || lng === undefined) return;

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await weatherApi.getCurrent(lat, lng);

      const weatherData: WeatherData = {
        condition: data.condition ?? 'clear',
        temperature: data.temperature ?? 0,
        description: data.description ?? '',
        icon: data.icon ?? 'sunny-outline',
      };

      setWeather(weatherData);
      setBonus(calculateWeatherBonus(weatherData));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load weather';
      setError(message);
      // On error, default to clear weather so the app still functions
      if (!weather) {
        const defaultWeather: WeatherData = {
          condition: 'clear',
          temperature: 20,
          description: 'Weather unavailable',
          icon: 'sunny-outline',
        };
        setWeather(defaultWeather);
        setBonus(calculateWeatherBonus(defaultWeather));
      }
    } finally {
      setIsLoading(false);
    }
  }, [lat, lng, weather]);

  // Fetch on mount and when location changes significantly
  useEffect(() => {
    fetchWeather();

    // Set up auto-refresh interval
    intervalRef.current = setInterval(fetchWeather, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchWeather]);

  const refresh = useCallback(async () => {
    await fetchWeather();
  }, [fetchWeather]);

  return {
    weather,
    bonus,
    isLoading,
    error,
    refresh,
  };
}

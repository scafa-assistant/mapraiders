import { useState, useEffect, useCallback, useRef } from 'react';
import { territoryApi } from '../services/api';
import type { Territory, MapRegion } from '../utils/types';

interface UseTerritoryReturn {
  /** Territories visible in the current map region. */
  territories: Territory[];
  /** Territories owned by the current user. */
  myTerritories: Territory[];
  /** Whether territories are currently loading. */
  isLoading: boolean;
  /** Error message, if any. */
  error: string | null;
  /** Manually refresh territories for the current region. */
  refresh: () => Promise<void>;
  /** Fetch the current user's territories. */
  fetchMyTerritories: () => Promise<void>;
}

/**
 * Hook for territory data based on current map region.
 * Debounces API calls when region changes to avoid excessive requests.
 */
export function useTerritory(region?: MapRegion): UseTerritoryReturn {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [myTerritories, setMyTerritories] = useState<Territory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRegionRef = useRef<MapRegion | undefined>(undefined);

  /**
   * Convert a map region to a bounding box for the API.
   */
  const regionToBbox = useCallback(
    (r: MapRegion) => ({
      north: r.latitude + r.latitudeDelta / 2,
      south: r.latitude - r.latitudeDelta / 2,
      east: r.longitude + r.longitudeDelta / 2,
      west: r.longitude - r.longitudeDelta / 2,
    }),
    []
  );

  /**
   * Fetch territories in the given bounding box.
   */
  const fetchTerritories = useCallback(
    async (r: MapRegion) => {
      try {
        setIsLoading(true);
        setError(null);
        const bbox = regionToBbox(r);
        const { data } = await territoryApi.getInBounds(bbox);
        setTerritories(Array.isArray(data) ? data : data.territories ?? []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load territories';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [regionToBbox]
  );

  /**
   * Fetch current user's territories.
   */
  const fetchMyTerritories = useCallback(async () => {
    try {
      const { data } = await territoryApi.getMine();
      setMyTerritories(Array.isArray(data) ? data : data.territories ?? []);
    } catch (err: unknown) {
      console.warn('[useTerritory] Failed to fetch my territories:', err);
    }
  }, []);

  // Debounced fetch when region changes
  useEffect(() => {
    if (!region) return;

    // Check if region has changed meaningfully
    const prev = lastRegionRef.current;
    if (
      prev &&
      Math.abs(prev.latitude - region.latitude) < 0.0001 &&
      Math.abs(prev.longitude - region.longitude) < 0.0001 &&
      Math.abs(prev.latitudeDelta - region.latitudeDelta) < 0.001
    ) {
      return;
    }

    lastRegionRef.current = region;

    // Debounce 500ms
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchTerritories(region);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [region, fetchTerritories]);

  // Fetch my territories on mount
  useEffect(() => {
    fetchMyTerritories();
  }, [fetchMyTerritories]);

  const refresh = useCallback(async () => {
    if (lastRegionRef.current) {
      await fetchTerritories(lastRegionRef.current);
    }
    await fetchMyTerritories();
  }, [fetchTerritories, fetchMyTerritories]);

  return {
    territories,
    myTerritories,
    isLoading,
    error,
    refresh,
    fetchMyTerritories,
  };
}

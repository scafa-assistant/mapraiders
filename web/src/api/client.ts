// ============================================================
// Axios client + typed endpoint wrappers.
// - Base URL configurable via VITE_API_URL (dev fallback localhost:3000).
// - Auth token stored in localStorage, attached as Bearer header.
// - A 401 on any authenticated call clears the session and notifies a
//   registered handler so the app can drop back to the login screen.
// ============================================================

import axios, { AxiosError } from 'axios';
import type {
  ApiEnvelope,
  Building,
  BuildingType,
  ClientFeatureFlag,
  InventoryItem,
  LeaderboardEntry,
  LoginResponse,
  MeResponse,
  PveSpawn,
  ResourcesResponse,
  RunnerLevel,
  Territory,
  TerritoryDetail,
  TerminalLeaderboardResponse,
  TerminalStartResponse,
  TerminalSubmitBody,
  TerminalSubmitResponse,
} from './types';

const DEFAULT_PROD = 'https://api.mapraiders.com/api';
const DEFAULT_DEV = 'http://localhost:3000/api';

const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
export const API_BASE_URL =
  envUrl && envUrl.length > 0
    ? envUrl
    : import.meta.env.DEV
      ? DEFAULT_DEV
      : DEFAULT_PROD;

const TOKEN_KEY = 'mapraiders_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage unavailable (private mode) — token lives in memory only */
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the bearer token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — the app registers a callback to reset to login.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setStoredToken(null);
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  },
);

/**
 * Pull a human-readable message out of any axios/server error. The server
 * always answers with { success: false, message } so we surface that first.
 */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiEnvelope<unknown> | undefined;
    if (data?.message) return data.message;
    if (err.code === 'ECONNABORTED') return 'Request timed out';
    if (!err.response) return 'Cannot reach the server';
    return `Request failed (${err.response.status})`;
  }
  return fallback;
}

// ---- Endpoint wrappers -------------------------------------------------------

type BBox = { north: number; south: number; east: number; west: number };

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await api.post<ApiEnvelope<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Login failed');
    }
    return res.data.data;
  },
};

export const userApi = {
  async me(): Promise<MeResponse> {
    const res = await api.get<ApiEnvelope<MeResponse>>('/users/me');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to load profile');
    }
    return res.data.data;
  },
};

export const featureApi = {
  // Public endpoint. On 404 (old server) returns [] so the app keeps running.
  async getAll(): Promise<ClientFeatureFlag[]> {
    try {
      const res = await api.get<ApiEnvelope<{ features: ClientFeatureFlag[] }>>(
        '/features',
      );
      return res.data.data?.features ?? [];
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return [];
      // Any other failure: treat as "no flags" but do not break startup.
      return [];
    }
  },
};

export const territoryApi = {
  async getInBounds(bbox: BBox): Promise<Territory[]> {
    const res = await api.get<ApiEnvelope<{ territories: Territory[] }>>(
      '/territories',
      { params: bbox },
    );
    return res.data.data?.territories ?? [];
  },
  async getById(id: string): Promise<TerritoryDetail> {
    const res = await api.get<ApiEnvelope<TerritoryDetail>>(`/territories/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to load territory');
    }
    return res.data.data;
  },
};

export const resourceApi = {
  async get(): Promise<ResourcesResponse> {
    const res = await api.get<ApiEnvelope<ResourcesResponse>>('/resources');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to load resources');
    }
    return res.data.data;
  },
};

export const inventoryApi = {
  async getAll(): Promise<InventoryItem[]> {
    const res = await api.get<ApiEnvelope<{ items: InventoryItem[] }>>('/inventory');
    return res.data.data?.items ?? [];
  },
};

export const buildingApi = {
  async list(territoryId: string): Promise<Building[]> {
    const res = await api.get<ApiEnvelope<{ buildings: Building[] }>>(
      `/buildings/territory/${territoryId}`,
    );
    return res.data.data?.buildings ?? [];
  },
  async build(territoryId: string, type: BuildingType): Promise<Building> {
    const res = await api.post<ApiEnvelope<{ building: Building }>>(
      `/buildings/territory/${territoryId}`,
      { type },
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Build failed');
    }
    return res.data.data.building;
  },
  async demolish(buildingId: string): Promise<void> {
    await api.delete<ApiEnvelope<unknown>>(`/buildings/${buildingId}`);
  },
};

export const pveApi = {
  // bbox string is "minLng,minLat,maxLng,maxLat" (server contract).
  async getSpawnsInBounds(bbox: string): Promise<PveSpawn[]> {
    const res = await api.get<ApiEnvelope<{ spawns: PveSpawn[] }>>('/pve/spawns', {
      params: { bbox },
    });
    return res.data.data?.spawns ?? [];
  },
};

/**
 * Origin of the game host (API_BASE_URL with /api stripped).
 * e.g. "https://api.mapraiders.com" or "http://localhost:3000"
 */
export const gameOrigin: string = API_BASE_URL.replace(/\/api\/?$/, '');

export const terminalApi = {
  async start(
    spawnId: string,
    coords?: { latitude: number; longitude: number },
  ): Promise<TerminalStartResponse> {
    const res = await api.post<ApiEnvelope<TerminalStartResponse>>(
      `/terminals/${spawnId}/start`,
      coords ?? {},
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to start terminal run');
    }
    return res.data.data;
  },

  async submit(spawnId: string, body: TerminalSubmitBody): Promise<TerminalSubmitResponse> {
    const res = await api.post<ApiEnvelope<TerminalSubmitResponse>>(
      `/terminals/${spawnId}/submit`,
      body,
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to submit run');
    }
    return res.data.data;
  },

  async getLeaderboard(
    spawnId: string,
  ): Promise<TerminalLeaderboardResponse> {
    const res = await api.get<ApiEnvelope<TerminalLeaderboardResponse>>(
      `/terminals/${spawnId}/leaderboard`,
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to load leaderboard');
    }
    return res.data.data;
  },
};

// Re-export types that components need without reaching into api/types directly.
export type { LeaderboardEntry, RunnerLevel };

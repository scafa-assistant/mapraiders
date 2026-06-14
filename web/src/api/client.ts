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
  AirstrikeResult,
  BattleDetail,
  BattleSummary,
  Building,
  BuildingListResponse,
  BuildingType,
  ClientFeatureFlag,
  HaulRequest,
  HaulResponse,
  InterceptRequest,
  InterceptResponse,
  InventoryItem,
  LeaderboardEntry,
  LoginResponse,
  MeResponse,
  MyTerritory,
  MovementClass,
  PveSpawn,
  ResourcesResponse,
  RouteClaimResult,
  RoutePoint,
  RunnerLevel,
  StockpileEntry,
  Territory,
  TerritoryDetail,
  TerminalLeaderboardResponse,
  TerminalStartResponse,
  TerminalSubmitBody,
  TerminalSubmitResponse,
  TroopDeployment,
  TroopMovement,
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
  /** Own territories with centroid lat/lng (newest first). */
  async mine(): Promise<MyTerritory[]> {
    const res = await api.get<ApiEnvelope<{ territories: MyTerritory[] }>>(
      '/territories/mine',
    );
    return res.data.data?.territories ?? [];
  },
};

/**
 * Thrown by routeApi.claim on a server rejection. Carries the server's
 * `error` text (NOT `message`) plus any consolation XP so the UI can show
 * a friendly "route rejected" card.
 */
export class RouteClaimRejected extends Error {
  consolationXp: number;
  constructor(message: string, consolationXp = 0) {
    super(message);
    this.name = 'RouteClaimRejected';
    this.consolationXp = consolationXp;
  }
}

export const routeApi = {
  /**
   * Submit a recorded GPS track to claim territory. Requires >= 10 points;
   * the server runs the full anti-cheat pipeline regardless of client.
   * Resolves with the claim result on 201, throws RouteClaimRejected with the
   * server's `error` text (and consolation_xp) on a rejection.
   */
  async claim(points: RoutePoint[], movementClass: MovementClass): Promise<RouteClaimResult> {
    try {
      const res = await api.post<ApiEnvelope<RouteClaimResult>>('/routes/', {
        points,
        class: movementClass,
      });
      if (!res.data.success || !res.data.data) {
        // Defensive: a 2xx body without data — surface error/message.
        const body = res.data as { error?: string; message?: string };
        throw new RouteClaimRejected(body.error ?? body.message ?? 'Route rejected');
      }
      return res.data.data;
    } catch (err) {
      if (err instanceof RouteClaimRejected) throw err;
      if (axios.isAxiosError(err)) {
        // Failure body is { success:false, error, consolation_xp } — read `error`.
        const data = err.response?.data as
          | { error?: string; message?: string; consolation_xp?: number }
          | undefined;
        const text =
          data?.error ??
          data?.message ??
          (err.code === 'ECONNABORTED'
            ? 'Request timed out'
            : !err.response
              ? 'Cannot reach the server'
              : `Request failed (${err.response.status})`);
        throw new RouteClaimRejected(text, data?.consolation_xp ?? 0);
      }
      throw new RouteClaimRejected('Something went wrong claiming this route');
    }
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
  async list(territoryId: string): Promise<BuildingListResponse> {
    const res = await api.get<ApiEnvelope<BuildingListResponse>>(
      `/buildings/territory/${territoryId}`,
    );
    return {
      buildings: res.data.data?.buildings ?? [],
      stockpile: res.data.data?.stockpile ?? [],
    };
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
  async upgrade(buildingId: string): Promise<Building> {
    const res = await api.post<ApiEnvelope<{ building: Building }>>(
      `/buildings/${buildingId}/upgrade`,
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Upgrade failed');
    }
    return res.data.data.building;
  },
};

export const strikeApi = {
  async launch(fromTerritoryId: string, targetTerritoryId: string): Promise<AirstrikeResult> {
    const res = await api.post<ApiEnvelope<AirstrikeResult>>(
      '/commander/strike',
      { from_territory_id: fromTerritoryId, target_territory_id: targetTerritoryId },
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Strike failed');
    }
    return res.data.data;
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

// ---- Commander: Troops & Battles API -----------------------------------------

export const troopsApi = {
  async deploy(instanceId: string, territoryId: string): Promise<TroopDeployment> {
    const res = await api.post<ApiEnvelope<{ deployment: TroopDeployment }>>(
      '/commander/troops/deploy',
      { instance_id: instanceId, territory_id: territoryId },
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Deploy failed');
    }
    return res.data.data.deployment;
  },

  async undeploy(instanceId: string): Promise<void> {
    const res = await api.post<ApiEnvelope<unknown>>('/commander/troops/undeploy', {
      instance_id: instanceId,
    });
    if (!res.data.success) {
      throw new Error(res.data.message ?? 'Undeploy failed');
    }
  },

  async march(params: {
    instance_ids: string[];
    from_territory_id: string;
    target_territory_id: string;
    purpose: 'attack' | 'reinforce';
  }): Promise<TroopMovement> {
    const res = await api.post<ApiEnvelope<{ movement: TroopMovement }>>(
      '/commander/troops/march',
      params,
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'March failed');
    }
    return res.data.data.movement;
  },

  async equipDie(instanceId: string): Promise<void> {
    const res = await api.post<ApiEnvelope<unknown>>('/commander/dice/equip', {
      instance_id: instanceId,
    });
    if (!res.data.success) {
      throw new Error(res.data.message ?? 'Equip failed');
    }
  },
};

// ---- Commander: Hauling + Interception (Phase F.2) ---------------------------

export const haulApi = {
  /** Dispatch hauler units from an extraction territory back to a home base. */
  async send(body: HaulRequest): Promise<TroopMovement> {
    const res = await api.post<ApiEnvelope<HaulResponse>>('/commander/haul', body);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Haul failed');
    }
    return res.data.data.movement;
  },
};

export const interceptApi = {
  /** Ambush an enemy's loaded haul/return column. */
  async launch(body: InterceptRequest): Promise<InterceptResponse> {
    const res = await api.post<ApiEnvelope<InterceptResponse>>('/commander/intercept', body);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Intercept failed');
    }
    return res.data.data;
  },
};

export const battlesApi = {
  async list(): Promise<BattleSummary[]> {
    const res = await api.get<ApiEnvelope<{ battles: BattleSummary[] }>>(
      '/commander/battles',
    );
    return res.data.data?.battles ?? [];
  },

  async getById(id: string): Promise<BattleDetail> {
    const res = await api.get<ApiEnvelope<{ battle: BattleDetail }>>(
      `/commander/battles/${id}`,
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to load battle');
    }
    return res.data.data.battle;
  },
};

// Re-export types that components need without reaching into api/types directly.
export type { LeaderboardEntry, RunnerLevel, StockpileEntry };

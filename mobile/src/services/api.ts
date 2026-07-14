import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GpsPoint } from '../utils/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE = 'https://api.mapraiders.com/api';

/**
 * The raw API base URL without the '/api' suffix.
 * Used by TerminalScreen to build the WebView game URL:
 *   `${API_BASE_ORIGIN}/games/runner/index.html`
 */
export const API_BASE_ORIGIN = API_BASE.replace(/\/api$/, '');

const TOKEN_KEY = '@mapraiders_token';
const REFRESH_TOKEN_KEY = '@mapraiders_refresh_token';

// ─── Axios Instance ─────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Token Management ───────────────────────────────────────────────────────

let cachedToken: string | null = null;

export async function setTokens(token: string, refreshToken?: string): Promise<void> {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function clearTokens(): Promise<void> {
  cachedToken = null;
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

// ─── Request Interceptor ────────────────────────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Auth endpoints (login/register/refresh/web3) must NOT go through the
    // token-refresh retry: a 401 there means "bad credentials", not "expired
    // session". Otherwise the refresh attempt fails with "No refresh token
    // available" and masks the real server message on the login screen.
    const reqUrl = originalRequest?.url ?? '';
    const isAuthRoute = reqUrl.includes('/auth/');

    // Handle 401 with token refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const newToken = data.data.token;
        const newRefreshToken = data.data.refreshToken;

        await setTokens(newToken, newRefreshToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        // The auth store will detect the cleared token and redirect to login
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Transform error for consistent handling
    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  }
);

// ─── Auth API ───────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  web3Login: (data: { provider: string; idToken: string; userInfo: Record<string, any> }) =>
    api.post('/auth/web3', data),
};

// ─── Routes API ─────────────────────────────────────────────────────────────

export const routeApi = {
  upload: (data: { points: GpsPoint[]; class?: string }) =>
    api.post('/routes', data),

  getMyRoutes: (page?: number) =>
    api.get('/routes/me', { params: { page } }),
};

// ─── Territories API ────────────────────────────────────────────────────────

/**
 * A territory owned by the current player, as returned by `GET /api/territories/mine`.
 * This is the flat list shape (no polygon) used by the "My Territories" list on the map.
 */
export interface MyTerritory {
  id: string;
  lat: number;
  lng: number;
  class: string;
  claim_value: number;
  area_m2: number;
  decay_level: number;
  is_protected: boolean;
  claimed_at: string;
}

export const territoryApi = {
  getInBounds: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/territories', { params: bbox }),

  getById: (id: string) =>
    api.get(`/territories/${id}`),

  getMine: () =>
    api.get('/territories/me'),

  /**
   * Fetch the flat list of the current player's territories (no polygon).
   * Server: `GET /api/territories/mine` → `{ success, data: { territories: MyTerritory[] } }`.
   * Returns the unwrapped array, tolerant of nesting variations.
   */
  mine: async (): Promise<MyTerritory[]> => {
    const res = await api.get('/territories/mine');
    const body = res.data;
    const raw =
      body?.data?.territories ??
      body?.territories ??
      (Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []);
    return Array.isArray(raw) ? (raw as MyTerritory[]) : [];
  },
};

// ─── Quests API ─────────────────────────────────────────────────────────────

export const questApi = {
  getNearby: (lat: number, lng: number, radius: number) =>
    api.get('/quests', { params: { lat, lng, radius } }),

  getInBounds: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/quests', { params: bbox }),

  getById: (id: string) =>
    api.get(`/quests/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/quests', data),

  start: (id: string) =>
    api.post(`/quests/${id}/start`),

  verifyStep: (questId: string, stepId: string, formData: FormData) =>
    api.post(`/quests/${questId}/steps/${stepId}/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  rate: (id: string, data: Record<string, unknown>) =>
    api.post(`/quests/${id}/rate`, data),
};

// ─── Echos API ──────────────────────────────────────────────────────────────

export const echoApi = {
  getNearby: (lat: number, lng: number, radius: number) =>
    api.get('/echos', { params: { lat, lng, radius } }),

  getInBounds: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/echos', { params: bbox }),

  getById: (id: string) =>
    api.get(`/echos/${id}`),

  create: (formData: FormData) =>
    api.post('/echos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  like: (id: string) =>
    api.post(`/echos/${id}/like`),

  delete: (id: string) =>
    api.delete(`/echos/${id}`),
};

// ─── Challenges API ─────────────────────────────────────────────────────────

export const challengeApi = {
  getNearby: (lat: number, lng: number, radius: number) =>
    api.get('/challenges', { params: { lat, lng, radius } }),

  getInBounds: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/challenges', { params: bbox }),

  getById: (id: string) =>
    api.get(`/challenges/${id}`),

  getSubmissions: (id: string) =>
    api.get(`/challenges/${id}/submissions`),

  create: (data: Record<string, unknown>) =>
    api.post('/challenges', data),

  submit: (id: string, formData: FormData) =>
    api.post(`/challenges/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Pets API ───────────────────────────────────────────────────────────────

export const petApi = {
  getMine: () =>
    api.get('/pets/me'),

  register: (data: { name: string; species: string; breed?: string }) =>
    api.post('/pets', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/pets/${id}`, data),

  uploadPhoto: (id: string, formData: FormData) =>
    api.put(`/pets/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Travel API ─────────────────────────────────────────────────────────────

export const travelApi = {
  getRoutes: (lat: number, lng: number, radius: number) =>
    api.get('/travel/routes', { params: { lat, lng, radius } }),

  getById: (id: string) =>
    api.get(`/travel/routes/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/travel/routes', data),

  addSpots: (id: string, data: Record<string, unknown>) =>
    api.put(`/travel/routes/${id}`, data),

  complete: (id: string) =>
    api.post(`/travel/routes/${id}/complete`),

  rate: (id: string, data: Record<string, unknown>) =>
    api.post(`/travel/routes/${id}/rate`, data),
};

// ─── Leaderboards API ───────────────────────────────────────────────────────

export const leaderboardApi = {
  get: (type: string, params?: Record<string, unknown>) =>
    api.get(`/leaderboards/${type}`, { params }),

  getMyRank: (type: string) =>
    api.get(`/leaderboards/${type}/me`),
};

// ─── User API ───────────────────────────────────────────────────────────────

export const userApi = {
  getMe: () =>
    api.get('/users/me'),

  getProfile: (id: string) =>
    api.get(`/users/${id}/profile`),

  updateSettings: (settings: Record<string, unknown>) =>
    api.put('/users/me/settings', settings),

  exportData: () =>
    api.get('/users/me/export'),

  deleteAccount: () =>
    api.delete('/users/me'),

  updatePushToken: (token: string) =>
    api.put('/users/me/push-token', { token }),

  setHomeZone: (lat: number, lng: number) =>
    api.put('/users/me/home-zone', { lat, lng }),

  removeHomeZone: () =>
    api.delete('/users/me/home-zone'),

  uploadAvatar: (formData: FormData) =>
    api.put('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changeUsername: (username: string) =>
    api.put('/users/me/username', { username }),
  changeTerritoryColor: (color: string) =>
    api.put('/users/me/color', { color }),
};

// ─── Clans API ──────────────────────────────────────────────────────────────

export const clanApi = {
  getMine: () =>
    api.get('/clans/me'),
  getById: (id: string) =>
    api.get(`/clans/${id}`),
  getMessages: (clanId: string, before?: string) =>
    api.get(`/clans/${clanId}/messages`, { params: { before } }),
  sendMessage: (clanId: string, message: string) =>
    api.post(`/clans/${clanId}/messages`, { message }),
  getDistrictScores: () =>
    api.get('/clans/districts/scores'),
  // Manual clan management
  create: (data: { name: string; description: string; tag: string; color: string; privacy: string }) =>
    api.post('/clans', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/clans/${id}`, data),
  disband: (id: string) =>
    api.delete(`/clans/${id}`),
  leave: (id: string) =>
    api.post(`/clans/${id}/leave`),
  getMembers: (id: string) =>
    api.get(`/clans/${id}/members`),
  setRole: (clanId: string, userId: string, role: string) =>
    api.put(`/clans/${clanId}/members/${userId}/role`, { role }),
  kickMember: (clanId: string, userId: string) =>
    api.delete(`/clans/${clanId}/members/${userId}`),
  transferLeadership: (id: string, userId: string) =>
    api.put(`/clans/${id}/transfer`, { userId }),
  search: (q: string) =>
    api.get('/clans/search', { params: { q } }),
};

// ─── Friends API ──────────────────────────────────────────────────────────

export const friendApi = {
  getAll: () => api.get('/friends'),
  sendRequest: (userId: string) => api.post('/friends/request', { userId }),
  getRequests: () => api.get('/friends/requests'),
  getSentRequests: () => api.get('/friends/requests/sent'),
  acceptRequest: (id: string) => api.put(`/friends/requests/${id}/accept`),
  declineRequest: (id: string) => api.put(`/friends/requests/${id}/decline`),
  remove: (userId: string) => api.delete(`/friends/${userId}`),
  block: (userId: string) => api.post('/friends/block', { userId }),
  unblock: (userId: string) => api.delete(`/friends/block/${userId}`),
  getBlocked: () => api.get('/friends/blocked'),
};

// ─── Player Search API ────────────────────────────────────────────────────

export const playerApi = {
  search: (q: string, limit?: number) => api.get('/players/search', { params: { q, limit } }),
  getProfile: (id: string) => api.get(`/players/${id}/profile`),
};

// ─── Notifications API ──────────────────────────────────────────────────────

export const notificationApi = {
  get: (params?: Record<string, unknown>) =>
    api.get('/notifications', { params }),

  markRead: (ids: string[]) =>
    api.put('/notifications/read', { ids }),

  updateSettings: (settings: Record<string, unknown>) =>
    api.put('/notifications/settings', settings),
};

// ─── Artifacts API ──────────────────────────────────────────────────────

export const artifactApi = {
  getNearby: (lat: number, lng: number, radius: number) =>
    api.get('/artifacts', { params: { lat, lng, radius } }),

  getInBounds: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/artifacts', { params: bbox }),

  getById: (id: string) =>
    api.get(`/artifacts/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/artifacts', data),

  vote: (id: string) =>
    api.post(`/artifacts/${id}/vote`),
};

// ─── Social API ─────────────────────────────────────────────────────────────

export const socialApi = {
  report: (data: { target_type: string; target_id: string; reason: string }) =>
    api.post('/social/reports', data),

  getFeed: (page?: number) =>
    api.get('/social/feed', { params: { page } }),
};

// ─── Weather API ────────────────────────────────────────────────────────────

export const weatherApi = {
  getCurrent: (lat: number, lng: number) =>
    api.get('/weather', { params: { lat, lng } }),
};

// ─── Silent Zones API ───────────────────────────────────────────────────────

export const silentZoneApi = {
  getNearby: (lat: number, lng: number, radius: number) =>
    api.get('/silent-zones', { params: { lat, lng, radius } }),

  getInBounds: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/silent-zones', { params: bbox }),

  getById: (id: string) =>
    api.get(`/silent-zones/${id}`),

  propose: (data: Record<string, unknown>) =>
    api.post('/silent-zones', data),

  vote: (id: string) =>
    api.post(`/silent-zones/${id}/vote`),
};

// ─── Places API (Stadtgedächtnis / City Memory) ────────────────────────────

export const placeApi = {
  getHistory: (lat: number, lng: number, radius?: number, days?: number) =>
    api.get('/places/history', { params: { lat, lng, radius, days } }),

  getStats: (lat: number, lng: number, radius?: number) =>
    api.get('/places/stats', { params: { lat, lng, radius } }),
};

// ─── Map Buildings API (real OSM buildings claimed on the world map) ─────────

export const mapBuildingApi = {
  getClaimed: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/buildings/osm/claimed', { params: bbox }),

  // Server-cached OSM footprints (tile cache) — phones no longer hit Overpass
  // directly. First visit to an area is slower while the server fills tiles.
  getFootprints: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/buildings/osm/footprints', { params: bbox, timeout: 90_000 }),

  claim: (payload: { osmId: string; lat: number; lng: number; type?: string }) =>
    api.post('/buildings/osm/claim', payload),

  release: (osmId: string) =>
    api.post('/buildings/osm/release', { osmId }),
};

// ─── Resonance API ─────────────────────────────────────────────────────────

export const resonanceApi = {
  getNearby: (lat: number, lng: number, radius: number) =>
    api.get('/resonance', { params: { lat, lng, radius } }),

  getInBounds: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/resonance', { params: bbox }),
};

// ─── Duels API ──────────────────────────────────────────────────────────────

export const duelApi = {
  challenge: (data: Record<string, unknown>) =>
    api.post('/duels', data),

  accept: (id: string) =>
    api.put(`/duels/${id}/accept`),

  decline: (id: string) =>
    api.put(`/duels/${id}/decline`),

  submitScore: (id: string, score: number) =>
    api.post(`/duels/${id}/score`, { score }),

  complete: (id: string) =>
    api.post(`/duels/${id}/complete`),

  getActive: () =>
    api.get('/duels/active'),

  getHistory: (limit?: number) =>
    api.get('/duels/history', { params: { limit } }),

  getNearbyPlayers: (lat: number, lng: number, radius?: number) =>
    api.get('/duels/nearby-players', { params: { lat, lng, radius } }),
};

// ─── Races API ──────────────────────────────────────────────────────────────

export const raceApi = {
  getNearby: (lat: number, lng: number, radius: number) =>
    api.get('/races', { params: { lat, lng, radius } }),

  getById: (id: string) =>
    api.get(`/races/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/races', data),

  start: (id: string) =>
    api.post(`/races/${id}/start`),

  complete: (id: string, data: Record<string, unknown>) =>
    api.post(`/races/${id}/complete`, data),
};

// ─── Bounties API ─────────────────────────────────────────────────────────

export const bountyApi = {
  place: (data: { target_id: string; reason?: string; xp_reward?: number }) =>
    api.post('/bounties', data),

  getActive: (lat?: number, lng?: number, radius?: number) =>
    api.get('/bounties', { params: { lat, lng, radius } }),

  getOnMe: () =>
    api.get('/bounties/on-me'),
};

// ─── Aliases API ──────────────────────────────────────────────────────────

export const aliasApi = {
  create: (alias_name: string) =>
    api.post('/aliases', { alias_name }),

  getMe: () =>
    api.get('/aliases/me'),

  switch: (active: boolean) =>
    api.put('/aliases/switch', { active }),
};

// ─── Traps API ────────────────────────────────────────────────────────────

export const trapApi = {
  place: (data: { territory_id: string; type: string; lat: number; lng: number }) =>
    api.post('/traps', data),

  getMine: () =>
    api.get('/traps/my'),

  disarm: (id: string) =>
    api.delete(`/traps/${id}`),
};

// ─── Meetups API ─────────────────────────────────────────────────────────

export const meetupApi = {
  create: (data: Record<string, unknown>) => api.post('/meetups', data),
  getInBounds: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/meetups', { params: bbox }),
  getById: (id: string) => api.get(`/meetups/${id}`),
  join: (id: string) => api.post(`/meetups/${id}/join`),
  leave: (id: string) => api.post(`/meetups/${id}/leave`),
  getMessages: (id: string, before?: string) =>
    api.get(`/meetups/${id}/messages`, { params: { before } }),
  sendMessage: (id: string, message: string) =>
    api.post(`/meetups/${id}/messages`, { message }),
  markPresent: (id: string, lat: number, lng: number) =>
    api.post(`/meetups/${id}/present`, { lat, lng }),
  cancel: (id: string) =>
    api.delete(`/meetups/${id}`),
};

// ─── Events API ──────────────────────────────────────────────────────────

export const eventApi = {
  getActive: (lat?: number, lng?: number) =>
    api.get('/events', { params: { lat, lng } }),

  getById: (id: string) =>
    api.get(`/events/${id}`),

  join: (id: string) =>
    api.post(`/events/${id}/join`),

  getNearbyLoot: (lat: number, lng: number, radius: number) =>
    api.get('/events/loot', { params: { lat, lng, radius } }),

  collectLoot: (id: string) =>
    api.post(`/events/loot/${id}/collect`),
};

// ─── Invites API ──────────────────────────────────────────────────────────

export const inviteApi = {
  create: () =>
    api.post('/invites'),

  getMyInvites: () =>
    api.get('/invites/me'),

  redeem: (code: string) =>
    api.post('/invites/redeem', { code }),
};

// ─── Defenses API ──────────────────────────────────────────────────────────

export const defenseApi = {
  setDefense: (data: { territoryId: string; gameType: string; config: Record<string, any>; secret?: string; benchmark?: Record<string, any> }) =>
    api.post('/defenses', data),
  getDefense: (territoryId: string) =>
    api.get(`/defenses/${territoryId}`),
  submitChallenge: (defenseId: string, data: Record<string, any>) =>
    api.post(`/defenses/${defenseId}/challenge`, { challengerData: data }),
  removeDefense: (defenseId: string) =>
    api.delete(`/defenses/${defenseId}`),
};

// ─── Turn-Based Games API ─────────────────────────────────────────────────

export const turnGameApi = {
  create: (data: { territoryId: string; gameType: string; defenseId?: string }) =>
    api.post('/games', data),
  getMyGames: () =>
    api.get('/games/my'),
  getGame: (id: string) =>
    api.get(`/games/${id}`),
  makeMove: (id: string, moveData: Record<string, any>) =>
    api.post(`/games/${id}/move`, { moveData }),
  getMoves: (id: string) =>
    api.get(`/games/${id}/moves`),
};

// ─── Features API ────────────────────────────────────────────────────────────

export const featureApi = {
  getAll: () =>
    api.get('/features'),
};

// ─── Inventory API ────────────────────────────────────────────────────────────

export const inventoryApi = {
  getAll: (filters?: { category?: string; status?: string }) =>
    api.get('/inventory', { params: filters }),

  getById: (id: string) =>
    api.get(`/inventory/${id}`),
};

// ─── Resources API ────────────────────────────────────────────────────────────

export const resourceApi = {
  get: () =>
    api.get('/resources'),
};

// ─── Buildings API ───────────────────────────────────────────────────────────

export type BuildingType =
  | 'shield_generator'
  | 'refinery'
  | 'radar'
  | 'garrison'
  | 'silo'
  | 'teleporter'
  // Phase F.1 — biome extraction buildings (gated by the 'economy' flag)
  | 'sawmill'
  | 'quarry'
  | 'farm'
  | 'fishery'
  // Phase F.4 — advanced military / infrastructure buildings (base builder)
  | 'military_base'
  | 'airport'
  | 'datacenter';

export type BuildingStatus = 'building' | 'active' | 'damaged' | 'destroyed';

/** Raw resource produced/stored per territory (Phase F.1, economy flag). */
export type RawResource = 'wood' | 'stone' | 'food';

/** Per-territory stockpile entry — the raw pile that grows over time. */
export interface StockpileEntry {
  resource: RawResource;
  amount: number;
  cap: number;
  rate_per_hour: number;
}

export interface Building {
  id: string;
  territory_id: string;
  owner_id: string | null;
  type: BuildingType;
  tier: number;
  status: BuildingStatus;
  hp: number;
  completes_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
  /** Top-left grid anchor of the footprint on the square build grid, or null if unplaced. */
  grid_x: number | null;
  grid_y: number | null;
}

/** Square build grid descriptor for a territory (base builder). */
export interface BuildGrid {
  side: number;
  cell_m2: number;
}

export const buildingApi = {
  /**
   * List all buildings on a territory.
   * `stockpile` is the per-territory raw resource pile (Phase F.1) — `[]` when the economy flag is off.
   * `grid` is the square build grid (base builder) — `null` when the economy flag is off.
   */
  list: (territoryId: string) =>
    api.get<{ success: boolean; data: { buildings: Building[]; stockpile?: StockpileEntry[]; grid?: BuildGrid | null } }>(`/buildings/territory/${territoryId}`),

  /**
   * Construct a new building on a territory. When gridX/gridY are given the
   * server places the footprint's top-left corner there (base builder).
   */
  build: (territoryId: string, type: BuildingType, gridX?: number, gridY?: number) =>
    api.post<{ success: boolean; data: { building: Building } }>(
      `/buildings/territory/${territoryId}`,
      gridX != null && gridY != null ? { type, grid_x: gridX, grid_y: gridY } : { type }
    ),

  /** Demolish a building — server refunds 50% of costs. */
  demolish: (buildingId: string) =>
    api.delete<{ success: boolean; data: { refunded: { energy?: number; tech?: number } } }>(`/buildings/${buildingId}`),

  /** Upgrade a building to the next tier. Status → 'building' until completes_at. */
  upgrade: (buildingId: string) =>
    api.post<{ success: boolean; data: { building: Building } }>(`/buildings/${buildingId}/upgrade`),

  /** Train a batch of units at a military_base or airport (max 10 per request). */
  train: (buildingId: string, unit: string, count: number) =>
    api.post<{ success: boolean; data: { unit: string; count: number; instance_ids: string[] } }>(
      `/buildings/${buildingId}/train`,
      { unit, count }
    ),
};

// ─── PvE API ─────────────────────────────────────────────────────────────────

export interface HackInputTrace {
  playerLocation: { latitude: number; longitude: number };
  samples: Array<{ t: number; freq: number; amp: number }>;
  durationS: number;
}

export const pveApi = {
  /** Fetch PvE spawns visible in the given bbox string "minLng,minLat,maxLng,maxLat". */
  getSpawnsInBounds: (bbox: string) =>
    api.get('/pve/spawns', { params: { bbox } }),

  /** Submit a frequency-trace hack attempt for a spawn. */
  hack: (spawnId: string, inputTrace: HackInputTrace) =>
    api.post(`/pve/spawns/${spawnId}/hack`, { inputTrace }),
};

// ─── Streifzug API (Patrol Mode, Stage 1) ────────────────────────────────────
//
// Foreground patrol session: start/stop a session, then ping with the
// current GPS point. The server surfaces at most one nearby PvE spawn as an
// "encounter" (paced + deduped server-side). The encounter carries a full
// spawn descriptor so the client can hand it straight to HackingScreen.

export interface StreifzugEncounter {
  spawnId: string;
  npcType: 'scout_disc' | 'tech_drone' | 'aether_leech' | 'water_strider_source' | 'forest_construct_source';
  kind: 'loot' | 'recruit' | 'threat';
  distanceM: number;
  bearingDeg: number;
  latitude: number;
  longitude: number;
  level: 1 | 2 | 3;
  biome: string;
  expiresAt: string;
  title: string;
  body: string;
}

export interface StreifzugPingData {
  active: boolean;
  encounter: StreifzugEncounter | null;
  reason?: string;
}

export interface StreifzugStatusData {
  active: boolean;
  startedAt?: number;
}

export const streifzugApi = {
  /** Begin a patrol session. */
  start: () =>
    api.post<{ success: boolean; data: StreifzugStatusData }>('/streifzug/start'),

  /** End the patrol session. */
  stop: () =>
    api.post<{ success: boolean; data: StreifzugStatusData }>('/streifzug/stop'),

  /** Is a session active? */
  status: () =>
    api.get<{ success: boolean; data: StreifzugStatusData }>('/streifzug/status'),

  /** Heartbeat: report position, receive the surfaced encounter (or null). */
  ping: (latitude: number, longitude: number) =>
    api.post<{ success: boolean; data: StreifzugPingData }>('/streifzug/ping', {
      latitude,
      longitude,
    }),
};

// ─── Commander API ─────────────────────────────────────────────────────────────
//
// Indoor strategy layer: fog-of-war hex map (H3 res-8), scout dispatch (C.1)
// and troop deployment / attacks / dice battles (C.2). All combat is resolved
// server-side; the mobile client only renders the result.
// Envelope: { success: true, data } | { success: false, message }.

export interface CommanderTerritory {
  id: string;
  owner_id: string | null;
  owner_username: string | null;
  claim_value: number;
  h3_cells: string[];
  is_own: boolean;
  /** true = server has live intel; false = stale/cached territory outline only */
  live?: boolean;
}

/**
 * Per-haul cargo manifest. Outbound haul movements expose `carry_total`
 * (the stack's total carry capacity); the return leg additionally exposes
 * `load` — the actual resources being carried home, e.g. `{ wood: 120 }`.
 */
export interface HaulConfig {
  carry_total?: number;
  load?: Partial<Record<RawResource, number>>;
  [key: string]: unknown;
}

export interface CommanderOwnMovement {
  id: string;
  purpose: 'scout' | 'return' | 'attack' | 'reinforce' | 'haul';
  status: string;
  from_cell: string;
  to_cell: string;
  path: string[];
  departs_at: string;
  arrives_at: string;
  progress: number;
  instance_ids: string[];
  config?: HaulConfig;
  is_own: true;
}

export interface CommanderForeignMovement {
  id: string;
  purpose: 'scout' | 'return' | 'attack' | 'reinforce' | 'haul';
  current_cell: string;
  eta: string;
  /** Phase F.2 — true when this enemy column is loaded with cargo (interceptable). */
  carrying?: boolean;
  is_own: false;
}

export type CommanderMovement = CommanderOwnMovement | CommanderForeignMovement;

export interface CommanderRadar {
  building_id: string;
  territory_id: string;
  covert: boolean;
  cells: string[];
}

export interface CommanderGarrisonUnit {
  instance_id: string;
  definition_id: string;
}

export interface CommanderGarrison {
  territory_id: string;
  count: number;
  is_own: boolean;
  units: CommanderGarrisonUnit[] | null;
}

/** Info about an own silo available for airstrikes. ready_at null = ready now. */
export interface SiloInfo {
  territory_id: string;
  tier: number;
  /** ISO timestamp of when the cooldown ends, or null if the silo is ready. */
  ready_at: string | null;
}

/** UUID of the Hyperborean AI faction — used to label its battles. */
export const HYPERBOREAN_AI_USER_ID = '00000000-0000-0000-0000-00000000a111';

/** A single H3 res-8 cell held by the Hyperborean AI, already fog-filtered server-side. */
export interface AiZone {
  h3_cell: string;
  phase: 'dormant' | 'triggered' | 'invasion';
}

/**
 * A strategic objective cell — always visible regardless of fog tier.
 * kind: 'enemy_territory' | 'pve_spawn' | 'ai_zone'
 */
export interface Objective {
  h3_cell: string;
  kind: 'enemy_territory' | 'pve_spawn' | 'ai_zone';
}

/** How many scouts the player may have out concurrently. */
export interface ScoutCapacity {
  max: number;
  active: number;
}

export interface CommanderMapData {
  /**
   * Legacy field — absent from server v2+ responses (replaced by explored_cells + active_cells).
   * Kept optional so old cached payloads don't break.
   */
  visible_cells?: string[];
  /** Permanently explored H3 cells — render DIM (violet, low alpha). */
  explored_cells: string[];
  /** Cells visible RIGHT NOW (scouts, live territory, radar) — render BRIGHT. */
  active_cells: string[];
  /** Always-visible strategic objectives (coarse yellow hint markers). */
  objectives: Objective[];
  territories: CommanderTerritory[];
  movements: CommanderMovement[];
  radars: CommanderRadar[];
  garrisons: CommanderGarrison[];
  /** Own silo cooldown states — present when commander flag is enabled. */
  silos: SiloInfo[];
  /**
   * H3 res-8 cells held by the Hyperborean AI, fog-filtered by the server.
   * May be absent on older server versions — always normalise to [].
   */
  ai_zones?: AiZone[];
  /** Concurrent scout limit for this player. */
  scout_capacity?: ScoutCapacity;
}

export interface CommanderBattleSummary {
  id: string;
  type: string;
  attacker_id: string;
  defender_id: string;
  territory_id: string;
  winner: string | null;
  winner_side: 'attacker' | 'defender' | null;
  created_at: string;
}

export interface CommanderBattleRoundSide {
  rolls: number[];
  bonus: number;
  modifier: number;
  total: number;
  unit: string;
}

export interface CommanderBattleEffect {
  side: 'atk' | 'def';
  effect: string;
  /** The cancelled die VALUE (e.g. 5), not a flag. */
  cancelled?: number;
}

export interface CommanderBattleCasualty {
  side: 'atk' | 'def';
  definition_id: string;
}

export interface CommanderBattleRound {
  round: number;
  atk: CommanderBattleRoundSide;
  def: CommanderBattleRoundSide;
  effects: CommanderBattleEffect[];
  casualty: CommanderBattleCasualty | null;
}

/** Standard dice-battle log. */
export interface CommanderDiceBattleLog {
  rounds: CommanderBattleRound[];
  attacker_units_start: number;
  defender_units_start: number;
  walkover: boolean;
  winner_side: 'attacker' | 'defender';
  survivors: { attacker: string[]; defender: string[] };
  loot: { dice_drop?: string | null };
}

/** Airstrike result variants (union). */
export type AirstrikeResult =
  | { shield_broken: true }
  | { building_hit: { id: string; type: string; hp_after: number; destroyed: boolean } }
  | { no_effect: true };

/** Airstrike battle log — replaces round-by-round dice narrative. */
export interface CommanderAirstrikeBattleLog {
  type: 'airstrike';
  silo_tier: number;
  damage: number;
  result: AirstrikeResult;
}

/** Phase F.2 — result of an interception attempt against a loaded haul column. */
export interface InterceptResult {
  battle_id: string;
  result: {
    winner_side: 'attacker' | 'defender';
    load_lost: boolean;
  };
}

/** The full battle narrative lives INSIDE the `log` JSONB column. */
export type CommanderBattleLog = CommanderDiceBattleLog | CommanderAirstrikeBattleLog;

export interface CommanderBattleDetail {
  id: string;
  type: string;
  attacker_id: string | null;
  defender_id: string | null;
  territory_id: string | null;
  winner: string | null;
  created_at: string;
  log: CommanderBattleLog;
  loot: { dice_drop?: string | null } | null;
}

export const commanderApi = {
  /** Fetch the fog-of-war strategic map (visible cells, territories, movements, radars, garrisons, silos). */
  getMap: () =>
    api.get<{ success: boolean; data: CommanderMapData }>('/commander/map'),

  /** Dispatch a scout unit to a target H3 cell, optionally planting a covert radar. */
  sendScout: (body: {
    instance_id: string;
    from_territory_id: string;
    target_cell: string;
    build_radar?: boolean;
  }) =>
    api.post<{ success: boolean; data: { movement: CommanderOwnMovement } }>(
      '/commander/scouts/send',
      body
    ),

  /** Recall a scout movement back to its base. */
  recallScout: (movementId: string) =>
    api.post<{ success: boolean; data: { movement: CommanderOwnMovement } }>(
      `/commander/scouts/${movementId}/recall`
    ),

  /** Deploy a unit into a territory garrison. */
  deployTroop: (body: { instance_id: string; territory_id: string }) =>
    api.post<{ success: boolean; data: { deployment: unknown } }>('/commander/troops/deploy', body),

  /** Recall a deployed unit back to inventory. */
  undeployTroop: (body: { instance_id: string }) =>
    api.post<{ success: boolean; data: Record<string, never> }>('/commander/troops/undeploy', body),

  /** March a stack of units from one territory to another (attack or reinforce). */
  march: (body: {
    instance_ids: string[];
    from_territory_id: string;
    target_territory_id: string;
    purpose: 'attack' | 'reinforce';
  }) =>
    api.post<{ success: boolean; data: { movement: CommanderOwnMovement } }>(
      '/commander/troops/march',
      body
    ),

  /** Equip a die into the active pouch slot. */
  equipDie: (body: { instance_id: string }) =>
    api.post<{ success: boolean; data: Record<string, never> }>('/commander/dice/equip', body),

  /** Launch an airstrike from a silo territory onto a target territory. */
  strike: (body: { from_territory_id: string; target_territory_id: string }) =>
    api.post<{ success: boolean; data: { battle_id: string; result: AirstrikeResult } }>(
      '/commander/strike',
      body
    ),

  /**
   * Phase F.2 — Haul a stockpile home. Dispatch 1–6 hauler units from an own
   * territory with a stockpile to another own territory.
   */
  haul: (body: { instance_ids: string[]; from_territory_id: string; target_territory_id: string }) =>
    api.post<{ success: boolean; data: { movement: CommanderOwnMovement } }>(
      '/commander/haul',
      body
    ),

  /**
   * Phase F.2 — Intercept a loaded foreign haul movement with own units.
   * Resolves an interception battle server-side.
   */
  intercept: (body: { movement_id: string; instance_ids: string[]; from_territory_id: string }) =>
    api.post<{ success: boolean; data: InterceptResult }>('/commander/intercept', body),

  /** List recent battles involving the player. */
  getBattles: () =>
    api.get<{ success: boolean; data: { battles: CommanderBattleSummary[] } }>('/commander/battles'),

  /** Fetch full battle detail with the round-by-round dice log. */
  getBattle: (id: string) =>
    api.get<{ success: boolean; data: { battle: CommanderBattleDetail } }>(`/commander/battles/${id}`),

  /**
   * Phase F.3 — Paid scan (30 intel) revealing enemy COVERT spy-radars on a
   * territory older than 72 h owned by someone at or below the caller's level.
   * Returns the unwrapped `found` array and the scanned territory id.
   * Throws a human-readable string on failure.
   */
  scanTerritory: async (
    territoryId: string
  ): Promise<{ found: { building_id: string; owner_id: string | null; detected: true }[]; scanned_territory: string }> => {
    try {
      const res = await api.post<{ success: boolean; data: { found: { building_id: string; owner_id: string | null; detected: true }[]; scanned_territory: string } }>(
        '/commander/scan',
        { territory_id: territoryId }
      );
      return res.data.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('INSUFFICIENT_RESOURCES')) throw new Error('Not enough Intel (30 required).');
      if (msg.includes('NOT_FOUND') || msg.includes('_NOT_FOUND')) throw new Error('Territory not found.');
      if (msg.includes('FEATURE_DISABLED')) throw new Error('Commander feature is not enabled.');
      throw new Error(msg || 'Scan failed.');
    }
  },

  /**
   * Phase F.3 — Destroy a DETECTED covert spy-radar on a territory you own.
   * Returns true on success. Throws a human-readable string on failure.
   */
  destroyRadar: async (buildingId: string): Promise<boolean> => {
    try {
      const res = await api.post<{ success: boolean; data: { destroyed: boolean } }>(
        '/commander/destroy-radar',
        { building_id: buildingId }
      );
      return res.data.data.destroyed;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('BUILDING_NOT_FOUND')) throw new Error('Radar building not found.');
      if (msg.includes('NOT_DETECTED')) throw new Error('Radar has not been detected yet.');
      if (msg.includes('NOT_TERRITORY_OWNER')) throw new Error('You do not own this territory.');
      if (msg.includes('FEATURE_DISABLED')) throw new Error('Commander feature is not enabled.');
      throw new Error(msg || 'Destroy failed.');
    }
  },
};

// ─── Terminals API ───────────────────────────────────────────────────────────

export interface TerminalStartData {
  run_token: string;
  level: Record<string, unknown>;
  expires_at: number;
}

export interface TerminalSubmitBody {
  run_token: string;
  score: number;
  duration_ms: number;
  orbs_collected: number;
  finished: boolean;
  trace: Record<string, unknown>;
}

export interface TerminalSubmitData {
  accepted: boolean;
  score: number;
  best_score: number;
  rank: number;
  reward: { intel: number } | null;
}

export interface TerminalLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
}

export interface TerminalLeaderboardData {
  entries: TerminalLeaderboardEntry[];
  me: { rank: number; score: number } | null;
}

export const terminalApi = {
  /** Start a terminal run. Sends current GPS coords (proximity-checked server-side). */
  start: (spawnId: string, coords: { latitude: number; longitude: number }) =>
    api.post<{ success: boolean; data: TerminalStartData }>(`/terminals/${spawnId}/start`, {
      latitude: coords.latitude,
      longitude: coords.longitude,
    }),

  /** Submit a completed or aborted run. */
  submit: (spawnId: string, body: TerminalSubmitBody) =>
    api.post<{ success: boolean; data: TerminalSubmitData }>(`/terminals/${spawnId}/submit`, body),

  /** Fetch the top-10 leaderboard for a terminal spawn. */
  leaderboard: (spawnId: string) =>
    api.get<{ success: boolean; data: TerminalLeaderboardData }>(`/terminals/${spawnId}/leaderboard`),
};

export default api;

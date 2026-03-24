import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GpsPoint } from '../utils/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE = 'https://api.mapraiders.com/api';

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

    // Handle 401 with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
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

export const territoryApi = {
  getInBounds: (bbox: { north: number; south: number; east: number; west: number }) =>
    api.get('/territories', { params: bbox }),

  getById: (id: string) =>
    api.get(`/territories/${id}`),

  getMine: () =>
    api.get('/territories/me'),
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
    api.post(`/defenses/${defenseId}/challenge`, data),
  removeDefense: (defenseId: string) =>
    api.delete(`/defenses/${defenseId}`),
};

export default api;

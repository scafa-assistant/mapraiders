import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GpsPoint } from '../utils/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.gridwalker.app/api';

const TOKEN_KEY = '@gridwalker_token';
const REFRESH_TOKEN_KEY = '@gridwalker_refresh_token';

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
};

// ─── Clans API ──────────────────────────────────────────────────────────────

export const clanApi = {
  getMine: () =>
    api.get('/clans/me'),

  getById: (id: string) =>
    api.get(`/clans/${id}`),
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

export default api;

import { create } from 'zustand';
import axios from 'axios';
import { UserProfile } from '../navigation/types';

const API_BASE = 'https://api.gridwalker.app';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, user, isLoading: false });
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        username,
        email,
        password,
      });
      const { token, user } = response.data;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, user, isLoading: false });
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  logout: () => {
    delete axios.defaults.headers.common['Authorization'];
    set({ token: null, user: null, error: null });
  },

  refreshProfile: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE}/users/me`);
      set({ user: response.data });
    } catch (err: any) {
      if (err.response?.status === 401) {
        get().logout();
      }
    }
  },

  clearError: () => set({ error: null }),
}));

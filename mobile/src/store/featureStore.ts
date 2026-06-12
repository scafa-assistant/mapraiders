import { create } from 'zustand';
import { featureApi } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeatureFlag {
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface Capabilities {
  pve: boolean;
  resources: boolean;
  commander: boolean;
  tcg: boolean;
}

const DEFAULT_CAPABILITIES: Capabilities = {
  pve: false,
  resources: false,
  commander: false,
  tcg: false,
};

interface FeatureState {
  features: Record<string, FeatureFlag>;
  capabilities: Capabilities;
  loaded: boolean;
  // Actions
  loadFeatures: () => Promise<void>;
  setCapabilities: (caps: Partial<Capabilities>) => void;
  // Selector helper
  isEnabled: (key: string) => boolean;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useFeatureStore = create<FeatureState>((set, get) => ({
  features: {},
  capabilities: DEFAULT_CAPABILITIES,
  loaded: false,

  /**
   * Fetch feature flags from the server and map the array into a keyed Record.
   * Errors are silently swallowed — feature flags must never block the app start.
   */
  loadFeatures: async () => {
    try {
      const response = await featureApi.getAll();
      const rawList: Array<{ key: string; enabled: boolean; config: Record<string, unknown> }> =
        response.data?.data?.features ?? [];

      const features: Record<string, FeatureFlag> = {};
      for (const item of rawList) {
        features[item.key] = { enabled: item.enabled, config: item.config ?? {} };
      }

      set({ features, loaded: true });
    } catch {
      // Feature flags must not block app start — resolve with empty state
      set({ features: {}, loaded: true });
    }
  },

  /**
   * Called after login/session-restore when the server sends capabilities
   * inside data.capabilities. Merges with defensive defaults so missing keys
   * always fall back to false.
   */
  setCapabilities: (caps: Partial<Capabilities>) => {
    set({
      capabilities: {
        ...DEFAULT_CAPABILITIES,
        ...caps,
      },
    });
  },

  /** Returns true when the feature flag exists and is enabled. */
  isEnabled: (key: string) => {
    return get().features[key]?.enabled === true;
  },
}));

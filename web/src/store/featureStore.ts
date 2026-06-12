// ============================================================
// Feature flag store — loaded once at app start from GET /features.
// Old servers return 404 → treated as "all flags off"; the app still runs.
// ============================================================

import { create } from 'zustand';
import { featureApi } from '../api/client';
import type { ClientFeatureFlag } from '../api/types';

interface FeatureState {
  flags: ClientFeatureFlag[];
  loaded: boolean;
  load: () => Promise<void>;
  isEnabled: (key: string) => boolean;
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  flags: [],
  loaded: false,

  load: async () => {
    const flags = await featureApi.getAll();
    set({ flags, loaded: true });
  },

  isEnabled: (key) => {
    const flag = get().flags.find((f) => f.key === key);
    return Boolean(flag?.enabled);
  },
}));

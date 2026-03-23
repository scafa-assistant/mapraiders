import { create } from 'zustand';
import { questApi } from '../services/api';
import { Quest, QuestProgress } from '../navigation/types';

interface QuestState {
  nearbyQuests: Quest[];
  activeQuest: QuestProgress | null;
  isLoading: boolean;
  isVerifying: boolean;
  error: string | null;
  fetchNearby: (lat: number, lng: number, radius: number) => Promise<void>;
  fetchQuestDetail: (questId: string) => Promise<Quest | null>;
  startQuest: (questId: string) => Promise<void>;
  verifyStep: (questId: string, stepId: string, proof: any) => Promise<boolean>;
  abandonQuest: () => void;
  completeQuest: (questId: string, rating: number) => Promise<void>;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  nearbyQuests: [],
  activeQuest: null,
  isLoading: false,
  isVerifying: false,
  error: null,

  fetchNearby: async (lat: number, lng: number, radius: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await questApi.getNearby(lat, lng, radius);
      const quests = response.data?.data || response.data || [];
      set({ nearbyQuests: Array.isArray(quests) ? quests : [], isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to load quests.',
      });
    }
  },

  fetchQuestDetail: async (questId: string) => {
    try {
      const response = await questApi.getById(questId);
      return response.data as Quest;
    } catch (_err) {
      return null;
    }
  },

  startQuest: async (questId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await questApi.start(questId);
      const quest = response.data.quest as Quest;
      set({
        activeQuest: {
          questId,
          quest,
          currentStepIndex: 0,
          completedSteps: [],
          startedAt: new Date().toISOString(),
        },
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to start quest.',
      });
    }
  },

  verifyStep: async (questId: string, stepId: string, proof: any) => {
    set({ isVerifying: true });
    try {
      const formData = new FormData();
      if (proof.photo) {
        formData.append('photo', {
          uri: proof.photo,
          type: 'image/jpeg',
          name: 'verification.jpg',
        } as any);
      }
      if (proof.video) {
        formData.append('video', {
          uri: proof.video,
          type: 'video/mp4',
          name: 'verification.mp4',
        } as any);
      }
      if (proof.answer) {
        formData.append('answer', proof.answer);
      }
      if (proof.location) {
        formData.append('latitude', proof.location.latitude.toString());
        formData.append('longitude', proof.location.longitude.toString());
      }

      const response = await questApi.verifyStep(questId, stepId, formData);

      if (response.data.verified) {
        const { activeQuest } = get();
        if (activeQuest) {
          set({
            activeQuest: {
              ...activeQuest,
              currentStepIndex: activeQuest.currentStepIndex + 1,
              completedSteps: [...activeQuest.completedSteps, stepId],
            },
          });
        }
      }

      set({ isVerifying: false });
      return response.data.verified;
    } catch (_err) {
      set({ isVerifying: false });
      return false;
    }
  },

  abandonQuest: () => {
    set({ activeQuest: null });
  },

  completeQuest: async (questId: string, rating: number) => {
    try {
      await questApi.rate(questId, { rating });
      set({ activeQuest: null });
    } catch (_err) {
      set({ activeQuest: null });
    }
  },
}));

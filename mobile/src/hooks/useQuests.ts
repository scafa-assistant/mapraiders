import { useState, useEffect, useCallback } from 'react';
import { questApi } from '../services/api';
import type { Quest, QuestProgress } from '../utils/types';

interface UseQuestsReturn {
  /** Nearby quests. */
  quests: Quest[];
  /** Currently active quest progress, if any. */
  activeQuest: QuestProgress | null;
  /** Whether quests are loading. */
  isLoading: boolean;
  /** Error message, if any. */
  error: string | null;
  /** Start a quest by ID. */
  startQuest: (questId: string) => Promise<QuestProgress | null>;
  /** Verify a quest step with optional proof (photo/sensor data). */
  verifyStep: (questId: string, stepId: string, formData?: FormData) => Promise<boolean>;
  /** Rate a completed quest. */
  rateQuest: (questId: string, rating: { creativity: number; difficulty: number; worthIt: number; comment?: string }) => Promise<void>;
  /** Refresh nearby quests. */
  refresh: () => Promise<void>;
  /** Clear any error. */
  clearError: () => void;
}

const DEFAULT_RADIUS = 2000; // 2km

/**
 * Hook for nearby quests and quest management.
 */
export function useQuests(lat?: number, lng?: number): UseQuestsReturn {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeQuest, setActiveQuest] = useState<QuestProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch quests near the provided location.
   */
  const fetchQuests = useCallback(async () => {
    if (lat === undefined || lng === undefined) return;

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await questApi.getNearby(lat, lng, DEFAULT_RADIUS);
      setQuests(Array.isArray(data) ? data : data.quests ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load quests';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [lat, lng]);

  // Fetch on location change
  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  /**
   * Start a quest.
   */
  const startQuest = useCallback(async (questId: string): Promise<QuestProgress | null> => {
    try {
      setError(null);
      const { data } = await questApi.start(questId);
      const progress: QuestProgress = data;
      setActiveQuest(progress);
      return progress;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start quest';
      setError(message);
      return null;
    }
  }, []);

  /**
   * Verify a quest step.
   */
  const verifyStep = useCallback(
    async (questId: string, stepId: string, formData?: FormData): Promise<boolean> => {
      try {
        setError(null);
        const fd = formData ?? new FormData();
        const { data } = await questApi.verifyStep(questId, stepId, fd);

        // Update active quest progress
        if (activeQuest && activeQuest.questId === questId) {
          setActiveQuest((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              completedSteps: [...prev.completedSteps, stepId],
              currentStepIndex: prev.currentStepIndex + 1,
            };
          });
        }

        return data.verified ?? data.success ?? true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Step verification failed';
        setError(message);
        return false;
      }
    },
    [activeQuest]
  );

  /**
   * Rate a completed quest.
   */
  const rateQuest = useCallback(
    async (
      questId: string,
      rating: { creativity: number; difficulty: number; worthIt: number; comment?: string }
    ): Promise<void> => {
      try {
        setError(null);
        await questApi.rate(questId, rating as unknown as Record<string, unknown>);

        // Clear active quest after rating
        if (activeQuest?.questId === questId) {
          setActiveQuest(null);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to rate quest';
        setError(message);
      }
    },
    [activeQuest]
  );

  const refresh = useCallback(async () => {
    await fetchQuests();
  }, [fetchQuests]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    quests,
    activeQuest,
    isLoading,
    error,
    startQuest,
    verifyStep,
    rateQuest,
    refresh,
    clearError,
  };
}

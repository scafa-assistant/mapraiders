import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { routeApi } from './api';

const QUEUE_KEY = '@gridwalker_offline_queue';

interface QueuedRoute {
  id: string;
  points: { latitude: number; longitude: number; timestamp: number; speed?: number; altitude?: number }[];
  class?: string;
  queuedAt: number;
}

class OfflineQueue {
  private queue: QueuedRoute[] = [];
  private isSyncing: boolean = false;

  /**
   * Load queue from AsyncStorage on init.
   */
  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (err) {
      console.error('[OfflineQueue] Failed to load queue:', err);
      this.queue = [];
    }
  }

  /**
   * Add a route to the queue (called when network is unavailable).
   */
  async enqueue(route: Omit<QueuedRoute, 'id' | 'queuedAt'>): Promise<void> {
    const entry: QueuedRoute = {
      ...route,
      id: `route_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      queuedAt: Date.now(),
    };

    this.queue.push(entry);
    await this.persist();
    console.log(`[OfflineQueue] Enqueued route ${entry.id}. Queue size: ${this.queue.length}`);
  }

  /**
   * Try to sync all queued routes. Returns counts of synced and failed uploads.
   */
  async sync(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || this.queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;
    const remaining: QueuedRoute[] = [];

    for (const route of this.queue) {
      try {
        await routeApi.upload({
          points: route.points,
          class: route.class,
        });
        synced++;
        console.log(`[OfflineQueue] Synced route ${route.id}`);
      } catch (err) {
        console.error(`[OfflineQueue] Failed to sync route ${route.id}:`, err);
        remaining.push(route);
        failed++;
      }
    }

    this.queue = remaining;
    await this.persist();
    this.isSyncing = false;

    console.log(`[OfflineQueue] Sync complete. Synced: ${synced}, Failed: ${failed}, Remaining: ${this.queue.length}`);
    return { synced, failed };
  }

  /**
   * Get queue size.
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Setup network listener - auto-sync when connection returns.
   * Returns a cleanup function to unsubscribe.
   */
  setupNetworkListener(): () => void {
    const unsubscribe: NetInfoSubscription = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false && this.queue.length > 0) {
        console.log('[OfflineQueue] Network restored, attempting sync...');
        this.sync();
      }
    });

    return unsubscribe;
  }

  /**
   * Persist the current queue to AsyncStorage.
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (err) {
      console.error('[OfflineQueue] Failed to persist queue:', err);
    }
  }
}

export const offlineQueue = new OfflineQueue();

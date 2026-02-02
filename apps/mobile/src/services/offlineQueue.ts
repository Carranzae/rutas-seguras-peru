/**
 * Ruta Segura Perú - Offline Queue Service
 * Handles GPS data caching when offline and sync on reconnect
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import api from './api';

// Storage keys
const OFFLINE_QUEUE_KEY = '@ruta_segura:offline_queue';
const LAST_SYNC_KEY = '@ruta_segura:last_sync';

export interface QueuedItem {
    id: string;
    type: 'tracking_point' | 'sos' | 'checkin';
    data: any;
    timestamp: number;
    retryCount: number;
    priority: 'high' | 'normal' | 'low';
}

export interface TrackingPointData {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    speed?: number;
    battery_level?: number;
    captured_at: string;  // ISO timestamp when captured offline
}

class OfflineQueueService {
    private queue: QueuedItem[] = [];
    private isOnline: boolean = true;
    private isSyncing: boolean = false;
    private networkUnsubscribe: (() => void) | null = null;

    constructor() {
        this.init();
    }

    /**
     * Initialize service and network listener
     */
    async init(): Promise<void> {
        await this.loadQueue();
        this.setupNetworkListener();
    }

    /**
     * Load persisted queue from storage
     */
    private async loadQueue(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
                console.log(`Loaded ${this.queue.length} items from offline queue`);
            }
        } catch (error) {
            console.error('Failed to load offline queue:', error);
            this.queue = [];
        }
    }

    /**
     * Persist queue to storage
     */
    private async saveQueue(): Promise<void> {
        try {
            await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }

    /**
     * Setup network change listener for auto-sync
     */
    private setupNetworkListener(): void {
        this.networkUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const wasOffline = !this.isOnline;
            this.isOnline = state.isConnected ?? false;

            // Trigger sync when coming back online
            if (wasOffline && this.isOnline) {
                console.log('Network restored - starting queue sync');
                this.syncQueue();
            }
        });
    }

    /**
     * Add tracking point to queue (caches locally if offline)
     */
    async addTrackingPoint(data: TrackingPointData): Promise<boolean> {
        if (this.isOnline) {
            // Try immediate upload
            try {
                await api.post('/tracking/points', data);
                return true;
            } catch (error) {
                // Network error - queue it
                console.log('Upload failed, queueing tracking point');
            }
        }

        // Queue for later
        const item: QueuedItem = {
            id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'tracking_point',
            data,
            timestamp: Date.now(),
            retryCount: 0,
            priority: 'normal',
        };

        this.queue.push(item);
        await this.saveQueue();

        console.log(`Queued tracking point. Total in queue: ${this.queue.length}`);
        return false;
    }

    /**
     * Add SOS alert to queue (high priority)
     */
    async addSOSAlert(data: any): Promise<boolean> {
        if (this.isOnline) {
            try {
                await api.post('/emergencies/sos', data);
                return true;
            } catch (error) {
                console.log('SOS upload failed, queueing');
            }
        }

        const item: QueuedItem = {
            id: `sos_${Date.now()}`,
            type: 'sos',
            data,
            timestamp: Date.now(),
            retryCount: 0,
            priority: 'high',  // SOS always high priority
        };

        // Insert at beginning for priority
        this.queue.unshift(item);
        await this.saveQueue();

        return false;
    }

    /**
     * Sync all queued items when online
     */
    async syncQueue(): Promise<{ synced: number; failed: number }> {
        if (this.isSyncing) {
            console.log('Sync already in progress');
            return { synced: 0, failed: 0 };
        }

        if (!this.isOnline) {
            console.log('Cannot sync - offline');
            return { synced: 0, failed: 0 };
        }

        if (this.queue.length === 0) {
            console.log('Queue empty - nothing to sync');
            return { synced: 0, failed: 0 };
        }

        this.isSyncing = true;
        let synced = 0;
        let failed = 0;

        console.log(`Starting sync of ${this.queue.length} queued items`);

        // Sort by priority (high first) then timestamp (oldest first)
        const sortedQueue = [...this.queue].sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            return a.timestamp - b.timestamp;
        });

        // Batch upload tracking points
        const trackingPoints = sortedQueue
            .filter(item => item.type === 'tracking_point')
            .map(item => item.data);

        if (trackingPoints.length > 0) {
            try {
                await api.post('/tracking/points/batch', { points: trackingPoints });
                synced += trackingPoints.length;

                // Remove synced items
                this.queue = this.queue.filter(
                    item => item.type !== 'tracking_point'
                );
            } catch (error) {
                console.error('Batch tracking sync failed:', error);
                failed += trackingPoints.length;
            }
        }

        // Sync SOS alerts individually (critical)
        const sosAlerts = sortedQueue.filter(item => item.type === 'sos');
        for (const alert of sosAlerts) {
            try {
                await api.post('/emergencies/sos', alert.data);
                synced++;

                // Remove from queue
                this.queue = this.queue.filter(item => item.id !== alert.id);
            } catch (error) {
                failed++;
                alert.retryCount++;

                if (alert.retryCount >= 3) {
                    console.error(`SOS alert ${alert.id} failed after 3 retries, removing`);
                    this.queue = this.queue.filter(item => item.id !== alert.id);
                }
            }
        }

        await this.saveQueue();
        await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

        this.isSyncing = false;

        console.log(`Sync complete: ${synced} synced, ${failed} failed, ${this.queue.length} remaining`);

        return { synced, failed };
    }

    /**
     * Get current queue status
     */
    getStatus(): { queueLength: number; isOnline: boolean; isSyncing: boolean } {
        return {
            queueLength: this.queue.length,
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
        };
    }

    /**
     * Get pending items count by type
     */
    getPendingCount(): { tracking: number; sos: number; total: number } {
        return {
            tracking: this.queue.filter(i => i.type === 'tracking_point').length,
            sos: this.queue.filter(i => i.type === 'sos').length,
            total: this.queue.length,
        };
    }

    /**
     * Clear all queued items (use with caution)
     */
    async clearQueue(): Promise<void> {
        this.queue = [];
        await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
        console.log('Offline queue cleared');
    }

    /**
     * Cleanup on app close
     */
    cleanup(): void {
        if (this.networkUnsubscribe) {
            this.networkUnsubscribe();
        }
    }
}

// Singleton instance
export const offlineQueue = new OfflineQueueService();
export default offlineQueue;

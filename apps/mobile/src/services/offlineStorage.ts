/**
 * Ruta Segura - Offline Storage Service
 * Manages local storage for offline functionality using AsyncStorage
 * Note: For production, consider using expo-sqlite or WatermelonDB
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Types
export interface PendingSync {
    id: string;
    type: 'location' | 'sos' | 'checkin' | 'message';
    data: Record<string, unknown>;
    timestamp: string;
    retries: number;
}

export interface CachedLocation {
    id?: number;
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    timestamp: string;
    synced: boolean;
}

export interface OfflineState {
    isOnline: boolean;
    lastSyncTime: string | null;
    pendingCount: number;
    cacheSize: number;
}

interface TourCacheEntry {
    id: string;
    data: string;
}

// Storage keys
const KEYS = {
    PENDING_SYNC: 'offline_pending_sync',
    LOCATION_CACHE: 'offline_locations',
    USER_DATA: 'offline_user',
    TOURS_CACHE: 'offline_tours',
    LAST_SYNC: 'last_sync_time',
    OFFLINE_MODE: 'offline_mode_enabled',
};

class OfflineStorageService {
    private isInitialized = false;
    private syncQueue: PendingSync[] = [];
    private locations: CachedLocation[] = [];
    private unsubscribeNetInfo: (() => void) | null = null;

    /**
     * Initialize offline storage
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Load existing data from AsyncStorage
            await this.loadSyncQueue();
            await this.loadLocations();

            // Subscribe to network changes
            this.subscribeToNetwork();

            this.isInitialized = true;
            console.log('[Offline] Storage initialized');
        } catch (error) {
            console.error('[Offline] Initialization error:', error);
        }
    }

    /**
     * Load locations from storage
     */
    private async loadLocations(): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(KEYS.LOCATION_CACHE);
            if (data) {
                this.locations = JSON.parse(data);
            }
        } catch (error) {
            console.error('[Offline] Error loading locations:', error);
        }
    }

    /**
     * Save locations to storage
     */
    private async saveLocationsToStorage(): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.LOCATION_CACHE, JSON.stringify(this.locations));
        } catch (error) {
            console.error('[Offline] Error saving locations:', error);
        }
    }

    /**
     * Subscribe to network state changes
     */
    private subscribeToNetwork(): void {
        this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
            console.log('[Offline] Network state:', state.isConnected ? 'online' : 'offline');

            if (state.isConnected && this.syncQueue.length > 0) {
                this.processSyncQueue();
            }
        });
    }

    // ============================================
    // LOCATION CACHING
    // ============================================

    /**
     * Save location locally (for offline GPS tracking)
     */
    async saveLocation(location: Omit<CachedLocation, 'synced'>): Promise<void> {
        try {
            const newLocation: CachedLocation = {
                ...location,
                id: Date.now(),
                synced: false,
            };
            this.locations.push(newLocation);
            await this.saveLocationsToStorage();
        } catch (error) {
            console.error('[Offline] Error saving location:', error);
        }
    }

    /**
     * Get all unsynced locations
     */
    async getUnsyncedLocations(): Promise<CachedLocation[]> {
        return this.locations.filter(loc => !loc.synced).slice(0, 100);
    }

    /**
     * Mark locations as synced
     */
    async markLocationsSynced(ids: number[]): Promise<void> {
        if (ids.length === 0) return;

        try {
            this.locations = this.locations.map(loc =>
                ids.includes(loc.id || 0) ? { ...loc, synced: true } : loc
            );
            await this.saveLocationsToStorage();
        } catch (error) {
            console.error('[Offline] Error marking locations synced:', error);
        }
    }

    /**
     * Clear old synced locations (housekeeping)
     */
    async clearOldLocations(daysOld = 7): Promise<void> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const cutoff = cutoffDate.toISOString();

            this.locations = this.locations.filter(
                loc => !loc.synced || loc.timestamp >= cutoff
            );
            await this.saveLocationsToStorage();
        } catch (error) {
            console.error('[Offline] Error clearing old locations:', error);
        }
    }

    // ============================================
    // SYNC QUEUE
    // ============================================

    /**
     * Add item to sync queue
     */
    async addToSyncQueue(item: Omit<PendingSync, 'retries'>): Promise<void> {
        const syncItem: PendingSync = { ...item, retries: 0 };
        this.syncQueue.push(syncItem);

        // Persist to storage
        await this.saveSyncQueueToStorage();

        // Try to sync immediately if online
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            this.processSyncQueue();
        }
    }

    /**
     * Save sync queue to storage
     */
    private async saveSyncQueueToStorage(): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(this.syncQueue));
        } catch (error) {
            console.error('[Offline] Error saving sync queue:', error);
        }
    }

    /**
     * Load sync queue from storage
     */
    private async loadSyncQueue(): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(KEYS.PENDING_SYNC);
            if (data) {
                this.syncQueue = JSON.parse(data);
            }
            console.log(`[Offline] Loaded ${this.syncQueue.length} pending items`);
        } catch (error) {
            console.error('[Offline] Error loading sync queue:', error);
        }
    }

    /**
     * Process pending sync queue
     */
    async processSyncQueue(): Promise<void> {
        if (this.syncQueue.length === 0) return;

        console.log(`[Offline] Processing ${this.syncQueue.length} pending items`);

        for (const item of [...this.syncQueue]) {
            try {
                const success = await this.syncItem(item);

                if (success) {
                    // Remove from queue
                    this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
                    await this.saveSyncQueueToStorage();
                } else {
                    // Increment retry count
                    item.retries++;
                    if (item.retries >= 5) {
                        console.warn(`[Offline] Giving up on item ${item.id} after 5 retries`);
                        this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
                        await this.saveSyncQueueToStorage();
                    }
                }
            } catch (error) {
                console.error(`[Offline] Error syncing item ${item.id}:`, error);
            }
        }

        // Update last sync time
        await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
    }

    /**
     * Sync individual item to server
     */
    private async syncItem(item: PendingSync): Promise<boolean> {
        // This should be overridden with actual API calls
        // For now, just log
        console.log(`[Offline] Syncing ${item.type}:`, item.id);

        // TODO: Implement actual API calls based on item.type
        // switch (item.type) {
        //   case 'location':
        //     return await trackingService.syncLocations(item.data);
        //   case 'sos':
        //     return await emergencyService.syncSOS(item.data);
        //   ...
        // }

        return true; // Mock success
    }

    // ============================================
    // CACHE MANAGEMENT
    // ============================================

    /**
     * Cache tours for offline viewing
     */
    async cacheTours(tours: Array<{ id: string;[key: string]: unknown }>): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.TOURS_CACHE, JSON.stringify(tours));
            console.log(`[Offline] Cached ${tours.length} tours`);
        } catch (error) {
            console.error('[Offline] Error caching tours:', error);
        }
    }

    /**
     * Get cached tours
     */
    async getCachedTours(): Promise<Array<Record<string, unknown>>> {
        try {
            const data = await AsyncStorage.getItem(KEYS.TOURS_CACHE);
            if (data) {
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('[Offline] Error getting cached tours:', error);
            return [];
        }
    }

    // ============================================
    // STATE & UTILS
    // ============================================

    /**
     * Get current offline state
     */
    async getState(): Promise<OfflineState> {
        const netInfo = await NetInfo.fetch();
        const lastSync = await AsyncStorage.getItem(KEYS.LAST_SYNC);

        return {
            isOnline: netInfo.isConnected ?? false,
            lastSyncTime: lastSync,
            pendingCount: this.syncQueue.length,
            cacheSize: 0, // TODO: Calculate actual size
        };
    }

    /**
     * Check if we're in offline mode
     */
    async isOfflineMode(): Promise<boolean> {
        const netInfo = await NetInfo.fetch();
        return !netInfo.isConnected;
    }

    /**
     * Force sync all pending data
     */
    async forceSyncAll(): Promise<void> {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            console.warn('[Offline] Cannot sync - no connection');
            return;
        }

        // Sync locations
        const locations = await this.getUnsyncedLocations();
        if (locations.length > 0) {
            // TODO: Call actual API to sync locations
            console.log(`[Offline] Syncing ${locations.length} locations`);
        }

        // Process sync queue
        await this.processSyncQueue();
    }

    /**
     * Cleanup resources
     */
    dispose(): void {
        if (this.unsubscribeNetInfo) {
            this.unsubscribeNetInfo();
        }
    }
}

// Singleton instance
export const offlineStorage = new OfflineStorageService();

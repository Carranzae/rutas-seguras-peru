/**
 * Ruta Segura - Offline Mode Hook
 * React hook for offline mode management in mobile app
 */
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';
import { OfflineState, offlineStorage } from '../services/offlineStorage';

export interface UseOfflineModeReturn {
    isOnline: boolean;
    isInitialized: boolean;
    offlineState: OfflineState | null;
    pendingCount: number;
    sync: () => Promise<void>;
    saveLocationOffline: (location: {
        latitude: number;
        longitude: number;
        altitude?: number;
        accuracy?: number;
    }) => Promise<void>;
}

export function useOfflineMode(): UseOfflineModeReturn {
    const [isOnline, setIsOnline] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [offlineState, setOfflineState] = useState<OfflineState | null>(null);
    const [pendingCount, setPendingCount] = useState(0);

    // Initialize on mount
    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                // Initialize offline storage
                await offlineStorage.initialize();

                // Get initial state
                const state = await offlineStorage.getState();
                if (mounted) {
                    setOfflineState(state);
                    setIsOnline(state.isOnline);
                    setPendingCount(state.pendingCount);
                    setIsInitialized(true);
                }
            } catch (error) {
                console.error('[useOfflineMode] Init error:', error);
                if (mounted) {
                    setIsInitialized(true);
                }
            }
        }

        init();

        // Subscribe to network changes
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            if (mounted) {
                setIsOnline(state.isConnected ?? false);

                // Trigger sync when coming back online
                if (state.isConnected) {
                    offlineStorage.processSyncQueue();
                }
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    // Refresh state periodically
    useEffect(() => {
        const interval = setInterval(async () => {
            const state = await offlineStorage.getState();
            setOfflineState(state);
            setPendingCount(state.pendingCount);
        }, 10000); // Every 10 seconds

        return () => clearInterval(interval);
    }, []);

    // Force sync
    const sync = useCallback(async () => {
        await offlineStorage.forceSyncAll();
        const state = await offlineStorage.getState();
        setOfflineState(state);
        setPendingCount(state.pendingCount);
    }, []);

    // Save location for offline sync
    const saveLocationOffline = useCallback(async (location: {
        latitude: number;
        longitude: number;
        altitude?: number;
        accuracy?: number;
    }) => {
        await offlineStorage.saveLocation({
            ...location,
            timestamp: new Date().toISOString(),
        });
    }, []);

    return {
        isOnline,
        isInitialized,
        offlineState,
        pendingCount,
        sync,
        saveLocationOffline,
    };
}

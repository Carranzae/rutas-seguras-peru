/**
 * Ruta Segura Perú - Tracking Store
 * Global tracking state with Zustand
 */
import { create } from 'zustand';
import { liveTrackingService } from '../services/liveTrackingService';
import { locationService } from '../services/locationService';
import type { GroupMember, LocationData, TrackingState } from '../types';

interface TrackingActions {
    // Actions
    startTracking: (config: {
        userType: 'guide' | 'tourist';
        userName: string;
        tourId?: string;
    }) => Promise<boolean>;
    stopTracking: () => void;
    sendSOS: (message?: string) => Promise<void>;
    updateLocation: (location: LocationData) => void;
    updateGroupMembers: (members: GroupMember[]) => void;
    reset: () => void;
}

const initialState: TrackingState = {
    isTracking: false,
    currentLocation: null,
    lastAnalysis: null,
    groupMembers: [],
    connectionState: 'disconnected',
    batteryLevel: null,
};

export const useTrackingStore = create<TrackingState & TrackingActions>()((set, get) => ({
    ...initialState,

    /**
     * Start live tracking
     */
    startTracking: async (config) => {
        const started = await liveTrackingService.startTracking({
            ...config,
            intervalMs: 10000,

            onLocationUpdate: (location, analysis) => {
                set({
                    currentLocation: location,
                    lastAnalysis: analysis || null,
                });
            },

            onGroupUpdate: (members) => {
                // Merge with existing members
                const existing = get().groupMembers;
                const updated = [...existing];

                members.forEach(member => {
                    const idx = updated.findIndex(m => m.user_id === member.user_id);
                    if (idx >= 0) {
                        updated[idx] = member;
                    } else {
                        updated.push(member);
                    }
                });

                set({ groupMembers: updated });
            },

            onConnectionChange: (state) => {
                set({ connectionState: state });
            },
        });

        if (started) {
            const battery = await locationService.getBatteryLevel();
            set({ isTracking: true, batteryLevel: battery });
        }

        return started;
    },

    /**
     * Stop tracking
     */
    stopTracking: () => {
        liveTrackingService.stopTracking();
        set({
            isTracking: false,
            connectionState: 'disconnected',
            groupMembers: [],
        });
    },

    /**
     * Send SOS
     */
    sendSOS: async (message) => {
        await liveTrackingService.sendSOS(message);
    },

    /**
     * Update current location
     */
    updateLocation: (location) => {
        set({ currentLocation: location });
    },

    /**
     * Update group members
     */
    updateGroupMembers: (members) => {
        set({ groupMembers: members });
    },

    /**
     * Reset store
     */
    reset: () => {
        liveTrackingService.stopTracking();
        set(initialState);
    },
}));

export default useTrackingStore;

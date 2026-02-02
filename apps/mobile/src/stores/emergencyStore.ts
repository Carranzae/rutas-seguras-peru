/**
 * Ruta Segura Perú - Emergency Mode Store
 * Global state management for emergency mode using Zustand
 * Handles app-wide emergency state, haptic feedback, and UI changes
 */
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ============================================
// TYPES
// ============================================

export type EmergencyStatus = 'inactive' | 'activating' | 'active' | 'responding' | 'resolved';
export type EmergencyType = 'SOS' | 'MEDICAL' | 'SECURITY' | 'ACCIDENT';

export interface EmergencyLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
}

export interface EmergencyContact {
    id: string;
    name: string;
    role: 'guide' | 'agency' | 'authority' | 'emergency_contact';
    status: 'notified' | 'responding' | 'arrived';
    eta?: number; // minutes
}

export interface EmergencyState {
    // Core state
    isEmergencyMode: boolean;
    status: EmergencyStatus;
    type: EmergencyType | null;
    emergencyId: string | null;

    // Timing
    activatedAt: number | null;
    resolvedAt: number | null;
    elapsedSeconds: number;

    // Location
    lastLocation: EmergencyLocation | null;
    locationHistory: EmergencyLocation[];

    // Responders
    respondingContacts: EmergencyContact[];
    estimatedArrival: number | null; // minutes

    // UI State
    isVibrating: boolean;
    isPulsing: boolean;
    showOverlay: boolean;

    // Actions
    activateEmergency: (type: EmergencyType, location?: EmergencyLocation) => Promise<string>;
    updateLocation: (location: EmergencyLocation) => void;
    addResponder: (contact: EmergencyContact) => void;
    updateResponderStatus: (contactId: string, status: EmergencyContact['status']) => void;
    resolveEmergency: () => void;
    cancelEmergency: () => void;

    // UI Actions
    startPulsingAnimation: () => void;
    stopPulsingAnimation: () => void;
    triggerHapticFeedback: () => void;

    // Timer
    startTimer: () => void;
    stopTimer: () => void;

    // Reset
    reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
    isEmergencyMode: false,
    status: 'inactive' as EmergencyStatus,
    type: null as EmergencyType | null,
    emergencyId: null as string | null,
    activatedAt: null as number | null,
    resolvedAt: null as number | null,
    elapsedSeconds: 0,
    lastLocation: null as EmergencyLocation | null,
    locationHistory: [] as EmergencyLocation[],
    respondingContacts: [] as EmergencyContact[],
    estimatedArrival: null as number | null,
    isVibrating: false,
    isPulsing: false,
    showOverlay: false,
};

// ============================================
// STORE
// ============================================

let timerInterval: NodeJS.Timeout | null = null;
let vibrationInterval: NodeJS.Timeout | null = null;

export const useEmergencyStore = create<EmergencyState>()(
    immer((set, get) => ({
        ...initialState,

        /**
         * Activate emergency mode
         * Starts vibration, haptic feedback, and timer
         */
        activateEmergency: async (type: EmergencyType, location?: EmergencyLocation) => {
            const emergencyId = `EM-${Date.now()}`;

            set((state) => {
                state.isEmergencyMode = true;
                state.status = 'activating';
                state.type = type;
                state.emergencyId = emergencyId;
                state.activatedAt = Date.now();
                state.showOverlay = true;
                state.isPulsing = true;
                if (location) {
                    state.lastLocation = location;
                    state.locationHistory.push(location);
                }
            });

            // Trigger haptic and vibration
            get().triggerHapticFeedback();
            get().startTimer();

            // Start continuous vibration for emergency
            vibrationInterval = setInterval(() => {
                if (Platform.OS === 'android') {
                    Vibration.vibrate([0, 500, 200, 500]);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
            }, 2000);

            set((state) => {
                state.isVibrating = true;
                state.status = 'active';
            });

            return emergencyId;
        },

        /**
         * Update current location during emergency
         */
        updateLocation: (location: EmergencyLocation) => {
            set((state) => {
                state.lastLocation = location;
                state.locationHistory.push(location);
                // Keep only last 100 points
                if (state.locationHistory.length > 100) {
                    state.locationHistory = state.locationHistory.slice(-100);
                }
            });
        },

        /**
         * Add a responding contact
         */
        addResponder: (contact: EmergencyContact) => {
            set((state) => {
                const existing = state.respondingContacts.find(c => c.id === contact.id);
                if (!existing) {
                    state.respondingContacts.push(contact);
                }
                // Calculate minimum ETA
                const etas = state.respondingContacts
                    .filter(c => c.eta)
                    .map(c => c.eta!);
                if (etas.length > 0) {
                    state.estimatedArrival = Math.min(...etas);
                }
            });
        },

        /**
         * Update responder status
         */
        updateResponderStatus: (contactId: string, status: EmergencyContact['status']) => {
            set((state) => {
                const contact = state.respondingContacts.find(c => c.id === contactId);
                if (contact) {
                    contact.status = status;
                }
                // If anyone arrived, change status to responding
                if (status === 'arrived' && state.status === 'active') {
                    state.status = 'responding';
                }
            });
        },

        /**
         * Resolve emergency (help arrived, situation handled)
         */
        resolveEmergency: () => {
            get().stopTimer();

            if (vibrationInterval) {
                clearInterval(vibrationInterval);
                vibrationInterval = null;
            }
            Vibration.cancel();

            set((state) => {
                state.status = 'resolved';
                state.resolvedAt = Date.now();
                state.isVibrating = false;
                state.isPulsing = false;
            });

            // Success haptic
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },

        /**
         * Cancel emergency (false alarm)
         */
        cancelEmergency: () => {
            get().stopTimer();

            if (vibrationInterval) {
                clearInterval(vibrationInterval);
                vibrationInterval = null;
            }
            Vibration.cancel();

            set((state) => {
                state.isEmergencyMode = false;
                state.status = 'inactive';
                state.showOverlay = false;
                state.isPulsing = false;
                state.isVibrating = false;
            });
        },

        /**
         * Start pulsing animation flag
         */
        startPulsingAnimation: () => {
            set((state) => {
                state.isPulsing = true;
            });
        },

        /**
         * Stop pulsing animation
         */
        stopPulsingAnimation: () => {
            set((state) => {
                state.isPulsing = false;
            });
        },

        /**
         * Trigger haptic feedback
         */
        triggerHapticFeedback: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        },

        /**
         * Start elapsed time timer
         */
        startTimer: () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }

            timerInterval = setInterval(() => {
                set((state) => {
                    state.elapsedSeconds += 1;
                });
            }, 1000);
        },

        /**
         * Stop timer
         */
        stopTimer: () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        },

        /**
         * Reset to initial state
         */
        reset: () => {
            get().stopTimer();
            if (vibrationInterval) {
                clearInterval(vibrationInterval);
                vibrationInterval = null;
            }
            Vibration.cancel();

            set(initialState);
        },
    }))
);

// ============================================
// SELECTORS (for performance)
// ============================================

export const selectIsEmergencyActive = (state: EmergencyState) =>
    state.status === 'active' || state.status === 'responding';

export const selectElapsedTimeFormatted = (state: EmergencyState) => {
    const mins = Math.floor(state.elapsedSeconds / 60);
    const secs = state.elapsedSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const selectRespondersCount = (state: EmergencyState) =>
    state.respondingContacts.filter(c => c.status === 'responding' || c.status === 'arrived').length;

export default useEmergencyStore;

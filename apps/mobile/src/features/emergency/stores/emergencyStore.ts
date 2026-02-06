/**
 * Ruta Segura Perú - Emergency Store
 * Global emergency state with Zustand
 */
import { AppError } from '@/src/core/errors';
import { create } from 'zustand';
import { sosService } from '../services/sosService';
import type { Emergency } from '../types';

interface EmergencyState {
    // State
    activeEmergency: Emergency | null;
    isSOSActive: boolean;
    isSending: boolean;
    countdown: number;
    coercionPIN: string | null;
    error: string | null;

    // Actions
    sendSOS: (message?: string) => Promise<Emergency>;
    startCountdown: (seconds?: number) => void;
    cancelCountdown: () => void;
    resolveEmergency: (reason: 'resolved' | 'false_alarm') => Promise<void>;
    setCoercionPIN: (pin: string) => void;
    checkForActiveEmergency: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

const initialState = {
    activeEmergency: null,
    isSOSActive: false,
    isSending: false,
    countdown: 0,
    coercionPIN: null,
    error: null,
};

let countdownInterval: ReturnType<typeof setInterval> | null = null;

export const useEmergencyStore = create<EmergencyState>()((set, get) => ({
    ...initialState,

    sendSOS: async (message) => {
        set({ isSending: true, error: null });
        try {
            const emergency = await sosService.sendSOS(message);
            set({
                activeEmergency: emergency,
                isSOSActive: true,
                countdown: 0,
            });
            return emergency;
        } catch (error) {
            const appError = AppError.from(error);
            set({ error: appError.getUserMessage() });
            throw appError;
        } finally {
            set({ isSending: false });
        }
    },

    startCountdown: (seconds = 5) => {
        set({ countdown: seconds });

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(() => {
            const current = get().countdown;
            if (current <= 1) {
                clearInterval(countdownInterval!);
                countdownInterval = null;
                // Auto-send SOS
                get().sendSOS();
            } else {
                set({ countdown: current - 1 });
            }
        }, 1000);
    },

    cancelCountdown: () => {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        set({ countdown: 0 });
    },

    resolveEmergency: async (reason) => {
        const { activeEmergency } = get();
        if (!activeEmergency) return;

        try {
            await sosService.resolveEmergency(activeEmergency.id, reason);
            set({
                activeEmergency: null,
                isSOSActive: false,
            });
        } catch (error) {
            const appError = AppError.from(error);
            set({ error: appError.getUserMessage() });
            throw appError;
        }
    },

    setCoercionPIN: (pin) => {
        set({ coercionPIN: pin });
    },

    checkForActiveEmergency: async () => {
        try {
            const emergency = await sosService.getActiveEmergency();
            if (emergency) {
                set({
                    activeEmergency: emergency,
                    isSOSActive: true,
                });
            }
        } catch {
            // No active emergency
        }
    },

    clearError: () => set({ error: null }),

    reset: () => {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        set(initialState);
    },
}));

export default useEmergencyStore;

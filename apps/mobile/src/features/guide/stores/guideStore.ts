/**
 * Ruta Segura Perú - Guide Store
 * Global guide state with Zustand
 */
import { AppError } from '@/src/core/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { guideService } from '../services/guideService';
import { verificationService } from '../services/verificationService';
import type { ActiveTour, GuideProfile, VerificationData } from '../types';

interface GuideState {
    // State
    profile: GuideProfile | null;
    activeTour: ActiveTour | null;
    isOnDuty: boolean;
    isLoading: boolean;
    error: string | null;
    verificationProgress: {
        dircetur_front: boolean;
        dircetur_back: boolean;
        selfie: boolean;
        biometric: boolean;
    };

    // Actions
    loadProfile: () => Promise<GuideProfile>;
    updateProfile: (data: Partial<GuideProfile>) => Promise<void>;
    setOnDuty: (isOnDuty: boolean) => Promise<void>;
    startTour: (tour: ActiveTour) => Promise<boolean>;
    endTour: () => void;
    uploadDirceturFront: (photoUri: string) => Promise<void>;
    uploadDirceturBack: (photoUri: string) => Promise<void>;
    uploadSelfie: (photoUri: string) => Promise<void>;
    registerBiometric: () => Promise<void>;
    submitVerification: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

const initialState = {
    profile: null,
    activeTour: null,
    isOnDuty: false,
    isLoading: false,
    error: null,
    verificationProgress: {
        dircetur_front: false,
        dircetur_back: false,
        selfie: false,
        biometric: false,
    },
};

export const useGuideStore = create<GuideState>()(
    persist(
        (set, get) => ({
            ...initialState,

            loadProfile: async () => {
                set({ isLoading: true, error: null });
                try {
                    const profile = await guideService.getMyProfile();
                    set({ profile, isOnDuty: profile.is_available });
                    return profile;
                } catch (error) {
                    const appError = AppError.from(error);
                    set({ error: appError.getUserMessage() });
                    throw appError;
                } finally {
                    set({ isLoading: false });
                }
            },

            updateProfile: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const profile = await guideService.updateProfile(data);
                    set({ profile });
                } catch (error) {
                    const appError = AppError.from(error);
                    set({ error: appError.getUserMessage() });
                    throw appError;
                } finally {
                    set({ isLoading: false });
                }
            },

            setOnDuty: async (isOnDuty) => {
                try {
                    await guideService.setAvailability(isOnDuty);
                    set({ isOnDuty });
                } catch (error) {
                    const appError = AppError.from(error);
                    set({ error: appError.getUserMessage() });
                    throw appError;
                }
            },

            startTour: async (tour) => {
                // Verify biometric before starting
                const verified = await verificationService.verifyBeforeTour();
                if (!verified) {
                    set({ error: 'Verificación biométrica requerida' });
                    return false;
                }

                set({ activeTour: tour });
                return true;
            },

            endTour: () => {
                set({ activeTour: null });
            },

            uploadDirceturFront: async (photoUri) => {
                const { profile } = get();
                if (!profile) throw new Error('No profile loaded');

                set({ isLoading: true });
                try {
                    await verificationService.uploadDirceturfrontPhoto(profile.id, photoUri);
                    set(state => ({
                        verificationProgress: {
                            ...state.verificationProgress,
                            dircetur_front: true,
                        },
                    }));
                } finally {
                    set({ isLoading: false });
                }
            },

            uploadDirceturBack: async (photoUri) => {
                const { profile } = get();
                if (!profile) throw new Error('No profile loaded');

                set({ isLoading: true });
                try {
                    await verificationService.uploadDirceturBackPhoto(profile.id, photoUri);
                    set(state => ({
                        verificationProgress: {
                            ...state.verificationProgress,
                            dircetur_back: true,
                        },
                    }));
                } finally {
                    set({ isLoading: false });
                }
            },

            uploadSelfie: async (photoUri) => {
                const { profile } = get();
                if (!profile) throw new Error('No profile loaded');

                set({ isLoading: true });
                try {
                    await verificationService.uploadSelfie(profile.id, photoUri);
                    set(state => ({
                        verificationProgress: {
                            ...state.verificationProgress,
                            selfie: true,
                        },
                    }));
                } finally {
                    set({ isLoading: false });
                }
            },

            registerBiometric: async () => {
                const { profile } = get();
                if (!profile) throw new Error('No profile loaded');

                set({ isLoading: true });
                try {
                    await verificationService.registerBiometric(profile.id);
                    set(state => ({
                        verificationProgress: {
                            ...state.verificationProgress,
                            biometric: true,
                        },
                    }));
                } catch (error) {
                    const appError = AppError.from(error);
                    set({ error: appError.getUserMessage() });
                    throw appError;
                } finally {
                    set({ isLoading: false });
                }
            },

            submitVerification: async () => {
                const { profile, verificationProgress } = get();
                if (!profile) throw new Error('No profile loaded');

                // Check all steps completed
                const allComplete = Object.values(verificationProgress).every(v => v);
                if (!allComplete) {
                    throw new Error('Complete all verification steps first');
                }

                set({ isLoading: true });
                try {
                    const updatedProfile = await verificationService.submitVerification(
                        profile.id,
                        {} as VerificationData // Data already uploaded
                    );
                    set({ profile: updatedProfile });
                } finally {
                    set({ isLoading: false });
                }
            },

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        {
            name: 'guide-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isOnDuty: state.isOnDuty,
                verificationProgress: state.verificationProgress,
            }),
        }
    )
);

export default useGuideStore;

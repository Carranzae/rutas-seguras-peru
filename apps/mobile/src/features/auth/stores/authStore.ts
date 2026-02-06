/**
 * Ruta Segura Perú - Auth Store
 * Global authentication state with Zustand
 */
import { AppError } from '@/src/core/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import { biometricService, type BiometricCapabilities } from '../services/biometricService';
import type { LoginRequest, RegisterRequest, User } from '../types';

interface AuthState {
    // State
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    biometricCapabilities: BiometricCapabilities | null;
    biometricEnabled: boolean;
    error: string | null;

    // Actions
    initialize: () => Promise<void>;
    login: (credentials: LoginRequest) => Promise<User>;
    register: (data: RegisterRequest) => Promise<User>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<User>;
    updateProfile: (data: Partial<User>) => Promise<User>;
    checkBiometrics: () => Promise<BiometricCapabilities>;
    enableBiometric: () => Promise<boolean>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false,
            biometricCapabilities: null,
            biometricEnabled: false,
            error: null,

            /**
             * Initialize auth state from storage
             */
            initialize: async () => {
                if (get().isInitialized) return;

                try {
                    set({ isLoading: true });

                    const user = await authService.getCurrentUser();
                    const isAuthenticated = authService.isAuthenticated();

                    set({
                        user,
                        isAuthenticated: isAuthenticated && !!user,
                        isInitialized: true,
                    });

                    // Check biometric capabilities
                    const caps = await biometricService.checkCapabilities();
                    set({ biometricCapabilities: caps });
                } catch (error) {
                    console.error('[AuthStore] Initialize error:', error);
                    set({ isInitialized: true });
                } finally {
                    set({ isLoading: false });
                }
            },

            /**
             * Login with email/password
             */
            login: async (credentials) => {
                set({ isLoading: true, error: null });

                try {
                    const { user } = await authService.login(credentials);

                    set({
                        user,
                        isAuthenticated: true,
                    });

                    return user;
                } catch (error) {
                    const appError = AppError.from(error);
                    set({ error: appError.getUserMessage() });
                    throw appError;
                } finally {
                    set({ isLoading: false });
                }
            },

            /**
             * Register new user
             */
            register: async (data) => {
                set({ isLoading: true, error: null });

                try {
                    const user = await authService.register(data);
                    return user;
                } catch (error) {
                    const appError = AppError.from(error);
                    set({ error: appError.getUserMessage() });
                    throw appError;
                } finally {
                    set({ isLoading: false });
                }
            },

            /**
             * Logout user
             */
            logout: async () => {
                set({ isLoading: true });

                try {
                    await authService.logout();
                    set({
                        user: null,
                        isAuthenticated: false,
                        biometricEnabled: false,
                    });
                } finally {
                    set({ isLoading: false });
                }
            },

            /**
             * Refresh user profile
             */
            refreshProfile: async () => {
                try {
                    const user = await authService.refreshProfile();
                    set({ user });
                    return user;
                } catch (error) {
                    const appError = AppError.from(error);
                    throw appError;
                }
            },

            /**
             * Update user profile
             */
            updateProfile: async (data) => {
                set({ isLoading: true, error: null });

                try {
                    const user = await authService.updateProfile(data);
                    set({ user });
                    return user;
                } catch (error) {
                    const appError = AppError.from(error);
                    set({ error: appError.getUserMessage() });
                    throw appError;
                } finally {
                    set({ isLoading: false });
                }
            },

            /**
             * Check biometric capabilities
             */
            checkBiometrics: async () => {
                const caps = await biometricService.checkCapabilities();
                set({ biometricCapabilities: caps });
                return caps;
            },

            /**
             * Enable biometric authentication
             */
            enableBiometric: async () => {
                try {
                    const result = await biometricService.authenticate(
                        'Habilitar inicio de sesión biométrico'
                    );

                    if (result.success) {
                        set({ biometricEnabled: true });
                        return true;
                    }
                    return false;
                } catch {
                    return false;
                }
            },

            /**
             * Clear error
             */
            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                biometricEnabled: state.biometricEnabled,
            }),
        }
    )
);

export default useAuthStore;

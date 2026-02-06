/**
 * Ruta Segura Perú - useAuth Hook
 * Convenience hook for auth operations
 */
import { useCallback } from 'react';
import { biometricService } from '../services/biometricService';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
    const store = useAuthStore();

    const loginWithBiometric = useCallback(async () => {
        if (!store.biometricEnabled) {
            throw new Error('Biometric login not enabled');
        }

        const result = await biometricService.authenticate(
            'Inicia sesión con biométrico'
        );

        if (!result.success) {
            throw new Error(result.error || 'Biometric authentication failed');
        }

        // For biometric login, we just verify the biometric
        // The actual auth token should already be stored
        return store.user;
    }, [store.biometricEnabled, store.user]);

    return {
        // State
        user: store.user,
        isAuthenticated: store.isAuthenticated,
        isLoading: store.isLoading,
        isInitialized: store.isInitialized,
        error: store.error,
        biometricCapabilities: store.biometricCapabilities,
        biometricEnabled: store.biometricEnabled,

        // Computed
        isGuide: store.user?.role === 'guide',
        isTourist: store.user?.role === 'tourist',
        isAdmin: store.user?.role === 'super_admin' || store.user?.role === 'agency_admin',
        isVerified: store.user?.is_verified ?? false,

        // Actions
        initialize: store.initialize,
        login: store.login,
        register: store.register,
        logout: store.logout,
        refreshProfile: store.refreshProfile,
        updateProfile: store.updateProfile,
        checkBiometrics: store.checkBiometrics,
        enableBiometric: store.enableBiometric,
        clearError: store.clearError,
        loginWithBiometric,
    };
}

export default useAuth;

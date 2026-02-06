/**
 * Compatibility re-exports for legacy imports
 * TODO: Remove this file and update all imports to use @/src/features/auth
 */
export { biometricService } from '@/src/features/auth';
import { biometricService } from '@/src/features/auth';

export const useBiometricAuth = () => {
    return {
        authenticate: biometricService.authenticate.bind(biometricService),
        checkCapabilities: biometricService.checkCapabilities.bind(biometricService),
        registerForVerification: biometricService.registerForVerification.bind(biometricService),
        quickAuth: biometricService.quickAuth.bind(biometricService),
        isAvailable: true,
        supportedTypes: ['fingerprint', 'facial'],
    };
};

export default useBiometricAuth;

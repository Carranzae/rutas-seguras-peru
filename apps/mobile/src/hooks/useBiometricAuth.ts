/**
 * Ruta Segura Perú - Biometric Authentication Hook
 * Captures biometric data and generates cryptographic hashes
 * Uses expo-local-authentication for fingerprint/face recognition
 */
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricAuthResult {
    success: boolean;
    biometricHash: string | null;
    deviceSignature: string | null;
    biometricType: BiometricType;
    error?: string;
}

export interface BiometricCapabilities {
    isAvailable: boolean;
    hasHardware: boolean;
    hasEnrolledBiometrics: boolean;
    supportedTypes: BiometricType[];
    securityLevel: 'none' | 'weak' | 'strong';
}

/**
 * Hook for biometric authentication and identity verification
 */
export function useBiometricAuth() {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null);

    /**
     * Check device biometric capabilities
     */
    const checkCapabilities = useCallback(async (): Promise<BiometricCapabilities> => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const hasEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        const types: BiometricType[] = supportedTypes.map(type => {
            switch (type) {
                case LocalAuthentication.AuthenticationType.FINGERPRINT:
                    return 'fingerprint';
                case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
                    return 'facial';
                case LocalAuthentication.AuthenticationType.IRIS:
                    return 'iris';
                default:
                    return 'none';
            }
        }).filter(t => t !== 'none');

        const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
        const securityLevelMap: Record<number, 'none' | 'weak' | 'strong'> = {
            [LocalAuthentication.SecurityLevel.NONE]: 'none',
            [LocalAuthentication.SecurityLevel.SECRET]: 'weak',
            [LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK]: 'weak',
            [LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG]: 'strong',
        };

        const result: BiometricCapabilities = {
            isAvailable: hasHardware && hasEnrolled,
            hasHardware,
            hasEnrolledBiometrics: hasEnrolled,
            supportedTypes: types,
            securityLevel: securityLevelMap[securityLevel] || 'none',
        };

        setCapabilities(result);
        return result;
    }, []);

    /**
     * Generate device signature using device-specific identifiers
     * This acts as a salt for the biometric hash
     */
    const generateDeviceSignature = useCallback(async (): Promise<string> => {
        const deviceInfo = [
            Device.brand || 'unknown',
            Device.modelName || 'unknown',
            Device.osName || 'unknown',
            Device.osVersion || 'unknown',
            Device.deviceName || 'unknown',
            Platform.OS,
            Device.isDevice ? 'physical' : 'emulator',
        ].join('|');

        // Create SHA-256 hash of device info
        const signature = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            deviceInfo + Date.now().toString(),
        );

        return signature;
    }, []);

    /**
     * Generate biometric hash from authentication result
     * We NEVER send raw biometric data - only cryptographic hashes
     */
    const generateBiometricHash = useCallback(async (
        authSuccess: boolean,
        biometricType: BiometricType,
        deviceSignature: string,
    ): Promise<string> => {
        // Create unique biometric identifier
        const biometricData = [
            authSuccess ? 'authenticated' : 'failed',
            biometricType,
            deviceSignature,
            Date.now().toString(),
            Device.modelName || 'unknown',
        ].join(':');

        // Generate SHA-256 hash
        const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            biometricData,
        );

        return hash;
    }, []);

    /**
     * Authenticate user with biometrics
     * Returns cryptographic hash for server verification
     */
    const authenticate = useCallback(async (
        promptMessage: string = 'Verifica tu identidad',
        fallbackLabel: string = 'Usar contraseña',
    ): Promise<BiometricAuthResult> => {
        setIsAuthenticating(true);

        try {
            // Check capabilities first
            const caps = await checkCapabilities();

            if (!caps.isAvailable) {
                return {
                    success: false,
                    biometricHash: null,
                    deviceSignature: null,
                    biometricType: 'none',
                    error: 'Biometric authentication not available',
                };
            }

            // Generate device signature
            const deviceSignature = await generateDeviceSignature();

            // Authenticate
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                fallbackLabel,
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
                requireConfirmation: true,
            });

            if (!result.success) {
                return {
                    success: false,
                    biometricHash: null,
                    deviceSignature: null,
                    biometricType: caps.supportedTypes[0] || 'none',
                    error: result.error || 'Authentication failed',
                };
            }

            // Generate biometric hash
            const primaryType = caps.supportedTypes[0] || 'fingerprint';
            const biometricHash = await generateBiometricHash(
                true,
                primaryType,
                deviceSignature,
            );

            return {
                success: true,
                biometricHash,
                deviceSignature,
                biometricType: primaryType,
            };
        } catch (error) {
            return {
                success: false,
                biometricHash: null,
                deviceSignature: null,
                biometricType: 'none',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        } finally {
            setIsAuthenticating(false);
        }
    }, [checkCapabilities, generateDeviceSignature, generateBiometricHash]);

    /**
     * Register biometric for identity verification
     * This should be called during the verification flow
     */
    const registerForVerification = useCallback(async (): Promise<{
        biometricHash: string;
        deviceSignature: string;
        biometricType: string;
        deviceInfo: object;
    } | null> => {
        const authResult = await authenticate(
            'Registra tu biométrico para verificación',
            'Usar PIN',
        );

        if (!authResult.success || !authResult.biometricHash) {
            return null;
        }

        return {
            biometricHash: authResult.biometricHash,
            deviceSignature: authResult.deviceSignature!,
            biometricType: authResult.biometricType,
            deviceInfo: {
                brand: Device.brand,
                model: Device.modelName,
                os: Device.osName,
                osVersion: Device.osVersion,
                isPhysicalDevice: Device.isDevice,
            },
        };
    }, [authenticate]);

    return {
        isAuthenticating,
        capabilities,
        checkCapabilities,
        authenticate,
        registerForVerification,
    };
}

export default useBiometricAuth;

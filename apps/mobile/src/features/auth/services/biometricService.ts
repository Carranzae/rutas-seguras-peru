/**
 * Ruta Segura Perú - Biometric Service
 * Biometric authentication and identity verification
 */
import { AppError, ErrorCode } from '@/src/core/errors';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import type { BiometricData } from '../types';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricCapabilities {
    isAvailable: boolean;
    hasHardware: boolean;
    hasEnrolledBiometrics: boolean;
    supportedTypes: BiometricType[];
    securityLevel: 'none' | 'weak' | 'strong';
}

export interface BiometricAuthResult {
    success: boolean;
    biometricHash: string | null;
    deviceSignature: string | null;
    biometricType: BiometricType;
    error?: string;
}

class BiometricService {
    /**
     * Check device biometric capabilities
     */
    async checkCapabilities(): Promise<BiometricCapabilities> {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const hasEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        const types: BiometricType[] = supportedTypes
            .map(type => {
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
            })
            .filter((t): t is BiometricType => t !== 'none');

        const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
        const securityLevelMap: Record<number, 'none' | 'weak' | 'strong'> = {
            [LocalAuthentication.SecurityLevel.NONE]: 'none',
            [LocalAuthentication.SecurityLevel.SECRET]: 'weak',
            [LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK]: 'weak',
            [LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG]: 'strong',
        };

        return {
            isAvailable: hasHardware && hasEnrolled,
            hasHardware,
            hasEnrolledBiometrics: hasEnrolled,
            supportedTypes: types,
            securityLevel: securityLevelMap[securityLevel] || 'none',
        };
    }

    /**
     * Generate device signature using device-specific identifiers
     */
    private async generateDeviceSignature(): Promise<string> {
        const deviceInfo = [
            Device.brand || 'unknown',
            Device.modelName || 'unknown',
            Device.osName || 'unknown',
            Device.osVersion || 'unknown',
            Device.deviceName || 'unknown',
            Platform.OS,
            Device.isDevice ? 'physical' : 'emulator',
        ].join('|');

        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            deviceInfo + Date.now().toString()
        );
    }

    /**
     * Generate biometric hash from authentication result
     * We NEVER send raw biometric data - only cryptographic hashes
     */
    private async generateBiometricHash(
        authSuccess: boolean,
        biometricType: BiometricType,
        deviceSignature: string
    ): Promise<string> {
        const biometricData = [
            authSuccess ? 'authenticated' : 'failed',
            biometricType,
            deviceSignature,
            Date.now().toString(),
            Device.modelName || 'unknown',
        ].join(':');

        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            biometricData
        );
    }

    /**
     * Authenticate user with biometrics
     */
    async authenticate(
        promptMessage: string = 'Verifica tu identidad',
        fallbackLabel: string = 'Usar contraseña'
    ): Promise<BiometricAuthResult> {
        // Check capabilities first
        const caps = await this.checkCapabilities();

        if (!caps.isAvailable) {
            throw new AppError(
                'Autenticación biométrica no disponible',
                ErrorCode.BIOMETRIC_NOT_AVAILABLE
            );
        }

        // Generate device signature
        const deviceSignature = await this.generateDeviceSignature();

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
        const biometricHash = await this.generateBiometricHash(
            true,
            primaryType,
            deviceSignature
        );

        return {
            success: true,
            biometricHash,
            deviceSignature,
            biometricType: primaryType,
        };
    }

    /**
     * Register biometric for identity verification
     */
    async registerForVerification(): Promise<BiometricData | null> {
        const authResult = await this.authenticate(
            'Registra tu biométrico para verificación',
            'Usar PIN'
        );

        if (!authResult.success || !authResult.biometricHash) {
            return null;
        }

        return {
            biometricHash: authResult.biometricHash,
            deviceSignature: authResult.deviceSignature!,
            biometricType: authResult.biometricType as 'fingerprint' | 'facial' | 'iris',
            deviceInfo: {
                brand: Device.brand,
                model: Device.modelName,
                os: Device.osName,
                osVersion: Device.osVersion,
                isPhysicalDevice: Device.isDevice,
            },
        };
    }

    /**
     * Quick biometric check for re-authentication
     */
    async quickAuth(message: string = 'Confirma tu identidad'): Promise<boolean> {
        try {
            const result = await this.authenticate(message);
            return result.success;
        } catch {
            return false;
        }
    }
}

export const biometricService = new BiometricService();
export default biometricService;

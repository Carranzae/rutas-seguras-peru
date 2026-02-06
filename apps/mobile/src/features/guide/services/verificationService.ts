/**
 * Ruta Segura Perú - Guide Verification Service
 * DIRCETUR and biometric verification for guides
 */
import { ENDPOINTS, httpClient } from '@/src/core/api';
import { AppError, ErrorCode } from '@/src/core/errors';
import { biometricService } from '@/src/features/auth';
import type { GuideProfile, VerificationData } from '../types';

class VerificationService {
    /**
     * Upload DIRCETUR front photo
     */
    async uploadDirceturfrontPhoto(
        guideId: string,
        photoUri: string
    ): Promise<string> {
        const formData = new FormData();
        formData.append('file', {
            uri: photoUri,
            type: 'image/jpeg',
            name: 'dircetur_front.jpg',
        } as unknown as Blob);
        formData.append('document_type', 'dircetur_front');

        const response = await httpClient.upload<{ url: string }>(
            `/guides/${guideId}/documents`,
            formData
        );

        return response.data.url;
    }

    /**
     * Upload DIRCETUR back photo
     */
    async uploadDirceturBackPhoto(
        guideId: string,
        photoUri: string
    ): Promise<string> {
        const formData = new FormData();
        formData.append('file', {
            uri: photoUri,
            type: 'image/jpeg',
            name: 'dircetur_back.jpg',
        } as unknown as Blob);
        formData.append('document_type', 'dircetur_back');

        const response = await httpClient.upload<{ url: string }>(
            `/guides/${guideId}/documents`,
            formData
        );

        return response.data.url;
    }

    /**
     * Upload selfie for verification
     */
    async uploadSelfie(guideId: string, photoUri: string): Promise<string> {
        const formData = new FormData();
        formData.append('file', {
            uri: photoUri,
            type: 'image/jpeg',
            name: 'selfie.jpg',
        } as unknown as Blob);
        formData.append('document_type', 'selfie');

        const response = await httpClient.upload<{ url: string }>(
            `/guides/${guideId}/documents`,
            formData
        );

        return response.data.url;
    }

    /**
     * Register biometric for verification
     */
    async registerBiometric(guideId: string): Promise<void> {
        const biometricData = await biometricService.registerForVerification();

        if (!biometricData) {
            throw new AppError(
                'Verificación biométrica fallida',
                ErrorCode.BIOMETRIC_FAILED
            );
        }

        await httpClient.post(ENDPOINTS.GUIDES.VERIFY_BIOMETRIC(guideId), {
            biometric_hash: biometricData.biometricHash,
            biometric_type: biometricData.biometricType,
            device_signature: biometricData.deviceSignature,
            device_info: biometricData.deviceInfo,
        });
    }

    /**
     * Submit complete verification
     */
    async submitVerification(
        guideId: string,
        data: VerificationData
    ): Promise<GuideProfile> {
        const response = await httpClient.post<GuideProfile>(
            ENDPOINTS.GUIDES.VERIFY_DIRCETUR(guideId),
            {
                dircetur_front_url: data.dircetur_front_photo,
                dircetur_back_url: data.dircetur_back_photo,
                selfie_url: data.selfie_photo,
                biometric_hash: data.biometric_hash,
                biometric_type: data.biometric_type,
                device_signature: data.device_signature,
            }
        );

        return response.data;
    }

    /**
     * Get verification status
     */
    async getVerificationStatus(guideId: string): Promise<{
        status: 'pending' | 'in_review' | 'verified' | 'rejected';
        documents: {
            dircetur_front: boolean;
            dircetur_back: boolean;
            selfie: boolean;
            biometric: boolean;
        };
        rejection_reason?: string;
    }> {
        const response = await httpClient.get<{
            status: 'pending' | 'in_review' | 'verified' | 'rejected';
            documents: {
                dircetur_front: boolean;
                dircetur_back: boolean;
                selfie: boolean;
                biometric: boolean;
            };
            rejection_reason?: string;
        }>(`/guides/${guideId}/verification-status`);

        return response.data;
    }

    /**
     * Verify biometric before starting tour
     */
    async verifyBeforeTour(): Promise<boolean> {
        return await biometricService.quickAuth(
            'Verifica tu identidad para iniciar el tour'
        );
    }
}

export const verificationService = new VerificationService();
export default verificationService;

/**
 * Ruta Segura Perú - Guide Service
 * Guide profile and operations
 */
import { ENDPOINTS, httpClient } from '@/src/core/api';
import type { GuideProfile } from '../types';

class GuideService {
    /**
     * Get current guide profile
     */
    async getMyProfile(): Promise<GuideProfile> {
        const response = await httpClient.get<GuideProfile>(ENDPOINTS.GUIDES.ME);
        return response.data;
    }

    /**
     * Update guide profile
     */
    async updateProfile(data: Partial<GuideProfile>): Promise<GuideProfile> {
        const response = await httpClient.patch<GuideProfile>(
            ENDPOINTS.GUIDES.ME,
            data
        );
        return response.data;
    }

    /**
     * Set availability status
     */
    async setAvailability(isAvailable: boolean): Promise<void> {
        await httpClient.patch(ENDPOINTS.GUIDES.ME, {
            is_available: isAvailable,
        });
    }

    /**
     * Get guide details by ID
     */
    async getGuideById(guideId: string): Promise<GuideProfile> {
        const response = await httpClient.get<GuideProfile>(
            ENDPOINTS.GUIDES.DETAIL(guideId)
        );
        return response.data;
    }

    /**
     * Get available guides
     */
    async getAvailableGuides(): Promise<GuideProfile[]> {
        const response = await httpClient.get<GuideProfile[]>(
            ENDPOINTS.GUIDES.AVAILABLE
        );
        return response.data;
    }
}

export const guideService = new GuideService();
export default guideService;

/**
 * Ruta Segura Perú - Guides Service
 * Frontend service for guide operations
 */
import { ENDPOINTS } from '../config/api';
import api from './api';

// Types
export interface Guide {
    id: string;
    user_id: string;
    agency_id?: string;
    dircetur_code?: string;
    dircetur_verified: boolean;
    biometric_verified: boolean;
    languages: string[];
    specializations: string[];
    bio?: string;
    years_experience: number;
    status: 'pending' | 'verified' | 'rejected' | 'suspended';
    created_at: string;
    full_name?: string;
    email?: string;
    phone?: string;
}

export interface GuideListResponse {
    items: Guide[];
    total: number;
    page: number;
    per_page: number;
}

export interface CreateGuideData {
    dircetur_code?: string;
    license_number?: string;
    languages?: string[];
    specializations?: string[];
    bio?: string;
    years_experience?: number;
}

// Guides Service
export const guidesService = {
    async list(
        agencyId?: string,
        status?: string,
        page: number = 1,
        perPage: number = 20
    ): Promise<GuideListResponse> {
        let url = `${ENDPOINTS.GUIDES.LIST}?page=${page}&per_page=${perPage}`;
        if (agencyId) url += `&agency_id=${agencyId}`;
        if (status) url += `&status=${status}`;
        const response = await api.get<GuideListResponse>(url);
        return response.data;
    },

    async getAvailable(agencyId?: string, language?: string): Promise<Guide[]> {
        let url = ENDPOINTS.GUIDES.AVAILABLE;
        const params = [];
        if (agencyId) params.push(`agency_id=${agencyId}`);
        if (language) params.push(`language=${language}`);
        if (params.length) url += `?${params.join('&')}`;
        const response = await api.get<Guide[]>(url);
        return response.data;
    },

    async getMyProfile(): Promise<Guide> {
        const response = await api.get<Guide>(ENDPOINTS.GUIDES.ME);
        return response.data;
    },

    async getById(guideId: string): Promise<Guide> {
        const response = await api.get<Guide>(ENDPOINTS.GUIDES.DETAIL(guideId));
        return response.data;
    },

    async create(data: CreateGuideData): Promise<Guide> {
        const response = await api.post<Guide>(ENDPOINTS.GUIDES.CREATE, data);
        return response.data;
    },

    async update(guideId: string, data: Partial<CreateGuideData>): Promise<Guide> {
        const response = await api.patch<Guide>(ENDPOINTS.GUIDES.UPDATE(guideId), data);
        return response.data;
    },

    async verifyDircetur(guideId: string, approved: boolean, notes?: string): Promise<Guide> {
        const response = await api.post<Guide>(
            ENDPOINTS.GUIDES.VERIFY_DIRCETUR(guideId),
            { approved, notes }
        );
        return response.data;
    },

    async verifyBiometric(guideId: string): Promise<Guide> {
        const response = await api.post<Guide>(ENDPOINTS.GUIDES.VERIFY_BIOMETRIC(guideId));
        return response.data;
    },
};

export default guidesService;

/**
 * Compatibility re-exports for legacy imports
 * TODO: Remove this file and update all imports to use @/src/core/api
 */
import { httpClient } from '@/src/core/api';

export interface TourFilters {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface TourItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration_hours?: number;
    rating?: number;
    reviews_count?: number;
    cover_image_url?: string;
    gallery_urls?: string[];
    difficulty_level?: string;
    meeting_point?: string;
    is_featured?: boolean;
    status?: string;
    max_participants?: number;
    created_at?: string;
    // Extended fields for tour details
    included_services?: string[];
    agency_id?: string;
    agency_name?: string;
    guide_id?: string;
    guide_name?: string;
}

export interface ToursResponse {
    items: TourItem[];
    total?: number;
}

// Tours service compatibility layer
export const toursService = {
    getAssignedTours: async (): Promise<ToursResponse> => {
        const response = await httpClient.get<ToursResponse>('/tours/assigned');
        return response.data || { items: [] };
    },
    getAll: async (): Promise<ToursResponse> => {
        const response = await httpClient.get<ToursResponse>('/tours');
        return response.data || { items: [] };
    },
    getTours: async (filters?: TourFilters): Promise<TourItem[]> => {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const queryString = params.toString();
        const url = queryString ? `/tours?${queryString}` : '/tours';
        const response = await httpClient.get<ToursResponse>(url);
        return response.data?.items || [];
    },
    getById: async (id: string): Promise<TourItem | null> => {
        const response = await httpClient.get<TourItem>(`/tours/${id}`);
        return response.data || null;
    },
    submitReport: async (tourId: string, report: Record<string, unknown>) => {
        const response = await httpClient.post(`/tours/${tourId}/report`, report);
        return response.data;
    },
};

export default toursService;

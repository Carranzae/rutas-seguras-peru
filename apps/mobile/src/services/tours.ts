/**
 * Ruta Segura Perú - Tours Service
 * Frontend service for tour operations
 */
import { ENDPOINTS } from '../config/api';
import api from './api';

// Types
export interface Tour {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    duration_hours?: number;
    max_participants: number;
    difficulty_level: string;
    meeting_point?: string;
    included_services: string[];
    agency_id: string;
    guide_id?: string;
    status: 'draft' | 'published' | 'paused' | 'cancelled';
    created_at: string;
    agency_name?: string;
    guide_name?: string;
}

export interface TourSearchParams {
    query?: string;
    location?: string;
    min_price?: number;
    max_price?: number;
    difficulty?: string;
    page?: number;
    per_page?: number;
}

export interface TourListResponse {
    items: Tour[];
    total: number;
    page: number;
    per_page: number;
}

export interface CreateTourData {
    name: string;
    description?: string;
    price: number;
    duration_hours?: number;
    max_participants?: number;
    difficulty_level?: string;
    meeting_point?: string;
    included_services?: string[];
    guide_id?: string;
}

// Tour Service
export const toursService = {
    /**
     * Search tours with filters
     */
    async search(params: TourSearchParams = {}): Promise<TourListResponse> {
        const queryParams = new URLSearchParams();

        if (params.query) queryParams.append('query', params.query);
        if (params.location) queryParams.append('location', params.location);
        if (params.min_price) queryParams.append('min_price', params.min_price.toString());
        if (params.max_price) queryParams.append('max_price', params.max_price.toString());
        if (params.difficulty) queryParams.append('difficulty', params.difficulty);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.per_page) queryParams.append('per_page', params.per_page.toString());

        const response = await api.get<TourListResponse>(
            `${ENDPOINTS.TOURS.LIST}?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get featured tours for homepage
     */
    async getFeatured(limit: number = 10): Promise<Tour[]> {
        const response = await api.get<Tour[]>(
            `${ENDPOINTS.TOURS.FEATURED}?limit=${limit}`
        );
        return response.data;
    },

    /**
     * Get tour details by ID
     */
    async getById(tourId: string): Promise<Tour> {
        const response = await api.get<Tour>(ENDPOINTS.TOURS.DETAIL(tourId));
        return response.data;
    },

    /**
     * Alias for getById - used by mobile app
     */
    async getTourById(tourId: string): Promise<Tour> {
        return this.getById(tourId);
    },

    /**
     * Get tours list with optional filters - used by mobile app
     */
    async getTours(params: { category?: string; search?: string } = {}): Promise<TourListResponse> {
        return this.search({
            query: params.search,
            // Note: category filter would need backend support
        });
    },

    /**
     * Create a new tour (agency admin)
     */
    async create(data: CreateTourData): Promise<Tour> {
        const response = await api.post<Tour>(ENDPOINTS.TOURS.CREATE, data);
        return response.data;
    },

    /**
     * Update tour details
     */
    async update(tourId: string, data: Partial<CreateTourData>): Promise<Tour> {
        const response = await api.patch<Tour>(ENDPOINTS.TOURS.UPDATE(tourId), data);
        return response.data;
    },

    /**
     * Publish a tour
     */
    async publish(tourId: string): Promise<Tour> {
        const response = await api.post<Tour>(ENDPOINTS.TOURS.PUBLISH(tourId));
        return response.data;
    },

    /**
     * Delete a tour
     */
    async delete(tourId: string): Promise<void> {
        await api.delete(ENDPOINTS.TOURS.DELETE(tourId));
    },

    /**
     * Get tours assigned to the current guide
     */
    async getAssignedTours(page: number = 1): Promise<TourListResponse> {
        // Fallback to simpler path if BASE not defined
        const url = ENDPOINTS.TOURS.BASE ? `${ENDPOINTS.TOURS.BASE}/assigned?page=${page}` : `/tours/assigned?page=${page}`;
        const response = await api.get<TourListResponse>(url);
        return response.data;
    },

    /**
     * Submit tour report as a guide
     */
    async submitReport(tourId: string, data: { notes: string; rating: number; incidents: number }): Promise<void> {
        const url = ENDPOINTS.TOURS.BASE ? `${ENDPOINTS.TOURS.BASE}/${tourId}/report` : `/tours/${tourId}/report`;
        await api.post(url, data);
    },
};

export default toursService;

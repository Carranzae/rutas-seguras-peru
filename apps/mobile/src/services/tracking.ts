/**
 * Ruta Segura Perú - Tracking Service
 * Frontend service for GPS location tracking
 */
import { ENDPOINTS } from '../config/api';
import api from './api';

// Types
export interface LocationUpdate {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    battery_level?: number;
    tour_id?: string;
}

export interface LocationResponse {
    id: string;
    user_id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    recorded_at: string;
    tour_id?: string;
}

export interface RoutePoint {
    latitude: number;
    longitude: number;
    recorded_at: string;
    speed?: number;
    altitude?: number;
}

// Tracking Service
export const trackingService = {
    /**
     * Send current GPS location
     */
    async updateLocation(data: LocationUpdate): Promise<LocationResponse> {
        const response = await api.post<LocationResponse>(ENDPOINTS.TRACKING.UPDATE, data);
        return response.data;
    },

    /**
     * Get location history
     */
    async getHistory(limit: number = 100): Promise<LocationResponse[]> {
        const response = await api.get<LocationResponse[]>(
            `${ENDPOINTS.TRACKING.HISTORY}?limit=${limit}`
        );
        return response.data;
    },

    /**
     * Get latest location
     */
    async getLatest(): Promise<LocationResponse | null> {
        const response = await api.get<LocationResponse | null>('/tracking/latest');
        return response.data;
    },

    /**
     * Get live locations for a tour
     */
    async getTourLiveLocations(tourId: string, sinceMinutes: number = 5): Promise<LocationResponse[]> {
        const response = await api.get<LocationResponse[]>(
            `${ENDPOINTS.TRACKING.LIVE(tourId)}?since_minutes=${sinceMinutes}`
        );
        return response.data;
    },

    /**
     * Get tour route
     */
    async getTourRoute(tourId: string): Promise<RoutePoint[]> {
        const response = await api.get<RoutePoint[]>(`/tracking/tour/${tourId}/route`);
        return response.data;
    },

    /**
     * Get another user's latest location (guide/admin only)
     */
    async getUserLatestLocation(userId: string): Promise<LocationResponse | null> {
        const response = await api.get<LocationResponse | null>(`/tracking/user/${userId}/latest`);
        return response.data;
    },
};

export default trackingService;

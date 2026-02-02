/**
 * Ruta Segura Perú - Emergency Service
 * SOS and emergency operations
 */
import { ENDPOINTS } from '@/src/config/api';
import * as Location from 'expo-location';
import api from './api';

// Types
export interface LocationData {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
}

export interface SOSRequest {
    location: LocationData;
    description?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    battery_level?: number;
    tour_id?: string;
}

export interface Emergency {
    id: string;
    location: {
        type: string;
        coordinates: [number, number];
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'responding' | 'resolved' | 'false_alarm' | 'escalated';
    description: string | null;
    battery_level: number | null;
    triggered_by_id: string;
    triggered_by_name: string | null;
    tour_id: string | null;
    responder_id: string | null;
    responder_notes: string | null;
    resolved_at: string | null;
    created_at: string;
}

class EmergencyService {
    /**
     * Get current device location
     */
    async getCurrentLocation(): Promise<LocationData | null> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Location permission denied');
                return null;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                altitude: location.coords.altitude || undefined,
                accuracy: location.coords.accuracy || undefined,
            };
        } catch (error) {
            console.error('Failed to get location:', error);
            return null;
        }
    }

    /**
     * Trigger SOS emergency alert
     */
    async triggerSOS(options?: {
        description?: string;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        tourId?: string;
    }): Promise<Emergency> {
        // Get current location
        const location = await this.getCurrentLocation();
        if (!location) {
            throw new Error('Unable to get location. Please enable GPS.');
        }

        // Get battery level if available
        let batteryLevel: number | undefined;
        try {
            // Battery API would go here
            batteryLevel = undefined;
        } catch { }

        const request: SOSRequest = {
            location,
            description: options?.description,
            severity: options?.severity || 'high',
            battery_level: batteryLevel,
            tour_id: options?.tourId,
        };

        const response = await api.post<Emergency>(ENDPOINTS.EMERGENCIES.SOS, request);
        return response.data;
    }

    /**
     * Get active emergencies (admin only)
     */
    async getActiveEmergencies(page = 1, perPage = 20): Promise<{
        items: Emergency[];
        total: number;
        active_count: number;
    }> {
        const response = await api.get(
            `${ENDPOINTS.EMERGENCIES.ACTIVE}?page=${page}&per_page=${perPage}`
        );
        return response.data;
    }

    /**
     * Get emergency by ID
     */
    async getEmergency(id: string): Promise<Emergency> {
        const response = await api.get<Emergency>(ENDPOINTS.EMERGENCIES.DETAIL(id));
        return response.data;
    }

    /**
     * Update emergency status/notes
     */
    async updateEmergency(
        id: string,
        data: {
            status?: string;
            severity?: string;
            responder_notes?: string;
        }
    ): Promise<Emergency> {
        const response = await api.patch<Emergency>(
            ENDPOINTS.EMERGENCIES.DETAIL(id),
            data
        );
        return response.data;
    }

    /**
     * Resolve emergency
     */
    async resolveEmergency(id: string, notes?: string): Promise<Emergency> {
        const response = await api.post<Emergency>(
            ENDPOINTS.EMERGENCIES.RESOLVE(id),
            { notes }
        );
        return response.data;
    }
}

// Export singleton
export const emergencyService = new EmergencyService();
export default emergencyService;

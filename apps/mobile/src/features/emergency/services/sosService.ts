/**
 * Ruta Segura Perú - SOS Service
 * Emergency SOS operations
 */
import { ENDPOINTS, httpClient, wsClient } from '@/src/core/api';
import { locationService } from '@/src/features/tracking';
import type { Emergency, SOSData } from '../types';

class SOSService {
    /**
     * Send SOS alert via HTTP (fallback)
     */
    async sendSOSHttp(data: SOSData): Promise<Emergency> {
        const response = await httpClient.post<Emergency>(
            ENDPOINTS.EMERGENCIES.SOS,
            {
                latitude: data.latitude,
                longitude: data.longitude,
                message: data.message || 'Emergencia - Necesito ayuda',
                type: data.type || 'sos',
                battery_level: data.battery_level,
            }
        );
        return response.data;
    }

    /**
     * Send SOS via WebSocket (preferred - faster)
     */
    sendSOSWebSocket(message?: string): void {
        locationService.getCurrentLocation().then(location => {
            wsClient.sendSOS(message, {
                latitude: location.latitude,
                longitude: location.longitude,
            });
        });
    }

    /**
     * Send SOS with automatic location
     */
    async sendSOS(message?: string, type?: Emergency['type']): Promise<Emergency> {
        const location = await locationService.getCurrentLocation();
        const battery = await locationService.getBatteryLevel();

        // Try WebSocket first (faster)
        if (wsClient.isConnected()) {
            wsClient.sendSOS(message, {
                latitude: location.latitude,
                longitude: location.longitude,
            });
        }

        // Also send via HTTP for persistence
        return this.sendSOSHttp({
            latitude: location.latitude,
            longitude: location.longitude,
            message,
            type,
            battery_level: battery > 0 ? battery : undefined,
        });
    }

    /**
     * Get active emergency
     */
    async getActiveEmergency(): Promise<Emergency | null> {
        try {
            const response = await httpClient.get<Emergency>(
                ENDPOINTS.EMERGENCIES.ACTIVE
            );
            return response.data;
        } catch {
            return null;
        }
    }

    /**
     * Cancel/Resolve emergency
     */
    async resolveEmergency(
        emergencyId: string,
        reason: 'resolved' | 'false_alarm',
        notes?: string
    ): Promise<void> {
        await httpClient.post(ENDPOINTS.EMERGENCIES.RESOLVE(emergencyId), {
            status: reason,
            notes,
        });
    }

    /**
     * Get emergency history
     */
    async getEmergencyHistory(): Promise<Emergency[]> {
        const response = await httpClient.get<Emergency[]>('/emergencies/history');
        return response.data;
    }
}

export const sosService = new SOSService();
export default sosService;

/**
 * Compatibility re-exports for legacy imports
 * TODO: Remove this file and update all imports to use @/src/features/emergency
 */
import { sosService, useEmergencyStore } from '@/src/features/emergency';

export { sosService as emergencyService, useEmergencyStore };

// Emergency type from the feature module
type EmergencyType = 'sos' | 'medical' | 'security' | 'natural_disaster';

// Extended compatibility wrapper for triggerSOS
export const emergencyServiceCompat = {
    triggerSOS: async (data?: { description?: string; severity?: string; tourId?: string }) => {
        const typeMap: Record<string, EmergencyType> = {
            'high': 'sos',
            'critical': 'sos',
            'medium': 'security',
            'low': 'medical',
        };
        const emergencyType = data?.severity ? typeMap[data.severity] || 'sos' : 'sos';
        return sosService.sendSOS(data?.description, emergencyType);
    },
    sendSOS: async (description?: string, type?: EmergencyType) => {
        return sosService.sendSOS(description, type);
    },
    cancelSOS: async (sosId: string) => {
        return sosService.resolveEmergency(sosId, 'false_alarm');
    },
    updateLocation: async (_latitude: number, _longitude: number) => {
        // Location updates are handled by the tracking service
        console.log('Location update delegated to tracking service');
    },
};

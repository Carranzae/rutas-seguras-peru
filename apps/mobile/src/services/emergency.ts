/**
 * Compatibility re-exports for legacy imports
 * TODO: Remove this file and update all imports to use @/src/features/emergency
 */
export { sosService as emergencyService, useEmergencyStore } from '@/src/features/emergency';

// Emergency type from the feature module
type EmergencyType = 'sos' | 'medical' | 'security' | 'natural_disaster';

// Extended compatibility wrapper for triggerSOS
export const emergencyServiceCompat = {
    triggerSOS: async (data?: { description?: string; severity?: string; tourId?: string }) => {
        const { sosService } = await import('@/src/features/emergency');
        // Map severity to emergency type
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
        const { sosService } = await import('@/src/features/emergency');
        return sosService.sendSOS(description, type);
    },
    cancelSOS: async (sosId: string) => {
        const { sosService } = await import('@/src/features/emergency');
        return sosService.resolveEmergency(sosId, 'false_alarm');
    },
    updateLocation: async (_latitude: number, _longitude: number) => {
        // Location updates are handled by the tracking service
        console.log('Location update delegated to tracking service');
    },
};

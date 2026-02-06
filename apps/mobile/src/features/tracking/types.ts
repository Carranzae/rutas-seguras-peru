/**
 * Ruta Segura Perú - Tracking Types
 */

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number; // km/h
    timestamp: number;
}

export interface TrackingConfig {
    intervalMs: number;
    highAccuracy: boolean;
    distanceFilter: number;
}

export interface SafetyAnalysis {
    risk_score: number | null;
    risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
    terrain: string | null;
    alerts_triggered: number;
}

export interface GroupMember {
    user_id: string;
    user_name: string;
    user_type: 'guide' | 'tourist';
    latitude: number;
    longitude: number;
    last_update: string;
    battery?: number;
    is_sos?: boolean;
}

export interface TrackingState {
    isTracking: boolean;
    currentLocation: LocationData | null;
    lastAnalysis: SafetyAnalysis | null;
    groupMembers: GroupMember[];
    connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
    batteryLevel: number | null;
}

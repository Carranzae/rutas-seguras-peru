/**
 * Ruta Segura Perú - Emergency Types
 */

export interface Emergency {
    id: string;
    user_id: string;
    type: 'sos' | 'medical' | 'security' | 'natural_disaster';
    status: 'active' | 'responding' | 'resolved' | 'false_alarm';
    latitude: number;
    longitude: number;
    message: string | null;
    created_at: string;
    resolved_at: string | null;
    responder_id: string | null;
    responder_notes: string | null;
}

export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    relationship: string;
    is_primary: boolean;
    notify_on_emergency: boolean;
}

export interface SOSData {
    latitude: number;
    longitude: number;
    message?: string;
    type?: Emergency['type'];
    battery_level?: number;
}

/**
 * Ruta Segura Perú - Auth Types
 */

export interface User {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    role: 'super_admin' | 'agency_admin' | 'guide' | 'tourist';
    is_active: boolean;
    is_verified: boolean;
    avatar_url: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    language: string;
    created_at: string;
    updated_at?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: 'guide' | 'tourist';
    language?: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface BiometricData {
    biometricHash: string;
    deviceSignature: string;
    biometricType: 'fingerprint' | 'facial' | 'iris';
    deviceInfo: {
        brand: string | null;
        model: string | null;
        os: string | null;
        osVersion: string | null;
        isPhysicalDevice: boolean;
    };
}

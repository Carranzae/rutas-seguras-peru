/**
 * Ruta Segura Perú - Guide Types
 */

export interface GuideProfile {
    id: string;
    user_id: string;
    agency_id: string;
    dircetur_code: string | null;
    languages: string[];
    specializations: string[];
    years_experience: number;
    bio: string | null;
    avatar_url: string | null;
    rating: number;
    total_tours: number;
    is_verified: boolean;
    verification_status: 'pending' | 'in_review' | 'verified' | 'rejected';
    is_active: boolean;
    is_available: boolean;
    created_at: string;
}

export interface VerificationData {
    dircetur_front_photo: string | null;
    dircetur_back_photo: string | null;
    selfie_photo: string | null;
    biometric_hash: string | null;
    biometric_type: 'fingerprint' | 'facial' | null;
    device_signature: string | null;
}

export interface ActiveTour {
    id: string;
    title: string;
    tourists: Array<{
        id: string;
        name: string;
        phone: string;
    }>;
    start_time: string;
    expected_end: string;
    route: Array<{ lat: number; lng: number }>;
}

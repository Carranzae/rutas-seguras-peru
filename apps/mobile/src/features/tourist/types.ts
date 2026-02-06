/**
 * Ruta Segura Perú - Tourist Types
 */

export interface TouristProfile {
    id: string;
    user_id: string;
    nationality: string | null;
    passport_number: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    blood_type: string | null;
    allergies: string | null;
    medical_conditions: string | null;
    preferred_language: string;
}

export interface Booking {
    id: string;
    tour_id: string;
    tourist_id: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    booking_date: string;
    num_travelers: number;
    total_amount: number;
    payment_status: 'pending' | 'paid' | 'refunded';
    special_requirements: string | null;
    tour: {
        id: string;
        title: string;
        guide_name: string;
        cover_image_url: string | null;
        start_date: string;
        duration_hours: number;
    };
    created_at: string;
}

export interface TrustCircleContact {
    id: string;
    name: string;
    phone: string;
    phone_e164?: string;
    phone_display?: string;
    email: string | null;
    relationship: string;
    notification_channel?: string;
    is_primary: boolean;
    is_verified?: boolean;
    priority?: number;
}

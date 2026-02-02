/**
 * Ruta Segura Perú - Shared TypeScript Types
 * Synchronized with backend schemas
 */

// ============================================
// AUTH & USERS
// ============================================

export type UserRole = 'tourist' | 'guide' | 'agency_admin' | 'super_admin';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token?: string;
    token_type: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: UserRole;
}

// ============================================
// AGENCIES
// ============================================

export type AgencyStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface Agency {
    id: string;
    name: string;
    ruc: string;
    legal_representative: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    status: AgencyStatus;
    logo_url?: string;
    created_at: string;
}

// ============================================
// GUIDES
// ============================================

export type GuideStatus = 'pending' | 'active' | 'suspended' | 'inactive';

export interface Guide {
    id: string;
    user_id: string;
    agency_id?: string;
    dircetur_code?: string;
    languages: string[];
    specialties: string[];
    bio?: string;
    photo_url?: string;
    rating: number;
    total_tours: number;
    status: GuideStatus;
    is_dircetur_verified: boolean;
    is_biometric_verified: boolean;
}

// ============================================
// TOURS
// ============================================

export type TourStatus = 'draft' | 'published' | 'archived';
export type TourDifficulty = 'easy' | 'moderate' | 'challenging' | 'expert';

export interface Tour {
    id: string;
    agency_id: string;
    title: string;
    description: string;
    short_description?: string;
    price: number;
    currency: string;
    duration_hours: number;
    max_participants: number;
    difficulty: TourDifficulty;
    included: string[];
    not_included: string[];
    meeting_point: string;
    meeting_latitude?: number;
    meeting_longitude?: number;
    cover_image_url?: string;
    gallery_urls?: string[];
    status: TourStatus;
    is_featured: boolean;
    rating: number;
    reviews_count: number;
    created_at: string;
}

// ============================================
// BOOKINGS
// ============================================

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Booking {
    id: string;
    tour_id: string;
    user_id: string;
    guide_id?: string;
    scheduled_date: string;
    num_participants: number;
    total_amount: number;
    status: BookingStatus;
    payment_status: PaymentStatus;
    special_requests?: string;
    created_at: string;
}

// ============================================
// EMERGENCIES
// ============================================

export type EmergencyType = 'sos' | 'medical' | 'lost' | 'accident' | 'other';
export type EmergencyStatus = 'active' | 'responding' | 'resolved' | 'false_alarm';

export interface Emergency {
    id: string;
    user_id: string;
    tour_id?: string;
    type: EmergencyType;
    status: EmergencyStatus;
    latitude: number;
    longitude: number;
    description?: string;
    created_at: string;
    resolved_at?: string;
}

// ============================================
// TRACKING & LOCATION
// ============================================

export interface LocationUpdate {
    user_id: string;
    user_type: 'guide' | 'tourist';
    user_name: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    battery?: number;
    tour_id?: string;
    timestamp: string;
    status?: 'active' | 'idle' | 'sos';
    is_emergency?: boolean;
}

export interface TrackingStats {
    active_guides: number;
    active_tourists: number;
    active_emergencies: number;
    active_tours: number;
}

// ============================================
// PAYMENTS
// ============================================

export interface Payment {
    id: string;
    booking_id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    payment_method: string;
    transaction_id?: string;
    created_at: string;
}

export interface PlatformStats {
    total_revenue: number;
    pending_payouts: number;
    completed_tours: number;
    active_agencies: number;
}

// ============================================
// WEBSOCKET MESSAGES
// ============================================

export type WebSocketMessageType =
    | 'LOCATION_UPDATE'
    | 'INITIAL_STATE'
    | 'STATS'
    | 'EMERGENCY'
    | 'ALERT'
    | 'COMMAND'
    | 'COMMAND_RESULT'
    | 'PONG'
    | 'ACK';

export interface WebSocketMessage<T = unknown> {
    type: WebSocketMessageType;
    data?: T;
    timestamp?: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface ApiError {
    detail: string;
    status_code?: number;
}

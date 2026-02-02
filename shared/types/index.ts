/**
 * Ruta Segura Perú - Shared Types
 * Common TypeScript types used across the application
 */

// ============================================
// USER ROLES
// ============================================
export type UserRole = 'super_admin' | 'agency_admin' | 'guide' | 'tourist';

// ============================================
// USER
// ============================================
export interface User {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    role: UserRole;
    is_active: boolean;
    is_verified: boolean;
    avatar_url: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    language: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// AUTHENTICATION
// ============================================
export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
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
    role?: UserRole;
    language?: string;
}

// ============================================
// TOUR
// ============================================
export type TourStatus = 'draft' | 'published' | 'paused' | 'completed' | 'cancelled';

export interface Tour {
    id: string;
    title: string;
    description: string;
    agency_id: string;
    guide_id: string | null;
    status: TourStatus;
    duration_hours: number;
    max_participants: number;
    price: number;
    currency: string;
    meeting_point: string;
    start_location: GeoLocation;
    end_location: GeoLocation;
    difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
    includes: string[];
    excludes: string[];
    requirements: string[];
    photos: string[];
    created_at: string;
    updated_at: string;
}

// ============================================
// BOOKING
// ============================================
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
    id: string;
    tour_id: string;
    tourist_id: string;
    status: BookingStatus;
    participants: number;
    total_amount: number;
    payment_status: 'pending' | 'paid' | 'refunded';
    special_requests?: string;
    scheduled_date: string;
    created_at: string;
}

// ============================================
// AGENCY
// ============================================
export type AgencyStatus = 'pending' | 'verified' | 'suspended';

export interface Agency {
    id: string;
    name: string;
    legal_name: string;
    ruc: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    status: AgencyStatus;
    logo_url: string | null;
    description: string;
    is_verified: boolean;
    admin_id: string;
    created_at: string;
}

// ============================================
// GUIDE
// ============================================
export type GuideStatus = 'pending' | 'verified' | 'suspended';

export interface Guide {
    id: string;
    user_id: string;
    agency_id: string | null;
    license_number: string;
    dircetur_verified: boolean;
    biometric_verified: boolean;
    status: GuideStatus;
    languages: string[];
    specialties: string[];
    rating: number;
    total_tours: number;
    created_at: string;
}

// ============================================
// EMERGENCY
// ============================================
export type EmergencySeverity = 'low' | 'medium' | 'high' | 'critical';
export type EmergencyStatus = 'active' | 'responding' | 'resolved' | 'false_alarm';
export type EmergencyType = 'SOS' | 'MEDICAL' | 'SECURITY' | 'ACCIDENT' | 'NATURAL_DISASTER';

export interface Emergency {
    id: string;
    user_id: string;
    type: EmergencyType;
    severity: EmergencySeverity;
    status: EmergencyStatus;
    location: GeoLocation;
    description?: string;
    responders: string[];
    created_at: string;
    resolved_at?: string;
}

// ============================================
// PAYMENT
// ============================================
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'yape' | 'plin' | 'bank_transfer';

export interface Payment {
    id: string;
    booking_id: string;
    user_id: string;
    agency_id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method: PaymentMethod;
    transaction_id: string;
    platform_fee: number;
    agency_amount: number;
    created_at: string;
    paid_at?: string;
}

// ============================================
// TRACKING / LOCATION
// ============================================
export interface GeoLocation {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
}

export interface TrackingPoint extends GeoLocation {
    timestamp: string;
    speed?: number;
    heading?: number;
    battery_level?: number;
}

export interface LiveTracking {
    user_id: string;
    tour_id: string;
    current_location: GeoLocation;
    last_update: string;
    is_active: boolean;
    safety_status: 'safe' | 'warning' | 'danger';
}

// ============================================
// API RESPONSES
// ============================================
export interface ApiResponse<T = any> {
    data: T;
    status: number;
    ok: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
}

export interface ApiError {
    detail: string;
    status: number;
    code?: string;
}

// ============================================
// WEBSOCKET MESSAGES
// ============================================
export type WSMessageType =
    | 'LOCATION_UPDATE'
    | 'EMERGENCY_ALERT'
    | 'SOS_ACTIVATED'
    | 'CONNECTION_STATUS'
    | 'COMMAND'
    | 'PING'
    | 'PONG';

export interface WSMessage<T = any> {
    type: WSMessageType;
    data: T;
    timestamp: string;
}

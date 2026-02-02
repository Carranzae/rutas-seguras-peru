/**
 * Super Admin Dashboard - API Configuration
 */

// Backend API URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_VERSION = '/api/v1';

// Full API URL helper
export const getApiUrl = (endpoint: string): string => {
    const base = `${API_BASE_URL}${API_VERSION}`;
    return endpoint.startsWith('/') ? `${base}${endpoint}` : `${base}/${endpoint}`;
};

// Auth token storage key
export const AUTH_TOKEN_KEY = 'superadmin_token';

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Set auth token
export const setAuthToken = (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
};

// Remove auth token
export const removeAuthToken = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
};

// API Request helper with auth
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl(endpoint), {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error de servidor' }));
        throw new Error(error.detail || `Error ${response.status}`);
    }

    return response.json();
}

// API Endpoints
export const ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    ME: '/auth/me',

    // Admin
    DASHBOARD_STATS: '/admin/dashboard/stats',
    USERS: '/admin/users',
    PENDING_VERIFICATIONS: '/admin/verifications/pending',

    // Agencies
    AGENCIES: '/agencies',
    AGENCY_DETAIL: (id: string) => `/agencies/${id}`,
    AGENCY_VERIFY: (id: string) => `/agencies/${id}/verify`,

    // Guides
    GUIDES: '/guides',
    GUIDE_DETAIL: (id: string) => `/guides/${id}`,
    GUIDE_VERIFY_DIRCETUR: (id: string) => `/guides/${id}/verify-dircetur`,

    // Tours
    TOURS: '/tours',

    // Payments
    PAYMENTS: '/payments',
    PAYMENT_STATS: '/payments/stats/platform',

    // Bookings
    BOOKINGS: '/bookings',
    BOOKING_STATS: '/bookings/stats',

    // Emergencies
    EMERGENCIES: '/emergencies',
    EMERGENCY_ACTIVE: '/emergencies/active',

    // Tracking
    TRACKING_LIVE: '/tracking/live',
};

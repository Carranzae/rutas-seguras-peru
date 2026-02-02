/**
 * Ruta Segura Perú - API Configuration
 * Base configuration for backend connection
 */

// API Base URL - Change based on environment
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (!__DEV__) {
        return 'https://api.rutaseguraperu.com';  // Production URL
    }
    // Development: Use localhost for web, local IP for mobile
    if (Platform.OS === 'web') {
        return 'http://localhost:8000';
    }
    // For mobile, use your machine's local network IP
    return 'http://192.168.94.174:8000';  // Tu IP actual de red local
};

export const API_CONFIG = {
    BASE_URL: getBaseUrl(),

    // API Version
    API_VERSION: '/api/v1',

    // Timeouts (ms)
    TIMEOUT: 30000,
    UPLOAD_TIMEOUT: 60000,

    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
};

// Full API URL helper
export const getApiUrl = (endpoint: string): string => {
    const base = API_CONFIG.BASE_URL + API_CONFIG.API_VERSION;
    return endpoint.startsWith('/') ? `${base}${endpoint}` : `${base}/${endpoint}`;
};

// Endpoints
export const ENDPOINTS = {
    // Auth
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
    },

    // Users
    USERS: {
        LIST: '/users',
        PROFILE: '/users/profile',
        UPDATE: '/users/profile',
    },

    // Emergencies
    EMERGENCIES: {
        SOS: '/emergencies/sos',
        ACTIVE: '/emergencies/active',
        DETAIL: (id: string) => `/emergencies/${id}`,
        RESOLVE: (id: string) => `/emergencies/${id}/resolve`,
    },

    // Tours
    TOURS: {
        BASE: '/tours',
        LIST: '/tours',
        FEATURED: '/tours/featured',
        DETAIL: (id: string) => `/tours/${id}`,
        CREATE: '/tours',
        UPDATE: (id: string) => `/tours/${id}`,
        PUBLISH: (id: string) => `/tours/${id}/publish`,
        DELETE: (id: string) => `/tours/${id}`,
    },

    // Agencies
    AGENCIES: {
        LIST: '/agencies',
        DETAIL: (id: string) => `/agencies/${id}`,
        REGISTER: '/agencies',
        UPDATE: (id: string) => `/agencies/${id}`,
        VERIFY: (id: string) => `/agencies/${id}/verify`,
        STATS: (id: string) => `/agencies/${id}/stats`,
    },

    // Guides
    GUIDES: {
        LIST: '/guides',
        AVAILABLE: '/guides/available',
        ME: '/guides/me',
        DETAIL: (id: string) => `/guides/${id}`,
        CREATE: '/guides',
        UPDATE: (id: string) => `/guides/${id}`,
        VERIFY_DIRCETUR: (id: string) => `/guides/${id}/verify-dircetur`,
        VERIFY_BIOMETRIC: (id: string) => `/guides/${id}/verify-biometric`,
    },

    // Payments (IziPay)
    PAYMENTS: {
        INITIATE: '/payments/initiate',
        MY: '/payments/my',
        DETAIL: (id: string) => `/payments/${id}`,
        AGENCY: (agencyId: string) => `/payments/agency/${agencyId}`,
        REFUND: (id: string) => `/payments/${id}/refund`,
        STATS: '/payments/stats/platform',
    },

    // Tracking
    TRACKING: {
        UPDATE: '/tracking/location',
        HISTORY: '/tracking/history',
        LIVE: (tourId: string) => `/tracking/tour/${tourId}/live`,
    },
};

// Export as API_ENDPOINTS for compatibility
export const API_ENDPOINTS = ENDPOINTS;

export default API_CONFIG;

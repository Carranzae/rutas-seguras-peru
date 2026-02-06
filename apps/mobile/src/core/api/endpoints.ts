/**
 * Ruta Segura Perú - API Endpoints
 * Centralized endpoint definitions
 */

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

    // Payments
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

    // Bookings
    BOOKINGS: {
        LIST: '/bookings',
        MY: '/bookings/my',
        DETAIL: (id: string) => `/bookings/${id}`,
        CREATE: '/bookings',
        CANCEL: (id: string) => `/bookings/${id}/cancel`,
        CONFIRM: (id: string) => `/bookings/${id}/confirm`,
    },
} as const;

export default ENDPOINTS;

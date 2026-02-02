// Ruta Segura Perú - Centralized Routes
// Sistema de rutas para navegación

export const Routes = {
    // Auth Routes
    AUTH: {
        LOGIN: '/(auth)/login',
        REGISTER: '/(auth)/register',
        FORGOT_PASSWORD: '/(auth)/forgot-password',
        ONBOARDING: '/(auth)/onboarding',
        ROLE_SELECT: '/(auth)/role-select',
    },

    // Tourist Routes
    TOURIST: {
        ROOT: '/(tourist)',
        TABS: {
            EXPLORE: '/(tourist)/(tabs)/explore',
            SAFETY: '/(tourist)/(tabs)/safety',
            MAP: '/(tourist)/(tabs)/map',
            PROFILE: '/(tourist)/(tabs)/profile',
        },
        TOUR_DETAIL: '/(tourist)/tour/[id]',
        CHECKOUT: '/(tourist)/tour/checkout',
        CHAT: '/(tourist)/chat/[guideId]',
        EMERGENCY: {
            SOS: '/(tourist)/emergency/sos',
            CONTACTS: '/(tourist)/emergency/contacts',
            TRACKING: '/(tourist)/emergency/tracking',
        },
        TRANSLATOR: '/(tourist)/translator',
        TRIP_HISTORY: '/(tourist)/trip-history',
    },

    // Guide Routes
    GUIDE: {
        ROOT: '/(guide)',
        TABS: {
            DASHBOARD: '/(guide)/(tabs)/dashboard',
            TOURS: '/(guide)/(tabs)/tours',
            TRANSLATE: '/(guide)/(tabs)/translate',
            PROFILE: '/(guide)/(tabs)/profile',
        },
        TOUR: {
            ACTIVE: '/(guide)/tour/active',
            GROUP: '/(guide)/tour/group',
            REPORT: '/(guide)/tour/report',
        },
        VERIFICATION: {
            BIOMETRIC: '/(guide)/verification/biometric',
            DIRCETUR: '/(guide)/verification/dircetur',
            PENDING: '/(guide)/verification/pending',
        },
        CHAT: '/(guide)/chat/tourists',
        NOTIFICATIONS: '/(guide)/notifications',
    },

    // Agency Admin Routes
    AGENCY: {
        ROOT: '/(agency)',
        TABS: {
            DASHBOARD: '/(agency)/(tabs)/dashboard',
            FLEET: '/(agency)/(tabs)/fleet',
            SCHEDULE: '/(agency)/(tabs)/schedule',
            SETTINGS: '/(agency)/(tabs)/settings',
        },
        GUIDES: {
            LIST: '/(agency)/guides',
            DETAIL: '/(agency)/guides/[id]',
            ADD: '/(agency)/guides/add',
        },
        ROUTES: '/(agency)/routes',
        ALERTS: '/(agency)/alerts/sos',
        BILLING: '/(agency)/billing',
        SUPPORT: '/(agency)/support',
        PANIC: '/(agency)/panic',
    },

    // Super Admin Routes (Web)
    SUPER_ADMIN: {
        ROOT: '/(super-admin)',
        LOGIN: '/(super-admin)/login',
        TWO_FACTOR: '/(super-admin)/2fa',
        DASHBOARD: '/(super-admin)/dashboard',
        AGENCIES: '/(super-admin)/agencies',
        GUIDES: '/(super-admin)/guides',
        CRISIS: '/(super-admin)/crisis',
        TRANSLATION: '/(super-admin)/translation',
        REPORTS: '/(super-admin)/reports',
        NOTIFICATIONS: '/(super-admin)/notifications',
        INCIDENTS: '/(super-admin)/incidents',
        PROFILE: '/(super-admin)/profile',
    },
};

// User Roles
export enum UserRole {
    TOURIST = 'tourist',
    GUIDE = 'guide',
    AGENCY_ADMIN = 'agency_admin',
    SUPER_ADMIN = 'super_admin',
}

// Route helpers
export const getHomeRoute = (role: UserRole): string => {
    switch (role) {
        case UserRole.TOURIST:
            return Routes.TOURIST.TABS.EXPLORE;
        case UserRole.GUIDE:
            return Routes.GUIDE.TABS.DASHBOARD;
        case UserRole.AGENCY_ADMIN:
            return Routes.AGENCY.TABS.DASHBOARD;
        case UserRole.SUPER_ADMIN:
            return Routes.SUPER_ADMIN.DASHBOARD;
        default:
            return Routes.AUTH.LOGIN;
    }
};

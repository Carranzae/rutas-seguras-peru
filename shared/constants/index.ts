/**
 * Ruta Segura Perú - Shared Constants
 * Common constants used across the application
 */

// ============================================
// APPLICATION
// ============================================
export const APP_NAME = 'Ruta Segura Perú';
export const APP_VERSION = '1.0.0';
export const DEFAULT_LANGUAGE = 'es';

// ============================================
// API
// ============================================
export const API_TIMEOUT = 30000;
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000;

// ============================================
// USER ROLES
// ============================================
export const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    AGENCY_ADMIN: 'agency_admin',
    GUIDE: 'guide',
    TOURIST: 'tourist',
} as const;

export const ROLE_LABELS = {
    super_admin: 'Super Administrador',
    agency_admin: 'Administrador de Agencia',
    guide: 'Guía Turístico',
    tourist: 'Turista',
} as const;

// ============================================
// EMERGENCY
// ============================================
export const EMERGENCY_NUMBERS = {
    POLICE: '105',
    FIRE: '116',
    AMBULANCE: '117',
    GENERAL: '911',
    TOURISM_POLICE: '(01) 460-1060',
} as const;

export const EMERGENCY_TYPES = {
    SOS: { label: 'SOS General', icon: 'warning', color: '#FF5252' },
    MEDICAL: { label: 'Emergencia Médica', icon: 'medkit', color: '#FF9800' },
    SECURITY: { label: 'Seguridad', icon: 'shield', color: '#9C27B0' },
    ACCIDENT: { label: 'Accidente', icon: 'car', color: '#F44336' },
    NATURAL_DISASTER: { label: 'Desastre Natural', icon: 'thunderstorm', color: '#795548' },
} as const;

// ============================================
// TOUR
// ============================================
export const TOUR_DIFFICULTIES = {
    easy: { label: 'Fácil', color: '#4CAF50' },
    moderate: { label: 'Moderado', color: '#FFC107' },
    hard: { label: 'Difícil', color: '#FF9800' },
    expert: { label: 'Experto', color: '#F44336' },
} as const;

export const TOUR_STATUSES = {
    draft: { label: 'Borrador', color: '#9E9E9E' },
    published: { label: 'Publicado', color: '#4CAF50' },
    paused: { label: 'Pausado', color: '#FFC107' },
    completed: { label: 'Completado', color: '#2196F3' },
    cancelled: { label: 'Cancelado', color: '#F44336' },
} as const;

// ============================================
// PAYMENT
// ============================================
export const PAYMENT_METHODS = {
    card: { label: 'Tarjeta', icon: 'card' },
    yape: { label: 'Yape', icon: 'phone-portrait' },
    plin: { label: 'Plin', icon: 'phone-portrait' },
    bank_transfer: { label: 'Transferencia', icon: 'business' },
} as const;

export const PLATFORM_COMMISSION = 0.10; // 10%
export const CURRENCY = 'PEN';
export const CURRENCY_SYMBOL = 'S/';

// ============================================
// TRACKING
// ============================================
export const LOCATION_UPDATE_INTERVAL = 10000; // 10 seconds
export const SAFETY_CHECK_INTERVAL = 30000; // 30 seconds
export const OFFLINE_THRESHOLD = 300000; // 5 minutes

export const SAFETY_STATUSES = {
    safe: { label: 'Seguro', color: '#4CAF50', icon: 'checkmark-circle' },
    warning: { label: 'Precaución', color: '#FFC107', icon: 'alert-circle' },
    danger: { label: 'Peligro', color: '#F44336', icon: 'warning' },
} as const;

// ============================================
// LANGUAGES
// ============================================
export const SUPPORTED_LANGUAGES = [
    { code: 'es', name: 'Español', flag: '🇵🇪' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
] as const;

// ============================================
// STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
    ACCESS_TOKEN: '@ruta_segura:access_token',
    REFRESH_TOKEN: '@ruta_segura:refresh_token',
    USER: '@ruta_segura:user',
    LANGUAGE: '@ruta_segura:language',
    ONBOARDING_COMPLETE: '@ruta_segura:onboarding',
    PUSH_TOKEN: '@ruta_segura:push_token',
} as const;

// ============================================
// VALIDATION
// ============================================
export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    PHONE_MIN_LENGTH: 9,
    RUC_LENGTH: 11,
    DNI_LENGTH: 8,
} as const;

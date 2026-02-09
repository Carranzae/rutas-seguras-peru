/**
 * Ruta Segura Perú - API Configuration
 * Environment-based configuration for backend connection
 */

// Determine base URL based on environment
const getBaseUrl = (): string => {
    // === PRODUCCIÓN (Railway) ===
    return 'https://rutas-seguras-peru-production.up.railway.app';
};

export const API_CONFIG = {
    BASE_URL: getBaseUrl(),
    API_VERSION: '/api/v1',

    // Timeouts (ms)
    TIMEOUT: 30000,
    UPLOAD_TIMEOUT: 60000,

    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,

    // WebSocket
    WS_HEARTBEAT_INTERVAL: 30000,
    WS_RECONNECT_DELAY: 3000,
    WS_MAX_RECONNECT_ATTEMPTS: 10,
} as const;

export default API_CONFIG;

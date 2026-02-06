/**
 * Ruta Segura Perú - API Configuration
 * Environment-based configuration for backend connection
 */
import { Platform } from 'react-native';

// Determine base URL based on environment
const getBaseUrl = (): string => {
    if (!__DEV__) {
        return 'https://api.rutaseguraperu.com';
    }

    // Development
    if (Platform.OS === 'web') {
        return 'http://localhost:8000';
    }

    // Mobile development - use local network IP
    return 'http://192.168.48.174:8000';
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

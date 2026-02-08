/**
 * Ruta Segura Perú - API Configuration
 * Environment-based configuration for backend connection
 */
import { Platform } from 'react-native';

// Determine base URL based on environment
const getBaseUrl = (): string => {
    // === DESARROLLO ===
    // Cambia esta IP cuando cambies de red
    const LOCAL_BACKEND_IP = '192.168.48.174';

    // Para APK de producción real, descomenta esta línea:
    // return 'https://api.rutaseguraperu.com';

    // Para pruebas con backend local (APK o desarrollo):
    if (Platform.OS === 'web') {
        return 'http://localhost:8000';
    }

    // Android/iOS - usa la IP de tu laptop
    return `http://${LOCAL_BACKEND_IP}:8000`;
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

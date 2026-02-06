/**
 * Ruta Segura Perú - Application Error
 * Centralized error handling with typed error codes
 */

export enum ErrorCode {
    // Network errors
    NETWORK = 'NETWORK',
    TIMEOUT = 'TIMEOUT',

    // HTTP errors
    VALIDATION = 'VALIDATION',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    SERVER = 'SERVER',

    // Business errors
    BIOMETRIC_FAILED = 'BIOMETRIC_FAILED',
    BIOMETRIC_NOT_AVAILABLE = 'BIOMETRIC_NOT_AVAILABLE',
    LOCATION_DENIED = 'LOCATION_DENIED',
    VERIFICATION_REQUIRED = 'VERIFICATION_REQUIRED',
    TOUR_NOT_ACTIVE = 'TOUR_NOT_ACTIVE',

    // Upload errors
    UPLOAD = 'UPLOAD',
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

    // Unknown
    UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
    readonly code: ErrorCode;
    readonly statusCode?: number;
    readonly details?: unknown;

    constructor(
        message: string,
        code: ErrorCode = ErrorCode.UNKNOWN,
        statusCode?: number,
        details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;

        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }

    /**
     * Check if error is authentication-related
     */
    isAuthError(): boolean {
        return this.code === ErrorCode.UNAUTHORIZED || this.code === ErrorCode.FORBIDDEN;
    }

    /**
     * Check if error is network-related (retryable)
     */
    isNetworkError(): boolean {
        return this.code === ErrorCode.NETWORK || this.code === ErrorCode.TIMEOUT;
    }

    /**
     * Get user-friendly error message
     */
    getUserMessage(): string {
        switch (this.code) {
            case ErrorCode.NETWORK:
                return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
            case ErrorCode.TIMEOUT:
                return 'La solicitud tardó demasiado. Intenta de nuevo.';
            case ErrorCode.UNAUTHORIZED:
                return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
            case ErrorCode.FORBIDDEN:
                return 'No tienes permiso para realizar esta acción.';
            case ErrorCode.NOT_FOUND:
                return 'El recurso solicitado no fue encontrado.';
            case ErrorCode.VALIDATION:
                return this.message || 'Los datos ingresados no son válidos.';
            case ErrorCode.SERVER:
                return 'Error del servidor. Intenta más tarde.';
            case ErrorCode.BIOMETRIC_FAILED:
                return 'La verificación biométrica falló.';
            case ErrorCode.BIOMETRIC_NOT_AVAILABLE:
                return 'La autenticación biométrica no está disponible en este dispositivo.';
            case ErrorCode.LOCATION_DENIED:
                return 'Se requiere acceso a la ubicación para continuar.';
            case ErrorCode.VERIFICATION_REQUIRED:
                return 'Debes completar la verificación para acceder.';
            default:
                return this.message || 'Ha ocurrido un error inesperado.';
        }
    }

    /**
     * Create from unknown error
     */
    static from(error: unknown): AppError {
        if (error instanceof AppError) {
            return error;
        }

        if (error instanceof Error) {
            return new AppError(error.message, ErrorCode.UNKNOWN);
        }

        if (typeof error === 'string') {
            return new AppError(error, ErrorCode.UNKNOWN);
        }

        return new AppError('Error desconocido', ErrorCode.UNKNOWN);
    }
}

export default AppError;

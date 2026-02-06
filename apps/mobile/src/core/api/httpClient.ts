/**
 * Ruta Segura Perú - HTTP Client
 * Professional HTTP client with interceptors, retry, and error handling
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppError, ErrorCode } from '../errors/AppError';
import { API_CONFIG } from './config';

// Storage keys
const TOKEN_KEY = '@ruta_segura:access_token';
const REFRESH_TOKEN_KEY = '@ruta_segura:refresh_token';
const USER_KEY = '@ruta_segura:user';

// Types
export interface ApiResponse<T = unknown> {
    data: T;
    status: number;
    ok: boolean;
}

export interface TokenPair {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RequestConfig extends RequestInit {
    timeout?: number;
    retries?: number;
    skipAuth?: boolean;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

class HttpClient {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private refreshPromise: Promise<boolean> | null = null;
    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];

    constructor() {
        this.loadTokens();
    }

    // ==================== Token Management ====================

    private async loadTokens(): Promise<void> {
        try {
            const [access, refresh] = await Promise.all([
                AsyncStorage.getItem(TOKEN_KEY),
                AsyncStorage.getItem(REFRESH_TOKEN_KEY),
            ]);
            this.accessToken = access;
            this.refreshToken = refresh;
        } catch (error) {
            console.error('[HttpClient] Failed to load tokens:', error);
        }
    }

    async saveTokens(tokens: TokenPair): Promise<void> {
        this.accessToken = tokens.access_token;
        this.refreshToken = tokens.refresh_token;

        await Promise.all([
            AsyncStorage.setItem(TOKEN_KEY, tokens.access_token),
            AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token),
        ]);
    }

    async clearTokens(): Promise<void> {
        this.accessToken = null;
        this.refreshToken = null;
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    // ==================== Interceptors ====================

    addRequestInterceptor(interceptor: RequestInterceptor): () => void {
        this.requestInterceptors.push(interceptor);
        return () => {
            const index = this.requestInterceptors.indexOf(interceptor);
            if (index > -1) this.requestInterceptors.splice(index, 1);
        };
    }

    addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
        this.responseInterceptors.push(interceptor);
        return () => {
            const index = this.responseInterceptors.indexOf(interceptor);
            if (index > -1) this.responseInterceptors.splice(index, 1);
        };
    }

    // ==================== Token Refresh ====================

    private async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) return false;

        // Prevent multiple simultaneous refresh calls
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = (async () => {
            try {
                const url = `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/refresh`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: this.refreshToken }),
                });

                if (response.ok) {
                    const tokens: TokenPair = await response.json();
                    await this.saveTokens(tokens);
                    return true;
                }

                await this.clearTokens();
                return false;
            } catch {
                await this.clearTokens();
                return false;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    // ==================== Request with Retry ====================

    private async fetchWithRetry(
        url: string,
        config: RequestConfig,
        retries: number = 0
    ): Promise<Response> {
        try {
            const controller = new AbortController();
            const timeout = config.timeout || API_CONFIG.TIMEOUT;
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error: unknown) {
            const isAbortError = error instanceof Error && error.name === 'AbortError';
            if (isAbortError) {
                throw new AppError('Request timeout', ErrorCode.TIMEOUT);
            }

            if (retries < (config.retries || API_CONFIG.MAX_RETRIES)) {
                await new Promise(resolve =>
                    setTimeout(resolve, API_CONFIG.RETRY_DELAY * Math.pow(2, retries))
                );
                return this.fetchWithRetry(url, config, retries + 1);
            }

            throw new AppError('Network error', ErrorCode.NETWORK);
        }
    }

    // ==================== Main Request Method ====================

    async request<T = unknown>(
        endpoint: string,
        options: RequestConfig = {}
    ): Promise<ApiResponse<T>> {
        // Build URL
        const url = endpoint.startsWith('http')
            ? endpoint
            : `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        // Add auth header
        if (!options.skipAuth && this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        // Apply request interceptors
        let config: RequestConfig = { ...options, headers };
        for (const interceptor of this.requestInterceptors) {
            config = await interceptor(config);
        }

        try {
            let response = await this.fetchWithRetry(url, config);

            // Apply response interceptors
            for (const interceptor of this.responseInterceptors) {
                response = await interceptor(response);
            }

            // Handle 401 - try refresh
            if (response.status === 401 && !options.skipAuth && this.refreshToken) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    headers['Authorization'] = `Bearer ${this.accessToken}`;
                    response = await this.fetchWithRetry(url, { ...config, headers });
                }
            }

            // Parse response
            const data = response.status !== 204 ? await response.json() : null;

            if (!response.ok) {
                throw new AppError(
                    data?.detail || 'Request failed',
                    this.mapStatusToErrorCode(response.status),
                    response.status,
                    data
                );
            }

            return { data, status: response.status, ok: true };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Network error', ErrorCode.NETWORK);
        }
    }

    private mapStatusToErrorCode(status: number): ErrorCode {
        switch (status) {
            case 400: return ErrorCode.VALIDATION;
            case 401: return ErrorCode.UNAUTHORIZED;
            case 403: return ErrorCode.FORBIDDEN;
            case 404: return ErrorCode.NOT_FOUND;
            case 500: return ErrorCode.SERVER;
            default: return ErrorCode.UNKNOWN;
        }
    }

    // ==================== Convenience Methods ====================

    get<T = unknown>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { ...config, method: 'GET' });
    }

    post<T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    put<T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    patch<T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    delete<T = unknown>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { ...config, method: 'DELETE' });
    }

    // ==================== Upload Method ====================

    async upload<T = unknown>(
        endpoint: string,
        formData: FormData,
        onProgress?: (progress: number) => void
    ): Promise<ApiResponse<T>> {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}${endpoint}`;

        const headers: Record<string, string> = {};
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        // Note: Don't set Content-Type for FormData, browser will set it with boundary
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new AppError(
                data?.detail || 'Upload failed',
                ErrorCode.UPLOAD,
                response.status
            );
        }

        onProgress?.(100);
        return { data, status: response.status, ok: true };
    }
}

// Export singleton
export const httpClient = new HttpClient();
export default httpClient;

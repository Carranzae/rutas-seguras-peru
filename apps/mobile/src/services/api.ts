/**
 * Ruta Segura Perú - API Service
 * HTTP client with authentication and error handling
 */
import { getApiUrl } from '@/src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const TOKEN_KEY = '@ruta_segura:access_token';
const REFRESH_TOKEN_KEY = '@ruta_segura:refresh_token';
const USER_KEY = '@ruta_segura:user';

// Types
interface ApiResponse<T = any> {
    data: T;
    status: number;
    ok: boolean;
}

interface TokenPair {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

interface ApiError {
    detail: string;
    status: number;
}

class ApiService {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private refreshPromise: Promise<boolean> | null = null;

    constructor() {
        this.loadTokens();
    }

    /**
     * Load tokens from AsyncStorage on init
     */
    private async loadTokens(): Promise<void> {
        try {
            this.accessToken = await AsyncStorage.getItem(TOKEN_KEY);
            this.refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Failed to load tokens:', error);
        }
    }

    /**
     * Save tokens to storage
     */
    async saveTokens(tokens: TokenPair): Promise<void> {
        this.accessToken = tokens.access_token;
        this.refreshToken = tokens.refresh_token;

        await AsyncStorage.setItem(TOKEN_KEY, tokens.access_token);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }

    /**
     * Clear tokens on logout
     */
    async clearTokens(): Promise<void> {
        this.accessToken = null;
        this.refreshToken = null;

        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    }

    /**
     * Get current access token
     */
    getAccessToken(): string | null {
        return this.accessToken;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    /**
     * Refresh access token
     */
    private async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) return false;

        // Prevent multiple refresh calls
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = (async () => {
            try {
                const response = await fetch(getApiUrl('/auth/refresh'), {
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

    /**
     * Make HTTP request with auth
     */
    async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = getApiUrl(endpoint);

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Add auth header if we have a token
        if (this.accessToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const config: RequestInit = {
            ...options,
            headers,
        };

        try {
            let response = await fetch(url, config);

            // If 401, try to refresh token
            if (response.status === 401 && this.refreshToken) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry with new token
                    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
                    response = await fetch(url, config);
                }
            }

            const data = response.status !== 204 ? await response.json() : null;

            if (!response.ok) {
                throw {
                    detail: data?.detail || 'Request failed',
                    status: response.status,
                } as ApiError;
            }

            return {
                data,
                status: response.status,
                ok: true,
            };
        } catch (error: any) {
            if (error.detail) throw error;

            throw {
                detail: 'Network error. Please check your connection.',
                status: 0,
            } as ApiError;
        }
    }

    // Convenience methods
    async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

// Export singleton instance
export const api = new ApiService();
export default api;

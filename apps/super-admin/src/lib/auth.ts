/**
 * Super Admin Dashboard - Auth Service
 */
import { apiRequest, ENDPOINTS, removeAuthToken, setAuthToken } from './api';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export const authService = {
    async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await apiRequest<LoginResponse>(ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        setAuthToken(response.access_token);
        return response;
    },

    async getMe(): Promise<User> {
        return apiRequest<User>(ENDPOINTS.ME);
    },

    logout(): void {
        removeAuthToken();
        window.location.href = '/';
    },
};

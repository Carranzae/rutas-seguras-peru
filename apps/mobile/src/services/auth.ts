/**
 * Ruta Segura Perú - Auth Service
 * Authentication operations (login, register, logout)
 */
import { ENDPOINTS } from '@/src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Types
export interface User {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    role: 'super_admin' | 'agency_admin' | 'guide' | 'tourist';
    is_active: boolean;
    is_verified: boolean;
    avatar_url: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    created_at: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: string;
    language?: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

const USER_KEY = '@ruta_segura:user';

class AuthService {
    private currentUser: User | null = null;

    constructor() {
        this.loadUser();
    }

    /**
     * Load user from storage on init
     */
    private async loadUser(): Promise<void> {
        try {
            const userJson = await AsyncStorage.getItem(USER_KEY);
            if (userJson) {
                this.currentUser = JSON.parse(userJson);
            }
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    }

    /**
     * Get current user
     */
    getUser(): User | null {
        return this.currentUser;
    }

    /**
     * Register new user
     */
    async register(data: RegisterRequest): Promise<User> {
        const response = await api.post<User>(ENDPOINTS.AUTH.REGISTER, {
            ...data,
            role: data.role || 'tourist',
            language: data.language || 'es',
        });

        return response.data;
    }

    /**
     * Login with email/password
     */
    async login(credentials: LoginRequest): Promise<User> {
        // Get tokens
        const tokenResponse = await api.post<AuthTokens>(
            ENDPOINTS.AUTH.LOGIN,
            credentials
        );

        // Save tokens
        await api.saveTokens(tokenResponse.data);

        // Get user profile
        const userResponse = await api.get<User>(ENDPOINTS.AUTH.ME);
        this.currentUser = userResponse.data;

        // Save user to storage
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));

        return this.currentUser;
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        this.currentUser = null;
        await api.clearTokens();
    }

    /**
     * Refresh user profile
     */
    async refreshProfile(): Promise<User> {
        const response = await api.get<User>(ENDPOINTS.AUTH.ME);
        this.currentUser = response.data;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
        return this.currentUser;
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn(): boolean {
        return api.isAuthenticated() && !!this.currentUser;
    }

    /**
     * Request password reset email
     */
    async forgotPassword(email: string): Promise<void> {
        await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    }

    /**
     * Reset password with token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
            token,
            new_password: newPassword,
        });
    }
}

// Export singleton
export const authService = new AuthService();
export default authService;

/**
 * Ruta Segura Perú - Auth Service
 * Authentication operations (login, register, logout)
 */
import { ENDPOINTS, httpClient } from '@/src/core/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthTokens, LoginRequest, RegisterRequest, User } from '../types';

const USER_KEY = '@ruta_segura:user';

class AuthService {
    /**
     * Register new user
     */
    async register(data: RegisterRequest): Promise<User> {
        const response = await httpClient.post<User>(ENDPOINTS.AUTH.REGISTER, {
            ...data,
            role: data.role || 'tourist',
            language: data.language || 'es',
        });
        return response.data;
    }

    /**
     * Login with email/password
     */
    async login(credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
        // Get tokens
        const tokenResponse = await httpClient.post<AuthTokens>(
            ENDPOINTS.AUTH.LOGIN,
            credentials,
            { skipAuth: true }
        );

        const tokens = tokenResponse.data;

        // Save tokens
        await httpClient.saveTokens(tokens);

        // Get user profile
        const userResponse = await httpClient.get<User>(ENDPOINTS.AUTH.ME);
        const user = userResponse.data;

        // Save user to storage
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

        return { user, tokens };
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        await httpClient.clearTokens();
        await AsyncStorage.removeItem(USER_KEY);
    }

    /**
     * Get current user from storage
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            const userJson = await AsyncStorage.getItem(USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch {
            return null;
        }
    }

    /**
     * Refresh user profile from server
     */
    async refreshProfile(): Promise<User> {
        const response = await httpClient.get<User>(ENDPOINTS.AUTH.ME);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
        return response.data;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return httpClient.isAuthenticated();
    }

    /**
     * Request password reset email
     */
    async forgotPassword(email: string): Promise<void> {
        await httpClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    }

    /**
     * Reset password with token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        await httpClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
            token,
            new_password: newPassword,
        });
    }

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await httpClient.patch<User>(ENDPOINTS.USERS.UPDATE, data);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
        return response.data;
    }
}

export const authService = new AuthService();
export default authService;

// API Service for Super Admin Dashboard
import { API_BASE_URL, API_VERSION } from '@/lib/api';

const FULL_API_URL = `${API_BASE_URL}${API_VERSION}`;

class ApiService {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string = FULL_API_URL) {
        this.baseUrl = baseUrl;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('superadmin_token');
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        };

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    }

    // Generic HTTP methods
    async get<T = any>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T = any>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T = any>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T = any>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    async patch<T = any>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // Auth
    async login(email: string, password: string) {
        const data = await this.request<{ access_token: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.token = data.access_token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('superadmin_token', data.access_token);
        }
        return data;
    }

    // Users
    async getUsers(role?: string, page: number = 1, search?: string) {
        const query = new URLSearchParams({
            page: page.toString(),
            ...(role && { role }),
            ...(search && { search }),
        }).toString();
        return this.request<any>(`/admin/users?${query}`);
    }

    // Agencies
    async getAgencies() {
        return this.request('/agencies');
    }

    async getAgency(id: string) {
        return this.request(`/agencies/${id}`);
    }

    // Guides
    async getGuides() {
        return this.request('/guides');
    }

    async getPendingVerifications() {
        return this.request('/admin/verifications/pending');
    }

    async approveGuide(id: string) {
        return this.request(`/guides/${id}/verify`, {
            method: 'POST',
            body: JSON.stringify({ approved: true })
        });
    }

    async rejectGuide(id: string, reason: string) {
        return this.request(`/guides/${id}/verify`, {
            method: 'POST',
            body: JSON.stringify({ approved: false, notes: reason }),
        });
    }

    // Emergencies
    async getActiveEmergencies() {
        return this.request('/admin/emergencies/active');
    }

    async getEmergency(id: string) {
        return this.request(`/emergencies/${id}`);
    }

    // Analytics
    async getDashboardStats() {
        return this.request<any>('/admin/dashboard/stats');
    }

    async getRevenueStats(period: string = 'month') {
        return this.request<any>(`/admin/analytics/revenue?period=${period}`);
    }

    // Tracking
    async getActiveDevices() {
        return this.request<any>('/tracking/active');
    }

    async getDeviceLocation(id: string) {
        return this.request<any>(`/tracking/${id}/location`);
    }

    // Payments
    async getPayments(params?: { status?: string; page?: number }) {
        const query = new URLSearchParams(params as any).toString();
        return this.request<any>(`/admin/payments/recent${query ? `?${query}` : ''}`);
    }

    // Notifications
    async sendBroadcast(message: string, targets: string[]) {
        return this.request('/notifications/broadcast', {
            method: 'POST',
            body: JSON.stringify({ message, targets }),
        });
    }
    // Uploads
    async uploadFile(file: File, category: string = 'general'): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        const token = this.token || (typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null);

        const response = await fetch(`${this.baseUrl}/uploads/image`, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload Error: ${response.status}`);
        }

        return response.json();
    }
}

export const api = new ApiService();
export default api;

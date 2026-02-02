/**
 * Ruta Segura Perú - Admin Service
 * Frontend service for super admin dashboard
 */
import api from './api';

// Types
export interface DashboardStats {
    total_users: number;
    total_agencies: number;
    total_guides: number;
    total_tours: number;
    total_emergencies: number;
    total_revenue: number;
    platform_earnings: number;
    pending_verifications: number;
    active_emergencies: number;
}

export interface UserSummary {
    id: string;
    email: string;
    full_name?: string;
    role: string;
    created_at: string;
    is_active: boolean;
}

export interface UserListResponse {
    items: UserSummary[];
    total: number;
    page: number;
    per_page: number;
}

export interface AgencyPending {
    id: string;
    business_name: string;
    ruc: string;
    email: string;
    created_at: string;
}

export interface GuidePending {
    id: string;
    user_name?: string;
    dircetur_id: string;
    created_at: string;
}

export interface PendingVerifications {
    agencies: AgencyPending[];
    guides: GuidePending[];
}

export interface ActiveEmergency {
    id: string;
    user_name: string;
    user_email?: string;
    severity: string;
    created_at: string;
}

export interface RecentPayment {
    id: string;
    amount: number;
    status: string;
    user_email?: string;
    created_at: string;
    platform_commission: number;
}

// Admin Service
export const adminService = {
    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await api.get<DashboardStats>('/admin/dashboard');
        return response.data;
    },

    /**
     * List all users
     */
    async listUsers(
        role?: string,
        search?: string,
        page: number = 1,
        perPage: number = 20
    ): Promise<UserListResponse> {
        let url = `/admin/users?page=${page}&per_page=${perPage}`;
        if (role) url += `&role=${role}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const response = await api.get<UserListResponse>(url);
        return response.data;
    },

    /**
     * Get pending verifications (agencies + guides)
     */
    async getPendingVerifications(): Promise<PendingVerifications> {
        const response = await api.get<PendingVerifications>('/admin/verifications/pending');
        return response.data;
    },

    /**
     * Get active emergencies
     */
    async getActiveEmergencies(): Promise<ActiveEmergency[]> {
        const response = await api.get<ActiveEmergency[]>('/admin/emergencies/active');
        return response.data;
    },

    /**
     * Get recent payments
     */
    async getRecentPayments(limit: number = 20): Promise<RecentPayment[]> {
        const response = await api.get<RecentPayment[]>(`/admin/payments/recent?limit=${limit}`);
        return response.data;
    },

    /**
     * Toggle user active status
     */
    async toggleUserActive(userId: string): Promise<{ id: string; is_active: boolean }> {
        const response = await api.post<{ id: string; is_active: boolean }>(
            `/admin/user/${userId}/toggle-active`
        );
        return response.data;
    },
};

export default adminService;

/**
 * Agency Web - API Services
 * Typed service methods for agency dashboard
 */
import api from './api';

// ============================================
// TOURS
// ============================================

export interface Tour {
    id: string;
    title: string;
    description: string;
    short_description?: string;
    price: number;
    currency: string;
    duration_hours: number;
    max_participants: number;
    difficulty: 'easy' | 'moderate' | 'challenging' | 'expert';
    included: string[];
    not_included: string[];
    meeting_point: string;
    meeting_latitude?: number;
    meeting_longitude?: number;
    cover_image_url?: string;
    gallery_urls?: string[];
    status: 'draft' | 'published' | 'archived';
    is_featured: boolean;
    rating: number;
    reviews_count: number;
    created_at: string;
}

export interface CreateTourData {
    title: string;
    description: string;
    short_description?: string;
    price: number;
    duration_hours: number;
    max_participants: number;
    difficulty: string;
    included: string[];
    not_included: string[];
    meeting_point: string;
    meeting_latitude?: number;
    meeting_longitude?: number;
    status?: string;
}

export const toursService = {
    list: async (page = 1, size = 20, status?: string) => {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (status) params.append('status', status);
        const { data } = await api.get(`/tours?${params}`);
        return data;
    },

    getById: async (id: string) => {
        const { data } = await api.get(`/tours/${id}`);
        return data as Tour;
    },

    create: async (tourData: CreateTourData) => {
        const { data } = await api.post('/tours', tourData);
        return data as Tour;
    },

    update: async (id: string, tourData: Partial<CreateTourData>) => {
        const { data } = await api.put(`/tours/${id}`, tourData);
        return data as Tour;
    },

    delete: async (id: string) => {
        await api.delete(`/tours/${id}`);
    },

    publish: async (id: string) => {
        const { data } = await api.post(`/tours/${id}/publish`);
        return data as Tour;
    },

    uploadImage: async (tourId: string, file: File, type: 'cover' | 'gallery' = 'cover') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        const { data } = await api.post(`/uploads/tour/${tourId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
};

// ============================================
// GUIDES
// ============================================

export interface Guide {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone?: string;
    dircetur_code?: string;
    languages: string[];
    specialties: string[];
    bio?: string;
    photo_url?: string;
    rating: number;
    total_tours: number;
    status: 'pending' | 'active' | 'suspended' | 'inactive';
    is_dircetur_verified: boolean;
    is_biometric_verified: boolean;
}

export const guidesService = {
    list: async (page = 1, size = 20) => {
        const { data } = await api.get(`/guides?page=${page}&size=${size}`);
        return data;
    },

    getById: async (id: string) => {
        const { data } = await api.get(`/guides/${id}`);
        return data as Guide;
    },

    assignToAgency: async (guideId: string) => {
        const { data } = await api.post(`/guides/${guideId}/assign`);
        return data;
    },

    removeFromAgency: async (guideId: string) => {
        await api.post(`/guides/${guideId}/unassign`);
    },
};

// ============================================
// WALLET
// ============================================

export interface WalletBalance {
    available: number;
    pending: number;
    total: number;
    currency: string;
}

export interface Transaction {
    id: string;
    type: 'earning' | 'payout' | 'refund' | 'fee';
    amount: number;
    description: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
    booking_id?: string;
}

export const walletService = {
    getBalance: async () => {
        const { data } = await api.get('/wallet/balance');
        return data as WalletBalance;
    },

    getTransactions: async (page = 1, size = 20) => {
        const { data } = await api.get(`/wallet/transactions?page=${page}&size=${size}`);
        return data;
    },

    requestPayout: async (amount: number, bankAccount: string) => {
        const { data } = await api.post('/wallet/payout', { amount, bank_account: bankAccount });
        return data;
    },
};

// ============================================
// BOOKINGS
// ============================================

export interface Booking {
    id: string;
    tour_id: string;
    tour_title: string;
    user_id: string;
    user_name: string;
    user_email: string;
    guide_id?: string;
    guide_name?: string;
    scheduled_date: string;
    num_participants: number;
    total_amount: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    special_requests?: string;
    created_at: string;
}

export const bookingsService = {
    list: async (page = 1, size = 20, status?: string) => {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (status) params.append('status', status);
        const { data } = await api.get(`/bookings?${params}`);
        return data;
    },

    getById: async (id: string) => {
        const { data } = await api.get(`/bookings/${id}`);
        return data as Booking;
    },

    confirm: async (id: string, guideId: string) => {
        const { data } = await api.post(`/bookings/${id}/confirm`, { guide_id: guideId });
        return data;
    },

    cancel: async (id: string, reason: string) => {
        const { data } = await api.post(`/bookings/${id}/cancel`, { reason });
        return data;
    },

    complete: async (id: string) => {
        const { data } = await api.post(`/bookings/${id}/complete`);
        return data;
    },
};

// ============================================
// ANALYTICS
// ============================================

export interface DashboardStats {
    tourists_today: number;
    active_tours: number;
    monthly_revenue: number;
    average_rating: number;
}

export const analyticsService = {
    getDashboardStats: async () => {
        const { data } = await api.get('/analytics/agency/dashboard');
        return data as DashboardStats;
    },
};

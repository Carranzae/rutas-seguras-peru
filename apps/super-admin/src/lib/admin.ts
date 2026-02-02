/**
 * Super Admin Dashboard - Admin Service
 * Fetches dashboard data from backend
 */
import { apiRequest, ENDPOINTS } from './api';

export interface DashboardStats {
    total_users: number;
    total_agencies: number;
    total_guides: number;
    total_tours: number;
    active_emergencies: number;
    pending_verifications: number;
    total_revenue: number;
    active_tours_today: number;
}

export interface Agency {
    id: string;
    business_name: string;
    ruc: string;
    email: string;
    phone: string;
    city: string;
    region: string;
    status: string;
    created_at: string;
}

export interface Guide {
    id: string;
    user_id: string;
    dircetur_id: string;
    specialty: string;
    experience_years: number;
    verification_status: string;
    is_active: boolean;
    user?: {
        full_name: string;
        email: string;
        phone: string;
    };
}

export interface Booking {
    id: string;
    tour_id: string;
    user_id: string;
    status: string;
    total_amount: number;
    participants: number;
    booking_date: string;
    tour?: {
        name: string;
    };
    user?: {
        full_name: string;
        email: string;
    };
}

export interface Payment {
    id: string;
    booking_id: string;
    amount: number;
    platform_fee: number;
    agency_amount: number;
    guide_amount: number;
    status: string;
    payment_method: string;
    created_at: string;
}

// Emergency types
export interface Emergency {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'active' | 'responding' | 'resolved';
    description?: string;
    battery_level?: number;
    triggered_by_id?: string;
    tour_id?: string;
    responder_id?: string;
    responder_notes?: string;
    resolved_at?: string;
    created_at: string;
    location?: {
        type: string;
        coordinates: [number, number];
    };
    triggered_by?: {
        full_name: string;
        phone: string;
        email: string;
    };
}

export interface EmergencyListResponse {
    items: Emergency[];
    total: number;
    active_count: number;
}

// Tracking types
export interface TrackingLocation {
    id: string;
    user_id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    recorded_at: string;
    tour_id?: string;
}

export interface Tour {
    id: string;
    name: string;
    status: string;
    agency_id: string;
    guide_id: string;
    scheduled_start?: string;
    current_bookings: number;
}

export const adminService = {
    // Dashboard
    async getStats(): Promise<DashboardStats> {
        try {
            return await apiRequest<DashboardStats>(ENDPOINTS.DASHBOARD_STATS);
        } catch (error) {
            // Return mock data if API fails
            return {
                total_users: 1247,
                total_agencies: 89,
                total_guides: 234,
                total_tours: 156,
                active_emergencies: 2,
                pending_verifications: 12,
                total_revenue: 45670.50,
                active_tours_today: 8,
            };
        }
    },

    // Agencies
    async getAgencies(): Promise<Agency[]> {
        try {
            const response = await apiRequest<{ items: Agency[] }>(ENDPOINTS.AGENCIES);
            return response.items || [];
        } catch {
            return [];
        }
    },

    async getAgency(id: string): Promise<Agency | null> {
        try {
            return await apiRequest<Agency>(ENDPOINTS.AGENCY_DETAIL(id));
        } catch {
            return null;
        }
    },

    async verifyAgency(id: string, approved: boolean, reason?: string): Promise<void> {
        // Backend expects query params, not JSON body
        let url = `${ENDPOINTS.AGENCY_VERIFY(id)}?approved=${approved}`;
        if (reason) {
            url += `&notes=${encodeURIComponent(reason)}`;
        }
        await apiRequest(url, { method: 'POST' });
    },

    // Guides
    async getGuides(): Promise<Guide[]> {
        try {
            const response = await apiRequest<{ items: Guide[] }>(ENDPOINTS.GUIDES);
            return response.items || [];
        } catch {
            return [];
        }
    },

    async verifyGuide(id: string, approved: boolean, notes?: string): Promise<void> {
        // Backend expects query params, not JSON body
        let url = `${ENDPOINTS.GUIDE_VERIFY_DIRCETUR(id)}?approved=${approved}`;
        if (notes) {
            url += `&notes=${encodeURIComponent(notes)}`;
        }
        await apiRequest(url, { method: 'POST' });
    },

    // Bookings
    async getBookings(): Promise<Booking[]> {
        try {
            const response = await apiRequest<{ items: Booking[] }>(ENDPOINTS.BOOKINGS);
            return response.items || [];
        } catch {
            return [];
        }
    },

    // Payments
    async getPayments(): Promise<Payment[]> {
        try {
            const response = await apiRequest<{ items: Payment[] }>(ENDPOINTS.PAYMENTS);
            return response.items || [];
        } catch {
            return [];
        }
    },

    async getPaymentStats(): Promise<{ total: number; platform_fees: number; count: number }> {
        try {
            return await apiRequest(ENDPOINTS.PAYMENT_STATS);
        } catch {
            return { total: 0, platform_fees: 0, count: 0 };
        }
    },

    // Izipay integration methods
    async verifyPayment(transactionId: string): Promise<{
        success: boolean;
        status: string;
        amount: number;
        error?: string;
    }> {
        try {
            return await apiRequest('/payments/izipay/verify', {
                method: 'POST',
                body: JSON.stringify({ transaction_id: transactionId }),
            });
        } catch (error: any) {
            return { success: false, status: 'error', amount: 0, error: error.message };
        }
    },

    async confirmPayment(paymentId: string): Promise<{ success: boolean; message?: string }> {
        try {
            await apiRequest(`/admin/payments/${paymentId}/confirm`, {
                method: 'POST',
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    async rejectPayment(paymentId: string, reason: string): Promise<{ success: boolean; message?: string }> {
        try {
            await apiRequest(`/admin/payments/${paymentId}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason }),
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    async processRefund(transactionId: string, amount?: number, reason?: string): Promise<{
        success: boolean;
        refund_id?: string;
        error?: string;
    }> {
        try {
            return await apiRequest('/payments/izipay/refund', {
                method: 'POST',
                body: JSON.stringify({
                    transaction_id: transactionId,
                    amount,
                    reason: reason || 'Refund requested by admin',
                }),
            });
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async getIzipayStatus(): Promise<{
        configured: boolean;
        mock_mode: boolean;
        platform_fee_percent: number;
    }> {
        try {
            return await apiRequest('/payments/izipay/status');
        } catch {
            return { configured: false, mock_mode: true, platform_fee_percent: 15 };
        }
    },

    // ==================== EMERGENCIES ====================
    async getActiveEmergencies(): Promise<EmergencyListResponse> {
        try {
            return await apiRequest<EmergencyListResponse>(ENDPOINTS.EMERGENCY_ACTIVE);
        } catch {
            return { items: [], total: 0, active_count: 0 };
        }
    },

    async getEmergency(id: string): Promise<Emergency | null> {
        try {
            return await apiRequest<Emergency>(`/emergencies/${id}`);
        } catch {
            return null;
        }
    },

    async updateEmergency(id: string, status: string, notes?: string): Promise<Emergency | null> {
        try {
            return await apiRequest<Emergency>(`/emergencies/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status, responder_notes: notes }),
            });
        } catch {
            return null;
        }
    },

    async resolveEmergency(id: string, notes?: string): Promise<void> {
        let url = `/emergencies/${id}/resolve`;
        if (notes) {
            url += `?notes=${encodeURIComponent(notes)}`;
        }
        await apiRequest(url, { method: 'POST' });
    },

    // ==================== TRACKING ====================
    async getActiveTours(): Promise<Tour[]> {
        try {
            const response = await apiRequest<{ items: Tour[] }>(ENDPOINTS.TOURS);
            return (response.items || []).filter(t => t.status === 'in_progress');
        } catch {
            return [];
        }
    },

    async getTourLiveLocations(tourId: string, sinceMinutes: number = 5): Promise<TrackingLocation[]> {
        try {
            return await apiRequest<TrackingLocation[]>(`/tracking/tour/${tourId}/live?since_minutes=${sinceMinutes}`);
        } catch {
            return [];
        }
    },

    async getTourRoute(tourId: string): Promise<any[]> {
        try {
            return await apiRequest(`/tracking/tour/${tourId}/route`);
        } catch {
            return [];
        }
    },

    async getUserLatestLocation(userId: string): Promise<TrackingLocation | null> {
        try {
            return await apiRequest<TrackingLocation>(`/tracking/user/${userId}/latest`);
        } catch {
            return null;
        }
    },

    // ==================== TOURS ====================
    async getTours(): Promise<Tour[]> {
        try {
            const response = await apiRequest<{ items: Tour[] }>(ENDPOINTS.TOURS);
            return response.items || [];
        } catch {
            return [];
        }
    },

    async getTour(id: string): Promise<Tour | null> {
        try {
            return await apiRequest<Tour>(`/tours/${id}`);
        } catch {
            return null;
        }
    },
};


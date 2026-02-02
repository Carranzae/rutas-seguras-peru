/**
 * Ruta Segura Perú - Payments Service
 * Frontend service for IziPay payment operations
 */
import { ENDPOINTS } from '../config/api';
import api from './api';

// Types
export interface Payment {
    id: string;
    transaction_id?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
    payment_method: string;
    user_email?: string;
    created_at: string;
    paid_at?: string;
    platform_commission: number;
    agency_amount: number;
    guide_amount: number;
}

export interface PaymentListResponse {
    items: Payment[];
    total: number;
    page: number;
    per_page: number;
}

export interface InitiatePaymentData {
    tour_id: string;
    booking_id?: string;
    amount: number;
    agency_id: string;
    guide_id?: string;
}

export interface InitiatePaymentResponse {
    payment_id: string;
    order_id: string;
    amount: number;
    izipay: {
        success: boolean;
        orderId: string;
        merchantCode: string;
        publicKey: string;
        signature: string;
        formData: any;
    };
    commission_breakdown: {
        platform: number;
        agency: number;
        guide: number;
    };
}

export interface PlatformStats {
    total_revenue: number;
    platform_earnings: number;
    total_transactions: number;
    pending_payouts: number;
}

// Payments Service
export const paymentsService = {
    async initiate(data: InitiatePaymentData): Promise<InitiatePaymentResponse> {
        const response = await api.post<InitiatePaymentResponse>(ENDPOINTS.PAYMENTS.INITIATE, data);
        return response.data;
    },

    async getMyPayments(page: number = 1, perPage: number = 20): Promise<PaymentListResponse> {
        const response = await api.get<PaymentListResponse>(
            `${ENDPOINTS.PAYMENTS.MY}?page=${page}&per_page=${perPage}`
        );
        return response.data;
    },

    async getById(paymentId: string): Promise<Payment> {
        const response = await api.get<Payment>(ENDPOINTS.PAYMENTS.DETAIL(paymentId));
        return response.data;
    },

    async getAgencyPayments(
        agencyId: string,
        status?: string,
        page: number = 1,
        perPage: number = 20
    ): Promise<PaymentListResponse> {
        let url = `${ENDPOINTS.PAYMENTS.AGENCY(agencyId)}?page=${page}&per_page=${perPage}`;
        if (status) url += `&status=${status}`;
        const response = await api.get<PaymentListResponse>(url);
        return response.data;
    },

    async refund(paymentId: string, reason: string): Promise<Payment> {
        const response = await api.post<Payment>(ENDPOINTS.PAYMENTS.REFUND(paymentId), { reason });
        return response.data;
    },

    async getPlatformStats(): Promise<PlatformStats> {
        const response = await api.get<PlatformStats>(ENDPOINTS.PAYMENTS.STATS);
        return response.data;
    },
};

export default paymentsService;

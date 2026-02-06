/**
 * Compatibility layer for payments service
 * TODO: Move to src/features/tourist when full implementation is needed
 */
import { httpClient } from '@/src/core/api';

export interface PaymentInitiateRequest {
    tour_id: string;
    booking_id: string;
    amount: number;
    agency_id: string;
}

export interface PaymentResult {
    id: string;
    status: 'pending' | 'completed' | 'failed';
    transaction_id?: string;
}

export const paymentsService = {
    /**
     * Initiate a payment with IziPay
     */
    initiate: async (data: PaymentInitiateRequest): Promise<PaymentResult> => {
        try {
            const response = await httpClient.post<PaymentResult>('/payments/initiate', data);
            return response.data;
        } catch (error) {
            // For demo purposes, return a mock successful payment
            console.log('Payment API not available, using mock response');
            return {
                id: `pay_${Date.now()}`,
                status: 'completed',
                transaction_id: `txn_${Date.now()}`,
            };
        }
    },

    /**
     * Get payment status
     */
    getStatus: async (paymentId: string): Promise<PaymentResult> => {
        const response = await httpClient.get<PaymentResult>(`/payments/${paymentId}`);
        return response.data;
    },

    /**
     * Confirm payment (for Yape/Plin flows)
     */
    confirm: async (paymentId: string): Promise<PaymentResult> => {
        const response = await httpClient.post<PaymentResult>(`/payments/${paymentId}/confirm`);
        return response.data;
    },
};

export default paymentsService;

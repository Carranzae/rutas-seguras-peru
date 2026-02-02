/**
 * Ruta Segura Perú - Bookings Service
 * Frontend service for tour reservations
 */
import api from './api';

// Types
export interface Booking {
    id: string;
    tour_id: string;
    user_id: string;
    num_participants: number;
    scheduled_date: string;
    status: 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed';
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    special_requests?: string;
    created_at: string;
    tour_name?: string;
    user_name?: string;
    user_email?: string;
}

export interface BookingListResponse {
    items: Booking[];
    total: number;
    page: number;
    per_page: number;
}

export interface CreateBookingData {
    tour_id: string;
    num_participants: number;
    scheduled_date: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    special_requests?: string;
}

export interface BookingStats {
    total: number;
    by_status: {
        pending: number;
        confirmed: number;
        paid: number;
        cancelled: number;
        completed: number;
    };
    today: number;
}

// Bookings Service
export const bookingsService = {
    /**
     * Create a new booking
     */
    async create(data: CreateBookingData): Promise<Booking> {
        const response = await api.post<Booking>('/bookings', data);
        return response.data;
    },

    /**
     * Get user's bookings
     */
    async getMyBookings(
        status?: string,
        page: number = 1,
        perPage: number = 20
    ): Promise<BookingListResponse> {
        let url = `/bookings/my?page=${page}&per_page=${perPage}`;
        if (status) url += `&status=${status}`;

        const response = await api.get<BookingListResponse>(url);
        return response.data;
    },

    /**
     * Get booking details
     */
    async getById(bookingId: string): Promise<Booking> {
        const response = await api.get<Booking>(`/bookings/${bookingId}`);
        return response.data;
    },

    /**
     * Get all bookings (admin)
     */
    async getAll(
        status?: string,
        agencyId?: string,
        page: number = 1,
        perPage: number = 20
    ): Promise<BookingListResponse> {
        let url = `/bookings?page=${page}&per_page=${perPage}`;
        if (status) url += `&status=${status}`;
        if (agencyId) url += `&agency_id=${agencyId}`;

        const response = await api.get<BookingListResponse>(url);
        return response.data;
    },

    /**
     * Get tour bookings
     */
    async getTourBookings(
        tourId: string,
        page: number = 1,
        perPage: number = 20
    ): Promise<BookingListResponse> {
        const response = await api.get<BookingListResponse>(
            `/bookings/tour/${tourId}?page=${page}&per_page=${perPage}`
        );
        return response.data;
    },

    /**
     * Update booking status
     */
    async updateStatus(bookingId: string, status: string): Promise<Booking> {
        const response = await api.patch<Booking>(
            `/bookings/${bookingId}/status`,
            { status }
        );
        return response.data;
    },

    /**
     * Cancel booking
     */
    async cancel(bookingId: string): Promise<Booking> {
        const response = await api.post<Booking>(`/bookings/${bookingId}/cancel`);
        return response.data;
    },

    /**
     * Get booking statistics
     */
    async getStats(): Promise<BookingStats> {
        const response = await api.get<BookingStats>('/bookings/stats');
        return response.data;
    },
};

export default bookingsService;

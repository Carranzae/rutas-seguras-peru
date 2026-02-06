/**
 * Ruta Segura Perú - Booking Service
 * Tour bookings management
 */
import { ENDPOINTS, httpClient } from '@/src/core/api';
import type { Booking } from '../types';

class BookingService {
    /**
     * Get my bookings
     */
    async getMyBookings(): Promise<Booking[]> {
        const response = await httpClient.get<Booking[]>(ENDPOINTS.BOOKINGS.MY);
        return response.data;
    }

    /**
     * Get booking details
     */
    async getBookingById(bookingId: string): Promise<Booking> {
        const response = await httpClient.get<Booking>(
            ENDPOINTS.BOOKINGS.DETAIL(bookingId)
        );
        return response.data;
    }

    /**
     * Create new booking
     */
    async createBooking(data: {
        tour_id: string;
        booking_date: string;
        num_travelers: number;
        special_requirements?: string;
    }): Promise<Booking> {
        const response = await httpClient.post<Booking>(
            ENDPOINTS.BOOKINGS.CREATE,
            data
        );
        return response.data;
    }

    /**
     * Cancel booking
     */
    async cancelBooking(bookingId: string, reason?: string): Promise<void> {
        await httpClient.post(ENDPOINTS.BOOKINGS.CANCEL(bookingId), { reason });
    }

    /**
     * Get upcoming bookings
     */
    async getUpcomingBookings(): Promise<Booking[]> {
        const bookings = await this.getMyBookings();
        const now = new Date();
        return bookings.filter(
            b => b.status === 'confirmed' && new Date(b.booking_date) > now
        );
    }

    /**
     * Get past bookings
     */
    async getPastBookings(): Promise<Booking[]> {
        const bookings = await this.getMyBookings();
        return bookings.filter(b => b.status === 'completed');
    }

    /**
     * Create booking (alias for createBooking) - for compatibility
     */
    async create(data: {
        tour_id: string;
        num_participants: number;
        scheduled_date: string;
        contact_name?: string;
        contact_email?: string;
        contact_phone?: string;
        special_requests?: string;
    }): Promise<Booking> {
        // Map to the expected format
        const response = await httpClient.post<Booking>(
            ENDPOINTS.BOOKINGS.CREATE,
            {
                tour_id: data.tour_id,
                booking_date: data.scheduled_date,
                num_travelers: data.num_participants,
                special_requirements: data.special_requests,
            }
        );
        return response.data;
    }
}

export const bookingService = new BookingService();
export default bookingService;

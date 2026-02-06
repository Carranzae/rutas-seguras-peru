/**
 * Compatibility re-exports for legacy imports
 * TODO: Remove this file and update all imports to use @/src/features/tourist
 */
import { httpClient } from '@/src/core/api';
import { bookingService } from '@/src/features/tourist';

export { bookingService, bookingService as bookingsService };

// Booking interface for compatibility
export interface Booking {
    id: string;
    tour_id: string;
    user_id: string;
    status: string;
    created_at: string;
}

// Extended bookingsService with additional methods
export const bookingsServiceExtended = {
    ...bookingService,
    getTourBookings: async (tourId: string) => {
        const response = await httpClient.get<{ items: any[] }>(`/tours/${tourId}/bookings`);
        return response.data;
    },
};

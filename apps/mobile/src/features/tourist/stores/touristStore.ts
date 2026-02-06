/**
 * Ruta Segura Perú - Tourist Store
 * Global tourist state with Zustand
 */
import { AppError } from '@/src/core/errors';
import { create } from 'zustand';
import { bookingService } from '../services/bookingService';
import { trustCircleService } from '../services/trustCircleService';
import type { Booking, TrustCircleContact } from '../types';

interface TouristState {
    // State
    bookings: Booking[];
    upcomingBookings: Booking[];
    trustCircle: TrustCircleContact[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadBookings: () => Promise<void>;
    createBooking: (data: {
        tour_id: string;
        booking_date: string;
        num_travelers: number;
        special_requirements?: string;
    }) => Promise<Booking>;
    cancelBooking: (bookingId: string, reason?: string) => Promise<void>;
    loadTrustCircle: () => Promise<void>;
    addToTrustCircle: (contact: Omit<TrustCircleContact, 'id'>) => Promise<void>;
    removeFromTrustCircle: (contactId: string) => Promise<void>;
    setPrimaryContact: (contactId: string) => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

const initialState = {
    bookings: [] as Booking[],
    upcomingBookings: [] as Booking[],
    trustCircle: [] as TrustCircleContact[],
    isLoading: false,
    error: null,
};

export const useTouristStore = create<TouristState>()((set, get) => ({
    ...initialState,

    loadBookings: async () => {
        set({ isLoading: true, error: null });
        try {
            const [all, upcoming] = await Promise.all([
                bookingService.getMyBookings(),
                bookingService.getUpcomingBookings(),
            ]);
            set({ bookings: all, upcomingBookings: upcoming });
        } catch (error) {
            const appError = AppError.from(error);
            set({ error: appError.getUserMessage() });
        } finally {
            set({ isLoading: false });
        }
    },

    createBooking: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const booking = await bookingService.createBooking(data);
            set(state => ({
                bookings: [booking, ...state.bookings],
            }));
            return booking;
        } catch (error) {
            const appError = AppError.from(error);
            set({ error: appError.getUserMessage() });
            throw appError;
        } finally {
            set({ isLoading: false });
        }
    },

    cancelBooking: async (bookingId, reason) => {
        set({ isLoading: true });
        try {
            await bookingService.cancelBooking(bookingId, reason);
            set(state => ({
                bookings: state.bookings.map(b =>
                    b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
                ),
                upcomingBookings: state.upcomingBookings.filter(b => b.id !== bookingId),
            }));
        } catch (error) {
            const appError = AppError.from(error);
            set({ error: appError.getUserMessage() });
            throw appError;
        } finally {
            set({ isLoading: false });
        }
    },

    loadTrustCircle: async () => {
        set({ isLoading: true });
        try {
            const contacts = await trustCircleService.getContacts();
            set({ trustCircle: contacts });
        } catch (error) {
            const appError = AppError.from(error);
            set({ error: appError.getUserMessage() });
        } finally {
            set({ isLoading: false });
        }
    },

    addToTrustCircle: async (contact) => {
        set({ isLoading: true });
        try {
            const newContact = await trustCircleService.addContact(contact);
            set(state => ({
                trustCircle: [...state.trustCircle, newContact],
            }));
        } catch (error) {
            const appError = AppError.from(error);
            set({ error: appError.getUserMessage() });
            throw appError;
        } finally {
            set({ isLoading: false });
        }
    },

    removeFromTrustCircle: async (contactId) => {
        set({ isLoading: true });
        try {
            await trustCircleService.removeContact(contactId);
            set(state => ({
                trustCircle: state.trustCircle.filter(c => c.id !== contactId),
            }));
        } catch (error) {
            const appError = AppError.from(error);
            set({ error: appError.getUserMessage() });
            throw appError;
        } finally {
            set({ isLoading: false });
        }
    },

    setPrimaryContact: async (contactId) => {
        try {
            await trustCircleService.setPrimaryContact(contactId);
            set(state => ({
                trustCircle: state.trustCircle.map(c => ({
                    ...c,
                    is_primary: c.id === contactId,
                })),
            }));
        } catch (error) {
            const appError = AppError.from(error);
            set({ error: appError.getUserMessage() });
            throw appError;
        }
    },

    clearError: () => set({ error: null }),

    reset: () => set(initialState),
}));

export default useTouristStore;

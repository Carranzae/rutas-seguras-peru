/**
 * Compatibility re-exports for legacy imports
 * TODO: Remove this file and update all imports to use @/src/features
 */
export { api, httpClient } from './api';
export { authService } from './auth';
export { bookingService } from './bookings';
export { emergencyService, emergencyServiceCompat } from './emergency';
export { emergencyContactsService } from './emergencyContacts';
export { guideService } from './guides';
export { liveTrackingService } from './liveTracking';
export { toursService } from './tours';


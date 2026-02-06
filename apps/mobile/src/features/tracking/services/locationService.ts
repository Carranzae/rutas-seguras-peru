/**
 * Ruta Segura Perú - Location Service
 * GPS location management with battery-aware updates
 */
import { AppError, ErrorCode } from '@/src/core/errors';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import type { LocationData, TrackingConfig } from '../types';

const DEFAULT_CONFIG: TrackingConfig = {
    intervalMs: 10000,
    highAccuracy: true,
    distanceFilter: 10,
};

class LocationService {
    private watchId: Location.LocationSubscription | null = null;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private config: TrackingConfig = DEFAULT_CONFIG;
    private onLocationUpdate: ((location: LocationData) => void) | null = null;

    /**
     * Request location permissions
     */
    async requestPermissions(): Promise<boolean> {
        const { status: foreground } = await Location.requestForegroundPermissionsAsync();

        if (foreground !== 'granted') {
            return false;
        }

        // Try to get background permission for guides
        try {
            const { status: background } = await Location.requestBackgroundPermissionsAsync();
            return background === 'granted';
        } catch {
            // Background permissions may not be available on all platforms
            return true;
        }
    }

    /**
     * Check if permissions are granted
     */
    async hasPermissions(): Promise<boolean> {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
    }

    /**
     * Get current location
     */
    async getCurrentLocation(): Promise<LocationData> {
        const hasPermission = await this.hasPermissions();
        if (!hasPermission) {
            throw new AppError('Location permission required', ErrorCode.LOCATION_DENIED);
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: this.config.highAccuracy
                ? Location.Accuracy.High
                : Location.Accuracy.Balanced,
        });

        return this.toLocationData(location);
    }

    /**
     * Start tracking location updates
     */
    async startTracking(
        onUpdate: (location: LocationData) => void,
        config?: Partial<TrackingConfig>
    ): Promise<boolean> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            throw new AppError('Location permission required', ErrorCode.LOCATION_DENIED);
        }

        this.config = { ...DEFAULT_CONFIG, ...config };
        this.onLocationUpdate = onUpdate;

        // Use interval-based updates for more control
        this.intervalId = setInterval(async () => {
            try {
                const location = await this.getCurrentLocation();
                const battery = await this.getBatteryLevel();

                this.onLocationUpdate?.({
                    ...location,
                });
            } catch (error) {
                console.error('[LocationService] Update error:', error);
            }
        }, this.config.intervalMs);

        // Send first update immediately
        const location = await this.getCurrentLocation();
        onUpdate(location);

        return true;
    }

    /**
     * Stop tracking
     */
    stopTracking(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        if (this.watchId) {
            this.watchId.remove();
            this.watchId = null;
        }

        this.onLocationUpdate = null;
    }

    /**
     * Check if tracking is active
     */
    isTracking(): boolean {
        return this.intervalId !== null || this.watchId !== null;
    }

    /**
     * Get battery level
     */
    async getBatteryLevel(): Promise<number> {
        try {
            const level = await Battery.getBatteryLevelAsync();
            return Math.round(level * 100);
        } catch {
            return -1;
        }
    }

    /**
     * Update tracking config dynamically
     */
    updateConfig(config: Partial<TrackingConfig>): void {
        this.config = { ...this.config, ...config };

        // Restart if tracking
        if (this.isTracking() && this.onLocationUpdate) {
            this.stopTracking();
            this.startTracking(this.onLocationUpdate, this.config);
        }
    }

    /**
     * Convert expo location to our format
     */
    private toLocationData(location: Location.LocationObject): LocationData {
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined,
            altitude: location.coords.altitude ?? undefined,
            heading: location.coords.heading ?? undefined,
            speed: location.coords.speed ? location.coords.speed * 3.6 : undefined, // m/s to km/h
            timestamp: location.timestamp,
        };
    }
}

export const locationService = new LocationService();
export default locationService;

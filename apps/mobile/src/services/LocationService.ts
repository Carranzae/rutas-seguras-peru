/**
 * Ruta Segura Perú - Background Location Service
 * High-performance GPS tracking with battery optimization
 * Uses expo-location with background task support
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

// Task name for background location updates
const BACKGROUND_LOCATION_TASK = 'RUTA_SEGURA_BACKGROUND_LOCATION';

// Configuration
const CONFIG = {
    // Minimum distance (meters) to trigger update - BATTERY SAVER
    DISTANCE_THRESHOLD: 5, // 5 meters

    // Time intervals
    FOREGROUND_INTERVAL: 5000,   // 5 seconds when app is active
    BACKGROUND_INTERVAL: 15000,  // 15 seconds in background

    // Accuracy levels
    FOREGROUND_ACCURACY: Location.Accuracy.High,
    BACKGROUND_ACCURACY: Location.Accuracy.Balanced,

    // Offline queue
    MAX_QUEUE_SIZE: 100,
    QUEUE_KEY: '@location_queue',
};

// Type definitions
interface LocationData {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    speed: number | null;
    heading: number | null;
    timestamp: number;
    battery?: number;
}

interface QueuedLocation extends LocationData {
    user_id: string;
    tour_id?: string;
    queued_at: number;
}

// Global state
let wsConnection: WebSocket | null = null;
let lastSentLocation: { lat: number; lng: number } | null = null;
let isTracking = false;
let currentUserId: string | null = null;
let currentTourId: string | null = null;
let batteryLevel: number | null = null;

/**
 * Define background location task
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('[BackgroundLocation] Error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };

        for (const location of locations) {
            await processLocation(location, true);
        }
    }
});

/**
 * Process a location update
 */
async function processLocation(
    location: Location.LocationObject,
    isBackground: boolean = false
): Promise<void> {
    const { latitude, longitude, altitude, accuracy, speed, heading } = location.coords;

    // Check if moved enough (battery saver)
    if (lastSentLocation) {
        const distance = calculateDistance(
            lastSentLocation.lat,
            lastSentLocation.lng,
            latitude,
            longitude
        );

        if (distance < CONFIG.DISTANCE_THRESHOLD) {
            // Not moved enough, skip this update
            return;
        }
    }

    // Update last sent location
    lastSentLocation = { lat: latitude, lng: longitude };

    // Prepare location data
    const locationData: LocationData = {
        latitude,
        longitude,
        altitude,
        accuracy,
        speed: speed ? speed * 3.6 : null, // m/s to km/h
        heading,
        timestamp: location.timestamp,
        battery: batteryLevel ?? undefined,
    };

    // Try to send via WebSocket
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        try {
            wsConnection.send(JSON.stringify({
                type: 'LOCATION',
                ...locationData,
                user_name: currentUserId, // Will be replaced with actual name
                is_background: isBackground,
            }));

            // Flush any queued locations
            await flushLocationQueue();
        } catch (e) {
            // Queue for later
            await queueLocation(locationData);
        }
    } else {
        // No connection, queue for later
        await queueLocation(locationData);
    }
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Queue a location for later sync (offline support)
 */
async function queueLocation(location: LocationData): Promise<void> {
    try {
        const existingQueue = await AsyncStorage.getItem(CONFIG.QUEUE_KEY);
        const queue: QueuedLocation[] = existingQueue ? JSON.parse(existingQueue) : [];

        queue.push({
            ...location,
            user_id: currentUserId || '',
            tour_id: currentTourId,
            queued_at: Date.now(),
        });

        // Limit queue size
        while (queue.length > CONFIG.MAX_QUEUE_SIZE) {
            queue.shift();
        }

        await AsyncStorage.setItem(CONFIG.QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error('[LocationQueue] Error queuing:', e);
    }
}

/**
 * Flush queued locations when connection is restored
 */
async function flushLocationQueue(): Promise<void> {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) return;

    try {
        const existingQueue = await AsyncStorage.getItem(CONFIG.QUEUE_KEY);
        if (!existingQueue) return;

        const queue: QueuedLocation[] = JSON.parse(existingQueue);
        if (queue.length === 0) return;

        // Send queued locations in batch
        wsConnection.send(JSON.stringify({
            type: 'LOCATION_BATCH',
            locations: queue,
        }));

        // Clear queue
        await AsyncStorage.removeItem(CONFIG.QUEUE_KEY);
        console.log(`[LocationQueue] Flushed ${queue.length} locations`);
    } catch (e) {
        console.error('[LocationQueue] Error flushing:', e);
    }
}

/**
 * Location Service Class
 */
export class LocationService {
    /**
     * Request location permissions
     */
    static async requestPermissions(): Promise<boolean> {
        try {
            // Request foreground permission
            const foreground = await Location.requestForegroundPermissionsAsync();
            if (foreground.status !== 'granted') {
                return false;
            }

            // Request background permission (for Android and iOS)
            if (Platform.OS === 'android' || Platform.OS === 'ios') {
                const background = await Location.requestBackgroundPermissionsAsync();
                if (background.status !== 'granted') {
                    console.warn('[LocationService] Background permission denied');
                    // Can still work in foreground only
                }
            }

            return true;
        } catch (e) {
            console.error('[LocationService] Permission error:', e);
            return false;
        }
    }

    /**
     * Start tracking with WebSocket connection
     */
    static async startTracking(params: {
        wsUrl: string;
        token: string;
        userId: string;
        userType: 'guide' | 'tourist';
        tourId?: string;
    }): Promise<boolean> {
        if (isTracking) {
            await this.stopTracking();
        }

        currentUserId = params.userId;
        currentTourId = params.tourId;

        // Connect WebSocket
        const wsFullUrl = `${params.wsUrl}/ws/tracking/${params.userType}?token=${params.token}${params.tourId ? `&tour_id=${params.tourId}` : ''
            }`;

        wsConnection = new WebSocket(wsFullUrl);

        wsConnection.onopen = () => {
            console.log('[LocationService] WebSocket connected');
            flushLocationQueue(); // Send any queued locations
        };

        wsConnection.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleServerMessage(message);
            } catch (e) { }
        };

        wsConnection.onclose = () => {
            console.log('[LocationService] WebSocket closed');
            // Auto-reconnect is handled by the WebSocket itself
        };

        wsConnection.onerror = (e) => {
            console.error('[LocationService] WebSocket error:', e);
        };

        // Start foreground location updates
        await Location.watchPositionAsync(
            {
                accuracy: CONFIG.FOREGROUND_ACCURACY,
                timeInterval: CONFIG.FOREGROUND_INTERVAL,
                distanceInterval: CONFIG.DISTANCE_THRESHOLD,
            },
            (location) => processLocation(location, false)
        );

        // Start background location task
        try {
            const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(
                BACKGROUND_LOCATION_TASK
            );

            if (!isTaskRegistered) {
                await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                    accuracy: CONFIG.BACKGROUND_ACCURACY,
                    timeInterval: CONFIG.BACKGROUND_INTERVAL,
                    distanceInterval: CONFIG.DISTANCE_THRESHOLD * 2, // More lenient in background
                    foregroundService: {
                        notificationTitle: 'Ruta Segura',
                        notificationBody: 'Tu ubicación está siendo compartida',
                        notificationColor: '#00f2ff',
                    },
                    pausesUpdatesAutomatically: false,
                    activityType: Location.ActivityType.Fitness,
                });
            }
        } catch (e) {
            console.warn('[LocationService] Background tracking not available:', e);
        }

        isTracking = true;
        return true;
    }

    /**
     * Stop tracking
     */
    static async stopTracking(): Promise<void> {
        isTracking = false;

        // Close WebSocket
        if (wsConnection) {
            wsConnection.close();
            wsConnection = null;
        }

        // Stop background task
        try {
            const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(
                BACKGROUND_LOCATION_TASK
            );

            if (isTaskRegistered) {
                await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
            }
        } catch (e) {
            console.warn('[LocationService] Error stopping background task:', e);
        }

        // Reset state
        currentUserId = null;
        currentTourId = null;
        lastSentLocation = null;
    }

    /**
     * Handle server messages
     */
    private static handleServerMessage(message: any): void {
        switch (message.type) {
            case 'COMMAND':
                if (message.command === 'REQUEST_LOCATION') {
                    // Force immediate location update
                    this.sendImmediateLocation();
                }
                break;

            case 'ACK':
                // Location acknowledged by server
                break;

            case 'SOS_ACK':
                // SOS acknowledged
                break;
        }
    }

    /**
     * Send immediate location (for SOS or forced request)
     */
    static async sendImmediateLocation(): Promise<void> {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });

            await processLocation(location, false);
        } catch (e) {
            console.error('[LocationService] Error getting immediate location:', e);
        }
    }

    /**
     * Trigger SOS with current location
     */
    static async triggerSOS(message: string = 'Emergencia'): Promise<boolean> {
        if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });

            wsConnection.send(JSON.stringify({
                type: 'SOS',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                message,
                user_name: currentUserId,
                timestamp: Date.now(),
            }));

            return true;
        } catch (e) {
            console.error('[LocationService] SOS error:', e);
            return false;
        }
    }

    /**
     * Update battery level for transmission with location
     */
    static setBatteryLevel(level: number): void {
        batteryLevel = level;
    }

    /**
     * Check if currently tracking
     */
    static isActive(): boolean {
        return isTracking;
    }
}

export default LocationService;

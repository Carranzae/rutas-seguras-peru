/**
 * Ruta Segura Perú - GPS Tracking with Variable Distance Algorithm
 * Battery-optimized GPS tracking that reduces frequency when user is stationary
 */
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface TrackingLocation {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    speed: number | null;
    heading: number | null;
    timestamp: number;
}

export interface TrackingConfig {
    // Distance thresholds (meters)
    minDistanceForUpdate: number;
    stationaryThreshold: number;

    // Update intervals (milliseconds)
    activeInterval: number;      // When moving
    stationaryInterval: number;  // When stationary
    emergencyInterval: number;   // During emergency

    // Battery thresholds
    lowBatteryThreshold: number;
    criticalBatteryThreshold: number;
}

const DEFAULT_CONFIG: TrackingConfig = {
    minDistanceForUpdate: 10,     // Update every 10 meters
    stationaryThreshold: 5,       // Consider stationary if moved < 5m
    activeInterval: 5000,         // 5 seconds when moving
    stationaryInterval: 30000,    // 30 seconds when stationary
    emergencyInterval: 2000,      // 2 seconds during emergency
    lowBatteryThreshold: 20,      // Below 20% = low battery mode
    criticalBatteryThreshold: 10, // Below 10% = minimal updates
};

export function useAdaptiveGPSTracking(
    onLocationUpdate: (location: TrackingLocation) => void,
    options?: Partial<TrackingConfig>,
) {
    const config = { ...DEFAULT_CONFIG, ...options };

    const [isTracking, setIsTracking] = useState(false);
    const [isEmergencyMode, setIsEmergencyMode] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<TrackingLocation | null>(null);
    const [isStationary, setIsStationary] = useState(false);
    const [batteryLevel, setBatteryLevel] = useState(100);
    const [updateCount, setUpdateCount] = useState(0);

    const lastLocationRef = useRef<TrackingLocation | null>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const stationaryTimer = useRef<NodeJS.Timeout | null>(null);
    const stationaryChecks = useRef(0);

    /**
     * Calculate distance between two points using Haversine formula
     */
    const calculateDistance = useCallback((
        lat1: number, lon1: number,
        lat2: number, lon2: number,
    ): number => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }, []);

    /**
     * Determine if location update should be sent
     */
    const shouldSendUpdate = useCallback((newLocation: TrackingLocation): boolean => {
        if (!lastLocationRef.current) return true;

        const distance = calculateDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            newLocation.latitude,
            newLocation.longitude,
        );

        // In emergency mode, always send
        if (isEmergencyMode) return true;

        // Check minimum distance threshold
        if (distance < config.minDistanceForUpdate) {
            // Track stationary checks
            stationaryChecks.current++;

            // If 3 consecutive checks below threshold, mark as stationary
            if (stationaryChecks.current >= 3) {
                setIsStationary(true);
            }

            // Only send if enough time has passed
            const timeSinceLastUpdate = newLocation.timestamp - lastLocationRef.current.timestamp;
            const requiredInterval = isStationary
                ? config.stationaryInterval
                : config.activeInterval;

            return timeSinceLastUpdate >= requiredInterval;
        }

        // User is moving - reset stationary tracking
        stationaryChecks.current = 0;
        setIsStationary(false);
        return true;
    }, [isEmergencyMode, isStationary, calculateDistance, config]);

    /**
     * Handle new location from GPS
     */
    const handleLocationUpdate = useCallback((location: Location.LocationObject) => {
        const newLocation: TrackingLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: location.timestamp,
        };

        setCurrentLocation(newLocation);

        if (shouldSendUpdate(newLocation)) {
            lastLocationRef.current = newLocation;
            setUpdateCount(prev => prev + 1);
            onLocationUpdate(newLocation);
        }
    }, [shouldSendUpdate, onLocationUpdate]);

    /**
     * Get accuracy level based on battery and mode
     */
    const getDesiredAccuracy = useCallback(() => {
        if (isEmergencyMode) {
            return Location.Accuracy.BestForNavigation;
        }

        if (batteryLevel <= config.criticalBatteryThreshold) {
            return Location.Accuracy.Low;
        }

        if (batteryLevel <= config.lowBatteryThreshold) {
            return Location.Accuracy.Balanced;
        }

        if (isStationary) {
            return Location.Accuracy.Balanced;
        }

        return Location.Accuracy.High;
    }, [isEmergencyMode, batteryLevel, isStationary, config]);

    /**
     * Get update interval based on mode and battery
     */
    const getUpdateInterval = useCallback(() => {
        if (isEmergencyMode) {
            return config.emergencyInterval;
        }

        if (batteryLevel <= config.criticalBatteryThreshold) {
            return config.stationaryInterval * 2;
        }

        if (isStationary) {
            return config.stationaryInterval;
        }

        return config.activeInterval;
    }, [isEmergencyMode, batteryLevel, isStationary, config]);

    /**
     * Start GPS tracking
     */
    const startTracking = useCallback(async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Location permission denied');
        }

        // Enable background tracking for tours
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== 'granted') {
            console.warn('Background location permission denied');
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        handleLocationUpdate(initialLocation);

        // Start watching location
        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: getDesiredAccuracy(),
                timeInterval: getUpdateInterval(),
                distanceInterval: Math.min(config.minDistanceForUpdate, 5),
            },
            handleLocationUpdate,
        );

        setIsTracking(true);
    }, [handleLocationUpdate, getDesiredAccuracy, getUpdateInterval, config.minDistanceForUpdate]);

    /**
     * Stop GPS tracking
     */
    const stopTracking = useCallback(() => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        setIsTracking(false);
        setIsStationary(false);
        stationaryChecks.current = 0;
    }, []);

    /**
     * Enable emergency mode - maximum accuracy and frequency
     */
    const enableEmergencyMode = useCallback(() => {
        setIsEmergencyMode(true);

        // Restart tracking with emergency settings
        if (isTracking && locationSubscription.current) {
            locationSubscription.current.remove();
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: config.emergencyInterval,
                    distanceInterval: 1, // Update every meter
                },
                handleLocationUpdate,
            ).then(sub => {
                locationSubscription.current = sub;
            });
        }
    }, [isTracking, handleLocationUpdate, config.emergencyInterval]);

    /**
     * Disable emergency mode
     */
    const disableEmergencyMode = useCallback(() => {
        setIsEmergencyMode(false);

        // Restart with normal settings
        if (isTracking) {
            stopTracking();
            startTracking();
        }
    }, [isTracking, stopTracking, startTracking]);

    // Monitor battery level
    useEffect(() => {
        let subscription: Battery.Subscription;

        Battery.getBatteryLevelAsync().then(level => {
            setBatteryLevel(Math.round(level * 100));
        });

        Battery.addBatteryLevelListener(({ batteryLevel }) => {
            setBatteryLevel(Math.round(batteryLevel * 100));
        }).then(sub => {
            subscription = sub;
        });

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTracking();
            if (stationaryTimer.current) {
                clearTimeout(stationaryTimer.current);
            }
        };
    }, [stopTracking]);

    return {
        isTracking,
        isEmergencyMode,
        isStationary,
        currentLocation,
        batteryLevel,
        updateCount,
        startTracking,
        stopTracking,
        enableEmergencyMode,
        disableEmergencyMode,
    };
}

export default useAdaptiveGPSTracking;

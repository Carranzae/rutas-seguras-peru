/**
 * Ruta Segura Perú - Live Tracking Service
 * Automatic GPS tracking via WebSocket with safety analysis
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { API_CONFIG } from '../config/api';

// Types
export interface SafetyAnalysis {
    risk_score: number | null;
    risk_level: string | null;
    terrain: string | null;
    alerts_triggered: number;
}

export interface LocationUpdateResponse {
    type: 'ACK' | 'COMMAND' | 'MESSAGE' | 'ALERT' | 'GROUP_UPDATE' | 'LOCATION_UPDATE';
    timestamp?: string;
    analysis?: SafetyAnalysis;
    command?: string;
    data?: any;
}

export interface TrackingConfig {
    intervalMs: number;          // GPS update interval (default: 10000)
    userType: 'guide' | 'tourist';
    tourId?: string;
    userName: string;
    onLocationUpdate?: (location: Location.LocationObject, analysis?: SafetyAnalysis) => void;
    onAlert?: (alert: any) => void;
    onCommand?: (command: string, data: any) => void;
    onConnectionChange?: (connected: boolean) => void;
    onGroupUpdate?: (data: any) => void;
}

class LiveTrackingService {
    private ws: WebSocket | null = null;
    private locationSubscription: Location.LocationSubscription | null = null;
    private intervalId: any = null; // Use any to avoid conflict between NodeJS.Timeout and number
    private config: TrackingConfig | null = null;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 10;
    private reconnectDelay: number = 3000;

    /**
     * Start automatic GPS tracking
     */
    async startTracking(config: TrackingConfig): Promise<boolean> {
        this.config = config;

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.error('Location permission denied');
            return false;
        }

        // Connect to WebSocket
        const connected = await this.connectWebSocket();
        if (!connected) {
            console.error('WebSocket connection failed');
            return false;
        }

        // Start GPS tracking
        this.startGPSUpdates();

        console.log('🟢 Live tracking started');
        return true;
    }

    /**
     * Stop tracking
     */
    stopTracking(): void {
        // Stop GPS updates
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        if (this.locationSubscription) {
            this.locationSubscription.remove();
            this.locationSubscription = null;
        }

        // Close WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
        this.config?.onConnectionChange?.(false);
        console.log('🔴 Live tracking stopped');
    }

    /**
     * Connect to WebSocket server
     */
    private async connectWebSocket(): Promise<boolean> {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                console.error('No auth token');
                return false;
            }

            // Build WebSocket URL
            const wsBaseUrl = API_CONFIG.BASE_URL.replace('http', 'ws');
            const wsUrl = `${wsBaseUrl}/ws/tracking/${this.config?.userType}?token=${token}${this.config?.tourId ? `&tour_id=${this.config.tourId}` : ''}`;

            return new Promise((resolve) => {
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.config?.onConnectionChange?.(true);
                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket closed');
                    this.isConnected = false;
                    this.config?.onConnectionChange?.(false);
                    this.attemptReconnect();
                };

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (!this.isConnected) {
                        resolve(false);
                    }
                }, 10000);
            });
        } catch (error) {
            console.error('WebSocket connection error:', error);
            return false;
        }
    }

    /**
     * Attempt to reconnect
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(async () => {
            if (!this.isConnected && this.config) {
                await this.connectWebSocket();
            }
        }, this.reconnectDelay);
    }

    /**
     * Handle incoming WebSocket message
     */
    private handleMessage(data: string): void {
        try {
            const message = JSON.parse(data) as LocationUpdateResponse;

            switch (message.type) {
                case 'ACK':
                    // Location acknowledged with safety analysis
                    if (message.analysis) {
                        console.log(`📍 Safety: ${message.analysis.risk_level} (${message.analysis.risk_score}/100)`);
                    }
                    break;

                case 'COMMAND':
                    // Command from admin
                    console.log('📢 Command received:', message.command);
                    this.handleCommand(message.command || '', message.data);
                    break;

                case 'MESSAGE':
                    // Message from admin
                    console.log('💬 Message:', message.data?.text);
                    this.config?.onAlert?.({
                        type: 'message',
                        title: message.data?.from || 'Central',
                        message: message.data?.text,
                    });
                    break;

                case 'ALERT':
                    // Alert from admin
                    console.log('⚠️ Alert:', message.data?.title);
                    this.config?.onAlert?.(message.data);
                    break;

                case 'GROUP_UPDATE':
                case 'LOCATION_UPDATE':
                    // Update from group member
                    this.config?.onGroupUpdate?.(message.data || message);
                    break;
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    /**
     * Handle command from admin
     */
    private handleCommand(command: string, data: any): void {
        switch (command) {
            case 'REQUEST_LOCATION':
                // Send immediate location update
                this.sendLocationNow();
                break;

            case 'ACTIVATE_SOS':
                // Trigger SOS
                console.log('🆘 SOS activated remotely:', data?.reason);
                this.config?.onCommand?.(command, data);
                break;

            case 'ALERT':
                // Show alert to user
                this.config?.onAlert?.(data);
                break;

            default:
                this.config?.onCommand?.(command, data);
        }
    }

    /**
     * Start GPS updates at interval
     */
    private startGPSUpdates(): void {
        const intervalMs = this.config?.intervalMs || 10000;

        // Send immediately
        this.sendLocationNow();

        // Then every interval
        this.intervalId = setInterval(() => {
            this.sendLocationNow();
        }, intervalMs);
    }

    /**
     * Get current location and send
     */
    private async sendLocationNow(): Promise<void> {
        try {
            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            // Get battery level
            let batteryLevel: number | undefined;
            try {
                batteryLevel = Math.round((await Battery.getBatteryLevelAsync()) * 100);
            } catch {
                batteryLevel = undefined;
            }

            // Build message
            const message = {
                type: 'LOCATION',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                speed: location.coords.speed ? location.coords.speed * 3.6 : undefined, // Convert to km/h
                heading: location.coords.heading,
                altitude: location.coords.altitude,
                battery: batteryLevel,
                user_name: this.config?.userName,
            };

            // Send via WebSocket
            if (this.ws && this.isConnected) {
                this.ws.send(JSON.stringify(message));
            }

            // Callback
            this.config?.onLocationUpdate?.(location);

        } catch (error) {
            console.error('Error sending location:', error);
        }
    }

    /**
     * Send SOS alert
     */
    async sendSOS(message?: string): Promise<void> {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const sosMessage = {
                type: 'SOS',
                message: message || 'Emergencia - Necesito ayuda',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                user_name: this.config?.userName,
            };

            if (this.ws && this.isConnected) {
                this.ws.send(JSON.stringify(sosMessage));
                console.log('🆘 SOS sent');
            }
        } catch (error) {
            console.error('Error sending SOS:', error);
        }
    }

    /**
     * Send ping to keep connection alive
     */
    ping(): void {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify({ type: 'PING' }));
        }
    }

    /**
     * Check if connected
     */
    isTracking(): boolean {
        return this.isConnected && this.intervalId !== null;
    }

    /**
     * Get connection status
     */
    getStatus(): { connected: boolean; reconnecting: boolean } {
        return {
            connected: this.isConnected,
            reconnecting: this.reconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts,
        };
    }
}

// Export singleton instance
export const liveTrackingService = new LiveTrackingService();
export default liveTrackingService;

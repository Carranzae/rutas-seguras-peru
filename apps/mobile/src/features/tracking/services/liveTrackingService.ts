/**
 * Ruta Segura Perú - Live Tracking Service
 * Real-time location sharing via WebSocket
 */
import { wsClient, type ConnectionState } from '@/src/core/api';
import type { GroupMember, LocationData, SafetyAnalysis } from '../types';
import { locationService } from './locationService';

export interface LiveTrackingConfig {
    userType: 'guide' | 'tourist';
    userName: string;
    tourId?: string;
    intervalMs?: number;
    onLocationUpdate?: (location: LocationData, analysis?: SafetyAnalysis) => void;
    onGroupUpdate?: (members: GroupMember[]) => void;
    onAlert?: (alert: { type: string; title: string; message: string }) => void;
    onCommand?: (command: string, data: unknown) => void;
    onConnectionChange?: (state: ConnectionState) => void;
}

class LiveTrackingService {
    private config: LiveTrackingConfig | null = null;
    private isActive = false;

    /**
     * Start live tracking with WebSocket connection
     */
    async startTracking(config: LiveTrackingConfig): Promise<boolean> {
        this.config = config;

        // Connect WebSocket
        const connected = await wsClient.connect({
            userType: config.userType,
            userName: config.userName,
            tourId: config.tourId,
            heartbeatInterval: 30000,
            autoReconnect: true,

            onOpen: () => {
                console.log('[LiveTracking] ✅ Connected');
                config.onConnectionChange?.('connected');
            },

            onClose: () => {
                console.log('[LiveTracking] Connection closed');
                config.onConnectionChange?.('disconnected');
            },

            onLocationAck: (analysis) => {
                // Location acknowledged with safety analysis
                console.log(`[LiveTracking] 📍 Risk: ${analysis.risk_level} (${analysis.risk_score}/100)`);
            },

            onGroupUpdate: (data) => {
                // Group member location update
                if (Array.isArray(data)) {
                    config.onGroupUpdate?.(data as GroupMember[]);
                } else if (data && typeof data === 'object') {
                    config.onGroupUpdate?.([data as GroupMember]);
                }
            },

            onAlert: (alertData) => {
                const alert = alertData as { type: string; title: string; message: string };
                config.onAlert?.(alert);
            },

            onCommand: (command, data) => {
                this.handleCommand(command, data);
            },
        });

        if (!connected) {
            console.error('[LiveTracking] Failed to connect WebSocket');
            return false;
        }

        // Start GPS tracking
        const trackingStarted = await locationService.startTracking(
            (location) => this.handleLocationUpdate(location),
            { intervalMs: config.intervalMs || 10000 }
        );

        if (!trackingStarted) {
            wsClient.disconnect();
            return false;
        }

        this.isActive = true;
        console.log('[LiveTracking] 🟢 Started');
        return true;
    }

    /**
     * Stop live tracking
     */
    stopTracking(): void {
        locationService.stopTracking();
        wsClient.disconnect();
        this.isActive = false;
        this.config = null;
        console.log('[LiveTracking] 🔴 Stopped');
    }

    /**
     * Handle location update - send to server
     */
    private async handleLocationUpdate(location: LocationData): Promise<void> {
        const battery = await locationService.getBatteryLevel();

        wsClient.sendLocation({
            ...location,
            battery: battery > 0 ? battery : undefined,
        });

        this.config?.onLocationUpdate?.(location);
    }

    /**
     * Handle command from server
     */
    private handleCommand(command: string, data: unknown): void {
        switch (command) {
            case 'REQUEST_LOCATION':
                // Send immediate location
                locationService.getCurrentLocation().then(location => {
                    wsClient.sendLocation(location);
                });
                break;

            case 'ACTIVATE_SOS':
                // Remote SOS activation
                console.log('[LiveTracking] 🆘 Remote SOS activated');
                this.config?.onCommand?.(command, data);
                break;

            default:
                this.config?.onCommand?.(command, data);
        }
    }

    /**
     * Send SOS alert
     */
    async sendSOS(message?: string): Promise<void> {
        const location = await locationService.getCurrentLocation();
        wsClient.sendSOS(message, {
            latitude: location.latitude,
            longitude: location.longitude,
        });
        console.log('[LiveTracking] 🆘 SOS sent');
    }

    /**
     * Get connection state
     */
    getConnectionState(): ConnectionState {
        return wsClient.getState();
    }

    /**
     * Check if tracking is active
     */
    isTracking(): boolean {
        return this.isActive && wsClient.isConnected();
    }
}

export const liveTrackingService = new LiveTrackingService();
export default liveTrackingService;

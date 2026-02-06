/**
 * Ruta Segura Perú - WebSocket Client
 * Professional WebSocket client with reconnection, message queue, and typed events
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';

// Types
export type WSMessageType =
    | 'LOCATION'
    | 'SOS'
    | 'PING'
    | 'PONG'
    | 'ACK'
    | 'COMMAND'
    | 'MESSAGE'
    | 'ALERT'
    | 'GROUP_UPDATE'
    | 'LOCATION_UPDATE';

export interface WSMessage<T = unknown> {
    type: WSMessageType;
    data?: T;
    timestamp?: string;
}

export interface SafetyAnalysis {
    risk_score: number | null;
    risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
    terrain: string | null;
    alerts_triggered: number;
}

export interface WSConfig {
    userType: 'guide' | 'tourist';
    tourId?: string;
    userName: string;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    onMessage?: (message: WSMessage) => void;
    onLocationAck?: (analysis: SafetyAnalysis) => void;
    onCommand?: (command: string, data: unknown) => void;
    onAlert?: (alert: unknown) => void;
    onGroupUpdate?: (data: unknown) => void;
    autoReconnect?: boolean;
    heartbeatInterval?: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

type MessageHandler = (message: WSMessage) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private config: WSConfig | null = null;
    private connectionState: ConnectionState = 'disconnected';
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 3000;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private messageQueue: WSMessage[] = [];
    private messageHandlers: Map<WSMessageType, MessageHandler[]> = new Map();

    // ==================== Connection Management ====================

    async connect(config: WSConfig): Promise<boolean> {
        this.config = config;
        return this.establishConnection();
    }

    private async establishConnection(): Promise<boolean> {
        if (!this.config) return false;

        this.connectionState = 'connecting';

        try {
            const token = await AsyncStorage.getItem('@ruta_segura:access_token');
            if (!token) {
                console.error('[WS] No auth token available');
                return false;
            }

            // Build WebSocket URL
            const wsBaseUrl = API_CONFIG.BASE_URL.replace('http', 'ws');
            const params = new URLSearchParams({ token });
            if (this.config.tourId) {
                params.set('tour_id', this.config.tourId);
            }
            const wsUrl = `${wsBaseUrl}/ws/tracking/${this.config.userType}?${params.toString()}`;

            return new Promise((resolve) => {
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('[WS] ✅ Connected');
                    this.connectionState = 'connected';
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.flushMessageQueue();
                    this.config?.onOpen?.();
                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onerror = (error) => {
                    console.error('[WS] Error:', error);
                    this.config?.onError?.(error);
                };

                this.ws.onclose = () => {
                    console.log('[WS] Connection closed');
                    this.connectionState = 'disconnected';
                    this.stopHeartbeat();
                    this.config?.onClose?.();

                    if (this.config?.autoReconnect !== false) {
                        this.attemptReconnect();
                    }
                };

                // Timeout
                setTimeout(() => {
                    if (this.connectionState !== 'connected') {
                        this.ws?.close();
                        resolve(false);
                    }
                }, 10000);
            });
        } catch (error) {
            console.error('[WS] Connection failed:', error);
            return false;
        }
    }

    disconnect(): void {
        this.config = { ...this.config, autoReconnect: false } as WSConfig;
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connectionState = 'disconnected';
        console.log('[WS] 🔴 Disconnected');
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WS] Max reconnection attempts reached');
            return;
        }

        this.connectionState = 'reconnecting';
        this.reconnectAttempts++;

        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
        console.log(`[WS] Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            if (this.connectionState !== 'connected' && this.config) {
                this.establishConnection();
            }
        }, delay);
    }

    // ==================== Heartbeat ====================

    private startHeartbeat(): void {
        const interval = this.config?.heartbeatInterval || 30000;
        this.heartbeatTimer = setInterval(() => {
            this.send({ type: 'PING' });
        }, interval);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // ==================== Message Handling ====================

    private handleMessage(rawData: string): void {
        try {
            const message = JSON.parse(rawData) as WSMessage;

            // Notify generic handler
            this.config?.onMessage?.(message);

            // Notify specific handlers
            const handlers = this.messageHandlers.get(message.type) || [];
            handlers.forEach(handler => handler(message));

            // Built-in handlers
            switch (message.type) {
                case 'ACK':
                    if (message.data && typeof message.data === 'object' && 'analysis' in message.data) {
                        this.config?.onLocationAck?.(message.data.analysis as SafetyAnalysis);
                    }
                    break;

                case 'COMMAND':
                    if (message.data && typeof message.data === 'object' && 'command' in message.data) {
                        const data = message.data as { command: string; payload?: unknown };
                        this.config?.onCommand?.(data.command, data.payload);
                    }
                    break;

                case 'ALERT':
                    this.config?.onAlert?.(message.data);
                    break;

                case 'GROUP_UPDATE':
                case 'LOCATION_UPDATE':
                    this.config?.onGroupUpdate?.(message.data);
                    break;

                case 'PONG':
                    // Heartbeat response - connection is alive
                    break;
            }
        } catch (error) {
            console.error('[WS] Failed to parse message:', error);
        }
    }

    on(type: WSMessageType, handler: MessageHandler): () => void {
        const handlers = this.messageHandlers.get(type) || [];
        handlers.push(handler);
        this.messageHandlers.set(type, handlers);

        // Return unsubscribe function
        return () => {
            const current = this.messageHandlers.get(type) || [];
            const index = current.indexOf(handler);
            if (index > -1) current.splice(index, 1);
        };
    }

    // ==================== Sending Messages ====================

    send<T = unknown>(message: WSMessage<T>): boolean {
        const payload = {
            ...message,
            timestamp: message.timestamp || new Date().toISOString(),
        };

        if (this.ws && this.connectionState === 'connected') {
            this.ws.send(JSON.stringify(payload));
            return true;
        }

        // Queue message for later
        this.messageQueue.push(payload);
        return false;
    }

    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0 && this.connectionState === 'connected') {
            const message = this.messageQueue.shift();
            if (message && this.ws) {
                this.ws.send(JSON.stringify(message));
            }
        }
    }

    // ==================== Location Updates ====================

    sendLocation(location: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        speed?: number;
        heading?: number;
        altitude?: number;
        battery?: number;
    }): boolean {
        return this.send({
            type: 'LOCATION',
            data: {
                ...location,
                user_name: this.config?.userName,
            },
        });
    }

    sendSOS(message?: string, location?: { latitude: number; longitude: number }): boolean {
        return this.send({
            type: 'SOS',
            data: {
                message: message || 'Emergencia - Necesito ayuda',
                ...location,
                user_name: this.config?.userName,
            },
        });
    }

    // ==================== State ====================

    getState(): ConnectionState {
        return this.connectionState;
    }

    isConnected(): boolean {
        return this.connectionState === 'connected';
    }

    getReconnectInfo(): { attempts: number; maxAttempts: number } {
        return {
            attempts: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts,
        };
    }
}

// Export singleton
export const wsClient = new WebSocketClient();
export default wsClient;

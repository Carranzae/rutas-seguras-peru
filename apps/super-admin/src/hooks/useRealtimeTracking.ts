'use client';

/**
 * useRealtimeTracking - Real-time WebSocket hook for admin dashboards
 * Connects to backend WebSocket and receives location updates, alerts, etc.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

// Types
export interface TrackedUser {
    user_id: string;
    user_type: 'guide' | 'tourist';
    user_name: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    battery?: number;
    tour_id?: string;
    timestamp: string;
    status: 'active' | 'idle' | 'low_battery';
}

export interface Alert {
    id: string;
    type: 'sos' | 'low_battery' | 'no_signal' | 'deviation' | 'speed';
    user_id: string;
    user_name: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    latitude?: number;
    longitude?: number;
    tour_id?: string;
    timestamp: string;
    acknowledged: boolean;
}

export interface ConnectionStats {
    admin_connections: number;
    guide_connections: number;
    tourist_connections: number;
    active_locations: number;
    guides_online: string[];
    tourists_online: string[];
}

interface RealtimeState {
    isConnected: boolean;
    trackedUsers: Map<string, TrackedUser>;
    alerts: Alert[];
    stats: ConnectionStats | null;
    error: string | null;
}

interface UseRealtimeTrackingOptions {
    onLocationUpdate?: (user: TrackedUser) => void;
    onAlert?: (alert: Alert) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1';

export function useRealtimeTracking(options: UseRealtimeTrackingOptions = {}) {
    const { onLocationUpdate, onAlert, onConnect, onDisconnect } = options;

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectAttempts = useRef(0);

    const [state, setState] = useState<RealtimeState>({
        isConnected: false,
        trackedUsers: new Map(),
        alerts: [],
        stats: null,
        error: null,
    });

    // Get token from localStorage
    const getToken = useCallback(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('superadmin_token');
        }
        return null;
    }, []);

    // Connect to WebSocket
    const connect = useCallback(() => {
        const token = getToken();
        if (!token) {
            setState(prev => ({ ...prev, error: 'No authentication token' }));
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const wsUrl = `${WS_BASE_URL}/ws/admin?token=${token}`;
            console.log('[Realtime] Connecting to:', wsUrl);

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('[Realtime] ✅ Connected');
                reconnectAttempts.current = 0;
                setState(prev => ({ ...prev, isConnected: true, error: null }));
                onConnect?.();

                // Start ping interval
                pingIntervalRef.current = setInterval(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'PING' }));
                    }
                }, 30000);

                // Request initial stats
                wsRef.current?.send(JSON.stringify({ type: 'GET_STATS' }));
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleMessage(message);
                } catch (e) {
                    console.error('[Realtime] Parse error:', e);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('[Realtime] ❌ Disconnected', event.code, event.reason);
                setState(prev => ({ ...prev, isConnected: false }));
                onDisconnect?.();

                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }

                // Auto-reconnect with exponential backoff
                if (reconnectAttempts.current < 10) {
                    const delay = Math.min(3000 * Math.pow(2, reconnectAttempts.current), 30000);
                    reconnectAttempts.current++;
                    console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
                    reconnectTimeoutRef.current = setTimeout(connect, delay);
                }
            };

            wsRef.current.onerror = () => {
                setState(prev => ({ ...prev, error: 'Connection error' }));
            };

        } catch (error) {
            console.error('[Realtime] Connection failed:', error);
            setState(prev => ({ ...prev, error: 'Failed to connect' }));
        }
    }, [getToken, onConnect, onDisconnect]);

    // Handle incoming messages
    const handleMessage = useCallback((message: any) => {
        switch (message.type) {
            case 'INITIAL_STATE':
                // Initial state with all current locations
                const initialUsers = new Map<string, TrackedUser>();
                (message.data?.locations || []).forEach((loc: TrackedUser) => {
                    initialUsers.set(loc.user_id, loc);
                });
                setState(prev => ({
                    ...prev,
                    trackedUsers: initialUsers,
                    stats: {
                        admin_connections: 1,
                        guide_connections: message.data?.active_guides || 0,
                        tourist_connections: message.data?.active_tourists || 0,
                        active_locations: initialUsers.size,
                        guides_online: [],
                        tourists_online: [],
                    }
                }));
                break;

            case 'LOCATION_UPDATE':
                const user = message.data as TrackedUser;
                setState(prev => {
                    const updated = new Map(prev.trackedUsers);
                    updated.set(user.user_id, user);
                    return { ...prev, trackedUsers: updated };
                });
                onLocationUpdate?.(user);
                break;

            case 'ALERT':
                const alert = message.data as Alert;
                setState(prev => ({
                    ...prev,
                    alerts: [alert, ...prev.alerts.slice(0, 99)], // Keep last 100
                }));
                onAlert?.(alert);
                break;

            case 'STATS':
                setState(prev => ({ ...prev, stats: message.data }));
                break;

            case 'PONG':
                // Connection alive
                break;

            case 'COMMAND_RESULT':
                console.log('[Realtime] Command result:', message);
                break;
        }
    }, [onLocationUpdate, onAlert]);

    // Send command to a user
    const sendCommand = useCallback((
        command: 'REQUEST_LOCATION' | 'SEND_MESSAGE' | 'ACTIVATE_SOS' | 'SEND_ALERT',
        userId: string,
        data?: any
    ) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'COMMAND',
                command,
                user_id: userId,
                data,
            }));
            return true;
        }
        return false;
    }, []);

    // Request stats refresh
    const refreshStats = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'GET_STATS' }));
        }
    }, []);

    // Disconnect
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    // Connect on mount
    useEffect(() => {
        connect();
        return disconnect;
    }, [connect, disconnect]);

    // Convert Map to array for easier consumption
    const trackedUsersArray = Array.from(state.trackedUsers.values());
    const guides = trackedUsersArray.filter(u => u.user_type === 'guide');
    const tourists = trackedUsersArray.filter(u => u.user_type === 'tourist');

    return {
        isConnected: state.isConnected,
        trackedUsers: trackedUsersArray,
        guides,
        tourists,
        alerts: state.alerts,
        stats: state.stats,
        error: state.error,
        connect,
        disconnect,
        sendCommand,
        refreshStats,
    };
}

export default useRealtimeTracking;

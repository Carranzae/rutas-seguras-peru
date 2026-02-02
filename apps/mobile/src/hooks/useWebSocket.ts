/**
 * Ruta Segura Perú - WebSocket Hook for React Native
 * Real-time connection management with auto-reconnect
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseWebSocketOptions {
    url: string;
    token: string;
    tourId?: string;
    onMessage?: (message: any) => void;
    onLocationUpdate?: (location: any) => void;
    onEmergency?: (emergency: any) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

interface WebSocketState {
    isConnected: boolean;
    lastMessage: any | null;
    error: string | null;
}

export function useWebSocket({
    url,
    token,
    tourId,
    onMessage,
    onLocationUpdate,
    onEmergency,
    onConnect,
    onDisconnect,
}: UseWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [state, setState] = useState<WebSocketState>({
        isConnected: false,
        lastMessage: null,
        error: null,
    });

    // Build WebSocket URL with auth
    const wsUrl = `${url}?token=${token}${tourId ? `&tour_id=${tourId}` : ''}`;

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setState((prev) => ({ ...prev, isConnected: true, error: null }));
                onConnect?.();

                // Start ping interval to keep connection alive
                pingIntervalRef.current = setInterval(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'PING' }));
                    }
                }, 30000); // Ping every 30 seconds
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    setState((prev) => ({ ...prev, lastMessage: message }));

                    // Route to specific handlers
                    switch (message.type) {
                        case 'LOCATION_UPDATE':
                            onLocationUpdate?.(message.data);
                            break;
                        case 'EMERGENCY':
                            onEmergency?.(message.data);
                            break;
                        case 'PONG':
                            // Connection still alive
                            break;
                        default:
                            onMessage?.(message);
                    }
                } catch (e) {
                    console.error('[useWebSocket] Parse error:', e);
                }
            };

            wsRef.current.onclose = () => {
                setState((prev) => ({ ...prev, isConnected: false }));
                onDisconnect?.();

                // Clear ping interval
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }

                // Auto-reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            };

            wsRef.current.onerror = (event) => {
                setState((prev) => ({ ...prev, error: 'Connection error' }));
                console.error('[useWebSocket] Error:', event);
            };
        } catch (e) {
            setState((prev) => ({ ...prev, error: 'Failed to connect' }));
        }
    }, [wsUrl, onConnect, onDisconnect, onMessage, onLocationUpdate, onEmergency]);

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

    // Send message
    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            return true;
        }
        return false;
    }, []);

    // Send location update
    const sendLocation = useCallback(
        (location: {
            latitude: number;
            longitude: number;
            accuracy?: number;
            speed?: number;
            heading?: number;
            altitude?: number;
            battery?: number;
        }) => {
            return sendMessage({
                type: 'LOCATION',
                ...location,
            });
        },
        [sendMessage]
    );

    // Trigger SOS
    const triggerSOS = useCallback(
        (data: { latitude: number; longitude: number; message?: string }) => {
            return sendMessage({
                type: 'SOS',
                ...data,
            });
        },
        [sendMessage]
    );

    // Handle app state changes (reconnect when app comes to foreground)
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && !state.isConnected) {
                connect();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [state.isConnected, connect]);

    // Initial connection
    useEffect(() => {
        connect();
        return disconnect;
    }, [connect, disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        sendMessage,
        sendLocation,
        triggerSOS,
    };
}

export default useWebSocket;

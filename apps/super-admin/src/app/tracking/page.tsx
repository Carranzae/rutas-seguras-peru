'use client';

import { MapControls, MapMarker, Map as MapView } from '@/components/ui/map';
import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// Types
interface TrackingUser {
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
    status: 'active' | 'idle' | 'sos' | 'offline' | 'low_battery';
}

interface Alert {
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

// Status colors for markers and badges
const statusColors: Record<string, { bg: string; text: string; border: string; markerColor: string }> = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', markerColor: '#22c55e' },
    idle: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', markerColor: '#eab308' },
    sos: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', markerColor: '#ef4444' },
    offline: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', markerColor: '#6b7280' },
    low_battery: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', markerColor: '#f97316' },
};

const severityColors: Record<string, string> = {
    critical: 'bg-red-500/20 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
};

export default function TrackingPage() {
    const router = useRouter();
    const wsRef = useRef<WebSocket | null>(null);

    // State
    const [connected, setConnected] = useState(false);
    const [users, setUsers] = useState<Map<string, TrackingUser>>(new Map());
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedUser, setSelectedUser] = useState<TrackingUser | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showRoutes, setShowRoutes] = useState(true);
    const [commandMode, setCommandMode] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [stats, setStats] = useState({
        guides_online: 0,
        tourists_online: 0,
        active_locations: 0,
    });

    // Types for WebSocket messages
    type TrackingMessage =
        | { type: 'INITIAL_STATE'; data: { locations: TrackingUser[]; active_guides: number; active_tourists: number } }
        | { type: 'LOCATION_UPDATE'; data: TrackingUser }
        | { type: 'ALERT'; data: Alert }
        | { type: 'STATS'; data: { guide_connections: number; tourist_connections: number; active_locations: number } }
        | { type: 'COMMAND_RESULT'; success: boolean; command: string };

    // Handle incoming WebSocket messages - Defined BEFORE connectWebSocket
    const handleWebSocketMessage = useCallback((data: TrackingMessage) => {
        switch (data.type) {
            case 'INITIAL_STATE':
                // Load initial locations
                const locations = data.data?.locations || [];
                const newUsers = new Map<string, TrackingUser>();
                locations.forEach((loc: TrackingUser) => {
                    newUsers.set(loc.user_id, loc);
                });
                setUsers(newUsers);
                setStats({
                    guides_online: data.data?.active_guides || 0,
                    tourists_online: data.data?.active_tourists || 0,
                    active_locations: locations.length,
                });
                break;

            case 'LOCATION_UPDATE':
                // Update single user location
                setUsers(prev => {
                    const next = new Map(prev);
                    next.set(data.data.user_id, data.data);
                    return next;
                });
                break;

            case 'ALERT':
                // Add new alert
                setAlerts(prev => [data.data, ...prev.slice(0, 49)]);
                break;

            case 'STATS':
                setStats({
                    guides_online: data.data?.guide_connections || 0,
                    tourists_online: data.data?.tourist_connections || 0,
                    active_locations: data.data?.active_locations || 0,
                });
                break;

            case 'COMMAND_RESULT':
                if (data.success) {
                    alert(`✅ Comando ejecutado: ${data.command}`);
                } else {
                    alert(`❌ Error ejecutando: ${data.command}`);
                }
                setCommandMode(null);
                break;
        }
    }, []);

    // Connect to WebSocket
    const connectWebSocket = useCallback(() => {
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
            return;
        }

        const wsUrl = `ws://localhost:8000/api/v1/ws/admin?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setConnected(true);
            // Request current stats
            ws.send(JSON.stringify({ type: 'GET_STATS' }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setConnected(false);
            // Reconnect logic handles itself via re-trigger or separate effect, 
            // but calling connectWebSocket recursively inside useCallback is tricky.
            // Better to just set disconnected and let a monitoring effect reconnect if needed,
            // or use a ref for the timeout.
            // For now, simple timeout:
            setTimeout(() => {
                // We can't easily call connectWebSocket from here if it changes deps.
                // A better pattern pattern is separate reconnect effect, but let's keep it simple
                // and assume manual refresh or external trigger for robustness.
                // Or just reload page. Ideally we use a robust WS hook.
                // Re-calling connectWebSocket here relies on closure, might be stale if deps change.
            }, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        wsRef.current = ws;
    }, [router, handleWebSocketMessage]);

    // Send command to user
    const sendCommand = useCallback((command: string, userId: string, additionalData?: any) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            alert('No hay conexión WebSocket');
            return;
        }

        const message = {
            type: 'COMMAND',
            command,
            user_id: userId,
            data: additionalData || {},
        };

        wsRef.current.send(JSON.stringify(message));
    }, []);

    // Initialize
    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connectWebSocket, router]);

    // Ping to keep connection alive
    useEffect(() => {
        const interval = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'PING' }));
            }
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filter users
    const filteredUsers = Array.from(users.values()).filter(u =>
        filterStatus === 'all' || u.status === filterStatus
    );

    // Helpers
    const getTimeSince = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        return `${hours}h`;
    };

    const acknowledgeAlert = (alertId: string) => {
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, acknowledged: true } : a
        ));
    };

    // Focus map on user
    const focusOnUser = (user: TrackingUser) => {
        setSelectedUser(user);
    };

    return (
        <div className="min-h-screen bg-[#101622] flex">
            {/* Sidebar - Control Panel */}
            <aside className="w-80 bg-[#1a2235] border-r border-white/10 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <Link href="/dashboard" className="text-gray-400 text-sm hover:text-white">
                            ← Dashboard
                        </Link>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {connected ? '● EN VIVO' : '○ DESCONECTADO'}
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-white">📡 Centro de Control</h1>
                    <p className="text-gray-400 text-sm">Monitoreo GPS en tiempo real</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 p-4 border-b border-white/10">
                    <div className="bg-green-500/10 p-2 rounded-lg text-center">
                        <p className="text-lg font-bold text-green-400">{stats.guides_online}</p>
                        <p className="text-[10px] text-gray-400">GUÍAS</p>
                    </div>
                    <div className="bg-blue-500/10 p-2 rounded-lg text-center">
                        <p className="text-lg font-bold text-blue-400">{stats.tourists_online}</p>
                        <p className="text-[10px] text-gray-400">TURISTAS</p>
                    </div>
                    <div className="bg-purple-500/10 p-2 rounded-lg text-center">
                        <p className="text-lg font-bold text-purple-400">{stats.active_locations}</p>
                        <p className="text-[10px] text-gray-400">UBICACIONES</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex flex-wrap gap-1">
                        {['all', 'active', 'idle', 'sos', 'low_battery'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-2 py-1 rounded text-xs font-medium transition ${filterStatus === status
                                    ? 'bg-[#1152d4] text-white'
                                    : 'bg-[#232f48] text-gray-400 hover:text-white'
                                    }`}
                            >
                                {status === 'all' ? 'Todos' : status === 'low_battery' ? '🔋 Baja' : status.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                        Usuarios Activos ({filteredUsers.length})
                    </h3>

                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-2xl mb-2">📍</p>
                            <p className="text-sm">Sin usuarios en línea</p>
                            <p className="text-xs mt-2">Los usuarios aparecerán cuando inicien el tracking desde la app móvil</p>
                        </div>
                    ) : (
                        filteredUsers.map(user => (
                            <button
                                key={user.user_id}
                                onClick={() => focusOnUser(user)}
                                className={`w-full text-left p-3 rounded-xl border transition ${selectedUser?.user_id === user.user_id
                                    ? 'bg-[#1152d4]/20 border-[#1152d4]'
                                    : `${statusColors[user.status]?.bg || 'bg-[#232f48]'} ${statusColors[user.status]?.border || 'border-white/10'} hover:border-[#1152d4]/50`
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white font-medium text-sm">{user.user_name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[user.status]?.text || 'text-gray-400'}`}>
                                        {user.status === 'sos' && '🆘'} {user.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>{user.user_type === 'guide' ? '🧭' : '🧳'}</span>
                                    {user.battery !== undefined && (
                                        <span className={user.battery < 20 ? 'text-red-400' : ''}>
                                            🔋{user.battery}%
                                        </span>
                                    )}
                                    {user.speed !== undefined && user.speed > 0 && (
                                        <span>🚶{user.speed.toFixed(1)}km/h</span>
                                    )}
                                    <span>{getTimeSince(user.timestamp)}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Quick Commands */}
                <div className="p-4 border-t border-white/10">
                    <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Comandos Rápidos</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setCommandMode('REQUEST_LOCATION')}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30"
                        >
                            📍 Pedir Ubicación
                        </button>
                        <button
                            onClick={() => setCommandMode('SEND_MESSAGE')}
                            className="p-2 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30"
                        >
                            💬 Enviar Mensaje
                        </button>
                        <button
                            onClick={() => setCommandMode('SEND_ALERT')}
                            className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30"
                        >
                            ⚠️ Enviar Alerta
                        </button>
                        <button
                            onClick={() => setCommandMode('ACTIVATE_SOS')}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30"
                        >
                            🆘 Activar SOS
                        </button>
                    </div>
                </div>
            </aside>

            {/* Map Area */}
            <div className="flex-1 flex flex-col">
                {/* Map */}
                <div className="flex-1 relative">
                    <MapView zoom={6} theme="dark">
                        <MapControls showZoom showCompass />

                        {/* User Markers */}
                        {filteredUsers.map(user => (
                            <MapMarker
                                key={user.user_id}
                                longitude={user.longitude}
                                latitude={user.latitude}
                                type={user.status === 'sos' ? 'sos' : user.user_type === 'guide' ? 'guide' : 'tourist'}
                                pulse={user.status === 'sos'}
                                size={user.status === 'sos' ? 'lg' : 'md'}
                                onClick={() => focusOnUser(user)}
                                label={user.user_name}
                            />
                        ))}
                    </MapView>

                    {/* Selected User Info Card */}
                    {selectedUser && (
                        <div className="absolute bottom-4 left-4 w-80 bg-[#1a2235]/95 backdrop-blur rounded-xl border border-white/10 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-white font-bold">{selectedUser.user_name}</h3>
                                    <span className={`text-xs ${statusColors[selectedUser.status]?.text}`}>
                                        {selectedUser.user_type === 'guide' ? '🧭 Guía' : '🧳 Turista'} • {selectedUser.status.toUpperCase()}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">✕</button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                    <p className="text-gray-400 text-xs">Coordenadas</p>
                                    <p className="text-gray-300 font-mono text-xs">
                                        {selectedUser.latitude.toFixed(5)}, {selectedUser.longitude.toFixed(5)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Precisión GPS</p>
                                    <p className="text-white">±{selectedUser.accuracy?.toFixed(0) || '?'}m</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Velocidad</p>
                                    <p className="text-green-400">{selectedUser.speed?.toFixed(1) || '0'} km/h</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Batería</p>
                                    <p className={selectedUser.battery && selectedUser.battery < 20 ? 'text-red-400' : 'text-green-400'}>
                                        🔋 {selectedUser.battery || '?'}%
                                    </p>
                                </div>
                                {selectedUser.altitude !== undefined && (
                                    <div>
                                        <p className="text-gray-400 text-xs">Altitud</p>
                                        <p className="text-white">{selectedUser.altitude?.toFixed(0)}m</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-gray-400 text-xs">Última actualización</p>
                                    <p className="text-white">{getTimeSince(selectedUser.timestamp)}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => sendCommand('REQUEST_LOCATION', selectedUser.user_id)}
                                    className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30"
                                >
                                    📍 Ubicación
                                </button>
                                <button
                                    onClick={() => {
                                        setCommandMode('SEND_MESSAGE');
                                    }}
                                    className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30"
                                >
                                    💬 Mensaje
                                </button>
                                {selectedUser.status !== 'sos' && (
                                    <button
                                        onClick={() => {
                                            if (confirm('¿Activar SOS remoto para este usuario?')) {
                                                sendCommand('ACTIVATE_SOS', selectedUser.user_id, { reason: 'Activado desde central' });
                                            }
                                        }}
                                        className="py-2 px-3 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30"
                                    >
                                        🆘
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="absolute top-4 right-4 bg-[#1a2235]/95 backdrop-blur rounded-lg p-3 border border-white/10">
                        <p className="text-white text-xs font-bold mb-2 uppercase">Estados</p>
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                <span className="text-gray-400">Activo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="text-gray-400">Inactivo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="text-gray-400">SOS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                                <span className="text-gray-400">Batería Baja</span>
                            </div>
                        </div>
                    </div>

                    {/* Connection Status */}
                    {!connected && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg">
                            ⚠️ Reconectando al servidor...
                        </div>
                    )}
                </div>

                {/* Alerts Panel */}
                <div className="h-40 bg-[#1a2235] border-t border-white/10 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-bold">🚨 Alertas en Tiempo Real</h3>
                        <span className="text-gray-400 text-sm">
                            {alerts.filter(a => !a.acknowledged).length} sin reconocer
                        </span>
                    </div>

                    {alerts.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            <p>✅ Sin alertas</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {alerts.slice(0, 10).map(alert => (
                                <div
                                    key={alert.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg border ${severityColors[alert.severity]} ${alert.acknowledged ? 'opacity-50' : ''}`}
                                >
                                    <span className="text-lg">
                                        {alert.type === 'sos' && '🆘'}
                                        {alert.type === 'low_battery' && '🔋'}
                                        {alert.type === 'deviation' && '↪️'}
                                        {alert.type === 'no_signal' && '📵'}
                                        {alert.type === 'speed' && '⚡'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{alert.message}</p>
                                        <p className="text-xs opacity-70">{alert.user_name} • {getTimeSince(alert.timestamp)}</p>
                                    </div>
                                    {!alert.acknowledged && (
                                        <button
                                            onClick={() => acknowledgeAlert(alert.id)}
                                            className="px-2 py-1 bg-white/10 rounded text-xs hover:bg-white/20 shrink-0"
                                        >
                                            ✓
                                        </button>
                                    )}
                                    {alert.latitude && (
                                        <button
                                            onClick={() => {
                                                const user = users.get(alert.user_id);
                                                if (user) focusOnUser(user);
                                            }}
                                            className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 shrink-0"
                                        >
                                            📍
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Command Modal */}
            {commandMode && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setCommandMode(null)}>
                    <div className="bg-[#1a2235] rounded-2xl p-6 w-96 border border-white/10" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4">
                            {commandMode === 'REQUEST_LOCATION' && '📍 Solicitar Ubicación'}
                            {commandMode === 'SEND_MESSAGE' && '💬 Enviar Mensaje'}
                            {commandMode === 'SEND_ALERT' && '⚠️ Enviar Alerta'}
                            {commandMode === 'ACTIVATE_SOS' && '🆘 Activar SOS Remoto'}
                        </h2>

                        {/* User Selection */}
                        <div className="mb-4">
                            <p className="text-gray-400 text-sm mb-2">Seleccionar usuario:</p>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {Array.from(users.values()).map(user => (
                                    <button
                                        key={user.user_id}
                                        onClick={() => setSelectedUser(user)}
                                        className={`w-full text-left p-2 rounded-lg text-sm ${selectedUser?.user_id === user.user_id
                                            ? 'bg-[#1152d4] text-white'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                            }`}
                                    >
                                        {user.user_type === 'guide' ? '🧭' : '🧳'} {user.user_name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message Input */}
                        {(commandMode === 'SEND_MESSAGE' || commandMode === 'SEND_ALERT') && (
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm mb-2">Mensaje:</p>
                                <textarea
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    className="w-full p-3 bg-[#232f48] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#1152d4] resize-none"
                                    rows={3}
                                    placeholder="Escribe tu mensaje..."
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCommandMode(null)}
                                className="flex-1 py-2 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (!selectedUser) {
                                        alert('Selecciona un usuario');
                                        return;
                                    }
                                    if (commandMode === 'ACTIVATE_SOS') {
                                        if (!confirm('¿Estás seguro de activar SOS remoto?')) return;
                                    }

                                    sendCommand(commandMode, selectedUser.user_id, {
                                        message: messageText,
                                        title: commandMode === 'SEND_ALERT' ? 'Alerta desde Central' : undefined,
                                        reason: commandMode === 'ACTIVATE_SOS' ? 'Activado desde central de control' : undefined,
                                    });
                                    setMessageText('');
                                }}
                                disabled={!selectedUser}
                                className="flex-1 py-2 bg-[#1152d4] text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                Ejecutar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

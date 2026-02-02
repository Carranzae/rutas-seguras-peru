'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Emergency {
    id: string;
    type: 'SOS' | 'MEDICAL' | 'SECURITY' | 'ACCIDENT';
    status: 'active' | 'responding' | 'resolved';
    priority: 'critical' | 'high' | 'medium';
    user: {
        id: string;
        name: string;
        phone: string;
        role: 'guide' | 'tourist';
    };
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    tour?: {
        id: string;
        name: string;
        agency_id?: string;
        agency_name?: string;
    };
    guide?: {
        id: string;
        name: string;
        phone: string;
    };
    responders?: number;
    created_at: string;
    updated_at: string;
}

export default function EmergenciesPage() {
    const [emergencies, setEmergencies] = useState<Emergency[]>([]);
    const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Load active emergencies
    const loadEmergencies = useCallback(async () => {
        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch('/api/v1/emergencies/active', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setEmergencies(data.items || data);
            }
        } catch (error) {
            console.error('Error loading emergencies:', error);
            // Mock data for demo
            setEmergencies([
                {
                    id: 'EM001',
                    type: 'SOS',
                    status: 'active',
                    priority: 'critical',
                    user: { id: 'U1', name: 'Carlos Mendoza', phone: '+51 987 654 321', role: 'guide' },
                    location: { latitude: -13.516, longitude: -71.978, address: 'Cerca de Machu Picchu' },
                    tour: { id: 'T1', name: 'Machu Picchu Sunrise', agency_name: 'Cusco Adventures' },
                    responders: 2,
                    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Connect to WebSocket for real-time updates
    useEffect(() => {
        loadEmergencies();

        // WebSocket connection for real-time alerts
        const connectWebSocket = () => {
            const token = localStorage.getItem('superadmin_token');
            const wsUrl = `ws://localhost:8000/ws/emergencies?token=${token}`;

            try {
                const ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    console.log('🔴 Emergency WebSocket connected');
                };

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);

                    if (data.type === 'new_emergency') {
                        // New emergency - play alarm
                        playAlarm();
                        setEmergencies(prev => [data.emergency, ...prev]);
                    } else if (data.type === 'emergency_update') {
                        setEmergencies(prev =>
                            prev.map(e => e.id === data.emergency.id ? data.emergency : e)
                        );
                    } else if (data.type === 'emergency_resolved') {
                        setEmergencies(prev => prev.filter(e => e.id !== data.emergency_id));
                    } else if (data.type === 'location_update') {
                        setEmergencies(prev =>
                            prev.map(e => e.id === data.emergency_id
                                ? { ...e, location: data.location }
                                : e
                            )
                        );
                    }
                };

                ws.onclose = () => {
                    console.log('WebSocket disconnected, reconnecting...');
                    setTimeout(connectWebSocket, 3000);
                };

                wsRef.current = ws;
            } catch (error) {
                console.error('WebSocket error:', error);
            }
        };

        connectWebSocket();

        // Poll as backup
        const interval = setInterval(loadEmergencies, 10000);

        return () => {
            wsRef.current?.close();
            clearInterval(interval);
        };
    }, [loadEmergencies]);

    // Play alarm sound
    const playAlarm = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/emergency-alarm.mp3');
        }
        audioRef.current.play().catch(() => console.log('Audio blocked'));

        // Also try browser notification
        if (Notification.permission === 'granted') {
            new Notification('🆘 EMERGENCIA ACTIVA', {
                body: 'Nueva alerta de emergencia recibida',
                icon: '/icons/emergency.png',
            });
        }
    };

    // Request notification permission
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Respond to emergency
    const handleRespond = async (emergencyId: string) => {
        try {
            const token = localStorage.getItem('superadmin_token');
            await fetch(`/api/v1/emergencies/${emergencyId}/respond`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            loadEmergencies();
        } catch (error) {
            console.error('Error responding:', error);
        }
    };

    // Resolve emergency
    const handleResolve = async (emergencyId: string) => {
        if (!confirm('¿Confirmas que la emergencia ha sido resuelta?')) return;

        try {
            const token = localStorage.getItem('superadmin_token');
            await fetch(`/api/v1/emergencies/${emergencyId}/resolve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setEmergencies(prev => prev.filter(e => e.id !== emergencyId));
            setSelectedEmergency(null);
        } catch (error) {
            console.error('Error resolving:', error);
        }
    };

    const getStatusColor = (status: Emergency['status']) => {
        switch (status) {
            case 'active': return 'bg-red-500 animate-pulse';
            case 'responding': return 'bg-yellow-500';
            case 'resolved': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getTimeElapsed = (createdAt: string) => {
        const diff = Date.now() - new Date(createdAt).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0000]">
                <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0000] text-white p-6">
            {/* Alert Banner */}
            {emergencies.filter(e => e.status === 'active').length > 0 && (
                <div className="bg-red-600 text-white p-4 rounded-lg mb-6 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">🆘</span>
                        <div>
                            <p className="font-bold text-lg">
                                {emergencies.filter(e => e.status === 'active').length} EMERGENCIA(S) ACTIVA(S)
                            </p>
                            <p className="text-red-200">Requiere atención inmediata</p>
                        </div>
                    </div>
                    <div className="text-4xl font-mono font-bold">
                        {getTimeElapsed(emergencies[0]?.created_at || new Date().toISOString())}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-red-500 font-mono">
                        🚨 CENTRO DE EMERGENCIAS
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Monitoreo en tiempo real - Alertas SOS
                    </p>
                </div>
                <button
                    onClick={loadEmergencies}
                    className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                    🔄 Actualizar
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Emergency List */}
                <div className="col-span-5 space-y-4">
                    <h2 className="font-mono text-sm text-gray-400 uppercase tracking-wide">
                        Alertas Activas
                    </h2>

                    {emergencies.length === 0 ? (
                        <div className="bg-gray-900/50 rounded-lg p-12 text-center border border-gray-800">
                            <span className="text-5xl">✅</span>
                            <p className="text-gray-400 mt-4">No hay emergencias activas</p>
                        </div>
                    ) : (
                        emergencies.map((emergency) => (
                            <div
                                key={emergency.id}
                                onClick={() => setSelectedEmergency(emergency)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedEmergency?.id === emergency.id
                                        ? 'bg-red-900/40 border-red-500'
                                        : 'bg-gray-900/50 border-gray-800 hover:border-red-500/50'
                                    } ${emergency.status === 'active' ? 'animate-pulse' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-4 h-4 rounded-full ${getStatusColor(emergency.status)}`} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-red-400">{emergency.id}</span>
                                            <span className="px-2 py-0.5 bg-red-900/50 text-red-300 text-xs rounded">
                                                {emergency.type}
                                            </span>
                                        </div>
                                        <p className="font-medium mt-1">{emergency.user.name}</p>
                                        <p className="text-sm text-gray-400">
                                            {emergency.user.role === 'guide' ? '🎯 Guía' : '🧳 Turista'}
                                            {' • '}{emergency.user.phone}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-mono font-bold text-red-400">
                                            {getTimeElapsed(emergency.created_at)}
                                        </p>
                                        <p className="text-xs text-gray-500">transcurrido</p>
                                    </div>
                                </div>
                                {emergency.tour && (
                                    <div className="mt-3 p-2 bg-gray-800/50 rounded text-sm">
                                        <p className="text-gray-300">📍 {emergency.tour.name}</p>
                                        {emergency.tour.agency_name && (
                                            <p className="text-gray-400">🏢 {emergency.tour.agency_name}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Emergency Detail / Map */}
                <div className="col-span-7">
                    {selectedEmergency ? (
                        <div className="bg-gray-900/50 rounded-lg border border-red-500/50 overflow-hidden">
                            {/* Map Placeholder */}
                            <div className="h-64 bg-gray-800 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-6xl">📍</p>
                                        <p className="text-gray-400 mt-2">
                                            {selectedEmergency.location.latitude.toFixed(4)}, {selectedEmergency.location.longitude.toFixed(4)}
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            {selectedEmergency.location.address || 'Ubicación en tiempo real'}
                                        </p>
                                    </div>
                                </div>
                                {/* Live indicator */}
                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                    <span className="text-xs font-bold">LIVE</span>
                                </div>
                            </div>

                            {/* Detail Panel */}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedEmergency.user.name}</h3>
                                        <p className="text-gray-400">
                                            {selectedEmergency.user.role === 'guide' ? '🎯 Guía Turístico' : '🧳 Turista'}
                                        </p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg ${selectedEmergency.status === 'active'
                                            ? 'bg-red-600 animate-pulse'
                                            : 'bg-yellow-600'
                                        }`}>
                                        <p className="font-bold uppercase">
                                            {selectedEmergency.status === 'active' ? '🆘 ACTIVA' : '👥 RESPONDIENDO'}
                                        </p>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <a
                                        href={`tel:${selectedEmergency.user.phone}`}
                                        className="p-4 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-3 transition"
                                    >
                                        <span className="text-2xl">📞</span>
                                        <div>
                                            <p className="font-bold">Llamar</p>
                                            <p className="text-sm text-green-200">{selectedEmergency.user.phone}</p>
                                        </div>
                                    </a>
                                    <a
                                        href={`https://wa.me/${selectedEmergency.user.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        className="p-4 bg-green-700 hover:bg-green-800 rounded-lg flex items-center gap-3 transition"
                                    >
                                        <span className="text-2xl">💬</span>
                                        <div>
                                            <p className="font-bold">WhatsApp</p>
                                            <p className="text-sm text-green-200">Enviar mensaje</p>
                                        </div>
                                    </a>
                                </div>

                                {/* Tour/Agency Info */}
                                {selectedEmergency.tour && (
                                    <div className="p-4 bg-gray-800 rounded-lg mb-6">
                                        <p className="text-sm text-gray-400 mb-2">Información del Tour</p>
                                        <p className="font-medium">{selectedEmergency.tour.name}</p>
                                        {selectedEmergency.tour.agency_name && (
                                            <p className="text-blue-400 mt-1">🏢 {selectedEmergency.tour.agency_name}</p>
                                        )}
                                    </div>
                                )}

                                {/* Responders */}
                                <div className="p-4 bg-gray-800 rounded-lg mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-400">Respondiendo</p>
                                            <p className="text-2xl font-bold">{selectedEmergency.responders || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Tiempo</p>
                                            <p className="text-2xl font-bold text-red-400">
                                                {getTimeElapsed(selectedEmergency.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contacts */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <a href="tel:105" className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-center hover:bg-red-900/50 transition">
                                        <p className="font-bold">105</p>
                                        <p className="text-xs text-gray-400">Policía</p>
                                    </a>
                                    <a href="tel:116" className="p-3 bg-orange-900/30 border border-orange-500/50 rounded-lg text-center hover:bg-orange-900/50 transition">
                                        <p className="font-bold">116</p>
                                        <p className="text-xs text-gray-400">Bomberos</p>
                                    </a>
                                    <a href="tel:106" className="p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg text-center hover:bg-blue-900/50 transition">
                                        <p className="font-bold">106</p>
                                        <p className="text-xs text-gray-400">SAMU</p>
                                    </a>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    {selectedEmergency.status === 'active' && (
                                        <button
                                            onClick={() => handleRespond(selectedEmergency.id)}
                                            className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold transition"
                                        >
                                            👥 Marcar como Respondiendo
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleResolve(selectedEmergency.id)}
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition"
                                    >
                                        ✅ Resolver Emergencia
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-12 text-center h-full flex flex-col items-center justify-center">
                            <div className="text-6xl mb-4">👈</div>
                            <p className="text-gray-400">Selecciona una emergencia para ver detalles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

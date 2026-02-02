'use client';

import { adminService, Emergency } from '@/lib/admin';
import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CrisisPage() {
    const router = useRouter();
    const [emergencies, setEmergencies] = useState<Emergency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeCount, setActiveCount] = useState(0);

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        loadEmergencies();

        // Auto-refresh every 30 seconds for real-time monitoring
        const interval = setInterval(loadEmergencies, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadEmergencies = async () => {
        try {
            const response = await adminService.getActiveEmergencies();
            setEmergencies(response.items || []);
            setActiveCount(response.active_count || 0);
            setError(null);
        } catch (err: any) {
            console.error('Error loading emergencies:', err);
            setError(err.message || 'Error al cargar emergencias');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id: string) => {
        if (!confirm('¿Confirmas que vas a responder a esta emergencia?')) return;

        setProcessingId(id);
        try {
            await adminService.updateEmergency(id, 'responding', 'Equipo de respuesta notificado');
            await loadEmergencies();
            alert('🚨 Equipo de respuesta notificado');
        } catch (err: any) {
            alert('Error al actualizar emergencia: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleResolve = async (id: string) => {
        const notes = prompt('Notas de resolución (opcional):');
        if (notes === null) return; // User cancelled

        setProcessingId(id);
        try {
            await adminService.resolveEmergency(id, notes || 'Resuelto por super admin');
            await loadEmergencies();
            alert('✅ Emergencia marcada como resuelta');
        } catch (err: any) {
            alert('Error al resolver emergencia: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const callNumber = (phone: string) => {
        window.open(`tel:${phone}`, '_blank');
    };

    const severityColors: Record<string, string> = {
        critical: 'bg-red-500',
        high: 'bg-orange-500',
        medium: 'bg-yellow-500',
        low: 'bg-blue-500',
    };

    const typeIcons: Record<string, string> = {
        sos: '🆘',
        medical: '🏥',
        accident: '⚠️',
        lost: '🔍',
    };

    const getTimeSince = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `Hace ${mins} min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `Hace ${hours}h`;
        const days = Math.floor(hours / 24);
        return `Hace ${days}d`;
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c]">
            <header className="bg-[#101622] border-b border-white/10 px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white">← Volver</Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">🆘 Centro de Crisis</h1>
                            <p className="text-gray-400 text-sm">Gestión de emergencias en tiempo real</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={loadEmergencies}
                            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                        >
                            🔄 Actualizar
                        </button>
                        <span className={`px-4 py-2 rounded-full ${activeCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'} text-white font-bold`}>
                            {activeCount} Activas
                        </span>
                    </div>
                </div>
            </header>

            <div className="p-8">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                        <p className="text-3xl font-bold text-red-400">
                            {emergencies.filter(e => e.status === 'active').length}
                        </p>
                        <p className="text-gray-400 text-sm">Emergencias Activas</p>
                    </div>
                    <div className="bg-orange-500/20 rounded-xl p-4 border border-orange-500/30">
                        <p className="text-3xl font-bold text-orange-400">
                            {emergencies.filter(e => e.status === 'responding').length}
                        </p>
                        <p className="text-gray-400 text-sm">En Respuesta</p>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                        <p className="text-3xl font-bold text-green-400">
                            {emergencies.filter(e => e.status === 'resolved').length}
                        </p>
                        <p className="text-gray-400 text-sm">Resueltas</p>
                    </div>
                    <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                        <p className="text-3xl font-bold text-blue-400">{emergencies.length}</p>
                        <p className="text-gray-400 text-sm">Total</p>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
                        ⚠️ {error}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Cargando emergencias...</p>
                    </div>
                ) : emergencies.length === 0 ? (
                    <div className="text-center py-12 bg-[#1a2235] rounded-2xl border border-white/10">
                        <p className="text-4xl mb-4">✅</p>
                        <p className="text-green-400 text-xl font-bold">Sin emergencias activas</p>
                        <p className="text-gray-400 mt-2">Todos los tours están operando normalmente</p>
                    </div>
                ) : (
                    /* Emergency List */
                    <div className="space-y-4">
                        {emergencies.map(emergency => (
                            <div
                                key={emergency.id}
                                className={`bg-[#1a2235] rounded-2xl p-6 border ${emergency.status === 'active'
                                    ? 'border-red-500/50 animate-pulse'
                                    : emergency.status === 'responding'
                                        ? 'border-orange-500/30'
                                        : 'border-green-500/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-4xl">🆘</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-white">
                                                    EMERGENCIA - #{emergency.id.slice(0, 8)}
                                                </h3>
                                                <span className={`px-2 py-1 ${severityColors[emergency.severity] || 'bg-red-500'} text-white text-xs rounded-full`}>
                                                    {emergency.severity?.toUpperCase() || 'CRITICAL'}
                                                </span>
                                            </div>
                                            <p className="text-gray-400">
                                                📍 {emergency.location ?
                                                    `${emergency.location.coordinates[1].toFixed(4)}, ${emergency.location.coordinates[0].toFixed(4)}`
                                                    : 'Ubicación desconocida'}
                                            </p>
                                            {emergency.description && (
                                                <p className="text-gray-300 mt-1">{emergency.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full font-bold ${emergency.status === 'active' ? 'bg-red-500 text-white' :
                                        emergency.status === 'responding' ? 'bg-orange-500 text-white' :
                                            'bg-green-500 text-white'
                                        }`}>
                                        {emergency.status === 'active' ? '🔴 ACTIVA' :
                                            emergency.status === 'responding' ? '🟠 RESPONDIENDO' : '🟢 RESUELTA'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {emergency.triggered_by && (
                                        <div className="p-4 bg-white/5 rounded-xl">
                                            <p className="text-gray-400 text-sm mb-1">Reportado por</p>
                                            <p className="text-white font-medium">{emergency.triggered_by.full_name}</p>
                                            <button
                                                onClick={() => callNumber(emergency.triggered_by!.phone)}
                                                className="text-blue-400 hover:text-blue-300 text-sm mt-1"
                                            >
                                                📞 {emergency.triggered_by.phone}
                                            </button>
                                        </div>
                                    )}
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <p className="text-gray-400 text-sm mb-1">Tiempo</p>
                                        <p className="text-white font-medium">{getTimeSince(emergency.created_at)}</p>
                                    </div>
                                    {emergency.battery_level !== undefined && (
                                        <div className="p-4 bg-white/5 rounded-xl">
                                            <p className="text-gray-400 text-sm mb-1">Batería</p>
                                            <p className={`font-medium ${emergency.battery_level < 20 ? 'text-red-400' : 'text-green-400'}`}>
                                                🔋 {emergency.battery_level}%
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {emergency.responder_notes && (
                                    <div className="p-4 bg-yellow-500/10 rounded-xl mb-4 border border-yellow-500/20">
                                        <p className="text-yellow-400 text-sm">📝 Notas: {emergency.responder_notes}</p>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    {emergency.status === 'active' && (
                                        <button
                                            onClick={() => handleRespond(emergency.id)}
                                            disabled={processingId === emergency.id}
                                            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {processingId === emergency.id ? '⏳ Procesando...' : '🚨 Responder'}
                                        </button>
                                    )}
                                    {emergency.status !== 'resolved' && (
                                        <button
                                            onClick={() => handleResolve(emergency.id)}
                                            disabled={processingId === emergency.id}
                                            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {processingId === emergency.id ? '⏳ Procesando...' : '✅ Marcar Resuelta'}
                                        </button>
                                    )}
                                    <Link
                                        href={`/tracking${emergency.tour_id ? `?tour=${emergency.tour_id}` : ''}`}
                                        className="px-6 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 flex items-center justify-center"
                                    >
                                        🗺️ Ver en Mapa
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Protocolos de Emergencia */}
                <div className="mt-8 bg-[#1a2235] rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">📋 Protocolos de Emergencia</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <p className="text-red-400 font-bold mb-2">🆘 SOS Crítico</p>
                            <ol className="text-gray-400 text-sm space-y-1">
                                <li>1. Contactar guía inmediatamente</li>
                                <li>2. Notificar a PNP local</li>
                                <li>3. Activar equipo de rescate</li>
                                <li>4. Informar a embajada si turista extranjero</li>
                            </ol>
                        </div>
                        <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                            <p className="text-orange-400 font-bold mb-2">🏥 Emergencia Médica</p>
                            <ol className="text-gray-400 text-sm space-y-1">
                                <li>1. Llamar SAMU (106)</li>
                                <li>2. Contactar seguro de viaje</li>
                                <li>3. Coordinar evacuación si necesario</li>
                                <li>4. Notificar a familiar de contacto</li>
                            </ol>
                        </div>
                        <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                            <p className="text-yellow-400 font-bold mb-2">🔍 Turista Perdido</p>
                            <ol className="text-gray-400 text-sm space-y-1">
                                <li>1. Verificar última ubicación GPS</li>
                                <li>2. Contactar guía y grupo</li>
                                <li>3. Notificar a PNP si no aparece en 30 min</li>
                                <li>4. Activar búsqueda coordinada</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Contactos de Emergencia */}
                <div className="mt-6 bg-[#1a2235] rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">📞 Líneas de Emergencia Perú</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <button onClick={() => callNumber('105')} className="p-4 bg-red-500/20 rounded-xl text-center hover:bg-red-500/30">
                            <p className="text-2xl mb-1">🚔</p>
                            <p className="text-white font-bold">PNP</p>
                            <p className="text-red-400">105</p>
                        </button>
                        <button onClick={() => callNumber('116')} className="p-4 bg-orange-500/20 rounded-xl text-center hover:bg-orange-500/30">
                            <p className="text-2xl mb-1">🚒</p>
                            <p className="text-white font-bold">Bomberos</p>
                            <p className="text-orange-400">116</p>
                        </button>
                        <button onClick={() => callNumber('106')} className="p-4 bg-green-500/20 rounded-xl text-center hover:bg-green-500/30">
                            <p className="text-2xl mb-1">🏥</p>
                            <p className="text-white font-bold">SAMU</p>
                            <p className="text-green-400">106</p>
                        </button>
                        <button onClick={() => callNumber('0800-44040')} className="p-4 bg-blue-500/20 rounded-xl text-center hover:bg-blue-500/30">
                            <p className="text-2xl mb-1">🚁</p>
                            <p className="text-white font-bold">INDECI</p>
                            <p className="text-blue-400">0800-44040</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
